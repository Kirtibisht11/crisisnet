import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBestLocation } from '../utils/location';
import { Heart, MapPin, Phone, Mail, CheckCircle2 } from 'lucide-react';

const SignupVolunteer = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    address: '',
    skills: [],
    experience: '',
    availability: 'weekends',
    emergencyContact: '',
    termsAccepted: false
  });
  const [location, setLocation] = useState({ lat: null, lon: null, source: null, humanLocation: '' });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const skillOptions = [
    { id: 'first_aid', label: 'First Aid', icon: '🏥' },
    { id: 'medical', label: 'Medical', icon: '⚕️' },
    { id: 'rescue', label: 'Rescue Operations', icon: '🚁' },
    { id: 'swimming', label: 'Swimming', icon: '🏊' },
    { id: 'firefighting', label: 'Firefighting', icon: '🚒' },
    { id: 'search_and_rescue', label: 'Search & Rescue', icon: '🔍' },
    { id: 'logistics', label: 'Logistics', icon: '📦' },
    { id: 'communication', label: 'Communication', icon: '📡' },
    { id: 'driver', label: 'Driver/Transport', icon: '🚗' },
    { id: 'counseling', label: 'Counseling', icon: '💬' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSkillToggle = (skillId) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(s => s !== skillId)
        : [...prev.skills, skillId]
    }));
    if (errors.skills) {
      setErrors(prev => ({ ...prev, skills: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Invalid email format';

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10)
      newErrors.phone = 'Invalid phone number';

    if (!formData.location.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (formData.skills.length === 0)
      newErrors.skills = 'Select at least one skill';
    if (!formData.availability)
      newErrors.availability = 'Select your availability';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.termsAccepted) {
      setErrors({ terms: 'You must accept the terms and conditions' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        'http://localhost:8000/resource/volunteer/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            address: formData.address,
            skills: formData.skills,
            experience: formData.experience,
            availability: formData.availability,
            emergency_contact: formData.emergencyContact,
            available: true
          })
        }
      );

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid server response');
      }

      if (response.ok) {
        localStorage.setItem('volunteerId', data.volunteer_id);
        setTimeout(() => {
          navigate('/volunteer', { state: { openTab: 'dashboard' } });
        }, 800);
      } else {
        setErrors({ submit: data.detail || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- UI CODE--------------*/
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Join CrisisNet</h1>
          <p className="text-gray-600 text-lg">Become a community hero. Save lives.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex">
            {[1, 2, 3].map(num => (
              <div
                key={num}
                className={`flex-1 py-4 text-center border-b-4 transition ${
                  step >= num
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-400'
                }`}
              >
                <div className="font-semibold">
                  Step {num}
                  {step > num && <CheckCircle2 className="w-5 h-5 inline ml-2" />}
                </div>
              </div>
            ))}
          </div>

          <div className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="9876543210"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
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
                    onFocus={async () => {
                      if (detectingLocation) return;
                      setDetectingLocation(true);
                      try {
                        const best = await getBestLocation();
                        setLocation(best);
                        if (best.humanLocation) {
                          setFormData(prev => ({ ...prev, location: best.humanLocation }));
                        } else if (best.lat) {
                          const coords = `${best.lat.toFixed(4)}, ${best.lon.toFixed(4)}`;
                          setFormData(prev => ({ ...prev, location: coords }));
                        }
                      } finally {
                        setDetectingLocation(false);
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ward 12, Downtown"
                  />
                  <p className="text-xs text-slate-500 mt-1">{detectingLocation ? 'Detecting location…' : (location.humanLocation || (location.lat ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : 'Auto-detect on focus'))}</p>
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address (Optional)
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Complete address for emergency contact"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Skills & Availability</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Your Skills * (Choose all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {skillOptions.map(skill => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => handleSkillToggle(skill.id)}
                        className={`p-4 rounded-lg border-2 transition text-left ${
                          formData.skills.includes(skill.id)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{skill.icon}</div>
                        <div className="text-sm font-medium">{skill.label}</div>
                      </button>
                    ))}
                  </div>
                  {errors.skills && <p className="text-red-500 text-sm mt-2">{errors.skills}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level (Optional)
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select experience level</option>
                    <option value="beginner">Beginner (0-1 years)</option>
                    <option value="intermediate">Intermediate (1-3 years)</option>
                    <option value="advanced">Advanced (3-5 years)</option>
                    <option value="expert">Expert (5+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability *
                  </label>
                  <div className="space-y-2">
                    {['anytime', 'weekdays', 'weekends', 'evenings'].map(option => (
                      <label key={option} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="availability"
                          value={option}
                          checked={formData.availability === option}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-3 text-gray-700 capitalize">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.availability && <p className="text-red-500 text-sm mt-2">{errors.availability}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact (Optional)
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Name and phone number"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Review & Confirm</h2>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Personal Information</h3>
                    <p className="text-gray-600">Name: {formData.fullName}</p>
                    <p className="text-gray-600">Email: {formData.email}</p>
                    <p className="text-gray-600">Phone: {formData.phone}</p>
                    <p className="text-gray-600">Location: {formData.location}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map(skillId => {
                        const skill = skillOptions.find(s => s.id === skillId);
                        return (
                          <span key={skillId} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {skill?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Availability</h3>
                    <p className="text-gray-600 capitalize">{formData.availability}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 mt-1 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      I agree to the terms and conditions. I understand that I may be contacted for emergency response and will make myself available when possible.
                    </span>
                  </label>
                  {errors.terms && <p className="text-red-500 text-sm mt-2 ml-8">{errors.terms}</p>}
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {errors.submit}
                  </div>
                )}

                {isSubmitting && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    Registering your account...
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="ml-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupVolunteer;