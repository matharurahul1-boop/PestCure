-- Demo blockers for tushar.handysolver@gmail.com so you can see how Blocker logs look.
-- Paste in the Supabase SQL editor and Run. It adds 5 sample blockers to that person's 3 latest weekly reviews
-- (latest week: 2 open, the week before: 1 open + 1 completed, the one before: 1 completed).
-- Safe to re-run (it replaces earlier demo blockers). To remove them, run the REMOVE block at the bottom.
-- Tip: reload the app first and avoid editing at the same time, because this saves the shared workspace.

with target as (
  select w.owner_id from public.workspaces w join public.admins a on a.user_id = w.owner_id order by w.created_at asc limit 1
), me as (
  select e->>'id' as id
    from public.workspaces w, target t, jsonb_array_elements(w.data->'people') e
   where w.owner_id = t.owner_id and lower(e->>'email') = 'tushar.handysolver@gmail.com' limit 1
), rv as (
  select x.r, x.ord,
         (x.r->>'memberId' = (select id from me) and coalesce(x.r->>'periodKind','weekly') = 'weekly' and coalesce((x.r->>'demo')::boolean,false) = false) as mine
    from public.workspaces w, target t, jsonb_array_elements(w.data->'reviews') with ordinality x(r, ord)
   where w.owner_id = t.owner_id
), ranked as (
  select r, ord, mine, case when mine then row_number() over (partition by mine order by r->>'week' desc) end as rn from rv
), items as (
  select r, ord, mine, rn,
    case rn
      when 1 then jsonb_build_array(
        jsonb_build_object('id','demo-1','text','Client ke 3 payment cheque abhi tak clear nahi hue, accounts team se follow-up chahiye.','createdAt', now() - interval '1 day'),
        jsonb_build_object('id','demo-2','text','CRM me naye leads ka sync slow hai, kuch inquiries 2 din baad dikh rahi hain.','createdAt', now() - interval '3 hours'))
      when 2 then jsonb_build_array(
        jsonb_build_object('id','demo-3','text','Technician schedule clash ho raha hai Noida route par, supervisor ki approval pending.','createdAt', now() - interval '8 days'),
        jsonb_build_object('id','demo-4','text','Renewal quotation ka format client ne reject kiya, naya template chahiye.','createdAt', now() - interval '9 days','completedAt', now() - interval '6 days'))
      when 3 then jsonb_build_array(
        jsonb_build_object('id','demo-5','text','Vendor registration portal par login issue tha, IT ne reset kar diya.','createdAt', now() - interval '15 days','completedAt', now() - interval '12 days'))
    end as bl
  from ranked
), merged as (
  select ord,
    case when mine and rn <= 3 then
      r || jsonb_build_object(
        'blockerItems', coalesce((select jsonb_agg(b) from jsonb_array_elements(coalesce(r->'blockerItems','[]'::jsonb)) b where (b->>'id') not like 'demo-%'),'[]'::jsonb) || bl,
        'blockers', (select string_agg(b->>'text', E'\n\n') from jsonb_array_elements(bl) b))
    else r end as r
  from items
)
update public.workspaces w
   set data = jsonb_set(w.data, '{reviews}', (select jsonb_agg(r order by ord) from merged)), revision = w.revision + 1, updated_at = now()
 where w.owner_id = (select owner_id from target)
   and exists (select 1 from me);

-- check: how many demo blockers are in place
select count(*) as demo_blockers
  from public.workspaces w, jsonb_array_elements(w.data->'reviews') r, jsonb_array_elements(coalesce(r->'blockerItems','[]'::jsonb)) b
 where w.owner_id = (select w2.owner_id from public.workspaces w2 join public.admins a on a.user_id = w2.owner_id order by w2.created_at asc limit 1)
   and (b->>'id') like 'demo-%';

-- ---- REMOVE the demo blockers (run this block only when you are done looking) -------------------------
-- update public.workspaces w set revision = w.revision + 1, updated_at = now(),
--   data = jsonb_set(w.data, '{reviews}', (select jsonb_agg(
--     case when r ? 'blockerItems' then r || jsonb_build_object('blockerItems', coalesce((select jsonb_agg(b) from jsonb_array_elements(r->'blockerItems') b where (b->>'id') not like 'demo-%'),'[]'::jsonb)) else r end
--     order by ord) from jsonb_array_elements(w.data->'reviews') with ordinality t(r, ord)))
--  where w.owner_id = (select w2.owner_id from public.workspaces w2 join public.admins a on a.user_id = w2.owner_id order by w2.created_at asc limit 1);
