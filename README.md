# PestCure Team Workspace

A redesigned workspace for role-based weekly reviews, target approvals and team performance.

## Run

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:3000**. No AI API key is required.

## Accounts and data (local SQLite)

`npm run dev` also starts the app's own backend (Express + SQLite, `server/`) under `/api` on the same port. Accounts, sessions and every workspace are stored in `server/data/pestcure.db`.

- On the first start an **admin account** (`handysolverteam@gmail.com`, or the first email in `ADMIN_EMAILS`) is created and loaded with the complete bundled data (`supabase/workspace-data.json`: members, 20 role templates, reviews, Excel history, demo performance and attendance, saved reports). Its generated password is saved to `server/data/demo-credentials.txt` (or set `DEMO_ADMIN_PASSWORD` before the first start).
- Anyone can **Create an account**; admin emails start with the bundled data, other accounts start with templates only. An admin links a signed-up account to a team member on the **Users** screen so that person signs in and sees only their own report.
- To start over, stop the server and delete `server/data/`.
- Production: `npm run build`, then `npm run server` (serves `dist/` and `/api` on one port, default 4000; see `.env.example`). Put it behind HTTPS and set `COOKIE_SECURE=true`.

## Workflow

1. Create a role template with custom KRAs, KPIs and review questions.
2. Add a member and assign a role to generate their weekly form.
3. Submit targets for admin approval.
4. Record results against approved targets and submit the review.
5. Approve the review or request changes with feedback.

Includes dashboards, per-member forms, weekly history, CSV export, JSON backups, dark mode and configurable performance colors.

## Checks

```sh
npm run lint
npm test
npm run build
```

Sign-in, per-account workspaces and member isolation are enforced by the bundled server (see [WORKSPACE.md](WORKSPACE.md)). Workflow rules (who may approve what) are still applied by the app, not the server. See [WORKSPACE.md](WORKSPACE.md) for data migration, calculation rules and implementation details.


## Supabase backend (optional)

SQLite is the default. To use Supabase instead, set `VITE_BACKEND=supabase` together with the Supabase keys. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Run `supabase/schema.sql` in your Supabase SQL Editor, fill `.env.local` from `.env.example`, and restart. Email/password authentication and account-owned cloud workspace persistence are now required.
