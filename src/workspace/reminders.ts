import type { Review, Workspace } from './model';
import { weekLabel } from './model';
import { endOfReview, lateFillable, periodEnded, plusDays, todayIST } from './schedule';

export type Reminder = { id: string; tone: 'urgent' | 'warn' | 'info'; text: string; reviewId?: string; view?: 'Approvals' | 'Missed entries' | 'Weekly reviews' };

const daysLeft = (r: Review, now: Date) => {
  const end = plusDays(endOfReview(r), -1); // the last day the period is still open
  return Math.round((Date.parse(end + 'T00:00:00Z') - Date.parse(todayIST(now) + 'T00:00:00Z')) / 86400000);
};
const inDays = (n: number) => (n <= 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`);

/** What needs attention right now. Derived from the data on every render, so nothing can go stale. */
export function buildReminders(data: Workspace, personId: string | null, admin: boolean, now = new Date()): Reminder[] {
  const out: Reminder[] = [];
  if (admin) {
    const targets = data.reviews.filter(r => !r.source && r.targetStatus === 'pending');
    const results = data.reviews.filter(r => !r.source && r.status === 'submitted');
    const changeRequests = (data.targetChangeRequests ?? []).filter(r => r.status === 'requested' || r.status === 'submitted');
    const lateRequests = (data.lateRequests ?? []).filter(r => r.status === 'pending');
    if (targets.length) out.push({ id: 'a-targets', tone: 'warn', text: `${targets.length} set${targets.length === 1 ? '' : 's'} of targets waiting for your approval`, view: 'Approvals', reviewId: targets.length === 1 ? targets[0].id : undefined });
    if (results.length) out.push({ id: 'a-results', tone: 'warn', text: `${results.length} submitted review${results.length === 1 ? ' is' : 's are'} waiting for approval`, view: 'Approvals', reviewId: results.length === 1 ? results[0].id : undefined });
    if (changeRequests.length) out.push({ id: 'a-change', tone: 'info', text: `${changeRequests.length} target change request${changeRequests.length === 1 ? '' : 's'} to decide`, view: 'Approvals' });
    if (lateRequests.length) out.push({ id: 'a-late', tone: 'info', text: `${lateRequests.length} late-entry request${lateRequests.length === 1 ? '' : 's'} to decide`, view: 'Missed entries' });
    const cutoff = plusDays(todayIST(now), -14);
    data.reviews.forEach(r => {
      const last = (r.comments ?? []).at(-1);
      if (last && last.role === 'member' && last.at.slice(0, 10) >= cutoff) out.push({ id: `a-reply-${r.id}-${last.id}`, tone: 'info', text: `${last.author} replied on “${last.label}”: ${last.text.length > 70 ? last.text.slice(0, 70) + '…' : last.text}`, reviewId: r.id });
    });
    return out;
  }
  if (!personId) return out;
  const mine = data.reviews.filter(r => r.memberId === personId && !r.source && (r.periodKind ?? 'weekly') === 'weekly');
  mine.forEach(r => {
    const period = weekLabel(r.week);
    const open = !periodEnded(r, now);
    const left = daysLeft(r, now);
    const needsTargets = ['draft', 'changes'].includes(r.targetStatus);
    const needsResults = r.targetStatus === 'approved' && ['draft', 'changes'].includes(r.status);
    if (lateFillable(r, now)) { out.push({ id: `m-late-${r.id}`, tone: 'urgent', text: `${period} was not submitted. You can still fill it in.`, reviewId: r.id }); return; }
    if (!open) return;
    if (needsTargets) out.push({ id: `m-targets-${r.id}`, tone: left <= 2 ? 'urgent' : 'warn', text: r.targetStatus === 'changes' ? `Your targets for ${period} were returned. Update and resubmit.` : `Set your targets for ${period}.`, reviewId: r.id });
    else if (needsResults) out.push({ id: `m-results-${r.id}`, tone: left <= 1 ? 'urgent' : left <= 2 ? 'warn' : 'info', text: r.status === 'changes' ? `Your review for ${period} was returned. Update and resubmit.` : `Submit your review for ${period}. The week closes ${inDays(left)}.`, reviewId: r.id });
  });
  mine.forEach(r => {
    const last = (r.comments ?? []).at(-1);
    if (last && last.role === 'admin' && last.at.slice(0, 10) >= plusDays(todayIST(now), -14)) out.push({ id: `m-comment-${r.id}-${last.id}`, tone: 'info', text: `Admin commented on “${last.label}”: ${last.text.length > 70 ? last.text.slice(0, 70) + '…' : last.text}`, reviewId: r.id });
  });
  const order = { urgent: 0, warn: 1, info: 2 } as const;
  return out.sort((a, b) => order[a.tone] - order[b.tone]);
}
