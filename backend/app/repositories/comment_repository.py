from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.transcript_comment import TranscriptComment
from app.models.transcript_segment import TranscriptSegment


class CommentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, comment_id: int) -> TranscriptComment | None:
        return self.db.get(TranscriptComment, comment_id)

    def list_for_meeting(self, meeting_id: int) -> list[TranscriptComment]:
        stmt = (
            select(TranscriptComment)
            .options(joinedload(TranscriptComment.author))
            .where(TranscriptComment.meeting_id == meeting_id)
            .order_by(TranscriptComment.created_at.asc(), TranscriptComment.id.asc())
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def segment_belongs_to_meeting(self, segment_id: int, meeting_id: int) -> bool:
        stmt = select(TranscriptSegment.id).where(
            TranscriptSegment.id == segment_id, TranscriptSegment.meeting_id == meeting_id
        )
        return self.db.execute(stmt).first() is not None

    def create(self, comment: TranscriptComment) -> TranscriptComment:
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def update(self, comment: TranscriptComment) -> TranscriptComment:
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def delete(self, comment: TranscriptComment) -> None:
        self.db.delete(comment)
        self.db.commit()
