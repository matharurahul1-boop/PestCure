import { MemberProfile, WeeklyReviewSheetData, TargetAuditLog, TargetValues } from '../types';

// ==========================================
// 1. DEEPIKA GULIA (Customer Care & Retention)
// ==========================================

export const DEFAULT_TARGETS_DEEPIKA: TargetValues = {
  monthlyTargetOp: 800000, // ₹ 8,00,000
  monthlyTargetSr: 450000, // ₹ 4,50,000
  monthlyAchievedOp: 620000,
  monthlyAchievedSr: 380000,
  
  weeklyTargetOp: 200000,  // ₹ 2,00,000
  weeklyTargetSr: 112500,  // ₹ 1,12,500
  weeklyAchievedOp: 165000,
  weeklyAchievedSr: 92000,
  
  dailyTargetRenewals: 30, // 30 calls/day
  dailyTargetQuotation: 12, // 12 quotations/day
  
  remarks: 'Focus on North Delhi residential key accounts & institutional annual contract renewals.'
};

export const CURRENT_WEEK_SHEET_DEEPIKA: WeeklyReviewSheetData = {
  id: 'sheet-deepika-w35',
  cycleId: 'cycle-w35',
  cycleLabel: 'Week 35: Aug 25 – Aug 31, 2026',
  isCurrent: true,
  status: 'draft',
  sheetType: 'customer_care',
  
  // Section 1: Employee & Attendance Details
  attendance: {
    name: 'Deepika Gulia',
    role: 'Customer Care & Retention Specialist',
    team: 'Operations & Client Retention',
    reviewDate: '2026-09-01',
    periodStart: '2026-08-25',
    periodEnd: '2026-08-31',
    leaves: 0,
    lates: 1,
    shHd: 0
  },
  
  // Section 2: Daily Tasks
  dailyTasks: {
    callingAndQuotes: [
      {
        id: 'dq-1',
        taskName: 'Renewals Calling',
        targetPerDay: 30,
        days: { mon: 28, tue: 32, wed: 30, thu: 26, fri: 34, sat: 24, sun: 0 }
      },
      {
        id: 'dq-2',
        taskName: 'Quotation',
        targetPerDay: 12,
        days: { mon: 10, tue: 14, wed: 11, thu: 13, fri: 15, sat: 8, sun: 0 }
      }
    ],
    ccOverview: {
      staffTraining: 'Conducted 2 refresher modules on Termite warranty renewals & GeM compliance',
      staffIssues: 'Gurgaon branch dispatch coordinator reporting minor CRM lag during peak hours',
      clientComplaints: '3 minor re-service requests handled & resolved within 24h turnaround',
      aplIssues: 'App lead push sync delay resolved by IT support on Thursday'
    },
    phoneHandling: {
      whatsapp: 48,
      msgs: 62,
      leads: 35,
      finalized: 18,
      amount: 215000,
      remarks: 'High conversion rate on residential annual pest maintenance renewals'
    }
  },
  
  // Section 3: Weekly Tasks
  weeklyTasks: [
    {
      id: 'wt-1',
      occurrence: 'Wed & Sat',
      task: 'Payment Calling - Scanning',
      priority: 'High',
      dueDate: '2026-08-30',
      status: 'Completed',
      nextFollowUp: '2026-09-03',
      remarks: 'Scanned 42 overdue accounts; ₹1.4L cleared'
    },
    {
      id: 'wt-2',
      occurrence: 'MWF',
      task: 'Touchbase of Residential Key Clients',
      priority: 'High',
      dueDate: '2026-08-29',
      status: 'Completed',
      nextFollowUp: '2026-09-02',
      remarks: 'Contacted 15 VVIP villa owners in South City & DLF Phase 1-4'
    },
    {
      id: 'wt-3',
      occurrence: 'Wed & Sat',
      task: 'Gurgaon Office Visit',
      priority: 'Medium',
      dueDate: '2026-08-30',
      status: 'Completed',
      nextFollowUp: '2026-09-06',
      remarks: 'Audited technician kit inspections and physical stock checklist'
    },
    {
      id: 'wt-4',
      occurrence: 'Weekly',
      task: 'CC Training & Guidance',
      priority: 'Medium',
      dueDate: '2026-08-31',
      status: 'Completed',
      nextFollowUp: '2026-09-07',
      remarks: 'Trained 4 junior tele-callers on objection handling for AMC pricing'
    }
  ],
  
  // Section 4: Monthly / Quarterly Tasks
  monthlyTasks: [
    {
      id: 'mt-1',
      occurrence: 'Monthly',
      task: 'Technicians Training',
      status: 'Completed',
      tat: '4 Days',
      reasonForPendency: 'None',
      remarkIfAny: 'Safety PPE and chemical dilution SOP compliance verified'
    },
    {
      id: 'mt-2',
      occurrence: 'Monthly',
      task: 'Technicians Reward & Recognition',
      status: 'In Progress',
      tat: '5 Days',
      reasonForPendency: 'Finalizing August Star Performer leaderboard',
      remarkIfAny: 'Top 3 technician vouchers ready for distribution'
    },
    {
      id: 'mt-3',
      occurrence: 'Monthly',
      task: 'CC - SOP Sheet - Videos',
      status: 'In Progress',
      tat: '7 Days',
      reasonForPendency: 'Video edit for cockroach gel baiting script pending',
      remarkIfAny: 'Draft video shared with Quality Head'
    },
    {
      id: 'mt-4',
      occurrence: 'April - July',
      task: 'Technicians Review & Salary Appraisal',
      status: 'Completed',
      tat: '15 Days',
      reasonForPendency: 'None',
      remarkIfAny: 'Completed Q1-Q2 salary reviews for 18 technicians'
    },
    {
      id: 'mt-5',
      occurrence: 'As & When',
      task: 'New Associate (Apl/CC) Hiring & Training',
      status: 'Completed',
      tat: '3 Days',
      reasonForPendency: 'None',
      remarkIfAny: '2 new tele-callers onboarded and shadowing senior staff'
    },
    {
      id: 'mt-6',
      occurrence: 'As & When',
      task: 'Technician Hiring',
      status: 'Completed',
      tat: 'Ongoing',
      reasonForPendency: 'None',
      remarkIfAny: 'Active recruitment drive across NCR',
      technicianHiring: {
        hiredDelhi: 4,
        sourceDelhi: 'Direct Referral & Local Job Portal',
        hiredGgi: 2,
        sourceGgi: 'Vendor Agency & Walk-in'
      }
    }
  ],
  
  // Section 5: Sales Metrics
  salesMetrics: [
    {
      category: 'New Inquiries',
      opFinalCount: 14,
      opValue: 125000,
      srFinalCount: 8,
      srValue: 68000,
      remarks: '5 commercial restaurant contracts + 9 residential flats'
    },
    {
      category: 'Renewal Calls',
      opFinalCount: 22,
      opValue: 185000,
      srFinalCount: 15,
      srValue: 95000,
      remarks: 'Strong response from Vasant Kunj & Dwarka societies'
    },
    {
      category: 'Personal Referrals (PR)',
      opFinalCount: 6,
      opValue: 55000,
      srFinalCount: 4,
      srValue: 32000,
      remarks: 'Referral discounts offered to long-term key clients'
    }
  ],
  
  // Section 6: Running Accounts - Pending Payments
  runningAccounts: [
    {
      category: 'Pending Accounts',
      dealsCalledCount: 38,
      pendingAmount: 320000,
      amountReceivedThisWeek: 185000,
      remarks: '₹1.85L collected; remaining ₹1.35L committed by 5th of next month'
    }
  ],
  
  // Section 7: Target & Achievements (OV)
  targets: {
    monthlyTargetOp: 850000,
    monthlyTargetSr: 450000,
    monthlyAchievedOp: 685000,
    monthlyAchievedSr: 380000,
    
    weeklyTargetOp: 212500,
    weeklyTargetSr: 112500,
    weeklyAchievedOp: 185000,
    weeklyAchievedSr: 95000,
    
    dailyTargetRenewals: 32,
    dailyTargetQuotation: 12,
    
    remarks: 'Tracking at 87% weekly target achievement; OP conversions performing exceptionally well.'
  },
  targetApprovalStatus: 'approved',
  
  // Section 8: Achievements
  achievements: [
    { id: 'ach-1', text: 'Achieved ₹1.85 Lakhs in weekly renewal collections, exceeding minimum cashflow milestone.' },
    { id: 'ach-2', text: 'Zero unresolved client escalations for 3 consecutive weeks with 96% first-call resolution.' },
    { id: 'ach-3', text: 'Successfully completed on-time onboarding and kit allotment for 6 newly hired technicians.' }
  ],
  
  // Section 9: Stuck Points / Roadblocks
  stuckPoints: [
    {
      id: 'sp-1',
      stuckPoint: 'Delayed GST invoice upload on corporate portal for 3 hospital clients',
      reason: 'Accounts team awaiting signed service delivery slips from field supervisors',
      cta: 'Deepika to coordinate direct supervisor WhatsApp scan collection by Tuesday 2 PM'
    },
    {
      id: 'sp-2',
      stuckPoint: 'WhatsApp Business API automated payment link delivery intermittent',
      reason: 'Third-party gateway webhook timeout during evening batches',
      cta: 'Tech team ticket escalated to priority 1; fallback to manual payment link SMS active'
    }
  ],
  
  // Section 10: Client Feedback
  clientFeedback: {
    testimonial: '"Deepika and her CC team are extremely prompt. When we had a recurring cockroach issue at our bakery, she dispatched the senior technician within 2 hours and waived the inspection fee as promised. Excellent customer care service!" — Mr. Alok Singhal, The Crust Bakers.',
    clientName: 'Alok Singhal',
    rating: 5,
    clientReviewsCount: 18,
    clientReviewsDetails: 'Direct Google Maps Reviews & WhatsApp Testimonials',
    videoTestimonialsCount: 2,
    videoTestimonialsDetails: 'Recorded from The Crust Bakery & Green Park Clinic'
  },
  
  // Section 11: Learning & Improvement
  learningImprovement: {
    newImplemented: 'Introduced 48-hour pre-expiry automated WhatsApp reminders with customized renewal discount codes, reducing lapse rate by 14%.',
    anythingElse: 'Need to organize a monthly interactive Q&A between field technicians and CC team to bridge client site feedback.',
    thisWeekNotes: 'Focus on renewal upsell for Termite 5-year warranty extensions.'
  },
  
  // Section 12: Weekly Summary
  weeklySummary: {
    avgDailyTaskCompletion: 88.5,
    avgWeeklyTaskAchievement: 92.0,
    analysis: 'Consistently high operational diligence. Calling volume surpassed benchmark and cash collection target is on track. Recommend focusing on upselling Bedbug & Woodborer treatments during renewal calls.',
    reviewedBy: 'Rajiv Sharma (Operations Director)',
    reviewDate: '2026-09-01'
  },
  
  createdAt: '2026-08-25T09:00:00Z',
  updatedAt: '2026-09-01T17:30:00Z'
};

