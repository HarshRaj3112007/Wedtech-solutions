"""
WeddingBudget.ai — Flask Application

Product 3 of the WedTech Innovation Challenge.
A data-driven, AI-powered wedding budget estimation tool
for Indian destination weddings.
"""

import os

from flask import Flask
from models import db
from seed import seed_all


def create_app(testing=False):
    app = Flask(__name__)

    # Configuration
    db_path = os.path.join(app.instance_path, "weddingbudget.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        os.environ.get("DATABASE_URL") or f"sqlite:///{db_path}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-prod")

    if testing:
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        app.config["TESTING"] = True

    # Ensure instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)

    # Init extensions
    db.init_app(app)

    # Register template filters
    from lib.format import format_inr, format_inr_short
    app.jinja_env.filters["inr"] = format_inr
    app.jinja_env.filters["inr_short"] = format_inr_short

    # Register blueprints
    from routes.main import main_bp
    from routes.wizard import wizard_bp
    from routes.budget import budget_bp
    from routes.admin import admin_bp
    from routes.auth import auth_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(wizard_bp, url_prefix="/wizard")
    app.register_blueprint(budget_bp, url_prefix="/budget")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(auth_bp, url_prefix="/auth")

    # Create tables and seed data
    with app.app_context():
        db.create_all()
        seed_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
