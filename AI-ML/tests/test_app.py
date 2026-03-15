"""Tests for WeddingBudget.ai core functionality."""

import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import (
    db as _db, BudgetSession, WeddingFunction, CityRateCard, FnBRateCard,
    ArtistDirectory, HotelTier, FunctionType, DecorStyle, DecorComplexity,
    MealType, BarType, ArtistType, SessionStatus
)
from lib.format import format_inr, format_inr_short
from services.rate_card_service import RateCardService
from services.budget_engine import BudgetEngine


@pytest.fixture
def app():
    app = create_app(testing=True)
    with app.app_context():
        yield app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(app):
    with app.app_context():
        yield _db


# ──────────────── formatINR tests ──────────────────────────

class TestFormatINR:
    def test_zero(self):
        assert format_inr(0) == "₹0"

    def test_hundreds(self):
        assert format_inr(500) == "₹500"

    def test_thousands(self):
        assert format_inr(5000) == "₹5,000"

    def test_lakhs(self):
        assert format_inr(150000) == "₹1,50,000"

    def test_crores(self):
        assert format_inr(12500000) == "₹1,25,00,000"

    def test_ten_crores(self):
        assert format_inr(100000000) == "₹10,00,00,000"

    def test_negative(self):
        assert format_inr(-500000) == "-₹5,00,000"

    def test_none(self):
        assert format_inr(None) == "N/A"

    def test_float_rounds(self):
        assert format_inr(1234.7) == "₹1,235"

    def test_short_lakh(self):
        assert format_inr_short(150000) == "₹1.5L"

    def test_short_crore(self):
        assert format_inr_short(25000000) == "₹2.5Cr"

    def test_short_small(self):
        assert format_inr_short(5000) == "₹5,000"


# ──────────────── Seed data tests ──────────────────────────

class TestSeedData:
    def test_city_rate_cards_seeded(self, db):
        cards = CityRateCard.query.all()
        assert len(cards) >= 15  # 3 cities × 5 tiers + Other

    def test_udaipur_palace_rate(self, db):
        card = CityRateCard.query.filter_by(
            city="Udaipur", hotel_tier=HotelTier.FIVE_STAR_PALACE
        ).first()
        assert card is not None
        assert card.room_rate_min == 25000
        assert card.room_rate_max == 60000

    def test_fnb_rate_cards_seeded(self, db):
        cards = FnBRateCard.query.all()
        assert len(cards) == 12  # 4 meal types × 3 bar types

    def test_artists_seeded(self, db):
        artists = ArtistDirectory.query.all()
        assert len(artists) >= 10  # 7 generic + at least 3 named

    def test_named_artist_exists(self, db):
        a = ArtistDirectory.query.filter_by(name="Arijit Singh").first()
        assert a is not None
        assert a.is_named is True
        assert a.fee_min >= 10000000


# ──────────────── RateCardService tests ────────────────────

class TestRateCardService:
    def test_get_venue_rates(self, db):
        rates = RateCardService.get_venue_rates("Mumbai", HotelTier.FIVE_STAR_CITY)
        assert rates is not None
        assert rates["room_rate_min"] > 0
        assert rates["room_rate_max"] > rates["room_rate_min"]

    def test_get_venue_rates_fallback(self, db):
        rates = RateCardService.get_venue_rates("UnknownCity", HotelTier.FOUR_STAR)
        assert rates is not None  # Falls back to "Other"

    def test_get_fnb_rates(self, db):
        rates = RateCardService.get_fnb_rates(MealType.GALA_DINNER, BarType.FULL_OPEN)
        assert rates is not None
        assert rates["per_head_min"] == 3000
        assert rates["per_head_max"] == 6000

    def test_get_artist_rates_generic(self, db):
        rates = RateCardService.get_artist_rates(ArtistType.DJ)
        assert rates is not None
        assert rates["fee_min"] > 0

    def test_get_city_factor(self, db):
        factor = RateCardService.get_city_factor("Udaipur", "decor")
        assert factor == 1.2

    def test_get_city_factor_default(self, db):
        factor = RateCardService.get_city_factor("UnknownCity", "venue")
        assert factor == 1.0  # Default when not found

    def test_decor_fallback(self, db):
        low, high = RateCardService.get_decor_fallback(
            FunctionType.RECEPTION, DecorComplexity.ELABORATE
        )
        assert low > 0
        assert high > low

    def test_calculate_transfer_fleet(self):
        assert RateCardService.calculate_transfer_fleet(10, 3) == 4
        assert RateCardService.calculate_transfer_fleet(0) == 0
        assert RateCardService.calculate_transfer_fleet(3, 3) == 1


# ──────────────── Budget Engine tests ──────────────────────

