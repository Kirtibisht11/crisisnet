import { getUserLocation } from '../services/api';

export const getCurrentLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve({ lat: null, lon: null, source: "unsupported" });
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: "gps"
        });
      },
      () => {
        resolve({ lat: null, lon: null, source: "denied" });
      },
      { timeout: 5000 }
    );
  });

// Reverse-geocode using OpenStreetMap Nominatim (best-effort)
export async function reverseGeocode(lat, lon) {
  if (lat == null || lon == null) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    // prefer display_name or construct from address
    if (data.display_name) return data.display_name;
    if (data.address) return Object.values(data.address).join(', ');
    return null;
  } catch (e) {
    return null;
  }
}

// IP-based geolocation fallback (best-effort) using backend proxy
export async function ipGeolocation() {
  try {
    const data = await getUserLocation();
    return {
      lat: data.latitude || null,
      lon: data.longitude || null,
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      source: 'ip'
    };
  } catch (e) {
    return null;
  }
}

// High-level helper: try GPS first, then IP fallback, and attach human-readable place
export async function getBestLocation() {
  const gps = await getCurrentLocation();
  if (gps.lat != null && gps.lon != null) {
    const human = await reverseGeocode(gps.lat, gps.lon);
    return { lat: gps.lat, lon: gps.lon, source: gps.source || 'gps', humanLocation: human };
  }

  const ip = await ipGeolocation();
  if (ip && ip.lat != null && ip.lon != null) {
    const human = ip.city ? `${ip.city}, ${ip.region || ''} ${ip.country || ''}`.trim() : await reverseGeocode(ip.lat, ip.lon);
    return { lat: ip.lat, lon: ip.lon, source: 'ip', humanLocation: human };
  }

  return { lat: null, lon: null, source: gps.source || 'unknown', humanLocation: null };
}
