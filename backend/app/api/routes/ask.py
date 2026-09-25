from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.ask import AskRequest, AskResponse
from app.services.ask_service import AskService
from app.services.qa_service import BaseQuestionAnswerService, get_qa_service

router = APIRouter(tags=["ask"])


@router.post("/api/meetings/{meeting_id}/ask", response_model=AskResponse)
def ask_about_meeting(
    meeting_id: int,
    payload: AskRequest,
    db: Session = Depends(get_db),
    qa_service: BaseQuestionAnswerService = Depends(get_qa_service),
) -> AskResponse:
    return AskService(db, qa_service).ask(meeting_id, payload.question)
