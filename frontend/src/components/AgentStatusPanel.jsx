import { useState, useEffect } from "react";
import { Brain, TrendingUp, Users, Activity, AlertTriangle, CheckCircle, XCircle, Zap, Cpu, Shield } from 'lucide-react';
import { subscribe } from "../services/socket";

const AgentStatusPanel = ({ alerts }) => {
  const [liveAlerts, setLiveAlerts] = useState(alerts || []);
  const [learningStatus, setLearningStatus] = useState(null);
  const [systemPerformance, setSystemPerformance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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
        // Mock data for demo
        setLearningStatus({
          status: 'active',
          last_trained: new Date().toISOString(),
          model_version: 'v2.1.4'
        });
        setSystemPerformance({
          health_status: 'healthy',
          performance_grade: 'A - Excellent',
          overall_success_rate: 94.2,
          active_volunteers: 24,
          total_tasks: 156,
          accuracy: 92.5,
          false_positives: 2.1
        });
      }
    };

    fetchLearningStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLearningStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
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
    if (status === 'warning') return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'text-slate-400';
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade.startsWith('B')) return 'text-blue-400';
    if (grade.startsWith('C')) return 'text-amber-400';
    return 'text-red-400';
  };

  const getGradeBgColor = (grade) => {
    if (!grade) return 'bg-slate-700';
    if (grade.startsWith('A')) return 'bg-green-500/10';
    if (grade.startsWith('B')) return 'bg-blue-500/10';
    if (grade.startsWith('C')) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              AI Agent Status
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Real-time system monitoring and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-green-400">LIVE</span>
          </div>
        </div>

        {/* Time Stamp */}
        <div className="mb-4 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Last Updated</span>
            <span className="text-slate-300 font-mono">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 gap-4">
          {/* Trust Agent */}
          <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-700/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Trust Agent</h4>
                  <p className="text-xs text-blue-400">Confidence Assessment</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                Active
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-white mb-1">{avgTrustScore}%</div>
                <div className="text-xs text-slate-400">
                  Avg Trust Score • {liveAlerts.length} alert{liveAlerts.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-blue-400">Accuracy</div>
                <div className="text-xs text-slate-400">Continuous</div>
              </div>
            </div>
          </div>

          {/* Learning Agent */}
          {systemPerformance && (
            <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 border border-purple-700/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Learning Agent</h4>
                    <p className="text-xs text-purple-400">Adaptive Intelligence</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getHealthColor(systemPerformance.health_status)}`}></div>
                  <span className="text-xs text-slate-400 capitalize">{systemPerformance.health_status}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={`text-3xl font-bold mb-1 ${getGradeColor(systemPerformance.performance_grade)}`}>
                    {systemPerformance.performance_grade?.split(' - ')[0] || 'N/A'}
                  </div>
                  <div className="text-xs text-slate-400">Performance Grade</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {systemPerformance.overall_success_rate?.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400">Success Rate</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Breakdown */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Alert Distribution
        </h3>
        
        <div className="space-y-3">
          {/* Verified Alerts */}
          <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl hover:border-green-500/40 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Verified</div>
                <div className="text-xs text-green-400">Ready for action</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{verifiedCount}</div>
              <div className="text-xs text-green-400">≥ 65% trust</div>
            </div>
          </div>

          {/* Review Alerts */}
          <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:border-amber-500/40 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Review Required</div>
                <div className="text-xs text-amber-400">Manual assessment</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{reviewCount}</div>
              <div className="text-xs text-amber-400">40-64% trust</div>
            </div>
          </div>

          {/* Rejected Alerts */}
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl hover:border-red-500/40 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Rejected</div>
                <div className="text-xs text-red-400">Likely false signals</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{rejectedCount}</div>
              <div className="text-xs text-red-400">&lt; 40% trust</div>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Total Processed</span>
            <span className="text-white font-semibold">
              {verifiedCount + reviewCount + rejectedCount} alerts
            </span>
          </div>
        </div>
      </div>

      {/* System Performance */}
      {systemPerformance && (
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-700/30 rounded-xl p-5 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            System Performance
          </h3>
          
          <div className="space-y-4">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-1">Active Volunteers</div>
                <div className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  {systemPerformance.active_volunteers}
                </div>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-1">Total Tasks</div>
                <div className="text-xl font-bold text-white">
                  {systemPerformance.total_tasks}
                </div>
              </div>
            </div>

            {/* Accuracy Metrics */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-white">Model Accuracy</div>
                <div className="text-xs font-semibold text-green-400">
                  {systemPerformance.accuracy?.toFixed(1)}%
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${systemPerformance.accuracy || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Insights</h4>
              
              <div className="space-y-2">
                {systemPerformance.overall_success_rate >= 90 && (
                  <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm text-white">Excellent Performance</div>
                      <div className="text-xs text-green-400">
                        System operating at peak efficiency
                      </div>
                    </div>
                  </div>
                )}
                
                {systemPerformance.false_positives < 5 && (
                  <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <Zap className="w-3 h-3 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-white">Low False Positives</div>
                      <div className="text-xs text-blue-400">
                        Only {systemPerformance.false_positives?.toFixed(1)}% false alerts
                      </div>
                    </div>
                  </div>
                )}
                
                {reviewCount > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="w-5 h-5 bg-amber-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm text-white">Pending Review</div>
                      <div className="text-xs text-amber-400">
                        {reviewCount} alert{reviewCount !== 1 ? 's' : ''} require manual assessment
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Version Info */}
            {learningStatus && (
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-slate-400">Model Version</div>
                  <div className="text-slate-300 font-mono">
                    {learningStatus.model_version || 'v2.1.4'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Add missing Clock component import
const Clock = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export default AgentStatusPanel;