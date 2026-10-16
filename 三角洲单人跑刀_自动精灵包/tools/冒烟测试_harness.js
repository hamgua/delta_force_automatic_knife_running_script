/* ============================================================================
 * 冒烟测试 (开发用, 非游戏内运行)
 * 用 mock 的 zdjl API 模拟 大厅->排队->进局->扫荡->撤离->结算 全流程,
 * 验证 脚本_跑刀主控.js 状态机无运行时错误 + 颜色快路径/标定自学习生效。
 *
 * 用法 (任意电脑, 需 node):
 *   node tools/冒烟测试_harness.js          # 正常全流程
 *   DIED=1 node tools/冒烟测试_harness.js   # 模拟局内死亡恢复
 *
 * 每次运行执行两轮:
 *   A 轮: mock 带 getScreenColor (颜色快路径可用)
 *   B 轮: mock 无 getScreenColor (纯找图, 旧行为)
 * 断言:
 *   1. 流程端到端跑完并回到大厅
 *   2. 标定自学习: 按钮坐标 + 状态颜色指纹 已写入 storage (kd_calib)
 *   3. 学习后快路径真实生效 (日志出现「已回到大厅 (指纹)」)
 *   4. A 轮 findLocation 调用数 < B 轮 (快路径的收益)
 *   5. DIED 模式: 死亡恢复流程跑通, 且死亡屏指纹被正确学习 (col.die)
 * ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');
var DIE = process.env.DIED === '1';

/* ---------- 读取主控脚本, 把当前点位表替换为 2 个测试点位 ---------- */
var srcPath = path.join(__dirname, '..', '脚本_跑刀主控.js');
var src = fs.readFileSync(srcPath, 'utf8');
var marker = 'var POINTS = _curRoute.points;';
var i = src.indexOf(marker);
if (i < 0) { console.error('FAIL: 未找到点位表注入点 ' + marker); process.exit(1); }
var testPoints = [
  'var POINTS = [\n',
  "  { name: 'T1', steps: [ {c:[50,50]}, {w:[40,70,60,30]} ] },\n",
  "  { name: 'T2', steps: [ {c:[30,60]} ] }\n",
  '];'
].join('\n');
var patchedSrc = src.slice(0, i) + testPoints + src.slice(i + marker.length);
/* 冒烟测试用: 每步都触发一次 watchGlobal (正式默认 watchEvery=10) */
if (patchedSrc.indexOf('watchEvery: 10,') < 0) { console.error('FAIL: 未找到 watchEvery 锚点'); process.exit(1); }
patchedSrc = patchedSrc.replace('watchEvery: 10,', 'watchEvery: 1, /* smoke: 每步都触发全局检查 */');

/* ---------- mock 屏幕状态机 (模块级, 每轮 runFlow 前重置) ---------- */
var screen = 'lobby';
var ticks = 0;
var died = false;
var store = {};
var findLocCalls = 0;
var colorCalls = 0;

var IMG_POS = {
  L: [100, 200], M: [300, 300], C: [400, 500], S: [600, 1000],
  Q: [360, 600], I: [80, 90], D: [360, 400], N: [600, 1050],
  E: [360, 1100], B: [360, 700], P: [660, 60], GR: [600, 1200],
  PA: [690, 40], PE: [360, 600], SP: [360, 300], GK: [360, 400]
};
function visible() {
  switch (screen) {
    case 'lobby': return { L: 1, M: 1 };
    case 'mapsel': return { C: 1 };
    case 'gear': return { GK: 1, S: 1 };
    case 'queuing': return { Q: 1 };
    case 'inmatch': return { I: 1, E: 1 };
    case 'dead': return { D: 1, N: 1 };
    case 'settle': return { N: 1 };
    default: return {};
  }
}
function act(k) {
  switch (k) {
    case 'M': screen = 'mapsel'; break;
    case 'C': screen = 'gear'; break;
    case 'S': screen = 'queuing'; ticks = 0; break;
    case 'E': screen = 'settle'; break;
    case 'N': screen = 'lobby'; break;
    default: break;
  }
}

/* 各界面颜色 (10 点指纹采样, 整屏同色): 已学习状态之间必须差 > 容差 45 */
var SCREEN_RGB = {
  lobby:   { r: 40,  g: 70,  b: 110 },
  mapsel:  { r: 55,  g: 85,  b: 95  },
  gear:    { r: 65,  g: 95,  b: 125 },
  queuing: { r: 20,  g: 40,  b: 60  },
  inmatch: { r: 25,  g: 55,  b: 35  },
  dead:    { r: 120, g: 25,  b: 25  },
  settle:  { r: 95,  g: 85,  b: 160 }
};

