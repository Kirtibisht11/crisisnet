import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useCrisisStore = create(
  devtools(
    persist(
      (set, get) => ({
        crises: [],
        resources: [],
        volunteers: [],
        allocations: [],
        alerts: [],
        
        addCrisis: (crisis) => set((state) => ({
          crises: [...state.crises, { ...crisis, timestamp: new Date().toISOString() }]
        })),
        
        updateCrisis: (crisisId, updates) => set((state) => ({
          crises: state.crises.map(c => 
            c.id === crisisId ? { ...c, ...updates } : c
          )
        })),
        
        removeCrisis: (crisisId) => set((state) => ({
          crises: state.crises.filter(c => c.id !== crisisId),
          allocations: state.allocations.filter(a => a.crisis_id !== crisisId)
        })),
        
        setResources: (resources) =>
          set({
            resources: resources.map(r => ({
              ...r,
              available: r.available !== undefined ? r.available : true
            }))
          }),
        
        updateResource: (resourceId, updates) => set((state) => ({
          resources: state.resources.map(r => 
            r.id === resourceId ? { ...r, ...updates } : r
          )
        })),
        
        setVolunteers: (volunteers) =>
          set({
            volunteers: volunteers.map(v => ({
              ...v,
              available: v.available !== undefined ? v.available : true
            }))
          }),
        
        updateVolunteer: (volunteerId, updates) => set((state) => ({
          volunteers: state.volunteers.map(v => 
            v.id === volunteerId ? { ...v, ...updates } : v
          )
        })),
        
        addAllocation: (allocation) => {
          set((state) => {
            const allocResources = allocation.resources || [];
            const allocVolunteers = allocation.volunteers || [];

            const newResources = state.resources.map(r => {
              const isAllocated = allocResources.some(ar => ar.id === r.id);
              return isAllocated ? { ...r, available: false } : r;
            });
            
            const newVolunteers = state.volunteers.map(v => {
              const isAllocated = allocVolunteers.some(av => av.id === v.id);
              return isAllocated ? { ...v, available: false } : v;
            });
            
            return {
              allocations: [...state.allocations, allocation],
              resources: newResources,
              volunteers: newVolunteers
            };
          });
        },
        
        releaseAllocation: (allocationId) => {
          set((state) => {
            const allocation = state.allocations.find(
              a => a.allocation_id === allocationId || a.allocationId === allocationId
            );
            if (!allocation) return state;
            
            const releasedResourceIds = (allocation.resources || []).map(r => r.id);
            const releasedVolunteerIds = (allocation.volunteers || []).map(v => v.id);
            
            const newResources = state.resources.map(r => 
              releasedResourceIds.includes(r.id) ? { ...r, available: true } : r
            );
            
            const newVolunteers = state.volunteers.map(v => 
              releasedVolunteerIds.includes(v.id) ? { ...v, available: true } : v
            );
            
            return {
              allocations: state.allocations.filter(
                a => (a.allocation_id || a.allocationId) !== allocationId
              ),
              resources: newResources,
              volunteers: newVolunteers
            };
          });
        },
        
        addAlert: (alert) => set((state) => ({
          alerts: [
            ...state.alerts,
            { ...alert, id: Date.now().toString(), timestamp: new Date().toISOString() }
          ]
        })),
        
        removeAlert: (alertId) => set((state) => ({
          alerts: state.alerts.filter(a => a.id !== alertId)
        })),
        
        clearAlerts: () => set({ alerts: [] }),
        
        getAvailableResources: () => {
          const state = get();
          return state.resources.filter(r => r.available !== false);
        },
        
        getAvailableVolunteers: () => {
          const state = get();
          return state.volunteers.filter(v => v.available !== false);
        },
        
        getUtilizationStats: () => {
          const state = get();
          const totalResources = state.resources.length;
          const availableResources = state.resources.filter(r => r.available !== false).length;
          const totalVolunteers = state.volunteers.length;
          const availableVolunteers = state.volunteers.filter(v => v.available !== false).length;
          
          return {
            resources: {
              total: totalResources,
              available: availableResources,
              allocated: totalResources - availableResources,
              utilization: totalResources > 0 
                ? ((totalResources - availableResources) / totalResources * 100).toFixed(2)
                : 0
            },
            volunteers: {
              total: totalVolunteers,
              available: availableVolunteers,
              allocated: totalVolunteers - availableVolunteers,
              utilization: totalVolunteers > 0
                ? ((totalVolunteers - availableVolunteers) / totalVolunteers * 100).toFixed(2)
                : 0
            }
          };
        },
        
        getActiveCrises: () => {
          const state = get();
          return state.crises.filter(c => c.status !== 'resolved');
        },
        
        getCrisisByPriority: () => {
          const state = get();
          return [...state.crises].sort((a, b) => (b.priority || 0) - (a.priority || 0));
        },
        
        resetStore: () => set({
          crises: [],
          resources: [],
          volunteers: [],
          allocations: [],
          alerts: []
        })
      }),
      {
        name: 'crisis-store',
        partialize: (state) => ({
          crises: state.crises,
          allocations: state.allocations
        })
      }
    )
  )
);

export { useCrisisStore };
