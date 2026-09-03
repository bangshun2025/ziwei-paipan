# CHANGELOG

本文件记录每次版本发布/里程碑的变更。格式参照 Keep a Changelog。

## [v0.1.0] - 2026-09-02

### 里程碑：首版核心实现完成并通过验收（未发布）

- 建立运行目录骨架：js/ css/ scripts/ docs/_TEMPLATE/ tests/anchors/（docs/archive 已于整理时平铺至 docs/，全量归档移至 `../紫微斗数·档案/`）
- 初始化真相源三件套：README.md / SYSTEM.md / CHANGELOG.md
- docs/_TEMPLATE 就位：PRD/ADR/TEST/QA/RELEASE/RETRO 模板 + 索引 README
- **口径裁决**：D-1~D-7 经邦顺裁决全部采纳「建议默认值」（与主流排盘软件对齐），ALGORITHM.md §16 定稿
- **核心链路实现**（编程师）：十二宫/十四主星/六吉六煞/四化/命身宫/五行局/大限，js/constants.js + algorithm.js + render.js + main.js 模块化
- **UI 渲染**：index.html 十二宫方盘 + ?test=1 内嵌自检
- **测试师验收**：锚点回归 1242 + cases 定向 45 + 浏览器自检 88 = **1375 断言全过，v0.1.0 通过验收**
  - 验收发现并修复：P1 六辅星起宫常量系统性错误（文昌/文曲/左辅/右弼/地劫/地空 6 常量），P2-1 UI 月柱错月（闰月下半月走 mUse）、P2-2 晚子时农历文本口径（lunarDisplay 分离）、P3-1 「零」→「〇」
- **发布链路**：scripts/check-release.sh + publish-online.sh + .gitignore 安全防呆就位（v0.1.0 未执行发布）
- **归档整理**（2026-09-02）：编排产出全量归档至 `../紫微斗数·档案/v0.1.0_紫微斗数排盘/`（1-产品经理/2-架构师/3-前端开发/4-测试师/5-发布师），docs 平铺 PRD/ADR/修订说明/QA 副本
