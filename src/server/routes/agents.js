import express from 'express';
import agentSwarm from '../agents/agentSwarm.js';

const router = express.Router();

/**
 * GET /api/agents/status
 * Returns current status of all 25 Autonomous AI Agents across all 5 tiers
 */
router.get('/status', async (req, res) => {
  try {
    const status = agentSwarm.getSwarmStatus();
    return res.json(status);
  } catch (err) {
    console.error('[GET /api/agents/status Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch agent status' });
  }
});

/**
 * POST /api/agents/run
 * Triggers an immediate execution cycle across all 25 AI Agents using live Open-Meteo & IBM Granite
 */
router.post('/run', async (req, res) => {
  try {
    const result = await agentSwarm.runFullSwarm();

    // Compatibility mapping for 5 core agents
    const coreMapping = {
      forecasting: result.agents['weather-intelligence'] || result.agents['solar-forecast'],
      performance: result.agents['solar-performance'] || result.agents['hybrid-performance'],
      maintenance: result.agents['predictive-maintenance'] || result.agents['root-cause'],
      grid: result.agents['grid-integration'] || result.agents['grid-risk'],
      dashboard: result.agents['financial-optimization'] || result.agents['carbon-impact'],
    };

    return res.json({
      message: 'All 25 AI Agents executed successfully on live Open-Meteo weather and IBM Granite reasoning.',
      ...result,
      coreAgents: coreMapping,
    });
  } catch (err) {
    console.error('[POST /api/agents/run Error]:', err);
    return res.status(500).json({ error: 'Failed to run AI swarm: ' + err.message });
  }
});

/**
 * GET /api/agents/activity
 * Real-time event stream from the 25-agent swarm
 */
router.get('/activity', async (req, res) => {
  try {
    const status = agentSwarm.getSwarmStatus();
    return res.json({
      activityStream: status.activityStream || [],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
