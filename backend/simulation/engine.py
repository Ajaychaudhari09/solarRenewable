"""
GridPulse AI — Realistic Simulation Engine
Generates synthetic but internally consistent telemetry for the Kutch & Banaskantha energy park.
Uses deterministic seeds for reproducible hackathon demonstrations.
"""
from __future__ import annotations
import numpy as np
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

# ─────────────────────────────────────────────
# Park Configuration
# ─────────────────────────────────────────────

SOLAR_FARMS = [
    {"farm_id": "SF-01", "name": "Kutch Solar Farm Alpha", "capacity_kw": 5000,
     "lat": 23.7, "lon": 69.8, "panel_count": 15000},
    {"farm_id": "SF-02", "name": "Kutch Solar Farm Beta", "capacity_kw": 3500,
     "lat": 23.72, "lon": 69.85, "panel_count": 10500},
    {"farm_id": "SF-03", "name": "Banaskantha Solar Park", "capacity_kw": 4000,
     "lat": 24.17, "lon": 72.43, "panel_count": 12000},
]

SOLAR_INVERTERS = [
    {"asset_id": f"INV-{farm['farm_id']}-{i+1:02d}", "farm_id": farm["farm_id"],
     "capacity_kw": farm["capacity_kw"] / 5, "name": f"{farm['name']} Inverter {i+1}"}
    for farm in SOLAR_FARMS for i in range(5)
]

WIND_TURBINES = [
    {"asset_id": f"WT-{i+1:02d}", "name": f"Wind Turbine WT-{i+1:02d}",
     "farm_id": "WF-01" if i < 8 else "WF-02",
     "rated_power_kw": 2000,
     "rotor_diameter_m": 90,
     "hub_height_m": 100,
     "lat": 23.5 + i * 0.03,
     "lon": 69.6 + i * 0.02}
    for i in range(16)
]

BATTERY = {"asset_id": "BATT-01", "capacity_kwh": 10000, "max_charge_kw": 2000,
            "max_discharge_kw": 2000, "soc": 0.55, "efficiency": 0.92}

GRID = {"asset_id": "GRID-01", "max_capacity_kw": 18000, "voltage_kv": 132.0}

LOCATION = "Kutch, Gujarat"
GRID_EMISSIONS_FACTOR = 0.71  # kg CO₂ per kWh


class SimulationState:
    """Mutable simulation state — step-driven, deterministic with seed."""

    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)
        self.tick = 0
        self.timestamp = datetime(2024, 6, 15, 6, 0, 0)  # start at sunrise

        # Fault injection flags
        self.wt07_fault_active: bool = False
        self.solar_underperformance_active: bool = False
        self.severe_weather_active: bool = False
        self.grid_constraint_active: bool = False
        self.sensor_failure_active: bool = False

        # Per-turbine state
        self.turbine_state: Dict[str, Dict] = {
            wt["asset_id"]: {
                "health": 1.0,
                "vibration_base": 0.5 + self.rng.uniform(-0.1, 0.1),
                "bearing_wear": 0.0,
                "fault_progression": 0.0,
            }
            for wt in WIND_TURBINES
        }

        # Battery SOC
        self.battery_soc: float = BATTERY["soc"]

    def advance(self):
        self.tick += 1
        self.timestamp += timedelta(minutes=5)


# ─────────────────────────────────────────────
# Physics helpers
# ─────────────────────────────────────────────

def _solar_irradiance(hour: float, cloud_pct: float, rng) -> float:
    """Simplified clear-sky model + cloud attenuation."""
    if hour < 6 or hour > 19:
        return 0.0
    solar_angle = math.sin(math.pi * (hour - 6) / 13)
    clear_sky = max(0.0, 1050 * solar_angle)
    attenuation = 1 - 0.75 * (cloud_pct / 100)
    noise = rng.normal(0, 15)
    return max(0.0, clear_sky * attenuation + noise)


def _wind_speed(tick: int, rng) -> float:
    """Diurnal wind pattern with turbulence."""
    hour = (tick * 5 / 60) % 24
    base = 7.5 + 3.5 * math.sin(2 * math.pi * (hour - 14) / 24)
    turbulence = rng.normal(0, 0.8)
    return max(0.0, base + turbulence)


def _turbine_power(wind_ms: float, rated_kw: float, cut_in=3.0,
                   rated=12.0, cut_out=25.0) -> float:
    """Cubic power curve."""
    if wind_ms < cut_in or wind_ms > cut_out:
        return 0.0
    if wind_ms >= rated:
        return rated_kw
    return rated_kw * ((wind_ms - cut_in) / (rated - cut_in)) ** 3


def _solar_power(irradiance: float, capacity_kw: float, temp_c: float,
                 efficiency: float = 0.18) -> float:
    """PV power with temperature derating (-0.4% per °C above 25°C)."""
    temp_factor = 1 - 0.004 * max(0, temp_c - 25)
    return max(0.0, capacity_kw * (irradiance / 1000) * efficiency / 0.18 * temp_factor)


