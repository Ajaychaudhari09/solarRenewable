"""
Agent 15 — Maintenance Scheduling Agent
Recommends when to schedule maintenance using weather, forecast, and asset priority.
"""
from __future__ import annotations
from typing import Any, Dict, List
from datetime import datetime, timedelta
from .base import BaseAgent


class MaintenanceSchedulingAgent(BaseAgent):
    agent_id = "maintenance_scheduling"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        priority_queue: List[Dict] = inputs.get("priority_queue", {}).get("priority_queue", [])
        weather = inputs.get("weather", {})
        wind_forecast = inputs.get("wind_forecast", {}).get("results", {})
        base_ts = inputs.get("timestamp", datetime.utcnow().isoformat())
        if isinstance(base_ts, str):
            base_ts = datetime.fromisoformat(base_ts.replace("Z", ""))

        schedule: List[Dict] = []
        for item in priority_queue[:10]:  # top-10 assets
            urgency = item.get("urgency", "scheduled")
            days_to_fail = item.get("days_to_failure", 365)

            # Choose maintenance window
            if urgency == "immediate":
                window_start = base_ts + timedelta(hours=4)
                window_end = base_ts + timedelta(hours=28)
            elif urgency == "high":
                window_start = base_ts + timedelta(days=1)
                window_end = base_ts + timedelta(days=5)
            elif urgency == "medium":
                window_start = base_ts + timedelta(days=7)
                window_end = base_ts + timedelta(days=21)
            else:
                window_start = base_ts + timedelta(days=30)
                window_end = base_ts + timedelta(days=60)

            # Downtime estimate based on urgency
            estimated_downtime_h = {
                "immediate": 12,
                "high": 8,
                "medium": 6,
                "low": 4,
                "scheduled": 4,
            }.get(urgency, 4)

            schedule.append({
                "asset_id": item["asset_id"],
                "priority_score": item["priority_score"],
                "urgency": urgency,
                "recommended_window_start": window_start.isoformat(),
                "recommended_window_end": window_end.isoformat(),
                "estimated_downtime_h": estimated_downtime_h,
                "estimated_energy_loss_kwh": round(2000 * estimated_downtime_h, 0),
                "estimated_energy_loss_inr": round(2000 * estimated_downtime_h / 1000 * 3200, 0),
                "reason": item.get("recommended_action", ""),
            })

        return {
            "confidence": 0.80,
            "results": {
                "schedule": schedule,
                "immediate_count": sum(1 for s in schedule if s["urgency"] == "immediate"),
            },
            "evidence": [],
            "warnings": [],
        }
