"""Admin panel routes — rate card CRUD, artist directory, analytics."""

from functools import wraps
from flask import (
    Blueprint, render_template, request, redirect, url_for,
    flash, session as flask_session, abort
)
from models import (
    db, CityRateCard, FnBRateCard, ArtistDirectory, LogisticsRateCard,
    SundriesRateCard, CityFactor, BudgetSession, HotelTier, MealType,
    BarType, ArtistType, LogisticsItemType, SundriesItemType
)

admin_bp = Blueprint("admin", __name__)


def admin_required(f):
    """Decorator to restrict access to admin users."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not flask_session.get("is_admin"):
            flash("Admin access required.", "error")
            return redirect(url_for("auth.login"))
        return f(*args, **kwargs)
    return decorated


# ── Dashboard ──────────────────────────────────────────────

@admin_bp.route("/")
@admin_required
def dashboard():
    session_count = BudgetSession.query.count()
    city_cards = CityRateCard.query.count()
    fnb_cards = FnBRateCard.query.count()
    artists = ArtistDirectory.query.count()
    return render_template("admin/dashboard.html",
                           session_count=session_count,
                           city_cards=city_cards,
                           fnb_cards=fnb_cards,
                           artist_count=artists)


# ── City Rate Cards ────────────────────────────────────────

@admin_bp.route("/city-rates")
@admin_required
def city_rates():
    cards = CityRateCard.query.order_by(CityRateCard.city, CityRateCard.hotel_tier).all()
    return render_template("admin/city_rates.html", cards=cards)


@admin_bp.route("/city-rates/<int:card_id>/edit", methods=["GET", "POST"])
@admin_required
def edit_city_rate(card_id):
    card = CityRateCard.query.get_or_404(card_id)
    if request.method == "POST":
        card.room_rate_min = float(request.form.get("room_rate_min", 0))
        card.room_rate_max = float(request.form.get("room_rate_max", 0))
        card.banquet_rate_per_day_min = float(request.form.get("banquet_min", 0))
        card.banquet_rate_per_day_max = float(request.form.get("banquet_max", 0))
        db.session.commit()
        flash("Rate card updated.", "success")
        return redirect(url_for("admin.city_rates"))
    return render_template("admin/edit_city_rate.html", card=card)


# ── F&B Rate Cards ─────────────────────────────────────────

@admin_bp.route("/fnb-rates")
@admin_required
def fnb_rates():
    cards = FnBRateCard.query.order_by(FnBRateCard.meal_type).all()
    return render_template("admin/fnb_rates.html", cards=cards)


@admin_bp.route("/fnb-rates/<int:card_id>/edit", methods=["GET", "POST"])
@admin_required
def edit_fnb_rate(card_id):
    card = FnBRateCard.query.get_or_404(card_id)
    if request.method == "POST":
        card.per_head_min = float(request.form.get("per_head_min", 0))
        card.per_head_max = float(request.form.get("per_head_max", 0))
        db.session.commit()
        flash("F&B rate updated.", "success")
        return redirect(url_for("admin.fnb_rates"))
    return render_template("admin/edit_fnb_rate.html", card=card)


# ── Artist Directory ───────────────────────────────────────

@admin_bp.route("/artists")
@admin_required
def artists():
    all_artists = ArtistDirectory.query.order_by(ArtistDirectory.artist_type).all()
    return render_template("admin/artists.html", artists=all_artists)


@admin_bp.route("/artists/add", methods=["GET", "POST"])
@admin_required
def add_artist():
    if request.method == "POST":
        artist = ArtistDirectory(
            name=request.form.get("name", "").strip() or None,
            artist_type=ArtistType(request.form.get("artist_type", "DJ")),
            tier_label=request.form.get("tier_label", "").strip(),
            fee_min=float(request.form.get("fee_min", 0)),
            fee_max=float(request.form.get("fee_max", 0)),
            is_named=bool(request.form.get("is_named")),
            notes=request.form.get("notes", "").strip() or None,
        )
        db.session.add(artist)
        db.session.commit()
        flash("Artist added.", "success")
        return redirect(url_for("admin.artists"))
    return render_template("admin/edit_artist.html", artist=None,
                           artist_types=[at.value for at in ArtistType])


@admin_bp.route("/artists/<int:artist_id>/edit", methods=["GET", "POST"])
@admin_required
def edit_artist(artist_id):
    artist = ArtistDirectory.query.get_or_404(artist_id)
    if request.method == "POST":
        artist.name = request.form.get("name", "").strip() or None
        artist.artist_type = ArtistType(request.form.get("artist_type", "DJ"))
        artist.tier_label = request.form.get("tier_label", "").strip()
        artist.fee_min = float(request.form.get("fee_min", 0))
        artist.fee_max = float(request.form.get("fee_max", 0))
        artist.is_named = bool(request.form.get("is_named"))
        artist.notes = request.form.get("notes", "").strip() or None
        db.session.commit()
        flash("Artist updated.", "success")
        return redirect(url_for("admin.artists"))
    return render_template("admin/edit_artist.html", artist=artist,
                           artist_types=[at.value for at in ArtistType])


@admin_bp.route("/artists/<int:artist_id>/delete", methods=["POST"])
@admin_required
def delete_artist(artist_id):
    artist = ArtistDirectory.query.get_or_404(artist_id)
    db.session.delete(artist)
    db.session.commit()
    flash("Artist deleted.", "success")
    return redirect(url_for("admin.artists"))


# ── City Factors ───────────────────────────────────────────

@admin_bp.route("/city-factors")
@admin_required
def city_factors():
    factors = CityFactor.query.order_by(CityFactor.city, CityFactor.cost_head).all()
    return render_template("admin/city_factors.html", factors=factors)


@admin_bp.route("/city-factors/<int:factor_id>/edit", methods=["GET", "POST"])
@admin_required
def edit_city_factor(factor_id):
    factor = CityFactor.query.get_or_404(factor_id)
    if request.method == "POST":
        factor.factor = float(request.form.get("factor", 1.0))
        db.session.commit()
        flash("City factor updated.", "success")
        return redirect(url_for("admin.city_factors"))
    return render_template("admin/edit_city_factor.html", factor=factor)
