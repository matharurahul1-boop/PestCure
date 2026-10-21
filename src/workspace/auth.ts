import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { api } from './api';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim();
const supabaseConfigured = Boolean(url && key);

/**
 * Which backend holds accounts and workspace data.
 *  - local (default): the bundled Express + SQLite server under /api (see server/).
 *  - supabase: opt in with VITE_BACKEND=supabase plus the Supabase URL and key.
 */
export const backend: 'local' | 'supabase' = import.meta.env.VITE_BACKEND === 'supabase' && supabaseConfigured ? 'supabase' : 'local';
/** Sign-in is always available: either the local server or Supabase provides it. */
export const authEnabled = true;
export const supabase: SupabaseClient | null = backend === 'supabase' ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } }) : null;

export type AuthUser = { id: string; email: string; name: string; avatarUrl?: string; isAdmin?: boolean };

export function userFromSession(session: Session | null): AuthUser | null {
  const u = session?.user;
  return u ? { id: u.id, email: u.email ?? '', name: u.user_metadata.full_name || u.email || 'Workspace owner', avatarUrl: u.user_metadata.avatar_url } : null;
}

export type AuthListener = (user: AuthUser | null, error?: string) => void;
export type AuthClient = {
  /** Calls back with the current user (null when signed out) and again on every change. Returns an unsubscribe function. */
  subscribe(listener: AuthListener): () => void;
  signInWithPassword(email: string, password: string): Promise<void>;
  signUp(fullName: string, email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  /** Only offered by backends with an OAuth provider (Supabase). */
  signInWithGoogle?: () => Promise<void>;
  signOut(): Promise<void>;
};

type ApiUser = { id: string; email: string; name: string; isAdmin: boolean };
const fromApi = (u: ApiUser): AuthUser => ({ id: u.id, email: u.email, name: u.name, isAdmin: u.isAdmin });

function localAuthClient(): AuthClient {
  const listeners = new Set<AuthListener>();
  let current: AuthUser | null | undefined;
  let pending: Promise<void> | null = null;
  const emit = (user: AuthUser | null, error?: string) => { current = user; listeners.forEach(l => l(user, error)); };
  const refresh = () => (pending ??= api<{ user: ApiUser | null }>('/auth/me')
    .then(({ user }) => emit(user ? fromApi(user) : null))
    .catch(e => emit(null, (e as Error).message))
    .finally(() => { pending = null; }));
  return {
    subscribe(listener) {
      listeners.add(listener);
      if (current !== undefined) listener(current); else void refresh();
      return () => { listeners.delete(listener); };
    },
    async signInWithPassword(email, password) {
      const { user } = await api<{ user: ApiUser }>('/auth/signin', { body: { email, password } });
      emit(fromApi(user));
    },
    async signUp(fullName, email, password) {
      const { user } = await api<{ user: ApiUser }>('/auth/signup', { body: { email, password, fullName } });
      emit(fromApi(user));
      return { needsConfirmation: false };
    },
    async signOut() {
      await api('/auth/signout', { method: 'POST', body: {} });
      emit(null);
    },
  };
}

function supabaseAuthClient(client: SupabaseClient): AuthClient {
  const redirectTo = () => window.location.origin + window.location.pathname;
  return {
    subscribe(listener) {
      let active = true, eventReceived = false;
      const { data } = client.auth.onAuthStateChange((_event, session) => { eventReceived = true; if (active) listener(userFromSession(session)); });
      client.auth.getSession()
        .then(({ data, error }) => { if (!active || eventReceived) return; listener(userFromSession(data.session), error?.message); })
        .catch(e => { if (active) listener(null, e.message); });
      return () => { active = false; data.subscription.unsubscribe(); };
    },
    async signInWithPassword(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(fullName, email, password) {
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: redirectTo() } });
      if (error) throw error;
      return { needsConfirmation: !data.session };
    },
    async signInWithGoogle() {
      const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } });
      if (error) throw error;
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
  };
}

export const authClient: AuthClient = supabase ? supabaseAuthClient(supabase) : localAuthClient();
