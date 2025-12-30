import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("authority");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // For Round 1 demo - check localStorage
      const allUsers = JSON.parse(localStorage.getItem('crisisnet_users') || '[]');
      
      if (phone.trim() === "") {
        throw new Error("Please enter your phone number");
      }

      // Find user by phone
      const user = allUsers.find(u => u.phone === phone && u.role === role);

      if (user) {
        // User found - login successful
        localStorage.setItem('crisisnet_current_user', JSON.stringify(user));
        console.log('Login successful:', user);
        
        // Navigate to authority dashboard
        setTimeout(() => navigate('/authority'), 300);
      } else {
        // User not found - create demo user
        const demoUser = {
          id: `${role}_demo_${Date.now()}`,
          role: role,
          name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          phone: phone,
          location: 'Demo Location',
          created_at: new Date().toISOString()
        };

        // Save demo user
        allUsers.push(demoUser);
        localStorage.setItem('crisisnet_users', JSON.stringify(allUsers));
        localStorage.setItem('crisisnet_current_user', JSON.stringify(demoUser));
        
        console.log('Demo user created:', demoUser);
        
        // Navigate to authority dashboard
        setTimeout(() => navigate('/authority'), 300);
      }

    } catch (e) {
      console.error('Login error:', e);
      setError(e.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Login</h2>
          <p className="text-gray-600 mt-2">CrisisNet - Round 1 Demo</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="citizen">Citizen</option>
              <option value="volunteer">Volunteer</option>
              <option value="authority">Authority</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              placeholder="Enter your phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button 
            onClick={handleLogin} 
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 p-3 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="text-center text-sm text-gray-600 mt-4">
            Don't have an account? 
            <a href="/signup" className="text-blue-600 font-semibold ml-1 hover:underline">
              Sign up here
            </a>
          </div>

         
        </div>
      </div>
    </div>
  );
}