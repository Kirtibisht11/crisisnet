import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { 
  UserPlus, MapPin, Award, CheckCircle, Menu, X, 
  Activity, Clock, Bell, Settings, LogOut, Edit2, 
  Save, Phone, Mail, Calendar, TrendingUp, Zap, 
  MessageCircle, User, Flame, AlertCircle, Heart,
  Shield, Target, ChevronRight, AlertTriangle
} from 'lucide-react';
import { formatPriority } from '../utils/formatter';

/* ================= PRIORITY STYLES ================= */
const PRIORITY_STYLES = {
  critical: {
    border: 'border-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    icon: <Flame className="w-5 h-5" />,
    dot: 'bg-red-500 animate-pulse'
  },
  high: {
    border: 'border-orange-500',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    icon: <AlertTriangle className="w-5 h-5" />,
    dot: 'bg-orange-500'
  },
  medium: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    icon: <AlertTriangle className="w-5 h-5" />,
    dot: 'bg-yellow-500'
  },
  low: {
    border: 'border-green-500',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    icon: <Activity className="w-5 h-5" />,
    dot: 'bg-green-500'
  },
  default: {
    border: 'border-slate-400',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    icon: <Activity className="w-5 h-5" />,
    dot: 'bg-slate-400'
  }
};

/* ================= LOCATION RENDERER ================= */
const LocationRenderer = ({ location, lat, lon }) => {
  const [displayLocation, setDisplayLocation] = useState(() => {
    if (location && location !== 'Unknown Location' && location !== 'Location not specified' && !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(String(location).trim())) {
      return location;
    }
    if (lat || lon) return null;
    if (location && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(String(location).trim())) return null;
    return location || 'Location not specified';
  });

  useEffect(() => {
    const isCoordinates = location && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(String(location).trim());
    let queryLat = lat;
    let queryLon = lon;

    if (isCoordinates && (!queryLat || !queryLon)) {
      const parts = String(location).split(',').map(s => s.trim());
      queryLat = parts[0];
      queryLon = parts[1];
    }

    if (!queryLat || !queryLon) {
      if (location && !isCoordinates && location !== 'Unknown Location' && location !== 'Location not available') {
        setDisplayLocation(location);
      }
      return;
    }

    if (location === 'Unknown Location' || location === 'Location not available') {
      setDisplayLocation(`${Number(queryLat).toFixed(4)}, ${Number(queryLon).toFixed(4)}`);
      return;
    }

    let active = true;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${queryLat}&lon=${queryLon}`)
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data.address) {
          const { road, suburb, city, town, village, county } = data.address;
          const parts = [road, suburb || village || town, city || county].filter(Boolean);
          if (parts.length > 0) setDisplayLocation(parts.join(', '));
          else if (data.display_name) setDisplayLocation(data.display_name.split(',').slice(0, 2).join(','));
        }
      })
      .catch(() => {
        if (active) setDisplayLocation(`${queryLat}, ${queryLon}`);
      });
    return () => { active = false; };
  }, [location, lat, lon]);

  if (displayLocation === null) {
    return <span className="text-slate-400 italic text-xs">Resolving...</span>;
  }

  return <span>{displayLocation}</span>;
};

/* ================= STATS CARD COMPONENT ================= */
const StatsCard = ({ icon: Icon, value, label, color = 'blue', trend }) => (
  <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all group hover:bg-slate-800/70">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition`}>
        <Icon className={`w-6 h-6 text-blue-400`} />
      </div>
      {trend && (
        <div className={`flex items-center text-xs px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-slate-400">{label}</div>
  </div>
);

/* ================= VOLUNTEER OPPORTUNITIES COMPONENT ================= */
const VolunteerOpportunities = ({ volunteerId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/resource/volunteer_requests');
      const data = await res.json();
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.user_id || user.id;

      const openRequests = (data.items || []).filter(r => 
        r.status === 'OPEN' && 
        (!r.accepted_volunteers || (!r.accepted_volunteers.includes(volunteerId) && (!userId || !r.accepted_volunteers.includes(userId))))
      );
      setRequests(openRequests);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (reqId) => {
    if (!reqId) {
      alert('Invalid request ID. Please try again.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/resource/volunteer_requests/${reqId}/accept?volunteer_id=${volunteerId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'token': token,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ volunteer_id: volunteerId })
      });
      if (res.ok) {
        alert('Request accepted! Check "My Tasks" for details.');
        fetchRequests();
      } else {
        const d = await res.json();
        alert(d.detail || 'Failed to accept');
      }
    } catch (e) {
      alert('Error accepting request');
    }
  };

  useEffect(() => { fetchRequests(); }, [volunteerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-700"></div>
          <div className="h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Open Opportunities</h2>
          <p className="text-slate-300 text-sm">Make a difference in your community</p>
        </div>
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2">
          <span className="text-blue-300 font-semibold text-sm">{requests.length} Active</span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">No Open Requests</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">Check back soon for new volunteer opportunities in your area.</p>
          <button
            onClick={fetchRequests}
            className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition border border-slate-600"
          >
            Refresh Opportunities
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((req, idx) => {
            const priorityInfo = formatPriority(req.trust_score, req.crisis_type);
            const priorityKey = priorityInfo.level.toLowerCase();
            const style = PRIORITY_STYLES[priorityKey] || PRIORITY_STYLES.default;

            return (
              <div key={req.request_id || req.id || idx} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all group hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${style.bg} rounded-lg border ${style.border}`}>
                      {style.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition">{req.crisis_type.toUpperCase()}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${style.bg} ${style.text} border ${style.border}`}>
                          {priorityInfo.level}
                        </span>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-1 ${style.dot}`}></div>
                          <span className="text-xs text-slate-400">LIVE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span className="text-sm"><LocationRenderer location={req.location} lat={req.lat} lon={req.lon} /></span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{req.message}</p>
                  
                  {req.skills_required?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {req.skills_required.map(s => (
                        <span key={s} className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div className="text-xs text-slate-400">
                    Needed: <span className="text-white font-semibold">{req.volunteers_needed}</span> • 
                    Fulfilled: <span className="text-white font-semibold">{req.fulfilled_count}</span>
                  </div>
                  <button
                    onClick={() => handleAccept(req.request_id || req.id)}
                    disabled={!volunteerId}
                    className={`px-5 py-2.5 text-sm font-semibold shadow-lg flex items-center gap-2 group transition-all ${
                      volunteerId
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-600/20 hover:shadow-blue-600/40'
                        : 'bg-slate-600 text-slate-400 cursor-not-allowed shadow-slate-600/20'
                    } rounded-lg`}
                  >
                    Accept Request
                    <ChevronRight className={`w-4 h-4 ${volunteerId ? 'group-hover:translate-x-1' : ''} transition-transform`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ================= VOLUNTEER TASKS COMPONENT ================= */
const VolunteerTasks = ({ volunteerId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = async () => {
    try {
      if (!volunteerId) {
        setTasks([]);
        setError(null);
        setLoading(false);
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
      const endpoint = `${API_BASE}/api/resource/volunteer/tasks/${volunteerId}`;
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [volunteerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-700"></div>
          <div className="h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <p className="font-semibold text-red-300 text-lg">Failed to load tasks</p>
        <p className="text-sm text-red-400 mt-2 mb-4">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchTasks();
          }}
          className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-12 text-center">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Activity className="w-10 h-10 text-blue-400" />
        </div>
        <h3 className="text-2xl font-semibold text-white mb-3">No Active Tasks</h3>
        <p className="text-slate-400 mb-6">You will be notified when a task is assigned to you.</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={fetchTasks}
            className="px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition border border-slate-600"
          >
            Refresh Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Your Assigned Tasks</h2>
          <p className="text-slate-300 text-sm">Active missions requiring your expertise</p>
        </div>
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2">
          <span className="text-blue-300 font-semibold text-sm">{tasks.length} Active Tasks</span>
        </div>
      </div>

      <div className="grid gap-4">
        {tasks.map((task, idx) => {
          const priorityLevel = task.priority || 'default';
          const priorityKey = priorityLevel.toLowerCase();
          const style = PRIORITY_STYLES[priorityKey] || PRIORITY_STYLES.default;

          return (
            <div
              key={task.task_id || idx}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all group hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex gap-3 items-start flex-1">
                  <div className={`p-3 ${style.bg} rounded-lg border ${style.border} flex-shrink-0`}>
                    {style.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition">{task.task || 'Assigned Task'}</h3>
                      <div className={`w-2 h-2 rounded-full ${style.dot}`}></div>
                    </div>
                    {(task.location || (task.lat && task.lon)) && (
                      <div className="flex items-center gap-1 text-slate-300 text-sm">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-blue-400" />
                        <LocationRenderer location={task.location} lat={task.lat} lon={task.lon} />
                      </div>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 ${style.bg} ${style.text} border ${style.border} rounded-full text-xs font-bold uppercase flex-shrink-0`}>
                  {priorityLevel}
                </span>
              </div>

              {task.description && (
                <div className="bg-slate-900/30 border border-slate-700 p-4 rounded-xl text-slate-300 text-sm mb-4">
                  {task.description}
                </div>
              )}

              <div className="flex flex-wrap gap-4 mb-4">
                {task.estimated_duration && (
                  <div className="flex items-center gap-2 text-slate-300 text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>{task.estimated_duration}</span>
                  </div>
                )}
                {task.status && (
                  <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                    <span className={`text-xs font-medium ${task.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {task.required_skills?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {task.required_skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                <div className="text-xs text-slate-400">
                  Assigned: {new Date(task.assigned_at || Date.now()).toLocaleString()}
                </div>
                <button className="px-4 py-1.5 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-600 transition border border-slate-600">
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================= VOLUNTEER PROFILE COMPONENT ================= */
const VolunteerProfile = ({ volunteerId, volunteerData, onUpdate }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(volunteerData || {});
  const [stats, setStats] = useState({ active: 0, completed: 0, highPriority: 0, total: 0 });

  const skillOptions = [
    'first_aid', 'medical', 'rescue', 'swimming', 'firefighting',
    'search_and_rescue', 'logistics', 'communication', 'driver'
  ];

  useEffect(() => {
    setEditForm(volunteerData || {});
  }, [volunteerData]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!volunteerId) return;
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
        const res = await fetch(`${API_BASE}/api/resource/volunteer/tasks/${volunteerId}`);
        if (res.ok) {
          const data = await res.json();
          const tasks = data.tasks || [];
          const active = tasks.filter(t => !['completed', 'fulfilled', 'resolved'].includes((t.status || '').toLowerCase())).length;
          const completed = tasks.filter(t => ['completed', 'fulfilled', 'resolved'].includes((t.status || '').toLowerCase())).length;
          const highPriority = tasks.filter(t => ['high', 'critical'].includes((t.priority || '').toLowerCase())).length;
          setStats({ active, completed, highPriority, total: tasks.length });
        }
      } catch (e) {
        console.error("Failed to load stats", e);
      }
    };
    fetchStats();
  }, [volunteerId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (skill) => {
    setEditForm(prev => {
      const skills = prev.skills || [];
      const hasSkill = skills.includes(skill);
      return {
        ...prev,
        skills: hasSkill ? skills.filter(s => s !== skill) : [...skills, skill]
      };
    });
  };

  const handleSaveProfile = async () => {
    try {
      const dataToSave = { ...editForm };
      console.log('💾 Saving profile with data:', dataToSave);

      const response = await fetch(
        `http://localhost:8000/api/volunteer/update?volunteer_id=${volunteerId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave)
        }
      );

      console.log('📡 Backend response status:', response.status);
      const responseText = await response.text();
      console.log('📡 Backend response:', responseText);

      if (response.ok) {
        const updatedData = responseText ? JSON.parse(responseText) : dataToSave;
        console.log('✅ Profile saved successfully:', updatedData);
        onUpdate && onUpdate(dataToSave);

        try {
          const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
          if (currentUser && currentUser.volunteer) {
            currentUser.volunteer = { ...currentUser.volunteer, ...dataToSave };
            localStorage.setItem('user', JSON.stringify(currentUser));
          }
          
          const volunteersList = JSON.parse(localStorage.getItem('volunteers_list') || '[]');
          const idx = volunteersList.findIndex(v => v.id === volunteerId || v.volunteer_id === volunteerId);
          if (idx >= 0) {
            volunteersList[idx] = { ...volunteersList[idx], ...dataToSave };
            localStorage.setItem('volunteers_list', JSON.stringify(volunteersList));
          }
        } catch (e) {
          console.warn('❌ Failed to update local storage', e);
        }

        setIsEditing(false);
      } else {
        console.error('❌ Backend error. Status:', response.status, 'Message:', responseText);
        alert('Failed to save profile. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      alert('Error saving profile: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-blue-900/30 border border-slate-700 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {volunteerData?.name || 'Hero'}!</h1>
            <p className="text-slate-300">Thank you for your service to the community. Your dedication saves lives.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
              <Heart className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-slate-400">Total Missions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Activity} value={stats.active} label="Active Tasks" />
        <StatsCard icon={CheckCircle} value={stats.completed} label="Completed" />
        <StatsCard icon={Zap} value={stats.highPriority} label="High Priority" />
        <StatsCard icon={Award} value={volunteerData?.experience || 'Beginner'} label="Experience Level" />
      </div>

      {/* Profile Info Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Profile Information</h2>
            <p className="text-slate-400 text-sm mt-1">Manage your volunteer profile and preferences</p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-600/20"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(volunteerData);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition border border-slate-600"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Personal Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-slate-700">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editForm.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="w-full px-4 py-3 rounded-lg bg-slate-900/30 border border-slate-700 text-white">
                    {volunteerData?.name || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                    placeholder="email@example.com"
                  />
                ) : (
                  <div className="w-full px-4 py-3 rounded-lg bg-slate-900/30 border border-slate-700 text-white">
                    {volunteerData?.email || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                    placeholder="+1 234 567 8900"
                  />
                ) : (
                  <div className="w-full px-4 py-3 rounded-lg bg-slate-900/30 border border-slate-700 text-white">
                    {volunteerData?.phone || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Emergency Contact
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="emergency_contact"
                    value={editForm.emergency_contact || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                    placeholder="Emergency contact number"
                  />
                ) : (
                  <div className="w-full px-4 py-3 rounded-lg bg-slate-900/30 border border-slate-700 text-white">
                    {volunteerData?.emergency_contact || '—'}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={typeof editForm.location === 'string' ? editForm.location : editForm.location?.manualLocation || editForm.location?.manual || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                    placeholder="City, State, Country"
                  />
                ) : (
                  <div className="w-full px-4 py-3 rounded-lg bg-slate-900/30 border border-slate-700 text-white">
                    {typeof volunteerData?.location === 'string'
                      ? volunteerData.location
                      : volunteerData?.location?.manualLocation ||
                        volunteerData?.location?.manual ||
                        (volunteerData?.location?.lat && volunteerData?.location?.lon
                          ? `GPS: ${Number(volunteerData.location.lat).toFixed(4)}, ${Number(volunteerData.location.lon).toFixed(4)}`
                          : '—')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-slate-700">
              <Award className="w-5 h-5 inline mr-2" />
              Skills & Expertise
            </h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Select your skills and areas of expertise
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {skillOptions.map(skill => {
                    const hasSkill = editForm.skills?.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition border-2 ${
                          hasSkill 
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' 
                            : 'bg-slate-900/50 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {skill.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {(volunteerData?.skills || []).length > 0 ? (
                    (volunteerData.skills || []).map((s) => (
                      <span key={s} className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full text-sm">
                        {s.replace('_', ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No skills listed yet</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Zap className="w-4 h-4 inline mr-2" />
                  Experience Level
                </label>
                {isEditing ? (
                  <select
                    name="experience"
                    value={editForm.experience || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                  >
                    <option value="">Select experience level</option>
                    <option value="beginner">Beginner (0-1 years)</option>
                    <option value="intermediate">Intermediate (1-3 years)</option>
                    <option value="advanced">Advanced (3-5 years)</option>
                    <option value="expert">Expert (5+ years)</option>
                  </select>
                ) : (
                  <div className="w-full px-4 py-3 rounded-lg bg-slate-900/30 border border-slate-700 text-white">
                    {volunteerData?.experience ? volunteerData.experience.charAt(0).toUpperCase() + volunteerData.experience.slice(1) : '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Availability
                </label>
                {isEditing ? (
                  <select
                    name="availability"
                    value={editForm.availability || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                  >
                    <option value="">Select availability</option>
                    <option value="anytime">Anytime</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="weekends">Weekends Only</option>
                    <option value="evenings">Evenings Only</option>
                  </select>
                ) : (
                  <div className="w-full px-4 py-3 rounded-lg bg-slate-900/30 border border-slate-700 text-white">
                    {volunteerData?.availability && typeof volunteerData.availability === 'string' ? volunteerData.availability.replace('_', ' ').charAt(0).toUpperCase() + volunteerData.availability.replace('_', ' ').slice(1) : '—'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Telegram Integration */}
      <div className="bg-gradient-to-r from-blue-900/20 to-blue-900/10 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <MessageCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-300 text-lg mb-2">Stay Connected via Telegram</h4>
              <p className="text-slate-300 text-sm">
                Get instant crisis alerts, task updates, and emergency notifications directly on Telegram.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.open('https://t.me/crisisnet_bot', '_blank')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 whitespace-nowrap"
          >
            Connect Telegram →
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
const VolunteerPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const loc = useLocation();
  
  const [activeTab, setActiveTab] = useState(() => {
    if (loc?.state?.openTab) return loc.state.openTab;
    return 'dashboard';
  });
  const [volunteerId, setVolunteerId] = useState(() => {
    const storedId = localStorage.getItem('volunteerId');
    if (storedId && storedId !== 'undefined') return storedId;

    // If it's 'undefined', remove it from localStorage
    if (storedId === 'undefined') {
      localStorage.removeItem('volunteerId');
    }

    // Fallback: try to get from user object
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (currentUser && currentUser.id) {
        localStorage.setItem('volunteerId', currentUser.id);
        return currentUser.id;
      }
    } catch (e) {
      console.warn('Failed to get volunteerId from user', e);
    }
    return null;
  });
  const [volunteerData, setVolunteerData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadLocal = () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (currentUser && currentUser.volunteer) {
          console.log('Loaded volunteer from user.volunteer:', currentUser.volunteer);
          return currentUser.volunteer;
        }

        const volunteers = JSON.parse(localStorage.getItem('volunteers_list') || '[]');
        const found = volunteers.find(v => v.id === volunteerId || v.volunteer_id === volunteerId || v.user_id === volunteerId);
        if (found) return found;

        const users = JSON.parse(localStorage.getItem('crisisnet_users') || '[]');
        const u = users.find(x => x.id === volunteerId || x.volunteer_id === volunteerId || x.user_id === volunteerId);
        if (u && u.volunteer) return u.volunteer;
      } catch (e) {
        console.warn('Failed to parse local volunteer data', e);
      }
      return null;
    };

    const fetchRemote = async () => {
      if (!volunteerId || volunteerId === 'undefined') {
        console.log('Skipping remote fetch: volunteerId is undefined or invalid');
        return null;
      }
      try {
        const API_BASE = 'http://localhost:8000';
        const res = await fetch(`${API_BASE}/api/volunteer/${volunteerId}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.volunteer || null;
      } catch (e) {
        console.error('Failed to fetch remote volunteer data:', e);
        return null;
      }
    };

    (async () => {
      if (!volunteerId) {
        try {
          const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
          if (currentUser && currentUser.volunteer && currentUser.volunteer.id) {
            setVolunteerId(currentUser.volunteer.id);
            setVolunteerData(currentUser.volunteer);
            return;
          }
        } catch (e) {
          console.warn('Failed to extract volunteerId from user', e);
        }
      }

      if (!volunteerId || volunteerData) return;
      
      const local = loadLocal();
      if (local) {
        setVolunteerData(local);
        return;
      }

      if (volunteerId) {
        const remote = await fetchRemote();
        if (remote) setVolunteerData(remote);
      }
    })();
  }, [volunteerId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900/20 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
              <Heart className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">CrisisNet</h1>
              <p className="text-xs text-slate-400">Volunteer Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-300">
                {volunteerData?.name || user?.name || 'Volunteer'}
              </span>
            </div>
            <button
              onClick={() => navigate('/citizen')}
              className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-600/20"
            >
              <User className="w-4 h-4" />
              Citizen View
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                navigate('/');
              }}
              className="flex items-center gap-2 border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-800/50 transition text-sm bg-slate-800/30"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 py-8 max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30' 
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Shield className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('tasks')} 
            className={`flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'tasks' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30' 
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Activity className="w-5 h-5" />
            My Tasks
            {volunteerId && (
              <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                New
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('opportunities')} 
            className={`flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'opportunities' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30' 
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Target className="w-5 h-5" />
            Opportunities
            <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
              Hot
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'dashboard' && (
            <div>
              {volunteerId ? (
                <VolunteerProfile 
                  volunteerId={volunteerId} 
                  volunteerData={volunteerData}
                  onUpdate={setVolunteerData}
                />
              ) : (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-12 text-center">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                    <Heart className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">No Profile Yet</h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">Create your volunteer profile to start helping your community during emergencies.</p>
                  <button
                    onClick={() => navigate('/signup-volunteer')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/20"
                  >
                    Sign Up as Volunteer
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              {volunteerId ? (
                <VolunteerTasks volunteerId={volunteerId} />
              ) : (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-12 text-center">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                    <Activity className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">No Tasks Available</h3>
                  <p className="text-slate-400 mb-6">Create a volunteer profile to see assigned tasks and start making a difference.</p>
                  <button
                    onClick={() => navigate('/signup-volunteer')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/20"
                  >
                    Sign Up as Volunteer
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'opportunities' && (
            <VolunteerOpportunities volunteerId={volunteerId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerPage;