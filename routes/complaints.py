from datetime import datetime

from flask import Blueprint, jsonify, request

from ai.predict import predict_department_with_confidence
from ai.predict_priority import predict_priority, severity_score
from db import complaints_collection, users_collection
from middleware.jwt_required import jwt_required
from services.assignment_service import find_assignee_for_department
from services.routing_service import route_complaint
from utils.id_generator import generate_complaint_id

complaints_bp = Blueprint("complaints", __name__)

ALLOWED_STATUS = ["Submitted", "In Progress", "Resolved"]
VALID_STATUS_TRANSITIONS = {
    "Submitted": ["In Progress"],
    "In Progress": ["Resolved"],
    "Resolved": [],
}


def _serialize_datetime_fields(document):
    for field in ["created_at", "assigned_at", "updated_at"]:
        if field in document and hasattr(document[field], "isoformat"):
            document[field] = document[field].isoformat()

    history = document.get("history", [])
    if isinstance(history, list):
        for entry in history:
            if "timestamp" in entry and hasattr(entry["timestamp"], "isoformat"):
                entry["timestamp"] = entry["timestamp"].isoformat()


@complaints_bp.route("/complaints", methods=["GET"])
@jwt_required(required_role="admin")
def get_all_complaints():
    complaints = list(complaints_collection.find({}, {"_id": 0}))
    for complaint in complaints:
        _serialize_datetime_fields(complaint)
    return jsonify(complaints), 200


@complaints_bp.route("/complaints/my", methods=["GET"])
@jwt_required(required_role="citizen")
def get_my_complaints():
    citizen_email = (request.user.get("email") or "").strip().lower()
    if not citizen_email:
        return jsonify({"error": "Citizen identity missing in token"}), 401

    query = {
        "$or": [
            {"citizen_email": citizen_email},
            {"user_id": citizen_email},
        ]
    }
    projection = {
        "_id": 0,
        "complaint_id": 1,
        "department": 1,
        "priority": 1,
        "status": 1,
        "assigned_to": 1,
        "assigned_staff": 1,
        "created_at": 1,
        "description": 1,
        "description_original": 1,
        "description_english": 1,
        "routing_mode": 1,
    }

    complaints = list(complaints_collection.find(query, projection).sort("created_at", -1))
    for complaint in complaints:
        _serialize_datetime_fields(complaint)

    return jsonify({"complaints": complaints}), 200


@complaints_bp.route("/complaint", methods=["POST"])
def submit_complaint():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    description = data.get("description")

    if not user_id or not description:
        return jsonify({"error": "user_id and description required"}), 400

    routing = route_complaint(text=description, ml_predictor=predict_department_with_confidence)
    department = routing["department"]
    department_confidence = routing["confidence"]
    routing_mode = routing["routing_mode"]
    routing_reason = routing["routing_reason"]
    detected_language = routing.get("language", "en")
    description_original = routing.get("description_original", description)
    description_translated = routing.get("description_translated", description)
    description_english = routing.get("description_english", description_translated)

    # Priority and severity should use English text for consistent scoring.
    priority = predict_priority(description_english)
    severity = severity_score(description_english)

    now = datetime.utcnow()
    assigned_to = find_assignee_for_department(department)
    assigned_staff = None
    if assigned_to:
        staff = users_collection.find_one(
            {"user_id": assigned_to, "role": "staff"},
            {"_id": 0, "name": 1, "user_id": 1},
        )
        if staff:
            assigned_staff = staff.get("name") or staff.get("user_id")
        else:
            assigned_staff = assigned_to

    complaint = {
        "complaint_id": generate_complaint_id(),
        "user_id": user_id,
        "citizen_email": user_id.lower().strip() if isinstance(user_id, str) and "@" in user_id else None,
        "description": description_original,
        "language": detected_language,
        "description_original": description_original,
        "description_translated": description_translated,
        "description_english": description_english,
        "department": department,
        "department_confidence": department_confidence,
        "routing_mode": routing_mode,
        "routing_reason": routing_reason,
        "priority": priority,
        "severity": severity,
        "status": "Submitted",
        "assigned_to": assigned_to,
        "assigned_staff": assigned_staff,
        "created_at": now,
        "assigned_at": now if assigned_to else None,
        "updated_at": now,
        "last_updated_by": user_id,
        "history": [
            {
                "updated_by": user_id,
                "old_status": None,
                "new_status": "Submitted",
                "timestamp": now,
            }
        ],
    }

    complaints_collection.insert_one(complaint)

    return jsonify(
        {
            "message": "Complaint submitted successfully",
            "complaint_id": complaint["complaint_id"],
            "department": department,
            "department_confidence": department_confidence,
            "routing_mode": routing_mode,
            "priority": priority,
            "severity": severity,
            "assigned_to": assigned_to,
            "assigned_staff": assigned_staff,
        }
    ), 201


@complaints_bp.route("/complaint/update", methods=["PUT"])
@jwt_required(required_role="staff")
def update_complaint_status():
    data = request.get_json() or {}

    staff_id = request.user.get("user_id")
    complaint_id = data.get("complaint_id")
    new_status = data.get("status")

    if not complaint_id or not new_status:
        return jsonify({"error": "complaint_id and status required"}), 400

    if new_status not in ALLOWED_STATUS:
        return jsonify({"error": "Invalid status value"}), 400

    complaint = complaints_collection.find_one({"complaint_id": complaint_id})
    if not complaint:
        return jsonify({"error": "Complaint not found"}), 404

    if complaint.get("assigned_to") != staff_id:
        return jsonify({"error": "You can only update complaints assigned to you"}), 403

    old_status = complaint.get("status")
    allowed_next = VALID_STATUS_TRANSITIONS.get(old_status, [])
    if new_status not in allowed_next:
        return jsonify(
            {
                "error": "Invalid status transition",
                "allowed_next_status": allowed_next,
            }
        ), 400

    history_entry = {
        "updated_by": staff_id,
        "old_status": old_status,
        "new_status": new_status,
        "timestamp": datetime.utcnow(),
    }

    complaints_collection.update_one(
        {"complaint_id": complaint_id},
        {
            "$set": {
                "status": new_status,
                "updated_at": datetime.utcnow(),
                "last_updated_by": staff_id,
            },
            "$push": {"history": history_entry},
        },
    )

    return jsonify(
        {
            "message": "Status updated successfully",
            "complaint_id": complaint_id,
            "old_status": old_status,
            "new_status": new_status,
        }
    ), 200


@complaints_bp.route("/complaint/<complaint_id>", methods=["GET"])
def get_complaint_by_id(complaint_id):
    complaint = complaints_collection.find_one({"complaint_id": complaint_id}, {"_id": 0})
    if not complaint:
        return jsonify({"error": "Complaint not found"}), 404

    _serialize_datetime_fields(complaint)
    return jsonify(complaint), 200
