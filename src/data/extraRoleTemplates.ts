import type { Field, Role } from '../workspace/model';
import type { CellValue, Column, TableRow } from '../workspace/tableModel';

/**
 * Role templates built from the uploaded "Barkha Review Sheet" and "Sahil Review Sheet"
 * workbooks. They are merged into the workspace on load (see loadWorkspace) so an admin
 * can assign them when adding a team member; each assignment generates a weekly review
 * form with these KRA sections.
 */

const WEEKDAYS = ['tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'mon'] as const;

const tableField = (id: string, kra: string, label: string, columns: Column[], rows: TableRow[]): Field => ({
  id,
  kra,
  label,
  type: 'table',
  unit: '',
  target: 1,
  owner: 'member',
  direction: 'higher',
  required: false,
  table: { columns, rows, showTotals: false, source: 'Uploaded review sheet' },
});

const row = (id: string, label: string, defaults: Record<string, CellValue> = {}, scored?: boolean): TableRow => ({ id, label, defaults, ...(scored === undefined ? {} : { scored }) });

const attendance = (p: string): Field =>
  tableField(`${p}-attendance`, 'Employee & attendance', 'Employee & attendance',
    [{ id: 'value', label: 'Details', type: 'text' }],
    ['Team', 'Leaves', 'Lates', 'Short / half days'].map((label, i) => row(`${p}-att-${i}`, label, {}, false)));

const dailyActivity = (p: string, items: { label: string; target: number }[]): Field =>
  tableField(`${p}-daily`, 'Daily activity', 'Daily activity',
    [
      { id: 'target', label: 'Target / day', type: 'target', owner: 'member' },
      ...WEEKDAYS.map(d => ({ id: d, label: d[0].toUpperCase() + d.slice(1), type: 'daily' as const })),
      { id: 'total', label: 'Week total', type: 'computed', formula: 'sum', inputs: [...WEEKDAYS] },
      { id: 'percent', label: 'Achievement %', type: 'computed', formula: 'percent', inputs: [...WEEKDAYS], denominator: 'target', multiplier: 6 },
      { id: 'remarks', label: 'Remarks', type: 'text' },
    ],
    items.map((item, i) => row(`${p}-daily-${i}`, item.label, { target: item.target }, true)));

const taskTracker = (p: string, id: string, kra: string, label: string, items: { label: string; occurrence: string; target?: number }[]): Field =>
  tableField(`${p}-${id}`, kra, label,
    [
      { id: 'occurrence', label: 'Occurrence', type: 'text' },
      { id: 'status', label: 'Status', type: 'status' },
      { id: 'target', label: 'Target', type: 'target', owner: 'member' },
      { id: 'actual', label: 'Actual', type: 'number' },
      { id: 'percent', label: 'Achievement %', type: 'computed', formula: 'percent', inputs: ['actual'], denominator: 'target', multiplier: 1 },
      { id: 'remarks', label: 'Remarks', type: 'text' },
    ],
    items.map((item, i) => row(`${p}-${id}-${i}`, item.label, { occurrence: item.occurrence, ...(item.target ? { target: item.target } : {}) }, true)));

const statusList = (p: string, id: string, kra: string, label: string, labels: string[]): Field =>
  tableField(`${p}-${id}`, kra, label,
    [
      { id: 'status', label: 'Status', type: 'status' },
      { id: 'remarks', label: 'Remarks', type: 'text' },
    ],
    labels.map((l, i) => row(`${p}-${id}-${i}`, l, {}, false)));

const textList = (p: string, id: string, kra: string, label: string, labels: string[]): Field =>
  tableField(`${p}-${id}`, kra, label,
    [{ id: 'response', label: 'Response', type: 'text' }],
    labels.map((l, i) => row(`${p}-${id}-${i}`, l)));

const stuckPoints = (p: string): Field =>
  tableField(`${p}-stuck`, 'Stuck points & corrective actions', 'Stuck points & corrective actions',
    [
      { id: 'issue', label: 'Stuck point', type: 'text' },
      { id: 'reason', label: 'Why', type: 'text' },
      { id: 'action', label: 'Corrective action', type: 'text' },
    ],
    ['Stuck #1', 'Stuck #2', 'Stuck #3'].map((l, i) => row(`${p}-stuck-${i}`, l)));

const achievements = (p: string): Field =>
  textList(p, 'achievements', 'Achievements', 'Achievements', ['Achievement 1', 'Achievement 2', 'Achievement 3']);

const learning = (p: string): Field =>
  textList(p, 'learning', 'Learning & improvement', 'Learning & improvement', ['Learned something new this week', 'Improved anything']);

const weeklySummary = (p: string): Field =>
  textList(p, 'summary', 'Weekly summary', 'Weekly summary', ['Avg. daily task completion', 'Avg. weekly task achievement', 'Analysis']);

// Target / actual / achievement% tracker without an occurrence or status column.
const metricTracker = (p: string, id: string, kra: string, label: string, items: { label: string; target?: number }[]): Field =>
  tableField(`${p}-${id}`, kra, label,
    [
      { id: 'target', label: 'Target', type: 'target', owner: 'member' },
      { id: 'actual', label: 'Actual', type: 'number' },
      { id: 'percent', label: 'Achievement %', type: 'computed', formula: 'percent', inputs: ['actual'], denominator: 'target', multiplier: 1 },
      { id: 'remarks', label: 'Remarks', type: 'text' },
    ],
    items.map((item, i) => row(`${p}-${id}-${i}`, item.label, item.target ? { target: item.target } : {}, true)));

const targetsOV = (p: string): Field =>
  metricTracker(p, 'targets-ov', 'Targets & achievement (OV)', 'Targets & achievement (OV)', [
    { label: 'Monthly OP' }, { label: 'Monthly SR' }, { label: 'Weekly OP' }, { label: 'Weekly SR' },
  ]);

const runningAccounts = (p: string): Field =>
  tableField(`${p}-accounts`, 'Running accounts & payments', 'Running accounts — pending payments',
    [
      { id: 'called', label: 'Deals / DLs called', type: 'number' },
      { id: 'pending', label: 'Pending amount', type: 'number' },
      { id: 'received', label: 'Received this week', type: 'number' },
      { id: 'remarks', label: 'Remarks', type: 'text' },
    ],
    [row(`${p}-accounts-0`, 'Pending accounts', {}, false)]);

const clientFeedback = (p: string): Field =>
  tableField(`${p}-feedback`, 'Client feedback', 'Client feedback',
    [
      { id: 'count', label: 'Number', type: 'number' },
      { id: 'details', label: 'Details / link', type: 'text' },
    ],
    ['Client reviews', 'Video testimonials'].map((l, i) => row(`${p}-feedback-${i}`, l, {}, false)));

// Amount / count record table (pipeline & account tracking) — not scored.
const numberList = (p: string, id: string, kra: string, label: string, labels: string[]): Field =>
  tableField(`${p}-${id}`, kra, label,
    [
      { id: 'amount', label: 'Value / amount', type: 'number' },
      { id: 'count', label: 'Count', type: 'number' },
      { id: 'details', label: 'Details / remarks', type: 'text' },
    ],
    labels.map((l, i) => row(`${p}-${id}-${i}`, l, {}, false)));

const barkha: Role = {
  id: 'role-accounts-payments',
  name: 'Accounts & Payments Executive',
  department: 'Accounts — Payments & Billing',
  description: 'Based on Barkha’s uploaded review sheet: daily payment updates, weekly tallies, monthly billing, achievements and stuck points.',
  fields: [
    attendance('barkha'),
    dailyActivity('barkha', [
      { label: 'Online payment updates in CS — NEFT / UPI / Cheques (WhatsApp)', target: 1 },
      { label: 'Axis Bank payment updates', target: 1 },
      { label: 'Zoho Books payment updates (CS & GS)', target: 1 },
      { label: 'Overview payments in DS / GS / SPR / CS', target: 1 },
    ]),
    taskTracker('barkha', 'weekly', 'Weekly & recurring tasks', 'Weekly & recurring tasks', [
      { label: 'Tally update — payments from CS & WhatsApp', occurrence: 'Mon / Wed / Fri', target: 3 },
      { label: 'Tax invoice sheet & maintain follow-ups', occurrence: 'Mon / Wed / Fri', target: 3 },
      { label: 'Bank statement & cash sheet — payment tally', occurrence: 'Weekly', target: 1 },
      { label: 'Tax invoice deals sheet', occurrence: 'Weekly', target: 1 },
      { label: 'Tax invoice & PI generation (1st–10th)', occurrence: 'As & when', target: 1 },
    ]),
    statusList('barkha', 'monthly', 'Monthly & compliance tasks', 'Monthly & compliance tasks', [
      'Monthly accounts close & CA data',
      'Billing sheet — tax invoices upkeep',
      'Expenses data sheet (Axis Bank) to CA',
      'Filing & documentation',
    ]),
    achievements('barkha'),
    stuckPoints('barkha'),
    learning('barkha'),
    weeklySummary('barkha'),
  ],
};

const sahil: Role = {
  id: 'role-accounts-payroll',
  name: 'Accounts & Payroll Executive',
  department: 'Accounts — Payroll & Compliance',
  description: 'Based on Sahil’s uploaded review sheet: payroll cycle, associate commissions, accounts & payment control checks, achievements and stuck points.',
  fields: [
    attendance('sahil'),
    dailyActivity('sahil', [
      { label: 'Asset management (daily / as & when)', target: 1 },
    ]),
    taskTracker('sahil', 'kra', 'Weekly, monthly & as-&-when KRA tracker', 'Weekly, monthly & as-&-when KRA tracker', [
      { label: 'Salary making & distribution — APLs', occurrence: 'Monthly', target: 1 },
      { label: 'Salary distribution — staff', occurrence: 'Monthly', target: 1 },
      { label: 'PF & ESI record keeping / compliance', occurrence: 'Monthly', target: 1 },
      { label: 'Billing & documentation — BLK, tenders & monthly accounts', occurrence: 'Monthly', target: 1 },
      { label: '1% incentive calculation (Wed & Sat)', occurrence: 'As & when', target: 2 },
      { label: '5% & 10% associate commission', occurrence: 'Weekly', target: 1 },
      { label: 'Noida accounts & settlement', occurrence: 'As & when', target: 1 },
    ]),
    statusList('sahil', 'controls', 'Accounts, tax & payment control checks', 'Accounts, tax & payment control checks', [
      'Tax payments sheet updated',
      'Advance / bike reading records',
      'Payments in DS',
      'Payments in GS',
      'Payments in SPR RT',
      'All invoices attached in CRM',
      'Bank reconciliation / entries',
      'Noida accounts & settlement',
      'Vendor ledger tally (monthly)',
    ]),
    textList('sahil', 'followups', 'Follow-ups pending', 'Follow-ups pending', ['Tax payment sheet follow-up pending']),
    achievements('sahil'),
    stuckPoints('sahil'),
    learning('sahil'),
    weeklySummary('sahil'),
  ],
};

// Shared CRE / CRM field supervisor sales-executive format. The uploaded review
// sheets for Dharam, Gautam, Mark David, Dharmendra and Ravi are identical, so
// each gets its own named template built from this one field set.
const salesSupervisorFields = (p: string): Field[] => [
  attendance(p),
  dailyActivity(p, [
    { label: 'LD & quotation follow-up', target: 5 },
    { label: 'Payment calling — scanning', target: 5 },
    { label: 'TR renewals calling — old sheets (Mon / Wed / Fri)', target: 5 },
    { label: 'Site inspection / audit (as scheduled)', target: 1 },
  ]),
  metricTracker(p, 'sales', 'Daily sales', 'Daily sales (value per day, ₹)', [
    { label: 'New sales', target: 20000 },
    { label: 'Renewal sales', target: 3000 },
    { label: 'Cross sales / referral', target: 3000 },
    { label: 'Personal referral', target: 1000 },
  ]),
  targetsOV(p),
  runningAccounts(p),
  achievements(p),
  stuckPoints(p),
  clientFeedback(p),
  learning(p),
  weeklySummary(p),
];

const salesSupervisor = (id: string, prefix: string, person: string): Role => ({
  id,
  name: `Sales Supervisor — CRM & Leads (${person})`,
  department: 'Sales — Supervision & CRM',
  description: `Based on ${person}’s uploaded review sheet (CRE / CRM field-supervisor format): lead generation & CRM, daily follow-up calling, site audits, daily sales value and OV targets.`,
  fields: salesSupervisorFields(prefix),
});

const dharam = salesSupervisor('role-sales-supervisor-crm', 'dharam', 'Dharam');
const gautam = salesSupervisor('role-sales-supervisor-gautam', 'gautam', 'Gautam');
const markDavid = salesSupervisor('role-sales-supervisor-markdavid', 'markdavid', 'Mark David');
const dharmendra = salesSupervisor('role-sales-supervisor-dharmendra', 'dharmendra', 'Dharmendra');
const ravi = salesSupervisor('role-sales-supervisor-ravi', 'ravi', 'Ravi');

const aparna: Role = {
  id: 'role-bd-sales-support',
  name: 'BD Executive — Sales Support',
  department: 'Business Development — Sales Support',
  description: 'Based on Aparna’s uploaded review sheet: daily route & sales support, CRM lead quality, new-inquiry source tracking, running accounts and OV targets.',
  fields: [
    attendance('aparna'),
    dailyActivity('aparna', [
      { label: 'Supervisor’s routes', target: 1 },
      { label: 'New inquiries — calls / WhatsApp group / AdWords', target: 1 },
      { label: 'Quotation bank & draft proposals', target: 1 },
      { label: 'Termite renewal calls', target: 1 },
      { label: 'LD follow-ups & diary calling', target: 1 },
      { label: 'Customer queries & complaints', target: 1 },
    ]),
    statusList('aparna', 'crm', 'Lead management CRM — quality & completeness', 'Lead management CRM — quality & completeness', [
      'Lead status updated (daily)',
      'Duplicate / incomplete leads identified (daily)',
    ]),
    metricTracker('aparna', 'inquiries', 'New inquiries & lead source tracking', 'New inquiries & lead source tracking', [
      { label: 'New inquiries — calls' },
      { label: 'AdWords / Google Ads leads' },
    ]),
    runningAccounts('aparna'),
    targetsOV('aparna'),
    achievements('aparna'),
    stuckPoints('aparna'),
    clientFeedback('aparna'),
    learning('aparna'),
    weeklySummary('aparna'),
  ],
};

const anand: Role = {
  id: 'role-technician-ops-supervisor',
  name: 'Technician Operations Supervisor',
  department: 'Operations — Technician Management',
  description: 'Based on Anand’s uploaded review sheet: daily APL briefing & site visits, technician training, hiring, sales metrics and OV targets.',
  fields: [
    attendance('anand'),
    dailyActivity('anand', [
      { label: 'Major complaint resolve (site name)', target: 1 },
      { label: 'Check morning APL briefing (daily)', target: 1 },
      { label: 'Surprise visits at APL sites', target: 1 },
    ]),
    taskTracker('anand', 'kra', 'Weekly, monthly & as-&-when tasks', 'Weekly, monthly & as-&-when tasks', [
      { label: 'Technical training (topic by Deepika) — 1–15 APLs, one topic', occurrence: 'Weekly', target: 1 },
      { label: 'Gurgaon technician team training', occurrence: 'Weekly', target: 1 },
      { label: 'Invisible Grill team — hire new technicians', occurrence: 'As & when', target: 1 },
      { label: 'Team training — process & timelines (Invisible Grill, Bird Net & TR)', occurrence: 'Monthly', target: 1 },
    ]),
    textList('anand', 'discuss', 'Points to be discussed', 'Points to be discussed', ['Topic 1', 'Topic 2', 'Topic 3']),
    metricTracker('anand', 'sales-metrics', 'Sales metrics (weekly OV)', 'Sales metrics — new inquiries, renewals & referrals', [
      { label: 'New inquiries — OP / SR value' },
      { label: 'Renewal calls — OP / SR value' },
      { label: 'Personal referrals (PR)' },
    ]),
    runningAccounts('anand'),
    targetsOV('anand'),
    achievements('anand'),
    stuckPoints('anand'),
    clientFeedback('anand'),
    learning('anand'),
    weeklySummary('anand'),
  ],
};

const ajeet: Role = {
  id: 'role-ds-schedule-coordinator',
  name: 'DS Schedule & Operations Coordinator',
  department: 'Operations — Scheduling & Coordination',
  description: 'Based on Ajeet’s uploaded review sheet: DS schedule management, same-day complaints, follow-ups, technician supervision, running accounts and OV targets.',
  fields: [
    attendance('ajeet'),
    dailyActivity('ajeet', [
      { label: 'DS schedule management', target: 1 },
      { label: 'Complaint panel — same-day services', target: 1 },
      { label: 'Previous-day follow-ups — payment / pending job / cancellation', target: 1 },
      { label: 'Service cards & direct slips check at reception', target: 1 },
      { label: 'Missing cards / slips from APL — same-day identification', target: 1 },
      { label: 'Qtn fixing in DS schedule for same-day jobs', target: 1 },
      { label: 'Basket vacate — follow-up / completed / cancelled qtns', target: 1 },
      { label: 'Petrol sheet maintenance', target: 1 },
      { label: 'Technician attendance sheet supervision', target: 1 },
      { label: 'Morning technician whereabouts check', target: 1 },
      { label: 'Pending / cancelled jobs carry-forward', target: 1 },
    ]),
    runningAccounts('ajeet'),
    targetsOV('ajeet'),
    achievements('ajeet'),
    stuckPoints('ajeet'),
    clientFeedback('ajeet'),
    learning('ajeet'),
    weeklySummary('ajeet'),
  ],
};

const divya: Role = {
  id: 'role-cc-data-entry',
  name: 'Customer Care Executive — Data & Billing',
  department: 'Customer Care — Data Entry & Billing',
  description: 'Based on Divya’s uploaded review sheet: daily software data entry & billing, books & CRM updation, service cards, billing data control, running accounts and OV targets.',
  fields: [
    attendance('divya'),
    dailyActivity('divya', [
      { label: 'Bill preparation in software', target: 1 },
      { label: 'CRM updation', target: 1 },
      { label: 'Books updation', target: 1 },
      { label: 'Payment calling sheet — new DLs update', target: 1 },
      { label: 'Prefix 12 visits — DS / GS sheet', target: 1 },
      { label: 'Software updation & corrections', target: 1 },
      { label: 'Service cards updation', target: 1 },
      { label: 'LD & quotation follow-up (as & when)', target: 1 },
      { label: 'CC jobs (as & when)', target: 1 },
    ]),
    statusList('divya', 'data-control', 'Billing & software data control', 'Billing & software data control', [
      'Billing entries verified against software',
      'Software data corrections closed',
      'Books reconciled',
    ]),
    runningAccounts('divya'),
    targetsOV('divya'),
    achievements('divya'),
    stuckPoints('divya'),
    clientFeedback('divya'),
    learning('divya'),
    weeklySummary('divya'),
  ],
};

const sufiyan: Role = {
  id: 'role-schedule-management',
  name: 'Schedule Management Executive',
  department: 'Operations — Scheduling & Coordination',
  description: 'Based on Sufiyan’s uploaded review sheet: DS sheet slotting, DOE folder & slips management, daily sales reports, complaint panel, technician coordination and OV targets.',
  fields: [
    attendance('sufiyan'),
    dailyActivity('sufiyan', [
      { label: 'Monthly slotting — DS sheet', target: 1 },
      { label: 'DOE folder management', target: 1 },
      { label: 'Delhi team slips preparation & service readiness', target: 1 },
      { label: 'Sales report — same day / previous day / next day', target: 1 },
      { label: '12 visits done', target: 12 },
    ]),
    taskTracker('sufiyan', 'support', 'Weekly / as-&-when support', 'Weekly / as-&-when support', [
      { label: 'Complaint panel — next-day services', occurrence: 'Daily', target: 1 },
      { label: 'Technicians management — availability / allocation', occurrence: 'As & when', target: 1 },
      { label: 'Clients calls & messages — respond / coordinate', occurrence: 'As & when', target: 1 },
    ]),
    runningAccounts('sufiyan'),
    targetsOV('sufiyan'),
    achievements('sufiyan'),
    stuckPoints('sufiyan'),
    clientFeedback('sufiyan'),
    learning('sufiyan'),
    weeklySummary('sufiyan'),
  ],
};

const rinku: Role = {
  id: 'role-reticulation-sales',
  name: 'Reticulation Sales & Team Building',
  department: 'Sales — Reticulation',
  description: 'Based on Rinku’s uploaded review sheet: reticulation site inspection, LD follow-up, builder touchbase, team training & hiring, sales metrics and OV targets.',
  fields: [
    attendance('rinku'),
    dailyActivity('rinku', [
      { label: 'LD & quotation follow-up', target: 5 },
      { label: 'Reticulation site inspection', target: 1 },
    ]),
    taskTracker('rinku', 'weekly', 'Weekly tasks — reticulation', 'Weekly tasks — reticulation', [
      { label: 'Touchbase — Arc & Builders', occurrence: 'Weekly', target: 1 },
      { label: 'Training & guidance — reticulation team', occurrence: 'Weekly', target: 1 },
    ]),
    metricTracker('rinku', 'hiring', 'Team hiring — reticulation', 'Team hiring — reticulation (current vs target size)', [
      { label: 'Reticulation team size' },
    ]),
    metricTracker('rinku', 'sales-metrics', 'Sales metrics (weekly OV)', 'Sales metrics — new inquiries, renewals & referrals', [
      { label: 'New inquiries — OP / SR value' },
      { label: 'Renewal calls — OP / SR value' },
      { label: 'Personal referrals (PR)' },
    ]),
    runningAccounts('rinku'),
    targetsOV('rinku'),
    achievements('rinku'),
    stuckPoints('rinku'),
    clientFeedback('rinku'),
    learning('rinku'),
    weeklySummary('rinku'),
  ],
};

const praveen: Role = {
  id: 'role-project-sales-bd',
  name: 'Project Sales & Business Development',
  department: 'Sales — Projects & Business Development',
  description: 'Based on Praveen’s uploaded review sheet: project lead generation, site audits, alliances, weekly project management, pipeline control, sales metrics and OV targets.',
  fields: [
    attendance('praveen'),
    dailyActivity('praveen', [
      { label: 'Value of site inspections / audits (₹)', target: 80000 },
      { label: 'LD & quotation follow-up (30 min)', target: 2 },
      { label: 'Payment calling — scanning', target: 4 },
      { label: 'Lead generation — projects', target: 1 },
    ]),
    statusList('praveen', 'lead-gen', 'Project lead generation & business development', 'Project lead generation & business development', [
      'Identify new sectors — hospitality, healthcare, societies, retail chains',
      'Build alliances with facility managers & industry partners',
    ]),
    statusList('praveen', 'servicing', 'Client servicing & cross-functional execution', 'Client servicing & cross-functional execution', [
      'Client escalation & closure tracking',
    ]),
    taskTracker('praveen', 'weekly-pm', 'Weekly project management', 'Weekly project management', [
      { label: 'Review — project accounts', occurrence: 'Weekly', target: 1 },
      { label: 'Touchbase — project clients', occurrence: 'Weekly', target: 1 },
    ]),
    numberList('praveen', 'pipeline', 'Project account & pipeline control', 'Project account & pipeline control', [
      'Project audited', 'LDs in pipeline', 'New project leads', 'Closed project DLs',
    ]),
    metricTracker('praveen', 'sales-metrics', 'Sales metrics (weekly OV)', 'Sales metrics — new inquiries, renewals & referrals', [
      { label: 'New inquiries — OP / SR value' },
      { label: 'Renewals — OP / SR value' },
      { label: 'Personal referrals (PR)' },
    ]),
    runningAccounts('praveen'),
    targetsOV('praveen'),
    achievements('praveen'),
    stuckPoints('praveen'),
    clientFeedback('praveen'),
    learning('praveen'),
    weeklySummary('praveen'),
  ],
};

const payal: Role = {
  id: 'role-sales-lead-management',
  name: 'Sales & Lead Management Executive',
  department: 'Sales — Renewals, AI & Lead Management',
  description: 'Based on Payal’s uploaded review sheet: renewals & new sales, AI / AdWords sales, payment calling, LD & quotation follow-up, materialised quotations and OV targets.',
  fields: [
    attendance('payal'),
    metricTracker('payal', 'daily-sales', 'Daily sales', 'Daily sales (value per day, ₹)', [
      { label: 'Renewals — residential & commercial (4 hrs)' },
      { label: 'New sales (as & when)' },
      { label: 'AI sales' },
      { label: 'AdWords sales' },
      { label: 'Cross sales / referral' },
      { label: 'Personal referral' },
    ]),
    taskTracker('payal', 'weekly', 'Weekly / as-&-when tasks', 'Weekly / as-&-when tasks', [
      { label: 'Payment calling — scanning (Mon / Wed / Fri, 1 hr)', occurrence: 'Mon / Wed / Fri', target: 3 },
      { label: 'LDs & quotations follow-up (30 min)', occurrence: 'Daily', target: 1 },
      { label: 'Materialised quotations — Green / Red entries (Sat, 3 hrs)', occurrence: 'Saturday', target: 1 },
    ]),
    runningAccounts('payal'),
    targetsOV('payal'),
    achievements('payal'),
    stuckPoints('payal'),
    clientFeedback('payal'),
    learning('payal'),
    weeklySummary('payal'),
  ],
};

const vijay: Role = {
  id: 'role-crm-supervisor-lead',
  name: 'CRM & Supervisor Lead',
  department: 'Sales — CRM & Field Supervision',
  description: 'Based on Vijay’s uploaded review sheet: renewals & LD calling, retail-counter touchbase, referral-partner lead generation, field-supervisor training, review & sales targets, sales metrics and OV targets.',
  fields: [
    attendance('vijay'),
    dailyActivity('vijay', [
      { label: 'Renewals calling — VD Sales (90 min)', target: 12 },
      { label: 'LD & quotation follow-up (30 min)', target: 15 },
      { label: 'Payment calling — scanning (30 min)', target: 12 },
      { label: 'Supervisor route sheet overview (30 min)', target: 1 },
    ]),
    taskTracker('vijay', 'weekly', 'Weekly & recurring tasks', 'Weekly & recurring tasks', [
      { label: 'Incentive calculation — sales (weekly & daily)', occurrence: 'Weekly & Daily', target: 1 },
      { label: 'Touchbase at retail counters', occurrence: 'Mon / Wed / Fri', target: 3 },
      { label: 'Training & guidance — field supervisors', occurrence: 'Weekly', target: 1 },
      { label: 'Weekly review of supervisors', occurrence: 'Weekly', target: 1 },
    ]),
    metricTracker('vijay', 'referral-partners', 'Lead generation — referral partners', 'Lead generation — referral partners (leads per source)', [
      { label: 'Carpenter' }, { label: 'Paint shop' }, { label: 'Painter' },
      { label: 'Timber shop' }, { label: 'Tiles shop' }, { label: 'Newspaper vendor' },
    ]),
    metricTracker('vijay', 'supervisor-targets', 'Field-supervisor sales targets', 'Field-supervisor sales targets (target vs actual, ₹)', [
      { label: 'Dharam' }, { label: 'Gautam' }, { label: 'Dharmendra' }, { label: 'Rinku' }, { label: 'Ravi' },
    ]),
    metricTracker('vijay', 'sales-metrics', 'Sales metrics (weekly OV)', 'Sales metrics — new inquiries, renewals & referrals', [
      { label: 'New inquiries — OP / SR value' },
      { label: 'Renewal calls — OP / SR value' },
      { label: 'Personal referrals (PR)' },
    ]),
    numberList('vijay', 'audits', 'Audits', 'Audits — total & KAM', ['Total audits', 'KAM audits']),
    statusList('vijay', 'compliance', 'Compliance checklist', 'Compliance checklist', [
      'All attachments done',
      'Status / SR / other details updated',
      'Conversation history updated',
      'LD / renewal DL updated',
    ]),
    runningAccounts('vijay'),
    targetsOV('vijay'),
    achievements('vijay'),
    stuckPoints('vijay'),
    clientFeedback('vijay'),
    learning('vijay'),
    weeklySummary('vijay'),
  ],
};

export const EXTRA_ROLE_TEMPLATES: Role[] = [barkha, sahil, dharam, gautam, markDavid, dharmendra, ravi, aparna, anand, ajeet, divya, sufiyan, rinku, praveen, payal, vijay];
