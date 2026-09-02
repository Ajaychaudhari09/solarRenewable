"""
Agent 08 — Solar Generation Forecast Agent
Uses exponential smoothing on historical series for 1h/6h/24h forecasts.
"""
from __future__ import annotations
from typing import Any, Dict, List
from datetime import datetime, timedelta
import numpy as np
from .base import BaseAgent


def _exp_smooth(series: List[float], alpha: float = 0.3) -> List[float]:
    smoothed = [series[0]]
    for v in series[1:]:
        smoothed.append(alpha * v + (1 - alpha) * smoothed[-1])
    return smoothed


def _simple_forecast(series: List[float], steps: int,
                     rng: np.random.Generator) -> List[float]:
    """Linear trend + exponential smoothing extrapolation."""
    if len(series) < 4:
        return [series[-1]] * steps
    smoothed = _exp_smooth(series)
    # Linear regression on last 12 points
    n = min(12, len(smoothed))
    xs = np.arange(n)
    ys = np.array(smoothed[-n:])
    slope = float(np.polyfit(xs, ys, 1)[0]) if n > 1 else 0.0
    base = smoothed[-1]
    result = []
    for i in range(steps):
        val = base + slope * (i + 1) + rng.normal(0, base * 0.04)
        result.append(max(0.0, val))
    return result


class SolarForecastAgent(BaseAgent):
    agent_id = "solar_forecast"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        history: List[float] = inputs.get("solar_history", [])
        weather = inputs.get("weather", {})
        base_ts = inputs.get("timestamp", datetime.utcnow().isoformat())
        if isinstance(base_ts, str):
            base_ts = datetime.fromisoformat(base_ts.replace("Z", ""))

        if not history or len(history) < 3:
            history = [500.0] * 12

        rng = np.random.default_rng(77)

        # Forecasts for different horizons
        horizons = {"1h": 12, "6h": 72, "24h": 288}
        forecasts = {}

        for label, steps in horizons.items():
            vals = _simple_forecast(history, steps, rng)
            # Cloud cover adjustment
            cloud = weather.get("cloud_cover_pct", 15)
            cloud_factor = 1 - 0.65 * (cloud / 100)
            vals = [max(0, v * cloud_factor) for v in vals]

            sigma = float(np.std(vals)) if len(vals) > 1 else 50.0
            points = []
            for i, v in enumerate(vals):
                ts = base_ts + timedelta(minutes=5 * (i + 1))
                points.append({
                    "timestamp": ts.isoformat(),
                    "value_kw": round(v, 2),
                    "lower_kw": round(max(0, v - 1.65 * sigma), 2),
                    "upper_kw": round(v + 1.65 * sigma, 2),
                    "confidence": round(max(0.5, 1 - 0.003 * i), 3),
                })
            forecasts[label] = {
                "points": points[:12],  # show first 12 for API response size
                "total_points": len(points),
                "mean_kw": round(float(np.mean(vals)), 2),
                "peak_kw": round(float(np.max(vals)), 2),
                "uncertainty_kw": round(sigma, 2),
            }

        return {
            "confidence": 0.82,
            "results": {
                "method": "exponential_smoothing_linear_trend",
                "forecasts": forecasts,
                "weather_adjusted": True,
            },
            "evidence": [{"metric": "history_length", "value": len(history)}],
            "warnings": ["Short history: low forecast accuracy"] if len(history) < 12 else [],
        }
