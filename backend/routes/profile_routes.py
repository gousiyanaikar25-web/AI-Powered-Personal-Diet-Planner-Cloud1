from flask import Blueprint, jsonify, request

from middleware.auth_middleware import require_authentication
from services.firebase_service import get_firestore


profile_bp = Blueprint("profile", __name__, url_prefix="/api")


@profile_bp.get("/profile")
@require_authentication
def get_profile():

    db = get_firestore()
    uid = request.user_id

    document = (
        db.collection("users")
        .document(uid)
        .collection("profile")
        .document("data")
        .get()
    )

    if not document.exists:
        return jsonify({
            "success": True,
            "profile": None,
            "message": "Profile not created yet"
        }), 200

    return jsonify({
        "success": True,
        "profile": document.to_dict()
    }), 200


@profile_bp.put("/profile")
@require_authentication
def update_profile():

    data = request.get_json(silent=True) or {}

    allowed_fields = [
        "name",
        "age",
        "sex",
        "height_cm",
        "weight_kg",
        "activity_level",
        "goal",
        "diet_pref",
        "allergies",
        "cuisines",
        "budget_per_day",
        "timeline_weeks"
    ]

    profile = {
        key: data[key]
        for key in allowed_fields
        if key in data
    }

    if not profile:
        return jsonify({
            "success": False,
            "error": "No valid profile fields supplied"
        }), 400

    from datetime import datetime, timezone

    profile["updatedAt"] = datetime.now(timezone.utc).isoformat()

    db = get_firestore()
    uid = request.user_id

    (
        db.collection("users")
        .document(uid)
        .collection("profile")
        .document("data")
        .set(profile, merge=True)
    )

    return jsonify({
        "success": True,
        "message": "Profile updated successfully",
        "profile": profile
    }), 200
