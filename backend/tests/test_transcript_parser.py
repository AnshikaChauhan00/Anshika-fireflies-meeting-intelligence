import pytest

from app.services.transcript_parser import parse_json, parse_txt, parse_vtt
from app.utils.exceptions import ValidationFailedError


def test_parse_txt():
    content = (
        "[00:00] Ankit:\n"
        "Good morning everyone.\n\n"
        "[00:07] Rahul:\n"
        "Good morning.\n"
    )
    segments = parse_txt(content)
    assert len(segments) == 2
    assert segments[0].speaker == "Ankit"
    assert segments[0].start_time == 0
    assert segments[1].speaker == "Rahul"
    assert segments[1].start_time == 7


def test_parse_txt_empty_raises():
    with pytest.raises(ValidationFailedError):
        parse_txt("no timestamps here")


def test_parse_vtt():
    content = (
        "WEBVTT\n\n"
        "00:00:00.000 --> 00:00:05.000\n"
        "Ankit: Good morning everyone.\n\n"
        "00:00:05.000 --> 00:00:10.000\n"
        "Rahul: Good morning.\n"
    )
    segments = parse_vtt(content)
    assert len(segments) == 2
    assert segments[0].speaker == "Ankit"
    assert segments[0].end_time == 5.0


def test_parse_json():
    content = (
        '[{"speaker": "Ankit", "start": 0, "end": 5, "text": "Hello everyone"}, '
        '{"speaker": "Rahul", "start": 5, "end": 8, "text": "Hi there"}]'
    )
    segments = parse_json(content)
    assert len(segments) == 2
    assert segments[0].text == "Hello everyone"


def test_parse_json_invalid_raises():
    with pytest.raises(ValidationFailedError):
        parse_json("not json")


def test_parse_json_missing_field_raises():
    with pytest.raises(ValidationFailedError):
        parse_json('[{"speaker": "Ankit", "text": "Hi"}]')
