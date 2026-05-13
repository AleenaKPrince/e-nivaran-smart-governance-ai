from bson import ObjectId
from flask import Blueprint, current_app, jsonify, request

from db import complaints_collection, users_collection
from middleware.jwt_required import jwt_required

staff_bp = Blueprint("staff", __name__)
ALLOWED_STATUS = ["Submitted", "In Progress", "Resolved"]


def _serialize_complaint(complaint):
    complaint.pop("_id", None)
    for field in ["created_at", "assigned_at", "updated_at"]:
        if field in complaint and hasattr(complaint[field], "isoformat"):
            complaint[field] = complaint[field].isoformat()

    history = complaint.get("history", [])
    if isinstance(history, list):
        for entry in history:
            if "timestamp" in entry and hasattr(entry["timestamp"], "isoformat"):
                entry["timestamp"] = entry["timestamp"].isoformat()


def _calculate_stats(complaints):
    return {
        "total": len(complaints),
        "submitted": sum(1 for c in complaints if c.get("status") == "Submitted"),
        "in_progress": sum(1 for c in complaints if c.get("status") == "In Progress"),
        "resolved": sum(1 for c in complaints if c.get("status") == "Resolved"),
        "critical": sum(1 for c in complaints if c.get("priority") == "Critical"),
        "high_priority": sum(1 for c in complaints if c.get("priority") == "High"),
    }


def _assigned_filter(staff_id):
    # Support both string and ObjectId storage formats for assigned_to.
    filters = [{"assigned_to": staff_id}]
    if ObjectId.is_valid(staff_id):
        filters.append({"assigned_to": ObjectId(staff_id)})
    return {"$or": filters}


def _is_assigned_to_staff(complaint, staff_id):
    assigned_to = complaint.get("assigned_to")
    return str(assigned_to) == str(staff_id)


@staff_bp.route("/staff/dashboard", methods=["GET"])
@jwt_required(required_role="staff")
def staff_dashboard():
    staff_id = request.user["user_id"]
    current_app.logger.info("staff_dashboard request user=%s", request.user)

    complaints = list(
        complaints_collection.find(_assigned_filter(staff_id), {"_id": 0, "status": 1, "priority": 1})
    )
    stats = _calculate_stats(complaints)

    return jsonify(
        {
            "staff_id": staff_id,
            "department": request.user.get("department"),
            "total_complaints": stats["total"],
            "submitted": stats["submitted"],
            "in_progress": stats["in_progress"],
            "resolved": stats["resolved"],
            "critical": stats["critical"],
            "high_priority": stats["high_priority"],
        }
    ), 200


@staff_bp.route("/staff/complaints", methods=["GET"])
@jwt_required(required_role="staff")
def get_staff_complaints():
    staff_id = request.user["user_id"]
    current_app.logger.info("get_staff_complaints request user=%s", request.user)

    requested_assigned_to = request.args.get("assigned_to")
    status = request.args.get("status")

    if requested_assigned_to and requested_assigned_to != staff_id:
        return jsonify({"error": "You can only view complaints assigned to you"}), 403

    query = _assigned_filter(staff_id)
    if status:
        if status not in ALLOWED_STATUS:
            return jsonify({"error": "Invalid status value"}), 400
        query["status"] = status

    complaints = list(complaints_collection.find(query).sort("created_at", -1))

    for complaint in complaints:
        _serialize_complaint(complaint)
        complaint["history"] = []

    return jsonify(
        {
            "staff_id": staff_id,
            "complaints": complaints,
            "stats": _calculate_stats(complaints),
        }
    ), 200


@staff_bp.route("/staff/complaints/<complaint_id>", methods=["GET"])
@jwt_required(required_role="staff")
def get_complaint_details(complaint_id):
    staff_id = request.user["user_id"]
    current_app.logger.info("get_complaint_details request user=%s complaint_id=%s", request.user, complaint_id)

    complaint = complaints_collection.find_one({"complaint_id": complaint_id})
    if not complaint:
        return jsonify({"error": "Complaint not found"}), 404

    if not _is_assigned_to_staff(complaint, staff_id):
        return jsonify({"error": "This complaint is not assigned to you"}), 403

    _serialize_complaint(complaint)
    if "history" not in complaint or not isinstance(complaint["history"], list):
        complaint["history"] = []

    return jsonify(complaint), 200


@staff_bp.route("/admin/staff/<staff_id>/deactivate", methods=["PUT"])
@jwt_required(required_role="admin")
def deactivate_staff(staff_id):
    staff = users_collection.find_one({"user_id": staff_id, "role": "staff"})
    if not staff:
        return jsonify({"error": "Staff not found"}), 404

    users_collection.update_one({"user_id": staff_id}, {"$set": {"is_active": False}})
    complaints_collection.update_many({"assigned_to": staff_id}, {"$set": {"assigned_to": None}})

    return jsonify(
        {
            "message": "Staff deactivated successfully",
            "staff_id": staff_id,
            "reassignment": "Complaints have been marked as unassigned",
        }
    ), 200


@staff_bp.route("/admin/staff/<staff_id>", methods=["DELETE"])
@jwt_required(required_role="admin")
def delete_staff(staff_id):
    staff = users_collection.find_one({"user_id": staff_id, "role": "staff"})
    if not staff:
        return jsonify({"error": "Staff not found"}), 404

    users_collection.delete_one({"user_id": staff_id, "role": "staff"})
    complaints_collection.update_many({"assigned_to": staff_id}, {"$set": {"assigned_to": None}})

    return jsonify(
        {
            "message": "Staff deleted successfully",
            "staff_id": staff_id,
            "reassignment": "Complaints have been marked as unassigned",
        }
    ), 200
