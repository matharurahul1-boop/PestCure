import { ensureExtraRoles, initialWorkspace, uid, type Review, type Workspace, trimEmployeeRows } from './model';
import { applyReferenceMigration } from './referenceMigration';
import { demoReviews } from './performance';
import { demoAttendance, DEFAULT_ATTENDANCE_POLICY } from './attendance';
import { todayIST } from './schedule';
import { averageScore } from './performance';
import { attendancePercent } from './attendance';
import { aggregateContributions, reviewAverage } from './achievementBreakdown';

export type SavedReport = {
 id: string; kind: 'performance' | 'attendance' | 'achievement'; title: string;
 source: string; createdAt: string; filters: Record<string, string>; payload: unknown;
};
export type SaveReport = (report: Omit<SavedReport, 'id' | 'createdAt'>) => void;
export function appendReport(state: Workspace, report: Omit<SavedReport, 'id' | 'createdAt'>): Workspace {
 return { ...state, savedReports: [{ ...structuredClone(report), id: uid(), createdAt: new Date().toISOString() }, ...(state.savedReports ?? [])] };
}
const wholeNumber = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && !Number.isInteger(v) ? Math.round(v) : v);
/**
 * Demo results were first generated with two decimals (e.g. 5.26 leads). Counts and amounts read as
 * whole numbers, so round any fractional demo result. Returns null when nothing needed changing.
 */
export function wholeNumberDemoReviews(reviews: Review[]): Review[] | null {
 let changed = false;
 const next = reviews.map(review => {
  let touched = false;
  const values = { ...review.values };
  for (const key of Object.keys(values)) { const n = wholeNumber(values[key]); if (n !== values[key]) { values[key] = n as number; touched = true; } }
  let tables = review.tables;
  if (tables) {
   const copy: NonNullable<Review['tables']> = {};
   for (const [fieldId, rows] of Object.entries(tables)) {
    copy[fieldId] = {};
    for (const [rowId, cells] of Object.entries(rows)) {
     copy[fieldId][rowId] = { ...cells };
     for (const [colId, cell] of Object.entries(cells)) { const n = wholeNumber(cell); if (n !== cell) { copy[fieldId][rowId][colId] = n as number; touched = true; } }
    }
   }
   if (touched) tables = copy;
  }
  if (!touched) return review;
  changed = true;
  return { ...review, values, tables };
 });
 return changed ? next : null;
}
/** Freeze demo source rows once. They remain separate from genuine/Excel records. */
export function withReportData(state: Workspace, anchor = todayIST()): Workspace {
 if (state.reportData) {
  const whole = wholeNumberDemoReviews(state.reportData.demoReviews);
  return whole ? { ...state, reportData: { ...state.reportData, demoReviews: whole } } : state;
 }
 return { ...state, reportData: { anchor, demoReviews: demoReviews(state, anchor), demoAttendance: demoAttendance(state.people, anchor) }, savedReports: state.savedReports ?? [], attendance: state.attendance ?? [], attendancePolicy: state.attendancePolicy ?? { ...DEFAULT_ATTENDANCE_POLICY } };
}
/**
 * A clean workspace: the 20 role templates only — no sample members, no
 * reference members, no reviews, no demo/report data. Used for brand-new
 * cloud accounts so they start empty and add their own users.
 */
