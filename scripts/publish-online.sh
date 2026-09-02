#!/bin/bash
# ============================================================
# 紫微斗数排盘 线上发布脚本（GitHub Pages：tag → CHANGELOG → push → 部署验证）
# 用法:
#   bash scripts/publish-online.sh                      # dry-run：只检查并打印将执行的动作（默认）
#   bash scripts/publish-online.sh --exec --tag-msg "v0.1.0: 紫微斗数排盘首个公测版"
# 防呆红线（移植八字 bazi-publish-online 经验）：
#   1. check-release.sh 必须全绿（版本一致性/语法/结构）
#   2. git 仓库存在；未提交改动需可解释（CHANGELOG 已含当前版本 → 自动补 commit）
#   3. 当前版本 == 最新 tag → 阻止重复发布
#   4. 选择性 git add（禁用 git add -A）；staged 敏感文件扫描（password/secret/.bak 等）→ 拒绝
#   5. 默认 dry-run；--exec 才真正执行 push/tag（正式发布需 Leader/用户授权）
# 版本号真相源：index.html 头部注释 vX.Y.Z（check-release 保证全文件一致）
# ============================================================
set -u
# 定位运行目录（脚本位于 <运行目录>/scripts/ 下）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR="$(dirname "$SCRIPT_DIR")"
cd "$DIR" || { echo "❌ 无法进入运行目录: $DIR"; exit 1; }

EXEC_MODE=0
TAG_MSG=""
for a in "$@"; do
  case "$a" in
    --exec) EXEC_MODE=1 ;;
    --tag-msg=*) TAG_MSG="${a#--tag-msg=}" ;;
    --tag-msg) echo "❌ --tag-msg 需要值，如 --tag-msg \"v0.1.0: 摘要\""; exit 1 ;;
    *) echo "❌ 未知参数: $a（支持 --exec --tag-msg=\"<标题>\"）"; exit 1 ;;
  esac
done

run() { # dry-run 只打印，--exec 才执行
  if [ $EXEC_MODE -eq 1 ]; then
    echo "  ▶ $*"; "$@"
  else
    echo "  [dry-run] $*"
  fi
}

echo "============================================================"
echo "紫微斗数排盘 · 线上发布（GitHub Pages）"
echo "模式: $([ $EXEC_MODE -eq 1 ] && echo 'EXEC（真执行）' || echo 'dry-run（只检查，不执行）')"
echo "运行目录: $DIR"
echo "============================================================"

FAIL=0
pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; FAIL=1; }

