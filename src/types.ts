export type UserRole = 'admin' | 'member';

export type ActiveNavView = 
  | 'weekly-sheet'
  | 'daily-tracker'
  | 'missed-logs'
  | 'analytics-filter'
  | 'target-management'
  | 'audit-logs';

export type OccurrenceType = 
  | 'Daily' 
  | 'Wed & Sat' 
  | 'MWF' 
  | 'Weekly' 
  | 'Fortnightly'
  | 'Monthly' 
  | 'Quarterly' 
  | 'April - July' 
  | 'As & When';

export type TaskStatusType = 'Pending' | 'In Progress' | 'Completed' | 'Delayed' | 'Under Review';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TargetApprovalStatus = 'approved' | 'waiting_approval' | 'rejected' | 'draft';

export type SheetType = 'customer_care' | 'tender_operations' | 'commercial_bd' | 'general_operations';

// Missed / Overdue Daily Log item representation
export interface OverdueDailyEntry {
  id: string;
  sheetId: string;
  cycleLabel: string;
  sheetCycleLabel?: string;
  memberId?: string;
  memberName?: string;
  dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
  dayLabel: string;
  dayName?: string;
  dateStr?: string;
  metricType: 'tender_op' | 'tender_sales' | 'cc_calling' | 'cc_phone' | 'commercial_daily';
  metricId: string;
  metricTitle: string;
  taskName?: string;
  targetPerDay: number;
  currentValue: number;
  isLocked: boolean;
  approvalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  submittedValue?: number;
  reason?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  adminNotes?: string;
}

// 1. Employee & Attendance
export interface EmployeeAttendance {
  name: string;
  role: string;
  team: string;
  reviewDate: string; // YYYY-MM-DD
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  leaves: number;
  lates: number;
  shHd: number; // Short Half / Half Day or SD / HD
}

// 2. Daily Tasks (Customer Care: Deepika)
export interface DailyTaskMetric {
  id: string;
  taskName: string;
  targetPerDay: number;
  days: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
}

// 2C. Daily Tasks (Commercial & BD: Alka Ghai)
export interface DailyCommercialBDMetric {
  id: string;
  task: string;
  targetPerDay: number;
  days: {
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
    mon: number;
  };
}

// 3C. Weekly Tasks with Target / Actual / Support (Commercial & BD: Alka Ghai)
export interface CommercialWeeklyTaskRow {
  id: string;
  occurrence: OccurrenceType | string;
  task: string;
  support?: string;
  status: TaskStatusType | string;
  target: number;
  actual: number;
  remarks?: string;
}

export interface CommercialBDReviewTasks {
  vendorRegistration: {
    vendorsAdded: number | string;
    remarks?: string;
  };
  pcProduct: {
    productsAddedInfo: string;
    productSaleValue: number;
    remarks?: string;
  };
  bdTeamReview: {
    teamAchievements: string;
    majorIssue: string;
    suggestion: string;
  };
}

// 8C. Other Sales Channels (Alka Ghai)
export interface OtherSalesChannelRow {
  id: string;
  channel: string;
  target: number;
  achieved: number;
  remarks?: string;
}

// 9C. Vendor Registration Numbers (Alka Ghai)
export interface VendorRegistrationMetricRow {
  id: string;
  metric: string;
  count: number;
  remarks?: string;
}

// 10C. Recognition (Alka Ghai)
export interface RecognitionData {
  topPerformerSpr: {
    name: string;
    remarks?: string;
  };
  topPerformerOfc: {
    name: string;
    remarks?: string;
  };
}

export interface CCTasksOverview {
  staffTraining: string;
  staffIssues: string;
  clientComplaints: string;
  aplIssues: string;
}

export interface PhoneHandlingDaily {
  whatsapp: number;
  msgs: number;
  leads: number;
  finalized: number;
  amount: number;
  remarks: string;
}

// 2B. Daily Tender Operations (Tender: Kajal Gaur)
// Formula: =(SUM(C10:I10)/(B10*6))*100
export interface DailyTenderOperationMetric {
  id: string;
  task: string;
  targetPerDay: number;
  days: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
  remarks: string;
}

