import React, { useState } from 'react';
import {
  CalendarCheck,
  PhoneCall,
  FileText,
  MessageSquare,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  Briefcase,
  Building2,
  Calendar,
  Send
} from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';
import {
  getPerformanceThreshold,
  formatINR,
  formatPercent,
  safeDivision
} from '../utils/colorThreshold';
import {
  getCurrentDayKey,
  DAY_METADATA,
  CYCLE_DAYS_ORDER,
  computeDayEntryState,
  CycleDayKey
} from '../utils/dayFreezeHelper';

export const DailyTrackerView: React.FC = () => {
  const {
    member,
    currentSheet,
    userRole,
    lockedDaysMap,
    toggleDayLock,
    submitMissedDayEntry,
    updateDailyCallingDay,
    updateDailyCallingTarget,
    updateDailyTenderOpDay,
    updateDailyTenderOpTarget,
    updateDailySalesTenderDay,
    updateDailyCommercialDay,
    updateDailyCommercialTarget,
    updatePhoneHandling,
    computedTotals
  } = usePestCure();

  const realTodayKey = getCurrentDayKey();
  const [activeDay, setActiveDay] = useState<CycleDayKey>(realTodayKey);

  const daysList: { key: CycleDayKey; label: string; full: string }[] = CYCLE_DAYS_ORDER.map((key) => ({
    key,
    label: DAY_METADATA[key].label,
    full: DAY_METADATA[key].full
  }));

  const isTender = currentSheet.sheetType === 'tender_operations' || currentSheet.dailyTenderOperations !== undefined;
  const isCommercial = currentSheet.sheetType === 'commercial_bd' || currentSheet.dailyCommercialTasks !== undefined;

  // Tender Daily Operations
  const tenderOps = currentSheet.dailyTenderOperations || [];
  const tenderDailySales = currentSheet.dailySalesTenderTasks || [];

  // Commercial Daily Operations (Alka Ghai)
  const commercialDailyTasks = currentSheet.dailyCommercialTasks || [];

  // Customer Care Operations (Deepika Gulia)
  const renewalMetric = currentSheet.dailyTasks?.callingAndQuotes?.find(m => m.taskName.includes('Renewal')) || currentSheet.dailyTasks?.callingAndQuotes?.[0];
  const quoteMetric = currentSheet.dailyTasks?.callingAndQuotes?.find(m => m.taskName.includes('Quotation')) || currentSheet.dailyTasks?.callingAndQuotes?.[1];

  const activeRenewalCount = renewalMetric?.days[activeDay] || 0;
  const activeQuoteCount = quoteMetric?.days[activeDay] || 0;

  const renewalDailyTarget = renewalMetric?.targetPerDay || 30;
  const quoteDailyTarget = quoteMetric?.targetPerDay || 12;

  const activeRenewalPct = safeDivision(activeRenewalCount, renewalDailyTarget);
  const activeQuotePct = safeDivision(activeQuoteCount, quoteDailyTarget);

  const renThreshold = getPerformanceThreshold(activeRenewalPct);
  const quoteThreshold = getPerformanceThreshold(activeQuotePct);

  // Day lock status helper
  const dayLockKey = `${currentSheet.id}_${activeDay}`;
  const isExplicitlyLocked = !!lockedDaysMap[dayLockKey];

  // Compute day status for the active tab
  const dayIdx = CYCLE_DAYS_ORDER.indexOf(activeDay);
  const todayIdx = CYCLE_DAYS_ORDER.indexOf(realTodayKey);
  const isToday = dayIdx === todayIdx;
  const isPast = dayIdx < todayIdx;
  const isFuture = dayIdx > todayIdx;

  // Check total counts for active day
  const totalCountForDay = isCommercial
    ? commercialDailyTasks.reduce((sum, t) => sum + (t.days[activeDay] || 0), 0)
    : isTender
    ? tenderOps.reduce((sum, op) => sum + (op.days[activeDay] || 0), 0)
    : (activeRenewalCount + activeQuoteCount);

  const isDayEditable = userRole === 'admin' || (isToday && !isExplicitlyLocked);

  const isMetricLocked = (metricId: string) => {
    if (userRole === 'admin') return false;
    const itemKey = `${currentSheet.id}_${metricId}_${activeDay}`;
    if (lockedDaysMap[itemKey] || isExplicitlyLocked) return true;
    if (isFuture) return true;
    // Allow members to edit missed past days so they can fill them and submit for admin approval
    return false;
  };

  const handleLockCurrentDay = (lockState: boolean) => {
    toggleDayLock(dayLockKey, lockState);
    if (isCommercial) {
      commercialDailyTasks.forEach((t) => toggleDayLock(`${currentSheet.id}_${t.id}_${activeDay}`, lockState));
    } else if (isTender) {
      tenderOps.forEach((op) => toggleDayLock(`${currentSheet.id}_${op.id}_${activeDay}`, lockState));
      tenderDailySales.forEach((s) => toggleDayLock(`${currentSheet.id}_${s.id}_${activeDay}`, lockState));
    } else {
      if (renewalMetric) toggleDayLock(`${currentSheet.id}_${renewalMetric.id}_${activeDay}`, lockState);
      if (quoteMetric) toggleDayLock(`${currentSheet.id}_${quoteMetric.id}_${activeDay}`, lockState);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">

      {/* Clean Desk Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-code uppercase tracking-wider text-emerald-400 font-bold">
                {isCommercial
                  ? 'Commercial & BD Daily Desk'
                  : isTender
                  ? 'Tender Operations Daily Desk'
                  : 'Customer Care Daily Desk'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {member.name}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-1">
              Daily Task Entry · <span className="text-amber-300">{DAY_METADATA[activeDay].full}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isToday
                ? `Today is ${DAY_METADATA[activeDay].full}. Enter your operational numbers below and submit when done.`
                : isPast
                ? `${DAY_METADATA[activeDay].full} is in the past. ${totalCountForDay > 0 ? 'Recorded entries are saved.' : 'Unfilled days are frozen.'}`
                : `${DAY_METADATA[activeDay].full} is an upcoming day. Entries will unlock on that date.`}
            </p>
          </div>

          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {isCommercial
                ? 'Daily BD Tasks Avg'
                : isTender
                ? 'Daily Ops Avg'
                : 'Week Finalized'}
            </span>
            <span className="text-base font-mono-code font-bold text-emerald-400">
              {isCommercial
                ? formatPercent(computedTotals.dailyCommercialAvgPct)
                : isTender
                ? formatPercent(computedTotals.tenderOpsAvgPct)
                : formatINR(currentSheet.dailyTasks?.phoneHandling?.amount || 0)}
            </span>
          </div>
        </div>

        {/* 7-Day Cycle Selector Tabs with Date-Aware Status */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {daysList.map((d) => {
            const isSelected = activeDay === d.key;
            const thisDayIdx = CYCLE_DAYS_ORDER.indexOf(d.key);
            const isThisToday = thisDayIdx === todayIdx;
            const isThisPast = thisDayIdx < todayIdx;
            const isThisFuture = thisDayIdx > todayIdx;

            const countForDay = isCommercial
              ? commercialDailyTasks.reduce((sum, t) => sum + (t.days[d.key] || 0), 0)
              : isTender
              ? tenderOps.reduce((sum, op) => sum + (op.days[d.key] || 0), 0)
              : (renewalMetric?.days[d.key] || 0);

            const isThisDayLocked = !!lockedDaysMap[`${currentSheet.id}_${d.key}`];
            const isMissed = isThisPast && countForDay === 0 && !isThisDayLocked;

            return (
              <button
                key={d.key}
                onClick={() => setActiveDay(d.key)}
                className={`p-2.5 rounded-xl border transition-all text-left cursor-pointer relative ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm ring-2 ring-emerald-400/40'
                    : isThisToday
                    ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-200 hover:bg-emerald-900/50'
                    : isMissed
                    ? 'bg-rose-950/30 border-rose-900/50 text-rose-300 hover:bg-rose-950/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase">{d.label}</span>
                  {isThisToday && (
                    <span className="text-[9px] bg-emerald-800 text-white font-extrabold px-1 rounded uppercase tracking-wider">
                      Today
                    </span>
                  )}
                  {isMissed && !isThisToday && (
                    <span className="text-[9px] bg-rose-900/90 text-rose-200 font-bold px-1 rounded">
                      Missed
                    </span>
                  )}
                  {isThisDayLocked && !isThisToday && (
                    <Lock className="w-3 h-3 text-slate-400" />
                  )}
                </div>
                <div className="text-sm font-bold font-mono-code mt-1">
                  {countForDay} <span className="text-[10px] opacity-75 font-sans font-normal">logged</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date & Lock Status Banner */}
      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isToday
          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
          : isPast && totalCountForDay === 0
          ? 'bg-rose-50 border-rose-200 text-rose-950'
          : 'bg-slate-100 border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${
            isToday
              ? 'bg-emerald-200/80 text-emerald-900'
              : isPast && totalCountForDay === 0
              ? 'bg-rose-200/80 text-rose-900'
              : 'bg-slate-200 text-slate-700'
          }`}>
            {isToday ? <Sparkles className="w-4 h-4" /> : isPast && totalCountForDay === 0 ? <AlertTriangle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <span>{DAY_METADATA[activeDay].full.toUpperCase()}: </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                isToday
                  ? 'bg-emerald-700 text-white'
                  : isPast && totalCountForDay === 0
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-700 text-white'
              }`}>
                {isToday
                  ? 'Open for Today’s Entry'
                  : isPast
                  ? totalCountForDay === 0
                    ? 'Missed Day • Fill Below'
                    : 'Recorded & Saved'
                  : 'Upcoming Day (Locked)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isToday
                ? 'Fill your tasks for today. Once completed, you can click "Save & Submit Today" below.'
                : isPast && totalCountForDay === 0
                ? 'Missed day: enter your achieved counts below and submit for Admin approval.'
                : isFuture
                ? 'Future days are locked to maintain real-time accuracy and prevent premature logging.'
                : 'Entries for this day are saved.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {userRole === 'admin' ? (
            <button
              onClick={() => handleLockCurrentDay(!isExplicitlyLocked)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isExplicitlyLocked
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {isExplicitlyLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isExplicitlyLocked ? 'Admin Unlock Day' : 'Admin Lock Day'}</span>
            </button>
          ) : isToday && !isExplicitlyLocked ? (
            <button
              onClick={() => handleLockCurrentDay(true)}
              className="px-4 py-2 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save & Submit Today</span>
            </button>
          ) : isPast && !isExplicitlyLocked ? (
            <button
              onClick={() => {
                if (isCommercial) {
                  commercialDailyTasks.forEach((t) => submitMissedDayEntry(`overdue-${t.id}-${activeDay}`, t.days[activeDay] || 0, 'Submitted from daily desk'));
                } else if (isTender) {
                  tenderOps.forEach((op) => submitMissedDayEntry(`overdue-${op.id}-${activeDay}`, op.days[activeDay] || 0, 'Submitted from daily desk'));
                  tenderDailySales.forEach((s) => submitMissedDayEntry(`overdue-${s.id}-${activeDay}`, s.days[activeDay] || 0, 'Submitted from daily desk'));
                } else {
                  if (renewalMetric) submitMissedDayEntry(`overdue-${renewalMetric.id}-${activeDay}`, renewalMetric.days[activeDay] || 0, 'Submitted from daily desk');
                  if (quoteMetric) submitMissedDayEntry(`overdue-${quoteMetric.id}-${activeDay}`, quoteMetric.days[activeDay] || 0, 'Submitted from daily desk');
                }
                alert('Missed day counts submitted for Admin approval!');
              }}
              className="px-4 py-2 rounded-lg font-bold text-xs bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Admin Approval</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Dynamic Body for Active Member */}
      {isCommercial ? (
        /* ================= COMMERCIAL BD DESK (ALKA GHAI) ================= */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Daily Commercial BD Tasks ({DAY_METADATA[activeDay].full})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                User: <strong className="text-slate-800">{member.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {commercialDailyTasks.map((task) => {
                const dayCount = task.days[activeDay] || 0;
                const dayTarget = task.targetPerDay || 1;
                const dayPct = safeDivision(dayCount, dayTarget);
                const dayThresh = getPerformanceThreshold(dayPct);
                const isLocked = isMetricLocked(task.id);

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl space-y-2.5 border transition-colors ${
                      isLocked ? 'bg-slate-50/70 border-slate-200' : 'bg-white border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs truncate max-w-[180px]">{task.task}</h4>
                      <div className="flex items-center gap-1.5">
                        {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                        <span className={`px-2 py-0.5 rounded-md border font-mono-code text-[11px] font-bold ${dayThresh.badgeClass}`}>
                          {formatPercent(dayPct)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                          Count ({DAY_METADATA[activeDay].label})
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={dayCount === 0 ? '' : dayCount}
                          disabled={isLocked}
                          onChange={(e) => updateDailyCommercialDay(task.id, activeDay, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className={`w-full text-center font-bold text-sm font-mono-code rounded-lg py-1.5 border transition-all ${
                            isLocked
                              ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-white border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900'
                          }`}
                        />
                      </div>
                      <div className="w-20 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Daily Target</span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 py-1.5 px-2 rounded-lg block font-mono-code">
                          {dayTarget}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : isTender ? (
        /* ================= TENDER DESK (KAJAL GAUR) ================= */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Daily Tender & Bidding Operations ({DAY_METADATA[activeDay].full})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                User: <strong className="text-slate-800">{member.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {tenderOps.map((op) => {
                const dayCount = op.days[activeDay] || 0;
                const dayTarget = op.targetPerDay || 1;
                const dayPct = safeDivision(dayCount, dayTarget);
                const dayThresh = getPerformanceThreshold(dayPct);
                const isLocked = isMetricLocked(op.id);

                return (
                  <div
                    key={op.id}
                    className={`p-3.5 rounded-xl space-y-2.5 border transition-colors ${
                      isLocked ? 'bg-slate-50/70 border-slate-200' : 'bg-white border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs truncate max-w-[180px]">{op.task}</h4>
                      <div className="flex items-center gap-1.5">
                        {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                        <span className={`px-2 py-0.5 rounded-md border font-mono-code text-[11px] font-bold ${dayThresh.badgeClass}`}>
                          {formatPercent(dayPct)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                          Count ({DAY_METADATA[activeDay].label})
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={dayCount === 0 ? '' : dayCount}
                          disabled={isLocked}
                          onChange={(e) => updateDailyTenderOpDay(op.id, activeDay, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className={`w-full text-center font-bold text-sm font-mono-code rounded-lg py-1.5 border transition-all ${
                            isLocked
                              ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-white border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900'
                          }`}
                        />
                      </div>
                      <div className="w-20 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Daily Target</span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 py-1.5 px-2 rounded-lg block font-mono-code">
                          {dayTarget}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ================= CUSTOMER CARE DESK (DEEPIKA GULIA) ================= */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Renewal Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Renewals Calling</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md border font-mono-code text-[11px] font-bold ${renThreshold.badgeClass}`}>
                  {formatPercent(activeRenewalPct)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                    Calls on {DAY_METADATA[activeDay].full}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={activeRenewalCount === 0 ? '' : activeRenewalCount}
                    disabled={isMetricLocked(renewalMetric?.id || 'dq-1')}
                    onChange={(e) => updateDailyCallingDay(renewalMetric?.id || 'dq-1', activeDay, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className={`w-full text-center font-bold text-base font-mono-code rounded-lg py-2 border transition-all ${
                      isMetricLocked(renewalMetric?.id || 'dq-1')
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-white border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900'
                    }`}
                  />
                </div>
                <div className="w-24 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Daily Target</span>
                  <span className="text-sm font-bold text-slate-700 bg-slate-100 py-2 px-3 rounded-lg block font-mono-code">
                    {renewalDailyTarget}
                  </span>
                </div>
              </div>
            </div>

            {/* Quotation Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Quotations Sent</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md border font-mono-code text-[11px] font-bold ${quoteThreshold.badgeClass}`}>
                  {formatPercent(activeQuotePct)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                    Quotes on {DAY_METADATA[activeDay].full}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={activeQuoteCount === 0 ? '' : activeQuoteCount}
                    disabled={isMetricLocked(quoteMetric?.id || 'dq-2')}
                    onChange={(e) => updateDailyCallingDay(quoteMetric?.id || 'dq-2', activeDay, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className={`w-full text-center font-bold text-base font-mono-code rounded-lg py-2 border transition-all ${
                      isMetricLocked(quoteMetric?.id || 'dq-2')
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-white border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900'
                    }`}
                  />
                </div>
                <div className="w-24 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Daily Target</span>
                  <span className="text-sm font-bold text-slate-700 bg-slate-100 py-2 px-3 rounded-lg block font-mono-code">
                    {quoteDailyTarget}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
