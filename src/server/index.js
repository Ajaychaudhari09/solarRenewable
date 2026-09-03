import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDBStatus } from './db.js';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import assetsRouter from './routes/assets.js';
import weatherRouter from './routes/weather.js';
import generationRouter from './routes/generation.js';
import maintenanceRouter from './routes/maintenance.js';
import dashboardRouter from './routes/dashboard.js';
import auditRouter from './routes/audit.js';
import agentsRouter from './routes/agents.js';
import copilotRouter from './routes/copilot.js';
import marketplaceRouter from './routes/marketplace.js';
import graniteService from './services/graniteService.js';
import agentOrchestrator from './agents/agentOrchestrator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middlewares ──
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/health')) {
      console.log(`[${req.method}] ${req.path} → ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

const healthHandler = (req, res) => {
  res.json({
    status: 'ok',
    app: 'GridPulse AI — Renewable Energy Intelligence Platform',
    version: '2.0.0',
    port: PORT,
    database: getDBStatus(),
    graniteAvailable: Boolean(graniteService.apiKey),
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ── Mount API Routes ──
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/generation', generationRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit', auditRouter);

// ── Backwards-Compatible Endpoints for existing components ──
app.get('/api/granite-status', (req, res) => {
  res.json({
    available: Boolean(graniteService.apiKey),
    model: graniteService.modelId,
    provider: 'IBM watsonx.ai',
  });
});

app.get('/api/grid', async (req, res) => {
  const status = agentOrchestrator.getStatus();
  const gridMetrics = status.agents.grid.metrics || {};
  const currentMW = gridMetrics.currentExportMW || 13.8;
  const currentKW = Math.round(currentMW * 1000);
  const limitKW = 50000;
  res.json({
    integration: {
      total_generation_kw: currentKW,
      export_kw: currentKW,
      available_capacity_kw: Math.max(0, limitKW - currentKW),
      curtailment_kw: 0,
      curtailment_percent: 0,
      status: 'optimal',
    },
    risk: {
      risk_level: 'low',
      curtailment_probability: 0.04,
      bottleneck_substation: 'GETCO Kutch 66kV Substation',
    },
    storage: {
      bess_state_of_charge: 76.5,
      capacity_kwh: 10000,
      mode: 'standby',
      action: 'Optimal dispatch under Gujarat SLDC parameters',
    },
    balance: {
      solar_kw: Math.round((gridMetrics.solarOutputMW || 3.9) * 1000),
      wind_kw: Math.round((gridMetrics.windOutputMW || 9.9) * 1000),
      complementarity_index: 0.88,
    },
  });
});

app.use('/api/agents', agentsRouter);
app.use('/api/copilot', copilotRouter);
app.use('/api/marketplace', marketplaceRouter);

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({ error: 'Internal server error: ' + err.message });
});

// ── Start Server ──
async function start() {
  console.log('\n========================================');
  console.log('⚡ GRIDPULSE AI — EXPRESS API SERVER');
  console.log('   Kutch & Banaskantha Renewable Parks');
  console.log('========================================\n');

  await connectDB(2);

  app.listen(PORT, () => {
    console.log(`\n🚀 [Server Ready] Express API listening on http://localhost:${PORT}`);
    console.log(`📋 [Health Check] http://localhost:${PORT}/health`);
    console.log(`🔐 [Auth API]    http://localhost:${PORT}/api/auth`);
    console.log(`🏭 [Assets API]  http://localhost:${PORT}/api/assets`);
    console.log(`🌤️ [Weather API] http://localhost:${PORT}/api/weather/all\n`);
  });
}

start();

export default app;
