import { useState, useEffect } from "react";
import { Brain, TrendingUp, Users, Activity } from 'lucide-react';
import { subscribe } from "../services/socket";

const AgentStatusPanel = ({ alerts }) => {
  const [liveAlerts, setLiveAlerts] = useState(alerts || []);
  const [learningStatus, setLearningStatus] = useState(null);
  const [systemPerformance, setSystemPerformance] = useState(null);

  // Update alerts from props
  useEffect(() => {
    setLiveAlerts(alerts || []);
  }, [alerts]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    const unsubscribe = subscribe("alert_update", (payload) => {
      if (!payload || !payload.alerts) return;
      setLiveAlerts(payload.alerts);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch Learning Agent status
  useEffect(() => {
    const fetchLearningStatus = async () => {
      try {
        const [statusResponse, perfResponse] = await Promise.all([
          fetch('/api/learning/status'),
          fetch('/api/learning/performance')
        ]);

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setLearningStatus(statusData.data);
        }

        if (perfResponse.ok) {
          const perfData = await perfResponse.json();
          setSystemPerformance(perfData.data);
        }
      } catch (error) {
        console.debug('Learning Agent not available:', error);
      }
    };

    fetchLearningStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLearningStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const verifiedCount = liveAlerts.filter(a => a.decision === "VERIFIED").length;
  const reviewCount = liveAlerts.filter(
    a => a.decision === "REVIEW" || a.decision === "UNCERTAIN"
  ).length;
  const rejectedCount = liveAlerts.filter(a => a.decision === "REJECTED").length;

  const avgTrustScore =
    liveAlerts.length > 0
      ? (
          (liveAlerts.reduce((sum, a) => sum + (a.trust_score || 0), 0) /
            liveAlerts.length) *
          100
        ).toFixed(1)
      : 0;

  const getHealthColor = (status) => {
    if (status === 'healthy') return 'bg-green-500';
    if (status === 'warning') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-600';
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* SYSTEM HEALTH - Enhanced */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            AI Agent Status
          </h3>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-600 font-semibold">LIVE</span>
          </span>
        </div>

        <div className="space-y-4">
          {/* Trust Agent Stats */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm text-purple-700 font-medium">Trust Agent</span>
              </div>
              <span className="text-xs px-2 py-1 bg-purple-200 text-purple-700 rounded-full font-semibold">
                Active
              </span>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {avgTrustScore}%
            </div>
            <div className="mt-1 text-xs text-purple-600">
              Avg Trust Score • {liveAlerts.length} alert{liveAlerts.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Learning Agent Stats - NEW */}
          {systemPerformance && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-100 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Brain className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-700 font-medium">Learning Agent</span>
                </div>
                <span 
                  className={`w-2 h-2 rounded-full ${getHealthColor(systemPerformance.health_status)}`}
                ></span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold ${getGradeColor(systemPerformance.performance_grade)}`}>
                  {systemPerformance.performance_grade?.split(' - ')[0] || 'N/A'}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-600">Success Rate</div>
                  <div className="text-lg font-bold text-blue-600">
                    {systemPerformance.overall_success_rate?.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-blue-600">
                <span className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {systemPerformance.active_volunteers} volunteers
                </span>
                <span>{systemPerformance.total_tasks} tasks</span>
              </div>
            </div>
          )}

          {/* Alert Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                <span className="font-semibold text-green-800">Verified</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {verifiedCount}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                <span className="font-semibold text-yellow-800">Review</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">
                {reviewCount}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                <span className="font-semibold text-red-800">Rejected</span>
              </div>
              <span className="text-2xl font-bold text-red-600">
                {rejectedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TRUST CRITERIA */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Trust Criteria
        </h3>

        <div className="space-y-3">
          <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div className="font-bold text-green-800">
              Verified (≥ 65%)
            </div>
            <div className="text-xs text-green-700">
              Immediate action required
            </div>
          </div>

          <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
            <div className="font-bold text-yellow-800">
              Review (40–64%)
            </div>
            <div className="text-xs text-yellow-700">
              Manual authority review
            </div>
          </div>

          <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
            <div className="font-bold text-red-800">
              Rejected (&lt; 40%)
            </div>
            <div className="text-xs text-red-700">
              Likely false signal
            </div>
          </div>
        </div>
      </div>

      {/* LEARNING INSIGHTS - NEW */}
      {systemPerformance && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-indigo-200">
          <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            System Insights
          </h3>
          
          <div className="space-y-2 text-sm">
            {systemPerformance.overall_success_rate >= 80 && (
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">
                  System performing excellently
                </span>
              </div>
            )}
            
            {systemPerformance.active_volunteers < 10 && (
              <div className="flex items-start">
                <span className="text-yellow-600 mr-2">⚠</span>
                <span className="text-gray-700">
                  Consider recruiting more volunteers
                </span>
              </div>
            )}
            
            {verifiedCount > rejectedCount * 2 && (
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">ℹ</span>
                <span className="text-gray-700">
                  High verification rate indicates quality reporting
                </span>
              </div>
            )}

            {liveAlerts.length === 0 && (
              <div className="flex items-start">
                <span className="text-gray-600 mr-2">○</span>
                <span className="text-gray-700">
                  No active alerts at the moment
                </span>
              </div>
            )}
          </div>

          {learningStatus && (
            <div className="mt-4 pt-4 border-t border-indigo-200">
              <div className="text-xs text-gray-600">
                Learning Agent: <span className="font-semibold text-indigo-600">
                  {learningStatus.status}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentStatusPanel;