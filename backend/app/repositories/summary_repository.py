from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.summary import Summary
from app.models.topic import Topic


class SummaryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_for_meeting(self, meeting_id: int) -> Summary | None:
        stmt = select(Summary).where(Summary.meeting_id == meeting_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_topics(self, meeting_id: int) -> list[Topic]:
        stmt = select(Topic).where(Topic.meeting_id == meeting_id).order_by(Topic.start_time.asc())
        return list(self.db.execute(stmt).scalars().all())
