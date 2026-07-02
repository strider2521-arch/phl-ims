-- Peptide IMS — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor after creating the project.
--
-- Auth is handled entirely via environment variables (ADMIN_USERNAME /
-- ADMIN_PASSWORD / AUTH_SECRET) — see DEPLOY.md — so there is no users
-- table here. Keeping it out on purpose: an unused table that isn't
-- actually part of the auth path is a trap for future confusion.

-- ── Product Groups ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT ''
);

-- ── Items ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'vial',
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT qty_non_negative CHECK (qty >= 0)
);

-- ── Invoices ───────────────────────────────────────────────────

-- Sequence-backed numbering avoids a race condition present in the
-- previous version, which derived the next invoice number by reading the
-- highest existing number — two invoices created at the same moment could
-- both compute the same "next" number.
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT DEFAULT '',
  customer_address TEXT DEFAULT '',
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT DEFAULT '',
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT status_valid CHECK (status IN ('draft', 'pending', 'paid', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id UUID,
  sku TEXT,
  name TEXT,
  qty INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL
);

-- ── Stock History ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID,
  item_name TEXT,
  sku TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delta INTEGER NOT NULL,
  new_qty INTEGER NOT NULL,
  note TEXT DEFAULT ''
);

-- ── Indexes ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_items_group ON items(group_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_item ON stock_history(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_date ON stock_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(number);


-- ── Row Level Security ────────────────────────────────────────
--
-- The API connects with the database owner role via DATABASE_URL (not the
-- Supabase client library), so these policies mainly guard against the
-- anon/authenticated Supabase roles being used directly against these
-- tables from anywhere else. All real access control happens in the API
-- layer (lib/auth.js).

ALTER TABLE product_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_groups' AND policyname = 'owner_full_access') THEN
    CREATE POLICY owner_full_access ON product_groups FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'owner_full_access') THEN
    CREATE POLICY owner_full_access ON items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'owner_full_access') THEN
    CREATE POLICY owner_full_access ON invoices FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_items' AND policyname = 'owner_full_access') THEN
    CREATE POLICY owner_full_access ON invoice_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_history' AND policyname = 'owner_full_access') THEN
    CREATE POLICY owner_full_access ON stock_history FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
