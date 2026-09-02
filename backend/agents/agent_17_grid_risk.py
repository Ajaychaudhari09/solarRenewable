"""
Agent 17 — Grid Risk Agent
Calculates overload risk, generation volatility, and curtailment risk.
"""
from __future__ import annotations
from typing import Any, Dict, List
import numpy as np
from .base import BaseAgent


class GridRiskAgent(BaseAgent):
    agent_id = "grid_risk"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        grid_analysis: Dict = inputs.get("grid_integration", {}).get("results", {})
        wind_forecast: Dict = inputs.get("wind_forecast", {}).get("results", {})
        solar_forecast: Dict = inputs.get("solar_forecast", {}).get("results", {})

        utilization = grid_analysis.get("utilization_pct", 50) / 100
        curtailment = grid_analysis.get("curtailment_kw", 0)
        available = grid_analysis.get("available_capacity_kw", 18000)

        # Forecast uncertainty
        wf_1h = wind_forecast.get("forecasts", {}).get("1h", {})
        sf_1h = solar_forecast.get("forecasts", {}).get("1h", {})
        wind_unc = wf_1h.get("uncertainty_kw", 200) if wf_1h else 200
        solar_unc = sf_1h.get("uncertainty_kw", 150) if sf_1h else 150
        total_uncertainty = wind_unc + solar_unc

        # Risk scores (0–1)
        overload_risk = min(1.0, max(0, (utilization - 0.75) / 0.25))
        curtailment_risk = min(1.0, curtailment / (available * 0.2)) if available > 0 else 0
        volatility_risk = min(1.0, total_uncertainty / 1000)

        overall_risk = round((0.4 * overload_risk + 0.35 * curtailment_risk +
                              0.25 * volatility_risk), 4)

        risk_level = ("critical" if overall_risk > 0.7 else
                      "high" if overall_risk > 0.5 else
                      "medium" if overall_risk > 0.3 else "low")

        return {
            "confidence": 0.88,
            "results": {
                "overall_risk": overall_risk,
                "risk_level": risk_level,
                "overload_risk": round(overload_risk, 4),
                "curtailment_risk": round(curtailment_risk, 4),
                "volatility_risk": round(volatility_risk, 4),
                "total_forecast_uncertainty_kw": round(total_uncertainty, 0),
            },
            "evidence": [{"metric": "overall_risk", "value": overall_risk}],
            "warnings": [f"Grid risk level: {risk_level}"] if overall_risk > 0.5 else [],
        }
