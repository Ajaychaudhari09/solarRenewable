"""
GridPulse AI — FastAPI Application
Exposes all platform intelligence via REST API.
"""
from __future__ import annotations
import os
import sys
from pathlib import Path

# Ensure backend/ is on the path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from orchestration.orchestrator import Orchestrator
from services.granite_service import create_granite_service
from simulation.engine import WIND_TURBINES, SOLAR_FARMS, SOLAR_INVERTERS, BATTERY, GRID

# ─────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────

app = FastAPI(
    title="GridPulse AI — Renewable Energy Intelligence Platform",
    description="Smart monitoring, analytics, and optimization for Kutch & Banaskantha hybrid solar-wind parks",
    version="1.0.0",
)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Global state
# ─────────────────────────────────────────────

orchestrator = Orchestrator()
granite_service = create_granite_service()
if granite_service:
    orchestrator.inject_granite(granite_service)
    print("[OK] IBM Granite service connected")
else:
    print("[INFO] IBM Granite not configured - using deterministic fallback")


# ─────────────────────────────────────────────
# Request models
# ─────────────────────────────────────────────

class CopilotRequest(BaseModel):
    question: str

class FaultInjectionRequest(BaseModel):
    fault_type: str  # wt07_bearing | solar_underperformance | severe_weather | grid_constraint | sensor_failure

class ScenarioRequest(BaseModel):
    name: str = "Custom Scenario"
    description: str = ""
    wind_reduction_pct: float = 0.0
    solar_reduction_pct: float = 0.0
    grid_capacity_reduction_pct: float = 0.0
    cloud_cover_boost_pct: float = 0.0
    inject_wt07_fault: bool = False
    inject_sensor_failure: bool = False

class FeedbackRequest(BaseModel):
    asset_id: str
    prediction: Dict[str, Any]
    operator_decision: str
    actual_outcome: str


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "version": "1.0.0",
        "granite_available": granite_service is not None,
        "app_env": os.getenv("APP_ENV", "demo"),
    }


@app.get("/api/granite-status")
def granite_status():
    """Test IBM Granite connectivity and report status."""
    if not granite_service:
        return {
            "available": False,
            "reason": "No API key found. Add GRANITE_API_KEY to .env or place apikey.json in repo root.",
        }
    result = granite_service.test_connection()
    result["available"] = result.get("status") == "connected"
    return result


@app.get("/api/tick")
def get_tick():
    """Run one simulation tick and return full agent pipeline results."""
    try:
        result = orchestrator.run_tick()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/state")
def get_current_state():
    """Return the last computed state without advancing the simulation."""
    result = orchestrator.get_last_result()
    if not result:
        result = orchestrator.run_tick()
    return result


@app.get("/api/dashboard")
def get_dashboard():
    """Returns a summary suitable for the main dashboard."""
    result = orchestrator.get_last_result()
    if not result:
        result = orchestrator.run_tick()

    agents = result.get("agents", {})
    tel = result.get("telemetry", {})
    gen = tel.get("generation", {})
    grid = tel.get("grid", {})
    battery = tel.get("battery", {})
    weather = tel.get("weather", {})

    health_res = agents.get("asset_health_scoring", {}).get("results", {})
    alerts_res = agents.get("operational_alerting", {}).get("results", {})
    financial_res = agents.get("financial_optimization", {}).get("results", {})
    carbon_res = agents.get("carbon_impact", {}).get("results", {})
    maint_res = agents.get("predictive_maintenance", {}).get("results", {})
    grid_risk_res = agents.get("grid_risk", {}).get("results", {})
    hybrid_res = agents.get("hybrid_performance", {}).get("results", {})

    turbine_assets = [
        {
            "asset_id": aid,
            "health_score": hs.get("health_score", 100),
            "status": hs.get("status", "healthy"),
            "performance": agents.get("wind_performance", {}).get("results", {})
                              .get("asset_performance", {}).get(aid, {}).get("performance_ratio", 1.0),
            "failure_prob": maint_res.get("predictions", {}).get(aid, {}).get("failure_probability", 0),
            "urgency": maint_res.get("predictions", {}).get(aid, {}).get("urgency", "scheduled"),
        }
        for aid, hs in health_res.get("health_scores", {}).items()
    ]

    return {
        "timestamp": result.get("timestamp"),
        "tick": result.get("tick"),
        "fault_state": result.get("fault_state", {}),
        "overview": {
            "total_kw": round(gen.get("total_kw", 0), 2),
            "solar_kw": round(gen.get("solar_kw", 0), 2),
            "wind_kw": round(gen.get("wind_kw", 0), 2),
            "expected_kw": round(gen.get("expected_kw", 0), 2),
            "hybrid_efficiency_pct": round(hybrid_res.get("hybrid_efficiency", 1.0) * 100, 1),
            "assets_online": len([a for a in turbine_assets if a["status"] != "offline"]),
            "assets_at_risk": len([a for a in turbine_assets if a["status"] in ("at_risk", "critical", "degraded")]),
            "critical_alerts": alerts_res.get("critical_count", 0),
            "warning_alerts": alerts_res.get("warning_count", 0),
            "daily_revenue_inr": financial_res.get("daily_revenue_inr", 0),
            "daily_loss_inr": financial_res.get("daily_energy_loss_inr", 0),
            "co2_avoided_today_t": carbon_res.get("daily_avoided_co2_tonnes", 0),
            "avg_health": health_res.get("avg_health", 100),
        },
        "weather": weather,
        "grid": {
            **grid,
            "risk_level": grid_risk_res.get("risk_level", "low"),
            "risk_score": grid_risk_res.get("overall_risk", 0),
        },
        "battery": battery,
        "turbine_assets": turbine_assets,
        "alerts": alerts_res.get("alerts", [])[:10],
        "maintenance_queue": agents.get("maintenance_prioritization", {})
                               .get("results", {}).get("priority_queue", [])[:8],
    }


@app.get("/api/asset/{asset_id}")
def get_asset_detail(asset_id: str):
    """Return detailed view of a specific asset."""
    result = orchestrator.get_last_result()
    if not result:
        result = orchestrator.run_tick()

    agents = result.get("agents", {})
    norm_turbines = agents.get("data_normalization", {}).get("results", {}).get("normalized_turbines", [])
    turbine = next((t for t in norm_turbines if t.get("asset_id") == asset_id), None)

    if not turbine:
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")

    health = agents.get("asset_health_scoring", {}).get("results", {}).get("health_scores", {}).get(asset_id, {})
    wind_perf = agents.get("wind_performance", {}).get("results", {}).get("asset_performance", {}).get(asset_id, {})
    maint = agents.get("predictive_maintenance", {}).get("results", {}).get("predictions", {}).get(asset_id, {})
    anomaly = next((a for a in agents.get("anomaly_detection", {}).get("results", {}).get("anomalies", [])
                    if a.get("asset_id") == asset_id), {})
    rca = next((r for r in agents.get("root_cause_analysis", {}).get("results", {}).get("rca_results", [])
                if r.get("asset_id") == asset_id), {})
    prio = next((p for p in agents.get("maintenance_prioritization", {}).get("results", {}).get("priority_queue", [])
                 if p.get("asset_id") == asset_id), {})
    energy_loss = next((e for e in agents.get("energy_loss_impact", {}).get("results", {}).get("asset_losses", [])
                        if e.get("asset_id") == asset_id), {})

    asset_meta = next((w for w in WIND_TURBINES if w["asset_id"] == asset_id), {})

    return {
        "asset_id": asset_id,
        "timestamp": result.get("timestamp"),
        "metadata": asset_meta,
        "telemetry": turbine,
        "performance": wind_perf,
        "health": health,
        "predictive_maintenance": maint,
        "anomaly": anomaly,
        "root_cause": rca,
        "priority": prio,
        "energy_loss": energy_loss,
    }


@app.get("/api/alerts")
def get_alerts():
    result = orchestrator.get_last_result()
    if not result:
        result = orchestrator.run_tick()
    alerts = result.get("agents", {}).get("operational_alerting", {}).get("results", {})
    history = orchestrator.get_alert_history()
    return {
        "current": alerts.get("alerts", []),
        "history": history[-20:],
        "summary": {
            "critical": alerts.get("critical_count", 0),
            "warning": alerts.get("warning_count", 0),
            "optimization": alerts.get("optimization_count", 0),
        },
    }


@app.get("/api/maintenance")
def get_maintenance():
    result = orchestrator.get_last_result()
    if not result:
        result = orchestrator.run_tick()
    agents = result.get("agents", {})
    return {
        "priority_queue": agents.get("maintenance_prioritization", {}).get("results", {}).get("priority_queue", []),
        "schedule": agents.get("maintenance_scheduling", {}).get("results", {}).get("schedule", []),
        "predictions": agents.get("predictive_maintenance", {}).get("results", {}).get("predictions", {}),
    }


@app.get("/api/forecast")
def get_forecast():
    result = orchestrator.get_last_result()
    if not result:
        result = orchestrator.run_tick()
    agents = result.get("agents", {})
    return {
        "solar": agents.get("solar_forecast", {}).get("results", {}),
        "wind": agents.get("wind_forecast", {}).get("results", {}),
        "hybrid": agents.get("hybrid_performance", {}).get("results", {}),
        "weather": agents.get("weather_intelligence", {}).get("results", {}),
    }


@app.get("/api/grid")
def get_grid():
    result = orchestrator.get_last_result()
    if not result:
        result = orchestrator.run_tick()
    agents = result.get("agents", {})
    return {
        "integration": agents.get("grid_integration", {}).get("results", {}),
        "risk": agents.get("grid_risk", {}).get("results", {}),
        "storage": agents.get("energy_storage_optimization", {}).get("results", {}),
        "balance": agents.get("hybrid_balance_optimization", {}).get("results", {}),
        "raw": result.get("telemetry", {}).get("grid", {}),
    }


@app.get("/api/digital-twin")
def get_digital_twin():
    result = orchestrator.get_last_result()
    if not result:
        result = orchestrator.run_tick()
    return result.get("agents", {}).get("digital_twin", {}).get("results", {}).get("twin", {})


@app.get("/api/carbon")
def get_carbon():
    result = orchestrator.get_last_result()
    if not result:
        result = orchestrator.run_tick()
    return result.get("agents", {}).get("carbon_impact", {}).get("results", {})


@app.get("/api/agent-chain")
def get_agent_chain():
    result = orchestrator.get_last_result()
    if not result:
        result = orchestrator.run_tick()
    return {
        "chain_log": result.get("chain_log", []),
        "execution_id": result.get("execution_id"),
        "duration_ms": result.get("duration_ms"),
        "execution_history": orchestrator.get_execution_log(),
    }


@app.post("/api/copilot")
def ask_copilot(req: CopilotRequest):
    """Ask the Operations Copilot a natural-language question."""
    try:
        result = orchestrator.ask_copilot(req.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/inject-fault")
def inject_fault(req: FaultInjectionRequest):
    """Inject a fault/scenario for demonstration."""
    result = orchestrator.inject_fault(req.fault_type)
    # Run a tick immediately so the effect is visible
    tick = orchestrator.run_tick()
    return {
        "injection": result,
        "immediate_tick": {
            "timestamp": tick.get("timestamp"),
            "critical_alerts": tick.get("agents", {}).get("operational_alerting", {})
                               .get("results", {}).get("critical_count", 0),
            "anomaly_count": tick.get("agents", {}).get("anomaly_detection", {})
                             .get("results", {}).get("critical_count", 0),
        },
    }


@app.post("/api/clear-faults")
def clear_faults():
    """Reset all fault injections."""
    result = orchestrator.clear_faults()
    tick = orchestrator.run_tick()
    return {"cleared": result, "reset_tick": tick.get("timestamp")}


@app.post("/api/scenario")
def run_scenario(req: ScenarioRequest):
    """Run a what-if scenario simulation."""
    result = orchestrator.run_scenario(req.dict())
    return result


@app.post("/api/feedback")
def submit_feedback(req: FeedbackRequest):
    """Submit operator feedback for learning agent."""
    result = orchestrator.feedback_learning.run({"feedback": req.dict()})
    return result.get("results", {})


@app.get("/api/park-config")
def get_park_config():
    """Return static park configuration for the UI."""
    return {
        "wind_turbines": WIND_TURBINES,
        "solar_farms": SOLAR_FARMS,
        "solar_inverters": SOLAR_INVERTERS,
        "battery": BATTERY,
        "grid": GRID,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("APP_HOST", "0.0.0.0"),
        port=int(os.getenv("APP_PORT", 8000)),
        reload=True,
    )
