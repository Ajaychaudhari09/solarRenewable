"""
Agent 16 — Grid Integration Agent
Analyzes generation vs grid capacity, export, import, and curtailment.
"""
from __future__ import annotations
from typing import Any, Dict
from .base import BaseAgent


class GridIntegrationAgent(BaseAgent):
    agent_id = "grid_integration"

    def _run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        grid = inputs.get("grid", {})
        generation = inputs.get("generation", {})

        total_gen = generation.get("total_kw", 0)
        available = grid.get("available_capacity_kw", 18000)
        export = grid.get("export_kw", total_gen)
        curtailment = grid.get("curtailment_kw", 0)

        utilization = export / available if available > 0 else 0
        gen_to_capacity = total_gen / available if available > 0 else 0

        grid_status = "normal"
        if curtailment > 500:
            grid_status = "curtailment"
        elif gen_to_capacity > 0.92:
            grid_status = "near_capacity"

        return {
            "confidence": 0.95,
            "results": {
                "total_generation_kw": round(total_gen, 2),
                "export_kw": round(export, 2),
                "available_capacity_kw": round(available, 2),
                "curtailment_kw": round(curtailment, 2),
                "utilization_pct": round(utilization * 100, 2),
                "gen_to_capacity_pct": round(gen_to_capacity * 100, 2),
                "grid_status": grid_status,
                "frequency_hz": grid.get("grid_frequency_hz", 50.0),
                "voltage_kv": grid.get("voltage_kv", 132.0),
            },
            "evidence": [{"metric": "curtailment_kw", "value": round(curtailment, 2)}],
            "warnings": [f"Curtailment: {curtailment:.0f} kW"] if curtailment > 200 else [],
        }
