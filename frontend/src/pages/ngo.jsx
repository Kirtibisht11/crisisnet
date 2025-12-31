import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { MapPin, Shield, Users, X, CheckCircle, Clock, AlertCircle, Droplets, Flame, Activity, Mountain, RefreshCw, TrendingUp } from 'lucide-react';

// Helper functions
const getRequiredResources = (type) => {
  const map = {
    'flood': ['Food', 'Shelter', 'Medical', 'Boats'],
    'fire': ['Medical', 'Shelter', 'Water'],
    'medical': ['Medical', 'Transport', 'PPE'],
    'landslide': ['Shelter', 'Excavators', 'Food'],
    'earthquake': ['Search & Rescue', 'Medical', 'Shelter'],
    'violence': ['Security', 'Medical']
  };
  const key = type?.toLowerCase().split(' ')[0];
  return map[key] || ['General Aid', 'Volunteers'];
};

const calculateSeverity = (trust) => {
  if (trust >= 0.8) return 'HIGH';
  if (trust >= 0.5) return 'MEDIUM';
  return 'LOW';
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NGO = () => {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [activeCrises, setActiveCrises] = useState([]);
  const [acceptedTasks, setAcceptedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrisis, setSelectedCrisis] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/alerts');
      const data = await res.json();
      const alerts = data.alerts || [];
      
      // Filter verified alerts
      const verified = alerts.filter(a => a.decision === 'VERIFIED');

      // Get accepted IDs from local storage
      const acceptedIds = JSON.parse(localStorage.getItem('ngo_accepted_ids') || '[]');

      // Map to view model
      const mappedCrises = verified.map(a => ({
        id: a.alert_id,
        type: a.crisis_type.charAt(0).toUpperCase() + a.crisis_type.slice(1),
        location: a.location || (a.lat ? `${a.lat.toFixed(4)}, ${a.lon.toFixed(4)}` : 'Unknown Location'),
        severity: calculateSeverity(a.trust_score),
        resources: getRequiredResources(a.crisis_type),
        trust: a.trust_score,
        description: a.message,
        sources: a.cross_verification?.sources || 1,
        timestamp: formatTimeAgo(a.timestamp),
        affectedCount: 'Unknown',
        rawTimestamp: a.timestamp
      })).sort((a, b) => new Date(b.rawTimestamp) - new Date(a.rawTimestamp));

      const active = mappedCrises.filter(c => !acceptedIds.includes(c.id));
      const accepted = mappedCrises.filter(c => acceptedIds.includes(c.id)).map(c => ({
        ...c,
        status: 'active',
        acceptedAt: new Date().toISOString().split('T')[0]
      }));

      setActiveCrises(active);
      setAcceptedTasks(accepted);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCrisis = async (crisis) => {
    try {
      // Persist to localStorage
      const acceptedIds = JSON.parse(localStorage.getItem('ngo_accepted_ids') || '[]');
      if (!acceptedIds.includes(crisis.id)) {
        acceptedIds.push(crisis.id);
        localStorage.setItem('ngo_accepted_ids', JSON.stringify(acceptedIds));
      }

      const newTask = {
        ...crisis,
        status: 'active',
        acceptedAt: new Date().toISOString().split('T')[0]
      };
      setAcceptedTasks([newTask, ...acceptedTasks]);
      setActiveCrises(activeCrises.filter(c => c.id !== crisis.id));
      setSelectedCrisis(null);
    } catch (error) {
      console.error('Failed to accept crisis:', error);
    }
  };

  const getCrisisIcon = (type) => {
    const icons = {
      'Flood': Droplets,
      'Fire': Flame,
      'Medical Emergency': Activity,
      'Medical': Activity,
      'Landslide': Mountain
    };
    const key = Object.keys(icons).find(k => type?.includes(k)) || 'Other';
    const Icon = icons[key] || AlertCircle;
    return <Icon className="w-5 h-5" />;
  };

  const getSeverityColor = (severity) => {
    return severity === 'HIGH' 
      ? { bg: '#FEE2E2', border: '#FECACA', text: '#DC2626', badge: '#DC2626' } 
      : severity === 'MEDIUM' 
      ? { bg: '#FEF3C7', border: '#FDE68A', text: '#F59E0B', badge: '#F59E0B' } 
      : { bg: '#D1FAE5', border: '#A7F3D0', text: '#10B981', badge: '#10B981' };
  };

  const getTrustBadge = (trust) => {
    const percentage = trust * 100;
    if (percentage >= 90) return { label: 'Verified', color: '#10B981' };
    if (percentage >= 70) return { label: 'High', color: '#3B82F6' };
    if (percentage >= 50) return { label: 'Medium', color: '#F59E0B' };
    return { label: 'Low', color: '#EF4444' };
  };

  const highPriorityCrises = activeCrises.filter(c => c.severity === 'HIGH').length;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header - Homepage Style */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CN</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1F2937]">Relief Force International</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
                  <span className="text-sm text-[#6B7280]">Active & Monitoring</span>
                </div>
              </div>
            </div>
            <button 
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1F2937] hover:bg-[#F8F9FA] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Feed
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Summary Cards - Homepage Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#DBEAFE] rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#2563EB]" />
              </div>
              <div>
                <div className="text-[32px] font-bold text-[#1F2937] leading-none mb-1">
                  {activeCrises.length}
                </div>
                <div className="text-sm text-[#6B7280]">Active Crises</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#FEE2E2] rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#DC2626]" />
              </div>
              <div>
                <div className="text-[32px] font-bold text-[#1F2937] leading-none mb-1">
                  {highPriorityCrises}
                </div>
                <div className="text-sm text-[#6B7280]">High Priority</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#D1FAE5] rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <div className="text-[32px] font-bold text-[#1F2937] leading-none mb-1">
                  {acceptedTasks.length}
                </div>
                <div className="text-sm text-[#6B7280]">Accepted Tasks</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Crisis Feed */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1F2937] mb-1">Available Crises</h2>
              <p className="text-[15px] text-[#6B7280]">Review and accept crises that match your capabilities</p>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-3 border-[#E5E7EB] border-t-[#2563EB] rounded-full animate-spin"></div>
                <p className="mt-4 text-[#6B7280]">Loading crises...</p>
              </div>
            ) : activeCrises.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
                <CheckCircle className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
                <p className="text-[#6B7280] font-medium">No active crises at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeCrises.map((crisis) => {
                  const severityColors = getSeverityColor(crisis.severity);
                  const trustBadge = getTrustBadge(crisis.trust);
                  
                  return (
                    <div
                      key={crisis.id}
                      onClick={() => setSelectedCrisis(crisis)}
                      className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-lg hover:border-[#2563EB] transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide"
                          style={{ backgroundColor: severityColors.bg, color: severityColors.text }}
                        >
                          {crisis.severity}
                        </div>
                        <div className="text-[13px] font-semibold" style={{ color: trustBadge.color }}>
                          {trustBadge.label} Trust
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-[#1F2937] mb-3">{crisis.type}</h3>
                      <p className="text-[15px] text-[#6B7280] leading-relaxed mb-4">{crisis.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                          <MapPin className="w-4 h-4" />
                          <span>{crisis.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                          <Users className="w-4 h-4" />
                          <span>{crisis.affectedCount} affected</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                          <Clock className="w-4 h-4" />
                          <span>{crisis.timestamp}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {crisis.resources.map((resource, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-[#F3F4F6] text-[#4B5563] text-[13px] font-medium rounded-md">
                            {resource}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Accepted Tasks Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#1F2937] mb-1">Your Active Responses</h2>
              <div className="text-sm text-[#6B7280] mb-5">
                {acceptedTasks.length} ongoing {acceptedTasks.length === 1 ? 'task' : 'tasks'}
              </div>

              {acceptedTasks.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
                  <p className="text-[15px] font-semibold text-[#6B7280] mb-1">No active responses yet</p>
                  <p className="text-[13px] text-[#9CA3AF]">Accept crises to start coordinating</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {acceptedTasks.map(task => (
                    <div key={task.id} className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg hover:bg-white hover:shadow-sm transition-all">
                      <div className="mb-2">
                        <span className="px-2.5 py-1 bg-[#DBEAFE] text-[#2563EB] text-[11px] font-semibold rounded uppercase tracking-wide">
                          {task.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#1F2937] mb-2">{task.type}</h4>
                      <p className="flex items-center gap-1.5 text-[13px] text-[#6B7280] mb-3">
                        <MapPin className="w-3.5 h-3.5" />
                        {task.location}
                      </p>
                      <button className="w-full py-2 px-3 bg-white border border-[#E5E7EB] text-[13px] font-medium text-[#1F2937] rounded-md hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] transition-all">
                        Mark Complete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal - Homepage Style */}
      {selectedCrisis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCrisis(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#E5E7EB] px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-[22px] font-bold text-[#1F2937]">{selectedCrisis.type}</h2>
              <button 
                onClick={() => setSelectedCrisis(null)}
                className="p-1.5 hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-[#6B7280]" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-3">
                <div 
                  className="px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide"
                  style={{ 
                    backgroundColor: getSeverityColor(selectedCrisis.severity).bg, 
                    color: getSeverityColor(selectedCrisis.severity).text 
                  }}
                >
                  {selectedCrisis.severity} PRIORITY
                </div>
                <div 
                  className="text-[13px] font-semibold"
                  style={{ color: getTrustBadge(selectedCrisis.trust).color }}
                >
                  Trust Score: {Math.round(selectedCrisis.trust * 100)}%
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Description</h3>
                <p className="text-[15px] text-[#1F2937] leading-relaxed">{selectedCrisis.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Location</h3>
                <p className="text-[15px] text-[#1F2937]">{selectedCrisis.location}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Required Resources</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCrisis.resources.map((resource, idx) => (
                    <span key={idx} className="px-4 py-2 bg-[#F3F4F6] text-[#4B5563] text-[15px] font-medium rounded-md">
                      {resource}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-3 items-center">
                  <Users className="w-5 h-5 text-[#6B7280]" />
                  <div>
                    <div className="text-lg font-bold text-[#1F2937]">{selectedCrisis.affectedCount}</div>
                    <div className="text-[13px] text-[#6B7280]">People Affected</div>
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <Clock className="w-5 h-5 text-[#6B7280]" />
                  <div>
                    <div className="text-lg font-bold text-[#1F2937]">{selectedCrisis.timestamp}</div>
                    <div className="text-[13px] text-[#6B7280]">Reported</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-[#E5E7EB]">
              <button
                onClick={() => setSelectedCrisis(null)}
                className="flex-1 px-6 py-3 bg-white border border-[#E5E7EB] text-[15px] font-semibold text-[#6B7280] rounded-lg hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Decline
              </button>
              <button
                onClick={() => handleAcceptCrisis(selectedCrisis)}
                className="flex-2 px-6 py-3 bg-[#EA580C] text-white text-[15px] font-semibold rounded-lg hover:bg-[#DC2626] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle className="w-5 h-5" />
                Accept & Respond 
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGO;