# 开发者速查 · 紫微斗数排盘

> **给 AI / 开发者的一眼材料**：新 session 读完本文即可了解项目全貌、快速定位代码、跑通测试、知道发布链路。
> 最后更新：2026-09-03 | 对应版本：v0.1.0（发布 v0.2.0 时更新本节）

---

## 一、项目概览

原生 JS + CSS 单页紫微斗数排盘应用，**零构建步骤**，`<script>` 直接加载，纯本地可跑，GitHub Pages 原生兼容。

- **入口文件**：`index.html`（页面壳 + 加载 js/ 下 4 模块 + `?test=1` 内嵌自检）
- **核心模块**：`js/constants.js`（星表/宫表/四化/历法）、`js/algorithm.js`（安星算法）、`js/render.js`（渲染）、`js/main.js`（输入/事件/自检）
- **仓库**：`bangshun2025/ziwei-paipan`（git remote origin，main 分支）
- **部署**：GitHub Pages（`bangshun2025.github.io/ziwei-paipan/`，v0.1.0 已上线）；`scripts/publish-online.sh` 一键发布

## 二、文件地图（运行/ 根目录）

| 文件/目录 | 用途 | 改什么看这里 |
|-----------|------|--------------|
| `index.html` | 页面壳、加载模块、`?test=1` 自检 | 版本注释 `<!-- vX.Y.Z -->` 是发布校验真相源 |
| `js/constants.js` | CONST：星表/宫表/四化表/农历历法 | ⚠️ 起宫基准常量须与 ALGORITHM §1.1 交叉核对（P1 教训） |
| `js/algorithm.js` | ALGO：安星纯函数（命身宫/五行局/紫微/主星/辅星/四化/大限） | ⭐ 改算法必改：改完跑全量回归 + 同步 ALGORITHM.md |
| `js/render.js` | RENDER：十二宫方盘/中宫/农历文本渲染 | 展示口径复用核心层输出（mUse/lunarDisplay），勿自行重复实现（P2 教训） |
| `js/main.js` | APP：输入/事件/初始化/`?test=1` 断言 | 新增断言校验**落宫**而非仅数量（P1 覆盖盲区教训） |
| `css/style.css` | 全部样式（含横版两栏 @media 自适应） | — |
| `tests/` | 测试资产：`anchors/a01-a12.json`（iztro 权威锚点）+ `run_anchor_tests.js`（1242）+ `run_case_tests.js`（45）+ `cases.md` + `report.md` | 锚点是验收基准勿乱改；新增字段需重生成锚点 |
| `scripts/` | `check-release.sh`（发布前一致性校验）+ `publish-online.sh`（Pages 发布） | — |
| `docs/` | 版本文档体系：`PRD/ADR/QA/RETRO/TEST 手册/GIT baseline/发布链路方案/修订说明` + `_TEMPLATE/` | 新功能走流水线，见 §四 |
| `SYSTEM.md` | 项目真相源：范围/口径裁决/质量状态 | 口径以 ALGORITHM.md 为准 |
| `CHANGELOG.md` | 版本历史 | 查历史第一站 |
| `.github/workflows/test.yml` | CI：push 自动跑 check-release + L1/L2 + L3 浏览器自检 | — |

## 三、三步速查（跑 / 测 / 发）

**① 本地跑**
```bash
open index.html          # 浏览器直接打开，纯本地零依赖
```

**② 测试（三层回归，发布质量门）**
```bash
open "index.html?test=1"                      # L3 内嵌自检：88 条，页面底部显示 ALL PASS
node tests/run_anchor_tests.js                # L1 锚点全字段回归：1242 断言（iztro 基准，支持 [a01|...|all]）
node tests/run_case_tests.js                  # L2 定向用例：45 断言（闰月/晚子时/真太阳时等）
bash scripts/check-release.sh                 # 发布前一致性：版本注释/JS 语法/结构 id/引用完整性
```
全绿 = 版本一致性 + 1242 + 45 + 88 四关齐过。详细口径见 `docs/TEST_全量测评手册.md`。

**③ 发布（GitHub Pages）**
```bash
bash scripts/check-release.sh   # 先本地校验
bash scripts/publish-online.sh  # 一键发布到 Pages（内部会重新校验）
git push origin main            # push 触发 CI（check-release + 三层回归）
```
> 注意：Pages 发布与 git push 是两条独立链，发布链路细节见 `docs/发布链路方案_v0.1.0.md`。

## 四、新功能/改口径流程（红线）

1. **口径裁决**：口径定义以 `SYSTEM.md` + `ALGORITHM.md` 为准，改口径必须同步 ALGORITHM.md 并更新锚点。
2. **开发流水线**：PRD → ADR → 实现 → 测试验收 → 发布 → 复盘 → 归档（多 Agent 编排模式，模板在 `docs/_TEMPLATE/`）。
3. **档案与 docs 双轨**：每轮开发过程全量归档到 `../紫微斗数·档案/vX.X.X_功能名/{角色目录}/`；定稿文档在 `docs/` 留档，两者保持同步。
4. **红线**：不直接拷贝八字项目文件（历法/真太阳时参照思路独立实现，见 DEVELOPER.md 依赖与红线）；锚点数据勿手改。

## 五、深水区文档导航

| 需要 | 看 |
|------|-----|
| 编程师手册（函数速查/Bug 墓地/踩坑） | `docs/DEVELOPER.md` |
| 算法宪法（全部排盘规则权威定义） | `ALGORITHM.md`（根目录） |
| 架构决策 | `docs/ADR_v0.1.0_紫微斗数架构.md` |
| 测试口径与生成锚点方法 | `docs/TEST_全量测评手册.md` |
| 发布链路与脚本 | `docs/发布链路方案_v0.1.0.md` |
| 历史版本记录 | `CHANGELOG.md` |
