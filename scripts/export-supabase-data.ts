import { writeFileSync, readFileSync } from 'node:fs';
import { createSeedWorkspace } from '../src/workspace/reportData';
const anchor = process.argv[2] ?? '2026-09-08';
const workspace = createSeedWorkspace(anchor);
const json = JSON.stringify(workspace);
const quote = '$workspace_seed$';
if (json.includes(quote)) throw new Error('SQL delimiter collision');
writeFileSync('supabase/workspace-data.json', JSON.stringify(workspace, null, 2));
const seed = `-- First sign up in the app, then replace YOUR_SIGNUP_EMAIL below with that email.
-- This only initializes a new/empty workspace. Existing populated data is preserved.
-- To add missing bundled data to a populated workspace use Settings > Reports & source data.
begin;
do $seed$
declare
 target_email text := 'YOUR_SIGNUP_EMAIL';
 target_user uuid;
 payload jsonb := ${quote}${json}${quote}::jsonb;
 affected integer;
begin
 select id into target_user from auth.users where lower(email) = lower(target_email);
 if target_user is null then raise exception 'Sign up first, then replace YOUR_SIGNUP_EMAIL with your signup email.'; end if;
 insert into public.workspaces(owner_id, data) values(target_user, payload)
 on conflict(owner_id) do update set data = excluded.data, revision = workspaces.revision + 1, updated_at = now()
 where jsonb_array_length(workspaces.data->'people') = 0 and jsonb_array_length(workspaces.data->'reviews') = 0
 and jsonb_array_length(coalesce(workspaces.data->'savedReports','[]'::jsonb)) = 0;
 get diagnostics affected = row_count;
 if affected = 0 then raise notice 'Existing workspace preserved. Add missing bundled records using the app Settings.'; end if;
end $seed$;
commit;
`;
writeFileSync('supabase/seed_data.sql', seed);
writeFileSync('supabase/complete_setup_with_data.sql', readFileSync('supabase/schema.sql','utf8') + '\n' + readFileSync('supabase/report_views.sql','utf8') + '\n' + seed);
const manifest = { anchor, members: workspace.people.length, roles: workspace.roles.length, reviews: workspace.reviews.length, excelReviews: workspace.reviews.filter(r => r.source).length, demoReviews: workspace.reportData!.demoReviews.length, demoAttendance: workspace.reportData!.demoAttendance.length, actualAttendance: workspace.attendance!.length, savedReports: workspace.savedReports!.length, bytes: Buffer.byteLength(json) };
writeFileSync('supabase/data-manifest.json', JSON.stringify(manifest, null, 2));
console.log(manifest);
