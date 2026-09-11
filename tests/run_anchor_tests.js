#!/usr/bin/env node
/* 紫微斗数排盘 — 锚点全字段回归脚本
 * 基准：tests/anchors/a01-a12.json（iztro@2.6.0 实测；2026-09-11 v0.2.0 口径重录：
 *       a04/a08 全字段重算（立春换年/节气月轴，详见 docs/ANCHOR_RERECORD_v0.2.0.md）；
 *       a09 改边界保护期望（2200 超节气表 1000–2100 → 显式报错））
 * 方式：模拟 window 加载 js/constants.js + js/algorithm.js + js/render.js，
 *       对每个锚点构造输入调 ALGO.getChart，做全字段比对。
 * 用法：node tests/run_anchor_tests.js [a01|a02|...|all]
 * 退出码：0=全部通过；1=有失败
 */
'use strict';

const fs = require('fs');
const path = require('path');

// ---------- 加载浏览器 IIFE 模块（模拟 window） ----------
global.window = global;
const ROOT = path.join(__dirname, '..');
for (const f of ['js/constants.js', 'js/algorithm.js', 'js/render.js']) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  (0, eval)(src);
}
const CONST = global.window.CONST;
const ALGO = global.window.ALGO;
const RENDER = global.window.RENDER;

const GAN = CONST.GAN, ZHI = CONST.ZHI;
const fix = (n, m) => ((n % m) + m) % m;

// ---------- 时辰表（与 main.js SHICHEN / hourToShichen 同口径） ----------
const SHICHEN = [
  { t: 0, h: 0, mi: 30, name: '早子时', range: '00:00~01:00' },
  { t: 1, h: 1, mi: 30, name: '丑时', range: '01:00~03:00' },
  { t: 2, h: 3, mi: 30, name: '寅时', range: '03:00~05:00' },
  { t: 3, h: 5, mi: 30, name: '卯时', range: '05:00~07:00' },
  { t: 4, h: 7, mi: 30, name: '辰时', range: '07:00~09:00' },
  { t: 5, h: 9, mi: 30, name: '巳时', range: '09:00~11:00' },
  { t: 6, h: 11, mi: 30, name: '午时', range: '11:00~13:00' },
  { t: 7, h: 13, mi: 30, name: '未时', range: '13:00~15:00' },
  { t: 8, h: 15, mi: 30, name: '申时', range: '15:00~17:00' },
  { t: 9, h: 17, mi: 30, name: '酉时', range: '17:00~19:00' },
  { t: 10, h: 19, mi: 30, name: '戌时', range: '19:00~21:00' },
  { t: 11, h: 21, mi: 30, name: '亥时', range: '21:00~23:00' },
  { t: 12, h: 23, mi: 30, name: '晚子时', range: '23:00~24:00' }
];
const SHI_BY_T = {};
for (const s of SHICHEN) SHI_BY_T[s.t] = s;

// ---------- 断言收集器 ----------
function makeRunner(caseName) {
  let total = 0, passed = 0;
  const fails = [];
  const notes = [];
  return {
    check(cond, label, detail) {
      total++;
      if (cond) passed++;
      else fails.push({ case: caseName, label, detail: detail || '' });
    },
    note(label, detail) { notes.push({ case: caseName, label, detail: detail || '' }); },
    summary() { return { total, passed, failed: total - passed, fails, notes }; }
  };
}

