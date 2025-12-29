import { create } from "zustand";

export const useAgentStore = create((set) => ({
  communicationAgent: {
    active: false,
    alert: { type: null, location: null, severity: null },
  },

  setAlert: (alert) =>
    set({
      communicationAgent: { active: true, alert },
    }),

  clearAlert: () =>
    set({
      communicationAgent: {
        active: false,
        alert: { type: null, location: null, severity: null },
      },
    }),
}));
