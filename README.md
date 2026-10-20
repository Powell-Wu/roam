# 沿途未定 · Roam

使用网址：https://powell-wu.github.io/roam/

GitHub 仓库：[Powell-Wu/roam](https://github.com/Powell-Wu/roam)。[仓库与网址迁移记录](docs/reports/ROAM-MIGRATION-20261015.md)。

## 项目资料

统一入口：[项目资料索引](docs/README.md)。本轮发布内容：56张任务、十枚纪念章、三张新插图和具体任务提示，内容版本 `r-463a05a568e3`。用户于2026-10-20通过独立试玩入口验收并授权发布，交付与验证见[内容更新记录](docs/reports/CONTENT-UPDATE-20261020.md)。[PR #3](https://github.com/Powell-Wu/roam/pull/3)合入main后由[发布工作流](https://github.com/Powell-Wu/roam/actions/workflows/pages.yml)执行完整检查、部署及线上版本/资源哈希核验。专项实机与双人参与者记录见验收表。

- [当前路线图](docs/plans/ROADMAP.md)：已完成范围、剩余验收和后续决策。
- [下一轮更新计划](docs/plans/CONTENT-UPDATE-20261019.md)：纪念章、事件卡、插图与细节完善的团队方案，含首发范围、分工、预算和验收；实现结果见交付记录。
- [执行总纲](docs/plans/GAME-IMPLEMENTATION-BRIEF.md)：架构、视觉、数据兼容与验收约束。
- [品牌规范](docs/design/PROJECT-NAMING.md)及[任务插画表](docs/design/TASK-ART-MAP.md)：当前设计来源。
- [实施报告](docs/reports/IMPLEMENTATION-PROGRESS.md)与[设备验收表](docs/acceptance/DEVICE-ACCEPTANCE.md)：当前结果与待填记录。
- [历史归档](docs/archive/README.md)：已完成方案、旧交付、迁移清单和会话记录说明。

## 开发与目录

使用 Svelte 5 + TypeScript + Vite，继续一部手机双人同行、静态托管与离线使用。依赖版本锁在 package.json/package-lock.json，优先复用 Node.js 24。

- src/main.ts、src/App.svelte：启动、hash 路由与生命周期。
- src/pages：今天、出发、任务、收藏、日志、结算和设置的 Svelte 页面。
- src/lib/components：卡牌、旅程路线、奖励预告、通行证与纪念票；组件管理自己的结构样式。
- src/lib/domain：原有卡池、计分和行程规则，首轮保留 .mjs。
- src/lib/services：IndexedDB 原子事务、草稿、显式更新和页面操作编排。
- src/styles：基础布局、纸张主题、共享动效和可访问性。
- public：参与发布的插画、图标与 manifest。
- dist：生成的生产产物，不再直接编辑或提交；_site 为迁移对照产物。
- tests、scripts：业务与迁移测试、浏览器验收、构建和一键发布。
- docs：当前计划、设计规范、报告、验收表和按日期归档的历史资料。
- assets：本机原图、提示词、参考与停用设计，入口 assets/README.md。
- test-results：本机验证证据和兼容构建，入口 test-results/README.md。

迁移基线为提交 5c32ee0 / r-4bf7cbb6ae14。原 dist 的42个文件逐一登记在 [归档迁移清单](docs/archive/2026-10/MIGRATION-INVENTORY.md)；源码/资源进入 src/public，旧入口和版本文件由构建生成。未使用的 story 图片仍在本机 assets/archive/legacy-story，不进入发布。

## 本机预览与检查

首次或依赖变更后运行 npm ci。Windows 重装依赖时先关闭本项目的 Vite dev/preview，以免原生构建文件被占用。日常开发运行 npm run dev，打开终端给出的 /roam/ 地址。开发预览停用 Service Worker；离线和更新测试使用生产构建。

```powershell
npm run typecheck
npm test
npm run build
npm run check
npm run test:e2e
npm run preview
```

逐条执行，前一步失败先处理。npm run release 兼容旧命令，并完成同一套 Vite 构建、递归版本与缓存生成。npm run check 只检查已有产物，不修改文件。npm run test:browser 是 test:e2e 的兼容入口。

浏览器验收默认使用本机 Edge 和项目内 Playwright，自动启动隔离的 /roam/ 静态服务，不需要手工启动预览。CI 使用 Chromium；其他电脑可先运行 npx playwright install chromium 并设置 CITYWALK_TEST_BROWSER=chromium。CITYWALK_TEST_BROWSER 也可指定已有浏览器通道。生产流程结果与截图默认在已忽略的 test-results/migration-20261009；随后自动检查组件卸载、确认弹窗取消、监听清理与已提交操作的异步收尾，结果在 test-results/lifecycle-20261009。CITYWALK_E2E_OUTPUT 可指定独立结果目录，便于保留不同浏览器的证据。

旧版升级测试默认读取 Git 提交5c32ee0中的原应用，用随机本机端口和独立浏览器数据测试真实旧 worker → 新 worker，不操作用户正式网站的数据。需要保留 Git 历史；CITYWALK_BASELINE_REF 可指定兼容的旧基线。

完整浏览器检查还包含第二轮：观察城市/默契挑战在320与390宽度的刷新、离线、收尾和纪念票，以及真实已发布v2 → v3双标签升级。v2基线默认从Git提交91d13cb重建，复用锁文件相同的本机依赖；可用 CITYWALK_V2_BASELINE_REF 指定提交，或 CITYWALK_V2_BASELINE_DIR 指向已核验的旧版静态构建。结果在 CITYWALK_E2E_OUTPUT 下的 second-round 目录。

回退需要支持当前 JSON v3 的应用。已保存 v3 后不能直接部署仅支持 v1/v2 的基线。将 CITYWALK_FALLBACK_DIR 指向不同版本的兼容静态构建，再运行 npm run test:rollback：检查打开时数据不变、试玩分支/主题/卡片保留、离线完成仍能提交，以及历史积分和声音偏好保留。本机已验证回退到归档第二轮初版 r-42f02b38fe62；归档和结果只保存在 test-results，不随项目发布。CITYWALK_ROLLBACK_OUTPUT 可指定独立结果目录。

## 修改与发布

双击 publish.cmd，或在终端运行 node scripts/publish.mjs。脚本核对 main、origin 地址、远端领先与暂存范围，再检查类型、业务、构建、资源和关键浏览器流程。通过后输入提交说明，随后提交并推送，打开 Actions 结果页。

提交对象是 src/public、配置、测试、脚本和 docs 中的正式项目资料；docs/archive/local、docs/archive/sessions、dist、_site、私人笔记、.env 与本机设计资料由发布范围排除。旧根目录文档移走后的受跟踪删除也会一并暂存。第一次迁移提交时脚本会从 Git 索引移除旧的 dist 源码，保留本机已经生成的产物。直接回车取消，检查失败不提交，推送失败可重试已有提交；不强制推送，也不自动合并远端改动。

保存文件不会自动上线。推送到 main 后，GitHub Actions 执行类型检查、业务测试、构建、递归产物检查与 Chromium 流程，再上传 dist 内容到原 GitHub Pages；失败时不发布。需要 Actions 的 build 和 deploy 均成功，并核对线上版本，才算上线。Run workflow 仅部署 GitHub 现有代码，不上传本机未推送的改动。

## 离线、记录与更新

部署路径已迁到 /roam/，保留原 hash 地址；manifest id 固定为 /citywalk/，start_url/scope 随新路径解析。继续保留 IndexedDB citywalk-for-two/state/current、所有存储 key 和跨标签频道。JSON 存档升级为 version:3，IndexedDB 的结构版本仍为1。支持 v1/v2 备份，先运行时校验，再在下一次成功保存的同一事务中迁移；只读打开及事务失败不改旧数据。原48张卡ID保持，新增event-17至event-24仅进入随心探索；原节点顺序、短途13/半日20目标及原计分保持。规则与主题内容保存快照，历史按自身规则解释；旧行程按随心探索解释，不重算积分。若还有 v1/v2 或无法识别的旧标签，新页保留输入并暂缓写入，关闭旧标签或让它应用更新后再重试。

构建后递归处理最终 JS/CSS、指纹 assets 和静态资源，生成 release.json、兼容 release.mjs 与 sw.js。内容版本不依赖手工数字；同输入重建得到同版本。下载全部资源并核对内容哈希后才标记离线准备完成；中断或不匹配会删除未完成缓存。只在玩家显式应用更新时跳过等待。

打开网页、返回前台、恢复网络及前台每15分钟检查更新；设置 → 版本与更新可手动检查和应用。旧标签不自动刷新，旧模块缓存保留到所有相关标签都确认执行版本后再安全清理。更新前保存匹配的表单草稿，不清除网站数据。

任务花费草稿以行程+节点+卡片隔离，收尾草稿以行程隔离；出发、自定义卡和奖励表单也会暂存。草稿保存在当前标签页 sessionStorage，12小时后过期；成功提交清除对应草稿，换卡不带入旧花费。已提交记录由 IndexedDB 原子事务保存。换设备或清理浏览器前在设置导出备份。

## 当前玩法与后续阶段

任务页显示类型路线、当前站、稍后/跳过和下一档奖励；预算、额外奖励和撤销收在旅程工具中。普通完成是可继续操作的420ms页内盖章，中途达档显示简短提示，收尾集中确认最高奖励；收尾与日志展示积分明细。卡牌前后共用5:7外框；标题超过牌面可用空间时，下方自动展示完整任务，任务详情另提供完整说明。滑动保留按钮和键盘替代，减少动态效果时直接更新。

首页可直接进入15–20分钟三卡试玩：零消费、不计分，首卡立即保存并打开。观察后共同选择寻找线索或倾听声音，后两张候选与纪念票随方向变化；方向保存后不随刷新重选。56张内置任务均有具体先手、配合和完成条件，不新增必填表单；已保存的旧卡原文保持。

出发页可选随心探索、观察城市、默契挑战。后两种有不同的三类卡池、旅程工具中的开场提示和收尾问题；主题保存到行程、日志和PNG纪念票，刷新或未来修改定义不改变旧行程。短途、半日和自由模式可用；直接试玩沿用自己的线索/声音分支。自定义卡在随心探索中参与抽取。主题候选耗尽时保留当前卡、允许跳过，不放宽预算、场景、禁用或去重条件。

最近三局已完成卡的抽取权重降低到普通卡的四分之一，首次抽卡和换卡一致使用此权重；预算、场景、禁用和本局去重仍为硬条件。所有候选都近期出现过时仍可抽取。收藏册区分喜欢、不抽、完成过，筛选在当前标签刷新或应用更新后恢复；十枚纪念章从当前及保留历史计算，撤销或删除会重算。日志详情可预览并保存 PNG 纪念票，长记录分成多页逐页保存；支持文件分享的手机会显示分享按钮。设置可开启翻牌、盖章、达档三个短音效，默认关闭，后台停止，前台下一次手势可恢复。

性能复测运行 `npm run measure:performance`，使用锁定的官方 web-vitals 6.2.3。默认对桌面/模拟手机、冷/热缓存各重复3次，共12次；每次实际完成5个浏览器交互，必须得到有效 LCP、INP、CLS。指标缺失、页面错误或超过目标均保存原始结果并以非零状态退出。库只用于测试，不进入产品或发送数据。

每次导航启动独立浏览器进程，每对冷/热测试使用同一个专用临时数据目录。热测试保留完整离线缓存，避免前一进程的渲染和限速状态干扰比较。实际首图绘制后、首次输入前加载指标库，并读取已缓冲的性能条目。结果包括逐次样本、最小值/中位数/最大值、资源字节及测量条件；解压内容字节与网络传输字节分别记录。

```powershell
$env:CITYWALK_TEST_BROWSER='msedge'
$env:CITYWALK_PERFORMANCE_OUTPUT='test-results/performance-edge'
npm run measure:performance
$env:CITYWALK_TEST_BROWSER='chromium'
$env:CITYWALK_PERFORMANCE_OUTPUT='test-results/performance-chromium'
npm run measure:performance
```

需要先有生产构建；Chromium 需要 Playwright 浏览器已安装。`CITYWALK_PERFORMANCE_REPETITIONS` 可设为1–10，`CITYWALK_PERFORMANCE_FLOW` 可选 trial（默认）、observe 或 duo；主题流程完成至少5次实际交互。输出目录必须位于 `test-results` 内，默认使用时间戳以保留旧结果。实验结果见 [实施报告](docs/reports/IMPLEMENTATION-PROGRESS.md)。用户2026-10-13要求先完成第二轮，结束后提醒人工验收；实机、VoiceOver/TalkBack 和五对用户试玩暂缓，按 [设备验收表](docs/acceptance/DEVICE-ACCEPTANCE.md) 单独记录。正式名称为“沿途未定 · Roam”；模拟尺寸、浏览器触摸和实验室指标不代表真实手机、总体75分位或真人验收。
