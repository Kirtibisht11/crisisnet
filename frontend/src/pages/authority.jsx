import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ---------------- Fetch Alerts ---------------- */
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('http://localhost:8000/api/alerts');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setAlerts(data.alerts || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------- Filters ---------------- */
  const filteredAlerts = alerts.filter(a => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'verified') return a.decision === 'VERIFIED';
    if (filterStatus === 'review') return a.decision === 'REVIEW';
    if (filterStatus === 'rejected') {
      return a.decision === 'REJECTED' || a.decision === 'UNCERTAIN';
    }
    return true;
  });

  const counts = {
    all: alerts.length,
    verified: alerts.filter(a => a.decision === 'VERIFIED').length,
    review: alerts.filter(a => a.decision === 'REVIEW').length,
    rejected: alerts.filter(a =>
      a.decision === 'REJECTED' || a.decision === 'UNCERTAIN'
    ).length
  };

  /* ---------------- Actions ---------------- */
  const handleApproveAlert = async (alert) => {
    if (!window.confirm('Approve this alert?')) return;
    setActionLoading(true);

    try {
      const user = JSON.parse(
        localStorage.getItem('crisisnet_current_user') || '{}'
      );

      const approved = {
        ...alert,
        approved_by: user.name || 'Authority',
        approved_at: new Date().toISOString(),
        decision: 'VERIFIED',
        crisis_status: 'APPROVED'
      };

      setAlerts(prev =>
        prev.map(a => a.alert_id === alert.alert_id ? approved : a)
      );

      const stored = JSON.parse(
        localStorage.getItem('approved_crises') || '[]'
      );
      stored.push(approved);
      localStorage.setItem('approved_crises', JSON.stringify(stored));

      setSelectedAlert(null);
      navigate('/resource');
    } catch (e) {
      console.error(e);
      alert('Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAlert = async (alert) => {
    if (!window.confirm('Reject this alert?')) return;
    setActionLoading(true);

    try {
      const user = JSON.parse(
        localStorage.getItem('crisisnet_current_user') || '{}'
      );

      const rejected = {
        ...alert,
        rejected_by: user.name || 'Authority',
        rejected_at: new Date().toISOString(),
        decision: 'REJECTED'
      };

      setAlerts(prev =>
        prev.map(a => a.alert_id === alert.alert_id ? rejected : a)
      );

      setSelectedAlert(null);
    } catch (e) {
      console.error(e);
      alert('Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold mb-6">Authority Dashboard</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            Error loading alerts: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AgentStatusPanel alerts={alerts} />

          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow">
            <div className="flex gap-2 mb-4">
              {['all','verified','review','rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded ${
                    filterStatus === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  {s.toUpperCase()} ({counts[s]})
                </button>
              ))}
            </div>

            {loading && <p>Loading alerts…</p>}

            {!loading && filteredAlerts.map(alert => {
              const trust = formatTrustScore(alert.trust_score);
              const decision = formatDecision(alert.decision);
              const crisis = formatCrisisType(alert.crisis_type);

              return (
                <div
                  key={alert.alert_id}
                  className="border p-4 rounded mb-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex justify-between">
                    <h3 className="font-bold">
                      {crisis.emoji} {crisis.label}
                    </h3>
                    <span style={{ color: decision.color }}>
                      {decision.text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {sanitizeText(alert.message, 120)}
                  </p>
                  <div className="text-xs mt-2">
                    Trust: {trust.value}% • {formatTimestamp(alert.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* -------- Modal -------- */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl">
              <h2 className="text-2xl font-bold mb-4">Alert Details</h2>

              <p className="mb-4">
                {sanitizeText(selectedAlert.message)}
              </p>

              {!selectedAlert.approved_by && !selectedAlert.rejected_by && (
                <div className="flex gap-4">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApproveAlert(selectedAlert)}
                    className="flex-1 bg-green-600 text-white py-3 rounded"
                  >
                    Approve
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleRejectAlert(selectedAlert)}
                    className="flex-1 bg-red-600 text-white py-3 rounded"
                  >
                    Reject
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedAlert(null)}
                className="mt-4 text-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorityDashboard;
