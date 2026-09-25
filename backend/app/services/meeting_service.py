from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.action_item import ActionItem
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.models.summary import Summary
from app.models.topic import Topic
from app.repositories.meeting_repository import MeetingRepository
from app.schemas.meeting import MeetingCreate, MeetingUpdate
from app.services.summary_service import get_summary_service
from app.services.transcript_service import TranscriptService
from app.utils.exceptions import NotFoundError


class MeetingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = MeetingRepository(db)
        self.transcript_service = TranscriptService(db)

    def list_meetings(
        self,
        *,
        search: str | None,
        participant: str | None,
        tag: str | None,
        sort: str,
        page: int,
        page_size: int,
    ) -> tuple[list[Meeting], int]:
        return self.repo.list(
            search=search,
            participant=participant,
            tag=tag,
            sort=sort,
            page=page,
            page_size=page_size,
        )

    def get_meeting(self, meeting_id: int) -> Meeting:
        meeting = self.repo.get_by_id(meeting_id)
        if meeting is None:
            raise NotFoundError(f"Meeting {meeting_id} not found")
        return meeting

    def create_meeting(self, payload: MeetingCreate, owner_id: int) -> Meeting:
        meeting = Meeting(
            title=payload.title.strip(),
            description=payload.description,
            meeting_date=payload.meeting_date,
            duration_seconds=payload.duration_seconds,
            owner_id=owner_id,
        )
        meeting.participants = [
            Participant(
                name=p.name.strip(),
                email=p.email,
                avatar_url=p.avatar_url,
                role=p.role,
            )
            for p in payload.participants
        ]
        meeting.tags = [self.repo.get_or_create_tag(name.strip()) for name in payload.tags if name.strip()]

        meeting = self.repo.create(meeting)

        parsed_segments = self.transcript_service.parse_input(
            transcript_format=payload.transcript_format,
            content=payload.transcript_content,
            segments=payload.transcript_segments,
        )

        if parsed_segments:
            self.transcript_service.replace_segments(meeting.id, parsed_segments)
            inferred_duration = int(max(s.end_time for s in parsed_segments))
            if not meeting.duration_seconds:
                meeting.duration_seconds = inferred_duration

            summary_service = get_summary_service()
            generated = summary_service.generate(meeting.title, parsed_segments)

            self.db.add(Summary(meeting_id=meeting.id, overview=generated.overview))
            for topic in generated.topics:
                self.db.add(
                    Topic(
                        meeting_id=meeting.id,
                        title=topic.title,
                        start_time=topic.start_time,
                        end_time=topic.end_time,
                    )
                )
            for item in generated.action_items:
                self.db.add(
                    ActionItem(
                        meeting_id=meeting.id,
                        title=item.title,
                        assignee=item.assignee,
                    )
                )
            self.db.commit()

        return self.repo.get_by_id(meeting.id)

    def update_meeting(self, meeting_id: int, payload: MeetingUpdate) -> Meeting:
        meeting = self.get_meeting(meeting_id)

        if payload.title is not None:
            meeting.title = payload.title.strip()
        if payload.description is not None:
            meeting.description = payload.description
        if payload.meeting_date is not None:
            meeting.meeting_date = payload.meeting_date
        if payload.duration_seconds is not None:
            meeting.duration_seconds = payload.duration_seconds
        if payload.participants is not None:
            meeting.participants = [
                Participant(name=p.name.strip(), email=p.email, avatar_url=p.avatar_url, role=p.role)
                for p in payload.participants
            ]
        if payload.tags is not None:
            meeting.tags = [self.repo.get_or_create_tag(name.strip()) for name in payload.tags if name.strip()]

        return self.repo.update(meeting)

    def delete_meeting(self, meeting_id: int) -> None:
        meeting = self.get_meeting(meeting_id)
        self.repo.delete(meeting)
