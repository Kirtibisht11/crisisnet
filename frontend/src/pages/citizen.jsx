/**
 * citizen.jsx
 * -----------
 * Citizen-facing dashboard.
 *
 * This page answers one question:
 * "Has something dangerous happened near me?"
 *
 * Citizens don’t need technical details.
 * They just need clear, calm, verified information.
 */

import { useAgentStore } from "../state/agentStore";
import AgentStatusPanel from "../components/AgentStatusPanel";
import SimulateCrisis from "../components/SimulateCrisis";

export default function Citizen() {
  const { communicationAgent } = useAgentStore();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Citizen Dashboard</h1>

      <AgentStatusPanel />

      {communicationAgent.active ? (
        <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-red-700">
            ⚠ Emergency Alert
          </h2>
          <p className="mt-2">
            <strong>Type:</strong> {communicationAgent.alert.type}
          </p>
          <p>
            <strong>Location:</strong> {communicationAgent.alert.location}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Alert delivered via Telegram
          </p>
        </div>
      ) : (
        <p className="text-gray-600">No active alerts</p>
      )}

      {/* Demo-only trigger button */}
      <div className="mt-6">
        <SimulateCrisis />
      </div>
    </div>
  );
}
