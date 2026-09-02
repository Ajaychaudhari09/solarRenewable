"""
Agent 20 — Energy Loss Impact Agent
Calculates lost MWh, downtime, revenue impact, and delayed-maintenance impact.
"""
from __future__ import annotations
from typing import Any, Dict, List
from .base import BaseAgent

ENERGY_PRICE_INR = 3200   # INR per MWh
TICK_HOURS = 5 / 60       # 5-minute ticks → hours


class EnergyLossAgent(BaseAgent):
    agent_id = "energy_loss_impact"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        turbine_perf: Dict = inputs.get("wind_performance", {}).get("asset_performance", {})
        solar_perf: Dict = inputs.get("solar_performance", {}).get("asset_performance", {})
        maintenance_preds: Dict = inputs.get("maintenance_predictions", {}).get("predictions", {})

        asset_losses: List[Dict] = []
        total_lost_kwh = 0.0
        total_lost_inr = 0.0

        for aid, perf in {**turbine_perf, **solar_perf}.items():
            actual = perf.get("actual_kw", 0)
            expected = perf.get("expected_kw", 0)
            lost_kw = max(0, expected - actual)
            lost_kwh = lost_kw * TICK_HOURS
            lost_inr = lost_kwh / 1000 * ENERGY_PRICE_INR

            if lost_kw > 10:
                # Extrapolate daily loss
                daily_lost_kwh = lost_kw * 12  # ~12 productive hours/day
                daily_lost_inr = daily_lost_kwh / 1000 * ENERGY_PRICE_INR

                maint = maintenance_preds.get(aid, {})
                days_to_fail = maint.get("days_to_estimated_failure", 365)
                total_projected_loss = daily_lost_inr * min(days_to_fail, 90)

                total_lost_kwh += lost_kwh
                total_lost_inr += lost_inr

                asset_losses.append({
                    "asset_id": aid,
                    "lost_kw": round(lost_kw, 2),
                    "lost_kwh_this_tick": round(lost_kwh, 4),
                    "daily_lost_kwh": round(daily_lost_kwh, 2),
                    "daily_lost_inr": round(daily_lost_inr, 0),
                    "projected_90day_loss_inr": round(total_projected_loss, 0),
                    "performance_ratio": perf.get("performance_ratio", 1.0),
                })

        asset_losses.sort(key=lambda x: x["daily_lost_inr"], reverse=True)

        return {
            "confidence": 0.92,
            "results": {
                "asset_losses": asset_losses,
                "total_lost_kwh_this_tick": round(total_lost_kwh, 4),
                "total_lost_inr_this_tick": round(total_lost_inr, 2),
                "daily_total_lost_inr": round(sum(a["daily_lost_inr"] for a in asset_losses), 0),
                "affected_asset_count": len(asset_losses),
            },
            "evidence": [{"metric": "total_daily_loss_inr",
                          "value": sum(a["daily_lost_inr"] for a in asset_losses)}],
            "warnings": [f"{len(asset_losses)} assets with energy loss detected"] if asset_losses else [],
        }
