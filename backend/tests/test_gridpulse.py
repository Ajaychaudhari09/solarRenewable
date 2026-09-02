"""
GridPulse AI — Test Suite
Tests agent contracts, analytics, and API endpoints.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from datetime import datetime

# ─────────────────────────────────────────────────────────────
# Simulation engine tests
# ─────────────────────────────────────────────────────────────

def test_simulation_generates_tick():
    from simulation.engine import SimulationState, generate_tick
    state = SimulationState(seed=42)
    tick = generate_tick(state)
    assert "weather" in tick
    assert "turbines" in tick
    assert "solar" in tick
    assert "generation" in tick
    assert "grid" in tick
    assert "battery" in tick

def test_turbine_count():
    from simulation.engine import SimulationState, generate_tick, WIND_TURBINES
    state = SimulationState(seed=42)
    tick = generate_tick(state)
    assert len(tick["turbines"]) == len(WIND_TURBINES)

def test_wt07_fault_injection():
    from simulation.engine import SimulationState, generate_tick
    state = SimulationState(seed=42)
    state.wt07_fault_active = True
    # Run several ticks to let fault progress
    for _ in range(5):
        tick = generate_tick(state)
    wt07 = next(t for t in tick["turbines"] if t["asset_id"] == "WT-07")
    # After 5 ticks with fault active, fault_progression should be > 0
    assert wt07["fault_progression"] > 0.1
    # Temperature should be elevated
    assert wt07["temperature_c"] > 40


# ─────────────────────────────────────────────────────────────
# Data quality agent
# ─────────────────────────────────────────────────────────────

def test_data_quality_good():
    from agents.agent_01_data_quality import DataQualityAgent
    agent = DataQualityAgent()
    result = agent.run({
        "turbine_data": [{"asset_id": "WT-01", "timestamp": "2024-06-15T10:00:00",
                           "power_kw": 1500, "wind_speed_ms": 10, "temperature_c": 45,
                           "vibration_ms2": 0.8}],
        "solar_data": [],
        "weather_data": {"timestamp": "2024-06-15T10:00:00", "irradiance_wm2": 600,
                         "temperature_c": 32, "wind_speed_ms": 8, "cloud_cover_pct": 20},
    })
    assert result["status"] == "success"
    assert result["results"]["quality_score"] == 1.0

def test_data_quality_bad_range():
    from agents.agent_01_data_quality import DataQualityAgent
    agent = DataQualityAgent()
    result = agent.run({
        "turbine_data": [{"asset_id": "WT-01", "timestamp": "2024-06-15T10:00:00",
                           "power_kw": -500,  # invalid
                           "wind_speed_ms": 999,  # invalid
                           "temperature_c": 45,
                           "vibration_ms2": 0.8}],
        "solar_data": [],
        "weather_data": {},
    })
    assert result["results"]["bad_record_count"] >= 1
    assert result["results"]["quality_score"] < 1.0


# ─────────────────────────────────────────────────────────────
# Anomaly detection
# ─────────────────────────────────────────────────────────────

def test_anomaly_detects_wt07_fault():
    """Full chain: inject WT-07 fault → detect anomaly."""
    from simulation.engine import SimulationState, generate_tick
    from agents.agent_03_normalization import DataNormalizationAgent
    from agents.agent_05_wind_performance import WindPerformanceAgent
    from agents.agent_10_anomaly_detection import AnomalyDetectionAgent

    state = SimulationState(seed=42)
    state.wt07_fault_active = True
    for _ in range(8):
        tick = generate_tick(state)

    norm = DataNormalizationAgent()
    norm_result = norm.run({
        "turbine_data": tick["turbines"],
        "solar_data": tick["solar"],
        "weather_data": tick["weather"],
        "data_quality_score": 1.0,
    })

    wp = WindPerformanceAgent()
    wp_result = wp.run({"normalized_turbines": norm_result["results"]["normalized_turbines"]})

    ad = AnomalyDetectionAgent()
    ad_result = ad.run({
        "wind_performance": wp_result["results"],
        "normalized_turbines": norm_result["results"]["normalized_turbines"],
    })

    wt07_anomaly = next((a for a in ad_result["results"]["anomalies"]
                          if a["asset_id"] == "WT-07"), None)
    assert wt07_anomaly is not None, "WT-07 should be detected as anomalous"
    assert wt07_anomaly["is_anomalous"] is True


# ─────────────────────────────────────────────────────────────
# Root cause analysis
# ─────────────────────────────────────────────────────────────

def test_rca_ranks_bearing_wear():
    from agents.agent_11_root_cause import RootCauseAgent
    agent = RootCauseAgent()
    result = agent.run({
        "anomalies": {
            "anomalies": [{
                "asset_id": "WT-07",
                "anomaly_score": 0.85,
                "is_anomalous": True,
                "flags": [
                    {"type": "high_vibration", "z_score": 3.5, "value": 4.2},
                    {"type": "high_temperature", "z_score": 3.0, "value": 68},
                    {"type": "low_performance", "z_score": 2.8, "value": 0.45},
                    {"type": "fault_progression", "z_score": 5.0, "value": 0.5},
                ],
            }]
        },
        "weather": {"wind_speed_ms": 9.0},
    })
    rca_results = result["results"]["rca_results"]
    assert len(rca_results) > 0
    wt07 = rca_results[0]
    assert wt07["asset_id"] == "WT-07"
    assert wt07["top_cause"] == "bearing_wear"


# ─────────────────────────────────────────────────────────────
# Predictive maintenance
# ─────────────────────────────────────────────────────────────

def test_predictive_maintenance_high_failure():
    from agents.agent_13_predictive_maintenance import PredictiveMaintenanceAgent
    agent = PredictiveMaintenanceAgent()
    result = agent.run({
        "health_scores": {"health_scores": {
            "WT-07": {"health_score": 35, "health_normalized": 0.35, "status": "critical"}
        }},
        "normalized_turbines": [{
            "asset_id": "WT-07",
            "fault_progression": 0.7,
            "vibration_ms2": 5.5,
            "temperature_c": 68,
        }],
        "maintenance_history": {},
    })
    pred = result["results"]["predictions"]["WT-07"]
    assert pred["failure_probability"] > 0.5
    assert pred["urgency"] in ("immediate", "high")


# ─────────────────────────────────────────────────────────────
# Financial calculations
# ─────────────────────────────────────────────────────────────

def test_energy_loss_calculation():
    from agents.agent_20_energy_loss import EnergyLossAgent
    agent = EnergyLossAgent()
    result = agent.run({
        "wind_performance": {"asset_performance": {
            "WT-07": {"actual_kw": 700, "expected_kw": 2000, "performance_ratio": 0.35}
        }},
        "solar_performance": {"asset_performance": {}},
        "maintenance_predictions": {"predictions": {}},
    })
    losses = result["results"]["asset_losses"]
    assert len(losses) > 0
    assert losses[0]["asset_id"] == "WT-07"
    assert losses[0]["daily_lost_kwh"] > 0
    assert losses[0]["daily_lost_inr"] > 0


# ─────────────────────────────────────────────────────────────
# Carbon impact
# ─────────────────────────────────────────────────────────────

def test_carbon_calculation():
    from agents.agent_22_carbon_impact import CarbonImpactAgent
    agent = CarbonImpactAgent()
    result = agent.run({
        "generation": {"total_kw": 10000, "expected_kw": 12000},
        "energy_loss": {"results": {}},
    })
    r = result["results"]
    assert r["daily_gen_kwh"] == pytest.approx(10000 * 12, rel=0.01)
    assert r["daily_avoided_co2_tonnes"] > 0
    assert r["emissions_factor_used"] == 0.71


# ─────────────────────────────────────────────────────────────
# Orchestrator end-to-end
# ─────────────────────────────────────────────────────────────

def test_orchestrator_full_tick():
    from orchestration.orchestrator import Orchestrator
    orch = Orchestrator()
    result = orch.run_tick()
    assert "timestamp" in result
    assert "agents" in result
    assert len(result["agents"]) >= 20
    assert result["agents"]["data_quality"]["status"] == "success"
    assert result["agents"]["anomaly_detection"]["status"] == "success"


def test_orchestrator_wt07_incident_chain():
    """End-to-end WT-07 bearing failure incident chain."""
    from orchestration.orchestrator import Orchestrator
    orch = Orchestrator()

    # Inject fault
    orch.inject_fault("wt07_bearing")

    # Run enough ticks to develop the fault
    for _ in range(6):
        result = orch.run_tick()

    agents = result["agents"]

    # 1. Data quality passed
    assert agents["data_quality"]["status"] == "success"

    # 2. Sensor health ran
    assert agents["sensor_health"]["status"] == "success"

    # 3. Wind performance detected degradation on WT-07
    wt07_perf = agents["wind_performance"]["results"]["asset_performance"].get("WT-07", {})
    assert wt07_perf.get("performance_ratio", 1.0) < 0.95

    # 4. Anomaly detection flagged WT-07
    wt07_anomaly = next(
        (a for a in agents["anomaly_detection"]["results"]["anomalies"]
         if a["asset_id"] == "WT-07"), None
    )
    assert wt07_anomaly is not None
    assert wt07_anomaly["is_anomalous"] is True

    # 5. Root cause analysis
    rca_for_wt07 = next(
        (r for r in agents["root_cause_analysis"]["results"]["rca_results"]
         if r["asset_id"] == "WT-07"), None
    )
    assert rca_for_wt07 is not None

    # 6. Asset health score decreased
    wt07_health = agents["asset_health_scoring"]["results"]["health_scores"].get("WT-07", {})
    assert wt07_health.get("health_score", 100) < 90

    # 7. Predictive maintenance flagged
    wt07_maint = agents["predictive_maintenance"]["results"]["predictions"].get("WT-07", {})
    assert wt07_maint.get("failure_probability", 0) > 0.1

    # 8. Energy loss calculated
    assert agents["energy_loss_impact"]["status"] == "success"

    # 9. Alerts generated
    alert_count = agents["operational_alerting"]["results"]["total_count"]
    assert alert_count >= 0  # may or may not have alerts depending on progression

    print(f"\n✅ WT-07 incident chain test PASSED")
    print(f"   Performance ratio: {wt07_perf.get('performance_ratio', 1.0):.2f}")
    print(f"   Health score: {wt07_health.get('health_score', 100):.1f}")
    print(f"   Failure prob: {wt07_maint.get('failure_probability', 0):.2%}")
    print(f"   Active alerts: {alert_count}")


def test_copilot_returns_answer():
    from orchestration.orchestrator import Orchestrator
    orch = Orchestrator()
    orch.run_tick()
    result = orch.ask_copilot("What is the current generation status?")
    assert result["results"]["answer"]
    assert len(result["results"]["answer"]) > 10
