from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.summary import Summary
from app.models.topic import Topic
from app.models.transcript_segment import TranscriptSegment
from app.models.user import User
from app.schemas.action_item import ActionItemCreate, ActionItemRead
from app.schemas.meeting import (
    MeetingCreate,
    MeetingListResponse,
    MeetingRead,
    MeetingSummaryCard,
    MeetingUpdate,
)
from app.schemas.summary import SummaryRead, TopicRead
from app.schemas.transcript import TranscriptSegmentRead, TranscriptUploadRequest
from app.services.action_item_service import ActionItemService
from app.services.meeting_service import MeetingService
from app.services.summary_service import get_summary_service
from app.services.transcript_service import TranscriptService
from app.utils.exceptions import NotFoundError, ValidationFailedError

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def _to_segment_read(segment: TranscriptSegment) -> TranscriptSegmentRead:
    return TranscriptSegmentRead(
        id=segment.id,
        speaker_name=segment.speaker.name if segment.speaker else "Unknown Speaker",
        start_time=segment.start_time,
        end_time=segment.end_time,
        text=segment.text,
        sequence_number=segment.sequence_number,
    )


@router.get("", response_model=MeetingListResponse)
def list_meetings(
    search: str | None = Query(default=None, description="Search by title/description"),
    participant: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    sort: str = Query(default="recent", pattern="^(recent|oldest|duration)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> MeetingListResponse:
    service = MeetingService(db)
    meetings, total = service.list_meetings(
        search=search, participant=participant, tag=tag, sort=sort, page=page, page_size=page_size
    )
    items = [
        MeetingSummaryCard(
            id=m.id,
            title=m.title,
            description=m.description,
            meeting_date=m.meeting_date,
            duration_seconds=m.duration_seconds,
            participants=m.participants,
            tags=m.tags,
            action_item_count=len(m.action_items),
        )
        for m in meetings
    ]
    return MeetingListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{meeting_id}", response_model=MeetingRead)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)) -> MeetingRead:
    service = MeetingService(db)
    try:
        return service.get_meeting(meeting_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("", response_model=MeetingRead, status_code=status.HTTP_201_CREATED)
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MeetingRead:
    service = MeetingService(db)
    try:
        return service.create_meeting(payload, owner_id=current_user.id)
    except ValidationFailedError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.put("/{meeting_id}", response_model=MeetingRead)
def update_meeting(meeting_id: int, payload: MeetingUpdate, db: Session = Depends(get_db)) -> MeetingRead:
    service = MeetingService(db)
    try:
        return service.update_meeting(meeting_id, payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)) -> None:
    service = MeetingService(db)
    try:
        service.delete_meeting(meeting_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{meeting_id}/transcript", response_model=list[TranscriptSegmentRead])
def get_transcript(meeting_id: int, db: Session = Depends(get_db)) -> list[TranscriptSegmentRead]:
    meeting_service = MeetingService(db)
    try:
        meeting_service.get_meeting(meeting_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    transcript_service = TranscriptService(db)
    segments = transcript_service.get_segments(meeting_id)
    return [_to_segment_read(s) for s in segments]


@router.post("/{meeting_id}/transcript", response_model=list[TranscriptSegmentRead])
def upload_transcript(
    meeting_id: int, payload: TranscriptUploadRequest, db: Session = Depends(get_db)
) -> list[TranscriptSegmentRead]:
    meeting_service = MeetingService(db)
    try:
        meeting = meeting_service.get_meeting(meeting_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    transcript_service = TranscriptService(db)
    try:
        parsed = transcript_service.parse_input(
            transcript_format=payload.format, content=payload.content, segments=payload.segments
        )
        if not parsed:
            raise ValidationFailedError("No transcript content or segments were provided.")
        segments = transcript_service.replace_segments(meeting_id, parsed)
    except ValidationFailedError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    inferred_duration = int(max(s.end_time for s in parsed))
    if inferred_duration > meeting.duration_seconds:
        meeting.duration_seconds = inferred_duration
        db.commit()

    # Regenerate summary/topics/action-items to stay in sync with the new transcript.
    db.query(Summary).filter(Summary.meeting_id == meeting_id).delete()
    db.query(Topic).filter(Topic.meeting_id == meeting_id).delete()
    summary_service = get_summary_service()
    generated = summary_service.generate(meeting.title, parsed)
    db.add(Summary(meeting_id=meeting_id, overview=generated.overview))
    for topic in generated.topics:
        db.add(Topic(meeting_id=meeting_id, title=topic.title, start_time=topic.start_time, end_time=topic.end_time))
    db.commit()

    return [_to_segment_read(s) for s in segments]


@router.get("/{meeting_id}/summary", response_model=SummaryRead)
def get_summary(meeting_id: int, db: Session = Depends(get_db)) -> SummaryRead:
    summary = db.query(Summary).filter(Summary.meeting_id == meeting_id).one_or_none()
    if summary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No summary available for this meeting.")
    return summary


@router.get("/{meeting_id}/topics", response_model=list[TopicRead])
def get_topics(meeting_id: int, db: Session = Depends(get_db)) -> list[TopicRead]:
    topics = db.query(Topic).filter(Topic.meeting_id == meeting_id).order_by(Topic.start_time.asc()).all()
    return topics


@router.get("/{meeting_id}/action-items", response_model=list[ActionItemRead])
def list_action_items(meeting_id: int, db: Session = Depends(get_db)) -> list[ActionItemRead]:
    service = ActionItemService(db)
    return service.list_for_meeting(meeting_id)


@router.post("/{meeting_id}/action-items", response_model=ActionItemRead, status_code=status.HTTP_201_CREATED)
def create_action_item(
    meeting_id: int, payload: ActionItemCreate, db: Session = Depends(get_db)
) -> ActionItemRead:
    meeting_service = MeetingService(db)
    try:
        meeting_service.get_meeting(meeting_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    service = ActionItemService(db)
    return service.create(meeting_id, payload)
