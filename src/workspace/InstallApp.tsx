import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BellRing, Download, MonitorSmartphone, Share, SquarePlus } from 'lucide-react';
import { Modal } from './Modal';
import { disablePush, enablePush, pushAvailable, pushEnabledHere } from './push';

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let captured: InstallEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); captured = e as InstallEvent; window.dispatchEvent(new Event('pestcure-installable')); });
  window.addEventListener('appinstalled', () => { captured = null; window.dispatchEvent(new Event('pestcure-installable')); });
}

const standalone = () => typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function useInstall() {
  const [, tick] = useState(0);
  useEffect(() => {
    const h = () => tick(n => n + 1);
    window.addEventListener('pestcure-installable', h);
    return () => window.removeEventListener('pestcure-installable', h);
  }, []);
  return {
    installed: standalone(),
    ios: isIOS(),
    canPrompt: !!captured,
    prompt: async () => { const e = captured; if (!e) return false; await e.prompt(); const r = await e.userChoice; captured = null; tick(n => n + 1); return r.outcome === 'accepted'; },
  };
}

export const alertsSupported = () => typeof Notification !== 'undefined';

/** Shows a system notification for each new item once permission is granted (works while the app is open or installed). */
export function useSystemAlerts(items: Array<{ id: string; text: string }>) {
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (seen.current === null) { seen.current = new Set(items.map(i => i.id)); return; }
    const fresh = items.filter(i => !seen.current!.has(i.id));
    fresh.forEach(i => seen.current!.add(i.id));
    if (!fresh.length || !alertsSupported() || Notification.permission !== 'granted' || pushEnabledHere()) return;
    fresh.slice(0, 3).forEach(async i => {
      const opts = { body: i.text, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png', tag: i.id };
      try { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) await reg.showNotification('PestCure', opts); else new Notification('PestCure', opts); } catch { /* alerts are best-effort */ }
    });
  }, [items]);
}

export function InstallButton() {
  const { installed, ios, canPrompt, prompt } = useInstall();
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(alertsSupported() ? Notification.permission : 'unsupported');
  const install = async () => { if (canPrompt) { const ok = await prompt(); if (ok) setOpen(false); } };
  const [pushOn, setPushOn] = useState(pushEnabledHere());
  const [busy, setBusy] = useState(false);
  const real = pushAvailable();
  const enable = async () => {
    setBusy(true);
    if (real) { const r = await enablePush(); setPushOn(r === 'on'); setPerm(alertsSupported() ? Notification.permission : 'unsupported'); }
    else setPerm(await Notification.requestPermission());
    setBusy(false);
  };
  const disable = async () => { setBusy(true); await disablePush(); setPushOn(false); setBusy(false); };
  if (installed && perm !== 'default' && !real) return null;
  return <>
    <button className="icon-button install-button" aria-label={installed ? 'Turn on alerts' : 'Install app'} title={installed ? 'Turn on alerts' : 'Install app'} onClick={() => (canPrompt && !installed && perm !== 'default' ? install() : setOpen(true))}>
      {installed ? <BellRing size={19} /> : <Download size={19} />}
    </button>
    {open && createPortal(<Modal title={installed ? 'Alerts' : 'Install PestCure'} close={() => setOpen(false)}>
      <div className="install-sheet">
        {!installed && <>
          <p className="muted">Install PestCure on this device for a full-screen app with its own icon, faster loading and alerts.</p>
          {canPrompt && <button className="button primary" onClick={install}><Download size={16} /> Install now</button>}
          {!canPrompt && ios && <ol className="install-steps">
            <li>Open this page in <b>Safari</b>.</li>
            <li>Tap the <Share size={15} /> <b>Share</b> button.</li>
            <li>Choose <SquarePlus size={15} /> <b>Add to Home Screen</b>, then tap <b>Add</b>.</li>
          </ol>}
          {!canPrompt && !ios && <ol className="install-steps">
            <li><MonitorSmartphone size={15} /> <b>Chrome / Edge:</b> open the browser menu (⋮) and choose <b>Install app</b> or <b>Add to Home screen</b>.</li>
            <li>On desktop you can also click the install icon at the right end of the address bar.</li>
            <li>Already installed? Open PestCure from your home screen or app list.</li>
          </ol>}
        </>}
        {perm !== 'unsupported' && <div className="install-alerts">
          <strong><BellRing size={15} /> Alerts</strong>
          {perm === 'granted' && real && pushOn && <><p className="muted">Alerts are on for this device. You are notified even when the app is closed.</p><button className="button" disabled={busy} onClick={disable}>Turn off alerts</button></>}
          {perm === 'granted' && real && !pushOn && <><p className="muted">Get notified even when the app is closed.</p><button className="button" disabled={busy} onClick={enable}>Turn on alerts</button></>}
          {perm === 'granted' && !real && <p className="muted">Alerts are on. You get a notification when something new needs you while the app is open or installed.</p>}
          {perm === 'denied' && <p className="muted">Alerts are blocked. Allow notifications for this site in your browser settings.</p>}
          {perm === 'default' && <><p className="muted">{ios && !installed ? 'On iPhone/iPad, install the app first (steps above), then open it and turn on alerts.' : 'Get notified about approvals and target updates.'}</p>
            <button className="button" disabled={busy || (ios && !installed)} onClick={enable}>Turn on alerts</button></>}
        </div>}
      </div>
    </Modal>, (document.querySelector('.workspace') as HTMLElement | null) ?? document.body)}
  </>;
}
