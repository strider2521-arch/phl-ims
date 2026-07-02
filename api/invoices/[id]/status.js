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
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  try {
    requireAuth(req);
    const { id } = req.query;
    const b = req.body || {};
    if (!id) return res.status(400).json({ error: 'Invoice ID required' });
    if (!b.status) return res.status(400).json({ error: 'Status required' });
    await withClient((client) => client.query('UPDATE invoices SET status = $1 WHERE id = $2', [b.status, id]));
    return res.json({ ok: true });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
