-- Make rks@pest-cure.com (Ranjan sir) an admin. Paste in the Supabase SQL editor and Run. Safe to re-run.
-- Works whether or not they have signed up yet: a new sign-up becomes an approved admin automatically,
-- and an account that already exists is promoted right now.
insert into public.admin_emails (email) values ('rks@pest-cure.com') on conflict do nothing;

insert into public.admins (user_id)
select u.id from auth.users u where lower(u.email) = 'rks@pest-cure.com'
on conflict do nothing;

update public.app_users set status = 'approved', decided_at = coalesce(decided_at, now()), reject_reason = null
 where lower(email) = 'rks@pest-cure.com';

-- check: should list both admins (rks shows once they have signed up)
select e.email as admin_email, (select count(*) from public.admins a join auth.users u on u.id = a.user_id and lower(u.email) = lower(e.email)) as signed_up_as_admin
  from public.admin_emails e order by 1;
