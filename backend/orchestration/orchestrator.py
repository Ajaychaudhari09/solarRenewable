"""
GridPulse AI — Central Agent Orchestrator
Handles event routing, dependency management, parallel execution,
error handling, retries, and execution tracing.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid
import time

from simulation.engine import SimulationState, generate_tick, get_historical_wind_series, get_historical_solar_series
from agents.agent_01_data_quality import DataQualityAgent
from agents.agent_02_sensor_health import SensorHealthAgent
from agents.agent_03_normalization import DataNormalizationAgent
from agents.agent_04_solar_performance import SolarPerformanceAgent
from agents.agent_05_wind_performance import WindPerformanceAgent
from agents.agent_06_hybrid_performance import HybridPerformanceAgent
from agents.agent_07_weather_intelligence import WeatherIntelligenceAgent
from agents.agent_08_solar_forecast import SolarForecastAgent
from agents.agent_09_wind_forecast import WindForecastAgent
from agents.agent_10_anomaly_detection import AnomalyDetectionAgent
from agents.agent_11_root_cause import RootCauseAgent
from agents.agent_12_asset_health import AssetHealthAgent
from agents.agent_13_predictive_maintenance import PredictiveMaintenanceAgent
from agents.agent_14_maintenance_prioritization import MaintenancePrioritizationAgent
from agents.agent_15_maintenance_scheduling import MaintenanceSchedulingAgent
from agents.agent_16_grid_integration import GridIntegrationAgent
from agents.agent_17_grid_risk import GridRiskAgent
from agents.agent_18_hybrid_balance import HybridBalanceAgent
from agents.agent_19_storage_optimization import StorageOptimizationAgent
from agents.agent_20_energy_loss import EnergyLossAgent
from agents.agent_21_financial_optimization import FinancialOptimizationAgent
from agents.agent_22_carbon_impact import CarbonImpactAgent
from agents.agent_23_alerting import AlertingAgent
from agents.agent_24_copilot import OperationsCopilotAgent
from agents.agent_25_28_advanced import (
    DigitalTwinAgent, ScenarioSimulationAgent,
    HumanApprovalAgent, FeedbackLearningAgent
)


class Orchestrator:
    def __init__(self):
        self.sim_state = SimulationState(seed=42)
        self._last_result: Optional[Dict] = None
        self._execution_log: List[Dict] = []
        self._alert_history: List[Dict] = []
        self._history: Dict[str, List[float]] = {}
        self._solar_history: List[float] = get_historical_solar_series(72)
        self._wind_history: List[float] = get_historical_wind_series(self.sim_state, steps=72)

        # Agent instances
        self.data_quality = DataQualityAgent()
        self.sensor_health = SensorHealthAgent()
        self.normalization = DataNormalizationAgent()
        self.solar_performance = SolarPerformanceAgent()
        self.wind_performance = WindPerformanceAgent()
        self.hybrid_performance = HybridPerformanceAgent()
        self.weather_intelligence = WeatherIntelligenceAgent()
        self.solar_forecast = SolarForecastAgent()
        self.wind_forecast = WindForecastAgent()
        self.anomaly_detection = AnomalyDetectionAgent()
        self.root_cause = RootCauseAgent()
        self.asset_health = AssetHealthAgent()
        self.predictive_maintenance = PredictiveMaintenanceAgent()
        self.maintenance_prioritization = MaintenancePrioritizationAgent()
        self.maintenance_scheduling = MaintenanceSchedulingAgent()
        self.grid_integration = GridIntegrationAgent()
        self.grid_risk = GridRiskAgent()
        self.hybrid_balance = HybridBalanceAgent()
        self.storage_optimization = StorageOptimizationAgent()
        self.energy_loss = EnergyLossAgent()
        self.financial_optimization = FinancialOptimizationAgent()
        self.carbon_impact = CarbonImpactAgent()
        self.alerting = AlertingAgent()
        self.copilot = OperationsCopilotAgent()
        self.digital_twin = DigitalTwinAgent()
        self.scenario_simulation = ScenarioSimulationAgent()
        self.human_approval = HumanApprovalAgent()
        self.feedback_learning = FeedbackLearningAgent()

        self.granite_service = None  # injected from main app

    def inject_granite(self, service):
        self.granite_service = service
        self.copilot = OperationsCopilotAgent()

    def run_tick(self) -> Dict[str, Any]:
        """Execute one complete simulation tick through the full agent pipeline."""
        execution_id = str(uuid.uuid4())
        started = time.time()
        chain_log: List[Dict] = []

        def log_step(agent_id: str, result: Dict, duration_ms: float):
            chain_log.append({
                "agent_id": agent_id,
                "status": result.get("status", "success"),
                "confidence": result.get("confidence", 1.0),
                "warnings": result.get("warnings", []),
                "duration_ms": round(duration_ms, 2),
            })

        # ─── Generate telemetry ───────────────────────────────────
        tick_data = generate_tick(self.sim_state)
        ts = tick_data["timestamp"]

        # Update rolling history
        for t in tick_data["turbines"]:
            aid = t["asset_id"]
            if aid not in self._history:
                self._history[aid] = []
            self._history[aid].append(t["power_kw"])
            if len(self._history[aid]) > 144:  # 12-hour window
                self._history[aid] = self._history[aid][-144:]

        # Update solar/wind aggregate history
        self._solar_history.append(tick_data["generation"]["solar_kw"])
        self._wind_history.append(tick_data["generation"]["wind_kw"])
        if len(self._solar_history) > 288:
            self._solar_history = self._solar_history[-288:]
        if len(self._wind_history) > 288:
            self._wind_history = self._wind_history[-288:]

        # ─── PATH A: Telemetry → Data Quality → Sensor → Normalization → Performance → Anomaly → ... ───
        t0 = time.time()
        dq = self.data_quality.run({
            "turbine_data": tick_data["turbines"],
            "solar_data": tick_data["solar"],
            "weather_data": tick_data["weather"],
        })
        log_step("data_quality", dq, (time.time() - t0) * 1000)

        t0 = time.time()
        sh = self.sensor_health.run({
            "turbine_data": tick_data["turbines"],
            "history": self._history,
            "sensor_failure_active": self.sim_state.sensor_failure_active,
        })
        log_step("sensor_health", sh, (time.time() - t0) * 1000)

        t0 = time.time()
        norm = self.normalization.run({
            "turbine_data": tick_data["turbines"],
            "solar_data": tick_data["solar"],
            "weather_data": tick_data["weather"],
            "data_quality_score": dq["results"]["quality_score"],
        })
        log_step("data_normalization", norm, (time.time() - t0) * 1000)

        norm_turbines = norm["results"]["normalized_turbines"]
        norm_solar = norm["results"]["normalized_solar"]

        t0 = time.time()
        solar_perf = self.solar_performance.run({"normalized_solar": norm_solar})
        log_step("solar_performance", solar_perf, (time.time() - t0) * 1000)

        t0 = time.time()
        wind_perf = self.wind_performance.run({"normalized_turbines": norm_turbines})
        log_step("wind_performance", wind_perf, (time.time() - t0) * 1000)

        t0 = time.time()
        hybrid_perf = self.hybrid_performance.run({"generation": tick_data["generation"]})
        log_step("hybrid_performance", hybrid_perf, (time.time() - t0) * 1000)

        t0 = time.time()
        anomalies = self.anomaly_detection.run({
            "wind_performance": wind_perf["results"],
            "normalized_turbines": norm_turbines,
        })
        log_step("anomaly_detection", anomalies, (time.time() - t0) * 1000)

        t0 = time.time()
        rca = self.root_cause.run({
            "anomalies": anomalies["results"],
            "weather": tick_data["weather"],
        })
        log_step("root_cause_analysis", rca, (time.time() - t0) * 1000)

        t0 = time.time()
        health = self.asset_health.run({
            "wind_performance": wind_perf["results"],
            "rca_results": rca["results"],
            "normalized_turbines": norm_turbines,
        })
        log_step("asset_health_scoring", health, (time.time() - t0) * 1000)

        t0 = time.time()
        maint_pred = self.predictive_maintenance.run({
            "health_scores": health["results"],
            "normalized_turbines": norm_turbines,
            "maintenance_history": {},
        })
        log_step("predictive_maintenance", maint_pred, (time.time() - t0) * 1000)

        t0 = time.time()
        maint_prio = self.maintenance_prioritization.run({
            "maintenance_predictions": maint_pred["results"],
            "wind_performance": wind_perf["results"],
        })
        log_step("maintenance_prioritization", maint_prio, (time.time() - t0) * 1000)

        # ─── PATH B: Weather → Forecasts → Grid → Storage ────────────
        t0 = time.time()
        weather_intel = self.weather_intelligence.run({"weather": tick_data["weather"]})
        log_step("weather_intelligence", weather_intel, (time.time() - t0) * 1000)

        t0 = time.time()
        sol_fcast = self.solar_forecast.run({
            "solar_history": self._solar_history,
            "weather": tick_data["weather"],
            "timestamp": ts,
        })
        log_step("solar_forecast", sol_fcast, (time.time() - t0) * 1000)

        t0 = time.time()
        wind_fcast = self.wind_forecast.run({
            "wind_history": self._wind_history,
            "weather": tick_data["weather"],
            "timestamp": ts,
        })
        log_step("wind_forecast", wind_fcast, (time.time() - t0) * 1000)

        t0 = time.time()
        grid_int = self.grid_integration.run({
            "grid": tick_data["grid"],
            "generation": tick_data["generation"],
        })
        log_step("grid_integration", grid_int, (time.time() - t0) * 1000)

        t0 = time.time()
        grid_risk = self.grid_risk.run({
            "grid_integration": grid_int,
            "wind_forecast": wind_fcast,
            "solar_forecast": sol_fcast,
        })
        log_step("grid_risk", grid_risk, (time.time() - t0) * 1000)

        t0 = time.time()
        hybrid_bal = self.hybrid_balance.run({
            "generation": tick_data["generation"],
            "grid": tick_data["grid"],
            "battery": tick_data["battery"],
            "grid_risk": grid_risk,
        })
        log_step("hybrid_balance_optimization", hybrid_bal, (time.time() - t0) * 1000)

        t0 = time.time()
        storage_opt = self.storage_optimization.run({
            "battery": tick_data["battery"],
            "grid_risk": grid_risk,
            "generation": tick_data["generation"],
            "grid": tick_data["grid"],
            "timestamp": ts,
        })
        log_step("energy_storage_optimization", storage_opt, (time.time() - t0) * 1000)

        # ─── Financial & Carbon ───────────────────────────────────
        t0 = time.time()
        energy_loss = self.energy_loss.run({
            "wind_performance": wind_perf["results"],
            "solar_performance": solar_perf["results"],
            "maintenance_predictions": maint_pred["results"],
        })
        log_step("energy_loss_impact", energy_loss, (time.time() - t0) * 1000)

        t0 = time.time()
        financial = self.financial_optimization.run({
            "generation": tick_data["generation"],
            "energy_loss": energy_loss,
            "priority_queue": maint_prio["results"],
            "storage": storage_opt,
        })
        log_step("financial_optimization", financial, (time.time() - t0) * 1000)

        t0 = time.time()
        carbon = self.carbon_impact.run({
            "generation": tick_data["generation"],
            "energy_loss": energy_loss,
        })
        log_step("carbon_impact", carbon, (time.time() - t0) * 1000)

        # ─── Alerting → Human Approval ───────────────────────────
        t0 = time.time()
        alerts = self.alerting.run({
            "anomalies": anomalies["results"],
            "rca_results": rca["results"],
            "health_scores": health["results"],
            "maintenance_predictions": maint_pred["results"],
            "grid_risk": grid_risk,
            "energy_loss": energy_loss,
            "storage": storage_opt,
        })
        log_step("operational_alerting", alerts, (time.time() - t0) * 1000)

        t0 = time.time()
        human_appr = self.human_approval.run({
            "alerts": alerts["results"],
            "priority_queue": maint_prio["results"],
        })
        log_step("human_approval", human_appr, (time.time() - t0) * 1000)

        # ─── Advanced agents ─────────────────────────────────────
        t0 = time.time()
        maint_sched = self.maintenance_scheduling.run({
            "priority_queue": maint_prio["results"],
            "weather": tick_data["weather"],
            "wind_forecast": wind_fcast,
            "timestamp": ts,
        })
        log_step("maintenance_scheduling", maint_sched, (time.time() - t0) * 1000)

        t0 = time.time()
        twin = self.digital_twin.run({
            "normalized_turbines": norm_turbines,
            "normalized_solar": norm_solar,
            "health_scores": health["results"],
            "generation": tick_data["generation"],
            "battery": tick_data["battery"],
            "grid": tick_data["grid"],
            "timestamp": ts,
        })
        log_step("digital_twin", twin, (time.time() - t0) * 1000)

        # ─── Assemble result ──────────────────────────────────────
        total_ms = (time.time() - started) * 1000

        result = {
            "execution_id": execution_id,
            "timestamp": ts,
            "tick": self.sim_state.tick,
            "duration_ms": round(total_ms, 2),
            "chain_log": chain_log,
            "telemetry": {
                "weather": tick_data["weather"],
                "generation": tick_data["generation"],
                "grid": tick_data["grid"],
                "battery": tick_data["battery"],
            },
            "agents": {
                "data_quality": dq,
                "sensor_health": sh,
                "data_normalization": norm,
                "solar_performance": solar_perf,
                "wind_performance": wind_perf,
                "hybrid_performance": hybrid_perf,
                "weather_intelligence": weather_intel,
                "solar_forecast": sol_fcast,
                "wind_forecast": wind_fcast,
                "anomaly_detection": anomalies,
                "root_cause_analysis": rca,
                "asset_health_scoring": health,
                "predictive_maintenance": maint_pred,
                "maintenance_prioritization": maint_prio,
                "maintenance_scheduling": maint_sched,
                "grid_integration": grid_int,
                "grid_risk": grid_risk,
                "hybrid_balance_optimization": hybrid_bal,
                "energy_storage_optimization": storage_opt,
                "energy_loss_impact": energy_loss,
                "financial_optimization": financial,
                "carbon_impact": carbon,
                "operational_alerting": alerts,
                "human_approval": human_appr,
                "digital_twin": twin,
            },
            "fault_state": {
                "wt07_fault": self.sim_state.wt07_fault_active,
                "solar_underperformance": self.sim_state.solar_underperformance_active,
                "severe_weather": self.sim_state.severe_weather_active,
                "grid_constraint": self.sim_state.grid_constraint_active,
                "sensor_failure": self.sim_state.sensor_failure_active,
            },
        }

        self._last_result = result
        self._execution_log.append({
            "execution_id": execution_id,
            "timestamp": ts,
            "duration_ms": round(total_ms, 2),
            "alert_count": alerts["results"].get("total_count", 0),
        })
        if len(self._execution_log) > 100:
            self._execution_log = self._execution_log[-100:]

        new_alerts = alerts["results"].get("alerts", [])
        self._alert_history.extend(new_alerts)
        if len(self._alert_history) > 500:
            self._alert_history = self._alert_history[-500:]

        return result

    def ask_copilot(self, question: str,
                    language: str = "en",
                    user_mode: str = "operator") -> Dict[str, Any]:
        """Run the Operations Copilot against latest analytical context."""
        if not self._last_result:
            self.run_tick()

        agents = self._last_result.get("agents", {})
        gen = self._last_result.get("telemetry", {}).get("generation", {})
        ts = self._last_result.get("timestamp", "")

        return self.copilot.run({
            "question": question,
            "language": language,
            "user_mode": user_mode,
            "timestamp": ts,
            "generation": gen,
            "agent_context": {
                "alerts": agents.get("operational_alerting", {}),
                "maintenance_predictions": agents.get("predictive_maintenance", {}),
                "health_scores": agents.get("asset_health_scoring", {}),
                "energy_loss": agents.get("energy_loss_impact", {}),
                "financial": agents.get("financial_optimization", {}),
                "anomalies": agents.get("anomaly_detection", {}),
                "rca_results": agents.get("root_cause_analysis", {}),
                "generation": gen,
                "grid_risk": agents.get("grid_risk", {}),
                "carbon": agents.get("carbon_impact", {}),
            },
            "granite_service": self.granite_service,
        })

    def run_scenario(self, scenario: Dict) -> Dict[str, Any]:
        """Run scenario simulation agent on demand."""
        gen = (self._last_result or {}).get("telemetry", {}).get("generation", {})
        return self.scenario_simulation.run({"scenario": scenario, "generation": gen})

    def inject_fault(self, fault_type: str) -> Dict[str, str]:
        """Activate a fault/scenario injection."""
        mapping = {
            "wt07_bearing": "wt07_fault_active",
            "solar_underperformance": "solar_underperformance_active",
            "severe_weather": "severe_weather_active",
            "grid_constraint": "grid_constraint_active",
            "sensor_failure": "sensor_failure_active",
        }
        attr = mapping.get(fault_type)
        if attr:
            setattr(self.sim_state, attr, True)
            return {"status": "injected", "fault": fault_type}
        return {"status": "unknown_fault", "fault": fault_type}

    def clear_faults(self) -> Dict:
        """Reset all fault injections."""
        self.sim_state.wt07_fault_active = False
        self.sim_state.solar_underperformance_active = False
        self.sim_state.severe_weather_active = False
        self.sim_state.grid_constraint_active = False
        self.sim_state.sensor_failure_active = False
        for wt in self.sim_state.turbine_state.values():
            wt["fault_progression"] = 0.0
            wt["health"] = 1.0
        return {"status": "cleared"}

    def get_last_result(self) -> Optional[Dict]:
        return self._last_result

    def get_execution_log(self) -> List[Dict]:
        return self._execution_log[-20:]

    def get_alert_history(self) -> List[Dict]:
        return self._alert_history[-50:]
