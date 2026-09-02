"""
Agent 11 — Root Cause Analysis Agent
Investigates likely causes using weather, sensor, performance, and fault evidence.
Returns ranked hypotheses with confidence scores.
"""
from __future__ import annotations
from typing import Any, Dict, List
from .base import BaseAgent


FAULT_PATTERNS = {
    "bearing_wear": {
        "indicators": ["high_vibration", "high_temperature", "low_performance", "fault_progression"],
        "weight": {"high_vibration": 0.40, "high_temperature": 0.30,
                   "low_performance": 0.20, "fault_progression": 0.10},
        "description": "Bearing degradation — mechanical wear increasing friction and heat",
    },
    "blade_imbalance": {
        "indicators": ["high_vibration", "low_performance"],
        "weight": {"high_vibration": 0.60, "low_performance": 0.40},
        "description": "Rotor blade imbalance — mass asymmetry causing oscillation",
    },
    "generator_fault": {
        "indicators": ["low_performance", "high_temperature"],
        "weight": {"low_performance": 0.55, "high_temperature": 0.45},
        "description": "Generator electrical fault — winding or cooling issue",
    },
    "wind_resource_low": {
        "indicators": ["low_performance"],
        "weight": {"low_performance": 1.0},
        "description": "Low wind resource — meteorological cause, not mechanical",
    },
    "sensor_malfunction": {
        "indicators": ["high_vibration", "high_temperature"],
        "weight": {"high_vibration": 0.5, "high_temperature": 0.5},
        "description": "Sensor malfunction — readings may not reflect physical reality",
    },
}


class RootCauseAgent(BaseAgent):
    agent_id = "root_cause_analysis"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        anomalies: List[Dict] = inputs.get("anomalies", {}).get("anomalies", [])
        weather = inputs.get("weather", {})
        wind_speed = weather.get("wind_speed_ms", 0)

        rca_results: List[Dict] = []

        for anomaly in anomalies:
            if not anomaly.get("is_anomalous"):
                continue

            aid = anomaly["asset_id"]
            flags = {f["type"] for f in anomaly.get("flags", [])}
            fp = next((f["value"] for f in anomaly["flags"]
                       if f["type"] == "fault_progression"), 0)

            hypotheses = []
            for cause, pattern in FAULT_PATTERNS.items():
                matching = flags & set(pattern["indicators"])
                if not matching:
                    continue

                # Wind resource exception: if wind is actually low, penalize mechanical causes
                if cause != "wind_resource_low" and wind_speed < 4.0:
                    continue
                if cause == "wind_resource_low" and wind_speed > 6.0:
                    continue

                score = sum(pattern["weight"].get(ind, 0) for ind in matching)
                # Boost bearing wear if fault_progression > 0.3
                if cause == "bearing_wear" and fp > 0.3:
                    score = min(1.0, score + 0.25 * fp)

                if score > 0.15:
                    hypotheses.append({
                        "cause": cause,
                        "confidence": round(score, 3),
                        "description": pattern["description"],
                        "matching_indicators": list(matching),
                    })

            # Sort by confidence
            hypotheses.sort(key=lambda x: x["confidence"], reverse=True)

            rca_results.append({
                "asset_id": aid,
                "anomaly_score": anomaly["anomaly_score"],
                "top_cause": hypotheses[0]["cause"] if hypotheses else "unknown",
                "hypotheses": hypotheses,
                "evidence_flags": list(flags),
            })

        return {
            "confidence": 0.87,
            "results": {
                "rca_results": rca_results,
                "assets_analyzed": len(rca_results),
            },
            "evidence": [{"asset_id": r["asset_id"], "top_cause": r["top_cause"]}
                         for r in rca_results],
            "warnings": [],
            "next_actions": ["asset_health_scoring", "predictive_maintenance"],
        }
