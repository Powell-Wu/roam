# 项目资料索引

资料状态截至 2026-10-20（Asia/Singapore）。日常运行和发布命令见根目录 [README](../README.md)。

## 当前状态

本轮发布内容版本为 `r-463a05a568e3`，用户已于2026-10-20通过独立试玩入口验收并授权发布。[PR #3](https://github.com/Powell-Wu/roam/pull/3)及[main发布工作流](https://github.com/Powell-Wu/roam/actions/workflows/pages.yml)记录合入、部署与线上资源核验；前版为 `7b944b9` / `r-dffed68f37b4`。实际交付与验证见[内容更新记录](reports/CONTENT-UPDATE-20261020.md)。

- 8张新事件、35张旧卡提示细化与四枚新章已实现：共56任务、十枚纪念章；原48卡身份、计分、主题和试玩保持。
- 三张卡组插图、四章透明图集和资源减重已完成，完整离线包950.2KiB。
- 106项测试、类型、构建、产物检查及完整七阶段浏览器回归通过；性能以交付记录为准，不沿用旧版数据。
- [更新计划](plans/CONTENT-UPDATE-20261019.md)保留团队分工、边界与后续扩池决定。
- 真实手机、VoiceOver/TalkBack、五对首轮及至少三对第二局继续按验收表保留待验。

10月13日美术与体验阶段记录分别见[美术交付](reports/PIXEL-UI-DELIVERY-20261013.md)、[验收修订](reports/ACCEPTANCE-UI-FIXES-20261013.md)和[体验修订](reports/UI-POLISH-20261013.md)，其中当时的“本机/未发布”状态不代表当前发布状态。

2026-10-14新增[第三方玩家评审](reports/PLAYER-REVIEW-20261014.md)：核对当前线上 `r-d4a6d340274f`，按实际界面流程提出首屏操作、主题配合、收藏目标和出发上下文建议。

2026-10-14评审优化：首屏配合与常驻按钮、出发页奖励编辑、40种主题做法、六枚纪念章及下一程入口已实现；中途奖励改为页内提示，外观设置归位，详情见[评审优化实施](reports/PLAYER-REVIEW-IMPLEMENTATION-20261014.md)。

## 按用途查找

| 用途 | 资料 | 状态与职责 |
| --- | --- | --- |
| 看下一轮更新 | [内容扩充与细节计划](plans/CONTENT-UPDATE-20261019.md) | 团队分工、四章、8事件、插图预算和兼容边界；已实现，交付状态见记录 |
| 看剩余工作 | [当前路线图](plans/ROADMAP.md) | 汇总完成范围、待验事项及后续决策；维护当前待办 |
| 查实现约束 | [执行总纲](plans/GAME-IMPLEMENTATION-BRIEF.md) | 架构、数据兼容、视觉与验收要求；已完成迁移不再重做 |
| 查品牌 | [品牌规范](design/PROJECT-NAMING.md) | 名称、图标、字标和存储身份约定 |
| 查美术对应 | [任务与插画表](design/TASK-ART-MAP.md) | 56张内置卡与WebP资源的映射 |
| 查像素 UI 与纪念美术 | [设计规范](design/PIXEL-UI-20261013.md) / [交付记录](reports/PIXEL-UI-DELIVERY-20261013.md) | 已实装页面、原创资源、截图、最终构建与验证证据 |
| 查最新验收修订 | [通行证、选图、准备页与卡背](reports/ACCEPTANCE-UI-FIXES-20261013.md) | 当前本地版本、四项修订与回归结果 |
| 查当前结果 | [内容更新交付](reports/CONTENT-UPDATE-20261020.md) / [实施报告](reports/IMPLEMENTATION-PROGRESS.md) | 当前云端构建、检查、性能及证据路径 |
| 看优化评估 | [2026-10-13进度评估](reports/OPTIMIZATION-ASSESSMENT-20261013.md) | 功能完成度、发布差距、重玩内容边界与下一步优先级 |
| 记录人工验收 | [设备与双人试玩表](acceptance/DEVICE-ACCEPTANCE.md) | 四种设备入口、屏幕阅读器与五对试玩的待填表 |
| 查旧方案与历史 | [归档索引](archive/README.md) | 早期预览、优化方案、第一轮交付、迁移清单和实施历史 |
| 查本次整理 | [整理记录](reports/ORGANIZATION-20261013.md) | 原位置、新位置、归档理由和完整性验证 |

本机原图和提示词从 `assets/README.md` 查找；浏览器截图、性能数据和回退基线从 `test-results/README.md` 查找。这两类资料保留在本机，不随网页部署。

## 维护方式

1. 新任务先从本索引和路线图读取当前状态，规范细节再查执行总纲；以实际代码、构建和当次检查确认基线。
2. 新计划放 `plans/`，规范放 `design/`，结果放 `reports/`，待填验收放 `acceptance/`。同一阶段更新现有文件，避免再在根目录新增并行总纲。
3. 已完成或被替代的方案移到 `archive/YYYY-MM/`，写明适用版本、归档原因和当前替代入口。归档原记录保留日期、失败诊断和指标口径。
4. 会话计划/笔记放 `archive/sessions/`，旧本机手册放 `archive/local/`；这两处由 Git 忽略，发布脚本也拒绝暂存其中的文件。
5. 记录的版本、实验室结果、真实设备结果和发布状态分别注明；只更新有证据的状态。原始证据和兼容回退构建保留原路径。
