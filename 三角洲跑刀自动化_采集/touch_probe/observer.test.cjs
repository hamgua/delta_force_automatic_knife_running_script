const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const code=fs.readFileSync(__dirname+'/observer.js','utf8');function fresh(){const ctx={};vm.runInNewContext(code,ctx);return new ctx.TouchObserver();}
test('down counted and active',()=>{let s=fresh();s.event('down',1,20,30);assert.equal(s.activeCount(),1);assert.equal(s.down,1);});
test('move does not invent pointer',()=>{let s=fresh();s.event('move',1,20,30);assert.equal(s.activeCount(),0);assert.equal(s.move,1);});
test('up releases',()=>{let s=fresh();s.event('down',1,1,2);s.event('up',1,3,4);assert.equal(s.activeCount(),0);assert.equal(s.up,1);});
test('cancel releases',()=>{let s=fresh();s.event('down',1,1,2);s.event('cancel',1,3,4);assert.equal(s.activeCount(),0);assert.equal(s.cancel,1);});
test('two overlapping pointers',()=>{let s=fresh();s.event('down',1,1,2);s.event('down',2,3,4);assert.equal(s.maxActive,2);s.event('up',1,1,2);assert.equal(s.activeCount(),1);s.event('up',2,3,4);assert.equal(s.activeCount(),0);});
test('sequential points not multi',()=>{let s=fresh();s.event('down',1,1,2);s.event('up',1,1,2);s.event('down',2,3,4);assert.equal(s.maxActive,1);});
test('duplicate down no inflation',()=>{let s=fresh();s.event('down',1,1,2);s.event('down',1,1,2);assert.equal(s.activeCount(),1);});
test('unknown type rejected',()=>{let s=fresh();assert.throws(()=>s.event('oops',1,1,2));});
test('bounded history',()=>{let s=fresh();for(let i=0;i<100;i++)s.event('move',1,i,2);assert.equal(s.history.length,12);assert.equal(s.move,100);});
test('visibility does not fabricate release',()=>{let s=fresh();s.event('down',1,1,2);s.visibility(false);assert.equal(s.activeCount(),1);assert.equal(s.cancel,0);});
test('surface CSP denies connections',()=>{let h=fs.readFileSync(__dirname+'/surface.html','utf8');assert.match(h,/default-src 'none'/);assert.match(h,/connect-src 'none'/);assert.match(h,/touch-action:none/);});
test('surface no network/storage/nav API',()=>{let h=fs.readFileSync(__dirname+'/surface.html','utf8');assert.doesNotMatch(h,/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|location\s*=|<iframe|<form|<a\s|src=|href=/);});
test('native touch event count recorded without inventing pointer release V10',()=>{let s=fresh();s.event('down',2,1,1);s.touch('touchcancel',0);assert.equal(s.nativeTouches,0);assert.equal(s.activeCount(),1);assert.equal(s.touchCancel,1);});
test('native touch active snapshot V10',()=>{let s=fresh();s.touch('touchstart',2);assert.equal(s.nativeTouches,2);assert.equal(s.touchStart,1);});
