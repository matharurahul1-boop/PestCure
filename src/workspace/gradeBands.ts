import type { CSSProperties } from 'react';

/**
 * Admin-configurable achievement grade bands, shown wherever a review's achievement %
 * is colored (score ring, KPI results, the "why the score moved" breakdown, daily/weekly
 * table percent cells). Each band owns a gradient (colorFrom → colorTo) plus a solid text
 * colour, and applies from its minScore upward until the next band's minScore.
 */
export type GradeBand = { id: string; grade: string; label: string; minScore: number; colorFrom: string; colorTo: string; colorText: string };

export const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { id: 'band-on-track', grade: 'A', label: 'On track', minScore: 80, colorFrom: '#6ee7b7', colorTo: '#059669', colorText: '#047857' },
  { id: 'band-watch', grade: 'B', label: 'Needs attention', minScore: 50, colorFrom: '#fde68a', colorTo: '#d97706', colorText: '#b45309' },
  { id: 'band-support', grade: 'C', label: 'Support needed', minScore: 0, colorFrom: '#fca5a5', colorTo: '#dc2626', colorText: '#b91c1c' },
];

export const UNSCORED_BAND: GradeBand = { id: 'unscored', grade: '—', label: 'Unscored', minScore: -1, colorFrom: '#cbd5e1', colorTo: '#94a3b8', colorText: '#64748b' };

/** Highest band whose minScore the percent clears; UNSCORED_BAND when there is no percent. */
export function matchBand(percent: number | null, bands: GradeBand[]): GradeBand {
  const list = bands.length ? bands : DEFAULT_GRADE_BANDS;
  if (percent === null || !Number.isFinite(percent)) return UNSCORED_BAND;
  const sorted = [...list].sort((a, b) => b.minScore - a.minScore);
  return sorted.find(b => percent >= b.minScore) ?? sorted[sorted.length - 1];
}

/** Solid-to-solid gradient for fills (bars, chips) so every chart uses the admin's band colours. */
export function bandFill(percent: number | null, bands: GradeBand[], direction = '180deg') {
  const band = matchBand(percent, bands);
  return `linear-gradient(${direction}, ${band.colorFrom}, ${band.colorTo})`;
}

export function bandRing(percent: number | null, bands: GradeBand[]) {
  const band = matchBand(percent, bands);
  const pct = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  return { background: `conic-gradient(${band.colorFrom} 0%, ${band.colorTo} ${pct}%, var(--subtle) 0)`, color: band.colorText } as CSSProperties;
}
