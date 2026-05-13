# ROUTING EXAMPLES - Real-World Test Cases

## Example Complaints and Expected Routing

---

## ✅ EXAMPLE 1: Clear Electricity Issue (Rule Match)

**Complaint:**
```
"The streetlight near my house is not working for 3 days.
 It's dark in the evening and very unsafe."
```

**Routing Decision:**
```
Stage: 1 (Rule-Based Keyword Matching)
Keyword Matched: "streetlight"
Department: Electricity
Confidence: 0.95
Routing Mode: RULE
Routing Reason: Matched keyword: 'streetlight'
```

**Response:**
```json
{
    "message": "Complaint submitted successfully",
    "complaint_id": "uuid-1234",
    "department": "Electricity",
    "department_confidence": 0.95,
    "routing_mode": "RULE",
    "priority": "High",
    "severity": 8.2
}
```

---

## ✅ EXAMPLE 2: Water Drainage Issue (Rule Match)

**Complaint:**
```
"There is severe water stagnation outside my house.
 The drainage pipe seems blocked. Getting mosquitoes everywhere."
```

**Routing Decision:**
```
Stage: 1 (Rule-Based Keyword Matching)
Keywords Matched: "water stagnation", "drainage"
Department: Local Self Government
Confidence: 0.95
Routing Mode: RULE
Routing Reason: Matched keyword: 'drainage'
```

**Response:**
```json
{
    "message": "Complaint submitted successfully",
    "complaint_id": "uuid-5678",
    "department": "Local Self Government",
    "department_confidence": 0.95,
    "routing_mode": "RULE",
    "priority": "High",
    "severity": 7.8
}
```

---

## ✅ EXAMPLE 3: Road Pothole (Rule Match)

**Complaint:**
```
"Large pothole on Main Street near traffic signal.
 It's causing vehicles to damage their tires.
 Please repair immediately."
```

**Routing Decision:**
```
Stage: 1 (Rule-Based Keyword Matching)
Keywords Matched: "pothole", "road"
Department: Public Works
Confidence: 0.95
Routing Mode: RULE
Routing Reason: Matched keyword: 'pothole'
```

**Response:**
```json
{
    "message": "Complaint submitted successfully",
    "complaint_id": "uuid-9999",
    "department": "Public Works",
    "department_confidence": 0.95,
    "routing_mode": "RULE",
    "priority": "High",
    "severity": 7.5
}
```

---

## ✅ EXAMPLE 4: Health Emergency (Rule Match)

**Complaint:**
```
"The hospital near our area is overcrowded.
 Waiting times are very long for emergency patients.
 This needs immediate attention."
```

**Routing Decision:**
```
Stage: 1 (Rule-Based Keyword Matching)
Keyword Matched: "hospital", "emergency"
Department: Health
Confidence: 0.95
Routing Mode: RULE
Routing Reason: Matched keyword: 'hospital'
```

**Response:**
```json
{
    "message": "Complaint submitted successfully",
    "complaint_id": "uuid-4567",
    "department": "Health",
    "department_confidence": 0.95,
    "routing_mode": "RULE",
    "priority": "Critical",
    "severity": 9.1
}
```

---

## ✅ EXAMPLE 5: Fire Safety (Rule Match)

**Complaint:**
```
"There was a small fire incident near the market this evening.
 Thank you to the fire department for quick response.
 But fire safety measures need improvement in the area."
```

**Routing Decision:**
```
Stage: 1 (Rule-Based Keyword Matching)
Keywords Matched: "fire"
Department: Fire and Rescue
Confidence: 0.90
Routing Mode: RULE
Routing Reason: Matched keyword: 'fire'
```

**Response:**
```json
{
    "message": "Complaint submitted successfully",
    "complaint_id": "uuid-7890",
    "department": "Fire and Rescue",
    "department_confidence": 0.90,
    "routing_mode": "RULE",
    "priority": "Critical",
    "severity": 8.9
}
```

---

## ⚠️ EXAMPLE 6: Vague Complaint (ML Fallback)

**Complaint:**
```
"The situation in our locality has been deteriorating.
 Things are not as good as they used to be.
 Something needs to be done about it."
```

**Routing Decision:**
```
Stage: 1 (Rule-Based Keyword Matching)
Result: NO keywords matched
→ Proceed to Stage 2

Stage: 2 (ML Prediction)
ML Prediction: "Electricity" with confidence 0.35
Result: Confidence 0.35 < Threshold 0.50
→ Proceed to Stage 3

Stage: 3 (Fallback)
Department: Unclassified
Confidence: 0.0
Routing Mode: FALLBACK
Routing Reason: No rule or ML match found. Manual review needed.
```

**Response:**
```json
{
    "message": "Complaint submitted successfully",
    "complaint_id": "uuid-2468",
    "department": "Unclassified",
    "department_confidence": 0.0,
    "routing_mode": "FALLBACK",
    "priority": "Low",
    "severity": 3.2,
    "note": "This complaint requires manual review and assignment"
}
```

---

## ⚠️ EXAMPLE 7: Ambiguous but ML-Acceptable (AI Mode)

**Complaint:**
```
"The bus service quality has declined significantly.
 Routes are getting delayed often.
 Please look into this matter urgently."
```

