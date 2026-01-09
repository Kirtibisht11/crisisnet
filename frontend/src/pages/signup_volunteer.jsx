import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  const renderSubmitError = (err) => {
    if (!err) return null;
    if (typeof err === 'string') return <p className="text-sm">{err}</p>;
    if (Array.isArray(err)) {
      return err.map((e, i) => (
        <p key={i} className="text-sm">{e?.msg || e?.message || JSON.stringify(e)}</p>
      ));
    }
    if (typeof err === 'object') {
      if (err.detail) {
        if (Array.isArray(err.detail)) return err.detail.map((d, i) => <p key={i} className="text-sm">{d.msg || JSON.stringify(d)}</p>);
        return <p className="text-sm">{String(err.detail)}</p>;
      }
      return <p className="text-sm">{JSON.stringify(err)}</p>;
    }
    return <p className="text-sm">{String(err)}</p>;
  };

  const skillOptions = [
    { id: 'first_aid', label: 'First Aid' },
    { id: 'medical', label: 'Medical' },
    { id: 'rescue', label: 'Rescue Operations'},
    { id: 'swimming', label: 'Swimming' },
    { id: 'firefighting', label: 'Firefighting'},
    { id: 'search_and_rescue', label: 'Search & Rescue'},
    { id: 'logistics', label: 'Logistics'},
    { id: 'communication', label: 'Communication'},
    { id: 'driver', label: 'Driver/Transport' },
    { id: 'counseling', label: 'Counseling'}
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
      const volunteerPayload = {
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
      };

      // Check if a citizen is signed in
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      console.log('Current user:', currentUser);

      if (currentUser && currentUser.user_id) {
        // Attach to existing user
        console.log('Attaching volunteer to existing user:', currentUser.user_id);
        const attachPayload = { ...volunteerPayload, user_id: currentUser.user_id };

        const attachResponse = await fetch(
          'http://localhost:8000/api/volunteer/attach-to-user',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attachPayload)
          }
        );

        const attachData = await attachResponse.json();
        console.log('Attach response:', attachData);

        if (attachResponse.ok) {
          const volunteerId = attachData.volunteer?.id || attachData.volunteer_id;
          localStorage.setItem('volunteerId', volunteerId);
          // Update user in localStorage with volunteer data
          if (attachData.user) {
            localStorage.setItem('user', JSON.stringify(attachData.user));
          }
          setTimeout(() => {
            navigate('/volunteer', { state: { openTab: 'dashboard' } });
          }, 800);
          return;
        } else {
          setErrors({ submit: attachData.detail || 'Failed to attach volunteer profile' });
          console.error('Attach failed:', attachData);
        }
      } else {
        // No user signed in, create standalone volunteer
        console.log('No user signed in, creating standalone volunteer profile');
        const response = await fetch(
          'http://localhost:8000/api/volunteer/profile',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(volunteerPayload)
          }
        );

        let data = {};
        try {
          data = await response.json();
        } catch {
          throw new Error('Invalid server response');
        }

        if (response.ok) {
          localStorage.setItem('volunteerId', data.volunteer_id || data.id);
          setTimeout(() => {
            navigate('/volunteer', { state: { openTab: 'dashboard' } });
          }, 800);
        } else {
          setErrors({ submit: data.detail || 'Registration failed' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('crisisnet_user') || '{}');
      if (storedUser) {
        setFormData(prev => ({
          ...prev,
          fullName: prev.fullName || storedUser.name || storedUser.fullName || storedUser.username || '',
          email: prev.email || storedUser.email || '',
          phone: prev.phone || storedUser.phone || storedUser.phone_number || ''
        }));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  /* ---------- UI CODE--------------*/
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <Link to="/" className="font-bold text-xl tracking-tight">CrisisNet</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-300 hidden sm:block">Volunteer Registration</span>
            <Link to="/login" className="text-sm border border-slate-600 px-3 py-1.5 rounded hover:bg-slate-800 transition">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <div className="w-[96%] mx-auto py-12 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Join CrisisNet</h1>
          <p className="text-slate-600 text-lg">Become a community hero. Save lives.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex">
            {[1, 2, 3].map(num => (
              <div
                key={num}
                className={`flex-1 py-4 text-center border-b-4 transition ${
                  step >= num
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-slate-200 text-slate-400'
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
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Personal Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:border-slate-500 focus:outline-none transition-colors ${
                      errors.fullName ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:border-slate-500 focus:outline-none transition-colors ${
                        errors.email ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:border-slate-500 focus:outline-none transition-colors ${
                        errors.phone ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="9876543210"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
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
                    className={`w-full px-4 py-3 border rounded-lg focus:border-slate-500 focus:outline-none transition-colors ${
                      errors.location ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Ward 12, Downtown"
                  />
                  <p className="text-xs text-slate-500 mt-1">{detectingLocation ? 'Detecting location…' : (location.humanLocation || (location.lat ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : 'Auto-detect on focus'))}</p>
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Address (Optional)
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
                    placeholder="Complete address for emergency contact"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Skills & Availability</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
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
                            : 'border-slate-200 hover:border-slate-300'
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Experience Level (Optional)
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
                  >
                    <option value="">Select experience level</option>
                    <option value="beginner">Beginner (0-1 years)</option>
                    <option value="intermediate">Intermediate (1-3 years)</option>
                    <option value="advanced">Advanced (3-5 years)</option>
                    <option value="expert">Expert (5+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Availability *
                  </label>
                  <div className="space-y-2">
                    {['anytime', 'weekdays', 'weekends', 'evenings'].map(option => (
                      <label key={option} className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                          type="radio"
                          name="availability"
                          value={option}
                          checked={formData.availability === option}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-3 text-slate-700 capitalize">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.availability && <p className="text-red-500 text-sm mt-2">{errors.availability}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Emergency Contact (Optional)
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
                    placeholder="Name and phone number"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Review & Confirm</h2>
                
                <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Personal Information</h3>
                    <p className="text-slate-600">Name: {formData.fullName}</p>
                    <p className="text-slate-600">Email: {formData.email}</p>
                    <p className="text-slate-600">Phone: {formData.phone}</p>
                    <p className="text-slate-600">Location: {formData.location}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Skills</h3>
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
                    <h3 className="font-semibold text-slate-700 mb-2">Availability</h3>
                    <p className="text-slate-600 capitalize">{formData.availability}</p>
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
                    <span className="ml-3 text-sm text-slate-700">
                      I agree to the terms and conditions. I understand that I may be contacted for emergency response and will make myself available when possible.
                    </span>
                  </label>
                  {errors.terms && <p className="text-red-500 text-sm mt-2 ml-8">{errors.terms}</p>}
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {renderSubmitError(errors.submit)}
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
                  className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
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
                  className="ml-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
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