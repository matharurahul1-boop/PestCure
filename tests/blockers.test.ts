import test from 'node:test';
import assert from 'node:assert/strict';
import { createReview } from '../src/workspace/model';
import { addBlocker, completeBlocker, reviewBlockers, blockerEntries, mergeBlockers } from '../src/workspace/blockers';
import { guardReviewUpdate } from '../src/workspace/schedule';
const base = () => createReview({id:'p',name:'Person',email:'',roleId:'r'}, {id:'r',name:'Role',department:'',description:'',fields:[]}, '2026-09-07');
test('multiple blockers preserve legacy text and completion survives serialization', () => {
 const old = {...base(),blockers:'Need support\nFrom manager'};
 const first = addBlocker(old,'Materials missing');
 const second = addBlocker(first,'Customer unavailable');
 assert.equal(reviewBlockers(second).length,3);
 assert.equal(reviewBlockers(second)[0].text,old.blockers);
 const done=completeBlocker(second,reviewBlockers(second)[1].id);
 const loaded=JSON.parse(JSON.stringify(done));
 assert.equal(blockerEntries([loaded]).filter(b=>!b.completedAt).length,2);
 assert.equal(blockerEntries([loaded]).filter(b=>b.completedAt).length,1);
 assert.throws(()=>addBlocker(second,'   '));
 assert.throws(()=>addBlocker(second,'a'.repeat(2001)));
});
test('closed reports permit completion only, without reopening report answers',()=>{
 const r=addBlocker({...base(),status:'approved',trackingFrom:'2026-09-07'},'Waiting for supplies');
 const done=completeBlocker(r,reviewBlockers(r)[0].id);
 const now=new Date('2026-10-28T12:00:00Z');
 assert.equal(guardReviewUpdate(r,done,now),done);
 assert.throws(()=>guardReviewUpdate(r,{...done,highlights:'changed'},now),/frozen/);
 assert.throws(()=>guardReviewUpdate(done,r,now),/frozen/);
 assert.throws(()=>guardReviewUpdate(r,addBlocker(r,'new'),now),/frozen/);
 assert.equal(blockerEntries([{...r,demo:true},{...r,periodKind:'daily'}]).length,0);
});
test('stale sessions cannot drop unseen blockers or reopen completed ones',()=>{
 const r=addBlocker(base(),'one'), stale=reviewBlockers(r);
 const added=addBlocker(r,'two'), done=completeBlocker(added,stale[0].id);
 const merged=mergeBlockers(reviewBlockers(done),stale);
 assert.equal(merged.length,2); assert.ok(merged[0].completedAt);
});

