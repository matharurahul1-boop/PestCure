-- ============================================================================
--  PestCure — scoped workspace access + accountable approvals
--  Paste into Supabase > SQL Editor > Run.
--  Requires schema.sql, users_table.sql, member_access.sql and org_approval.sql first
--  (supabase/setup_all.sql already contains everything in the right order).
--
--  What this does
--   * Members no longer read the admin's whole workspace row. member_workspace() hands each
--     account only its own slice — plus its team's slice when it is someone's accountable.
--   * A member can write only its OWN reviews / target-change requests / unlock requests
--     (member_apply) and can never move its own work to "approved".
--   * An accountable (the holder of the nearest filled seat above a person) can decide that
--     person's targets, reports, target-change and unlock requests (approver_apply).
--   * org_chart() lets every approved account see the chart + who its accountable is.
--  Idempotent.
-- ============================================================================

begin;

drop policy if exists workspace_member_select on public.workspaces;

-- ---- helpers (internal) ---------------------------------------------------------
create or replace function public._scoped_workspace(p_data jsonb, p_people text[])
returns jsonb language sql immutable set search_path = public as $$
  select (p_data - 'reportData' - 'savedReports' - 'referenceBackup' - 'legacy' - 'reviewRevisions')
    || jsonb_build_object(
      'people', coalesce((select jsonb_agg(t.e) from jsonb_array_elements(coalesce(p_data->'people','[]')) t(e) where t.e->>'id' = any(p_people)), '[]'),
      'roles',  coalesce((select jsonb_agg(t.e) from jsonb_array_elements(coalesce(p_data->'roles','[]')) t(e)
                          where t.e->>'id' in (select q.e->>'roleId' from jsonb_array_elements(coalesce(p_data->'people','[]')) q(e) where q.e->>'id' = any(p_people))), '[]'),
      'reviews', coalesce((select jsonb_agg(t.e) from jsonb_array_elements(coalesce(p_data->'reviews','[]')) t(e) where t.e->>'memberId' = any(p_people)), '[]'),
      'activity', coalesce((select jsonb_agg(s.e) from (select t.e from jsonb_array_elements(coalesce(p_data->'activity','[]')) t(e) where t.e->>'memberId' = any(p_people) limit 50) s), '[]'),
      'lateRequests', coalesce((select jsonb_agg(t.e) from jsonb_array_elements(coalesce(p_data->'lateRequests','[]')) t(e) where t.e->>'memberId' = any(p_people)), '[]'),
      'targetChangeRequests', coalesce((select jsonb_agg(t.e) from jsonb_array_elements(coalesce(p_data->'targetChangeRequests','[]')) t(e) where t.e->>'memberId' = any(p_people)), '[]'),
      'notifications', coalesce((select jsonb_agg(s.e) from (select t.e from jsonb_array_elements(coalesce(p_data->'notifications','[]')) t(e) where t.e->>'memberId' = any(p_people) limit 50) s), '[]'),
      'attendance', coalesce((select jsonb_agg(t.e) from jsonb_array_elements(coalesce(p_data->'attendance','[]')) t(e) where t.e->>'memberId' = any(p_people)), '[]'),
      'savedReports', '[]'::jsonb)
$$;

-- upsert items (by id) into a jsonb array; comments the sender had not seen yet are kept
create or replace function public._merge_items(p_arr jsonb, p_items jsonb, p_keep_comments boolean default false)
returns jsonb language plpgsql immutable as $$
declare v_out jsonb := coalesce(p_arr, '[]'::jsonb); it jsonb; idx int; extra jsonb;
begin
  for it in select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    idx := null;
    select (t.ord - 1)::int into idx from jsonb_array_elements(v_out) with ordinality t(v, ord) where t.v->>'id' = it->>'id' limit 1;
    if idx is null then
      v_out := v_out || jsonb_build_array(it);
    else
      if p_keep_comments then
        select coalesce(jsonb_agg(c), '[]'::jsonb) into extra
          from jsonb_array_elements(coalesce(v_out->idx->'comments', '[]'::jsonb)) c
         where not exists (select 1 from jsonb_array_elements(coalesce(it->'comments', '[]'::jsonb)) m where m->>'id' = c->>'id');
        if jsonb_array_length(extra) > 0 then it := jsonb_set(it, '{comments}', coalesce(it->'comments', '[]'::jsonb) || extra, true); end if;
      end if;
      v_out := jsonb_set(v_out, array[idx::text], it);
    end if;
  end loop;
  return v_out;
end $$;

revoke all on function public._scoped_workspace(jsonb, text[]) from public, anon, authenticated;
revoke all on function public._merge_items(jsonb, jsonb, boolean) from public, anon, authenticated;

