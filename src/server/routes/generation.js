import express from 'express';
import Asset from '../models/Asset.js';
import TelemetrySnapshot from '../models/TelemetrySnapshot.js';
import { getLiveWeather } from '../services/weatherService.js';
import {
  calculateAssetOutputMW,
  computePortfolioGeneration,
  GENERATION_LABEL,
  WEATHER_LABEL,
} from '../../lib/generationModel.js';
import { requireAuth } from '../middleware/auth.js';
import { isDBConnected } from '../db.js';
import liveDataStore from '../dataStore.js';

const router = express.Router();

/**
 * GET /api/generation/live
 */
router.get('/live', requireAuth, async (req, res) => {
  try {
    const assets = isDBConnected() ? await Asset.find() : liveDataStore.assets;
    const [kutchWeather, banaskanthaWeather] = await Promise.all([
      getLiveWeather('Kutch'),
      getLiveWeather('Banaskantha'),
    ]);

    const portfolio = computePortfolioGeneration(assets, kutchWeather, banaskanthaWeather);
    const now = new Date();

    if (isDBConnected()) {
      portfolio.assetOutputs.forEach((item) => {
        const weatherSnap =
          item.siteName === 'Banaskantha' ? banaskanthaWeather.current : kutchWeather.current;
        TelemetrySnapshot.create({
          assetId: item.assetId,
          timestamp: now,
          outputMW: item.outputMW,
          source: 'weather-model',
          weatherSnapshot: weatherSnap,
        }).catch(() => {});
      });
    } else {
      portfolio.assetOutputs.forEach((item) => {
        const weatherSnap =
          item.siteName === 'Banaskantha' ? banaskanthaWeather.current : kutchWeather.current;
        liveDataStore.telemetrySnapshots.push({
          assetId: item.assetId,
          timestamp: now,
          outputMW: item.outputMW,
          source: 'weather-model',
          weatherSnapshot: weatherSnap,
        });
      });
    }

    return res.json({
      timestamp: now.toISOString(),
      ...portfolio,
      weather: {
        kutch: kutchWeather,
        banaskantha: banaskanthaWeather,
      },
    });
  } catch (error) {
    console.error('[GET /api/generation/live Error]:', error);
    return res.status(500).json({ error: 'Failed to compute generation' });
  }
});

/**
 * POST /api/generation/seed-history
 */
router.post('/seed-history', requireAuth, async (req, res) => {
  try {
    const assets = isDBConnected() ? await Asset.find() : liveDataStore.assets;
    if (assets.length === 0) {
      return res.status(400).json({ error: 'No assets found. Seed or create assets first.' });
    }

    const days = Number(req.body.days) || 30;
    const now = Date.now();
    const snapshotsToInsert = [];

    for (const asset of assets) {
      for (let d = days; d >= 0; d--) {
        const time = new Date(now - d * 24 * 3600 * 1000 + (asset.assetId.charCodeAt(0) % 6) * 3600 * 1000);
        let capacityRatio = asset.type === 'solar' ? 0.75 : 0.65;
        if (asset.status === 'degraded' && d < 10) {
          capacityRatio *= (1 - (10 - d) * 0.03);
        }

        const simulatedMW = Number((asset.capacityMW * capacityRatio * (0.92 + Math.random() * 0.16)).toFixed(2));

        snapshotsToInsert.push({
          assetId: asset.assetId,
          timestamp: time,
          outputMW: Math.min(asset.capacityMW, Math.max(0, simulatedMW)),
          source: 'weather-model',
          weatherSnapshot: {
            temperature: 31 + Math.random() * 5,
            windSpeed: asset.type === 'wind' ? 7 + Math.random() * 4 : 4,
            shortwaveRadiation: asset.type === 'solar' ? 650 + Math.random() * 200 : 500,
          },
        });
      }
    }

    if (isDBConnected()) {
      await TelemetrySnapshot.insertMany(snapshotsToInsert);
    } else {
      liveDataStore.telemetrySnapshots.push(...snapshotsToInsert);
    }

    return res.json({
      message: `Successfully seeded ${snapshotsToInsert.length} historical telemetry snapshots across ${assets.length} assets over ${days} days.`,
      count: snapshotsToInsert.length,
    });
  } catch (error) {
    console.error('[POST /api/generation/seed-history Error]:', error);
    return res.status(500).json({ error: 'Failed to seed telemetry history' });
  }
});

export default router;
