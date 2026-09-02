"""
Agent 23 — Operational Alerting Agent
Generates structured alerts with severity, evidence, impact, and recommended action.
"""
from __future__ import annotations
from typing import Any, Dict, List
from datetime import datetime
import uuid
from .base import BaseAgent


class AlertingAgent(BaseAgent):
    agent_id = "operational_alerting"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        anomalies: List[Dict] = inputs.get("anomalies", {}).get("anomalies", [])
        rca_results: List[Dict] = inputs.get("rca_results", {}).get("rca_results", [])
        health_scores: Dict = inputs.get("health_scores", {}).get("health_scores", {})
        maintenance_preds: Dict = inputs.get("maintenance_predictions", {}).get("predictions", {})
        grid_risk: Dict = inputs.get("grid_risk", {}).get("results", {})
        energy_loss: Dict = inputs.get("energy_loss", {}).get("results", {})
        storage: Dict = inputs.get("storage", {}).get("results", {})

        alerts: List[Dict] = []
        ts = datetime.utcnow().isoformat()

        rca_map = {r["asset_id"]: r for r in rca_results}

        # ── Turbine anomaly alerts ──
        for anomaly in anomalies:
            if not anomaly.get("is_anomalous"):
                continue
            aid = anomaly["asset_id"]
            score = anomaly["anomaly_score"]
            hs = health_scores.get(aid, {})
            maint = maintenance_preds.get(aid, {})
            rca = rca_map.get(aid, {})
            top_cause = rca.get("top_cause", "unknown")
            fp = maint.get("failure_probability", 0)

            severity = "critical" if score > 0.6 else "warning"

            daily_loss = 0.0
            for al in energy_loss.get("asset_losses", []):
                if al["asset_id"] == aid:
                    daily_loss = al.get("daily_lost_inr", 0)
                    break

            alerts.append({
                "alert_id": str(uuid.uuid4()),
                "timestamp": ts,
                "asset_id": aid,
                "severity": severity,
                "category": "asset_anomaly",
                "title": f"{'CRITICAL' if severity == 'critical' else 'WARNING'}: {aid} — Anomalous behavior detected",
                "description": (f"Asset {aid} showing anomalous readings. "
                                f"Anomaly score: {score:.2f}. "
                                f"Likely cause: {top_cause.replace('_', ' ')}."),
                "evidence": anomaly.get("flags", []),
                "impact": (f"Health score: {hs.get('health_score', 100):.1f}/100. "
                           f"Failure probability: {fp:.1%}. "
                           f"Est. daily loss: ₹{daily_loss:,.0f}."),
                "recommended_action": maint.get("recommended_action", "Inspect asset"),
                "requires_human_approval": severity == "critical",
            })

        # ── Grid risk alert ──
        grid_risk_level = grid_risk.get("risk_level", "low")
        if grid_risk_level in ("high", "critical"):
            alerts.append({
                "alert_id": str(uuid.uuid4()),
                "timestamp": ts,
                "asset_id": "GRID-01",
                "severity": "critical" if grid_risk_level == "critical" else "warning",
                "category": "grid_risk",
                "title": f"Grid risk {grid_risk_level.upper()} — Potential curtailment",
                "description": f"Grid risk level: {grid_risk_level}. "
                               f"Overload risk: {grid_risk.get('overload_risk', 0):.1%}.",
                "evidence": [{"metric": "grid_risk", "value": grid_risk.get("overall_risk", 0)}],
                "impact": f"Curtailment risk: {grid_risk.get('curtailment_risk', 0):.1%}",
                "recommended_action": "Review grid capacity and consider battery discharge",
                "requires_human_approval": grid_risk_level == "critical",
            })

        # ── Battery low SOC alert ──
        soc = storage.get("current_soc", 0.5)
        if soc < 0.15:
            alerts.append({
                "alert_id": str(uuid.uuid4()),
                "timestamp": ts,
                "asset_id": "BATT-01",
                "severity": "warning",
                "category": "storage",
                "title": f"Battery SOC critically low: {soc:.0%}",
                "description": "Battery state of charge below 15% reserve threshold.",
                "evidence": [{"metric": "soc", "value": soc}],
                "impact": "Limited grid support capacity in case of generation shortfall",
                "recommended_action": "Charge battery when generation surplus available",
                "requires_human_approval": False,
            })

        # ── Optimization opportunity ──
        if storage.get("action") == "discharge" and storage.get("is_peak_hour"):
            alerts.append({
                "alert_id": str(uuid.uuid4()),
                "timestamp": ts,
                "asset_id": "BATT-01",
                "severity": "optimization",
                "category": "optimization",
                "title": "Optimization: Peak pricing — discharge battery",
                "description": f"Current price ₹{storage.get('current_price_inr_per_mwh', 0):,}/MWh. "
                               f"Discharge potential: ₹{storage.get('discharge_potential_inr', 0):,.0f}.",
                "evidence": [{"metric": "price_inr_mwh",
                              "value": storage.get("current_price_inr_per_mwh", 0)}],
                "impact": f"Revenue opportunity: ₹{storage.get('discharge_potential_inr', 0):,.0f}",
                "recommended_action": "Initiate battery discharge",
                "requires_human_approval": False,
            })

        critical = [a for a in alerts if a["severity"] == "critical"]
        warning = [a for a in alerts if a["severity"] == "warning"]

        return {
            "confidence": 0.95,
            "results": {
                "alerts": alerts,
                "critical_count": len(critical),
                "warning_count": len(warning),
                "optimization_count": sum(1 for a in alerts if a["severity"] == "optimization"),
                "total_count": len(alerts),
            },
            "evidence": [{"metric": "total_alerts", "value": len(alerts)}],
            "warnings": [f"{len(critical)} critical alerts generated"] if critical else [],
            "next_actions": ["human_approval"] if critical else [],
        }
