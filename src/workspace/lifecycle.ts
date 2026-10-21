import type { Person, Review, Role, Workspace } from './model';
import { initialTableValues } from './tableModel';
import { cycleStart, plusDays, switchRole } from './schedule';

/** A review nobody has started: no values, tables still at their defaults, no notes, never submitted. */
export const untouched = (r: Review) =>
  !r.source && r.status === 'draft' && r.targetStatus === 'draft' && !Object.keys(r.values ?? {}).length
  && r.fields.every(f => !f.table || JSON.stringify(r.tables?.[f.id] ?? {}) === JSON.stringify(initialTableValues(f.table)))
  && !r.highlights && !r.blockers;

/**
 * Move a person to another role template without losing anything.
 *  - Mid-week: this week's report stays on the old role (same form, same scoring). The new role starts from the
 *    next week of the review cycle (stored as nextRole and applied by the calendar when that day arrives).
 *  - A person with no report this week simply switches now.
 * Past reports always keep the role they were written on, and the old role is kept in roleHistory.
 */
export function changeRole(d: Workspace, personId: string, next: Role, today: string, startDay = 1): Workspace {
  const person = d.people.find(p => p.id === personId);
  if (!person) return d;
  if (person.roleId === next.id) return person.nextRole ? { ...d, people: d.people.map(p => p.id === personId ? { ...p, nextRole: undefined } : p) } : d;
  const thisWeek = cycleStart(today, startDay);
  const hasThisWeek = d.reviews.some(r => r.memberId === personId && !r.source && (r.periodKind ?? 'weekly') === 'weekly' && r.week === thisWeek);
  if (!hasThisWeek) return switchRole(d, personId, next.id, today);
  return { ...d, people: d.people.map(p => p.id === personId ? { ...p, nextRole: { roleId: next.id, from: plusDays(thisWeek, 7) } } : p) };
}

/** Deactivate keeps every report; it only stops new ones and clears reports nobody started. Reactivate undoes the flag. */
export function setPersonActive(d: Workspace, personId: string, active: boolean, today: string): Workspace {
  if (!d.people.some(p => p.id === personId)) return d;
  const people = d.people.map(p => p.id === personId ? (active ? { ...p, inactive: undefined, inactiveSince: undefined } : { ...p, inactive: true, inactiveSince: today }) : p);
  const reviews = active ? d.reviews : d.reviews.filter(r => !(r.memberId === personId && untouched(r) && (r.periodEnd ?? r.week) >= today));
  return { ...d, people, reviews };
}
