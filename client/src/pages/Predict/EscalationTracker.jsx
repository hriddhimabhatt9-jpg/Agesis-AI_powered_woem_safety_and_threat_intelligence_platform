import { useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../../services/api';
import PageWrapper from '../../components/layout/PageWrapper';
import { TrendingUp, Play, Loader2 } from 'lucide-react';

export default function EscalationTracker() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([{ text: '', date: new Date().toISOString().split('T')[0] }]);

  const addEntry = () => setEntries([...entries, { text: '', date: new Date().toISOString().split('T')[0] }]);

  const analyze = async () => {
    setLoading(true);
    try {
      const analyses = entries.filter(e => e.text.trim()).map((e, i) => ({ riskScore: 20 + i * 15, date: e.date, summary: e.text }));
      const { data } = await aiAPI.checkEscalation(analyses);
      setResult(data.analysis);
    } catch { setResult({ riskLevel: 'medium', riskScore: 45, explanation: 'Analysis unavailable', suggestedActions: ['Try again'], detectedPatterns: [] }); }
    setLoading(false);
  };

  return (
    <PageWrapper title="Behavior Escalation Tracker" subtitle="Track conversation patterns over time to detect escalating threats">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-amber-400" /> Timeline Entries</h2>
          <p className="text-surface-400 text-xs mb-4">Add messages from different dates to track behavior changes</p>
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto no-scrollbar">
            {entries.map((e, i) => (
              <div key={i} className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-surface-400">Entry {i + 1}</span>
                  <input type="date" value={e.date} onChange={ev => { const arr = [...entries]; arr[i].date = ev.target.value; setEntries(arr); }} className="input-field text-xs py-1 px-2 w-auto ml-auto" />
                </div>
                <textarea value={e.text} onChange={ev => { const arr = [...entries]; arr[i].text = ev.target.value; setEntries(arr); }} rows={2} className="input-field resize-none text-sm" placeholder="Paste message from this date..." />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={addEntry} className="btn-secondary text-sm flex-1">+ Add Entry</button>
            <button onClick={analyze} disabled={loading} className="btn-primary text-sm flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Analyze
            </button>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Escalation Analysis</h2>
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-surface-500">
              <TrendingUp size={40} className="mb-3 opacity-30" /><p className="text-sm">Add entries and click Analyze</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-800/50 flex items-center justify-between">
                <div>
                  <span className="text-surface-400 text-xs">Escalation Status</span>
                  <p className={`text-xl font-bold ${result.riskScore >= 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {result.escalationDetected ? '⚠️ Escalating' : '✅ Stable'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-surface-400 text-xs">Risk Score</span>
                  <p className="text-2xl font-bold text-white">{result.riskScore}</p>
                </div>
              </div>
              {result.escalationRate && (
                <div className="p-3 rounded-lg bg-surface-800/50"><span className="text-surface-400 text-xs block mb-1">Escalation Rate</span><span className="text-white text-sm capitalize">{result.escalationRate}</span></div>
              )}
              <div className="p-3 rounded-lg bg-surface-800/50"><span className="text-surface-400 text-xs block mb-1">Analysis</span><p className="text-surface-200 text-sm">{result.explanation}</p></div>
              {result.predictedNextStep && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10"><span className="text-red-400 text-xs block mb-1">Predicted Next Step</span><p className="text-surface-200 text-sm">{result.predictedNextStep}</p></div>
              )}
              {result.suggestedActions?.length > 0 && (
                <div><span className="text-surface-400 text-xs block mb-2">Actions</span><ul className="space-y-1.5">{result.suggestedActions.map((a, i) => <li key={i} className="text-sm text-surface-300">› {a}</li>)}</ul></div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
