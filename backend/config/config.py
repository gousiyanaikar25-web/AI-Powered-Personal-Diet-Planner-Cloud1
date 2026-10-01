import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
    FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")

    FIREBASE_SERVICE_ACCOUNT_FILE = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_FILE",
        "firebase-service-account.json",
    )

    FIREBASE_STORAGE_BUCKET = os.getenv(
        "FIREBASE_STORAGE_BUCKET",
        "",
    )

    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", "5000"))
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "True").lower() == "true"
