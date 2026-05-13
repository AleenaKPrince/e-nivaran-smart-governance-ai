from utils.language_utils import translate_to_english

ISSUE_HINTS = [
    "not working",
    "broken",
    "damaged",
    "leak",
    "leakage",
    "water logging",
    "waterlogged",
    "pothole",
    "garbage",
    "sewage",
    "blocked drain",
    "street light",
    "power cut",
    "flooded",
    "issue",
    "problem",
    "റോഡിൽ",
    "വെള്ളം",
    "വെള്ളക്കെട്ട്",
    "കെട്ടിക്കിടക്കുന്നു",
    "കുഴി",
    "ചോരുന്നു",
    "മാലിന്യം",
    "പ്രശ്നം",
    "തകരാർ",
]

INTENT_KEYWORDS = {
    "emergency_help": [
        "emergency",
        "urgent",
        "immediate help",
        "fire",
        "accident",
        "theft",
        "assault",
        "ambulance",
        "പെട്ടെന്ന്",
        "അടിയന്തിരം",
        "ആപത്ത്",
        "തീ പിടിച്ചു",
        "അപകടം",
    ],
    "greeting": [
        "hi",
        "hello",
        "hey",
        "good morning",
        "good evening",
        "ഹലോ",
        "നമസ്കാരം",
        "സുഖമാണോ",
    ],
    "casual_talk": [
        "how are you",
        "who are you",
        "what are you",
        "what can you do",
        "are you a bot",
        "can you help me",
        "നിങ്ങൾ ആരാണ്",
        "സുഖമാണോ",
        "നിങ്ങൾക്ക് എന്ത് ചെയ്യാം",
    ],
    "file_complaint": [
        "file complaint",
        "submit complaint",
        "register complaint",
        "report issue",
        "i want to file complaint",
        "പരാതി നൽകണം",
        "പരാതി രജിസ്റ്റർ ചെയ്യണം",
    ],
    "complaint_draft_help": [
        "draft complaint",
        "write complaint",
        "complaint format",
        "how to write complaint",
        "example complaint",
        "പരാതി എഴുതാൻ സഹായിക്കൂ",
        "പരാതി ഫോർമാറ്റ്",
        "പരാതി ഡ്രാഫ്റ്റ്",
    ],
    "complaint_documents_help": [
        "documents needed",
        "proof needed",
        "what documents",
        "evidence required",
        "attachments",
        "എന്ത് രേഖകൾ",
        "എന്ത് പ്രൂഫ്",
        "തെളിവ് വേണോ",
        "അറ്റാച്ച് ചെയ്യേണ്ടത്",
    ],
    "check_status": [
        "check status",
        "track complaint",
        "track complaint status",
        "complaint status",
        "status of complaint",
        "സ്റ്റാറ്റസ്",
        "പരാതിയുടെ നില",
    ],
    "status_id_help": [
        "where is complaint id",
        "complaint id format",
        "id format",
        "what is my complaint id",
        "how to find complaint id",
        "പരാതി ഐഡി എവിടെ",
        "ഐഡി ഫോർമാറ്റ്",
        "എന്റെ complaint id",
    ],
    "thanks": [
        "thanks",
        "thank you",
        "നന്ദി",
    ],
    "goodbye": [
        "bye",
        "goodbye",
        "see you",
        "ശരി കാണാം",
    ],
    "general": [
        "help",
        "guide me",
        "services",
        "options",
        "സഹായം",
        "എങ്ങനെ സഹായിക്കും",
        "എന്തെല്ലാം ചെയ്യാം",
    ],
}

INTENT_PRIORITY = [
    "emergency_help",
    "greeting",
    "casual_talk",
    "check_status",
    "status_id_help",
    "file_complaint",
    "complaint_draft_help",
    "complaint_documents_help",
    "thanks",
    "goodbye",
    "general",
]


def _looks_like_issue_description(raw_text, english_text):
    text = f"{raw_text} {english_text}".strip()
    if not text:
        return False
    if len(text.split()) < 2:
        return False

    for hint in ISSUE_HINTS:
        if hint in text:
            return True
    return False


def detect_intent(text):
    raw_text = (text or "").strip().lower()
    english_text = (translate_to_english(raw_text) or raw_text).strip().lower()
    normalized = f"{raw_text} {english_text}"

    for intent in INTENT_PRIORITY:
        for keyword in INTENT_KEYWORDS[intent]:
            if keyword.lower() in normalized:
                return intent

    # Treat direct issue descriptions as complaint intent.
    if _looks_like_issue_description(raw_text, english_text):
        return "file_complaint"

    return "fallback"
