import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { connectTelegram } from "../services/telegramUtils";
import { subscribe } from "../services/socket";
import {
  MapPin, Clock, Bell, CheckCircle, UserPlus
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
  const [displayLocation, setDisplayLocation] = useState(alert.location || "Location not available");

  useEffect(() => {
    if (alert.location) setDisplayLocation(alert.location);
    else if (alert.lat && alert.lon)
      setDisplayLocation(`${alert.lat.toFixed(4)}, ${alert.lon.toFixed(4)}`);
  }, [alert]);

  return <span>{displayLocation}</span>;
};

/* ------------------ Alert Card ------------------ */
const AlertCard = ({ alert }) => {
  const style = getCrisisStyle(alert.crisis_type);
  const confidence = Math.round(alert.trust_score * 100);

  return (
    <div className={`p-6 rounded-xl border-l-4 ${style.color} bg-white mb-6`}>
      <div className="flex justify-between">
        <div>
          <h2 className="font-bold uppercase">Active Crisis</h2>
          <p className="text-lg">{style.label}</p>
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

  /* ---------- REAL-TIME SOCKET ---------- */
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event?.event !== "NEW_CRISIS") return;

      const p = event.payload;
      const liveAlert = {
        alert_id: `ws-${Date.now()}`,
        crisis_type: p.type,
        message: p.message || "New crisis reported",
        trust_score: p.trust_score ?? 0.85,
        decision: "VERIFIED",
        timestamp: p.timestamp || new Date().toISOString(),
        location: p.location,
        lat: p.lat,
        lon: p.lon,
      };

      setAlerts(prev => [liveAlert, ...prev]);
    });

    return () => unsubscribe();
  }, []);

  /* ---------- FETCH ALERTS ---------- */
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/alerts");
        if (res.ok) {
          const data = await res.json();
          const verified = (data.alerts || []).filter(a => a.decision === "VERIFIED");
          setAlerts(verified);
        }
      } catch {}
      finally { setLoading(false); }
    };

    fetchAlerts();
    const i = setInterval(fetchAlerts, 30000);
    return () => clearInterval(i);
  }, []);

  /* ---------- FETCH RESOURCES ---------- */
  useEffect(() => {
    fetch("http://localhost:8000/api/resource/resources")
      .then(res => res.json())
      .then(data => setResources(data.items || []));
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white p-4 flex justify-between">
        <span className="font-bold">CrisisNet</span>
        <button onClick={logout}>Sign Out</button>
      </header>

      <div className="w-[96%] mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Citizen Dashboard</h1>

        {loading ? <p>Loading…</p> :
          alerts.length ? alerts.map(a => <AlertCard key={a.alert_id} alert={a} />) :
            <div className="bg-green-50 p-6 text-center rounded">
              <CheckCircle className="mx-auto mb-2 text-green-600" />
              No active threats
            </div>
        }

        <div className="bg-white rounded-xl h-[400px] mt-6">
          <MapView
            crises={alerts.map(a => ({ id: a.alert_id, type: a.crisis_type, location: { lat: a.lat, lon: a.lon } }))}
            resources={resources}
            userLocation={location ? [location.lat, location.lon] : null}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <CitizenProfileCard user={user} />
          <EmergencyPanel />
          <CrisisCompanion type={alerts[0]?.crisis_type} />
        </div>

        <button
          onClick={() => connectTelegram(user?.user_id, "citizen")}
          className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg"
        >
          <Bell size={18} />
        </button>
      </div>
    </div>
  );
}
