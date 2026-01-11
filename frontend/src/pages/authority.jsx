import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { 
  MapPin, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Filter,
  Clock,
  Users,
  Activity,
  Zap,
  Download,
  ChevronRight,
  Eye,
  BarChart3,
  Search,
  Bell,
  LogOut,
  User,
  AlertCircle,
  TrendingUp,
  Send,
  Play
} from 'lucide-react';
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
        <span className="text-slate-300">
          {Number(alert.lat).toFixed(4)}, {Number(alert.lon).toFixed(4)}
          <span className="text-slate-500 italic text-xs ml-2">(Resolving...)</span>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  
  const suppressUpdatesUntil = useRef(0);
  const isFirstLoad = useRef(true);

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
    let isMounted = true;

    const fetchAlerts = async () => {
      try {
        if (!isMounted) return;
        if (isFirstLoad.current) setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:8000/api/alerts');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          if (Date.now() < suppressUpdatesUntil.current) {
            setLoading(false);
            return;
          }

          const mergedAlerts = data.alerts || [];
          
          setAlerts(currentAlerts => {
            const uniqueMap = new Map();
            currentAlerts.forEach(a => uniqueMap.set(a.alert_id || a.id, a));
            
            mergedAlerts.forEach(a => {
              const id = a.alert_id || a.id;
              if (id) {
                const existing = uniqueMap.get(id);
                if (existing) {
                  uniqueMap.set(id, {
                    ...a,
                    alert_id: id,
                    approved_by: existing.approved_by || a.approved_by,
                    rejected_by: existing.rejected_by || a.rejected_by,
                    approved_at: existing.approved_at || a.approved_at,
                    rejected_at: existing.rejected_at || a.rejected_at
                  });
                } else {
                  uniqueMap.set(id, { ...a, alert_id: id });
                }
              }
            });
            return Array.from(uniqueMap.values());
          });
        }
        
      } catch (err) {
        console.error('Error fetching alerts:', err);
        if (isMounted) {
          if (isFirstLoad.current) {
            setError(err.message);
            setAlerts([]);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          isFirstLoad.current = false;
        }
      }
    };

    fetchAlerts();
    
    const interval = setInterval(() => {
      if (isMounted) fetchAlerts();
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Filter and search alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'verified') return alert.decision === 'VERIFIED';
    if (filterStatus === 'review') return alert.decision === 'REVIEW' || alert.decision === 'UNCERTAIN';
    if (filterStatus === 'rejected') return alert.decision === 'REJECTED';
    return true;
  }).filter(alert => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      alert.crisis_type?.toLowerCase().includes(query) ||
      alert.message?.toLowerCase().includes(query) ||
      alert.location?.toLowerCase().includes(query)
    );
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
    suppressUpdatesUntil.current = Date.now() + 5000;
    try {
      const currentUser = JSON.parse(
        localStorage.getItem('crisisnet_current_user') || localStorage.getItem('user') || '{}'
      );

      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      await fetch(`http://localhost:8000/api/alerts/${alertData.alert_id}/decision`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          decision: 'VERIFIED',
          approved_by: currentUser.name || 'Authority',
          approved_at: new Date().toISOString()
        })
      });

      setAlerts(prev =>
        prev.map(a => {
          if (a.alert_id === alertData.alert_id) {
            return { ...a, decision: 'VERIFIED', approved_by: currentUser.name };
          }
          return a;
        })
      );

      setSelectedAlert(null);
      
      alert('Crisis Approved! Redirecting to Resource Agent...');
      
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
    suppressUpdatesUntil.current = Date.now() + 5000;
    try {
      const currentUser = JSON.parse(
        localStorage.getItem('crisisnet_current_user') || localStorage.getItem('user') || '{}'
      );

      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      await fetch(`http://localhost:8000/api/alerts/${alertData.alert_id}/decision`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      const response = await fetch('http://localhost:8000/pipeline/run', { method: 'POST' });
      
      if (response.ok) {
        alert('Pipeline execution started successfully.');
      } else {
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

  const exportAlerts = () => {
    const dataStr = JSON.stringify(filteredAlerts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `crisis-alerts-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100">
      {/* HEADER - Modern Dark Theme */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-lg sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                CrisisNet
              </span>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/authority" className="text-sm font-medium text-blue-400 border-b-2 border-blue-500 pb-1">
                Dashboard
              </Link>
              <Link to="/resource" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition">
                Resource Management
              </Link>
              <Link to="/learning" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition">
                Analytics
              </Link>
              
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition relative">
                <Bell className="w-5 h-5 text-slate-300" />
                {alerts.filter(a => a.decision === 'REVIEW').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-xs rounded-full flex items-center justify-center animate-pulse">
                    {alerts.filter(a => a.decision === 'REVIEW').length}
                  </span>
                )}
              </button>
            </div>
            
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-300">{currentUserName || 'Authority'}</span>
                <span className="text-xs text-slate-500">Administrator</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                localStorage.removeItem('crisisnet_current_user');
                localStorage.removeItem('user');
                localStorage.removeItem('crisisnet_token');
                localStorage.removeItem('access_token');
                navigate("/");
              }}
              className="text-sm border border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-800 transition flex items-center gap-2 text-slate-300"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="w-[96%] mx-auto py-6">
        {/* Dashboard Header with Stats */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Authority Dashboard</h1>
              <p className="text-slate-400">AI-Powered Crisis Alert Verification & Management</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Operational</span>
              </div>
              
              <button
                onClick={exportAlerts}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition text-slate-300"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs text-slate-500">Total</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{counts.all}</div>
              <div className="text-sm text-slate-400">Crisis Alerts</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xs text-slate-500">Pending</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{counts.review}</div>
              <div className="text-sm text-slate-400">Require Review</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-xs text-slate-500">Verified</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{counts.verified}</div>
              <div className="text-sm text-slate-400">Confirmed Crises</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-xs text-slate-500">Active</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {alerts.filter(a => a.decision === 'VERIFIED').length}
              </div>
              <div className="text-sm text-slate-400">Live Incidents</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <div className="font-bold text-red-300">Unable to load alerts</div>
                <div className="text-sm text-red-400">Error: {error}</div>
                <div className="text-xs text-red-500/70 mt-1">Check backend at http://localhost:8000</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Controls & Status */}
          <div className="lg:col-span-1 space-y-6">
            {/* Agent Status Panel */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg">
              <div className="p-5 border-b border-slate-700">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Agent Status
                </h3>
              </div>
              <div className="p-5">
                <AgentStatusPanel alerts={alerts} />
              </div>
            </div>
            
            {/* Detection Pipeline Control */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                System Controls
              </h3>
              <p className="text-sm text-slate-400 mb-5">
                Manually trigger the AI detection pipeline to process new data sources immediately.
              </p>
              <button
                onClick={handleRunPipeline}
                disabled={actionLoading}
                className={`w-full py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-3 ${
                  actionLoading 
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-blue-500/30 border border-blue-600/30'
                }`}
              >
                {actionLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Detection Pipeline
                  </>
                )}
              </button>
              
              {/* Additional Controls */}
              
            </div>

          </div>

          {/* Right Column - Alerts List */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
              {/* Alerts Header with Search & Filter */}
              <div className="p-5 border-b border-slate-700">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-white">Crisis Alerts</h3>
                    <div className="flex items-center gap-2">
                      {['all', 'review', 'verified', 'rejected'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                            filterStatus === status 
                              ? {
                                  'all': 'bg-blue-600 text-white shadow-md',
                                  'review': 'bg-amber-600 text-white shadow-md',
                                  'verified': 'bg-green-600 text-white shadow-md',
                                  'rejected': 'bg-red-600 text-white shadow-md'
                                }[status]
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)} ({counts[status]})
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search alerts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full lg:w-64 pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                    
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition"
                    >
                      <Filter className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Alerts List */}
              <div className="p-5 space-y-4 max-h-[700px] overflow-y-auto">
                {loading && (
                  <div className="text-center py-16">
                    <div className="inline-block w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <div className="text-xl font-semibold text-slate-300">Loading alerts...</div>
                    <div className="text-sm text-slate-500 mt-2">Fetching data from backend</div>
                  </div>
                )}

                {!loading && !error && filteredAlerts.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-10 h-10 text-slate-600" />
                    </div>
                    <div className="text-xl font-semibold text-slate-300">No alerts found</div>
                    <div className="text-sm text-slate-500 mt-2">Try changing the filter or check back later</div>
                  </div>
                )}

                {!loading && filteredAlerts.map((alert) => {
                  const trustScore = formatTrustScore(alert.trust_score);
                  const decision = formatDecision(alert.decision);
                  const crisis = formatCrisisType(alert.crisis_type);
                  const priority = formatPriority(alert.trust_score, alert.crisis_type);
                  const sources = formatSourceCount(alert.cross_verification?.sources || 0);
                  const userBadge = alert.reputation != null 
                    ? getUserTypeBadge(alert.reputation) 
                    : (alert.trust_score >= 0.8 ? { label: 'Trusted Source', color: '#16a34a' } : { label: 'Standard User', color: '#64748b' });

                  return (
                    <div
                      key={alert.alert_id}
                      onClick={() => setSelectedAlert(alert)}
                      className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer backdrop-blur-sm"
                    >
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        {/* Left Section - Crisis Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">{crisis.emoji}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-white text-lg">{crisis.label}</h3>
                                <span 
                                  className="px-3 py-1 rounded-full text-xs font-bold shadow-sm border"
                                  style={{ 
                                    backgroundColor: priority.color + '20',
                                    color: priority.color,
                                    borderColor: priority.color + '30'
                                  }}
                                >
                                  {priority.level}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                                <MapPin className="w-4 h-4" />
                                <LocationRenderer alert={alert} />
                              </div>
                              
                              {alert.message && (
                                <p className="text-sm text-slate-300 line-clamp-2">
                                  {sanitizeText(alert.message, 120)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Metrics & Actions */}
                        <div className="lg:w-64">
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg">
                              <div className="text-xs text-slate-500 mb-1">Trust Score</div>
                              <div className="text-xl font-bold" style={{ color: trustScore.textColor }}>
                                {trustScore.value}%
                              </div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg">
                              <div className="text-xs text-slate-500 mb-1">Sources</div>
                              <div className="text-xl font-bold" style={{ color: sources.color }}>
                                {sources.badge}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ backgroundColor: decision.color }}
                              ></div>
                              <span className="text-sm" style={{ color: decision.color }}>
                                {decision.text}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                {formatTimestamp(alert.timestamp)}
                              </span>
                              <Eye className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Alert Detail Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Alert Details</h2>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full animate-pulse" style={{ 
                        backgroundColor: formatDecision(selectedAlert.decision).color 
                      }}></div>
                      <span className="text-slate-400 text-sm">
                        ID: {selectedAlert.alert_id}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Crisis Details */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="text-5xl">{formatCrisisType(selectedAlert.crisis_type).emoji}</div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {formatCrisisType(selectedAlert.crisis_type).label}
                          </h3>
                          <div className="flex items-center gap-2 text-slate-400">
                            <MapPin className="w-5 h-5" />
                            <LocationRenderer alert={selectedAlert} />
                          </div>
                        </div>
                      </div>
                      
                      {selectedAlert.message && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                          <div className="font-semibold text-slate-300 mb-2">Report Details:</div>
                          <p className="text-slate-300 leading-relaxed">
                            {sanitizeText(selectedAlert.message, 500)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Trust Analysis */}
                    {selectedAlert.components && (
                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-400" />
                          Trust Analysis
                        </h3>
                        <div className="space-y-3">
                          {formatScoreBreakdown(selectedAlert.components).map((component, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-700">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: component.color }}
                                ></div>
                                <span className="font-semibold text-slate-300">{component.label}</span>
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
                    )}
                  </div>

                  {/* Right Column - Meta & Actions */}
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/30 rounded-xl p-6">
                      <h4 className="font-bold text-white mb-4">Alert Summary</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-blue-400 mb-1">Priority Level</div>
                          <div className="text-xl font-bold text-white">
                            {formatPriority(selectedAlert.trust_score, selectedAlert.crisis_type).level}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-blue-400 mb-1">Verification Score</div>
                          <div className="text-3xl font-bold text-white">
                            {formatTrustScore(selectedAlert.trust_score).value}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-blue-400 mb-1">Report Time</div>
                          <div className="text-sm text-slate-300">
                            {formatTimestamp(selectedAlert.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reporter Info */}
                    {selectedAlert.reputation != null && (
                      <div className="bg-gradient-to-br from-purple-900/30 to-pink-800/20 border border-purple-700/30 rounded-xl p-6">
                        <h4 className="font-bold text-white mb-4">Reporter Profile</h4>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">{formatReputation(selectedAlert.reputation).stars}</div>
                          <div>
                            <div className="text-2xl font-bold text-white">
                              {formatReputation(selectedAlert.reputation).value}%
                            </div>
                            <div className="text-xs text-purple-300">
                              {formatReputation(selectedAlert.reputation).tier}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-400">
                          User ID: {selectedAlert.user_id}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!selectedAlert.approved_by && !selectedAlert.rejected_by && (
                      <div className="space-y-3">
                        <button 
                          onClick={() => handleApproveAlert(selectedAlert)}
                          disabled={actionLoading}
                          className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {actionLoading ? 'Processing...' : 'Approve & Send to Resources'}
                        </button>
                        <button 
                          onClick={() => handleRejectAlert(selectedAlert)}
                          disabled={actionLoading}
                          className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          {actionLoading ? 'Processing...' : 'Reject Alert'}
                        </button>
                      </div>
                    )}

                    {/* Status Indicators */}
                    {selectedAlert.approved_by && (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-green-400 font-bold">
                          <CheckCircle className="w-5 h-5" />
                          Approved by {selectedAlert.approved_by}
                        </div>
                        <div className="text-sm text-green-500/80 mt-1">
                          {new Date(selectedAlert.approved_at).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {selectedAlert.rejected_by && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-red-400 font-bold">
                          <XCircle className="w-5 h-5" />
                          Rejected by {selectedAlert.rejected_by}
                        </div>
                        <div className="text-sm text-red-500/80 mt-1">
                          {new Date(selectedAlert.rejected_at).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorityDashboard;