import {
  MemberProfile,
  WeeklyReviewSheetData,
  SheetType,
  TargetValues,
  RoleTemplate,
  TaskPriority,
  OccurrenceType
} from '../types';

export interface NewMemberInput {
  name: string;
  role: string;
  department: string;
  sheetType: SheetType;
  email?: string;
  phone?: string;
  weeklyTargetOp?: number;
  weeklyTargetSr?: number;
  dailyTargetRenewals?: number;
  dailyTargetQuotation?: number;
  periodStart?: string;
  periodEnd?: string;
  // Optional: clone structure from existing member
  sourceMember?: MemberProfile;
  // Optional: custom role template or custom tasks
  customDailyTasks?: Array<{ taskName: string; targetPerDay: number }>;
  customWeeklyTasks?: Array<{ task: string; occurrence: OccurrenceType | string; priority: TaskPriority; remarks?: string }>;
  customMonthlyTasks?: Array<{ task: string; occurrence: OccurrenceType | string; tat?: string; remarkIfAny?: string }>;
  customSalesMetrics?: Array<{ category: string; remarks?: string }>;
}

export function generateNewMemberAndSheet(input: NewMemberInput): MemberProfile {
  const memberId = `mem-${Date.now()}`;
  const now = new Date();
  
  // Current cycle dates
  const periodStart = input.periodStart || new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 2).toISOString().split('T')[0];
  const periodEnd = input.periodEnd || new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 8).toISOString().split('T')[0];
  const cycleLabel = `Week 36: ${periodStart} – ${periodEnd}`;
  const sheetId = `sheet-${memberId}-w36`;

  // Default target values
  const defaultOp = input.weeklyTargetOp || (input.sourceMember ? input.sourceMember.approvedTargets.weeklyTargetOp : 150000);
  const defaultSr = input.weeklyTargetSr || (input.sourceMember ? input.sourceMember.approvedTargets.weeklyTargetSr : 80000);
  const defaultRenewals = input.dailyTargetRenewals || (input.sourceMember ? input.sourceMember.approvedTargets.dailyTargetRenewals : 25);
  const defaultQuotation = input.dailyTargetQuotation || (input.sourceMember ? input.sourceMember.approvedTargets.dailyTargetQuotation : 10);

  const targets: TargetValues = {
    monthlyTargetOp: defaultOp * 4,
    monthlyTargetSr: defaultSr * 4,
    monthlyAchievedOp: 0,
    monthlyAchievedSr: 0,
    weeklyTargetOp: defaultOp,
    weeklyTargetSr: defaultSr,
    weeklyAchievedOp: 0,
    weeklyAchievedSr: 0,
    dailyTargetRenewals: defaultRenewals,
    dailyTargetQuotation: defaultQuotation,
    remarks: `Initial baseline targets established for ${input.name} (${input.role}).`
  };

  // Check if cloning from existing member
  if (input.sourceMember && input.sourceMember.sheets && input.sourceMember.sheets.length > 0) {
    const srcSheet = input.sourceMember.sheets[0];
    
    // Deep clone source sheet with fresh counters
    const clonedSheet: WeeklyReviewSheetData = {
      ...srcSheet,
      id: sheetId,
      cycleId: 'cycle-w36',
      cycleLabel,
      isCurrent: true,
      status: 'draft',
      sheetType: srcSheet.sheetType || input.sheetType,
      attendance: {
        name: input.name,
        role: input.role,
        team: input.department || srcSheet.attendance.team,
        reviewDate: new Date().toISOString().split('T')[0],
        periodStart,
        periodEnd,
        leaves: 0,
        lates: 0,
        shHd: 0
      },
      dailyTasks: {
        callingAndQuotes: input.customDailyTasks && input.customDailyTasks.length > 0 && (srcSheet.sheetType === 'customer_care' || !srcSheet.sheetType)
          ? input.customDailyTasks.map((t, idx) => ({
              id: `dq-${Date.now()}-${idx + 1}`,
              taskName: t.taskName,
              targetPerDay: t.targetPerDay,
              days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
            }))
          : srcSheet.dailyTasks?.callingAndQuotes?.map((dq, idx) => ({
              ...dq,
              id: `dq-${Date.now()}-${idx + 1}`,
              days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
            })) || [
              {
                id: `dq-${Date.now()}-1`,
                taskName: 'Renewals Calling',
                targetPerDay: defaultRenewals,
                days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
              }
            ],
        ccOverview: {
          staffTraining: 'Orientation & process review complete',
          staffIssues: 'None',
          clientComplaints: 'Zero unresolved complaints',
          aplIssues: 'Normal application operations'
        },
        phoneHandling: {
          whatsapp: 0,
          msgs: 0,
          leads: 0,
          finalized: 0,
          amount: 0,
          remarks: 'New profile assigned'
        }
      },
      dailyTenderOperations: input.customDailyTasks && input.customDailyTasks.length > 0 && srcSheet.sheetType === 'tender_operations'
        ? input.customDailyTasks.map((t, idx) => ({
            id: `dto-${Date.now()}-${idx + 1}`,
            task: t.taskName,
            targetPerDay: t.targetPerDay,
            days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
            remarks: ''
          }))
        : srcSheet.dailyTenderOperations?.map((dto, idx) => ({
            ...dto,
            id: `dto-${Date.now()}-${idx + 1}`,
            days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
            remarks: ''
          })),
      dailySalesTenderTasks: srcSheet.dailySalesTenderTasks?.map((dst, idx) => ({
        ...dst,
        id: `dst-${Date.now()}-${idx + 1}`,
        days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 }
      })),
      tenderPipeline: srcSheet.tenderPipeline?.map((tp, idx) => ({
        ...tp,
        id: `tp-${Date.now()}-${idx + 1}`,
        actual: 0,
        status: 'In Progress'
      })),
      dailyCommercialTasks: input.customDailyTasks && input.customDailyTasks.length > 0 && srcSheet.sheetType === 'commercial_bd'
        ? input.customDailyTasks.map((t, idx) => ({
            id: `dct-${Date.now()}-${idx + 1}`,
            task: t.taskName,
            targetPerDay: t.targetPerDay,
            days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 }
          }))
        : srcSheet.dailyCommercialTasks?.map((dct, idx) => ({
            ...dct,
            id: `dct-${Date.now()}-${idx + 1}`,
            days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 }
          })),
      commercialWeeklyTasks: srcSheet.commercialWeeklyTasks?.map((cwt, idx) => ({
        ...cwt,
        id: `cwt-${Date.now()}-${idx + 1}`,
        actual: 0,
        status: 'In Progress'
      })),
      otherSalesChannels: srcSheet.otherSalesChannels?.map((osc, idx) => ({
        ...osc,
        id: `osc-${Date.now()}-${idx + 1}`,
        achieved: 0
      })),
      weeklyTasks: input.customWeeklyTasks && input.customWeeklyTasks.length > 0
        ? input.customWeeklyTasks.map((w, idx) => ({
            id: `wt-${Date.now()}-${idx + 1}`,
            occurrence: w.occurrence,
            task: w.task,
            priority: (w.priority as TaskPriority) || 'Medium',
            dueDate: periodEnd,
            status: 'In Progress' as const,
            nextFollowUp: periodEnd,
            remarks: w.remarks || 'Standard cadence'
          }))
        : srcSheet.weeklyTasks.map((wt, idx) => ({
            ...wt,
            id: `wt-${Date.now()}-${idx + 1}`,
            status: 'In Progress',
            dueDate: periodEnd,
            nextFollowUp: periodEnd
          })),
      monthlyTasks: srcSheet.monthlyTasks.map((mt, idx) => ({
        ...mt,
        id: `mt-${Date.now()}-${idx + 1}`,
        status: 'In Progress'
      })),
      salesMetrics: srcSheet.salesMetrics.map((sm) => ({
        ...sm,
        opFinalCount: 0,
        opValue: 0,
        srFinalCount: 0,
        srValue: 0,
        remarks: 'New profile assigned'
      })),
      runningAccounts: srcSheet.runningAccounts.map((ra) => ({
        ...ra,
        dealsCalledCount: 0,
        pendingAmount: 0,
        amountReceivedThisWeek: 0,
        remarks: 'New profile assigned'
      })),
      targets,
      targetApprovalStatus: 'approved',
      achievements: [
        {
          id: `ach-${Date.now()}-1`,
          text: `Role assigned from ${input.sourceMember.name}'s structure for ${input.name}`
        }
      ],
      stuckPoints: [],
      clientFeedback: { testimonial: '' },
      learningImprovement: {
        newImplemented: `Onboarded with ${input.role} report structure`,
        anythingElse: ''
      },
      weeklySummary: {
        avgDailyTaskCompletion: 0,
        avgWeeklyTaskAchievement: 0,
        analysis: `Review sheet cloned from ${input.sourceMember.role} template. Ready for daily logging.`,
        reviewedBy: 'Operations Lead',
        reviewDate: new Date().toISOString().split('T')[0]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      id: memberId,
      name: input.name,
      role: input.role,
      department: input.department || input.sourceMember.department,
      email: input.email || `${input.name.toLowerCase().replace(/\s+/g, '.')}@pestcure.com`,
      phone: input.phone || '+91 98110 00000',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      sheetType: clonedSheet.sheetType,
      approvedTargets: targets,
      isTargetFrozen: false,
      sheets: [clonedSheet]
    };
  }

  // Base sheet construction (with custom daily/weekly/monthly tasks if provided)
  const initialDailyTasks = input.customDailyTasks && input.customDailyTasks.length > 0
    ? input.customDailyTasks.map((t, idx) => ({
        id: `dq-${Date.now()}-${idx + 1}`,
        taskName: t.taskName,
        targetPerDay: t.targetPerDay,
        days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
      }))
    : [
        {
          id: `dq-${Date.now()}-1`,
          taskName: input.sheetType === 'customer_care' ? 'Renewals Calling' : 'Client Service Follow-ups',
          targetPerDay: defaultRenewals,
          days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
        },
        {
          id: `dq-${Date.now()}-2`,
          taskName: input.sheetType === 'customer_care' ? 'Quotations & Enquiries' : 'Site Quotations Prepared',
          targetPerDay: defaultQuotation,
          days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
        }
      ];

  const initialWeeklyTasks = input.customWeeklyTasks && input.customWeeklyTasks.length > 0
    ? input.customWeeklyTasks.map((w, idx) => ({
        id: `wt-${Date.now()}-${idx + 1}`,
        occurrence: w.occurrence,
        task: w.task,
        priority: (w.priority as TaskPriority) || 'Medium',
        dueDate: periodEnd,
        status: 'In Progress' as const,
        nextFollowUp: periodEnd,
        remarks: w.remarks || 'Standard cadence'
      }))
    : [
        {
          id: `wt-${Date.now()}-1`,
          occurrence: 'Weekly',
          task: 'Weekly Client Relationship Touchbase',
          priority: 'Medium' as const,
          dueDate: periodEnd,
          status: 'In Progress' as const,
          nextFollowUp: periodEnd,
          remarks: 'Initial assignment'
        },
        {
          id: `wt-${Date.now()}-2`,
          occurrence: 'Wed & Sat',
          task: 'Operational Review & Outstanding Follow-ups',
          priority: 'High' as const,
          dueDate: periodEnd,
          status: 'In Progress' as const,
          nextFollowUp: periodEnd,
          remarks: 'Standard cadence'
        }
      ];

  const initialMonthlyTasks = input.customMonthlyTasks && input.customMonthlyTasks.length > 0
    ? input.customMonthlyTasks.map((m, idx) => ({
        id: `mt-${Date.now()}-${idx + 1}`,
        occurrence: m.occurrence,
        task: m.task,
        status: 'In Progress' as const,
        tat: m.tat || '1 Month',
        reasonForPendency: '-',
        remarkIfAny: m.remarkIfAny || 'On track'
      }))
    : [
        {
          id: `mt-${Date.now()}-1`,
          occurrence: 'Monthly',
          task: 'Departmental KPI Audit & Training Completion',
          status: 'In Progress' as const,
          tat: '1 Month',
          reasonForPendency: '-',
          remarkIfAny: 'On track'
        }
      ];

  const initialSalesMetrics = input.customSalesMetrics && input.customSalesMetrics.length > 0
    ? input.customSalesMetrics.map((sm) => ({
        category: sm.category,
        opFinalCount: 0,
        opValue: 0,
        srFinalCount: 0,
        srValue: 0,
        remarks: sm.remarks || 'New onboarding'
      }))
    : [
        {
          category: 'New Inquiries',
          opFinalCount: 0,
          opValue: 0,
          srFinalCount: 0,
          srValue: 0,
          remarks: 'New onboarding'
        },
        {
          category: 'Renewal Calls',
          opFinalCount: 0,
          opValue: 0,
          srFinalCount: 0,
          srValue: 0,
          remarks: 'New onboarding'
        },
        {
          category: 'Personal Referrals (PR)',
          opFinalCount: 0,
          opValue: 0,
          srFinalCount: 0,
          srValue: 0,
          remarks: 'New onboarding'
        }
      ];

  const baseSheet: WeeklyReviewSheetData = {
    id: sheetId,
    cycleId: 'cycle-w36',
    cycleLabel,
    isCurrent: true,
    status: 'draft',
    sheetType: input.sheetType,
    attendance: {
      name: input.name,
      role: input.role,
      team: input.department,
      reviewDate: new Date().toISOString().split('T')[0],
      periodStart,
      periodEnd,
      leaves: 0,
      lates: 0,
      shHd: 0
    },
    dailyTasks: {
      callingAndQuotes: initialDailyTasks,
      ccOverview: {
        staffTraining: 'Orientation & review process completed',
        staffIssues: 'None reported',
        clientComplaints: 'Zero unresolved complaints',
        aplIssues: 'Normal app operations'
      },
      phoneHandling: {
        whatsapp: 0,
        msgs: 0,
        leads: 0,
        finalized: 0,
        amount: 0,
        remarks: 'New profile initialized'
      }
    },
    weeklyTasks: initialWeeklyTasks,
    monthlyTasks: initialMonthlyTasks,
    salesMetrics: initialSalesMetrics,
    runningAccounts: [
      {
        category: 'Running Accounts Recovery',
        dealsCalledCount: 0,
        pendingAmount: 0,
        amountReceivedThisWeek: 0,
        remarks: 'New onboarding sheet'
      }
    ],
    targets,
    targetApprovalStatus: 'approved',
    achievements: [
      {
        id: `ach-${Date.now()}-1`,
        text: `Review form initialized for ${input.name} (${input.role})`
      }
    ],
    stuckPoints: [],
    clientFeedback: {
      testimonial: ''
    },
    learningImprovement: {
      newImplemented: 'Joined PestCure review tracking workflow',
      anythingElse: ''
    },
    weeklySummary: {
      avgDailyTaskCompletion: 0,
      avgWeeklyTaskAchievement: 0,
      analysis: 'New review sheet ready for daily activity logging.',
      reviewedBy: 'Operations Lead',
      reviewDate: new Date().toISOString().split('T')[0]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Add specific fields based on template
  if (input.sheetType === 'tender_operations') {
    baseSheet.dailyTenderOperations = input.customDailyTasks && input.customDailyTasks.length > 0
      ? input.customDailyTasks.map((t, idx) => ({
          id: `dto-${Date.now()}-${idx + 1}`,
          task: t.taskName,
          targetPerDay: t.targetPerDay,
          days: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
          remarks: ''
        }))
      : [
          {
            id: `dto-${Date.now()}-1`,
            task: 'GeM Portal Daily Bid Tracking',
            targetPerDay: 10,
            days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 },
            remarks: 'Daily morning sweep'
          },
          {
            id: `dto-${Date.now()}-2`,
            task: 'Document Verification & Technical Compliance',
            targetPerDay: 5,
            days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 },
            remarks: 'Tender submissions'
          }
        ];
    baseSheet.tenderPipeline = [
      { id: `tp-${Date.now()}-1`, metric: 'Live Bids Published', target: 5, actual: 0, status: 'In Progress', remarks: '' },
      { id: `tp-${Date.now()}-2`, metric: 'Technical Evaluations Cleared', target: 3, actual: 0, status: 'In Progress', remarks: '' }
    ];
    baseSheet.dailySalesTenderTasks = [
      {
        id: `dst-${Date.now()}-1`,
        task: 'Institutional Cold Outreach',
        targetPerDay: 8,
        days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 }
      }
    ];
  } else if (input.sheetType === 'commercial_bd') {
    baseSheet.dailyCommercialTasks = input.customDailyTasks && input.customDailyTasks.length > 0
      ? input.customDailyTasks.map((t, idx) => ({
          id: `dct-${Date.now()}-${idx + 1}`,
          task: t.taskName,
          targetPerDay: t.targetPerDay,
          days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 }
        }))
      : [
          {
            id: `dct-${Date.now()}-1`,
            task: 'B2B Client Calling & Introduction',
            targetPerDay: 20,
            days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 }
          },
          {
            id: `dct-${Date.now()}-2`,
            task: 'Commercial Site Proposals Dispatched',
            targetPerDay: 5,
            days: { tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, mon: 0 }
          }
        ];
    baseSheet.commercialWeeklyTasks = [
      {
        id: `cwt-${Date.now()}-1`,
        occurrence: 'Weekly',
        task: 'Warehouse & Facility Contract Pitches',
        status: 'In Progress',
        target: 10,
        actual: 0,
        support: 'Pricing approvals'
      }
    ];
    baseSheet.otherSalesChannels = [
      { id: `osc-${Date.now()}-1`, channel: 'Corporate Facilities', target: 5, achieved: 0, remarks: '' }
    ];
    baseSheet.vendorRegistrationMetrics = [
      { id: `vrm-${Date.now()}-1`, metric: 'Facility Management Partners', count: 0 }
    ];
  }

  const newMember: MemberProfile = {
    id: memberId,
    name: input.name,
    role: input.role,
    department: input.department,
    email: input.email || `${input.name.toLowerCase().replace(/\s+/g, '.')}@pestcure.com`,
    phone: input.phone || '+91 98110 00000',
    avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    sheetType: input.sheetType,
    approvedTargets: targets,
    isTargetFrozen: false,
    sheets: [baseSheet]
  };

  return newMember;
}
