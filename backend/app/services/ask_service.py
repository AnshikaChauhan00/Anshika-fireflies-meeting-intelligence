from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.action_item_repository import ActionItemRepository
from app.repositories.meeting_repository import MeetingRepository
from app.repositories.summary_repository import SummaryRepository
from app.repositories.transcript_repository import TranscriptRepository
from app.schemas.ask import AskResponse, AskSource
from app.services.qa_service import (
    Answer,
    BaseQuestionAnswerService,
    MeetingContext,
    QAActionItem,
    QASegment,
    QATopic,
)
from app.utils.exceptions import NotFoundError

NO_TRANSCRIPT_MESSAGE = (
    "This meeting has no transcript yet, so there's nothing to answer from. "
    "Add a transcript first, then ask again."
)


class AskService:
    """Loads a meeting's data and delegates the actual answering to a QA service."""

    def __init__(self, db: Session, qa_service: BaseQuestionAnswerService) -> None:
        self.meetings = MeetingRepository(db)
        self.transcripts = TranscriptRepository(db)
        self.summaries = SummaryRepository(db)
        self.action_items = ActionItemRepository(db)
        self.qa_service = qa_service

    def ask(self, meeting_id: int, question: str) -> AskResponse:
        context = self._load_context(meeting_id)
        if not context.segments:
            return self._to_response(Answer(text=NO_TRANSCRIPT_MESSAGE))
        return self._to_response(self.qa_service.answer(question, context))

    def _load_context(self, meeting_id: int) -> MeetingContext:
        meeting = self.meetings.get_by_id(meeting_id)
        if meeting is None:
            raise NotFoundError(f"Meeting {meeting_id} not found")

        summary = self.summaries.get_for_meeting(meeting_id)
        return MeetingContext(
            title=meeting.title,
            summary=summary.overview if summary else None,
            segments=[
                QASegment(
                    id=s.id,
                    speaker=s.speaker.name if s.speaker else "Unknown Speaker",
                    start_time=s.start_time,
                    end_time=s.end_time,
                    text=s.text,
                )
                for s in self.transcripts.list_for_meeting(meeting_id)
            ],
            topics=[QATopic(title=t.title, start_time=t.start_time) for t in self.summaries.list_topics(meeting_id)],
            action_items=[
                QAActionItem(
                    title=a.title,
                    assignee=a.assignee,
                    status=a.status.value,
                    due_date=a.due_date.isoformat() if a.due_date else None,
                )
                for a in self.action_items.list_for_meeting(meeting_id)
            ],
        )

    @staticmethod
    def _to_response(answer: Answer) -> AskResponse:
        return AskResponse(
            answer=answer.text,
            mode=answer.mode,  # type: ignore[arg-type]
            model=answer.model,
            notice=answer.notice,
            sources=[
                AskSource(
                    segment_id=s.id, speaker_name=s.speaker, start_time=s.start_time, text=s.text
                )
                for s in answer.sources
            ],
        )
