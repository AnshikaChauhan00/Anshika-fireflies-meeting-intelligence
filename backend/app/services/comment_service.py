from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.transcript_comment import TranscriptComment
from app.repositories.comment_repository import CommentRepository
from app.repositories.meeting_repository import MeetingRepository
from app.schemas.comment import CommentCreate, CommentRead, CommentUpdate
from app.utils.exceptions import NotFoundError, ValidationFailedError


def to_comment_read(comment: TranscriptComment) -> CommentRead:
    return CommentRead(
        id=comment.id,
        meeting_id=comment.meeting_id,
        segment_id=comment.segment_id,
        author_name=comment.author.name,
        text=comment.text,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


class CommentService:
    def __init__(self, db: Session) -> None:
        self.repo = CommentRepository(db)
        self.meetings = MeetingRepository(db)

    def list_for_meeting(self, meeting_id: int) -> list[CommentRead]:
        self._require_meeting(meeting_id)
        return [to_comment_read(c) for c in self.repo.list_for_meeting(meeting_id)]

    def create(self, meeting_id: int, author_id: int, payload: CommentCreate) -> CommentRead:
        self._require_meeting(meeting_id)
        if not self.repo.segment_belongs_to_meeting(payload.segment_id, meeting_id):
            raise ValidationFailedError("That transcript line does not belong to this meeting.")

        comment = TranscriptComment(
            meeting_id=meeting_id,
            segment_id=payload.segment_id,
            author_id=author_id,
            text=payload.text,
        )
        return to_comment_read(self.repo.create(comment))

    def update(self, comment_id: int, payload: CommentUpdate) -> CommentRead:
        comment = self._get_or_raise(comment_id)
        comment.text = payload.text
        return to_comment_read(self.repo.update(comment))

    def delete(self, comment_id: int) -> None:
        self.repo.delete(self._get_or_raise(comment_id))

    def _require_meeting(self, meeting_id: int) -> None:
        if self.meetings.get_by_id(meeting_id) is None:
            raise NotFoundError(f"Meeting {meeting_id} not found")

    def _get_or_raise(self, comment_id: int) -> TranscriptComment:
        comment = self.repo.get_by_id(comment_id)
        if comment is None:
            raise NotFoundError(f"Comment {comment_id} not found")
        return comment
