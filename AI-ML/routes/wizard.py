"""Smart Input Wizard routes — multi-step budget input form."""

from datetime import date
from flask import Blueprint, render_template, request, redirect, url_for, flash, session as flask_session
from nanoid import generate as nanoid
from models import (
    db, BudgetSession, WeddingFunction, HotelTier, FunctionType,
    DecorStyle, DecorComplexity, MealType, BarType, SessionStatus
)


def _parse_date(value: str):
    """Parse a date string (YYYY-MM-DD) from form input, return None if empty/invalid."""
    if not value or not value.strip():
        return None
    try:
        return date.fromisoformat(value.strip())
    except (ValueError, TypeError):
        return None

wizard_bp = Blueprint("wizard", __name__)

SUPPORTED_CITIES = [
    "Udaipur", "Jaipur", "Mumbai", "Delhi", "Goa",
    "Lonavala", "Mussoorie", "Shimla", "Coorg", "Other"
]


@wizard_bp.route("/start", methods=["GET", "POST"])
def start():
    """Step 1 — Wedding basics: couple names, city, dates, functions."""
    if request.method == "POST":
        # Create a new BudgetSession
        sess = BudgetSession(
            session_code=nanoid(size=10),
            planner_id=flask_session.get("planner_id"),
            couple_name_1=request.form.get("couple_name_1", "").strip(),
            couple_name_2=request.form.get("couple_name_2", "").strip(),
            city=request.form.get("city", "Other"),
            wedding_start_date=_parse_date(request.form.get("wedding_start_date")),
            wedding_end_date=_parse_date(request.form.get("wedding_end_date")),
            num_functions=int(request.form.get("num_functions", 1)),
        )
        db.session.add(sess)
        db.session.flush()

        # Create function records
        num_funcs = sess.num_functions
        for i in range(num_funcs):
            func_name = request.form.get(f"function_name_{i}", "OTHER")
            guest_count = request.form.get(f"function_guests_{i}", "")
            wf = WeddingFunction(
                session_id=sess.id,
                function_name=FunctionType(func_name) if func_name in FunctionType.__members__ else FunctionType.OTHER,
                guest_count_override=int(guest_count) if guest_count else None,
            )
            db.session.add(wf)

        db.session.commit()
        return redirect(url_for("wizard.step2", session_id=sess.id))

    return render_template("wizard/step1.html", cities=SUPPORTED_CITIES,
                           function_types=[ft.value for ft in FunctionType])


@wizard_bp.route("/<int:session_id>/step2", methods=["GET", "POST"])
def step2(session_id):
    """Step 2 — Accommodation: hotel tier, rooms, nights, outstation %."""
    sess = BudgetSession.query.get_or_404(session_id)

    if request.method == "POST":
        sess.hotel_tier = HotelTier(request.form.get("hotel_tier", "4-Star"))
        sess.rooms_count = int(request.form.get("rooms_count", 0))
        sess.nights_count = int(request.form.get("nights_count", 1))
        sess.total_guests = int(request.form.get("total_guests", 100))
        sess.outstation_pct = int(request.form.get("outstation_pct", 50))
        sess.bride_hometown = request.form.get("bride_hometown", "").strip()
        sess.groom_hometown = request.form.get("groom_hometown", "").strip()
        db.session.commit()
        return redirect(url_for("wizard.step3", session_id=sess.id))

    hotel_tiers = [(ht.value, ht.value) for ht in HotelTier]
    return render_template("wizard/step2.html", budget_session=sess,
                           hotel_tiers=hotel_tiers, cities=SUPPORTED_CITIES)


@wizard_bp.route("/<int:session_id>/step3", methods=["GET", "POST"])
def step3(session_id):
    """Step 3 — Décor preferences: style + complexity per function."""
    sess = BudgetSession.query.get_or_404(session_id)

    if request.method == "POST":
        for func in sess.functions:
            style = request.form.get(f"decor_style_{func.id}", "FLORAL")
            complexity = request.form.get(f"decor_complexity_{func.id}", "MEDIUM")
            func.decor_style = DecorStyle(style) if style in DecorStyle.__members__ else DecorStyle.FLORAL
            func.decor_complexity = DecorComplexity(complexity) if complexity in DecorComplexity.__members__ else DecorComplexity.MEDIUM
        db.session.commit()
        return redirect(url_for("wizard.step4", session_id=sess.id))

    return render_template("wizard/step3.html", budget_session=sess,
                           styles=[s.value for s in DecorStyle],
                           complexities=[c.value for c in DecorComplexity])


@wizard_bp.route("/<int:session_id>/step4", methods=["GET", "POST"])
def step4(session_id):
    """Step 4 — Entertainment: artist types per function."""
    sess = BudgetSession.query.get_or_404(session_id)

    if request.method == "POST":
        for func in sess.functions:
            selected = request.form.getlist(f"artist_types_{func.id}")
            func.artist_types = selected
        db.session.commit()
        return redirect(url_for("wizard.step5", session_id=sess.id))

    from models import ArtistType
    return render_template("wizard/step4.html", budget_session=sess,
                           artist_types=[at.value for at in ArtistType])


@wizard_bp.route("/<int:session_id>/step5", methods=["GET", "POST"])
def step5(session_id):
    """Step 5 — F&B: meal type, bar type, specialty counters per function."""
    sess = BudgetSession.query.get_or_404(session_id)

    if request.method == "POST":
        for func in sess.functions:
            meal = request.form.get(f"meal_type_{func.id}", "GALA_DINNER")
            bar = request.form.get(f"bar_type_{func.id}", "DRY")
            counters = request.form.getlist(f"counters_{func.id}")
            func.meal_type = MealType(meal) if meal in MealType.__members__ else MealType.GALA_DINNER
            func.bar_type = BarType(bar) if bar in BarType.__members__ else BarType.DRY
            func.specialty_counters = counters

        sess.photo_video_tier = request.form.get("photo_video_tier", "none")
        db.session.commit()
        return redirect(url_for("wizard.step6", session_id=sess.id))

    return render_template("wizard/step5.html", budget_session=sess,
                           meal_types=[mt.value for mt in MealType],
                           bar_types=[bt.value for bt in BarType])


@wizard_bp.route("/<int:session_id>/step6", methods=["GET", "POST"])
def step6(session_id):
    """Step 6 — Sundries: room baskets, hampers, stationery."""
    sess = BudgetSession.query.get_or_404(session_id)

    if request.method == "POST":
        sess.room_basket_tier = request.form.get("room_basket_tier", "standard")
        sess.gift_hamper_tier = request.form.get("gift_hamper_tier", "none")
        sess.invite_quantity = int(request.form.get("invite_quantity", 0))
        db.session.commit()

        # Generate budget estimate
        from services.budget_engine import BudgetEngine
        engine = BudgetEngine(sess)
        engine.compute_all()

        return redirect(url_for("budget.view", session_id=sess.id))

    return render_template("wizard/step6.html", budget_session=sess)
