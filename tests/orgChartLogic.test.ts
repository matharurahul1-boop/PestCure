import test from 'node:test';
import assert from 'node:assert/strict';
import { accountableOf, seatAccountable, type OrgAssignment, type OrgPosition } from '../src/workspace/orgLogic';
import { ORG_SEED } from '../src/data/orgSeed';

const positions: OrgPosition[] = ORG_SEED.map((s, i) => ({ id: s.id, title: s.title, group_name: s.group ?? '', planned_name: s.plannedName ?? '', role_slug: s.roleSlug ?? null, parent_id: s.parentId ?? null, guided_by_id: s.guidedBy ?? null, kind: s.kind ?? 'internal', sort: i }));
const hold = (...pairs: Array<[string, string]>): OrgAssignment[] => pairs.map(([position_id, user_id]) => ({ id: position_id, position_id, user_id, from_date: '2026-10-01' }));

test('the accountable is the holder of the nearest filled seat above', () => {
 const byId = new Map(positions.map(p => [p.id, p]));
 // nobody above anyone is filled -> admin (null)
 assert.equal(accountableOf(positions, hold(['sup-central', 'dharam']), 'dharam'), null);
 // HOD filled -> the HOD
 assert.equal(accountableOf(positions, hold(['sup-central', 'dharam'], ['hod-sup', 'vijay']), 'dharam'), 'vijay');
 // HOD seat vacant, founder filled -> skips up to the founder
 assert.equal(accountableOf(positions, hold(['sup-central', 'dharam'], ['founder', 'ranjan']), 'dharam'), 'ranjan');
 // HODs report to the founder: admin until the founder seat is filled
 assert.equal(accountableOf(positions, hold(['hod-sup', 'vijay']), 'vijay'), null);
 assert.equal(accountableOf(positions, hold(['hod-sup', 'vijay'], ['founder', 'ranjan']), 'vijay'), 'ranjan');
 // "guided by" never decides approvals: Saisha is guided by Akshay but approved by her HOD
 assert.equal(accountableOf(positions, hold(['ops-noida-1', 'saisha'], ['proj-noida', 'akshay'], ['hod-ops', 'deepika']), 'saisha'), 'deepika');
 // moving a seat re-routes immediately
 const moved = positions.map(p => p.id === 'sup-central' ? { ...p, parent_id: 'hod-sales' } : p);
 assert.equal(accountableOf(moved, hold(['sup-central', 'dharam'], ['hod-sup', 'vijay'], ['hod-sales', 'alka']), 'dharam'), 'alka');
 // an unseated person has no seat to route from
 assert.equal(seatAccountable(byId, hold(['hod-sup', 'vijay']), undefined), null);
});

test('the starting chart is a tree: every seat reaches the founder without a loop', () => {
 const byId = new Map(positions.map(p => [p.id, p]));
 for (const p of positions.filter(x => x.kind === 'internal')) {
  let cur: OrgPosition | undefined = p; let steps = 0;
  while (cur?.parent_id) { cur = byId.get(cur.parent_id); assert.ok(cur, `${p.id} has a missing parent`); assert.ok(++steps < 10, `${p.id} loops`); }
  assert.equal(cur?.id, 'founder');
 }
 assert.ok(positions.every(p => !p.guided_by_id || byId.has(p.guided_by_id)));
});
