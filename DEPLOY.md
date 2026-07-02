# Peptide IMS — Deploy to Vercel + Supabase

---

## PART 1: SUPABASE (Database)

### Step 1 — Create a Supabase project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
2. Name it (e.g. `peptide-ims`), set a **strong database password** (save it), pick your region, **Create project**
3. Wait ~2 minutes for provisioning

### Step 2 — Run the schema
1. In the Supabase dashboard: **SQL Editor → New Query**
2. Paste the entire contents of `supabase-schema.sql`
3. Click **Run**

### Step 3 — Get the Transaction Pooler connection string ⚠️ IMPORTANT
This is the step that caused the connection-exhaustion crashes before.

1. Go to **Settings → Database → Connection string**
2. Click the **Transaction pooler** tab (⚠️ **not** "Session pooler" and **not** "Direct connection")
3. Copy the URI — it looks like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
   ```
   Note the port: **6543**, not 5432.
4. Replace `[YOUR-PASSWORD]` with your database password.

**Why this matters:** Vercel serverless functions can spin up many concurrent instances, each opening its own database connections. The Session pooler (5432) and direct connection both hand out one dedicated Postgres backend connection per client — with enough concurrent traffic you exhaust Supabase's connection limit and everything starts failing. The Transaction pooler (6543, PgBouncer) is built specifically to multiplex many short-lived serverless connections onto a small number of real backend connections. This app is written to work correctly with it.

---

## PART 2: VERCEL (Frontend + API)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Peptide IMS — hardened rebuild"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2 — Import to Vercel
1. [vercel.com](https://vercel.com) → **New Project** → import your repo
2. Vercel auto-detects Vite; the settings in `vercel.json` are used automatically
3. Click **Deploy** — the first deploy will fail because env vars aren't set yet. That's expected.

### Step 3 — Set environment variables
**Settings → Environment Variables**, add all of these to **Production**, **Preview**, and **Development**:

| Name | Value |
|---|---|
| `DATABASE_URL` | Your Transaction Pooler URI from Part 1, Step 3 |
| `ADMIN_USERNAME` | e.g. `admin` |
| `ADMIN_PASSWORD` | A password you choose |
| `AUTH_SECRET` | Output of `openssl rand -hex 32` |

Generate `AUTH_SECRET` locally:
```bash
openssl rand -hex 32
```

### Step 4 — Redeploy
**Deployments** tab → latest deployment → **⋯** → **Redeploy**

### Step 5 — Seed demo data (optional)
Locally, with a `.env` file (copy `.env.example` and fill in real values):
```bash
npm install
npm run seed
```
This creates 3 demo product groups, 7 items, and 1 invoice. Safe to skip — the app works fine with an empty inventory too, you'd just start by creating your own groups and items.

---

## PART 3: Verify

1. Open your Vercel deployment URL
2. Log in with the `ADMIN_USERNAME` / `ADMIN_PASSWORD` you set
3. Visit `/api/health` (while logged in, or via the browser dev tools with your auth token) to confirm `dbConnected: true`

---

## Making future changes safely

- **Local dev:** `npm install`, then `vercel dev` (uses your `.env`) or `npm run dev` for frontend-only work against a running `vercel dev` API on port 3000.
- **Schema changes:** edit `supabase-schema.sql`, run the new statements manually in the Supabase SQL Editor (the file uses `IF NOT EXISTS` guards so it's safe to re-run in full).
- **API changes:** all routes live in `api/[...slug].js`. Database access always goes through `lib/db.js`'s `withClient` / `withTransaction` helpers — don't call `pg` directly from a route, or you'll lose the crash-proofing described in `lib/db.js`'s comments.
- **New fields:** when adding a DB column, add it to the relevant `map*` function in `lib/db.js` if it needs type conversion (e.g. NUMERIC columns need `parseFloat`), otherwise the automatic snake_case→camelCase conversion handles it.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Page loads but no data / 500 errors | Confirm `DATABASE_URL` uses the **Transaction pooler** on port **6543**, not 5432 |
| Login fails | Double check `ADMIN_USERNAME` / `ADMIN_PASSWORD` in Vercel match what you're typing — no DB lookup is involved in login |
| "AUTH_SECRET is not set" error | Add `AUTH_SECRET` in Vercel env vars and redeploy |
| "Database connection refused" | Supabase projects on the free tier pause after a week of inactivity — resume it from the dashboard |
| Random 500s that clear up after a bit | Check Vercel function logs for `[db] pool error` — this is expected transient recovery, not a crash, and the function should self-heal on the next request |
| CORS errors | Shouldn't happen — frontend and API are same-origin. If you see this, check `vercel.json` rewrites weren't modified |
