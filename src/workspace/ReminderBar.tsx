import React, { useEffect, useMemo, useState } from 'react';
import { AlarmClock, BellRing, ChevronDown, X } from 'lucide-react';
import type { Reminder } from './reminders';

const DISMISS_KEY = 'pestcure_reminders_dismissed';
const SHOWN_KEY = 'pestcure_reminders_alerted';
const readSet = (store: Storage, key: string) => { try { return new Set<string>(JSON.parse(store.getItem(key) ?? '[]')); } catch { return new Set<string>(); } };
const writeSet = (store: Storage, key: string, set: Set<string>) => { try { store.setItem(key, JSON.stringify([...set].slice(-200))); } catch { /* storage unavailable */ } };

/** Reminder strip above the page. Dismissals last for the browser session; the app icon badge and optional device alerts follow the same list. */
export function ReminderBar({ reminders, openReview, openView }: { reminders: Reminder[]; openReview: (id: string) => void; openView: (view: NonNullable<Reminder['view']>) => void }) {
  const [dismissed, setDismissed] = useState(() => readSet(sessionStorage, DISMISS_KEY));
  const [expanded, setExpanded] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'none'>(() => (typeof Notification === 'undefined' ? 'none' : Notification.permission));
  const visible = useMemo(() => reminders.filter(r => !dismissed.has(r.id)), [reminders, dismissed]);

  useEffect(() => {
    const badge = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    try { if (visible.length) void badge.setAppBadge?.(visible.length); else void badge.clearAppBadge?.(); } catch { /* badge unsupported */ }
  }, [visible.length]);

  useEffect(() => {
    if (permission !== 'granted') return;
    const alerted = readSet(localStorage, SHOWN_KEY);
    visible.filter(r => r.tone !== 'info' && !alerted.has(r.id)).slice(0, 3).forEach(r => {
      try { new Notification('PestCure', { body: r.text, icon: '/pwa-192x192.png', tag: r.id }); alerted.add(r.id); } catch { /* alerts blocked */ }
    });
    writeSet(localStorage, SHOWN_KEY, alerted);
  }, [visible, permission]);

  if (!visible.length) return null;
  const shown = expanded ? visible : visible.slice(0, 2);
  const dismiss = (id: string) => { const next = new Set(dismissed).add(id); setDismissed(next); writeSet(sessionStorage, DISMISS_KEY, next); };
  const go = (r: Reminder) => { if (r.reviewId) openReview(r.reviewId); else if (r.view) openView(r.view); };
  const enable = async () => { try { setPermission(await Notification.requestPermission()); } catch { /* unsupported */ } };

  return <section className="reminder-bar" aria-label="Reminders">
    <div className="reminder-head"><span><AlarmClock size={15} />Needs your attention<b>{visible.length}</b></span>
      {permission === 'default' && <button className="text-button" onClick={enable}><BellRing size={14} />Turn on alerts</button>}</div>
    <ul>{shown.map(r => <li key={r.id} className={`reminder ${r.tone}`}><button className="reminder-text" onClick={() => go(r)}>{r.text}</button><button className="reminder-x" aria-label="Dismiss reminder" onClick={() => dismiss(r.id)}><X size={14} /></button></li>)}</ul>
    {visible.length > 2 && <button className="reminder-more" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : `Show ${visible.length - 2} more`}<ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : undefined }} /></button>}
  </section>;
}
