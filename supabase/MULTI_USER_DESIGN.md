# Multi-user logins — design proposal (Part 2)

> Status: **proposal, not built.** Review this, then we implement in phases.
> Goal: each team member signs up with their **own** Supabase login. An admin
> assigns them a role template. The member logs in and sees **only their own**
> weekly reports — nothing else in the workspace.

---

## 1. Where we are today

- One `public.workspaces` row per Supabase account, holding the **entire**
  workspace as a single `jsonb` blob (`data` = roles + people + reviews + …).
- RLS: `owner_id = auth.uid()` — an account can only ever touch its own row.
- "Members" (`data.people`) are **personas inside one admin's blob**, not logins.
- "View as member" / member view is a **client-side actor toggle**. There is no
  server-enforced restriction; the member's browser still downloads the whole blob.
- No invite flow, no way to list other `auth.users` from the client.

So "separate logins that see only their data" cannot be done with a config tweak —
the data has to move out of the single blob into **row-per-entity tables** with
per-user RLS.

---

## 2. Target model

Two roles for an authenticated account:

| Role | How it's decided | Sees |
|---|---|---|
| **Admin** (org owner) | owns a row in `orgs` | everything in their org |
| **Member** | linked in `org_members` (`user_id = auth.uid()`) | only their own reviews / late requests / activity |

One admin = one **org**. Members belong to exactly one org (v1).

### Entities

```
orgs                     one per admin account
org_roles                the role templates (was data.roles) — org-scoped
org_members              a person; may or may not have signed up yet
org_reviews              one weekly/daily/monthly review (was data.reviews[*])
org_activity             activity log rows
org_late_requests        missed-entry requests
org_settings             calendar, thresholds, attendance policy, zoho, theme… (1 row)
org_target_change_requests
org_review_revisions
```

`reportData` (synthetic demo) and `savedReports` stay per-admin — either on
`org_settings` as `jsonb`, or a `saved_reports` table. Demo data is admin-only.

---

## 3. Schema (DDL sketch)

```sql
create table public.orgs (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null unique references auth.users(id) on delete cascade,
  name        text not null default 'My workspace',
  created_at  timestamptz not null default now()
);

create table public.org_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  email       text not null,
  name        text not null,
  role_id     text not null,                 -- FK-ish to org_roles.slug
  user_id     uuid references auth.users(id) on delete set null,  -- null until they sign up
  fields      jsonb,                         -- personalized form override (was person.fields)
  status      text not null default 'invited' check (status in ('invited','active','disabled')),
  created_at  timestamptz not null default now(),
  unique (org_id, email)
);
create index on public.org_members(user_id);

create table public.org_roles (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  slug        text not null,                 -- 'role-crm-supervisor-lead' etc.
  name        text not null,
  department  text not null default '',
  description text not null default '',
  fields      jsonb not null,               -- the KRA/KPI field array
  unique (org_id, slug)
);

create table public.org_reviews (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  member_id     uuid not null references public.org_members(id) on delete cascade,
  week          date not null,
  period_kind   text not null default 'weekly',
  data          jsonb not null,             -- the Review object (fields, targets, values, tables, statuses…)
  updated_at    timestamptz not null default now(),
  unique (org_id, member_id, week, period_kind)
);
create index on public.org_reviews(member_id);

-- org_activity, org_late_requests, org_target_change_requests, org_review_revisions:
--   same shape — (id, org_id, member_id?, data jsonb, created_at)
create table public.org_settings (
  org_id    uuid primary key references public.orgs(id) on delete cascade,
  data      jsonb not null                  -- calendar, thresholds, attendance, zoho, theme, reportData, savedReports
);
```

Keeping the leaf objects (`org_reviews.data`, `org_roles.fields`) as `jsonb`
means the existing TS types (`Review`, `Field`, `Role`) barely change — only the
**container** changes from "one blob" to "many rows".

---

## 4. RLS

```sql
alter table public.orgs               enable row level security;
alter table public.org_members        enable row level security;
alter table public.org_roles          enable row level security;
alter table public.org_reviews        enable row level security;
alter table public.org_settings       enable row level security;
-- …same for the other org_* tables

-- helper: is the current user the owner of this org?
create function public.is_org_admin(o uuid) returns boolean language sql stable security definer as $$
  select exists (select 1 from public.orgs where id = o and owner_id = auth.uid())
$$;

-- helper: the org the current user is a member of (if any)
create function public.member_org() returns uuid language sql stable security definer as $$
  select org_id from public.org_members where user_id = auth.uid() and status = 'active' limit 1
$$;

-- orgs: owner only
create policy orgs_owner on public.orgs for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- org_roles / org_settings: admin read-write; member read-only for their org
create policy roles_admin on public.org_roles for all to authenticated
  using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy roles_member_read on public.org_roles for select to authenticated
  using (org_id = public.member_org());

-- org_members: admin full; member can read only their own row
create policy members_admin on public.org_members for all to authenticated
  using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy members_self_read on public.org_members for select to authenticated
  using (user_id = auth.uid());

-- org_reviews: admin full for their org; member read + limited write on their own rows
create policy reviews_admin on public.org_reviews for all to authenticated
  using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy reviews_member_rw on public.org_reviews for select to authenticated
  using (member_id in (select id from public.org_members where user_id = auth.uid()));
create policy reviews_member_update on public.org_reviews for update to authenticated
  using (member_id in (select id from public.org_members where user_id = auth.uid()))
  with check (member_id in (select id from public.org_members where user_id = auth.uid()));
```

