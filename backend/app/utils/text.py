"""Small text helpers shared by the summary generator and the Q&A service."""
from __future__ import annotations

import re

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to",
    "of", "in", "on", "for", "with", "we", "i", "you", "it", "this", "that",
    "be", "as", "at", "by", "so", "if", "then", "than", "our", "us", "they",
    "have", "has", "had", "will", "would", "can", "could", "should", "just",
    "about", "into", "also", "there", "their", "your", "not", "do", "does",
    "think", "going", "okay", "yeah", "like", "get", "got", "im", "lets",
    "let", "up", "out", "all", "some", "them", "what", "when", "how", "need",
}

_WORD_RE = re.compile(r"[a-zA-Z0-9']+")


def stem(word: str) -> str:
    """Very light suffix stripping so 'deadlines' matches 'deadline'."""
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"
    if word.endswith("ing") and len(word) > 5:
        return word[:-3]
    if word.endswith("ed") and len(word) > 4:
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        return word[:-1]
    return word


def tokenize(text: str, extra_stopwords: set[str] | None = None) -> list[str]:
    """Lowercase, drop stopwords/short words, and stem."""
    blocked = STOPWORDS | (extra_stopwords or set())
    words = (w.lower().strip("'") for w in _WORD_RE.findall(text))
    return [stem(w) for w in words if len(w) > 2 and w not in blocked]
