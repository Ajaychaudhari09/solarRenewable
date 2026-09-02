"""
Agents 25-28: Digital Twin, Scenario Simulation, Human Approval, Feedback Learning
"""
from __future__ import annotations
from typing import Any, Dict, List
from datetime import datetime
import uuid
from .base import BaseAgent


# ─────────────────────────────────────────────
# Agent 25 — Digital Twin Agent
# ─────────────────────────────────────────────

class DigitalTwinAgent(BaseAgent):
    agent_id = "digital_twin"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        turbine_data: List[Dict] = inputs.get("normalized_turbines", [])
        solar_data: List[Dict] = inputs.get("normalized_solar", [])
        health_scores: Dict = inputs.get("health_scores", {}).get("health_scores", {})
        generation = inputs.get("generation", {})
        battery = inputs.get("battery", {})
        grid = inputs.get("grid", {})

        twin = {
            "park_id": "KUTCH-BANASKANTHA-HYBRID-01",
            "name": "Kutch-Banaskantha Renewable Energy Park",
            "timestamp": inputs.get("timestamp", datetime.utcnow().isoformat()),
            "wind_farm": {
                "total_turbines": len(turbine_data),
                "online": sum(1 for t in turbine_data if t.get("power_kw", 0) > 0),
                "total_kw": round(sum(t.get("power_kw", 0) for t in turbine_data), 2),
                "assets": [
                    {
                        "asset_id": t.get("asset_id"),
                        "power_kw": t.get("power_kw"),
                        "health": health_scores.get(t.get("asset_id"), {}).get("health_score", 100),
                        "status": health_scores.get(t.get("asset_id"), {}).get("status", "healthy"),
                        "vibration_ms2": t.get("vibration_ms2"),
                        "temperature_c": t.get("temperature_c"),
                    }
                    for t in turbine_data
                ],
            },
            "solar_farms": {
                "total_inverters": len(solar_data),
                "total_kw": round(sum(s.get("power_kw", 0) for s in solar_data), 2),
            },
            "battery": {
                "asset_id": battery.get("asset_id", "BATT-01"),
                "soc_pct": round(battery.get("soc", 0.5) * 100, 1),
                "action": battery.get("action", "hold"),
            },
            "grid": {
                "export_kw": grid.get("export_kw", 0),
                "available_kw": grid.get("available_capacity_kw", 18000),
                "curtailment_kw": grid.get("curtailment_kw", 0),
                "status": "curtailment" if grid.get("curtailment_kw", 0) > 100 else "normal",
            },
            "totals": {
                "total_kw": generation.get("total_kw", 0),
                "expected_kw": generation.get("expected_kw", 0),
                "efficiency_pct": round(
                    generation.get("total_kw", 0) / generation.get("expected_kw", 1) * 100, 1
                ) if generation.get("expected_kw", 0) > 0 else 0,
            },
        }

        return {
            "confidence": 0.99,
            "results": {"twin": twin},
            "evidence": [],
            "warnings": [],
        }


# ─────────────────────────────────────────────
# Agent 26 — Scenario Simulation Agent
# ─────────────────────────────────────────────

class ScenarioSimulationAgent(BaseAgent):
    agent_id = "scenario_simulation"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        scenario = inputs.get("scenario", {})
        base_generation = inputs.get("generation", {})

        wind_red = scenario.get("wind_reduction_pct", 0) / 100
        solar_red = scenario.get("solar_reduction_pct", 0) / 100
        grid_red = scenario.get("grid_capacity_reduction_pct", 0) / 100

        base_wind = base_generation.get("wind_kw", 5000)
        base_solar = base_generation.get("solar_kw", 8000)
        base_total = base_generation.get("total_kw", 13000)
        base_grid = 18000

        sim_wind = base_wind * (1 - wind_red)
        sim_solar = base_solar * (1 - solar_red)
        sim_total = sim_wind + sim_solar
        sim_grid_cap = base_grid * (1 - grid_red)
        sim_curtailment = max(0, sim_total - sim_grid_cap)

        lost_kw = (base_total - sim_total) + sim_curtailment
        daily_lost_kwh = lost_kw * 12
        daily_lost_inr = daily_lost_kwh / 1000 * 3200

        impacts = []
        if wind_red > 0:
            impacts.append(f"Wind output reduced by {wind_red:.0%}")
        if solar_red > 0:
            impacts.append(f"Solar output reduced by {solar_red:.0%}")
        if grid_red > 0:
            impacts.append(f"Grid capacity reduced — curtailment: {sim_curtailment:.0f} kW")
        if scenario.get("inject_wt07_fault"):
            impacts.append("WT-07 bearing fault injected — see anomaly chain")

        return {
            "confidence": 0.85,
            "results": {
                "scenario_name": scenario.get("name", "Custom Scenario"),
                "simulated_wind_kw": round(sim_wind, 2),
                "simulated_solar_kw": round(sim_solar, 2),
                "simulated_total_kw": round(sim_total, 2),
                "simulated_curtailment_kw": round(sim_curtailment, 2),
                "delta_kw": round(sim_total - base_total, 2),
                "daily_lost_kwh": round(daily_lost_kwh, 2),
                "daily_lost_inr": round(daily_lost_inr, 0),
                "impacts": impacts,
            },
            "evidence": [],
            "warnings": impacts,
        }


# ─────────────────────────────────────────────
# Agent 27 — Human Approval Agent
# ─────────────────────────────────────────────

class HumanApprovalAgent(BaseAgent):
    agent_id = "human_approval"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        alerts: List[Dict] = inputs.get("alerts", {}).get("alerts", [])
        maintenance_queue: List[Dict] = inputs.get("priority_queue", {}).get("priority_queue", [])

        # Classify recommendations
        auto_actions = []
        operator_review = []
        critical_approval = []

        for alert in alerts:
            if alert.get("requires_human_approval"):
                if alert.get("severity") == "critical":
                    critical_approval.append({
                        "item_type": "alert",
                        "id": alert.get("alert_id"),
                        "asset_id": alert.get("asset_id"),
                        "title": alert.get("title"),
                        "recommended_action": alert.get("recommended_action"),
                        "status": "pending",
                    })
                else:
                    operator_review.append({
                        "item_type": "alert",
                        "id": alert.get("alert_id"),
                        "asset_id": alert.get("asset_id"),
                        "title": alert.get("title"),
                        "status": "pending",
                    })
            elif alert.get("severity") in ("info", "optimization"):
                auto_actions.append({
                    "item_type": "alert",
                    "id": alert.get("alert_id"),
                    "title": alert.get("title"),
                    "status": "auto",
                })

        for item in maintenance_queue[:5]:
            if item.get("urgency") == "immediate":
                critical_approval.append({
                    "item_type": "maintenance",
                    "asset_id": item.get("asset_id"),
                    "title": f"Emergency maintenance: {item.get('asset_id')}",
                    "recommended_action": item.get("recommended_action"),
                    "status": "pending",
                })

        return {
            "confidence": 1.0,
            "results": {
                "critical_approval": critical_approval,
                "operator_review": operator_review,
                "auto_actions": auto_actions,
                "critical_count": len(critical_approval),
                "review_count": len(operator_review),
            },
            "evidence": [],
            "warnings": [f"{len(critical_approval)} items require critical human approval"]
            if critical_approval else [],
            "next_actions": ["escalate_to_operator"] if critical_approval else [],
        }


# ─────────────────────────────────────────────
# Agent 28 — Feedback Learning Agent
# ─────────────────────────────────────────────

class FeedbackLearningAgent(BaseAgent):
    agent_id = "feedback_learning"

    _feedback_log: List[Dict] = []

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        feedback = inputs.get("feedback", {})
        if feedback:
            self._feedback_log.append({
                "id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat(),
                "prediction": feedback.get("prediction", {}),
                "operator_decision": feedback.get("operator_decision", ""),
                "actual_outcome": feedback.get("actual_outcome", ""),
                "asset_id": feedback.get("asset_id", ""),
            })

        # Accuracy summary
        total = len(self._feedback_log)
        correct = sum(
            1 for fb in self._feedback_log
            if fb.get("operator_decision") == fb.get("actual_outcome")
        )
        accuracy = round(correct / total, 3) if total > 0 else None

        return {
            "confidence": 1.0,
            "results": {
                "feedback_log_count": total,
                "prediction_accuracy": accuracy,
                "recent_feedback": self._feedback_log[-5:],
                "status": "logging_active",
            },
            "evidence": [],
            "warnings": [],
        }
