from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["ai_gov"]

users_collection = db["users"]
citizens_collection = db["citizens"]
complaints_collection = db["complaints"]
settings_collection = db["system_settings"]
