import re
from typing import Dict, List, Optional

from utils.language_utils import detect_language, translate_to_english

CRITICAL_TERMS = [
    # Fire & explosion
    "fire", "explosion", "blast",
    "gas leak", "gas leakage", "gas smell",
    "building collapse",
    "short circuit fire",
    "there was a fire", "fire broke out",
    "gas leak in house",
    # Crime in progress
    "robbery", "armed robbery",
    "attack", "assault",
    "bomb threat", "kidnapping",
    "robbery near atm",
    # Malayalam
    "തീപിടിത്തം", "പൊട്ടിത്തെറി",
    "ഗ്യാസ് ചോർച്ച",
    "കവർച്ച", "ആക്രമണം",
]

HIGH_RISK_TERMS = [
    # Electric danger
    "electric pole fallen",
    "electric pole fell",
    "electricity post fell",
    "electric post fell",
    "live wire",
    "wire exposed",
    "exposed wire",
    "transformer exploded",
    "transformer broke",
    "the transformer broke",
    # Infrastructure risk
    "bridge cracked",
    "road collapsed",
    # Health urgency
    "medical emergency",
    "ambulance delay",
    # Malayalam
    "വൈദ്യുതി പോസ്റ്റ് വീണു",
    "വൈദ്യുതി വയർ പുറത്താണ്",
    "അപകടകരം",
]

MEDIUM_TERMS = [
    "streetlight not working",
    "street light not working",
    "steet light not working",
    "power outage",
    "road damaged",
    "road broken",
    "pothole",
    "garbage not collected",
    "drain blocked",
    "traffic congestion",
    # Malayalam
    "സ്റ്റ്രീറ്റ് ലൈറ്റ് പ്രവർത്തിക്കുന്നില്ല",
    "റോഡ് തകർന്നു",
]

LOW_TERMS = [
    "office timing",
    "how to apply",
    "certificate request",
    "general enquiry",
]

# Deterministic weighted layer scoring (used for explainable scoring, not ML).
LAYER_WEIGHTS = {
    "Critical": 50,
    "High": 30,
    "Medium": 15,
    "Low": 5,
}

# Translation/output variant normalizations to reduce brittle exact-match failures.
TEXT_REPLACEMENTS = {
    "steet light": "street light",
    "street lamp": "streetlight",
    "electricity post fell": "electric pole fallen",
    "electric post fell": "electric pole fallen",
    "electric pole fell": "electric pole fallen",
    "the transformer broke": "transformer broke",
    "wire is outside": "wire exposed",
    "wire outside": "wire exposed",
    "exposed electric wire": "wire exposed",
}

CRITICAL_REGEX = [
    r"\b(fire|blast|explosion)\b",
    r"\bgas\s+(leak|leakage|smell)\b",
    r"\b(robbery|armed robbery|attack|assault|kidnapping)\b",
]

HIGH_RISK_REGEX = [
    r"\b(electric|electricity)\s+(pole|post)\s+(fell|fallen|down|collapsed)\b",
    r"\b(live wire|wire exposed|exposed wire)\b",
    r"\btransformer\s+(exploded|burst|broke|sparking|burning)\b",
    r"\b(medical emergency|ambulance delay)\b",
]


def _normalize_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    normalized = re.sub(r"\s+", " ", text.strip().lower())
    for source, target in TEXT_REPLACEMENTS.items():
        normalized = normalized.replace(source, target)
    return normalized


def _prepare_text(text: str) -> str:
    normalized = _normalize_text(text)
    if not normalized:
        return ""

    language = detect_language(normalized)
    if language == "ml":
        translated = _normalize_text(translate_to_english(normalized))
        # Keep original + translated content so either set of keywords can match.
        if translated:
            return f"{normalized} {translated}"
    return normalized


def _find_matches(text: str, terms: List[str]) -> List[str]:
    return [term for term in terms if term in text]


def _matches_regex(text: str, patterns: List[str]) -> bool:
    return any(re.search(pattern, text) for pattern in patterns)


def _weighted_scores(text: str) -> Dict[str, int]:
    critical_hits = _find_matches(text, CRITICAL_TERMS)
    high_hits = _find_matches(text, HIGH_RISK_TERMS)
    medium_hits = _find_matches(text, MEDIUM_TERMS)
    low_hits = _find_matches(text, LOW_TERMS)

    return {
        "Critical": len(critical_hits) * LAYER_WEIGHTS["Critical"],
        "High": len(high_hits) * LAYER_WEIGHTS["High"],
        "Medium": len(medium_hits) * LAYER_WEIGHTS["Medium"],
        "Low": len(low_hits) * LAYER_WEIGHTS["Low"],
    }


def _apply_department_escalation(priority: str, text: str, department: str) -> str:
    dept = _normalize_text(department)

    if dept == "fire and rescue" and priority in {"Low", "Medium"}:
        return "High"

    if dept == "police" and (
        "robbery" in text
        or "armed robbery" in text
        or "attack" in text
        or "assault" in text
        or "കവർച്ച" in text
        or "ആക്രമണം" in text
    ):
        return "Critical"

    if dept == "electricity" and (
        "electric pole fallen" in text
        or "live wire" in text
        or "wire exposed" in text
        or "exposed wire" in text
        or _matches_regex(text, HIGH_RISK_REGEX)
        or "വൈദ്യുതി പോസ്റ്റ് വീണു" in text
        or "വൈദ്യുതി വയർ പുറത്താണ്" in text
    ):
        if priority in {"Low", "Medium"}:
            return "High"

    return priority


def predict_priority(text: str, department: Optional[str] = None) -> str:
    prepared_text = _prepare_text(text)
    if not prepared_text:
        return "Medium"

    # Deterministic rule order: Critical -> High -> Medium -> Low -> default Medium.
    if any(term in prepared_text for term in CRITICAL_TERMS) or _matches_regex(
        prepared_text, CRITICAL_REGEX
    ):
        priority = "Critical"
    elif any(term in prepared_text for term in HIGH_RISK_TERMS) or _matches_regex(
        prepared_text, HIGH_RISK_REGEX
    ):
        priority = "High"
    elif any(term in prepared_text for term in MEDIUM_TERMS):
        priority = "Medium"
    elif any(term in prepared_text for term in LOW_TERMS):
        priority = "Low"
    else:
        priority = "Medium"

    # Weighted scoring is intentionally deterministic and non-ML.
    _ = _weighted_scores(prepared_text)

    if department:
        priority = _apply_department_escalation(priority, prepared_text, department)

    return priority


def severity_score(text: str, department: Optional[str] = None) -> float:
    priority = predict_priority(text, department=department)

    if priority == "Critical":
        return 0.95
    if priority == "High":
        return 0.80
    if priority == "Medium":
        return 0.55
    return 0.25
