import React from 'react';
import { User, MapPin, Phone, Hash } from 'lucide-react';

const CitizenProfileCard = ({ user }) => {
  const getLocationDisplay = () => {
    if (user?.location) return user.location;
    if (user?.latitude !== undefined && user?.longitude !== undefined) {
      if (user.latitude === 0 && user.longitude === 0) return "Location not set";
      return `${user.latitude}, ${user.longitude}`;
    }
    return "Detecting...";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6 text-slate-700">
        <User className="w-5 h-5" />
        <h3 className="font-bold">Citizen Profile</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-500 uppercase font-semibold">Name</label>
          <p className="text-slate-900 font-medium">{user?.name || user?.username || "Guest Citizen"}</p>
        </div>
        {user?.phone && (
          <div>
            <label className="text-xs text-slate-500 uppercase font-semibold">Phone</label>
            <p className="text-slate-900 font-medium flex items-center gap-1">
              <Phone className="w-3 h-3" /> {user.phone}
            </p>
          </div>
        )}
        <div>
          <label className="text-xs text-slate-500 uppercase font-semibold">Location</label>
          <p className="text-slate-900 font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {getLocationDisplay()}
          </p>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase font-semibold">Status</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-slate-700">Safe</span>
          </div>
        </div>
        {user?.user_id && (
          <div className="pt-2">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">
              <Hash className="w-3 h-3" /> ID: {user.user_id}
            </div>
          </div>
        )}
        <div className="pt-4 border-t border-slate-100">
          <button className="w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition">
            Update Medical Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitizenProfileCard;