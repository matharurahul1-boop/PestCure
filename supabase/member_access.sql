-- ============================================================================
--  PestCure — member logins (Part 2)
--  Paste into Supabase > SQL Editor > Run.  Requires users_table.sql first.
--
--  Lets a team member sign in with their OWN account and see ONLY the weekly
--  report the admin assigned them. The admin's workspace row stays the single
--  source of truth; a member reads a filtered copy of it and can write back
--  just their own reviews through a guarded function.
--
--   * public.member_links   — maps a signed-up member account -> admin + person
--   * workspaces SELECT policy so a linked member can read the admin's row
--   * public.member_save_review(jsonb) — the only write a member can make
--
--  Idempotent.
-- ============================================================================

begin;

create table if not exists public.member_links (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  admin_id   uuid not null references auth.users(id) on delete cascade,
  person_id  text not null,               -- data.people[].id in the admin's workspace
  email      text not null,
  linked_at  timestamptz not null default now()
);
create index if not exists member_links_admin_idx on public.member_links(admin_id);

alter table public.member_links enable row level security;
revoke all on public.member_links from anon, authenticated;
grant select, insert, update, delete on public.member_links to authenticated;

drop policy if exists member_links_admin on public.member_links;
create policy member_links_admin on public.member_links for all to authenticated
  using (admin_id = auth.uid()) with check (admin_id = auth.uid());

drop policy if exists member_links_self on public.member_links;
create policy member_links_self on public.member_links for select to authenticated
  using (user_id = auth.uid());

-- A linked member may READ the admin's workspace row (the app filters it client-side;
-- writes are still blocked for them by the existing owner-only update policy).
drop policy if exists workspace_member_select on public.workspaces;
create policy workspace_member_select on public.workspaces for select to authenticated
  using (owner_id in (select admin_id from public.member_links where user_id = auth.uid()));

-- The only write a member can perform: replace/insert one of THEIR OWN reviews.
create or replace function public.member_save_review(p_review jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_admin uuid;
  v_person text;
  v_rev integer;
begin
  select admin_id, person_id into v_admin, v_person
  from public.member_links where user_id = auth.uid();
  if v_admin is null then raise exception 'Not a linked member.'; end if;
  if coalesce(p_review->>'memberId','') <> v_person then
    raise exception 'That review does not belong to you.';
  end if;

  update public.workspaces w
  set data = jsonb_set(
        w.data,
        '{reviews}',
        (
          select coalesce(jsonb_agg(
                   case when (r->>'id') = (p_review->>'id') then p_review else r end
                 ), '[]'::jsonb)
          from jsonb_array_elements(w.data->'reviews') r
        )
        || (
          case when not exists (
                 select 1 from jsonb_array_elements(w.data->'reviews') r
                 where (r->>'id') = (p_review->>'id'))
               then jsonb_build_array(p_review) else '[]'::jsonb end
        )
      ),
      revision = w.revision + 1,
      updated_at = now()
  where w.owner_id = v_admin
  returning w.revision into v_rev;

  return v_rev;
end $$;

revoke all on function public.member_save_review(jsonb) from anon;
grant execute on function public.member_save_review(jsonb) to authenticated;

commit;

-- Verify:
select 'member_links' as t, count(*) from public.member_links;
