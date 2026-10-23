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
