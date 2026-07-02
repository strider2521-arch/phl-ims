// Peptide IMS — unified API handler
//
// Kept as a single catch-all function (rather than one file per route) on
// purpose: every Vercel serverless function file gets its own connection
// pool. Splitting routes across many files multiplies the number of pools
// that can exist concurrently under load, which is the opposite of what
// you want against a connection-limited Postgres instance. One function =
// one pool per warm instance = predictable connection usage.

import crypto from 'crypto';
import { verifyToken, createToken, checkCredentials } from '../lib/auth.js';
import {
  withClient,
  withTransaction,
  mapItem,
  mapGroup,
  mapInvoice,
  mapStockHistory,
} from '../lib/db.js';

function uid() {
  return crypto.randomUUID();
}

function requireAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const user = verifyToken(token);
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return user;
}

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  // Vercel's catch-all req.query.slug isn't always reliable, so parse the
  // path from the raw URL instead.
  const path = req.url.split('?')[0].replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const method = req.method;
  const [resource, id, sub] = path;
  const b = req.body && typeof req.body === 'object' ? req.body : {};

  try {
    // ── Login (no auth required) ──────────────────────────────
    if (method === 'POST' && resource === 'login' && path.length === 1) {
      const { username, password } = b;
      if (!username || !password) return badRequest(res, 'Username and password required');
      if (!checkCredentials(username, password)) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      return res.json({ user: { username, role: 'admin' }, token: createToken(username) });
    }

    // ── Logout ─────────────────────────────────────────────────
    if (method === 'POST' && resource === 'logout' && path.length === 1) {
      return res.json({ ok: true });
    }

    // Everything below requires a valid session token.
    requireAuth(req);

    // ── Health ─────────────────────────────────────────────────
    if (method === 'GET' && resource === 'health' && path.length === 1) {
      let dbConnected = false;
      let dbError = null;
      try {
        await withClient((client) => client.query('SELECT 1'));
        dbConnected = true;
      } catch (err) {
        dbError = err.message;
      }
      return res.json({ status: 'ok', dbConnected, dbError });
    }

    // ── Data (load everything) ────────────────────────────────
    if (method === 'GET' && resource === 'data' && path.length === 1) {
      const result = await withClient(async (client) => {
        const [groups, items, invoicesRaw, stockHistory] = await Promise.all([
          client.query('SELECT * FROM product_groups ORDER BY name'),
          client.query('SELECT * FROM items ORDER BY name'),
          client.query('SELECT * FROM invoices ORDER BY number'),
          client.query('SELECT * FROM stock_history ORDER BY date DESC LIMIT 500'),
        ]);
        const invoices = [];
        for (const inv of invoicesRaw.rows) {
          const { rows: lines } = await client.query(
            'SELECT * FROM invoice_items WHERE invoice_id = $1',
            [inv.id]
          );
          invoices.push(mapInvoice(inv, lines));
        }
        return {
          groups: groups.rows.map(mapGroup),
          items: items.rows.map(mapItem),
          invoices,
          stockHistory: stockHistory.rows.map(mapStockHistory),
        };
      });
      return res.json(result);
    }

    // ── Groups ─────────────────────────────────────────────────
    if (resource === 'groups') {
      if (method === 'POST' && path.length === 1) {
        if (!b.name || !String(b.name).trim()) return badRequest(res, 'Name required');
        const newId = uid();
        await withClient((client) =>
          client.query(
            'INSERT INTO product_groups (id, name, description) VALUES ($1,$2,$3)',
            [newId, b.name, b.description || '']
          )
        );
        return res.status(201).json({ id: newId, name: b.name, description: b.description || '' });
      }

      if (method === 'PUT' && path.length === 2) {
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

      if (method === 'DELETE' && path.length === 2) {
        await withClient((client) => client.query('DELETE FROM product_groups WHERE id = $1', [id]));
        return res.json({ ok: true });
      }
    }

    // ── Items ──────────────────────────────────────────────────
    if (resource === 'items') {
      // POST /api/items/adjust — adjust stock (transactional: update qty + log history)
      if (method === 'POST' && sub === 'adjust' && path.length === 2) {
        if (!b.itemId || b.delta == null || isNaN(Number(b.delta))) {
          return badRequest(res, 'itemId and numeric delta required');
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
            [uid(), b.itemId, item.name, item.sku, delta, newQty, b.note || '']
          );
          return { qty: newQty };
        });
        return res.json(result);
      }

      // POST /api/items — create item
      if (method === 'POST' && path.length === 1) {
        if (!b.groupId || !b.name || !b.sku) return badRequest(res, 'groupId, name, sku required');
        const newId = uid();
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
      }

      // PUT /api/items/:id — update
      if (method === 'PUT' && path.length === 2) {
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

      // DELETE /api/items/:id — delete
      if (method === 'DELETE' && path.length === 2) {
        await withClient((client) => client.query('DELETE FROM items WHERE id = $1', [id]));
        return res.json({ ok: true });
      }
    }

    // ── Invoices ───────────────────────────────────────────────
    if (resource === 'invoices') {
      // POST /api/invoices — create (transactional)
      if (method === 'POST' && path.length === 1) {
        if (!b.customer || !b.customer.name || !b.items || !b.items.length) {
          return badRequest(res, 'Customer name and at least one item required');
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

          // Atomic invoice numbering via sequence — avoids the race
          // condition where two concurrent invoice creations could read
          // the same "last number" and collide.
          const { rows: seqRows } = await client.query("SELECT nextval('invoice_number_seq') AS n");
          const invNum = `INV-${String(seqRows[0].n).padStart(3, '0')}`;

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
      }

      // PUT /api/invoices/:id/status — update status only
      if (method === 'PUT' && path.length === 3 && sub === 'status') {
        if (!b.status) return badRequest(res, 'Status required');
        await withClient((client) => client.query('UPDATE invoices SET status = $1 WHERE id = $2', [b.status, id]));
        return res.json({ ok: true });
      }

      // PUT /api/invoices/:id — update invoice (transactional: may restore + re-decrement stock)
      if (method === 'PUT' && path.length === 2) {
        const result = await withTransaction(async (client) => {
          const { rows } = await client.query('SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [id]);
          if (rows.length === 0) throw Object.assign(new Error('Invoice not found'), { status: 404 });
          const existing = rows[0];

          // If the existing invoice had already decremented stock, restore it
          // before applying any new decrements below.
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
                [uid(), id, li.itemId, li.sku, li.name, li.qty, li.unitPrice]
              );
            }
          }
          return { ok: true };
        });
        return res.json(result);
      }

      // DELETE /api/invoices/:id — delete
      if (method === 'DELETE' && path.length === 2) {
        await withClient((client) => client.query('DELETE FROM invoices WHERE id = $1', [id]));
        return res.json({ ok: true });
      }
    }

    return res.status(404).json({ error: 'Not found', path, method });
  } catch (err) {
    if (err.status === 401) return res.status(401).json({ error: 'Unauthorized' });
    const status = err.status || 500;
    console.error(`API Error [${method} /${path.join('/')}]:`, err.message);
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
}
