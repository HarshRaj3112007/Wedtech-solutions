"""
Seed database with realistic 2024-25 Indian wedding market data.

Populates rate cards for 3 cities: Udaipur, Jaipur, Mumbai
plus national/generic rates for logistics and sundries.
"""

from models import (
    db, CityRateCard, FnBRateCard, ArtistDirectory, LogisticsRateCard,
    SundriesRateCard, CityFactor, Planner, HotelTier, MealType, BarType,
    ArtistType, LogisticsItemType, SundriesItemType
)
from werkzeug.security import generate_password_hash


def seed_all():
    """Seed all reference data. Idempotent — skips if data already exists."""
    if CityRateCard.query.first():
        return  # Already seeded

    _seed_city_rate_cards()
    _seed_fnb_rate_cards()
    _seed_artist_directory()
    _seed_logistics_rate_cards()
    _seed_sundries_rate_cards()
    _seed_city_factors()
    _seed_admin_user()
    db.session.commit()


def _seed_city_rate_cards():
    """Venue & accommodation rates by city and hotel tier.

    All rates are per night (rooms) or per day (banquet) in INR.
    Source: approximate 2024-25 Indian destination wedding market rates.
    """
    data = [
        # Udaipur — premium palace destination
        ("Udaipur", HotelTier.FIVE_STAR_PALACE, 25000, 60000, 300000, 800000),
        ("Udaipur", HotelTier.FIVE_STAR_CITY,   15000, 35000, 200000, 500000),
        ("Udaipur", HotelTier.FOUR_STAR,          8000, 18000, 100000, 250000),
        ("Udaipur", HotelTier.RESORT,            10000, 25000, 150000, 400000),
        ("Udaipur", HotelTier.FARMHOUSE,          5000, 12000,  80000, 200000),

        # Jaipur — heritage city, slightly cheaper than Udaipur
        ("Jaipur", HotelTier.FIVE_STAR_PALACE, 20000, 50000, 250000, 600000),
        ("Jaipur", HotelTier.FIVE_STAR_CITY,   12000, 28000, 150000, 400000),
        ("Jaipur", HotelTier.FOUR_STAR,          6000, 15000,  80000, 200000),
        ("Jaipur", HotelTier.RESORT,             8000, 20000, 120000, 300000),
        ("Jaipur", HotelTier.FARMHOUSE,          4000, 10000,  60000, 150000),

        # Mumbai — metro city, high real estate costs
        ("Mumbai", HotelTier.FIVE_STAR_PALACE, 22000, 55000, 350000, 900000),
        ("Mumbai", HotelTier.FIVE_STAR_CITY,   14000, 32000, 250000, 600000),
        ("Mumbai", HotelTier.FOUR_STAR,          7000, 16000, 120000, 300000),
        ("Mumbai", HotelTier.RESORT,             9000, 22000, 150000, 350000),
        ("Mumbai", HotelTier.FARMHOUSE,          5000, 12000,  80000, 200000),

        # Generic "Other" fallback
        ("Other", HotelTier.FIVE_STAR_PALACE, 18000, 45000, 200000, 500000),
        ("Other", HotelTier.FIVE_STAR_CITY,   10000, 25000, 120000, 350000),
        ("Other", HotelTier.FOUR_STAR,          5000, 12000,  60000, 180000),
        ("Other", HotelTier.RESORT,             7000, 18000, 100000, 250000),
        ("Other", HotelTier.FARMHOUSE,          3000,  8000,  40000, 120000),
    ]

    for city, tier, room_min, room_max, banquet_min, banquet_max in data:
        db.session.add(CityRateCard(
            city=city, hotel_tier=tier,
            room_rate_min=room_min, room_rate_max=room_max,
            banquet_rate_per_day_min=banquet_min,
            banquet_rate_per_day_max=banquet_max,
        ))