export const PREVIOUS_WEEK_SHEET_DEEPIKA: WeeklyReviewSheetData = {
  ...CURRENT_WEEK_SHEET_DEEPIKA,
  id: 'sheet-deepika-w34',
  cycleId: 'cycle-w34',
  cycleLabel: 'Week 34: Aug 18 – Aug 24, 2026',
  isCurrent: false,
  status: 'approved',
  attendance: {
    ...CURRENT_WEEK_SHEET_DEEPIKA.attendance,
    reviewDate: '2026-08-25',
    periodStart: '2026-08-18',
    periodEnd: '2026-08-24'
  }
};

export const INITIAL_MEMBER_DEEPIKA: MemberProfile = {
  id: 'member-deepika',
  name: 'Deepika Gulia',
  role: 'Customer Care & Retention Specialist',
  department: 'Operations & Client Servicing',
  email: 'deepika.gulia@pestcure.com',
  phone: '+91 98101 29507',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  sheetType: 'customer_care',
  approvedTargets: DEFAULT_TARGETS_DEEPIKA,
  sheets: [CURRENT_WEEK_SHEET_DEEPIKA, PREVIOUS_WEEK_SHEET_DEEPIKA]
};

// ==========================================
// 2. KAJAL GAUR (Tender Operations & Bidding)
// Matches 100% of Excel Screenshots
// ==========================================

