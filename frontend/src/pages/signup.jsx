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
    loc?.pathname === "/signup_volunteer" ? "volunteer" : "citizen"
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
      if (role === "volunteer") navigate("/volunteer");
      else if (role === "authority") navigate("/authority");
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
            Already a member?{" "}
            <Link to="/login" className="text-blue-700 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </header>

      {/* Signup Form */}
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
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
              {role === "volunteer" ? (
                <div className="px-4 py-3 border rounded-lg bg-slate-50 text-slate-700">
                  Signing up as <strong>Volunteer</strong>
                </div>
              ) : (
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="citizen">Citizen / Resident</option>
                </select>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-lg"
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
                className="w-full px-4 py-3 border rounded-lg"
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
                className="w-full px-4 py-3 border rounded-lg"
              />
              <p className="text-xs text-slate-500 mt-1">
                Used for alerts, shelters & volunteer matching
              </p>
            </div>

            {/* Location Preview */}
            <div className="p-3 bg-slate-50 border rounded-lg">
              <p className="text-sm text-slate-700">
                📍 Detected: {detectingLocation ? 'Detecting location...' : (location.humanLocation
                  ? location.humanLocation
                  : (location.lat
                      ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
                      : "Detecting automatically…"))}
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-lg"
              />
              {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-lg"
              />
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
              className="w-full py-3 rounded-lg bg-orange-600 text-white font-semibold disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>
            {/* Volunteer signup shortcut */}
            {role !== "volunteer" && (
              <button
                type="button"
                onClick={() => navigate("/signup_volunteer")}
                className="w-full mt-3 py-3 rounded-lg border border-blue-600 text-blue-600 font-medium hover:bg-blue-50"
              >
                Sign up as Volunteer
              </button>
            )}
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-700 font-medium hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