class TestBudgetEngine:
    def _create_session(self, db):
        sess = BudgetSession(
            session_code="test123456",
            city="Jaipur",
            hotel_tier=HotelTier.FIVE_STAR_CITY,
            rooms_count=30,
            nights_count=3,
            total_guests=200,
            outstation_pct=60,
            num_functions=2,
            room_basket_tier="standard",
            gift_hamper_tier="standard",
            invite_quantity=200,
            photo_video_tier="premium",
        )
        db.session.add(sess)
        db.session.flush()

        f1 = WeddingFunction(
            session_id=sess.id,
            function_name=FunctionType.SANGEET,
            decor_style=DecorStyle.ROYAL,
            decor_complexity=DecorComplexity.ELABORATE,
            meal_type=MealType.GALA_DINNER,
            bar_type=BarType.FULL_OPEN,
            specialty_counters=["Chaat Counter"],
            artist_types=["DJ", "LIVE_BAND"],
        )
        f2 = WeddingFunction(
            session_id=sess.id,
            function_name=FunctionType.RECEPTION,
            decor_style=DecorStyle.FLORAL,
            decor_complexity=DecorComplexity.ELABORATE,
            meal_type=MealType.GALA_DINNER,
            bar_type=BarType.FULL_OPEN,
            specialty_counters=[],
            artist_types=["DJ"],
        )
        db.session.add_all([f1, f2])
        db.session.commit()
        return sess

    def test_full_budget_computation(self, db):
        sess = self._create_session(db)
        engine = BudgetEngine(sess)
        summary = engine.compute_all()

        assert summary is not None
        assert summary.total_low > 0
        assert summary.total_mid > 0
        assert summary.total_high > summary.total_low
        assert summary.overall_confidence_score > 0

    def test_venue_cost_computed(self, db):
        sess = self._create_session(db)
        engine = BudgetEngine(sess)
        engine.compute_all()

        assert sess.venue_cost is not None
        assert sess.venue_cost.total_low > 0

    def test_fnb_cost_computed(self, db):
        sess = self._create_session(db)
        engine = BudgetEngine(sess)
        engine.compute_all()

        for func in sess.functions:
            assert func.fnb_cost is not None
            assert func.fnb_cost.total_low > 0

    def test_decor_cost_computed(self, db):
        sess = self._create_session(db)
        engine = BudgetEngine(sess)
        engine.compute_all()

        for func in sess.functions:
            assert func.decor_cost is not None
            assert func.decor_cost.ai_predicted_low > 0

    def test_logistics_cost_computed(self, db):
        sess = self._create_session(db)
        engine = BudgetEngine(sess)
        engine.compute_all()

        assert sess.logistics_cost is not None
        assert sess.logistics_cost.transfer_fleet_count > 0


# ──────────────── Route tests ──────────────────────────────

class TestRoutes:
    def test_index(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert b"WeddingBudget" in resp.data

    def test_wizard_start_get(self, client):
        resp = client.get("/wizard/start")
        assert resp.status_code == 200
        assert b"Wedding Basics" in resp.data or b"basics" in resp.data.lower()

    def test_login_page(self, client):
        resp = client.get("/auth/login")
        assert resp.status_code == 200
        assert b"Login" in resp.data or b"login" in resp.data.lower()

    def test_register_page(self, client):
        resp = client.get("/auth/register")
        assert resp.status_code == 200

    def test_admin_requires_auth(self, client):
        resp = client.get("/admin/", follow_redirects=True)
        assert b"Admin access required" in resp.data or b"login" in resp.data.lower()

    def test_shared_estimate_404(self, client):
        resp = client.get("/estimate/nonexistent")
        assert resp.status_code == 404

    def test_admin_login_and_dashboard(self, client):
        # Login as admin
        resp = client.post("/auth/login", data={
            "email": "admin@weddingbudget.ai",
            "password": "admin123",
        }, follow_redirects=True)
        assert resp.status_code == 200

        # Access admin dashboard
        resp = client.get("/admin/")
        assert resp.status_code == 200
        assert b"Admin Dashboard" in resp.data

    def test_admin_city_rates(self, client):
        client.post("/auth/login", data={
            "email": "admin@weddingbudget.ai",
            "password": "admin123",
        })
        resp = client.get("/admin/city-rates")
        assert resp.status_code == 200
        assert b"Udaipur" in resp.data

    def test_wizard_full_flow(self, client):
        # Step 1: Create session
        resp = client.post("/wizard/start", data={
            "couple_name_1": "Priya",
            "couple_name_2": "Rahul",
            "city": "Jaipur",
            "wedding_start_date": "2025-02-15",
            "wedding_end_date": "2025-02-18",
            "num_functions": "2",
            "function_name_0": "SANGEET",
            "function_guests_0": "",
            "function_name_1": "RECEPTION",
            "function_guests_1": "300",
        }, follow_redirects=False)
        assert resp.status_code == 302
        # Extract session_id from redirect URL
        location = resp.headers["Location"]
        session_id = location.split("/")[-2]

        # Step 2
        resp = client.post(f"/wizard/{session_id}/step2", data={
            "hotel_tier": "4-Star",
            "rooms_count": "30",
            "nights_count": "3",
            "total_guests": "200",
            "outstation_pct": "60",
            "bride_hometown": "Delhi",
            "groom_hometown": "Mumbai",
        }, follow_redirects=False)
        assert resp.status_code == 302

        # Step 3
        resp = client.get(f"/wizard/{session_id}/step3")
        assert resp.status_code == 200

        resp = client.post(f"/wizard/{session_id}/step3", data={},
                           follow_redirects=False)
        assert resp.status_code == 302

        # Step 4
        resp = client.post(f"/wizard/{session_id}/step4", data={},
                           follow_redirects=False)
        assert resp.status_code == 302

        # Step 5
        resp = client.post(f"/wizard/{session_id}/step5", data={
            "photo_video_tier": "premium",
        }, follow_redirects=False)
        assert resp.status_code == 302

        # Step 6 — generates budget
        resp = client.post(f"/wizard/{session_id}/step6", data={
            "room_basket_tier": "standard",
            "gift_hamper_tier": "standard",
            "invite_quantity": "200",
        }, follow_redirects=True)
        assert resp.status_code == 200
        assert b"Budget Estimate" in resp.data or b"budget" in resp.data.lower()
