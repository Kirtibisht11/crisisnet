// Auth service: calls backend /auth/login
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function login(username, phoneOrPassword) {
  if (!username) throw new Error('username required');

  const payload = { username };
  // If a phone-like value provided, treat it as phone
  if (phoneOrPassword && /\+?\d+/.test(phoneOrPassword)) {
    payload.phone = phoneOrPassword;
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
