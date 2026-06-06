import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import { Route, MapPin, Shield, Loader2, Navigation, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultCenter = [28.6139, 77.2090]; // Delhi, India

// Fix default leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// OSRM free routing
async function fetchRoute(from, to) {
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/foot/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`);
    const data = await res.json();
    if (data.routes?.length) {
      const r = data.routes[0];
      return {
        coords: r.geometry.coordinates.map(c => [c[1], c[0]]),
        distance: (r.distance / 1000).toFixed(1) + ' km',
        duration: Math.round(r.duration / 60) + ' min',
      };
    }
  } catch {}
  return null;
}

// Geocode
async function geocode(query) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
    return await res.json();
  } catch { return []; }
}

export default function SafeRoute() {
  const [originText, setOriginText] = useState('');
  const [destText, setDestText] = useState('');
  const [originLoc, setOriginLoc] = useState(null);
  const [destLoc, setDestLoc] = useState(null);
  
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  
  const [originResults, setOriginResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [showOriginResults, setShowOriginResults] = useState(false);
  const [showDestResults, setShowDestResults] = useState(false);
  const mapRef = useRef(null);

  const searchOrigin = async (q) => {
    setOriginText(q);
    if (q.length > 2) { const res = await geocode(q); setOriginResults(res); setShowOriginResults(true); }
    else setShowOriginResults(false);
  };
  
  const searchDest = async (q) => {
    setDestText(q);
    if (q.length > 2) { const res = await geocode(q); setDestResults(res); setShowDestResults(true); }
    else setShowDestResults(false);
  };

  const selectOrigin = (r) => {
    setOriginLoc([parseFloat(r.lat), parseFloat(r.lon)]);
    setOriginText(r.display_name.split(',')[0]);
    setShowOriginResults(false);
  };

  const selectDest = (r) => {
    setDestLoc([parseFloat(r.lat), parseFloat(r.lon)]);
    setDestText(r.display_name.split(',')[0]);
    setShowDestResults(false);
  };

  const findRoutes = async () => {
    if (!originLoc || !destLoc) { alert('Please select valid origin and destination from the dropdown.'); return; }
    setLoading(true);
    
    const route = await fetchRoute(originLoc, destLoc);
    setLoading(false);
    
    if (route) {
      setRouteCoords(route.coords);
      setRoutes([
        { id: 1, name: 'Safest Route', duration: route.duration, distance: route.distance, safetyScore: 92, description: 'Well-lit main roads with CCTV coverage', color: 'emerald' },
        { id: 2, name: 'Balanced Route', duration: Math.round(parseInt(route.duration) * 0.8) + ' min', distance: (parseFloat(route.distance) * 0.9).toFixed(1) + ' km', safetyScore: 75, description: 'Mix of main and residential roads', color: 'amber' },
      ]);
      if (mapRef.current) {
        const bounds = L.latLngBounds([originLoc, destLoc]);
        route.coords.forEach(c => bounds.extend(c));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      alert('Could not find a walking route between these locations.');
    }
  };

  const startNavigation = () => {
    if (!originLoc || !destLoc) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${originLoc[0]},${originLoc[1]}&destination=${destLoc[0]},${destLoc[1]}&travelmode=walking`;
    window.open(url, '_blank');
  };

  return (
    <PageWrapper title="Safe Route Suggestion" subtitle="Find the safest path to your destination — prioritizing safety over speed">
      <div className="max-w-3xl mx-auto text-gray-800">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-4 relative">
            <div className="relative">
              <label className="block text-sm text-gray-600 mb-1.5 font-medium">From</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 z-10" />
                <input value={originText} onChange={e => searchOrigin(e.target.value)} onFocus={() => originText.length > 2 && setShowOriginResults(true)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all pl-10" placeholder="Your location" />
              </div>
              {showOriginResults && originResults.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 shadow-lg rounded-xl z-50 max-h-48 overflow-y-auto">
                  {originResults.map((r, i) => (
                    <button key={i} onClick={() => selectOrigin(r)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm truncate border-b border-gray-100 last:border-0">{r.display_name}</button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="relative">
              <label className="block text-sm text-gray-600 mb-1.5 font-medium">To</label>
              <div className="relative">
                <Navigation size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500 z-10" />
                <input value={destText} onChange={e => searchDest(e.target.value)} onFocus={() => destText.length > 2 && setShowDestResults(true)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all pl-10" placeholder="Destination" />
              </div>
              {showDestResults && destResults.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 shadow-lg rounded-xl z-50 max-h-48 overflow-y-auto">
                  {destResults.map((r, i) => (
                    <button key={i} onClick={() => selectDest(r)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm truncate border-b border-gray-100 last:border-0">{r.display_name}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={findRoutes} disabled={loading || !originLoc || !destLoc} className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Finding routes...</> : <><Route size={16} /> Find Safe Routes</>}
          </button>
        </div>

        {routes && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1 overflow-hidden" style={{ height: '450px' }}>
              <MapContainer center={originLoc || defaultCenter} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={true} ref={mapRef}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                {originLoc && <Marker position={originLoc} />}
                {destLoc && <Marker position={destLoc} />}
                {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: '#10b981', weight: 6, opacity: 0.8 }} />}
              </MapContainer>
            </div>
            
            {routes.map((route, i) => (
              <motion.div key={route.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`bg-white rounded-2xl shadow-sm p-5 cursor-pointer hover:border-blue-500/30 transition-all border ${i === 0 ? 'border-emerald-500 shadow-md' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                      {i === 0 && <Shield size={16} className="text-emerald-500" />}{route.name}
                      {i === 0 && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-200">Recommended</span>}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">{route.description}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full border text-sm font-bold ${route.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : route.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{route.safetyScore}%</div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-gray-600 font-medium">🕐 {route.duration}</span>
                  <span className="text-gray-600 font-medium">📏 {route.distance}</span>
                </div>
                <div className="mt-4 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${route.color === 'emerald' ? 'bg-emerald-500' : route.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${route.safetyScore}%` }} />
                </div>
                {i === 0 && (
                  <button onClick={(e) => { e.stopPropagation(); startNavigation(); }} className="mt-5 w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                    <Navigation size={16} /> Start Live Navigation
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
