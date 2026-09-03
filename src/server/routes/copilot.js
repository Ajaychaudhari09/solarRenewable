import express from 'express';
import graniteService from '../services/graniteService.js';
import { getLiveWeather } from '../services/weatherService.js';
import { computePortfolioGeneration } from '../../lib/generationModel.js';
import Asset from '../models/Asset.js';
import { isDBConnected } from '../db.js';

const router = express.Router();

/**
 * POST /api/copilot/v2 and /api/copilot
 * Multilingual AI Copilot Chatbot powered by IBM Granite LLM (Rules 4 & 5)
 */
const handleChat = async (req, res) => {
  try {
    const { question, query, message, language = 'en', user_mode = 'operator', userMode = 'operator' } = req.body;
    const prompt = (question || query || message || '').trim();

    if (!prompt) {
      return res.status(400).json({ error: 'Question or query is required' });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        error: 'Not connected — check .env (MongoDB database is offline)',
        connected: false,
      });
    }

    // 1. Fetch real-time live data strictly from MongoDB and Open-Meteo API
    const assets = await Asset.find();
    const [kutchWeather, banaskanthaWeather] = await Promise.all([
      getLiveWeather('Kutch'),
      getLiveWeather('Banaskantha'),
    ]);

    const portfolio = computePortfolioGeneration(assets, kutchWeather, banaskanthaWeather);

    const liveContext = {
      weather: { kutch: kutchWeather, banaskantha: banaskanthaWeather },
      kpi: {
        totalOutputMW: portfolio.totalOutputMW,
        solarOutputMW: portfolio.totalSolarMW,
        windOutputMW: portfolio.totalWindMW,
        performanceRatio: portfolio.performanceRatio,
      },
      assets,
    };

    const mode = user_mode || userMode;
    const result = await graniteService.chat({
      question: prompt,
      language,
      userMode: mode,
      liveContext,
    });

    return res.json({
      status: 'ok',
      connected: result.connected ?? true,
      error: result.error,
      confidence: result.confidence || 0.95,
      language: result.language,
      results: {
        answer: result.answer,
        source: result.source,
        user_mode: mode,
        timestamp: new Date().toISOString(),
        relevant_assets: assets.slice(0, 3).map((a) => a.assetId),
        liveContext: {
          weather: 'Open-Meteo REST API',
          database: 'MongoDB',
        },
      },
    });
  } catch (err) {
    console.error('[Copilot Error]:', err);
    return res.status(500).json({ error: 'Failed to process AI copilot query: ' + err.message });
  }
};

router.post('/v2', handleChat);
router.post('/', handleChat);

export default router;
