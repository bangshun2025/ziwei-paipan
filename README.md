# 紫微斗数排盘软件 · 运行目录

> **一句话定位**：纯本地紫微斗数排盘网页工具——输入出生信息，即时排出十二宫命盘
> （现行：十二宫 + 十四主星 + 六吉六煞 + 满盘档（杂曜 38 + 四神煞组）+ 多层四化 + 命身宫 + 五行局 + 大限 + 流运时间轴）。

## 目录地图

```
紫微斗数·运行/
├── README.md            ← 本文件
├── DEVELOPER_QUICKSTART.md ← 开发者速查：跑/测/发三步 + 文件地图（新 session 第一眼）
├── SYSTEM.md            ← 唯一真相源（产品/版本/模块地图/发布状态）
├── ALGORITHM.md         ← 算法宪法 v0.2.0（同步版）：安星口径唯一准绳
├── CHANGELOG.md         ← 版本变更记录
├── index.html           ← 主产物（版号 v0.5.0；迭代戳 v0.6.x-iter）
├── js/                  ← constants / algorithm / render / main / locdata / aiinput / archive（7 模块）
├── css/                 ← 样式（含横版两栏自适应）
├── scripts/             ← check-release.sh / publish-online.sh（发布脚手架）
├── docs/                ← 版本文档平铺：PRD / ADR / QA / RETRO / TEST 手册 / GIT baseline / 发布链路 / 修订说明 / DEVELOPER + _TEMPLATE/（19 项）
└── tests/               ← anchors/（12 盘旧锚点，待按 v0.2.0 重录）+ run_anchor_tests.js + run_case_tests.js + run_full_star_tests.js + cases.md + report.md
```

## 相关位置

- 全量归档：`../紫微斗数·档案/`（v0.1.0 → v0.6.x-iter 逐版目录 + 开发全档案（截至第56轮））
- 设计参考：`../设计参考/`（勿动）

## 运行方式

- 浏览器直接打开 `index.html`（纯本地，零依赖）。
- 自检：`index.html?test=1` 跑全量断言（204 条）。
- 回归：`node tests/run_anchor_tests.js`（1242 断言；⚠️ 65 条旧口径锚点待重录，L-02）+ `node tests/run_case_tests.js`（45 断言）+ `node tests/run_full_star_tests.js`（满盘档，需基准文件）。
