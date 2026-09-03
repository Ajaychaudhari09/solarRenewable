import express from 'express';
import User from '../models/User.js';
import { requireAuth, requireRole, logAudit } from '../middleware/auth.js';
import { isDBConnected } from '../db.js';

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

const ensureDB = (req, res, next) => {
  if (!isDBConnected()) {
    return res.status(503).json({ error: 'MongoDB not connected — check .env MONGODB_URI' });
  }
  next();
};

/**
 * GET /api/users
 * Queries all users from MongoDB collection
 */
router.get('/', ensureDB, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      const s = String(search).trim();
      query = {
        $or: [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
        ],
      };
    }

    const users = await User.find(query)
      .select('name email role status lastLogin createdAt')
      .sort({ createdAt: -1 });

    return res.json({ users, source: 'MongoDB (users collection)' });
  } catch (error) {
    console.error('[GET /api/users Error]:', error);
    return res.status(500).json({ error: 'Failed to fetch users from MongoDB: ' + error.message });
  }
});

/**
 * PATCH /api/users/:id/role
 * Updates a user role directly in MongoDB
 */
router.patch('/:id/role', ensureDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'operator', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found in MongoDB' });

    user.role = role;
    await user.save();

    await logAudit(req.user.userId, 'user_role_changed', 'User', id, { newRole: role });

    return res.json({
      message: `User role updated to ${role} in MongoDB`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (error) {
    console.error('[PATCH /api/users/:id/role Error]:', error);
    return res.status(500).json({ error: 'Failed to update user role in MongoDB: ' + error.message });
  }
});

/**
 * PATCH /api/users/:id/status
 * Updates user active/disabled status directly in MongoDB
 */
router.patch('/:id/status', ensureDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found in MongoDB' });

    user.status = status;
    await user.save();

    await logAudit(req.user.userId, 'user_status_changed', 'User', id, { newStatus: status });

    return res.json({
      message: `User status changed to ${status} in MongoDB`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (error) {
    console.error('[PATCH /api/users/:id/status Error]:', error);
    return res.status(500).json({ error: 'Failed to update user status in MongoDB: ' + error.message });
  }
});

export default router;
