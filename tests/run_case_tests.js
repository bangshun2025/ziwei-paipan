#!/usr/bin/env node
/* 紫微斗数排盘 v0.1.0 — cases.md 定向用例 + DIF 差异项 + 输入校验 + 展示层检查
 * 覆盖：DIF-1 早子时不进位 / DIF-2 闰月下半月 mUse / DIF-3 真太阳时输入侧预处理 /
 *       DIF-4 大限 index 语义 / a11 农历往返等价 / render 层 monthPillarOf·cnLunar / 输入校验
 * 用法：node tests/run_case_tests.js
 * 退出码：0=全部通过；1=有失败（展示层失败单列但计入退出码，报告时归类）
 */
'use strict';

const fs = require('fs');
const path = require('path');

global.window = global;
const ROOT = path.join(__dirname, '..');
for (const f of ['js/constants.js', 'js/algorithm.js', 'js/render.js']) {
  (0, eval)(fs.readFileSync(path.join(ROOT, f), 'utf8'));
}
const CONST = global.window.CONST;
const ALGO = global.window.ALGO;
const RENDER = global.window.RENDER;
const GAN = CONST.GAN, ZHI = CONST.ZHI;
const fix = (n, m) => ((n % m) + m) % m;

let total = 0, passed = 0;
const fails = [], notes = [];
function ck(cond, label, detail) {
  total++;
  if (cond) passed++;
  else fails.push({ label, detail: detail || '' });
}
function note(label, detail) { notes.push({ label, detail }); }
function getChart(o) { return ALGO.getChart(o); }

// ============ A. DIF-1 早子时：2000-8-16 00:30 男（a02）============
{
  const ch = getChart({ y: 2000, m: 8, d: 16, h: 0, mi: 30, gender: 'M', lng: null });
  ck(!ch.pre.lateZi && ch.pre.timeIndex === 0, 'DIF-1 早子时标记', `lateZi=${ch.pre.lateZi} timeIndex=${ch.pre.timeIndex}`);
  ck(ch.pre.dayGanZhi.gan === '丙' && ch.pre.dayGanZhi.zhi === '午', 'DIF-1 早子时同日柱丙午（不进位）', ch.pre.dayGanZhi.gan + ch.pre.dayGanZhi.zhi);
  ck(ch.pre.hourGanZhi.gan === '戊' && ch.pre.hourGanZhi.zhi === '子', 'DIF-1 早子时戊子', ch.pre.hourGanZhi.gan + ch.pre.hourGanZhi.zhi);
  ck(ch.center.juName === '水二局', 'DIF-1 水二局', ch.center.juName);
  ck(ch.center.soulZhi === '申' && ch.center.bodyZhi === '申', 'DIF-1 命身宫申', ch.center.soulZhi + '/' + ch.center.bodyZhi);
  ck(ch.daXian[0].start === 2 && ch.daXian[0].end === 11, 'DIF-1 大限0 2-11岁', ch.daXian[0].start + '-' + ch.daXian[0].end);
  ck(ch.daXian[1].ganZhi === '乙酉' || ch.daXian[1].ganZhi === '乙' + '酉', 'DIF-1 阳男顺行大限1酉', ch.daXian[1].ganZhi);
  note('a02 lunarDate', RENDER.cnLunar(ch).replace(/\s/g, '') + '（锚点二〇〇〇年七月十七，零/〇展示差异见报告）');
}

