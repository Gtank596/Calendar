-- ============================================================================
-- SHARED CALENDARS V5 — realtime publication check (OPTIONAL)
-- ============================================================================
-- Only needed if realtime shows "reconnecting"/"error" and diagnose says so.
-- The main V2 SQL already added calendar_events to the realtime publication;
-- this re-asserts it idempotently and confirms grants. Safe to run repeatedly.
-- RLS still applies to realtime payloads (Supabase checks policies per
-- subscriber), so members only receive changes for calendars they belong to.
-- ============================================================================

-- Re-assert realtime publication membership.
do $$
begin
  alter publication supabase_realtime add table public.calendar_events;
exception
  when duplicate_object then null;  -- already published; fine
  when undefined_object then
    raise notice 'supabase_realtime publication not found — enable Realtime for calendar_events in the Dashboard (Database > Replication).';
end $$;

-- Full row images so DELETE/UPDATE payloads carry the identifying columns
-- the client filters on (calendar_id).
alter table public.calendar_events replica identity full;

-- Authenticated members read via RLS; realtime rides the same SELECT policy.
grant select on public.calendar_events to authenticated;

-- Verify: this row should list calendar_events.
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'calendar_events';
