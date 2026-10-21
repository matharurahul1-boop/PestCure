import React, { useEffect, useState } from 'react';
import { authClient, type AuthUser } from './auth';
import './auth.css';
export type AuthContext = { user: AuthUser | null; signOut: () => void };

/** A glossy, gradient-shaded insect — reads as a small 3D creature rather than a flat icon. */
function BugSvg() {
 return <svg viewBox="0 0 88 48">
  <defs>
   <radialGradient id="bugBody" cx="32%" cy="28%" r="80%">
    <stop offset="0%" stopColor="#eafff1" />
    <stop offset="32%" stopColor="#7fd3a3" />
    <stop offset="75%" stopColor="#1f6b3f" />
    <stop offset="100%" stopColor="#0a2e1a" />
   </radialGradient>
   <radialGradient id="bugHead" cx="35%" cy="30%" r="75%">
    <stop offset="0%" stopColor="#f3fff6" />
    <stop offset="60%" stopColor="#9fdfba" />
    <stop offset="100%" stopColor="#12492b" />
   </radialGradient>
   <linearGradient id="bugWing" x1="0" y1="0" x2=".8" y2="1">
    <stop offset="0%" stopColor="#ffffff" stopOpacity=".95" />
    <stop offset="55%" stopColor="#dff2e6" stopOpacity=".35" />
    <stop offset="100%" stopColor="#dff2e6" stopOpacity="0" />
   </linearGradient>
  </defs>
  <g className="bug-wing"><ellipse cx="46" cy="13" rx="17" ry="9" fill="url(#bugWing)" stroke="#f4fff8" strokeOpacity=".55" strokeWidth="1" /></g>
  <g className="bug-wing-2"><ellipse cx="46" cy="35" rx="17" ry="9" fill="url(#bugWing)" stroke="#f4fff8" strokeOpacity=".55" strokeWidth="1" /></g>
  <path className="bug-line" d="M36 30 L31 46 M45 31 L47 47 M54 30 L61 45" />
  <path className="bug-line" d="M36 18 L31 2 M45 17 L47 1 M54 18 L61 3" />
  <ellipse cx="44" cy="24" rx="20" ry="6.5" fill="url(#bugBody)" />
  <path className="bug-band" d="M30 20 q14 -5 28 0 M30 28 q14 5 28 0" />
  <circle cx="24" cy="24" r="6.5" fill="url(#bugHead)" />
  <circle className="bug-eye" cx="21.2" cy="22" r="1.7" />
  <circle className="bug-eye-glint" cx="20.6" cy="21.3" r=".6" />
  <path className="bug-line" d="M19 24 L2 24" />
  <path className="bug-line" d="M63 24 L86 20" />
 </svg>;
}
/** Every bug heads for the same spot, gets sprayed there, flips over and falls off the bottom of the screen. */
function SprayCan() {
 return <svg className="spray-can" viewBox="0 0 56 90"><defs><linearGradient id="canBody" x1="0" x2="1"><stop offset="0" stopColor="#1b6a43" /><stop offset=".45" stopColor="#3cb27a" /><stop offset="1" stopColor="#134d31" /></linearGradient></defs>
  <rect x="12" y="26" width="32" height="58" rx="8" fill="url(#canBody)" /><rect x="12" y="44" width="32" height="14" fill="#f4fff8" opacity=".9" />
  <rect x="17" y="16" width="22" height="12" rx="4" fill="#cfd8d3" /><rect x="22" y="6" width="14" height="12" rx="3" fill="#2b3a32" /><rect x="14" y="8" width="12" height="5" rx="2" fill="#2b3a32" />
 </svg>;
}
function SpraySpot({ cls }: { cls: string }) {
 return <div className={`spray-spot ${cls}`}><SprayCan /><span className="spray-mist" /><span className="spray-core" />
  <span className="spray-drop" /><span className="spray-drop" /><span className="spray-drop" /><span className="spray-drop" /></div>;
}
/** Bugs of different sizes head for one of three spray spots, get sprayed there, flip over and fall off the bottom of the screen. */
function BugField() {
 return <div className="auth-bugs" aria-hidden="true">
  <SpraySpot cls="s-a" /><SpraySpot cls="s-b flip" /><SpraySpot cls="s-c flip" />
  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <span key={n} className={`auth-bug b${n}`}><BugSvg /></span>)}
 </div>;
}
export function AuthGate({ children }: { children: (auth: AuthContext) => React.ReactNode }) {
 const [user, setUser] = useState<AuthUser | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 useEffect(() => authClient.subscribe((next, problem) => { setUser(next); if (problem) setError(problem); setLoading(false); }), []);
 if (loading) return <div className="auth-splash"><span className="auth-spinner" />Checking your session…</div>;
 if (!user) return <SignInScreen initialError={error} />;
 return <>{error && <div role="alert" className="auth-error">{error}</div>}{children({ user, signOut: () => { authClient.signOut().catch(e => setError(e.message)); } })}</>;
}
function SignInScreen({ initialError }: { initialError: string }) {
 const [mode, setMode] = useState<'signin' | 'signup'>('signin');
 const [busy, setBusy] = useState(false), [error, setError] = useState(initialError), [message, setMessage] = useState('');
 const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
 async function signInWithGoogle() {
  setError(''); setMessage('');
  if (!authClient.signInWithGoogle) return;
  setBusy(true);
  try { await authClient.signInWithGoogle(); }
  catch (e) { setError((e as Error).message); setBusy(false); }
 }
 async function submit(e: React.FormEvent) {
  e.preventDefault(); setError(''); setMessage('');
  if (mode === 'signup' && password !== confirm) { setError('Passwords do not match.'); return; }
  setBusy(true);
  try {
   if (mode === 'signup') {
    const { needsConfirmation } = await authClient.signUp(name.trim(), email.trim(), password);
    if (needsConfirmation) { setMessage('Check your email to confirm your account, then sign in.'); setMode('signin'); setPassword(''); setConfirm(''); }
   } else await authClient.signInWithPassword(email.trim(), password);
  } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
 }
 return <div className="auth-screen"><BugField /><div className="auth-layout">
  <aside className="auth-hero">
   <div className="auth-hero-top"><img src="/pestcure-logo.png" alt="" /><span>PestCure</span></div>
   <div className="auth-hero-logo"><img src="/pestcure-logo.png" alt="PestCure" /></div>
   <div className="auth-hero-body">
    <h2>Weekly reviews,<br />run without the chaos.</h2>
    <p>One workspace to assign every team member their KPIs, track what’s filled, and keep targets aligned.</p>
    <ul className="auth-hero-list">
     <li>Role templates with daily, weekly &amp; monthly KPIs</li>
     <li>Target proposal → approval → results workflow</li>
     <li>Each member signs in and sees only their own report</li>
    </ul>
   </div>
   <div className="auth-hero-foot">PestCure Operations · Team Workspace</div>
  </aside>
  <main className="auth-panel"><div className="auth-card">
   <div className="auth-brand-mobile"><img src="/pestcure-logo.png" alt="" /><span>PestCure</span></div>
   <h1>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
   <p>{mode === 'signup' ? 'Set up your team’s review workspace in a minute.' : 'Sign in to your PestCure review workspace.'}</p>
   {authClient.signInWithGoogle && <>
     <button type="button" className="google-oauth-button" disabled={busy} onClick={signInWithGoogle}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"/></svg>
      Continue with Google
     </button>
     <div className="auth-divider"><span>or</span></div>
   </>}
   <form className="auth-form" onSubmit={submit}>
    {mode === 'signup' && <label>Full name<input required maxLength={100} autoComplete="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} /></label>}
    <label>Email<input type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} /></label>
    <label>Password<input type="password" required minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} /></label>
    {mode === 'signup' && <label>Confirm password<input type="password" required minLength={8} autoComplete="new-password" placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>}
    <button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
   </form>
   {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}
   <button className="auth-switch" disabled={busy} onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); setPassword(''); setConfirm(''); }}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
  </div></main>
 </div></div>;
}
