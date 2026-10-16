# C0协议探针测试复核（不是完整C0验收）

2026-10-16；来源：本地契约§3/§4/§6 V03/V04/V08、详细设计F1/F2/§9、AGENTS测试计划治理及§11。对应TEST_PLAN.md逐行覆盖；无HTTP/DB/tenant服务，故相应维度不适用；未来引入时重建覆盖。当前无真实外部API测试。

## 命令与实际结果

- `node --test .../sandbox_protocol/protocol.test.cjs`：先在NOT_IMPLEMENTED桩上观察41项失败（red-test.log），再实现并加入2项schema/scope检查后43/43通过（green-test.log），直接重跑43/43通过。
- 初次green命令外层使用zsh只读变量status，shell封装退出1；日志中的43项实际通过，随后直接命令退出0确认，不把外层失败隐去。
- `node --check .../sandbox_protocol/protocol.js`：语法检查退出0；不是lint或类型检查。pytest/ruff/typecheck未运行。
- `adb shell test/sha256sum`：先确认新文件名不存在，后验证3份生成样例SHA-256与本地manifest相同；原BASIC/CHILD/PARENT哈希与最初manifest相同。
- `adb push`仅本批唯一名称的新样例；没有覆盖原件、没有root、没有input注入、没有读取.config。原生界面操作只用CUA。

## 来源→计划→可执行检查→实际证据

| 来源/需求 | 计划/实现 | 实际结果 | 状态与边界 |
|---|---|---|---|
| V08/F1 另名导入 | 原父样例不改字节，以ZZ_RT名称导入 | 原生列表/调用参数/返回选项与单次父前→子→父后，51–55 | verified（共享目录导入，不是系统选择器路径） |
| V04/F2 程序读写 | 原生JS探针 | global set/get实际JS_PROBE JS20261016，58；官方getVar/setVar依据56 | verified（子项，非持久化） |
| V03/V04 参数/结果 | native __vars.runArgs表达式、独立子JS、父JS验证 | C0_PASS两轮，60/61；证明动态JSON参数→子global结果→父自动校验 | verified（合成无触控协议） |
| 契约§4 当前调度 | 每次父从头执行重建session/dispatch并清结果 | 60/61可见dispatch不同；同源43个Node测试 | verified（这两次样例，不宣称绝无碰撞/游戏会话识别） |
| V04 缺失/旧/未知结果 | protocol.test.cjs及父验证JS的四个拒绝断言 | 43/43纯逻辑；原生父C0_PASS必须在stale/empty/unsafe/replay断言后出现 | verified（逻辑拒绝；缺失结果诱发父JS异常的独立原生场景尚未执行） |
| V04 无参数子 | 显式清runArgs，检查active/claim | 直接子原生暂停62；实际failureObserved=INVALID_REQUEST，active为空63 | verified（无参数直接运行子项；不能撤销最初原生runArgs自动清理假设失败） |
| V03/V07 异常传播 | NEG_PARENT传错dispatch，CHILD抛错，父末尾FORBIDDEN_AFTER_ERROR不得出现 | 日志19:44:10.032错误IDENTITY_MISMATCH，19:44:10.038暂停64；19:45仍暂停无父后65；人工停止父19:46:26.337/子19:46:26.338，66 | verified（暂停而非自动终止；不能恢复错误动作或把动作成功日志当业务成功） |
| V10/F4 触控松手 | 本批没有脚本触控 | 未执行 | deferred：专用无副作用触控面及单独许可齐备才触发 |
| V09/F5 持久化 | 本批不读.config、不重启 | 未执行 | deferred：明确无损持久化/重启范围后再测；截图不是原生磁盘日志 |

## 尚不能保证

1. 只支持C0_SANDBOX和SKIPPED_NO_CHANGE，不含真实移动/拾取/换位/撤离，不可直接用在游戏。
2. 原生pauseOnFail是暂停，可被人工继续；本批使用红停结束，未验证自动不可恢复的SAFE_STOP或取消令牌持久化。
3. 现有子错误分支会记录原因并抛错，但不会清空此前active请求；全量父新运行会重置，但取消/跨重启/跳步恢复协议未实现，必须在正式调度前补齐。不宣称本探针覆盖完整业务取消。
4. 锚点、profile均合成，不能作为实际画面验证或游戏会话证据。Date.now/Math.random标记防意外旧值，不是安全鉴权或持久化的唯一性保证。
5. 官方JS文档限制：不能在runAction里嵌套设置变量/运行JS等依赖引擎的动作（57）。本批用原生串行动作回避该路径，未测试嵌套行为。
6. 识别新鲜度、多匹配/横屏模板、触控释放、本地持久化仍缺；C0未完成。

## 当前文件与手机状态

本目录包含纯逻辑、Node测试与red/green日志、3份生成样例及哈希清单。手机新增原生RT/JS/ARG样例及3份C0协议样例；原10份未覆盖。最后手机在本地列表、无运行/暂停链（67）。错误后旧active值可能仍在内存，下一次完整父运行会显式清理，不能当作可恢复执行状态。


独立复核收尾：复核者只读检查protocol.js、43项测试及3份生成物/manifest，独立Node测试43/43通过，未发现本批合成无触控范围的Critical/Important。提出1项Minor：TEST_PLAN仍planned；该问题在复核并行期间已更新，执行者检查现文件没有planned行，纯逻辑和原生证据明确分开，视为已处理。复核没有独立查看手机截图，60–66的界面观察仍由主执行者负责。复核重申：replay只是协议逻辑自检，非原生重复领取实验；错误分支不清active，不能覆盖中途恢复/取消/重启。复核者已关闭。
