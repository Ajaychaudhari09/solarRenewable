"""
Agent 13 — Predictive Maintenance Agent
Estimates failure probability, maintenance risk, and urgency using transparent rules.
"""
from __future__ import annotations
from typing import Any, Dict, List
import math
from .base import BaseAgent


def _failure_probability(health: float, fp: float, vib: float,
                          temp: float, age_years: float = 5.0) -> float:
    """
    Logistic model for failure probability.
    P(failure) = sigmoid( -5 + 10*(1-health) + 8*fp + 3*vib_factor + 2*temp_factor + age_factor )
    """
    vib_factor = max(0, vib - 0.5) / 5.0
    temp_factor = max(0, temp - 55) / 20.0
    age_factor = max(0, age_years - 3) * 0.1

    logit = (-5.0 +
             10.0 * (1 - health) +
             8.0 * fp +
             3.0 * vib_factor +
             2.0 * temp_factor +
             age_factor)

    return round(1 / (1 + math.exp(-logit)), 4)


class PredictiveMaintenanceAgent(BaseAgent):
    agent_id = "predictive_maintenance"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        health_scores: Dict = inputs.get("health_scores", {}).get("health_scores", {})
        turbine_data: List[Dict] = inputs.get("normalized_turbines", [])
        maintenance_history: Dict = inputs.get("maintenance_history", {})

        predictions = {}
        for rec in turbine_data:
            aid = rec.get("asset_id")
            hs = health_scores.get(aid, {})
            health = hs.get("health_normalized", 1.0)
            fp = rec.get("fault_progression", 0.0)
            vib = rec.get("vibration_ms2", 0.5)
            temp = rec.get("temperature_c", 40)

            last_maintenance = maintenance_history.get(aid, {})
            age_years = last_maintenance.get("age_years", 5.0)
            days_since_maint = last_maintenance.get("days_since", 180)

            failure_prob = _failure_probability(health, fp, vib, temp, age_years)

            # Days to failure estimate (rough MTTF proxy)
            if failure_prob > 0.8:
                days_to_failure = 3
            elif failure_prob > 0.6:
                days_to_failure = 14
            elif failure_prob > 0.4:
                days_to_failure = 30
            elif failure_prob > 0.2:
                days_to_failure = 90
            else:
                days_to_failure = 365

            urgency = ("immediate" if failure_prob > 0.7 else
                       "high" if failure_prob > 0.5 else
                       "medium" if failure_prob > 0.3 else
                       "low" if failure_prob > 0.15 else "scheduled")

            recommended_action = {
                "immediate": "Emergency inspection required within 24 hours",
                "high":      "Schedule maintenance within 3–7 days",
                "medium":    "Plan maintenance within 30 days",
                "low":       "Include in next scheduled maintenance window",
                "scheduled": "No immediate action — continue monitoring",
            }[urgency]

            predictions[aid] = {
                "failure_probability": failure_prob,
                "urgency": urgency,
                "days_to_estimated_failure": days_to_failure,
                "days_since_maintenance": days_since_maint,
                "recommended_action": recommended_action,
                "health_score": hs.get("health_score", 100),
            }

        critical = [a for a, p in predictions.items() if p["urgency"] == "immediate"]
        high = [a for a, p in predictions.items() if p["urgency"] == "high"]

        return {
            "confidence": 0.85,
            "results": {
                "predictions": predictions,
                "immediate_count": len(critical),
                "high_priority_count": len(high),
            },
            "evidence": [
                {"metric": "immediate_failures", "value": len(critical)},
                {"metric": "high_risk", "value": len(high)},
            ],
            "warnings": [f"Immediate maintenance: {critical}"] if critical else [],
            "next_actions": ["maintenance_prioritization", "energy_loss_impact"],
        }
