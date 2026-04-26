import { Router } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../config/index.js';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';

import demoStore from '../utils/demoStore.js';

const router = Router();


const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id || user.id, email: user.email, name: user.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
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
      const token = generateToken(user);

      return res.status(201).json({
        token,
        user: user.toSafeObject(),
        message: 'Registration successful',
      });
    } catch (dbErr) {
      // Demo mode
      if (demoStore.has(email)) {
        return res.status(409).json({ error: 'Email already registered' });
      }

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
      demoStore.set(email, { ...demoUser, password });
      const token = generateToken(demoUser);

      return res.status(201).json({
        token,
        user: demoUser,
        message: 'Registration successful (demo mode)',
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
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

      const token = generateToken(user);
      return res.json({ token, user: user.toSafeObject() });
    } catch (dbErr) {
      // Demo mode
      const demoUser = demoStore.get(email);
      if (!demoUser || demoUser.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { password: _, ...safeUser } = demoUser;
      const token = generateToken(safeUser);
      return res.json({ token, user: safeUser });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google OAuth (simplified — frontend sends ID token)
router.post('/google', async (req, res) => {
  try {
    const { credential, name, email, picture } = req.body;
    
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }
      const User = (await import('../models/User.js')).default;
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name, email,
          googleId: credential,
          authProvider: 'google',
          avatar: picture,
          profileCompleted: false,
        });
      }

      const token = generateToken(user);
      return res.json({ token, user: user.toSafeObject() });
    } catch (dbErr) {
      const demoUser = {
        _id: `google_${Date.now()}`,
        name, email,
        authProvider: 'google',
        avatar: picture,
        profileCompleted: false,
        onboardingStep: 1,
        activeSafetyMode: 'none',
        defenseMode: 'passive',
        privacySettings: { showLocation: false, showPhone: false, showProfession: false },
        additionalEmergencyContacts: [],
        createdAt: new Date(),
      };
      demoStore.set(email, demoUser);
      const token = generateToken(demoUser);
      return res.json({ token, user: demoUser });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
});

// Refresh token
router.post('/refresh', auth, async (req, res) => {
  const token = generateToken(req.user);
  res.json({ token });
});

export default router;
