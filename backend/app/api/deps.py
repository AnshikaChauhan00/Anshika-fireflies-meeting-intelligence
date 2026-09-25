"""Shared FastAPI dependencies.

Authentication is out of scope for this project (see README > Assumptions).
`get_current_user` always resolves to the single seeded demo user so every
meeting has a consistent owner, mirroring how the UI shows one signed-in
profile.
"""
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User

DEMO_USER_EMAIL = "anshika.chauhan@meetingnotes.app"


def get_current_user(db: Session = Depends(get_db)) -> User:
    user = db.execute(select(User).where(User.email == DEMO_USER_EMAIL)).scalar_one_or_none()
    if user is None:
        user = db.execute(select(User)).scalars().first()
    if user is None:
        raise RuntimeError("No seeded user found. Run the seed script before starting the API.")
    return user
