# 2026-10-16 本机迁移记录

- 目标：`/Users/hamgua/code/github/delta_force_automatic_knife_running_script`。
- 导入普通文件：3280；符号链接：4；原始文件总字节：1901322988。
- 所有导入文件均在清理来源之前核对 SHA-256；符号链接保留链接文本，不跟随复制外部目标。
- 原始资料只迁移不改写；仅 progress.md 在核对后追加一条迁移记录，原哈希及追加后哈希均登记。
- 62 项纯逻辑测试迁移后通过，完整输出 node-test.log；两个 JS 语法检查通过。**手机急停释放仍失败**。
- 只保留现有 Git 配置和历史，本次不联网、不 push、不操作手机。
- API 上游快照及 Downloads 原 AGENTS / 输入附件是 copy，原件保留；其余 move 来源已在核对后移除。
- local-tools/、旧 venv、pkg3.txt、OS 文件等实际资料仍在目标中，但由 .gitignore 排除，不在 Git 克隆中。
- Downloads 的无关资料、其它 QtScrcpy 安装包、通用工具缓存、原 AGENTS.md 和空的共享 docs 目录未改动。

## 路径映射

历史文档中的绝对路径不改写。单文件精确映射和哈希见 manifest.json。

| 原路径 | 项目内新路径 | 操作 |
| --- | --- | --- |
| `/Users/hamgua/Downloads/三角洲单人跑刀_自动精灵包` | `三角洲单人跑刀_自动精灵包` | move |
| `/Users/hamgua/Downloads/三角洲跑刀自动化_采集` | `三角洲跑刀自动化_采集` | move |
| `/Users/hamgua/Downloads/三角洲跑刀自动化_需求核对_2026-10-16.md` | `三角洲跑刀自动化_需求核对_2026-10-16.md` | move |
| `/Users/hamgua/Downloads/三角洲跑刀自动化_详细设计_2026-10-16.md` | `三角洲跑刀自动化_详细设计_2026-10-16.md` | move |
| `/Users/hamgua/Downloads/三角洲跑刀自动化_本地契约与采集清单_2026-10-16.md` | `三角洲跑刀自动化_本地契约与采集清单_2026-10-16.md` | move |
| `/Users/hamgua/Downloads/docs/superpowers/plans/2026-10-16-delta-automation-feasibility.md` | `docs/superpowers/plans/2026-10-16-delta-automation-feasibility.md` | move |
| `/Users/hamgua/Downloads/北七速撤跑刀焚诀.pdf` | `references/北七速撤跑刀焚诀.pdf` | move |
| `/Users/hamgua/Downloads/三角洲免费全自动跑刀双排组队版.zjs` | `references/三角洲免费全自动跑刀双排组队版.zjs` | move |
| `/Users/hamgua/Downloads/自动精灵_运行条件核对.png` | `references/自动精灵_运行条件核对.png` | move |
| `/Users/hamgua/Downloads/自动精灵2.82.apk` | `local-tools/installers/自动精灵2.82.apk` | move |
| `/Users/hamgua/Downloads/QtScrcpy-mac-arm64-Qt6.5.3-v4.2.1.dmg` | `local-tools/installers/QtScrcpy-mac-arm64-Qt6.5.3-v4.2.1.dmg` | move |
| `/Users/hamgua/Downloads/AGENTS.md` | `references/context/AGENTS.downloads.original.md` | copy |
| `/var/folders/rt/vzrvp5pn2s991l0fs60r6p3h0000gn/T/codex-clipboard-93f3df47-5e7b-4804-ba3b-ae7c4305c6ed.png` | `references/attachments/codex-clipboard-93f3df47-5e7b-4804-ba3b-ae7c4305c6ed.png` | copy |
| `/private/tmp/CozeAi_zdjlapi` | `references/zdjl-api-snapshot` | copy |
| `/private/tmp/kdtest` | `artifacts/legacy-tmp/kdtest` | move |
| `/private/tmp/delta-route-review` | `artifacts/legacy-tmp/delta-route-review` | move |
| `/private/tmp/apkx` | `local-tools/apk-analysis/apkx` | move |
| `/private/tmp/apkmf` | `local-tools/apk-analysis/apkmf` | move |
| `/private/tmp/acc_list2.png` | `artifacts/legacy-tmp/root/acc_list2.png` | move |
| `/private/tmp/acc_page.png` | `artifacts/legacy-tmp/root/acc_page.png` | move |
| `/private/tmp/addaction.png` | `artifacts/legacy-tmp/root/addaction.png` | move |
| `/private/tmp/after_stop.png` | `artifacts/legacy-tmp/root/after_stop.png` | move |
| `/private/tmp/after_stop2.png` | `artifacts/legacy-tmp/root/after_stop2.png` | move |
| `/private/tmp/app_open.png` | `artifacts/legacy-tmp/root/app_open.png` | move |
| `/private/tmp/beiqi-contact-sheet.png` | `artifacts/legacy-tmp/root/beiqi-contact-sheet.png` | move |
| `/private/tmp/beiqi-detail-4.png` | `artifacts/legacy-tmp/root/beiqi-detail-4.png` | move |
| `/private/tmp/beiqi-detail-5.png` | `artifacts/legacy-tmp/root/beiqi-detail-5.png` | move |
| `/private/tmp/beiqi-route-1.png` | `artifacts/legacy-tmp/root/beiqi-route-1.png` | move |
| `/private/tmp/beiqi-route-2.png` | `artifacts/legacy-tmp/root/beiqi-route-2.png` | move |
| `/private/tmp/beiqi-route-3.png` | `artifacts/legacy-tmp/root/beiqi-route-3.png` | move |
| `/private/tmp/beiqi-route-4.png` | `artifacts/legacy-tmp/root/beiqi-route-4.png` | move |
| `/private/tmp/beiqi-route-5.png` | `artifacts/legacy-tmp/root/beiqi-route-5.png` | move |
| `/private/tmp/beiqi-route-6.png` | `artifacts/legacy-tmp/root/beiqi-route-6.png` | move |
| `/private/tmp/committed.png` | `artifacts/legacy-tmp/root/committed.png` | move |
| `/private/tmp/confirmed.png` | `artifacts/legacy-tmp/root/confirmed.png` | move |
| `/private/tmp/cur1.png` | `artifacts/legacy-tmp/root/cur1.png` | move |
| `/private/tmp/cur2.png` | `artifacts/legacy-tmp/root/cur2.png` | move |
| `/private/tmp/cur3.png` | `artifacts/legacy-tmp/root/cur3.png` | move |
| `/private/tmp/curA.png` | `artifacts/legacy-tmp/root/curA.png` | move |
| `/private/tmp/curB.png` | `artifacts/legacy-tmp/root/curB.png` | move |
| `/private/tmp/dots.png` | `artifacts/legacy-tmp/root/dots.png` | move |
| `/private/tmp/fn.png` | `artifacts/legacy-tmp/root/fn.png` | move |
| `/private/tmp/fn_crop.png` | `artifacts/legacy-tmp/root/fn_crop.png` | move |
| `/private/tmp/gear.png` | `artifacts/legacy-tmp/root/gear.png` | move |
| `/private/tmp/in1.png` | `artifacts/legacy-tmp/root/in1.png` | move |
| `/private/tmp/in10.png` | `artifacts/legacy-tmp/root/in10.png` | move |
| `/private/tmp/in2.png` | `artifacts/legacy-tmp/root/in2.png` | move |
| `/private/tmp/in3.png` | `artifacts/legacy-tmp/root/in3.png` | move |
| `/private/tmp/in4.png` | `artifacts/legacy-tmp/root/in4.png` | move |
| `/private/tmp/in5.png` | `artifacts/legacy-tmp/root/in5.png` | move |
| `/private/tmp/in6.png` | `artifacts/legacy-tmp/root/in6.png` | move |
| `/private/tmp/in7.png` | `artifacts/legacy-tmp/root/in7.png` | move |
| `/private/tmp/in8.png` | `artifacts/legacy-tmp/root/in8.png` | move |
| `/private/tmp/in9.png` | `artifacts/legacy-tmp/root/in9.png` | move |
| `/private/tmp/jsdlg.png` | `artifacts/legacy-tmp/root/jsdlg.png` | move |
| `/private/tmp/lobby1.png` | `artifacts/legacy-tmp/root/lobby1.png` | move |
| `/private/tmp/lobby2.png` | `artifacts/legacy-tmp/root/lobby2.png` | move |
| `/private/tmp/lp1.png` | `artifacts/legacy-tmp/root/lp1.png` | move |
| `/private/tmp/lp_make.png` | `artifacts/legacy-tmp/root/lp_make.png` | move |
| `/private/tmp/main1.png` | `artifacts/legacy-tmp/root/main1.png` | move |
| `/private/tmp/make_opt.png` | `artifacts/legacy-tmp/root/make_opt.png` | move |
| `/private/tmp/map1.png` | `artifacts/legacy-tmp/root/map1.png` | move |
| `/private/tmp/match1.png` | `artifacts/legacy-tmp/root/match1.png` | move |
| `/private/tmp/match2.png` | `artifacts/legacy-tmp/root/match2.png` | move |
| `/private/tmp/match3.png` | `artifacts/legacy-tmp/root/match3.png` | move |
| `/private/tmp/now1.png` | `artifacts/legacy-tmp/root/now1.png` | move |
| `/private/tmp/now2.png` | `artifacts/legacy-tmp/root/now2.png` | move |
| `/private/tmp/now3.png` | `artifacts/legacy-tmp/root/now3.png` | move |
| `/private/tmp/now_state.png` | `artifacts/legacy-tmp/root/now_state.png` | move |
| `/private/tmp/ov1.png` | `artifacts/legacy-tmp/root/ov1.png` | move |
| `/private/tmp/ov1_crop.png` | `artifacts/legacy-tmp/root/ov1_crop.png` | move |
| `/private/tmp/overlay2.png` | `artifacts/legacy-tmp/root/overlay2.png` | move |
| `/private/tmp/overlay_settings.png` | `artifacts/legacy-tmp/root/overlay_settings.png` | move |
| `/private/tmp/paodao-after-cancel.png` | `artifacts/legacy-tmp/root/paodao-after-cancel.png` | move |
| `/private/tmp/paodao-after-cancel.xml` | `artifacts/legacy-tmp/root/paodao-after-cancel.xml` | move |
| `/private/tmp/paodao-app-menu.png` | `artifacts/legacy-tmp/root/paodao-app-menu.png` | move |
| `/private/tmp/paodao-app-menu.xml` | `artifacts/legacy-tmp/root/paodao-app-menu.xml` | move |
| `/private/tmp/paodao-app-ready.png` | `artifacts/legacy-tmp/root/paodao-app-ready.png` | move |
| `/private/tmp/paodao-app.png` | `artifacts/legacy-tmp/root/paodao-app.png` | move |
| `/private/tmp/paodao-current-app.png` | `artifacts/legacy-tmp/root/paodao-current-app.png` | move |
| `/private/tmp/paodao-current-app.xml` | `artifacts/legacy-tmp/root/paodao-current-app.xml` | move |
| `/private/tmp/paodao-detail-now.png` | `artifacts/legacy-tmp/root/paodao-detail-now.png` | move |
| `/private/tmp/paodao-detail-now.xml` | `artifacts/legacy-tmp/root/paodao-detail-now.xml` | move |
| `/private/tmp/paodao-execution-result.png` | `artifacts/legacy-tmp/root/paodao-execution-result.png` | move |
| `/private/tmp/paodao-execution-window.xml` | `artifacts/legacy-tmp/root/paodao-execution-window.xml` | move |
| `/private/tmp/paodao-game-start.png` | `artifacts/legacy-tmp/root/paodao-game-start.png` | move |
| `/private/tmp/paodao-installed-code.js` | `artifacts/legacy-tmp/root/paodao-installed-code.js` | move |
| `/private/tmp/paodao-installed.zjs` | `artifacts/legacy-tmp/root/paodao-installed.zjs` | move |
| `/private/tmp/paodao-lobby-check.png` | `artifacts/legacy-tmp/root/paodao-lobby-check.png` | move |
| `/private/tmp/paodao-lobby-check.xml` | `artifacts/legacy-tmp/root/paodao-lobby-check.xml` | move |
| `/private/tmp/paodao-permission-current.png` | `artifacts/legacy-tmp/root/paodao-permission-current.png` | move |
| `/private/tmp/paodao-permission-current.xml` | `artifacts/legacy-tmp/root/paodao-permission-current.xml` | move |
| `/private/tmp/paodao-phone-initial.png` | `artifacts/legacy-tmp/root/paodao-phone-initial.png` | move |
| `/private/tmp/paodao-play-ready.png` | `artifacts/legacy-tmp/root/paodao-play-ready.png` | move |
| `/private/tmp/paodao-play-ready.xml` | `artifacts/legacy-tmp/root/paodao-play-ready.xml` | move |
| `/private/tmp/paodao-prompt-again.png` | `artifacts/legacy-tmp/root/paodao-prompt-again.png` | move |
| `/private/tmp/paodao-resume.png` | `artifacts/legacy-tmp/root/paodao-resume.png` | move |
| `/private/tmp/paodao-resume.xml` | `artifacts/legacy-tmp/root/paodao-resume.xml` | move |
| `/private/tmp/paodao-run-attempt.png` | `artifacts/legacy-tmp/root/paodao-run-attempt.png` | move |
| `/private/tmp/paodao-run-result.png` | `artifacts/legacy-tmp/root/paodao-run-result.png` | move |
| `/private/tmp/paodao-run-window.xml` | `artifacts/legacy-tmp/root/paodao-run-window.xml` | move |
| `/private/tmp/paodao-runtime-step.png` | `artifacts/legacy-tmp/root/paodao-runtime-step.png` | move |
| `/private/tmp/paodao-runtime-step.xml` | `artifacts/legacy-tmp/root/paodao-runtime-step.xml` | move |
| `/private/tmp/paodao-startup-result.png` | `artifacts/legacy-tmp/root/paodao-startup-result.png` | move |
| `/private/tmp/paodao-startup-result.xml` | `artifacts/legacy-tmp/root/paodao-startup-result.xml` | move |
| `/private/tmp/paodao-test-stopped.png` | `artifacts/legacy-tmp/root/paodao-test-stopped.png` | move |
| `/private/tmp/paodao-window.xml` | `artifacts/legacy-tmp/root/paodao-window.xml` | move |
| `/private/tmp/phone_screen.png` | `artifacts/legacy-tmp/root/phone_screen.png` | move |
| `/private/tmp/pkg3.txt` | `artifacts/legacy-tmp/root/pkg3.txt` | move |
| `/private/tmp/probe.zjs` | `artifacts/legacy-tmp/root/probe.zjs` | move |
| `/private/tmp/proj2.png` | `artifacts/legacy-tmp/root/proj2.png` | move |
| `/private/tmp/proj3.png` | `artifacts/legacy-tmp/root/proj3.png` | move |
| `/private/tmp/proj5.png` | `artifacts/legacy-tmp/root/proj5.png` | move |
| `/private/tmp/proj6.png` | `artifacts/legacy-tmp/root/proj6.png` | move |
| `/private/tmp/proj7.png` | `artifacts/legacy-tmp/root/proj7.png` | move |
| `/private/tmp/proj8.png` | `artifacts/legacy-tmp/root/proj8.png` | move |
| `/private/tmp/proj_dd.png` | `artifacts/legacy-tmp/root/proj_dd.png` | move |
| `/private/tmp/proj_dd2.png` | `artifacts/legacy-tmp/root/proj_dd2.png` | move |
| `/private/tmp/proj_dd3.png` | `artifacts/legacy-tmp/root/proj_dd3.png` | move |
| `/private/tmp/proj_dd4.png` | `artifacts/legacy-tmp/root/proj_dd4.png` | move |
| `/private/tmp/proj_dd5.png` | `artifacts/legacy-tmp/root/proj_dd5.png` | move |
| `/private/tmp/proj_dd6.png` | `artifacts/legacy-tmp/root/proj_dd6.png` | move |
| `/private/tmp/proj_dd7.png` | `artifacts/legacy-tmp/root/proj_dd7.png` | move |
| `/private/tmp/proj_dialog.png` | `artifacts/legacy-tmp/root/proj_dialog.png` | move |
| `/private/tmp/proj_dropdown.png` | `artifacts/legacy-tmp/root/proj_dropdown.png` | move |
| `/private/tmp/proj_full.png` | `artifacts/legacy-tmp/root/proj_full.png` | move |
| `/private/tmp/proj_now.png` | `artifacts/legacy-tmp/root/proj_now.png` | move |
| `/private/tmp/proj_now2.png` | `artifacts/legacy-tmp/root/proj_now2.png` | move |
| `/private/tmp/rec_stop.png` | `artifacts/legacy-tmp/root/rec_stop.png` | move |
| `/private/tmp/rec_stop2.png` | `artifacts/legacy-tmp/root/rec_stop2.png` | move |
| `/private/tmp/rec_stopped.png` | `artifacts/legacy-tmp/root/rec_stopped.png` | move |
| `/private/tmp/remote_edit.png` | `artifacts/legacy-tmp/root/remote_edit.png` | move |
| `/private/tmp/remote_on.png` | `artifacts/legacy-tmp/root/remote_on.png` | move |
| `/private/tmp/running1.png` | `artifacts/legacy-tmp/root/running1.png` | move |
| `/private/tmp/running2.png` | `artifacts/legacy-tmp/root/running2.png` | move |
| `/private/tmp/saved.png` | `artifacts/legacy-tmp/root/saved.png` | move |
| `/private/tmp/saved2.png` | `artifacts/legacy-tmp/root/saved2.png` | move |
| `/private/tmp/saved2_crop.png` | `artifacts/legacy-tmp/root/saved2_crop.png` | move |
| `/private/tmp/screen_after.png` | `artifacts/legacy-tmp/root/screen_after.png` | move |
| `/private/tmp/screen_now.png` | `artifacts/legacy-tmp/root/screen_now.png` | move |
| `/private/tmp/script_open.png` | `artifacts/legacy-tmp/root/script_open.png` | move |
| `/private/tmp/state1.png` | `artifacts/legacy-tmp/root/state1.png` | move |
| `/private/tmp/typed1.png` | `artifacts/legacy-tmp/root/typed1.png` | move |
| `/private/tmp/typel1.png` | `artifacts/legacy-tmp/root/typel1.png` | move |
| `/private/tmp/typel2.png` | `artifacts/legacy-tmp/root/typel2.png` | move |
| `/private/tmp/undo1.png` | `artifacts/legacy-tmp/root/undo1.png` | move |
| `/private/tmp/undone.png` | `artifacts/legacy-tmp/root/undone.png` | move |
| `/private/tmp/zs_black2.png` | `artifacts/legacy-tmp/root/zs_black2.png` | move |
| `/private/tmp/zs_create.png` | `artifacts/legacy-tmp/root/zs_create.png` | move |
| `/private/tmp/zs_create2.png` | `artifacts/legacy-tmp/root/zs_create2.png` | move |
| `/private/tmp/zs_create3.png` | `artifacts/legacy-tmp/root/zs_create3.png` | move |
| `/private/tmp/zs_create4.png` | `artifacts/legacy-tmp/root/zs_create4.png` | move |
| `/private/tmp/zs_home.png` | `artifacts/legacy-tmp/root/zs_home.png` | move |
| `/private/tmp/zs_home2.png` | `artifacts/legacy-tmp/root/zs_home2.png` | move |
| `/private/tmp/zs_make.png` | `artifacts/legacy-tmp/root/zs_make.png` | move |
| `/private/tmp/跑刀主控.zjs` | `artifacts/legacy-tmp/root/跑刀主控.zjs` | move |

## 校验来源

本迁移来自用户“所有数据移动到项目作为 git 管理”请求；没有新增游戏功能或手机测试授权。
Git 的文件清单和忽略规则决定是否版本管理；manifest.json 同时登记 Git 跟踪及本地忽略的已迁移资料。

## 迁移后的 Git 筛选

用户随后要求仅提交重要资料；调试截图、连续帧、日志与缓存已取消跟踪，但本地原件保留。
完整 manifest.json 和原始 *.log 仅本地存在，Git 克隆不会包含它们。
跟踪规则见 ../../GIT_TRACKING_POLICY.md；本节是对上述原始迁移记录的追加，不改变当时校验结论。
