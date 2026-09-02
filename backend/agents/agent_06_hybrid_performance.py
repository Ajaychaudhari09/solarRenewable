"""
Agent 06 — Hybrid Performance Agent
Combines solar + wind to assess hybrid park efficiency.
"""
from __future__ import annotations
from typing import Any, Dict
from .base import BaseAgent


class HybridPerformanceAgent(BaseAgent):
    agent_id = "hybrid_performance"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        gen = inputs.get("generation", {})
        total = gen.get("total_kw", 0)
        expected = gen.get("expected_kw", 0)
        wind_kw = gen.get("wind_kw", 0)
        solar_kw = gen.get("solar_kw", 0)

        hybrid_eff = total / expected if expected > 0 else 1.0
        solar_share = solar_kw / total if total > 0 else 0
        wind_share = wind_kw / total if total > 0 else 0
        deviation = (total - expected) / expected if expected > 0 else 0

        status = "optimal"
        if hybrid_eff < 0.70:
            status = "critical"
        elif hybrid_eff < 0.85:
            status = "degraded"

        return {
            "confidence": 0.95,
            "results": {
                "hybrid_efficiency": round(hybrid_eff, 4),
                "total_kw": round(total, 2),
                "expected_kw": round(expected, 2),
                "solar_kw": round(solar_kw, 2),
                "wind_kw": round(wind_kw, 2),
                "solar_share_pct": round(solar_share * 100, 1),
                "wind_share_pct": round(wind_share * 100, 1),
                "deviation_pct": round(deviation * 100, 2),
                "status": status,
            },
            "evidence": [{"metric": "hybrid_efficiency", "value": round(hybrid_eff, 4)}],
            "warnings": [f"Hybrid efficiency low: {hybrid_eff:.1%}"] if hybrid_eff < 0.85 else [],
        }
