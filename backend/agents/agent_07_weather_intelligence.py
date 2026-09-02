"""
Agent 07 — Weather Intelligence Agent
Analyzes weather conditions and their impact on generation potential.
"""
from __future__ import annotations
from typing import Any, Dict
from .base import BaseAgent


class WeatherIntelligenceAgent(BaseAgent):
    agent_id = "weather_intelligence"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        w = inputs.get("weather", {})
        irr = w.get("irradiance_wm2", 0)
        wind = w.get("wind_speed_ms", 0)
        cloud = w.get("cloud_cover_pct", 0)
        temp = w.get("temperature_c", 30)
        precip = w.get("precipitation_mm", 0)

        solar_potential = "excellent" if irr > 700 else \
                          "good" if irr > 400 else \
                          "fair" if irr > 150 else "poor"

        wind_potential = "excellent" if 10 <= wind <= 20 else \
                         "good" if 6 <= wind < 10 else \
                         "fair" if 3 <= wind < 6 else "poor"

        weather_risk = "none"
        risks = []
        if cloud > 70:
            risks.append("heavy_cloud_cover")
        if precip > 10:
            risks.append("heavy_precipitation")
        if wind > 22:
            risks.append("high_wind_speed")
        if temp > 45:
            risks.append("extreme_temperature")
        if risks:
            weather_risk = "severe" if len(risks) >= 2 else "moderate"

        temp_derating_pct = max(0, (temp - 25) * 0.4)  # PV derating

        return {
            "confidence": 0.92,
            "results": {
                "irradiance_wm2": irr,
                "wind_speed_ms": wind,
                "cloud_cover_pct": cloud,
                "temperature_c": temp,
                "precipitation_mm": precip,
                "solar_potential": solar_potential,
                "wind_potential": wind_potential,
                "weather_risk": weather_risk,
                "risk_factors": risks,
                "temp_derating_pct": round(temp_derating_pct, 2),
            },
            "evidence": [
                {"metric": "irradiance", "value": irr},
                {"metric": "wind_speed", "value": wind},
            ],
            "warnings": [f"Weather risks: {risks}"] if risks else [],
            "next_actions": ["solar_forecast", "wind_forecast"],
        }
