/**
 * Login Page
 * Professional login with location capture (CrisisNet)
 */

import { useState,useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import { useUserStore } from "../state/userStore";
import { promptTelegramConnection } from "../services/telegramUtils";
import { getBestLocation } from "../utils/location";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [geo, setGeo] = useState({ lat: null, lon: null, source: null });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);

  const handleLogin = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      // 1️⃣ Use already-detected location (or try to fetch if missing)
      const currentGeo = geo.lat == null && geo.lon == null
        ? await getBestLocation()
        : geo;

      // 2️⃣ Login API
      const data = await login(username, password, {
        lat: currentGeo.lat,
        lon: currentGeo.lon,
        manualLocation
      });

      const token = data?.access_token;
      const user = data?.user || { username };

      // 3️⃣ Persist session
      if (token) localStorage.setItem("access_token", token);

      const enrichedUser = {
        ...user,
        location: {
          lat: currentGeo.lat,
          lon: currentGeo.lon,
          manual: manualLocation,
          source: currentGeo.source
        }
      };

      localStorage.setItem("user", JSON.stringify(enrichedUser));
      setUser(enrichedUser, token);

      // 4️⃣ Telegram linking (optional)
      setTimeout(() => {
        promptTelegramConnection(enrichedUser);
      }, 500);

      // 5️⃣ Role-based redirect
      if (user.role === "volunteer") navigate("/volunteer");
      else if (user.role === "authority") navigate("/authority");
      else navigate("/citizen");

    } catch (e) {
      console.error(e);
      const msg = e?.message || "Login failed";
      if (/invalid|password|username|phone/i.test(msg)) {
        setError("Invalid credentials. If you don't have an account, please sign up first.");
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prefetch location on mount so UI shows detected value (with human-readable place)
  useEffect(() => {
    let mounted = true;
    getBestLocation().then((g) => { if (mounted) setGeo(g); });
    return () => { mounted = false; };
  }, []);

  const detectLocation = async () => {
    if (detectingLocation) return;
    setDetectingLocation(true);
    try {
      const best = await getBestLocation();
      setGeo(best);
      if (best.humanLocation) setManualLocation(best.humanLocation);
      else if (best.lat) setManualLocation(`${best.lat.toFixed(4)}, ${best.lon.toFixed(4)}`);
    } finally {
      setDetectingLocation(false);
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
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-700 font-medium hover:underline">
              Sign up
            </Link>
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

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Username or Phone
              </label>
              <input
                type="text"
                placeholder="your-username or +1234567890"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Location (auto‑detected)
              </label>
              <input
                type="text"
                placeholder="Enter manually if needed (e.g. Delhi)"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                onFocus={() => detectLocation()}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              />
              <p className="text-xs text-slate-500 mt-1">
                Used for nearby alerts, shelters, and volunteer matching
              </p>
              <p className="text-xs text-slate-500 mt-1">
                📍 Detected: {detectingLocation ? 'Detecting location...' : (geo.humanLocation ? geo.humanLocation : (geo.lat ? `${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}` : 'Detecting automatically...'))}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Don’t have an account?{" "}
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
