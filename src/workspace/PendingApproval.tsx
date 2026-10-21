import React from 'react';
import { Clock3, ShieldX } from 'lucide-react';
import type { AuthContext } from './AuthGate';
import './auth.css';

/** Shown instead of the workspace while an account is waiting for (or was refused) admin approval. */
export function PendingApproval({ status, reason, auth, recheck }: { status: 'pending' | 'rejected' | 'inactive'; reason: string; auth?: AuthContext; recheck: () => void }) {
  const inactive = status === 'inactive';
  const rejected = status === 'rejected' || inactive;
  return <div className="auth-screen"><div className="auth-layout" style={{ gridTemplateColumns: '1fr', maxWidth: 440 }}><main className="auth-panel"><div className="auth-card" style={{ textAlign: 'center' }}>
    <img src="/pestcure-logo.png" alt="PestCure" style={{ width: 84, height: 84, objectFit: 'contain', margin: '0 auto 14px', display: 'block' }} />
    <div style={{ display: 'inline-grid', placeItems: 'center', width: 46, height: 46, borderRadius: 14, margin: '0 auto 12px', color: rejected ? 'var(--a-danger)' : 'var(--a-brand)', background: 'color-mix(in srgb, currentColor 12%, transparent)' }}>{rejected ? <ShieldX size={24} /> : <Clock3 size={24} />}</div>
    <h1>{inactive ? 'Account deactivated' : rejected ? 'Access not approved' : 'Waiting for approval'}</h1>
    <p>{inactive ? 'Your account has been deactivated by an admin. Your past reports are safe. Please contact your admin to get access back.' : rejected
      ? `Your request was not approved${reason ? `: ${reason}` : '.'} Please contact your admin.`
      : <>Your account <strong>{auth?.user?.email}</strong> is created. An admin will review it and set up your role and reporting line. You’ll get access as soon as it’s approved.</>}</p>
    <button className="auth-submit" style={{ width: '100%' }} onClick={recheck}>Check again</button>
    <button className="auth-switch" onClick={auth?.signOut}>Sign out</button>
  </div></main></div></div>;
}
