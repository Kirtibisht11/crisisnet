import React, { useEffect, useState } from 'react'
import api, { runPipeline } from '../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../state/userStore'
import { MapPin } from 'lucide-react'
import { formatPriority } from '../utils/formatter'

const formatCrisisType = (type) => {
  const types = {
    'flood': { label: 'Flood Emergency' },
    'fire': { label: 'Fire Emergency' },
    'medical': { label: 'Medical Emergency' },
    'earthquake': { label: 'Earthquake' },
    'landslide': { label: 'Landslide' },
    'collapse': { label: 'Building Collapse' }
  };
  return types[type] || { label: type };
};

const getRequiredSkills = (crisisType) => {
  const skillMap = {
    'flood': ['rescue', 'swimming', 'first_aid', 'logistics'],
    'fire': ['firefighting', 'first_aid', 'rescue', 'medical'],
    'medical': ['medical', 'first_aid'],
    'earthquake': ['rescue', 'first_aid', 'medical', 'search_and_rescue'],
    'landslide': ['rescue', 'first_aid', 'search_and_rescue'],
    'collapse': ['rescue', 'medical', 'first_aid', 'search_and_rescue']
  };
  return skillMap[crisisType] || ['first_aid', 'rescue'];
};

const LocationRenderer = ({ alert }) => {
  const [displayLocation, setDisplayLocation] = useState(() => {
    const loc = alert.location;
    const isUnknown = !loc || ['unknown', 'unknown location'].includes(loc.toLowerCase()) || loc.trim() === '';
    const isCoordinates = loc && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(loc.trim());

    if (!isUnknown && !isCoordinates) {
      return loc;
    }
    if (alert.lat != null && alert.lon != null) {
      return null;
    }
    return 'Location not available';
  });

  useEffect(() => {
    const loc = alert.location;
    const isUnknown = !loc || ['unknown', 'unknown location'].includes(loc.toLowerCase()) || loc.trim() === '';
    const isCoordinates = loc && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(loc.trim());
    
    if (!isUnknown && !isCoordinates) {
      setDisplayLocation(loc);
    } else if (alert.lat != null && alert.lon != null) {
      let active = true;
      // Reverse geocode if we only have coordinates
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${alert.lat}&lon=${alert.lon}`)
        .then(res => res.json())
        .then(data => {
          if (!active) return;
          if (data.address) {
            const { road, suburb, city, town, village, county, state_district } = data.address;
            const parts = [road, suburb || village || town, city || county || state_district].filter(Boolean);
            if (parts.length > 0) setDisplayLocation(parts.join(', '));
            else if (data.display_name) setDisplayLocation(data.display_name.split(',').slice(0, 2).join(','));
            else setDisplayLocation(`${Number(alert.lat).toFixed(4)}, ${Number(alert.lon).toFixed(4)}`);
          } else if (data.display_name) {
            setDisplayLocation(data.display_name.split(',').slice(0, 2).join(','));
          } else {
            setDisplayLocation(`${Number(alert.lat).toFixed(4)}, ${Number(alert.lon).toFixed(4)}`);
          }
        })
        .catch(err => {
          if (!active) return;
          console.debug('Geocoding failed', err);
          setDisplayLocation(`${Number(alert.lat).toFixed(4)}, ${Number(alert.lon).toFixed(4)}`);
        });
      return () => { active = false; };
    }
  }, [alert.location, alert.lat, alert.lon]);

  if (displayLocation === null) {
    if (alert.lat != null && alert.lon != null) {
      return (
        <span>
          {Number(alert.lat).toFixed(4)}, {Number(alert.lon).toFixed(4)}
          <span className="text-slate-400 italic text-xs ml-2">(Resolving...)</span>
        </span>
      );
    }
    return <span className="text-slate-400 italic text-xs">Resolving location...</span>;
  }

  return <span>{displayLocation}</span>;
};

export default function Resources() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const [resources, setResources] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [vrequests, setVrequests] = useState([])
  const [crises, setCrises] = useState([])
  const [selectedCrisis, setSelectedCrisis] = useState(null)
  const [selectedResource, setSelectedResource] = useState(null)
  const [viewingRequest, setViewingRequest] = useState(null)
  const [viewingAssignments, setViewingAssignments] = useState(null)
  const [viewingResourceUsage, setViewingResourceUsage] = useState(null)
  const [assignmentInputs, setAssignmentInputs] = useState({})
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('alerts')
  const [requestCount, setRequestCount] = useState(5)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    navigate('/')
  }

  useEffect(() => { fetchAll() }, [])

  async function fetchAll(){
    setLoading(true)
    try{
      const r = await api.get('/api/resource/resources')
      setResources(r.data.items || [])
    }catch(e){ console.error(e) }
    try{
      const v = await api.get('/api/resource/volunteers')
      setVolunteers(v.data.items || [])
    }catch(e){ console.error(e) }
    try{
      const vr = await api.get('/api/resource/volunteer_requests')
      setVrequests(vr.data.items || [])
    }catch(e){ console.error(e) }
    
    // Load verified crises from API
    try {
      const alertsRes = await api.get('/api/alerts');
      console.log('All alerts:', alertsRes.data);
      if (alertsRes.data && alertsRes.data.alerts) {
        const verified = alertsRes.data.alerts.filter(a => a.decision && a.decision.toUpperCase() === 'VERIFIED');
        
        // Deduplicate alerts
        const uniqueMap = new Map();
        verified.forEach(a => uniqueMap.set(a.alert_id || a.id, a));
        setCrises(Array.from(uniqueMap.values()));
      }

      const assigns = JSON.parse(localStorage.getItem('resource_assignments') || '[]');
      setAssignments(assigns);
    } catch (err) {
      console.error('Error loading crises:', err);
    }
    setLoading(false)
  }

  async function toggleResource(id, current){
    try{
      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      await api.put(`/api/resource/resources/${id}/availability`, { available: !current }, { headers: { 'token': token } })
      fetchAll()
    }catch(e){ console.error(e); alert('Failed to update') }
  }

  async function toggleVolunteer(id, current){
    try{
      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      await api.put(`/api/resource/volunteers/${id}/availability`, { available: !current }, { headers: { 'token': token } })
      fetchAll()
    }catch(e){ console.error(e); alert('Failed to update') }
  }

  const handlePostRequest = async (crisis) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        return;
      }

      // Resolve location
      let loc = 'Unknown Location';
      let lat = null;
      let lon = null;
      
      if (typeof crisis.location === 'string' && crisis.location.trim()) loc = crisis.location;
      if (crisis.lat || crisis.latitude) lat = crisis.lat || crisis.latitude;
      if (crisis.lon || crisis.longitude) lon = crisis.lon || crisis.longitude;
      if (loc === 'Unknown Location' && lat && lon) loc = `${lat}, ${lon}`;

      await api.post('/api/resource/volunteer_requests', {
        crisis_id: crisis.alert_id || crisis.id,
        crisis_type: crisis.crisis_type,
        location: loc,
        lat: lat,
        lon: lon,
        message: crisis.message || 'Emergency assistance required',
        skills: getRequiredSkills(crisis.crisis_type),
        count: Number(requestCount) || 1
      }, {
        headers: { 'token': token }
      });
      alert('Volunteer request posted successfully!');
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 403) {
        alert('Permission denied. Your session may have expired or the user does not exist. Please log in again.');
      } else {
        alert('Failed to post request');
      }
    }
    setSelectedCrisis(null);
    fetchAll();
  };

  const handleAssignResource = (crisis, resource) => {
    const amountToAssign = Number(assignmentInputs[resource.id]) || 0;
    const stats = getResourceStats(resource);

    if (amountToAssign <= 0) {
      alert("Please enter a valid capacity amount to assign.");
      return;
    }
    if (amountToAssign > stats.remaining) {
      alert(`Cannot assign ${amountToAssign}. Only ${stats.remaining} available.`);
      return;
    }

    const newAssignment = {
      assignment_id: `RES_ASSIGN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      crisis_id: crisis.alert_id || crisis.id,
      resource_id: resource.id,
      resource_type: resource.type,
      resource_capacity: amountToAssign,
      crisis_type: crisis.crisis_type,
      location: crisis.location,
      message: crisis.message,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
      type: 'resource'
    };

    const allAssignments = [...assignments, newAssignment];
    localStorage.setItem('resource_assignments', JSON.stringify(allAssignments));
    setAssignments(allAssignments);

    // Also add to volunteer tasks so it shows up in task board
    const volunteerTasks = JSON.parse(localStorage.getItem('volunteer_tasks') || '[]');
    volunteerTasks.push({
      ...newAssignment,
      volunteer_name: `Resource: ${resource.type}`,
      volunteer_phone: `Capacity: ${resource.capacity}`
    });
    localStorage.setItem('volunteer_tasks', JSON.stringify(volunteerTasks));

    // If fully used, mark unavailable
    if (stats.remaining - amountToAssign <= 0 && resource.available) {
      toggleResource(resource.id, true);
    }

    alert(`Successfully assigned ${amountToAssign} of ${resource.type} to crisis!`);
    setAssignmentInputs(prev => ({ ...prev, [resource.id]: '' }));
    fetchAll();
  };

  const getAssignedCount = (crisisId) => {
    return assignments.filter(a => a.crisis_id === crisisId).length;
  };

  const getRequestForCrisis = (crisisId) => {
    return vrequests.find(r => r.crisis_id === crisisId && r.status !== 'CANCELLED');
  };

  const getResourceStats = (resource) => {
    const resourceAssignments = assignments.filter(a => a.resource_id === resource.id);
    const used = resourceAssignments.reduce((sum, a) => sum + (Number(a.resource_capacity) || 0), 0);
    const total = Number(resource.capacity) || 0;
    return { used, total, remaining: Math.max(0, total - used) };
  };

  const getTotalVolunteers = (crisisId) => {
    return vrequests
      .filter(r => r.crisis_id === crisisId && r.status !== 'CANCELLED')
      .reduce((acc, r) => acc + (r.fulfilled_count || 0), 0);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Header - Professional Dark Theme */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <Link to="/" className="font-bold text-xl tracking-tight">CrisisNet</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-300">{user?.name || user?.username || "User"}</span>
            <Link to="/authority" className="text-sm font-medium text-slate-300 hover:text-white transition">Authority Dashboard</Link>
            <button
              onClick={handleLogout}
              className="text-sm border border-slate-600 px-3 py-1.5 rounded hover:bg-slate-800 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="w-[96%] mx-auto py-8">
        {/* Main Content */}
        <main>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Resource Manager</h2>
                <p className="text-slate-600 text-sm mt-1">Coordinate volunteers and assets</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600">System Status</div>
                <div className="text-2xl font-bold flex items-center gap-2 justify-end">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  OPERATIONAL
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-200">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'alerts' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Crisis Alerts
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'resources' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Resources
              </button>
            </div>

            {/* Crisis Assignment Section */}
            {activeTab === 'alerts' && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Crisis Assignment Management</h3>
              {crises.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-600">
                  No approved crises requiring assignment
                </div>
              ) : (
                <div className="space-y-4">
                  {crises.map((crisis) => {
                    const crisisType = formatCrisisType(crisis.crisis_type);
                    const assignedCount = getAssignedCount(crisis.alert_id || crisis.id);
                    const activeRequest = getRequestForCrisis(crisis.alert_id || crisis.id);
                    const priorityObj = formatPriority(crisis.trust_score, crisis.crisis_type);
                    const priority = priorityObj.level;
                    const totalVolunteers = getTotalVolunteers(crisis.alert_id || crisis.id);
                    return (
                      <div
                        key={crisis.alert_id || crisis.id}
                        className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all bg-white hover:border-blue-300"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-slate-900">{crisisType.label}</h3>
                            </div>
                            <div className="flex items-center gap-1 text-slate-600 mt-2">
                              <MapPin size={16} />
                              <LocationRenderer alert={crisis} />
                            </div>
                            {crisis.message && (
                              <p className="text-sm text-slate-600 mt-1">{crisis.message}</p>
                            )}
                            <div className="mt-3 flex gap-2 flex-wrap">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                Trust: {(crisis.trust_score * 100).toFixed(0)}%
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                priority.toUpperCase() === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                priority.toUpperCase() === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                priority.toUpperCase() === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                Priority: {priority}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {(activeRequest || assignedCount > 0) && (
                              <button
                                onClick={() => setViewingAssignments(crisis)}
                                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition text-sm shadow-sm"
                              >
                                Assigned Resources
                              </button>
                            )}
                            <button
                                onClick={() => setSelectedCrisis(crisis)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm shadow-sm"
                              >
                                {activeRequest ? 'Assign More Volunteers' : 'Assign Volunteers'}
                              </button>
                            <button
                              onClick={() => setSelectedResource(crisis)}
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

            {/* Resources Section */}
            {activeTab === 'resources' && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Available Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map(r => {
                  const stats = getResourceStats(r);
                  return (
                  <div key={r.id} className="p-6 border border-slate-200 rounded-xl hover:shadow-md transition-all bg-white hover:border-blue-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-900">{r.id}</div>
                        <div className="text-sm text-slate-600 mt-1">Type: <span className="font-medium">{r.type}</span></div>
                        <div className="text-sm text-slate-600">Total Capacity: <span className="font-medium">{r.capacity}</span></div>
                        <div className="text-sm text-slate-600">Used: <span className="font-medium text-orange-600">{stats.used}</span> / Available: <span className="font-medium text-green-600">{stats.remaining}</span></div>
                        <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                          <MapPin size={14} />
                          <LocationRenderer alert={{ lat: r.location?.lat, lon: r.location?.lon, location: '' }} />
                        </div>
                      </div>
                      <div className="text-right flex flex-col gap-2 items-end">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${r.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {r.available ? 'Available' : 'Allocated'}
                        </span>
                        <button
                          onClick={() => setViewingResourceUsage(r)}
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

      {/* Volunteer Assignment Modal */}
      {selectedCrisis && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Assign Volunteers to Crisis</h2>
              <button
                onClick={() => setSelectedCrisis(null)}
                className="text-slate-500 hover:text-slate-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {/* Crisis Details */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{formatCrisisType(selectedCrisis.crisis_type).label}</h3>
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin size={16} />
                    <LocationRenderer alert={selectedCrisis} />
                  </div>
                </div>
              </div>
              {selectedCrisis.message && (
                <p className="text-sm text-slate-700 mt-2">{selectedCrisis.message}</p>
              )}
            </div>

            {/* Required Skills */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-3">Required Skills:</h3>
              <div className="flex gap-2 flex-wrap">
                {getRequiredSkills(selectedCrisis.crisis_type).map(skill => (
                  <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {skill.replace('_', ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Request Form */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Number of Volunteers Needed
              </label>
              <input 
                type="number" 
                min="1" 
                max="50"
                value={requestCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setRequestCount(isNaN(val) ? '' : val);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-slate-500 mt-2">This will broadcast a request to all eligible volunteers.</p>
            </div>

            <button
              onClick={() => handlePostRequest(selectedCrisis)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
            >
              Post Volunteer Request
            </button>
          </div>
        </div>
      )}

      {/* Resource Assignment Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Assign Resources to Crisis</h2>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-slate-500 hover:text-slate-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {/* Crisis Details */}
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{formatCrisisType(selectedResource.crisis_type).label}</h3>
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin size={16} />
                    <LocationRenderer alert={selectedResource} />
                  </div>
                </div>
              </div>
              {selectedResource.message && (
                <p className="text-sm text-slate-700 mt-2">{selectedResource.message}</p>
              )}
            </div>

            {/* Available Resources */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-3">Available Resources</h3>
              {resources.filter(r => getResourceStats(r).remaining > 0).length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  No available resources at this time
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
                  {resources.filter(r => getResourceStats(r).remaining > 0).map(resource => {
                    const stats = getResourceStats(resource);
                    return (
                    <div key={resource.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-900">{resource.id}</div>
                        <div className="text-sm text-slate-600">Type: {resource.type}</div>
                        <div className="text-sm text-slate-600">Available: <span className="font-bold text-green-600">{stats.remaining}</span> / {stats.total}</div>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin size={14} />
                          <LocationRenderer alert={{ lat: resource.location?.lat, lon: resource.location?.lon, location: '' }} />
                        </div>
                      </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="number" 
                          placeholder="Amount"
                          className="w-24 px-2 py-1 text-sm border border-slate-300 rounded"
                          min="1"
                          max={stats.remaining}
                          value={assignmentInputs[resource.id] || ''}
                          onChange={(e) => setAssignmentInputs(prev => ({ ...prev, [resource.id]: e.target.value }))}
                        />
                      <button
                        onClick={() => handleAssignResource(selectedResource, resource)}
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

      {/* Viewing Accepted Volunteers Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Accepted Volunteers</h2>
              </div>
              <button
                onClick={() => setViewingRequest(null)}
                className="text-slate-500 hover:text-slate-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {(!viewingRequest.accepted_volunteers || viewingRequest.accepted_volunteers.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500">
                  No volunteers have accepted this request yet.
                </div>
              ) : (
                volunteers
                  .filter(v => viewingRequest.accepted_volunteers.includes(v.id))
                  .map(v => (
                    <div key={v.id} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{v.name}</div>
                        <div className="text-sm text-slate-600">📱 {v.phone}</div>
                        <div className="text-xs text-slate-500 mt-1">Skills: {v.skills?.join(', ')}</div>
                      </div>
                      <div className="text-right">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Accepted</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Viewing Assigned Resources Modal */}
      {viewingAssignments && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Assigned Resources</h2>
                <p className="text-slate-600 text-sm mt-1">Crisis: {formatCrisisType(viewingAssignments.crisis_type).label}</p>
              </div>
              <button
                onClick={() => setViewingAssignments(null)}
                className="text-slate-500 hover:text-slate-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Volunteers Section */}
              <div>
                {(() => {
                   const req = getRequestForCrisis(viewingAssignments.alert_id || viewingAssignments.id);
                   const count = req?.accepted_volunteers?.length || 0;
                   return (
                     <>
                       <h3 className="text-lg font-bold text-slate-900 mb-3">Volunteers ({count}{req ? ` / ${req.volunteers_needed}` : ''})</h3>
                       {count === 0 ? (
                         <p className="text-slate-500 italic">No volunteers assigned yet.</p>
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

              {/* Resources Section */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Equipment & Resources</h3>
                {(() => {
                   const crisisId = viewingAssignments.alert_id || viewingAssignments.id;
                   const crisisAssignments = assignments.filter(a => a.crisis_id === crisisId);
                   
                   if (crisisAssignments.length === 0) {
                     return <p className="text-slate-500 italic">No resources assigned yet.</p>;
                   }
                   
                   return (
                     <div className="space-y-2">
                       {crisisAssignments.map((a, idx) => (
                         <div key={idx} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center bg-slate-50">
                           <div>
                             <div className="font-bold text-slate-900">{a.resource_type}</div>
                             <div className="text-sm text-slate-600">Capacity: {a.resource_capacity}</div>
                           </div>
                           <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium">Assigned</span>
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

      {/* Viewing Resource Usage Modal */}
      {viewingResourceUsage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Resource Usage: {viewingResourceUsage.type}</h2>
                <p className="text-slate-600 text-sm mt-1">ID: {viewingResourceUsage.id}</p>
                <p className="text-slate-600 text-sm">Total Capacity: {viewingResourceUsage.capacity}</p>
              </div>
              <button
                onClick={() => setViewingResourceUsage(null)}
                className="text-slate-500 hover:text-slate-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {assignments.filter(a => a.resource_id === viewingResourceUsage.id).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500">
                  This resource has not been assigned to any crisis.
                </div>
              ) : (
                assignments.filter(a => a.resource_id === viewingResourceUsage.id).map((a, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">{formatCrisisType(a.crisis_type).label}</div>
                      <div className="text-sm text-slate-600">Assigned Amount: <span className="font-bold">{a.resource_capacity}</span></div>
                      <div className="text-xs text-slate-500 mt-1">Date: {new Date(a.assigned_at).toLocaleString()}</div>
                    </div>
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium">Active</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}