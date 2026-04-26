import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import { MapPin, Navigation, Share2, Loader2, Locate } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '500px', borderRadius: '0.75rem' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi, India

export default function LiveTracking() {
  const isApiKeyValid = import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'your-google-maps-api-key';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: isApiKeyValid ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY : '',
    libraries: ['places', 'visualization'],
    region: 'IN',
    language: 'en'
  });

  const [map, setMap] = useState(null);
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [path, setPath] = useState([]);
  const [error, setError] = useState('');
  const [speed, setSpeed] = useState(0);
  const [safeZones, setSafeZones] = useState([]);
  const watchIdRef = useRef(null);

  const findNearbySafeZones = (loc) => {
    if (!window.google || !loc) return;
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    
    // Search for police stations
    service.nearbySearch({ location: loc, radius: 3000, type: ['police'] }, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setSafeZones(prev => {
          const existingIds = new Set(prev.map(p => p.place_id));
          const newZones = results.filter(r => !existingIds.has(r.place_id)).map(r => ({ ...r, category: 'police' }));
          return [...prev, ...newZones];
        });
      }
    });

    // Search for hospitals
    service.nearbySearch({ location: loc, radius: 3000, type: ['hospital'] }, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setSafeZones(prev => {
          const existingIds = new Set(prev.map(p => p.place_id));
          const newZones = results.filter(r => !existingIds.has(r.place_id)).map(r => ({ ...r, category: 'hospital' }));
          return [...prev, ...newZones];
        });
      }
    });
  };

  const onLoad = useCallback(function callback(map) { setMap(map); }, []);
  const onUnmount = useCallback(function callback(map) { setMap(null); }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported by this browser.'); return; }
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setSpeed(pos.coords.speed || 0);
        if (map) map.panTo(loc);
        findNearbySafeZones(loc);
      },
      (err) => {
        console.warn('Geolocation Error:', err);
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
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setSpeed(pos.coords.speed || 0);
        setPath(prev => [...prev, loc]);
        if (map) map.panTo(loc);
        
        // Update safe zones every few points to save API calls
        if (path.length % 5 === 0) findNearbySafeZones(loc);
      },
      (err) => {
        console.warn('Tracking Error:', err);
        setError('Lost location signal. Check browser permissions.');
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  };

  const shareLocation = () => {
    if (!location) return;
    const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    if (navigator.share) {
      navigator.share({ title: 'My Live Location - AEGESIS', text: `I'm sharing my location for safety`, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('📋 Location link copied to clipboard!');
    }
  };

  useEffect(() => { getCurrentLocation(); return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); }; }, []);

  return (
    <PageWrapper title="Live Location Tracking" subtitle="Real-time GPS tracking with Google Maps">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-1 overflow-hidden" style={{ minHeight: '500px' }}>
          {!isApiKeyValid ? (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[500px] text-center p-6">
              <MapPin size={48} className="text-red-500 mb-4 opacity-50" />
              <h4 className="text-white font-semibold mb-2">Maps API Key Required</h4>
              <p className="text-surface-400 text-sm mb-6 max-w-xs">To enable live tracking in India, please provide a valid Google Maps API key in your environment settings.</p>
              <div className="bg-surface-800 p-4 rounded-lg border border-surface-700 text-left w-full max-w-sm">
                <p className="text-xs text-primary-400 font-mono mb-1">Status: DEMO_MODE_ACTIVE</p>
                <p className="text-xs text-surface-400">Centered on: New Delhi, India</p>
              </div>
            </div>
          ) : !isLoaded ? (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[500px]">
              <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
              <p className="text-surface-300">Loading Google Maps...</p>
            </div>
          ) : (
            <GoogleMap mapContainerStyle={containerStyle} center={location || defaultCenter} zoom={15} onLoad={onLoad} onUnmount={onUnmount}
              options={{ 
                styles: [
                  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
                ],
                disableDefaultUI: true,
                zoomControl: true
              }}>
              {location && <Marker position={location} icon={{ path: window.google?.maps?.SymbolPath?.CIRCLE, scale: 8, fillColor: '#7c3aed', fillOpacity: 1, strokeWeight: 2, strokeColor: '#ffffff' }} />}
              {path.length > 1 && <Polyline path={path} options={{ strokeColor: '#7c3aed', strokeOpacity: 0.8, strokeWeight: 4 }} />}
              {safeZones.map((zone, idx) => (
                <Marker key={idx} position={zone.geometry.location} title={zone.name}
                  icon={{
                    url: zone.category === 'police' ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                    scaledSize: new window.google.maps.Size(24, 24)
                  }}
                />
              ))}
            </GoogleMap>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Navigation size={18} className="text-primary-400" /> Controls</h3>
            <div className="space-y-3">
              <button onClick={getCurrentLocation} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"><Locate size={16} /> Get My Location</button>
              <button onClick={toggleTracking} className={`w-full flex items-center justify-center gap-2 text-sm py-3 rounded-xl font-semibold transition-all ${tracking ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'btn-primary shadow-lg shadow-primary-500/20'}`}>{tracking ? '⏹ Stop Tracking' : '▶ Start Live Tracking'}</button>
              <button onClick={shareLocation} disabled={!location} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"><Share2 size={16} /> Share Location</button>
              <button onClick={() => location && window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`, '_blank')} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm border-emerald-500/20 text-emerald-400"><Navigation size={16} /> Open in Native Maps</button>
            </div>
          </div>

          {error && <div className="glass-card p-4 border-red-500/20"><p className="text-red-400 text-xs">{error}</p></div>}

          {location && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3 text-sm">Current Location</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-surface-400">Latitude</span><span className="text-white font-mono">{location.lat.toFixed(6)}</span></div>
                <div className="flex justify-between"><span className="text-surface-400">Longitude</span><span className="text-white font-mono">{location.lng.toFixed(6)}</span></div>
                {tracking && <>
                  <div className="flex justify-between"><span className="text-surface-400">Points</span><span className="text-primary-400 font-bold">{path.length}</span></div>
                  <div className="flex justify-between"><span className="text-surface-400">Speed</span><span className="text-white">{(speed * 3.6).toFixed(1)} km/h</span></div>
                </>}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
