// SignupAuthority.jsx - Authority Registration Page with JWT
// Save this as: src/pages/SignupAuthority.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const SignupAuthority = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    designation: '',
    latitude: 0.0,
    longitude: 0.0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationEditable, setLocationEditable] = useState(false);

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setLocationEditable(false);
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        if (error && error.code === 1) {
          setError('Location permission denied. You can edit coordinates manually or continue with default (0,0).');
        } else {
          setError('Unable to retrieve location. You can edit coordinates manually or continue with default (0,0).');
        }
        setLocationEditable(true);
        setLocationLoading(false);
      }
    );
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
          latitude: formData.latitude,
          longitude: formData.longitude,
          organization_name: formData.organizationName.trim(),
          designation: formData.designation.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Signup failed');
      }

      // Store JWT token and user info in localStorage
      localStorage.setItem('crisisnet_token', data.token);
      localStorage.setItem('crisisnet_current_user', JSON.stringify(data.user));

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="text-6xl">🛡️</div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Authority Registration
          </h1>
          <p className="text-gray-600">
            Join CrisisNet as an authorized emergency responder
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <p className="text-red-800 font-semibold">{error}</p>
                </div>
              </div>
            )}

            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                Personal Information
              </h3>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+919876543210"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: +91 followed by 10 digits
                </p>
              </div>
            </div>

            {/* Organization Information Section */}
            <div className="space-y-4 pt-4 border-t-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                Organization Details
              </h3>

              {/* Organization Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="e.g., Delhi Police, NDRF, Fire Department"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g., Inspector, Deputy Commissioner, Chief Officer"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4 pt-4 border-t-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                Security
              </h3>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                  minLength={6}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4 pt-4 border-t-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                Location
              </h3>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    step="any"
                    className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors ${
                      locationEditable ? 'bg-white' : 'bg-gray-50'
                    }`}
                    readOnly={!locationEditable}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    step="any"
                    className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors ${
                      locationEditable ? 'bg-white' : 'bg-gray-50'
                    }`}
                    readOnly={!locationEditable}
                  />
                </div>
              </div>

              {/* Location Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex-1 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {locationLoading ? '🔄 Getting Location...' : 'Use Current Location'}
                </button>

                <button
                  type="button"
                  onClick={() => setLocationEditable(prev => !prev)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  {locationEditable ? 'Lock Coordinates' : 'Edit Coordinates'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white hover:shadow-xl'
              }`}
            >
              {loading ? 'Creating Account...' : 'Register as Authority'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline"
              >
                Login here
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-gray-500 text-sm hover:text-gray-700 hover:underline"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-bold">Note:</span> Authority accounts require verification. 
            Your credentials will be reviewed by the system administrator before activation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupAuthority;