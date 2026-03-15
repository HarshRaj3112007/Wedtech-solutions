"""
SQLAlchemy models for WeddingBudget.ai

All tables from the Prisma schema, translated to SQLAlchemy ORM.
Covers: planners, budget sessions, cost estimates (6 heads),
admin-managed rate cards, decor image library, and budget summaries.
"""

import enum
from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


# ──────────────────────────── ENUMS ────────────────────────────

class HotelTier(enum.Enum):
    FIVE_STAR_PALACE = "5-Star Palace"
    FIVE_STAR_CITY = "5-Star City"
    FOUR_STAR = "4-Star"
    RESORT = "Resort"
    FARMHOUSE = "Farmhouse"


class SessionStatus(enum.Enum):
    DRAFT = "DRAFT"
    SHARED = "SHARED"
    ARCHIVED = "ARCHIVED"


class FunctionType(enum.Enum):
    MEHENDI = "MEHENDI"
    HALDI = "HALDI"
    SANGEET = "SANGEET"
    BARAAT = "BARAAT"
    PHERAS = "PHERAS"
    RECEPTION = "RECEPTION"
    COCKTAIL = "COCKTAIL"
    OTHER = "OTHER"


class DecorStyle(enum.Enum):
    FLORAL = "FLORAL"
    RUSTIC = "RUSTIC"
    ROYAL = "ROYAL"
    MINIMAL = "MINIMAL"
    CONTEMPORARY = "CONTEMPORARY"
    BOHO = "BOHO"


class DecorComplexity(enum.Enum):
    SIMPLE = "SIMPLE"
    MEDIUM = "MEDIUM"
    ELABORATE = "ELABORATE"
    ULTRA = "ULTRA"


class MealType(enum.Enum):
    WELCOME_DINNER = "WELCOME_DINNER"
    LUNCH_BUFFET = "LUNCH_BUFFET"
    GALA_DINNER = "GALA_DINNER"
    COCKTAILS = "COCKTAILS"


class BarType(enum.Enum):
    DRY = "DRY"
    BEER_WINE = "BEER_WINE"
    FULL_OPEN = "FULL_OPEN"


class ArtistType(enum.Enum):
    DJ = "DJ"
    LIVE_BAND = "LIVE_BAND"
    FOLK = "FOLK"
    BOLLYWOOD_ACT = "BOLLYWOOD_ACT"
    ANCHOR = "ANCHOR"
    DANCE_TROUPE = "DANCE_TROUPE"


class LogisticsItemType(enum.Enum):
    INNOVA = "INNOVA"
    GHODI = "GHODI"
    DHOLI = "DHOLI"
    SFX_PYRO = "SFX_PYRO"
    SFX_CONFETTI = "SFX_CONFETTI"
    DRONE = "DRONE"
    SMOKE = "SMOKE"


class SundriesItemType(enum.Enum):
    ROOM_BASKET = "ROOM_BASKET"
    GIFT_HAMPER = "GIFT_HAMPER"
    STATIONERY = "STATIONERY"
    PHOTO_VIDEO = "PHOTO_VIDEO"
    RITUAL_HALDI = "RITUAL_HALDI"
    RITUAL_MEHENDI = "RITUAL_MEHENDI"
    RITUAL_PHERAS = "RITUAL_PHERAS"


class PlanTier(enum.Enum):
    FREE = "FREE"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"


# ──────────────────── USER / PLANNER ───────────────────────

class Planner(db.Model):
    __tablename__ = "planners"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(300), unique=True, nullable=False)
    password_hash = db.Column(db.String(300), nullable=False)
    org_name = db.Column(db.String(300), nullable=True)
    plan_tier = db.Column(db.Enum(PlanTier), default=PlanTier.FREE)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    sessions = db.relationship("BudgetSession", backref="planner", lazy=True)


# ──────────────────── BUDGET SESSION ───────────────────────

class BudgetSession(db.Model):
    __tablename__ = "budget_sessions"

    id = db.Column(db.Integer, primary_key=True)
    planner_id = db.Column(db.Integer, db.ForeignKey("planners.id"), nullable=True)
    session_code = db.Column(db.String(12), unique=True, nullable=False)

    # Wedding basics
    couple_name_1 = db.Column(db.String(200), nullable=True)
    couple_name_2 = db.Column(db.String(200), nullable=True)
    city = db.Column(db.String(100), nullable=False)
    wedding_start_date = db.Column(db.Date, nullable=True)
    wedding_end_date = db.Column(db.Date, nullable=True)

    # Accommodation
    hotel_tier = db.Column(db.Enum(HotelTier), nullable=True)
    rooms_count = db.Column(db.Integer, default=0)
    nights_count = db.Column(db.Integer, default=1)
    total_guests = db.Column(db.Integer, default=100)
    outstation_pct = db.Column(db.Integer, default=50)
    bride_hometown = db.Column(db.String(100), nullable=True)
    groom_hometown = db.Column(db.String(100), nullable=True)

    # Sundries
    room_basket_tier = db.Column(db.String(50), default="standard")
    gift_hamper_tier = db.Column(db.String(50), default="none")
    invite_quantity = db.Column(db.Integer, default=0)
    photo_video_tier = db.Column(db.String(50), default="none")

    num_functions = db.Column(db.Integer, default=1)
    status = db.Column(db.Enum(SessionStatus), default=SessionStatus.DRAFT)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    functions = db.relationship("WeddingFunction", backref="session",
                                lazy=True, cascade="all, delete-orphan")
    venue_cost = db.relationship("VenueCostEstimate", backref="session",
                                 uselist=False, cascade="all, delete-orphan")
    logistics_cost = db.relationship("LogisticsCostEstimate", backref="session",
                                     uselist=False, cascade="all, delete-orphan")
    sundries_cost = db.relationship("SundriesCostEstimate", backref="session",
                                    uselist=False, cascade="all, delete-orphan")
    budget_summary = db.relationship("BudgetSummary", backref="session",
                                     uselist=False, cascade="all, delete-orphan")
    artist_bookings = db.relationship("ArtistBooking", backref="session",
                                      lazy=True, cascade="all, delete-orphan")


class WeddingFunction(db.Model):
    __tablename__ = "wedding_functions"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("budget_sessions.id"), nullable=False)
    function_name = db.Column(db.Enum(FunctionType), nullable=False)
    function_date = db.Column(db.Date, nullable=True)
    guest_count_override = db.Column(db.Integer, nullable=True)
    decor_style = db.Column(db.Enum(DecorStyle), default=DecorStyle.FLORAL)
    decor_complexity = db.Column(db.Enum(DecorComplexity), default=DecorComplexity.MEDIUM)

    # F&B
    meal_type = db.Column(db.Enum(MealType), default=MealType.GALA_DINNER)
    bar_type = db.Column(db.Enum(BarType), default=BarType.DRY)
    specialty_counters = db.Column(db.JSON, default=list)

    # Entertainment
    artist_types = db.Column(db.JSON, default=list)

    fnb_cost = db.relationship("FnBCostEstimate", backref="function",
                               uselist=False, cascade="all, delete-orphan")
    decor_cost = db.relationship("DecorCostEstimate", backref="function",
                                 uselist=False, cascade="all, delete-orphan")


# ──────────────────── COST ESTIMATES ───────────────────────

class VenueCostEstimate(db.Model):
    __tablename__ = "venue_cost_estimates"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("budget_sessions.id"), nullable=False)
    room_rate_low = db.Column(db.Float, default=0)
    room_rate_mid = db.Column(db.Float, default=0)
    room_rate_high = db.Column(db.Float, default=0)
    banquet_rate_low = db.Column(db.Float, default=0)
    banquet_rate_mid = db.Column(db.Float, default=0)
    banquet_rate_high = db.Column(db.Float, default=0)
    total_low = db.Column(db.Float, default=0)
    total_mid = db.Column(db.Float, default=0)
    total_high = db.Column(db.Float, default=0)
    assumptions_json = db.Column(db.JSON, default=dict)


