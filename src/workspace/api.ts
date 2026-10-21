/** Tiny fetch wrapper for the local SQLite backend (/api). Cookies carry the session; errors carry the server's message. */
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      credentials: 'same-origin',
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the PestCure server. Start it with "npm run dev" (or "npm run server") and try again.');
  }
  let payload: unknown = null;
  try { payload = await res.json(); } catch { /* empty or non-JSON body */ }
  if (!res.ok) throw new ApiError(res.status, (payload as { error?: string } | null)?.error ?? `Request failed (${res.status}).`);
  return payload as T;
}