export const DEFAULT_TARGETS_KAJAL: TargetValues = {
  monthlyTargetOp: 1200000, // ₹ 12,00,000 (C56)
  monthlyTargetSr: 600000,  // ₹ 6,00,000 (D56)
  monthlyAchievedOp: 980000, // ₹ 9,80,000 (C57)
  monthlyAchievedSr: 520000, // ₹ 5,20,000 (D57)
  
  weeklyTargetOp: 300000,   // ₹ 3,00,000 (G56)
  weeklyTargetSr: 150000,   // ₹ 1,50,000 (H56)
  weeklyAchievedOp: 275000, // ₹ 2,75,000 (G57)
  weeklyAchievedSr: 140000, // ₹ 1,40,000 (H57)
  
  dailyTargetRenewals: 15,
  dailyTargetQuotation: 8,
  
  remarks: 'Q3 Government & PSU GeM Tender Acquisition Plan'
};

export const CURRENT_WEEK_SHEET_KAJAL: WeeklyReviewSheetData = {
  id: 'sheet-kajal-w35',
  cycleId: 'cycle-w35',
  cycleLabel: 'Week 35: Aug 25 – Aug 31, 2026',
  isCurrent: true,
  status: 'draft',
  sheetType: 'tender_operations',
  
  // Section 1: Employee & Attendance Details (Rows 3-6)
  attendance: {
    name: 'Kajal Gaur',
    role: 'Tender Executive / Bidding',
    team: 'Tender / Sales',
    reviewDate: '2026-09-01',
    periodStart: '2026-08-25',
    periodEnd: '2026-08-31',
    leaves: 0,
    lates: 0,
    shHd: 0 // SD / HD
  },
  
  // Section 2: Daily Tender Operations (Rows 8-14)
  // Formula: =(SUM(C10:I10)/(B10*6))*100
  dailyTenderOperations: [
    {
      id: 'dto-1',
      task: 'Tender Search',
      targetPerDay: 15,
      days: { mon: 14, tue: 16, wed: 15, thu: 18, fri: 15, sat: 12, sun: 0 },
      remarks: 'Scanned GeM, CPPP, IREPS, NHAI, Delhi Metro portals'
    },
    {
      id: 'dto-2',
      task: 'Tender Filing',
      targetPerDay: 3,
      days: { mon: 2, tue: 3, wed: 4, thu: 3, fri: 3, sat: 2, sun: 0 },
      remarks: 'Filing completed within technical deadline windows'
    },
    {
      id: 'dto-3',
      task: 'Preparation, Submission &',
      targetPerDay: 4,
      days: { mon: 4, tue: 4, wed: 5, thu: 3, fri: 4, sat: 3, sun: 0 },
      remarks: 'Costing, BOQ estimation & tender document packets prepared'
    },
    {
      id: 'dto-4',
      task: 'Tender Documentation',
      targetPerDay: 5,
      days: { mon: 5, tue: 6, wed: 5, thu: 5, fri: 6, sat: 4, sun: 0 },
      remarks: 'EMD, PBG, Solvency certificates & affidavits verified'
    },
    {
      id: 'dto-5',
      task: 'LD & Quotation & Tender Follow-up',
      targetPerDay: 8,
      days: { mon: 8, tue: 9, wed: 7, thu: 8, fri: 9, sat: 6, sun: 0 },
      remarks: 'Pre-bid queries clarifications submitted to nodal officers'
    }
  ],
  
  // Section 3: Weekly Tasks / KRA Tracker (Rows 16-24)
  tenderWeeklyKRA: {
    fortnightlyPaymentCalling: {
      status: 'Completed',
      remarks: 'Scanned 18 institutional bills; cleared ₹2.80L payments'
    },
    serviceFeedbacks: [
      { id: 'sf-1', site: 'DLF Mall Saket', status: 'Completed' },
      { id: 'sf-2', site: 'Max Healthcare Patparganj', status: 'Completed' },
      { id: 'sf-3', site: 'RailTel HQ Gurgaon', status: 'In Progress' },
      { id: 'sf-4', site: 'CPWD Complex Lodhi Road', status: 'Completed' }
    ],
    sitePics: [
      { id: 'sp-1', site: 'DLF Mall Saket', status: 'Completed' },
      { id: 'sp-2', site: 'Max Healthcare Patparganj', status: 'Completed' },
      { id: 'sp-3', site: 'RailTel HQ Gurgaon', status: 'In Progress' },
      { id: 'sp-4', site: 'CPWD Complex Lodhi Road', status: 'Completed' }
    ],
    extensionAtTenderSites: [
      { id: 'ext-1', site: 'DLF Mall Saket', status: 'Completed' },
      { id: 'ext-2', site: 'Max Healthcare Patparganj', status: 'Completed' },
      { id: 'ext-3', site: 'RailTel HQ Gurgaon', status: 'Pending' },
      { id: 'ext-4', site: 'CPWD Complex Lodhi Road', status: 'Completed' }
    ],
    newAssociatesSearch: [
      { id: 'na-1', stateCity: 'Jaipur, Rajasthan' },
      { id: 'na-2', stateCity: 'Chandigarh / Mohali' },
      { id: 'na-3', stateCity: 'Lucknow, UP' },
      { id: 'na-4', stateCity: 'Dehradun, UK' }
    ]
  },
  
  // Section 4: Tender Pipeline & Bid Performance (Rows 26-36)
  // Formula: =(C28/B28)*100
  tenderPipeline: [
    { id: 'tp-1', metric: 'Tender Search', target: 90, actual: 90, status: 'Completed', remarks: 'Full portal scan active' },
    { id: 'tp-2', metric: 'Tender Filed', target: 18, actual: 17, status: 'Completed', remarks: '17 complete bids uploaded' },
    { id: 'tp-3', metric: 'Tender Products', target: 8, actual: 7, status: 'Completed', remarks: 'Rodenticide & trap supply bids' },
    { id: 'tp-4', metric: 'Tender Services', target: 10, actual: 10, status: 'Completed', remarks: 'Hospital & commercial annual pest AMC' },
    { id: 'tp-5', metric: 'Tender Eligible', target: 16, actual: 15, status: 'Completed', remarks: 'MSME / StartUp India exemption used' },
    { id: 'tp-6', metric: 'Tender Lost', target: 0, actual: 2, status: 'Completed', remarks: 'L2 lost on lowest price bid' },
    { id: 'tp-7', metric: 'Tender Pipeline', target: 25, actual: 24, status: 'In Progress', remarks: 'Under financial evaluation' },
    { id: 'tp-8', metric: 'Tenders Finalised', target: 6, actual: 5, status: 'Completed', remarks: '5 work orders awarded' },
    { id: 'tp-9', metric: 'Finalised Amount (₹)', target: 1200000, actual: 1050000, status: 'Completed', remarks: '₹10.50 Lakhs total booking' }
  ],
  
  // Section 5: Bid Stage & Tender Compliance Checks (Rows 38-41)
  bidStageCompliance: [
    {
      id: 'bsc-1',
      category: 'Technical',
      bidOpen: 12,
      finalCount: 10,
      lostCount: 1,
      status: 'L1',
      remarks: 'Technical evaluation score 98% across PSU tenders'
    },
    {
      id: 'bsc-2',
      category: 'Financial',
      bidOpen: 10,
      finalCount: 8,
      lostCount: 2,
      status: 'L1',
      remarks: 'Declared L1 in 8 tenders; L2 in 2 tenders'
    }
  ],
  
  // Section 6: Running Accounts — Payments Calling (Rows 43-46)
  runningAccounts: [
    {
      category: 'Pending Accounts',
      dealsCalledCount: 28,
      pendingAmount: 450000,
      amountReceivedThisWeek: 280000,
      remarks: 'Recovered ₹2.80L from government and hospital institutional bills'
    }
  ],
  
  // Section 7: Daily Tasks - Calling for Tender Desk (Rows 48-53)
  // Formula: =(SUM(C50:I50)/(B50*6))*100
  dailySalesTenderTasks: [
    {
      id: 'dst-1',
      task: 'Renewals',
      targetPerDay: 15,
      days: { tue: 14, wed: 16, thu: 15, fri: 17, sat: 13, sun: 0, mon: 15 }
    },
    {
      id: 'dst-2',
      task: 'New Sales (As & When)',
      targetPerDay: 8,
      days: { tue: 7, wed: 9, thu: 8, fri: 8, sat: 6, sun: 0, mon: 8 }
    },
    {
      id: 'dst-3',
      task: 'Personal Ref.',
      targetPerDay: 4,
      days: { tue: 4, wed: 4, thu: 5, fri: 4, sat: 3, sun: 0, mon: 4 }
    }
  ],
  
  // Section 8: Targets & Achievement (OV) (Rows 55-59)
  // Formulas: =100*(C57/C56), =100*(D57/D56), =100*(G57/G56), =100*(H57/H56)
  targets: {
    monthlyTargetOp: 1200000, // C56
    monthlyTargetSr: 600000,  // D56
    monthlyAchievedOp: 980000, // C57
    monthlyAchievedSr: 520000, // D57
    
    weeklyTargetOp: 300000,   // G56
    weeklyTargetSr: 150000,   // H56
    weeklyAchievedOp: 275000, // G57
    weeklyAchievedSr: 140000, // H57
    
    dailyTargetRenewals: 15,
    dailyTargetQuotation: 8,
    
    remarks: 'Strong bid conversion rate on GeM; L1 status achieved in 8 tenders.'
  },
  targetApprovalStatus: 'approved',
  
  // Default Customer Care matrices (fallback structure)
  dailyTasks: {
    callingAndQuotes: [
      { id: 'dq-k1', taskName: 'Renewals Calling', targetPerDay: 15, days: { mon: 15, tue: 14, wed: 16, thu: 15, fri: 17, sat: 13, sun: 0 } },
      { id: 'dq-k2', taskName: 'Quotation', targetPerDay: 8, days: { mon: 8, tue: 7, wed: 9, thu: 8, fri: 8, sat: 6, sun: 0 } }
    ],
    ccOverview: {
      staffTraining: 'Trained junior staff on GeM portal bidding checklist',
      staffIssues: 'None',
      clientComplaints: '0',
      aplIssues: 'None'
    },
    phoneHandling: {
      whatsapp: 28,
      msgs: 35,
      leads: 22,
      finalized: 8,
      amount: 415000,
      remarks: 'Tender pre-qualification inquiries closed'
    }
  },
  weeklyTasks: [
    {
      id: 'wt-k1',
      occurrence: 'Fortnightly',
      task: 'Payment Calling – Scanning',
      priority: 'High',
      dueDate: '2026-08-30',
      status: 'Completed',
      nextFollowUp: '2026-09-06',
      remarks: 'Scanned 18 institutional bills'
    }
  ],
  monthlyTasks: [
    {
      id: 'mt-k1',
      occurrence: 'Monthly',
      task: 'Service Feedbacks from Tender Clients',
      status: 'Completed',
      tat: '3 Days',
      reasonForPendency: 'None',
      remarkIfAny: 'Feedback verified across 4 sites'
    }
  ],
  salesMetrics: [
    { category: 'New Inquiries', opFinalCount: 10, opValue: 180000, srFinalCount: 5, srValue: 80000, remarks: 'Institutional RFPs' },
    { category: 'Renewal Calls', opFinalCount: 15, opValue: 220000, srFinalCount: 8, srValue: 110000, remarks: 'Annual contract extensions' },
    { category: 'Personal Referrals (PR)', opFinalCount: 4, opValue: 65000, srFinalCount: 2, srValue: 35000, remarks: 'Director referrals' }
  ],
  
  // Section 9: Client Feedback (Rows 61-64)
  clientFeedback: {
    testimonial: '"Kajal was extremely thorough with the GeM documentation and bid compliance. Everything from the safety audit sheets to chemical test reports was uploaded flawlessly." — Facilities Director, RailTel Corporation.',
    clientName: 'Facilities Director (RailTel)',
    rating: 5,
    clientReviewsCount: 14,
    clientReviewsDetails: '5-star reviews on GeM and CPPP portal from CPWD & Max Healthcare',
    videoTestimonialsCount: 3,
    videoTestimonialsDetails: 'Recorded video endorsements from DMRC & RailTel site heads'
  },
  
  // Section 10: Achievements (Rows 66-70)
  achievements: [
    { id: 'ach-k1', text: 'Achievement 1: Bagged ₹10.5 Lakhs institutional tender contract for Delhi Metro Rail Corporation site sanitization.' },
    { id: 'ach-k2', text: 'Achievement 2: Zero document rejections across all 17 filed tenders on CPPP and GeM portals.' },
    { id: 'ach-k3', text: 'Achievement 3: Onboarded 4 new regional associate vendors across Jaipur, Chandigarh, Lucknow, and Dehradun.' }
  ],
  
  // Section 11: Stuck Points / Roadblocks (Rows 72-76)
  stuckPoints: [
    {
      id: 'sp-k1',
      stuckPoint: 'Stuck #1: Delay in physical EMD DD clearance from PSU bank',
      reason: 'Bank branch server downtime',
      cta: 'Switched to e-PBG / Bank Guarantee portal'
    },
    {
      id: 'sp-k2',
      stuckPoint: 'Stuck #2: GeM portal OTP SMS latency during peak filing window (4-5 PM)',
      reason: 'GeM gateway overload',
      cta: 'Schedule final submission before 1 PM on deadline day'
    },
    {
      id: 'sp-k3',
      stuckPoint: 'Stuck #3: Client delay in issuing signed work completion certificate',
      reason: 'Client site manager on leave',
      cta: 'Sent escalation email to Head of Procurement'
    }
  ],
  
  // Section 12: Learning & Improvement (Rows 78-80)
  learningImprovement: {
    newImplemented: 'Created standard checklist template for technical qualification criteria, reducing bid preparation time by 25%.',
    anythingElse: 'Need automated alert 72 hours before EMD validity expiration.',
    thisWeekNotes: 'This Week / : Implemented digital bid checklist; reduced turnaround to 4 hours per tender.'
  },
  
  // Section 13: Weekly Summary (Rows 82-88)
  weeklySummary: {
    avgDailyTaskCompletion: 96.5,
    avgWeeklyTaskAchievement: 91.5,
    analysis: 'Outstanding tender execution by Kajal. Hit 94% of tender filing quota and secured L1 standing in 8 major tenders with ₹10.5L contract booking.',
    reviewedBy: 'Rajiv Sharma (Managing Director / Reviewer)',
    reviewDate: '2026-09-01'
  },
  
  createdAt: '2026-08-25T09:00:00Z',
  updatedAt: '2026-09-01T18:00:00Z'
};

