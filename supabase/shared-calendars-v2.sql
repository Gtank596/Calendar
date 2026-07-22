-- ============================================================================
-- SHARED CALENDARS V2–V5 FOUNDATION
-- ============================================================================
-- Run this whole file in the Supabase SQL editor. Requires shared-calendars-v1
-- to be irrelevant — this file does NOT touch V1 (calendar_shares) or your
-- existing calendar_cloud_state table/policies in any way. V1 read-only
-- sharing keeps working unchanged while V2 is tested.
--
-- What this creates:
--   calendars                one row per calendar. kind='personal' is the
--                            auto-created mirror target for a user's own
--                            events; kind='shared' is a collaborative
--                            calendar whose events live natively here.
--   calendar_members         membership + role (owner/editor/viewer).
--                            The calendar's owner is IMPLICITLY owner via
--                            calendars.owner_user_id (no self-row needed).
--   calendar_invites         V2 invite/accept/decline/revoke flow.
--   calendar_events          V3 row-per-event storage. For personal calendars
--                            this is a one-way MIRROR of the app's existing
--                            events slice (which stays the source of truth).
--                            For shared calendars it is the native store.
--                            NO price. NO budget/receipt/settings data. Ever.
--   calendar_event_versions  append-only change log (V5 conflict forensics).
--
-- Safety properties:
--   * calendar_cloud_state is untouched — no new grants, no new policies.
--   * Personal mirror rows are visible ONLY to the owner until they invite
--     someone. Invites to a PERSONAL calendar are forced to role='viewer'
--     by trigger: nobody can ever edit your mirror, so the one-way
--     mirror can never be corrupted by another user.
--   * Editing (V4) happens only on kind='shared' calendars.
--   * Every write to calendar_events is role-checked by RLS server-side —
--     a modified client cannot bypass it.
--   * updates must present the current `version`; a stale update matches
--     0 rows (optimistic concurrency, used by V5 conflict prevention).
--
-- ROLLBACK: commented block at the bottom.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. calendars
-- ----------------------------------------------------------------------------
create table if not exists public.calendars (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  owner_email   text not null default '',
  name          text not null default 'Calendar',
  kind          text not null default 'shared' check (kind in ('personal','shared')),
  color         text not null default '#7a5aff',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- one personal (mirror) calendar per user
create unique index if not exists calendars_one_personal_per_user
  on public.calendars (owner_user_id) where kind = 'personal';

alter table public.calendars enable row level security;

-- ----------------------------------------------------------------------------
-- 2. Role helper. SECURITY DEFINER so policies can consult membership without
--    recursive-policy problems. The calendar owner is implicitly 'owner'.
-- ----------------------------------------------------------------------------
create or replace function public.calendar_role(p_calendar_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.calendars c
      where c.id = p_calendar_id and c.owner_user_id = auth.uid()
    ) then 'owner'
    else (
      select m.role from public.calendar_members m
      where m.calendar_id = p_calendar_id and m.user_id = auth.uid()
      limit 1
    )
  end;
$$;

revoke all on function public.calendar_role(uuid) from public;
revoke all on function public.calendar_role(uuid) from anon;
grant execute on function public.calendar_role(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 3. calendar_members
-- ----------------------------------------------------------------------------
create table if not exists public.calendar_members (
  id           uuid primary key default gen_random_uuid(),
  calendar_id  uuid not null references public.calendars(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  member_email text not null default '',
  role         text not null default 'viewer' check (role in ('editor','viewer')),
  created_at   timestamptz not null default now(),
  unique (calendar_id, user_id)
);
-- note: 'owner' is not a member-row role; ownership lives on calendars.

alter table public.calendar_members enable row level security;

create index if not exists calendar_members_user_idx on public.calendar_members (user_id);
create index if not exists calendar_members_cal_idx  on public.calendar_members (calendar_id);

-- ----------------------------------------------------------------------------
-- 4. calendar_invites
-- ----------------------------------------------------------------------------
create table if not exists public.calendar_invites (
  id             uuid primary key default gen_random_uuid(),
  calendar_id    uuid not null references public.calendars(id) on delete cascade,
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  inviter_email  text not null default '',
  invitee_email  text not null,
  role           text not null default 'viewer' check (role in ('editor','viewer')),
  status         text not null default 'pending'
                   check (status in ('pending','accepted','declined','revoked')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  responded_at   timestamptz
);

alter table public.calendar_invites enable row level security;

create index if not exists calendar_invites_invitee_idx
  on public.calendar_invites (invitee_email) where status = 'pending';

-- Insert/update guard: identity is pinned server-side; personal calendars
-- (the one-way mirror) can only ever be shared as VIEWER.
create or replace function public.calendar_invites_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text;
begin
  if tg_op = 'INSERT' then
    new.inviter_user_id := auth.uid();
    new.inviter_email   := lower(coalesce(auth.jwt()->>'email',''));
    new.invitee_email   := lower(trim(coalesce(new.invitee_email,'')));
    new.status          := 'pending';
    new.responded_at    := null;

    if new.invitee_email = '' then
      raise exception 'Invitee email is required';
    end if;
    if new.invitee_email = new.inviter_email then
      raise exception 'You cannot invite yourself';
    end if;

    select kind into v_kind from public.calendars where id = new.calendar_id;
    if v_kind is null then
      raise exception 'Calendar not found';
    end if;
    if v_kind = 'personal' and new.role <> 'viewer' then
      -- HARD RULE: nobody edits a personal mirror. One-way sync stays safe.
      new.role := 'viewer';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    -- Only status may change (revoke by owner; accept/decline go through the
    -- SECURITY DEFINER RPCs below, which also honor this trigger).
    new.calendar_id     := old.calendar_id;
    new.inviter_user_id := old.inviter_user_id;
    new.inviter_email   := old.inviter_email;
    new.invitee_email   := old.invitee_email;
    new.role            := old.role;
    if new.status <> old.status then
      new.responded_at := now();
    end if;
  end if;

  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists calendar_invites_before_write_trg on public.calendar_invites;
create trigger calendar_invites_before_write_trg
  before insert or update on public.calendar_invites
  for each row execute function public.calendar_invites_before_write();

-- ----------------------------------------------------------------------------
-- 5. calendar_events  (V3 mirror + V4 native shared store)
--    Whitelisted calendar fields ONLY. No price, no budget, no receipts,
--    no reminders, no settings, no connections.
-- ----------------------------------------------------------------------------
create table if not exists public.calendar_events (
  id              uuid primary key default gen_random_uuid(),
  calendar_id     uuid not null references public.calendars(id) on delete cascade,
  -- For personal-mirror rows: the app-side event id (stable upsert key).
  -- For native shared events: a client-generated id string.
  source_event_id text not null,
  title           text not null default '',
  details         text not null default '',
  start_date      text not null,             -- ISO yyyy-mm-dd (matches app)
  start_time      text not null default '',  -- app's "h:mm am/pm" strings
  end_time        text not null default '',
  color           text not null default '#7a5aff',
  category_id     text not null default 'other',
  recurrence      jsonb not null default '{"freq":"none"}'::jsonb,
  version         integer not null default 1,
  created_by      uuid not null references auth.users(id) on delete cascade,
  updated_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique (calendar_id, source_event_id)
);

alter table public.calendar_events enable row level security;

create index if not exists calendar_events_cal_idx
  on public.calendar_events (calendar_id) where deleted_at is null;
create index if not exists calendar_events_cal_date_idx
  on public.calendar_events (calendar_id, start_date);

-- Version bump + identity pinning + field hygiene on every write.
create or replace function public.calendar_events_before_write()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.version    := 1;
  end if;

  if tg_op = 'UPDATE' then
    new.calendar_id     := old.calendar_id;      -- events never change calendar
    new.source_event_id := old.source_event_id;
    new.created_by      := old.created_by;
    new.created_at      := old.created_at;
    new.version         := old.version + 1;      -- server-side optimistic version
  end if;

  new.updated_by := auth.uid();
  new.updated_at := now();

  -- Belt-and-braces field hygiene: recurrence must be an object; strip any
  -- attempt to smuggle non-whitelisted keys through it.
  if new.recurrence is null or jsonb_typeof(new.recurrence) <> 'object' then
    new.recurrence := '{"freq":"none"}'::jsonb;
  end if;
  new.recurrence := jsonb_strip_nulls(jsonb_build_object(
    'freq',       new.recurrence->'freq',
    'until',      new.recurrence->'until',
    'interval',   new.recurrence->'interval',
    'days',       new.recurrence->'days',
    'exceptions', new.recurrence->'exceptions'
  ));

  return new;
end
$$;

drop trigger if exists calendar_events_before_write_trg on public.calendar_events;
create trigger calendar_events_before_write_trg
  before insert or update on public.calendar_events
  for each row execute function public.calendar_events_before_write();

-- ----------------------------------------------------------------------------
-- 6. calendar_event_versions — append-only change log (audit / future merge)
-- ----------------------------------------------------------------------------
create table if not exists public.calendar_event_versions (
  id          bigint generated always as identity primary key,
  event_id    uuid not null,
  calendar_id uuid not null,
  version     integer not null,
  op          text not null check (op in ('insert','update','delete')),
  snapshot    jsonb not null,
  changed_by  uuid,
  changed_at  timestamptz not null default now()
);

alter table public.calendar_event_versions enable row level security;

create index if not exists calendar_event_versions_event_idx
  on public.calendar_event_versions (event_id, version);

create or replace function public.calendar_events_log_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.calendar_event_versions
    (event_id, calendar_id, version, op, snapshot, changed_by)
  values (
    coalesce(new.id, old.id),
    coalesce(new.calendar_id, old.calendar_id),
    coalesce(new.version, old.version),
    lower(tg_op),
    to_jsonb(coalesce(new, old)),
    auth.uid()
  );
  return coalesce(new, old);
end
$$;

drop trigger if exists calendar_events_log_version_trg on public.calendar_events;
create trigger calendar_events_log_version_trg
  after insert or update or delete on public.calendar_events
  for each row execute function public.calendar_events_log_version();

-- ----------------------------------------------------------------------------
-- 7. RLS POLICIES
-- ----------------------------------------------------------------------------

-- calendars ------------------------------------------------------------------
drop policy if exists "members read calendars"   on public.calendars;
drop policy if exists "owner inserts calendars"  on public.calendars;
drop policy if exists "owner updates calendars"  on public.calendars;
drop policy if exists "owner deletes calendars"  on public.calendars;

create policy "members read calendars"
  on public.calendars for select
  using (public.calendar_role(id) is not null);

create policy "owner inserts calendars"
  on public.calendars for insert
  with check (owner_user_id = auth.uid());

create policy "owner updates calendars"
  on public.calendars for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "owner deletes calendars"
  on public.calendars for delete
  using (owner_user_id = auth.uid());

-- pin owner identity + kind immutability
create or replace function public.calendars_before_write()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.owner_user_id := auth.uid();
    new.owner_email   := lower(coalesce(auth.jwt()->>'email',''));
    if new.kind not in ('personal','shared') then new.kind := 'shared'; end if;
  end if;
  if tg_op = 'UPDATE' then
    new.owner_user_id := old.owner_user_id;
    new.owner_email   := old.owner_email;
    new.kind          := old.kind;         -- a mirror can never become editable
  end if;
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists calendars_before_write_trg on public.calendars;
create trigger calendars_before_write_trg
  before insert or update on public.calendars
  for each row execute function public.calendars_before_write();

-- calendar_members -----------------------------------------------------------
drop policy if exists "members read member list"  on public.calendar_members;
drop policy if exists "owner manages members"     on public.calendar_members;
drop policy if exists "owner updates members"     on public.calendar_members;
drop policy if exists "owner or self removes"     on public.calendar_members;

create policy "members read member list"
  on public.calendar_members for select
  using (public.calendar_role(calendar_id) is not null);

-- Members are normally created by the accept-invite RPC (definer). Direct
-- inserts are owner-only (e.g. future admin tooling).
create policy "owner manages members"
  on public.calendar_members for insert
  with check (public.calendar_role(calendar_id) = 'owner');

create policy "owner updates members"
  on public.calendar_members for update
  using (public.calendar_role(calendar_id) = 'owner')
  with check (public.calendar_role(calendar_id) = 'owner');

create policy "owner or self removes"
  on public.calendar_members for delete
  using (
    public.calendar_role(calendar_id) = 'owner'
    or user_id = auth.uid()   -- anyone may leave a calendar
  );

-- personal calendars only ever get viewer members (mirror stays one-way)
create or replace function public.calendar_members_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text;
  v_owner uuid;
begin
  select kind, owner_user_id into v_kind, v_owner
    from public.calendars where id = new.calendar_id;
  if v_owner is null then raise exception 'Calendar not found'; end if;
  if new.user_id = v_owner then
    raise exception 'The calendar owner is already the owner';
  end if;
  if v_kind = 'personal' and new.role <> 'viewer' then
    new.role := 'viewer';
  end if;
  return new;
end
$$;

drop trigger if exists calendar_members_before_write_trg on public.calendar_members;
create trigger calendar_members_before_write_trg
  before insert or update on public.calendar_members
  for each row execute function public.calendar_members_before_write();

-- calendar_invites ------------------------------------------------------------
drop policy if exists "owner reads own invites"     on public.calendar_invites;
drop policy if exists "invitee reads own invites"   on public.calendar_invites;
drop policy if exists "owner creates invites"       on public.calendar_invites;
drop policy if exists "owner revokes invites"       on public.calendar_invites;

create policy "owner reads own invites"
  on public.calendar_invites for select
  using (public.calendar_role(calendar_id) = 'owner');

create policy "invitee reads own invites"
  on public.calendar_invites for select
  using (
    auth.jwt()->>'email' is not null
    and lower(invitee_email) = lower(auth.jwt()->>'email')
  );

create policy "owner creates invites"
  on public.calendar_invites for insert
  with check (public.calendar_role(calendar_id) = 'owner');

create policy "owner revokes invites"
  on public.calendar_invites for update
  using (public.calendar_role(calendar_id) = 'owner')
  with check (public.calendar_role(calendar_id) = 'owner');

-- Accept / decline run as SECURITY DEFINER so the invitee (who has no write
-- policy) can respond, and so accepting atomically creates the member row.
create or replace function public.accept_calendar_invite(p_invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.calendar_invites%rowtype;
  v_email  text := lower(coalesce(auth.jwt()->>'email',''));
begin
  if auth.uid() is null or v_email = '' then
    raise exception 'Not signed in';
  end if;

  select * into v_invite from public.calendar_invites
   where id = p_invite_id and status = 'pending'
     and lower(invitee_email) = v_email
   for update;

  if v_invite.id is null then
    raise exception 'Invite not found or not addressed to you';
  end if;

  insert into public.calendar_members (calendar_id, user_id, member_email, role)
  values (v_invite.calendar_id, auth.uid(), v_email, v_invite.role)
  on conflict (calendar_id, user_id)
    do update set role = excluded.role, member_email = excluded.member_email;

  update public.calendar_invites
     set status = 'accepted', responded_at = now(), updated_at = now()
   where id = p_invite_id;

  return jsonb_build_object('ok', true, 'calendar_id', v_invite.calendar_id,
                            'role', v_invite.role);
end
$$;

create or replace function public.decline_calendar_invite(p_invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
  v_count int;
begin
  if auth.uid() is null or v_email = '' then
    raise exception 'Not signed in';
  end if;

  update public.calendar_invites
     set status = 'declined', responded_at = now(), updated_at = now()
   where id = p_invite_id and status = 'pending'
     and lower(invitee_email) = v_email;
  get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception 'Invite not found or not addressed to you';
  end if;
  return jsonb_build_object('ok', true);
end
$$;

revoke all on function public.accept_calendar_invite(uuid)  from public, anon;
revoke all on function public.decline_calendar_invite(uuid) from public, anon;
grant execute on function public.accept_calendar_invite(uuid)  to authenticated;
grant execute on function public.decline_calendar_invite(uuid) to authenticated;

-- calendar_events --------------------------------------------------------------
drop policy if exists "members read events"          on public.calendar_events;
drop policy if exists "editors insert events"        on public.calendar_events;
drop policy if exists "editors update events"        on public.calendar_events;
drop policy if exists "editors delete events"        on public.calendar_events;

create policy "members read events"
  on public.calendar_events for select
  using (public.calendar_role(calendar_id) is not null);

create policy "editors insert events"
  on public.calendar_events for insert
  with check (public.calendar_role(calendar_id) in ('owner','editor'));

create policy "editors update events"
  on public.calendar_events for update
  using (public.calendar_role(calendar_id) in ('owner','editor'))
  with check (public.calendar_role(calendar_id) in ('owner','editor'));

-- Hard deletes are owner-only; the app uses soft delete (deleted_at) anyway.
create policy "editors delete events"
  on public.calendar_events for delete
  using (public.calendar_role(calendar_id) = 'owner');

-- Note: because personal-mirror calendars can only have VIEWER members
-- (triggers above), the 'editor' write policies can never apply to a mirror —
-- only its owner writes it. RLS therefore enforces the one-way mirror even
-- against a modified client.

-- calendar_event_versions -------------------------------------------------------
drop policy if exists "members read version log" on public.calendar_event_versions;

create policy "members read version log"
  on public.calendar_event_versions for select
  using (public.calendar_role(calendar_id) is not null);
-- no insert/update/delete policies: only the definer trigger writes here.

-- ----------------------------------------------------------------------------
-- 8. Realtime (V5): expose calendar_events changes. RLS still applies to
--    realtime payloads (Supabase checks policies per-subscriber). Wrapped so
--    re-running the file is harmless.
-- ----------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.calendar_events;
exception
  when duplicate_object then null;
  when undefined_object then
    raise notice 'supabase_realtime publication not found — enable Realtime for calendar_events in the dashboard instead.';
end $$;

alter table public.calendar_events replica identity full;

-- ============================================================================
-- ROLLBACK (removes V2–V5 entirely; V1 and calendar_cloud_state untouched)
-- ============================================================================
-- do $$ begin
--   alter publication supabase_realtime drop table public.calendar_events;
-- exception when others then null; end $$;
-- drop function if exists public.accept_calendar_invite(uuid);
-- drop function if exists public.decline_calendar_invite(uuid);
-- drop table if exists public.calendar_event_versions;
-- drop table if exists public.calendar_events;
-- drop table if exists public.calendar_invites;
-- drop table if exists public.calendar_members;
-- drop table if exists public.calendars;
-- drop function if exists public.calendar_events_log_version();
-- drop function if exists public.calendar_events_before_write();
-- drop function if exists public.calendar_members_before_write();
-- drop function if exists public.calendar_invites_before_write();
-- drop function if exists public.calendars_before_write();
-- drop function if exists public.calendar_role(uuid);
-- ============================================================================
