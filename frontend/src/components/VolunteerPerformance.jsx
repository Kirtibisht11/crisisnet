import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, AlertTriangle, Clock } from 'lucide-react';

const VolunteerPerformance = () => {
  const [topVolunteers, setTopVolunteers] = useState([]);
  const [trainingNeeds, setTrainingNeeds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  useEffect(() => {
    fetchVolunteerData();
  }, []);

  const fetchVolunteerData = async () => {
    try {
      const [topResponse, trainingResponse] = await Promise.all([
        fetch('/api/learning/volunteers?limit=10'),
        fetch('/api/learning/volunteers/training-needs')
      ]);

      const topData = await topResponse.json();
      const trainingData = await trainingResponse.json();

      setTopVolunteers(topData.data.volunteers || []);
      setTrainingNeeds(trainingData.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch volunteer data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (score) => {
    if (score >= 0.9) return 'text-green-600 bg-green-100';
    if (score >= 0.75) return 'text-blue-600 bg-blue-100';
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusBadge = (score) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.75) return 'Good';
    if (score >= 0.5) return 'Average';
    return 'Needs Training';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Performers</p>
              <p className="text-2xl font-bold text-green-600">
                {topVolunteers.filter(v => v.reliability_score >= 0.9).length}
              </p>
            </div>
            <Award className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Volunteers</p>
              <p className="text-2xl font-bold text-blue-600">{topVolunteers.length}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Need Training</p>
              <p className="text-2xl font-bold text-yellow-600">
                {trainingNeeds?.needs_training || 0}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response</p>
              <p className="text-2xl font-bold text-purple-600">
                {topVolunteers.length > 0
                  ? Math.round(
                      topVolunteers.reduce((acc, v) => acc + v.avg_response_time, 0) /
                        topVolunteers.length / 60
                    )
                  : 0}m
              </p>
            </div>
            <Clock className="w-10 h-10 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Top Performing Volunteers
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volunteer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reliability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topVolunteers.map((volunteer, index) => (
                <tr
                  key={volunteer.volunteer_id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedVolunteer(volunteer)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && <Award className="w-5 h-5 text-yellow-500 mr-2" />}
                      {index === 1 && <Award className="w-5 h-5 text-gray-400 mr-2" />}
                      {index === 2 && <Award className="w-5 h-5 text-orange-600 mr-2" />}
                      <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">
                      {volunteer.volunteer_id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2 w-24">
                        <div
                          className={`h-2 rounded-full ${
                            volunteer.reliability_score >= 0.9
                              ? 'bg-green-600'
                              : volunteer.reliability_score >= 0.75
                              ? 'bg-blue-600'
                              : volunteer.reliability_score >= 0.5
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${volunteer.reliability_score * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {(volunteer.reliability_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {volunteer.total_tasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(volunteer.avg_response_time / 60)}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        volunteer.reliability_score
                      )}`}
                    >
                      {getStatusBadge(volunteer.reliability_score)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Training Needs Section */}
      {trainingNeeds && trainingNeeds.needs_training > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-yellow-900 mb-2">
                Training Recommendations
              </h4>
              <p className="text-sm text-yellow-800 mb-4">
                {trainingNeeds.needs_training} volunteer(s) need additional training to improve
                performance.
              </p>
              <div className="space-y-2">
                {trainingNeeds.recommendations?.map((rec, idx) => (
                  <div key={idx} className="flex items-center text-sm text-yellow-800">
                    <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                    {rec}
                  </div>
                ))}
              </div>
              <button className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-medium">
                Schedule Training Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Detail Modal */}
      {selectedVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Volunteer Details</h3>
              <button
                onClick={() => setSelectedVolunteer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Volunteer ID</p>
                  <p className="font-mono font-semibold">{selectedVolunteer.volunteer_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reliability Score</p>
                  <p className="font-semibold text-2xl text-blue-600">
                    {(selectedVolunteer.reliability_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="font-semibold">{selectedVolunteer.total_tasks}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="font-semibold">
                    {Math.round(selectedVolunteer.avg_response_time / 60)} minutes
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Performance Breakdown</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Reliability</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedVolunteer.reliability_score * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {(selectedVolunteer.reliability_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerPerformance;