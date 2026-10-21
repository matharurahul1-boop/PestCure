import React from 'react';
import { History, Shield, User, ArrowRight, Target, CheckCircle2, Clock } from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';
import { formatINR } from '../utils/colorThreshold';

export const AuditLogsView: React.FC = () => {
  const { member, targetAuditLogs } = usePestCure();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono-code uppercase tracking-widest text-emerald-400 font-bold">
              Governance & Compliance Trail
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight font-display text-white mt-0.5">
              Target Modification & Approval Audit Logs
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Immutable logs of all target proposals, management modifications, approvals, and reviewer notes for {member.name}.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="text-xs text-slate-500 font-medium">
          Showing {targetAuditLogs.length} logged revision events:
        </div>

        <div className="space-y-4">
          {targetAuditLogs.map((log, idx) => (
            <div
              key={log.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 relative hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      log.action === 'Approved'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : log.action === 'Proposed'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : log.action === 'Modified & Approved'
                        ? 'bg-teal-100 text-teal-900 border border-teal-300'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{log.actorName}</span>
                  <span className="text-xs text-slate-500 font-mono-code uppercase">({log.actorRole})</span>
                </div>
                <span className="text-xs font-mono-code text-slate-500">{log.timestamp}</span>
              </div>

              {/* Target Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Monthly OP Target</span>
                  <span className="text-sm font-bold font-mono-code text-slate-900">{formatINR(log.newTargets.monthlyTargetOp)}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Monthly SR Target</span>
                  <span className="text-sm font-bold font-mono-code text-slate-900">{formatINR(log.newTargets.monthlyTargetSr)}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Weekly OP Target</span>
                  <span className="text-sm font-bold font-mono-code text-slate-900">{formatINR(log.newTargets.weeklyTargetOp)}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Weekly SR Target</span>
                  <span className="text-sm font-bold font-mono-code text-slate-900">{formatINR(log.newTargets.weeklyTargetSr)}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Daily Calls</span>
                  <span className="text-sm font-bold font-mono-code text-slate-900">{log.newTargets.dailyTargetRenewals} calls/day</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Daily Quotes</span>
                  <span className="text-sm font-bold font-mono-code text-slate-900">{log.newTargets.dailyTargetQuotation} quotes/day</span>
                </div>
              </div>

              {log.notes && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 italic">
                  <strong>Notes:</strong> {log.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
