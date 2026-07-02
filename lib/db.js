// ── Database layer ──────────────────────────────────────────────
//
// This module is the single place that talks to Postgres. It exists to fix
// three real bugs that were causing crashes and silent data corruption in
// the previous version of this app:
//
// 1. CRASHING PROCESS: node-postgres's Pool emits an 'error' event whenever
//    a pooled/idle client hits a network problem (which happens often on
//    Supabase's pooler). If nothing listens for that event, Node treats it
//    as an uncaught exception and KILLS THE WHOLE SERVERLESS FUNCTION
//    INSTANCE — even for requests that had nothing to do with the broken
//    connection. We attach a listener below and drop/rebuild the pool
//    instead of letting it crash the process.
//
// 2. POISONED CONNECTIONS: the old code ran `BEGIN` ... `COMMIT` for
//    multi-step writes (stock adjustments, invoice creation) but never
//    issued `ROLLBACK` if a query in between failed. A client left in an
//    aborted-transaction state was then released back to the pool and
//    reused for the NEXT unrelated request, which would then fail too.
//    `withTransaction()` below always rolls back on error before releasing.
//
// 3. WRONG POOLER FOR SERVERLESS: Supabase's "Session pooler" (port 5432)
//    hands each client a dedicated Postgres backend connection for the
//    life of the connection — fine for long-lived servers, terrible for
//    serverless, where every concurrent invocation opens a new connection
//    and can exhaust Supabase's connection limit within seconds. The
//    "Transaction pooler" (port 6543, PgBouncer in transaction mode) is
//    built for exactly this pattern: many short-lived clients sharing a
//    small number of real backend connections. See DEPLOY.md.

import pg from 'pg';
const { Pool } = pg;

let pool = null;
let poolCreatedAt = 0;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables ' +
      '(use the Supabase Transaction Pooler connection string, port 6543).'
    );
  }

  const p = new Pool({
    connectionString,
    // Serverless: each function instance only ever needs a couple of
    // connections at a time. Keep this low — PgBouncer's transaction
    // pooler on Supabase's side is what actually absorbs concurrency
    // across many function instances.
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
    query_timeout: 15_000,
    // Supabase's pooler terminates TLS with a cert chain that some
    // serverless Node runtimes don't have in their trust store by
    // default. This avoids spurious "self signed certificate" failures
    // while still using an encrypted connection.
    ssl: { rejectUnauthorized: false },
  });

  // THE CRITICAL FIX: without this handler, any idle-client error crashes
  // the entire function process.
  p.on('error', (err) => {
    console.error('[db] pool error on idle client — recycling pool:', err.message);
    pool = null;
  });

  poolCreatedAt = Date.now();
  return p;
}

export function getPool() {
  if (!pool) pool = createPool();
  return pool;
}

/**
 * Run fn(client) with a connection checked out from the pool, guaranteeing
 * the client is always released. If checkout itself fails (e.g. a stale
 * pool after a network blip), rebuild the pool once and retry.
 */
export async function withClient(fn) {
  let client;
  try {
    client = await getPool().connect();
  } catch (err) {
    console.error('[db] connect failed, rebuilding pool and retrying once:', err.message);
    pool = null;
    client = await getPool().connect();
  }
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/**
 * Run fn(client) inside BEGIN/COMMIT, always ROLLBACK on error so a failed
 * write can never poison the connection for the next request.
 */
export async function withTransaction(fn) {
  return withClient(async (client) => {
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('[db] rollback failed:', rollbackErr.message);
      }
      throw err;
    }
  });
}

// ── snake_case <-> camelCase mapping ────────────────────────────
//
// The DB uses snake_case columns; the frontend uses camelCase fields.
// The previous version returned raw `SELECT *` rows for items/groups
// without converting them, so `item.groupId`, `item.lowStockThreshold`,
// `item.costPrice`, and `item.salePrice` were always `undefined` on the
// frontend — inventory grouping, low-stock badges, and margin calculations
// were silently broken. Every row now goes through this mapper.

function snakeToCamelKey(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function toCamel(row) {
  if (!row) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[snakeToCamelKey(k)] = v;
  }
  return out;
}

export function toCamelAll(rows) {
  return (rows || []).map(toCamel);
}

// Postgres NUMERIC columns come back as strings from node-postgres to avoid
// precision loss. The frontend does arithmetic on these, so they must be
// numbers, not strings (a raw `"12.50" - "3"` in JS gives the right answer
// by coercion, but string concatenation bugs elsewhere are easy to
// introduce — better to normalize once here).
export function mapItem(row) {
  if (!row) return row;
  const item = toCamel(row);
  return {
    ...item,
    qty: Number(item.qty) || 0,
    lowStockThreshold: Number(item.lowStockThreshold) || 0,
    costPrice: parseFloat(item.costPrice) || 0,
    salePrice: parseFloat(item.salePrice) || 0,
  };
}

export function mapGroup(row) {
  return toCamel(row);
}

export function mapInvoiceItem(row) {
  if (!row) return row;
  const li = toCamel(row);
  return {
    itemId: li.itemId,
    sku: li.sku,
    name: li.name,
    qty: Number(li.qty) || 0,
    unitPrice: parseFloat(li.unitPrice) || 0,
  };
}

export function mapInvoice(row, lineItems = []) {
  return {
    id: row.id,
    number: row.number,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      address: row.customer_address,
    },
    date: row.date,
    status: row.status,
    notes: row.notes,
    discountAmount: parseFloat(row.discount_amount) || 0,
    items: lineItems.map(mapInvoiceItem),
  };
}

export function mapStockHistory(row) {
  return toCamel(row);
}
