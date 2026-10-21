import test from 'node:test';
import assert from 'node:assert/strict';
import { APPROVER_KEYS, MEMBER_KEYS, diffPatch, snapshotOf } from '../src/workspace/scopedSync';
import type { Workspace } from '../src/workspace/model';

const ws = (over: Record<string, unknown> = {}) => ({ reviews: [{ id: 'r1', v: 1 }, { id: 'r2', v: 1 }], targetChangeRequests: [], lateRequests: [], notifications: [{ id: 'n1' }], ...over }) as unknown as Workspace;

test('diffPatch sends only new or changed items and only the allowed collections', () => {
 const base = snapshotOf(ws());
 assert.equal(diffPatch(base, ws(), MEMBER_KEYS).changed, false);
 const next = ws({ reviews: [{ id: 'r1', v: 2 }, { id: 'r2', v: 1 }, { id: 'r3', v: 1 }], lateRequests: [{ id: 'l1' }], notifications: [{ id: 'n1' }, { id: 'n2' }] });
 const m = diffPatch(base, next, MEMBER_KEYS);
 assert.deepEqual((m.patch.reviews as Array<{ id: string }>).map(r => r.id), ['r1', 'r3']);
 assert.equal(m.patch.lateRequests?.length, 1);
 assert.equal(m.patch.notifications, undefined, 'members never send notifications');
 const a = diffPatch(base, next, APPROVER_KEYS);
 assert.equal(a.patch.notifications?.length, 1);
 // after remembering the snapshot, the same state is clean again
 assert.equal(diffPatch(m.next, next, APPROVER_KEYS).patch.reviews, undefined);
});
