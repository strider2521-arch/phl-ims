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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    requireAuth(req);
    let dbConnected = false;
    let dbError = null;
    try {
      await withClient((client) => client.query('SELECT 1'));
      dbConnected = true;
    } catch (err) {
      dbError = err.message;
    }
    return res.json({ status: 'ok', dbConnected, dbError });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
