/**
 * ============================================================================
 * 三角洲行动 · 烽火地带 · 零号大坝 · 单人跑刀 主控脚本
 * ----------------------------------------------------------------------------
 * 平台   : 自动精灵 (zdjl.site) — App 内新建「JS 代码脚本」, 整份粘贴运行
 * 环境   : 脚本内为 Node 8 JS, zdjl 是全局 API, 无需 require
 * 分辨率 : 基准 720x1280 (云手机); 代码坐标统一用 0-100 百分比, 换分辨率可用
 *
 * 参考包对照 (三角洲免费全自动跑刀双排组队版.zjs) 的功能映射:
 *   参考包步骤                ->  本脚本函数
 *   beforeFirstLoop(加密)    ->  main() 启动自检 + ensureLobby()
 *   自雷.zjs                 ->  toLobby() / selfKill()  (快速过局)
 *   脚本.zjs (排队进局)       ->  startQueue()
 *   跑完退出.zjs             ->  doExtract() + finishRound()
 *   14 个"XX1号"点位脚本      ->  POINTS 表 + runPoint() (路线由你录制生成)
 *   垃圾处理.zjs             ->  POINTS 中 "垃圾堆" 点位
 *   确认战斗.zjs             ->  handleConfirmBattle()
 *   (双排组队版部分)          ->  已按单人移除
 *
 * ★★★ 使用前必须完成 ★★★
 *   1. 按 README 第 4 节在 App「变量-图像」里设置全部 img_* 图像变量;
 *   2. 手工录制 16 个点位路线(.zjs), 用 tools/zjs2points.py 生成
 *      点位路线_生成.js, 并把它覆盖到本文件底部 "路线数据区";
 *   3. 先跑 selfTest() 验证图像变量 (自检只反映"当前画面"上能找到的图, 大厅
 *      相关变量请切到大厅再跑; 对局内变量在单局测试中观察)。
 *
 * 风险提示: 本脚本属于游戏自动化, 违反游戏用户协议, 有封号风险;
 *           内置随机抖动/随机延时/休息机制降低风控概率, 但不保证。
 * ============================================================================
 */
'use strict';

/* ========================================================================== */
/* 0. 基础工具                                                                  */
/* ========================================================================== */

var _globalObj = (function () { return this; })();

/** 读取图像变量 (App 内「变量-图像」创建, 变量名=IMG 表中的值) */
function imgVar(name) {
  var v = null;
  try { v = _globalObj[name]; } catch (e) { v = null; }
  if (!v || typeof v !== 'object') {
    try { v = zdjl.getVar(name, 'global'); } catch (e) { v = null; }
  }
  if (!v) {
    throw new Error('图像变量未设置: ' + name +
      ' —— 请先在自动精灵「变量-图像」中创建, 或运行 tools/zjs2points.py 生成的导入清单');
  }
  return v;
}

/** 归一化图像变量 (兼容 imageVar / image 两种字段命名) */
function normImage(v) {
  if (typeof v === 'string') { // 纯 base64 字符串变量
    return { data: v, width: 0, height: 0, scale: 1,
             imageWidth: 0, imageHeight: 0, imageLeft: 0, imageTop: 0 };
  }
  return {
    data: v.data,
    width: v.imageWidth || v.width || 0,
    height: v.imageHeight || v.height || 0,
    scale: v.scale || 1,
    imageWidth: v.imageWidth || 0,
    imageHeight: v.imageHeight || 0,
    imageLeft: v.imageLeft || 0,
    imageTop: v.imageTop || 0,
    screenWidth: v.screenWidth || CFG.screenW,
    screenHeight: v.screenHeight || CFG.screenH
  };
}

function randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
function sleepRand(a, b) { zdjl.sleep(randInt(a, b)); }
function gap() { sleepRand(CFG.actionGap[0], CFG.actionGap[1]); }   // 动作间随机间隔
function jitter(n) { return randInt(-n, n); }                        // ±n px 随机偏移

/** 百分比 -> 物理像素 (x 轴) */
function pxX(v) { return v === undefined ? CFG.screenW / 2 : Math.round(v / 100 * CFG.screenW); }
/** 百分比 -> 物理像素 (y 轴) */
function pxY(v) { return v === undefined ? CFG.screenH / 2 : Math.round(v / 100 * CFG.screenH); }

function log(msg) {
  try { zdjl.toast(msg); } catch (e) { }
  try {
    var st = zdjl.getStorage('kd_log') || '';
    zdjl.setStorage('kd_log', (st + '\n' + msg).slice(-20000));
  } catch (e) { }
}

function fatal(msg) {
  log('!! 停止: ' + msg);
  try { zdjl.alert('脚本停止\n\n' + msg); } catch (e) { }
  throw new Error(msg);
}

/* ========================================================================== */
/* 1. 用户配置区                                                                */
/* ========================================================================== */

var CFG = {
  screenW: 720,              // 云手机屏幕宽 (px)
  screenH: 1280,             // 云手机屏幕高 (px)

  route: 'W3',               // ★ 选路线: E1/E2/E3/W1/W2/W3 (见 点位路线清单.md,
                             //   数据源: 飞书《北七速撤流跑刀焚决》线路图)
  escapeOnDanger: true,      // 检测到危险(下方 img_danger)时走本路线逃生线(未录制则仅日志)
  logCards: true,            // 开局日志列出本路线要收的房卡

  rounds: 1,                 // ★ 计划局数; 0 = 无限跑 (先填 1 测试!)
  restEvery: 15,             // 每跑 N 局休息一次
  restMs: 20 * 60 * 1000,    // 休息时长 (ms), 建议 15~30 分钟

  sim: 78,                   // 找图默认相似度 (%)
  moveMs: 280,               // 走位滑动基准时长 (ms)
  jitter: 12,                // 点击随机偏移 (±px), 防风控
  actionGap: [120, 420],     // 动作间随机间隔 [min, max] ms
  watchEvery: 10,            // 每执行 N 个点位动作, 做一次全局状态检查 (配合颜色快路径, 10~12 足够)

  /* ---- 颜色快路径 / 标定自学习 (无需任何手工标定) ---- */
  useFastState: true,        // 总开关: 关掉后全部走旧找图路径
  colorTol: 45,              // 颜色指纹判定容差 (平均欧氏距离, 0-100; 误判调低, 不命中调高)
  calibKey: 'kd_calib',      // 标定数据存储键 (zdjl.getStorage/setStorage)
  selfKill: true,           // 允许"自雷"快速结束卡死的对局
  queueTimeoutMs: 5 * 60 * 1000,
  spawnTimeoutMs: 3 * 60 * 1000,
  dieCheckArea: null,        // 死亡提示出现区域 {left,top,right,bottom} 百分比, null=全屏
};