export const PREVIOUS_WEEK_SHEET_KAJAL: WeeklyReviewSheetData = {
  ...CURRENT_WEEK_SHEET_KAJAL,
  id: 'sheet-kajal-w34',
  cycleId: 'cycle-w34',
  cycleLabel: 'Week 34: Aug 18 – Aug 24, 2026',
  isCurrent: false,
  status: 'approved',
  attendance: {
    ...CURRENT_WEEK_SHEET_KAJAL.attendance,
    reviewDate: '2026-08-25',
    periodStart: '2026-08-18',
    periodEnd: '2026-08-24'
  }
};

export const INITIAL_MEMBER_KAJAL: MemberProfile = {
  id: 'member-kajal',
  name: 'Kajal Gaur',
  role: 'Tender Operations & Bidding Executive',
  department: 'Tender / Sales',
  email: 'kajal.gaur@pestcure.com',
  phone: '+91 98711 44520',
  avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  sheetType: 'tender_operations',
  approvedTargets: DEFAULT_TARGETS_KAJAL,
  sheets: [CURRENT_WEEK_SHEET_KAJAL, PREVIOUS_WEEK_SHEET_KAJAL]
};

// ==========================================
// 3. ALKA GHAI (Commercial & Business Development)
// ==========================================

export const DEFAULT_TARGETS_ALKA: TargetValues = {
  monthlyTargetOp: 1000000, // ₹ 10,00,000 (OP)
  monthlyTargetSr: 500000,  // ₹ 5,00,000 (SR)
  monthlyAchievedOp: 850000, // ₹ 8,50,000
  monthlyAchievedSr: 460000, // ₹ 4,60,000
  
  weeklyTargetOp: 250000,   // ₹ 2,50,000
  weeklyTargetSr: 125000,   // ₹ 1,25,000
  weeklyAchievedOp: 235000, // ₹ 2,35,000
  weeklyAchievedSr: 118000, // ₹ 1,18,000
  
  dailyTargetRenewals: 20,
  dailyTargetQuotation: 15,
  
  remarks: 'Focus on high-value corporate inquiries, AI sales conversion & BNI referral expansion.'
};