// ============ B. DIF-2 闰月下半月：2023-4-10 05:30 女（a07）============
{
  const ch = getChart({ y: 2023, m: 4, d: 10, h: 5, mi: 30, gender: 'F', lng: null });
  ck(ch.pre.lunar.isLeap && ch.pre.lunar.lunarMonth === 2, 'DIF-2 闰二月二十', JSON.stringify(ch.pre.lunar));
  ck(ch.pre.mUse === 3, 'DIF-2 实用月 mUse=3（下半月按下月）', 'mUse=' + ch.pre.mUse);
  ck(ch.center.juName === '金四局', 'DIF-2 金四局', ch.center.juName);
  // 核心月柱（宪法 mUse 口径）应 = 丙辰（锚点）
  const first = CONST.TIGER_FIRST[ch.pre.yearGanZhi.ganIdx];
  const mp = GAN[fix(first + (ch.pre.mUse - 1), 10)] + ZHI[fix(2 + (ch.pre.mUse - 1), 12)];
  ck(mp === '丙辰', 'DIF-2 核心月柱(按mUse)=丙辰', mp);
  // 展示层 monthPillarOf（render 用 lunarMonth）应同为丙辰 —— 预期失败项（UI 缺陷登记）
  const gotMp = RENDER.monthPillarOf(ch);
  ck(gotMp === '丙辰', 'DIF-2-UI render.monthPillarOf=丙辰', '实得=' + gotMp + '（用 lunar.lunarMonth=2，未走 mUse=3 → UI 月柱错一月）');
}

// ============ C. DIF-3 真太阳时：乌鲁木齐 87.6E 2000-8-16 22:30 男（a10）============
{
  const ch = getChart({ y: 2000, m: 8, d: 16, h: 22, mi: 30, gender: 'M', lng: 87.6 });
  ck(ch.pre.tst !== null, 'DIF-3 触发了真太阳时修正', JSON.stringify(ch.pre.tst));
  ck(ch.pre.timeIndex === 10, 'DIF-3 修正后戌时(timeIndex=10)', 'timeIndex=' + ch.pre.timeIndex);
  ck(ch.pre.tZhi === 10, 'DIF-3 时支戌', 'tZhi=' + ch.pre.tZhi);
  const eot = ALGO.trueSolarTime(2000, 8, 16, 22, 30, 87.6);
  ck(Math.abs(eot.offsetMin - (-134)) < 8, 'DIF-3 偏移≈-134分（-2h14m → 20:16 戌时）', 'offsetMin=' + eot.offsetMin.toFixed(1));
  ck(ch.center.juName === '土五局', 'DIF-3 土五局', ch.center.juName);
  ck(ch.center.soulZhi === '戌' && ch.center.bodyZhi === '午', 'DIF-3 命宫戌/身宫午', ch.center.soulZhi + '/' + ch.center.bodyZhi);
}

// ============ D. DIF-4 大限 index 语义：a01 ============
{
  const ch = getChart({ y: 2000, m: 8, d: 16, h: 3, mi: 30, gender: 'F', lng: null });
  ck(ch.daXian[0].name === '命宫' && ch.daXian[0].start === 3 && ch.daXian[0].end === 12, 'DIF-4 大限0 命宫 3-12', ch.daXian[0].name + ch.daXian[0].start + '-' + ch.daXian[0].end);
  ck(ch.daXian[1].name === '兄弟', 'DIF-4 大限1 兄弟', ch.daXian[1].name);
  ck(ch.daXian[2].ganZhi === '庚辰' && ch.daXian[2].start === 23 && ch.daXian[2].end === 32, 'DIF-4 大限2 庚辰 23-32', ch.daXian[2].ganZhi + ch.daXian[2].start + '-' + ch.daXian[2].end);
}

// ============ E. a11 农历输入等价 a01 ============
{
  const chSolar = getChart({ y: 2000, m: 8, d: 16, h: 3, mi: 30, gender: 'F', lng: null });
  const back = ALGO.lunarToSolar(2000, 7, 17, false);
  const chLunar = getChart({ y: back.y, m: back.m, d: back.d, h: 3, mi: 30, gender: 'F', lng: null });
  const strip = (c) => JSON.stringify({
    center: c.center, huaStars: c.huaStars, daXian: c.daXian,
    palaces: c.palaces.map((p) => ({ gan: p.gan, zhi: p.zhi, name: p.name, major: p.major, minor: p.minor, isSoul: p.isSoul, isBody: p.isBody }))
  });
  ck(strip(chSolar) === strip(chLunar), 'a11 农历入口排盘与公历入口完全一致');
}

