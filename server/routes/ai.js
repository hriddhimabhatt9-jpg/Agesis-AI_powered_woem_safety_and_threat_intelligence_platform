import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import aiService from '../services/aiService.js';

const router = Router();

// Basic input sanitization
const sanitize = (text, maxLength = 2000) => {
  if (typeof text !== 'string') {
    if (typeof text === 'object') return JSON.stringify(text).substring(0, maxLength);
    return '';
  }
  return text.substring(0, maxLength);
};

router.post('/analyze-message', auth, async (req, res) => {
  try { const analysis = await aiService.analyzeMessage(sanitize(req.body.text || req.body.message || '')); res.json({ analysis }); }
  catch(e) { res.status(500).json({ error: 'Analysis failed', details: e.message }); }
});

router.post('/decode-intent', auth, async (req, res) => {
  try { const analysis = await aiService.decodeIntent(sanitize(req.body.conversation || req.body.text || '', 5000)); res.json({ analysis }); }
  catch(e) { res.status(500).json({ error: 'Decode failed', details: e.message }); }
});

router.post('/check-escalation', auth, async (req, res) => {
  try { 
    // For arrays, stringify then sanitize to avoid huge payloads
    const payload = Array.isArray(req.body.previousAnalyses) ? req.body.previousAnalyses : (req.body.analyses || []);
    const analysis = await aiService.checkEscalation(payload); 
    res.json({ analysis }); 
  }
  catch(e) { res.status(500).json({ error: 'Escalation check failed', details: e.message }); }
});

router.post('/digital-shadow', auth, async (req, res) => {
  try { const analysis = await aiService.scanDigitalShadow(sanitize(req.body.query || req.body.text || '', 500)); res.json({ analysis }); }
  catch(e) { res.status(500).json({ error: 'Scan failed', details: e.message }); }
});

router.post('/detect-impersonation', auth, async (req, res) => {
  try { const analysis = await aiService.detectImpersonation(req.body.profile || req.body); res.json({ analysis }); }
  catch(e) { res.status(500).json({ error: 'Detection failed', details: e.message }); }
});

router.post('/simulate-attack', auth, async (req, res) => {
  try { const analysis = await aiService.simulateAttack(sanitize(req.body.scenario || req.body.text || '', 1000)); res.json({ analysis }); }
  catch(e) { res.status(500).json({ error: 'Simulation failed', details: e.message }); }
});

router.post('/emotional-support', auth, async (req, res) => {
  try { const support = await aiService.getEmotionalSupport(sanitize(req.body.message || req.body.text || '', 2000)); res.json({ support }); }
  catch(e) { res.status(500).json({ error: 'Support unavailable', details: e.message }); }
});

export default router;
