import type { Workspace } from './model';

/** Reduce an admin workspace to just what one member may see. Shared by the cloud client and the local server. */
export function filterForMember(ws: Workspace, personId: string): Workspace {
  const person = ws.people.find(p => p.id === personId);
  const roleIds = new Set(person ? [person.roleId] : []);
  return {
    ...ws,
    people: person ? [person] : [],
    roles: ws.roles.filter(r => roleIds.has(r.id)),
    reviews: ws.reviews.filter(r => r.memberId === personId),
    reviewRevisions: [],
    activity: (ws.activity ?? []).filter(a => a.memberId === personId).slice(0, 50),
    lateRequests: (ws.lateRequests ?? []).filter(r => r.memberId === personId),
    targetChangeRequests: (ws.targetChangeRequests ?? []).filter(r => r.memberId === personId),
    notifications: (ws.notifications ?? []).filter(n => n.memberId === personId).slice(0, 50),
    reportData: undefined,
    savedReports: [],
    legacy: undefined,
    referenceBackup: undefined,
  };
}
