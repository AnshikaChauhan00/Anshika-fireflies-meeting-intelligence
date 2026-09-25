from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.transcript_segment import TranscriptSegment
from app.repositories.transcript_repository import TranscriptRepository
from app.schemas.transcript import TranscriptSegmentCreate
from app.services.transcript_parser import ParsedSegment, parse_transcript


class TranscriptService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = TranscriptRepository(db)

    def get_segments(self, meeting_id: int) -> list[TranscriptSegment]:
        return self.repo.list_for_meeting(meeting_id)

    def parse_input(
        self,
        *,
        transcript_format: str | None,
        content: str | None,
        segments: list[TranscriptSegmentCreate] | None,
    ) -> list[ParsedSegment]:
        """Normalizes either a raw text payload (txt/vtt/json) or an already
        structured list of segments into ParsedSegment objects.
        """
        if segments:
            return [
                ParsedSegment(s.speaker, s.start_time, s.end_time, s.text) for s in segments
            ]
        if transcript_format and content:
            return parse_transcript(transcript_format, content)
        return []

    def replace_segments(self, meeting_id: int, parsed: list[ParsedSegment]) -> list[TranscriptSegment]:
        self.repo.clear_for_meeting(meeting_id)
        speaker_cache: dict = {}
        db_segments: list[TranscriptSegment] = []

        for index, seg in enumerate(sorted(parsed, key=lambda s: s.start_time)):
            speaker = self.repo.get_or_create_speaker(meeting_id, seg.speaker, speaker_cache)
            db_segments.append(
                TranscriptSegment(
                    meeting_id=meeting_id,
                    speaker_id=speaker.id,
                    start_time=seg.start_time,
                    end_time=seg.end_time,
                    text=seg.text,
                    sequence_number=index,
                )
            )

        self.repo.bulk_add(db_segments)
        return self.repo.list_for_meeting(meeting_id)
