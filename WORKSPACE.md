# PestCure team workspace

## Uploaded review formats

The three supplied Excel files are now included as editable role forms: Alka (17 sections), Deepika (16 sections), Kajal (15 sections), plus 13 filled historical sheets. Go to **Users → member name (View profile)** for the current form, original Excel download and review history. **View as member** opens that person's preview.

Sixteen more uploaded workbooks are included as assignable role templates (`src/data/extraRoleTemplates.ts`), one per person: *Accounts & Payments Executive* (Barkha), *Accounts & Payroll Executive* (Sahil), *Sales Supervisor — CRM & Leads* as five separately named templates sharing one field set (Dharam, Gautam, Mark David, Dharmendra, Ravi), *BD Executive — Sales Support* (Aparna), *Technician Operations Supervisor* (Anand), *DS Schedule & Operations Coordinator* (Ajeet), *Customer Care Executive — Data & Billing* (Divya), *Schedule Management Executive* (Sufiyan), *Reticulation Sales & Team Building* (Rinku), *Project Sales & Business Development* (Praveen), *Sales & Lead Management Executive* (Payal) and *CRM & Supervisor Lead* (Vijay — renewals/LD calling, retail-counter touchbase, referral-partner lead generation, field-supervisor training and review, sales metrics and OV targets). With the three reference Excel formats (Alka, Deepika, Kajal) and the generic *Field Operations* template, a fresh workspace has 20 role templates. They are merged into the workspace on load if absent (`ensureExtraRoles`), so an admin can pick them when adding a member and the weekly form is generated from those KRA sections (attendance, daily activity, weekly/monthly trackers, sales/OV targets, running accounts, client feedback, achievements, stuck points, learning, weekly summary). Editing or deleting a template afterwards is respected; it is only re-added when missing.

**Users** (admin nav, `src/workspace/AssignReportsScreen.tsx`) replaces the old *Team* screen. One screen: add a user, pick a role template per user, and "Assign & generate" creates that person's weekly report from the template; "Generate this week" covers anyone still missing one. Per-row icons edit the user (name/email/role), customize their form, or open "view as member". Clicking a name opens the member profile (Excel history, performance). Choosing a new template updates future weeks and regenerates an untouched draft for the current week; started or approved reports keep their original form. The bundled templates (`ensureExtraRoles`) are also merged into an already-saved cloud workspace on load, so new templates such as *CRM & Supervisor Lead* reach existing accounts.

New cloud accounts now start from `templatesOnlyWorkspace()` — the 20 role templates and nothing else (no sample members, reviews or demo data). `createSeedWorkspace()` (sample members + Excel history + demo reports) is still in the code and tests but its "Add bundled data & reports" button is hidden while `MINIMAL_UI` is on. To strip an existing account back to templates only, run [supabase/reset_to_templates.sql](supabase/reset_to_templates.sql) (destructive; back up first).

**Minimal UI** (`MINIMAL_UI = true` in `src/workspace/WorkspaceApp.tsx`): the nav is trimmed to the core flow — admin sees **Users**, **Weekly reviews**, **Approvals**; a member sees only **Weekly reviews**. Overview dashboards, Performance, Achievement breakdown, Attendance, Role templates, Daily & monthly, Missed entries, Zoho, thresholds and the bundled-data button are all still in the code but hidden. Set `MINIMAL_UI = false` to restore the full workspace. The brand mark is the PestCure shield logo extracted from `Pestcure logo.pdf` — `public/pestcure-logo.png` (+ regenerated `pwa-*`, `apple-touch-icon`, `favicon-48`, `icon.svg`); theme colour is brand green `#1a4d2e`.

**Sign-ups:** [supabase/users_table.sql](supabase/users_table.sql) adds `public.app_users` (one row per Supabase sign-up, auto-filled by an `auth.users` trigger) and `public.admins` (accounts allowed to see everyone; seeds `handysolverteam@gmail.com` + `tusharbali855@gmail.com`). The **Users** screen (`AssignReportsScreen.tsx` + `appUsers.ts`) shows **only signed-up accounts as cards** — no manual "add user". Pick a template and **Assign**: it writes `app_users.assigned_role_slug`, creates the workspace user from the sign-up, generates this week's report, and (Part 2) writes a `member_links` row. "View as" opens the workspace as that user. Settings → Workspace data has **Clear sample data (keep templates)**.

