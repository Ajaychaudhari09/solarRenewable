# GridPulse AI
### Smart Renewable Energy Intelligence Platform for Solar-Wind Hybrid Energy Parks

> **IBM Hackathon — Challenge 14:** Smart Renewable Energy (Solar-Wind Hybrid) Asset Monitoring for Kutch & Banaskantha

[![Backend: Python 3.10 + FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com)
[![Frontend: React + Vite + TypeScript](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)](https://vitejs.dev)
[![IBM Granite](https://img.shields.io/badge/LLM-IBM%20Granite-0062FF)](https://www.ibm.com/granite)
[![IBM Cloud](https://img.shields.io/badge/Cloud-IBM%20Cloud-0062FF)](https://cloud.ibm.com)

---

## Overview

GridPulse AI is a production-quality prototype of a **Renewable Energy Operations Intelligence Platform** for the Kutch and Banaskantha solar-wind hybrid parks in Gujarat, India.

It continuously reasons over 16 wind turbines and 15 solar inverters (total ~37.5 MW capacity), combining:

- **Deterministic analytics** — all critical numbers (performance ratios, failure probabilities, revenue impacts, carbon metrics) come from transparent code, never from an LLM
- **IBM Granite** — used for natural-language explanation, root-cause narrative, and operator copilot responses
- **28-agent pipeline** — each agent has a specific analytical role, runs in a structured chain, and returns a typed JSON contract

---

## Challenge Mapping

| Challenge Requirement | GridPulse Implementation |
|---|---|
| Renewable asset performance monitoring | Agents 04–06: Solar/Wind/Hybrid Performance |
| Predictive maintenance | Agents 13–15: Predictive Maintenance + Scheduling |
| Underperformance detection | Agent 10: Anomaly Detection (Z-score) |
| Weather-based generation forecasting | Agents 07–09: Weather + Solar/Wind Forecast |
| Hybrid solar-wind optimization | Agent 18: Hybrid Balance Optimization |
| Grid integration | Agents 16–17: Grid Integration + Risk |
| Operational intelligence | Agent 24: IBM Granite Operations Copilot |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   GridPulse AI                       │
├──────────────┬──────────────────┬───────────────────┤
│   Frontend   │     Backend      │   IBM Services    │
│  React + TS  │  FastAPI Python  │  Granite LLM      │
│  Tailwind    │  28 Agents       │  IAM Auth         │
│  Recharts    │  Orchestrator    │  watsonx.ai       │
│  Vite        │  Simulation Eng. │                   │
└──────────────┴──────────────────┴───────────────────┘
```

**Agent Pipeline (simplified):**
```
Telemetry Tick
  │
  ├─ PATH A: Quality → Sensor → Normalize → Performance → Anomaly → RCA
  │          → Health → Maintenance → Energy Loss → Financial → Alerts → Human Approval
  │
  └─ PATH B: Weather → Solar Forecast → Wind Forecast → Grid → Risk
             → Hybrid Balance → Storage Optimization
  │
  └─ SYNTHESIS: Digital Twin + IBM Granite Copilot
```

---

## Agent List (28 Agents)

| # | Agent | Responsibility |
|---|---|---|
| 01 | Data Quality | Validate telemetry — ranges, missing fields, bad values |
| 02 | Sensor Health | Detect drift, spikes, flatlines, comm failures |
| 03 | Data Normalization | Normalize raw readings to internal schema |
| 04 | Solar Performance | Actual vs expected solar generation |
| 05 | Wind Performance | Turbine output vs power curve |
| 06 | Hybrid Performance | Combined solar+wind efficiency |
| 07 | Weather Intelligence | Irradiance, wind, cloud, risk factors |
| 08 | Solar Forecast | 1h/6h/24h solar generation forecast |
| 09 | Wind Forecast | 1h/6h/24h wind generation forecast |
| 10 | Anomaly Detection | Z-score + threshold anomaly detection |
| 11 | Root Cause Analysis | Ranked hypotheses for anomalies |
| 12 | Asset Health Scoring | Composite 0–100 health score |
| 13 | Predictive Maintenance | Failure probability (logistic model) |
| 14 | Maintenance Prioritization | Priority queue by risk × revenue |
| 15 | Maintenance Scheduling | Optimal maintenance windows |
| 16 | Grid Integration | Generation vs grid capacity |
| 17 | Grid Risk | Overload, curtailment, volatility |
| 18 | Hybrid Balance | Solar/Wind/Storage/Grid dispatch |
| 19 | Storage Optimization | Charge/discharge with pricing |
| 20 | Energy Loss Impact | Lost MWh + revenue impact |
| 21 | Financial Optimization | Revenue, maintenance ROI |
| 22 | Carbon Impact | CO₂ avoided, sustainability metrics |
| 23 | Operational Alerting | Critical/Warning/Optimization alerts |
| 24 | Operations Copilot | IBM Granite natural-language interface |
| 25 | Digital Twin | Real-time digital park representation |
| 26 | Scenario Simulation | What-if scenario analysis |
| 27 | Human Approval | Escalation — critical items need operator sign-off |
| 28 | Feedback Learning | Records AI predictions vs actual outcomes |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Python 3.10, FastAPI, uvicorn |
| Analytics | numpy, pandas, scikit-learn |
| LLM | IBM Granite via watsonx.ai |
| Auth | IBM IAM (API key) |
| Data | In-memory simulation engine (deterministic seed=42) |
| Tests | pytest (13 tests) |

---

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- IBM Cloud API key (place in `apikey.json` at repo root, or set `GRANITE_API_KEY` in `backend/.env`)

### 1. Clone / Open Repository
```bash
git clone https://github.com/Ajaychaudhari09/solarRenewable.git
cd solarRenewable
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Copy and configure environment
cp .env.example .env
# Edit .env and set GRANITE_API_KEY and GRANITE_PROJECT_ID
```

### 3. Start Backend
```bash
cd backend
python main.py
# Or: uvicorn main:app --reload --port 8000
```
Backend available at: http://localhost:8000

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend available at: http://localhost:5173

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GRANITE_API_KEY` | IBM Cloud API key | (from apikey.json) |
| `GRANITE_PROJECT_ID` | watsonx.ai project ID | auto-discover |
| `GRANITE_URL` | watsonx.ai endpoint | us-south |
| `GRANITE_MODEL_ID` | Granite model | granite-13b-instruct-v2 |
| `APP_PORT` | Backend port | 8000 |
| `ENERGY_PRICE_INR_PER_MWH` | Energy price | 3200 |
| `GRID_EMISSIONS_FACTOR_KG_PER_KWH` | CO₂ factor | 0.71 |

---

## Running Tests

```bash
cd backend
python -m pytest tests/test_gridpulse.py -v
```

All 13 tests should pass, including the full WT-07 incident chain end-to-end test.

---

## Demo Scenarios

### Scenario 1: WT-07 Bearing Fault
1. Open dashboard → Assets tab
2. Click **"⚡ Inject WT-07 Bearing Fault"** in the Demo Control Center
3. Click **↻ Tick** several times (or enable **▶ Start Live** for auto-refresh)
4. Watch the chain: vibration ↑ → temperature ↑ → performance ↓ → anomaly detected → root cause → health score ↓ → maintenance priority ↑ → alert generated
5. Click WT-07 in the asset map to see the full diagnostic
6. Go to Copilot tab and ask: *"Why is WT-07 underperforming?"*

### Scenario 2: Severe Weather
1. Click **"🌩️ Simulate Severe Weather"**
2. Watch: cloud cover ↑ → solar forecast ↓ → wind speed ↑ (but variable) → grid risk changes → storage recommendation updates

### Scenario 3: Grid Constraint
1. Click **"⚙️ Simulate Grid Constraint"**
2. Watch: available capacity ↓ → curtailment ↑ → financial impact updates

### Reset
Click **"↺ Reset All Faults"** to return to baseline.

---

## IBM Granite Integration

GridPulse AI integrates with IBM watsonx.ai using the Granite LLM for the Operations Copilot (Agent 24).

**Architecture principle:** All numerical values shown in the UI originate from deterministic Python agents. Granite only generates natural-language explanations from a pre-constructed structured context block. It cannot invent sensor readings, prices, or forecasts.

**Fallback:** When Granite is unavailable or no `project_id` is configured, the system automatically falls back to deterministic explanation templates. The analytical platform continues to work fully.

**Check connection:**
```
GET http://localhost:8000/api/granite-status
```

---

## IBM Cloud Deployment

See [docs/deployment.md](docs/deployment.md) for full deployment guide.

Quick path for IBM Cloud Code Engine:
```bash
# Build backend container
cd backend
# Deploy to Code Engine with environment variables from .env
```

---

## API Reference

| Endpoint | Description |
|---|---|
| `GET /health` | Service health + Granite status |
| `GET /api/tick` | Run one simulation tick |
| `GET /api/dashboard` | Dashboard summary |
| `GET /api/asset/{id}` | Asset detail |
| `GET /api/alerts` | Active alerts |
| `GET /api/maintenance` | Maintenance queue + schedule |
| `GET /api/forecast` | Solar/Wind forecasts |
| `GET /api/grid` | Grid status + risk |
| `GET /api/agent-chain` | Agent execution trace |
| `GET /api/granite-status` | IBM Granite connectivity |
| `POST /api/copilot` | Operations Copilot query |
| `POST /api/inject-fault` | Demo fault injection |
| `POST /api/clear-faults` | Reset simulation |
| `POST /api/scenario` | Run what-if scenario |

---

## Limitations & Honesty

- **Simulated data** — all telemetry is synthetic (deterministic seed 42)
- **Prototype forecasts** — exponential smoothing + linear trend, not production-grade ML
- **No real turbine control** — this is a decision-support system only
- **Failure probability** — logistic model with simplified features, not a certified maintenance tool
- **No real-time field deployment** — hackathon prototype

---

## Future Roadmap

- Real SCADA/MODBUS data ingestion
- Time-series database (InfluxDB / TimescaleDB)
- Multi-site deployment (Kutch + Banaskantha separate instances)
- Certified predictive maintenance models (IEC 61400)
- Mobile operator app
- Executive reporting with automated PDF generation
- Full watsonx.ai Granite integration with fine-tuned renewable energy domain data

---

## Project Structure

```
solarRenewable/
├── backend/
│   ├── agents/              # 28 analytical agents
│   ├── orchestration/       # Central orchestrator
│   ├── services/            # IBM Granite service
│   ├── simulation/          # Telemetry simulation engine
│   ├── models/              # Pydantic data models
│   ├── tests/               # 13 pytest tests
│   └── main.py              # FastAPI application
├── frontend/
│   └── src/
│       ├── components/      # 10 React dashboard components
│       ├── App.tsx          # Main application
│       └── api.ts           # API client
├── docs/
│   ├── architecture.md
│   ├── agents.md
│   ├── demo.md
│   └── deployment.md
├── apikey.json              # IBM Cloud API key (gitignored)
├── ibm-credentials.env      # IBM credentials (gitignored)
└── README.md
```

---

*Built with IBM Bob · IBM Granite · IBM Cloud · React · FastAPI · Python*
