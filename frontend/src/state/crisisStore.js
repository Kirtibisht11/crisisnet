import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

const useCrisisStore = create(
  devtools(
    persist(
      (set, get) => ({
        crises: [],
        resources: [],
        volunteers: [],
        allocations: [],
        alerts: [],

        setCrises: (crises) => set({ crises }),
        addCrisis: (crisis) =>
          set((s) => ({ crises: [...s.crises, crisis] })),

        setResources: (resources) => set({ resources }),
        setVolunteers: (volunteers) => set({ volunteers }),

        addAllocation: (allocation) =>
          set((s) => ({ allocations: [...s.allocations, allocation] })),

        releaseAllocation: (id) =>
          set((s) => ({
            allocations: s.allocations.filter(
              (a) => (a.allocation_id || a.id) !== id
            ),
          })),

        addAlert: (alert) =>
          set((s) => ({ alerts: [...s.alerts, alert] })),

        clearAlerts: () => set({ alerts: [] }),

        resetStore: () =>
          set({
            crises: [],
            resources: [],
            volunteers: [],
            allocations: [],
            alerts: [],
          }),
      }),
      { name: "crisis-store" }
    )
  )
);

export { useCrisisStore };
