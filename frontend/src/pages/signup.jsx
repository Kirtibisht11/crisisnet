import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup, login } from '../services/auth';
import { useUserStore } from '../state/userStore';

export default function Signup() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const [role, setRole] = useState('citizen');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const tryGeolocation = () => new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ lat: 0.0, lon: 0.0 }), 2000);
    if (!navigator.geolocation) {
      clearTimeout(timeout);
      return resolve({ lat: 0.0, lon: 0.0 });
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        clearTimeout(timeout);
        resolve({ lat: 0.0, lon: 0.0 });
      },
      { timeout: 1500 }
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const pos = await tryGeolocation();
      await signup(formData.name, formData.phone, formData.password, role, pos.lat || 0.0, pos.lon || 0.0);
      try {
        const auth = await login(formData.phone, formData.password);
        const token = auth?.access_token;
        const user = auth?.user;
        if (token) localStorage.setItem('access_token', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));
        setUser(user, token);
        navigate('/dashboard');
        return;
      } catch (err) {
        navigate('/login');
        return;
      }
    } catch (err) {
      console.error('Signup error', err);
      setErrors(prev => ({ ...prev, submit: err.message || 'Registration failed' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">CN</span>
            </div>
            <span className="font-bold text-slate-900">CrisisNet</span>
          </Link>
          <p className="text-sm text-slate-600">
            Already a member? <Link to="/login" className="text-blue-700 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </header>

      {/* Signup Form */}
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
            <p className="text-slate-600">Join CrisisNet to help coordinate response during emergencies</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Your Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                <option value="citizen">Citizen / Resident</option>
                <option value="volunteer">Volunteer</option>
                <option value="authority">Authority / Official</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Full Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Phone Number
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-6"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-700 font-medium hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
