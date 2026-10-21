import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Sparkles,
  Lock,
  Unlock,
  ChevronDown,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  HelpCircle,
  MessageSquareQuote
} from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';
import {
  getPerformanceThreshold,
  formatINR,
  formatPercent,
  safeDivision
} from '../utils/colorThreshold';
import { computeDayEntryState } from '../utils/dayFreezeHelper';
import { OccurrenceType, TaskPriority, TaskStatusType } from '../types';
import { KajalReviewSheet } from './KajalReviewSheet';
import { CommercialBDReviewSheet } from './CommercialBDReviewSheet';
import { ColorThresholdLegend } from './ColorThresholdLegend';
import { TopMainKpiHero } from './TopMainKpiHero';
import { AdminAddKpiModal } from './AdminAddKpiModal';

interface WeeklyReviewSheetProps {
  onOpenTargetModal: () => void;
  onOpenNewUserModal?: () => void;
}

const CustomerCareReviewSheet: React.FC<WeeklyReviewSheetProps> = ({ onOpenTargetModal, onOpenNewUserModal }) => {
  const {
    userRole,
    member,
    currentSheet,
    updateAttendance,
    updateDailyCallingDay,
    updateDailyCallingTarget,
    addDailyCallingMetric,
    deleteDailyCallingMetric,
    updateCcOverview,
    updatePhoneHandling,
    updateWeeklyTask,
    addWeeklyTask,
    deleteWeeklyTask,
    updateMonthlyTask,
    addMonthlyTask,
    deleteMonthlyTask,
    updateSalesMetric,
    updateRunningAccount,
    updateAchievement,
    addAchievement,
    deleteAchievement,
    updateStuckPoint,
    addStuckPoint,
    deleteStuckPoint,
    updateClientFeedback,
    updateLearningImprovement,
    updateWeeklySummary,
    submitWeeklySheet,
    computedTotals,
    lockedDaysMap
  } = usePestCure();

  const [newWeeklyTaskName, setNewWeeklyTaskName] = useState('');
  const [showAddWeekly, setShowAddWeekly] = useState(false);
  const [isAddKpiModalOpen, setIsAddKpiModalOpen] = useState(false);

  // Direct Inline KRA KPI creation states
  const [showAddCallingKpi, setShowAddCallingKpi] = useState(false);
  const [newCallingTaskName, setNewCallingTaskName] = useState('');
  const [newCallingTargetPerDay, setNewCallingTargetPerDay] = useState(10);
  const [newCallingCategory, setNewCallingCategory] = useState('Customer Care');

  const [showAddMonthly, setShowAddMonthly] = useState(false);
  const [newMonthlyTaskName, setNewMonthlyTaskName] = useState('');
  const [newMonthlyOccurrence, setNewMonthlyOccurrence] = useState('Monthly');

  // Daily calling calculations
  const renewalRow = currentSheet.dailyTasks.callingAndQuotes.find(r => r.taskName.includes('Renewal')) || currentSheet.dailyTasks.callingAndQuotes[0];
  const quoteRow = currentSheet.dailyTasks.callingAndQuotes.find(r => r.taskName.includes('Quotation')) || currentSheet.dailyTasks.callingAndQuotes[1];

  const sumDays = (d: { mon: number; tue: number; wed: number; thu: number; fri: number; sat: number; sun: number }) =>
    (Number(d.mon) || 0) + (Number(d.tue) || 0) + (Number(d.wed) || 0) + (Number(d.thu) || 0) + (Number(d.fri) || 0) + (Number(d.sat) || 0) + (Number(d.sun) || 0);

  const renSum = renewalRow ? sumDays(renewalRow.days) : 0;
  const renTarget6d = (renewalRow?.targetPerDay || 30) * 6;
  const renPct = safeDivision(renSum, renTarget6d);

  const quoteSum = quoteRow ? sumDays(quoteRow.days) : 0;
  const quoteTarget6d = (quoteRow?.targetPerDay || 12) * 6;
  const quotePct = safeDivision(quoteSum, quoteTarget6d);

  // Target metrics %
  const weeklyOpPct = computedTotals.weeklyOpAchievementPct;
  const weeklySrPct = computedTotals.weeklySrAchievementPct;
  const monthlyOpPct = computedTotals.monthlyOpAchievementPct;
  const monthlySrPct = computedTotals.monthlySrAchievementPct;

  const weeklyOpStyle = getPerformanceThreshold(weeklyOpPct);
  const weeklySrStyle = getPerformanceThreshold(weeklySrPct);
  const monthlyOpStyle = getPerformanceThreshold(monthlyOpPct);
  const monthlySrStyle = getPerformanceThreshold(monthlySrPct);

  const renStyle = getPerformanceThreshold(renPct);
  const quoteStyle = getPerformanceThreshold(quotePct);

  const isSubmitted = currentSheet.status === 'submitted' || currentSheet.status === 'approved';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">

      {/* Top Banner with cycle info & status */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200/60">
              {currentSheet.attendance.team || 'Customer Care'}
            </span>
            <span className="text-xs text-slate-500">
              Review Cycle: <strong className="text-slate-800">{currentSheet.cycleLabel}</strong>
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 mt-1">
            {member.name} &bull; <span className="text-slate-500 font-normal">{member.role}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-mono-code bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            {currentSheet.status.toUpperCase()}
          </span>
          {userRole === 'member' && !isSubmitted && (
            <button
              onClick={submitWeeklySheet}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Review
            </button>
          )}
        </div>
      </div>

      {/* TOP COLOR THRESHOLD LEGENDS */}
      <ColorThresholdLegend />

      {/* TOP MAIN DATA HERO CARDS (Prominent font, primary metrics) */}
      <TopMainKpiHero
        onOpenAddKpi={() => setIsAddKpiModalOpen(true)}
        onOpenNewUserModal={onOpenNewUserModal}
      />

      {/* Admin KPI Creation Modal */}
      <AdminAddKpiModal
        isOpen={isAddKpiModalOpen}
        onClose={() => setIsAddKpiModalOpen(false)}
      />

      {/* SECTION 1: EMPLOYEE & ATTENDANCE DETAILS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
            1. Employee & Attendance Details
          </h2>
          <span className="text-[11px] font-mono-code text-slate-400">ID: DG-CC-801</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Employee & Role</span>
            <span className="font-bold text-slate-900 text-xs block mt-0.5">{currentSheet.attendance.name}</span>
            <span className="text-[11px] text-slate-500">{currentSheet.attendance.role || 'Customer Care'}</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Department</span>
            <span className="font-bold text-slate-900 text-xs block mt-0.5">{currentSheet.attendance.team || 'Customer Care'}</span>
            <span className="text-[11px] text-emerald-600 font-medium">Retention & Quotation Handling</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Review Period</span>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="date"
                value={currentSheet.attendance.periodStart}
                onChange={(e) => updateAttendance({ periodStart: e.target.value })}
                className="font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] w-full"
              />
              <span className="text-[10px] text-slate-400">to</span>
              <input
                type="date"
                value={currentSheet.attendance.periodEnd}
                onChange={(e) => updateAttendance({ periodEnd: e.target.value })}
                className="font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] w-full"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Attendance (Leaves / Lates / SH-HD)</span>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <div>
                <span className="text-[9px] text-slate-400 block">Leaves</span>
                <input
                  type="number"
                  min="0"
                  value={currentSheet.attendance.leaves}
                  onChange={(e) => updateAttendance({ leaves: parseInt(e.target.value) || 0 })}
                  className="w-full font-mono-code font-bold text-slate-900 bg-white border border-slate-200 rounded px-1 py-0.5 text-center text-xs"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">Lates</span>
                <input
                  type="number"
                  min="0"
                  value={currentSheet.attendance.lates}
                  onChange={(e) => updateAttendance({ lates: parseInt(e.target.value) || 0 })}
                  className="w-full font-mono-code font-bold text-slate-900 bg-white border border-slate-200 rounded px-1 py-0.5 text-center text-xs"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">SH/HD</span>
                <input
                  type="number"
                  min="0"
                  value={currentSheet.attendance.shHd || 0}
                  onChange={(e) => updateAttendance({ shHd: parseInt(e.target.value) || 0 })}
                  className="w-full font-mono-code font-bold text-slate-900 bg-white border border-slate-200 rounded px-1 py-0.5 text-center text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: DAILY TASKS */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-[#1e293b] text-white px-4 py-2.5 font-semibold text-xs tracking-wide flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Daily Tasks &amp; Calling Matrix</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddCallingKpi(!showAddCallingKpi)}
            className="inline-flex items-center gap-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white font-semibold px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>{showAddCallingKpi ? 'Close' : '+ Add KPI'}</span>
          </button>
        </div>

        {/* Inline KPI Creator for Section 2 */}
        {showAddCallingKpi && (
          <div className="p-4 bg-amber-50/80 border-b border-amber-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in duration-150">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                New KPI / Metric Title
              </label>
              <input
                type="text"
                required
                value={newCallingTaskName}
                onChange={(e) => setNewCallingTaskName(e.target.value)}
                placeholder="e.g. GEM Portal Bids, Quotation Follow-ups, Retention Calls..."
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="w-32">
              <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                Target / Day
              </label>
              <input
                type="number"
                min="1"
                value={newCallingTargetPerDay}
                onChange={(e) => setNewCallingTargetPerDay(parseInt(e.target.value) || 1)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-end gap-2 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={() => {
                  if (newCallingTaskName.trim()) {
                    addDailyCallingMetric(newCallingTaskName.trim(), newCallingTargetPerDay, newCallingCategory);
                    setNewCallingTaskName('');
                    setShowAddCallingKpi(false);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Save KPI
              </button>
              <button
                type="button"
                onClick={() => setShowAddCallingKpi(false)}
                className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 2A: Calling and Quotations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-amber-500/20 text-amber-950 font-bold border-b border-amber-300/40 text-[11px]">
              <tr>
                <th className="p-3 w-48">Task</th>
                <th className="p-3 text-center w-24">Target / Day</th>
                <th className="p-3 text-center">Mon</th>
                <th className="p-3 text-center">Tue</th>
                <th className="p-3 text-center">Wed</th>
                <th className="p-3 text-center">Thu</th>
                <th className="p-3 text-center">Fri</th>
                <th className="p-3 text-center">Sat</th>
                <th className="p-3 text-center">Sun</th>
                <th className="p-3 text-center w-28 bg-amber-500/30">Week Total</th>
                <th className="p-3 text-center w-28">Achievement %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentSheet.dailyTasks.callingAndQuotes.map((metric) => {
                const total = sumDays(metric.days);
                const target6Days = (metric.targetPerDay || 0) * 6;
                const pct = safeDivision(total, target6Days);
                const style = getPerformanceThreshold(pct);

                return (
                  <tr key={metric.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>{metric.taskName}</span>
                      </div>
                      {userRole === 'admin' && (
                        <button
                          type="button"
                          onClick={() => deleteDailyCallingMetric(metric.id)}
                          title="Delete Metric"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="0"
                        value={metric.targetPerDay}
                        onChange={(e) => updateDailyCallingTarget(metric.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center font-bold bg-amber-50 border border-amber-200 rounded-lg py-1 text-slate-900"
                        title="Daily Target"
                      />
                    </td>
                    {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => {
                      const isSun = day === 'sun';
                      const val = metric.days[day] ?? 0;
                      const lockKey = `${currentSheet.id}_${metric.id}_${day}`;
                      const isLocked = Boolean(lockedDaysMap[lockKey] || lockedDaysMap[`${currentSheet.id}_${day}`]);
                      const dayState = computeDayEntryState(day, val, isLocked, false, userRole);
                      const inputDisabled = isSun || !dayState.isEditable;

                      return (
                        <td key={day} className={`p-2 text-center ${isSun ? 'bg-slate-50/40 text-slate-400' : ''}`}>
                          <input
                            type="number"
                            min="0"
                            disabled={inputDisabled}
                            value={val === 0 && (dayState.state === 'today_active' || userRole === 'admin') ? '' : val}
                            placeholder="0"
                            title={dayState.statusLabel}
                            onChange={(e) => updateDailyCallingDay(metric.id, day, parseInt(e.target.value) || 0)}
                            className={`w-12 text-center font-mono-code rounded-lg py-1 text-xs font-semibold transition-all ${
                              isSun
                                ? 'bg-transparent text-slate-400 cursor-not-allowed border-transparent'
                                : dayState.state === 'today_active'
                                ? 'bg-white border-2 border-emerald-500 text-slate-900 shadow-xs'
                                : dayState.state === 'past_missed'
                                ? 'bg-rose-50 border border-rose-200 text-rose-600 cursor-not-allowed'
                                : dayState.state === 'future_locked'
                                ? 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed'
                                : isLocked
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : val > 0
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                                : 'bg-white text-slate-900 border border-slate-200'
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-mono-code font-bold text-slate-900 bg-amber-50/60 text-sm">
                      {total} <span className="text-[10px] text-slate-500">/ {target6Days}</span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-mono-code font-bold ${style.cellBgClass}`}>
                        {formatPercent(pct)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Quick Add Row at bottom of table */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAddCallingKpi(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 px-2 py-1 rounded hover:bg-orange-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add new metric row to this Calling table</span>
          </button>
          <span className="text-[11px] text-slate-400 font-mono-code">Formula: =(SUM / (Target &times; 6)) &times; 100</span>
        </div>

        {/* 2B: CC Tasks Overview Subtable */}
        <div className="border-t border-slate-200">
          <div className="bg-amber-500/15 px-4 py-1.5 text-xs font-bold text-amber-950 border-b border-amber-300/40 flex items-center justify-between">
            <span>CC Tasks Overview (Occurrence: Daily)</span>
            <span className="text-[10px] text-slate-500 font-mono-code">Internal Operations & Resolution</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
            <div className="p-3 space-y-1">
              <label className="font-bold text-slate-700 text-[11px] block">CC Staff Training</label>
              <textarea
                value={currentSheet.dailyTasks.ccOverview.staffTraining}
                onChange={(e) => updateCcOverview({ staffTraining: e.target.value })}
                rows={2}
                className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white text-slate-800"
                placeholder="Training topics conducted..."
              />
            </div>
            <div className="p-3 space-y-1">
              <label className="font-bold text-slate-700 text-[11px] block">CC Staff Issues</label>
              <textarea
                value={currentSheet.dailyTasks.ccOverview.staffIssues}
                onChange={(e) => updateCcOverview({ staffIssues: e.target.value })}
                rows={2}
                className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white text-slate-800"
                placeholder="Staff obstacles or tool issues..."
              />
            </div>
            <div className="p-3 space-y-1">
              <label className="font-bold text-slate-700 text-[11px] block">Client Complaints</label>
              <textarea
                value={currentSheet.dailyTasks.ccOverview.clientComplaints}
                onChange={(e) => updateCcOverview({ clientComplaints: e.target.value })}
                rows={2}
                className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white text-slate-800"
                placeholder="Client grievances & resolutions..."
              />
            </div>
            <div className="p-3 space-y-1">
              <label className="font-bold text-slate-700 text-[11px] block">Apl Issues (App / Technical)</label>
              <textarea
                value={currentSheet.dailyTasks.ccOverview.aplIssues}
                onChange={(e) => updateCcOverview({ aplIssues: e.target.value })}
                rows={2}
                className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white text-slate-800"
                placeholder="App glitches or syncing notes..."
              />
            </div>
          </div>
        </div>

        {/* 2C: Phone Handling Subtable */}
        <div className="border-t border-slate-200">
          <div className="bg-amber-500/15 px-4 py-1.5 text-xs font-bold text-amber-950 border-b border-amber-300/40 flex items-center justify-between">
            <span>Phone Handling / Lead Conversions (Occurrence: Daily · Inquiries + Direct Desk)</span>
            <span className="font-mono-code font-bold text-emerald-800">
              Amount Finalized: {formatINR(currentSheet.dailyTasks.phoneHandling.amount)}
            </span>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">WhatsApp</span>
              <input
                type="number"
                value={currentSheet.dailyTasks.phoneHandling.whatsapp}
                onChange={(e) => updatePhoneHandling({ whatsapp: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Msgs (SMS/Chat)</span>
              <input
                type="number"
                value={currentSheet.dailyTasks.phoneHandling.msgs}
                onChange={(e) => updatePhoneHandling({ msgs: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Leads Generated</span>
              <input
                type="number"
                value={currentSheet.dailyTasks.phoneHandling.leads}
                onChange={(e) => updatePhoneHandling({ leads: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Finalized Deals</span>
              <input
                type="number"
                value={currentSheet.dailyTasks.phoneHandling.finalized}
                onChange={(e) => updatePhoneHandling({ finalized: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-emerald-900"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Amount (₹)</span>
              <input
                type="number"
                value={currentSheet.dailyTasks.phoneHandling.amount}
                onChange={(e) => updatePhoneHandling({ amount: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-emerald-900 font-mono-code"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Remarks</span>
              <input
                type="text"
                value={currentSheet.dailyTasks.phoneHandling.remarks}
                onChange={(e) => updatePhoneHandling({ remarks: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                placeholder="Remarks..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: WEEKLY TASKS */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-[#1e293b] text-white px-4 py-2.5 font-semibold text-xs tracking-wide flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Weekly Tasks &amp; Milestones</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddWeekly(!showAddWeekly)}
            className="inline-flex items-center gap-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white font-semibold px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>{showAddWeekly ? 'Close' : '+ Add KPI'}</span>
          </button>
        </div>

        {showAddWeekly && (
          <div className="p-4 bg-amber-50/80 border-b border-amber-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in duration-150">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                KRA Task Title
              </label>
              <input
                type="text"
                required
                value={newWeeklyTaskName}
                onChange={(e) => setNewWeeklyTaskName(e.target.value)}
                placeholder="Enter new weekly KRA task title..."
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-end gap-2 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={() => {
                  if (newWeeklyTaskName.trim()) {
                    addWeeklyTask({
                      occurrence: 'Weekly',
                      task: newWeeklyTaskName.trim(),
                      priority: 'Medium',
                      dueDate: currentSheet.attendance.periodEnd,
                      status: 'In Progress',
                      nextFollowUp: currentSheet.attendance.periodEnd,
                      remarks: 'Newly assigned'
                    });
                    setNewWeeklyTaskName('');
                    setShowAddWeekly(false);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Save Task
              </button>
              <button
                type="button"
                onClick={() => setShowAddWeekly(false)}
                className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-amber-500/20 text-amber-950 font-bold border-b border-amber-300/40 text-[11px]">
              <tr>
                <th className="p-3 w-28">Occurrence</th>
                <th className="p-3">Task</th>
                <th className="p-3 w-24">Priority</th>
                <th className="p-3 w-28">Due Date</th>
                <th className="p-3 w-32">Status</th>
                <th className="p-3 w-28">Next Follow Up</th>
                <th className="p-3">Remarks</th>
                <th className="p-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentSheet.weeklyTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono-code font-semibold text-slate-700">
                    <input
                      type="text"
                      value={t.occurrence}
                      onChange={(e) => updateWeeklyTask(t.id, { occurrence: e.target.value })}
                      className="w-full bg-transparent font-bold text-slate-900 focus:outline-none"
                    />
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    <input
                      type="text"
                      value={t.task}
                      onChange={(e) => updateWeeklyTask(t.id, { task: e.target.value })}
                      className="w-full bg-transparent font-bold text-slate-900 focus:outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={t.priority}
                      onChange={(e) => updateWeeklyTask(t.id, { priority: e.target.value as TaskPriority })}
                      className="bg-slate-100 border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="date"
                      value={t.dueDate}
                      onChange={(e) => updateWeeklyTask(t.id, { dueDate: e.target.value })}
                      className="bg-transparent text-xs text-slate-700 cursor-pointer"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={t.status}
                      onChange={(e) => updateWeeklyTask(t.id, { status: e.target.value as TaskStatusType })}
                      className={`rounded px-2.5 py-1 text-xs font-bold border ${
                        t.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : t.status === 'In Progress'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      <option value="Completed">✓ Completed</option>
                      <option value="In Progress">⏳ In Progress</option>
                      <option value="Pending">Pending</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="date"
                      value={t.nextFollowUp}
                      onChange={(e) => updateWeeklyTask(t.id, { nextFollowUp: e.target.value })}
                      className="bg-transparent text-xs text-slate-700 cursor-pointer"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={t.remarks}
                      onChange={(e) => updateWeeklyTask(t.id, { remarks: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                      placeholder="Remarks..."
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => deleteWeeklyTask(t.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom quick row */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowAddWeekly(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 px-2 py-1 rounded hover:bg-orange-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add new task to this Weekly table</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: MONTHLY / QUARTERLY TASKS */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-[#1e293b] text-white px-4 py-2.5 font-semibold text-xs tracking-wide flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Monthly &amp; Periodic Tasks</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddMonthly(!showAddMonthly)}
            className="inline-flex items-center gap-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white font-semibold px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>{showAddMonthly ? 'Close' : '+ Add KPI'}</span>
          </button>
        </div>

        {showAddMonthly && (
          <div className="p-4 bg-amber-50/80 border-b border-amber-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in duration-150">
            <div className="w-36">
              <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                Occurrence
              </label>
              <select
                value={newMonthlyOccurrence}
                onChange={(e) => setNewMonthlyOccurrence(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Fortnightly">Fortnightly</option>
                <option value="Bi-annual">Bi-annual</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                Monthly Task / Governance Goal
              </label>
              <input
                type="text"
                required
                value={newMonthlyTaskName}
                onChange={(e) => setNewMonthlyTaskName(e.target.value)}
                placeholder="Enter task title (e.g., Technician recruitment review, chemical audit)..."
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-end gap-2 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={() => {
                  if (newMonthlyTaskName.trim()) {
                    addMonthlyTask({
                      occurrence: newMonthlyOccurrence as OccurrenceType,
                      task: newMonthlyTaskName.trim(),
                      status: 'In Progress',
                      tat: '1 Week',
                      reasonForPendency: '-',
                      remarkIfAny: 'Newly logged'
                    });
                    setNewMonthlyTaskName('');
                    setShowAddMonthly(false);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Save Task
              </button>
              <button
                type="button"
                onClick={() => setShowAddMonthly(false)}
                className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-amber-500/20 text-amber-950 font-bold border-b border-amber-300/40 text-[11px]">
              <tr>
                <th className="p-3 w-28">Occurrence</th>
                <th className="p-3">Task</th>
                <th className="p-3 w-32">Status</th>
                <th className="p-3 w-24">TAT</th>
                <th className="p-3">Reason For Pendency</th>
                <th className="p-3">Remark if Any</th>
                <th className="p-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentSheet.monthlyTasks.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono-code font-bold text-slate-700">
                    {m.occurrence}
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    <div>{m.task}</div>
                    {m.technicianHiring && (
                      <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1 font-normal">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span>Hired @ Delhi: <strong className="text-emerald-700">{m.technicianHiring.hiredDelhi}</strong> ({m.technicianHiring.sourceDelhi})</span>
                          <span>Hired @ Gurgaon: <strong className="text-emerald-700">{m.technicianHiring.hiredGgi}</strong> ({m.technicianHiring.sourceGgi})</span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    <select
                      value={m.status}
                      onChange={(e) => updateMonthlyTask(m.id, { status: e.target.value as TaskStatusType })}
                      className={`rounded px-2.5 py-1 text-xs font-bold border ${
                        m.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="Completed">✓ Completed</option>
                      <option value="In Progress">⏳ In Progress</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={m.tat}
                      onChange={(e) => updateMonthlyTask(m.id, { tat: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono-code"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={m.reasonForPendency}
                      onChange={(e) => updateMonthlyTask(m.id, { reasonForPendency: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                      placeholder="Reason if pending..."
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={m.remarkIfAny}
                      onChange={(e) => updateMonthlyTask(m.id, { remarkIfAny: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                      placeholder="Remarks..."
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => deleteMonthlyTask(m.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                      title="Delete Monthly Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom quick row */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowAddMonthly(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 px-2 py-1 rounded hover:bg-orange-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add new task to this Monthly table</span>
          </button>
        </div>
      </div>

      {/* SECTION 5 & 6: SALES METRICS & RUNNING ACCOUNTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 5: Sales Metrics (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-[#1e293b] text-white px-4 py-2.5 font-semibold text-xs tracking-wide flex items-center justify-between">
            <span className="font-bold text-sm">Sales Metrics &amp; Conversions</span>
            <span className="text-[11px] font-mono-code text-slate-300">Weekly Target</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-amber-500/20 text-amber-950 font-bold border-b border-amber-300/40 text-[11px]">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">OP Final (A/Cs)</th>
                  <th className="p-3 text-right">OP Value (₹)</th>
                  <th className="p-3 text-center">SR Final (A/Cs)</th>
                  <th className="p-3 text-right">SR Value (₹)</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentSheet.salesMetrics.map((row, idx) => (
                  <tr key={row.category} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{row.category}</td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="0"
                        value={row.opFinalCount}
                        onChange={(e) => updateSalesMetric(idx, { opFinalCount: parseInt(e.target.value) || 0 })}
                        className="w-14 text-center font-bold bg-white border border-slate-300 rounded py-1"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.opValue}
                        onChange={(e) => updateSalesMetric(idx, { opValue: parseInt(e.target.value) || 0 })}
                        className="w-24 text-right font-mono-code font-bold bg-white border border-slate-300 rounded py-1 pr-1 text-slate-900"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="0"
                        value={row.srFinalCount}
                        onChange={(e) => updateSalesMetric(idx, { srFinalCount: parseInt(e.target.value) || 0 })}
                        className="w-14 text-center font-bold bg-white border border-slate-300 rounded py-1"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.srValue}
                        onChange={(e) => updateSalesMetric(idx, { srValue: parseInt(e.target.value) || 0 })}
                        className="w-24 text-right font-mono-code font-bold bg-white border border-slate-300 rounded py-1 pr-1 text-slate-900"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(e) => updateSalesMetric(idx, { remarks: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                        placeholder="Remarks..."
                      />
                    </td>
                  </tr>
                ))}
                {/* Auto Sum TOTAL Row */}
                <tr className="bg-amber-500/20 font-bold text-amber-950 text-xs border-t-2 border-amber-400">
                  <td className="p-3 font-extrabold uppercase">TOTAL</td>
                  <td className="p-3 text-center font-mono-code text-sm">{computedTotals.totalOpAccounts}</td>
                  <td className="p-3 text-right font-mono-code text-sm text-emerald-900">{formatINR(computedTotals.totalOpValue)}</td>
                  <td className="p-3 text-center font-mono-code text-sm">{computedTotals.totalSrAccounts}</td>
                  <td className="p-3 text-right font-mono-code text-sm text-emerald-900">{formatINR(computedTotals.totalSrValue)}</td>
                  <td className="p-3 font-mono-code text-right text-emerald-950 font-extrabold">
                    Grand: {formatINR(computedTotals.grandTotalRevenue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 6: Running Accounts */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="bg-[#1e293b] text-white px-4 py-2.5 font-semibold text-xs tracking-wide">
              <span className="font-bold text-sm">Running Accounts &amp; Recoveries</span>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {currentSheet.runningAccounts.map((acc, idx) => (
                <div key={acc.category} className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800"># Deals Followed Up</span>
                      <input
                        type="number"
                        min="0"
                        value={acc.dealsCalledCount}
                        onChange={(e) => updateRunningAccount(idx, { dealsCalledCount: parseInt(e.target.value) || 0 })}
                        className="w-20 text-center font-bold bg-white border border-slate-300 rounded p-1"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Pending Amount (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={acc.pendingAmount}
                        onChange={(e) => updateRunningAccount(idx, { pendingAmount: parseInt(e.target.value) || 0 })}
                        className="w-28 text-right font-mono-code font-bold bg-white border border-slate-300 rounded p-1"
                      />
                    </div>

                    <div className="flex justify-between items-center bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                      <span className="font-bold text-emerald-950">Amount Received (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={acc.amountReceivedThisWeek}
                        onChange={(e) => updateRunningAccount(idx, { amountReceivedThisWeek: parseInt(e.target.value) || 0 })}
                        className="w-28 text-right font-mono-code font-extrabold bg-white border border-emerald-400 text-emerald-900 rounded p-1"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Remarks</span>
                      <input
                        type="text"
                        value={acc.remarks}
                        onChange={(e) => updateRunningAccount(idx, { remarks: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 mt-1"
                        placeholder="Recovery notes..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs flex items-center justify-between font-mono-code">
            <span className="text-slate-500">Recovery Velocity:</span>
            <span className="font-bold text-emerald-700">
              {formatPercent(safeDivision(currentSheet.runningAccounts[0]?.amountReceivedThisWeek || 0, currentSheet.runningAccounts[0]?.pendingAmount || 1))}
            </span>
          </div>
        </div>

      </div>

      {/* SECTION 7: TARGETS & ACHIEVEMENT (OV) with Dynamic Color Coding */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-[#1e293b] text-white px-4 py-2.5 font-semibold text-xs tracking-wide flex items-center justify-between">
          <span className="font-bold text-sm">Target Allocation &amp; Performance</span>
          <button
            onClick={onOpenTargetModal}
            className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <span>Target Workflow / Approval</span>
          </button>
        </div>

        {/* Legend for conditional colors */}
        <div className="bg-slate-50 px-5 py-2 border-b border-slate-200 flex items-center gap-4 flex-wrap text-[11px]">
          <span className="font-bold text-slate-600">Performance Color Thresholds:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
            &gt;70% Green (Above Target)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
            50–70% Mustard (Moderate)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300 font-bold">
            30–49% Red (Critical)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300 font-medium">
            ≤29% Grey (Incomplete)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-amber-500/20 text-amber-950 font-bold border-b border-amber-300/40 text-[11px]">
              <tr>
                <th className="p-3 w-44">Individual Sales</th>
                <th className="p-3 text-right">OP (₹)</th>
                <th className="p-3 text-right">SR (₹)</th>
                <th className="p-3 w-44 border-l border-amber-300/50">Individual Sales</th>
                <th className="p-3 text-right">OP (₹)</th>
                <th className="p-3 text-right">SR (₹)</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-3 font-bold text-slate-900">Monthly Target (OV)</td>
                <td className="p-3 text-right font-mono-code font-bold text-slate-800">{formatINR(currentSheet.targets.monthlyTargetOp)}</td>
                <td className="p-3 text-right font-mono-code font-bold text-slate-800">{formatINR(currentSheet.targets.monthlyTargetSr)}</td>
                <td className="p-3 font-bold text-slate-900 border-l border-slate-200">Weekly Target (OV)</td>
                <td className="p-3 text-right font-mono-code font-bold text-slate-800">{formatINR(currentSheet.targets.weeklyTargetOp)}</td>
                <td className="p-3 text-right font-mono-code font-bold text-slate-800">{formatINR(currentSheet.targets.weeklyTargetSr)}</td>
                <td rowSpan={3} className="p-3 align-top bg-slate-50/50 text-slate-700 text-xs">
                  {currentSheet.targets.remarks || 'Standard targets allocated'}
                </td>
              </tr>

              <tr>
                <td className="p-3 font-bold text-slate-900">Monthly Achieved (OV)</td>
                <td className="p-3 text-right font-mono-code font-bold text-emerald-850">{formatINR(currentSheet.targets.monthlyAchievedOp)}</td>
                <td className="p-3 text-right font-mono-code font-bold text-emerald-850">{formatINR(currentSheet.targets.monthlyAchievedSr)}</td>
                <td className="p-3 font-bold text-slate-900 border-l border-slate-200">Weekly Achieved (OV)</td>
                <td className="p-3 text-right font-mono-code font-bold text-emerald-850">{formatINR(currentSheet.targets.weeklyAchievedOp)}</td>
                <td className="p-3 text-right font-mono-code font-bold text-emerald-850">{formatINR(currentSheet.targets.weeklyAchievedSr)}</td>
              </tr>

              {/* % Achieved Row with STRICT Conditional Formatting */}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <td className="p-3 font-extrabold text-slate-900">% Achieved (Monthly)</td>
                <td className="p-2 text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-lg border font-mono-code text-xs ${monthlyOpStyle.cellBgClass}`}>
                    {formatPercent(monthlyOpPct)}
                  </span>
                </td>
                <td className="p-2 text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-lg border font-mono-code text-xs ${monthlySrStyle.cellBgClass}`}>
                    {formatPercent(monthlySrPct)}
                  </span>
                </td>
                <td className="p-3 font-extrabold text-slate-900 border-l border-slate-200">% Achieved (Weekly)</td>
                <td className="p-2 text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-lg border font-mono-code text-xs ${weeklyOpStyle.cellBgClass}`}>
                    {formatPercent(weeklyOpPct)}
                  </span>
                </td>
                <td className="p-2 text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-lg border font-mono-code text-xs ${weeklySrStyle.cellBgClass}`}>
                    {formatPercent(weeklySrPct)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 8: ACHIEVEMENTS & 9: STUCK POINTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 8: Achievements */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="bg-[#1e293b] text-white px-4 py-2.5 font-semibold text-xs tracking-wide flex items-center justify-between">
              <span className="font-bold text-sm">Key Achievements</span>
              <button
                onClick={() => addAchievement('')}
                className="inline-flex items-center gap-1 text-xs bg-orange-600 hover:bg-orange-500 px-2.5 py-1 rounded-lg text-white font-semibold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Item</span>
              </button>
            </div>

            <div className="p-4 space-y-2.5 text-xs">
              {currentSheet.achievements.map((ach, idx) => (
                <div key={ach.id} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={ach.text}
                    onChange={(e) => updateAchievement(ach.id, e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white"
                    placeholder={`Achievement ${idx + 1}...`}
                  />
                  <button
                    onClick={() => deleteAchievement(ach.id)}
                    className="text-slate-400 hover:text-rose-600 p-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 9: Stuck Points / Roadblocks */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="bg-[#1e293b] text-white px-4 py-2.5 font-semibold text-xs tracking-wide flex items-center justify-between">
              <span className="font-bold text-sm">Stuck Points &amp; Roadblocks</span>
              <button
                onClick={() => addStuckPoint({ stuckPoint: '', reason: '', cta: '' })}
                className="inline-flex items-center gap-1 text-xs bg-orange-600 hover:bg-orange-500 px-2.5 py-1 rounded-lg text-white font-semibold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Item</span>
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              {currentSheet.stuckPoints.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 font-medium">
                  No critical stuck points logged for this period. Great job!
                </div>
              ) : (
                currentSheet.stuckPoints.map((sp, idx) => (
                  <div key={sp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700 uppercase text-[10px]">Stuck #{idx + 1}</span>
                      <button onClick={() => deleteStuckPoint(sp.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={sp.stuckPoint}
                      onChange={(e) => updateStuckPoint(sp.id, { stuckPoint: e.target.value })}
                      placeholder="Stuck Point description..."
                      className="w-full p-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-900 text-xs"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={sp.reason}
                        onChange={(e) => updateStuckPoint(sp.id, { reason: e.target.value })}
                        placeholder="Root Reason..."
                        className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-800 text-xs"
                      />
                      <input
                        type="text"
                        value={sp.cta}
                        onChange={(e) => updateStuckPoint(sp.id, { cta: e.target.value })}
                        placeholder="CTA (Corrective Action)..."
                        className="w-full p-1.5 bg-amber-50 border border-amber-300 rounded font-bold text-amber-950 text-xs"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 10 & 11: CLIENT FEEDBACK & LEARNING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 10: Client Feedback */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-[#1e293b] text-white px-4 py-2.5 font-semibold text-xs tracking-wide">
            <span className="font-bold text-sm">Client Feedback &amp; Reviews</span>
          </div>

          <div className="p-4 space-y-3 text-xs">
            <label className="font-bold text-slate-700 block">Clients Review / Testimonial Received</label>
            <textarea
              value={currentSheet.clientFeedback.testimonial}
              onChange={(e) => updateClientFeedback({ testimonial: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white text-xs"
              placeholder="Paste direct feedback, WhatsApp praise, or client comments..."
            />
          </div>
        </div>

        {/* 11: Learning & Improvement */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-[#1e293b] text-white px-4 py-2.5 font-semibold text-xs tracking-wide">
            <span className="font-bold text-sm">Learning &amp; Process Changes</span>
          </div>

          <div className="p-4 space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block text-[11px] mb-1">New Implemented</label>
              <input
                type="text"
                value={currentSheet.learningImprovement.newImplemented}
                onChange={(e) => updateLearningImprovement({ newImplemented: e.target.value })}
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                placeholder="What new process/method was executed..."
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block text-[11px] mb-1">Anything Else / Key Process Change</label>
              <input
                type="text"
                value={currentSheet.learningImprovement.anythingElse}
                onChange={(e) => updateLearningImprovement({ anythingElse: e.target.value })}
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                placeholder="Key learnings & ideas for next cycle..."
              />
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 12: WEEKLY SUMMARY & REVIEWER SIGN-OFF */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-[#1e293b] text-white px-4 py-2.5 font-semibold text-xs tracking-wide flex items-center justify-between">
          <span className="font-bold text-sm">Weekly Summary &amp; Sign-off</span>
          <span className="text-[11px] font-mono-code text-slate-300">Management Audit</span>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Avg. Daily Task Completion</span>
                <span className="text-xl font-mono-code font-bold text-slate-900">
                  {formatPercent(Math.round((renPct + quotePct) / 2))}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-lg border font-mono-code text-xs font-bold ${getPerformanceThreshold((renPct + quotePct) / 2).cellBgClass}`}>
                {getPerformanceThreshold((renPct + quotePct) / 2).tier.toUpperCase()}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Avg. Weekly Task Achievement</span>
                <span className="text-xl font-mono-code font-bold text-slate-900">
                  {formatPercent(Math.round((weeklyOpPct + weeklySrPct) / 2))}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-lg border font-mono-code text-xs font-bold ${getPerformanceThreshold((weeklyOpPct + weeklySrPct) / 2).cellBgClass}`}>
                {getPerformanceThreshold((weeklyOpPct + weeklySrPct) / 2).tier.toUpperCase()}
              </span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Analysis & Executive Comments</label>
            <textarea
              value={currentSheet.weeklySummary.analysis}
              onChange={(e) => updateWeeklySummary({ analysis: e.target.value })}
              rows={2}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white text-xs"
              placeholder="Manager review notes and actionable instructions..."
            />
          </div>

          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Reviewed By</span>
              <input
                type="text"
                value={currentSheet.weeklySummary.reviewedBy}
                onChange={(e) => updateWeeklySummary({ reviewedBy: e.target.value })}
                className="w-full font-bold text-slate-900 bg-transparent border-b border-slate-300 py-1 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Review Date</span>
              <input
                type="date"
                value={currentSheet.weeklySummary.reviewDate}
                onChange={(e) => updateWeeklySummary({ reviewDate: e.target.value })}
                className="w-full font-bold text-slate-900 bg-transparent border-b border-slate-300 py-1 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export const WeeklyReviewSheet: React.FC<WeeklyReviewSheetProps> = (props) => {
  const { currentSheet } = usePestCure();

  if (currentSheet.sheetType === 'commercial_bd' || currentSheet.dailyCommercialTasks !== undefined) {
    return <CommercialBDReviewSheet onOpenNewUserModal={props.onOpenNewUserModal} />;
  }

  if (currentSheet.sheetType === 'tender_operations' || currentSheet.dailyTenderOperations !== undefined) {
    return <KajalReviewSheet onOpenNewUserModal={props.onOpenNewUserModal} />;
  }

  return <CustomerCareReviewSheet {...props} />;
};
