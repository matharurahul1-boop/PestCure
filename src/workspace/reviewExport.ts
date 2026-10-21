import type { Person, Review } from './model';
import { calculated, cellValue } from './tableModel';
export function reviewCsv(reviews: Review[], people: Person[]): string {
  const rows: unknown[][] = [['Member','Period','Section','Task / KPI','Column','Value','Approval status','Source sheet']];
  for (const r of reviews) for (const f of r.fields) {
    const prefix = [people.find(p=>p.id===r.memberId)?.name ?? '',r.originalPeriod ?? r.week,f.kra];
    const suffix = [r.targetStatus==='approved'?r.status:`targets ${r.targetStatus}`,r.source?.sheet ?? 'Workspace'];
    if (f.type==='table' && f.table) for (const row of f.table.rows) for (const c of f.table.columns) rows.push([...prefix,row.label,c.label,c.type==='computed'?(c.formula==='percent' && r.targetStatus!=='approved'?'':calculated(f.table,r.tables?.[f.id],row,c)??''):cellValue(f.table,r.tables?.[f.id],row,c)??'',...suffix]);
    else { if (f.type==='number') rows.push([...prefix,f.label,'Target',r.targets[f.id]??'',...suffix]); rows.push([...prefix,f.label,'Response',r.values[f.id]??'',...suffix]); }
  }
  return rows.map(row=>row.map(value=>{ const text=String(value); return `"${(/^[=+@-]/.test(text)?"'"+text:text).replaceAll('"','""')}"`; }).join(',')).join('\r\n');
}
