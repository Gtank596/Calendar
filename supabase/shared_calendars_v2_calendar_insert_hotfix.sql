-- Shared Calendars V2 calendar INSERT hotfix
-- Fixes: 403 / 42501 "new row violates row-level security policy for table calendars"
-- Safe to run more than once.

create extension if not exists pgcrypto;

-- Make owner fields available before RLS WITH CHECK evaluates, even if the
-- client omits them. The client patch also sends these explicitly.
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

-- Ensure authenticated users are allowed to reach the table; RLS policies still
-- decide which rows can be read/written.
grant select, insert, update, delete on public.calendars to authenticated;

-- Quick verification helpers; run these after the hotfix if you want:
-- select trigger_name from information_schema.triggers where event_object_table = 'calendars';
-- select policyname, cmd, qual, with_check from pg_policies where tablename = 'calendars';
