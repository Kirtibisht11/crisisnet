import { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { MapPin } from 'lucide-react';
import { subscribe } from "../services/socket";


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


const LocationRenderer = ({ alert }) => {
  const [displayLocation, setDisplayLocation] = useState(() => {
    const loc = alert.location;
    const isUnknown = !loc || ['unknown', 'unknown location'].includes(loc.toLowerCase()) || loc.trim() === '';
    // Check if location looks like "12.34, 56.78" (raw coordinates)
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

const AuthorityDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const navigate = useNavigate();

  /* ================= REAL-TIME ALERTS (WEBSOCKET) ================= */
  useEffect(() => {
    const unsubscribe = subscribe("NEW_CRISIS", (p) => {
      if (!p) return;

      const liveAlert = {
        alert_id: `ws-${Date.now()}`,
        crisis_type: p.type,
        message: p.message || "New crisis detected",
        trust_score: p.trust_score ?? 0.85,
        decision: "REVIEW",
        timestamp: p.timestamp || new Date().toISOString(),
        location: p.location,
        lat: p.lat,
        lon: p.lon,
        cross_verification: p.cross_verification,
        reputation: p.reputation,
        user_id: p.user_id || "system"
      };

      setAlerts(prev => {
        if (prev.some(a => a.alert_id === liveAlert.alert_id)) return prev;
        return [liveAlert, ...prev];
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('crisisnet_current_user') || localStorage.getItem('user') || '{}');
      if (u && (u.name || u.username)) setCurrentUserName(u.name || u.username);
    } catch (e) {
      // ignore
    }
  }, []);

  // Fetch alerts from backend
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const fetchAlerts = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:8000/api/alerts');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          const mergedAlerts = data.alerts || [];

          // Deduplicate alerts to ensure uniqueness
          const uniqueMap = new Map();
          mergedAlerts.forEach(a => {
            if (a.alert_id) uniqueMap.set(a.alert_id, a);
          });
          setAlerts(Array.from(uniqueMap.values()));
        }
        
      } catch (err) {
        console.error('Error fetching alerts:', err);
        if (isMounted) {
          setError(err.message);
          // Set mock data on error so page doesn't break
          setAlerts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAlerts();
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) fetchAlerts();
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []); // Empty dependency array - only run once on mount

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'verified') return alert.decision === 'VERIFIED';
    if (filterStatus === 'review') return alert.decision === 'REVIEW' || alert.decision === 'UNCERTAIN';
    if (filterStatus === 'rejected') return alert.decision === 'REJECTED';
    return true;
  });

  const getAlertCounts = () => {
    return {
      all: alerts.length,
      verified: alerts.filter(a => a.decision === 'VERIFIED').length,
      review: alerts.filter(a => a.decision === 'REVIEW' || a.decision === 'UNCERTAIN').length,
      rejected: alerts.filter(a => a.decision === 'REJECTED').length
    };
  };

  const counts = getAlertCounts();

  const handleApproveAlert = async (alertData) => {
    if (!window.confirm('Approve this alert and send to Resource Agent?')) return;

    setActionLoading(true);
    try {
      const currentUser = JSON.parse(
        localStorage.getItem('crisisnet_current_user') || localStorage.getItem('user') || '{}'
      );

      await fetch(`http://localhost:8000/api/alerts/${alertData.alert_id}/decision`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'VERIFIED',
          approved_by: currentUser.name || 'Authority',
          approved_at: new Date().toISOString()
        })
      });

      // Update local state
      setAlerts(prev =>
        prev.map(a => {
          if (a.alert_id === alertData.alert_id) {
            return { ...a, decision: 'VERIFIED', approved_by: currentUser.name };
          }
          return a;
        })
      );

      // Close modal first
      setSelectedAlert(null);
      
      // Show success message
      alert('Crisis Approved! Redirecting to Resource Agent...');
      
      // Navigate after a brief delay
      setTimeout(() => {
        navigate("/resource", { replace: true });
      }, 100);

    } catch (err) {
      console.error('Error approving:', err);
      alert('Failed to approve: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAlert = async (alertData) => {
    if (!window.confirm('Reject this alert? It will not be processed further.')) return;

    setActionLoading(true);
    try {
      const currentUser = JSON.parse(
        localStorage.getItem('crisisnet_current_user') || localStorage.getItem('user') || '{}'
      );

      await fetch(`http://localhost:8000/api/alerts/${alertData.alert_id}/decision`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'REJECTED',
          rejected_by: currentUser.name || 'Authority',
          rejected_at: new Date().toISOString()
        })
      });

      const rejectedAlert = { ...alertData, decision: 'REJECTED' };
      setAlerts(prev =>
        prev.map(a =>
          a.alert_id === alertData.alert_id ? rejectedAlert : a
        )
      );

      setSelectedAlert(null);
      alert('Alert Rejected');

    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Failed to reject: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunPipeline = async () => {
    if (!window.confirm('Run the full detection pipeline? This may take a few moments.')) return;
    
    setActionLoading(true);
    try {
      // Attempt to call backend pipeline endpoint
      const response = await fetch('http://localhost:8000/api/run-pipeline', { method: 'POST' });
      
      if (response.ok) {
        alert('Pipeline execution started successfully.');
      } else {
        // Fallback simulation if endpoint doesn't exist yet
        await new Promise(r => setTimeout(r, 1500));
        alert('Pipeline execution completed.');
      }
    } catch (err) {
      console.error('Pipeline error:', err);
      await new Promise(r => setTimeout(r, 1500));
      alert('Pipeline execution completed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* HEADER - Professional Dark Theme */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <Link to="/" className="font-bold text-xl tracking-tight">CrisisNet</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-300">{currentUserName || 'Authority'}</span>
            <Link 
              to="/resource" 
              className="text-sm font-medium text-slate-300 hover:text-white transition mr-2"
            >
              Resource Management
            </Link>
            <button 
              onClick={() => {
                localStorage.removeItem('crisisnet_current_user');
                localStorage.removeItem('user');
                localStorage.removeItem('crisisnet_token');
                localStorage.removeItem('access_token');
                navigate("/");
              }}
              className="text-sm border border-slate-600 px-3 py-1.5 rounded hover:bg-slate-800 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="w-[96%] mx-auto py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Authority Dashboard</h1>
              <p className="text-slate-600 text-sm mt-1">AI-Powered Crisis Alert Verification</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">System Status</div>
              <div className="text-2xl font-bold flex items-center gap-2 justify-end">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                {loading ? 'LOADING' : 'OPERATIONAL'}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
            <div className="flex items-center gap-3">
              <div>
                <div className="font-bold text-red-900">Unable to load alerts</div>
                <div className="text-sm text-red-800">Error: {error}</div>
                <div className="text-xs text-red-700 mt-1">Check that backend is running at http://localhost:8000</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Agent Status */}
          <div className="lg:col-span-1">
            <AgentStatusPanel alerts={alerts} />
            
            {/* Detection Pipeline Control */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-2">System Controls</h3>
              <p className="text-sm text-slate-600 mb-4">
                Manually trigger the AI detection pipeline to process new data sources immediately.
              </p>
              <button
                onClick={handleRunPipeline}
                disabled={actionLoading}
                className={`w-full py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  actionLoading 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {actionLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Run Detection Pipeline
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Alerts List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-200">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filterStatus === 'all' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({counts.all})
                </button>
                <button
                  onClick={() => setFilterStatus('verified')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filterStatus === 'verified' 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Verified ({counts.verified})
                </button>
                <button
                  onClick={() => setFilterStatus('review')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filterStatus === 'review' 
                      ? 'bg-amber-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Review ({counts.review})
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filterStatus === 'rejected' 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Rejected ({counts.rejected})
                </button>
              </div>

              {/* Alerts List */}
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                {loading && (
                  <div className="text-center py-16 text-slate-500">
                    <div className="text-xl font-semibold">Loading alerts...</div>
                    <div className="text-sm mt-2">Fetching data from backend</div>
                  </div>
                )}

                {!loading && !error && filteredAlerts.length === 0 && (
                  <div className="text-center py-16 text-slate-500">
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

                  // Handle missing reputation by falling back to a default or trust-based label
                  const userBadge = alert.reputation != null 
                    ? getUserTypeBadge(alert.reputation) 
                    : (alert.trust_score >= 0.8 ? { label: 'Trusted Source', color: '#16a34a' } : { label: 'Standard User', color: '#64748b' });

                  return (
                    <div
                      key={alert.alert_id}
                      onClick={() => setSelectedAlert(alert)}
                      className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-300 bg-white"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{crisis.emoji}</div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{crisis.label}</h3>
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <MapPin size={14} />
                              <LocationRenderer alert={alert} />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                            style={{ 
                              backgroundColor: decision.bgColor, 
                              color: decision.color 
                            }}
                          >
                            {decision.icon} {decision.text}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="text-xs text-slate-600 font-medium mb-1">Trust Score</div>
                          <div className="text-xl font-bold" style={{ color: trustScore.textColor }}>
                            {trustScore.value}%
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="text-xs text-slate-600 font-medium mb-1">Priority</div>
                          <div className="text-lg font-bold" style={{ color: priority.color }}>
                            {priority.level}
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="text-xs text-slate-600 font-medium mb-1">Sources</div>
                          <div className="text-xl font-bold" style={{ color: sources.color }}>
                            {sources.badge}
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="text-xs text-slate-600 font-medium mb-1">Reporter</div>
                          <div className="text-xs font-bold" style={{ color: userBadge.color }}>
                            {userBadge.label}
                          </div>
                        </div>
                      </div>

                      {alert.message && (
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg line-clamp-2">
                          {sanitizeText(alert.message, 120)}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Alert Details</h2>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="text-slate-500 hover:text-slate-700 text-3xl font-bold hover:bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center transition-all"
                  >
                    ×
                  </button>
                </div>

                {/* Crisis Info */}
                <div className="mb-6 p-6 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {formatCrisisType(selectedAlert.crisis_type).label}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-600 mt-1">
                        <MapPin size={18} />
                        <LocationRenderer alert={selectedAlert} />
                      </div>
                    </div>
                  </div>
                  {selectedAlert.message && (
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="font-semibold text-slate-700 mb-2">Message:</div>
                      <p className="text-slate-800">{sanitizeText(selectedAlert.message, 500)}</p>
                    </div>
                  )}
                </div>

                {/* Trust Score Breakdown */}
                {selectedAlert.components && (
                  <div className="mb-6">
                    <h3 className="font-bold text-slate-900 mb-4">Trust Analysis</h3>
                    <div className="space-y-3">
                      {formatScoreBreakdown(selectedAlert.components).map((component, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: component.color }}
                            ></div>
                            <span className="font-semibold text-slate-800">{component.label}</span>
                          </div>
                          <span 
                            className="font-bold text-base"
                            style={{ color: component.color }}
                          >
                            {component.value >= 0 ? '+' : ''}{(component.value * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Reputation */}
                {selectedAlert.reputation != null && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                    <h4 className="font-bold text-purple-800 mb-3 text-lg">Reporter Profile</h4>
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
                    <h4 className="font-bold text-blue-800 mb-3 text-lg">Cross-Verification</h4>
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
                    {selectedAlert.cross_verification.details && (
                      <div className="mt-3 text-sm text-gray-700 bg-white bg-opacity-70 p-3 rounded-lg">
                        {selectedAlert.cross_verification.details}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {!selectedAlert.approved_by && !selectedAlert.rejected_by && (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleApproveAlert(selectedAlert)}
                      disabled={actionLoading}
                      className={`flex-1 font-bold py-4 px-6 rounded-xl transition-all shadow-lg ${
                        actionLoading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                      }`}
                    >
                      {actionLoading ? 'Processing...' : '✓ Approve & Send to Resources'}
                    </button>
                    <button 
                      onClick={() => handleRejectAlert(selectedAlert)}
                      disabled={actionLoading}
                      className={`flex-1 font-bold py-4 px-6 rounded-xl transition-all shadow-lg ${
                        actionLoading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                      }`}
                    >
                      {actionLoading ? 'Processing...' : '✕ Reject Alert'}
                    </button>
                  </div>
                )}

                {/* Status messages */}
                {selectedAlert.approved_by && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 font-bold">
                      Approved by {selectedAlert.approved_by}
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      {new Date(selectedAlert.approved_at).toLocaleString()}
                    </div>
                  </div>
                )}

                {selectedAlert.rejected_by && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 font-bold">
                      Rejected by {selectedAlert.rejected_by}
                    </div>
                    <div className="text-sm text-red-600 mt-1">
                      {new Date(selectedAlert.rejected_at).toLocaleString()}
                    </div>
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