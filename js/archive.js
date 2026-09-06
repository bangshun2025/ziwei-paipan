// ===== 紫微斗数 档案功能（本地 localStorage；v0.4.0）=====
// 借鉴：八字排盘 archive.js 本地主干（去云端/隐私分支）
// 字段模型见 PRD_v0.4.0 §D：{id,name,gender,mode,y,m,d,leap,scIdx,h,mi,prov,city,dist,lng,useSolar,advLateZi,note,createdAt,updatedAt}
(function () {
  var KEY = 'zw_arch_v1';
  var TRASH = 'zw_trash_v1';
  var CORRUPT = 'zw_arch_bak_corrupt';
  var MAX_ARCH = 200;

  var curEditId = null;

  // ---------- 存储 ----------
  function readArr(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      try { localStorage.setItem(CORRUPT, raw || ''); } catch (e2) { }
      return [];
    }
  }
  function writeArr(key, arr) {
    try {
      localStorage.setItem(key, JSON.stringify(arr));
      return true;
    } catch (e) {
      return false;
    }
  }
  function list() { return readArr(KEY); }
  function trash() { return readArr(TRASH); }
  function saveList(arr) { return writeArr(KEY, arr); }
  function saveTrash(arr) { return writeArr(TRASH, arr); }

  function findIdx(arr, id) {
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return i;
    return -1;
  }
  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function genderTxt(g) { return g === 'F' ? '女' : '男'; }
  function modeTxt(m, leap) { return m === 'lunar' ? (leap ? '闰' : '') + '农历' : '公历'; }

  function snapSummary(s) {
    if (!s) return '';
    var sc = '时';
    if (window.APP && window.APP.SHICHEN) {
      var arr = window.APP.SHICHEN;
      for (var i = 0; i < arr.length; i++) if (arr[i].h === s.h && arr[i].mi === s.mi) { sc = arr[i].name; break; }
    }
    var sb = [];
    sb.push(modeTxt(s.mode, s.leap) + ' ' + s.y + '年' + (s.mode === 'lunar' && s.leap ? '闰' : '') + s.m + '月' + s.d + '日');
    sb.push(sc + '时');
    if (s.prov) sb.push(s.prov + (s.city || ''));
    else if (s.lng) sb.push('经度' + s.lng + '°E');
    else sb.push('北京时间');
    return sb.join(' · ');
  }

  // ---------- 卡片渲染 ----------
  function cardHTML(s, inTrash) {
    var name = esc(s.name || '未命名');
    var meta = esc(snapSummary(s));
    var note = s.note ? '<div class="arch-note">' + esc(s.note) + '</div>' : '';
    var btns;
    if (inTrash) {
      btns = '<button type="button" class="link-btn" data-act="restore" data-id="' + esc(s.id) + '">还原</button>' +
        '<button type="button" class="link-btn danger" data-act="purge" data-id="' + esc(s.id) + '">彻底删除</button>';
    } else {
      btns = '<button type="button" class="link-btn" data-act="load" data-id="' + esc(s.id) + '">载入排盘</button>' +
        '<button type="button" class="link-btn" data-act="edit" data-id="' + esc(s.id) + '">编辑</button>' +
        '<button type="button" class="link-btn danger" data-act="del" data-id="' + esc(s.id) + '">删除</button>';
    }
    return '<div class="arch-card">' +
      '<div class="arch-card-main"><span class="arch-name">' + name + '</span>' +
      '<span class="arch-gender">' + genderTxt(s.gender) + '</span>' +
      '<span class="arch-meta">' + meta + '</span>' + note +
      '<span class="arch-time">' + fmtTime(s.updatedAt || s.createdAt) + '</span></div>' +
      '<div class="arch-card-ops">' + btns + '</div></div>';
  }

  function filterBy(arr, kw) {
    kw = (kw || '').trim().toLowerCase();
    if (!kw) return arr;
    return arr.filter(function (s) {
      var hay = ((s.name || '未命名') + ' ' + (s.note || '') + ' ' + s.y + '-' + s.m + '-' + s.d + ' ' + (s.prov || '') + (s.city || '')).toLowerCase();
      return hay.indexOf(kw) !== -1;
    });
  }

  // ---------- 面板 ----------
  function el(id) { return document.getElementById(id); }

  function showMask(maskId, bodyId) {
    el(maskId).classList.remove('hidden');
    if (bodyId) el(bodyId).classList.remove('hidden');
  }
  function hideMask(maskId) { el(maskId).classList.add('hidden'); }

  function renderMain() {
    var arr = filterBy(list(), el('archiveSearch').value);
    var box = el('archList');
    var empty = el('archEmpty');
    box.innerHTML = arr.map(function (s) { return cardHTML(s, false); }).join('');
    empty.classList.toggle('hidden', arr.length > 0);
    el('archCount').textContent = arr.length + '/' + list().length + ' 条';
  }
  function renderTrash() {
    var arr = trash();
    el('trashList').innerHTML = arr.map(function (s) { return cardHTML(s, true); }).join('');
    el('trashCount').textContent = arr.length + ' 条';
    el('trashEmpty2').classList.toggle('hidden', arr.length > 0);
  }
  function toast(msg) {
    var t = el('archToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'archToast';
      t.className = 'arch-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tm);
    t._tm = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  // ---------- CRUD ----------
  function saveCurrent() {
    if (!window.APP || !window.APP.readForm) { toast('表单模块未就绪'); return; }
    var snap = window.APP.readForm();
    if (!snap) { toast('当前输入无效，无法保存'); return; }
    var arr = list();
    if (arr.length >= MAX_ARCH) { toast('档案已达上限 ' + MAX_ARCH + ' 条，请先清理回收站'); return; }
    snap.id = makeId();
    snap.createdAt = Date.now();
    snap.updatedAt = snap.createdAt;
    arr.unshift(snap);
    if (!saveList(arr)) { toast('保存失败：本地存储已满'); return; }
    renderMain();
    toast('已保存「' + (snap.name || '未命名') + '」');
  }
  function loadOne(id) {
    var arr = list();
    var i = findIdx(arr, id);
    if (i < 0) { toast('档案不存在'); return; }
    if (!window.APP || !window.APP.writeForm) { toast('表单模块未就绪'); return; }
    if (!window.APP.writeForm(arr[i])) { toast('载入失败：数据异常'); return; }
    hideMask('archiveMask');
    el('archiveSearch').value = '';
    toast('已载入「' + (arr[i].name || '未命名') + '」并排盘');
  }
  function delOne(id) {
    var arr = list();
    var i = findIdx(arr, id);
    if (i < 0) return;
    var it = arr.splice(i, 1)[0];
    var tr = trash();
    tr.unshift(it);
    saveList(arr); saveTrash(tr);
    renderMain();
    toast('已移入回收站');
  }
  function restoreOne(id) {
    var tr = trash();
    var i = findIdx(tr, id);
    if (i < 0) return;
    var it = tr.splice(i, 1)[0];
    var arr = list();
    arr.unshift(it);
    saveTrash(tr); saveList(arr);
    renderTrash(); renderMain();
    toast('已还原');
  }
  function purgeOne(id) {
    var tr = trash();
    var i = findIdx(tr, id);
    if (i < 0) return;
    tr.splice(i, 1);
    saveTrash(tr);
    renderTrash();
    toast('已彻底删除');
  }
  function emptyTrash() {
    if (!trash().length) return;
    saveTrash([]);
    renderTrash();
    toast('回收站已清空');
  }
  function openEdit(id) {
    curEditId = id;
    var arr = list();
    var i = findIdx(arr, id);
    if (i < 0) return;
    var s = arr[i];
    if (window.APP && window.APP.buildEditForm) {
      window.APP.buildEditForm(s);
    }
    showMask('editMask', 'editPanel');
  }
  function saveEdit() {
    if (!curEditId) return;
    if (!window.APP || !window.APP.readEditForm) { toast('表单模块未就绪'); return; }
    var patch = window.APP.readEditForm();
    if (!patch) { toast('编辑内容无效'); return; }
    var arr = list();
    var i = findIdx(arr, curEditId);
    if (i < 0) return;
    for (var k in patch) if (patch.hasOwnProperty(k)) arr[i][k] = patch[k];
    arr[i].updatedAt = Date.now();
    saveList(arr);
    curEditId = null;
    hideMask('editMask');
    renderMain();
    toast('已保存修改');
  }

  // ---------- 事件绑定（委托）----------
  function onDelegate(containerId, actName, fn) {
    var c = el(containerId);
    if (!c) return;
    c.addEventListener('click', function (ev) {
      var b = ev.target;
      while (b && b !== c && b.tagName !== 'BUTTON') b = b.parentNode;
      if (!b || b === c || b.tagName !== 'BUTTON') return;
      if (b.getAttribute('data-act') !== actName) return;
      fn(b.getAttribute('data-id'));
    });
  }
  function init() {
    if (!window.LOC_DATA || !window.APP) return;
    el('btnArchive').addEventListener('click', function () {
      renderMain();
      showMask('archiveMask', 'archivePanel');
    });
    el('archClose').addEventListener('click', function () { hideMask('archiveMask'); });
    el('archiveMask').addEventListener('click', function (ev) {
      if (ev.target === el('archiveMask')) hideMask('archiveMask');
    });
    el('archiveSearch').addEventListener('input', function () { renderMain(); });
    el('archBtnSave').addEventListener('click', saveCurrent);
    el('archBtnTrash').addEventListener('click', function () {
      renderTrash();
      hideMask('archiveMask');
      showMask('trashMask', 'trashPanel');
    });
    el('trashClose').addEventListener('click', function () { hideMask('trashMask'); });
    el('trashMask').addEventListener('click', function (ev) {
      if (ev.target === el('trashMask')) hideMask('trashMask');
    });
    el('trashEmpty').addEventListener('click', emptyTrash);
    onDelegate('archList', 'load', loadOne);
    onDelegate('archList', 'edit', openEdit);
    onDelegate('archList', 'del', delOne);
    onDelegate('trashList', 'restore', restoreOne);
    onDelegate('trashList', 'purge', purgeOne);
    el('editClose').addEventListener('click', function () { hideMask('editMask'); curEditId = null; });
    el('editMask').addEventListener('click', function (ev) {
      if (ev.target === el('editMask')) { hideMask('editMask'); curEditId = null; }
    });
    el('editSave').addEventListener('click', saveEdit);
  }
  window.ARCHIVE = { init: init, renderMain: renderMain, toast: toast };
})();

