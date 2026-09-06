// ===== 紫微斗数排盘 v0.5.0 — aiinput.js（AI 自然语言录入解析）=====
// 借鉴：八字排盘 parseNaturalInput（v0.23.3 地址匹配基准）；紫微增强：时辰词直读 + 闰月
// 纯解析无 DOM：AIINPUT.parse(text, SHICHEN) → {name,gender,y,m,d,leap,calendarType,h,mi,prov,city,dist}
(function () {
  var TIME_MOD = {
    '凌晨': 0, '半夜': 0, '早晨': 0, '早上': 0, '上午': 0,
    '中午': 12, '下午': 12, '傍晚': 12, '黄昏': 12, '晚上': 12, '夜里': 12
  };
  // 地支时辰词 → SHICHEN 项（'早子'/'晚子' 精确匹配；单字地支直接匹配；'子时' 取早子当日）
  function matchShichenWord(t, SHICHEN) {
    var m = t.match(/(早子|晚子)时|([子丑寅卯辰巳午未申酉戌亥])时/);
    if (!m) return null;
    var key = m[1] || m[2];
    for (var i = 0; i < SHICHEN.length; i++) {
      var sc = SHICHEN[i];
      if (sc.name === key) return { idx: i, h: sc.h, mi: sc.mi, raw: m[0] };
    }
    if (key === '子') return { idx: 0, h: SHICHEN[0].h, mi: SHICHEN[0].mi, raw: m[0] }; // 子时 → 早子（当日）
    return null;
  }

  function parse(text, SHICHEN) {
    var result = { name: '', gender: '', year: null, month: null, day: null, leap: false, calendarType: 'solar', hour: null, min: 0, prov: '', city: '', dist: '' };
    var t = String(text == null ? '' : text).trim();
    if (!t) return result;
    // 地址匹配基准：保留原始文本，避免省=市（如北京市）替换后城市/区县失配
    var t0 = t;

    // 1. 性别
    var genderM = t.match(/[男女]/);
    if (genderM) { result.gender = genderM[0]; t = t.replace(genderM[0], ' '); }

    // 2. 日期 — 中文格式（"日/号"后缀可省略；闰月："1984年闰10月12日"）
    var dateCN = t.match(/(\d{4})\s*年\s*(闰)?(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?/);
    if (dateCN) {
      result.year = parseInt(dateCN[1], 10);
      result.month = parseInt(dateCN[3], 10);
      result.day = parseInt(dateCN[4], 10);
      result.leap = !!dateCN[2];
      t = t.replace(dateCN[0], ' ');
    }
    // 农历标志识别：农历/阴历/旧历/老历（含括号写法）
    if (/农历|阴历|旧历|老历/.test(text)) result.calendarType = 'lunar';
    // 数字格式 1982-10-18 / 1982.10.18 / 1982/10/18
    if (!result.year) {
      var dateNum = t.match(/(\d{4})\s*[-./]\s*(\d{1,2})\s*[-./]\s*(\d{1,2})/);
      if (dateNum) {
        result.year = parseInt(dateNum[1], 10);
        result.month = parseInt(dateNum[2], 10);
        result.day = parseInt(dateNum[3], 10);
        t = t.replace(dateNum[0], ' ');
      }
    }

    // 3. 时间
    // 3a. 时辰词（紫微时辰制：卯时 / 晚子时）
    var scM = matchShichenWord(t, SHICHEN);
    if (scM) {
      result.hour = scM.h; result.min = scM.mi;
      t = t.replace(scM.raw, ' ');
    }
    // 3b. 带修饰词钟点：早上5点、下午3点、晚上8点01分
    if (result.hour === null) {
      var timeMod = t.match(/(凌晨|半夜|早晨|早上|上午|中午|下午|傍晚|黄昏|晚上|夜里)\s*(\d{1,2})\s*[点时:：]\s*(\d{1,2})?\s*[分]?/);
      if (timeMod) {
        var hh = parseInt(timeMod[2], 10);
        var mm = timeMod[3] ? parseInt(timeMod[3], 10) : 0;
        var mod = TIME_MOD[timeMod[1]];
        if (mod === 12) {
          if (hh < 12) hh += 12;
          if (hh === 12 && timeMod[1] === '中午') hh = 12;
        }
        result.hour = hh; result.min = mm;
        t = t.replace(timeMod[0], ' ');
      }
    }
    // 3c. 纯数字时间 5:01 / 05:01 / 5时01分
    if (result.hour === null) {
      var timeNum = t.match(/(\d{1,2})\s*[:：时点]\s*(\d{1,2})?\s*[分]?/);
      if (timeNum) {
        result.hour = parseInt(timeNum[1], 10);
        result.min = timeNum[2] ? parseInt(timeNum[2], 10) : 0;
        t = t.replace(timeNum[0], ' ');
      }
    }
    // 3d. 只有小时：5点
    if (result.hour === null) {
      var hourOnly = t.match(/(\d{1,2})\s*点/);
      if (hourOnly) {
        result.hour = parseInt(hourOnly[1], 10);
        result.min = 0;
        t = t.replace(hourOnly[0], ' ');
      }
    }

    // 4. 地址（省市区三级；长度降序防 "广西" 误配；短名去尾缀）
    var loc = window.LOC_DATA;
    var sortedProv = Object.keys(loc).sort(function (a, b) { return b.length - a.length; });
    for (var pi = 0; pi < sortedProv.length; pi++) {
      var p = sortedProv[pi];
      var shortP = p.replace(/[省市区]$/, '');
      if (t0.indexOf(p) >= 0 || (shortP !== p && t0.indexOf(shortP) >= 0)) {
        result.prov = p;
        t = t.replace(p, ' ').replace(shortP, ' ');
        var cities = Object.keys(loc[p].cities);
        var sortedCities = cities.sort(function (a, b) { return b.length - a.length; });
        for (var ci = 0; ci < sortedCities.length; ci++) {
          var c = sortedCities[ci];
          var shortC = c.replace(/[市县区]$/, '');
          if (t0.indexOf(c) >= 0 || (shortC !== c && t0.indexOf(shortC) >= 0)) {
            result.city = c;
            t = t.replace(c, ' ').replace(shortC, ' ');
            var dists = loc[p].cities[c].dist || [];
            for (var di = 0; di < dists.length; di++) {
              var d = dists[di];
              var shortD = d.replace(/[县区市]$/, '');
              if (t0.indexOf(d) >= 0 || (shortD !== d && t0.indexOf(shortD) >= 0)) {
                result.dist = d;
                t = t.replace(d, ' ').replace(shortD, ' ');
                break;
              }
            }
            break;
          }
        }
        break;
      }
    }

    // 5. 姓名 — 剩余文本中取 2-4 个连续汉字
    var nameM = t.match(/[\u4e00-\u9fa5]{2,4}/);
    if (nameM) result.name = nameM[0];

    return result;
  }

  window.AIINPUT = { parse: parse, version: 'v0.5.0' };
})();
