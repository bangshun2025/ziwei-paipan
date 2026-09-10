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

  // 主星四化角标（v0.6.6-iter：统一「前+化」两字格式 —— 本禄/本权/本科/本忌）
  function huaEl(hua) {
    if (!hua) return '';
    var cls = HUA_CLS[hua];
    return '<i class="hua hua-' + (cls || 'L') + '">' + esc('本' + hua) + '</i>';
  }

    function starEl(name, minor, hua) {
      var cls = minor ? 'minor' : 'major';
      var ch = '';
      for (var i = 0; i < name.length; i++) ch += '<span class="s-ch">' + esc(name.charAt(i)) + '</span>';
      // v0.6.1：四化徽章贴星正下方（禄权科忌小色块，见 .star .hua），独立四化行已废弃
      // v0.6.5-iter：data-star 供四化层标签（限/年/月/日）定位追加
      return '<span class="star ' + cls + '" data-star="' + esc(name) + '">' + ch + (hua ? huaEl(hua) : '') + '</span>';
    }
    function adjEl(name) {
      var ch = '';
      for (var i = 0; i < name.length; i++) ch += '<span class="s-ch">' + esc(name.charAt(i)) + '</span>';
      return '<span class="star adj">' + ch + '</span>';
    }

    // v0.6.2：庙旺平陷行已按界面迭代废弃（原 brightRow 输出 .p-bright），BRIGHT 表保留于 constants.js 备用
    // 神煞区（横线上方）v0.6.6-iter：博士组(蓝) + 岁前组(灰绿) + 将前组(灰) + 大限岁段(黑) + 长生(黑) 合并为一行
    // v0.6.1：岁前星由宫位行首上移至此处，宫位行只保留 本命宫名/干支/大限宫名
    function godLines(palace, dec) {
      var bs = (palace.boshi12 && palace.boshi12[0]) || '';
      var jq = (palace.jiangqian12 && palace.jiangqian12[0]) || '';
      var cs = (palace.changsheng12 && palace.changsheng12[0]) || '';
      var sq = (palace.suiqian12 && palace.suiqian12[0]) || '';
      var s = '';
      // v0.6.6-iter：博士组行并入神煞行（放在大限岁段一行的前面），博士星置行首
      if (bs || sq || jq || dec || cs) {
        s += '<div class="p-meta">';
        if (bs) s += '<i class="gd gd-bs">' + esc(bs) + '</i>';
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

  // v0.6.8-iter：原「四化行点击提亮宫位」（bindHuaRow）已按 #2 取消
  // v0.6.10-iter（#3）：四化相关宫位高亮全部取消（行点击 sf-lit、大限四化金光 dx-lit、工具 huaCellsOf）；
  // 改为「点击任一宫位 → 高亮该宫位的三方四正」（.sq-lit，实现见 selectPalace）

  // v0.6.5-iter：四化层文字标签 —— 在对应星旁贴「限禄/年权/月科/日忌」小标签
  // 各层 class 独立（hx-dx/hx-ln/hx-ly/hx-lr），与生年徽章叠加显示不互扰；层级切换时先清旧再贴新
  function starTagsApply(cells, stars, cls, prefix, on) {
    if (!stars || !stars.length) return;
    var L4 = ['禄', '权', '科', '忌'];
    for (var i = 0; i < stars.length; i++) {
      var nm = stars[i];
      if (!nm) continue;
      for (var p = 0; p < 12; p++) {
        var el = cells[p].querySelector('.star[data-star="' + nm + '"]');
        if (!el) continue;
        var ex = el.querySelector('.' + cls);
        if (on && !ex) {
          var tg = document.createElement('i');
          tg.className = 'hx-tag ' + cls;
          tg.textContent = prefix + L4[i];
          el.appendChild(tg);
        } else if (!on && ex && ex.parentNode) {
          ex.parentNode.removeChild(ex);
        }
      }
    }
  }

  // v0.6.5-iter：清除某层全部四化标签（大限切换 / 选择变更时先清再贴）
  function starTagsClear(cells, cls) {
    if (!cells) return;
    for (var p = 0; p < 12; p++) {
      var ts = cells[p].querySelectorAll('.hx-tag.' + cls);
      for (var i = ts.length - 1; i >= 0; i--) {
        if (ts[i].parentNode) ts[i].parentNode.removeChild(ts[i]);
      }
    }
  }

  // v0.6.6-iter：四化层标签常显 —— 「限/年/月/日」全层贴星下（本命徽章在星内），
  // 刷新时机：初始渲染 / 大限切换(selectPalace) / 时间轴切换(navRefresh)（v0.6.10-iter：行点击高亮取消，行仅作文字展示）
  function tagsRefreshAll(cells) {
    if (!cells) return;
    var cl = ['hx-dx', 'hx-ln', 'hx-ly', 'hx-lr'];
    for (var i = 0; i < cl.length; i++) starTagsClear(cells, cl[i]);
    if (typeof NAV.dGanIdx === 'number' && C.FOUR_HUA[NAV.dGanIdx]) {
      starTagsApply(cells, C.FOUR_HUA[NAV.dGanIdx], 'hx-dx', '限', true);
    }
    var lh = NAV.liuHua || {};
    if (lh.nian && lh.nian.stars) starTagsApply(cells, lh.nian.stars, 'hx-ln', '年', true);
    if (lh.yue && lh.yue.stars) starTagsApply(cells, lh.yue.stars, 'hx-ly', '月', true);
    if (lh.ri && lh.ri.stars) starTagsApply(cells, lh.ri.stars, 'hx-lr', '日', true);
  }

  // ===== 流运时间导航（v0.6.5-iter）：流年/流月/流日可选，联动中宫四化行与高亮 =====
  // 交互对齐大限轴：流年轴跟随选中大限的 10 年；流月=12 农历月建；流日=所选农历月的日序。
  var NAV = {
    chart: null, cells: null,
    axes: { ln: null, lm: null, ld: null },
    rowEls: null,            // 中宫四行（命/年/月/日四化）引用
    sel: { year: 0, month: 1, day: 1 },
    dxPi: -1, liuHua: null, dGanIdx: null   // v0.6.6-iter：dGanIdx = 当前大限宫干（供限标签全量刷新）
  };
  var LM_NAME = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];

  function dxOfPi(chart, pi) {
    for (var i = 0; i < chart.daXian.length; i++) if (chart.daXian[i].palaceIndex === pi) return chart.daXian[i];
    return chart.daXian[0];
  }
  function dxYearRange(chart, dx) { // 大限段 → 流年十年窗口（节点年=段起始年=出生年+虚岁start-1；窗口=该段十年）
    var by = chart.pre.solar.y;
    var y0 = by + dx.start - 1;
    return { y0: y0, y1: y0 + 9 };
  }
  function navClamp() {
    var n = window.ALGO.lunarMonthDays(NAV.sel.year, NAV.sel.month) || 29;
    if (NAV.sel.day > n) NAV.sel.day = n;
    if (NAV.sel.day < 1) NAV.sel.day = 1;
  }

  // 流年轴：铺满选中大限的十年（年份 = 出生年+虚岁-1，段首年即大限轴节点年；点选切换；年份/干支/虚岁）
  function renderLnAxis() {
    var el = NAV.axes.ln; if (!el) return;
    var chart = NAV.chart, by = chart.pre.solar.y;
    var dx = dxOfPi(chart, NAV.dxPi);
    el.innerHTML = '';
    for (var i = 0; i < 10; i++) {
      (function (i) {
        var age = dx.start + i;           // 该段虚岁：start..end
        var year = by + age - 1;          // 年份 = 出生年+虚岁-1（段首年即节点年）
        var gz = window.ALGO.yearGanZhi(year);
        var it = document.createElement('div');
        it.className = 'dx-item' + (NAV.sel.year === year ? ' active' : '');
        it.innerHTML = '<div class="dx-year">' + year + '</div>'
          + '<div class="dx-name">' + esc(gz.gan + gz.zhi) + '</div>'
          + '<div class="dx-age">' + age + '岁</div>';
        it.addEventListener('click', function () { pickYear(year); });
        el.appendChild(it);
      })(i);
    }
  }
  // 流月轴：12 个农历月建（正月…腊月），月干五虎遁随所选流年
  function renderLmAxis() {
    var el = NAV.axes.lm; if (!el) return;
    el.innerHTML = '';
    for (var m = 1; m <= 12; m++) {
      (function (m) {
        var gz = window.ALGO.liuMonthGz(NAV.sel.year, m);
        var it = document.createElement('div');
        it.className = 'dx-item tl-sm' + (NAV.sel.month === m ? ' active' : '');
        it.innerHTML = '<div class="dx-year">' + LM_NAME[m - 1] + '</div>'
          + '<div class="dx-name">' + esc(gz.gan + gz.zhi) + '</div>';
        it.addEventListener('click', function () { pickMonth(m); });
        el.appendChild(it);
      })(m);
    }
  }
  // 流日轴：所选农历月的日序（初一到廿九/三十），日柱按对应公历日
  function renderLdAxis() {
    var el = NAV.axes.ld; if (!el) return;
    var n = window.ALGO.lunarMonthDays(NAV.sel.year, NAV.sel.month) || 29;
    el.innerHTML = '';
    for (var d = 1; d <= n; d++) {
      (function (d) {
        var rs = window.ALGO.lunarToSolar(NAV.sel.year, NAV.sel.month, d, false);
        var gzTxt = '';
        if (rs) { var dgz = window.ALGO.dayGanZhi(rs.y, rs.m, rs.d); gzTxt = dgz.gan + dgz.zhi; }
        var it = document.createElement('div');
        it.className = 'dx-item tl-sm tl-day' + (NAV.sel.day === d ? ' active' : '');
        it.innerHTML = '<div class="dx-year">' + cnDay(d) + '</div>'
          + '<div class="dx-name">' + esc(gzTxt) + '</div>';
        it.addEventListener('click', function () { pickDay(d); });
        el.appendChild(it);
      })(d);
    }
  }
  function pickYear(y) { NAV.sel.year = y; navClamp(); navRebuild(); }
  function pickMonth(m) { NAV.sel.month = m; navClamp(); navRebuild(); }
  function pickDay(d) { NAV.sel.day = d; navRebuild(); }
  function navRebuild() {
    renderLnAxis(); renderLmAxis(); renderLdAxis();
    navRefresh();
  }
  // 选择变化 → 重算四化 → 更新中宫行文字（v0.6.8-iter：#2 取消点击高亮后仅更新文字）+ 常显标签全量重贴
  function navRefresh() {
    if (!NAV.chart) return;
    var lh = window.ALGO.liuHuaOf(NAV.sel);
    NAV.liuHua = lh;
    var texts = [['ln', '年', lh.nian], ['ly', '月', lh.yue], ['lr', '日', lh.ri]];
    for (var i = 0; i < texts.length; i++) {
      var key = texts[i][0], label = texts[i][1], hd = texts[i][2];
      var el = NAV.rowEls && NAV.rowEls[key];
      if (!el) continue;
      var vEl = el.querySelector('.c-v-red');
      if (vEl) vEl.textContent = huaTextOf(hd && hd.stars);
      el.title = label + '四化' + (hd && hd.gz ? '（' + hd.gz + '）' : '');
    }
    // v0.6.6-iter：年/月/日选择变更 → 常显标签全量重贴
    tagsRefreshAll(NAV.cells, NAV.chart);
  }
  // 大限切换 → 流年轴重列 + 流年选择（保持若在范围内；否则今天若在范围内取今天，否则段首年）
  function onDxChange(pi) {
    NAV.dxPi = pi;
    var chart = NAV.chart;
    var rng = dxYearRange(chart, dxOfPi(chart, pi));
    if (NAV.sel.year < rng.y0 || NAV.sel.year > rng.y1) {
      var ty = window.ALGO.todayLiuSel().year;
      NAV.sel.year = (ty >= rng.y0 && ty <= rng.y1) ? ty : rng.y0;
    }
    navClamp();
    navRebuild();
  }
  function navInit(chart, cells, axes) {
    NAV.chart = chart; NAV.cells = cells;
    NAV.axes = axes || { ln: null, lm: null, ld: null };
    var tsel = window.ALGO.todayLiuSel();
    NAV.sel = { year: tsel.year, month: tsel.month, day: tsel.day };
    NAV.dxPi = -1;
    navClamp();
  }

  // v0.6.8-iter：中宫四化行文字 —— 按【星禄 星权 星科 星忌】输出（禄权科忌顺序，#1）
  function huaTextOf(stars) {
    if (!stars || !stars.length) return '【--】';
    var L4 = ['禄', '权', '科', '忌'], a = [];
    for (var i = 0; i < stars.length; i++) a.push(stars[i] + (L4[i] || ''));
    return '【' + a.join(' ') + '】';
  }

  // ===== 渲染 4x4 方盘 + 中宫 =====
  function renderGrid(root, chart) {
    var grid = document.createElement('div');
    grid.className = 'grid';
    var center = document.createElement('div');
    center.className = 'center-area';

    var dxByPalace = {};
    for (var k = 0; k < chart.daXian.length; k++) dxByPalace[chart.daXian[k].palaceIndex] = chart.daXian[k];

    // 中宫 v0.6.3-iter：五行（盘类型/命四化/命宫身宫/子斗流斗/命主身主），字号全统一+左对齐（样式见 .center-area）
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
    var huaTxt = huaTextOf(order4);
    var cH = '';
    cH += '<div class="c-pan"><span class="c-lb">盘类型：</span><span class="c-v c-v-red">' + juTxt + '</span></div>';
    cH += '<div class="c-pan c-hua" data-hua="ming"><span class="c-lb">命四化：</span><span class="c-v c-v-red">' + huaTxt + '</span></div>';
    // v0.6.4-iter：流年/流月/流日四化行（点击各行 → 提亮对应四化宫位；蓝系高亮）
    // v0.6.6-iter：命名去「流」字（年四化/月四化/日四化），与盘中「年权/月禄/日忌」标签呼应
    var lh = cen.liuHua || {};
    function mkLiuHuaRow(label, hd, key) {
      if (!hd || !hd.stars) return '';
      return '<div class="c-pan c-hua" data-hua="' + key + '" title="' + label + '四化（' + esc(hd.gz) + '）">'
        + '<span class="c-lb">' + label + '四化：</span><span class="c-v c-v-red">' + esc(huaTextOf(hd.stars)) + '</span></div>';
    }
    cH += mkLiuHuaRow('年', lh.nian, 'ln');
    cH += mkLiuHuaRow('月', lh.yue, 'ly');
    cH += mkLiuHuaRow('日', lh.ri, 'lr');
    cH += '<div class="c-pair"><span class="c-k">命宫在</span><span class="c-v c-v-pink">' + esc(cen.soulZhi) + '</span>'
      + '<span class="c-k">身宫在</span><span class="c-v c-v-pink">' + esc(cen.bodyZhi) + '</span></div>';
    cH += '<div class="c-pair" title="流斗随当前流年（' + esc(String(cen.liuYear || '')) + '）"><span class="c-k">子斗在</span><span class="c-v c-v-blue">' + esc(cen.ziDouZhi) + '</span>'
      + '<span class="c-k">流斗在</span><span class="c-v c-v-blue">' + esc(cen.liuDouZhi) + '</span></div>';
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

    // 中宫四行引用（navRefresh 更新年/月/日四化文字用；v0.6.10-iter（#3）：行点击高亮已取消）
    NAV.rowEls = {
      ming: center.querySelector('[data-hua="ming"]'),
      ln: center.querySelector('[data-hua="ln"]'),
      ly: center.querySelector('[data-hua="ly"]'),
      lr: center.querySelector('[data-hua="lr"]')
    };

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
  // 年份轴：节点 = 该大限段起始年（虚岁首年 = 出生年 + start - 1；水二局 2-11岁 → 1983 起）
  function renderTimeline(root, chart, cells, detailEl, state) {
    root.innerHTML = '';
    var by = (chart.pre && chart.pre.solar && chart.pre.solar.y) || 0;
    var items = [];
    for (var i = 0; i < chart.daXian.length; i++) {
      var dx = chart.daXian[i];
      var it = document.createElement('div');
      it.className = 'dx-item';
      var yStart = by ? (by + dx.start - 1) : 0;
      it.innerHTML = '<div class="dx-year">' + (yStart ? esc(String(yStart)) : '&nbsp;') + '</div>'
        + '<div class="dx-name">' + esc(dx.name) + '</div>'
        + '<div class="dx-age">' + dx.start + '-' + dx.end + '岁</div>';
      it.setAttribute('data-dx', i);
      (function (pi, el) {
        el.addEventListener('click', function () { selectPalace(chart, pi, cells, root, detailEl, state); });
      })(dx.palaceIndex, it);
      items.push(it);
      root.appendChild(it);
    }
    // v0.6.5-iter：默认选中「今天所在大限段」（时间导航初始即今天；段外流年回退第一段）
    var initDx = chart.daXian[0];
    var ty = window.ALGO.todayLiuSel().year;
    for (var di2 = 0; di2 < chart.daXian.length; di2++) {
      var rng2 = dxYearRange(chart, chart.daXian[di2]);
      if (ty >= rng2.y0 && ty <= rng2.y1) { initDx = chart.daXian[di2]; break; }
    }
    selectPalace(chart, initDx.palaceIndex, cells, root, detailEl, state);
  }

  var activeCell = null, activeDx = null, sqCells = [];  // sqCells（v0.6.10-iter #3）：三方四正高亮格引用
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
    // v0.6.10-iter（#3）：三方四正高亮 —— 本宫 + 三合两宫（p±4）+ 对宫（p+6）；每次重选先清旧
    // （旧 v0.6.4-iter 大限四化金光 dx-lit 已按 #3 取消；大限宫干仍记录，供「限」标签使用）
    for (var sq = 0; sq < sqCells.length; sq++) sqCells[sq].classList.remove('sq-lit');
    sqCells = [];
    var quad = [pi, fix12(pi + 4), fix12(pi + 8), fix12(pi + 6)];
    for (var sq2 = 0; sq2 < quad.length; sq2++) {
      var sqc = cells[quad[sq2]];
      if (sqc) { sqc.classList.add('sq-lit'); sqCells.push(sqc); }
    }
    var dPal = chart.palaces[pi];
    var dGanIdx = (dPal && typeof dPal.ganIdx === 'number') ? dPal.ganIdx : C.GAN_IDX[dPal.ganZhi.charAt(0)];
    NAV.dGanIdx = (typeof dGanIdx === 'number') ? dGanIdx : null;
    tagsRefreshAll(cells); // v0.6.6-iter：限/年/月/日标签全量重贴（常显）
    // 大限盘宫名同步（v0.6.0）：选中宫 = 大限命宫 → 每格右下角「大限X宫」沿生年十二宫环整体偏移
    var off = DX_RING.indexOf(chart.palaces[pi].name);
    if (off < 0) off = 0;
    for (var ci = 0; ci < 12; ci++) {
      var dEl = cells[ci] && cells[ci].querySelector('.p-dx');
      if (dEl) dEl.textContent = dxNameOf(chart.palaces[ci].name, off);
    }
    // v0.6.5-iter：时间导航联动（流年轴跟随重列 + 流年选择保持/回落今天）
    if (NAV.chart === chart) onDxChange(pi);
  }

  // ===== 对外 =====
  window.RENDER = {
    version: 'v0.5.0',
    monthPillarOf: monthPillarOf,
    cnLunar: cnLunar,
    renderHead: renderHead,
    renderAll: function (headEl, gridRoot, timelineRoot, detailEl, chart, state, axes) {
      renderHead(headEl, chart, state);
      var cells = renderGrid(gridRoot, chart);
      // v0.6.5-iter：时间导航初始化（默认=今天：大限段/流年/流月/流日）——需在 renderTimeline 前
      navInit(chart, cells, axes);
      // v0.6.0：宫格可点 —— 点击即选中该宫（高亮/详情/大限轴联动），且该宫成为「大限命宫」，
      // 全盘右下角大限宫名沿生年十二宫环偏移（点命宫右邻父母宫 → 父母宫=大限命宫，福德宫=大限父母宫…）
      for (var pc = 0; pc < 12; pc++) (function (pi) {
        cells[pi].addEventListener('click', function () {
          selectPalace(chart, pi, cells, timelineRoot, detailEl, state);
        });
      })(pc);
      renderTimeline(timelineRoot, chart, cells, detailEl, state);
      navRefresh(); // 兜底同步（selectPalace 已触发导航刷新，此处幂等保齐）
      return { cells: cells, chart: chart };
    }
  };
})();
