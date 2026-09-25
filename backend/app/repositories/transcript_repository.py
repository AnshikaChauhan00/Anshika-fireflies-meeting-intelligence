from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.speaker import Speaker
from app.models.transcript_segment import TranscriptSegment


class TranscriptRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_meeting(self, meeting_id: int) -> list[TranscriptSegment]:
        stmt = (
            select(TranscriptSegment)
            .options(joinedload(TranscriptSegment.speaker))
            .where(TranscriptSegment.meeting_id == meeting_id)
            .order_by(TranscriptSegment.sequence_number.asc())
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def clear_for_meeting(self, meeting_id: int) -> None:
        stmt = select(TranscriptSegment).where(TranscriptSegment.meeting_id == meeting_id)
        for segment in self.db.execute(stmt).scalars().all():
            self.db.delete(segment)
        speaker_stmt = select(Speaker).where(Speaker.meeting_id == meeting_id)
        for speaker in self.db.execute(speaker_stmt).scalars().all():
            self.db.delete(speaker)
        self.db.flush()

    def get_or_create_speaker(self, meeting_id: int, name: str, cache: dict[str, Speaker]) -> Speaker:
        if name in cache:
            return cache[name]
        stmt = select(Speaker).where(Speaker.meeting_id == meeting_id, Speaker.name == name)
        speaker = self.db.execute(stmt).scalar_one_or_none()
        if speaker is None:
            speaker = Speaker(meeting_id=meeting_id, name=name)
            self.db.add(speaker)
            self.db.flush()
        cache[name] = speaker
        return speaker

    def bulk_add(self, segments: list[TranscriptSegment]) -> None:
        self.db.add_all(segments)
        self.db.commit()
