import React, { useState, useEffect } from 'react';
import {
  MapPin, Clock, Bell, CheckCircle, AlertTriangle, 
  User, Phone, Siren, LogOut, Maximize2,
  Shield, Activity, Home, Heart, Users, Target, Zap
} from 'lucide-react';

/* ================= CRISIS STYLES ================= */
const getCrisisStyle = (type) => {
  const styles = {
    flood: { 
      label: 'Flood Alert', 
      color: 'border-blue-500', 
      bg: 'bg-blue-500/10', 
      text: 'text-blue-400',
      icon: '🌊'
    },
    fire: { 
      label: 'Fire Alert', 
      color: 'border-orange-500', 
      bg: 'bg-orange-500/10', 
      text: 'text-orange-400',
      icon: '🔥'
    },
    medical: { 
      label: 'Medical Emergency', 
      color: 'border-red-500', 
      bg: 'bg-red-500/10', 
      text: 'text-red-400',
      icon: '🏥'
    },
    earthquake: { 
      label: 'Earthquake', 
      color: 'border-amber-500', 
      bg: 'bg-amber-500/10', 
      text: 'text-amber-400',
      icon: '🏚️'
    },
    landslide: { 
      label: 'Landslide', 
      color: 'border-stone-500', 
      bg: 'bg-stone-500/10', 
      text: 'text-stone-400',
      icon: '⛰️'
    }
  };
  return styles[type?.toLowerCase()] || { 
    label: 'Alert', 
    color: 'border-slate-400', 
    bg: 'bg-slate-500/10', 
    text: 'text-slate-400',
    icon: '⚠️'
  };
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
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all group hover:scale-[1.01]">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 ${style.bg} rounded-lg border ${style.color} flex-shrink-0`}>
            <span className="text-xl">{style.icon}</span>
          </div>
          <div>
            <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition">{style.label}</h3>
            <p className="text-slate-300 text-sm mt-1">{alert.message}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${confidence > 80 ? 'bg-green-600' : 'bg-yellow-600'}`}>
            {confidence}% Trust
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2 text-slate-300 text-sm">
          <MapPin className="w-4 h-4 flex-shrink-0 text-blue-400" />
          <LocationRenderer alert={alert} />
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-sm">
          <Clock className="w-4 h-4" />
          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <User className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-white">Profile</h3>
          <p className="text-slate-400 text-sm">Citizen Information</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 uppercase font-semibold mb-2 block">Name</label>
          <p className="text-white font-medium bg-slate-900/30 border border-slate-700 rounded-lg px-4 py-3">
            {user?.name || user?.username || "Guest Citizen"}
          </p>
        </div>
        {user?.phone && (
          <div>
            <label className="text-xs text-slate-400 uppercase font-semibold mb-2 block">Phone</label>
            <p className="text-white font-medium flex items-center gap-2 bg-slate-900/30 border border-slate-700 rounded-lg px-4 py-3">
              <Phone className="w-4 h-4 text-blue-400" /> {user.phone}
            </p>
          </div>
        )}
        <div>
          <label className="text-xs text-slate-400 uppercase font-semibold mb-2 block">Location</label>
          <p className="text-white font-medium flex items-center gap-2 bg-slate-900/30 border border-slate-700 rounded-lg px-4 py-3 text-sm">
            <MapPin className="w-4 h-4 text-blue-400" /> {locationDisplay}
          </p>
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase font-semibold mb-2 block">Status</label>
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-green-400 font-medium">Safe & Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= EMERGENCY PANEL ================= */
const EmergencyPanel = () => (
  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-red-500/50 transition-all">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
        <Siren className="w-5 h-5 text-red-400" />
      </div>
      <div>
        <h3 className="font-bold text-white">Emergency Contacts</h3>
        <p className="text-slate-400 text-sm">Direct emergency lines</p>
      </div>
    </div>
    <div className="space-y-3">
      {[
        { label: 'Police', number: '100', bg: 'bg-blue-600', hover: 'hover:bg-blue-700', icon: '👮' },
        { label: 'Fire', number: '101', bg: 'bg-orange-600', hover: 'hover:bg-orange-700', icon: '🚒' },
        { label: 'Ambulance', number: '108', bg: 'bg-red-600', hover: 'hover:bg-red-700', icon: '🚑' }
      ].map((item) => (
        <a 
          href={`tel:${item.number}`} 
          key={item.label} 
          className={`flex items-center justify-between p-4 rounded-lg ${item.bg} ${item.hover} text-white transition-all cursor-pointer group shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{item.icon}</span>
            <div>
              <div className="text-xs font-bold uppercase opacity-90">{item.label}</div>
              <div className="text-xl font-bold tracking-wider">{item.number}</div>
            </div>
          </div>
          <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </a>
      ))}
    </div>
  </div>
);

/* ================= MAP PREVIEW ================= */
const MapPreview = ({ onClick }) => (
  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-green-500/50 transition-all">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <MapPin className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="font-bold text-white">Crisis Map</h3>
          <p className="text-slate-400 text-sm">Live threat locations</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className="p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition shadow-lg shadow-green-600/20"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
    <div 
      className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl h-48 flex items-center justify-center cursor-pointer hover:border-green-500/50 transition-all group"
      onClick={onClick}
    >
      <div className="text-center">
        <div className="relative">
          <MapPin className="w-12 h-12 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="absolute inset-0 w-12 h-12 mx-auto bg-green-400/20 rounded-full animate-ping"></div>
        </div>
        <p className="text-slate-400 text-sm mt-2">Click to view interactive map</p>
      </div>
    </div>
  </div>
);