/** 图像变量名登记表 —— 所有 img_* 必须先在 App「变量-图像」中设置 */
var IMG = {
  // ---- 大厅 / 排队 ----
  lobby:        'img_lobby',          // 大厅独有标志(如「烽火地带」模式入口按钮)
  mode_entry:   'img_mode_entry',     // 大厅里的烽火地带入口
  map_select:   'img_map_select',     // 选图界面的零号大坝卡片
  gear_knife:   'img_gear_knife',     // 战备界面"刀锋/空装"状态或确认按钮
  start:        'img_start',          // 开始游戏/快速开始按钮
  queuing:      'img_queuing',        // "排队中"字样或加载条
  // ---- 对局内 ----
  inmatch:      'img_inmatch',        // 对局内独有标志(小地图框/任务栏等)
  spawn:        'img_spawn',          // 索降/出生完成标志
  die:          'img_die',            // 死亡/撤离失败 字样
  settle_next:  'img_settle_next',    // 结算界面"下一局/再来一局/返回大厅"按钮
  pause:        'img_pause',          // 对局内暂停按钮(齿轮)
  pause_exit:   'img_pause_exit',     // 暂停菜单里的"退出对局/放弃"
  battle:       'img_battle',         // "确认战斗"类弹窗按钮
  grenade:      'img_grenade',        // 武器栏手雷图标(自雷用, 找不到就禁用自雷)
  extract:      'img_extract',        // 撤离点交互按钮/标记
  popup_close:  'img_popup_close',    // 公告/活动/客服等弹窗的 X 关闭键
  safebox_ok:   'img_safebox_ok',     // 撤离成功/结算成功标志(可选, 没有就注释掉)
  danger:       'img_danger',         // 危险信号(可选): 感叹号信息/敌情, 触发逃生线; 不设置则跳过
};

/** 各图像的可搜区域 (百分比), 缩小区域=更快更稳; null 表示全屏 */
var IMG_AREA = {
  lobby:       { left: 0,   top: 0,   right: 100, bottom: 40 },
  mode_entry:  { left: 0,   top: 0,   right: 100, bottom: 50 },
  map_select:  { left: 0,   top: 10,  right: 100, bottom: 90 },
  start:       { left: 0,   top: 60,  right: 100, bottom: 100 },
  queuing:     { left: 0,   top: 30,  right: 100, bottom: 80 },
  die:         { left: 0,   top: 0,   right: 100, bottom: 100 },
  settle_next: { left: 0,   top: 60,  right: 100, bottom: 100 },
  pause:       { left: 70,  top: 0,   right: 100, bottom: 15 },
  pause_exit:  { left: 0,   top: 0,   right: 100, bottom: 100 },
  battle:      { left: 0,   top: 0,   right: 100, bottom: 100 },
  grenade:     { left: 0,   top: 80,  right: 100, bottom: 100 },
  extract:     { left: 0,   top: 60,  right: 100, bottom: 100 },
  popup_close: { left: 60,  top: 0,   right: 100, bottom: 25 },
  danger:      { left: 0,   top: 0,   right: 100, bottom: 100 },
};

/* ========================================================================== */
/* 2. 底层动作                                                                 */
/* ========================================================================== */

/* ---------- 2a. 颜色指纹 (快路径状态识别) + 标定自学习 ------------------------
 * 原理:
 *   1) 按钮坐标: 每次 findImg 成功, 自动把命中坐标存入 CALIB; 之后同按钮优先
 *      走「定点点击」(零截图零匹配), 找图只在未标定时兜底。
 *   2) 状态指纹: 大厅/对局内/死亡/结算 各在 10 个固定采样点上记一组颜色;
 *      运行时 getScreenColor 采样同 10 点与指纹比距离, 判定当前界面。
 *      单点取色 ~ms 级, 比整屏模板匹配快 1~2 个数量级。
 *   3) 自学习: 第 1 局自动完成学习 (找图命中时顺带采样), 第 2 局起全程快路径。
 *   4) 降级: App 版本无 getScreenColor 时自动回退纯找图, 行为与旧版一致。
 *   5) 游戏大更新 UI 后: 可 removeStorage('kd_calib') 一键清掉重来, 或跑 calibrate()。
 * -------------------------------------------------------------------------- */

var _calibCache = null;

/** 指纹采样点 (屏幕百分比); 取四角/边缘/角落 HUD, 避开屏幕中央的动态内容 */
var PROFILE_POINTS = [
  [2, 3], [50, 2], [98, 3],
  [2, 50], [98, 50],
  [2, 97], [50, 98], [98, 97],
  [15, 15], [85, 15]
];

/** 参与快路径判定的状态 (key 与 IMG 的 key 一致) */
var STATE_KEYS = { die: 1, settle_next: 1, lobby: 1, inmatch: 1 };
var STATE_ORDER = ['die', 'settle_next', 'lobby', 'inmatch']; // 判定优先级

function calibDefault() { return { btn: {}, col: {}, ver: 1 }; }

function loadCalib(force) {
  if (_calibCache && !force) return _calibCache;
  var c = calibDefault();
  try {
    var raw = zdjl.getStorage(CFG.calibKey);
    if (raw) {
      var p = (typeof raw === 'string') ? JSON.parse(raw) : raw;
      if (p && typeof p === 'object') {
        c.btn = p.btn || {};
        c.col = p.col || {};
        c.ver = p.ver || 1;
      }
    }
  } catch (e) { c = calibDefault(); }
  _calibCache = c;
  return c;
}

