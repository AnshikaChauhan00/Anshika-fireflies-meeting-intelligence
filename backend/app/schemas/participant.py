from pydantic import BaseModel, ConfigDict, Field


class ParticipantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str | None = Field(default=None, max_length=255)
    avatar_url: str | None = None
    role: str | None = Field(default=None, max_length=80)


class ParticipantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str | None = None
    avatar_url: str | None = None
    role: str | None = None