/* ================= CRISIS COMPANION COMPACT ================= */
const CrisisCompanion = () => {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <span className="text-white text-2xl">🛟</span>
        </div>
        <div>
          <h3 className="font-bold text-white text-xl">CrisisNet Assistant</h3>
          <p className="text-slate-400 text-sm">Your emergency guide</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-900/30 to-slate-900/10 rounded-xl p-4 mb-6 border border-slate-700">
        <div className="text-center text-slate-400 py-8">
          <Activity className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <p className="text-lg mb-2">How can I help you today?</p>
          <p className="text-sm">Select a crisis type below to get started</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: '🌊', label: 'Flood', color: 'hover:border-blue-500 hover:bg-blue-500/10' },
          { emoji: '🔥', label: 'Fire', color: 'hover:border-orange-500 hover:bg-orange-500/10' },
          { emoji: '🏚️', label: 'Earthquake', color: 'hover:border-amber-500 hover:bg-amber-500/10' },
          { emoji: '🏥', label: 'Medical', color: 'hover:border-red-500 hover:bg-red-500/10' },
          { emoji: '🌀', label: 'Storm', color: 'hover:border-purple-500 hover:bg-purple-500/10' },
          { emoji: '⚡', label: 'Power', color: 'hover:border-yellow-500 hover:bg-yellow-500/10' }
        ].map((crisis) => (
          <button
            key={crisis.label}
            className={`p-4 bg-slate-900/30 border border-slate-700 rounded-xl text-white ${crisis.color} transition-all hover:shadow-lg hover:scale-[1.02]`}
          >
            <div className="text-2xl mb-2">{crisis.emoji}</div>
            <div className="text-xs font-medium">{crisis.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
export default function CitizenDashboard() {
  const [user] = useState({ 
    name: "John Doe", 
    phone: "+91 9876543210", 
    location: { lat: 28.6139, lon: 77.2090 } 
  });
  const [alerts, setAlerts] = useState([
    {
      alert_id: 1,
      crisis_type: 'flood',
      message: 'Heavy rainfall causing flooding in low-lying areas of downtown. Avoid travel if possible.',
      trust_score: 0.92,
      timestamp: new Date().toISOString(),
      location: 'Ward 12, Downtown Area',
      lat: 28.6139,
      lon: 77.2090
    },
    {
      alert_id: 2,
      crisis_type: 'medical',
      message: 'Medical emergency reported near Central Park. Emergency services en route.',
      trust_score: 0.85,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      location: 'Central Park Vicinity',
      lat: 28.6200,
      lon: 77.2150
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    active: 2,
    resolved: 12,
    volunteers: 45,
    shelters: 8
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900/20 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">CrisisNet</h1>
              <p className="text-xs text-slate-400">Citizen Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-300">
                {user?.name || 'Guest'}
              </span>
            </div>
            <button className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-600/20">
              <Heart className="w-4 h-4" />
              Volunteer Portal
            </button>
            <button className="flex items-center gap-2 border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-800/50 transition text-sm text-white bg-slate-800/30">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 py-8 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-blue-400" />
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.active}</div>
            <div className="text-sm text-slate-400">Active Alerts</div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <Target className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.resolved}</div>
            <div className="text-sm text-slate-400">Resolved</div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-orange-400" />
              <Heart className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.volunteers}</div>
            <div className="text-sm text-slate-400">Active Volunteers</div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <Home className="w-8 h-8 text-purple-400" />
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.shelters}</div>
            <div className="text-sm text-slate-400">Safe Shelters</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - Crisis Companion & Alerts (2/3 width on desktop) */}
          <div className="lg:col-span-2">
            {/* Active Alerts Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Active Crises</h2>
                    <p className="text-slate-400 text-sm">Real-time emergency alerts in your area</p>
                  </div>
                </div>
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2">
                  <span className="text-blue-300 font-semibold text-sm">{alerts.length} Active</span>
                </div>
              </div>
              
              {loading ? (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-12 text-center">
                  <div className="relative mx-auto mb-4">
                    <div className="h-16 w-16 rounded-full border-4 border-slate-700"></div>
                    <div className="h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0"></div>
                  </div>
                  <p className="text-slate-400">Loading alerts...</p>
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {alerts.map(a => <AlertCard key={a.alert_id} alert={a} />)}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-green-500/10 to-green-900/10 backdrop-blur border border-green-500/30 rounded-2xl p-12 text-center">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-green-300 mb-3">All Clear</h3>
                  <p className="text-green-400 mb-6">No active threats detected in your area</p>
                  <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-600/20">
                    Refresh Alerts
                  </button>
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
      <button className="fixed bottom-6 right-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-5 rounded-full shadow-2xl shadow-red-600/30 transition-all hover:scale-110 z-50 group">
        <Bell className="w-6 h-6 group-hover:animate-pulse" />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-ping"></div>
      </button>
    </div>
  );
}