/**
 * agentStore.js
 * ----------------
 * This file holds global state related to AI agents.
 * 
 * Right now, we only track the Communication Agent,
 * because that’s the agent responsible for turning
 * system decisions into real-world alerts.
 *
 * We use Zustand to keep this lightweight and simple.
 * Any page (Citizen, NGO, Authority) can instantly
 * react when an alert is triggered.
 */

import { create } from "zustand";

export const useAgentStore = create((set) => ({
  // Represents the current state of the communication agent
  communicationAgent: {
    active: false, // whether the agent is currently responding to a crisis
    alert: null,   // stores latest alert details (type, location, severity)
  },

  // Called when a crisis alert is triggered
  // This activates the agent and stores alert info
  setAlert: (alert) =>
    set({
      communicationAgent: {
        active: true,
        alert,
      },
    }),

  // Used to reset the system back to idle state
  clearAlert: () =>
    set({
      communicationAgent: {
        active: false,
        alert: null,
      },
    }),
}));
