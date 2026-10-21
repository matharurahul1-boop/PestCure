import { ORG_SEED } from '../data/orgSeed';
import { createReview, type AppNotification, type Field, type Person, type Review, type Role, type Workspace } from './model';
import { cycleStart, dayColumn, fieldsForPeriod, missedEntries, plusDays, requestLateEntry, todayIST } from './schedule';
import { requestTargetChange } from './targetGovernance';
import { numeric } from './tableModel';

/** Demo people use this email domain, which is how they are found (and removed) again. */
export const DEMO_DOMAIN = '@demo.pestcure.test';
export const isDemoPerson = (p: Person) => p.email.toLowerCase().endsWith(DEMO_DOMAIN);

// seats from the org chart that already have a role template
const DEMO_SEATS = ['hod-sup', 'sup-central', 'sup-south', 'sup-north', 'sup-ggn', 'hod-sales', 'sales-retail', 'sales-renewal', 'hod-accounts', 'acc-cash', 'ops-routes', 'ops-software', 'ops-tech', 'proj-retail', 'proj-reticulation'];
// how each demo person is doing this week: 0 not started · 1 targets proposed · 2 working · 3 submitted · 4 sent back · 5 done
const WEEK_STATE = [2, 3, 2, 1, 2, 3, 5, 4, 3, 2, 0, 2, 3, 1, 2];
// overall delivery level per person, so scores spread across green / amber / red
const QUALITY = [1.08, 0.97, 0.84, 0.72, 1.02, 0.9, 1.1, 0.66, 0.93, 0.8, 0.58, 0.98, 0.88, 0.75, 1.04];

const NOTES = ['Followed up with 6 clients; 2 confirmed and 1 asked for a revised quote.', 'Payment received from 3 pending accounts, balance follow-up scheduled.', 'Site visit completed and quotation shared the same day.', 'Waiting for client confirmation, will call again on Thursday.', 'All routes covered; two re-service complaints were resolved at the site.', 'Renewal reminders sent; most clients asked to call back after the 10th.', 'Billing entries verified against the software, two corrections made.', 'Training session with the field team done; feedback was positive.'];
const REASONS = ['Client asked to postpone the service.', 'Technician availability was low this week.', 'Pending approval from the client side.', 'Quotation is under discussion.'];
const WINS = ['Closed a 1-year renewal contract for a large society.', 'Cleared the oldest pending payment of the month.', 'Brought two new referral leads from existing clients.', 'Resolved all open complaints before the deadline.'];
const BLOCKERS = ['Inquiry flow was slow in the first half of the week.', 'Two key clients were not reachable.', 'Route changes delayed the daily follow-ups.'];

function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length) % list.length];
const emailFor = (name: string) => name.toLowerCase().replace(/[^a-z ]/g, '').trim().split(/\s+/).join('.') + DEMO_DOMAIN;

type Mode = 'none' | 'partial' | 'full';
const teamOf = (seatId: string) => seatId.startsWith('sup') || seatId === 'hod-sup' ? 'Field supervisors' : seatId.startsWith('sales') || seatId === 'hod-sales' ? 'Sales' : seatId.startsWith('proj') ? 'Projects' : seatId.startsWith('acc') || seatId === 'hod-accounts' ? 'Accounts' : 'Operations';

