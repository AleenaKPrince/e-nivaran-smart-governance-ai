import os

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from ai.preprocess import preprocess

BASE = os.path.dirname(__file__)
DATASET_PATH = os.path.join(BASE, "complaints_dataset.csv")
MODEL_PATH = os.path.join(BASE, "model.pkl")
VECTORIZER_PATH = os.path.join(BASE, "vectorizer.pkl")
VALID_DEPARTMENTS = {
    "Electricity",
    "Health",
    "Local Self Government",
    "Public Works",
    "Transport",
    "Fire and Rescue",
    "Police",
}


def train():
    df = pd.read_csv(DATASET_PATH, encoding="utf-8")
    df["text"] = df["text"].astype(str).map(preprocess)
    df["department"] = df["department"].astype(str).str.strip()

    invalid_labels = sorted(set(df["department"]) - VALID_DEPARTMENTS)
    if invalid_labels:
        raise ValueError(f"Invalid department labels in dataset: {invalid_labels}")

    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    stop_words=None,
                    lowercase=True,
                ),
            ),
            ("clf", LogisticRegression(max_iter=2000)),
        ]
    )

    pipeline.fit(df["text"], df["department"])

    # Save split artifacts as requested.
    vectorizer = pipeline.named_steps["tfidf"]
    model = pipeline.named_steps["clf"]
    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)

    print("Department model trained successfully")
    print("Classes:", sorted(model.classes_.tolist()))


if __name__ == "__main__":
    train()
