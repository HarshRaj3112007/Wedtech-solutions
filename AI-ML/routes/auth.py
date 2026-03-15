"""Authentication routes — login, register, logout."""

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Planner

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        planner = Planner.query.filter_by(email=email).first()

        if planner and check_password_hash(planner.password_hash, password):
            session["planner_id"] = planner.id
            session["is_admin"] = planner.is_admin
            flash("Logged in successfully.", "success")
            if planner.is_admin:
                return redirect(url_for("admin.dashboard"))
            return redirect(url_for("main.index"))
        flash("Invalid email or password.", "error")

    return render_template("auth/login.html")


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        org_name = request.form.get("org_name", "").strip()

        if Planner.query.filter_by(email=email).first():
            flash("Email already registered.", "error")
        elif len(password) < 6:
            flash("Password must be at least 6 characters.", "error")
        else:
            planner = Planner(
                name=name, email=email,
                password_hash=generate_password_hash(password),
                org_name=org_name or None,
            )
            db.session.add(planner)
            db.session.commit()
            session["planner_id"] = planner.id
            session["is_admin"] = planner.is_admin
            flash("Account created successfully.", "success")
            return redirect(url_for("main.index"))

    return render_template("auth/register.html")


@auth_bp.route("/logout")
def logout():
    session.clear()
    flash("Logged out.", "info")
    return redirect(url_for("main.index"))
