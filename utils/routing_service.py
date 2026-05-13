"""
HYBRID ROUTING SERVICE
=====================
Implements a multi-stage routing system for complaint classification:
1. Rule-based keyword matching (RULE mode)
2. ML model prediction with confidence gating (AI mode)
3. Fallback to "Unclassified" if confidence too low (FALLBACK mode)

Ensures accurate, explainable, and production-ready department routing.
"""

import re
from typing import Dict, Tuple, Optional
from db import settings_collection
from utils.language_utils import detect_language, translate_to_english


# ================================================================
# ALLOWED DEPARTMENTS (must match database and staff departments)
# ================================================================
ALLOWED_DEPARTMENTS = {
    "Health",
    "Electricity",
    "Local Self Government",
    "Public Works",
    "Transport",
    "Fire and Rescue",
    "Police",
}

DEFAULT_DEPARTMENT = "Unclassified"


# ================================================================
# KEYWORD-BASED ROUTING RULES
# ================================================================
# Maps keywords to departments with high confidence
KEYWORD_RULES = {
    "Electricity": {
        "keywords": [
            "streetlight", "street light", "pole", "power", "electricity",
            "current", "shock", "electric", "transformer", "load shedding",
            "power cut", "blackout", "bulb", "wire", "cable", "short circuit",
            "voltage", "fault", "breakdown", "outage", "line", "power line"
        ],
        "confidence": 0.95,
        "routing_mode": "RULE"
    },
    
    "Public Works": {
        "keywords": [
            "pothole", "road", "street", "pavement", "damaged road", "broken road",
            "crater", "hole", "asphalt", "paving", "construction", "repair road",
            "lane", "highway", "bridge", "underpass", "footpath", "sidewalk"
        ],
        "confidence": 0.95,
        "routing_mode": "RULE"
    },
    
    "Local Self Government": {
        "keywords": [
            "garbage", "waste", "trash", "rubbish", "litter", "sweeping",
            "drainage", "drain", "water stagnation", "stagnant", "dirty street",
            "cleanliness", "sanitation", "sewer", "septic", "sewage",
            "municipal", "civic", "local"
        ],
        "confidence": 0.95,
        "routing_mode": "RULE"
    },
    
    "Health": {
        "keywords": [
            "hospital", "doctor", "medical", "health", "fever", "medicine",
            "patient", "nurse", "clinic", "emergency", "ambulance", "disease",
            "illness", "injury", "wound", "vaccine", "health center"
        ],
        "confidence": 0.95,
        "routing_mode": "RULE"
    },
    
    "Fire and Rescue": {
        "keywords": [
            "fire", "accident", "emergency", "rescue", "hazard", "danger",
            "trap", "stuck", "collapse", "explosion", "smoke", "burn",
            "flooding", "flood", "disaster", "calamity", "crisis"
        ],
        "confidence": 0.90,
        "routing_mode": "RULE"
    },
    
    "Police": {
        "keywords": [
            "theft", "crime", "robbery", "violence", "assault", "harassment",
            "complaint", "suspect", "criminal", "illegal", "law", "police",
            "security", "safety", "dangerous", "threat"
        ],
        "confidence": 0.90,
        "routing_mode": "RULE"
    },
    
    "Transport": {
        "keywords": [
            "bus", "auto", "taxi", "vehicle", "traffic", "signal", "transport",
            "public transport", "route", "fare", "ticket", "driver", "conductor",
            "parking", "road traffic", "vehicle", "accident"
        ],
        "confidence": 0.85,
        "routing_mode": "RULE"
    },
}


# ================================================================
# UTILITY: TEXT NORMALIZATION
# ================================================================
def normalize_text(text: str) -> str:
    """
    Normalize complaint text for consistent keyword matching.
    - Convert to lowercase
    - Remove extra whitespace
    - Remove special characters
    """
    text = text.lower().strip()
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    return text


def normalize_department(dept: str) -> str:
    """
    Normalize department names returned by ML model to match allowed list.
    
    Examples:
        "Electricity Department" → "Electricity"
        "Health" → "Health"
        "General" → "Unclassified"
    """
    if not dept:
        return DEFAULT_DEPARTMENT
    
    dept = dept.strip()
    
    # Direct match
    if dept in ALLOWED_DEPARTMENTS:
        return dept
    
    # Partial matches with common variations
    dept_lower = dept.lower()
    
    if any(x in dept_lower for x in ["electricity", "power", "elec"]):
        return "Electricity"
    if any(x in dept_lower for x in ["health", "medical", "hospital"]):
        return "Health"
    if any(x in dept_lower for x in ["public works", "public", "works", "road"]):
        return "Public Works"
    if any(x in dept_lower for x in ["local self", "municipal", "lsg", "sanitation", "garbage"]):
        return "Local Self Government"
    if any(x in dept_lower for x in ["fire", "rescue", "emergency"]):
        return "Fire and Rescue"
    if any(x in dept_lower for x in ["police", "law", "security"]):
        return "Police"
    if any(x in dept_lower for x in ["transport", "traffic", "bus"]):
        return "Transport"
    
    # Fallback
    return DEFAULT_DEPARTMENT


def _load_settings():
    """Load system settings from DB with defaults."""
    try:
        doc = settings_collection.find_one({}) or {}
    except Exception:
        doc = {}
    # defaults (should mirror admin DEFAULT_SETTINGS)
    defaults = {
        "ai_confidence_threshold": 0.5,
        "enable_ai_routing": True,
        "enable_rule_routing": True,
    }
    settings = {**defaults, **doc}
    return settings


