/**
 * citizen.jsx
 * -----------
 * Citizen-facing dashboard.
 *
 * This page answers one question:
 * "Has something dangerous happened near me?"
 *
 * Citizens don't need technical details.
 * They just need clear, calm, verified information.
 */

import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../state/userStore';
import { useAgentStore } from "../state/agentStore";
import AgentStatusPanel from "../components/AgentStatusPanel";
import SimulateCrisis from "../components/SimulateCrisis";

export default function Citizen() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const { communicationAgent } = useAgentStore();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">CN</span>
            </div>
            <span className="font-bold text-slate-900">CrisisNet</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/citizen" className="text-sm font-medium text-blue-700">My Alerts</Link>
            <a href="#help" className="text-sm text-slate-600 hover:text-slate-900">Help</a>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <p className="font-medium text-slate-900">{user?.name || user?.username || "Citizen"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:border-slate-400 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Safety Dashboard</h1>

        <AgentStatusPanel />

        {communicationAgent.active ? (
          <div className="mt-8 p-6 bg-red-50 border-l-4 border-red-600 rounded-lg">
            <h2 className="text-xl font-bold text-red-700 mb-4">
              🚨 Emergency Alert
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Crisis Type</p>
                <p className="text-lg font-semibold text-slate-900">{communicationAgent.alert.type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Location</p>
                <p className="text-lg font-semibold text-slate-900">{communicationAgent.alert.location}</p>
              </div>
              <div className="pt-3 border-t border-red-200">
                <p className="text-sm text-red-700">
                  📱 Alert delivered via Telegram. Check your phone for emergency instructions.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-700 font-medium">✓ No active alerts. You're safe.</p>
            <p className="text-sm text-slate-600 mt-2">CrisisNet is monitoring your area 24/7</p>
          </div>
        )}

        {/* Demo-only trigger button */}
        <div className="mt-8">
          <SimulateCrisis />
        </div>
      </div>
    </div>
  );
}
