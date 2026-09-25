from types import SimpleNamespace

import groq
import httpx
import pytest

from app.main import app
from app.services import qa_service
from app.services.qa_service import (
    LLMQuestionAnswerService,
    MeetingContext,
    MockQuestionAnswerService,
    QASegment,
    build_llm_material,
    extract_cited_segments,
    format_timestamp,
    get_qa_service,
)


# ---------- helpers ----------

def _create_meeting(client, with_transcript=True):
    payload = {
        "title": "Ask Test Meeting",
        "meeting_date": "2026-09-20T10:00:00Z",
        "participants": [],
        "tags": [],
    }
    if with_transcript:
        payload["transcript_segments"] = [
            {"speaker": "Anshika Chauhan", "start_time": 0, "end_time": 5, "text": "Let's discuss the release deadline today."},
            {"speaker": "Rahul Verma", "start_time": 5, "end_time": 10, "text": "The deadline is Friday and I will finalize the estimate."},
            {"speaker": "Karan Mehta", "start_time": 10, "end_time": 15, "text": "Budget is fine, nothing to add."},
        ]
    return client.post("/api/meetings", json=payload).json()


def _ctx():
    return MeetingContext(
        title="Roadmap",
        summary="The team planned the release.",
        segments=[
            QASegment(1, "Anshika Chauhan", 0, 5, "Let's discuss the release deadline today."),
            QASegment(2, "Rahul Verma", 5, 10, "The deadline is Friday, I will finalize the estimate."),
            QASegment(3, "Karan Mehta", 10, 15, "Budget is fine, nothing to add."),
        ],
    )


class FakeGroq:
    """Stands in for groq.Groq; records the request and returns/raises a canned result."""

    def __init__(self, content=None, error=None):
        self._content, self._error, self.calls = content, error, []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **kwargs):
        self.calls.append(kwargs)
        if self._error:
            raise self._error
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=self._content))])


def _llm(fake, max_chars=20_000):
    return LLMQuestionAnswerService("test-key", "test-model", max_chars, client=fake)


# ---------- endpoint (keyword mode, no API key) ----------

def test_keyword_answer_quotes_matching_lines_with_sources(client):
    meeting = _create_meeting(client)
    response = client.post(f"/api/meetings/{meeting['id']}/ask", json={"question": "What did Rahul say about the deadline?"})

    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "keyword"
    assert data["model"] is None
    assert data["sources"], "expected at least one source line"
    assert data["sources"][0]["speaker_name"] == "Rahul Verma"
    assert "Friday" in data["answer"]


def test_action_items_intent(client):
    meeting = _create_meeting(client)
    data = client.post(f"/api/meetings/{meeting['id']}/ask", json={"question": "What are the action items?"}).json()
    assert "finalize" in data["answer"].lower()


def test_summary_intent(client):
    meeting = _create_meeting(client)
    summary = client.get(f"/api/meetings/{meeting['id']}/summary").json()["overview"]
    data = client.post(f"/api/meetings/{meeting['id']}/ask", json={"question": "Give me a summary"}).json()
    assert data["answer"] == summary


def test_no_match_says_so(client):
    meeting = _create_meeting(client)
    data = client.post(f"/api/meetings/{meeting['id']}/ask", json={"question": "Tell me about quantum computing"}).json()
    assert "couldn't find" in data["answer"]
    assert data["sources"] == []


def test_meeting_without_transcript(client):
    meeting = _create_meeting(client, with_transcript=False)
    data = client.post(f"/api/meetings/{meeting['id']}/ask", json={"question": "What happened?"}).json()
    assert "no transcript" in data["answer"].lower()


def test_ask_unknown_meeting_is_404(client):
    assert client.post("/api/meetings/9999/ask", json={"question": "hi"}).status_code == 404


@pytest.mark.parametrize("question", ["", "   ", "x" * 501])
def test_ask_validates_question(client, question):
    meeting = _create_meeting(client)
    assert client.post(f"/api/meetings/{meeting['id']}/ask", json={"question": question}).status_code == 422


# ---------- endpoint with the Groq service swapped in ----------

def test_endpoint_uses_llm_service_and_maps_citations_to_sources(client):
    fake = FakeGroq(content="Rahul said the deadline is Friday [0:05].")
    app.dependency_overrides[get_qa_service] = lambda: _llm(fake)
    meeting = _create_meeting(client)

    data = client.post(f"/api/meetings/{meeting['id']}/ask", json={"question": "When is the deadline?"}).json()

    assert data["mode"] == "llm"
    assert data["model"] == "test-model"
    assert data["notice"] is None
    assert [s["speaker_name"] for s in data["sources"]] == ["Rahul Verma"]


# ---------- LLMQuestionAnswerService ----------

def test_llm_prompt_contains_transcript_and_treats_it_as_data():
    fake = FakeGroq(content="Answer [0:00].")
    _llm(fake).answer("When is the deadline?", _ctx())

    request = fake.calls[0]
    system, user = request["messages"]
    assert request["model"] == "test-model"
    assert "not instructions" in system["content"]
    assert "<meeting_material>" in user["content"]
    assert "[0:05] Rahul Verma: The deadline is Friday" in user["content"]
    assert user["content"].rstrip().endswith("Question: When is the deadline?")


