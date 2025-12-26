/**
 * Login Page
 * Handles login for Citizen / Volunteer / Authority
 */

import { useState } from "react";
import { login } from "../services/auth";   // adjust path if needed

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      await login(username, password);
    } catch (e) {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      <h2>Login</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
