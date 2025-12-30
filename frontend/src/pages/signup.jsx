import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../services/auth';

export default function Signup() {
  const navigate = useNavigate();
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
    // Set a max timeout of 2 seconds to prevent hanging
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
      
      // Redirect to login page
      navigate('/login');
    } catch (err) {
      console.error('Signup error', err);
      setErrors(prev => ({ ...prev, submit: err.message || 'Registration failed' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8">
          <h1 className="text-3xl font-bold mb-2">Create an account</h1>
          <p className="text-gray-600 mb-6">Join CrisisNet to help during emergencies</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border rounded">
                <option value="citizen">Citizen</option>
                <option value="volunteer">Volunteer</option>
                <option value="authority">Authority</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500" 
                placeholder="Enter your full name"
              />
              {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange} 
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500" 
                placeholder="Enter phone number (e.g., +91 9999999999)"
              />
              {errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input 
                type="password"
                name="password" 
                value={formData.password} 
                onChange={handleInputChange} 
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500" 
                placeholder="Enter password (min 6 characters)"
              />
              {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input 
                type="password"
                name="confirmPassword" 
                value={formData.confirmPassword} 
                onChange={handleInputChange} 
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500" 
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <div className="text-red-500 text-sm mt-1">{errors.confirmPassword}</div>}
            </div>

            {errors.submit && <div className="bg-red-50 border border-red-200 p-3 text-red-700 rounded">{errors.submit}</div>}

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center text-sm text-gray-600 pt-2">
              Already have an account? <a href="/login" className="text-blue-600 hover:underline font-medium">Login</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
