import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Briefcase,
  Layers,
  Calendar,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Users,
  Building2,
  Phone,
  FileCheck,
  Target,
  ArrowRight,
  BookmarkPlus,
  ShieldCheck,
  Check
} from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';
import { SheetType, RoleTemplate, TaskPriority, OccurrenceType } from '../types';

interface AddNewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddNewUserModal: React.FC<AddNewUserModalProps> = ({ isOpen, onClose }) => {
  const {
    allMembers,
    roleTemplates,
    saveNewRoleTemplate,
    deleteRoleTemplate,
    addNewMemberWithSheet,
    setActiveView
  } = usePestCure();

  // Mode: 'assign_existing' | 'create_new_role'
  const [activeTab, setActiveTab] = useState<'assign_existing' | 'create_new_role'>('assign_existing');

  // ==========================================
  // TAB 1: QUICK ASSIGN EXISTING ROLE STATE
  // ==========================================
  const [assigneeName, setAssigneeName] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [assigneePhone, setAssigneePhone] = useState('');
  
  // Selection mode: 'from_role_template' | 'clone_from_member'
  const [roleSelectionType, setRoleSelectionType] = useState<'role_template' | 'clone_member'>('role_template');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roleTemplates[0]?.id || 'role-customer-care');
  const [selectedSourceMemberId, setSelectedSourceMemberId] = useState<string>(allMembers[0]?.id || '');

  // Customizable baseline targets for the assignee
  const [customWeeklyOp, setCustomWeeklyOp] = useState<number>(200000);
  const [customWeeklySr, setCustomWeeklySr] = useState<number>(112500);
  const [customDailyRenewals, setCustomDailyRenewals] = useState<number>(30);
  const [customDailyQuotes, setCustomDailyQuotes] = useState<number>(12);

  // Tailored individual KRA & KPI state for Tab 1
  const [showCustomKpiKraSection, setShowCustomKpiKraSection] = useState(false);
  const [tailoredDailyTasks, setTailoredDailyTasks] = useState<Array<{ id: string; taskName: string; targetPerDay: number }>>(() => {
    const tmpl = roleTemplates[0];
    return tmpl?.dailyTasks?.map((t, i) => ({ id: `tdt-${i + 1}`, taskName: t.taskName, targetPerDay: t.targetPerDay })) || [
      { id: '1', taskName: 'Renewals Calling', targetPerDay: 30 },
      { id: '2', taskName: 'Quotations Prepared', targetPerDay: 12 }
    ];
  });
  const [newTailoredDailyInput, setNewTailoredDailyInput] = useState('');
  const [newTailoredDailyTarget, setNewTailoredDailyTarget] = useState(10);

  const [tailoredWeeklyTasks, setTailoredWeeklyTasks] = useState<Array<{ id: string; task: string; occurrence: string; priority: TaskPriority; remarks?: string }>>(() => {
    const tmpl = roleTemplates[0];
    return tmpl?.weeklyTasks?.map((w, i) => ({ id: `twt-${i + 1}`, task: w.task, occurrence: w.occurrence, priority: w.priority, remarks: w.remarks })) || [
      { id: '1', task: 'Weekly Escalations & Customer Care Follow-up', occurrence: 'Weekly', priority: 'High' as TaskPriority, remarks: 'Standard review' }
    ];
  });
  const [newTailoredWeeklyInput, setNewTailoredWeeklyInput] = useState('');
  const [newTailoredWeeklyOccurrence, setNewTailoredWeeklyOccurrence] = useState('Weekly');
  const [newTailoredWeeklyPriority, setNewTailoredWeeklyPriority] = useState<TaskPriority>('Medium');

  // ==========================================
  // TAB 2: CREATE NEW ROLE & TEMPLATE STATE
  // ==========================================
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('Operations & Field Services');
  const [newSheetType, setNewSheetType] = useState<SheetType>('general_operations');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  
  // Role financial & quota defaults
  const [newDefaultWeeklyOp, setNewDefaultWeeklyOp] = useState(220000);
  const [newDefaultWeeklySr, setNewDefaultWeeklySr] = useState(100000);
  const [newDefaultDailyRenewals, setNewDefaultDailyRenewals] = useState(20);
  const [newDefaultDailyQuotes, setNewDefaultDailyQuotes] = useState(8);

  // Dynamic Daily Tasks builder
  const [dailyTaskList, setDailyTaskList] = useState<Array<{ id: string; taskName: string; targetPerDay: number }>>([
    { id: '1', taskName: 'Site Quality & Equipment Audit', targetPerDay: 10 },
    { id: '2', taskName: 'Service Escalation Follow-up', targetPerDay: 8 }
  ]);
  const [newDailyTaskInput, setNewDailyTaskInput] = useState('');
  const [newDailyTaskTarget, setNewDailyTaskTarget] = useState(10);

  // Dynamic Weekly Tasks builder
  const [weeklyTaskList, setWeeklyTaskList] = useState<Array<{ id: string; task: string; occurrence: string; priority: TaskPriority; remarks?: string }>>([
    { id: '1', task: 'Weekly Field Crew Performance Review', occurrence: 'Weekly', priority: 'High', remarks: 'Safety & audit adherence' },
    { id: '2', task: 'Customer Feedback & Retreatment Check', occurrence: 'Wed & Sat', priority: 'Medium', remarks: 'Site verification' }
  ]);
  const [newWeeklyTaskInput, setNewWeeklyTaskInput] = useState('');
  const [newWeeklyOccurrence, setNewWeeklyOccurrence] = useState<string>('Weekly');
  const [newWeeklyPriority, setNewWeeklyPriority] = useState<TaskPriority>('High');

  // Dynamic Monthly Tasks builder
  const [monthlyTaskList, setMonthlyTaskList] = useState<Array<{ id: string; task: string; occurrence: string; tat: string; remarkIfAny?: string }>>([
    { id: '1', task: 'Monthly Chemical Inventory & Safety Audit', occurrence: 'Monthly', tat: '1 Month', remarkIfAny: 'Verify batch numbers' }
  ]);
  const [newMonthlyTaskInput, setNewMonthlyTaskInput] = useState('');

  // Assign immediately to new employee toggle
  const [assignNowToEmployee, setAssignNowToEmployee] = useState(true);
  const [newRoleEmployeeName, setNewRoleEmployeeName] = useState('');
  const [newRoleEmployeeEmail, setNewRoleEmployeeEmail] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  // Selected role template reference
  const currentSelectedTemplate = roleTemplates.find((r) => r.id === selectedRoleId) || roleTemplates[0];
  const currentSelectedSourceMember = allMembers.find((m) => m.id === selectedSourceMemberId) || allMembers[0];

  // Update target fields when template changes in assign mode
  const handleSelectRoleTemplate = (tmplId: string) => {
    setSelectedRoleId(tmplId);
    const tmpl = roleTemplates.find((r) => r.id === tmplId);
    if (tmpl) {
      setCustomWeeklyOp(tmpl.defaultWeeklyTargetOp);
      setCustomWeeklySr(tmpl.defaultWeeklyTargetSr);
      setCustomDailyRenewals(tmpl.defaultDailyTargetRenewals);
      setCustomDailyQuotes(tmpl.defaultDailyTargetQuotation);
      if (tmpl.dailyTasks && tmpl.dailyTasks.length > 0) {
        setTailoredDailyTasks(
          tmpl.dailyTasks.map((t, i) => ({ id: `tdt-${Date.now()}-${i}`, taskName: t.taskName, targetPerDay: t.targetPerDay }))
        );
      }
      if (tmpl.weeklyTasks && tmpl.weeklyTasks.length > 0) {
        setTailoredWeeklyTasks(
          tmpl.weeklyTasks.map((w, i) => ({ id: `twt-${Date.now()}-${i}`, task: w.task, occurrence: w.occurrence, priority: w.priority, remarks: w.remarks }))
        );
      }
    }
  };

  const handleSelectSourceMember = (memberId: string) => {
    setSelectedSourceMemberId(memberId);
    const m = allMembers.find((item) => item.id === memberId);
    if (m) {
      setCustomWeeklyOp(m.approvedTargets.weeklyTargetOp);
      setCustomWeeklySr(m.approvedTargets.weeklyTargetSr);
      setCustomDailyRenewals(m.approvedTargets.dailyTargetRenewals);
      setCustomDailyQuotes(m.approvedTargets.dailyTargetQuotation);

      if (m.sheets && m.sheets[0]) {
        const s = m.sheets[0];
        if (s.dailyTasks?.callingAndQuotes?.length) {
          setTailoredDailyTasks(s.dailyTasks.callingAndQuotes.map((q, i) => ({ id: `tdt-${Date.now()}-${i}`, taskName: q.taskName, targetPerDay: q.targetPerDay })));
        } else if (s.dailyTenderOperations?.length) {
          setTailoredDailyTasks(s.dailyTenderOperations.map((q, i) => ({ id: `tdt-${Date.now()}-${i}`, taskName: q.task, targetPerDay: q.targetPerDay })));
        } else if (s.dailyCommercialTasks?.length) {
          setTailoredDailyTasks(s.dailyCommercialTasks.map((q, i) => ({ id: `tdt-${Date.now()}-${i}`, taskName: q.task, targetPerDay: q.targetPerDay })));
        }

        if (s.weeklyTasks?.length) {
          setTailoredWeeklyTasks(s.weeklyTasks.map((w, i) => ({ id: `twt-${Date.now()}-${i}`, task: w.task, occurrence: w.occurrence, priority: w.priority as TaskPriority, remarks: w.remarks })));
        }
      }
    }
  };

  // Add Daily Task to new role builder
  const handleAddDailyTask = () => {
    if (!newDailyTaskInput.trim()) return;
    setDailyTaskList((prev) => [
      ...prev,
      {
        id: `dt-${Date.now()}`,
        taskName: newDailyTaskInput.trim(),
        targetPerDay: Number(newDailyTaskTarget) || 10
      }
    ]);
    setNewDailyTaskInput('');
    setNewDailyTaskTarget(10);
  };

  const handleRemoveDailyTask = (id: string) => {
    setDailyTaskList((prev) => prev.filter((item) => item.id !== id));
  };

  // Add Weekly Task to new role builder
  const handleAddWeeklyTask = () => {
    if (!newWeeklyTaskInput.trim()) return;
    setWeeklyTaskList((prev) => [
      ...prev,
      {
        id: `wt-${Date.now()}`,
        task: newWeeklyTaskInput.trim(),
        occurrence: newWeeklyOccurrence,
        priority: newWeeklyPriority,
        remarks: 'Custom role task'
      }
    ]);
    setNewWeeklyTaskInput('');
  };

  const handleRemoveWeeklyTask = (id: string) => {
    setWeeklyTaskList((prev) => prev.filter((item) => item.id !== id));
  };

  // Add Monthly Task to new role builder
  const handleAddMonthlyTask = () => {
    if (!newMonthlyTaskInput.trim()) return;
    setMonthlyTaskList((prev) => [
      ...prev,
      {
        id: `mt-${Date.now()}`,
        task: newMonthlyTaskInput.trim(),
        occurrence: 'Monthly',
        tat: '1 Month',
        remarkIfAny: 'Custom audit'
      }
    ]);
    setNewMonthlyTaskInput('');
  };

  const handleRemoveMonthlyTask = (id: string) => {
    setMonthlyTaskList((prev) => prev.filter((item) => item.id !== id));
  };

  // Pre-fill tasks based on Base Format selection
  const handleBaseFormatChange = (type: SheetType) => {
    setNewSheetType(type);
    if (type === 'customer_care') {
      setNewDepartment('Customer Care & Retention');
      setNewRoleDescription('Desk calling matrix, renewals follow-up, quotation tracking, client satisfaction.');
      setNewDefaultWeeklyOp(200000);
      setNewDefaultWeeklySr(112500);
      setNewDefaultDailyRenewals(30);
      setNewDefaultDailyQuotes(12);
      setDailyTaskList([
        { id: '1', taskName: 'Renewals Calling', targetPerDay: 30 },
        { id: '2', taskName: 'Quotations Prepared & Followed up', targetPerDay: 12 },
        { id: '3', taskName: 'Customer Complaints & Service Follow-ups', targetPerDay: 15 }
      ]);
    } else if (type === 'tender_operations') {
      setNewDepartment('Tender & GeM Operations');
      setNewRoleDescription('GeM portal tracking, live bid participation, documentation compliance.');
      setNewDefaultWeeklyOp(350000);
      setNewDefaultWeeklySr(150000);
      setNewDefaultDailyRenewals(10);
      setNewDefaultDailyQuotes(5);
      setDailyTaskList([
        { id: '1', taskName: 'GeM Portal Daily Bid Tracking & Screening', targetPerDay: 10 },
        { id: '2', taskName: 'Document Verification & Technical Compliance Checks', targetPerDay: 5 },
        { id: '3', taskName: 'Institutional Client Outreach & Follow-up', targetPerDay: 8 }
      ]);
    } else if (type === 'commercial_bd') {
      setNewDepartment('Commercial Business Development');
      setNewRoleDescription('B2B outreach, commercial site pitches, corporate key accounts.');
      setNewDefaultWeeklyOp(250000);
      setNewDefaultWeeklySr(120000);
      setNewDefaultDailyRenewals(20);
      setNewDefaultDailyQuotes(8);
      setDailyTaskList([
        { id: '1', taskName: 'B2B Client Calling & Cold Outreach', targetPerDay: 20 },
        { id: '2', taskName: 'Commercial Site Proposals Dispatched', targetPerDay: 5 },
        { id: '3', taskName: 'Facility Managers & Vendor Follow-ups', targetPerDay: 10 }
      ]);
    } else {
      setNewDepartment('Operations & Field Services');
      setNewRoleDescription('Site audit inspections, technician route supervision, chemical dosage compliance.');
      setNewDefaultWeeklyOp(180000);
      setNewDefaultWeeklySr(90000);
      setNewDefaultDailyRenewals(15);
      setNewDefaultDailyQuotes(6);
      setDailyTaskList([
        { id: '1', taskName: 'Technician Route & Schedule Verification', targetPerDay: 15 },
        { id: '2', taskName: 'Random Site Quality Audits & Inspection', targetPerDay: 6 },
        { id: '3', taskName: 'Chemical Dosage & Equipment Safety Verification', targetPerDay: 8 }
      ]);
    }
  };

  // Submit TAB 1: Assign Existing Role to User
  const handleAssignExistingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeName.trim()) {
      setErrorMessage('Please enter the employee name.');
      return;
    }

    if (roleSelectionType === 'clone_member') {
      // Clone from existing member
      if (!currentSelectedSourceMember) {
        setErrorMessage('Please select an existing member to clone from.');
        return;
      }

      addNewMemberWithSheet({
        name: assigneeName.trim(),
        role: currentSelectedSourceMember.role,
        department: currentSelectedSourceMember.department,
        sheetType: currentSelectedSourceMember.sheetType,
        email: assigneeEmail.trim(),
        phone: assigneePhone.trim(),
        weeklyTargetOp: customWeeklyOp,
        weeklyTargetSr: customWeeklySr,
        dailyTargetRenewals: customDailyRenewals,
        dailyTargetQuotation: customDailyQuotes,
        sourceMember: currentSelectedSourceMember
      });
    } else {
      // Assign from Role Template
      if (!currentSelectedTemplate) {
        setErrorMessage('Please select a role template.');
        return;
      }

      addNewMemberWithSheet({
        name: assigneeName.trim(),
        role: currentSelectedTemplate.roleName,
        department: currentSelectedTemplate.department,
        sheetType: currentSelectedTemplate.sheetType,
        email: assigneeEmail.trim(),
        phone: assigneePhone.trim(),
        weeklyTargetOp: customWeeklyOp,
        weeklyTargetSr: customWeeklySr,
        dailyTargetRenewals: customDailyRenewals,
        dailyTargetQuotation: customDailyQuotes,
        customDailyTasks: currentSelectedTemplate.dailyTasks,
        customWeeklyTasks: currentSelectedTemplate.weeklyTasks,
        customMonthlyTasks: currentSelectedTemplate.monthlyTasks,
        customSalesMetrics: currentSelectedTemplate.salesMetrics
      });
    }

    setActiveView('weekly-sheet');
    onClose();
  };

  // Submit TAB 2: Create New Role & Custom Weekly Report
  const handleCreateNewRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim()) {
      setErrorMessage('Please enter the New Role Title.');
      return;
    }

    if (assignNowToEmployee && !newRoleEmployeeName.trim()) {
      setErrorMessage('Please enter the Employee Name to assign this new role.');
      return;
    }

    const templateId = `role-custom-${Date.now()}`;
    const newTemplate: RoleTemplate = {
      id: templateId,
      roleName: newRoleTitle.trim(),
      department: newDepartment.trim() || 'General Operations',
      sheetType: newSheetType,
      description: newRoleDescription.trim() || `Custom weekly report structure for ${newRoleTitle}`,
      defaultWeeklyTargetOp: newDefaultWeeklyOp,
      defaultWeeklyTargetSr: newDefaultWeeklySr,
      defaultDailyTargetRenewals: newDefaultDailyRenewals,
      defaultDailyTargetQuotation: newDefaultDailyQuotes,
      dailyTasks: dailyTaskList.map((t) => ({
        taskName: t.taskName,
        targetPerDay: t.targetPerDay
      })),
      weeklyTasks: weeklyTaskList.map((w) => ({
        task: w.task,
        occurrence: w.occurrence,
        priority: w.priority,
        remarks: w.remarks
      })),
      monthlyTasks: monthlyTaskList.map((m) => ({
        task: m.task,
        occurrence: m.occurrence,
        tat: m.tat,
        remarkIfAny: m.remarkIfAny
      })),
      salesMetrics: [
        { category: 'Contract Signings', remarks: 'New contracts' },
        { category: 'Renewals & Extensions', remarks: 'Ongoing accounts' },
        { category: 'Service Upgrades', remarks: 'Additional pest solutions' }
      ],
      isCustom: true
    };

    // Save to library if toggled
    if (saveToLibrary) {
      saveNewRoleTemplate(newTemplate);
    }

    // If assigning to an employee now
    if (assignNowToEmployee) {
      addNewMemberWithSheet({
        name: newRoleEmployeeName.trim(),
        role: newTemplate.roleName,
        department: newTemplate.department,
        sheetType: newTemplate.sheetType,
        email: newRoleEmployeeEmail.trim(),
        weeklyTargetOp: newDefaultWeeklyOp,
        weeklyTargetSr: newDefaultWeeklySr,
        dailyTargetRenewals: newDefaultDailyRenewals,
        dailyTargetQuotation: newDefaultDailyQuotes,
        customDailyTasks: newTemplate.dailyTasks,
        customWeeklyTasks: newTemplate.weeklyTasks,
        customMonthlyTasks: newTemplate.monthlyTasks,
        customSalesMetrics: newTemplate.salesMetrics
      });
    }

    setActiveView('weekly-sheet');
    onClose();
  };

  return (
    <div
      id="add-new-user-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="add-new-user-modal-card"
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                User Onboarding &amp; Role Management
              </h2>
              <p className="text-[11px] text-slate-500">
                Assign existing roles or define new roles with custom weekly report structures
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-0 border-b border-slate-100 flex items-center gap-2 bg-white">
          <button
            type="button"
            onClick={() => {
              setActiveTab('assign_existing');
              setErrorMessage('');
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'assign_existing'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>1. Quick Assign Existing Role</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('create_new_role');
              setErrorMessage('');
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'create_new_role'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>2. + Create New Role &amp; Custom Report</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: ASSIGN EXISTING ROLE */}
          {/* ========================================================================= */}
          {activeTab === 'assign_existing' && (
            <form onSubmit={handleAssignExistingSubmit} className="space-y-4">
              {/* Employee Basic Details */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-orange-600" />
                    <span>New Employee Details</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Step 1: Enter employee identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={assigneeName}
                      onChange={(e) => {
                        setAssigneeName(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={assigneeEmail}
                      onChange={(e) => setAssigneeEmail(e.target.value)}
                      placeholder="rahul@pestcure.com"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      Phone (Optional)
                    </label>
                    <input
                      type="text"
                      value={assigneePhone}
                      onChange={(e) => setAssigneePhone(e.target.value)}
                      placeholder="+91 98110 00000"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection Mode Toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-orange-600" />
                    <span>Select Role / Weekly Report Structure</span>
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setRoleSelectionType('role_template')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        roleSelectionType === 'role_template'
                          ? 'bg-white text-orange-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      From Saved Roles ({roleTemplates.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleSelectionType('clone_member')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        roleSelectionType === 'clone_member'
                          ? 'bg-white text-orange-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Clone from Team Member
                    </button>
                  </div>
                </div>

                {roleSelectionType === 'role_template' ? (
                  /* Role Templates Cards */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {roleTemplates.map((template) => {
                      const isSelected = selectedRoleId === template.id;
                      return (
                        <div
                          key={template.id}
                          onClick={() => handleSelectRoleTemplate(template.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/60 ring-1 ring-orange-500 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h4 className="font-bold text-xs text-slate-900 leading-tight">
                              {template.roleName}
                            </h4>
                            {template.isCustom && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mb-2 truncate">
                            {template.department}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1.5 border-t border-slate-100">
                            <span>Target: <strong>₹{(template.defaultWeeklyTargetOp / 1000).toFixed(0)}k/wk</strong></span>
                            <span>Daily Calls: <strong>{template.defaultDailyTargetRenewals}/d</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Clone from Member Select */
                  <div className="space-y-2">
                    <select
                      value={selectedSourceMemberId}
                      onChange={(e) => handleSelectSourceMember(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                      {allMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.role} ({m.department})
                        </option>
                      ))}
                    </select>

                    <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 text-[11px] flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>
                        This will copy the exact daily KPIs, weekly tasks, and monthly reporting format of <strong>{currentSelectedSourceMember?.name}</strong>.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Targets Preview & Quick Adjustments */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-orange-600" />
                    <span>Baseline Targets for this User</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Can be tuned individually</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Weekly OP (₹)</label>
                    <input
                      type="number"
                      step="5000"
                      value={customWeeklyOp}
                      onChange={(e) => setCustomWeeklyOp(Number(e.target.value) || 0)}
                      className="w-full bg-white px-2 py-1 border border-slate-200 rounded text-xs font-bold text-right text-slate-800"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Weekly Strategic (₹)</label>
                    <input
                      type="number"
                      step="5000"
                      value={customWeeklySr}
                      onChange={(e) => setCustomWeeklySr(Number(e.target.value) || 0)}
                      className="w-full bg-white px-2 py-1 border border-slate-200 rounded text-xs font-bold text-right text-slate-800"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Daily Calls</label>
                    <input
                      type="number"
                      value={customDailyRenewals}
                      onChange={(e) => setCustomDailyRenewals(Number(e.target.value) || 0)}
                      className="w-full bg-white px-2 py-1 border border-slate-200 rounded text-xs font-bold text-right text-slate-800"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Daily Quotes</label>
                    <input
                      type="number"
                      value={customDailyQuotes}
                      onChange={(e) => setCustomDailyQuotes(Number(e.target.value) || 0)}
                      className="w-full bg-white px-2 py-1 border border-slate-200 rounded text-xs font-bold text-right text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  New weekly review sheet will be created and assigned immediately.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Assign &amp; Create Review Sheet</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CREATE NEW ROLE & CUSTOM REPORT */}
          {/* ========================================================================= */}
          {activeTab === 'create_new_role' && (
            <form onSubmit={handleCreateNewRoleSubmit} className="space-y-4">
              {/* Role Title & Department */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                  <span>Role Definition &amp; Department</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      New Role Title / Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={newRoleTitle}
                      onChange={(e) => {
                        setNewRoleTitle(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="e.g. Quality & Field Safety Auditor"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      Department / Operational Unit *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder="e.g. Quality Assurance & Audits"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Base Format Selection */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 text-[11px]">
                    Choose Base Review Format Style:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'customer_care' as SheetType, label: 'Customer Care', sub: 'Desk Calling & CSAT' },
                      { id: 'tender_operations' as SheetType, label: 'Tenders & GeM', sub: 'Bids & Pipeline' },
                      { id: 'commercial_bd' as SheetType, label: 'Commercial BD', sub: 'B2B & Facilities' },
                      { id: 'general_operations' as SheetType, label: 'Operations & Field', sub: 'Audits & Service' }
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => handleBaseFormatChange(fmt.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          newSheetType === fmt.id
                            ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-bold shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <p className="font-semibold text-xs leading-tight">{fmt.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{fmt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive KPI & Task Builder for this Role */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-orange-600" />
                    <span>Role Tasks &amp; KPI Configuration</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Define what this role tracks</span>
                </div>

                {/* 1. Daily KPIs */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Daily Activities &amp; Quotas ({dailyTaskList.length})
                  </label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {dailyTaskList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <span className="font-medium text-slate-800 truncate">{item.taskName}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {item.targetPerDay} / day
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDailyTask(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Daily KPI Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newDailyTaskInput}
                      onChange={(e) => setNewDailyTaskInput(e.target.value)}
                      placeholder="e.g. Chemical Dosage Verification"
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      value={newDailyTaskTarget}
                      onChange={(e) => setNewDailyTaskTarget(Number(e.target.value) || 0)}
                      placeholder="Target/day"
                      title="Target per day"
                      className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-right bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddDailyTask}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* 2. Weekly Tasks / KRAs */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Weekly KRAs &amp; Milestones ({weeklyTaskList.length})
                  </label>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {weeklyTaskList.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <span className="font-medium text-slate-800 truncate">{w.task}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                            {w.occurrence}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {w.priority}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveWeeklyTask(w.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Weekly Task Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newWeeklyTaskInput}
                      onChange={(e) => setNewWeeklyTaskInput(e.target.value)}
                      placeholder="e.g. Safety Kit Audit & Technician Briefing"
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <select
                      value={newWeeklyOccurrence}
                      onChange={(e) => setNewWeeklyOccurrence(e.target.value)}
                      className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium cursor-pointer"
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Wed & Sat">Wed &amp; Sat</option>
                      <option value="Daily">Daily</option>
                      <option value="Fortnightly">Fortnightly</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddWeeklyTask}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step C: Assign to Employee & Save to Library Options */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-xs">
                    <input
                      type="checkbox"
                      checked={assignNowToEmployee}
                      onChange={(e) => setAssignNowToEmployee(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Assign this new role to an employee right now</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={saveToLibrary}
                      onChange={(e) => setSaveToLibrary(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Save to Organization Library</span>
                  </label>
                </div>

                {assignNowToEmployee && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                        Employee Full Name *
                      </label>
                      <input
                        type="text"
                        required={assignNowToEmployee}
                        value={newRoleEmployeeName}
                        onChange={(e) => setNewRoleEmployeeName(e.target.value)}
                        placeholder="e.g. Vikram Malhotra"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                        Employee Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={newRoleEmployeeEmail}
                        onChange={(e) => setNewRoleEmployeeEmail(e.target.value)}
                        placeholder="vikram@pestcure.com"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  {saveToLibrary ? 'Will be saved in library for future employees.' : 'One-time role creation.'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Create Role &amp; Initialize Report</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
