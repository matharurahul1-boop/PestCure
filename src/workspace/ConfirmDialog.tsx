import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Options = { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean };

/** iOS-style alert: `const [confirm, dialog] = useConfirm(); if (await confirm({...})) ...; return <>{dialog}...</>` */
export function useConfirm(): [(o: Options) => Promise<boolean>, React.ReactNode] {
  const [opts, setOpts] = useState<Options | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const confirm = useCallback((o: Options) => new Promise<boolean>(resolve => { resolver.current?.(false); resolver.current = resolve; setOpts(o); }), []);
  const done = (ok: boolean) => { resolver.current?.(ok); resolver.current = null; setOpts(null); };

  useEffect(() => {
    if (!opts) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') done(false); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [opts]);

  const dialog = opts ? createPortal(
    <div className="ios-alert-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) done(false); }}>
      <div className="ios-alert" role="alertdialog" aria-modal="true" aria-label={opts.title}>
        <div className="ios-alert-body"><h3>{opts.title}</h3>{opts.message && <p>{opts.message}</p>}</div>
        <div className="ios-alert-actions">
          <button autoFocus onClick={() => done(false)}>{opts.cancelLabel ?? 'Cancel'}</button>
          <button className={opts.destructive ? 'danger' : 'primary'} onClick={() => done(true)}>{opts.confirmLabel ?? 'OK'}</button>
        </div>
      </div>
    </div>,
    (document.querySelector('.workspace') as HTMLElement | null) ?? document.body) : null;
  return [confirm, dialog];
}
