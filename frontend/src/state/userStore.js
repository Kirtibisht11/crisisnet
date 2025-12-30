/**
 * Auth Service
 * Handles login & signup with optional location support
 */

import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// Simple client-side user store (persisted to localStorage)
const _initialUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch (e) {
    return null;
  }
})();

export const useUserStore = create((set) => ({
  user: _initialUser,
  setUser: (user) => {
    try { localStorage.setItem('user', JSON.stringify(user)); } catch (e) {}
    set({ user });
  },
  logout: () => {
    try { localStorage.removeItem('access_token'); localStorage.removeItem('user'); } catch (e) {}
    set({ user: null });
  }
}));

/**
 * LOGIN
 * Supports username OR phone + optional location
 */
export async function login(username, password, location = {}) {
  if (!username) throw new Error("Username or phone required");
  if (!password) throw new Error("Password required");

  const payload = { password };

  // Detect phone vs username (UNCHANGED)
  if (/^\+?\d+$/.test(username)) {
    payload.phone = username.startsWith("+") ? username : "+" + username;
  } else {
    payload.username = username;
  }

  /* =======================
     🔹 ADD: Location support
     ======================= */
  if (location) {
    // New structured location (preferred)
    payload.location = {
      lat: location.lat ?? null,
      lon: location.lon ?? null,
      manualLocation: location.manualLocation ?? null
    };

    // Backward‑compat (if backend still reads flat fields)
    payload.latitude = location.lat ?? null;
    payload.longitude = location.lon ?? null;
  }
  /* ======================= */

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Login failed");
    throw new Error(errText || "Login failed");
  }

  return res.json();
}

/**
 * SIGNUP
 * Registers user with role + location
 */
export async function signup(
  name,
  phone,
  password,
  role,
  lat = null,
  lon = null,
  manualLocation = null
) {
  if (!name || !phone || !password || !role) {
    throw new Error("Name, phone, password, and role are required");
  }

  const payload = {
    name,
    phone: phone.startsWith("+") ? phone : "+" + phone,
    password,
    role,

    /* =======================
       🔹 ADD: Location support
       ======================= */
    location: {
      lat,
      lon,
      manualLocation
    },

    // Backward‑compat (old backend fields)
    latitude: lat,
    longitude: lon
    /* ======================= */
  };

  const res = await fetch(`${API_BASE}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Signup failed");
    throw new Error(errText || "Signup failed");
  }

  return res.json();
}
