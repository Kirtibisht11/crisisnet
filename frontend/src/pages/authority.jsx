import { useState, useEffect } from 'react';
import AgentStatusPanel from '../components/AgentStatusPanel';
import { 
  formatTrustScore, 
  formatDecision, 
  formatReputation, 
  formatTimestamp,
  formatCrisisType,
  formatScoreBreakdown,
  formatSourceCount,
  formatPriority,
  sanitizeText,
  getUserTypeBadge
} from '../utils/formatter';

const AuthorityDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch alerts from backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:8000/api/alerts');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Use alerts directly from backend (they already have all required fields)
        setAlerts(data.alerts || []);
        
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'verified') return alert.decision === 'VERIFIED';
    if (filterStatus === 'review') return alert.decision === 'REVIEW';
    if (filterStatus === 'rejected') return alert.decision === 'REJECTED' || alert.decision === 'UNCERTAIN';
    return true;
  });

  const getAlertCounts = () => {
    return {
      all: alerts.length,
      verified: alerts.filter(a => a.decision === 'VERIFIED').length,
      review: alerts.filter(a => a.decision === 'REVIEW').length,
      rejected: alerts.filter(a => a.decision === 'REJECTED' || a.decision === 'UNCERTAIN').length
    };
  };

  const counts = getAlertCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🚨 Authority Dashboard</h1>
              <p className="text-blue-100 text-lg">AI-Powered Crisis Alert Verification • Round 1</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">System Status</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                {loading ? 'LOADING' : 'OPERATIONAL'}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <div className="font-bold text-red-800">Unable to load alerts</div>
                <div className="text-sm text-red-600">Error: {error}</div>
                <div className="text-xs text-red-500 mt-1">Make sure backend is running on http://localhost:8000</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Agent Status */}
          <div className="lg:col-span-1">
            <AgentStatusPanel alerts={alerts} />
          </div>

          {/* Right Column - Alerts List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b-2 border-gray-200">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                    filterStatus === 'all' 
                      ? 'bg-blue-500 text-white shadow-lg scale-105' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({counts.all})
                </button>
                <button
                  onClick={() => setFilterStatus('verified')}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                    filterStatus === 'verified' 
                      ? 'bg-green-500 text-white shadow-lg scale-105' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✓ Verified ({counts.verified})
                </button>
                <button
                  onClick={() => setFilterStatus('review')}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                    filterStatus === 'review' 
                      ? 'bg-yellow-500 text-white shadow-lg scale-105' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⚠ Review ({counts.review})
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                    filterStatus === 'rejected' 
                      ? 'bg-red-500 text-white shadow-lg scale-105' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✕ Rejected ({counts.rejected})
                </button>
              </div>

              {/* Alerts List */}
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                {loading && (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-6xl mb-4 animate-bounce">⏳</div>
                    <div className="text-xl font-semibold">Loading alerts...</div>
                    <div className="text-sm mt-2">Fetching data from backend</div>
                  </div>
                )}

                {!loading && !error && filteredAlerts.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-6xl mb-4">📭</div>
                    <div className="text-xl font-semibold">No alerts found</div>
                    <div className="text-sm mt-2">Try changing the filter or check back later</div>
                  </div>
                )}

                {!loading && filteredAlerts.map((alert) => {
                  const trustScore = formatTrustScore(alert.trust_score);
                  const decision = formatDecision(alert.decision);
                  const crisis = formatCrisisType(alert.crisis_type);
                  const priority = formatPriority(alert.trust_score, alert.crisis_type);
                  const sources = formatSourceCount(alert.cross_verification?.sources || 0);
                  const userBadge = getUserTypeBadge(alert.reputation);

                  return (
                    <div
                      key={alert.alert_id}
                      onClick={() => setSelectedAlert(alert)}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all cursor-pointer hover:border-blue-300 bg-white"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{crisis.emoji}</div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg">{crisis.label}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <span>📍</span>{alert.location}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span 
                            className="px-4 py-1.5 rounded-full text-sm font-bold shadow-md"
                            style={{ 
                              backgroundColor: decision.bgColor, 
                              color: decision.color 
                            }}
                          >
                            {decision.icon} {decision.text}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                          <div className="text-xs text-purple-600 font-medium mb-1">Trust Score</div>
                          <div className="text-2xl font-bold" style={{ color: trustScore.textColor }}>
                            {trustScore.value}%
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                          <div className="text-xs text-orange-600 font-medium mb-1">Priority</div>
                          <div className="text-lg font-bold" style={{ color: priority.color }}>
                            {priority.level}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-medium mb-1">Sources</div>
                          <div className="text-2xl font-bold" style={{ color: sources.color }}>
                            {sources.badge}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                          <div className="text-xs text-green-600 font-medium mb-1">Reporter</div>
                          <div className="text-xs font-bold" style={{ color: userBadge.color }}>
                            {userBadge.label}
                          </div>
                        </div>
                      </div>

                      {alert.message && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg line-clamp-2">
                          💬 {sanitizeText(alert.message, 120)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Alert Detail Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <span>{formatCrisisType(selectedAlert.crisis_type).emoji}</span>
                    Alert Details
                  </h2>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-all"
                  >
                    ×
                  </button>
                </div>

                {/* Crisis Info */}
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-5xl">{formatCrisisType(selectedAlert.crisis_type).emoji}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {formatCrisisType(selectedAlert.crisis_type).label}
                      </h3>
                      <p className="text-gray-600 flex items-center gap-2 mt-1">
                        <span>📍</span> {selectedAlert.location}
                      </p>
                      {selectedAlert.lat && selectedAlert.lon && (
                        <p className="text-sm text-gray-500 mt-1">
                          📐 Coordinates: {selectedAlert.lat.toFixed(4)}, {selectedAlert.lon.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedAlert.message && (
                    <div className="bg-white bg-opacity-70 p-4 rounded-lg">
                      <div className="font-semibold text-gray-700 mb-2">💬 Message:</div>
                      <p className="text-gray-800">{sanitizeText(selectedAlert.message)}</p>
                    </div>
                  )}
                </div>

                {/* Trust Score Breakdown */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-4 text-xl flex items-center gap-2">
                    <span>📊</span> Trust Analysis
                  </h3>
                  <div className="space-y-3">
                    {formatScoreBreakdown(selectedAlert.components).map((component, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: component.color }}
                          ></div>
                          <span className="font-semibold text-gray-800">{component.label}</span>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                            Weight: {component.weight}
                          </span>
                        </div>
                        <span 
                          className="font-bold text-lg"
                          style={{ color: component.color }}
                        >
                          {component.value >= 0 ? '+' : ''}{(component.value * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Reputation */}
                {selectedAlert.reputation != null && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                    <h4 className="font-bold text-purple-800 mb-3 text-lg flex items-center gap-2">
                      <span>👤</span> Reporter Profile
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{formatReputation(selectedAlert.reputation).stars}</div>
                      <div>
                        <div className="font-bold text-2xl text-purple-600">
                          {formatReputation(selectedAlert.reputation).value}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatReputation(selectedAlert.reputation).tier} • {selectedAlert.user_id}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cross Verification Info */}
                {selectedAlert.cross_verification && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-3 text-lg flex items-center gap-2">
                      <span>🔗</span> Cross-Verification
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Sources Found</div>
                        <div className="text-3xl font-bold text-blue-600">
                          {selectedAlert.cross_verification.sources}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Verification Score</div>
                        <div className="text-3xl font-bold text-blue-600">
                          {(selectedAlert.cross_verification.score * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700 bg-white bg-opacity-70 p-3 rounded-lg">
                      {selectedAlert.cross_verification.details}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedAlert.decision === 'REVIEW' && (
                  <div className="flex gap-4">
                    <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl">
                      ✓ Approve Alert
                    </button>
                    <button className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl">
                      ✕ Reject Alert
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorityDashboard;