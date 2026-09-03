import express from 'express';
import Asset from '../models/Asset.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import { getLiveWeather } from '../services/weatherService.js';
import {
  computePortfolioGeneration,
  GENERATION_LABEL,
  WEATHER_LABEL,
} from '../../lib/generationModel.js';
import { requireAuth } from '../middleware/auth.js';
import { isDBConnected } from '../db.js';
import liveDataStore from '../dataStore.js';

const router = express.Router();

/**
 * GET /api/dashboard/summary
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    let assets = [];
    let openTickets = [];

    if (isDBConnected()) {
      [assets, openTickets] = await Promise.all([
        Asset.find(),
        MaintenanceTicket.find({ status: { $ne: 'resolved' } }).sort({ createdAt: -1 }).limit(10),
      ]);
    } else {
      assets = liveDataStore.assets;
      openTickets = liveDataStore.maintenanceTickets.filter((t) => t.status !== 'resolved');
    }

    const [kutchWeather, banaskanthaWeather] = await Promise.all([
      getLiveWeather('Kutch'),
      getLiveWeather('Banaskantha'),
    ]);

    const portfolio = computePortfolioGeneration(assets, kutchWeather, banaskanthaWeather);

    const totalMW = portfolio.totalOutputMW;
    const carbonOffsetKgPerHour = Number((totalMW * 1000 * 0.71).toFixed(0));
    const revenueINRPerHour = Number((totalMW * 3200).toFixed(0));

    const alerts = [];
    openTickets.forEach((ticket) => {
      alerts.push({
        id: ticket._id,
        assetId: ticket.assetId,
        urgency: ticket.urgency,
        message: ticket.recommendedAction,
        source: 'AI-generated recommendation: IBM Granite LLM',
        createdAt: ticket.createdAt,
      });
    });

    assets.filter((a) => a.status === 'degraded' || a.status === 'offline').forEach((a) => {
      alerts.push({
        id: `status-${a.assetId}`,
        assetId: a.assetId,
        urgency: a.status === 'offline' ? 'critical' : 'high',
        message: `Asset ${a.assetId} is currently ${a.status.toUpperCase()} at ${a.siteName} park.`,
        source: 'Asset Performance Monitoring Agent',
        createdAt: a.updatedAt || new Date(),
      });
    });

    const hourlyLabels = (kutchWeather.hourly?.time || []).slice(0, 24).map((t) => {
      const parts = t.split('T');
      return parts.length > 1 ? parts[1].slice(0, 5) : t;
    });

    const hourlySolarRadiation = (kutchWeather.hourly?.shortwaveRadiation || []).slice(0, 24);
    const hourlyWindSpeed = (kutchWeather.hourly?.windSpeed || []).slice(0, 24);

    const hourlyChart = hourlyLabels.map((time, idx) => {
      const rad = hourlySolarRadiation[idx] || 0;
      const ws = hourlyWindSpeed[idx] || 5;

      const solarRatio = Math.min(1.0, rad / 1000);
      const windRatio =
        ws < 3.5 ? 0 : ws >= 12.5 ? 1.0 : Math.pow((ws - 3.5) / 9.0, 3);

      const capacity = portfolio.totalCapacityMW > 0 ? portfolio.totalCapacityMW : 37.5;
      const solarMW = Number((capacity * 0.55 * solarRatio * 0.9).toFixed(2));
      const windMW = Number((capacity * 0.45 * windRatio * 0.9).toFixed(2));

      return {
        time,
        solarMW,
        windMW,
        totalMW: Number((solarMW + windMW).toFixed(2)),
      };
    });

    return res.json({
      timestamp: new Date().toISOString(),
      labels: {
        weather: WEATHER_LABEL,
        generation: GENERATION_LABEL,
        ai: 'AI-generated recommendation: IBM Granite LLM',
      },
      kpi: {
        totalOutputMW: portfolio.totalOutputMW,
        totalCapacityMW: portfolio.totalCapacityMW,
        solarOutputMW: portfolio.totalSolarMW,
        windOutputMW: portfolio.totalWindMW,
        performanceRatio: portfolio.performanceRatio,
        carbonOffsetKgPerHour,
        revenueINRPerHour,
        assetCount: assets.length,
        openTicketCount: openTickets.length,
      },
      weather: {
        kutch: kutchWeather,
        banaskantha: banaskanthaWeather,
      },
      hourlyChart,
      alerts: alerts.slice(0, 8),
      emptyState: assets.length === 0,
    });
  } catch (error) {
    console.error('[GET /api/dashboard/summary Error]:', error);
    return res.status(500).json({ error: 'Failed to build dashboard summary' });
  }
});

export default router;
