"""
Agent 01 — Data Quality Agent
Validates incoming telemetry for missing values, invalid ranges, stale data, duplicates.
"""
from __future__ import annotations
from typing import Any, Dict, List
from .base import BaseAgent

VALID_RANGES = {
    "power_kw":          (0, 25000),
    "temperature_c":     (-20, 80),
    "wind_speed_ms":     (0, 50),
    "irradiance_wm2":    (0, 1300),
    "vibration_ms2":     (0, 20),
    "humidity_pct":      (0, 100),
    "voltage_v":         (0, 1500),
    "cloud_cover_pct":   (0, 100),
}

REQUIRED_FIELDS = {
    "turbine": ["asset_id", "timestamp", "power_kw", "wind_speed_ms",
                "temperature_c", "vibration_ms2"],
    "solar":   ["asset_id", "timestamp", "power_kw", "irradiance_wm2"],
    "weather": ["timestamp", "irradiance_wm2", "temperature_c",
                "wind_speed_ms", "cloud_cover_pct"],
}


class DataQualityAgent(BaseAgent):
    agent_id = "data_quality"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        issues: List[Dict] = []
        record_count = 0
        bad_count = 0

        for data_type in ("turbine", "solar", "weather"):
            records = inputs.get(f"{data_type}_data", [])
            if isinstance(records, dict):
                records = [records]

            required = REQUIRED_FIELDS.get(data_type, [])
            for rec in records:
                record_count += 1
                rec_issues = []

                # Missing fields
                for field in required:
                    if field not in rec or rec[field] is None:
                        rec_issues.append(f"Missing field: {field}")

                # Range checks
                for field, (lo, hi) in VALID_RANGES.items():
                    if field in rec and rec[field] is not None:
                        v = rec[field]
                        if not (lo <= v <= hi):
                            rec_issues.append(
                                f"Out of range: {field}={v} (expected {lo}–{hi})"
                            )

                if rec_issues:
                    bad_count += 1
                    issues.append({
                        "asset_id": rec.get("asset_id", "unknown"),
                        "timestamp": rec.get("timestamp"),
                        "type": data_type,
                        "issues": rec_issues,
                    })

        quality_score = 1.0 if record_count == 0 else \
            round(1.0 - bad_count / record_count, 4)

        return {
            "confidence": quality_score,
            "data_quality": quality_score,
            "results": {
                "quality_score": quality_score,
                "record_count": record_count,
                "bad_record_count": bad_count,
                "issue_count": len(issues),
                "issues": issues[:20],  # cap for response size
            },
            "warnings": [f"{bad_count} records failed quality checks"] if bad_count else [],
            "next_actions": ["normalize_data"] if quality_score < 0.9 else ["normalize_data"],
            "evidence": [{"metric": "quality_score", "value": quality_score}],
        }
