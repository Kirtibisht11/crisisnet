import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../state/userStore';

export default function Users() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
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
            <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">Dashboard</Link>
            <Link to="/resources" className="text-sm text-slate-600 hover:text-slate-900">Resources</Link>
            <Link to="/users" className="text-sm font-medium text-blue-700">Users</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <p className="font-medium text-slate-900">{user?.name || user?.username || "User"}</p>
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
            <Link to="/dashboard" className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition">
              Dashboard
            </Link>
            <Link to="/resources" className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition">
              Resources
            </Link>
            <Link to="/users" className="block px-4 py-3 rounded-lg font-medium text-blue-700 bg-blue-50">
              Users
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">User Management</h2>

            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto mb-3"></div>
                  <p className="text-sm">Loading users...</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800"><strong>Error:</strong> {error}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-600">No users found in the system.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Role</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.user_id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.user_id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                        <td className="px-4 py-3 text-slate-600">{u.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-xs text-slate-600 text-center">
                  Showing {users.length} user{users.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
