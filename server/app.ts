import { mergeBlockers, type Blocker } from '../src/workspace/blockers';
import express, { type NextFunction, type Request, type Response } from 'express';
import { randomUUID, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openDb, type Db, type LinkRow, type UserRow, type WorkspaceRow } from './db';
import { AttemptLimiter, hashPassword, hashToken, newSessionToken, verifyPassword } from './security';
import { config as loadDotenv } from 'dotenv';
import { filterForMember } from '../src/workspace/memberFilter';

export type ServerOptions = {
  dbPath: string;
  /** Accounts created with one of these emails are admins and start with the bundled data. */
  adminEmails: string[];
  /** JSON workspace (the Supabase export) used to seed admin accounts. */
  bundledWorkspacePath?: string;
  /** Create this admin account on first start when the database has no users. */
  seedAdmin?: { email: string; fullName: string; password?: string; credentialsFile?: string };
  secureCookies?: boolean;
};

const COOKIE = 'pc_session';
const SESSION_DAYS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type AuthedRequest = Request & { user: UserRow };

function parseCookies(header: string | undefined) {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

const userDto = (u: UserRow) => ({ id: u.id, email: u.email, name: u.full_name || u.email, isAdmin: Boolean(u.is_admin), assignedRoleSlug: u.assigned_role_slug });

/** Same shape check the Supabase table constraint enforced. */
function assertWorkspaceShape(data: unknown): asserts data is Record<string, unknown> {
  const d = data as Record<string, unknown> | null;
  const ok = d && typeof d === 'object' && !Array.isArray(d) && d.version === 1 && Array.isArray(d.roles) && Array.isArray(d.people) && Array.isArray(d.reviews) && Array.isArray(d.activity) && d.thresholds && typeof d.thresholds === 'object';
  if (!ok) throw new HttpError(400, 'That is not a valid workspace document.');
}

export function createApi(options: ServerOptions) {
  const db: Db = openDb(options.dbPath);
  const limiter = new AttemptLimiter();
  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);

  let bundledCache: string | null = null;
  const bundled = () => {
    const file = options.bundledWorkspacePath;
    if (!file || !existsSync(file)) return null;
    return (bundledCache ??= readFileSync(file, 'utf8'));
  };

  const now = () => new Date().toISOString();
  const userByEmail = (email: string) => db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  const userById = (id: string) => db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  const workspaceOf = (ownerId: string) => db.prepare('SELECT * FROM workspaces WHERE owner_id = ?').get(ownerId) as WorkspaceRow | undefined;
  const linkOf = (userId: string) => db.prepare('SELECT * FROM member_links WHERE user_id = ?').get(userId) as LinkRow | undefined;
  const isAdminEmail = (email: string) => options.adminEmails.includes(email);

  async function createUser(email: string, fullName: string, password: string) {
    const { salt, hash } = await hashPassword(password);
    const id = randomUUID();
    const admin = isAdminEmail(email);
    db.exec('BEGIN');
    try {
      db.prepare('INSERT INTO users (id, email, full_name, password_hash, salt, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, email, fullName, hash, salt, admin ? 1 : 0, now());
      const seed = admin ? bundled() : null;
      if (seed) db.prepare('INSERT INTO workspaces (owner_id, data, revision, created_at, updated_at) VALUES (?, ?, 0, ?, ?)').run(id, seed, now(), now());
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      if (/UNIQUE/i.test((e as Error).message)) throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
      throw e;
    }
    return userById(id)!;
  }

  function startSession(res: Response, req: Request, userId: string) {
    const token = newSessionToken();
    const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
    db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(hashToken(token), userId, now(), expires.toISOString());
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now());
    const secure = options.secureCookies || req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure ? '; Secure' : ''}`);
  }
  const clearCookie = (res: Response) => res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);

  function sessionUser(req: Request): UserRow | null {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (!token) return null;
    const row = db.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?').get(hashToken(token)) as { user_id: string; expires_at: string } | undefined;
    if (!row || row.expires_at < now()) return null;
    return userById(row.user_id) ?? null;
  }

  const requireUser = (req: Request, _res: Response, next: NextFunction) => {
    const user = sessionUser(req);
    if (!user) return next(new HttpError(401, 'Please sign in.'));
    (req as AuthedRequest).user = user;
    next();
  };
  const requireAdmin = (req: Request, _res: Response, next: NextFunction) =>
    (req as AuthedRequest).user.is_admin ? next() : next(new HttpError(403, 'Only an admin can do that.'));

  // Refuse cross-site writes: the session cookie is SameSite=Lax, and the Origin must also match this host.
  app.use((req, _res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.headers.origin;
    if (origin) {
      let host = '';
      try { host = new URL(origin).host; } catch { /* invalid origin */ }
      if (host !== req.headers.host) return next(new HttpError(403, 'Cross-site requests are not allowed.'));
    }
    next();
  });
  app.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use(express.json({ limit: '40mb' }));

  // ---- auth -----------------------------------------------------------------
  const readCredentials = (body: unknown) => {
    const b = (body ?? {}) as Record<string, unknown>;
    const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
    const password = typeof b.password === 'string' ? b.password : '';
    const fullName = typeof b.fullName === 'string' ? b.fullName.trim() : '';
    return { email, password, fullName };
  };

  app.post('/auth/signup', async (req, res, next) => {
    try {
      const { email, password, fullName } = readCredentials(req.body);
      if (!EMAIL_RE.test(email) || email.length > 254) throw new HttpError(400, 'Enter a valid email address.');
      if (password.length < 8 || password.length > 200) throw new HttpError(400, 'Use a password of at least 8 characters.');
      if (fullName.length > 100) throw new HttpError(400, 'That name is too long.');
      if (userByEmail(email)) throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
      const user = await createUser(email, fullName, password);
      startSession(res, req, user.id);
      res.status(201).json({ user: userDto(user) });
    } catch (e) { next(e); }
  });

  app.post('/auth/signin', async (req, res, next) => {
    try {
      const { email, password } = readCredentials(req.body);
      const key = `${req.socket.remoteAddress}|${email}`;
      if (limiter.blocked(key)) throw new HttpError(429, 'Too many failed attempts. Try again in a few minutes.');
      const user = userByEmail(email);
      const ok = await verifyPassword(password, user?.salt ?? null, user?.password_hash ?? null);
      if (!user || !ok) { limiter.fail(key); throw new HttpError(401, 'Invalid email or password.'); }
      limiter.clear(key);
      startSession(res, req, user.id);
      res.json({ user: userDto(user) });
    } catch (e) { next(e); }
  });

  app.post('/auth/signout', (req, res) => {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    clearCookie(res);
    res.json({ ok: true });
  });

  app.get('/auth/me', (req, res) => {
    const user = sessionUser(req);
    if (!user) return res.json({ user: null });
    res.json({ user: userDto(user) });
  });

  // ---- workspace ------------------------------------------------------------
  app.get('/workspace', requireUser, (req, res, next) => {
    try {
      const user = (req as AuthedRequest).user;
      if (!user.is_admin) {
        const link = linkOf(user.id);
        if (link) {
          const row = workspaceOf(link.admin_id);
          if (!row) throw new HttpError(404, 'Your workspace is not ready yet. Ask your admin to assign you a template.');
          return res.json({ workspace: filterForMember(JSON.parse(row.data), link.person_id), revision: row.revision, member: { adminId: link.admin_id, personId: link.person_id } });
        }
      }
      const row = workspaceOf(user.id);
      res.json(row ? { workspace: JSON.parse(row.data), revision: row.revision } : { workspace: null, revision: 0 });
    } catch (e) { next(e); }
  });

  app.post('/workspace', requireUser, (req, res, next) => {
    try {
      const user = (req as AuthedRequest).user;
      if (!user.is_admin && linkOf(user.id)) throw new HttpError(403, 'Linked members cannot create a workspace.');
      const data = (req.body ?? {}).data;
      assertWorkspaceShape(data);
      if (workspaceOf(user.id)) throw new HttpError(409, 'A workspace already exists for this account.');
      db.prepare('INSERT INTO workspaces (owner_id, data, revision, created_at, updated_at) VALUES (?, ?, 0, ?, ?)').run(user.id, JSON.stringify(data), now(), now());
      res.status(201).json({ revision: 0 });
    } catch (e) { next(e); }
  });

  app.put('/workspace', requireUser, (req, res, next) => {
    try {
      const user = (req as AuthedRequest).user;
      if (!user.is_admin && linkOf(user.id)) throw new HttpError(403, 'Members save their own reviews only.');
      const { data, revision } = (req.body ?? {}) as { data?: unknown; revision?: unknown };
      assertWorkspaceShape(data);
      if (!Number.isInteger(revision) || (revision as number) < 0) throw new HttpError(400, 'A revision number is required.');
      const result = db.prepare('UPDATE workspaces SET data = ?, revision = revision + 1, updated_at = ? WHERE owner_id = ? AND revision = ?').run(JSON.stringify(data), now(), user.id, revision as number);
      if (!result.changes) throw new HttpError(workspaceOf(user.id) ? 409 : 404, workspaceOf(user.id) ? 'Workspace changed in another tab/device. Download your backup, then reload to get the latest version.' : 'No workspace found for this account.');
      res.json({ revision: (revision as number) + 1 });
    } catch (e) { next(e); }
  });

  /** The only write a member can make: replace/insert one of their own reviews in the admin's workspace. */
  app.post('/workspace/member-review', requireUser, (req, res, next) => {
    try {
      const user = (req as AuthedRequest).user;
      const link = linkOf(user.id);
      if (!link) throw new HttpError(403, 'Not a linked member.');
      const review = (req.body ?? {}).review as { id?: unknown; memberId?: unknown; blockerItems?: Blocker[] } | undefined;
      if (!review || typeof review !== 'object' || typeof review.id !== 'string') throw new HttpError(400, 'A review is required.');
      if (review.memberId !== link.person_id) throw new HttpError(403, 'That review does not belong to you.');
      const row = workspaceOf(link.admin_id);
      if (!row) throw new HttpError(404, 'Workspace not found.');
      const data = JSON.parse(row.data) as { reviews: Array<{ id: string }> };
      const index = data.reviews.findIndex(r => r.id === review.id);
      if (index >= 0) {
        const previous = data.reviews[index] as { memberId?: string; blockerItems?: Blocker[] };
        if (previous.memberId !== link.person_id) throw new HttpError(403, 'That review does not belong to you.');
        if (previous.blockerItems || review.blockerItems) review.blockerItems = mergeBlockers(previous.blockerItems ?? [], review.blockerItems ?? []);
        // keep comments the member's copy has not seen yet (an admin may have replied meanwhile)
        const existing = ((data.reviews[index] as { comments?: Array<{ id: string }> }).comments ?? []);
        const mine = new Set(((review as { comments?: Array<{ id: string }> }).comments ?? []).map(c => c.id));
        const extra = existing.filter(c => !mine.has(c.id));
        data.reviews[index] = (extra.length ? { ...review, comments: [...((review as { comments?: unknown[] }).comments ?? []), ...extra] } : review) as { id: string };
      } else data.reviews.push(review as { id: string });
      db.prepare('UPDATE workspaces SET data = ?, revision = revision + 1, updated_at = ? WHERE owner_id = ?').run(JSON.stringify(data), now(), link.admin_id);
      res.json({ revision: row.revision + 1 });
    } catch (e) { next(e); }
  });

  // ---- users (the "Users" / assign-reports screen) --------------------------
  const appUserDto = (u: UserRow) => ({ id: u.id, email: u.email, full_name: u.full_name, assigned_role_slug: u.assigned_role_slug, assigned_at: u.assigned_at, created_at: u.created_at });

  app.get('/users', requireUser, (req, res) => {
    const user = (req as AuthedRequest).user;
    const rows = (user.is_admin ? db.prepare('SELECT * FROM users ORDER BY created_at ASC').all() : [user]) as UserRow[];
    res.json({ users: rows.map(appUserDto) });
  });

  app.post('/users/:id/assign', requireUser, requireAdmin, (req, res, next) => {
    try {
      const slug = (req.body ?? {}).slug;
      if (typeof slug !== 'string' || !slug || slug.length > 200) throw new HttpError(400, 'A template slug is required.');
      const result = db.prepare('UPDATE users SET assigned_role_slug = ?, assigned_at = ? WHERE id = ?').run(slug, now(), String(req.params.id));
      if (!result.changes) throw new HttpError(404, 'User not found.');
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  app.post('/users/:id/link', requireUser, requireAdmin, (req, res, next) => {
    try {
      const admin = (req as AuthedRequest).user;
      const { personId, email } = (req.body ?? {}) as { personId?: unknown; email?: unknown };
      if (typeof personId !== 'string' || !personId) throw new HttpError(400, 'A person id is required.');
      const target = userById(String(req.params.id));
      if (!target) throw new HttpError(404, 'User not found.');
      if (target.id === admin.id) throw new HttpError(400, 'You cannot link your own admin account as a member.');
      db.prepare(`INSERT INTO member_links (user_id, admin_id, person_id, email, linked_at) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET admin_id = excluded.admin_id, person_id = excluded.person_id, email = excluded.email, linked_at = excluded.linked_at`)
        .run(target.id, admin.id, personId, typeof email === 'string' ? email : target.email, now());
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  app.use((_req, _res, next) => next(new HttpError(404, 'Not found.')));
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as { status?: number; type?: string; message?: string };
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (e?.type === 'entity.too.large') return res.status(413).json({ error: 'That request is too large.' });
    if (e?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    console.error('[api]', err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  /** First-run seeding: one admin account that already holds the bundled data, for demos. */
  async function seed() {
    const seedAdmin = options.seedAdmin;
    if (!seedAdmin) return;
    const count = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
    if (count > 0) return;
    const email = seedAdmin.email.trim().toLowerCase();
    if (!options.adminEmails.includes(email)) options.adminEmails.push(email);
    const password = seedAdmin.password || randomBytes(9).toString('base64url');
    await createUser(email, seedAdmin.fullName, password);
    if (seedAdmin.credentialsFile && !seedAdmin.password) {
      mkdirSync(path.dirname(seedAdmin.credentialsFile), { recursive: true });
      writeFileSync(seedAdmin.credentialsFile, `PestCure local demo login\nemail: ${email}\npassword: ${password}\n\nCreated on first start of the local SQLite backend. Delete the database (server/data) to re-seed.\n`, { mode: 0o600 });
    }
    console.log(`[pestcure] Seeded admin account ${email}${seedAdmin.credentialsFile && !seedAdmin.password ? ` — login details saved in ${path.relative(process.cwd(), seedAdmin.credentialsFile)}` : ''}`);
  }

  return { app, db, ready: seed() };
}

export function optionsFromEnv(root = process.cwd(), env: NodeJS.ProcessEnv = process.env): ServerOptions {
  const adminEmails = (env.ADMIN_EMAILS ?? 'handysolverteam@gmail.com,tusharbali855@gmail.com').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const dataDir = path.resolve(root, env.PESTCURE_DATA_DIR ?? 'server/data');
  return {
    dbPath: path.join(dataDir, 'pestcure.db'),
    adminEmails,
    bundledWorkspacePath: path.resolve(root, 'supabase/workspace-data.json'),
    seedAdmin: env.PESTCURE_SEED === 'off' ? undefined : { email: adminEmails[0], fullName: 'PestCure Admin', password: env.DEMO_ADMIN_PASSWORD, credentialsFile: path.join(dataDir, 'demo-credentials.txt') },
    secureCookies: env.COOKIE_SECURE === 'true',
  };
}

/** Lets ADMIN_EMAILS, DEMO_ADMIN_PASSWORD and friends live in .env.local next to the Vite variables. Real environment variables win. */
export function loadEnvFiles(root = process.cwd()) {
  loadDotenv({ path: [path.resolve(root, '.env.local'), path.resolve(root, '.env')], quiet: true });
}
