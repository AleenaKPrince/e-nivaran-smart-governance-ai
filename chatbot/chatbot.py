from chatbot.intent_handler import detect_intent
from chatbot.response_generator import generate_response
from utils.language_utils import detect_language

IDLE = "IDLE"
COLLECT_WHAT = "COLLECT_WHAT"
COLLECT_WHERE = "COLLECT_WHERE"
COLLECT_WHEN = "COLLECT_WHEN"
CONFIRM = "CONFIRM"

CHAT_SESSIONS = {}

CANCEL_WORDS = {
    "cancel",
    "stop",
    "abort",
    "റദ്ദാക്കുക",
    "നിർത്തുക",
}

CONFIRM_WORDS = {
    "confirm",
    "yes",
    "ok",
    "submit",
    "സ്ഥിരീകരിക്കുക",
    "അതെ",
    "ശരി",
}


SUGGESTIONS_BY_INTENT = {
    "emergency_help": {
        "en": ["Call Emergency", "Submit Complaint"],
        "ml": ["എമർജൻസി വിളിക്കുക", "പരാതി സമർപ്പിക്കുക"],
    },
    "greeting": {
        "en": ["Submit Complaint", "Check Status", "Help"],
        "ml": ["പരാതി സമർപ്പിക്കുക", "സ്റ്റാറ്റസ് പരിശോധിക്കുക", "സഹായം"],
    },
    "casual_talk": {
        "en": ["Submit Complaint", "Check Status"],
        "ml": ["പരാതി സമർപ്പിക്കുക", "സ്റ്റാറ്റസ് പരിശോധിക്കുക"],
    },
    "file_complaint": {
        "en": ["Cancel", "Continue"],
        "ml": ["റദ്ദാക്കുക", "തുടരുക"],
    },
    "complaint_draft_help": {
        "en": ["Start Draft", "Cancel"],
        "ml": ["ഡ്രാഫ്റ്റ് തുടങ്ങുക", "റദ്ദാക്കുക"],
    },
    "complaint_documents_help": {
        "en": ["Submit Complaint", "Check Status"],
        "ml": ["പരാതി സമർപ്പിക്കുക", "സ്റ്റാറ്റസ് പരിശോധിക്കുക"],
    },
    "check_status": {
        "en": ["Enter Complaint ID", "Submit Complaint"],
        "ml": ["Complaint ID നൽകുക", "പരാതി സമർപ്പിക്കുക"],
    },
    "status_id_help": {
        "en": ["Check Status", "Submit Complaint"],
        "ml": ["സ്റ്റാറ്റസ് പരിശോധിക്കുക", "പരാതി സമർപ്പിക്കുക"],
    },
    "general": {
        "en": ["Submit Complaint", "Check Status", "Help"],
        "ml": ["പരാതി സമർപ്പിക്കുക", "സ്റ്റാറ്റസ് പരിശോധിക്കുക", "സഹായം"],
    },
    "thanks": {
        "en": ["Submit Complaint", "Check Status"],
        "ml": ["പരാതി സമർപ്പിക്കുക", "സ്റ്റാറ്റസ് പരിശോധിക്കുക"],
    },
    "goodbye": {
        "en": ["Submit Complaint", "Check Status"],
        "ml": ["പരാതി സമർപ്പിക്കുക", "സ്റ്റാറ്റസ് പരിശോധിക്കുക"],
    },
    "fallback": {
        "en": ["Submit Complaint", "Check Status"],
        "ml": ["പരാതി സമർപ്പിക്കുക", "സ്റ്റാറ്റസ് പരിശോധിക്കുക"],
    },
}


def _get_session(session_id):
    key = session_id or "anonymous"
    if key not in CHAT_SESSIONS:
        CHAT_SESSIONS[key] = {
            "state": IDLE,
            "draft": {"what": "", "where": "", "when": ""},
        }
    return CHAT_SESSIONS[key]


def _idle_suggestions(language):
    lang = "ml" if language == "ml" else "en"
    return SUGGESTIONS_BY_INTENT["general"][lang]


def _draft_suggestions(language):
    if language == "ml":
        return ["റദ്ദാക്കുക", "സ്ഥിരീകരിക്കുക"]
    return ["Cancel", "Confirm"]


def _format_draft_summary(draft, language):
    if language == "ml":
        return (
            "ഇതാണ് നിങ്ങളുടെ പരാതിയുടെ ഡ്രാഫ്റ്റ്:\n"
            f"1. എന്താണ് സംഭവിച്ചത്: {draft['what']}\n"
            f"2. എവിടെ: {draft['where']}\n"
            f"3. എപ്പോൾ: {draft['when']}\n\n"
            "ഇത് ശരിയാണെങ്കിൽ 'സ്ഥിരീകരിക്കുക' എന്ന് എഴുതുക. മാറ്റാൻ 'റദ്ദാക്കുക' എന്ന് എഴുതാം."
        )
    return (
        "Here is your complaint draft:\n"
        f"1. What happened: {draft['what']}\n"
        f"2. Where: {draft['where']}\n"
        f"3. When: {draft['when']}\n\n"
        "If this is correct, type 'confirm'. To stop, type 'cancel'."
    )


