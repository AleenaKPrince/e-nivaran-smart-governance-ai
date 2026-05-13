DEFAULT_DEPARTMENT = "Unclassified"

# Domain label to keyword list. Water is mapped to a real department below.
KEYWORDS = {
    "Water": [
        "water",
        "pipe",
        "leak",
        "leakage",
        "supply",
        "pipeline",
        "tap",
        "drinking water",
        "water line",
    ],
    "Electricity": [
        "street light",
        "streetlight",
        "electricity",
        "power cut",
        "power outage",
        "transformer",
        "live wire",
        "short circuit",
        "voltage",
        "blackout",
    ],
    "Public Works": [
        "pothole",
        "road",
        "bridge",
        "construction",
        "damaged road",
        "pavement",
    ],
    "Local Self Government": [
        "garbage",
        "waste",
        "sewage",
        "drainage",
        "drain",
        "sanitation",
        "municipality",
        "panchayat",
    ],
    "Health": [
        "hospital",
        "doctor",
        "clinic",
        "medicine",
        "health",
    ],
    "Transport": [
        "bus",
        "traffic",
        "signal",
        "transport",
        "parking",
    ],
    "Fire and Rescue": [
        "fire",
        "smoke",
        "rescue",
        "explosion",
        "blast",
    ],
    "Police": [
        "theft",
        "robbery",
        "crime",
        "assault",
        "harassment",
        "police",
    ],
}

# Keep compatibility with the existing department list in the system.
DEPARTMENT_MAP = {
    "Water": "Local Self Government",
}


def keyword_based_department(text: str) -> str:
    normalized = (text or "").lower()

    # Water first so water pipeline complaints do not drift to electricity.
    search_order = ["Water"] + [k for k in KEYWORDS.keys() if k != "Water"]

    for label in search_order:
        for keyword in KEYWORDS.get(label, []):
            if keyword in normalized:
                return DEPARTMENT_MAP.get(label, label)

    return DEFAULT_DEPARTMENT
