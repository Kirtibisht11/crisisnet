import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { 
  UserPlus, MapPin, Award, CheckCircle, Menu, X, 
  Activity, Clock, Bell, Settings, LogOut, Edit2, 
  Save, Phone, Mail, Calendar, TrendingUp, Zap, 
  MessageCircle, User, Flame, AlertCircle
} from 'lucide-react';
import { formatPriority } from '../utils/formatter';

/* ================= ICON COMPONENTS ================= */
const FlameIcon = () => <Flame className="w-5 h-5" />;
const AlertCircleIcon = () => <AlertCircle className="w-5 h-5" />;
const ActivityIcon = () => <Activity className="w-5 h-5" />;

/* ================= LOCATION HELPERS ================= */
const getBrowserLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve({ lat: null, lon: null, source: 'unsupported' });
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: 'gps'
        }),
      () =>
        resolve({
          lat: null,
          lon: null,
          source: 'denied'
        }),
      { timeout: 8000 }
    );
  });

/* ================= PRIORITY STYLES ================= */
const PRIORITY_STYLES = {
  critical: {
    border: 'border-red-500',
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: <FlameIcon />
  },
  high: {
    border: 'border-orange-500',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    icon: <FlameIcon />
  },
  medium: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: <AlertCircleIcon />
  },
  low: {
    border: 'border-green-500',
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: <ActivityIcon />
  },
  default: {
    border: 'border-gray-400',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: <ActivityIcon />
  }
};

/* ================= LOCATION RENDERER ================= */
const LocationRenderer = ({ location, lat, lon }) => {
  const [displayLocation, setDisplayLocation] = useState(() => {
    // If we have a descriptive string that isn't "Unknown Location" or "Location not specified" or coordinates, use it
    if (location && location !== 'Unknown Location' && location !== 'Location not specified' && !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(String(location).trim())) {
      return location;
    }
    // If we have explicit lat/lon, we will resolve it
    if (lat || lon) return null;
    // If we have a coordinate string, we will resolve it
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

    // Show coordinates immediately when location is unknown
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
        } else if (data.display_name) {
          setDisplayLocation(data.display_name.split(',').slice(0, 2).join(','));
        }
      })
      .catch(() => {
        if (active) setDisplayLocation(`${queryLat}, ${queryLon}`);
      });
    return () => { active = false; };
  }, [location, lat, lon]);

  if (displayLocation === null) {
    return <span className="text-slate-400 italic text-xs">Resolving location...</span>;
  }

  return <span>{displayLocation}</span>;
};

