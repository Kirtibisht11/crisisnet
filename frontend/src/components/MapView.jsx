import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCrisisStore } from '../state/crisisStore';
import { subscribe } from "../services/socket";
import CrisisHeatmap from "./CrisisHeatmap";



/* ---------- ICONS ---------- */

const createIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const heatPoints = useMemo(() => {
  return crises
    .filter(c => c.location?.lat && c.location?.lon)
    .map(c => ({
      lat: c.location.lat,
      lon: c.location.lon,
      intensity: Math.min((c.priority_score || 5) / 10, 1),
    }));
}, [crises]);


const crisisIcon = createIcon('red');
const resourceIcon = createIcon('blue');
const volunteerIcon = createIcon('green');
const userIcon = createIcon('grey');
const [userLocation, setUserLocation] = useState(null);

/* ---------- REAL-TIME CRISIS UPDATES (WEBSOCKET) ---------- */
useEffect(() => {
  const unsubscribe = subscribe((event) => {
    if (!event || event.event !== "NEW_CRISIS") return;

    const p = event.payload;

    const liveCrisis = {
      id: `ws-${Date.now()}`,
      type: p.type,
      priority_score: p.priority_score ?? 5,
      affected_radius: p.affected_radius ?? 500,
      affected_population: p.affected_population,
      location: {
        lat: p.lat,
        lon: p.lon
      }
    };

    // Push directly into store (preferred)
    if (store?.addCrisis) {
      store.addCrisis(liveCrisis);
    }
  });

  return () => unsubscribe();
}, []);


const getResourceIcon = (type) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('ambulance') || t.includes('hospital') || t.includes('medical')) return createIcon('red');
  if (t.includes('police')) return createIcon('violet');
  if (t.includes('fire')) return createIcon('orange');
  if (t.includes('shelter')) return createIcon('green');
  if (t.includes('boat') || t.includes('rescue')) return createIcon('gold');
  return createIcon('blue');
};

// Helper to update map center when props change
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

/* ---------- COMPONENT ---------- */

const MapView = ({ crises: propCrises, resources: propResources, userLocation: propUserLocation }) => {
  const store = useCrisisStore();
  
  const crises = propCrises || store.crises;
  const resources = propResources || store.resources;
  const volunteers = store.volunteers; // Usually from store
  const allocations = store.allocations; // Usually from store

  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India default
  const [selectedCrisis, setSelectedCrisis] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  /* ---------- USER LOCATION ---------- */
  useEffect(() => {
    if (propUserLocation) {
      setUserLocation(propUserLocation);
      setMapCenter(propUserLocation);
      return;
    }

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setMapCenter(loc);
      },
      () => {
        console.warn('Location permission denied');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    ); 
  }, [propUserLocation]);

  /* ---------- AUTO CENTER ON CRISIS IF EXISTS ---------- */
  useEffect(() => {
    if (!userLocation && !propUserLocation && crises.length > 0) {
      const latest = crises[crises.length - 1];
      if (latest.location && latest.location.lat) {
        setMapCenter([latest.location.lat, latest.location.lon]);
        setSelectedCrisis(latest.id);
      }
    }
  }, [crises, userLocation, propUserLocation]);

  /* ---------- ALLOCATION LOOKUP ---------- */
  const allocationMap = useMemo(() => {
    const map = {};
    allocations.forEach(a => {
      map[a.crisis_id] = a;
    });
    return map;
  }, [allocations]);

  /* ---------- HELPERS ---------- */
  const getPriorityColor = (priority = 5) => {
    if (priority >= 8) return '#dc2626';
    if (priority >= 5) return '#f59e0b';
    return '#3b82f6';
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={mapCenter} />

        {/* ---------- USER LOCATION ---------- */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <strong>You are here</strong>
            </Popup>
          </Marker>
        )}

        {/* ---------- CRISES ---------- */}
        {crises.map(crisis => {
          if (!crisis.location || !crisis.location.lat) return null;
          const allocation = allocationMap[crisis.id];
          const priority = crisis.priority_score || 5;

          return (
            <React.Fragment key={crisis.id}>
              <Circle
                center={[crisis.location.lat, crisis.location.lon]}
                radius={crisis.affected_radius || 500}
                pathOptions={{
                  color: getPriorityColor(priority),
                  fillOpacity: 0.25
                }}
              />

              <Marker
                position={[crisis.location.lat, crisis.location.lon]}
                icon={crisisIcon}
                eventHandlers={{ click: () => setSelectedCrisis(crisis.id) }}
              >
                <Popup>
                  <strong>{crisis.type}</strong>
                  <p>Priority: {priority}/10</p>
                  <p>Affected: {crisis.affected_population ?? 'N/A'}</p>
                  {allocation && (
                    <p className="text-blue-600">
                      Resources: {allocation.resources.length} | Volunteers: {allocation.volunteers.length}
                    </p>
                  )}
                </Popup>
              </Marker>

              {/* ---------- ALLOCATED RESOURCES ---------- */}
              {allocation?.resources.map(r => {
                const full = resources.find(x => x.id === r.id);
                if (!full) return null;

                return (
                  <React.Fragment key={r.id}>
                    <Marker
                      position={[full.location.lat, full.location.lon]}
                      icon={resourceIcon}
                    >
                      <Popup>
                        <strong>{full.type}</strong>
                        <p>ID: {full.id}</p>
                        <p>Distance: {r.distance_km?.toFixed(2)} km</p>
                        <p>ETA: {r.eta_minutes} min</p>
                      </Popup>
                    </Marker>

                    <Polyline
                      positions={[
                        [full.location.lat, full.location.lon],
                        [crisis.location.lat, crisis.location.lon]
                      ]}
                      pathOptions={{ color: '#3b82f6', dashArray: '4,6' }}
                    />
                  </React.Fragment>
                );
              })}

              {/* ---------- ALLOCATED VOLUNTEERS ---------- */}
              {allocation?.volunteers.map(v => {
                const full = volunteers.find(x => x.id === v.id);
                if (!full) return null;

                return (
                  <React.Fragment key={v.id}>
                    <Marker
                      position={[full.location.lat, full.location.lon]}
                      icon={volunteerIcon}
                    >
                      <Popup>
                        <strong>Volunteer</strong>
                        <p>Skills: {full.skills.join(', ')}</p>
                        <p>Match: {v.match_score?.toFixed(0)}%</p>
                      </Popup>
                    </Marker>

                    <Polyline
                      positions={[
                        [full.location.lat, full.location.lon],
                        [crisis.location.lat, crisis.location.lon]
                      ]}
                      pathOptions={{ color: '#10b981', dashArray: '4,6' }}
                    />
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* ---------- AVAILABLE RESOURCES ---------- */}
        {resources.map(r => (
          <Marker
            key={r.id}
            position={[r.location.lat, r.location.lon]}
            icon={getResourceIcon(r.type)}
            opacity={0.5}
          >
            <Popup>
              <strong className="capitalize">{r.type}</strong>
              <p className={r.available ? "text-green-600" : "text-red-600"}>
                {r.available ? 'Available' : 'Busy'}
              </p>
              {r.capacity && <p className="text-xs">Capacity: {r.capacity}</p>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
