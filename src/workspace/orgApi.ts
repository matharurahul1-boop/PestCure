import { backend, supabase } from './auth';

/** Approval + org chart live in Supabase (supabase/org_approval.sql). The local SQLite backend has no approval step. */
export const orgSupported = backend === 'supabase';

import type { OrgAssignment, OrgPosition } from './orgLogic';
export { accountableOf, seatAccountable } from './orgLogic';
export type { OrgAssignment, OrgPosition } from './orgLogic';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

const need = () => { if (!supabase) throw new Error('The org chart needs the Supabase backend (set VITE_BACKEND=supabase).'); return supabase; };
const MISSING = /org_positions|org_assignments|approve_user|reject_user|assign_holder|org_chart|member_workspace|member_apply|approver_apply|status/i;
const friendly = (e: { message: string }) => new Error(MISSING.test(e.message) && /does not exist|schema cache|could not find/i.test(e.message)
  ? 'Run supabase/setup_all.sql in your Supabase SQL editor first.' : e.message);

/** The signed-in account's approval state. Accounts that predate approvals (or a missing table) count as approved. */
export async function fetchMyApproval(userId: string): Promise<{ status: ApprovalStatus; reason: string }> {
  if (!orgSupported || !supabase) return { status: 'approved', reason: '' };
  const { data, error } = await supabase.from('app_users').select('status, reject_reason').eq('id', userId).maybeSingle();
  if (error || !data) return { status: 'approved', reason: '' };
  return { status: (data.status as ApprovalStatus) ?? 'approved', reason: (data.reject_reason as string) ?? '' };
}

export async function fetchOrg(): Promise<{ positions: OrgPosition[]; assignments: OrgAssignment[] }> {
  const s = need();
  const [p, a] = await Promise.all([
    s.from('org_positions').select('*').order('sort', { ascending: true }),
    s.from('org_assignments').select('id, position_id, user_id, from_date').is('to_date', null),
  ]);
  if (p.error) throw friendly(p.error);
  if (a.error) throw friendly(a.error);
  return { positions: (p.data ?? []) as OrgPosition[], assignments: (a.data ?? []) as OrgAssignment[] };
}

export async function approveUser(userId: string, positionId: string | null, role: string | null): Promise<void> {
  const { error } = await need().rpc('approve_user', { p_user: userId, p_position: positionId, p_role: role });
  if (error) throw friendly(error);
}
export async function rejectUser(userId: string, reason: string): Promise<void> {
  const { error } = await need().rpc('reject_user', { p_user: userId, p_reason: reason });
  if (error) throw friendly(error);
}
export async function assignHolder(positionId: string, userId: string | null): Promise<void> {
  const { error } = await need().rpc('assign_holder', { p_position: positionId, p_user: userId });
  if (error) throw friendly(error);
}
export async function savePosition(p: Partial<OrgPosition> & { id: string; title: string }): Promise<void> {
  const { error } = await need().from('org_positions').upsert(p, { onConflict: 'id' });
  if (error) throw friendly(error);
}
export async function deletePosition(id: string): Promise<void> {
  const { error } = await need().from('org_positions').delete().eq('id', id);
  if (error) throw friendly(error);
}

export type OrgHolder = { position_id: string; user_id: string; name: string; email: string; from_date: string };
export type OrgChartData = {
  positions: OrgPosition[]; holders: OrgHolder[]; admins: string[];
  me: { user_id: string; position_id: string | null; accountable_user: string | null; accountable_name: string | null };
};
/** The chart as every approved account sees it (names of holders included). Re-fetch to pick up admin changes. */
export async function fetchOrgChart(): Promise<OrgChartData> {
  const { data, error } = await need().rpc('org_chart');
  if (error) throw friendly(error);
  return data as OrgChartData;
}

/** Admin: deactivate (sign-in off, seat released) or reactivate a user. Their reports are never deleted. */
export async function setUserActive(userId: string, active: boolean, reason = ''): Promise<void> {
  const { error } = await need().rpc('set_user_active', { p_user: userId, p_active: active, p_reason: reason || null });
  if (error) throw friendly(error);
}
