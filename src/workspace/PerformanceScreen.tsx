import type { SaveReport } from './reportData';
import React, { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowRight, BookmarkPlus, CheckCircle2, ChevronDown, ClipboardCheck, LifeBuoy, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { score, type Workspace, type Review } from './model';
import { averageScore, reportBuckets, reportPool, reportRange, monthsBefore, type ReportGroup } from './performance';
import { periodLabel, plusDays, todayIST } from './schedule';
import { DEFAULT_GRADE_BANDS, bandFill, matchBand } from './gradeBands';
import { GradeInfo } from './GradeInfo';
import { Avatar } from './Avatar';
import './dashboard.css';

const submitted = (r: Review) => r.status === 'submitted' || r.status === 'approved';
const fmt = (n: number | null) => (n === null ? '—' : `${n}%`);

export function PerformanceScreen({ data, demo, memberId, open, saveReport }: { data: Workspace; demo: Review[]; memberId: string; open: (r: Review) => void; saveReport: SaveReport }) {
  const bands = data.gradeBands?.length ? data.gradeBands : DEFAULT_GRADE_BANDS;
  const startDay = data.calendar?.startDay ?? 1;
  const today = todayIST();
  const pool = useMemo(() => reportPool(data, demo), [data, demo]);

  const [member, setMember] = useState(memberId);
  const [preset, setPreset] = useState('latest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [group, setGroup] = useState<ReportGroup>('weekly');
  const [customFrom, setFrom] = useState('');
  const [customTo, setTo] = useState(today);
  const [bucket, setBucket] = useState('');
  const [page, setPage] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // "1 month" means the most recent month that has data, so the default view is never empty.
  const latestWeek = pool.filter(r => r.week <= today && score(r) !== null).reduce((latest, r) => (r.week > latest ? r.week : latest), '');
  const range = useMemo(() => {
    if (preset === 'custom') return { from: customFrom, to: customTo };
    if (preset === 'latest') { const base = latestWeek || today; return { from: base.slice(0, 7) + '-01', to: plusDays(monthsBefore(base, -1), -1) }; }
    return reportRange(preset, today, startDay);
  }, [preset, customFrom, customTo, latestWeek, today, startDay]);
  const invalid = !range.from || !range.to || range.from > range.to || Number(range.to.slice(0, 4)) - Number(range.from.slice(0, 4)) > 10;
  const selected = useMemo(() => (invalid ? [] : pool.filter(r => (!member || r.memberId === member) && r.week >= range.from && r.week <= range.to)), [pool, member, range, invalid]);
  const buckets = useMemo(() => (invalid ? [] : reportBuckets(selected, range.from, range.to, group, startDay)), [selected, range, group, invalid, startDay]);
  const shown = useMemo(() => [...(bucket ? buckets.find(b => b.period === bucket)?.reviews ?? [] : selected)].sort((a, b) => b.week.localeCompare(a.week) || a.memberId.localeCompare(b.memberId)), [bucket, buckets, selected]);

  const avg = averageScore(selected);
  const scored = selected.filter(r => score(r) !== null);
  const submittedCount = selected.filter(submitted).length;
  const onTrack = scored.filter(r => (score(r) ?? -1) >= data.thresholds.good).length;
  const support = scored.filter(r => (score(r) ?? 101) < data.thresholds.watch).length;
  const onTrackPct = scored.length ? Math.round(onTrack / scored.length * 100) : null;
  const avgBand = matchBand(avg, bands);

  const ranking = data.people
    .filter(p => !member || p.id === member)
    .map(p => { const list = selected.filter(r => r.memberId === p.id); return { person: p, forms: list.length, submitted: list.filter(submitted).length, avg: averageScore(list) }; })
    .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1) || a.person.name.localeCompare(b.person.name));
  const ranked = showAll ? ranking : ranking.slice(0, 5);
  const reset = () => { setBucket(''); setPage(0); };
  const personName = (id: string) => data.people.find(p => p.id === id)?.name ?? '';
  const bucketLabel = (period: string) => group === 'yearly' ? period.slice(0, 4) : group === 'monthly' ? new Date(period + 'T12:00:00').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : period.slice(5);

  const csv = () => {
    const rows = [['Member', 'Week start', 'Week end', 'Achievement %', 'Status'], ...selected.map(r => [personName(r.memberId), r.week, r.periodEnd ?? '', score(r) ?? '', r.status])];
    const content = rows.map(row => row.map(value => { const text = String(value); return '"' + (/^[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""') + '"'; }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `performance-${range.from}-${range.to}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const PRESETS: Record<string, string> = { latest: '1 month', week: 'This week', 'last-week': 'Last week', '3': '3 months', '6': '6 months', '12': '1 year', custom: 'Custom dates' };
  const filterSummary = [data.people.find(x => x.id === member)?.name ?? 'All members', PRESETS[preset] ?? preset, { weekly: 'By week', monthly: 'By month', yearly: 'By year' }[group] ?? group].join(' · ');

  return <>
    <div className="page-heading"><div><h1>Performance</h1></div>
      <div className="page-actions">
        <button className="button" disabled={!selected.length || invalid} onClick={() => saveReport({ kind: 'performance', title: `Performance · ${range.from} – ${range.to}`, source: 'all', filters: { ...range, member, group }, payload: { reviews: selected, people: data.people.filter(p => !member || p.id === member), average: avg, thresholds: data.thresholds, buckets: buckets.map(b => ({ period: b.period, end: b.end, score: b.score, count: b.reviews.length })) } })}><BookmarkPlus size={16} />Save report</button>
        <button className="button" disabled={!selected.length} onClick={csv}><ArrowDownToLine size={16} />Export</button>
      </div>
    </div>

    <div className="perf-top">
    <button type="button" className={`perf-filter-toggle${filtersOpen ? ' open' : ''}`} aria-expanded={filtersOpen} onClick={() => setFiltersOpen(o => !o)}>
      <span className="pft-icon"><SlidersHorizontal size={16} /></span>
      <span className="pft-text"><strong>Filters</strong><small>{filterSummary}</small></span>
      <ChevronDown size={18} />
    </button>
    <div className={`perf-filters panel${filtersOpen ? ' open' : ''}`}>
      <label>Team member<select value={member} onChange={e => { setMember(e.target.value); reset(); }}><option value="">All team members</option>{data.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Period<select value={preset} onChange={e => { const v = e.target.value; setPreset(v); if (v === 'custom') { setFrom(range.from); setTo(range.to); } setGroup(['week', 'last-week', 'latest'].includes(v) ? 'weekly' : v === 'custom' ? group : 'monthly'); reset(); }}>
        <option value="latest">1 month</option><option value="week">This week</option><option value="last-week">Last week</option><option value="3">3 months</option><option value="6">6 months</option><option value="12">1 year</option><option value="custom">Custom dates</option></select></label>
      <label>Chart by<select value={group} onChange={e => { setGroup(e.target.value as ReportGroup); reset(); }}><option value="weekly">Week</option><option value="monthly">Month</option><option value="yearly">Year</option></select></label>
      {preset === 'custom' && <><label>From<input type="date" value={customFrom} onChange={e => { setFrom(e.target.value); reset(); }} /></label><label>To<input type="date" value={customTo} onChange={e => { setTo(e.target.value); reset(); }} /></label></>}
    </div>
    {invalid && <p className="form-error" role="alert">Choose valid dates, with a range of at most ten years.</p>}

    <div className="perf-stats">
      <section className="panel perf-stat avg">
        <span className="perf-stat-label"><TrendingUp size={16} />Average achievement</span>
        <strong style={{ color: avgBand.colorText }}>{fmt(avg)}</strong>
        <span className="perf-meter"><i style={{ width: `${Math.min(100, avg ?? 0)}%`, background: bandFill(avg, bands, '90deg') }} /></span>
        <small className="grade-chip-row">{avg === null ? 'No scored reviews in this period' : <><span>{`${avgBand.grade} · ${avgBand.label}`}</span><GradeInfo bands={bands} current={avgBand} /></>}</small>
      </section>
      <section className="panel perf-stat"><span className="perf-stat-label"><ClipboardCheck size={16} />Reviews submitted</span><strong>{submittedCount}</strong><small>of {selected.length} weekly reviews in this period</small></section>
      <section className="panel perf-stat"><span className="perf-stat-label"><CheckCircle2 size={16} />On track</span><strong>{onTrack}</strong><small>{onTrackPct === null ? 'No scored reviews' : `${onTrackPct}% of scored reviews · ${data.thresholds.good}%+`}</small></section>
      <section className="panel perf-stat"><span className="perf-stat-label"><LifeBuoy size={16} />Needs support</span><strong>{support}</strong><small>Below {data.thresholds.watch}% achievement</small></section>
    </div>
    </div>

    <section className="panel perf-chart">
      <div className="panel-heading"><div><h2>Achievement trend</h2></div>{bucket && <button className="text-button" onClick={reset}>Show entire range</button>}</div>
      <div className="band-legend">{[...bands].sort((a, b) => b.minScore - a.minScore).map(b => <span key={b.id}><i style={{ background: `linear-gradient(135deg, ${b.colorFrom}, ${b.colorTo})` }} />{b.grade} · {b.label} <small>{b.minScore}%+</small></span>)}</div>
      <div className="perf-bars" role="group" aria-label="Achievement trend">
        {buckets.map(b => <button key={b.period} className={`perf-bar ${bucket === b.period ? 'chosen' : ''}`} aria-label={`${bucketLabel(b.period)}: ${b.score === null ? 'no scored data' : `${b.score}%`}, ${b.reviews.length} reviews`} onClick={() => { setBucket(bucket === b.period ? '' : b.period); setPage(0); }}>
          <strong style={{ color: matchBand(b.score, bands).colorText }}>{fmt(b.score)}</strong>
          <span className="perf-bar-track"><i style={{ height: `${b.score ?? 0}%`, background: b.score === null ? 'var(--border)' : bandFill(b.score, bands) }} /></span>
          <small>{bucketLabel(b.period)}</small><em>{b.reviews.length}</em>
        </button>)}
        {!buckets.length && <p className="schedule-empty">No data for this range.</p>}
      </div>
    </section>

    <section className="panel">
      <div className="panel-heading"><div><h2>{member ? 'Member summary' : 'Top team members'}</h2><p>{member ? 'Selected team member' : showAll ? 'All team members by average achievement' : 'Top 5 by average achievement'}</p></div>{!member && ranking.length > 5 && <button className="text-button" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show top 5' : `Show all ${ranking.length}`}</button>}</div>
      <div className="table-scroll stack-table"><table className="perf-rank-table"><thead><tr><th>#</th><th>Member</th><th>Reviews</th><th>Submitted</th><th>Average achievement</th><th /></tr></thead>
        <tbody>{ranked.map((row, i) => <tr key={row.person.id}>
          <td><span className="rank-badge">{i + 1}</span></td>
          <td><span className="person-link"><Avatar name={row.person.name} url={row.person.avatarUrl} /><span><strong>{row.person.name}</strong><small>{data.roles.find(r => r.id === row.person.roleId)?.name}</small></span></span></td>
          <td data-label="Reviews">{row.forms}</td><td data-label="Submitted">{row.submitted}</td>
          <td data-label="Average"><div className="perf-inline"><strong style={{ color: matchBand(row.avg, bands).colorText }}>{fmt(row.avg)}</strong><span className="perf-meter small"><i style={{ width: `${Math.min(100, row.avg ?? 0)}%`, background: bandFill(row.avg, bands, '90deg') }} /></span></div></td>
          <td><button className="text-button" onClick={() => { setMember(row.person.id); reset(); }}>View <ArrowRight size={14} /></button></td>
        </tr>)}</tbody></table></div>
    </section>

    <section className="panel perf-records">
      <div className="panel-heading"><div><h2>{bucket ? `Reviews · ${bucketLabel(bucket)}` : 'Weekly reviews'}</h2><p>{shown.length} in this selection</p></div></div>
      <div className="table-scroll stack-table"><table><thead><tr><th>Member</th><th>Period</th><th>Achievement</th><th>Status</th><th /></tr></thead>
        <tbody>{shown.slice(page * 12, (page + 1) * 12).map(r => { const s = score(r); const band = matchBand(s, bands); return <tr key={r.id}>
          <td>{personName(r.memberId)}</td><td data-label="Period">{r.originalPeriod ?? periodLabel(r)}</td>
          <td data-label="Achievement"><span className="score-chip" style={{ color: band.colorText, background: `color-mix(in srgb, ${band.colorFrom} 22%, transparent)` }}>{fmt(s)}{s !== null && <small>{band.grade}</small>}</span></td>
          <td data-label="Status"><span className={`badge ${r.status === 'approved' ? 'green' : r.status === 'submitted' ? 'amber' : 'neutral'}`}>{r.status === 'approved' ? 'Approved' : r.status === 'submitted' ? 'Submitted' : 'Not submitted'}</span></td>
          <td><button className="button" onClick={() => open(r)}>Open</button></td></tr>; })}</tbody></table></div>
      {!shown.length && <p className="schedule-empty">No reviews in this period. Try another range.</p>}
      <div className="report-pagination"><button className="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} / {Math.max(1, Math.ceil(shown.length / 12))}</span><button className="button" disabled={(page + 1) * 12 >= shown.length} onClick={() => setPage(page + 1)}>Next</button></div>
    </section>
  </>;
}
