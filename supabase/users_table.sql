-- ============================================================================
--  PestCure — sign-ups table + admin table
--  Paste into Supabase > SQL Editor > Run.
--
--  Creates:
--   * public.app_users   — one row per Supabase sign-up (auto-filled by trigger)
--   * public.admins      — accounts allowed to see all sign-ups and assign
--   * on_auth_user_created trigger on auth.users
--
--  The "Users" screen reads public.app_users. Assigning a template writes
--  app_users.assigned_role_slug (a role template id such as
--  'role-crm-supervisor-lead').
--
--  Idempotent — safe to run more than once.
-- ============================================================================

begin;

-- --- tables ------------------------------------------------------------------
create table if not exists public.app_users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  full_name           text not null default '',
  assigned_role_slug  text,
  assigned_at         timestamptz,
  created_at          timestamptz not null default now()
);

create table if not exists public.admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

-- --- backfill + capture new sign-ups ---------------------------------------
insert into public.app_users (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- seed admins (EDIT / add emails here) --------------------------------
insert into public.admins (user_id)
select id from auth.users
where email in ('tusharbali855@gmail.com')
on conflict do nothing;

-- --- RLS -------------------------------------------------------------------
alter table public.app_users enable row level security;
alter table public.admins    enable row level security;

revoke all on public.app_users, public.admins from anon, authenticated;
grant select, update on public.app_users to authenticated;
grant select on public.admins to authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
grant execute on function public.is_admin() to authenticated;

drop policy if exists app_users_read on public.app_users;
create policy app_users_read on public.app_users for select to authenticated
  using (public.is_admin() or id = auth.uid());

drop policy if exists app_users_admin_update on public.app_users;
create policy app_users_admin_update on public.app_users for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins for select to authenticated
  using (user_id = auth.uid());

commit;

-- Verify:
select 'app_users' as t, count(*) from public.app_users
union all select 'admins', count(*) from public.admins;
