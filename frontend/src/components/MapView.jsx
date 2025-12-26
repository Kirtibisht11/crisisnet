import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCrisisStore } from '../state/crisisStore';

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

const crisisIcon = createIcon('red');
const resourceIcon = createIcon('blue');
const volunteerIcon = createIcon('green');

/* ---------- COMPONENT ---------- */

const MapView = () => {
  const { crises, resources, volunteers, allocations } = useCrisisStore();
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [selectedCrisis, setSelectedCrisis] = useState(null);

  /* ---------- AUTO CENTER ---------- */
  useEffect(() => {
    if (crises.length > 0) {
      const latest = crises[crises.length - 1];
      setMapCenter([latest.location.lat, latest.location.lon]);
      setSelectedCrisis(latest.id);
    }
  }, [crises]);

  /* ---------- ALLOCATION LOOKUP (MEMOIZED) ---------- */
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
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ---------- CRISES ---------- */}
        {crises.map(crisis => {
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
        {resources.filter(r => r.available).map(r => (
          <Marker
            key={r.id}
            position={[r.location.lat, r.location.lon]}
            icon={resourceIcon}
            opacity={0.5}
          >
            <Popup>
              <strong>{r.type}</strong>
              <p className="text-green-600">Available</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
