from flask import Blueprint, jsonify, request

from middleware.auth_middleware import require_authentication
from services.firebase_service import get_firestore


plans_bp = Blueprint(
    "plans",
    __name__,
    url_prefix="/api"
)


def _plans_collection():
    db = get_firestore()
    uid = request.user_id

    return (
        db.collection("users")
        .document(uid)
        .collection("plans")
    )


@plans_bp.get("/plans")
@require_authentication
def get_plans():
    documents = (
        _plans_collection()
        .order_by("createdAt", direction="DESCENDING")
        .stream()
    )

    plans = []

    for document in documents:
        item = document.to_dict() or {}
        item["id"] = document.id
        plans.append(item)

    return jsonify({
        "success": True,
        "plans": plans,
    }), 200


@plans_bp.get("/plans/<plan_id>")
@require_authentication
def get_plan(plan_id):
    document = _plans_collection().document(plan_id).get()

    if not document.exists:
        return jsonify({
            "success": False,
            "error": "Plan not found",
        }), 404

    plan = document.to_dict() or {}
    plan["id"] = document.id

    return jsonify({
        "success": True,
        "plan": plan,
    }), 200


@plans_bp.delete("/plans/<plan_id>")
@require_authentication
def delete_plan(plan_id):
    reference = _plans_collection().document(plan_id)

    if not reference.get().exists:
        return jsonify({
            "success": False,
            "error": "Plan not found",
        }), 404

    reference.delete()

    return jsonify({
        "success": True,
        "message": "Plan deleted successfully",
    }), 200
