/**
 * App.jsx
 * -------
 * Root routing configuration.
 *
 * Handles routing for different user roles
 * (Citizen / NGO / Authority) under one app.
 *
 * Access control can later be enforced
 * using protected routes or role-based guards.
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Citizen from "./pages/citizen";
import NGO from "./pages/ngo";
import AuthorityDashboard from "./pages/authority";
import Login from "./pages/Login";
import Signup from "./pages/signup";
import VolunteerPage from "./pages/volunteer";
import Home from "./pages/home";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home Landing */}
        <Route path="/" element={<Home />} />

        {/* Citizen Landing */}
        <Route path="/citizen" element={<Citizen />} />

        {/* NGO Dashboard */}
        <Route path="/ngo" element={<NGO />} />

        {/* Authority Dashboard */}
        <Route path="/authority" element={<AuthorityDashboard />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup_volunteer" element={<Signup />} />
        <Route path="/volunteer" element={<VolunteerPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
