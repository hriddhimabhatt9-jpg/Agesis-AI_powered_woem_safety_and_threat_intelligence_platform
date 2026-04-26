import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import PageWrapper from '../../components/layout/PageWrapper';
import { Shield, Zap, Bell, Lock, Check } from 'lucide-react';

const defenseModes = [
  { id: 'passive', icon: Bell, label: 'Passive', desc: 'Alert only — you receive notifications about detected threats', features: ['Silent monitoring', 'Threat notifications', 'Risk score tracking'], color: 'from-blue-500 to-cyan-500' },
  { id: 'active', icon: Zap, label: 'Active', desc: 'Alert + suggest actions — AI recommends what to do next', features: ['All Passive features', 'Action suggestions', 'Safety recommendations', 'Evidence prompts'], color: 'from-amber-500 to-orange-500' },
  { id: 'aggressive', icon: Lock, label: 'Aggressive', desc: 'Auto-block + alert + save evidence — full automated protection', features: ['All Active features', 'Auto-block threats', 'Auto-save evidence', 'Immediate contact alerts', 'Auto-report generation'], color: 'from-red-500 to-pink-500' },
];

export default function AutoDefense() {
  const { user, updateUser } = useAuth();
  const [mode, setMode] = useState(user?.defenseMode || 'passive');
  const [saving, setSaving] = useState(false);

  const selectMode = async (modeId) => {
    setSaving(true);
    try { await userAPI.updateDefenseMode(modeId); } catch {}
    setMode(modeId);
    updateUser({ defenseMode: modeId });
    setSaving(false);
  };

  return (
    <PageWrapper title="Auto-Defense Mode" subtitle="Choose your protection level — from silent monitoring to full automated defense">
      <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-5">
        {defenseModes.map((dm, i) => {
          const isActive = mode === dm.id;
          return (
            <motion.div key={dm.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              onClick={() => !saving && selectMode(dm.id)}
              className={`glass-card p-6 cursor-pointer transition-all duration-300 flex flex-col ${isActive ? 'border-primary-500/30 shadow-glow-primary' : 'hover:border-surface-600'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${dm.color} flex items-center justify-center`}>
                  <dm.icon size={22} className="text-white" />
                </div>
                {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center"><Check size={14} className="text-white" /></motion.div>}
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{dm.label}</h3>
              <p className="text-surface-400 text-sm mb-4 flex-1">{dm.desc}</p>
              <ul className="space-y-1.5 mb-4">
                {dm.features.map((f, j) => <li key={j} className="text-xs text-surface-500 flex items-center gap-2"><span className={isActive ? 'text-primary-400' : 'text-surface-600'}>✓</span>{f}</li>)}
              </ul>
              <div className={`py-2 rounded-lg text-center text-sm font-medium transition-all ${isActive ? 'bg-primary-500/10 text-primary-400' : 'bg-surface-800/50 text-surface-500'}`}>
                {isActive ? '✓ Active' : 'Select'}
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageWrapper>
  );
}
