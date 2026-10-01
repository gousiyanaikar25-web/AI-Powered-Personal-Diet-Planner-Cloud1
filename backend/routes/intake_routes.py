from flask import Blueprint, jsonify, request
from middleware.auth_middleware import require_authentication
from services.firebase_service import get_firestore

intake_bp = Blueprint("intake", __name__, url_prefix="/api")


@intake_bp.put("/intake/<date>")
@require_authentication
def save_intake(date):
    data = request.get_json(silent=True) or {}

    db = get_firestore()
    uid = request.user_id

    document = (
        db.collection("users")
        .document(uid)
        .collection("intake")
        .document(date)
    )

    document.set(data, merge=True)

    return jsonify({
        "success": True,
        "message": "Intake saved successfully",
        "intake": data,
    }), 200


@intake_bp.get("/intake/<date>")
@require_authentication
def get_intake(date):
    db = get_firestore()
    uid = request.user_id

    document = (
        db.collection("users")
        .document(uid)
        .collection("intake")
        .document(date)
        .get()
    )

    if not document.exists:
        return jsonify({
            "success": True,
            "intake": None,
        }), 200

    return jsonify({
        "success": True,
        "intake": document.to_dict(),
    }), 200
