import express from 'express';
import mongoose from 'mongoose';
import Asset from '../models/Asset.js';
import { requireAuth, requireRole, logAudit } from '../middleware/auth.js';
import { isDBConnected } from '../db.js';

const router = express.Router();

// Middleware to ensure real MongoDB is active (Rule 5)
const ensureDB = (req, res, next) => {
  if (!isDBConnected()) {
    return res.status(503).json({
      error: 'MongoDB not connected — check .env MONGODB_URI configuration',
      connected: false,
    });
  }
  next();
};

/**
 * GET /api/assets
 * Retrieves live assets strictly from MongoDB collection
 */
router.get('/', ensureDB, async (req, res) => {
  try {
    const { siteName, type } = req.query;
    const filter = {};
    if (siteName) filter.siteName = siteName;
    if (type) filter.type = type;

    const assets = await Asset.find(filter).sort({ assetId: 1 });

    return res.json({
      count: assets.length,
      assets,
      emptyState: assets.length === 0,
      source: 'MongoDB (assets collection)',
    });
  } catch (error) {
    console.error('[GET /api/assets Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch assets from MongoDB: ' + error.message });
  }
});

/**
 * GET /api/assets/:id
 * Retrieves an individual asset document from MongoDB
 */
router.get('/:id', ensureDB, async (req, res) => {
  try {
    const id = req.params.id;
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { assetId: id }] }
      : { assetId: id };

    const asset = await Asset.findOne(query);

    if (!asset) {
      return res.status(404).json({ error: `Asset "${id}" not found in MongoDB` });
    }
    return res.json({ asset, source: 'MongoDB' });
  } catch (error) {
    console.error('[GET /api/assets/:id Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch asset from MongoDB: ' + error.message });
  }
});

/**
 * POST /api/assets
 * Inserts a new asset document into MongoDB
 */
router.post('/', ensureDB, requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { assetId, siteName, type, capacityMW, lat, long, installDate, status } = req.body;

    if (!assetId || !siteName || !type || capacityMW === undefined || lat === undefined || long === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: assetId, siteName, type, capacityMW, lat, long.',
      });
    }

    if (!['Kutch', 'Banaskantha'].includes(siteName)) {
      return res.status(400).json({
        error: 'Site name must be either "Kutch" or "Banaskantha".',
      });
    }

    if (!['solar', 'wind'].includes(type)) {
      return res.status(400).json({
        error: 'Asset type must be either "solar" or "wind".',
      });
    }

    const existing = await Asset.findOne({ assetId: assetId.trim() });
    if (existing) {
      return res.status(409).json({
        error: `An asset with ID "${assetId}" already exists in MongoDB.`,
      });
    }

    const newAsset = await Asset.create({
      assetId: assetId.trim(),
      siteName,
      type,
      capacityMW: Number(capacityMW),
      lat: Number(lat),
      long: Number(long),
      installDate: installDate ? new Date(installDate) : new Date(),
      status: status || 'operational',
      createdBy: req.user.email || req.user.userId,
    });

    await logAudit(req.user.userId, 'asset_created', 'Asset', newAsset.assetId, {
      siteName,
      type,
      capacityMW,
    });

    return res.status(201).json({
      message: 'Asset created successfully in MongoDB',
      asset: newAsset,
    });
  } catch (error) {
    console.error('[POST /api/assets Error]:', error);
    return res.status(500).json({ error: 'Failed to create asset in MongoDB: ' + error.message });
  }
});

/**
 * PUT /api/assets/:id
 * Updates an asset document in MongoDB
 */
router.put('/:id', ensureDB, requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const id = req.params.id;
    const { siteName, type, capacityMW, lat, long, installDate, status } = req.body;

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { assetId: id }] }
      : { assetId: id };

    const asset = await Asset.findOne(query);
    if (!asset) return res.status(404).json({ error: 'Asset not found in MongoDB' });

    if (siteName) asset.siteName = siteName;
    if (type) asset.type = type;
    if (capacityMW !== undefined) asset.capacityMW = Number(capacityMW);
    if (lat !== undefined) asset.lat = Number(lat);
    if (long !== undefined) asset.long = Number(long);
    if (installDate) asset.installDate = new Date(installDate);
    if (status) asset.status = status;
    asset.updatedAt = new Date();
    await asset.save();

    await logAudit(req.user.userId, 'asset_updated', 'Asset', asset.assetId, {
      siteName: asset.siteName,
      type: asset.type,
      capacityMW: asset.capacityMW,
      status: asset.status,
    });

    return res.json({
      message: 'Asset updated successfully in MongoDB',
      asset,
    });
  } catch (error) {
    console.error('[PUT /api/assets/:id Error]:', error);
    return res.status(500).json({ error: 'Failed to update asset in MongoDB: ' + error.message });
  }
});

/**
 * DELETE /api/assets/:id
 * Deletes an asset document from MongoDB
 */
router.delete('/:id', ensureDB, requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const id = req.params.id;
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { assetId: id }] }
      : { assetId: id };

    const asset = await Asset.findOneAndDelete(query);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found in MongoDB' });
    }

    await logAudit(req.user.userId, 'asset_deleted', 'Asset', asset.assetId, {
      siteName: asset.siteName,
      type: asset.type,
    });

    return res.json({
      message: `Asset ${asset.assetId} deleted successfully from MongoDB`,
    });
  } catch (error) {
    console.error('[DELETE /api/assets/:id Error]:', error);
    return res.status(500).json({ error: 'Failed to delete asset from MongoDB: ' + error.message });
  }
});

export default router;
