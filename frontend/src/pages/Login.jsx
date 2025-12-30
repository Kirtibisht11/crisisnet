/**
 * Login Page
 * Handles login for Citizen / Volunteer / Authority
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import { useUserStore } from "../state/userStore";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("citizen");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);

  const handleLogin = async () => {
    setError("");
    try {
      const data = await login(username, password);
      const token = data?.access_token;
      let user = data?.user || { username };

      // If backend returned a demo user without role, apply selected role
      if (!user.role) user.role = role;

      // Persist token and user
      if (token) localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user, token);

      // Redirect based on role
      if (user.role === "volunteer") navigate("/volunteer");
      else if (user.role === "authority") navigate("/authority");
      else navigate("/");
    } catch (e) {
      console.error(e);
      setError("Login failed. Check console for details.");
    }
  };

  return (
    <div className="login-page max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Login</h2>

      <label className="block text-sm text-gray-700 mb-1">Role</label>
      <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full mb-4 p-2 border rounded">
        <option value="citizen">Citizen</option>
        <option value="volunteer">Volunteer</option>
        <option value="authority">Authority</option>
      </select>

      <input
        placeholder="Username or phone"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <input
        type="password"
        placeholder="Password (optional for demo)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-2 rounded">Login</button>

      {error && <p className="text-red-500 mt-3">{error}</p>}
    </div>
  );
}
