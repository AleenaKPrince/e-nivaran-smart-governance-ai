def classify_department(text):
    text = text.lower()

    if any(word in text for word in ["fever", "hospital", "doctor", "medicine"]):
        return "Health Department"

    if any(word in text for word in ["power", "electricity", "current", "transformer"]):
        return "Electricity Board"

    if any(word in text for word in ["garbage", "waste", "road", "drainage"]):
        return "Local Self Government"

    return "General"
