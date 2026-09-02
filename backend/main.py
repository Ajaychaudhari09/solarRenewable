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
from services.india_locations import get_all_locations, get_location, location_weather_adjustment
from services.rooftop_solar import calculate_rooftop_performance, calculate_savings, get_health_summary_simple
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
    language: str = "en"      # en | hi | gu
    user_mode: str = "operator"  # operator | simple | rooftop

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


# ─────────────────────────────────────────────
# India-focused endpoints
# ─────────────────────────────────────────────

@app.get("/api/india/locations")
def india_locations():
    """Return all supported India locations."""
    return {"locations": get_all_locations()}


@app.get("/api/india/location/{location_id}")
def india_location_detail(location_id: str):
    """Return detailed info for a specific Indian location."""
    loc = get_location(location_id)
    return loc


@app.get("/api/india/weather-context")
def india_weather_context(location_id: str = "kutch"):
    """Return weather context and renewable implications for an Indian location."""
    from datetime import datetime
    loc = get_location(location_id)
    result = orchestrator.get_last_result()
    weather = result.get("telemetry", {}).get("weather", {}) if result else {}

    irr = weather.get("irradiance_wm2", 600)
    wind = weather.get("wind_speed_ms", 7.5)
    temp = weather.get("temperature_c", 32)
    cloud = weather.get("cloud_cover_pct", 15)

    month = datetime.utcnow().month
    adj = location_weather_adjustment(location_id, irr, wind, month)

    # Solar implications
    if irr > 700:
        solar_implication = "Excellent solar conditions — expect strong generation."
    elif irr > 400:
        solar_implication = "Good solar conditions — generation near expected levels."
    elif irr > 150:
        solar_implication = "Moderate solar conditions — cloud cover is reducing generation."
    else:
        solar_implication = "Poor solar conditions — significant generation reduction expected."

    # Temperature implication
    temp_loss_pct = max(0, (temp - 25) * 0.4)
    if temp_loss_pct > 8:
        temp_implication = f"High temperature is reducing panel efficiency by ~{temp_loss_pct:.1f}%."
    else:
        temp_implication = "Temperature within acceptable range for solar panels."

    # Wind implication
    if wind > 10:
        wind_implication = "Strong wind — excellent turbine generation conditions."
    elif wind > 6:
        wind_implication = "Good wind speed — turbines operating near rated conditions."
    elif wind > 3:
        wind_implication = "Moderate wind — turbines generating at partial capacity."
    else:
        wind_implication = "Low wind speed — turbines near cut-in threshold."

    return {
        "location": loc["name"],
        "data_mode": "simulated",
        "weather": weather,
        "location_context": {
            "avg_irradiance": loc["avg_irradiance_kwh_m2_day"],
            "avg_wind": loc["avg_wind_speed_ms"],
            "season": adj["season"],
            "seasonal_note": loc["seasonal_notes"].get(adj["season"], ""),
        },
        "implications": {
            "solar": solar_implication,
            "temperature": temp_implication,
            "wind": wind_implication,
            "temp_efficiency_loss_pct": round(temp_loss_pct, 1),
        },
    }


# Rooftop Solar Request model
class RooftopSolarRequest(BaseModel):
    location_id: str = "ahmedabad"
    capacity_kw: float = 5.0
    panel_type: str = "monocrystalline"
    system_age_years: float = 3.0
    tilt_deg: float = 15.0
    orientation: str = "south"
    custom_tariff_inr: Optional[float] = None


@app.post("/api/rooftop/analyze")
def analyze_rooftop(req: RooftopSolarRequest):
    """Analyze a rooftop solar installation."""
    loc = get_location(req.location_id)
    result = orchestrator.get_last_result()
    weather = result.get("telemetry", {}).get("weather", {}) if result else {}

    irr = weather.get("irradiance_wm2", 600)
    temp = weather.get("temperature_c", 32)
    tariff = req.custom_tariff_inr or loc["electricity_tariff_inr_kwh"]

    perf = calculate_rooftop_performance(
        capacity_kw=req.capacity_kw,
        location_id=req.location_id,
        irradiance_wm2=irr,
        temperature_c=temp,
        system_age_years=req.system_age_years,
        panel_type=req.panel_type,
        tilt_deg=req.tilt_deg,
        orientation=req.orientation,
    )

    savings = calculate_savings(perf["daily_kwh"], tariff)

    health = get_health_summary_simple(perf["performance_ratio"], [])

    # Annual CO2
    annual_kwh = perf["daily_kwh"] * 365
    co2_annual_kg = annual_kwh * loc["grid_emission_factor"]

    return {
        "location": loc["name"],
        "data_mode": "simulated",
        "system": {
            "capacity_kw": req.capacity_kw,
            "panel_type": req.panel_type,
            "age_years": req.system_age_years,
            "orientation": req.orientation,
        },
        "performance": perf,
        "savings": savings,
        "health": health,
        "environment": {
            "annual_kwh": round(annual_kwh, 0),
            "co2_avoided_annual_kg": round(co2_annual_kg, 0),
            "co2_avoided_annual_tonnes": round(co2_annual_kg / 1000, 2),
            "equivalent_trees": round(co2_annual_kg / 21, 0),  # ~21kg CO2 per tree per year
        },
        "recommendations": _rooftop_recommendations(perf, temp, irr, req.system_age_years),
        "assumptions": [
            "Simulated data — actual results depend on real installation conditions",
            f"Tariff: INR {tariff}/kWh",
            "Net metering credit not included",
            f"Location: {loc['name']} (avg irradiance: {loc['avg_irradiance_kwh_m2_day']} kWh/m²/day)",
        ],
    }


def _rooftop_recommendations(perf: Dict, temp: float, irr: float,
                               age_years: float) -> List[str]:
    recs = []
    if perf["performance_ratio"] < 0.75:
        recs.append("Performance is below expected — check for shading, dust, or inverter faults.")
    if temp > 38:
        recs.append(f"High panel temperature ({temp:.0f}°C) is reducing efficiency. Ensure good ventilation.")
    if irr < 300:
        recs.append("Low irradiance detected — possibly due to cloud cover or time of day.")
    if age_years > 7:
        recs.append(f"System is {age_years:.0f} years old — consider performance audit for degradation assessment.")
    if not recs:
        recs.append("System appears to be performing normally. Clean panels every 2–3 months for best results.")
    return recs


# Copilot now supports language and user mode
@app.post("/api/copilot/v2")
def ask_copilot_v2(req: CopilotRequest):
    """Ask the Operations Copilot with language and user-mode support."""
    try:
        result = orchestrator.ask_copilot(req.question, req.language, req.user_mode)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/india/renewable-stats")
def india_renewable_stats():
    """Return India/Gujarat renewable energy context statistics."""
    return {
        "data_mode": "reference",
        "source": "Ministry of New and Renewable Energy / CEA estimates",
        "india": {
            "total_renewable_gw": 190,
            "solar_gw": 85,
            "wind_gw": 46,
            "target_2030_gw": 500,
        },
        "gujarat": {
            "solar_gw": 10.5,
            "wind_gw": 10.2,
            "total_renewable_gw": 22,
            "rank_solar": "Top 3 states",
            "rank_wind": "Top 3 states",
            "notable": "Home to India's largest solar park (Dholera)",
        },
        "locations": get_all_locations(),
        "disclaimer": "Data sourced from publicly available government statistics — verify for latest figures.",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("APP_HOST", "0.0.0.0"),
        port=int(os.getenv("APP_PORT", 8000)),
        reload=True,
    )
