import { useState } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import { EyeOff, Calculator, AlertTriangle } from 'lucide-react';

export default function InvisibleMode() {
  const [active, setActive] = useState(false);
  const [display, setDisplay] = useState('0');
  const [panicCode, setPanicCode] = useState('911');

  const handleCalcPress = (val) => {
    if (val === 'C') { setDisplay('0'); return; }
    if (val === '=') {
      if (display === panicCode) {
        alert('🚨 PANIC ALERT TRIGGERED! (In real mode, this sends alerts to all emergency contacts)');
        setDisplay('0');
        return;
      }
          try { setDisplay(String(Function('"use strict"; return (' + display + ')')())); } catch { setDisplay('Error'); }
      return;
    }
    setDisplay(prev => prev === '0' ? val : prev + val);
  };

  if (active) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        {/* Disguised as calculator */}
        <div className="w-full max-w-xs bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gray-50 p-6">
            <div className="text-right text-4xl font-light text-gray-800 font-mono overflow-hidden">{display}</div>
          </div>
          <div className="grid grid-cols-4 gap-px bg-gray-200">
            {['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='].map(btn => (
              <button key={btn} onClick={() => handleCalcPress(btn === '⌫' ? '' : btn === '×' ? '*' : btn === '÷' ? '/' : btn)}
                className={`p-5 text-xl font-medium transition-colors ${['÷', '×', '-', '+', '='].includes(btn) ? 'bg-orange-500 text-white active:bg-orange-600' : btn === 'C' ? 'bg-gray-300 text-gray-800 active:bg-gray-400' : 'bg-white text-gray-800 active:bg-gray-100'} ${btn === '0' ? 'col-span-1' : ''}`}>
                {btn}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setActive(false)} className="mt-8 text-xs text-gray-400 hover:text-gray-600">Exit disguised mode</button>
      </div>
    );
  }

  return (
    <PageWrapper title="Invisible Mode" subtitle="Disguise the app as a calculator — enter your panic code to silently trigger an alert">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-surface-700 flex items-center justify-center">
              <Calculator size={24} className="text-surface-300" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Calculator Disguise</h2>
              <p className="text-surface-400 text-sm">App will look like a normal calculator</p>
            </div>
          </div>
          <p className="text-surface-400 text-sm mb-6 leading-relaxed">
            When activated, AEGESIS transforms into a fully functional calculator. Entering your secret panic code + "=" silently triggers emergency alerts to all your contacts with your live location.
          </p>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Set Your Panic Code</span>
            </div>
            <div className="flex items-center gap-3">
              <input type="text" value={panicCode} onChange={e => setPanicCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                className="input-field text-center text-2xl font-mono tracking-widest w-40" maxLength={6} placeholder="911" />
              <span className="text-surface-400 text-xs">Enter this + "=" in calculator to trigger</span>
            </div>
          </div>

          <button onClick={() => setActive(true)} className="btn-primary w-full flex items-center justify-center gap-2">
            <EyeOff size={18} /> Activate Invisible Mode
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
