import { useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../../services/api';
import PageWrapper from '../../components/layout/PageWrapper';
import { Eye, Send, Loader2, AlertTriangle } from 'lucide-react';

export default function IntentDecoder() {
  const [conversation, setConversation] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const decode = async () => {
    if (!conversation.trim()) return;
    setLoading(true);
    try {
      const { data } = await aiAPI.decodeIntent(conversation);
      setResult(data.analysis);
    } catch {
      setResult({ riskLevel: 'medium', riskScore: 40, category: 'unavailable', explanation: 'Service unavailable', detectedPatterns: [], suggestedActions: ['Try again later'], psychologicalIntent: 'Unable to analyze' });
    }
    setLoading(false);
  };

  const riskColor = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400', critical: 'text-red-300' };

  return (
    <PageWrapper title="Conversation Intent Decoder" subtitle="Paste a conversation to detect grooming, gaslighting, manipulation, or obsessive behavior">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Eye size={20} className="text-blue-400" /> Conversation Input</h2>
          <p className="text-surface-400 text-xs mb-4">Paste the full conversation — include both sides for better analysis</p>
          <textarea value={conversation} onChange={e => setConversation(e.target.value)} rows={12} className="input-field resize-none mb-4"
            placeholder="Person A: Hey, you're the only one who understands me...&#10;Person B: That's sweet.&#10;Person A: Nobody else cares about you like I do..." />
          <button onClick={decode} disabled={loading || !conversation.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Decoding...</> : <><Send size={16} /> Decode Intent</>}
          </button>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Decoded Intent</h2>
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-surface-500">
              <Eye size={40} className="mb-3 opacity-30" /><p className="text-sm">Paste a conversation and click Decode</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50">
                <div>
                  <span className="text-surface-400 text-xs">Risk Level</span>
                  <p className={`text-xl font-bold uppercase ${riskColor[result.riskLevel]}`}>{result.riskLevel}</p>
                </div>
                <div className="text-right">
                  <span className="text-surface-400 text-xs">Score</span>
                  <p className="text-2xl font-bold text-white">{result.riskScore}<span className="text-surface-500 text-sm">/100</span></p>
                </div>
              </div>

              {result.psychologicalIntent && (
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <span className="text-purple-400 text-xs font-medium block mb-1">Psychological Intent</span>
                  <p className="text-surface-200 text-sm">{result.psychologicalIntent}</p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-surface-800/50">
                <span className="text-surface-400 text-xs block mb-1">Category</span>
                <span className="text-white text-sm font-medium capitalize">{result.category}</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-800/50">
                <span className="text-surface-400 text-xs block mb-1">Explanation</span>
                <p className="text-surface-200 text-sm leading-relaxed">{result.explanation}</p>
              </div>

              {result.detectedPatterns?.length > 0 && (
                <div>
                  <span className="text-surface-400 text-xs block mb-2">Patterns Detected</span>
                  <div className="flex flex-wrap gap-2">
                    {result.detectedPatterns.map((p, i) => <span key={i} className="badge-warning text-xs">{p}</span>)}
                  </div>
                </div>
              )}

              {result.suggestedActions?.length > 0 && (
                <div>
                  <span className="text-surface-400 text-xs block mb-2">Recommended Actions</span>
                  <ul className="space-y-1.5">
                    {result.suggestedActions.map((a, i) => <li key={i} className="text-sm text-surface-300 flex items-start gap-2"><span className="text-primary-400">›</span>{a}</li>)}
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
