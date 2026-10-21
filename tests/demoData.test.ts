import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDemoData, isDemoPerson, removeDemoData } from '../src/workspace/demoData';
import { templatesOnlyWorkspace } from '../src/workspace/reportData';
import { activateCalendar } from '../src/workspace/schedule';
import { score, completion } from '../src/workspace/model';

const NOW = new Date('2026-10-14T06:00:00Z');   // a Wednesday (IST)

test('demo data: a believable team on its own templates, in every state', () => {
 const base = templatesOnlyWorkspace();
 const ws = applyDemoData(base, NOW);
 const people = ws.people.filter(isDemoPerson);
 assert.equal(people.length, 15);
 assert.ok(people.every(p => ws.roles.some(r => r.id === p.roleId)), 'each person is on an existing template');
 assert.equal(new Set(people.map(p => p.email)).size, 15);
 assert.ok(people.every(p => /^[a-z]+(\.[a-z]+)*@demo\.pestcure\.test$/.test(p.email)));

 const mine = ws.reviews.filter(r => people.some(p => p.id === r.memberId));
 assert.equal(mine.length, 15 * 5, 'four finished weeks + this week each');
 const current = mine.filter(r => r.week === '2026-10-12');
 assert.equal(current.length, 15);
 const kinds = new Set(current.map(r => `${r.targetStatus}/${r.status}`));
 for (const k of ['draft/draft', 'pending/draft', 'approved/draft', 'approved/submitted', 'approved/changes', 'approved/approved']) assert.ok(kinds.has(k), `this week has a ${k} report`);

 // finished weeks are fully scored, with a real spread (not all green)
 const past = mine.filter(r => r.week < '2026-10-12');
 assert.ok(past.every(r => r.status === 'approved' && r.targetStatus === 'approved' && completion(r) > 60));
 const scores = past.map(score).filter((s): s is number => s !== null);
 assert.equal(scores.length, past.length);
 assert.ok(Math.min(...scores) < 60 && Math.max(...scores) > 90, `scores spread ${Math.min(...scores)}–${Math.max(...scores)}`);

 // nothing says "Demo:" / lorem — values are written like real work
 const text = JSON.stringify(mine.map(r => [r.values, r.tables, r.highlights, r.blockers]));
 assert.ok(!/demo:|lorem|test \d/i.test(text));
 assert.ok(ws.notifications!.length >= 15 && ws.targetChangeRequests!.length === 2);
});

test('demo data runs with the review calendar on (requests for missed entries) and is repeatable and removable', () => {
 const withCalendar = activateCalendar(templatesOnlyWorkspace(), 1, NOW);
 const a = applyDemoData(withCalendar, NOW);
 const b = applyDemoData(a, NOW);
 assert.equal(b.people.length, a.people.length, 'running twice replaces, never doubles');
 assert.equal(b.reviews.length, a.reviews.length);
 const clean = removeDemoData(b);
 assert.equal(clean.people.length, 0);
 assert.equal(clean.reviews.length, 0);
 assert.equal((clean.notifications ?? []).length, 0);
 assert.equal((clean.targetChangeRequests ?? []).length, 0);
});

test('real people and their reviews survive adding and removing demo data', () => {
 const base = templatesOnlyWorkspace();
 const real = { ...base, people: [{ id: 'real-1', name: 'Real Person', email: 'real@company.com', roleId: base.roles[0].id }] };
 const out = removeDemoData(applyDemoData(real, NOW));
 assert.deepEqual(out.people.map(p => p.id), ['real-1']);
});

test('the attendance table no longer repeats the name, role and review date shown in the review header', async () => {
 const { trimEmployeeRows } = await import('../src/workspace/model');
 const ws = applyDemoData(templatesOnlyWorkspace(), NOW);
 const rows = (fields: Array<{ kra: string; table?: { rows: Array<{ label: string }> } }>) => fields.filter(f => f.kra === 'Employee & attendance').flatMap(f => f.table!.rows.map(r => r.label));
 for (const role of ws.roles) assert.ok(rows(role.fields as never).every(l => !/^(name|role|review date)$/i.test(l)), role.name);
 assert.deepEqual(rows(ws.roles[0].fields as never).sort(), ['Lates', 'Leaves', 'Short / half days', 'Team']);
 for (const r of ws.reviews.filter(isDemoPerson2(ws))) assert.ok(rows(r.fields as never).every(l => !/^(name|role|review date)$/i.test(l)));
 // an older workspace (rows still present) is cleaned, including the values stored in reviews, and a second run changes nothing
 const old = JSON.parse(JSON.stringify(ws));
 const att = old.roles[0].fields.find((f: any) => f.kra === 'Employee & attendance');
 att.table.rows.unshift({ id: 'old-name', label: 'Name', defaults: {}, scored: false }, { id: 'old-role', label: 'Role', defaults: {}, scored: false });
 const rv = old.reviews.find((x: any) => x.memberId.startsWith('demo-'));
 const rvAtt = rv.fields.find((f: any) => f.kra === 'Employee & attendance');
 rvAtt.table.rows.unshift({ id: 'old-name', label: 'Name', defaults: {}, scored: false }); rv.tables[rvAtt.id]['old-name'] = { value: 'X' };
 const fixed = trimEmployeeRows(old);
 assert.ok(rows(fixed.roles[0].fields as never).every(l => l !== 'Name' && l !== 'Role'));
 assert.equal(fixed.reviews.find((x: any) => x.id === rv.id)!.tables![rvAtt.id]['old-name'], undefined);
 assert.equal(trimEmployeeRows(fixed), fixed);
});
const isDemoPerson2 = (ws: { people: Array<{ id: string }> }) => (r: { memberId: string }) => ws.people.some(p => p.id === r.memberId);
