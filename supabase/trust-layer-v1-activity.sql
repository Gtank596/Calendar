-- ============================================================================
-- TRUST LAYER V1 — SHARED-CALENDAR ACTIVITY + SERVER-OWNED ATTRIBUTION
-- ============================================================================
-- Run this whole file in the Supabase SQL editor AFTER shared-calendars-v2.sql
-- (and its hotfixes). It is idempotent — re-running it is harmless.
--
-- What this adds:
--   calendar_activity        Immutable, append-only activity feed for
--                            kind='shared' calendars ONLY. Personal mirror
--                            calendars never generate activity rows.
--   trigger                  calendar_events_log_activity_trg — a SECURITY
--                            DEFINER AFTER trigger on calendar_events that
--                            derives the actor from auth.uid()/auth.jwt()
--                            server-side. Clients cannot insert, update or
--                            delete activity rows at all (no RLS policies
--                            exist for those verbs).
--
-- What this does NOT touch:
--   * calendar_events_before_write (version increment happens exactly once,
--     in the existing BEFORE trigger — this file only ADDS an AFTER trigger).
--   * created_by / updated_by / created_at / updated_at on calendar_events —
--     those columns already exist and are already pinned server-side by
--     shared-calendars-v2.sql. This file merely relies on them.
--   * calendar_cloud_state, RLS on existing tables, realtime publication for
--     calendar_events.
--
-- Frontend compatibility: the app probes for this table once per session and
-- shows a quiet "activity unavailable" state when it is missing. Installing
-- this file later requires no frontend change.
--
-- ROLLBACK: commented block at the bottom.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. calendar_activity — immutable feed
-- ----------------------------------------------------------------------------
create table if not exists public.calendar_activity (
  id             bigint generated always as identity primary key,
  calendar_id    uuid not null references public.calendars(id) on delete cascade,
  event_id       uuid,
  actor_user_id  uuid,
  actor_email    text not null default '',
  action         text not null check (action in ('create','edit','move','delete','restore')),
  -- Safe changed-field NAMES only (whitelisted in the trigger). Never values.
  changed_fields text[] not null default '{}',
  -- Short title snapshot so the feed stays readable after deletions.
  -- This is shared-event data every member could already read.
  title_snapshot text not null default '',
  created_at     timestamptz not null default now()
);

alter table public.calendar_activity enable row level security;

