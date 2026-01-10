import React from 'react';
import { Shield, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const TrustScoreCard = ({ score, decision, components, breakdown, className = '' }) => {
  const getScoreColor = (score) => {
    if (score >= 0.75) return 'text-green-600';
    if (score >= 0.60) return 'text-blue-600';
    if (score >= 0.40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 0.75) return 'bg-green-50';
    if (score >= 0.60) return 'bg-blue-50';
    if (score >= 0.40) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getScoreBorderColor = (score) => {
    if (score >= 0.75) return 'border-green-200';
    if (score >= 0.60) return 'border-blue-200';
    if (score >= 0.40) return 'border-yellow-200';
    return 'border-red-200';
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'VERIFIED':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'REVIEW':
      case 'UNCERTAIN':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'REJECTED':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Shield className="w-6 h-6 text-gray-600" />;
    }
  };

  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REVIEW':
      case 'UNCERTAIN':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const scorePercent = (score * 100).toFixed(1);

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${getScoreBorderColor(score)} ${className}`}>
      {/* Header */}
      <div className={`${getScoreBgColor(score)} p-6 border-b-2 ${getScoreBorderColor(score)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className={`w-8 h-8 mr-3 ${getScoreColor(score)}`} />
            <h3 className="text-xl font-bold text-gray-900">Trust Score</h3>
          </div>
          {decision && (
            <div className={`px-4 py-2 rounded-lg border-2 font-bold flex items-center gap-2 ${getDecisionColor(decision)}`}>
              {getDecisionIcon(decision)}
              {decision}
            </div>
          )}
        </div>

        {/* Main Score Display */}
        <div className="flex items-end justify-between">
          <div>
            <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
              {scorePercent}%
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {score >= 0.75 && 'High Confidence'}
              {score >= 0.60 && score < 0.75 && 'Good Confidence'}
              {score >= 0.40 && score < 0.60 && 'Moderate Confidence'}
              {score < 0.40 && 'Low Confidence'}
            </div>
          </div>

          {/* Score Gauge */}
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${score * 351.86} 351.86`}
                className={getScoreColor(score)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className={`w-12 h-12 ${getScoreColor(score)}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Components Breakdown */}
      {components && (
        <div className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Score Components
          </h4>

          <div className="space-y-3">
            {Object.entries(components).map(([key, value]) => {
              const isPositive = value >= 0;
              const label = key.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
              
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center flex-1">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-2" />
                    )}
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          isPositive ? 'bg-green-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${Math.abs(value) * 100}%` }}
                      ></div>
                    </div>
                    <span
                      className={`text-sm font-bold w-16 text-right ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isPositive ? '+' : ''}{(value * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Breakdown Summary */}
      {breakdown && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Base Score</div>
              <div className="text-xl font-bold text-gray-900">
                {(breakdown.base_score * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Adjustments</div>
              <div className={`text-xl font-bold ${
                breakdown.adjustments >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {breakdown.adjustments >= 0 ? '+' : ''}{(breakdown.adjustments * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustScoreCard;