# GridPulse AI
### Smart Renewable Energy Intelligence Platform for Solar-Wind Hybrid Energy Parks

> **IBM Hackathon — Challenge 14:** Smart Renewable Energy (Solar-Wind Hybrid) Asset Monitoring for Kutch & Banaskantha, Gujarat, India

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

## Quick Start (Windows)

```
1. Clone repository
2. Double-click  RUN_GRIDPULSE.bat
3. Browser opens automatically at http://localhost:5173
```

To stop: double-click `STOP_GRIDPULSE.bat` or close the two terminal windows.

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

## New Features (v2)

| Feature | Description |
|---|---|
| 🇮🇳 India Location System | 5 Gujarat locations with real solar/wind data (Kutch, Banaskantha, Ahmedabad, Rajkot, Surat) |
| 🏠 Rooftop Solar Analyzer | For homeowners and businesses — capacity, savings, CO₂ impact |
| 👤 Simple Mode | Plain-language explanations for non-technical users |
| ⚙️ Operator Mode | Full technical analytics for professionals |
| 💬 Multilingual Copilot | English / Hindi / Gujarati language selection |
| 🌦️ India Weather Context | Season-aware weather explanations for renewable implications |
| 📊 India Renewable Stats | MNRE/CEA reference data on India and Gujarat renewable capacity |

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

## Challenge 14 — Part 2: Auth, User Management, Real Data & Public Access

### 1. Unified Launch with Public Tunnel (`start-all.bat`)
To start the entire full stack (MongoDB connectivity check + Express API server + React dev server + localtunnel public link):

```bat
start-all.bat
```

This script automatically:
1. Verifies that local MongoDB (`mongod` on port 27017) is reachable, or launches resilient fallback mode
2. Launches the Express API server on `http://localhost:5000`
3. Launches the Vite React frontend on `http://localhost:5173`
4. Spawns `npx localtunnel --port 5173` to expose a live public URL for remote access
5. Prints:
   - `LOCAL:` http://localhost:5173
   - `PUBLIC (share this link):` `https://<tunnel-id>.loca.lt`

> [!WARNING]
> **Public Tunnel Security Notice:**
> The public URL remains live only while the `start-all.bat` terminal window stays open. Anyone possessing this link can access the dashboard.
> By default, open registration is enabled so evaluators can create test accounts. Before sharing this link widely, **disable open self-registration** as described below!

---

### 2. Disabling Open Self-Registration (Prompt 25 Requirement)
By default, `ALLOW_OPEN_REGISTRATION=true` in `.env`, which allows anyone with the URL to register a viewer account.

To restrict account creation to **administrators only**:
1. Open `.env` in the project root.
2. Change:
   ```env
   ALLOW_OPEN_REGISTRATION=false
   ```
3. Restart the Express server (`node src/server/index.js` or restart `start-all.bat`).
4. Any non-admin attempting `POST /api/auth/register` will now be rejected with `403 Forbidden`. Only authenticated administrators will be able to register new accounts.

---

### 3. Database & Mongoose Schemas (Prompt 15)
The platform connects to local MongoDB at `mongodb://localhost:27017/gridpulse` (configured in `src/server/db.js`).

Collections & Schemas:
- **`User`**: `{ name, email (unique), passwordHash, role: "admin"|"operator"|"viewer", status: "active"|"disabled", createdAt, lastLogin }`
- **`Asset`**: `{ assetId, siteName: "Kutch"|"Banaskantha", type: "solar"|"wind", capacityMW, lat, long, installDate, status, createdBy, updatedAt }`
- **`TelemetrySnapshot`**: `{ assetId, timestamp, outputMW, source: "weather-model", weatherSnapshot }`
- **`MaintenanceTicket`**: `{ assetId, urgency: "low"|"medium"|"high"|"critical", recommendedAction, estimatedDowntimeHrs, status: "open"|"in-progress"|"resolved", createdAt, resolvedAt }`
- **`AuditLog`**: `{ userId, action, targetType, targetId, details, timestamp }`

#### Seeding Initial Administrator:
To seed the initial admin user without hardcoding credentials:
```bash
node src/server/seed.js
```
The CLI will interactively prompt for your admin name, email, and password (min 8 chars, hashed with bcrypt 10 rounds). The `Asset` collection is intentionally left empty so you can experience the onboarding flow in the UI.

---

