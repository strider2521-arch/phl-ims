-- Run this in your Supabase SQL Editor to create the protocols table

CREATE TABLE IF NOT EXISTS protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  reconstitution TEXT DEFAULT '',
  dosage TEXT DEFAULT '',
  administration TEXT DEFAULT '',
  storage TEXT DEFAULT '',
  source_refs TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_protocol_per_item UNIQUE (item_id)
);

ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'protocols' AND policyname = 'owner_full_access') THEN
    CREATE POLICY owner_full_access ON protocols FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_protocols_item ON protocols(item_id);