export const CURRENT_WEEK_SHEET_ALKA: WeeklyReviewSheetData = {
  id: 'sheet-alka-w35',
  cycleId: 'cycle-w35',
  cycleLabel: 'Week 35: Aug 25 – Aug 31, 2026',
  isCurrent: true,
  status: 'draft',
  sheetType: 'commercial_bd',
  
  // Section 1: Employee & Attendance Details
  attendance: {
    name: 'Alka Ghai',
    role: 'Business Development Executive',
    team: 'Commercial & BD',
    reviewDate: '2026-09-01',
    periodStart: '2026-08-25',
    periodEnd: '2026-08-31',
    leaves: 0,
    lates: 0,
    shHd: 0
  },
  
  // Section 2: Daily Tasks (Alka Ghai specific)
  // Tasks: Commercial - New Inquiries, Renewals - Commercial Accounts, LD & Quotation Followup
  dailyCommercialTasks: [
    {
      id: 'dcb-1',
      task: 'Commercial - New Inquiries',
      targetPerDay: 10,
      days: { tue: 11, wed: 12, thu: 10, fri: 9, sat: 11, sun: 0, mon: 10 }
    },
    {
      id: 'dcb-2',
      task: 'Renewals - Commercial Accounts',
      targetPerDay: 15,
      days: { tue: 16, wed: 15, thu: 14, fri: 17, sat: 13, sun: 0, mon: 16 }
    },
    {
      id: 'dcb-3',
      task: 'LD & Quotation Followup',
      targetPerDay: 12,
      days: { tue: 13, wed: 12, thu: 14, fri: 11, sat: 10, sun: 0, mon: 13 }
    }
  ],
  
  // Section 3: Weekly Tasks
  commercialWeeklyTasks: [
    {
      id: 'cwt-1',
      occurrence: 'Weekly',
      task: 'Payment Calling - Scanning',
      support: '',
      status: 'Completed',
      target: 25,
      actual: 24,
      remarks: 'Scanned 25 corporate ledgers; ₹2.15L received'
    },
    {
      id: 'cwt-2',
      occurrence: 'Weekly',
      task: 'AI Sales',
      support: 'Payal',
      status: 'Completed',
      target: 10,
      actual: 9,
      remarks: 'Pitching AI smart monitoring to food manufacturing facilities'
    },
    {
      id: 'cwt-3',
      occurrence: 'Weekly',
      task: 'IndiaMart / AdWords / ',
      support: 'Payal or Aparna',
      status: 'Completed',
      target: 20,
      actual: 19,
      remarks: 'Inbound high-intent B2B leads processed within 15 min TAT'
    },
    {
      id: 'cwt-4',
      occurrence: 'Weekly',
      task: 'Team Sales Target (Week)',
      support: '',
      status: 'Completed',
      target: 250000,
      actual: 235000,
      remarks: '94% achievement across corporate accounts'
    },
    {
      id: 'cwt-5',
      occurrence: 'Weekly',
      task: 'Team Sales Target (Month)',
      support: '',
      status: 'In Progress',
      target: 1000000,
      actual: 920000,
      remarks: 'Tracking strongly at 92% of monthly run rate'
    }
  ],
  
  // Section 3B: BD Review & Vendor Details
  commercialBDReview: {
    vendorRegistration: {
      vendorsAdded: '6 Completed (Apollo, Max Healthcare, DLF)',
      remarks: 'Vendors added at prospects and corporate clients'
    },
    pcProduct: {
      productsAddedInfo: 'PC Ultra Fly Catcher, Bird Spikes & Rodent Bait Stations catalog live',
      productSaleValue: 125000,
      remarks: 'Strong interest from hospitality & warehouse chains'
    },
    bdTeamReview: {
      teamAchievements: 'Closed 2 major multi-location warehouse annual contracts in Manesar & Greater Noida',
      majorIssue: 'Extended client purchase order release cycles due to multi-tier approvals',
      suggestion: 'Introduce standardized fast-track master service agreement (MSA) for corporate accounts'
    }
  },
  
  // Section 4: Monthly / Quarterly Tasks
  monthlyTasks: [
    {
      id: 'mt-a1',
      occurrence: 'Monthly',
      task: 'BD Training & Guidance',
      status: 'Completed',
      tat: '3 Days',
      reasonForPendency: 'None',
      remarkIfAny: 'Trained sales reps on HACCP audit presentation'
    },
    {
      id: 'mt-a2',
      occurrence: 'Monthly',
      task: 'Associate Search & Addition',
      status: 'In Progress',
      tat: '5 Days',
      reasonForPendency: 'Evaluating 2 regional channel partners in Noida',
      remarkIfAny: 'Background verification in progress'
    },
    {
      id: 'mt-a3',
      occurrence: 'Monthly',
      task: 'Promotional Material',
      status: 'Completed',
      tat: '2 Days',
      reasonForPendency: 'None',
      remarkIfAny: 'Updated corporate brochure with latest eco-friendly green certifications'
    },
    {
      id: 'mt-a4',
      occurrence: 'Monthly',
      task: 'BD SOPs - Videos & PPTs',
      status: 'Completed',
      tat: '4 Days',
      reasonForPendency: 'None',
      remarkIfAny: 'Commercial client pitch deck revised'
    },
    {
      id: 'mt-a5',
      occurrence: 'Quarterly',
      task: 'Referral Partner Training',
      status: 'In Progress',
      tat: '10 Days',
      reasonForPendency: 'Q3 partner summit scheduled for next Friday',
      remarkIfAny: 'Invited 18 facility managers across NCR'
    }
  ],
  
  // Section 5: Sales Metrics: New Inquiries, Renewals & Referrals (Weekly OV)
  salesMetrics: [
    {
      category: 'New Inquiries',
      opFinalCount: 12,
      opValue: 145000,
      srFinalCount: 6,
      srValue: 65000,
      remarks: 'Corporate plants & commercial kitchens'
    },
    {
      category: 'Renewal Calls',
      opFinalCount: 18,
      opValue: 175000,
      srFinalCount: 12,
      srValue: 95000,
      remarks: 'Commercial complex annual contracts'
    },
    {
      category: 'Personal Referrals (PR)',
      opFinalCount: 5,
      opValue: 60000,
      srFinalCount: 3,
      srValue: 30000,
      remarks: 'BNI and industry chapter referrals'
    }
  ],
  
  // Section 6: Running Accounts — Pending Payments
  runningAccounts: [
    {
      category: 'Pending Accounts',
      dealsCalledCount: 40,
      pendingAmount: 380000,
      amountReceivedThisWeek: 215000,
      remarks: 'Collected ₹2.15L; balance committed by 10th pro-rata'
    }
  ],
  
  // Section 7: Targets & Achievement (OV)
  targets: {
    monthlyTargetOp: 1000000,
    monthlyTargetSr: 500000,
    monthlyAchievedOp: 850000,
    monthlyAchievedSr: 460000,
    
    weeklyTargetOp: 250000,
    weeklyTargetSr: 125000,
    weeklyAchievedOp: 235000,
    weeklyAchievedSr: 118000,
    
    dailyTargetRenewals: 20,
    dailyTargetQuotation: 15,
    
    remarks: 'Achieved 94% weekly OP target and 94.4% weekly SR target. Solid commercial volume.'
  },
  targetApprovalStatus: 'approved',
  
  // Section 8: Other Sales Channels
  otherSalesChannels: [
    {
      id: 'osc-1',
      channel: 'Renewal Sales',
      target: 200000,
      achieved: 195000,
      remarks: '97.5% renewal retention rate'
    },
    {
      id: 'osc-2',
      channel: 'Google Sales',
      target: 150000,
      achieved: 140000,
      remarks: 'High intent B2B inbound search clicks'
    },
    {
      id: 'osc-3',
      channel: 'BNI Sales',
      target: 100000,
      achieved: 95000,
      remarks: '3 cross-chapter client conversions'
    },
    {
      id: 'osc-4',
      channel: 'Apl Ref Sales',
      target: 80000,
      achieved: 75000,
      remarks: 'App-directed referrals'
    }
  ],
  
  // Section 9: Vendor Registration Numbers
  vendorRegistrationMetrics: [
    {
      id: 'vrm-1',
      metric: '# VR Final (Vendor Registrations completed)',
      count: 6,
      remarks: 'Vendor code assigned and active'
    },
    {
      id: 'vrm-2',
      metric: '# VRR Pipeline (Requests in pipeline)',
      count: 11,
      remarks: 'Awaiting vendor portal verification'
    }
  ],
  
  // Section 10: Recognition
  recognition: {
    topPerformerSpr: {
      name: 'Suresh Kumar (Sales Lead)',
      remarks: 'Closed highest new commercial acquisition value'
    },
    topPerformerOfc: {
      name: 'Neha Sharma (Operations)',
      remarks: 'Flawless execution of hospital compliance audits'
    }
  },
  
  // Section 11: Client Feedback
  clientFeedback: {
    testimonial: '"Alka and the PestCure Commercial BD team provided a comprehensive integrated pest management proposal tailored to our 50,000 sq.ft food processing facility. Extremely professional documentation and competitive pricing!" — VP Operations, Sunrise Foods.',
    clientName: 'VP Operations (Sunrise Foods)',
    rating: 5,
    clientReviewsCount: 16,
    clientReviewsDetails: 'Verified Google B2B reviews & client recommendation letters',
    videoTestimonialsCount: 2,
    videoTestimonialsDetails: 'Recorded from Sunrise Foods plant & Grand Regency Hotel'
  },
  
  // Section 12: Achievements
  achievements: [
    { id: 'ach-a1', text: 'Achievement 1: Secured ₹4.2 Lakhs annual AMC contract for 3 corporate logistics warehouses in Gurugram.' },
    { id: 'ach-a2', text: 'Achievement 2: Achieved 95.8% weekly daily task quota completion across new inquiries and renewal calls.' },
    { id: 'ach-a3', text: 'Achievement 3: Successfully onboarded 6 new enterprise clients with completed vendor registration.' }
  ],
  
  // Section 13: Stuck Points / Roadblocks
  stuckPoints: [
    {
      id: 'sp-a1',
      stuckPoint: 'Stuck #1: Delay in vendor onboarding approval on SAP portal for multi-national corporate',
      reason: 'Client requires additional comprehensive liability insurance certificate',
      cta: 'Accounts team dispatched updated insurance policy document on Wednesday'
    },
    {
      id: 'sp-a2',
      stuckPoint: 'Stuck #2: Negotiation on credit terms for 90-day billing cycle with pharma plant',
      reason: 'Standard corporate procurement policy',
      cta: 'Offered 3% prompt payment discount for 15-day settlement'
    },
    {
      id: 'sp-a3',
      stuckPoint: 'Stuck #3: Client requested eco-friendly herbal gel chemical test reports for food prep area',
      reason: 'HACCP auditor pre-requisite',
      cta: 'Shared certified NABL laboratory assay certificate'
    }
  ],
  
  // Section 14: Learning & Improvement
  learningImprovement: {
    newImplemented: 'Introduced automated quotation follow-up cadences on CRM with customized rate cards.',
    anythingElse: 'Need automated WhatsApp alerts for commercial contract renewal 45 days prior.',
    thisWeekNotes: 'New This Week / : Created customized B2B pitch decks emphasizing HACCP & NABH compliance.'
  },
  
  // Section 15: Weekly Summary
  weeklySummary: {
    avgDailyTaskCompletion: 94.2,
    avgWeeklyTaskAchievement: 93.4,
    analysis: 'Exceptional commercial BD performance by Alka. Strong lead-to-conversion velocity, robust vendor registration pipeline, and target achievement over 93%.',
    reviewedBy: 'Rajiv Sharma (Managing Director / Reviewer)',
    reviewDate: '2026-09-01'
  },
  
  // Fallback defaults for standard weeklyTasks/dailyTasks
  dailyTasks: {
    callingAndQuotes: [
      { id: 'dq-a1', taskName: 'Commercial - New Inquiries', targetPerDay: 10, days: { mon: 10, tue: 11, wed: 12, thu: 10, fri: 9, sat: 11, sun: 0 } },
      { id: 'dq-a2', taskName: 'Renewals - Commercial Accounts', targetPerDay: 15, days: { mon: 16, tue: 16, wed: 15, thu: 14, fri: 17, sat: 13, sun: 0 } },
      { id: 'dq-a3', taskName: 'LD & Quotation Followup', targetPerDay: 12, days: { mon: 13, tue: 13, wed: 12, thu: 14, fri: 11, sat: 10, sun: 0 } }
    ],
    ccOverview: {
      staffTraining: 'Trained BD tele-sales on corporate RFP submission',
      staffIssues: 'None',
      clientComplaints: '0',
      aplIssues: 'None'
    },
    phoneHandling: {
      whatsapp: 42,
      msgs: 55,
      leads: 32,
      finalized: 14,
      amount: 380000,
      remarks: 'Commercial proposals closed'
    }
  },
  weeklyTasks: [
    {
      id: 'wt-a1',
      occurrence: 'Weekly',
      task: 'Payment Calling - Scanning',
      priority: 'High',
      dueDate: '2026-08-30',
      status: 'Completed',
      nextFollowUp: '2026-09-06',
      remarks: 'Scanned 25 corporate ledgers'
    }
  ],
  
  createdAt: '2026-08-25T09:00:00Z',
  updatedAt: '2026-09-01T18:00:00Z'
};

