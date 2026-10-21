import React from 'react';
import { ArrowRight, CalendarCheck, CalendarClock, CalendarDays, ClipboardList, Clock3, TrendingUp } from 'lucide-react';
import { completion, score, weekLabel, type Review, type Workspace } from './model';
import { averageScore } from './performance';
import { cycleStart, lateFillable, missedEntries, periodLabel, todayIST } from './schedule';
import { DEFAULT_GRADE_BANDS, bandFill, bandRing, matchBand } from './gradeBands';
import { GradeInfo } from './GradeInfo';
import { Avatar } from './Avatar';
import { notificationIcon, timeAgo, useReadNotifications } from './NotificationBell';
import './dashboard.css';

type View = 'Weekly reviews' | 'Daily & monthly' | 'Missed entries';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const fmt = (n: number | null) => (n === null ? '—' : `${n}%`);

/** Home screen for a signed-in team member: their own progress, what needs attention, and quick links. */
export function MemberDashboard({ data, personId, statusOf, open, go, goKind }: {
  data: Workspace; personId: string; statusOf: (r: Review) => string;
  open: (r: Review) => void; go: (view: View) => void; goKind: (kind: 'daily' | 'monthly') => void;
}) {
  const bands = data.gradeBands?.length ? data.gradeBands : DEFAULT_GRADE_BANDS;
  const person = data.people.find(p => p.id === personId);
  const role = data.roles.find(r => r.id === person?.roleId);
  const mine = data.reviews.filter(r => r.memberId === personId);
  const weekly = mine.filter(r => (r.periodKind ?? 'weekly') === 'weekly').sort((a, b) => b.week.localeCompare(a.week));
  const today = todayIST();
  const thisWeek = cycleStart(today, data.calendar?.startDay ?? 1);
  const current = weekly.find(r => r.week === thisWeek);
  const scored = weekly.filter(r => score(r) !== null);
  const trend = scored.slice(0, 8).reverse();
  const currentScore = current ? score(current) : null;
  const lastScore = scored[0] ? score(scored[0]) : null;
  const heroScore = currentScore ?? lastScore;
  const fourWeek = averageScore(scored.slice(0, 4));
  const submittedCount = weekly.filter(r => r.status === 'submitted' || r.status === 'approved').length;
  const lateReviews = weekly.filter(r => r.week < thisWeek && lateFillable(r));
  const missedCells = missedEntries(data).filter(m => m.memberId === personId).length;
  const dailyOpen = mine.filter(r => r.periodKind === 'daily' && r.week === today).length;
  const monthlyOpen = mine.filter(r => r.periodKind === 'monthly' && r.week === today.slice(0, 7) + '-01').length;
  const notifications = (data.notifications ?? []).filter(n => n.memberId === personId);
  const { read, mark } = useReadNotifications(personId);
  const first = (person?.name ?? 'there').split(' ')[0];
  const heroBand = matchBand(heroScore, bands);

  const action = !current ? null
    : current.targetStatus === 'draft' || current.targetStatus === 'changes' ? { label: 'Set your targets', note: 'Submit this week’s targets for approval' }
    : current.targetStatus === 'pending' ? { label: 'View targets', note: 'Your targets are waiting for admin approval' }
    : current.status === 'draft' || current.status === 'changes' ? { label: 'Fill this week’s review', note: `${completion(current)}% filled so far` }
    : { label: 'View review', note: current.status === 'submitted' ? 'Submitted — waiting for admin review' : 'Approved' };

  const tiles: Array<{ icon: React.ReactNode; title: string; value: string; sub: string; onClick: () => void; tone: string }> = [
    { icon: <ClipboardList size={22} />, title: 'Weekly reviews', value: current ? statusOf(current) : 'No review yet', sub: `${weekly.length} in your history`, onClick: () => go('Weekly reviews'), tone: 'green' },
    { icon: <CalendarDays size={22} />, title: 'Daily reviews', value: dailyOpen ? `${dailyOpen} open today` : 'Nothing open today', sub: 'Daily entries', onClick: () => goKind('daily'), tone: 'teal' },
    { icon: <CalendarClock size={22} />, title: 'Monthly reviews', value: monthlyOpen ? `${monthlyOpen} open this month` : 'Nothing open', sub: 'Monthly entries', onClick: () => goKind('monthly'), tone: 'gold' },
    { icon: <Clock3 size={22} />, title: 'Missed entries', value: missedCells ? `${missedCells} to review` : 'All caught up', sub: lateReviews.length ? `${lateReviews.length} past week${lateReviews.length === 1 ? '' : 's'} to fill` : 'Nothing overdue', onClick: () => go('Missed entries'), tone: missedCells || lateReviews.length ? 'warm' : 'green' },
  ];

  return <>
    <section className="md-hero">
      <div className="md-hero-main">
        <Avatar name={person?.name ?? 'Member'} url={person?.avatarUrl} />
        <div>
          <h1>{greeting()}, {first}</h1>
          <p>{role?.name ?? 'Team member'} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          {action && current && <button className="md-cta" onClick={() => open(current)}>{action.label}<ArrowRight size={16} /></button>}
          {action && <small>{action.note}</small>}
        </div>
      </div>
      <div className="md-hero-score">
        <div className="md-ring" style={bandRing(heroScore, bands)}><span><strong>{fmt(heroScore)}</strong><small>{currentScore !== null ? 'this week' : heroScore !== null ? 'last scored week' : 'no score yet'}</small></span></div>
        {heroScore !== null && <span className="grade-chip-row"><em style={{ color: heroBand.colorText }}>{heroBand.grade} · {heroBand.label}</em><GradeInfo bands={bands} current={heroBand} /></span>}
      </div>
    </section>

    <div className="md-tiles">{tiles.map(t => <button key={t.title} className={`md-tile ${t.tone}`} onClick={t.onClick}><span className="md-tile-icon">{t.icon}</span><span className="md-tile-body"><strong>{t.title}</strong><b>{t.value}</b><small>{t.sub}</small></span><ArrowRight size={16} /></button>)}</div>

    <div className="md-stats">
      <section className="panel perf-stat"><span className="perf-stat-label"><TrendingUp size={16} />4-week average</span><strong style={{ color: matchBand(fourWeek, bands).colorText }}>{fmt(fourWeek)}</strong><small>{scored.length ? `Across your last ${Math.min(4, scored.length)} scored weeks` : 'Appears after your first scored review'}</small></section>
      <section className="panel perf-stat"><span className="perf-stat-label"><CalendarCheck size={16} />Reviews submitted</span><strong>{submittedCount}</strong><small>of {weekly.length} weekly reviews</small></section>
    </div>

    <div className="md-grid">
      <section className="panel">
        <div className="panel-heading"><div><h2>Your achievement</h2><p>Last {trend.length || 8} scored weeks</p></div></div>
        {trend.length ? <div className="perf-bars">{trend.map(r => { const s = score(r); return <button key={r.id} className="perf-bar" onClick={() => open(r)} aria-label={`${weekLabel(r.week)}: ${fmt(s)}`}>
          <strong style={{ color: matchBand(s, bands).colorText }}>{fmt(s)}</strong>
          <span className="perf-bar-track"><i style={{ height: `${s ?? 0}%`, background: bandFill(s, bands) }} /></span><small>{r.week.slice(5)}</small></button>; })}</div>
          : <p className="schedule-empty">Your achievement appears here once a review has approved targets and results.</p>}
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>Notifications</h2><p>{notifications.filter(n => !read.has(n.id)).length} unread</p></div></div>
        <div className="md-notes">{notifications.slice(0, 5).map(n => <button key={n.id} className={`notif-item ${read.has(n.id) ? '' : 'unread'}`} onClick={() => { mark([n.id]); const r = mine.find(x => x.id === n.reviewId); if (r) open(r); }}>
          <span className={`notif-icon ${n.kind}`}>{notificationIcon(n.kind)}</span><span><span className="notif-text">{n.text}</span><small>{timeAgo(n.at)}</small></span></button>)}
          {!notifications.length && <p className="schedule-empty">No updates yet. Approvals and changes from your admin show up here.</p>}</div>
      </section>
    </div>

    {lateReviews.length > 0 && <section className="panel md-late">
      <div className="panel-heading"><div><h2>Missed weekly reviews</h2><p>These weeks were not submitted. You can still fill them in.</p></div></div>
      <div className="md-list">{lateReviews.slice(0, 5).map(r => <div className="md-row" key={r.id}><span><strong>{weekLabel(r.week)}</strong><small>{statusOf(r)} · {completion(r)}% filled</small></span><button className="button" onClick={() => open(r)}>Fill now<ArrowRight size={15} /></button></div>)}</div>
    </section>}

    <section className="panel">
      <div className="panel-heading"><div><h2>Recent weekly reviews</h2></div><button className="text-button" onClick={() => go('Weekly reviews')}>View all<ArrowRight size={15} /></button></div>
      <div className="md-list">{weekly.slice(0, 5).map(r => { const s = score(r); const b = matchBand(s, bands); return <div className="md-row" key={r.id}>
        <span><strong>{periodLabel(r)}</strong><small>{statusOf(r)}</small></span>
        <span className="score-chip" style={{ color: b.colorText, background: `color-mix(in srgb, ${b.colorFrom} 22%, transparent)` }}>{fmt(s)}</span>
        <button className="button" onClick={() => open(r)}>Open</button></div>; })}
        {!weekly.length && <p className="schedule-empty">Your weekly reviews will appear here.</p>}</div>
    </section>
  </>;
}
