import { frozen, periodEnded, fieldsForPeriod } from './schedule';
import rawReferences from '../data/referenceForms.json';
import type { Field, Person, Review, Role, Workspace } from './model';
import { initialTableValues } from './tableModel';
export const REFERENCES = rawReferences as unknown as Array<{ prefix: string; name: string; roleId: string; roleName: string; file: string; fields: Field[]; history: Array<Pick<Review, 'id' | 'week' | 'originalPeriod' | 'fields' | 'tables' | 'source'>> }>;
export function applyReferenceMigration(state: Workspace): Workspace {
  if ((state.referenceVersion ?? 0) >= 2) return state;
  const next = structuredClone(state);
  next.referenceBackup ??= { roles: structuredClone(state.roles), people: structuredClone(state.people), reviews: structuredClone(state.reviews) };
  for (const reference of REFERENCES) {
    let person = next.people.find(p => p.name.toLowerCase().startsWith(reference.prefix));
    if (!person) { person = { id: `reference-member-${reference.prefix}`, name: reference.name, email: '', roleId: reference.roleId }; next.people.push(person); }
    person.roleId = reference.roleId;
    person.fields = undefined;
    const role: Role = { id: reference.roleId, name: reference.roleName, department: reference.roleName, description: `Based on ${reference.name.split(' ')[0]}’s uploaded review sheet. Daily activity, weekly KRAs, targets and supporting records.`, fields: structuredClone(reference.fields) };
    const roleIndex = next.roles.findIndex(r => r.id === role.id);
    if (roleIndex >= 0) next.roles[roleIndex] = role; else next.roles.push(role);
    // Preserve all prior records. Only empty draft forms are upgraded automatically.
    next.reviews = next.reviews.map(r => { const emptyWorkspaceForm=r.memberId===person!.id&&!r.source&&r.status==='draft'&&r.targetStatus==='draft'&&!Object.keys(r.values).length&&!r.highlights&&!r.blockers;if(!emptyWorkspaceForm)return r;const fields=fieldsForPeriod(role.fields,r.periodKind??'weekly');return{...r,roleName:role.name,fields:structuredClone(fields),targets:Object.fromEntries(fields.filter(f=>f.type==='number').map(f=>[f.id,f.target])),tables:Object.fromEntries(fields.filter(f=>f.table).map(f=>[f.id,initialTableValues(f.table!)]))};});
    for (const source of reference.history) {
      if (next.reviews.some(r => r.id === source.id)) continue;
      next.reviews.push({ ...structuredClone(source), memberId: person.id, roleName: role.name, targets: {}, values: {}, targetStatus: 'draft', status: 'draft', highlights: '', blockers: '', feedback: '', updatedAt: new Date().toISOString() });
    }
  }
  next.referenceVersion = 2;
  next.activity.unshift({ id: 'reference-import-v1', text: 'Imported 3 Excel formats and 13 source reviews. Original records retained in backup.', at: new Date().toISOString() });
  return next;
}
export function reviseForm(review: Review, fields: Field[]): Review {
  if (frozen(review)) throw new Error('Past periods are frozen.');
  const retainedValues = Object.fromEntries(fields.filter(f => f.type !== 'table').flatMap(f => review.values[f.id] === undefined ? [] : [[f.id, review.values[f.id]]]));
  const tables = Object.fromEntries(fields.filter(f => f.type === 'table' && f.table).map(f => [f.id, Object.fromEntries(f.table!.rows.map(row => [row.id, Object.fromEntries(f.table!.columns.filter(c => c.type !== 'computed').flatMap(c => { const value = review.tables?.[f.id]?.[row.id]?.[c.id] ?? row.defaults[c.id]; return value === undefined ? [] : [[c.id, value]]; }))]))]));
  return { ...review, fields: structuredClone(fields), values: retainedValues, tables, targets: Object.fromEntries(fields.filter(f => f.type === 'number').map(f => [f.id, review.targets[f.id] ?? f.target])), targetStatus: 'draft', status: 'draft', feedback: 'Form updated by admin. Review the targets and submit them for approval again.', updatedAt: new Date().toISOString() };
}
export function applyTemplateToOpenReviews(state: Workspace, people: Person[], fields: Field[]): Workspace {
  return { ...state, reviewRevisions: [...(state.reviewRevisions ?? []), ...state.reviews.filter(r => people.some(p => p.id === r.memberId) && r.status !== "approved" && !periodEnded(r)).map(r => structuredClone(r))], reviews: state.reviews.map(r => people.some(p => p.id === r.memberId) && r.status !== 'approved' && !periodEnded(r) ? reviseForm(r, state.calendar ? fieldsForPeriod(fields, r.periodKind ?? 'weekly') : fields) : r) };
}

