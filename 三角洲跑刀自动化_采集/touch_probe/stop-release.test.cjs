// T11d isolation: R01/R08 -> V07/V08/V10 -> F1/F4; official 1380.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
function rows(f){return fs.readFileSync(__dirname+'/generated/'+f,'utf8').trim().split(/\r?\n/).map(JSON.parse);}
const name='ZZ_TOUCH_20261017_STOP_RELEASE.zjs';
test('T11d composite is finite known native swipe followed by unchanged official release JS',()=>{const s=rows(name);assert.equal(s.length,3);assert.equal(s[0].count,2);assert.equal(s[0].repeatCount,1);assert.equal(s[0].pauseOnFail,true);assert.deepEqual(s[1],rows('ZZ_TOUCH_20261016_SINGLE_STOP.zjs')[1]);assert.deepEqual(s[2],rows('ZZ_TOUCH_20261017_RELEASE.zjs')[1]);});
test('T11d known stroke duration is 15000ms and release is not a fallback gesture',()=>{const s=rows(name);assert.equal(s[1].duration,'15000');assert.equal(s[2].type,'运行JS代码');assert.match(s[2].jsCode,/zdjl\.touchUp\(\)/);assert.doesNotMatch(s[2].jsCode,/touchDown|touchMove|click\(|swipe\(|gesture\(/);});
test('T11d exact binary matches diagnostic manifest and CRLF',()=>{const b=fs.readFileSync(__dirname+'/generated/'+name);const m=JSON.parse(fs.readFileSync(__dirname+'/stop-release-manifest.json'));assert.equal(m.file,name);assert.equal(m.bytes,b.length);assert.equal(m.sha256,crypto.createHash('sha256').update(b).digest('hex'));assert.equal(m.scope,'OFFLINE_DIAGNOSTIC_ONLY');assert.equal(b.toString().replace(/\r\n/g,'').includes('\n'),false);});

test('T11d header requires at least the confirmed JS action minimum version',()=>{const s=rows(name),js=rows('ZZ_TOUCH_20261017_RELEASE.zjs');assert.ok(s[0].minVerCode>=js[0].minVerCode);assert.equal(s[0].minVerName,js[0].minVerName);});
