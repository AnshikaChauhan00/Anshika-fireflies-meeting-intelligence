"""Seeds the SQLite database with a demo user and 7 realistic meetings.

Run with:  python -m app.seed.seed
Re-running wipes and re-inserts all data, so the database is always in a
known-good demo state.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.database.session import Base, SessionLocal, engine
from app.models.action_item import ActionItem, ActionItemStatus
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.models.speaker import Speaker
from app.models.summary import Summary
from app.models.tag import Tag
from app.models.topic import Topic
from app.models.transcript_comment import TranscriptComment
from app.models.transcript_segment import TranscriptSegment
from app.models.user import User
from app.seed.seed_data import MEETINGS, OWNER_NAME, PEOPLE, _avatar


def _build_segments(dialogue: list[tuple[str, str]], total_duration_seconds: float) -> list[dict]:
    """Converts (speaker, text) pairs into contiguous timed segments that
    span the full, realistic meeting duration. Each segment's length is
    weighted by its word count (longer lines take proportionally more
    time), then scaled so the segments exactly cover the whole meeting,
    including natural pauses between speakers, gaps, and silences that a
    real recording would have.
    """
    word_counts = [max(1, len(text.split())) for _, text in dialogue]
    total_words = sum(word_counts)
    min_seg = 3.0

    raw_durations = [max(min_seg, total_duration_seconds * wc / total_words) for wc in word_counts]
    scale = total_duration_seconds / sum(raw_durations)

    segments = []
    cursor = 0.0
    for (speaker, text), raw in zip(dialogue, raw_durations):
        duration = raw * scale
        start = round(cursor, 1)
        end = round(start + duration, 1)
        segments.append({"speaker": speaker, "start": start, "end": end, "text": text})
        cursor = end
    return segments


def seed() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user_lookup: dict[str, User] = {}
        for name, info in PEOPLE.items():
            user = User(name=name, email=info["email"], avatar_url=_avatar(name))
            db.add(user)
            user_lookup[name] = user
        db.flush()

        owner = user_lookup[OWNER_NAME]
        tag_lookup: dict[str, Tag] = {}
        now = datetime.now(timezone.utc)

        for seed_meeting in MEETINGS:
            duration_seconds = seed_meeting.duration_minutes * 60
            segments = _build_segments(seed_meeting.dialogue, duration_seconds)
            meeting_date = (now - timedelta(days=seed_meeting.days_ago)).replace(
                hour=10, minute=0, second=0, microsecond=0
            )

            meeting = Meeting(
                title=seed_meeting.title,
                description=seed_meeting.description,
                meeting_date=meeting_date,
                duration_seconds=duration_seconds,
                owner_id=owner.id,
            )
            db.add(meeting)
            db.flush()

            for participant_name in seed_meeting.participants:
                info = PEOPLE[participant_name]
                meeting.participants.append(
                    Participant(
                        name=participant_name,
                        email=info["email"],
                        avatar_url=_avatar(participant_name),
                        role=info["role"],
                    )
                )

            for tag_name in seed_meeting.tags:
                if tag_name not in tag_lookup:
                    tag = Tag(name=tag_name)
                    db.add(tag)
                    db.flush()
                    tag_lookup[tag_name] = tag
                meeting.tags.append(tag_lookup[tag_name])
            db.flush()

            speaker_lookup: dict[str, Speaker] = {}
            db_segments: list[TranscriptSegment] = []
            for index, seg in enumerate(segments):
                if seg["speaker"] not in speaker_lookup:
                    speaker = Speaker(meeting_id=meeting.id, name=seg["speaker"])
                    db.add(speaker)
                    db.flush()
                    speaker_lookup[seg["speaker"]] = speaker
                db_segments.append(
                    TranscriptSegment(
                        meeting_id=meeting.id,
                        speaker_id=speaker_lookup[seg["speaker"]].id,
                        start_time=seg["start"],
                        end_time=seg["end"],
                        text=seg["text"],
                        sequence_number=index,
                    )
                )
            db.add_all(db_segments)
            db.flush()

            for comment in seed_meeting.comments:
                db.add(
                    TranscriptComment(
                        meeting_id=meeting.id,
                        segment_id=db_segments[comment.segment_index].id,
                        author_id=owner.id,
                        text=comment.text,
                    )
                )

            db.add(Summary(meeting_id=meeting.id, overview=seed_meeting.overview))

            for topic in seed_meeting.topics:
                start_segment = segments[topic.start_index]
                next_index = topic.start_index
                # find the segment index that starts the NEXT topic (or end of dialogue)
                topic_positions = sorted(t.start_index for t in seed_meeting.topics)
                pos_in_list = topic_positions.index(topic.start_index)
                end_segment = (
                    segments[topic_positions[pos_in_list + 1] - 1]
                    if pos_in_list + 1 < len(topic_positions)
                    else segments[-1]
                )
                db.add(
                    Topic(
                        meeting_id=meeting.id,
                        title=topic.title,
                        start_time=start_segment["start"],
                        end_time=end_segment["end"],
                    )
                )

            for action_item in seed_meeting.action_items:
                db.add(
                    ActionItem(
                        meeting_id=meeting.id,
                        title=action_item.title,
                        assignee=action_item.assignee,
                        due_date=(meeting_date + timedelta(days=action_item.due_offset_days)).date(),
                        status=ActionItemStatus(action_item.status),
                    )
                )

        db.commit()
        print(f"Seeded {len(MEETINGS)} meetings and {len(PEOPLE)} users successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