// 3B. Weekly Tasks / KRA Tracker (Tender: Kajal Gaur)
export interface TenderWeeklyKRAData {
  fortnightlyPaymentCalling: {
    status: TaskStatusType | string;
    remarks: string;
  };
  serviceFeedbacks: Array<{
    id: string;
    site: string;
    status: TaskStatusType | string;
  }>;
  sitePics: Array<{
    id: string;
    site: string;
    status: TaskStatusType | string;
  }>;
  extensionAtTenderSites: Array<{
    id: string;
    site: string;
    status: TaskStatusType | string;
  }>;
  newAssociatesSearch: Array<{
    id: string;
    stateCity: string;
  }>;
}

// 4B. Tender Pipeline & Bid Performance (Tender: Kajal Gaur)
// Formula: =(C28/B28)*100
export interface TenderPipelineMetricRow {
  id: string;
  metric: string;
  target: number;
  actual: number;
  status: string;
  remarks: string;
}

// 5B. Bid Stage & Tender Compliance Checks (Tender: Kajal Gaur)
export interface BidStageComplianceRow {
  id: string;
  category: 'Technical' | 'Financial' | string;
  bidOpen: number | string;
  finalCount: number | string;
  lostCount: number | string;
  status: 'L1' | 'L2' | 'L3' | string;
  remarks: string;
}

// 7B. Daily Tasks - Calling for Tender Desk (Kajal Gaur)
// Formula: =(SUM(C50:I50)/(B50*6))*100
export interface DailySalesTenderTaskRow {
  id: string;
  task: string;
  targetPerDay: number;
  days: {
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
    mon: number;
  };
}

// 3. Weekly Tasks (General)
export interface WeeklyTaskItem {
  id: string;
  occurrence: OccurrenceType | string;
  task: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatusType;
  nextFollowUp: string;
  remarks: string;
}

// 4. Monthly / Quarterly Tasks
export interface MonthlyTaskItem {
  id: string;
  occurrence: OccurrenceType | string;
  task: string;
  status: TaskStatusType;
  tat: string;
  reasonForPendency: string;
  remarkIfAny: string;
  technicianHiring?: {
    hiredDelhi: number;
    sourceDelhi: string;
    hiredGgi: number;
    sourceGgi: string;
  };
  technicianReferralReady?: {
    status: string;
    remarks: string;
  };
}

// 5. Sales Metrics
export interface SalesMetricRow {
  category: 'New Inquiries' | 'Renewal Calls' | 'Personal Referrals (PR)' | string;
  opFinalCount: number;
  opValue: number; // ₹
  srFinalCount: number;
  srValue: number; // ₹
  remarks: string;
}

// 6. Running Accounts - Pending Payments
export interface RunningAccountRow {
  category: string;
  dealsCalledCount: number;
  pendingAmount: number; // ₹
  amountReceivedThisWeek: number; // ₹
  remarks: string;
}

// 7. Target & Achievements Configuration & Values (Formulas: =100*(C57/C56), =100*(D57/D56), =100*(G57/G56), =100*(H57/H56))
export interface TargetValues {
  monthlyTargetOp: number;
  monthlyTargetSr: number;
  monthlyAchievedOp: number;
  monthlyAchievedSr: number;
  
  weeklyTargetOp: number;
  weeklyTargetSr: number;
  weeklyAchievedOp: number;
  weeklyAchievedSr: number;
  
  dailyTargetRenewals: number;
  dailyTargetQuotation: number;
  
  remarks: string;
}

export interface TargetApprovalRequest {
  id: string;
  memberId: string;
  memberName: string;
  proposedBy: 'member' | 'admin';
  proposedAt: string;
  status: TargetApprovalStatus;
  
  proposedTargets: TargetValues;
  approvedTargets?: TargetValues;
  
