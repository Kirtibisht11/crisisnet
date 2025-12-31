import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { connectTelegram } from "../services/telegramUtils";
import {
  MapPin, Clock, Bell, CheckCircle, Navigation, UserPlus
} from 'lucide-react';

import EmergencyPanel from '../components/EmergencyPanel';
import CitizenProfileCard from '../components/CitizenProfileCard';
import MapView from '../components/MapView';
import CrisisCompanion from '../components/crisisCompanion';

/* ------------------ Crisis Styling ------------------ */
const getCrisisStyle = (type) => {
  const styles = {
    flood: { label: 'Flood Alert', color: 'border-blue-400' },
    fire: { label: 'Fire Alert', color: 'border-orange-400' },
    medical: { label: 'Medical Emergency', color: 'border-red-400' },
    earthquake: { label: 'Earthquake', color: 'border-amber-400' },
    landslide: { label: 'Landslide', color: 'border-stone-400' }
  };
  return styles[type?.toLowerCase()] || { label: 'Alert', color: 'border-slate-300' };
};

/* ------------------ Location Renderer ------------------ */
const LocationRenderer = ({ alert }) => {
  const [displayLocation, setDisplayLocation] = useState(() => {
    const loc = alert.location;
    const isUnknown = !loc || ['unknown', 'unknown location', 'location not available'].includes(loc?.toLowerCase()) || loc?.trim() === '';
    // Check if location looks like "12.34, 56.78" (raw coordinates)
    const isCoordinates = loc && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(loc.trim());

    if (!isUnknown && !isCoordinates) {
      return loc;
    }
    if (alert.lat != null && alert.lon != null) {
      return null;
    }
    return 'Location not available';
  });

  useEffect(() => {
    const loc = alert.location;
    const isUnknown = !loc || ['unknown', 'unknown location', 'location not specified', 'location not available'].includes(loc?.toLowerCase()) || loc?.trim() === '';
    const isCoordinates = loc && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(loc?.trim());

    if (!isUnknown && !isCoordinates) {
      setDisplayLocation(loc);
    } else if (alert.lat != null && alert.lon != null) {
      // Show coordinates immediately when location is unknown
      setDisplayLocation(`${Number(alert.lat).toFixed(4)}, ${Number(alert.lon).toFixed(4)}`);
    }
  }, [alert.location, alert.lat, alert.lon]);

  if (displayLocation === null) {
    if (alert.lat != null && alert.lon != null) {
      return (
        <span>
          {Number(alert.lat).toFixed(4)}, {Number(alert.lon).toFixed(4)}
          <span className="text-slate-400 italic text-xs ml-2">(Resolving...)</span>
        </span>
      );
    }
    return <span className="text-slate-400 italic text-xs">Resolving location...</span>;
  }

  return <span>{displayLocation}</span>;
};