class FnBCostEstimate(db.Model):
    __tablename__ = "fnb_cost_estimates"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("budget_sessions.id"), nullable=False)
    function_id = db.Column(db.Integer, db.ForeignKey("wedding_functions.id"), nullable=False)
    meal_type = db.Column(db.Enum(MealType), nullable=True)
    bar_type = db.Column(db.Enum(BarType), nullable=True)
    per_head_low = db.Column(db.Float, default=0)
    per_head_high = db.Column(db.Float, default=0)
    specialty_counters = db.Column(db.JSON, default=list)
    staffing_cost = db.Column(db.Float, default=0)
    crockery_cost = db.Column(db.Float, default=0)
    total_low = db.Column(db.Float, default=0)
    total_mid = db.Column(db.Float, default=0)
    total_high = db.Column(db.Float, default=0)


class DecorCostEstimate(db.Model):
    __tablename__ = "decor_cost_estimates"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("budget_sessions.id"), nullable=False)
    function_id = db.Column(db.Integer, db.ForeignKey("wedding_functions.id"), nullable=False)
    ai_predicted_low = db.Column(db.Float, default=0)
    ai_predicted_mid = db.Column(db.Float, default=0)
    ai_predicted_high = db.Column(db.Float, default=0)
    confidence_score = db.Column(db.Float, default=0.5)
    model_version = db.Column(db.String(50), nullable=True)
    computed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class ArtistBooking(db.Model):
    __tablename__ = "artist_bookings"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("budget_sessions.id"), nullable=False)
    artist_type = db.Column(db.Enum(ArtistType), nullable=False)
    named_artist_id = db.Column(db.Integer, db.ForeignKey("artist_directory.id"), nullable=True)
    tier_label = db.Column(db.String(100), nullable=True)
    cost_low = db.Column(db.Float, default=0)
    cost_high = db.Column(db.Float, default=0)
    notes = db.Column(db.Text, nullable=True)


class LogisticsCostEstimate(db.Model):
    __tablename__ = "logistics_cost_estimates"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("budget_sessions.id"), nullable=False)
    transfer_fleet_count = db.Column(db.Integer, default=0)
    transfer_cost_low = db.Column(db.Float, default=0)
    transfer_cost_high = db.Column(db.Float, default=0)
    ghodi_count = db.Column(db.Integer, default=0)
    ghodi_cost = db.Column(db.Float, default=0)
    dholi_count = db.Column(db.Integer, default=0)
    dholi_cost = db.Column(db.Float, default=0)
    sfx_items = db.Column(db.JSON, default=list)
    sfx_cost = db.Column(db.Float, default=0)
    total_low = db.Column(db.Float, default=0)
    total_high = db.Column(db.Float, default=0)


class SundriesCostEstimate(db.Model):
    __tablename__ = "sundries_cost_estimates"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("budget_sessions.id"), nullable=False)
    room_basket_cost = db.Column(db.Float, default=0)
    ritual_costs = db.Column(db.JSON, default=dict)
    gift_hamper_cost = db.Column(db.Float, default=0)
    stationery_cost = db.Column(db.Float, default=0)
    photo_video_cost = db.Column(db.Float, default=0)
    contingency_pct = db.Column(db.Float, default=10.0)
    contingency_amount = db.Column(db.Float, default=0)
    total_low = db.Column(db.Float, default=0)
    total_high = db.Column(db.Float, default=0)


class BudgetSummary(db.Model):
    __tablename__ = "budget_summaries"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("budget_sessions.id"), nullable=False)
    total_low = db.Column(db.Float, default=0)
    total_mid = db.Column(db.Float, default=0)
    total_high = db.Column(db.Float, default=0)
    overall_confidence_score = db.Column(db.Float, default=0.5)
    generated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    pdf_url = db.Column(db.String(500), nullable=True)


