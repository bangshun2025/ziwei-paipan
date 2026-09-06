#!/bin/bash
# ============================================================
# 紫微斗数排盘 发布前一致性校验（v0.1.0 发布链路脚手架）
# 用法: bash scripts/check-release.sh [目录]   （默认当前目录）
# 校验项：
#   1. 版本一致性：index.html 提取版本号，与 js×4/css/CHANGELOG/SYSTEM.md 逐一比对
#   2. JS 语法：node --check constants/algorithm/render/main（IIFE 直接可查）
#   3. 结构红线：index.html 关键 id 全部存在 + script 加载顺序 constants→algorithm→render→main
#   4. 引用完整性：index.html 引用的 js/css 文件真实存在
# 全部通过退出码 0，任一失败退出码 1。
# 注：?test=1 浏览器全量断言（88 条 0 FAIL）为人工红线，见发布链路方案 §五。
# 移植自：八字排盘 scripts/check-release.sh（v0.20.2/v0.20.3 事故防线）
# ============================================================
set -u
DIR="${1:-$(pwd)}"
cd "$DIR" || { echo "❌ 目录不存在: $DIR"; exit 1; }

# index.html 中关键结构 id（防渲染结构漏同步/误删）
KEY_IDS="app testOut chartWrap resultPanel detailPanel detailBody calcErr dateErr fYear fMonth fDay fCity fLng segType segAmPm btnCalc btnAdv btnTestPage advBox timeline resultHead inName fProv fDist liveSolar btnArchive archiveMask editSave"
# 模块加载顺序（constants/locdata 必须先于 algorithm；render/main/archive 在后）
LOAD_ORDER="constants locdata algorithm render main archive"
JS_FILES="js/constants.js js/locdata.js js/algorithm.js js/render.js js/main.js js/archive.js"
CSS_FILES="css/style.css"

FAIL=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; FAIL=1; }
version_of() { grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' "$1" 2>/dev/null | head -1; }

echo "【1/4】版本一致性校验（头注释 ↔ CHANGELOG ↔ SYSTEM.md）"
[ -f index.html ] || { echo "❌ 缺少 index.html"; exit 1; }
VERSION=$(version_of index.html)
[ -n "$VERSION" ] || { echo "❌ index.html 未找到版本号 vX.Y.Z"; exit 1; }
echo "  🔖 基准版本（index.html）: $VERSION"

for f in index.html $JS_FILES $CSS_FILES; do
  [ -f "$f" ] || { fail "缺少文件: $f"; continue; }
  v=$(version_of "$f")
  if [ "$v" = "$VERSION" ]; then pass "$f 版本一致 ($v)"; else fail "$f 版本不一致（期望 $VERSION，实际 ${v:-无}）"; fi
done

if [ -f CHANGELOG.md ]; then
  cv=$(grep -oE '^## \[?v[0-9]+\.[0-9]+\.[0-9]+' CHANGELOG.md | head -1 | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+')
  if [ "$cv" = "$VERSION" ]; then pass "CHANGELOG.md 最新条目 $cv"; else fail "CHANGELOG.md 最新条目（${cv:-无}）≠ 版本 $VERSION"; fi
else
  fail "缺少 CHANGELOG.md"
fi
if [ -f SYSTEM.md ]; then
  sv=$(grep -oE '\*\*v[0-9]+\.[0-9]+\.[0-9]+\*\*' SYSTEM.md | head -1 | tr -d '*')
  if [ -n "$sv" ] && [ "$sv" = "$VERSION" ]; then pass "SYSTEM.md 当前版本 $sv"; else fail "SYSTEM.md 当前版本（${sv:-无}）≠ 版本 $VERSION"; fi
else
  fail "缺少 SYSTEM.md"
fi

echo "【2/4】JS 语法检查（node --check）"
for f in $JS_FILES; do
  [ -f "$f" ] || { fail "缺少文件: $f"; continue; }
  if node --check "$f" 2>"$TMP/err.txt"; then
    pass "$f 语法 OK"
  else
    fail "$f 语法错误: $(head -3 "$TMP/err.txt" | tr '\n' ' ')"
  fi
done

echo "【3/4】index.html 结构红线（关键 id + script 加载顺序）"
for k in $KEY_IDS; do
  if grep -q "id=\"$k\"" index.html; then :; else fail "index.html 缺 id=$k"; fi
done
[ $FAIL -eq 0 ] && pass "关键 id 全部存在（$(echo $KEY_IDS | wc -w | tr -d ' ') 个）"

# 加载顺序：按行号比对
python3 - <<'PYEOF'
import re, sys
src = open('index.html', encoding='utf-8').read()
scripts = re.findall(r'<script\s+src="js/(\w+)\.js[^"]*"', src)
want = ['constants', 'locdata', 'algorithm', 'render', 'main', 'archive']
if scripts == want:
    print('  ✅ script 加载顺序正确: ' + ' -> '.join(scripts))
else:
    print(f'  ❌ script 加载顺序错误（期望 {" -> ".join(want)}，实际 {" -> ".join(scripts) if scripts else "无"}）')
    sys.exit(1)
PYEOF
[ $? -eq 0 ] || FAIL=1

echo "【3b】main.js 对外 API 挂载区断言（防 readForm 类挂载行丢失回归）"
python3 - <<'PYEOF'
import re, sys
src = open('js/main.js', encoding='utf-8').read()
# 挂载赋值在 main.js 中全文唯一，直接全文断言
src = open('js/main.js', encoding='utf-8').read()
need = ['window.APP.readForm = readForm', 'window.APP.writeForm = writeForm',
        'window.APP.SHICHEN = SHICHEN', 'window.APP.buildEditForm = buildEditForm',
        'window.APP.readEditForm = readEditForm']
miss = [n for n in need if n not in src]
if miss:
    print('  ❌ main.js 挂载区缺失: ' + ', '.join(miss))
    sys.exit(1)
print('  ✅ main.js 挂载区完整（readForm/writeForm/SHICHEN/buildEditForm/readEditForm）')
PYEOF
[ $? -eq 0 ] || FAIL=1

echo "【4/4】引用完整性（index.html 引用的 js/css 是否存在）"
for ref in $(grep -oE '(src|href)="[^"]+\.(js|css)"' index.html | sed -E 's/^(src|href)="//; s/"$//'); do
  if [ -f "$ref" ]; then pass "引用存在: $ref"; else fail "引用缺失: $ref"; fi
done

echo "----------------------------------------"
if [ $FAIL -eq 0 ]; then
  echo "🎉 全部校验通过（版本 ${VERSION}），可以发布。"
  echo "   提醒：浏览器打开 index.html?test=1 确认 94 条断言 0 FAIL（人工红线）。"
  exit 0
else
  echo "⚠️  存在失败项，禁止发布。"
  exit 1
fi
