import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('complete Supabase SQL imports data, preserves updates and isolates all report views by owner', async () => {
 const db = new PGlite();
 const owner = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222';
 try {
  await db.exec(`create role anon; create role authenticated;
   create schema auth; create table auth.users(id uuid primary key, email text);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
   grant usage on schema auth, public to anon, authenticated;
   grant execute on function auth.uid() to anon, authenticated;
   insert into auth.users values ('${owner}','test@example.com'),('${other}','other@example.com');`);
  const sql = readFileSync('supabase/complete_setup_with_data.sql','utf8').replaceAll('YOUR_SIGNUP_EMAIL','test@example.com');
  await db.exec(sql);
  const count = async (table: string) => (await db.query<{count:number}>(`select count(*)::int as count from public.${table}`)).rows[0].count;
  assert.equal(await count('workspace_members'), 3);
  assert.equal(await count('role_templates'), 15);
  assert.equal(await count('saved_reports'), 3);
  assert.equal(await count('report_attendance'), 957);
  assert.equal(await count('report_reviews'), 181);
  assert.ok(await count('review_fields') > 100);
  await db.exec(`update public.workspaces set data=jsonb_set(data,'{people,0,name}','"Edited"') where owner_id='${owner}';`);
  await db.exec(sql);
  assert.equal((await db.query<{name:string}>(`select data#>>'{people,0,name}' as name from public.workspaces where owner_id='${owner}'`)).rows[0].name, 'Edited');
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${owner}';`);
  assert.equal(await count('workspace_members'), 3);
  assert.equal(await count('report_attendance'), 957);
  await db.exec(`update public.workspaces set revision=revision+1 where owner_id='${owner}';`);
  const views = ['workspace_members','role_templates','report_reviews','report_attendance','saved_reports','review_fields','workspace_settings','activity_log','late_entry_requests','target_change_requests','review_revisions'];
  await db.exec(`set request.jwt.claim.sub='${other}';`);
  for (const view of views) assert.equal(await count(view), 0, `${view} must not expose another account's data`);
  const stolen = await db.query(`update public.workspaces set revision=999 where owner_id='${owner}' returning owner_id`);
  assert.equal(stolen.rows.length, 0);
  await assert.rejects(db.exec(`insert into public.workspaces(owner_id,data) values('${owner}','{}')`));
  await db.exec(`reset role; set role anon;`);
  for (const view of views) await assert.rejects(db.query(`select * from public.${view} limit 1`), /permission denied/);
 } finally { await db.close(); }
});
