// Peptide IMS — Demo Data Seed Script
//
// Creates demo groups/items/invoice in Postgres. Auth is env-var based
// (see lib/auth.js / DEPLOY.md), so this script no longer touches a users
// table — there isn't one.
//
// Usage: npm run seed
// Reads DATABASE_URL from .env (if present) or the environment.

import { readFileSync } from 'fs';
import pg from 'pg';
const { Pool } = pg;

// Load .env if present (best-effort, no dependency on dotenv package)
try {
  const envFile = readFileSync(new URL('./.env', import.meta.url), 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch { /* no .env file, that's fine */ }

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error('Missing DATABASE_URL. Set it in a .env file or the environment.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DB, max: 1, ssl: { rejectUnauthorized: false } });

function uid() { return crypto.randomUUID(); }

async function main() {
  console.log('Peptide IMS — Seed\n');

  const client = await pool.connect();
  try {
    const { rows: dataCheck } = await client.query('SELECT COUNT(*) as cnt FROM product_groups');
    if (parseInt(dataCheck[0].cnt) > 0) {
      console.log('→ Demo data already exists, skipping.');
      console.log('\nDone. Login with the ADMIN_USERNAME / ADMIN_PASSWORD you set in env vars.');
      return;
    }

    const g1 = uid(), g2 = uid(), g3 = uid();
    const i1 = uid(), i2 = uid(), i3 = uid(), i4 = uid(), i5 = uid(), i6 = uid(), i7 = uid();
    const inv1 = uid(), li1 = uid(), li2 = uid();

    await client.query('BEGIN');
    try {
      await client.query('INSERT INTO product_groups (id, name, description) VALUES ($1,$2,$3)', [g1, 'Retatrutide', 'GLP-1/GIP/Glucagon triple agonist']);
      await client.query('INSERT INTO product_groups (id, name, description) VALUES ($1,$2,$3)', [g2, 'Semaglutide', 'GLP-1 receptor agonist']);
      await client.query('INSERT INTO product_groups (id, name, description) VALUES ($1,$2,$3)', [g3, 'BPC-157', 'Body protection compound']);

      await client.query('INSERT INTO items (id, group_id, name, sku, qty, unit, low_stock_threshold, cost_price, sale_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [i1, g1, 'Retatrutide 10mg', 'RETA-10', 45, 'vial', 10, 12.00, 35.00]);
      await client.query('INSERT INTO items (id, group_id, name, sku, qty, unit, low_stock_threshold, cost_price, sale_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [i2, g1, 'Retatrutide 15mg', 'RETA-15', 30, 'vial', 10, 16.00, 48.00]);
      await client.query('INSERT INTO items (id, group_id, name, sku, qty, unit, low_stock_threshold, cost_price, sale_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [i3, g1, 'Retatrutide 20mg', 'RETA-20', 20, 'vial', 10, 20.00, 60.00]);
      await client.query('INSERT INTO items (id, group_id, name, sku, qty, unit, low_stock_threshold, cost_price, sale_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [i4, g2, 'Semaglutide 2mg', 'SEMA-02', 60, 'vial', 15, 8.00, 25.00]);
      await client.query('INSERT INTO items (id, group_id, name, sku, qty, unit, low_stock_threshold, cost_price, sale_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [i5, g2, 'Semaglutide 5mg', 'SEMA-05', 40, 'vial', 15, 14.00, 42.00]);
      await client.query('INSERT INTO items (id, group_id, name, sku, qty, unit, low_stock_threshold, cost_price, sale_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [i6, g3, 'BPC-157 5mg', 'BPC-05', 8, 'vial', 10, 10.00, 30.00]);
      await client.query('INSERT INTO items (id, group_id, name, sku, qty, unit, low_stock_threshold, cost_price, sale_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [i7, g3, 'BPC-157 10mg', 'BPC-10', 25, 'vial', 10, 18.00, 55.00]);

      // Pull the next number from the same sequence the API uses so a
      // real invoice created right after seeding gets INV-002, not a
      // collision with the seeded INV-001.
      const { rows: seqRows } = await client.query("SELECT nextval('invoice_number_seq') AS n");
      const invNumber = `INV-${String(seqRows[0].n).padStart(3, '0')}`;

      await client.query('INSERT INTO invoices (id, number, customer_name, customer_email, customer_address, date, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [inv1, invNumber, 'John Smith', 'john@example.com', '123 High St, London E1 2AB', '2026-06-01', 'paid', 'Next day delivery']);
      await client.query('INSERT INTO invoice_items (id, invoice_id, item_id, sku, name, qty, unit_price) VALUES ($1,$2,$3,$4,$5,$6,$7)', [li1, inv1, i1, 'RETA-10', 'Retatrutide 10mg', 2, 35.00]);
      await client.query('INSERT INTO invoice_items (id, invoice_id, item_id, sku, name, qty, unit_price) VALUES ($1,$2,$3,$4,$5,$6,$7)', [li2, inv1, i4, 'SEMA-02', 'Semaglutide 2mg', 3, 25.00]);

      await client.query('COMMIT');
      console.log(`✓ Seeded 3 groups, 7 items, 1 invoice (${invNumber})`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

    console.log('\nDone. Login with the ADMIN_USERNAME / ADMIN_PASSWORD you set in env vars.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('\n✗ Seed failed:', err.message);
  process.exit(1);
});
