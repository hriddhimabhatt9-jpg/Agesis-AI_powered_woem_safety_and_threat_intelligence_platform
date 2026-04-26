import { useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../../services/api';
import PageWrapper from '../../components/layout/PageWrapper';
import { Zap, Play, Loader2 } from 'lucide-react';

const scenarios = ['Online dating manipulation', 'Social media grooming', 'Workplace harassment escalation', 'Cyberstalking pattern', 'Financial fraud through romance', 'Blackmail through intimate content'];

export default function AttackSimulation() {
  const [scenario, setScenario] = useState('');
  const [custom, setCustom] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    const s = custom.trim() || scenario;
    if (!s) return;
    setLoading(true);
    try { const { data } = await aiAPI.simulateAttack(s); setResult(data.analysis); }
    catch { setResult({ riskLevel: 'high', riskScore: 75, explanation: 'Simulation unavailable', attackSteps: [], suggestedActions: ['Try again'], detectedPatterns: [] }); }
    setLoading(false);
  };

  const phaseColors = { 'Trust Building': 'border-blue-500/30 bg-blue-500/5', 'Manipulation': 'border-amber-500/30 bg-amber-500/5', 'Threat': 'border-red-500/30 bg-red-500/5', 'Escalation': 'border-red-500/30 bg-red-500/5', 'Exploitation': 'border-red-400/30 bg-red-400/5' };

  return (
    <PageWrapper title="Attack Simulation" subtitle="Educational tool showing how online predators operate — learn to recognize the signs">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Zap size={20} className="text-red-400" /> Choose a Scenario</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {scenarios.map(s => (
              <button key={s} onClick={() => { setScenario(s); setCustom(''); }}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${scenario === s ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'bg-surface-800/50 text-surface-400 border border-surface-700/50 hover:text-white'}`}>{s}</button>
            ))}
          </div>
          <div className="flex gap-3">
            <input value={custom} onChange={e => { setCustom(e.target.value); setScenario(''); }} className="input-field flex-1" placeholder="Or describe a custom scenario..." />
            <button onClick={simulate} disabled={loading || (!scenario && !custom.trim())} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Simulate
            </button>
          </div>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card p-6">
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 mb-4 text-center">
                <span className="text-red-400 text-xs font-medium">⚠️ EDUCATIONAL CONTENT — For awareness purposes only</span>
              </div>
              <p className="text-surface-300 text-sm">{result.explanation}</p>
            </div>

            {result.attackSteps?.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                className={`glass-card p-5 border-l-4 ${phaseColors[step.phase] || 'border-surface-600'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-sm font-bold text-white">{step.step}</span>
                  <h3 className="font-semibold text-white">{step.phase}</h3>
                </div>
                <p className="text-surface-300 text-sm ml-11 mb-3">{step.description}</p>
                {step.indicators?.length > 0 && (
                  <div className="ml-11 flex flex-wrap gap-2">
                    {step.indicators.map((ind, j) => <span key={j} className="badge-warning text-xs">🚩 {ind}</span>)}
                  </div>
                )}
              </motion.div>
            ))}

            {result.suggestedActions?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-white mb-3">How to Protect Yourself</h3>
                <ul className="space-y-2">{result.suggestedActions.map((a, i) => <li key={i} className="text-sm text-surface-300 flex items-start gap-2"><span className="text-emerald-400">✓</span>{a}</li>)}</ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
