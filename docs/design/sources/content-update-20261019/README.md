# 内容更新美术源稿与编码记录

本批任务始于 2026-10-19，新稿由 imagegen 依据 Roam 既有角色及像素美术生成；在云端续接任务后完成资源制备。PNG 原稿保持不变，网页只发布 `public/` 中的 WebP；本目录不会进入静态站点及离线缓存。

## 新增稿件

| 原始 PNG | imagegen 生成文件 ID | 网页资源 | 最终规格 | 字节 |
| --- | --- | --- | --- | ---: |
| seals-content-v1.png | exec-430e10b0-a7b6-4e45-96b5-3586c89ac808.png | roam-pixel-seals-content-v1.webp | 256×256、2×2、RGBA、每格128px | 7,328 |
| improv-v1.png | exec-c652bcf0-9e67-41f9-b1bd-4fbf952dfd5d.png | art-improv.webp | 324×432、RGB | 19,804 |
| shapes-v1.png | exec-4ccbf20b-9553-4a1c-aa23-f957ad4409df.png | art-shapes.webp | 324×432、RGB | 19,382 |
| postcard-v1.png | exec-33143c09-8c85-4d56-9976-d8fa54c703b6.png | art-postcard.webp | 324×432、RGB | 20,152 |

三张场景合计 59,338 B，四枚章图集 7,328 B，新增图片合计 66,666 B。场景图原稿均为 1086×1448，章图原稿为 1254×1254。生成提示词及参考路径见 `prompts.md`，精确源稿、产物哈希和编码参数见 `preparation-manifest.json`。

四章图集按行排列：0 同行三程（journeys-3）、1 事件合拍（events-6）、2 亲手成牌（custom-first）、3 三十二个新发现（discoveries-32）。图中不嵌名称、状态或达成条件；这些信息由页面文字提供。场景分别表达街角即兴共创、发现城市形状、交换给未来的小卡片，一幅图服务同主题卡组。

## 旧资源来源与一次派生

云端没有历史 `assets/` PNG 原稿，因此不把历史 WebP 冒称原稿。`baseline-7b944b9/` 是从固定 git 提交 `7b944b9` 逐文件读出的九张公开 WebP，`baseline-derivatives.json` 保存固定源哈希。每次脚本都从该固定来源独立编码，不在上一轮派生结果上反复有损压缩。

九图从 600×800 或 540×720 派生为 480×640，保留 quality70、nearest、effort6。原九图共 403,834 B，派生共 264,384 B，节省 **139,450 B（136.18 KiB）**。实际牌面最大宽度约360px，当前图片区比竖图更矮；本次检查保留人物、表情和像素轮廓，最终页面裁切仍由浏览器回归确认。旅程主图、通行证、奖励图、邮票、旧章图等资源保持原文件字节。

## 重复制备

在仓库根目录运行：

```sh
node scripts/prepare-content-art.mjs /absolute/path/to/sharp
```

当前云端可使用 `sharp` 的正常 CommonJS 解析，无需向项目添加运行时依赖。正式构建及部署只用已提交的 WebP，不调用此脚本，也不要求 Sharp 或原稿。

新场景图为 nearest 324×432、quality35、effort6，每张不超过20KiB；高分辨率原稿保留供后续输出使用。初始480px版本约40–54KB，不适合本轮完整离线包；324px版本已经逐图查看，人物面部、手势和主题道具可辨。

章图先以 nearest 缩至256×256。生成透明稿含接近零的alpha噪点；以48为阈值生成二值alpha后，做8色无抖动PNG调色板中间编码，再写lossless WebP。此步骤保留透明背景，最终alpha只有0和255，四格角点为0；没有用黑底或白底伪装透明。RGB与alpha分别物化后重组，避免Sharp晚执行removeAlpha时误删新通道。

脚本检查尺寸、单图预算、固定源哈希和章图透明通道，生成完整制备清单；完整静态包是否达标由根目录正常构建及check门禁判定，不能用本目录图片节省数字替代最终构建结果。
