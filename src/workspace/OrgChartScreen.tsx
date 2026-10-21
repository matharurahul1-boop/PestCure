import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConfirm } from './ConfirmDialog';
import { Briefcase, ChevronDown, ChevronRight, Clock3, Compass, CornerDownRight, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserCheck, Users } from 'lucide-react';
import { Modal } from './Modal';
import { Avatar } from './Avatar';
import type { Role } from './model';
import { fetchAppUsers, type AppUser } from './appUsers';
import { assignHolder, deletePosition, fetchOrgChart, orgSupported, savePosition, seatAccountable, type OrgAssignment, type OrgChartData, type OrgPosition } from './orgApi';

type Draft = { id: string; title: string; group_name: string; planned_name: string; role_slug: string; parent_id: string; guided_by_id: string; kind: 'internal' | 'partner'; holder: string; isNew: boolean };

/**
 * The living org chart. Everyone sees who they report to (their accountable) and who reports to them;
 * the admin can also edit seats. It refreshes on focus and every minute, so a change shows up for everybody.
 */
export function OrgChartScreen({ roles, canEdit, previewData }: { roles: Role[]; canEdit: boolean; /** screenshots/tests: render this chart instead of calling Supabase */ previewData?: OrgChartData }) {
  const [confirm, confirmDialog] = useConfirm();
  const supported = orgSupported || Boolean(previewData);
  const [chart, setChart] = useState<OrgChartData | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width:720px)').matches);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [find, setFind] = useState('');
  useEffect(() => { const m = window.matchMedia('(max-width:720px)'); const h = () => setIsMobile(m.matches); m.addEventListener('change', h); return () => m.removeEventListener('change', h); }, []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const centered = useRef(false);
  // the chart is wider than most screens: start with the top of it (the founder) in view
  useEffect(() => { const el = scrollRef.current; if (el && chart?.positions.length && !centered.current) { el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2); centered.current = true; } }, [chart]);

  const load = useCallback(() => {
    if (previewData) { setChart(previewData); return; }
    Promise.all([fetchOrgChart(), canEdit ? fetchAppUsers() : Promise.resolve([] as AppUser[])])
      .then(([c, u]) => { setChart(c); setUsers(u); setError(''); })
      .catch(e => { setChart(prev => prev ?? { positions: [], holders: [], admins: [], me: { user_id: '', position_id: null, accountable_user: null, accountable_name: null } }); setError((e as Error).message); });
  }, [canEdit, previewData]);
  useEffect(() => {
    if (!supported) return;
    load();
    const timer = window.setInterval(load, 60000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [load]);

  const positions = chart?.positions ?? [];
  const byId = useMemo(() => new Map(positions.map(p => [p.id, p])), [positions]);
  const assignments: OrgAssignment[] = useMemo(() => (chart?.holders ?? []).map(h => ({ id: h.position_id, position_id: h.position_id, user_id: h.user_id, from_date: h.from_date })), [chart]);
  const holderOf = (seat: string) => chart?.holders.find(h => h.position_id === seat);
  const me = chart?.me;
  const adminLabel = chart?.admins.length ? chart.admins.join(', ') : 'Admin';
  const accountableUser = (seat: string) => seatAccountable(byId, assignments, seat);
  const accountableName = (seat: string) => { const u = accountableUser(seat); return u ? (chart?.holders.find(h => h.user_id === u)?.name ?? 'a team member') : adminLabel; };

  // who is who, from this viewer's point of view
  const myAcc = me?.accountable_user ?? null;
  const reportsToMe = useMemo(() => new Set(positions.filter(p => { const holder = chart?.holders.find(h => h.position_id === p.id); return holder && me?.user_id && accountableUser(p.id) === me.user_id; }).map(p => p.id)), [positions, chart]); // eslint-disable-line react-hooks/exhaustive-deps
  const mySeat = me?.position_id ? byId.get(me.position_id) : undefined;
  const chain = useMemo(() => { const out: OrgPosition[] = []; let cur = mySeat ? (mySeat.parent_id ? byId.get(mySeat.parent_id) : undefined) : undefined; for (let i = 0; cur && i < 12; i++) { out.push(cur); cur = cur.parent_id ? byId.get(cur.parent_id) : undefined; } return out; }, [mySeat, byId]);
  // on a phone the chart is an accordion: open the branches that matter to this viewer
  useEffect(() => {
    if (!chart || !positions.length) return;
    const open = new Set<string>();
    for (const head of positions.filter(x => x.parent_id && x.kind === 'internal' && !byId.get(x.parent_id)?.parent_id)) {
      const seats = [head, ...positions.filter(x => x.parent_id === head.id)];
      if (seats.some(x => x.id === me?.position_id || reportsToMe.has(x.id) || (!!myAcc && chart.holders.find(h => h.position_id === x.id)?.user_id === myAcc))) open.add(head.id);
    }
    setExpanded(open);
  }, [chart, me?.position_id, myAcc]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!supported) return <><div className="page-heading"><div><h1>Org chart</h1></div></div><section className="panel"><p className="padded muted">The org chart needs the Supabase backend. Set <code>VITE_BACKEND=supabase</code> in <code>.env.local</code> and run <code>supabase/setup_all.sql</code>.</p></section></>;

  const kids = (id: string | null) => positions.filter(p => (p.parent_id ?? null) === id && p.kind === 'internal');
  const roots = positions.filter(p => !p.parent_id && p.kind === 'internal');
  const partners = positions.filter(p => p.kind === 'partner');
  const approvedUsers = users.filter(u => u.status !== 'pending' && u.status !== 'rejected');

  const open = (p: OrgPosition) => { if (!canEdit) return; const h = holderOf(p.id); setDraft({ id: p.id, title: p.title, group_name: p.group_name, planned_name: p.planned_name, role_slug: p.role_slug ?? '', parent_id: p.parent_id ?? '', guided_by_id: p.guided_by_id ?? '', kind: p.kind, holder: h?.user_id ?? '', isNew: false }); };
  const addSeat = (parent: string) => setDraft({ id: '', title: '', group_name: '', planned_name: '', role_slug: '', parent_id: parent, guided_by_id: '', kind: 'internal', holder: '', isNew: true });
  const save = async () => {
    if (!draft || !draft.title.trim()) { setError('Give the position a title.'); return; }
    setBusy(true); setError('');
    try {
      const id = draft.isNew ? `${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28)}-${Math.random().toString(36).slice(2, 6)}` : draft.id;
      await savePosition({ id, title: draft.title.trim(), group_name: draft.group_name.trim(), planned_name: draft.planned_name.trim(), role_slug: draft.role_slug || null, parent_id: draft.parent_id || null, guided_by_id: draft.guided_by_id || null, kind: draft.kind, ...(draft.isNew ? { sort: positions.length * 10 + 10 } : {}) });
      if ((holderOf(id)?.user_id ?? '') !== draft.holder) await assignHolder(id, draft.holder || null);
      setDraft(null); load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!draft || draft.isNew || !await confirm({ title: `Delete the "${draft.title}" seat?`, message: 'People under it move to no parent.', confirmLabel: 'Delete', destructive: true })) return;
    setBusy(true);
    try { await deletePosition(draft.id); setDraft(null); load(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  /** Each branch under the founder gets its own colour, so a seat can be placed at a glance. */
  const toneOf = (x: OrgPosition) => {
    let cur: OrgPosition | undefined = x;
    for (let i = 0; cur && i < 12; i++) { const parent: OrgPosition | undefined = cur.parent_id ? byId.get(cur.parent_id) : undefined; if (!parent || !parent.parent_id) break; cur = parent; }
    const heads = roots.flatMap(r => kids(r.id));
    const idx = cur ? heads.findIndex(h => h.id === cur!.id) : -1;
    return idx < 0 ? 0 : idx % 6;
  };
  const Seat = ({ p, root = false }: { p: OrgPosition; root?: boolean }) => {
    const h = holderOf(p.id);
    const isMe = me?.position_id === p.id;
    const isAcc = !!myAcc && h?.user_id === myAcc;
    const isTeam = reportsToMe.has(p.id);
    const cls = `org-seat tone-${toneOf(p)}${isMe ? ' is-me' : ''}${isAcc ? ' is-acc' : ''}${isTeam ? ' is-team' : ''}${root ? ' root' : ''}${canEdit ? ' editable' : ''}`;
    // the accountable is only worth a chip when it is NOT simply the person in the seat above
    const accName = p.parent_id ? accountableName(p.id) : '';
    const showAcc = !!p.parent_id && !!accountableUser(p.id) && accName !== holderOf(p.parent_id)?.name;   // admin is the default, no chip needed
    const guide = p.guided_by_id ? byId.get(p.guided_by_id)?.title : undefined;
    const soon = !h && p.planned_name;
    const body = <>
      <span className="org-seat-row">
        {h ? <Avatar name={h.name} small /> : <span className="org-seat-ghost" />}
        <span className="org-seat-who">
          <strong>{h ? h.name : <span className="org-vacant">Vacant</span>}</strong>
          <em className="org-role-pill">{p.title}</em>
        </span>
        {(isMe || isAcc || isTeam) && <em className="org-tag">{isMe ? 'You' : isAcc ? 'Approver' : 'Your team'}</em>}
      </span>
      {(soon || showAcc || guide) && <span className="org-chips">
        {soon && <span className="org-chip c-soon"><Clock3 size={11} />{p.planned_name}</span>}
        {showAcc && <span className="org-chip c-acc" title="Approves their work"><CornerDownRight size={11} />{accName}</span>}
        {guide && <span className="org-chip c-guide" title="Guided by"><Compass size={11} />{guide}</span>}
      </span>}
    </>;
    return canEdit ? <button className={cls} onClick={() => open(p)}>{body}</button> : <div className={cls}>{body}</div>;
  };
  const Branch = ({ p }: { p: OrgPosition }) => {
    const groups = new Map<string, OrgPosition[]>();
    kids(p.id).forEach(k => groups.set(k.group_name, [...(groups.get(k.group_name) ?? []), k]));
    return <div className={`org-col tone-${toneOf(p)}`}><Seat p={p} />
      {(groups.size > 0 || canEdit) && <div className="org-team">{[...groups].map(([g, seats]) => <div key={g || '_'}>{g && <span className="org-group">{g}</span>}{seats.map(s => <Seat key={s.id} p={s} />)}</div>)}
        {canEdit && <button className="text-button" onClick={() => addSeat(p.id)}><Plus size={14} />Add seat</button>}</div>}
    </div>;
  };

  const needle = find.trim().toLowerCase();
  const matches = (x: OrgPosition) => !needle || `${x.title} ${x.planned_name} ${x.group_name} ${holderOf(x.id)?.name ?? ''}`.toLowerCase().includes(needle);
  const MobileBranch = ({ p }: { p: OrgPosition }) => {
    const members = kids(p.id);
    const shown = needle ? members.filter(matches) : members;
    if (needle && !matches(p) && !shown.length) return null;
    const isOpen = !!needle || expanded.has(p.id);
    const groups = new Map<string, OrgPosition[]>();
    shown.forEach(k => groups.set(k.group_name, [...(groups.get(k.group_name) ?? []), k]));
    return <div className={`org-m-branch tone-${toneOf(p)}${isOpen ? ' open' : ''}`}>
      <div className="org-m-head"><div className="org-m-seat"><Seat p={p} /></div>
        {members.length > 0 && <button className="org-m-toggle" aria-expanded={isOpen} aria-label={`${isOpen ? 'Hide' : 'Show'} ${members.length} seats under ${p.title}`} onClick={() => setExpanded(prev => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })}><b>{members.length}</b><ChevronDown size={18} /></button>}</div>
      {isOpen && <div className="org-m-body">{[...groups].map(([g, seats]) => <div key={g || '_'}>{g && <span className="org-group">{g}</span>}{seats.map(x => <Seat key={x.id} p={x} />)}</div>)}
        {canEdit && <button className="text-button" onClick={() => addSeat(p.id)}><Plus size={14} />Add seat</button>}</div>}
    </div>;
  };

  return <>
    {confirmDialog}
    <div className="page-heading"><div><h1>Org chart</h1></div><div style={{ display: 'flex', gap: 8 }}><button className="button" onClick={load}><RefreshCw size={16} />Refresh</button>{canEdit && <button className="button primary" onClick={() => addSeat('')}><Plus size={16} />Add seat</button>}</div></div>
    {error && <p className="form-error" role="alert">{error}</p>}

    {chart && me?.user_id && <section className="org-me panel">
      {mySeat ? <>
        <div className="org-path" aria-label="Your reporting line">
          <div className="org-node you"><Avatar name={chart.holders.find(x => x.user_id === me.user_id)?.name ?? 'You'} small /><span><small>You</small><strong>{mySeat.title}</strong></span></div>
          {chain.map((p, i) => { const h = holderOf(p.id); return <React.Fragment key={p.id}><ChevronRight size={16} className="org-arrow" /><div className={`org-node${h ? '' : ' vacant'}`}>{h ? <Avatar name={h.name} small /> : <span className="org-seat-ghost" />}<span><small>{i === 0 ? 'Reports to' : 'Then'}</small><strong>{h ? h.name : 'Vacant'}</strong></span></div></React.Fragment>; })}
          <ChevronRight size={16} className="org-arrow" /><div className="org-node admin"><span className="org-node-ico"><ShieldCheck size={16} /></span><span><small>Final</small><strong>{adminLabel}</strong></span></div>
        </div>
        <div className="org-me-chips">
          <span className="org-chip c-acc"><UserCheck size={12} />Approver: {myAcc ? me.accountable_name : adminLabel}</span>
          {reportsToMe.size > 0 && <span className="org-chip c-team"><Users size={12} />{reportsToMe.size} {reportsToMe.size === 1 ? 'person reports' : 'people report'} to you</span>}
        </div>
      </> : <p className="org-me-note"><UserCheck size={14} /> {canEdit ? `You are the admin (${adminLabel}) — you can approve anything and edit this chart.` : 'You are not placed on the chart yet. Your admin will set your seat, and your accountable will appear here.'}</p>}
    </section>}

    {chart === null && <p className="padded muted">Loading org chart…</p>}
    {chart && !positions.length && !error && <section className="panel"><p className="padded muted">No positions yet. Run <code>supabase/setup_all.sql</code> to load the starting chart.</p></section>}
    {chart && positions.length > 0 && <div className="org-legend" aria-hidden="true"><span><i className="lg-me" />You</span><span><i className="lg-acc" />Approver</span><span><i className="lg-team" />Your team</span><span><i className="lg-vac" />Vacant</span></div>}
    {isMobile && roots.map(root => <section key={root.id} className="org-m-tree">
      <Seat p={root} root />
      {partners.length > 0 && <div className="org-partners">{partners.map(x => <button key={x.id} className="org-partner" onClick={() => open(x)}><Briefcase size={13} />{x.title}<b>{x.planned_name}</b></button>)}</div>}
      <label className="org-m-search"><Search size={16} /><input type="search" placeholder="Find a person or seat…" value={find} onChange={e => setFind(e.target.value)} /></label>
      {kids(root.id).map(h => <MobileBranch key={h.id} p={h} />)}
    </section>)}
    {!isMobile && roots.map(root => <section key={root.id} className="panel org-root"><div className="org-scroll" ref={scrollRef}><div className="org-tree">
      <div className="org-top"><Seat p={root} root />
        {partners.length > 0 && <div className="org-partners">{partners.map(x => <button key={x.id} className="org-partner" onClick={() => open(x)}><Briefcase size={13} />{x.title}<b>{x.planned_name}</b></button>)}</div>}</div>
      <div className="org-board">{kids(root.id).map(h => <Branch key={h.id} p={h} />)}</div>
    </div></div></section>)}

    {draft && <Modal title={draft.isNew ? 'Add a seat' : draft.title} close={() => setDraft(null)}>
      <form onSubmit={e => { e.preventDefault(); void save(); }}>
        <div className="form-stack">
          <label>Position title<input required value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
          <div className="form-two">
            <label>Group<input value={draft.group_name} placeholder="e.g. CC – Delhi" onChange={e => setDraft({ ...draft, group_name: e.target.value })} /></label>
            <label>Planned name (label only)<input value={draft.planned_name} onChange={e => setDraft({ ...draft, planned_name: e.target.value })} /></label>
          </div>
          {draft.kind === 'internal' && <label>Held by
            <select value={draft.holder} onChange={e => setDraft({ ...draft, holder: e.target.value })}>
              <option value="">Vacant</option>
              {approvedUsers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
            </select></label>}
          <div className="form-two">
            <label>Reports to (approves their work)
              <select value={draft.parent_id} onChange={e => setDraft({ ...draft, parent_id: e.target.value })}>
                <option value="">— top of the chart —</option>
                {positions.filter(p => p.id !== draft.id && p.kind === 'internal').map(p => <option key={p.id} value={p.id}>{p.title}{p.planned_name ? ` (${p.planned_name})` : ''}</option>)}
              </select></label>
            <label>Guided by (display only)
              <select value={draft.guided_by_id} onChange={e => setDraft({ ...draft, guided_by_id: e.target.value })}>
                <option value="">—</option>
                {positions.filter(p => p.id !== draft.id && p.kind === 'internal').map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select></label>
          </div>
          <label>Default role template
            <select value={draft.role_slug} onChange={e => setDraft({ ...draft, role_slug: e.target.value })}>
              <option value="">None</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select></label>
          <p className="form-note">Changing who holds a seat or where it reports re-routes approvals immediately, and everyone sees it on this chart within a minute. Old holders stay in the history.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <div className="modal-footer">
          {!draft.isNew && <button type="button" className="button" disabled={busy} onClick={remove} style={{ marginRight: 'auto' }}><Trash2 size={15} />Delete seat</button>}
          <button type="button" className="button" onClick={() => setDraft(null)}>Cancel</button>
          <button className="button primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>}
  </>;
}
