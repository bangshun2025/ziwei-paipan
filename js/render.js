/* 紫微斗数排盘 v0.1.0 — render.js
 * UI RENDER：纯渲染层（无排盘计算），输入盘对象 chart → 渲染十二宫方盘/中宫/大限轴/详情。
 * 依赖：window.CONST（constants.js）。
 * 口径：月柱为农历月五虎遁（v0.1 展示用，非节气月，界面已标注）。
 */
(function () {
  'use strict';

  var C = window.CONST;
  var ZHI = C.ZHI;
  var fix = function (n, m) { return ((n % m) + m) % m; };
  var fix12 = function (n) { return fix(n, 12); };
  var fix10 = function (n) { return fix(n, 10); };

  // 地支序号 eb -> 4x4 宫格 (row, col)；书式盘（顶部午未、底部子丑、四角寅巳申亥）
  // 顶行：巳午未申；左列（下->上）：寅卯辰巳；右列（上->下）：申酉戌亥；底行：亥子丑寅
  // eb: 0子 1丑 2寅 3卯 4辰 5巳 6午 7未 8申 9酉 10戌 11亥
  var POS_EB = {};
  (function () {
    var rows = [
      { eb: 5, r: 1, c: 1 }, { eb: 6, r: 1, c: 2 }, { eb: 7, r: 1, c: 3 }, { eb: 8, r: 1, c: 4 },
      { eb: 9, r: 2, c: 4 }, { eb: 10, r: 3, c: 4 }, { eb: 11, r: 4, c: 4 },
      { eb: 0, r: 4, c: 3 }, { eb: 1, r: 4, c: 2 }, { eb: 2, r: 4, c: 1 },
      { eb: 3, r: 3, c: 1 }, { eb: 4, r: 2, c: 1 }
    ];
    for (var i = 0; i < rows.length; i++) POS_EB[rows[i].eb] = { r: rows[i].r, c: rows[i].c };
  })();

  var HUA_CLS = { 禄: 'L', 权: 'Q', 科: 'K', 忌: 'J' };
  var HUA_TXT = { 禄: '化禄', 权: '化权', 科: '化科', 忌: '化忌' };

  // 中文数字：CN_D[0] 用「〇」（年份标准写法）；CN_M 等日/月专用字不受影响（cnDay 不走 CN_D[0] 于 10/20/30 特判外均用一~九）
  var CN_D = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  var CN_M = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

  function cnDay(d) {
    if (d === 10) return '初十';
    if (d < 10) return '初' + CN_D[d];
    if (d < 20) return '十' + CN_D[d - 10];
    if (d === 20) return '二十';
    if (d < 30) return '廿' + CN_D[d - 20];
    return '三十';
  }
  function cnLunar(chart) {
    // 显示文本一律取 lunarDisplay（§2.4.1：按输入原日的农历，晚子时不进位；安星仍用 pre.lunar）
    var lu = (chart.pre && chart.pre.lunarDisplay) || chart.pre.lunar;
    var y = String(lu.lunarYear).split('');
    var ys = '';
    for (var i = 0; i < y.length; i++) ys += CN_D[+y[i]];
    return ys + '年 ' + (lu.isLeap ? '闰' : '') + CN_M[lu.lunarMonth] + '月' + cnDay(lu.lunarDay);
  }

  function esc(s) { return String(s == null ? '' : s); }

  // 月柱展示口径：五虎遁按实用月 mUse（v0.2.0 起 = 节气月序 1..12，与八字同源）
  function monthPillarOf(chart) {
    var ygz = chart.pre.yearGanZhi;
    var lm = chart.pre.mUse;
    if (!ygz || !lm) return '';
    var first = C.TIGER_FIRST[ygz.ganIdx];
    if (first == null) return '';
    var ganIdx = fix10(first + (lm - 1));
    var zhiIdx = fix12(2 + (lm - 1));
    return C.GAN[ganIdx] + ZHI[zhiIdx];
  }

  // 主星四化角标
  function huaEl(hua) {
    if (!hua) return '';
    var cls = HUA_CLS[hua];
    return '<i class="hua hua-' + (cls || 'L') + '">' + esc(hua) + '</i>';
  }

    function starEl(name, hua, minor) {
      var cls = minor ? 'minor' : 'major';
      return '<span class="star ' + cls + '">' + esc(name) + huaEl(hua) + '</span>';
    }

    // 满盘档 v0.2.1：杂曜 + 长生/博士/将前/岁前四神组
    function fullStarsHtml(palace) {
      var h = '';
      var adj = palace.adjStars || [];
      if (adj.length) {
        h += '<div class="p-adj">';
        for (var ai = 0; ai < adj.length; ai++) h += '<span>' + esc(adj[ai]) + '</span>';
        h += '</div>';
      }
      var gods = [
        ['cs', palace.changsheng12 ? palace.changsheng12[0] : ''],
        ['bs', palace.boshi12 ? palace.boshi12[0] : ''],
        ['jq', palace.jiangqian12 ? palace.jiangqian12[0] : ''],
        ['sq', palace.suiqian12 ? palace.suiqian12[0] : '']
      ];
      var gs = '';
      for (var gi = 0; gi < 4; gi++) if (gods[gi][1]) gs += '<i class="gd gd-' + gods[gi][0] + '">' + esc(gods[gi][1]) + '</i>';
      if (gs) h += '<div class="p-gods">' + gs + '</div>';
      return h;
    }
  // 中宫「生年四化」chips
  function huaChips(chart) {
    var hs = chart.center.huaSummary || {};
    var html = '';
    var order = [];
    var keys = Object.keys(hs);
    var L = ['禄', '权', '科', '忌'];
    for (var i = 0; i < L.length; i++) {
      for (var j = 0; j < keys.length; j++) {
        if (hs[keys[j]] === L[i]) { order.push(keys[j]); break; }
      }
    }
    for (var k = 0; k < order.length; k++) {
      var star = order[k], hua = hs[star], cls = HUA_CLS[hua] || 'L';
      html += star + '<i class="hua hua-' + cls + '">' + hua + '</i> ';
    }
    return html;
  }

  // ===== 渲染头部（四柱/农历/口径）=====
  function renderHead(el, chart) {
    var pre = chart.pre;
    var ganC = 'gan', zhiC = 'zhi';
    var html = '';
    html += '<div class="pillars">'
      + '<span class="gan">' + esc(pre.yearGanZhi.gan) + '</span><span class="zhi">' + esc(pre.yearGanZhi.zhi) + '</span> '
      + '<span class="gan">' + esc(monthPillarOf(chart).charAt(0)) + '</span><span class="zhi">' + esc(monthPillarOf(chart).charAt(1)) + '</span> '
      + '<span class="gan">' + esc(pre.dayGanZhi.gan) + '</span><span class="zhi">' + esc(pre.dayGanZhi.zhi) + '</span> '
      + '<span class="gan">' + esc(pre.hourGanZhi.gan) + '</span><span class="zhi">' + esc(pre.hourGanZhi.zhi) + '</span> '
      + '</div>';
    var TIME_N = ['早子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '晚子'];
    var luDisp = pre.lunarDisplay || pre.lunar;
    var tzTxt = '';
    if (pre.lateZi) tzTxt = '晚子时(归次日)';
    else if (pre.timeIndex === 0) tzTxt = '早子时(当日)';
    else tzTxt = (TIME_N[pre.timeIndex] || '') + '时';
    html += '<div class="lunar-line">' + cnLunar(chart)
      + (luDisp.isLeap ? '（农历闰月仅显示，安星不涉闰月）' : '')
      + (tzTxt ? ' · ' + tzTxt : '')
      + '</div>';
    var notes = '';
    for (var i = 0; i < (pre.note || []).length; i++) notes += (notes ? '；' : '') + esc(pre.note[i]);
    html += '<div class="note-line">口径 v0.2.0：年按立春换年、月按节气十二节、日按农历、时辰照旧。' + (notes ? '｜' + notes : '') + '</div>';
    el.innerHTML = html;
  }

  // ===== 渲染 4x4 方盘 + 中宫 =====
  function renderGrid(root, chart) {
    var grid = document.createElement('div');
    grid.className = 'grid';
    var center = document.createElement('div');
    center.className = 'center-area';

    var dxByPalace = {};
    for (var k = 0; k < chart.daXian.length; k++) dxByPalace[chart.daXian[k].palaceIndex] = chart.daXian[k];

    // 中宫
    var cen = chart.center;
    var cH = '<div class="c-ju">' + esc(cen.juName) + '</div>';
    cH += '<div class="c-sub">' + esc(cen.juNum) + '岁起运</div>';
    cH += '<div class="c-mz">命宫在' + esc(cen.soulZhi) + ' · 身宫在' + esc(cen.bodyZhi) + '</div>';
    cH += '<div class="c-mz">命主' + esc(cen.mingZhu) + ' · 身主' + esc(cen.shenZhu) + '</div>';
    cH += '<div class="c-sub">紫微在' + esc(cen.soulIndex === cen.ziweiIndex ? '' : '')
      + esc(ZHI[fix12(cen.ziweiIndex + 2)] || '') + ' · 天府在'
      + esc(ZHI[fix12(cen.tianfuIndex + 2)] || '') + '</div>';
    cH += '<div class="c-hua">生年四化&nbsp; ' + huaChips(chart) + '</div>';
    var dx0 = chart.daXian[0];
    var dirTxt = '大限顺行';
    if (chart.daXian.length > 1) {
      var a = chart.daXian[0].palaceIndex, b = chart.daXian[1].palaceIndex;
      dirTxt = (fix12(b - a) === 1 || fix12(b - a) === -11) ? '大限顺行' : '大限逆行';
    }
    var dirTxt2 = dx0 ? '起于' + esc(dx0.name) + '（' + esc(dx0.ganZhi) + ' ' + dx0.start + '-' + dx0.end + '岁）' : '';
    cH += '<div class="c-sub">' + dirTxt + ' · ' + dirTxt2 + '</div>';
    cH += '<div class="c-legend"><span class="gd gd-cs">长生</span><span class="gd gd-bs">博士</span>'
      + '<span class="gd gd-jq">将前</span><span class="gd gd-sq">岁前</span><span class="gd-g">四神随宫</span></div>';
    center.innerHTML = cH;

    var cells = {};
    for (var p = 0; p < 12; p++) {
      var palace = chart.palaces[p];
      var eb = fix12(p + 2);
      var pos = POS_EB[eb];
      var cell = document.createElement('div');
      cell.className = 'cell' + (palace.isSoul ? ' soul' : '') + (palace.isBody ? ' body' : '');
      cell.style.gridRowStart = pos.r; cell.style.gridColumnStart = pos.c;
      var tags = '';
      if (palace.isSoul) tags += '<span class="tag soul-tag">命</span>';
      if (palace.isBody) tags += '<span class="tag body-tag">身</span>';
      var dx = dxByPalace[p];
      var dec = dx ? dx.start + '-' + dx.end + '岁' : '';
      var majors = '', minors = '';
      for (var mi = 0; mi < (palace.major || []).length; mi++) {
        var mj = palace.major[mi];
        majors += starEl(mj.name, mj.hua, false);
      }
      for (var ni = 0; ni < (palace.minor || []).length; ni++) {
        minors += starEl(palace.minor[ni], null, true);
      }
      cell.innerHTML = '<div class="p-top"><span class="p-name">' + esc(palace.name) + tags + '</span>'
        + '<span class="p-gz">' + esc(palace.ganZhi) + '</span></div>'
        + (dec ? '<div class="p-dec">' + dec + '</div>' : '')
        + (majors ? '<div class="p-major">' + majors + '</div>' : '')
        + (minors ? '<div class="p-minor">' + minors + '</div>' : '')
        + fullStarsHtml(palace);
      cell.setAttribute('data-palace', p);
      cells[p] = cell;
      grid.appendChild(cell);
    }
    grid.appendChild(center);

    root.innerHTML = '';
    root.appendChild(grid);
    return cells;
  }

  // ===== 详情 =====
  function detailHtml(chart, p) {
    var palace = chart.palaces[p];
    var dxByPalace = {};
    for (var k = 0; k < chart.daXian.length; k++) dxByPalace[chart.daXian[k].palaceIndex] = chart.daXian[k];
    var h = '';
    var title = palace.name + (palace.isSoul ? '（命宫）' : '') + (palace.isBody ? '（身宫）' : '') + ' ' + palace.ganZhi;
    h += '<div class="detail-title">' + esc(title) + '</div><div class="detail-body">';
    var dx = dxByPalace[p];
    if (dx) h += '<span class="dblk"><b>大限</b>' + dx.ganZhi + ' · ' + dx.start + '-' + dx.end + '岁</span>';
    var maj = [];
    for (var i = 0; i < (palace.major || []).length; i++) {
      var m = palace.major[i];
      maj.push(m.name + (m.hua ? '（' + HUA_TXT[m.hua] + '）' : ''));
    }
    if (maj.length) h += '<span class="dblk"><b>主星</b>' + maj.join('　') + '</span>';
    if ((palace.minor || []).length) h += '<span class="dblk"><b>辅星</b>' + palace.minor.join('　') + '</span>';
    if ((palace.adjStars || []).length) h += '<span class="dblk"><b>杂曜</b>' + palace.adjStars.join('　') + '</span>';
    var godTxt = [];
    if (palace.changsheng12 && palace.changsheng12.length) godTxt.push('长生·' + palace.changsheng12[0]);
    if (palace.boshi12 && palace.boshi12.length) godTxt.push('博士·' + palace.boshi12[0]);
    if (palace.jiangqian12 && palace.jiangqian12.length) godTxt.push('将前·' + palace.jiangqian12[0]);
    if (palace.suiqian12 && palace.suiqian12.length) godTxt.push('岁前·' + palace.suiqian12[0]);
    if (godTxt.length) h += '<span class="dblk"><b>神煞</b>' + godTxt.join('　') + '</span>';
    // 三方四正（三合 ±4，对宫 +6）
    var pTriA = chart.palaces[fix12(p + 8)]; // p-4
    var pTriB = chart.palaces[fix12(p + 4)];
    var opp = chart.palaces[fix12(p + 6)];
    function brief(x) {
      var names = [];
      for (var q = 0; q < (x.major || []).length; q++) names.push(x.major[q].name);
      var s = x.name;
      if (names.length) s += '(' + names.join('、') + ')';
      return s;
    }
    h += '<span class="dblk"><b>三方四正</b>三合：' + brief(pTriA) + '、' + brief(pTriB) + '；对宫：' + brief(opp) + '</span>';
    h += '</div>';
    return h;
  }

  // ===== 渲染大限时间轴 =====
  function renderTimeline(root, chart, cells, detailEl, state) {
    root.innerHTML = '';
    var items = [];
    for (var i = 0; i < chart.daXian.length; i++) {
      var dx = chart.daXian[i];
      var it = document.createElement('div');
      it.className = 'dx-item';
      it.innerHTML = '<div class="dx-gz">' + esc(dx.ganZhi) + '</div>'
        + '<div class="dx-name">' + esc(dx.name) + '</div>'
        + '<div class="dx-age">' + dx.start + '-' + dx.end + '岁</div>';
      it.setAttribute('data-dx', i);
      (function (pi, el) {
        el.addEventListener('click', function () { selectPalace(chart, pi, cells, root, detailEl, state); });
      })(dx.palaceIndex, it);
      items.push(it);
      root.appendChild(it);
    }
    // 默认选中命宫所在大限
    var soulDx = chart.daXian[0];
    selectPalace(chart, soulDx.palaceIndex, cells, root, detailEl, state);
  }

  var activeCell = null, activeDx = null;
  function selectPalace(chart, pi, cells, timelineRoot, detailEl, state) {
    if (activeCell) activeCell.classList.remove('active');
    if (activeDx) activeDx.classList.remove('active');
    var cell = cells[pi];
    if (cell) { cell.classList.add('active'); activeCell = cell; }
    var dxEls = timelineRoot.querySelectorAll('.dx-item');
    for (var i = 0; i < dxEls.length; i++) {
      if (chart.daXian[i] && chart.daXian[i].palaceIndex === pi) {
        dxEls[i].classList.add('active'); activeDx = dxEls[i];
      }
    }
    if (detailEl) detailEl.innerHTML = detailHtml(chart, pi);
    if (state && state.onSelect) state.onSelect(pi);
  }

  // ===== 对外 =====
  window.RENDER = {
    version: 'v0.1.0',
    monthPillarOf: monthPillarOf,
    cnLunar: cnLunar,
    renderHead: renderHead,
    renderAll: function (headEl, gridRoot, timelineRoot, detailEl, chart, state) {
      renderHead(headEl, chart);
      var cells = renderGrid(gridRoot, chart);
      renderTimeline(timelineRoot, chart, cells, detailEl, state);
      return { cells: cells, chart: chart };
    }
  };
})();
