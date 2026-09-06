# RETRO v0.4.0 档案与出生地输入（复盘）

> 日期：2026-09-06（周日） · 版本：v0.4.0（commit fa686a6） · 基线：v0.3.0-ref（66c7f4c）
> 模式：借鉴八字排盘档案体系 → 紫微斗数独立实现（开发-流水线-紫微）

## 一、结果

| 维度 | 状态 |
|---|---|
| 功能交付 | ✅ 姓名输入 / 📋档案面板（保存/载入排盘/编辑/删除/回收站/还原/清空/搜索，上限 200）/ 出生地省市区三级联动（34 省 309 市）/ 实时真太阳时显示 / 自定义经度 |
| 质量门 | ✅ 自检 94 断言 0 FAIL；check-release.sh 全绿（28 关键 id / 6 JS 加载序 / 引用完整）；CDP 浏览器 9 项功能验证全 PASS |
| 改动规模 | 13 文件 +1440/-66；新增 js/locdata.js（27.7K）、js/archive.js（279 行） |
| 版本线 | constants/algorithm/render/main/style/locdata/archive 同步 v0.4.0；CHANGELOG/SYSTEM/check-release 同步 |
| 发布 | 本地 main fa686a6 + tag v0.4.0（origin push 待用户授权） |

## 二、验证期发现并修复的缺陷（3 个）

### D1 表单模块未就绪——readForm 挂载行丢失（P1，保存功能全挂）
- 现象：档案保存静默失败，toast「表单模块未就绪」；readForm=undefined 而 SHICHEN=object
- 根因：initApp 尾部 `window.APP.readForm = readForm;` 挂载行在编辑某次替换时丢失；node --check 语法过、自检 94 全绿（runTests 不依赖 DOM 挂载），唯独浏览器运行时缺失
- 教训：**模块对外 API 挂载点缺失，静态校验与单元自检都测不到——只有浏览器级功能验证（调用真实 API）能抓住**。挂载区代码建议纳入静态断言（check-release 检查 window.APP 关键方法字符串）
- 修复：补回挂载行

### D2 选省后区县永不出现（P2，联动 UX）
- 现象：北京市（单市省份）选省后 fDist 空且 disabled；市已默认选中第一项但不触发 change → 区县永远出不来
- 根因：fProv change 里 `fillDist('')` 硬编码清空；select 默认第一项不派发 change
- 教训：**「默认选中第一项」不等于「用户已选择」——依赖 change 事件的联动必须考虑默认项路径**；单市省份是盲区
- 修复：省 change 后按当前市直接 fillDist

### D3 空姓名档案搜「未命名」不命中（P3，一致性）
- 现象：卡片显示名有 `name||'未命名'` 兜底，但搜索源用原始空 name
- 根因：显示层兜底与搜索层不一致（显示文案与匹配串分叉）
- 教训：兜底文案凡是「显示用」就要「搜索/导出同源」
- 修复：filterBy 匹配串同样兜底

## 三、流程与做法复盘

### 做得好的
1. **验证脚本分层**：先 ?test=1 自检 94 全绿建立信心，再做 CDP 9 项真实交互——这次自检全绿仍漏 3 个 DOM 缺陷，证明两步缺一不可
2. **单线程 CDP recv**：吸取教训后 send 内顺带收集 console/exception，避免双线程抢消息死等
3. **debug3 一次性抓全证据**：main.js src/缓存戳/APP keys/boot 源码/initApp 尾部 toString——「读运行时源码」直接定位 D1 根因（磁盘文件与运行时对照）
4. 基线先行（v0.3.0-ref 收口）再开 v0.4.0，问题定位时 git diff 边界清晰

### 下次改进
1. main.js 挂载区（window.APP.xxx = ...）追加 check-release 静态断言清单（防止 D1 类回归）
2. 联动类 UI 验证补「默认值路径」用例（选省不换市直接看区县）
3. 编辑大函数时避免整段 old_string 替换，改用小步 insert（D1 丢失即整段替换误伤）

## 四、遗留与建议
- origin/main 仍停 4b3e05a（v0.2.1）；本地 main 领先 5 个版本——需用户授权后 push + tag 推送
- VERSION 内部技术债（constants VERSION 与 CHANGELOG 双轨）未动，留待 v0.5.0
- 云端档案同步、隐私导出仍为边界外（PRD 已声明）
