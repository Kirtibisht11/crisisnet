import React, { useState, useEffect } from 'react';
import {
  MapPin, Clock, Bell, CheckCircle, AlertTriangle, 
  User, Phone, Siren, LogOut, Maximize2,
  Shield, Activity
} from 'lucide-react';

/* ================= CRISIS STYLES ================= */
const getCrisisStyle = (type) => {
  const styles = {
    flood: { label: 'Flood Alert', color: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    fire: { label: 'Fire Alert', color: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
    medical: { label: 'Medical Emergency', color: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
    earthquake: { label: 'Earthquake', color: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    landslide: { label: 'Landslide', color: 'border-stone-500', bg: 'bg-stone-50', text: 'text-stone-700' }
  };
  return styles[type?.toLowerCase()] || { label: 'Alert', color: 'border-slate-400', bg: 'bg-slate-50', text: 'text-slate-700' };
};

/* ================= LOCATION RENDERER ================= */
const LocationRenderer = ({ alert }) => {
  const [displayLocation, setDisplayLocation] = useState(alert.location || "Location not available");

  useEffect(() => {
    if (alert.location) setDisplayLocation(alert.location);
    else if (alert.lat && alert.lon)
      setDisplayLocation(`${alert.lat.toFixed(4)}, ${alert.lon.toFixed(4)}`);
  }, [alert]);

  return <span>{displayLocation}</span>;
};

/* ================= ALERT CARD ================= */
const AlertCard = ({ alert }) => {
  const style = getCrisisStyle(alert.crisis_type);
  const confidence = Math.round(alert.trust_score * 100);

  return (
    <div className={`rounded-xl border-l-4 ${style.color} bg-slate-800/50 backdrop-blur border border-slate-700 p-5 mb-4 hover:border-red-500/50 transition-all`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-bold uppercase ${style.bg} ${style.text} mb-2`}>
            {style.label}
          </div>
          <p className="text-white text-base">{alert.message}</p>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${confidence > 80 ? 'bg-green-600' : 'bg-yellow-600'}`}>
            {confidence}% Trust
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-300">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-red-400" />
          <LocationRenderer alert={alert} />
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {new Date(alert.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

/* ================= CITIZEN PROFILE CARD ================= */
const CitizenProfileCard = ({ user }) => {
  const [locationDisplay, setLocationDisplay] = useState("Detecting...");

  useEffect(() => {
    if (!user) return;
    const loc = user.location;
    
    if (typeof loc === 'string' && loc.trim() !== '') {
      setLocationDisplay(loc);
      return;
    }
    
    if (loc?.manualLocation) {
      setLocationDisplay(loc.manualLocation);
      return;
    }

    let lat, lon;
    if (loc?.lat !== undefined) { lat = loc.lat; lon = loc.lon; }
    else if (user.latitude !== undefined) { lat = user.latitude; lon = user.longitude; }

    if (lat !== undefined && lon !== undefined) {
      setLocationDisplay(`${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`);
    } else {
      setLocationDisplay("Location not set");
    }
  }, [user]);

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 transition-all">
      <div className="flex items-center gap-2 mb-4 text-blue-400">
        <User className="w-5 h-5" />
        <h3 className="font-bold text-white">Profile</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 uppercase font-semibold">Name</label>
          <p className="text-white font-medium">{user?.name || user?.username || "Guest Citizen"}</p>
        </div>
        {user?.phone && (
          <div>
            <label className="text-xs text-slate-400 uppercase font-semibold">Phone</label>
            <p className="text-white font-medium flex items-center gap-1">
              <Phone className="w-3 h-3" /> {user.phone}
            </p>
          </div>
        )}
        <div>
          <label className="text-xs text-slate-400 uppercase font-semibold">Location</label>
          <p className="text-white font-medium flex items-center gap-1 text-sm">
            <MapPin className="w-3 h-3 text-red-400" /> {locationDisplay}
          </p>
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase font-semibold">Status</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-green-400 font-medium">Safe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= EMERGENCY PANEL ================= */
const EmergencyPanel = () => (
  <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-5 hover:border-red-500/50 transition-all">
    <div className="flex items-center gap-2 mb-4 text-red-400">
      <Siren className="w-6 h-6" />
      <h3 className="font-bold text-lg text-white">Emergency</h3>
    </div>
    <div className="space-y-3">
      {[
        { label: 'Police', number: '100', bg: 'bg-blue-600', hover: 'hover:bg-blue-700' },
        { label: 'Fire', number: '101', bg: 'bg-orange-600', hover: 'hover:bg-orange-700' },
        { label: 'Ambulance', number: '108', bg: 'bg-red-600', hover: 'hover:bg-red-700' }
      ].map((item) => (
        <a 
          href={`tel:${item.number}`} 
          key={item.label} 
          className={`flex items-center justify-between p-4 rounded-lg ${item.bg} ${item.hover} text-white transition cursor-pointer group shadow-lg`}
        >
          <div>
            <div className="text-xs font-bold uppercase opacity-90">{item.label}</div>
            <div className="text-2xl font-bold">{item.number}</div>
          </div>
          <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </a>
      ))}
    </div>
  </div>
);

/* ================= MAP PREVIEW ================= */
const MapPreview = ({ onClick }) => (
  <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-5 hover:border-green-500/50 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 text-green-400">
        <MapPin className="w-5 h-5" />
        <h3 className="font-bold text-white">Crisis Map</h3>
      </div>
      <button
        onClick={onClick}
        className="p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg h-48 flex items-center justify-center cursor-pointer hover:border-green-500/50 transition" onClick={onClick}>
      <div className="text-center">
        <MapPin className="w-12 h-12 text-green-400 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">Click to view full map</p>
      </div>
    </div>
  </div>
);

/* ================= CRISIS COMPANION COMPACT ================= */
const CrisisCompanion = () => {
  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl">🛟</span>
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">Crisis Net Support</h3>
          <p className="text-slate-400 text-xs">Emergency Assistance Bot</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700">
        <div className="text-center text-slate-400 text-sm py-8">
          <Activity className="w-12 h-12 mx-auto mb-3 text-orange-400" />
          <p>Select a crisis type below to start</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { emoji: '🌊', label: 'Flood', color: 'hover:border-blue-500' },
          { emoji: '🔥', label: 'Fire', color: 'hover:border-orange-500' },
          { emoji: '🏚️', label: 'Earthquake', color: 'hover:border-amber-500' },
          { emoji: '🏥', label: 'Medical', color: 'hover:border-red-500' },
          { emoji: '🌀', label: 'Storm', color: 'hover:border-purple-500' },
          { emoji: '⚡', label: 'Power', color: 'hover:border-yellow-500' }
        ].map((crisis) => (
          <button
            key={crisis.label}
            className={`p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white ${crisis.color} transition-all hover:shadow-lg`}
          >
            <div className="text-2xl mb-1">{crisis.emoji}</div>
            <div className="text-xs font-medium">{crisis.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
export default function CitizenDashboard() {
  const [user] = useState({ name: "John Doe", phone: "+91 9876543210", location: { lat: 28.6139, lon: 77.2090 } });
  const [alerts, setAlerts] = useState([
    {
      alert_id: 1,
      crisis_type: 'flood',
      message: 'Heavy rainfall causing flooding in low-lying areas',
      trust_score: 0.92,
      timestamp: new Date().toISOString(),
      location: 'Ward 12, Downtown',
      lat: 28.6139,
      lon: 77.2090
    }
  ]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-700 sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="font-bold text-xl text-white">CrisisNet</h1>
              <p className="text-xs text-slate-400">Citizen Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300 hidden sm:block">
              {user?.name || 'Guest'}
            </span>
            <button className="hidden sm:flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              Volunteer Portal
            </button>
            <button className="flex items-center gap-2 border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-800 transition text-sm text-white">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* LEFT COLUMN - Crisis Companion (2/3 width on desktop) */}
          <div className="lg:col-span-2">
            {/* Active Alerts Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                Active Crises
              </h2>
              
              {loading ? (
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-slate-400 mt-4">Loading alerts...</p>
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {alerts.slice(0, 3).map(a => <AlertCard key={a.alert_id} alert={a} />)}
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <h3 className="text-xl font-semibold text-green-300 mb-2">All Clear</h3>
                  <p className="text-green-400">No active threats in your area</p>
                </div>
              )}
            </div>

            {/* Crisis Companion */}
            <div className="h-[600px]">
              <CrisisCompanion />
            </div>
          </div>

          {/* RIGHT COLUMN - Profile, Emergency, Map (1/3 width on desktop) */}
          <div className="space-y-6">
            <CitizenProfileCard user={user} />
            <EmergencyPanel />
            <MapPreview onClick={() => alert('Opening full map...')} />
          </div>
        </div>
      </div>

      {/* Floating Emergency Button */}
      <button className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-50">
        <Bell className="w-6 h-6" />
      </button>
    </div>
  );
}