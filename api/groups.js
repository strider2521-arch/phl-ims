import crypto from 'crypto';
import { verifyToken } from '../lib/auth.js';
import { withClient } from '../lib/db.js';

function requireAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const user = verifyToken(token);
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return user;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    requireAuth(req);
    const b = req.body || {};
    if (!b.name || !String(b.name).trim()) return res.status(400).json({ error: 'Name required' });
    const newId = crypto.randomUUID();
    await withClient((client) =>
      client.query('INSERT INTO product_groups (id, name, description) VALUES ($1,$2,$3)', [newId, b.name, b.description || ''])
    );
    return res.status(201).json({ id: newId, name: b.name, description: b.description || '' });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