### 4. Role-Based Access Control (RBAC) (Prompt 17)
The platform implements strict JWT role-based middleware (`src/server/middleware/auth.js`):
- **Viewer**: Read-only access to Dashboard, Asset Explorer, and Weather Forecasts.
- **Operator**: Viewer permissions + ability to acknowledge and update maintenance tickets (`open` → `in-progress` → `resolved`) and evaluate grid recommendations.
- **Admin**: Full Operator permissions + User Management panel (change user roles, soft-delete/disable accounts) + Asset CRUD (create, edit, delete solar/wind assets).
- **Audit Logging**: Every state-changing mutation writes an immutable entry into `AuditLog`.

---

### 5. Real Live Weather Integration (Open-Meteo) (Prompt 21)
Weather data is fetched directly from the Open-Meteo API using exact geographical coordinates:
- **Kutch Hybrid Park**: `23.73° N, 69.86° E`
- **Banaskantha Solar-Wind Park**: `24.17° N, 72.44° E`
- Telemetry: Ambient temperature, wind speed at 10m, global horizontal shortwave radiation (GHI), direct normal irradiance (DNI), and cloud cover.
- Responses are cached in-memory for **15 minutes**.
- If the live API fails, the application automatically falls back to cached forecasts and displays:
  `"using cached weather (last updated Xm ago)"`.
- Labeled throughout the UI as: `"Live weather: Open-Meteo"`.

---

### 6. Weather-Driven Generation Model (Prompt 22)
Generation output is computed deterministically in `src/lib/generationModel.js` based on live weather physics:
- **Solar PV**:
  $$\text{Output (MW)} = \text{capacityMW} \times \frac{\text{Shortwave Radiation}}{1000\,\text{W/m}^2} \times [1 - 0.004 \times (\text{Temp} + 15 - 25)]$$
  Clamped strictly to $[0, \text{capacityMW}]$.
- **Wind Turbines**:
  Cubic power curve:
  $$\text{Ratio} = \left(\frac{v - 3.5}{12.5 - 3.5}\right)^3 \quad \text{for } 3.5 \le v \le 12.5\,\text{m/s}$$
  Rated capacity between $12.5$ and $25.0\,\text{m/s}$. Cut-out at $25\,\text{m/s}$ (shutdown for storm safety).
- **Realistic Physical Noise**: $\pm 3\text{--}5\%$ natural turbulence variance added.
- **Snapshots**: Automatically saved to the `TelemetrySnapshot` collection with `source: "weather-model"`.
- Labeled in all charts and KPI cards as:
  `"Generation: modeled from live weather data — not live SCADA"`.

---

### 7. Historical Predictive Analytics with IBM Granite (Prompt 23)
- In `src/server/routes/maintenance.js`, the platform analyzes up to 30 days of stored `TelemetrySnapshot` records per asset.
- Computes mathematical time-series trend statistics:
  - 30-day rolling average output & capacity factor
  - Rate of decline (% drop between halves of the window)
  - Historical output variance ($\sigma$)
- **Minimum History Guard**: If an asset has less than 3 days of recorded history, prediction is safely skipped:
  `"Insufficient history yet — check back after a few days of data"`.
- When $\ge 3$ days exist, computed trend statistics are passed to **IBM Granite LLM** (`ibm/granite-13b-instruct-v2`) via watsonx.ai to synthesize an engineering root-cause narrative and prioritize corrective action.
- Generated maintenance tickets are saved directly to MongoDB so they persist across sessions.

---

### 8. Decluttered Navigation UI (Prompt 24)
- Left sidebar navigation replacing clutter:
  - ⚡ **Dashboard**: Focused KPI summary row, single 24h generation chart, Open-Meteo live weather strip, alerts panel.
  - 🏭 **Assets**: MongoDB inventory table with add/edit/delete modals and onboarding prompt.
  - 🔧 **Maintenance**: 30-day historical time-series analytics + Granite LLM diagnostic + persisted ticket workflow.
  - ⚙️ **Grid Optimization**: Real-time curtailment prevention and battery balancing.
  - 👥 **User Management**: Admin-only user role modification and account deactivation.
  - 💬 **AI Copilot**: Natural language conversational assistant powered by IBM Granite.
- Responsive design collapsing to a mobile hamburger menu below 768px.
- Strictly curated color palette: Electric Blue (`#3b82f6`) and Solar Amber (`#f59e0b`) on Slate dark theme.

---

*Built for IBM Hackathon · Challenge 14: Smart Renewable Energy (Solar-Wind Hybrid) Asset Monitoring for Kutch & Banaskantha · Powered by IBM Granite LLM + MongoDB*