  adminFeedback?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface TargetAuditLog {
  id: string;
  timestamp: string;
  action: 'Proposed' | 'Approved' | 'Modified & Approved' | 'Rejected' | 'System Initialized';
  actorName: string;
  actorRole: UserRole;
  previousTargets?: TargetValues;
  newTargets: TargetValues;
  notes?: string;
}

// 8. Achievements
export interface AchievementItem {
  id: string;
  text: string;
}

// 9. Stuck Points / Roadblocks
export interface StuckRoadblockItem {
  id: string;
  stuckPoint: string;
  reason: string;
  cta: string; // Corrective Action
}

// 10. Client Feedback
export interface ClientFeedbackData {
  testimonial: string;
  clientName?: string;
  rating?: number;
  clientReviewsCount?: number;
  clientReviewsDetails?: string;
  videoTestimonialsCount?: number;
  videoTestimonialsDetails?: string;
}

// 11. Learning & Improvement
export interface LearningImprovementData {
  newImplemented: string;
  anythingElse: string;
  thisWeekNotes?: string;
}

// 12. Weekly Summary
export interface WeeklySummaryData {
  avgDailyTaskCompletion: number; // %
  avgWeeklyTaskAchievement: number; // %
  analysis: string;
  reviewedBy: string;
  reviewDate: string;
}

// Complete Weekly Review Sheet for a given cycle
export interface WeeklyReviewSheetData {
  id: string;
  cycleId: string;
  cycleLabel: string; // e.g. "Week 35: Aug 25 – Aug 31, 2026"
  isCurrent: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'locked';
  sheetType: SheetType;
  
  attendance: EmployeeAttendance;
  
  // Customer Care Specific
  dailyTasks: {
    callingAndQuotes: DailyTaskMetric[];
    ccOverview: CCTasksOverview;
    phoneHandling: PhoneHandlingDaily;
  };
  
  // Tender / Bidding Specific (Kajal Gaur)
  dailyTenderOperations?: DailyTenderOperationMetric[];
  tenderWeeklyKRA?: TenderWeeklyKRAData;
  tenderPipeline?: TenderPipelineMetricRow[];
  bidStageCompliance?: BidStageComplianceRow[];
  dailySalesTenderTasks?: DailySalesTenderTaskRow[];
  
  // Commercial & BD Specific (Alka Ghai)
  dailyCommercialTasks?: DailyCommercialBDMetric[];
  commercialWeeklyTasks?: CommercialWeeklyTaskRow[];
  commercialBDReview?: CommercialBDReviewTasks;
  otherSalesChannels?: OtherSalesChannelRow[];
  vendorRegistrationMetrics?: VendorRegistrationMetricRow[];
  recognition?: RecognitionData;

  weeklyTasks: WeeklyTaskItem[];
  monthlyTasks: MonthlyTaskItem[];
  salesMetrics: SalesMetricRow[];
  runningAccounts: RunningAccountRow[];
  targets: TargetValues;
  targetApprovalStatus: TargetApprovalStatus;
  isTargetFrozen?: boolean; // True once approved by admin, preventing member from editing
  lockedDays?: Record<string, boolean>; // e.g. { "mon": true, "tue": true, "metricId_mon": true }
  
  achievements: AchievementItem[];
  stuckPoints: StuckRoadblockItem[];
  clientFeedback: ClientFeedbackData;
  learningImprovement: LearningImprovementData;
  weeklySummary: WeeklySummaryData;
  
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

// Member Profile
export interface MemberProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  avatarUrl: string;
  sheetType: SheetType;
  approvedTargets: TargetValues;
  isTargetFrozen?: boolean; // True once approved by admin
  pendingTargetProposal?: TargetApprovalRequest;
  sheets: WeeklyReviewSheetData[];
}

// Role Template for Reusable Weekly Report Structure
export interface RoleTemplate {
  id: string;
  roleName: string;
  department: string;
  sheetType: SheetType;
  description?: string;
  defaultWeeklyTargetOp: number;
  defaultWeeklyTargetSr: number;
  defaultDailyTargetRenewals: number;
  defaultDailyTargetQuotation: number;
  dailyTasks?: Array<{
    id?: string;
    taskName: string;
    targetPerDay: number;
    category?: string;
  }>;
  weeklyTasks?: Array<{
    id?: string;
    task: string;
    occurrence: OccurrenceType | string;
    priority: TaskPriority;
    remarks?: string;
  }>;
  monthlyTasks?: Array<{
    id?: string;
    task: string;
    occurrence: OccurrenceType | string;
    tat?: string;
    remarkIfAny?: string;
  }>;
  salesMetrics?: Array<{
    category: string;
    remarks?: string;
  }>;
  isCustom?: boolean;
}