create index if not exists calendar_activity_cal_time_idx
  on public.calendar_activity (calendar_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 2. RLS — members read; NOBODY writes through the client.
--    No insert/update/delete policies exist, so RLS denies those verbs for
--    every client role. Only the SECURITY DEFINER trigger below inserts.
-- ----------------------------------------------------------------------------
drop policy if exists "members read activity" on public.calendar_activity;

create policy "members read activity"
  on public.calendar_activity for select
  using (public.calendar_role(calendar_id) is not null);

-- Belt and braces: strip any direct table privileges the default grants gave.
revoke insert, update, delete, truncate on public.calendar_activity from anon, authenticated;
grant select on public.calendar_activity to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Activity trigger — server-derived actor, shared calendars only.
--    SECURITY DEFINER so the insert bypasses the (deliberately absent) client
--    write policies; search_path pinned; actor NEVER trusted from the row.
-- ----------------------------------------------------------------------------
create or replace function public.calendar_events_log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind    text;
  v_action  text;
  v_fields  text[] := '{}';
  v_row     public.calendar_events%rowtype;
begin
  v_row := coalesce(new, old);

  -- HARD RULE: personal mirror calendars generate NO activity.
  select kind into v_kind from public.calendars where id = v_row.calendar_id;
  if v_kind is distinct from 'shared' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    v_action := 'create';

  elsif tg_op = 'DELETE' then
    -- Hard deletes are owner-only and rare (the app soft-deletes), but record
    -- them honestly when they happen.
    v_action := 'delete';

  else -- UPDATE
    if old.deleted_at is null and new.deleted_at is not null then
      v_action := 'delete';
    elsif old.deleted_at is not null and new.deleted_at is null then
      v_action := 'restore';
    elsif new.start_date is distinct from old.start_date then
      v_action := 'move';
    else
      v_action := 'edit';
    end if;

    -- Whitelisted changed-field NAMES only — no values, no private data.
    if new.title       is distinct from old.title       then v_fields := v_fields || 'title'; end if;
    if new.details     is distinct from old.details     then v_fields := v_fields || 'details'; end if;
    if new.start_date  is distinct from old.start_date  then v_fields := v_fields || 'start_date'; end if;
    if new.start_time  is distinct from old.start_time  then v_fields := v_fields || 'start_time'; end if;
    if new.end_time    is distinct from old.end_time    then v_fields := v_fields || 'end_time'; end if;
    if new.color       is distinct from old.color       then v_fields := v_fields || 'color'; end if;
    if new.category_id is distinct from old.category_id then v_fields := v_fields || 'category_id'; end if;
    if new.recurrence  is distinct from old.recurrence  then v_fields := v_fields || 'recurrence'; end if;

    -- No-op UPDATE (nothing whitelisted changed, no delete/restore): skip.
    if v_action = 'edit' and cardinality(v_fields) = 0 then
      return new;
    end if;
  end if;

  insert into public.calendar_activity
    (calendar_id, event_id, actor_user_id, actor_email, action, changed_fields, title_snapshot)
  values (
    v_row.calendar_id,
    v_row.id,
    auth.uid(),                                          -- server-derived actor
    lower(coalesce(auth.jwt()->>'email','')),            -- server-derived label
    v_action,
    v_fields,
    left(coalesce(v_row.title, ''), 120)
  );

  return coalesce(new, old);
end
$$;

revoke all on function public.calendar_events_log_activity() from public, anon, authenticated;

drop trigger if exists calendar_events_log_activity_trg on public.calendar_events;
create trigger calendar_events_log_activity_trg
  after insert or update or delete on public.calendar_events
  for each row execute function public.calendar_events_log_activity();

-- ----------------------------------------------------------------------------
-- 4. VERIFICATION (read-only — run after installing)
-- ----------------------------------------------------------------------------
-- Expected: one row, rls_enabled = true.
select relname as table_name, relrowsecurity as rls_enabled
  from pg_class
 where oid = 'public.calendar_activity'::regclass;

-- Expected: exactly one policy, cmd = SELECT.
select polname, case polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
                            when 'w' then 'UPDATE' when 'd' then 'DELETE'
                            else polcmd::text end as cmd
  from pg_policy
 where polrelid = 'public.calendar_activity'::regclass;

-- Expected: calendar_events_log_activity_trg listed, enabled ('O').
select tgname, tgenabled
  from pg_trigger
 where tgrelid = 'public.calendar_events'::regclass
   and tgname in ('calendar_events_before_write_trg',
                  'calendar_events_log_version_trg',
                  'calendar_events_log_activity_trg');

-- Health summary (all rows should say OK):
select 'calendar_activity table' as piece,
       case when to_regclass('public.calendar_activity') is not null
            then 'OK' else 'MISSING' end as status
union all
select 'activity trigger',
       case when exists (select 1 from pg_trigger
                          where tgrelid = 'public.calendar_events'::regclass
                            and tgname = 'calendar_events_log_activity_trg')
            then 'OK' else 'MISSING' end
union all
select 'members-read policy',
       case when exists (select 1 from pg_policy
                          where polrelid = 'public.calendar_activity'::regclass
                            and polname = 'members read activity')
            then 'OK' else 'MISSING' end;

-- Manual behavioral checks (need two test accounts; see
-- TRUST-LAYER-V1-ROLLOUT.md for the full checklist):
--   1. As an editor, INSERT a calendar_events row into a kind='shared'
--      calendar -> a 'create' activity row appears with YOUR auth.uid().
--   2. UPDATE that row's start_date (with correct version) -> 'move' row,
--      changed_fields = {start_date}, version bumped EXACTLY once.
--   3. UPDATE deleted_at to now() -> 'delete' row.
--   4. Mirror upsert into your kind='personal' calendar -> NO activity rows.
--   5. As any signed-in member: insert into calendar_activity directly ->
--      must fail with a row-level security (42501) error.
--   6. As a non-member: select from calendar_activity for that calendar ->
--      0 rows.
--
-- ============================================================================
-- ROLLBACK (removes Trust Layer activity entirely; V2-V5 untouched)
-- ============================================================================
-- drop trigger if exists calendar_events_log_activity_trg on public.calendar_events;
-- drop function if exists public.calendar_events_log_activity();
-- drop table if exists public.calendar_activity;
-- ============================================================================