/* ------------------ Alert Card ------------------ */
const AlertCard = ({ alert }) => {
  const style = getCrisisStyle(alert.crisis_type);
  const confidence = Math.round(alert.trust_score * 100);

  return (
    <div className={`p-6 rounded-xl border-l-4 ${style.color} bg-white mb-6`}>
      <div className="flex justify-between">
        <div className="flex gap-3">
          <div>
            <h2 className="font-bold uppercase">Active Crisis</h2>
            <p className="text-lg">{style.label}</p>
          </div>
        </div>
        <div className="text-right text-sm">
          <span className={`px-2 py-1 rounded text-white ${confidence > 80 ? 'bg-green-600' : 'bg-yellow-500'}`}>
            {confidence}% Confidence
          </span>
          <div className="opacity-70 mt-1 flex items-center gap-1">
            <Clock size={12} />
            {new Date(alert.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      <p className="mt-3">{alert.message}</p>

      <div className="mt-2 flex items-center gap-2 text-sm opacity-70">
        <MapPin size={14} />
        <LocationRenderer alert={alert} />
      </div>
    </div>
  );
};

/* ================== MAIN PAGE ================== */
export default function Citizen() {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);

  const [location, setLocation] = useState(user?.location || null);
  const [manualLocation, setManualLocation] = useState("");
  const [askingLocation, setAskingLocation] = useState(false);

  /* ---------- LOCATION HANDLING ---------- */
  useEffect(() => {
    if (location) return;

    setAskingLocation(true);

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: "gps"
        };
        setLocation(loc);
        setUser({ ...user, location: loc });
        localStorage.setItem("user", JSON.stringify({ ...user, location: loc }));
        setAskingLocation(false);
      },
      () => {
        setAskingLocation(false);
      },
      { timeout: 4000 }
    );
  }, []);

  /* ---------- FETCH ALERTS ---------- */
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/alerts");
        if (res.ok) {
          const data = await res.json();
          const verified = (data.alerts || []).filter(a => a.decision === "VERIFIED");
          verified.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAlerts(verified);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const i = setInterval(fetchAlerts, 30000);
    return () => clearInterval(i);
  }, []);

  /* ---------- FETCH RESOURCES ---------- */
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/resource/resources");
        if (res.ok) {
          const data = await res.json();
          setResources(data.items || []);
        }
      } catch (e) {
        console.error("Failed to fetch resources", e);
      }
    };
    fetchResources();
  }, []);

  const handleManualLocationSave = () => {
    const loc = { manualLocation, source: "manual" };
    setLocation(loc);
    setUser({ ...user, location: loc });
    localStorage.setItem("user", JSON.stringify({ ...user, location: loc }));
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* HEADER - Professional Dark Theme */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <Link to="/" className="font-bold text-xl tracking-tight flex items-center gap-2">CrisisNet</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-300 hidden sm:block">{user?.name || "Citizen"}</span>
            {(user?.role === 'volunteer' || user?.volunteer || localStorage.getItem('volunteerId')) ? (
              <button 
                onClick={() => navigate('/volunteer')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition"
              >
                <UserPlus size={16} /> Volunteer Dashboard
              </button>
            ) : (
              <button 
                onClick={() => navigate('/signup-volunteer')}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded text-sm font-medium transition"
              >
                <UserPlus size={16} /> Become Volunteer
              </button>
            )}
            <button onClick={logout} className="text-sm border border-slate-600 px-3 py-1.5 rounded hover:bg-slate-800 transition">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="w-[96%] mx-auto py-8">

        {/* LOCATION PROMPT */}
        {!location && (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 p-4 rounded">
            <p className="font-medium mb-2">Share your location for accurate alerts</p>
            <input
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder="Enter your area manually"
              className="border p-2 rounded w-full mb-2"
            />
            <button
              onClick={handleManualLocationSave}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save Location
            </button>
          </div>
        )}

        {/* DASHBOARD HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Citizen Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time safety intelligence & response</p>
          </div>
          <button
            onClick={() => connectTelegram(user?.user_id, "citizen")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Bell size={16} /> Telegram Alerts
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CENTER COLUMN (Alerts & Map) - Priority 1 on Mobile, Center on Desktop */}
          <div className="lg:col-span-5 lg:order-2 order-1 space-y-6">
            {loading ? (
              <p>Loading alerts…</p>
            ) : alerts.length ? (
              alerts.map((alert) => (
                <AlertCard key={alert.alert_id} alert={alert} />
              ))
            ) : (
              <div className="bg-green-50 border border-green-300 p-6 rounded text-center">
                <CheckCircle className="mx-auto mb-2 text-green-600" />
                <p className="font-semibold">No active threats nearby</p>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-[300px] md:h-[500px] relative z-0">
              <MapView 
                crises={alerts.map(a => ({ ...a, id: a.alert_id, type: a.crisis_type, location: { lat: a.lat, lon: a.lon } }))}
                resources={resources}
                userLocation={location && location.lat ? [location.lat, location.lon] : null}
              />
            </div>
          </div>

          {/* LEFT COLUMN (Profile & Emergency) - Priority 2 on Mobile, Left on Desktop */}
          <div className="lg:col-span-3 lg:order-1 order-2 space-y-6">
            <CitizenProfileCard user={user} />
            <EmergencyPanel />
          </div>

          {/* RIGHT COLUMN (Crisis Companion) - Priority 3 on Mobile, Right on Desktop */}
          <div className="lg:col-span-4 lg:order-3 order-3">
            <CrisisCompanion type={alerts[0]?.crisis_type} />
          </div>
        </div>
      </div>
    </div>
  );
}
