from utils.jwt_utils import decode_token

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGZmMjMwNTgtMTQzYS00MTkwLWIyODItOTA0NDZmYzNiYjNlIiwicm9sZSI6InN0YWZmIiwiZXhwIjoxNzcwNjQzMTk5fQ.bJQyYvpKw2HuKqUG6m3JOsyyWCYsRiITy9Qm8-MFbFc"

decoded = decode_token(token)
if decoded:
    print("✅ Token decoded:")
    for k, v in decoded.items():
        print(f"  {k}: {v}")
else:
    print("❌ Token decode failed")
