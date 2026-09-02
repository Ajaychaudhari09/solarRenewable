"""
Agent 10 — Anomaly Detection Agent
Detects abnormal behavior using Z-score, rolling statistics, threshold logic,
and performance deviation analysis.
"""
from __future__ import annotations
from typing import Any, Dict, List
import numpy as np
from .base import BaseAgent


def _zscore(value: float, mean: float, std: float) -> float:
    if std < 1e-6:
        return 0.0
    return abs((value - mean) / std)


class AnomalyDetectionAgent(BaseAgent):
    agent_id = "anomaly_detection"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        turbine_perf: Dict = inputs.get("wind_performance", {}).get("asset_performance", {})
        turbine_data: List[Dict] = inputs.get("normalized_turbines", [])
        anomalies: List[Dict] = []

        # Build population stats for Z-score
        all_pr = [v["performance_ratio"] for v in turbine_perf.values()
                  if "performance_ratio" in v]
        all_vib = [t.get("vibration_ms2", 0) for t in turbine_data]
        all_temp = [t.get("temperature_c", 0) for t in turbine_data]

        pr_mean = float(np.mean(all_pr)) if all_pr else 1.0
        pr_std = float(np.std(all_pr)) if all_pr else 0.1
        vib_mean = float(np.mean(all_vib)) if all_vib else 0.5
        vib_std = float(np.std(all_vib)) if all_vib else 0.2
        temp_mean = float(np.mean(all_temp)) if all_temp else 40.0
        temp_std = float(np.std(all_temp)) if all_temp else 5.0

        for rec in turbine_data:
            aid = rec.get("asset_id")
            perf = turbine_perf.get(aid, {})
            pr = perf.get("performance_ratio", 1.0)
            vib = rec.get("vibration_ms2", 0)
            temp = rec.get("temperature_c", 0)
            wind = rec.get("wind_speed_ms", 0)

            flags = []
            anomaly_score = 0.0

            # Z-score: performance ratio
            z_pr = _zscore(pr, pr_mean, pr_std)
            if z_pr > 2.0 and wind > 4.0:
                flags.append({"type": "low_performance", "z_score": round(z_pr, 2),
                              "value": pr, "threshold": pr_mean - 2 * pr_std})
                anomaly_score += min(1.0, z_pr / 3)

            # Z-score: vibration
            z_vib = _zscore(vib, vib_mean, vib_std)
            if z_vib > 2.5:
                flags.append({"type": "high_vibration", "z_score": round(z_vib, 2),
                              "value": round(vib, 3), "threshold": vib_mean + 2.5 * vib_std})
                anomaly_score += min(1.0, z_vib / 4)

            # Z-score: temperature
            z_temp = _zscore(temp, temp_mean, temp_std)
            if z_temp > 2.5:
                flags.append({"type": "high_temperature", "z_score": round(z_temp, 2),
                              "value": round(temp, 1), "threshold": temp_mean + 2.5 * temp_std})
                anomaly_score += min(1.0, z_temp / 4)

            # Fault progression (direct indicator)
            fp = rec.get("fault_progression", 0)
            if fp > 0.1:
                flags.append({"type": "fault_progression", "z_score": fp * 10,
                              "value": round(fp, 3), "threshold": 0.1})
                anomaly_score += fp

            anomaly_score = round(min(1.0, anomaly_score), 4)

            if flags:
                anomalies.append({
                    "asset_id": aid,
                    "anomaly_score": anomaly_score,
                    "flags": flags,
                    "is_anomalous": anomaly_score > 0.3,
                })

        critical = [a for a in anomalies if a["anomaly_score"] > 0.6]
        warning = [a for a in anomalies if 0.3 <= a["anomaly_score"] <= 0.6]

        return {
            "confidence": 0.91,
            "results": {
                "anomalies": anomalies,
                "critical_count": len(critical),
                "warning_count": len(warning),
                "stats": {
                    "pr_mean": round(pr_mean, 4),
                    "pr_std": round(pr_std, 4),
                    "vib_mean": round(vib_mean, 4),
                    "vib_std": round(vib_std, 4),
                },
            },
            "evidence": [
                {"metric": "anomaly_count", "value": len(anomalies)},
                {"metric": "critical_anomalies", "value": len(critical)},
            ],
            "warnings": [f"Critical anomalies on: {[a['asset_id'] for a in critical]}"] if critical else [],
            "next_actions": ["root_cause_analysis"] if anomalies else [],
        }
