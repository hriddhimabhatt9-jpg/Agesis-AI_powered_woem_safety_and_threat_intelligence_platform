import { useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../../services/api';
import PageWrapper from '../../components/layout/PageWrapper';
import { Search, Loader2, Globe, Mail, Phone, User } from 'lucide-react';

export default function DigitalShadow() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('email');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await aiAPI.digitalShadow(`${type}: ${query}`);
      setResult(data.analysis);
    } catch { setResult({ riskLevel: 'medium', riskScore: 40, explanation: 'Scan unavailable', suggestedActions: ['Try again'] }); }
    setLoading(false);
  };

  const typeIcons = { email: Mail, phone: Phone, username: User };
  const TypeIcon = typeIcons[type];

  return (
    <PageWrapper title="Digital Shadow Scanner" subtitle="Scan for data leaks, public exposure, and identity misuse">
      <div className="max-w-3xl mx-auto">
        <div className="glass-card p-6 mb-6">
          <div className="flex gap-2 mb-4">
            {['email', 'phone', 'username'].map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${type === t ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-surface-400 hover:text-white hover:bg-surface-800'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <TypeIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
              <input value={query} onChange={e => setQuery(e.target.value)} className="input-field pl-10"
                placeholder={type === 'email' ? 'you@example.com' : type === 'phone' ? '+91 XXXXXXXXXX' : 'username123'} />
            </div>
            <button onClick={scan} disabled={loading || !query.trim()} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Scan
            </button>
          </div>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50">
              <div><span className="text-surface-400 text-xs">Exposure Risk</span><p className={`text-xl font-bold uppercase ${result.riskScore >= 50 ? 'text-red-400' : 'text-emerald-400'}`}>{result.riskLevel}</p></div>
              <div className="text-right"><span className="text-surface-400 text-xs">Score</span><p className="text-2xl font-bold text-white">{result.riskScore}/100</p></div>
            </div>
            <div className="p-3 rounded-lg bg-surface-800/50"><span className="text-surface-400 text-xs block mb-1">Analysis</span><p className="text-surface-200 text-sm">{result.explanation}</p></div>
            {result.exposureData?.potentialRisks?.length > 0 && (
              <div><span className="text-surface-400 text-xs block mb-2">Potential Risks</span>{result.exposureData.potentialRisks.map((r, i) => <div key={i} className="badge-danger text-xs mr-2 mb-2 inline-block">{r}</div>)}</div>
            )}
            {result.exposureData?.protectionTips?.length > 0 && (
              <div><span className="text-surface-400 text-xs block mb-2">Protection Tips</span><ul className="space-y-1.5">{result.exposureData.protectionTips.map((t, i) => <li key={i} className="text-sm text-surface-300">✓ {t}</li>)}</ul></div>
            )}
            {result.suggestedActions?.length > 0 && (
              <div><span className="text-surface-400 text-xs block mb-2">Actions</span><ul className="space-y-1.5">{result.suggestedActions.map((a, i) => <li key={i} className="text-sm text-surface-300">› {a}</li>)}</ul></div>
            )}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
