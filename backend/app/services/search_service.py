from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.search_repository import SearchRepository
from app.schemas.search import (
    ActionItemSearchHit,
    GlobalSearchResponse,
    MeetingSearchHit,
    TranscriptSearchHit,
)


class SearchService:
    def __init__(self, db: Session) -> None:
        self.repo = SearchRepository(db)

    def search(self, query: str) -> GlobalSearchResponse:
        query = query.strip()
        if not query:
            return GlobalSearchResponse(meetings=[], transcript_matches=[], action_items=[])

        meetings = [
            MeetingSearchHit(id=m.id, title=m.title, meeting_date=m.meeting_date.isoformat())
            for m in self.repo.search_meetings(query)
        ]
        transcript_matches = [
            TranscriptSearchHit(
                meeting_id=s.meeting_id,
                meeting_title=s.meeting.title,
                segment_id=s.id,
                speaker_name=s.speaker.name if s.speaker else "Unknown",
                start_time=s.start_time,
                text=s.text,
            )
            for s in self.repo.search_transcript_segments(query)
        ]
        action_items = [
            ActionItemSearchHit(
                meeting_id=a.meeting_id,
                meeting_title=a.meeting.title,
                action_item_id=a.id,
                title=a.title,
                status=a.status.value,
            )
            for a in self.repo.search_action_items(query)
        ]

        return GlobalSearchResponse(
            meetings=meetings, transcript_matches=transcript_matches, action_items=action_items
        )
