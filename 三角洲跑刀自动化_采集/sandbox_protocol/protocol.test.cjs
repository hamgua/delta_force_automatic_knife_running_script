// Source traceability: TEST_PLAN.md. Real pure functions, no phone/provider mocks.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(__dirname+'/protocol.js','utf8'),context);
const api=context.C0Protocol;
const req=()=>({schema:1,scope:'C0_SANDBOX',session_id:'S1',dispatch_id:'D1',route_id:'NO_GAME',segment_id:'NO_TOUCH',profile_id:'SYNTHETIC',expected_producer:'C0_CHILD',end_anchor:'SYNTHETIC_END'});
const res=()=>({...req(),producer:'C0_CHILD',status:'SKIPPED_NO_CHANGE',action_issued:false,action_confirmed:true});
const enc=JSON.stringify;
function rejected(r,reason){assert.equal(r.ok,false);assert.equal(r.reason,reason);}
test('accept matching no-change result',()=>assert.equal(api.validate(enc(req()),enc(res())).ok,true));
for(const raw of ['',null,undefined,'{','null','[]','3','"text"'])
 test('reject absent or non-object result '+String(raw),()=>rejected(api.validate(enc(req()),raw),'INVALID_RESULT'));
for(const field of ['session_id','dispatch_id','route_id','segment_id','profile_id']){
 test('reject stale/mismatched '+field,()=>{const r=res();r[field]='OLD';rejected(api.validate(enc(req()),enc(r)),'IDENTITY_MISMATCH');});
 test('reject missing '+field,()=>{const r=res();delete r[field];rejected(api.validate(enc(req()),enc(r)),'IDENTITY_MISMATCH');});
}
for(const status of ['VERIFIED_CHANGE','UNCERTAIN_AFTER_CHANGE','SUCCESS','',null])
 test('reject status outside no-touch scope '+status,()=>rejected(api.validate(enc(req()),enc({...res(),status})),'UNSAFE_RESULT'));
for(const patch of [{action_issued:true},{action_issued:'false'},{action_confirmed:false},{action_confirmed:'true'}])
 test('reject unsafe action evidence '+enc(patch),()=>rejected(api.validate(enc(req()),enc({...res(),...patch})),'UNSAFE_RESULT'));
test('reject producer mismatch',()=>rejected(api.validate(enc(req()),enc({...res(),producer:'OTHER'})),'PRODUCER_MISMATCH'));
test('reject endpoint mismatch',()=>rejected(api.validate(enc(req()),enc({...res(),end_anchor:'OTHER'})),'ANCHOR_MISMATCH'));
for(const patch of [{schema:2},{scope:'GAME'},{dispatch_id:''},{profile_id:7},{expected_producer:''}])
 test('reject invalid request '+enc(patch),()=>rejected(api.validate(enc({...req(),...patch}),enc(res())),'INVALID_REQUEST'));
test('authorize matching unclaimed request',()=>assert.equal(api.authorize(enc(req()),enc(req()),'').ok,true));
test('reject absent child args even with valid active',()=>rejected(api.authorize('',enc(req()),''),'INVALID_REQUEST'));
test('reject child when active absent',()=>rejected(api.authorize(enc(req()),'',''),'NO_ACTIVE_REQUEST'));
test('reject child when active differs',()=>rejected(api.authorize(enc({...req(),dispatch_id:'OLD'}),enc(req()),''),'IDENTITY_MISMATCH'));
test('reject already claimed dispatch',()=>rejected(api.authorize(enc(req()),enc(req()),'D1'),'ALREADY_CLAIMED'));
test('reject unknown claim state',()=>rejected(api.authorize(enc(req()),enc(req()),undefined),'ALREADY_CLAIMED'));
for(const patch of [{schema:2},{scope:'GAME'}])
 test('reject result schema/scope mismatch '+enc(patch),()=>rejected(api.validate(enc(req()),enc({...res(),...patch})),'IDENTITY_MISMATCH'));
