// frontend/src/components/ngo/CrisisModal.jsx
import React from 'react';
import { X, MapPin, Shield, Users } from 'lucide-react';
import { ngoFormatter } from '../../utils/ngoFormatter';

const CrisisModal = ({ crisis, onClose, onAccept }) => {
  if (!crisis) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Crisis Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-4 h-4 rounded-full ${ngoFormatter.getSeverityIcon(crisis.severity)}`}></div>
            <h3 className="text-2xl font-bold text-gray-900">{crisis.type}</h3>
            <span className={`px-3 py-1 text-sm font-medium rounded border ${ngoFormatter.getSeverityColor(crisis.severity)}`}>
              {crisis.severity}
            </span>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Location</label>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <p className="text-gray-900">{crisis.location}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Description</label>
              <p className="text-gray-900 mt-1 leading-relaxed">{crisis.description}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Resources Needed</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {crisis.resources.map((resource, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded border border-blue-200">
                    {resource}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Trust Level
                </label>
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${crisis.trust * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(crisis.trust * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Verified Sources
                </label>
                <p className="text-2xl font-bold text-gray-900 mt-1">{crisis.sources}</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> By accepting this crisis, your organization commits to providing the requested resources and support. Please ensure you have the capacity before accepting.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={() => onAccept(crisis)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
            >
              Accept Responsibility
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrisisModal;