from db import complaints_collection, users_collection

# Get staff with complaints
pipeline = [
    {'$match': {'assigned_to': {'$exists': True, '$ne': None}}},
    {'$group': {'_id': '$assigned_to', 'count': {'$sum': 1}}},
    {'$sort': {'count': -1}},
    {'$limit': 1}
]
result = list(complaints_collection.aggregate(pipeline))

if result:
    staff_id = result[0]['_id']
    print(f"Staff ID: {staff_id}")
    
    # Get staff info
    staff = users_collection.find_one({'user_id': staff_id})
    if staff:
        print(f"Staff Name: {staff.get('name')}")
        print(f"Department: {staff.get('department')}")
        
        # Generate token for this staff
        from config import SECRET_KEY
        import jwt
        from datetime import datetime, timedelta
        
        payload = {
            'user_id': staff_id,
            'role': 'staff',
            'exp': datetime.utcnow() + timedelta(hours=2)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        print(f"\nToken: {token}")
        
        # Get their complaints
        complaints = list(complaints_collection.find({'assigned_to': staff_id}))
        print(f"Complaints assigned: {len(complaints)}")
else:
    print("No staff with assigned complaints found")
