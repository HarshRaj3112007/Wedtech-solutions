"""Budget output routes — view estimate, share link."""

from flask import Blueprint, render_template, abort, jsonify
from models import BudgetSession

budget_bp = Blueprint("budget", __name__)


@budget_bp.route("/<int:session_id>")
def view(session_id):
    """Full budget output dashboard."""
    session = BudgetSession.query.get_or_404(session_id)
    if not session.budget_summary:
        abort(404)

    # Build chart data for pie chart (allocation by cost head)
    chart_data = _build_chart_data(session)

    return render_template("budget/view.html", budget_session=session,
                           chart_data=chart_data, readonly=False)


@budget_bp.route("/<int:session_id>/data")
def data_json(session_id):
    """JSON endpoint for budget data (used by charts)."""
    session = BudgetSession.query.get_or_404(session_id)
    if not session.budget_summary:
        abort(404)

    chart_data = _build_chart_data(session)
    summary = session.budget_summary

    return jsonify({
        "total_low": summary.total_low,
        "total_mid": summary.total_mid,
        "total_high": summary.total_high,
        "confidence": summary.overall_confidence_score,
        "chart_data": chart_data,
    })


def _build_chart_data(session):
    """Build cost allocation data for charts."""
    heads = []

    # Venue
    v = session.venue_cost
    if v:
        heads.append({"name": "Venue & Accommodation", "low": v.total_low,
                       "mid": v.total_mid, "high": v.total_high})

    # F&B (sum across functions)
    fnb_low = fnb_mid = fnb_high = 0
    for func in session.functions:
        if func.fnb_cost:
            fnb_low += func.fnb_cost.total_low
            fnb_mid += func.fnb_cost.total_mid
            fnb_high += func.fnb_cost.total_high
    if fnb_low or fnb_high:
        heads.append({"name": "Food & Beverage", "low": fnb_low,
                       "mid": fnb_mid, "high": fnb_high})

    # Decor (sum across functions)
    dec_low = dec_mid = dec_high = 0
    for func in session.functions:
        if func.decor_cost:
            dec_low += func.decor_cost.ai_predicted_low
            dec_mid += func.decor_cost.ai_predicted_mid
            dec_high += func.decor_cost.ai_predicted_high
    if dec_low or dec_high:
        heads.append({"name": "Décor & Design", "low": dec_low,
                       "mid": dec_mid, "high": dec_high})

    # Artists
    art_low = sum(b.cost_low for b in session.artist_bookings)
    art_high = sum(b.cost_high for b in session.artist_bookings)
    if art_low or art_high:
        heads.append({"name": "Artists & Entertainment", "low": art_low,
                       "mid": (art_low + art_high) / 2, "high": art_high})

    # Logistics
    lg = session.logistics_cost
    if lg:
        heads.append({"name": "Logistics & Transfers", "low": lg.total_low,
                       "mid": (lg.total_low + lg.total_high) / 2, "high": lg.total_high})

    # Sundries
    su = session.sundries_cost
    if su:
        heads.append({"name": "Sundries & Basics", "low": su.total_low,
                       "mid": (su.total_low + su.total_high) / 2, "high": su.total_high})

    return heads
