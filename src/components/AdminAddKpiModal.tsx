import React, { useState } from 'react';
import { Plus, X, Layers, Target, CheckSquare, Sparkles } from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';

interface AdminAddKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSection?: string;
}

export const AdminAddKpiModal: React.FC<AdminAddKpiModalProps> = ({
  isOpen,
  onClose,
  defaultSection = 'daily_task'
}) => {
  const {
    member,
    currentSheet,
    addDailyCallingMetric,
    addDailyTenderOp,
    addDailySalesTenderTask,
    addTenderPipelineRow,
    addDailyCommercialTask,
    addCommercialWeeklyTask,
    addWeeklyTask
  } = usePestCure();

  const isTender = currentSheet.sheetType === 'tender_operations' || currentSheet.dailyTenderOperations !== undefined;
  const isCommercial = currentSheet.sheetType === 'commercial_bd' || currentSheet.dailyCommercialTasks !== undefined;

  const [targetType, setTargetType] = useState<string>(
    isTender ? 'tender_op' : isCommercial ? 'commercial_daily' : 'cc_calling'
  );
  const [taskName, setTaskName] = useState('');
  const [targetValue, setTargetValue] = useState('10');
  const [category, setCategory] = useState('Operations & Follow-ups');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const numTarget = Number(targetValue) || 1;

    if (targetType === 'cc_calling') {
      addDailyCallingMetric(taskName.trim(), numTarget, category || 'Customer Care');
    } else if (targetType === 'tender_op') {
      addDailyTenderOp(taskName.trim(), numTarget);
    } else if (targetType === 'tender_sales') {
      addDailySalesTenderTask(taskName.trim(), numTarget);
    } else if (targetType === 'tender_pipeline') {
      addTenderPipelineRow(taskName.trim(), numTarget, 0);
    } else if (targetType === 'commercial_daily') {
      addDailyCommercialTask(taskName.trim(), numTarget);
    } else if (targetType === 'commercial_weekly') {
      addCommercialWeeklyTask({
        taskName: taskName.trim(),
        target: numTarget,
        actual: 0,
        remarks: ''
      });
    } else {
      addWeeklyTask({
        kraGoal: category || 'Weekly KRA Goal',
        keyTask: taskName.trim(),
        allocatedWeek: currentSheet.cycleLabel,
        deadlineDate: 'End of week',
        status: 'In Progress',
        pctDone: 0,
        remarks: 'Admin Assigned Task'
      });
    }

    setTaskName('');
    onClose();
  };

  return (
    <div
      id="admin-add-kpi-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="admin-add-kpi-modal-container"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden text-stone-900"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-amber-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#ea580c] text-white shadow-xs">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 leading-snug">
                Admin: Add New KPI / Task
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                Target Sheet: <strong className="text-stone-900">{member.name}</strong> ({member.department})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
              Select KPI / Tracker Section *
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all cursor-pointer"
            >
              {isTender && (
                <>
                  <option value="tender_op" className="text-stone-900">
                    Daily Tender Operations (Formula =(SUM/Target*6)*100)
                  </option>
                  <option value="tender_sales" className="text-stone-900">
                    Daily Sales Tender Tasks
                  </option>
                  <option value="tender_pipeline" className="text-stone-900">
                    Pipeline / Bid Stage Tracking Row
                  </option>
                  <option value="weekly_kra" className="text-stone-900">
                    Weekly KRA Goal / Task
                  </option>
                </>
              )}
              {isCommercial && (
                <>
                  <option value="commercial_daily" className="text-stone-900">
                    Commercial Daily BD Ops (Formula =(SUM/Target*6)*100)
                  </option>
                  <option value="commercial_weekly" className="text-stone-900">
                    Commercial Weekly Tasks / Audits
                  </option>
                  <option value="weekly_kra" className="text-stone-900">
                    Weekly KRA Goal / Task
                  </option>
                </>
              )}
              {!isTender && !isCommercial && (
                <>
                  <option value="cc_calling" className="text-stone-900">
                    Daily Telecalling &amp; Retention Calling Metric
                  </option>
                  <option value="weekly_kra" className="text-stone-900">
                    Weekly KRA Goal / Target Task
                  </option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
              Task or KPI Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. GeM Bid Submission, Quotation Follow-up, Site Pic..."
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                Target (Per Day / Week) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                Category / Section Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Operations, Bidding, Client"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This KPI will be instantly added to <strong>{member.name}</strong>&rsquo;s live sheet and recalculated across formulas in real-time.
            </span>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create KPI Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
