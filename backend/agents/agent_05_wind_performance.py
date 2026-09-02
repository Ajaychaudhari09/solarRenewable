"""
Agent 05 — Wind Turbine Performance Agent
Analyzes wind turbine output against power curve, detects degradation.
"""
from __future__ import annotations
from typing import Any, Dict, List
from .base import BaseAgent


def power_curve_expected(wind_ms: float, rated_kw: float = 2000) -> float:
    cut_in, rated, cut_out = 3.0, 12.0, 25.0
    if wind_ms < cut_in or wind_ms > cut_out:
        return 0.0
    if wind_ms >= rated:
        return rated_kw
    return rated_kw * ((wind_ms - cut_in) / (rated - cut_in)) ** 3


class WindPerformanceAgent(BaseAgent):
    agent_id = "wind_performance"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        turbine_data: List[Dict] = inputs.get("normalized_turbines", [])
        asset_scores = {}

        for rec in turbine_data:
            aid = rec.get("asset_id")
            actual = rec.get("power_kw", 0)
            wind = rec.get("wind_speed_ms", 0)
            expected = rec.get("expected_power_kw") or power_curve_expected(wind)

            if expected > 0:
                performance_ratio = actual / expected
                deviation = (actual - expected) / expected
            else:
                performance_ratio = 1.0 if wind < 3 else 0.0
                deviation = 0.0

            # Capacity factor
            capacity_factor = actual / 2000  # rated 2MW

            status = "normal"
            if performance_ratio < 0.65 and wind > 5:
                status = "underperforming"
            elif performance_ratio < 0.80 and wind > 5:
                status = "degraded"

            asset_scores[aid] = {
                "performance_ratio": round(performance_ratio, 4),
                "deviation_pct": round(deviation * 100, 2),
                "actual_kw": round(actual, 2),
                "expected_kw": round(expected, 2),
                "capacity_factor": round(capacity_factor, 4),
                "wind_speed_ms": round(wind, 2),
                "status": status,
                "health": rec.get("health", 1.0),
                "fault_progression": rec.get("fault_progression", 0.0),
                "vibration_ms2": rec.get("vibration_ms2", 0),
                "temperature_c": rec.get("temperature_c", 0),
            }

        underperforming = [a for a, s in asset_scores.items()
                           if s["status"] == "underperforming"]
        degraded = [a for a, s in asset_scores.items()
                    if s["status"] == "degraded"]
        avg_pr = (sum(v["performance_ratio"] for v in asset_scores.values()) /
                  len(asset_scores)) if asset_scores else 1.0

        return {
            "confidence": 0.96,
            "data_quality": inputs.get("data_quality", 1.0),
            "results": {
                "asset_performance": asset_scores,
                "avg_performance_ratio": round(avg_pr, 4),
                "underperforming_assets": underperforming,
                "degraded_assets": degraded,
                "total_wind_kw": round(sum(r["actual_kw"] for r in asset_scores.values()), 2),
            },
            "evidence": [
                {"metric": "avg_pr", "value": round(avg_pr, 4)},
                {"metric": "underperforming_count", "value": len(underperforming)},
            ],
            "warnings": [f"WT underperformance: {underperforming}"] if underperforming else [],
            "next_actions": ["anomaly_detection"],
        }
