import test from'node:test';import assert from'node:assert/strict';import{createReview,type Field,type Workspace}from'../src/workspace/model';import{decideTargetChange,inheritTargets,latestApprovedReview,rejectSubmittedTargets,requestTargetChange,syncTargetRequest,targetDeltas}from'../src/workspace/targetGovernance';
const fields:Field[]=[{id:'sales',kra:'Sales',label:'Sales',type:'number',unit:'INR',target:10,owner:'member',direction:'higher',required:true},{id:'table',kra:'Calls',label:'Calls',type:'table',unit:'',target:1,owner:'member',direction:'higher',required:false,table:{columns:[{id:'target',label:'Target',type:'target',owner:'member'},{id:'actual',label:'Actual',type:'number'}],rows:[{id:'row',label:'Calls',defaults:{target:5}}]}}];
function base(){const state:Workspace={version:1,people:[{id:'p',name:'P',email:'',roleId:'r'}],roles:[{id:'r',name:'R',department:'',description:'',fields}],reviews:[],activity:[],theme:'light',thresholds:{good:80,watch:50}};const r=createReview(state.people[0],state.roles[0],'2099-01-05');r.targetStatus='approved';r.targets.sales=20;r.tables!.table.row.target=8;state.reviews.push(r);return{state,r};}
test('approved targets carry into next week without another proposal',()=>{const{state,r}=base();const next=createReview(state.people[0],state.roles[0],'2099-01-12');const inherited=inheritTargets(next,r);assert.equal(inherited.targetStatus,'approved');assert.equal(inherited.targets.sales,20);assert.equal(inherited.tables!.table.row.target,8);assert.equal(inherited.values.sales,undefined);state.reviews.push(inherited);assert.equal(latestApprovedReview(state,'p','2099-01-19')!.id,inherited.id);});
test('new KPI without approved baseline keeps target setup required',()=>{const{state,r}=base();const changed={...state.roles[0],fields:[...fields,{...fields[0],id:'new'}]};const next=createReview(state.people[0],changed,'2099-01-12');assert.equal(inheritTargets(next,r).targetStatus,'draft');});
test('member request requires reason and admin controls edit permission',()=>{let{state,r}=base();assert.throws(()=>requestTargetChange(state,r.id,'p',''),/reason/);state=requestTargetChange(state,r.id,'p','Territory changed');const id=state.targetChangeRequests![0].id;assert.equal(state.reviews[0].targetStatus,'approved');assert.throws(()=>decideTargetChange(state,id,'p',true,''),/admin/);state=decideTargetChange(state,id,'admin',true,'Allowed');assert.equal(state.targetChangeRequests![0].status,'edit-approved');assert.equal(state.reviews[0].targetStatus,'changes');});
test('revised targets notify admin and final approval completes request',()=>{let{state,r}=base();state=requestTargetChange(state,r.id,'p','New territory');const id=state.targetChangeRequests![0].id;state=decideTargetChange(state,id,'admin',true,'');const prior=state.reviews[0];const submitted={...prior,targetStatus:'pending' as const,targets:{...prior.targets,sales:30}};state={...state,reviews:[submitted]};state=syncTargetRequest(state,prior,submitted);assert.equal(state.targetChangeRequests![0].status,'submitted');const approved={...submitted,targetStatus:'approved' as const};state=syncTargetRequest(state,submitted,approved);assert.equal(state.targetChangeRequests![0].status,'completed');});
test('admin rejection restores previous numeric and table targets',()=>{let{state,r}=base();state=requestTargetChange(state,r.id,'p','New territory');const id=state.targetChangeRequests![0].id;state=decideTargetChange(state,id,'admin',true,'');const prior=state.reviews[0];const submitted={...prior,targetStatus:'pending' as const,targets:{sales:99},tables:{...prior.tables,table:{row:{target:77}}}};state={...state,reviews:[submitted]};state=syncTargetRequest(state,prior,submitted);state=rejectSubmittedTargets(state,id,'admin','Keep original');assert.equal(state.reviews[0].targetStatus,'approved');assert.equal(state.reviews[0].targets.sales,20);assert.equal(state.reviews[0].tables!.table.row.target,8);assert.equal(state.targetChangeRequests![0].status,'rejected');});

test('target delta names exactly identify changed scalar and table KPIs',()=>{const{r}=base();const request={id:'q',reviewId:r.id,memberId:'p',reason:'change',requestedAt:new Date().toISOString(),status:'submitted' as const,snapshot:{targets:{sales:20},tableTargets:{table:{row:{target:8}}}}};const changed={...r,targets:{sales:25},tables:{table:{row:{target:10}}}};assert.deepEqual(targetDeltas(changed,request).map(d=>[d.label,d.oldValue,d.newValue]),[['Sales',20,25],['Calls · Calls · Target',8,10]]);});



test('admin can adjust proposed targets, must explain the change, and the adjustment is recorded', async () => {
  const { approveTargetsWithNote, proposeTargets } = await import('../src/workspace/targetGovernance');
  const { createReview } = await import('../src/workspace/model');
  const person = { id: 'p1', name: 'Pat', email: '', roleId: 'r1' };
  const role = { id: 'r1', name: 'Role', department: '', description: '', fields: [{ id: 'k', kra: 'K', label: 'Calls', type: 'number' as const, unit: '', target: 30, owner: 'member' as const, direction: 'higher' as const, required: true }] };
  const draft = createReview(person, role, '2026-09-07');
  const proposed = proposeTargets(draft);
  assert.equal(proposed.targetStatus, 'pending');
  assert.equal(proposed.proposedTargets!.targets.k, 30);

  // approving as-is needs no note and records nothing
  const same = approveTargetsWithNote(proposed, '');
  assert.equal(same.targetStatus, 'approved');
  assert.deepEqual(same.targetAdjustments, []);

  // changing a target requires an explanation
  const adjusted = { ...proposed, targets: { k: 25 } };
  assert.throws(() => approveTargetsWithNote(adjusted, '  '), /note/i);
  const approved = approveTargetsWithNote(adjusted, 'Holiday week');
  assert.equal(approved.targetStatus, 'approved');
  assert.equal(approved.targets.k, 25);
  assert.equal(approved.targetNote, 'Holiday week');
  assert.deepEqual(approved.targetAdjustments!.map(d => [d.label, d.oldValue, d.newValue]), [['Calls', 30, 25]]);
  assert.throws(() => approveTargetsWithNote(approved, 'again'), /submitted targets/i);
});
