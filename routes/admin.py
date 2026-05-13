from datetime import datetime
import uuid

from flask import Blueprint, jsonify, request

from db import complaints_collection, settings_collection, users_collection
from middleware.jwt_required import jwt_required
from utils.password_handler import hash_password

admin_bp = Blueprint("admin", __name__)
ALLOWED_STATUS = ["Submitted", "In Progress", "Resolved"]

DEPARTMENTS = {
    "Health",
    "Electricity Board",
    "Local Self Government",
    "Public Works",
    "Transport",
    "Fire and Rescue",
    "Police",
}

DEPARTMENT_MAPPING = {
    "Health": "Health",
    "Health Department": "Health",
    "Electricity": "Electricity Board",
    "Electricity Board": "Electricity Board",
    "Fire Department": "Fire and Rescue",
    "Fire and Rescue": "Fire and Rescue",
    "Local Self Government": "Local Self Government",
    "Local Self-Government": "Local Self Government",
    "Police": "Police",
    "Public Works": "Public Works",
    "Transport": "Transport",
    "Sanitation": "Public Works",
    "Unclassified": "Health",
}

SEED_DEPARTMENTS = [
    "Health",
    "Electricity Board",
    "Local Self Government",
    "Public Works",
    "Transport",
    "Fire and Rescue",
    "Police",
]

DEFAULT_SETTINGS = {
    "ai_confidence_threshold": 0.5,
    "enable_ai_routing": True,
    "enable_rule_routing": True,
    "priority_rules": [
        {"name": "Low", "min": 0, "max": 3},
        {"name": "Medium", "min": 4, "max": 6},
        {"name": "High", "min": 7, "max": 8},
        {"name": "Critical", "min": 9, "max": 10},
    ],
    "auto_assign": False,
    "allow_manual_override": True,
    "default_unclassified_department": "Health",
    "allow_reassignment": True,
    "lock_after_resolution": False,
}


def _validate_status_filter(status):
    if status and status not in ALLOWED_STATUS:
        return False
    return True


def _get_assignable_departments():
    staff_departments = users_collection.distinct("department", {"role": "staff"})
    staff_departments = [d for d in staff_departments if d]
    if staff_departments:
        return sorted(set(staff_departments))
    return sorted(
        [
            "Health",
            "Electricity",
            "Local Self Government",
            "Public Works",
            "Transport",
            "Fire and Rescue",
            "Police",
        ]
    )


@admin_bp.route("/admin/reports", methods=["GET"])
@jwt_required(required_role="admin")
def get_admin_reports():
    status = request.args.get("status")
    if not _validate_status_filter(status):
        return jsonify({"error": "Invalid status value"}), 400

    filters = {"status": status} if status else {}

    pipeline_status = []
    if filters:
        pipeline_status.append({"$match": filters})
    pipeline_status.append({"$group": {"_id": "$status", "count": {"$sum": 1}}})

    status_counts = {row["_id"]: row["count"] for row in complaints_collection.aggregate(pipeline_status)}
    for status_name in ALLOWED_STATUS:
        status_counts.setdefault(status_name, 0)

    pipeline_department = []
    if filters:
        pipeline_department.append({"$match": filters})
    pipeline_department.append({"$group": {"_id": "$department", "count": {"$sum": 1}}})

    department_counts = [
        {"department": row["_id"], "count": row["count"]}
        for row in complaints_collection.aggregate(pipeline_department)
    ]

    staff_members = list(users_collection.find({"role": "staff"}, {"_id": 0, "user_id": 1, "name": 1}))
    staff_performance = []
    for staff in staff_members:
        resolved_filters = {"assigned_to": staff["user_id"], "status": "Resolved"}
        if status and status != "Resolved":
            resolved_count = 0
        else:
            resolved_count = complaints_collection.count_documents(resolved_filters)

        staff_performance.append(
            {
                "staff_id": staff["user_id"],
                "staff_name": staff.get("name"),
                "resolved_complaints": resolved_count,
            }
        )

    return jsonify(
        {
            "filters": {"status": status},
            "counts_by_status": status_counts,
            "counts_by_department": department_counts,
            "staff_performance": staff_performance,
        }
    ), 200


@admin_bp.route("/reports/summary", methods=["GET"])
@jwt_required(required_role="admin")
def get_analytics_summary():
    total_complaints = complaints_collection.count_documents({})
    resolved_complaints = complaints_collection.count_documents({"status": "Resolved"})
    pending_complaints = complaints_collection.count_documents({"status": {"$in": ["Submitted", "In Progress"]}})
    total_staff = users_collection.count_documents({"role": "staff"})
    total_departments = len(DEPARTMENTS)

    return jsonify(
        {
            "total_complaints": total_complaints,
            "total_departments": total_departments,
            "total_staff": total_staff,
            "resolved_complaints": resolved_complaints,
            "pending_complaints": pending_complaints,
        }
    ), 200


