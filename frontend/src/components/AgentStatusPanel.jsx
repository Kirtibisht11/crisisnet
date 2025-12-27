/**
 * AgentStatusPanel.jsx
 * --------------------
 * Unified system + agent status panel.
 *
 * - Uses agentStore for real agent activity
 * - Uses alerts prop for system metrics
 * - Designed for authority / monitoring dashboards
 */

import { useState, useEffect } from "react";
import { useAgentStore } from "../state/agentStore";
import { formatTimestamp, formatNumber } from "../utils/formatter";

export default function AgentStatusPanel({ alerts = [] }) {
  const { communicationAgent } = useAgentStore();

  const [stats, setStats] = useState({
    totalAlerts: 0,
    verifiedAlerts: 0,
    pendingReview: 0,
    rejectedAlerts: 0,
    avgTrustScore: 0,
    uniqueUsers: 0,
  });

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    const verified = alerts.filter(a => a.decision === "VERIFIED").length;
    const review = alerts.filter(a => a.decision === "REVIEW").length;
    const rejected = alerts.filter(
      a => a.decision === "REJECTED" || a.decision === "UNCERTAIN"
    ).length;

    const totalScore = alerts.reduce(
      (sum, a) => sum + (parseFloat(a.trust_score) || 0),
      0
    );

    const avgScore = alerts.length ? totalScore / alerts.length : 0;
    const uniqueUsers = new Set(alerts.map(a => a.user_id)).size;

    setStats({
      totalAlerts: alerts.length,
      verifiedAlerts: verified,
      pendingReview: review,
      rejectedAlerts: rejected,
      avgTrustScore: avgScore,
      uniqueUsers,
    });
  }, [alerts]);

  const agents = [
    {
      name: "Communication Agent",
      active: communicationAgent?.active,
      description: "Broadcasting verified crisis alerts",
    },
  ];

  const statusColor = active =>
    active ? "text-green-600" : "text-gray-400";

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        System Status
      </h2>

      {/* System Health */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 flex justify-between items-center">
        <span className="font-semibold text-green-700">
          All Systems Operational
        </span>
        <span className="text-xs text-gray-600">
          {formatTimestamp(new Date().toISOString())}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Metric title="Total Alerts" value={stats.totalAlerts} />
        <Metric title="Verified Alerts" value={stats.verifiedAlerts} />
        <Metric title="Needs Review" value={stats.pendingReview} />
        <Metric
          title="Avg Trust Score"
          value={`${(stats.avgTrustScore * 100).toFixed(0)}%`}
        />
      </div>

      {/* Agent Activity */}
      <div className="space-y-3 mb-6">
        <h3 className="font-semibold text-gray-700">AI Agent Activity</h3>

        {agents.map(agent => (
          <div
            key={agent.name}
            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border"
          >
            <div>
              <div className="font-semibold">{agent.name}</div>
              <div className="text-sm text-gray-600">
                {agent.description}
              </div>
            </div>

            <span
              className={`font-bold ${statusColor(agent.active)}`}
            >
              {agent.active ? "Active" : "Idle"}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center border-t pt-4">
        CrisisNet v1.0 — Trust Verification System
      </div>
    </div>
  );
}

/* Helper */
function Metric({ title, value }) {
  return (
    <div className="p-4 bg-gray-50 rounded border">
      <div className="text-2xl font-bold">
        {formatNumber(value)}
      </div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
}
