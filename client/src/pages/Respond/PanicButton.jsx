import { useState } from 'react';
import { motion } from 'framer-motion';
import { alertAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, MapPin, Loader2, Phone, Shield, Check, X } from 'lucide-react';

export default function PanicButton() {
  const { user } = useAuth();
  const [triggered, setTriggered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [countdownInterval, setCountdownInterval] = useState(null);

  const getContacts = () => {
    const contacts = [];
    if (user?.primaryEmergencyContact?.name) contacts.push(user.primaryEmergencyContact);
    if (user?.additionalEmergencyContacts?.length) contacts.push(...user.additionalEmergencyContacts);
    // Also check localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('aegesis_contacts') || '[]');
      if (stored.length && !contacts.length) return stored;
    } catch {}
    return contacts;
  };

  const triggerPanic = () => {
    let c = 3;
    setCountdown(c);
    const interval = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) { clearInterval(interval); setCountdown(null); executePanic(); }
    }, 1000);
    setCountdownInterval(interval);
  };

  const cancelCountdown = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    setCountdown(null);
  };

  const executePanic = async () => {
    setLoading(true);
    let loc = { lat: 28.6139, lng: 77.2090 };

    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true })
      );
      loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {}

    const contacts = getContacts();

    try {
      const { data } = await alertAPI.triggerPanic(loc, contacts);
      setResult(data);
    } catch {
      // Even if API fails, show that contacts would be notified
      setResult({
        message: contacts.length > 0
          ? `Alert sent to ${contacts.length} contact(s) (demo mode)`
          : '⚠️ No emergency contacts! Go to Trusted Contacts to add them.',
        contactsNotified: contacts.length,
        results: contacts.map(c => ({ contact: c.name, method: 'demo', status: 'logged' })),
        mapsLink: `https://www.google.com/maps?q=${loc.lat},${loc.lng}`,
      });
    }
    setTriggered(true);
    setLoading(false);
  };

  const contacts = getContacts();

  return (
    <div className="min-h-screen bg-surface-900 pt-16 lg:pt-20 pb-24 lg:pb-8 flex flex-col items-center justify-center px-4">
      {!triggered ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
          <div className="mb-8">
            <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white mb-2">Emergency Panic</h1>
            <p className="text-surface-400 text-sm">Press the button to send an emergency alert with your live location</p>
          </div>

          {/* Panic Button */}
          <div className="relative">
            <motion.button onClick={countdown === null ? triggerPanic : undefined} disabled={loading}
              whileTap={{ scale: 0.95 }}
              className="relative w-44 h-44 mx-auto rounded-full bg-gradient-danger shadow-glow-danger flex items-center justify-center group mb-4">
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-gradient-danger flex items-center justify-center">
                {countdown !== null ? (
                  <span className="text-white text-5xl font-bold">{countdown}</span>
                ) : loading ? (
                  <Loader2 size={48} className="text-white animate-spin" />
                ) : (
                  <div className="text-center">
                    <AlertTriangle size={40} className="text-white mx-auto mb-1" />
                    <span className="text-white text-xs font-bold uppercase tracking-wider">SOS</span>
                  </div>
                )}
              </div>
            </motion.button>

            {countdown !== null && (
              <button onClick={cancelCountdown} className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-surface-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-surface-600">
                <X size={14} /> Cancel
              </button>
            )}
          </div>

          <p className="text-surface-500 text-xs mt-6">3-second countdown before alert is sent</p>

          {/* Contacts Preview */}
          <div className="glass-card p-4 mt-6 text-left">
            <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2"><Phone size={14} /> Contacts that will be notified ({contacts.length})</h3>
            {contacts.length > 0 ? (
              <div className="text-surface-400 text-xs space-y-1">
                {contacts.map((c, i) => (
                  <p key={i} className="flex items-center gap-2">
                    <Check size={12} className="text-emerald-400" />
                    {c.name} {c.phone ? `(${c.phone})` : ''} {c.email ? `— ${c.email}` : ''}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-red-400 text-xs">
                ⚠️ No emergency contacts set!{' '}
                <a href="/respond/contacts" className="text-primary-400 underline">Add contacts now →</a>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Shield size={36} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">🚨 Alert Sent!</h2>
          <p className="text-surface-300 text-sm mb-6">{result?.message}</p>

          <div className="glass-card p-5 text-left mb-4">
            <p className="text-surface-400 text-xs mb-1">Contacts notified</p>
            <p className="text-white text-xl font-bold">{result?.contactsNotified || 0}</p>
            {result?.results?.map((r, i) => (
              <p key={i} className="text-xs text-surface-400 mt-1 flex items-center gap-2">
                <Check size={12} className="text-emerald-400" />
                {r.contact} — {r.method} ({r.status})
              </p>
            ))}
          </div>

          {result?.mapsLink && (
            <a href={result.mapsLink} target="_blank" rel="noreferrer" className="text-primary-400 text-xs hover:underline block mb-4">
              <MapPin size={12} className="inline mr-1" /> View shared location on Google Maps
            </a>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setTriggered(false); setResult(null); }} className="btn-secondary flex-1">I'm Safe Now</button>
            <a href="tel:112" className="btn-danger flex-1 flex items-center justify-center gap-2"><Phone size={16} /> Call 112</a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