**Routing Decision:**
```
Stage: 1 (Rule-Based Keyword Matching)
Keywords: "bus" found
Department: Transport
Confidence: 0.85
Routing Mode: RULE
Routing Reason: Matched keyword: 'bus'
```

**Response:**
```json
{
    "message": "Complaint submitted successfully",
    "complaint_id": "uuid-3579",
    "department": "Transport",
    "department_confidence": 0.85,
    "routing_mode": "RULE",
    "priority": "Medium",
    "severity": 6.1
}
```

---

## 🚨 EXAMPLE 8: Crime Report (Rule Match)

**Complaint:**
```
"There was a theft incident near my shop last night.
 Someone stole items worth Rs. 50,000.
 I want to file an official complaint."
```

**Routing Decision:**
```
Stage: 1 (Rule-Based Keyword Matching)
Keywords Matched: "theft", "crime"
Department: Police
Confidence: 0.90
Routing Mode: RULE
Routing Reason: Matched keyword: 'theft'
```

**Response:**
```json
{
    "message": "Complaint submitted successfully",
    "complaint_id": "uuid-7531",
    "department": "Police",
    "department_confidence": 0.90,
    "routing_mode": "RULE",
    "priority": "High",
    "severity": 8.5
}
```

---

## 📊 ROUTING STATISTICS (Expected)

### Based on 1000 Sample Complaints:

```
Routing Mode Distribution:
┌──────────────────────────┬───────┐
│ RULE (Keywords matched)  │ 650   │ (65%)
│ AI (ML prediction)       │ 200   │ (20%)
│ FALLBACK (Unclassified)  │ 150   │ (15%)
└──────────────────────────┴───────┘

Department Distribution (after routing):
┌──────────────────────────┬───────┐
│ Electricity              │ 220   │ (22%)
│ Public Works             │ 180   │ (18%)
│ Local Self Government    │ 210   │ (21%)
│ Health                   │ 150   │ (15%)
│ Transport                │ 90    │ (9%)
│ Police                   │ 60    │ (6%)
│ Fire and Rescue          │ 30    │ (3%)
│ Unclassified             │ 60    │ (6%)
└──────────────────────────┴───────┘

Confidence Score Distribution:
┌──────────────────────────┬───────┐
│ 0.90 - 0.99              │ 650   │ (65%) - Rule matches
│ 0.60 - 0.89              │ 200   │ (20%) - ML predictions
│ 0.00 - 0.50              │ 150   │ (15%) - Unclassified
└──────────────────────────┴───────┘

Average Confidence: 0.82
```

---

## 🎯 PERFORMANCE METRICS

### Expected Improvements:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Correct routing (%) | 60% | 85% | +25% |
| Unclassified rate (%) | 35% | 5% | -86% |
| Rule-matched (%) | 0% | 65% | +65% |
| ML fallback (%) | 100% | 20% | -80% |
| Avg confidence | 0.45 | 0.82 | +82% |
| Processing time (ms) | 80 | 15 | -81% |

---

## ✅ KEY TAKEAWAYS

1. **Rule-based keywords work extremely well** for common civic issues
2. **ML model is used as fallback**, reducing its burden
3. **Confidence scores provide transparency** to staff
4. **"Unclassified" becomes truly exceptional**, not common
5. **Explainability helps with auditing and improvement**

---

## 📋 TESTING CHECKLIST

When deploying, verify these examples produce expected routing:

- [ ] Streetlight → Electricity (RULE, 0.95)
- [ ] Pothole → Public Works (RULE, 0.95)
- [ ] Garbage/Waste → Local Self Government (RULE, 0.95)
- [ ] Hospital/Doctor → Health (RULE, 0.95)
- [ ] Fire → Fire and Rescue (RULE, 0.90)
- [ ] Theft/Crime → Police (RULE, 0.90)
- [ ] Bus/Traffic → Transport (RULE, 0.85)
- [ ] Vague/Unclear → Unclassified (FALLBACK, 0.0)
- [ ] Multiple keywords → Highest priority department
- [ ] Empty text → Unclassified (FALLBACK, 0.0)

---

## 🔧 DEBUGGING EXAMPLES

### Check a complaint's routing:

```javascript
db.complaints.findOne({"complaint_id": "uuid-1234"})
// Should show:
// - department: "Electricity"
// - routing_mode: "RULE"
// - routing_reason: "Matched keyword: 'streetlight'"
// - department_confidence: 0.95
```

### Find all unclassified for manual review:

```javascript
db.complaints.find({
    "department": "Unclassified",
    "routing_mode": "FALLBACK"
}).sort({"created_at": -1})
```

### Check routing accuracy by department:

```javascript
db.complaints.aggregate([
    {
        "$group": {
            "_id": "$department",
            "total": {"$sum": 1},
            "rule_count": {
                "$sum": {"$cond": [{"$eq": ["$routing_mode", "RULE"]}, 1, 0]}
            },
            "ai_count": {
                "$sum": {"$cond": [{"$eq": ["$routing_mode", "AI"]}, 1, 0]}
            },
            "avg_confidence": {"$avg": "$department_confidence"}
        }
    }
])
```

---

## 📞 SUPPORT

If a complaint is misrouted:

1. Check the `routing_reason` field for explanation
2. If RULE mode: Check if keyword list needs updating
3. If AI mode: ML model may need review
4. If FALLBACK: Add keywords or manually review
5. Use metrics above to identify patterns

---
