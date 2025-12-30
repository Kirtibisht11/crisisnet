import React from 'react';
import { Siren, Phone } from 'lucide-react';

const EmergencyPanel = () => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center gap-2 mb-4 text-red-600">
      <Siren className="w-6 h-6" />
      <h3 className="font-bold text-lg">Emergency</h3>
    </div>
    <div className="space-y-3">
      {[
        { label: 'Police', number: '100', bg: 'bg-blue-50 text-blue-700 border-blue-100' },
        { label: 'Fire', number: '101', bg: 'bg-orange-50 text-orange-700 border-orange-100' },
        { label: 'Ambulance', number: '108', bg: 'bg-red-50 text-red-700 border-red-100' }
      ].map((item) => (
        <a href={`tel:${item.number}`} key={item.label} className={`flex items-center justify-between p-3 rounded-lg ${item.bg} border hover:brightness-95 transition cursor-pointer group`}>
          <div className="text-left">
            <div className="text-xs font-bold uppercase opacity-70">{item.label}</div>
            <div className="text-xl font-bold">{item.number}</div>
          </div>
          <Phone className="w-5 h-5 opacity-70 group-hover:scale-110 transition-transform" />
        </a>
      ))}
    </div>
  </div>
);

export default EmergencyPanel;