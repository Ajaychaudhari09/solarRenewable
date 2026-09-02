"""
GridPulse AI — Rooftop Solar Intelligence
Handles analysis for residential/commercial rooftop installations.
"""
from __future__ import annotations
from typing import Dict, Any
import math


def calculate_rooftop_performance(
    capacity_kw: float,
    location_id: str,
    irradiance_wm2: float,
    temperature_c: float,
    system_age_years: float = 3.0,
    panel_type: str = "monocrystalline",
    tilt_deg: float = 15.0,
    orientation: str = "south",
) -> Dict[str, Any]:
    """Calculate expected and actual generation for rooftop solar."""

    # Panel efficiency by type
    efficiency_map = {
        "monocrystalline": 0.20,
        "polycrystalline": 0.17,
        "thin_film": 0.14,
    }
    base_efficiency = efficiency_map.get(panel_type, 0.18)

    # Temperature derating (0.4% per °C above 25°C — standard STC)
    temp_factor = 1 - 0.004 * max(0, temperature_c - 25)

    # Degradation (0.5% per year)
    degradation_factor = max(0.75, 1 - 0.005 * system_age_years)

    # Orientation penalty (South=1.0, East/West=0.85, North=0.70 for India)
    orientation_map = {"south": 1.0, "southeast": 0.95, "southwest": 0.95,
                       "east": 0.85, "west": 0.85, "north": 0.70}
    orientation_factor = orientation_map.get(orientation.lower(), 0.90)

    # Tilt factor (optimal ~15° for Gujarat latitude)
    tilt_factor = 1 - abs(tilt_deg - 15) * 0.003

    # Expected generation
    expected_kw = (capacity_kw * (irradiance_wm2 / 1000) *
                   base_efficiency / 0.18 *
                   temp_factor * degradation_factor *
                   orientation_factor * tilt_factor)
    expected_kw = max(0.0, expected_kw)

    # Inverter/cable losses ~10%
    actual_kw = expected_kw * 0.90

    # Daily and monthly estimates
    peak_sun_hours = irradiance_wm2 / 1000 * 5  # rough daily
    daily_kwh = actual_kw * peak_sun_hours if irradiance_wm2 > 100 else 0
    monthly_kwh = daily_kwh * 30

    return {
        "expected_kw": round(expected_kw, 3),
        "actual_kw": round(actual_kw, 3),
        "daily_kwh": round(daily_kwh, 2),
        "monthly_kwh": round(monthly_kwh, 1),
        "performance_ratio": round(actual_kw / capacity_kw if capacity_kw > 0 else 0, 3),
        "temp_factor": round(temp_factor, 3),
        "degradation_factor": round(degradation_factor, 3),
        "effective_efficiency_pct": round(base_efficiency * temp_factor * degradation_factor * 100, 1),
    }


def calculate_savings(
    daily_kwh: float,
    tariff_inr_kwh: float,
    grid_kwh_offset_pct: float = 0.75,
) -> Dict[str, Any]:
    """Calculate estimated financial savings from rooftop solar."""
    daily_offset_kwh = daily_kwh * grid_kwh_offset_pct
    daily_savings_inr = daily_offset_kwh * tariff_inr_kwh
    monthly_savings_inr = daily_savings_inr * 30
    annual_savings_inr = daily_savings_inr * 365

    return {
        "daily_savings_inr": round(daily_savings_inr, 2),
        "monthly_savings_inr": round(monthly_savings_inr, 0),
        "annual_savings_inr": round(annual_savings_inr, 0),
        "daily_offset_kwh": round(daily_offset_kwh, 2),
        "tariff_used_inr_kwh": tariff_inr_kwh,
        "assumptions": [
            f"{grid_kwh_offset_pct:.0%} of generation offsets grid electricity",
            f"Tariff: ₹{tariff_inr_kwh}/kWh",
            "Net metering not included in this estimate",
        ],
    }


def get_health_summary_simple(performance_ratio: float, issues: list) -> Dict[str, str]:
    """Plain-language health summary for non-technical users."""
    if performance_ratio > 0.85:
        status = "healthy"
        message = "Your solar system is working well today."
        advice = "No immediate action needed. Keep monitoring regularly."
    elif performance_ratio > 0.70:
        status = "below_expected"
        message = f"Your system is producing about {(1-performance_ratio)*100:.0f}% less than expected."
        advice = "Check for dust on panels, shading, or inverter issues."
    elif performance_ratio > 0.50:
        status = "underperforming"
        message = f"Your system is significantly underperforming — generating {(1-performance_ratio)*100:.0f}% less than it should."
        advice = "Clean the panels and check inverter indicator lights. Schedule a technician visit soon."
    else:
        status = "fault_likely"
        message = "Your system appears to have a serious issue — generation is very low."
        advice = "Stop the system safely and contact your solar installer immediately."

    if issues:
        message += f" Issues detected: {', '.join(issues[:2])}."

    return {"status": status, "message": message, "advice": advice}
