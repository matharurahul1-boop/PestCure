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
