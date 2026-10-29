import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { blockerEntries } from '../src/workspace/blockers';

const ADMIN = '11111111-1111-4111-8111-111111111111';
const rev = (id: string, memberId: string, week: string, extra: Record<string, unknown> = {}) => ({ id, memberId, week, values: {}, fields: [], targets: {}, targetStatus: 'draft', status: 'draft', feedback: '', highlights: '', blockers: '', updatedAt: '2026-10-01T00:00:00Z', ...extra });

test('demo blockers SQL fills the 3 latest weekly reviews of one user, is repeatable and removable', async () => {
 const db = new PGlite();
 await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
  grant usage on schema auth, public to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`);
 for (const f of ['schema', 'users_table', 'member_access', 'org_approval']) await db.exec(readFileSync(`supabase/${f}.sql`, 'utf8'));
 await db.exec(`insert into auth.users(id,email) values ('${ADMIN}','tusharbali855@gmail.com')`);
 const ws = {
  version: 1, roles: [], thresholds: { good: 80, watch: 50 }, activity: [],
  people: [{ id: 'pt', email: 'tushar.handysolver@gmail.com', name: 'Tushar Bali', roleId: 'r' }, { id: 'po', email: 'other@x.com', name: 'Other', roleId: 'r' }],
  reviews: [rev('t1', 'pt', '2026-10-05'), rev('t2', 'pt', '2026-10-12'), rev('t3', 'pt', '2026-10-19'), rev('t4', 'pt', '2026-10-26'), rev('o1', 'po', '2026-10-26'), rev('d1', 'pt', '2026-10-26', { periodKind: 'daily' })],
 };
 await db.query(`insert into public.workspaces(owner_id,data,revision) values ($1,$2,1)`, [ADMIN, JSON.stringify(ws)]);

 const sql = readFileSync('supabase/demo_blockers.sql', 'utf8');
 const run = async () => { for (const part of sql.split(/\n(?=with target as|select count)/)) if (/^(with|select)/.test(part.trim()) && !part.trim().startsWith('--')) await db.exec(part.replace(/^--.*$/gm, '').replace(/;\s*$/, '') + ';'); };
 const load = async () => ((await db.query<any>(`select data, revision from public.workspaces where owner_id = $1`, [ADMIN])).rows[0]);
 await run();
 let { data, revision } = await load();
 const mine = (w: string) => data.reviews.find((r: any) => r.id === w);
 assert.equal(revision, 2, 'saved as a new revision');
 assert.equal(mine('t4').blockerItems.length, 2, 'latest week: 2 open');
 assert.ok(mine('t4').blockerItems.every((b: any) => !b.completedAt));
 assert.equal(mine('t3').blockerItems.length, 2);
 assert.equal(mine('t3').blockerItems.filter((b: any) => b.completedAt).length, 1, 'week before: one completed');
 assert.equal(mine('t2').blockerItems.length, 1);
 assert.ok(mine('t2').blockerItems[0].completedAt);
 assert.equal(mine('t1').blockerItems, undefined, 'older weeks untouched');
 assert.equal(mine('o1').blockerItems, undefined, 'other people untouched');
 assert.equal(mine('d1').blockerItems, undefined, 'daily sheets untouched');
 assert.equal(data.reviews.length, 6, 'no review lost or reordered');
 assert.deepEqual(data.reviews.map((r: any) => r.id), ['t1', 't2', 't3', 't4', 'o1', 'd1']);

 // the app lists exactly these (open ones first in the UI)
 const entries = blockerEntries(data.reviews);
 assert.equal(entries.length, 5);
 assert.equal(entries.filter(e => !e.completedAt).length, 3);

 await run();   // re-run replaces, never doubles
 ({ data } = await load());
 assert.equal(blockerEntries(data.reviews).length, 5);

 // the REMOVE block (commented out in the file) takes them away again and keeps everything else
 const remove = sql.slice(sql.indexOf('-- update public.workspaces')).split('\n').map(l => l.replace(/^-- ?/, '')).join('\n');
 await db.exec(remove);
 ({ data } = await load());
 assert.equal(blockerEntries(data.reviews).length, 0, 'demo blockers removed');
 assert.equal(data.reviews.length, 6);
});
