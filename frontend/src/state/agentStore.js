/**
 * agentStore.js
 * --------------
 * Global state for all backend agents.
 *
 * This store represents:
 * - Whether the communication agent is active
 * - What alert is currently issued
 *
 * Frontend NEVER sends messages directly.
 * It only reflects agent state.
 */

import { create } from "zustand";

export const useAgentStore = create((set) => ({
  // ----------------------------------
  // Communication Agent State
  // ----------------------------------
  communicationAgent: {
    active: false,
    alert: {
      type: null,      // e.g. "Flood"
      location: null,  // e.g. "Zone A"
    },
  },

  // ----------------------------------
  // Actions
  // ----------------------------------

  /**
   * Trigger a new emergency alert
   * (Demo-only: simulates backend signal)
   */
  triggerAlert: (type, location) =>
    set({
      communicationAgent: {
        active: true,
        alert: {
          type,
          location,
        },
      },
    }),

  /**
   * Clear current alert
   */
  clearAlert: () =>
    set({
      communicationAgent: {
        active: false,
        alert: {
          type: null,
          location: null,
        },
      },
    }),
}));