import React, { useState } from 'react';
import VolunteerTasks from '../components/VolunteerTasks';
import { UserPlus, MapPin, Award, CheckCircle } from 'lucide-react';

const VolunteerPage = () => {
  const [activeTab, setActiveTab] = useState('signup');
  const [formData, setFormData] = useState({
    name: '',
    skills: '',
    location: '',
    available: true
  });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [volunteerId, setVolunteerId] = useState(null);

  const skillOptions = [
    'first_aid', 'medical', 'rescue', 'swimming', 'firefighting',
    'search_and_rescue', 'logistics', 'communication', 'driver'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillToggle = (skill) => {
    const currentSkills = formData.skills
      ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const skillIndex = currentSkills.indexOf(skill);

    if (skillIndex > -1) {
      currentSkills.splice(skillIndex, 1);
    } else {
      currentSkills.push(skill);
    }

    setFormData(prev => ({
      ...prev,
      skills: currentSkills.join(', ')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.skills || !formData.location) {
      setSubmitStatus({ type: 'error', message: 'Please fill all required fields' });
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/resource/volunteer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          skills: formData.skills.split(',').map(s => s.trim()),
          location: formData.location,
          available: formData.available
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid server response');
      }

      if (response.ok) {
        setSubmitStatus({ 
          type: 'success', 
          message: 'Registration successful! Your volunteer ID: ' + data.volunteer_id 
        });
        setVolunteerId(data.volunteer_id);
        console.log('Volunteer registered:', data);
        
        setFormData({
          name: '',
          skills: '',
          location: '',
          available: true
        });

        setTimeout(() => {
          setActiveTab('dashboard');
        }, 2000);
      } else {
        setSubmitStatus({ 
          type: 'error', 
          message: data.detail || 'Registration failed' 
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Network error. Please try again.' 
      });
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
              onClick={() => setActiveTab('dashboard')}
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

                <form onSubmit={handleSubmit} className="space-y-6">
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
                      required
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
                          type="button"
                          onClick={() => handleSkillToggle(skill)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            formData.skills
                              .split(',')
                              .map(s => s.trim())
                              .includes(skill)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {skill.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
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
                      required
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
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
                  >
                    Register as Volunteer
                  </button>
                </form>
              </div>
            ) : (
              <VolunteerTasks volunteerId={volunteerId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerPage;
