import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone } from 'lucide-react';

const CitizenProfileCard = ({ user }) => {
  const [locationDisplay, setLocationDisplay] = useState("Detecting...");

  useEffect(() => {
    if (!user) return;

    const loc = user.location;

    // Handle string location directly (e.g. "Ward 12, Downtown")
    if (typeof loc === 'string' && loc.trim() !== '') {
      setLocationDisplay(loc);
      return;
    }

    // 1. Prefer Manual Location Name
    if (loc?.manualLocation) {
      setLocationDisplay(loc.manualLocation);
      return;
    }

    // 2. Resolve Coordinates
    let lat, lon;
    if (loc?.lat !== undefined) { lat = loc.lat; lon = loc.lon; }
    else if (user.latitude !== undefined) { lat = user.latitude; lon = user.longitude; }

    if (lat !== undefined && lon !== undefined) {
      if (lat === 0 && lon === 0) {
        setLocationDisplay("Location not set");
      } else {
        // Reverse Geocode
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          .then(res => res.json())
          .then(data => {
            const addr = data.address || {};
            
            // Construct a more descriptive address: "Road, Area, City"
            const parts = [];
            if (addr.road) parts.push(addr.road);
            if (addr.neighbourhood && addr.neighbourhood !== addr.road) parts.push(addr.neighbourhood);
            if (addr.suburb && addr.suburb !== addr.neighbourhood) parts.push(addr.suburb);
            
            const city = addr.city || addr.town || addr.village || addr.county;
            if (city && !parts.includes(city)) parts.push(city);

            const name = parts.slice(0, 3).join(', ');
            setLocationDisplay(name || data.display_name?.split(',').slice(0, 2).join(',') || `${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`);
          })
          .catch(() => {
            setLocationDisplay(`${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`);
          });
      }
    } else {
      setLocationDisplay("Location not set");
    }
  }, [user]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6 text-slate-700">
        <User className="w-5 h-5" />
        <h3 className="font-bold">Citizen Profile</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-500 uppercase font-semibold">Name</label>
          <p className="text-slate-900 font-medium">{user?.name || user?.username || "Guest Citizen"}</p>
        </div>
        {user?.phone && (
          <div>
            <label className="text-xs text-slate-500 uppercase font-semibold">Phone</label>
            <p className="text-slate-900 font-medium flex items-center gap-1">
              <Phone className="w-3 h-3" /> {user.phone}
            </p>
          </div>
        )}
        <div>
          <label className="text-xs text-slate-500 uppercase font-semibold">Location</label>
          <p className="text-slate-900 font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {locationDisplay}
          </p>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase font-semibold">Status</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-slate-700">Safe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenProfileCard;