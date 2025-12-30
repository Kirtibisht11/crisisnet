// frontend/src/state/ngoStore.js
import { useState } from 'react';

const initialState = {
  activeCrises: [],
  acceptedTasks: [],
  loading: false,
  lastRefresh: null,
  ngoStatus: 'Active',
};

export const useNgoStore = () => {
  const [state, setState] = useState(initialState);

  const actions = {
    /**
     * Update the list of active crises
     */
    updateCrises: (crises) => {
      setState(prev => ({
        ...prev,
        activeCrises: crises,
        loading: false,
      }));
    },

    /**
     * Update the list of accepted tasks
     */
    updateTasks: (tasks) => {
      setState(prev => ({
        ...prev,
        acceptedTasks: tasks,
      }));
    },

    /**
     * Add a newly accepted crisis to accepted tasks
     * and remove it from active crises
     */
    addAcceptedCrisis: (crisis) => {
      const newTask = {
        id: crisis.id,
        type: crisis.type,
        location: crisis.location,
        status: 'Pending',
        acceptedAt: new Date().toISOString().split('T')[0],
      };

      setState(prev => ({
        ...prev,
        acceptedTasks: [newTask, ...prev.acceptedTasks],
        activeCrises: prev.activeCrises.filter(c => c.id !== crisis.id),
      }));
    },

    /**
     * Update the status of a specific task
     */
    updateTaskStatus: (taskId, newStatus) => {
      setState(prev => ({
        ...prev,
        acceptedTasks: prev.acceptedTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        ),
      }));
    },

    /**
     * Set loading state
     */
    setLoading: (loading) => {
      setState(prev => ({
        ...prev,
        loading,
      }));
    },

    /**
     * Update last refresh timestamp
     */
    setLastRefresh: () => {
      setState(prev => ({
        ...prev,
        lastRefresh: new Date(),
      }));
    },

    /**
     * Set NGO operational status
     */
    setNgoStatus: (status) => {
      setState(prev => ({
        ...prev,
        ngoStatus: status,
      }));
    },

    /**
     * Reset store to initial state
     */
    reset: () => {
      setState(initialState);
    },
  };

  return { state, actions };
};