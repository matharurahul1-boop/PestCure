-- ============================================================================
--  PestCure — FULL RESET for a fresh test run
--  Paste into Supabase > SQL Editor > Run.
--
--  Wipes ALL runtime data but keeps the schema, RLS, trigger and the 20 role
--  templates (templates live in code and are reloaded on next sign-in):
--    * every workspace row          -> deleted (recreated clean on next login)
--    * every app_users row          -> deleted (re-added as people sign up)
--    * every member_links row       -> deleted
--  public.admins is re-seeded from the email list below, so those accounts are
--  admins the moment they sign in.
--
--  Safe to run before users_table.sql / member_access.sql — missing tables are
--  skipped. Does NOT delete Supabase Auth users (to sign up again with the same
--  email, remove it in Authentication > Users, or just Sign in).
--
--  Idempotent.
-- ============================================================================

-- >>> Admin emails: edit this list. These accounts are admin on sign-in. <<<
do $$
declare
  admin_emails text[] := array['handysolverteam@gmail.com', 'tusharbali855@gmail.com'];
  admin_emails_now text;
begin
  if to_regclass('public.member_links') is not null then
    execute 'truncate table public.member_links';
  end if;

  if to_regclass('public.app_users') is not null then
    execute 'truncate table public.app_users';
  end if;

  if to_regclass('public.workspaces') is not null then
    execute 'delete from public.workspaces';
  end if;

  if to_regclass('public.admins') is not null then
    execute 'insert into public.admins (user_id) select u.id from auth.users u where u.email = any($1) on conflict do nothing'
      using admin_emails;
    execute 'delete from public.admins a using auth.users u where a.user_id = u.id and not (u.email = any($1))'
      using admin_emails;
    execute 'select string_agg(u.email, '', '') from public.admins a join auth.users u on u.id = a.user_id'
      into strict admin_emails_now;
    raise notice 'Admins now: %', coalesce(admin_emails_now, '(none — those emails have not signed up yet)');
  end if;
end $$;

-- Verify:
select 'workspaces' as t, count(*) as rows from public.workspaces;
