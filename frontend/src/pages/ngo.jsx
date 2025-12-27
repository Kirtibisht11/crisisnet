/**
 * ngo.jsx
 * -------
 * NGO dashboard.
 *
 * NGOs are responders, not victims.
 * This page shows where help is needed
 * so they can mobilize resources quickly.
 */

import { useAgentStore } from "../state/agentStore";
import AgentStatusPanel from "../components/AgentStatusPanel";

export default function NGO() {
  const { communicationAgent } = useAgentStore();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">NGO Dashboard</h1>

      <AgentStatusPanel />

      {communicationAgent.active ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-700">
            🚨 Crisis Notification
          </h2>
          <p className="mt-2">
            <strong>Location:</strong> {communicationAgent.alert.location}
          </p>
          <p>
            <strong>Severity:</strong> {communicationAgent.alert.severity}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Telegram alert received
          </p>
        </div>
      ) : (
        <p className="text-gray-600">No alerts yet</p>
      )}
    </div>
  );
}
