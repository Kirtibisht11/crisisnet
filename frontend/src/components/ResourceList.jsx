import React, { useState, useMemo } from 'react';
import { useCrisisStore } from '../state/crisisStore';
import { Activity, Users, Truck, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

const ResourceList = () => {
  const { resources, volunteers, allocations } = useCrisisStore();
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('status');

  const stats = useMemo(() => {
    const totalResources = resources.length;
    const availableResources = resources.filter(r => r.available).length;
    const totalVolunteers = volunteers.length;
    const availableVolunteers = volunteers.filter(v => v.available).length;

    return {
      resources: {
        total: totalResources,
        available: availableResources,
        allocated: totalResources - availableResources,
        utilization: ((totalResources - availableResources) / totalResources * 100).toFixed(1)
      },
      volunteers: {
        total: totalVolunteers,
        available: availableVolunteers,
        allocated: totalVolunteers - availableVolunteers,
        utilization: ((totalVolunteers - availableVolunteers) / totalVolunteers * 100).toFixed(1)
      }
    };
  }, [resources, volunteers]);

  const filteredResources = useMemo(() => {
    let filtered = [...resources];
    
    if (filterType !== 'all') {
      if (filterType === 'available') {
        filtered = filtered.filter(r => r.available);
      } else if (filterType === 'allocated') {
        filtered = filtered.filter(r => !r.available);
      }
    }

    filtered.sort((a, b) => {
      if (sortBy === 'status') {
        return (a.available === b.available) ? 0 : a.available ? 1 : -1;
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });

    return filtered;
  }, [resources, filterType, sortBy]);

  const filteredVolunteers = useMemo(() => {
    let filtered = [...volunteers];
    
    if (filterType !== 'all') {
      if (filterType === 'available') {
        filtered = filtered.filter(v => v.available);
      } else if (filterType === 'allocated') {
        filtered = filtered.filter(v => !v.available);
      }
    }

    return filtered;
  }, [volunteers, filterType]);

  const getAllocationInfo = (itemId, isVolunteer = false) => {
    const allocation = allocations.find(a => 
      isVolunteer 
        ? a.volunteers.some(v => v.id === itemId)
        : a.resources.some(r => r.id === itemId)
    );
    return allocation;
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Resource Dashboard</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Resources</span>
              <Truck className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.resources.available}/{stats.resources.total}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.resources.utilization}% in use
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${stats.resources.utilization}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Volunteers</span>
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.volunteers.available}/{stats.volunteers.total}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.volunteers.utilization}% deployed
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${stats.volunteers.utilization}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              filterType === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('available')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              filterType === 'available' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setFilterType('allocated')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              filterType === 'allocated' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Deployed
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="status">Sort by Status</option>
          <option value="type">Sort by Type</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Resources ({filteredResources.length})
          </h3>
          <div className="space-y-2">
            {filteredResources.map(resource => {
              const allocation = getAllocationInfo(resource.id);
              return (
                <div
                  key={resource.id}
                  className={`p-3 rounded-lg border transition ${
                    resource.available
                      ? 'bg-green-50 border-green-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {resource.available ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-orange-600 animate-pulse" />
                        )}
                        <span className="font-semibold text-gray-800">
                          {resource.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{resource.location.lat.toFixed(4)}, {resource.location.lon.toFixed(4)}</span>
                        </div>
                        {!resource.available && allocation && (
                          <>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Assigned to: {allocation.crisis_type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>ETA: {allocation.eta_minutes} min</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        resource.available
                          ? 'bg-green-200 text-green-800'
                          : 'bg-orange-200 text-orange-800'
                      }`}
                    >
                      {resource.available ? 'Available' : 'Deployed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Volunteers ({filteredVolunteers.length})
          </h3>
          <div className="space-y-2">
            {filteredVolunteers.map(volunteer => {
              const allocation = getAllocationInfo(volunteer.id, true);
              return (
                <div
                  key={volunteer.id}
                  className={`p-3 rounded-lg border transition ${
                    volunteer.available
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-purple-50 border-purple-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {volunteer.available ? (
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-purple-600 animate-pulse" />
                        )}
                        <span className="font-semibold text-gray-800">
                          Volunteer #{volunteer.id}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Skills: {volunteer.skills.join(', ')}</div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{volunteer.location.lat.toFixed(4)}, {volunteer.location.lon.toFixed(4)}</span>
                        </div>
                        {!volunteer.available && allocation && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Deployed to: {allocation.crisis_type}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        volunteer.available
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-purple-200 text-purple-800'
                      }`}
                    >
                      {volunteer.available ? 'Available' : 'Deployed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceList;