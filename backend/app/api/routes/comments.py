from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentRead, CommentUpdate
from app.services.comment_service import CommentService

router = APIRouter(tags=["comments"])


@router.get("/api/meetings/{meeting_id}/comments", response_model=list[CommentRead])
def list_comments(meeting_id: int, db: Session = Depends(get_db)) -> list[CommentRead]:
    return CommentService(db).list_for_meeting(meeting_id)


@router.post(
    "/api/meetings/{meeting_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    meeting_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentRead:
    return CommentService(db).create(meeting_id, current_user.id, payload)


@router.put("/api/comments/{comment_id}", response_model=CommentRead)
def update_comment(comment_id: int, payload: CommentUpdate, db: Session = Depends(get_db)) -> CommentRead:
    return CommentService(db).update(comment_id, payload)


@router.delete("/api/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_comment(comment_id: int, db: Session = Depends(get_db)) -> None:
    CommentService(db).delete(comment_id)
