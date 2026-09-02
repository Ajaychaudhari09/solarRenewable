"""
Agent 19 — Energy Storage Optimization Agent
Recommends charge/discharge/hold using forecast, SOC, grid conditions, and pricing.
"""
from __future__ import annotations
from typing import Any, Dict
from .base import BaseAgent


ENERGY_PRICE_PEAK_INR = 5500    # peak hours (11:00–14:00 & 18:00–22:00)
ENERGY_PRICE_OFF_PEAK_INR = 2800
BATTERY_CAPACITY_KWH = 10000


def _is_peak_hour(hour: int) -> bool:
    return 11 <= hour <= 14 or 18 <= hour <= 22


class StorageOptimizationAgent(BaseAgent):
    agent_id = "energy_storage_optimization"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        battery = inputs.get("battery", {})
        grid_risk = inputs.get("grid_risk", {}).get("results", {})
        generation = inputs.get("generation", {})
        timestamp = inputs.get("timestamp", "2024-06-15T12:00:00")

        soc = battery.get("soc", 0.5)
        total_gen = generation.get("total_kw", 0)
        available_cap = inputs.get("grid", {}).get("available_capacity_kw", 18000)
        risk_level = grid_risk.get("risk_level", "low")

        # Parse hour for pricing
        try:
            hour = int(timestamp[11:13]) if len(timestamp) > 11 else 12
        except Exception:
            hour = 12

        price = ENERGY_PRICE_PEAK_INR if _is_peak_hour(hour) else ENERGY_PRICE_OFF_PEAK_INR

        # Decision logic
        surplus = total_gen - available_cap
        action = "hold"
        target_soc = soc
        rationale = ""

        if surplus > 200 and soc < 0.85:
            action = "charge"
            target_soc = min(0.95, soc + 0.05)
            rationale = "Surplus generation — opportunistic charging"
        elif _is_peak_hour(hour) and soc > 0.3 and risk_level != "critical":
            action = "discharge"
            target_soc = max(0.15, soc - 0.1)
            rationale = f"Peak pricing (₹{price}/MWh) — maximize revenue from storage"
        elif risk_level == "critical" and soc > 0.4:
            action = "discharge"
            target_soc = max(0.2, soc - 0.15)
            rationale = "Grid critical — support with battery discharge"
        elif soc < 0.15:
            action = "hold"
            rationale = "Low SOC — reserve for emergency"
        else:
            rationale = "No compelling charge/discharge trigger — hold"

        stored_energy_kwh = round(soc * BATTERY_CAPACITY_KWH, 0)
        discharge_potential_inr = round(stored_energy_kwh * price / 1000, 0)

        return {
            "confidence": 0.83,
            "results": {
                "action": action,
                "current_soc": round(soc, 4),
                "target_soc": round(target_soc, 4),
                "stored_energy_kwh": stored_energy_kwh,
                "current_price_inr_per_mwh": price,
                "is_peak_hour": _is_peak_hour(hour),
                "discharge_potential_inr": discharge_potential_inr,
                "rationale": rationale,
            },
            "evidence": [{"metric": "soc", "value": soc}, {"metric": "action", "value": action}],
            "warnings": [f"Low battery SOC: {soc:.0%}"] if soc < 0.2 else [],
        }
