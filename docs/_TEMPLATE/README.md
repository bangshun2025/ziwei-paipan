# docs/_TEMPLATE — 模板索引

每版本文档从对应模板复制，命名统一：
`<类型>_v<版本>_<功能名>.md`（如 `PRD_v0.2.0_流年功能.md`）。

| 模板 | 说明 | 来源/引用 |
|------|------|-----------|
| PRD.md | 产品需求文档 | 复制自八字 docs/_TEMPLATE/PRD.md（结构：背景/上版本复盘遗留项/AC） |
| ADR.md | 架构决策记录 | 复制自体系-开发管理 templates/ADR_TEMPLATE.md（含⚠️目标文件信息表，必填且需 grep 实测） |
| TEST.md | 测试用例与验收锚点 | 本目录自建（参照八字 docs/TEST_v0.25.0_宫位配置保护.md） |
| QA.md | QA 回归报告 | 复制自八字 docs/_TEMPLATE/QA.md |
| RELEASE.md | 发布报告 | 本目录自建（参照八字 RELEASE_CHECKLIST.md / docs/发布报告-*.md） |
| RETRO.md | 版本复盘 | 本目录自建（参照八字 docs/RETRO_v0.24.0_*.md） |
| 变更记录.md | 过程记录 | 复制自八字 docs/_TEMPLATE/变更记录.md（可选） |

> 规则：模板文件保持只读，使用时复制到归档目录再编辑；模板本身不随版本修改，
> 需改进模板时更新本目录并记录（避免各版本文档结构漂移）。
