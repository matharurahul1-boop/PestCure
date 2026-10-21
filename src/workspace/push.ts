import { supabase } from './auth';

const VAPID = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? '';
const FLAG = 'pestcure_push_on';

/** True when this build can do real (app-closed) push: Supabase backend + a VAPID key + browser support. */
export const pushAvailable = () =>
  !!supabase && !!VAPID && typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';

export const pushEnabledHere = () => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } };
const setFlag = (on: boolean) => { try { if (on) localStorage.setItem(FLAG, '1'); else localStorage.removeItem(FLAG); } catch { /* storage unavailable */ } };

const keyBytes = (b64: string) => {
  const raw = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};
const b64 = (buf: ArrayBuffer | null) => (buf ? btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : '');

/** Ask permission, subscribe this device and store the subscription against the signed-in user. */
export async function enablePush(): Promise<'on' | 'denied' | 'error'> {
  if (!pushAvailable() || !supabase) return 'error';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'denied';
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return 'error';
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID) });
    const { error } = await supabase.from('push_subscriptions').upsert({
      endpoint: sub.endpoint, user_id: data.user.id, p256dh: b64(sub.getKey('p256dh')), auth: b64(sub.getKey('auth')), user_agent: navigator.userAgent.slice(0, 200),
    }, { onConflict: 'endpoint' });
    if (error) throw error;
    setFlag(true);
    return 'on';
  } catch { return 'error'; }
}

export async function disablePush() {
  setFlag(false);
  try {
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (!sub) return;
    await supabase?.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe();
  } catch { /* nothing to undo */ }
}

export type PushMessage = { kind: 'member'; email: string; text: string } | { kind: 'accountable'; text: string };

/** Best effort: a failed push must never block saving. */
export async function sendPush(message: PushMessage) {
  if (!supabase) return;
  try { await supabase.functions.invoke('send-push', { body: message }); } catch { /* ignore */ }
}
