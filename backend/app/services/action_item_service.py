from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.action_item import ActionItem, ActionItemStatus
from app.repositories.action_item_repository import ActionItemRepository
from app.schemas.action_item import ActionItemCreate, ActionItemUpdate
from app.utils.exceptions import NotFoundError


class ActionItemService:
    def __init__(self, db: Session) -> None:
        self.repo = ActionItemRepository(db)

    def list_for_meeting(self, meeting_id: int) -> list[ActionItem]:
        return self.repo.list_for_meeting(meeting_id)

    def create(self, meeting_id: int, payload: ActionItemCreate) -> ActionItem:
        item = ActionItem(
            meeting_id=meeting_id,
            title=payload.title.strip(),
            description=payload.description,
            assignee=payload.assignee,
            due_date=payload.due_date,
            status=payload.status,
        )
        return self.repo.create(item)

    def update(self, action_item_id: int, payload: ActionItemUpdate) -> ActionItem:
        item = self._get_or_raise(action_item_id)
        if payload.title is not None:
            item.title = payload.title.strip()
        if payload.description is not None:
            item.description = payload.description
        if payload.assignee is not None:
            item.assignee = payload.assignee
        if payload.due_date is not None:
            item.due_date = payload.due_date
        if payload.status is not None:
            item.status = payload.status
        return self.repo.update(item)

    def mark_complete(self, action_item_id: int) -> ActionItem:
        item = self._get_or_raise(action_item_id)
        item.status = ActionItemStatus.COMPLETED
        return self.repo.update(item)

    def delete(self, action_item_id: int) -> None:
        item = self._get_or_raise(action_item_id)
        self.repo.delete(item)

    def _get_or_raise(self, action_item_id: int) -> ActionItem:
        item = self.repo.get_by_id(action_item_id)
        if item is None:
            raise NotFoundError(f"Action item {action_item_id} not found")
        return item
