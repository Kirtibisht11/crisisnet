import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState('citizen');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    skills: [],
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
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill) 
        : [...prev.skills, skill]
    }));
  };

  const skillOptions = ['first_aid', 'medical', 'rescue', 'swimming', 'firefighting', 'logistics', 'communication', 'driver'];

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (role === 'volunteer' && formData.skills.length === 0) newErrors.skills = 'Select at least one skill';
    if (!formData.termsAccepted) newErrors.termsAccepted = 'Accept terms to continue';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveUserData = (userData) => {
    // Save to localStorage for Round 1 demo
    const allUsers = JSON.parse(localStorage.getItem('crisisnet_users') || '[]');
    allUsers.push(userData);
    localStorage.setItem('crisisnet_users', JSON.stringify(allUsers));
    localStorage.setItem('crisisnet_current_user', JSON.stringify(userData));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const userId = `${role}_${Date.now()}`;
      const userData = {
        id: userId,
        role: role,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location || 'Unknown',
        created_at: new Date().toISOString(),
        ...(role === 'volunteer' && { skills: formData.skills, available: true }),
        ...(role === 'authority' && { organization: formData.org, title: formData.title })
      };

      saveUserData(userData);
      
      // Always navigate to authority dashboard for demo
      setTimeout(() => navigate('/authority'), 300);

    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.message || 'Registration failed' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-600 mb-6">Join CrisisNet</p>

          <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 border-2 rounded-lg mb-6">
            <option value="citizen">Citizen</option>
            <option value="volunteer">Volunteer</option>
            <option value="authority">Authority</option>
          </select>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 border-2 rounded-lg" />
              {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-3 border-2 rounded-lg" />
                {errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 border-2 rounded-lg" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input name="location" value={formData.location} onChange={handleInputChange} className="w-full p-3 border-2 rounded-lg" />
            </div>

            {role === 'volunteer' && (
              <div>
                <label className="block text-sm font-medium mb-2">Skills *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {skillOptions.map(s => (
                    <button type="button" key={s} onClick={() => handleSkillToggle(s)} className={`px-3 py-2 rounded-lg ${formData.skills.includes(s) ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                      {s.replace('_',' ')}
                    </button>
                  ))}
                </div>
                {errors.skills && <div className="text-red-500 text-sm mt-2">{errors.skills}</div>}
              </div>
            )}

            {role === 'authority' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Organization</label>
                  <input name="org" value={formData.org} onChange={handleInputChange} className="w-full p-3 border-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input name="title" value={formData.title} onChange={handleInputChange} className="w-full p-3 border-2 rounded-lg" />
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} />
              <div className="text-sm">I agree to the terms and conditions</div>
            </div>
            {errors.termsAccepted && <div className="text-red-500 text-sm">{errors.termsAccepted}</div>}

            {errors.submit && <div className="bg-red-50 border-2 border-red-200 p-4 text-red-700 rounded-lg">{errors.submit}</div>}

            <div className="flex justify-between items-center pt-4">
              <button type="submit" disabled={isSubmitting} className={`px-8 py-3 rounded-lg font-bold text-white ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
              <a href="/login" className="text-blue-600 font-semibold hover:underline">Already registered? Login</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}