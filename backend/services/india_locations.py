"""
GridPulse AI — India Location Intelligence
Real-world location data for Gujarat and Indian renewable energy context.
"""
from __future__ import annotations
from typing import Dict, Any, List

# ─────────────────────────────────────────────
# India Location Database
# Solar irradiance & wind data from NIWE / IMD / NREL baselines
# ─────────────────────────────────────────────

INDIA_LOCATIONS: Dict[str, Dict[str, Any]] = {
    "kutch": {
        "id": "kutch",
        "name": "Kutch, Gujarat",
        "state": "Gujarat",
        "lat": 23.73,
        "lon": 69.86,
        "avg_irradiance_kwh_m2_day": 6.1,
        "avg_wind_speed_ms": 7.8,
        "peak_sun_hours": 6.0,
        "avg_temp_c": 31.5,
        "summer_temp_max_c": 46,
        "renewable_installed_mw": 4200,  # approximate Gujarat + Kutch combined context
        "solar_installed_mw": 2800,
        "wind_installed_mw": 1400,
        "electricity_tariff_inr_kwh": 7.5,
        "grid_emission_factor": 0.71,
        "description": "One of India's prime renewable energy zones — exceptional solar irradiance and strong coastal winds year-round.",
        "seasonal_notes": {
            "summer": "Peak solar generation. Extreme heat (40-46°C) reduces panel efficiency by 10-15%.",
            "monsoon": "Cloud cover reduces solar 60-80%. Wind generation increases significantly.",
            "winter": "Excellent solar conditions. Moderate wind. Peak performance period.",
            "spring": "Very good solar irradiance. Ideal maintenance window.",
        },
    },
    "banaskantha": {
        "id": "banaskantha",
        "name": "Banaskantha, Gujarat",
        "state": "Gujarat",
        "lat": 24.17,
        "lon": 72.43,
        "avg_irradiance_kwh_m2_day": 5.8,
        "avg_wind_speed_ms": 5.2,
        "peak_sun_hours": 5.7,
        "avg_temp_c": 29.0,
        "summer_temp_max_c": 43,
        "renewable_installed_mw": 1100,
        "solar_installed_mw": 900,
        "wind_installed_mw": 200,
        "electricity_tariff_inr_kwh": 7.2,
        "grid_emission_factor": 0.71,
        "description": "Strong solar corridor in north Gujarat. Growing solar capacity with good grid connectivity.",
        "seasonal_notes": {
            "summer": "High temperatures affect panel efficiency. Dust storms may reduce irradiance.",
            "monsoon": "Moderate cloud cover. Irrigation demand spikes.",
            "winter": "Best solar performance. Cool clear skies.",
            "spring": "Good solar window before summer heat begins.",
        },
    },
    "ahmedabad": {
        "id": "ahmedabad",
        "name": "Ahmedabad, Gujarat",
        "state": "Gujarat",
        "lat": 23.02,
        "lon": 72.57,
        "avg_irradiance_kwh_m2_day": 5.5,
        "avg_wind_speed_ms": 3.8,
        "peak_sun_hours": 5.4,
        "avg_temp_c": 27.5,
        "summer_temp_max_c": 44,
        "renewable_installed_mw": 320,
        "solar_installed_mw": 290,
        "wind_installed_mw": 30,
        "electricity_tariff_inr_kwh": 8.2,
        "grid_emission_factor": 0.71,
        "description": "Urban solar hub — significant rooftop solar adoption in industrial and residential sectors.",
        "seasonal_notes": {
            "summer": "High urban heat island effect. Rooftop panels need regular cleaning.",
            "monsoon": "Frequent cloud cover. Significant generation reduction June-September.",
            "winter": "Excellent solar conditions with cool ambient temps.",
            "spring": "Good solar window. Ideal for maintenance before summer.",
        },
    },
    "rajkot": {
        "id": "rajkot",
        "name": "Rajkot, Gujarat",
        "state": "Gujarat",
        "lat": 22.30,
        "lon": 70.80,
        "avg_irradiance_kwh_m2_day": 5.6,
        "avg_wind_speed_ms": 4.5,
        "peak_sun_hours": 5.5,
        "avg_temp_c": 28.0,
        "summer_temp_max_c": 42,
        "renewable_installed_mw": 180,
        "solar_installed_mw": 150,
        "wind_installed_mw": 30,
        "electricity_tariff_inr_kwh": 7.8,
        "grid_emission_factor": 0.71,
        "description": "Industrial city with growing rooftop and ground-mounted solar installations.",
        "seasonal_notes": {
            "summer": "Hot and dry. Good solar but efficiency losses from heat.",
            "monsoon": "Moderate rainfall reduces solar generation.",
            "winter": "Best generation season with cool clear weather.",
            "spring": "Strong solar performance.",
        },
    },
    "surat": {
        "id": "surat",
        "name": "Surat, Gujarat",
        "state": "Gujarat",
        "lat": 21.17,
        "lon": 72.83,
        "avg_irradiance_kwh_m2_day": 5.2,
        "avg_wind_speed_ms": 4.1,
        "peak_sun_hours": 5.1,
        "avg_temp_c": 27.0,
        "summer_temp_max_c": 38,
        "renewable_installed_mw": 210,
        "solar_installed_mw": 200,
        "wind_installed_mw": 10,
        "electricity_tariff_inr_kwh": 8.0,
        "grid_emission_factor": 0.71,
        "description": "Coastal industrial city with strong textile and diamond industries driving rooftop solar demand.",
        "seasonal_notes": {
            "summer": "Humid coastal climate moderates temperature extremes.",
            "monsoon": "Heavy monsoon (June-Sep) significantly reduces solar output.",
            "winter": "Good solar season. Mild temperatures.",
            "spring": "Good generation before monsoon season.",
        },
    },
}