function saveCalib(c) {
  _calibCache = c;
  try { zdjl.setStorage(CFG.calibKey, JSON.stringify(c)); } catch (e) { log('警告: 标定数据保存失败'); }
}

function isStateKey(name) { return !!STATE_KEYS[name]; }

function colorApiOk() { return typeof zdjl.getScreenColor === 'function'; }

/** 取单点颜色 -> {r,g,b}; 失败返回 null */
function sampleColorAt(xPct, yPct) {
  if (!colorApiOk()) return null;
  try {
    var c = zdjl.getScreenColor(pxX(xPct), pxY(yPct));
    return parseColor(c);
  } catch (e) { return null; }
}

/** 兼容 number(0xRRGGBB/0xAARRGGBB) / '#RRGGBB' / {r,g,b} 三种返回形态 */
function parseColor(c) {
  if (c === null || c === undefined) return null;
  if (typeof c === 'number') {
    var v = c >>> 0;
    if (v > 0xFFFFFF) v = v & 0xFFFFFF;
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
  }
  if (typeof c === 'string') {
    var h = c.replace('#', '');
    if (h.length === 8) h = h.slice(2);
    if (h.length < 6) return null;
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r: r, g: g, b: b };
  }
  if (typeof c === 'object' && typeof c.r === 'number') return { r: c.r, g: c.g, b: c.b };
  return null;
}

/** 采样当前屏幕指纹 (10 点); 可用点不足半数返回 null */
function sampleProfile() {
  if (!colorApiOk()) return null;
  var pts = [], ok = 0;
  for (var i = 0; i < PROFILE_POINTS.length; i++) {
    var col = sampleColorAt(PROFILE_POINTS[i][0], PROFILE_POINTS[i][1]);
    if (col) ok++;
    pts.push(col);
  }
  if (ok < Math.ceil(PROFILE_POINTS.length / 2)) return null;
  return pts;
}

/** 两个指纹的平均逐点欧氏距离; 重叠点不足半数返回 Infinity */
function profileDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  var sum = 0, n = 0;
  for (var i = 0; i < a.length; i++) {
    if (!a[i] || !b[i]) continue;
    var dr = a[i].r - b[i].r, dg = a[i].g - b[i].g, db = a[i].b - b[i].b;
    sum += Math.sqrt(dr * dr + dg * dg + db * db);
    n++;
  }
  if (n < Math.ceil(a.length / 2)) return Infinity;
  return sum / n;
}

/** 快路径状态判定: 返回 'die'|'settle_next'|'lobby'|'inmatch'|null (null=无法判定, 走找图) */
function fastState() {
  if (!CFG.useFastState) return null;
  var cal = loadCalib();
  var cur = sampleProfile();
  if (!cur) return null;
  var best = null, bestD = CFG.colorTol;
  for (var i = 0; i < STATE_ORDER.length; i++) {
    var k = STATE_ORDER[i];
    var saved = cal.col[k];
    if (!saved || !saved.cols) continue;
    var d = profileDistance(cur, saved.cols);
    if (d < bestD) { bestD = d; best = k; }
  }
  return best;
}

/** 二次采样确认状态, 防止颜色漂移造成对局内误点 */
function confirmState(name) {
  if (fastState() !== name) return false;
  sleepRand(200, 450);
  return fastState() === name;
}

/** 标定坐标点击 (零截图); 未标定时返回 false, 由调用方找图兜底 */
function clickCalib(name) {
  var c = loadCalib().btn[name];
  if (!c || typeof c.x !== 'number' || typeof c.y !== 'number') return false;
  zdjl.click(pxX(c.x) + jitter(CFG.jitter), pxY(c.y) + jitter(CFG.jitter), 60);
  gap();
  return true;
}

/** 找图命中后自动学习: 按钮坐标 + 状态颜色指纹 (幂等, 只学第一次) */
function learnFromFind(name, r) {
  try {
    var cal = loadCalib();
    var changed = false;
    if (!cal.btn[name]) {
      var x = (typeof r.x === 'number') ? r.x : (typeof r.x_100 === 'number' ? r.x_100 * CFG.screenW / 100 : null);
      var y = (typeof r.y === 'number') ? r.y : (typeof r.y_100 === 'number' ? r.y_100 * CFG.screenH / 100 : null);
      if (x !== null && y !== null) {
        cal.btn[name] = { x: Math.round(x / CFG.screenW * 1000) / 10, y: Math.round(y / CFG.screenH * 1000) / 10 };
        changed = true;
      }
    }
    if (isStateKey(name) && !cal.col[name]) {
      var prof = sampleProfile();
      if (prof) {
        // img_settle_next 在死亡屏也会命中, 需确认死亡字样缺席, 避免把死亡屏颜色学成结算指纹
        var ambiguous = (name === 'settle_next') && !!findImg('die');
        if (!ambiguous) { cal.col[name] = { cols: prof, t: Date.now() }; changed = true; }
      }
    }
    if (changed) saveCalib(cal);
  } catch (e) { /* 学习失败不影响主流程 */ }
}

/** 标定报告 (selfTest/排查用) */
function calibReport() {
  var cal = loadCalib();
  var lines = [];
  lines.push('颜色API: ' + (colorApiOk() ? '可用 (getScreenColor)' : '不可用 → 快路径自动关闭, 纯找图'));
  var bn = Object.keys(cal.btn), cn = Object.keys(cal.col);
  lines.push('已学按钮坐标 ' + bn.length + ': ' + (bn.length ? bn.join(', ') : '(无, 跑一局后自动学)'));
  lines.push('已学状态指纹 ' + cn.length + ': ' + (cn.length ? cn.join(', ') : '(无, 跑一局后自动学)'));
  lines.push('快路径开关: ' + (CFG.useFastState ? '开' : '关') + '  容差: ' + CFG.colorTol);
  var fs = fastState();
  lines.push('当前画面判定: ' + (fs || '(未命中任何指纹/无法判定)'));
  return lines;
}

/** 标定向导 (可选): 正常跑 1 局即自动学完; 此向导用于一次性预标定或重标 */
function calibrate() {
  if (!colorApiOk()) {
    log('当前 App 版本无 getScreenColor, 颜色快路径不可用; 向导仅能标定按钮坐标');
  }
  var cal = loadCalib(true);
  var steps = [
    { key: 'mode_entry', msg: '把游戏切到【大厅】主界面, 确保能看到「烽火地带」入口' },
    { key: 'start',      msg: '点进烽火地带→选中「零号大坝」→到【战备/开始】界面 (别点开始!)' },
    { key: 'inmatch',    msg: '进一局到【对局内】画面 (随便哪个点位, 远离敌人; 进局后 30 秒内完成即可, 超时会自动结算)' },
    { key: 'settle_next', msg: '切到【结算】界面 (跑完一局或从对局内直接退出结算页)' },
    { key: 'die',        msg: '切到【死亡/撤离失败】画面 (可跳过: 实际死亡时脚本会自动补学)' }
  ];
  var learned = [];
  for (var i = 0; i < steps.length; i++) {
    var st = steps[i];
    var choice = wizardStep(st.msg);
    if (choice === 'quit') break;
    if (choice === 'skip') continue;
    var got = [];
    var p = locPx(findImg(st.key));
    if (p) {
      cal.btn[st.key] = {
        x: Math.round(p.x / CFG.screenW * 1000) / 10,
        y: Math.round(p.y / CFG.screenH * 1000) / 10
      };
      got.push('坐标');
    }
    // 颜色指纹
    if (isStateKey(st.key)) {
      var prof = sampleProfile();
      if (prof) { cal.col[st.key] = { cols: prof, t: Date.now() }; got.push('指纹'); }
    }
    // 第 1 步正在大厅: 顺带采样大厅指纹 (大厅本身不在步骤列表里)
    if (st.key === 'mode_entry') {
      var lprof = sampleProfile();
      if (lprof) { cal.col.lobby = { cols: lprof, t: Date.now() }; got.push('大厅指纹'); }
    }
    if (got.length) { learned.push(st.key + '(' + got.join('+') + ')'); }
    else { log('提示: ' + st.key + ' 未标定成功 (该界面未就位或变量缺失)'); }
  }
  saveCalib(cal);
  var text = '标定完成: ' + (learned.length ? learned.join(', ') : '(无)') + '\n' + calibReport().join('\n');
  log(text);
  try { zdjl.alert(text); } catch (e) { }
  return learned;
}

/** 向导一步: 优先 select() 三选一, 不支持则 alert() 关闭即继续 */
function wizardStep(msg) {
  try {
    if (typeof zdjl.select === 'function') {
      try { zdjl.toast(msg); } catch (e0) { }
      var r = zdjl.select({ title: '标定向导', items: ['√ 已就位, 开始采样', '跳过此步', '结束标定'] });
      if (r === null || r === undefined) return 'quit';
      if (typeof r === 'object' && r.result !== undefined) {
        return r.result === 0 ? 'ok' : (r.result === 1 ? 'skip' : 'quit');
      }
      return 'ok';
    }
  } catch (e) { /* 落到 alert 分支 */ }
  try { zdjl.alert(msg + '\n\n关闭本弹窗即视为已就位, 开始采样 (需跳过请直接结束脚本运行 calibrate)'); } catch (e2) { }
  return 'ok';
}

var _stepsSinceWatch = 0;

function findImg(name, opts) {
  opts = opts || {};
  var iv;
  try { iv = imgVar(IMG[name] || name); } catch (e) { return null; } // name 传 IMG 的 key 或变量名均可
  var pos = { type: 'image', imageData: normImage(iv), minSimilarPercent: opts.sim || CFG.sim };
  var area = opts.area || IMG_AREA[name] || null;
  if (area) {
    pos.limitArea = {
      left: area.left + '%', top: area.top + '%',
      right: area.right + '%', bottom: area.bottom + '%'
    };
  }
  if (opts.mode) pos.searchMode = opts.mode;
  if (opts.quick) pos.quickSearch = true;
  try {
    var r = zdjl.findLocation(pos, false);
    if (r && (r.x !== undefined || r.x_100 !== undefined)) {
      learnFromFind(name, r); // 自学习: 按钮坐标 + 状态颜色指纹 (只学第一次)
      return { x: r.x, y: r.y, x_100: r.x_100, y_100: r.y_100 };
    }
  } catch (e) { /* 没找到时部分版本抛异常, 统一返回 null */ }
  return null;
}

/** 从 findLocation 结果取物理像素坐标 (兼容只返回百分比的 App 版本) */
function locPx(p) {
  if (!p) return null;
  var x = (typeof p.x === 'number') ? p.x : (typeof p.x_100 === 'number' ? p.x_100 * CFG.screenW / 100 : NaN);
  var y = (typeof p.y === 'number') ? p.y : (typeof p.y_100 === 'number' ? p.y_100 * CFG.screenH / 100 : NaN);
  if (isNaN(x) || isNaN(y)) return null;
  return { x: x, y: y };
}

/** 找图并点击 (带重试); 返回 true/false */
function clickImg(name, opts) {
  opts = opts || {};
  var tries = opts.tries || 3;
  for (var i = 0; i < tries; i++) {
    var p = locPx(findImg(name, opts));
    if (p) {
      zdjl.click(p.x + jitter(CFG.jitter), p.y + jitter(CFG.jitter));
      gap();
      return true;
    }
    sleepRand(300, 700);
  }
  return false;
}

/** 轮询等待某个图像出现 */
function waitImg(name, timeoutMs, intervalMs, opts) {
  opts = opts || {};
  var t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    var p = locPx(findImg(name, opts));
    if (p) return p;
    sleepRand(intervalMs || 400, (intervalMs || 400) + 250);
  }
  return null;
}

