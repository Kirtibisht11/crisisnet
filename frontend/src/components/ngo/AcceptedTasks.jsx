// frontend/src/components/ngo/AcceptedTasks.jsx
import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const AcceptedTasks = ({ tasks }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Accepted Tasks</h2>
      
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No tasks accepted yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{task.type}</h4>
                  <p className="text-sm text-gray-600 mt-1">{task.location}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(task.status)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
                <span className="text-xs text-gray-500">{task.acceptedAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcceptedTasks;