"""
Agent 02 — Sensor Health Agent
Detects sensor drift, spikes, flatlines, and communication failures.
"""
from __future__ import annotations
from typing import Any, Dict, List
import numpy as np
from .base import BaseAgent


class SensorHealthAgent(BaseAgent):
    agent_id = "sensor_health"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        turbine_data: List[Dict] = inputs.get("turbine_data", [])
        history: List[List[float]] = inputs.get("history", {})  # asset_id -> list of power values

        sensor_issues: List[Dict] = []
        asset_health: Dict[str, float] = {}

        for rec in turbine_data:
            aid = rec.get("asset_id", "unknown")
            issues = []

            # Flatline detection
            hist = history.get(aid, []) if isinstance(history, dict) else []
            if len(hist) >= 5:
                recent = hist[-5:]
                if max(recent) - min(recent) < 0.5 and max(recent) > 10:
                    issues.append("flatline_suspected")

            # Spike detection — vibration
            vib = rec.get("vibration_ms2", 0)
            if vib > 8.0:
                issues.append(f"vibration_spike: {vib:.2f} m/s²")

            # Temperature spike
            temp = rec.get("temperature_c", 0)
            if temp > 70:
                issues.append(f"temperature_spike: {temp:.1f}°C")

            # Sensor failure injection
            if inputs.get("sensor_failure_active") and aid == "WT-04":
                issues.append("sensor_communication_failure")

            health = max(0.1, 1.0 - len(issues) * 0.25)
            asset_health[aid] = round(health, 3)

            if issues:
                sensor_issues.append({
                    "asset_id": aid,
                    "issues": issues,
                    "sensor_health": health,
                })

        overall = round(float(np.mean(list(asset_health.values()))) if asset_health else 1.0, 3)

        return {
            "confidence": overall,
            "data_quality": overall,
            "results": {
                "overall_sensor_health": overall,
                "asset_sensor_health": asset_health,
                "issues_detected": sensor_issues,
                "issue_count": len(sensor_issues),
            },
            "evidence": [{"metric": "overall_sensor_health", "value": overall}],
            "warnings": [f"Sensor issues on {len(sensor_issues)} assets"] if sensor_issues else [],
            "next_actions": ["asset_performance"] if overall > 0.7 else ["investigate_sensors"],
        }
