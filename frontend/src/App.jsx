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
import SignupVolunteer from "./pages/signup_volunteer";
import VolunteerPage from "./pages/volunteer";
import Home from "./pages/home";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import ResourceDashboard from "./pages/resource_dashboard";
import Resources from "./pages/Resources";
import SignupAuthority from "./pages/SignupAuthority";
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
      <Route path="/signup_authority" element={<SignupAuthority />} />
        {/* Authority Dashboard */}
        <Route path="/authority" element={<AuthorityDashboard />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup-volunteer" element={<SignupVolunteer />} />
 
        <Route path="/volunteer" element={<VolunteerPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/resource" element={<ResourceDashboard />} />
       <Route path="/resources" element={<Resources />} />

      </Routes>
    </BrowserRouter>
  );
}