// Minimal auth service used by the Login page (development placeholder)

export async function login(username, password) {
  if (!username) throw new Error('username required');
  // In dev, accept any credentials and return a mock user
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ok: true, user: { username } }), 200);
  });
}
