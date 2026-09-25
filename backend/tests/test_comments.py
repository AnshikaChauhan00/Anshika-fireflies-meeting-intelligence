def _create_meeting(client, title="Comment Test Meeting"):
    payload = {
        "title": title,
        "meeting_date": "2026-09-20T10:00:00Z",
        "participants": [],
        "tags": [],
        "transcript_segments": [
            {"speaker": "Anshika Chauhan", "start_time": 0, "end_time": 5, "text": "Let's discuss the deadline."},
            {"speaker": "Rahul Verma", "start_time": 5, "end_time": 10, "text": "I will finalize the estimate."},
        ],
    }
    meeting = client.post("/api/meetings", json=payload).json()
    segments = client.get(f"/api/meetings/{meeting['id']}/transcript").json()
    return meeting, segments


def test_create_and_list_comment(client):
    meeting, segments = _create_meeting(client)
    response = client.post(
        f"/api/meetings/{meeting['id']}/comments",
        json={"segment_id": segments[0]["id"], "text": "  Confirm this with legal.  "},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["text"] == "Confirm this with legal."
    assert data["author_name"] == "Anshika Chauhan"
    assert data["segment_id"] == segments[0]["id"]

    listed = client.get(f"/api/meetings/{meeting['id']}/comments").json()
    assert [c["id"] for c in listed] == [data["id"]]


def test_update_comment(client):
    meeting, segments = _create_meeting(client)
    created = client.post(
        f"/api/meetings/{meeting['id']}/comments", json={"segment_id": segments[0]["id"], "text": "First"}
    ).json()

    response = client.put(f"/api/comments/{created['id']}", json={"text": "Edited"})
    assert response.status_code == 200
    assert response.json()["text"] == "Edited"


def test_delete_comment(client):
    meeting, segments = _create_meeting(client)
    created = client.post(
        f"/api/meetings/{meeting['id']}/comments", json={"segment_id": segments[1]["id"], "text": "Temp"}
    ).json()

    assert client.delete(f"/api/comments/{created['id']}").status_code == 204
    assert client.get(f"/api/meetings/{meeting['id']}/comments").json() == []
    assert client.delete(f"/api/comments/{created['id']}").status_code == 404


def test_comment_on_unknown_meeting_or_comment_is_404(client):
    assert client.get("/api/meetings/9999/comments").status_code == 404
    assert client.post("/api/meetings/9999/comments", json={"segment_id": 1, "text": "x"}).status_code == 404
    assert client.put("/api/comments/9999", json={"text": "x"}).status_code == 404


def test_comment_on_segment_from_another_meeting_is_rejected(client):
    meeting_a, _ = _create_meeting(client, "Meeting A")
    _, segments_b = _create_meeting(client, "Meeting B")

    response = client.post(
        f"/api/meetings/{meeting_a['id']}/comments",
        json={"segment_id": segments_b[0]["id"], "text": "Wrong meeting"},
    )
    assert response.status_code == 422


def test_comment_text_validation(client):
    meeting, segments = _create_meeting(client)
    url = f"/api/meetings/{meeting['id']}/comments"
    segment_id = segments[0]["id"]

    assert client.post(url, json={"segment_id": segment_id, "text": "   "}).status_code == 422
    assert client.post(url, json={"segment_id": segment_id, "text": "x" * 1001}).status_code == 422
    assert client.post(url, json={"segment_id": segment_id, "text": "x" * 1000}).status_code == 201


def test_deleting_meeting_removes_its_comments(client):
    meeting, segments = _create_meeting(client)
    created = client.post(
        f"/api/meetings/{meeting['id']}/comments", json={"segment_id": segments[0]["id"], "text": "Gone soon"}
    ).json()

    assert client.delete(f"/api/meetings/{meeting['id']}").status_code == 204
    assert client.put(f"/api/comments/{created['id']}", json={"text": "still there?"}).status_code == 404


def test_replacing_transcript_removes_stale_comments(client):
    meeting, segments = _create_meeting(client)
    client.post(
        f"/api/meetings/{meeting['id']}/comments", json={"segment_id": segments[0]["id"], "text": "On old line"}
    )

    replaced = client.post(
        f"/api/meetings/{meeting['id']}/transcript",
        json={"format": "json", "content": '[{"speaker": "Ankit", "start": 0, "end": 4, "text": "New transcript"}]'},
    )
    assert replaced.status_code == 200
    assert client.get(f"/api/meetings/{meeting['id']}/comments").json() == []


def test_comment_timestamps_are_utc(client):
    meeting, segments = _create_meeting(client)
    created = client.post(
        f"/api/meetings/{meeting['id']}/comments", json={"segment_id": segments[0]["id"], "text": "Timestamp check"}
    ).json()
    assert created["created_at"].endswith("Z")
    assert created["updated_at"].endswith("Z")
