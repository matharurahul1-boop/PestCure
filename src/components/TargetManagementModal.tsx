import React, { useState } from 'react';
import {
  X,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  History,
  Shield,
  User,
  ArrowRight,
  Edit3
} from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';
import { formatINR } from '../utils/colorThreshold';
import { TargetValues } from '../types';

interface TargetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TargetManagementModal: React.FC<TargetManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    userRole,
    member,
    currentSheet,
    proposeNewTargets,
    approveTargetProposal,
    rejectTargetProposal,
    adminToggleTargetFreeze,
    targetAuditLogs
  } = usePestCure();

  const [activeTab, setActiveTab] = useState<'form' | 'logs'>('form');

  // Working target state
  const baseTargets = currentSheet.targets || member.approvedTargets;
  const isTargetFrozen = Boolean(currentSheet.isTargetFrozen || member.isTargetFrozen);
  const isMemberLocked = userRole !== 'admin' && isTargetFrozen;
  const [formData, setFormData] = useState<TargetValues>(baseTargets);
  const [proposalNotes, setProposalNotes] = useState('');
  const [adminFeedback, setAdminFeedback] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setFormData(currentSheet.targets || member.approvedTargets);
      setProposalNotes('');
      setAdminFeedback('');
    }
  }, [isOpen, member.id, currentSheet.id]);

  if (!isOpen) return null;

  const isPendingApproval = currentSheet.targetApprovalStatus === 'waiting_approval' || member.pendingTargetProposal;

  const handlePropose = (e: React.FormEvent) => {
    e.preventDefault();
    proposeNewTargets(formData, proposalNotes);
    alert('Target proposal submitted! Status is now "Waiting for Admin Approval".');
    onClose();
  };

  const handleAdminApprove = () => {
    approveTargetProposal(formData, adminFeedback || 'Approved by Administrator');
    alert('Target successfully approved & applied to active weekly report calculations!');
    onClose();
  };

  const handleAdminReject = () => {
    if (!adminFeedback.trim()) {
      alert('Please provide feedback reason for returning the proposal.');
      return;
    }
    rejectTargetProposal(adminFeedback);
    alert('Target proposal returned with feedback.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono-code uppercase tracking-wider text-amber-400 font-bold">
                Target Governance & Approval Engine
              </div>
              <h2 className="text-lg font-bold font-display text-white">
                Manage Performance Targets · {member.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {userRole === 'admin' ? 'Review & Approve Targets' : 'Propose Target Revision'}
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Target Audit Logs ({targetAuditLogs.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Status:</span>
            {isPendingApproval ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono-code font-bold">
                ⏳ Waiting for Approval
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono-code font-bold">
                ✓ Approved
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

          {activeTab === 'form' ? (
            <form onSubmit={handlePropose} className="space-y-6">

              {/* Status Alert Banner */}
              {isMemberLocked ? (
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 flex items-start gap-3 text-slate-800">
                  <Shield className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-950">🔒 Targets Are Frozen (Admin Approved)</div>
                    <p className="text-xs text-slate-600">
                      As per governance rule, targets are set 1 time by the user and locked upon Admin approval. You cannot modify frozen targets. If adjustments are required, your Administrator can unlock them or modify them directly.
                    </p>
                  </div>
                </div>
              ) : isPendingApproval ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-950">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <div className="font-bold text-sm">Target Revision Pending Approval</div>
                    <p className="text-xs text-amber-900">
                      {userRole === 'admin'
                        ? 'The team member has proposed new baseline targets below. As Administrator, you may adjust numbers and click "Approve Targets", or return with feedback.'
                        : 'Your proposed targets are currently under review by Management. All report formulas will synchronize once approved.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Current targets are approved and active for report scoring.</span>
                  </div>
                  {userRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => adminToggleTargetFreeze(!isTargetFrozen)}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 transition-all cursor-pointer"
                    >
                      {isTargetFrozen ? '🔓 Unfreeze for Member' : '🔒 Freeze Targets'}
                    </button>
                  )}
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Monthly OP Target */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <label className="font-bold text-slate-800 block text-[11px]">Monthly OP Target (Own Portfolio ₹)</label>
                  <input
                    type="number"
                    disabled={isMemberLocked}
                    value={formData.monthlyTargetOp}
                    onChange={(e) => setFormData({ ...formData, monthlyTargetOp: parseInt(e.target.value) || 0 })}
                    className={`w-full text-base font-bold font-mono-code p-2 bg-white border border-slate-300 rounded-lg text-slate-900 ${
                      isMemberLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 block">E.g. ₹8,00,000</span>
                </div>

                {/* Monthly SR Target */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <label className="font-bold text-slate-800 block text-[11px]">Monthly SR Target (Service Renewal ₹)</label>
                  <input
                    type="number"
                    disabled={isMemberLocked}
                    value={formData.monthlyTargetSr}
                    onChange={(e) => setFormData({ ...formData, monthlyTargetSr: parseInt(e.target.value) || 0 })}
                    className={`w-full text-base font-bold font-mono-code p-2 bg-white border border-slate-300 rounded-lg text-slate-900 ${
                      isMemberLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 block">E.g. ₹4,50,000</span>
                </div>

                {/* Weekly OP Target */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <label className="font-bold text-slate-800 block text-[11px]">Weekly OP Target (₹)</label>
                  <input
                    type="number"
                    disabled={isMemberLocked}
                    value={formData.weeklyTargetOp}
                    onChange={(e) => setFormData({ ...formData, weeklyTargetOp: parseInt(e.target.value) || 0 })}
                    className={`w-full text-base font-bold font-mono-code p-2 bg-white border border-slate-300 rounded-lg text-slate-900 ${
                      isMemberLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 block">E.g. ₹2,00,000</span>
                </div>

                {/* Weekly SR Target */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <label className="font-bold text-slate-800 block text-[11px]">Weekly SR Target (₹)</label>
                  <input
                    type="number"
                    disabled={isMemberLocked}
                    value={formData.weeklyTargetSr}
                    onChange={(e) => setFormData({ ...formData, weeklyTargetSr: parseInt(e.target.value) || 0 })}
                    className={`w-full text-base font-bold font-mono-code p-2 bg-white border border-slate-300 rounded-lg text-slate-900 ${
                      isMemberLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 block">E.g. ₹1,12,500</span>
                </div>

                {/* Daily Renewals Target */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <label className="font-bold text-slate-800 block text-[11px]">Daily Renewals Calling Target (Calls/Day)</label>
                  <input
                    type="number"
                    disabled={isMemberLocked}
                    value={formData.dailyTargetRenewals}
                    onChange={(e) => setFormData({ ...formData, dailyTargetRenewals: parseInt(e.target.value) || 0 })}
                    className={`w-full text-base font-bold font-mono-code p-2 bg-white border border-slate-300 rounded-lg text-slate-900 ${
                      isMemberLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 block">E.g. 30 calls/day</span>
                </div>

                {/* Daily Quotation Target */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <label className="font-bold text-slate-800 block text-[11px]">Daily Quotations Target (Quotes/Day)</label>
                  <input
                    type="number"
                    disabled={isMemberLocked}
                    value={formData.dailyTargetQuotation}
                    onChange={(e) => setFormData({ ...formData, dailyTargetQuotation: parseInt(e.target.value) || 0 })}
                    className={`w-full text-base font-bold font-mono-code p-2 bg-white border border-slate-300 rounded-lg text-slate-900 ${
                      isMemberLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 block">E.g. 12 quotes/day</span>
                </div>

              </div>

              {/* Target Remarks / Justification */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Target Strategy & Justification Notes</label>
                <textarea
                  disabled={isMemberLocked}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={2}
                  className={`w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs ${
                    isMemberLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="E.g. Focus on residential key accounts & institutional AMC renewals..."
                />
              </div>

              {/* Member Proposal Notes or Admin Feedback */}
              {userRole === 'admin' ? (
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Admin Approval / Modification Notes</label>
                  <input
                    type="text"
                    value={adminFeedback}
                    onChange={(e) => setAdminFeedback(e.target.value)}
                    placeholder="Enter approval note or instructions for member..."
                    className="w-full p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-slate-900 font-medium text-xs"
                  />
                </div>
              ) : isMemberLocked ? null : (
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Reason for Target Change Request</label>
                  <input
                    type="text"
                    value={proposalNotes}
                    onChange={(e) => setProposalNotes(e.target.value)}
                    placeholder="Why are you adjusting these targets..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Close
                </button>

                {userRole === 'admin' ? (
                  <div className="flex items-center gap-2">
                    {isPendingApproval && (
                      <button
                        type="button"
                        onClick={handleAdminReject}
                        className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 cursor-pointer"
                      >
                        Reject / Request Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAdminApprove}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isPendingApproval ? 'Approve & Freeze Targets' : 'Save & Overwrite Targets'}</span>
                    </button>
                  </div>
                ) : isMemberLocked ? (
                  <div className="text-xs text-slate-500 font-medium italic">
                    Targets locked by Admin. Switch to Admin mode or request admin review to modify.
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit for Admin Approval</span>
                  </button>
                )}
              </div>

            </form>
          ) : (
            /* Tab 2: Audit Logs */
            <div className="space-y-4">
              <div className="text-slate-600 font-medium">
                Complete historical record of all proposed, approved, and modified targets:
              </div>

              <div className="space-y-3">
                {targetAuditLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'Approved'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : log.action === 'Proposed'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : log.action === 'Modified & Approved'
                            ? 'bg-teal-100 text-teal-900 border border-teal-300'
                            : 'bg-slate-200 text-slate-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="font-bold text-slate-900">{log.actorName}</span>
                        <span className="text-[10px] text-slate-500">({log.actorRole})</span>
                      </div>
                      <span className="text-[11px] font-mono-code text-slate-500">{log.timestamp}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono-code">
                      <div className="bg-white p-1.5 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Monthly OP:</span>
                        <span className="font-bold text-slate-900">{formatINR(log.newTargets.monthlyTargetOp)}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Monthly SR:</span>
                        <span className="font-bold text-slate-900">{formatINR(log.newTargets.monthlyTargetSr)}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Weekly OP:</span>
                        <span className="font-bold text-slate-900">{formatINR(log.newTargets.weeklyTargetOp)}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Daily Calls:</span>
                        <span className="font-bold text-slate-900">{log.newTargets.dailyTargetRenewals}/day</span>
                      </div>
                    </div>

                    {log.notes && (
                      <div className="text-[11px] text-slate-700 bg-white/60 p-2 rounded border border-slate-200 italic">
                        "{log.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
