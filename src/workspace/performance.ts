import { createReview, score, type Review, type Workspace } from './model';
import { cycleStart, fieldsForPeriod, nextMonth, plusDays, todayIST } from './schedule';
import { numeric } from './tableModel';

export function monthsBefore(date: string, count: number) { const d = new Date(date.slice(0, 7) + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - count); return d.toISOString().slice(0, 10); }
// Generated on demand, never written over real reviews or multiplied in browser storage.
export function demoReviews(state: Workspace, anchor = todayIST()): Review[] {
  const result: Review[] = []; const firstMonth = monthsBefore(anchor, 12); const currentWeek = cycleStart(anchor, state.calendar?.startDay ?? 1);
  state.people.forEach((person, personIndex) => {
    const role = state.roles.find(r => r.id === person.roleId); if (!role) return;
    let index = 0;
    for (let week = cycleStart(firstMonth, state.calendar?.startDay ?? 1); week < currentWeek; week = plusDays(week, 7)) {
      if (week < firstMonth) continue;
      const r = createReview({ ...person, fields: fieldsForPeriod(person.fields ?? role.fields, 'weekly') }, role, week);
      if (!r.fields.length) continue;
      r.id = `demo-year-${person.id}-${week}`; r.demo = true; r.periodKind = 'weekly'; r.periodEnd = plusDays(week, 7); r.trackingFrom = firstMonth;
      const ratio = Math.min(1.12, 0.48 + personIndex * 0.06 + index * 0.006 + ((index * 7 + personIndex * 3) % 11) * 0.035);
      r.fields.forEach(f => {
        if (f.type === 'number') { r.targets[f.id] = f.target > 0 ? f.target : 10; r.values[f.id] = Math.round(f.direction === 'lower' ? r.targets[f.id] / ratio : r.targets[f.id] * ratio); }
        else if (f.type === 'checkbox') r.values[f.id] = index % 7 !== 0;
        else if (!f.table) r.values[f.id] = `Demo: ${index % 4 === 0 ? 'Follow-up needed on pending work.' : 'Planned work completed; next actions recorded.'}`;
        else for (const [rowIndex, row] of f.table.rows.entries()) {
          const values = r.tables![f.id][row.id];
          const targetColumn = f.table.columns.find(c => c.type === 'target');
          if (targetColumn) values[targetColumn.id] = numeric(values[targetColumn.id])! > 0 ? values[targetColumn.id] : 10 + rowIndex * 5;
          for (const col of f.table.columns) {
            if (col.type === 'target' || col.type === 'computed') continue;
            if (col.type === 'daily' || col.type === 'number') {
              const calc = f.table.columns.find(c => c.formula === 'percent' && c.inputs?.includes(col.id));
              const target = calc ? Number(values[calc.denominator!] ?? 10) * (calc.multiplier ?? 1) / (calc.inputs?.length ?? 1) : 5 + rowIndex * 2;
              values[col.id] = Math.round(target * ratio * (0.94 + ((rowIndex + index) % 4) * 0.04));
            } else if (col.type === 'date') values[col.id] = week;
            else if (col.type === 'status') values[col.id] = index % 5 === 0 ? 'In progress' : 'Completed';
            else values[col.id] = /name/i.test(row.label) ? `Demo: ${person.name}` : `Demo: ${index % 4 === 0 ? 'Follow-up recorded' : 'Completed as planned'}`;
          }
        }
      });
      r.status = 'approved'; r.targetStatus = 'approved'; r.highlights = 'Synthetic example for report exploration.'; r.updatedAt = r.periodEnd + 'T00:00:00+05:30';
      result.push(r); index++;
    }
  });
  return result;
}
export function reportRange(preset: string, today: string, startDay = 1) {
  if (preset === 'week') return { from: cycleStart(today, startDay), to: today };
  if (preset === 'last-week') { const from = plusDays(cycleStart(today, startDay), -7); return { from, to: plusDays(from, 6) }; }
  if (preset === 'month') return { from: today.slice(0, 7) + '-01', to: today };
  return { from: monthsBefore(today, Number(preset)), to: plusDays(today.slice(0, 7) + '-01', -1) };
}
export function averageScore(reviews: Review[]) { const scores = reviews.map(score).filter((s): s is number => s !== null); return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null; }
export type ReportGroup = 'weekly' | 'monthly' | 'yearly';
const nextYear = (date: string) => `${Number(date.slice(0, 4)) + 1}-01-01`;
/**
 * Every weekly review the dashboards can use: workspace/Excel records plus the saved demo history.
 * A real review hides the demo row for the same member-week only when it actually has a score.
 */
export function reportPool(state: Workspace, demo: Review[]): Review[] {
  const weekly = (r: Review) => (r.periodKind ?? 'weekly') === 'weekly';
  const real = state.reviews.filter(weekly);
  const taken = new Set(real.filter(r => score(r) !== null).map(r => `${r.memberId}|${r.week}`));
  return [...real, ...demo.filter(r => weekly(r) && !taken.has(`${r.memberId}|${r.week}`))];
}
export function reportBuckets(reviews: Review[], from: string, to: string, group: ReportGroup, startDay: number) {
  const buckets: Array<{ period: string; end: string; reviews: Review[]; score: number | null }> = [];
  for (let period = group === 'yearly' ? from.slice(0, 4) + '-01-01' : group === 'monthly' ? from.slice(0, 7) + '-01' : cycleStart(from, startDay); period <= to;) {
    const end = group === 'yearly' ? nextYear(period) : group === 'monthly' ? nextMonth(period) : plusDays(period, 7);
    const selected = reviews.filter(r => r.week >= period && r.week < end);
    buckets.push({ period, end, reviews: selected, score: averageScore(selected) }); period = end;
  }
  return buckets;
}
