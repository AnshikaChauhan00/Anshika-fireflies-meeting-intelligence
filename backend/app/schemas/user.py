from pydantic import BaseModel, ConfigDict

from app.schemas.common import UTCDateTime


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    avatar_url: str | None = None
    created_at: UTCDateTime
