import React, { useState } from 'react';
import { Check, UserCheck, X } from 'lucide-react';
import { Modal } from './Modal';
import { Avatar } from './Avatar';
import type { Role } from './model';
import type { AppUser } from './appUsers';
import { seatAccountable, type OrgAssignment, type OrgPosition } from './orgApi';

export type ApproveChoice = { positionId: string | null; roleSlug: string };

/** Sign-ups waiting for an admin: approve (seat + role + accountable in one step) or reject. */
export function ApprovalRequests({ requests, users, roles, positions, assignments, busyId, onApprove, onReject }: {
  requests: AppUser[]; users: AppUser[]; roles: Role[]; positions: OrgPosition[]; assignments: OrgAssignment[]; busyId: string;
  onApprove: (u: AppUser, choice: ApproveChoice) => Promise<void>; onReject: (u: AppUser, reason: string) => Promise<void>;
}) {
  const [approving, setApproving] = useState<AppUser | null>(null);
  const [rejecting, setRejecting] = useState<AppUser | null>(null);
  const [positionId, setPositionId] = useState('');
  const [roleSlug, setRoleSlug] = useState('');
  const [reason, setReason] = useState('');
  const byId = new Map(positions.map(p => [p.id, p]));
  const nameOf = (id: string) => { const u = users.find(x => x.id === id); return u ? (u.full_name || u.email) : 'a team member'; };
  const seat = positionId ? byId.get(positionId) : undefined;
  const holderId = seatAccountable(byId, assignments, positionId);
  const taken = (id: string) => assignments.find(a => a.position_id === id);
  const seats = positions.filter(p => p.kind === 'internal');

  const openApprove = (u: AppUser) => { setApproving(u); setPositionId(''); setRoleSlug(u.assigned_role_slug ?? roles[0]?.id ?? ''); };
  const pickSeat = (id: string) => { setPositionId(id); const s = byId.get(id); if (s?.role_slug && roles.some(r => r.id === s.role_slug)) setRoleSlug(s.role_slug); };

  if (!requests.length) return null;
  return <>
    <section className="panel" style={{ marginBottom: 22 }}>
      <div className="panel-heading"><div><h2>Approval requests</h2></div><span className="mini-tag">{requests.length} waiting</span></div>
      <div>{requests.map(u => <div className="approval-row" key={u.id}>
        <Avatar name={u.full_name || u.email} />
        <div><strong>{u.full_name || u.email.split('@')[0]}</strong><p>{u.email} · {u.status === 'rejected' ? `rejected${u.reject_reason ? `: ${u.reject_reason}` : ''}` : `signed up ${u.created_at?.slice(0, 10)}`}</p></div>
        {u.status !== 'rejected' && <button className="button" disabled={busyId === u.id} onClick={() => { setReason(''); setRejecting(u); }}><X size={15} />Reject</button>}
        <button className="button primary" disabled={busyId === u.id} onClick={() => openApprove(u)}><Check size={15} />{u.status === 'rejected' ? 'Approve now' : 'Approve'}</button>
      </div>)}</div>
    </section>

    {approving && <Modal title={`Approve ${approving.full_name || approving.email}`} close={() => setApproving(null)}>
      <form onSubmit={async e => { e.preventDefault(); const u = approving; setApproving(null); await onApprove(u, { positionId: positionId || null, roleSlug }); }}>
        <div className="form-stack">
          {positions.length > 0 && <label>Position (seat in the org chart)
            <select value={positionId} onChange={e => pickSeat(e.target.value)}>
              <option value="">No seat yet — set role only</option>
              {seats.map(p => <option key={p.id} value={p.id}>{p.title}{p.group_name ? ` · ${p.group_name}` : ''} — {taken(p.id) ? `held by ${nameOf(taken(p.id)!.user_id)} (will be replaced)` : p.planned_name ? `vacant (${p.planned_name})` : 'vacant'}</option>)}
            </select></label>}
          <label>Role template
            <select value={roleSlug} onChange={e => setRoleSlug(e.target.value)} required>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
          {positions.length > 0 && <div className="form-note"><strong><UserCheck size={14} style={{ verticalAlign: -2 }} /> Accountable (approves their reports)</strong>
            <p>{!seat ? 'Pick a seat to see who they report to.' : holderId ? `${nameOf(holderId)} — the next filled seat above ${seat.title}. Admin can always override.` : 'Admin — no one above this seat is assigned yet. It switches automatically when that seat is filled.'}</p></div>}
        </div>
        <div className="modal-footer"><button type="button" className="button" onClick={() => setApproving(null)}>Cancel</button><button className="button primary" type="submit">Approve &amp; assign</button></div>
      </form>
    </Modal>}

    {rejecting && <Modal title={`Reject ${rejecting.full_name || rejecting.email}`} close={() => setRejecting(null)}>
      <form onSubmit={async e => { e.preventDefault(); const u = rejecting; setRejecting(null); await onReject(u, reason); }}>
        <div className="form-stack"><label>Reason (shown to the user, optional)<textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} /></label></div>
        <div className="modal-footer"><button type="button" className="button" onClick={() => setRejecting(null)}>Cancel</button><button className="button primary" type="submit">Reject</button></div>
      </form>
    </Modal>}
  </>;
}
