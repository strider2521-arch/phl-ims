import crypto from 'crypto';
import { verifyToken } from '../lib/auth.js';
import { withTransaction } from '../lib/db.js';

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
    if (!b.itemId || b.delta == null || isNaN(Number(b.delta))) {
      return res.status(400).json({ error: 'itemId and numeric delta required' });
    }
    const delta = Math.trunc(Number(b.delta));
    const result = await withTransaction(async (client) => {
      const { rows } = await client.query('SELECT * FROM items WHERE id = $1 FOR UPDATE', [b.itemId]);
      if (rows.length === 0) throw Object.assign(new Error('Item not found'), { status: 404 });
      const item = rows[0];
      const newQty = Math.max(0, Number(item.qty) + delta);
      await client.query('UPDATE items SET qty = $1 WHERE id = $2', [newQty, b.itemId]);
      await client.query(
        'INSERT INTO stock_history (id, item_id, item_name, sku, date, delta, new_qty, note) VALUES ($1,$2,$3,$4,NOW(),$5,$6,$7)',
        [crypto.randomUUID(), b.itemId, item.name, item.sku, delta, newQty, b.note || '']
      );
      return { qty: newQty };
    });
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
