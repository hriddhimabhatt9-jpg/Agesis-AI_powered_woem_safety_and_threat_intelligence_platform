import { Router } from 'express';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/generate', auth, async (req, res) => {
  try {
    const { dateRange, includeAnalyses, includeEvidence, includeAlerts } = req.body;
    let analyses = [], evidence = [], alerts = [];

    try {
      if (includeAnalyses) {
        const TA = (await import('../models/ThreatAnalysis.js')).default;
        analyses = await TA.find({ userId: req.user._id }).sort({ createdAt: 1 }).lean();
      }
      if (includeEvidence) {
        const Ev = (await import('../models/Evidence.js')).default;
        evidence = await Ev.find({ userId: req.user._id }).sort({ createdAt: 1 }).lean();
      }
      if (includeAlerts) {
        const Al = (await import('../models/Alert.js')).default;
        alerts = await Al.find({ userId: req.user._id }).sort({ createdAt: 1 }).lean();
      }
    } catch {}

    const totalRisk = analyses.reduce((s, a) => s + (a.results?.riskScore || 0), 0);
    const avgRisk = analyses.length ? Math.round(totalRisk / analyses.length) : 0;

    res.json({
      report: {
        generatedAt: new Date().toISOString(),
        user: { name: req.user.name, email: req.user.email },
        summary: { totalAnalyses: analyses.length, totalEvidence: evidence.length, totalAlerts: alerts.length, averageRiskScore: avgRisk },
        timeline: [...analyses.map(a => ({ type: 'analysis', date: a.createdAt, data: a })),
          ...evidence.map(e => ({ type: 'evidence', date: e.createdAt, data: e })),
          ...alerts.map(a => ({ type: 'alert', date: a.createdAt, data: a }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
