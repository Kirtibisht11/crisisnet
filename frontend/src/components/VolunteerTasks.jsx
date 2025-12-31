import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  MapPin,
  Clock,
  Flame,
  Activity
} from 'lucide-react';

/* ---------- CONFIG ---------- */
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

/* ---------- PRIORITY STYLES ---------- */
const PRIORITY_STYLES = {
  critical: {
    border: 'border-red-500',
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: <Flame className="w-5 h-5" />
  },
  high: {
    border: 'border-red-500',
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: <Flame className="w-5 h-5" />
  },
  medium: {
    border: 'border-orange-500',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    icon: <AlertCircle className="w-5 h-5" />
  },
  low: {
    border: 'border-blue-500',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: <Activity className="w-5 h-5" />
  },
  default: {
    border: 'border-gray-400',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: <Activity className="w-5 h-5" />
  }
};

const VolunteerTasks = ({ volunteerId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  /* ---------- FETCH TASKS ---------- */
  const fetchTasks = async () => {
    try {
      // Backend exposes per-volunteer tasks at /resource/volunteer/tasks/{id}
      if (!volunteerId) {
        // No volunteer id provided — nothing to fetch for MVP
        setTasks([]);
        setError(null);
        setLoading(false);
        return;
      }

      const endpoint = `${API_BASE}/resource/volunteer/tasks/${volunteerId}`;

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(endpoint, {
        headers: token ? { token } : {},
      });
      if (!response.ok) throw new Error('Unable to fetch assigned tasks');

      const data = await response.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setError(null);
    } catch (err) {
      console.error('Task fetch failed:', err);
      setError(err.message);
      clearInterval(pollingRef.current);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- EFFECT ---------- */
  useEffect(() => {
    fetchTasks();
    pollingRef.current = setInterval(fetchTasks, 30000);
    return () => clearInterval(pollingRef.current);
  }, [volunteerId]);

  /* ---------- UI STATES ---------- */
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }


  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="font-semibold text-red-700">Failed to load tasks</p>
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchTasks();
          }}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-14 h-14 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-700">No Active Tasks</h3>
        <p className="text-sm text-gray-500">
          You will be notified when a task is assigned.
        </p>
      </div>
    );
  }

  /* ---------- MAIN RENDER ---------- */
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Assigned Tasks</h2>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tasks.map((task, idx) => {
          const priorityKey = (task.priority || 'default').toLowerCase();
          const style = PRIORITY_STYLES[priorityKey] || PRIORITY_STYLES.default;

          return (
            <div
              key={task.task_id || idx}
              className={`bg-white border-l-4 ${style.border} rounded-lg shadow-md p-5`}
            >
              <div className="flex justify-between mb-3">
                <div className="flex gap-2 items-center">
                  <div className={`p-2 ${style.bg} ${style.text} rounded`}>
                    {style.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {task.task || 'Assigned Task'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      ID: {task.task_id || 'N/A'}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 ${style.bg} ${style.text} rounded-full text-xs font-bold uppercase`}
                >
                  {task.priority || 'normal'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {task.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {task.location}
                  </div>
                )}

                {task.description && (
                  <p className="bg-gray-50 p-2 rounded">{task.description}</p>
                )}

                {task.estimated_duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Est. duration: {task.estimated_duration}
                  </div>
                )}

                {task.required_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.required_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t text-xs text-gray-500 flex justify-between">
                <span>
                  Assigned:{' '}
                  {new Date(task.assigned_at || Date.now()).toLocaleString()}
                </span>
                {task.status && (
                  <span className="bg-gray-200 px-2 py-1 rounded">
                    {task.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VolunteerTasks;