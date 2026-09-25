from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Speaker(Base):
    __tablename__ = "speakers"
    __table_args__ = (Index("ix_speakers_meeting_id", "meeting_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    participant_id: Mapped[int | None] = mapped_column(
        ForeignKey("participants.id"), nullable=True
    )

    meeting: Mapped["Meeting"] = relationship(back_populates="speakers")
    segments: Mapped[list["TranscriptSegment"]] = relationship(back_populates="speaker")
