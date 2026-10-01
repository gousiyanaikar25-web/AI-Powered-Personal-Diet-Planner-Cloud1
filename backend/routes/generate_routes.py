from flask import Blueprint, jsonify, request

from middleware.auth_middleware import require_authentication
from services.firebase_service import get_firestore
from ai_engine.diet_engine import generate_plan


generate_bp = Blueprint(
    "generate",
    __name__,
    url_prefix="/api"
)


@generate_bp.post("/generate-plan")
@require_authentication
def generate_diet_plan():
    data = request.get_json(silent=True) or {}

    required = [
        "age",
        "sex",
        "height_cm",
        "weight_kg",
        "activity_level",
        "goal",
        "diet_pref",
    ]

    missing = [
        field for field in required
        if field not in data or data[field] in ("", None)
    ]

    if missing:
        return jsonify({
            "success": False,
            "error": "Missing required fields",
            "fields": missing,
        }), 400

    try:
        plan = generate_plan(data)

        db = get_firestore()
        uid = request.user_id

        plan_ref = (
            db.collection("users")
            .document(uid)
            .collection("plans")
            .document()
        )

        from datetime import datetime, timezone

        plan_document = {
            **plan,
            "goal": data.get("goal", ""),
            "diet": data.get("diet_pref", ""),
            "diet_pref": data.get("diet_pref", ""),
            "profile_snapshot": data,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }

        plan_ref.set(plan_document)

        return jsonify({
            "success": True,
            "planId": plan_ref.id,
            "plan": {
                **plan_document,
                "id": plan_ref.id,
            },
        }), 201

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error),
        }), 400

    except Exception as error:
        print("Generate plan error:", error)

        return jsonify({
            "success": False,
            "error": "Unable to generate diet plan.",
        }), 500
