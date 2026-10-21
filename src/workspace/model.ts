import { frozen } from './schedule';
import { INITIAL_MEMBERS } from '../data/initialData';
import { INITIAL_ROLE_TEMPLATES } from '../data/initialRoleTemplates';
import { EXTRA_ROLE_TEMPLATES } from '../data/extraRoleTemplates';
import type { MemberProfile, RoleTemplate } from '../types';
import { initialTableValues, tableScores, numeric, type TableDefinition, type TableValues } from './tableModel';
import { applyReferenceMigration } from './referenceMigration';
import type { ReviewCalendar, LateRequest } from './schedule';
import type { AttendancePolicy, AttendanceRecord, EngageConfig } from './attendance';
import type { TargetChangeRequest, TargetSnapshot, TargetDelta } from './targetGovernance';
import type { ZohoConfig } from './zoho';
import { DEFAULT_GRADE_BANDS, type GradeBand } from './gradeBands';

export type Field = { id: string; kra: string; label: string; cadence?: 'weekly' | 'daily' | 'monthly'; type: 'number' | 'text' | 'checkbox' | 'table'; unit: string; target: number; owner: 'admin' | 'member'; direction: 'higher' | 'lower'; required: boolean; table?: TableDefinition };
export type Role = { id: string; name: string; department: string; description: string; fields: Field[] };
export function kpiCount(fields: Field[]) { return fields.reduce((count, field) => count + (field.type === 'number' ? 1 : field.table ? field.table.rows.filter(row => row.scored !== false).length * field.table.columns.filter(column => column.formula === 'percent').length : 0), 0); }
export type Person = { id: string; name: string; email: string; roleId: string; fields?: Field[]; avatarUrl?: string; inactive?: boolean; inactiveSince?: string; roleSince?: string; nextRole?: { roleId: string; from: string }; roleHistory?: Array<{ roleId: string; roleName: string; from?: string; to: string }> };
export type Review = { demo?: boolean; periodKind?: 'weekly' | 'daily' | 'monthly'; periodEnd?: string; trackingFrom?: string; id: string; memberId: string; week: string; roleName?: string; originalPeriod?: string; source?: { file: string; sheet: string; notes?: string[] }; tables?: Record<string, TableValues>; fields: Field[]; targets: Record<string, number>; values: Record<string, number | string | boolean>; targetStatus: 'draft' | 'pending' | 'approved' | 'changes'; status: 'draft' | 'submitted' | 'approved' | 'changes'; feedback: string; highlights: string; blockers: string; updatedAt: string; proposedTargets?: TargetSnapshot; targetNote?: string; targetAdjustments?: TargetDelta[]; comments?: ReviewComment[] };
/** A short note on one KPI or table row of a review. `key` is the field id, or `fieldId:rowId` for a table row. */
export type ReviewComment = { id: string; key: string; label: string; authorId: string; author: string; role: 'admin' | 'member'; text: string; at: string };
export type AppNotification = { id: string; memberId: string; kind: 'targets-approved' | 'targets-adjusted' | 'targets-returned' | 'review-approved' | 'review-returned' | 'comment'; text: string; at: string; reviewId?: string };
export type PerformanceColors={good:string;watch:string;support:string;neutral:string};
export const DEFAULT_PERFORMANCE_COLORS:PerformanceColors={good:'#359878',watch:'#cb8a27',support:'#d36560',neutral:'#aeb5bf'};
export type Workspace = { sampleTargetsSeeded?: boolean; reportData?: { anchor: string; demoReviews: Review[]; demoAttendance: AttendanceRecord[] }; savedReports?: import('./reportData').SavedReport[]; navCollapsed?: boolean; targetChangeRequests?: TargetChangeRequest[]; calendar?: ReviewCalendar; lateRequests?: LateRequest[]; attendance?: AttendanceRecord[]; attendancePolicy?: AttendancePolicy; engage?: EngageConfig; zoho?: ZohoConfig; gradeBands?: GradeBand[]; notifications?: AppNotification[]; version: 1; roles: Role[]; people: Person[]; reviews: Review[]; activity: { id: string; text: string; at: string; memberId?: string }[]; theme: 'light' | 'dark' | 'system'; thresholds: { good: number; watch: number; colors?:PerformanceColors }; legacy?: unknown; referenceVersion?: number; reviewRevisions?: Review[]; referenceBackup?: { roles: Role[]; people: Person[]; reviews: Review[] } };
/** Role names read as Title Case; acronyms (CRM, BD, OV) and small words are kept sensible. */
const SMALL_WORDS = new Set(['and', 'of', 'the', 'for', 'in', 'to', 'a', 'an']);
export function titleCaseRole(name: string) {
  return name.trim().split(' ').filter(Boolean).map((word, i) => {
    if (/^[A-Z0-9&]{2,}$/.test(word) || /^[&—–-]+$/.test(word)) return word;
    const lower = word.toLowerCase();
    return i > 0 && SMALL_WORDS.has(lower) ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}
// The review header already shows the person, their role and the period, so the attendance table does not repeat them.
const REPEATED_HEADER_ROWS = /^(name|role|review date)$/i;
const trimHeaderRows = (fields: Field[]): { fields: Field[]; removed: Record<string, string[]> } => {
  const removed: Record<string, string[]> = {};
  const next = fields.map(f => {
    if (f.kra !== 'Employee & attendance' || !f.table) return f;
    const drop = f.table.rows.filter(r => REPEATED_HEADER_ROWS.test(r.label.trim())).map(r => r.id);
    if (!drop.length) return f;
    removed[f.id] = drop;
    return { ...f, table: { ...f.table, rows: f.table.rows.filter(r => !drop.includes(r.id)) } };
  });
  return { fields: Object.keys(removed).length ? next : fields, removed };
};
/** Drop the Name / Role / Review date rows from every attendance table (templates, personal forms and reviews). Idempotent. */
export function trimEmployeeRows(state: Workspace): Workspace {
  let changed = false;
  const roles = state.roles.map(r => { const t = trimHeaderRows(r.fields); if (t.fields === r.fields) return r; changed = true; return { ...r, fields: t.fields }; });
  const people = state.people.map(p => { if (!p.fields) return p; const t = trimHeaderRows(p.fields); if (t.fields === p.fields) return p; changed = true; return { ...p, fields: t.fields }; });
  const reviews = state.reviews.map(rv => {
    const t = trimHeaderRows(rv.fields);
    if (t.fields === rv.fields) return rv;
    changed = true;
    const tables = rv.tables ? Object.fromEntries(Object.entries(rv.tables).map(([fid, rows]) => [fid, t.removed[fid] ? Object.fromEntries(Object.entries(rows).filter(([rid]) => !t.removed[fid].includes(rid))) : rows])) : rv.tables;
    return { ...rv, fields: t.fields, tables };
  });
  return changed ? { ...state, roles, people, reviews } : state;
}
export function normalizeRoleNames(state: Workspace): Workspace {
  return state.roles.every(r => titleCaseRole(r.name) === r.name) ? state : { ...state, roles: state.roles.map(r => ({ ...r, name: titleCaseRole(r.name) })) };
}
const SAMPLE_AVATARS: Record<string, string> = { alka: '/avatars/alka.svg', kajal: '/avatars/kajal.svg', deepika: '/avatars/deepika.svg' };
/** Gives the bundled sample members a profile picture the first time (never overwrites one an admin set). */
export function applySampleAvatars(state: Workspace): Workspace {
  const needs = state.people.some(p => !p.avatarUrl && SAMPLE_AVATARS[p.name.split(' ')[0].toLowerCase()]);
  return needs ? { ...state, people: state.people.map(p => (p.avatarUrl ? p : { ...p, avatarUrl: SAMPLE_AVATARS[p.name.split(' ')[0].toLowerCase()] ?? p.avatarUrl })) } : state;
}
/** One-time demo seed: approve targets on this week's blank reviews (one stays pending, one stays open) so the forms can be filled straight away. */
export function applySampleTargets(state: Workspace, today = new Date()): Workspace {
  if (state.sampleTargetsSeeded || !state.people.length) return state;
  const week = weekStart(today);
  let n = 0;
  const reviews = state.reviews.map(r => {
    if (r.week !== week || (r.periodKind ?? 'weekly') !== 'weekly' || r.targetStatus !== 'draft' || r.source) return r;
    const i = n++;
    if (i === 0) return r;
    return { ...r, targetStatus: i === 1 ? 'pending' as const : 'approved' as const };
  });
  return { ...state, reviews, sampleTargetsSeeded: true };
}
export const STORAGE_KEY = 'pestcure_workspace_v1';
export const uid = () => crypto.randomUUID();
export const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function weekStart(date = new Date()) { const d = new Date(date); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return localDate(d); }
export function shiftWeek(week: string, n: number) { const d = new Date(week + 'T12:00:00'); d.setDate(d.getDate() + n * 7); return localDate(d); }
export function weekLabel(week: string) { const start = new Date(week + 'T12:00:00'); const end = new Date(start); end.setDate(end.getDate() + 6); return `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`; }
export const newField = (): Field => ({ id: uid(), kra: 'Performance', label: '', type: 'number', unit: 'count', target: 1, owner: 'member', direction: 'higher', required: true });
export function createReview(person: Person, role: Role, week: string): Review { const fields = structuredClone(person.fields ?? role.fields); return { id: uid(), memberId: person.id, week, roleName: role.name, fields, targets: Object.fromEntries(fields.filter(f => f.type === 'number').map(f => [f.id, f.target])), values: {}, tables: Object.fromEntries(fields.filter(f => f.type === 'table' && f.table).map(f => [f.id, initialTableValues(f.table!)])), targetStatus: 'draft', status: 'draft', feedback: '', highlights: '', blockers: '', updatedAt: new Date().toISOString() }; }
export function achievement(review: Review, field: Field): number | null {
  if (review.targetStatus !== 'approved' || field.type !== 'number' || typeof review.values[field.id] !== 'number') return null;
  const actual = Number(review.values[field.id]); const target = review.targets[field.id];
  if (!Number.isFinite(target) || target <= 0) return null;
  return field.direction === 'lower' ? (actual === 0 ? 100 : Math.min(100, target / actual * 100)) : actual / target * 100;
}
export function score(review: Review): number | null {
  if (review.targetStatus !== 'approved') return null;
  const fields = review.fields.filter(f => f.type === 'number' && review.targets[f.id] > 0);
  const contributions = [...fields.map(f => Math.min(100, achievement(review, f) ?? 0)), ...review.fields.filter(f => f.type === 'table' && f.table).flatMap(f => tableScores(f.table!, review.tables?.[f.id]))];
  return contributions.length ? Math.round(contributions.reduce((a, b) => a + b, 0) / contributions.length) : null;
}
export function completion(review: Review) {
  const responses: boolean[] = [];
  review.fields.forEach(f => { if (f.type === 'table' && f.table) f.table.rows.forEach(row => f.table!.columns.filter(c => !['computed', 'target'].includes(c.type) && row.defaults[c.id] === undefined).forEach(c => responses.push(hasValue(review.tables?.[f.id]?.[row.id]?.[c.id])))); else if (f.required) responses.push(hasValue(review.values[f.id])); });
  return responses.length ? Math.round(responses.filter(Boolean).length / responses.length * 100) : 100;
}
function requiredComplete(review: Review) { return review.fields.filter(f => f.required).every(f => f.type === 'table' ? f.table!.rows.every(row => f.table!.columns.filter(c => !['computed', 'target'].includes(c.type)).every(c => hasValue(review.tables?.[f.id]?.[row.id]?.[c.id]))) : hasValue(review.values[f.id])); }
function validTableResults(review: Review) { return review.fields.filter(f => f.table).every(f => f.table!.rows.every(row => f.table!.columns.filter(c => c.type === 'number').every(c => { const v = review.tables?.[f.id]?.[row.id]?.[c.id]; return !hasValue(v) || (numeric(v) !== null && numeric(v)! >= 0); }))); }
function hasValue(v: unknown) { return v !== undefined && v !== null && !(typeof v === 'string' && !v.trim()); }
export function transition(review: Review, action: 'propose' | 'approve-targets' | 'return-targets' | 'submit' | 'approve-review' | 'return-review', actor: 'admin' | 'member', feedback = ''): Review {
  const decision = ['approve-targets', 'return-targets', 'approve-review', 'return-review'].includes(action);
  if (!decision && frozen(review)) throw new Error('This period is locked. Submitted and past periods cannot be edited.');
  const next = { ...review, updatedAt: new Date().toISOString() };
  const badTargetLabels = review.fields.filter(f => f.type === 'number' && !(Number.isFinite(review.targets[f.id]) && review.targets[f.id] > 0)).map(f => f.label || 'Untitled KPI');
  const badTableTargets = review.fields.filter(f => f.type === 'table' && f.table).flatMap(f => f.table!.rows.filter(row => row.scored !== false && f.table!.columns.some(c => c.type === 'target' && (numeric(review.tables?.[f.id]?.[row.id]?.[c.id] ?? row.defaults[c.id]) ?? -1) < 0)).map(row => `${f.label} · ${row.label}`));
  const positiveTargets = badTargetLabels.length === 0 && badTableTargets.length === 0;
  if (action === 'propose') { if (!['draft', 'changes'].includes(review.targetStatus) || !positiveTargets) throw new Error([...badTargetLabels, ...badTableTargets].length ? `Enter a positive target for: ${[...badTargetLabels, ...badTableTargets].join(', ')}` : 'Enter a positive target for every numeric KPI.'); next.targetStatus = 'pending'; next.feedback = ''; }
  if (action === 'approve-targets') { if (actor !== 'admin' || review.targetStatus !== 'pending' || !positiveTargets) throw new Error('Only an admin can approve submitted targets.'); next.targetStatus = 'approved'; next.feedback = ''; }
  if (action === 'return-targets') { if (actor !== 'admin' || review.targetStatus !== 'pending' || !feedback.trim()) throw new Error('Add feedback before returning the targets.'); next.targetStatus = 'changes'; next.feedback = feedback.trim(); }
  if (action === 'submit') { if (review.targetStatus !== 'approved' || !['draft', 'changes'].includes(review.status) || !requiredComplete(review) || !validTableResults(review) || review.fields.some(f => f.type === 'number' && hasValue(review.values[f.id]) && (typeof review.values[f.id] !== 'number' || !Number.isFinite(review.values[f.id]) || Number(review.values[f.id]) < 0))) throw new Error('Complete required responses and correct non-numeric amounts before submitting.'); next.status = 'submitted'; next.feedback = ''; }
  if (action === 'approve-review') { if (actor !== 'admin' || review.status !== 'submitted' || review.targetStatus !== 'approved') throw new Error('Only submitted reviews can be approved by an admin.'); next.status = 'approved'; next.feedback = ''; }
  if (action === 'return-review') { if (actor !== 'admin' || review.status !== 'submitted' || !feedback.trim()) throw new Error('Add feedback before returning the review.'); next.status = 'changes'; next.feedback = feedback.trim(); }
  return next;
}
function convertRoles(templates: RoleTemplate[]): Role[] { return templates.map(t => ({ id: t.id, name: t.sheetType === 'customer_care' ? 'Customer Care' : t.sheetType === 'tender_operations' ? 'Tender Operations' : t.sheetType === 'commercial_bd' ? 'Business Development' : t.isCustom ? t.roleName : 'Field Operations', department: t.department, description: t.description ?? '', fields: [
  ...(t.dailyTasks ?? []).map((f, i): Field => ({ id: `${t.id}-daily-${i}`, kra: 'Activity & delivery', label: f.taskName, type: 'number', unit: 'per week', target: f.targetPerDay * 6, owner: 'member', direction: 'higher', required: true })),
  ...(t.weeklyTasks ?? []).map((f, i): Field => ({ id: `${t.id}-task-${i}`, kra: 'Key responsibilities', label: f.task, type: 'checkbox', unit: '', target: 1, owner: 'member', direction: 'higher', required: true })),
  { id: `${t.id}-revenue`, kra: 'Business outcomes', label: 'New business revenue', type: 'number', unit: 'INR', target: t.defaultWeeklyTargetOp || 100000, owner: 'admin', direction: 'higher', required: true },
  { id: `${t.id}-notes`, kra: 'Reflection', label: 'What could improve next week?', type: 'text', unit: '', target: 1, owner: 'member', direction: 'higher', required: false }
] })); }
export function initialWorkspace(readBrowser = true): Workspace {
  let members: MemberProfile[] = INITIAL_MEMBERS; let templates = INITIAL_ROLE_TEMPLATES; let legacy: unknown;
  try { if (!readBrowser) throw new Error('Use bundled data'); const saved = localStorage.getItem('pestcure_review_members_v2'); if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed) && parsed.length && parsed.every(m => m.id && Array.isArray(m.sheets))) { members = parsed; legacy = parsed; } } const oldTemplates = localStorage.getItem('pestcure_role_templates_v2'); if (oldTemplates) { const parsed = JSON.parse(oldTemplates); if (Array.isArray(parsed) && parsed.length && parsed.every(t => t.id && t.roleName)) templates = parsed; } } catch { /* Original storage is left untouched. */ }
  const roles = convertRoles(templates);
  const people = members.map(m => ({ id: m.id, name: m.name, email: m.email, roleId: templates.find(t => t.roleName === m.role)?.id ?? templates.find(t => t.sheetType === m.sheetType)?.id ?? roles[0].id }));
  const reviews: Review[] = [];
  people.forEach(person => {
    const role = roles.find(r => r.id === person.roleId)!;
    const source = members.find(m => m.id === person.id)!;
    source.sheets.forEach(sheet => {
      const review = createReview(person, role, weekStart(new Date(sheet.attendance.periodStart + 'T12:00:00')));
      if (reviews.some(r => r.memberId === person.id && r.week === review.week)) return;
      review.targetStatus = sheet.targetApprovalStatus === 'approved' ? 'approved' : 'draft';
      review.status = sheet.status === 'locked' ? 'approved' : sheet.status;
      review.roleName = sheet.attendance.role || source.role;
      review.originalPeriod = `${sheet.attendance.periodStart} – ${sheet.attendance.periodEnd}`;
      review.fields = []; review.targets = {}; review.values = {};
      const add = (label: string, kra: string, type: Field['type'], target: number, value: number | string | boolean, unit = 'per week') => { const field = { ...newField(), label, kra, type, target, unit }; review.fields.push(field); if (type === 'number') review.targets[field.id] = target; review.values[field.id] = value; };
      const daily = [...(sheet.sheetType === 'customer_care' || sheet.sheetType === 'general_operations' ? sheet.dailyTasks.callingAndQuotes : []), ...(sheet.dailyTenderOperations ?? []), ...(sheet.dailySalesTenderTasks ?? []), ...(sheet.dailyCommercialTasks ?? [])];
      daily.forEach(metric => add('taskName' in metric ? metric.taskName : metric.task, 'Activity & delivery', 'number', metric.targetPerDay * 6, Object.values(metric.days).reduce((sum, n) => sum + Number(n || 0), 0)));
      sheet.weeklyTasks.forEach(task => add(task.task, 'Key responsibilities', 'checkbox', 1, task.status === 'Completed', ''));
      (sheet.commercialWeeklyTasks ?? []).forEach(task => add(task.task, 'Weekly outcomes', 'number', task.target, task.actual));
      (sheet.tenderPipeline ?? []).forEach(metric => add(metric.metric, 'Tender pipeline', 'number', metric.target, metric.actual));
      add('New business revenue', 'Business outcomes', 'number', sheet.targets.weeklyTargetOp, sheet.targets.weeklyAchievedOp, 'INR');
      add('Service renewal revenue', 'Business outcomes', 'number', sheet.targets.weeklyTargetSr, sheet.targets.weeklyAchievedSr, 'INR');
      review.highlights = sheet.achievements.map(a => a.text).filter(Boolean).join('\n'); review.blockers = sheet.stuckPoints.map(s => s.stuckPoint).filter(Boolean).join('\n'); reviews.push(review);
    });
    if (!reviews.some(r => r.memberId === person.id && r.week === weekStart())) reviews.push(createReview(person, role, weekStart()));
  });
  return { version: 1, roles, people, reviews, activity: [{ id: uid(), text: legacy ? 'Existing members and reviews imported' : 'Workspace ready · 3 sample members included', at: new Date().toISOString() }], theme: 'light', thresholds: { good: 80, watch: 50, colors:DEFAULT_PERFORMANCE_COLORS }, legacy: legacy ?? members };
}
/** Adds the workbook-derived role templates (Barkha, Sahil) if they are not already present. Idempotent; user edits to an existing role are kept. */
export function ensureExtraRoles(state: Workspace): Workspace {
  const missing = EXTRA_ROLE_TEMPLATES.filter(role => !state.roles.some(r => r.id === role.id));
  return missing.length ? { ...state, roles: [...state.roles, ...missing.map(r => structuredClone(r))] } : state;
}
/** Seeds default achievement grade bands the first time; preserves any admin-edited set afterwards. */
function ensureGradeBands(state: Workspace): Workspace { return state.gradeBands?.length ? state : { ...state, gradeBands: structuredClone(DEFAULT_GRADE_BANDS) }; }
export function loadWorkspace(): Workspace { const saved = localStorage.getItem(STORAGE_KEY); if (!saved) return ensureGradeBands(ensureExtraRoles(applyReferenceMigration(initialWorkspace()))); const state = JSON.parse(saved); if (state.version !== 1 || !Array.isArray(state.roles) || !Array.isArray(state.people) || !Array.isArray(state.reviews) || !state.thresholds) throw new Error('Saved workspace could not be read. Export your browser data before resetting it.'); state.thresholds.colors={...DEFAULT_PERFORMANCE_COLORS,...state.thresholds.colors}; return ensureGradeBands(ensureExtraRoles(applyReferenceMigration(state))); }


