"""Reusable parser that normalizes TXT, VTT and JSON transcript formats into
a common list of (speaker, start_time, end_time, text) segments.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass

from app.utils.exceptions import ValidationFailedError

_TXT_HEADER_RE = re.compile(r"^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*$")
_VTT_TIME_RE = re.compile(
    r"(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})"
)
_VTT_SPEAKER_RE = re.compile(r"^([^:]{1,60}):\s*(.*)$")


@dataclass
class ParsedSegment:
    speaker: str
    start_time: float
    end_time: float
    text: str


def _timestamp_to_seconds(value: str) -> float:
    parts = value.split(":")
    parts = [float(p) for p in parts]
    if len(parts) == 2:
        minutes, seconds = parts
        return minutes * 60 + seconds
    if len(parts) == 3:
        hours, minutes, seconds = parts
        return hours * 3600 + minutes * 60 + seconds
    raise ValidationFailedError(f"Unrecognized timestamp format: {value}")


def parse_txt(content: str) -> list[ParsedSegment]:
    """Parses the '[mm:ss] Speaker:\\ntext' block format.

    Example:
        [00:00] Ankit:
        Good morning everyone.

        [00:07] Rahul:
        Good morning.
    """
    lines = content.splitlines()
    segments: list[ParsedSegment] = []
    current_speaker: str | None = None
    current_start: float | None = None
    current_text_lines: list[str] = []

    def flush(next_start: float | None) -> None:
        if current_speaker is None or current_start is None:
            return
        text = " ".join(t.strip() for t in current_text_lines if t.strip())
        if not text:
            return
        end = next_start if next_start is not None else current_start + max(3.0, len(text) / 12)
        segments.append(ParsedSegment(current_speaker, current_start, end, text))

    for raw_line in lines:
        line = raw_line.rstrip()
        header = _TXT_HEADER_RE.match(line.strip())
        if header:
            flush(_timestamp_to_seconds(header.group(1)))
            current_start = _timestamp_to_seconds(header.group(1))
            current_speaker = header.group(2).strip()
            current_text_lines = []
        elif line.strip():
            current_text_lines.append(line.strip())

    flush(None)

    if not segments:
        raise ValidationFailedError(
            "No transcript segments could be parsed from the TXT content. "
            "Expected format: '[mm:ss] Speaker:' followed by the spoken text."
        )
    return segments


def parse_vtt(content: str) -> list[ParsedSegment]:
    """Parses a WebVTT-like transcript where each cue is 'Speaker: text'."""
    blocks = re.split(r"\n\s*\n", content.strip())
    segments: list[ParsedSegment] = []

    for block in blocks:
        lines = [line for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        if lines[0].strip().upper() == "WEBVTT":
            lines = lines[1:]
        if not lines:
            continue

        time_line_index = 0
        if not _VTT_TIME_RE.search(lines[0]) and len(lines) > 1:
            time_line_index = 1

        time_match = _VTT_TIME_RE.search(lines[time_line_index]) if lines else None
        if not time_match:
            continue

        h1, m1, s1, ms1, h2, m2, s2, ms2 = (int(g) for g in time_match.groups())
        start = h1 * 3600 + m1 * 60 + s1 + ms1 / 1000
        end = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000

        text_lines = lines[time_line_index + 1 :]
        raw_text = " ".join(text_lines).strip()
        if not raw_text:
            continue

        speaker_match = _VTT_SPEAKER_RE.match(raw_text)
        if speaker_match:
            speaker, text = speaker_match.group(1).strip(), speaker_match.group(2).strip()
        else:
            speaker, text = "Unknown Speaker", raw_text

        if text:
            segments.append(ParsedSegment(speaker, start, end, text))

    if not segments:
        raise ValidationFailedError(
            "No transcript segments could be parsed from the VTT content."
        )
    return segments


def parse_json(content: str) -> list[ParsedSegment]:
    """Parses a JSON array of {speaker, start, end, text} objects."""
    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValidationFailedError(f"Invalid JSON transcript: {exc}") from exc

    if not isinstance(data, list) or not data:
        raise ValidationFailedError("JSON transcript must be a non-empty array of segments.")

    segments: list[ParsedSegment] = []
    for index, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValidationFailedError(f"Segment at index {index} must be an object.")
        try:
            speaker = str(item["speaker"]).strip()
            start = float(item["start"])
            end = float(item.get("end", start))
            text = str(item["text"]).strip()
        except (KeyError, TypeError, ValueError) as exc:
            raise ValidationFailedError(
                f"Segment at index {index} is missing required fields "
                "(speaker, start, text)."
            ) from exc
        if not speaker or not text:
            raise ValidationFailedError(f"Segment at index {index} has an empty speaker or text.")
        segments.append(ParsedSegment(speaker, start, max(end, start), text))

    return segments


def parse_transcript(transcript_format: str, content: str) -> list[ParsedSegment]:
    parsers = {"txt": parse_txt, "vtt": parse_vtt, "json": parse_json}
    parser = parsers.get(transcript_format)
    if parser is None:
        raise ValidationFailedError(f"Unsupported transcript format: {transcript_format}")
    return parser(content)
