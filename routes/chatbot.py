from flask import Blueprint, request, jsonify
from chatbot.chatbot import get_chatbot_response

chatbot_bp = Blueprint("chatbot", __name__)


@chatbot_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = data.get("message", "")
    session_id = data.get("session_id") or request.headers.get("X-Session-ID") or request.remote_addr or "anonymous"
    preferred_language = data.get("language")

    if not message:
        return jsonify({"error": "Message is required"}), 400

    return jsonify(get_chatbot_response(message, session_id=session_id, preferred_language=preferred_language)), 200


@chatbot_bp.route("/chatbot", methods=["POST"])
def chatbot_api():
    data = request.get_json() or {}
    message = data.get("message", "")
    session_id = data.get("session_id") or request.headers.get("X-Session-ID") or request.remote_addr or "anonymous"
    preferred_language = data.get("language")

    if not message:
        return jsonify({"error": "Message is required"}), 400

    return jsonify(get_chatbot_response(message, session_id=session_id, preferred_language=preferred_language)), 200