export function templatesOnlyWorkspace(): Workspace {
 const state = trimEmployeeRows(ensureExtraRoles(applyReferenceMigration(initialWorkspace(false))));
 return {
  ...state,
  people: [],
  reviews: [],
  reviewRevisions: [],
  lateRequests: [],
  targetChangeRequests: [],
  attendance: [],
  savedReports: [],
  reportData: undefined,
  legacy: undefined,
  referenceBackup: undefined,
  activity: [{ id: uid(), text: 'Workspace ready · role templates loaded', at: new Date().toISOString() }],
 };
}
/** Uses only repository data, never another account's browser storage. */
export function createSeedWorkspace(anchor = todayIST()): Workspace {
 const state = ensureExtraRoles(applyReferenceMigration(initialWorkspace(false)));
 state.reviews = state.reviews.map(r => r.source ? r : { ...r, id: `seed-review-${r.memberId}-${r.periodKind ?? 'weekly'}-${r.week}` });
 const seeded = withReportData({ ...state, lateRequests: [], targetChangeRequests: [], reviewRevisions: [], attendance: [], savedReports: [] }, anchor);
 const demo = seeded.reportData!;
 const latestWeek = demo.demoReviews.map(r => r.week).sort().at(-1) ?? anchor;
 const createdAt = anchor + 'T00:00:00+05:30';
 seeded.savedReports = [
  { id: 'seed-performance-v1', kind: 'performance', title: 'Bundled performance overview', source: 'demo', createdAt, filters: { anchor }, payload: { average: averageScore(demo.demoReviews), people: seeded.people.map(person => { const reviews = demo.demoReviews.filter(r => r.memberId === person.id); return { person, average: averageScore(reviews), reviews: reviews.map(r => ({ id: r.id, week: r.week, score: reviewAverage([r]) })) }; }) } },
  { id: 'seed-attendance-v1', kind: 'attendance', title: 'Bundled attendance overview', source: 'demo', createdAt, filters: { anchor }, payload: { policy: seeded.attendancePolicy, score: attendancePercent(demo.demoAttendance, seeded.attendancePolicy), people: seeded.people.map(person => { const records = demo.demoAttendance.filter(r => r.memberId === person.id); return { person, count: records.length, score: attendancePercent(records, seeded.attendancePolicy) }; }) } },
  { id: 'seed-achievement-v1', kind: 'achievement', title: 'Bundled achievement breakdown', source: 'demo', createdAt, filters: { week: latestWeek }, payload: { people: seeded.people.map(person => { const reviews = demo.demoReviews.filter(r => r.memberId === person.id && r.week === latestWeek); return { person, overall: reviewAverage(reviews), tasks: aggregateContributions(reviews) }; }) } },
 ];
 return seeded;
}
/** Non-destructive starter-data import. Existing records and edited templates win. */
export function addStarterData(state: Workspace, seed = createSeedWorkspace()): Workspace {
 const merge = <T extends { id: string }>(current: T[], incoming: T[]) => [...current, ...incoming.filter(row => !current.some(saved => saved.id === row.id))];
 // Do not duplicate a person when their imported ID differs but email identifies them.
 const personMap = new Map(seed.people.map(p => [p.id, state.people.find(x => x.id === p.id || (p.email && x.email.toLowerCase() === p.email.toLowerCase()))?.id ?? p.id]));
 const incomingPeople = seed.people.filter(p => personMap.get(p.id) === p.id);
 const reviews = seed.reviews.map(r => ({ ...r, memberId: personMap.get(r.memberId)! }));
 const demo = seed.reportData!;
 return { ...state, roles: merge(state.roles, seed.roles), people: merge(state.people, incomingPeople), reviews: merge(state.reviews, reviews.filter(r => r.source || !state.reviews.some(existing => !existing.source && existing.memberId === r.memberId && existing.week === r.week && (existing.periodKind ?? 'weekly') === (r.periodKind ?? 'weekly')))),
  reportData: { anchor: state.reportData?.anchor ?? demo.anchor,
   demoReviews: merge(state.reportData?.demoReviews ?? [], demo.demoReviews.map(r => ({ ...r, memberId: personMap.get(r.memberId)! }))),
   demoAttendance: merge(state.reportData?.demoAttendance ?? [], demo.demoAttendance.map(r => ({ ...r, memberId: personMap.get(r.memberId)! }))) },
  attendance: merge(state.attendance ?? [], (seed.attendance ?? []).map(r => ({ ...r, memberId: personMap.get(r.memberId) ?? r.memberId }))), attendancePolicy: state.attendancePolicy ?? seed.attendancePolicy,
  savedReports: merge(state.savedReports ?? [], seed.savedReports ?? []), lateRequests: merge(state.lateRequests ?? [], seed.lateRequests ?? []), targetChangeRequests: merge(state.targetChangeRequests ?? [], seed.targetChangeRequests ?? []), reviewRevisions: merge(state.reviewRevisions ?? [], seed.reviewRevisions ?? []), activity: merge(state.activity, seed.activity), calendar: state.calendar ?? seed.calendar, engage: state.engage ?? seed.engage, zoho: state.zoho ?? seed.zoho, referenceBackup: state.referenceBackup ?? seed.referenceBackup,
  legacy: state.legacy ?? seed.legacy,
 };
}
