import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useVolunteerStore = create(
  devtools(
    persist(
      (set, get) => ({
        volunteerId: null,
        volunteerProfile: null,
        myTasks: [],
        taskHistory: [],
        notifications: [],
        availability: true,

        setVolunteerId: (id) => set({ volunteerId: id }),

        setVolunteerProfile: (profile) => set({ volunteerProfile: profile }),

        updateProfile: (updates) =>
          set((state) => ({
            volunteerProfile: state.volunteerProfile
              ? { ...state.volunteerProfile, ...updates }
              : updates,
          })),

        setMyTasks: (tasks) =>
          set({
            myTasks: (tasks || []).map((t) => ({
              status: 'active',
              ...t,
            })),
          }),

        addTask: (task) =>
          set((state) => ({
            myTasks: [...state.myTasks, { status: 'active', ...task }],
          })),

        updateTask: (taskId, updates) =>
          set((state) => ({
            myTasks: state.myTasks.map((task) =>
              (task.task_id || task.id) === taskId ? { ...task, ...updates } : task
            ),
          })),

        completeTask: (taskId) =>
          set((state) => {
            const completedTask = state.myTasks.find(
              (t) => (t.task_id || t.id) === taskId
            );
            return {
              myTasks: state.myTasks.filter(
                (t) => (t.task_id || t.id) !== taskId
              ),
              taskHistory: completedTask
                ? [
                    ...state.taskHistory,
                    { ...completedTask, completed_at: new Date().toISOString() },
                  ]
                : state.taskHistory,
            };
          }),

        addNotification: (notification) =>
          set((state) => ({
            notifications: [
              {
                ...notification,
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                read: false,
              },
              ...state.notifications,
            ],
          })),

        markNotificationRead: (notificationId) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
          })),

        clearNotifications: () => set({ notifications: [] }),

        setAvailability: (available) => set({ availability: available }),

        toggleAvailability: () =>
          set((state) => ({
            availability: !state.availability,
          })),

        fetchVolunteerData: async () => {
          const state = get();
          if (!state.volunteerId) return;

          try {
            const token = localStorage.getItem('token');

            const response = await fetch(
              `http://localhost:8000/resource/volunteer/tasks/${state.volunteerId}`,
              {
                headers: {
                  token,
                },
              }
            );

            const data = await response.json();

            if (response.ok) {
              set({
                myTasks: (data.tasks || []).map((t) => ({
                  status: t.status || 'active',
                  ...t,
                })),
              });
            }
          } catch (error) {
            console.error('Error fetching volunteer data:', error);
          }
        },

        // Backend does not support these yet
        acceptTask: async () => {
          console.warn('Accept task API not implemented yet');
          return false;
        },

        updateTaskStatus: async () => {
          console.warn('Update task status API not implemented yet');
          return false;
        },

        getStats: () => {
          const state = get();
          return {
            total_tasks: state.myTasks.length + state.taskHistory.length,
            active_tasks: state.myTasks.filter((t) => t.status === 'active').length,
            completed_tasks: state.taskHistory.length,
            high_priority_tasks: state.myTasks.filter(
              (t) =>
                t.priority?.toLowerCase() === 'high' ||
                t.priority?.toLowerCase() === 'critical'
            ).length,
            availability: state.availability,
          };
        },

        resetStore: () =>
          set({
            volunteerId: null,
            volunteerProfile: null,
            myTasks: [],
            taskHistory: [],
            notifications: [],
            availability: true,
          }),
      }),
      {
        name: 'volunteer-store',
        partialize: (state) => ({
          volunteerId: state.volunteerId,
          volunteerProfile: state.volunteerProfile,
          taskHistory: state.taskHistory,
          availability: state.availability,
        }),
      }
    )
  )
);

export { useVolunteerStore };
