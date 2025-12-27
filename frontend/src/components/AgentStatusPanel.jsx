import { useState, useEffect } from 'react';
import { formatTimestamp, formatNumber } from '../utils/formatter';

const AgentStatusPanel = ({ alerts = [] }) => {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    verifiedAlerts: 0,
    pendingReview: 0,
    rejectedAlerts: 0,
    avgTrustScore: 0,
    uniqueUsers: 0
  });

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const verified = alerts.filter(a => a.decision === 'VERIFIED').length;
      const review = alerts.filter(a => a.decision === 'REVIEW').length;
      const rejected = alerts.filter(a => a.decision === 'REJECTED' || a.decision === 'UNCERTAIN').length;
      
      const totalScore = alerts.reduce((sum, a) => sum + (parseFloat(a.trust_score) || 0), 0);
      const avgScore = alerts.length > 0 ? totalScore / alerts.length : 0;
      
      const uniqueUsers = new Set(alerts.map(a => a.user_id)).size;

      setStats({
        totalAlerts: alerts.length,
        verifiedAlerts: verified,
        pendingReview: review,
        rejectedAlerts: rejected,
        avgTrustScore: avgScore,
        uniqueUsers: uniqueUsers
      });
    }
  }, [alerts]);

  const agents = [
    { 
      name: 'Detection Agent', 
      status: 'active',
      color: 'blue',
      description: 'Monitoring crisis signals'
    },
    { 
      name: 'Trust Agent', 
      status: 'active',
      color: 'purple',
      description: 'Verifying alert authenticity'
    },
    { 
      name: 'Resource Agent', 
      status: 'active',
      color: 'green',
      description: 'Matching resources'
    },
    { 
      name: 'Communication Agent', 
      status: 'active',
      color: 'orange',
      description: 'Broadcasting alerts'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500',
      idle: 'bg-yellow-500',
      error: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        System Status
      </h2>
      
      {/* System Health Indicator */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
            </div>
            <div>
              <span className="font-bold text-green-700 text-lg">All Systems Operational</span>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            {formatTimestamp(new Date().toISOString())}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{formatNumber(stats.totalAlerts)}</div>
          <div className="text-sm text-blue-700 font-medium">Total Alerts</div>
          <div className="text-xs text-blue-600 mt-1">{stats.uniqueUsers} unique users</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-3xl font-bold text-green-600">{formatNumber(stats.verifiedAlerts)}</div>
          <div className="text-sm text-green-700 font-medium">Verified</div>
          <div className="text-xs text-green-600 mt-1">
            {stats.totalAlerts > 0 ? ((stats.verifiedAlerts / stats.totalAlerts) * 100).toFixed(0) : 0}% rate
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <div className="text-3xl font-bold text-yellow-600">{formatNumber(stats.pendingReview)}</div>
          <div className="text-sm text-yellow-700 font-medium">Needs Review</div>
          <div className="text-xs text-yellow-600 mt-1">Requires attention</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="text-3xl font-bold text-purple-600">
            {(stats.avgTrustScore * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-purple-700 font-medium">Avg Trust Score</div>
          <div className="text-xs text-purple-600 mt-1">System confidence</div>
        </div>
      </div>

      {/* Agent Status Cards */}
      <div className="space-y-3 mb-6">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          AI Agent Status
        </h3>
        
        {agents.map((agent, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              
              <div>
                <div className="font-semibold text-gray-800">{agent.name}</div>
                <div className="text-sm text-gray-600">{agent.description}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-full ${getStatusColor(agent.status)} bg-opacity-20 border-2 ${getStatusColor(agent.status)} border-opacity-50 flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                <span className={`text-sm font-bold capitalize ${getStatusColor(agent.status).replace('bg-', 'text-')}`}>
                  {agent.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Configuration */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
          Trust Configuration
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white bg-opacity-50 p-2 rounded">
            <span className="text-gray-600">Auto-Verify:</span>
            <span className="font-bold text-green-600 ml-2">≥65%</span>
          </div>
          <div className="bg-white bg-opacity-50 p-2 rounded">
            <span className="text-gray-600">Needs Review:</span>
            <span className="font-bold text-yellow-600 ml-2">≥45%</span>
          </div>
          <div className="bg-white bg-opacity-50 p-2 rounded">
            <span className="text-gray-600">Reject:</span>
            <span className="font-bold text-red-600 ml-2">&lt;30%</span>
          </div>
          <div className="bg-white bg-opacity-50 p-2 rounded">
            <span className="text-gray-600">Min Sources:</span>
            <span className="font-bold text-blue-600 ml-2">2</span>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        <div>CrisisNet v1.0</div>
        <div className="mt-1">Trust Verification</div>
      </div>
    </div>
  );
};

export default AgentStatusPanel;