/* 紫微斗数排盘 v0.1.0 — main.js
 * APP：入口 + ?test=1 内嵌自检（L1 常量 / L2 历法 / L3 安星 / L4 端到端）。
 * 依赖：constants.js -> algorithm.js（先加载）。
 */
(function () {
  'use strict';

  var ALGO = window.ALGO;
  var CONST = window.CONST;

  // ===== 断言小工具 =====
  function makeT() {
    var total = 0, passed = 0;
    var fails = [];
    function rec(ok, msg) {
      total++;
      if (ok) { passed++; }
      else { fails.push(msg); }
    }
    return {
      ok: function (cond, msg) { rec(!!cond, msg); },
      eq: function (a, b, msg) { rec(String(a) === String(b), msg + ' | 期望=' + b + ' 实得=' + a); },
      summary: function () { return { total: total, passed: passed, failed: total - passed, fails: fails }; }
    };
  }

  function runTests() {
    var T = makeT();

    // ===== L1 常量表完整性 =====
    T.eq(CONST.GAN.length, 10, 'L1 十天干');
    T.eq(CONST.ZHI.length, 12, 'L1 十二地支');
    T.eq(CONST.PALACES.length, 12, 'L1 十二宫名');
    T.eq(CONST.MAJOR_ALL.length, 14, 'L1 十四主星');
    T.eq(CONST.ZIWEI_GROUP.length, 6, 'L1 紫微星系6');
    T.eq(CONST.TIANFU_GROUP.length, 8, 'L1 天府星系8');
    T.eq(CONST.LUNAR_INFO.length, 402, 'L1 历法表覆盖 1799-2200');
    T.eq(CONST.LUNAR_NEW_YEAR.length, 402, 'L1 正月初一表 402 年');
    T.eq(Object.keys(CONST.FOUR_HUA).length, 10, 'L1 四化十干');
    T.eq(CONST.FOUR_HUA[0][0], '廉贞', 'L1 甲年化禄廉贞');
    T.eq(CONST.FOUR_HUA[0][1], '破军', 'L1 甲年化权破军');
    T.eq(CONST.FOUR_HUA[0][2], '武曲', 'L1 甲年化科武曲');
    T.eq(CONST.FOUR_HUA[0][3], '太阳', 'L1 甲年化忌太阳');
    T.eq(Object.keys(CONST.MING_ZHU).length, 12, 'L1 命主十二支全');
    T.eq(Object.keys(CONST.SHEN_ZHU).length, 12, 'L1 身主十二支全');
    var n2 = CONST.JU_NUM['木三局'];
    T.eq(n2, 3, 'L1 木三局=3');
    // 五行局表完整
    var allJu = true;
    for (var j = 1; j <= 5; j++) if (!CONST.JU_NAME[j] || !CONST.JU_NUM[CONST.JU_NAME[j]]) allJu = false;
    T.ok(allJu, 'L1 五行局表 1-5 完整');
    // 历法数据区间冒烟：非零且互不相同年份 CNY 在 1-2 月
    var cnyOk = true;
    for (var y = 1800; y <= 2200; y++) {
      var c = ALGO.cnyOf(y);
      if (!c || c.m < 1 || c.m > 2 || c.d < 1 || c.d > 31) { cnyOk = false; break; }
    }
    T.ok(cnyOk, 'L1 正月初一全部落在 1-2 月');

        // ===== L2 历法边界（期望值经 sxtwl 2.0.7 独立校验）=====
    function L(desc) { return function (a, b) { T.eq(a, b, desc); }; }
    var ln;
    ln = ALGO.solarToLunar(2000, 8, 16);
    T.ok(ln && ln.lunarYear === 2000 && ln.lunarMonth === 7 && ln.lunarDay === 17 && !ln.isLeap, 'L2 2000-8-16=庚辰年七月十七');
    ln = ALGO.solarToLunar(2000, 1, 1);
    T.ok(ln && ln.lunarYear === 1999 && ln.lunarMonth === 11 && ln.lunarDay === 25, 'L2 2000-1-1=己卯年十一月廿五(年界正月初一)');
    ln = ALGO.solarToLunar(1990, 1, 1);
    T.ok(ln && ln.lunarYear === 1989 && ln.lunarMonth === 12 && ln.lunarDay === 5, 'L2 1990-1-1=1989腊月初五');
    ln = ALGO.solarToLunar(2023, 2, 1);
    T.ok(ln && ln.lunarYear === 2023 && ln.lunarMonth === 1 && ln.lunarDay === 11, 'L2 2023-2-1=正月十一');
    ln = ALGO.solarToLunar(1800, 1, 1);
    T.ok(ln && ln.lunarYear === 1799 && ln.lunarMonth === 12 && ln.lunarDay === 7, 'L2 1800-1-1 边界=1799腊月初七');
    ln = ALGO.solarToLunar(2200, 12, 31);
    T.ok(ln && ln.lunarYear === 2200 && ln.lunarMonth === 11 && ln.lunarDay === 25, 'L2 2200-12-31 边界');
    ln = ALGO.solarToLunar(2023, 3, 22);
    T.ok(ln && ln.lunarYear === 2023 && ln.lunarMonth === 2 && ln.lunarDay === 1 && ln.isLeap && ln.leapMonth === 2, 'L2 2023-3-22=闰二月初一');
    // 农历 -> 公历往返
    var back = ALGO.lunarToSolar(2000, 7, 17, false);
    T.ok(back && back.y === 2000 && back.m === 8 && back.d === 16, 'L2 lunarToSolar(2000七月十七)=2000-8-16');
    back = ALGO.lunarToSolar(2023, 2, 1, true);
    T.ok(back && back.y === 2023 && back.m === 3 && back.d === 22, 'L2 lunarToSolar(2023闰二月初一)=2023-3-22');
    back = ALGO.lunarToSolar(1800, 1, 1, false);
    T.ok(back && back.y === 1800 && back.m === 1 && back.d === 25, 'L2 1800 正月初一=1800-1-25');
    // 日柱（sxtwl 校验值）
    var dg = ALGO.dayGanZhi(2000, 8, 16);
    T.ok(dg.gan === '丙' && dg.zhi === '午', 'L2 2000-8-16 日柱丙午');
    dg = ALGO.dayGanZhi(1990, 1, 1);
    T.ok(dg.gan === '丙' && dg.zhi === '寅', 'L2 1990-1-1 日柱丙寅');
    dg = ALGO.dayGanZhi(2023, 3, 22);
    T.ok(dg.gan === '己' && dg.zhi === '卯', 'L2 2023-3-22 日柱己卯');
    dg = ALGO.dayGanZhi(2200, 12, 31);
    T.ok(dg.gan === '辛' && dg.zhi === '卯', 'L2 2200-12-31 日柱辛卯');
    // 时柱（五鼠遁）
    var hg = ALGO.hourGanZhi(2, 0); // 丙日子时
    T.ok(hg.gan === '戊' && hg.zhi === '子', 'L2 丙日子时戊子');
    hg = ALGO.hourGanZhi(4, 2); // 戊日寅时
    T.ok(hg.gan === '甲' && hg.zhi === '寅', 'L2 戊日寅时甲寅');
    // 时辰折算
    T.eq(ALGO.hourToShichen(23, 30).zhiIdx, 0, 'L2 23:30 子时');
    T.eq(ALGO.hourToShichen(23, 30).lateZi, true, 'L2 23:30 晚子时');
    T.eq(ALGO.hourToShichen(0, 30).lateZi, false, 'L2 0:30 早子时');
    T.eq(ALGO.hourToShichen(3, 0).zhiIdx, 2, 'L2 3:00 寅时');
    T.eq(ALGO.hourToShichen(22, 59).zhiIdx, 11, 'L2 22:59 亥时');
    // 真太阳时（120E 偏移≈均时差；经度 105E 约 -60±17 分）
    var tst = ALGO.trueSolarTime(2000, 8, 16, 12, 0, 120);
    T.ok(Math.abs(tst.offsetMin) < 17, 'L2 真太阳时 120E 偏移≈均时差内');
    tst = ALGO.trueSolarTime(2000, 8, 16, 12, 0, 105);
    T.ok(tst.offsetMin < -40 && tst.offsetMin > -80, 'L2 真太阳时 105E 偏移约-60');
    // 晚子时归次日（D-3 forward）
    var pre1 = ALGO.preprocess({ y: 2000, m: 8, d: 16, h: 23, mi: 30, gender: 'M', lng: null });
    T.eq(pre1.lateZi, true, 'L2 晚子时标记');
    T.eq(pre1.lunar.lunarDay, 18, 'L2 晚子时归次日：农历日17->18');
    T.eq(pre1.timeIndex, 12, 'L2 timeIndex=12');
    T.eq(pre1.yearGanZhi.gan, '庚', 'L2 晚子时年份仍庚');
    // 闰月十五分界（D-4 fixLeap）
    var preA = ALGO.preprocess({ y: 2023, m: 3, d: 31, h: 10, mi: 0, gender: 'M', lng: null }); // 闰二月初十
    var preB = ALGO.preprocess({ y: 2023, m: 4, d: 10, h: 10, mi: 0, gender: 'M', lng: null }); // 闰二月二十
    T.eq(preA.lunar.isLeap, true, 'L2 闰二月初十 isLeap');
    T.eq(preA.mUse, 2, 'L2 闰月初十实用月=2');
    T.eq(preB.mUse, 3, 'L2 闰月二十实用月=3');

    // ===== L3 安星锚点（ALGORITHM §15.2 候选锚点 + §8 公式例）=====
    // 例一：27日木三局 -> 紫微戌(p8)；例二：13日火六局 -> 亥(p9)；例三：6日土五局 -> 未(p5)
    T.eq(ALGO.ziweiPalace(27, 3), 8, 'L3 27日木三局 紫微戌');
    T.eq(ALGO.ziweiPalace(13, 6), 9, 'L3 13日火六局 紫微亥');
    T.eq(ALGO.ziweiPalace(6, 5), 5, 'L3 6日土五局 紫微未');
    T.eq(ALGO.tianfuPalace(0), 0, 'L3 紫微寅->天府寅');
    T.eq(ALGO.tianfuPalace(4), 8, 'L3 紫微午->天府戌');
    T.eq(ALGO.tianfuPalace(6), 6, 'L3 紫微申->天府申');
    T.eq(ALGO.tianfuPalace(2), 10, 'L3 紫微辰->天府子');
    // 主锚点 2000-8-16 寅时 女
    var ch1 = ALGO.getChart({ y: 2000, m: 8, d: 16, h: 4, mi: 0, gender: 'F', lng: null });
    T.eq(ch1.center.mingGanZhi, '壬午', 'L3 命宫干支壬午');
    T.eq(ch1.center.soulZhi, '午', 'L3 命宫在午');
    T.eq(ch1.center.bodyZhi, '戌', 'L3 身宫在戌');
    T.eq(ch1.center.juName, '木三局', 'L3 木三局');
    T.eq(ch1.center.mingZhu, '破军', 'L3 命主破军');
    T.eq(ch1.center.shenZhu, '文昌', 'L3 身主文昌');
    T.eq(ch1.center.ziweiIndex, 4, 'L3 紫微在午');
    T.eq(ch1.center.tianfuIndex, 8, 'L3 天府在戌');
    T.ok(ch1.daXian[0].name === '命宫' && ch1.daXian[0].start === 3 && ch1.daXian[0].end === 12, 'L3 大限0 3-12岁命宫');
    T.eq(ch1.daXian[2].ganZhi, '庚辰', 'L3 大限2 庚辰');
    T.ok(ch1.daXian[2].start === 23 && ch1.daXian[2].end === 32, 'L3 大限2 23-32岁');
    T.ok(ch1.center.huaSummary['太阳'] === '禄' && ch1.center.huaSummary['武曲'] === '权'
      && ch1.center.huaSummary['太阴'] === '科' && ch1.center.huaSummary['天同'] === '忌', 'L3 庚年四化落位');
    // 同盘男命大限方向相反
    var ch1m = ALGO.getChart({ y: 2000, m: 8, d: 16, h: 4, mi: 0, gender: 'M', lng: null });
    T.ok(ch1m.daXian[1].palaceIndex !== ch1.daXian[1].palaceIndex, 'L3 性别切换大限方向反转');
    T.eq(ch1m.daXian[1].palaceIndex, 5, 'L3 阳男顺行 大限1落未(p5)');

    // 辅星落宫（P1-1 勘误回归：六辅星起宫常量，a01 期望 文昌申/文曲午/左辅戌/右弼辰/地劫丑/地空酉）
    var fuEarth = {};
    for (var fi = 0; fi < 12; fi++) {
      var fp = ch1.palaces[fi];
      for (var fj = 0; fj < fp.minor.length; fj++) fuEarth[fp.minor[fj]] = fp.zhi;
    }
    T.eq(fuEarth['文昌'], '申', 'L3 文昌落申');
    T.eq(fuEarth['文曲'], '午', 'L3 文曲落午');
    T.eq(fuEarth['左辅'], '戌', 'L3 左辅落戌');
    T.eq(fuEarth['右弼'], '辰', 'L3 右弼落辰');
    T.eq(fuEarth['地劫'], '丑', 'L3 地劫落丑');
    T.eq(fuEarth['地空'], '酉', 'L3 地空落酉');

    // 十干四化覆盖（§15.2 #7：每干一例，抽查四化落宫）
    var huaAllOk = true, huaErr = '';
    var huaYears = [1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993]; // 甲子..癸酉
    for (var hyi = 0; hyi < huaYears.length; hyi++) {
      var hch = ALGO.getChart({ y: huaYears[hyi], m: 6, d: 15, h: 12, mi: 0, gender: 'M', lng: null });
      var gIdx = hch.pre.yearGanZhi.ganIdx;
      var h4 = CONST.FOUR_HUA[gIdx];
      for (var hii = 0; hii < 4; hii++) {
        var hn = h4[hii];
        var hp = ALGO.starPalace(hch, hn);
        var got = null;
        if (hp) {
          for (var mj2 = 0; mj2 < hch.palaces[hp.index].major.length; mj2++) {
            var mm = hch.palaces[hp.index].major[mj2];
            if (mm.name === hn && mm.hua === CONST.HUA_NAME[hii]) got = true;
          }
          for (var mn2 = 0; mn2 < hch.palaces[hp.index].minor.length && !got; mn2++) {
            if (hch.palaces[hp.index].minor[mn2] === hn) got = true; // 辅星四化仅标注于主星，此处校验落宫
          }
        }
        if (!got) { huaAllOk = false; huaErr = CONST.GAN[gIdx] + '年 ' + hn + CONST.HUA_NAME[hii]; break; }
      }
      if (!huaAllOk) break;
    }
    T.ok(huaAllOk, 'L3 十干四化全覆盖 ' + (huaErr || ''));

    // ===== L4 端到端结构 =====
    function structureOk(ch) {
      var okS = ch && ch.palaces.length === 12 && ch.daXian.length === 12;
      if (!okS) return '结构缺失';
      var majors = 0, minors = 0, names = {};
      for (var i = 0; i < 12; i++) {
        var p = ch.palaces[i];
        if (!p.name || p.ganZhi.length !== 2 || p.ganZhi !== p.gan + p.zhi) return '宫干支持错误 ' + i;
        if (names[p.name]) return '宫名重复 ' + p.name;
        names[p.name] = 1;
        majors += p.major.length; minors += p.minor.length;
        if (p.isSoul && p.name !== '命宫') return 'soul 标记错误';
      }
      if (majors !== 14) return '主星数=' + majors;
      if (minors !== 14) return '辅星数=' + minors;
      return null;
    }
    var cases = [
      { y: 2000, m: 8, d: 16, h: 4, mi: 0, gender: 'F', lng: null },
      { y: 2000, m: 8, d: 16, h: 23, mi: 30, gender: 'M', lng: null },
      { y: 2023, m: 3, d: 31, h: 10, mi: 0, gender: 'F', lng: null },
      { y: 1800, m: 1, d: 1, h: 12, mi: 0, gender: 'M', lng: null },
      { y: 2200, m: 12, d: 31, h: 12, mi: 0, gender: 'F', lng: null },
      { y: 1990, m: 1, d: 1, h: 12, mi: 0, gender: 'M', lng: 116.4 },
      { y: 2023, m: 1, d: 21, h: 23, mi: 30, gender: 'F', lng: null },
      { y: 2024, m: 2, d: 9, h: 23, mi: 59, gender: 'M', lng: null }
    ];
    for (var ci = 0; ci < cases.length; ci++) {
      var cch;
      try { cch = ALGO.getChart(cases[ci]); } catch (e) { cch = null; }
      var err = structureOk(cch);
      T.ok(!err, 'L4 端到端 ' + JSON.stringify(cases[ci]) + (err ? ' -> ' + err : ''));
    }
    // 除夕晚子时（23:30 归次日正月初一，年干支进位）
    var eve = ALGO.preprocess({ y: 2023, m: 1, d: 21, h: 23, mi: 30, gender: 'F', lng: null });
    T.ok(eve.effSolar.m === 1 && eve.effSolar.d === 22, 'L2 除夕晚子时归次日 1-22');
    T.ok(eve.lunar.lunarMonth === 1 && eve.lunar.lunarDay === 1, 'L2 除夕晚子时归次年正月初一');
    T.eq(eve.yearGanZhi.gan, '癸', 'L2 除夕晚子时跨年：年干癸卯');
    // 主星互斥性：同一宫主星无重复名
    var dup = null;    for (var pi2 = 0; pi2 < 12 && !dup; pi2++) {
      var pm = ch1.palaces[pi2].major.map(function (x) { return x.name; });
      if (new Set(pm).size !== pm.length) dup = pm.join(',');
    }
    T.ok(!dup, 'L4 主星不重复 ' + (dup || ''));


    return T.summary();
  }

  // ===== 页面入口 =====
  function boot() {
    var q = (location.search || '').indexOf('test=1') >= 0;
    var appEl = document.getElementById('app');
    if (q) {
      var out = document.getElementById('testOut') || document.getElementById('out');
      if (appEl) appEl.classList.add('hidden');
      if (out) out.classList.remove('hidden');
      var r = runTests();
      var html = '<h2>?test=1 自检</h2><p>共 ' + r.total + ' 条，通过 ' + r.passed + '，失败 ' + r.failed + '</p>';
      if (r.failed) {
        html += '<ul style="color:#c00">' + r.fails.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>';
      } else {
        html += '<p style="color:#080">ALL PASS ✅</p>';
      }
      out.innerHTML = html;
      window.__TEST_RESULT__ = r;
    } else {
      if (appEl) appEl.classList.remove('hidden');
      try { initApp(); } catch (e) { if (window.console && console.error) console.error('[UI init]', e); }
    }
  }

  // ===== UI 控制器（Phase 4）=====
  var SHICHEN = [
    { name: '早子', h: 0, mi: 30, note: '00:00-00:59' },
    { name: '丑', h: 1, mi: 30, note: '01:00-02:59' },
    { name: '寅', h: 3, mi: 30, note: '03:00-04:59' },
    { name: '卯', h: 5, mi: 30, note: '05:00-06:59' },
    { name: '辰', h: 7, mi: 30, note: '07:00-08:59' },
    { name: '巳', h: 9, mi: 30, note: '09:00-10:59' },
    { name: '午', h: 11, mi: 30, note: '11:00-12:59' },
    { name: '未', h: 13, mi: 30, note: '13:00-14:59' },
    { name: '申', h: 15, mi: 30, note: '15:00-16:59' },
    { name: '酉', h: 17, mi: 30, note: '17:00-18:59' },
    { name: '戌', h: 19, mi: 30, note: '19:00-20:59' },
    { name: '亥', h: 21, mi: 30, note: '21:00-22:59' },
    { name: '晚子', h: 23, mi: 30, note: '23:00-23:59', late: true }
  ];

  function $(id) { return document.getElementById(id); }
  function addOpt(sel, text, value) {
    var o = document.createElement('option');
    o.textContent = text;
    o.value = value;
    sel.appendChild(o);
  }
  function clearSel(sel) { sel.innerHTML = ''; }
  function setSel(sel, val) { sel.value = String(val); }
  function daysInSolarMonth(y, m) { return ALGO.solarDim(y, m); }
  function lunarYearInfo(ly) {
    // 返回该农历年每月长度 {leapMonth, mDays:[29/30...], leapDays}
    var idx = ly - CONST.LUNAR_BASE;
    if (idx < 0 || idx >= CONST.LUNAR_INFO.length) return null;
    var info = CONST.LUNAR_INFO[idx];
    var leapMonth = info & 0xF;
    var mDays = [];
    for (var m = 1; m <= 12; m++) mDays.push(((info >> (3 + m)) & 1) ? 30 : 29);
    var leapDays = ((info >> 20) & 1) ? 30 : 29;
    return { leapMonth: leapMonth, mDays: mDays, leapDays: leapDays };
  }
  function lunarOk(ly, lm, ld, leap) {
    var li = lunarYearInfo(ly);
    if (!li) return false;
    if (leap) {
      if (li.leapMonth !== lm) return false;
      return ld >= 1 && ld <= li.leapDays;
    }
    return ld >= 1 && ld <= li.mDays[lm - 1];
  }

  function initApp() {
    var els = {
      segType: $('segType'), fYear: $('fYear'), fMonth: $('fMonth'), fDay: $('fDay'),
      leapWrap: $('leapWrap'), fLeap: $('fLeap'), fLeapLbl: $('fLeapLbl'),
      chipShichen: $('chipShichen'), fHour: null, fMinute: null,
      gender: document.querySelectorAll('input[name="gender"]'),
      fCity: $('fCity'), fLng: $('fLng'), fTrueSolar: $('fTrueSolar'),
      btnAdv: $('btnAdv'), advBox: $('advBox'),
      advLateZi: $('advLateZi'), advFixLeap: $('advFixLeap'), advYearDivide: $('advYearDivide'),
      btnCalc: $('btnCalc'), calcErr: $('calcErr'), dateErr: $('dateErr'),
      resultPanel: $('resultPanel'), resultHead: $('resultHead'),
      chartWrap: $('chartWrap'), timeline: $('timeline'), detailBody: $('detailBody'),
      detailPanel: $('detailPanel'),
      btnTestPage: $('btnTestPage')
    };

    var state = { mode: 'solar', sy: 2000, sm: 8, sd: 16, ly: 2000, lm: 7, ld: 17, leap: false, lastChart: null };

    // ---- 填充基础下拉 ----
    function fillDateSelects(mode) {
      if (mode === 'solar') {
        var dim = daysInSolarMonth(+els.fYear.value, +els.fMonth.value);
        clearSel(els.fDay);
        for (var d = 1; d <= dim; d++) addOpt(els.fDay, d + '日', d);
      } else {
        var ly = +els.fYear.value, lm = +els.fMonth.value, leap = els.fLeap.checked;
        var li = lunarYearInfo(ly);
        if (li) {
          var max = leap ? li.leapDays : li.mDays[lm - 1];
          clearSel(els.fDay);
          for (var d2 = 1; d2 <= max; d2++) addOpt(els.fDay, d2 + '日', d2);
        }
      }
    }
    function fillYearMonth() {
      clearSel(els.fYear);
      for (var y = 1800; y <= 2200; y++) addOpt(els.fYear, y + '年', y);
      clearSel(els.fMonth);
      for (var m = 1; m <= 12; m++) addOpt(els.fMonth, m + '月', m);
    }
    fillYearMonth();
    setSel(els.fYear, 2000); setSel(els.fMonth, 8);
    fillDateSelects('solar'); setSel(els.fDay, 16);

    // ---- 时辰 chips + 时/分（用 chips 表达；h/m 内嵌于 chip）----
    var chipBtns = [];
    function rebuildChips() {
      els.chipShichen.innerHTML = '';
      chipBtns.length = 0;
      for (var i = 0; i < SHICHEN.length; i++) {
        (function (sc, idx) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'chip' + (sc.late ? ' late' : '');
          b.textContent = sc.name + (sc.late ? '' : '时');
          b.title = sc.note;
          b.addEventListener('click', function () {
            for (var k = 0; k < chipBtns.length; k++) chipBtns[k].classList.remove('active');
            b.classList.add('active');
            state.h = sc.h; state.mi = sc.mi;
            if (state.lastChart) doCalc();
          });
          els.chipShichen.appendChild(b);
          chipBtns.push(b);
        })(SHICHEN[i], i);
      }
      chipBtns[2].classList.add('active'); // 默认寅时
      state.h = SHICHEN[2].h; state.mi = SHICHEN[2].mi;
    }
    rebuildChips();

    // ---- 历法切换 ----
    function setMode(mode) {
      state.mode = mode;
      var btns = els.segType.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].getAttribute('data-type') === mode);
      els.leapWrap.classList.toggle('show', mode === 'lunar');
      if (mode === 'lunar') {
        // 当前公历 -> 农历预填
        var sy = +els.fYear.value, sm = +els.fMonth.value, sd = +els.fDay.value;
        var lu = ALGO.solarToLunar(sy, sm, sd);
        if (lu) {
          setSel(els.fYear, lu.lunarYear); setSel(els.fMonth, lu.lunarMonth);
          els.fLeap.checked = !!lu.isLeap;
          els.fLeapLbl.textContent = '闰' + lu.lunarMonth + '月';
          fillDateSelects('lunar'); setSel(els.fDay, lu.lunarDay);
        }
      } else {
        // 农历 -> 公历预填
        var sl = solarFromLunarForm();
        if (sl) { setSel(els.fYear, sl.y); setSel(els.fMonth, sl.m); fillDateSelects('solar'); setSel(els.fDay, sl.d); }
      }
    }
    for (var t = 0; t < els.segType.querySelectorAll('button').length; t++) {
      (function (b) {
        b.addEventListener('click', function () { setMode(b.getAttribute('data-type')); });
      })(els.segType.querySelectorAll('button')[t]);
    }
    els.fYear.addEventListener('change', function () { if (state.mode === 'lunar') syncLeapLbl(); fillDateSelects(state.mode); });
    els.fMonth.addEventListener('change', function () { if (state.mode === 'lunar') syncLeapLbl(); fillDateSelects(state.mode); });
    els.fLeap.addEventListener('change', function () { syncLeapLbl(); fillDateSelects('lunar'); });
    function syncLeapLbl() {
      var lm = +els.fMonth.value;
      els.fLeapLbl.textContent = '闰' + lm + '月';
      // 无闰月年份自动取消
      if (els.fLeap.checked && state.mode === 'lunar') {
        var ly = +els.fYear.value, li = lunarYearInfo(ly);
        if (li && li.leapMonth !== lm) { els.fLeap.checked = false; }
      }
    }

    // ---- 出生地/真太阳时 ----
    els.fCity.addEventListener('change', function () {
      var v = els.fCity.value;
      if (v === 'CUSTOM') { els.fLng.classList.remove('hidden'); els.fLng.value = ''; }
      else { els.fLng.classList.add('hidden'); els.fLng.value = v; }
    });
    els.fLng.addEventListener('input', function () { state.lng = els.fLng.value !== '' ? parseFloat(els.fLng.value) : null; });
    els.fTrueSolar.addEventListener('change', function () { if (state.lastChart) doCalc(); });
    els.gender.forEach(function (r) { r.addEventListener('change', function () { if (state.lastChart) doCalc(); }); });

    // ---- 口径开关 ----
    els.btnAdv.addEventListener('click', function () { els.advBox.classList.toggle('show'); });
    function applyConfig() {
      CONST.CONFIG.DAY_DIVIDE = els.advLateZi.value;          // forward | current
      CONST.CONFIG.FIX_LEAP = els.advFixLeap.value === '1';    // true | false
      CONST.CONFIG.YEAR_DIVIDE = els.advYearDivide.value;      // normal
      if (state.lastChart) doCalc();
    }
    els.advLateZi.addEventListener('change', applyConfig);
    els.advFixLeap.addEventListener('change', applyConfig);
    els.advYearDivide.addEventListener('change', applyConfig);
    els.btnTestPage.addEventListener('click', function () {
      location.href = location.pathname + '?test=1';
    });

    // ---- 表单读取 ----
    function solarFromLunarForm() {
      var ly = +els.fYear.value, lm = +els.fMonth.value, ld = +els.fDay.value, leap = els.fLeap.checked;
      if (!lunarOk(ly, lm, ld, leap)) return null;
      return ALGO.lunarToSolar(ly, lm, ld, leap);
    }
    function currentSolar() {
      if (state.mode === 'solar') {
        var dim = daysInSolarMonth(+els.fYear.value, +els.fMonth.value);
        var d = Math.min(+els.fDay.value || 1, dim);
        return { y: +els.fYear.value, m: +els.fMonth.value, d: d };
      }
      return solarFromLunarForm();
    }

    function errOf(what, msg) {
      var e = $('calcErr');
      if (e) { e.textContent = msg; e.classList.remove('hidden'); }
      return null;
    }
    function doCalc() {
      var e = $('calcErr');
      if (e) e.classList.add('hidden');
      var sol = currentSolar();
      if (!sol) { errOf(null, '农历日期无效：请核对年月日或闰月。'); return; }
      var gender = '';
      for (var i = 0; i < els.gender.length; i++) if (els.gender[i].checked) gender = els.gender[i].value;
      var lng = null;
      if (els.fLng.value !== '') lng = parseFloat(els.fLng.value);
      else if (els.fCity.value !== 'CUSTOM' && els.fCity.value !== '') lng = parseFloat(els.fCity.value);
      if (els.fTrueSolar && !els.fTrueSolar.checked) lng = null;
      var chart;
      try {
        chart = ALGO.getChart({ y: sol.y, m: sol.m, d: sol.d, h: state.h, mi: state.mi, gender: gender, lng: lng });
      } catch (ex) {
        errOf(null, '排盘失败：' + ex.message);
        return;
      }
      state.lastChart = chart;
      window.__CHART__ = chart;
      els.resultPanel.classList.remove('hidden');
      if (els.resultHead) els.resultHead.classList.remove('hidden');
      window.RENDER.renderAll(els.resultHead, els.chartWrap, els.timeline, els.detailPanel, chart, null);
      // 滚到结果
      if (els.resultPanel.scrollIntoView) els.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    els.btnCalc.addEventListener('click', function () { doCalc(); });

    // 初始默认排盘示例（2000-8-16 寅时 女）
    setSel(els.fYear, 2000); setSel(els.fMonth, 8); fillDateSelects('solar'); setSel(els.fDay, 16);
    for (var gi = 0; gi < els.gender.length; gi++) els.gender[gi].checked = (els.gender[gi].value === 'F');
    els.fCity.value = ''; els.fLng.classList.add('hidden'); els.fLng.value = '';
    doCalc();
  }

  window.APP = { version: CONST.VERSION, runTests: runTests, boot: boot, initApp: initApp, getChart: ALGO.getChart };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})();
