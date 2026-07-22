-- ============================================================================
-- SHARED CALENDAR VIEW — V1 (READ-ONLY OVERLAY)
-- ============================================================================
-- Run this whole file in the Supabase SQL editor.
--
-- Design notes (why this is safe):
--   * A new, small `calendar_shares` table records "owner shared with email".
--   * NO new policies are added to your existing `calendar_cloud_state` table.
--     Its RLS stays exactly as it is today (each user reads/writes own rows).
--   * Recipients read shared events ONLY through one SECURITY DEFINER
--     function, `get_shared_calendar_events(owner_id)`, which:
--       - verifies an ACTIVE share exists for the caller (by user id or by
--         the verified email in their JWT),
--       - returns ONLY rows whose payload slice/store is 'events'
--         (never budget transactions, receipts, settings, aliases, etc.),
--       - returns ONLY a whitelist of event fields — price, reminders and
--         connection data are stripped server-side, so budget-adjacent data
--         never leaves the owner's account.
--   * There is no write path of any kind for recipients. The function is
--     read-only SQL; recipients still cannot SELECT (let alone UPDATE) the
--     owner's rows in calendar_cloud_state directly.
--
-- ROLLBACK: see the commented block at the bottom of this file.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Shares table
-- ----------------------------------------------------------------------------
create table if not exists public.calendar_shares (
  id                uuid primary key default gen_random_uuid(),
  owner_user_id     uuid not null references auth.users(id) on delete cascade,
  owner_email       text not null default '',
  recipient_email   text not null,
  recipient_user_id uuid references auth.users(id) on delete set null,
  status            text not null default 'active'
                      check (status in ('pending','active','revoked')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (owner_user_id, recipient_email)
);

comment on table public.calendar_shares is
  'Shared Calendar V1: owner grants read-only calendar visibility to an email.';

create index if not exists calendar_shares_recipient_email_idx
  on public.calendar_shares (recipient_email) where status = 'active';
create index if not exists calendar_shares_recipient_user_idx
  on public.calendar_shares (recipient_user_id) where status = 'active';

alter table public.calendar_shares enable row level security;

-- ----------------------------------------------------------------------------
-- 2. Insert/update trigger: the server, not the client, decides identity.
--    Owner id + owner email always come from the authenticated session, so a
--    client can never insert a share "as" someone else or spoof owner_email.
-- ----------------------------------------------------------------------------
create or replace function public.calendar_shares_before_write()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.owner_user_id     := auth.uid();
    new.owner_email       := lower(coalesce(auth.jwt()->>'email',''));
    new.recipient_email   := lower(trim(coalesce(new.recipient_email,'')));
    new.recipient_user_id := null;  -- resolved lazily; V1 matches by email

    if new.recipient_email = '' then
      raise exception 'Recipient email is required';
    end if;
    if new.recipient_email = new.owner_email then
      raise exception 'You cannot share a calendar with yourself';
    end if;
    if new.status not in ('pending','active') then
      new.status := 'active';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    -- Owners may only change status (share/revoke/re-share). Everything else
    -- is pinned to its existing value.
    new.owner_user_id     := old.owner_user_id;
    new.owner_email       := old.owner_email;
    new.recipient_email   := old.recipient_email;
    new.recipient_user_id := old.recipient_user_id;
  end if;

  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists calendar_shares_before_write_trg on public.calendar_shares;
create trigger calendar_shares_before_write_trg
  before insert or update on public.calendar_shares
  for each row execute function public.calendar_shares_before_write();

-- ----------------------------------------------------------------------------
-- 3. RLS policies on calendar_shares
--    * Owner: full control of their own outgoing shares.
--    * Recipient: can SELECT active shares addressed to them (so the app can
--      list "calendars shared with me"). Recipients cannot insert/update/
--      delete anything.
-- ----------------------------------------------------------------------------
drop policy if exists "owner manages own shares"        on public.calendar_shares;
drop policy if exists "owner inserts own shares"        on public.calendar_shares;
drop policy if exists "owner updates own shares"        on public.calendar_shares;
drop policy if exists "owner deletes own shares"        on public.calendar_shares;
drop policy if exists "recipient reads incoming shares" on public.calendar_shares;

create policy "owner manages own shares"
  on public.calendar_shares for select
  using (owner_user_id = auth.uid());

create policy "owner inserts own shares"
  on public.calendar_shares for insert
  with check (auth.uid() is not null);
  -- (trigger overwrites owner_user_id/owner_email with the session identity)

create policy "owner updates own shares"
  on public.calendar_shares for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "owner deletes own shares"
  on public.calendar_shares for delete
  using (owner_user_id = auth.uid());

create policy "recipient reads incoming shares"
  on public.calendar_shares for select
  using (
    status = 'active'
    and (
      recipient_user_id = auth.uid()
      or (
        auth.jwt()->>'email' is not null
        and lower(recipient_email) = lower(auth.jwt()->>'email')
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Sanitized read-only event feed for recipients.
--    SECURITY DEFINER: runs with the function owner's rights, so it can read
--    calendar_cloud_state on the recipient's behalf WITHOUT adding any policy
--    to that table. The share check + field whitelist below are the entire
--    exposure surface.
-- ----------------------------------------------------------------------------
create or replace function public.get_shared_calendar_events(p_owner_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id',         r.payload->'data'->>'id',
          'title',      r.payload->'data'->>'title',
          'details',    r.payload->'data'->>'details',
          'startDate',  coalesce(r.payload->'data'->>'startDate',
                                 r.payload->'data'->>'dateISO'),
          'startTime',  r.payload->'data'->>'startTime',
          'endTime',    r.payload->'data'->>'endTime',
          'color',      r.payload->'data'->>'color',
          'categoryId', r.payload->'data'->>'categoryId',
          'recurrence', jsonb_build_object(
            'freq',       r.payload->'data'->'recurrence'->>'freq',
            'until',      r.payload->'data'->'recurrence'->>'until',
            'interval',   r.payload->'data'->'recurrence'->'interval',
            'days',       r.payload->'data'->'recurrence'->'days',
            'exceptions', r.payload->'data'->'recurrence'->'exceptions'
          ),
          'updatedAt',  r.payload->'updatedAt'
        )
      )
    ),
    '[]'::jsonb
  )
  from public.calendar_cloud_state r
  where r.user_id = p_owner_id
    and r.payload->>'kind'  = 'calendar_record_v1'
    and r.payload->>'slice' = 'events'
    and r.payload->>'store' = 'events'
    and coalesce((r.payload->>'deleted')::boolean, false) = false
    -- The whole feed is empty unless the caller holds an ACTIVE share:
    and exists (
      select 1
      from public.calendar_shares s
      where s.owner_user_id = p_owner_id
        and s.status = 'active'
        and (
          s.recipient_user_id = auth.uid()
          or (
            auth.jwt()->>'email' is not null
            and lower(s.recipient_email) = lower(auth.jwt()->>'email')
          )
        )
    );
$$;

-- Only signed-in users may call it; never the anon key.
revoke all on function public.get_shared_calendar_events(uuid) from public;
revoke all on function public.get_shared_calendar_events(uuid) from anon;
grant execute on function public.get_shared_calendar_events(uuid) to authenticated;

-- ============================================================================
-- ROLLBACK (run to remove Shared Calendars V1 entirely — owner data untouched)
-- ============================================================================
-- drop function if exists public.get_shared_calendar_events(uuid);
-- drop trigger  if exists calendar_shares_before_write_trg on public.calendar_shares;
-- drop function if exists public.calendar_shares_before_write();
-- drop table    if exists public.calendar_shares;
-- ============================================================================
