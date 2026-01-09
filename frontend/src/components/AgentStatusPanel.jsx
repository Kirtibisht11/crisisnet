import { useState, useEffect } from "react";
import { subscribe } from "../services/socket";

const AgentStatusPanel = ({ alerts }) => {
  const [liveAlerts, setLiveAlerts] = useState(alerts || []);

  // 🔴 REAL CHANGE: listen to WebSocket updates
  useEffect(() => {
    setLiveAlerts(alerts || []);
  }, [alerts]);

  useEffect(() => {
    const unsubscribe = subscribe("alert_update", (payload) => {
      if (!payload || !payload.alerts) return;
      setLiveAlerts(payload.alerts);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const verifiedCount = liveAlerts.filter(a => a.decision === "VERIFIED").length;
  const reviewCount = liveAlerts.filter(
    a => a.decision === "REVIEW" || a.decision === "UNCERTAIN"
  ).length;
  const rejectedCount = liveAlerts.filter(a => a.decision === "REJECTED").length;

  const avgTrustScore =
    liveAlerts.length > 0
      ? (
          (liveAlerts.reduce((sum, a) => sum + (a.trust_score || 0), 0) /
            liveAlerts.length) *
          100
        ).toFixed(1)
      : 0;

  return (
    <div className="space-y-4">
      {/* SYSTEM HEALTH */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          AI Agent Status (Live)
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
            <div className="text-sm text-purple-700 font-medium mb-2">
              Average Trust Score
            </div>
            <div className="text-4xl font-bold text-purple-600">
              {avgTrustScore}%
            </div>
            <div className="mt-2 text-xs text-purple-600">
              Based on {liveAlerts.length} alert
              {liveAlerts.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="font-semibold text-green-800">Verified</span>
              <span className="text-2xl font-bold text-green-600">
                {verifiedCount}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="font-semibold text-yellow-800">Review</span>
              <span className="text-2xl font-bold text-yellow-600">
                {reviewCount}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="font-semibold text-red-800">Rejected</span>
              <span className="text-2xl font-bold text-red-600">
                {rejectedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TRUST CRITERIA */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Trust Criteria
        </h3>

        <div className="space-y-3">
          <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div className="font-bold text-green-800">
              Verified (≥ 65%)
            </div>
            <div className="text-xs text-green-700">
              Immediate action required
            </div>
          </div>

          <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
            <div className="font-bold text-yellow-800">
              Review (40–64%)
            </div>
            <div className="text-xs text-yellow-700">
              Manual authority review
            </div>
          </div>

          <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
            <div className="font-bold text-red-800">
              Rejected (&lt; 40%)
            </div>
            <div className="text-xs text-red-700">
              Likely false signal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentStatusPanel;
