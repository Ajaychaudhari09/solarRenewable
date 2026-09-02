# GridPulse AI — Architecture

## System Overview

GridPulse AI follows a **separation of concerns** between deterministic analytics and LLM reasoning:

```
                    ┌──────────────────────────────────┐
                    │        Simulation Engine         │
                    │  (Kutch-Banaskantha Park — seed=42)│
                    └────────────┬─────────────────────┘
                                 │ telemetry
                    ┌────────────▼─────────────────────┐
                    │        Orchestrator               │
                    │   (Central Event Router)          │
                    └──────┬──────────────────┬─────────┘
                           │ PATH A           │ PATH B
              ┌────────────▼───┐        ┌────▼────────────┐
              │ Asset Pipeline  │        │ Weather Pipeline │
              │ 01 Data Quality │        │ 07 Weather Intel │
              │ 02 Sensor Health│        │ 08 Solar Forecast│
              │ 03 Normalize    │        │ 09 Wind Forecast │
              │ 04 Solar Perf   │        │ 16 Grid Integr.  │
              │ 05 Wind Perf    │        │ 17 Grid Risk     │
              │ 06 Hybrid Perf  │        │ 18 Hybrid Bal.   │
              │ 10 Anomaly Det. │        │ 19 Storage Opt.  │
              │ 11 Root Cause   │        └─────────────────┘
              │ 12 Asset Health │
              │ 13 Pred. Maint. │
              │ 14 Maint. Prio. │
              │ 20 Energy Loss  │
              │ 21 Financial    │
              │ 22 Carbon       │
              │ 23 Alerting     │
              │ 27 Human Appr.  │
              └───────┬─────────┘
                      │
              ┌───────▼──────────────────────────────────┐
              │ 24 Operations Copilot (IBM Granite)       │
              │   Structured context → NL explanation     │
              └────────────────────────────────────────────┘
```

## Key Principles

### 1. Numerical Integrity
Every number displayed in the UI traces to a formula:
- `performance_ratio = actual_kw / expected_kw`
- `deviation_pct = (actual - expected) / expected * 100`
- `failure_probability = sigmoid(-5 + 10*(1-health) + 8*fp + ...)`
- `revenue_loss = lost_kwh / 1000 * price_inr`
- `co2_avoided = gen_kwh * 0.71 kg/kWh`

### 2. LLM Boundary
IBM Granite receives a structured context block containing only verified numbers. It cannot:
- Access raw telemetry directly
- Invent sensor readings, prices, or forecasts
- Trigger any control actions

### 3. Graceful Degradation
Every agent returns a typed result even on error. Granite falls back to deterministic templates. The system operates in full demo mode without any external network access.

## Data Flow

```
5-min Tick
  → generate_tick() [simulation engine]
  → DataQualityAgent   [validate + score]
  → SensorHealthAgent  [drift/spike detection]
  → DataNormAgent      [schema normalization]
  → SolarPerfAgent     [PR = actual/expected]
  → WindPerfAgent      [power curve deviation]
  → AnomalyAgent       [Z-score per asset]
  → RCAAgent           [hypothesis ranking]
  → HealthAgent        [0-100 composite score]
  → PredMaintAgent     [logistic failure probability]
  → MaintPrioAgent     [priority × revenue ranking]
  → EnergyLossAgent    [lost kWh → INR]
  → FinancialAgent     [revenue + ROI]
  → CarbonAgent        [CO2 avoided]
  → AlertingAgent      [critical/warning/opt alerts]
  → HumanApprovalAgent [classify: auto/review/critical]
  → CopilotAgent       [IBM Granite NL synthesis]
  → DigitalTwinAgent   [park state snapshot]
```