Result: a member's browser can `select` only their own `org_reviews` rows and the
`org_roles` for their org. It physically cannot read other members' data.
(Business rules — "can't edit results before target approval", "frozen periods" —
stay enforced in the app, plus optionally a trigger on `org_reviews`.)

---

## 5. Invite / link flow

1. Admin adds a user on the **Users** screen → insert `org_members` row
   (`email`, `name`, `role_id`, `status='invited'`, `user_id=null`).
2. Admin shares the app URL. The person signs up with **that same email**.
3. On sign-up, link them. Two options:
   - **DB trigger** (simplest): `after insert on auth.users` → `update org_members
     set user_id = new.id, status='active' where lower(email)=lower(new.email) and user_id is null`.
     Needs `security definer`. One line, no server to run.
   - **Edge Function** invite: admin calls `supabase.auth.admin.inviteUserByEmail`
     from a function (service-role key stays server-side). Cleaner emails, more work.
4. First login: `member_org()` returns their org → app loads member mode.

Email mismatch (signed up with a different address) → they land with no org →
show "ask your admin to invite <this email>".

---

## 6. Frontend changes

- **`cloud.ts`**: replace `loadCloudWorkspace` (one row) with
  `loadAdminWorkspace(orgId)` = parallel selects of `org_*` → assemble the same
  in-memory `Workspace` shape the UI already uses; and `loadMemberWorkspace()` =
  select only their `org_members` row + `org_reviews` + `org_roles`.
- **Saving**: today it re-uploads the whole blob on every change. New model needs
  **targeted writes** — `change()` should carry which entity changed so we
  `upsert` one `org_reviews` / `org_roles` row instead of everything. Biggest
  refactor. Interim: a "save everything" that diffs and upserts changed rows.
- **`AuthGate` / `WorkspaceApp`**: after login, branch on `member_org()`:
  - admin → full nav (as now)
  - member → **member-only shell**: Overview + Weekly reviews + Daily & monthly +
    Missed entries + Approvals, scoped to their `member_id`. No Users / Role
    templates / Performance / Attendance / Achievement breakdown. Drop the
    client-side actor toggle entirely.
- **Users screen**: "status" column (Invited / Active), resend-invite, disable.
- Realtime (optional): `supabase.channel` on `org_reviews` so the admin sees a
  member's submission live.

---

## 7. Migration from today's blob

One-time script per admin account:

```
for each public.workspaces row:
  create orgs(owner_id)
  data.roles[]   -> org_roles
  data.people[]  -> org_members  (user_id null; status 'invited')
  data.reviews[] -> org_reviews
  data.activity / lateRequests / targetChangeRequests / reviewRevisions -> org_*
  {calendar, thresholds, attendance*, zoho, theme, reportData, savedReports} -> org_settings
keep public.workspaces read-only for one release as a backup, then drop.
```

Provide it as `supabase/migrate_to_orgs.sql` (idempotent, keyed on a
`migrated_at` marker), same as `role_templates.sql`.

---

## 8. Suggested phases

1. **Schema + RLS + migration script**, shipped but unused (old blob still drives
   the app). Verify with `pglite` tests like `tests/supabase.test.ts`.
2. **Read path**: admin app loads from `org_*` instead of the blob (writes still
   dual-write to the blob as a safety net).
3. **Write path**: targeted upserts; drop the blob dual-write.
4. **Member mode**: `AuthGate` branch + member-only shell + invite trigger.
5. **Polish**: statuses, resend invite, realtime, remove `public.workspaces`.

Phases 1–3 are invisible to users. Phase 4 is where "separate logins" actually
turns on.

---

## 9. Effort / risk

- ~2–4 days of focused work; touches auth, DB, RLS, and most of `src/workspace/`.
- Main risk: the save path. Today "save = overwrite one JSON". Per-row upserts +
  concurrency (admin and member editing the same review) need care —
  `updated_at` optimistic checks per `org_reviews` row, like the current
  `revision` guard.
- RLS must be tested exhaustively (a member must never read another's row) — the
  existing pglite harness is the right tool.