-- person ids of everyone this account is accountable for (excludes itself)
create or replace function public._my_team_people(p_admin uuid)
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(m.person_id), '{}'::text[]) from public.member_links m
   where m.admin_id = p_admin and m.user_id <> auth.uid() and public.org_accountable(m.user_id) = auth.uid()
$$;
revoke all on function public._my_team_people(uuid) from public, anon, authenticated;

-- ---- read path -----------------------------------------------------------------
create or replace function public.member_workspace()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_link public.member_links; v_data jsonb; v_rev integer; v_team text[];
begin
  if not public.is_approved() then raise exception 'Your account is waiting for approval.'; end if;
  select * into v_link from public.member_links where user_id = auth.uid();
  if not found then return null; end if;
  select data, revision into v_data, v_rev from public.workspaces where owner_id = v_link.admin_id;
  if not found then raise exception 'Your workspace is not ready yet. Ask your admin to assign you a template.'; end if;
  v_team := public._my_team_people(v_link.admin_id);
  return jsonb_build_object(
    'adminId', v_link.admin_id, 'personId', v_link.person_id, 'revision', v_rev,
    'own', public._scoped_workspace(v_data, array[v_link.person_id]),
    'team', case when cardinality(v_team) > 0 then public._scoped_workspace(v_data, v_team) end,
    'teamPersonIds', to_jsonb(v_team));
end $$;
revoke all on function public.member_workspace() from public, anon;
grant execute on function public.member_workspace() to authenticated;

