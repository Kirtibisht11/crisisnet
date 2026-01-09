import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { subscribe } from "../services/socket";
import "leaflet/dist/leaflet.css";

const crisisIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const LiveCrisisMap = ({ initialCrises = [] }) => {
  const [crises, setCrises] = useState(initialCrises);

  // 🔴 REAL CHANGE: live updates from WebSocket
  useEffect(() => {
    const unsubscribe = subscribe("crisis_update", (payload) => {
      if (!payload || !payload.crises) return;
      setCrises(payload.crises);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <div className="w-full h-[420px] rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {crises.map((c) => {
          if (!c.location?.lat) return null;

          return (
            <div key={c.id}>
              <Circle
                center={[c.location.lat, c.location.lon]}
                radius={c.affected_radius || 600}
                pathOptions={{
                  color: "#dc2626",
                  fillOpacity: 0.25,
                }}
              />

              <Marker
                position={[c.location.lat, c.location.lon]}
                icon={crisisIcon}
              >
                <Popup>
                  <strong className="capitalize">{c.type}</strong>
                  <p className="text-sm">
                    Priority: {c.priority_score || "N/A"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Updated in real time
                  </p>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LiveCrisisMap;
