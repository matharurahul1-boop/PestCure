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
  FileCheck,
  TrendingUp,
  MapPin,
  MessageSquare,
  Award,
  HelpCircle,
  Lightbulb,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Search,
  Layers
} from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';
import {
  getPerformanceThreshold,
  formatINR,
  formatPercent,
  safeDivision
} from '../utils/colorThreshold';
import { computeDayEntryState } from '../utils/dayFreezeHelper';
import { ColorThresholdLegend } from './ColorThresholdLegend';
import { TopMainKpiHero } from './TopMainKpiHero';
import { AdminAddKpiModal } from './AdminAddKpiModal';

interface KajalReviewSheetProps {
  onOpenNewUserModal?: () => void;
}

export const KajalReviewSheet: React.FC<KajalReviewSheetProps> = ({ onOpenNewUserModal }) => {
  const {
    member,
    userRole,
    currentSheet,
    lockedDaysMap,
    updateAttendance,
    updateDailyTenderOpDay,
    updateDailyTenderOpTarget,
    updateDailyTenderOpRemarks,
    addDailyTenderOp,
    deleteDailyTenderOp,
    updateTenderWeeklyKRA,
    updateServiceFeedbackSite,
    addServiceFeedbackSite,
    deleteServiceFeedbackSite,
    updateSitePicSite,
    addSitePicSite,
    deleteSitePicSite,
    updateExtensionSite,
    addExtensionSite,
    deleteExtensionSite,
    updateNewAssociateLocation,
    addNewAssociateLocation,
    deleteNewAssociateLocation,
    updateTenderPipeline,
    addTenderPipelineRow,
    deleteTenderPipelineRow,
    updateBidStageCompliance,
    updateDailySalesTenderDay,
    updateDailySalesTenderTarget,
    addDailySalesTenderTask,
    deleteDailySalesTenderTask,
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

  const [newOpTaskName, setNewOpTaskName] = useState('');
  const [newOpTarget, setNewOpTarget] = useState(5);
  const [showAddOpModal, setShowAddOpModal] = useState(false);
  const [isAddKpiModalOpen, setIsAddKpiModalOpen] = useState(false);

  const dailyOps = currentSheet.dailyTenderOperations || [];
  const kra = currentSheet.tenderWeeklyKRA || {
    fortnightlyPaymentCalling: { status: 'Completed', remarks: '' },
    serviceFeedbacks: [],
    sitePics: [],
    extensionAtTenderSites: [],
    newAssociatesSearch: []
  };
  const pipeline = currentSheet.tenderPipeline || [];
  const bidCompliance = currentSheet.bidStageCompliance || [];
  const dailySales = currentSheet.dailySalesTenderTasks || [];

  // Helper for sum of days
  const sumDailyOpDays = (days: { mon?: number; tue?: number; wed?: number; thu?: number; fri?: number; sat?: number; sun?: number }) => {
    return (days.mon || 0) + (days.tue || 0) + (days.wed || 0) + (days.thu || 0) + (days.fri || 0) + (days.sat || 0) + (days.sun || 0);
  };

  const sumSalesDays = (days: { tue?: number; wed?: number; thu?: number; fri?: number; sat?: number; sun?: number; mon?: number }) => {
    return (days.tue || 0) + (days.wed || 0) + (days.thu || 0) + (days.fri || 0) + (days.sat || 0) + (days.sun || 0) + (days.mon || 0);
  };

  // Section 8: Target achievement percentage formulas
  // =100*(C57/C56), =100*(D57/D56), =100*(G57/G56), =100*(H57/H56)
  const monthlyOpPct = computedTotals.monthlyOpAchievementPct;
  const monthlySrPct = computedTotals.monthlySrAchievementPct;
  const weeklyOpPct = computedTotals.weeklyOpAchievementPct;
  const weeklySrPct = computedTotals.weeklySrAchievementPct;

  const monthlyOpThresh = getPerformanceThreshold(monthlyOpPct);
  const monthlySrThresh = getPerformanceThreshold(monthlySrPct);
  const weeklyOpThresh = getPerformanceThreshold(weeklyOpPct);
  const weeklySrThresh = getPerformanceThreshold(weeklySrPct);

  // Sales totals for Section 7
  const totalSalesTargetPerDay = dailySales.reduce((sum, r) => sum + (Number(r.targetPerDay) || 0), 0);
  const totalSalesTarget6Days = totalSalesTargetPerDay * 6;
  const totalSalesTue = dailySales.reduce((sum, r) => sum + (Number(r.days.tue) || 0), 0);
  const totalSalesWed = dailySales.reduce((sum, r) => sum + (Number(r.days.wed) || 0), 0);
  const totalSalesThu = dailySales.reduce((sum, r) => sum + (Number(r.days.thu) || 0), 0);
  const totalSalesFri = dailySales.reduce((sum, r) => sum + (Number(r.days.fri) || 0), 0);
  const totalSalesSat = dailySales.reduce((sum, r) => sum + (Number(r.days.sat) || 0), 0);
  const totalSalesSun = dailySales.reduce((sum, r) => sum + (Number(r.days.sun) || 0), 0);
  const totalSalesMon = dailySales.reduce((sum, r) => sum + (Number(r.days.mon) || 0), 0);
  const grandSalesSum = totalSalesTue + totalSalesWed + totalSalesThu + totalSalesFri + totalSalesSat + totalSalesSun + totalSalesMon;
  const totalSalesWeeklyPct = safeDivision(grandSalesSum, totalSalesTarget6Days);
  const totalSalesThresh = getPerformanceThreshold(totalSalesWeeklyPct);

  const statusOptions = ['Pending', 'In Progress', 'Completed', 'Delayed', 'Under Review'];

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      
      {/* Top Banner with cycle info & status */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200/60">
              Tender Operations
            </span>
            <span className="text-xs text-slate-500">
              Review Cycle: <strong className="text-slate-800">{currentSheet.cycleLabel}</strong>
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 mt-1">
            Kajal Gaur &bull; <span className="text-slate-500 font-normal">Tender &amp; Bidding Operations</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-mono-code bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {currentSheet.status.toUpperCase()}
          </span>
          {userRole === 'member' && currentSheet.status === 'draft' && (
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

      {/* TOP MAIN DATA HERO CARDS (Prominent cards with large bold numbers) */}
      <TopMainKpiHero
        onOpenAddKpi={() => setIsAddKpiModalOpen(true)}
        onOpenNewUserModal={onOpenNewUserModal}
      />

      {/* Admin KPI Creation Modal */}
      <AdminAddKpiModal
        isOpen={isAddKpiModalOpen}
        onClose={() => setIsAddKpiModalOpen(false)}
      />

      {/* 1. EMPLOYEE & ATTENDANCE DETAILS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
            1. Employee & Attendance Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Employee & Role</span>
            <span className="font-bold text-slate-900 text-xs block mt-0.5">{currentSheet.attendance.name}</span>
            <span className="text-[11px] text-slate-500">{currentSheet.attendance.role || 'Tender Executive'}</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Department</span>
            <span className="font-bold text-slate-900 text-xs block mt-0.5">{currentSheet.attendance.team || 'Tender & Bidding'}</span>
            <span className="text-[11px] text-emerald-600 font-medium">Government & GeM Tenders</span>
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
                  value={currentSheet.attendance.shHd}
                  onChange={(e) => updateAttendance({ shHd: parseInt(e.target.value) || 0 })}
                  className="w-full font-mono-code font-bold text-slate-900 bg-white border border-slate-200 rounded px-1 py-0.5 text-center text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DAILY TENDER OPERATIONS — reviewed each working day, summarized weekly */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
                2. Daily Tender Operations — Reviewed Each Working Day
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Daily quota execution tracking for search, preparation, and tender filing
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddOpModal(!showAddOpModal)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>{showAddOpModal ? 'Close' : '+ Add KPI'}</span>
          </button>
        </div>

        {/* Direct Inline KPI Creator for Section 2 */}
        {showAddOpModal && (
          <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in duration-150">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                Tender KPI / Task Title
              </label>
              <input
                type="text"
                required
                value={newOpTaskName}
                onChange={(e) => setNewOpTaskName(e.target.value)}
                placeholder="e.g. GeM Direct Purchase Inquiries, Defense Tender Scrutiny..."
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
                value={newOpTarget}
                onChange={(e) => setNewOpTarget(parseInt(e.target.value) || 1)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono-code"
              />
            </div>
            <div className="flex items-end gap-2 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={() => {
                  if (newOpTaskName.trim()) {
                    addDailyTenderOp(newOpTaskName.trim(), newOpTarget);
                    setNewOpTaskName('');
                    setShowAddOpModal(false);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Save KPI
              </button>
              <button
                type="button"
                onClick={() => setShowAddOpModal(false)}
                className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 rounded-tl-xl">Task</th>
                <th className="py-2.5 px-2 text-center">Target / Day</th>
                <th className="py-2.5 px-2 text-center">Mon</th>
                <th className="py-2.5 px-2 text-center">Tue</th>
                <th className="py-2.5 px-2 text-center">Wed</th>
                <th className="py-2.5 px-2 text-center">Thu</th>
                <th className="py-2.5 px-2 text-center">Fri</th>
                <th className="py-2.5 px-2 text-center">Sat</th>
                <th className="py-2.5 px-2 text-center">Sun</th>
                <th className="py-2.5 px-3 text-center">Weekly %</th>
                <th className="py-2.5 px-3">Remarks</th>
                <th className="py-2.5 px-2 text-center rounded-tr-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyOps.map((op, idx) => {
                const daySum = sumDailyOpDays(op.days);
                const target6Days = (op.targetPerDay || 1) * 6;
                const weeklyPct = safeDivision(daySum, target6Days);
                const thresh = getPerformanceThreshold(weeklyPct);

                return (
                  <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[200px]">
                      {op.task}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="1"
                        disabled={userRole === 'member'}
                        value={op.targetPerDay}
                        onChange={(e) => updateDailyTenderOpTarget(op.id, parseInt(e.target.value) || 0)}
                        className="w-14 text-center font-mono-code font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1 py-1 disabled:text-slate-500"
                      />
                    </td>
                    {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => {
                      const isSun = day === 'sun';
                      const val = op.days[day] ?? 0;
                      const lockKey = `${currentSheet.id}_${op.id}_${day}`;
                      const isLocked = Boolean(lockedDaysMap[lockKey] || lockedDaysMap[`${currentSheet.id}_${day}`]);
                      const dayState = computeDayEntryState(day, val, isLocked, false, userRole);
                      const inputDisabled = isSun || !dayState.isEditable;

                      return (
                        <td key={day} className={`py-2 px-1.5 text-center ${isSun ? 'bg-slate-50/40 text-slate-400' : ''}`}>
                          <input
                            type="number"
                            min="0"
                            disabled={inputDisabled}
                            value={val === 0 && (dayState.state === 'today_active' || userRole === 'admin') ? '' : val}
                            placeholder="0"
                            title={dayState.statusLabel}
                            onChange={(e) => updateDailyTenderOpDay(op.id, day, parseInt(e.target.value) || 0)}
                            className={`w-11 text-center font-mono-code rounded-lg py-1 text-xs font-semibold transition-all ${
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
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg border font-mono-code text-xs font-bold ${thresh.badgeClass}`}>
                        {formatPercent(weeklyPct)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={op.remarks}
                        onChange={(e) => updateDailyTenderOpRemarks(op.id, e.target.value)}
                        placeholder="Remarks..."
                        className="w-full text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {dailyOps.length > 1 && (
                        <button
                          onClick={() => deleteDailyTenderOp(op.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Quick Add Row at bottom of table */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAddOpModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 px-2 py-1 rounded hover:bg-orange-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add new Tender KPI row to this table</span>
          </button>
          <span className="text-[11px] text-slate-400 font-mono-code">Formula: =(SUM / (Target &times; 6)) &times; 100</span>
        </div>
      </div>

      {/* 3. WEEKLY TASKS / KRA TRACKER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <FileCheck className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
            3. Weekly Tasks / KRA Tracker
          </h2>
        </div>

        {/* Payment Calling Fortnightly Row */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 text-xs items-center">
          <div className="font-mono-code font-bold text-slate-500">
            Occurrence: <span className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">Fortnightly</span>
          </div>
          <div className="font-bold text-slate-900">
            Payment Calling – Scanning
          </div>
          <div>
            <select
              value={kra.fortnightlyPaymentCalling.status}
              onChange={(e) => updateTenderWeeklyKRA({
                fortnightlyPaymentCalling: { ...kra.fortnightlyPaymentCalling, status: e.target.value }
              })}
              className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="text"
              value={kra.fortnightlyPaymentCalling.remarks}
              onChange={(e) => updateTenderWeeklyKRA({
                fortnightlyPaymentCalling: { ...kra.fortnightlyPaymentCalling, remarks: e.target.value }
              })}
              placeholder="Remarks..."
              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Multi-site Feedbacks & Site Pics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Occurrence</th>
                <th className="py-2.5 px-3 min-w-[200px]">Task</th>
                {[1, 2, 3, 4].map((idx) => (
                  <React.Fragment key={idx}>
                    <th className="py-2.5 px-2 text-center bg-slate-50 border-l border-slate-200">Status</th>
                    <th className="py-2.5 px-2 text-center bg-slate-50">Site {idx}</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Row 1: Service Feedbacks from Tender Clients */}
              <tr>
                <td className="py-2.5 px-3 font-mono-code text-slate-600 font-semibold bg-slate-50/50">Monthly</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">Service Feedbacks from Tender Clients</td>
                {kra.serviceFeedbacks.map((item, idx) => (
                  <React.Fragment key={item.id || idx}>
                    <td className="py-2 px-1.5 border-l border-slate-200">
                      <select
                        value={item.status}
                        onChange={(e) => updateServiceFeedbackSite(idx, { status: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1 text-[11px]"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-1.5">
                      <input
                        type="text"
                        value={item.site}
                        onChange={(e) => updateServiceFeedbackSite(idx, { site: e.target.value })}
                        placeholder={`Site ${idx + 1}`}
                        className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-semibold text-slate-800"
                      />
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              {/* Row 2: Site Pics */}
              <tr>
                <td className="py-2.5 px-3 font-mono-code text-slate-600 font-semibold bg-slate-50/50">Monthly</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">Site Pics</td>
                {kra.sitePics.map((item, idx) => (
                  <React.Fragment key={item.id || idx}>
                    <td className="py-2 px-1.5 border-l border-slate-200">
                      <select
                        value={item.status}
                        onChange={(e) => updateSitePicSite(idx, { status: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1 text-[11px]"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-1.5">
                      <input
                        type="text"
                        value={item.site}
                        onChange={(e) => updateSitePicSite(idx, { site: e.target.value })}
                        placeholder={`Site ${idx + 1}`}
                        className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-semibold text-slate-800"
                      />
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              {/* Row 3: Extension at Tender Sites */}
              <tr>
                <td className="py-2.5 px-3 font-mono-code text-slate-600 font-semibold bg-slate-50/50">As & When</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">Extension at Tender Sites</td>
                {kra.extensionAtTenderSites.map((item, idx) => (
                  <React.Fragment key={item.id || idx}>
                    <td className="py-2 px-1.5 border-l border-slate-200">
                      <select
                        value={item.status}
                        onChange={(e) => updateExtensionSite(idx, { status: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1 text-[11px]"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-1.5">
                      <input
                        type="text"
                        value={item.site}
                        onChange={(e) => updateExtensionSite(idx, { site: e.target.value })}
                        placeholder={`Site ${idx + 1}`}
                        className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-semibold text-slate-800"
                      />
                    </td>
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Multi-state Associates Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2 px-3 w-28">Occurrence</th>
                <th className="py-2 px-3 min-w-[220px]">Task</th>
                {[1, 2, 3, 4].map((idx) => (
                  <th key={idx} className="py-2 px-2 text-center bg-slate-50 border-l border-slate-200">
                    State / City {idx}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2.5 px-3 font-mono-code text-slate-600 font-semibold bg-slate-50/50">Monthly</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">Search New Associates & Register at PestCure</td>
                {kra.newAssociatesSearch.map((loc, idx) => (
                  <td key={loc.id || idx} className="py-2 px-2 border-l border-slate-200">
                    <input
                      type="text"
                      value={loc.stateCity}
                      onChange={(e) => updateNewAssociateLocation(idx, e.target.value)}
                      placeholder="e.g. Jaipur, RJ"
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold text-slate-800"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. TENDER PIPELINE & BID PERFORMANCE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
              4. Tender Pipeline & Bid Performance
            </h2>
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Conversion performance against target benchmarks
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 rounded-tl-xl">Metric</th>
                <th className="py-2.5 px-3 text-center">Target</th>
                <th className="py-2.5 px-3 text-center">Actual</th>
                <th className="py-2.5 px-3 text-center">Achieved %</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 rounded-tr-xl">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pipeline.map((p) => {
                const achievedPct = safeDivision(p.actual, p.target);
                const thresh = getPerformanceThreshold(achievedPct);
                const isAmount = p.metric.includes('Amount');

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {p.metric}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={p.target}
                        onChange={(e) => updateTenderPipeline(p.id, { target: parseFloat(e.target.value) || 0 })}
                        className="w-24 text-center font-mono-code font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={p.actual}
                        onChange={(e) => updateTenderPipeline(p.id, { actual: parseFloat(e.target.value) || 0 })}
                        className="w-24 text-center font-mono-code font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code text-xs font-bold ${thresh.badgeClass}`}>
                        {formatPercent(achievedPct)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <select
                        value={p.status}
                        onChange={(e) => updateTenderPipeline(p.id, { status: e.target.value })}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={p.remarks}
                        onChange={(e) => updateTenderPipeline(p.id, { remarks: e.target.value })}
                        placeholder="Remarks..."
                        className="w-full text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. BID STAGE & TENDER COMPLIANCE CHECKS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
            5. Bid Stage & Tender Compliance Checks
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 rounded-tl-xl">Category</th>
                <th className="py-2.5 px-3 text-center">Bid Open</th>
                <th className="py-2.5 px-3 text-center">Final #</th>
                <th className="py-2.5 px-3 text-center">Lost #</th>
                <th className="py-2.5 px-3 text-center">Status: L1/L2/L3</th>
                <th className="py-2.5 px-3 rounded-tr-xl">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bidCompliance.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{b.category}</td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="text"
                      value={b.bidOpen}
                      onChange={(e) => updateBidStageCompliance(b.id, { bidOpen: e.target.value })}
                      className="w-20 text-center font-mono-code font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded py-1"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="text"
                      value={b.finalCount}
                      onChange={(e) => updateBidStageCompliance(b.id, { finalCount: e.target.value })}
                      className="w-20 text-center font-mono-code font-bold text-slate-900 bg-white border border-slate-200 rounded py-1"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="text"
                      value={b.lostCount}
                      onChange={(e) => updateBidStageCompliance(b.id, { lostCount: e.target.value })}
                      className="w-20 text-center font-mono-code font-bold text-slate-900 bg-white border border-slate-200 rounded py-1"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="text"
                      value={b.status}
                      onChange={(e) => updateBidStageCompliance(b.id, { status: e.target.value })}
                      className="w-20 text-center font-mono-code font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded py-1"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={b.remarks}
                      onChange={(e) => updateBidStageCompliance(b.id, { remarks: e.target.value })}
                      placeholder="Compliance notes..."
                      className="w-full text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. RUNNING ACCOUNTS — PAYMENTS CALLING */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <DollarSign className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
            6. Running Accounts — Payments Calling
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 rounded-tl-xl">Category</th>
                <th className="py-2.5 px-3 text-center"># Deals Called</th>
                <th className="py-2.5 px-3 text-right">Pending Amount</th>
                <th className="py-2.5 px-3 text-right">Amount Received this week</th>
                <th className="py-2.5 px-3 rounded-tr-xl">Remarks, if Any</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentSheet.runningAccounts.map((ra, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{ra.category}</td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={ra.dealsCalledCount}
                      onChange={(e) => updateRunningAccount(idx, { dealsCalledCount: parseInt(e.target.value) || 0 })}
                      className="w-20 text-center font-mono-code font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded py-1"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      value={ra.pendingAmount}
                      onChange={(e) => updateRunningAccount(idx, { pendingAmount: parseFloat(e.target.value) || 0 })}
                      className="w-32 text-right font-mono-code font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      value={ra.amountReceivedThisWeek}
                      onChange={(e) => updateRunningAccount(idx, { amountReceivedThisWeek: parseFloat(e.target.value) || 0 })}
                      className="w-32 text-right font-mono-code font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={ra.remarks}
                      onChange={(e) => updateRunningAccount(idx, { remarks: e.target.value })}
                      placeholder="Remarks..."
                      className="w-full text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. DAILY TASKS (reviewed each working day, summarized weekly) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
              7. Daily Tasks — Calling & Renewals for Tender Desk
            </h2>
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Follow-up & calling execution across 6-day cycle
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 rounded-tl-xl">Task</th>
                <th className="py-2.5 px-2 text-center">Target / Day</th>
                <th className="py-2.5 px-2 text-center">Tue</th>
                <th className="py-2.5 px-2 text-center">Wed</th>
                <th className="py-2.5 px-2 text-center">Thu</th>
                <th className="py-2.5 px-2 text-center">Fri</th>
                <th className="py-2.5 px-2 text-center">Sat</th>
                <th className="py-2.5 px-2 text-center">Sun</th>
                <th className="py-2.5 px-2 text-center">Mon</th>
                <th className="py-2.5 px-3 text-center rounded-tr-xl">Weekly %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailySales.map((row) => {
                const daySum = sumSalesDays(row.days);
                const target6 = (row.targetPerDay || 1) * 6;
                const weeklyPct = safeDivision(daySum, target6);
                const thresh = getPerformanceThreshold(weeklyPct);

                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.task}</td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="1"
                        disabled={userRole === 'member'}
                        value={row.targetPerDay}
                        onChange={(e) => updateDailySalesTenderTarget(row.id, parseInt(e.target.value) || 0)}
                        className="w-14 text-center font-mono-code font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1 py-1 disabled:text-slate-500"
                      />
                    </td>
                    {(['tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'mon'] as const).map((day) => {
                      const isCellLocked = userRole === 'member' && !!(
                        lockedDaysMap[`${currentSheet.id}_${row.id}_${day}`] ||
                        lockedDaysMap[`${currentSheet.id}_${day}`]
                      );
                      return (
                        <td key={day} className="py-2 px-1.5 text-center">
                          <input
                            type="number"
                            min="0"
                            disabled={isCellLocked}
                            value={row.days[day]}
                            onChange={(e) => updateDailySalesTenderDay(row.id, day, parseInt(e.target.value) || 0)}
                            className={`w-11 text-center font-mono-code rounded py-1 focus:ring-1 focus:ring-emerald-500 ${
                              isCellLocked 
                                ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed' 
                                : 'bg-white text-slate-900 border border-slate-200'
                            }`}
                            title={isCellLocked ? 'Locked after daily submission' : 'Enter daily count'}
                          />
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg border font-mono-code text-xs font-bold ${thresh.badgeClass}`}>
                        {formatPercent(weeklyPct)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL ROW */}
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
                <td className="py-3 px-3 uppercase tracking-wider font-mono-code text-emerald-400">TOTAL</td>
                <td className="py-3 px-2 text-center font-mono-code">{totalSalesTargetPerDay}</td>
                <td className="py-3 px-2 text-center font-mono-code">{totalSalesTue}</td>
                <td className="py-3 px-2 text-center font-mono-code">{totalSalesWed}</td>
                <td className="py-3 px-2 text-center font-mono-code">{totalSalesThu}</td>
                <td className="py-3 px-2 text-center font-mono-code">{totalSalesFri}</td>
                <td className="py-3 px-2 text-center font-mono-code">{totalSalesSat}</td>
                <td className="py-3 px-2 text-center font-mono-code">{totalSalesSun}</td>
                <td className="py-3 px-2 text-center font-mono-code">{totalSalesMon}</td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code text-xs font-bold ${totalSalesThresh.badgeClass}`}>
                    {formatPercent(totalSalesWeeklyPct)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. TARGETS & ACHIEVEMENT (OV) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
              8. Targets & Achievement (OV)
            </h2>
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Monthly and weekly target achievements (OP & SR)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl">
            <thead>
              <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                <th className="py-2.5 px-3 w-48">Metric Category</th>
                <th className="py-2.5 px-3 text-center bg-slate-800">OP (C)</th>
                <th className="py-2.5 px-3 text-center bg-slate-800">SR (D)</th>
                <th className="py-2.5 px-3 text-center bg-slate-900 border-l border-slate-700">Weekly OP (G)</th>
                <th className="py-2.5 px-3 text-center bg-slate-900">Weekly SR (H)</th>
                <th className="py-2.5 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Row 56: Monthly Target (OV) & Weekly Target (OV) */}
              <tr className="bg-slate-50/70">
                <td className="py-2.5 px-3 font-bold text-slate-900">
                  Target (OV) <span className="text-[10px] font-mono-code text-slate-500">(Row 56)</span>
                </td>
                <td className="py-2.5 px-3 text-center font-mono-code font-bold text-slate-800">
                  {formatINR(currentSheet.targets.monthlyTargetOp)}
                </td>
                <td className="py-2.5 px-3 text-center font-mono-code font-bold text-slate-800">
                  {formatINR(currentSheet.targets.monthlyTargetSr)}
                </td>
                <td className="py-2.5 px-3 text-center font-mono-code font-bold text-slate-800 border-l border-slate-200">
                  {formatINR(currentSheet.targets.weeklyTargetOp)}
                </td>
                <td className="py-2.5 px-3 text-center font-mono-code font-bold text-slate-800">
                  {formatINR(currentSheet.targets.weeklyTargetSr)}
                </td>
                <td className="py-2.5 px-3 text-slate-500 font-mono-code text-[11px]" rowSpan={3}>
                  {currentSheet.targets.remarks}
                </td>
              </tr>

              {/* Row 57: Monthly Achieved (OV) & Weekly Achieved (OV) */}
              <tr className="bg-white">
                <td className="py-2.5 px-3 font-bold text-slate-900">
                  Achieved (OV) <span className="text-[10px] font-mono-code text-slate-500">(Row 57)</span>
                </td>
                <td className="py-2.5 px-3 text-center font-mono-code font-bold text-emerald-700">
                  {formatINR(currentSheet.targets.monthlyAchievedOp)}
                </td>
                <td className="py-2.5 px-3 text-center font-mono-code font-bold text-emerald-700">
                  {formatINR(currentSheet.targets.monthlyAchievedSr)}
                </td>
                <td className="py-2.5 px-3 text-center font-mono-code font-bold text-emerald-700 border-l border-slate-200">
                  {formatINR(currentSheet.targets.weeklyAchievedOp)}
                </td>
                <td className="py-2.5 px-3 text-center font-mono-code font-bold text-emerald-700">
                  {formatINR(currentSheet.targets.weeklyAchievedSr)}
                </td>
              </tr>

              {/* Row 58: % Achieved (Formulas: =100*(C57/C56), =100*(D57/D56), =100*(G57/G56), =100*(H57/H56)) */}
              <tr className="bg-slate-100/80 font-bold">
                <td className="py-2.5 px-3 font-extrabold text-slate-900">
                  % Achieved <span className="text-[10px] font-mono-code text-emerald-800">(Row 58)</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code text-xs font-bold ${monthlyOpThresh.badgeClass}`}>
                    {formatPercent(monthlyOpPct)}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code text-xs font-bold ${monthlySrThresh.badgeClass}`}>
                    {formatPercent(monthlySrPct)}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center border-l border-slate-200">
                  <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code text-xs font-bold ${weeklyOpThresh.badgeClass}`}>
                    {formatPercent(weeklyOpPct)}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`inline-block px-3 py-1 rounded-lg border font-mono-code text-xs font-bold ${weeklySrThresh.badgeClass}`}>
                    {formatPercent(weeklySrPct)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. CLIENT FEEDBACK */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <MessageSquare className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
            9. Client Feedback
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Clients Reviews</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">Count:</span>
                <input
                  type="number"
                  min="0"
                  value={currentSheet.clientFeedback.clientReviewsCount || 14}
                  onChange={(e) => updateClientFeedback({ clientReviewsCount: parseInt(e.target.value) || 0 })}
                  className="w-14 font-mono-code font-bold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center"
                />
              </div>
            </div>
            <textarea
              rows={2}
              value={currentSheet.clientFeedback.clientReviewsDetails || ''}
              onChange={(e) => updateClientFeedback({ clientReviewsDetails: e.target.value })}
              placeholder="Details or links to portal reviews..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Video Testimonials</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">Count:</span>
                <input
                  type="number"
                  min="0"
                  value={currentSheet.clientFeedback.videoTestimonialsCount || 3}
                  onChange={(e) => updateClientFeedback({ videoTestimonialsCount: parseInt(e.target.value) || 0 })}
                  className="w-14 font-mono-code font-bold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center"
                />
              </div>
            </div>
            <textarea
              rows={2}
              value={currentSheet.clientFeedback.videoTestimonialsDetails || ''}
              onChange={(e) => updateClientFeedback({ videoTestimonialsDetails: e.target.value })}
              placeholder="Video testimonial links or details..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 10. ACHIEVEMENTS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
              10. Achievements
            </h2>
          </div>
          <button
            onClick={() => addAchievement('New Key Milestone Bagged')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Achievement
          </button>
        </div>

        <div className="space-y-2">
          {currentSheet.achievements.map((ach, idx) => (
            <div key={ach.id} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-mono-code font-bold text-xs">
                #{idx + 1}
              </span>
              <input
                type="text"
                value={ach.text}
                onChange={(e) => updateAchievement(ach.id, e.target.value)}
                placeholder="Describe key achievement..."
                className="flex-1 bg-transparent text-xs font-semibold text-slate-900 focus:outline-none"
              />
              {currentSheet.achievements.length > 1 && (
                <button
                  onClick={() => deleteAchievement(ach.id)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 11. STUCK POINTS / ROADBLOCKS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
              11. Stuck Points / Roadblocks
            </h2>
          </div>
          <button
            onClick={() => addStuckPoint({ stuckPoint: 'New Roadblock', reason: '', cta: '' })}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stuck Point
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 w-16 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[200px]">Stuck Point</th>
                <th className="py-2.5 px-3 min-w-[200px]">Reason</th>
                <th className="py-2.5 px-3 min-w-[200px]">CTA (Corrective Action)</th>
                <th className="py-2.5 px-2 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentSheet.stuckPoints.map((sp, idx) => (
                <tr key={sp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-center font-mono-code font-bold text-slate-600">
                    Stuck #{idx + 1}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={sp.stuckPoint}
                      onChange={(e) => updateStuckPoint(sp.id, { stuckPoint: e.target.value })}
                      className="w-full bg-transparent border-b border-slate-200 focus:border-emerald-500 focus:outline-none p-1 font-semibold text-slate-900"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={sp.reason}
                      onChange={(e) => updateStuckPoint(sp.id, { reason: e.target.value })}
                      className="w-full bg-transparent border-b border-slate-200 focus:border-emerald-500 focus:outline-none p-1 text-slate-700"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={sp.cta}
                      onChange={(e) => updateStuckPoint(sp.id, { cta: e.target.value })}
                      className="w-full bg-transparent border-b border-slate-200 focus:border-emerald-500 focus:outline-none p-1 font-semibold text-emerald-800"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => deleteStuckPoint(sp.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 12. LEARNING & IMPROVEMENT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Lightbulb className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-slate-900">
            12. Learning & Improvement
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2 px-3 w-40">Field</th>
                <th className="py-2 px-3">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3 px-3 font-bold text-slate-900 bg-slate-50/50">This Week /</td>
                <td className="py-3 px-3">
                  <textarea
                    rows={2}
                    value={currentSheet.learningImprovement.thisWeekNotes || currentSheet.learningImprovement.newImplemented}
                    onChange={(e) => updateLearningImprovement({ thisWeekNotes: e.target.value, newImplemented: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-900 focus:outline-none"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 13. WEEKLY SUMMARY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-white space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono-code uppercase font-bold tracking-widest text-white">
              13. Weekly Summary & Reviewer Sign-off
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono-code">Official Management Evaluation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg. Daily Task Completion</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={currentSheet.weeklySummary.avgDailyTaskCompletion}
                onChange={(e) => updateWeeklySummary({ avgDailyTaskCompletion: parseFloat(e.target.value) || 0 })}
                className="text-lg font-mono-code font-bold text-emerald-400 bg-transparent w-20 focus:outline-none"
              />
              <span className="text-slate-400 font-bold">%</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg. Weekly Task Achievement</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={currentSheet.weeklySummary.avgWeeklyTaskAchievement}
                onChange={(e) => updateWeeklySummary({ avgWeeklyTaskAchievement: parseFloat(e.target.value) || 0 })}
                className="text-lg font-mono-code font-bold text-emerald-400 bg-transparent w-20 focus:outline-none"
              />
              <span className="text-slate-400 font-bold">%</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reviewed by</span>
            <input
              type="text"
              value={currentSheet.weeklySummary.reviewedBy}
              onChange={(e) => updateWeeklySummary({ reviewedBy: e.target.value })}
              className="text-xs font-bold text-slate-200 bg-transparent w-full mt-1.5 focus:outline-none"
            />
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Review Date</span>
            <input
              type="date"
              value={currentSheet.weeklySummary.reviewDate}
              onChange={(e) => updateWeeklySummary({ reviewDate: e.target.value })}
              className="text-xs font-mono-code font-bold text-slate-200 bg-transparent w-full mt-1.5 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Analysis :</span>
          <textarea
            rows={3}
            value={currentSheet.weeklySummary.analysis}
            onChange={(e) => updateWeeklySummary({ analysis: e.target.value })}
            placeholder="Executive performance summary..."
            className="w-full bg-transparent text-xs text-slate-300 font-semibold focus:outline-none"
          />
        </div>
      </div>

    </div>
  );
};
