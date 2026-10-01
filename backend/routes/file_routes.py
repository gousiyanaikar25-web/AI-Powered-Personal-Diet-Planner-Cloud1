import os
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
from firebase_admin import storage

from middleware.auth_middleware import require_authentication
from services.firebase_service import get_firestore


file_bp = Blueprint(
    "files",
    __name__,
    url_prefix="/api"
)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".txt",
    ".doc",
    ".docx",
}


@file_bp.post("/upload")
@require_authentication
def upload_file():
    uploaded = request.files.get("file")

    if uploaded is None:
        return jsonify({
            "success": False,
            "error": "No file supplied",
        }), 400

    original_name = uploaded.filename or "file"
    filename = secure_filename(original_name)

    extension = os.path.splitext(filename)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        return jsonify({
            "success": False,
            "error": "File type not allowed",
        }), 400

    content = uploaded.read()

    if len(content) > 10 * 1024 * 1024:
        return jsonify({
            "success": False,
            "error": "Maximum file size is 10 MB",
        }), 413

    uid = request.user_id
    object_path = f"users/{uid}/files/{filename}"

    try:
        bucket = storage.bucket()
        blob = bucket.blob(object_path)

        blob.upload_from_string(
            content,
            content_type=uploaded.content_type or "application/octet-stream",
        )

        db = get_firestore()

        metadata = {
            "name": filename,
            "originalName": original_name,
            "storagePath": object_path,
            "contentType": uploaded.content_type,
            "size": len(content),
            "uploadedAt": datetime.now(timezone.utc).isoformat(),
        }

        document = (
            db.collection("users")
            .document(uid)
            .collection("files")
            .document()
        )

        document.set(metadata)

        return jsonify({
            "success": True,
            "file": {
                "id": document.id,
                **metadata,
            },
        }), 201

    except Exception as error:
        print("Upload error:", error)

        return jsonify({
            "success": False,
            "error": (
                "Cloud Storage upload failed. "
                "Check Firebase Storage availability and configuration."
            ),
        }), 500


@file_bp.get("/files")
@require_authentication
def get_files():
    db = get_firestore()
    uid = request.user_id

    documents = (
        db.collection("users")
        .document(uid)
        .collection("files")
        .order_by("uploadedAt", direction="DESCENDING")
        .stream()
    )

    files = []

    for document in documents:
        item = document.to_dict() or {}
        item["id"] = document.id
        files.append(item)

    return jsonify({
        "success": True,
        "files": files,
    }), 200


@file_bp.delete("/files/<file_id>")
@require_authentication
def delete_file(file_id):
    db = get_firestore()
    uid = request.user_id

    reference = (
        db.collection("users")
        .document(uid)
        .collection("files")
        .document(file_id)
    )

    document = reference.get()

    if not document.exists:
        return jsonify({
            "success": False,
            "error": "File not found",
        }), 404

    data = document.to_dict() or {}
    storage_path = data.get("storagePath")

    try:
        if storage_path:
            bucket = storage.bucket()
            bucket.blob(storage_path).delete()
    except Exception as error:
        print("Storage delete warning:", error)

    reference.delete()

    return jsonify({
        "success": True,
        "message": "File deleted successfully",
    }), 200
