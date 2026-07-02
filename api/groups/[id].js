import { verifyToken } from '../../lib/auth.js';
import { withClient } from '../../lib/db.js';

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
    const { id } = req.query;
    const b = req.body || {};

    if (!id) return res.status(400).json({ error: 'Group ID required' });

    if (req.method === 'PUT') {
      return res.json(await withClient(async (client) => {
        const { rows } = await client.query('SELECT * FROM product_groups WHERE id = $1', [id]);
        if (rows.length === 0) throw Object.assign(new Error('Group not found'), { status: 404 });
        const e = rows[0];
        const name = b.name ?? e.name;
        const description = b.description !== undefined ? b.description : e.description;
        await client.query('UPDATE product_groups SET name=$1, description=$2 WHERE id=$3', [name, description, id]);
        return { id, name, description };
      }));
    }

    if (req.method === 'DELETE') {
      await withClient((client) => client.query('DELETE FROM product_groups WHERE id = $1', [id]));
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
