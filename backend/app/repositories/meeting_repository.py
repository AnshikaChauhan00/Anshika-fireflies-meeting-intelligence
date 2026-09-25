from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.meeting import Meeting
from app.models.participant import Participant
from app.models.tag import Tag


class MeetingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, meeting_id: int) -> Meeting | None:
        stmt = (
            select(Meeting)
            .options(joinedload(Meeting.participants), joinedload(Meeting.tags))
            .where(Meeting.id == meeting_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def list(
        self,
        *,
        search: str | None = None,
        participant: str | None = None,
        tag: str | None = None,
        sort: str = "recent",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Meeting], int]:
        stmt = select(Meeting).options(
            joinedload(Meeting.participants), joinedload(Meeting.tags)
        )

        if search:
            like = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Meeting.title).like(like),
                    func.lower(Meeting.description).like(like),
                )
            )

        if participant:
            stmt = stmt.join(Participant).where(
                func.lower(Participant.name).like(f"%{participant.lower()}%")
            )

        if tag:
            stmt = stmt.join(Meeting.tags).where(func.lower(Tag.name) == tag.lower())

        if sort == "oldest":
            stmt = stmt.order_by(Meeting.meeting_date.asc())
        elif sort == "duration":
            stmt = stmt.order_by(Meeting.duration_seconds.desc())
        else:  # "recent" default
            stmt = stmt.order_by(Meeting.meeting_date.desc())

        count_stmt = select(func.count()).select_from(stmt.with_only_columns(Meeting.id).distinct().subquery())
        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.distinct().offset((page - 1) * page_size).limit(page_size)
        meetings = list(self.db.execute(stmt).unique().scalars().all())
        return meetings, total

    def create(self, meeting: Meeting) -> Meeting:
        self.db.add(meeting)
        self.db.commit()
        self.db.refresh(meeting)
        return meeting

    def update(self, meeting: Meeting) -> Meeting:
        self.db.commit()
        self.db.refresh(meeting)
        return meeting

    def delete(self, meeting: Meeting) -> None:
        self.db.delete(meeting)
        self.db.commit()

    def get_or_create_tag(self, name: str) -> Tag:
        stmt = select(Tag).where(func.lower(Tag.name) == name.lower())
        tag = self.db.execute(stmt).scalar_one_or_none()
        if tag is None:
            tag = Tag(name=name)
            self.db.add(tag)
            self.db.flush()
        return tag
