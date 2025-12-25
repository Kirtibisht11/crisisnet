import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCrisisStore } from '../state/crisisStore';

const crisisIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const resourceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const volunteerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapView = () => {
  const { crises, resources, volunteers, allocations } = useCrisisStore();
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [selectedCrisis, setSelectedCrisis] = useState(null);

  useEffect(() => {
    if (crises.length > 0) {
      const latestCrisis = crises[crises.length - 1];
      setMapCenter([latestCrisis.location.lat, latestCrisis.location.lon]);
      setSelectedCrisis(latestCrisis.id);
    }
  }, [crises]);

  const getResourcesForCrisis = (crisisId) => {
    const allocation = allocations.find(a => a.crisis_id === crisisId);
    if (!allocation) return { resources: [], volunteers: [] };

    const allocatedResources = resources.filter(r => 
      allocation.resources.some(ar => ar.id === r.id)
    );
    const allocatedVolunteers = volunteers.filter(v => 
      allocation.volunteers.some(av => av.id === v.id)
    );

    return { resources: allocatedResources, volunteers: allocatedVolunteers };
  };

  const getPriorityColor = (priority) => {
    if (priority >= 8) return '#dc2626';
    if (priority >= 5) return '#f59e0b';
    return '#3b82f6';
  };

  return (
    <div className="w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {crises.map(crisis => {
          const allocated = getResourcesForCrisis(crisis.id);
          const priority = crisis.priority || 5;
          
          return (
            <React.Fragment key={crisis.id}>
              <Circle
                center={[crisis.location.lat, crisis.location.lon]}
                radius={crisis.affected_radius || 500}
                pathOptions={{ 
                  color: getPriorityColor(priority),
                  fillColor: getPriorityColor(priority),
                  fillOpacity: 0.2
                }}
              />
              
              <Marker
                position={[crisis.location.lat, crisis.location.lon]}
                icon={crisisIcon}
                eventHandlers={{
                  click: () => setSelectedCrisis(crisis.id)
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{crisis.type}</h3>
                    <p className="text-sm text-gray-600">Priority: {priority}/10</p>
                    <p className="text-sm">Affected: {crisis.affected_population || 'Unknown'}</p>
                    <p className="text-sm text-blue-600">
                      Resources: {allocated.resources.length} | Volunteers: {allocated.volunteers.length}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {allocated.resources.map(resource => (
                <React.Fragment key={resource.id}>
                  <Marker
                    position={[resource.location.lat, resource.location.lon]}
                    icon={resourceIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold">{resource.type}</h4>
                        <p className="text-xs">ID: {resource.id}</p>
                        <p className="text-xs">Distance: {resource.distance?.toFixed(2)} km</p>
                        <p className="text-xs">ETA: {resource.eta_minutes} min</p>
                      </div>
                    </Popup>
                  </Marker>
                  
                  <Polyline
                    positions={[
                      [resource.location.lat, resource.location.lon],
                      [crisis.location.lat, crisis.location.lon]
                    ]}
                    pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '5, 10' }}
                  />
                </React.Fragment>
              ))}

              {allocated.volunteers.map(volunteer => (
                <React.Fragment key={volunteer.id}>
                  <Marker
                    position={[volunteer.location.lat, volunteer.location.lon]}
                    icon={volunteerIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold">Volunteer</h4>
                        <p className="text-xs">Skills: {volunteer.skills.join(', ')}</p>
                        <p className="text-xs">Match: {volunteer.match_score?.toFixed(0)}%</p>
                      </div>
                    </Popup>
                  </Marker>
                  
                  <Polyline
                    positions={[
                      [volunteer.location.lat, volunteer.location.lon],
                      [crisis.location.lat, crisis.location.lon]
                    ]}
                    pathOptions={{ color: '#10b981', weight: 2, dashArray: '5, 10' }}
                  />
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        })}

        {resources.filter(r => r.available).map(resource => (
          <Marker
            key={resource.id}
            position={[resource.location.lat, resource.location.lon]}
            icon={resourceIcon}
            opacity={0.5}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold">{resource.type}</h4>
                <p className="text-xs text-green-600">Available</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;