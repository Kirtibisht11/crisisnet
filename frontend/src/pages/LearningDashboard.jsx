import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Users,
  Target,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import VolunteerPerformance from '../components/VolunteerPerformance';

const LearningDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemPerformance, setSystemPerformance] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [learningReport, setLearningReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [perfResponse, statsResponse, reportResponse] = await Promise.all([
        fetch('/api/learning/performance'),
        fetch('/api/learning/statistics'),
        fetch('/api/learning/report?days=30')
      ]);

      const perfData = await perfResponse.json();
      const statsData = await statsResponse.json();
      const reportData = await reportResponse.json();

      setSystemPerformance(perfData.data);
      setStatistics(statsData.data);
      setLearningReport(reportData.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade?.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade?.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade?.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthColor = (status) => {
    if (status === 'healthy') return 'text-green-600 bg-green-100';
    if (status === 'warning') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Learning Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Brain className="w-8 h-8 mr-3 text-blue-600" />
              Learning Agent Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              AI-powered performance analysis and continuous system improvement
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* System Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Performance Grade</h3>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          {systemPerformance && (
            <div>
              <div
                className={`text-3xl font-bold px-4 py-2 rounded-lg inline-block ${getGradeColor(
                  systemPerformance.performance_grade
                )}`}
              >
                {systemPerformance.performance_grade?.split(' - ')[0]}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {systemPerformance.performance_grade?.split(' - ')[1]}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Health Status</h3>
            <Target className="w-5 h-5 text-green-600" />
          </div>
          {systemPerformance && (
            <div>
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full ${getHealthColor(
                  systemPerformance.health_status
                )}`}
              >
                {systemPerformance.health_status?.toUpperCase()}
              </span>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {systemPerformance.overall_success_rate?.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600">Success Rate</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Active Volunteers</h3>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          {statistics && (
            <div>
              <p className="text-3xl font-bold text-gray-900">{statistics.active_volunteers}</p>
              <p className="text-sm text-gray-600 mt-1">
                of {statistics.total_volunteers} total
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${
                      (statistics.active_volunteers / statistics.total_volunteers) * 100
                    }%`
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Tasks</h3>
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          {statistics && (
            <div>
              <p className="text-3xl font-bold text-gray-900">{statistics.total_tasks}</p>
              <p className="text-sm text-gray-600 mt-1">
                {statistics.total_crises} crises handled
              </p>
              <div className="flex items-center mt-2 text-xs">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">
                  {statistics.avg_volunteer_reliability?.toFixed(1)} avg reliability
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('volunteers')}
              className={`${
                activeTab === 'volunteers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              Volunteer Performance
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`${
                activeTab === 'insights'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              Learning Insights
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Insights */}
            {learningReport?.key_insights && learningReport.key_insights.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Key Insights
                </h3>
                <div className="space-y-2">
                  {learningReport.key_insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start text-blue-800">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-600 mb-4">Response Metrics</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">Avg Response Time</span>
                      <span className="text-xs font-medium">
                        {statistics?.avg_response_time
                          ? `${Math.round(statistics.avg_response_time / 60)}m`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">Success Rate</span>
                      <span className="text-xs font-medium">
                        {statistics?.overall_success_rate?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${statistics?.overall_success_rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-600 mb-4">Volunteer Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-bold">{statistics?.total_volunteers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active</span>
                    <span className="text-lg font-bold text-green-600">
                      {statistics?.active_volunteers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Reliability</span>
                    <span className="text-lg font-bold text-blue-600">
                      {statistics?.avg_volunteer_reliability?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-600 mb-4">Crisis Handling</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Crises</span>
                    <span className="text-lg font-bold">{statistics?.total_crises}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tasks Completed</span>
                    <span className="text-lg font-bold text-purple-600">
                      {statistics?.total_tasks}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {statistics?.overall_success_rate?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'volunteers' && <VolunteerPerformance />}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Learning Report (Last 30 Days)</h3>
              {learningReport && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Generated: {new Date(learningReport.generated_at).toLocaleString()}
                  </p>
                  <div className="border-t pt-4">
                    <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
                      {JSON.stringify(learningReport, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningDashboard;