import React, { useState } from 'react';
import { Check, Plus, ArrowRight, CircleAlert } from 'lucide-react';
import { addBlocker, blockerEntries, reviewBlockers } from './blockers';
import type { Review, Workspace } from './model';
import './blockers.css';
import { guardReviewUpdate } from './schedule';
const dateLabel = (value: string) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export function BlockerEditor({ review, editable, update }: { review: Review; editable: boolean; update: (r: Review, message?: string) => void }) {
 const [text, setText] = useState(''), [error, setError] = useState('');
 const items = reviewBlockers(review);
 return <div className="blocker-editor"><h3>Blockers &amp; support needed</h3>
  <ul className="blocker-items">{items.map(b => <li key={b.id}><span className={`badge ${b.completedAt ? 'green' : 'amber'}`}>{b.completedAt ? 'Completed' : 'Open'}</span><p>{b.text}</p>{b.completedAt && <small>Completed {dateLabel(b.completedAt)}</small>}</li>)}</ul>
  {editable && <><label className="sr-only" htmlFor={`blocker-${review.id}`}>New blocker</label><textarea id={`blocker-${review.id}`} value={text} maxLength={2000} onChange={e => setText(e.target.value)} placeholder="What’s getting in the way?" /><button type="button" className="button" disabled={!text.trim()} onClick={() => { try { update(guardReviewUpdate(review, addBlocker(review, text)), 'Blocker added'); setText(''); setError(''); } catch (e) { setError((e as Error).message); } }}><Plus size={16} />Add blocker</button></>}
  {!editable && !items.length && <p className="muted">No blockers</p>}{error && <p className="form-error" role="alert">{error}</p>}
 </div>;
}
export function OpenBlockers({ reviews, complete, logs }: { reviews: Review[]; complete: (reviewId: string, id: string) => void; logs: () => void }) {
 const open = blockerEntries(reviews).filter(b => !b.completedAt).sort((a,b) => b.week.localeCompare(a.week));
 return <section className="panel open-blockers"><div className="panel-heading"><h2><CircleAlert size={18} />Open blockers <span className="mini-tag">{open.length}</span></h2><button className="text-button" onClick={logs}>Logs <ArrowRight size={15} /></button></div>
  {open.length ? <ul className="blocker-items">{open.map(b => <li key={`${b.reviewId}:${b.id}`}><div><small>Week of {b.week}</small><p>{b.text}</p>{b.createdAt && <small>Added {dateLabel(b.createdAt)}</small>}</div><button className="button" onClick={() => complete(b.reviewId, b.id)}><Check size={15} />Mark complete</button></li>)}</ul> : <p className="schedule-empty">No open blockers</p>}
 </section>;
}
export function BlockerLogs({ data, actor, admin, open }: { data: Workspace; actor: string; admin: boolean; open: (r: Review) => void }) {
 const [status, setStatus] = useState('all'), [query, setQuery] = useState('');
 const rows = blockerEntries(data.reviews.filter(r => admin || r.memberId === actor)).filter(b => (status === 'all' || (status === 'completed' ? !!b.completedAt : !b.completedAt)) && `${b.text} ${data.people.find(p => p.id === b.memberId)?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => (b.completedAt ?? b.createdAt ?? b.week).localeCompare(a.completedAt ?? a.createdAt ?? a.week));
 return <><div className="page-heading"><h1>Blocker logs</h1></div><div className="list-toolbar"><label className="search-box"><input aria-label="Search blockers" placeholder="Search blockers…" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="Blocker status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All</option><option value="open">Open</option><option value="completed">Completed</option></select></div>
 <section className="panel"><ul className="blocker-items blocker-log">{rows.map(b => <li key={`${b.reviewId}:${b.id}`}><div><span className={`badge ${b.completedAt ? 'green' : 'amber'}`}>{b.completedAt ? 'Completed' : 'Open'}</span>{admin && <strong>{data.people.find(p => p.id === b.memberId)?.name}</strong>}<p>{b.text}</p><small>Week of {b.week}{b.createdAt ? ` · Added ${dateLabel(b.createdAt)}` : ''}</small>{b.completedAt && <small>Completed {dateLabel(b.completedAt)}</small>}</div><button className="text-button" onClick={() => { const r = data.reviews.find(r => r.id === b.reviewId); if (r) open(r); }}>View report <ArrowRight size={15} /></button></li>)}</ul>{!rows.length && <p className="schedule-empty">No blockers found</p>}</section></>;
}
