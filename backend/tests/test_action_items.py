def _create_meeting(client):
    payload = {
        "title": "Action Item Test Meeting",
        "meeting_date": "2026-09-20T10:00:00Z",
        "participants": [],
        "tags": [],
    }
    return client.post("/api/meetings", json=payload).json()


def test_create_action_item(client):
    meeting = _create_meeting(client)
    response = client.post(
        f"/api/meetings/{meeting['id']}/action-items",
        json={"title": "Finalize estimate", "assignee": "Karan Mehta", "status": "TODO"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Finalize estimate"
    assert data["status"] == "TODO"


def test_update_action_item(client):
    meeting = _create_meeting(client)
    created = client.post(
        f"/api/meetings/{meeting['id']}/action-items", json={"title": "Draft doc"}
    ).json()

    response = client.put(f"/api/action-items/{created['id']}", json={"status": "IN_PROGRESS"})
    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"


def test_complete_action_item(client):
    meeting = _create_meeting(client)
    created = client.post(
        f"/api/meetings/{meeting['id']}/action-items", json={"title": "Ship feature"}
    ).json()

    response = client.patch(f"/api/action-items/{created['id']}/complete")
    assert response.status_code == 200
    assert response.json()["status"] == "COMPLETED"


def test_delete_action_item(client):
    meeting = _create_meeting(client)
    created = client.post(
        f"/api/meetings/{meeting['id']}/action-items", json={"title": "Temp item"}
    ).json()

    response = client.delete(f"/api/action-items/{created['id']}")
    assert response.status_code == 204

    update_response = client.put(f"/api/action-items/{created['id']}", json={"status": "TODO"})
    assert update_response.status_code == 404


def test_action_item_not_found(client):
    response = client.patch("/api/action-items/9999/complete")
    assert response.status_code == 404
