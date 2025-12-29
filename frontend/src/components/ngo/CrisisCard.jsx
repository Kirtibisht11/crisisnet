// frontend/src/components/ngo/CrisisCard.jsx
import React from 'react';
import { MapPin } from 'lucide-react';
import { ngoFormatter } from '../../utils/ngoFormatter';

const CrisisCard = ({ crisis, onViewDetails }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${ngoFormatter.getSeverityIcon(crisis.severity)}`}></div>
          <h3 className="font-semibold text-gray-900">{crisis.type}</h3>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded border ${ngoFormatter.getSeverityColor(crisis.severity)}`}>
          {crisis.severity}
        </span>
      </div>
      
      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
        <MapPin className="w-4 h-4" />
        <span>{crisis.location}</span>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {crisis.resources.map((resource, idx) => (
          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
            {resource}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">{crisis.timestamp}</span>
        <button
          onClick={() => onViewDetails(crisis)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default CrisisCard;