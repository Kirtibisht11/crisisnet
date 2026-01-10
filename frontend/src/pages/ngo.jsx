import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { MapPin, Users, X, CheckCircle, Clock, AlertCircle, Droplets, Flame, Activity, Mountain, RefreshCw, TrendingUp } from 'lucide-react';
import api from '../services/api';

const NGO = () => {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [availCrises, setAvailCrises] = useState([]);
  const [managedCrises, setManagedCrises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState({ active: 0, highPri: 0, managed: 0 });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    fetchCrises();
    const timer = setInterval(fetchCrises, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchCrises = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      const avail = await api.get('/ngo/crises/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const managed = await api.get('/ngo/crises/managed', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const availData = avail.data.crises || avail.data || [];
      const managedData = managed.data.crises || managed.data || [];

      setAvailCrises(availData);
      setManagedCrises(managedData);

      const highCount = availData.filter(c => 
        (c.severity === 'high' || c.severity === 'HIGH') ||
        (c.trust_score && c.trust_score >= 0.7)
      ).length;

      setStats({
        active: availData.length,
        highPri: highCount,
        managed: managedData.length
      });
    } catch (err) {
      console.error('Fetch error:', err);
      
      const fallback = await fetch('http://localhost:8000/api/alerts');
      const data = await fallback.json();
      const verified = (data.alerts || []).filter(a => a.decision === 'VERIFIED');
      
      const accepted = JSON.parse(localStorage.getItem('ngo_accepted') || '[]');
      const avail = verified.filter(v => !accepted.includes(v.alert_id));
      const managed = verified.filter(v => accepted.includes(v.alert_id));
      
      setAvailCrises(avail);
      setManagedCrises(managed);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (crisis) => {
    try {
      const token = localStorage.getItem('access_token');
      
      await api.post('/ngo/crises/accept', 
        { crisis_id: crisis.id || crisis.alert_id },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );

      setSelected(null);
      fetchCrises();
    } catch (err) {
      console.error(err);
      
      const accepted = JSON.parse(localStorage.getItem('ngo_accepted') || '[]');
      accepted.push(crisis.id || crisis.alert_id);
      localStorage.setItem('ngo_accepted', JSON.stringify(accepted));
      
      setAvailCrises(availCrises.filter(c => 
        (c.id || c.alert_id) !== (crisis.id || crisis.alert_id)
      ));
      setManagedCrises([...managedCrises, crisis]);
      setSelected(null);
    }
  };

  const getSevColor = (sev) => {
    if (sev === 'HIGH' || sev === 'high') return { bg: '#FEE2E2', txt: '#DC2626' };
    if (sev === 'MEDIUM' || sev === 'medium') return { bg: '#FEF3C7', txt: '#F59E0B' };
    return { bg: '#D1FAE5', txt: '#10B981' };
  };

  const getTrustLabel = (trust) => {
    const pct = trust * 100;
    if (pct >= 90) return { label: 'Verified', color: '#10B981' };
    if (pct >= 70) return { label: 'High', color: '#3B82F6' };
    if (pct >= 50) return { label: 'Medium', color: '#F59E0B' };
    return { label: 'Low', color: '#EF4444' };
  };

  const calcSeverity = (trust) => {
    if (trust >= 0.8) return 'HIGH';
    if (trust >= 0.5) return 'MEDIUM';
    return 'LOW';
  };

  const getResources = (type) => {
    const map = {
      flood: ['Shelter', 'Food', 'Medical'],
      fire: ['Medical', 'Food'],
      medical: ['Medical', 'Transport'],
      earthquake: ['Rescue', 'Medical', 'Shelter']
    };
    return map[type?.toLowerCase()] || ['Emergency Support'];
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CN</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1F2937]">
                  {user?.ngo_name || 'Relief Force International'}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
                  <span className="text-sm text-[#6B7280]">Active & Monitoring</span>
                </div>
              </div>
            </div>
            <button 
              onClick={fetchCrises}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1F2937] hover:bg-[#F8F9FA]"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#DBEAFE] rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#2563EB]" />
              </div>
              <div>
                <div className="text-[32px] font-bold text-[#1F2937] leading-none mb-1">
                  {stats.active}
                </div>
                <div className="text-sm text-[#6B7280]">Available</div>
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
                  {stats.highPri}
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
                  {stats.managed}
                </div>
                <div className="text-sm text-[#6B7280]">Managing</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1F2937] mb-1">Available Crises</h2>
              <p className="text-[15px] text-[#6B7280]">Accept crises matching your capacity</p>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-3 border-[#E5E7EB] border-t-[#2563EB] rounded-full animate-spin"></div>
                <p className="mt-4 text-[#6B7280]">Loading...</p>
              </div>
            ) : availCrises.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
                <CheckCircle className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
                <p className="text-[#6B7280] font-medium">No crises available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availCrises.map((c) => {
                  const sev = c.severity || calcSeverity(c.trust_score || 0.5);
                  const sevCol = getSevColor(sev);
                  const trustBadge = getTrustLabel(c.trust_score || 0.5);
                  const resources = c.resources || getResources(c.crisis_type || c.type);
                  
                  return (
                    <div
                      key={c.id || c.alert_id}
                      onClick={() => setSelected(c)}
                      className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-lg hover:border-[#2563EB] transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide"
                          style={{ backgroundColor: sevCol.bg, color: sevCol.txt }}
                        >
                          {sev}
                        </div>
                        <div className="text-[13px] font-semibold" style={{ color: trustBadge.color }}>
                          {trustBadge.label}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-[#1F2937] mb-3">
                        {(c.crisis_type || c.type || 'Emergency').charAt(0).toUpperCase() + 
                         (c.crisis_type || c.type || 'Emergency').slice(1)}
                      </h3>
                      <p className="text-[15px] text-[#6B7280] leading-relaxed mb-4">
                        {c.description || c.message || 'Emergency response needed'}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                          <MapPin className="w-4 h-4" />
                          <span>{c.location || 'Location pending'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                          <Clock className="w-4 h-4" />
                          <span>{c.timestamp || 'Recent'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {resources.map((r, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-[#F3F4F6] text-[#4B5563] text-[13px] font-medium rounded-md">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#1F2937] mb-1">Managed Crises</h2>
              <div className="text-sm text-[#6B7280] mb-5">
                {managedCrises.length} {managedCrises.length === 1 ? 'crisis' : 'crises'}
              </div>

              {managedCrises.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
                  <p className="text-[15px] font-semibold text-[#6B7280] mb-1">No active responses</p>
                  <p className="text-[13px] text-[#9CA3AF]">Accept crises to begin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {managedCrises.slice(0, 5).map(t => (
                    <div key={t.id || t.alert_id} className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg hover:bg-white hover:shadow-sm transition-all">
                      <div className="mb-2">
                        <span className="px-2.5 py-1 bg-[#DBEAFE] text-[#2563EB] text-[11px] font-semibold rounded uppercase tracking-wide">
                          Active
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#1F2937] mb-2">
                        {(t.crisis_type || t.type || 'Emergency').charAt(0).toUpperCase() + 
                         (t.crisis_type || t.type || 'Emergency').slice(1)}
                      </h4>
                      <p className="flex items-center gap-1.5 text-[13px] text-[#6B7280] mb-3">
                        <MapPin className="w-3.5 h-3.5" />
                        {t.location || 'Location pending'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#E5E7EB] px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-[22px] font-bold text-[#1F2937]">
                {(selected.crisis_type || selected.type || 'Emergency').charAt(0).toUpperCase() + 
                 (selected.crisis_type || selected.type || 'Emergency').slice(1)}
              </h2>
              <button 
                onClick={() => setSelected(null)}
                className="p-1.5 hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-[#6B7280]" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-3">
                {(() => {
                  const sev = selected.severity || calcSeverity(selected.trust_score || 0.5);
                  const sevCol = getSevColor(sev);
                  return (
                    <div 
                      className="px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide"
                      style={{ backgroundColor: sevCol.bg, color: sevCol.txt }}
                    >
                      {sev}
                    </div>
                  );
                })()}
                <div 
                  className="text-[13px] font-semibold"
                  style={{ color: getTrustLabel(selected.trust_score || 0.5).color }}
                >
                  Trust: {Math.round((selected.trust_score || 0.5) * 100)}%
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Details</h3>
                <p className="text-[15px] text-[#1F2937] leading-relaxed">
                  {selected.description || selected.message || 'Emergency assistance required'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Location</h3>
                <p className="text-[15px] text-[#1F2937]">{selected.location || 'Coordinates available'}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Resources Needed</h3>
                <div className="flex flex-wrap gap-2">
                  {(selected.resources || getResources(selected.crisis_type || selected.type)).map((r, idx) => (
                    <span key={idx} className="px-4 py-2 bg-[#F3F4F6] text-[#4B5563] text-[15px] font-medium rounded-md">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-900">
                  By accepting, you commit to coordinating response for this crisis.
                </p>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAccept(selected)}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                  Accept Responsibility
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function calculateSeverity(trust) {
  if (trust >= 0.8) return 'HIGH';
  if (trust >= 0.5) return 'MEDIUM';
  return 'LOW';
}

function getRequiredResources(type) {
  const resourceMap = {
    flood: ['Shelter', 'Food', 'Medical'],
    fire: ['Medical', 'Food'],
    medical: ['Medical', 'Transport'],
    earthquake: ['Rescue', 'Medical', 'Shelter'],
    landslide: ['Rescue', 'Shelter']
  };
  return resourceMap[type?.toLowerCase()] || ['Emergency Support'];
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Recent';
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export default NGO;