function setEq(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort(), sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

// ---------- 从锚点输入构造 getChart 参数 ----------
function buildInput(inp) {
  const inp0 = inp;
  let y, m, d, fromLunar = false;
  if (inp.solarDate) {
    const mm = /^(\d+)-(\d+)-(\d+)$/.exec(inp.solarDate.trim());
    if (!mm) throw new Error('bad solarDate ' + inp.solarDate);
    y = +mm[1]; m = +mm[2]; d = +mm[3];
  } else if (inp.lunarDate) {
    const mm = /^(\d+)-(\d+)-(\d+)$/.exec(inp.lunarDate.trim());
    if (!mm) throw new Error('bad lunarDate ' + inp.lunarDate);
    const back = ALGO.lunarToSolar(+mm[1], +mm[2], +mm[3], !!inp.isLeap);
    if (!back) throw new Error('lunarToSolar failed for ' + inp.lunarDate);
    y = back.y; m = back.m; d = back.d; fromLunar = true;
  } else {
    throw new Error('no date in input');
  }

  // 时间：a10 类真太阳时用例优先 clockTime + 经度（排盘内核做修正）
  let h, mi, lng = null;
  if (inp.clockTime) {
    const cm = /^(\d+):(\d+)$/.exec(inp.clockTime.trim());
    if (!cm) throw new Error('bad clockTime ' + inp.clockTime);
    h = +cm[1]; mi = +cm[2];
    if (inp.birthplace) {
      const lm = /([\d.]+)\s*E/i.exec(inp.birthplace);
      if (lm) lng = parseFloat(lm[1]);
    }
  } else if (typeof inp.timeIndex === 'number') {
    const sc = SHI_BY_T[inp.timeIndex];
    if (!sc) throw new Error('bad timeIndex ' + inp.timeIndex);
    h = sc.h; mi = sc.mi;
  } else {
    throw new Error('no time in input');
  }

  const gender = inp.gender === 'female' || inp.gender === 'F' ? 'F' : (inp.gender === 'male' || inp.gender === 'M' ? 'M' : inp.gender);
  return { y, m, d, h, mi, gender, lng, fromLunar, timeIndex: typeof inp.timeIndex === 'number' ? inp.timeIndex : null };
}

function chartTimeName(chart) {
  const pre = chart.pre;
  if (pre.lateZi) return '晚子时';
  if (pre.timeIndex === 0) return '早子时';
  return ZHI[pre.tZhi] + '时';
}
function rangeOf(chart) {
  const pre = chart.pre;
  if (pre.lateZi) return '23:00~00:00'; // 对齐锚点/iztro 记法
  if (pre.timeIndex === 0) return '00:00~01:00';
  const t = pre.tZhi;
  const st = ((t * 2 - 1) + 24) % 24, en = (t * 2 + 1) % 24;
  const p2 = (n) => String(n).padStart(2, '0');
  return p2(st) + ':00~' + p2(en) + ':00';
}

// 宪法口径月柱（用实用月 mUse；ALGORITHM §3 五虎遁）
function monthPillarByMuse(chart) {
  const ygz = chart.pre.yearGanZhi;
  const mUse = chart.pre.mUse;
  const first = CONST.TIGER_FIRST[ygz.ganIdx];
  const ganIdx = fix(first + (mUse - 1), 10);
  const zhiIdx = fix(2 + (mUse - 1), 12);
  return GAN[ganIdx] + ZHI[zhiIdx];
}

function palacesByZhi(chart) {
  const map = {};
  for (const p of chart.palaces) map[p.zhi] = p;
  return map;
}
function daXianByPalaceIndex(chart) {
  const map = {};
  for (const dx of chart.daXian) map[dx.palaceIndex] = dx;
  return map;
}
function zhIndex(earth) { return CONST.ZHI_IDX[earth]; }
function palaceIndexOfEarth(earth) { return fix(zhIndex(earth) - 2, 12); }

// ---------- 单个锚点比对 ----------
function assertAnchor(anchor, T) {
  const inp = anchor.input || {};
  const as = anchor.assert || {};
  const chart = ALGO.getChart(buildInput(inp));
  const pre = chart.pre;
  const cen = chart.center;

  // 顶层
  T.check(as.gender === undefined || (as.gender === '女' && inp.gender === 'female') || (as.gender === '男' && inp.gender === 'male'),
    'gender', `期望=${as.gender} 输入=${inp.gender}`);
  const solarStr = `${pre.solar.y}-${pre.solar.m}-${pre.solar.d}`;
  T.check(as.solarDate === undefined || as.solarDate === solarStr, 'solarDate', `期望=${as.solarDate} 实得=${solarStr}`);
  if (as.lunarDate !== undefined) {
    const got = RENDER.cnLunar(chart).replace(/\s/g, '');
    T.check(got === as.lunarDate, 'lunarDate', `期望=${as.lunarDate} 实得=${got}`);
  }
  if (as.chineseDate !== undefined) {
    const ygz = pre.yearGanZhi.gan + pre.yearGanZhi.zhi;
    const mgz = monthPillarByMuse(chart);
    const dgz = pre.dayGanZhi.gan + pre.dayGanZhi.zhi;
    const hgz = pre.hourGanZhi.gan + pre.hourGanZhi.zhi;
    const got = `${ygz} ${mgz} ${dgz} ${hgz}`;
    T.check(got === as.chineseDate, 'chineseDate', `期望=${as.chineseDate} 实得=${got}`);
  }
  if (as.time !== undefined) {
    const want = as.time.replace(/（.*?）|\(.*?\)/g, '');
    const got = chartTimeName(chart);
    T.check(want === got, 'time', `期望=${as.time} 实得=${got}`);
  }
  if (as.timeRange !== undefined) {
    const got = rangeOf(chart);
    T.check(as.timeRange === got, 'timeRange', `期望=${as.timeRange} 实得=${got}`);
  }
  T.check(as.fiveElementsClass === undefined || as.fiveElementsClass === cen.juName, 'fiveElementsClass', `期望=${as.fiveElementsClass} 实得=${cen.juName}`);
  T.check(as.soulEarth === undefined || as.soulEarth === cen.soulZhi, 'soulEarth', `期望=${as.soulEarth} 实得=${cen.soulZhi}`);
  T.check(as.bodyEarth === undefined || as.bodyEarth === cen.bodyZhi, 'bodyEarth', `期望=${as.bodyEarth} 实得=${cen.bodyZhi}`);
  T.check(as.soulStar === undefined || as.soulStar === cen.mingZhu, 'soulStar', `期望=${as.soulStar} 实得=${cen.mingZhu}`);
  T.check(as.bodyStar === undefined || as.bodyStar === cen.shenZhu, 'bodyStar', `期望=${as.bodyStar} 实得=${cen.shenZhu}`);
  const ziweiEarth = ZHI[fix(cen.ziweiIndex + 2, 12)];
  T.check(as.ziweiEarth === undefined || as.ziweiEarth === ziweiEarth, 'ziweiEarth', `期望=${as.ziweiEarth} 实得=${ziweiEarth}`);

  // 十二宫
  const pz = palacesByZhi(chart);
  const dxMap = daXianByPalaceIndex(chart);
  for (const earth of Object.keys(as.palaces || {})) {
    const want = as.palaces[earth];
    const gotP = pz[earth];
    if (!gotP) { T.check(false, `palace[${earth}]存在`, 'chart 无此宫'); continue; }
    T.check(want.stem === undefined || want.stem === gotP.gan, `palace[${earth}].stem`, `期望=${want.stem} 实得=${gotP.gan}`);
    T.check(want.name === undefined || want.name === gotP.name, `palace[${earth}].name`, `期望=${want.name} 实得=${gotP.name}`);

    // major（name+mutagen 集合）
    const gotMaj = gotP.major.map((s) => s.name + (s.hua || ''));
    const wantMaj = (want.major || []).map((s) => s.name + (s.mutagen || ''));
    if (!setEq(gotMaj, wantMaj)) {
      T.check(false, `palace[${earth}].major`, `期望=[${wantMaj.join(',')}] 实得=[${gotMaj.join(',')}]`);
    } else {
      T.check(true, `palace[${earth}].major`);
      // 顺序观察（不判失败）
      if (gotMaj.join() !== wantMaj.join()) T.note(`palace[${earth}].major顺序`, `期望=[${wantMaj.join(',')}] 实得=[${gotMaj.join(',')}]`);
    }

    // minor（集合）
    const gotMin = (gotP.minor || []).slice();
    const wantMin = (want.minor || []).map((s) => (typeof s === 'string' ? s : s.name));
    if (!setEq(gotMin, wantMin)) {
      T.check(false, `palace[${earth}].minor`, `期望=[${wantMin.join(',')}] 实得=[${gotMin.join(',')}]`);
    } else {
      T.check(true, `palace[${earth}].minor`);
      if (gotMin.join() !== wantMin.join()) T.note(`palace[${earth}].minor顺序`, `期望=[${wantMin.join(',')}] 实得=[${gotMin.join(',')}]`);
    }

    // decadal（大限挂宫）
    const dwant = want.decadal;
    if (dwant) {
      const dx = dxMap[palaceIndexOfEarth(earth)];
      if (!dx) {
        T.check(false, `palace[${earth}].decadal`, 'chart 无此宫大限');
      } else {
        const dr = [dx.start, dx.end];
        const dstem = dx.ganZhi.charAt(0), dearth = dx.ganZhi.charAt(1);
        T.check(JSON.stringify(dr) === JSON.stringify(dwant.range), `palace[${earth}].decadal.range`, `期望=[${dwant.range}] 实得=[${dr}]`);
        T.check(dstem === dwant.stem, `palace[${earth}].decadal.stem`, `期望=${dwant.stem} 实得=${dstem}`);
        T.check(dearth === dwant.earth, `palace[${earth}].decadal.earth`, `期望=${dwant.earth} 实得=${dearth}`);
      }
    }
  }

  // mutagenMap（以锚点列为基准）
  if (as.mutagenMap) {
    const huaByStar = {};
    for (const hs of chart.huaStars) {
      if (hs.palaceIndex === null || hs.palaceIndex === undefined) continue;
      huaByStar[hs.star] = { earth: ZHI[fix(hs.palaceIndex + 2, 12)], mutagen: hs.hua };
    }
    for (const star of Object.keys(as.mutagenMap)) {
      const want = as.mutagenMap[star];
      const got = huaByStar[star];
      if (!got) {
        T.check(false, `mutagenMap[${star}]`, `chart 未找到该星四化`);
      } else {
        T.check(got.mutagen === want.mutagen, `mutagenMap[${star}].mutagen`, `期望=${want.mutagen} 实得=${got.mutagen}`);
        T.check(got.earth === want.earth, `mutagenMap[${star}].earth`, `期望=${want.earth} 实得=${got.earth}`);
      }
    }
    // chart 侧额外四化星（如辅星四化）只记观察
    for (const star of Object.keys(huaByStar)) {
      if (!as.mutagenMap[star]) T.note('mutagenMap 额外星', `${star}${huaByStar[star].mutagen}@${huaByStar[star].earth}（锚点未登记）`);
    }
  }
}

// ---------- 主流程 ----------
const only = process.argv[2] || 'all';
const anchorFiles = [];
for (let i = 1; i <= 12; i++) {
  const id = 'a' + (i < 10 ? '0' : '') + i;
  if (only === 'all' || only === id) anchorFiles.push({ id, file: path.join(__dirname, 'anchors', id + '.json') });
}

let ALL = { total: 0, passed: 0, failed: 0, cases: [], notes: [] };
for (const { id, file } of anchorFiles) {
  const anchor = JSON.parse(fs.readFileSync(file, 'utf8'));
  const T = makeRunner(id);
  if (anchor.assert && anchor.assert.expectError) {
    // 边界保护型锚点：期望显式抛错（如超节气表范围），而非静默算错
    try {
      ALGO.getChart(buildInput(anchor.input || {}));
      T.check(false, 'expectError', `期望抛错「${anchor.assert.expectError}」但未抛错`);
    } catch (e) {
      T.check(String(e && e.message).indexOf(anchor.assert.expectError) !== -1, 'expectError',
        `期望=${anchor.assert.expectError} 实得=${e && e.message}`);
    }
  } else {
    let err = null;
    try { assertAnchor(anchor, T); } catch (e) { err = e; }
    if (err) T.check(false, 'EXCEPTION', err.message);
  }
  const s = T.summary();
  ALL.total += s.total; ALL.passed += s.passed; ALL.failed += s.failed;
  ALL.cases.push({ id, total: s.total, passed: s.passed, failed: s.failed, fails: s.fails });
  ALL.notes = ALL.notes.concat(s.notes);
}

// 输出
console.log('==== 紫微斗数排盘 锚点回归 ' + (only === 'all' ? '全部12盘' : only) + ' ====');
console.log('断言总数 ' + ALL.total + '，通过 ' + ALL.passed + '，失败 ' + ALL.failed);
let failN = 0;
for (const c of ALL.cases) {
  const mark = c.failed === 0 ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${c.id}  ${c.passed}/${c.total}`);
  for (const f of c.fails) {
    failN++;
    console.log(`   ❌ ${f.case} ${f.label}\n       ${f.detail}`);
  }
}
console.log('==== 观察项(notes) ====');
for (const n of ALL.notes) console.log(`   · ${n.case} ${n.label}: ${n.detail}`);
console.log(failN === 0 ? 'ALL PASS ✅' : '有失败 ❌ 退出码 1');
process.exit(failN === 0 ? 0 : 1);
