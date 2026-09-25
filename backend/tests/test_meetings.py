def _create_sample_meeting(client, title="Test Meeting"):
    payload = {
        "title": title,
        "description": "A meeting created in a test.",
        "meeting_date": "2026-09-20T10:00:00Z",
        "duration_seconds": 0,
        "participants": [{"name": "Anshika Chauhan"}, {"name": "Rahul Verma"}],
        "tags": ["test"],
        "transcript_format": "json",
        "transcript_content": None,
        "transcript_segments": [
            {"speaker": "Anshika Chauhan", "start_time": 0, "end_time": 5, "text": "Let's discuss the deadline for this project."},
            {"speaker": "Rahul Verma", "start_time": 5, "end_time": 10, "text": "I will finalize the estimate by Friday."},
        ],
    }
    return client.post("/api/meetings", json=payload)


def test_create_meeting(client):
    response = _create_sample_meeting(client)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Meeting"
    assert len(data["participants"]) == 2


def test_get_meeting(client):
    created = _create_sample_meeting(client).json()
    response = client.get(f"/api/meetings/{created['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_meeting_not_found(client):
    response = client.get("/api/meetings/9999")
    assert response.status_code == 404


def test_update_meeting(client):
    created = _create_sample_meeting(client).json()
    response = client.put(f"/api/meetings/{created['id']}", json={"title": "Updated Title"})
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


def test_delete_meeting(client):
    created = _create_sample_meeting(client).json()
    response = client.delete(f"/api/meetings/{created['id']}")
    assert response.status_code == 204
    follow_up = client.get(f"/api/meetings/{created['id']}")
    assert follow_up.status_code == 404


def test_transcript_generated_from_segments(client):
    created = _create_sample_meeting(client).json()
    response = client.get(f"/api/meetings/{created['id']}/transcript")
    assert response.status_code == 200
    segments = response.json()
    assert len(segments) == 2
    assert segments[0]["speaker_name"] == "Anshika Chauhan"


def test_summary_and_action_items_auto_generated(client):
    created = _create_sample_meeting(client).json()

    summary_response = client.get(f"/api/meetings/{created['id']}/summary")
    assert summary_response.status_code == 200
    assert "overview" in summary_response.json()

    action_items_response = client.get(f"/api/meetings/{created['id']}/action-items")
    assert action_items_response.status_code == 200
    # The mock summary service should detect actionable language like
    # "will finalize the estimate by Friday".
    assert len(action_items_response.json()) >= 1


def test_list_meetings_search(client):
    _create_sample_meeting(client, title="Roadmap Sync")
    _create_sample_meeting(client, title="Sales Call")

    response = client.get("/api/meetings", params={"search": "roadmap"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Roadmap Sync"


def test_datetimes_are_returned_as_explicit_utc(client):
    """Naive strings get parsed as *local* time by browsers, shifting every timestamp."""
    created = _create_sample_meeting(client).json()

    assert created["meeting_date"] == "2026-09-20T10:00:00Z"
    assert created["created_at"].endswith("Z")
    assert client.get(f"/api/meetings/{created['id']}").json()["meeting_date"] == "2026-09-20T10:00:00Z"

    card = client.get("/api/meetings").json()["items"][0]
    assert card["meeting_date"].endswith("Z")


def test_editing_a_meeting_does_not_shift_its_time(client):
    created = _create_sample_meeting(client).json()
    updated = client.put(f"/api/meetings/{created['id']}", json={"meeting_date": created["meeting_date"]}).json()
    assert updated["meeting_date"] == created["meeting_date"]
