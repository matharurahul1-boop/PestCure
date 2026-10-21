import test from 'node:test';
import assert from 'node:assert/strict';
import { demoReviews, averageScore, reportRange, reportBuckets } from '../src/workspace/performance';
import { REFERENCES } from '../src/workspace/referenceMigration';
import { score, type Workspace } from '../src/workspace/model';
const workspace = (): Workspace => ({ version: 1, roles: REFERENCES.map(r => ({ id: r.roleId, name: r.roleName, fields: r.fields, department: '', description: '' })), people: REFERENCES.map(r => ({ id: r.prefix, name: r.name, email: '', roleId: r.roleId })), reviews: [], activity: [], theme: 'light', thresholds: { good: 80, watch: 50 } });
test('demo covers twelve complete months for all three members without modifying real data', () => {
  const state = workspace(); const before = JSON.stringify(state); const demo = demoReviews(state, '2026-09-03');
  assert.equal(JSON.stringify(state), before);
  assert.equal(demo.length, 156); assert.equal(new Set(demo.map(r => r.id)).size, 156);
  for (const p of state.people) assert.equal(demo.filter(r => r.memberId === p.id).length, 52);
  assert.ok(demo.every(r => r.demo && r.status === 'approved' && r.week < '2026-08-31' && score(r) !== null));
  assert.equal(new Set(demo.map(r => r.week.slice(0, 7))).size, 12);
});
test('six and twelve month reports use completed calendar months across year boundaries', () => {
  assert.deepEqual(reportRange('12', '2026-09-03'), { from: '2025-09-01', to: '2026-08-31' });
  assert.deepEqual(reportRange('6', '2026-02-20'), { from: '2025-08-01', to: '2026-01-31' });
  assert.deepEqual(reportRange('last-week', '2026-09-03'), { from: '2026-08-24', to: '2026-08-30' });
});
test('monthly aggregation has twelve buckets, with null rather than zero for absent data', () => {
  const records = demoReviews(workspace(), '2026-09-03').filter(r => r.memberId === 'alka');
  const buckets = reportBuckets(records, '2025-09-01', '2026-08-31', 'monthly', 1);
  assert.equal(buckets.length, 12); assert.equal(buckets.reduce((n, b) => n + b.reviews.length, 0), 52);
  assert.ok(buckets.every(b => b.score !== null));
  assert.equal(reportBuckets([], '2026-09-01', '2026-09-30', 'monthly', 1)[0].score, null);
  const unapproved = { ...records[0], targetStatus: 'draft' as const };
  assert.equal(averageScore([unapproved]), null);
  assert.equal(averageScore([unapproved, records[1]]), score(records[1]));
});
