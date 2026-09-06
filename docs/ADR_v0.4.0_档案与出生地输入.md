# ADR v0.4.0 — 档案功能与出生地省市区技术方案

- 版本：v0.4.0（基线 66c7f4c v0.3.0-ref）
- 日期：2026-09-06
- 关联：PRD_v0.4.0_档案与出生地输入.md
- 决策性质：纯输入层与存储层扩展；**算法层（algorithm.js）、渲染层（render.js）、constants.js 排盘常量零改动**（constants.js 仅 VERSION 同步）。

## 1. 改动定位

| 文件 | 动作 | 内容 |
|---|---|---|
| index.html | 改 | ① 输入面板加姓名行（#inName）② 出生地行替换为省(#fProv)/市(#fCity)/区县(#fDist)三级 + #fLng 保留 + liveSolar 文本 ③ 操作行加「📋档案」#btnArchive ④ 档案面板/编辑面板/回收站面板结构（隐藏 div）⑤ 引入 js/locdata.js、js/archive.js，缓存戳 330→331 |
| js/locdata.js | 新建 | LOC_DATA 34省/309市全量（复制自八字 index.html 885-1263 行），IIFE 挂 window.LOC_DATA |
| js/archive.js | 新建 | 档案存储/CRUD/搜索/回收站/编辑面板（本地主干，无云端无隐私），IIFE 挂 window.ARCHIVE |
| js/main.js | 改 | SHICHEN 已在内；state 增 name/prov/city/dist/scIdx；els 增新控件；三级联动+liveSolar 实时刷新；doCalc 保持 getChart 入参不变；档案面板开关接线；载入/保存读取函数 export 给 ARCHIVE |
| css/style.css | 改 | 档案面板/弹层/卡片/回收站样式 + liveSolar 浅色小字样式（对齐现有设计语言） |
| js/constants.js | 改 | 仅 VERSION 行 v0.1.0 → v0.4.0（内部对齐，随发布步骤执行） |
| docs/*.md | 新/改 | PRD/ADR 新建；发布时 CHANGELOG/SYSTEM 同步 |

## 2. 关键决策

### D1 数据层独立文件 locdata.js / archive.js（而非塞入 constants.js / main.js）
- 理由：constants.js 已 2480 行（排盘数据），LOC_DATA 27.5K 字符不应混入排盘模块；main.js 503 行已承载 UI 控制器，档案逻辑 400+ 行独立成模块便于测试与后续扩展（编辑/回收站/搜索同住）。
- 加载顺序：constants → locdata → algorithm → render → main → archive（archive 最后，依赖 main 暴露的读取/回填钩子；或 main 先于 archive 但 archive 在 DOMContentLoaded 内延迟初始化，两者皆可——采用 **archive.js 在 main.js 后加载**，其 init 函数由 main.js initApp 末尾显式调用 `ARCHIVE.init()`）。

### D2 表单 ⇄ 快照 双函数单点（避免读取逻辑散落）
- main.js 暴露两个纯函数给 ARCHIVE：
  - `APP.readForm()` → 快照对象（字段同 PRD-D，含 scIdx 当前 chip 下标、省市县文本、lng 数值、useSolar、advLateZi）；
  - `APP.writeForm(snap)` → 按快照回填全部控件（历法切换复用 setMode 逻辑 → 设年月日闰月 → chip 高亮 scIdx → 性别 → 省市县三级级联回填 → fLng → 开关），末尾调用 doCalc()。
- ARCHIVE 只做存储与列表/面板渲染，不直接触碰表单 DOM——职责分离，main.js 是表单唯一 owner。

### D3 存储键 zw_ 前缀 + 版本化 + 软删
- `zw_arch_v1` / `zw_trash_v1`（JSON 数组）；迁移钩子预留（v1 直读，未来 v2 走 migrateFromV1 模式，本次不实现）。
- 软删：删除=主数组移除+回收站数组追加（带原 updatedAt），还原=逆向；彻底删除=仅回收站移除；清空=trash 置 []。
- 写失败（QuotaExceeded/JSON 损坏）try/catch → console.error + 面板内错误提示；读取时 JSON.parse 失败回退空数组并备份损坏串到 `zw_arch_bak_corrupt`。

### D4 liveSolar 复用算法层真太阳时实现
- algorithm.js 已有 equationOfTime(date) 与 trueSolarTime；在 main.js 内新增 `refreshLiveSolar()`：
  - 取当前选中 chip 的 h:mi（时辰中点）+ 当日公历日期 → eot = ALGO.equationOfTime(...)（需按 algorithm.js 实际导出签名适配）→ solarH = h + (lng-120)*4/60 + eot/60 → 格式化 HH:MM；
  - 跨段判定：按 solarH 落在哪个时辰区间（0:00-0:59早子/1-2丑/3-4寅/…/23晚子），与当前 chip 名不同则提示「≈X时」；
  - 未选 lng（或 fTrueSolar 关闭）→ 文本「北京时间（120°E），未校正」。
- ⚠️ 实现时先读 algorithm.js trueSolarTime/equationOfTime 的签名与返回单位，确保调用正确（见风险 R1）。

### D5 CSS 弹层体系不引依赖
- 档案面板=全屏半透明遮罩 .mask + 居中卡片 .panel-card（max-width 640，max-height 82vh 内部滚动），沿用现有 .panel 圆角/阴影变量；列表卡片用 grid；保持移动端可用（遮罩内滚动）。

## 3. 回滚预案
- 单次实现后若自检/回归失败且 15 分钟内无法修复 → `git checkout -- index.html js/ css/` 回到基线 66c7f4c 重来；已提交则 `git revert`。
- 算法层零改动 → 锚点 1242/cases45 理论必过，若出现差异即怀疑 locdata 引入顺序/缓存问题（检查 331 戳），绝不动 algorithm.js。

## 4. 验收基线
- check-release.sh（版本线对齐后）+ ?test=1 自检全绿 + 锚点 1242 + cases45 + PRD AC1-AC10 逐条过。