@admin_bp.route("/reports/departments", methods=["GET"])
@jwt_required(required_role="admin")
def get_department_analytics():
    department_stats = []

    for dept in DEPARTMENTS:
        total = complaints_collection.count_documents({"department": dept})
        in_progress = complaints_collection.count_documents({"department": dept, "status": "In Progress"})
        resolved = complaints_collection.count_documents({"department": dept, "status": "Resolved"})
        unassigned = complaints_collection.count_documents({"department": dept, "status": "Submitted"})

        for complaint_dept, mapped_dept in DEPARTMENT_MAPPING.items():
            if mapped_dept == dept and complaint_dept != dept:
                total += complaints_collection.count_documents({"department": complaint_dept})
                in_progress += complaints_collection.count_documents(
                    {"department": complaint_dept, "status": "In Progress"}
                )
                resolved += complaints_collection.count_documents(
                    {"department": complaint_dept, "status": "Resolved"}
                )
                unassigned += complaints_collection.count_documents(
                    {"department": complaint_dept, "status": "Submitted"}
                )

        department_stats.append(
            {
                "department": dept,
                "total": total,
                "in_progress": in_progress,
                "resolved": resolved,
                "unassigned": unassigned,
            }
        )

    return jsonify(department_stats), 200


@admin_bp.route("/reports/staff-workload", methods=["GET"])
@jwt_required(required_role="admin")
def get_staff_workload():
    staff_by_department = {}

    staff_members = list(
        users_collection.find(
            {"role": "staff"},
            {"_id": 0, "user_id": 1, "name": 1, "email": 1, "department": 1},
        )
    )

    for staff in staff_members:
        dept = staff.get("department")
        staff_id = staff.get("user_id")

        if dept not in staff_by_department:
            staff_by_department[dept] = []

        total_assigned = complaints_collection.count_documents({"assigned_to": staff_id})
        resolved = complaints_collection.count_documents({"assigned_to": staff_id, "status": "Resolved"})
        in_progress = complaints_collection.count_documents({"assigned_to": staff_id, "status": "In Progress"})

        staff_by_department[dept].append(
            {
                "staff_id": staff_id,
                "name": staff.get("name"),
                "email": staff.get("email"),
                "total_assigned": total_assigned,
                "resolved": resolved,
                "in_progress": in_progress,
            }
        )

    result = []
    for dept in DEPARTMENTS:
        result.append({"department": dept, "staff": staff_by_department.get(dept, [])})

    return jsonify(result), 200


@admin_bp.route("/reports/status-breakdown", methods=["GET"])
@jwt_required(required_role="admin")
def get_status_breakdown():
    submitted = complaints_collection.count_documents({"status": "Submitted"})
    in_progress = complaints_collection.count_documents({"status": "In Progress"})
    resolved = complaints_collection.count_documents({"status": "Resolved"})

    return jsonify(
        {
            "submitted": submitted,
            "in_progress": in_progress,
            "resolved": resolved,
            "total": submitted + in_progress + resolved,
        }
    ), 200


@admin_bp.route("/seed-staff-and-assign", methods=["POST"])
@jwt_required(required_role="admin")
def seed_staff_and_assign():
    staff_password = "Smart@123"
    results = {
        "staff_created": {},
        "complaints_assigned": {},
        "total_staff_created": 0,
        "total_complaints_assigned": 0,
        "errors": [],
    }

    for department in SEED_DEPARTMENTS:
        staff_ids = []
        for i in range(1, 3):
            email = f"staff{i}@{department.lower().replace(' ', '')}.com"
            existing_staff = users_collection.find_one({"email": email, "role": "staff"})
            if existing_staff:
                staff_ids.append(existing_staff["user_id"])
                continue

            user_id = str(uuid.uuid4())
            staff_doc = {
                "user_id": user_id,
                "name": f"Staff {i} - {department}",
                "email": email,
                "password": hash_password(staff_password),
                "role": "staff",
                "department": department,
                "is_active": True,
                "created_at": datetime.utcnow(),
            }
            users_collection.insert_one(staff_doc)
            staff_ids.append(user_id)
            results["total_staff_created"] += 1

        results["staff_created"][department] = staff_ids

    for department in SEED_DEPARTMENTS:
        staff_ids = results["staff_created"].get(department, [])
        if not staff_ids:
            results["complaints_assigned"][department] = {"assigned": 0, "reason": "No staff available"}
            continue

        unassigned = list(
            complaints_collection.find(
                {
                    "department": department,
                    "$or": [{"assigned_to": {"$exists": False}}, {"assigned_to": None}],
                }
            )
        )

        assigned_count = 0
        for idx, complaint in enumerate(unassigned):
            assigned_staff_id = staff_ids[idx % len(staff_ids)]
            complaints_collection.update_one(
                {"complaint_id": complaint["complaint_id"]},
                {
                    "$set": {"assigned_to": assigned_staff_id, "assigned_at": datetime.utcnow()},
                },
            )
            assigned_count += 1
            results["total_complaints_assigned"] += 1

        results["complaints_assigned"][department] = {"assigned": assigned_count, "staff_count": len(staff_ids)}

    unassigned_check = complaints_collection.count_documents(
        {
            "$or": [{"assigned_to": {"$exists": False}}, {"assigned_to": None}],
            "department": {"$nin": ["Unclassified", "Unclassified Department"]},
        }
    )

    results["verification"] = {
        "remaining_unassigned": unassigned_check,
        "status": "success" if unassigned_check == 0 else "partial",
    }

    return jsonify(results), 200


