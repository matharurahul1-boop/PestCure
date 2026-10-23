import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const TUSHAR = '11111111-1111-4111-8111-111111111111', RANJAN = '55555555-5555-4555-8555-555555555555', BOB = '22222222-2222-4222-8222-222222222222';

const ws = (people: unknown[]) => JSON.stringify({ version: 1, roles: [], people, reviews: [], thresholds: { good: 80, watch: 50 }, activity: [] });

test('every admin works in the same workspace; members and others cannot', async () => {
 const db = new PGlite();
 await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
  grant usage on schema auth, public to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`);
 for (const f of ['schema', 'users_table', 'member_access', 'org_approval', 'approvals_access', 'shared_admin']) await db.exec(readFileSync(`supabase/${f}.sql`, 'utf8'));
 // rks@pest-cure.com is an admin email, so their sign-up becomes an approved admin on its own
 await db.exec(`insert into auth.users(id,email) values ('${TUSHAR}','tusharbali855@gmail.com'),('${RANJAN}','rks@pest-cure.com'),('${BOB}','bob@x.com')`);
 const as = async (id: string) => { await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='${id}';`); };
 assert.equal((await db.query<any>(`select count(*)::int n from public.admins`)).rows[0].n, 2);

 await as(TUSHAR);
 await db.query(`insert into public.workspaces(owner_id,data,revision) values ($1,$2,1)`, [TUSHAR, ws([{ id: 'p1' }])]);
 await db.exec('reset role');
 await db.query(`insert into public.workspaces(owner_id,data,revision,created_at) values ($1,$2,0, now() + interval '1 day')`, [RANJAN, ws([])]);   // an empty one Ranjan may already have

 const owner = async (id: string) => { await as(id); return (await db.query<any>(`select public.shared_workspace_owner() o`)).rows[0].o; };
 assert.equal(await owner(TUSHAR), TUSHAR);
 assert.equal(await owner(RANJAN), TUSHAR, 'the oldest admin workspace is the shared one');
 assert.equal(await owner(BOB), null, 'a non-admin is not told');

 await as(RANJAN);
 const seen = (await db.query<any>(`select data from public.workspaces where owner_id = $1`, [TUSHAR])).rows;
 assert.equal(seen.length, 1, 'Ranjan can read the shared workspace');
 const upd = await db.query<any>(`update public.workspaces set data = $2, revision = revision + 1 where owner_id = $1 and revision = 1 returning revision`, [TUSHAR, ws([{ id: 'p1' }, { id: 'p2' }])]);
 assert.equal(upd.rows.length, 1, 'and save to it');
 await as(TUSHAR);
 assert.equal((await db.query<any>(`select data from public.workspaces where owner_id = $1`, [TUSHAR])).rows[0].data.people.length, 2, 'Tushar sees Ranjan\'s change');

 await as(BOB);
 assert.equal((await db.query<any>(`select count(*)::int n from public.workspaces`)).rows[0].n, 0, 'a normal user sees no admin workspace');
 const blocked = await db.query<any>(`update public.workspaces set data = $2 where owner_id = $1 returning 1`, [TUSHAR, ws([])]);
 assert.equal(blocked.rows.length, 0, 'and cannot write to it');
});
