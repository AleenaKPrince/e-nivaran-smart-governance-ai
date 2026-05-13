import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import pickle

# Load data
df = pd.read_csv("complaints_dataset.csv")

texts = df["text"].tolist()
departments = df["department"].tolist()

# Load BERT model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Convert text → vectors
embeddings = model.encode(texts)

# Create search index
index = faiss.IndexFlatL2(384)
index.add(embeddings)

# Save AI assets
pickle.dump(index, open("faiss_index.pkl", "wb"))
pickle.dump(departments, open("departments.pkl", "wb"))
pickle.dump(texts, open("texts.pkl", "wb"))

print("AI Model Trained Successfully")
