"""
Seed Staff and Assign Complaints Script
========================================
Creates 2 staff members for each department and assigns unassigned complaints
to appropriate staff using round-robin distribution.

Usage:
  python seed_staff_and_assign.py
"""

import sys
sys.path.insert(0, r'c:\Users\mohdm\OneDrive\Desktop\ai_gov_platform\backend')

from db import users_collection, complaints_collection
from utils.password_handler import hash_password
import uuid
from datetime import datetime

# =================================================
# CONFIGURATION
# =================================================

DEPARTMENTS = [
    "Health",
    "Electricity Board",
    "Local Self Government",
    "Public Works",
    "Transport",
    "Fire and Rescue",
    "Police"
]

STAFF_PASSWORD = "Smart@123"

# Department mapping: normalize complaint department names to staff department names
DEPARTMENT_MAPPING = {
    "Health": "Health",
    "Health Department": "Health",
    "Electricity": "Electricity Board",
    "Electricity Board": "Electricity Board",
    "Fire Department": "Fire and Rescue",
    "Fire and Rescue": "Fire and Rescue",
    "Local Self Government": "Local Self Government",
    "Local Self-Government": "Local Self Government",
    "Police": "Police",
    "Public Works": "Public Works",
    "Transport": "Transport",
    "Sanitation": "Public Works",  # Map Sanitation to Public Works
    "Unclassified": "Health",  # Map unclassified to Health by default
}

# =================================================
# CREATE STAFF MEMBERS
# =================================================

