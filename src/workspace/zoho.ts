import type { Field, Review } from './model';
import { numeric } from './tableModel';

/**
 * Zoho sync (pilot). This is the app-side half only: configuration, field mapping,
 * payload normalisation and the "pull into a review" step.
 *
 * Zoho's own API needs OAuth 2.0 with a client secret and token refresh, which a
 * browser app cannot hold safely. So `endpoint` must point at a small backend
 * adapter the customer runs, which talks to Zoho and returns plain JSON:
 *
 *   GET <endpoint>?member=<zohoId>&from=<yyyy-mm-dd>&to=<yyyy-mm-dd>&org=<orgId>&dc=<dc>
 *   -> [{ "zohoId": "...", "week": "2026-09-07", "metrics": { "payments_received": 41250, ... } }]
 *      (an array, or an object with a `data` array; rows may also be flat instead of nested `metrics`)
 *
 * With no endpoint set the feature is inert — configuration and mapping still work.
 */

export const ZOHO_DATA_CENTERS = ['in', 'com', 'eu', 'com.au', 'jp', 'com.cn', 'ca'] as const;
export const ZOHO_MODULES = ['Zoho Books', 'Zoho CRM', 'Zoho People', 'Zoho Projects', 'Zoho Analytics', 'Zoho Creator', 'Other'] as const;

export type ZohoTarget =
  | { kind: 'field'; fieldId: string }
  | { kind: 'cell'; fieldId: string; rowId: string; columnId: string };

export type ZohoMapping = {
  id: string;
  module: string;
  zohoKey: string;
  label: string;
  roleId: string;
  target: ZohoTarget;
};

export type ZohoConfig = {
  endpoint: string;
  dataCenter: string;
  orgId: string;
  memberIds: Record<string, string>;
  mappings: ZohoMapping[];
  autoOnOpen?: boolean;
  lastSyncAt?: string;
};

export const EMPTY_ZOHO_CONFIG: ZohoConfig = {
  endpoint: '',
  dataCenter: 'in',
  orgId: '',
  memberIds: {},
  mappings: [],
  autoOnOpen: false,
};

export type ZohoRow = { memberId: string; week: string; metrics: Record<string, number | string | boolean> };

const RESERVED_KEYS = new Set(['zohoId', 'zoho_id', 'memberId', 'member_id', 'employeeId', 'employee_id', 'id', 'email', 'week', 'periodStart', 'period_start', 'date']);

