import React, { useState, useEffect } from 'react';
import { MapPin, Shield, Users, X, CheckCircle, Clock, AlertCircle, Droplets, Flame, Activity, Mountain } from 'lucide-react';

// Mock API with data
const ngoApi = {
  getActiveCrises: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      crises: [
        {
          id: "CR-202",
          type: "Flood",
          location: "Sector 21, North District",
          severity: "HIGH",
          resources: ["Food", "Shelter", "Medical"],
          trust: 0.87,
          description: "Severe flooding affecting 200+ families. Immediate evacuation and shelter needed. Water levels rising rapidly.",
          sources: 15,
          timestamp: "2 hours ago"
        },
        {
          id: "CR-203",
          type: "Fire",
          location: "Industrial Area B",
          severity: "MEDIUM",
          resources: ["Medical", "Food"],
          trust: 0.72,
          description: "Factory fire contained but workers need medical attention and temporary support.",
          sources: 8,
          timestamp: "4 hours ago"
        },
        {
          id: "CR-204",
          type: "Medical Emergency",
          location: "Rural Village - Sector 45",
          severity: "HIGH",
          resources: ["Medical", "Transport"],
          trust: 0.91,
          description: "Disease outbreak reported. Mobile medical unit urgently required.",
          sources: 12,
          timestamp: "30 minutes ago"
        },
        {
          id: "CR-205",
          type: "Landslide",
          location: "Mountain Road, Highway 7",
          severity: "LOW",
          resources: ["Food", "Shelter"],
          trust: 0.68,
          description: "Minor landslide blocking road. 20 families temporarily displaced.",
          sources: 5,
          timestamp: "6 hours ago"
        }
      ]
    };
  },
  acceptCrisis: async (crisisId) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return { success: true, crisisId };
  },
  getAcceptedTasks: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { tasks: [] };
  }
};

