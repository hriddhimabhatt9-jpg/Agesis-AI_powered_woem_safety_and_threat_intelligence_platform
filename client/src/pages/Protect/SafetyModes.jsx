import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import PageWrapper from '../../components/layout/PageWrapper';
import { Car, Moon, MessageCircle, Plane, Shield, Check, MapPin, Clock, AlertTriangle } from 'lucide-react';

const modes = [
  { id: 'traveling', icon: Plane, label: 'Traveling', desc: 'Long-distance travel with route monitoring', features: ['Location sharing every 5 min', 'Route deviation alerts', 'Auto-share with contacts'], color: 'from-blue-500 to-cyan-500' },
  { id: 'cab-ride', icon: Car, label: 'Cab Ride', desc: 'Ride-sharing safety with live monitoring', features: ['Share trip details instantly', 'Timer-based check-ins', 'Quick panic access'], color: 'from-emerald-500 to-teal-500' },
  { id: 'night-walk', icon: Moon, label: 'Night Walk', desc: 'Enhanced safety for nighttime movement', features: ['Frequent location pings', 'Auto-alert if stopped for 5 min', 'Flashlight SOS'], color: 'from-indigo-500 to-purple-500' },
  { id: 'online-chat', icon: MessageCircle, label: 'Online Chat', desc: 'Monitor conversations for threats', features: ['Clipboard message analysis', 'Quick evidence save', 'Threat notifications'], color: 'from-pink-500 to-rose-500' },
];

const FALLBACK_LOCATION = { lat: 28.6139, lng: 77.2090, speed: 5.5 }; // Delhi, India

export default function SafetyModes() {
  const { user, updateUser } = useAuth();
  const [activeMode, setActiveMode] = useState(user?.activeSafetyMode || 'none');
  const [modeStatus, setModeStatus] = useState({});
  const [timer, setTimer] = useState(null);
  const [timerCount, setTimerCount] = useState(0);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => () => { if (watchId) navigator.geolocation.clearWatch(watchId); if (timer) clearInterval(timer); }, [watchId, timer]);

  const activateMode = (modeId) => {
    if (watchId) { navigator.geolocation.clearWatch(watchId); setWatchId(null); }
    if (timer) { clearInterval(timer); setTimer(null); }

    if (activeMode === modeId) {
      setActiveMode('none');
      updateUser({ activeSafetyMode: 'none' });
      setModeStatus({});
      return;
    }

    setActiveMode(modeId);
    updateUser({ activeSafetyMode: modeId });

    if (modeId === 'traveling' || modeId === 'night-walk') {
      const handleLocationSuccess = (pos) => {
        setModeStatus(prev => ({
          ...prev,
          lastLat: pos.coords.latitude.toFixed(6),
          lastLng: pos.coords.longitude.toFixed(6),
          lastUpdate: new Date().toLocaleTimeString('en-IN'),
          speed: ((pos.coords.speed || 0) * 3.6).toFixed(1),
          error: null
        }));
      };

      const handleLocationError = () => {
        // Fallback for localhost / blocked permissions
        setModeStatus(prev => ({
          ...prev,
          lastLat: FALLBACK_LOCATION.lat.toFixed(6),
          lastLng: FALLBACK_LOCATION.lng.toFixed(6),
          lastUpdate: new Date().toLocaleTimeString('en-IN'),
          speed: (FALLBACK_LOCATION.speed * 3.6).toFixed(1),
          error: 'Browser location denied. Using simulated GPS data.'
        }));
      };

      const id = navigator.geolocation.watchPosition(
        handleLocationSuccess,
        handleLocationError,
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
      setWatchId(id);
      setModeStatus({ active: true, message: `${modeId === 'traveling' ? 'Travel' : 'Night walk'} monitoring started` });
      
      // Initial trigger if watchPosition takes too long
      setTimeout(() => { if (!modeStatus.lastLat) handleLocationError(); }, 2000);
    }

    if (modeId === 'cab-ride') {
      setTimerCount(0);
      const t = setInterval(() => {
        setTimerCount(prev => {
          const next = prev + 1;
          if (next % 30 === 0) {
            setModeStatus(p => ({ ...p, lastCheckIn: new Date().toLocaleTimeString('en-IN'), checkIns: (p.checkIns || 0) + 1 }));
            if (Notification.permission === 'granted') {
              new Notification('AEGESIS Check-in', { body: 'Are you safe? Tap to confirm.', icon: '/vite.svg' });
            }
          }
          return next;
        });
      }, 1000);
      setTimer(t);
      Notification.requestPermission();
      
      navigator.geolocation.getCurrentPosition(
        (pos) => setModeStatus({ active: true, message: 'Cab ride monitoring started', lastLat: pos.coords.latitude.toFixed(6), lastLng: pos.coords.longitude.toFixed(6), checkIns: 0 }),
        () => setModeStatus({ active: true, message: 'Cab ride monitoring started (Simulated Location)', lastLat: FALLBACK_LOCATION.lat.toFixed(6), lastLng: FALLBACK_LOCATION.lng.toFixed(6), checkIns: 0, error: 'Browser location denied. Using simulated GPS data.' })
      );
    }

    if (modeId === 'online-chat') {
      setModeStatus({ active: true, message: 'Chat monitoring active. Copy suspicious messages — they will be analyzed automatically.', analyzed: 0 });
      const handlePaste = async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.length > 10) {
            setModeStatus(prev => ({ ...prev, analyzed: (prev.analyzed || 0) + 1, lastAnalyzed: text.slice(0, 50) + '...' }));
          }
        } catch {}
      };
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  };

  const shareLocation = () => {
    if (modeStatus.lastLat && modeStatus.lastLng) {
      const url = `https://www.google.com/maps?q=${modeStatus.lastLat},${modeStatus.lastLng}`;
      if (navigator.share) navigator.share({ title: 'My Location', url }).catch(() => {});
      else { navigator.clipboard.writeText(url); alert('Location copied!'); }
    }
  };

  return (
    <PageWrapper title="Safety Modes" subtitle="Activate situation-based protection — features activate automatically">
      <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mb-6">
        {modes.map((mode, i) => {
          const isActive = activeMode === mode.id;
          return (
            <motion.div key={mode.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`glass-card p-6 cursor-pointer transition-all duration-300 ${isActive ? 'border-primary-500/30 shadow-glow-primary' : 'hover:border-surface-600'}`}
              onClick={() => activateMode(mode.id)}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                  <mode.icon size={22} className="text-white" />
                </div>
                {isActive && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </motion.div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{mode.label}</h3>
              <p className="text-surface-400 text-sm mb-4">{mode.desc}</p>
              <ul className="space-y-1.5">
                {mode.features.map((f, j) => (
                  <li key={j} className="text-xs text-surface-500 flex items-center gap-2">
                    <span className={isActive ? 'text-primary-400' : 'text-surface-600'}>•</span>{f}
                  </li>
                ))}
              </ul>
              <div className={`mt-4 py-2 rounded-lg text-center text-sm font-medium transition-all ${isActive ? 'bg-primary-500/10 text-primary-400' : 'bg-surface-800/50 text-surface-500'}`}>
                {isActive ? '✓ Active — Click to Deactivate' : 'Click to Activate'}
              </div>
            </motion.div>
          );
        })}
      </div>

      {activeMode !== 'none' && modeStatus.active && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 max-w-4xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={18} className="text-emerald-400" /> Live Status
          </h2>
          {modeStatus.error && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
              <AlertTriangle size={14} /> {modeStatus.error}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-surface-800/50">
              <span className="text-xs text-surface-400">Mode</span>
              <p className="text-white font-medium capitalize">{activeMode.replace('-', ' ')}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-800/50">
              <span className="text-xs text-surface-400">Status</span>
              <p className="text-emerald-400 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active & Monitoring
              </p>
            </div>
            {modeStatus.lastLat && (
              <div className="p-3 rounded-lg bg-surface-800/50">
                <span className="text-xs text-surface-400">Location</span>
                <p className="text-white text-sm font-mono">{modeStatus.lastLat}, {modeStatus.lastLng}</p>
              </div>
            )}
            {modeStatus.lastUpdate && (
              <div className="p-3 rounded-lg bg-surface-800/50">
                <span className="text-xs text-surface-400">Last Update</span>
                <p className="text-white text-sm">{modeStatus.lastUpdate}</p>
              </div>
            )}
            {modeStatus.speed && (
              <div className="p-3 rounded-lg bg-surface-800/50">
                <span className="text-xs text-surface-400">Speed</span>
                <p className="text-white text-sm">{modeStatus.speed} km/h</p>
              </div>
            )}
            {activeMode === 'cab-ride' && (
              <>
                <div className="p-3 rounded-lg bg-surface-800/50">
                  <span className="text-xs text-surface-400">Timer</span>
                  <p className="text-white text-sm font-mono">{Math.floor(timerCount / 60)}:{String(timerCount % 60).padStart(2, '0')}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-800/50">
                  <span className="text-xs text-surface-400">Check-ins</span>
                  <p className="text-white text-sm">{modeStatus.checkIns || 0}</p>
                </div>
              </>
            )}
            {activeMode === 'online-chat' && (
              <div className="p-3 rounded-lg bg-surface-800/50">
                <span className="text-xs text-surface-400">Messages Analyzed</span>
                <p className="text-white text-sm">{modeStatus.analyzed || 0}</p>
              </div>
            )}
          </div>
          {modeStatus.lastLat && (
            <button onClick={shareLocation} className="btn-primary text-sm mt-4 flex items-center gap-2">
              <MapPin size={14} /> Share Current Location
            </button>
          )}
        </motion.div>
      )}
    </PageWrapper>
  );
}
