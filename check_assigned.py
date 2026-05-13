from db import complaints_collection, users_collection

# Check all complaints
total_complaints = complaints_collection.count_documents({})
print(f'Total complaints in DB: {total_complaints}')

# Check assigned_to field
assigned = complaints_collection.count_documents({'assigned_to': {'$exists': True, '$ne': None}})
unassigned = complaints_collection.count_documents({'assigned_to': {'$exists': False}})
print(f'Complaints with assigned_to: {assigned}')
print(f'Complaints without assigned_to: {unassigned}')

# Get top staff
pipeline = [
    {'$match': {'assigned_to': {'$exists': True, '$ne': None}}},
    {'$group': {'_id': '$assigned_to', 'count': {'$sum': 1}}},
    {'$sort': {'count': -1}},
    {'$limit': 5}
]
results = list(complaints_collection.aggregate(pipeline))
if results:
    print('\nTop 5 staff by complaint count:')
    for r in results:
        staff = users_collection.find_one({'user_id': r['_id']})
        staff_name = staff.get('name', 'Unknown') if staff else 'Unknown'
        print(f'  {staff_name} ({r["_id"]}): {r["count"]} complaints')
else:
    print('\nNo staff have assigned complaints!')