function tapXY(xPct, yPct, duration) {
  zdjl.click(pxX(xPct) + jitter(CFG.jitter), pxY(yPct) + jitter(CFG.jitter), duration || 60);
  gap();
}

/** 走位滑动 (百分比坐标) */
function walkSwipe(x1, y1, x2, y2, ms) {
  zdjl.swipe(pxX(x1) + jitter(6), pxY(y1) + jitter(6),
             pxX(x2) + jitter(6), pxY(y2) + jitter(6),
             (ms || CFG.moveMs) + jitter(60));
  sleepRand(60, 160); // 等镜头/角色到位
}

/** 执行一个路线步骤: 支持 {w,c,i,wait,battle} 五种 */
function doStep(st) {
  _stepsSinceWatch++;
  if (CFG.watchEvery > 0 && _stepsSinceWatch >= CFG.watchEvery) {
    _stepsSinceWatch = 0;
    var wg = watchGlobal(); // 全局状态检查 (死亡/危险/弹窗/战斗确认)
    if (wg) return wg;      // 传递 'dead' / 'escape' 信号给上层
  }
  if (st.wait) { sleepRand(st.wait, st.wait + 300); return; }
  if (st.w) { walkSwipe(st.w[0], st.w[1], st.w[2], st.w[3], st.w[4]); return; }
  if (st.c) { tapXY(st.c[0], st.c[1], st.c[2]); return; }
  if (st.i) {
    if (!clickImg(st.i, st.opts || {})) {
      log('提示: 未找到 [' + st.i + '] (已跳过, 可忽略或补图)');
    }
    return;
  }
  if (st.battle) { handleConfirmBattle(); return; }
}

/** 全局状态看门狗: 死亡? 掉出对局? 危险(逃生)? 弹窗? 战斗确认? (快路径: 颜色指纹, 兜底: 找图) */
function watchGlobal() {
  var s = fastState();
  // 快路径: 死亡/掉出对局 (二次采样确认, 防颜色漂移误判)
  if ((s === 'die' || s === 'lobby' || s === 'settle_next') && confirmState(s)) {
    log(s === 'die' ? '检测到死亡/撤离失败 (指纹)' : '对局中断 (掉出对局, 指纹)');
    toLobby(true);
    return 'dead';
  }
  if (s === null) {
    // 颜色未判定 (未学习/无API/画面异常) → 旧找图路径
    if (findImg('die')) {
      log('检测到死亡/撤离失败');
      toLobby(true);
      return 'dead';
    }
    if (CFG.escapeOnDanger && findImg('danger')) { runEscape('检测到危险信号'); return 'escape'; }
    if (findImg('battle')) { handleConfirmBattle(); }
    if (findImg('popup_close')) {
      log('发现弹窗, 尝试关闭');
      clickImg('popup_close', { tries: 2, sim: CFG.sim });
    }
    return null;
  }
  // s === 'inmatch': 只查 3 个必须找图的项 (危险/战斗确认/弹窗)
  if (CFG.escapeOnDanger && findImg('danger')) { runEscape('检测到危险信号'); return 'escape'; }
  if (findImg('battle')) { handleConfirmBattle(); }
  if (findImg('popup_close')) {
    log('发现弹窗, 尝试关闭');
    clickImg('popup_close', { tries: 2, sim: CFG.sim });
  }
  return null;
}

/** "确认战斗"类弹窗: 最多重试 3 轮 */
function handleConfirmBattle() {
  for (var i = 0; i < 3; i++) {
    if (!findImg('battle')) return;
    if (!clickImg('battle', { tries: 2 })) { sleepRand(500, 900); }
  }
}

/* ========================================================================== */
/* 3. 路线数据 (来源: 飞书《北七速撤流跑刀焚决》线路图, 详见 点位路线清单.md)     */
/*    标识: 常规(points) / 贪吃(greedy,可选追加) / 逃生(escape)                 */
/*    steps 类型:                                                              */
/*      {w:[x1,y1,x2,y2,ms]}  滑动走位 (百分比)                                 */
/*      {c:[x,y,ms?]}         点击 (百分比)                                     */
/*      {i:'img_xxx'}         找图点击 (开箱子/捡东西/撤离交互)                   */
/*      {wait:ms}             等待                                              */
/*      {battle:true}         处理"确认战斗"弹窗                                 */
/*    注意: steps 为空 = 该段尚未在游戏内录制; 录制后用 tools/zjs2points.py 生成   */
/*       步骤填入对应 points[n].steps / greedy / escape.steps                    */
/* ========================================================================== */

