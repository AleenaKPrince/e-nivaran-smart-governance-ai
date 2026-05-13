# Chatbot Test Cases (English + Malayalam)

## Goal
Validate that chatbot intent detection, language behavior, and drafting state flow work as implemented.

## Intents Under Test
- `emergency_help`
- `greeting`
- `casual_talk`
- `file_complaint`
- `complaint_draft_help`
- `complaint_documents_help`
- `check_status`
- `status_id_help`
- `thanks`
- `goodbye`
- `general`
- `fallback`

## A) Intent Mapping Cases (48 prompts)

| # | Prompt | Expected Intent |
|---|---|---|
| 1 | hello | greeting |
| 2 | hi | greeting |
| 3 | good morning | greeting |
| 4 | നമസ്കാരം | greeting |
| 5 | ഹലോ | greeting |
| 6 | how are you | casual_talk |
| 7 | who are you | casual_talk |
| 8 | what can you do | casual_talk |
| 9 | നിങ്ങൾ ആരാണ് | casual_talk |
| 10 | നിങ്ങൾക്ക് എന്ത് ചെയ്യാം | casual_talk |
| 11 | file complaint | file_complaint |
| 12 | submit complaint | file_complaint |
| 13 | register complaint | file_complaint |
| 14 | report issue | file_complaint |
| 15 | പരാതി നൽകണം | file_complaint |
| 16 | പരാതി രജിസ്റ്റർ ചെയ്യണം | file_complaint |
| 17 | റോഡിൽ വെള്ളം കെട്ടിയിരിക്കുന്നു | file_complaint |
| 18 | street light not working near market | file_complaint |
| 19 | drainage blocked in my area | file_complaint |
| 20 | draft complaint | complaint_draft_help |
| 21 | complaint format | complaint_draft_help |
| 22 | how to write complaint | complaint_draft_help |
| 23 | പരാതി ഡ്രാഫ്റ്റ് | complaint_draft_help |
| 24 | പരാതി എഴുതാൻ സഹായിക്കൂ | complaint_draft_help |
| 25 | documents needed | complaint_documents_help |
| 26 | what proof needed | complaint_documents_help |
| 27 | can i attach files | complaint_documents_help |
| 28 | എന്ത് രേഖകൾ വേണം | complaint_documents_help |
| 29 | തെളിവ് വേണോ | complaint_documents_help |
| 30 | check status | check_status |
| 31 | track complaint | check_status |
| 32 | complaint status | check_status |
| 33 | സ്റ്റാറ്റസ് | check_status |
| 34 | പരാതിയുടെ നില | check_status |
| 35 | complaint id format | status_id_help |
| 36 | where is complaint id | status_id_help |
| 37 | how to find complaint id | status_id_help |
| 38 | പരാതി ഐഡി എവിടെ | status_id_help |
| 39 | ഐഡി ഫോർമാറ്റ് | status_id_help |
| 40 | emergency | emergency_help |
| 41 | urgent help | emergency_help |
| 42 | accident happened | emergency_help |
| 43 | അടിയന്തിരം | emergency_help |
| 44 | അപകടം | emergency_help |
| 45 | thanks | thanks |
| 46 | നന്ദി | thanks |
| 47 | goodbye | goodbye |
| 48 | ശരി കാണാം | goodbye |

## B) General + Fallback Cases

| Prompt | Expected Intent |
|---|---|
| help | general |
| guide me | general |
| services | general |
| സഹായം | general |
| എങ്ങനെ സഹായിക്കും | general |
| qwerty zzzz | fallback |
| 12345 ??? | fallback |
| lorem ipsum abc | fallback |

## C) Drafting State Flow (English)
Use same `session_id` for all steps.

1. `file complaint` -> intent `file_complaint`, state `COLLECT_WHAT`
2. `Street light not working for 2 days` -> state `COLLECT_WHERE`
3. `Near central market junction` -> state `COLLECT_WHEN`
4. `Since yesterday night` -> state `CONFIRM` + summary
5. `confirm` -> state `IDLE`

Cancel path:
1. `file complaint`
2. `Water leakage from pipe`
3. `cancel` -> state `IDLE`

## D) Drafting State Flow (Malayalam)
Use same `session_id` for all steps.

1. `പരാതി നൽകണം` -> state `COLLECT_WHAT`
2. `റോഡിൽ വെള്ളം കെട്ടിയിരിക്കുന്നു` -> state `COLLECT_WHERE`
3. `പഞ്ചായത്ത് ഓഫീസ് സമീപം` -> state `COLLECT_WHEN`
4. `ഇന്ന് രാവിലെ` -> state `CONFIRM` + Malayalam summary
5. `സ്ഥിരീകരിക്കുക` -> state `IDLE`

Cancel path:
1. `പരാതി നൽകണം`
2. `റോഡിൽ കുഴിയുണ്ട്`
3. `റദ്ദാക്കുക` -> state `IDLE`

## E) Language Behavior Validation

### Auto mode
1. Send Malayalam prompt: `റോഡിൽ വെള്ളം കെട്ടിയിരിക്കുന്നു`
2. Expected response language: `ml`

### English preferred (`language: "en"`)
1. Send English prompt: `check status`
2. Expected response language: `en`

### Malayalam preferred (`language: "ml"`)
1. Send English prompt: `check status`
2. Expected response language: `ml`

### Malayalam override rule
1. Send Malayalam prompt while preferred language is `en`
2. Expected: still `ml` (Malayalam input takes priority)

## F) Suggestion Validation

| Context | Expected Suggestions |
|---|---|
| greeting/general | Submit Complaint, Check Status, Help |
| check_status | Enter Complaint ID, Submit Complaint |
| complaint_draft_help | Start Draft, Cancel |
| drafting state active | Cancel, Confirm (localized for Malayalam) |
| emergency_help | Call Emergency, Submit Complaint |

## Quick API Test Payload
```json
{
  "message": "റോഡിൽ വെള്ളം കെട്ടിയിരിക്കുന്നു",
  "session_id": "manual-test-1",
  "language": "en"
}
```
Expected: intent should still go to complaint drafting flow and response language should be Malayalam.
