/* 紫微斗数排盘 v0.4.0 — algorithm.js（历法口径 v0.2.0 宪法）
 * ALGO：历法换算 + 安星核心（纯函数，无 DOM）。
 * 口径：年=立春换年、月=节气十二节、日=农历日序（安紫微 D）、时=时辰。
 * 依据：docs/ALGORITHM_v0.2.0草案_生命算法紫微模块.md（v0.2.0 宪法）。
 * 依赖：window.CONST（constants.js 先加载）。
 */
(function () {
  'use strict';

  var C = window.CONST;
  var GAN = C.GAN, ZHI = C.ZHI, GAN_IDX = C.GAN_IDX, ZHI_IDX = C.ZHI_IDX;
  var PALACES = C.PALACES, TIGER_FIRST = C.TIGER_FIRST;
  var JU_NAME = C.JU_NAME, JU_NUM = C.JU_NUM;
  var ZIWEI_GROUP = C.ZIWEI_GROUP, TIANFU_GROUP = C.TIANFU_GROUP;
  var LU_CUN = C.LU_CUN, TIAN_MA = C.TIAN_MA, KUI_YUE = C.KUI_YUE;
  var FOUR_HUA = C.FOUR_HUA, HUA_NAME = C.HUA_NAME;
  var MING_ZHU = C.MING_ZHU, SHEN_ZHU = C.SHEN_ZHU;
  var CFG = C.CONFIG;

  // ===== 基础修正 =====
  function fix(n, m) { return ((n % m) + m) % m; }
  function fix12(n) { return fix(n, 12); }
  function fix10(n) { return fix(n, 10); }
  function fix6(n) { return fix(n, 6); }
  function fix60(n) { return fix(n, 60); }

  // ===== 公历工具 =====
  function isLeapSolar(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function solarDim(y, m) {
    var t = [31, isLeapSolar(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return t[m - 1];
  }
  function absDay(y, m, d) { return Math.round(Date.UTC(y, m - 1, d) / 86400000); }
  function plusDays(y, m, d, n) {
    var dt = new Date(Date.UTC(y, m - 1, d) + n * 86400000);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
  }

  // ===== 农历表 =====
  var BASE = C.LUNAR_BASE;
  function idxOf(y) { return y - BASE; }
  function leapMonthOf(info) { return info & 0xF; }
  function mLength(info, m, isLeap) {
    if (isLeap) return (info >> 20) & 1 ? 30 : 29;
    return (info >> (3 + m)) & 1 ? 30 : 29;
  }
  function cnyOf(y) {
    var r = C.LUNAR_NEW_YEAR[idxOf(y)];
    if (!r) return null;
    return { m: r[0], d: r[1] };
  }

  // 公历 -> 农历（ALGORITHM §2.2）
  function solarToLunar(y, m, d) {
    var maxY = BASE + C.LUNAR_INFO.length - 1;
    if (y < BASE || y > maxY) return null;
    var cy = cnyOf(y);
    if (!cy) return null;
    // 判断该公历日属于哪个农历年：>= 当年正月初一 ? 当年 : 前一年
    var ly = (m > cy.m || (m === cy.m && d >= cy.d)) ? y : y - 1;
    if (ly < BASE) return null;
    var info = C.LUNAR_INFO[idxOf(ly)];
    if (info === undefined) return null;
    var cny = cnyOf(ly);
    var day0 = absDay(ly, cny.m, cny.d);
    var off = absDay(y, m, d) - day0;
    if (off < 0) return null;
    var leap = leapMonthOf(info);
    var acc = 0;
    for (var mm = 1; mm <= 12; mm++) {
      var segs = [];
      segs.push({ m: mm, isLeap: false, len: mLength(info, mm, false) });
      if (mm === leap) segs.push({ m: mm, isLeap: true, len: mLength(info, mm, true) });
      for (var k = 0; k < segs.length; k++) {
        var s = segs[k];
        if (off < acc + s.len) {
          return { lunarYear: ly, lunarMonth: s.m, lunarDay: off - acc + 1, isLeap: s.isLeap, leapMonth: leap };
        }
        acc += s.len;
      }
    }
    return null; // 越界（不应发生）
  }

  // 农历 -> 公历（ALGORITHM §2.2）
  function lunarToSolar(ly, lm, ld, isLeap) {
    var info = C.LUNAR_INFO[idxOf(ly)];
    if (info === undefined) return null;
    var leap = leapMonthOf(info);
    if (isLeap && lm !== leap) return null; // 请求了不存在的闰月
    var cny = cnyOf(ly);
    var off = 0;
    for (var mm = 1; mm < lm; mm++) {
      off += mLength(info, mm, false);
      if (mm === leap) off += mLength(info, mm, true);
    }
    if (isLeap) off += mLength(info, lm, false); // 闰月在本月之后
    off += ld - 1;
    return plusDays(ly, cny.m, cny.d, off);
  }

  // ===== 节气轴（v0.2.0 宪法 §3.1：年=立春换年、月=节气十二节；§3.2：日仍取农历日序）=====
  // SOLAR_TERMS：sxtwl 生成（1000-2100），packed=daysFrom20000101*86400+seconds，秒为北京时间钟表。
  // getSolarTerm 返回“BJT-as-UTC”假尺度 Date（getTime() 数值=北京钟表时间当作 UTC），
  // 与 birthMs=Date.UTC(y,m-1,d,h,mi) 直接可比（与八字项目已验证实现同构）。
  function getSolarTerm(y, n) {
    // n: 0=小寒 ... 23=冬至
    var packed = C.SOLAR_TERMS[(y - 1000) * 24 + n];
    if (packed === undefined) return null; // 表外年份（999 / 2101 边界）
    var days = Math.trunc(packed / 86400);
    var secs = packed % 86400;
    if (secs < 0) { secs += 86400; days -= 1; }
    return new Date(Date.UTC(2000, 0, 1) + days * 86400000 + secs * 1000 - 288e5);
  }

  // v0.2.0：把出生钟表时刻（真太阳时修正后）分解为节气口径的年与月序
  // 返回 { year: 干支用年（立春换年）, monthIdx: 0=寅月..11=丑月, monthZhi }；表外返回 null
  function qiYearMonthOf(y, m, d, h, mi) {
    var birthMs = Date.UTC(y, m - 1, d, h || 0, mi || 0);
    var lc = getSolarTerm(y, 2); // 立春
    if (!lc) return null; // 节气表外年份
    var year = (birthMs < lc.getTime()) ? y - 1 : y; // 立春（含时刻）后才是 y 年
    var beforeLC = birthMs < lc.getTime();
    for (var i = 0; i < 12; i++) {
      var termN = C.MONTH_TERM[i]; // 本月起始节：立春(2)..大雪(22)、小寒(0)
      var stY = y;
      if (i === 10) stY = beforeLC ? y - 1 : y;      // 子月大雪（12 月）：立春前归前一年
      else if (i === 11) stY = beforeLC ? y : y + 1; // 丑月小寒（1 月）：立春后归次年
      var st = getSolarTerm(stY, termN);
      var stMs = st ? st.getTime() : -Infinity;      // 表外（999 大雪）视为已进入本月
      var nextI = (i + 1) % 12;
      var nextN = C.MONTH_TERM[nextI];
      var nextY = (nextN <= termN) ? stY + 1 : stY;  // 跨年节（小寒/立春）顺延一年
      var nextSt = getSolarTerm(nextY, nextN);
      var nextMs = nextSt ? nextSt.getTime() : Infinity; // 表外（2101 节）视为未到
      if (birthMs >= stMs && birthMs < nextMs) {
        return { year: year, monthIdx: i, monthZhi: C.ZHI[(i + 2) % 12] };
      }
    }
    return { year: year, monthIdx: 11, monthZhi: C.ZHI[1] }; // 兜底丑月（理论不可达）
  }

  // ===== 干支 =====
  function yearGanZhi(y) { // 农历年 y（1984=甲子）
    var idx = fix60(y - 4);
    return { ganIdx: idx % 10, zhiIdx: idx % 12, gan: GAN[idx % 10], zhi: ZHI[idx % 12], idx: idx };
  }
  function dayGanZhi(y, m, d) { // 1900-01-01 = 甲戌 (idx 10)
    var diff = absDay(y, m, d) - absDay(1900, 1, 1);
    var idx = fix60(diff + 10);
    return { ganIdx: idx % 10, zhiIdx: idx % 12, gan: GAN[idx % 10], zhi: ZHI[idx % 12], idx: idx };
  }
  function hourGanZhi(dayGanIdx, t) { // 五鼠遁；t=时支序号
    var sub = { 0: 0, 5: 0, 1: 2, 6: 2, 2: 4, 7: 4, 3: 6, 8: 6, 4: 8, 9: 8 }[dayGanIdx];
    var ganIdx = fix10(sub + t);
    return { ganIdx: ganIdx, zhiIdx: t, gan: GAN[ganIdx], zhi: ZHI[t] };
  }

  // 时间 -> 时辰（ALGORITHM §1.5）
  function hourToShichen(h, mi) {
    var zhiIdx = Math.floor(((h * 60 + mi + 60) % 1440) / 120);
    var lateZi = (h >= 23);
    return { zhiIdx: zhiIdx, lateZi: lateZi };
  }

  // ===== 真太阳时（ALGORITHM §2.6；公式沿用八字已验证实现）=====
  function dayOfYear(y, m, d) {
    var doy = d;
    for (var i = 1; i < m; i++) doy += solarDim(y, i);
    return doy;
  }
  function equationOfTime(y, m, d) {
    var doy = dayOfYear(y, m, d);
    var B = (doy - 1) * 2 * Math.PI / 365;
    return 229.18 * (0.000075 + 0.001868 * Math.cos(B) - 0.032077 * Math.sin(B)
      - 0.014615 * Math.cos(2 * B) - 0.040849 * Math.sin(2 * B));
  }
  function trueSolarTime(y, m, d, h, mi, lng) {
    var lngOffset = (lng - 120) * 4;
    var eot = equationOfTime(y, m, d);
    var offsetMin = lngOffset + eot;
    var totalMin = h * 60 + mi + offsetMin;
    var adjMin = totalMin;
    var adjD = d, adjM = m, adjY = y;
    while (adjMin < 0) { adjMin += 1440; adjD -= 1; }
    while (adjMin >= 1440) { adjMin -= 1440; adjD += 1; }
    if (adjD < 1) {
      adjM -= 1;
      if (adjM < 1) { adjM = 12; adjY -= 1; }
      adjD = solarDim(adjY, adjM);
    } else if (adjD > solarDim(adjY, adjM)) {
      adjD -= solarDim(adjY, adjM);
      adjM += 1;
      if (adjM > 12) { adjM = 1; adjY += 1; }
    }
    var adjH = Math.floor(adjMin / 60);
    var adjMi = Math.round(adjMin % 60);
    if (adjMi === 60) { adjMi = 0; adjH += 1; }
    return { y: adjY, m: adjM, d: adjD, h: adjH, mi: adjMi, offsetMin: offsetMin };
  }
    // ===== 输入预处理（ALGORITHM §2.1-§2.6）=====
  // input: {y,m,d,h,mi,gender,lng|null,timeIndexHack?}
  function preprocess(input) {
    var y = input.y, m = input.m, d = input.d, h = input.h || 0, mi = input.mi || 0;
    var lng = (typeof input.lng === 'number') ? input.lng : null;
    var note = [];
    var tst = null;
    if (lng !== null) {
      tst = trueSolarTime(y, m, d, h, mi, lng);
      y = tst.y; m = tst.m; d = tst.d; h = tst.h; mi = tst.mi;
      note.push('真太阳时修正：经度 ' + lng + '，偏移 ' + Math.round(tst.offsetMin) + ' 分');
    } else {
      note.push('未输入出生地，按北京时间排盘');
    }
    var sh = hourToShichen(h, mi);
    // 农历「显示文本」基于输入原日（§2.4.1 lunarDisplay；经真太阳时修正、晚子时不进位）——仅供展示
    var lunDisplay = solarToLunar(y, m, d);
    // 晚子时归次日：整日 +1 后再换算（D-3 forward）；lunar/mUse/D 供安星
    var eff = (CFG.DAY_DIVIDE === 'forward' && sh.lateZi) ? plusDays(y, m, d, 1) : { y: y, m: m, d: d };
    var lun = solarToLunar(eff.y, eff.m, eff.d);
    if (!lun) throw new Error('历法超出支持范围(1800-2200)：' + input.y + '-' + input.m + '-' + input.d);
    if (!lunDisplay) lunDisplay = lun; // 极边缘兜底（1799/2200 边界晚子时），显示与安星一致
    // v0.2.0 节气口径（宪法 §3.1/§3.2）：年=立春换年（YEAR_DIVIDE='exact'）、月=节气十二节
    // （MONTH_AXIS='solar'）；农历仅剩两个用途：显示文本（lunarDisplay）与安紫微日序 D。
    // 节气归属按真太阳时修正后的钟表时刻（含时分）判定；DAY_DIVIDE forward 只影响日序换算。
    var qi = qiYearMonthOf(y, m, d, h, mi);
    if (!qi) throw new Error('节气表超出支持范围(1000-2100)：' + y + '-' + m + '-' + d);
    var mUse = qi.monthIdx + 1; // 实用月序 1..12：1=寅月（立春起），与命宫起寅顺数同尺度
    var ygz = yearGanZhi(qi.year);
    note.push('节气口径 v0.2.0：年按立春（' + qi.year + '年）、月按节气（' + qi.monthZhi + '月）、日仍按农历');
    var dgz = dayGanZhi(eff.y, eff.m, eff.d);
    var hgz = hourGanZhi(dgz.ganIdx, sh.zhiIdx);
    return {
      solar: { y: y, m: m, d: d }, tst: tst, effSolar: eff, note: note,
      hour: h, minute: mi, shichen: sh, timeIndex: sh.lateZi ? 12 : sh.zhiIdx, tZhi: sh.zhiIdx,
      lunar: lun, lunarDisplay: lunDisplay, mUse: mUse, lateZi: sh.lateZi,
      qiYear: qi.year, qiMonthIdx: qi.monthIdx, qiMonthZhi: qi.monthZhi,
      yearGanZhi: ygz, dayGanZhi: dgz, hourGanZhi: hgz,
      gender: input.gender
    };
  }

  // 紫微/天府定位纯函数（§8）——placeAll 与单测共用同一路径
  function ziweiPalace(D, juNum) {
    var offset = (juNum - (D % juNum)) % juNum;
    var q = (D + offset) / juNum;
    return fix12((q - 1) + (offset % 2 === 0 ? offset : -offset));
  }
  function tianfuPalace(ziweiP) { return fix12(12 - ziweiP); }

  // ===== 安星（纯函数）=====
  function placeAll(pre) {
    var yearGanIdx = pre.yearGanZhi.ganIdx;
    var yearZhiIdx = pre.yearGanZhi.zhiIdx;
    var t = pre.tZhi;
    var M = pre.mUse;
    var firstStem = TIGER_FIRST[yearGanIdx];

    // 命身宫（§5）
    var mm = fix12(M - 1);
    var soulP = fix12(mm - t);
    var bodyP = fix12(mm + t);
    var soulZhi = fix12(2 + soulP);
    var mingGanIdx = fix10(firstStem + soulP);
    var mingGanZhiStr = GAN[mingGanIdx] + ZHI[soulZhi];

    // 五行局（§7）
    var hsN = Math.floor(mingGanIdx / 2) + 1;
    var ebN = Math.floor(fix6(soulZhi) / 2) + 1;
    var s = hsN + ebN;
    while (s > 5) s -= 5;
    var juName = JU_NAME[s];
    var juNum = JU_NUM[juName];


    // 紫微/天府（§8）
    var D = pre.lunar.lunarDay;
    var ziweiP = ziweiPalace(D, juNum);
    var tianfuP = tianfuPalace(ziweiP);

    // 宫位骨架（§6）
    var palaces = [];
    for (var i = 0; i < 12; i++) {
      palaces.push({
        index: i, name: PALACES[fix12(i - soulP)],
        ganIdx: fix10(firstStem + i), zhiIdx: fix12(2 + i),
        gan: GAN[fix10(firstStem + i)], zhi: ZHI[fix12(2 + i)],
        major: [], minor: [], adjStars: [],
        changsheng12: [], boshi12: [], jiangqian12: [], suiqian12: []
      });
    }
    // 主星（§9）
    for (var a = 0; a < ZIWEI_GROUP.length; a++) {
      var st = ZIWEI_GROUP[a];
      palaces[fix12(ziweiP - st.off)].major.push({ name: st.name, hua: null });
    }
    for (var b = 0; b < TIANFU_GROUP.length; b++) {
      var st2 = TIANFU_GROUP[b];
      palaces[fix12(tianfuP + st2.off)].major.push({ name: st2.name, hua: null });
    }
    // 生年四化（§11）
    var hua4 = FOUR_HUA[yearGanIdx];
    for (var hi = 0; hi < 4; hi++) {
      var sname = hua4[hi];
      var found = null;
      for (var pi = 0; pi < 12 && !found; pi++) {
        for (var mj = 0; mj < palaces[pi].major.length; mj++) {
          if (palaces[pi].major[mj].name === sname) {
            found = palaces[pi].major[mj]; found.palaceIdx = pi; break;
          }
        }
      }
      if (found) {
        // hua 角标可能有多个（一星被多化罕见），本命四化一星至多一化
        found.hua = HUA_NAME[hi];
        found.huaIdx = hi;
      }
    }

    // 辅星（§10）
    function putMinor(starName, eb) {
      var p = fix12(eb - 2);
      palaces[p].minor.push(starName);
      return p;
    }
    // 年干系
    var lucunEb = LU_CUN[yearGanIdx];
    putMinor('禄存', lucunEb);
    putMinor('擎羊', lucunEb + 1);
    putMinor('陀罗', lucunEb - 1);
    putMinor('天马', TIAN_MA[ZHI[yearZhiIdx]]);
    var ky = KUI_YUE[yearGanIdx];
    putMinor('天魁', ky[0]);
    putMinor('天钺', ky[1]);
    // 月系（§10.2，M=实用月）
    putMinor('左辅', fix12(C.ZUO_FU_BASE + (M - 1)));
    putMinor('右弼', fix12(C.YOU_BI_BASE - (M - 1)));
    // 时系（§10.3）
    putMinor('文昌', fix12(C.WEN_CHANG_BASE - t));
    putMinor('文曲', fix12(C.WEN_QU_BASE + t));
    putMinor('地劫', fix12(C.DI_JIE_BASE + t));
    putMinor('地空', fix12(C.DI_KONG_BASE - t));
    // 火星/铃星（§10.3 年支组）
    var groupKey = null;
    var gsets = { '申子辰': [0, 4, 8], '寅午戌': [2, 6, 10], '巳酉丑': [1, 5, 9], '亥卯未': [3, 7, 11] };
    for (var gk in gsets) {
      if (gsets[gk].indexOf(yearZhiIdx) >= 0) { groupKey = gk; break; }
    }
    var hl = C.HUO_LING[groupKey];
    putMinor('火星', fix12(hl[0] + t));
    putMinor('铃星', fix12(hl[1] + t));

    // ── 满盘档（§14 新增 v0.2.1）：杂曜37+年解 + 长生/博士/将前/岁前 神煞组 ──
    // 口径说明：以 iztro 2.5.8 输出为对照锚（2026-09-04 逐宫核对一致）；
    // 宫位一律使用「宫位序 p（寅=0，顺时针递增）」，palaces[p] 直接落宫。
    var yg = yearGanIdx, yz = yearZhiIdx;
    var lunM = pre.lunar.lunarMonth - 1;   // 农历月 0-based（月系杂曜按农历月，闰月视同本月）
    var lunD = pre.lunar.lunarDay - 1;     // 农历日 0-based（日系杂曜按农历日）
    var bodyZhi = fix12(2 + bodyP);
    function putAdjP(name, p) { palaces[fix12(p)].adjStars.push(name); }

    // §14.1 长生十二神：五行局长生宫起（水二申/木三亥/金四巳/土五申/火六寅），阳男阴女顺、阴男阳女逆
    var csNames = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
    var csStart = { 2: 6, 3: 9, 4: 3, 5: 6, 6: 0 }[juNum]; // 长生宫位序
    var csDir = ((yz % 2 === 0) === (pre.gender === 'M')) ? 1 : -1;
    for (var ci = 0; ci < 12; ci++) {
      palaces[fix12(csDir === 1 ? csStart + ci : csStart - ci)].changsheng12.push(csNames[ci]);
    }
    // §14.2 博士十二神：禄存起，阳男阴女顺、阴男阳女逆
    var bsNames = ['博士','力士','青龙','小耗','将军','奏书','飞廉','喜神','病符','大耗','伏兵','官府'];
    var lucunP = fix12(LU_CUN[yg] - 2);
    for (var bi = 0; bi < 12; bi++) {
      palaces[fix12(csDir === 1 ? lucunP + bi : lucunP - bi)].boshi12.push(bsNames[bi]);
    }
    // §14.3 将前十二星：将星起（寅午戌午/申子辰子/巳酉丑酉/亥卯未卯）顺行
    var jqStart = { '寅午戌': 4, '申子辰': 10, '巳酉丑': 7, '亥卯未': 1 }[groupKey];
    var jqNames = ['将星','攀鞍','岁驿','息神','华盖','劫煞','灾煞','天煞','指背','咸池','月煞','亡神'];
    for (var ji = 0; ji < 12; ji++) palaces[fix12(jqStart + ji)].jiangqian12.push(jqNames[ji]);
    // §14.4 岁前十二星：岁建起（年支）顺行
    var sqNames = ['岁建','晦气','丧门','贯索','官符','小耗','大耗','龙德','白虎','天德','吊客','病符'];
    for (var si = 0; si < 12; si++) palaces[fix12((yz - 2) + si)].suiqian12.push(sqNames[si]);

    // §14.5 年支/年干系杂曜
    putAdjP('红鸾', fix12(1 - yz));              // 卯上起子逆数
    putAdjP('天喜', fix12(7 - yz));              // 红鸾对宫
    var hgxc = { '申子辰': [2, 7], '寅午戌': [8, 1], '巳酉丑': [11, 4], '亥卯未': [5, 10] }[groupKey];
    putAdjP('华盖', hgxc[0]); putAdjP('咸池', hgxc[1]);
    var hzcn = { '亥子丑': [11, 0, 1], '寅卯辰': [2, 3, 4], '巳午未': [5, 6, 7], '申酉戌': [8, 9, 10] };
    var gkey3 = null;
    for (var gk3 in hzcn) { if (hzcn[gk3].indexOf(yz) >= 0) { gkey3 = gk3; break; } }
    var ggs = { '亥子丑': [0, 8], '寅卯辰': [3, 11], '巳午未': [6, 2], '申酉戌': [9, 5] }[gkey3];
    putAdjP('孤辰', ggs[0]); putAdjP('寡宿', ggs[1]);
    putAdjP('天哭', fix12(4 - yz));              // 午上起子逆数
    putAdjP('天虚', fix12(4 + yz));              // 午上起子顺数（iztro 口径；子年与天哭同宫为流派特例，若按主流「未起顺」需改 5+yz）
    putAdjP('龙池', fix12(2 + yz));              // 辰起子顺
    putAdjP('凤阁', fix12(8 - yz));              // 戌起子逆
    putAdjP('天才', fix12(soulP + yz));          // 命宫起子顺数至年支
    putAdjP('天寿', fix12(bodyP + yz));          // 身宫起子顺数至年支
    putAdjP('天厨', [3, 4, 10, 3, 4, 6, 0, 4, 7, 9][yg]); // 甲丁巳/乙戊辛午/丙子/己申/庚寅/壬酉/癸亥
    putAdjP('破碎', [3, 11, 7][yz % 3]);         // 子午卯酉巳/丑辰未戌丑/寅申巳亥酉（宫位序）
    putAdjP('蜚廉', [6, 7, 8, 3, 4, 5, 0, 1, 2, 9, 10, 11][yz]); // 申酉戌/巳午未/寅卯辰/亥子丑 顺列
    putAdjP('天官', [5, 2, 3, 0, 1, 7, 9, 7, 8, 4][yg]);
    putAdjP('天福', [7, 6, 10, 9, 1, 0, 4, 3, 4, 3][yg]);
    putAdjP('天德', fix12(7 + yz));              // 酉起子顺
    putAdjP('月德', fix12(3 + yz));              // 巳起子顺
    putAdjP('天空', fix12(yz - 1));              // 年支顺数前一位
    putAdjP('截路', [6, 4, 2, 0, 10][yg % 5]);   // 甲己申酉/乙庚午未/丙辛辰巳/丁壬寅卯/戊癸子丑
    putAdjP('空亡', [7, 5, 3, 1, 11][yg % 5]);
    var xkP = fix12((yz - 2) + (10 - yg));       // 旬空（年干定旬首顺推至年支）
    if (yz % 2 !== xkP % 2) xkP = fix12(xkP + 1); // 阴阳校正（阳干阳宫阴干阴宫）
    putAdjP('旬空', xkP);
    putAdjP('天伤', fix12(soulP + 5));           // 奴仆（夹迁移）
    putAdjP('天使', fix12(soulP + 7));           // 疾厄（夹迁移）
    putAdjP('年解', fix12(8 - yz));              // 戌上起子逆数

    // §14.6 月系杂曜（按农历生月）
    putAdjP('解神', [6, 8, 10, 0, 2, 4][Math.floor(lunM / 2)]); // 正二申 三四戌 五六子 七八寅 九十辰 十一十二午
    putAdjP('天姚', fix12(11 + lunM));           // 丑上起正月顺
    putAdjP('天刑', fix12(7 + lunM));            // 酉上起正月顺
    putAdjP('阴煞', [0, 10, 8, 6, 4, 2][lunM % 6]); // 正七寅 二八子 三九戌 四十申 五十一午 六十二辰
    putAdjP('天月', [8, 3, 2, 0, 5, 1, 9, 5, 0, 4, 8, 0][lunM]);
    putAdjP('天巫', [3, 6, 0, 9][lunM % 4]);     // 一五九巳 二六十申 三七十一寅 四八十二亥

    // §14.7 日系/时系杂曜（农历日 + 命盘左辅右弼/时系昌曲）
    var zuoP = fix12((C.ZUO_FU_BASE - 2) + (M - 1)); // 左辅宫位序（与 §10.2 同口径）
    var youP = fix12((C.YOU_BI_BASE - 2) - (M - 1)); // 右弼宫位序
    var changP = fix12(8 - t);                   // 时系文昌宫位序（戌起子逆）
    var quP = fix12(2 + t);                      // 时系文曲宫位序（辰起子顺）
    putAdjP('三台', fix12(zuoP + lunD));         // 左辅起初一顺至生日
    putAdjP('八座', fix12(youP - lunD));         // 右弼起初一逆至生日
    putAdjP('恩光', fix12(changP + lunD - 1));   // 文昌起初一顺至生日退一步
    putAdjP('天贵', fix12(quP + lunD - 1));      // 文曲起初一顺至生日退一步
    putAdjP('台辅', fix12(4 + t));               // 午上起子时顺
    putAdjP('封诰', fix12(0 + t));               // 寅上起子时顺

    // 命主/身主（§12）
    var mingZhu = MING_ZHU[soulZhi];
    var shenZhu = SHEN_ZHU[yearZhiIdx];

    // 大限（§13）
    var yang = (yearZhiIdx % 2 === 0); // 阳支序号偶
    var dir = 1;
    if (pre.gender === 'F') dir = yang ? -1 : 1;
    else dir = yang ? 1 : -1;
    var daXian = [];
    for (var di = 0; di < 12; di++) {
      var pIdx = fix12(soulP + dir * di);
      var p = palaces[pIdx];
      daXian.push({
        index: di, palaceIndex: pIdx, name: p.name,
        ganZhi: p.gan + p.zhi, start: juNum + 10 * di, end: juNum + 10 * di + 9
      });
    }
    // 四化索引摘要（star -> 化名）
    var huaSummary = {};
    for (var hi2 = 0; hi2 < 4; hi2++) huaSummary[hua4[hi2]] = HUA_NAME[hi2];

    return {
      soulP: soulP, bodyP: bodyP, mingGanZhi: mingGanZhiStr, mingGanIdx: mingGanIdx, soulZhi: soulZhi,
      juName: juName, juNum: juNum, ziweiP: ziweiP, tianfuP: tianfuP,
      mingZhu: mingZhu, shenZhu: shenZhu, dir: dir, yangYear: yang,
      huaSummary: huaSummary, palaces: palaces, daXian: daXian
    };
  }

  // ===== 排盘主入口 =====
  function getChart(input) {
    var pre = preprocess(input);
    var placed = placeAll(pre);
    // 宫干支字符串回填
    for (var i = 0; i < 12; i++) {
      var p = placed.palaces[i];
      p.ganZhi = p.gan + p.zhi;
      p.isSoul = (i === placed.soulP);
      p.isBody = (i === placed.bodyP);
    }
    // 四化落宫明细（主星/辅星均可携带；供 render 与测试）
    var huaStars = [];
    var h4n = FOUR_HUA[pre.yearGanZhi.ganIdx];
    for (var hs = 0; hs < 4; hs++) {
      var hsName = h4n[hs];
      var hsP = null, hsKind = null;
      for (var hpi = 0; hpi < 12 && !hsP; hpi++) {
        for (var hmj = 0; hmj < placed.palaces[hpi].major.length; hmj++) {
          if (placed.palaces[hpi].major[hmj].name === hsName) { hsP = hpi; hsKind = 'major'; break; }
        }
        for (var hmn = 0; hmn < placed.palaces[hpi].minor.length && !hsP; hmn++) {
          if (placed.palaces[hpi].minor[hmn] === hsName) { hsP = hpi; hsKind = 'minor'; break; }
        }
      }
      huaStars.push({ star: hsName, hua: HUA_NAME[hs], palaceIndex: hsP, kind: hsKind });
    }

    return {
      version: C.VERSION,
      input: input,
      pre: {
        solar: pre.solar, effSolar: pre.effSolar, lunar: pre.lunar, lunarDisplay: pre.lunarDisplay, mUse: pre.mUse,
        lateZi: pre.lateZi, timeIndex: pre.timeIndex, tZhi: pre.tZhi, note: pre.note,
        qiYear: pre.qiYear, qiMonthIdx: pre.qiMonthIdx, qiMonthZhi: pre.qiMonthZhi,
        yearGanZhi: pre.yearGanZhi, dayGanZhi: pre.dayGanZhi, hourGanZhi: pre.hourGanZhi
      },
      center: {
        mingGanZhi: placed.mingGanZhi, juName: placed.juName, juNum: placed.juNum,
        mingZhu: placed.mingZhu, shenZhu: placed.shenZhu,
        soulIndex: placed.soulP, soulZhi: ZHI[placed.soulZhi],
        bodyIndex: placed.bodyP, bodyZhi: ZHI[fix12(2 + placed.bodyP)],
        ziweiIndex: placed.ziweiP, tianfuIndex: placed.tianfuP,
        huaSummary: placed.huaSummary
      },
      palaces: placed.palaces,
      huaStars: huaStars,
      daXian: placed.daXian
    };
  }

  // 便捷：找某星所落宫位 index（测试用）
  function starPalace(chart, starName) {
    for (var i = 0; i < 12; i++) {
      var p = chart.palaces[i];
      for (var mj = 0; mj < p.major.length; mj++) {
        if (p.major[mj].name === starName) return { index: i, zhi: p.zhi, ganZhi: p.ganZhi };
      }
      for (var mn = 0; mn < p.minor.length; mn++) {
        if (p.minor[mn] === starName) return { index: i, zhi: p.zhi, ganZhi: p.ganZhi };
      }
    }
    return null;
  }

  window.ALGO = {
    ziweiPalace: ziweiPalace, tianfuPalace: tianfuPalace,
    fix12: fix12, fix10: fix10, fix60: fix60,
    isLeapSolar: isLeapSolar, solarDim: solarDim, absDay: absDay, plusDays: plusDays,
    solarToLunar: solarToLunar, lunarToSolar: lunarToSolar,
    cnyOf: cnyOf, leapMonthOf: leapMonthOf, mLength: mLength,
    yearGanZhi: yearGanZhi, dayGanZhi: dayGanZhi, hourGanZhi: hourGanZhi,
    getSolarTerm: getSolarTerm, qiYearMonthOf: qiYearMonthOf,
    hourToShichen: hourToShichen, equationOfTime: equationOfTime, trueSolarTime: trueSolarTime,
    preprocess: preprocess, placeAll: placeAll, getChart: getChart, starPalace: starPalace
  };

})();
