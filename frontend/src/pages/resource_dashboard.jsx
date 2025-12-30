import { useState, useEffect } from 'react';
import { 
  formatCrisisType, 
  formatTimestamp,
  sanitizeText
} from '../utils/formatter';

const ResourceDashboard = () => {
  const [approvedCrises, setApprovedCrises] = useState([]);
  const [selectedCrisis, setSelectedCrisis] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    try {
      // Load approved crises
      const crises = JSON.parse(localStorage.getItem('approved_crises') || '[]');
      setApprovedCrises(crises);

      // Load registered volunteers
      const allUsers = JSON.parse(localStorage.getItem('crisisnet_users') || '[]');
      const volunteerList = allUsers.filter(u => u.role === 'volunteer');
      setVolunteers(volunteerList);

      // Load assignments
      const assigns = JSON.parse(localStorage.getItem('resource_assignments') || '[]');
      setAssignments(assigns);

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setLoading(false);
    }
  };

  const handleAssignVolunteers = (crisis) => {
    // Find available volunteers with relevant skills
    const requiredSkills = getRequiredSkills(crisis.crisis_type);
    
    const suitableVolunteers = volunteers.filter(v => {
      // Check if volunteer has relevant skills
      if (!v.skills || v.skills.length === 0) return false;
      return v.skills.some(skill => requiredSkills.includes(skill));
    });

    if (suitableVolunteers.length === 0) {
      alert('No suitable volunteers found. Assigning any available volunteer.');
    }

    // Create assignment
    const volunteersToAssign = suitableVolunteers.length > 0 
      ? suitableVolunteers.slice(0, 3) 
      : volunteers.slice(0, 3);

    const newAssignments = volunteersToAssign.map(volunteer => ({
      assignment_id: `ASSIGN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      crisis_id: crisis.alert_id,
      volunteer_id: volunteer.id,
      volunteer_name: volunteer.name,
      volunteer_phone: volunteer.phone,
      crisis_type: crisis.crisis_type,
      location: crisis.location,
      lat: crisis.lat,
      lon: crisis.lon,
      message: crisis.message,
      assigned_at: new Date().toISOString(),
      status: 'assigned'
    }));

    // Save assignments
    const allAssignments = [...assignments, ...newAssignments];
    localStorage.setItem('resource_assignments', JSON.stringify(allAssignments));
    setAssignments(allAssignments);

    // Save for volunteers to see
    const volunteerTasks = JSON.parse(localStorage.getItem('volunteer_tasks') || '[]');
    volunteerTasks.push(...newAssignments);
    localStorage.setItem('volunteer_tasks', JSON.stringify(volunteerTasks));

    alert(`Assigned ${volunteersToAssign.length} volunteers to this crisis!`);
    setSelectedCrisis(null);
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

  const getAssignedCount = (crisisId) => {
    return assignments.filter(a => a.crisis_id === crisisId).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Resource Agent Dashboard</h1>
              <p className="text-orange-100 text-lg">Manage Crisis Resources & Volunteer Assignment</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-orange-100">Active Crises</div>
              <div className="text-3xl font-bold">{approvedCrises.length}</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-orange-600">{approvedCrises.length}</div>
            <div className="text-gray-600">Approved Crises</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-blue-600">{volunteers.length}</div>
            <div className="text-gray-600">Registered Volunteers</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-green-600">{assignments.length}</div>
            <div className="text-gray-600">Total Assignments</div>
          </div>
        </div>

        {/* Approved Crises List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Approved Crises Requiring Resources</h2>

          {loading && (
            <div className="text-center py-12">Loading...</div>
          )}

          {!loading && approvedCrises.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-xl font-semibold">No approved crises</div>
              <div className="text-sm mt-2">Waiting for authority approval</div>
            </div>
          )}

          <div className="space-y-4">
            {approvedCrises.map((crisis) => {
              const crisisType = formatCrisisType(crisis.crisis_type);
              const assignedCount = getAssignedCount(crisis.alert_id);

              return (
                <div
                  key={crisis.alert_id}
                  className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all bg-gradient-to-r from-white to-orange-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">{crisisType.label}</h3>
                        <p className="text-gray-600 mt-1">{crisis.location}</p>
                        <p className="text-sm text-gray-500 mt-1">
                        Approved {formatTimestamp(crisis.approved_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-2">
                        Assigned: <span className="font-bold text-blue-600">{assignedCount}</span> volunteers
                      </div>
                      <button
                        onClick={() => setSelectedCrisis(crisis)}
                        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all"
                      >
                        {assignedCount > 0 ? 'Assign More' : 'Assign Volunteers'}
                      </button>
                    </div>
                  </div>

                  {crisis.message && (
                    <div className="mt-4 p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-700">
                        {sanitizeText(crisis.message, 150)}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-3 flex-wrap">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      Priority: {crisis.priority || 'MEDIUM'}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      Trust: {(crisis.trust_score * 100).toFixed(0)}%
                    </span>
                    {assignedCount > 0 && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                        {assignedCount} Volunteers Assigned
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assignment Modal */}
        {selectedCrisis && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Assign Volunteers</h2>
                <button
                  onClick={() => setSelectedCrisis(null)}
                  className="text-gray-500 hover:text-gray-700 text-3xl"
                >
                  ×
                </button>
              </div>

              {/* Crisis Details */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-5xl">{formatCrisisType(selectedCrisis.crisis_type).emoji}</div>
                  <div>
                    <h3 className="text-xl font-bold">{formatCrisisType(selectedCrisis.crisis_type).label}</h3>
                    <p className="text-gray-600">📍 {selectedCrisis.location}</p>
                  </div>
                </div>
                {selectedCrisis.message && (
                  <p className="text-sm text-gray-700">{sanitizeText(selectedCrisis.message)}</p>
                )}
              </div>

              {/* Required Skills */}
              <div className="mb-6">
                <h3 className="font-bold mb-2">Required Skills:</h3>
                <div className="flex gap-2 flex-wrap">
                  {getRequiredSkills(selectedCrisis.crisis_type).map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {skill.replace('_', ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Available Volunteers */}
              <div className="mb-6">
                <h3 className="font-bold mb-3">Available Volunteers: {volunteers.length}</h3>
                {volunteers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No volunteers registered yet
                  </div>
                )}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {volunteers.slice(0, 5).map(volunteer => (
                    <div key={volunteer.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold">{volunteer.name}</div>
                      <div className="text-sm text-gray-600">📱 {volunteer.phone}</div>
                      <div className="text-sm text-gray-600">📍 {volunteer.location || 'Location not set'}</div>
                      {volunteer.skills && volunteer.skills.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
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
              </div>

              <button
                onClick={() => handleAssignVolunteers(selectedCrisis)}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Assign Volunteers to Crisis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceDashboard;