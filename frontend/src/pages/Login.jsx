/**
 * Login Page
 * Professional login with consistent CrisisNet branding
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import { useUserStore } from "../state/userStore";
import { promptTelegramConnection } from "../services/telegramUtils";

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

      if (token) localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user, token);

      setTimeout(() => {
        promptTelegramConnection(user);
      }, 500);

      if (user.role === "volunteer") navigate("/volunteer");
      else if (user.role === "authority") navigate("/authority");
      else navigate("/dashboard");
    } catch (e) {
      console.error(e);
      const msg = e.message || String(e) || "Login failed";
      if (/invalid username|invalid phone|invalid username\/phone|password/i.test(msg)) {
        setError("Invalid credentials. If you don't have an account, please sign up first.");
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">CN</span>
            </div>
            <span className="font-bold text-slate-900">CrisisNet</span>
          </Link>
          <p className="text-sm text-slate-600">
            Don't have an account? <Link to="/signup" className="text-blue-700 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </header>

      {/* Login Form */}
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h1>
            <p className="text-slate-600">Access your CrisisNet dashboard</p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Username or Phone
              </label>
              <input
                type="text"
                placeholder="your-username or +1234567890"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-700 font-medium hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
