import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import demoStore from '../utils/demoStore.js';


const router = Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
});

// Update profile Step 1
router.put('/profile/step1', auth, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('primaryEmergencyContact.name').trim().notEmpty().withMessage('Emergency contact name is required'),
  body('primaryEmergencyContact.phone').trim().notEmpty().withMessage('Emergency contact phone is required'),
  validate,
], async (req, res) => {
  try {
    const { name, phone, primaryEmergencyContact } = req.body;
    
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findByIdAndUpdate(req.user._id, {
        name, phone, primaryEmergencyContact,
        onboardingStep: 2,
      }, { new: true });
      return res.json({ user: user.toSafeObject(), message: 'Step 1 completed' });
    } catch {
      // Demo mode
      const updated = demoStore.update(req.user._id || req.user.id, { 
        name, phone, primaryEmergencyContact, onboardingStep: 2 
      });
      return res.json({ user: updated || req.user, message: 'Step 1 completed (demo)' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile Step 2
router.put('/profile/step2', auth, async (req, res) => {
  try {
    const { ageGroup, profession, approximateLocation, additionalEmergencyContacts } = req.body;
    
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findByIdAndUpdate(req.user._id, {
        ageGroup, profession, approximateLocation,
        additionalEmergencyContacts: additionalEmergencyContacts?.slice(0, 3),
        profileCompleted: true,
      }, { new: true });
      return res.json({ user: user.toSafeObject(), message: 'Profile completed' });
    } catch {
      const updated = demoStore.update(req.user._id || req.user.id, { 
        ageGroup, profession, approximateLocation, additionalEmergencyContacts, profileCompleted: true 
      });
      return res.json({ user: updated || req.user, message: 'Profile completed (demo)' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update privacy settings
router.put('/privacy', auth, async (req, res) => {
  try {
    const { showLocation, showPhone, showProfession } = req.body;
    
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findByIdAndUpdate(req.user._id, {
        privacySettings: { showLocation, showPhone, showProfession },
      }, { new: true });
      return res.json({ user: user.toSafeObject() });
    } catch {
      req.user.privacySettings = { showLocation, showPhone, showProfession };
      return res.json({ user: req.user });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update safety mode
router.put('/safety-mode', auth, async (req, res) => {
  try {
    const { mode } = req.body;
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findByIdAndUpdate(req.user._id, { activeSafetyMode: mode }, { new: true });
      return res.json({ user: user.toSafeObject() });
    } catch {
      req.user.activeSafetyMode = mode;
      return res.json({ user: req.user });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update defense mode
router.put('/defense-mode', auth, async (req, res) => {
  try {
    const { mode } = req.body;
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findByIdAndUpdate(req.user._id, { defenseMode: mode }, { new: true });
      return res.json({ user: user.toSafeObject() });
    } catch {
      req.user.defenseMode = mode;
      return res.json({ user: req.user });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
