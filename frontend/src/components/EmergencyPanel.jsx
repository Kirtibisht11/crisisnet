import React from 'react';
import { Siren, Phone } from 'lucide-react';

const EmergencyPanel = () => (
  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
    <div className="flex items-center gap-2 mb-4 text-red-500">
      <Siren className="w-6 h-6" />
      <h3 className="font-bold text-lg text-white">Emergency</h3>
    </div>
    <div className="space-y-3">
      {[
        { label: 'Police', number: '100', bg: 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50' },
        { label: 'Fire', number: '101', bg: 'bg-orange-900/30 text-orange-400 border-orange-800 hover:bg-orange-900/50' },
        { label: 'Ambulance', number: '108', bg: 'bg-red-900/30 text-red-400 border-red-800 hover:bg-red-900/50' }
      ].map((item) => (
        <a href={`tel:${item.number}`} key={item.label} className={`flex items-center justify-between p-3 rounded-lg ${item.bg} border transition cursor-pointer group`}>
          <div className="text-left">
            <div className="text-xs font-bold uppercase opacity-80">{item.label}</div>
            <div className="text-xl font-bold text-white">{item.number}</div>
          </div>
          <Phone className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
        </a>
      ))}
    </div>
  </div>
);

export default EmergencyPanel;