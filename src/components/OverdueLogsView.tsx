import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Send,
  Check,
  X,
  Sparkles,
  Info,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';
import { OverdueDailyEntry } from '../types';

export const OverdueLogsView: React.FC = () => {
  const {
    member,
    currentSheet,
    userRole,
    overdueDailyEntries,
    lockedDaysMap,
    submitMissedDayEntry,
    approveMissedDayEntry,
    rejectMissedDayEntry,
    batchApproveMissedDays,
    fillAndLockDayEntry,
    toggleDayLock
  } = usePestCure();

  const [dayFilter, setDayFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'unsubmitted'>('all');
  const [inputValues, setInputValues] = useState<Record<string, number>>({});
  const [inputReasons, setInputReasons] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'missed' | 'recorded'>('missed');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredOverdue = overdueDailyEntries.filter((item) => {
    if (dayFilter !== 'all' && item.dayKey !== dayFilter) return false;
    if (statusFilter === 'pending' && item.approvalStatus !== 'pending') return false;
    if (statusFilter === 'unsubmitted' && item.approvalStatus === 'pending') return false;
    return true;
  });

  const pendingCount = overdueDailyEntries.filter((e) => e.approvalStatus === 'pending').length;

  const handleInputChange = (id: string, val: number) => {
    setInputValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleReasonChange = (id: string, reason: string) => {
    setInputReasons((prev) => ({ ...prev, [id]: reason }));
  };

  // Member Action: Submit for Admin Approval
  const handleSubmitForApproval = (entry: OverdueDailyEntry) => {
    const val = inputValues[entry.id] !== undefined ? inputValues[entry.id] : (entry.submittedValue ?? entry.targetPerDay);
    const reason = inputReasons[entry.id] || entry.reason || 'Filled retrospectively by team member';

    submitMissedDayEntry(entry.id, val, reason);
    showToast(`Submitted: ${entry.metricTitle} (${entry.dayLabel}) with ${val} count for Admin approval.`);
  };

  // Member Action: Submit all missed entries at once
  const handleBatchSubmitAll = () => {
    const unsubmitted = overdueDailyEntries.filter((e) => e.approvalStatus !== 'pending');
    if (unsubmitted.length === 0) return;

    unsubmitted.forEach((entry) => {
      const val = inputValues[entry.id] !== undefined ? inputValues[entry.id] : entry.targetPerDay;
      const reason = inputReasons[entry.id] || 'Batch filled by team member';
      submitMissedDayEntry(entry.id, val, reason);
    });

    showToast(`Submitted ${unsubmitted.length} entries for Admin approval!`);
  };

  // Admin Action: Approve a single entry
  const handleApproveEntry = (entry: OverdueDailyEntry) => {
    const approvedVal = inputValues[entry.id] !== undefined ? inputValues[entry.id] : (entry.submittedValue ?? entry.targetPerDay);
    approveMissedDayEntry(entry.id, approvedVal);
    showToast(`Approved & Saved: ${entry.metricTitle} (${entry.dayLabel}) with count ${approvedVal}.`);
  };

  // Admin Action: Reject an entry with note
  const handleRejectEntry = (entry: OverdueDailyEntry) => {
    const note = prompt('Enter reason / instructions for revision:', 'Please verify numbers with dispatch sheet') || 'Requires revision';
    rejectMissedDayEntry(entry.id, note);
    showToast(`Revision requested for ${entry.metricTitle}.`);
  };

  // Admin Action: Batch Approve All Pending
  const handleBatchApprovePending = () => {
    const pendingIds = overdueDailyEntries.filter((e) => e.approvalStatus === 'pending').map((e) => e.id);
    if (pendingIds.length === 0) return;

    batchApproveMissedDays(pendingIds);
    showToast(`Approved all ${pendingIds.length} pending submissions!`);
  };

  // Compile list of recorded/locked days
  const workDays: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'> = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayNames: Record<string, string> = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday'
  };

  const recordedItemsList: Array<{
    lockKey: string;
    taskName: string;
    dayKey: string;
    dayName: string;
    target: number;
    value: number;
  }> = [];

  if (currentSheet.dailyTasks?.callingAndQuotes) {
    currentSheet.dailyTasks.callingAndQuotes.forEach((dq) => {
      workDays.forEach((dayKey) => {
        const lockKey = `${currentSheet.id}_${dq.id}_${dayKey}`;
        const isLocked = Boolean(lockedDaysMap[lockKey] || lockedDaysMap[`${currentSheet.id}_${dayKey}`]);
        const val = dq.days?.[dayKey] ?? 0;
        if (isLocked || val > 0) {
          recordedItemsList.push({
            lockKey,
            taskName: dq.taskName,
            dayKey,
            dayName: dayNames[dayKey],
            target: dq.targetPerDay,
            value: val
          });
        }
      });
    });
  }

  if (currentSheet.dailyTenderOperations) {
    currentSheet.dailyTenderOperations.forEach((dto) => {
      workDays.forEach((dayKey) => {
        const lockKey = `${currentSheet.id}_${dto.id}_${dayKey}`;
        const isLocked = Boolean(lockedDaysMap[lockKey]);
        const val = dto.days?.[dayKey] ?? 0;
        if (isLocked || val > 0) {
          recordedItemsList.push({
            lockKey,
            taskName: dto.task,
            dayKey,
            dayName: dayNames[dayKey],
            target: dto.targetPerDay || 0,
            value: val
          });
        }
      });
    });
  }

  if (currentSheet.dailyCommercialTasks) {
    currentSheet.dailyCommercialTasks.forEach((dct) => {
      workDays.forEach((dayKey) => {
        const lockKey = `${currentSheet.id}_${dct.id}_${dayKey}`;
        const isLocked = Boolean(lockedDaysMap[lockKey]);
        const val = dct.days?.[dayKey] ?? 0;
        if (isLocked || val > 0) {
          recordedItemsList.push({
            lockKey,
            taskName: dct.task,
            dayKey,
            dayName: dayNames[dayKey],
            target: dct.targetPerDay || 0,
            value: val
          });
        }
      });
    });
  }

  return (
    <div id="overdue-logs-view-container" className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                Missed &amp; Overdue Daily Logs
              </h1>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {pendingCount} Pending Approval
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {userRole === 'member'
                ? 'Team members can fill missed logs below and submit them for admin approval.'
                : 'Review submissions from team members, verify entries, and approve them into the weekly sheet.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-center">
              <span className="text-[10px] font-medium text-slate-500 block">Missed Days</span>
              <span className="text-sm font-mono-code font-bold text-rose-600">
                {overdueDailyEntries.length}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-center">
              <span className="text-[10px] font-medium text-slate-500 block">Recorded</span>
              <span className="text-sm font-mono-code font-bold text-emerald-600">
                {recordedItemsList.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Batch Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('missed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'missed'
                  ? 'bg-orange-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Missed Days ({overdueDailyEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recorded')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'recorded'
                  ? 'bg-orange-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Recorded &amp; Saved ({recordedItemsList.length})
            </button>
          </div>

          {activeTab === 'missed' && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none"
              >
                <option value="all">All Days</option>
                <option value="mon">Monday</option>
                <option value="tue">Tuesday</option>
                <option value="wed">Wednesday</option>
                <option value="thu">Thursday</option>
                <option value="fri">Friday</option>
                <option value="sat">Saturday</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="unsubmitted">Unsubmitted</option>
              </select>

              {/* Member Batch Submit */}
              {userRole === 'member' && overdueDailyEntries.some((e) => e.approvalStatus !== 'pending') && (
                <button
                  type="button"
                  onClick={handleBatchSubmitAll}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Submit All for Approval</span>
                </button>
              )}

              {/* Admin Batch Approve */}
              {userRole === 'admin' && pendingCount > 0 && (
                <button
                  type="button"
                  onClick={handleBatchApprovePending}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>Approve All Pending ({pendingCount})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'missed' ? (
        filteredOverdue.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-xs">No Missed Daily Tasks</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All daily operational logs for {member.name} are up-to-date and saved.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredOverdue.map((entry) => {
              const currentInput = inputValues[entry.id] !== undefined
                ? inputValues[entry.id]
                : (entry.submittedValue ?? entry.targetPerDay);
              const currentReason = inputReasons[entry.id] !== undefined
                ? inputReasons[entry.id]
                : (entry.reason ?? '');

              const isPending = entry.approvalStatus === 'pending';
              const isRejected = entry.approvalStatus === 'rejected';

              return (
                <div
                  key={entry.id}
                  className={`bg-white border rounded-xl p-3.5 space-y-2.5 transition-shadow ${
                    isPending
                      ? 'border-amber-300 bg-amber-50/20'
                      : isRejected
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Status Badge & Day */}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono-code bg-slate-100 text-slate-700">
                      {entry.dayLabel}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-mono-code">
                        Target: {entry.targetPerDay}
                      </span>
                      {isPending ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Pending</span>
                        </span>
                      ) : isRejected ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>Revision Needed</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                          Missed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Task Name */}
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs truncate">
                      {entry.metricTitle}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Employee: {entry.memberName || member.name}
                    </p>
                  </div>

                  {/* Input Form for Member & Admin */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-slate-600 font-medium shrink-0">
                        Achieved Count:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={currentInput}
                        onChange={(e) => handleInputChange(entry.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-center font-bold text-xs font-mono-code rounded border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <input
                      type="text"
                      value={currentReason}
                      onChange={(e) => handleReasonChange(entry.id, e.target.value)}
                      placeholder="Optional remarks / reason for delay"
                      className="w-full px-2.5 py-1 text-[11px] rounded border border-slate-200 text-slate-800 bg-slate-50/70 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {/* Admin Audit Notes if rejected */}
                  {isRejected && entry.adminNotes && (
                    <div className="p-2 rounded bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                      <span className="font-bold">Admin Note:</span> {entry.adminNotes}
                    </div>
                  )}

                  {/* Pending Info for Member */}
                  {isPending && (
                    <div className="p-2 rounded bg-amber-50/80 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
                      <span>Submitted: {entry.submittedValue} count</span>
                      <span className="text-[10px] text-amber-600">Awaiting Admin</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    {userRole === 'member' ? (
                      <button
                        type="button"
                        onClick={() => handleSubmitForApproval(entry)}
                        className="w-full py-1.5 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isPending ? 'Update Submission' : 'Submit for Admin Approval'}</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApproveEntry(entry)}
                          className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                          title="Approve and save this count into weekly sheet"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve &amp; Lock</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectEntry(entry)}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer"
                          title="Reject and ask team member to revise"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Recorded / Saved List */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-900 text-xs">Recorded Daily Operational Logs</h3>
            <span className="text-xs text-slate-500 font-mono-code">{recordedItemsList.length} logs recorded</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {recordedItemsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No recorded logs in this cycle yet.
              </div>
            ) : (
              recordedItemsList.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold font-mono-code shrink-0">
                      {item.dayKey.toUpperCase()}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{item.taskName}</div>
                      <div className="text-[10px] text-slate-500">{item.dayName} &bull; Target: {item.target}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono-code font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.value} logged
                    </span>
                    {userRole === 'admin' && (
                      <button
                        type="button"
                        onClick={() => toggleDayLock(item.lockKey, false)}
                        className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer underline"
                      >
                        Unlock
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
