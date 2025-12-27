/**
 * App.jsx
 * -------
 * Root routing configuration.
 *
 * Keeps different user roles separated
 * while sharing the same underlying system.
 *
 * In a real deployment, access would be
 * role-based (citizen / NGO / authority).
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Citizen from "./pages/citizen";
import NGO from "./pages/ngo";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Citizen />} />
        <Route path="/ngo" element={<NGO />} />
      </Routes>
    </BrowserRouter>
  );
}
