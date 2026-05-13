from flask import Blueprint, request, jsonify
from db import users_collection
from db import citizens_collection
from middleware.jwt_required import jwt_required
from utils.password_handler import hash_password, verify_password
import jwt
import uuid
from datetime import datetime, timedelta
from config import SECRET_KEY
from werkzeug.security import generate_password_hash

auth_bp = Blueprint("auth", __name__)


def _parse_expiry(raw_expiry):
    if isinstance(raw_expiry, datetime):
        return raw_expiry
    if isinstance(raw_expiry, str):
        try:
            return datetime.fromisoformat(raw_expiry.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            return None
    return None

# =================================================
# LOGIN (ADMIN / STAFF / CITIZEN)
# =================================================
@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = users_collection.find_one({"email": email})

    if not user or not verify_password(password, user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    # ✅ FIX: INCLUDE DEPARTMENT IN JWT PAYLOAD
    payload = {
        "user_id": user["user_id"],
        "role": user["role"],
        "department": user.get("department"),  # ✅ CRITICAL FIX
        "exp": datetime.utcnow() + timedelta(hours=6)
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    return jsonify({
        "token": token,
        "user_id": user["user_id"],
        "role": user["role"],
        "department": user.get("department")
    }), 200


# ================================================================
# ALLOWED DEPARTMENTS (must match routing_service.py)
# ================================================================
ALLOWED_DEPARTMENTS = {
    "Health",
    "Electricity",
    "Local Self Government",
    "Public Works",
    "Transport",
    "Fire and Rescue",
    "Police",
}


def is_valid_email(email):
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password_strength(password):
    """
    Validate password strength.
    Returns: (is_valid, error_message)
    """
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    return True, None


# =================================================
# REGISTER STAFF (ADMIN ONLY)
# =================================================
@auth_bp.route("/staff/register", methods=["POST"])
@jwt_required(required_role="admin")
def register_staff():
    """
    Register a new staff member (Admin Only).
    
    Request body:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "SecurePass123",
        "department": "Health"
    }
    """
    data = request.get_json()

    # Extract fields
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    department = data.get("department", "").strip()

    # =============================================
    # VALIDATION: Required Fields
    # =============================================
    if not name:
        return jsonify({"error": "Name is required"}), 400
    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not password:
        return jsonify({"error": "Password is required"}), 400
    if not department:
        return jsonify({"error": "Department is required"}), 400

    # =============================================
    # VALIDATION: Email Format
    # =============================================
    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    # =============================================
    # VALIDATION: Department
    # =============================================
    if department not in ALLOWED_DEPARTMENTS:
        return jsonify({
            "error": f"Invalid department. Allowed: {', '.join(sorted(ALLOWED_DEPARTMENTS))}"
        }), 400

    # =============================================
    # VALIDATION: Password Strength
    # =============================================
    is_valid, error_msg = validate_password_strength(password)
    if not is_valid:
        return jsonify({"error": error_msg}), 400

    # =============================================
    # VALIDATION: Duplicate Email Check
    # =============================================
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    # =============================================
    # CREATE STAFF DOCUMENT
    # =============================================
    staff = {
        "user_id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "password": hash_password(password),
        "role": "staff",
        "department": department,
        "created_at": datetime.utcnow(),
        "is_active": True
    }

    try:
        users_collection.insert_one(staff)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    # =============================================
    # SUCCESS RESPONSE
    # =============================================
    return jsonify({
        "message": "Staff registered successfully",
        "staff_id": staff["user_id"],
        "email": email,
        "name": name,
        "department": department,
        "role": "staff"
    }), 201


# =================================================
# REGISTER ADMIN (OPTIONAL / ONE-TIME)
# =================================================
@auth_bp.route("/admin/register", methods=["POST"])
def register_admin():

    data = request.get_json()

    admin = {
        "user_id": str(uuid.uuid4()),
        "email": data.get("email"),
        "password": hash_password(data.get("password")),
        "role": "admin",
        "created_at": datetime.utcnow()
    }

    users_collection.insert_one(admin)

    return jsonify({"message": "Admin created"}), 201


@auth_bp.route("/reset-password", methods=["POST"])
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

