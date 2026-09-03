import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth, logAudit } from '../middleware/auth.js';
import { isDBConnected } from '../db.js';
import liveDataStore from '../dataStore.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'gridpulse-jwt-super-secret-key-kutch-banaskantha-hybrid-2024';
const JWT_EXPIRES_IN = '8h';

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check open registration toggle (Prompt 25 requirement)
    const allowOpenRegistration = process.env.ALLOW_OPEN_REGISTRATION !== 'false';
    if (!allowOpenRegistration) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({
          error: 'Open public registration is disabled. Administrator authorization required.',
        });
      }
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
          return res.status(403).json({
            error: 'Only administrators can register new accounts when public registration is disabled.',
          });
        }
      } catch (err) {
        return res.status(403).json({
          error: 'Authentication failed. Only administrators can register new users.',
        });
      }
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters in length.',
      });
    }

    let assignedRole = 'viewer';
    if (role && ['viewer', 'operator', 'admin'].includes(role.toLowerCase())) {
      const requestedRole = role.toLowerCase();
      if (requestedRole === 'admin') {
        const authHeader = req.headers.authorization;
        let isExistingAdmin = false;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.role === 'admin') isExistingAdmin = true;
          } catch (e) {
            isExistingAdmin = false;
          }
        }
        if (!isExistingAdmin) {
          console.warn(`[Auth Register] Unauthorized attempt to register as admin: ${email}`);
          return res.status(403).json({
            error: 'Only an existing administrator can create another admin account.',
          });
        }
        assignedRole = 'admin';
      } else {
        assignedRole = requestedRole;
      }
    }

    const normalizedEmail = email.toLowerCase().trim();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newUser;
    if (isDBConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: assignedRole,
        status: 'active',
        createdAt: new Date(),
      });
    } else {
      // In-Memory store fallback
      const existing = liveDataStore.users.find((u) => u.email === normalizedEmail);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      newUser = {
        _id: 'usr-' + Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: assignedRole,
        status: 'active',
        createdAt: new Date(),
        lastLogin: null,
      };
      liveDataStore.users.push(newUser);
    }

    await logAudit(newUser._id.toString(), 'user_registered', 'User', newUser._id.toString(), {
      email: newUser.email,
      role: newUser.role,
    });

    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        role: newUser.role,
        name: newUser.name,
        email: newUser.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('[POST /api/auth/register Error]:', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user;

    if (isDBConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = liveDataStore.users.find((u) => u.email === normalizedEmail);
    }

    if (!user) {
      console.warn(`[Auth Login Failed] Reason: Unknown email "${normalizedEmail}"`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'disabled') {
      console.warn(`[Auth Login Blocked] Account "${normalizedEmail}" is disabled.`);
      return res.status(403).json({
        error: 'Account is disabled. Please contact your system administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.warn(`[Auth Login Failed] Reason: Wrong password for user "${normalizedEmail}"`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    if (isDBConnected() && typeof user.save === 'function') {
      await user.save();
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logAudit(user._id.toString(), 'user_login', 'User', user._id.toString(), {
      email: user.email,
    });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[POST /api/auth/login Error]:', error);
    return res.status(500).json({ error: 'Invalid credentials' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    if (req.user?.userId) {
      await logAudit(req.user.userId, 'user_logout', 'User', req.user.userId);
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[POST /api/auth/logout Error]:', error);
    return res.status(500).json({ error: 'Error logging out' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (isDBConnected()) {
      const user = await User.findById(req.user.userId).select('-passwordHash');
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user });
    } else {
      const user = liveDataStore.users.find((u) => u._id === req.user.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const safeUser = { ...user };
      delete safeUser.passwordHash;
      return res.json({ user: safeUser });
    }
  } catch (error) {
    console.error('[GET /api/auth/me Error]:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

export default router;
