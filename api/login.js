import { checkCredentials, createToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // POST /api/logout
  if (req.url?.includes('/api/logout')) {
    return res.json({ ok: true });
  }

  // POST /api/login
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (!checkCredentials(username, password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  return res.json({ user: { username, role: 'admin' }, token: createToken(username) });
}
