import React, { useState } from 'react';

export default function MockScenarios({ apiBase = 'http://localhost:8000' }) {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/alerts`);
      const data = await res.json();
      setCount(Array.isArray(data.alerts) ? data.alerts.length : 0);
    } catch (e) {
      console.error('refresh', e);
      setCount(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Mock Scenarios</h3>
      <p className="text-sm text-gray-600 mb-3">Use this panel to inspect alerts and refresh the list.</p>
      <div className="flex gap-2">
        <button onClick={refresh} className="px-3 py-2 bg-blue-600 text-white rounded">Refresh Alerts</button>
        <button onClick={() => window.alert('Run detection via CLI: python -m backend.agents.detection_agent')} className="px-3 py-2 bg-gray-200 rounded">How to run</button>
      </div>
      <div className="text-sm text-gray-500 mt-3">Current count: {loading ? '...' : (count === null ? 'unknown' : count)}</div>
    </div>
  );
}
