-- Run once on existing installations. Blockers live inside workspace reviews.
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

        if (v_out->idx ? 'blockerItems') or (it ? 'blockerItems') then
          select coalesce(jsonb_agg(b.value || case when old.value->>'completedAt' is not null then jsonb_build_object('completedAt', old.value->'completedAt') else '{}'::jsonb end order by b.ord), '[]'::jsonb) into extra
          from jsonb_array_elements(coalesce(it->'blockerItems', '[]'::jsonb)) with ordinality b(value,ord)
          left join lateral (select value from jsonb_array_elements(coalesce(v_out->idx->'blockerItems', '[]'::jsonb)) where value->>'id'=b.value->>'id' limit 1) old on true;
          select extra || coalesce(jsonb_agg(c), '[]'::jsonb) into extra
          from jsonb_array_elements(coalesce(v_out->idx->'blockerItems', '[]'::jsonb)) c
          where not exists (select 1 from jsonb_array_elements(coalesce(it->'blockerItems', '[]'::jsonb)) m where m->>'id'=c->>'id');
          it := jsonb_set(it, '{blockerItems}', extra, true);
        end if;
      end if;
      v_out := jsonb_set(v_out, array[idx::text], it);
    end if;
  end loop;
  return v_out;
end $$;


revoke all on function public._merge_items(jsonb, jsonb, boolean) from public, anon, authenticated;
