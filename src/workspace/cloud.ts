import { backend, supabase } from './auth';
import { api, ApiError } from './api';
import { workspaceOwnerFor } from './sharedOwner';
import type { Review, Workspace } from './model';
import { templatesOnlyWorkspace } from './reportData';
import { filterForMember } from './memberFilter';

export type MemberContext = { adminId: string; personId: string; /** people this account is accountable for (their approver) */ teamPersonIds?: string[] };
export type LoadResult = { workspace: Workspace; revision: number; member?: MemberContext; /** Supabase: the slice of the workspace this account approves (null/undefined = nobody reports to them) */ team?: Workspace };

const CONFLICT = 'Workspace changed in another tab/device. Download your backup, then reload to get the latest version.';

// ---- local SQLite backend (default) ----------------------------------------
async function loadLocalWorkspace(): Promise<LoadResult> {
  const first = await api<{ workspace: Workspace | null; revision: number; member?: MemberContext }>('/workspace');
  if (first.workspace) return { workspace: first.workspace, revision: first.revision, member: first.member };
  // New account: create its starter workspace (templates only), exactly as the Supabase path did.
  const workspace = templatesOnlyWorkspace();
  try { await api('/workspace', { body: { data: workspace } }); }
  catch (e) { if (!(e instanceof ApiError && e.status === 409)) throw e; }
  const created = await api<{ workspace: Workspace | null; revision: number }>('/workspace');
  if (!created.workspace) throw new Error('Could not create your workspace.');
  return { workspace: created.workspace, revision: created.revision };
}

async function saveLocalWorkspace(workspace: Workspace, revision: number): Promise<number> {
  try { return (await api<{ revision: number }>('/workspace', { method: 'PUT', body: { data: workspace, revision } })).revision; }
  catch (e) { if (e instanceof ApiError && e.status === 409) throw new Error(CONFLICT); throw e; }
}

// ---- Supabase backend (VITE_BACKEND=supabase) ------------------------------
async function loadSupabaseWorkspace(userId: string): Promise<LoadResult> {
  // An account listed in public.admins is always an admin, even if a member_link exists.
  let isAdmin = false;
  try {
    const { data } = await supabase!.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
    isAdmin = Boolean(data);
  } catch { /* admins table not created yet */ }

  // A linked team member never reads the admin's workspace row: the database hands over just their slice
  // (and their team's slice when they are someone's accountable). See supabase/approvals_access.sql.
  if (!isAdmin) {
    const { data, error } = await supabase!.rpc('member_workspace');
    if (error) {
      if (/waiting for approval|not ready yet/i.test(error.message)) throw new Error(error.message);
      if (!/member_workspace|function|schema cache/i.test(error.message)) throw error;
      // approvals_access.sql not run yet -> treat as an unlinked account
    } else if (data) {
      const r = data as { adminId: string; personId: string; revision: number; own: Workspace; team: Workspace | null; teamPersonIds: string[] };
      return { workspace: r.own, revision: r.revision, member: { adminId: r.adminId, personId: r.personId, teamPersonIds: r.teamPersonIds }, team: r.team ?? undefined };
    }
  }

  // admins all work in the same (oldest admin) workspace; anyone else gets their own
  const ownerId = isAdmin ? await workspaceOwnerFor(userId) : userId;
  const { data, error } = await supabase!.from('workspaces').select('data, revision').eq('owner_id', ownerId).maybeSingle();
  if (error) throw error;
  if (data) return { workspace: data.data as Workspace, revision: data.revision as number };

  const workspace = templatesOnlyWorkspace();
  const { error: insertError } = await supabase!.from('workspaces').insert({ owner_id: userId, data: workspace });
  if (insertError && insertError.code !== '23505') throw insertError;
  const { data: created, error: readError } = await supabase!.from('workspaces').select('data, revision').eq('owner_id', userId).single();
  if (readError) throw readError;
  return { workspace: created.data as Workspace, revision: created.revision as number };
}

async function saveSupabaseWorkspace(userId: string, workspace: Workspace, revision: number): Promise<number> {
  const ownerId = await workspaceOwnerFor(userId);
  const { data, error } = await supabase!.from('workspaces').update({ data: workspace, revision: revision + 1, updated_at: new Date().toISOString() }).eq('owner_id', ownerId).eq('revision', revision).select('revision').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(CONFLICT);
  return data.revision;
}

// ---- public API (unchanged signatures) -------------------------------------
export async function loadCloudWorkspace(userId: string): Promise<LoadResult> {
  return backend === 'local' ? loadLocalWorkspace() : loadSupabaseWorkspace(userId);
}

export async function saveCloudWorkspace(userId: string, workspace: Workspace, revision: number): Promise<number> {
  return backend === 'local' ? saveLocalWorkspace(workspace, revision) : saveSupabaseWorkspace(userId, workspace, revision);
}

/** Member write path: push each changed review into the admin's blob via the guarded endpoint/RPC. */
export async function saveMemberReviews(reviews: Review[]): Promise<void> {
  for (const review of reviews) {
    if (backend === 'local') { await api('/workspace/member-review', { body: { review } }); continue; }
    const { error } = await supabase!.rpc('member_save_review', { p_review: review });
    if (error) throw error;
  }
}

export type SyncPatch = Partial<Record<'reviews' | 'targetChangeRequests' | 'lateRequests' | 'notifications', unknown[]>>;

/**
 * Member / approver write path. A member's own reviews and requests go through member_apply;
 * an accountable's decisions on their team go through approver_apply. The database re-checks both.
 * (The local SQLite backend only supports review writes.)
 */
export async function saveScopedChanges(kind: 'member' | 'approver', patch: SyncPatch): Promise<void> {
  if (backend === 'local') { for (const review of (patch.reviews ?? []) as Review[]) await api('/workspace/member-review', { body: { review } }); return; }
  const { error } = await supabase!.rpc(kind === 'approver' ? 'approver_apply' : 'member_apply', { p: patch });
  if (error) throw error;
}
