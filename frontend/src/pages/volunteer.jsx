import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { 
  UserPlus, MapPin, Award, CheckCircle, Menu, X, 
  Activity, Clock, Bell, Settings, LogOut, Edit2, 
  Save, Phone, Mail, Calendar, TrendingUp, Zap, 
  MessageCircle, User, Flame, AlertCircle
} from 'lucide-react';

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

      const API_BASE = 'http://localhost:8000';
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
        <button
          onClick={fetchTasks}
          className="px-3 sm:px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm transition self-start sm:self-auto"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        {tasks.map((task, idx) => {
          const priorityKey = (task.priority || 'default').toLowerCase();
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
                    <p className="text-xs text-gray-500 truncate">
                      ID: {task.task_id || 'N/A'}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 ${style.bg} ${style.text} rounded-full text-xs font-bold uppercase self-start sm:self-auto flex-shrink-0`}
                >
                  {task.priority || 'normal'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {task.location && (
                  <div className="flex items-start gap-1">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{task.location}</span>
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
      const response = await fetch(
        `http://localhost:8000/volunteer/profile/${volunteerId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        }
      );

      if (response.ok) {
        onUpdate && onUpdate(editForm);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const toggleAvailability = () => {
    setAvailability(!availability);
    // Update backend if needed
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
                onClick={() => setIsEditing(true)}
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
              <input
                type="text"
                name="name"
                value={isEditing ? editForm.name : volunteerData?.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={isEditing ? editForm.phone : volunteerData?.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm sm:text-base"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={isEditing ? editForm.location?.manualLocation || editForm.location : volunteerData?.location?.manualLocation || volunteerData?.location}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm sm:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Award className="w-4 h-4 inline mr-1" />
              Skills
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {skillOptions.map(skill => {
                const hasSkill = isEditing 
                  ? editForm.skills?.includes(skill)
                  : volunteerData?.skills?.includes(skill);
                
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => isEditing && handleSkillToggle(skill)}
                    disabled={!isEditing}
                    className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      hasSkill
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    } ${!isEditing && 'cursor-default'} ${isEditing && 'hover:opacity-80'}`}
                  >
                    {skill.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 sm:pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">Account Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Volunteer ID:</span>
                <span className="font-mono text-gray-900 break-all">{volunteerId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Member Since:</span>
                <span className="text-gray-900">
                  {volunteerData?.registered_at 
                    ? new Date(volunteerData.registered_at).toLocaleDateString()
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Account Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
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
  
  const [activeTab, setActiveTab] = useState(() => loc?.state?.openTab || 'signup');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [volunteerId, setVolunteerId] = useState(null);
  const [volunteerData, setVolunteerData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* -------- LOCATION STATE -------- */
  const [askLocation, setAskLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skills: [],
    location: null,
    available: true
  });

  const skillOptions = [
    'first_aid', 'medical', 'rescue', 'swimming', 'firefighting',
    'search_and_rescue', 'logistics', 'communication', 'driver'
  ];

  /* ================= LOCATION FLOW ================= */
  useEffect(() => {
    if (!formData.location && activeTab === 'signup') {
      setAskLocation(true);
    }
  }, [activeTab]);

  const handleAllowLocation = async () => {
    const loc = await getBrowserLocation();
    const finalLocation = {
      lat: loc.lat,
      lon: loc.lon,
      manualLocation: null,
      source: loc.source
    };
    setFormData((prev) => ({ ...prev, location: finalLocation }));
    setAskLocation(false);
  };

  const handleManualLocationSave = () => {
    if (!manualLocation.trim()) return;
    const finalLocation = {
      lat: null,
      lon: null,
      manualLocation,
      source: 'manual'
    };
    setFormData((prev) => ({ ...prev, location: finalLocation }));
    setAskLocation(false);
  };

  /* ================= FORM HANDLERS ================= */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillToggle = (skill) => {
    setFormData((prev) => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || formData.skills.length === 0 || !formData.location) {
      setSubmitStatus({ type: 'error', message: 'Please complete all required fields' });
      return;
    }

    const newVolunteerId = `VOL_${Date.now()}`;

    const newVolunteer = {
      id: newVolunteerId,
      volunteer_id: newVolunteerId,
      name: formData.name,
      phone: formData.phone || 'Not provided',
      skills: formData.skills,
      location: formData.location,
      available: formData.available,
      role: 'volunteer',
      registered_at: new Date().toISOString()
    };

    const users = JSON.parse(localStorage.getItem('crisisnet_users') || '[]');
    users.push(newVolunteer);
    localStorage.setItem('crisisnet_users', JSON.stringify(users));

    const volunteers = JSON.parse(localStorage.getItem('volunteers_list') || '[]');
    volunteers.push(newVolunteer);
    localStorage.setItem('volunteers_list', JSON.stringify(volunteers));

    setVolunteerId(newVolunteerId);
    setVolunteerData(newVolunteer);
    localStorage.setItem('volunteerId', newVolunteerId);
    
    setSubmitStatus({
      type: 'success',
      message: `Registered successfully! Volunteer ID: ${newVolunteerId}`
    });

    setTimeout(() => setActiveTab('dashboard'), 1500);
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* LOCATION MODAL */}
      {askLocation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Share your location</h2>
            <p className="text-sm text-gray-600 mb-4">
              We use your location to assign nearby crisis tasks.
            </p>

            <button
              onClick={handleAllowLocation}
              className="w-full mb-3 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm sm:text-base"
            >
              Allow GPS Location
            </button>

            <div className="text-center text-sm text-gray-500 mb-2">or</div>

            <input
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder="Enter area manually"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />

            <button
              onClick={handleManualLocationSave}
              className="w-full border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base"
            >
              Save Manual Location
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="font-bold text-lg sm:text-xl text-gray-900 hover:text-blue-600 transition">
              CrisisNet
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              {volunteerId && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-700">ID: {volunteerId.slice(0, 12)}...</span>
                </div>
              )}
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/');
                }}
                className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-3 pt-3 border-t space-y-2">
              {volunteerId && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-700">ID: {volunteerId}</span>
                </div>
              )}
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/');
                }}
                className="w-full text-left px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8">
          <button 
            onClick={() => setActiveTab('signup')} 
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base ${
              activeTab === 'signup' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Sign Up
          </button>
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
        </div>

        {/* SIGNUP TAB */}
        {activeTab === 'signup' && (
          <div className="max-w-2xl mx-auto">
            <form className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Volunteer Registration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name *
                  </label>
                  <input 
                    name="name" 
                    placeholder="Enter your full name" 
                    onChange={handleInputChange} 
                    value={formData.name}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input 
                    name="phone" 
                    placeholder="Enter your phone number" 
                    onChange={handleInputChange} 
                    value={formData.phone}
                    className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Award className="w-4 h-4 inline mr-1" />
                    Select Your Skills *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {skillOptions.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => handleSkillToggle(s)}
                        className={`px-3 py-2 border-2 rounded-lg font-medium transition text-xs sm:text-sm ${
                          formData.skills.includes(s) 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <div className="px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm sm:text-base">
                    {formData.location?.manualLocation || 
                     (formData.location?.lat && formData.location?.lon 
                       ? `GPS: ${formData.location.lat.toFixed(4)}, ${formData.location.lon.toFixed(4)}` 
                       : 'Not set')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAskLocation(true)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition"
                  >
                    Update location →
                  </button>
                </div>

                <button 
                  onClick={handleSubmit} 
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 sm:py-3.5 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition shadow-lg text-sm sm:text-base mt-6"
                >
                  Register as Volunteer
                </button>

                {submitStatus && (
                  <div className={`p-4 rounded-lg text-sm sm:text-base ${
                    submitStatus.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {submitStatus.message}
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

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
                <p className="text-gray-500 mb-4">Please register first to view your dashboard</p>
                <button
                  onClick={() => setActiveTab('signup')}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Go to Registration
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
                <p className="text-gray-500 mb-4">Please register first to view assigned tasks</p>
                <button
                  onClick={() => setActiveTab('signup')}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Go to Registration
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerPage;