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
        
        updateProfile: (updates) => set((state) => ({
          volunteerProfile: state.volunteerProfile
            ? { ...state.volunteerProfile, ...updates }
            : updates
        })),
        
        setMyTasks: (tasks) =>
          set({
            myTasks: (tasks || []).map(t => ({
              status: 'active',
              ...t
            }))
          }),
        
        addTask: (task) => set((state) => ({
          myTasks: [...state.myTasks, { status: 'active', ...task }]
        })),
        
        updateTask: (taskId, updates) => set((state) => ({
          myTasks: state.myTasks.map(task =>
            (task.task_id || task.id) === taskId
              ? { ...task, ...updates }
              : task
          )
        })),
        
        completeTask: (taskId) => set((state) => {
          const completedTask = state.myTasks.find(
            t => (t.task_id || t.id) === taskId
          );
          return {
            myTasks: state.myTasks.filter(
              t => (t.task_id || t.id) !== taskId
            ),
            taskHistory: completedTask
              ? [
                  ...state.taskHistory,
                  { ...completedTask, completed_at: new Date().toISOString() }
                ]
              : state.taskHistory
          };
        }),
        
        addNotification: (notification) => set((state) => ({
          notifications: [
            {
              ...notification,
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              read: false
            },
            ...state.notifications
          ]
        })),
        
        markNotificationRead: (notificationId) => set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        })),
        
        clearNotifications: () => set({ notifications: [] }),
        
        setAvailability: (available) => set({ availability: available }),
        
        toggleAvailability: () => set((state) => ({
          availability: !state.availability
        })),
        
        getActiveTaskCount: () => {
          const state = get();
          return state.myTasks.filter(t => t.status === 'active').length;
        },
        
        getCompletedTaskCount: () => {
          const state = get();
          return state.taskHistory.length;
        },
        
        getUnreadNotificationCount: () => {
          const state = get();
          return state.notifications.filter(n => !n.read).length;
        },
        
        getTasksByPriority: (priority) => {
          const state = get();
          return state.myTasks.filter(t =>
            t.priority?.toLowerCase() === priority?.toLowerCase()
          );
        },
        
        fetchVolunteerData: async () => {
          const state = get();
          if (!state.volunteerId) return;
          
          try {
            const response = await fetch(
              `http://localhost:8000/volunteer/tasks/${state.volunteerId}`
            );
            const data = await response.json();
            
            if (response.ok) {
              set({
                myTasks: (data.tasks || []).map(t => ({
                  status: t.status || 'active',
                  ...t
                }))
              });
            }
          } catch (error) {
            console.error('Error fetching volunteer data:', error);
          }
        },
        
        acceptTask: async (taskId) => {
          try {
            const response = await fetch(
              `http://localhost:8000/volunteer/task/${taskId}/accept`,
              { method: 'POST' }
            );
            
            if (response.ok) {
              set((state) => ({
                myTasks: state.myTasks.map(task =>
                  (task.task_id || task.id) === taskId
                    ? {
                        ...task,
                        status: 'accepted',
                        accepted_at: new Date().toISOString()
                      }
                    : task
                )
              }));
              return true;
            }
            return false;
          } catch (error) {
            console.error('Error accepting task:', error);
            return false;
          }
        },
        
        updateTaskStatus: async (taskId, status) => {
          try {
            const response = await fetch(
              `http://localhost:8000/volunteer/task/${taskId}/status`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
              }
            );
            
            if (response.ok) {
              set((state) => ({
                myTasks: state.myTasks.map(task =>
                  (task.task_id || task.id) === taskId
                    ? { ...task, status, updated_at: new Date().toISOString() }
                    : task
                )
              }));
              return true;
            }
            return false;
          } catch (error) {
            console.error('Error updating task status:', error);
            return false;
          }
        },
        
        getStats: () => {
          const state = get();
          return {
            total_tasks: state.myTasks.length + state.taskHistory.length,
            active_tasks: state.myTasks.filter(t => t.status === 'active').length,
            completed_tasks: state.taskHistory.length,
            high_priority_tasks: state.myTasks.filter(t =>
              t.priority?.toLowerCase() === 'high' ||
              t.priority?.toLowerCase() === 'critical'
            ).length,
            availability: state.availability
          };
        },
        
        resetStore: () => set({
          volunteerId: null,
          volunteerProfile: null,
          myTasks: [],
          taskHistory: [],
          notifications: [],
          availability: true
        })
      }),
      {
        name: 'volunteer-store',
        partialize: (state) => ({
          volunteerId: state.volunteerId,
          volunteerProfile: state.volunteerProfile,
          taskHistory: state.taskHistory,
          availability: state.availability
        })
      }
    )
  )
);

export { useVolunteerStore };
