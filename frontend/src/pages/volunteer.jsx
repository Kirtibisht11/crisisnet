import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { UserPlus, MapPin, Award, CheckCircle } from 'lucide-react';

const formatCrisisType = (type) => {
  const types = {
    'flood': { label: 'Flood Emergency', emoji: '🌊' },
    'fire': { label: 'Fire Emergency', emoji: '🔥' },
    'medical': { label: 'Medical Emergency', emoji: '🏥' },
    'earthquake': { label: 'Earthquake', emoji: '🏚️' },
    'landslide': { label: 'Landslide', emoji: '⛰️' },
    'collapse': { label: 'Building Collapse', emoji: '🏢' }
  };
  return types[type] || { label: type, emoji: '⚠️' };
};

const VolunteerPage = () => {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('signup');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skills: [],
    location: '',
    available: true
  });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [volunteerId, setVolunteerId] = useState(null);
  const [tasks, setTasks] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const skillOptions = [
    'first_aid', 'medical', 'rescue', 'swimming', 'firefighting',
    'search_and_rescue', 'logistics', 'communication', 'driver'
  ];

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadTasks();
    }
  }, [activeTab]);

  const loadTasks = () => {
    try {
      const allTasks = JSON.parse(localStorage.getItem('volunteer_tasks') || '[]');
      const volunteerTasks = volunteerId 
        ? allTasks.filter(task => task.volunteer_id === volunteerId)
        : allTasks;
      setTasks(volunteerTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => {
      const currentSkills = [...prev.skills];
      const skillIndex = currentSkills.indexOf(skill);
      if (skillIndex > -1) {
        currentSkills.splice(skillIndex, 1);
      } else {
        currentSkills.push(skill);
      }
      return { ...prev, skills: currentSkills };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || formData.skills.length === 0 || !formData.location) {
      setSubmitStatus({ type: 'error', message: 'Please fill all required fields' });
      return;
    }

    try {
      const newVolunteerId = `VOL_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
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

      const existingUsers = JSON.parse(localStorage.getItem('crisisnet_users') || '[]');
      existingUsers.push(newVolunteer);
      localStorage.setItem('crisisnet_users', JSON.stringify(existingUsers));

      const existingVolunteers = JSON.parse(localStorage.getItem('volunteers_list') || '[]');
      existingVolunteers.push(newVolunteer);
      localStorage.setItem('volunteers_list', JSON.stringify(existingVolunteers));

      setSubmitStatus({ 
        type: 'success', 
        message: `Registration successful! Your volunteer ID: ${newVolunteerId}` 
      });
      setVolunteerId(newVolunteerId);

      setFormData({
        name: '',
        phone: '',
        skills: [],
        location: '',
        available: true
      });

      setTimeout(() => {
        setActiveTab('dashboard');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Registration failed. Please try again.' 
      });
    }
  };

  const loadDemoVolunteers = () => {
    const demoVolunteers = [
      {
        id: 'VOL_DEMO_001',
        volunteer_id: 'VOL_DEMO_001',
        name: 'John Doe',
        phone: '+1234567890',
        skills: ['first_aid', 'rescue', 'swimming'],
        location: 'Downtown Area',
        available: true,
        role: 'volunteer',
        registered_at: new Date().toISOString()
      },
      {
        id: 'VOL_DEMO_002',
        volunteer_id: 'VOL_DEMO_002',
        name: 'Jane Smith',
        phone: '+1234567891',
        skills: ['medical', 'first_aid', 'firefighting'],
        location: 'North District',
        available: true,
        role: 'volunteer',
        registered_at: new Date().toISOString()
      },
      {
        id: 'VOL_DEMO_003',
        volunteer_id: 'VOL_DEMO_003',
        name: 'Mike Johnson',
        phone: '+1234567892',
        skills: ['rescue', 'search_and_rescue', 'driver'],
        location: 'East Side',
        available: true,
        role: 'volunteer',
        registered_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('crisisnet_users', JSON.stringify(demoVolunteers));
    localStorage.setItem('volunteers_list', JSON.stringify(demoVolunteers));
    alert('Demo volunteers loaded! Check the Resource Dashboard.');
  };

  const handleAcceptTask = (task) => {
    if (!window.confirm('Accept this crisis assignment?')) return;
    try {
      const allTasks = JSON.parse(localStorage.getItem('volunteer_tasks') || '[]');
      const updatedTasks = allTasks.map(t => 
        t.assignment_id === task.assignment_id 
          ? { ...t, status: 'accepted', accepted_at: new Date().toISOString() }
          : t
      );
      localStorage.setItem('volunteer_tasks', JSON.stringify(updatedTasks));
      const assignments = JSON.parse(localStorage.getItem('resource_assignments') || '[]');
      const updatedAssignments = assignments.map(a =>
        a.assignment_id === task.assignment_id
          ? { ...a, status: 'accepted', accepted_at: new Date().toISOString() }
          : a
      );
      localStorage.setItem('resource_assignments', JSON.stringify(updatedAssignments));
      alert('Task accepted! Please proceed to the crisis location.');
      loadTasks();
    } catch (err) {
      console.error('Error accepting task:', err);
      alert('Failed to accept task');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">CN</span>
            </div>
            <span className="font-bold text-slate-900">CrisisNet</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/volunteer" className="text-sm font-medium text-blue-700">Volunteer Portal</Link>
            <a href="#help" className="text-sm text-slate-600 hover:text-slate-900">Help</a>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <p className="font-medium text-slate-900">{user?.name || user?.username || "Volunteer"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:border-slate-400 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('signup')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'signup'
                ? 'bg-blue-700 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Sign Up
          </button>
          <button
            onClick={() => {
              setActiveTab('dashboard');
              loadTasks();
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'dashboard'
                ? 'bg-blue-700 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            My Tasks
          </button>
        </div>

        {/* Content */}
        {activeTab === 'signup' ? (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Register as Volunteer</h2>
              
              {submitStatus && (
                <div className={`mb-6 p-4 rounded-lg ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {submitStatus.type === 'success' && (
                    <CheckCircle className="w-5 h-5 inline mr-2" />
                  )}
                  {submitStatus.message}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Skills * (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {skillOptions.map(skill => (
                      <button
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                          formData.skills.includes(skill)
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {skill.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="mt-2 text-sm text-slate-600">
                      Selected: {formData.skills.length} skill(s)
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location/Area *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Ward 12, Downtown, etc."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="available"
                    checked={formData.available}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-700 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-sm font-medium text-slate-700">
                    I am currently available for emergency response
                  </label>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
                >
                  Register as Volunteer
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={loadDemoVolunteers}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold transition"
                >
                  Load Demo Volunteers (For Testing)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">My Assigned Tasks</h2>
            
            {tasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <Award className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <div className="text-xl font-semibold text-slate-600">No tasks assigned yet</div>
                <div className="text-sm text-slate-500 mt-2">Check back later for crisis assignments</div>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const crisis = formatCrisisType(task.crisis_type);
                  return (
                    <div
                      key={task.assignment_id}
                      className="bg-white border border-slate-300 rounded-lg p-5 hover:border-slate-400 transition"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl">{crisis.emoji}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-900">{crisis.label}</h3>
                          <p className="text-slate-600">{task.location}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                          task.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      
                      {task.message && (
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                          {task.message}
                        </p>
                      )}

                      {task.status === 'assigned' && (
                        <button
                          onClick={() => handleAcceptTask(task)}
                          className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition"
                        >
                          Accept Task
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerPage;
