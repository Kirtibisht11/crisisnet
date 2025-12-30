import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { UserPlus, MapPin, Award, CheckCircle } from 'lucide-react';

/* ================= LOCATION HELPERS ================= */

const getBrowserLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve({ lat: null, lon: null, source: 'unsupported' });
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: 'gps'
        }),
      () =>
        resolve({
          lat: null,
          lon: null,
          source: 'denied'
        }),
      { timeout: 8000 }
    );
  });

/* ================= CRISIS LABEL HELPER ================= */

const formatCrisisType = (type) => {
  const types = {
    flood: { label: 'Flood Emergency', emoji: '🌊' },
    fire: { label: 'Fire Emergency', emoji: '🔥' },
    medical: { label: 'Medical Emergency', emoji: '🏥' },
    earthquake: { label: 'Earthquake', emoji: '🏚️' },
    landslide: { label: 'Landslide', emoji: '⛰️' },
    collapse: { label: 'Building Collapse', emoji: '🏢' }
  };
  return types[type] || { label: type, emoji: '⚠️' };
};

/* ================= MAIN COMPONENT ================= */

const VolunteerPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();

  const [activeTab, setActiveTab] = useState('signup');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [volunteerId, setVolunteerId] = useState(null);
  const [tasks, setTasks] = useState([]);

  /* -------- LOCATION STATE -------- */
  const [askLocation, setAskLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skills: [],
    location: null,
    available: true
  });

  const skillOptions = [
    'first_aid',
    'medical',
    'rescue',
    'swimming',
    'firefighting',
    'search_and_rescue',
    'logistics',
    'communication',
    'driver'
  ];

  /* ================= LOCATION FLOW ================= */

  useEffect(() => {
    if (!formData.location) {
      setAskLocation(true);
    }
  }, []);

  const handleAllowLocation = async () => {
    const loc = await getBrowserLocation();

    const finalLocation = {
      lat: loc.lat,
      lon: loc.lon,
      manualLocation: null,
      source: loc.source
    };

    setFormData((prev) => ({ ...prev, location: finalLocation }));
    setAskLocation(false);
  };

  const handleManualLocationSave = () => {
    if (!manualLocation.trim()) return;

    const finalLocation = {
      lat: null,
      lon: null,
      manualLocation,
      source: 'manual'
    };

    setFormData((prev) => ({ ...prev, location: finalLocation }));
    setAskLocation(false);
  };

  /* ================= TASK LOAD ================= */

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadTasks();
    }
  }, [activeTab]);

  const loadTasks = () => {
    const allTasks = JSON.parse(localStorage.getItem('volunteer_tasks') || '[]');
    const volunteerTasks = volunteerId
      ? allTasks.filter((t) => t.volunteer_id === volunteerId)
      : allTasks;
    setTasks(volunteerTasks);
  };

  /* ================= FORM HANDLERS ================= */

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillToggle = (skill) => {
    setFormData((prev) => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || formData.skills.length === 0 || !formData.location) {
      setSubmitStatus({ type: 'error', message: 'Please complete all required fields' });
      return;
    }

    const newVolunteerId = `VOL_${Date.now()}`;

    const newVolunteer = {
      id: newVolunteerId,
      volunteer_id: newVolunteerId,
      name: formData.name,
      phone: formData.phone || 'Not provided',
      skills: formData.skills,
      location: formData.location,
      available: formData.available,
      role: 'volunteer',
      registered_at: new Date().toISOString()
    };

    const users = JSON.parse(localStorage.getItem('crisisnet_users') || '[]');
    users.push(newVolunteer);
    localStorage.setItem('crisisnet_users', JSON.stringify(users));

    const volunteers = JSON.parse(localStorage.getItem('volunteers_list') || '[]');
    volunteers.push(newVolunteer);
    localStorage.setItem('volunteers_list', JSON.stringify(volunteers));

    setVolunteerId(newVolunteerId);
    setSubmitStatus({
      type: 'success',
      message: `Registered successfully! Volunteer ID: ${newVolunteerId}`
    });

    setTimeout(() => setActiveTab('dashboard'), 1500);
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* LOCATION MODAL */}
      {askLocation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold mb-2">Share your location</h2>
            <p className="text-sm text-slate-600 mb-4">
              We use your location to assign nearby crisis tasks.
            </p>

            <button
              onClick={handleAllowLocation}
              className="w-full mb-3 bg-blue-600 text-white py-2 rounded-lg"
            >
              Allow GPS Location
            </button>

            <div className="text-center text-sm text-slate-500 mb-2">or</div>

            <input
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder="Enter area manually"
              className="w-full border px-3 py-2 rounded mb-3"
            />

            <button
              onClick={handleManualLocationSave}
              className="w-full border py-2 rounded"
            >
              Save Manual Location
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between">
        <Link to="/" className="font-bold text-slate-900">CrisisNet</Link>
        <button
          onClick={() => {
            localStorage.clear();
            navigate('/');
          }}
          className="text-sm border px-3 py-1 rounded"
        >
          Sign Out
        </button>
      </header>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('signup')} className="btn">Sign Up</button>
          <button onClick={() => setActiveTab('dashboard')} className="btn">My Tasks</button>
        </div>

        {activeTab === 'signup' ? (
          <form className="bg-white p-6 rounded-lg border space-y-4">
            <input name="name" placeholder="Full Name" onChange={handleInputChange} className="input" />
            <input name="phone" placeholder="Phone" onChange={handleInputChange} className="input" />

            <div className="flex flex-wrap gap-2">
              {skillOptions.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => handleSkillToggle(s)}
                  className={`px-3 py-1 border rounded ${
                    formData.skills.includes(s) ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button onClick={handleSubmit} className="w-full bg-orange-600 text-white py-2 rounded">
              Register
            </button>

            {submitStatus && <p>{submitStatus.message}</p>}
          </form>
        ) : (
          <div>
            {tasks.length === 0 ? (
              <p>No tasks assigned yet.</p>
            ) : (
              tasks.map((task) => {
                const crisis = formatCrisisType(task.crisis_type);
                return (
                  <div key={task.assignment_id} className="border p-4 mb-3 rounded">
                    <div className="text-lg">{crisis.emoji} {crisis.label}</div>
                    <p>{task.message}</p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerPage;