/** Fill a review with believable results. `uptoDay` (0 = Sunday) limits daily columns for a week in progress. */
function fill(review: Review, ratio: number, r: () => number, week: string, mode: Mode, uptoDay: number, team = 'Operations') {
  if (mode === 'none') return;
  const jitter = () => 0.82 + r() * 0.36;
  const weekdayDone = (day: number) => mode === 'full' || ((day + 6) % 7) <= ((uptoDay + 6) % 7); // Monday-first order
  for (const f of review.fields as Field[]) {
    if (f.kra === 'Employee & attendance' && f.table) {
      for (const row of f.table.rows) {
        const v = review.tables![f.id][row.id]; const col = f.table.columns[0].id;
        v[col] = /team/i.test(row.label) ? team : /leave/i.test(row.label) ? (r() < 0.8 ? '0' : '1') : /late/i.test(row.label) ? String(r() < 0.65 ? 0 : 1 + Math.floor(r() * 2)) : /short|half/i.test(row.label) ? (r() < 0.85 ? '0' : '1') : '';
      }
      continue;
    }
    if (f.type === 'number') {
      const target = review.targets[f.id] > 0 ? review.targets[f.id] : f.target > 0 ? f.target : 10;
      review.targets[f.id] = target;
      review.values[f.id] = Math.max(0, Math.round(f.direction === 'lower' ? target / Math.max(ratio, .4) : target * ratio * jitter()));
    } else if (f.type === 'checkbox') review.values[f.id] = r() < 0.85;
    else if (!f.table) review.values[f.id] = pick(r, NOTES);
    else {
      const targetCol = f.table.columns.find(c => c.type === 'target');
      f.table.rows.forEach((row, rowIndex) => {
        const values = review.tables![f.id][row.id];
        if (targetCol && !(numeric(values[targetCol.id]) !== null && numeric(values[targetCol.id])! > 0)) values[targetCol.id] = 10 + rowIndex * 5;
        const target = targetCol ? Number(values[targetCol.id]) : 10;
        for (const col of f.table!.columns) {
          if (col.type === 'target' || col.type === 'computed') continue;
          if (col.type === 'daily') {
            const day = dayColumn(col);
            if (day === 0) values[col.id] = 'Off';                       // Sunday off
            else if (day > 0 && weekdayDone(day)) values[col.id] = Math.max(0, Math.round(target * ratio * jitter()));
          } else if (col.type === 'number') {
            const tied = f.table!.columns.some(c => c.formula === 'percent' && c.inputs?.includes(col.id));
            values[col.id] = tied ? Math.max(0, Math.round(target * ratio * jitter()))
              : /₹|amount|value|payment|pending/i.test(col.label + row.label) ? Math.round((4000 + r() * 56000) / 500) * 500 : Math.round(1 + r() * 14);
          } else if (col.type === 'status') values[col.id] = mode === 'partial' ? pick(r, ['In progress', 'Pending', 'Completed']) : r() < 0.78 ? 'Completed' : pick(r, ['In progress', 'Delayed']);
          else if (col.type === 'date') values[col.id] = plusDays(week, Math.floor(r() * 5));
          else values[col.id] = /reason|why|issue|stuck/i.test(col.label) ? pick(r, REASONS) : /name/i.test(row.label) ? '' : pick(r, NOTES);
        }
      });
    }
  }
}

/** Remove everything demo: people on the demo domain, their reviews, requests, notifications and activity. */
export function removeDemoData(state: Workspace): Workspace {
  const ids = new Set(state.people.filter(isDemoPerson).map(p => p.id));
  if (!ids.size) return state;
  return {
    ...state,
    people: state.people.filter(p => !ids.has(p.id)),
    reviews: state.reviews.filter(rv => !ids.has(rv.memberId)),
    targetChangeRequests: (state.targetChangeRequests ?? []).filter(q => !ids.has(q.memberId)),
    lateRequests: (state.lateRequests ?? []).filter(q => !ids.has(q.memberId)),
    notifications: (state.notifications ?? []).filter(n => !ids.has(n.memberId)),
    activity: state.activity.filter(a => !a.memberId || !ids.has(a.memberId)),
  };
}

/**
 * Add a realistic test team: 15 people from the org chart, each on their own role template, with four finished
 * weeks (approved, varied scores) and this week in every state — plus a few target-change and unlock requests.
 * Safe to run again: the previous demo people are replaced.
 */
