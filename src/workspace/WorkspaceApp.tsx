import { TargetChangeQueue } from './TargetChangeQueue';
import { StatusLegend } from './StatusLegend';
import { inheritTargets, latestApprovedReview, requestTargetChange, syncTargetRequest } from './targetGovernance';
import { AchievementBreakdownScreen } from './AchievementBreakdownScreen';
import './achievement.css';
import { AttendanceScreen } from './AttendanceScreen';
import { AttendanceSettings } from './AttendanceSettings';
import './attendance.css';
import { PerformanceScreen } from './PerformanceScreen';
import { appendReport, withReportData, type SaveReport } from './reportData';
import { ReportArchive } from './ReportArchive';
import './performance.css';
import { CalendarSettings, RecurringScreen, MissedScreen } from './ScheduleScreens';
import { reconcileCalendar, cycleStart, todayIST, frozen, lateFillable, guardReviewUpdate, fieldsForPeriod, plusDays } from './schedule';
import { ZohoSettings } from './ZohoSettings';
import { applyZohoRow, fetchZoho } from './zoho';
import { DEFAULT_GRADE_BANDS } from './gradeBands';
import './schedule.css';
import { reviewCsv } from './reviewExport';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, Bell, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, Clock3, FileText, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal, Sun, Target, Trash2, TrendingUp, UserPlus, Users, X, PanelLeftClose, PanelLeftOpen, Network } from 'lucide-react';
import { applySampleAvatars, applySampleTargets, normalizeRoleNames, trimEmployeeRows, DEFAULT_PERFORMANCE_COLORS, achievement, ensureExtraRoles, kpiCount, completion, createReview, newField, Person, Review, Role, score, shiftWeek, uid, weekLabel, weekStart, Workspace } from './model';
import { AssignReportsScreen } from './AssignReportsScreen';
import { PendingApproval } from './PendingApproval';
import { OrgChartScreen } from './OrgChartScreen';
import { applyDemoData, isDemoPerson, removeDemoData } from './demoData';
import { fetchMyApproval, orgSupported } from './orgApi';
import { APPROVER_KEYS, MEMBER_KEYS, diffPatch, newlyWaiting, pendingCount, snapshotOf } from './scopedSync';
import { authEnabled, backend } from './auth';
import { loadCloudWorkspace, saveCloudWorkspace, saveScopedChanges, type LoadResult, type MemberContext } from './cloud';
import type { AuthContext } from './AuthGate';
import './workspace.css';
type View = 'Dashboard' | 'Overview' | 'Weekly reviews' | 'Users' | 'Org chart' | 'Roles' | 'Approvals' | 'Settings' | 'Daily & monthly' | 'Missed entries' | 'Performance' | 'Attendance' | 'Achievement breakdown';
const navigation = [{ name: 'Dashboard', icon: LayoutDashboard }, { name: 'Overview', icon: LayoutDashboard }, { name: 'Performance', icon: TrendingUp }, { name: 'Achievement breakdown', icon: Target }, { name: 'Attendance', icon: CalendarDays }, { name: 'Weekly reviews', icon: ClipboardList }, { name: 'Users', icon: Users }, { name: 'Org chart', icon: Network }, { name: 'Roles', icon: FileText }, { name: 'Approvals', icon: ShieldCheck }, { name: 'Daily & monthly', icon: CalendarDays }, { name: 'Missed entries', icon: Clock3 }] as const;
/**
 * Minimal mode: only the core flow is shown — sign up → sign in → admin assigns a
 * template on Users → the member fills their weekly report. Everything else
 * (dashboards, performance, attendance, template editor, recurring, missed
 * entries, integrations) stays in the code but is hidden from the nav.
 */
