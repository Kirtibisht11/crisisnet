import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { connectTelegram } from "../services/telegramUtils";
import {
  MapPin, Clock, Bell, CheckCircle, Navigation, Bot
} from 'lucide-react';

import EmergencyPanel from '../components/EmergencyPanel';
import CitizenProfileCard from '../components/CitizenProfileCard';

/* ------------------ Crisis Styling ------------------ */
const getCrisisStyle = (type) => {
  const styles = {
    flood: { label: 'Flood Alert', emoji: '🌊', color: 'border-blue-400' },
    fire: { label: 'Fire Alert', emoji: '🔥', color: 'border-orange-400' },
    medical: { label: 'Medical Emergency', emoji: '🏥', color: 'border-red-400' },
    earthquake: { label: 'Earthquake', emoji: '🏚️', color: 'border-amber-400' },
    landslide: { label: 'Landslide', emoji: '⛰️', color: 'border-stone-400' }
  };
  return styles[type?.toLowerCase()] || { label: 'Alert', emoji: '⚠️', color: 'border-slate-300' };
};

/* ------------------ Guidance ------------------ */
const GUIDANCE_DATA = {
  flood: "Move to higher ground. Avoid water & power lines.",
  fire: "Evacuate immediately. Use stairs. Call emergency services.",
  earthquake: "Drop, cover, hold. Move to open area after shaking.",
  medical: "Call emergency services. Provide first aid if trained.",
  default: "Follow official instructions and stay alert."
};

/* ------------------ Alert Card ------------------ */
const AlertCard = ({ alert }) => {
  const style = getCrisisStyle(alert.crisis_type);
  const confidence = Math.round(alert.trust_score * 100);

  return (
    <div className={`p-6 rounded-xl border-l-4 ${style.color} bg-white mb-6`}>
      <div className="flex justify-between">
        <div className="flex gap-3">
          <span className="text-4xl">{style.emoji}</span>
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
        {alert.location || 'Nearby area'}
      </div>
    </div>
  );
};

/* ------------------ Crisis Companion ------------------ */
const CrisisCompanion = ({ type }) => (
  <div className="bg-indigo-50 p-6 rounded-xl border">
    <div className="flex items-center gap-2 mb-3 text-indigo-700">
      <Bot />
      <h3 className="font-bold">AI Crisis Companion</h3>
    </div>
    <p className="text-sm text-indigo-900">
      {(GUIDANCE_DATA[type?.toLowerCase()] || GUIDANCE_DATA.default)}
    </p>
  </div>
);

/* ================== MAIN PAGE ================== */
export default function Citizen() {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between">
          <Link to="/" className="font-bold text-slate-900">CrisisNet</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm">{user?.name || "Citizen"}</span>
            <button onClick={logout} className="text-sm border px-3 py-1 rounded">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* LOCATION PROMPT */}
        {!location && (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 p-4 rounded">
            <p className="font-medium mb-2">📍 Share your location for accurate alerts</p>
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
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">Safety Dashboard</h1>
          <button
            onClick={() => connectTelegram(user?.user_id, "citizen")}
            className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2"
          >
            <Bell size={16} /> Telegram Alerts
          </button>
        </div>

        {/* ALERT STATE */}
        {loading ? (
          <p>Loading alerts…</p>
        ) : alerts.length ? (
          <AlertCard alert={alerts[0]} />
        ) : (
          <div className="bg-green-50 border border-green-300 p-6 rounded text-center">
            <CheckCircle className="mx-auto mb-2 text-green-600" />
            <p className="font-semibold">No active threats nearby</p>
          </div>
        )}

        {/* ACTIONS */}
        <div className="grid md:grid-cols-2 gap-6 my-6">
          <EmergencyPanel />
          <CrisisCompanion type={alerts[0]?.crisis_type} />
        </div>

        {/* MAP + PROFILE */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white border rounded p-4 flex items-center justify-center">
            <Navigation className="mr-2" /> Map view (location‑based)
          </div>
          <CitizenProfileCard user={user} />
        </div>
      </div>
    </div>
  );
}
