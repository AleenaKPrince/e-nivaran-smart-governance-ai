def detect_chat_intent(text):
    text = (text or "").lower()

    intents = {
        "greeting": [
            "hello",
            "hi",
            "hey",
            "good morning",
            "good evening",
            "നമസ്കാരം",
            "ഹായ്",
            "ഹലോ",
        ],
        "complaint": [
            "complaint",
            "report",
            "issue",
            "problem",
            "പരാതി",
            "പ്രശ്നം",
            "റിപ്പോർട്ട്",
        ],
        "status": [
            "status",
            "track",
            "check complaint",
            "സ്റ്റാറ്റസ്",
            "പരാതിയുടെ സ്ഥിതി",
        ],
        "thanks": [
            "thanks",
            "thank you",
            "നന്ദി",
            "വളരെ നന്ദി",
        ],
        "casual": [
            "how are you",
            "what can you do",
            "സുഖമാണോ",
            "നിങ്ങൾ എന്ത് ചെയ്യാം",
        ],
    }

    priority_order = ["greeting", "status", "thanks", "casual", "complaint", "unknown"]

    for intent in priority_order:
        if intent == "unknown":
            break
        for keyword in intents.get(intent, []):
            if keyword in text:
                return intent

    return "unknown"
