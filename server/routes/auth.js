import { Router } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import config from '../config/index.js';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';

import demoStore from '../utils/demoStore.js';

const router = Router();

// In-memory refresh token store for demo mode
const refreshTokenStore = new Map();

const generateTokens = (user) => {
  const payload = { userId: user._id || user.id, email: user.email, name: user.name };
  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
  // Store refresh token
  const userId = String(user._id || user.id);
  refreshTokenStore.set(userId, refreshToken);
  return { accessToken, refreshToken };
};

// Register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
], async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Try MongoDB first
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }
      const User = (await import('../models/User.js')).default;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const user = await User.create({ name, email, password, phone, authProvider: 'local' });
      const { accessToken, refreshToken } = generateTokens(user);

      return res.status(201).json({
        token: accessToken,
        refreshToken,
        user: user.toSafeObject(),
        message: 'Registration successful',
      });
    } catch (dbErr) {
      // Demo mode
      if (demoStore.has(email)) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password even in demo mode
      const hashedPassword = await bcrypt.hash(password, 12);

      const demoUser = {
        _id: `demo_${Date.now()}`,
        id: `demo_${Date.now()}`,
        name, email, phone,
        authProvider: 'local',
        profileCompleted: false,
        onboardingStep: 1,
        activeSafetyMode: 'none',
        defenseMode: 'passive',
        privacySettings: { showLocation: false, showPhone: false, showProfession: false },
        additionalEmergencyContacts: [],
        createdAt: new Date(),
      };
      demoStore.set(email, { ...demoUser, password: hashedPassword });
      const { accessToken, refreshToken } = generateTokens(demoUser);

      return res.status(201).json({
        token: accessToken,
        refreshToken,
        user: demoUser,
        message: 'Registration successful (demo mode)',
      });
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
], async (req, res) => {
  try {
    const { email, password } = req.body;

    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }
      const User = (await import('../models/User.js')).default;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !user.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { accessToken, refreshToken } = generateTokens(user);
      return res.json({ token: accessToken, refreshToken, user: user.toSafeObject() });
    } catch (dbErr) {
      // Demo mode
      const demoUser = demoStore.get(email);
      if (!demoUser || !demoUser.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Compare hashed password in demo mode
      const isMatch = await bcrypt.compare(password, demoUser.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { password: _, ...safeUser } = demoUser;
      const { accessToken, refreshToken } = generateTokens(safeUser);
      return res.json({ token: accessToken, refreshToken, user: safeUser });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Google OAuth — verify ID token or accept profile data from Google Sign-In
router.post('/google', async (req, res) => {
  try {
    const { credential, name, email, picture } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google authentication' });
    }

    // If credential is a full JWT ID token, verify it
    let verifiedEmail = email;
    let verifiedName = name;
    let verifiedPicture = picture;

    if (credential && credential.length > 100) {
      // Attempt to verify Google ID token
      try {
        const { OAuth2Client } = await import('google-auth-library');
        if (config.google.clientId) {
          const client = new OAuth2Client(config.google.clientId);
          const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: config.google.clientId,
          });
          const payload = ticket.getPayload();
          verifiedEmail = payload.email;
          verifiedName = payload.name || name;
          verifiedPicture = payload.picture || picture;
        }
      } catch (verifyErr) {
        console.warn('Google ID token verification failed, using provided profile data:', verifyErr.message);
        // Fall through to use the provided data — allows frontend Google Sign-In without server-side verification
      }
    }

    let isNew = false;
    
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }
      const User = (await import('../models/User.js')).default;
      let user = await User.findOne({ email: verifiedEmail });

      if (!user) {
        user = await User.create({
          name: verifiedName,
          email: verifiedEmail,
          googleId: credential ? credential.substring(0, 100) : `google_${Date.now()}`,
          authProvider: 'google',
          avatar: verifiedPicture,
          profileCompleted: false,
        });
        isNew = true;
      }

      const { accessToken, refreshToken } = generateTokens(user);
      return res.json({ token: accessToken, refreshToken, user: user.toSafeObject(), isNew });
    } catch (dbErr) {
      // Demo mode
      const existingUser = demoStore.get(verifiedEmail);
      if (existingUser) {
        const { accessToken, refreshToken } = generateTokens(existingUser);
        return res.json({ token: accessToken, refreshToken, user: existingUser, isNew: false });
      }

      isNew = true;
      const demoUser = {
        _id: `google_${Date.now()}`,
        name: verifiedName,
        email: verifiedEmail,
        authProvider: 'google',
        avatar: verifiedPicture,
        profileCompleted: false,
        onboardingStep: 1,
        activeSafetyMode: 'none',
        defenseMode: 'passive',
        privacySettings: { showLocation: false, showPhone: false, showProfession: false },
        additionalEmergencyContacts: [],
        createdAt: new Date(),
      };
      demoStore.set(verifiedEmail, demoUser);
      const { accessToken, refreshToken } = generateTokens(demoUser);
      return res.json({ token: accessToken, refreshToken, user: demoUser, isNew });
    }
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(500).json({ error: 'Google authentication failed. Please try again.' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const userId = String(decoded.userId);
    
    // Verify the refresh token is still valid (not revoked)
    const storedToken = refreshTokenStore.get(userId);
    if (storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Find user
    let user;
    try {
      const User = (await import('../models/User.js')).default;
      user = await User.findById(decoded.userId);
    } catch {
      user = demoStore.getById(decoded.userId) || { _id: decoded.userId, email: decoded.email, name: decoded.name };
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tokens = generateTokens(user);
    res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired. Please login again.' });
    }
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout (revoke refresh token)
router.post('/logout', auth, (req, res) => {
  const userId = String(req.user._id || req.user.id);
  refreshTokenStore.delete(userId);
  res.json({ message: 'Logged out successfully' });
});

export default router;
