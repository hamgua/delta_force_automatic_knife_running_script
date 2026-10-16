# C0协议探针覆盖矩阵

所有检查继承来源：AGENTS§11（原件保护/准确报告）；无外部调用，HTTP/DB约束/auth/tenant均不适用（无相应操作；引入服务/多租户即触发重新展开）。副作用仅本地沙盒变量，原生运行异常和重复执行另测；本地测试不证明磁盘日志或原生调度。

| 测试/每个操作 | 来源 | 维度 | 状态 |
|---|---|---|---|
| matching no-change result accepted | 契约§3 SegmentResult；V04；设计F2 | success/contract | verified（Node纯逻辑，43项总体，不替代原生） |
| missing/malformed/non-object result rejected | 契约§3/§4；V04 | validation/failure | verified（Node纯逻辑，43项总体，不替代原生） |
| each session/dispatch/route/segment/profile identity mismatch rejected | 契约§3 SegmentRequest/Result；V04 | contract/validation | verified（Node纯逻辑，43项总体，不替代原生） |
| missing result identity rejected | 契约§3；V04 | validation | verified（Node纯逻辑，43项总体，不替代原生） |
| unknown status and changed/uncertain result rejected | 契约§3 InventoryResult；设计§9 | failure/side-effect guard | verified（Node纯逻辑，43项总体，不替代原生） |
| issued or unconfirmed action rejected, no boolean coercion | 契约§3 InventoryResult；设计§9 | validation | verified（Node纯逻辑，43项总体，不替代原生） |
| wrong producer and endpoint rejected | 契约§3 SegmentResult；V04 | provenance/contract | verified（Node纯逻辑，43项总体，不替代原生） |
| request schema/scope/identities validated independently | 契约§3/§4；V04 | validation | verified（Node纯逻辑，43项总体，不替代原生） |
| child active request matches passed args | 契约§3；V03/V04 | integration contract | verified（Node纯逻辑，43项总体，不替代原生） |
| no active request / no args rejected | 契约§4；V04 | stale-state/failure | verified（Node纯逻辑，43项总体，不替代原生） |
| claimed dispatch rejected | 契约§4；V04 | idempotency/no replay | verified（Node纯逻辑，43项总体，不替代原生） |
| native dynamic parameter / global result roundtrip | V03/V04；设计F2 | native integration/observability | verified（本批原生子项，证据60–66） |
| native new run creates different dispatch | 契约§4；V04 | freshness/idempotency | verified（本批原生子项，证据60–66） |
| native direct child after parent has no active request | 契约§4；V04 | stale-state/failure | verified（本批原生子项，证据60–66） |
| native child error prevents parent-after | V03/V07；设计F2/§9 | native failure/stop | verified（本批原生子项，证据60–66） |
| native persistence/restart | V09；设计F5 | persistence | deferred：未批准故障/重启实验；安全无损重启范围明确后触发 |
| native scripted gesture/stop release | V10；设计F4 | touch side effects | deferred：缺专用触控面及单独授权；二者齐备后触发 |
