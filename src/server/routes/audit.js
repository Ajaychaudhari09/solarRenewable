import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(limit);
    return res.json({ logs });
  } catch (error) {
    console.error('[GET /api/audit Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