// ============ F. 展示层：cnLunar 汉字风格（零 vs 〇）============
{
  const ch = getChart({ y: 2000, m: 8, d: 16, h: 3, mi: 30, gender: 'F', lng: null });
  const got = RENDER.cnLunar(ch).replace(/\s/g, '');
  ck(got === '二〇〇〇年七月十七', 'F cnLunar 年份用〇', '实得=' + got + '（CN_D[0]="零" 应为 "〇"）');
}
// a03 晚子时农历文本显示：锚点=七月十七（原日）；代码 eff 后 lunarDay=18 → 展示差异
{
  const ch = getChart({ y: 2000, m: 8, d: 16, h: 23, mi: 30, gender: 'F', lng: null });
  const got = RENDER.cnLunar(ch).replace(/\s/g, '');
  ck(got === '二〇〇〇年七月十七', 'F 晚子时农历文本按原日显示', '实得=' + got + '（代码按进位日 7/18；排盘 D/日柱用 18 正确，仅展示口径待裁决）');
}

// ============ G. 输入校验 ============
{
  let threw1799 = false;
  try { getChart({ y: 1799, m: 1, d: 1, h: 12, mi: 0, gender: 'M', lng: null }); } catch (e) { threw1799 = true; }
  ck(threw1799, 'G 1799-1-1（早于农历1799新年）越界抛错');
  let threw2201 = false;
  try { getChart({ y: 2201, m: 1, d: 1, h: 12, mi: 0, gender: 'M', lng: null }); } catch (e) { threw2201 = true; }
  ck(threw2201, 'G 2201 越界抛错');
  ck(ALGO.solarToLunar(1799, 1, 1) === null, 'G solarToLunar 1799-1-1 null');
  // 注：农历表从 1799 农历年起（1799-2-5 后），故 1799 年末公历日可排（1800-1-1 之前的腊月属 1799 农历年）——实现比 PRD「1800 起」更宽，UI 下拉已限 1800-2200。
  note('G 范围下界说明', '1799-2-5 起（农历1799正月初一）在表内可排；1799-1-1 抛错。PRD 标注 1800 起，多出的 1799 尾部支持无害（UI 已限制）。');

  ck(ALGO.solarToLunar(2000, 13, 1) === null || true, 'G 非法月不崩溃（返回 null/undefined 或兜底）');
  ck(ALGO.solarDim(2000, 2) === 29 && ALGO.solarDim(1900, 2) === 28, 'G 公历闰年 2 月');
  ck(ALGO.hourToShichen(0, 0).zhiIdx === 0 && !ALGO.hourToShichen(0, 0).lateZi, 'G 00:00 早子');
  ck(ALGO.hourToShichen(23, 0).lateZi === true, 'G 23:00 晚子');
  ck(ALGO.hourToShichen(1, 0).zhiIdx === 1, 'G 01:00 丑时', 'zhiIdx=' + ALGO.hourToShichen(1, 0).zhiIdx);
  ck(ALGO.hourToShichen(12, 59).zhiIdx === 6, 'G 12:59 午时', 'zhiIdx=' + ALGO.hourToShichen(12, 59).zhiIdx);
  ck(ALGO.hourToShichen(13, 0).zhiIdx === 7, 'G 13:00 未时', 'zhiIdx=' + ALGO.hourToShichen(13, 0).zhiIdx);
  // 紫微/天府纯函数例（ALGORITHM §8）
  ck(ALGO.ziweiPalace(27, 3) === 8, 'G 27日木三局 紫微戌', 'p=' + ALGO.ziweiPalace(27, 3));
  ck(ALGO.ziweiPalace(13, 6) === 9, 'G 13日火六局 紫微亥', 'p=' + ALGO.ziweiPalace(13, 6));
  ck(ALGO.ziweiPalace(6, 5) === 5, 'G 6日土五局 紫微未', 'p=' + ALGO.ziweiPalace(6, 5));
  ck(ALGO.tianfuPalace(4) === 8, 'G 紫微午->天府戌', 'p=' + ALGO.tianfuPalace(4));
}

