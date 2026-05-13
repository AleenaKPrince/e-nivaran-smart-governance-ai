from db import complaints_collection

staff_id = "8ff23058-143a-4190-b282-90446fc3bb3e"

# Get complaints
complaints = list(complaints_collection.find(
    {"assigned_to": staff_id}
).sort("created_at", -1))

print(f"Found {len(complaints)} complaints")

if complaints:
    print("\nFirst complaint fields:")
    c = complaints[0]
    for k, v in c.items():
        print(f"  {k}: {type(v).__name__}")
        
    # Test the data cleaning
    print("\nProcessing first complaint:")
    c_copy = dict(c)
    c_copy.pop("_id", None)
    c_copy.pop("history", None)
    if "created_at" in c_copy and hasattr(c_copy["created_at"], "isoformat"):
        c_copy["created_at"] = c_copy["created_at"].isoformat()
    if "assigned_at" in c_copy and hasattr(c_copy["assigned_at"], "isoformat"):
        c_copy["assigned_at"] = c_copy["assigned_at"].isoformat()
    
    print("✅ Cleaned successfully")
else:
    print("No complaints found for this staff")
