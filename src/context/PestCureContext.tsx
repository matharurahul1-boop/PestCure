import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  MemberProfile,
  WeeklyReviewSheetData,
  TargetValues,
  TargetAuditLog,
  TargetApprovalRequest,
  WeeklyTaskItem,
  MonthlyTaskItem,
  SalesMetricRow,
  RunningAccountRow,
  AchievementItem,
  StuckRoadblockItem,
  EmployeeAttendance,
  DailyTaskMetric,
  CCTasksOverview,
  PhoneHandlingDaily,
  DailyTenderOperationMetric,
  TenderWeeklyKRAData,
  TenderPipelineMetricRow,
  BidStageComplianceRow,
  DailySalesTenderTaskRow,
  ClientFeedbackData,
  LearningImprovementData,
  WeeklySummaryData,
  ActiveNavView,
  OverdueDailyEntry,
  TaskStatusType
} from '../types';
import {
  INITIAL_MEMBERS,
  INITIAL_MEMBER_ALKA,
  INITIAL_MEMBER_KAJAL,
  INITIAL_MEMBER_DEEPIKA,
  INITIAL_AUDIT_LOGS,
  DEFAULT_TARGETS_ALKA,
  DEFAULT_TARGETS_KAJAL,
  DEFAULT_TARGETS_DEEPIKA
} from '../data/initialData';
import { safeDivision, roundToTwo } from '../utils/colorThreshold';
import {
  DailyCommercialBDMetric,
  CommercialWeeklyTaskRow,
  CommercialBDReviewTasks,
  OtherSalesChannelRow,
  VendorRegistrationMetricRow,
  RecognitionData,
  RoleTemplate
} from '../types';
import { INITIAL_ROLE_TEMPLATES } from '../data/initialRoleTemplates';
import { generateNewMemberAndSheet, NewMemberInput } from '../utils/memberSheetGenerator';

export type { ActiveNavView, NewMemberInput };
export type PeriodFilterType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface PestCureContextType {
  // Roles
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  
  // Navigation
  activeView: ActiveNavView;
  setActiveView: (view: ActiveNavView) => void;
  
  // Members List & Active Member
  allMembers: MemberProfile[];
  activeMemberId: string;
  setActiveMemberId: (id: string) => void;
  member: MemberProfile;
  addNewMemberWithSheet: (input: NewMemberInput) => MemberProfile;

  // Role Templates Library
  roleTemplates: RoleTemplate[];
  saveNewRoleTemplate: (template: RoleTemplate) => void;
  deleteRoleTemplate: (templateId: string) => void;
  
  // Sheets
  activeSheetId: string;
  setActiveSheetId: (id: string) => void;
  currentSheet: WeeklyReviewSheetData;
  allSheets: WeeklyReviewSheetData[];
  
  // Sheet updates - Attendance
  updateAttendance: (attendance: Partial<EmployeeAttendance>) => void;
  
  // Customer Care - Daily Tasks
  updateDailyCallingDay: (metricId: string, day: keyof DailyTaskMetric['days'], val: number) => void;
  updateDailyCallingTarget: (metricId: string, target: number) => void;
  addDailyCallingMetric: (taskName: string, targetPerDay: number, category?: string) => void;
  updateDailyCallingMetric: (metricId: string, updates: Partial<DailyTaskMetric>) => void;
  deleteDailyCallingMetric: (metricId: string) => void;
  updateCcOverview: (overview: Partial<CCTasksOverview>) => void;
  updatePhoneHandling: (phone: Partial<PhoneHandlingDaily>) => void;
  
  // Tender / Bidding - Daily Tender Operations (Kajal Gaur)
  // Formula: =(SUM(C10:I10)/(B10*6))*100
  updateDailyTenderOpDay: (id: string, day: keyof DailyTenderOperationMetric['days'], val: number) => void;
  updateDailyTenderOpTarget: (id: string, target: number) => void;
  updateDailyTenderOpRemarks: (id: string, remarks: string) => void;
  updateDailyTenderOp: (id: string, updates: Partial<DailyTenderOperationMetric>) => void;
  addDailyTenderOp: (task: string, targetPerDay: number) => void;
  deleteDailyTenderOp: (id: string) => void;
  
  // Tender / Bidding - Weekly KRA & Multi-site (Kajal Gaur)
  updateTenderWeeklyKRA: (updates: Partial<TenderWeeklyKRAData>) => void;
  updateServiceFeedbackSite: (index: number, updates: { site?: string; status?: string }) => void;
  addServiceFeedbackSite: (site?: string, status?: string) => void;
  deleteServiceFeedbackSite: (index: number) => void;
  updateSitePicSite: (index: number, updates: { site?: string; status?: string }) => void;
  addSitePicSite: (site?: string, status?: string) => void;
  deleteSitePicSite: (index: number) => void;
  updateExtensionSite: (index: number, updates: { site?: string; status?: string }) => void;
  addExtensionSite: (site?: string, status?: string) => void;
  deleteExtensionSite: (index: number) => void;
  updateNewAssociateLocation: (index: number, stateCity: string) => void;
  addNewAssociateLocation: (stateCity?: string) => void;
  deleteNewAssociateLocation: (index: number) => void;
  
  // Tender / Bidding - Pipeline & Bid Performance (Kajal Gaur)
  // Formula: =(C28/B28)*100
  updateTenderPipeline: (id: string, updates: Partial<TenderPipelineMetricRow>) => void;
  addTenderPipelineRow: (metric: string, target: number, actual: number, remarks?: string) => void;
  deleteTenderPipelineRow: (id: string) => void;
  
  // Tender / Bidding - Bid Stage Compliance (Kajal Gaur)
  updateBidStageCompliance: (id: string, updates: Partial<BidStageComplianceRow>) => void;
  
  // Tender / Bidding - Daily Sales Tasks (Kajal Gaur)
  // Formula: =(SUM(C50:I50)/(B50*6))*100
  updateDailySalesTenderDay: (id: string, day: keyof DailySalesTenderTaskRow['days'], val: number) => void;
  updateDailySalesTenderTarget: (id: string, target: number) => void;
  addDailySalesTenderTask: (task: string, targetPerDay: number) => void;
  deleteDailySalesTenderTask: (id: string) => void;

  // Commercial & BD - Daily Tasks (Alka Ghai)
  // Formula: =(SUM(C10:I10)/(B10*6))*100
  updateDailyCommercialDay: (id: string, day: keyof DailyCommercialBDMetric['days'], val: number) => void;
  updateDailyCommercialTarget: (id: string, target: number) => void;
  updateDailyCommercialTaskItem: (id: string, updates: Partial<DailyCommercialBDMetric>) => void;
  addDailyCommercialTask: (task: string, targetPerDay: number) => void;
  deleteDailyCommercialTask: (id: string) => void;
  copyKrasAndKpisFromMember: (sourceMemberId: string) => void;

  // Commercial & BD - Weekly Tasks (Alka Ghai)
  // Formula: =100*(F16/E16)
  updateCommercialWeeklyTask: (id: string, updates: Partial<CommercialWeeklyTaskRow>) => void;
  addCommercialWeeklyTask: (task: Omit<CommercialWeeklyTaskRow, 'id'>) => void;
  deleteCommercialWeeklyTask: (id: string) => void;

  // Commercial & BD - BD Review, Vendor & PC Products (Alka Ghai)
  updateCommercialBDReview: (section: 'vendorRegistration' | 'pcProduct' | 'bdTeamReview', field: string, value: any) => void;

  // Commercial & BD - Other Sales Channels (Alka Ghai)
  updateOtherSalesChannel: (id: string, updates: Partial<OtherSalesChannelRow>) => void;
  addOtherSalesChannel: (channel: string, target: number, achieved: number, remarks?: string) => void;
  deleteOtherSalesChannel: (id: string) => void;

  // Commercial & BD - Vendor Registration Numbers (Alka Ghai)
  updateVendorRegistrationMetric: (id: string, count: number, remarks?: string) => void;

  // Commercial & BD - Recognition (Alka Ghai)
  updateRecognition: (field: 'topPerformerSpr' | 'topPerformerOfc', updates: { name: string; remarks?: string }) => void;
  
  // Common Tasks
  updateWeeklyTask: (id: string, updates: Partial<WeeklyTaskItem>) => void;
  addWeeklyTask: (task: Omit<WeeklyTaskItem, 'id'>) => void;
  deleteWeeklyTask: (id: string) => void;
  
  // Overdue / Missed Daily Logs & Day Locks
  overdueDailyEntries: OverdueDailyEntry[];
  lockedDaysMap: Record<string, boolean>;
  toggleDayLock: (lockKey: string, lockState?: boolean) => void;
  fillAndLockDayEntry: (
    sheetId: string,
    metricType: 'tender_op' | 'tender_sales' | 'cc_calling' | 'cc_phone' | 'commercial_daily',
    metricId: string,
    dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
    value: number
  ) => void;
  submitMissedDayEntry: (entryId: string, value: number, reason?: string) => void;
  approveMissedDayEntry: (entryId: string, adjustedValue?: number, adminNotes?: string) => void;
  rejectMissedDayEntry: (entryId: string, adminNotes?: string) => void;
  batchApproveMissedDays: (entryIds: string[]) => void;
  
  updateMonthlyTask: (id: string, updates: Partial<MonthlyTaskItem>) => void;
  addMonthlyTask: (task: Omit<MonthlyTaskItem, 'id'>) => void;
  deleteMonthlyTask: (id: string) => void;
  
  // Sales & Accounts
  updateSalesMetric: (index: number, updates: Partial<SalesMetricRow>) => void;
  updateRunningAccount: (index: number, updates: Partial<RunningAccountRow>) => void;
  
  // Targets & Approval
  proposeNewTargets: (newTargets: TargetValues, notes?: string) => void;
  approveTargetProposal: (approvedTargets: TargetValues, adminFeedback?: string) => void;
  rejectTargetProposal: (adminFeedback: string) => void;
  adminDirectUpdateTargets: (newTargets: TargetValues, notes?: string) => void;
  adminToggleTargetFreeze: (frozen: boolean) => void;
  targetAuditLogs: TargetAuditLog[];
  
  // Qualitative
  updateAchievement: (id: string, text: string) => void;
  addAchievement: (text: string) => void;
  deleteAchievement: (id: string) => void;
  
  updateStuckPoint: (id: string, updates: Partial<StuckRoadblockItem>) => void;
  addStuckPoint: (item: Omit<StuckRoadblockItem, 'id'>) => void;
  deleteStuckPoint: (id: string) => void;
  
  updateClientFeedback: (feedback: Partial<ClientFeedbackData>) => void;
  updateLearningImprovement: (data: Partial<LearningImprovementData>) => void;
  updateWeeklySummary: (summary: Partial<WeeklySummaryData>) => void;
  
  // Sheet lifecycle
  submitWeeklySheet: () => void;
  createNewWeeklyCycle: () => void;
  resetAllData: () => void;
  
  // Date / Period Analytics filter
  periodFilter: PeriodFilterType;
  setPeriodFilter: (filter: PeriodFilterType) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  
  // Computed helpers for active sheet
  computedTotals: {
    // Calling / Operations sums
    renewalsTotal: number;
    renewalsTargetTotal: number;
    renewalsPct: number;
    
    quotationTotal: number;
    quotationTargetTotal: number;
    quotationPct: number;
    
    // Tender desk sums
    tenderOpsAvgPct: number;
    tenderPipelineAvgPct: number;
    tenderDailySalesTotal: number;
    tenderDailySalesTargetTotal: number;
    tenderDailySalesPct: number;
    
    // Sales value sums
    totalOpAccounts: number;
    totalOpValue: number;
    totalSrAccounts: number;
    totalSrValue: number;
    grandTotalAccounts: number;
    grandTotalRevenue: number;
    
    // Target % formulas (=100*(C57/C56), etc.)
    weeklyOpAchievementPct: number;
    weeklySrAchievementPct: number;
    monthlyOpAchievementPct: number;
    monthlySrAchievementPct: number;
    
    overallPerformancePct: number;
  };
}

