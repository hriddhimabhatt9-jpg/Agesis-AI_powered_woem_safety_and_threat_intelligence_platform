import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/layout/PageWrapper';
import { Brain, Shield, MapPin, AlertTriangle, Archive, Heart, ChevronRight, Activity, Eye, Zap, TrendingUp } from 'lucide-react';

const quickActions = [
  { to: '/predict/analyzer', icon: Brain, label: 'Analyze Message', desc: 'Check a message for threats', color: 'from-violet-500 to-purple-600' },
  { to: '/protect/tracking', icon: MapPin, label: 'Start Tracking', desc: 'Share your live location', color: 'from-emerald-500 to-teal-500' },
  { to: '/respond/panic', icon: AlertTriangle, label: 'Panic Button', desc: 'Send emergency alert', color: 'from-red-500 to-orange-500' },
  { to: '/prove/vault', icon: Archive, label: 'Evidence Vault', desc: 'Store & manage evidence', color: 'from-amber-500 to-yellow-500' },
];

const predictTools = [
  { to: '/predict/analyzer', icon: Brain, label: 'Message Analyzer', color: 'text-violet-400' },
  { to: '/predict/intent', icon: Eye, label: 'Intent Decoder', color: 'text-blue-400' },
  { to: '/predict/escalation', icon: TrendingUp, label: 'Escalation Tracker', color: 'text-amber-400' },
  { to: '/predict/shadow', icon: Activity, label: 'Digital Shadow', color: 'text-cyan-400' },
  { to: '/predict/impersonation', icon: Shield, label: 'Impersonation Detector', color: 'text-pink-400' },
  { to: '/predict/simulation', icon: Zap, label: 'Attack Simulation', color: 'text-red-400' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const fadeUp = (i) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06 } });

  return (
    <PageWrapper>
      {/* Welcome */}
      <div className="mb-8">
        <motion.h1 {...fadeUp(0)} className="text-2xl sm:text-3xl font-bold text-white">
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'User'}</span>
        </motion.h1>
        <motion.p {...fadeUp(1)} className="text-surface-400 mt-1 text-sm sm:text-base">
          Your safety dashboard — everything at a glance
        </motion.p>
      </div>

      {/* Status Cards */}
      <motion.div {...fadeUp(2)} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Safety Mode', value: user?.activeSafetyMode === 'none' ? 'Inactive' : user?.activeSafetyMode?.replace('-', ' '), icon: Shield, color: 'text-emerald-400' },
          { label: 'Defense Mode', value: user?.defenseMode || 'Passive', icon: Zap, color: 'text-amber-400' },
          { label: 'Threat Level', value: 'Low', icon: Activity, color: 'text-emerald-400' },
          { label: 'Evidence Items', value: '0', icon: Archive, color: 'text-blue-400' },
        ].map((card, i) => (
          <div key={i} className={`glass-card p-4 sm:p-5 ${i < 2 ? 'animate-safety-pulse' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} className={card.color} />
              <span className="text-surface-400 text-xs font-medium">{card.label}</span>
            </div>
            <p className="text-white font-semibold text-lg capitalize">{card.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div {...fadeUp(3)} className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link key={i} to={action.to} className="glass-card-hover p-5 group">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                <action.icon size={20} className="text-white" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{action.label}</h3>
              <p className="text-surface-400 text-xs">{action.desc}</p>
              <ChevronRight size={16} className="text-surface-600 group-hover:text-primary-400 mt-2 transition-colors" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* AI Predict Tools */}
      <motion.div {...fadeUp(4)} className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">AI Prediction Tools</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {predictTools.map((tool, i) => (
            <Link key={i} to={tool.to} className="glass-card flex items-center gap-3 p-4 hover:border-primary-500/20 transition-all duration-200">
              <tool.icon size={20} className={tool.color} />
              <span className="text-surface-200 text-sm font-medium">{tool.label}</span>
              <ChevronRight size={14} className="text-surface-600 ml-auto" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Safety & Protection */}
      <motion.div {...fadeUp(5)} className="grid sm:grid-cols-2 gap-4">
        <Link to="/protect/modes" className="glass-card-hover p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Shield size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Safety Modes</h3>
              <p className="text-surface-400 text-xs">Configure your protection level</p>
            </div>
          </div>
          <div className="text-xs text-surface-500">Traveling • Cab Ride • Night Walk • Online Chat</div>
        </Link>

        <Link to="/recovery/support" className="glass-card-hover p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Heart size={20} className="text-pink-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Emotional Support</h3>
              <p className="text-surface-400 text-xs">AI-guided wellness & recovery</p>
            </div>
          </div>
          <div className="text-xs text-surface-500">Stress detection • Calm guidance • Next steps</div>
        </Link>
      </motion.div>
    </PageWrapper>
  );
}
