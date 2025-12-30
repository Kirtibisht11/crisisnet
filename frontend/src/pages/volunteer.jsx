import { useState } from 'react';
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

  const skillOptions = [
    'first_aid', 'medical', 'rescue', 'swimming', 'firefighting',
    'search_and_rescue', 'logistics', 'communication', 'driver'
  ];

  // Load tasks when switching to dashboard
  useState(() => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">CrisisNet Volunteer Portal</h1>
            <p className="text-blue-100">Join the community response network</p>
          </div>

          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'signup'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserPlus className="w-5 h-5 inline mr-2" />
              Sign Up
            </button>
            <button
              onClick={() => {
                setActiveTab('dashboard');
                loadTasks();
              }}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Award className="w-5 h-5 inline mr-2" />
              My Tasks
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'signup' ? (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Register as Volunteer</h2>
                
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills * (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {skillOptions.map(skill => (
                        <button
                          key={skill}
                          onClick={() => handleSkillToggle(skill)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            formData.skills.includes(skill)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {skill.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                    {formData.skills.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Selected: {formData.skills.length} skill(s)
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location/Area *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Ward 12, Downtown, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="available"
                      checked={formData.available}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-700">
                      I am currently available for emergency response
                    </label>
                  </div>

                  <button
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
                  >
                    Register as Volunteer
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={loadDemoVolunteers}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition"
                  >
                    Load Demo Volunteers (For Testing)
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">My Assigned Tasks</h2>
                
                {tasks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <div className="text-xl font-semibold text-gray-600">No tasks assigned yet</div>
                    <div className="text-sm text-gray-500 mt-2">Check back later for crisis assignments</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => {
                      const crisis = formatCrisisType(task.crisis_type);
                      return (
                        <div
                          key={task.assignment_id}
                          className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-4xl">{crisis.emoji}</div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg">{crisis.label}</h3>
                              <p className="text-gray-600">{task.location}</p>
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
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-4">
                              {task.message}
                            </p>
                          )}

                          {task.status === 'assigned' && (
                            <button
                              onClick={() => handleAcceptTask(task)}
                              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition"
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
      </div>
    </div>
  );
};

export default VolunteerPage;