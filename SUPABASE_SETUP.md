# Quick setup — approvals, org chart, member logins, Google

1. Supabase > **SQL Editor**: paste all of [supabase/setup_all.sql](supabase/setup_all.sql) and run it (schema, sign-ups, member logins, approvals + org chart). If your admin email is not `tusharbali855@gmail.com`, change it first in the two admin lists inside that file. It is safe to run again.
2. `.env.local`:
   ```env
   VITE_BACKEND="supabase"
   VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="<publishable / anon key>"
   ```
   Restart `npm run dev`. Never put the service_role key in a `VITE_` variable.
3. **Authentication > Providers > Google**: enable it with your Google OAuth Client ID and Secret. In Google Cloud, add `https://<project-ref>.supabase.co/auth/v1/callback` to the client's *Authorized redirect URIs*. In **Authentication > URL Configuration** set Site URL to `http://127.0.0.1:3000` and add `http://127.0.0.1:3000/**` to Redirect URLs.
4. Sign up with the admin email (email or Google): that account becomes admin automatically. Everyone else signs up as **pending**, sees "Waiting for approval", and appears in **Users > Approval requests**. Approving picks a seat from the **Org chart** plus a role template. The accountable person (who approves their reports) comes from the seat's reporting line and falls back to the admin. To add admins later: `insert into public.admin_emails values ('ranjan@company.com');` (takes effect when that person signs up), or insert their user id into `public.admins`.

**Who approves what.** A person's *accountable* is the holder of the nearest filled seat above theirs on the Org chart (`reports_to`); if no seat above is filled it is the admin, who can always override. The accountable decides that person's target proposals, target-change requests, submitted reports and missed-entry unlock requests. Someone with a team sees a **My work / My team** switch in the top bar; **My team** shows only their team's items (`approver_apply`). Members only ever receive their own slice of the workspace (`member_workspace`), never the whole admin row, and can never approve their own work. Everyone can open **Org chart** to see their reporting line; it refreshes on focus and every minute, so admin changes show up for all.

Known limitation: members, accountables and the admin all write into the admin's single workspace document, and the admin's own save checks a revision number. If the admin gets "Workspace changed in another tab/device" right after someone else saved, reload the page — a merge-on-save for the admin is a follow-up.

The original notes follow.

> **Note:** the app now defaults to the local SQLite backend. Everything below applies only when you opt in with `VITE_BACKEND=supabase` (plus the Supabase URL and key in `.env.local`). `supabase/workspace-data.json` is the same data the local backend seeds its admin account with.

# Supabase setup

