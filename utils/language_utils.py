import re
from deep_translator import GoogleTranslator


def detect_language(text: str):
    if not isinstance(text, str):
        return "en"
    if re.search(r"[\u0D00-\u0D7F]", text):
        return "ml"
    return "en"


def _safe_translate(text, source, target):
    if not isinstance(text, str) or not text.strip():
        return text

    try:
        return GoogleTranslator(source=source, target=target).translate(text)
    except Exception:
        # Keep original content if translation service is unavailable.
        return text


def translate_to_english(text: str):
    return _safe_translate(text, source="auto", target="en")


def translate_to_malayalam(text: str):
    return _safe_translate(text, source="auto", target="ml")
