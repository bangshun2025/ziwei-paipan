/* 紫微斗数排盘 v0.5.0 — main.js
 * APP：入口 + ?test=1 内嵌自检（L1 常量 / L2 历法 / L3 安星 / L4 端到端）。
 * 依赖：constants.js -> algorithm.js（先加载）。
 */
(function () {
  'use strict';

  var ALGO = window.ALGO;
  var CONST = window.CONST;
  var RENDER = window.RENDER; // v0.6.13-iter：L7 自检直接调用渲染层（render.js 先于 main.js 加载）

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
    // 子斗/流斗（热卜口径锚，2026-09-10 实测：1982戌九月→未 / 2026午→寅）
    T.eq(ch1.center.ziDouZhi, '亥', 'L3 子斗 庚辰年申月(mUse=7)→亥');
    var _lz = ((new Date().getFullYear() - 1984) % 12 + 12) % 12;
    var _zl = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    T.eq(ch1.center.liuDouZhi, _zl[(_lz + 6) % 12], 'L3 流斗 流年支+6');
    // 流年/流月/流日四化（v0.6.4-iter，按运行时日期推算：结构断言防时间漂移）
    T.ok(ch1.center.liuHua && ch1.center.liuHua.nian && ch1.center.liuHua.nian.stars
      && ch1.center.liuHua.nian.stars.length === 4 && ch1.center.liuHua.nian.gz.length === 2, 'L3 流年四化 4 星+干支');
    T.ok(!!ch1.center.liuHua.ri && ch1.center.liuHua.ri.stars.length === 4, 'L3 流日四化 4 星');
    T.ok(!ch1.center.liuHua.yue || ch1.center.liuHua.yue.stars.length === 4, 'L3 流月四化 4 星或空');
    // 流运导航（v0.6.5-iter：流年/流月/流日可选；流月=农历月建五虎遁）
    var _lg1 = ALGO.liuMonthGz(2026, 1);
    T.eq(_lg1.gan + _lg1.zhi, '庚寅', 'L3 流月 2026正月=庚寅');
    var _lg7 = ALGO.liuMonthGz(2026, 7);
    T.eq(_lg7.gan + _lg7.zhi, '丙申', 'L3 流月 2026七月=丙申');
    var _lg12 = ALGO.liuMonthGz(2026, 12);
    T.eq(_lg12.gan + _lg12.zhi, '辛丑', 'L3 流月 2026腊月=辛丑');
    var _lhx = ALGO.liuHuaOf({ year: 2026, month: 7, day: 29 });
    T.eq(_lhx.nian.gz, '丙午', 'L3 流年2026=丙午');
    T.eq(_lhx.nian.stars.join(''), CONST.FOUR_HUA[2].join(''), 'L3 流年四化=丙表值');
    T.eq(_lhx.yue.gz, '丙申', 'L3 流月2026七月=丙申');
    T.ok(_lhx.ri && _lhx.ri.gz.length === 2 && _lhx.ri.stars.length === 4, 'L3 流日四化结构');
    var _md = ALGO.lunarMonthDays(2026, 7);
    T.ok(_md === 29 || _md === 30, 'L3 农历七月天数 29/30 实=' + _md);
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

    // ===== L6 v0.6.12-iter 快捷时间步进（quickStep 纯函数）=====
    var qs;
    qs = ALGO.quickStep({ year: 2026, month: 7, day: 1 }, 'pm', null);
    T.ok(qs && qs.year === 2026 && qs.month === 6 && qs.day === 1, 'L6 上一月 2026七月→六月');
    qs = ALGO.quickStep({ year: 2026, month: 1, day: 15 }, 'pm', null);
    T.ok(qs && qs.year === 2025 && qs.month === 12 && qs.day === 15, 'L6 上一月跨年 正月→上年腊月');
    qs = ALGO.quickStep({ year: 2025, month: 12, day: 1 }, 'nm', null);
    T.ok(qs && qs.year === 2026 && qs.month === 1 && qs.day === 1, 'L6 下一月跨年 腊月→下年正月');
    qs = ALGO.quickStep({ year: 2026, month: 7, day: 29 }, 'nd', null);
    T.ok(qs && qs.year === 2026 && qs.month === 8 && qs.day === 1, 'L6 下一日跨月 七月廿九→八月初一');
    qs = ALGO.quickStep({ year: 2026, month: 7, day: 1 }, 'pd', null);
    T.ok(qs && qs.month === 6 && qs.day === (ALGO.lunarMonthDays(2026, 6) || 29), 'L6 上一日跨月 初一→上月尾日');
    qs = ALGO.quickStep({ year: 2026, month: 7, day: 29 }, 'pd', null);
    T.ok(qs && qs.month === 7 && qs.day === 28, 'L6 上一日 廿九→廿八');
    qs = ALGO.quickStep({ year: 2026, month: 7, day: 29 }, 'pm', null);
    T.ok(qs && qs.month === 6 && qs.day === (Math.min(29, ALGO.lunarMonthDays(2026, 6) || 29)), 'L6 换月后日序按新月长钳制');
    var qtd = { year: 2024, month: 3, day: 5 };
    qs = ALGO.quickStep({ year: 2001, month: 2, day: 3 }, 'cy', qtd);
    T.ok(qs && qs.year === 2024 && qs.month === 2 && qs.day === 3, 'L6 今年=取今天年（月日不变）');
    qs = ALGO.quickStep({ year: 2001, month: 2, day: 3 }, 'cm', qtd);
    T.ok(qs && qs.year === 2024 && qs.month === 3 && qs.day === 3, 'L6 本月=今年+本月（日不变）');
    qs = ALGO.quickStep({ year: 2001, month: 2, day: 3 }, 'cd', qtd);
    T.ok(qs && qs.year === 2024 && qs.month === 3 && qs.day === 5, 'L6 今日=年+月+日全套');

    // ===== L7 v0.6.13-iter 四化线段（宫位框线四分色段）+ 勾选框 =====
    (function () {
      var gRoot = document.createElement('div');
      var tlRoot = document.createElement('div');
      var dEl = document.createElement('div');
      var hEl = document.createElement('div');
      var rz = RENDER.renderAll(hEl, gRoot, tlRoot, dEl, ch1, null, { ln: null, lm: null, ld: null });
      var cells = rz.cells;
      T.eq(gRoot.querySelectorAll('.hua-edge').length, 12, 'L7 12 宫各一条线段条');
      T.eq(gRoot.querySelectorAll('.hua-edge.he-r').length, 4, 'L7 左四宫右缘 4 条');
      T.eq(gRoot.querySelectorAll('.hua-edge.he-l').length, 4, 'L7 右四宫左缘 4 条');
      T.eq(gRoot.querySelectorAll('.hua-edge.he-b').length, 2, 'L7 午未下缘 2 条');
      T.eq(gRoot.querySelectorAll('.hua-edge.he-t').length, 2, 'L7 子丑上缘 2 条');
      T.eq(gRoot.querySelectorAll('.hua-edge .hes').length, 48, 'L7 每条 4 段共 48 段');
      T.ok(gRoot.querySelector('.hua-edge .hes').classList.contains('hes-ming'), 'L7 段序首段=命四化');
      T.ok(gRoot.querySelector('.hua-edge .hes:last-child').classList.contains('hes-lr'), 'L7 段序末段=日四化');
      var pOfZhi = {};
      for (var pz = 0; pz < 12; pz++) pOfZhi[ch1.palaces[pz].zhi] = pz;
      T.ok(!!cells[pOfZhi['巳']].querySelector('.hua-edge.he-r'), 'L7 巳(左列)右缘');
      T.ok(!!cells[pOfZhi['亥']].querySelector('.hua-edge.he-l'), 'L7 亥(右列)左缘');
      T.ok(!!cells[pOfZhi['午']].querySelector('.hua-edge.he-b'), 'L7 午下缘');
      T.ok(!!cells[pOfZhi['子']].querySelector('.hua-edge.he-t'), 'L7 子上缘');
      var cks = gRoot.querySelectorAll('.c-hua-ck');
      T.eq(cks.length, 4, 'L7 四化行勾选框 4 个');
      // v0.6.16-iter（#45 #2）：默认勾选改为 命/年 ✓、月/日 ✗
      T.ok(cks[0].checked && cks[1].checked, 'L7/#45 命、年勾选框默认勾选');
      T.ok(!cks[2].checked && !cks[3].checked, 'L7/#45 月、日勾选框默认未勾选');
      T.ok(cks[0] === gRoot.querySelector('[data-hua="ming"] .c-v-red').nextElementSibling, 'L7 勾选框紧随】之后');
      function litExpect(stars) {
        var hit = {};
        for (var s2 = 0; s2 < stars.length; s2++) {
          for (var p2 = 0; p2 < 12; p2++) {
            if (cells[p2] && cells[p2].querySelector('.star[data-star="' + stars[s2] + '"]')) hit[p2] = 1;
          }
        }
        return Object.keys(hit).length;
      }
      var st = RENDER.huaEdges(gRoot);
      T.eq(st.strips, 12, 'L7 huaEdges 线段条 12');
      T.eq(st.segs, 48, 'L7 huaEdges 段数 48');
      var mingStars = [];
      for (var mk in ch1.center.huaSummary) if (ch1.center.huaSummary.hasOwnProperty(mk)) mingStars.push(mk);
      T.eq(st.lit.ming.length, litExpect(mingStars), 'L7 命线段点亮宫数=含命四化星宫数');
      var sel0 = RENDER.navGet().sel;
      var lh0 = ALGO.liuHuaOf(sel0);
      T.eq(st.lit.ln.length, litExpect(lh0.nian.stars), 'L7 年线段点亮宫数');
      // v0.6.16-iter（#45 #2）：月/日默认未勾选 → 线段不亮；勾选后点亮、取消后恢复全灭
      T.eq(st.lit.ly.length, 0, 'L7/#45 月线段默认不亮（未勾选）');
      T.eq(st.lit.lr.length, 0, 'L7/#45 日线段默认不亮（未勾选）');
      cks[2].checked = true;
      cks[2].dispatchEvent(new Event('change'));
      T.eq(RENDER.huaEdges(gRoot).lit.ly.length, litExpect(lh0.yue.stars), 'L7/#45 勾选月→月线段按命星点亮');
      cks[2].checked = false;
      cks[2].dispatchEvent(new Event('change'));
      T.eq(RENDER.huaEdges(gRoot).lit.ly.length, 0, 'L7/#45 取消月勾选→月线段全灭');
      var lnKeep = st.lit.ln.length;
      cks[0].checked = false;
      cks[0].dispatchEvent(new Event('change'));
      var st2 = RENDER.huaEdges(gRoot);
      T.eq(st2.lit.ming.length, 0, 'L7 取消命勾选→命线段全灭');
      T.eq(st2.lit.ln.length, lnKeep, 'L7 取消命勾选不影响年线段');
      cks[0].checked = true;
      cks[0].dispatchEvent(new Event('change'));
      T.eq(RENDER.huaEdges(gRoot).lit.ming.length, st.lit.ming.length, 'L7 复选→命线段恢复');
    })();

    // ===== L8 v0.6.14-iter（#43）：结果头节数据块（出生年十二节）+ 口径行移除 + liveSolar 行内化 =====
    (function () {
      var ch82 = ALGO.getChart({ y: 1982, m: 10, d: 18, h: 6, mi: 30, gender: 'M', lng: 108.37 });
      var h82 = document.createElement('div');
      RENDER.renderHead(h82, ch82, null);
      // v0.6.21-iter（#50/#51）：十二节自结果头拆出，改由 renderJieqi 独立渲染
      T.eq(h82.querySelector('.jieqi-mini'), null, 'L8/#50 结果头不再含节数据块（已拆出）');
      RENDER.renderJieqi(h82, ch82);
      var mini = h82.querySelector('.jieqi-mini');
      T.ok(!!mini, 'L8/#50 renderJieqi 独立渲染出节数据块');
      T.eq(h82.querySelector('.note-line'), null, 'L8 口径 note-line 已移除');
      var ttl = h82.querySelector('.jm-title');
      T.ok(!!ttl && ttl.textContent.indexOf('十二节（立春→小寒）') >= 0, 'L8 标题=出生年·十二节（立春→小寒）');
      var cols = mini ? mini.querySelectorAll('.jm-col') : [];
      T.eq(cols.length, 12, 'L8 十二节 12 列');
      T.eq(cols[0] ? cols[0].getAttribute('data-term') : '', '立春', 'L8 首列立春');
      T.eq(cols[11] ? cols[11].getAttribute('data-term') : '', '小寒', 'L8 末列小寒（次年1月）');
      var hl = cols[8]; // MONTH_TERM[8]=18=寒露
      var stHl = ALGO.getSolarTerm(1982, 18);
      T.eq(hl.querySelector('.jm-md').textContent, (stHl.getUTCMonth() + 1) + '/' + stHl.getUTCDate(), 'L8 寒露月日=表值');
      T.eq(hl.querySelector('.jm-tm').textContent, '23:02', 'L8 寒露北京时间=23:02（八字锚点）');
      var tstHl = ALGO.trueSolarTime(1982, 10, 8, 23, 2, 108.37);
      T.eq(hl.querySelector('.jm-smd').textContent, tstHl.m + '/' + tstHl.d, 'L8 寒露真太阳月日=ALGO');
      T.eq(hl.querySelector('.jm-stm').textContent, (tstHl.h < 10 ? '0' : '') + tstHl.h + ':' + (tstHl.mi < 10 ? '0' : '') + tstHl.mi, 'L8 寒露真太阳时间=ALGO');
      var gzHl = ALGO.dayGanZhi(1982, 10, 8);
      T.ok(gzHl.gan === '甲' && gzHl.zhi === '子', 'L8 寒露日柱=甲子（1982-10-08，ALGO 完整性）');
      // v0.6.19-iter（#48）：列干支改月建口径（五虎遁；与八字月柱同源）—— 寒露=戌月=庚戌
      T.eq(hl.querySelector('.jm-gan').textContent, '庚', 'L8/#48 寒露月建天干=庚');
      T.eq(hl.querySelector('.jm-zhi').textContent, '戌', 'L8/#48 寒露月建地支=戌（庚戌）');
      var colFirst = cols[0], colLast = cols[11];
      T.ok(colFirst.querySelector('.jm-gan').textContent === '壬' && colFirst.querySelector('.jm-zhi').textContent === '寅', 'L8/#48 立春月建=壬寅（壬戌年五虎遁）');
      T.ok(colLast.querySelector('.jm-gan').textContent === '癸' && colLast.querySelector('.jm-zhi').textContent === '丑', 'L8/#48 小寒月建=癸丑（丑月，次年1月）');
      var mbExpect = ['壬寅', '癸卯', '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑'];
      var mbOk = true;
      for (var mi2 = 0; mi2 < cols.length; mi2++) {
        var mbTxt = cols[mi2].querySelector('.jm-gan').textContent + cols[mi2].querySelector('.jm-zhi').textContent;
        if (mbTxt !== mbExpect[mi2]) mbOk = false;
      }
      T.ok(mbOk, 'L8/#48 十二列月建全列=壬寅…癸丑');
      T.ok(ALGO.liuMonthGz(1982, 9).gan === '庚' && ALGO.liuMonthGz(1982, 9).zhi === '戌', 'L8/#48 liuMonthGz(1982,9)=庚戌（与列值同源）');
      var chN = ALGO.getChart({ y: 2000, m: 8, d: 16, h: 4, mi: 0, gender: 'F', lng: null });
      var hN = document.createElement('div');
      RENDER.renderHead(hN, chN, null);
      RENDER.renderJieqi(hN, chN);
      var colN = hN.querySelectorAll('.jm-col');
      T.ok(colN.length === 12 && colN[0].querySelector('.jm-stm').textContent === '—', 'L8 无出生地真太阳列显示 —');
      T.ok(colN[0].querySelector('.jm-gan').textContent === '戊' && colN[0].querySelector('.jm-zhi').textContent === '寅', 'L8/#48 2000年立春月建=戊寅（庚辰年五虎遁）');
      // v0.6.16-iter（#45 #3）：结果头三行 —— 艺名·性别 → 出生日期 → 八字（日期与八字对调）
      // v0.6.18-iter（#47）：隐私开（默认）会隐藏 新历/农历 两行 —— #45 行序断言前显式关隐私（须在渲染前），断言后还原
      var privPrev8 = window.ARCHIVE ? ARCHIVE.getPrivacyMode() : false;
      if (window.ARCHIVE) ARCHIVE.setPrivacyMode(false);
      var hP = document.createElement('div');
      RENDER.renderHead(hP, chN, { name: '测试', gender: 'F' });
      var plP = hP.querySelector('.person-line');
      var luP = hP.querySelector('.lunar-line');
      var piP = hP.querySelector('.pillars');
      T.ok(!!plP && plP.textContent.indexOf('· 女') >= 0, 'L8/#45 person 行含性别（· 女）');
      T.ok(!!luP && !!piP && !!(luP.compareDocumentPosition(piP) & 4), 'L8/#45 出生日期行在八字行之前（对调）');
      T.ok(!!plP && !!luP && !!(plP.compareDocumentPosition(luP) & 4), 'L8/#45 person 行在出生日期行之前');
      // v0.6.16-iter（#45 #1）：出生地 省/市/区 同容器一行 + locArea 单行
      var elProv = document.getElementById('fProv'), elCity = document.getElementById('fCity'), elDist = document.getElementById('fDist');
      T.ok(!!elProv && !!elCity && !!elDist && elProv.parentElement === elCity.parentElement && elCity.parentElement === elDist.parentElement, 'L8/#45 出生地 省/市/区 同容器一行');
      T.ok(document.querySelectorAll('#locArea .row').length === 1, 'L8/#45 locArea 收为单行（无 row-sub）');
      var ls = document.getElementById('liveSolar');
      T.ok(!!ls, 'L8 表单 liveSolar 存在');
      if (ls) {
        var cs = getComputedStyle(ls);
        T.ok(cs.flexBasis === 'auto', 'L8 liveSolar 不再强制换行（flex-basis 复位 auto）');
        T.ok(String(cs.order) === '0', 'L8 liveSolar order 复位 0');
        // v0.6.15-iter（#44）：压缩字号保一行（「真太阳时 …（…） X时」）
        T.eq(cs.fontSize, '11px', 'L8/#44 liveSolar 字号 11px');
        var csl = getComputedStyle(document.querySelector('.solar-lbl'));
        T.eq(csl.fontSize, '12.5px', 'L8/#44 太阳时标签字号 12.5px');
      }
      if (window.ARCHIVE) ARCHIVE.setPrivacyMode(privPrev8);
    })();

    // ===== L9 v0.6.17-iter（#46）：宫格底部两行居中 —— 大限宫名与本命宫名居中对齐 =====
    (function () {
      var gRoot = document.createElement('div');
      document.body.appendChild(gRoot); // 需附着布局才能测几何（测完移除）
      RENDER.renderAll(document.createElement('div'), gRoot, document.createElement('div'), document.createElement('div'), ch1, null, { ln: null, lm: null, ld: null });
      var cells = gRoot.querySelectorAll('.cell');
      var c0 = cells[0];
      var fcs = getComputedStyle(c0.querySelector('.p-foot')).alignItems;
      T.ok(fcs === (window.innerWidth > 640 ? 'center' : 'stretch'), 'L9/#46 宫脚横行轴对齐档位（>640 center / ≤640 stretch）');
      T.eq(getComputedStyle(c0.querySelector('.p-f1')).justifyContent, 'center', 'L9/#46 本命宫名行居中（p-f1）');
      var plain = null;
      for (var i9 = 0; i9 < cells.length; i9++) {
        if (!cells[i9].querySelector('.soul-star') && !cells[i9].querySelector('.tag.body-tag')) { plain = cells[i9]; break; }
      }
      T.ok(!!plain, 'L9/#46 存在普通格（无★/身标签）');
      if (plain) {
        var gzm9 = parseFloat(getComputedStyle(plain.querySelector('.p-gz')).marginRight);
        T.ok(window.innerWidth > 640 ? gzm9 < 0 : gzm9 === 0, 'L9/#46 干支负补偿档位（>640 生效 / ≤640 折行免补偿）');
        function ctr9(el) { var r9 = el.getBoundingClientRect(); return (r9.left + r9.right) / 2; }
        var cc9 = ctr9(plain), nc9 = ctr9(plain.querySelector('.p-name')), dc9 = ctr9(plain.querySelector('.p-dx'));
        T.ok(Math.abs(nc9 - cc9) <= 2, 'L9/#46 本命宫名中心≈格中心（±2px）');
        T.ok(Math.abs(dc9 - nc9) <= 2, 'L9/#46 大限宫名中心≈本命宫名中心（居中对齐 ±2px）');
      }
      document.body.removeChild(gRoot);
    })();

    // ===== L10 v0.6.18-iter（#47）：新历生日行 + 隐私勾选（默认开）显示规则 =====
    (function () {
      var ch47 = ALGO.getChart({ y: 1982, m: 10, d: 18, h: 6, mi: 30, gender: 'M', lng: 108.37 });
      var prev47 = window.ARCHIVE ? ARCHIVE.getPrivacyMode() : false;
      if (window.ARCHIVE) ARCHIVE.setPrivacyMode(false);
      var hA = document.createElement('div');
      RENDER.renderHead(hA, ch47, { name: '测试', gender: 'M' });
      var sl = hA.querySelector('.solar-line');
      var ll = hA.querySelector('.lunar-line');
      T.ok(!!sl && sl.textContent === '1982年10月18日 · 06:30', 'L10/#47 新历生日行=1982年10月18日 · 06:30');
      T.ok(!!sl && !!ll && !!(sl.compareDocumentPosition(ll) & 4), 'L10/#47 新历行在农历行之前（上方）');
      var plA = hA.querySelector('.person-line');
      T.ok(!!plA && plA.textContent.indexOf('测试') >= 0, 'L10/#47 隐私关时显示原姓名');
      if (window.ARCHIVE) ARCHIVE.setPrivacyMode(true);
      var hB = document.createElement('div');
      RENDER.renderHead(hB, ch47, { name: '测试', gender: 'M' });
      T.ok(!hB.querySelector('.solar-line') && !hB.querySelector('.lunar-line'), 'L10/#47 隐私开时隐藏新历/农历两行');
      var plB = hB.querySelector('.person-line');
      T.ok(!!plB && plB.textContent.indexOf('匿名') >= 0, 'L10/#47 隐私开时姓名匿名化（匿名 · 男）');
      T.ok(!!hB.querySelector('.pillars') && !hB.querySelector('.jieqi-mini'), 'L10/#47 隐私开时八字保留（十二节已移出结果头 #50）');
      var hJ = document.createElement('div');
      RENDER.renderJieqi(hJ, ch47);
      T.ok(!!hJ.querySelector('.jieqi-mini') && hJ.querySelectorAll('.jm-col').length === 12, 'L10/#50 十二节独立块常显（12 列、与隐私无关）');
      var cpk = document.getElementById('chkPrivacy');
      T.ok(!!cpk && cpk.type === 'checkbox' && cpk.hasAttribute('checked'), 'L10/#47 隐私勾选框存在且 HTML 默认勾选');
      // v0.6.22-iter（#52）：勾选框驻结果头通栏行尾（仍在 .head-wrap 内、#resultHead 之后；#resultHead 隐藏时同步隐藏）
      T.ok(!!cpk && !!cpk.closest('.head-wrap') && !!document.querySelector('.head-wrap > #resultHead'), 'L10/#52 勾选框位于结果头容器 .head-wrap（通栏行内）');
      // v0.6.22-iter（#52）：结果头一行序（姓名→新历→农历→四柱）＋详情分行结构
      var pzC = hA.querySelector('.pillars');
      T.ok(!!plA && !!sl && !!ll && !!pzC
        && !!(plA.compareDocumentPosition(sl) & 4) && !!(sl.compareDocumentPosition(ll) & 4) && !!(ll.compareDocumentPosition(pzC) & 4),
        'L10/#52 结果头一行序：姓名→新历→农历→四柱');
      var piBro = -1;
      for (var bi = 0; bi < ch47.palaces.length; bi++) if (ch47.palaces[bi].name === '兄弟') piBro = bi;
      var hD = document.createElement('div');
      hD.innerHTML = RENDER.detailHtml(ch47, piBro);
      var dgs = hD.querySelectorAll('.dg');
      T.ok(!!hD.querySelector('.dt-l1') && !!hD.querySelector('.dt-l2')
        && hD.querySelector('.dt-l1').textContent.indexOf('（') >= 0
        && hD.querySelector('.dt-l2').textContent.indexOf('大限') >= 0,
        'L10/#52 详情标题两行：本命X宫（干支）/ 大限X宫');
      T.ok(dgs.length >= 4 && dgs.length <= 5, 'L10/#52 详情分组 4-5 组（岁数/主辅/杂曜/神煞/三方四正）');
      T.ok(dgs.length > 0 && /^\d+-\d+岁$/.test(dgs[0].textContent), 'L10/#52 详情首组=大限岁数独占一行');
      T.eq(hD.querySelectorAll('.g-i').length, 4, 'L10/#52 神煞四项各自不断词（g-i ×4）');
      if (window.ARCHIVE && ARCHIVE.applyPrivacy) {
        ARCHIVE.applyPrivacy(false);
        T.eq(ARCHIVE.getPrivacyMode(), false, 'L10/#47 applyPrivacy(false) 生效（公开 API）');
        ARCHIVE.applyPrivacy(prev47);
        T.eq(ARCHIVE.getPrivacyMode(), prev47, 'L10/#47 隐私态复原');
      }
    })();

    // ===== L11 v0.6.21-iter（#50/#51）：新版面结构（DOM 顺序断言，与视口宽度无关）=====
    (function () {
      var q = function (s) { return document.querySelector(s); };
      var after = function (a, b) { return !!(a && b && (a.compareDocumentPosition(b) & 4)); };
      var ip = q('.input-panel'), rp = q('#resultPanel');
      T.ok(after(ip, rp), 'L11/#50 输入区在结果区之前（版面最上方通栏）');
      var tl = q('.timeline-panel'), rc = q('.right-col');
      T.ok(after(tl, rc), 'L11/#51 时间轴在右列之前（左列=盘面左边）');
      var hw = q('.head-wrap'), cw = q('.chart-wrap'), rm = q('.result-main');
      T.ok(!!hw && hw.parentNode === rp && after(hw, rm) && after(hw, cw), 'L11/#52 结果头通栏（结果区内、两列之前、盘面之前；与输入区同宽行）');
      T.ok(after(q('#resultHead'), q('.head-wrap .privacy-ck')), 'L11/#52 隐私按钮在结果头之后（通栏行尾）');
      var jp = q('.jieqi-panel'), lc = q('.left-col'), tl2 = q('.timeline-panel');
      // ===== v0.6.23-iter（#53）：十二节入左列（时间轴下方；宽度/横滑/盘面放大由 CDP 布局回归验证）=====
      T.ok(!!lc && !!jp && jp.closest('.left-col') === lc && after(tl2, jp), 'L11/#53 十二节位于左列、时间轴之后（时间轴下方）');
      T.ok(!!jp && !q('.right-col .jieqi-panel'), 'L11/#53 十二节已不在右列（自右列移出）');
      T.ok(!!lc && lc.parentNode === rm, 'L11/#53 左列（时间轴+十二节）为结果主区直接子级');
      var dp = q('.detail-panel');
      T.ok(!!dp && after(cw, dp), 'L11/#50 宫位详情紧随盘面之后（宽屏同排、右上）');
    })();

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
      chipShichen: null, fHour: $('fHour'), fMinute: $('fMinute'), timeSc: $('timeSc'),
      gender: document.querySelectorAll('input[name="gender"]'),
      inName: $('inName'), inNickname: $('inNickname'), inYiming: $('inYiming'),
      fProv: $('fProv'), fCity: $('fCity'), fDist: $('fDist'),
      fLng: $('fLng'), fTrueSolar: $('fTrueSolar'), liveSolar: $('liveSolar'), locArea: $('locArea'),
      btnCalc: $('btnCalc'), calcErr: $('calcErr'), dateErr: $('dateErr'),
      btnAi: $('btnAi'), aiMask: $('aiMask'), aiInput: $('aiInput'),
      aiPreview: $('aiPreview'), aiErr: $('aiErr'), aiApply: $('aiApply'), aiClose: $('aiClose'),
      resultPanel: $('resultPanel'), resultHead: $('resultHead'), jieqi: $('jieqiPanel'),
      chartWrap: $('chartWrap'), timeline: $('timeline'), detailBody: $('detailBody'),
      lnTimeline: $('lnTimeline'), lmTimeline: $('lmTimeline'), ldTimeline: $('ldTimeline'),
      detailPanel: $('detailPanel'),
      btnTestPage: $('btnTestPage')
    };

    var state = { mode: 'solar', sy: 1982, sm: 10, sd: 18, ly: 1982, lm: 9, ld: 2, leap: false, lastChart: null, name: '', nickname: '', yiming: '', prov: '', city: '', dist: '', h: 6, mi: 30, scIdx: 3 };

    // ---- 填充基础下拉 ----
    function fillDateSelects(mode) {
      if (mode === 'solar') {
        var dim = daysInSolarMonth(+els.fYear.value, +els.fMonth.value);
        clearSel(els.fDay);
        for (var d = 1; d <= dim; d++) addOpt(els.fDay, String(d), d);
      } else {
        var ly = +els.fYear.value, lm = +els.fMonth.value, leap = els.fLeap.checked;
        var li = lunarYearInfo(ly);
        if (li) {
          var max = leap ? li.leapDays : li.mDays[lm - 1];
          clearSel(els.fDay);
          for (var d2 = 1; d2 <= max; d2++) addOpt(els.fDay, String(d2), d2);
        }
      }
    }
    function fillYearMonth() {
      clearSel(els.fYear);
      for (var y = 1800; y <= 2100; y++) addOpt(els.fYear, String(y), y);
      clearSel(els.fMonth);
      for (var m = 1; m <= 12; m++) addOpt(els.fMonth, String(m), m);
    }
    fillYearMonth();
    setSel(els.fYear, 1982); setSel(els.fMonth, 10);
    fillDateSelects('solar'); setSel(els.fDay, 18);

    // ---- 出生时间：时/分输入 → 时辰（对齐 ALGO.hourToShichen：+60 整除 120，23 时起晚子）----
    function scIdxOfTime(hh, mm) {
      if (!(hh >= 0 && hh <= 23)) hh = 0;
      if (!(mm >= 0 && mm <= 59)) mm = 0;
      var zhiIdx = Math.floor(((hh * 60 + mm + 60) % 1440) / 120);
      if (zhiIdx === 0) return (hh >= 23) ? 12 : 0;
      return zhiIdx;
    }
    function syncTimeSc() {
      if (!els.timeSc) return;
      var idx = scIdxOfTime(+els.fHour.value || 0, +els.fMinute.value || 0);
      var sc = SHICHEN[idx];
      els.timeSc.textContent = '≈' + sc.name + (sc.late ? '' : '时');
    }
    function applyTimeForm() {
      var hh = parseInt(els.fHour.value, 10);
      var mm = parseInt(els.fMinute.value, 10);
      if (isNaN(hh) || hh < 0) hh = 0; if (hh > 23) hh = 23;
      if (isNaN(mm) || mm < 0) mm = 0; if (mm > 59) mm = 59;
      els.fHour.value = hh; els.fMinute.value = mm;
      state.h = hh; state.mi = mm; state.scIdx = scIdxOfTime(hh, mm);
      syncTimeSc();
      refreshLiveSolar();
      if (state.lastChart) doCalc();
    }
    els.fHour.addEventListener('input', applyTimeForm);
    els.fMinute.addEventListener('input', applyTimeForm);
    els.fHour.addEventListener('change', applyTimeForm);
    els.fMinute.addEventListener('change', applyTimeForm);
    applyTimeForm();

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
      // v0.6.16-iter（#45 #1）：占位文案缩短适配 108px 宽（「默认按北京时间 120°E」口径见页脚说明）
      addOpt(els.fProv, '— 未选择 —', '');
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
    els.fTrueSolar.addEventListener('change', function () { if (els.locArea) els.locArea.classList.toggle('hidden', !els.fTrueSolar.checked); refreshLiveSolar(); if (state.lastChart) doCalc(); });
    els.gender.forEach(function (r) { r.addEventListener('change', function () { if (state.lastChart) doCalc(); }); });

    // ---- liveSolar：实时真太阳时显示（复用 ALGO.trueSolarTime）----
    function scNameOf(hh, mm) {
      var sc = SHICHEN[scIdxOfTime(hh, mm)];
      return sc ? sc.name : '';
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
      // v0.6.15-iter（#44 #2）：时辰常显在括号后（如「卯时」）；跨时辰时附「与所选时辰不同」提示
      var txt = '真太阳时 ' + pad(t.h) + ':' + pad(t.mi) + '（经度+均时差 ' + (t.offsetMin >= 0 ? '+' : '') + t.offsetMin.toFixed(0) + ' 分）' + (name ? ' ' + name + '时' : '');
      if (name && name !== SHICHEN[state.scIdx].name) txt += '（与所选时辰不同）';
      els.liveSolar.textContent = txt;
    }
    function currentSolarCached() {
      var v = currentSolar();
      return v;
    }

    // ---- 口径（宪法 v0.2.0 固定）：年界=立春、月轴=节气、子时统一归次日（forward）----
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
      // 出生时间（真实时分直填，时辰由 applyTimeForm 换算）
      if (r.hour !== null) {
        els.fHour.value = r.hour;
        els.fMinute.value = (typeof r.min === 'number') ? r.min : 0;
        applyTimeForm();
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
      window.RENDER.renderAll(els.resultHead, els.chartWrap, els.timeline, els.detailPanel, chart, person,
        { ln: els.lnTimeline, lm: els.lmTimeline, ld: els.ldTimeline });
      if (els.jieqi) window.RENDER.renderJieqi(els.jieqi, chart); // v0.6.21-iter（#50）：十二节独立块（#53 起驻左列、时间轴下方）
      // 滚到结果
      if (els.resultPanel.scrollIntoView) els.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    els.btnCalc.addEventListener('click', function () { doCalc(); });

    // v0.6.23-iter（#53）：十二节横向轮动轴 —— 鼠标悬停滚轮 = 横滑（触控板/触摸原生；到边放行让页面继续滚）
    (function () {
      var jp = els.jieqi;
      if (!jp || !jp.addEventListener) return;
      jp.addEventListener('wheel', function (e) {
        var wrap = e.target && e.target.closest ? e.target.closest('.jm-wrap') : null;
        if (!wrap) return;
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // 横向手势原生处理
        var max = wrap.scrollWidth - wrap.clientWidth;
        if (max <= 0) return;
        if ((wrap.scrollLeft <= 0 && e.deltaY < 0) || (wrap.scrollLeft >= max && e.deltaY > 0)) return;
        wrap.scrollLeft += e.deltaY;
        e.preventDefault();
      }, { passive: false });
    })();

    // 初始默认排盘示例（1982-10-18 6:30 卯时 男 · 广西南宁青秀区 · 真太阳时）
    setSel(els.fYear, 1982); setSel(els.fMonth, 10); fillDateSelects('solar'); setSel(els.fDay, 18);
    for (var gi = 0; gi < els.gender.length; gi++) els.gender[gi].checked = (els.gender[gi].value === 'M');
    fillProv();
    setSel(els.fProv, '广西'); fillCity('广西', '南宁市'); setSel(els.fCity, '南宁市'); fillDist('南宁市', '青秀区'); setSel(els.fDist, '青秀区');
    els.fLng.classList.add('hidden'); els.fLng.value = '';
    els.fLng.value = placeLngOf() || '';
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
          note: ''      };
      return snap;
    }
    function writeForm(s) {
      if (!s) return false;
      if (state.mode !== s.mode) setMode(s.mode);
      setSel(els.fYear, s.y); setSel(els.fMonth, s.m);
      els.fLeap.checked = !!s.leap;
      if (state.mode === 'lunar') syncLeapLbl();
      fillDateSelects(state.mode);
      setSel(els.fDay, s.d);
      // 出生时间回填：优先真实时/分（v0.5.1+）；旧档仅 scIdx 时取时辰代表点
      if (typeof s.h === 'number' && s.h >= 0) {
        els.fHour.value = s.h;
        els.fMinute.value = (typeof s.mi === 'number' && s.mi >= 0) ? s.mi : 0;
      } else {
        var sc0 = (typeof s.scIdx === 'number' && s.scIdx >= 0 && s.scIdx < SHICHEN.length) ? s.scIdx : 2;
        els.fHour.value = SHICHEN[sc0].h; els.fMinute.value = SHICHEN[sc0].mi;
      }
      state.h = +els.fHour.value; state.mi = +els.fMinute.value;
      state.scIdx = scIdxOfTime(state.h, state.mi);
      syncTimeSc();
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
        // v0.6.16-iter（#45 #1）：自定义经度/无出生地时，市/区一并收起（与 CUSTOM 联动一致）
        clearSel(els.fCity); els.fCity.disabled = true;
        clearSel(els.fDist); els.fDist.disabled = true;
        els.fLng.classList.toggle('hidden', !s.lng);
        els.fLng.value = s.lng || '';
      }
      els.fTrueSolar.checked = s.useSolar !== false;
      if (els.locArea) els.locArea.classList.toggle('hidden', !els.fTrueSolar.checked);
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
      for (var d = 1; d <= max; d++) addOpt(ed, String(d), d);
      var cur = editCtx.d;
      if (cur >= 1 && cur <= max) setSel(ed, cur);
    }
    function buildEditForm(s) {
      var si0 = (typeof s.scIdx === 'number' && s.scIdx >= 0 && s.scIdx < SHICHEN.length) ? s.scIdx : 2;
      var eh = (typeof s.h === 'number' && s.h >= 0) ? s.h : SHICHEN[si0].h;
      var em = (typeof s.mi === 'number' && s.mi >= 0) ? s.mi : (SHICHEN[si0].mi || 0);
      editCtx = { mode: s.mode, prov: s.prov, city: s.city, dist: s.dist, d: s.d, lng: (typeof s.lng === 'number') ? s.lng : null, lngCustom: !!(!s.prov && s.lng), h: eh, mi: em };
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
      h += '<div class="row"><span class="lbl">出生时间</span>' +
        '<input type="number" id="eHour" class="time-num" min="0" max="23" step="1" value="' + editCtx.h + '"><span>时</span>' +
        '<input type="number" id="eMin" class="time-num" min="0" max="59" step="1" value="' + editCtx.mi + '"><span>分</span>' +
        '<span class="sc-hint" id="eTimeSc"></span></div>';
      h += '<div class="row"><span class="lbl">出生地</span><select id="eProv"><option value="">— 未选择 —</option></select>' +
        '<select id="eCity" disabled></select><select id="eDist" disabled></select>' +
        '<input type="number" id="eLng" step="0.1" min="73" max="136" placeholder="经度°E" style="width:90px" class="hidden"></div>';
      h += '<div class="row"><label class="lbl"><input type="checkbox" id="eUseSolar"' + (s.useSolar !== false ? ' checked' : '') + '> 按真太阳时校正</label>' +
        '<span class="adv-note">晚子时归次日（宪法口径固定）</span></div>';
      h += '<div class="row"><span class="lbl">备注</span><textarea id="eNote" rows="2" maxlength="200" style="flex:1">' + eEsc(s.note) + '</textarea></div>';
      b.innerHTML = h;
      var ey = $('eYear'), em = $('eMonth'), ed = $('eDay'), eleap = $('eLeap');
      for (var y = 1800; y <= 2100; y++) addOpt(ey, String(y), y);
      for (var m2 = 1; m2 <= 12; m2++) addOpt(em, String(m2), m2);
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
      var eSyncTime = function () {
        var eh2 = parseInt($('eHour').value, 10);
        var em2 = parseInt($('eMin').value, 10);
        if (isNaN(eh2) || eh2 < 0) eh2 = 0; if (eh2 > 23) eh2 = 23;
        if (isNaN(em2) || em2 < 0) em2 = 0; if (em2 > 59) em2 = 59;
        $('eHour').value = eh2; $('eMin').value = em2;
        editCtx.h = eh2; editCtx.mi = em2;
        var scE = SHICHEN[scIdxOfTime(eh2, em2)];
        $('eTimeSc').textContent = '≈' + scE.name + (scE.late ? '' : '时');
      };
      $('eHour').addEventListener('input', eSyncTime);
      $('eMin').addEventListener('input', eSyncTime);
      $('eHour').addEventListener('change', eSyncTime);
      $('eMin').addEventListener('change', eSyncTime);
      eSyncTime();
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
        scIdx: scIdxOfTime(editCtx.h, editCtx.mi),
        h: editCtx.h, mi: editCtx.mi,
        prov: (prov && prov !== 'CUSTOM') ? prov : '',
        city: $('eCity').value || '', dist: $('eDist').value || '',
        lng: lngVal !== '' ? parseFloat(lngVal) : (editCtx.lng || null),
        useSolar: $('eUseSolar').checked,
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