def create_staff_for_department(department):
    """
    Create 2 staff members for a given department.
    Returns list of staff IDs created or None if already exists.
    """
    staff_created = []
    
    for i in range(1, 3):  # staff1, staff2
        email = f"staff{i}@{department.lower().replace(' ', '')}.com"
        
        # Check if staff already exists
        existing = users_collection.find_one({"email": email})
        if existing:
            print(f"  ⚠️  Staff already exists: {email}")
            staff_created.append(existing["user_id"])
            continue
        
        # Create staff document
        staff = {
            "user_id": str(uuid.uuid4()),
            "name": f"Staff {i} - {department}",
            "email": email,
            "password": hash_password(STAFF_PASSWORD),
            "role": "staff",
            "department": department,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        try:
            users_collection.insert_one(staff)
            staff_created.append(staff["user_id"])
            print(f"  ✅ Created: {email}")
        except Exception as e:
            print(f"  ❌ Error creating {email}: {e}")
    
    return staff_created

def seed_all_staff():
    """Create 2 staff members for each department."""
    print("\n" + "=" * 70)
    print("SEEDING STAFF MEMBERS")
    print("=" * 70)
    print(f"\nPassword (all staff): {STAFF_PASSWORD}\n")
    
    staff_by_department = {}
    
    for department in DEPARTMENTS:
        print(f"\n📍 {department}:")
        staff_ids = create_staff_for_department(department)
        staff_by_department[department] = staff_ids
    
    return staff_by_department


# =================================================
# ASSIGN UNASSIGNED COMPLAINTS
# =================================================

def assign_complaints_to_staff(staff_by_department):
    """
    Assign unassigned complaints to appropriate staff using round-robin.
    Uses department mapping to normalize complaint departments to staff departments.
    """
    print("\n" + "=" * 70)
    print("ASSIGNING UNASSIGNED COMPLAINTS")
    print("=" * 70)
    
    total_assigned = 0
    assignment_log = {}
    
    # Get all unassigned complaints first (regardless of department)
    all_unassigned = list(complaints_collection.find({
        "assigned_to": {"$exists": False}
    }))
    
    print(f"\nTotal unassigned complaints found: {len(all_unassigned)}")
    
    # Group complaints by mapped department
    complaints_by_mapped_dept = {}
    for complaint in all_unassigned:
        complaint_dept = complaint.get("department", "Unclassified")
        # Normalize department name using mapping
        mapped_dept = DEPARTMENT_MAPPING.get(complaint_dept, complaint_dept)
        
        if mapped_dept not in complaints_by_mapped_dept:
            complaints_by_mapped_dept[mapped_dept] = []
        complaints_by_mapped_dept[mapped_dept].append(complaint)
    
    # For each department, assign complaints to staff
    for mapped_dept in DEPARTMENTS:
        unassigned = complaints_by_mapped_dept.get(mapped_dept, [])
        
        if not unassigned:
            print(f"\n✓ {mapped_dept}: No unassigned complaints")
            continue
        
        # Get staff for this department
        staff_ids = staff_by_department.get(mapped_dept, [])
        if not staff_ids:
            print(f"\n⚠️  {mapped_dept}: No staff available - skipping {len(unassigned)} complaints")
            continue
        
        # Round-robin assign complaints to staff
        assignment_count = {staff_id: 0 for staff_id in staff_ids}
        
        for idx, complaint in enumerate(unassigned):
            # Round-robin selection
            staff_idx = idx % len(staff_ids)
            assigned_staff_id = staff_ids[staff_idx]
            
            # Update complaint with assignment
            try:
                complaints_collection.update_one(
                    {"complaint_id": complaint["complaint_id"]},
                    {
                        "$set": {
                            "assigned_to": assigned_staff_id,
                            "assigned_at": datetime.utcnow()
                        }
                    }
                )
                assignment_count[assigned_staff_id] += 1
                total_assigned += 1
            except Exception as e:
                print(f"  ❌ Error assigning {complaint['complaint_id']}: {e}")
        
        # Log assignment statistics
        print(f"\n✅ {mapped_dept}: {len(unassigned)} complaints assigned")
        for staff_id in staff_ids:
            count = assignment_count[staff_id]
            staff = users_collection.find_one({"user_id": staff_id})
            email = staff.get("email") if staff else "Unknown"
            print(f"     • {email}: {count} complaints")
        
        assignment_log[mapped_dept] = assignment_count
    
    return total_assigned, assignment_log


# =================================================
# DISPLAY SUMMARY
# =================================================

def display_summary():
    """Display summary of created staff and assigned complaints."""
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    # Count staff by role
    staff_count = users_collection.count_documents({"role": "staff"})
    admin_count = users_collection.count_documents({"role": "admin"})
    
    print(f"\n📊 Users:")
    print(f"   Staff members: {staff_count}")
    print(f"   Admins: {admin_count}")
    
    # Count complaints by assignment status
    assigned_count = complaints_collection.count_documents({"assigned_to": {"$exists": True}})
    unassigned_count = complaints_collection.count_documents({"assigned_to": {"$exists": False}})
    total_complaints = complaints_collection.count_documents({})
    
    print(f"\n📋 Complaints:")
    print(f"   Total: {total_complaints}")
    print(f"   Assigned: {assigned_count}")
    print(f"   Unassigned: {unassigned_count}")
    
    # Staff details
    print(f"\n👥 Staff Members by Department:")
    print("-" * 70)
    for department in DEPARTMENTS:
        staff_list = list(users_collection.find({
            "role": "staff",
            "department": department
        }, {"_id": 0, "email": 1, "user_id": 1}))
        
        if staff_list:
            print(f"\n{department}:")
            for staff in staff_list:
                complaint_count = complaints_collection.count_documents({
                    "assigned_to": staff["user_id"]
                })
                print(f"  • {staff['email']} ({complaint_count} complaints)")
        else:
            print(f"\n{department}: ⚠️  No staff")
    
    print("\n" + "=" * 70)
    print("✅ SETUP COMPLETE!")
    print("=" * 70)
    print(f"\nLogin credentials for demo:")
    print(f"  Password: {STAFF_PASSWORD}")
    print(f"\nExample staff email: staff1@health.com")


# =================================================
# VERIFY DATA
# =================================================

def verify_no_duplicates():
    """Verify no duplicate staff were created."""
    print("\n" + "=" * 70)
    print("VERIFICATION: Checking for duplicates...")
    print("=" * 70)
    
    for department in DEPARTMENTS:
        for i in range(1, 3):
            email = f"staff{i}@{department.lower().replace(' ', '')}.com"
            count = users_collection.count_documents({"email": email})
            if count > 1:
                print(f"\n❌ DUPLICATE FOUND: {email} appears {count} times!")
                return False
            elif count == 1:
                print(f"  ✓ {email}: 1 record")
    
    print("\n✅ No duplicates found!")
    return True


def verify_assignments():
    """Verify all unassigned complaints are now assigned."""
    print("\n" + "=" * 70)
    print("VERIFICATION: Checking complaint assignments...")
    print("=" * 70)
    
    # Check for unassigned complaints (excluding Unclassified)
    unassigned_check = list(complaints_collection.find({
        "assigned_to": {"$exists": False},
        "department": {"$ne": "Unclassified"}
    }))
    
    if unassigned_check:
        print(f"\n⚠️  Found {len(unassigned_check)} unassigned complaints:")
        for complaint in unassigned_check[:5]:  # Show first 5
            print(f"  • {complaint.get('complaint_id')}: {complaint.get('department')}")
        return False
    
    print("\n✅ All complaints assigned!")
    return True


# =================================================
# MAIN EXECUTION
# =================================================

if __name__ == "__main__":
    print("\n" + "🚀 " * 20)
    print("STAFF SEEDING & COMPLAINT ASSIGNMENT UTILITY")
    print("🚀 " * 20)
    
    try:
        # Step 1: Seed staff
        staff_by_department = seed_all_staff()
        
        # Step 2: Assign complaints
        total_assigned, assignment_log = assign_complaints_to_staff(staff_by_department)
        
        # Step 3: Display summary
        display_summary()
        
        # Step 4: Verify data integrity
        print()
        verify_no_duplicates()
        verify_assignments()
        
        print("\n" + "=" * 70)
        print("🎉 ALL OPERATIONS COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

