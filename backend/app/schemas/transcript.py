from pydantic import BaseModel, ConfigDict, Field


class TranscriptSegmentCreate(BaseModel):
    speaker: str = Field(min_length=1, max_length=120)
    start_time: float = Field(ge=0)
    end_time: float = Field(ge=0)
    text: str = Field(min_length=1)


class TranscriptSegmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    speaker_name: str
    start_time: float
    end_time: float
    text: str
    sequence_number: int


class TranscriptUploadRequest(BaseModel):
    """Raw transcript payload: either free text (txt/vtt) or structured JSON segments."""

    format: str = Field(pattern="^(txt|vtt|json)$")
    content: str | None = None
    segments: list[TranscriptSegmentCreate] | None = None
