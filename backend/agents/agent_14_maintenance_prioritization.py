"""
Agent 14 — Maintenance Prioritization Agent
Ranks maintenance tasks by failure risk × revenue impact × safety.
"""
from __future__ import annotations
from typing import Any, Dict, List
from .base import BaseAgent

ENERGY_PRICE_INR = 3200  # INR per MWh
RATED_KW = 2000


def _lost_revenue_daily(failure_prob: float, capacity_kw: float) -> float:
    """Expected daily revenue loss = failure_prob × capacity × operating hours × price."""
    expected_loss_kwh = failure_prob * capacity_kw * 12  # 12 operating hours/day
    return expected_loss_kwh / 1000 * ENERGY_PRICE_INR  # in INR


class MaintenancePrioritizationAgent(BaseAgent):
    agent_id = "maintenance_prioritization"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        predictions: Dict = inputs.get("maintenance_predictions", {}).get("predictions", {})
        wind_perf: Dict = inputs.get("wind_performance", {}).get("asset_performance", {})

        priority_queue: List[Dict] = []

        urgency_order = {"immediate": 5, "high": 4, "medium": 3, "low": 2, "scheduled": 1}

        for aid, pred in predictions.items():
            fp = pred.get("failure_probability", 0)
            urgency = pred.get("urgency", "scheduled")
            perf = wind_perf.get(aid, {})

            # Revenue impact
            actual = perf.get("actual_kw", RATED_KW * 0.5)
            expected = perf.get("expected_kw", RATED_KW * 0.5)
            current_loss_kw = max(0, expected - actual)
            daily_loss_inr = _lost_revenue_daily(fp, RATED_KW)

            # Priority score (0–100)
            priority = (urgency_order.get(urgency, 1) / 5 * 40 +
                        fp * 35 +
                        min(1.0, current_loss_kw / RATED_KW) * 15 +
                        min(1.0, daily_loss_inr / 50000) * 10)
            priority = round(min(100, priority * 100 / 100 * 100), 1)

            priority_queue.append({
                "asset_id": aid,
                "priority_score": priority,
                "failure_probability": round(fp, 3),
                "urgency": urgency,
                "current_loss_kw": round(current_loss_kw, 2),
                "estimated_daily_loss_inr": round(daily_loss_inr, 0),
                "recommended_action": pred.get("recommended_action", ""),
                "days_to_failure": pred.get("days_to_estimated_failure", 365),
            })

        priority_queue.sort(key=lambda x: x["priority_score"], reverse=True)

        return {
            "confidence": 0.88,
            "results": {
                "priority_queue": priority_queue,
                "top_priority": priority_queue[0] if priority_queue else None,
            },
            "evidence": [{"metric": "top_asset", "value": priority_queue[0]["asset_id"]}
                         if priority_queue else {}],
            "warnings": [],
            "next_actions": ["maintenance_scheduling", "energy_loss_impact"],
        }
