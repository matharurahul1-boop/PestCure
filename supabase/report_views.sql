-- Read-only SQL views over the canonical workspace JSONB.
-- security_invoker ensures the underlying workspaces ownership RLS is applied.
begin;
create or replace view public.workspace_members with (security_invoker = true) as
select w.owner_id, r->>'id' as id, r->>'name' as name, r->>'email' as email, r->>'roleId' as role_id, r as record
from public.workspaces w cross join lateral jsonb_array_elements(w.data->'people') r;
create or replace view public.role_templates with (security_invoker = true) as
select w.owner_id, r->>'id' as id, r->>'name' as name, r as record
from public.workspaces w cross join lateral jsonb_array_elements(w.data->'roles') r;
create or replace view public.report_reviews with (security_invoker = true) as
select w.owner_id, r->>'id' as id, r->>'memberId' as member_id, r->>'week' as period_start,
coalesce(r->>'periodKind','weekly') as period_kind,
case when r->>'demo' = 'true' then 'demo' when r ? 'source' then 'excel' else 'workspace' end as source,
r->>'status' as status, r->>'targetStatus' as target_status, r as record
from public.workspaces w cross join lateral jsonb_array_elements(w.data->'reviews') r
union all
select w.owner_id, r->>'id', r->>'memberId', r->>'week', coalesce(r->>'periodKind','weekly'), 'demo', r->>'status', r->>'targetStatus', r
from public.workspaces w cross join lateral jsonb_array_elements(coalesce(w.data#>'{reportData,demoReviews}','[]'::jsonb)) r;
create or replace view public.report_attendance with (security_invoker = true) as
select w.owner_id, r->>'id' as id, r->>'memberId' as member_id, r->>'date' as attendance_date, r->>'status' as status, r->>'source' as source, r as record
from public.workspaces w cross join lateral jsonb_array_elements(coalesce(w.data->'attendance','[]'::jsonb)) r
union all
select w.owner_id, r->>'id', r->>'memberId', r->>'date', r->>'status', 'demo', r
from public.workspaces w cross join lateral jsonb_array_elements(coalesce(w.data#>'{reportData,demoAttendance}','[]'::jsonb)) r;
create or replace view public.saved_reports with (security_invoker = true) as
select w.owner_id, r->>'id' as id, r->>'kind' as kind, r->>'title' as title, r->>'source' as source, r->>'createdAt' as created_at, r->'filters' as filters, r->'payload' as payload
from public.workspaces w cross join lateral jsonb_array_elements(coalesce(w.data->'savedReports','[]'::jsonb)) r;
create or replace view public.review_fields with (security_invoker = true) as
select r.owner_id, r.id as review_id, r.member_id, r.source, f->>'id' as field_id, f->>'label' as label, f->>'kra' as kra,
f as definition, r.record->'targets'->(f->>'id') as target, r.record->'values'->(f->>'id') as value, r.record->'tables'->(f->>'id') as table_values
from public.report_reviews r cross join lateral jsonb_array_elements(r.record->'fields') f;
create or replace view public.workspace_settings with (security_invoker = true) as
select owner_id, data->'thresholds' as thresholds, data->'attendancePolicy' as attendance_policy, data->'calendar' as calendar,
data->'theme' as theme, data->'engage' as engage, data->'zoho' as zoho, data->'referenceBackup' as reference_backup, data->'legacy' as legacy_backup
from public.workspaces;
create or replace view public.activity_log with (security_invoker = true) as
select w.owner_id, r->>'id' as id, r as record from public.workspaces w cross join lateral jsonb_array_elements(w.data->'activity') r;
create or replace view public.late_entry_requests with (security_invoker = true) as
select w.owner_id, r->>'id' as id, r as record from public.workspaces w cross join lateral jsonb_array_elements(coalesce(w.data->'lateRequests','[]'::jsonb)) r;
create or replace view public.target_change_requests with (security_invoker = true) as
select w.owner_id, r->>'id' as id, r as record from public.workspaces w cross join lateral jsonb_array_elements(coalesce(w.data->'targetChangeRequests','[]'::jsonb)) r;
create or replace view public.review_revisions with (security_invoker = true) as
select w.owner_id, r->>'id' as id, r as record from public.workspaces w cross join lateral jsonb_array_elements(coalesce(w.data->'reviewRevisions','[]'::jsonb)) r;
revoke all on public.workspace_members, public.role_templates, public.report_reviews, public.report_attendance, public.saved_reports, public.review_fields, public.workspace_settings, public.activity_log, public.late_entry_requests, public.target_change_requests, public.review_revisions from anon, authenticated;
grant select on public.workspace_members, public.role_templates, public.report_reviews, public.report_attendance, public.saved_reports, public.review_fields, public.workspace_settings, public.activity_log, public.late_entry_requests, public.target_change_requests, public.review_revisions to authenticated;
commit;
