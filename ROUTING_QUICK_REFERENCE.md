# HYBRID ROUTING SYSTEM - QUICK REFERENCE

## Files Changed

1. **`backend/utils/routing_service.py`** (NEW)
   - Core hybrid routing logic
   - Rule-based keyword matching
   - ML prediction with confidence gating
   - Department normalization

2. **`backend/ai/predict.py`** (UPDATED)
   - Added `predict_department_with_confidence()` for confidence scores
   - Enhanced error handling
   - Maintains backward compatibility

3. **`backend/routes/complaints.py`** (UPDATED)
   - Uses hybrid routing in `/complaint` POST endpoint
   - Stores routing metadata (confidence, mode, reason)
   - New response fields: `routing_mode`, `department_confidence`

---

## How It Works

### Routing Decision Tree

```
Complaint Text
    ↓
[STAGE 1: Rule-Based Keywords]
    ├─ Match Found? → Return RULE-routed department (confidence 0.85-0.95)
    └─ No Match? ↓
[STAGE 2: ML Prediction]
    ├─ Confidence ≥ 0.50? → Return AI-routed department
    └─ Confidence < 0.50? ↓
[STAGE 3: Fallback]
    └─ Return "Unclassified" (FALLBACK mode)
```

---

## Key Departments & Keywords

| Department | Example Keywords |
|-----------|-----------------|
| **Electricity** | streetlight, power, transformer, blackout, wire, fault |
| **Public Works** | pothole, road, pavement, crater, street, bridge |
| **Local Self Government** | garbage, waste, drainage, sanitation, sewer |
| **Health** | hospital, doctor, fever, medicine, emergency |
| **Fire and Rescue** | fire, accident, emergency, rescue, disaster |
| **Police** | theft, crime, robbery, violence, threat |
| **Transport** | bus, taxi, traffic, vehicle, parking |

---

## Confidence Scores

- **0.95** - Rule keyword matched (highest confidence)
- **0.60-0.85** - ML prediction accepted
- **< 0.50** - ML confidence too low, fallback to Unclassified
- **0.0** - Unclassified (manual review needed)

---

## Complaint Response Structure

```json
{
  "complaint_id": "uuid",
  "department": "Electricity",
  "department_confidence": 0.95,
  "routing_mode": "RULE",
  "priority": "High",
  "severity": 8.2
}
```

---

## Testing Examples

```python
# Test 1: Rule match (keyword found)
description = "Streetlight broken near market"
# → Electricity (confidence 0.95, mode RULE)

# Test 2: ML fallback (no keywords)
description = "Issue with administrative process"
# → Electricity/Health/etc (confidence 0.60+, mode AI) or Unclassified

# Test 3: Unclassified (low confidence)
description = "Something unclear"
# → Unclassified (confidence 0.0, mode FALLBACK)
```

---

## API Example

**Request:**
```
POST /complaint
{
  "user_id": "citizen_123",
  "description": "Streetlight not working"
}
```

**Response:**
```json
{
  "message": "Complaint submitted successfully",
  "complaint_id": "a1b2c3d4",
  "department": "Electricity",
  "department_confidence": 0.95,
  "routing_mode": "RULE",
  "priority": "High",
  "severity": 8.2
}
```

---

## Monitoring & Debugging

**Check routing accuracy:**
```
db.complaints.find({"routing_mode": "AI"})
db.complaints.find({"department": "Unclassified"})
```

**Sample complaint with metadata:**
```json
{
  "complaint_id": "...",
  "department": "Electricity",
  "department_confidence": 0.95,
  "routing_mode": "RULE",
  "routing_reason": "Matched keyword: 'streetlight'",
  "priority": "High",
  "severity": 8.2
}
```

---

## Benefits Summary

✅ **High Accuracy** - Keywords catch common complaints reliably
✅ **Explainable** - Every routing decision is documented
✅ **Reduced "Unclassified"** - Only when truly uncertain
✅ **Production Ready** - Deterministic, no random behavior
✅ **Backward Compatible** - Existing APIs unchanged

---

## For Developers

### Adding Keywords

Edit `KEYWORD_RULES` in `routing_service.py`:

```python
"MyDepartment": {
    "keywords": ["word1", "word2", "word3"],
    "confidence": 0.95,
    "routing_mode": "RULE"
}
```

### Changing ML Threshold

Edit `route_by_ml_model()`:

```python
CONFIDENCE_THRESHOLD = 0.50  # Adjust as needed
```

### Using the Router Directly

```python
from utils.routing_service import route_complaint
from ai.predict import predict_department_with_confidence

routing = route_complaint(
    text="Streetlight broken",
    ml_predictor=predict_department_with_confidence
)
print(routing["department"])        # "Electricity"
print(routing["routing_mode"])      # "RULE"
print(routing["routing_reason"])    # "Matched keyword: 'streetlight'"
```

---

## Documentation

See **`HYBRID_ROUTING_GUIDE.md`** for comprehensive documentation including:
- Detailed implementation guide
- All keywords per department
- Performance considerations
- Testing strategies
- Future improvements

---
