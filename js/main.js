/* 紫微斗数排盘 v0.5.0 — main.js
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
      { y: 2099, m: 12, d: 31, h: 12, mi: 0, gender: 'F', lng: null },
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
    // 除夕晚子时（23:30 归次日正月初一；v0.2.0 口径：立春(2/4)前年干支仍壬寅，不随农历年进位）
    var eve = ALGO.preprocess({ y: 2023, m: 1, d: 21, h: 23, mi: 30, gender: 'F', lng: null });
    T.ok(eve.effSolar.m === 1 && eve.effSolar.d === 22, 'L2 除夕晚子时归次日 1-22');
    T.ok(eve.lunar.lunarMonth === 1 && eve.lunar.lunarDay === 1, 'L2 除夕晚子时归次年正月初一');
    T.eq(eve.yearGanZhi.gan, '壬', 'L2 除夕晚子时跨年：节气年干壬寅(立春前)');
    // 主星互斥性：同一宫主星无重复名
    var dup = null;    for (var pi2 = 0; pi2 < 12 && !dup; pi2++) {
      var pm = ch1.palaces[pi2].major.map(function (x) { return x.name; });
      if (new Set(pm).size !== pm.length) dup = pm.join(',');
    }
    T.ok(!dup, 'L4 主星不重复 ' + (dup || ''));

    // ===== L5 v0.4.0 档案/出生地静态层 =====
    var locN = 0, cityN = 0, hasDist = 0, provHasLng = 0;
    for (var lp in window.LOC_DATA) {
      if (!window.LOC_DATA.hasOwnProperty(lp)) continue;
      locN++;
      var cs = window.LOC_DATA[lp].cities;
      for (var ck in cs) {
        if (!cs.hasOwnProperty(ck)) continue;
        cityN++;
        if (typeof cs[ck].lng === 'number') provHasLng++;
        if (Array.isArray(cs[ck].dist) && cs[ck].dist.length > 0) hasDist++;
      }
    }
    T.ok(locN >= 30, 'L5 LOC_DATA 省级数>=30 实=' + locN);
    T.ok(cityN >= 300, 'L5 LOC_DATA 市级数>=300 实=' + cityN);
    T.eq(provHasLng, cityN, 'L5 每市均带 lng');
    T.ok(hasDist > 300 * 0.9, 'L5 90% 市带区县列表');
    T.ok(!!window.ARCHIVE && typeof window.ARCHIVE.init === 'function', 'L5 archive.js 模块挂载');
    T.ok(!!window.LOC_DATA['北京市'] && !!window.LOC_DATA['新疆'], 'L5 京/疆键可达');

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
  // v0.5.0 空值占位：目标值不在选项中时插入「— 未填 —」空选项并选中，避免默认第一项假数据
  function phSel(sel) {
    var o = document.createElement('option');
    o.value = '';
    o.textContent = '— 未填 —';
    sel.insertBefore(o, sel.firstChild);
    sel.selectedIndex = 0;
  }
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
      inName: $('inName'), inNickname: $('inNickname'), inYiming: $('inYiming'),
      fProv: $('fProv'), fCity: $('fCity'), fDist: $('fDist'),
      fLng: $('fLng'), fTrueSolar: $('fTrueSolar'), liveSolar: $('liveSolar'),
      btnAdv: $('btnAdv'), advBox: $('advBox'),
      advLateZi: $('advLateZi'),
      btnCalc: $('btnCalc'), calcErr: $('calcErr'), dateErr: $('dateErr'),
      btnAi: $('btnAi'), aiMask: $('aiMask'), aiInput: $('aiInput'),
      aiPreview: $('aiPreview'), aiErr: $('aiErr'), aiApply: $('aiApply'), aiClose: $('aiClose'),
      resultPanel: $('resultPanel'), resultHead: $('resultHead'),
      chartWrap: $('chartWrap'), timeline: $('timeline'), detailBody: $('detailBody'),
      detailPanel: $('detailPanel'),
      btnTestPage: $('btnTestPage')
    };

    var state = { mode: 'solar', sy: 2000, sm: 8, sd: 16, ly: 2000, lm: 7, ld: 17, leap: false, lastChart: null, name: '', nickname: '', yiming: '', prov: '', city: '', dist: '', scIdx: 2 };

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
      for (var y = 1800; y <= 2100; y++) addOpt(els.fYear, y + '年', y);
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
            state.h = sc.h; state.mi = sc.mi; state.scIdx = idx;
            refreshLiveSolar();
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
      refreshLiveSolar();
    }
    for (var t = 0; t < els.segType.querySelectorAll('button').length; t++) {
      (function (b) {
        b.addEventListener('click', function () { setMode(b.getAttribute('data-type')); });
      })(els.segType.querySelectorAll('button')[t]);
    }
    els.fYear.addEventListener('change', function () { if (state.mode === 'lunar') syncLeapLbl(); fillDateSelects(state.mode); refreshLiveSolar(); });
    els.fMonth.addEventListener('change', function () { if (state.mode === 'lunar') syncLeapLbl(); fillDateSelects(state.mode); refreshLiveSolar(); });
    els.fLeap.addEventListener('change', function () { syncLeapLbl(); fillDateSelects('lunar'); refreshLiveSolar(); });
    els.fDay.addEventListener('change', function () { refreshLiveSolar(); });
    function syncLeapLbl() {
      var lm = +els.fMonth.value;
      els.fLeapLbl.textContent = '闰' + lm + '月';
      // 无闰月年份自动取消
      if (els.fLeap.checked && state.mode === 'lunar') {
        var ly = +els.fYear.value, li = lunarYearInfo(ly);
        if (li && li.leapMonth !== lm) { els.fLeap.checked = false; }
      }
    }

    // ---- 出生地省市区三级联动 / 经度 / 真太阳时 ----
    function provNames() {
      var ks = [];
      for (var p in window.LOC_DATA) if (window.LOC_DATA.hasOwnProperty(p)) ks.push(p);
      return ks.sort(function (a, b) { return a.localeCompare(b, 'zh'); });
    }
    function fillProv() {
      clearSel(els.fProv);
      addOpt(els.fProv, '— 未选择（按北京时间120°E）—', '');
      var ks = provNames();
      for (var i = 0; i < ks.length; i++) addOpt(els.fProv, ks[i], ks[i]);
      addOpt(els.fProv, '自定义经度…', 'CUSTOM');
    }
    function fillCity(prov, keepVal) {
      clearSel(els.fCity);
      var cityKeys = [];
      if (prov && window.LOC_DATA[prov]) {
        var cs = window.LOC_DATA[prov].cities;
        for (var c in cs) if (cs.hasOwnProperty(c)) cityKeys.push(c);
      }
      cityKeys.sort(function (a, b) { return a.localeCompare(b, 'zh'); });
      els.fCity.disabled = cityKeys.length === 0;
      if (cityKeys.length === 0) { clearSel(els.fDist); els.fDist.disabled = true; }
      for (var i = 0; i < cityKeys.length; i++) addOpt(els.fCity, cityKeys[i], cityKeys[i]);
      if (keepVal && els.fCity.querySelector('option[value="' + keepVal + '"]')) setSel(els.fCity, keepVal);
    }
    function fillDist(city, keepVal) {
      clearSel(els.fDist);
      var dists = [];
      var prov = els.fProv.value;
      if (prov && prov !== 'CUSTOM' && city && window.LOC_DATA[prov] && window.LOC_DATA[prov].cities[city]) {
        dists = window.LOC_DATA[prov].cities[city].dist || [];
      }
      els.fDist.disabled = dists.length === 0;
      for (var i = 0; i < dists.length; i++) addOpt(els.fDist, dists[i], dists[i]);
      if (keepVal && els.fDist.querySelector('option[value="' + keepVal + '"]')) setSel(els.fDist, keepVal);
    }
    function currentLng() {
      var v = els.fLng.value;
      if (v !== '') { var f = parseFloat(v); return isNaN(f) ? null : f; }
      return null;
    }
    function placeLngOf() {
      var prov = els.fProv.value;
      if (!prov || prov === 'CUSTOM') return null;
      var city = els.fCity.value;
      if (!city) return null;
      var c = window.LOC_DATA[prov] && window.LOC_DATA[prov].cities[city];
      return c ? c.lng : null;
    }
    els.fProv.addEventListener('change', function () {
      var v = els.fProv.value;
      if (v === 'CUSTOM') {
        clearSel(els.fCity); els.fCity.disabled = true;
        clearSel(els.fDist); els.fDist.disabled = true;
        els.fLng.classList.remove('hidden'); els.fLng.value = '';
      } else {
        els.fLng.classList.add('hidden');
        fillCity(v);
        fillDist(els.fCity.disabled ? '' : els.fCity.value);
        if (placeLngOf()) els.fLng.value = placeLngOf();
        else els.fLng.value = '';
      }
      refreshLiveSolar();
      if (state.lastChart) doCalc();
    });
    els.fCity.addEventListener('change', function () {
      var city = els.fCity.value;
      fillDist(city);
      if (placeLngOf()) els.fLng.value = placeLngOf();
      else els.fLng.value = '';
      refreshLiveSolar();
      if (state.lastChart) doCalc();
    });
    els.fDist.addEventListener('change', function () { refreshLiveSolar(); });
    els.fLng.addEventListener('input', function () { refreshLiveSolar(); });
    els.fLng.addEventListener('change', function () { if (state.lastChart) doCalc(); });
    els.inName.addEventListener('input', function () { state.name = els.inName.value; });
    els.inNickname.addEventListener('input', function () { state.nickname = els.inNickname.value; });
    els.inYiming.addEventListener('input', function () { state.yiming = els.inYiming.value; });
    els.fTrueSolar.addEventListener('change', function () { refreshLiveSolar(); if (state.lastChart) doCalc(); });
    els.gender.forEach(function (r) { r.addEventListener('change', function () { if (state.lastChart) doCalc(); }); });

    // ---- liveSolar：实时真太阳时显示（复用 ALGO.trueSolarTime）----
    function scNameOf(hh, mm) {
      var arr = SHICHEN;
      for (var i = 0; i < arr.length; i++) {
        var a = arr[i];
        var lo = (a.h === 0) ? 0 : a.h - 1;
        var hi = a.h + 1;
        var t = hh * 60 + mm;
        if (a.late) { if (t >= 23 * 60 && t < 24 * 60) return a.name; continue; }
        if (a.h === 0) { if (t >= 0 && t < 60) return a.name; continue; }
        if (t >= lo * 60 && t < hi * 60) return a.name;
      }
      return '';
    }
    function refreshLiveSolar() {
      if (!els.liveSolar) return;
      var sol = currentSolarCached();
      var lng = currentLng();
      if (!sol) { els.liveSolar.textContent = ''; return; }
      if (lng === null || !els.fTrueSolar.checked) {
        els.liveSolar.textContent = '北京时间（120°E），未做真太阳时校正';
        return;
      }
      var t = ALGO.trueSolarTime(sol.y, sol.m, sol.d, state.h, state.mi, lng);
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var name = scNameOf(t.h, t.mi);
      var txt = '真太阳时 ' + pad(t.h) + ':' + pad(t.mi) + '（经度+均时差 ' + (t.offsetMin >= 0 ? '+' : '') + t.offsetMin.toFixed(0) + ' 分）';
      if (name && name !== SHICHEN[state.scIdx].name) txt += ' ≈' + name + '时段（与所选时辰不同）';
      els.liveSolar.textContent = txt;
    }
    function currentSolarCached() {
      var v = currentSolar();
      return v;
    }

    // ---- 口径开关 ----
    els.btnAdv.addEventListener('click', function () { els.advBox.classList.toggle('show'); });
    function applyConfig() {
      CONST.CONFIG.DAY_DIVIDE = els.advLateZi.value;          // forward | current
      // v0.2.0：年界(立春)/月轴(节气)为宪法口径，固定不可切换（原闰月分界、正月初一年界已废止）
      if (state.lastChart) doCalc();
    }
    els.advLateZi.addEventListener('change', applyConfig);
    els.btnTestPage.addEventListener('click', function () {
      location.href = location.pathname + '?test=1';
    });

    // ===== v0.5.0 AI 自然语言录入（解析在 aiinput.js；时辰/历法联动用本闭包）=====
    function shichenTxtOf(h, mi) {
      var arr = SHICHEN;
      for (var si = 0; si < arr.length; si++) {
        if (arr[si].h === h && arr[si].mi === mi) return arr[si].name + (arr[si].late ? '' : '时');
      }
      var nm = scNameOf(h, mi);
      return nm ? nm + '时' : '';
    }
    function aiPreviewStr(r) {
      var sb = [];
      if (r.name) sb.push('姓名：' + ((window.ARCHIVE && ARCHIVE.getPrivacyMode()) ? '已隐藏' : r.name));
      sb.push('性别：' + (r.gender || '（不填，保持原状）'));
      if (r.year) {
        sb.push(r.year + '年' + r.month + '月' + r.day + '日'
          + (r.calendarType === 'lunar' ? '（农历' + (r.leap ? ' ·闰' + r.month + '月' : '') + '）' : '（公历）'));
      }
      if (r.hour !== null) {
        var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
        var st = shichenTxtOf(r.hour, r.min);
        sb.push(p2(r.hour) + ':' + p2(r.min) + (st ? ' ≈' + st : ''));
      }
      if (r.prov) sb.push(r.prov + (r.city || '') + (r.dist || ''));
      return sb.join(' · ');
    }
    function aiFillPreview() {
      var r = window.AIINPUT.parse(els.aiInput.value, SHICHEN);
      var pv = els.aiPreview;
      pv.classList.remove('hidden');
      pv.classList.toggle('ai-bad', !r.year);
      if (!r.year) {
        pv.textContent = '⚠ 未能识别完整日期，请补充（例：邦顺 男 1982年10月18日早上5点 广西南宁）';
        return;
      }
      pv.textContent = '✅ 识别：' + aiPreviewStr(r);
    }
    function aiApply() {
      var r = window.AIINPUT.parse(els.aiInput.value, SHICHEN);
      var e = els.aiErr;
      if (!r.year) {
        if (e) { e.textContent = '未能识别完整日期，请补充年份（例：1982年10月18日）。'; e.classList.remove('hidden'); }
        return;
      }
      if (e) e.classList.add('hidden');
      if (r.name) { els.inName.value = r.name; state.name = r.name; }
      // 历法（先切历再填值：setMode 内部会用旧表单值做换算覆盖）
      var needLunar = r.calendarType === 'lunar';
      if (needLunar !== (state.mode === 'lunar')) setMode(needLunar ? 'lunar' : 'solar');
      els.fLeap.checked = needLunar ? !!r.leap : false;
      setSel(els.fYear, r.year);
      setSel(els.fMonth, r.month);
      if (needLunar) {
        syncLeapLbl();
        fillDateSelects('lunar');
      } else {
        fillDateSelects('solar');
      }
      setSel(els.fDay, r.day);
      // 性别（无性别词则保持原状）
      if (r.gender) {
        for (var gi = 0; gi < els.gender.length; gi++) els.gender[gi].checked = (els.gender[gi].value === (r.gender === '女' ? 'F' : 'M'));
      }
      // 时辰（折算为 SHICHEN 序号，高亮 chip）
      if (r.hour !== null) {
        var idx = scIdxOf(r.hour, r.min);
        if (idx >= 0 && idx < chipBtns.length) {
          for (var k = 0; k < chipBtns.length; k++) chipBtns[k].classList.remove('active');
          chipBtns[idx].classList.add('active');
          state.h = SHICHEN[idx].h; state.mi = SHICHEN[idx].mi; state.scIdx = idx;
        }
      }
      // 出生地省市区联动 + 经度回填（缺项插占位，避免默认第一项假数据）
      if (r.prov && window.LOC_DATA[r.prov]) {
        setSel(els.fProv, r.prov);
        fillCity(r.prov);
        if (r.city) {
          setSel(els.fCity, r.city);
          fillDist(r.city);
          if (r.dist) setSel(els.fDist, r.dist);
          else phSel(els.fDist);
        } else {
          phSel(els.fCity);
          clearSel(els.fDist); els.fDist.disabled = true;
        }
        els.fLng.classList.add('hidden');
        els.fLng.value = placeLngOf() || '';
      }
      refreshLiveSolar();
      aiHide();
      doCalc();
      if (window.ARCHIVE && ARCHIVE.toast) ARCHIVE.toast('已按 AI 录入排盘');
    }
    function aiShow() {
      els.aiMask.classList.remove('hidden');
      els.aiInput.value = '';
      els.aiPreview.classList.add('hidden');
      els.aiPreview.textContent = '';
      if (els.aiErr) els.aiErr.classList.add('hidden');
      setTimeout(function () { els.aiInput.focus(); }, 60);
    }
    function aiHide() { els.aiMask.classList.add('hidden'); }
    if (els.btnAi) els.btnAi.addEventListener('click', aiShow);
    if (els.aiClose) els.aiClose.addEventListener('click', aiHide);
    if (els.aiApply) els.aiApply.addEventListener('click', aiApply);
    if (els.aiMask) els.aiMask.addEventListener('click', function (ev) {
      if (ev.target === els.aiMask) aiHide();
    });
    if (els.aiInput) els.aiInput.addEventListener('input', aiFillPreview);

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
      if (!(els.fTrueSolar && !els.fTrueSolar.checked)) lng = currentLng();
      var chart;
      try {
        chart = ALGO.getChart({ y: sol.y, m: sol.m, d: sol.d, h: state.h, mi: state.mi, gender: gender, lng: lng });
      } catch (ex) {
        errOf(null, '排盘失败：' + ex.message);
        return;
      }
      state.lastChart = chart;
      window.__CHART__ = chart;
      var person = { name: state.name, nickname: state.nickname, yiming: state.yiming, gender: gender };
      window.__LAST_HEAD__ = { chart: chart, person: person };
      els.resultPanel.classList.remove('hidden');
      if (els.resultHead) els.resultHead.classList.remove('hidden');
      window.RENDER.renderAll(els.resultHead, els.chartWrap, els.timeline, els.detailPanel, chart, person);
      // 滚到结果
      if (els.resultPanel.scrollIntoView) els.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    els.btnCalc.addEventListener('click', function () { doCalc(); });

    // 初始默认排盘示例（2000-8-16 寅时 女）
    setSel(els.fYear, 2000); setSel(els.fMonth, 8); fillDateSelects('solar'); setSel(els.fDay, 16);
    for (var gi = 0; gi < els.gender.length; gi++) els.gender[gi].checked = (els.gender[gi].value === 'F');
    fillProv();
    els.fLng.classList.add('hidden'); els.fLng.value = '';
    refreshLiveSolar();
    doCalc();

    // ===== 档案快照双向（readForm/writeForm 由 ARCHIVE 调用）=====
    function readForm() {
      var sol = currentSolar();
      if (!sol) return null;
      var gender = '';
      for (var i = 0; i < els.gender.length; i++) if (els.gender[i].checked) gender = els.gender[i].value;
      var prov = els.fProv.value;
      var lunar = state.mode === 'lunar';
      var snap = {
        name: els.inName.value.trim(),
        nickname: els.inNickname.value.trim(),
        yiming: els.inYiming.value.trim(),
        gender: gender,
        mode: state.mode,
        y: lunar ? +els.fYear.value : sol.y,
        m: lunar ? +els.fMonth.value : sol.m,
        d: lunar ? +els.fDay.value : sol.d,
        leap: !!(els.fLeap.checked && lunar),
        scIdx: state.scIdx,
        h: state.h, mi: state.mi,
        prov: (prov && prov !== 'CUSTOM') ? prov : '',
        city: (prov && prov !== 'CUSTOM') ? els.fCity.value : '',
        dist: els.fDist.value || '',
        lng: currentLng(),
        useSolar: els.fTrueSolar.checked,
        advLateZi: els.advLateZi.value,
        note: ''
      };
      return snap;
    }
    function scIdxOf(h, mi) {
      for (var i = 0; i < SHICHEN.length; i++) {
        if (SHICHEN[i].h === h && SHICHEN[i].mi === mi) return i;
      }
      return 2;
    }
    function writeForm(s) {
      if (!s) return false;
      if (state.mode !== s.mode) setMode(s.mode);
      setSel(els.fYear, s.y); setSel(els.fMonth, s.m);
      els.fLeap.checked = !!s.leap;
      if (state.mode === 'lunar') syncLeapLbl();
      fillDateSelects(state.mode);
      setSel(els.fDay, s.d);
      var idx = (typeof s.scIdx === 'number') ? s.scIdx : scIdxOf(s.h, s.mi);
      if (idx >= 0 && idx < chipBtns.length) {
        for (var k = 0; k < chipBtns.length; k++) chipBtns[k].classList.remove('active');
        chipBtns[idx].classList.add('active');
        state.h = SHICHEN[idx].h; state.mi = SHICHEN[idx].mi; state.scIdx = idx;
      }
      for (var gi2 = 0; gi2 < els.gender.length; gi2++) els.gender[gi2].checked = (els.gender[gi2].value === s.gender);
      els.inName.value = s.name || '';
      els.inNickname.value = s.nickname || '';
      els.inYiming.value = s.yiming || '';
      state.name = s.name || '';
      state.nickname = s.nickname || '';
      state.yiming = s.yiming || '';
      if (s.prov && window.LOC_DATA[s.prov]) {
        setSel(els.fProv, s.prov);
        fillCity(s.prov);
        if (s.city) {
          if (els.fCity.querySelector('option[value="' + s.city + '"]')) setSel(els.fCity, s.city);
          else phSel(els.fCity);
          fillDist(els.fCity.value || s.city);
          if (s.dist && els.fDist.querySelector('option[value="' + s.dist + '"]')) setSel(els.fDist, s.dist);
          else phSel(els.fDist);
        } else {
          phSel(els.fCity);
          clearSel(els.fDist); els.fDist.disabled = true;
        }
        var pl = placeLngOf();
        els.fLng.classList.add('hidden');
        els.fLng.value = (typeof s.lng === 'number') ? s.lng : (pl || '');
      } else {
        setSel(els.fProv, s.lng ? 'CUSTOM' : '');
        els.fLng.classList.toggle('hidden', !s.lng);
        els.fLng.value = s.lng || '';
      }
      els.fTrueSolar.checked = !!s.useSolar;
      if (s.advLateZi) { setSel(els.advLateZi, s.advLateZi); CONST.CONFIG.DAY_DIVIDE = els.advLateZi.value; }
      refreshLiveSolar();
      doCalc();
      return true;
    }
    // ===== 档案编辑面板（buildEditForm/readEditForm）=====
    var editCtx = null;
    function eEsc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function eFillDay() {
      var ed = $('eDay');
      if (!ed) return;
      var mode = editCtx.mode, y = +$('eYear').value, m = +$('eMonth').value, leap = $('eLeap').checked;
      var max;
      if (mode === 'lunar') {
        var li = lunarYearInfo(y);
        if (!li) { $('eDateErr').classList.remove('hidden'); $('eDateErr').textContent = '农历年份数据缺失'; return; }
        if (leap && li.leapMonth !== m) { $('eDateErr').classList.remove('hidden'); $('eDateErr').textContent = '该年无闰' + m + '月'; max = 0; }
        else { $('eDateErr').classList.add('hidden'); max = leap ? li.leapDays : li.mDays[m - 1]; }
      } else { $('eDateErr').classList.add('hidden'); max = ALGO.solarDim(y, m); }
      clearSel(ed);
      for (var d = 1; d <= max; d++) addOpt(ed, d + '日', d);
      var cur = editCtx.d;
      if (cur >= 1 && cur <= max) setSel(ed, cur);
    }
    function buildEditForm(s) {
      editCtx = { mode: s.mode, prov: s.prov, city: s.city, dist: s.dist, scIdx: (typeof s.scIdx === 'number' ? s.scIdx : scIdxOf(s.h, s.mi)), d: s.d, lng: (typeof s.lng === 'number') ? s.lng : null, lngCustom: !!(!s.prov && s.lng) };
      var sc0 = editCtx.scIdx;
      var b = $('editBody');
      var h = '';
      h += '<div class="row"><span class="lbl">名字</span>' +
        '<input type="text" id="eNickname" maxlength="24" style="width:84px" placeholder="小名" value="' + eEsc(s.nickname || '') + '">' +
        '<input type="text" id="eYiming" maxlength="24" style="width:84px" placeholder="艺名" title="艺名（选填；隐私模式优先显示名）" value="' + eEsc(s.yiming || '') + '">' +
        '<input type="text" id="eName" maxlength="24" style="width:150px" placeholder="姓名（必填）" value="' + eEsc(s.name || '') + '"></div>';
      h += '<div class="row"><span class="lbl">性别</span><span class="radio-group">' +
        '<label><input type="radio" name="eGender" value="M"' + (s.gender !== 'F' ? ' checked' : '') + '> 男</label>' +
        '<label><input type="radio" name="eGender" value="F"' + (s.gender === 'F' ? ' checked' : '') + '> 女</label></span></div>';
      h += '<div class="row"><span class="lbl">历法</span><select id="eMode"><option value="solar"' + (s.mode !== 'lunar' ? ' selected' : '') + '>公历</option><option value="lunar"' + (s.mode === 'lunar' ? ' selected' : '') + '>农历</option></select>' +
        '<select id="eYear"></select><span>年</span><select id="eMonth"></select>' +
        '<label class="lbl"><input type="checkbox" id="eLeap"' + (s.leap ? ' checked' : '') + '> 闰月</label>' +
        '<select id="eDay"></select><span>日</span><span class="err hidden" id="eDateErr"></span></div>';
      h += '<div class="row"><span class="lbl">出生时辰</span><span class="shichen-chips" id="eChips"></span></div>';
      h += '<div class="row"><span class="lbl">出生地</span><select id="eProv"><option value="">— 未选择 —</option></select>' +
        '<select id="eCity" disabled></select><select id="eDist" disabled></select>' +
        '<input type="number" id="eLng" step="0.1" min="73" max="136" placeholder="经度°E" style="width:90px" class="hidden"></div>';
      h += '<div class="row"><label class="lbl"><input type="checkbox" id="eUseSolar"' + (s.useSolar ? ' checked' : '') + '> 按真太阳时校正</label>' +
        '<span class="lbl" style="margin-left:8px">晚子时</span><select id="eAdv"><option value="forward"' + (s.advLateZi !== 'current' ? ' selected' : '') + '>归次日（默认）</option><option value="current"' + (s.advLateZi === 'current' ? ' selected' : '') + '>归当日</option></select></div>';
      h += '<div class="row"><span class="lbl">备注</span><textarea id="eNote" rows="2" maxlength="200" style="flex:1">' + eEsc(s.note) + '</textarea></div>';
      b.innerHTML = h;
      var ey = $('eYear'), em = $('eMonth'), ed = $('eDay'), eleap = $('eLeap');
      for (var y = 1800; y <= 2100; y++) addOpt(ey, y + '年', y);
      for (var m2 = 1; m2 <= 12; m2++) addOpt(em, m2 + '月', m2);
      setSel(ey, s.y); setSel(em, s.m); eleap.checked = !!s.leap;
      eFillDay();
      $('eMode').addEventListener('change', function () {
        editCtx.mode = $('eMode').value;
        if (editCtx.mode === 'solar') { eleap.checked = false; }
        eFillDay();
      });
      ey.addEventListener('change', eFillDay);
      em.addEventListener('change', eFillDay);
      eleap.addEventListener('change', eFillDay);
      var ec = $('eChips');
      ec.innerHTML = '';
      for (var ci = 0; ci < SHICHEN.length; ci++) {
        (function (sc2, idx2) {
          var bb = document.createElement('button');
          bb.type = 'button';
          bb.className = 'chip' + (sc2.late ? ' late' : '');
          bb.textContent = sc2.name + (sc2.late ? '' : '时');
          if (idx2 === sc0) bb.classList.add('active');
          bb.addEventListener('click', function () {
            var all = ec.querySelectorAll('.chip');
            for (var q = 0; q < all.length; q++) all[q].classList.remove('active');
            bb.classList.add('active');
            editCtx.scIdx = idx2;
          });
          ec.appendChild(bb);
        })(SHICHEN[ci], ci);
      }
      eFillProv();
      bindEditDist();
    }
    function eFillProv() {
      var ep = $('eProv');
      clearSel(ep);
      addOpt(ep, '— 未选择 —', '');
      var ks = [];
      for (var p in window.LOC_DATA) if (window.LOC_DATA.hasOwnProperty(p)) ks.push(p);
      ks.sort(function (a, b) { return a.localeCompare(b, 'zh'); });
      for (var i = 0; i < ks.length; i++) addOpt(ep, ks[i], ks[i]);
      addOpt(ep, '自定义经度…', 'CUSTOM');
      ep.addEventListener('change', eSyncPlace);
      if (editCtx.prov) { setSel(ep, editCtx.prov); eSyncPlace(); }
      else if (editCtx.lngCustom) { setSel(ep, 'CUSTOM'); eSyncPlace(); }
      else { eSyncPlace(); }
    }
    function eSyncPlace() {
      var ep = $('eProv'), ec = $('eCity'), ed = $('eDist'), elng = $('eLng');
      var prov = ep.value;
      editCtx.prov = (prov === 'CUSTOM') ? '' : prov;
      if (prov === 'CUSTOM') {
        clearSel(ec); ec.disabled = true; clearSel(ed); ed.disabled = true;
        elng.classList.remove('hidden'); elng.value = (typeof editCtx.lng === 'number') ? editCtx.lng : '';
        return;
      }
      clearSel(ec);
      var cks = [];
      if (prov && window.LOC_DATA[prov]) { var cs = window.LOC_DATA[prov].cities; for (var c in cs) if (cs.hasOwnProperty(c)) cks.push(c); }
      cks.sort(function (a, b) { return a.localeCompare(b, 'zh'); });
      ec.disabled = cks.length === 0;
      for (var i = 0; i < cks.length; i++) addOpt(ec, cks[i], cks[i]);
      if (editCtx.city && ec.querySelector('option[value="' + editCtx.city + '"]')) setSel(ec, editCtx.city);
      else if (cks.length) phSel(ec);
      eSyncCity();
    }
    function eSyncCity() {
      var ec = $('eCity'), ed = $('eDist'), elng = $('eLng');
      var prov = $('eProv').value, city = ec.value;
      editCtx.city = city;
      clearSel(ed);
      var dts = [];
      if (prov && prov !== 'CUSTOM' && city && window.LOC_DATA[prov] && window.LOC_DATA[prov].cities[city]) {
        dts = window.LOC_DATA[prov].cities[city].dist || [];
      }
      ed.disabled = dts.length === 0;
      for (var i = 0; i < dts.length; i++) addOpt(ed, dts[i], dts[i]);
      if (editCtx.dist && ed.querySelector('option[value="' + editCtx.dist + '"]')) setSel(ed, editCtx.dist);
      else if (dts.length) phSel(ed);
      editCtx.dist = ed.value || '';
      var c = (prov && prov !== 'CUSTOM' && city) ? window.LOC_DATA[prov].cities[city] : null;
      if (c) {
        elng.classList.add('hidden');
        elng.value = c.lng;
        editCtx.lng = c.lng;
      } else {
        elng.classList.add('hidden');
        elng.value = (typeof editCtx.lng === 'number') ? editCtx.lng : '';
      }
    }
    function readEditForm() {
      if (!editCtx) return null;
      var mode = $('eMode').value;
      var y = +$('eYear').value, m = +$('eMonth').value, leap = $('eLeap').checked && mode === 'lunar';
      var d = +$('eDay').value;
      if (!d || isNaN(d)) return null;
      if (mode === 'lunar') {
        var li = lunarYearInfo(y);
        if (!li) return null;
        if (leap && li.leapMonth !== m) return null;
        if (d < 1 || d > (leap ? li.leapDays : li.mDays[m - 1])) return null;
      }
      var gender = '';
      var gr = document.querySelectorAll('input[name="eGender"]');
      for (var i = 0; i < gr.length; i++) if (gr[i].checked) gender = gr[i].value;
      var prov = $('eProv').value;
      var lngVal = $('eLng').value;
      var patch = {
        name: $('eName').value.trim(),
        nickname: $('eNickname').value.trim(),
        yiming: $('eYiming').value.trim(),
        gender: gender, mode: mode, y: y, m: m, d: d, leap: leap,
        scIdx: (typeof editCtx.scIdx === 'number') ? editCtx.scIdx : 2,
        prov: (prov && prov !== 'CUSTOM') ? prov : '',
        city: $('eCity').value || '', dist: $('eDist').value || '',
        lng: lngVal !== '' ? parseFloat(lngVal) : (editCtx.lng || null),
        useSolar: $('eUseSolar').checked,
        advLateZi: $('eAdv').value,
        note: $('eNote').value
      };
      return patch;
    }
    // 编辑面板市级联动绑定（eCity/eDist change）
    function bindEditDist() {
      var ec = $('eCity'), ed = $('eDist');
      if (ec) ec.addEventListener('change', eSyncCity);
      if (ed) ed.addEventListener('change', function () { editCtx.dist = ed.value; });
    }

    window.APP.readForm = readForm;
    window.APP.writeForm = writeForm;
    window.APP.SHICHEN = SHICHEN;
    window.APP.buildEditForm = buildEditForm;
    window.APP.readEditForm = readEditForm;
    if (window.ARCHIVE) window.ARCHIVE.init();
  }
  window.APP = { version: CONST.VERSION, runTests: runTests, boot: boot, initApp: initApp, getChart: ALGO.getChart };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})();
