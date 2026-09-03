# 紫微斗数排盘 — Git 基线信息

> 参照八字 `GIT_v0.10.0_baseline.md` 体例。本文件记录紫微项目 git 化基线：当前状态、初始化步骤与回滚方法。
> 2026-09-02 已执行 git 化（df05d97）并推送 GitHub，Pages + CI 双绿。

## 基线版本

- **当前代码版本**：v0.1.0（index.html 头注释，2026-09-02 验收通过，1375 断言全过）
- **Git 状态**：✅ 已 git 化（df05d97 @ main，已 push origin）
- **目标仓库**：`git@github.com:bangshun2025/ziwei-paipan.git`
- **线上站点**：https://bangshun2025.github.io/ziwei-paipan/
- **基线日期**：2026-09-02

## 当前仓库状态说明

| 项 | 现状 |
|----|------|
| 运行目录 | `/Users/feng/人生资产/10-开发项目/软件-紫微斗数/紫微斗数·运行/` |
| 独立 .git | ✅ 已 init（main 分支）——2026-09-02 df05d97 首次提交 48 文件 |
| 远程 | ✅ origin = git@github.com:bangshun2025/ziwei-paipan.git（已 push -u） |
| 父仓库处理 | ✅ auto-backup 父仓库已 gitignore + 移出索引运行目录（档案目录仍由父仓库跟踪） |
| .gitignore | ✅ 已就位：.DS_Store / .bak*/ / *密码* / *password* / *secret* / *service_role* / *.log |
| 发布脚本 | ✅ scripts/publish-online.sh（默认 dry-run；--exec 需授权） |
| CI | ✅ .github/workflows/test.yml 已生效（push main 触发 #1 通过） |
| Pages | ✅ Deploy from branch: main / root（部署 #1 成功） |

## 已执行的 git 化步骤（2026-09-02 记录，供后续版本参考）

```bash
cd "/Users/feng/人生资产/10-开发项目/软件-紫微斗数/紫微斗数·运行"

# 1. 父仓库排除（先于 git init，避免嵌套 gitlink 混乱）
#    /Users/feng/人生资产/.gitignore 追加: 10-开发项目/软件-紫微斗数/紫微斗数·运行/
#    git rm -r --cached "10-开发项目/软件-紫微斗数/紫微斗数·运行"  # 工作区保留

# 2. 初始化仓库
git init -b main

# 3. 关联远程
git remote add origin git@github.com:bangshun2025/ziwei-paipan.git

# 4. 首次提交（选择性 add，禁用 git add -A）
git add index.html css/ js/ ALGORITHM.md CHANGELOG.md README.md SYSTEM.md docs/ scripts/ tests/ .gitignore .github/
git commit -m "v0.1.0: 紫微斗数排盘首个公测版（1375 断言验收通过）"

# 5. 推送到 GitHub（触发 Pages 部署 + CI 回归）
git push -u origin main
```

> 远程空仓库由 Leader 通过 browser 自动化创建（github.com/new，Public，不勾 README/.gitignore）；
> Pages 在 Settings → Pages 选择 Deploy from branch: main / root 后启用。
> 发布师执行 `bash scripts/publish-online.sh` 前置检查会再次校验上述条件。

## 代码文件（git 化后将纳入版本控制）

```
index.html                       # 入口 + 版本号真相源（头注释 vX.Y.Z）
js/constants.js                  # 常量表（402 年历法/星系/四化/起宫基准）
js/algorithm.js                  # 排盘算法（历法/四柱/安星/大限）
js/render.js                     # 展示层（盘面/月柱/农历文本）
js/main.js                       # UI + ?test=1 内嵌自检（88 条）
css/style.css                    # 样式
ALGORITHM.md                     # 算法宪法（口径/公式/锚点）
SYSTEM.md                        # 项目真相源（版本/模块/质量状态）
CHANGELOG.md                     # 变更记录
docs/                            # PRD/ADR/QA/RETRO/发布链路方案/TEST_全量测评手册/DEVELOPER
tests/                            # anchors/ + run_anchor_tests.js + run_case_tests.js + cases.md + report.md
scripts/                         # check-release.sh + publish-online.sh
.github/workflows/test.yml       # 回归 CI（git init 后生效）
.gitignore                       # 安全防呆（.bak/密码等）
```

## 回滚方法

git 化后（假设已打 tag v0.1.0）：

```bash
cd "/Users/feng/人生资产/10-开发项目/软件-紫微斗数/紫微斗数·运行"
git checkout v0.1.0              # 回滚到该 tag
```

发布前快速回退现场：`.bak_vX.Y.Z/` 目录（publish-online.sh --exec 发布前自动生成，含 index.html/js/css/宪法文档），替换回运行目录即可。

## 变更记录

| 日期 | 内容 |
|------|------|
| 2026-09-02 | v1.0 建档：记录 git 未初始化现状、初始化步骤（§3.1）、CI 就绪状态、回滚方法 |
| 2026-09-02 | v1.1 更新：git 化已完成（df05d97）+ 远程仓库创建 + Pages 启用 + CI #1 通过 |
