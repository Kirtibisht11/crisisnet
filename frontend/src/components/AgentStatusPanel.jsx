

const AgentStatusPanel = ({ alerts }) => {
  const verifiedCount = alerts.filter(a => a.decision === 'VERIFIED').length;
  const reviewCount = alerts.filter(a => a.decision === 'REVIEW').length;
  const rejectedCount = alerts.filter(a => a.decision === 'REJECTED' || a.decision === 'UNCERTAIN').length;
  
  const avgTrustScore = alerts.length > 0 
    ? (alerts.reduce((sum, a) => sum + (a.trust_score || 0), 0) / alerts.length * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      {/* System Health */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          AI Agent Status
        </h3>
        
        <div className="space-y-4">
          {/* Trust Score Stats */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
            <div className="text-sm text-purple-700 font-medium mb-2">Average Trust Score</div>
            <div className="text-4xl font-bold text-purple-600">{avgTrustScore}%</div>
            <div className="mt-2 text-xs text-purple-600">
              Based on {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Alert Distribution */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span className="font-semibold text-green-800">Verified</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{verifiedCount}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-yellow-800">Review</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{reviewCount}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-red-800">Rejected</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{rejectedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Score Criteria */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          Trust Criteria
        </h3>
        
        <div className="space-y-3">
          <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div className="font-bold text-green-800 mb-1">Verified (≥ 65%)</div>
            <div className="text-xs text-green-700">High confidence, immediate action</div>
          </div>
          
          <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
            <div className="font-bold text-yellow-800 mb-1">Review (40-64%)</div>
            <div className="text-xs text-yellow-700">Manual review required</div>
          </div>
          
          <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
            <div className="font-bold text-red-800 mb-1">Rejected (&lt; 40%)</div>
            <div className="text-xs text-red-700">Low confidence, likely false</div>
          </div>
        </div>
      </div>

      {/* AI Components */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          AI Components
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-gray-700">User Reputation Score</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span className="text-gray-700">Cross-Verification</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-gray-700">Location Analysis</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span className="text-gray-700">Temporal Consistency</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentStatusPanel;