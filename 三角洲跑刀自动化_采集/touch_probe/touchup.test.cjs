// T11a; R01/R08 -> V07/V08/V10 -> F1/F4; official article 1380.
// VM evidence only. Never imports phone APIs or claims physical release.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const path=require('node:path');
const names={check:'ZZ_TOUCH_20261017_API_CHECK.zjs',release:'ZZ_TOUCH_20261017_RELEASE.zjs',explicit:'ZZ_TOUCH_20261017_EXPLICIT.zjs'};
function sample(name){const bytes=fs.readFileSync(path.join(__dirname,'generated',names[name]));const rows=bytes.toString().trim().split(/\r?\n/).map(JSON.parse);return {bytes,header:rows[0],action:rows[1],rows};}
function execute(name,api){return vm.runInNewContext(sample(name).action.jsCode,{zdjl:api},{timeout:100});}
function api(){const calls=[];const mock={};for(const name of ['touchDown','touchMove','touchUp','alert','toast'])mock[name]=(...args)=>{calls.push([name,...args]);};return {calls,mock};}
test('T11a all samples use confirmed finite native JS shape',()=>{for(const name of Object.keys(names)){const s=sample(name);assert.equal(s.rows.length,2);assert.equal(s.header.count,1);assert.equal(s.header.repeatCount,1);assert.equal(s.header.pauseOnFail,true);assert.deepEqual(Object.keys(s.action).sort(),['delayUnit','jsCode','type']);assert.equal(s.action.type,'运行JS代码');assert.equal(s.action.delayUnit,1);assert.equal(s.bytes.toString().replace(/\r\n/g,'').includes('\n'),false);}});
test('T11a exact generated hashes and lengths match independent manifest',()=>{const m=JSON.parse(fs.readFileSync(path.join(__dirname,'touchup-manifest.json')));assert.equal(m.length,3);for(const n of Object.keys(names)){const s=sample(n);const row=m.find(x=>x.file===names[n]);assert.ok(row);assert.equal(row.bytes,s.bytes.length);assert.equal(row.sha256,crypto.createHash('sha256').update(s.bytes).digest('hex'));assert.equal(row.scope,'OFFLINE_DIAGNOSTIC_ONLY');}});
test('T11a API check only inspects types, never calls touch',()=>{const {calls,mock}=api();execute('check',mock);assert.deepEqual(calls.map(x=>x[0]),['alert']);assert.match(calls[0][1],/touchDown=function/);assert.match(calls[0][1],/touchMove=function/);assert.match(calls[0][1],/touchUp=function/);});
test('T11a missing API check reports unavailable without touches',()=>{const {calls,mock}=api();delete mock.touchUp;assert.throws(()=>execute('check',mock),/TOUCH_API_UNAVAILABLE/);assert.deepEqual(calls.map(x=>x[0]),['alert']);assert.match(calls[0][1],/touchUp=undefined/);});
test('T11a recovery sample only calls no-argument touchUp and return marker',()=>{const {calls,mock}=api();execute('release',mock);assert.deepEqual(calls.map(x=>x[0]),['touchUp','toast']);assert.deepEqual(calls[0],['touchUp']);assert.match(calls[1][1],/not release proof/);});
test('T11a absent release API fails closed, no fallback gesture',()=>{const {calls,mock}=api();delete mock.touchUp;assert.throws(()=>execute('release',mock),/TOUCH_UP_UNAVAILABLE/);assert.deepEqual(calls,[]);});
test('T11a failed release propagates and never prints returned',()=>{const {calls,mock}=api();mock.touchUp=()=>{throw new Error('SIMULATED_UP_ERROR');};assert.throws(()=>execute('release',mock),/SIMULATED_UP_ERROR/);assert.deepEqual(calls,[]);});
test('T11a explicit single stroke uses safe coordinates and bounded 1200ms',()=>{const {calls,mock}=api();execute('explicit',mock);assert.deepEqual(calls,[['touchDown','70%','60%'],['touchMove','30%','75%',1200],['touchUp']]);});
test('T11a throwing move still invokes cleanup and propagates failure',()=>{const {calls,mock}=api();mock.touchMove=()=>{throw new Error('SIMULATED_MOVE_ERROR');};assert.throws(()=>execute('explicit',mock),/SIMULATED_MOVE_ERROR/);assert.deepEqual(calls,[['touchDown','70%','60%'],['touchUp']]);});
test('T11a explicit requires every API before issuing down',()=>{for(const name of ['touchDown','touchMove','touchUp']){const {calls,mock}=api();delete mock[name];assert.throws(()=>execute('explicit',mock),/TOUCH_API_UNAVAILABLE/);assert.deepEqual(calls,[]);}});
