import joblib
import os
import numpy as np
import pandas as pd

from ai.preprocess import preprocess

# Get absolute path of current directory (ai folder)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths to trained model artifacts
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "vectorizer.pkl")
DATASET_PATH = os.path.join(BASE_DIR, "complaints_dataset.csv")
CONFIDENCE_THRESHOLD = 0.25

# Load trained ML model + vectorizer
model = None
vectorizer = None
try:
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
except Exception:
    model = None
    vectorizer = None

# Exact-match map from training sentences
_exact_match_map = {}
try:
    _df = pd.read_csv(DATASET_PATH, encoding="utf-8")
    _df["text"] = _df["text"].astype(str).map(preprocess)
    _df["department"] = _df["department"].astype(str).str.strip()
    _exact_match_map = dict(zip(_df["text"], _df["department"]))
except Exception:
    _exact_match_map = {}


def predict_department(text: str) -> str:
    """
    Predict the department for a given complaint text.
    Returns department name as string.
    
    This function maintains backward compatibility with existing code.
    For enhanced routing with confidence scores, use predict_department_with_confidence().
    """
    if not text or not isinstance(text, str):
        return "Unclassified"
    
    if not model or not vectorizer:
        return "Unclassified"
    
    try:
        normalized = preprocess(text)
        if normalized in _exact_match_map:
            return _exact_match_map[normalized]

        text_vec = vectorizer.transform([normalized])
        prediction = model.predict(text_vec)[0]
        return str(prediction) if prediction else "Unclassified"
    except Exception:
        return "Unclassified"


def predict_department_with_confidence(text: str) -> tuple:
    """
    Predict department with confidence score.
    
    Returns:
        Tuple of (department_name, confidence_score)
        confidence_score: float between 0.0 and 1.0
    """
    if not text or not isinstance(text, str):
        return ("Unclassified", 0.0)
    
    if not model or not vectorizer:
        return ("Unclassified", 0.0)
    
    try:
        normalized = preprocess(text)

        # Exact training sentence match should never fallback.
        if normalized in _exact_match_map:
            return (str(_exact_match_map[normalized]), 1.0)

        text_vec = vectorizer.transform([normalized])
        probs = model.predict_proba(text_vec)[0]
        max_confidence = float(np.max(probs))
        prediction = model.classes_[int(np.argmax(probs))]

        if max_confidence < CONFIDENCE_THRESHOLD:
            return ("Unclassified", max_confidence)

        return (str(prediction), max_confidence)
    
    except Exception:
        return ("Unclassified", 0.0)
