# V10/F4 离线触控实验（2026-10-16）
用户最新允许：专用无副作用界面上有限点击/滑动/多指/急停释放，通过后才启动游戏采集大厅只读信息。禁止匹配、购买、背包、权限变更。

执行者选择：使用现有手机浏览器打开 data:text/html 离线页，无服务器、网络、安装、存储、跳转或业务按钮。CSP default-src none；只允许内联样式/脚本。全屏内容为被动触点观察区，touch-action:none，阻止滚动/缩放。状态只在内存，刷新清空。不能把切后台时页面主动清空当松手证明：仅记录真实 up/cancel，visibility 只记录不清 active。

原生动作字段须从自动精灵编辑器创建/导出，不猜测。脚本必须 repeat=1、pauseOnFail=true，有限时长，坐标位于实测内容区且远离浏览器/导航边缘。急停从独立原生控件执行；观察 active=0、up/cancel、截止时间后无迟发事件，再独立重跑。

## 当前结果

详细逐项状态见TEST_PLAN.md与TEST_PLAN_REVALIDATION.md。本地观察器/生成物及单指约束23项通过（连同协议43项共66项）；正常触控部分有手机实证；**急停释放failing/red，未进入游戏**。V1源码保留，新V2并列记录pointer与TouchEvent快照，不伪造释放。后续见NEXT_TASKS.md。

恢复后新增SINGLE_MOVE(1200ms)与SINGLE_STOP(15000ms)，仅在已重新核实的离线安全页比较单指与多指取消；不提供释放API，不代表已修复。来源与状态见TEST_PLAN T10a–d。single-finger.test.cjs可离线验证4项格式/哈希约束。

单指真机对照结果：自然结束收到up、ACTIVE/TOUCHES归零；中途红停后未收到本次释放，超过原期限仍未归零。故不是仅多指问题。详见TOUCH_STOP_FINDINGS.md；仍禁止游戏，暂停恢复入口见NEXT_TASKS.md。

## 2026-10-17 更新与暂停

surface-compact.html是同语义核心的短传输诊断页，base64 URL 1862字符，不使用旧长URL；保留Pointer/TouchEvent独立计数、时钟和不清零visibility，省略MAX与历史。6项本地测试通过。官方touchUp样例与4项组合结构测试均仅限诊断；实际通过及未完成项见TOUCHUP_FINDINGS_2026-10-17.md。用户已暂停，不运行手机样例。
