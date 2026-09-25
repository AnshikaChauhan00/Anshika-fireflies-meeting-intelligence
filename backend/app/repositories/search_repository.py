from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.action_item import ActionItem
from app.models.meeting import Meeting
from app.models.transcript_segment import TranscriptSegment


class SearchRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def search_meetings(self, query: str, limit: int = 10) -> list[Meeting]:
        like = f"%{query.lower()}%"
        stmt = (
            select(Meeting)
            .where(func.lower(Meeting.title).like(like))
            .order_by(Meeting.meeting_date.desc())
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def search_transcript_segments(self, query: str, limit: int = 15) -> list[TranscriptSegment]:
        like = f"%{query.lower()}%"
        stmt = (
            select(TranscriptSegment)
            .options(joinedload(TranscriptSegment.meeting), joinedload(TranscriptSegment.speaker))
            .where(func.lower(TranscriptSegment.text).like(like))
            .limit(limit)
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def search_action_items(self, query: str, limit: int = 10) -> list[ActionItem]:
        like = f"%{query.lower()}%"
        stmt = (
            select(ActionItem)
            .options(joinedload(ActionItem.meeting))
            .where(
                or_(
                    func.lower(ActionItem.title).like(like),
                    func.lower(ActionItem.description).like(like),
                )
            )
            .limit(limit)
        )
        return list(self.db.execute(stmt).unique().scalars().all())