export const PREVIOUS_WEEK_SHEET_ALKA: WeeklyReviewSheetData = {
  ...CURRENT_WEEK_SHEET_ALKA,
  id: 'sheet-alka-w34',
  cycleId: 'cycle-w34',
  cycleLabel: 'Week 34: Aug 18 – Aug 24, 2026',
  isCurrent: false,
  status: 'approved',
  attendance: {
    ...CURRENT_WEEK_SHEET_ALKA.attendance,
    reviewDate: '2026-08-25',
    periodStart: '2026-08-18',
    periodEnd: '2026-08-24'
  }
};

export const INITIAL_MEMBER_ALKA: MemberProfile = {
  id: 'member-alka',
  name: 'Alka Ghai',
  role: 'Business Development Executive',
  department: 'Commercial & BD',
  email: 'alka.ghai@pestcure.com',
  phone: '+91 98102 33819',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  sheetType: 'commercial_bd',
  approvedTargets: DEFAULT_TARGETS_ALKA,
  sheets: [CURRENT_WEEK_SHEET_ALKA, PREVIOUS_WEEK_SHEET_ALKA]
};

export const INITIAL_MEMBERS: MemberProfile[] = [
  INITIAL_MEMBER_ALKA,
  INITIAL_MEMBER_KAJAL,
  INITIAL_MEMBER_DEEPIKA
];

