import test from 'node:test';
import assert from 'node:assert/strict';
import { type Field, type Workspace, createReview } from '../src/workspace/model';
import { activateCalendar, cycleStart, reconcileCalendar, entryOpen, frozen, periodEnded, lateFillable, missedEntries, requestLateEntry, decideLateEntry, submitLateEntry, guardReviewUpdate, nextMonth } from '../src/workspace/schedule';
import { transition } from '../src/workspace/model';
const at = (date: string) => new Date(date + '+05:30');
const base = (): Workspace => {
  const fields: Field[] = [
    { id: 'weekly', label: 'Weekly result', kra: 'Weekly', cadence: 'weekly', type: 'number', unit: '', target: 5, owner: 'member', required: true, direction: 'higher' },
    { id: 'monthly', label: 'Monthly billing', kra: 'Monthly', cadence: 'monthly', type: 'number', unit: '', target: 20, owner: 'member', required: true, direction: 'higher' },
    { id: 'daily', label: 'Daily note', kra: 'Notes', cadence: 'daily', type: 'text', unit: '', target: 1, owner: 'member', required: true, direction: 'higher' },
    { id: 'days', label: 'Daily calls', kra: 'Calls', type: 'table', unit: '', target: 1, owner: 'member', required: false, direction: 'higher', table: { columns: [{ id: 'mon', label: 'Mon', type: 'daily' }, { id: 'tue', label: 'Tue', type: 'daily' }], rows: [{ id: 'calls', label: 'Calls', defaults: {} }] } },
  ];
  return { version: 1, roles: [{ id: 'role', name: 'Test', department: '', description: '', fields }], people: [{ id: 'p', name: 'Person', email: '', roleId: 'role' }], reviews: [], activity: [], theme: 'light', thresholds: { good: 80, watch: 50 } };
};
test('Sunday 23:59 stays in old week; Monday midnight creates exactly one new weekly review', () => {
  const state = activateCalendar(base(), 1, at('2026-09-06T23:59:59'));
  const old = state.reviews.find(r => r.periodKind === 'weekly')!;
  assert.equal(old.week, '2026-08-31'); assert.equal(frozen(old, at('2026-09-06T23:59:59')), false);
  const next = reconcileCalendar(state, at('2026-09-07T00:00:00'));
  assert.ok(periodEnded(old, at('2026-09-07T00:00:00')));
  assert.equal(next.reviews.filter(r => r.periodKind === 'weekly').length, 2);
  assert.strictEqual(reconcileCalendar(next, at('2026-09-07T00:00:01')), next);
});
test('configured week can start Tuesday, including year boundaries', () => {
  assert.equal(cycleStart('2027-01-04', 2), '2026-12-29');
  assert.equal(cycleStart('2027-01-05', 2), '2027-01-05');
});
test('daily cells are future-locked, open on their date, and freeze at midnight', () => {
  const state = activateCalendar(base(), 1, at('2026-09-07T09:00:00'));
  const r = state.reviews.find(r => r.periodKind === 'weekly')!; const f = r.fields.find(f => f.id === 'days')!;
  assert.ok(entryOpen(r, f, f.table!.columns[0], at('2026-09-07T23:59:59')));
  assert.equal(entryOpen(r, f, f.table!.columns[1], at('2026-09-07T09:00:00')), false);
  assert.equal(entryOpen(r, f, f.table!.columns[0], at('2026-09-08T00:00:00')), false);
  const edit = structuredClone(r); edit.tables!.days.calls.mon = 2;
  assert.throws(() => guardReviewUpdate(r, edit, at('2026-09-08T00:00:00')), /locked/);
});
test('monthly record persists across weekly rollover and resets next month', () => {
  const state = activateCalendar(base(), 1, at('2026-09-06T10:00:00'));
  const monthly = state.reviews.find(r => r.periodKind === 'monthly')!; monthly.values.monthly = 12;
  const next = reconcileCalendar(state, at('2026-09-14T10:00:00'));
  assert.equal(next.reviews.filter(r => r.periodKind === 'monthly').length, 1);
  assert.equal(next.reviews.find(r => r.id === monthly.id)!.values.monthly, 12);
  const october = reconcileCalendar(next, at('2026-10-01T00:00:00'));
  assert.ok(frozen(monthly, at('2026-10-01T00:00:00')));
  assert.equal(october.reviews.find(r => r.periodKind === 'monthly' && r.week === '2026-10-01')!.values.monthly, undefined);
  assert.equal(nextMonth('2028-02-01'), '2028-03-01');
});
test('offline catch-up creates each missed daily period without duplicates', () => {
  const state = activateCalendar(base(), 1, at('2026-09-07T09:00:00'));
  const next = reconcileCalendar(state, at('2026-09-10T09:00:00'));
  assert.equal(next.reviews.filter(r => r.periodKind === 'daily').length, 4);
  assert.equal(missedEntries(next, at('2026-09-10T09:00:00')).filter(e => e.fieldId === 'daily').length, 3);
});
test('missing entries exclude pre-activation deadlines and treat zero/false as filled', () => {
  const state = activateCalendar(base(), 1, at('2026-09-09T09:00:00'));
  assert.equal(missedEntries(state, at('2026-09-09T09:00:00')).length, 0);
  const state2 = activateCalendar(base(), 1, at('2026-09-07T09:00:00'));
  const r = state2.reviews.find(r => r.periodKind === 'weekly')!; r.tables!.days.calls.mon = 0; r.values.weekly = false;
  const missed = missedEntries(state2, at('2026-09-14T09:00:00'));
  assert.equal(missed.some(e => e.columnId === 'mon' || e.fieldId === 'weekly'), false);
});
test('late access requires owner request, admin approval, expiry, and is consumed once', () => {
  const now = at('2026-09-08T09:00:00'); let state = activateCalendar(base(), 1, at('2026-09-07T09:00:00'));
  const entry = missedEntries(state, now).find(e => e.columnId === 'mon')!;
  assert.throws(() => requestLateEntry(state, entry, 'other', 'Missed', now));
  state = requestLateEntry(state, entry, 'p', 'Field visit', now); const id = state.lateRequests![0].id;
  assert.throws(() => submitLateEntry(state, id, 'p', 3, now));
  assert.throws(() => decideLateEntry(state, id, 'p', true, '', now));
  state = decideLateEntry(state, id, 'admin', true, 'Approved', now);
  assert.throws(() => submitLateEntry(state, id, 'other', 3, now));
  assert.throws(() => submitLateEntry(state, id, 'p', 3, at('2026-09-09T09:00:00')));
  state = submitLateEntry(state, id, 'p', 3, now);
  assert.equal(state.lateRequests![0].status, 'completed'); assert.equal(state.reviewRevisions!.length, 1);
  assert.equal(missedEntries(state, now).some(e => e.key === entry.key), false);
  assert.throws(() => submitLateEntry(state, id, 'p', 4, now));
});
test('activation splits existing monthly results without discarding them', () => {
  const state = base(); const r = createReview(state.people[0], state.roles[0], '2026-09-07'); r.values.monthly = 7; state.reviews.push(r);
  const next = activateCalendar(state, 1, at('2026-09-07T09:00:00'));
  assert.equal(next.reviews.find(r => r.periodKind === 'monthly')!.values.monthly, 7);
  assert.equal(next.reviews.find(x => x.id === r.id)!.fields.some(f => f.id === 'monthly'), false);
  assert.equal(next.reviewRevisions!.length, 1);
});
test('mixed weekly/monthly table rows become separate records with their original results', () => {
  const state = base(); const table = state.roles[0].fields.find(f => f.id === 'days')!;
  table.table = { columns: [{ id: 'actual', label: 'Actual', type: 'number' }], rows: [{ id: 'month', label: 'Monthly OP', defaults: {} }, { id: 'week', label: 'Weekly OP', defaults: {} }] };
  const r = createReview(state.people[0], state.roles[0], '2026-09-07'); r.tables!.days.month.actual = 120; r.tables!.days.week.actual = 30; state.reviews.push(r);
  const next = activateCalendar(state, 1, at('2026-09-07T09:00:00'));
  const month = next.reviews.find(r => r.periodKind === 'monthly')!;
  const week = next.reviews.find(x => x.id === r.id)!;
  assert.deepEqual(week.fields.find(f => f.id === 'days')!.table!.rows.map(r => r.id), ['week']);
  assert.deepEqual(month.fields.find(f => f.id === 'days')!.table!.rows.map(r => r.id), ['month']);
  assert.equal(month.tables!.days.month.actual, 120); assert.equal(week.tables!.days.week.actual, 30);
});
test('new member is not marked missed for dates before joining', () => {
  let state = activateCalendar(base(), 1, at('2026-09-07T09:00:00'));
  state = reconcileCalendar(state, at('2026-09-10T09:00:00'));
  state.people.push({ ...state.people[0], id: 'new' });
  state = reconcileCalendar(state, at('2026-09-10T09:00:00'));
  assert.equal(missedEntries(state, at('2026-09-10T09:00:00')).filter(e => e.memberId === 'new').length, 0);
});

