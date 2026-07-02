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
    const { id } = req.query;
    const b = req.body || {};

    if (!id) return res.status(400).json({ error: 'Item ID required' });

    if (req.method === 'PUT') {
      return res.json(await withClient(async (client) => {
        const { rows } = await client.query('SELECT * FROM items WHERE id = $1', [id]);
        if (rows.length === 0) throw Object.assign(new Error('Item not found'), { status: 404 });
        const e = rows[0];
        const name = b.name ?? e.name;
        const sku = b.sku ?? e.sku;
        const qty = b.qty !== undefined ? Number(b.qty) : Number(e.qty);
        const unit = b.unit ?? e.unit;
        const lowStockThreshold = b.lowStockThreshold !== undefined ? Number(b.lowStockThreshold) : Number(e.low_stock_threshold);
        const costPrice = b.costPrice !== undefined ? Number(b.costPrice) : parseFloat(e.cost_price);
        const salePrice = b.salePrice !== undefined ? Number(b.salePrice) : parseFloat(e.sale_price);
        await client.query(
          'UPDATE items SET name=$1, sku=$2, qty=$3, unit=$4, low_stock_threshold=$5, cost_price=$6, sale_price=$7 WHERE id=$8',
          [name, sku, qty, unit, lowStockThreshold, costPrice, salePrice, id]
        );
        return { id, groupId: e.group_id, name, sku, qty, unit, lowStockThreshold, costPrice, salePrice };
      }));
    }

    if (req.method === 'DELETE') {
      await withClient((client) => client.query('DELETE FROM items WHERE id = $1', [id]));
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
