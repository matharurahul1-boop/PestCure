-- PestCure: pending Supabase update (paste into the SQL editor and Run). Safe to re-run.
-- Adds: shared admin workspace, status "inactive" for app_users, set_user_active() RPC, push_subscriptions table, push_audience() function.

-- ---- 1. app_users.status may now be "inactive" (deactivated user) ------------------------------
alter table public.app_users drop constraint if exists app_users_status_check;
alter table public.app_users add constraint app_users_status_check check (status in ('pending','approved','rejected','inactive'));

-- ---- 2. deactivate / reactivate -------------------------------------------------------------
-- Deactivate / reactivate an account. A deactivated account cannot sign in to the workspace
-- (every member RPC and the workspace policies already require status = 'approved'), gives up its
-- org seat so approvals route to the next accountable, and stops receiving push alerts.
-- Their reports and history stay in the workspace untouched.
create or replace function public.set_user_active(p_user uuid, p_active boolean, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only an admin can activate or deactivate users.'; end if;
  if exists (select 1 from public.admins where user_id = p_user) then raise exception 'An admin account cannot be deactivated.'; end if;
  if not exists (select 1 from public.app_users where id = p_user) then raise exception 'User not found.'; end if;
  if p_active then
    update public.app_users set status = 'approved', decided_at = now(), decided_by = auth.uid(), reject_reason = null
     where id = p_user and status = 'inactive';
    if not found then raise exception 'Only a deactivated user can be reactivated.'; end if;
  else
    update public.app_users set status = 'inactive', decided_at = now(), decided_by = auth.uid(), reject_reason = nullif(trim(p_reason), '')
     where id = p_user and status = 'approved';
    if not found then raise exception 'Only an approved user can be deactivated.'; end if;
    update public.org_assignments set to_date = current_date where user_id = p_user and to_date is null;
    if to_regclass('public.push_subscriptions') is not null then delete from public.push_subscriptions where user_id = p_user; end if;
  end if;
  return jsonb_build_object('status', case when p_active then 'approved' else 'inactive' end);
end $$;
revoke all on function public.set_user_active(uuid, boolean, text) from public, anon;
grant execute on function public.set_user_active(uuid, boolean, text) to authenticated;


-- ---- 3. Web Push: devices + who may be notified ----------------------------------------------
-- Web Push: one row per browser/device that turned alerts on.
create table if not exists public.push_subscriptions (
  endpoint    text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_own_select on public.push_subscriptions;
drop policy if exists push_own_insert on public.push_subscriptions;
drop policy if exists push_own_update on public.push_subscriptions;
drop policy if exists push_own_delete on public.push_subscriptions;
create policy push_own_select on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_own_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid() and public.is_approved());
create policy push_own_update on public.push_subscriptions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_own_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- Who may be pushed by whom. Called only by the send-push edge function (service role).
--   'member'      : the caller (an admin, or that person's accountable) pushes one person, found by email
--   'accountable' : the caller pushes whoever approves for them (their accountable, else the admins)
create or replace function public.push_audience(p_caller uuid, p_kind text, p_email text default null)
returns table (endpoint text, p256dh text, auth text)
language plpgsql stable security definer set search_path = public as $$
declare v_targets uuid[]; v_acc uuid;
begin
  if not (exists (select 1 from public.admins where user_id = p_caller)
          or exists (select 1 from public.app_users where id = p_caller and status = 'approved')) then
    return;
  end if;
  if p_kind = 'member' then
    select array_agg(u.id) into v_targets from public.app_users u
     where lower(u.email) = lower(coalesce(p_email, '')) and u.status = 'approved'
       and (exists (select 1 from public.admins where user_id = p_caller) or public.org_accountable(u.id) = p_caller);
  elsif p_kind = 'accountable' then
    v_acc := public.org_accountable(p_caller);
    v_targets := case when v_acc is not null then array[v_acc] else array(select user_id from public.admins) end;
  end if;
  return query select s.endpoint, s.p256dh, s.auth from public.push_subscriptions s where s.user_id = any(coalesce(v_targets, '{}'));
end $$;
revoke all on function public.push_audience(uuid, text, text) from public, anon, authenticated;
do $g$ begin if exists (select 1 from pg_roles where rolname = 'service_role') then grant execute on function public.push_audience(uuid, text, text) to service_role; end if; end $g$;


-- ---- 4. all admins share one workspace (Tushar and Ranjan sir see the same data) ---------------
-- All admins work in ONE shared workspace (the oldest admin workspace, i.e. Tushar's).
-- Without this every admin would get their own empty workspace. Safe to re-run.

create or replace function public.shared_workspace_owner()
returns uuid language sql stable security definer set search_path = public as $$
  select w.owner_id
    from public.workspaces w
    join public.admins a on a.user_id = w.owner_id
   where public.is_admin()
   order by w.created_at asc
   limit 1
$$;
revoke all on function public.shared_workspace_owner() from public, anon;
grant execute on function public.shared_workspace_owner() to authenticated;

-- any admin may read and save the shared workspace (on top of the owner's own policies)
drop policy if exists workspace_admin_select on public.workspaces;
drop policy if exists workspace_admin_update on public.workspaces;
create policy workspace_admin_select on public.workspaces for select to authenticated
  using (public.is_admin() and owner_id = public.shared_workspace_owner());
create policy workspace_admin_update on public.workspaces for update to authenticated
  using (public.is_admin() and owner_id = public.shared_workspace_owner())
  with check (public.is_admin() and owner_id = public.shared_workspace_owner());
