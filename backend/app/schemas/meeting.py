from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import UTCDateTime
from app.schemas.participant import ParticipantCreate, ParticipantRead
from app.schemas.tag import TagRead
from app.schemas.transcript import TranscriptSegmentCreate


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    meeting_date: datetime
    duration_seconds: int = Field(default=0, ge=0)
    participants: list[ParticipantCreate] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    transcript_format: str | None = Field(default=None, pattern="^(txt|vtt|json)$")
    transcript_content: str | None = None
    transcript_segments: list[TranscriptSegmentCreate] | None = None


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    meeting_date: datetime | None = None
    duration_seconds: int | None = Field(default=None, ge=0)
    participants: list[ParticipantCreate] | None = None
    tags: list[str] | None = None


class MeetingSummaryCard(BaseModel):
    """Lightweight shape used for the meeting library / list view."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None = None
    meeting_date: UTCDateTime
    duration_seconds: int
    participants: list[ParticipantRead]
    tags: list[TagRead]
    action_item_count: int = 0


class MeetingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None = None
    meeting_date: UTCDateTime
    duration_seconds: int
    created_at: UTCDateTime
    updated_at: UTCDateTime
    owner_id: int
    participants: list[ParticipantRead]
    tags: list[TagRead]


class MeetingListResponse(BaseModel):
    items: list[MeetingSummaryCard]
    total: int
    page: int
    page_size: int
