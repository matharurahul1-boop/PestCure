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
