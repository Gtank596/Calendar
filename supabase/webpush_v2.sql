-- ============================================================================
-- WEB PUSH V2 — Supabase schema, RLS, indexes, cleanup, and cron
-- ============================================================================
-- Run this whole file in the Supabase SQL editor (or as a migration).
-- Everything is ADDITIVE: no existing tables (calendar_cloud_state, etc.)
-- are touched. Rollback = the DROP block at the very bottom (commented out).
--
-- Model recap:
--   * push_subscriptions  — one row per (user, browser endpoint)
--   * reminder_schedules  — ONE row per reminder-enabled event, with a single
--     next_reminder_at that the Edge Function rolls forward after sending.
--     Row count therefore stays ~equal to the number of reminder-enabled
--     events, NOT number-of-future-occurrences. Free-tier friendly.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. push_subscriptions
-- ----------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null,            -- browser push endpoint URL
  p256dh        text not null,            -- client public key (from sub.toJSON().keys)
  auth          text not null,            -- client auth secret (from sub.toJSON().keys)
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  unique (user_id, endpoint)              -- client upserts on this pair
);

-- ----------------------------------------------------------------------------
-- 2. reminder_schedules — one active row per reminder-enabled event
-- ----------------------------------------------------------------------------
-- event_id is the app's existing event ID (UUID or legacy base36) — TEXT on
-- purpose so no event IDs ever change (hard safety rule).
-- Stored fields are the MINIMUM the Edge Function needs to answer:
--   "given this event/reminder/recurrence/exceptions/timezone,
--    what is the next reminder time after now?"
-- Notes/details/prices are intentionally NOT stored here.
create table if not exists public.reminder_schedules (
  user_id          uuid not null references auth.users(id) on delete cascade,
  event_id         text not null,
  status           text not null default 'active'
                     check (status in ('active','sent','disabled','error')),
  next_reminder_at timestamptz,           -- null unless status = 'active'
  title            text,                  -- truncated display title only
  start_date       date not null,         -- event's local calendar start date
  start_minutes    int  not null check (start_minutes between 0 and 1439),
  offset_minutes   int  not null check (offset_minutes >= 0),
  timezone         text not null,         -- IANA tz captured from the client
  recurrence       jsonb not null default '{"freq":"none"}'::jsonb,
                    -- shape: { freq, interval, until, days[], exceptions[] }
                    -- exactly mirrors the client's recurrence object
  last_sent_at     timestamptz,
  last_error       text,                  -- short debug string, no event details
  updated_at       timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
-- The every-5-minutes due scan: partial index keeps it tiny and always hot.
create index if not exists idx_reminder_schedules_due
  on public.reminder_schedules (next_reminder_at)
  where status = 'active';

-- Per-user lookups (client reconcile reads; RLS-filtered queries).
-- (user_id is already the leading PK column on reminder_schedules, so no
-- extra index is needed there.)
create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions (user_id)
  where enabled = true;

-- Cleanup scans.
create index if not exists idx_reminder_schedules_cleanup
  on public.reminder_schedules (updated_at)
  where status in ('sent','disabled','error');

-- ----------------------------------------------------------------------------
-- 4. Row Level Security
-- ----------------------------------------------------------------------------
-- Users can only see/manage their OWN rows. The Edge Function uses the
-- service-role key, which bypasses RLS, to batch-process ALL users — that key
-- exists only in Edge Function secrets, never in the client. No user can
-- trigger or view another user's notifications.
alter table public.push_subscriptions enable row level security;
alter table public.reminder_schedules enable row level security;

drop policy if exists "own push subscriptions" on public.push_subscriptions;
create policy "own push subscriptions"
  on public.push_subscriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own reminder schedules" on public.reminder_schedules;
create policy "own reminder schedules"
  on public.reminder_schedules
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No anon access at all (RLS with no anon policy already blocks it; being
-- explicit about grants keeps intent obvious).
revoke all on public.push_subscriptions from anon;
revoke all on public.reminder_schedules from anon;

-- ----------------------------------------------------------------------------
-- 5. Cleanup — keep row counts predictable on the Free tier
-- ----------------------------------------------------------------------------
-- Old sent/disabled/error schedules and long-disabled subscriptions are
-- purged after 30 days. Called by the Edge Function (service role) roughly
-- once a day — deliberately NOT a second cron job, per the one-cron rule.
create or replace function public.cleanup_webpush_rows()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.reminder_schedules
   where status in ('sent','disabled','error')
     and updated_at < now() - interval '30 days';

  delete from public.push_subscriptions
   where enabled = false
     and last_seen_at < now() - interval '30 days';
$$;

-- Only the service role (Edge Function) may run cleanup.
revoke execute on function public.cleanup_webpush_rows() from public;
revoke execute on function public.cleanup_webpush_rows() from anon;
revoke execute on function public.cleanup_webpush_rows() from authenticated;

-- ----------------------------------------------------------------------------
-- 6. Cron — ONE job for the whole project, every 5 minutes
-- ----------------------------------------------------------------------------
-- ~8,640 Edge Function invocations/month TOTAL, independent of user count.
-- The job calls the send-due-reminders Edge Function over HTTP with a shared
-- secret header that the function verifies (the function is deployed with
-- --no-verify-jwt; the secret is the gate).
--
-- BEFORE RUNNING THIS BLOCK:
--   a) Enable the pg_cron and pg_net extensions
--      (Dashboard → Database → Extensions, or the two lines below).
--   b) Store the cron secret in Vault (Dashboard → Settings → Vault) under
--      the name 'webpush_cron_secret' — same value as the CRON_SECRET you
--      set in Edge Function secrets.
--   c) Replace YOUR_PROJECT_REF with your project ref
--      (yours is the subdomain of your Supabase URL).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

select cron.schedule(
  'send-due-reminders-every-5-min',       -- unique job name (idempotent-ish:
                                          -- re-running with same name errors;
                                          -- unschedule first if re-creating)
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-due-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret
          from vault.decrypted_secrets
         where name = 'webpush_cron_secret'
         limit 1
      )
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Useful cron admin queries:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 20;
--   select cron.unschedule('send-due-reminders-every-5-min');


-- ============================================================================
-- ROLLBACK (leave commented; run only to fully remove Web Push V2)
-- ============================================================================
-- select cron.unschedule('send-due-reminders-every-5-min');
-- drop function if exists public.cleanup_webpush_rows();
-- drop table if exists public.reminder_schedules;
-- drop table if exists public.push_subscriptions;
-- -- (Then delete the Edge Function, remove the client section 18 + HTML block,
-- --  and revert service-worker.js to v19. Local Reminders V1 is unaffected.)
