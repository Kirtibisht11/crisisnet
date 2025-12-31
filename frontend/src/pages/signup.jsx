import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signup, login } from "../services/auth";
import { useUserStore } from "../state/userStore";
import { getBestLocation } from "../utils/location";

export default function Signup() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);

  const loc = useLocation();
  const [role, setRole] = useState(() =>
    "citizen"
  );
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
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <Link to="/" className="font-bold text-xl tracking-tight">CrisisNet</Link>
          <p className="text-sm text-slate-400">
            Already a member?{" "}
            <Link to="/login" className="text-blue-400 font-medium hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
      </header>

      {/* Signup Form */}
      <div className="w-[96%] mx-auto py-12 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Create Account
            </h1>
            <p className="text-slate-600">
              Join CrisisNet to coordinate emergency response
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium mb-2">Your Role</label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
              >
                <option value="citizen">Citizen / Resident</option>
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
                placeholder="John Doe"
              />
              {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
                placeholder="+1 555 000 0000"
              />
              {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Location (auto‑detected)
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
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">
                Used for alerts, shelters & volunteer matching
              </p>
            </div>

            {/* Location Preview */}
            <div className="p-3 bg-slate-50 border rounded-lg">
              <p className="text-sm text-slate-700">
                Detected: {detectingLocation ? 'Detecting location...' : (location.humanLocation
                  ? location.humanLocation
                  : (location.lat
                      ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
                      : "Detecting automatically…"))}
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors pr-10"
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
              {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:outline-none transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
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
                <p className="text-red-600 text-sm">{errors.confirmPassword}</p>
              )}
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border rounded-lg">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60 hover:bg-blue-700 transition-colors"
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup_authority')}
              className="w-full mt-3 py-3 rounded-lg bg-slate-200 text-slate-900 font-semibold hover:bg-slate-300 transition-colors"
            >
              Sign up as Authority
            </button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}