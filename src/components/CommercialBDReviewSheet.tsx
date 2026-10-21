import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Send,
  Building2,
  TrendingUp,
  Award,
  HelpCircle,
  Lightbulb,
  DollarSign,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Briefcase,
  Users,
  Star,
  Video,
  CheckSquare
} from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';
import {
  getPerformanceThreshold,
  formatINR,
  formatPercent,
  safeDivision,
  roundToTwo
} from '../utils/colorThreshold';
import { computeDayEntryState } from '../utils/dayFreezeHelper';
import { ColorThresholdLegend } from './ColorThresholdLegend';
import { TopMainKpiHero } from './TopMainKpiHero';
import { AdminAddKpiModal } from './AdminAddKpiModal';

interface CommercialBDReviewSheetProps {
  onOpenNewUserModal?: () => void;
}

export const CommercialBDReviewSheet: React.FC<CommercialBDReviewSheetProps> = ({ onOpenNewUserModal }) => {
  const {
    member,
    userRole,
    currentSheet,
    lockedDaysMap,
    updateAttendance,
    updateDailyCommercialDay,
    updateDailyCommercialTarget,
    addDailyCommercialTask,
    deleteDailyCommercialTask,
    updateCommercialWeeklyTask,
    addCommercialWeeklyTask,
    deleteCommercialWeeklyTask,
    updateCommercialBDReview,
    updateOtherSalesChannel,
    addOtherSalesChannel,
    deleteOtherSalesChannel,
    updateVendorRegistrationMetric,
    updateRecognition,
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
    computedTotals
  } = usePestCure();

  const [newAchievement, setNewAchievement] = useState('');
  const [newStuck, setNewStuck] = useState({ stuckPoint: '', reason: '', cta: '' });
  const [newCommercialTask, setNewCommercialTask] = useState({ task: '', targetPerDay: 10 });
  const [isAddKpiModalOpen, setIsAddKpiModalOpen] = useState(false);
  const [newWeeklyTask, setNewWeeklyTask] = useState({
    occurrence: 'Weekly',
    task: '',
    support: '',
    status: 'In Progress' as const,
    target: 10,
    actual: 0,
    remarks: ''
  });
  const [newChannel, setNewChannel] = useState({ channel: '', target: 100000, achieved: 0, remarks: '' });

  const isReadOnly = userRole === 'admin' ? false : currentSheet.status === 'submitted' || currentSheet.status === 'approved';

  const dailyTasks = currentSheet.dailyCommercialTasks || [];
  const weeklyTasks = currentSheet.commercialWeeklyTasks || [];
  const bdReview = currentSheet.commercialBDReview || {
    vendorRegistration: { vendorsAdded: '', remarks: '' },
    pcProduct: { productsAddedInfo: '', productSaleValue: 0, remarks: '' },
    bdTeamReview: { teamAchievements: '', majorIssue: '', suggestion: '' }
  };
  const otherChannels = currentSheet.otherSalesChannels || [];
  const vendorMetrics = currentSheet.vendorRegistrationMetrics || [];
  const recognition = currentSheet.recognition || {
    topPerformerSpr: { name: '', remarks: '' },
    topPerformerOfc: { name: '', remarks: '' }
  };
  const monthlyTasks = currentSheet.monthlyTasks || [];
  const salesMetrics = currentSheet.salesMetrics || [];
  const runningAccounts = currentSheet.runningAccounts || [];

  return (
    <div id="commercial-bd-sheet-view" className="space-y-8 pb-16">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: Sheet Title & Employee Attendance Details */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-attendance" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Commercial & BD Weekly Review &bull; {currentSheet.attendance.name || member.name}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                  Commercial & BD
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cycle: {currentSheet.cycleLabel} &bull; Executive: {member.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                currentSheet.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : currentSheet.status === 'submitted'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {currentSheet.status === 'approved' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : currentSheet.status === 'submitted' ? (
                <Clock className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {currentSheet.status.toUpperCase()}
            </span>

            {userRole === 'member' && currentSheet.status === 'draft' && (
              <button
                id="submit-commercial-sheet-btn"
                onClick={submitWeeklySheet}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Review
              </button>
            )}
          </div>
        </div>

        {/* TOP COLOR THRESHOLD LEGENDS */}
        <ColorThresholdLegend />

        {/* TOP MAIN DATA HERO CARDS (Prominent numbers and key KPIs) */}
        <TopMainKpiHero
          onOpenAddKpi={() => setIsAddKpiModalOpen(true)}
          onOpenNewUserModal={onOpenNewUserModal}
        />

        {/* Admin KPI Creation Modal */}
        <AdminAddKpiModal
          isOpen={isAddKpiModalOpen}
          onClose={() => setIsAddKpiModalOpen(false)}
        />

        {/* Section 1 Attendance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee & Role</label>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{currentSheet.attendance.name || member.name}</p>
            <p className="text-[11px] text-slate-500">{currentSheet.attendance.role || member.role}</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{currentSheet.attendance.team || member.department}</p>
            <p className="text-[11px] text-teal-600 font-medium">B2B Corporate & Industrial</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Review Period</label>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="date"
                disabled={isReadOnly}
                value={currentSheet.attendance.periodStart}
                onChange={(e) => updateAttendance({ periodStart: e.target.value })}
                className="text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-semibold w-full"
              />
              <span className="text-[10px] text-slate-400">to</span>
              <input
                type="date"
                disabled={isReadOnly}
                value={currentSheet.attendance.periodEnd}
                onChange={(e) => updateAttendance({ periodEnd: e.target.value })}
                className="text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-semibold w-full"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance (Leaves / Lates / SH-HD)</label>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <div>
                <span className="text-[9px] text-slate-400 block">Leaves</span>
                <input
                  type="number"
                  min="0"
                  disabled={isReadOnly}
                  value={currentSheet.attendance.leaves}
                  onChange={(e) => updateAttendance({ leaves: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded px-1 py-0.5 text-center text-slate-800"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">Lates</span>
                <input
                  type="number"
                  min="0"
                  disabled={isReadOnly}
                  value={currentSheet.attendance.lates}
                  onChange={(e) => updateAttendance({ lates: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded px-1 py-0.5 text-center text-slate-800"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">SH / HD</span>
                <input
                  type="number"
                  min="0"
                  disabled={isReadOnly}
                  value={currentSheet.attendance.shHd}
                  onChange={(e) => updateAttendance({ shHd: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded px-1 py-0.5 text-center text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: Daily Commercial Tasks (Alka Ghai Specific) */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-daily" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="text-base font-bold text-slate-900">Daily Tasks (Commercial & BD)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily quota tracking across Tuesday to Monday with auto 6-day achievement calculation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              Daily Avg Completion:{' '}
              <strong className={getPerformanceThreshold(computedTotals.dailyCommercialAvgPct).textClass}>
                {formatPercent(computedTotals.dailyCommercialAvgPct)}
              </strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 min-w-[200px]">Commercial Task</th>
                <th className="py-3 px-2 text-center w-16">T/D</th>
                <th className="py-3 px-2 text-center w-16">Target</th>
                <th className="py-3 px-2 text-center">Tue</th>
                <th className="py-3 px-2 text-center">Wed</th>
                <th className="py-3 px-2 text-center">Thu</th>
                <th className="py-3 px-2 text-center">Fri</th>
                <th className="py-3 px-2 text-center">Sat</th>
                <th className="py-3 px-2 text-center text-slate-400">Sun</th>
                <th className="py-3 px-2 text-center">Mon</th>
                <th className="py-3 px-2 text-center font-bold bg-slate-100/70 w-16">Total</th>
                <th className="py-3 px-3 text-center font-bold bg-teal-50/60 text-teal-900 w-24">Achieve %</th>
                {!isReadOnly && <th className="py-3 px-2 text-center w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyTasks.map((row) => {
                const total =
                  (row.days.tue || 0) +
                  (row.days.wed || 0) +
                  (row.days.thu || 0) +
                  (row.days.fri || 0) +
                  (row.days.sat || 0) +
                  (row.days.sun || 0) +
                  (row.days.mon || 0);
                const target6 = (row.targetPerDay || 0) * 6;
                const achievePct = safeDivision(total, target6);
                const threshold = getPerformanceThreshold(achievePct);

                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{row.task}</td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.targetPerDay}
                        onChange={(e) => updateDailyCommercialTarget(row.id, parseInt(e.target.value) || 0)}
                        className="w-14 text-center bg-slate-50 border border-slate-200 rounded px-1 py-1 font-semibold text-slate-700"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-600 bg-slate-50/60">{target6}</td>
                    {(['tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'mon'] as const).map((dayKey) => {
                      const isSun = dayKey === 'sun';
                      const val = row.days[dayKey] ?? 0;
                      const lockKey = `${currentSheet.id}_${row.id}_${dayKey}`;
                      const isLocked = Boolean(lockedDaysMap[lockKey]);
                      const dayState = computeDayEntryState(dayKey, val, isLocked, false, userRole);

                      const inputDisabled = isReadOnly || isSun || !dayState.isEditable;

                      return (
                        <td key={dayKey} className={`py-2 px-1 text-center ${isSun ? 'bg-slate-50/40 text-slate-400' : ''}`}>
                          <input
                            type="number"
                            min="0"
                            disabled={inputDisabled}
                            value={val === 0 && (dayState.state === 'today_active' || userRole === 'admin') ? '' : val}
                            placeholder="0"
                            title={dayState.statusLabel}
                            onChange={(e) => updateDailyCommercialDay(row.id, dayKey, parseInt(e.target.value) || 0)}
                            className={`w-12 text-center rounded-lg px-1 py-1 font-mono-code text-xs font-semibold transition-all ${
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
                                ? 'bg-teal-50 border border-teal-200 text-teal-900'
                                : 'bg-slate-50 border border-slate-200 text-slate-700'
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-2 text-center font-bold text-slate-900 bg-slate-100/70">{total}</td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${threshold.badgeClass}`}>
                        {formatPercent(achievePct)}
                      </span>
                    </td>
                    {!isReadOnly && (
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => deleteDailyCommercialTask(row.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Daily Commercial Task Form */}
        {!isReadOnly && (
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="Add new Commercial Daily Task..."
              value={newCommercialTask.task}
              onChange={(e) => setNewCommercialTask({ ...newCommercialTask, task: e.target.value })}
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <input
              type="number"
              min="1"
              placeholder="Target/Day"
              value={newCommercialTask.targetPerDay}
              onChange={(e) => setNewCommercialTask({ ...newCommercialTask, targetPerDay: parseInt(e.target.value) || 1 })}
              className="w-24 text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-center"
            />
            <button
              onClick={() => {
                if (newCommercialTask.task.trim()) {
                  addDailyCommercialTask(newCommercialTask.task.trim(), newCommercialTask.targetPerDay);
                  setNewCommercialTask({ task: '', targetPerDay: 10 });
                }
              }}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: Weekly Tasks (Alka Ghai Specific) */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-weekly" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
              <h2 className="text-base font-bold text-slate-900">Weekly Tasks (Commercial & BD)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Weekly objectives including payment scanning, AI Sales, AdWords/IndiaMart leads, and team targets
            </p>
          </div>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            Avg Achievement:{' '}
            <strong className={getPerformanceThreshold(computedTotals.commercialWeeklyAvgPct).textClass}>
              {formatPercent(computedTotals.commercialWeeklyAvgPct)}
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 min-w-[200px]">Weekly Task</th>
                <th className="py-3 px-2 text-center w-24">Support</th>
                <th className="py-3 px-2 text-center w-24">Status</th>
                <th className="py-3 px-2 text-center w-20">Target</th>
                <th className="py-3 px-2 text-center w-20">Actual</th>
                <th className="py-3 px-3 text-center font-bold bg-teal-50/60 text-teal-900 w-24">Achieve %</th>
                <th className="py-3 px-3 min-w-[180px]">Remarks</th>
                {!isReadOnly && <th className="py-3 px-2 text-center w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weeklyTasks.map((row) => {
                const achievePct = row.target > 0 ? safeDivision(row.actual, row.target) : 0;
                const threshold = getPerformanceThreshold(achievePct);

                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{row.task}</td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={row.support}
                        onChange={(e) => updateCommercialWeeklyTask(row.id, { support: e.target.value })}
                        placeholder="Support"
                        className="w-full text-center bg-transparent border-b border-dashed border-slate-300 text-xs text-slate-700 py-0.5 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <select
                        disabled={isReadOnly}
                        value={row.status}
                        onChange={(e) => updateCommercialWeeklyTask(row.id, { status: e.target.value as any })}
                        className={`text-xs font-semibold rounded px-2 py-1 border ${
                          row.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : row.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Deferred">Deferred</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.target}
                        onChange={(e) => updateCommercialWeeklyTask(row.id, { target: parseFloat(e.target.value) || 0 })}
                        className="w-20 text-center bg-slate-50 border border-slate-200 rounded px-1.5 py-1 font-semibold text-slate-700"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.actual}
                        onChange={(e) => updateCommercialWeeklyTask(row.id, { actual: parseFloat(e.target.value) || 0 })}
                        className="w-20 text-center bg-teal-50/50 border border-teal-200 rounded px-1.5 py-1 font-bold text-teal-900"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${threshold.badgeClass}`}>
                        {formatPercent(achievePct)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={row.remarks}
                        onChange={(e) => updateCommercialWeeklyTask(row.id, { remarks: e.target.value })}
                        placeholder="Add remarks..."
                        className="w-full bg-transparent border-b border-dashed border-slate-300 text-xs text-slate-700 py-0.5 focus:outline-none"
                      />
                    </td>
                    {!isReadOnly && (
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => deleteCommercialWeeklyTask(row.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete Weekly Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Weekly Commercial Task */}
        {!isReadOnly && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="Task name"
              value={newWeeklyTask.task}
              onChange={(e) => setNewWeeklyTask({ ...newWeeklyTask, task: e.target.value })}
              className="md:col-span-2 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Support person"
              value={newWeeklyTask.support}
              onChange={(e) => setNewWeeklyTask({ ...newWeeklyTask, support: e.target.value })}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Target"
              value={newWeeklyTask.target}
              onChange={(e) => setNewWeeklyTask({ ...newWeeklyTask, target: parseFloat(e.target.value) || 0 })}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-center"
            />
            <input
              type="number"
              placeholder="Actual"
              value={newWeeklyTask.actual}
              onChange={(e) => setNewWeeklyTask({ ...newWeeklyTask, actual: parseFloat(e.target.value) || 0 })}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-center"
            />
            <button
              onClick={() => {
                if (newWeeklyTask.task.trim()) {
                  addCommercialWeeklyTask({
                    occurrence: 'Weekly',
                    task: newWeeklyTask.task.trim(),
                    support: newWeeklyTask.support,
                    status: newWeeklyTask.status,
                    target: newWeeklyTask.target,
                    actual: newWeeklyTask.actual,
                    remarks: newWeeklyTask.remarks
                  });
                  setNewWeeklyTask({
                    occurrence: 'Weekly',
                    task: '',
                    support: '',
                    status: 'In Progress',
                    target: 10,
                    actual: 0,
                    remarks: ''
                  });
                }
              }}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3B: BD Review & Vendor Details */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-bd-review" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3B</span>
          <h2 className="text-base font-bold text-slate-900">Commercial BD Review & Product Metrics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vendor Registration Info */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase mb-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Vendor Registration
              </div>
              <label className="text-[11px] font-medium text-slate-500">Vendors Added at Clients</label>
              <textarea
                disabled={isReadOnly}
                value={bdReview.vendorRegistration.vendorsAdded}
                onChange={(e) => updateCommercialBDReview('vendorRegistration', 'vendorsAdded', e.target.value)}
                rows={2}
                placeholder="List vendors onboarded (e.g., Apollo, Max, DLF)..."
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="mt-2">
              <label className="text-[11px] font-medium text-slate-500">Vendor Remarks</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={bdReview.vendorRegistration.remarks}
                onChange={(e) => updateCommercialBDReview('vendorRegistration', 'remarks', e.target.value)}
                placeholder="Status notes..."
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* PC Product Info */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase mb-2">
                <ShoppingBag className="w-4 h-4 text-teal-600" />
                PC Products Added & Sales
              </div>
              <label className="text-[11px] font-medium text-slate-500">Products Catalog Info</label>
              <textarea
                disabled={isReadOnly}
                value={bdReview.pcProduct.productsAddedInfo}
                onChange={(e) => updateCommercialBDReview('pcProduct', 'productsAddedInfo', e.target.value)}
                rows={2}
                placeholder="Product catalog status (Ultra Fly Catcher, Bird Spikes, etc.)..."
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-medium text-slate-500">Product Sale Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  disabled={isReadOnly}
                  value={bdReview.pcProduct.productSaleValue}
                  onChange={(e) => updateCommercialBDReview('pcProduct', 'productSaleValue', parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-teal-900"
                />
              </div>
              <div className="text-right pt-4">
                <span className="text-xs font-bold text-teal-700">{formatINR(bdReview.pcProduct.productSaleValue)}</span>
              </div>
            </div>
          </div>

          {/* BD Team Review & Roadblocks */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase mb-2">
                <Users className="w-4 h-4 text-teal-600" />
                BD Team Review & Insights
              </div>
              <label className="text-[11px] font-medium text-slate-500">Team Achievements</label>
              <textarea
                disabled={isReadOnly}
                value={bdReview.bdTeamReview.teamAchievements}
                onChange={(e) => updateCommercialBDReview('bdTeamReview', 'teamAchievements', e.target.value)}
                rows={2}
                placeholder="Major contracts closed..."
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="mt-2">
              <label className="text-[11px] font-medium text-slate-500">Major Issue / Suggestion</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={bdReview.bdTeamReview.suggestion}
                onChange={(e) => updateCommercialBDReview('bdTeamReview', 'suggestion', e.target.value)}
                placeholder="Process improvement suggestion..."
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: Monthly / Quarterly Tasks */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-monthly" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">4</span>
          <h2 className="text-base font-bold text-slate-900">Monthly / Quarterly Tasks</h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 w-28">Frequency</th>
                <th className="py-3 px-3 min-w-[180px]">Task</th>
                <th className="py-3 px-2 text-center w-28">Status</th>
                <th className="py-3 px-2 text-center w-20">TAT</th>
                <th className="py-3 px-3 min-w-[160px]">Reason for Pendency</th>
                <th className="py-3 px-3 min-w-[160px]">Remarks</th>
                {!isReadOnly && <th className="py-3 px-2 text-center w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {task.occurrence}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{task.task}</td>
                  <td className="py-2.5 px-2 text-center">
                    <select
                      disabled={isReadOnly}
                      value={task.status}
                      onChange={(e) => updateMonthlyTask(task.id, { status: e.target.value as any })}
                      className={`text-xs font-semibold rounded px-2 py-1 border ${
                        task.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : task.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Deferred">Deferred</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={task.tat}
                      onChange={(e) => updateMonthlyTask(task.id, { tat: e.target.value })}
                      className="w-16 text-center bg-transparent border-b border-dashed border-slate-300 text-xs text-slate-700"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={task.reasonForPendency}
                      onChange={(e) => updateMonthlyTask(task.id, { reasonForPendency: e.target.value })}
                      placeholder="Pendency reason..."
                      className="w-full bg-transparent border-b border-dashed border-slate-300 text-xs text-slate-700 py-0.5"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={task.remarkIfAny}
                      onChange={(e) => updateMonthlyTask(task.id, { remarkIfAny: e.target.value })}
                      placeholder="Remarks..."
                      className="w-full bg-transparent border-b border-dashed border-slate-300 text-xs text-slate-700 py-0.5"
                    />
                  </td>
                  {!isReadOnly && (
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => deleteMonthlyTask(task.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: Sales Metrics (New Inquiries, Renewals & Referrals) */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-sales-metrics" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">5</span>
              <h2 className="text-base font-bold text-slate-900">Sales Metrics: Inquiries, Renewals & Referrals</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Weekly operational volume (OP) and special request (SR) deals closed
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              Total Deals: <strong>{computedTotals.grandTotalAccounts}</strong>
            </span>
            <span className="text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
              Total Revenue: <strong>{formatINR(computedTotals.grandTotalRevenue)}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 min-w-[160px]">Sales Category</th>
                <th className="py-3 px-2 text-center w-24">OP Count</th>
                <th className="py-3 px-3 text-right w-32">OP Value (₹)</th>
                <th className="py-3 px-2 text-center w-24">SR Count</th>
                <th className="py-3 px-3 text-right w-32">SR Value (₹)</th>
                <th className="py-3 px-3 text-right font-bold bg-teal-50/60 text-teal-900 w-36">Total (₹)</th>
                <th className="py-3 px-3 min-w-[180px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesMetrics.map((row, idx) => {
                const totalRowVal = (Number(row.opValue) || 0) + (Number(row.srValue) || 0);

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{row.category}</td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.opFinalCount}
                        onChange={(e) => updateSalesMetric(idx, { opFinalCount: parseInt(e.target.value) || 0 })}
                        className="w-16 text-center bg-slate-50 border border-slate-200 rounded px-1.5 py-1 font-semibold text-slate-700"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.opValue}
                        onChange={(e) => updateSalesMetric(idx, { opValue: parseFloat(e.target.value) || 0 })}
                        className="w-28 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.srFinalCount}
                        onChange={(e) => updateSalesMetric(idx, { srFinalCount: parseInt(e.target.value) || 0 })}
                        className="w-16 text-center bg-slate-50 border border-slate-200 rounded px-1.5 py-1 font-semibold text-slate-700"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.srValue}
                        onChange={(e) => updateSalesMetric(idx, { srValue: parseFloat(e.target.value) || 0 })}
                        className="w-28 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-teal-900 bg-teal-50/40">
                      {formatINR(totalRowVal)}
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={row.remarks}
                        onChange={(e) => updateSalesMetric(idx, { remarks: e.target.value })}
                        placeholder="Segment remarks..."
                        className="w-full bg-transparent border-b border-dashed border-slate-300 text-xs text-slate-700 py-0.5"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 6: Running Accounts — Pending Payments */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-running-accounts" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">6</span>
          <h2 className="text-base font-bold text-slate-900">Running Accounts — Pending Payment Calling</h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 min-w-[160px]">Account Category</th>
                <th className="py-3 px-2 text-center w-28">Deals Called</th>
                <th className="py-3 px-3 text-right w-36">Pending Amount (₹)</th>
                <th className="py-3 px-3 text-right w-36">Received This Week (₹)</th>
                <th className="py-3 px-3 text-center font-bold bg-teal-50/60 text-teal-900 w-28">Recovery %</th>
                <th className="py-3 px-3 min-w-[200px]">Remarks / Commitments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runningAccounts.map((row, idx) => {
                const recoveryPct = row.pendingAmount > 0 ? safeDivision(row.amountReceivedThisWeek, row.pendingAmount) : 0;
                const threshold = getPerformanceThreshold(recoveryPct);

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{row.category}</td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.dealsCalledCount}
                        onChange={(e) => updateRunningAccount(idx, { dealsCalledCount: parseInt(e.target.value) || 0 })}
                        className="w-20 text-center bg-slate-50 border border-slate-200 rounded px-1.5 py-1 font-semibold text-slate-700"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.pendingAmount}
                        onChange={(e) => updateRunningAccount(idx, { pendingAmount: parseFloat(e.target.value) || 0 })}
                        className="w-32 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.amountReceivedThisWeek}
                        onChange={(e) => updateRunningAccount(idx, { amountReceivedThisWeek: parseFloat(e.target.value) || 0 })}
                        className="w-32 text-right bg-emerald-50/60 border border-emerald-200 rounded px-2 py-1 font-bold text-emerald-900"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${threshold.badgeClass}`}>
                        {formatPercent(recoveryPct)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={row.remarks}
                        onChange={(e) => updateRunningAccount(idx, { remarks: e.target.value })}
                        placeholder="Payment details..."
                        className="w-full bg-transparent border-b border-dashed border-slate-300 text-xs text-slate-700 py-0.5"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 7: Targets & Achievement (OV) */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-targets" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">7</span>
          <h2 className="text-base font-bold text-slate-900">Targets & Achievement (OV)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Weekly OP Target */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase">Weekly OP Target</span>
              <span className={`font-bold ${getPerformanceThreshold(computedTotals.weeklyOpAchievementPct).textClass}`}>
                {formatPercent(computedTotals.weeklyOpAchievementPct)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-slate-900">{formatINR(currentSheet.targets.weeklyAchievedOp)}</span>
              <span className="text-xs text-slate-400">of {formatINR(currentSheet.targets.weeklyTargetOp)}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${getPerformanceThreshold(computedTotals.weeklyOpAchievementPct).bgClass}`}
                style={{ width: `${Math.min(100, Math.max(0, computedTotals.weeklyOpAchievementPct))}%` }}
              />
            </div>
          </div>

          {/* Weekly SR Target */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase">Weekly SR Target</span>
              <span className={`font-bold ${getPerformanceThreshold(computedTotals.weeklySrAchievementPct).textClass}`}>
                {formatPercent(computedTotals.weeklySrAchievementPct)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-slate-900">{formatINR(currentSheet.targets.weeklyAchievedSr)}</span>
              <span className="text-xs text-slate-400">of {formatINR(currentSheet.targets.weeklyTargetSr)}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${getPerformanceThreshold(computedTotals.weeklySrAchievementPct).bgClass}`}
                style={{ width: `${Math.min(100, Math.max(0, computedTotals.weeklySrAchievementPct))}%` }}
              />
            </div>
          </div>

          {/* Monthly OP Target */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase">Monthly OP Target</span>
              <span className={`font-bold ${getPerformanceThreshold(computedTotals.monthlyOpAchievementPct).textClass}`}>
                {formatPercent(computedTotals.monthlyOpAchievementPct)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-slate-900">{formatINR(currentSheet.targets.monthlyAchievedOp)}</span>
              <span className="text-xs text-slate-400">of {formatINR(currentSheet.targets.monthlyTargetOp)}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${getPerformanceThreshold(computedTotals.monthlyOpAchievementPct).bgClass}`}
                style={{ width: `${Math.min(100, Math.max(0, computedTotals.monthlyOpAchievementPct))}%` }}
              />
            </div>
          </div>

          {/* Monthly SR Target */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold uppercase">Monthly SR Target</span>
              <span className={`font-bold ${getPerformanceThreshold(computedTotals.monthlySrAchievementPct).textClass}`}>
                {formatPercent(computedTotals.monthlySrAchievementPct)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-slate-900">{formatINR(currentSheet.targets.monthlyAchievedSr)}</span>
              <span className="text-xs text-slate-400">of {formatINR(currentSheet.targets.monthlyTargetSr)}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${getPerformanceThreshold(computedTotals.monthlySrAchievementPct).bgClass}`}
                style={{ width: `${Math.min(100, Math.max(0, computedTotals.monthlySrAchievementPct))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 8: Other Sales Channels */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-other-channels" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">8</span>
              <h2 className="text-base font-bold text-slate-900">Other Sales Channels</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Renewal Sales, Google Ads inbound, BNI referrals, and App referrals
            </p>
          </div>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            Avg Channel Achievement:{' '}
            <strong className={getPerformanceThreshold(computedTotals.otherSalesAvgPct).textClass}>
              {formatPercent(computedTotals.otherSalesAvgPct)}
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 min-w-[180px]">Sales Channel</th>
                <th className="py-3 px-3 text-right w-36">Target (₹)</th>
                <th className="py-3 px-3 text-right w-36">Achieved (₹)</th>
                <th className="py-3 px-3 text-center font-bold bg-teal-50/60 text-teal-900 w-28">Achieve %</th>
                <th className="py-3 px-3 min-w-[200px]">Remarks</th>
                {!isReadOnly && <th className="py-3 px-2 text-center w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {otherChannels.map((row) => {
                const achievePct = row.target > 0 ? safeDivision(row.achieved, row.target) : 0;
                const threshold = getPerformanceThreshold(achievePct);

                return (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{row.channel}</td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.target}
                        onChange={(e) => updateOtherSalesChannel(row.id, { target: parseFloat(e.target.value) || 0 })}
                        className="w-32 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={row.achieved}
                        onChange={(e) => updateOtherSalesChannel(row.id, { achieved: parseFloat(e.target.value) || 0 })}
                        className="w-32 text-right bg-teal-50/60 border border-teal-200 rounded px-2 py-1 font-bold text-teal-900"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${threshold.badgeClass}`}>
                        {formatPercent(achievePct)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={row.remarks}
                        onChange={(e) => updateOtherSalesChannel(row.id, { remarks: e.target.value })}
                        placeholder="Channel notes..."
                        className="w-full bg-transparent border-b border-dashed border-slate-300 text-xs text-slate-700 py-0.5"
                      />
                    </td>
                    {!isReadOnly && (
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => deleteOtherSalesChannel(row.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Channel */}
        {!isReadOnly && (
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="Channel Name"
              value={newChannel.channel}
              onChange={(e) => setNewChannel({ ...newChannel, channel: e.target.value })}
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Target (₹)"
              value={newChannel.target}
              onChange={(e) => setNewChannel({ ...newChannel, target: parseFloat(e.target.value) || 0 })}
              className="w-28 text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-right"
            />
            <input
              type="number"
              placeholder="Achieved (₹)"
              value={newChannel.achieved}
              onChange={(e) => setNewChannel({ ...newChannel, achieved: parseFloat(e.target.value) || 0 })}
              className="w-28 text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-right"
            />
            <button
              onClick={() => {
                if (newChannel.channel.trim()) {
                  addOtherSalesChannel(newChannel.channel.trim(), newChannel.target, newChannel.achieved, newChannel.remarks);
                  setNewChannel({ channel: '', target: 100000, achieved: 0, remarks: '' });
                }
              }}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Channel
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 9 & 10: Vendor Registration Numbers & Recognition */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 9: Vendor Registration Numbers */}
        <div id="commercial-section-vendor-numbers" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">9</span>
            <h2 className="text-base font-bold text-slate-900">Vendor Registration Numbers</h2>
          </div>

          <div className="space-y-3">
            {vendorMetrics.map((row) => (
              <div key={row.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-800">{row.metric}</p>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={row.remarks || ''}
                    onChange={(e) => updateVendorRegistrationMetric(row.id, row.count, e.target.value)}
                    placeholder="Remarks / client names..."
                    className="w-full mt-1 text-[11px] bg-transparent border-b border-dashed border-slate-300 text-slate-600 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    disabled={isReadOnly}
                    value={row.count}
                    onChange={(e) => updateVendorRegistrationMetric(row.id, parseInt(e.target.value) || 0, row.remarks)}
                    className="w-16 text-center text-sm font-bold bg-white border border-slate-200 rounded-lg py-1 text-teal-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 10: Recognition */}
        <div id="commercial-section-recognition" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">10</span>
            <h2 className="text-base font-bold text-slate-900">Team Recognition</h2>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold mb-1">
                <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                Top Performer - SPR (Sales Field / Lead)
              </div>
              <input
                type="text"
                disabled={isReadOnly}
                value={recognition.topPerformerSpr.name}
                onChange={(e) => updateRecognition('topPerformerSpr', { name: e.target.value })}
                placeholder="Name of top sales performer..."
                className="w-full text-xs font-semibold bg-white border border-amber-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
              />
              <input
                type="text"
                disabled={isReadOnly}
                value={recognition.topPerformerSpr.remarks || ''}
                onChange={(e) => updateRecognition('topPerformerSpr', { name: recognition.topPerformerSpr.name, remarks: e.target.value })}
                placeholder="Reason / achievements..."
                className="w-full mt-1.5 text-[11px] bg-transparent border-b border-dashed border-amber-300 text-slate-600 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800 text-xs font-bold mb-1">
                <Award className="w-4 h-4 text-blue-600" />
                Top Performer - OFC (Operations & Compliance)
              </div>
              <input
                type="text"
                disabled={isReadOnly}
                value={recognition.topPerformerOfc.name}
                onChange={(e) => updateRecognition('topPerformerOfc', { name: e.target.value })}
                placeholder="Name of top office performer..."
                className="w-full text-xs font-semibold bg-white border border-blue-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
              />
              <input
                type="text"
                disabled={isReadOnly}
                value={recognition.topPerformerOfc.remarks || ''}
                onChange={(e) => updateRecognition('topPerformerOfc', { name: recognition.topPerformerOfc.name, remarks: e.target.value })}
                placeholder="Reason / achievements..."
                className="w-full mt-1.5 text-[11px] bg-transparent border-b border-dashed border-blue-300 text-slate-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 11: Client Feedback & Testimonials */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-client-feedback" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">11</span>
          <h2 className="text-base font-bold text-slate-900">Client Feedback & Video Testimonials</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-semibold text-slate-700 block mb-1">Featured Client Testimonial</label>
            <textarea
              disabled={isReadOnly}
              value={currentSheet.clientFeedback.testimonial}
              onChange={(e) => updateClientFeedback({ testimonial: e.target.value })}
              rows={3}
              placeholder="Enter client praise or review..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-[11px] text-slate-500">Client / Company Name</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={currentSheet.clientFeedback.clientName}
                  onChange={(e) => updateClientFeedback({ clientName: e.target.value })}
                  placeholder="e.g. VP Operations (Sunrise Foods)"
                  className="w-full mt-1 text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Satisfaction Rating (1 - 5 Stars)</label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={isReadOnly}
                      onClick={() => updateClientFeedback({ rating: star })}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= currentSheet.clientFeedback.rating ? 'fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase mb-2">
                <Video className="w-4 h-4 text-teal-600" />
                Reviews & Video Proofs
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Google B2B Reviews:</span>
                    <input
                      type="number"
                      min="0"
                      disabled={isReadOnly}
                      value={currentSheet.clientFeedback.clientReviewsCount || 0}
                      onChange={(e) => updateClientFeedback({ clientReviewsCount: parseInt(e.target.value) || 0 })}
                      className="w-16 text-center font-bold bg-white border border-slate-200 rounded py-0.5 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Video Testimonials:</span>
                    <input
                      type="number"
                      min="0"
                      disabled={isReadOnly}
                      value={currentSheet.clientFeedback.videoTestimonialsCount || 0}
                      onChange={(e) => updateClientFeedback({ videoTestimonialsCount: parseInt(e.target.value) || 0 })}
                      className="w-16 text-center font-bold bg-white border border-slate-200 rounded py-0.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              {currentSheet.clientFeedback.videoTestimonialsDetails || 'Recorded B2B client video case studies'}
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 12 & 13: Achievements & Stuck Points */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 12: Key Achievements */}
        <div id="commercial-section-achievements" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">12</span>
            <h2 className="text-base font-bold text-slate-900">Key Achievements</h2>
          </div>

          <div className="space-y-2">
            {currentSheet.achievements.map((ach) => (
              <div key={ach.id} className="flex items-start gap-2 p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={ach.text}
                  onChange={(e) => updateAchievement(ach.id, e.target.value)}
                  className="flex-1 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                />
                {!isReadOnly && (
                  <button onClick={() => deleteAchievement(ach.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {!isReadOnly && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Add new achievement..."
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (newAchievement.trim()) {
                      addAchievement(newAchievement.trim());
                      setNewAchievement('');
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 13: Stuck Points & Roadblocks */}
        <div id="commercial-section-stuck" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">13</span>
            <h2 className="text-base font-bold text-slate-900">Stuck Points / Roadblocks & Action Plan</h2>
          </div>

          <div className="space-y-3">
            {currentSheet.stuckPoints.map((item) => (
              <div key={item.id} className="p-3 bg-red-50/40 rounded-xl border border-red-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-800">{item.stuckPoint}</span>
                  {!isReadOnly && (
                    <button onClick={() => deleteStuckPoint(item.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Reason</span>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={item.reason}
                    onChange={(e) => updateStuckPoint(item.id, { reason: e.target.value })}
                    className="w-full text-xs bg-transparent border-b border-dashed border-red-200 text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-emerald-600 block uppercase">CTA / Action Plan</span>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={item.cta}
                    onChange={(e) => updateStuckPoint(item.id, { cta: e.target.value })}
                    className="w-full text-xs bg-transparent border-b border-dashed border-emerald-200 text-slate-700 focus:outline-none"
                  />
                </div>
              </div>
            ))}

            {!isReadOnly && (
              <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                <input
                  type="text"
                  placeholder="Stuck Point Title (e.g. Stuck #4: Onboarding delay)"
                  value={newStuck.stuckPoint}
                  onChange={(e) => setNewStuck({ ...newStuck, stuckPoint: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Reason"
                    value={newStuck.reason}
                    onChange={(e) => setNewStuck({ ...newStuck, reason: e.target.value })}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Actionable CTA"
                    value={newStuck.cta}
                    onChange={(e) => setNewStuck({ ...newStuck, cta: e.target.value })}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (newStuck.stuckPoint.trim()) {
                        addStuckPoint({
                          stuckPoint: newStuck.stuckPoint.trim(),
                          reason: newStuck.reason.trim(),
                          cta: newStuck.cta.trim()
                        });
                        setNewStuck({ stuckPoint: '', reason: '', cta: '' });
                      }
                    }}
                    className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold shrink-0"
                  >
                    Add Stuck Point
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 14: Learning & Improvement */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-learning" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">14</span>
          <h2 className="text-base font-bold text-slate-900">Learning & Continuous Improvement</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-semibold text-teal-800 block mb-1">New Implemented This Week</label>
            <textarea
              disabled={isReadOnly}
              value={currentSheet.learningImprovement.newImplemented}
              onChange={(e) => updateLearningImprovement({ newImplemented: e.target.value })}
              rows={3}
              placeholder="Workflows or tools introduced..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-semibold text-teal-800 block mb-1">Bottlenecks & Requirements (Anything Else)</label>
            <textarea
              disabled={isReadOnly}
              value={currentSheet.learningImprovement.anythingElse}
              onChange={(e) => updateLearningImprovement({ anythingElse: e.target.value })}
              rows={3}
              placeholder="Infrastructure or tool support required..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-semibold text-teal-800 block mb-1">New This Week / Strategy</label>
            <textarea
              disabled={isReadOnly}
              value={currentSheet.learningImprovement.thisWeekNotes || ''}
              onChange={(e) => updateLearningImprovement({ thisWeekNotes: e.target.value })}
              rows={3}
              placeholder="Strategic B2B initiatives..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 15: Weekly Executive Summary & Performance Score */}
      {/* ------------------------------------------------------------- */}
      <div id="commercial-section-summary" className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-teal-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-500 text-teal-950 text-xs font-bold flex items-center justify-center">15</span>
              <h2 className="text-lg font-bold">Weekly Performance Executive Summary</h2>
            </div>
            <p className="text-xs text-teal-200/80 mt-1">
              Performance metrics for {currentSheet.attendance.name || member.name} &bull; Cycle: {currentSheet.cycleLabel}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10">
              <span className="text-[10px] text-teal-200 uppercase block">Daily Task Avg</span>
              <strong className="text-lg font-bold text-teal-300">
                {formatPercent(computedTotals.dailyCommercialAvgPct)}
              </strong>
            </div>

            <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10">
              <span className="text-[10px] text-teal-200 uppercase block">Weekly Task Avg</span>
              <strong className="text-lg font-bold text-teal-300">
                {formatPercent(computedTotals.commercialWeeklyAvgPct)}
              </strong>
            </div>

            <div className="text-center px-5 py-2.5 bg-teal-500 text-slate-950 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider block">Performance Score</span>
              <strong className="text-2xl font-black">{formatPercent(computedTotals.overallPerformancePct)}</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-teal-200 uppercase">Reviewer Analysis & Notes</label>
            <textarea
              disabled={userRole !== 'admin'}
              value={currentSheet.weeklySummary.analysis}
              onChange={(e) => updateWeeklySummary({ analysis: e.target.value })}
              rows={3}
              placeholder={userRole === 'admin' ? 'Enter leadership review and evaluation notes...' : 'Awaiting reviewer feedback...'}
              className="w-full bg-white/5 border border-teal-700/50 rounded-xl p-3 text-xs text-teal-100 placeholder-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-teal-800/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-teal-200 uppercase block mb-2">Review & Sign-Off</span>
              <p className="text-xs text-teal-100/90 font-medium">
                Reviewed By: {currentSheet.weeklySummary.reviewedBy || 'Rajiv Sharma (Managing Director)'}
              </p>
              <p className="text-[11px] text-teal-300/70 mt-0.5">
                Date: {currentSheet.weeklySummary.reviewDate || new Date().toISOString().split('T')[0]}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-teal-800/60 flex items-center justify-between text-xs">
              <span className="text-teal-300/80">Approval Status</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${
                  currentSheet.status === 'approved'
                    ? 'bg-emerald-400 text-emerald-950'
                    : currentSheet.status === 'submitted'
                    ? 'bg-blue-400 text-blue-950'
                    : 'bg-amber-400 text-amber-950'
                }`}
              >
                {currentSheet.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
