# GridPulse AI — Demo Guide

## Prerequisites
- Backend running on http://localhost:8000
- Frontend running on http://localhost:5173

## Starting the System

**Terminal 1 — Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Demo Scenario 1: WT-07 Bearing Failure

This is the primary hackathon demonstration.

### Steps

1. **Open the Overview tab** — note the baseline:
   - All turbines healthy (green)
   - No critical alerts
   - Normal generation

2. **Click "⚡ Inject WT-07 Bearing Fault"** in the Demo Control Center

3. **Click ↻ Tick** 4–6 times (or enable ▶ Start Live)

4. **Watch the chain unfold in real time:**
   - WT-07 vibration rises (check Agent Monitor tab)
   - Temperature rises
   - Output falls below power curve
   - Anomaly Detection fires (Z-score > 2.5)
   - Root Cause ranks: **bearing_wear** (highest confidence)
   - Health score drops from ~95 → ~40
   - Failure probability rises to >60%
   - Maintenance Priority moves WT-07 to #1
   - Energy Loss agent calculates daily INR loss
   - Critical alert generated → Human Approval required

5. **Go to Assets tab → click WT-07** — see full diagnostic:
   - Radar chart showing degraded profile
   - Live telemetry (vibration, temp, RPM, fault progression)
   - RCA hypotheses with confidence scores
   - WHAT / WHY / EVIDENCE / IMPACT / ACTION explainability panel

6. **Go to Copilot tab** and ask:
   - *"Why is WT-07 underperforming?"*
   - *"What will happen if we delay maintenance?"*
   - *"How much revenue are we losing?"*

7. **Check Agents tab** — see the full 24-agent execution chain with timing and confidence

---

## Demo Scenario 2: Severe Weather

1. Click **"🌩️ Simulate Severe Weather"**
2. Tick several times
3. Watch:
   - Cloud cover rises to 70–90%
   - Solar forecast drops
   - Wind forecast rises but with high uncertainty
   - Hybrid balance shifts toward wind-dominant
   - Grid risk updates
   - Battery storage recommendation changes

---

## Demo Scenario 3: Grid Constraint

1. Click **"⚙️ Simulate Grid Constraint"**
2. Available grid capacity drops to ~55% of normal
3. Curtailment kicks in
4. Battery optimization suggests charging the surplus

---

## Copilot Sample Questions

Try these in the Copilot tab:
- *"Which asset needs immediate attention?"*
- *"What is our current CO2 impact?"*
- *"Why is grid risk high?"*
- *"What is tomorrow's expected generation?"*
- *"Summarize today's operational status"*

---

## Reset

Click **"↺ Reset All Faults"** to return to baseline state.

---

## IBM Granite Status

Check: http://localhost:8000/api/granite-status

If `project_id` is `not_found`, the Copilot uses deterministic fallback templates (still fully functional for the demo).
