import { useState, useEffect } from "react";
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

      const currentGeo = geo.lat == null && geo.lon == null
        ? await getBestLocation()
        : geo;

      //Login API
      const data = await login(username, password, {
        lat: currentGeo.lat,
        lon: currentGeo.lon,
        manualLocation
      });

      const token = data?.access_token;
      const user = data?.user || { username };

      // Persist session
      if (token) localStorage.setItem("access_token", token);

      //if user has volunteer profile attached and save ID
      if (user.volunteer || user.volunteer_id) {
        const vId = user.volunteer?.id || user.volunteer?.volunteer_id || user.volunteer_id;
        if (vId) localStorage.setItem("volunteerId", vId);
      }

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

      // Telegram linking (optional)
      setTimeout(() => {
        promptTelegramConnection(enrichedUser);
      }, 500);

      // Role-based redirect
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

  useEffect(() => {
    // Prefetch location on mount 
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
    <div className="min-h-screen bg-slate-900 font-sans overflow-hidden relative">
      {/* Diagonal Split Container */}
      <div className="min-h-screen flex relative">
        
        {/* LEFT SIDE - Hero Section with Diagonal */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('firefighter.jpg')",
              backgroundPosition: "center center", }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-slate-900/70 to-slate-900/90"></div>
          </div>

          {/* Diagonal Cut Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
          <svg className="absolute right-0 top-0 h-full w-24 text-slate-900" preserveAspectRatio="none" viewBox="0 0 100 1000">
            <polygon points="0,0 100,0 100,1000 50,1000" fill="currentColor" />
          </svg>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white max-w-2xl">
            <div className="mb-8">
              <h1 className="text-5xl xl:text-6xl font-bold mb-6 leading-tight">
                Connect.<br />
                Respond.<br />
                Save Lives.
              </h1>
              <div className="w-20 h-1 bg-blue-400 mb-6"></div>
              <p className="text-xl xl:text-2xl text-slate-200 leading-relaxed">
                Join thousands of heroes who coordinate emergency response, 
                connect volunteers, and provide life-saving assistance when it matters most.
              </p>
            </div>

            <div className="space-y-4 text-slate-300">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg">Real-time crisis alerts and emergency coordination</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg">Connect with volunteers and first responders nearby</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg">Access shelter locations and emergency resources</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center bg-slate-900 relative">
          <div className="w-full max-w-md px-6 sm:px-8 py-12">
            {/* Logo/Brand */}
            <div className="mb-8">
              <div className="inline-block">
                <h2 className="text-3xl font-bold text-white tracking-tight">CrisisNet</h2>
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
              <p className="text-slate-400">Access your CrisisNet dashboard</p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username or Phone
                </label>
                <input
                  type="text"
                  placeholder="your-username or +1234567890"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
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
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Location (auto-detected)
                </label>
                <input
                  type="text"
                  placeholder="Enter manually if needed (e.g. Delhi)"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  onFocus={() => detectLocation()}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Used for nearby alerts, shelters, and volunteer matching
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  {detectingLocation ? 'Detecting location...' : (geo.humanLocation ? `📍 ${geo.humanLocation}` : (geo.lat ? `📍 ${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}` : 'Detecting automatically...'))}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleLogin}
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-400 font-medium hover:text-blue-300 transition-colors cursor-pointer">
                Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}