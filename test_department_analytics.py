#!/usr/bin/env python
"""Test the updated department analytics."""

import sys
sys.path.insert(0, r'c:\Users\mohdm\OneDrive\Desktop\ai_gov_platform\backend')

from db import complaints_collection

DEPARTMENTS = {
    "Health",
    "Electricity Board",
    "Local Self Government",
    "Public Works",
    "Transport",
    "Fire and Rescue",
    "Police",
}

print("\n" + "=" * 70)
print("UPDATED DEPARTMENT-WISE ANALYTICS")
print("=" * 70)
print(f"\n{'Department':<25} {'Total':>8} {'In Prog':>10} {'Resolved':>10} {'Unassigned':>12}")
print("-" * 70)

total_all = 0
for dept in sorted(DEPARTMENTS):
    total = complaints_collection.count_documents({"department": dept})
    in_progress = complaints_collection.count_documents({
        "department": dept,
        "status": "In Progress"
    })
    resolved = complaints_collection.count_documents({
        "department": dept,
        "status": "Resolved"
    })
    unassigned = complaints_collection.count_documents({
        "department": dept,
        "status": "Submitted"
    })
    
    total_all += total
    print(f"{dept:<25} {total:>8} {in_progress:>10} {resolved:>10} {unassigned:>12}")

print("-" * 70)
print(f"{'TOTAL':<25} {total_all:>8}")
print("=" * 70)
