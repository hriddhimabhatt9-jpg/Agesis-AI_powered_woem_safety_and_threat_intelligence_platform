import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, Layers, Shield, Hospital, Building2, Locate, Share2, Route, X, Loader2, Clock, ZoomIn, ZoomOut, ExternalLink, Navigation2, Crosshair } from 'lucide-react';

const defaultCenter = [28.6139, 77.2090];

const TILE_LAYERS = {
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '&copy; CartoDB' },
  street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; OpenStreetMap' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '&copy; Esri' },
  topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '&copy; OpenTopoMap' },
};

// Fix default leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const makeIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const userIcon = new L.DivIcon({
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#7c3aed;border:3px solid white;box-shadow:0 0 12px rgba(124,58,237,0.6)"></div>',
  iconSize: [20, 20], iconAnchor: [10, 10], className: '',
});

const PLACE_CATEGORIES = [
  { key: 'police', label: 'Police', icon: Shield, color: '#3b82f6', leafletColor: 'blue' },
  { key: 'hospital', label: 'Hospitals', icon: Hospital, color: '#ef4444', leafletColor: 'red' },
  { key: 'fire_station', label: 'Fire Station', icon: Building2, color: '#f59e0b', leafletColor: 'orange' },
  { key: 'pharmacy', label: 'Pharmacy', icon: Hospital, color: '#10b981', leafletColor: 'green' },
];

// Overpass API for nearby places (free, no API key needed)
async function fetchNearbyPlaces(lat, lng, type, radius = 5000) {
  const tagMap = {
    police: 'amenity=police',
    hospital: 'amenity=hospital',
    fire_station: 'amenity=fire_station',
    pharmacy: 'amenity=pharmacy',
  };
  const tag = tagMap[type];
  if (!tag) return [];
  const query = `[out:json][timeout:10];node[${tag}](around:${radius},${lat},${lng});out body 20;`;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(query)}` });
    const data = await res.json();
    return data.elements.map(el => ({
      id: el.id,
      name: el.tags?.name || el.tags?.['name:en'] || type.replace('_', ' '),
      lat: el.lat,
      lng: el.lon,
      category: type,
      phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
      addr: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', '),
      opening: el.tags?.opening_hours || '',
    }));
  } catch { return []; }
}

// OSRM free routing
async function fetchRoute(from, to, mode = 'driving') {
  const profile = mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bike' : 'car';
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`);
    const data = await res.json();
    if (data.routes?.length) {
      const r = data.routes[0];
      return {
        coords: r.geometry.coordinates.map(c => [c[1], c[0]]),
        distance: (r.distance / 1000).toFixed(1) + ' km',
        duration: Math.round(r.duration / 60) + ' min',
        steps: r.legs[0]?.steps?.length || 0,
      };
    }
  } catch {}
  return null;
}

// Geocode place name to coordinates using Nominatim
async function geocode(query) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
    return await res.json();
  } catch { return []; }
}

// Component to recenter map
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, map.getZoom()); }, [center]);
  return null;
}