var imgvars = {
  img_lobby: { data: 'L' }, img_mode_entry: { data: 'M' }, img_map_select: { data: 'C' },
  img_start: { data: 'S' }, img_queuing: { data: 'Q' }, img_inmatch: { data: 'I' },
  img_die: { data: 'D' }, img_settle_next: { data: 'N' }, img_extract: { data: 'E' },
  img_battle: { data: 'B' }, img_popup_close: { data: 'P' }, img_grenade: { data: 'GR' },
  img_pause: { data: 'PA' }, img_pause_exit: { data: 'PE' }, img_spawn: { data: 'SP' },
  img_gear_knife: { data: 'GK' }, img_safebox_ok: { data: 'OK' }
};

/* ---------- 每轮构建一份 mock zdjl ---------- */
function makeZdjl(withColor) {
  var clicks = 0;
  var zdjl = {
    sleep: function () { ticks++; if (screen === 'queuing' && ticks > 3) screen = 'inmatch'; },
    toast: function (m) { console.log('  [toast]', String(m).slice(0, 60)); },
    alert: function (m) { console.log('  [alert]', String(m).split('\n')[0]); },
    select: function (cfg) { return { result: 0, item: cfg && cfg.items && cfg.items[0] }; },
    getStorage: function (k) { return store[k] || null; },
    setStorage: function (k, v) { store[k] = v; },
    removeStorage: function (k) { delete store[k]; },
    getVar: function (n) { return imgvars[n] || null; },
    findLocation: function (pos, findAll) {
      findLocCalls++;
      var d = pos.imageData && pos.imageData.data;
      var vis = visible();
      if (vis[d]) { var p = IMG_POS[d]; return { x: p[0], y: p[1], x_100: 0, y_100: 0 }; }
      throw new Error('not found: ' + d); // 模拟"找不到时抛异常"的 App 版本
    },
    click: function (x, y, ms) {
      clicks++;
      var vis = visible();
      for (var k in vis) {
        var p = IMG_POS[k];
        if (Math.abs(p[0] - x) <= 25 && Math.abs(p[1] - y) <= 25) { act(k); return; }
      }
    },
    swipe: function () {
      if (DIE && screen === 'inmatch' && !died) { died = true; screen = 'dead'; console.log('  [mock] 模拟局内死亡'); }
    },
    longClick: function () { },
    keyPress: function () { }
  };
  if (withColor) {
    zdjl.getScreenColor = function (x, y) {
      colorCalls++;
      var c = SCREEN_RGB[screen] || SCREEN_RGB.lobby;
      return (c.r << 16) | (c.g << 8) | c.b;
    };
  }
  return zdjl;
}

/* ---------- 执行一轮完整流程 ---------- */
function runFlow(withColor) {
  return runScript(patchedSrc, withColor, withColor ? '_smoke_test_mainA.js' : '_smoke_test_mainB.js');
}

/* 只跑标定向导 calibrate() (mock select 全部选「已就位」) */
function runCalibrate(withColor) {
  var calTrailer = 'if (boot()) {\n  main();\n}';
  if (patchedSrc.indexOf(calTrailer) < 0) { console.error('FAIL: 未找到启动尾部锚点'); process.exit(1); }
  var calSrc = patchedSrc.replace(calTrailer, 'var _calResult = calibrate();');
  var R = runScript(calSrc, withColor, '_smoke_test_calib.js');
  R.calOk = R.log.indexOf('标定完成') >= 0;
  return R;
}

function runScript(code, withColor, fileName) {
  screen = 'lobby'; ticks = 0; died = false; store = {};
  findLocCalls = 0; colorCalls = 0;
  var zdjl = makeZdjl(withColor);
  global.zdjl = zdjl;
  var testFile = path.join(__dirname, fileName);
  fs.writeFileSync(testFile, code);
  var logTxt = '';
  try {
    require(testFile);
  } catch (e) {
    fs.unlinkSync(testFile);
    console.error('FAIL: 脚本运行抛异常: ' + e.message);
    console.error('--- 日志 ---\n' + (store.kd_log || '(无)'));
    process.exit(1);
  }
  logTxt = store.kd_log || '';
  try { fs.unlinkSync(testFile); } catch (e) { }
  var calib = null;
  try { calib = store.kd_calib ? JSON.parse(store.kd_calib) : null; } catch (e) { }
  return { screen: screen, log: logTxt, calib: calib, findLocCalls: findLocCalls, colorCalls: colorCalls };
}

/* ---------- 断言工具 ---------- */
var failures = [];
function check(cond, msg) {
  if (cond) { console.log('PASS: ' + msg); }
  else { console.error('FAIL: ' + msg); failures.push(msg); }
}

/* ---------- 执行 ---------- */
console.log('== 开始模拟: ' + (DIE ? '死亡恢复模式' : '正常全流程') + ' (rounds=1, 注入 2 个测试点位, A=带颜色API / B=纯找图) ==');
var A = runFlow(true);
console.log('-- A 轮结束: 画面 ' + A.screen + ', findLocation ' + A.findLocCalls + ' 次, getScreenColor ' + A.colorCalls + ' 次 --');
var B = runFlow(false);
console.log('-- B 轮结束: 画面 ' + B.screen + ', findLocation ' + B.findLocCalls + ' 次 --');
var C = runCalibrate(true);
console.log('-- 标定向导轮结束: ' + (C.calOk ? '标定完成' : '未完成') + ' --');

/* 通用断言 (对 A/B 两轮都成立: 流程完整) */
[A, B].forEach(function (R, idx) {
  var tag = idx === 0 ? 'A轮' : 'B轮';
  check(R.screen === 'lobby', tag + ': 最后回到大厅');
  check(R.log.indexOf('主控结束') >= 0, tag + ': 主控跑完');
  check(R.log.indexOf('已进入对局') >= 0, tag + ': 进入对局');
  check(R.log.indexOf('点位 1/2') >= 0, tag + ': 点位 1 执行');
  if (!DIE) {
    check(R.log.indexOf('点位 2/2') >= 0, tag + ': 点位 2 执行');
    check(R.log.indexOf('撤离点交互成功') >= 0, tag + ': 撤离交互成功');
  }
});

/* 非 DIED: 有结算画面, 结算指纹应被学习 */
if (!DIE) {
  check(A.calib && A.calib.col && A.calib.col.settle_next, 'A轮: 自学习状态指纹 col.settle_next');
}

/* A 轮: 自学习 + 快路径断言 */
check(A.calib && A.calib.btn && A.calib.btn.start, 'A轮: 自学习按钮坐标 btn.start');
check(A.calib && A.calib.btn && A.calib.btn.mode_entry, 'A轮: 自学习按钮坐标 btn.mode_entry');
check(A.calib && A.calib.btn && A.calib.btn.settle_next, 'A轮: 自学习按钮坐标 btn.settle_next');
check(A.calib && A.calib.col && A.calib.col.lobby && A.calib.col.lobby.cols, 'A轮: 自学习状态指纹 col.lobby');
check(A.calib && A.calib.col && A.calib.col.inmatch, 'A轮: 自学习状态指纹 col.inmatch');
check(A.log.indexOf('已回到大厅 (指纹)') >= 0, 'A轮: 快路径生效 (日志含「已回到大厅 (指纹)」)');
check(A.colorCalls > 0, 'A轮: 颜色采样被调用 (' + A.colorCalls + ' 次)');
check(A.findLocCalls < B.findLocCalls,
  'A轮 findLocation 调用少于纯找图 (A=' + A.findLocCalls + ' < B=' + B.findLocCalls + ')');

/* 标定向导: 大厅屏采样应学会 btn.mode_entry + col.lobby (mock 停留大厅, 其余项不校验) */
check(C.calOk, '向导: calibrate() 跑完并输出「标定完成」');
check(C.calib && C.calib.btn && C.calib.btn.mode_entry, '向导: 学会 btn.mode_entry 坐标');
check(C.calib && C.calib.col && C.calib.col.lobby, '向导: 学会 col.lobby 指纹');

/* DIED 模式额外断言 */
if (DIE) {
  check(A.log.indexOf('对局中断') >= 0, 'A轮: 识别到死亡中断');
  check(A.log.indexOf('对局中断') > A.log.indexOf('点位 1/2'), 'A轮: 中断发生在点位 1 之后');
  check(A.calib && A.calib.col && A.calib.col.die, 'A轮: 死亡屏指纹 col.die 已学习');
  check(!(A.calib && A.calib.col && A.calib.col.settle_next), 'A轮: 死亡屏未被误学成结算指纹 (col.settle_next 空缺)');
}

/* 收尾 */
try {
  fs.unlinkSync(path.join(__dirname, '_smoke_test_mainA.js'));
  fs.unlinkSync(path.join(__dirname, '_smoke_test_mainB.js'));
  fs.unlinkSync(path.join(__dirname, '_smoke_test_calib.js'));
} catch (e) { }

if (failures.length) {
  console.error('\n== 冒烟测试失败 ' + failures.length + ' 项 ==');
  process.exit(1);
}
console.log('\n== 冒烟测试全部通过 ' + (DIE ? '(含死亡恢复 + 指纹歧义防护)' : '(含自学习 + 快路径收益)') + ' ==');
