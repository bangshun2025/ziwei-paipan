# RELEASE：<功能名 / 版本>

> 发布报告（发布师产出）。每版本发布后记录。
> 发布流程与检查清单见运行目录 scripts/ 或参照八字 RELEASE_CHECKLIST.md 模式；
> 参考样例：八字运行目录 docs/发布报告-v0.24.0.md、docs/RELEASE_v0.20.0.md。

## 头部元信息

- **版本**：vX.Y.Z（内测 / 公测 / 正式）
- **日期**：YYYY-MM-DD
- **发布师**：worker_id
- **对应文档**：PRD/ADR/TEST/QA_vX.Y.Z
- **发布状态**：✅ 完成 / ⬜ 进行中

## 一、发布前检查清单

- [ ] `git status` 干净
- [ ] 无 console.log / debugger 残留
- [ ] 多文件/单文件一致性校验通过（check-release）
- [ ] `?test=1` 全量断言 0 FAIL（全部产物文件都测）
- [ ] CHANGELOG.md 已更新
- [ ] SYSTEM.md 版本已同步
- [ ] 锚点回归全绿（ALGORITHM §15.2）

## 二、发布动作记录

| 步骤 | 结果 |
|------|------|
| git tag vX.Y.Z | |
| git push --tags | |
| GitHub Pages / 内测渠道部署 | |
| 留痕（公测/正式） | |

## 三、遗留与建议

| 编号 | 事项 | 去向 |
|------|------|------|
