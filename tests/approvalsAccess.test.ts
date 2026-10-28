import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const ADMIN = '11111111-1111-4111-8111-111111111111', CARA = '33333333-3333-4333-8333-333333333333', BOB = '22222222-2222-4222-8222-222222222222', DAN = '44444444-4444-4444-8444-444444444444', PEND = '55555555-5555-4555-8555-555555555555';
const rev = (id: string, memberId: string, week = '2026-09-07', extra: Record<string, unknown> = {}) => ({ id, memberId, week, values: {}, fields: [], targets: {}, targetStatus: 'draft', status: 'draft', feedback: '', highlights: '', blockers: '', updatedAt: 't', ...extra });

test('scoped workspace + accountable approvals', async () => {
 const db = new PGlite();
 await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
  grant usage on schema auth, public to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`);
 for (const f of ['schema', 'users_table', 'member_access', 'org_approval', 'approvals_access']) await db.exec(readFileSync(`supabase/${f}.sql`, 'utf8'));
 await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values
  ('${ADMIN}','tusharbali855@gmail.com','{"full_name":"Tushar"}'),('${CARA}','cara@x.com','{"full_name":"Cara"}'),('${BOB}','bob@x.com','{"full_name":"Bob"}'),
  ('${DAN}','dan@x.com','{"full_name":"Dan"}'),('${PEND}','pend@x.com','{}')`);
 const as = async (id: string) => { await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='${id}';`); };
 const rpc = async (fn: string, arg?: unknown) => (await db.query<any>(arg === undefined ? `select public.${fn}() r` : `select public.${fn}($1::jsonb) r`, arg === undefined ? [] : [JSON.stringify(arg)])).rows[0].r;

 // seats: cara = HOD – Supervisors, bob = Field – Central Delhi (reports to cara), dan = HOD – Sales (reports to founder => admin)
 await as(ADMIN);
 await db.exec(`select public.approve_user('${CARA}','hod-sup',null); select public.approve_user('${BOB}','sup-central',null); select public.approve_user('${DAN}','hod-sales',null)`);
 const ws = { version: 1, roles: [{ id: 'r1' }, { id: 'r2' }], thresholds: { good: 80, watch: 50 }, activity: [],
  people: [{ id: 'pc', roleId: 'r1' }, { id: 'pb', roleId: 'r1' }, { id: 'pd', roleId: 'r2' }],
  reviews: [rev('rc', 'pc'), rev('rb', 'pb', '2026-09-07', { targetStatus: 'pending' }), rev('rb0', 'pb', '2026-08-31', { targetStatus: 'approved' }), rev('rd', 'pd', '2026-09-07', { targetStatus: 'pending' })],
  targetChangeRequests: [], lateRequests: [], notifications: [] };
 await db.exec(`reset role`);
 await db.query(`insert into public.workspaces(owner_id,data,revision) values ($1,$2,1)`, [ADMIN, JSON.stringify(ws)]);
 await db.exec(`insert into public.member_links(user_id,admin_id,person_id,email) values ('${CARA}','${ADMIN}','pc','cara@x.com'),('${BOB}','${ADMIN}','pb','bob@x.com'),('${DAN}','${ADMIN}','pd','dan@x.com')`);

 // members cannot read the admin's workspace row directly any more
 await as(BOB);
 assert.equal((await db.query(`select 1 from public.workspaces`)).rows.length, 0);

 // bob: own slice only, no team
 let w = await rpc('member_workspace');
 assert.deepEqual(w.own.people.map((p: any) => p.id), ['pb']);
 assert.deepEqual(w.own.reviews.map((r: any) => r.id).sort(), ['rb', 'rb0']);
 assert.equal(w.team, null);
 // cara: own slice + bob's team slice (not dan's)
 await as(CARA);
 w = await rpc('member_workspace');
 assert.deepEqual(w.own.reviews.map((r: any) => r.id), ['rc']);
 assert.deepEqual(w.team.people.map((p: any) => p.id), ['pb']);
 assert.deepEqual(w.team.reviews.map((r: any) => r.id).sort(), ['rb', 'rb0']);
 assert.deepEqual(w.teamPersonIds, ['pb']);
 // dan reports to the admin: nobody but the admin can approve dan
 await as(DAN);
 assert.equal((await rpc('member_workspace')).team, null);
 await assert.rejects(rpc('approver_apply', { reviews: [rev('rb', 'pb')] }), /No one reports to you/);

 // bob writes his own work but cannot approve it or touch others
 await as(BOB);
 await rpc('member_apply', { reviews: [rev('rb', 'pb', '2026-09-07', { targetStatus: 'pending', highlights: 'done a lot' })] });
 await assert.rejects(rpc('member_apply', { reviews: [rev('rb', 'pb', '2026-09-07', { targetStatus: 'approved' })] }), /accountable/);
 await assert.rejects(rpc('member_apply', { reviews: [rev('rb', 'pb', '2026-09-07', { status: 'approved' })] }), /accountable/);
 await assert.rejects(rpc('member_apply', { reviews: [rev('rd', 'pd')] }), /not belong to you/);
 await rpc('member_apply', { reviews: [rev('rb-next', 'pb', '2026-09-14', { targetStatus: 'approved' })] });          // inherited targets are fine
 await assert.rejects(rpc('member_apply', { reviews: [rev('rb-bad', 'pc', '2026-09-14')] }), /not belong to you/);
 await rpc('member_apply', { targetChangeRequests: [{ id: 't1', reviewId: 'rb0', memberId: 'pb', status: 'requested', reason: 'x' }], lateRequests: [{ id: 'l1', memberId: 'pb', status: 'pending', reason: 'y', entry: {} }] });
 await assert.rejects(rpc('member_apply', { targetChangeRequests: [{ id: 't1', reviewId: 'rb0', memberId: 'pb', status: 'edit-approved', reason: 'x' }] }), /accountable/);
 await assert.rejects(rpc('member_apply', { lateRequests: [{ id: 'l1', memberId: 'pb', status: 'approved', reason: 'y', entry: {} }] }), /accountable/);

 // cara decides bob's items; cannot touch dan's or her own
 await as(CARA);
 await rpc('approver_apply', { reviews: [rev('rb', 'pb', '2026-09-07', { targetStatus: 'approved', highlights: 'done a lot' })], targetChangeRequests: [{ id: 't1', reviewId: 'rb0', memberId: 'pb', status: 'edit-approved', reason: 'x' }], lateRequests: [{ id: 'l1', memberId: 'pb', status: 'approved', reason: 'y', entry: {} }], notifications: [{ id: 'n1', memberId: 'pb', text: 'approved' }] });
 await assert.rejects(rpc('approver_apply', { reviews: [rev('rd', 'pd', '2026-09-07', { targetStatus: 'approved' })] }), /not from your team/);
 await assert.rejects(rpc('approver_apply', { reviews: [rev('rc', 'pc', '2026-09-07', { status: 'approved' })] }), /not from your team/);
 await assert.rejects(rpc('approver_apply', { reviews: [rev('rb', 'pd')] }), /not from your team/);
 // bob sees the decisions and completes his side of the flow
 await as(BOB);
 w = await rpc('member_workspace');
 assert.equal(w.own.reviews.find((r: any) => r.id === 'rb').targetStatus, 'approved');
 assert.equal(w.own.notifications.length, 1);
 await rpc('member_apply', { targetChangeRequests: [{ id: 't1', reviewId: 'rb0', memberId: 'pb', status: 'submitted', reason: 'x' }], lateRequests: [{ id: 'l1', memberId: 'pb', status: 'completed', reason: 'y', entry: {} }] });

 // comments added by the approver survive a member save that has not seen them
 await as(CARA);
 await rpc('approver_apply', { reviews: [rev('rb', 'pb', '2026-09-07', { targetStatus: 'approved', highlights: 'done a lot', comments: [{ id: 'c1', text: 'good' }] })] });
 await as(BOB);
 await rpc('member_apply', { reviews: [rev('rb', 'pb', '2026-09-07', { targetStatus: 'approved', highlights: 'edited', comments: [] })] });
 w = await rpc('member_workspace');
 assert.deepEqual(w.own.reviews.find((r: any) => r.id === 'rb').comments.map((c: any) => c.id), ['c1']);

 // org chart for every approved account; bob sees his accountable (cara); dan's is the admin
 let chart = await rpc('org_chart');
 assert.equal(chart.me.position_id, 'sup-central'); assert.equal(chart.me.accountable_name, 'Cara');
 assert.ok(chart.positions.length >= 30); assert.ok(chart.holders.some((h: any) => h.name === 'Cara' && h.position_id === 'hod-sup'));
 await as(DAN);
 chart = await rpc('org_chart');
 assert.equal(chart.me.accountable_user, null); assert.deepEqual(chart.admins, ['Tushar']);
 // a pending account sees nothing
 await as(PEND);
 await assert.rejects(rpc('org_chart'), /waiting for approval/);
 await assert.rejects(rpc('member_workspace'), /waiting for approval/);

 // change the org: bob's seat moves under dan's seat -> accountable changes immediately and cara's team disappears
 await as(ADMIN);
 await db.exec(`update public.org_positions set parent_id='hod-sales' where id='sup-central'`);
 await as(CARA);
 assert.equal((await rpc('member_workspace')).team, null);
 await as(DAN);
 assert.deepEqual((await rpc('member_workspace')).teamPersonIds, ['pb']);

 await as(BOB);
 const blockerReview = (await rpc('member_workspace')).own.reviews.find((r: any) => r.id === 'rb');
 const active = {...blockerReview, blockerItems:[{id:'b1',text:'Need supplies'}]};
 await rpc('member_apply', {reviews:[active]});
 await rpc('member_apply', {reviews:[{...active,blockerItems:[{...active.blockerItems[0],completedAt:'2026-10-28T12:00:00Z'},{id:'b2',text:'Need help'}]}]});
 await rpc('member_apply', {reviews:[active]});
 const stored = (await rpc('member_workspace')).own.reviews.find((r: any) => r.id === 'rb').blockerItems;
 assert.equal(stored.length,2); assert.equal(stored[0].completedAt,'2026-10-28T12:00:00Z');
 await db.close();
});
