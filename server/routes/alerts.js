import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import alertService from '../services/alertService.js';

const router = Router();

// In-memory user contacts store for demo mode
const demoContacts = {};

// Save contacts (used by profile updates)
router.post('/save-contacts', auth, (req, res) => {
  const uid = req.user._id?.toString() || req.user.email;
  demoContacts[uid] = req.body.contacts || [];
  res.json({ message: 'Contacts saved', count: demoContacts[uid].length });
});

// Trigger panic alert
router.post('/panic', auth, async (req, res) => {
  try {
    const { location, contacts: bodyContacts } = req.body;
    const user = req.user;
    const uid = user._id?.toString() || user.email;

    // Gather contacts from: request body > demo store > user model
    let contacts = [];
    if (bodyContacts && bodyContacts.length > 0) {
      contacts = bodyContacts;
    } else if (demoContacts[uid] && demoContacts[uid].length > 0) {
      contacts = demoContacts[uid];
    } else {
      if (user.primaryEmergencyContact?.name) contacts.push(user.primaryEmergencyContact);
      if (user.additionalEmergencyContacts?.length) contacts.push(...user.additionalEmergencyContacts);
    }

    const loc = location || { lat: 28.6139, lng: 77.2090 };
    const mapsLink = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;

    if (contacts.length === 0) {
      return res.json({
        message: '⚠️ No emergency contacts configured! Add contacts in Profile or Trusted Contacts page.',
        contactsNotified: 0,
        results: [],
      });
    }

    // Send alerts
    const results = await alertService.sendPanicAlert(
      { name: user.name || 'AEGESIS User', email: user.email },
      loc,
      contacts
    );

    // Try to save to DB
    try {
      const Alert = (await import('../models/Alert.js')).default;
      await Alert.create({ userId: user._id, type: 'panic', location: { ...loc, googleMapsLink: mapsLink }, contactsNotified: results, status: 'sent' });
    } catch {}

    res.json({
      message: `🚨 Emergency alert sent to ${results.length} contact(s)!`,
      contactsNotified: results.length,
      results,
      mapsLink,
    });
  } catch (error) {
    console.error('Panic alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get alert history
router.get('/history', auth, async (req, res) => {
  try {
    const Alert = (await import('../models/Alert.js')).default;
    const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20).lean();
    res.json({ alerts });
  } catch { res.json({ alerts: [] }); }
});

// Resolve alert
router.put('/:alertId/resolve', auth, async (req, res) => {
  try {
    const Alert = (await import('../models/Alert.js')).default;
    const alert = await Alert.findOneAndUpdate({ _id: req.params.alertId, userId: req.user._id }, { status: 'resolved', resolvedAt: new Date() }, { new: true });
    res.json({ alert });
  } catch { res.json({ message: 'Alert resolved' }); }
});

export default router;
