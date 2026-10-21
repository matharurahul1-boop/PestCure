import test from 'node:test';
import assert from 'node:assert/strict';
import { attendancePercent, attendanceScore, DEFAULT_ATTENDANCE_POLICY, demoAttendance, mergeAttendance, normalizeEngageRows, type AttendanceRecord } from '../src/workspace/attendance';
import type { Workspace } from '../src/workspace/model';
const state = (): Workspace => ({ version:1,people:[{id:'a',name:'Alka',email:'alka@test.com',roleId:'r'},{id:'d',name:'Deepika',email:'deepika@test.com',roleId:'r'},{id:'k',name:'Kajal',email:'kajal@test.com',roleId:'r'}],roles:[],reviews:[],activity:[],theme:'light',thresholds:{good:80,watch:50},engage:{endpoint:'https://engage.test/api',employeeIds:{a:'E1',d:'E2',k:'E3'}} });
const record = (status: AttendanceRecord['status'], late=false): AttendanceRecord => ({id:status,memberId:'a',date:'2026-09-01',status,late,source:'manual'});
test('attendance marking scheme scores each status and late penalty explicitly',()=>{
  assert.equal(attendanceScore(record('present')),10); assert.equal(attendanceScore(record('present',true)),8);
  assert.equal(attendanceScore(record('absent',true)),0); assert.equal(attendanceScore(record('half-day')),5);
  assert.equal(attendanceScore(record('short-day')),7); assert.equal(attendanceScore(record('leave')),10); assert.equal(attendanceScore(record('holiday')),10);
});
test('attendance percentage excludes holidays and supports custom policies',()=>{
  assert.equal(attendancePercent([record('present'),record('half-day'),record('holiday')]),75);
  assert.equal(attendancePercent([record('holiday')]),null);
  assert.equal(attendanceScore(record('short-day'),{...DEFAULT_ATTENDANCE_POLICY,shortDay:8}),8);
});
test('one year of synthetic attendance exists for all three users and stays labeled demo',()=>{
  const rows=demoAttendance(state().people,'2026-09-04'); assert.ok(rows.length>900); assert.ok(rows.every(r=>r.source==='demo'&&r.date<'2026-09-04'));
  state().people.forEach(p=>assert.ok(rows.some(r=>r.memberId===p.id)));
});
test('Engage rows map by employee ID or email and normalize common status names',()=>{
  const rows=normalizeEngageRows([{employeeId:'E1',date:'2026-09-01',status:'Half Day',lateMinutes:15},{email:'deepika@test.com',attendanceDate:'2026-09-02',status:'present'}],state());
  assert.equal(rows[0].memberId,'a'); assert.equal(rows[0].status,'half-day'); assert.equal(rows[0].late,true); assert.equal(rows[1].memberId,'d');
  assert.ok(rows.every(r=>r.source==='engage'));
});
test('invalid or unmapped Engage data fails without partial import',()=>{
  assert.throws(()=>normalizeEngageRows([{employeeId:'missing',date:'2026-09-01',status:'present'}],state()),/map/);
  assert.throws(()=>normalizeEngageRows([{employeeId:'E1',date:'bad',status:'present'}],state()),/map/);
  assert.throws(()=>normalizeEngageRows([{employeeId:'E1',date:'2026-09-01',status:'unknown'}],state()),/Unsupported/);
});
test('Engage sync replaces the same member-day but preserves unrelated records',()=>{
  const old=[{...record('absent'),id:'old'}]; const fresh={...record('present'),id:'new',source:'engage' as const}; const merged=mergeAttendance(old,[fresh]);
  assert.equal(merged.length,1); assert.equal(merged[0].id,'new');
});
