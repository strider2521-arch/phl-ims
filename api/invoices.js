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

function uid() { return crypto.randomUUID(); }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    requireAuth(req);
    const b = req.body || {};
    if (!b.customer || !b.customer.name || !b.items || !b.items.length) {
      return res.status(400).json({ error: 'Customer name and at least one item required' });
    }
    const result = await withTransaction(async (client) => {
      const invId = uid();
      const invStatus = b.status || 'draft';
      const decrementsStock = invStatus !== 'draft' && invStatus !== 'cancelled';

      if (decrementsStock) {
        for (const li of b.items) {
          const { rows } = await client.query('SELECT * FROM items WHERE id = $1 FOR UPDATE', [li.itemId]);
          if (rows.length > 0 && Number(li.qty) > Number(rows[0].qty)) {
            throw Object.assign(new Error(`Insufficient stock for ${li.name}`), { status: 400 });
          }
          if (rows.length > 0) {
            await client.query('UPDATE items SET qty = GREATEST(0, qty - $1) WHERE id = $2', [li.qty, li.itemId]);
          }
        }
      }

      const { rows: seqRows } = await client.query("SELECT nextval('invoice_number_seq') AS n");
      const prefix = b.invoicePrefix || 'INV-';
      const invNum = `${prefix}${String(seqRows[0].n).padStart(3, '0')}`;

      await client.query(
        'INSERT INTO invoices (id, number, customer_name, customer_email, customer_address, date, status, notes, discount_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [invId, invNum, b.customer.name, b.customer.email || '', b.customer.address || '',
         b.date || new Date().toISOString().split('T')[0], invStatus, b.notes || '', Number(b.discountAmount) || 0]
      );
      for (const li of b.items) {
        await client.query(
          'INSERT INTO invoice_items (id, invoice_id, item_id, sku, name, qty, unit_price) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [uid(), invId, li.itemId, li.sku, li.name, li.qty, li.unitPrice]
        );
      }
      return { id: invId, number: invNum };
    });
    return res.status(201).json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