var ROUTES = {
  E1: {
    name: '东侧路线一 (出生: 主变电站北/东)',
    spawn: '主变电站北侧或东侧 (官方出生点 08/11)',
    points: [
      { name: '行政特区·东/北侧(售票办公室/设备领用室)', cards: ['售票办公室', '设备领用室'], steps: [], greedy: [] },
      { name: '军营(军营保管室)', cards: ['军营保管室'], steps: [], greedy: [] },
      { name: '管道区域', cards: [], steps: [], greedy: [] }
    ],
    extract: '西北(维修通道·丢弃背包) / 北(工业电梯/行政西楼) / 东北(坝顶·负重限制)',
    greedyNote: '顶线继续北推, 多搜顶北后从北撤离点(工业电梯)走',
    escape: { desc: '信息点(行政特区北侧) → 南/西南 → 南/西南撤离点', steps: [] }
  },
  E2: {
    name: '东侧路线二 (出生: 东侧 / 东南游客中心)',
    spawn: '东侧或东南游客中心 (官方出生点 09/10/11/12/13/14)',
    points: [
      { name: '南侧西行 → 水泥厂(水泥厂办公室)', cards: ['水泥厂办公室'], steps: [], greedy: [] },
      { name: '军营(军营保管室)', cards: ['军营保管室'], steps: [], greedy: [] },
      { name: '顶线东行 → 行政特区东侧(售票办公室/设备领用室)', cards: ['售票办公室', '设备领用室'], steps: [], greedy: [] }
    ],
    extract: '东(东区隧道·常规) / 东北(坝顶·负重限制) / 东南(东区公路口·概率)',
    greedyNote: '顶线东段大回环(军营→行政特区→东北侧)后东北撤离(坝顶)',
    escape: { desc: '信息点(中南/行政北) → 北入行政特区南侧 → 西走军营 → 西北方向撤', steps: [] }
  },
  E3: {
    name: '东侧路线三 (出生: 南侧, 保守短线)',
    spawn: '南侧 (官方出生点 13/14)',
    points: [
      { name: '南侧路西行 → 水泥厂(回环搜索, 水泥厂办公室)', cards: ['水泥厂办公室'], steps: [], greedy: [] },
      { name: '途经主变电站(可选: 技术室/变电站宿舍)', cards: ['技术室', '变电站宿舍'], steps: [], greedy: [] }
    ],
    extract: '西(西区公路口·常规) / 西南(公路捷径·概率); 逃生改走维修通道(丢弃背包)',
    greedyNote: '',
    escape: { desc: '信息点(南侧) → 北(过主变电站) → 行政特区南侧 → 军营 → 管道区域 → 西北/北撤离', steps: [] }
  },
  W1: {
    name: '西侧路线一 (出生: 西北 军营/管道区域, 核心卡全)',
    spawn: '西北 军营/管道区域 (官方出生点 02/03/04/05)',
    points: [
      { name: '顶线东行 → 行政特区核心(技术室/售票办公室/中心贵宾室/设备领用室)', cards: ['技术室', '售票办公室', '中心贵宾室', '设备领用室'], steps: [], greedy: [] },
      { name: '行政特区东侧收尾', cards: [], steps: [], greedy: [] }
    ],
    extract: '东(东区隧道·常规) / 东北(坝顶·负重限制) / 北(工业电梯)',
    greedyNote: '顶线中北段北推 → 北撤离点(工业电梯)',
    escape: { desc: '行政特区 → 南下(主变电站西侧大回环) → 东南 → 南/东南撤离点', steps: [] }
  },
  W2: {
    name: '西侧路线二 (出生: 西侧 管道区域)',
    spawn: '西侧 管道区域 (官方出生点 01/02/03)',
    points: [
      { name: '东北进军营(军营保管室)', cards: ['军营保管室'], steps: [], greedy: [] },
      { name: '顶线东 → 行政特区(技术室/售票办公室/中心贵宾室/设备领用室)', cards: ['技术室', '售票办公室', '中心贵宾室', '设备领用室'], steps: [], greedy: [] }
    ],
    extract: '东(东区隧道·常规, 北线) / 东南(东区公路口·概率, 走南线时) / 西(西区公路口, 回撤)',
    greedyNote: '南侧底线东走(游客中心一带) → 东南撤离',
    escape: { desc: '军营 → 东南(主变电站南侧) → 东; 或 军营 → 正南', steps: [] }
  },
  W3: {
    name: '西侧路线三 (出生: 西/西南 水泥厂一带, 收益密度最高)',
    spawn: '西/西南 水泥厂一带 (官方出生点 06/07; 07 与水泥厂办公室同区)',
    points: [
      { name: '东进水泥厂(回环搜索, 水泥厂办公室)', cards: ['水泥厂办公室'], steps: [], greedy: [] },
      { name: '南侧路东行 → 主变电站(上二楼: 技术室/变电站宿舍)', cards: ['技术室', '变电站宿舍'], steps: [], greedy: [] },
      { name: '东行 → 游客中心外围', cards: [], steps: [], greedy: [] }
    ],
    extract: '东南(东区公路口·概率撤离点, 游客中心旁); 备用: 河滩付费撤离点(中南)',
    greedyNote: '游客中心区域内回环加搜',
    escape: { desc: '中南 → 北(主变电站北侧大弧线) → 东', steps: [] }
  }
};

/** 当前局使用的路线 (按 CFG.route 选择, 非法值回退 W3) */
function getRoute() {
  return ROUTES[CFG.route] || ROUTES.W3;
}

/** 本路线全部房卡目标 (日志/提醒用) */
function routeCards(r) {
  var out = [];
  for (var i = 0; i < r.points.length; i++) {
    var cs = r.points[i].cards || [];
    for (var j = 0; j < cs.length; j++) if (out.indexOf(cs[j]) < 0) out.push(cs[j]);
  }
  return out;
}

/* 运行时点位表 = 当前路线的 points (runAllPoints/runPoint 直接用它) */
var _curRoute = getRoute();
var POINTS = _curRoute.points;

var EXTRACT_ROUTE = [
  /* TODO: 从最后一个点位走到撤离点并按下撤离的屏内路线 (录制生成, 见 点位路线清单.md 5.4) */
];

/** 执行逃生线 (黄色路线); 未录制则仅日志提示 */
function runEscape(reason) {
  var r = _curRoute;
  log('⚠️ 触发逃生 (' + reason + '): ' + r.escape.desc);
  if (r.escape.steps && r.escape.steps.length) {
    for (var i = 0; i < r.escape.steps.length; i++) doStep(r.escape.steps[i]);
  } else {
    log('提示: 逃生线未录制, 请按屏幕手动撤离 (或补录 ' + CFG.route + '.escape.steps)');
  }
}

/* ========================================================================== */
/* 4. 流程状态机                                                                */
/* ========================================================================== */

/** 把当前画面推进回大厅 (快速过局 / 参考包的"自雷"职责) */
function toLobby(fromDeath) {
  var t0 = Date.now();
  var lastAct = 0;
  while (Date.now() - t0 < (fromDeath ? 90000 : 120000)) {
    var s = fastState();
    if (s === 'lobby' && confirmState('lobby')) { log('已回到大厅 (指纹)'); return true; }

    var acted = false;
    // 快路径: 结算/死亡界面 → 「下一局/返回大厅」优先走标定坐标点击 (零截图)
    if (s === 'settle_next' || s === 'die') {
      if (!confirmState(s)) { sleepRand(400, 800); continue; } // 未确认, 避免对局内误点
      if (clickCalib('settle_next') || clickImg('settle_next', { tries: 1 })) acted = true;
    } else if (s === null) {
      // 颜色未判定 (未学习/无API/画面异常) → 旧找图路径
      if (findImg('lobby')) { log('已回到大厅'); return true; }
      if (clickImg('settle_next', { tries: 1 })) acted = true;
      else if (findImg('die') && clickImg('settle_next', { tries: 1 })) acted = true;
      else if (findImg('pause') && findImg('pause_exit') && clickImg('pause_exit', { tries: 1 })) acted = true;
      else if (findImg('popup_close') && clickImg('popup_close', { tries: 1 })) acted = true;
    } else if (s === 'inmatch') {
      // 卡在对局内: 弹窗 / 战斗确认
      if (findImg('battle')) handleConfirmBattle();
      else if (findImg('popup_close') && clickImg('popup_close', { tries: 1 })) acted = true;
    }
    // 长时间无进展 → 自雷 (selfKill 内部先找手雷, 非对局内不会触发)
    if (!acted && CFG.selfKill && Date.now() - lastAct > 15000) {
      if (selfKill()) { acted = true; lastAct = Date.now(); }
    }
    if (acted) lastAct = Date.now();
    sleepRand(700, 1300);
  }
  fatal('120 秒内未回到大厅, 请人工介入 (查看云手机画面)');
  return false;
}

/** 自雷: 切到手雷 -> 丢到自己脚下 -> 快速结束对局 (找不到手雷则返回 false) */
function selfKill() {
  var viaCalib = clickCalib('grenade'); // 标定坐标优先 (手雷槽位置固定)
  if (!viaCalib) {
    var g = locPx(findImg('grenade'));
    if (!g) return false;
    zdjl.click(g.x + jitter(4), g.y + jitter(4));
  }
  log('执行自雷 (快速结束对局)');
  sleepRand(400, 800);
  // 朝自己脚下(屏幕中下)投掷
  zdjl.click(pxX(50) + jitter(8), pxY(72) + jitter(8));
  sleepRand(1500, 2200);
  return true;
}

/** 从大厅开始排队, 直到进入对局 */
function startQueue() {
  if (fastState() !== 'lobby') { toLobby(false); }
  sleepRand(400, 900);

  // 大厅入口 (快路径: 标定坐标; 兜底: 找图)
  if (!clickCalib('mode_entry')) { if (!clickImg('mode_entry', { tries: 4 })) { sleepRand(800, 1500); clickImg('mode_entry', { tries: 4 }); } }
  if (!findImg('map_select', { sim: CFG.sim })) { sleepRand(1000, 2000); }
  if (!clickImg('map_select', { tries: 4 })) fatal('未找到零号大坝选图卡片, 请检查 img_map_select');

  // 战备确认 (刀锋/空装; 如果你固定空装, 这里一般无需点击, 保留钩子)
  if (findImg('gear_knife', { sim: CFG.sim + 5 })) { clickImg('gear_knife', { tries: 2 }); }

  if (!clickCalib('start')) {
    if (!clickImg('start', { tries: 6 })) fatal('未找到开始按钮, 请检查 img_start');
  }

  // 等待排队 + 出生 (快路径: 颜色指纹; 兜底: 找图)
  var t0 = Date.now();
  while (Date.now() - t0 < CFG.queueTimeoutMs + CFG.spawnTimeoutMs) {
    var st = fastState();
    if (st === 'die') { toLobby(true); return startQueue(); }
    if (st === 'inmatch') {
      sleepRand(1500, 3000);
      if (fastState() === 'inmatch') { log('已进入对局 (指纹)'); return true; }
      continue;
    }
    if (st === null) {
      // 颜色未判定 → 旧找图路径
      if (findImg('die')) { toLobby(true); return startQueue(); }
      if (findImg('spawn')) { log('已进入对局 (出生完成)'); return true; }
      if (findImg('inmatch')) { sleepRand(2000, 4000); if (findImg('inmatch')) { log('已进入对局'); return true; } }
      if (findImg('popup_close')) clickImg('popup_close', { tries: 2 });
    }
    sleepRand(1000, 1800);
  }
  fatal('排队/出生超时, 请检查云手机网络与游戏状态');
  return false;
}

/** 跑完整条扫荡路线 (当前路线 = CFG.route); 返回 true / false(死亡) / 'escape'(逃生) */
function runAllPoints() {
  var r = _curRoute;
  log('本局路线: ' + r.name);
  if (CFG.logCards) {
    var cards = routeCards(r);
    log('本路线房卡目标: ' + (cards.length ? cards.join(' / ') : '(无)'));
    log('推荐撤离: ' + r.extract);
  }
  for (var i = 0; i < POINTS.length; i++) {
    var st = runPoint(POINTS[i], i);
    if (st === 'escape') return 'escape';   // 逃生线已执行, 直接去撤离
    if (!findImg('inmatch')) { // 掉出对局 (死亡/被踢/卡死)
      log('对局中断 (原因: 死亡或异常), 进入过局流程');
      return false;
    }
  }
  return true;
}

/** 跑一个点位; 返回 true=正常, 'escape'=逃生触发 */
function runPoint(p, idx) {
  log('点位 ' + (idx + 1) + '/' + POINTS.length + ': ' + p.name);
  if (p.cards && p.cards.length) log('  房卡目标: ' + p.cards.join(' / '));
  // 到达标志 (可选)
  if (p.arrive) {
    var a = waitImg(p.arrive, 20000, 500, { sim: CFG.sim });
    if (!a) log('提示: ' + p.name + ' 未识别到到达标志, 按路线继续');
  }
  if (!p.steps.length) {
    log('提示: ' + p.name + ' 的走位步骤尚未录制 (steps 为空), 跳过; 见 点位路线清单.md 5.4');
  }
  for (var i = 0; i < p.steps.length; i++) {
    var esc = doStep(p.steps[i]);
    if (esc === 'escape') return 'escape';
  }
  if (p.greedy && p.greedy.length) {
    log('提示: ' + p.name + ' 有贪吃段(未启用, 高风险); ' + (p.greedyNote || ''));
  }
  if (p.done) {
    var d = waitImg(p.done, 12000, 400);
    if (d) log('点位完成: ' + p.name);
  }
  gap();
  return true;
}