# ──────────────── ADMIN-MANAGED REFERENCE DATA ─────────────

class CityRateCard(db.Model):
    __tablename__ = "city_rate_cards"

    id = db.Column(db.Integer, primary_key=True)
    city = db.Column(db.String(100), nullable=False)
    hotel_tier = db.Column(db.Enum(HotelTier), nullable=False)
    room_rate_min = db.Column(db.Float, nullable=False)
    room_rate_max = db.Column(db.Float, nullable=False)
    banquet_rate_per_day_min = db.Column(db.Float, nullable=False)
    banquet_rate_per_day_max = db.Column(db.Float, nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint("city", "hotel_tier", name="uq_city_hotel_tier"),
    )


class FnBRateCard(db.Model):
    __tablename__ = "fnb_rate_cards"

    id = db.Column(db.Integer, primary_key=True)
    meal_type = db.Column(db.Enum(MealType), nullable=False)
    bar_type = db.Column(db.Enum(BarType), nullable=False)
    per_head_min = db.Column(db.Float, nullable=False)
    per_head_max = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint("meal_type", "bar_type", name="uq_meal_bar"),
    )


class ArtistDirectory(db.Model):
    __tablename__ = "artist_directory"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=True)
    artist_type = db.Column(db.Enum(ArtistType), nullable=False)
    tier_label = db.Column(db.String(100), nullable=False)
    fee_min = db.Column(db.Float, nullable=False)
    fee_max = db.Column(db.Float, nullable=False)
    is_named = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))


class LogisticsRateCard(db.Model):
    __tablename__ = "logistics_rate_cards"

    id = db.Column(db.Integer, primary_key=True)
    item_type = db.Column(db.Enum(LogisticsItemType), nullable=False)
    city = db.Column(db.String(100), nullable=True)
    rate_min = db.Column(db.Float, nullable=False)
    rate_max = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))


class SundriesRateCard(db.Model):
    __tablename__ = "sundries_rate_cards"

    id = db.Column(db.Integer, primary_key=True)
    item_type = db.Column(db.Enum(SundriesItemType), nullable=False)
    hotel_tier = db.Column(db.Enum(HotelTier), nullable=True)
    rate_min = db.Column(db.Float, nullable=False)
    rate_max = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))


# ────────────────── CITY INTELLIGENCE ──────────────────────

class CityFactor(db.Model):
    """Per-city markup/markdown factor for each cost head."""
    __tablename__ = "city_factors"

    id = db.Column(db.Integer, primary_key=True)
    city = db.Column(db.String(100), nullable=False)
    cost_head = db.Column(db.String(50), nullable=False)  # venue/fnb/decor/artist/logistics/sundries
    factor = db.Column(db.Float, default=1.0)  # 1.0 = no adjustment, 1.2 = +20%
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint("city", "cost_head", name="uq_city_cost_head"),
    )


# ────────────────── DECOR IMAGE LIBRARY ────────────────────

class DecorImage(db.Model):
    __tablename__ = "decor_images"

    id = db.Column(db.Integer, primary_key=True)
    source_url = db.Column(db.String(1000), nullable=True)
    cloudinary_id = db.Column(db.String(500), nullable=True)
    thumbnail_url = db.Column(db.String(1000), nullable=True)
    function_type = db.Column(db.Enum(FunctionType), nullable=True)
    style = db.Column(db.Enum(DecorStyle), nullable=True)
    complexity_tier = db.Column(db.Enum(DecorComplexity), nullable=True)
    admin_cost_seed_low = db.Column(db.Float, nullable=True)
    admin_cost_seed_high = db.Column(db.Float, nullable=True)
    scrape_source = db.Column(db.String(200), nullable=True)
    scraped_at = db.Column(db.DateTime, nullable=True)
    admin_approved = db.Column(db.Boolean, default=False)
    admin_labelled = db.Column(db.Boolean, default=False)
