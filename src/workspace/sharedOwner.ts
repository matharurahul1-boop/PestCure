import { backend, supabase } from './auth';

const cache = new Map<string, string>();

/**
 * Whose workspace row an admin works in. All admins share the oldest admin workspace
 * (supabase/shared_admin.sql). Falls back to the account's own row when the SQL is not installed yet,
 * so nothing breaks before it is run.
 */
export async function workspaceOwnerFor(userId: string): Promise<string> {
  if (backend !== 'supabase' || !supabase) return userId;
  const hit = cache.get(userId);
  if (hit) return hit;
  try {
    const { data, error } = await supabase.rpc('shared_workspace_owner');
    const owner = !error && typeof data === 'string' && data ? data : userId;
    cache.set(userId, owner);
    return owner;
  } catch { return userId; }
}

/** Forget the cached owner (after sign-out). */
export const resetWorkspaceOwner = () => cache.clear();