def _seed_fnb_rate_cards():
    """F&B per-head rates by meal type and bar type (INR per head)."""
    data = [
        # (meal_type, bar_type, per_head_min, per_head_max)
        (MealType.WELCOME_DINNER, BarType.DRY,        1200, 2500),
        (MealType.WELCOME_DINNER, BarType.BEER_WINE,  1800, 3500),
        (MealType.WELCOME_DINNER, BarType.FULL_OPEN,  2500, 5000),

        (MealType.LUNCH_BUFFET, BarType.DRY,          800,  1800),
        (MealType.LUNCH_BUFFET, BarType.BEER_WINE,    1200, 2500),
        (MealType.LUNCH_BUFFET, BarType.FULL_OPEN,    1800, 3500),

        (MealType.GALA_DINNER, BarType.DRY,           1500, 3000),
        (MealType.GALA_DINNER, BarType.BEER_WINE,     2200, 4500),
        (MealType.GALA_DINNER, BarType.FULL_OPEN,     3000, 6000),

        (MealType.COCKTAILS, BarType.DRY,              600, 1200),
        (MealType.COCKTAILS, BarType.BEER_WINE,       1000, 2000),
        (MealType.COCKTAILS, BarType.FULL_OPEN,       1500, 3000),
    ]

    for meal, bar, ph_min, ph_max in data:
        db.session.add(FnBRateCard(
            meal_type=meal, bar_type=bar,
            per_head_min=ph_min, per_head_max=ph_max,
        ))


def _seed_artist_directory():
    """Artist directory: named artists and generic tiers."""
    # Generic tiers
    generic = [
        (ArtistType.DJ,            "Local DJ",         50000,   150000),
        (ArtistType.DJ,            "City DJ",          200000,  500000),
        (ArtistType.LIVE_BAND,     "City Band",        200000,  500000),
        (ArtistType.FOLK,          "Folk Performers",  100000,  300000),
        (ArtistType.BOLLYWOOD_ACT, "Bollywood Choreographer", 300000, 800000),
        (ArtistType.ANCHOR,        "MC / Anchor",      50000,   200000),
        (ArtistType.DANCE_TROUPE,  "Dance Troupe",     500000, 1500000),
    ]
    for atype, tier, fee_min, fee_max in generic:
        db.session.add(ArtistDirectory(
            artist_type=atype, tier_label=tier,
            fee_min=fee_min, fee_max=fee_max, is_named=False,
        ))

    # Named artists (approximate 2024-25 market rates)
    named = [
        ("Arijit Singh",  ArtistType.BOLLYWOOD_ACT, "A-List Playback Singer", 15000000, 20000000),
        ("Badshah",        ArtistType.BOLLYWOOD_ACT, "A-List Rapper/Singer",    8000000, 12000000),
        ("Nucleya",        ArtistType.DJ,            "Celebrity DJ",            3000000,  5000000),
        ("Shankar Mahadevan", ArtistType.BOLLYWOOD_ACT, "Legendary Playback",   8000000, 12000000),
        ("Local Folk Group", ArtistType.FOLK,        "Rajasthani Folk Artists",  80000,   200000),
    ]
    for name, atype, tier, fee_min, fee_max in named:
        db.session.add(ArtistDirectory(
            name=name, artist_type=atype, tier_label=tier,
            fee_min=fee_min, fee_max=fee_max, is_named=True,
        ))


def _seed_logistics_rate_cards():
    """Logistics rates: vehicles, baraat items, SFX."""
    data = [
        # National rates (city=None)
        (LogisticsItemType.INNOVA, None,      3000,   5000, "per trip"),
        (LogisticsItemType.GHODI,  None,     25000,  80000, "per booking"),
        (LogisticsItemType.DHOLI,  None,      8000,  20000, "per dholi per session"),
        (LogisticsItemType.SFX_PYRO, None,   15000,  40000, "per setup"),
        (LogisticsItemType.SFX_CONFETTI, None, 5000, 15000, "per unit"),
        (LogisticsItemType.DRONE,  None,    300000, 1000000, "per show"),
        (LogisticsItemType.SMOKE,  None,      8000,  25000, "per unit"),

        # City-specific overrides
        (LogisticsItemType.INNOVA, "Udaipur", 3500,  6000, "per trip"),
        (LogisticsItemType.GHODI,  "Udaipur", 40000, 80000, "per booking"),
        (LogisticsItemType.INNOVA, "Mumbai",  4000,  7000, "per trip"),
        (LogisticsItemType.GHODI,  "Mumbai",  30000, 60000, "per booking"),
        (LogisticsItemType.INNOVA, "Jaipur",  3000,  5000, "per trip"),
        (LogisticsItemType.GHODI,  "Jaipur",  25000, 60000, "per booking"),
    ]

    for item_type, city, rate_min, rate_max, unit in data:
        db.session.add(LogisticsRateCard(
            item_type=item_type, city=city,
            rate_min=rate_min, rate_max=rate_max, unit=unit,
        ))


