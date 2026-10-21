import React, { useState } from 'react';
import {
  TrendingUp,
  Phone,
  FileCheck,
  Users,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';

interface TopMainKpiHeroProps {
  onOpenAddKpi?: (sectionHint?: string) => void;
  onOpenNewUserModal?: () => void;
}

export const TopMainKpiHero: React.FC<TopMainKpiHeroProps> = ({ onOpenAddKpi, onOpenNewUserModal }) => {
  const { member, activeMemberId, currentSheet, computedTotals, userRole, allMembers, setActiveMemberId } = usePestCure();
  const [isEmployeeExpanded, setIsEmployeeExpanded] = useState(true);

  const isTender = currentSheet.sheetType === 'tender_operations' || currentSheet.dailyTenderOperations !== undefined;
  const isCommercial = currentSheet.sheetType === 'commercial_bd' || currentSheet.dailyCommercialTasks !== undefined;

  const overallScore = Math.round(computedTotals.overallPerformancePct || 0);

  // Dynamic KRA Metric Cards calculation based on exact sheet contents
  let m1: { title: string; subtitle: string; actual: number; target: number; unit: string; icon: any; tag?: string };
  let m2: { title: string; subtitle: string; actual: number; target: number; unit: string; icon: any; tag?: string };
  let m3: { title: string; subtitle: string; actual: number; target: number; unit: string; icon: any; tag?: string };
  let m4: { title: string; subtitle: string; actual: number; target: number; unit: string; icon: any; tag?: string };

  let benchmarks: { title: string; target: string; icon: any }[] = [];

  if (isTender) {
    const tenderOps = currentSheet.dailyTenderOperations || [];
    const totalTenderTarget = tenderOps.reduce((acc, row) => acc + (row.targetPerDay * 6), 0);
    const totalTenderActual = tenderOps.reduce((acc, row) => acc + (row.total || 0), 0);

    const pipelineRows = currentSheet.pipelineBidding || [];
    const pipelineDone = pipelineRows.filter((p) => p.actual >= p.target).length;

    const feedbacksCount = currentSheet.tenderWeeklyKRA?.serviceFeedbacks?.length || 0;
    const extensionsCount = currentSheet.tenderWeeklyKRA?.extensionTenderSites?.length || 0;

    m1 = {
      title: 'Daily Tender Ops',
      subtitle: 'Calling & GeM Tracking',
      actual: totalTenderActual,
      target: totalTenderTarget || 60,
      unit: 'Entries',
      icon: Phone,
      tag: `${Math.round(computedTotals.tenderOpsAvgPct || 0)}%`
    };
    m2 = {
      title: 'Pipeline Compliance',
      subtitle: 'Bid Stages Reached',
      actual: pipelineDone,
      target: pipelineRows.length || 6,
      unit: 'Stages',
      icon: FileCheck,
      tag: `${Math.round(computedTotals.tenderPipelineAvgPct || 0)}%`
    };
    m3 = {
      title: 'Site Feedback & Pics',
      subtitle: 'Tender Site Reviews',
      actual: feedbacksCount,
      target: 6,
      unit: 'Sites',
      icon: Users,
      tag: undefined
    };
    m4 = {
      title: 'Tender Extensions',
      subtitle: 'Contract Continuations',
      actual: extensionsCount,
      target: 4,
      unit: 'Accounts',
      icon: Target,
      tag: undefined
    };

    benchmarks = [
      { title: 'Daily Tender Operations', target: 'Formula =(SUM/Target*6)*100 ≥ 85%', icon: Phone },
      { title: 'Bid Pipeline Compliance', target: 'Milestone Tracking ≥ 90%', icon: FileCheck },
      { title: 'Site Feedback & Pictures', target: 'Fortnightly calling & pics ≥ 6 sites', icon: Users },
      { title: 'Tender Extension Calling', target: '100% timely follow-ups', icon: Target }
    ];
  } else if (isCommercial) {
    const commercialOps = currentSheet.dailyCommercialTasks || [];
    const totalCommTarget = commercialOps.reduce((acc, row) => acc + (row.targetPerDay * 6), 0);
    const totalCommActual = commercialOps.reduce((acc, row) => acc + (row.total || 0), 0);

    const weeklyTasks = currentSheet.weeklyTasks || [];
    const completedWeekly = weeklyTasks.filter((t) => t.status === 'Completed' || (t.pctDone && t.pctDone >= 100)).length;

    const runningAccs = currentSheet.runningAccountsSummary || [];
    const reviewedAccs = runningAccs.filter((a) => a.monthlyReviewStatus === 'Done').length;

    const achievements = currentSheet.achievements || [];

    m1 = {
      title: 'Daily Commercial BD',
      subtitle: 'Key Client Calling',
      actual: totalCommActual,
      target: totalCommTarget || 60,
      unit: 'Calls',
      icon: Phone,
      tag: `${Math.round(computedTotals.dailyCommercialAvgPct || 0)}%`
    };
    m2 = {
      title: 'Field Audits & Tasks',
      subtitle: 'Site Visits & Quotes',
      actual: completedWeekly,
      target: weeklyTasks.length || 6,
      unit: 'Tasks',
      icon: FileCheck,
      tag: undefined
    };
    m3 = {
      title: 'Running Accounts',
      subtitle: 'Monthly Account Review',
      actual: reviewedAccs,
      target: runningAccs.length || 5,
      unit: 'Clients',
      icon: Users,
      tag: undefined
    };
    m4 = {
      title: 'BD Achievements',
      subtitle: 'New Contracts Signed',
      actual: achievements.length,
      target: 3,
      unit: 'Wins',
      icon: Target,
      tag: 'Wins'
    };

    benchmarks = [
      { title: 'Daily Commercial BD Ops', target: 'Formula =(SUM/Target*6)*100 ≥ 85%', icon: Phone },
      { title: 'Field Audits & Visits', target: 'Completion Rate ≥ 80%', icon: FileCheck },
      { title: 'Running Accounts Review', target: '100% monthly client coverage', icon: Users },
      { title: 'New Commercial Contracts', target: '≥ 3 strategic accounts/month', icon: Target }
    ];
  } else {
    // Deepika Gulia (Customer Care / Operations & Client Servicing)
    const callingRows = currentSheet.dailyCallingMetrics || [];
    const totalCallingActual = callingRows.reduce((acc, row) => acc + (row.total || 0), 0);
    const totalCallingTarget = callingRows.reduce((acc, row) => acc + (row.targetPerDay * 6), 0);

    const quoteRow = callingRows.find((r) => r.taskName.toLowerCase().includes('quotation'));
    const quoteActual = quoteRow ? quoteRow.total : 0;
    const quoteTarget = quoteRow ? quoteRow.targetPerDay * 6 : 12;

    const renewalRow = callingRows.find((r) => r.taskName.toLowerCase().includes('renewal'));
    const renewalActual = renewalRow ? renewalRow.total : 0;
    const renewalTarget = renewalRow ? renewalRow.targetPerDay * 6 : 60;

    const weeklyTasks = currentSheet.weeklyTasks || [];
    const completedKras = weeklyTasks.filter((t) => t.status === 'Completed' || (t.pctDone && t.pctDone >= 100)).length;

    m1 = {
      title: 'Telecalling & Follow-ups',
      subtitle: 'Daily Calls (Mon-Sat)',
      actual: totalCallingActual,
      target: totalCallingTarget || 300,
      unit: 'Calls',
      icon: Phone,
      tag: `${Math.round(computedTotals.renewalsPct || 0)}%`
    };
    m2 = {
      title: 'Quotation Follow-ups',
      subtitle: 'Warm Pipeline Conversions',
      actual: quoteActual,
      target: quoteTarget || 12,
      unit: 'Quotes',
      icon: FileCheck,
      tag: undefined
    };
    m3 = {
      title: 'Renewals & Retention',
      subtitle: 'Client Continuity',
      actual: renewalActual,
      target: renewalTarget || 60,
      unit: 'Clients',
      icon: Users,
      tag: 'Active'
    };
    m4 = {
      title: 'Weekly KRA Goals',
      subtitle: 'Operational Milestones',
      actual: completedKras,
      target: weeklyTasks.length || 5,
      unit: 'Goals',
      icon: Target,
      tag: undefined
    };

    benchmarks = [
      { title: 'Telecalling Target', target: '≥ 50 calls/day (≥ 300/week)', icon: Phone },
      { title: 'Quotation Follow-ups', target: '≥ 2 calls/day (≥ 12/week)', icon: FileCheck },
      { title: 'Renewals & Retention', target: '≥ 10 calls/day (≥ 60/week)', icon: Users },
      { title: 'Weekly KRAs & Milestones', target: '100% on-time completion', icon: Target }
    ];
  }

  const memberInitials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const getScoreStatus = (score: number) => {
    if (score >= 70) return { label: 'High Performer (Green)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (score >= 50) return { label: 'Average (Mustard)', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (score >= 30) return { label: 'Needs Improvement (Red)', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    return { label: 'Action Required (Grey)', color: 'bg-stone-200 text-stone-800 border-stone-300' };
  };

  const statusInfo = getScoreStatus(overallScore);

  return (
    <div id="team-performance-hero" className="bg-white border border-stone-200/90 rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
      {/* 1. Header: Clean performance header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              Performance Overview
            </h2>
            <p className="text-xs text-stone-500">
              Weekly progress against targets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Formula Thresholds Legend */}
          <div className="hidden md:flex items-center gap-2.5 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>≥70% Good</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>50-69% Average</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>&lt;50% Critical</span>
            </div>
          </div>

          {/* Overall Percentage Score Pill */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-mono-code font-bold border ${
              overallScore >= 70
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : overallScore >= 50
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}>
              {overallScore}% Overall
            </div>
          </div>
        </div>
      </div>

      {/* 2. Employee Row with Soft Pastel Metric Cards */}
      <div className="border border-orange-200/60 rounded-2xl p-4 md:p-5 bg-gradient-to-br from-orange-50/30 to-amber-50/20 space-y-4">
        {/* Employee Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ea580c] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
              {memberInitials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={activeMemberId}
                    onChange={(e) => setActiveMemberId(e.target.value)}
                    className="text-sm font-bold text-stone-900 bg-white border border-stone-200 hover:border-orange-300 rounded-lg px-2.5 py-1 pr-6 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-2xs appearance-none"
                    title="Switch employee review sheet"
                  >
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <span className="text-[11px] font-semibold text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                  {member.department}
                </span>
                {onOpenNewUserModal && (
                  <button
                    type="button"
                    onClick={onOpenNewUserModal}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-100/70 hover:bg-orange-100 border border-orange-300/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs"
                    title="Create new user or custom role"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ New User / Role</span>
                  </button>
                )}
              </div>
              <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                <span>Cycle: <strong>{currentSheet.cycleLabel}</strong></span>
                <span>•</span>
                <span>Role: <strong>{member.role}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
              {overallScore >= 70 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{statusInfo.label}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsEmployeeExpanded(!isEmployeeExpanded)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer transition-colors"
              title="Toggle metric cards"
            >
              {isEmployeeExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* 4 Soft Pastel Metric Cards */}
        {isEmployeeExpanded && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {[m1, m2, m3, m4].map((metric, idx) => {
              const Icon = metric.icon;
              const pct = metric.target > 0 ? Math.round((metric.actual / metric.target) * 100) : 0;

              return (
                <div
                  key={idx}
                  className="bg-white border border-stone-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-orange-300 hover:shadow-xs transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between text-orange-600 mb-2">
                    <div className="p-1.5 rounded-lg bg-orange-50 text-[#ea580c]">
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    {metric.tag && (
                      <span className="text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-orange-100/80 text-orange-800 border border-orange-200">
                        {metric.tag}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xl font-bold text-stone-900 tracking-tight flex items-baseline gap-1 font-mono-code">
                      <span>{metric.actual}</span>
                      <span className="text-xs font-semibold text-stone-400">
                        /{metric.target}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-stone-800 mt-1 truncate">
                      {metric.title}
                    </div>
                    <div className="text-[11px] text-stone-500 truncate">
                      {metric.subtitle}
                    </div>

                    {/* Mini progress bar */}
                    <div className="w-full h-1.5 bg-stone-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct >= 70
                            ? 'bg-emerald-500'
                            : pct >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Performance Benchmark Targets Strip */}
      <div className="pt-2 border-t border-stone-200/80">
        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2.5">
          {member.name}&rsquo;s Operational Performance Targets
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {benchmarks.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-stone-50 border border-stone-200/70">
                <div className="p-1 rounded-lg bg-orange-100 text-[#ea580c] shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-stone-800 leading-tight">{b.title}</div>
                  <div className="text-[11px] text-stone-500 font-medium mt-0.5">{b.target}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

