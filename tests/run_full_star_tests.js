#!/usr/bin/env node
/* 紫微斗数排盘 v0.2.1 — 满盘档（杂曜/长生12/博士12/将前12/岁前12）对照测试
 * 基准：/tmp/refz/stars_ref.json（iztro@2.5.8 + lunar-lite 实测 6 案例，生成见会话记录 gen_ref.js）
 * 口径：iztro.config({yearDivide:'spring', horoscopeDivide:'spring'}) 对齐 v0.2.0 宪法立春换年；
 *       命宫/身宫按农历月（iztro）与按节气月（v0.2.0 宪法）在跨节案例(c2/c3)会有 1 宫差，
 *       该差仅影响命宫锚定星：天才/天寿/天伤/天使/三台/八座（左辅右弼日系随之平移）。
 *       故 c2/c3 对锚定组做「允许 ±1 宫」断言，其余星严格断言。
 * 用法：node tests/run_full_star_tests.js
 * 退出码：0=通过 1=失败
 */
'use strict';
const fs = require('fs');
const path = require('path');

global.window = global;
const ROOT = path.join(__dirname, '..');
for (const f of ['js/constants.js', 'js/algorithm.js']) {
  (0, eval)(fs.readFileSync(path.join(ROOT, f), 'utf8'));
}
const ALGO = global.window.ALGO;
const ZHI = global.window.CONST.ZHI;

// ---------- 案例定义：timeIndex 同 iztro bySolar（0早子~12晚子），转 h:mi ----------
const TIME = [[0,30],[2,30],[4,30],[6,30],[8,30],[10,30],[12,30],[14,30],[16,30],[18,30],[20,30],[22,30],[23,30]];
const CASES = {
  c1: { y:1982, m:10, d:18, ti:3, g:'M' }, c2: { y:1985, m:6, d:15, ti:1, g:'F' },
  c3: { y:1990, m:1, d:1, ti:12, g:'M' }, c4: { y:1975, m:12, d:8, ti:5, g:'F' },
  c5: { y:2000, m:2, d:8, ti:7, g:'M' }, c6: { y:1966, m:8, d:20, ti:9, g:'F' },
};
const ANCHOR_STARS = ['天才','天寿','天伤','天使','三台','八座'];
const LOOSE = { c2: true, c3: true };

const refFile = process.env.ZW_STARS_REF || '/tmp/refz/stars_ref.json';
const ref = JSON.parse(fs.readFileSync(refFile, 'utf8'));
let failAll = 0;

function ebDist(a, b) { const d = Math.abs(((a - b) + 12) % 12); return Math.min(d, 12 - d); }

for (const key of Object.keys(ref)) {
  const c = CASES[key];
  const ch = ALGO.getChart({ y:c.y, m:c.m, d:c.d, h:TIME[c.ti][0], mi:TIME[c.ti][1], gender:c.g });
  // 我方：星 -> eb
  const gotMap = {};
  for (const p of ch.palaces) for (const s of p.adjStars) gotMap[s] = p.zhiIdx;
  // 期望：星 -> eb
  const expMap = {};
  for (let eb = 0; eb < 12; eb++) for (const s of ref[key][String(eb)].adj || []) expMap[s] = eb;
  const loose = LOOSE[key];
  let fail = 0;
  for (const s of Object.keys(expMap)) {
    if (!(s in gotMap)) { fail++; failAll++; console.log(`[${key}] ${s} 期望在${ZHI[expMap[s]]}，我方无`); continue; }
    const d = ebDist(gotMap[s], expMap[s]);
    if (d > (loose && ANCHOR_STARS.includes(s) ? 1 : 0)) {
      fail++; failAll++; console.log(`[${key}] ${s} 我方${ZHI[gotMap[s]]} vs 期望${ZHI[expMap[s]]}`);
    }
  }
  for (const s of Object.keys(gotMap)) {
    if (!(s in expMap)) {
      // loose 案例允许锚定星在期望侧缺失（口径平移边界）
      if (loose && ANCHOR_STARS.includes(s)) continue;
      fail++; failAll++; console.log(`[${key}] ${s} 我方多（在${ZHI[gotMap[s]]}）`);
    }
  }
  console.log(`[${key}] ${fail === 0 ? 'OK' : fail + ' 处差异'}`);
}
console.log(failAll === 0 ? 'ALL PASS' : `FAIL total=${failAll}`);
process.exit(failAll === 0 ? 0 : 1);
