import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const Analytics = () => {
  const [crises, setCrises] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/alerts');
        const data = await res.json();
        setCrises(data.alerts || []);
        setLastUpdated(new Date().toLocaleString());
      } catch (err) {
        console.error("Failed to load analytics data", err);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const total = crises.length;

    const byType = {};
    let totalTrust = 0;

    crises.forEach(c => {
      const type = (c.crisis_type || c.type || "unknown").toLowerCase();
      byType[type] = (byType[type] || 0) + 1;
      totalTrust += Number(c.trust_score) || 0;
    });

    return {
      total,
      byType,
      avgTrust: total ? (totalTrust / total * 100).toFixed(1) + "%" : "0%",
    };
  }, [crises]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between">
        <h1 className="text-xl font-bold">Crisis Analytics</h1>
        <Link to="/authority" className="text-sm text-slate-300 hover:text-white">
          Back to Dashboard
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
              <div className="text-xs text-purple-700">Avg Trust Score</div>
              <div className="text-3xl font-bold text-purple-900">
                {stats.avgTrust}
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
