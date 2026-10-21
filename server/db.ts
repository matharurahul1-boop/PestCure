import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Local SQLite store. It mirrors the Supabase layout the app was built against:
 * users (= auth.users + public.app_users + public.admins), sessions, workspaces
 * (one JSON document per owner, with an optimistic-concurrency revision) and member_links.
 */
export function openDb(file: string) {
  if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      assigned_role_slug TEXT,
      assigned_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS workspaces (
      owner_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data TEXT NOT NULL,
      revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS member_links (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      person_id TEXT NOT NULL,
      email TEXT NOT NULL,
      linked_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS member_links_admin_idx ON member_links(admin_id);
  `);
  return db;
}

export type Db = ReturnType<typeof openDb>;
export type UserRow = { id: string; email: string; full_name: string; password_hash: string; salt: string; is_admin: number; assigned_role_slug: string | null; assigned_at: string | null; created_at: string };
export type WorkspaceRow = { owner_id: string; data: string; revision: number; created_at: string; updated_at: string };
export type LinkRow = { user_id: string; admin_id: string; person_id: string; email: string; linked_at: string };