const PestCureContext = createContext<PestCureContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_MEMBERS = 'pestcure_review_members_v2';
const LOCAL_STORAGE_KEY_ACTIVE_MEMBER = 'pestcure_active_member_id_v2';
const LOCAL_STORAGE_KEY_LOGS = 'pestcure_target_logs_v2';
const LOCAL_STORAGE_KEY_ROLE = 'pestcure_user_role_v2';
const LOCAL_STORAGE_KEY_LOCKED = 'pestcure_locked_days_v2';
const LOCAL_STORAGE_KEY_MISSED_SUBS = 'pestcure_missed_subs_v2';
const LOCAL_STORAGE_KEY_ROLE_TEMPLATES = 'pestcure_role_templates_v2';

export const PestCureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ROLE);
    return saved === 'admin' || saved === 'member' ? saved : 'member';
  });

  const [activeView, setActiveView] = useState<ActiveNavView>('weekly-sheet');

  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ROLE_TEMPLATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading saved role templates', err);
    }
    return INITIAL_ROLE_TEMPLATES;
  });

  const [lockedDaysMap, setLockedDaysMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LOCKED);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Error loading locked days', err);
    }
    return {};
  });

  const [missedSubmissions, setMissedSubmissions] = useState<Record<string, {
    submittedValue: number;
    reason?: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    adminNotes?: string;
    approvedAt?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_MISSED_SUBS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Error loading missed submissions', err);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_MISSED_SUBS, JSON.stringify(missedSubmissions));
    } catch (err) {
      console.error('Error saving missed submissions', err);
    }
  }, [missedSubmissions]);

  const [members, setMembers] = useState<MemberProfile[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_MEMBERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with INITIAL_MEMBERS to ensure Alka Ghai, Kajal Gaur, Deepika Gulia are all present
          const merged: MemberProfile[] = [...parsed];
          for (const initM of INITIAL_MEMBERS) {
            const idx = merged.findIndex((m) => m.id === initM.id);
            if (idx === -1) {
              merged.push(initM);
            } else {
              // Ensure sheetType and properties are preserved
              if (!merged[idx].sheetType) {
                merged[idx].sheetType = initM.sheetType;
              }
              if (!merged[idx].sheets || merged[idx].sheets.length === 0) {
                merged[idx].sheets = initM.sheets;
              }
            }
          }
          return merged;
        }
      }
    } catch (err) {
      console.error('Error loading saved members data', err);
    }
    return INITIAL_MEMBERS;
  });

  const [activeMemberId, setActiveMemberId] = useState<string>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_MEMBER);
    if (saved && members.some(m => m.id === saved)) {
      return saved;
    }
    return INITIAL_MEMBERS[0].id; // Default to Kajal Gaur
  });

  const member = members.find(m => m.id === activeMemberId) || members[0];

  const [activeSheetId, setActiveSheetId] = useState<string>(() => {
    return member.sheets[0]?.id || 'sheet-kajal-w35';
  });

  // Keep sheet ID in sync when member switches
  useEffect(() => {
    if (!member.sheets.some(s => s.id === activeSheetId)) {
      setActiveSheetId(member.sheets[0]?.id || '');
    }
  }, [activeMemberId, member]);

  const [targetAuditLogs, setTargetAuditLogs] = useState<TargetAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Error loading audit logs', err);
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Date / Period filter state
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('weekly');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-08-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-08-31');

  // Persistence
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_MEMBER, activeMemberId);
  }, [activeMemberId]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(targetAuditLogs));
  }, [targetAuditLogs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_LOCKED, JSON.stringify(lockedDaysMap));
  }, [lockedDaysMap]);

  // Current active sheet
  const currentSheet: WeeklyReviewSheetData = 
    member.sheets.find((s) => s.id === activeSheetId) || 
    member.sheets[0] || 
    INITIAL_MEMBER_KAJAL.sheets[0];

  const allSheets = member.sheets;

  // Generic helper to update the active sheet for the active member
  const updateCurrentSheetPartial = (updater: (sheet: WeeklyReviewSheetData) => WeeklyReviewSheetData) => {
    setMembers((prevMembers) => {
      return prevMembers.map((m) => {
        if (m.id === member.id) {
          const updatedSheets = m.sheets.map((s) => {
            if (s.id === currentSheet.id) {
              return {
                ...updater(s),
                updatedAt: new Date().toISOString()
              };
            }
            return s;
          });
          return {
            ...m,
            sheets: updatedSheets
          };
        }
        return m;
      });
    });
  };

  // Section 1: Attendance
  const updateAttendance = (attendanceUpdates: Partial<EmployeeAttendance>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      attendance: {
        ...sheet.attendance,
        ...attendanceUpdates
      }
    }));
  };

  // Customer Care: Calling and Quotes
  const updateDailyCallingDay = (metricId: string, day: keyof DailyTaskMetric['days'], val: number) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyTasks: {
        ...sheet.dailyTasks,
        callingAndQuotes: sheet.dailyTasks.callingAndQuotes.map((m) => {
          if (m.id === metricId) {
            return {
              ...m,
              days: {
                ...m.days,
                [day]: isNaN(val) ? 0 : Math.max(0, val)
              }
            };
          }
          return m;
        })
      }
    }));
  };

  const updateDailyCallingTarget = (metricId: string, target: number) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyTasks: {
        ...sheet.dailyTasks,
        callingAndQuotes: sheet.dailyTasks.callingAndQuotes.map((m) => {
          if (m.id === metricId) {
            return { ...m, targetPerDay: isNaN(target) ? 0 : Math.max(0, target) };
          }
          return m;
        })
      }
    }));
  };

  const addDailyCallingMetric = (taskName: string, targetPerDay: number) => {
    const newMetric: DailyTaskMetric = {
      id: `cc-${Date.now()}`,
      taskName,
      targetPerDay: isNaN(targetPerDay) ? 10 : Math.max(0, targetPerDay),
      days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
    };
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyTasks: {
        ...sheet.dailyTasks,
        callingAndQuotes: [...(sheet.dailyTasks?.callingAndQuotes || []), newMetric]
      }
    }));
  };

  const deleteDailyCallingMetric = (metricId: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyTasks: {
        ...sheet.dailyTasks,
        callingAndQuotes: (sheet.dailyTasks?.callingAndQuotes || []).filter((m) => m.id !== metricId)
      }
    }));
  };

  const updateDailyCallingMetric = (metricId: string, updates: Partial<DailyTaskMetric>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyTasks: {
        ...sheet.dailyTasks,
        callingAndQuotes: (sheet.dailyTasks?.callingAndQuotes || []).map((m) =>
          m.id === metricId ? { ...m, ...updates } : m
        )
      }
    }));
  };

  const updateCcOverview = (overviewUpdates: Partial<CCTasksOverview>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyTasks: {
        ...sheet.dailyTasks,
        ccOverview: {
          ...sheet.dailyTasks.ccOverview,
          ...overviewUpdates
        }
      }
    }));
  };

  const updatePhoneHandling = (phoneUpdates: Partial<PhoneHandlingDaily>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyTasks: {
        ...sheet.dailyTasks,
        phoneHandling: {
          ...sheet.dailyTasks.phoneHandling,
          ...phoneUpdates
        }
      }
    }));
  };

  // Tender / Bidding: Daily Tender Operations (Formula: =(SUM(C10:I10)/(B10*6))*100)
  const updateDailyTenderOpDay = (id: string, day: keyof DailyTenderOperationMetric['days'], val: number) => {
    updateCurrentSheetPartial((sheet) => {
      const ops = sheet.dailyTenderOperations || [];
      return {
        ...sheet,
        dailyTenderOperations: ops.map((op) => {
          if (op.id === id) {
            return {
              ...op,
              days: {
                ...op.days,
                [day]: isNaN(val) ? 0 : Math.max(0, val)
              }
            };
          }
          return op;
        })
      };
    });
  };

  const updateDailyTenderOpTarget = (id: string, target: number) => {
    updateCurrentSheetPartial((sheet) => {
      const ops = sheet.dailyTenderOperations || [];
      return {
        ...sheet,
        dailyTenderOperations: ops.map((op) => {
          if (op.id === id) {
            return { ...op, targetPerDay: isNaN(target) ? 0 : Math.max(0, target) };
          }
          return op;
        })
      };
    });
  };

  const updateDailyTenderOpRemarks = (id: string, remarks: string) => {
    updateCurrentSheetPartial((sheet) => {
      const ops = sheet.dailyTenderOperations || [];
      return {
        ...sheet,
        dailyTenderOperations: ops.map((op) => (op.id === id ? { ...op, remarks } : op))
      };
    });
  };

  const addDailyTenderOp = (task: string, targetPerDay: number) => {
    const newOp: DailyTenderOperationMetric = {
      id: `dto-${Date.now()}`,
      task,
      targetPerDay,
      days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      remarks: ''
    };
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyTenderOperations: [...(sheet.dailyTenderOperations || []), newOp]
    }));
  };

  const deleteDailyTenderOp = (id: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyTenderOperations: (sheet.dailyTenderOperations || []).filter((o) => o.id !== id)
    }));
  };

  const updateDailyTenderOp = (id: string, updates: Partial<DailyTenderOperationMetric>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyTenderOperations: (sheet.dailyTenderOperations || []).map((o) =>
        o.id === id ? { ...o, ...updates } : o
      )
    }));
  };

  // Tender / Bidding: Weekly KRA
  const updateTenderWeeklyKRA = (updates: Partial<TenderWeeklyKRAData>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      tenderWeeklyKRA: {
        ...(sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!),
        ...updates
      }
    }));
  };

  const updateServiceFeedbackSite = (index: number, updates: { site?: string; status?: string }) => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      const feedbacks = [...kra.serviceFeedbacks];
      if (feedbacks[index]) {
        feedbacks[index] = { ...feedbacks[index], ...updates };
      }
      return {
        ...sheet,
        tenderWeeklyKRA: { ...kra, serviceFeedbacks: feedbacks }
      };
    });
  };

  const addServiceFeedbackSite = (site: string = 'New Tender Site', status: string = 'Pending') => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      return {
        ...sheet,
        tenderWeeklyKRA: {
          ...kra,
          serviceFeedbacks: [...kra.serviceFeedbacks, { id: `sf-${Date.now()}`, site, status: status as TaskStatusType }]
        }
      };
    });
  };

  const deleteServiceFeedbackSite = (index: number) => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      return {
        ...sheet,
        tenderWeeklyKRA: {
          ...kra,
          serviceFeedbacks: kra.serviceFeedbacks.filter((_, i) => i !== index)
        }
      };
    });
  };

  const updateSitePicSite = (index: number, updates: { site?: string; status?: string }) => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      const pics = [...kra.sitePics];
      if (pics[index]) {
        pics[index] = { ...pics[index], ...updates };
      }
      return {
        ...sheet,
        tenderWeeklyKRA: { ...kra, sitePics: pics }
      };
    });
  };

  const addSitePicSite = (site: string = 'New Site Location', status: string = 'Pending') => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      return {
        ...sheet,
        tenderWeeklyKRA: {
          ...kra,
          sitePics: [...kra.sitePics, { id: `pic-${Date.now()}`, site, status: status as TaskStatusType }]
        }
      };
    });
  };

  const deleteSitePicSite = (index: number) => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      return {
        ...sheet,
        tenderWeeklyKRA: {
          ...kra,
          sitePics: kra.sitePics.filter((_, i) => i !== index)
        }
      };
    });
  };

  const updateExtensionSite = (index: number, updates: { site?: string; status?: string }) => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      const exts = [...kra.extensionAtTenderSites];
      if (exts[index]) {
        exts[index] = { ...exts[index], ...updates };
      }
      return {
        ...sheet,
        tenderWeeklyKRA: { ...kra, extensionAtTenderSites: exts }
      };
    });
  };

  const addExtensionSite = (site: string = 'Tender Project Extension', status: string = 'Under Discussion') => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      return {
        ...sheet,
        tenderWeeklyKRA: {
          ...kra,
          extensionAtTenderSites: [...kra.extensionAtTenderSites, { id: `ext-${Date.now()}`, site, status: status as TaskStatusType }]
        }
      };
    });
  };

  const deleteExtensionSite = (index: number) => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      return {
        ...sheet,
        tenderWeeklyKRA: {
          ...kra,
          extensionAtTenderSites: kra.extensionAtTenderSites.filter((_, i) => i !== index)
        }
      };
    });
  };

  const updateNewAssociateLocation = (index: number, stateCity: string) => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      const associates = [...kra.newAssociatesSearch];
      if (associates[index]) {
        associates[index] = { ...associates[index], stateCity };
      }
      return {
        ...sheet,
        tenderWeeklyKRA: { ...kra, newAssociatesSearch: associates }
      };
    });
  };

  const addNewAssociateLocation = (stateCity: string = 'New City / State') => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      return {
        ...sheet,
        tenderWeeklyKRA: {
          ...kra,
          newAssociatesSearch: [...kra.newAssociatesSearch, { id: `assoc-${Date.now()}`, stateCity }]
        }
      };
    });
  };

  const deleteNewAssociateLocation = (index: number) => {
    updateCurrentSheetPartial((sheet) => {
      const kra = sheet.tenderWeeklyKRA || INITIAL_MEMBER_KAJAL.sheets[0].tenderWeeklyKRA!;
      return {
        ...sheet,
        tenderWeeklyKRA: {
          ...kra,
          newAssociatesSearch: kra.newAssociatesSearch.filter((_, i) => i !== index)
        }
      };
    });
  };

  // Tender / Bidding: Pipeline (Formula: =(C28/B28)*100)
  const updateTenderPipeline = (id: string, updates: Partial<TenderPipelineMetricRow>) => {
    updateCurrentSheetPartial((sheet) => {
      const pipeline = sheet.tenderPipeline || [];
      return {
        ...sheet,
        tenderPipeline: pipeline.map((p) => (p.id === id ? { ...p, ...updates } : p))
      };
    });
  };

  const addTenderPipelineRow = (metric: string, target: number, actual: number, remarks: string = '') => {
    const newRow: TenderPipelineMetricRow = {
      id: `pipe-${Date.now()}`,
      metric,
      target: isNaN(target) ? 5 : Math.max(0, target),
      actual: isNaN(actual) ? 0 : Math.max(0, actual),
      status: 'In Progress',
      remarks
    };
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      tenderPipeline: [...(sheet.tenderPipeline || []), newRow]
    }));
  };

  const deleteTenderPipelineRow = (id: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      tenderPipeline: (sheet.tenderPipeline || []).filter((p) => p.id !== id)
    }));
  };

  // Tender / Bidding: Bid Stage Compliance
  const updateBidStageCompliance = (id: string, updates: Partial<BidStageComplianceRow>) => {
    updateCurrentSheetPartial((sheet) => {
      const list = sheet.bidStageCompliance || [];
      return {
        ...sheet,
        bidStageCompliance: list.map((b) => (b.id === id ? { ...b, ...updates } : b))
      };
    });
  };

  // Tender / Bidding: Daily Sales Tasks (Formula: =(SUM(C50:I50)/(B50*6))*100)
  const updateDailySalesTenderDay = (id: string, day: keyof DailySalesTenderTaskRow['days'], val: number) => {
    updateCurrentSheetPartial((sheet) => {
      const list = sheet.dailySalesTenderTasks || [];
      return {
        ...sheet,
        dailySalesTenderTasks: list.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              days: {
                ...item.days,
                [day]: isNaN(val) ? 0 : Math.max(0, val)
              }
            };
          }
          return item;
        })
      };
    });
  };

  const updateDailySalesTenderTarget = (id: string, target: number) => {
    updateCurrentSheetPartial((sheet) => {
      const list = sheet.dailySalesTenderTasks || [];
      return {
        ...sheet,
        dailySalesTenderTasks: list.map((item) => {
          if (item.id === id) {
            return { ...item, targetPerDay: isNaN(target) ? 0 : Math.max(0, target) };
          }
          return item;
        })
      };
    });
  };

  const addDailySalesTenderTask = (task: string, targetPerDay: number) => {
    const newRow: DailySalesTenderTaskRow = {
      id: `dst-${Date.now()}`,
      task,
      targetPerDay: isNaN(targetPerDay) ? 5 : Math.max(0, targetPerDay),
      days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 }
    };
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailySalesTenderTasks: [...(sheet.dailySalesTenderTasks || []), newRow]
    }));
  };

  const deleteDailySalesTenderTask = (id: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailySalesTenderTasks: (sheet.dailySalesTenderTasks || []).filter((item) => item.id !== id)
    }));
  };

  // Commercial & BD: Daily Tasks (Alka Ghai - Formula: =(SUM(C10:I10)/(B10*6))*100)
  const updateDailyCommercialDay = (id: string, day: keyof DailyCommercialBDMetric['days'], val: number) => {
    updateCurrentSheetPartial((sheet) => {
      const list = sheet.dailyCommercialTasks || [];
      return {
        ...sheet,
        dailyCommercialTasks: list.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              days: {
                ...item.days,
                [day]: isNaN(val) ? 0 : Math.max(0, val)
              }
            };
          }
          return item;
        })
      };
    });
  };

  const updateDailyCommercialTarget = (id: string, target: number) => {
    updateCurrentSheetPartial((sheet) => {
      const list = sheet.dailyCommercialTasks || [];
      return {
        ...sheet,
        dailyCommercialTasks: list.map((item) => {
          if (item.id === id) {
            return { ...item, targetPerDay: isNaN(target) ? 0 : Math.max(0, target) };
          }
          return item;
        })
      };
    });
  };

  const addDailyCommercialTask = (task: string, targetPerDay: number) => {
    const newTask: DailyCommercialBDMetric = {
      id: `dcb-${Date.now()}`,
      task,
      targetPerDay: Math.max(1, targetPerDay),
      days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 }
    };
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyCommercialTasks: [...(sheet.dailyCommercialTasks || []), newTask]
    }));
  };

  const deleteDailyCommercialTask = (id: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyCommercialTasks: (sheet.dailyCommercialTasks || []).filter((t) => t.id !== id)
    }));
  };

  const updateDailyCommercialTaskItem = (id: string, updates: Partial<DailyCommercialBDMetric>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyCommercialTasks: (sheet.dailyCommercialTasks || []).map((t) =>
        t.id === id ? { ...t, ...updates } : t
      )
    }));
  };

  const copyKrasAndKpisFromMember = (sourceMemberId: string) => {
    const srcMember = members.find((m) => m.id === sourceMemberId);
    if (!srcMember || !srcMember.sheets || !srcMember.sheets[0]) return;
    const srcSheet = srcMember.sheets[0];

    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      dailyTasks: {
        ...sheet.dailyTasks,
        callingAndQuotes: srcSheet.dailyTasks?.callingAndQuotes?.map((dq, idx) => ({
          ...dq,
          id: `dq-${Date.now()}-${idx + 1}`,
          days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
        })) || sheet.dailyTasks?.callingAndQuotes || []
      },
      dailyTenderOperations: srcSheet.dailyTenderOperations?.map((dto, idx) => ({
        ...dto,
        id: `dto-${Date.now()}-${idx + 1}`,
        days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
        remarks: ''
      })) || sheet.dailyTenderOperations,
      dailyCommercialTasks: srcSheet.dailyCommercialTasks?.map((dct, idx) => ({
        ...dct,
        id: `dct-${Date.now()}-${idx + 1}`,
        days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 }
      })) || sheet.dailyCommercialTasks,
      weeklyTasks: srcSheet.weeklyTasks?.map((wt, idx) => ({
        ...wt,
        id: `wt-${Date.now()}-${idx + 1}`,
        status: 'In Progress'
      })) || sheet.weeklyTasks,
      commercialWeeklyTasks: srcSheet.commercialWeeklyTasks?.map((cwt, idx) => ({
        ...cwt,
        id: `cwt-${Date.now()}-${idx + 1}`,
        actual: 0,
        status: 'In Progress'
      })) || sheet.commercialWeeklyTasks
    }));
  };

  // Commercial & BD: Weekly Tasks (Alka Ghai - Formula: =100*(F16/E16))
  const updateCommercialWeeklyTask = (id: string, updates: Partial<CommercialWeeklyTaskRow>) => {
    updateCurrentSheetPartial((sheet) => {
      const list = sheet.commercialWeeklyTasks || [];
      return {
        ...sheet,
        commercialWeeklyTasks: list.map((t) => (t.id === id ? { ...t, ...updates } : t))
      };
    });
  };

  const addCommercialWeeklyTask = (taskData: Omit<CommercialWeeklyTaskRow, 'id'>) => {
    const newTask: CommercialWeeklyTaskRow = {
      ...taskData,
      id: `cwt-${Date.now()}`
    };
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      commercialWeeklyTasks: [...(sheet.commercialWeeklyTasks || []), newTask]
    }));
  };

  const deleteCommercialWeeklyTask = (id: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      commercialWeeklyTasks: (sheet.commercialWeeklyTasks || []).filter((t) => t.id !== id)
    }));
  };

  // Commercial & BD: BD Review, Vendor & PC Products
  const updateCommercialBDReview = (
    section: 'vendorRegistration' | 'pcProduct' | 'bdTeamReview',
    field: string,
    value: any
  ) => {
    updateCurrentSheetPartial((sheet) => {
      const currentReview = sheet.commercialBDReview || {
        vendorRegistration: { vendorsAdded: '', remarks: '' },
        pcProduct: { productsAddedInfo: '', productSaleValue: 0, remarks: '' },
        bdTeamReview: { teamAchievements: '', majorIssue: '', suggestion: '' }
      };

      return {
        ...sheet,
        commercialBDReview: {
          ...currentReview,
          [section]: {
            ...currentReview[section],
            [field]: value
          }
        }
      };
    });
  };

  // Commercial & BD: Other Sales Channels
  const updateOtherSalesChannel = (id: string, updates: Partial<OtherSalesChannelRow>) => {
    updateCurrentSheetPartial((sheet) => {
      const list = sheet.otherSalesChannels || [];
      return {
        ...sheet,
        otherSalesChannels: list.map((c) => (c.id === id ? { ...c, ...updates } : c))
      };
    });
  };

  const addOtherSalesChannel = (channel: string, target: number, achieved: number, remarks?: string) => {
    const newChannel: OtherSalesChannelRow = {
      id: `osc-${Date.now()}`,
      channel,
      target: Math.max(0, target),
      achieved: Math.max(0, achieved),
      remarks: remarks || ''
    };
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      otherSalesChannels: [...(sheet.otherSalesChannels || []), newChannel]
    }));
  };

  const deleteOtherSalesChannel = (id: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      otherSalesChannels: (sheet.otherSalesChannels || []).filter((c) => c.id !== id)
    }));
  };

  // Commercial & BD: Vendor Registration Numbers
  const updateVendorRegistrationMetric = (id: string, count: number, remarks?: string) => {
    updateCurrentSheetPartial((sheet) => {
      const list = sheet.vendorRegistrationMetrics || [];
      return {
        ...sheet,
        vendorRegistrationMetrics: list.map((v) =>
          v.id === id ? { ...v, count: isNaN(count) ? 0 : count, ...(remarks !== undefined ? { remarks } : {}) } : v
        )
      };
    });
  };

  // Commercial & BD: Recognition
  const updateRecognition = (field: 'topPerformerSpr' | 'topPerformerOfc', updates: { name: string; remarks?: string }) => {
    updateCurrentSheetPartial((sheet) => {
      const currentRec = sheet.recognition || {
        topPerformerSpr: { name: '', remarks: '' },
        topPerformerOfc: { name: '', remarks: '' }
      };
      return {
        ...sheet,
        recognition: {
          ...currentRec,
          [field]: {
            ...currentRec[field],
            ...updates
          }
        }
      };
    });
  };

  // Weekly Tasks
  const updateWeeklyTask = (id: string, updates: Partial<WeeklyTaskItem>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      weeklyTasks: sheet.weeklyTasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    }));
  };

  const addWeeklyTask = (taskData: Omit<WeeklyTaskItem, 'id'>) => {
    const newTask: WeeklyTaskItem = {
      ...taskData,
      id: `wt-${Date.now()}`
    };
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      weeklyTasks: [...sheet.weeklyTasks, newTask]
    }));
  };

  const deleteWeeklyTask = (id: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      weeklyTasks: sheet.weeklyTasks.filter((t) => t.id !== id)
    }));
  };

  // Monthly Tasks
  const updateMonthlyTask = (id: string, updates: Partial<MonthlyTaskItem>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      monthlyTasks: sheet.monthlyTasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    }));
  };

  const addMonthlyTask = (taskData: Omit<MonthlyTaskItem, 'id'>) => {
    const newTask: MonthlyTaskItem = {
      ...taskData,
      id: `mt-${Date.now()}`
    };
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      monthlyTasks: [...sheet.monthlyTasks, newTask]
    }));
  };

  const deleteMonthlyTask = (id: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      monthlyTasks: sheet.monthlyTasks.filter((t) => t.id !== id)
    }));
  };

  // Sales Metrics
  const updateSalesMetric = (index: number, updates: Partial<SalesMetricRow>) => {
    updateCurrentSheetPartial((sheet) => {
      const updated = [...sheet.salesMetrics];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...updates };
      }
      return { ...sheet, salesMetrics: updated };
    });
  };

  // Running Accounts
  const updateRunningAccount = (index: number, updates: Partial<RunningAccountRow>) => {
    updateCurrentSheetPartial((sheet) => {
      const updated = [...sheet.runningAccounts];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...updates };
      }
      return { ...sheet, runningAccounts: updated };
    });
  };

  // Day Locking & Overdue Fill Handlers
  const toggleDayLock = (lockKey: string, lockState?: boolean) => {
    setLockedDaysMap((prev) => {
      const nextState = lockState !== undefined ? lockState : !prev[lockKey];
      return {
        ...prev,
        [lockKey]: nextState
      };
    });
  };

  const fillAndLockDayEntry = (
    sheetId: string,
    metricType: 'tender_op' | 'tender_sales' | 'cc_calling' | 'cc_phone' | 'commercial_daily',
    metricId: string,
    dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
    value: number
  ) => {
    const safeVal = isNaN(value) ? 0 : Math.max(0, value);
    const lockKey = `${sheetId}_${metricId}_${dayKey}`;

    // 1. Mark this entry as locked
    setLockedDaysMap((prev) => ({
      ...prev,
      [lockKey]: true,
      [`${sheetId}_${dayKey}`]: true
    }));

    // 2. Update the target sheet
    setMembers((prevMembers) => {
      return prevMembers.map((m) => {
        if (m.id === member.id) {
          const updatedSheets = m.sheets.map((s) => {
            if (s.id === sheetId) {
              const updatedSheet = { ...s };

              if (metricType === 'tender_op' && updatedSheet.dailyTenderOperations) {
                updatedSheet.dailyTenderOperations = updatedSheet.dailyTenderOperations.map((dto) => {
                  if (dto.id === metricId) {
                    return {
                      ...dto,
                      days: {
                        ...dto.days,
                        [dayKey]: safeVal
                      }
                    };
                  }
                  return dto;
                });
              } else if (metricType === 'tender_sales' && updatedSheet.dailySalesTenderTasks) {
                updatedSheet.dailySalesTenderTasks = updatedSheet.dailySalesTenderTasks.map((dst) => {
                  if (dst.id === metricId) {
                    return {
                      ...dst,
                      days: {
                        ...dst.days,
                        [dayKey]: safeVal
                      }
                    };
                  }
                  return dst;
                });
              } else if (metricType === 'cc_calling' && updatedSheet.dailyTasks?.callingAndQuotes) {
                updatedSheet.dailyTasks = {
                  ...updatedSheet.dailyTasks,
                  callingAndQuotes: updatedSheet.dailyTasks.callingAndQuotes.map((dq) => {
                    if (dq.id === metricId) {
                      return {
                        ...dq,
                        days: {
                          ...dq.days,
                          [dayKey]: safeVal
                        }
                      };
                    }
                    return dq;
                  })
                };
              } else if (metricType === 'commercial_daily' && updatedSheet.dailyCommercialTasks) {
                updatedSheet.dailyCommercialTasks = updatedSheet.dailyCommercialTasks.map((dct) => {
                  if (dct.id === metricId) {
                    return {
                      ...dct,
                      days: {
                        ...dct.days,
                        [dayKey]: safeVal
                      }
                    };
                  }
                  return dct;
                });
              }

              return {
                ...updatedSheet,
                updatedAt: new Date().toISOString()
              };
            }
            return s;
          });

          return {
            ...m,
            sheets: updatedSheets
          };
        }
        return m;
      });
    });
  };

  const submitMissedDayEntry = (entryId: string, value: number, reason?: string) => {
    const safeVal = isNaN(value) ? 0 : Math.max(0, value);
    setMissedSubmissions((prev) => ({
      ...prev,
      [entryId]: {
        submittedValue: safeVal,
        reason: reason || 'Submitted by team member for administrative approval',
        submittedAt: new Date().toISOString(),
        status: 'pending'
      }
    }));
  };

  const approveMissedDayEntry = (entryId: string, adjustedValue?: number, adminNotes?: string) => {
    const entry = overdueDailyEntries.find((e) => e.id === entryId);
    const existingSub = missedSubmissions[entryId];
    const finalVal = adjustedValue !== undefined ? adjustedValue : (existingSub?.submittedValue ?? (entry?.targetPerDay || 0));

    if (entry) {
      fillAndLockDayEntry(
        entry.sheetId,
        entry.metricType,
        entry.metricId,
        entry.dayKey,
        finalVal
      );
    }

    setMissedSubmissions((prev) => ({
      ...prev,
      [entryId]: {
        submittedValue: finalVal,
        reason: existingSub?.reason || 'Approved by Admin',
        submittedAt: existingSub?.submittedAt || new Date().toISOString(),
        status: 'approved',
        adminNotes: adminNotes || 'Approved by Admin',
        approvedAt: new Date().toISOString()
      }
    }));

    // Add audit log
    const newLog: TargetAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Approved',
      actorName: 'Admin / Operations Lead',
      actorRole: 'admin',
      previousTargets: member.approvedTargets,
      newTargets: member.approvedTargets,
      notes: `Approved missed daily log for ${entry?.metricTitle || 'Metric'} (${entry?.dayLabel}): ${finalVal} logged & locked.`
    };
    setTargetAuditLogs((prev) => [newLog, ...prev]);
  };

  const rejectMissedDayEntry = (entryId: string, adminNotes?: string) => {
    setMissedSubmissions((prev) => {
      const existing = prev[entryId];
      return {
        ...prev,
        [entryId]: {
          submittedValue: existing?.submittedValue || 0,
          reason: existing?.reason || '',
          submittedAt: existing?.submittedAt || new Date().toISOString(),
          status: 'rejected',
          adminNotes: adminNotes || 'Requires revision'
        }
      };
    });
  };

  const batchApproveMissedDays = (entryIds: string[]) => {
    entryIds.forEach((id) => approveMissedDayEntry(id));
  };

  const addNewMemberWithSheet = (input: NewMemberInput): MemberProfile => {
    const newMember = generateNewMemberAndSheet(input);
    setMembers((prev) => {
      const updated = [newMember, ...prev];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_MEMBERS, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save members to localStorage', err);
      }
      return updated;
    });
    setActiveMemberId(newMember.id);
    if (newMember.sheets && newMember.sheets[0]) {
      setActiveSheetId(newMember.sheets[0].id);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_MEMBER, newMember.id);
    return newMember;
  };

  const saveNewRoleTemplate = (newTemplate: RoleTemplate) => {
    setRoleTemplates((prev) => {
      const exists = prev.some((r) => r.id === newTemplate.id);
      const updated = exists
        ? prev.map((r) => (r.id === newTemplate.id ? newTemplate : r))
        : [...prev, newTemplate];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_ROLE_TEMPLATES, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving role templates', e);
      }
      return updated;
    });
  };

  const deleteRoleTemplate = (templateId: string) => {
    setRoleTemplates((prev) => {
      const updated = prev.filter((r) => r.id !== templateId);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_ROLE_TEMPLATES, JSON.stringify(updated));
      } catch (e) {
        console.error('Error deleting role template', e);
      }
      return updated;
    });
  };

  // Target Workflow
  const proposeNewTargets = (newTargets: TargetValues, notes?: string) => {
    const proposal: TargetApprovalRequest = {
      id: `prop-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      proposedBy: userRole,
      proposedAt: new Date().toISOString(),
      status: 'waiting_approval',
      proposedTargets: newTargets,
      adminFeedback: notes
    };

    const newLog: TargetAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Proposed',
      actorName: userRole === 'admin' ? 'Admin / Manager' : member.name,
      actorRole: userRole,
      previousTargets: member.approvedTargets,
      newTargets,
      notes: notes || `Target proposal for ${member.name}`
    };

    setTargetAuditLogs((prev) => [newLog, ...prev]);

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === member.id) {
          return {
            ...m,
            pendingTargetProposal: proposal,
            sheets: m.sheets.map((s) => {
              if (s.id === currentSheet.id) {
                return {
                  ...s,
                  targets: newTargets,
                  targetApprovalStatus: 'waiting_approval'
                };
              }
              return s;
            })
          };
        }
        return m;
      })
    );
  };

  const approveTargetProposal = (approvedTargets: TargetValues, adminFeedback?: string) => {
    const newLog: TargetAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Approved',
      actorName: 'Admin / Managing Director',
      actorRole: 'admin',
      previousTargets: member.approvedTargets,
      newTargets: approvedTargets,
      notes: adminFeedback || `Approved targets for ${member.name} (Frozen for regular member editing)`
    };

    setTargetAuditLogs((prev) => [newLog, ...prev]);

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === member.id) {
          return {
            ...m,
            approvedTargets,
            isTargetFrozen: true,
            pendingTargetProposal: undefined,
            sheets: m.sheets.map((s) => {
              if (s.id === currentSheet.id) {
                return {
                  ...s,
                  targets: approvedTargets,
                  targetApprovalStatus: 'approved',
                  isTargetFrozen: true
                };
              }
              return s;
            })
          };
        }
        return m;
      })
    );
  };

  const adminDirectUpdateTargets = (newTargets: TargetValues, notes?: string) => {
    const newLog: TargetAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Modified & Approved',
      actorName: 'Admin / Managing Director',
      actorRole: 'admin',
      previousTargets: member.approvedTargets,
      newTargets,
      notes: notes || `Direct target recalibration by Admin for ${member.name}`
    };

    setTargetAuditLogs((prev) => [newLog, ...prev]);

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === member.id) {
          return {
            ...m,
            approvedTargets: newTargets,
            isTargetFrozen: true,
            pendingTargetProposal: undefined,
            sheets: m.sheets.map((s) => {
              if (s.id === currentSheet.id) {
                return {
                  ...s,
                  targets: newTargets,
                  targetApprovalStatus: 'approved',
                  isTargetFrozen: true
                };
              }
              return s;
            })
          };
        }
        return m;
      })
    );
  };

  const adminToggleTargetFreeze = (frozen: boolean) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === member.id) {
          return {
            ...m,
            isTargetFrozen: frozen,
            sheets: m.sheets.map((s) => {
              if (s.id === currentSheet.id) {
                return {
                  ...s,
                  isTargetFrozen: frozen
                };
              }
              return s;
            })
          };
        }
        return m;
      })
    );
  };

  const rejectTargetProposal = (adminFeedback: string) => {
    const newLog: TargetAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Rejected',
      actorName: 'Admin / Manager',
      actorRole: 'admin',
      previousTargets: member.approvedTargets,
      newTargets: member.approvedTargets,
      notes: adminFeedback || `Target proposal returned for revision (${member.name}).`
    };

    setTargetAuditLogs((prev) => [newLog, ...prev]);

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === member.id) {
          return {
            ...m,
            pendingTargetProposal: undefined,
            sheets: m.sheets.map((s) => {
              if (s.id === currentSheet.id) {
                return {
                  ...s,
                  targetApprovalStatus: 'rejected'
                };
              }
              return s;
            })
          };
        }
        return m;
      })
    );
  };

  // Achievements
  const updateAchievement = (id: string, text: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      achievements: sheet.achievements.map((a) => (a.id === id ? { ...a, text } : a))
    }));
  };

  const addAchievement = (text: string) => {
    const newAch: AchievementItem = { id: `ach-${Date.now()}`, text };
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      achievements: [...sheet.achievements, newAch]
    }));
  };

  const deleteAchievement = (id: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      achievements: sheet.achievements.filter((a) => a.id !== id)
    }));
  };

  // Stuck Points
  const updateStuckPoint = (id: string, updates: Partial<StuckRoadblockItem>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      stuckPoints: sheet.stuckPoints.map((sp) => (sp.id === id ? { ...sp, ...updates } : sp))
    }));
  };

  const addStuckPoint = (itemData: Omit<StuckRoadblockItem, 'id'>) => {
    const newItem: StuckRoadblockItem = { id: `sp-${Date.now()}`, ...itemData };
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      stuckPoints: [...sheet.stuckPoints, newItem]
    }));
  };

  const deleteStuckPoint = (id: string) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      stuckPoints: sheet.stuckPoints.filter((sp) => sp.id !== id)
    }));
  };

  // Feedback & Improvements
  const updateClientFeedback = (feedbackUpdates: Partial<ClientFeedbackData>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      clientFeedback: {
        ...sheet.clientFeedback,
        ...feedbackUpdates
      }
    }));
  };

  const updateLearningImprovement = (learningUpdates: Partial<LearningImprovementData>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      learningImprovement: {
        ...sheet.learningImprovement,
        ...learningUpdates
      }
    }));
  };

  const updateWeeklySummary = (summaryUpdates: Partial<WeeklySummaryData>) => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      weeklySummary: {
        ...sheet.weeklySummary,
        ...summaryUpdates
      }
    }));
  };

  // Sheet Lifecycle
  const submitWeeklySheet = () => {
    updateCurrentSheetPartial((sheet) => ({
      ...sheet,
      status: 'submitted',
      submittedAt: new Date().toISOString()
    }));
  };

  const createNewWeeklyCycle = () => {
    const cycleNum = member.sheets.length + 35;
    const today = new Date();
    const nextStart = new Date(today);
    nextStart.setDate(today.getDate() + 1);
    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextStart.getDate() + 6);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const formatLabel = (s: Date, e: Date) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `Week ${cycleNum}: ${monthNames[s.getMonth()]} ${s.getDate()} – ${monthNames[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
    };

    const newSheet: WeeklyReviewSheetData = {
      ...currentSheet,
      id: `sheet-${member.id}-w${cycleNum}`,
      cycleId: `cycle-w${cycleNum}`,
      cycleLabel: formatLabel(nextStart, nextEnd),
      isCurrent: true,
      status: 'draft',
      attendance: {
        ...currentSheet.attendance,
        reviewDate: formatDate(nextEnd),
        periodStart: formatDate(nextStart),
        periodEnd: formatDate(nextEnd),
        leaves: 0,
        lates: 0,
        shHd: 0
      },
      dailyTenderOperations: currentSheet.dailyTenderOperations?.map((dto) => ({
        ...dto,
        days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
        remarks: ''
      })),
      dailySalesTenderTasks: currentSheet.dailySalesTenderTasks?.map((dst) => ({
        ...dst,
        days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 }
      })),
      dailyTasks: {
        ...currentSheet.dailyTasks,
        callingAndQuotes: currentSheet.dailyTasks.callingAndQuotes.map((m) => ({
          ...m,
          days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
        })),
        phoneHandling: { whatsapp: 0, msgs: 0, leads: 0, finalized: 0, amount: 0, remarks: '' }
      },
      salesMetrics: currentSheet.salesMetrics.map((sm) => ({
        ...sm,
        opFinalCount: 0,
        opValue: 0,
        srFinalCount: 0,
        srValue: 0,
        remarks: ''
      })),
      runningAccounts: currentSheet.runningAccounts.map((ra) => ({
        ...ra,
        dealsCalledCount: 0,
        pendingAmount: ra.pendingAmount,
        amountReceivedThisWeek: 0,
        remarks: ''
      })),
      achievements: [
        { id: `ach-${Date.now()}-1`, text: '' },
        { id: `ach-${Date.now()}-2`, text: '' }
      ],
      stuckPoints: [],
      clientFeedback: { testimonial: '', rating: 5 },
      learningImprovement: { newImplemented: '', anythingElse: '' },
      weeklySummary: {
        avgDailyTaskCompletion: 0,
        avgWeeklyTaskAchievement: 0,
        analysis: '',
        reviewedBy: 'Operations Director',
        reviewDate: formatDate(nextEnd)
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: undefined
    };

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === member.id) {
          return {
            ...m,
            sheets: [newSheet, ...m.sheets.map((s) => ({ ...s, isCurrent: false }))]
          };
        }
        return m;
      })
    );

    setActiveSheetId(newSheet.id);
  };

  const resetAllData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_MEMBERS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE_MEMBER);
    localStorage.removeItem(LOCAL_STORAGE_KEY_LOGS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ROLE);
    setMembers(INITIAL_MEMBERS);
    setActiveMemberId(INITIAL_MEMBERS[0].id);
    setActiveSheetId(INITIAL_MEMBERS[0].sheets[0].id);
    setTargetAuditLogs(INITIAL_AUDIT_LOGS);
    setUserRole('member');
  };

  // Computations
  const isTender = currentSheet.sheetType === 'tender_operations' || currentSheet.dailyTenderOperations !== undefined;
  const isCommercial = currentSheet.sheetType === 'commercial_bd' || currentSheet.dailyCommercialTasks !== undefined;

  // 1. Customer Care Daily Calls
  const dqRenewals = currentSheet.dailyTasks?.callingAndQuotes?.find((m) => m.taskName.includes('Renewal')) || currentSheet.dailyTasks?.callingAndQuotes?.[0];
  const dqQuotes = currentSheet.dailyTasks?.callingAndQuotes?.find((m) => m.taskName.includes('Quotation')) || currentSheet.dailyTasks?.callingAndQuotes?.[1];

  const sumDays = (d: { mon?: number; tue?: number; wed?: number; thu?: number; fri?: number; sat?: number; sun?: number }) =>
    (d.mon || 0) + (d.tue || 0) + (d.wed || 0) + (d.thu || 0) + (d.fri || 0) + (d.sat || 0) + (d.sun || 0);

  const renewalsTotal = dqRenewals ? sumDays(dqRenewals.days) : 0;
  const renewalsTargetTotal = (dqRenewals?.targetPerDay || 30) * 6;
  const renewalsPct = safeDivision(renewalsTotal, renewalsTargetTotal);

  const quotationTotal = dqQuotes ? sumDays(dqQuotes.days) : 0;
  const quotationTargetTotal = (dqQuotes?.targetPerDay || 12) * 6;
  const quotationPct = safeDivision(quotationTotal, quotationTargetTotal);

  // 2. Tender Daily Operations Computations
  // Formula: =(SUM(C10:I10)/(B10*6))*100
  let tenderOpsAvgPct = 0;
  if (currentSheet.dailyTenderOperations && currentSheet.dailyTenderOperations.length > 0) {
    const pcts = currentSheet.dailyTenderOperations.map((dto) => {
      const sum = sumDays(dto.days);
      const target6 = (dto.targetPerDay || 1) * 6;
      return safeDivision(sum, target6);
    });
    tenderOpsAvgPct = roundToTwo(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }

  // 3. Tender Pipeline Computations
  // Formula: =(C28/B28)*100
  let tenderPipelineAvgPct = 0;
  if (currentSheet.tenderPipeline && currentSheet.tenderPipeline.length > 0) {
    const pcts = currentSheet.tenderPipeline.map((p) => safeDivision(p.actual, p.target));
    tenderPipelineAvgPct = roundToTwo(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }

  // 4. Tender Daily Sales Computations
  // Formula: =(SUM(C50:I50)/(B50*6))*100
  let tenderDailySalesTotal = 0;
  let tenderDailySalesTargetTotal = 0;
  if (currentSheet.dailySalesTenderTasks && currentSheet.dailySalesTenderTasks.length > 0) {
    currentSheet.dailySalesTenderTasks.forEach((row) => {
      const sum = (row.days.tue || 0) + (row.days.wed || 0) + (row.days.thu || 0) + (row.days.fri || 0) + (row.days.sat || 0) + (row.days.sun || 0) + (row.days.mon || 0);
      tenderDailySalesTotal += sum;
      tenderDailySalesTargetTotal += (row.targetPerDay || 0) * 6;
    });
  }
  const tenderDailySalesPct = safeDivision(tenderDailySalesTotal, tenderDailySalesTargetTotal);

  // 5. Commercial BD: Daily Tasks Computations (Alka Ghai)
  // Formula: =(SUM(C10:I10)/(B10*6))*100
  let dailyCommercialAvgPct = 0;
  if (currentSheet.dailyCommercialTasks && currentSheet.dailyCommercialTasks.length > 0) {
    const pcts = currentSheet.dailyCommercialTasks.map((t) => {
      const sum = (t.days.tue || 0) + (t.days.wed || 0) + (t.days.thu || 0) + (t.days.fri || 0) + (t.days.sat || 0) + (t.days.sun || 0) + (t.days.mon || 0);
      const target6 = (t.targetPerDay || 1) * 6;
      return safeDivision(sum, target6);
    });
    dailyCommercialAvgPct = roundToTwo(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }

  // 6. Commercial BD: Weekly Tasks Achievement (Alka Ghai)
  // Formula: =100*(F16/E16)
  let commercialWeeklyAvgPct = 0;
  if (currentSheet.commercialWeeklyTasks && currentSheet.commercialWeeklyTasks.length > 0) {
    const valid = currentSheet.commercialWeeklyTasks.filter((t) => t.target > 0);
    if (valid.length > 0) {
      const pcts = valid.map((t) => safeDivision(t.actual, t.target));
      commercialWeeklyAvgPct = roundToTwo(pcts.reduce((a, b) => a + b, 0) / valid.length);
    }
  }

  // 7. Commercial BD: Other Sales Channels Achievement
  let otherSalesAvgPct = 0;
  if (currentSheet.otherSalesChannels && currentSheet.otherSalesChannels.length > 0) {
    const valid = currentSheet.otherSalesChannels.filter((c) => c.target > 0);
    if (valid.length > 0) {
      const pcts = valid.map((c) => safeDivision(c.achieved, c.target));
      otherSalesAvgPct = roundToTwo(pcts.reduce((a, b) => a + b, 0) / valid.length);
    }
  }

  // Sales totals
  const totalOpAccounts = currentSheet.salesMetrics.reduce((sum, r) => sum + (Number(r.opFinalCount) || 0), 0);
  const totalOpValue = currentSheet.salesMetrics.reduce((sum, r) => sum + (Number(r.opValue) || 0), 0);
  const totalSrAccounts = currentSheet.salesMetrics.reduce((sum, r) => sum + (Number(r.srFinalCount) || 0), 0);
  const totalSrValue = currentSheet.salesMetrics.reduce((sum, r) => sum + (Number(r.srValue) || 0), 0);
  const grandTotalAccounts = totalOpAccounts + totalSrAccounts;
  const grandTotalRevenue = totalOpValue + totalSrValue;

  // Target Achievement: Weekly & Monthly OP/SR
  const weeklyOpAchievementPct = safeDivision(
    currentSheet.targets.weeklyAchievedOp,
    currentSheet.targets.weeklyTargetOp
  );
  const weeklySrAchievementPct = safeDivision(
    currentSheet.targets.weeklyAchievedSr,
    currentSheet.targets.weeklyTargetSr
  );

  const monthlyOpAchievementPct = safeDivision(
    currentSheet.targets.monthlyAchievedOp,
    currentSheet.targets.monthlyTargetOp
  );
  const monthlySrAchievementPct = safeDivision(
    currentSheet.targets.monthlyAchievedSr,
    currentSheet.targets.monthlyTargetSr
  );

  // Overall Performance Score (rounded to 2 decimal places max)
  let overallPerformancePct = 0;
  if (isCommercial) {
    overallPerformancePct = roundToTwo(
      (dailyCommercialAvgPct * 0.3) +
      (commercialWeeklyAvgPct * 0.25) +
      (weeklyOpAchievementPct * 0.25) +
      (otherSalesAvgPct * 0.2)
    );
  } else if (isTender) {
    overallPerformancePct = roundToTwo(
      (tenderOpsAvgPct * 0.3) +
      (tenderPipelineAvgPct * 0.3) +
      (weeklyOpAchievementPct * 0.25) +
      (weeklySrAchievementPct * 0.15)
    );
  } else {
    overallPerformancePct = roundToTwo(
      (renewalsPct * 0.25) +
      (quotationPct * 0.25) +
      (weeklyOpAchievementPct * 0.3) +
      (weeklySrAchievementPct * 0.2)
    );
  }

  // Overdue Daily Entries Computation
  // Identifies unrecorded/0-value tasks across Monday-Saturday
  const dayNamesMap: Record<string, { label: string; full: string }> = {
    mon: { label: 'Mon', full: 'Monday' },
    tue: { label: 'Tue', full: 'Tuesday' },
    wed: { label: 'Wed', full: 'Wednesday' },
    thu: { label: 'Thu', full: 'Thursday' },
    fri: { label: 'Fri', full: 'Friday' },
    sat: { label: 'Sat', full: 'Saturday' }
  };
  const workDays: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'> = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  const overdueDailyEntries: OverdueDailyEntry[] = [];

  // Helper to enrich overdue entry with member submission / approval status
  const getSubDetails = (id: string) => {
    const sub = missedSubmissions[id];
    if (!sub) {
      return {
        approvalStatus: 'none' as const,
        submittedValue: undefined,
        reason: undefined,
        submittedAt: undefined,
        adminNotes: undefined,
        approvedAt: undefined
      };
    }
    return {
      approvalStatus: sub.status,
      submittedValue: sub.submittedValue,
      reason: sub.reason,
      submittedAt: sub.submittedAt,
      adminNotes: sub.adminNotes,
      approvedAt: sub.approvedAt
    };
  };

  // 1. Check Tender Operations tasks
  if (currentSheet.dailyTenderOperations) {
    currentSheet.dailyTenderOperations.forEach((dto) => {
      workDays.forEach((dayKey) => {
        const val = dto.days?.[dayKey] ?? 0;
        const lockKey = `${currentSheet.id}_${dto.id}_${dayKey}`;
        const isLocked = Boolean(lockedDaysMap[lockKey]);
        const entryId = `overdue-${dto.id}-${dayKey}`;
        const subDetails = getSubDetails(entryId);

        if ((val === 0 && !isLocked) || subDetails.approvalStatus === 'pending') {
          overdueDailyEntries.push({
            id: entryId,
            sheetId: currentSheet.id,
            cycleLabel: currentSheet.cycleLabel,
            sheetCycleLabel: currentSheet.cycleLabel,
            memberId: member.id,
            memberName: member.name,
            dayKey,
            dayLabel: dayNamesMap[dayKey].full,
            dayName: dayNamesMap[dayKey].full,
            metricType: 'tender_op',
            metricId: dto.id,
            metricTitle: dto.task,
            taskName: dto.task,
            targetPerDay: dto.targetPerDay || 0,
            currentValue: val,
            isLocked: false,
            ...subDetails
          });
        }
      });
    });
  }

  // 2. Check Tender Sales tasks
  if (currentSheet.dailySalesTenderTasks) {
    currentSheet.dailySalesTenderTasks.forEach((dst) => {
      workDays.forEach((dayKey) => {
        const val = dst.days?.[dayKey] ?? 0;
        const lockKey = `${currentSheet.id}_${dst.id}_${dayKey}`;
        const isLocked = Boolean(lockedDaysMap[lockKey]);
        const entryId = `overdue-${dst.id}-${dayKey}`;
        const subDetails = getSubDetails(entryId);

        if ((val === 0 && !isLocked) || subDetails.approvalStatus === 'pending') {
          overdueDailyEntries.push({
            id: entryId,
            sheetId: currentSheet.id,
            cycleLabel: currentSheet.cycleLabel,
            sheetCycleLabel: currentSheet.cycleLabel,
            memberId: member.id,
            memberName: member.name,
            dayKey,
            dayLabel: dayNamesMap[dayKey].full,
            dayName: dayNamesMap[dayKey].full,
            metricType: 'tender_sales',
            metricId: dst.id,
            metricTitle: dst.task,
            taskName: dst.task,
            targetPerDay: dst.targetPerDay || 0,
            currentValue: val,
            isLocked: false,
            ...subDetails
          });
        }
      });
    });
  }

  // 3. Check Customer Care calling & quotation tasks
  if (currentSheet.dailyTasks?.callingAndQuotes) {
    currentSheet.dailyTasks.callingAndQuotes.forEach((dq) => {
      workDays.forEach((dayKey) => {
        const val = dq.days?.[dayKey] ?? 0;
        const lockKey = `${currentSheet.id}_${dq.id}_${dayKey}`;
        const isLocked = Boolean(lockedDaysMap[lockKey]);
        const entryId = `overdue-${dq.id}-${dayKey}`;
        const subDetails = getSubDetails(entryId);

        if ((val === 0 && !isLocked) || subDetails.approvalStatus === 'pending') {
          overdueDailyEntries.push({
            id: entryId,
            sheetId: currentSheet.id,
            cycleLabel: currentSheet.cycleLabel,
            sheetCycleLabel: currentSheet.cycleLabel,
            memberId: member.id,
            memberName: member.name,
            dayKey,
            dayLabel: dayNamesMap[dayKey].full,
            dayName: dayNamesMap[dayKey].full,
            metricType: 'cc_calling',
            metricId: dq.id,
            metricTitle: dq.taskName,
            taskName: dq.taskName,
            targetPerDay: dq.targetPerDay || 0,
            currentValue: val,
            isLocked: false,
            ...subDetails
          });
        }
      });
    });
  }

  // 4. Check Commercial BD daily tasks (Alka Ghai)
  if (currentSheet.dailyCommercialTasks) {
    currentSheet.dailyCommercialTasks.forEach((dct) => {
      workDays.forEach((dayKey) => {
        const val = dct.days?.[dayKey] ?? 0;
        const lockKey = `${currentSheet.id}_${dct.id}_${dayKey}`;
        const isLocked = Boolean(lockedDaysMap[lockKey]);
        const entryId = `overdue-${dct.id}-${dayKey}`;
        const subDetails = getSubDetails(entryId);

        if ((val === 0 && !isLocked) || subDetails.approvalStatus === 'pending') {
          overdueDailyEntries.push({
            id: entryId,
            sheetId: currentSheet.id,
            cycleLabel: currentSheet.cycleLabel,
            sheetCycleLabel: currentSheet.cycleLabel,
            memberId: member.id,
            memberName: member.name,
            dayKey,
            dayLabel: dayNamesMap[dayKey].full,
            dayName: dayNamesMap[dayKey].full,
            metricType: 'commercial_daily',
            metricId: dct.id,
            metricTitle: dct.task,
            taskName: dct.task,
            targetPerDay: dct.targetPerDay || 0,
            currentValue: val,
            isLocked: false,
            ...subDetails
          });
        }
      });
    });
  }

  return (
    <PestCureContext.Provider
      value={{
        userRole,
        setUserRole,
        activeView,
        setActiveView,
        allMembers: members,
        activeMemberId,
        setActiveMemberId,
        member,
        activeSheetId,
        setActiveSheetId,
        currentSheet,
        allSheets,
        updateAttendance,
        updateDailyCallingDay,
        updateDailyCallingTarget,
        addDailyCallingMetric,
        updateDailyCallingMetric,
        deleteDailyCallingMetric,
        updateCcOverview,
        updatePhoneHandling,
        updateDailyTenderOpDay,
        updateDailyTenderOpTarget,
        updateDailyTenderOpRemarks,
        updateDailyTenderOp,
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
        updateDailyCommercialDay,
        updateDailyCommercialTarget,
        updateDailyCommercialTaskItem,
        addDailyCommercialTask,
        deleteDailyCommercialTask,
        copyKrasAndKpisFromMember,
        updateCommercialWeeklyTask,
        addCommercialWeeklyTask,
        deleteCommercialWeeklyTask,
        updateCommercialBDReview,
        updateOtherSalesChannel,
        addOtherSalesChannel,
        deleteOtherSalesChannel,
        updateVendorRegistrationMetric,
        updateRecognition,
        updateWeeklyTask,
        addWeeklyTask,
        deleteWeeklyTask,
        overdueDailyEntries,
        lockedDaysMap,
        toggleDayLock,
        fillAndLockDayEntry,
        submitMissedDayEntry,
        approveMissedDayEntry,
        rejectMissedDayEntry,
        batchApproveMissedDays,
        addNewMemberWithSheet,
        roleTemplates,
        saveNewRoleTemplate,
        deleteRoleTemplate,
        updateMonthlyTask,
        addMonthlyTask,
        deleteMonthlyTask,
        updateSalesMetric,
        updateRunningAccount,
        proposeNewTargets,
        approveTargetProposal,
        rejectTargetProposal,
        adminDirectUpdateTargets,
        adminToggleTargetFreeze,
        targetAuditLogs,
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
        createNewWeeklyCycle,
        resetAllData,
        periodFilter,
        setPeriodFilter,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        computedTotals: {
          renewalsTotal,
          renewalsTargetTotal,
          renewalsPct,
          quotationTotal,
          quotationTargetTotal,
          quotationPct,
          tenderOpsAvgPct,
          tenderPipelineAvgPct,
          tenderDailySalesTotal,
          tenderDailySalesTargetTotal,
          tenderDailySalesPct,
          dailyCommercialAvgPct,
          commercialWeeklyAvgPct,
          otherSalesAvgPct,
          totalOpAccounts,
          totalOpValue,
          totalSrAccounts,
          totalSrValue,
          grandTotalAccounts,
          grandTotalRevenue,
          weeklyOpAchievementPct,
          weeklySrAchievementPct,
          monthlyOpAchievementPct,
          monthlySrAchievementPct,
          overallPerformancePct
        }
      }}
    >
      {children}
    </PestCureContext.Provider>
  );
};

export const usePestCure = () => {
  const context = useContext(PestCureContext);
  if (!context) {
    throw new Error('usePestCure must be used within a PestCureProvider');
  }
  return context;
};
