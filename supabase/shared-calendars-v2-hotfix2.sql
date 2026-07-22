-- ============================================================================
-- SHARED CALENDARS V2 — CALENDAR CREATION HOTFIX 2 (definitive)
-- ============================================================================
-- Fixes: 403 / 42501 "new row violates row-level security policy for table
-- calendars" on POST /rest/v1/calendars (personal-mirror auto-create and the
-- Create shared calendar button).
--
-- Root cause: that exact error means the INSERT reached Postgres and the
-- policy WITH CHECK evaluated false — i.e. owner_user_id was not auth.uid()
-- at check time. That happens when the calendars_before_write trigger from
-- shared-calendars-v2.sql is missing or stale in your database (the SQL
-- editor runs a file as one transaction, so an error anywhere rolls back
-- everything AFTER a partial manual run; mixed states are easy to end up in).
--
-- This hotfix supersedes shared_calendars_v2_calendar_insert_hotfix.sql (your
-- version is included below, unchanged in spirit) and adds the piece that
-- makes the whole class of problem go away: two SECURITY DEFINER RPCs that
-- create calendars server-side with the caller's verified identity. RPCs
-- bypass the insert-policy/trigger/default dance entirely, so calendar
-- creation works even if a future migration leaves policies half-applied.
-- Direct table INSERTs (the client's fallback path) are also repaired.
--
-- Safe to run more than once. Run the WHOLE file in the Supabase SQL editor.
-- The last statement prints a verification table.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Your hotfix, re-asserted: defaults + tolerant trigger + grants
-- ----------------------------------------------------------------------------
alter table public.calendars
  alter column owner_user_id set default auth.uid();

alter table public.calendars
  alter column owner_email set default lower(coalesce(auth.jwt()->>'email',''));

create or replace function public.calendars_before_write()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.owner_user_id := coalesce(new.owner_user_id, auth.uid());
    new.owner_email   := coalesce(nullif(new.owner_email, ''), lower(coalesce(auth.jwt()->>'email','')));
    if new.kind not in ('personal','shared') then new.kind := 'shared'; end if;
  end if;

  if tg_op = 'UPDATE' then
    new.owner_user_id := old.owner_user_id;
    new.owner_email   := old.owner_email;
    new.kind          := old.kind;
  end if;

  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists calendars_before_write_trg on public.calendars;
create trigger calendars_before_write_trg
  before insert or update on public.calendars
  for each row execute function public.calendars_before_write();

grant select, insert, update, delete on public.calendars to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Re-assert the role helper + the calendars policies (covers the
--    partial-apply case where the table exists but policies do not)
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

drop policy if exists "members read calendars"  on public.calendars;
drop policy if exists "owner inserts calendars" on public.calendars;
drop policy if exists "owner updates calendars" on public.calendars;
drop policy if exists "owner deletes calendars" on public.calendars;

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

alter table public.calendars enable row level security;

-- ----------------------------------------------------------------------------
-- 3. The definitive fix: SECURITY DEFINER creation RPCs.
--    These run with the function owner's rights, so they are immune to
--    insert-policy/trigger/default drift. Identity always comes from the
--    caller's JWT — a modified client cannot create calendars as anyone else.
-- ----------------------------------------------------------------------------
create or replace function public.ensure_personal_calendar()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select id into v_id
    from public.calendars
   where owner_user_id = auth.uid() and kind = 'personal'
   limit 1;
  if v_id is not null then return v_id; end if;

  begin
    insert into public.calendars (owner_user_id, owner_email, name, kind)
    values (auth.uid(), v_email, 'My calendar', 'personal')
    returning id into v_id;
  exception when unique_violation then
    -- Two devices raced on the one-personal-per-user index; take the winner.
    select id into v_id
      from public.calendars
     where owner_user_id = auth.uid() and kind = 'personal'
     limit 1;
  end;

  return v_id;
end
$$;

create or replace function public.create_shared_calendar(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_name text := trim(coalesce(p_name, ''));
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if v_name = '' then
    raise exception 'Calendar name is required';
  end if;
  if length(v_name) > 120 then
    v_name := left(v_name, 120);
  end if;

  insert into public.calendars (owner_user_id, owner_email, name, kind)
  values (auth.uid(), lower(coalesce(auth.jwt()->>'email','')), v_name, 'shared')
  returning id into v_id;

  return v_id;
end
$$;

revoke all on function public.ensure_personal_calendar()      from public;
revoke all on function public.ensure_personal_calendar()      from anon;
revoke all on function public.create_shared_calendar(text)    from public;
revoke all on function public.create_shared_calendar(text)    from anon;
grant execute on function public.ensure_personal_calendar()   to authenticated;
grant execute on function public.create_shared_calendar(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Verification: this SELECT is the file's final result. Every row should
--    say OK. Anything else tells you exactly which piece is still missing.
-- ----------------------------------------------------------------------------
select * from (
  select 'trigger calendars_before_write_trg' as piece,
         case when exists (select 1 from information_schema.triggers
                           where event_object_table = 'calendars'
                             and trigger_name = 'calendars_before_write_trg')
              then 'OK' else 'MISSING' end as status
  union all
  select 'policy: owner inserts calendars',
         case when exists (select 1 from pg_policies
                           where tablename = 'calendars'
                             and policyname = 'owner inserts calendars')
              then 'OK' else 'MISSING' end
  union all
  select 'policy: members read calendars',
         case when exists (select 1 from pg_policies
                           where tablename = 'calendars'
                             and policyname = 'members read calendars')
              then 'OK' else 'MISSING' end
  union all
  select 'function: calendar_role(uuid)',
         case when to_regprocedure('public.calendar_role(uuid)') is not null
              then 'OK' else 'MISSING' end
  union all
  select 'rpc: ensure_personal_calendar()',
         case when to_regprocedure('public.ensure_personal_calendar()') is not null
              then 'OK' else 'MISSING' end
  union all
  select 'rpc: create_shared_calendar(text)',
         case when to_regprocedure('public.create_shared_calendar(text)') is not null
              then 'OK' else 'MISSING' end
) checks order by piece;
