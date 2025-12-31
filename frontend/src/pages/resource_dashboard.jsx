import React, { useEffect, useState } from 'react'
import api, { runPipeline } from '../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../state/userStore'

const formatCrisisType = (type) => {
  const types = {
    'flood': { label: 'Flood Emergency' },
    'fire': { label: 'Fire Emergency'},
    'medical': { label: 'Medical Emergency' },
    'earthquake': { label: 'Earthquake' },
    'landslide': { label: 'Landslide'},
    'collapse': { label: 'Building Collapse' }
  };
  return types[type] || { label: type };
};

const getRequiredSkills = (crisisType) => {
  const skillMap = {
    'flood': ['rescue', 'swimming', 'first_aid'],
    'fire': ['firefighting', 'first_aid', 'rescue'],
    'medical': ['medical', 'first_aid'],
    'earthquake': ['rescue', 'first_aid', 'medical'],
    'landslide': ['rescue', 'first_aid'],
    'collapse': ['rescue', 'medical', 'first_aid']
  };
  return skillMap[crisisType] || ['first_aid', 'rescue'];
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
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('alerts')

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
    // Load crises from localStorage
    try {
      const approvedCrises = JSON.parse(localStorage.getItem('approved_crises') || '[]');
      setCrises(approvedCrises);
      const assigns = JSON.parse(localStorage.getItem('resource_assignments') || '[]');
      setAssignments(assigns);
    } catch (err) {
      console.error('Error loading crises:', err);
    }
    setLoading(false)
  }

  async function toggleResource(id, current){
    try{
      await api.put(`/api/resource/resources/${id}/availability`, { available: !current })
      fetchAll()
    }catch(e){ console.error(e); alert('Failed to update') }
  }

  async function toggleVolunteer(id, current){
    try{
      await api.put(`/api/resource/volunteers/${id}/availability`, { available: !current })
      fetchAll()
    }catch(e){ console.error(e); alert('Failed to update') }
  }

  const handleAssignVolunteers = (crisis) => {
    const requiredSkills = getRequiredSkills(crisis.crisis_type);
    
    const suitableVolunteers = volunteers.filter(v => {
      if (!v.available) return false;
      if (!v.skills || v.skills.length === 0) return false;
      return v.skills.some(skill => requiredSkills.includes(skill));
    });

    const volunteersToAssign = suitableVolunteers.length > 0 
      ? suitableVolunteers.slice(0, 3) 
      : volunteers.filter(v => v.available).slice(0, 3);

    if (volunteersToAssign.length === 0) {
      alert('No available volunteers to assign!');
      return;
    }

    const newAssignments = volunteersToAssign.map(volunteer => ({
      assignment_id: `ASSIGN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      crisis_id: crisis.alert_id || crisis.id,
      volunteer_id: volunteer.id,
      volunteer_name: volunteer.name,
      volunteer_phone: volunteer.phone,
      crisis_type: crisis.crisis_type,
      location: crisis.location,
      message: crisis.message,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
      type: 'volunteer'
    }));

    const allAssignments = [...assignments, ...newAssignments];
    localStorage.setItem('resource_assignments', JSON.stringify(allAssignments));
    setAssignments(allAssignments);

    const volunteerTasks = JSON.parse(localStorage.getItem('volunteer_tasks') || '[]');
    volunteerTasks.push(...newAssignments);
    localStorage.setItem('volunteer_tasks', JSON.stringify(volunteerTasks));

    alert(`Successfully assigned ${volunteersToAssign.length} volunteers to this crisis!`);
    setSelectedCrisis(null);
    fetchAll();
  };

  const handleAssignResource = (crisis, resource) => {
    const newAssignment = {
      assignment_id: `RES_ASSIGN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      crisis_id: crisis.alert_id || crisis.id,
      resource_id: resource.id,
      resource_type: resource.type,
      resource_capacity: resource.capacity,
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

    // Mark resource as unavailable
    toggleResource(resource.id, true);

    alert(`Successfully assigned ${resource.type} (${resource.id}) to crisis!`);
    setSelectedResource(null);
    fetchAll();
  };

  const getAssignedCount = (crisisId) => {
    return assignments.filter(a => a.crisis_id === crisisId).length;
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
              <h2 className="text-2xl font-bold text-slate-900">Resource Manager</h2>
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition"
                  onClick={fetchAll}
                >
                  {loading ? 'Refreshing...' : '🔄 Refresh'}
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition"
                  onClick={async () => {
                    const res = await runPipeline()
                    alert(JSON.stringify(res.summary || res, null, 2))
                    fetchAll()
                  }}
                >
                  ⚡ Run Pipeline
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'alerts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Crisis Alerts
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'resources' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Resources
              </button>
              <button
                onClick={() => setActiveTab('volunteers')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'volunteers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Volunteers
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
                    return (
                      <div
                        key={crisis.alert_id || crisis.id}
                        className="border border-slate-300 rounded-lg p-5 bg-white hover:border-slate-400 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{crisisType.emoji}</span>
                              <h3 className="text-lg font-bold text-slate-900">{crisisType.label}</h3>
                            </div>
                            <p className="text-slate-600 mt-2">📍 {crisis.location}</p>
                            {crisis.message && (
                              <p className="text-sm text-slate-600 mt-1">{crisis.message}</p>
                            )}
                            <div className="mt-3 flex gap-2 flex-wrap">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                Trust: {(crisis.trust_score * 100).toFixed(0)}%
                              </span>
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                Priority: {crisis.priority || 'MEDIUM'}
                              </span>
                              {assignedCount > 0 && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                  {assignedCount} Assigned
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedCrisis(crisis)}
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                            >
                              {assignedCount > 0 ? 'Assign More Volunteers' : 'Assign Volunteers'}
                            </button>
                            <button
                              onClick={() => setSelectedResource(crisis)}
                              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition"
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
                {resources.map(r => (
                  <div key={r.id} className="p-4 border border-slate-300 rounded-lg hover:border-slate-400 transition bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-900">{r.id}</div>
                        <div className="text-sm text-slate-600 mt-1">Type: <span className="font-medium">{r.type}</span></div>
                        <div className="text-sm text-slate-600">Capacity: <span className="font-medium">{r.capacity}</span></div>
                        <div className="text-sm text-slate-600 mt-1">📍 {r.location?.lat}, {r.location?.lon}</div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${r.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {r.available ? 'Available' : 'Allocated'}
                        </span>
                        <div className="mt-3">
                          <button
                            className="px-3 py-1 text-xs font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition"
                            onClick={() => toggleResource(r.id, r.available)}
                          >
                            Toggle Status
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            )}

            {/* Volunteers Section */}
            {activeTab === 'volunteers' && (
            <>
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Volunteers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {volunteers.map(v => (
                  <div key={v.id} className="p-4 border border-slate-300 rounded-lg hover:border-slate-400 transition bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-900">{v.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{v.id}</div>
                        <div className="text-sm text-slate-600 mt-2">📱 {v.phone || 'No phone'}</div>
                        <div className="text-sm text-slate-600">Skills: <span className="font-medium">{v.skills?.join(', ') || 'General'}</span></div>
                        <div className="text-sm text-slate-600">📍 {v.location?.lat || 'N/A'}, {v.location?.lon || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${v.available ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                          {v.available ? 'Available' : 'Assigned'}
                        </span>
                        <div className="mt-3">
                          <button
                            className="px-3 py-1 text-xs font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition"
                            onClick={() => toggleVolunteer(v.id, v.available)}
                          >
                            Toggle Status
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Volunteer Requests */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Volunteer Requests</h3>
              {vrequests.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                  No volunteer requests at this time.
                </div>
              ) : (
                <div className="space-y-3">
                  {vrequests.slice(0, 6).map(q => (
                    <div key={q.request_id} className="p-4 border border-slate-300 rounded-lg hover:border-slate-400 transition bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-slate-900">{q.request_id}</div>
                          <div className="text-sm text-slate-600 mt-1">Type: <span className="font-medium">{q.crisis_type}</span></div>
                          <div className="text-sm text-slate-600">📍 {q.location?.name}</div>
                          <div className="text-sm text-slate-600 mt-1">
                            Needed: <span className="font-medium">{q.volunteers_needed}</span> • 
                            Fulfilled: <span className="font-medium">{q.fulfilled_count}</span>
                          </div>
                        </div>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {q.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            </>
            )}
          </div>
        </main>
      </div>

      {/* Volunteer Assignment Modal */}
      {selectedCrisis && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
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
                <div className="text-5xl">{formatCrisisType(selectedCrisis.crisis_type).emoji}</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{formatCrisisType(selectedCrisis.crisis_type).label}</h3>
                  <p className="text-slate-600">📍 {selectedCrisis.location}</p>
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

            {/* Available Volunteers */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-3">
                Available Volunteers: {volunteers.filter(v => v.available).length}
              </h3>
              {volunteers.filter(v => v.available).length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  No available volunteers at this time
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
                  {volunteers.filter(v => v.available).slice(0, 10).map(volunteer => (
                    <div key={volunteer.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-semibold text-slate-900">{volunteer.name}</div>
                      <div className="text-sm text-slate-600">📱 {volunteer.phone || 'No phone'}</div>
                      <div className="text-sm text-slate-600">📍 {volunteer.location || 'Location not set'}</div>
                      {volunteer.skills && volunteer.skills.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {volunteer.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleAssignVolunteers(selectedCrisis)}
              disabled={volunteers.filter(v => v.available).length === 0}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition"
            >
              Assign Volunteers to Crisis
            </button>
          </div>
        </div>
      )}

      {/* Resource Assignment Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
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
                <div className="text-5xl">{formatCrisisType(selectedResource.crisis_type).emoji}</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{formatCrisisType(selectedResource.crisis_type).label}</h3>
                  <p className="text-slate-600">📍 {selectedResource.location}</p>
                </div>
              </div>
              {selectedResource.message && (
                <p className="text-sm text-slate-700 mt-2">{selectedResource.message}</p>
              )}
            </div>

            {/* Available Resources */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-3">
                Available Resources: {resources.filter(r => r.available).length}
              </h3>
              {resources.filter(r => r.available).length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  No available resources at this time
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
                  {resources.filter(r => r.available).map(resource => (
                    <div key={resource.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-900">{resource.id}</div>
                        <div className="text-sm text-slate-600">Type: {resource.type}</div>
                        <div className="text-sm text-slate-600">Capacity: {resource.capacity}</div>
                        <div className="text-sm text-slate-600">📍 {resource.location?.lat}, {resource.location?.lon}</div>
                      </div>
                      <button
                        onClick={() => handleAssignResource(selectedResource, resource)}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}