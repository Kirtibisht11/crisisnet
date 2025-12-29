import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState('citizen');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    address: '',
    skills: [],
    availability: 'anytime',
    org: '',
    title: '',
    termsAccepted: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
    }));
  };

  const skillOptions = ['first_aid','medical','rescue','swimming','firefighting','logistics','communication','driver'];

  const tryGeolocation = () => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: 0.0, lon: 0.0 });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: 0.0, lon: 0.0 }),
      { timeout: 3000 }
    );
  });

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (role === 'volunteer' && formData.skills.length === 0) newErrors.skills = 'Select at least one skill';
    if (!formData.termsAccepted) newErrors.termsAccepted = 'Accept terms to continue';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      if (role === 'volunteer') {
        // Register with resource agent
        const resp = await fetch(`${API_BASE}/resource/volunteer/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            location: formData.location || 'Unknown',
            address: formData.address,
            skills: formData.skills,
            experience: formData.experience || '',
            availability: formData.availability,
            emergency_contact: formData.emergency_contact || '',
            available: true
          })
        });
        const data = await resp.json();
        if (resp.ok) {
          localStorage.setItem('volunteerId', data.volunteer_id || data.volunteer?.id || '');
          navigate('/volunteer');
        } else throw new Error(data.detail || 'Registration failed');

      } else {
        // Citizen or Authority -> register as user
        const pos = await tryGeolocation();
        const payload = {
          name: formData.name,
          phone: formData.phone,
          role: role,
          latitude: pos.lat || 0.0,
          longitude: pos.lon || 0.0
        };

        // include minimal metadata for authority
        if (role === 'authority') {
          payload['org'] = formData.org;
          payload['title'] = formData.title;
        }

        const res = await fetch(`${API_BASE}/users/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const d = await res.json();
        if (res.ok) {
          // store user id for demo
          localStorage.setItem('user', JSON.stringify(d));
          if (role === 'citizen') navigate('/');
          else navigate('/authority');
        } else throw new Error(d.detail || 'User registration failed');
      }

    } catch (err) {
      console.error('Signup error', err);
      setErrors(prev => ({ ...prev, submit: err.message || 'Registration failed' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8">
          <h1 className="text-3xl font-bold mb-4">Create an account</h1>

          <label className="block text-sm text-gray-700 mb-2">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mb-6 p-2 border rounded">
            <option value="citizen">Citizen</option>
            <option value="volunteer">Volunteer</option>
            <option value="authority">Authority</option>
          </select>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border rounded" />
              {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone *</label>
                <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2 border rounded" />
                {errors.phone && <div className="text-red-500 text-sm">{errors.phone}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 border rounded" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location / Area</label>
              <input name="location" value={formData.location} onChange={handleInputChange} className="w-full p-2 border rounded" />
            </div>

            {role === 'volunteer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {skillOptions.map(s => (
                    <button type="button" key={s} onClick={() => handleSkillToggle(s)} className={`px-3 py-2 rounded ${formData.skills.includes(s) ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                      {s.replace('_',' ')}
                    </button>
                  ))}
                </div>
                {errors.skills && <div className="text-red-500 text-sm">{errors.skills}</div>}
              </div>
            )}

            {role === 'authority' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization</label>
                  <input name="org" value={formData.org} onChange={handleInputChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title / Role</label>
                  <input name="title" value={formData.title} onChange={handleInputChange} className="w-full p-2 border rounded" />
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} />
              <div className="text-sm text-gray-700">I agree to be contacted for emergency response and accept terms.</div>
            </div>
            {errors.termsAccepted && <div className="text-red-500 text-sm">{errors.termsAccepted}</div>}

            {errors.submit && <div className="bg-red-50 border border-red-200 p-3 text-red-700 rounded">{errors.submit}</div>}

            <div className="flex justify-between items-center">
              <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-blue-600 text-white rounded">
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
              <div className="text-sm text-gray-500">Already registered? <a href="/login" className="text-blue-600">Login</a></div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
