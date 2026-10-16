// Sources: touch_probe/TEST_PLAN.md T10a; local contract V08/V10; design F1/F4.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const names=['ZZ_TOUCH_20261016_SINGLE_MOVE','ZZ_TOUCH_20261016_SINGLE_STOP'];
function load(name){const p=__dirname+'/generated/'+name+'.zjs';assert.ok(fs.existsSync(p),'Missing generated single-finger diagnostic '+name);return fs.readFileSync(p);}
function parse(bytes){return bytes.toString('utf8').trim().split(/\r?\n/).map(JSON.parse);}
for(const [i,name] of names.entries())test(name+' is finite single native swipe T10a',()=>{
 const b=load(name),[h,...actions]=parse(b);assert.equal(h.count,1);assert.equal(h.repeatCount,1);assert.equal(h.pauseOnFail,true);assert.equal(actions.length,1);
 const a=actions[0];assert.equal(a.type,'滑动');assert.equal(a.repeatCount,1);assert.equal(a.duration,['1200','15000'][i]);assert.equal(a.gestureActions,undefined);
 for(const p of [a.startPos,a.endPos]){assert.equal(p.type,'location');assert.ok(parseFloat(p.x)>=30&&parseFloat(p.x)<=70);assert.ok(parseFloat(p.y)>=60&&parseFloat(p.y)<=75);}
 assert.ok(b.includes(Buffer.from('\r\n')));assert.equal(b.toString('utf8').replace(/\r\n/g,'').includes('\n'),false);
});
test('single-finger diagnostic uses only confirmed native fields T10a',()=>{
 const src=parse(fs.readFileSync(__dirname+'/../exports/ZZ_TOUCH_20261016_NATIVE.zjs'));
 for(const name of names){const [h,a]=parse(load(name));assert.deepEqual(Object.keys(h).sort(),Object.keys(src[0]).sort());assert.deepEqual(Object.keys(a).sort(),Object.keys(src[2]).sort());for(const p of ['startPos','endPos'])assert.deepEqual(Object.keys(a[p]).sort(),Object.keys(src[2][p]).sort());}
});
test('single-finger generated manifest matches exact files T10a',()=>{
 const manifest=JSON.parse(fs.readFileSync(__dirname+'/generated-manifest.json','utf8'));
 for(const name of names){const b=load(name),row=manifest.find(r=>r.file===name+'.zjs');assert.ok(row);assert.equal(row.bytes,b.length);assert.equal(row.sha256,crypto.createHash('sha256').update(b).digest('hex'));}
});
