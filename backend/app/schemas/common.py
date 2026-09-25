from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator


def _ensure_utc(value: datetime) -> datetime:
    """SQLite drops timezone info, so datetimes come back naive but are always UTC.

    Marking them as UTC makes the API emit '...Z', which browsers convert to the
    viewer's local time correctly (a naive string is wrongly parsed as local time).
    """
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


UTCDateTime = Annotated[datetime, AfterValidator(_ensure_utc)]
