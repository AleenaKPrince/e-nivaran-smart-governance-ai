#!/usr/bin/env python
"""Check all department names in complaints."""

import sys
sys.path.insert(0, r'c:\Users\mohdm\OneDrive\Desktop\ai_gov_platform\backend')

from db import complaints_collection

print("\n" + "=" * 70)
print("COMPLAINT DEPARTMENTS BREAKDOWN")
print("=" * 70)

# Get all distinct departments
all_depts = complaints_collection.distinct('department')

print(f"\nTotal distinct departments in complaints: {len(all_depts)}\n")

for dept in sorted(all_depts):
    count = complaints_collection.count_documents({"department": dept})
    assigned = complaints_collection.count_documents({"department": dept, "assigned_to": {"$exists": True}})
    unassigned = count - assigned
    print(f"{dept:<30} Total: {count:>3}  Assigned: {assigned:>3}  Unassigned: {unassigned:>3}")

print("\n" + "=" * 70)