@pytest.mark.parametrize(
    "error",
    [
        groq.APIConnectionError(request=httpx.Request("POST", "https://api.groq.com")),
        groq.RateLimitError(
            "rate limited",
            response=httpx.Response(429, request=httpx.Request("POST", "https://api.groq.com")),
            body=None,
        ),
        groq.AuthenticationError(
            "bad key",
            response=httpx.Response(401, request=httpx.Request("POST", "https://api.groq.com")),
            body=None,
        ),
        groq.NotFoundError(
            "model gone",
            response=httpx.Response(404, request=httpx.Request("POST", "https://api.groq.com")),
            body=None,
        ),
    ],
)
def test_llm_failure_falls_back_to_keyword_answer(error):
    answer = _llm(FakeGroq(error=error)).answer("What is the deadline?", _ctx())

    assert answer.mode == "keyword"
    assert answer.notice and "AI answer unavailable" in answer.notice
    assert "Friday" in answer.text  # still a useful answer


def test_retired_model_gets_an_actionable_notice():
    error = groq.NotFoundError(
        "model gone",
        response=httpx.Response(404, request=httpx.Request("POST", "https://api.groq.com")),
        body=None,
    )
    answer = _llm(FakeGroq(error=error)).answer("What is the deadline?", _ctx())
    assert "GROQ_MODEL" in answer.notice


def test_llm_empty_completion_falls_back():
    answer = _llm(FakeGroq(content="   ")).answer("What is the deadline?", _ctx())
    assert answer.mode == "keyword"
    assert answer.notice


def test_failure_notice_does_not_leak_exception_details():
    error = groq.APIConnectionError(request=httpx.Request("POST", "https://api.groq.com/secret-path"))
    answer = _llm(FakeGroq(error=error)).answer("deadline?", _ctx())
    assert "secret-path" not in (answer.notice or "")


# ---------- helpers ----------

def test_extract_cited_segments_ignores_unknown_timestamps():
    cited = extract_cited_segments("See [0:05] and [9:99] and [0:05] again.", _ctx().segments)
    assert [s.id for s in cited] == [2]


@pytest.mark.parametrize(
    "answer",
    [
        "Friday [0:05].",
        "Friday 【0:05】.",  # fullwidth brackets, as gpt-oss models emit
        "Friday [0:00, 0:05, 0:12].",  # grouped citations; 0:00 and 0:12 hit other lines
        "Friday [0:07].",  # lands mid-line, still resolves to the containing line
    ],
)
def test_citation_formats_resolve_to_real_segments(answer):
    ids = [s.id for s in extract_cited_segments(answer, _ctx().segments)]
    assert 2 in ids
    assert set(ids) <= {1, 2, 3}


def test_citations_beyond_the_transcript_or_malformed_are_dropped():
    assert extract_cited_segments("See [59:59] and [1:75] and [note: 0:05].", _ctx().segments) == []


def test_llm_answer_normalizes_fullwidth_brackets_and_maps_sources():
    answer = _llm(FakeGroq(content="Deadline is Friday【0:05】.")).answer("deadline?", _ctx())
    assert "[0:05]" in answer.text and "【" not in answer.text
    assert [s.id for s in answer.sources] == [2]


def test_format_timestamp_matches_frontend():
    assert format_timestamp(0) == "0:00"
    assert format_timestamp(455) == "7:35"
    assert format_timestamp(3725) == "1:02:05"


def test_long_transcript_is_trimmed_to_relevant_lines():
    filler = [QASegment(i, "Filler Person", i * 5, i * 5 + 5, f"Unrelated chatter number {i} about lunch.") for i in range(10, 60)]
    needle = QASegment(99, "Rahul Verma", 500, 505, "The migration deadline is Friday.")
    context = MeetingContext(title="Long", segments=filler + [needle])

    material = build_llm_material("What is the migration deadline?", context, max_chars=600)

    assert "migration deadline is Friday" in material
    assert "only the transcript lines most relevant" in material
    assert len(material) < 1500


def test_short_transcript_is_not_trimmed():
    material = build_llm_material("anything", _ctx(), max_chars=20_000)
    assert "only the transcript lines most relevant" not in material
    assert material.count("] ") >= 3


def test_keyword_service_filters_action_items_by_owner():
    ctx = _ctx()
    ctx.action_items = [
        qa_service.QAActionItem("Prepare estimate", "Karan Mehta", "TODO", None),
        qa_service.QAActionItem("Draft one-pager", "Neha Kapoor", "IN_PROGRESS", "2026-10-01"),
    ]
    answer = MockQuestionAnswerService().answer("What tasks does Neha have?", ctx)
    assert "Draft one-pager" in answer.text
    assert "Prepare estimate" not in answer.text


# ---------- factory ----------

@pytest.mark.parametrize("key, expected", [(None, MockQuestionAnswerService), ("gsk_test", LLMQuestionAnswerService)])
def test_factory_picks_service_from_settings(monkeypatch, key, expected):
    monkeypatch.setattr(
        qa_service,
        "get_settings",
        lambda: SimpleNamespace(groq_api_key=key, groq_model="m", llm_max_context_chars=1000),
    )
    get_qa_service.cache_clear()
    try:
        assert isinstance(get_qa_service(), expected)
    finally:
        get_qa_service.cache_clear()
