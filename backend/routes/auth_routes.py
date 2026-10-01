from flask import Blueprint, jsonify, request
from config.config import Config
import requests


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():

    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "error": "Email and password are required"
        }), 400

    if len(password) < 6:
        return jsonify({
            "success": False,
            "error": "Password must contain at least 6 characters"
        }), 400

    if not Config.FIREBASE_API_KEY:
        return jsonify({
            "success": False,
            "error": "Firebase API key is not configured"
        }), 500

    url = (
        "https://identitytoolkit.googleapis.com/v1/"
        f"accounts:signUp?key={Config.FIREBASE_API_KEY}"
    )

    response = requests.post(
        url,
        json={
            "email": email,
            "password": password,
            "returnSecureToken": True
        },
        timeout=15
    )

    result = response.json()

    if not response.ok:
        return jsonify({
            "success": False,
            "error": result.get("error", {}).get(
                "message",
                "Registration failed"
            )
        }), response.status_code

    return jsonify({
        "success": True,
        "message": "User registered successfully",
        "user": {
            "localId": result.get("localId"),
            "email": result.get("email"),
            "idToken": result.get("idToken"),
            "refreshToken": result.get("refreshToken")
        }
    }), 201


@auth_bp.post("/login")
def login():

    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "error": "Email and password are required"
        }), 400

    if not Config.FIREBASE_API_KEY:
        return jsonify({
            "success": False,
            "error": "Firebase API key is not configured"
        }), 500

    url = (
        "https://identitytoolkit.googleapis.com/v1/"
        f"accounts:signInWithPassword?key={Config.FIREBASE_API_KEY}"
    )

    response = requests.post(
        url,
        json={
            "email": email,
            "password": password,
            "returnSecureToken": True
        },
        timeout=15
    )

    result = response.json()

    if not response.ok:
        return jsonify({
            "success": False,
            "error": result.get("error", {}).get(
                "message",
                "Login failed"
            )
        }), response.status_code

    return jsonify({
        "success": True,
        "message": "Login successful",
        "user": {
            "localId": result.get("localId"),
            "email": result.get("email"),
            "idToken": result.get("idToken"),
            "refreshToken": result.get("refreshToken")
        }
    }), 200



