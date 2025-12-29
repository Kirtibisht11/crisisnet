// frontend/src/components/ngo/NgoHeader.jsx
import React from 'react';

const NgoHeader = ({ ngoName, status }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ngoName}</h1>
          <p className="text-sm text-gray-600 mt-1">Crisis Response Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'Active' ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm font-medium text-gray-700">{status}</span>
        </div>
      </div>
    </div>
  );
};

export default NgoHeader;