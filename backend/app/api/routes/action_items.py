from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.action_item import ActionItemRead, ActionItemUpdate
from app.services.action_item_service import ActionItemService
from app.utils.exceptions import NotFoundError

router = APIRouter(prefix="/api/action-items", tags=["action-items"])


@router.put("/{action_item_id}", response_model=ActionItemRead)
def update_action_item(
    action_item_id: int, payload: ActionItemUpdate, db: Session = Depends(get_db)
) -> ActionItemRead:
    service = ActionItemService(db)
    try:
        return service.update(action_item_id, payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{action_item_id}/complete", response_model=ActionItemRead)
def complete_action_item(action_item_id: int, db: Session = Depends(get_db)) -> ActionItemRead:
    service = ActionItemService(db)
    try:
        return service.mark_complete(action_item_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{action_item_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_action_item(action_item_id: int, db: Session = Depends(get_db)) -> None:
    service = ActionItemService(db)
    try:
        service.delete(action_item_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
