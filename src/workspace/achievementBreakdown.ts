import { achievement, score, type Review } from './model';
import { calculated, numeric } from './tableModel';

export type Contribution = { key: string; kra: string; task: string; percent: number; target?: number; actual?: number; unit: string };
export function reviewContributions(review: Review): Contribution[] {
  if (review.targetStatus !== 'approved') return [];
  return review.fields.flatMap(field => {
    if (field.type === 'number') {
      const target = review.targets[field.id]; if (!(target > 0)) return [];
      const result = achievement(review, field);
      return [{ key: field.id, kra: field.kra, task: field.label, percent: Math.min(100, Math.max(0, result ?? 0)), target, actual: numeric(review.values[field.id]) ?? undefined, unit: field.unit }];
    }
    if (!field.table) return [];
    const percentageColumns = field.table.columns.filter(c => c.type === 'computed' && c.formula === 'percent');
    return field.table.rows.filter(row => row.scored !== false).flatMap(row => percentageColumns.flatMap(column => {
      const target = numeric(review.tables?.[field.id]?.[row.id]?.[column.denominator ?? ''] ?? row.defaults[column.denominator ?? '']);
      if (target === null || target <= 0) return [];
      const actual = (column.inputs ?? []).reduce((sum, id) => sum + (numeric(review.tables?.[field.id]?.[row.id]?.[id]) ?? 0), 0);
      return [{ key: `${field.id}|${row.id}|${column.id}`, kra: field.kra, task: row.label, percent: Math.min(100, Math.max(0, calculated(field.table!, review.tables?.[field.id], row, column) ?? 0)), target: target * (column.multiplier ?? 1), actual, unit: field.unit }];
    }));
  });
}
export function aggregateContributions(reviews: Review[]) {
  const map = new Map<string, { kra: string; task: string; unit: string; percentages: number[]; targets: number[]; actuals: number[] }>();
  reviews.forEach(review => reviewContributions(review).forEach(item => { const current = map.get(item.key) ?? { kra: item.kra, task: item.task, unit: item.unit, percentages: [], targets: [], actuals: [] }; current.percentages.push(item.percent); if (item.target !== undefined) current.targets.push(item.target); if (item.actual !== undefined) current.actuals.push(item.actual); map.set(item.key,current); }));
  return [...map.entries()].map(([key,item]) => ({ key, kra:item.kra, task:item.task, unit:item.unit, percent:Math.round(item.percentages.reduce((a,b)=>a+b,0)/item.percentages.length), target:item.targets.length?item.targets.reduce((a,b)=>a+b,0)/item.targets.length:undefined, actual:item.actuals.length?item.actuals.reduce((a,b)=>a+b,0)/item.actuals.length:undefined, occurrences:item.percentages.length })).sort((a,b)=>a.percent-b.percent||a.task.localeCompare(b.task));
}
export const reviewAverage = (reviews: Review[]) => { const values=reviews.map(score).filter((n):n is number=>n!==null); return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null; };