test('a missed weekly review stays fillable after its week ends; submitted and other periods lock', () => {
  const state = activateCalendar(base(), 1, at('2026-09-07T09:00:00'));
  const week = state.reviews.find(r => r.periodKind === 'weekly')!;
  const later = at('2026-09-16T09:00:00');
  assert.ok(periodEnded(week, later));
  assert.ok(lateFillable(week, later));
  assert.equal(frozen(week, later), false);
  const f = week.fields.find(f => f.id === 'days')!;
  assert.ok(entryOpen(week, f, f.table!.columns[1], later));
  const edit = structuredClone(week); edit.values.weekly = 4;
  assert.doesNotThrow(() => guardReviewUpdate(week, edit, later));

  const submittedWeek = { ...week, status: 'submitted' as const };
  assert.ok(frozen(submittedWeek, later));
  assert.throws(() => guardReviewUpdate(submittedWeek, edit, later), /frozen/);

  const monthly = state.reviews.find(r => r.periodKind === 'monthly')!;
  assert.ok(frozen(monthly, at('2026-10-02T09:00:00')));
});

test('members cannot submit once a review is locked, but an admin can still decide on it', () => {
  const state = activateCalendar(base(), 1, at('2026-09-07T09:00:00'));
  const week = state.reviews.find(r => r.periodKind === 'weekly')!;
  const submitted = { ...week, targetStatus: 'approved' as const, status: 'submitted' as const };
  assert.ok(frozen(submitted, at('2026-09-20T09:00:00')));
  const approve = transition({ ...submitted }, 'approve-review', 'admin');
  assert.equal(approve.status, 'approved');
});
