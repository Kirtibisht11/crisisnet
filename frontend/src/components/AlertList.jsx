import React from 'react';

function AlertItem({ alert }) {
  return (
    <div className="border rounded p-3 bg-white">
      <div className="font-semibold">{alert.alert_id} — {alert.type}</div>
      <div className="text-sm text-gray-600">{alert.description}</div>
      <div className="text-xs text-gray-500 mt-2">Source: {alert.source} · {new Date(alert.timestamp).toLocaleString()}</div>
    </div>
  );
}

export default function AlertList({ alerts = [] }) {
  if (!alerts.length) return <div className="text-gray-500">No alerts</div>;

  return (
    <div className="grid gap-3">
      {alerts.map((a) => (
        <AlertItem key={a.alert_id} alert={a} />
      ))}
    </div>
  );
}
