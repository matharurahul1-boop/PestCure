import type { SaveReport } from './reportData';
import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookmarkPlus, CalendarDays, Search, Target } from 'lucide-react';
import type { Review, Workspace } from './model';
import { aggregateContributions, reviewAverage } from './achievementBreakdown';
import { reportPool } from './performance';
import { cycleStart, plusDays, todayIST } from './schedule';
import { DEFAULT_GRADE_BANDS, bandFill, bandRing, matchBand } from './gradeBands';
import { GradeInfo } from './GradeInfo';
import { Avatar } from './Avatar';
import './dashboard.css';

const number = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(n);

export function AchievementBreakdownScreen({ data, demo, open, saveReport }: { data: Workspace; demo: Review[]; open: (r: Review) => void; saveReport: SaveReport }) {
  const bands = data.gradeBands?.length ? data.gradeBands : DEFAULT_GRADE_BANDS;
  const startDay = data.calendar?.startDay ?? 1;
  const pool = useMemo(() => reportPool(data, demo), [data, demo]);
  const weeks = useMemo(() => [...new Set(pool.filter(r => reviewAverage([r]) !== null).map(r => r.week))].sort().reverse(), [pool]);
  const [week, setWeek] = useState(weeks[0] ?? cycleStart(todayIST(), startDay));
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const selected = pool.filter(r => r.week === week);
  const people = data.people.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  const cards = people.map(person => {
    const reviews = selected.filter(r => r.memberId === person.id);
    return { person, reviews, tasks: aggregateContributions(reviews), overall: reviewAverage(reviews) };
  });
  const teamAverage = reviewAverage(selected.filter(r => people.some(p => p.id === r.memberId)));
  const teamBand = matchBand(teamAverage, bands);
  const index = weeks.indexOf(week);

  return <>
    <div className="page-heading"><div><h1>Achievement breakdown</h1></div>
      <button className="button" disabled={!selected.length} onClick={() => saveReport({ kind: 'achievement', title: `Achievement breakdown · ${week}`, source: 'all', filters: { week, query }, payload: { people: cards.map(c => ({ person: c.person, overall: c.overall, tasks: c.tasks, reviews: c.reviews })), thresholds: data.thresholds } })}><BookmarkPlus size={16} />Save report</button>
    </div>

    <div className="perf-filters panel">
      <label>Week<select aria-label="Week to inspect" value={week} onChange={e => setWeek(e.target.value)}>{!weeks.includes(week) && <option value={week}>{week}</option>}{weeks.map(w => <option key={w} value={w}>{w} – {plusDays(w, 6)}</option>)}</select></label>
      <div className="week-step"><button aria-label="Previous week" disabled={index >= weeks.length - 1 && index !== -1} onClick={() => setWeek(index === -1 ? plusDays(week, -7) : weeks[index + 1] ?? week)}><ArrowLeft size={15} /></button><CalendarDays size={16} /><span>{week} – {plusDays(week, 6)}</span><button aria-label="Next week" disabled={index === 0} onClick={() => setWeek(index === -1 ? plusDays(week, 7) : weeks[index - 1] ?? week)}><ArrowRight size={15} /></button></div>
      <label className="search-box"><Search size={16} /><input aria-label="Search team member" placeholder="Search member" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <div className="breakdown-team"><span>Team average</span><strong style={{ color: teamBand.colorText }}>{teamAverage === null ? '—' : `${teamAverage}%`}</strong>{teamAverage !== null && <span className="grade-chip-row"><em style={{ color: teamBand.colorText, borderColor: teamBand.colorText }}>{teamBand.grade} · {teamBand.label}</em><GradeInfo bands={bands} current={teamBand} /></span>}</div>
    </div>

    <div className="band-legend breakdown-legend">{[...bands].sort((a, b) => b.minScore - a.minScore).map(b => <span key={b.id}><i style={{ background: `linear-gradient(135deg, ${b.colorFrom}, ${b.colorTo})` }} />{b.grade} · {b.label} <small>{b.minScore}%+</small></span>)}</div>

    <div className="breakdown-grid">
      {cards.map(({ person, reviews, tasks, overall }) => {
        const band = matchBand(overall, bands);
        const visible = expanded[person.id] ? tasks : tasks.slice(0, 5);
        return <section className="panel achievement-card" key={person.id}>
          <div className="achievement-card-head">
            <Avatar name={person.name} url={person.avatarUrl} />
            <div><h2>{person.name}</h2><p>{data.roles.find(r => r.id === person.roleId)?.name}</p></div>
            <div className="breakdown-ring" style={bandRing(overall, bands)}><span><strong>{overall === null ? '—' : `${overall}%`}</strong></span></div>
          </div>
          {tasks.length ? <>
            <div className="breakdown-sub"><span>{tasks.length} scored KPIs · weakest first</span>{overall !== null && <span className="grade-chip-row"><em style={{ color: band.colorText }}>{band.grade} · {band.label}</em><GradeInfo bands={bands} current={band} /></span>}</div>
            <div className="breakdown-kpis">{visible.map(task => {
              const b = matchBand(task.percent, bands);
              return <div className="breakdown-kpi" key={task.key}>
                <div className="breakdown-kpi-top"><strong>{task.task}</strong><b style={{ color: b.colorText }}>{task.percent}%</b></div>
                <span className="perf-meter"><i style={{ width: `${task.percent}%`, background: bandFill(task.percent, bands, '90deg') }} /></span>
                <small>{task.kra}{task.actual !== undefined ? ` · Actual ${number(task.actual)}` : ''}{task.target !== undefined ? ` · Target ${number(task.target)}` : ''}{task.percent < 100 ? ` · ${100 - task.percent} pts to target` : ' · Target achieved'}</small>
              </div>;
            })}</div>
            {tasks.length > 5 && <button className="text-button breakdown-more" onClick={() => setExpanded({ ...expanded, [person.id]: !expanded[person.id] })}>{expanded[person.id] ? 'Show fewer' : `Show all ${tasks.length} KPIs`}</button>}
            <button className="button full breakdown-open" onClick={() => open(reviews[0])}>Open weekly review <ArrowRight size={15} /></button>
          </> : <div className="empty-card"><Target size={24} /><strong>No scored review</strong><p>No approved KPI result for this week.</p></div>}
        </section>;
      })}
    </div>
    {!people.length && <div className="panel schedule-empty">No team member matches your search.</div>}
  </>;
}
