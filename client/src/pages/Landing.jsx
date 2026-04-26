import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Brain, MapPin, AlertTriangle, Lock, Heart, ChevronRight, Zap, Eye, FileText } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI Threat Detection', desc: 'Detect harassment, manipulation & grooming in messages using advanced NLP.', color: 'from-violet-500 to-purple-600' },
  { icon: Shield, title: 'Real-Time Protection', desc: 'Adaptive safety modes for traveling, cab rides, night walks & online chats.', color: 'from-blue-500 to-cyan-500' },
  { icon: MapPin, title: 'Live Navigation', desc: 'GPS tracking, safe route suggestions & 3D visual guidance with Google Maps.', color: 'from-emerald-500 to-teal-500' },
  { icon: AlertTriangle, title: 'Instant Emergency', desc: 'One-tap panic button sends your live location to all emergency contacts.', color: 'from-red-500 to-orange-500' },
  { icon: Lock, title: 'Evidence Vault', desc: 'Securely store messages, logs & generate legal PDF reports with timestamps.', color: 'from-amber-500 to-yellow-500' },
  { icon: Heart, title: 'Recovery Support', desc: 'AI-powered emotional support with calm guidance and professional resources.', color: 'from-pink-500 to-rose-500' },
];

const stats = [
  { value: '6+', label: 'AI Detection Models' },
  { value: '24/7', label: 'Real-Time Protection' },
  { value: '< 3s', label: 'Emergency Response' },
  { value: '100%', label: 'Privacy-First' },
];

const layers = [
  { icon: Eye, name: 'PREDICT', desc: 'AI detects threats before they escalate', color: 'text-violet-400' },
  { icon: Shield, name: 'PROTECT', desc: 'Adaptive real-time safety shield', color: 'text-blue-400' },
  { icon: Zap, name: 'RESPOND', desc: 'Instant emergency alert system', color: 'text-red-400' },
  { icon: FileText, name: 'PROVE', desc: 'Evidence collection & legal reports', color: 'text-amber-400' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-surface-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold"><span className="text-white">AEG</span><span className="text-primary-400">ESIS</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm py-2 px-4">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-6">
              <Zap size={14} /> AI-Powered Safety Platform
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Your Digital
            <span className="block gradient-text">Safety Shield</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AEGESIS combines AI threat intelligence with real-time protection to keep you safe — online and offline. 
            Predict. Protect. Respond. Prove.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base px-8 py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
              Start Free <ChevronRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto text-center">
              Sign In
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-white/5 bg-surface-800/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</div>
              <div className="text-surface-400 text-sm mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* System Architecture */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">4-Layer Defense System</h2>
            <p className="text-surface-400 max-w-xl mx-auto">Every layer works together to create an impenetrable safety net</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {layers.map((layer, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass-card p-6 text-center group hover:border-primary-500/20 transition-all duration-300">
                <layer.icon size={28} className={`${layer.color} mx-auto mb-3`} />
                <h3 className="font-bold text-white text-sm tracking-wider mb-1">{layer.name}</h3>
                <p className="text-surface-400 text-xs">{layer.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-surface-800/20">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Powerful Features</h2>
            <p className="text-surface-400 max-w-xl mx-auto">Everything you need for comprehensive safety</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="glass-card-hover p-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="glass-card p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Feel Safe?</h2>
              <p className="text-surface-400 mb-8 max-w-lg mx-auto">Join AEGESIS today and activate your personal AI safety shield. It takes less than 2 minutes.</p>
              <Link to="/register" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2">
                Create Free Account <ChevronRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary-400" />
            <span className="text-sm font-semibold text-surface-400">AEGESIS</span>
          </div>
          <p className="text-surface-500 text-xs">© 2026 AEGESIS. All rights reserved. Built with ❤️ for safety.</p>
        </div>
      </footer>
    </div>
  );
}
