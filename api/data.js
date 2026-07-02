import { verifyToken } from '../lib/auth.js';
import { withClient, mapItem, mapGroup, mapInvoice, mapStockHistory, toCamelAll } from '../lib/db.js';

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
    const result = await withClient(async (client) => {
      const [groups, items, invoicesRaw, stockHistory, protocolsRaw] = await Promise.all([
        client.query('SELECT * FROM product_groups ORDER BY name'),
        client.query('SELECT * FROM items ORDER BY name'),
        client.query('SELECT * FROM invoices ORDER BY number'),
        client.query('SELECT * FROM stock_history ORDER BY date DESC LIMIT 500'),
        client.query('SELECT p.*, i.sku as item_sku, i.name as item_name FROM protocols p LEFT JOIN items i ON i.id = p.item_id ORDER BY p.name').catch(() => ({ rows: [] })),
      ]);
      const invoices = [];
      for (const inv of invoicesRaw.rows) {
        const { rows: lines } = await client.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [inv.id]);
        invoices.push(mapInvoice(inv, lines));
      }
      return {
        groups: groups.rows.map(mapGroup),
        items: items.rows.map(mapItem),
        invoices,
        stockHistory: stockHistory.rows.map(mapStockHistory),
        protocols: toCamelAll(protocolsRaw.rows),
      };
    });
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
