import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import { Route, MapPin, Shield, Loader2, Navigation } from 'lucide-react';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '300px', borderRadius: '0.75rem', marginBottom: '1.5rem' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi, India

export default function SafeRoute() {
  const isApiKeyValid = import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'your-google-maps-api-key';
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: isApiKeyValid ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY : '',
  });

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState(null);

  const findRoutes = async () => {
    if (!origin.trim() || !destination.trim()) return;
    setLoading(true);

    if (window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        { origin, destination, travelMode: window.google.maps.TravelMode.WALKING },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          }
        }
      );
    }

    setTimeout(() => {
      setRoutes([
        { id: 1, name: 'Safest Route', duration: '25 min', distance: '6.2 km', safetyScore: 92, description: 'Well-lit main roads with CCTV coverage', color: 'emerald' },
        { id: 2, name: 'Balanced Route', duration: '18 min', distance: '4.8 km', safetyScore: 75, description: 'Mix of main and residential roads', color: 'amber' },
        { id: 3, name: 'Fastest Route', duration: '12 min', distance: '3.5 km', safetyScore: 55, description: 'Includes poorly-lit residential areas', color: 'red' },
      ]);
      setLoading(false);
    }, 1500);
  };

  const scoreColor = { emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20', red: 'text-red-400 bg-red-500/10 border-red-500/20' };

  return (
    <PageWrapper title="Safe Route Suggestion" subtitle="Find the safest path to your destination — prioritizing safety over speed">
      <div className="max-w-3xl mx-auto">
        <div className="glass-card p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm text-surface-300 mb-1.5">From</label>
              <div className="relative"><MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input value={origin} onChange={e => setOrigin(e.target.value)} className="input-field pl-10" placeholder="Your location" />
              </div>
            </div>
            <div><label className="block text-sm text-surface-300 mb-1.5">To</label>
              <div className="relative"><Navigation size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400" />
                <input value={destination} onChange={e => setDestination(e.target.value)} className="input-field pl-10" placeholder="Destination" />
              </div>
            </div>
          </div>
          <button onClick={findRoutes} disabled={loading || !origin.trim() || !destination.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Finding routes...</> : <><Route size={16} /> Find Safe Routes</>}
          </button>
        </div>

        {routes && (
          <div className="space-y-4">
            {!isApiKeyValid ? (
              <div className="glass-card p-6 text-center">
                <MapPin size={32} className="text-red-500 mx-auto mb-2 opacity-50" />
                <p className="text-surface-300 text-sm">Safe Route Map requires a valid Google Maps API Key.</p>
                <p className="text-surface-500 text-xs mt-1">Showing theoretical safe routes for India below.</p>
              </div>
            ) : isLoaded ? (
              <div className="glass-card p-1">
                <GoogleMap mapContainerStyle={containerStyle} center={defaultCenter} zoom={13} options={{ styles: [{ elementType: "geometry", stylers: [{ color: "#242f3e" }] },{ elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },{ elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }] }}>
                  {directions && <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: '#10b981', strokeWeight: 5 } }} />}
                </GoogleMap>
              </div>
            ) : (
              <div className="flex justify-center p-8">
                <Loader2 size={24} className="animate-spin text-primary-500" />
              </div>
            )}
            {routes.map((route, i) => (
              <motion.div key={route.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`glass-card p-5 cursor-pointer hover:border-primary-500/20 transition-all ${i === 0 ? 'border-emerald-500/20' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      {i === 0 && <Shield size={16} className="text-emerald-400" />}{route.name}
                      {i === 0 && <span className="badge-success text-xs">Recommended</span>}
                    </h3>
                    <p className="text-surface-400 text-sm mt-1">{route.description}</p>
                  </div>
                  <div className={`badge ${scoreColor[route.color]} text-sm font-bold`}>{route.safetyScore}%</div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-surface-400">🕐 {route.duration}</span>
                  <span className="text-surface-400">📏 {route.distance}</span>
                </div>
                <div className="mt-3 w-full h-2 bg-surface-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${route.color === 'emerald' ? 'bg-emerald-500' : route.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${route.safetyScore}%` }} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