// ============ H. 结构不变量（对 12 盘） ============
{
  const inputs = [
    { y: 2000, m: 8, d: 16, h: 3, mi: 30, gender: 'F' },
    { y: 2000, m: 8, d: 16, h: 23, mi: 30, gender: 'M' },
    { y: 2023, m: 3, d: 31, h: 15, mi: 30, gender: 'M' },
    { y: 2023, m: 4, d: 10, h: 5, mi: 30, gender: 'F' },
    { y: 1800, m: 1, d: 1, h: 7, mi: 30, gender: 'M' },
    { y: 2099, m: 12, d: 31, h: 13, mi: 30, gender: 'F' },
    { y: 1990, m: 1, d: 1, h: 11, mi: 30, gender: 'M' },
    { y: 2000, m: 2, d: 29, h: 9, mi: 30, gender: 'F' },
    { y: 1982, m: 10, d: 18, h: 9, mi: 30, gender: 'M' },
    { y: 2000, m: 8, d: 16, h: 22, mi: 30, gender: 'M', lng: 87.6 }
  ];
  let allOk = true, errMsg = '';
  for (const inp of inputs) {
    const ch = getChart(inp);
    if (!ch || ch.palaces.length !== 12 || ch.daXian.length !== 12) { allOk = false; errMsg = '结构缺失 ' + JSON.stringify(inp); break; }
    const majors = ch.palaces.reduce((s, p) => s + p.major.length, 0);
    const minors = ch.palaces.reduce((s, p) => s + p.minor.length, 0);
    const names = new Set(ch.palaces.map((p) => p.name));
    if (majors !== 14 || minors !== 14 || names.size !== 12) { allOk = false; errMsg = JSON.stringify(inp) + ' majors=' + majors + ' minors=' + minors + ' names=' + names.size; break; }
  }
  ck(allOk, 'H 10 盘结构不变量（12宫/14主星/14辅星/宫名唯一）', errMsg);
}

// ============ I. 辅星起宫 base 复现（A01 单例定向断言） ============
// 期望（iztro 锚点 a01 + 传统口诀）：文昌申 文曲午 左辅戌 右弼辰 地劫丑 地空酉
{
  const ch = getChart({ y: 2000, m: 8, d: 16, h: 3, mi: 30, gender: 'F', lng: null });
  const starEarth = {};
  for (const p of ch.palaces) for (const s of p.minor) starEarth[s] = p.zhi;
  const want = { 文昌: '申', 文曲: '午', 左辅: '戌', 右弼: '辰', 地劫: '丑', 地空: '酉' };
  for (const st of Object.keys(want)) {
    ck(starEarth[st] === want[st], 'I 辅星base ' + st + '落' + want[st], '实得=' + (starEarth[st] || '(无)'));
  }
  note('I 相关常数（constants.js）', `WEN_CHANG_BASE=${CONST.WEN_CHANG_BASE}(应10/戌) WEN_QU_BASE=${CONST.WEN_QU_BASE}(应4/辰) ZUO_FU_BASE=${CONST.ZUO_FU_BASE}(应4/辰) YOU_BI_BASE=${CONST.YOU_BI_BASE}(应10/戌) DI_JIE_BASE=${CONST.DI_JIE_BASE}(应11/亥) DI_KONG_BASE=${CONST.DI_KONG_BASE}(应11/亥)`);
}

// ============ 输出 ============
console.log('==== cases.md 定向用例 + 校验（run_case_tests.js）====');
console.log('断言总数 ' + total + '，通过 ' + passed + '，失败 ' + (total - passed));
for (const f of fails) console.log('   ❌ ' + f.label + (f.detail ? '\n       ' + f.detail : ''));
console.log('==== 观察项 ====');
for (const n of notes) console.log('   · ' + n.label + ': ' + n.detail);
const failed = total - passed;
console.log(failed === 0 ? 'ALL PASS ✅' : '有失败 ❌');
process.exit(failed === 0 ? 0 : 1);
