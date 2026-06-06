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
  body('primaryEmergencyContact.name').trim().notEmpty().withMessage('Emergency contact name is required'),
  body('primaryEmergencyContact.phone').trim().notEmpty().withMessage('Emergency contact phone is required'),
  validate,
], async (req, res) => {
  try {
    const { name, phone, primaryEmergencyContact } = req.body;
    const updates = { primaryEmergencyContact, onboardingStep: 2 };
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
      return res.json({ user: user.toSafeObject(), message: 'Step 1 completed' });
    } catch {
      // Demo mode
      const updated = demoStore.update(req.user._id || req.user.id, updates);
      return res.json({ user: updated || { ...req.user, ...updates }, message: 'Step 1 completed (demo)' });
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
      const updates = { profileCompleted: true };
      if (ageGroup !== undefined) updates.ageGroup = ageGroup;
      if (profession !== undefined) updates.profession = profession;
      if (approximateLocation !== undefined) updates.approximateLocation = approximateLocation;
      if (additionalEmergencyContacts) updates.additionalEmergencyContacts = additionalEmergencyContacts.slice(0, 3);

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
      return res.json({ user: user.toSafeObject(), message: 'Profile completed' });
    } catch {
      const updates = { profileCompleted: true };
      if (ageGroup !== undefined) updates.ageGroup = ageGroup;
      if (profession !== undefined) updates.profession = profession;
      if (approximateLocation !== undefined) updates.approximateLocation = approximateLocation;
      if (additionalEmergencyContacts) updates.additionalEmergencyContacts = additionalEmergencyContacts.slice(0, 3);
      
      const updated = demoStore.update(req.user._id || req.user.id, updates);
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
      const updated = demoStore.update(req.user._id || req.user.id, { 
        privacySettings: { showLocation, showPhone, showProfession } 
      });
      return res.json({ user: updated || { ...req.user, privacySettings: { showLocation, showPhone, showProfession } } });
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
      const updated = demoStore.update(req.user._id || req.user.id, { activeSafetyMode: mode });
      return res.json({ user: updated || { ...req.user, activeSafetyMode: mode } });
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
      const updated = demoStore.update(req.user._id || req.user.id, { defenseMode: mode });
      return res.json({ user: updated || { ...req.user, defenseMode: mode } });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
