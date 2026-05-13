#!/usr/bin/env python
"""Test script to verify staff workload data is correct."""

import sys
sys.path.insert(0, r'c:\Users\mohdm\OneDrive\Desktop\ai_gov_platform\backend')

from db import users_collection, complaints_collection
from collections import defaultdict

# Updated departments matching database
DEPARTMENTS = {
    "Health",
    "Electricity Board",
    "Local Self Government",
    "Public Works",
    "Transport",
    "Fire and Rescue",
    "Police",
}

print("=" * 70)
print("STAFF WORKLOAD TEST")
print("=" * 70)

# Group staff by department
staff_by_department = {}

# Get all staff members
staff_members = list(users_collection.find(
    {"role": "staff"},
    {"_id": 0, "user_id": 1, "name": 1, "email": 1, "department": 1}
))

print(f"\nTotal staff in database: {len(staff_members)}\n")

for staff in staff_members:
    dept = staff.get("department")
    staff_id = staff.get("user_id")

    if dept not in staff_by_department:
        staff_by_department[dept] = []

    # Get workload for this staff member
    total_assigned = complaints_collection.count_documents({
        "assigned_to": staff_id
    })
    resolved = complaints_collection.count_documents({
        "assigned_to": staff_id,
        "status": "Resolved"
    })
    in_progress = complaints_collection.count_documents({
        "assigned_to": staff_id,
        "status": "In Progress"
    })

    staff_by_department[dept].append({
        "staff_id": staff_id,
        "name": staff.get("name"),
        "email": staff.get("email"),
        "total_assigned": total_assigned,
        "resolved": resolved,
        "in_progress": in_progress
    })

# Display by department
for dept in sorted(DEPARTMENTS):
    staff_list = staff_by_department.get(dept, [])
    print(f"\n📍 {dept}:")
    print(f"   Staff count: {len(staff_list)}")
    
    if staff_list:
        for staff in staff_list:
            print(f"   - {staff['name']} ({staff['email']})")
            print(f"     Total assigned: {staff['total_assigned']}, Resolved: {staff['resolved']}, In Progress: {staff['in_progress']}")
    else:
        print(f"   ⚠️  No staff found for this department")

print("\n" + "=" * 70)
print("✅ TEST COMPLETE")
print("=" * 70)
