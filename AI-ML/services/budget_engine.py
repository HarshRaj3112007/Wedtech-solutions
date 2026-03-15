"""
BudgetEngine — rule-based budget calculation for all 6 cost heads.

Computes itemised low/mid/high estimates from session inputs + rate cards.
ML model predictions plug into the decor module when available.
"""

import math
from datetime import datetime, timezone

from models import (
    db, BudgetSession, WeddingFunction, VenueCostEstimate, FnBCostEstimate,
    DecorCostEstimate, ArtistBooking, LogisticsCostEstimate,
    SundriesCostEstimate, BudgetSummary, HotelTier, ArtistType,
    LogisticsItemType, SundriesItemType, FunctionType
)
from services.rate_card_service import RateCardService


class BudgetEngine:
    """Compute full budget estimate for a BudgetSession."""

    def __init__(self, session: BudgetSession):
        self.session = session
        self.rcs = RateCardService()

    def compute_all(self):
        """Run all cost-head computations and save a BudgetSummary."""
        venue = self._compute_venue()
        fnb_totals = self._compute_fnb()
        decor_totals = self._compute_decor()
        artist_totals = self._compute_artists()
        logistics = self._compute_logistics()
        sundries = self._compute_sundries(
            venue, fnb_totals, decor_totals, artist_totals, logistics
        )

        # Sum all heads
        heads = [venue, fnb_totals, decor_totals, artist_totals, logistics, sundries]
        total_low = sum(h.get("total_low", 0) for h in heads)
        total_high = sum(h.get("total_high", 0) for h in heads)
        total_mid = (total_low + total_high) / 2

        # Save or update BudgetSummary
        summary = self.session.budget_summary
        if not summary:
            summary = BudgetSummary(session_id=self.session.id)
            db.session.add(summary)

        summary.total_low = total_low
        summary.total_mid = total_mid
        summary.total_high = total_high
        summary.overall_confidence_score = 0.7  # Rule-based default
        summary.generated_at = datetime.now(timezone.utc)

        db.session.commit()
        return summary

    # ── 1. Venue & Accommodation ───────────────────────────

    def _compute_venue(self) -> dict:
        """Compute venue + accommodation costs.

        Formula:
          Room cost = rooms_count × nightly_rate × nights_count
          Banquet cost = banquet_rate × nights_count (one event per day)
          City factor applied to both.
        """
        s = self.session
        rates = self.rcs.get_venue_rates(s.city, s.hotel_tier)
        city_factor = self.rcs.get_city_factor(s.city, "venue")

        if not rates:
            return self._save_venue_cost(0, 0, 0, 0, 0, 0)

        rooms = s.rooms_count or 0
        nights = s.nights_count or 1

        room_low = rates["room_rate_min"] * rooms * nights * city_factor
        room_high = rates["room_rate_max"] * rooms * nights * city_factor
        banquet_low = rates["banquet_min"] * nights * city_factor
        banquet_high = rates["banquet_max"] * nights * city_factor

        total_low = room_low + banquet_low
        total_high = room_high + banquet_high

        return self._save_venue_cost(
            rates["room_rate_min"], (rates["room_rate_min"] + rates["room_rate_max"]) / 2,
            rates["room_rate_max"],
            banquet_low, (banquet_low + banquet_high) / 2, banquet_high,
            total_low=total_low, total_high=total_high
        )

    def _save_venue_cost(self, rr_low, rr_mid, rr_high, bq_low, bq_mid, bq_high,
                         total_low=0, total_high=0) -> dict:
        est = self.session.venue_cost
        if not est:
            est = VenueCostEstimate(session_id=self.session.id)
            db.session.add(est)
        est.room_rate_low = rr_low
        est.room_rate_mid = rr_mid
        est.room_rate_high = rr_high
        est.banquet_rate_low = bq_low
        est.banquet_rate_mid = bq_mid
        est.banquet_rate_high = bq_high
        est.total_low = total_low
        est.total_mid = (total_low + total_high) / 2
        est.total_high = total_high
        est.assumptions_json = {
            "rooms": self.session.rooms_count,
            "nights": self.session.nights_count,
            "city_factor": self.rcs.get_city_factor(self.session.city, "venue"),
        }
        db.session.flush()
        return {"total_low": total_low, "total_high": total_high}

    # ── 2. F&B ─────────────────────────────────────────────

    def _compute_fnb(self) -> dict:
        """Compute F&B costs per function.

        Formula per function:
          Base = per_head_rate × guest_count
          Staffing = ceil(guests / 10) × 2000 (daily server rate)
          Crockery = flat 50K if hotel < 5-star, else 0
          Specialty counters add flat amounts per counter.
        """
        s = self.session
        city_factor = self.rcs.get_city_factor(s.city, "fnb")
        total_low = 0
        total_high = 0

        for func in s.functions:
            guests = func.guest_count_override or s.total_guests
            rates = self.rcs.get_fnb_rates(func.meal_type, func.bar_type)

            if not rates:
                self._save_fnb_cost(func, 0, 0, 0, 0, 0)
                continue

            base_low = rates["per_head_min"] * guests * city_factor
            base_high = rates["per_head_max"] * guests * city_factor

            # Staffing: 1 server per 10 guests, ₹2,000/server/day
            servers = math.ceil(guests / 10)
            staffing = servers * 2000

            # Crockery: flat ₹50,000 if not 5-star
            crockery = 0
            if s.hotel_tier and s.hotel_tier not in (
                HotelTier.FIVE_STAR_PALACE, HotelTier.FIVE_STAR_CITY
            ):
                crockery = 50000

            # Specialty counters: ₹25,000 per counter
            counter_count = len(func.specialty_counters or [])
            counter_cost = counter_count * 25000

            func_low = base_low + staffing + crockery + counter_cost
            func_high = base_high + staffing + crockery + counter_cost

            self._save_fnb_cost(
                func, rates["per_head_min"], rates["per_head_max"],
                staffing, crockery, func_low, func_high
            )
            total_low += func_low
            total_high += func_high

        return {"total_low": total_low, "total_high": total_high}

    def _save_fnb_cost(self, func, ph_low, ph_high, staffing, crockery,
                       total_low=0, total_high=0):
        est = func.fnb_cost
        if not est:
            est = FnBCostEstimate(
                session_id=self.session.id, function_id=func.id
            )
            db.session.add(est)
        est.meal_type = func.meal_type
        est.bar_type = func.bar_type
        est.per_head_low = ph_low
        est.per_head_high = ph_high
        est.staffing_cost = staffing
        est.crockery_cost = crockery
        est.total_low = total_low
        est.total_mid = (total_low + total_high) / 2
        est.total_high = total_high
        db.session.flush()

    # ── 3. Décor ───────────────────────────────────────────

    def _compute_decor(self) -> dict:
        """Compute décor costs per function using rule-based fallback.

        Uses RateCardService.get_decor_fallback() which returns cost
        ranges based on function_type × complexity_tier.
        City factor applied on top.
        """
        s = self.session
        city_factor = self.rcs.get_city_factor(s.city, "decor")
        total_low = 0
        total_high = 0

        for func in s.functions:
            cost_low, cost_high = self.rcs.get_decor_fallback(
                func.function_name, func.decor_complexity
            )
            cost_low *= city_factor
            cost_high *= city_factor

            est = func.decor_cost
            if not est:
                est = DecorCostEstimate(
                    session_id=s.id, function_id=func.id
                )
                db.session.add(est)
            est.ai_predicted_low = cost_low
            est.ai_predicted_mid = (cost_low + cost_high) / 2
            est.ai_predicted_high = cost_high
            est.confidence_score = 0.6  # Rule-based = moderate confidence
            est.model_version = "rule-based-v1"
            est.computed_at = datetime.now(timezone.utc)
            db.session.flush()

            total_low += cost_low
            total_high += cost_high

        return {"total_low": total_low, "total_high": total_high}

    # ── 4. Artists & Entertainment ─────────────────────────

    def _compute_artists(self) -> dict:
        """Compute entertainment costs from artist selections.

        For each function's artist_types list, look up rates from
        ArtistDirectory. City factor applied with ±15% adjustment.
        """
        s = self.session
        city_factor = self.rcs.get_city_factor(s.city, "artist")
        total_low = 0
        total_high = 0

        # Clear existing bookings
        ArtistBooking.query.filter_by(session_id=s.id).delete()
        db.session.flush()

        for func in s.functions:
            for atype_str in (func.artist_types or []):
                try:
                    atype = ArtistType(atype_str)
                except ValueError:
                    continue

                rates = self.rcs.get_artist_rates(atype)
                if not rates:
                    continue

                cost_low = rates["fee_min"] * city_factor
                cost_high = rates["fee_max"] * city_factor

                booking = ArtistBooking(
                    session_id=s.id,
                    artist_type=atype,
                    tier_label=rates["tier_label"],
                    cost_low=cost_low,
                    cost_high=cost_high,
                )
                db.session.add(booking)
                total_low += cost_low
                total_high += cost_high

        db.session.flush()
        return {"total_low": total_low, "total_high": total_high}

    # ── 5. Logistics ───────────────────────────────────────

    def _compute_logistics(self) -> dict:
        """Compute logistics costs.

        Transfer fleet:
          outstation_guests = total_guests × outstation_pct / 100
          fleet = ceil(outstation_guests / 3)  # 3 per Innova Crysta
          cost = fleet × rate

        Baraat: ghodi + dholi (auto-added if BARAAT function exists)
        """
        s = self.session
        city_factor = self.rcs.get_city_factor(s.city, "logistics")

        # Transfers
        outstation_guests = int(s.total_guests * (s.outstation_pct or 50) / 100)
        fleet = self.rcs.calculate_transfer_fleet(outstation_guests)

        innova_rate = self.rcs.get_logistics_rate(LogisticsItemType.INNOVA, s.city)
        transfer_low = fleet * (innova_rate["rate_min"] if innova_rate else 3000) * city_factor
        transfer_high = fleet * (innova_rate["rate_max"] if innova_rate else 5000) * city_factor

        # Baraat logistics: auto-detect if BARAAT function exists
        has_baraat = any(
            f.function_name == FunctionType.BARAAT for f in s.functions
        )

        ghodi_count = 1 if has_baraat else 0
        ghodi_rate = self.rcs.get_logistics_rate(LogisticsItemType.GHODI, s.city)
        ghodi_cost = ghodi_count * (
            ((ghodi_rate["rate_min"] + ghodi_rate["rate_max"]) / 2)
            if ghodi_rate else 50000
        ) * city_factor

        dholi_count = 2 if has_baraat else 0
        dholi_rate = self.rcs.get_logistics_rate(LogisticsItemType.DHOLI, s.city)
        dholi_cost = dholi_count * (
            ((dholi_rate["rate_min"] + dholi_rate["rate_max"]) / 2)
            if dholi_rate else 12000
        ) * city_factor

        total_low = transfer_low + ghodi_cost + dholi_cost
        total_high = transfer_high + ghodi_cost + dholi_cost

        est = s.logistics_cost
        if not est:
            est = LogisticsCostEstimate(session_id=s.id)
            db.session.add(est)

        est.transfer_fleet_count = fleet
        est.transfer_cost_low = transfer_low
        est.transfer_cost_high = transfer_high
        est.ghodi_count = ghodi_count
        est.ghodi_cost = ghodi_cost
        est.dholi_count = dholi_count
        est.dholi_cost = dholi_cost
        est.sfx_items = []
        est.sfx_cost = 0
        est.total_low = total_low
        est.total_high = total_high
        db.session.flush()

        return {"total_low": total_low, "total_high": total_high}

    # ── 6. Sundries & Basics ──────────────────────────────

    def _compute_sundries(self, venue, fnb, decor, artists, logistics) -> dict:
        """Compute sundries costs + contingency buffer.

        Room baskets, gift hampers, stationery, photo/video, rituals.
        Contingency = sum_of_all_other_heads × contingency_pct / 100.
        """
        s = self.session
        city_factor = self.rcs.get_city_factor(s.city, "sundries")

        # Room baskets
        tier_map = {"basic": SundriesItemType.ROOM_BASKET,
                    "standard": SundriesItemType.ROOM_BASKET,
                    "premium": SundriesItemType.ROOM_BASKET}
        rb_rate = self.rcs.get_sundries_rate(SundriesItemType.ROOM_BASKET, s.hotel_tier)
        basket_per_room = ((rb_rate["rate_min"] + rb_rate["rate_max"]) / 2) if rb_rate else 1500
        # Adjust by tier name
        tier_mult = {"basic": 0.6, "standard": 1.0, "premium": 1.8}.get(
            s.room_basket_tier, 1.0
        )
        room_basket_cost = (s.rooms_count or 0) * basket_per_room * tier_mult * city_factor

        # Gift hampers
        gh_rate = self.rcs.get_sundries_rate(SundriesItemType.GIFT_HAMPER)
        hamper_per_guest = ((gh_rate["rate_min"] + gh_rate["rate_max"]) / 2) if gh_rate else 1000
        hamper_mult = {"none": 0, "token": 0.5, "standard": 1.0, "premium": 2.0}.get(
            s.gift_hamper_tier, 0
        )
        gift_hamper_cost = s.total_guests * hamper_per_guest * hamper_mult * city_factor

        # Stationery
        st_rate = self.rcs.get_sundries_rate(SundriesItemType.STATIONERY)
        per_card = ((st_rate["rate_min"] + st_rate["rate_max"]) / 2) if st_rate else 300
        stationery_cost = (s.invite_quantity or 0) * per_card * city_factor
        stationery_cost += 25000 * city_factor  # Flat signage allowance

        # Photography / videography
        pv_rate = self.rcs.get_sundries_rate(SundriesItemType.PHOTO_VIDEO)
        pv_base = ((pv_rate["rate_min"] + pv_rate["rate_max"]) / 2) if pv_rate else 500000
        pv_mult = {"none": 0, "basic": 0.6, "premium": 1.0, "luxury": 1.8}.get(
            s.photo_video_tier, 0
        )
        photo_video_cost = pv_base * pv_mult * city_factor

        # Ritual materials (auto-detect from functions)
        ritual_costs = {}
        for func in s.functions:
            if func.function_name == FunctionType.HALDI:
                r = self.rcs.get_sundries_rate(SundriesItemType.RITUAL_HALDI)
                cost = ((r["rate_min"] + r["rate_max"]) / 2 * city_factor) if r else 30000
                ritual_costs["haldi"] = cost
            elif func.function_name == FunctionType.MEHENDI:
                r = self.rcs.get_sundries_rate(SundriesItemType.RITUAL_MEHENDI)
                cost = ((r["rate_min"] + r["rate_max"]) / 2 * city_factor) if r else 50000
                ritual_costs["mehendi"] = cost
            elif func.function_name == FunctionType.PHERAS:
                r = self.rcs.get_sundries_rate(SundriesItemType.RITUAL_PHERAS)
                cost = ((r["rate_min"] + r["rate_max"]) / 2 * city_factor) if r else 25000
                ritual_costs["pheras"] = cost
        ritual_total = sum(ritual_costs.values())

        sundries_total = (room_basket_cost + gift_hamper_cost + stationery_cost +
                          photo_video_cost + ritual_total)

        # Contingency: 10% of all other heads combined
        contingency_pct = 10.0
        other_heads_total = (
            venue.get("total_low", 0) + venue.get("total_high", 0) +
            fnb.get("total_low", 0) + fnb.get("total_high", 0) +
            decor.get("total_low", 0) + decor.get("total_high", 0) +
            artists.get("total_low", 0) + artists.get("total_high", 0) +
            logistics.get("total_low", 0) + logistics.get("total_high", 0)
        ) / 2  # Use average of low+high
        contingency_amount = (other_heads_total + sundries_total) * contingency_pct / 100

        total_low = sundries_total + contingency_amount * 0.8
        total_high = sundries_total + contingency_amount * 1.2

        est = s.sundries_cost
        if not est:
            est = SundriesCostEstimate(session_id=s.id)
            db.session.add(est)

        est.room_basket_cost = room_basket_cost
        est.ritual_costs = ritual_costs
        est.gift_hamper_cost = gift_hamper_cost
        est.stationery_cost = stationery_cost
        est.photo_video_cost = photo_video_cost
        est.contingency_pct = contingency_pct
        est.contingency_amount = contingency_amount
        est.total_low = total_low
        est.total_high = total_high
        db.session.flush()

        return {"total_low": total_low, "total_high": total_high}
