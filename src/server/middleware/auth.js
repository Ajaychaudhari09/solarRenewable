import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gridpulse-jwt-super-secret-key-kutch-banaskantha-hybrid-2024';

/**
 * Authentication middleware: verifies JWT from Bearer Authorization header
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required. Please provide a valid Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: 'Session expired or invalid token. Please log in again.',
      });
    }

    // Attach user information to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email,
    };

    // Optional check: verify user is not disabled in DB
    try {
      const userRecord = await User.findById(decoded.userId).select('status role');
      if (userRecord) {
        if (userRecord.status === 'disabled') {
          return res.status(403).json({
            error: 'Account is disabled. Please contact an administrator.',
          });
        }
        req.user.role = userRecord.role; // sync any recent role changes
      }
    } catch (dbErr) {
      // If DB error, proceed with token claims
    }

    next();
  } catch (error) {
    console.error('[requireAuth Error]', error);
    return res.status(500).json({ error: 'Internal authentication error' });
  }
}

/**
 * Role authorization middleware: checks if req.user.role is in the allowed roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of [${roles.join(', ')}] role. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}

/**
 * Audit log helper: records any state-changing action
 */
export async function logAudit(userId, action, targetType, targetId = null, details = {}) {
  try {
    await AuditLog.create({
      userId: userId || 'anonymous',
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      details,
      timestamp: new Date(),
    });
  } catch (err) {
    console.warn(`[AuditLog Warning] Failed to persist audit entry: ${err.message}`);
  }
}