export default function SafetyMap() {
  const mapRef = useRef(null);
  const [center, setCenter] = useState(defaultCenter);
  const [userLoc, setUserLoc] = useState(null);
  const [tileKey, setTileKey] = useState('dark');
  const [showLayers, setShowLayers] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchMarker, setSearchMarker] = useState(null);
  const [searching, setSearching] = useState(false);

  // Directions
  const [showDir, setShowDir] = useState(false);
  const [originText, setOriginText] = useState('');
  const [destText, setDestText] = useState('');
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [travelMode, setTravelMode] = useState('driving');
  const [routeLoading, setRouteLoading] = useState(false);

  // Nearby
  const [activeCategories, setActiveCategories] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(loc);
        setCenter(loc);
      }, () => {}, { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const goToMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(loc);
        setCenter(loc);
      }, () => alert('Location access denied'), { enableHighAccuracy: true }
    );
  };

  // Search
  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await geocode(searchQuery);
    setSearchResults(results);
    setShowResults(true);
    setSearching(false);
    if (results.length) {
      const r = results[0];
      const loc = [parseFloat(r.lat), parseFloat(r.lon)];
      setSearchMarker({ pos: loc, name: r.display_name });
      setCenter(loc);
    }
  };

  const selectResult = (r) => {
    const loc = [parseFloat(r.lat), parseFloat(r.lon)];
    setSearchMarker({ pos: loc, name: r.display_name });
    setCenter(loc);
    setShowResults(false);
  };

  // Directions
  const getDirections = async () => {
    if (!originText.trim() || !destText.trim()) return;
    setRouteLoading(true);
    const origins = await geocode(originText);
    const dests = await geocode(destText);
    if (!origins.length || !dests.length) {
      alert('Could not find locations. Try more specific addresses.');
      setRouteLoading(false);
      return;
    }
    const from = [parseFloat(origins[0].lat), parseFloat(origins[0].lon)];
    const to = [parseFloat(dests[0].lat), parseFloat(dests[0].lon)];
    const route = await fetchRoute(from, to, travelMode);
    setRouteLoading(false);
    if (route) {
      setRouteCoords(route.coords);
      setRouteInfo(route);
      setCenter(from);
    } else {
      alert('Could not find a route. Try different locations.');
    }
  };

  const clearDirections = () => { setRouteCoords([]); setRouteInfo(null); };

  // Nearby places
  const toggleCategory = async (key) => {
    if (activeCategories.includes(key)) {
      setActiveCategories(prev => prev.filter(k => k !== key));
      setNearbyPlaces(prev => prev.filter(p => p.category !== key));
    } else {
      setActiveCategories(prev => [...prev, key]);
      setLoadingPlaces(true);
      const loc = userLoc || center;
      const places = await fetchNearbyPlaces(loc[0], loc[1], key);
      setNearbyPlaces(prev => [...prev.filter(p => p.category !== key), ...places]);
      setLoadingPlaces(false);
    }
  };

  const shareLocation = () => {
    const loc = userLoc || center;
    const url = `https://www.google.com/maps?q=${loc[0]},${loc[1]}`;
    if (navigator.share) {
      navigator.share({ title: 'My Location - AEGESIS', url });
    } else {
      navigator.clipboard.writeText(url);
      alert('📋 Location link copied!');
    }
  };

  const openInGoogleMaps = () => {
    const loc = userLoc || center;
    window.open(`https://www.google.com/maps?q=${loc[0]},${loc[1]}`, '_blank');
  };

  const tile = TILE_LAYERS[tileKey];

  return (
    <div className="fixed inset-0 pt-14 lg:pt-16 pb-16 lg:pb-0 bg-surface-900 flex flex-col">
      {/* Search Bar */}
      <div className="relative z-30 px-3 py-2 bg-surface-900/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 z-10" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              className="input-field pl-10 py-2.5 text-sm" placeholder="Search any place, address, landmark..." />
            {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary-400" />}
          </div>
          <button onClick={doSearch} className="btn-primary py-2.5 px-4 text-sm">Search</button>
          <button onClick={() => setShowDir(!showDir)} className={`btn-icon p-2.5 ${showDir ? 'bg-primary-500/20 text-primary-400' : 'text-surface-400'}`} title="Directions">
            <Route size={18} />
          </button>
          <button onClick={shareLocation} className="btn-icon p-2.5 text-surface-400" title="Share"><Share2 size={18} /></button>
          <button onClick={openInGoogleMaps} className="btn-icon p-2.5 text-surface-400" title="Open in Google Maps"><ExternalLink size={18} /></button>
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="absolute left-3 right-3 top-full mt-1 bg-surface-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50">
            {searchResults.map((r, i) => (
              <button key={i} onClick={() => selectResult(r)}
                className="w-full text-left px-4 py-3 hover:bg-surface-700/50 transition-all border-b border-white/5 last:border-0">
                <p className="text-white text-sm font-medium truncate">{r.display_name?.split(',')[0]}</p>
                <p className="text-surface-400 text-xs truncate mt-0.5">{r.display_name}</p>
              </button>
            ))}
            <button onClick={() => setShowResults(false)} className="w-full py-2 text-xs text-surface-500 hover:text-surface-300">Close results</button>
          </motion.div>
        )}
      </div>

      {/* Directions Panel */}
      <AnimatePresence>
        {showDir && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="z-20 overflow-hidden bg-surface-900/95 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-6xl mx-auto p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 z-10" />
                    <input value={originText} onChange={e => setOriginText(e.target.value)} className="input-field pl-9 py-2 text-sm" placeholder="From (e.g. Connaught Place, Delhi)" />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-400 z-10" />
                    <input value={destText} onChange={e => setDestText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && getDirections()}
                      className="input-field pl-9 py-2 text-sm" placeholder="To (e.g. India Gate, Delhi)" />
                  </div>
                </div>
                <button onClick={getDirections} disabled={!originText || !destText || routeLoading}
                  className="btn-primary py-2 px-4 text-sm whitespace-nowrap flex items-center gap-1">
                  {routeLoading ? <Loader2 size={14} className="animate-spin" /> : null} Go
                </button>
                {routeCoords.length > 0 && <button onClick={clearDirections} className="btn-icon p-2 text-red-400"><X size={16} /></button>}
              </div>
              <div className="flex gap-1">
                {[{ key: 'driving', emoji: '🚗' }, { key: 'walking', emoji: '🚶' }, { key: 'cycling', emoji: '🚲' }].map(m => (
                  <button key={m.key} onClick={() => setTravelMode(m.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${travelMode === m.key ? 'bg-primary-500/20 text-primary-400' : 'text-surface-400 hover:bg-surface-800'}`}>
                    {m.emoji} {m.key.charAt(0).toUpperCase() + m.key.slice(1)}
                  </button>
                ))}
              </div>
              {routeInfo && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="badge-primary"><Clock size={12} /> {routeInfo.duration}</span>
                  <span className="badge-success"><Route size={12} /> {routeInfo.distance}</span>
                  <span className="text-surface-400">{routeInfo.steps} step(s)</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div className="flex-1 relative z-10">
        <MapContainer center={center} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false} ref={mapRef}>
          <TileLayer url={tile.url} attribution={tile.attr} />
          <RecenterMap center={center} />

          {/* User location */}
          {userLoc && (
            <Marker position={userLoc} icon={userIcon}>
              <Popup><b>📍 You are here</b><br />Lat: {userLoc[0].toFixed(5)}<br />Lng: {userLoc[1].toFixed(5)}</Popup>
            </Marker>
          )}

          {/* Search marker */}
          {searchMarker && (
            <Marker position={searchMarker.pos}>
              <Popup>
                <b>{searchMarker.name?.split(',')[0]}</b><br />
                <span style={{ fontSize: 11, color: '#64748b' }}>{searchMarker.name}</span><br />
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${searchMarker.pos[0]},${searchMarker.pos[1]}`} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-block', marginTop: 6, padding: '3px 10px', background: '#7c3aed', color: 'white', borderRadius: 6, fontSize: 11, textDecoration: 'none' }}>
                  Navigate in Google Maps
                </a>
              </Popup>
            </Marker>
          )}

          {/* Route */}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: '#7c3aed', weight: 5, opacity: 0.85 }} />}

          {/* Nearby places */}
          {nearbyPlaces.map(place => {
            const cat = PLACE_CATEGORIES.find(c => c.key === place.category);
            return (
              <Marker key={place.id} position={[place.lat, place.lng]} icon={makeIcon(cat?.leafletColor || 'violet')}>
                <Popup>
                  <b>{place.name}</b><br />
                  {place.addr && <span style={{ fontSize: 11, color: '#64748b' }}>{place.addr}<br /></span>}
                  {place.phone && <span style={{ fontSize: 11 }}>📞 {place.phone}<br /></span>}
                  {place.opening && <span style={{ fontSize: 11 }}>🕐 {place.opening}<br /></span>}
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-block', marginTop: 6, padding: '3px 10px', background: '#7c3aed', color: 'white', borderRadius: 6, fontSize: 11, textDecoration: 'none' }}>
                    Navigate
                  </a>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
          <button onClick={goToMyLocation} className="w-10 h-10 rounded-xl bg-surface-900/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-primary-400 hover:bg-surface-800 transition-all shadow-lg" title="My Location">
            <Crosshair size={18} />
          </button>
          <button onClick={() => { const m = mapRef.current; if (m) m.setZoom(m.getZoom() + 1); }}
            className="w-10 h-10 rounded-xl bg-surface-900/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-surface-300 hover:bg-surface-800 transition-all shadow-lg">
            <ZoomIn size={18} />
          </button>
          <button onClick={() => { const m = mapRef.current; if (m) m.setZoom(m.getZoom() - 1); }}
            className="w-10 h-10 rounded-xl bg-surface-900/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-surface-300 hover:bg-surface-800 transition-all shadow-lg">
            <ZoomOut size={18} />
          </button>
          <div className="relative">
            <button onClick={() => setShowLayers(!showLayers)}
              className={`w-10 h-10 rounded-xl bg-surface-900/90 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all shadow-lg ${showLayers ? 'text-primary-400' : 'text-surface-300 hover:bg-surface-800'}`}>
              <Layers size={18} />
            </button>
            {showLayers && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute top-0 right-12 w-40 bg-surface-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-xl">
                {[
                  { id: 'dark', label: '🌙 Dark' },
                  { id: 'street', label: '🗺️ Street' },
                  { id: 'satellite', label: '🛰️ Satellite' },
                  { id: 'topo', label: '⛰️ Terrain' },
                ].map(t => (
                  <button key={t.id} onClick={() => { setTileKey(t.id); setShowLayers(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${tileKey === t.id ? 'bg-primary-500/20 text-primary-400' : 'text-surface-300 hover:bg-surface-800'}`}>
                    {t.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Safety Places Bottom Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-[1000]">
          <div className="bg-surface-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-primary-400" />
              <span className="text-xs font-semibold text-white">Nearby Safety Points</span>
              {loadingPlaces && <Loader2 size={12} className="animate-spin text-primary-400 ml-auto" />}
              <button onClick={openInGoogleMaps} className="ml-auto text-[10px] text-primary-400 hover:underline flex items-center gap-1">
                <ExternalLink size={10} /> Open Google Maps
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {PLACE_CATEGORIES.map(cat => {
                const active = activeCategories.includes(cat.key);
                const count = nearbyPlaces.filter(p => p.category === cat.key).length;
                return (
                  <button key={cat.key} onClick={() => toggleCategory(cat.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${active ? 'text-white border' : 'text-surface-400 bg-surface-800/50 hover:bg-surface-700/50'}`}
                    style={active ? { backgroundColor: cat.color + '20', borderColor: cat.color + '40', color: cat.color } : {}}>
                    <cat.icon size={13} />
                    {cat.label}
                    {active && count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: cat.color + '30' }}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
