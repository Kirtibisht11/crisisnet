import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Settings, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

const FeedbackPanel = () => {
  const [trustFeedback, setTrustFeedback] = useState(null);
  const [resourceFeedback, setResourceFeedback] = useState(null);
  const [selectedCrisisType, setSelectedCrisisType] = useState('earthquake');
  const [loading, setLoading] = useState(true);

  const crisisTypes = [
    { value: 'earthquake', label: 'Earthquake', emoji: '🌍' },
    { value: 'flood', label: 'Flood', emoji: '🌊' },
    { value: 'fire', label: 'Fire', emoji: '🔥' },
    { value: 'medical', label: 'Medical', emoji: '🏥' },
    { value: 'storm', label: 'Storm', emoji: '⛈️' }
  ];

  useEffect(() => {
    fetchFeedback();
  }, [selectedCrisisType]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const [trustResponse, resourceResponse] = await Promise.all([
        fetch(`/api/learning/feedback/trust-agent?crisis_type=${selectedCrisisType}`),
        fetch(`/api/learning/feedback/resource-agent?crisis_type=${selectedCrisisType}`)
      ]);

      const trustData = await trustResponse.json();
      const resourceData = await resourceResponse.json();

      setTrustFeedback(trustData.data);
      setResourceFeedback(resourceData.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      setLoading(false);
    }
  };

  const getAdjustmentColor = (direction) => {
    if (direction === 'increase') return 'text-green-600 bg-green-100';
    if (direction === 'decrease') return 'text-red-600 bg-red-100';
    return 'text-blue-600 bg-blue-100';
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
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Brain className="w-7 h-7 mr-3" />
              AI Learning Feedback
            </h2>
            <p className="text-purple-100 mt-2">
              Automated recommendations to improve system performance
            </p>
          </div>
          <button
            onClick={fetchFeedback}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Crisis Type Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Crisis Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {crisisTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedCrisisType(type.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedCrisisType === type.value
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">{type.emoji}</div>
              <div className="text-sm font-semibold text-gray-900">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Trust Agent Feedback */}
      {trustFeedback && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4">
            <h3 className="text-xl font-bold flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              Trust Agent Recommendations
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Weight Adjustments */}
            {trustFeedback.weight_adjustments &&
              trustFeedback.weight_adjustments.recommendations && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Weight Adjustments
                  </h4>

                  {trustFeedback.weight_adjustments.current_effectiveness != null && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Current Effectiveness</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {(
                            trustFeedback.weight_adjustments.current_effectiveness * 100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Resolution Rate:{' '}
                        {(trustFeedback.weight_adjustments.resolution_rate * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}

                  {Object.entries(trustFeedback.weight_adjustments.recommendations).map(
                    ([component, data]) => (
                      <div
                        key={component}
                        className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        {data.current != null ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-900 capitalize">
                                {component.replace('_', ' ')}
                              </h5>
                              <ArrowRight className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="text-xs text-gray-600 mb-1">Current</div>
                                <div className="text-2xl font-bold text-gray-700">
                                  {data.current}
                                </div>
                              </div>
                              <ArrowRight className="w-6 h-6 text-blue-600" />
                              <div className="flex-1">
                                <div className="text-xs text-gray-600 mb-1">Recommended</div>
                                <div className="text-2xl font-bold text-blue-600">
                                  {data.recommended}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                              {data.reason}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-700">{data.message}</div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

            {/* Threshold Adjustments */}
            {trustFeedback.threshold_adjustments &&
              trustFeedback.threshold_adjustments.threshold_adjustment && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-purple-600" />
                    Threshold Adjustments
                  </h4>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-purple-900">
                        {trustFeedback.threshold_adjustments.crisis_type}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${getAdjustmentColor(
                          trustFeedback.threshold_adjustments.threshold_adjustment.direction
                        )}`}
                      >
                        {trustFeedback.threshold_adjustments.threshold_adjustment.direction.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-600">Resolution Rate</div>
                        <div className="text-xl font-bold text-purple-600">
                          {(
                            trustFeedback.threshold_adjustments.current_resolution_rate * 100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Avg Response Time</div>
                        <div className="text-xl font-bold text-purple-600">
                          {trustFeedback.threshold_adjustments.avg_response_time_minutes.toFixed(
                            1
                          )}
                          m
                        </div>
                      </div>
                    </div>

                    {trustFeedback.threshold_adjustments.threshold_adjustment.amount !== 0 && (
                      <div className="text-sm font-semibold text-purple-900 mb-2">
                        Adjustment: {trustFeedback.threshold_adjustments.threshold_adjustment.amount > 0 ? '+' : ''}
                        {trustFeedback.threshold_adjustments.threshold_adjustment.amount}
                      </div>
                    )}

                    <div className="text-sm text-gray-700 bg-white p-3 rounded">
                      {trustFeedback.threshold_adjustments.threshold_adjustment.reason}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Resource Agent Feedback */}
      {resourceFeedback && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4">
            <h3 className="text-xl font-bold flex items-center">
              <TrendingUp className="w-6 h-6 mr-2" />
              Resource Agent Optimization
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {resourceFeedback.performance_tiers && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  Volunteer Performance Tiers
                </h4>

                <div className="space-y-4">
                  {Object.entries(resourceFeedback.performance_tiers).map(([tier, data]) => (
                    <div
                      key={tier}
                      className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-bold text-gray-900 capitalize text-lg">{tier}</h5>
                        <span className="text-3xl font-bold text-blue-600">{data.count}</span>
                      </div>

                      {data.avg_reliability > 0 && (
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Avg Reliability</span>
                            <span className="font-semibold">
                              {(data.avg_reliability * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${data.avg_reliability * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-gray-700 bg-white p-3 rounded mt-2">
                        <span className="font-semibold">Recommendation:</span>{' '}
                        {data.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resourceFeedback.allocation_strategy && (
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                <h4 className="font-bold text-green-900 mb-3 text-lg">
                  Allocation Strategy
                </h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-semibold text-green-800">Strategy:</span>{' '}
                    <span className="text-gray-700">
                      {resourceFeedback.allocation_strategy.strategy}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-green-800">Description:</span>{' '}
                    <span className="text-gray-700">
                      {resourceFeedback.allocation_strategy.description}
                    </span>
                  </div>
                  {resourceFeedback.allocation_strategy.critical_tasks && (
                    <div className="text-sm mt-3 p-3 bg-white rounded">
                      {resourceFeedback.allocation_strategy.critical_tasks}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPanel;