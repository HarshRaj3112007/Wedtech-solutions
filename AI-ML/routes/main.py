"""Main routes — landing page and shared estimate view."""

from flask import Blueprint, render_template, abort
from models import BudgetSession, SessionStatus

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    return render_template("index.html")


@main_bp.route("/estimate/<session_code>")
def shared_estimate(session_code):
    """Read-only shareable link to a budget estimate."""
    session = BudgetSession.query.filter_by(session_code=session_code).first()
    if not session:
        abort(404)
    return render_template("budget/view.html", budget_session=session, readonly=True)
