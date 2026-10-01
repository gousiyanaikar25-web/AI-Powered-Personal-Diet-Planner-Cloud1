import os
import firebase_admin

from firebase_admin import credentials, firestore
from config.config import Config

_firebase_app = None
_firestore_client = None


def initialize_firebase():
    global _firebase_app

    if _firebase_app:
        return _firebase_app

    if firebase_admin._apps:
        _firebase_app = firebase_admin.get_app()
        return _firebase_app

    service_account_file = Config.FIREBASE_SERVICE_ACCOUNT_FILE

    if not os.path.isabs(service_account_file):
        service_account_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            service_account_file,
        )

    if not os.path.exists(service_account_file):
        raise FileNotFoundError(
            f"Firebase service account file not found: {service_account_file}"
        )

    credential = credentials.Certificate(service_account_file)

    options = {
        "projectId": Config.FIREBASE_PROJECT_ID,
    }

    storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")

    if storage_bucket:
        options["storageBucket"] = storage_bucket

    _firebase_app = firebase_admin.initialize_app(
        credential,
        options,
    )

    return _firebase_app


def get_firestore():
    global _firestore_client

    if _firestore_client:
        return _firestore_client

    initialize_firebase()

    _firestore_client = firestore.client()

    return _firestore_client
