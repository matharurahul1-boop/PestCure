import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { newlyWaiting, snapshotOf } from '../src/workspace/scopedSync';

const ADMIN = '11111111-1111-4111-8111-111111111111', CARA = '33333333-3333-4333-8333-333333333333', BOB = '22222222-2222-4222-8222-222222222222', DAN = '44444444-4444-4444-8444-444444444444';

test('push audience: who may notify whom', async () => {
 const db = new PGlite();
 await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
  grant usage on schema auth, public to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`);
 for (const f of ['schema', 'users_table', 'member_access', 'org_approval', 'approvals_access', 'push']) await db.exec(readFileSync(`supabase/${f}.sql`, 'utf8'));
 await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values
  ('${ADMIN}','tusharbali855@gmail.com','{}'),('${CARA}','cara@x.com','{}'),('${BOB}','bob@x.com','{}'),('${DAN}','dan@x.com','{}')`);
 const as = async (id: string) => { await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='${id}';`); };
 await as(ADMIN);
 await db.exec(`select public.approve_user('${CARA}','hod-sup',null); select public.approve_user('${BOB}','sup-central',null)`);
 for (const [id, ep] of [[ADMIN, 'ep-admin'], [CARA, 'ep-cara'], [BOB, 'ep-bob']]) { await as(id); await db.exec(`insert into public.push_subscriptions(endpoint,user_id,p256dh,auth) values ('${ep}','${id}','k','a')`); }
 await as(BOB);
 await assert.rejects(db.exec(`insert into public.push_subscriptions(endpoint,user_id,p256dh,auth) values ('ep-fake','${CARA}','k','a')`));
 assert.equal((await db.query<any>(`select count(*)::int n from public.push_subscriptions`)).rows[0].n, 1, 'a user only sees their own devices');
 await db.exec('reset role');
 const aud = async (caller: string, kind: string, email?: string) => (await db.query<any>(`select endpoint from public.push_audience($1,$2,$3) order by 1`, [caller, kind, email ?? null])).rows.map(r => r.endpoint);
 assert.deepEqual(await aud(BOB, 'accountable'), ['ep-cara'], 'a member pushes their accountable');
 assert.deepEqual(await aud(CARA, 'accountable'), ['ep-admin'], 'a HOD reporting to the founder reaches the admin');
 assert.deepEqual(await aud(CARA, 'member', 'bob@x.com'), ['ep-bob'], 'an accountable pushes their report');
 assert.deepEqual(await aud(BOB, 'member', 'cara@x.com'), [], 'a member cannot push their boss');
 assert.deepEqual(await aud(CARA, 'member', 'tusharbali855@gmail.com'), [], 'nor reach someone outside their reports');
 assert.deepEqual(await aud(ADMIN, 'member', 'bob@x.com'), ['ep-bob'], 'admin can push anyone');
 assert.deepEqual(await aud(DAN, 'accountable'), [], 'an unapproved account pushes nobody');
});

test('newlyWaiting counts only items that just started waiting', () => {
 const base = { reviews: [{ id: 'r1', targetStatus: 'draft', status: 'draft' }, { id: 'r2', targetStatus: 'pending', status: 'draft' }], targetChangeRequests: [], lateRequests: [], notifications: [] } as any;
 const prev = snapshotOf(base);
 const out = newlyWaiting(prev, { reviews: [{ id: 'r1', targetStatus: 'pending', status: 'draft' }, { id: 'r2', targetStatus: 'pending', status: 'draft', blockers: 'x' }, { id: 'r3', targetStatus: 'pending', status: 'draft' }], lateRequests: [{ id: 'l1', status: 'pending' }] });
 assert.equal(out, 3);
});
