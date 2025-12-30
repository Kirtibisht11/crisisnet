import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 bg-white rounded-lg shadow p-4">
          <h3 className="text-xl font-semibold mb-2">CrisisNet</h3>
          <p className="text-sm text-gray-600 mb-4">Real-time crisis alerts and coordination platform.</p>

          <nav className="space-y-2">
            <Link to="/dashboard" className="block text-sm text-blue-600">Overview</Link>
            <Link to="/citizen" className="block text-sm text-gray-700">My Alerts</Link>
            <Link to="/volunteer" className="block text-sm text-gray-700">Volunteer Hub</Link>
            <Link to="/ngo" className="block text-sm text-gray-700">NGO Panel</Link>
            <Link to="/authority" className="block text-sm text-gray-700">Authority</Link>
          </nav>

          <div className="mt-6 p-3 bg-blue-50 rounded">
            <h4 className="text-sm font-medium">How it works</h4>
            <p className="text-xs text-gray-600 mt-2">CrisisNet detects incidents from reports and sensors, sends alerts, and helps coordinate responders.</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Dashboard</h2>
              <div className="text-sm text-gray-500">Status: <span className="text-green-600 font-medium">Monitoring</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="col-span-2 bg-gray-50 p-4 rounded">
                <h3 className="text-lg font-medium mb-2">Crisis Detection</h3>
                <p className="text-sm text-gray-600">System is actively analysing incoming reports. Latest events will appear here.</p>

                <div className="mt-4 p-3 bg-white border rounded">
                  <p className="text-sm text-gray-700">No active crises detected.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="text-lg font-medium mb-2">Quick Actions</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/users" className="text-blue-600">User Management</Link></li>
                  <li><a className="text-blue-600" href="#">Trigger Drill</a></li>
                  <li><a className="text-blue-600" href="#">Send Broadcast</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-lg font-medium mb-2">Recent Activity</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="p-3 bg-gray-50 rounded">No recent events.</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
