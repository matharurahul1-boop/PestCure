import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApi } from '../server/app';

async function boot(adminEmails = ['admin@example.com']) {
  const api = createApi({ dbPath: ':memory:', adminEmails, bundledWorkspacePath: 'supabase/workspace-data.json' });
  await api.ready;
  const root = express();
  root.use('/api', api.app);
  const server: Server = await new Promise(resolve => { const s = root.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  class Client {
    cookie = '';
    async call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
      const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(this.cookie ? { Cookie: this.cookie } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
      const set = res.headers.getSetCookie()[0];
      if (set) this.cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
      return { status: res.status, body: (await res.json()) as any };
    }
  }
  return { api, base, server, client: () => new Client() };
}

test('sign up, sign in, session and sign out', async () => {
  const { server, client } = await boot();
  try {
    const c = client();
    assert.equal((await c.call('GET', '/auth/me')).body.user, null);
    assert.equal((await c.call('POST', '/auth/signup', { email: 'a@b', password: 'longenough1' })).status, 400);
    assert.equal((await c.call('POST', '/auth/signup', { email: 'person@example.com', password: 'short' })).status, 400);
    const up = await c.call('POST', '/auth/signup', { email: 'Person@Example.com', password: 'longenough1', fullName: 'Pat Person' });
    assert.equal(up.status, 201);
    assert.equal(up.body.user.email, 'person@example.com');
    assert.equal(up.body.user.isAdmin, false);
    assert.equal((await c.call('GET', '/auth/me')).body.user.name, 'Pat Person');
    assert.equal((await client().call('POST', '/auth/signup', { email: 'person@example.com', password: 'longenough1' })).status, 409);

    await c.call('POST', '/auth/signout');
    assert.equal((await c.call('GET', '/auth/me')).body.user, null);
    assert.equal((await c.call('GET', '/workspace')).status, 401);

    assert.equal((await c.call('POST', '/auth/signin', { email: 'person@example.com', password: 'wrong-password' })).status, 401);
    assert.equal((await c.call('POST', '/auth/signin', { email: 'nobody@example.com', password: 'longenough1' })).status, 401);
    assert.equal((await c.call('POST', '/auth/signin', { email: 'PERSON@example.com', password: 'longenough1' })).status, 200);
    assert.equal((await c.call('GET', '/auth/me')).body.user.email, 'person@example.com');
  } finally { server.close(); }
});

test('repeated wrong passwords are throttled and cross-site writes are refused', async () => {
  const { server, client } = await boot();
  try {
    const c = client();
    await c.call('POST', '/auth/signup', { email: 'slow@example.com', password: 'longenough1' });
    const guesser = client();
    for (let i = 0; i < 10; i++) assert.equal((await guesser.call('POST', '/auth/signin', { email: 'slow@example.com', password: `bad-guess-${i}` })).status, 401);
    assert.equal((await guesser.call('POST', '/auth/signin', { email: 'slow@example.com', password: 'longenough1' })).status, 429);
    assert.equal((await client().call('POST', '/auth/signin', { email: 'slow@example.com', password: 'longenough1' }, { Origin: 'https://evil.example' })).status, 403);
  } finally { server.close(); }
});

test('admin account starts with the bundled data; saves are revision-checked', async () => {
  const { server, client } = await boot();
  try {
    const admin = client();
    const up = await admin.call('POST', '/auth/signup', { email: 'admin@example.com', password: 'longenough1', fullName: 'Admin' });
    assert.equal(up.body.user.isAdmin, true);
    const loaded = await admin.call('GET', '/workspace');
    assert.equal(loaded.status, 200);
    assert.equal(loaded.body.revision, 0);
    assert.equal(loaded.body.workspace.people.length, 3);
    assert.equal(loaded.body.workspace.roles.length, 15);
    assert.equal(loaded.body.workspace.reviews.length, 22);

    const edited = { ...loaded.body.workspace, theme: 'dark' };
    assert.deepEqual((await admin.call('PUT', '/workspace', { data: edited, revision: 0 })).body, { revision: 1 });
    assert.equal((await admin.call('PUT', '/workspace', { data: edited, revision: 0 })).status, 409);
    assert.equal((await admin.call('PUT', '/workspace', { data: { version: 1 }, revision: 1 })).status, 400);
    const again = await admin.call('GET', '/workspace');
    assert.equal(again.body.workspace.theme, 'dark');
    assert.equal(again.body.revision, 1);
  } finally { server.close(); }
});

test('a non-admin account owns an independent workspace created on first use', async () => {
  const { server, client } = await boot();
  try {
    const user = client();
    await user.call('POST', '/auth/signup', { email: 'solo@example.com', password: 'longenough1' });
    const empty = await user.call('GET', '/workspace');
    assert.equal(empty.body.workspace, null);
    const doc = { version: 1, roles: [], people: [], reviews: [], activity: [], thresholds: { good: 80, watch: 50 } };
    assert.equal((await user.call('POST', '/workspace', { data: doc })).status, 201);
    assert.equal((await user.call('POST', '/workspace', { data: doc })).status, 409);
    assert.equal((await user.call('POST', '/workspace', { data: { nope: true } })).status, 400);
    assert.equal((await user.call('GET', '/workspace')).body.workspace.people.length, 0);
  } finally { server.close(); }
});

test('linked members see only their own report and can write only their own reviews', async () => {
  const { server, client } = await boot();
  try {
    const admin = client();
    await admin.call('POST', '/auth/signup', { email: 'admin@example.com', password: 'longenough1' });
    const full = (await admin.call('GET', '/workspace')).body.workspace;
    const person = full.people[0];
    const other = full.people[1];
    const ownReviews = full.reviews.filter((r: any) => r.memberId === person.id);
    assert.ok(ownReviews.length > 0);

    const member = client();
    const m = await member.call('POST', '/auth/signup', { email: 'member@example.com', password: 'longenough1', fullName: 'Member' });

    // only admins may list everyone or manage assignments
    assert.equal((await member.call('GET', '/users')).body.users.length, 1);
    assert.equal((await admin.call('GET', '/users')).body.users.length, 2);
    assert.equal((await member.call('POST', `/users/${m.body.user.id}/assign`, { slug: 'role-x' })).status, 403);
    assert.equal((await member.call('POST', `/users/${m.body.user.id}/link`, { personId: person.id })).status, 403);
    assert.equal((await admin.call('POST', `/users/${m.body.user.id}/assign`, { slug: person.roleId })).status, 200);
    assert.equal((await admin.call('GET', '/users')).body.users.find((u: any) => u.id === m.body.user.id).assigned_role_slug, person.roleId);
    assert.equal((await admin.call('POST', `/users/${m.body.user.id}/link`, { personId: person.id, email: 'member@example.com' })).status, 200);

    const view = await member.call('GET', '/workspace');
    assert.equal(view.status, 200);
    assert.deepEqual(view.body.member.personId, person.id);
    assert.deepEqual(view.body.workspace.people.map((p: any) => p.id), [person.id]);
    assert.ok(view.body.workspace.reviews.every((r: any) => r.memberId === person.id));
    assert.equal(view.body.workspace.reviews.length, ownReviews.length);
    assert.equal(view.body.workspace.savedReports.length, 0);

    assert.equal((await member.call('PUT', '/workspace', { data: full, revision: 0 })).status, 403);
    assert.equal((await member.call('POST', '/workspace', { data: full })).status, 403);

    const mine = { ...ownReviews[0], highlights: 'edited by member' };
    assert.equal((await member.call('POST', '/workspace/member-review', { review: mine })).status, 200);
    const foreign = full.reviews.find((r: any) => r.memberId === other.id);
    assert.equal((await member.call('POST', '/workspace/member-review', { review: { ...foreign, highlights: 'hijack' } })).status, 403);

    const after = (await admin.call('GET', '/workspace')).body;
    assert.equal(after.workspace.reviews.find((r: any) => r.id === mine.id).highlights, 'edited by member');
    assert.equal(after.workspace.reviews.find((r: any) => r.id === foreign.id).highlights, foreign.highlights);
    assert.equal(after.revision, 1);
  } finally { server.close(); }
});
