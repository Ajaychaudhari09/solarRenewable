"""
Agent 03 — Data Normalization Agent
Normalizes telemetry into common internal units and schema.
"""
from __future__ import annotations
from typing import Any, Dict, List
from .base import BaseAgent


class DataNormalizationAgent(BaseAgent):
    agent_id = "data_normalization"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        turbine_data = inputs.get("turbine_data", [])
        solar_data = inputs.get("solar_data", [])
        weather = inputs.get("weather_data", {})

        normalized_turbines = []
        for t in turbine_data:
            normalized_turbines.append({
                "asset_id": t.get("asset_id"),
                "timestamp": t.get("timestamp"),
                "power_kw": float(t.get("power_kw", 0)),
                "expected_power_kw": float(t.get("expected_power_kw", 0)),
                "wind_speed_ms": float(t.get("wind_speed_ms", 0)),
                "temperature_c": float(t.get("temperature_c", 0)),
                "vibration_ms2": float(t.get("vibration_ms2", 0)),
                "rotor_rpm": float(t.get("rotor_rpm", 0)),
                "fault_progression": float(t.get("fault_progression", 0)),
                "health": float(t.get("health", 1.0)),
                "farm_id": t.get("farm_id"),
                "_normalized": True,
            })

        normalized_solar = []
        for s in solar_data:
            normalized_solar.append({
                "asset_id": s.get("asset_id"),
                "farm_id": s.get("farm_id"),
                "timestamp": s.get("timestamp"),
                "power_kw": float(s.get("power_kw", 0)),
                "expected_power_kw": float(s.get("expected_power_kw", 0)),
                "irradiance_wm2": float(s.get("irradiance_wm2", 0)),
                "temperature_c": float(s.get("temperature_c", 0)),
                "_normalized": True,
            })

        return {
            "confidence": 1.0,
            "data_quality": inputs.get("data_quality_score", 1.0),
            "results": {
                "turbine_records": len(normalized_turbines),
                "solar_records": len(normalized_solar),
                "normalized_turbines": normalized_turbines,
                "normalized_solar": normalized_solar,
                "weather": weather,
            },
            "evidence": [],
            "warnings": [],
            "next_actions": ["asset_performance"],
        }