# ================================================================
# STEP 1: RULE-BASED KEYWORD MATCHING
# ================================================================
def route_by_keywords(text: str) -> Optional[Dict]:
    """
    Match complaint text against curated keyword rules.
    Returns routing decision with department and confidence if match found.
    Returns None if no keyword match.
    """
    normalized_text = normalize_text(text)
    
    for department, rule in KEYWORD_RULES.items():
        keywords = rule["keywords"]
        
        # Check if any keyword matches
        for keyword in keywords:
            if keyword in normalized_text:
                return {
                    "department": department,
                    "confidence": rule["confidence"],
                    "routing_mode": "RULE",
                    "routing_reason": f"Matched keyword: '{keyword}'",
                }
    
    return None


# ================================================================
# STEP 2: ML-BASED PREDICTION (with confidence gating)
# ================================================================
def route_by_ml_model(text: str, ml_predictor) -> Optional[Dict]:
    """
    Use ML model to predict department with confidence gating.
    
    Args:
        text: Complaint text
        ml_predictor: Function that returns (department, confidence)
    
    Returns:
        Routing decision if confidence above threshold, else None
    """
    if not text or not ml_predictor:
        return None
    
    try:
        # Get ML prediction (simple string or tuple with confidence)
        ml_result = ml_predictor(text)
        
        # Handle both plain string and (dept, confidence) tuple
        if isinstance(ml_result, tuple):
            department, confidence = ml_result
        else:
            # Plain string prediction with default confidence
            department = ml_result
            confidence = 0.60  # Default confidence for basic models
        
        # Normalize department name
        department = normalize_department(department)
        
        # Confidence gating: only accept if confidence is above threshold
        settings = _load_settings()
        if not settings.get("enable_ai_routing", True):
            return None
        CONFIDENCE_THRESHOLD = float(settings.get("ai_confidence_threshold", 0.5))
        if confidence < CONFIDENCE_THRESHOLD:
            return None  # Confidence too low
        
        return {
            "department": department,
            "confidence": confidence,
            "routing_mode": "AI",
            "routing_reason": f"ML prediction (model confidence: {confidence:.2f})",
        }
    
    except Exception:
        return None


# ================================================================
# STEP 3: FALLBACK TO UNCLASSIFIED
# ================================================================
def route_fallback() -> Dict:
    """
    Fallback routing when no rule or ML match succeeds.
    Marks complaint as Unclassified for manual review.
    """
    return {
        "department": DEFAULT_DEPARTMENT,
        "confidence": 0.0,
        "routing_mode": "FALLBACK",
        "routing_reason": "No rule or ML match found. Manual review needed.",
    }


# ================================================================
# MAIN HYBRID ROUTING FUNCTION
# ================================================================
def route_complaint(text: str, ml_predictor=None) -> Dict:
    """
    HYBRID ROUTING: Multi-stage complaint classification.
    
    Process:
    1. Try rule-based keyword matching (highest confidence)
    2. Try ML-based prediction with confidence gating
    3. Fall back to Unclassified if both fail
    
    Args:
        text: Complaint description
        ml_predictor: Optional ML prediction function
    
    Returns:
        Dict with keys:
        - department: Assigned department name
        - confidence: Confidence score (0.0-1.0)
        - routing_mode: "RULE" | "AI" | "FALLBACK"
        - routing_reason: Explanation of routing decision
    """
    
    if not text:
        fallback = route_fallback()
        fallback["language"] = "en"
        fallback["description_original"] = text
        fallback["description_translated"] = text
        fallback["description_english"] = text
        return fallback

    # Always classify using English text for multilingual support.
    language = detect_language(text)
    translated_text = translate_to_english(text) if language == "ml" else text
    classification_text = translated_text or text
    
    # Load settings and decide which routing modes are enabled
    settings = _load_settings()

    # -------
    # STEP 1: Rule-based keyword matching (if enabled)
    # -------
    if settings.get("enable_rule_routing", True):
        keyword_result = route_by_keywords(classification_text)
        if keyword_result:
            keyword_result["language"] = language
            keyword_result["description_original"] = text
            keyword_result["description_translated"] = classification_text
            keyword_result["description_english"] = classification_text
            return keyword_result

    # -------
    # STEP 2: ML-based prediction (if enabled)
    # -------
    if ml_predictor and settings.get("enable_ai_routing", True):
        ml_result = route_by_ml_model(classification_text, ml_predictor)
        if ml_result:
            ml_result["language"] = language
            ml_result["description_original"] = text
            ml_result["description_translated"] = classification_text
            ml_result["description_english"] = classification_text
            return ml_result
    
    # -------
    # STEP 3: Fallback
    # -------
    fallback_result = route_fallback()
    fallback_result["language"] = language
    fallback_result["description_original"] = text
    fallback_result["description_translated"] = classification_text
    fallback_result["description_english"] = classification_text
    return fallback_result


# ================================================================
# CONVENIENCE FUNCTION: Integrate with existing predict_department
# ================================================================
def hybrid_predict_department(text: str, ml_predictor=None) -> str:
    """
    Simplified interface that returns only the department name.
    Maintains backward compatibility with existing code.
    """
    routing = route_complaint(text, ml_predictor)
    return routing["department"]