/** 撤离 + 结算; from='逃生' 时跳过 EXTRACT_ROUTE 直试撤离按钮 */
function doExtract(from) {
  if (!EXTRACT_ROUTE.length || from === '逃生') {
    // 撤离路线尚未录制: 快速试一次撤离按钮, 点不到就跳过 (用于先测 排队/过局 全流程)
    if (clickImg('extract', { tries: 3 })) {
      log('撤离点交互成功');
      var t0 = Date.now();
      while (Date.now() - t0 < 90000) {
        var s = fastState();
        if (s === 'die' || s === 'settle_next' || s === 'lobby') { toLobby(true); return true; }
        if (s === null && (findImg('die') || findImg('settle_next') || findImg('lobby'))) { toLobby(true); return true; }
        sleepRand(1000, 1800);
      }
      toLobby(true);
      return true;
    }
    log('提示: 撤离路线未配置且未找到撤离按钮, 跳过撤离直接进入下一局');
    toLobby(true);
    return true;
  }
  log('前往撤离点');
  for (var i = 0; i < EXTRACT_ROUTE.length; i++) doStep(EXTRACT_ROUTE[i]);
  // 交互撤离
  var ok = clickImg('extract', { tries: 8, sim: CFG.sim - 5 });
  if (!ok) {
    log('提示: 未点中撤离按钮, 交给 toLobby 兜底');
  }
  // 等结算 (快路径: 颜色指纹; 兜底: 找图)
  var t1 = Date.now();
  while (Date.now() - t1 < 120000) {
    var s2 = fastState();
    if (s2 === 'die' || s2 === 'settle_next' || s2 === 'lobby') { log('撤离成功, 进入结算/大厅 (指纹)'); return true; }
    if (s2 === null) {
      if (findImg('die')) { toLobby(true); return true; }
      if (findImg('settle_next')) { log('撤离成功, 进入结算'); return true; }
      if (findImg('lobby')) return true;
    }
    sleepRand(1000, 1800);
  }
  log('提示: 撤离后 120s 未识别到结算, 交给 toLobby 处理');
  return true;
}

function finishRound() { toLobby(false); }

/* ========================================================================== */
/* 5. 自检 / 主循环                                                             */
/* ========================================================================== */

/** 图像变量自检: 逐个找一遍, 弹窗汇报 (先切到对应画面再跑! 见 README) */
function selfTest() {
  var names = Object.keys(IMG);
  var result = [];
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var iv;
    var missingVar = false;
    try { iv = imgVar(IMG[name]); } catch (e) { missingVar = true; }
    if (missingVar) { result.push(name + ': 变量未设置'); continue; }
    var p = locPx(findImg(IMG[name], { sim: 70 }));
    result.push(name + ': ' + (p ? '可找到' : '当前画面未找到'));
    sleepRand(200, 400);
  }
  var text = result.join('\n') + '\n\n---- 快路径/标定状态 ----\n' + calibReport().join('\n');
  log('图像自检完成:\n' + text);
  try { zdjl.alert('图像自检结果 (详见脚本日志)\n\n' + text); } catch (e) { }
  return result;
}

/** 主循环 */
function main() {
  log('=== 单人跑刀主控启动 ===');
  var done = 0;
  while (true) {
    if (CFG.rounds > 0 && done >= CFG.rounds) {
      log('已完成 ' + done + ' 局, 停止');
      try { zdjl.alert('跑完 ' + done + ' 局, 自动停止'); } catch (e) { }
      break;
    }
    done++;
    log('--- 第 ' + done + ' 局 ---');
    try {
      toLobby(false);
      startQueue();
      var rr = runAllPoints();
      if (rr === 'escape') {
        doExtract('逃生');
      } else if (rr) {
        doExtract();
      }
      finishRound();
    } catch (e) {
      log('第 ' + done + ' 局异常: ' + e.message);
      // 异常兜底: 尝试回到大厅, 若失败则停止
      try { toLobby(true); } catch (e2) { break; }
      if (CFG.rounds > 0 && done >= CFG.rounds) break;
    }
    // 定期休息
    if (CFG.restEvery > 0 && done % CFG.restEvery === 0 && (CFG.rounds === 0 || done < CFG.rounds)) {
      log('已跑 ' + done + ' 局, 休息 ' + Math.round(CFG.restMs / 60000) + ' 分钟');
      try { zdjl.alert('休息中 ' + Math.round(CFG.restMs / 60000) + ' 分钟'); } catch (e) { }
      zdjl.sleep(CFG.restMs);
    }
  }
  log('=== 主控结束, 共 ' + done + ' 局 ===');
}

/* ========================================================================== */
/* 6. 启动入口                                                                  */
/* ========================================================================== */
/*
 * 使用方式: 文件末尾默认执行 boot() + main()。
 * 想先跑图像自检时, 把最后一行 main(); 临时改成 selfTest();
 *
 * main() 内部会处理 启动自检(找大厅) -> 排队 -> 扫荡 -> 撤离 -> 下一局 的完整循环。
 */

// ---- 启动自检: 找一次大厅, 找不到则提醒并停止 ----
function boot() {
  var s = fastState();
  if (s === 'lobby') {
    log('大厅识别正常 (颜色指纹)');
    return true;
  }
  if (s === null) {
    var p = findImg('lobby', { sim: CFG.sim });
    if (p) {
      log('大厅识别正常 (找图)');
      return true;
    }
  }
  log('未识别到大厅标志, 请把游戏切到大厅界面再运行, 或检查 img_lobby / 运行 calibrate()');
  try { zdjl.alert('未识别到大厅标志!\n请切到大厅界面后重新运行, 并检查图像变量 img_lobby 或先运行 calibrate()'); } catch (e) { }
  return false;
}

if (boot()) {
  main();
}
