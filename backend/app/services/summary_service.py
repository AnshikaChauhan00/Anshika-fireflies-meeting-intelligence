"""Summary generation abstraction.

MockSummaryService derives a deterministic overview, topic outline and
action item suggestions directly from transcript text using simple
heuristics (keyword frequency, actionable-language detection, and
time-bucketing). It requires no external API and is the default.

LLMSummaryService is an optional extension point: if `GROQ_API_KEY` is set,
it could call an external LLM to produce richer summaries. The app never
depends on it being configured.
"""
from __future__ import annotations

import re
from abc import ABC, abstractmethod
from collections import Counter
from dataclasses import dataclass, field

from app.config import get_settings
from app.services.transcript_parser import ParsedSegment
from app.utils.text import STOPWORDS as _STOPWORDS

_ACTION_PATTERNS = re.compile(
    r"\b(will|should|need to|needs to|let's|lets|action item|todo|"
    r"follow up|by (friday|monday|tuesday|wednesday|thursday|saturday|sunday|"
    r"next week|end of week|eod|tomorrow)|make sure|schedule|prepare|finalize|send over)\b",
    re.IGNORECASE,
)


@dataclass
class GeneratedActionItem:
    title: str
    assignee: str | None = None


@dataclass
class GeneratedTopic:
    title: str
    start_time: float
    end_time: float | None = None


@dataclass
class GeneratedSummary:
    overview: str
    topics: list[GeneratedTopic] = field(default_factory=list)
    action_items: list[GeneratedActionItem] = field(default_factory=list)


class BaseSummaryService(ABC):
    @abstractmethod
    def generate(self, meeting_title: str, segments: list[ParsedSegment]) -> GeneratedSummary:
        raise NotImplementedError


class MockSummaryService(BaseSummaryService):
    """Deterministic, rule-based summary generator. No external calls."""

    def generate(self, meeting_title: str, segments: list[ParsedSegment]) -> GeneratedSummary:
        if not segments:
            return GeneratedSummary(overview=f"No transcript content was provided for '{meeting_title}'.")

        overview = self._build_overview(meeting_title, segments)
        topics = self._build_topics(segments)
        action_items = self._build_action_items(segments)
        return GeneratedSummary(overview=overview, topics=topics, action_items=action_items)

    def _keywords(self, text: str, top_n: int = 5) -> list[str]:
        words = re.findall(r"[a-zA-Z']+", text.lower())
        significant = [w for w in words if w not in _STOPWORDS and len(w) > 3]
        counts = Counter(significant)
        return [word for word, _ in counts.most_common(top_n)]

    def _build_overview(self, meeting_title: str, segments: list[ParsedSegment]) -> str:
        full_text = " ".join(s.text for s in segments)
        speakers = sorted({s.speaker for s in segments})
        keywords = self._keywords(full_text, top_n=4)
        duration_minutes = max(1, round((segments[-1].end_time) / 60))

        topic_phrase = ", ".join(keywords) if keywords else "a range of topics"
        speaker_phrase = ", ".join(speakers[:-1]) + (" and " + speakers[-1] if len(speakers) > 1 else speakers[0])

        return (
            f"In this {duration_minutes}-minute discussion, {speaker_phrase} covered {topic_phrase}. "
            f"The conversation included {len(segments)} exchanges and touched on the key points "
            f"summarized below in Key Topics and Action Items."
        )

    def _build_topics(self, segments: list[ParsedSegment]) -> list[GeneratedTopic]:
        total_duration = segments[-1].end_time or 1
        bucket_count = min(4, max(1, len(segments) // 5 or 1))
        bucket_size = total_duration / bucket_count
        topics: list[GeneratedTopic] = []

        for i in range(bucket_count):
            bucket_start = i * bucket_size
            bucket_end = (i + 1) * bucket_size
            bucket_segments = [s for s in segments if bucket_start <= s.start_time < bucket_end]
            if not bucket_segments:
                continue
            bucket_text = " ".join(s.text for s in bucket_segments)
            keywords = self._keywords(bucket_text, top_n=3)
            label = " & ".join(w.capitalize() for w in keywords) if keywords else f"Discussion Segment {i + 1}"
            topics.append(
                GeneratedTopic(
                    title=label,
                    start_time=bucket_segments[0].start_time,
                    end_time=bucket_segments[-1].end_time,
                )
            )

        if not topics:
            topics.append(GeneratedTopic(title="General Discussion", start_time=0, end_time=total_duration))
        return topics

    def _build_action_items(self, segments: list[ParsedSegment]) -> list[GeneratedActionItem]:
        items: list[GeneratedActionItem] = []
        seen_titles: set[str] = set()

        for segment in segments:
            for sentence in re.split(r"(?<=[.!?])\s+", segment.text):
                if not _ACTION_PATTERNS.search(sentence):
                    continue
                cleaned = sentence.strip()
                if len(cleaned) < 8 or len(cleaned) > 180:
                    continue
                normalized = cleaned.lower()
                if normalized in seen_titles:
                    continue
                seen_titles.add(normalized)
                items.append(GeneratedActionItem(title=cleaned, assignee=segment.speaker))
                if len(items) >= 6:
                    return items
        return items


class LLMSummaryService(BaseSummaryService):
    """Optional LLM-backed summary service.

    Only used when GROQ_API_KEY is configured. Falls back to the mock
    service's heuristics so the app never hard-fails without a key.
    """

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._fallback = MockSummaryService()

    def generate(self, meeting_title: str, segments: list[ParsedSegment]) -> GeneratedSummary:
        # Intentionally not calling an external API in this project: the
        # assignment requires the app to work fully without one. This class
        # exists as the extension seam described in the README.
        return self._fallback.generate(meeting_title, segments)


def get_summary_service() -> BaseSummaryService:
    settings = get_settings()
    if settings.groq_api_key:
        return LLMSummaryService(settings.groq_api_key)
    return MockSummaryService()
