import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

df = pd.read_csv("priority_dataset.csv")

X = df["description"]
y = df["priority"]

vectorizer = TfidfVectorizer(stop_words="english")
X_vec = vectorizer.fit_transform(X)

model = LogisticRegression()
model.fit(X_vec, y)

joblib.dump((vectorizer, model), "priority_model.pkl")

print("Priority model trained successfully")
