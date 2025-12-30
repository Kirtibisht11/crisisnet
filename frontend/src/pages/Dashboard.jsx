import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { connectTelegram } from "../services/telegramUtils";
import { useUserStore } from "../state/userStore";

export default function Dashboard() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();

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
              <Link to="/dashboard" className="text-sm font-medium text-blue-700">Overview</Link>
              <Link to="/resources" className="text-sm text-slate-600 hover:text-slate-900">Resources</Link>
              <Link to="/users" className="text-sm text-slate-600 hover:text-slate-900">Users</Link>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-slate-900">{user?.name || user?.username || "User"}</p>
                <p className="text-xs text-slate-600 capitalize">{user?.role || "citizen"}</p>
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

        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="space-y-2 bg-white p-4 rounded-lg border border-slate-200">
              <Link to="/dashboard" className="block px-4 py-3 rounded-lg font-medium text-blue-700 bg-blue-50">
                Overview
              </Link>
              <Link to="/resources" className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition">
                Resources
              </Link>
              <Link to="/users" className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition">
                User Management
              </Link>
              <button
                onClick={() => user && connectTelegram(user.user_id || user.username, user.role || "citizen")}
                className="w-full mt-4 px-4 py-3 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition"
              >
                📱 Enable Telegram Alerts
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">Active Communities</p>
                <p className="text-3xl font-bold text-blue-700">100+</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">Active Volunteers</p>
                <p className="text-3xl font-bold text-green-600">5.2K</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">System Status</p>
                <p className="text-3xl font-bold text-green-600">99% Uptime</p>
              </div>
            </div>

            {/* Main Panel */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
                <div className="text-sm text-slate-500">System Status: <span className="text-green-600 font-medium">Monitoring Active</span></div>
              </div>

              {/* Crisis Detection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Crisis Detection & Response</h3>
                <p className="text-slate-600 mb-6">
                  Monitor and coordinate crisis response using our intelligent detection and allocation pipeline.
                </p>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                  <p className="text-sm text-slate-700 mb-3">
                    <strong>How it works:</strong> Our system detects emerging crises, evaluates threat levels, 
                    allocates resources, and sends real-time notifications to all stakeholders.
                  </p>
                </div>

                <button
                  id="run-pipeline-btn"
                  className="px-6 py-3 rounded-lg font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                  onClick={async () => {
                    const btn = document.getElementById('run-pipeline-btn');
                    btn.disabled = true;
                    btn.textContent = 'Running...';
                    try {
                      const { runPipeline } = await import('../services/api');
                      const res = await runPipeline();
                      alert('Pipeline completed:\n' + JSON.stringify(res.summary || res, null, 2));
                    } catch (err) {
                      console.error('Pipeline run failed', err);
                      alert('Pipeline run failed: ' + (err.message || err));
                    } finally {
                      btn.disabled = false;
                      btn.textContent = 'Run Pipeline';
                    }
                  }}
                >
                  ⚡ Run Pipeline
                </button>
              </div>

              {/* Quick Actions */}
              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/resources" className="p-4 border border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition">
                    <p className="font-medium text-slate-900">📦 Resource Manager</p>
                    <p className="text-sm text-slate-600 mt-1">Allocate resources and volunteers</p>
                  </Link>
                  <Link to="/users" className="p-4 border border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition">
                    <p className="font-medium text-slate-900">👥 User Management</p>
                    <p className="text-sm text-slate-600 mt-1">Manage community members</p>
                  </Link>
                  <button
                    onClick={() => user && connectTelegram(user.user_id || user.username, user.role || "citizen")}
                    className="p-4 border border-slate-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition text-left"
                  >
                    <p className="font-medium text-slate-900">📱 Telegram Alerts</p>
                    <p className="text-sm text-slate-600 mt-1">Receive crisis notifications</p>
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
