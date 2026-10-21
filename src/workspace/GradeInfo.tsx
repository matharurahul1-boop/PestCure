import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X } from 'lucide-react';
import type { GradeBand } from './gradeBands';

/** Score range of each grade, highest first: "90–100%", "75–89%" … derived from the configured minimum scores. */
export function gradeRanges(bands: GradeBand[]): Array<{ band: GradeBand; from: number; to: number }> {
  const sorted = [...bands].sort((a, b) => b.minScore - a.minScore);
  return sorted.map((band, i) => ({ band, from: Math.max(0, band.minScore), to: i === 0 ? 100 : Math.max(0, sorted[i - 1].minScore - 1) }));
}

/** An eye icon that opens a small guide: every grade, what it means and the score range it covers. */
export function GradeInfo({ bands, current, label = 'What do the grades mean?' }: { bands: GradeBand[]; current?: GradeBand | null; label?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [open]);
  const rows = gradeRanges(bands);
  return <>
    <button type="button" className="grade-eye" aria-label={label} title={label} onClick={e => { e.stopPropagation(); setOpen(true); }}><Eye size={15} /></button>
    {open && createPortal(
      <div className="grade-guide-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="grade-guide" role="dialog" aria-modal="true" aria-label="Grade guide">
          <header><div><small>Score guide</small><h3>What your grade means</h3></div><button type="button" aria-label="Close" onClick={() => setOpen(false)}><X size={18} /></button></header>
          <p>Your score is the average achievement across your KPIs (each capped at 100%). The grade is the band your score falls in.</p>
          <ul>{rows.map(({ band, from, to }) => <li key={band.id} className={current?.id === band.id ? 'now' : ''}>
            <span className="grade-letter" style={{ background: `linear-gradient(135deg, ${band.colorFrom}, ${band.colorTo})` }}>{band.grade}</span>
            <span className="grade-what"><strong>{band.label}</strong><small>Score {from === to ? `${from}%` : `${from}% to ${to}%`}</small></span>
            <span className="grade-span" aria-hidden="true"><i style={{ left: `${from}%`, width: `${Math.max(2, to - from)}%`, background: `linear-gradient(90deg, ${band.colorFrom}, ${band.colorTo})` }} /></span>
            {current?.id === band.id && <em>You are here</em>}
          </li>)}</ul>
        </div>
      </div>,
      (document.querySelector('.workspace') as HTMLElement | null) ?? document.body)}
  </>;
}
