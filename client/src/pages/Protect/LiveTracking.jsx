import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import { MapPin, Navigation, Share2, Loader2, Locate } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultCenter = [28.6139, 77.2090]; // Delhi, India

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { if (center && map) map.flyTo(center, 15); }, [center, map]);
  return null;
}

const userIcon = new L.DivIcon({
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#7c3aed;border:3px solid white;box-shadow:0 0 12px rgba(124,58,237,0.6)"></div>',
  iconSize: [20, 20], iconAnchor: [10, 10], className: '',
});

export default function LiveTracking() {
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [path, setPath] = useState([]);
  const [error, setError] = useState('');
  const [speed, setSpeed] = useState(0);
  const watchIdRef = useRef(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported by this browser.'); return; }
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setLocation(loc);
        setSpeed(pos.coords.speed || 0);
      },
      (err) => {
        setError('Location access denied. Please ensure you allow location access in your browser or device settings.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleTracking = () => {
    if (tracking) {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setTracking(false);
      return;
    }
    setTracking(true);
    setPath([]);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setLocation(loc);
        setSpeed(pos.coords.speed || 0);
        setPath(prev => [...prev, loc]);
      },
      (err) => {
        setError('Lost location signal. Check browser permissions.');
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  };

  const shareLocation = () => {
    if (!location) return;
    const url = `https://www.google.com/maps?q=${location[0]},${location[1]}`;
    if (navigator.share) {
      navigator.share({ title: 'My Live Location - AEGESIS', text: `I'm sharing my location for safety`, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('📋 Location link copied to clipboard!');
    }
  };

  useEffect(() => { getCurrentLocation(); return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); }; }, []);

  return (
    <PageWrapper title="Live Location Tracking" subtitle="Real-time GPS tracking">
      <div className="grid lg:grid-cols-3 gap-6 text-gray-800">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-1 overflow-hidden relative" style={{ minHeight: '500px' }}>
          <MapContainer center={location || defaultCenter} zoom={15} style={{ width: '100%', height: '100%', minHeight: '500px' }} zoomControl={true}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <RecenterMap center={location} />
            {location && <Marker position={location} icon={userIcon} />}
            {path.length > 1 && <Polyline positions={path} pathOptions={{ color: '#7c3aed', weight: 4, opacity: 0.8 }} />}
          </MapContainer>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2"><Navigation size={18} className="text-blue-500" /> Controls</h3>
            <div className="space-y-3">
              <button onClick={getCurrentLocation} className="w-full px-4 py-3 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"><Locate size={16} /> Get My Location</button>
              <button onClick={toggleTracking} className={`w-full flex items-center justify-center gap-2 text-sm py-3 rounded-xl font-semibold transition-all ${tracking ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'}`}>{tracking ? '⏹ Stop Tracking' : '▶ Start Live Tracking'}</button>
              <button onClick={shareLocation} disabled={!location} className="w-full px-4 py-3 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"><Share2 size={16} /> Share Location</button>
              <button onClick={() => location && window.open(`https://www.google.com/maps/dir/?api=1&destination=${location[0]},${location[1]}`, '_blank')} className="w-full px-4 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"><Navigation size={16} /> Open in Native Maps</button>
            </div>
          </div>

          {error && <div className="bg-red-50 rounded-2xl border border-red-200 p-4"><p className="text-red-600 text-xs">{error}</p></div>}

          {location && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-gray-900 font-semibold mb-3 text-sm">Current Location</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Latitude</span><span className="text-gray-900 font-mono">{location[0].toFixed(6)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Longitude</span><span className="text-gray-900 font-mono">{location[1].toFixed(6)}</span></div>
                {tracking && <>
                  <div className="flex justify-between"><span className="text-gray-500">Points</span><span className="text-blue-600 font-bold">{path.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Speed</span><span className="text-gray-900">{(speed * 3.6).toFixed(1)} km/h</span></div>
                </>}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
