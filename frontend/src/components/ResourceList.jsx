import React, { useState, useMemo } from 'react';
import { useCrisisStore } from '../state/crisisStore';
import {
  Activity,
  Users,
  Truck,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const safePercent = (used, total) =>
  total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';

const ResourceList = () => {
  const { resources, volunteers, allocations } = useCrisisStore();
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('status');

  /* ---------- ALLOCATION MAPS ---------- */
  const allocationMaps = useMemo(() => {
    const resourceMap = {};
    const volunteerMap = {};

    allocations.forEach(a => {
      a.resources?.forEach(r => {
        resourceMap[r.id] = a;
      });
      a.volunteers?.forEach(v => {
        volunteerMap[v.id] = a;
      });
    });

    return { resourceMap, volunteerMap };
  }, [allocations]);

  /* ---------- STATS ---------- */
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
        utilization: safePercent(
          totalResources - availableResources,
          totalResources
        )
      },
      volunteers: {
        total: totalVolunteers,
        available: availableVolunteers,
        allocated: totalVolunteers - availableVolunteers,
        utilization: safePercent(
          totalVolunteers - availableVolunteers,
          totalVolunteers
        )
      }
    };
  }, [resources, volunteers]);

  /* ---------- FILTERING ---------- */
  const filteredResources = useMemo(() => {
    let list = [...resources];

    if (filterType === 'available') list = list.filter(r => r.available);
    if (filterType === 'allocated') list = list.filter(r => !r.available);

    if (sortBy === 'type') {
      list.sort((a, b) => a.type.localeCompare(b.type));
    } else {
      list.sort((a, b) => Number(a.available) - Number(b.available));
    }

    return list;
  }, [resources, filterType, sortBy]);

  const filteredVolunteers = useMemo(() => {
    let list = [...volunteers];

    if (filterType === 'available') list = list.filter(v => v.available);
    if (filterType === 'allocated') list = list.filter(v => !v.available);

    return list;
  }, [volunteers, filterType]);

  /* ---------- RENDER ---------- */
  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg">
      {/* ---------- HEADER ---------- */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-2xl font-bold mb-4">Resource Dashboard</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <StatCard
            label="Resources"
            icon={<Truck className="w-5 h-5 text-blue-500" />}
            value={`${stats.resources.available}/${stats.resources.total}`}
            percent={stats.resources.utilization}
            color="bg-blue-500"
          />
          <StatCard
            label="Volunteers"
            icon={<Users className="w-5 h-5 text-green-500" />}
            value={`${stats.volunteers.available}/${stats.volunteers.total}`}
            percent={stats.volunteers.utilization}
            color="bg-green-500"
          />
        </div>

        <FilterControls
          filterType={filterType}
          setFilterType={setFilterType}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </div>

      {/* ---------- LISTS ---------- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        <ResourceSection
          title="Resources"
          items={filteredResources}
          allocationMap={allocationMaps.resourceMap}
        />
        <VolunteerSection
          title="Volunteers"
          items={filteredVolunteers}
          allocationMap={allocationMaps.volunteerMap}
        />
      </div>
    </div>
  );
};

/* ---------- SUB COMPONENTS ---------- */

const StatCard = ({ label, icon, value, percent, color }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium">{label}</span>
      {icon}
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs text-gray-500">{percent}% in use</div>
    <div className="mt-2 h-2 bg-gray-200 rounded-full">
      <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
    </div>
  </div>
);

const FilterControls = ({ filterType, setFilterType, sortBy, setSortBy }) => (
  <>
    <div className="flex gap-2 mb-2">
      {['all', 'available', 'allocated'].map(type => (
        <button
          key={type}
          onClick={() => setFilterType(type)}
          className={`px-3 py-1 rounded text-sm ${
            filterType === type
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
    <select
      value={sortBy}
      onChange={e => setSortBy(e.target.value)}
      className="w-full px-3 py-2 border rounded text-sm"
    >
      <option value="status">Sort by Status</option>
      <option value="type">Sort by Type</option>
    </select>
  </>
);

const ResourceSection = ({ title, items, allocationMap }) => (
  <Section title={title} icon={<Truck className="w-5 h-5" />}>
    {items.map(r => {
      const allocation = allocationMap[r.id];
      return (
        <ItemCard
          key={r.id}
          title={r.type.toUpperCase()}
          available={r.available}
          allocation={allocation}
          location={r.location}
        />
      );
    })}
  </Section>
);

const VolunteerSection = ({ title, items, allocationMap }) => (
  <Section title={title} icon={<Users className="w-5 h-5" />}>
    {items.map(v => {
      const allocation = allocationMap[v.id];
      return (
        <ItemCard
          key={v.id}
          title={v.name || v.id}
          available={v.available}
          allocation={allocation}
          location={v.location}
          extra={`Skills: ${v.skills.join(', ')}`}
        />
      );
    })}
  </Section>
);

const Section = ({ title, icon, children }) => (
  <div>
    <h3 className="text-lg font-semibold mb-3 flex gap-2 items-center">
      {icon} {title}
    </h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const ItemCard = ({ title, available, allocation, location, extra }) => (
  <div
    className={`p-3 rounded-lg border ${
      available ? 'bg-green-50' : 'bg-orange-50'
    }`}
  >
    <div className="flex justify-between">
      <div>
        <div className="font-semibold">{title}</div>
        {extra && <div className="text-xs">{extra}</div>}
        <div className="text-xs flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
        </div>
        {!available && allocation && (
          <div className="text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Assigned to {allocation.crisis_type}
          </div>
        )}
      </div>
      {available ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <Activity className="w-4 h-4 text-orange-600 animate-pulse" />
      )}
    </div>
  </div>
);

export default ResourceList;
