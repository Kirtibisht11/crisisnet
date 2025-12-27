/**
 * AgentStatusPanel.jsx
 * --------------------
 * Visual indicator for judges and users.
 *
 * Shows whether the Communication Agent
 * is idle or actively responding to a crisis.
 *
 * This makes the system feel "alive"
 * instead of just static pages.
 */

import { useAgentStore } from "../state/agentStore";

export default function AgentStatusPanel() {
  const { communicationAgent } = useAgentStore();

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-2">Agent Status</h3>

      <div className="flex items-center justify-between">
        <span>Communication Agent</span>
        <span
          className={`font-medium ${
            communicationAgent.active
              ? "text-green-600"
              : "text-gray-400"
          }`}
        >
          {communicationAgent.active ? "Active" : "Idle"}
        </span>
      </div>
    </div>
  );
}
