/** Pure org-chart rules (no Supabase / browser imports, so they are unit-testable). */
export type OrgPosition = {
  id: string; title: string; group_name: string; planned_name: string; role_slug: string | null;
  parent_id: string | null; guided_by_id: string | null; kind: 'internal' | 'partner'; sort: number;
};
export type OrgAssignment = { id: string; position_id: string; user_id: string; from_date: string };

/** Holder of the nearest FILLED seat above `userId`'s seat; null = the admin is accountable. Mirrors org_accountable() in SQL. */
export function accountableOf(positions: OrgPosition[], assignments: OrgAssignment[], userId: string): string | null {
  const byId = new Map(positions.map(p => [p.id, p]));
  const seat = assignments.find(a => a.user_id === userId)?.position_id;
  return seatAccountable(byId, assignments, seat);
}
export function seatAccountable(byId: Map<string, OrgPosition>, assignments: OrgAssignment[], seatId?: string | null): string | null {
  let cur = seatId ? byId.get(seatId) : undefined;
  for (let i = 0; cur && i < 30; i++) {
    const parent = cur.parent_id ? byId.get(cur.parent_id) : undefined;
    if (!parent) return null;
    const holder = assignments.find(a => a.position_id === parent.id);
    if (holder) return holder.user_id;
    cur = parent;
  }
  return null;
}
