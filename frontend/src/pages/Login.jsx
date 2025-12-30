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
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);

  const handleLogin = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const data = await login(username, password);
      const token = data?.access_token;
      let user = data?.user || { username };

      // Persist token and user
      if (token) localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user, token);

      // Redirect based on role
      if (user.role === "volunteer") navigate("/volunteer");
      else if (user.role === "authority") navigate("/authority");
      else navigate("/dashboard");
    } catch (e) {
      console.error(e);
      // Show friendly message for invalid credentials
      const msg = e.message || String(e) || "Login failed";
      if (/invalid username|invalid phone|invalid username\/phone|password/i.test(msg)) {
        setError("Invalid credentials. If you don't have an account, please sign up first.");
      } else {
        setError(msg);
      }
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Login</h2>

      <input
        placeholder="Username or phone"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <button onClick={handleLogin} disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60">{isSubmitting ? 'Signing in...' : 'Login'}</button>

      {error && <p className="text-red-500 mt-3">{error}</p>}
      
      <p className="text-center mt-4 text-sm">
        Don't have an account? <a href="/signup" className="text-blue-600 hover:underline">Sign up</a>
      </p>
    </div>
  );
}
