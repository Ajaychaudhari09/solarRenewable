"""
Agent 24 — Operations Copilot Agent (IBM Granite)
Uses IBM Granite LLM to synthesize structured analytical results into
natural-language operator responses. Falls back to deterministic templates
when Granite is unavailable.
"""
from __future__ import annotations
from typing import Any, Dict, List
import os
from .base import BaseAgent


class OperationsCopilotAgent(BaseAgent):
    agent_id = "operations_copilot"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        question = inputs.get("question", "")
        language = inputs.get("language", "en")
        user_mode = inputs.get("user_mode", "operator")   # operator | simple | rooftop
        context = inputs.get("agent_context", {})
        granite_service = inputs.get("granite_service")

        # Build structured context from agent results
        structured = self._build_context(context)
        structured["user_mode"] = user_mode
        structured["language"] = language

        # Try Granite, fall back to deterministic
        if granite_service:
            try:
                answer = granite_service.answer(question, structured)
                source = "ibm_granite"
            except Exception as e:
                answer = self._deterministic_answer(question, structured)
                source = "deterministic_fallback"
                structured["granite_error"] = str(e)
        else:
            answer = self._deterministic_answer(question, structured)
            source = "deterministic_fallback"

        # Translate response preamble for simple mode
        if user_mode == "simple" and source == "deterministic_fallback":
            answer = self._simplify_answer(answer)

        return {
            "confidence": structured.get("confidence", 0.8),
            "results": {
                "question": question,
                "answer": answer,
                "source": source,
                "user_mode": user_mode,
                "language": language,
                "context_used": structured,
                "relevant_assets": structured.get("relevant_assets", []),
                "timestamp": inputs.get("timestamp", ""),
            },
            "evidence": structured.get("evidence", []),
            "warnings": ["Granite unavailable — using deterministic fallback"] if source == "deterministic_fallback" else [],
        }

    def _simplify_answer(self, answer: str) -> str:
        """Make operator-mode answer more readable for non-technical users."""
        # Replace jargon
        replacements = {
            "performance_ratio": "how well your system is working",
            "predictive maintenance": "preventive check-up",
            "anomaly": "unusual reading",
            "failure probability": "chance of breakdown",
            "curtailment": "grid-limited generation",
            "Z-score": "statistical deviation",
            "bearing_wear": "mechanical wear",
        }
        for term, plain in replacements.items():
            answer = answer.replace(term, plain)
        return answer

    def _build_context(self, context: Dict) -> Dict:
        alerts = context.get("alerts", {}).get("results", {}).get("alerts", [])
        maintenance = context.get("maintenance_predictions", {}).get("results", {})
        health = context.get("health_scores", {}).get("results", {})
        energy_loss = context.get("energy_loss", {}).get("results", {})
        financial = context.get("financial", {}).get("results", {})
        anomalies = context.get("anomalies", {}).get("results", {})
        rca = context.get("rca_results", {}).get("results", {})
        generation = context.get("generation", {})
        grid = context.get("grid_risk", {}).get("results", {})
        carbon = context.get("carbon", {}).get("results", {})

        critical_alerts = [a for a in alerts if a.get("severity") == "critical"]
        immediate_maint = {k: v for k, v in maintenance.get("predictions", {}).items()
                           if v.get("urgency") == "immediate"}

        return {
            "critical_alerts": critical_alerts,
            "immediate_maintenance": immediate_maint,
            "avg_health": health.get("avg_health", 100),
            "critical_assets": health.get("critical_assets", []),
            "at_risk_assets": health.get("at_risk_assets", []),
            "daily_loss_inr": energy_loss.get("daily_total_lost_inr", 0),
            "daily_revenue_inr": financial.get("daily_revenue_inr", 0),
            "anomaly_count": anomalies.get("critical_count", 0),
            "rca_results": rca.get("rca_results", []),
            "total_gen_kw": generation.get("total_kw", 0),
            "grid_risk_level": grid.get("risk_level", "low"),
            "carbon_daily_tonnes": carbon.get("daily_avoided_co2_tonnes", 0),
            "relevant_assets": (list(immediate_maint.keys()) +
                                [a.get("asset_id") for a in critical_alerts[:3]]),
            "evidence": [
                {"source": "alerting_agent", "alerts": len(alerts)},
                {"source": "health_agent", "avg_health": health.get("avg_health", 100)},
                {"source": "energy_loss_agent", "daily_loss_inr": energy_loss.get("daily_total_lost_inr", 0)},
            ],
            "confidence": 0.88,
        }

    def _deterministic_answer(self, question: str, ctx: Dict) -> str:
        q_lower = question.lower()
        critical = ctx.get("critical_assets", [])
        at_risk = ctx.get("at_risk_assets", [])
        immediate = ctx.get("immediate_maintenance", {})
        daily_loss = ctx.get("daily_loss_inr", 0)
        daily_rev = ctx.get("daily_revenue_inr", 0)
        rca_list = ctx.get("rca_results", [])
        gen = ctx.get("total_gen_kw", 0)
        grid_risk = ctx.get("grid_risk_level", "low")
        carbon = ctx.get("carbon_daily_tonnes", 0)

        # WT-07 specific
        wt07_rca = next((r for r in rca_list if r.get("asset_id") == "WT-07"), None)

        if "wt-07" in q_lower or "wt07" in q_lower:
            if wt07_rca:
                cause = wt07_rca.get("top_cause", "unknown").replace("_", " ")
                conf = wt07_rca["hypotheses"][0]["confidence"] if wt07_rca.get("hypotheses") else 0
                return (f"WT-07 is showing elevated vibration and temperature readings with "
                        f"reduced power output. Root cause analysis indicates **{cause}** "
                        f"(confidence: {conf:.0%}). "
                        f"Failure probability has increased significantly. "
                        f"Immediate inspection is recommended within 24 hours to prevent "
                        f"catastrophic failure. Current energy loss: ₹{daily_loss:,.0f}/day.")
            return ("WT-07 is currently showing normal operating conditions. "
                    "No active fault detected. Continue standard monitoring.")

        elif "underperform" in q_lower or "attention" in q_lower or "inspect" in q_lower:
            if immediate:
                assets = list(immediate.keys())[:3]
                return (f"Top assets requiring immediate attention: **{', '.join(assets)}**. "
                        f"These assets have elevated failure probability and are causing "
                        f"an estimated ₹{daily_loss:,.0f}/day in energy losses. "
                        f"Prioritize inspection in the order listed.")
            elif at_risk:
                return (f"Assets at risk: **{', '.join(at_risk[:3])}**. "
                        f"Schedule maintenance within 7–30 days.")
            return "All assets are currently within normal operational parameters."

        elif "delay" in q_lower or "nothing" in q_lower:
            if immediate:
                asset = list(immediate.keys())[0]
                pred = immediate[asset]
                days = pred.get("days_to_estimated_failure", 30)
                return (f"Delaying maintenance on **{asset}** significantly increases risk. "
                        f"Estimated failure in {days} days without intervention. "
                        f"Expected cumulative energy loss: ₹{daily_loss * days:,.0f} over {days} days. "
                        f"Early maintenance prevents catastrophic damage and reduces total cost.")
            return "No immediate maintenance is pending. Normal monitoring is sufficient."

        elif "revenue" in q_lower or "financial" in q_lower or "loss" in q_lower:
            return (f"Current daily revenue: **₹{daily_rev:,.0f}**. "
                    f"Daily energy loss due to underperformance: **₹{daily_loss:,.0f}**. "
                    f"Net daily revenue: ₹{daily_rev - daily_loss:,.0f}. "
                    f"Immediate maintenance investment is recommended to recover "
                    f"the ₹{daily_loss:,.0f}/day energy loss.")

        elif "forecast" in q_lower or "tomorrow" in q_lower or "generation" in q_lower:
            return (f"Current total generation: **{gen:,.0f} kW**. "
                    f"Forecast data is available in the Forecast Center dashboard panel. "
                    f"Carbon impact: **{carbon:.2f} tonnes CO₂ avoided today**.")

        elif "grid" in q_lower:
            return (f"Grid risk is currently **{grid_risk}**. "
                    f"Review the Grid Center for curtailment status and storage recommendations.")

        elif "carbon" in q_lower or "co2" in q_lower or "emission" in q_lower:
            return (f"Today's renewable generation is avoiding approximately "
                    f"**{carbon:.2f} tonnes of CO₂** compared to grid average emissions. "
                    f"Fixing current underperformance would avoid an additional "
                    f"{ctx.get('additional_avoided_if_fixed', 0):.2f} tonnes.")

        else:
            summary_parts = []
            if critical:
                summary_parts.append(f"{len(critical)} asset(s) in critical health: {', '.join(critical[:3])}")
            if immediate:
                summary_parts.append(f"{len(immediate)} asset(s) need immediate maintenance")
            if daily_loss > 0:
                summary_parts.append(f"Daily energy loss: ₹{daily_loss:,.0f}")
            summary_parts.append(f"Total generation: {gen:,.0f} kW")
            summary_parts.append(f"Grid risk: {grid_risk}")

            return ("**Operations Summary:**\n" +
                    "\n".join(f"• {p}" for p in summary_parts) +
                    "\n\nAsk a specific question about an asset, maintenance, revenue, "
                    "forecasts, or grid conditions for detailed analysis.")
