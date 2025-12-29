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
import SignupVolunteer from "./pages/signup_volunteer";
import VolunteerPage from "./pages/volunteer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Citizen Landing */}
        <Route path="/" element={<Citizen />} />

        {/* NGO Dashboard */}
        <Route path="/ngo" element={<NGO />} />

        {/* Authority Dashboard */}
        <Route path="/authority" element={<AuthorityDashboard />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup_volunteer" element={<SignupVolunteer />} />
        <Route path="/volunteer" element={<VolunteerPage />} />
      </Routes>
    </BrowserRouter>
  );
}
