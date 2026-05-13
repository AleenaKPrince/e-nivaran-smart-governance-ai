#!/usr/bin/env python
"""
SYSTEM SETTINGS DEMONSTRATION
==============================
This script shows how the new admin settings system works.
"""

import sys
sys.path.insert(0, r'c:\Users\mohdm\OneDrive\Desktop\ai_gov_platform\backend')

from db import settings_collection

# Default settings structure
DEFAULT_SETTINGS = {
    "ai_confidence_threshold": 0.5,
    "enable_ai_routing": True,
    "enable_rule_routing": True,
    "priority_rules": [
        {"name": "Low", "min": 0, "max": 3},
        {"name": "Medium", "min": 4, "max": 6},
        {"name": "High", "min": 7, "max": 8},
        {"name": "Critical", "min": 9, "max": 10},
    ],
    "auto_assign": False,
    "allow_manual_override": True,
    "default_unclassified_department": "Health",
    "allow_reassignment": True,
    "lock_after_resolution": False,
}

print("\n" + "="*70)
print("SYSTEM SETTINGS DEMO")
print("="*70)

# Initialize default settings
print("\n[1] Initializing default system settings...")
result = settings_collection.replace_one({}, DEFAULT_SETTINGS, upsert=True)
print(f"    ✅ Upserted settings document")

# Fetch and display
doc = settings_collection.find_one({})
doc.pop("_id", None)

print("\n[2] Current system settings:")
import json
print(json.dumps(doc, indent=2))

print("\n[3] Settings structure breakdown:")
print(f"    ✅ Routing Configuration:")
print(f"       - AI Confidence Threshold: {doc['ai_confidence_threshold']}")
print(f"       - AI Routing Enabled: {doc['enable_ai_routing']}")
print(f"       - Rule-based Routing Enabled: {doc['enable_rule_routing']}")
print(f"\n    ✅ Priority Configuration:")
for rule in doc['priority_rules']:
    print(f"       - {rule['name']}: {rule['min']}-{rule['max']}")
print(f"\n    ✅ Assignment Configuration:")
print(f"       - Auto-assign: {doc['auto_assign']}")
print(f"       - Allow Manual Override: {doc['allow_manual_override']}")
print(f"       - Default Unclassified Dept: {doc['default_unclassified_department']}")
print(f"\n    ✅ System Behavior:")
print(f"       - Allow Reassignment: {doc['allow_reassignment']}")
print(f"       - Lock After Resolution: {doc['lock_after_resolution']}")

print("\n[4] Testing dynamic update...")
updated = {**doc, "ai_confidence_threshold": 0.75}
settings_collection.replace_one({}, updated, upsert=True)
doc_updated = settings_collection.find_one({})
print(f"    ✅ New AI confidence threshold: {doc_updated['ai_confidence_threshold']}")

print("\n" + "="*70)
print("✅ SYSTEM SETTINGS READY")
print("="*70)
print("\nAccess via API:")
print("  GET  /admin/settings       → Fetch current settings")
print("  POST /admin/settings       → Update settings")
print("\nFrontend page: http://localhost:5174/admin/settings")
print("\n")
