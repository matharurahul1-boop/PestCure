import React from 'react';
import { X, Printer, Download, FileSpreadsheet, Check } from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';
import { formatINR, formatPercent } from '../utils/colorThreshold';

interface ExportSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportSheetModal: React.FC<ExportSheetModalProps> = ({ isOpen, onClose }) => {
  const { currentSheet, member, computedTotals } = usePestCure();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = `PestCure Weekly Review Sheet - ${member.name}\n`;
    csv += `Role: ${member.role} (${member.department})\n`;
    csv += `Cycle: ${currentSheet.cycleLabel}\n`;
    csv += `Review Date: ${currentSheet.attendance.reviewDate}\n`;
    csv += `Period: ${currentSheet.attendance.periodStart} to ${currentSheet.attendance.periodEnd}\n\n`;

    if (currentSheet.sheetType === 'tender_operations' || currentSheet.dailyTenderOperations) {
      csv += `DAILY TENDER OPERATIONS\nTask,Target/Day,Mon,Tue,Wed,Thu,Fri,Sat,Sun,Week Total,Weekly Pct\n`;
      (currentSheet.dailyTenderOperations || []).forEach((op) => {
        const tot = (op.days.mon || 0) + (op.days.tue || 0) + (op.days.wed || 0) + (op.days.thu || 0) + (op.days.fri || 0) + (op.days.sat || 0) + (op.days.sun || 0);
        const target6d = (op.targetPerDay || 1) * 6;
        const pct = target6d > 0 ? ((tot / target6d) * 100).toFixed(1) : '0';
        csv += `"${op.task}",${op.targetPerDay},${op.days.mon},${op.days.tue},${op.days.wed},${op.days.thu},${op.days.fri},${op.days.sat},${op.days.sun},${tot},${pct}%\n`;
      });

      csv += `\nTENDER PIPELINE\nCategory,Target Value,Awarded Value,Submitted,In Preparation,Follow-up,Conversion %\n`;
      (currentSheet.tenderPipelineMetrics || []).forEach((r) => {
        csv += `"${r.category}",${r.targetAmount},${r.awardedTotal},${r.submittedBids},${r.inPreparationBids},${r.followUpBids},${computedTotals.tenderPipelinePct}%\n`;
      });
    } else {
      csv += `DAILY TASKS\nTask,Target/Day,Mon,Tue,Wed,Thu,Fri,Sat,Sun,Week Total\n`;
      currentSheet.dailyTasks.callingAndQuotes.forEach((m) => {
        const tot = (m.days.mon || 0) + (m.days.tue || 0) + (m.days.wed || 0) + (m.days.thu || 0) + (m.days.fri || 0) + (m.days.sat || 0) + (m.days.sun || 0);
        csv += `"${m.taskName}",${m.targetPerDay},${m.days.mon},${m.days.tue},${m.days.wed},${m.days.thu},${m.days.fri},${m.days.sat},${m.days.sun},${tot}\n`;
      });

      csv += `\nSALES METRICS\nCategory,OP Final (A/Cs),OP Value (INR),SR Final (A/Cs),SR Value (INR),Remarks\n`;
      currentSheet.salesMetrics.forEach((r) => {
        csv += `"${r.category}",${r.opFinalCount},${r.opValue},${r.srFinalCount},${r.srValue},"${r.remarks}"\n`;
      });

      csv += `TOTAL,${computedTotals.totalOpAccounts},${computedTotals.totalOpValue},${computedTotals.totalSrAccounts},${computedTotals.totalSrValue},\n\n`;
    }

    csv += `\nTARGETS & ACHIEVEMENTS\n`;
    csv += `Weekly Target OP,${currentSheet.targets.weeklyTargetOp},Weekly Achieved OP,${currentSheet.targets.weeklyAchievedOp},% Achieved,${computedTotals.weeklyOpAchievementPct.toFixed(1)}%\n`;
    csv += `Weekly Target SR,${currentSheet.targets.weeklyTargetSr},Weekly Achieved SR,${currentSheet.targets.weeklyAchievedSr},% Achieved,${computedTotals.weeklySrAchievementPct.toFixed(1)}%\n`;
    csv += `Monthly Target OP,${currentSheet.targets.monthlyTargetOp},Monthly Achieved OP,${currentSheet.targets.monthlyAchievedOp},% Achieved,${computedTotals.monthlyOpAchievementPct.toFixed(1)}%\n`;
    csv += `Monthly Target SR,${currentSheet.targets.monthlyTargetSr},Monthly Achieved SR,${currentSheet.targets.monthlyAchievedSr},% Achieved,${computedTotals.monthlySrAchievementPct.toFixed(1)}%\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PestCure_Review_${member.name.replace(/\s+/g, '_')}_${currentSheet.attendance.periodEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 text-slate-900">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-display">Export / Print Review Sheet</h3>
              <p className="text-xs text-slate-500">{currentSheet.cycleLabel}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Employee:</span>
            <span className="font-bold text-slate-900">{member.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Period:</span>
            <span className="font-bold text-slate-900">{currentSheet.attendance.periodStart} to {currentSheet.attendance.periodEnd}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Overall Score:</span>
            <span className="font-mono-code font-bold text-emerald-700">{computedTotals.overallPerformancePct}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>
        </div>

      </div>
    </div>
  );
};
