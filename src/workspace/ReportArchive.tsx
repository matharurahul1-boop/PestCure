import React from 'react';
import { addStarterData, type SavedReport } from './reportData';
import type { Workspace } from './model';
export function ReportArchive({ data, change }: { data: Workspace; change: (fn: (state: Workspace) => Workspace, message?: string) => void }) {
 const download = (report: SavedReport) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `${report.kind}-${report.id}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
 };
 return <section className="panel settings-panel"><h2>Reports & source data</h2>
  <p>{data.people.length} members · {data.roles.length} roles · {data.reviews.length} workspace/Excel reviews · {data.reportData?.demoReviews.length ?? 0} saved demo reviews · {data.reportData?.demoAttendance.length ?? 0} saved demo attendance rows.</p>
  <p>Performance and achievement use saved reviews. Attendance uses saved attendance rows. Demo data is labelled synthetic and stored separately.</p>
  <button className="button" onClick={() => change(d => addStarterData(d), 'Starter members, Excel history and demo reports added; saving')}>Add bundled data & reports</button>
  
  <h3>Saved report snapshots</h3><p>Use Save report on Performance, Attendance or Achievement breakdown. Snapshots preserve the selected results and filters even when source records change.</p>
  {(data.savedReports ?? []).map(report => <div className="panel-heading" key={report.id}><div><strong>{report.title}</strong><p>{report.source} · {new Date(report.createdAt).toLocaleString('en-IN')}</p></div><button className="button" onClick={() => download(report)}>Download report</button></div>)}
  {!data.savedReports?.length && <p>No snapshots saved yet.</p>}
 </section>;
}