@admin_bp.route("/admin/settings", methods=["GET"])
@jwt_required(required_role="admin")
def get_system_settings():
    doc = settings_collection.find_one({})
    if not doc:
        settings_collection.insert_one({**DEFAULT_SETTINGS})
        doc = settings_collection.find_one({})

    doc.pop("_id", None)
    return jsonify(doc), 200


@admin_bp.route("/admin/settings", methods=["POST"])
@jwt_required(required_role="admin")
def update_system_settings():
    payload = request.get_json() or {}
    new_settings = {**DEFAULT_SETTINGS, **payload}
    settings_collection.replace_one({}, new_settings, upsert=True)
    return jsonify(new_settings), 200


@admin_bp.route("/admin/complaints/unassigned", methods=["GET"])
@jwt_required(required_role="admin")
def get_unassigned_complaints():
    query = {
        "$or": [
            {"assigned_to": None},
            {"assigned_to": {"$exists": False}},
            {"department": "Unclassified"},
        ]
    }
    complaints = list(
        complaints_collection.find(
            query,
            {
                "_id": 0,
                "complaint_id": 1,
                "description": 1,
                "department": 1,
                "priority": 1,
                "status": 1,
                "assigned_to": 1,
            },
        ).sort("created_at", -1)
    )
    return jsonify({"complaints": complaints}), 200


@admin_bp.route("/admin/staff", methods=["GET"])
@jwt_required(required_role="admin")
def get_staff_list():
    department = request.args.get("department")
    filters = {"role": "staff"}
    if department:
        filters["department"] = department
    filters["$or"] = [{"is_active": {"$exists": False}}, {"is_active": True}]

    staff_members = list(
        users_collection.find(
            filters,
            {"_id": 0, "user_id": 1, "name": 1, "email": 1, "department": 1},
        ).sort("name", 1)
    )
    return jsonify({"staff": staff_members, "departments": _get_assignable_departments()}), 200


@admin_bp.route("/admin/complaints/<complaint_id>/assign", methods=["PATCH"])
@jwt_required(required_role="admin")
def assign_complaint_manually(complaint_id):
    data = request.get_json() or {}
    department = data.get("department")
    staff_id = data.get("staff_id")
    admin_id = request.user.get("user_id")

    if not department or not staff_id:
        return jsonify({"error": "department and staff_id are required"}), 400

    if department not in _get_assignable_departments():
        return jsonify({"error": "Invalid department"}), 400

    staff = users_collection.find_one({"user_id": staff_id, "role": "staff"})
    if not staff:
        return jsonify({"error": "Staff not found"}), 404

    if staff.get("department") != department:
        return jsonify({"error": "Selected staff does not belong to selected department"}), 400

    if staff.get("is_active", True) is False:
        return jsonify({"error": "Selected staff is not active"}), 400

    complaint = complaints_collection.find_one({"complaint_id": complaint_id})
    if not complaint:
        return jsonify({"error": "Complaint not found"}), 404

    now = datetime.utcnow()
    current_status = complaint.get("status")
    history_entry = {
        "updated_by": admin_id,
        "old_status": current_status,
        "new_status": current_status,
        "action": f"Manual assignment by admin to {staff_id} in {department}",
        "timestamp": now,
    }

    complaints_collection.update_one(
        {"complaint_id": complaint_id},
        {
            "$set": {
                "department": department,
                "assigned_to": staff_id,
                "routing_mode": "MANUAL",
                "assigned_at": now,
                "updated_at": now,
                "last_updated_by": admin_id,
            },
            "$push": {"history": history_entry},
        },
    )

    return jsonify({"message": "Complaint assigned successfully"}), 200