1. Create your Supabase project and open **SQL Editor**. Paste all of `supabase/schema.sql` and run it. The final queries should show `rowsecurity = true` and four ownership policies.
2. Under **Authentication > Providers**, enable Email/password. Keep email confirmation enabled if you want verified accounts.
3. Under **Authentication > URL Configuration**, set Site URL to your deployed app URL (locally: `http://127.0.0.1:3000`) and add this URL to Redirect URLs. Add your production URL when deploying.
4. Copy `.env.example` to `.env.local` and fill:

   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
   ```

   Use the public publishable key from the project's API Keys settings. A legacy anon key can be supplied as `VITE_SUPABASE_ANON_KEY` instead. Never use secret/service_role keys in the frontend.
5. Run `npm install` and `npm run dev`. For production, configure the same environment variables on your host **before building**.
6. Choose **Create an account**, enter name, email and password, and follow the confirmation email if enabled. Then sign in. Users appear in **Authentication > Users** automatically.

## Data model

- `auth.users`: Supabase-managed accounts, verified email, password hashes and user metadata. Do not create a password table yourself.
- `public.workspaces`: One row per account, keyed by `owner_id` referencing `auth.users.id`. `data` is JSONB containing all existing dynamic form data: people, role templates, reviews (daily/weekly/monthly), targets, late-entry requests, target-change requests, attendance, activity, settings and revision backups. JSONB preserves custom table columns, row definitions and historical snapshots without flattening or losing them.
- `revision`: Optimistic concurrency token. Saves are serialized; a stale tab cannot silently overwrite another tab's saved version. On conflict, download your pending backup and reload. The app loads current cloud data at sign-in/reload, not a live collaborative feed.
- Row-level security restricts all CRUD operations to the row owner. There is no client-side admin email allow-list.

Each login currently owns an **independent workspace** and manages its team records there. Team members listed inside it are records, not invited login accounts. **View as member** previews the workflow. Sharing the same workspace with separate employee logins and enforcing admin/member workflow transitions on the server requires a membership and invitation implementation; that is not provided by this account-owned schema.

New accounts now start with bundled members, templates, Excel history, persisted labelled demo history and 3 report summaries. See supabase/README.md and complete_setup_with_data.sql for the complete data package. Existing browser-only data is not automatically uploaded or mixed between accounts. Original localStorage is left untouched. Browser sample Excel downloads bundled with the frontend remain public reference assets.

## Verification after adding keys

- Sign up, confirm email, sign in, add a member, edit a review, and wait for **Saved to Supabase**. Reload and verify the changes remain.
- Sign in to that account in another browser: the same workspace should load.
- Sign in with a second account: it should have its own independent copy of the bundled team and history. Requests for the first account's workspace must return no rows under RLS.
- Edit the same loaded workspace in two tabs: after the first saves, the second should report a conflict instead of overwriting it.
- Disconnect the network and edit: the app must show a save failure, allow a backup download, and must not claim the change was saved.

Local validation: `npm run lint`, `npm test`, `npm run build`. Live auth/database and RLS tests require your project URL, key and executed SQL.

Official references: https://supabase.com/docs/guides/auth/passwords and https://supabase.com/docs/guides/database/postgres/row-level-security

## Reports and all bundled data

See [supabase/README.md](supabase/README.md) for the complete SQL/data package and where each report lives. Report source data and snapshots now persist in Supabase; `report_views.sql` adds 11 secure read-only views for querying each data category. Use Save report on the report screens, and find saved snapshots under Settings > Reports & source data.

## Push notifications (app closed)

Alerts reach a phone/desktop even when PestCure is closed. One-time setup:

1. Re-run `supabase/setup_all.sql` in the SQL editor (adds `push_subscriptions` + `push_audience`; safe to re-run).
2. Generate a VAPID key pair: `npx web-push generate-vapid-keys`.
3. Put the **public** key in `.env.local` as `VITE_VAPID_PUBLIC_KEY="..."` and restart / rebuild the app.
4. Deploy the edge function and set its secrets (Supabase CLI, project linked):
   ```
   supabase secrets set VAPID_PUBLIC_KEY="<public>" VAPID_PRIVATE_KEY="<private>" VAPID_SUBJECT="mailto:you@company.com"
   supabase functions deploy send-push
   ```
5. Each person opens the app (installed on iPhone: iOS 16.4+, Add to Home Screen first), taps the install/alert icon → **Turn on alerts**.

Who gets pushed: a member's submitted targets/reports/requests notify their accountable (the admin when none); an approval, return, adjustment or comment notifies the member. Enforced in `push_audience()` (a member cannot push their boss).

## Deactivate users and change roles

Re-run `supabase/setup_all.sql` once (adds the `inactive` status and `set_user_active()`).

- **Deactivate** (Users screen, user-off icon): the account can no longer sign in, gives up its org seat (their reports' approvals route to the next accountable / admin), stops getting push alerts and no new reports are generated. Everything already written is kept. Deactivated people appear under **Inactive** with a **Reactivate** button.
- **Change role** (pick another role on the user's card → Assign): mid-week, this week's report (and its daily/monthly sheets) stays on the old role with the same form and scoring. The new role starts from the next week of the review cycle: the card shows "From <date>: <role>", the calendar switches the person on that day, and next week's report is built from the new role. Past reports stay pinned to the role they were written on and the old role is listed on the card ("Earlier: …"). Picking the current role again cancels a scheduled change. A person with no report yet this week switches immediately.