def _reset_session(session):
    session["state"] = IDLE
    session["draft"] = {"what": "", "where": "", "when": ""}


def _start_drafting(session, language):
    session["state"] = COLLECT_WHAT
    if language == "ml":
        return "ശരി, പരാതി ഡ്രാഫ്റ്റ് തുടങ്ങാം. ആദ്യം, എന്താണ് സംഭവിച്ചത്?"
    return "Great, let us draft your complaint. First, what happened?"


def _resolve_language(message, preferred_language):
    detected = detect_language(message)
    # Always honor Malayalam input so Malayalam queries get Malayalam responses.
    if detected == "ml":
        return "ml"
    if preferred_language in {"en", "ml"}:
        return preferred_language
    return detected


def _intent_suggestions(intent, language):
    lang = "ml" if language == "ml" else "en"
    return SUGGESTIONS_BY_INTENT.get(intent, SUGGESTIONS_BY_INTENT["fallback"])[lang]


def get_chatbot_response(message, session_id="anonymous", preferred_language=None):
    text = (message or "").strip()
    language = _resolve_language(text, preferred_language)
    intent = detect_intent(text)
    normalized = text.lower()

    session = _get_session(session_id)

    if normalized in CANCEL_WORDS and session["state"] != IDLE:
        _reset_session(session)
        response = "ഡ്രാഫ്റ്റ് റദ്ദാക്കി. വേണമെങ്കിൽ വീണ്ടും തുടങ്ങാം." if language == "ml" else "Draft cancelled. You can start again anytime."
        return {
            "intent": "file_complaint",
            "department": None,
            "response": response,
            "language": language,
            "session_id": session_id,
            "suggestions": _idle_suggestions(language),
            "state": session["state"],
        }

    if session["state"] == COLLECT_WHAT:
        session["draft"]["what"] = text
        session["state"] = COLLECT_WHERE
        response = "ഇത് എവിടെയാണ് സംഭവിച്ചത്?" if language == "ml" else "Where did it happen?"
        return {
            "intent": "file_complaint",
            "department": None,
            "response": response,
            "language": language,
            "session_id": session_id,
            "suggestions": _draft_suggestions(language),
            "state": session["state"],
        }

    if session["state"] == COLLECT_WHERE:
        session["draft"]["where"] = text
        session["state"] = COLLECT_WHEN
        response = "ഇത് എപ്പോഴാണ് സംഭവിച്ചത്?" if language == "ml" else "When did it happen?"
        return {
            "intent": "file_complaint",
            "department": None,
            "response": response,
            "language": language,
            "session_id": session_id,
            "suggestions": _draft_suggestions(language),
            "state": session["state"],
        }

    if session["state"] == COLLECT_WHEN:
        session["draft"]["when"] = text
        session["state"] = CONFIRM
        return {
            "intent": "file_complaint",
            "department": None,
            "response": _format_draft_summary(session["draft"], language),
            "language": language,
            "session_id": session_id,
            "suggestions": _draft_suggestions(language),
            "state": session["state"],
        }

    if session["state"] == CONFIRM:
        if normalized in CONFIRM_WORDS:
            summary = _format_draft_summary(session["draft"], language)
            _reset_session(session)
            if language == "ml":
                tail = "\n\nഇപ്പോൾ Submit Complaint പേജിൽ ഇതേ വിശദാംശങ്ങൾ സമർപ്പിക്കൂ."
            else:
                tail = "\n\nNow submit these details on the Submit Complaint page."
            return {
                "intent": "file_complaint",
                "department": None,
                "response": summary + tail,
                "language": language,
                "session_id": session_id,
                "suggestions": _idle_suggestions(language),
                "state": session["state"],
            }

        response = "സ്ഥിരീകരിക്കാൻ 'സ്ഥിരീകരിക്കുക' എന്ന് എഴുതുക, അല്ലെങ്കിൽ റദ്ദാക്കാൻ 'റദ്ദാക്കുക'." if language == "ml" else "Type 'confirm' to finalize this draft, or 'cancel' to stop."
        return {
            "intent": "file_complaint",
            "department": None,
            "response": response,
            "language": language,
            "session_id": session_id,
            "suggestions": _draft_suggestions(language),
            "state": session["state"],
        }

    if intent in {"file_complaint", "complaint_draft_help"}:
        response = _start_drafting(session, language)
        return {
            "intent": "file_complaint",
            "department": None,
            "response": response,
            "language": language,
            "session_id": session_id,
            "suggestions": _draft_suggestions(language),
            "state": session["state"],
        }

    response = generate_response(intent, language, message=text)

    return {
        "intent": intent,
        "department": None,
        "response": response,
        "language": language,
        "session_id": session_id,
        "suggestions": _intent_suggestions(intent, language),
        "state": session["state"],
    }
