import re
import secrets
from datetime import datetime, timedelta

import bcrypt
import jwt
from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from config import SECRET_KEY
from db import citizens_collection
from services.email_service import send_password_reset_email

citizen_auth_bp = Blueprint("citizen_auth", __name__)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def _is_valid_email(email):
    return bool(EMAIL_REGEX.match(email))


def _hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password, hashed_password):
    try:
        # Backward-compatible verify for bcrypt hashes already in DB.
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        # Handle Werkzeug-generated hashes for newer password resets.
        return check_password_hash(hashed_password, password)


def _parse_expiry(raw_expiry):
    if isinstance(raw_expiry, datetime):
        return raw_expiry
    if isinstance(raw_expiry, str):
        try:
            return datetime.fromisoformat(raw_expiry.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            return None
    return None


@citizen_auth_bp.route("/register", methods=["POST"])
def register_citizen():
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not name:
        return jsonify({"error": "Full name is required"}), 400
    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not password:
        return jsonify({"error": "Password is required"}), 400
    if not _is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if citizens_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    citizen_doc = {
        "name": name,
        "email": email,
        "password": _hash_password(password),
        "role": "citizen",
        "created_at": datetime.utcnow(),
    }

    citizens_collection.insert_one(citizen_doc)

    return jsonify({"message": "Citizen registered successfully"}), 201


@citizen_auth_bp.route("/login", methods=["POST"])
def login_citizen():
    data = request.get_json() or {}

    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if not _is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    citizen = citizens_collection.find_one({"email": email})
    if not citizen:
        return jsonify({"error": "Invalid credentials"}), 401

    if not _verify_password(password, citizen["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    payload = {
        "email": citizen["email"],
        "name": citizen.get("name"),
        "role": "citizen",
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    return (
        jsonify(
            {
                "token": token,
                "role": "citizen",
                "email": citizen["email"],
                "name": citizen.get("name"),
            }
        ),
        200,
    )


@citizen_auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not _is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    print("Forgot password requested for:", email)
    citizen = citizens_collection.find_one({"email": email})
    if not citizen:
        return jsonify({"error": "Email not found"}), 404

    reset_token = secrets.token_urlsafe(32)
    reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)

    citizens_collection.update_one(
        {"email": email},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expiry": reset_token_expiry,
                # Keep legacy key for backward compatibility with existing data/queries.
                "reset_token_expires_at": reset_token_expiry,
            }
        },
    )

    print("Generated token for email:", email, "| token preview:", reset_token[:8] + "...")
    print("Sending email...")

    sent, error_message = send_password_reset_email(email, reset_token)
    if sent:
        return jsonify({"message": "Verification email sent"}), 200

    return jsonify({"error": error_message or "Failed to send email"}), 500


@citizen_auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token = (data.get("token") or "").strip()
    new_password = (data.get("new_password") or "").strip()
    print("Received token:", token)

    if not token or not new_password:
        return jsonify({"error": "token and new_password are required"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    user = citizens_collection.find_one({"reset_token": token})
    print("User found:", bool(user))
    if not user:
        return jsonify({"error": "Invalid token"}), 400

    raw_expiry = user.get("reset_token_expiry") or user.get("reset_token_expires_at")
    print("Token expiry:", raw_expiry)
    token_expiry = _parse_expiry(raw_expiry)
    if not token_expiry or token_expiry < datetime.utcnow():
        return jsonify({"error": "Token expired"}), 400

    citizens_collection.update_one(
        {"email": user["email"]},
        {
            "$set": {"password": generate_password_hash(new_password)},
            "$unset": {
                "reset_token": "",
                "reset_token_expiry": "",
                "reset_token_expires_at": "",
            },
        },
    )

    return jsonify({"message": "Password reset successful"}), 200


@citizen_auth_bp.route("/test-email", methods=["GET"])
def test_email():
    to_email = (request.args.get("email") or "").strip().lower()
    if not to_email:
        return jsonify({"error": "Query parameter 'email' is required"}), 400
    if not _is_valid_email(to_email):
        return jsonify({"error": "Invalid email format"}), 400

    test_token = "test-reset-token"
    print("Sending email...")
    sent, error_message = send_password_reset_email(to_email, test_token)
    if sent:
        return jsonify({"message": f"Test email sent to {to_email}"}), 200

    return jsonify({"error": error_message or "Failed to send test email"}), 500