# ─────────────────────────────────────────────
# Main telemetry generation
# ─────────────────────────────────────────────

def generate_weather(state: SimulationState) -> Dict[str, Any]:
    hour = state.timestamp.hour + state.timestamp.minute / 60

    base_cloud = 15.0
    if state.severe_weather_active:
        cloud_cover = min(95, base_cloud + 60 + state.rng.uniform(-5, 10))
        wind_speed = _wind_speed(state.tick, state.rng) * 1.5
        precipitation = state.rng.uniform(5, 25)
        temp = 30 - state.rng.uniform(3, 8)
    else:
        cloud_cover = base_cloud + state.rng.normal(0, 8)
        cloud_cover = float(np.clip(cloud_cover, 0, 100))
        wind_speed = _wind_speed(state.tick, state.rng)
        precipitation = 0.0
        temp = 32 + 6 * math.sin(math.pi * (hour - 6) / 13) + state.rng.normal(0, 1.5)

    irradiance = _solar_irradiance(hour, cloud_cover, state.rng)

    return {
        "timestamp": state.timestamp.isoformat(),
        "location": LOCATION,
        "irradiance_wm2": round(irradiance, 1),
        "temperature_c": round(float(temp), 1),
        "humidity_pct": round(float(45 + state.rng.normal(0, 5)), 1),
        "wind_speed_ms": round(float(wind_speed), 2),
        "wind_direction_deg": round(float(220 + state.rng.normal(0, 15)), 1),
        "cloud_cover_pct": round(float(cloud_cover), 1),
        "precipitation_mm": round(float(precipitation), 2),
        "pressure_hpa": round(float(1013 + state.rng.normal(0, 3)), 1),
    }


def generate_turbine_telemetry(state: SimulationState,
                                weather: Dict) -> List[Dict[str, Any]]:
    readings = []
    wind_ms = weather["wind_speed_ms"]
    temp_ambient = weather["temperature_c"]

    for wt in WIND_TURBINES:
        wt_id = wt["asset_id"]
        ts = state.turbine_state[wt_id]

        local_wind = wind_ms + state.rng.normal(0, 0.4)
        expected_power = _turbine_power(local_wind, wt["rated_power_kw"])

        # WT-07 bearing fault injection
        is_wt07 = wt_id == "WT-07"
        fault_prog = ts["fault_progression"]

        if is_wt07 and state.wt07_fault_active:
            ts["fault_progression"] = min(1.0, ts["fault_progression"] + 0.04)
            fault_prog = ts["fault_progression"]
            degradation = 0.3 + 0.4 * fault_prog
            vibration = ts["vibration_base"] + 2.5 * fault_prog + state.rng.normal(0, 0.2)
            bearing_temp = temp_ambient + 15 + 25 * fault_prog + state.rng.normal(0, 2)
            ts["health"] = max(0.2, 1.0 - 0.8 * fault_prog)
        else:
            degradation = 0.0
            vibration = ts["vibration_base"] + state.rng.normal(0, 0.05)
            bearing_temp = temp_ambient + 12 + state.rng.normal(0, 1.5)

        # Wind reduction scenario
        if state.severe_weather_active:
            # Stronger wind but with high variability → partial power
            pass

        actual_power = expected_power * (1 - degradation) * (1 + state.rng.normal(0, 0.02))
        actual_power = max(0.0, actual_power)

        readings.append({
            "asset_id": wt_id,
            "timestamp": state.timestamp.isoformat(),
            "power_kw": round(float(actual_power), 2),
            "expected_power_kw": round(float(expected_power), 2),
            "wind_speed_ms": round(float(local_wind), 2),
            "wind_direction_deg": round(float(weather["wind_direction_deg"]), 1),
            "temperature_c": round(float(bearing_temp), 1),
            "vibration_ms2": round(float(max(0, vibration)), 3),
            "rotor_rpm": round(float(max(0, 15 + local_wind * 0.8 * (1 - degradation * 0.5))), 1),
            "fault_progression": round(float(fault_prog), 3),
            "health": round(float(ts["health"]), 3),
            "farm_id": wt["farm_id"],
        })

    return readings


def generate_solar_telemetry(state: SimulationState,
                              weather: Dict) -> List[Dict[str, Any]]:
    readings = []
    irradiance = weather["irradiance_wm2"]
    temp = weather["temperature_c"]

    for inv in SOLAR_INVERTERS:
        local_irr = irradiance + state.rng.normal(0, 10)
        expected = _solar_power(local_irr, inv["capacity_kw"], temp)

        is_underperforming = (state.solar_underperformance_active
                              and inv["asset_id"] == "INV-SF-01-03")
        degrade_factor = 0.35 if is_underperforming else 0.0

        actual = expected * (1 - degrade_factor) * (1 + state.rng.normal(0, 0.015))
        actual = max(0.0, actual)

        readings.append({
            "asset_id": inv["asset_id"],
            "farm_id": inv["farm_id"],
            "timestamp": state.timestamp.isoformat(),
            "power_kw": round(float(actual), 2),
            "expected_power_kw": round(float(expected), 2),
            "irradiance_wm2": round(float(max(0, local_irr)), 1),
            "temperature_c": round(float(temp), 1),
            "voltage_v": round(float(600 + state.rng.normal(0, 5)), 1),
            "current_a": round(float(actual / 600) if actual > 0 else 0, 2),
            "is_underperforming": is_underperforming,
        })

    return readings


