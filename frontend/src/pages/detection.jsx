import React, { useEffect, useState } from 'react';
import DetectionPanel from '../components/DetectionPanel';
import AlertList from '../components/AlertList';
import MockScenarios from '../components/MockScenarios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function DetectionPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Detection Console</h1>

      <DetectionPanel
        alertsCount={alerts.length}
        loading={loading}
        onRefresh={fetchAlerts}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <AlertList alerts={alerts} loading={loading} error={error} onRefresh={fetchAlerts} />
        </div>
        <div>
          <MockScenarios apiBase={API_BASE} />
        </div>
      </div>
    </div>
  );
}
