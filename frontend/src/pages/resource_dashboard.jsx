import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../state/userStore'
import { 
  MapPin, 
  RefreshCw, 
  Shield, 
  Users, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Target,
  Activity,
  Zap,
  Filter,
  Search,
  Download,
  BarChart3,
  ChevronRight,
  Plus,
  Eye,
  Clock,
  Truck,
  Trash2,
  Edit
} from 'lucide-react'

const CRISIS_LABELS = {
  'flood': 'Flood Emergency',
  'fire': 'Fire Emergency',
  'medical': 'Medical Emergency',
  'earthquake': 'Earthquake',
  'landslide': 'Landslide',
  'collapse': 'Building Collapse'
};

const CRISIS_EMOJIS = {
  'flood': '🌊',
  'fire': '🔥',
  'medical': '🚑',
  'earthquake': '🌍',
  'landslide': '⛰️',
  'collapse': '🏢'
};

const SKILL_MAP = {
  'flood': ['rescue', 'swimming', 'first_aid', 'logistics'],
  'fire': ['firefighting', 'first_aid', 'rescue', 'medical'],
  'medical': ['medical', 'first_aid'],
  'earthquake': ['rescue', 'first_aid', 'medical', 'search_and_rescue'],
  'landslide': ['rescue', 'first_aid', 'search_and_rescue'],
  'collapse': ['rescue', 'medical', 'first_aid', 'search_and_rescue']
};

const LocationDisplay = ({ alert }) => {
  const [loc, setLoc] = useState(() => {
    const l = alert.location;
    const unknown = !l || ['unknown', 'unknown location'].includes(l.toLowerCase()) || l.trim() === '';
    const coords = l && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(l.trim());

    if (!unknown && !coords) return l;
    if (alert.lat != null && alert.lon != null) return null;
    return 'Location not available';
  });

  useEffect(() => {
    const l = alert.location;
    const unknown = !l || ['unknown', 'unknown location'].includes(l.toLowerCase()) || l.trim() === '';
    const coords = l && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(l.trim());
    
    if (!unknown && !coords) {
      setLoc(l);
    } else if (alert.lat != null && alert.lon != null) {
      let active = true;
      
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${alert.lat}&lon=${alert.lon}`)
        .then(r => r.json())
        .then(d => {
          if (!active) return;
          if (d.address) {
            const { road, suburb, city, town, village, county, state_district } = d.address;
            const parts = [road, suburb || village || town, city || county || state_district].filter(Boolean);
            if (parts.length > 0) setLoc(parts.join(', '));
            else if (d.display_name) setLoc(d.display_name.split(',').slice(0, 2).join(','));
            else setLoc(`${Number(alert.lat).toFixed(4)}, ${Number(alert.lon).toFixed(4)}`);
          } else if (d.display_name) {
            setLoc(d.display_name.split(',').slice(0, 2).join(','));
          } else {
            setLoc(`${Number(alert.lat).toFixed(4)}, ${Number(alert.lon).toFixed(4)}`);
          }
        })
        .catch(e => {
          if (!active) return;
          setLoc(`${Number(alert.lat).toFixed(4)}, ${Number(alert.lon).toFixed(4)}`);
        });
      
      return () => { active = false; };
    }
  }, [alert.location, alert.lat, alert.lon]);

  if (loc === null) {
    if (alert.lat != null && alert.lon != null) {
      return (
        <span className="text-slate-300">
          {Number(alert.lat).toFixed(4)}, {Number(alert.lon).toFixed(4)}
          <span className="text-slate-500 italic text-xs ml-2">(Resolving...)</span>
        </span>
      );
    }
    return <span className="text-slate-400 italic text-xs">Resolving...</span>;
  }

  return <span>{loc}</span>;
};

export default function ResourceDashboard() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const [resources, setResources] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [requests, setRequests] = useState([])
  const [crises, setCrises] = useState([])
  const [selectedCrisis, setSelectedCrisis] = useState(null)
  const [selectedForResource, setSelectedForResource] = useState(null)
  const [viewAssignments, setViewAssignments] = useState(null)
  const [viewResourceDetail, setViewResourceDetail] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [showAddResource, setShowAddResource] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newResource, setNewResource] = useState({ type: '', capacity: '', provider: '', location: '' })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('alerts')
  const [volCount, setVolCount] = useState(5)
  const [resAmounts, setResAmounts] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    
    try {
      const [resData, volData, reqData] = await Promise.all([
        api.get('/api/resource/resources').catch(() => ({ data: { items: [] }})),
        api.get('/api/resource/volunteers').catch(() => ({ data: { items: [] }})),
        api.get('/api/resource/volunteer_requests').catch(() => ({ data: { items: [] }}))
      ]);

      setResources(resData.data.items || [])
      setVolunteers(volData.data.items || [])
      setRequests(reqData.data.items || [])

      const alertsRes = await api.get('/api/alerts');
      if (alertsRes.data && alertsRes.data.alerts) {
        const verified = alertsRes.data.alerts.filter(a => 
          a.decision && a.decision.toUpperCase() === 'VERIFIED'
        );
        
        const unique = new Map();
        verified.forEach(a => unique.set(a.alert_id || a.id, a));
        setCrises(Array.from(unique.values()));
      }

      const stored = JSON.parse(localStorage.getItem('resource_assignments') || '[]');
      setAssignments(stored);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false)
    }
  }

  async function toggleResourceAvail(id, current) {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      await api.put(`/api/resource/resources/${id}/availability`, 
        { available: !current }, 
        { headers: { 'token': token }}
      )
      loadAll()
    } catch (e) {
      console.error(e);
      alert('Update failed')
    }
  }

  async function toggleVolAvail(id, current) {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      await api.put(`/api/resource/volunteers/${id}/availability`, 
        { available: !current }, 
        { headers: { 'token': token }}
      )
      loadAll()
    } catch (e) {
      console.error(e);
      alert('Update failed')
    }
  }

  const postVolRequest = async (crisis) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      if (!token) {
        alert('Authentication required. Please log in.');
        return;
      }

      let loc = 'Unknown Location';
      let lat = null;
      let lon = null;
      
      if (typeof crisis.location === 'string' && crisis.location.trim()) loc = crisis.location;
      if (crisis.lat || crisis.latitude) lat = crisis.lat || crisis.latitude;
      if (crisis.lon || crisis.longitude) lon = crisis.lon || crisis.longitude;
      if (loc === 'Unknown Location' && lat && lon) loc = `${lat}, ${lon}`;

      const skills = SKILL_MAP[crisis.crisis_type] || ['first_aid', 'rescue'];

      await api.post('/api/resource/volunteer_requests', {
        crisis_id: crisis.alert_id || crisis.id,
        crisis_type: crisis.crisis_type,
        location: loc,
        lat: lat,
        lon: lon,
        message: crisis.message || 'Emergency assistance required',
        skills: skills,
        count: Number(volCount) || 1
      }, {
        headers: { 'token': token }
      });
      
      alert('Volunteer request posted!');
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 403) {
        alert('Permission denied. Session may be expired.');
      } else {
        alert('Failed to post request');
      }
    }
    setSelectedCrisis(null);
    loadAll();
  };

  const handleSaveResource = async () => {
    if (!newResource.type || !newResource.capacity || !newResource.provider || !newResource.location) {
      alert('Please fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      
      if (editingId) {
        await api.put(`/api/resource/resources/${editingId}`, {
          type: newResource.type,
          capacity: parseInt(newResource.capacity),
          location: `${newResource.location} (Provider: ${newResource.provider})`
        }, { headers: { 'token': token }});
        alert('Resource updated successfully');
      } else {
        await api.post('/api/resource/resources', {
          type: newResource.type,
          capacity: parseInt(newResource.capacity),
          provider: newResource.provider,
          location: newResource.location
        }, { headers: { 'token': token }});
        alert('Resource added successfully');
      }
      
      setShowAddResource(false);
      setNewResource({ type: '', capacity: '', provider: '', location: '' });
      setEditingId(null);
      loadAll();
    } catch (e) {
      console.error(e);
      if (e.code === "ERR_NETWORK") {
        alert("Network Error: Please check if the backend is running and CORS is configured.");
      } else {
        alert(`Failed to save resource: ${e.response?.data?.detail || e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (resource) => {
    let loc = resource.location || '';
    let prov = '';
    if (loc.includes('(Provider:')) {
      const parts = loc.split('(Provider:');
      loc = parts[0].trim();
      prov = parts[1].replace(')', '').trim();
    }

    setNewResource({
      type: resource.type,
      capacity: resource.capacity,
      provider: prov,
      location: loc
    });
    setEditingId(resource.id);
    setShowAddResource(true);
  };

  const handleDeleteResource = async (id) => {
    if(!window.confirm("Are you sure you want to delete this resource?")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('crisisnet_token');
      await api.delete(`/api/resource/resources/${id}`, { headers: { 'token': token }});
      loadAll();
    } catch(e) {
      console.error(e);
      alert("Failed to delete resource");
    } finally {
      setLoading(false);
    }
  };

  const assignResource = (crisis, resource) => {
    const amt = Number(resAmounts[resource.id]) || 0;
    const stats = getResStats(resource);

    if (amt <= 0) {
      alert("Enter valid amount");
      return;
    }
    if (amt > stats.remaining) {
      alert(`Only ${stats.remaining} available`);
      return;
    }

    const newAssign = {
      assignment_id: `RES_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      crisis_id: crisis.alert_id || crisis.id,
      resource_id: resource.id,
      resource_type: resource.type,
      resource_capacity: amt,
      crisis_type: crisis.crisis_type,
      location: crisis.location,
      message: crisis.message,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
      type: 'resource'
    };

    const all = [...assignments, newAssign];
    localStorage.setItem('resource_assignments', JSON.stringify(all));
    setAssignments(all);

    const volTasks = JSON.parse(localStorage.getItem('volunteer_tasks') || '[]');
    volTasks.push({
      ...newAssign,
      volunteer_name: `Resource: ${resource.type}`,
      volunteer_phone: `Capacity: ${resource.capacity}`
    });
    localStorage.setItem('volunteer_tasks', JSON.stringify(volTasks));

    if (stats.remaining - amt <= 0 && resource.available) {
      toggleResourceAvail(resource.id, true);
    }

    alert(`Assigned ${amt} of ${resource.type}`);
    setResAmounts(prev => ({ ...prev, [resource.id]: '' }));
    loadAll();
  };

  const getAssignCount = (cid) => {
    return assignments.filter(a => a.crisis_id === cid).length;
  };

  const getReqForCrisis = (cid) => {
    return requests.find(r => r.crisis_id === cid && r.status !== 'CANCELLED');
  };

  const getResStats = (res) => {
    const resAssigns = assignments.filter(a => a.resource_id === res.id);
    const used = resAssigns.reduce((sum, a) => sum + (Number(a.resource_capacity) || 0), 0);
    const total = Number(res.capacity) || 0;
    return { used, total, remaining: Math.max(0, total - used) };
  };

  const getPriority = (trust, type) => {
    const urgent = ['fire', 'medical', 'violence', 'earthquake'];
    const isUrg = urgent.includes(type?.toLowerCase());
    
    if (trust >= 0.65 && isUrg) return { level: 'CRITICAL', color: 'text-red-400 bg-red-500/10', bgColor: 'bg-red-500/10' };
    if (trust >= 0.65) return { level: 'HIGH', color: 'text-orange-400 bg-orange-500/10', bgColor: 'bg-orange-500/10' };
    if (trust >= 0.45) return { level: 'MEDIUM', color: 'text-yellow-400 bg-yellow-500/10', bgColor: 'bg-yellow-500/10' };
    return { level: 'LOW', color: 'text-green-400 bg-green-500/10', bgColor: 'bg-green-500/10' };
  };

  // Filter crises based on search
  const filteredCrises = crises.filter(crisis => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      crisis.crisis_type?.toLowerCase().includes(query) ||
      crisis.message?.toLowerCase().includes(query) ||
      crisis.location?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const totalResources = resources.length;
  const availableResources = resources.filter(r => getResStats(r).remaining > 0).length;
  const activeCrises = crises.length;
  const pendingAssignments = assignments.filter(a => a.status === 'assigned').length;

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-lg sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                CrisisNet
              </span>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/resource" className="text-sm font-medium text-blue-400 border-b-2 border-blue-500 pb-1">
                Resource Manager
              </Link>
              <Link to="/authority" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition">
                Authority Dashboard
              </Link>
              
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-300">{user?.name || user?.username || "Resource Manager"}</span>
                <span className="text-xs text-slate-500">Admin Access</span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="text-sm border border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-800 transition flex items-center gap-2 text-slate-300"
            >
              <XCircle className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-[96%] mx-auto py-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Resource Management</h1>
              <p className="text-slate-400">Coordinate volunteers, equipment, and emergency assets</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Operational</span>
              </div>
              
              <button
                onClick={loadAll}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition text-slate-300"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs text-slate-500">Active</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{activeCrises}</div>
              <div className="text-sm text-slate-400">Active Crises</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Package className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xs text-slate-500">Available</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{availableResources}</div>
              <div className="text-sm text-slate-400">Resources Ready</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-xs text-slate-500">Total</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{volunteers.length}</div>
              <div className="text-sm text-slate-400">Volunteers</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs text-slate-500">Pending</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{pendingAssignments}</div>
              <div className="text-sm text-slate-400">Assignments</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {/* Tabs Header */}
          <div className="border-b border-slate-700 p-5">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-white">Crisis Response</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTab('alerts')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      tab === 'alerts' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                    }`}
                  >
                    Crisis Alerts
                  </button>
                  <button
                    onClick={() => setTab('resources')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      tab === 'resources' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                    }`}
                  >
                    Resource Inventory
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search crises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full lg:w-64 pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {tab === 'alerts' && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Active Crisis Alerts</h3>
                  <span className="text-sm text-slate-400">{filteredCrises.length} active</span>
                </div>
                
                {filteredCrises.length === 0 ? (
                  <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-slate-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-slate-300 mb-2">No Active Crises</h4>
                    <p className="text-slate-500">All emergencies are currently being managed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCrises.map((c) => {
                      const label = CRISIS_LABELS[c.crisis_type] || c.crisis_type;
                      const emoji = CRISIS_EMOJIS[c.crisis_type] || '⚠️';
                      const assignCnt = getAssignCount(c.alert_id || c.id);
                      const req = getReqForCrisis(c.alert_id || c.id);
                      const pri = getPriority(c.trust_score, c.crisis_type);
                      
                      return (
                        <div
                          key={c.alert_id || c.id}
                          className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer backdrop-blur-sm"
                        >
                          <div className="flex flex-col lg:flex-row justify-between gap-4">
                            {/* Left Section - Crisis Info */}
                            <div className="flex-1">
                              <div className="flex items-start gap-4">
                                <div className="text-4xl">{emoji}</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-white text-lg">{label}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${pri.bgColor} ${pri.color}`}>
                                      {pri.level}
                                    </span>
                                    {assignCnt > 0 && (
                                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                                        {assignCnt} assigned
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                                    <MapPin className="w-4 h-4" />
                                    <LocationDisplay alert={c} />
                                  </div>
                                  
                                  {c.message && (
                                    <p className="text-sm text-slate-300 line-clamp-2">
                                      {c.message}
                                    </p>
                                  )}
                                  
                                  {/* Trust Score */}
                                  <div className="mt-3 flex items-center gap-2">
                                    <div className="text-xs text-slate-500">Trust Score:</div>
                                    <div className="w-24 bg-slate-700 rounded-full h-2">
                                      <div 
                                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
                                        style={{ width: `${(c.trust_score * 100)}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-sm font-semibold text-white">
                                      {(c.trust_score * 100).toFixed(0)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Section - Actions */}
                            <div className="lg:w-64">
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  {(req || assignCnt > 0) && (
                                    <button
                                      onClick={() => setViewAssignments(c)}
                                      className="flex-1 py-2 px-3 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 font-semibold rounded-lg transition border border-teal-600/30 flex items-center justify-center gap-2 text-sm"
                                    >
                                      <Eye className="w-3 h-3" />
                                      View Assignments
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setSelectedCrisis(c)}
                                    className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm"
                                  >
                                    <Users className="w-3 h-3" />
                                    {req ? 'Add Volunteers' : 'Assign Volunteers'}
                                  </button>
                                </div>
                                <button
                                  onClick={() => setSelectedForResource(c)}
                                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                                >
                                  <Package className="w-4 h-4" />
                                  Assign Resources
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {tab === 'resources' && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Resource Inventory</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">
                      {availableResources} available of {totalResources} total
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setNewResource({ type: '', capacity: '', provider: '', location: '' });
                        setShowAddResource(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Resource
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map(r => {
                    const stats = getResStats(r);
                    const usagePercent = (stats.used / stats.total) * 100;
                    
                    return (
                      <div key={r.id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white">{r.type}</h4>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>ID: {r.id.substring(0, 8)}...</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {r.available ? 'Available' : 'Allocated'}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditClick(r)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded border border-slate-700 transition"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteResource(r.id)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-red-400 rounded border border-slate-700 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Capacity Usage</span>
                            <span className="text-white font-semibold">{stats.used}/{stats.total}</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${usagePercent}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-slate-500">Available: {stats.remaining}</span>
                            <span className="text-slate-500">Used: {stats.used}</span>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="w-3 h-3" />
                          <LocationDisplay alert={{ location: r.location }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Volunteer Assignment Modal */}
      {selectedCrisis && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Assign Volunteers</h2>
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="text-2xl">{CRISIS_EMOJIS[selectedCrisis.crisis_type] || '⚠️'}</div>
                  <div>
                    <div>{CRISIS_LABELS[selectedCrisis.crisis_type] || selectedCrisis.crisis_type}</div>
                    <div className="text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <LocationDisplay alert={selectedCrisis} />
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCrisis(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
              {selectedCrisis.message && (
                <p className="text-slate-300 mb-3">{selectedCrisis.message}</p>
              )}
              
              <div className="mb-4">
                <h3 className="font-bold text-white mb-2">Required Skills:</h3>
                <div className="flex gap-2 flex-wrap">
                  {(SKILL_MAP[selectedCrisis.crisis_type] || ['first_aid', 'rescue']).map(s => (
                    <span key={s} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-500/30">
                      {s.replace('_', ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-white mb-2">
                  Number of Volunteers Needed
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="1" 
                    max="50"
                    value={volCount}
                    onChange={(e) => setVolCount(parseInt(e.target.value) || '')}
                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-sm text-slate-400">volunteers</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSelectedCrisis(null);
                  setSelectedForResource(selectedCrisis);
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition border border-slate-700 flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                Assign Resources First
              </button>
              
              <button
                onClick={() => postVolRequest(selectedCrisis)}
                className="py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Post Volunteer Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Assignment Modal */}
      {selectedForResource && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Assign Resources</h2>
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="text-2xl">{CRISIS_EMOJIS[selectedForResource.crisis_type] || '⚠️'}</div>
                  <div>
                    <div>{CRISIS_LABELS[selectedForResource.crisis_type] || selectedForResource.crisis_type}</div>
                    <div className="text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <LocationDisplay alert={selectedForResource} />
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedForResource(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Available Resources</h3>
              
              {resources.filter(r => getResStats(r).remaining > 0).length === 0 ? (
                <div className="text-center py-8 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-xl font-semibold text-slate-300 mb-2">No Resources Available</h4>
                  <p className="text-slate-500">All resources are currently allocated</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.filter(r => getResStats(r).remaining > 0).map(res => {
                    const stats = getResStats(res);
                    return (
                      <div key={res.id} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-blue-500/50 transition">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-white">{res.type}</div>
                            <div className="text-sm text-slate-400">ID: {res.id}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">{stats.remaining}</div>
                            <div className="text-xs text-slate-500">available</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 items-center">
                          <input 
                            type="number" 
                            placeholder="Amount"
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                            min="1"
                            max={stats.remaining}
                            value={resAmounts[res.id] || ''}
                            onChange={(e) => setResAmounts(prev => ({ ...prev, [res.id]: e.target.value }))}
                          />
                          <button
                            onClick={() => assignResource(selectedForResource, res)}
                            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg transition"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assignments View Modal */}
      {viewAssignments && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Current Assignments</h2>
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="text-2xl">{CRISIS_EMOJIS[viewAssignments.crisis_type] || '⚠️'}</div>
                  <div>{CRISIS_LABELS[viewAssignments.crisis_type] || viewAssignments.crisis_type}</div>
                </div>
              </div>
              <button
                onClick={() => setViewAssignments(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Volunteers Section */}
              <div>
                {(() => {
                  const req = getReqForCrisis(viewAssignments.alert_id || viewAssignments.id);
                  const cnt = req?.accepted_volunteers?.length || 0;
                  return (
                    <>
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Volunteer Assignments ({cnt}{req ? ` / ${req.volunteers_needed}` : ''})
                      </h3>
                      {cnt === 0 ? (
                        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
                          <p className="text-slate-400 italic">No volunteers assigned yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {volunteers
                            .filter(v => req.accepted_volunteers.includes(v.id))
                            .map(v => (
                              <div key={v.id} className="p-4 border border-slate-700 rounded-xl bg-slate-800/30">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-bold text-white">{v.name}</div>
                                    <div className="text-sm text-slate-400">📱 {v.phone}</div>
                                  </div>
                                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30">
                                    Accepted
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Resources Section */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  Resource Assignments
                </h3>
                {(() => {
                  const cid = viewAssignments.alert_id || viewAssignments.id;
                  const crisisAssigns = assignments.filter(a => a.crisis_id === cid);
                  
                  if (crisisAssigns.length === 0) {
                    return (
                      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
                        <p className="text-slate-400 italic">No resources assigned yet</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {crisisAssigns.map(a => (
                        <div key={a.assignment_id} className="p-4 border border-slate-700 rounded-xl bg-slate-800/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-white">{a.resource_type}</div>
                              <div className="text-sm text-slate-400">Quantity: {a.resource_capacity}</div>
                              <div className="text-xs text-slate-500 mt-2">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Assigned: {new Date(a.assigned_at).toLocaleString()}
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full border border-amber-500/30">
                              {a.status || 'Assigned'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Detail Modal */}
      {viewResourceDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Resource Details</h2>
                <p className="text-slate-400 text-sm">{viewResourceDetail.id} • {viewResourceDetail.type}</p>
              </div>
              <button
                onClick={() => setViewResourceDetail(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400">Total Capacity</div>
                  <div className="text-2xl font-bold text-white">{viewResourceDetail.capacity}</div>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400">Currently Used</div>
                  <div className="text-2xl font-bold text-orange-400">{getResStats(viewResourceDetail).used}</div>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400">Available</div>
                  <div className="text-2xl font-bold text-green-400">{getResStats(viewResourceDetail).remaining}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Assignment History
              </h3>
              {(() => {
                const resAssigns = assignments.filter(a => a.resource_id === viewResourceDetail.id);
                
                if (resAssigns.length === 0) {
                  return (
                    <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
                      <p className="text-slate-400 italic">No assignments recorded</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {resAssigns.map(a => {
                      const crisis = crises.find(c => (c.alert_id || c.id) === a.crisis_id);
                      return (
                        <div key={a.assignment_id} className="p-4 border border-slate-700 rounded-xl bg-slate-800/30">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-white">
                              {crisis ? (CRISIS_LABELS[crisis.crisis_type] || crisis.crisis_type) : 'Emergency'}
                            </div>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
                              {a.resource_capacity} units
                            </span>
                          </div>
                          <div className="text-sm text-slate-400 mb-2">
                            {a.location || 'Location not specified'}
                          </div>
                          <div className="text-xs text-slate-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Assigned: {new Date(a.assigned_at).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddResource && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">{editingId ? 'Edit Resource' : 'Add New Resource'}</h2>
              <button
                onClick={() => setShowAddResource(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Resource Name / Type</label>
                <input
                  type="text"
                  placeholder="e.g. Generator, Water Packs, Blankets"
                  value={newResource.type}
                  onChange={(e) => setNewResource({...newResource, type: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Capacity / Quantity</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={newResource.capacity}
                  onChange={(e) => setNewResource({...newResource, capacity: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Provider (Org or Person)</label>
                <input
                  type="text"
                  placeholder="e.g. Red Cross, John Doe"
                  value={newResource.provider}
                  onChange={(e) => setNewResource({...newResource, provider: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Central Warehouse, Sector 4"
                  value={newResource.location}
                  onChange={(e) => setNewResource({...newResource, location: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleSaveResource}
                className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'Update Resource' : 'Add Resource'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}