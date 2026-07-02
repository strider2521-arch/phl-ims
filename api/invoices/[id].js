import crypto from 'crypto';
import { verifyToken } from '../lib/auth.js';
import { withClient, withTransaction } from '../lib/db.js';

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

    if (!id) return res.status(400).json({ error: 'Invoice ID required' });

    if (req.method === 'PUT') {
      const result = await withTransaction(async (client) => {
        const { rows } = await client.query('SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [id]);
        if (rows.length === 0) throw Object.assign(new Error('Invoice not found'), { status: 404 });
        const existing = rows[0];

        const existingDecremented = existing.status !== 'draft' && existing.status !== 'cancelled';
        if (existingDecremented) {
          const { rows: oldItems } = await client.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);
          for (const li of oldItems) {
            await client.query('UPDATE items SET qty = qty + $1 WHERE id = $2', [li.qty, li.item_id]);
          }
        }

        const newStatus = b.status || existing.status;
        const newDecrements = newStatus !== 'draft' && newStatus !== 'cancelled';
        if (newDecrements && b.items) {
          for (const li of b.items) {
            const { rows: si } = await client.query('SELECT * FROM items WHERE id = $1 FOR UPDATE', [li.itemId]);
            if (si.length > 0 && Number(li.qty) > Number(si[0].qty)) {
              throw Object.assign(new Error(`Insufficient stock for ${li.name}`), { status: 400 });
            }
            if (si.length > 0) {
              await client.query('UPDATE items SET qty = GREATEST(0, qty - $1) WHERE id = $2', [li.qty, li.itemId]);
            }
          }
        }

        const setClauses = [];
        const params = [];
        let idx = 1;
        if (b.customer) {
          setClauses.push(`customer_name=$${idx++}`, `customer_email=$${idx++}`, `customer_address=$${idx++}`);
          params.push(b.customer.name, b.customer.email || '', b.customer.address || '');
        }
        if (b.date !== undefined) { setClauses.push(`date=$${idx++}`); params.push(b.date); }
        if (b.status !== undefined) { setClauses.push(`status=$${idx++}`); params.push(b.status); }
        if (b.notes !== undefined) { setClauses.push(`notes=$${idx++}`); params.push(b.notes); }
        if (b.discountAmount !== undefined) { setClauses.push(`discount_amount=$${idx++}`); params.push(Number(b.discountAmount) || 0); }
        if (setClauses.length > 0) {
          params.push(id);
          await client.query(`UPDATE invoices SET ${setClauses.join(',')} WHERE id=$${idx}`, params);
        }
        if (b.items) {
          await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
          for (const li of b.items) {
            await client.query(
              'INSERT INTO invoice_items (id, invoice_id, item_id, sku, name, qty, unit_price) VALUES ($1,$2,$3,$4,$5,$6,$7)',
              [crypto.randomUUID(), id, li.itemId, li.sku, li.name, li.qty, li.unitPrice]
            );
          }
        }
        return { ok: true };
      });
      return res.json(result);
    }

    if (req.method === 'DELETE') {
      await withClient((client) => client.query('DELETE FROM invoices WHERE id = $1', [id]));
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