export function applyDemoData(input: Workspace, now = new Date()): Workspace {
  let state = removeDemoData(input);
  const today = todayIST(now);
  const startDay = state.calendar?.startDay ?? 1;
  const current = cycleStart(today, startDay);
  const todayDow = new Date(today + 'T00:00:00Z').getUTCDay();
  const seats = DEMO_SEATS.map(id => ORG_SEED.find(s => s.id === id)).filter((s): s is NonNullable<typeof s> => Boolean(s?.roleSlug && state.roles.some(r => r.id === s.roleSlug)));
  const people: Person[] = [], reviews: Review[] = [], notifications: AppNotification[] = [];
  const stamp = (week: string, offsetDays: number) => new Date(`${plusDays(week, offsetDays)}T10:30:00+05:30`).toISOString();

  seats.forEach((seat, i) => {
    const role = state.roles.find(x => x.id === seat.roleSlug) as Role;
    const person: Person = { id: `demo-${seat.id}`, name: seat.plannedName!, email: emailFor(seat.plannedName!), roleId: role.id };
    people.push(person);
    const quality = QUALITY[i % QUALITY.length];
    const build = (week: string, k: number) => {
      const shaped = state.calendar ? { ...person, fields: fieldsForPeriod(role.fields, 'weekly') } : person;
      const rv = createReview(shaped, role, week);
      rv.id = `demo-${seat.id}-${week}`; rv.roleName = role.name; rv.periodKind = 'weekly'; rv.periodEnd = plusDays(week, 7);
      return { rv, r: rng(1000 + i * 97 + k * 13) };
    };
    // four finished weeks
    for (let k = 4; k >= 1; k--) {
      const week = plusDays(current, -7 * k);
      const { rv, r } = build(week, k);
      fill(rv, Math.min(1.15, quality * (0.9 + r() * 0.2)), r, week, 'full', 6, seat.group || teamOf(seat.id));
      Object.assign(rv, { targetStatus: 'approved', status: 'approved', highlights: pick(r, WINS), blockers: r() < 0.5 ? pick(r, BLOCKERS) : '', updatedAt: stamp(week, 6) });
      reviews.push(rv);
    }
    notifications.push({ id: `demo-n-${seat.id}-last`, memberId: person.id, kind: 'review-approved', text: 'Your report for last week was approved.', at: stamp(plusDays(current, -7), 7), reviewId: `demo-${seat.id}-${plusDays(current, -7)}` });
    // this week, in whatever state this person is in
    const { rv, r } = build(current, 0);
    const state_ = WEEK_STATE[i % WEEK_STATE.length];
    const ratio = Math.min(1.12, quality * (0.9 + r() * 0.2));
    const team = seat.group || teamOf(seat.id);
    if (state_ === 0) Object.assign(rv, { targetStatus: 'draft', status: 'draft' });
    else if (state_ === 1) { fill(rv, ratio, r, current, 'none', todayDow, team); Object.assign(rv, { targetStatus: 'pending', status: 'draft' }); }
    else if (state_ === 2) { fill(rv, ratio, r, current, 'partial', todayDow, team); Object.assign(rv, { targetStatus: 'approved', status: 'draft' }); }
    else if (state_ === 3) { fill(rv, ratio, r, current, 'full', 6, team); Object.assign(rv, { targetStatus: 'approved', status: 'submitted', highlights: pick(r, WINS) }); }
    else if (state_ === 4) { fill(rv, ratio, r, current, 'full', 6, team); Object.assign(rv, { targetStatus: 'approved', status: 'changes', feedback: 'Please recheck the pending-payment figures and add a remark on the delayed items.' }); notifications.push({ id: `demo-n-${seat.id}-ret`, memberId: person.id, kind: 'review-returned', text: 'Your report was sent back with a comment.', at: stamp(current, 0), reviewId: rv.id }); }
    else { fill(rv, ratio, r, current, 'full', 6, team); Object.assign(rv, { targetStatus: 'approved', status: 'approved', highlights: pick(r, WINS) }); }
    if (state_ >= 2) notifications.push({ id: `demo-n-${seat.id}-tgt`, memberId: person.id, kind: 'targets-approved', text: 'Your targets for this week were approved.', at: stamp(current, 0), reviewId: rv.id });
    rv.updatedAt = new Date(now.getTime() - (i + 1) * 3600_000).toISOString();
    reviews.push(rv);
  });

  state = { ...state, people: [...state.people, ...people], reviews: [...state.reviews, ...reviews], notifications: [...(state.notifications ?? []), ...notifications] };

  // two target-change requests from people whose targets are approved and who are still working
  let requested = 0;
  for (const p of people) {
    const rv = state.reviews.find(x => x.memberId === p.id && x.week === current);
    if (requested >= 2 || !rv || rv.targetStatus !== 'approved' || rv.status !== 'draft') continue;
    try { state = requestTargetChange(state, rv.id, p.id, requested ? 'A key client postponed, so this week\'s renewal target needs to come down.' : 'Two technicians are on leave, so I need to lower the service target for this week.', now); requested++; } catch { /* not eligible */ }
  }
  // a couple of missed entries asked to be unlocked, when the calendar is running
  if (state.calendar) {
    let asked = 0;
    for (const m of missedEntries(state, now)) {
      if (asked >= 3 || !people.some(p => p.id === m.memberId)) continue;
      try { state = requestLateEntry(state, { reviewId: m.reviewId, fieldId: m.fieldId, rowId: m.rowId, columnId: m.columnId }, m.memberId, asked % 2 ? 'I was on a site visit and could not update it that day.' : 'The network was down at the client site.', now); asked++; } catch { /* already asked */ }
    }
  }
  return state;
}
