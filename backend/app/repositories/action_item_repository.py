from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.action_item import ActionItem


class ActionItemRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, action_item_id: int) -> ActionItem | None:
        return self.db.get(ActionItem, action_item_id)

    def list_for_meeting(self, meeting_id: int) -> list[ActionItem]:
        stmt = (
            select(ActionItem)
            .where(ActionItem.meeting_id == meeting_id)
            .order_by(ActionItem.created_at.asc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(self, action_item: ActionItem) -> ActionItem:
        self.db.add(action_item)
        self.db.commit()
        self.db.refresh(action_item)
        return action_item

    def update(self, action_item: ActionItem) -> ActionItem:
        self.db.commit()
        self.db.refresh(action_item)
        return action_item

    def delete(self, action_item: ActionItem) -> None:
        self.db.delete(action_item)
        self.db.commit()
