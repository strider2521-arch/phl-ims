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
    if (!b.groupId || !b.name || !b.sku) return res.status(400).json({ error: 'groupId, name, sku required' });
    const newId = crypto.randomUUID();
    const qty = Number(b.qty) || 0;
    const lowStockThreshold = Number(b.lowStockThreshold) || 10;
    const costPrice = Number(b.costPrice) || 0;
    const salePrice = Number(b.salePrice) || 0;
    await withClient((client) =>
      client.query(
        'INSERT INTO items (id, group_id, name, sku, qty, unit, low_stock_threshold, cost_price, sale_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [newId, b.groupId, b.name, b.sku, qty, b.unit || 'vial', lowStockThreshold, costPrice, salePrice]
      )
    );
    return res.status(201).json({
      id: newId, groupId: b.groupId, name: b.name, sku: b.sku, qty,
      unit: b.unit || 'vial', lowStockThreshold, costPrice, salePrice,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
