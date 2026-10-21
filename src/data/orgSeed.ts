/**
 * Starting org chart (from the PestCure organization chart). Positions are *seats*:
 * the people come and go (org_assignments), the seats and their reporting lines persist.
 * `plannedName` is only a label for a seat nobody has signed up for yet.
 *   parentId  = reports to (solid line) — also the default accountable / approver
 *   guidedBy  = day-to-day guidance (dotted line), display only
 */
export type SeatSeed = {
  id: string; title: string; group?: string; plannedName?: string; roleSlug?: string;
  parentId?: string; guidedBy?: string; kind?: 'internal' | 'partner';
};

export const ORG_SEED: SeatSeed[] = [
  { id: 'founder', title: 'Founder Director', plannedName: 'Ranjan A Sapraa' },

  // strategic partners (coordination, no login)
  { id: 'partner-chro', title: 'Virtual CHRO', plannedName: 'Passionworkx', parentId: 'founder', kind: 'partner' },
  { id: 'partner-cfo', title: 'CFO', plannedName: 'NSGR', parentId: 'founder', kind: 'partner' },
  { id: 'partner-legal', title: 'Legal', plannedName: 'ANA Law', parentId: 'founder', kind: 'partner' },
  { id: 'partner-online', title: 'Online Presence', plannedName: 'TIC', parentId: 'founder', kind: 'partner' },

  // heads
  { id: 'hod-ops', title: 'HOD – Operations', plannedName: 'Deepika Gulia', roleSlug: 'role-customer-care', parentId: 'founder' },
  { id: 'hod-sup', title: 'HOD – Supervisors', plannedName: 'Vijay Dhingra', roleSlug: 'role-crm-supervisor-lead', parentId: 'founder' },
  { id: 'hod-sales', title: 'HOD – Sales', plannedName: 'Alka Ghai', roleSlug: 'role-commercial-bd', parentId: 'founder' },
  { id: 'head-projects', title: 'Projects Head', plannedName: 'Sheenu Gupta', parentId: 'founder' },
  { id: 'head-tenders', title: 'Tenders & Government', plannedName: 'Kajal Gaur', roleSlug: 'role-tender-ops', parentId: 'founder' },
  { id: 'hod-accounts', title: 'HOD – Accounts', plannedName: 'Barkha Monga', roleSlug: 'role-accounts-payments', parentId: 'founder' },

  // operations
  { id: 'ops-routes', title: 'Delhi & NCR Routes', group: 'CC – Delhi', plannedName: 'Sufiyan Saifi', roleSlug: 'role-schedule-management', parentId: 'hod-ops' },
  { id: 'ops-software', title: 'Software', group: 'CC – Delhi', plannedName: 'Divya Kapoor', roleSlug: 'role-cc-data-entry', parentId: 'hod-ops' },
  { id: 'ops-tech', title: 'Technicians & Complaints', group: 'CC – Delhi', plannedName: 'Ajit Kumar', roleSlug: 'role-ds-schedule-coordinator', parentId: 'hod-ops' },
  { id: 'ops-backup', title: 'Back Up & Support', group: 'CC – Delhi', plannedName: 'Garima', parentId: 'hod-ops' },
  { id: 'ops-construction', title: 'Construction Sites & Dues', group: 'CC – Delhi', plannedName: 'Komal Kaur', parentId: 'hod-ops' },
  { id: 'ops-sq', title: 'Service Quality Officer & Technicians Head', group: 'Service Quality', plannedName: 'Anand Mandal', roleSlug: 'role-technician-ops-supervisor', parentId: 'hod-ops' },
  { id: 'ops-ggn-head', title: 'Branch Head – Gurgaon', group: 'Gurgaon Branch', plannedName: 'Shiv Mahender', parentId: 'hod-ops' },
  { id: 'ops-ggn-routes', title: 'CC · Routes & Stock, Gurgaon', group: 'Gurgaon Branch', plannedName: 'Upender Kumar', parentId: 'hod-ops', guidedBy: 'ops-ggn-head' },
  { id: 'ops-ggn-tech', title: 'CC · Technicians & Complaints, GGN', group: 'Gurgaon Branch', plannedName: 'Sunny Mehta', parentId: 'hod-ops', guidedBy: 'ops-ggn-head' },
  { id: 'ops-noida-1', title: 'Customer Care – Noida', group: 'CC – Noida', plannedName: 'Saisha Grover', parentId: 'hod-ops', guidedBy: 'proj-noida' },
  { id: 'ops-noida-2', title: 'Customer Care – Noida', group: 'CC – Noida', plannedName: 'Neeraj', parentId: 'hod-ops', guidedBy: 'proj-noida' },

  // supervisors
  { id: 'sup-central', title: 'Field – Central Delhi', plannedName: 'Dharam Mathur', roleSlug: 'role-sales-supervisor-crm', parentId: 'hod-sup' },
  { id: 'sup-south', title: 'Field – South Delhi', plannedName: 'Gautam Kumar', roleSlug: 'role-sales-supervisor-gautam', parentId: 'hod-sup' },
  { id: 'sup-north', title: 'Field – North Delhi', plannedName: 'Ravi Kushwaha', roleSlug: 'role-sales-supervisor-ravi', parentId: 'hod-sup' },
  { id: 'sup-ggn', title: 'Field – Gurgaon', plannedName: 'Dharmendra Kumar', roleSlug: 'role-sales-supervisor-dharmendra', parentId: 'hod-sup' },

  // sales
  { id: 'sales-retail', title: 'Retail & Supervisor Support', plannedName: 'Aparna Ghai', roleSlug: 'role-bd-sales-support', parentId: 'hod-sales' },
  { id: 'sales-renewal', title: 'Renewal & New', plannedName: 'Payal Parvanda', roleSlug: 'role-sales-lead-management', parentId: 'hod-sales' },

  // projects
  { id: 'proj-retail', title: 'Retail Chains & Projects', plannedName: 'Praveen Kumar', roleSlug: 'role-project-sales-bd', parentId: 'head-projects' },
  { id: 'proj-reticulation', title: 'Reticulation System', plannedName: 'Rinku Pandey', roleSlug: 'role-reticulation-sales', parentId: 'head-projects' },
  { id: 'proj-noida', title: 'Noida Branch Manager · Field – East Delhi & Noida', plannedName: 'Akshay Grover', parentId: 'head-projects' },

  // accounts
  { id: 'acc-cash', title: 'Cash, Admin & Accounts', plannedName: 'Sahil Gera', roleSlug: 'role-accounts-payroll', parentId: 'hod-accounts' },
  { id: 'acc-payments', title: 'Payments Collection & PCR Sites · Pre Const. & Renovation', plannedName: 'Ravinder Kaur', parentId: 'hod-accounts' },
];
