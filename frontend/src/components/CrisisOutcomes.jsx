import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const CrisisOutcomes = () => {
  const [statistics, setStatistics] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(true);

  const crisisTypes = ['earthquake', 'flood', 'fire', 'medical', 'landslide', 'storm'];

  useEffect(() => {
    fetchStatistics();
  }, [selectedType]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const url = selectedType
        ? `/api/learning/crisis-statistics?crisis_type=${selectedType}`
        : '/api/learning/crisis-statistics';
      
      const response = await fetch(url);
      const data = await response.json();
      
      setStatistics(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch crisis statistics:', error);
      setLoading(false);
    }
  };

  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEffectivenessColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Target className="w-6 h-6 mr-2 text-blue-600" />
          Crisis Outcomes Analysis
        </h2>
        <p className="text-gray-600">
          Track resolution rates and effectiveness of crisis responses
        </p>
      </div>

      {/* Crisis Type Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Crisis Type</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedType === null
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Types
          </button>
          {crisisTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                selectedType === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Overview */}
      {statistics && statistics.total > 0 ? (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600">Total Crises</h4>
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedType ? `${selectedType} only` : 'All types'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600">Resolved</h4>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{statistics.resolved}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((statistics.resolved / statistics.total) * 100).toFixed(1)}% resolution rate
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600">Avg Response Time</h4>
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {Math.round(statistics.avg_response_time / 60)}m
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(statistics.avg_response_time)} seconds
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600">Avg Effectiveness</h4>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p
                className={`text-3xl font-bold ${getEffectivenessColor(
                  statistics.avg_effectiveness
                )}`}
              >
                {(statistics.avg_effectiveness * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Overall performance</p>
            </div>
          </div>

          {/* Outcome Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Outcome Breakdown</h3>
            
            <div className="space-y-4">
              {/* Resolved */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-gray-900">Resolved</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {statistics.resolved} ({((statistics.resolved / statistics.total) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${(statistics.resolved / statistics.total) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Partial */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-gray-900">Partial</span>
                  </div>
                  <span className="font-bold text-yellow-600">
                    {statistics.partial} ({((statistics.partial / statistics.total) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-600 h-3 rounded-full transition-all"
                    style={{ width: `${(statistics.partial / statistics.total) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Failed */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-medium text-gray-900">Failed</span>
                  </div>
                  <span className="font-bold text-red-600">
                    {statistics.failed} ({((statistics.failed / statistics.total) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-600 h-3 rounded-full transition-all"
                    style={{ width: `${(statistics.failed / statistics.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Performance Insights
            </h3>
            
            <div className="space-y-3">
              {statistics.avg_effectiveness >= 0.8 && (
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Excellent Performance:</span> High effectiveness
                    score indicates strong crisis response capabilities.
                  </p>
                </div>
              )}
              
              {statistics.avg_response_time < 600 && (
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Quick Response:</span> Average response time
                    under 10 minutes shows efficient deployment.
                  </p>
                </div>
              )}
              
              {statistics.resolved / statistics.total >= 0.75 && (
                <div className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">High Resolution Rate:</span> Over 75% of crises
                    successfully resolved.
                  </p>
                </div>
              )}
              
              {statistics.failed > statistics.resolved && (
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Attention Needed:</span> Failed crises exceed
                    resolved ones. Consider reviewing response procedures.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-500">
            {selectedType
              ? `No crisis outcomes recorded for ${selectedType} yet.`
              : 'No crisis outcomes have been recorded yet.'}
          </p>
          <button
            onClick={() => setSelectedType(null)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View All Types
          </button>
        </div>
      )}
    </div>
  );
};

export default CrisisOutcomes;