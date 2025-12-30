import React from 'react';
import { Siren } from 'lucide-react';

const EmergencyPanel = () => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
    <div className="flex items-center gap-2 mb-4 text-red-600">
      <Siren className="w-6 h-6" />
      <h3 className="font-bold text-lg">Emergency Actions</h3>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'Police', number: '100', bg: 'bg-blue-50 text-blue-700' },
        { label: 'Fire', number: '101', bg: 'bg-orange-50 text-orange-700' },
        { label: 'Ambulance', number: '108', bg: 'bg-red-50 text-red-700' }
      ].map((item) => (
        <div key={item.label} className={`p-3 rounded-lg text-center ${item.bg} border border-transparent hover:border-current transition cursor-pointer`}>
          <div className="text-xs font-medium uppercase opacity-70">{item.label}</div>
          <div className="text-xl font-bold">{item.number}</div>
        </div>
      ))}
    </div>
  </div>
);

export default EmergencyPanel;