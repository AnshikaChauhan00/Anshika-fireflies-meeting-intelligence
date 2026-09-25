from typing import Literal

from pydantic import BaseModel, Field, field_validator

MAX_QUESTION_LENGTH = 500


class AskRequest(BaseModel):
    question: str = Field(max_length=MAX_QUESTION_LENGTH)

    @field_validator("question")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Question cannot be empty.")
        return cleaned


class AskSource(BaseModel):
    segment_id: int
    speaker_name: str
    start_time: float
    text: str


class AskResponse(BaseModel):
    answer: str
    mode: Literal["llm", "keyword"]
    model: str | None = None
    notice: str | None = None
    sources: list[AskSource]
