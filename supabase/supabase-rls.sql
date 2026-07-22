-- Row Level Security for the calendar/budget sync table.
-- Run in the Supabase SQL Editor. Idempotent: safe to re-run.

ALTER TABLE calendar_cloud_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_cloud_state FORCE ROW LEVEL SECURITY;  -- applies even to table owner

DROP POLICY IF EXISTS "own rows select" ON calendar_cloud_state;
DROP POLICY IF EXISTS "own rows insert" ON calendar_cloud_state;
DROP POLICY IF EXISTS "own rows update" ON calendar_cloud_state;
DROP POLICY IF EXISTS "own rows delete" ON calendar_cloud_state;

CREATE POLICY "own rows select" ON calendar_cloud_state
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own rows insert" ON calendar_cloud_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own rows update" ON calendar_cloud_state
  FOR UPDATE USING (auth.uid() = user_id)
             WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own rows delete" ON calendar_cloud_state
  FOR DELETE USING (auth.uid() = user_id);

-- Belt-and-braces: user_id defaults to the caller, and rows must be
-- id-prefixed with the owner's uid (matches getCloudRecordRowId in script.js).
ALTER TABLE calendar_cloud_state ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE OR REPLACE FUNCTION enforce_sync_row_id_prefix()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id IS NULL OR position(NEW.user_id::text || ':' IN NEW.id) <> 1 THEN
    RAISE EXCEPTION 'sync row id must be prefixed with the owning user id';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS sync_row_id_prefix ON calendar_cloud_state;
CREATE TRIGGER sync_row_id_prefix
  BEFORE INSERT OR UPDATE ON calendar_cloud_state
  FOR EACH ROW EXECUTE FUNCTION enforce_sync_row_id_prefix();

-- Server-side timestamps (defense against client clock skew — optional but
-- recommended; the app already reads updated_at from rows).
ALTER TABLE calendar_cloud_state ALTER COLUMN updated_at SET DEFAULT now();

-- ---------------------------------------------------------------------------
-- Verification (run as tests after applying):
-- 1. In the SQL editor:  SELECT * FROM pg_policies WHERE tablename = 'calendar_cloud_state';
--    → should list the four policies above.
-- 2. From a terminal, with ONLY the anon key (no user JWT):
--    curl -s "https://ddxiumutfrimgjzzbhus.supabase.co/rest/v1/calendar_cloud_state?select=id" \
--      -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
--    → must return []  (empty array). Any rows returned = RLS is not working.
-- 3. Sign in as user A in the app, then repeat the curl with A's access token
--    but request another user's rows:
--    ...?...&user_id=eq.<USER_B_UUID>  → must return [].
-- ---------------------------------------------------------------------------

-- Edge Function hardening: in supabase/functions/scan-receipt/config (or the
-- dashboard), ensure "Verify JWT" is ENABLED so anonymous callers cannot use
-- your OCR quota. The app always calls it while signed in, so this is safe.
