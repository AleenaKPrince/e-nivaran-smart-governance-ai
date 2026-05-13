from db import settings_collection
from ai.predict_priority import severity_score


def _load_priority_rules():
    try:
        doc = settings_collection.find_one({}) or {}
        rules = doc.get("priority_rules")
        if rules:
            return rules
    except Exception:
        pass
    # default rules
    return [
        {"name": "Low", "min": 0, "max": 3},
        {"name": "Medium", "min": 4, "max": 6},
        {"name": "High", "min": 7, "max": 8},
        {"name": "Critical", "min": 9, "max": 10},
    ]


def assign_priority(text):
    """Assign priority name based on severity score and configured priority rules."""

    raw_score = severity_score(text)
    # Support both legacy 0-100 scores and normalized 0.0-1.0 scores.
    try:
        numeric_score = float(raw_score)
        if 0 <= numeric_score <= 1:
            score10 = max(0, min(10, int(round(numeric_score * 10.0))))
        else:
            score10 = max(0, min(10, int(round(numeric_score / 10.0))))
    except Exception:
        score10 = 0

    rules = _load_priority_rules()
    rules = sorted(
        rules,
        key=lambda r: (r.get("min", 0), r.get("max", 10)),
    )
    for rule in rules:
        if score10 >= rule.get("min", 0) and score10 <= rule.get("max", 10):
            return rule.get("name")

    # fallback
    return "Low"