**Sign-in screen** (`AuthGate.tsx` + `auth.css`) — branded PestCure split layout: green marketing panel (big 3D-floating logo, faint logo watermark, feature list) + form panel with **Continue with Google** (`supabase.auth.signInWithOAuth`; the Google provider must be enabled in the Supabase dashboard and the Supabase callback URL added to the Google OAuth client's authorized redirect URIs — a `redirect_uri_mismatch` means that URI is missing) over email/password. A CSS-only layer of animated flying "bugs" (`BugField`) drifts across the background; all motion respects `prefers-reduced-motion`.

**Fresh test run:** [supabase/reset_all.sql](supabase/reset_all.sql) truncates `member_links` + `app_users` and deletes every `workspaces` row (a clean `templatesOnlyWorkspace()` is recreated on next sign-in), then re-seeds `public.admins` from its email list — those accounts are admin the moment they sign in. `loadCloudWorkspace` also now checks `public.admins` first, so an admin-listed account is never treated as a member. It does not touch Supabase Auth users.

**Member logins (Part 2):** [supabase/member_access.sql](supabase/member_access.sql) adds `public.member_links` (member account → admin + `data.people[].id`), a `workspaces` SELECT policy letting a linked member read the admin's row, and `public.member_save_review(jsonb)` — the only write a member can make (merges one of *their own* reviews into the admin's blob, guarded by `member_links`). `src/workspace/cloud.ts` `loadCloudWorkspace` now returns `{ workspace, revision, member? }`: a linked member gets a **filtered** copy of the admin workspace (their person, their role, their reviews only); `WorkspaceShell` runs them as a non-admin actor with nav `[Weekly reviews, Daily & monthly, Missed entries]`, and their edits save through `saveMemberReviews` (per-review RPC) instead of the full-blob upsert. Run order: `users_table.sql` → `member_access.sql`. Google provider still needs enabling in the Supabase dashboard.

Admin can edit a member form or a reusable role template, add/reorder rows, add columns, set defaults, choose target ownership, and configure sums or target percentages. The editor can optionally apply changes to open reviews. Completed reviews are preserved by bulk changes. Editing an individual completed review deliberately creates a new draft requiring approval; its previous version remains in the admin backup's `reviewRevisions`.

The import is versioned and runs once for existing browser storage. Empty drafts adopt the new formats. Existing filled records are retained; `referenceBackup` preserves the pre-import state. Imported reviews start as drafts for verification, not as approved records. Workbook date inconsistencies are flagged rather than silently corrected. Source formulas containing errors are not imported as results; calculations are performed from numeric inputs. Arithmetic text remains text until an admin/member enters a verified number. Original workbooks are available in each member profile. This local app does not provide authentication for those downloads.

Table percentages use configured input columns, target column and multiplier (6 for the daily trackers). A zero target is deliberately unscored. Leave/off entries remain visible and contribute zero to daily sums. Required table mode requires every result cell; optional tables may be partially filled. Form completion reflects actual responses even for optional tables.

## Run locally

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Scripts call Node directly so they also work in Windows directories containing `&`.

## Working features

- Admin overview and member-specific dashboards, weekly filtering, searchable review lists, CSV export and browser printing.
- Reusable role templates with KRA sections, numeric KPIs, written responses, completion fields, required fields, default weekly targets, target ownership and higher/lower achievement direction.
- Adding a member assigns a role and immediately creates the current week's form. Admin can customize that draft, or customize the member's template for future weeks.
- Target draft → proposal → admin approval / requested changes. Approved targets are locked. Results become editable only after target approval.
- Results draft → submission → admin approval / requested changes. Submitted and approved reviews are read-only. Returning a review requires feedback and unlocks its results for resubmission.
- Bulk weekly creation prevents duplicate member/week reviews. Role and field definitions are copied into each review; later template changes do not rewrite historical forms.
- Light, dark and system appearance; configurable green/amber/red performance thresholds.
- Browser persistence, save-error reporting, JSON backup and a local activity log.

