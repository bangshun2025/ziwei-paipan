# 紫微斗数排盘 · 编程师手册

> 最后更新：2026-09-02 | 对应版本：v0.1.0
> 编程师接到任务后的第一份必读材料。配合 ADR（架构决策）和 ALGORITHM.md（算法宪法）使用。

## 速览

- **技术栈**：原生 JS + CSS（零构建步骤），IIFE + `window.*` 命名空间
- **入口文件**：`index.html`（主产物，多文件模式加载 js/ 下 4 模块）
- **启动方式**：浏览器直接打开 `index.html`（纯本地，零依赖）
- **测试方式**：`index.html?test=1` → 88 条内嵌自检；`node test/run_anchor_tests.js` → 1242 条锚点回归；`node test/run_case_tests.js` → 45 条定向用例
- **部署**：GitHub Pages（`bangshun2025.github.io/ziwei-paipan/` 规划中，未发布），`scripts/publish-online.sh`

## 文件地图

| 文件 | 职责 | 修改时注意 |
|------|------|-----------|
| `index.html` | 页面壳、加载 js、`?test=1` 自检 | 版本注释 `<!-- vX.Y.Z -->` 是发布校验真相源之一 |
| `js/constants.js` | CONST：星表/宫表/四化表/历法数据 | ⚠️ 起宫基准常量必须与 ALGORITHM §1.1 地支序号表交叉核对（v0.1.0 P1 教训） |
| `js/algorithm.js` | ALGO：安星纯函数（命身宫/五行局/紫微/主星/辅星/四化/大限） | 改算法必须跑全量回归 + 同步 ALGORITHM.md |
| `js/render.js` | RENDER：盘面渲染（十二宫方盘/中宫/农历文本） | 展示口径必须复用核心层输出（mUse/lunarDisplay），勿自行重复实现（v0.1.0 P2-1/P2-2 教训） |
| `js/main.js` | APP：输入/事件/初始化/`?test=1` 断言 | 新增断言必须校验**落宫**而非仅数量（v0.1.0 P1 覆盖盲区教训） |
| `css/style.css` | 样式 | — |
| `test/anchors/*.json` | 12 盘 iztro 权威锚点快照 | 锚点是验收基准，勿随意改动；新增盘面字段需重生成锚点 |
| `test/cases.md` | 定向用例清单（含 DIF 差异登记） | — |

## Bug 墓地（v0.1.0）

| # | 级别 | 现象 | 根因 | 修复 |
|---|------|------|------|------|
| P1-1 | P1 | 六类辅星（文昌/文曲/左辅/右弼/地劫/地空）12 盘全落错一宫 | constants.js 六常量偏置（11/5/5/11/9/9），且 ALGORITHM §10.2/10.3 公式数值与注释/地支表自相矛盾，实现照抄错误公式值 | 常量改 10/4/4/10/11/11；宪法同步修订为 `fix12(10−t)`/`fix12(4+t)` 等 |
| P2-1 | P2 | UI 月柱展示错一月（仅闰月下半月出生） | render.monthPillarOf 用 lunar.lunarMonth(=2) 未用 chart.pre.mUse(=3) | 改用 mUse |
| P2-2 | P2 | 晚子时农历文本显示进位日 | 农历文本语义：iztro 按出生公历原日显示，代码按进位日 | preprocess 保留 lunarDisplay（原日），排盘仍用进位日 |
| P3-1 | P3 | 农历年份「二零零零年」应为「二〇〇〇年」 | CN_D[0]='零' | 年份位改用「〇」（日月不受影响） |

### 踩坑记录（v0.1.0）

1. **宪法公式数值与注释矛盾会直接传染实现**——ALGORITHM §10.2 写「戌起/辰起」注释但公式数值按错地支；写宪法时公式必须与 §1.1 地支表逐一核对，实现前先做文档内部一致性检查。
2. **内嵌自检覆盖盲区**：?test=1 原 82 条只数辅星数量（14 颗）不校验落宫 → P1 全盘错宫未被发现；测试师用 iztro 锚点全字段比对才暴露。断言必须校验「落宫位置」而非「存在数量」。
3. **展示层勿重复实现口径逻辑**：核心已算好 mUse/lunarDisplay，render 层应直接消费，重复实现必漂移。

## 函数速查（核心）

| 函数 | 模块 | 职责 |
|------|------|------|
| `ALGO.getChart(...)` | algorithm.js | 主入口：输出完整命盘对象（pre/命宫/十二宫/四化/大限） |
| `ALGO.placeAll(...)` | algorithm.js | 安星核心 |
| `RENDER.renderChart(...)` | render.js | 渲染命盘 |
| `RENDER.cnLunar(...)` | render.js | 农历中文文本（用 lunarDisplay） |
| `APP.runSelfTest()` | main.js | ?test=1 自检 |

## 依赖与红线

- **不直接拷贝八字项目文件**：历法/真太阳时实现参照八字源码思路，按 ALGORITHM §2 独立实现（版权与耦合考虑）
- **口径裁决以 ALGORITHM.md 为准**：D-1~D-7 已定稿，改口径必须走流程并同步锚点
