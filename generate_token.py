import jwt
from datetime import datetime, timedelta
from config import SECRET_KEY
from db import users_collection

# Get a staff member's ID
staff = users_collection.find_one({'role': 'staff'})

if staff:
    user_id = staff['user_id']
    
    # Create a JWT token (same logic as in the app)
    payload = {
        'user_id': user_id,
        'role': 'staff',
        'exp': datetime.utcnow() + timedelta(hours=2)
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    
    print(f'Staff ID: {user_id}')
    print(f'Staff Name: {staff.get("name")}')
    print(f'Token: {token}')
else:
    print('No staff found')
