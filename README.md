# 紫微斗数排盘软件 · 运行目录

> **一句话定位**：纯本地紫微斗数排盘网页工具——输入出生信息，即时排出十二宫命盘
> （v1：十二宫 + 十四主星 + 六吉六煞 + 四化 + 命身宫 + 五行局 + 大限）。

## 目录地图

```
紫微斗数·运行/
├── README.md            ← 本文件
├── SYSTEM.md            ← 唯一真相源（产品/版本/模块地图/发布状态）
├── ALGORITHM.md         ← 算法宪法（安星口径唯一准绳，D-1~D-7 已裁决定稿）
├── CHANGELOG.md         ← 版本变更记录
├── index.html           ← 主产物（v0.1.0 已实现）
├── js/                  ← constants.js / algorithm.js / render.js / main.js（v0.1.0 已实现）
├── css/                 ← 样式（v0.1.0 已实现）
├── scripts/             ← check-release.sh / publish-online.sh（发布脚手架，未执行）
├── docs/                ← 版本文档平铺（八字式）：PRD_v0.1.0/ADR_v0.1.0/修订说明/QA_v0.1.0/发布链路方案 + _TEMPLATE/
└── tests/                ← 验收：anchors/（12 盘锚点 JSON）+ run_anchor_tests.js + run_case_tests.js + report.md
```

## 相关位置

- 全量归档：`../紫微斗数·档案/v0.1.0_紫微斗数排盘/`（1-产品经理/2-架构师/3-前端开发/4-测试师/5-发布师）
- 设计参考：`../设计参考/`（勿动）

## 运行方式

- 浏览器直接打开 `index.html`（纯本地，零依赖）。
- 自检：`index.html?test=1` 跑全量断言。
- 回归：`node tests/run_anchor_tests.js`（1242 断言）+ `node tests/run_case_tests.js`（45 断言）。
