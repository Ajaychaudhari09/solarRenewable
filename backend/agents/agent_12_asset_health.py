"""
Agent 12 — Asset Health Scoring Agent
Produces a normalized 0–100 health score per asset combining multiple factors.
"""
from __future__ import annotations
from typing import Any, Dict, List
from .base import BaseAgent


class AssetHealthAgent(BaseAgent):
    agent_id = "asset_health_scoring"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        turbine_perf: Dict = inputs.get("wind_performance", {}).get("asset_performance", {})
        rca_results: List[Dict] = inputs.get("rca_results", {}).get("rca_results", [])
        turbine_data: List[Dict] = inputs.get("normalized_turbines", [])

        rca_map = {r["asset_id"]: r for r in rca_results}

        health_scores = {}
        for rec in turbine_data:
            aid = rec.get("asset_id")
            perf = turbine_perf.get(aid, {})

            # Component scores (each 0–1, higher = healthier)
            pr = perf.get("performance_ratio", 1.0)
            perf_score = min(1.0, pr)

            fp = rec.get("fault_progression", 0.0)
            fault_score = max(0.0, 1.0 - fp * 1.5)

            vib = rec.get("vibration_ms2", 0)
            vib_score = max(0.0, 1.0 - max(0, vib - 0.5) / 8)

            temp = rec.get("temperature_c", 40)
            temp_score = max(0.0, 1.0 - max(0, temp - 50) / 30)

            # RCA penalty
            rca = rca_map.get(aid)
            rca_score = 1.0
            if rca:
                top_conf = rca["hypotheses"][0]["confidence"] if rca.get("hypotheses") else 0
                rca_score = max(0.0, 1.0 - top_conf * 0.5)

            # Weighted composite
            health = (0.30 * perf_score +
                      0.25 * fault_score +
                      0.20 * vib_score +
                      0.15 * temp_score +
                      0.10 * rca_score)

            health = round(max(0.0, min(1.0, health)), 4)
            health_100 = round(health * 100, 1)

            status = "healthy" if health > 0.85 else \
                     "degraded" if health > 0.65 else \
                     "at_risk" if health > 0.40 else "critical"

            health_scores[aid] = {
                "health_score": health_100,
                "health_normalized": health,
                "status": status,
                "components": {
                    "performance": round(perf_score, 4),
                    "fault_progression": round(fault_score, 4),
                    "vibration": round(vib_score, 4),
                    "temperature": round(temp_score, 4),
                    "rca": round(rca_score, 4),
                },
            }

        critical_assets = [a for a, s in health_scores.items()
                           if s["status"] == "critical"]
        at_risk = [a for a, s in health_scores.items()
                   if s["status"] == "at_risk"]

        avg_health = (sum(v["health_score"] for v in health_scores.values()) /
                      len(health_scores)) if health_scores else 100.0

        return {
            "confidence": 0.93,
            "results": {
                "health_scores": health_scores,
                "avg_health": round(avg_health, 1),
                "critical_assets": critical_assets,
                "at_risk_assets": at_risk,
            },
            "evidence": [{"metric": "avg_health", "value": round(avg_health, 1)}],
            "warnings": [f"Critical health: {critical_assets}"] if critical_assets else [],
            "next_actions": ["predictive_maintenance"],
        }
