import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, Layers, Shield, Hospital, Building2, Locate, Share2, Route, X, Loader2, Clock, ZoomIn, ZoomOut, ExternalLink, Navigation2, Crosshair, Menu, ArrowLeft, MoreVertical, ChevronDown, Square } from 'lucide-react';

const defaultCenter = [28.6139, 77.2090];

const TILE_LAYERS = {
  street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; OpenStreetMap' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '&copy; Esri' },
  topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '&copy; OpenTopoMap' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '&copy; CartoDB' },
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
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#4285F4;border:3px solid white;box-shadow:0 0 12px rgba(66,133,244,0.6)"></div>',
  iconSize: [20, 20], iconAnchor: [10, 10], className: '',
});

const searchIconMarker = new L.DivIcon({
  html: '<div style="color: #EA4335;"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>',
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32], className: '',
});

const PLACE_CATEGORIES = [
  { key: 'police', label: 'Police', icon: Shield, color: '#4285F4', leafletColor: 'blue' },
  { key: 'hospital', label: 'Hospitals', icon: Hospital, color: '#EA4335', leafletColor: 'red' },
  { key: 'fire_station', label: 'Fire Station', icon: Building2, color: '#FBBC05', leafletColor: 'orange' },
  { key: 'pharmacy', label: 'Pharmacy', icon: Hospital, color: '#34A853', leafletColor: 'green' },
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
        steps: r.legs[0]?.steps?.map(s => s.maneuver.instruction) || [],
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
  const [tileKey, setTileKey] = useState('street'); // Default to light street view like Google Maps
  const [showLayers, setShowLayers] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchMarker, setSearchMarker] = useState(null);
  const [searching, setSearching] = useState(false);
  const [activePanel, setActivePanel] = useState('search'); // 'search', 'details', 'directions'

  // Directions
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

  // Live Tracking
  const [tracking, setTracking] = useState(false);
  const [path, setPath] = useState([]);
  const watchIdRef = useRef(null);
  const [speed, setSpeed] = useState(0);
  const [trackingError, setTrackingError] = useState('');

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(loc);
        setCenter(loc);
        setOriginText('Your Location');
      }, () => {}, { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  const toggleTracking = () => {
    if (tracking) {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setTracking(false);
      setSpeed(0);
      setTrackingError('');
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }
      setTracking(true);
      setTrackingError('');
      setPath(userLoc ? [userLoc] : []);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setUserLoc(loc);
          setCenter(loc);
          setSpeed(pos.coords.speed || 0);
          setPath(prev => {
             if (prev.length > 0) {
                const last = prev[prev.length - 1];
                if (last[0] === loc[0] && last[1] === loc[1]) return prev;
             }
             return [...prev, loc];
          });
          setTrackingError('');
        },
        (err) => {
          console.warn('Tracking error:', err);
          setTrackingError('Location signal lost or timed out.');
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
      );
    }
  };

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
  const doSearch = async (query = searchQuery) => {
    if (!query.trim()) return;
    setSearching(true);
    const results = await geocode(query);
    setSearchResults(results);
    setShowResults(true);
    setSearching(false);
    if (results.length) {
      selectResult(results[0]);
    }
  };

  const selectResult = (r) => {
    const loc = [parseFloat(r.lat), parseFloat(r.lon)];
    const name = r.display_name?.split(',')[0];
    setSearchMarker({ pos: loc, name: name, fullAddress: r.display_name });
    setCenter(loc);
    setShowResults(false);
    setSearchQuery(name);
    setDestText(name);
    setActivePanel('details');
  };

  const openDirections = () => {
    setActivePanel('directions');
    if (!originText && userLoc) setOriginText('Your Location');
  };

  const closeDirections = () => {
    setActivePanel(searchMarker ? 'details' : 'search');
    setRouteCoords([]);
    setRouteInfo(null);
  };

  const closeDetails = () => {
    setActivePanel('search');
    setSearchMarker(null);
    setSearchQuery('');
    setRouteCoords([]);
    setRouteInfo(null);
  };

  // Directions
  const getDirections = async () => {
    if (!originText.trim() || !destText.trim()) return;
    setRouteLoading(true);
    
    let from = userLoc;
    if (originText.toLowerCase() !== 'your location') {
      const origins = await geocode(originText);
      if (origins.length) from = [parseFloat(origins[0].lat), parseFloat(origins[0].lon)];
    }

    let to = searchMarker?.pos;
    if (destText !== searchMarker?.name) {
      const dests = await geocode(destText);
      if (dests.length) to = [parseFloat(dests[0].lat), parseFloat(dests[0].lon)];
    }

    if (!from || !to) {
      alert('Could not find locations. Try more specific addresses.');
      setRouteLoading(false);
      return;
    }
    
    const route = await fetchRoute(from, to, travelMode);
    setRouteLoading(false);
    if (route) {
      setRouteCoords(route.coords);
      setRouteInfo(route);
      // Fit bounds to route
      if (mapRef.current) {
        const bounds = L.latLngBounds([from, to]);
        route.coords.forEach(c => bounds.extend(c));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      alert('Could not find a route. Try different locations.');
    }
  };

  // Auto-fetch route when mode or destinations change (if directions panel is active)
  useEffect(() => {
    if (activePanel === 'directions' && originText && destText && !showResults) {
      getDirections();
    }
  }, [travelMode, activePanel]); // simplified dependency to avoid infinite loops

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

  const openInGoogleMaps = (loc, name) => {
    const q = loc ? `${loc[0]},${loc[1]}` : (userLoc ? `${userLoc[0]},${userLoc[1]}` : center.join(','));
    window.open(`https://www.google.com/maps?q=${q}`, '_blank');
  };

  const tile = TILE_LAYERS[tileKey];

  return (
    <div className="fixed inset-0 pt-14 lg:pt-0 bg-gray-100 flex text-gray-800">
      
      {/* Map Area */}
      <div className="flex-1 absolute inset-0 z-0 h-[calc(100vh-3.5rem)] md:h-screen w-full">
        <MapContainer center={center} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false} ref={mapRef}>
          <TileLayer url={tile.url} attribution={tile.attr} />
          <RecenterMap center={center} />

          {/* User location */}
          {userLoc && (
            <Marker position={userLoc} icon={userIcon}>
              <Popup className="google-popup"><b>📍 Your Location</b></Popup>
            </Marker>
          )}

          {/* Search marker */}
          {searchMarker && (
            <Marker position={searchMarker.pos} icon={searchIconMarker}>
              <Popup className="google-popup">
                <div className="text-sm font-medium">{searchMarker.name?.split(',')[0]}</div>
                <div className="text-xs text-gray-500 mt-1">{searchMarker.name}</div>
              </Popup>
            </Marker>
          )}

          {/* Route */}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: '#4285F4', weight: 6, opacity: 0.8 }} />}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: '#1a73e8', weight: 2, opacity: 1 }} />}

          {/* Tracking Path */}
          {tracking && path.length > 1 && <Polyline positions={path} pathOptions={{ color: '#7c3aed', weight: 4, opacity: 0.8 }} />}

        </MapContainer>

        {/* Live Tracking Info Panel */}
        {tracking && (
          <div className="absolute top-20 right-4 z-[2000] bg-white rounded-xl shadow-lg border border-red-200 p-4 pointer-events-auto flex flex-col gap-2 w-48">
            <div className="flex items-center gap-2 text-red-600 font-bold mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div>
              Live Tracking
            </div>
            {trackingError ? (
              <div className="text-xs text-red-500 font-medium">{trackingError}</div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Speed:</span>
                  <span className="text-gray-900 font-medium">{(speed * 3.6).toFixed(1)} km/h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Points:</span>
                  <span className="text-gray-900 font-medium">{path.length}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Bottom Right Controls */}
        <div className="absolute bottom-6 right-4 flex flex-col gap-3 z-[1000] pointer-events-auto">
          
          <button onClick={toggleTracking} className={`w-10 h-10 rounded-full shadow-md border flex items-center justify-center transition-colors ${tracking ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white border-gray-200 text-blue-600 hover:bg-blue-50'}`} title={tracking ? "Stop Live Tracking" : "Start Live Tracking"}>
            {tracking ? <Square size={16} /> : <Crosshair size={18} />}
          </button>

          <button onClick={goToMyLocation} className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors" title="My Location">
            <Locate size={18} />
          </button>
          
          <div className="flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <button onClick={() => { const m = mapRef.current; if (m) m.setZoom(m.getZoom() + 1); }}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors border-b border-gray-200">
              <ZoomIn size={18} />
            </button>
            <button onClick={() => { const m = mapRef.current; if (m) m.setZoom(m.getZoom() - 1); }}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <ZoomOut size={18} />
            </button>
          </div>

          <div className="relative group">
            <button className="w-10 h-10 rounded-xl bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
              <Layers size={18} />
            </button>
            <div className="absolute bottom-0 right-12 w-32 bg-white rounded-lg shadow-xl border border-gray-200 p-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity mb-2">
              {[
                { id: 'street', label: 'Default' },
                { id: 'satellite', label: 'Satellite' },
                { id: 'topo', label: 'Terrain' },
                { id: 'dark', label: 'Dark Mode' },
              ].map(t => (
                <button key={t.id} onClick={() => setTileKey(t.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-all ${tileKey === t.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Panel on the left */}
        <div className="absolute top-20 md:top-6 left-4 md:left-6 z-[2000] w-[calc(100%-2rem)] md:w-[400px] flex flex-col gap-2 pointer-events-none">
          
          {/* Search Panel */}
          {activePanel === 'search' && (
            <div className="flex flex-col w-full">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex items-center h-14 px-4 overflow-hidden pointer-events-auto">
                <Menu size={20} className="text-gray-500 hover:text-gray-800 cursor-pointer shrink-0" />
                <input 
                  value={searchQuery} 
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    if(e.target.value.length > 2) doSearch(e.target.value);
                    else setShowResults(false);
                  }}
                  onFocus={() => { if(searchQuery.length > 2) setShowResults(true); }}
                  onKeyDown={e => e.key === 'Enter' && doSearch()}
                  className="flex-1 bg-transparent border-none outline-none px-3 text-base text-gray-800 placeholder-gray-500 w-full" 
                  placeholder="Search AEGESIS Maps" 
                />
                {searchQuery && <X size={18} className="text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => {setSearchQuery(''); setShowResults(false);}} />}
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <button onClick={() => doSearch()} className="text-blue-500 hover:text-blue-600 shrink-0">
                  {searching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
                <button onClick={openDirections} className="ml-3 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 shrink-0">
                  <Route size={18} />
                </button>
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="mt-2 w-full overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-200 max-h-[60vh] pointer-events-auto">
                  {searchResults.map((r, i) => (
                    <button key={i} onClick={() => selectResult(r)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-all border-b border-gray-100 flex items-start gap-3">
                      <MapPin size={20} className="text-gray-400 mt-0.5 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-gray-800 text-sm font-medium truncate">{r.display_name?.split(',')[0]}</p>
                        <p className="text-gray-500 text-xs truncate mt-0.5">{r.display_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Place Details Panel */}
          {activePanel === 'details' && searchMarker && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col pointer-events-auto overflow-hidden">
              {/* Simple Top Bar with Back Button */}
              <div className="p-3 border-b border-gray-200 shrink-0 bg-white flex items-center gap-3 shadow-sm z-10 relative">
                 <button onClick={closeDetails} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors shrink-0">
                   <ArrowLeft size={18} />
                 </button>
                 <span className="font-medium text-gray-700">Back to search</span>
              </div>
              
              <div className="p-5 border-b border-gray-200 shrink-0">
                <h1 className="text-2xl font-normal text-gray-900 mb-1">{searchMarker.name}</h1>
                <p className="text-sm text-gray-600 mb-4">{searchMarker.fullAddress}</p>
                
                <div className="flex justify-around mt-4">
                  <button onClick={openDirections} className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:bg-blue-700 transition-colors shadow-sm">
                      <Route size={20} />
                    </div>
                    <span className="text-xs font-medium text-blue-600 mt-1">Directions</span>
                  </button>
                  <button onClick={() => {}} className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-full border border-gray-300 text-gray-700 flex items-center justify-center group-hover:bg-gray-50 transition-colors shadow-sm">
                      <Locate size={18} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 mt-1">Save</span>
                  </button>
                  <button onClick={shareLocation} className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 rounded-full border border-gray-300 text-gray-700 flex items-center justify-center group-hover:bg-gray-50 transition-colors shadow-sm">
                      <Share2 size={18} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 mt-1">Share</span>
                  </button>
                </div>
              </div>

              <div className="p-0 overflow-y-auto flex-1">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${searchMarker.pos[0]},${searchMarker.pos[1]}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <ExternalLink size={20} className="text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">Open in official Google Maps</span>
                </a>
                <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
                  <MapPin size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{searchMarker.pos[0].toFixed(5)}, {searchMarker.pos[1].toFixed(5)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Directions Panel */}
          {activePanel === 'directions' && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col pointer-events-auto overflow-hidden">
              {/* Header (Blue) */}
              <div className="bg-blue-600 text-white p-4 shrink-0 shadow-md z-10">
                <div className="flex items-center gap-4 mb-4">
                  <button onClick={closeDirections} className="hover:bg-blue-700 p-1.5 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex gap-4">
                    {[{ key: 'driving', icon: '🚗' }, { key: 'walking', icon: '🚶' }, { key: 'cycling', icon: '🚲' }].map(m => (
                      <button key={m.key} onClick={() => {setTravelMode(m.key); setTimeout(getDirections, 100);}}
                        className={`p-2 rounded-full transition-all ${travelMode === m.key ? 'bg-blue-800 shadow-inner' : 'hover:bg-blue-500'}`}>
                        <span className="text-lg">{m.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 relative">
                  <div className="flex flex-col items-center justify-center gap-1 mt-2">
                    <div className="w-2 h-2 rounded-full border-2 border-white"></div>
                    <div className="w-0.5 h-6 bg-blue-400 border-dotted border-l-2"></div>
                    <div className="w-2 h-2 bg-red-500"></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <input value={originText} onChange={e => setOriginText(e.target.value)} onKeyDown={e => e.key === 'Enter' && getDirections()} className="w-full bg-blue-700 text-white placeholder-blue-300 border-none outline-none px-3 py-1.5 rounded text-sm focus:bg-white focus:text-gray-900 transition-colors" placeholder="Choose starting point" />
                    <input value={destText} onChange={e => setDestText(e.target.value)} onKeyDown={e => e.key === 'Enter' && getDirections()} className="w-full bg-blue-700 text-white placeholder-blue-300 border-none outline-none px-3 py-1.5 rounded text-sm focus:bg-white focus:text-gray-900 transition-colors" placeholder="Choose destination" />
                  </div>
                  <button className="self-center p-2 hover:bg-blue-700 rounded-full text-white">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Route Options / Steps */}
              <div className="bg-gray-50 overflow-y-auto max-h-[60vh]">
                {routeLoading ? (
                  <div className="p-8 flex flex-col items-center justify-center text-gray-500 gap-3">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <p className="text-sm">Finding best route...</p>
                  </div>
                ) : routeInfo ? (
                  <div>
                    <div className="bg-white p-4 border-b border-gray-200">
                      <h2 className="text-2xl font-medium text-green-700">{routeInfo.duration}</h2>
                      <p className="text-sm text-gray-500">{routeInfo.distance}</p>
                      <p className="text-sm text-gray-600 mt-2">Fastest route now due to traffic conditions.</p>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step-by-step</h3>
                      {routeInfo.steps?.map((step, idx) => (
                        <div key={idx} className="flex gap-3 border-b border-gray-100 pb-4 last:border-0">
                          <Navigation2 size={18} className="text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{__html: step}}></p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    Enter an origin and destination to see route.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Global styles for leaflet popup to match Google Maps */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 12px;
          line-height: 1.4;
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #999;
          padding: 4px 4px 0 0;
        }
      `}} />
    </div>
  );
}
