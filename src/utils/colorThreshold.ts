export interface ThresholdStyle {
  tier: 'green' | 'mustard' | 'red' | 'grey';
  label: string;
  statusLabel: string;
  shortStatus: string;
  bgClass: string;
  badgeClass: string;
  textClass: string;
  borderClass: string;
  cellBgClass: string;
  rowBgClass: string;
  hexColor: string;
}

/**
 * Performance Threshold Rule:
 * > 70%       => Green (High Achievement)
 * 50% - 69%   => Mustard (Average / Moderate)
 * 30% - 49%   => Red (Low / Critical)
 * <= 29%      => Grey (Minimal / Incomplete)
 */
export function getPerformanceThreshold(percent: number): ThresholdStyle {
  const p = Math.round(percent);
  
  if (p > 70) {
    return {
      tier: 'green',
      label: 'Target Achieved (>70%)',
      statusLabel: 'Target Achieved',
      shortStatus: 'Achieved',
      bgClass: 'bg-emerald-600 text-white',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
      textClass: 'text-emerald-700 font-bold',
      borderClass: 'border-emerald-400',
      cellBgClass: 'bg-emerald-50/90 text-emerald-900 font-semibold border-emerald-200',
      rowBgClass: 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-950 font-medium transition-colors',
      hexColor: '#10b981'
    };
  }
  
  if (p >= 50 && p <= 70) {
    return {
      tier: 'mustard',
      label: 'Moderate Progress (>50%)',
      statusLabel: 'Moderate Progress',
      shortStatus: 'Moderate',
      bgClass: 'bg-amber-500 text-slate-900',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      textClass: 'text-amber-800 font-bold',
      borderClass: 'border-amber-400',
      cellBgClass: 'bg-amber-50/90 text-amber-950 font-semibold border-amber-200',
      rowBgClass: 'bg-amber-50/80 hover:bg-amber-100 text-amber-950 font-medium transition-colors',
      hexColor: '#d97706'
    };
  }
  
  if (p >= 30 && p < 50) {
    return {
      tier: 'red',
      label: 'Needs Attention (30-49%)',
      statusLabel: 'Needs Attention',
      shortStatus: 'Needs Attention',
      bgClass: 'bg-rose-600 text-white',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
      textClass: 'text-rose-700 font-bold',
      borderClass: 'border-rose-400',
      cellBgClass: 'bg-rose-50/90 text-rose-950 font-semibold border-rose-200',
      rowBgClass: 'bg-rose-50/80 hover:bg-rose-100 text-rose-950 font-medium transition-colors',
      hexColor: '#ef4444'
    };
  }
  
  return {
    tier: 'grey',
    label: 'Pending / Incomplete (≤29%)',
    statusLabel: 'Pending / Incomplete',
    shortStatus: 'Pending',
    bgClass: 'bg-slate-500 text-white',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    textClass: 'text-slate-600 font-medium',
    borderClass: 'border-slate-300',
    cellBgClass: 'bg-slate-100/90 text-slate-700 font-medium border-slate-200',
    rowBgClass: 'bg-slate-50/80 hover:bg-slate-100 text-slate-800 font-medium transition-colors',
    hexColor: '#64748b'
  };
}

/**
 * Safe rounding helper: rounds to max 2 decimal places (e.g. 91.67, 50, 45.5)
 */
export function roundToTwo(val: number | string | undefined | null): number {
  if (val === undefined || val === null || isNaN(Number(val))) return 0;
  const num = Number(val);
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatINR(val: number | string | undefined | null): string {
  if (val === undefined || val === null || isNaN(Number(val))) return '₹0';
  const num = Number(val);
  return '₹' + num.toLocaleString('en-IN');
}

export function formatPercent(val: number | string | undefined | null): string {
  if (val === undefined || val === null || isNaN(Number(val))) return '0%';
  const num = Number(val);
  const rounded = roundToTwo(num);
  return `${rounded}%`;
}

export function safeDivision(numerator: number, denominator: number): number {
  if (!denominator || denominator === 0 || isNaN(denominator) || isNaN(numerator)) {
    return 0;
  }
  const result = (numerator / denominator) * 100;
  return roundToTwo(result);
}
