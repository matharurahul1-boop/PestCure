import type { Person, Workspace } from './model';
import { plusDays, todayIST } from './schedule';
import { monthsBefore } from './performance';

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'short-day' | 'holiday' | 'leave';
export type AttendanceRecord = { id: string; memberId: string; date: string; status: AttendanceStatus; late: boolean; minutesLate?: number; source: 'manual' | 'engage' | 'demo'; syncedAt?: string };
export type AttendancePolicy = { present: number; absent: number; halfDay: number; shortDay: number; paidLeave: number; holiday: number; latePenalty: number; maxDaily: number };
export type EngageConfig = { endpoint: string; employeeIds: Record<string, string> };
export const DEFAULT_ATTENDANCE_POLICY: AttendancePolicy = { present: 10, absent: 0, halfDay: 5, shortDay: 7, paidLeave: 10, holiday: 10, latePenalty: 2, maxDaily: 10 };
export function attendanceScore(record: AttendanceRecord, policy = DEFAULT_ATTENDANCE_POLICY) {
  const base = record.status === 'present' ? policy.present : record.status === 'absent' ? policy.absent : record.status === 'half-day' ? policy.halfDay : record.status === 'short-day' ? policy.shortDay : record.status === 'leave' ? policy.paidLeave : policy.holiday;
  return Math.max(0, Math.min(policy.maxDaily, base - (record.late ? policy.latePenalty : 0)));
}
export function attendancePercent(records: AttendanceRecord[], policy = DEFAULT_ATTENDANCE_POLICY) {
  const eligible = records.filter(r => r.status !== 'holiday');
  return eligible.length ? Math.round(eligible.reduce((sum, r) => sum + attendanceScore(r, policy), 0) / (eligible.length * policy.maxDaily) * 100) : null;
}
export function demoAttendance(people: Person[], anchor = todayIST()) {
  const first = monthsBefore(anchor, 12); const rows: AttendanceRecord[] = [];
  people.forEach((person, p) => { let i = 0; for (let date = first; date < anchor; date = plusDays(date, 1), i++) {
    const day = new Date(date + 'T00:00:00Z').getUTCDay(); if (day === 0) continue;
    const cycle = (i * 5 + p * 7) % 47; const status: AttendanceStatus = day === 6 ? 'holiday' : cycle === 0 ? 'absent' : cycle % 17 === 0 ? 'half-day' : cycle % 13 === 0 ? 'short-day' : cycle % 29 === 0 ? 'leave' : 'present';
    const late = status === 'present' && (i + p * 3) % 11 === 0;
    rows.push({ id: `demo-attendance-${person.id}-${date}`, memberId: person.id, date, status, late, minutesLate: late ? 10 + (i % 25) : 0, source: 'demo' });
  }}); return rows;
}
export function normalizeEngageRows(payload: unknown, state: Workspace): AttendanceRecord[] {
  const rows = Array.isArray(payload) ? payload : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data) ? (payload as { data: unknown[] }).data : null;
  if (!rows) throw new Error('Engage response must be an array or an object containing a data array.');
  const employeeIds = state.engage?.employeeIds ?? {};
  return rows.map((raw, i) => { if (!raw || typeof raw !== 'object') throw new Error(`Invalid attendance item ${i + 1}.`); const item = raw as Record<string, unknown>;
    const externalId = String(item.employeeId ?? item.employee_id ?? item.userId ?? ''); const memberId = Object.entries(employeeIds).find(([, id]) => id === externalId)?.[0] ?? state.people.find(p => p.email && p.email.toLowerCase() === String(item.email ?? '').toLowerCase())?.id;
    const date = String(item.date ?? item.attendanceDate ?? '').slice(0, 10); if (!memberId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Could not map attendance item ${i + 1} to a member and date.`);
    const rawStatus = String(item.status ?? '').toLowerCase().replaceAll('_','-').replaceAll(' ','-'); const status = ({ present:'present', absent:'absent', 'half-day':'half-day', halfday:'half-day', 'short-day':'short-day', shortday:'short-day', leave:'leave', holiday:'holiday' } as Record<string, AttendanceStatus>)[rawStatus]; if (!status) throw new Error(`Unsupported status “${rawStatus}” in item ${i + 1}.`);
    const minutesLate = Number(item.minutesLate ?? item.lateMinutes ?? 0); return { id: `engage-${memberId}-${date}`, memberId, date, status, late: Boolean(item.late) || minutesLate > 0, minutesLate: Number.isFinite(minutesLate) ? Math.max(0, minutesLate) : 0, source: 'engage', syncedAt: new Date().toISOString() };
  });
}
export function mergeAttendance(existing: AttendanceRecord[], incoming: AttendanceRecord[]) { const map = new Map(existing.map(r => [`${r.memberId}|${r.date}`, r])); incoming.forEach(r => map.set(`${r.memberId}|${r.date}`, r)); return [...map.values()].sort((a,b) => b.date.localeCompare(a.date)); }