const MINIMAL_UI = true;
const ADMIN_NAV = ['Users', 'Org chart', 'Performance', 'Achievement breakdown', 'Roles', 'Weekly reviews', 'Daily & monthly', 'Missed entries', 'Approvals'];
const MEMBER_NAV = ['Dashboard', 'Weekly reviews', 'Daily & monthly', 'Missed entries', 'Org chart'];
/** An accountable reviewing their team: approvals first, plus the chart. */
const TEAM_NAV = ['Approvals', 'Weekly reviews', 'Missed entries', 'Org chart'];
const navFor = (isAdmin: boolean, team: boolean) => (team ? TEAM_NAV : isAdmin ? ADMIN_NAV : MEMBER_NAV).filter(n => n !== 'Org chart' || orgSupported);
const homeView = (isAdmin: boolean, team = false): View => (MINIMAL_UI ? (team ? 'Approvals' : isAdmin ? 'Users' : 'Dashboard') : 'Overview');
const statusLabel = (r: Review) => frozen(r) ? 'Frozen period' : r.targetStatus === 'pending' ? 'Targets pending' : r.targetStatus === 'changes' ? 'Revise targets' : r.targetStatus === 'draft' ? 'Set targets' : r.status === 'submitted' ? 'In review' : r.status === 'approved' ? 'Completed' : r.status === 'changes' ? 'Changes requested' : 'In progress';
import { Avatar } from './Avatar';
import { MemberDashboard } from './MemberDashboard';
import { NotificationBell } from './NotificationBell';
import { InstallButton, useSystemAlerts } from './InstallApp';
import { sendPush } from './push';
import { MoreSheet } from './MoreSheet';
import { GuideTour } from './GuideTour';
import { adminGuide, memberGuide } from './guide';
import { useConfirm } from './ConfirmDialog';
function Badge({ review }: { review: Review }) { return <span className={`badge ${review.status === 'approved' ? 'green' : review.targetStatus === 'pending' || review.status === 'submitted' ? 'amber' : 'neutral'}`}><i />{statusLabel(review)}</span>; }
import { Modal } from './Modal';
import { PersonEditor, RoleEditor, CreateReviewDialog, ThresholdSettings, GradeBandSettings } from './editors';
import { ReviewDetail } from './ReviewDetail';
import { ReminderBar } from './ReminderBar';
import { buildReminders } from './reminders';
import { MemberProfileView } from './MemberProfileView';
import { reviseForm, applyTemplateToOpenReviews } from './referenceMigration';
export default function WorkspaceApp({ auth }: { auth?: AuthContext }) {
  const [loaded, setLoaded] = useState<LoadResult | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [gate, setGate] = useState<{ status: 'pending' | 'rejected' | 'inactive'; reason: string } | null>(null);
  const [mode, setMode] = useState<'me' | 'team'>('me');
  const [teamPending, setTeamPending] = useState(0);
  useEffect(() => {
    let active = true;
    setLoaded(null); setError(''); setGate(null);
    if (!auth?.user) return;
    // Accounts wait here until an admin approves them (Supabase backend; see supabase/org_approval.sql).
    fetchMyApproval(auth.user.id)
      .then(async a => { if (!active) return; if (a.status !== 'approved') { setGate({ status: a.status, reason: a.reason }); return; } setLoaded(await loadCloudWorkspace(auth.user!.id)); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [auth?.user?.id, attempt]);
  useEffect(() => { setTeamPending(loaded?.team ? pendingCount(loaded.team) : 0); }, [loaded]);
  // an accountable sees new requests from their team without reloading
  useEffect(() => {
    if (!auth?.user || !loaded?.team || mode !== 'me') return;
    const timer = window.setInterval(() => { loadCloudWorkspace(auth.user!.id).then(r => setTeamPending(r.team ? pendingCount(r.team) : 0)).catch(() => undefined); }, 90000);
    return () => window.clearInterval(timer);
  }, [auth?.user?.id, loaded, mode]);
  if (gate) return <PendingApproval status={gate.status} reason={gate.reason} auth={auth} recheck={() => setAttempt(n => n + 1)} />;
  if (error) return <div className="auth-screen"><div className="auth-layout" style={{ gridTemplateColumns: '1fr', maxWidth: 400 }}><main className="auth-panel"><div className="auth-card"><h1>Could not load workspace</h1><p role="alert" className="auth-error">{error}</p><p>{backend === 'local' ? 'Check that the PestCure server is running (npm run dev), then retry.' : 'Check your connection, then retry. If this is a new project, run the SQL files in supabase/.'}</p><button className="auth-submit" style={{ width: '100%' }} onClick={() => setAttempt(n => n + 1)}>Retry</button><button className="auth-switch" onClick={auth?.signOut}>Sign out</button></div></main></div></div>;
  if (!loaded) return <div className="auth-splash"><span className="auth-spinner" />Loading your workspace…</div>;
  const teamMode = mode === 'team' && Boolean(loaded.team);
  return <WorkspaceShell key={`${auth?.user?.id}-${teamMode ? 'team' : 'me'}`} initial={teamMode ? loaded.team! : loaded.workspace} initialRevision={loaded.revision} member={loaded.member} auth={auth} teamMode={teamMode} hasTeam={Boolean(loaded.team)} teamBadge={teamPending} onModeChange={m => { setMode(m); setAttempt(n => n + 1); }} />;
}
function WorkspaceShell({ initial, initialRevision, member, auth, teamMode = false, hasTeam = false, teamBadge = 0, onModeChange }: { initial: Workspace; initialRevision: number; member?: MemberContext; auth?: AuthContext; teamMode?: boolean; hasTeam?: boolean; teamBadge?: number; onModeChange?: (m: 'me' | 'team') => void }) {
  const [confirm, confirmDialog] = useConfirm();
  const [data, setData] = useState(() => reconcileCalendar(withReportData(member ? initial : trimEmployeeRows(applySampleTargets(applySampleAvatars(normalizeRoleNames(ensureExtraRoles(initial))))))));
  const revision = useRef(initialRevision);
  const queue = useRef(Promise.resolve());
  const saved = useRef(JSON.stringify(initial));
  const snap = useRef(snapshotOf(initial));
  const pendingSaves = useRef(0);
  const failed = useRef(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<View>(MINIMAL_UI ? 'Users' : 'Overview');
  const demo = data.reportData?.demoReviews ?? [];
  const [reportMember, setReportMember] = useState('');
  const [reportReturn, setReportReturn] = useState<View | null>(null);
  const currentWeek = () => cycleStart(todayIST(), data.calendar?.startDay ?? 1);
  const [week, setWeek] = useState(currentWeek);
  const [clock, setClock] = useState(todayIST());
  useEffect(() => { setWeek(cycleStart(todayIST(), data.calendar?.startDay ?? 1)); }, [data.calendar?.startDay]);
  useEffect(() => { const tick = () => { const date = todayIST(); if (clock !== date) { setClock(date); setWeek(cycleStart(date, data.calendar?.startDay ?? 1)); setSelected(null); } setData(d => reconcileCalendar(d)); }; const timer = window.setInterval(tick, 1000); window.addEventListener('focus', tick); document.addEventListener('visibilitychange', tick); return () => { clearInterval(timer); window.removeEventListener('focus', tick); document.removeEventListener('visibilitychange', tick); }; }, [data.calendar?.startDay, clock]);
  const authUser = auth?.user ?? null;
  const lockedActor = teamMode ? 'admin' : member ? member.personId : authUser ? 'admin' : null;
  const [previewActor, setPreviewActor] = useState('admin');
  const canImpersonate = !member && (lockedActor === null || lockedActor === 'admin');
  const actor = canImpersonate ? previewActor : lockedActor;
  const setActor = setPreviewActor;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [chip, setChip] = useState<'all' | 'action' | 'overdue'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [personEditor, setPersonEditor] = useState<Person | 'new' | null>(null);
  const [roleEditor, setRoleEditor] = useState<Role | null>(null);
  const [customPerson, setCustomPerson] = useState<Person | null>(null);
  const [draftReviewEditor, setDraftReviewEditor] = useState<Review | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)');
    const resize = () => { if (!media.matches) setMobile(false); };
    media.addEventListener('change', resize);
    return () => media.removeEventListener('change', resize);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = requestAnimationFrame(() => sidebarRef.current?.querySelector<HTMLButtonElement>('.drawer-close')?.focus());
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setMobile(false); }
      if (event.key !== 'Tab') return;
      const items = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('button, a[href]') ?? []).filter(el => el.getClientRects().length && getComputedStyle(el).display !== 'none');
      const first = items[0], last = items.at(-1);
      if (!sidebarRef.current?.contains(document.activeElement)) { event.preventDefault(); first?.focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { cancelAnimationFrame(focusFrame); document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keyboard); previousFocus?.focus(); };
  }, [mobile]);
  const [notice, setNotice] = useState('');
  const [recurringKind, setRecurringKind] = useState<'all' | 'daily' | 'monthly'>('all');
  const [saveError, setSaveError] = useState('');
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [view, selected, profileId]);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const admin = actor === 'admin';
  /** The real workspace admin. An accountable in team view is `admin` for approvals only. */
  const fullAdmin = admin && !teamMode;
  const actorName = admin ? (authUser ? authUser.name : 'Admin') : data.people.find(p => p.id === actor)?.name ?? authUser?.name ?? 'Member';
  const actorAvatar = data.people.find(p => p.id === actor)?.avatarUrl ?? authUser?.avatarUrl;
  const allowedViews = MINIMAL_UI ? [...navFor(admin, teamMode), 'Settings'] : null;
  const mobileNav = (teamMode ? TEAM_NAV : admin ? ['Performance', 'Weekly reviews', 'Approvals', 'Users', 'Org chart'] : MEMBER_NAV).filter(n => n !== 'Org chart' || orgSupported);
  useEffect(() => { if (allowedViews && !allowedViews.includes(view)) setView(homeView(admin, teamMode)); }, [allowedViews, view, admin]);
  useEffect(() => {
    if (!authUser) return;
    if (member) {
      // Member / accountable write path: send only what changed, through the guarded RPCs.
      const { patch, next, changed } = diffPatch(snap.current, data, teamMode ? APPROVER_KEYS : MEMBER_KEYS);
      if (!changed) return;
      const waitingNow = teamMode ? 0 : newlyWaiting(snap.current, patch);
      snap.current = next;
      pendingSaves.current++; setSaving(true);
      queue.current = queue.current.then(async () => {
        if (failed.current) return;
        try { await saveScopedChanges(teamMode ? 'approver' : 'member', patch); setSaveError(''); if (waitingNow) void sendPush({ kind: 'accountable', text: `${actorName} has ${waitingNow === 1 ? 'something' : waitingNow + ' items'} waiting for your approval` }); }
        catch (e) { failed.current = true; setSaveError('Save failed: ' + (e as Error).message + ' Reload to get the latest version.'); }
      }).finally(() => { pendingSaves.current--; if (!pendingSaves.current) setSaving(false); });
      return;
    }
    const payload = JSON.stringify(data);
    if (payload === saved.current) return;
    saved.current = payload;
    pendingSaves.current++; setSaving(true);
    queue.current = queue.current.then(async () => {
      if (failed.current) return;
      try { revision.current = await saveCloudWorkspace(authUser.id, JSON.parse(payload), revision.current); setSaveError(''); }
      catch (e) { failed.current = true; setSaveError('Cloud save failed: ' + (e as Error).message + ' Download a backup before reloading. Further saving is paused.'); }
    }).finally(() => { pendingSaves.current--; if (!pendingSaves.current) setSaving(false); });
  }, [data, authUser?.id, member, teamMode]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (pendingSaves.current || failed.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  useEffect(() => { const media = window.matchMedia('(prefers-color-scheme: dark)'); const listener = () => setSystemDark(media.matches); media.addEventListener('change', listener); return () => media.removeEventListener('change', listener); }, []);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 4500); return () => clearTimeout(timer); }, [notice]);
  const theme = data.theme === 'system' ? systemDark ? 'dark' : 'light' : data.theme;
  const navigate = (next: View) => { setView(next); setSelected(null); setProfileId(null); setQuery(''); setFilter('all'); setMobile(false); setReportReturn(null); };
  const change = (fn: (state: Workspace) => Workspace, message?: string, memberId?: string) => { setData(d => { const next = reconcileCalendar(fn(d)); return message ? { ...next, activity: [{ id: uid(), text: `${actorName}: ${message}`, at: new Date().toISOString(), memberId }, ...next.activity].slice(0, 150) } : next; }); if (message) setNotice(message); };
  const saveReport: SaveReport = report => change(d => appendReport(d, report), 'Report saved');
  const filteredRoles = data.roles.filter(role => `${role.name} ${role.department}`.toLowerCase().includes(query.toLowerCase()));
  const people = data.people.filter(p => admin || p.id === actor);
  const reviews = data.reviews.filter(r => r.week === week && (r.periodKind ?? 'weekly') === 'weekly' && (admin || r.memberId === actor));
  const pendingTargetChanges = (data.targetChangeRequests ?? []).filter(r => admin ? ['requested','submitted'].includes(r.status) : r.memberId === actor && ['requested','edit-approved','submitted'].includes(r.status));
  const pendingUnlocks = (data.lateRequests ?? []).filter(r => r.status === 'pending' && (admin || r.memberId === actor));
  const reminders = buildReminders(data, admin ? null : actor, admin);
  const pending = data.reviews.filter(r => (admin || r.memberId === actor) && (r.targetStatus === 'pending' || r.status === 'submitted'));
  // first-time walkthrough: role-specific for members, a short admin one for the admin; shown once per person per role
  const guideSelf = teamMode ? null : member ? data.people.find(p => p.id === member.personId) : null;
  const guideRole = guideSelf ? data.roles.find(r => r.id === guideSelf.roleId) : undefined;
  const guideKey = !authUser || teamMode ? null : member ? (guideSelf && guideRole ? `pestcure_guide_${authUser.id}_${guideRole.id}` : null) : `pestcure_guide_${authUser.id}_admin`;
  const guideCards = useMemo(() => !guideKey ? [] : guideSelf && guideRole ? memberGuide({ name: guideSelf.name, roleName: guideRole.name, department: guideRole.department, fields: guideSelf.fields ?? guideRole.fields, hasTeam }) : adminGuide(authUser?.name ?? ''), [guideKey, guideSelf, guideRole, hasTeam, authUser?.name]);
  useEffect(() => { if (!guideKey) return; try { if (!localStorage.getItem(guideKey)) setGuideOpen(true); } catch { /* storage unavailable: no auto-open */ } }, [guideKey]);
  const closeGuide = () => { setGuideOpen(false); if (guideKey) { try { localStorage.setItem(guideKey, '1'); } catch { /* ignore */ } } };
  const alertItems = useMemo(() => admin ? pending.map(r => ({ id: `p-${r.id}-${r.status}-${r.targetStatus}`, text: `${data.people.find(x => x.id === r.memberId)?.name ?? 'A member'} is waiting for your approval` })) : (data.notifications ?? []).filter(n => n.memberId === actor).map(n => ({ id: n.id, text: n.text })), [admin, pending, data.notifications, data.people, actor]);
  useSystemAlerts(alertItems);
  const approved = reviews.filter(r => r.status === 'approved');
  const scored = reviews.map(score).filter((n): n is number => n !== null);
  const average = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;
  const colors = data.thresholds.colors ?? DEFAULT_PERFORMANCE_COLORS;
  const tone = (n: number | null) => n === null ? 'neutral' : n >= data.thresholds.good ? 'green' : n >= data.thresholds.watch ? 'amber' : 'warm';
  /** Weekly / daily / monthly records of the same member that cover today, so the form can switch between them. */
  const periodSiblings = (r: Review) => (['weekly', 'daily', 'monthly'] as const).map(kind => {
    const mine = data.reviews.filter(x => x.memberId === r.memberId && (x.periodKind ?? 'weekly') === kind);
    return { kind, review: (r.periodKind ?? 'weekly') === kind ? r : kind === 'weekly' ? mine.find(x => x.week === currentWeek()) : mine.sort((p, q) => q.week.localeCompare(p.week))[0] };
  }).filter(p => p.review);
  const openReview = (r: Review) => { setSelected(r.id); setView('Weekly reviews'); setWeek((r.periodKind ?? 'weekly') === 'weekly' ? r.week : currentWeek()); };
  const active = [...data.reviews, ...(admin ? demo : [])].find(r => r.id === selected && (admin || r.memberId === actor));
  const download = (payload: string, filename: string, mime: string) => { const url = URL.createObjectURL(new Blob([payload], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const exportReviews = () => download(reviewCsv(reviews, data.people), `pestcure-reviews-${week}.csv`, 'text/csv;charset=utf-8');
  const updateReview = (next: Review, message?: string) => { try { const previous = data.reviews.find(r => r.id === next.id)!; guardReviewUpdate(previous, next); change(d => { const prior = d.reviews.find(r => r.id === next.id)!; const saved = { ...guardReviewUpdate(prior, next), updatedAt: new Date().toISOString() }; let state: Workspace = { ...d, reviews: d.reviews.map(r => r.id === saved.id ? saved : r) }; state = syncTargetRequest(state, prior, saved); if (prior.targetStatus === 'pending' && saved.targetStatus === 'approved') state.reviews = state.reviews.map(r => r.memberId === saved.memberId && r.week > saved.week && r.targetStatus === 'draft' && !Object.keys(r.values).length ? inheritTargets(r, saved) : r); return state; }, message, next.memberId); } catch (e) { setNotice((e as Error).message); } };
  const zohoReady = Boolean(data.zoho?.endpoint && (data.zoho?.mappings?.length ?? 0) > 0);
  const syncReviewFromZoho = async (r: Review) => {
    const cfg = data.zoho;
    if (!cfg?.endpoint) { setNotice('Add a Zoho sync endpoint in Settings first.'); return; }
    if (frozen(r)) { setNotice('This period is frozen. Zoho sync is disabled.'); return; }
    const zohoId = cfg.memberIds[r.memberId];
    if (!zohoId) { setNotice('Set this member’s Zoho ID in Settings → Zoho sync.'); return; }
    const roleId = data.people.find(p => p.id === r.memberId)?.roleId ?? '';
    try {
      setNotice('Syncing from Zoho…');
      const rows = await fetchZoho(cfg, data.people, { zohoId, from: r.week, to: plusDays(r.week, 6) });
      const row = rows.find(x => x.week === r.week) ?? rows[0];
      if (!row) { setNotice('Zoho returned no data for this period.'); return; }
      const { review: filledReview, filled } = applyZohoRow(r, roleId, row, cfg.mappings);
      if (!filled.length) { setNotice('No mapped Zoho values matched this form.'); return; }
      change(d => ({
        ...d,
        reviews: d.reviews.map(rev => (rev.id === filledReview.id ? filledReview : rev)),
        zoho: { ...d.zoho!, lastSyncAt: new Date().toISOString() },
      }), `Synced ${filled.length} value${filled.length === 1 ? '' : 's'} from Zoho`, r.memberId);
    } catch (e) { setNotice((e as Error).message); }
  };
  const needsAction = (r: Review) => !r.source && (admin ? r.targetStatus === 'pending' || r.status === 'submitted' : ['draft', 'changes'].includes(r.targetStatus) || (r.targetStatus === 'approved' && ['draft', 'changes'].includes(r.status)));
  const isOverdue = (r: Review) => lateFillable(r);
  const scopeReviews = data.reviews.filter(r => (r.periodKind ?? 'weekly') === 'weekly' && (admin || r.memberId === actor) && !r.source);
  const actionCount = scopeReviews.filter(r => needsAction(r) && !frozen(r)).length;
  const overdueCount = scopeReviews.filter(isOverdue).length;
  const listed = chip === 'all' ? reviews : scopeReviews.filter(r => chip === 'action' ? needsAction(r) && !frozen(r) : isOverdue(r)).sort((a, b) => b.week.localeCompare(a.week));
  const visibleReviews = listed.filter(r => (memberFilter === 'all' || r.memberId === memberFilter) && (() => { const p = data.people.find(p => p.id === r.memberId)!; return `${p.name} ${data.roles.find(role => role.id === p.roleId)?.name}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || (filter === 'pending' ? r.targetStatus === 'pending' || r.status === 'submitted' : filter === 'complete' ? r.status === 'approved' : r.targetStatus !== 'pending' && r.status !== 'submitted' && r.status !== 'approved')); })());
  const reviewTable = (items: Review[]) => <div className="table-scroll stack-table"><table><thead><tr><th>TEAM MEMBER</th><th>REVIEW STATUS</th><th>KPI ACHIEVEMENT</th><th>FORM COMPLETION</th><th /></tr></thead><tbody>{items.map(r => { const p = data.people.find(p => p.id === r.memberId)!; const result = score(r); return <tr key={r.id}><td><button className="person-link" onClick={() => openReview(r)}><Avatar name={p.name} url={p.avatarUrl} /><span><strong>{p.name}</strong><small>{data.roles.find(role => role.id === p.roleId)?.name}{chip !== 'all' && ` · ${weekLabel(r.week)}`}</small></span></button></td><td data-label="Status"><Badge review={r} /></td><td data-label="Achievement"><div className={`performance ${tone(result)}`}><strong>{result === null ? '—' : `${result}%`}</strong><span className="bar"><i style={{ width: `${Math.min(100, result ?? 0)}%` }} /></span></div></td><td data-label="Completion"><span className="completion">{completion(r)}% <span>filled</span></span></td><td><button className="icon-button" aria-label={`Open ${p.name} review`} onClick={() => openReview(r)}><ArrowRight size={17} /></button></td></tr>; })}</tbody></table>{!items.length && <Empty title="No reviews here yet" text="Create a weekly review from an assigned role to get started." action={admin ? () => setCreateOpen(true) : undefined} />}</div>;
  return <div className={`workspace ${data.navCollapsed ? "nav-collapsed" : ""}`} data-theme={theme} style={{'--green':colors.good,'--amber':colors.watch,'--red':colors.support,'--neutral-performance':colors.neutral} as React.CSSProperties}>
    {mobile && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobile(false)} />}
    <aside id="workspace-navigation" ref={sidebarRef} onTransitionEnd={e => { if (mobile && e.target === e.currentTarget && !e.currentTarget.contains(document.activeElement)) e.currentTarget.querySelector<HTMLButtonElement>('.drawer-close')?.focus(); }} aria-label="Workspace navigation" className={`sidebar ${mobile ? 'open' : ''}`}><button className="drawer-close" aria-label="Close menu" onClick={() => setMobile(false)}><X size={20} /></button><button className="collapse-nav" aria-label={data.navCollapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => change(d => ({ ...d, navCollapsed: !d.navCollapsed }))}>{data.navCollapsed ? <PanelLeftOpen size={17}/> : <PanelLeftClose size={17}/>}</button><a href="#" className="brand" onClick={e => { e.preventDefault(); navigate(homeView(admin, teamMode)); }}><img src="/pestcure-logo.png" alt="PestCure" /></a><nav>{navigation.filter(n => MINIMAL_UI ? navFor(admin, teamMode).includes(n.name) : (admin || !['Users', 'Roles', 'Performance', 'Achievement breakdown'].includes(n.name))).map(n => <button key={n.name} aria-label={n.name} title={data.navCollapsed ? n.name : undefined} className={view === n.name ? 'active' : ''} onClick={() => navigate(n.name)}><n.icon size={19} /><span>{n.name}</span>{n.name === 'Missed entries' && pendingUnlocks.length > 0 && <b>{pendingUnlocks.length}</b>}{n.name === 'Approvals' && pending.length + pendingTargetChanges.length > 0 && <b>{pending.length + pendingTargetChanges.length}</b>}</button>)}</nav><div className="sidebar-bottom"><button title={data.navCollapsed ? 'Settings' : undefined} className={view === 'Settings' ? 'active' : ''} onClick={() => navigate('Settings')}><Settings2 size={18} /><span>Settings</span></button><button title={data.navCollapsed ? 'How it works' : undefined} onClick={() => setGuideOpen(true)}><CircleHelp size={18} /><span>How it works</span></button><div className="sidebar-profile"><Avatar name={actorName} url={actorAvatar} small /><span><strong>{actorName}</strong><small>{teamMode ? 'Team approvals' : admin ? 'Workspace admin' : 'Team member'}</small></span><span className="online-dot" /></div></div></aside>
    <div className="main-shell" inert={mobile || undefined}>{confirmDialog}<header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" onClick={() => setMobile(true)} aria-label="Open navigation" aria-expanded={mobile} aria-controls="workspace-navigation"><Menu size={21} /></button><strong>{view}</strong></div><div className="topbar-actions">{hasTeam && onModeChange && <div className="mode-switch" role="group" aria-label="Switch view"><button className={!teamMode ? 'on' : ''} onClick={() => teamMode && onModeChange('me')}>My work</button><button className={teamMode ? 'on' : ''} onClick={() => !teamMode && onModeChange('team')}>My team{teamBadge > 0 && <b>{teamBadge}</b>}</button></div>}{fullAdmin && view === 'Weekly reviews' && !active && <button className="icon-button topbar-create" aria-label="Create review" title="Create review" onClick={() => setCreateOpen(true)}><Plus size={19} /></button>}<button className="icon-button" aria-label="Toggle color theme" onClick={() => change(d => ({ ...d, theme: theme === 'light' ? 'dark' : 'light' }))}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button><InstallButton />{(!MINIMAL_UI || admin) && <button className="icon-button notification-button" aria-label="View pending approvals" onClick={() => navigate('Approvals')}><Bell size={19} />{pending.length > 0 && <i />}</button>}{!admin && actor && <NotificationBell personId={actor} notifications={(data.notifications ?? []).filter(n => n.memberId === actor)} onOpen={reviewId => { const r = data.reviews.find(x => x.id === reviewId); if (r) openReview(r); else navigate('Dashboard'); }} />}<span className="topbar-divider" />{authEnabled && authUser ? <>{previewActor !== 'admin' && lockedActor === 'admin' && <button className="text-button" onClick={() => { setActor('admin'); setWeek(currentWeek()); navigate(homeView(true)); }}>Exit member view</button>}<div className="account-chip"><Avatar name={actorName} url={actorAvatar} small /><span><strong>{actorName}</strong><small>{authUser.email}</small></span><button aria-label="Sign out" title="Sign out" disabled={saving || Boolean(saveError)} onClick={() => auth?.signOut()}><LogOut size={15} /></button></div></> : <label className="actor-select"><Avatar name={actorName} url={actorAvatar} small /><select aria-label="Preview as user" value={actor} onChange={e => { setActor(e.target.value); setWeek(currentWeek()); navigate(homeView(e.target.value === 'admin')); }}><option value="admin">Admin preview</option>{data.people.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>}</div></header>
    <main data-calendar-date={clock}>{!active && !['Settings', 'Users', 'Roles'].includes(view) && <ReminderBar reminders={reminders} openReview={id => { const r = data.reviews.find(x => x.id === id); if (r) openReview(r); }} openView={v => navigate(v)} />}{saveError && <div className="error-banner" role="alert">{saveError}<button onClick={() => download(JSON.stringify(data, null, 2), 'pestcure-backup.json', 'application/json')}>Download backup</button></div>}
      {admin && <div hidden={view !== 'Performance'}><PerformanceScreen saveReport={saveReport} key={reportMember} data={data} demo={demo} memberId={reportMember} open={r => { setReportReturn('Performance'); openReview(r); }} /></div>}
      {admin && view === 'Achievement breakdown' && <AchievementBreakdownScreen saveReport={saveReport} data={data} demo={demo} open={r => { setReportReturn('Achievement breakdown'); openReview(r); }} />}
      {view === 'Attendance' && <AttendanceScreen data={data} actor={actor} change={change} />}
      {view === 'Overview' && <>{!data.calendar && <div className="source-banner"><strong>Set your review calendar</strong><p>Choose a weekly cycle to enable midnight rollover and missed-entry tracking.</p>{admin && <button className="button" onClick={() => navigate('Settings')}>Set up schedule</button>}</div>}
        <div className="page-heading"><div><div className="eyebrow">YOUR WORK, IN FOCUS</div><h1>{admin ? 'Team overview' : 'My overview'}</h1><p>{admin ? 'A clear picture of your people, priorities and progress.' : `Welcome back, ${actorName.split(' ')[0]}. Let’s make this week count.`}</p></div><button className="button primary" onClick={() => admin ? setCreateOpen(true) : reviews[0] ? openReview(reviews[0]) : setNotice('Ask your admin to create this week’s review.')}><Plus size={17} />{admin ? 'Create review' : 'Open my review'}</button></div>
        <div className="overview-toolbar"><div className="segmented"><button className={week === currentWeek() ? 'selected' : ''} onClick={() => setWeek(currentWeek())}>This week</button><button className={week === shiftWeek(currentWeek(), -1) ? 'selected' : ''} onClick={() => setWeek(shiftWeek(currentWeek(), -1))}>Last week</button></div><WeekPicker week={week} setWeek={setWeek} /></div>
        <section className="stats-grid"><Stat label={admin ? 'Team members' : 'My KPIs'} value={admin ? String(people.length) : String(kpiCount(reviews[0]?.fields ?? []))} sub={admin ? `${data.roles.length} roles available` : 'Defined for your weekly review'} icon={<Users size={19} />} /><Stat label="Reviews completed" value={`${approved.length}`} suffix={`/ ${reviews.length}`} sub={reviews.length ? `${Math.round(approved.length / reviews.length * 100)}% of this week’s reviews` : 'No reviews in this period'} icon={<CheckCheck size={19} />} /><Stat label="Average achievement" value={average === null ? '—' : `${average}%`} sub={scored.length ? `Across ${scored.length} approved target sets` : 'Available after target approval'} icon={<TrendingUp size={19} />} /><Stat label="Awaiting approval" value={String(pending.length)} sub="Target proposals & submitted reviews" icon={<Clock3 size={19} />} accent /></section>
        <div className="overview-grid"><section className="panel performance-panel"><div className="panel-heading"><div><h2>{admin ? 'Team performance' : 'My performance'}</h2></div><span className="mini-tag">{reviews.length} reviews</span></div><div className="chart"><div className="chart-scale"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-plot"><div className="chart-lines"><i /><i /><i /><i /><i /></div><div className="chart-bars">{reviews.map(r => { const p = data.people.find(p => p.id === r.memberId)!; const s = score(r); return <button className="chart-column" key={r.id} onClick={() => openReview(r)} aria-label={`${p.name}: ${s === null ? 'targets not approved' : `${s}% achievement`}`}><div className="bar-track"><span className="chart-value">{s === null ? '—' : `${s}%`}</span><div className={`chart-fill ${tone(s)}`} style={{ height: `${s === null ? 3 : Math.max(3, Math.min(100, s))}%` }} /></div><span>{p.name.split(' ')[0]}</span></button>; })}</div></div></div><StatusLegend good={data.thresholds.good} watch={data.thresholds.watch} /></section>
        <section className="panel action-panel"><div className="panel-heading"><div><h2>Needs your attention</h2></div><span className="count-circle">{pending.length + reviews.filter(r => r.targetStatus === 'draft' || r.targetStatus === 'changes').length}</span></div><div className="attention-list">{[...pending, ...reviews.filter(r => r.targetStatus === 'draft' || r.targetStatus === 'changes')].slice(0, 3).map(r => { const p = data.people.find(p => p.id === r.memberId)!; return <button className="attention-row" key={r.id} onClick={() => openReview(r)}><span className="attention-icon"><Target size={18} /></span><span><strong>{r.targetStatus === 'draft' ? 'Set weekly targets' : statusLabel(r)}</strong><small>{p.name} · {weekLabel(r.week).split(' – ')[0]}</small></span><ChevronRight size={16} /></button>; })}{!pending.length && !reviews.some(r => ['draft', 'changes'].includes(r.targetStatus)) && <div className="all-clear"><CheckCheck size={27} /><strong>You’re all caught up</strong><p>Nothing is waiting for your attention.</p></div>}</div><button className="panel-link" onClick={() => navigate('Approvals')}>View approval queue <ArrowRight size={16} /></button></section></div>
        <section className="panel"><div className="panel-heading"><div><h2>{admin ? 'Weekly review tracker' : 'My weekly review'}</h2></div><button className="text-button" onClick={() => navigate('Weekly reviews')}>View all reviews <ArrowRight size={16} /></button></div>{reviewTable(reviews)}</section>
        <div className="bottom-grid"><section className="panel activity-panel"><div className="panel-heading"><h2>Recent activity</h2><span className="mini-tag">Workspace log</span></div>{data.activity.filter(a => admin || a.memberId === actor).slice(0, 3).map(a => <div className="activity-item" key={a.id}><span className="activity-dot" /><span>{a.text}<small>{new Date(a.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></span></div>)}{!data.activity.filter(a => admin || a.memberId === actor).length && <p className="padded muted">Your updates will appear here.</p>}</section><section className="workflow-card"><span className="eyebrow">A BETTER WEEK STARTS HERE</span><h2>Clear targets.<br />Meaningful progress.</h2><button onClick={() => admin ? navigate('Roles') : setGuideOpen(true)}>{admin ? 'Explore roles' : 'See the review workflow'} <ArrowRight size={16} /></button><div className="abstract-rings" aria-hidden="true"><i /><i /><i /></div></section></div>
      </>}
      {view === 'Weekly reviews' && !active && <><PageHeading title="Weekly reviews" action={fullAdmin ? () => setCreateOpen(true) : undefined} actionLabel="Create review" /><div className="quick-chips" role="tablist" aria-label="Quick filters">{([['all', 'All this week', null], ['action', admin ? 'Needs my approval' : 'Needs my action', actionCount], ['overdue', 'Overdue', overdueCount]] as const).map(([id, label, count]) => <button key={id} role="tab" aria-selected={chip === id} className={chip === id ? 'on' : ''} onClick={() => setChip(id)}>{label}{count !== null && <b className={count ? 'hot' : ''}>{count}</b>}</button>)}</div><div className="list-toolbar"><SearchBox query={query} setQuery={setQuery} placeholder="Search members or roles…" />{admin && <select aria-label="Filter by member" value={memberFilter} onChange={e => setMemberFilter(e.target.value)}><option value="all">All members</option>{data.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}<select aria-label="Filter review status" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option><option value="pending">Awaiting approval</option><option value="progress">In progress</option><option value="complete">Completed</option></select>{chip === 'all' && <WeekPicker week={week} setWeek={setWeek} />}<button className="button" onClick={exportReviews}><ArrowDownToLine size={16} />Export</button></div><section className="panel">{reviewTable(visibleReviews)}</section></>}
      {view === 'Weekly reviews' && active && <ReviewDetail key={active.id} review={active} openPeriod={openReview} periods={periodSiblings(active)} person={data.people.find(p => p.id === active.memberId)!} role={data.roles.find(r => r.id === data.people.find(p => p.id === active.memberId)!.roleId)!} admin={admin} update={updateReview} targetRequest={[...(data.targetChangeRequests ?? [])].reverse().find(q => q.reviewId === active.id)} requestTargetChange={reason => { const next = requestTargetChange(data, active.id, actor, reason); change(() => next, 'Target update permission requested', active.memberId); }} back={() => reportReturn ? navigate(reportReturn) : active.periodKind && active.periodKind !== "weekly" ? navigate("Daily & monthly") : setSelected(null)} tone={tone} good={data.thresholds.good} watch={data.thresholds.watch} customize={() => { if (frozen(active)) setNotice('This period is frozen. Use Missed entries for approved late responses.'); else setDraftReviewEditor(active); }} zohoReady={admin && zohoReady && !frozen(active)} syncZoho={() => syncReviewFromZoho(active)} bands={data.gradeBands?.length ? data.gradeBands : DEFAULT_GRADE_BANDS} notify={n => { const to = data.people.find(x => x.id === n.memberId)?.email; if (to) void sendPush({ kind: 'member', email: to, text: n.text }); change(d => ({ ...d, notifications: [{ id: uid(), at: new Date().toISOString(), ...n }, ...(d.notifications ?? [])].slice(0, 300) })); }} />}
      {view === 'Org chart' && <OrgChartScreen roles={data.roles} canEdit={fullAdmin} />}
      {view === 'Users' && fullAdmin && <AssignReportsScreen data={data} week={currentWeek()} change={change} open={openReview} previewAs={id => { setActor(id); navigate(homeView(false)); }} />}
      {view === 'Roles' && admin && <><PageHeading title="Roles" action={() => { setCustomPerson(null); setRoleEditor({ id: uid(), name: '', department: '', description: '', fields: [newField()] }); }} actionLabel="Create role" /><div className="list-toolbar template-toolbar"><SearchBox query={query} setQuery={setQuery} placeholder="Search roles…" /><span className="muted">{filteredRoles.length} {filteredRoles.length === 1 ? 'role' : 'roles'}</span></div>{!filteredRoles.length && <Empty title="No matching roles" text="Try another search." />}<div className="template-grid">{filteredRoles.map((role, i) => <section className="panel template-card" key={role.id}><div className="template-card-top"><span className={`template-icon tone-${i % 3}`}><ClipboardList size={23} /></span><span className="mini-tag">{data.people.filter(p => p.roleId === role.id).length} assigned</span></div><h2>{role.name}</h2><div className="template-footer"><span>{new Set(role.fields.map(f => f.kra)).size} KRAs · {kpiCount(role.fields)} KPIs</span><button className="text-button" aria-label={`Edit ${role.name}`} onClick={() => { setCustomPerson(null); setRoleEditor(structuredClone(role)); }}>Edit <ArrowRight size={16} /></button></div></section>)}</div></>}
      {view === 'Approvals' && <><TargetChangeQueue data={data} admin={admin} actor={actor} change={change} open={openReview} />{pendingUnlocks.length > 0 && <div className="source-banner"><strong>{pendingUnlocks.length} entry unlock requests pending</strong><button className="button" onClick={() => navigate('Missed entries')}>Review unlock requests</button></div>}<PageHeading title={admin ? "Approval queue" : "My approvals"} /><section className="panel">{pending.map(r => { const p = data.people.find(p => p.id === r.memberId)!; return <div className="approval-row" key={r.id}><Avatar name={p.name} url={p.avatarUrl} /><div><strong>{p.name}</strong><p>{r.targetStatus === 'pending' ? 'Weekly target proposal' : 'Completed weekly review'} · {weekLabel(r.week)}</p></div><Badge review={r} /><button className="button" onClick={() => openReview(r)}>Review <ArrowRight size={16} /></button></div>; })}{!pending.length && <Empty title="All caught up" text="Submitted targets and reviews will appear here." />}</section></>}
      {view === 'Dashboard' && !admin && actor && <MemberDashboard data={data} personId={actor} statusOf={statusLabel} open={openReview} go={v => navigate(v)} goKind={kind => { setRecurringKind(kind); navigate('Daily & monthly'); }} />}
      {view === 'Daily & monthly' && <RecurringScreen key={recurringKind} initialKind={recurringKind} data={data} actor={actor} open={openReview} />}
      {view === 'Missed entries' && <MissedScreen data={data} actor={actor} change={change} />}
      {view === 'Settings' && <><PageHeading title="Workspace settings" />{fullAdmin && <CalendarSettings data={data} change={change} />}{fullAdmin && !MINIMAL_UI && <AttendanceSettings data={data} save={patch => change(d => ({ ...d, ...patch }), 'Attendance settings updated')} />}{fullAdmin && !MINIMAL_UI && <ZohoSettings data={data} save={cfg => change(d => ({ ...d, zoho: cfg }), 'Zoho sync settings updated')} />}<section className="panel settings-panel"><h2>Appearance</h2><div className="theme-options">{(['light', 'dark', 'system'] as const).map(t => <button key={t} className={data.theme === t ? 'chosen' : ''} onClick={() => change(d => ({ ...d, theme: t }))}><span className={`theme-preview ${t}`}><i /><i /><i /></span><strong>{t[0].toUpperCase() + t.slice(1)}</strong>{data.theme === t && <Check size={16} />}</button>)}</div></section>{fullAdmin && <ThresholdSettings data={data} save={(thresholds) => change(d => ({ ...d, thresholds }), 'Performance colors updated')} />}{fullAdmin && <GradeBandSettings data={data} save={(gradeBands) => change(d => ({ ...d, gradeBands }), 'Achievement grade bands updated')} />}{fullAdmin && !MINIMAL_UI && <ReportArchive data={data} change={change} />}<section className="panel settings-panel"><h2>Workspace data</h2><button className="button" onClick={() => download(JSON.stringify(fullAdmin ? data : { ...data, people, reviews: data.reviews.filter(r => r.memberId === actor), activity: data.activity.filter(a => a.memberId === actor), lateRequests: data.lateRequests?.filter(r => r.memberId === actor), reportData: undefined, savedReports: undefined, legacy: undefined, referenceBackup: undefined, reviewRevisions: undefined }, null, 2), 'pestcure-workspace-backup.json', 'application/json')}><ArrowDownToLine size={16} />Download backup</button>{fullAdmin && <><button className="button" style={{ marginTop: 10 }} onClick={async () => { if (!await confirm({ title: 'Remove all sample data?', message: 'All sample users, reviews and demo data are removed. Your roles and settings are kept. Download a backup first.', confirmLabel: 'Remove', destructive: true })) return; change(d => ({ ...d, people: [], reviews: [], reviewRevisions: [], lateRequests: [], targetChangeRequests: [], attendance: [], savedReports: [], reportData: undefined }), 'Sample data cleared — roles kept'); navigate(homeView(true)); }}><Trash2 size={16} />Clear sample data (keep roles)</button><div style={{ marginTop: 18 }}><h3 style={{ fontSize: 15, margin: '0 0 4px' }}>Demo team for testing</h3><p className="small-note" style={{ margin: '0 0 10px' }}>Adds 15 people from the org chart (emails end with {'@demo.pestcure.test'}), each on their own role, with 4 finished weeks and this week in every state: not started, targets proposed, in progress, submitted, sent back and approved, plus a few target-change and unlock requests. They are workspace people, not logins. Run it again to refresh, or remove it when you are done.</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="button primary" onClick={() => { change(d => applyDemoData(d), 'Demo team loaded — open Weekly reviews, Approvals and Performance'); }}>Load demo data</button><button className="button" disabled={!data.people.some(isDemoPerson)} onClick={async () => { if (!await confirm({ title: 'Remove demo data?', message: 'The demo people and everything they filled in are removed. Real people are not touched.', confirmLabel: 'Remove', destructive: true })) return; change(d => removeDemoData(d), 'Demo data removed'); }}>Remove demo data</button></div></div></>}</section></>}
    </main></div>
    {guideOpen && guideCards.length > 0 && <GuideTour cards={guideCards} onDone={closeGuide} finishLabel={member ? 'Start' : 'Got it'} />}
    {moreOpen && <MoreSheet
      items={navigation.filter(n => (MINIMAL_UI ? navFor(admin, teamMode).includes(n.name) : (admin || !['Users', 'Roles', 'Performance', 'Achievement breakdown'].includes(n.name))) && !mobileNav.includes(n.name)).map(n => ({ name: n.name, icon: n.icon, active: view === n.name, badge: n.name === 'Approvals' ? pending.length + pendingTargetChanges.length : n.name === 'Missed entries' ? pendingUnlocks.length : 0 }))}
      user={{ name: actorName, avatarUrl: actorAvatar, subtitle: teamMode ? 'Team approvals' : admin ? 'Workspace admin' : 'Team member' }}
      onSelect={name => navigate(name as View)} onSettings={() => navigate('Settings')} onHelp={() => setGuideOpen(true)} settingsActive={view === 'Settings'}
      onSignOut={authEnabled && authUser ? () => auth?.signOut() : undefined} close={() => setMoreOpen(false)} />}
    <nav className="bottom-nav" aria-label="Quick navigation">
      {navigation.filter(n => mobileNav.includes(n.name)).sort((x, y) => mobileNav.indexOf(x.name) - mobileNav.indexOf(y.name)).map(n => <button key={n.name} className={view === n.name ? 'active' : ''} aria-label={n.name} onClick={() => navigate(n.name)}><n.icon size={21} /><span>{n.name === 'Daily & monthly' ? 'Daily' : n.name === 'Performance' ? 'Stats' : n.name === 'Weekly reviews' ? 'Reviews' : n.name === 'Missed entries' ? 'Missed' : n.name === 'Org chart' ? 'Org' : n.name}</span>{n.name === 'Approvals' && pending.length + pendingTargetChanges.length > 0 && <b>{pending.length + pendingTargetChanges.length}</b>}{n.name === 'Missed entries' && pendingUnlocks.length > 0 && <b>{pendingUnlocks.length}</b>}</button>)}
      <button aria-label="More" onClick={() => setMoreOpen(true)}><Menu size={21} /><span>More</span></button>
    </nav>
    {notice && <div className="toast" role="status"><Check size={17} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {draftReviewEditor && admin && <RoleEditor role={{ id: draftReviewEditor.id, name: 'Weekly review', department: '', description: '', fields: draftReviewEditor.fields.map(f => ({ ...f, target: draftReviewEditor.targets[f.id] ?? f.target })) }} customName={data.people.find(p => p.id === draftReviewEditor.memberId)!.name} currentDraft close={() => setDraftReviewEditor(null)} save={role => { if (frozen(draftReviewEditor)) { setNotice('This period is now frozen.'); setDraftReviewEditor(null); return; } const revised = reviseForm(draftReviewEditor, role.fields); change(d => ({ ...d, reviewRevisions: [...(d.reviewRevisions ?? []), structuredClone(draftReviewEditor)], reviews: d.reviews.map(r => r.id === revised.id ? revised : r) }), 'Review form updated. Matching responses retained; targets require approval.', revised.memberId); setDraftReviewEditor(null); }} />}
    {personEditor && admin && <PersonEditor person={personEditor} roles={data.roles} people={data.people} close={() => setPersonEditor(null)} save={p => { const isNew = personEditor === 'new'; change(d => { const current = d.people.find(m => m.id === p.id); const roleChanged = current && current.roleId !== p.roleId; const updated = roleChanged ? { ...p, fields: undefined } : p; return { ...d, people: isNew ? [...d.people, updated] : d.people.map(m => m.id === p.id ? updated : m), reviews: isNew ? [...d.reviews, createReview(d.calendar ? { ...updated, fields: fieldsForPeriod(updated.fields ?? d.roles.find(r => r.id === p.roleId)!.fields, 'weekly') } : updated, d.roles.find(r => r.id === p.roleId)!, currentWeek())] : d.reviews }; }, isNew ? `${p.name} added with a weekly review` : `${p.name} updated. Existing reviews are preserved.`, p.id); setPersonEditor(null); }} />}
    {roleEditor && admin && <RoleEditor role={roleEditor} customName={customPerson?.name} close={() => { setRoleEditor(null); setCustomPerson(null); }} save={(role, applyOpen) => { change(d => { const affected = customPerson ? d.people.filter(p => p.id === customPerson.id) : d.people.filter(p => p.roleId === role.id && !p.fields); const updated = customPerson ? { ...d, people: d.people.map(p => p.id === customPerson.id ? { ...p, fields: role.fields } : p) } : { ...d, roles: d.roles.some(r => r.id === role.id) ? d.roles.map(r => r.id === role.id ? role : r) : [...d.roles, role] }; return applyOpen ? applyTemplateToOpenReviews(updated, affected, role.fields) : updated; }, `${customPerson ? customPerson.name + ' form' : role.name + ' role'} saved${applyOpen ? '; open reviews updated' : ' for future reviews'}`, customPerson?.id); setRoleEditor(null); setCustomPerson(null); }} />}
    {createOpen && admin && <CreateReviewDialog people={data.people} roles={data.roles} reviews={data.reviews} startDay={data.calendar?.startDay} defaultWeek={week} close={() => setCreateOpen(false)} save={(ids, period) => { change(d => ({ ...d, reviews: [...d.reviews, ...ids.filter(id => !d.reviews.some(r => r.memberId === id && r.week === period && (r.periodKind ?? 'weekly') === 'weekly')).map(id => { const p = d.people.find(p => p.id === id)!; const review = createReview(d.calendar ? { ...p, fields: fieldsForPeriod(p.fields ?? d.roles.find(r => r.id === p.roleId)!.fields, 'weekly') } : p, d.roles.find(r => r.id === p.roleId)!, period); return inheritTargets(review, latestApprovedReview(d, p.id, period)); })] }), `${ids.length} weekly ${ids.length === 1 ? 'review' : 'reviews'} created`); setWeek(period); setCreateOpen(false); navigate('Weekly reviews'); }} />}
  </div>;
}
function PageHeading({ title, description, action, actionLabel }: { title: string; description?: string; action?: () => void; actionLabel?: string }) { return <div className="page-heading"><div><h1>{title}</h1></div>{action && <button className={`button primary${actionLabel === 'Create review' ? ' desktop-only' : ''}`} onClick={action}><Plus size={17} />{actionLabel}</button>}</div>; }
function Stat({ label, value, suffix, sub, icon, accent }: { label: string; value: string; suffix?: string; sub: string; icon: React.ReactNode; accent?: boolean }) { return <section className={`stat-card ${accent ? 'accent' : ''}`}><div><span>{label}</span><span className="stat-icon">{icon}</span></div><strong>{value}<small>{suffix}</small></strong><p>{sub}</p></section>; }
function WeekPicker({ week, setWeek }: { week: string; setWeek: (s: string) => void }) { return <div className="week-picker"><button aria-label="Previous week" onClick={() => setWeek(shiftWeek(week, -1))}><ChevronLeft size={15} /></button><CalendarDays size={15} /><span>{weekLabel(week)}</span><button aria-label="Next week" onClick={() => setWeek(shiftWeek(week, 1))}><ChevronRight size={15} /></button></div>; }
function SearchBox({ query, setQuery, placeholder }: { query: string; setQuery: (s: string) => void; placeholder: string }) { return <label className="search-box"><Search size={17} /><input aria-label={placeholder} value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder} /></label>; }
function Empty({ title, text, action }: { title: string; text: string; action?: () => void }) { return <div className="empty-state"><ClipboardList size={30} /><h3>{title}</h3><p>{text}</p>{action && <button className="button" onClick={action}><Plus size={16} />Create review</button>}</div>; }





import './reference.css';
import './modern.css';
import './navigation.css';
import './redesign.css';
import './glass.css';
import './mobile.css';
import './features.css';
import './bars3d.css';







