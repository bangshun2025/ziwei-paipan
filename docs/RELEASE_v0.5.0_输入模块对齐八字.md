# RELEASE v0.5.0 · 输入模块完全仿照八字排盘

- 日期：2026-09-06
- 类型：内测版（本地运行 + 侧栏扩展部署；origin/GitHub Pages 推送待授权）
- 状态：✅ 实现完成 · 验证通过 · 扩展部署完毕

## 一、需求背景

邦顺指正：紫微排盘输入模块与八字排盘不一致，要求完全对齐八字输入：名字（小名、艺名、姓名）、性别、新农历生日、AI 输入、真太阳时、档案、隐私功能。
对照八字 bazi-paipan 勘察后，紫微 v0.4.0 已具备：性别 M/F、公历/农历+闰月、时辰 chips（含早晚子时）、省市区三级、真太阳时、档案、回收站、搜索。缺口三项：**小名/艺名、AI 自然语言录入、隐私脱敏**。双胞（老二）因紫微单盘语义无关且用户清单未含，明确排除。

## 二、本次变更

| 文件 | 变更 |
|------|------|
| index.html | 名字行三输入 inNickname/inYiming/inName；form-actions 加 btnPrivacy + btnAi；档案面板头加 btnPrivacy2；新增 aiMask AI 录入弹窗；版本 v0.5.0、缓存参数 v=502 |
| js/aiinput.js（新） | AIINPUT.parse：八字同构移植 + 紫微增强（时辰词直读/早晚子时、闰月「(闰)?月」、SHICHEN 折算） |
| js/main.js | 三名字段入 state/readForm/writeForm/editForm；doCalc 传 person；AI 交互（预览/应用/切历法/闰月/省市区/折算时辰联动）；**phSel 占位修复 4 处**（AI apply、writeForm、eSyncPlace、eSyncCity） |
| js/archive.js | PRIVACY_KEY=zw_privacy_v1 默认开；getDisplayName 降级链（艺名→小名→匿名）/关态「小名 / 正名」；cardHTML/toast/结果头全链路脱敏；搜索含 nickname/yiming |
| js/render.js | renderHead 加第三参 person → 结果头 person-line（显示名 · 性别） |
| js/constants.js | VERSION v0.5.0（同 css/style.css、全部 js 头注释） |
| api/handler.rb | STATIC 注册 /js/aiinput.js |
| ext.yml | version 0.5.0 |
| launcher view.js | 紫微本地卡 subtitle「本地版 v0.5.0」 |

### 口径对齐说明
- 隐私口径 = 八字：开启显示降级链 艺名→小名→匿名；关闭显示「小名 / 正名」；真名仅在本地档案搜索/编辑可见
- AI 解析失败不阻断：预览区红字提示，apply 校验失败 toast
- 出生地缺项（未输市/区县）一律「— 未填 —」占位，杜绝默认第一项假数据（顺带修复 v0.4.0 存量：未选区县档案载入后误显第一区）

## 三、验证结果

1. **?test=1 自检**：94/94 ALL PASS
2. **CDP 浏览器实测 8 组 PASS，console 零异常**：
   - person-line 隐私开「阿顺 · 男」（姓名不泄露）；切关「阿顺 / 邦顺 · 男」+ 按钮 🔓
   - AI 案例1「邦顺 男 1982年10月18日早上5点 广西南宁」→ 公历 1982/10/18 · M · 卯时折算 · 广西/南宁市（区县占位，无假数据）
   - AI 案例2「小雅 女 1986年7月26 农历 午时 北京朝阳区」→ lunar · 1986/7/26 · 午时 chip 高亮 · 北京市/北京市/朝阳区；person「匿名 · 女」（降级链到底）
   - 无市无区「阿华 … 广东」→ 省+「— 未填 —」占位 + fDist 禁用；保存/刷新持久/载入回填占位正确
   - 档案：保存→卡片脱敏「匿名」→载入回填（历法/日期/省市/时辰 chip 全对）→编辑弹窗三名字段 + 省市回填；隐私关卡片显示真名
3. **curl 资源回归**：standalone/js×7/css 全 200，页面含 v0.5.0×4 + v=502 + aiinput.js
4. **clacky ext verify**：ziwei-paipan (api) [OK]、bazi-paipan/launcher [OK]

## 四、遗留与授权项

- origin/main 仍停 4b3e05a（v0.2.1）：v0.3.0/v0.4.0/v0.5.0 三轮内测均待邦顺授权推送
- GitHub Pages 线上卡（ziwei-online）实际运行 v0.2.0 旧版，正式发布待授权
- 双胞（老二）输入项：紫微单盘语义无意义，如后续需要出生顺序功能另立需求
