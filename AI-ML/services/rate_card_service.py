"""
RateCardService — single point of access for all rate card lookups.

All cost computations must go through this service — never query rate
tables directly from route handlers.
"""

import math
from models import (
    db, CityRateCard, FnBRateCard, ArtistDirectory, LogisticsRateCard,
    SundriesRateCard, CityFactor, HotelTier, MealType, BarType,
    ArtistType, LogisticsItemType, SundriesItemType, FunctionType,
    DecorComplexity
)


class RateCardService:
    """Centralised rate-card lookup layer used by the budget engine."""

    # ── Venue ──────────────────────────────────────────────

    @staticmethod
    def get_venue_rates(city: str, hotel_tier: HotelTier):
        """Return (room_rate_min, room_rate_max, banquet_min, banquet_max) for a city+tier."""
        card = CityRateCard.query.filter_by(city=city, hotel_tier=hotel_tier).first()
        if not card:
            # Fallback to "Other" city
            card = CityRateCard.query.filter_by(city="Other", hotel_tier=hotel_tier).first()
        if not card:
            return None
        return {
            "room_rate_min": card.room_rate_min,
            "room_rate_max": card.room_rate_max,
            "banquet_min": card.banquet_rate_per_day_min,
            "banquet_max": card.banquet_rate_per_day_max,
        }

    # ── F&B ────────────────────────────────────────────────

    @staticmethod
    def get_fnb_rates(meal_type: MealType, bar_type: BarType):
        """Return per-head min/max for a meal+bar combination."""
        card = FnBRateCard.query.filter_by(
            meal_type=meal_type, bar_type=bar_type, is_active=True
        ).first()
        if not card:
            return None
        return {"per_head_min": card.per_head_min, "per_head_max": card.per_head_max}

    # ── Artists ────────────────────────────────────────────

    @staticmethod
    def get_artist_rates(artist_type: ArtistType, named_id=None):
        """Return fee range for an artist type or specific named artist."""
        if named_id:
            artist = ArtistDirectory.query.get(named_id)
            if artist:
                return {
                    "name": artist.name,
                    "tier_label": artist.tier_label,
                    "fee_min": artist.fee_min,
                    "fee_max": artist.fee_max,
                }
        # Generic tier: pick the first matching non-named entry
        artist = ArtistDirectory.query.filter_by(
            artist_type=artist_type, is_named=False
        ).first()
        if not artist:
            return None
        return {
            "name": None,
            "tier_label": artist.tier_label,
            "fee_min": artist.fee_min,
            "fee_max": artist.fee_max,
        }

    @staticmethod
    def get_named_artists(artist_type: ArtistType = None):
        """Return all named artists, optionally filtered by type."""
        q = ArtistDirectory.query.filter_by(is_named=True)
        if artist_type:
            q = q.filter_by(artist_type=artist_type)
        return q.all()

    # ── Logistics ──────────────────────────────────────────

    @staticmethod
    def get_logistics_rate(item_type: LogisticsItemType, city: str = None):
        """Return rate for a logistics item, city-specific or national fallback."""
        card = LogisticsRateCard.query.filter_by(item_type=item_type, city=city).first()
        if not card:
            card = LogisticsRateCard.query.filter_by(
                item_type=item_type, city=None
            ).first()
        if not card:
            return None
        return {"rate_min": card.rate_min, "rate_max": card.rate_max, "unit": card.unit}

    # ── Sundries ───────────────────────────────────────────

    @staticmethod
    def get_sundries_rate(item_type: SundriesItemType, hotel_tier: HotelTier = None):
        """Return rate for a sundries item, optionally by hotel tier."""
        card = SundriesRateCard.query.filter_by(
            item_type=item_type, hotel_tier=hotel_tier
        ).first()
        if not card:
            card = SundriesRateCard.query.filter_by(
                item_type=item_type, hotel_tier=None
            ).first()
        if not card:
            return None
        return {"rate_min": card.rate_min, "rate_max": card.rate_max, "unit": card.unit}

    # ── City Factor ────────────────────────────────────────

    @staticmethod
    def get_city_factor(city: str, cost_head: str) -> float:
        """Return the city adjustment factor (1.0 = no adjustment)."""
        cf = CityFactor.query.filter_by(city=city, cost_head=cost_head).first()
        return cf.factor if cf else 1.0

    # ── Decor (rule-based fallback) ────────────────────────

    @staticmethod
    def get_decor_fallback(function_type: FunctionType, complexity: DecorComplexity):
        """Rule-based decor cost estimate when ML model is unavailable.

        Uses a lookup table derived from domain knowledge of Indian wedding
        decor costs (2024-25 rates). Returns (cost_low, cost_high).
        """
        # Base costs by function type (in ₹)
        base_costs = {
            FunctionType.MEHENDI:    (200000, 500000),
            FunctionType.HALDI:     (100000, 300000),
            FunctionType.SANGEET:   (500000, 1500000),
            FunctionType.BARAAT:    (200000, 600000),
            FunctionType.PHERAS:    (400000, 1200000),
            FunctionType.RECEPTION: (800000, 3000000),
            FunctionType.COCKTAIL:  (300000, 800000),
            FunctionType.OTHER:     (200000, 500000),
        }

        # Complexity multipliers
        complexity_mult = {
            DecorComplexity.SIMPLE:    0.6,
            DecorComplexity.MEDIUM:    1.0,
            DecorComplexity.ELABORATE: 1.8,
            DecorComplexity.ULTRA:     3.0,
        }

        base_low, base_high = base_costs.get(
            function_type, (200000, 500000)
        )
        mult = complexity_mult.get(complexity, 1.0)

        return (base_low * mult, base_high * mult)

    # ── Transfer fleet calculation ─────────────────────────

    @staticmethod
    def calculate_transfer_fleet(outstation_guests: int,
                                 guests_per_vehicle: int = 3) -> int:
        """Calculate number of vehicles needed for outstation guest transfers."""
        if outstation_guests <= 0:
            return 0
        return math.ceil(outstation_guests / guests_per_vehicle)
