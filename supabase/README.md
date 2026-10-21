# Complete Supabase data package

## Setup order

1. Run `schema.sql` in Supabase SQL Editor (safe to rerun).
2. Fill the frontend `.env.local` with your Supabase URL and publishable key, restart, and create your account using the sign-up page. Confirm your email if enabled.
3. Open `complete_setup_with_data.sql`, replace `YOUR_SIGNUP_EMAIL` with that account's email, and run the whole file in SQL Editor. This includes the schema, all report views, and seed data. Reload the app after running it.

New accounts now automatically receive the bundled workspace and report source data on first login. If a populated workspace already exists, the SQL seed preserves it. To add missing bundled data to an older account, use **Settings > Reports & source data > Add bundled data & reports**. Existing IDs, edited templates and filled reviews are preserved.

## Included data (anchor: 8 September 2026)

| Data | Rows |
| --- | ---: |
| Members (Alka, Kajal, Deepika) | 3 |
| Role templates | 15 |
| Workspace and imported reviews | 22 |
| Uploaded Excel history within those reviews | 13 |
| Synthetic performance review history | 159 |
| Synthetic attendance history | 957 |
| Actual/manual/Engage attendance | 0 |
| Initial saved report summaries | 3 |

The 9 non-Excel reviews come from the existing starter workspace; they are not independently verified employee results. Excel imports retain their original draft status and source file/sheet metadata. Demo histories remain explicitly labelled synthetic. No missing real attendance, late requests or approval events were fabricated.

`workspace-data.json` contains the complete canonical payload, including dynamic fields/table definitions, targets, values, role/member forms, historical reviews, source provenance, demo history, settings, initial saved reports, activity and original/reference backups. The demo histories are persisted once, so they do not regenerate or silently move forward each time you reload.

## Where to find reports in the app

- **Performance**: period trends, member comparisons, workspace/Excel/demo source selection, CSV export and **Save report**.
- **Achievement breakdown**: member KPI contributions and the selected week's **Save report**.
- **Attendance**: saved actual records or persisted demo history, scores, CSV export and **Save report**.
- **Team > member > View profile**: role form, original Excel links and review history.
- **Settings > Reports & source data**: counts and downloadable saved report snapshots.
- **Settings > Workspace data > Download backup**: full current workspace, including reports and their source rows.

Wait for **Saved to Supabase** before closing. Snapshots created with Save report include the selected filters, results and supporting rows/policy. The 3 bundled summaries provide an initial overview of the seeded demo history. New snapshots are independent copies; later edits to source data do not rewrite previous snapshots.

## SQL objects

`public.workspaces` is the physical source-of-truth table. The following read-only **views** expose its persisted JSONB data as rows. They are not duplicate tables and stay current whenever the app saves:

| View | Contents |
| --- | --- |
| `workspace_members` | Names, email, assigned role and personal form |
| `role_templates` | All reusable form templates and definitions |
| `report_reviews` | Workspace, Excel, weekly/daily/monthly and demo review records, with source labels |
| `review_fields` | KRA/field definitions, numeric targets/values and custom table values |
| `report_attendance` | Actual and demo attendance, with source labels |
| `saved_reports` | Performance, attendance and achievement snapshots, filters and calculated payload |
| `workspace_settings` | Thresholds, attendance policy, calendar, integrations and original backups |
| `activity_log` | Workspace activity |
| `late_entry_requests` | Missed-entry requests and decisions |
| `target_change_requests` | Target-change workflow records |
| `review_revisions` | Historical review snapshots |

All views use `security_invoker = true` (PostgreSQL 15+) and the underlying workspace RLS. Authenticated callers can only read their own workspace. Anonymous callers have no read access. Write through the app/canonical workspace row; views are read-only to API callers.

Examples in SQL Editor (SQL Editor is privileged; filter by your owner ID if multiple accounts exist):

```sql
select owner_id, source, count(*) from public.report_reviews group by owner_id, source;
select owner_id, source, count(*) from public.report_attendance group by owner_id, source;
select owner_id, kind, title, source, created_at from public.saved_reports;
select name, email, role_id from public.workspace_members;
select * from public.review_fields where source = 'excel';
```

## Important boundaries

Accounts still own independent workspaces. Listing employees does not invite them as separate login accounts into a shared workspace. Original bundled Excel reference files are public frontend assets. Browser-only custom changes are not part of this repository export; the data package contains all data available in the project files, not unseen edits from another browser/device.

All data remains in one JSONB row per account to preserve the existing dynamic form model and atomic revisions. Large workspaces/snapshot archives send larger save payloads; this is not a normalized high-volume analytics warehouse. SQL views provide query access without divergent duplicate copies.

## Validation

`npm test` includes an actual local PostgreSQL runtime test of the complete SQL, seed counts, rerun preservation, authenticated owner reads/writes, and cross-account/anonymous access denial for all report views. `npm run lint` and `npm run build` validate the app. Live Supabase authentication requires your configured project and keys.

Rebuild the data package with `npm run supabase:export -- 2026-09-08` (or another YYYY-MM-DD demo anchor). This does not access a Supabase project or upload anything.
