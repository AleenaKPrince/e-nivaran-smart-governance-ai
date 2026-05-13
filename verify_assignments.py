#!/usr/bin/env python
"""Verify all complaints are now assigned."""

import sys
sys.path.insert(0, r'c:\Users\mohdm\OneDrive\Desktop\ai_gov_platform\backend')

from db import complaints_collection

print("\n" + "=" * 70)
print("COMPLAINT ASSIGNMENT VERIFICATION")
print("=" * 70)

# Total unassigned
unassigned = complaints_collection.count_documents({'assigned_to': {'$exists': False}})
print(f"\n✅ Unassigned complaints: {unassigned}")

# Total assigned
assigned = complaints_collection.count_documents({'assigned_to': {'$exists': True}})
print(f"✅ Assigned complaints: {assigned}")

# By status
submitted = complaints_collection.count_documents({'status': 'Submitted'})
in_progress = complaints_collection.count_documents({'status': 'In Progress'})
resolved = complaints_collection.count_documents({'status': 'Resolved'})

print(f"\nBy Status:")
print(f"  • Submitted (typically unassigned): {submitted}")
print(f"  • In Progress: {in_progress}")
print(f"  • Resolved: {resolved}")

total = submitted + in_progress + resolved
print(f"\nTotal Complaints: {total}")

print("\n" + "=" * 70)
if unassigned == 0 and assigned > 0:
    print("✅ SUCCESS: ALL COMPLAINTS ARE ASSIGNED!")
else:
    print(f"⚠️  WARNING: {unassigned} complaints still unassigned")
print("=" * 70)
