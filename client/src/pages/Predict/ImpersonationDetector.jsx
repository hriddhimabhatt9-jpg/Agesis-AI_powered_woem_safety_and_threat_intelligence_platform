import { useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../../services/api';
import PageWrapper from '../../components/layout/PageWrapper';
import { UserX, Loader2, Send } from 'lucide-react';

export default function ImpersonationDetector() {
  const [profile, setProfile] = useState({ name: '', platform: '', bio: '', followerCount: '', accountAge: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const detect = async () => {
    setLoading(true);
    try { const { data } = await aiAPI.detectImpersonation(profile); setResult(data.analysis); }
    catch { setResult({ riskLevel: 'medium', riskScore: 45, explanation: 'Detection unavailable', detectedPatterns: [], suggestedActions: ['Try again'] }); }
    setLoading(false);
  };

  return (
    <PageWrapper title="Impersonation Detector" subtitle="Analyze a social media profile for signs of fake identity">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><UserX size={20} className="text-pink-400" /> Profile Details</h2>
          <div className="space-y-4">
            <div><label className="block text-sm text-surface-300 mb-1.5">Display Name</label><input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="input-field" placeholder="Profile display name" /></div>
            <div><label className="block text-sm text-surface-300 mb-1.5">Platform</label><select value={profile.platform} onChange={e => setProfile({ ...profile, platform: e.target.value })} className="input-field"><option value="">Select platform</option><option>Instagram</option><option>Facebook</option><option>Twitter/X</option><option>LinkedIn</option><option>Snapchat</option><option>Other</option></select></div>
            <div><label className="block text-sm text-surface-300 mb-1.5">Bio / About</label><textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} className="input-field resize-none" rows={3} placeholder="Copy the profile bio..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-surface-300 mb-1.5">Follower Count</label><input value={profile.followerCount} onChange={e => setProfile({ ...profile, followerCount: e.target.value })} className="input-field" placeholder="e.g., 150" /></div>
              <div><label className="block text-sm text-surface-300 mb-1.5">Account Age</label><input value={profile.accountAge} onChange={e => setProfile({ ...profile, accountAge: e.target.value })} className="input-field" placeholder="e.g., 2 months" /></div>
            </div>
          </div>
          <button onClick={detect} disabled={loading || !profile.name} className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Analyze Profile
          </button>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Detection Results</h2>
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-surface-500"><UserX size={40} className="mb-3 opacity-30" /><p className="text-sm">Enter profile details to check</p></div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-800/50 flex items-center justify-between">
                <div><span className="text-surface-400 text-xs">Impersonation Risk</span><p className={`text-xl font-bold uppercase ${result.riskScore >= 50 ? 'text-red-400' : 'text-emerald-400'}`}>{result.riskLevel}</p></div>
                <div className="text-right"><span className="text-surface-400 text-xs">Score</span><p className="text-2xl font-bold text-white">{result.riskScore}/100</p></div>
              </div>
              <div className="p-3 rounded-lg bg-surface-800/50"><span className="text-surface-400 text-xs block mb-1">Analysis</span><p className="text-surface-200 text-sm">{result.explanation}</p></div>
              {result.detectedPatterns?.length > 0 && (<div><span className="text-surface-400 text-xs block mb-2">Red Flags</span><div className="flex flex-wrap gap-2">{result.detectedPatterns.map((p, i) => <span key={i} className="badge-danger text-xs">{p}</span>)}</div></div>)}
              {result.suggestedActions?.length > 0 && (<div><span className="text-surface-400 text-xs block mb-2">Actions</span><ul className="space-y-1.5">{result.suggestedActions.map((a, i) => <li key={i} className="text-sm text-surface-300">› {a}</li>)}</ul></div>)}
            </motion.div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