/** Turn whatever the adapter returned into typed rows mapped to workspace members. */
export function normalizeZohoPayload(payload: unknown, config: ZohoConfig, people: { id: string; email?: string }[]): ZohoRow[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : null;
  if (!list) throw new Error('Zoho response must be a JSON array, or an object with a "data" array.');

  const byExternalId = new Map(Object.entries(config.memberIds).map(([memberId, zohoId]) => [String(zohoId).trim().toLowerCase(), memberId]));

  return list.map((raw, i) => {
    if (!raw || typeof raw !== 'object') throw new Error(`Row ${i + 1} is not an object.`);
    const item = raw as Record<string, unknown>;

    const directId = String(item.memberId ?? item.member_id ?? '');
    const externalId = String(item.zohoId ?? item.zoho_id ?? item.employeeId ?? item.employee_id ?? item.id ?? '').trim().toLowerCase();
    const email = String(item.email ?? '').trim().toLowerCase();
    const memberId =
      (directId && people.some(p => p.id === directId) && directId) ||
      byExternalId.get(externalId) ||
      (email && people.find(p => p.email && p.email.toLowerCase() === email)?.id) ||
      '';
    if (!memberId) throw new Error(`Row ${i + 1}: could not match this Zoho record to a team member. Set the member's Zoho ID in Settings.`);

    const week = String(item.week ?? item.periodStart ?? item.period_start ?? item.date ?? '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) throw new Error(`Row ${i + 1}: missing or invalid "week"/"date" (expected yyyy-mm-dd).`);

    const nested = item.metrics && typeof item.metrics === 'object' ? (item.metrics as Record<string, unknown>) : null;
    const source = nested ?? item;
    const metrics: ZohoRow['metrics'] = {};
    for (const [k, v] of Object.entries(source)) {
      if (!nested && RESERVED_KEYS.has(k)) continue;
      if (v === null || v === undefined) continue;
      if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') metrics[k] = v;
    }
    return { memberId, week, metrics };
  });
}

/** Fill a review's mapped fields from one synced row. Returns the new review and the labels filled. */
export function applyZohoRow(review: Review, roleId: string, row: ZohoRow, mappings: ZohoMapping[]): { review: Review; filled: string[] } {
  const relevant = mappings.filter(m => m.roleId === roleId && row.metrics[m.zohoKey] !== undefined && row.metrics[m.zohoKey] !== '');
  if (!relevant.length) return { review, filled: [] };

  const next = structuredClone(review);
  const filled: string[] = [];

  for (const m of relevant) {
    const raw = row.metrics[m.zohoKey];
    const t = m.target;
    if (t.kind === 'field') {
      const field = next.fields.find(f => f.id === t.fieldId);
      if (!field) continue;
      if (field.type === 'number') {
        const n = numeric(raw);
        if (n === null || n < 0) continue;
        next.values[field.id] = n;
      } else if (field.type === 'checkbox') {
        next.values[field.id] = raw === true || raw === 1 || ['true', '1', 'yes', 'done', 'completed'].includes(String(raw).toLowerCase());
      } else {
        next.values[field.id] = String(raw);
      }
      filled.push(field.label);
    } else {
      const field = next.fields.find(f => f.id === t.fieldId);
      const column = field?.table?.columns.find(c => c.id === t.columnId);
      const rowDef = field?.table?.rows.find(r => r.id === t.rowId);
      if (!field || !field.table || !column || !rowDef || column.type === 'computed') continue;
      next.tables ??= {};
      next.tables[field.id] ??= {};
      next.tables[field.id][rowDef.id] ??= {};
      if (['number', 'daily', 'target'].includes(column.type)) {
        const n = numeric(raw);
        if (n === null) continue;
        next.tables[field.id][rowDef.id][column.id] = n;
      } else {
        next.tables[field.id][rowDef.id][column.id] = typeof raw === 'boolean' ? raw : String(raw);
      }
      filled.push(`${field.label} · ${rowDef.label} · ${column.label}`);
    }
  }

  if (filled.length) next.updatedAt = new Date().toISOString();
  return { review: next, filled };
}

export type ZohoTargetOption = { value: string; label: string; target: ZohoTarget };

/** Flatten a role's fillable fields/cells into options for the mapping picker. */
export function targetOptions(fields: Field[]): ZohoTargetOption[] {
  const out: ZohoTargetOption[] = [];
  for (const f of fields) {
    if (f.type === 'table' && f.table) {
      for (const r of f.table.rows) {
        for (const c of f.table.columns) {
          if (c.type === 'computed') continue;
          out.push({
            value: `cell:${f.id}:${r.id}:${c.id}`,
            label: `${f.kra} → ${r.label} · ${c.label}`,
            target: { kind: 'cell', fieldId: f.id, rowId: r.id, columnId: c.id },
          });
        }
      }
    } else if (f.type !== 'table') {
      out.push({ value: `field:${f.id}`, label: `${f.kra} → ${f.label}`, target: { kind: 'field', fieldId: f.id } });
    }
  }
  return out;
}

export function parseTargetValue(value: string): ZohoTarget | null {
  const parts = value.split(':');
  if (parts[0] === 'field' && parts[1]) return { kind: 'field', fieldId: parts[1] };
  if (parts[0] === 'cell' && parts[1] && parts[2] && parts[3]) return { kind: 'cell', fieldId: parts[1], rowId: parts[2], columnId: parts[3] };
  return null;
}

export function targetToValue(target: ZohoTarget): string {
  return target.kind === 'field' ? `field:${target.fieldId}` : `cell:${target.fieldId}:${target.rowId}:${target.columnId}`;
}

/** Fetch synced rows for one member/period from the customer's adapter endpoint. */
export async function fetchZoho(
  config: ZohoConfig,
  people: { id: string; email?: string }[],
  params: { zohoId: string; from: string; to: string },
): Promise<ZohoRow[]> {
  if (!config.endpoint) throw new Error('Add a Zoho sync endpoint in Settings first.');
  let url: URL;
  try {
    url = new URL(config.endpoint);
  } catch {
    throw new Error('The Zoho sync endpoint is not a valid URL.');
  }
  url.searchParams.set('member', params.zohoId);
  url.searchParams.set('from', params.from);
  url.searchParams.set('to', params.to);
  if (config.orgId) url.searchParams.set('org', config.orgId);
  if (config.dataCenter) url.searchParams.set('dc', config.dataCenter);

  let res: Response;
  try {
    res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  } catch {
    throw new Error('Could not reach the Zoho adapter. Check the URL and that it allows this origin (CORS).');
  }
  if (!res.ok) throw new Error(`The Zoho adapter responded ${res.status}.`);
  return normalizeZohoPayload(await res.json(), config, people);
}
