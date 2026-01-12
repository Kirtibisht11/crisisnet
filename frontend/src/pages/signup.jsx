import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signup, login } from "../services/auth";
import { useUserStore } from "../state/userStore";
import { getBestLocation } from "../utils/location";

export default function Signup() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);

  const loc = useLocation();
  const [role, setRole] = useState(() => "citizen");
  const [message, setMessage] = useState(loc.state?.message || "");
  const [manualLocation, setManualLocation] = useState("");
  const [location, setLocation] = useState({ lat: null, lon: null, source: null });
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // 1️⃣ Use prefetched location (fetch if missing)
      const geo = location.lat == null && location.lon == null
        ? await getBestLocation()
        : location;
      setLocation(geo);

      // 2️⃣ Signup
      await signup(
        formData.name,
        formData.phone,
        formData.password,
        role,
        geo.lat,
        geo.lon,
        manualLocation
      );

      // 3️⃣ Auto‑login
      const auth = await login(formData.phone, formData.password);
      const token = auth?.access_token;
      const user = auth?.user;

      const enrichedUser = {
        ...user,
        location: {
          lat: geo.lat,
          lon: geo.lon,
          manual: manualLocation,
          source: geo.source
        }
      };

      if (token) localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(enrichedUser));
      setUser(enrichedUser, token);

      // 4️⃣ Role‑based redirect
      if (role === "authority") navigate("/authority");
      else navigate("/citizen");

    } catch (err) {
      console.error("Signup error", err);
      setErrors({ submit: err?.message || "Registration failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prefetch location on mount so signup form can show it (includes human-readable place)
  React.useEffect(() => {
    let mounted = true;
    getBestLocation().then((g) => { if (mounted) setLocation(g); });
    return () => { mounted = false; };
  }, []);

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
              backgroundImage: "url('https://images.unsplash.com/photo-1609188076864-c35269136352?q=80&w=1200')",
              backgroundPosition: "center center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-slate-900/70 to-slate-900/90"></div>
          </div>

          {/* Diagonal Cut Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent"></div>
          <svg className="absolute right-0 top-0 h-full w-24 text-slate-900" preserveAspectRatio="none" viewBox="0 0 100 1000">
            <polygon points="0,0 100,0 100,1000 50,1000" fill="currentColor" />
          </svg>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white max-w-2xl">
            <div className="mb-8">
              <h1 className="text-5xl xl:text-6xl font-bold mb-6 leading-tight">
                Be Part of<br />
                Something<br />
                Bigger.
              </h1>
              <div className="w-20 h-1 bg-emerald-400 mb-6"></div>
              <p className="text-xl xl:text-2xl text-slate-200 leading-relaxed">
                Join a community of citizens, volunteers, and first responders 
                committed to making a difference when emergencies strike.
              </p>
            </div>

            <div className="space-y-4 text-slate-300">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg">Receive instant alerts for emergencies in your area</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg">Volunteer and help those in need during crises</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg">Access critical resources and shelter information</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Signup Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center bg-slate-900 relative overflow-y-auto">
          <div className="w-full max-w-md px-6 sm:px-8 py-12">
            {/* Logo/Brand */}
            <div className="mb-6">
              <div className="inline-block">
                <h2 className="text-3xl font-bold text-white tracking-tight">CrisisNet</h2>
              </div>
            </div>

            {/* Form Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
              <p className="text-slate-400">Join CrisisNet to coordinate emergency response</p>
              {message && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400">{message}</p>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Your Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                >
                  <option value="citizen">Citizen / Resident</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  placeholder="+1 555 000 0000"
                />
                {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
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
                  onFocus={async () => {
                    if (detectingLocation) return;
                    setDetectingLocation(true);
                    try {
                      const best = await getBestLocation();
                      setLocation(best);
                      if (best.humanLocation) setManualLocation(best.humanLocation);
                      else if (best.lat) setManualLocation(`${best.lat.toFixed(4)}, ${best.lon.toFixed(4)}`);
                    } finally {
                      setDetectingLocation(false);
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Used for alerts, shelters & volunteer matching
                </p>
                <p className="text-xs text-emerald-400 mt-1">
                  {detectingLocation ? 'Detecting location...' : (location.humanLocation
                    ? `📍 ${location.humanLocation}`
                    : (location.lat
                        ? `📍 ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
                        : "Detecting automatically…"))}
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all pr-11"
                    placeholder="••••••••"
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
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all pr-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? (
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
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {errors.submit && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{errors.submit}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40"
              >
                {isSubmitting ? "Creating account…" : "Create Account"}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/signup_authority')}
                className="w-full py-3 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-all border border-slate-600"
              >
                Sign up as Authority
              </button>
            </div>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{" "}
                <Link to="/login" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}