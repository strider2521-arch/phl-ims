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
  try {
    requireAuth(req);

    if (req.method === 'GET') {
      const result = await withClient(async (client) => {
        const { rows } = await client.query('SELECT data FROM app_settings LIMIT 1');
        if (rows.length === 0) return {};
        return rows[0].data || {};
      });
      return res.json(result);
    }

    if (req.method === 'PUT') {
      const b = req.body || {};
      await withClient(async (client) => {
        const { rows } = await client.query('SELECT id FROM app_settings LIMIT 1');
        if (rows.length > 0) {
          await client.query('UPDATE app_settings SET data = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(b), rows[0].id]);
        } else {
          await client.query('INSERT INTO app_settings (id, data) VALUES (gen_random_uuid(), $1)', [JSON.stringify(b)]);
        }
      });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
