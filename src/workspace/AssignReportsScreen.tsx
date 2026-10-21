import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, History, RefreshCw, UserCheck, UserX } from 'lucide-react';
import { createReview, kpiCount, uid, type Person, type Review, type Role, type Workspace } from './model';
import { cycleStart, fieldsForPeriod, plusDays, todayIST } from './schedule';
import { changeRole, setPersonActive } from './lifecycle';
import { useConfirm } from './ConfirmDialog';
import { inheritTargets, latestApprovedReview } from './targetGovernance';
import { authEnabled } from './auth';
import { Avatar, AvatarUpload } from './Avatar';
import { assignTemplate, fetchAppUsers, linkMember, type AppUser } from './appUsers';
import { approveUser, rejectUser, setUserActive, fetchOrg, orgSupported, seatAccountable, type OrgAssignment, type OrgPosition } from './orgApi';
import { ApprovalRequests, type ApproveChoice } from './ApprovalRequests';

type Change = (fn: (state: Workspace) => Workspace, message?: string, memberId?: string) => void;

export function AssignReportsScreen({
  data, week, change, open, previewAs,
}: {
  data: Workspace; week: string; change: Change; open: (r: Review) => void; previewAs: (id: string) => void;
}) {
  const [confirm, confirmDialog] = useConfirm();
  const [accounts, setAccounts] = useState<AppUser[] | null>(null);
  const [accountsError, setAccountsError] = useState('');
  const [pick, setPick] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [query, setQuery] = useState('');
  const [org, setOrg] = useState<{ positions: OrgPosition[]; assignments: OrgAssignment[] }>({ positions: [], assignments: [] });

  const load = React.useCallback(() => {
    if (!authEnabled) { setAccounts([]); return; }
    setAccountsError('');
    fetchAppUsers().then(setAccounts).catch(e => { setAccounts([]); setAccountsError(e.message || 'Could not load sign-ups.'); });
  }, []);
  useEffect(load, [load]);
  // seats are optional: if org_approval.sql has not been run yet, approvals still work with just a role
  useEffect(() => { if (orgSupported) fetchOrg().then(setOrg).catch(() => undefined); }, [accounts]);

  const roleFor = (id?: string | null) => data.roles.find(r => r.id === id);
  const personFor = (u: AppUser) => data.people.find(p => p.email.toLowerCase() === u.email.toLowerCase());
  const weeklyReviewFor = (personId?: string) => personId ? data.reviews.find(r => r.memberId === personId && r.week === week && (r.periodKind ?? 'weekly') === 'weekly') : undefined;

  const buildReview = (d: Workspace, person: Person, role: Role) => {
    const shaped = d.calendar ? { ...person, fields: fieldsForPeriod(person.fields ?? role.fields, 'weekly') } : person;
    return inheritTargets(createReview(shaped, role, week), latestApprovedReview(d, person.id, week));
  };

  /** Assign a template to a signed-up user: record it, create their workspace user, generate this week's report. */
  const assign = async (u: AppUser, slug: string, approval?: { positionId: string | null }) => {
    const role = data.roles.find(r => r.id === slug);
    if (!role) return;
    const before = data.people.find(p => p.email.toLowerCase() === u.email.toLowerCase());
    const moving = !approval && before && before.roleId !== slug;
    const startDay = data.calendar?.startDay ?? 1;
    const thisWeek = cycleStart(todayIST(), startDay);
    const scheduled = Boolean(moving && before && data.reviews.some(r => r.memberId === before.id && !r.source && (r.periodKind ?? 'weekly') === 'weekly' && r.week === thisWeek));
    const oldName = roleFor(before?.roleId)?.name ?? 'their current role';
    if (moving && !await confirm({ title: `Change role to ${role.name}?`, message: scheduled ? `This week's report stays on ${oldName}, with the same form and scoring. From next week (${plusDays(thisWeek, 7)}) new reports use ${role.name}.` : `${u.full_name || u.email} moves from ${oldName}. Past reports stay exactly as they were.`, confirmLabel: 'Change role' })) return;
    setBusyId(u.id); setAccountsError('');
    try {
      if (approval) await approveUser(u.id, approval.positionId, slug); else await assignTemplate(u.id, slug);
      setAccounts(list => (list ?? []).map(x => x.id === u.id ? { ...x, assigned_role_slug: slug, assigned_at: new Date().toISOString(), ...(approval ? { status: 'approved' as const, reject_reason: null } : {}) } : x));
      const name = u.full_name || u.email;
      const existing = data.people.find(p => p.email.toLowerCase() === u.email.toLowerCase());
      const personId = existing?.id ?? uid();
      change(d0 => {
        const curId = d0.people.find(p => p.email.toLowerCase() === u.email.toLowerCase())?.id;
        const d = curId && !approval ? changeRole(d0, curId, role, todayIST(), startDay) : d0;
        const cur = d.people.find(p => p.email.toLowerCase() === u.email.toLowerCase());
        if (cur && !approval && cur.roleId !== slug) return d;   // scheduled for next week: this week's report stays as it is
        const keepFields = cur && cur.roleId === slug ? cur.fields : undefined;
        const person: Person = { ...cur, id: personId, name, email: u.email, roleId: slug, fields: keepFields };
        const people = cur ? d.people.map(p => p.id === personId ? person : p) : [...d.people, person];
        const has = d.reviews.some(r => r.memberId === personId && r.week === week && (r.periodKind ?? 'weekly') === 'weekly');
        const reviews = has ? d.reviews : [...d.reviews, buildReview(d, person, role)];
        return { ...d, people, reviews };
      }, scheduled ? `${name}: ${role.name} starts ${plusDays(thisWeek, 7)} — this week stays on ${oldName}` : moving ? `${name}: role changed to ${role.name} — past reports kept` : `${name}: assigned ${role.name} — weekly report ready`);
      await linkMember(u.id, personId, u.email);   // let this account sign in and see only their report
      setPick(p => { const n = { ...p }; delete n[u.id]; return n; });
    } catch (e) { setAccountsError((e as Error).message); }
    finally { setBusyId(''); }
  };

  const requests = (accounts ?? []).filter(u => u.status === 'pending' || u.status === 'rejected');
  const list = (accounts ?? []).filter(u => u.status !== 'pending' && u.status !== 'rejected' && u.status !== 'inactive' && `${u.full_name} ${u.email}`.toLowerCase().includes(query.toLowerCase()));
  const approve = (u: AppUser, c: ApproveChoice) => assign(u, c.roleSlug, { positionId: c.positionId });
  const reject = async (u: AppUser, reason: string) => {
    setBusyId(u.id); setAccountsError('');
    try { await rejectUser(u.id, reason); setAccounts(l => (l ?? []).map(x => x.id === u.id ? { ...x, status: 'rejected' as const, reject_reason: reason || null } : x)); }
    catch (e) { setAccountsError((e as Error).message); } finally { setBusyId(''); }
  };
  const inactiveUsers = (accounts ?? []).filter(u => u.status === 'inactive');
  const toggleActive = async (u: AppUser, active: boolean) => {
    const name = u.full_name || u.email;
    if (!active && !await confirm({ title: `Deactivate ${name}?`, message: 'They can no longer sign in and no new reports are created. All past reports and scores are kept. You can reactivate them any time.', confirmLabel: 'Deactivate', destructive: true })) return;
    setBusyId(u.id); setAccountsError('');
    try {
      await setUserActive(u.id, active);
      setAccounts(l => (l ?? []).map(x => x.id === u.id ? { ...x, status: active ? 'approved' as const : 'inactive' as const } : x));
      const p = personFor(u);
      if (p) change(d => setPersonActive(d, p.id, active, todayIST()), `${name}: ${active ? 'reactivated' : 'deactivated — reports kept'}`, p.id);
    } catch (e) { setAccountsError((e as Error).message); } finally { setBusyId(''); }
  };
  const byId = new Map(org.positions.map(p => [p.id, p]));
  const seatOf = (u: AppUser) => org.assignments.find(a => a.user_id === u.id);
  const nameOf = (id: string) => { const x = (accounts ?? []).find(a => a.id === id); return x ? (x.full_name || x.email) : 'a team member'; };

  return (
    <>
      {confirmDialog}
      <div className="page-heading">
        <div><h1>Users</h1></div>
        <button className="button" onClick={load}><RefreshCw size={16} />Refresh</button>
      </div>


      {!authEnabled && <section className="panel"><p className="padded muted">Connect Supabase (add the keys to <code>.env.local</code>) to manage sign-ups.</p></section>}

      {authEnabled && <>
        {(accounts?.length ?? 0) > 6 && <div className="list-toolbar"><label className="search-box"><input placeholder="Find a user…" value={query} onChange={e => setQuery(e.target.value)} /></label><span className="muted">{accounts?.length} sign-ups</span></div>}
        {accountsError && <p className="form-error" role="alert">{accountsError}</p>}
        {accounts === null && <p className="padded muted">Loading sign-ups…</p>}
        {accounts !== null && accounts.length === 0 && !accountsError && <section className="panel"><p className="padded muted">No users yet. New sign-ups will appear here.</p></section>}

        <ApprovalRequests requests={requests} users={accounts ?? []} roles={data.roles} positions={org.positions} assignments={org.assignments} busyId={busyId} onApprove={approve} onReject={reject} />

        <div className="team-grid">
          {list.map(u => {
            const person = personFor(u);
            const slug = pick[u.id] ?? u.assigned_role_slug ?? data.roles[0]?.id ?? '';
            const changed = slug !== u.assigned_role_slug;
            const review = weeklyReviewFor(person?.id);
            const selectedRole = roleFor(slug);
            const assignedRole = roleFor(u.assigned_role_slug);
            const initials = (u.full_name || u.email).split(/[ .@]/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('');
            return (
              <section className="panel member-card" key={u.id}>
                <div className="member-card-top">
                  {person
                    ? <AvatarUpload name={u.full_name || u.email} url={person.avatarUrl} onChange={url => change(d => ({ ...d, people: d.people.map(p => p.id === person.id ? { ...p, avatarUrl: url } : p) }), 'Profile photo updated', person.id)} onError={setAccountsError} />
                    : <Avatar name={u.full_name || u.email} />}
                  {assignedRole
                    ? <span className="role-pill" style={{ marginTop: 0 }}>{assignedRole.name}</span>
                    : <span className="mini-tag">Unassigned</span>}
                </div>
                <h2 style={{ fontSize: 18 }}>{u.full_name || u.email.split('@')[0]}</h2>
                <p>{u.email}</p>
                {seatOf(u) && <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{byId.get(seatOf(u)!.position_id)?.title} · reports to {(() => { const h = seatAccountable(byId, org.assignments, seatOf(u)!.position_id); return h ? nameOf(h) : 'Admin'; })()}</p>}

                <label style={{ display: 'block', margin: '16px 0 0' }}>
                  <span className="muted" style={{ fontSize: 13, letterSpacing: 1 }}>ROLE</span>
                  <select aria-label={`Role for ${u.email}`} value={slug} onChange={e => setPick(p => ({ ...p, [u.id]: e.target.value }))} style={{ marginTop: 6 }}>
                    {data.roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </label>
                <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{selectedRole?.fields.length ?? 0} fields · {kpiCount(selectedRole?.fields ?? [])} KPIs</p>
                {person?.nextRole && <p className="muted role-history"><History size={13} /> From {person.nextRole.from}: {roleFor(person.nextRole.roleId)?.name ?? 'new role'}. This week stays on {roleFor(person.roleId)?.name ?? 'the current role'}.</p>}
                {!!person?.roleHistory?.length && <p className="muted role-history"><History size={13} /> Earlier: {person.roleHistory.map(h => `${h.roleName}${h.from ? ` (${h.from} → ${h.to})` : ` (until ${h.to})`}`).join(', ')}</p>}

                <div className="member-card-actions">
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {review
                      ? <button className="text-button" onClick={() => open(review)}>Open report <ArrowRight size={13} /></button>
                      : <span className="muted" style={{ fontSize: 13 }}>No report yet</span>}
                    {orgSupported && <button className="icon-button" aria-label={`Deactivate ${u.email}`} title="Deactivate this user" disabled={busyId === u.id} onClick={() => toggleActive(u, false)}><UserX size={15} /></button>}
                    {person && <button className="icon-button" aria-label={`View as ${u.email}`} title="View the workspace as this user" onClick={() => previewAs(person.id)}><Eye size={15} /></button>}
                  </div>
                  <button className="button" disabled={busyId === u.id || (!changed && Boolean(review))} onClick={() => assign(u, slug)}>
                    {busyId === u.id ? '…' : changed || !u.assigned_role_slug ? 'Assign' : review ? 'Assigned' : 'Generate'}
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        {inactiveUsers.length > 0 && <section className="inactive-users">
          <h2>Inactive ({inactiveUsers.length})</h2>
          <div className="team-grid">{inactiveUsers.map(u => <section className="panel member-card inactive-card" key={u.id}>
            <div className="member-card-top"><Avatar name={u.full_name || u.email} /><span className="mini-tag">Inactive</span></div>
            <h2 style={{ fontSize: 18 }}>{u.full_name || u.email.split('@')[0]}</h2><p>{u.email}</p>
            <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{roleFor(u.assigned_role_slug)?.name ?? 'No role'} · past reports kept</p>
            <div className="member-card-actions"><span />
              <button className="button" disabled={busyId === u.id} onClick={() => toggleActive(u, true)}><UserCheck size={15} /> {busyId === u.id ? '…' : 'Reactivate'}</button></div>
          </section>)}</div>
        </section>}
      </>}
    </>
  );
}
