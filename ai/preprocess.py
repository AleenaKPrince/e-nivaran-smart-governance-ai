import re

_PUNCT_RE = re.compile(r"[^\w\s]")
_SPACE_RE = re.compile(r"\s+")


def preprocess(text: str) -> str:
    """Normalize complaint text for both training and inference."""
    if not isinstance(text, str):
        return ""
    cleaned = text.lower().strip()
    cleaned = _PUNCT_RE.sub(" ", cleaned)
    cleaned = _SPACE_RE.sub(" ", cleaned).strip()
    return cleaned
