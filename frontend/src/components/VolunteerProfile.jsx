import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVolunteerStore } from '../state/volunteerStore';
import VolunteerTasks from './VolunteerTasks';
import { 
  User, MapPin, Award, Activity, CheckCircle, Clock, 
  Bell, Settings, LogOut, Edit2, Save, X, Phone, Mail,
  Calendar, TrendingUp, Zap, MessageCircle
} from 'lucide-react';

const VolunteerProfile = () => {
  const navigate = useNavigate();
  const {
    volunteerId,
    volunteerProfile,
    myTasks,
    taskHistory,
    availability,
    notifications,
    setVolunteerProfile,
    toggleAvailability,
    fetchVolunteerData,
    getStats,
    markNotificationRead,
    getUnreadNotificationCount
  } = useVolunteerStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!volunteerId) {
      const storedId = localStorage.getItem('volunteerId');
      if (!storedId) {
        navigate('/login');
        return;
      }
    }
    loadVolunteerProfile();
    fetchVolunteerData();
  }, [volunteerId]);

  const loadVolunteerProfile = async () => {
    try {
      const id = volunteerId || localStorage.getItem('volunteerId');
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/resource/volunteer/profile/${id}`, {
        headers: token ? { token } : {},
      });
      const data = await response.json();
      
      if (response.ok) {
        setVolunteerProfile(data.volunteer);
        setEditForm(data.volunteer);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm(volunteerProfile);
    }
    setIsEditing(!isEditing);
  };

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
        setVolunteerProfile(editForm);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('volunteerId');
    navigate('/login');
  };

  const handleOpenTelegram = () => {
    window.open('https://t.me/crisisnet_bot', '_blank');
  };

  const stats = getStats();
  const unreadCount = getUnreadNotificationCount();

  const skillOptions = [
    'first_aid', 'medical', 'rescue', 'swimming', 'firefighting',
    'search_and_rescue', 'logistics', 'communication', 'driver'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {volunteerProfile?.name?.charAt(0) || 'V'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {volunteerProfile?.name || 'Volunteer'}
                </h1>
                <p className="text-sm text-gray-500">ID: {volunteerId}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleOpenTelegram}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Open Telegram</span>
              </button>

              <button
                onClick={toggleAvailability}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  availability
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {availability ? 'Available' : 'Unavailable'}
              </button>

              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-blue-500" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.active_tasks}</div>
            <div className="text-sm text-gray-500">Active Tasks</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.completed_tasks}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.high_priority_tasks}</div>
            <div className="text-sm text-gray-500">High Priority</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.total_tasks}</div>
            <div className="text-sm text-gray-500">Total Tasks</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'dashboard'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'tasks'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Tasks
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'profile'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Profile Settings
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome back!</h2>
                  <p className="text-gray-600 mb-6">
                    You're making a difference in your community. Here's your current status:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                      <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${availability ? 'text-green-600' : 'text-gray-600'}`}>
                            {availability ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Skills:</span>
                          <span className="font-medium text-gray-900">
                            {volunteerProfile?.skills?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-gray-900">
                            {volunteerProfile?.location || 'Not set'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
                      <h3 className="font-semibold text-gray-900 mb-3">Impact Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Response Rate:</span>
                          <span className="font-medium text-green-600">
                            {stats.completed_tasks > 0 
                              ? `${Math.round((stats.completed_tasks / stats.total_tasks) * 100)}%`
                              : '0%'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Joined:</span>
                          <span className="font-medium text-gray-900">
                            {volunteerProfile?.registered_at 
                              ? new Date(volunteerProfile.registered_at).toLocaleDateString()
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {myTasks.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Tasks</h3>
                    <div className="space-y-3">
                      {myTasks.slice(0, 3).map((task, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-semibold text-gray-900">{task.task}</h4>
                            <p className="text-sm text-gray-600">{task.location}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Stay Connected via Telegram</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Get instant crisis alerts and task updates on Telegram
                    </p>
                    <button
                      onClick={handleOpenTelegram}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Open Telegram Bot →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <VolunteerTasks volunteerId={volunteerId} />
            )}

            {activeTab === 'profile' && (
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
                  {!isEditing ? (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleEditToggle}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={isEditing ? editForm.name : volunteerProfile?.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={isEditing ? editForm.email : volunteerProfile?.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
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
                        value={isEditing ? editForm.phone : volunteerProfile?.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={isEditing ? editForm.location : volunteerProfile?.location}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Award className="w-4 h-4 inline mr-1" />
                      Skills
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {skillOptions.map(skill => {
                        const hasSkill = isEditing 
                          ? editForm.skills?.includes(skill)
                          : volunteerProfile?.skills?.includes(skill);
                        
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => isEditing && handleSkillToggle(skill)}
                            disabled={!isEditing}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
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

                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Volunteer ID:</span>
                        <span className="font-mono text-gray-900">{volunteerId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Member Since:</span>
                        <span className="text-gray-900">
                          {volunteerProfile?.registered_at 
                            ? new Date(volunteerProfile.registered_at).toLocaleDateString()
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Status:</span>
                        <span className="text-green-600 font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;