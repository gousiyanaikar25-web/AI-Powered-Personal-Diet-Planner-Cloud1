from flask import Flask

from routes.auth_routes import auth_bp
from routes.profile_routes import profile_bp
from routes.plan_routes import plans_bp
from routes.generate_routes import generate_bp
from routes.file_routes import file_bp
from routes.intake_routes import intake_bp


def register_routes(app: Flask):
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(plans_bp)
    app.register_blueprint(generate_bp)
    app.register_blueprint(file_bp)
    app.register_blueprint(intake_bp)
