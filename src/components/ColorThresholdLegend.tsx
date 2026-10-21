import React from 'react';
import { Award, AlertTriangle, AlertCircle, HelpCircle, Lock } from 'lucide-react';

interface ColorThresholdLegendProps {
  className?: string;
}

export const ColorThresholdLegend: React.FC<ColorThresholdLegendProps> = ({ className = '' }) => {
  return (
    <div
      id="color-threshold-legend"
      className={`bg-white/95 backdrop-blur-sm border border-stone-200/90 rounded-2xl p-3.5 shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
            Performance & Status Legends
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Green >= 70% */}
          <div
            id="legend-high-performer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm animate-pulse" />
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>&ge; 70% (Target Achieved / High)</span>
          </div>

          {/* Yellow/Mustard 50% - 69% */}
          <div
            id="legend-satisfactory"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>50% &ndash; 69% (In-Progress)</span>
          </div>

          {/* Orange/Red 30% - 49% */}
          <div
            id="legend-needs-action"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>30% &ndash; 49% (Action Required)</span>
          </div>

          {/* Grey < 30% */}
          <div
            id="legend-critical"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-stone-700 font-medium"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
            <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
            <span>&lt; 30% (Critical Gap)</span>
          </div>

          {/* Lock state */}
          <div
            id="legend-frozen"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 font-medium"
          >
            <Lock className="w-3 h-3 text-slate-600" />
            <span>Locked / Past Date</span>
          </div>
        </div>
      </div>
    </div>
  );
};
