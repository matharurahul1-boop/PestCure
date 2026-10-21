import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, CircleHelp, LogOut, Settings2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar } from './Avatar';

export type MoreItem = { name: string; label?: string; icon: LucideIcon; badge?: number; active?: boolean };

/** iOS-style bottom sheet behind the "More" tab on phones: a profile header and grouped, tappable rows. */
export function MoreSheet({ items, user, onSelect, onSettings, onHelp, onSignOut, close, settingsActive }: {
  items: MoreItem[]; user: { name: string; avatarUrl?: string; subtitle: string };
  onSelect: (name: string) => void; onSettings: () => void; onHelp: () => void; onSignOut?: () => void; close: () => void; settingsActive?: boolean;
}) {
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const dismiss = () => { setLeaving(true); window.setTimeout(close, 180); };

  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', key); };
  }, []);

  const go = (fn: () => void) => () => { fn(); close(); };
  const row = (key: string, icon: React.ReactNode, label: string, onClick: () => void, opts: { badge?: number; active?: boolean; danger?: boolean } = {}) =>
    <button key={key} className={`more-row${opts.active ? ' active' : ''}${opts.danger ? ' danger' : ''}`} onClick={onClick}>
      <span className="more-icon">{icon}</span><span className="more-label">{label}</span>
      {!!opts.badge && <b className="more-badge">{opts.badge}</b>}{!opts.danger && <ChevronRight size={17} className="more-chev" />}
    </button>;

  return createPortal(
    <div className={`more-backdrop${leaving ? ' leaving' : ''}`} onMouseDown={e => { if (e.target === e.currentTarget) dismiss(); }}>
      <div className="more-sheet" role="dialog" aria-modal="true" aria-label="More" style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}>
        <div className="more-grab"
          onTouchStart={e => { start.current = e.touches[0].clientY; }}
          onTouchMove={e => { if (start.current !== null) setDrag(Math.max(0, e.touches[0].clientY - start.current)); }}
          onTouchEnd={() => { const far = drag > 90; start.current = null; setDrag(0); if (far) dismiss(); }}>
          <i />
        </div>
        <div className="more-profile"><Avatar name={user.name} url={user.avatarUrl} /><span><strong>{user.name}</strong><small>{user.subtitle}</small></span></div>
        <div className="more-scroll">
          {items.length > 0 && <div className="more-group">{items.map(n => row(n.name, <n.icon size={18} />, n.label ?? n.name, go(() => onSelect(n.name)), { badge: n.badge, active: n.active }))}</div>}
          <div className="more-group">
            {row('settings', <Settings2 size={18} />, 'Settings', go(onSettings), { active: settingsActive })}
            {row('help', <CircleHelp size={18} />, 'How it works', go(onHelp))}
          </div>
          {onSignOut && <div className="more-group">{row('out', <LogOut size={18} />, 'Sign out', go(onSignOut), { danger: true })}</div>}
        </div>
      </div>
    </div>,
    (document.querySelector('.workspace') as HTMLElement | null) ?? document.body);
}
