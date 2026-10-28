import type { Review } from './model';
export type Blocker = { id: string; text: string; createdAt?: string; completedAt?: string };
export type BlockerEntry = Blocker & { reviewId: string; memberId: string; week: string };
/** Old free text remains a single entry; never split or discard someone's original note. */
export function reviewBlockers(review: Pick<Review, 'id' | 'blockers' | 'blockerItems'>): Blocker[] {
 return review.blockerItems ?? (review.blockers?.trim() ? [{ id: `legacy-${review.id}`, text: review.blockers.trim() }] : []);
}
export function addBlocker(review: Review, text: string, now = new Date()): Review {
 const value = text.trim();
 if (!value) throw new Error('Enter a blocker first.');
 if (value.length > 2000) throw new Error('Keep each blocker under 2,000 characters.');
 const blockerItems = [...reviewBlockers(review), { id: crypto.randomUUID(), text: value, createdAt: now.toISOString() }];
 return { ...review, blockerItems, blockers: blockerItems.map(b => b.text).join('\n\n') };
}
export function completeBlocker(review: Review, id: string, now = new Date()): Review {
 const items = reviewBlockers(review);
 const item = items.find(b => b.id === id);
 if (!item) throw new Error('Blocker not found.');
 if (item.completedAt) return review;
 return { ...review, blockerItems: items.map(b => b.id === id ? { ...b, completedAt: now.toISOString() } : b) };
}
/** Narrow exception for closing follow-ups after a review's period has ended. */
export function isBlockerCompletion(previous: Review, next: Review): boolean {
 const without = (r: Review) => JSON.stringify({ ...r, blockerItems: undefined, updatedAt: undefined });
 if (without(previous) !== without(next)) return false;
 const before = reviewBlockers(previous), after = reviewBlockers(next);
 if (!before.length || before.length !== after.length) return false;
 let changed = false;
 const valid = before.every((a, i) => {
  const b = after[i];
  if (!b || a.id !== b.id || a.text !== b.text || a.createdAt !== b.createdAt) return false;
  if (a.completedAt) return a.completedAt === b.completedAt;
  if (!b.completedAt) return true;
  changed = true;
  return Number.isFinite(Date.parse(b.completedAt));
 });
 return changed && valid;
}
export function blockerEntries(reviews: Review[]): BlockerEntry[] {
 return reviews.filter(r => !r.demo && (r.periodKind ?? 'weekly') === 'weekly').flatMap(r => reviewBlockers(r).map(b => ({ ...b, reviewId: r.id, memberId: r.memberId, week: r.week })));
}
/** Keep unseen additions and terminal completion when two member sessions save stale copies. */
export function mergeBlockers(existing: Blocker[], incoming: Blocker[]): Blocker[] {
 const merged = new Map(incoming.map(b => [b.id, b]));
 for (const b of existing) merged.set(b.id, { ...b, ...merged.get(b.id), ...(b.completedAt ? { completedAt: b.completedAt } : {}) });
 return [...merged.values()];
}
