from datetime import datetime, timezone

from sqlalchemy import ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class TranscriptComment(Base):
    """A user comment attached to one transcript segment."""

    __tablename__ = "transcript_comments"
    __table_args__ = (
        Index("ix_transcript_comments_meeting_id", "meeting_id"),
        Index("ix_transcript_comments_segment_id", "segment_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    segment_id: Mapped[int] = mapped_column(ForeignKey("transcript_segments.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    meeting: Mapped["Meeting"] = relationship(back_populates="comments")
    segment: Mapped["TranscriptSegment"] = relationship(back_populates="comments")
    author: Mapped["User"] = relationship()
