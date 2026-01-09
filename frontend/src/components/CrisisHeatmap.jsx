import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const CrisisHeatmap = ({ points = [] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const heatLayer = L.heatLayer(
      points.map(p => [p.lat, p.lon, p.intensity || 0.6]),
      {
        radius: 30,
        blur: 20,
        maxZoom: 13,
        gradient: {
          0.2: "blue",
          0.4: "lime",
          0.6: "orange",
          0.8: "red"
        }
      }
    );

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

export default CrisisHeatmap;
