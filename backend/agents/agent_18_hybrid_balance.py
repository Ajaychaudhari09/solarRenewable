"""
Agent 18 — Hybrid Balance Optimization Agent
Optimizes distribution between solar, wind, storage, and grid contribution.
"""
from __future__ import annotations
from typing import Any, Dict
from .base import BaseAgent


class HybridBalanceAgent(BaseAgent):
    agent_id = "hybrid_balance_optimization"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        generation = inputs.get("generation", {})
        grid = inputs.get("grid", {})
        battery = inputs.get("battery", {})
        grid_risk = inputs.get("grid_risk", {}).get("results", {})

        total_gen = generation.get("total_kw", 0)
        wind_kw = generation.get("wind_kw", 0)
        solar_kw = generation.get("solar_kw", 0)
        available = grid.get("available_capacity_kw", 18000)
        soc = battery.get("soc", 0.5)
        curtailment = grid.get("curtailment_kw", 0)
        risk_level = grid_risk.get("risk_level", "low")

        # Dispatch logic
        grid_export = min(total_gen, available)
        battery_action = "hold"
        battery_target_kw = 0

        if curtailment > 100 and soc < 0.9:
            battery_action = "charge"
            battery_target_kw = min(curtailment, 2000 * (0.9 - soc))
        elif risk_level in ("high", "critical") and soc > 0.3:
            battery_action = "discharge"
            battery_target_kw = min(2000, total_gen * 0.1)
        elif soc < 0.2 and total_gen > available * 0.5:
            battery_action = "charge"
            battery_target_kw = min(500, 2000)

        recommendation = {
            "charge": "Excess generation available — charge battery storage",
            "discharge": "High grid risk — buffer grid with battery discharge",
            "hold": "Generation and demand balanced — hold battery",
        }[battery_action]

        return {
            "confidence": 0.85,
            "results": {
                "grid_export_kw": round(grid_export, 2),
                "battery_action": battery_action,
                "battery_target_kw": round(battery_target_kw, 2),
                "solar_contribution_pct": round(solar_kw / total_gen * 100 if total_gen > 0 else 0, 1),
                "wind_contribution_pct": round(wind_kw / total_gen * 100 if total_gen > 0 else 0, 1),
                "curtailment_kw": round(curtailment, 2),
                "recommendation": recommendation,
            },
            "evidence": [{"metric": "battery_action", "value": battery_action}],
            "warnings": [f"Curtailment {curtailment:.0f} kW detected"] if curtailment > 200 else [],
        }
