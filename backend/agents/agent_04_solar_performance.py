"""
Agent 04 — Solar Asset Performance Agent
Analyzes actual vs expected generation, efficiency, and panel health.
"""
from __future__ import annotations
from typing import Any, Dict, List
from .base import BaseAgent


class SolarPerformanceAgent(BaseAgent):
    agent_id = "solar_performance"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        solar_data: List[Dict] = inputs.get("normalized_solar", [])
        asset_scores = {}

        for rec in solar_data:
            aid = rec.get("asset_id")
            actual = rec.get("power_kw", 0)
            expected = rec.get("expected_power_kw", 0)
            irr = rec.get("irradiance_wm2", 0)

            if expected > 0:
                performance_ratio = actual / expected
                deviation = (actual - expected) / expected
            else:
                performance_ratio = 1.0 if irr == 0 else 0.0
                deviation = 0.0

            status = "normal"
            if performance_ratio < 0.7:
                status = "underperforming"
            elif performance_ratio < 0.85:
                status = "degraded"

            asset_scores[aid] = {
                "performance_ratio": round(performance_ratio, 4),
                "deviation_pct": round(deviation * 100, 2),
                "actual_kw": round(actual, 2),
                "expected_kw": round(expected, 2),
                "status": status,
                "farm_id": rec.get("farm_id"),
            }

        underperforming = [a for a, s in asset_scores.items()
                           if s["status"] == "underperforming"]
        avg_pr = (sum(v["performance_ratio"] for v in asset_scores.values()) /
                  len(asset_scores)) if asset_scores else 1.0

        return {
            "confidence": 0.95,
            "data_quality": inputs.get("data_quality", 1.0),
            "results": {
                "asset_performance": asset_scores,
                "avg_performance_ratio": round(avg_pr, 4),
                "underperforming_assets": underperforming,
                "underperforming_count": len(underperforming),
            },
            "evidence": [{"metric": "avg_performance_ratio", "value": round(avg_pr, 4)}],
            "warnings": [f"{len(underperforming)} solar assets underperforming"] if underperforming else [],
            "next_actions": ["anomaly_detection"],
        }
