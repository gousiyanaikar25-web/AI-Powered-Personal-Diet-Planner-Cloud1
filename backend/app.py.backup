from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

from routes import register_routes

app = Flask(__name__)

CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True
)

app.config["JSON_SORT_KEYS"] = False

register_routes(app)


@app.get("/")
def home():
    return jsonify({
        "success": True,
        "message": "AI-Powered Personal Diet Planner API",
        "status": "running"
    })


@app.get("/api/health")
def health():
    return jsonify({
        "success": True,
        "service": "Flask REST API",
        "status": "healthy"
    })


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Route not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500


if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"

    app.run(
        host=host,
        port=port,
        debug=debug
    )
