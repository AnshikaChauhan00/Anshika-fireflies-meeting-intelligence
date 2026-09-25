from pydantic import BaseModel, ConfigDict

from app.schemas.common import UTCDateTime


class TopicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None = None
    start_time: float
    end_time: float | None = None


class SummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    overview: str
    created_at: UTCDateTime
    updated_at: UTCDateTime