const NGO = () => {
  const [activeCrises, setActiveCrises] = useState([]);
  const [acceptedTasks, setAcceptedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrisis, setSelectedCrisis] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [crisesData, tasksData] = await Promise.all([
        ngoApi.getActiveCrises(),
        ngoApi.getAcceptedTasks()
      ]);
      setActiveCrises(crisesData.crises);
      setAcceptedTasks(tasksData.tasks);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCrisis = async (crisis) => {
    try {
      await ngoApi.acceptCrisis(crisis.id);
      const newTask = {
        id: crisis.id,
        type: crisis.type,
        location: crisis.location,
        status: 'Pending',
        acceptedAt: new Date().toISOString().split('T')[0]
      };
      setAcceptedTasks([newTask, ...acceptedTasks]);
      setActiveCrises(activeCrises.filter(c => c.id !== crisis.id));
      setSelectedCrisis(null);
    } catch (error) {
      console.error('Failed to accept crisis:', error);
    }
  };

  const getCrisisIcon = (type) => {
    const icons = {
      'Flood': Droplets,
      'Fire': Flame,
      'Medical Emergency': Activity,
      'Landslide': Mountain
    };
    const Icon = icons[type] || AlertCircle;
    return <Icon className="w-5 h-5" />;
  };

  const getSeverityColor = (severity) => {
    return severity === 'HIGH' 
      ? { bg: 'bg-gradient-to-br from-red-500/10 to-red-600/5', border: 'border-red-200/20', text: 'text-red-100', badge: 'bg-gradient-to-r from-red-400 to-red-500 text-white' } 
      : severity === 'MEDIUM' 
      ? { bg: 'bg-gradient-to-br from-amber-500/10 to-amber-600/5', border: 'border-amber-200/20', text: 'text-amber-100', badge: 'bg-gradient-to-r from-amber-400 to-amber-500 text-white' } 
      : { bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-200/20', text: 'text-emerald-100', badge: 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white' };
  };

  const highPriorityCrises = activeCrises.filter(c => c.severity === 'HIGH').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative">
      {/* Premium Background Pattern - Fixed Syntax */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.02)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      ></div>
      
      {/* Glassmorphic Header */}
      <div className="relative z-30 backdrop-blur-xl bg-gray-900/70 border-b border-gray-700/30 shadow-2xl shadow-black/30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                Relief Force International
              </h1>
              <p className="text-sm text-gray-300 font-medium">Crisis Response Dashboard</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-400/20 to-emerald-500/10 border border-emerald-300/20">
              <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shadow-lg shadow-emerald-300/50"></div>
              <span className="text-sm font-semibold text-emerald-200">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Stats Cards */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/40 to-gray-900/40 p-6 shadow-2xl shadow-black/40 border border-gray-600/30 hover:border-blue-400/30 transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="text-5xl font-bold bg-gradient-to-br from-blue-200 to-cyan-100 bg-clip-text text-transparent mb-2">
                {activeCrises.length}
              </div>
              <div className="text-sm font-medium text-gray-300">Active Crises</div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/20 to-rose-900/20 p-6 shadow-2xl shadow-black/40 border border-red-700/30 hover:border-red-400/30 transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="text-5xl font-bold bg-gradient-to-br from-red-200 to-rose-100 bg-clip-text text-transparent mb-2">
                {highPriorityCrises}
              </div>
              <div className="text-sm font-medium text-red-300">High Priority</div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/20 to-blue-900/20 p-6 shadow-2xl shadow-black/40 border border-blue-700/30 hover:border-blue-400/30 transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="text-5xl font-bold bg-gradient-to-br from-blue-200 to-indigo-100 bg-clip-text text-transparent mb-2">
                {acceptedTasks.length}
              </div>
              <div className="text-sm font-medium text-blue-300">Tasks Accepted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Crisis Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Active Crises</h2>
              <button 
                onClick={loadData}
                className="px-4 py-2 bg-gradient-to-r from-gray-700/50 to-gray-800/50 text-gray-300 text-sm font-medium rounded-lg hover:from-gray-600/50 hover:to-gray-700/50 transition-all duration-300 border border-gray-600/30 flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-gray-600/30"></div>
                  <div className="w-16 h-16 rounded-full border-4 border-blue-400 border-t-transparent animate-spin absolute top-0"></div>
                </div>
              </div>
            ) : activeCrises.length === 0 ? (
              <div className="rounded-2xl bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 p-12 text-center shadow-xl">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-gray-500" />
                </div>
                <p className="text-gray-400 font-medium">No active crises at the moment</p>
              </div>
            ) : (
              <div className="space-y-5">
                {activeCrises.map((crisis, idx) => {
                  const severityColors = getSeverityColor(crisis.severity);
                  return (
                    <div
                      key={crisis.id}
                      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-600/30 hover:border-gray-500/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
                    >
                      <div className={`absolute inset-0 ${severityColors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                      
                      <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${severityColors.bg} border ${severityColors.border}`}>
                              {getCrisisIcon(crisis.type)}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{crisis.type}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                <MapPin className="w-4 h-4" />
                                <span>{crisis.location}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`px-4 py-2 text-xs font-bold rounded-full ${severityColors.badge} shadow-lg`}>
                            {crisis.severity}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {crisis.resources.map((resource, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 text-blue-200 text-xs font-semibold rounded-lg border border-blue-700/30">
                              {resource}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-600/30">
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <Clock className="w-3 h-3" />
                            {crisis.timestamp}
                          </div>
                          <button
                            onClick={() => setSelectedCrisis(crisis)}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Accepted Tasks Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 rounded-2xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-600/30 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Accepted Tasks</h2>
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300">
                  {acceptedTasks.length}
                </span>
              </div>
              
              {acceptedTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No tasks accepted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {acceptedTasks.map(task => (
                    <div key={task.id} className="p-4 rounded-xl bg-gradient-to-br from-gray-700/30 to-gray-800/30 border border-gray-600/30 hover:border-gray-500/40 transition-all duration-300">
                      <h4 className="font-bold text-white mb-1">{task.type}</h4>
                      <p className="text-sm text-gray-400 mb-3">{task.location}</p>
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white">
                          {task.status}
                        </span>
                        <span className="text-xs text-gray-500">{task.acceptedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Footer */}
      <div className="relative z-30 fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-gray-900/70 border-t border-gray-700/30 shadow-2xl shadow-black/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shadow-lg shadow-emerald-300/50"></div>
            <span className="text-sm font-semibold text-gray-300">Connected</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
            </span>
            <div className="w-1 h-1 rounded-full bg-gray-600"></div>
            <span className="text-sm text-gray-500">
              Relief Force International © 2024
            </span>
          </div>
        </div>
      </div>

      {/* Premium Modal */}
      {selectedCrisis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700/50 animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 bg-gradient-to-br from-gray-900 to-gray-950/95 backdrop-blur-sm border-b border-gray-700/50 px-8 py-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">Crisis Details</h2>
              <button 
                onClick={() => setSelectedCrisis(null)}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400 hover:text-gray-300" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl ${getSeverityColor(selectedCrisis.severity).bg} border ${getSeverityColor(selectedCrisis.severity).border}`}>
                  {getCrisisIcon(selectedCrisis.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white">{selectedCrisis.type}</h3>
                  <div className="flex items-center gap-2 text-gray-400 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{selectedCrisis.location}</span>
                  </div>
                </div>
                <span className={`px-4 py-2 text-sm font-bold rounded-full ${getSeverityColor(selectedCrisis.severity).badge}`}>
                  {selectedCrisis.severity}
                </span>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-600/30">
                <p className="text-gray-300 leading-relaxed">{selectedCrisis.description}</p>
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-300 mb-3 block">Resources Needed</label>
                <div className="flex flex-wrap gap-2">
                  {selectedCrisis.resources.map((resource, idx) => (
                    <span key={idx} className="px-4 py-2 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 text-blue-200 text-sm font-semibold rounded-lg border border-blue-700/30">
                      {resource}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-900/20 to-green-900/20 border border-emerald-700/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <label className="text-sm font-bold text-emerald-300">Trust Level</label>
                  </div>
                  <div className="relative h-3 bg-emerald-900/30 rounded-full overflow-hidden mb-2">
                    <div 
                      className="absolute h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-lg"
                      style={{ width: `${selectedCrisis.trust * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-300">
                    {Math.round(selectedCrisis.trust * 100)}%
                  </span>
                </div>
                
                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-700/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-blue-400" />
                    <label className="text-sm font-bold text-blue-300">Verified Sources</label>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-br from-blue-300 to-indigo-300 bg-clip-text text-transparent">
                    {selectedCrisis.sources}
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-700/30">
                <p className="text-sm text-amber-300 font-medium leading-relaxed">
                  <strong>Note:</strong> By accepting this crisis, your organization commits to providing the requested resources and support. Please ensure you have the capacity before accepting.
                </p>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setSelectedCrisis(null)}
                  className="flex-1 px-6 py-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 text-gray-300 font-bold rounded-xl hover:from-gray-700/50 hover:to-gray-800/50 transition-all duration-300 border border-gray-600/30 hover:border-gray-500/40"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAcceptCrisis(selectedCrisis)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
                >
                  Accept Responsibility
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGO;