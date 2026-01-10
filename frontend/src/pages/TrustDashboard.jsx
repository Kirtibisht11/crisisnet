import React, { useState, useEffect } from 'react';
import { Shield, Users, TrendingUp, Activity, Database, Settings, RefreshCw } from 'lucide-react';
import TrustScoreCard from '../components/TrustScoreCard';

const TrustDashboard = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statusResponse, statsResponse] = await Promise.all([
        fetch('/api/trust/status'),
        fetch('/api/trust/statistics')
      ]);

      const statusData = await statusResponse.json();
      const statsData = await statsResponse.json();

      setSystemStatus(statusData.data);
      setStatistics(statsData.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch trust dashboard data:', error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const response = await fetch(`/api/trust/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedUser(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Trust Dashboard...</p>
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
              <Shield className="w-8 h-8 mr-3 text-blue-600" />
              Trust Agent Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              AI-powered trust verification and reputation management
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

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Agent Status</h3>
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {systemStatus?.trust_agent || 'OPERATIONAL'}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Mode: {systemStatus?.mode || 'database'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {statistics?.total_users || 0}
          </div>
          <p className="text-xs text-gray-500 mt-2">Tracked users</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Alerts</h3>
            <Database className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {statistics?.total_alerts || 0}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {statistics?.verified_alerts || 0} verified
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">External Sources</h3>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {statistics?.tracked_sources || 0}
          </div>
          <p className="text-xs text-gray-500 mt-2">Being monitored</p>
        </div>
      </div>

      {/* Configuration Overview */}
      {systemStatus?.thresholds && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600" />
            Trust Thresholds Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm text-gray-600 mb-2">Auto-Verify Threshold</div>
              <div className="text-3xl font-bold text-green-600">
                ≥ {(systemStatus.thresholds.auto_verify * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Alerts above this are automatically verified
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <div className="text-sm text-gray-600 mb-2">Review Threshold</div>
              <div className="text-3xl font-bold text-yellow-600">
                {(systemStatus.thresholds.needs_review * 100).toFixed(0)}% - {(systemStatus.thresholds.auto_verify * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Alerts in this range need manual review
              </div>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="text-sm text-gray-600 mb-2">Reject Threshold</div>
              <div className="text-3xl font-bold text-red-600">
                &lt; {(systemStatus.thresholds.reject * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Alerts below this are automatically rejected
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Example Trust Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <TrustScoreCard
          score={0.85}
          decision="VERIFIED"
          components={{
            cross_verification: 0.32,
            source_reputation: 0.30,
            historical_boost: 0.08,
            bonus_signals: 0.05,
            duplicate_adjustment: -0.05,
            rate_limit_penalty: 0.0
          }}
          breakdown={{
            base_score: 0.80,
            adjustments: 0.05
          }}
        />

        <TrustScoreCard
          score={0.55}
          decision="REVIEW"
          components={{
            cross_verification: 0.20,
            source_reputation: 0.26,
            historical_boost: 0.03,
            bonus_signals: 0.03,
            duplicate_adjustment: 0.0,
            rate_limit_penalty: -0.02
          }}
          breakdown={{
            base_score: 0.50,
            adjustments: 0.05
          }}
        />
      </div>

      {/* Scoring Weights */}
      {systemStatus?.scoring_config && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Scoring Weights Configuration
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(systemStatus.scoring_config.weights).map(([key, value]) => (
              <div key={key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-2 capitalize">
                  {key.replace('_', ' ')}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {(value * 100).toFixed(0)}%
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${value * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crisis Type Severity Levels */}
      {systemStatus?.scoring_config?.crisis_severity_levels && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Crisis Type Severity Configuration
          </h3>

          <div className="space-y-4">
            {Object.entries(systemStatus.scoring_config.crisis_severity_levels).map(
              ([level, types]) => {
                const colors = {
                  CRITICAL: 'bg-red-50 border-red-200 text-red-800',
                  HIGH: 'bg-orange-50 border-orange-200 text-orange-800',
                  MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                  LOW: 'bg-blue-50 border-blue-200 text-blue-800'
                };

                return (
                  <div
                    key={level}
                    className={`p-4 rounded-lg border-2 ${colors[level]}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg">{level}</h4>
                      <span className="text-sm font-semibold">
                        {types.length} types
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {types.map((type) => (
                        <span
                          key={type}
                          className="px-3 py-1 bg-white rounded-full text-xs font-medium capitalize"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-gray-900">User Profile</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">User ID</div>
                    <div className="font-mono font-semibold">{selectedUser.user_id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Reputation</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {(selectedUser.reputation * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Reports</div>
                    <div className="text-xl font-semibold">{selectedUser.total_reports}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Accuracy Rate</div>
                    <div className="text-xl font-semibold text-green-600">
                      {selectedUser.accuracy_rate}%
                    </div>
                  </div>
                </div>

                {selectedUser.recent_history && selectedUser.recent_history.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Recent History</h4>
                    <div className="space-y-2">
                      {selectedUser.recent_history.map((entry, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg ${
                            entry.was_accurate ? 'bg-green-50' : 'bg-red-50'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">
                              {entry.was_accurate ? '✓ Accurate' : '✗ Inaccurate'}
                            </span>
                            <span className="text-xs text-gray-600">
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustDashboard;