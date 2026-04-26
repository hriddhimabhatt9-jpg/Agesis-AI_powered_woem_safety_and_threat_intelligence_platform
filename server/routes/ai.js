import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import aiService from '../services/aiService.js';

const router = Router();

router.post('/analyze-message', auth, async (req, res) => {
  try { const analysis = await aiService.analyzeMessage(req.body.text || req.body.message || ''); res.json({ analysis }); }
  catch(e) { res.status(500).json({ error: 'Analysis failed', details: e.message }); }
});

router.post('/decode-intent', auth, async (req, res) => {
  try { const analysis = await aiService.decodeIntent(req.body.conversation || req.body.text || ''); res.json({ analysis }); }
  catch(e) { res.status(500).json({ error: 'Decode failed', details: e.message }); }
});

router.post('/check-escalation', auth, async (req, res) => {
  try { const analysis = await aiService.checkEscalation(req.body.previousAnalyses || req.body.analyses || []); res.json({ analysis }); }
  catch(e) { res.status(500).json({ error: 'Escalation check failed', details: e.message }); }
});

router.post('/digital-shadow', auth, async (req, res) => {
  try { const analysis = await aiService.scanDigitalShadow(req.body.query || req.body.text || ''); res.json({ analysis }); }
  catch(e) { res.status(500).json({ error: 'Scan failed', details: e.message }); }
});

router.post('/detect-impersonation', auth, async (req, res) => {
  try { const analysis = await aiService.detectImpersonation(req.body.profile || req.body); res.json({ analysis }); }
  catch(e) { res.status(500).json({ error: 'Detection failed', details: e.message }); }
});

router.post('/simulate-attack', auth, async (req, res) => {
  try { const analysis = await aiService.simulateAttack(req.body.scenario || req.body.text || ''); res.json({ analysis }); }
  catch(e) { res.status(500).json({ error: 'Simulation failed', details: e.message }); }
});

router.post('/emotional-support', auth, async (req, res) => {
  try { const support = await aiService.getEmotionalSupport(req.body.message || req.body.text || ''); res.json({ support }); }
  catch(e) { res.status(500).json({ error: 'Support unavailable', details: e.message }); }
});

export default router;
