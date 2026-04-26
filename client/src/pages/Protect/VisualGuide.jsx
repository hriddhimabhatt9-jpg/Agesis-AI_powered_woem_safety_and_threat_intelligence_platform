import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import { Camera, Navigation, Volume2, VolumeX, ArrowUp, ArrowLeft, ArrowRight, X, MapPin } from 'lucide-react';

export default function VisualGuide() {
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [direction, setDirection] = useState('ahead');
  const [distance, setDistance] = useState('--');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [navRunning, setNavRunning] = useState(false);
  const [destination, setDestination] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);
  const intervalRef = useRef(null);

  const startCamera = async () => {
    setCameraError('');
    setIsSimulated(false);
    try {
      const constraints = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); setCameraActive(true); }
      } catch {
        setCameraError('Camera access denied by browser. Using Simulated Environment Mode.');
        setCameraActive(true);
        setIsSimulated(true);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsSimulated(false);
    stopNav();
  };

  const speak = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9; u.pitch = 1; u.lang = 'en-IN';
    window.speechSynthesis.speak(u);
  };

  const startNav = () => {
    const dest = destination || 'your destination';
    setNavRunning(true);
    const steps = [
      { dir: 'ahead', dist: '200m', voice: `Starting navigation to ${dest}. Walk straight ahead for 200 meters.` },
      { dir: 'ahead', dist: '150m', voice: 'Continue straight for 150 meters.' },
      { dir: 'left', dist: '100m', voice: 'Turn left at the intersection in 100 meters.' },
      { dir: 'left', dist: '50m', voice: 'Turning left now. Continue for 50 meters.' },
      { dir: 'ahead', dist: '80m', voice: 'Walk straight for 80 meters. Stay on the main road.' },
      { dir: 'right', dist: '30m', voice: 'Turn right in 30 meters.' },
      { dir: 'ahead', dist: '20m', voice: `Almost there! ${dest} is 20 meters ahead on your right.` },
      { dir: 'ahead', dist: 'Arrived', voice: `You have arrived at ${dest}. Stay safe!` },
    ];

    let i = 0;
    setDirection(steps[0].dir); setDistance(steps[0].dist); speak(steps[0].voice);

    intervalRef.current = setInterval(() => {
      i++;
      if (i >= steps.length) { clearInterval(intervalRef.current); setNavRunning(false); return; }
      setDirection(steps[i].dir); setDistance(steps[i].dist); speak(steps[i].voice);
    }, 5000);
  };

  const stopNav = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setNavRunning(false);
    setDirection('ahead');
    setDistance('--');
    window.speechSynthesis?.cancel();
  };

  useEffect(() => () => { stopCamera(); stopNav(); }, []);

  const directionIcon = { ahead: ArrowUp, left: ArrowLeft, right: ArrowRight };
  const DirIcon = directionIcon[direction] || ArrowUp;
  const dirColors = { ahead: '#7c3aed', left: '#3b82f6', right: '#f59e0b' };

  return (
    <PageWrapper title="3D Visual Guidance" subtitle="Camera-based navigation with directional arrows and voice guidance">
      <div className="max-w-3xl mx-auto">
        {/* Camera View */}
        <div className="glass-card overflow-hidden mb-6 relative" style={{ minHeight: '420px', backgroundColor: isSimulated ? '#1e293b' : 'transparent' }}>
          {!isSimulated && <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover min-h-[420px] ${cameraActive ? '' : 'hidden'}`} />}
          {isSimulated && cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
              <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, #334155 25%, transparent 25%, transparent 75%, #334155 75%, #334155), linear-gradient(45deg, #334155 25%, transparent 25%, transparent 75%, #334155 75%, #334155)', backgroundSize: '60px 60px', backgroundPosition: '0 0, 30px 30px' }} />
            </div>
          )}

          {cameraActive ? (
            <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none">
              {/* Direction Arrow */}
              <motion.div
                animate={{
                  y: direction === 'ahead' ? [-8, 8, -8] : 0,
                  x: direction === 'left' ? [-15, 0, -15] : direction === 'right' ? [15, 0, 15] : 0,
                  rotate: direction === 'left' ? -90 : direction === 'right' ? 90 : 0,
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-24 h-24 rounded-full flex items-center justify-center mt-8"
                style={{ backgroundColor: `${dirColors[direction]}cc`, boxShadow: `0 0 30px ${dirColors[direction]}88` }}>
                <DirIcon size={44} className="text-white" />
              </motion.div>

              {/* Distance Info */}
              <div className="bg-surface-900/85 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 w-full max-w-sm text-center">
                {cameraError && <p className="text-amber-400 text-xs mb-2 font-medium">{cameraError}</p>}
                <p className="text-white text-3xl font-bold">{distance}</p>
                <p className="text-surface-300 text-sm capitalize mt-1">
                  {direction === 'ahead' ? '↑ Continue straight' : direction === 'left' ? '← Turn left' : '→ Turn right'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center">
              <Camera size={56} className="text-primary-400 mb-4 opacity-40" />
              <h3 className="text-white text-lg font-semibold mb-2">3D Visual Navigation</h3>
              <p className="text-surface-400 text-sm mb-4 max-w-sm">Point your camera in the walking direction. AR arrows and voice will guide you safely.</p>
              <button onClick={startCamera} className="btn-primary">Enable Camera</button>
            </div>
          )}
        </div>

        {/* Destination Input */}
        <div className="glass-card p-5 mb-4">
          <div className="flex gap-3 items-center">
            <MapPin size={18} className="text-primary-400 flex-shrink-0" />
            <input value={destination} onChange={e => setDestination(e.target.value)} className="input-field flex-1 text-sm" placeholder="Where are you going? (e.g., Home, Metro Station)" />
          </div>
        </div>

        {/* Controls */}
        <div className="grid sm:grid-cols-3 gap-4">
          <button onClick={cameraActive ? stopCamera : startCamera}
            className={`glass-card p-4 flex items-center gap-3 transition-all hover:bg-surface-800/50 ${cameraActive ? 'border-red-500/20' : 'border-primary-500/20'}`}>
            {cameraActive ? <X size={20} className="text-red-400" /> : <Camera size={20} className="text-primary-400" />}
            <span className="text-white text-sm font-medium">{cameraActive ? 'Stop Camera' : 'Start Camera'}</span>
          </button>

          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="glass-card p-4 flex items-center gap-3 hover:bg-surface-800/50 transition-all">
            {voiceEnabled ? <Volume2 size={20} className="text-emerald-400" /> : <VolumeX size={20} className="text-surface-500" />}
            <span className="text-white text-sm font-medium">Voice {voiceEnabled ? 'On' : 'Off'}</span>
          </button>

          <button onClick={navRunning ? stopNav : startNav} disabled={!cameraActive}
            className={`glass-card p-4 flex items-center gap-3 transition-all hover:bg-surface-800/50 disabled:opacity-40 ${navRunning ? 'border-red-500/20' : 'border-emerald-500/20'}`}>
            <Navigation size={20} className={navRunning ? 'text-red-400' : 'text-emerald-400'} />
            <span className="text-white text-sm font-medium">{navRunning ? 'Stop Nav' : 'Start Navigation'}</span>
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
