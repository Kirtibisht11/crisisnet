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
    <div className="min-h-screen bg-slate-900 font-sans overflow-hidden relative">
      {/* Diagonal Split Container */}
      <div className="min-h-screen flex relative">
        
        {/* LEFT SIDE - Hero Section with Diagonal */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=1200')",
              backgroundPosition: "center center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/80 via-slate-900/70 to-slate-900/90"></div>
          </div>

          {/* Diagonal Cut Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent"></div>
          <svg className="absolute right-0 top-0 h-full w-24 text-slate-900" preserveAspectRatio="none" viewBox="0 0 100 1000">
            <polygon points="0,0 100,0 100,1000 50,1000" fill="currentColor" />
          </svg>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white max-w-2xl">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-6">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl xl:text-6xl font-bold mb-6 leading-tight">
                Become a<br />
                Community<br />
                Hero.
              </h1>
              <div className="w-20 h-1 bg-red-400 mb-6"></div>
              <p className="text-xl xl:text-2xl text-slate-200 leading-relaxed">
                Join our network of dedicated volunteers ready to respond 
                when communities need help the most. Your skills can save lives.
              </p>
            </div>

            <div className="space-y-4 text-slate-300">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg">Get matched with emergencies based on your skills</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg">Respond to crises on your own schedule</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg">Make a real difference in your community</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Volunteer Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center bg-slate-900 relative overflow-y-auto">
          <div className="w-full max-w-md px-6 sm:px-8 py-12">
            {/* Logo/Brand */}
            <div className="mb-6">
              <Link to="/" className="inline-block">
                <h2 className="text-3xl font-bold text-white tracking-tight">CrisisNet</h2>
              </Link>
            </div>

            {/* Form Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Volunteer Registration</h1>
              <p className="text-slate-400">Join our community of heroes</p>
            </div>

            {/* Progress Steps */}
            <div className="flex mb-8">
              {[1, 2, 3].map(num => (
                <div
                  key={num}
                  className={`flex-1 py-3 text-center border-b-2 transition text-sm font-medium ${
                    step >= num
                      ? 'border-red-500 text-red-400'
                      : 'border-slate-700 text-slate-500'
                  }`}
                >
                  Step {num}
                  {step > num && <CheckCircle2 className="w-4 h-4 inline ml-1" />}
                </div>
              ))}
            </div>

            {/* Form Content */}
            <div className="space-y-5">
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all ${
                        errors.fullName ? 'border-red-500' : 'border-slate-700'
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all ${
                        errors.email ? 'border-red-500' : 'border-slate-700'
                      }`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all ${
                        errors.phone ? 'border-red-500' : 'border-slate-700'
                      }`}
                      placeholder="9876543210"
                    />
                    {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
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
                      className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all ${
                        errors.location ? 'border-red-500' : 'border-slate-700'
                      }`}
                      placeholder="Ward 12, Downtown"
                    />
                    <p className="text-xs text-slate-500 mt-2">Used for matching you with nearby emergencies</p>
                    <p className="text-xs text-red-400 mt-1">{detectingLocation ? 'Detecting location…' : (location.humanLocation ? `📍 ${location.humanLocation}` : (location.lat ? `📍 ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : 'Auto-detect on focus'))}</p>
                    {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Address (Optional)
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                      placeholder="Complete address for emergency contact"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Skills & Availability</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Select Your Skills * (Choose all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                      {skillOptions.map(skill => (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => handleSkillToggle(skill.id)}
                          className={`p-3 rounded-lg border-2 transition text-left ${
                            formData.skills.includes(skill.id)
                              ? 'border-red-500 bg-red-500/10 text-red-400'
                              : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div className="text-xs font-medium">{skill.label}</div>
                        </button>
                      ))}
                    </div>
                    {errors.skills && <p className="text-red-400 text-sm mt-2">{errors.skills}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Experience Level (Optional)
                    </label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                    >
                      <option value="">Select experience level</option>
                      <option value="beginner">Beginner (0-1 years)</option>
                      <option value="intermediate">Intermediate (1-3 years)</option>
                      <option value="advanced">Advanced (3-5 years)</option>
                      <option value="expert">Expert (5+ years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Availability *
                    </label>
                    <div className="space-y-2">
                      {['anytime', 'weekdays', 'weekends', 'evenings'].map(option => (
                        <label key={option} className="flex items-center p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 cursor-pointer">
                          <input
                            type="radio"
                            name="availability"
                            value={option}
                            checked={formData.availability === option}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-red-600"
                          />
                          <span className="ml-3 text-slate-300 capitalize text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                    {errors.availability && <p className="text-red-400 text-sm mt-2">{errors.availability}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Emergency Contact (Optional)
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                      placeholder="Name and phone number"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Review & Confirm</h3>
                  
                  <div className="bg-slate-800 rounded-lg p-5 space-y-4 border border-slate-700">
                    <div>
                      <h4 className="font-semibold text-slate-300 mb-2 text-sm">Personal Information</h4>
                      <p className="text-slate-400 text-sm">Name: {formData.fullName}</p>
                      <p className="text-slate-400 text-sm">Email: {formData.email}</p>
                      <p className="text-slate-400 text-sm">Phone: {formData.phone}</p>
                      <p className="text-slate-400 text-sm">Location: {formData.location}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-300 mb-2 text-sm">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map(skillId => {
                          const skill = skillOptions.find(s => s.id === skillId);
                          return (
                            <span key={skillId} className="px-2 py-1 bg-red-500/10 text-red-400 rounded-full text-xs border border-red-500/20">
                              {skill?.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-300 mb-2 text-sm">Availability</h4>
                      <p className="text-slate-400 text-sm capitalize">{formData.availability}</p>
                    </div>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-red-600 mt-1 rounded"
                      />
                      <span className="ml-3 text-sm text-slate-300">
                        I agree to the terms and conditions. I understand that I may be contacted for emergency response and will make myself available when possible.
                      </span>
                    </label>
                    {errors.terms && <p className="text-red-400 text-sm mt-2 ml-8">{errors.terms}</p>}
                  </div>

                  {errors.submit && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                      {renderSubmitError(errors.submit)}
                    </div>
                  )}

                  {isSubmitting && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-2"></div>
                      <p className="text-sm">Registering your account...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 border border-slate-600 rounded-lg text-slate-300 font-medium hover:bg-slate-800 transition"
                  >
                    Back
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="ml-auto px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition shadow-lg shadow-red-600/20"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="ml-auto px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 shadow-lg shadow-red-600/20"
                  >
                    {isSubmitting ? 'Registering...' : 'Complete Registration'}
                  </button>
                )}
              </div>
            </div>

            {/* Footer Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Already registered?{" "}
                <Link to="/login" className="text-red-400 font-medium hover:text-red-300 transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupVolunteer;