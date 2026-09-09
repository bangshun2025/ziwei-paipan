/* 紫微斗数排盘 v0.5.0 — render.js
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

  // ===== 大限盘宫名环（v0.6.0）=====
  // 生年十二宫沿地支顺环（命宫右邻=父母宫，与 CONST.PALACES 同构）；offset = 大限命宫所在格的环序号。
  // 点「父母宫」→ 该宫显示 大限命宫，其右邻福德宫显示 大限父母宫：全盘右下角大限宫名随整体平移。
  var DX_RING = C.PALACES;
  function dxNameOf(palaceName, offset) {
    var i = DX_RING.indexOf(palaceName);
    if (i < 0) i = 0;
    var nm = DX_RING[fix12(i - (offset || 0))];
    return '大限' + nm + (nm.charAt(nm.length - 1) === '宫' ? '' : '宫');
  }

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

    function starEl(name, minor, hua) {
      var cls = minor ? 'minor' : 'major';
      var ch = '';
      for (var i = 0; i < name.length; i++) ch += '<span class="s-ch">' + esc(name.charAt(i)) + '</span>';
      // v0.6.1：四化徽章贴星正下方（禄权科忌小色块，见 .star .hua），独立四化行已废弃
      return '<span class="star ' + cls + '">' + ch + (hua ? huaEl(hua) : '') + '</span>';
    }
    function adjEl(name) {
      var ch = '';
      for (var i = 0; i < name.length; i++) ch += '<span class="s-ch">' + esc(name.charAt(i)) + '</span>';
      return '<span class="star adj">' + ch + '</span>';
    }

    // v0.6.2：庙旺平陷行已按界面迭代废弃（原 brightRow 输出 .p-bright），BRIGHT 表保留于 constants.js 备用
    // 神煞区（横线上方）：行5 = 博士组(蓝)；行6 = 岁前组(灰绿) + 将前组(灰) + 大限岁段(黑) + 长生(黑)
    // v0.6.1：岁前星由宫位行首上移至此处，宫位行只保留 本命宫名/干支/大限宫名
    function godLines(palace, dec) {
      var bs = (palace.boshi12 && palace.boshi12[0]) || '';
      var jq = (palace.jiangqian12 && palace.jiangqian12[0]) || '';
      var cs = (palace.changsheng12 && palace.changsheng12[0]) || '';
      var sq = (palace.suiqian12 && palace.suiqian12[0]) || '';
      var s = '';
      if (bs) s += '<div class="p-god"><i class="gd gd-bs">' + esc(bs) + '</i></div>';
      if (sq || jq || dec || cs) {
        s += '<div class="p-meta">';
        if (sq) s += '<i class="gd gd-sq">' + esc(sq) + '</i>';
        if (jq) s += '<i class="gd gd-jq">' + esc(jq) + '</i>';
        if (dec) s += '<span class="p-dec">' + esc(dec) + '</span>';
        if (cs) s += '<i class="gd gd-cs">' + esc(cs) + '</i>';
        s += '</div>';
      }
      return s;
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
  function renderHead(el, chart, person) {
    var pre = chart.pre;
    var ganC = 'gan', zhiC = 'zhi';
    var html = '';
    // v0.5.0 person 行：显示名走脱敏链（隐私开 艺名→小名→匿名；关 小名/正名）
    var disp = '';
    if (person) {
      if (window.ARCHIVE && ARCHIVE.getDisplayName) disp = ARCHIVE.getDisplayName(person);
      else disp = person.name || '';
    }
    if (disp) {
      html += '<div class="person-line">' + esc(disp)
        + (person && person.gender ? ' · ' + (person.gender === 'F' ? '女' : '男') : '')
        + '</div>';
    }
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
    html += '<div class="note-line">口径 v0.2.0：年按立春换年、月按节气十二节、日按农历、子时统一归次日。' + (notes ? '｜' + notes : '') + '</div>';
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

    // 中宫（热卜式 v0.3.0-ref：大字 盘类型/命四化 + 双列 命宫身宫/命主身主）
    var cen = chart.center;
    var juTxt = '天盘' + esc(cen.juName);
    var L4 = ['禄', '权', '科', '忌'];
    var order4 = [], seenH = {};
    var hk;
    for (hk = 0; hk < L4.length; hk++) {
      for (var hn in cen.huaSummary) {
        if (cen.huaSummary[hn] === L4[hk] && !seenH[hn]) { order4.push(hn); seenH[hn] = 1; }
      }
    }
    var huaTxt = order4.length ? '【' + order4.join('') + '】' : '【--】';
    var cH = '';
    cH += '<div class="c-pan"><span class="c-lb">盘类型：</span><span class="c-v c-v-red">' + juTxt + '</span></div>';
    cH += '<div class="c-pan"><span class="c-lb">命四化：</span><span class="c-v c-v-red">' + huaTxt + '</span></div>';
    cH += '<div class="c-pair"><span class="c-k">命宫在</span><span class="c-v c-v-pink">' + esc(cen.soulZhi) + '</span>'
      + '<span class="c-k">身宫在</span><span class="c-v c-v-pink">' + esc(cen.bodyZhi) + '</span></div>';
    cH += '<div class="c-pair"><span class="c-k">命主</span><span class="c-v c-v-green">' + esc(cen.mingZhu) + '</span>'
      + '<span class="c-k">身主</span><span class="c-v c-v-green">' + esc(cen.shenZhu) + '</span></div>';
    center.innerHTML = cH;

    var cells = {};
    for (var p = 0; p < 12; p++) {
      var palace = chart.palaces[p];
      var eb = fix12(p + 2);
      var pos = POS_EB[eb];
      var cell = document.createElement('div');
      cell.className = 'cell' + (palace.isSoul ? ' soul' : '') + (palace.isBody ? ' body' : '');
      cell.style.gridRowStart = pos.r; cell.style.gridColumnStart = pos.c;
      var dx = dxByPalace[p];
      var dec = dx ? dx.start + '-' + dx.end + '岁' : '';
      var hs = chart.center.huaSummary || {};
      var majors = '', minors = '', adjs = '';
      for (var mi = 0; mi < (palace.major || []).length; mi++) {
        majors += starEl(palace.major[mi].name, false, hs[palace.major[mi].name]);
      }
      for (var ni = 0; ni < (palace.minor || []).length; ni++) {
        minors += starEl(palace.minor[ni], true, hs[palace.minor[ni]]);
      }
      for (var ai2 = 0; ai2 < (palace.adjStars || []).length; ai2++) {
        adjs += adjEl(palace.adjStars[ai2]);
      }
      var godH = godLines(palace, dec);
      var starMark = palace.isSoul ? '<span class="soul-star">★</span>' : '';
      // v0.6.2：宫位行 = 底红两行式（★/身标保留）：行1 = ★/身 + 本命X宫 + 干支；行2 = 大限X宫（随点击沿生年十二宫环偏移，见 dxNameOf）
      var footTags = '';
      if (palace.isBody) footTags += '<span class="tag body-tag">身</span>';
      var bmName = '本命' + (palace.name.charAt(palace.name.length - 1) === '宫' ? palace.name : palace.name + '宫');
      // v0.6.2：庙旺行（.p-bright）已废弃，宫内自上而下 = 星带 + 神煞 + 宫位行
      cell.innerHTML =
        ((majors || minors || adjs) ? '<div class="p-stars">' + majors + minors + adjs + '</div>' : '')
        + godH
        + '<div class="p-foot">'
        + '<div class="p-f1">' + starMark + footTags + '<span class="p-name">' + esc(bmName) + '</span>'
        + '<span class="p-gz">' + esc(palace.ganZhi) + '</span></div>'
        + '<div class="p-f2"><span class="p-dx">' + dxNameOf(palace.name, 0) + '</span></div></div>';
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
    // v0.6.2：详情标题对齐宫格底行三段式（★/身 + 本命X宫 + 干支 + 大限X宫），修复旧式「命宫（命宫）丁未」残缺感
    var tN = palace.name.charAt(palace.name.length - 1) === '宫' ? palace.name : palace.name + '宫';
    var tSel = DX_RING.indexOf(palace.name); if (tSel < 0) tSel = 0;
    var title = (palace.isSoul ? '<span class="dt-soul">★</span>' : '')
      + '<span class="dt-bm">本命' + esc(tN) + '</span>'
      + (palace.isBody ? '<span class="dt-tag">身</span>' : '')
      + '<span class="dt-gz">' + esc(palace.ganZhi) + '</span>'
      + '<span class="dt-sep">·</span>'
      + '<span class="dt-dx">' + esc(dxNameOf(palace.name, tSel)) + '</span>';
    h += '<div class="detail-title">' + title + '</div><div class="detail-body">';
    var dx = dxByPalace[p];
    if (dx) h += '<span class="dblk"><b>大限</b>' + dx.ganZhi + ' · ' + dx.start + '-' + dx.end + '岁</span>';
    var maj = [];
    for (var i = 0; i < (palace.major || []).length; i++) {
      var m = palace.major[i];
      maj.push(m.name + (m.hua ? '（' + HUA_TXT[m.hua] + '）' : ''));
    }
    if (maj.length) h += '<span class="dblk"><b>主星</b>' + maj.join('　') + '</span>';
    if ((palace.minor || []).length) {
      var hs2 = chart.center.huaSummary || {};
      h += '<span class="dblk"><b>辅星</b>' + palace.minor.map(function (nm) {
        return nm + (hs2[nm] ? '（' + HUA_TXT[hs2[nm]] + '）' : '');
      }).join('　') + '</span>';
    }
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
  // 热卜式年份轴 v0.3.0-ref：节点 = 每大限段中点公历年（出生年 + start + 5，仿整盘基准图 1989/1999/…）
  function renderTimeline(root, chart, cells, detailEl, state) {
    root.innerHTML = '';
    var by = (chart.pre && chart.pre.solar && chart.pre.solar.y) || 0;
    var items = [];
    for (var i = 0; i < chart.daXian.length; i++) {
      var dx = chart.daXian[i];
      var it = document.createElement('div');
      it.className = 'dx-item';
      var yMid = by ? (by + dx.start + 5) : 0;
      it.innerHTML = '<div class="dx-year">' + (yMid ? esc(String(yMid)) : '&nbsp;') + '</div>'
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
    // 大限盘宫名同步（v0.6.0）：选中宫 = 大限命宫 → 每格右下角「大限X宫」沿生年十二宫环整体偏移
    var off = DX_RING.indexOf(chart.palaces[pi].name);
    if (off < 0) off = 0;
    for (var ci = 0; ci < 12; ci++) {
      var dEl = cells[ci] && cells[ci].querySelector('.p-dx');
      if (dEl) dEl.textContent = dxNameOf(chart.palaces[ci].name, off);
    }
  }

  // ===== 对外 =====
  window.RENDER = {
    version: 'v0.5.0',
    monthPillarOf: monthPillarOf,
    cnLunar: cnLunar,
    renderHead: renderHead,
    renderAll: function (headEl, gridRoot, timelineRoot, detailEl, chart, state) {
      renderHead(headEl, chart, state);
      var cells = renderGrid(gridRoot, chart);
      // v0.6.0：宫格可点 —— 点击即选中该宫（高亮/详情/大限轴联动），且该宫成为「大限命宫」，
      // 全盘右下角大限宫名沿生年十二宫环偏移（点命宫右邻父母宫 → 父母宫=大限命宫，福德宫=大限父母宫…）
      for (var pc = 0; pc < 12; pc++) (function (pi) {
        cells[pi].addEventListener('click', function () {
          selectPalace(chart, pi, cells, timelineRoot, detailEl, state);
        });
      })(pc);
      renderTimeline(timelineRoot, chart, cells, detailEl, state);
      return { cells: cells, chart: chart };
    }
  };
})();
