"""
GridPulse AI — Data Models (Pydantic v2)
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
import uuid


# ─────────────────────────────────────────────
# Enumerations
# ─────────────────────────────────────────────

class AssetType(str, Enum):
    SOLAR_INVERTER = "solar_inverter"
    SOLAR_ARRAY = "solar_array"
    WIND_TURBINE = "wind_turbine"
    BATTERY = "battery"
    GRID_CONNECTION = "grid_connection"


class AssetStatus(str, Enum):
    ONLINE = "online"
    DEGRADED = "degraded"
    FAULT = "fault"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"


class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"
    OPTIMIZATION = "optimization"


class MaintenanceUrgency(str, Enum):
    IMMEDIATE = "immediate"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    SCHEDULED = "scheduled"


class StorageAction(str, Enum):
    CHARGE = "charge"
    DISCHARGE = "discharge"
    HOLD = "hold"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    AUTO = "auto"


# ─────────────────────────────────────────────
# Asset Models
# ─────────────────────────────────────────────

class SolarAsset(BaseModel):
    asset_id: str
    name: str
    asset_type: AssetType
    farm_id: str
    capacity_kw: float
    panel_count: int
    installation_date: str
    location_lat: float
    location_lon: float
    status: AssetStatus = AssetStatus.ONLINE
    health_score: float = 1.0


class WindTurbine(BaseModel):
    asset_id: str
    name: str
    farm_id: str
    rated_power_kw: float
    rotor_diameter_m: float
    hub_height_m: float
    cut_in_speed_ms: float = 3.0
    rated_speed_ms: float = 12.0
    cut_out_speed_ms: float = 25.0
    installation_date: str
    location_lat: float
    location_lon: float
    status: AssetStatus = AssetStatus.ONLINE
    health_score: float = 1.0


class Battery(BaseModel):
    asset_id: str
    name: str
    capacity_kwh: float
    max_charge_rate_kw: float
    max_discharge_rate_kw: float
    soc: float = 0.5          # state of charge 0–1
    efficiency: float = 0.92
    status: AssetStatus = AssetStatus.ONLINE


# ─────────────────────────────────────────────
# Telemetry / Readings
# ─────────────────────────────────────────────

class SensorReading(BaseModel):
    reading_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_id: str
    timestamp: datetime
    power_kw: float
    voltage_v: Optional[float] = None
    current_a: Optional[float] = None
    temperature_c: Optional[float] = None
    vibration_ms2: Optional[float] = None
    rotor_rpm: Optional[float] = None
    irradiance_wm2: Optional[float] = None
    wind_speed_ms: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    raw: Dict[str, Any] = Field(default_factory=dict)


class WeatherReading(BaseModel):
    reading_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime
    location: str
    irradiance_wm2: float
    temperature_c: float
    humidity_pct: float
    wind_speed_ms: float
    wind_direction_deg: float
    cloud_cover_pct: float
    precipitation_mm: float = 0.0
    pressure_hpa: float = 1013.0


class GenerationReading(BaseModel):
    reading_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime
    farm_id: str
    solar_kw: float
    wind_kw: float
    total_kw: float
    expected_kw: float
    battery_soc: float = 0.5


class GridReading(BaseModel):
    reading_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime
    grid_frequency_hz: float = 50.0
    voltage_kv: float
    export_kw: float
    import_kw: float
    available_capacity_kw: float
    curtailment_kw: float = 0.0


# ─────────────────────────────────────────────
# Fault / Maintenance
# ─────────────────────────────────────────────

class FaultRecord(BaseModel):
    fault_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_id: str
    timestamp: datetime
    fault_type: str
    description: str
    severity: AlertSeverity
    resolved: bool = False
    resolution_time: Optional[datetime] = None


class MaintenanceRecord(BaseModel):
    record_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_id: str
    maintenance_type: str
    scheduled_date: Optional[str] = None
    completed_date: Optional[str] = None
    technician: Optional[str] = None
    notes: str = ""
    cost_inr: float = 0.0
    downtime_hours: float = 0.0


# ─────────────────────────────────────────────
# Forecasts
# ─────────────────────────────────────────────

class ForecastPoint(BaseModel):
    timestamp: datetime
    value_kw: float
    lower_bound_kw: float
    upper_bound_kw: float
    confidence: float


class Forecast(BaseModel):
    forecast_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_id: str
    generated_at: datetime
    horizon_hours: int
    method: str
    points: List[ForecastPoint]
    mae: Optional[float] = None


# ─────────────────────────────────────────────
# Alerts / Recommendations
# ─────────────────────────────────────────────

class Alert(BaseModel):
    alert_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime
    asset_id: str
    severity: AlertSeverity
    category: str
    title: str
    description: str
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    impact: str = ""
    recommended_action: str = ""
    acknowledged: bool = False


class Recommendation(BaseModel):
    rec_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime
    asset_id: str
    category: str           # maintenance | optimization | safety | grid
    title: str
    what: str
    why: str
    evidence: List[str]
    impact: str
    action: str
    priority_score: float   # 0–100
    requires_human_approval: bool = False


class HumanApproval(BaseModel):
    approval_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime
    recommendation_id: str
    asset_id: str
    status: ApprovalStatus = ApprovalStatus.PENDING
    operator_id: Optional[str] = None
    decision_time: Optional[datetime] = None
    notes: str = ""


# ─────────────────────────────────────────────
# Carbon / Financial
# ─────────────────────────────────────────────

class CarbonMetric(BaseModel):
    period_start: datetime
    period_end: datetime
    renewable_gen_kwh: float
    avoided_emissions_kg: float
    grid_emissions_factor: float


class FinancialImpact(BaseModel):
    asset_id: str
    period_start: datetime
    period_end: datetime
    lost_energy_kwh: float
    lost_revenue_inr: float
    maintenance_cost_inr: float
    net_impact_inr: float


# ─────────────────────────────────────────────
# Agent Contract
# ─────────────────────────────────────────────

class AgentResult(BaseModel):
    agent_id: str
    run_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "success"           # success | warning | error | skipped
    confidence: float = 1.0
    data_quality: float = 1.0
    inputs: Dict[str, Any] = Field(default_factory=dict)
    results: Dict[str, Any] = Field(default_factory=dict)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    next_actions: List[str] = Field(default_factory=list)


# ─────────────────────────────────────────────
# Simulation / Scenario
# ─────────────────────────────────────────────

class ScenarioConfig(BaseModel):
    scenario_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    wind_reduction_pct: float = 0.0
    solar_reduction_pct: float = 0.0
    grid_capacity_reduction_pct: float = 0.0
    cloud_cover_boost_pct: float = 0.0
    inject_wt07_fault: bool = False
    inject_sensor_failure: bool = False


class AgentExecution(BaseModel):
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    triggered_at: datetime
    chain: List[str] = Field(default_factory=list)
    results: Dict[str, AgentResult] = Field(default_factory=dict)
    duration_ms: float = 0.0
    status: str = "running"
