from db import users_collection

print('Staff users and stored password fields:\n')
for u in users_collection.find({'role': 'staff'}):
    name = u.get('name') or u.get('full_name') or 'N/A'
    email = u.get('email') or u.get('username') or 'N/A'
    pw = u.get('password') or u.get('password_hash') or u.get('hashed_password') or u.get('pwd') or 'N/A'
    print(f"Name: {name}")
    print(f"Email: {email}")
    print(f"Password field stored: {pw}")
    print('---')