DEFAULT_LOCATION = "kutch"


def get_location(location_id: str) -> Dict[str, Any]:
    return INDIA_LOCATIONS.get(location_id.lower(), INDIA_LOCATIONS[DEFAULT_LOCATION])


def get_all_locations() -> List[Dict[str, Any]]:
    return [
        {"id": k, "name": v["name"], "state": v["state"],
         "lat": v["lat"], "lon": v["lon"],
         "solar_installed_mw": v["solar_installed_mw"],
         "avg_irradiance": v["avg_irradiance_kwh_m2_day"]}
        for k, v in INDIA_LOCATIONS.items()
    ]


def get_season(month: int) -> str:
    if month in (3, 4, 5):
        return "spring"
    elif month in (6, 7, 8, 9):
        return "monsoon"
    elif month in (10, 11):
        return "winter"
    elif month in (12, 1, 2):
        return "winter"
    return "spring"


def location_weather_adjustment(location_id: str, base_irradiance: float,
                                  base_wind: float, month: int) -> Dict[str, float]:
    """Scale base simulation values to match location-specific conditions."""
    loc = get_location(location_id)
    season = get_season(month)

    irr_base = loc["avg_irradiance_kwh_m2_day"] * 1000 / 12  # rough peak W/m²
    irr_factor = irr_base / 500 if irr_base > 0 else 1.0

    wind_factor = loc["avg_wind_speed_ms"] / 7.5  # normalize to Kutch baseline

    # Seasonal adjustments
    if season == "monsoon":
        irr_factor *= 0.35
        wind_factor *= 1.3
    elif season == "summer" and loc.get("summer_temp_max_c", 35) > 40:
        irr_factor *= 0.90  # heat reduces panel efficiency
    elif season == "winter":
        irr_factor *= 1.05

    return {
        "irradiance_factor": round(irr_factor, 3),
        "wind_factor": round(wind_factor, 3),
        "tariff_inr_kwh": loc["electricity_tariff_inr_kwh"],
        "season": season,
    }
