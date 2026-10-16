# ADB 原生样例获取与静态回读 — 2026-10-16

来源：用户明确授权ADB复制；契约§6 V08、计划Task5、详细设计F1、AGENTS§11。

## 已执行与检查结果

- `adb devices -l`：沙盒内首次启动服务受限（Operation not permitted）；请求沙盒外许可后识别到唯一USB设备。未使用无线ADB、root、run-as、输入注入或权限修改。
- `adb shell`只读查看包名候选/共享目录，再限于`/sdcard/自动精灵/`列出本批ZZ沙盒；没有读取.config或其他应用数据。
- `adb shell sha256sum /sdcard/自动精灵/ZZ*SANDBOX*.zjs`：记录10份原件哈希；`adb pull`逐个指定文件写入此前空的本地exports目录，10 files pulled, 0 skipped，共49330字节。
- `python3`本地检查：10/10 SHA-256匹配手机原件；10/10 UTF-8逐行JSON解析成功、动作数与头部count一致、repeatCount=1、pauseOnFail=true、savedVerName=2.28.2；3个调用动作的文件引用均能在本批找到。
- 找图正负文件内嵌模板均为218×62 PNG，解码哈希一致；搜索区域不同。

这些是实际文件的静态检查，不是手机重新导入或完整运行测试。未运行pytest/ruff/typecheck。

| 文件 | 字节 | 动作数 | 状态/范围 |
|---|---:|---:|---|
| ZZ_DF_SANDBOX_BASIC.zjs | 646 | 2 | verified（复制/静态） |
| ZZ_DF_SANDBOX_CHILD.zjs | 471 | 1 | verified（复制/静态） |
| ZZ_DF_SANDBOX_IMAGE.zjs | 21347 | 1 | verified（复制/静态） |
| ZZ_DF_SANDBOX_NEG_ZZ_DF_SANDBOX_PARENT.zjs | 778 | 3 | verified（复制/静态） |
| ZZ_DF_SANDBOX_PARENT.zjs | 812 | 3 | verified（复制/静态） |
| ZZ_DF_SANDBOX_RECOGNITION.zjs | 851 | 2 | verified（复制/静态） |
| ZZ_DF_SANDBOX_STATE_ZZ_DF_SANDBOX_CHILD.zjs | 1097 | 3 | verified（复制/静态） |
| ZZ_DF_SANDBOX_STOP_ZZ_DF_SANDBOX_PARENT.zjs | 832 | 3 | verified（复制/静态） |
| ZZ_EMPTY_ZZ_DF_SANDBOX_RECOGNITION.zjs | 1149 | 2 | verified（复制/静态） |
| ZZ_NEG_ZZ_DF_SANDBOX_IMAGE.zjs | 21347 | 1 | verified（复制/静态） |

## 原生结构发现（仅本批样例，不是完整格式规范）

1. 首行JSON元数据，之后各行JSON动作，不是JavaScript源码或单个JSON数组。本批动作明文可读；不推断旧加密参考脚本也可读，不解密或执行旧参考。
2. 父调用为type=`执行脚本`，filePath为相对文件名，runArgs=`ARG20261016`；勾选返回时continueCurrentAfterFinish=true，未勾选副本没有该字段。缺省语义仅结合此前运行证据解释，不推广至所有版本。
3. 设置变量使用vars数组，value中的varScope分别为script/global；OCR变量的varType=image_recognition，config.recognitionMode=ocr_local。直接OCR动作useResultMode=clipboard。
4. 图像条件为condition.type=image，condition.image包含imageData.data、limitArea、minSimilarPercent=90等；不凭未出现的字段发明无限等待配置。
5. OCR精确正区为52.8% 78.2% 70.4% 80.6%，空区24% 27% 31% 31.6%；图像正区51.2% 77% 72.1% 81.6%，负区15.3% 25.8% 35.2% 32%。之前UI整数读数是近似记录。
6. **坐标风险**：脚本头screenHeight=2772，模板元数据screenHeight=2578，screenWidth均1240、DPI=3.5。差异原因尚未验证；不得自动把两套坐标或投屏666×1552混为同一空间，更不是游戏横屏校准。

## 追溯与剩余门槛

| 来源/检查 | 状态 | 实证或缺口/触发 |
|---|---|---|
| V08 / F1 / Task5：原件安全获取 | verified（子项） | USB复制10份，哈希全部一致，无手机写入 |
| V08 / F1：当前版本静态格式回读 | verified（子项） | 10份逐行解析/count/引用/模板检查；只覆盖已采样动作 |
| V08 / F1：另名导入/原生编辑器回读 | planned（未执行） | 后续按原获批沙盒方案另名导入，禁止覆盖；本次ADB仅只读/复制，无push |
| V04/F2：陈旧状态与当前业务结果校验 | implemented；旧值重置假设failing/red | 本次文件获取不解决已有运行时旧值问题 |
| V10/F4：脚本触控停止 | deferred | 仍需专用无副作用区域和单独授权 |
| V09/F5：原生日志/跨重启状态 | deferred | 本次未复制.config/运行日志，也未重启验证 |

V08整体改为implemented（部分），F1部分成立；C0仍未完成，未生成正式跑刀脚本。原件获取阻塞已解除，下一项是另名原生导入/回读及安全结果协议，不需要启用远程编辑。

完整SHA-256见同目录ADB_EXPORT_MANIFEST.json。旧日志的exports为空/未使用ADB属于此前阶段历史，本记录为最新状态。

## 2026-10-16 V10 原生触控字段（本批实测，不作全API说明）
来源exports/ZZ_TOUCH_20261016_NATIVE.zjs，849字节，SHA256 4689eedfe6f24bea5b0e129a7c8977e6a2bae660bd6d2937239190efb06fd590。
- 点击：type=点击，duration="100"毫秒，posData={type:"location",x:"40%",y:"65%"}，repeatCount=1。
- 滑动：type=滑动，duration="800"，startPos/endPos均location百分比对象。
- 多指：type=多指手势，gestureActions为原生点击/滑动对象数组。本批确认实际重叠，不是顺序单指模拟。
- 页面的CSS355×625、手机保存头1240×2772、Qt窗口666×1552属于不同空间；实测位置只用于离线页，不换算到游戏。
- 当前红停未交付完整释放事件（91–93）；禁止因此生成生产路线。详见touch_probe/TEST_PLAN_REVALIDATION.md。