export const INITIAL_AUDIT_LOGS: TargetAuditLog[] = [
  {
    id: 'log-a1',
    timestamp: '2026-08-01 10:30 AM',
    action: 'System Initialized',
    actorName: 'System Default',
    actorRole: 'admin',
    newTargets: DEFAULT_TARGETS_ALKA,
    notes: 'Q3 Baseline Targets set for Commercial & Business Development (Alka Ghai)'
  },
  {
    id: 'log-k1',
    timestamp: '2026-08-01 10:30 AM',
    action: 'System Initialized',
    actorName: 'System Default',
    actorRole: 'admin',
    newTargets: DEFAULT_TARGETS_KAJAL,
    notes: 'Q3 Baseline Targets set for Tender Operations & Bidding (Kajal Gaur)'
  },
  {
    id: 'log-1',
    timestamp: '2026-08-01 10:30 AM',
    action: 'System Initialized',
    actorName: 'System Default',
    actorRole: 'admin',
    newTargets: DEFAULT_TARGETS_DEEPIKA,
    notes: 'Q3 Baseline Targets set for Customer Care & Renewal Operations (Deepika Gulia)'
  },
  {
    id: 'log-2',
    timestamp: '2026-08-18 04:15 PM',
    action: 'Proposed',
    actorName: 'Deepika Gulia',
    actorRole: 'member',
    previousTargets: DEFAULT_TARGETS_DEEPIKA,
    newTargets: {
      ...DEFAULT_TARGETS_DEEPIKA,
      monthlyTargetOp: 850000,
      weeklyTargetOp: 212500,
      dailyTargetRenewals: 35
    },
    notes: 'Increased renewal target due to festive commercial advance contracts.'
  },
  {
    id: 'log-3',
    timestamp: '2026-08-19 11:00 AM',
    action: 'Modified & Approved',
    actorName: 'Managing Director / Reviewer',
    actorRole: 'admin',
    previousTargets: DEFAULT_TARGETS_DEEPIKA,
    newTargets: {
      ...DEFAULT_TARGETS_DEEPIKA,
      monthlyTargetOp: 850000,
      weeklyTargetOp: 212500,
      dailyTargetRenewals: 32
    },
    notes: 'Approved with daily renewals calibrated to 32 calls/day to maintain quality.'
  }
];