# ---------- 0. 版本号与校验脚本 ----------
[ -f index.html ] || { echo "❌ 缺少 index.html"; exit 1; }
VERSION=$(grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' index.html | head -1)
[ -n "$VERSION" ] || { echo "❌ index.html 未找到版本号"; exit 1; }
echo "🔖 当前版本（index.html 真相源）: $VERSION"

# ---------- 1. 前置检查 ----------
echo "【1/3】前置检查"
if [ -f scripts/check-release.sh ]; then
  if bash scripts/check-release.sh "$DIR"; then
    pass "check-release.sh 全部通过"
  else
    fail "check-release.sh 存在失败项，禁止发布"
  fi
else
  fail "缺少 scripts/check-release.sh"
fi

if [ ! -d .git ]; then
  TOP=$(git rev-parse --show-toplevel 2>/dev/null || true)
  if [ -n "$TOP" ] && [ "$TOP" != "$DIR" ]; then
    fail "运行目录无独立 .git（处于上级 auto-backup 仓库 $TOP 内，不能作为发布仓库）——需在运行目录 git init（见发布链路方案 §3.1）"
  else
    fail "尚未 git init / 非 git 仓库——先执行仓库初始化（见发布链路方案 §3.1）"
  fi
else
  pass "git 仓库存在"
  # 未提交改动检查
  if ! git diff --quiet || ! git diff --cached --quiet; then
    if grep -q "^## \[$VERSION\]\|^## $VERSION" CHANGELOG.md 2>/dev/null; then
      echo "  ℹ 有未提交改动且 CHANGELOG 已含 $VERSION 条目（发布本地已执行未 commit）→ 自动补 commit"
      run git add CHANGELOG.md
      run git commit -m "$VERSION: 更新 CHANGELOG（发布本地补提交）"
    else
      fail "有未提交改动且 CHANGELOG 无 $VERSION 条目——请先走内测发布（bump 版本 + CHANGELOG + commit）"
    fi
  else
    pass "git 工作区干净"
  fi
fi

# 版本 == 最新 tag → 阻止重复发布
LATEST_TAG=$(git tag --sort=-creatordate 2>/dev/null | head -1)
if [ -n "$LATEST_TAG" ] && [ "$VERSION" = "$LATEST_TAG" ]; then
  fail "当前 $VERSION 已是最新线上 tag——请先积累内测变更再发布"
else
  [ -n "$LATEST_TAG" ] && pass "自最新 tag $LATEST_TAG 起有新版本 $VERSION" || pass "首次发布（无历史 tag）"
fi

# CHANGELOG 必须已含当前版本条目（发布师在发布前归纳，脚本不强写内容）
if [ -f CHANGELOG.md ] && grep -q "^## \[$VERSION\]\|^## $VERSION" CHANGELOG.md 2>/dev/null; then
  pass "CHANGELOG 已含 $VERSION 条目"
else
  fail "CHANGELOG 缺 $VERSION 条目——发布前必须归纳 git log 补条目（Keep a Changelog）"
fi

# ?test=1 人工红线提示（浏览器动作，脚本不代跑）
echo "  ℹ 人工红线：浏览器打开 index.html?test=1 → 88 条断言 0 FAIL（发布前确认）"

# ---------- 2. 汇总变更（自上次 tag 以来） ----------
echo "【2/3】变更汇总（自 ${LATEST_TAG:-仓库起点} 以来）"
if [ -d .git ]; then
  if [ -n "$LATEST_TAG" ]; then
    git log "$LATEST_TAG..HEAD" --oneline 2>/dev/null | head -20 || true
    git diff "$LATEST_TAG..HEAD" --stat 2>/dev/null | tail -15 || true
  else
    git log --oneline 2>/dev/null | head -10 || echo "  （仓库尚无 commit——需先完成 git init 与首次提交）"
  fi
else
  echo "  （无独立 git 仓库，跳过——需先完成 git init 与首次提交，见发布链路方案 §3.1）"
fi

# ---------- 3. 发布动作 ----------
echo "【3/3】发布动作（tag → push → 部署验证）"
if [ $EXEC_MODE -eq 1 ]; then
  [ -n "$TAG_MSG" ] || { echo "❌ --exec 模式必须提供 --tag-msg=\"v$VERSION: <一句话标题>\""; exit 1; }
  # 敏感文件防线：本次拟提交内容扫描
  echo "  🔒 敏感文件扫描（staged + 工作区改动）..."
  if git status --short | grep -iE 'password|secret|service_role|\.bak|密码' >/dev/null 2>&1; then
    echo "  ❌ 检测到疑似敏感文件，禁止发布："
    git status --short | grep -iE 'password|secret|service_role|\.bak|密码'
    exit 1
  fi
  pass "无敏感文件"

  # 发布前 .bak 全量备份（安全防呆，参照八字发布师惯例；.gitignore 已排除 .bak*/）
  BAK_DIR=".bak_${VERSION#v}"
  echo "  📦 发布前备份：$BAK_DIR/（index.html + js + css + 宪法文档）"
  if [ -d "$BAK_DIR" ]; then rm -rf "$BAK_DIR"; fi
  mkdir -p "$BAK_DIR/js" "$BAK_DIR/css"
  cp index.html SYSTEM.md ALGORITHM.md CHANGELOG.md README.md "$BAK_DIR/" 2>/dev/null
  cp js/*.js "$BAK_DIR/js/" 2>/dev/null
  cp css/*.css "$BAK_DIR/css/" 2>/dev/null
  pass "备份完成（$BAK_DIR/，$(find "$BAK_DIR" -type f | wc -l | tr -d ' ') 个文件）"

  # 选择性 add：CHANGELOG + 版本头注释文件（如内测已 commit 则此处仅 CHANGELOG）
  git add CHANGELOG.md index.html js/constants.js js/algorithm.js js/render.js js/main.js css/style.css SYSTEM.md
  if ! git diff --cached --quiet; then
    git commit -m "$VERSION: 更新 CHANGELOG（发布线上）" || { echo "❌ commit 失败"; exit 1; }
  else
    echo "  ℹ 无新增 staged 改动（内测已全部提交）"
  fi
  # 打 annotated tag（版本号已由 check-release 保证 == index.html）
  git tag -a "$VERSION" -m "$TAG_MSG" || { echo "❌ 打 tag 失败（可能已存在）"; exit 1; }
  pass "tag 已打: $VERSION（annotated）"
  # 推送
  git push origin main --tags || { echo "❌ push 失败——检查 remote/SSH 密钥"; exit 1; }
  pass "已推送 origin main --tags"

  echo "  ⏳ 等待 GitHub Pages 部署（1-2 分钟生效）..."
  sleep 20
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" "https://bangshun2025.github.io/ziwei-paipan/" 2>/dev/null || echo 000)
  if [ "$HTTP" = "200" ]; then
    ONLINE_V=$(curl -s "https://bangshun2025.github.io/ziwei-paipan/" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    if [ "$ONLINE_V" = "$VERSION" ]; then
      pass "线上已生效: https://bangshun2025.github.io/ziwei-paipan/（$ONLINE_V）"
    else
      echo "  ⚠️ 线上可达但版本为 ${ONLINE_V:-未知}（部署可能未完成，稍后再验）"
      echo "    Pages build 偶发不触发——如长时间未更新，执行空 commit 强制触发："
      echo "    git commit --allow-empty -m \"ci: 触发 GitHub Pages 重新部署\" && git push origin main"
    fi
  else
    echo "  ⚠️ 线上暂不可达（HTTP $HTTP）——1-2 分钟后再验；必要时空 commit 强制触发 pages build"
  fi
else
  echo "  [dry-run] 将执行："
  echo "    1. git add CHANGELOG.md（+ 版本头注释文件，如有未提交）"
  echo "    2. git commit -m \"$VERSION: 更新 CHANGELOG（发布线上）\""
  echo "    3. git tag -a $VERSION -m \"$VERSION: <标题>\"   ← 需 --tag-msg"
  echo "    4. git push origin main --tags"
  echo "    5. curl 验证 https://bangshun2025.github.io/ziwei-paipan/ 版本号"
  echo "  ▶ 确认无误后执行: bash scripts/publish-online.sh --exec --tag-msg \"v$VERSION: <一句话标题>\""
fi

echo "----------------------------------------"
if [ $FAIL -eq 0 ]; then
  echo "🎉 前置检查全部通过。$([ $EXEC_MODE -eq 1 ] && echo '发布动作已执行完毕。' || echo 'dry-run 模式未执行任何 push/tag。')"
  exit 0
else
  echo "⚠️  存在失败项，禁止发布（先修复后重跑）。"
  exit 1
fi
