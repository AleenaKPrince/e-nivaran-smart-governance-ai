# Chatbot Architecture and Implementation

## Scope
This chatbot is a **rule-based + intent-classification (non-generative)** assistant for citizen guidance.

It supports:
- Complaint drafting guidance (step-by-step)
- Complaint status guidance
- English and Malayalam responses
- Intent-based quick suggestions

It does **not** do:
- Department prediction
- Complaint routing
- ML text generation

## Module Design
The active chatbot module has 3 files:
- `backend/chatbot/intent_handler.py`
- `backend/chatbot/response_generator.py`
- `backend/chatbot/chatbot.py`

### 1) `intent_handler.py`
Single source of intent detection: `detect_intent(text)`.

Pipeline:
1. Normalize input (`strip`, lowercase)
2. Translate to English (`translate_to_english`) for robust matching
3. Keyword-priority intent matching
4. Heuristic fallback for direct issue descriptions (for example: `റോഡിൽ വെള്ളം കെട്ടിയിരിക്കുന്നു` -> `file_complaint`)

Supported intents:
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

### 2) `response_generator.py`
Contains structured bilingual response variants for each intent.

Functions:
- `generate_response(intent, language, message="")`

Behavior:
- Returns `en` or `ml` response
- Uses deterministic variant selection to reduce repetition
- Falls back safely to `fallback`

### 3) `chatbot.py`
Conversation coordinator and state manager.

Key responsibilities:
- Resolve response language
- Enforce complaint drafting state flow
- Return standard API payload

#### Language Resolution Rules
`_resolve_language(message, preferred_language)`:
1. Detect message language
2. If detected Malayalam, always respond in Malayalam
3. Else apply preferred language (`en`/`ml`) if provided
4. Else use detected language

This ensures Malayalam user input gets Malayalam responses consistently.

#### Drafting State Machine
Session states:
- `IDLE`
- `COLLECT_WHAT`
- `COLLECT_WHERE`
- `COLLECT_WHEN`
- `CONFIRM`

Flow:
1. User triggers complaint draft intent
2. Ask: what happened
3. Ask: where it happened
4. Ask: when it happened
5. Show summary and ask confirm/cancel
6. Reset to `IDLE` after confirm/cancel

## API Contract
Routes:
- `POST /api/chat`
- `POST /api/chatbot`

Request:
```json
{
  "message": "hello",
  "session_id": "optional",
  "language": "en or ml (optional)"
}
```

Response:
```json
{
  "intent": "greeting",
  "department": null,
  "response": "Hello. How can I assist you today?",
  "language": "en",
  "session_id": "sess-...",
  "suggestions": ["Submit Complaint", "Check Status"],
  "state": "IDLE"
}
```

## Suggestions (Intent-Level)
Intent-level suggestion map in `chatbot.py`:
- `emergency_help`: `Call Emergency`, `Submit Complaint`
- `greeting`, `general`: `Submit Complaint`, `Check Status`, `Help`
- `casual_talk`: `Submit Complaint`, `Check Status`
- `file_complaint`: `Cancel`, `Continue`
- `complaint_draft_help`: `Start Draft`, `Cancel`
- `complaint_documents_help`: `Submit Complaint`, `Check Status`
- `check_status`: `Enter Complaint ID`, `Submit Complaint`
- `status_id_help`: `Check Status`, `Submit Complaint`
- `thanks`, `goodbye`, `fallback`: `Submit Complaint`, `Check Status`

During active drafting states, suggestions are forced to:
- English: `Cancel`, `Confirm`
- Malayalam: `റദ്ദാക്കുക`, `സ്ഥിരീകരിക്കുക`

## Separation of Concerns
- Chatbot module: intent + guidance conversation only
- Complaint routing and department prediction: outside chatbot module
- Keeps chatbot behavior deterministic, maintainable, and testable

## Maintenance Rules
1. Add new intent keywords only in `intent_handler.py`
2. Add response variants only in `response_generator.py`
3. Adjust suggestion mapping/state behavior in `chatbot.py`
4. Keep routing/ML logic out of chatbot module
