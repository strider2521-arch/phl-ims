-- Run this in your Supabase SQL Editor
-- Creates the app_settings table for cross-device sync

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'owner_full_access') THEN
    CREATE POLICY owner_full_access ON app_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO app_settings (id, data)
SELECT gen_random_uuid(), '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM app_settings);