## Supabase authentication and persistence

Email/password sign up and sign in are required. Cloud data is isolated per account using RLS; each account owns its own workspace. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for SQL, keys, setup and current sharing limitations. Previous local-mode behavior described below is retained as historical context only.

On first run, the app imports legacy `pestcure_review_members_v2` and `pestcure_role_templates_v2` when present. Otherwise, it starts with the repository's three sample members. Existing storage keys are never modified. Original member records are included in the admin JSON backup; the new UI maps daily results, weekly responsibilities, commercial outcomes, tender pipeline and revenue into generic review fields. Other legacy-only sections remain in that original backup. Old date ranges are shown in imported review detail; the weekly list groups records by the Monday containing their original start date.

Scores are available only for approved targets. Each numeric KPI uses actual ÷ target; lower-is-better metrics invert that ratio and treat zero actual as 100%. The overall score averages eligible numeric fields, caps each contribution at 100%, and treats missing results as zero. A zero or missing numeric target has no score. A completion response of “Not completed” is a valid filled response, distinct from an unanswered field.

## Validation

```sh
npm run lint
npm test
npm run build
```

TypeScript follows the active application entry points, new workspace, tests, and Vite configuration. Original unused components and context remain in the repository for reference and are outside the new runtime's type-check scope. Their original type errors were exposed by installing the previously missing React definitions.

Business tests cover role snapshots, personal overrides, approval permissions and transitions, required values, feedback, zero results, achievement and week boundaries. Browser verification covers creating a role/member, automatic form assignment, target locking, review revisions, final approval and reload persistence.


Review calendar and missed entries
---------------------------------
Settings → Review calendar selects a fixed week-start day once. All automatic deadlines use Asia/Kolkata. The local app checks each second while running and reconciles all elapsed periods on startup/focus, so reopening on Monday creates the next weekly form. Browser-closed execution and secure multi-user enforcement still require a backend scheduler, authentication and server-side clocks; this remains a local workspace.

Daily weekday columns are writable only on their own dates after target approval. Daily standalone fields have separate daily records. Monthly fields (including Monthly OP/SR rows in mixed tables) have a single monthly record independent of weekly rollover. Admins choose field/row frequencies in the form editor. Templates and personal forms are used for future periods. Previous periods freeze; ordinary writes and form edits cannot change them. Tracking begins on activation/joining, not retroactively.

Missed entries lists blank overdue input cells (zero and false count as filled). Members must supply a reason to request a specific cell. Admin can approve for 24 hours or reject with a reason. Approved late entry is submitted from that screen, recorded with request/decision/submission timestamps, and immediately locked again. Old review snapshots remain in admin backups. Completed cells are never reopened by this workflow.

Tests cover IST midnight, configurable week boundaries, offline catch-up, monthly continuity, mixed-frequency rows, future daily locks, new-member start dates, request ownership, admin-only decisions, expiry, and one-time submission.


Performance and attendance reporting
------------------------------------
Admin → Users → member name → View profile opens the member form, actual/Excel history, Demo history, and a direct Performance reports button. Performance supports team/member filters, Demo/Workspace/Excel sources, this week, last week, this month, 3 months, 6 months, 1 year and custom dates. Trends group by week/month; a selected bar filters its forms. The 3/6/12 presets use completed calendar months. Exported CSV keeps the source label. Synthetic demo data is generated in memory: 52 approved weekly forms for each of the three users, spanning 12 complete months. It is not persisted or combined with real results.

Attendance has a separate screen and one year of in-memory demo rows for all three users. Admin configures points for present, absent, half day, short day, approved leave, holiday, late penalty and maximum daily score. Holiday rows are excluded from the percentage denominator. Settings accepts an HTTPS Engage attendance endpoint plus each member's external employee ID. Sync sends from/to query dates with the current browser session, validates every returned row before importing, maps employeeId (or email), supports present/absent/half-day/short-day/leave/holiday, and replaces only the matching member-date. API secrets are not stored. A bearer-token integration or different payload contract requires a secure backend adapter.

Low performance uses a muted yellow supportive state rather than red; thresholds stay configurable. Demo data is clearly labeled throughout to avoid representing synthetic results as employee history.


Zoho sync (pilot)
-----------------
Settings → **Zoho sync** lets an admin pull data team members enter in Zoho into their weekly review. Zoho's API needs OAuth with a client secret, which a browser app cannot hold, so this is the app-side half only: `endpoint` must point at a small backend adapter the customer runs that talks to Zoho and returns plain JSON. The adapter is called as `GET <endpoint>?member=<zohoId>&from=<yyyy-mm-dd>&to=<yyyy-mm-dd>&org=<orgId>&dc=<dc>` and should return an array (or `{ data: [...] }`) of `{ zohoId | memberId | email, week | date, metrics: { <key>: value } }` rows; flat rows without a `metrics` object also work.

Configuration (`workspace.zoho`, `src/workspace/zoho.ts`) holds the endpoint, data centre, optional org id, a per-member Zoho id map, and field mappings. Each mapping binds one payload key to a field or table cell of a chosen role's form (`targetOptions` flattens a role into pickable targets). With no endpoint set, mappings still save but nothing syncs. On an open weekly review (admin, not frozen) a **Sync from Zoho** button fetches that member's week, `normalizeZohoPayload` maps rows to members and validates them, and `applyZohoRow` writes the mapped values into `values` / `tables`; the run is logged to activity and `lastSyncAt` is recorded. Numbers below zero and unmatched rows are rejected with a specific message. This is deliberately a small pilot — start with one or two mappings and expand once the adapter and exact field list are settled.

Achievement breakdown
---------------------
Admin-only Achievement breakdown opens member cards for a selected week and source. The screen defaults to the latest completed synthetic week, provides a full 52-week selector plus previous/next controls, member search, and separate Demo/Workspace/Excel sources. Each card sorts the weakest scored KPI first and shows KRA, actual, target, capped achievement percentage, and the point gap to target. It opens the exact weekly form used for the calculation and returns to the breakdown. Missing results count as zero; zero targets, unapproved targets and not-scored rows are excluded, matching the overall score implementation.

## September 8: persisted reports and full data package

This supersedes earlier descriptions of demo history being generated only in memory: demo reviews and attendance now persist separately in `reportData`, and report snapshots in `savedReports`. New accounts get the full bundled dataset. Performance, Attendance and Achievement breakdown offer Save report; snapshots are in Settings > Reports & source data. See [supabase/README.md](supabase/README.md) for all SQL views, source labels, counts and setup.


Local SQLite backend
--------------------
`server/` is an Express API (`server/app.ts`) backed by Node's built-in `node:sqlite`. `npm run dev` mounts it under `/api` through a Vite plugin (`vite.config.ts`); `npm run server` serves `dist/` plus `/api`. Tables mirror the Supabase layout: `users` (account, scrypt password hash, admin flag, assigned template), `sessions` (hashed random tokens in an HttpOnly, SameSite=Lax cookie, 30 days), `workspaces` (one JSON document per owner plus a `revision`) and `member_links`.

Behaviour matches the Supabase version: `GET/POST/PUT /api/workspace` load, create and save the owner's workspace; a save with a stale revision returns 409 so a second tab cannot overwrite it silently; a linked member receives a copy filtered to their own person, reviews and requests (`src/workspace/memberFilter.ts`) and may only write their own reviews through `POST /api/workspace/member-review`. Admin-only routes list all accounts, assign a template and link a member. Passwords are hashed with scrypt, sign-in failures are throttled per client and account, and cross-origin writes are rejected. `VITE_BACKEND=supabase` switches the same client modules (`auth.ts`, `cloud.ts`, `appUsers.ts`) back to Supabase.

Limits: a member's review upload is trusted for its contents (the same as the Supabase RPC), so approval rules are enforced by the app, not the server; there is no password reset or email confirmation; data is one SQLite file, so back up `server/data/`. Tests: `tests/localBackend.test.ts`.
