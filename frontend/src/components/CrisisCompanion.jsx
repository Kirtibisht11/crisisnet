/**
 * CrisisCompanion Component
 * Provides calm safety guidance to citizens.
 */

import { useState } from "react";

export default function CrisisCompanion() {
  const [type, setType] = useState("flood");
  const [message, setMessage] = useState("");

  const fetchGuidance = async () => {
    try {
      const res = await fetch(`/api/companion/${type}`);
      const data = await res.json();
      setMessage(data.guidance || "Stay safe.");
    } catch {
      setMessage("Unable to fetch guidance at the moment.");
    }
  };

  return (
    <div className="crisis-companion">
      <h3>AI Crisis Companion</h3>

      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="flood">Flood</option>
        <option value="fire">Fire</option>
        <option value="earthquake">Earthquake</option>
        <option value="medical">Medical</option>
      </select>

      <button onClick={fetchGuidance}>Get Guidance</button>

      <p>{message}</p>
    </div>
  );
}
