import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { changeRole, setPersonActive } from '../src/workspace/lifecycle';
import { reconcileCalendar, activateCalendar, missedEntries } from '../src/workspace/schedule';
import { createReview } from '../src/workspace/model';
import { templatesOnlyWorkspace } from '../src/workspace/reportData';

const NOW = new Date('2026-10-14T06:00:00Z');   // a Wednesday (IST)
const WEEK = '2026-10-12';

function setup() {
 const base = templatesOnlyWorkspace();
 const [a, b] = base.roles;
 const person = { id: 'p1', name: 'Asha', email: 'asha@x.com', roleId: a.id };
 const done = { ...createReview(person, a, '2026-10-05'), status: 'approved' as const, targetStatus: 'approved' as const, values: { x: 5 }, roleName: undefined };
 const now = createReview(person, a, WEEK);
 return { base: { ...base, people: [person], reviews: [done, now] }, a, b, person };
}

test('a mid-week role change keeps this week on the old role and starts the new role next week', () => {
 const { base, a, b } = setup();
 const out = changeRole(base, 'p1', b, '2026-10-14');          // Wednesday
 const p = out.people[0];
 assert.equal(p.roleId, a.id, 'still on the old role today');
 assert.deepEqual(p.nextRole, { roleId: b.id, from: '2026-10-19' }, 'switches on the next Monday');
 assert.deepEqual(out.reviews, base.reviews, 'no report is touched or rebuilt this week, even an untouched one');

 // the calendar applies it once that day arrives
 const before = reconcileCalendar(out, new Date('2026-10-18T10:00:00Z'));
 assert.equal(before.people[0].roleId, a.id);
 const after = reconcileCalendar(out, new Date('2026-10-19T06:00:00Z'));
 const q = after.people[0];
 assert.equal(q.roleId, b.id);
 assert.equal(q.nextRole, undefined);
 assert.deepEqual(q.roleHistory!.map(h => [h.roleId, h.roleName, h.to]), [[a.id, a.name, '2026-10-19']]);
 assert.ok(after.reviews.every(r => r.roleName === a.name), 'old reports stay pinned to the role they were written on');
 assert.equal(after.reviews.length, base.reviews.length);
});

test('choosing the current role cancels a scheduled change; a person with no report this week switches now', () => {
 const { base, a, b } = setup();
 const scheduled = changeRole(base, 'p1', b, '2026-10-14');
 const cancelled = changeRole(scheduled, 'p1', a, '2026-10-15');
 assert.equal(cancelled.people[0].nextRole, undefined);
 assert.equal(changeRole(base, 'p1', a, '2026-10-14'), base, 'same role is a no-op');

 const none = { ...base, reviews: base.reviews.filter(r => r.week !== WEEK) };
 const now = changeRole(none, 'p1', b, '2026-10-14');
 assert.equal(now.people[0].roleId, b.id, 'nothing to protect this week, so it switches immediately');
 assert.equal(now.people[0].roleHistory!.length, 1);
 assert.equal(now.reviews.find(r => r.week === '2026-10-05')!.roleName, a.name);
});

test('deactivating keeps history, stops new reports, and reactivating restores the person', () => {
 const { base } = setup();
 const cal = activateCalendar(base, 1, NOW);
 const off = setPersonActive(cal, 'p1', false, '2026-10-14');
 assert.equal(off.people[0].inactive, true);
 assert.ok(off.reviews.some(r => r.week === '2026-10-05' && r.status === 'approved'), 'approved history is untouched');
 const later = reconcileCalendar(off, new Date('2026-10-20T06:00:00Z'));
 assert.ok(!later.reviews.some(r => r.memberId === 'p1' && r.week >= '2026-10-15' && !off.reviews.some(o => o.id === r.id)), 'no new reports for an inactive person');
 assert.equal(missedEntries(later, new Date('2026-10-25T06:00:00Z')).filter(m => m.memberId === 'p1').length, 0, 'no missed-entry noise either');
 const on = setPersonActive(off, 'p1', true, '2026-10-21');
 assert.equal(on.people[0].inactive, undefined);
});

const ADMIN = '11111111-1111-4111-8111-111111111111', BOB = '22222222-2222-4222-8222-222222222222', CARA = '33333333-3333-4333-8333-333333333333';

test('set_user_active: admin only, blocks sign-in, releases the seat, reversible', async () => {
 const db = new PGlite();
 await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
  grant usage on schema auth, public to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`);
 for (const f of ['schema', 'users_table', 'member_access', 'org_approval', 'approvals_access', 'lifecycle', 'push']) await db.exec(readFileSync(`supabase/${f}.sql`, 'utf8'));
 await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values ('${ADMIN}','tusharbali855@gmail.com','{}'),('${BOB}','bob@x.com','{}'),('${CARA}','cara@x.com','{}')`);
 const as = async (id: string) => { await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='${id}';`); };
 await as(ADMIN);
 await db.exec(`select public.approve_user('${CARA}','hod-sup',null); select public.approve_user('${BOB}','sup-central',null)`);
 const acc = async (u: string) => (await db.query<any>(`select public.org_accountable('${u}') a`)).rows[0].a;
 assert.equal(await acc(BOB), CARA);

 await as(BOB);
 await assert.rejects(db.query(`select public.set_user_active('${CARA}', false)`), /Only an admin/);
 await as(ADMIN);
 await assert.rejects(db.query(`select public.set_user_active('${ADMIN}', false)`), /admin account cannot/);
 await db.query(`select public.set_user_active('${CARA}', false, 'left the company')`);
 const row = (await db.query<any>(`select status, reject_reason from public.app_users where id='${CARA}'`)).rows[0];
 assert.deepEqual([row.status, row.reject_reason], ['inactive', 'left the company']);
 assert.notEqual(await acc(BOB), CARA, "Bob's approvals no longer go to the deactivated boss (null = admin override)");
 await as(CARA);
 assert.equal((await db.query<any>(`select public.is_approved() ok`)).rows[0].ok, false, 'a deactivated account is no longer approved');
 await assert.rejects(db.query(`select public.member_workspace()`), /waiting for approval/);
 await as(ADMIN);
 await assert.rejects(db.query(`select public.set_user_active('${BOB}', true)`), /Only a deactivated user/);
 await db.query(`select public.set_user_active('${CARA}', true)`);
 await as(CARA);
 assert.equal((await db.query<any>(`select public.is_approved() ok`)).rows[0].ok, true);
});

test('with the calendar on, next week\'s report is generated from the new role and this week\'s stays on the old one', () => {
 const { base, a, b } = setup();
 const cal = activateCalendar(base, 1, NOW);
 const changed = changeRole(cal, 'p1', b, '2026-10-14', 1);
 const next = reconcileCalendar(changed, new Date('2026-10-19T06:00:00Z'));
 const weekly = (w: string) => next.reviews.find(r => r.memberId === 'p1' && (r.periodKind ?? 'weekly') === 'weekly' && r.week === w);
 assert.equal(weekly(WEEK)?.roleName, a.name, 'this week keeps the old role form and scoring');
 const fresh = weekly('2026-10-19');
 assert.ok(fresh, 'next week\'s report exists');
 assert.equal(fresh!.roleName, b.name, 'and is built from the new role');
 assert.deepEqual(fresh!.fields.map(f => f.id).sort(), (b.fields.filter(f => !f.table || true).map(f => f.id)).filter(id => fresh!.fields.some(x => x.id === id)).sort());
});