def _seed_sundries_rate_cards():
    """Sundries rates: room baskets, hampers, stationery, photo/video, rituals."""
    data = [
        # Room baskets (by hotel tier)
        (SundriesItemType.ROOM_BASKET, HotelTier.FIVE_STAR_PALACE, 2000, 3000, "per room"),
        (SundriesItemType.ROOM_BASKET, HotelTier.FIVE_STAR_CITY,   1500, 2500, "per room"),
        (SundriesItemType.ROOM_BASKET, HotelTier.FOUR_STAR,        1000, 1800, "per room"),
        (SundriesItemType.ROOM_BASKET, HotelTier.RESORT,           1200, 2200, "per room"),
        (SundriesItemType.ROOM_BASKET, HotelTier.FARMHOUSE,         800, 1500, "per room"),

        # Gift hampers (generic, tier selected in wizard)
        (SundriesItemType.GIFT_HAMPER, None, 500, 5000, "per guest"),

        # Stationery
        (SundriesItemType.STATIONERY, None, 150, 800, "per card"),

        # Photography & videography
        (SundriesItemType.PHOTO_VIDEO, None, 150000, 1500000, "per wedding"),

        # Ritual materials
        (SundriesItemType.RITUAL_HALDI,   None, 15000,  50000, "per event"),
        (SundriesItemType.RITUAL_MEHENDI,  None, 20000, 100000, "per event"),
        (SundriesItemType.RITUAL_PHERAS,   None, 15000,  40000, "per event"),
    ]

    for item_type, hotel_tier, rate_min, rate_max, unit in data:
        db.session.add(SundriesRateCard(
            item_type=item_type, hotel_tier=hotel_tier,
            rate_min=rate_min, rate_max=rate_max, unit=unit,
        ))


def _seed_city_factors():
    """Per-city adjustment factors for each cost head.

    1.0 = no adjustment, >1.0 = premium, <1.0 = discount.
    """
    factors = [
        # Udaipur: palace premium for decor, higher logistics
        ("Udaipur", "venue", 1.0),
        ("Udaipur", "fnb", 1.1),
        ("Udaipur", "decor", 1.2),
        ("Udaipur", "artist", 1.1),
        ("Udaipur", "logistics", 1.15),
        ("Udaipur", "sundries", 1.1),

        # Jaipur: moderate premium
        ("Jaipur", "venue", 1.0),
        ("Jaipur", "fnb", 1.0),
        ("Jaipur", "decor", 1.1),
        ("Jaipur", "artist", 1.0),
        ("Jaipur", "logistics", 1.0),
        ("Jaipur", "sundries", 1.0),

        # Mumbai: higher F&B and venue, lower decor
        ("Mumbai", "venue", 1.0),
        ("Mumbai", "fnb", 1.15),
        ("Mumbai", "decor", 1.0),
        ("Mumbai", "artist", 1.1),
        ("Mumbai", "logistics", 1.2),
        ("Mumbai", "sundries", 1.1),
    ]

    for city, head, factor in factors:
        db.session.add(CityFactor(city=city, cost_head=head, factor=factor))


def _seed_admin_user():
    """Create a default admin user for the admin panel."""
    if not Planner.query.filter_by(email="admin@weddingbudget.ai").first():
        db.session.add(Planner(
            name="Admin",
            email="admin@weddingbudget.ai",
            password_hash=generate_password_hash("admin123"),
            org_name="Events by Athea",
            is_admin=True,
        ))
