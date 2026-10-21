// Supabase Edge Function: sends a Web Push to the people the caller is allowed to notify.
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...). SUPABASE_URL / SERVICE_ROLE are provided by Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: who } = await admin.auth.getUser(jwt);
    if (!who?.user) return json({ error: 'Not signed in' }, 401);

    const { kind, email, text, url } = await req.json();
    if (kind !== 'member' && kind !== 'accountable') return json({ error: 'Bad kind' }, 400);
    const body = String(text ?? '').slice(0, 180);
    if (!body) return json({ error: 'Empty message' }, 400);

    const { data: subs, error } = await admin.rpc('push_audience', { p_caller: who.user.id, p_kind: kind, p_email: email ?? null });
    if (error) return json({ error: error.message }, 500);
    if (!subs?.length) return json({ sent: 0 });

    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
    const payload = JSON.stringify({ title: 'PestCure', body, url: typeof url === 'string' && url.startsWith('/') ? url : '/' });
    const dead: string[] = [];
    let sent = 0;
    await Promise.all(subs.map(async (s: { endpoint: string; p256dh: string; auth: string }) => {
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 }); sent++; }
      catch (e) { const code = (e as { statusCode?: number }).statusCode; if (code === 404 || code === 410) dead.push(s.endpoint); }
    }));
    if (dead.length) await admin.from('push_subscriptions').delete().in('endpoint', dead);
    return json({ sent });
  } catch (e) { return json({ error: (e as Error).message }, 500); }
});
