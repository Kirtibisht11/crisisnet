import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import DetectionPanel from '../components/DetectionPanel';
import AlertList from '../components/AlertList';
import MockScenarios from '../components/MockScenarios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function DetectionPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/alerts`);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
    } catch (err) {
      console.error('Alert fetch failed', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">CN</span>
            </div>
            <span className="font-bold text-slate-900">CrisisNet</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/detection" className="text-sm font-medium text-blue-700">Detection</Link>
            <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">Dashboard</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <p className="font-medium text-slate-900">{user?.name || user?.username || "User"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:border-slate-400 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Detection Console</h1>

        <DetectionPanel
          alertsCount={alerts.length}
          loading={loading}
          onRefresh={fetchAlerts}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <AlertList alerts={alerts} loading={loading} error={error} onRefresh={fetchAlerts} />
          </div>
          <div>
            <MockScenarios apiBase={API_BASE} />
          </div>
        </div>
      </div>
    </div>
  );
}