/* ================= VOLUNTEER OPPORTUNITIES COMPONENT ================= */
const VolunteerOpportunities = ({ volunteerId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/resource/volunteer_requests');
      const data = await res.json();
      
      // Get current user ID to ensure we filter out requests accepted by this user
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.user_id || user.id;

      // Filter out requests already accepted by this volunteer
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
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/resource/volunteer_requests/${reqId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify({})
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

  if (loading) return <div className="p-8 text-center">Loading opportunities...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Open Volunteer Opportunities</h2>
      {requests.length === 0 ? (
        <div className="p-8 bg-white rounded-lg shadow text-center text-gray-500">
          No open requests at the moment.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map(req => {
            const priorityInfo = formatPriority(req.trust_score, req.crisis_type);
            const priorityKey = priorityInfo.level.toLowerCase();
            const style = PRIORITY_STYLES[priorityKey] || PRIORITY_STYLES.default;

            return (
              <div key={req.request_id} className={`bg-white p-5 rounded-lg shadow border-l-4 ${style.border}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-900">{req.crisis_type.toUpperCase()}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${style.bg} ${style.text}`}>
                        {priorityInfo.level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> <LocationRenderer location={req.location} lat={req.lat} lon={req.lon} /></p>
                    <p className="text-gray-700 mb-3">{req.message}</p>
                    <div className="flex gap-2 flex-wrap">
                      {req.skills_required.map(s => (
                        <span key={s} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAccept(req.request_id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    Accept
                  </button>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Needed: {req.volunteers_needed} • Fulfilled: {req.fulfilled_count}
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
      <div className="flex justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-2" />
        <p className="font-semibold text-red-700 text-sm sm:text-base">Failed to load tasks</p>
        <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchTasks();
          }}
          className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 sm:w-14 sm:h-14 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-700 text-base sm:text-lg">No Active Tasks</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          You will be notified when a task is assigned.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Assigned Tasks</h2>
      </div>

      <div className="flex flex-col gap-4">
        {tasks.map((task, idx) => {
          const priorityLevel = task.priority || 'default';
          const priorityKey = priorityLevel.toLowerCase();
          const style = PRIORITY_STYLES[priorityKey] || PRIORITY_STYLES.default;

          return (
            <div
              key={task.task_id || idx}
              className={`bg-white border-l-4 ${style.border} rounded-lg shadow-md p-4 sm:p-5 hover:shadow-lg transition`}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-3 mb-3">
                <div className="flex gap-2 items-start sm:items-center">
                  <div className={`p-2 ${style.bg} ${style.text} rounded flex-shrink-0`}>
                    {style.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base sm:text-lg break-words">
                      {task.task || 'Assigned Task'}
                    </h3>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 ${style.bg} ${style.text} rounded-full text-xs font-bold uppercase self-start sm:self-auto flex-shrink-0`}
                >
                  {priorityLevel}
                </span>
              </div>

              <div className="space-y-2">
                {(task.location || (task.lat && task.lon)) && (
                  <div className="flex items-start gap-1">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="break-words"><LocationRenderer location={task.location} lat={task.lat} lon={task.lon} /></span>
                  </div>
                )}
                {task.description && (
                  <p className="bg-gray-50 p-2 sm:p-3 rounded text-sm break-words">{task.description}</p>
                )}

                {task.estimated_duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Est. duration: {task.estimated_duration}</span>
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

              <div className="mt-4 pt-3 border-t text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
                <span className="break-words">
                  Assigned: {new Date(task.assigned_at || Date.now()).toLocaleString()}
                </span>
                {task.status && (
                  <span className="bg-gray-200 px-2 py-1 rounded self-start sm:self-auto">
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

/* ================= VOLUNTEER PROFILE COMPONENT ================= */
const VolunteerProfile = ({ volunteerId, volunteerData, onUpdate }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(volunteerData || {});
  const [availability, setAvailability] = useState(volunteerData?.available || true);

  const skillOptions = [
    'first_aid', 'medical', 'rescue', 'swimming', 'firefighting',
    'search_and_rescue', 'logistics', 'communication', 'driver'
  ];

  useEffect(() => {
    setEditForm(volunteerData || {});
    setAvailability(volunteerData?.available || true);
  }, [volunteerData]);

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
        skills: hasSkill 
          ? skills.filter(s => s !== skill)
          : [...skills, skill]
      };
    });
  };

  const handleSaveProfile = async () => {
    try {
      const dataToSave = { ...editForm, available: availability, id: volunteerId };
      console.log('💾 Saving profile with data:', dataToSave);
      
      // Save to backend API
      const response = await fetch(
        `http://localhost:8000/api/volunteer/update`,
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

        // Also update localStorage
        try {
          const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
          if (currentUser && currentUser.volunteer) {
            // Update nested volunteer data
            currentUser.volunteer = { ...currentUser.volunteer, ...dataToSave };
            localStorage.setItem('user', JSON.stringify(currentUser));
            console.log('✅ Updated user.volunteer in localStorage');
          }
          
          // Update volunteers_list if it exists
          const volunteersList = JSON.parse(localStorage.getItem('volunteers_list') || '[]');
          const idx = volunteersList.findIndex(v => v.id === volunteerId || v.volunteer_id === volunteerId);
          if (idx >= 0) {
            volunteersList[idx] = { ...volunteersList[idx], ...dataToSave };
            localStorage.setItem('volunteers_list', JSON.stringify(volunteersList));
            console.log('✅ Updated volunteers_list in localStorage');
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

  const toggleAvailability = async () => {
    const newStatus = !availability;
    setAvailability(newStatus);
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/resource/volunteers/${volunteerId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify({ available: newStatus })
      });
    } catch (e) {
      console.error("Failed to update availability", e);
      setAvailability(!newStatus);
    }
  };

  const handleOpenTelegram = () => {
    window.open('https://t.me/crisisnet_bot', '_blank');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">0</div>
          <div className="text-xs sm:text-sm text-gray-500">Active Tasks</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">0</div>
          <div className="text-xs sm:text-sm text-gray-500">Completed</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">0</div>
          <div className="text-xs sm:text-sm text-gray-500">High Priority</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">0</div>
          <div className="text-xs sm:text-sm text-gray-500">Total Tasks</div>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Profile Information</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            {!isEditing ? (
              <button
                onClick={() => {
                  setEditForm(volunteerData || {});
                  setAvailability(volunteerData?.available ?? true);
                  setIsEditing(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(volunteerData);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editForm.name || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              ) : (
                <div className="w-full px-3 sm:px-4 py-2 rounded-lg bg-gray-50 text-sm sm:text-base text-gray-900">
                  {volunteerData?.name || '—'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editForm.email || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              ) : (
                <div className="w-full px-3 sm:px-4 py-2 rounded-lg bg-gray-50 text-sm sm:text-base text-gray-900">
                  {volunteerData?.email || '—'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              ) : (
                <div className="w-full px-3 sm:px-4 py-2 rounded-lg bg-gray-50 text-sm sm:text-base text-gray-900">
                  {volunteerData?.phone || '—'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Emergency Contact
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="emergency_contact"
                  value={editForm.emergency_contact || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              ) : (
                <div className="w-full px-3 sm:px-4 py-2 rounded-lg bg-gray-50 text-sm sm:text-base text-gray-900">
                  {volunteerData?.emergency_contact || '—'}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="location"
                  value={
                    typeof editForm.location === 'string'
                      ? editForm.location
                      : editForm.location?.manualLocation || editForm.location?.manual || ''
                  }
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              ) : (
                <div className="w-full px-3 sm:px-4 py-2 rounded-lg bg-gray-50 text-sm sm:text-base text-gray-900">
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

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Address
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={editForm.address || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              ) : (
                <div className="w-full px-3 sm:px-4 py-2 rounded-lg bg-gray-50 text-sm sm:text-base text-gray-900">
                  {volunteerData?.address || '—'}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Award className="w-4 h-4 inline mr-1" />
              Skills
            </label>
            {isEditing ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {skillOptions.map(skill => {
                  const hasSkill = editForm.skills?.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                        hasSkill ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                      } hover:opacity-80`}
                    >
                      {skill.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(volunteerData?.skills || []).length > 0 ? (
                  (volunteerData.skills || []).map((s) => (
                    <span key={s} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                      {s.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No skills listed</span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Zap className="w-4 h-4 inline mr-1" />
                Experience Level
              </label>
              {isEditing ? (
                <select
                  name="experience"
                  value={editForm.experience || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="">Select experience level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              ) : (
                <div className="w-full px-3 sm:px-4 py-2 rounded-lg bg-gray-50 text-sm sm:text-base text-gray-900">
                  {volunteerData?.experience ? volunteerData.experience.charAt(0).toUpperCase() + volunteerData.experience.slice(1) : '—'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Availability
              </label>
              {isEditing ? (
                <select
                  name="availability"
                  value={editForm.availability || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="">Select availability</option>
                  <option value="weekdays">Weekdays Only</option>
                  <option value="weekends">Weekends Only</option>
                  <option value="anytime">Anytime</option>
                  <option value="evenings">Evenings Only</option>
                  <option value="weekday_evenings">Weekday Evenings</option>
                </select>
              ) : (
                <div className="w-full px-3 sm:px-4 py-2 rounded-lg bg-gray-50 text-sm sm:text-base text-gray-900">
                  {volunteerData?.availability ? volunteerData.availability.replace('_', ' ').charAt(0).toUpperCase() + volunteerData.availability.replace('_', ' ').slice(1) : '—'}
                </div>
              )}
            </div>
          </div>


        </div>
      </div>

{/* Telegram Integration */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start gap-3">
        <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Stay Connected via Telegram</h4>
          <p className="text-xs sm:text-sm text-blue-700 mb-2">
            Get instant crisis alerts and task updates on Telegram
          </p>
          <button
            onClick={handleOpenTelegram}
            className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 transition"
          >
            Open Telegram Bot →
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
  const [volunteerId, setVolunteerId] = useState(() => localStorage.getItem('volunteerId'));
  const [volunteerData, setVolunteerData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // load volunteer profile from nested user.volunteer field or localStorage
    const loadLocal = () => {
      try {
        // First, try to get volunteer data from the signed-in user's nested volunteer field
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (currentUser && currentUser.volunteer) {
          console.log('Loaded volunteer from user.volunteer:', currentUser.volunteer);
          return currentUser.volunteer;
        }

        // Fallback: check volunteers_list
        const volunteers = JSON.parse(localStorage.getItem('volunteers_list') || '[]');
        const found = volunteers.find(v => v.id === volunteerId || v.volunteer_id === volunteerId || v.user_id === volunteerId);
        if (found) return found;

        // Fallback: check crisisnet_users list
        const users = JSON.parse(localStorage.getItem('crisisnet_users') || '[]');
        const u = users.find(x => x.id === volunteerId || x.volunteer_id === volunteerId || x.user_id === volunteerId);
        if (u && u.volunteer) return u.volunteer;
      } catch (e) {
        console.warn('Failed to parse local volunteer data', e);
      }
      return null;
    };

    const fetchRemote = async () => {
      try {
        const API_BASE = 'http://localhost:8000';
        const res = await fetch(`${API_BASE}/api/resource/volunteers/${volunteerId}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data || null;
      } catch (e) {
        console.error('Failed to fetch remote volunteer data:', e);
        return null;
      }
    };

    (async () => {
      if (!volunteerId) {
        // Try to get volunteerId from user.volunteer.id
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

      const remote = await fetchRemote();
      if (remote) setVolunteerData(remote);
    })();
  }, [volunteerId]);

  const skillOptions = [
    'first_aid', 'medical', 'rescue', 'swimming', 'firefighting',
    'search_and_rescue', 'logistics', 'communication', 'driver'
  ];











  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">


      {/* HEADER - match Citizen style */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <Link to="/" className="font-bold text-xl tracking-tight flex items-center gap-2">CrisisNet</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-300 hidden sm:block">{volunteerData?.name || user?.name || 'Volunteer'}</span>
            <button
              onClick={() => navigate('/citizen')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition"
            >
              Citizen Dashboard
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                navigate('/');
              }}
              className="text-sm border border-slate-600 px-3 py-1.5 rounded hover:bg-slate-800 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="w-[96%] mx-auto py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('tasks')} 
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
              activeTab === 'tasks' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            My Tasks
          </button>
          <button 
            onClick={() => setActiveTab('opportunities')} 
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
              activeTab === 'opportunities' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Opportunities
          </button>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            {volunteerId ? (
              <VolunteerProfile 
                volunteerId={volunteerId} 
                volunteerData={volunteerData}
                onUpdate={setVolunteerData}
              />
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Profile Yet</h3>
                <p className="text-gray-500 mb-4">No volunteer profile found.</p>
                <button
                  onClick={() => navigate('/signup-volunteer')}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Sign Up as Volunteer
                </button>
              </div>
            )}
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
            {volunteerId ? (
              <VolunteerTasks volunteerId={volunteerId} />
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tasks Available</h3>
                <p className="text-gray-500 mb-4">No volunteer profile found.</p>
                <button
                  onClick={() => navigate('/signup-volunteer')}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Sign Up as Volunteer
                </button>
              </div>
            )}
          </div>
        )}

        {/* OPPORTUNITIES TAB */}
        {activeTab === 'opportunities' && (
          <VolunteerOpportunities volunteerId={volunteerId} />
        )}
      </div>
    </div>
  );
};

export default VolunteerPage;