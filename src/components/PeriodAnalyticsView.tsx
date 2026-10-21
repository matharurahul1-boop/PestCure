import React from 'react';
import {
  Calendar,
  TrendingUp,
  Filter,
  CheckCircle2,
  DollarSign,
  PhoneCall,
  FileCheck2,
  Award,
  Users,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
  Search,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { usePestCure, PeriodFilterType } from '../context/PestCureContext';
import {
  getPerformanceThreshold,
  formatINR,
  formatPercent,
  safeDivision
} from '../utils/colorThreshold';

export const PeriodAnalyticsView: React.FC = () => {
  const {
    member,
    allSheets,
    currentSheet,
    periodFilter,
    setPeriodFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    computedTotals
  } = usePestCure();

  const isTender = currentSheet.sheetType === 'tender_operations' || currentSheet.dailyTenderOperations !== undefined;

  // Aggregate across selected range/filter
  const filteredSheets = allSheets.filter((s) => {
    if (periodFilter === 'weekly') return true;
    if (periodFilter === 'daily') return s.id === currentSheet.id;
    if (periodFilter === 'monthly') return true;
    if (periodFilter === 'yearly') return true;
    if (periodFilter === 'custom') {
      const sDate = s.attendance.periodStart;
      return sDate >= customStartDate && sDate <= customEndDate;
    }
    return true;
  });

  // Calculate combined metrics
  const totalRevenue = filteredSheets.reduce((acc, s) => {
    const op = s.salesMetrics.reduce((sum, r) => sum + (Number(r.opValue) || 0), 0);
    const sr = s.salesMetrics.reduce((sum, r) => sum + (Number(r.srValue) || 0), 0);
    return acc + op + sr;
  }, 0);

  const totalCallsLogged = filteredSheets.reduce((acc, s) => {
    const ren = s.dailyTasks.callingAndQuotes.find(r => r.taskName.includes('Renewal'));
    if (!ren) return acc;
    const sum = (ren.days.mon || 0) + (ren.days.tue || 0) + (ren.days.wed || 0) + (ren.days.thu || 0) + (ren.days.fri || 0) + (ren.days.sat || 0) + (ren.days.sun || 0);
    return acc + sum;
  }, 0);

  // Performance scores and styles
  const overallPeriodScore = computedTotals.overallPerformancePct;
  const overallStyle = getPerformanceThreshold(overallPeriodScore);

  // Tender specific styles
  const tenderOpsStyle = getPerformanceThreshold(computedTotals.tenderOpsAvgPct);
  const tenderPipeStyle = getPerformanceThreshold(computedTotals.tenderPipelinePct);
  const tenderSalesTasksStyle = getPerformanceThreshold(computedTotals.tenderSalesTasksPct);

  // Customer care specific styles
  const callingStyle = getPerformanceThreshold(computedTotals.renewalsPct);
  const weeklySalesStyle = getPerformanceThreshold((computedTotals.weeklyOpAchievementPct + computedTotals.weeklySrAchievementPct) / 2);
  const monthlyStyle = getPerformanceThreshold(computedTotals.monthlyOpAchievementPct);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">

      {/* Header & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono-code uppercase tracking-widest text-emerald-400 font-bold">
              {isTender ? 'Tender Operations Performance Matrix' : 'Customer Care Performance Matrix'}
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight font-display text-white mt-1">
              Period & Date Analytics · <span className="text-amber-300">{member.name}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Filtered evaluation with strict formula calculations and color-coded performance thresholds (&gt;70% Green, 50-69% Mustard, 30-49% Red, ≤29% Grey).
            </p>
          </div>

          {/* Period Filter Selector Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
            {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as PeriodFilterType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setPeriodFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  periodFilter === tab
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Picker if tab is custom */}
        {periodFilter === 'custom' && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Custom Date Range:
            </span>
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
              />
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>
            <span className="text-[11px] font-mono-code text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
              Matching Cycles: {filteredSheets.length}
            </span>
          </div>
        )}
      </div>

      {/* Threshold Color Legend Guide */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
          <span className="font-bold text-slate-900">Scorecard Color Rule Matrix:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              &gt; 70% : Green (Target Achieved)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              50% - 69% : Mustard (Moderate)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              30% - 49% : Red (Needs Attention)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-200 text-slate-700 border border-slate-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              ≤ 29% : Grey (Incomplete)
            </span>
          </div>
        </div>
      </div>

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* 1. Overall Performance Score */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${overallStyle.cellBgClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overall Score</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${overallStyle.badgeClass}`}>
              {overallStyle.tier.toUpperCase()}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold font-mono-code tracking-tight">
              {formatPercent(overallPeriodScore)}
            </div>
            <div className="text-[11px] font-medium mt-1">
              Composite achievement across desk & revenue metrics
            </div>
          </div>
        </div>

        {/* 2. Operations Achievement */}
        {isTender ? (
          <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${tenderOpsStyle.cellBgClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tender Operations Avg</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${tenderOpsStyle.badgeClass}`}>
                {tenderOpsStyle.tier.toUpperCase()}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold font-mono-code tracking-tight">
                {formatPercent(computedTotals.tenderOpsAvgPct)}
              </div>
              <div className="text-[11px] font-medium mt-1">
                Daily tender search, filing & prep quota
              </div>
            </div>
          </div>
        ) : (
          <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${callingStyle.cellBgClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">Renewals Calling</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${callingStyle.badgeClass}`}>
                {callingStyle.tier.toUpperCase()}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold font-mono-code tracking-tight">
                {formatPercent(computedTotals.renewalsPct)}
              </div>
              <div className="text-[11px] font-medium mt-1">
                {totalCallsLogged} calls logged vs targets
              </div>
            </div>
          </div>
        )}

        {/* 3. Pipeline / Weekly Sales */}
        {isTender ? (
          <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${tenderPipeStyle.cellBgClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pipeline Conversion</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${tenderPipeStyle.badgeClass}`}>
                {tenderPipeStyle.tier.toUpperCase()}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold font-mono-code tracking-tight">
                {formatPercent(computedTotals.tenderPipelinePct)}
              </div>
              <div className="text-[11px] font-medium mt-1">
                Awarded contracts vs pipeline target
              </div>
            </div>
          </div>
        ) : (
          <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${weeklySalesStyle.cellBgClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">Weekly Revenue</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${weeklySalesStyle.badgeClass}`}>
                {weeklySalesStyle.tier.toUpperCase()}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold font-mono-code tracking-tight">
                {formatPercent((computedTotals.weeklyOpAchievementPct + computedTotals.weeklySrAchievementPct) / 2)}
              </div>
              <div className="text-[11px] font-medium mt-1">
                {formatINR(totalRevenue)} revenue closed
              </div>
            </div>
          </div>
        )}

        {/* 4. Target Milestone */}
        {isTender ? (
          <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${getPerformanceThreshold(computedTotals.weeklyOpAchievementPct).cellBgClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">Weekly Target (OP)</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${getPerformanceThreshold(computedTotals.weeklyOpAchievementPct).badgeClass}`}>
                {getPerformanceThreshold(computedTotals.weeklyOpAchievementPct).tier.toUpperCase()}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold font-mono-code tracking-tight">
                {formatPercent(computedTotals.weeklyOpAchievementPct)}
              </div>
              <div className="text-[11px] font-medium mt-1">
                Own portfolio weekly delivery pace
              </div>
            </div>
          </div>
        ) : (
          <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${monthlyStyle.cellBgClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">Monthly Progress</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${monthlyStyle.badgeClass}`}>
                {monthlyStyle.tier.toUpperCase()}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold font-mono-code tracking-tight">
                {formatPercent(computedTotals.monthlyOpAchievementPct)}
              </div>
              <div className="text-[11px] font-medium mt-1">
                Tracking against ₹{(member.approvedTargets.monthlyTargetOp / 100000).toFixed(1)}L target
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Target vs Achieved Detailed Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-emerald-900 text-white px-5 py-3 font-display font-bold text-sm tracking-wide flex items-center justify-between">
          <span>Target vs Actual Performance Breakdown ({periodFilter.toUpperCase()})</span>
          <span className="text-[11px] font-mono-code text-emerald-200">Management Performance Matrix</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-3">Metric Category</th>
                <th className="p-3 text-right">Target Baseline</th>
                <th className="p-3 text-right">Achieved Value</th>
                <th className="p-3 text-center w-36">Achievement %</th>
                <th className="p-3 text-center w-32">Status Tier</th>
                <th className="p-3">Operational Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              
              {isTender ? (
                <>
                  {/* Row 1: Weekly OP Target */}
                  <tr className={getPerformanceThreshold(computedTotals.weeklyOpAchievementPct).rowBgClass}>
                    <td className="p-3 font-bold text-slate-900">Weekly Target (Own Portfolio OP)</td>
                    <td className="p-3 text-right font-mono-code font-bold text-slate-700">{formatINR(currentSheet.targets.weeklyTargetOp)}</td>
                    <td className="p-3 text-right font-mono-code font-bold text-emerald-800">{formatINR(currentSheet.targets.weeklyAchievedOp)}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code font-bold text-xs ${getPerformanceThreshold(computedTotals.weeklyOpAchievementPct).badgeClass}`}>
                        {formatPercent(computedTotals.weeklyOpAchievementPct)}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold text-xs">
                      {getPerformanceThreshold(computedTotals.weeklyOpAchievementPct).shortStatus}
                    </td>
                    <td className="p-3 text-slate-600 font-medium text-[11px]">Primary weekly tender award target</td>
                  </tr>

                  {/* Row 2: Weekly SR Target */}
                  <tr className={getPerformanceThreshold(computedTotals.weeklySrAchievementPct).rowBgClass}>
                    <td className="p-3 font-bold text-slate-900">Weekly Target (Service Renewal SR)</td>
                    <td className="p-3 text-right font-mono-code font-bold text-slate-700">{formatINR(currentSheet.targets.weeklyTargetSr)}</td>
                    <td className="p-3 text-right font-mono-code font-bold text-emerald-800">{formatINR(currentSheet.targets.weeklyAchievedSr)}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code font-bold text-xs ${getPerformanceThreshold(computedTotals.weeklySrAchievementPct).badgeClass}`}>
                        {formatPercent(computedTotals.weeklySrAchievementPct)}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold text-xs">
                      {getPerformanceThreshold(computedTotals.weeklySrAchievementPct).shortStatus}
                    </td>
                    <td className="p-3 text-slate-600 font-medium text-[11px]">Service renewals & tender extensions</td>
                  </tr>

                  {/* Row 3: Monthly OP Target */}
                  <tr className={getPerformanceThreshold(computedTotals.monthlyOpAchievementPct).rowBgClass}>
                    <td className="p-3 font-bold text-slate-900">Monthly Target (Own Portfolio OP)</td>
                    <td className="p-3 text-right font-mono-code font-bold text-slate-700">{formatINR(currentSheet.targets.monthlyTargetOp)}</td>
                    <td className="p-3 text-right font-mono-code font-bold text-emerald-800">{formatINR(currentSheet.targets.monthlyAchievedOp)}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code font-bold text-xs ${getPerformanceThreshold(computedTotals.monthlyOpAchievementPct).badgeClass}`}>
                        {formatPercent(computedTotals.monthlyOpAchievementPct)}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold text-xs">
                      {getPerformanceThreshold(computedTotals.monthlyOpAchievementPct).shortStatus}
                    </td>
                    <td className="p-3 text-slate-600 font-medium text-[11px]">Cumulative monthly benchmark pace</td>
                  </tr>

                  {/* Row 4: Monthly SR Target */}
                  <tr className={getPerformanceThreshold(computedTotals.monthlySrAchievementPct).rowBgClass}>
                    <td className="p-3 font-bold text-slate-900">Monthly Target (Service Renewal SR)</td>
                    <td className="p-3 text-right font-mono-code font-bold text-slate-700">{formatINR(currentSheet.targets.monthlyTargetSr)}</td>
                    <td className="p-3 text-right font-mono-code font-bold text-emerald-800">{formatINR(currentSheet.targets.monthlyAchievedSr)}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code font-bold text-xs ${getPerformanceThreshold(computedTotals.monthlySrAchievementPct).badgeClass}`}>
                        {formatPercent(computedTotals.monthlySrAchievementPct)}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold text-xs">
                      {getPerformanceThreshold(computedTotals.monthlySrAchievementPct).shortStatus}
                    </td>
                    <td className="p-3 text-slate-600 font-medium text-[11px]">Monthly renewal retention quota</td>
                  </tr>

                  {/* Row 5: Tender Pipeline */}
                  <tr className={tenderPipeStyle.rowBgClass}>
                    <td className="p-3 font-bold text-slate-900">Tender Pipeline Conversion (Awarded vs Target)</td>
                    <td className="p-3 text-right font-mono-code font-bold text-slate-700">{formatINR(currentSheet.tenderPipelineMetrics?.[0]?.targetAmount || 0)}</td>
                    <td className="p-3 text-right font-mono-code font-bold text-emerald-800">{formatINR(currentSheet.tenderPipelineMetrics?.[0]?.awardedTotal || 0)}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code font-bold text-xs ${tenderPipeStyle.badgeClass}`}>
                        {formatPercent(computedTotals.tenderPipelinePct)}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold text-xs">
                      {tenderPipeStyle.shortStatus}
                    </td>
                    <td className="p-3 text-slate-600 font-medium text-[11px]">Bidding conversion conversion efficiency</td>
                  </tr>
                </>
              ) : (
                <>
                  {/* Customer Care Rows */}
                  <tr className={getPerformanceThreshold(computedTotals.weeklyOpAchievementPct).rowBgClass}>
                    <td className="p-3 font-bold text-slate-900">Weekly OP Sales (Own Portfolio)</td>
                    <td className="p-3 text-right font-mono-code font-bold text-slate-700">{formatINR(currentSheet.targets.weeklyTargetOp)}</td>
                    <td className="p-3 text-right font-mono-code font-bold text-emerald-800">{formatINR(currentSheet.targets.weeklyAchievedOp)}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code font-bold text-xs ${getPerformanceThreshold(computedTotals.weeklyOpAchievementPct).badgeClass}`}>
                        {formatPercent(computedTotals.weeklyOpAchievementPct)}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold text-xs">
                      {getPerformanceThreshold(computedTotals.weeklyOpAchievementPct).shortStatus}
                    </td>
                    <td className="p-3 text-slate-600 text-[11px]">Approved in Q3 Target Schedule</td>
                  </tr>

                  <tr className={getPerformanceThreshold(computedTotals.weeklySrAchievementPct).rowBgClass}>
                    <td className="p-3 font-bold text-slate-900">Weekly SR Sales (Service Renewal)</td>
                    <td className="p-3 text-right font-mono-code font-bold text-slate-700">{formatINR(currentSheet.targets.weeklyTargetSr)}</td>
                    <td className="p-3 text-right font-mono-code font-bold text-emerald-800">{formatINR(currentSheet.targets.weeklyAchievedSr)}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code font-bold text-xs ${getPerformanceThreshold(computedTotals.weeklySrAchievementPct).badgeClass}`}>
                        {formatPercent(computedTotals.weeklySrAchievementPct)}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold text-xs">
                      {getPerformanceThreshold(computedTotals.weeklySrAchievementPct).shortStatus}
                    </td>
                    <td className="p-3 text-slate-600 text-[11px]">Residential AMC renewals priority</td>
                  </tr>

                  <tr className={callingStyle.rowBgClass}>
                    <td className="p-3 font-bold text-slate-900">Renewals Calling Volume (6-Day Target)</td>
                    <td className="p-3 text-right font-mono-code font-bold text-slate-700">{computedTotals.renewalsTargetTotal} Calls</td>
                    <td className="p-3 text-right font-mono-code font-bold text-emerald-800">{computedTotals.renewalsTotal} Calls</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code font-bold text-xs ${callingStyle.badgeClass}`}>
                        {formatPercent(computedTotals.renewalsPct)}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold text-xs">
                      {callingStyle.shortStatus}
                    </td>
                    <td className="p-3 text-slate-600 text-[11px]">Daily benchmark: {currentSheet.dailyTasks.callingAndQuotes[0]?.targetPerDay || 30}/day</td>
                  </tr>

                  <tr className={monthlyStyle.rowBgClass}>
                    <td className="p-3 font-bold text-slate-900">Monthly OP Target Cumulative</td>
                    <td className="p-3 text-right font-mono-code font-bold text-slate-700">{formatINR(currentSheet.targets.monthlyTargetOp)}</td>
                    <td className="p-3 text-right font-mono-code font-bold text-emerald-800">{formatINR(currentSheet.targets.monthlyAchievedOp)}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code font-bold text-xs ${monthlyStyle.badgeClass}`}>
                        {formatPercent(computedTotals.monthlyOpAchievementPct)}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold text-xs">
                      {monthlyStyle.shortStatus}
                    </td>
                    <td className="p-3 text-slate-600 text-[11px]">Monthly milestone reviewed on 1st of month</td>
                  </tr>
                </>
              )}

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
