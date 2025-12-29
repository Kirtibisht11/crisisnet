import React from 'react';

export default function DetectionPanel({ alertsCount = 0, loading = false, onRefresh }) {
  return (
    <div className="bg-white p-4 rounded shadow flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">Detected Alerts</div>
        <div className="text-2xl font-bold">{loading ? '...' : alertsCount}</div>
      </div>

      <div className="flex gap-2">
        <button onClick={onRefresh} className="px-4 py-2 bg-blue-600 text-white rounded">Refresh</button>
        <button disabled className="px-4 py-2 bg-gray-200 text-gray-600 rounded" title="Run detection via CLI">Run</button>
      </div>
    </div>
  );
}
