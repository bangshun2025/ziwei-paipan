#!/usr/bin/env node
/* 锚点重录工具（v0.2.0 口径）—— 按现行代码重算指定锚点的 assert 值
 * ⚠️ 用途限定：口径裁决（如 v0.2.0 立春换年/节气月轴）后重录回归基准。
 *    运行前必须：① 已逐条核对差异性质（见 docs/ANCHOR_RERECORD_v0.2.0.md）；
 *    ② 旧值已备份（git 历史 / 备份目录）。禁止在 CI 中运行本工具。
 * 用法：node tests/tools/regen_anchors.js a04 a08
 * 原则：只改值、不改结构 —— 字段键集合与原锚点完全一致（不增不减）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

// ---------- 加载浏览器 IIFE 模块（与 run_anchor_tests.js 同法） ----------
global.window = global;
for (const f of ['js/constants.js', 'js/algorithm.js', 'js/render.js']) {
  (0, eval)(fs.readFileSync(path.join(ROOT, f), 'utf8'));
}
const CONST = global.window.CONST;
const ALGO = global.window.ALGO;
const RENDER = global.window.RENDER;

const GAN = CONST.GAN, ZHI = CONST.ZHI;
const fix = (n, m) => ((n % m) + m) % m;

// ---------- 以下输入/取数逻辑与 run_anchor_tests.js 保持同步 ----------
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

function buildInput(inp) {
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
  if (pre.lateZi) return '23:00~00:00';
  if (pre.timeIndex === 0) return '00:00~01:00';
  const t = pre.tZhi;
  const st = ((t * 2 - 1) + 24) % 24, en = (t * 2 + 1) % 24;
  const p2 = (n) => String(n).padStart(2, '0');
  return p2(st) + ':00~' + p2(en) + ':00';
}
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
function palaceIndexOfEarth(earth) { return fix(CONST.ZHI_IDX[earth] - 2, 12); }

// ---------- 重算 assert（只改值、不改结构） ----------
function regenAssert(anchor) {
  const chart = ALGO.getChart(buildInput(anchor.input || {}));
  const pre = chart.pre;
  const cen = chart.center;
  const old = anchor.assert || {};
  const pz = palacesByZhi(chart);
  const dxMap = daXianByPalaceIndex(chart);
  const huaByStar = {};
  for (const hs of chart.huaStars || []) {
    if (hs.palaceIndex === null || hs.palaceIndex === undefined) continue;
    huaByStar[hs.star] = { earth: ZHI[fix(hs.palaceIndex + 2, 12)], mutagen: hs.hua };
  }
  const out = {};
  for (const k of Object.keys(old)) {
    if (k === 'gender') out.gender = (anchor.input.gender === 'female' || anchor.input.gender === 'F') ? '女' : '男';
    else if (k === 'solarDate') out.solarDate = `${pre.solar.y}-${pre.solar.m}-${pre.solar.d}`;
    else if (k === 'lunarDate') out.lunarDate = RENDER.cnLunar(chart).replace(/\s/g, '');
    else if (k === 'chineseDate') {
      const mgz = monthPillarByMuse(chart);
      out.chineseDate = `${pre.yearGanZhi.gan}${pre.yearGanZhi.zhi} ${mgz} ${pre.dayGanZhi.gan}${pre.dayGanZhi.zhi} ${pre.hourGanZhi.gan}${pre.hourGanZhi.zhi}`;
    }
    else if (k === 'time') out.time = chartTimeName(chart);
    else if (k === 'timeRange') out.timeRange = rangeOf(chart);
    else if (k === 'fiveElementsClass') out.fiveElementsClass = cen.juName;
    else if (k === 'soulEarth') out.soulEarth = cen.soulZhi;
    else if (k === 'bodyEarth') out.bodyEarth = cen.bodyZhi;
    else if (k === 'soulStar') out.soulStar = cen.mingZhu;
    else if (k === 'bodyStar') out.bodyStar = cen.shenZhu;
    else if (k === 'ziweiEarth') out.ziweiEarth = ZHI[fix(cen.ziweiIndex + 2, 12)];
    else if (k === 'palaces') {
      const np = {};
      for (const earth of Object.keys(old.palaces || {})) {
        const op = old.palaces[earth] || {};
        const gp = pz[earth];
        const sub = {};
        for (const sk of Object.keys(op)) {
          if (sk === 'stem') sub.stem = gp.gan;
          else if (sk === 'name') sub.name = gp.name;
          else if (sk === 'major') sub.major = (gp.major || []).map((s) => ({ name: s.name, mutagen: s.hua || '' }));
          else if (sk === 'minor') {
            const mins = gp.minor || [];
            sub.minor = (op.minor && typeof op.minor[0] === 'string') ? mins.slice() : mins.map((n) => ({ name: n }));
          }
          else if (sk === 'decadal') {
            const dx = dxMap[palaceIndexOfEarth(earth)];
            sub.decadal = { range: [dx.start, dx.end], stem: dx.ganZhi.charAt(0), earth: dx.ganZhi.charAt(1) };
          }
          else sub[sk] = op[sk];
        }
        np[earth] = sub;
      }
      out.palaces = np;
    }
    else if (k === 'mutagenMap') {
      const nm = {};
      for (const star of Object.keys(old.mutagenMap || {})) nm[star] = huaByStar[star] || old.mutagenMap[star];
      out.mutagenMap = nm;
    }
    else out[k] = old[k];
  }
  return out;
}

// ---------- 主流程 ----------
const ids = process.argv.slice(2).filter((a) => !a.startsWith('-'));
if (!ids.length || ids.includes('all')) {
  console.error('用法：node tests/tools/regen_anchors.js a04 a08（须显式列出盘号；禁止 all）');
  process.exit(2);
}
let totalChanged = 0;
for (const id of ids) {
  const file = path.join(ROOT, 'tests', 'anchors', id + '.json');
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (raw.assert && raw.assert.expectError) { console.log(`[skip] ${id}: expectError 型锚点不参与重录`); continue; }
  const oldAssert = raw.assert;
  const newAssert = regenAssert(raw);
  const diffs = [];
  (function walk(o, n, p) {
    const isObj = (v) => v !== null && typeof v === 'object' && Object.prototype.toString.call(v) !== '[object Array]';
    if (isObj(o) && isObj(n)) { for (const k of Object.keys(o)) walk(o[k], n[k], p + '.' + k); return; }
    if (JSON.stringify(o) !== JSON.stringify(n)) diffs.push(`${p}: ${JSON.stringify(o)} → ${JSON.stringify(n)}`);
  })(oldAssert, newAssert, 'assert');
  raw.assert = newAssert;
  raw.source = String(raw.source || '').indexOf('v0.2.0 口径重录') === -1
    ? (raw.source + ' → v0.2.0 口径重录（2026-09-11）') : raw.source;
  raw.meta = Object.assign({}, raw.meta, {
    reRecordedAt: '2026-09-11',
    reRecordRule: 'v0.2.0 宪法口径（立春换年/节气月轴；ALGORITHM §2.3/§2.5）'
  });
  fs.writeFileSync(file, JSON.stringify(raw, null, 2) + '\n');
  console.log(`[regen] ${id}: 变更 ${diffs.length} 处`);
  for (const d of diffs) console.log('   ' + d);
  totalChanged += diffs.length;
}
console.log(`== 共变更 ${totalChanged} 处。请跑 node tests/run_anchor_tests.js 验证。 ==`);
