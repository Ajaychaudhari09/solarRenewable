"""
Agent 22 — Carbon Impact Agent
Estimates renewable generation contribution, avoided emissions, and sustainability impact.
"""
from __future__ import annotations
from typing import Any, Dict
from .base import BaseAgent

GRID_EMISSIONS_FACTOR = 0.71   # kg CO₂ per kWh (India grid average)
TICK_HOURS = 5 / 60


class CarbonImpactAgent(BaseAgent):
    agent_id = "carbon_impact"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        generation = inputs.get("generation", {})
        energy_loss = inputs.get("energy_loss", {}).get("results", {})

        total_gen_kw = generation.get("total_kw", 0)
        expected_kw = generation.get("expected_kw", 0)

        # This tick
        gen_kwh = total_gen_kw * TICK_HOURS
        avoided_kg = gen_kwh * GRID_EMISSIONS_FACTOR

        # Daily extrapolation
        daily_gen_kwh = total_gen_kw * 12  # ~12 productive hours
        daily_avoided_kg = daily_gen_kwh * GRID_EMISSIONS_FACTOR
        daily_avoided_tonnes = daily_avoided_kg / 1000

        # Loss-adjusted carbon
        lost_kw = max(0, expected_kw - total_gen_kw)
        daily_lost_kwh = lost_kw * 12
        additional_avoided_if_fixed = daily_lost_kwh * GRID_EMISSIONS_FACTOR / 1000

        annual_avoided_tonnes = daily_avoided_tonnes * 365

        return {
            "confidence": 0.90,
            "results": {
                "tick_gen_kwh": round(gen_kwh, 3),
                "tick_avoided_co2_kg": round(avoided_kg, 3),
                "daily_gen_kwh": round(daily_gen_kwh, 2),
                "daily_avoided_co2_kg": round(daily_avoided_kg, 2),
                "daily_avoided_co2_tonnes": round(daily_avoided_tonnes, 3),
                "annual_avoided_co2_tonnes": round(annual_avoided_tonnes, 1),
                "additional_avoided_if_losses_fixed_t": round(additional_avoided_if_fixed, 3),
                "emissions_factor_used": GRID_EMISSIONS_FACTOR,
                "assumptions": [
                    "India grid emissions factor: 0.71 kg CO₂/kWh",
                    "12 productive hours per day assumed",
                    "Avoided vs coal-heavy grid baseline",
                ],
            },
            "evidence": [
                {"metric": "daily_avoided_co2_tonnes", "value": round(daily_avoided_tonnes, 3)},
            ],
            "warnings": [],
        }
