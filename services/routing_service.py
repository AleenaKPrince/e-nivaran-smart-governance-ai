from ai.predict import predict_department_with_confidence
from ai.predict_priority import predict_priority, severity_score
from services.keyword_routing import keyword_based_department
from utils.language_utils import detect_language, translate_to_english
from utils.routing_service import (
    DEFAULT_DEPARTMENT,
    hybrid_predict_department,
    normalize_department,
    route_by_keywords,
    route_by_ml_model,
    route_fallback,
)

# ---------------------------------------------------------------
# STRICT DEPARTMENT CONTROL
# ---------------------------------------------------------------
VALID_DEPARTMENTS = [
    "Health",
    "Electricity",
    "Local Self Government",
    "Public Works",
    "Transport",
    "Fire and Rescue",
    "Police",
]

# Strong rule keywords per department
DEPARTMENT_KEYWORDS = {

    "Electricity": [
        "electric", "electricity", "power", "current",
        "transformer", "voltage", "wire", "pole",
        "streetlight", "street light", "line",
        "meter", "sparking", "short circuit",
        "electric pole", "power outage"
    ],

    "Local Self Government": [
        "garbage", "waste", "drain", "sewage",
        "clean", "sanitation", "mosquito",
        "mosquito breeding",
        "toilet", "public toilet",
        "waste management"
    ],

    "Public Works": [
        "road", "pothole", "bridge",
        "construction", "repair",
        "infrastructure",
        "culvert", "road damage",
        "road broken"
    ],

    "Transport": [
        "bus", "traffic", "transport",
        "vehicle", "road accident",
        "traffic jam"
    ],

    "Fire and Rescue": [
        "fire", "smoke", "burn", "explosion",
        "gas leak", "gas leakage",
        "gas pipe leakage",
        "gas smell",
        "gas cylinder",
        "fire emergency",
        "fire hazard"
    ],

    "Police": [
        "theft", "robbery", "crime",
        "attack", "violence", "fraud",
        "threat", "snatching",
        "chain snatching",
        "suspicious",
        "illegal"
    ],

    "Health": [
        "hospital", "medical", "doctor",
        "clinic", "health", "emergency",
        "disease", "infection",
        "health hazard"
    ],
}


def rule_based_department(description: str):

    if not description:
        return None

    text = description.lower().strip()

    best_match = None
    best_length = 0

    for dept, keywords in DEPARTMENT_KEYWORDS.items():

        for keyword in keywords:

            if keyword in text:

                if len(keyword) > best_length:
                    best_match = dept
                    best_length = len(keyword)

    return best_match


def preprocess_text(text: str):
    if not text:
        return ""

    text = text.lower().strip()
    text = " ".join(text.split())
    return text


def process_input_text(description):
    original = description or ""
    language = detect_language(original)

    if language == "ml":
        translated = translate_to_english(original)
    else:
        translated = original

    cleaned = preprocess_text(translated)

    return {
        "original": original,
        "translated": translated,
        "cleaned": cleaned,
        "language": language,
    }


def normalize_confidence(score):
    try:
        score = float(score)
    except Exception:
        score = 0.0

    if score < 0:
        score = 0.0
    if score > 1:
        score = 1.0

    return score


def route_complaint(description: str = "", text: str = "", ml_predictor=None):
    # Backward compatible input handling.
    description = description if description else text
    processed = process_input_text(description)
    cleaned_text = processed["cleaned"]

    confidence = 0.0
    department = "Unclassified"
    routing_mode = "FALLBACK"

    # ---------------------------------------------
    # STEP 1: RULE BASED ROUTING
    # ---------------------------------------------
    rule_dept = rule_based_department(cleaned_text)

    if rule_dept:
        routing_mode = "RULE_BASED"
        confidence = 1.0
        department = rule_dept
    else:
        # ---------------------------------------------
        # STEP 2: ML ROUTING
        # ---------------------------------------------
        predictor = ml_predictor or predict_department_with_confidence
        ml_result = predictor(cleaned_text)

        if isinstance(ml_result, tuple):
            ml_department = ml_result[0]
            confidence = ml_result[1] if len(ml_result) > 1 else 0.0
        elif isinstance(ml_result, dict):
            ml_department = ml_result.get("department", DEFAULT_DEPARTMENT)
            confidence = ml_result.get("confidence", 0.0)
        else:
            ml_department = ml_result
            confidence = 0.0

        department = normalize_department(ml_department)
        confidence = normalize_confidence(confidence)

        if confidence >= 0.25 and department in VALID_DEPARTMENTS:
            routing_mode = "ML"
        else:
            # ---------------------------------------------
            # STEP 3: FALLBACK
            # ---------------------------------------------
            department = "Unclassified"
            routing_mode = "FALLBACK"

    # Strict department validation.
    if department not in VALID_DEPARTMENTS:
        department = "Unclassified"
        routing_mode = "FALLBACK"

    confidence = normalize_confidence(confidence)
    priority = predict_priority(cleaned_text)
    severity = severity_score(cleaned_text)

    routing_reason = (
        "Keyword match"
        if routing_mode == "RULE_BASED"
        else "ML model prediction"
        if routing_mode == "ML"
        else "Low confidence"
    )

    print("Routing Debug:")
    print("Original:", processed["original"])
    print("Cleaned:", processed["cleaned"])
    print("Department:", department)
    print("Confidence:", confidence)
    print("Routing Mode:", routing_mode)

    return {
        "department": department,
        "confidence": confidence,
        "department_confidence": confidence,
        "routing_mode": routing_mode,
        "routing_reason": routing_reason,
        "priority": priority,
        "severity": severity,
        "language": processed["language"],
        "description_original": processed["original"],
        "description_translated": processed["translated"],
        "description_english": processed["translated"],
        "description_cleaned": processed["cleaned"],
    }


__all__ = [
    "route_complaint",
    "hybrid_predict_department",
    "normalize_department",
    "route_by_keywords",
    "route_by_ml_model",
    "route_fallback",
]
