import test from 'node:test';
import assert from 'node:assert/strict';
import { type Field, type Review, type Workspace } from '../src/workspace/model';
import { activateCalendar, frozen, guardReviewUpdate } from '../src/workspace/schedule';
import { buildReminders } from '../src/workspace/reminders';

const at = (date: string) => new Date(date + '+05:30');
const base = (): Workspace => {
  const fields: Field[] = [{ id: 'weekly', label: 'Weekly result', kra: 'Weekly', cadence: 'weekly', type: 'number', unit: '', target: 5, owner: 'member', required: true, direction: 'higher' }];
  return { version: 1, roles: [{ id: 'role', name: 'Test', department: '', description: '', fields }], people: [{ id: 'p', name: 'Person', email: '', roleId: 'role' }], reviews: [], activity: [], theme: 'light', thresholds: { good: 80, watch: 50 } };
};
const comment = (role: 'admin' | 'member', text: string, when: string) => ({ id: role + text, key: 'weekly', label: 'Weekly result', authorId: role === 'admin' ? 'admin' : 'p', author: role === 'admin' ? 'Admin' : 'Person', role, text, at: when });

test('a member is reminded to set targets, then to submit, then that a missed week can still be filled', () => {
  const state = activateCalendar(base(), 1, at('2026-09-07T09:00:00'));
  const week = state.reviews.find(r => r.periodKind === 'weekly')!;
  const early = buildReminders(state, 'p', false, at('2026-09-08T09:00:00'));
  assert.ok(early.some(r => r.id === `m-targets-${week.id}` && /Set your targets/.test(r.text)));

  const approved: Workspace = { ...state, reviews: state.reviews.map(r => (r.id === week.id ? { ...r, targetStatus: 'approved' as const } : r)) };
  const soon = buildReminders(approved, 'p', false, at('2026-09-12T09:00:00'));
  const submit = soon.find(r => r.id === `m-results-${week.id}`);
  assert.ok(submit && submit.tone !== 'info', 'closing soon should not be a plain info reminder');

  const late = buildReminders(approved, 'p', false, at('2026-09-16T09:00:00'));
  assert.ok(late.some(r => r.id === `m-late-${week.id}` && r.tone === 'urgent'));
  assert.equal(buildReminders(approved, 'other', false, at('2026-09-16T09:00:00')).length, 0);
});

test('an admin is reminded of waiting approvals and unanswered replies', () => {
  const state = activateCalendar(base(), 1, at('2026-09-07T09:00:00'));
  const week = state.reviews.find(r => r.periodKind === 'weekly')!;
  const next: Workspace = { ...state, reviews: state.reviews.map(r => (r.id === week.id ? { ...r, targetStatus: 'pending' as const, comments: [comment('admin', 'Why so low?', '2026-09-08T09:00:00+05:30'), comment('member', 'Leave week', '2026-09-08T10:00:00+05:30')] } : r)) };
  const list = buildReminders(next, null, true, at('2026-09-09T09:00:00'));
  assert.ok(list.some(r => r.id === 'a-targets'));
  assert.ok(list.some(r => r.id.startsWith('a-reply-') && /Leave week/.test(r.text)));
  const answered = { ...next, reviews: next.reviews.map(r => ({ ...r, comments: [...(r.comments ?? []), comment('admin', 'Thanks', '2026-09-08T11:00:00+05:30')] })) };
  assert.equal(buildReminders(answered, null, true, at('2026-09-09T09:00:00')).some(r => r.id.startsWith('a-reply-')), false);
});

test('comments can be added to a closed period, but nothing else can change', () => {
  const state = activateCalendar(base(), 1, at('2026-09-07T09:00:00'));
  const closed: Review = { ...state.reviews.find(r => r.periodKind === 'weekly')!, status: 'submitted' };
  const later = at('2026-09-20T09:00:00');
  assert.ok(frozen(closed, later));
  const withComment = { ...closed, comments: [comment('admin', 'Please explain', '2026-09-20T09:00:00+05:30')] };
  assert.doesNotThrow(() => guardReviewUpdate(closed, withComment, later));
  assert.throws(() => guardReviewUpdate(closed, { ...withComment, highlights: 'edited' }, later), /frozen/);
});
