from pydantic import BaseModel


class MeetingSearchHit(BaseModel):
    id: int
    title: str
    meeting_date: str


class TranscriptSearchHit(BaseModel):
    meeting_id: int
    meeting_title: str
    segment_id: int
    speaker_name: str
    start_time: float
    text: str


class ActionItemSearchHit(BaseModel):
    meeting_id: int
    meeting_title: str
    action_item_id: int
    title: str
    status: str


class GlobalSearchResponse(BaseModel):
    meetings: list[MeetingSearchHit]
    transcript_matches: list[TranscriptSearchHit]
    action_items: list[ActionItemSearchHit]
