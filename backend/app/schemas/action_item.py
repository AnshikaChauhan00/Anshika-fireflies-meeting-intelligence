from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.models.action_item import ActionItemStatus
from app.schemas.common import UTCDateTime


class ActionItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    assignee: str | None = Field(default=None, max_length=120)
    due_date: date | None = None
    status: ActionItemStatus = ActionItemStatus.TODO


class ActionItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    assignee: str | None = Field(default=None, max_length=120)
    due_date: date | None = None
    status: ActionItemStatus | None = None


class ActionItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    title: str
    description: str | None = None
    assignee: str | None = None
    due_date: date | None = None
    status: ActionItemStatus
    created_at: UTCDateTime
    updated_at: UTCDateTime
