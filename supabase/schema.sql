-- Paste this entire file into Supabase > SQL Editor > Run.
-- Auth accounts/passwords are managed by Supabase in auth.users.
-- Each account owns one independent workspace; member previews are not login roles.
begin;
create table if not exists public.workspaces (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null,
 revision integer not null default 0 check (revision >= 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint workspace_shape check (
  jsonb_typeof(data) = 'object'
  and data @> '{"version":1}'::jsonb
  and jsonb_typeof(data->'roles') = 'array'
  and jsonb_typeof(data->'people') = 'array'
  and jsonb_typeof(data->'reviews') = 'array'
  and jsonb_typeof(data->'activity') = 'array'
  and jsonb_typeof(data->'thresholds') = 'object'
  and data ?& array['roles','people','reviews','activity','thresholds']
 )
);
alter table public.workspaces enable row level security;
revoke all on public.workspaces from anon, authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
drop policy if exists workspace_select on public.workspaces;
create policy workspace_select on public.workspaces for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists workspace_insert on public.workspaces;
create policy workspace_insert on public.workspaces for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists workspace_update on public.workspaces;
create policy workspace_update on public.workspaces for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists workspace_delete on public.workspaces;
create policy workspace_delete on public.workspaces for delete to authenticated using ((select auth.uid()) = owner_id);
commit;
-- Verify RLS and policies after running:
select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename = 'workspaces';
select policyname, cmd from pg_policies where schemaname = 'public' and tablename = 'workspaces';