def generate_grid_reading(state: SimulationState,
                           total_gen_kw: float) -> Dict[str, Any]:
    max_cap = GRID["max_capacity_kw"]
    if state.grid_constraint_active:
        available = max_cap * 0.55
    else:
        available = max_cap * (0.85 + state.rng.normal(0, 0.05))

    curtailment = max(0.0, total_gen_kw - available)
    export = total_gen_kw - curtailment

    return {
        "timestamp": state.timestamp.isoformat(),
        "grid_frequency_hz": round(float(50.0 + state.rng.normal(0, 0.05)), 3),
        "voltage_kv": round(float(GRID["voltage_kv"] + state.rng.normal(0, 1)), 1),
        "export_kw": round(float(export), 2),
        "import_kw": 0.0,
        "available_capacity_kw": round(float(available), 2),
        "curtailment_kw": round(float(curtailment), 2),
    }


def generate_battery_reading(state: SimulationState,
                               surplus_kw: float) -> Dict[str, Any]:
    dt_h = 5 / 60  # 5-minute tick in hours
    eff = BATTERY.get("efficiency", 0.92)
    max_charge = BATTERY["max_charge_kw"]
    capacity = BATTERY["capacity_kwh"]

    if surplus_kw > 100:
        charge_kw = min(surplus_kw * 0.3, max_charge)
        delta_soc = (charge_kw * dt_h * 0.92) / capacity
        state.battery_soc = min(0.98, state.battery_soc + delta_soc)
        action = "charge"
    elif surplus_kw < -200:
        discharge_kw = min(abs(surplus_kw) * 0.4, max_charge)
        delta_soc = (discharge_kw * dt_h) / capacity
        state.battery_soc = max(0.05, state.battery_soc - delta_soc)
        action = "discharge"
    else:
        action = "hold"
        charge_kw = 0.0

    return {
        "timestamp": state.timestamp.isoformat(),
        "asset_id": "BATT-01",
        "soc": round(float(state.battery_soc), 4),
        "action": action,
        "power_kw": round(float(surplus_kw * 0.3 if action == "charge" else 0), 2),
    }


def generate_tick(state: SimulationState) -> Dict[str, Any]:
    """Generate one complete simulation tick."""
    weather = generate_weather(state)

    turbine_data = generate_turbine_telemetry(state, weather)
    solar_data = generate_solar_telemetry(state, weather)

    total_wind_kw = sum(t["power_kw"] for t in turbine_data)
    total_solar_kw = sum(s["power_kw"] for s in solar_data)
    total_gen_kw = total_wind_kw + total_solar_kw

    nominal_wind = sum(t["expected_power_kw"] for t in turbine_data)
    nominal_solar = sum(s["expected_power_kw"] for s in solar_data)
    nominal_total = nominal_wind + nominal_solar

    grid = generate_grid_reading(state, total_gen_kw)
    surplus = total_gen_kw - grid["available_capacity_kw"]
    battery = generate_battery_reading(state, surplus)

    state.advance()

    return {
        "tick": state.tick,
        "timestamp": weather["timestamp"],
        "weather": weather,
        "turbines": turbine_data,
        "solar": solar_data,
        "generation": {
            "total_kw": round(total_gen_kw, 2),
            "wind_kw": round(total_wind_kw, 2),
            "solar_kw": round(total_solar_kw, 2),
            "expected_kw": round(nominal_total, 2),
            "wind_expected_kw": round(nominal_wind, 2),
            "solar_expected_kw": round(nominal_solar, 2),
        },
        "grid": grid,
        "battery": battery,
    }


def get_historical_wind_series(state: SimulationState,
                                asset_id: str = "WT-07",
                                steps: int = 72) -> List[float]:
    """Return a synthetic historical power series for forecasting."""
    rng = np.random.default_rng(999)
    base_speed = 7.5
    series = []
    for i in range(steps):
        ws = base_speed + 3.5 * math.sin(2 * math.pi * i / 72) + rng.normal(0, 0.8)
        ws = max(0.0, ws)
        p = _turbine_power(ws, 2000)
        series.append(round(p * (1 + rng.normal(0, 0.02)), 2))
    return series


def get_historical_solar_series(steps: int = 72) -> List[float]:
    rng = np.random.default_rng(123)
    series = []
    for i in range(steps):
        hour = (6 + i * 5 / 60) % 24
        irr = _solar_irradiance(hour, 15, rng)
        p = _solar_power(irr, 1000, 32)
        series.append(round(p, 2))
    return series
