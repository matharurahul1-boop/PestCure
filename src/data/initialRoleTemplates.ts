import { RoleTemplate } from '../types';

export const INITIAL_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'role-customer-care',
    roleName: 'Customer Care & Retention Specialist',
    department: 'Customer Care & Client Retention',
    sheetType: 'customer_care',
    description: 'Desk calling matrix, renewals follow-up, quotation tracking, client satisfaction.',
    defaultWeeklyTargetOp: 200000,
    defaultWeeklyTargetSr: 112500,
    defaultDailyTargetRenewals: 30,
    defaultDailyTargetQuotation: 12,
    dailyTasks: [
      { taskName: 'Renewals Calling', targetPerDay: 30 },
      { taskName: 'Quotations Prepared & Followed up', targetPerDay: 12 },
      { taskName: 'Customer Complaints & Service Follow-ups', targetPerDay: 15 }
    ],
    weeklyTasks: [
      { task: 'Weekly Client Relationship Touchbase', occurrence: 'Weekly', priority: 'High', remarks: 'High-priority residential and commercial accounts' },
      { task: 'Operational Review & Outstanding Follow-ups', occurrence: 'Wed & Sat', priority: 'Medium', remarks: 'Renewal calls log verification' },
      { task: 'Service Quality Feedback Coordination', occurrence: 'Weekly', priority: 'Medium', remarks: 'Client CSAT rating' }
    ],
    monthlyTasks: [
      { task: 'Monthly Retention & Churn Rate Audit', occurrence: 'Monthly', tat: '1 Month', remarkIfAny: 'Target > 90% retention' },
      { task: 'Customer Feedback Analysis & Process Fixes', occurrence: 'Monthly', tat: '1 Month', remarkIfAny: 'Quarterly review' }
    ],
    salesMetrics: [
      { category: 'New Inquiries', remarks: 'Residential & Commercial' },
      { category: 'Renewal Calls', remarks: 'Annual Contract Renewals' },
      { category: 'Personal Referrals (PR)', remarks: 'Word of mouth clients' }
    ],
    isCustom: false
  },
  {
    id: 'role-tender-ops',
    roleName: 'Tender Operations & GeM Executive',
    department: 'Tender & GeM Bidding Operations',
    sheetType: 'tender_operations',
    description: 'GeM portal tracking, live bid participation, documentation compliance, institutional outreach.',
    defaultWeeklyTargetOp: 350000,
    defaultWeeklyTargetSr: 150000,
    defaultDailyTargetRenewals: 10,
    defaultDailyTargetQuotation: 5,
    dailyTasks: [
      { taskName: 'GeM Portal Daily Bid Tracking & Screening', targetPerDay: 10 },
      { taskName: 'Document Verification & Technical Compliance Checks', targetPerDay: 5 },
      { taskName: 'Institutional Client Outreach & Follow-up', targetPerDay: 8 }
    ],
    weeklyTasks: [
      { task: 'Published Tender Technical Evaluation Submission', occurrence: 'Weekly', priority: 'High', remarks: 'Govt & PSU contracts' },
      { task: 'EMD & Bid Security Document Preparation', occurrence: 'Wed & Sat', priority: 'Urgent', remarks: 'Pre-bid meeting compliance' },
      { task: 'Multi-site Service Feedback Verification', occurrence: 'Weekly', priority: 'Medium', remarks: 'Institutional sites' }
    ],
    monthlyTasks: [
      { task: 'GeM Portal Vendor Rating & Registration Audit', occurrence: 'Monthly', tat: '1 Month', remarkIfAny: 'Maintain Tier-1 status' },
      { task: 'Quarterly Tender Win-Loss Analysis', occurrence: 'Quarterly', tat: 'Quarterly', remarkIfAny: 'Pricing strategy review' }
    ],
    salesMetrics: [
      { category: 'GeM Portal Bids', remarks: 'Central & State PSUs' },
      { category: 'Private Corporate Tenders', remarks: 'Large Commercial Facility Bids' },
      { category: 'Government Department Contracts', remarks: 'Defense, Railways, Hospitals' }
    ],
    isCustom: false
  },
  {
    id: 'role-commercial-bd',
    roleName: 'Business Development Executive (Commercial)',
    department: 'Commercial Business Development',
    sheetType: 'commercial_bd',
    description: 'B2B outreach, commercial site pitches, corporate key accounts, vendor registrations.',
    defaultWeeklyTargetOp: 250000,
    defaultWeeklyTargetSr: 120000,
    defaultDailyTargetRenewals: 20,
    defaultDailyTargetQuotation: 8,
    dailyTasks: [
      { taskName: 'B2B Client Calling & Cold Outreach', targetPerDay: 20 },
      { taskName: 'Commercial Site Proposals Dispatched', targetPerDay: 5 },
      { taskName: 'Facility Managers & Vendor Follow-ups', targetPerDay: 10 }
    ],
    weeklyTasks: [
      { task: 'Warehouse & Facility Contract Pitches', occurrence: 'Weekly', priority: 'High', remarks: 'Logistics hubs & FMCG warehouses' },
      { task: 'Corporate Account Client Review Meetings', occurrence: 'Wed & Sat', priority: 'High', remarks: 'Annual contract pitching' },
      { task: 'Follow-up on Submitted Commercial Quotes', occurrence: 'Weekly', priority: 'Medium', remarks: 'Close within 14 days' }
    ],
    monthlyTasks: [
      { task: 'Key Account Partnership & SLA Review', occurrence: 'Monthly', tat: '1 Month', remarkIfAny: 'Facility management tie-ups' },
      { task: 'Vendor Onboarding & Compliance Documentation', occurrence: 'Monthly', tat: '1 Month', remarkIfAny: 'Pan-India accounts' }
    ],
    salesMetrics: [
      { category: 'Commercial Facility Contracts', remarks: 'Factories, Warehouses, Corporate Offices' },
      { category: 'Hospitality & Food Processing', remarks: 'Hotels, Restaurants, Food Audits' },
      { category: 'Healthcare & Pharma Facilities', remarks: 'Clean-room Pest Management' }
    ],
    isCustom: false
  },
  {
    id: 'role-field-supervisor',
    roleName: 'Field Operations & Service Supervisor',
    department: 'Operations & Field Execution',
    sheetType: 'general_operations',
    description: 'Site audit inspections, technician route supervision, chemical dosage compliance, quality audits.',
    defaultWeeklyTargetOp: 180000,
    defaultWeeklyTargetSr: 90000,
    defaultDailyTargetRenewals: 15,
    defaultDailyTargetQuotation: 6,
    dailyTasks: [
      { taskName: 'Technician Route & Schedule Verification', targetPerDay: 15 },
      { taskName: 'Random Site Quality Audits & Inspection', targetPerDay: 6 },
      { taskName: 'Chemical Dosage & Equipment Safety Verification', targetPerDay: 8 }
    ],
    weeklyTasks: [
      { task: 'Weekly Field Technician Attendance & Performance Audit', occurrence: 'Weekly', priority: 'High', remarks: 'Service log verification' },
      { task: 'Customer Escalations Resolution on Site', occurrence: 'Wed & Sat', priority: 'Urgent', remarks: 'Re-treatment verification' },
      { task: 'Equipment Maintenance & Tool Stock Check', occurrence: 'Weekly', priority: 'Medium', remarks: 'Fogging machines & B&G sprayers' }
    ],
    monthlyTasks: [
      { task: 'Technician Skill & Safety Training Workshop', occurrence: 'Monthly', tat: '1 Month', remarkIfAny: 'IPM & Safe Chemical Handling' },
      { task: 'Quarterly Pesticide Inventory Audit', occurrence: 'Quarterly', tat: 'Quarterly', remarkIfAny: 'Batch expiry inspection' }
    ],
    salesMetrics: [
      { category: 'On-Site Extra Service Add-ons', remarks: 'Spot Treatments, Wood Borer, Termite' },
      { category: 'Technician Spot Leads Converted', remarks: 'Field Referral conversions' },
      { category: 'Commercial Service Extension Signings', remarks: 'Additional area coverage' }
    ],
    isCustom: false
  }
];
