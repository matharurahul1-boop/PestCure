import type { Workspace } from './model';
import type { SyncPatch } from './cloud';

export const MEMBER_KEYS = ['reviews', 'targetChangeRequests', 'lateRequests'] as const;
export const APPROVER_KEYS = ['reviews', 'targetChangeRequests', 'lateRequests', 'notifications'] as const;
type Key = (typeof APPROVER_KEYS)[number];
export type Snapshot = Record<Key, Map<string, string>>;

const items = (ws: Workspace, key: Key): Array<{ id: string }> => ((ws as unknown as Record<string, unknown>)[key] as Array<{ id: string }> | undefined) ?? [];

/** What the server last saw, per collection: item id -> serialized item. */
export function snapshotOf(ws: Workspace): Snapshot {
  const snap = {} as Snapshot;
  for (const key of APPROVER_KEYS) snap[key] = new Map(items(ws, key).map(i => [i.id, JSON.stringify(i)]));
  return snap;
}

/** The items that changed (or are new) since `prev`, ready to send, and the snapshot to remember afterwards. */
export function diffPatch(prev: Snapshot, ws: Workspace, keys: readonly Key[]): { patch: SyncPatch; next: Snapshot; changed: boolean } {
  const next = snapshotOf(ws);
  const patch: SyncPatch = {};
  let changed = false;
  for (const key of keys) {
    const out = items(ws, key).filter(i => prev[key].get(i.id) !== next[key].get(i.id));
    if (out.length) { patch[key] = out; changed = true; }
  }
  return { patch, next, changed };
}

/** Items in a (team) workspace that are waiting for the accountable's decision. */
export function pendingCount(ws: Workspace): number {
  const w = ws as unknown as { reviews?: Array<{ targetStatus?: string; status?: string }>; targetChangeRequests?: Array<{ status?: string }>; lateRequests?: Array<{ status?: string }> };
  return (w.reviews ?? []).filter(r => r.targetStatus === 'pending' || r.status === 'submitted').length
    + (w.targetChangeRequests ?? []).filter(r => r.status === 'requested' || r.status === 'submitted').length
    + (w.lateRequests ?? []).filter(r => r.status === 'pending').length;
}

const waiting = (kind: string, i: { targetStatus?: string; status?: string }) =>
  kind === 'reviews' ? i.targetStatus === 'pending' || i.status === 'submitted' : kind === 'lateRequests' ? i.status === 'pending' : i.status === 'requested' || i.status === 'submitted';

/** Items in a patch that just started waiting for the accountable (new, or moved into a waiting state): the reason to push. */
export function newlyWaiting(prev: Snapshot, patch: SyncPatch): number {
  let n = 0;
  for (const key of ['reviews', 'targetChangeRequests', 'lateRequests'] as const) {
    for (const item of (patch[key] ?? []) as Array<{ id: string; targetStatus?: string; status?: string }>) {
      if (!waiting(key, item)) continue;
      const before = prev[key].get(item.id);
      if (!before || !waiting(key, JSON.parse(before))) n++;
    }
  }
  return n;
}
