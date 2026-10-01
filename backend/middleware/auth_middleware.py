from functools import wraps

from flask import request, jsonify
from firebase_admin import auth

from services.firebase_service import initialize_firebase


def require_authentication(function):
    @wraps(function)
    def decorated_function(*args, **kwargs):

        authorization = request.headers.get("Authorization", "")

        if not authorization.startswith("Bearer "):
            return jsonify({
                "success": False,
                "error": "Missing or invalid Authorization header"
            }), 401

        id_token = authorization.split("Bearer ", 1)[1].strip()

        if not id_token:
            return jsonify({
                "success": False,
                "error": "Missing Firebase ID token"
            }), 401

        try:
            # Initialize Firebase Admin SDK before verifying the token
            initialize_firebase()

            decoded_token = auth.verify_id_token(id_token, clock_skew_seconds=10)

            request.user = decoded_token
            request.user_id = decoded_token["uid"]

            return function(*args, **kwargs)

        except Exception as error:
            print("Firebase authentication error:", error)

            return jsonify({
                "success": False,
                "error": "Invalid or expired authentication token"
            }), 401

    return decorated_function
