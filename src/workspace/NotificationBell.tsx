import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ClipboardCheck, MessageSquareWarning, Target } from 'lucide-react';
import type { AppNotification } from './model';

const storageKey = (personId: string) => `pestcure_notif_read_${personId}`;

/** Which notifications this browser has already opened. Members cannot write to the shared workspace, so read state stays local. */
export function useReadNotifications(personId: string) {
  const [read, setRead] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem(storageKey(personId)) ?? '[]')); } catch { return new Set<string>(); }
  });
  const mark = useCallback((ids: string[]) => {
    setRead(prev => {
      const next = new Set([...prev, ...ids]);
      try { localStorage.setItem(storageKey(personId), JSON.stringify([...next].slice(-500))); } catch { /* storage unavailable */ }
      return next;
    });
  }, [personId]);
  return { read, mark };
}

export const notificationIcon = (kind: AppNotification['kind']) =>
  kind === 'targets-approved' || kind === 'review-approved' ? <CheckCheck size={16} /> : kind === 'targets-adjusted' ? <Target size={16} /> : kind === 'targets-returned' || kind === 'review-returned' ? <MessageSquareWarning size={16} /> : <ClipboardCheck size={16} />;

export const timeAgo = (iso: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export function NotificationBell({ notifications, personId, onOpen }: { notifications: AppNotification[]; personId: string; onOpen: (reviewId?: string) => void }) {
  const { read, mark } = useReadNotifications(personId);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const unread = notifications.filter(n => !read.has(n.id));
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return <div className="notif-wrap" ref={box}>
    <button className="icon-button notification-button" aria-label={unread.length ? `${unread.length} unread notifications` : 'Notifications'} aria-expanded={open} onClick={() => setOpen(!open)}><Bell size={19} />{unread.length > 0 && <b className="notif-count">{unread.length > 9 ? '9+' : unread.length}</b>}</button>
    {open && <div className="notif-pop" role="dialog" aria-label="Notifications">
      <div className="notif-head"><strong>Notifications</strong>{unread.length > 0 && <button className="text-button" onClick={() => mark(notifications.map(n => n.id))}>Mark all read</button>}</div>
      <div className="notif-list">{notifications.slice(0, 12).map(n => <button key={n.id} className={`notif-item ${read.has(n.id) ? '' : 'unread'}`} onClick={() => { mark([n.id]); setOpen(false); onOpen(n.reviewId); }}>
        <span className={`notif-icon ${n.kind}`}>{notificationIcon(n.kind)}</span><span><span className="notif-text">{n.text}</span><small>{timeAgo(n.at)}</small></span>
      </button>)}{!notifications.length && <p className="notif-empty">You are all caught up.</p>}</div>
    </div>}
  </div>;
}
