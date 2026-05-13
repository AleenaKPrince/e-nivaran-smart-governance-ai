from db import complaints_collection, users_collection

# Get a staff member
staff = users_collection.find_one({'role': 'staff'})
if staff:
    staff_id = staff['user_id']
    print(f'Staff ID: {staff_id}')
    print(f'Staff Name: {staff.get("name")}')
    
    # Count complaints assigned to them
    count = complaints_collection.count_documents({'assigned_to': staff_id})
    print(f'Complaints assigned: {count}')
    
    # Show sample
    sample = complaints_collection.find_one({'assigned_to': staff_id})
    if sample:
        print(f'\nSample complaint:')
        print(f'  ID: {sample.get("complaint_id")}')
        print(f'  Status: {sample.get("status")}')
        print(f'  Priority: {sample.get("priority")}')
        print(f'  Department: {sample.get("department")}')
    else:
        print('No complaints assigned to this staff member')
else:
    print('No staff found in database')
