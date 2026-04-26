import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../../services/api';
import PageWrapper from '../../components/layout/PageWrapper';
import { Brain, Send, AlertTriangle, Shield, Loader2, Copy, Save } from 'lucide-react';

export default function MessageAnalyzer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../../services/analyzer.worker.js', import.meta.url));
    workerRef.current.onmessage = (e) => {
      const { score, threats, isSafe } = e.data;
      setResult({
        riskLevel: score > 70 ? 'high' : score > 30 ? 'medium' : 'low',
        riskScore: score,
        category: threats.length > 0 ? threats[0].type : 'None',
        explanation: isSafe ? 'No significant threats detected.' : `Potential threat detected: ${threats.map(t => t.type).join(', ')}.`,
        detectedPatterns: threats.map(t => t.type),
        suggestedActions: isSafe ? ['Continue conversation with caution'] : ['Block user', 'Report incident', 'Inform emergency contacts']
      });
      setLoading(false);
    };

    return () => workerRef.current?.terminate();
  }, []);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    workerRef.current.postMessage({ text, language });
  };

  const riskColors = { low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20', high: 'text-red-400 bg-red-500/10 border-red-500/20', critical: 'text-red-300 bg-red-500/15 border-red-400/30' };

  return (
    <PageWrapper title="AI Message Analyzer" subtitle="Paste any suspicious message to detect threats, harassment, or manipulation">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Brain size={20} className="text-primary-400" /> Message Input</h2>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              className="bg-surface-800 border border-surface-700 text-surface-300 text-xs rounded-lg px-2 py-1 outline-none"
            >
              <option value="english">English</option>
              <option value="hindi">Hindi (हिन्दी)</option>
              <option value="bengali">Bengali (বাংলা)</option>
              <option value="tamil">Tamil (தமிழ்)</option>
            </select>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={8} className="input-field resize-none mb-4" placeholder="Paste the suspicious message here..." />
          <button onClick={analyze} disabled={loading || !text.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : <><Send size={16} /> Analyze Message</>}
          </button>
        </div>

        {/* Results */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Shield size={20} className="text-primary-400" /> Analysis Results</h2>
          
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 skeleton w-1/4" />
              <div className="h-8 skeleton w-full" />
              <div className="h-2 skeleton w-full" />
              <div className="h-24 skeleton w-full" />
              <div className="h-12 skeleton w-full" />
            </div>
          ) : !result ? (
            <div className="flex flex-col items-center justify-center h-64 text-surface-500">
              <Brain size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Paste a message and click Analyze</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Risk Level */}
              <div className="flex items-center justify-between">
                <span className="text-surface-400 text-sm">Risk Level</span>
                <span className={`badge ${riskColors[result.riskLevel]} uppercase font-bold`}>
                  <AlertTriangle size={12} /> {result.riskLevel}
                </span>
              </div>

              {/* Risk Score Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-surface-400 text-xs">Risk Score</span>
                  <span className="text-white text-sm font-bold">{result.riskScore}/100</span>
                </div>
                <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.riskScore}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${result.riskScore >= 75 ? 'bg-red-500' : result.riskScore >= 50 ? 'bg-amber-500' : result.riskScore >= 25 ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                </div>
              </div>

              {/* Category */}
              <div className="p-3 rounded-lg bg-surface-800/50">
                <span className="text-surface-400 text-xs block mb-1">Category</span>
                <span className="text-white text-sm font-medium capitalize">{result.category}</span>
              </div>

              {/* Explanation */}
              <div className="p-3 rounded-lg bg-surface-800/50">
                <span className="text-surface-400 text-xs block mb-1">Explanation</span>
                <p className="text-surface-200 text-sm leading-relaxed">{result.explanation}</p>
              </div>

              {/* Patterns */}
              {result.detectedPatterns?.length > 0 && (
                <div>
                  <span className="text-surface-400 text-xs block mb-2">Detected Patterns</span>
                  <div className="flex flex-wrap gap-2">
                    {result.detectedPatterns.map((p, i) => (
                      <span key={i} className="badge-warning text-xs">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Actions */}
              {result.suggestedActions?.length > 0 && (
                <div>
                  <span className="text-surface-400 text-xs block mb-2">Suggested Actions</span>
                  <ul className="space-y-1.5">
                    {result.suggestedActions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-surface-300">
                        <span className="text-primary-400 mt-0.5">›</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
