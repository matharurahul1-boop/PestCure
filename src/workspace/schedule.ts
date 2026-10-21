import { createReview, type Field, type Review, type Workspace } from './model';
import { type CellValue, type Column } from './tableModel';
import { inheritTargets, latestApprovedReview } from './targetGovernance';

export type ReviewCalendar = { startDay: number; activatedOn: string; lastDate: string; timezone: 'Asia/Kolkata' };
export type EntryRef = { reviewId: string; fieldId: string; rowId?: string; columnId?: string };
export type LateRequest = { id: string; entry: EntryRef; memberId: string; reason: string; requestedAt: string; status: 'pending' | 'approved' | 'rejected' | 'completed'; decidedAt?: string; expiresAt?: string; decision?: string; submittedAt?: string; value?: CellValue };
export type MissedEntry = EntryRef & { key: string; memberId: string; label: string; due: string; type: string; period: string };
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const todayIST = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
export function plusDays(date: string, days: number) { const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
export function cycleStart(date: string, startDay = 1) { return plusDays(date, -(new Date(date + 'T00:00:00Z').getUTCDay() - startDay + 7) % 7); }
export const nextMonth = (date: string) => { const d = new Date(date + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1, 1); return d.toISOString().slice(0, 10); };
export const cadence = (f: Field) => f.cadence ?? (/monthly/i.test(f.label + ' ' + f.kra) ? 'monthly' : 'weekly');
export function fieldsForPeriod(fields: Field[], kind: 'weekly' | 'daily' | 'monthly'): Field[] {
  return fields.flatMap(f => { if (!f.table) return cadence(f) === kind ? [f] : [];
    const rows = f.table.rows.filter(row => (row.cadence ?? f.cadence ?? (/monthly/i.test(row.label) ? 'monthly' : cadence(f))) === kind);
    return rows.length ? [{ ...f, table: { ...f.table, rows } }] : [];
  });
}
export const dayColumn = (column: Column) => DAYS.findIndex(day => [day.toLowerCase(), day.slice(0, 3).toLowerCase()].includes(column.label.trim().toLowerCase()));
export const endOfReview = (r: Review) => r.periodEnd ?? plusDays(r.week, 7);
/** The review's period (week / day / month) is over. */
export const periodEnded = (r: Review, now = new Date()) => Boolean(r.trackingFrom && todayIST(now) >= endOfReview(r));
/** A weekly review nobody has submitted can still be filled in after its week ends (a late review). */
export const lateFillable = (r: Review, now = new Date()) => periodEnded(r, now) && !r.source && (r.periodKind ?? 'weekly') === 'weekly' && ['draft', 'changes'].includes(r.status);
/** Locked: the period is over and the review is not a late-fillable weekly one (submitted, approved, daily, monthly or imported). */
export const frozen = (r: Review, now = new Date()) => periodEnded(r, now) && !lateFillable(r, now);
export const periodLabel = (r: Review) => r.periodKind === 'daily' ? r.week : r.periodKind === 'monthly' ? r.week.slice(0, 7) : `${r.week} – ${plusDays(endOfReview(r), -1)}`;
export function entryWindow(r: Review, f: Field, column?: Column) {
  const day = column ? dayColumn(column) : -1;
  if (day >= 0 && r.periodKind !== 'monthly' && r.periodKind !== 'daily') {
    const date = plusDays(r.week, (day - new Date(r.week + 'T00:00:00Z').getUTCDay() + 7) % 7);
    return { start: date, end: plusDays(date, 1) };
  }
  return { start: r.week, end: endOfReview(r) };
}
export function entryOpen(r: Review, f: Field, column?: Column, now = new Date()) {
  if (!r.trackingFrom) return true;
  if (lateFillable(r, now)) return true;
  const window = entryWindow(r, f, column); const today = todayIST(now);
  return today >= window.start && today < window.end && !frozen(r, now);
}
export const entryKey = (entry: EntryRef) => JSON.stringify([entry.reviewId, entry.fieldId, entry.rowId ?? '', entry.columnId ?? '']);
const filled = (v: unknown) => v !== undefined && v !== null && (typeof v !== 'string' || v.trim() !== '');
export function getEntry(state: Workspace, ref: EntryRef) {
  const review = state.reviews.find(r => r.id === ref.reviewId); const field = review?.fields.find(f => f.id === ref.fieldId);
  if (!review || !field) throw new Error('This entry no longer exists.');
  const column = field.table?.columns.find(c => c.id === ref.columnId);
  const row = field.table?.rows.find(r => r.id === ref.rowId);
  if (field.type === 'table' && (!column || !row || ['target', 'computed'].includes(column.type))) throw new Error('This entry cannot be reopened.');
  return { review, field, column, row, value: field.type === 'table' ? review.tables?.[field.id]?.[row!.id]?.[column!.id] : review.values[field.id] };
}
export function missedEntries(state: Workspace, now = new Date()): MissedEntry[] {
  const today = todayIST(now); const result: MissedEntry[] = [];
  for (const r of state.reviews) {
    if (!r.trackingFrom || r.source || state.people.some(x => x.id === r.memberId && x.inactive)) continue;
    for (const f of r.fields) {
      const add = (rowId?: string, column?: Column, rowLabel?: string) => {
        const ref = { reviewId: r.id, fieldId: f.id, rowId, columnId: column?.id }; const window = entryWindow(r, f, column);
        const value = column ? r.tables?.[f.id]?.[rowId!]?.[column.id] : r.values[f.id];
        if (window.end <= today && window.end > r.trackingFrom! && !filled(value)) result.push({ ...ref, key: entryKey(ref), memberId: r.memberId, label: [f.label, rowLabel, column?.label].filter(Boolean).join(' · '), due: plusDays(window.end, -1), type: column?.type ?? f.type, period: periodLabel(r) });
      };
      if (f.table) for (const row of f.table.rows) for (const column of f.table.columns) { if (!['target', 'computed'].includes(column.type) && row.defaults[column.id] === undefined) add(row.id, column, row.label); }
      else add();
    }
  }
  return result.sort((a, b) => b.due.localeCompare(a.due));
}

/** Move a person to another role from `effective`: reports already written keep the role they were written on (pinned by roleName), the old role goes into roleHistory. */
export function switchRole(d: Workspace, personId: string, roleId: string, effective: string): Workspace {
  const person = d.people.find(p => p.id === personId);
  if (!person || person.roleId === roleId) return d;
  const oldName = d.roles.find(r => r.id === person.roleId)?.name ?? person.roleId;
  const history = [...(person.roleHistory ?? []), { roleId: person.roleId, roleName: oldName, from: person.roleSince, to: effective }];
  return {
    ...d,
    people: d.people.map(p => p.id === personId ? { ...p, roleId, fields: undefined, roleSince: effective, nextRole: undefined, roleHistory: history } : p),
    reviews: d.reviews.map(r => r.memberId === personId && !r.roleName ? { ...r, roleName: oldName } : r),
  };
}
/** A role change scheduled for the start of a new week takes effect once that day arrives. */
export function applyPendingRoles(state: Workspace, today: string): Workspace {
  let next = state;
  for (const p of state.people) if (p.nextRole && today >= p.nextRole.from) next = switchRole(next, p.id, p.nextRole.roleId, p.nextRole.from);
  if (next !== state) next = { ...next, people: next.people.map(p => p.nextRole && today >= p.nextRole.from ? { ...p, nextRole: undefined } : p) };
  return next;
}
export function reconcileCalendar(state: Workspace, now = new Date()): Workspace {
  state = applyPendingRoles(state, todayIST(now));
  if (!state.calendar) return state;
  const today = todayIST(now); if (today < state.calendar.lastDate) return state;
  let next = state; const ensureClone = () => { if (next === state) next = structuredClone(state); };
  if (state.reviews.some(r => !r.trackingFrom)) { ensureClone(); next.reviews.forEach(r => { r.trackingFrom ??= today; r.periodEnd ??= plusDays(r.week, 7); }); }
  if (next.reviews.some(r => !r.source && (r.periodKind ?? 'weekly') === 'weekly' && r.week <= today && !periodEnded(r, now) && ['draft', 'changes'].includes(r.status) && (fieldsForPeriod(r.fields, 'monthly').length || fieldsForPeriod(r.fields, 'daily').length))) { ensureClone(); splitRecurring(next, now); }
  // Catch up on every elapsed date so missed periods remain auditable after an offline interval.
  for (let date = state.calendar.lastDate; date <= today; date = plusDays(date, 1)) {
    for (const person of state.people) {
      if (person.inactive) continue;
      const role = state.roles.find(r => r.id === person.roleId); if (!role) continue;
      const fields = person.fields ?? role.fields;
      for (const kind of ['weekly', 'daily', 'monthly'] as const) {
        const selected = fieldsForPeriod(fields, kind); if (!selected.length) continue;
        const start = kind === 'weekly' ? cycleStart(date, state.calendar.startDay) : kind === 'monthly' ? date.slice(0, 7) + '-01' : date;
        if (next.reviews.some(r => r.memberId === person.id && r.week === start && !r.source && (r.periodKind ?? 'weekly') === kind)) continue;
        ensureClone(); let review = createReview({ ...person, fields: selected }, role, start);
        review = inheritTargets(review, latestApprovedReview(next, person.id, start, kind));
        review.periodKind = kind; review.periodEnd = kind === 'daily' ? plusDays(start, 1) : kind === 'monthly' ? nextMonth(start) : plusDays(start, 7);
        review.trackingFrom = date;
        next.reviews.push(review);
      }
    }
  }
  if (next.calendar!.lastDate !== today) { ensureClone(); next.calendar!.lastDate = today; }
  return next;
}
function splitRecurring(next: Workspace, now: Date) {
  const today = todayIST(now);
  for (const review of [...next.reviews]) {
    if (review.source || (review.periodKind ?? 'weekly') !== 'weekly' || review.week > today || periodEnded(review, now) || !['draft', 'changes'].includes(review.status)) continue;
    if (!fieldsForPeriod(review.fields, 'daily').length && !fieldsForPeriod(review.fields, 'monthly').length) continue;
    next.reviewRevisions = [...(next.reviewRevisions ?? []), structuredClone(review)];
    for (const kind of ['daily', 'monthly'] as const) {
      const fields = fieldsForPeriod(review.fields, kind); if (!fields.length) continue;
      const start = kind === 'daily' ? today : today.slice(0, 7) + '-01';
      const existing = next.reviews.find(r => r.memberId === review.memberId && r.periodKind === kind && r.week === start);
      if (existing) {
        // Preserve existing periodic responses; only add newly separated fields/rows.
        next.reviewRevisions.push(structuredClone(existing));
        for (const f of fields) {
          const found = existing.fields.find(x => x.id === f.id);
          if (!found) { existing.fields.push(structuredClone(f)); existing.values[f.id] = review.values[f.id]; existing.targets[f.id] = review.targets[f.id]; }
          else if (found.table && f.table) found.table.rows.push(...structuredClone(f.table.rows.filter(row => !found.table!.rows.some(old => old.id === row.id))));
          if (f.table) existing.tables = { ...existing.tables, [f.id]: { ...review.tables?.[f.id], ...existing.tables?.[f.id] } };
        }
        existing.status = 'draft'; existing.targetStatus = 'draft';
      } else next.reviews.push({ ...structuredClone(review), id: crypto.randomUUID(), fields: structuredClone(fields), week: start, periodKind: kind, periodEnd: kind === 'daily' ? plusDays(today, 1) : nextMonth(start), source: undefined, originalPeriod: undefined });
    }
    review.fields = fieldsForPeriod(review.fields, 'weekly');
  }
}
export function activateCalendar(state: Workspace, startDay: number, now = new Date()): Workspace {
  if (state.calendar) throw new Error('The review calendar is already active. Existing period boundaries are fixed.');
  if (!Number.isInteger(startDay) || startDay < 0 || startDay > 6) throw new Error('Choose a valid start day.');
  const today = todayIST(now); const next = structuredClone(state);
  next.calendar = { startDay, activatedOn: today, lastDate: today, timezone: 'Asia/Kolkata' };
  // Snapshot and split the active weekly form into independent daily/monthly records.
  for (const r of next.reviews) { r.trackingFrom = today; r.periodEnd ??= plusDays(r.week, 7); }
  splitRecurring(next, now);
  return reconcileCalendar(next, now);
}

export function requestLateEntry(state: Workspace, entry: EntryRef, memberId: string, reason: string, now = new Date()): Workspace {
  const missed = missedEntries(state, now).find(m => m.key === entryKey(entry));
  if (!missed || missed.memberId !== memberId || !reason.trim()) throw new Error('Select your missed entry and explain why it was missed.');
  if (state.lateRequests?.some(r => entryKey(r.entry) === missed.key && (r.status === 'pending' || (r.status === 'approved' && Date.parse(r.expiresAt!) > now.getTime())))) throw new Error('A request is already active for this entry.');
  return { ...state, lateRequests: [...(state.lateRequests ?? []), { id: crypto.randomUUID(), entry, memberId, reason: reason.trim(), requestedAt: now.toISOString(), status: 'pending' }] };
}
export function decideLateEntry(state: Workspace, id: string, actor: string, approve: boolean, decision: string, now = new Date()): Workspace {
  if (actor !== 'admin') throw new Error('Only an admin can decide an unlock request.');
  const request = state.lateRequests?.find(r => r.id === id);
  if (!request || request.status !== 'pending' || (!approve && !decision.trim())) throw new Error('Select a pending request; give a reason when rejecting.');
  return { ...state, lateRequests: state.lateRequests!.map(r => r.id === id ? { ...r, status: approve ? 'approved' : 'rejected', decidedAt: now.toISOString(), decision: decision.trim(), expiresAt: approve ? new Date(now.getTime() + 86400000).toISOString() : undefined } : r) };
}
export function submitLateEntry(state: Workspace, id: string, actor: string, value: CellValue, now = new Date()): Workspace {
  const request = state.lateRequests?.find(r => r.id === id);
  if (!request || actor !== request.memberId || request.status !== 'approved' || Date.parse(request.expiresAt!) <= now.getTime()) throw new Error('A valid admin approval is required.');
  const { review, field, column, row, value: previous } = getEntry(state, request.entry);
  if (filled(previous) || !filled(value)) throw new Error('Only a missing response can be submitted.');
  const type = column?.type ?? field.type;
  if (['number', 'daily'].includes(type) && !(typeof value === 'number' && Number.isFinite(value) && value >= 0) && !(type === 'daily' && typeof value === 'string' && /^(off|leave|holiday|n\/a)$/i.test(value.trim()))) throw new Error('Enter a non-negative number, or Off / Leave for a daily cell.');
  if (type === 'checkbox' && typeof value !== 'boolean') throw new Error('Select a completion status.');
  if (type === 'date' && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))) throw new Error('Enter a date.');
  const updated: Review = { ...review, updatedAt: now.toISOString(), ...(column ? { tables: { ...review.tables, [field.id]: { ...review.tables?.[field.id], [row!.id]: { ...review.tables?.[field.id]?.[row!.id], [column.id]: value } } } } : { values: { ...review.values, [field.id]: value } }) };
  return { ...state, reviewRevisions: [...(state.reviewRevisions ?? []), structuredClone(review)], reviews: state.reviews.map(r => r.id === review.id ? updated : r), lateRequests: state.lateRequests!.map(r => r.id === id ? { ...r, status: 'completed', submittedAt: now.toISOString(), value } : r) };
}

// All normal result writes pass this guard, including a form left open across midnight.
export function guardReviewUpdate(previous: Review, next: Review, now = new Date()) {
  // Comments are conversation, not data: they stay open on closed periods.
  const bare = (r: Review) => JSON.stringify({ ...r, comments: undefined, updatedAt: undefined });
  if (bare(previous) === bare(next)) return next;
  if (frozen(previous, now)) throw new Error('This period is frozen. Request approval from Missed entries.');
  for (const f of previous.fields) {
    if (f.table) for (const row of f.table.rows) for (const column of f.table.columns) {
      if (column.type === 'computed') continue;
      if (previous.tables?.[f.id]?.[row.id]?.[column.id] !== next.tables?.[f.id]?.[row.id]?.[column.id] && column.type !== 'target' && !entryOpen(previous, f, column, now)) throw new Error('That entry is locked or belongs to a future date.');
    }
    else if (previous.values[f.id] !== next.values[f.id] && !entryOpen(previous, f, undefined, now)) throw new Error('That entry is locked or belongs to a future date.');
  }
  return next;
}
