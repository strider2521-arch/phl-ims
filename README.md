# Peptide IMS

Inventory + invoicing tool for Prime Helix, built for Vercel (frontend + serverless API) and Supabase (Postgres).

Same UI and feature set as before — dashboard, grouped inventory with stock adjustments, invoicing with discounts and PDF-style print export, light/dark theme, settings — rebuilt from scratch on the backend to fix the crashes and data bugs in the previous version.

## What was actually wrong before, and what changed

**1. The Node process could get killed by a single bad connection.**
`pg.Pool` emits an `error` event whenever a pooled/idle client hits a network hiccup. If nothing listens for it, Node treats it as an uncaught exception and kills the whole function instance — taking down unrelated in-flight requests with it. `lib/db.js` now attaches a listener that recycles the pool instead of crashing.

**2. Failed transactions poisoned the connection pool.**
Stock adjustments and invoice writes ran `BEGIN` ... `COMMIT` but never `ROLLBACK` on failure. A client left mid-transaction was released back to the pool and reused for the next unrelated request, which would then fail too — a single bad write could cascade into unrelated failures. `withTransaction()` in `lib/db.js` always rolls back on error.

**3. Inventory grouping was silently broken.**
The `/api/data` endpoint returned raw `SELECT *` rows (snake_case: `group_id`, `low_stock_threshold`, `cost_price`, `sale_price`) while the frontend reads camelCase (`groupId`, `lowStockThreshold`, etc). Every item's `groupId` was `undefined`, so the group filter `items.filter(i => i.groupId === activeGroup)` matched nothing. All API responses are now mapped consistently through `lib/db.js`.

**4. Wrong Supabase pooler for serverless.**
The old setup used the Session pooler (port 5432), which hands each client a dedicated backend connection — fine for a long-running server, but serverless concurrency exhausts it fast. This build uses the Transaction pooler (port 6543), designed for many short-lived connections.

**5. Invoice numbering had a race condition.**
Numbers were computed by reading the highest existing invoice number and adding one — two invoices created at the same instant could get the same number. Now backed by a Postgres `SEQUENCE`, which is atomic.

**6. Auth secret was hardcoded.**
Session tokens were signed with a key deterministically derived from a string in the source code, meaning anyone with the code could forge valid sessions. Now requires an `AUTH_SECRET` env var, checked at startup.

**7. `/api/health` used to return the admin password in the response body.** Removed.

## Structure

```
src/            React frontend (unchanged from the original design)
api/[...slug].js  Single serverless function handling all /api/* routes
lib/db.js       Connection pool, transaction helper, snake_case→camelCase mapping
lib/auth.js     Env-var admin auth, signed session tokens
supabase-schema.sql
seed.mjs        Optional demo data
```

See `DEPLOY.md` for step-by-step deployment instructions.
