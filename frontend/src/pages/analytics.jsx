import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCrisisStore } from "../state/crisisStore";

const Analytics = () => {
  const { crises } = useCrisisStore();
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString());
  }, [crises]);

  const stats = useMemo(() => {
    const total = crises.length;

    const byType = {};
    let avgPriority = 0;

    crises.forEach(c => {
      const type = c.type || "unknown";
      byType[type] = (byType[type] || 0) + 1;
      avgPriority += c.priority_score || 0;
    });

    return {
      total,
      byType,
      avgPriority: total ? (avgPriority / total).toFixed(2) : 0,
    };
  }, [crises]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between">
        <h1 className="text-xl font-bold">Crisis Analytics</h1>
        <Link to="/" className="text-sm text-slate-300 hover:text-white">
          Back
        </Link>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-lg font-bold mb-2">System Overview</h2>
          <p className="text-slate-600 text-sm">
            Live analytics based on incoming crisis data
          </p>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-700">Total Crises</div>
              <div className="text-3xl font-bold text-blue-900">
                {stats.total}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-xs text-purple-700">Avg Priority</div>
              <div className="text-3xl font-bold text-purple-900">
                {stats.avgPriority}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-xs text-green-700">Last Update</div>
              <div className="text-sm font-semibold text-green-900">
                {lastUpdated || "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-lg font-bold mb-4">Crises by Type</h2>

          <div className="space-y-3">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <span className="capitalize font-semibold">{type}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}

            {stats.total === 0 && (
              <p className="text-sm text-slate-500">
                No crisis data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
