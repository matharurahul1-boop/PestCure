import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedWorkspace, addStarterData, appendReport, withReportData, templatesOnlyWorkspace } from '../src/workspace/reportData';

test('templatesOnlyWorkspace has the 20 role templates and no sample data', () => {
 const ws = templatesOnlyWorkspace();
 assert.equal(ws.roles.length, 20);
 assert.equal(ws.people.length, 0);
 assert.equal(ws.reviews.length, 0);
 assert.equal(ws.savedReports!.length, 0);
 assert.equal(ws.reportData, undefined);
 assert.equal(withReportData(ws).reportData!.demoReviews.length, 0, 'no people -> no demo reviews on load');
 assert.ok(ws.roles.some(r => r.id === 'role-crm-supervisor-lead'));
});

test('bundled source data preserves Excel history and isolates synthetic attendance and reviews', () => {
 const data = createSeedWorkspace('2026-09-08');
 assert.equal(data.people.length, 3);
 assert.equal(data.reviews.filter(r => r.source).length, 13);
 assert.ok(data.roles.length >= 15);
 assert.ok(data.reportData!.demoReviews.length > 150);
 assert.ok(data.reportData!.demoAttendance.length > 900);
 assert.ok(data.reportData!.demoReviews.every(r => r.demo));
 assert.ok(data.reportData!.demoAttendance.every(r => r.source === 'demo'));
 assert.equal(data.attendance!.length, 0);
 assert.equal(data.savedReports!.length, 3);
 assert.ok(data.reviews.every(r => !r.demo));
 assert.ok(data.referenceBackup);
 const restored = JSON.parse(JSON.stringify(data));
 assert.deepEqual(withReportData(restored, '2027-01-01'), restored, 'reload must not regenerate a different year of reports');
});
test('starter import preserves edited data, existing IDs and saved snapshots on repeat import', () => {
 const data = createSeedWorkspace('2026-09-08');
 data.people[0].name = 'Edited member';
 data.roles[0].name = 'Edited role';
 data.reviews[0].highlights = 'Saved real update';
 const result = addStarterData(data, createSeedWorkspace('2026-09-08'));
 assert.equal(result.people[0].name, 'Edited member');
 assert.equal(result.roles[0].name, 'Edited role');
 assert.equal(result.reviews[0].highlights, 'Saved real update');
 assert.equal(result.reviews.length, data.reviews.length);
 assert.equal(result.reportData!.demoReviews.length, data.reportData!.demoReviews.length);
 assert.equal(result.savedReports!.length, data.savedReports!.length);
});
test('saved report captures independent results rather than mutable workspace references', () => {
 const data = createSeedWorkspace('2026-09-08');
 const result = appendReport(data, { kind: 'performance', title: 'My report', source: 'excel', filters: { from: '2026-08-01' }, payload: { people: data.people, reviews: data.reviews } });
 data.people[0].name = 'Changed later';
 const report = result.savedReports![0];
 assert.notEqual((report.payload as any).people[0].name, 'Changed later');
 assert.equal(data.savedReports!.length, 3);
 assert.equal(result.savedReports!.length, 4);
 assert.deepEqual(JSON.parse(JSON.stringify(result)).savedReports[0], JSON.parse(JSON.stringify(report)));
});
