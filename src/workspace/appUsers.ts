import { backend, supabase } from './auth';
import { api } from './api';
import { workspaceOwnerFor } from './sharedOwner';

/**
 * A row in public.app_users — one per sign-up (see supabase/users_table.sql; the local SQLite
 * backend keeps the same shape in its users table).
 * The admin assigns a role-template slug here; a bridged workspace person is what
 * currently drives report generation until per-user member mode ships (Part 2).
 */
export type AppUser = {
  id: string;
  email: string;
  full_name: string;
  assigned_role_slug: string | null;
  assigned_at: string | null;
  created_at: string;
  /** Supabase only: sign-ups start as pending until an admin approves them. Missing = approved. */
  status?: "pending" | "approved" | "rejected" | "inactive";
  reject_reason?: string | null;
};

export async function fetchAppUsers(): Promise<AppUser[]> {
  if (backend === 'local') return (await api<{ users: AppUser[] }>('/users')).users;
  if (!supabase) return [];
  const full = await supabase.from('app_users').select('id, email, full_name, assigned_role_slug, assigned_at, created_at, status, reject_reason').order('created_at', { ascending: true });
  if (!full.error) return (full.data ?? []) as AppUser[];
  // org_approval.sql not run yet: fall back to the columns that always exist
  const { data, error } = await supabase.from('app_users').select('id, email, full_name, assigned_role_slug, assigned_at, created_at').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AppUser[];
}

export async function assignTemplate(userId: string, slug: string): Promise<void> {
  if (backend === 'local') { await api(`/users/${encodeURIComponent(userId)}/assign`, { body: { slug } }); return; }
  if (!supabase) throw new Error('Connect Supabase to manage sign-ups.');
  const { error } = await supabase.from('app_users').update({ assigned_role_slug: slug, assigned_at: new Date().toISOString() }).eq('id', userId);
  if (error) throw error;
}

/** True when the current account is an admin. */
export async function checkIsAdmin(): Promise<boolean> {
  if (backend === 'local') {
    const { user } = await api<{ user: { isAdmin: boolean } | null }>('/auth/me');
    return Boolean(user?.isAdmin);
  }
  if (!supabase) return true;
  const { data, error } = await supabase.from('admins').select('user_id').maybeSingle();
  if (error) return false;
  return Boolean(data);
}

/**
 * Link a signed-up member account to this admin's workspace + person, so the
 * member can sign in and load only their own report (see supabase/member_access.sql).
 * Supabase: best-effort, skipped silently if the member_links table is absent.
 */
export async function linkMember(userId: string, personId: string, email: string): Promise<void> {
  if (backend === 'local') { await api(`/users/${encodeURIComponent(userId)}/link`, { body: { personId, email } }); return; }
  if (!supabase) return;
  const { data: me } = await supabase.auth.getUser();
  if (!me.user?.id) return;
  const adminId = await workspaceOwnerFor(me.user.id);   // members belong to the shared admin workspace, whichever admin approves them
  const { error } = await supabase.from('member_links').upsert(
    { user_id: userId, admin_id: adminId, person_id: personId, email },
    { onConflict: 'user_id' },
  );
  if (error && !/member_links/.test(error.message)) throw error;
}
