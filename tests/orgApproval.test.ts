import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const admin = '11111111-1111-4111-8111-111111111111';   // tusharbali855 (admin email)
const bob = '22222222-2222-4222-8222-222222222222';     // signs up later
const cara = '33333333-3333-4333-8333-333333333333';
const old = '44444444-4444-4444-8444-444444444444';     // signed up before approvals existed

test('signup approval + dynamic org chart', async () => {
 const db = new PGlite();
 await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
  grant usage on schema auth, public to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
  insert into auth.users(id,email) values ('${old}','old@x.com');`);
 for (const f of ['schema', 'users_table', 'member_access']) await db.exec(readFileSync(`supabase/${f}.sql`, 'utf8'));
 await db.exec(readFileSync('supabase/org_approval.sql', 'utf8'));
 const one = async <T,>(sql: string) => (await db.query<T>(sql)).rows[0];
 const as = async (id: string) => { await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='${id}';`); };

 // existing sign-up stays approved; seed loaded
 assert.equal((await one<{ status: string }>(`select status from public.app_users where id='${old}'`)).status, 'approved');
 assert.ok((await one<{ n: number }>(`select count(*)::int n from public.org_positions`)).n >= 30);

 // admin email -> auto admin + approved; others pending
 await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values ('${admin}','Tusharbali855@gmail.com','{"full_name":"Tushar"}'),('${bob}','bob@x.com','{"full_name":"Bob"}'),('${cara}','cara@x.com','{}')`);
 assert.equal((await one<{ status: string }>(`select status from public.app_users where id='${admin}'`)).status, 'approved');
 assert.equal((await one<{ n: number }>(`select count(*)::int n from public.admins where user_id='${admin}'`)).n, 1);
 assert.equal((await one<{ status: string }>(`select status from public.app_users where id='${bob}'`)).status, 'pending');

 // pending user: cannot create a workspace, cannot read the org chart, cannot approve himself
 await as(bob);
 await assert.rejects(db.query(`insert into public.workspaces(owner_id,data) values ('${bob}','{"version":1,"roles":[],"people":[],"reviews":[],"activity":[],"thresholds":{}}')`));
 assert.equal((await one<{ n: number }>(`select count(*)::int n from public.org_positions`)).n, 0);
 await assert.rejects(db.query(`select public.approve_user('${bob}','sup-central',null)`), /Only an admin/);
 assert.equal((await one<{ n: number }>(`select count(*)::int n from public.app_users`)).n, 1);   // sees only self

 // admin approves bob onto a seat: role comes from the seat; HOD seat empty + founder empty -> accountable = admin (null)
 await as(admin);
 let r = await one<{ approve_user: any }>(`select public.approve_user('${bob}','sup-central',null)`);
 assert.equal(r.approve_user.role, 'role-sales-supervisor-crm');
 assert.equal(r.approve_user.accountable, null);
 // cara becomes HOD – Supervisors -> bob's accountable is now cara
 await db.exec(`select public.approve_user('${cara}','hod-sup',null)`);
 assert.equal((await one<{ a: string }>(`select public.org_accountable('${bob}') a`)).a, cara);
 // vacate the HOD seat -> falls back to the next filled seat above (none) -> admin
 await db.exec(`select public.assign_holder('hod-sup', null)`);
 assert.equal((await one<{ a: string | null }>(`select public.org_accountable('${bob}') a`)).a, null);
 // put cara back, then move her: one seat per person, history kept
 await db.exec(`select public.assign_holder('hod-sup','${cara}')`);
 await db.exec(`select public.assign_holder('hod-sales','${cara}')`);
 assert.equal((await one<{ n: number }>(`select count(*)::int n from public.org_assignments where user_id='${cara}'`)).n, 3);
 assert.equal((await one<{ n: number }>(`select count(*)::int n from public.org_assignments where user_id='${cara}' and to_date is null`)).n, 1);

 // re-parent a seat dynamically; loops are refused
 await db.exec(`update public.org_positions set parent_id='hod-sales' where id='sup-central'`);
 assert.equal((await one<{ a: string }>(`select public.org_accountable('${bob}') a`)).a, cara);
 await assert.rejects(db.exec(`update public.org_positions set parent_id='sup-central' where id='hod-sales'`), /loop/);

 // reject: closes the seat; admins cannot be rejected; approved user sees org chart, only admin edits it
 await db.exec(`select public.reject_user('${cara}','not on the team')`);
 assert.equal((await one<{ status: string }>(`select status from public.app_users where id='${cara}'`)).status, 'rejected');
 await assert.rejects(db.query(`select public.reject_user('${admin}','x')`), /cannot be rejected/);
 await as(bob);
 assert.ok((await one<{ n: number }>(`select count(*)::int n from public.org_positions`)).n >= 30);
 const upd = await db.query(`update public.org_positions set title='hacked' where id='hod-ops' returning id`);
 assert.equal(upd.rows.length, 0);
 await db.exec(`reset role;`);
 await db.exec(readFileSync('supabase/org_approval.sql', 'utf8'));   // idempotent re-run keeps data
 assert.equal((await one<{ status: string }>(`select status from public.app_users where id='${cara}'`)).status, 'rejected');
 await db.close();
});
