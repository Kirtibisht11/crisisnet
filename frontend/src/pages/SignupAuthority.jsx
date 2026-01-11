// SignupAuthority.jsx - Authority Registration Page with JWT
// Save this as: src/pages/SignupAuthority.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBestLocation } from '../utils/location';

const SignupAuthority = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    designation: '',
    authorityToken: '',
    address: '', // human-readable display only
    latitude: null,
    longitude: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationEditable, setLocationEditable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get current human-readable location (address)
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setError('');
    try {
      const best = await getBestLocation();
      const human = best.humanLocation || (best.lat && best.lon ? `${best.lat.toFixed(4)}, ${best.lon.toFixed(4)}` : 'Unknown location');
      setFormData(prev => ({
        ...prev,
        address: human, // display only
        latitude: best.lat,
        longitude: best.lon
      }));
      setLocationEditable(false);
    } catch (err) {
      console.error('Error getting location:', err);
      setError('Unable to detect address. You can enter it manually.');
      setLocationEditable(true);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    // Phone validation (must start with + and contain 10-15 digits)
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Phone must be in format: +919876543210');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.organizationName.trim()) {
      setError('Organization name is required');
      return false;
    }
    if (!formData.designation.trim()) {
      setError('Designation is required');
      return false;
    }
    if (!formData.authorityToken.trim()) {
      setError('Authority Access Token is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.replace(/\s/g, ''),
          password: formData.password,
          role: 'authority',
          latitude: formData.latitude || 0.0,
          longitude: formData.longitude || 0.0,
          organization_name: formData.organizationName.trim(),
          designation: formData.designation.trim(),
          authority_token: formData.authorityToken.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Signup failed');
      }

      // Store JWT token and user info in localStorage
      const token = data.access_token || data.token || data.token_type || null;
      if (token) localStorage.setItem('crisisnet_token', token);
      if (token) localStorage.setItem('access_token', token);
      if (data.user) localStorage.setItem('crisisnet_current_user', JSON.stringify(data.user));

      // Show success message
      alert('Authority account created successfully! 🎉\n\nRedirecting to Authority Dashboard...');
      
      // Navigate to authority dashboard
      navigate('/authority', { replace: true });

    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* HEADER - Professional Dark Theme */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <Link to="/" className="font-bold text-xl tracking-tight">CrisisNet</Link>
          <Link 
            to="/login" 
            className="text-sm border border-slate-600 px-3 py-1.5 rounded hover:bg-slate-800 transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="w-[96%] mx-auto py-12">
        <div className="max-w-3xl mx-auto">
          {/* PAGE HEADER */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Authority Registration
            </h1>
            <p className="text-slate-600 text-lg">
              Join CrisisNet as an authorized emergency responder
            </p>
          </div>

          {/* SIGNUP FORM */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-800 font-semibold">{error}</p>
              </div>
            )}

            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Personal Information
              </h3>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+919876543210"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Organization Information Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Organization Details
              </h3>

              {/* Authority Token */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Authority Access Token *
                </label>
                <input
                  type="password"
                  name="authorityToken"
                  value={formData.authorityToken}
                  onChange={handleChange}
                  placeholder="Enter secure access token"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Required for verification. Contact administrator if missing.</p>
              </div>

              {/* Organization Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="e.g., Delhi Police, NDRF, Fire Department"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g., Inspector, Deputy Commissioner, Chief Officer"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Location (Address)
              </h3>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, address: e.target.value }));
                    setError('');
                  }}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors ${
                    locationEditable ? 'bg-white' : 'bg-slate-50'
                  }`}
                  readOnly={!locationEditable}
                />
              </div>

              {/* Address Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {locationLoading ? 'Detecting address...' : 'Detect Address'}
                </button>

                <button
                  type="button"
                  onClick={() => setLocationEditable(prev => !prev)}
                  className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition-colors"
                >
                  {locationEditable ? 'Lock Address' : 'Edit Address'}
                </button>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Security
              </h3>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password (min 6 characters)"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors pr-12"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors pr-12"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>


            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-lg shadow-sm transition-all ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
              }`}
            >
              {loading ? 'Creating Account...' : 'Register as Authority'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                Sign in
              </Link>
            </p>
            <Link
              to="/"
              className="block text-slate-500 text-sm hover:text-slate-700"
            >
              Back to Home
            </Link>
          </div>

          {/* Info Notice */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupAuthority;