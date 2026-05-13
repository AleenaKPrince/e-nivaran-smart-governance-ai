from services.chatbot_intents import detect_chat_intent
from services.chatbot_responses import COMPLAINT_GUIDANCE, RESPONSES
from services.routing_service import route_complaint
from utils.language_utils import detect_language, translate_to_english

GENERIC_COMPLAINT_TERMS = {
    "complaint",
    "issue",
    "problem",
    "report",
    "file",
    "submit",
    "want",
    "need",
    "help",
    "to",
    "a",
    "i",
    "my",
}


def _pick_lang(language):
    return "ml" if language == "ml" else "en"


def chatbot_reply(message):
    language = _pick_lang(detect_language(message))
    intent = detect_chat_intent(message)

    if intent == "complaint":
        return COMPLAINT_GUIDANCE[language]

    if intent not in RESPONSES:
        intent = "unknown"

    return RESPONSES[intent][language]


def _should_predict_department(text):
    tokens = [t for t in (text or "").lower().split() if t]
    if len(tokens) < 3:
        return False
    meaningful = [t for t in tokens if t not in GENERIC_COMPLAINT_TERMS]
    return len(meaningful) >= 2


def process_chat_message(message, session_id="anonymous"):
    user_message = (message or "").strip()
    language = _pick_lang(detect_language(user_message))
    intent = detect_chat_intent(user_message)

    department = None
    response = chatbot_reply(user_message)
    suggestions = []

    if intent == "complaint":
        english_message = translate_to_english(user_message) if language == "ml" else user_message
        if _should_predict_department(english_message):
            routing = route_complaint(description=english_message)
            department = routing.get("department")

            if department and department != "Unclassified":
                if language == "ml":
                    response = (
                        f"ഈ പരാതി {department} വകുപ്പിലേക്ക് പോകും.\n\n"
                        f"{COMPLAINT_GUIDANCE['ml']}"
                    )
                else:
                    response = (
                        f"This complaint is likely handled by {department} department.\n\n"
                        f"{COMPLAINT_GUIDANCE['en']}"
                    )

        suggestions = ["Submit Complaint", "Track Complaint", "Contact Support"]

    elif intent == "status":
        suggestions = ["Track Complaint", "Submit Complaint", "Contact Support"]
    elif intent in {"greeting", "casual", "thanks", "unknown"}:
        suggestions = ["Submit Complaint", "Track Complaint", "Contact Support"]

    if intent == "unknown":
        english_message = translate_to_english(user_message) if language == "ml" else user_message
        routing = route_complaint(description=english_message)
        routed_dept = routing.get("department")
        if routed_dept and routed_dept != "Unclassified":
            intent = "complaint"
            department = routed_dept
            if language == "ml":
                response = (
                    f"ഈ പരാതി {department} വകുപ്പിലേക്ക് പോകും.\n\n"
                    f"{COMPLAINT_GUIDANCE['ml']}"
                )
            else:
                response = (
                    f"This complaint is likely handled by {department} department.\n\n"
                    f"{COMPLAINT_GUIDANCE['en']}"
                )

    return {
        "intent": intent,
        "department": department,
        "response": response,
        "language": language,
        "session_id": session_id,
        "suggestions": suggestions,
    }
