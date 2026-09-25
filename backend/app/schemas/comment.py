from pydantic import BaseModel, Field, field_validator

from app.schemas.common import UTCDateTime

MAX_COMMENT_LENGTH = 1000


def _clean_text(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Comment text cannot be empty.")
    return cleaned


class CommentCreate(BaseModel):
    segment_id: int
    text: str = Field(max_length=MAX_COMMENT_LENGTH)

    _validate_text = field_validator("text")(_clean_text)


class CommentUpdate(BaseModel):
    text: str = Field(max_length=MAX_COMMENT_LENGTH)

    _validate_text = field_validator("text")(_clean_text)


class CommentRead(BaseModel):
    id: int
    meeting_id: int
    segment_id: int
    author_name: str
    text: str
    created_at: UTCDateTime
    updated_at: UTCDateTime
