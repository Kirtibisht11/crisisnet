import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../state/userStore'
import { MapPin, RefreshCw } from 'lucide-react'

const CRISIS_LABELS = {
  'flood': 'Flood Emergency',
  'fire': 'Fire Emergency',
  'medical': 'Medical Emergency',
  'earthquake': 'Earthquake',
  'landslide': 'Landslide',
  'collapse': 'Building Collapse'
};

const SKILL_MAP = {
  'flood': ['rescue', 'swimming', 'first_aid', 'logistics'],
  'fire': ['firefighting', 'first_aid', 'rescue', 'medical'],
  'medical': ['medical', 'first_aid'],
  'earthquake': ['rescue', 'first_aid', 'medical', 'search_and_rescue'],
  'landslide': ['rescue', 'first_aid', 'search_and_rescue'],
  'collapse': ['rescue', 'medical', 'first_aid', 'search_and_rescue']
};

const LocationDisplay = ({ alert }) => {
  const [loc, setLoc] = useState(() => {
    const l = alert.location;
    const unknown = !l || ['unknown', 'unknown location'].includes(l.toLowerCase()) || l.trim() === '';
    const coords = l && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(l.trim());

    if (!unknown && !coords) return l;
    if (alert.lat != null && alert.lon != null) return null;
    return 'Location not available';
  });

  useEffect(() => {
    const l = alert.location;
    const unknown = !l || ['unknown', 'unknown location'].includes(l.toLowerCase()) || l.trim() === '';
    const coords = l && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(l.trim());
    
    if (!unknown && !coords) {
      setLoc(l);
    } else if (alert.lat != null && alert.lon != null) {
      let active = true;
      
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${alert.lat}&lon=${alert.lon}`)
        .then(r => r.json())
        .then(d => {
          if (!active) return;
          if (d.address) {
            const { road, suburb, city, town, village, county, state_district } = d.address;
            const parts = [road, suburb || village || town, city || county || state_district].filter(Boolean);
            if (parts.length > 0) setLoc(parts.join(', '));
            else if (d.display_name) setLoc(d.display_name.split(',').slice(0, 2).join(','));
            else setLoc(`${Number(alert.lat).toFixed(4)}, ${Number(alert.lon).toFixed(4)}`);
          } else if (d.display_name) {
            setLoc(d.display_name.split(',').slice(0, 2).join(','));
          } else {
            setLoc(`${Number(alert.lat).toFixed(4)}, ${Number(alert.lon).toFixed(4)}`);
          }
        })
        .catch(e => {
          if (!active) return;
          setLoc(`${Number(alert.lat).toFixed(4)}, ${Number(alert.lon).toFixed(4)}`);
        });
      
      return () => { active = false; };
    }
  }, [alert.location, alert.lat, alert.lon]);

  if (loc === null) {
    if (alert.lat != null && alert.lon != null) {
      return (
        <span>
          {Number(alert.lat).toFixed(4)}, {Number(alert.lon).toFixed(4)}
          <span className="text-slate-400 italic text-xs ml-2">(Resolving...)</span>
        </span>
      );
    }
    return <span className="text-slate-400 italic text-xs">Resolving...</span>;
  }

  return <span>{loc}</span>;
};

export default function ResourceDashboard() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const [resources, setResources] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [requests, setRequests] = useState([])
  const [crises, setCrises] = useState([])
  const [selectedCrisis, setSelectedCrisis] = useState(null)
  const [selectedForResource, setSelectedForResource] = useState(null)
  const [viewAssignments, setViewAssignments] = useState(null)
  const [viewResourceDetail, setViewResourceDetail] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('alerts')
  const [volCount, setVolCount] = useState(5)
  const [resAmounts, setResAmounts] = useState({})

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    
    try {
      const [resData, volData, reqData] = await Promise.all([
        api.get('/api/resource/resources').catch(() => ({ data: { items: [] }})),
        api.get('/api/resource/volunteers').catch(() => ({ data: { items: [] }})),
        api.get('/api/resource/volunteer_requests').catch(() => ({ data: { items: [] }}))
      ]);

      setResources(resData.data.items || [])
      setVolunteers(volData.data.items || [])
      setRequests(reqData.data.items || [])

      const alertsRes = await api.get('/api/alerts');
      if (alertsRes.data && alertsRes.data.alerts) {
        const verified = alertsRes.data.alerts.filter(a => 
          a.decision && a.decision.toUpperCase() === 'VERIFIED'
        );
        
        const unique = new Map();
        verified.forEach(a => unique.set(a.alert_id || a.id, a));
        setCrises(Array.from(unique.values()));
      }

      const stored = JSON.parse(localStorage.getItem('resource_assignments') || '[]');
      setAssignments(stored);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false)
    }
  }

  async function toggleResourceAvail(id, current) {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      await api.put(`/api/resource/resources/${id}/availability`, 
        { available: !current }, 
        { headers: { 'token': token }}
      )
      loadAll()
    } catch (e) {
      console.error(e);
      alert('Update failed')
    }
  }

  async function toggleVolAvail(id, current) {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      await api.put(`/api/resource/volunteers/${id}/availability`, 
        { available: !current }, 
        { headers: { 'token': token }}
      )
      loadAll()
    } catch (e) {
      console.error(e);
      alert('Update failed')
    }
  }

  const postVolRequest = async (crisis) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      if (!token) {
        alert('Authentication required. Please log in.');
        return;
      }

      let loc = 'Unknown Location';
      let lat = null;
      let lon = null;
      
      if (typeof crisis.location === 'string' && crisis.location.trim()) loc = crisis.location;
      if (crisis.lat || crisis.latitude) lat = crisis.lat || crisis.latitude;
      if (crisis.lon || crisis.longitude) lon = crisis.lon || crisis.longitude;
      if (loc === 'Unknown Location' && lat && lon) loc = `${lat}, ${lon}`;

      const skills = SKILL_MAP[crisis.crisis_type] || ['first_aid', 'rescue'];

      await api.post('/api/resource/volunteer_requests', {
        crisis_id: crisis.alert_id || crisis.id,
        crisis_type: crisis.crisis_type,
        location: loc,
        lat: lat,
        lon: lon,
        message: crisis.message || 'Emergency assistance required',
        skills: skills,
        count: Number(volCount) || 1
      }, {
        headers: { 'token': token }
      });
      
      alert('Request posted!');
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 403) {
        alert('Permission denied. Session may be expired.');
      } else {
        alert('Failed to post request');
      }
    }
    setSelectedCrisis(null);
    loadAll();
  };

  const assignResource = (crisis, resource) => {
    const amt = Number(resAmounts[resource.id]) || 0;
    const stats = getResStats(resource);

    if (amt <= 0) {
      alert("Enter valid amount");
      return;
    }
    if (amt > stats.remaining) {
      alert(`Only ${stats.remaining} available`);
      return;
    }

    const newAssign = {
      assignment_id: `RES_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      crisis_id: crisis.alert_id || crisis.id,
      resource_id: resource.id,
      resource_type: resource.type,
      resource_capacity: amt,
      crisis_type: crisis.crisis_type,
      location: crisis.location,
      message: crisis.message,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
      type: 'resource'
    };

    const all = [...assignments, newAssign];
    localStorage.setItem('resource_assignments', JSON.stringify(all));
    setAssignments(all);

    const volTasks = JSON.parse(localStorage.getItem('volunteer_tasks') || '[]');
    volTasks.push({
      ...newAssign,
      volunteer_name: `Resource: ${resource.type}`,
      volunteer_phone: `Capacity: ${resource.capacity}`
    });
    localStorage.setItem('volunteer_tasks', JSON.stringify(volTasks));

    if (stats.remaining - amt <= 0 && resource.available) {
      toggleResourceAvail(resource.id, true);
    }

    alert(`Assigned ${amt} of ${resource.type}`);
    setResAmounts(prev => ({ ...prev, [resource.id]: '' }));
    loadAll();
  };

  const getAssignCount = (cid) => {
    return assignments.filter(a => a.crisis_id === cid).length;
  };

  const getReqForCrisis = (cid) => {
    return requests.find(r => r.crisis_id === cid && r.status !== 'CANCELLED');
  };

  const getResStats = (res) => {
    const resAssigns = assignments.filter(a => a.resource_id === res.id);
    const used = resAssigns.reduce((sum, a) => sum + (Number(a.resource_capacity) || 0), 0);
    const total = Number(res.capacity) || 0;
    return { used, total, remaining: Math.max(0, total - used) };
  };

  const getPriority = (trust, type) => {
    const urgent = ['fire', 'medical', 'violence', 'earthquake'];
    const isUrg = urgent.includes(type?.toLowerCase());
    
    if (trust >= 0.65 && isUrg) return { level: 'CRITICAL', color: 'bg-red-100 text-red-800' };
    if (trust >= 0.65) return { level: 'HIGH', color: 'bg-orange-100 text-orange-800' };
    if (trust >= 0.45) return { level: 'MEDIUM', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'LOW', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <Link to="/" className="font-bold text-xl tracking-tight">CrisisNet</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-300">{user?.name || user?.username || "User"}</span>
            <Link to="/authority" className="text-sm font-medium text-slate-300 hover:text-white transition">Authority</Link>
            <button
              onClick={handleLogout}
              className="text-sm border border-slate-600 px-3 py-1.5 rounded hover:bg-slate-800 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="w-[96%] mx-auto py-8">
        <main>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Resource Manager</h2>
                <p className="text-slate-600 text-sm mt-1">Coordinate volunteers and assets</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={loadAll}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <div className="text-right">
                  <div className="text-sm text-slate-600">Status</div>
                  <div className="text-lg font-bold flex items-center gap-2 justify-end">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    ONLINE
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-200">
              <button
                onClick={() => setTab('alerts')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${tab === 'alerts' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Crisis Alerts
              </button>
              <button
                onClick={() => setTab('resources')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${tab === 'resources' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Resources
              </button>
            </div>

            {tab === 'alerts' && (
              <section className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Crisis Assignment</h3>
                {crises.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-600">
                    No crises requiring assignment
                  </div>
                ) : (
                  <div className="space-y-4">
                    {crises.map((c) => {
                      const label = CRISIS_LABELS[c.crisis_type] || c.crisis_type;
                      const assignCnt = getAssignCount(c.alert_id || c.id);
                      const req = getReqForCrisis(c.alert_id || c.id);
                      const pri = getPriority(c.trust_score, c.crisis_type);
                      
                      return (
                        <div
                          key={c.alert_id || c.id}
                          className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition bg-white hover:border-blue-300"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-slate-900">{label}</h3>
                              </div>
                              <div className="flex items-center gap-1 text-slate-600 mt-2">
                                <MapPin size={16} />
                                <LocationDisplay alert={c} />
                              </div>
                              {c.message && (
                                <p className="text-sm text-slate-600 mt-1">{c.message}</p>
                              )}
                              <div className="mt-3 flex gap-2 flex-wrap">
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  Trust: {(c.trust_score * 100).toFixed(0)}%
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${pri.color}`}>
                                  {pri.level}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {(req || assignCnt > 0) && (
                                <button
                                  onClick={() => setViewAssignments(c)}
                                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition text-sm shadow-sm"
                                >
                                  View Assigned
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedCrisis(c)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm shadow-sm"
                              >
                                {req ? 'Add Volunteers' : 'Assign Volunteers'}
                              </button>
                              <button
                                onClick={() => setSelectedForResource(c)}
                                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition shadow-sm"
                              >
                                Assign Resources
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {tab === 'resources' && (
              <section className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Available Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map(r => {
                    const stats = getResStats(r);
                    return (
                      <div key={r.id} className="p-6 border border-slate-200 rounded-xl hover:shadow-md transition bg-white hover:border-blue-300">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-slate-900">{r.id}</div>
                            <div className="text-sm text-slate-600 mt-1">Type: <span className="font-medium">{r.type}</span></div>
                            <div className="text-sm text-slate-600">Total: <span className="font-medium">{r.capacity}</span></div>
                            <div className="text-sm text-slate-600">Used: <span className="font-medium text-orange-600">{stats.used}</span> / Avail: <span className="font-medium text-green-600">{stats.remaining}</span></div>
                            <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                              <MapPin size={14} />
                              <LocationDisplay alert={{ lat: r.location?.lat, lon: r.location?.lon, location: '' }} />
                            </div>
                          </div>
                          <div className="text-right flex flex-col gap-2 items-end">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${r.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {r.available ? 'Available' : 'Allocated'}
                            </span>
                            <button
                              onClick={() => setViewResourceDetail(r)}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded border border-slate-300 transition"
                            >
                              View Usage
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {selectedCrisis && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Assign Volunteers</h2>
              <button
                onClick={() => setSelectedCrisis(null)}
                className="text-slate-500 hover:text-slate-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-xl font-bold text-slate-900">{CRISIS_LABELS[selectedCrisis.crisis_type] || selectedCrisis.crisis_type}</h3>
              <div className="flex items-center gap-1 text-slate-600">
                <MapPin size={16} />
                <LocationDisplay alert={selectedCrisis} />
              </div>
              {selectedCrisis.message && (
                <p className="text-sm text-slate-700 mt-2">{selectedCrisis.message}</p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-3">Required Skills:</h3>
              <div className="flex gap-2 flex-wrap">
                {(SKILL_MAP[selectedCrisis.crisis_type] || ['first_aid', 'rescue']).map(s => (
                  <span key={s} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {s.replace('_', ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Volunteers Needed
              </label>
              <input 
                type="number" 
                min="1" 
                max="50"
                value={volCount}
                onChange={(e) => setVolCount(parseInt(e.target.value) || '')}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => postVolRequest(selectedCrisis)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
            >
              Post Request
            </button>
          </div>
        </div>
      )}

      {selectedForResource && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Assign Resources</h2>
              <button
                onClick={() => setSelectedForResource(null)}
                className="text-slate-500 hover:text-slate-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="text-xl font-bold text-slate-900">{CRISIS_LABELS[selectedForResource.crisis_type] || selectedForResource.crisis_type}</h3>
              <div className="flex items-center gap-1 text-slate-600">
                <MapPin size={16} />
                <LocationDisplay alert={selectedForResource} />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-3">Available Resources</h3>
              {resources.filter(r => getResStats(r).remaining > 0).length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  No resources available
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
                  {resources.filter(r => getResStats(r).remaining > 0).map(res => {
                    const stats = getResStats(res);
                    return (
                      <div key={res.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-slate-900">{res.id}</div>
                            <div className="text-sm text-slate-600">Type: {res.type}</div>
                            <div className="text-sm text-slate-600">Available: <span className="font-bold text-green-600">{stats.remaining}</span> / {stats.total}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="number" 
                            placeholder="Amount"
                            className="w-24 px-2 py-1 text-sm border border-slate-300 rounded"
                            min="1"
                            max={stats.remaining}
                            value={resAmounts[res.id] || ''}
                            onChange={(e) => setResAmounts(prev => ({ ...prev, [res.id]: e.target.value }))}
                          />
                          <button
                            onClick={() => assignResource(selectedForResource, res)}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewAssignments && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Assigned Resources</h2>
                <p className="text-slate-600 text-sm mt-1">{CRISIS_LABELS[viewAssignments.crisis_type] || viewAssignments.crisis_type}</p>
              </div>
              <button
                onClick={() => setViewAssignments(null)}
                className="text-slate-500 hover:text-slate-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                {(() => {
                  const req = getReqForCrisis(viewAssignments.alert_id || viewAssignments.id);
                  const cnt = req?.accepted_volunteers?.length || 0;
                  return (
                    <>
                      <h3 className="text-lg font-bold text-slate-900 mb-3">Volunteers ({cnt}{req ? ` / ${req.volunteers_needed}` : ''})</h3>
                      {cnt === 0 ? (
                        <p className="text-slate-500 italic">No volunteers assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {volunteers
                            .filter(v => req.accepted_volunteers.includes(v.id))
                            .map(v => (
                              <div key={v.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center bg-slate-50">
                                <div>
                                  <div className="font-bold text-slate-900">{v.name}</div>
                                  <div className="text-sm text-slate-600">📱 {v.phone}</div>
                                </div>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Accepted</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Equipment & Resources</h3>
                {(() => {
                  const cid = viewAssignments.alert_id || viewAssignments.id;
                  const crisisAssigns = assignments.filter(a => a.crisis_id === cid);
                  
                  if (crisisAssigns.length === 0) {
                    return <p className="text-slate-500 italic">No resources assigned</p>;
                  }

                  return (
                    <div className="space-y-2">
                      {crisisAssigns.map(a => (
                        <div key={a.assignment_id} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-900">{a.resource_type}</div>
                              <div className="text-sm text-slate-600">Quantity: {a.resource_capacity}</div>
                              <div className="text-xs text-slate-500 mt-1">
                                Assigned: {new Date(a.assigned_at).toLocaleString()}
                              </div>
                            </div>
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                              {a.status || 'Assigned'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewResourceDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Resource Usage Details</h2>
                <p className="text-slate-600 text-sm mt-1">{viewResourceDetail.id} - {viewResourceDetail.type}</p>
              </div>
              <button
                onClick={() => setViewResourceDetail(null)}
                className="text-slate-500 hover:text-slate-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-slate-600">Total Capacity</div>
                  <div className="text-2xl font-bold text-slate-900">{viewResourceDetail.capacity}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Used</div>
                  <div className="text-2xl font-bold text-orange-600">{getResStats(viewResourceDetail).used}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Available</div>
                  <div className="text-2xl font-bold text-green-600">{getResStats(viewResourceDetail).remaining}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Assignment History</h3>
              {(() => {
                const resAssigns = assignments.filter(a => a.resource_id === viewResourceDetail.id);
                
                if (resAssigns.length === 0) {
                  return <p className="text-slate-500 italic text-center py-4">No assignments yet</p>;
                }

                return (
                  <div className="space-y-2">
                    {resAssigns.map(a => {
                      const crisis = crises.find(c => (c.alert_id || c.id) === a.crisis_id);
                      return (
                        <div key={a.assignment_id} className="p-4 border border-slate-200 rounded-lg bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-slate-900">
                              {crisis ? (CRISIS_LABELS[crisis.crisis_type] || crisis.crisis_type) : 'Crisis'}
                            </div>
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                              {a.resource_capacity} units
                            </span>
                          </div>
                          {a.location && (
                            <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
                              <MapPin size={14} />
                              <span>{a.location}</span>
                            </div>
                          )}
                          {a.message && (
                            <p className="text-sm text-slate-600 mb-2">{a.message}</p>
                          )}
                          <div className="text-xs text-slate-500">
                            Assigned: {new Date(a.assigned_at).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}