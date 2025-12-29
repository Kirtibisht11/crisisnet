// frontend/src/components/ngo/CrisisSummary.jsx
import React from 'react';

const CrisisSummary = ({ totalCrises, highPriority, accepted }) => {
  return (
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{totalCrises}</div>
          <div className="text-sm text-gray-600 mt-1">Active Crises</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{highPriority}</div>
          <div className="text-sm text-gray-600 mt-1">High Priority</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{accepted}</div>
          <div className="text-sm text-gray-600 mt-1">Tasks Accepted</div>
        </div>
      </div>
    </div>
  );
};

export default CrisisSummary;