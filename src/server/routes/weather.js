import express from 'express';
import { getLiveWeather, SITES } from '../services/weatherService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/weather/all
 * Fetch live weather for both Kutch and Banaskantha
 */
router.get('/all', async (req, res) => {
  try {
    const [kutch, banaskantha] = await Promise.all([
      getLiveWeather('Kutch'),
      getLiveWeather('Banaskantha'),
    ]);

    return res.json({
      source: 'Live weather: Open-Meteo',
      sites: {
        Kutch: kutch,
        Banaskantha: banaskantha,
      },
    });
  } catch (error) {
    console.error('[GET /api/weather/all Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

/**
 * GET /api/weather/kutch
 */
router.get('/kutch', async (req, res) => {
  try {
    const data = await getLiveWeather('Kutch');
    return res.json(data);
  } catch (error) {
    console.error('[GET /api/weather/kutch Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch Kutch weather' });
  }
});

/**
 * GET /api/weather/banaskantha
 */
router.get('/banaskantha', async (req, res) => {
  try {
    const data = await getLiveWeather('Banaskantha');
    return res.json(data);
  } catch (error) {
    console.error('[GET /api/weather/banaskantha Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch Banaskantha weather' });
  }
});

export default router;
