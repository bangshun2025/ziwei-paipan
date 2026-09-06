# RELEASE v0.4.0 — 侧栏「生命排盘」扩展部署报告

> 2026-09-06 · 发布范围：本地 Clacky 扩展层（非对外公网）
> 触发任务：「将本地版本加到左边栏的生命排盘中」

## 1. 版本号

- 扩展：`~/.clacky/ext/local/ziwei-paipan`：**v0.2.0 → 0.4.0**（SemVer MINOR ×2 跳级：补齐本地 v0.2.1~v0.4.0 的累计演进；按 schema 规范去 `v` 前缀，`clacky ext verify` schema ERR 消除）
- 代码同步自紫微真相源 `紫微斗数·运行/`（git main @ a1411c5，v0.4.0 收口）

## 2. 变更清单

- 前端全量同步 v0.4.0：`index.html`、`css/style.css`、`js/` 6 模块（新增 **locdata.js**（34省/309市三级联动数据）、**archive.js**（本地档案 CRUD/搜索/回收站））
- `api/handler.rb`：STATIC 路由补 `/js/locdata.js`、`/js/archive.js` 两条（否则 standalone 页面 404）；头部注释与根端点文案同步 v0.4.0
- `ext.yml`：description 更新（档案与出生地输入 v0.4.0）、version `"v0.2.0"` → `"0.4.0"`
- `CHANGELOG.md`：从真相源全量同步（补齐 v0.2.1 / v0.2.2 / v0.2.3-ref / v0.3.0-ref / v0.4.0 条目）
- 生命排盘启动器 `bazi-paipan/panels/launcher/view.js`：紫微卡片 subtitle 「节气口径 v0.2.0」→「档案与出生地输入 v0.4.0」，desc 补档案/联动/真太阳时要点

## 3. 验证结果

| 项 | 结果 |
|----|------|
| `clacky ext verify` | ziwei-paipan (api) **[OK]**；bazi-paipan launcher/paipan/api **[OK]**（schema.invalid_version 仅剩存量 bazi/qimen 4 项，与本版无关） |
| standalone 路由 | `GET /api/ext/ziwei-paipan/standalone` → **200** |
| 新静态路由 | `/js/archive.js` → 200；`/js/locdata.js` → 200 |
| 页面内容抽查 | standalone HTML 含 `v0.4.0` / `#inName` / `#liveSolar` / 档案面板；main.js 含 readForm 挂载 3 处（v0.4.0 特征） |
| 热加载 | dispatcher 按 mtime 热重载，**server 未重启**，改动即时生效 |

## 4. 如何启用

1. Clacky 左侧栏点「生命排盘」→ 点「紫微斗数排盘」卡片（或直接访问 `http://localhost:7070/api/ext/ziwei-paipan/standalone`）
2. 页面即本地 v0.4.0：姓名行置顶、出生地省市区三级联动、实时真太阳时显示、📋档案面板可用
3. 若面板缓存旧版，刷新侧栏/浏览器一次即可

## 5. 备份与回滚

- 升级前完整备份：`/tmp/ziwei-ext-bak-v020/`（v0.2.0 全量）
- 回滚 = 将备份内容拷回 `~/.clacky/ext/local/ziwei-paipan/`（handler STATIC 恢复 5 条、ext.yml 回 v0.2.0）

## 6. 备注

- ziwei-paipan 目录内 git 为空壳仓库（master 无 commit，历史遗留），未改动其 git 状态
- bazi-paipan 仓库工作树中 launcher 原有未提交改动（生命排盘改名+奇门/紫微卡片加入）与本版共存，未代提交；其中紫微卡片文案更新包含在本报告变更清单内