-- ---- member write path ------------------------------------------------------------
create or replace function public.member_apply(p jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare v_link public.member_links; v_data jsonb; it jsonb; ex jsonb; v_rev integer; v_from text; v_to text;
begin
  if not public.is_approved() then raise exception 'Your account is waiting for approval.'; end if;
  select * into v_link from public.member_links where user_id = auth.uid();
  if not found then raise exception 'Not a linked member.'; end if;
  select data into v_data from public.workspaces where owner_id = v_link.admin_id for update;
  if not found then raise exception 'Workspace not found.'; end if;

  for it in select value from jsonb_array_elements(coalesce(p->'reviews', '[]'::jsonb)) loop
    if it->>'memberId' is distinct from v_link.person_id then raise exception 'That review does not belong to you.'; end if;
    ex := (select t.e from jsonb_array_elements(coalesce(v_data->'reviews', '[]'::jsonb)) t(e) where t.e->>'id' = it->>'id' limit 1);
    if ex is not null and ex->>'memberId' is distinct from v_link.person_id then raise exception 'That review does not belong to you.'; end if;
    -- you cannot approve your own work: "approved" can only be carried over, never set
    if it->>'status' = 'approved' and ex->>'status' is distinct from 'approved' then raise exception 'Only your accountable can approve your report.'; end if;
    if it->>'targetStatus' = 'approved' and ex->>'targetStatus' is distinct from 'approved' then
      -- exception: a new period inheriting targets that were already approved for an earlier period
      if ex is not null or not exists (
        select 1 from jsonb_array_elements(coalesce(v_data->'reviews', '[]'::jsonb)) t(e)
         where t.e->>'memberId' = v_link.person_id and t.e->>'targetStatus' = 'approved' and t.e->>'week' < it->>'week')
      then raise exception 'Only your accountable can approve your targets.'; end if;
    end if;
  end loop;

  for it in select value from jsonb_array_elements(coalesce(p->'targetChangeRequests', '[]'::jsonb)) loop
    if it->>'memberId' is distinct from v_link.person_id then raise exception 'That request does not belong to you.'; end if;
    ex := (select t.e from jsonb_array_elements(coalesce(v_data->'targetChangeRequests', '[]'::jsonb)) t(e) where t.e->>'id' = it->>'id' limit 1);
    v_from := ex->>'status'; v_to := it->>'status';
    if v_from is distinct from v_to and not ((v_from is null and v_to = 'requested') or (v_from = 'edit-approved' and v_to = 'submitted')) then
      raise exception 'Only your accountable can decide target requests.'; end if;
  end loop;

  for it in select value from jsonb_array_elements(coalesce(p->'lateRequests', '[]'::jsonb)) loop
    if it->>'memberId' is distinct from v_link.person_id then raise exception 'That request does not belong to you.'; end if;
    ex := (select t.e from jsonb_array_elements(coalesce(v_data->'lateRequests', '[]'::jsonb)) t(e) where t.e->>'id' = it->>'id' limit 1);
    v_from := ex->>'status'; v_to := it->>'status';
    if v_from is distinct from v_to and not ((v_from is null and v_to = 'pending') or (v_from = 'approved' and v_to = 'completed')) then
      raise exception 'Only your accountable can decide unlock requests.'; end if;
  end loop;

  v_data := jsonb_set(v_data, '{reviews}', public._merge_items(v_data->'reviews', p->'reviews', true));
  v_data := jsonb_set(v_data, '{targetChangeRequests}', public._merge_items(v_data->'targetChangeRequests', p->'targetChangeRequests'));
  v_data := jsonb_set(v_data, '{lateRequests}', public._merge_items(v_data->'lateRequests', p->'lateRequests'));
  update public.workspaces set data = v_data, revision = revision + 1, updated_at = now() where owner_id = v_link.admin_id returning revision into v_rev;
  return v_rev;
end $$;
revoke all on function public.member_apply(jsonb) from public, anon;
grant execute on function public.member_apply(jsonb) to authenticated;

-- the old single-review entry point keeps working
create or replace function public.member_save_review(p_review jsonb)
returns integer language sql security definer set search_path = public as $$
  select public.member_apply(jsonb_build_object('reviews', jsonb_build_array(p_review)))
$$;
revoke all on function public.member_save_review(jsonb) from public, anon;
grant execute on function public.member_save_review(jsonb) to authenticated;

-- ---- accountable write path -------------------------------------------------------
create or replace function public.approver_apply(p jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare v_link public.member_links; v_data jsonb; v_team text[]; k text; it jsonb; ex jsonb; v_rev integer;
begin
  if not public.is_approved() then raise exception 'Your account is waiting for approval.'; end if;
  select * into v_link from public.member_links where user_id = auth.uid();
  if not found then raise exception 'Not a linked member.'; end if;
  v_team := public._my_team_people(v_link.admin_id);
  if cardinality(v_team) = 0 then raise exception 'No one reports to you.'; end if;
  select data into v_data from public.workspaces where owner_id = v_link.admin_id for update;
  if not found then raise exception 'Workspace not found.'; end if;

  foreach k in array array['reviews', 'targetChangeRequests', 'lateRequests', 'notifications'] loop
    for it in select value from jsonb_array_elements(coalesce(p->k, '[]'::jsonb)) loop
      if it->>'memberId' is null or not (it->>'memberId' = any(v_team)) then raise exception 'That item is not from your team.'; end if;
      ex := (select t.e from jsonb_array_elements(coalesce(v_data->k, '[]'::jsonb)) t(e) where t.e->>'id' = it->>'id' limit 1);
      if ex is not null and ex->>'memberId' is distinct from it->>'memberId' then raise exception 'That item is not from your team.'; end if;
    end loop;
  end loop;

  v_data := jsonb_set(v_data, '{reviews}', public._merge_items(v_data->'reviews', p->'reviews', true));
  v_data := jsonb_set(v_data, '{targetChangeRequests}', public._merge_items(v_data->'targetChangeRequests', p->'targetChangeRequests'));
  v_data := jsonb_set(v_data, '{lateRequests}', public._merge_items(v_data->'lateRequests', p->'lateRequests'));
  v_data := jsonb_set(v_data, '{notifications}', public._merge_items(v_data->'notifications', p->'notifications'));
  update public.workspaces set data = v_data, revision = revision + 1, updated_at = now() where owner_id = v_link.admin_id returning revision into v_rev;
  return v_rev;
end $$;
revoke all on function public.approver_apply(jsonb) from public, anon;
grant execute on function public.approver_apply(jsonb) to authenticated;

-- ---- the org chart, readable by every approved account -----------------------------
create or replace function public.org_chart()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_acc uuid;
begin
  if not public.is_approved() then raise exception 'Your account is waiting for approval.'; end if;
  v_acc := public.org_accountable(v_me);
  return jsonb_build_object(
    'positions', coalesce((select jsonb_agg(to_jsonb(p) order by p.sort) from public.org_positions p), '[]'::jsonb),
    'holders', coalesce((select jsonb_agg(jsonb_build_object('position_id', a.position_id, 'user_id', a.user_id,
                  'name', coalesce(nullif(u.full_name, ''), split_part(u.email, '@', 1)), 'email', u.email, 'from_date', a.from_date))
                from public.org_assignments a join public.app_users u on u.id = a.user_id where a.to_date is null), '[]'::jsonb),
    'admins', coalesce((select jsonb_agg(coalesce(nullif(u.full_name, ''), split_part(u.email, '@', 1)))
                from public.admins ad join public.app_users u on u.id = ad.user_id), '[]'::jsonb),
    'me', jsonb_build_object(
      'user_id', v_me,
      'position_id', (select a.position_id from public.org_assignments a where a.user_id = v_me and a.to_date is null),
      'accountable_user', v_acc,
      'accountable_name', (select coalesce(nullif(u.full_name, ''), split_part(u.email, '@', 1)) from public.app_users u where u.id = v_acc)));
end $$;
revoke all on function public.org_chart() from public, anon;
grant execute on function public.org_chart() to authenticated;

commit;
