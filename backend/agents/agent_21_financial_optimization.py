"""
Agent 21 — Financial Optimization Agent
Optimizes operational decisions for revenue, maintenance cost, and energy loss.
"""
from __future__ import annotations
from typing import Any, Dict, List
from .base import BaseAgent

ENERGY_PRICE_INR = 3200


class FinancialOptimizationAgent(BaseAgent):
    agent_id = "financial_optimization"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        generation = inputs.get("generation", {})
        energy_loss = inputs.get("energy_loss", {}).get("results", {})
        maintenance_queue: List[Dict] = inputs.get("priority_queue", {}).get("priority_queue", [])
        storage = inputs.get("storage", {}).get("results", {})

        # Revenue from current tick (5 min = 5/60 hours)
        total_gen_kwh = generation.get("total_kw", 0) * (5 / 60)
        revenue_this_tick = total_gen_kwh / 1000 * ENERGY_PRICE_INR
        daily_revenue = generation.get("total_kw", 0) * 12 / 1000 * ENERGY_PRICE_INR

        daily_loss_inr = energy_loss.get("daily_total_lost_inr", 0)
        immediate_maint_cost = sum(
            5000 + item.get("days_to_failure", 30) * 200
            for item in maintenance_queue[:3]
            if item.get("urgency") in ("immediate", "high")
        )

        # Net financial impact
        net_daily = daily_revenue - daily_loss_inr
        maintenance_roi_days = (immediate_maint_cost / daily_loss_inr
                                if daily_loss_inr > 0 else 999)

        recommendations = []
        if maintenance_roi_days < 30 and immediate_maint_cost > 0:
            recommendations.append({
                "action": "Execute immediate maintenance",
                "reason": f"ROI break-even in {maintenance_roi_days:.0f} days vs continuous energy loss",
                "financial_impact_inr": round(immediate_maint_cost, 0),
            })

        storage_rec = storage.get("action", "hold")
        if storage_rec == "discharge" and storage.get("is_peak_hour"):
            recommendations.append({
                "action": "Discharge battery during peak hours",
                "reason": f"Peak rate ₹{storage.get('current_price_inr_per_mwh', 5500)}/MWh",
                "financial_impact_inr": round(storage.get("discharge_potential_inr", 0), 0),
            })

        return {
            "confidence": 0.87,
            "results": {
                "revenue_this_tick_inr": round(revenue_this_tick, 2),
                "daily_revenue_inr": round(daily_revenue, 0),
                "daily_energy_loss_inr": round(daily_loss_inr, 0),
                "net_daily_inr": round(net_daily, 0),
                "immediate_maintenance_cost_inr": round(immediate_maint_cost, 0),
                "maintenance_roi_days": round(maintenance_roi_days, 1),
                "financial_recommendations": recommendations,
            },
            "evidence": [
                {"metric": "daily_revenue_inr", "value": round(daily_revenue, 0)},
                {"metric": "daily_loss_inr", "value": round(daily_loss_inr, 0)},
            ],
            "warnings": [f"Daily revenue loss: ₹{daily_loss_inr:,.0f}"] if daily_loss_inr > 10000 else [],
        }
