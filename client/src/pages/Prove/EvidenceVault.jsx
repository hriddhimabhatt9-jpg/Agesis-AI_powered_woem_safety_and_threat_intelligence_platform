import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { evidenceAPI } from '../../services/api';
import PageWrapper from '../../components/layout/PageWrapper';
import { Archive, Plus, Trash2, Search, Tag, Clock, Filter } from 'lucide-react';

export default function EvidenceVault() {
  const [evidence, setEvidence] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [newEvidence, setNewEvidence] = useState({ title: '', category: 'message', content: '', tags: '' });

  useEffect(() => { loadEvidence(); }, []);

  const loadEvidence = async () => {
    try { const { data } = await evidenceAPI.getAll(); setEvidence(data.evidence); }
    catch { setEvidence([]); }
  };

  const addEvidence = async () => {
    if (!newEvidence.title || !newEvidence.content) return;
    try {
      const { data } = await evidenceAPI.store({ ...newEvidence, tags: newEvidence.tags.split(',').map(t => t.trim()).filter(Boolean) });
      setEvidence([data.evidence, ...evidence]);
      setNewEvidence({ title: '', category: 'message', content: '', tags: '' });
      setShowAdd(false);
    } catch {}
  };

  const deleteEvidence = async (id) => {
    try { await evidenceAPI.delete(id); setEvidence(evidence.filter(e => e._id !== id)); } catch {}
  };

  const filtered = evidence.filter(e => e.title?.toLowerCase().includes(search.toLowerCase()) || e.content?.toLowerCase().includes(search.toLowerCase()));
  const catColors = { message: 'bg-blue-500/10 text-blue-400', screenshot: 'bg-purple-500/10 text-purple-400', log: 'bg-amber-500/10 text-amber-400', analysis: 'bg-emerald-500/10 text-emerald-400', location: 'bg-cyan-500/10 text-cyan-400', other: 'bg-surface-600/10 text-surface-400' };

  return (
    <PageWrapper title="Evidence Vault" subtitle="Securely store messages, logs, and analysis results with timestamps">
      <div className="max-w-4xl mx-auto">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" /><input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 text-sm" placeholder="Search evidence..." /></div>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Add Evidence</button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">Store New Evidence</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div><label className="block text-xs text-surface-400 mb-1">Title *</label><input value={newEvidence.title} onChange={e => setNewEvidence({ ...newEvidence, title: e.target.value })} className="input-field text-sm" placeholder="Evidence title" /></div>
              <div><label className="block text-xs text-surface-400 mb-1">Category</label>
                <select value={newEvidence.category} onChange={e => setNewEvidence({ ...newEvidence, category: e.target.value })} className="input-field text-sm">
                  <option value="message">Message</option><option value="screenshot">Screenshot</option><option value="log">Log</option><option value="analysis">Analysis</option><option value="location">Location</option><option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="mb-4"><label className="block text-xs text-surface-400 mb-1">Content *</label><textarea value={newEvidence.content} onChange={e => setNewEvidence({ ...newEvidence, content: e.target.value })} className="input-field resize-none text-sm" rows={4} placeholder="Paste message, log, or description..." /></div>
            <div className="mb-4"><label className="block text-xs text-surface-400 mb-1">Tags (comma-separated)</label><input value={newEvidence.tags} onChange={e => setNewEvidence({ ...newEvidence, tags: e.target.value })} className="input-field text-sm" placeholder="harassment, threatening, social media" /></div>
            <div className="flex gap-3"><button onClick={addEvidence} className="btn-primary text-sm">Save Evidence</button><button onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Cancel</button></div>
          </motion.div>
        )}

        {/* Evidence List */}
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center"><Archive size={48} className="mx-auto mb-3 text-surface-600 opacity-30" /><p className="text-surface-500 text-sm">No evidence stored yet</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, i) => (
              <motion.div key={item._id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card p-5 hover:border-surface-600 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium text-sm">{item.title}</h3>
                    <span className={`badge text-xs ${catColors[item.category] || catColors.other}`}>{item.category}</span>
                  </div>
                  <button onClick={() => deleteEvidence(item._id)} className="text-surface-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
                <p className="text-surface-400 text-sm line-clamp-2 mb-2">{item.content}</p>
                <div className="flex items-center gap-4 text-xs text-surface-500">
                  <span className="flex items-center gap-1"><Clock size={12} />{new Date(item.createdAt).toLocaleString('en-IN')}</span>
                  {item.tags?.length > 0 && <span className="flex items-center gap-1"><Tag size={12} />{item.tags.join(', ')}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
