// Auth service: calls backend /auth/login
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function login(username, password) {
  if (!username) throw new Error('Username or phone required');
  if (!password) throw new Error('Password required');

  const payload = { password };
  // If a phone-like value provided, treat it as phone
  if (/\+?\d+/.test(username)) {
    payload.phone = username;
  } else {
    payload.username = username;
  }

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Login failed');
    throw new Error(errText || 'Login failed');
  }

  const data = await res.json();
  return data;
}

export async function signup(name, phone, password, role, latitude = 0.0, longitude = 0.0) {
  if (!name || !phone || !password || !role) {
    throw new Error('Name, phone, password, and role are required');
  }

  const payload = {
    name,
    phone: phone.startsWith('+') ? phone : '+' + phone,
    password,
    role,
    latitude,
    longitude
  };

  const res = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Signup failed');
    throw new Error(errText || 'Signup failed');
  }

  const data = await res.json();
  return data;
}
