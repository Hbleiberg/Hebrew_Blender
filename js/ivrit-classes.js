/* IvritSuite — the shared class roster (window.IvritClasses).
 *
 * One class and its students, entered once and used by every roster-using tool (the Classroom Dashboard, Name
 * Tags, Flash Cards, reading assignments). How it works and why: docs/reference/class-roster.md.
 *
 * ONLY THIS FILE WRITES localStorage['ivritSuite_classes']. A page reads through list() / get() and changes a
 * class through the operations below; each operation re-reads the store, applies one stamped change and writes,
 * so a class another tab or device just sent is never overwritten by a copy held in memory.
 *
 * It talks to no server. The account layer (js/ivrit-saves.js) syncs the key as the tool `Classes`: one
 * `class` row per class (merged by mergeClass below, which a page hands to IvritSaves.attach) and one small
 * `retired` row naming deleted classes.
 *
 * Existing data (the Dashboard's rosters in hebrewDashboard_settings, the Name Tags lists in
 * hebrewNameTags_lists) is READ, never rewritten: ids are computed from the old data, so two devices holding
 * the same old class produce the same bytes, and an old source is copied into the store only once the account
 * has been heard from (adopt, after a successful hydration) or when a person edits that class.
 *
 * Every name is untrusted (another device, a shared file): storage is parsed with a prototype-safe reviver and
 * the editor writes names with textContent only.
 */
(function (root) {
  'use strict';

  var KEY = 'ivritSuite_classes';
  var LEDGER_KEY = 'ivritSuite_classesLegacy';   // per device, erase-only: which near-match notices were shown
  var DASH_KEY = 'hebrewDashboard_settings';
  var NT_KEY = 'hebrewNameTags_lists';
  var MAX_CLASSES = 40, MAX_STUDENTS = 200, MAX_FIELD = 120, GONE_CAP = 400;
  var FIELDS = ['he', 'en', 'tr', 'ex'];
  var FOLD_STAMP = 1;   // a list folded into its roster is retired with this fixed stamp: every device writes the same bytes

  /* ---------- tiny helpers ---------- */
  function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function bad(k) { return k === '__proto__' || k === 'constructor' || k === 'prototype'; }
  function str(v) { return typeof v === 'string' ? v : ''; }
  function dict() { return Object.create(null); }   // a map looked up by an untrusted id: no inherited keys
  function num(v) { return (typeof v === 'number' && isFinite(v)) ? v : 0; }
  function safeParse(text) { return JSON.parse(text, function (k, v) { return bad(k) ? undefined : v; }); }
  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  // Canonical JSON (keys sorted at every depth): what two devices compare, and every symmetric tie-break.
  function canon(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    var keys = Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort();
    return '{' + keys.map(function (k) { return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}';
  }
  function lsGet(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } }
  function parseKey(k) {
    var raw = lsGet(k);
    if (!raw) return null;
    try { var v = safeParse(raw); return isObj(v) ? v : null; } catch (e) { return null; }
  }
  function t(key, fallback, params) {
    var v = null;
    try { if (root.I18n && root.I18n.t) { v = root.I18n.t(key, params); if (!v || v === key) v = null; } } catch (e) { v = null; }
    if (v === null) v = fallback;
    if (params) v = String(v).replace(/\{(\w+)\}/g, function (m, k) { return hasOwn(params, k) ? params[k] : m; });
    return v;
  }
  function hasStoredSession() {
    try { return !!(root.IvritAccount && typeof root.IvritAccount.hasStoredSession === 'function' && root.IvritAccount.hasStoredSession()); } catch (e) { return false; }
  }
  // Two FNV-1a passes, base 36: short, synchronous and the same on every device. Not a secret, only a name.
  function fnv(s, h) { for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shortHash(s) { return fnv(s, 0x811c9dc5).toString(36) + fnv(s, 0x9747b28c).toString(36); }
  var _seq = 0;
  function randomId(prefix) { return prefix + Date.now().toString(36) + '_' + (_seq++).toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ══════════════════════════════════════════════════════
     NAMES AND CSV — moved from the Name Tags page (its parser, header table, script sorter, name matcher and
     add-by-name merge), unchanged in behavior.
     ══════════════════════════════════════════════════════ */
  var HEB_RE = /[א-ת]/;
  var MARKS_RE = /[֑-ׇֽֿׁׂׅׄ]/g;   // nikkud and te'amim (maqaf, paseq and sof pasuq stay)
  var VOWEL_RE = /[ְ-ׇּׁׂ]/;
  function field(row, f) { return str(row && row[f]); }
  // A name as matching sees it: capitals, spacing and nikkud ignored, a maqaf read as a hyphen, a geresh as an apostrophe.
  function matchKey(s) {
    return str(s).normalize('NFC').replace(MARKS_RE, '').replace(/[־‐-―]/g, '-').replace(/[׳‘’`]/g, "'")
      .replace(/\s+/g, ' ').trim().toLowerCase();
  }
  // Words with Hebrew letters are the Hebrew name, the rest the English name; the separators between them go.
  function splitName(line) {
    var he = [], en = [];
    String(line || '').split(/[\s\/|·•()[\]{}]+/).forEach(function (tok) {
      var x = tok.replace(/^[-–—,.;:]+|[-–—,.;:]+$/g, '');
      if (x) (HEB_RE.test(x) ? he : en).push(x);
    });
    return { he: he.join(' ').slice(0, MAX_FIELD), en: en.join(' ').slice(0, MAX_FIELD) };
  }
  // One Dashboard roster line as a student. A line in ONE script is kept exactly as typed, punctuation included
  // ("David K.", "Maya (aide)"); a line holding both is divided at its separator, else word by word.
  function splitRosterLine(line) {
    var s = String(line || '').replace(/\s+/g, ' ').trim();
    var hasHe = HEB_RE.test(s), hasLat = /[A-Za-z]/.test(s);
    if (!(hasHe && hasLat)) return hasHe ? { he: s.slice(0, MAX_FIELD), en: '' } : { he: '', en: s.slice(0, MAX_FIELD) };
    var parts = s.split(/\s*[\/|·•]\s*|\s+[-–—]\s+/).filter(Boolean);
    if (parts.length === 2) {
      var aHe = HEB_RE.test(parts[0]), aLat = /[A-Za-z]/.test(parts[0]), bHe = HEB_RE.test(parts[1]), bLat = /[A-Za-z]/.test(parts[1]);
      if (aHe && !aLat && bLat && !bHe) return { he: parts[0].slice(0, MAX_FIELD), en: parts[1].slice(0, MAX_FIELD) };
      if (bHe && !bLat && aLat && !aHe) return { he: parts[1].slice(0, MAX_FIELD), en: parts[0].slice(0, MAX_FIELD) };
    }
    return splitName(s);
  }
  // Which incoming row names which student: a row names a student when every name both have agrees and they share
  // at least one; a pair agreeing on both names is matched first, and each student is matched at most once, so two
  // students who share a name stay two. Returns a Map of incoming index → target index.
  function pairRows(target, rows) {
    var keys = function (r) { return { he: matchKey(field(r, 'he')), en: matchKey(field(r, 'en')) }; };
    var have = target.map(keys), want = rows.map(keys);
    var score = function (a, b) {
      var agree = 0;
      for (var i = 0; i < 2; i++) { var f = i ? 'en' : 'he'; if (a[f] && b[f]) { if (a[f] !== b[f]) return 0; agree++; } }
      return agree;
    };
    var used = {}, pair = new Map();
    [2, 1].forEach(function (need) {
      want.forEach(function (w, j) {
        if (pair.has(j)) return;
        for (var i = 0; i < have.length; i++) if (!used[i] && score(have[i], w) === need) { used[i] = true; pair.set(j, i); return; }
      });
    });
    return pair;
  }
  // A match only fills what the student lacks (a blank field, or the nikkud of an unpointed Hebrew name with the
  // same letters) — nothing typed is replaced, and a field a person cleared on purpose (stamped) stays cleared.
  function fillStudent(target, row) {
    var changed = false;
    FIELDS.forEach(function (f) {
      var old = field(target, f).trim(), got = field(row, f).trim().slice(0, MAX_FIELD);
      if (!got || got === old) return;
      if (isObj(target.t) && target.t[f]) return;
      if (old && !(f === 'he' && !VOWEL_RE.test(old) && VOWEL_RE.test(got) && matchKey(old) === matchKey(got))) return;
      target[f] = got;
      changed = true;
    });
    return changed;
  }
  // Sort incoming rows into students already in `target` and new ones (`fresh`); matched ones are filled in place.
  function mergeRows(target, rows) {
    var pair = pairRows(target, rows), out = { fresh: [], filled: 0, same: 0, ex: false };
    rows.forEach(function (r, j) {
      if (!pair.has(j)) { out.fresh.push(r); return; }
      var tg = target[pair.get(j)], hadEx = field(tg, 'ex');
      if (fillStudent(tg, r)) { out.filled++; if (field(tg, 'ex') !== hadEx) out.ex = true; } else out.same++;
    });
    return out;
  }
  // RFC-4180 (quoted fields, doubled quotes, line breaks inside quotes) with the delimiter sniffed: tab, semicolon, comma.
  function parseDelimited(text) {
    text = String(text || '');
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    var first = text.split(/\r?\n/).filter(function (l) { return l.trim(); })[0] || '';
    var count = function (ch) { return first.split(ch).length - 1; };
    var d = count('\t') ? '\t' : (count(';') > count(',') ? ';' : ',');
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
        continue;
      }
      if (c === '"') q = true;
      else if (c === d) { row.push(cell); cell = ''; }
      else if (c === '\r') { /* CRLF: the LF ends the row */ }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim(); }); });
  }
  var HEADERS = {   // i18n-ignore: spreadsheet column names a teacher's file may use, in English and Hebrew
    he: /^(hebrew|hebrew name|hebrew names|heb|עברית|שם עברי|שם בעברית|שם)$/,
    en: /^(english|english name|name|first|first name|firstname|given name|student|student name|שם באנגלית|אנגלית|שם פרטי)$/,
    last: /^(last|last name|lastname|surname|family name|שם משפחה)$/,
    tr: /^(transliteration|translit|pronunciation|transliterated|sounds like|תעתיק|הגייה)$/,
    ex: /^(extra|extra line|class|grade|room|homeroom|כיתה|שכבה)$/
  };
  var EN_NAMED = /^(english|english name|שם באנגלית|אנגלית)$/;   // i18n-ignore: the en headers that name the language, not just a name
  // A parsed table as students: columns found by an English or Hebrew header, else by what they hold.
  function importRows(table) {
    var norm = function (s) { return String(s || '').replace(/^﻿/, '').trim().toLowerCase().replace(/\s+/g, ' '); };
    var map = {}, body = table;
    (table[0] || []).forEach(function (c, i) {
      var h = norm(c);
      for (var f in HEADERS) {
        if (!HEADERS[f].test(h)) continue;
        if (!(f in map)) { map[f] = i; break; }
        // A first-name column beside one named for English: the English column is the English name, and the
        // first-name column is the name's first half, read below with the last name in its own script.
        if (f === 'en' && !('first' in map) && EN_NAMED.test(h) !== EN_NAMED.test(norm(table[0][map.en]))) {
          if (EN_NAMED.test(h)) { map.first = map.en; map.en = i; } else map.first = i;
          break;
        }
      }
    });
    if (Object.keys(map).length) body = table.slice(1);
    if (!('he' in map) && !('en' in map)) {   // no column is named for a name: find them by what they hold
      var taken = {}, cols = 0, latin = [];
      Object.keys(map).forEach(function (k) { taken[map[k]] = true; });
      body.forEach(function (r) { if (r.length > cols) cols = r.length; });
      for (var i = 0; i < cols; i++) {
        if (taken[i]) continue;
        var vals = body.map(function (r) { return (r[i] || '').trim(); }).filter(Boolean);
        if (!vals.length) continue;
        // A class or room column ("3B", "Room 12", "ג1", or one value on every row) is the extra line; a column
        // of bare numbers (an ID) stays unread.
        if (!('ex' in map) && (vals.every(function (v) { return v.length <= 12 && /\d/.test(v) && /[A-Za-zא-ת]/.test(v); })
            || (vals.length >= 3 && vals.every(function (v) { return v === vals[0]; })))) { map.ex = i; continue; }
        if (vals.filter(function (v) { return HEB_RE.test(v); }).length * 2 >= vals.length) { if (!('he' in map)) map.he = i; }
        else if (vals.some(function (v) { return /[A-Za-z]/.test(v); })) latin.push(i);
      }
      if (latin[0] != null) map.en = latin[0];
      if (latin[1] != null && !('tr' in map)) map.tr = latin[1];
    }
    var get = function (r, f) { return (map[f] != null ? String(r[map[f]] || '') : '').replace(/\s+/g, ' ').trim().slice(0, MAX_FIELD); };
    var out = [];
    body.forEach(function (r) {
      var he = get(r, 'he'), en = [get(r, 'en'), 'first' in map ? '' : get(r, 'last')].filter(Boolean).join(' ').slice(0, MAX_FIELD);
      if ('first' in map) {
        var full = [get(r, 'first'), get(r, 'last')].filter(Boolean).join(' ').slice(0, MAX_FIELD);
        if (HEB_RE.test(full)) { if (!he) he = full; } else if (!en) en = full;
      }
      // A name in the other script's column is sorted by script, as a Dashboard roster line is.
      if ((HEB_RE.test(en) && !HEB_RE.test(he)) || (!en && /[A-Za-z]/.test(he))) { var sp = splitName(he + ' ' + en); he = sp.he; en = sp.en; }
      var row = { he: he, en: en }, tr = get(r, 'tr'), ex = get(r, 'ex');
      if (tr) row.tr = tr;
      if (ex) row.ex = ex;
      if (row.he || row.en || row.tr) out.push(row);   // a row with only a class or room is not a student
    });
    return out;
  }
  // Excel's "Unicode Text" is UTF-16 (a byte-order mark, or NULs on one side of every pair); then UTF-8; a file
  // saved in the Windows Hebrew code page falls back to windows-1255.
  function decodeCsv(buf) {
    var head = new Uint8Array(buf, 0, Math.min(512, buf.byteLength));
    var nuls = function (parity) { var n = 0; for (var i = 0; i < head.length; i++) if (head[i] === 0 && i % 2 === parity) n++; return n; };
    var utf16 = head[0] === 0xFF && head[1] === 0xFE ? 'utf-16le' : head[0] === 0xFE && head[1] === 0xFF ? 'utf-16be'
      : nuls(1) >= 4 && !nuls(0) ? 'utf-16le' : nuls(0) >= 4 && !nuls(1) ? 'utf-16be' : '';
    try { return new TextDecoder(utf16 || 'utf-8', { fatal: true }).decode(buf); }
    catch (e) { try { return new TextDecoder('windows-1255').decode(buf); } catch (e2) { return ''; } }
  }
  function csvCell(s) {
    s = String(s == null ? '' : s);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;   // a spreadsheet would run a cell that starts like a formula
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  var CSV_HEAD = ['Hebrew', 'English', 'Transliteration', 'Extra'];   // i18n-ignore: the file's column names (read back on import)
  // The Extra column is the line each student prints: their own, else the class's, so the file round-trips.
  function csvText(cls) {
    var classEx = str(cls && cls.extra).trim();
    var lines = [CSV_HEAD.join(',')].concat(((cls && cls.students) || []).map(function (s) {
      return FIELDS.map(function (f) { return csvCell(f === 'ex' ? (field(s, f).trim() || classEx) : field(s, f)); }).join(',');
    }));
    return lines.join('\r\n') + '\r\n';
  }

  /* ══════════════════════════════════════════════════════
     THE STORE — { v:1, classes: { id: class }, retired: { id: ms } }
     ══════════════════════════════════════════════════════ */
  function readStore() {
    var obj = parseKey(KEY) || {};
    if (!isObj(obj.classes)) obj.classes = {};
    if (!isObj(obj.retired)) obj.retired = {};
    if (obj.v == null) obj.v = 1;
    return obj;
  }
  var listeners = [];
  function emit() { listeners.slice().forEach(function (fn) { try { fn(); } catch (e) {} }); }
  // Writes only what changed; a store with nothing in it is never created (nothing is written on load).
  function writeStore(store) {
    var out = {}, k;
    for (k in store) if (hasOwn(store, k) && !bad(k)) out[k] = store[k];
    if (!Object.keys(out.retired || {}).length) delete out.retired;   // an empty record would read as a change to its account row
    var text = JSON.stringify(out), cur = lsGet(KEY);
    if (cur === null && !Object.keys(out.classes || {}).length && !out.retired) return true;
    if (text === cur) return true;
    try { root.localStorage.setItem(KEY, text); } catch (e) { return false; }
    emit();
    return true;
  }
  function studentsOf(cls) {
    return (isObj(cls) && Array.isArray(cls.students) ? cls.students : []).filter(function (s) { return isObj(s) && typeof s.id === 'string' && s.id && !bad(s.id); });
  }
  function maxOf(tmap) { var m = 0; if (isObj(tmap)) for (var k in tmap) if (hasOwn(tmap, k) && num(tmap[k]) > m) m = num(tmap[k]); return m; }
  function studentStamp(s) { return maxOf(s && s.t); }
  function classStamp(cls) {
    var m = Math.max(num(cls.updated), num(cls.created), maxOf(cls.t));
    studentsOf(cls).forEach(function (s) { m = Math.max(m, studentStamp(s)); });
    if (isObj(cls.gone)) for (var k in cls.gone) if (hasOwn(cls.gone, k) && isObj(cls.gone[k])) m = Math.max(m, num(cls.gone[k].t));
    return m;
  }
  // A stamp later than everything in the class, so a device with a slow clock still makes "the later edit".
  function nextStamp(cls, floor) { return Math.max(Date.now(), (cls ? classStamp(cls) : 0) + 1, num(floor) + 1); }
  // Shown unless it was deleted — and shown again when it was edited after that (the later human action wins).
  function alive(store, id) {
    var r = hasOwn(store.retired, id) ? num(store.retired[id]) : 0;
    if (!r) return true;
    var c = hasOwn(store.classes, id) ? store.classes[id] : null;
    return isObj(c) && num(c.updated) > r;
  }

  /* ══════════════════════════════════════════════════════
     mergeClass(a, b) — pure. The same answer whichever side is "mine"; a copy merged with itself is itself.
     Students are unioned by id; a field both copies hold takes the later stamp (unstamped: a filled value beats
     an empty one, two filled ones keep the one that sorts later); a deleted student stays deleted unless edited
     after the deletion; unknown fields survive.
     ══════════════════════════════════════════════════════ */
  function pick(va, ta, vb, tb) {
    ta = num(ta); tb = num(tb);
    if (ta > tb) return { v: va, t: ta };
    if (tb > ta) return { v: vb, t: tb };
    if (va === undefined) return { v: vb, t: tb };
    if (vb === undefined) return { v: va, t: ta };
    if (!ta) {   // neither was edited by a person: a filled value beats an empty one
      var ea = va === '' || va === null, eb = vb === '' || vb === null;
      if (ea && !eb) return { v: vb, t: 0 };
      if (eb && !ea) return { v: va, t: 0 };
    }
    return { v: canon(va) >= canon(vb) ? va : vb, t: ta };
  }
  function mergeFields(a, b, skip) {
    var out = {}, ts = {}, ta = isObj(a.t) ? a.t : {}, tb = isObj(b.t) ? b.t : {}, k, seen = {};
    var each = function (k2) {
      if (seen[k2] || bad(k2) || skip[k2]) return;
      seen[k2] = true;
      var p = pick(hasOwn(a, k2) ? a[k2] : undefined, ta[k2], hasOwn(b, k2) ? b[k2] : undefined, tb[k2]);
      if (p.v !== undefined) out[k2] = p.v;
      if (p.t) ts[k2] = p.t;
    };
    for (k in a) if (hasOwn(a, k)) each(k);
    for (k in b) if (hasOwn(b, k)) each(k);
    for (k in ta) if (hasOwn(ta, k) && !bad(k) && !seen[k] && num(ta[k])) ts[k] = Math.max(num(ta[k]), num(tb[k]));   // a stamp for a field neither holds (the order)
    for (k in tb) if (hasOwn(tb, k) && !bad(k) && !seen[k] && num(tb[k])) ts[k] = Math.max(num(ta[k]), num(tb[k]));
    return { out: out, t: ts };
  }
  function mergeStudent(a, b) {
    var m = mergeFields(a, b, { t: true });
    if (Object.keys(m.t).length) m.out.t = m.t;
    return m.out;
  }
  function mergeClass(a, b) {
    if (!isObj(a)) return isObj(b) ? clone(b) : a;
    if (!isObj(b)) return clone(a);
    var m = mergeFields(a, b, { t: true, students: true, gone: true, created: true, updated: true });
    var out = m.out, ts = m.t;
    if (num(a.created) || num(b.created)) out.created = (num(a.created) && num(b.created)) ? Math.min(a.created, b.created) : (num(a.created) || num(b.created));
    if (num(a.updated) || num(b.updated)) out.updated = Math.max(num(a.updated), num(b.updated));
    // the deleted students: the later deletion's record
    var gone = dict(), ga = isObj(a.gone) ? a.gone : {}, gb = isObj(b.gone) ? b.gone : {}, id;
    var takeGone = function (src) {
      for (var k in src) {
        if (!hasOwn(src, k) || bad(k) || !isObj(src[k])) continue;
        var cur = gone[k];
        if (!cur || num(src[k].t) > num(cur.t) || (num(src[k].t) === num(cur.t) && canon(src[k]) > canon(cur))) gone[k] = src[k];
      }
    };
    takeGone(ga); takeGone(gb);
    // the students, by id
    var sa = studentsOf(a), sb = studentsOf(b), ia = dict(), ib = dict(), merged = dict();
    sa.forEach(function (s) { ia[s.id] = s; });
    sb.forEach(function (s) { ib[s.id] = s; });
    var consider = function (sid) {
      if (sid in merged) return;
      var s = (ia[sid] && ib[sid]) ? mergeStudent(ia[sid], ib[sid]) : clone(ia[sid] || ib[sid]);
      var g = gone[sid];
      if (g) { if (studentStamp(s) > num(g.t)) delete gone[sid]; else s = null; }
      merged[sid] = s;
    };
    sa.forEach(function (s) { consider(s.id); });
    sb.forEach(function (s) { consider(s.id); });
    // the order: the copy that was reordered later leads; the other copy's own students follow in its order
    var oa = num((isObj(a.t) ? a.t : {}).students), ob = num((isObj(b.t) ? b.t : {}).students);
    var idsA = sa.map(function (s) { return s.id; }), idsB = sb.map(function (s) { return s.id; });
    var aLeads = oa !== ob ? oa > ob : canon(idsA) >= canon(idsB);
    var lead = aLeads ? idsA : idsB, rest = aLeads ? idsB : idsA, placed = dict(), students = [];
    lead.concat(rest).forEach(function (sid) {
      if (placed[sid]) return;
      placed[sid] = true;
      if (merged[sid]) students.push(merged[sid]);
    });
    out.students = students;
    // the newest GONE_CAP deletions are kept
    var gids = Object.keys(gone);
    if (gids.length > GONE_CAP) {
      gids.sort(function (x, y) { return (num(gone[y].t) - num(gone[x].t)) || (x < y ? -1 : 1); });
      gids.slice(GONE_CAP).forEach(function (g) { delete gone[g]; });
    }
    if (Object.keys(gone).length) out.gone = gone;
    if (Object.keys(ts).length) out.t = ts;
    for (id in out) if (out[id] === undefined) delete out[id];
    return out;
  }

  /* ══════════════════════════════════════════════════════
     EXISTING DATA — read, never rewritten. Each old source keeps an id computed from the old data itself.
     ══════════════════════════════════════════════════════ */
  // The Dashboard's untouched starter class (the literal, plus the localized default) is not a class.
  function isStarterName(name) {
    var n = str(name).trim();
    return n === '' || n === 'My class' || n === t('dashboard.picker.default_class_name', 'My class');
  }
  function dashSourcesFrom(rosters) {
    var out = [];
    if (!isObj(rosters)) return out;
    Object.keys(rosters).sort().forEach(function (id) {
      var r = rosters[id];
      if (bad(id) || !isObj(r)) return;
      var seen = {}, lines = [];
      (Array.isArray(r.names) ? r.names : []).forEach(function (n) {
        if (typeof n !== 'string') return;
        var line = n.trim();
        if (line && !hasOwn(seen, line)) { seen[line] = true; lines.push(line); }
      });
      if (!lines.length && isStarterName(r.name)) return;
      out.push({ from: 'dash', id: id, name: str(r.name).trim() || 'My class', lines: lines });
    });
    return out;
  }
  function ntSourcesFrom(lists) {
    var out = [];
    if (!isObj(lists)) return out;
    Object.keys(lists).sort().forEach(function (name) {
      var l = lists[name];
      if (bad(name) || !isObj(l)) return;
      var rows = [], rowAt = [];   // rowAt: each kept row's index in the stored list (the scrub names rows by it)
      (Array.isArray(l.rows) ? l.rows : []).forEach(function (r, i) { if (isObj(r)) { rows.push(r); rowAt.push(i); } });
      out.push({ from: 'nt', id: 'nt_' + shortHash(name.normalize('NFC')), name: name, extra: str(l.extra).trim(), rows: rows, rowAt: rowAt });
    });
    return out;
  }
  function classFromSource(src) {
    var cls = { id: src.id, name: src.name.slice(0, MAX_FIELD), students: [] };
    if (src.from === 'dash') {
      src.lines.forEach(function (line) {
        var sp = splitRosterLine(line);
        if (!sp.he && !sp.en) sp.en = line.slice(0, MAX_FIELD);
        cls.students.push({ id: 's' + shortHash(src.id + '\u0001' + line + '\u00010'), he: sp.he, en: sp.en });
      });
      return cls;
    }
    if (src.extra) cls.extra = src.extra.slice(0, MAX_FIELD);
    var count = {};
    src.rows.forEach(function (r) {
      var he = field(r, 'he').trim().slice(0, MAX_FIELD), en = field(r, 'en').trim().slice(0, MAX_FIELD), tr = field(r, 'tr').trim().slice(0, MAX_FIELD), ex = field(r, 'ex').trim().slice(0, MAX_FIELD);
      if (!he && !en && !tr) return;
      var key = matchKey(he) + '\u0001' + matchKey(en) + '\u0001' + matchKey(tr);
      var n = count[key] = (hasOwn(count, key) ? count[key] + 1 : 0);
      var s = { id: 's' + shortHash(src.id + '\u0001' + key + '\u0001' + n), he: he, en: en };
      if (tr) s.tr = tr;
      if (ex) s.ex = ex;
      cls.students.push(s);
    });
    return cls;
  }
  // A roster and a list are one class when they have the same name and the same students, one for one. The
  // roster-id class is then the class and takes what the list adds. Returns [{ d, n, pairs }] (pairs: list student
  // index → roster student index). Each roster folds at most one list.
  // A side may carry `gone` — the students its class removed: a list student no student of the roster side answers
  // to must then be one of those (the old row of a student removed since), and is not brought back.
  function foldPairs(d, n) {
    if (!n.cls.students.length || matchKey(d.cls.name) !== matchKey(n.cls.name)) return null;
    var pairs = pairRows(d.cls.students, n.cls.students);
    if (pairs.size !== d.cls.students.length) return null;              // every student of the roster side is on the list
    if (pairs.size !== n.cls.students.length) {
      var rest = n.cls.students.filter(function (st, k) { return !pairs.has(k); });
      if (!d.gone || !d.gone.length || pairRows(d.gone, rest).size !== rest.length) return null;
    }
    return pairs;
  }
  function findFolds(dash, nts, skipN, skipD) {
    var folds = [], usedD = dict();
    nts.forEach(function (n) {
      if (skipN(n.cls.id)) return;
      for (var i = 0; i < dash.length; i++) {
        var d = dash[i];
        if (usedD[d.cls.id] || skipD(d.cls.id, n.cls.id)) continue;
        var pairs = foldPairs(d, n);
        if (!pairs) continue;
        usedD[d.cls.id] = true;
        folds.push({ d: d, n: n, pairs: pairs });
        return;
      }
    });
    return folds;
  }
  function applyFold(target, fold) {
    var changed = false, byId = dict();
    studentsOf(target).forEach(function (s) { byId[s.id] = s; });
    fold.pairs.forEach(function (di, ni) {
      var st = byId[fold.d.cls.students[di].id], from = fold.n.cls.students[ni];
      if (st && fillStudent(st, from)) changed = true;
      if (st && !str(st.username) && str(from.username)) { st.username = from.username; changed = true; }   // (only a stored list class has one)
    });
    if (!str(target.accountClassId) && str(fold.n.cls.accountClassId)) { target.accountClassId = fold.n.cls.accountClassId; changed = true; }
    if (!str(target.extra).trim() && !(isObj(target.t) && target.t.extra) && fold.n.cls.extra) { target.extra = fold.n.cls.extra; changed = true; }
    if (target.fold !== fold.n.cls.id) { target.fold = fold.n.cls.id; changed = true; }   // which old list this class also stands for (scrub reads it)
    return changed;
  }
  // Everything the view needs, from the store and the old keys as they are now.
  // The old keys as classes, remembered while their text is unchanged: a page that saves on every keystroke reads
  // the view each time, and hashing every old line again would be the cost of each key press. What is returned is
  // shared and never changed by its readers (they clone before they fill).
  var _legacyMemo = null;
  function legacySources() {
    var d = lsGet(DASH_KEY), n = lsGet(NT_KEY), starter = t('dashboard.picker.default_class_name', 'My class');
    if (_legacyMemo && _legacyMemo.d === d && _legacyMemo.n === n && _legacyMemo.starter === starter) return _legacyMemo;
    _legacyMemo = { d: d, n: n, starter: starter,
      dash: dashSourcesFrom((parseKey(DASH_KEY) || {}).rosters).map(function (s) { return { src: s, cls: classFromSource(s) }; }),
      nts: ntSourcesFrom(parseKey(NT_KEY)).map(function (s) { return { src: s, cls: classFromSource(s) }; }) };
    return _legacyMemo;
  }
  // A class of the store as a side of a fold: its students as they are now, and (the roster side) the ones removed.
  function storedSide(id, c) {
    var gone = [];
    if (isObj(c.gone)) Object.keys(c.gone).forEach(function (k) { if (isObj(c.gone[k])) gone.push(c.gone[k]); });
    var cls = { id: id, name: str(c.name), students: studentsOf(c) };
    if (str(c.extra).trim()) cls.extra = str(c.extra).trim();
    if (str(c.accountClassId)) cls.accountClassId = str(c.accountClassId);
    return { cls: cls, gone: gone, stored: true };
  }
  function survey(store) {
    var ls = legacySources(), dash = ls.dash, nts = ls.nts;
    var live = function (id) { var c = hasOwn(store.classes, id) ? store.classes[id] : null; return (isObj(c) && alive(store, id)) ? c : null; };
    // A list takes part while it is not folded or deleted already — also when it is a stored class of its own (two
    // devices that each held one of the two old sources made two classes; they are joined like any other pair).
    var skipN = function (nid) { return !!num(store.retired[nid]) && !live(nid); };
    // Nothing is folded into a roster whose class was deleted (its list would vanish with it), nor into a class
    // that already stands for another list.
    var skipD = function (did, nid) {
      if (!alive(store, did)) return true;
      var c = live(did);
      return !!(c && typeof c.fold === 'string' && c.fold && c.fold !== nid);
    };
    // First the two old sources as they were typed, which every device holding both reads the same way — a
    // student renamed in the editor since does not undo it. A stored list class is left to the second pass.
    var folds = findFolds(dash, nts, function (nid) { return skipN(nid) || !!live(nid); }, skipD);
    var doneD = dict(), doneN = dict();
    folds.forEach(function (f) { doneD[f.d.cls.id] = true; doneN[f.n.cls.id] = true; });
    // Then each side as the store knows it now: a roster class with the students it removed, a list that is a
    // stored class, and a class whose old source this device does not hold (it came from the account).
    var D = [], N = [], seenD = dict(), seenN = dict();
    dash.forEach(function (x) { seenD[x.cls.id] = true; if (doneD[x.cls.id]) return; var c = live(x.cls.id); D.push(c ? storedSide(x.cls.id, c) : x); });
    nts.forEach(function (x) { seenN[x.cls.id] = true; if (doneN[x.cls.id]) return; var c = live(x.cls.id); N.push(c ? storedSide(x.cls.id, c) : x); });
    Object.keys(store.classes).sort().forEach(function (id) {
      var c = live(id);
      if (!c || bad(id)) return;
      if (id.indexOf('nt_') === 0) { if (!seenN[id]) N.push(storedSide(id, c)); }
      else if (!seenD[id] && !num(c.created)) D.push(storedSide(id, c));   // (a class made in the editor has `created`: never a roster's)
    });
    findFolds(D, N, skipN, skipD).forEach(function (f) {
      if (!f.d.stored && !f.n.stored) return;        // two plain sources: the first pass already answered
      folds.push(f);
    });
    var foldOfD = dict(), foldOfN = dict();
    folds.forEach(function (f) { foldOfD[f.d.cls.id] = f; foldOfN[f.n.cls.id] = f; });
    return { dash: dash, nts: nts, folds: folds, foldOfD: foldOfD, foldOfN: foldOfN };
  }
  // The fold is written: the roster-id class takes what the list adds and names it (`fold`), the list's id is
  // retired with the fixed stamp, and a list that was a stored class of its own leaves the store.
  function commitFold(store, f) {
    var did = f.d.cls.id, nid = f.n.cls.id;
    if (!hasOwn(store.classes, did) || !isObj(store.classes[did]) || bad(nid)) return false;
    applyFold(store.classes[did], f);
    if (!(num(store.retired[nid]) >= FOLD_STAMP)) store.retired[nid] = FOLD_STAMP;
    if (hasOwn(store.classes, nid)) delete store.classes[nid];
    return true;
  }
  // The classes as every tool sees them: the stored ones, plus a live view of each old source not yet copied.
  function buildView() {
    var store = readStore(), sv = survey(store), out = dict(), id;
    for (id in store.classes) {
      if (!hasOwn(store.classes, id) || bad(id) || !isObj(store.classes[id]) || !alive(store, id) || sv.foldOfN[id]) continue;
      var c = clone(store.classes[id]);
      c.id = id;
      if (sv.foldOfD[id]) applyFold(c, sv.foldOfD[id]);
      out[id] = { cls: c, stored: true };
    }
    sv.dash.concat(sv.nts).forEach(function (x) {
      var sid = x.cls.id;
      if ((sid in out) || hasOwn(store.classes, sid) || num(store.retired[sid]) || sv.foldOfN[sid]) return;
      var c2 = clone(x.cls);
      if (sv.foldOfD[sid]) applyFold(c2, sv.foldOfD[sid]);
      out[sid] = { cls: c2, stored: false, from: x.src.from };
    });
    return { store: store, sv: sv, map: out };
  }
  function shape(entry) {
    var c = entry.cls, gone = [];
    if (isObj(c.gone)) Object.keys(c.gone).forEach(function (sid) {
      var g = c.gone[sid];
      if (isObj(g)) gone.push({ id: sid, he: str(g.he), en: str(g.en), t: num(g.t) });
    });
    gone.sort(function (x, y) { return y.t - x.t; });
    return {
      id: c.id, name: str(c.name), extra: str(c.extra), order: typeof c.order === 'number' ? c.order : null,
      students: studentsOf(c).map(function (s) { return { id: s.id, he: str(s.he), en: str(s.en), tr: str(s.tr), ex: str(s.ex), username: str(s.username) }; }),
      gone: gone, accountClassId: str(c.accountClassId), stored: !!entry.stored
    };
  }
  function sortClasses(list) {
    return list.sort(function (a, b) {
      var oa = a.order === null ? Infinity : a.order, ob = b.order === null ? Infinity : b.order;
      if (oa !== ob) return oa < ob ? -1 : 1;
      var na = a.name.toLowerCase(), nb = b.name.toLowerCase();
      return na < nb ? -1 : na > nb ? 1 : (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    });
  }
  function list() {
    var v = buildView();
    return sortClasses(Object.keys(v.map).map(function (id) { return shape(v.map[id]); }));
  }
  function get(id) {
    var v = buildView();
    return (id in v.map) ? shape(v.map[id]) : null;
  }
  // Same name, different students: never merged silently. [{ a, b, name }] — the roster class and the list class.
  function nearMatches() {
    var v = buildView(), out = [], told = readLedger().told;
    v.sv.dash.forEach(function (d) {
      v.sv.nts.forEach(function (n) {
        if (!(d.cls.id in v.map) || !(n.cls.id in v.map) || matchKey(d.cls.name) !== matchKey(n.cls.name)) return;
        var key = d.cls.id + '|' + n.cls.id;
        if (!told[key]) out.push({ a: d.cls.id, b: n.cls.id, name: v.map[d.cls.id].cls.name, key: key });
      });
    });
    return out;
  }
  // What the page that owns an old key must take out of it, so a name a teacher deleted really leaves the device and
  // the account: the old source of a class that was deleted (never one only folded into its roster), and the line or
  // row of a student in a class's removed-students record. `from`: 'dash' → { sources: [rosterId], lines: { rosterId:
  // [line] } }; 'nt' → { sources: [listName], rows: { listName: [index] } }. It only ever names things to remove; the
  // page removes them through its own save path. Read-only here.
  function scrub(from) {
    var store = readStore(), ls = legacySources(), out = { sources: [], lines: {}, rows: {} };
    var goneOf = function (classId) { var c = hasOwn(store.classes, classId) ? store.classes[classId] : null; return (isObj(c) && isObj(c.gone)) ? c.gone : null; };
    var deleted = function (id) { return (hasOwn(store.retired, id) ? num(store.retired[id]) : 0) > FOLD_STAMP && !alive(store, id); };
    if (from === 'dash') {
      ls.dash.forEach(function (x) {
        var id = x.cls.id;
        if (deleted(id)) { out.sources.push(id); return; }
        var gone = goneOf(id);
        if (!gone) return;
        var hit = x.src.lines.filter(function (line, i) { return hasOwn(gone, x.cls.students[i].id); });
        if (hit.length) out.lines[id] = hit;
      });
      return out;
    }
    // a list folded into a roster class: that class names it (`fold`), and its rows are matched to students by name
    var foldTarget = dict();
    Object.keys(store.classes).forEach(function (cid) { var c = store.classes[cid]; if (isObj(c) && typeof c.fold === 'string' && !bad(cid)) foldTarget[c.fold] = cid; });
    ls.nts.forEach(function (x) {
      var id = x.cls.id, name = x.src.name;
      if (deleted(id)) { out.sources.push(name); return; }
      var own = hasOwn(store.classes, id), classId = own ? id : foldTarget[id], gone = classId ? goneOf(classId) : null;
      if (!gone) return;
      // the list's rows that are students (classFromSource skips a row with no name), with their places in the list
      var named = [], at = [];
      x.src.rows.forEach(function (r, i) { if (field(r, 'he').trim() || field(r, 'en').trim() || field(r, 'tr').trim()) { named.push(r); at.push(x.src.rowAt ? x.src.rowAt[i] : i); } });
      var idx = [];
      if (own) named.forEach(function (r, k) { if (hasOwn(gone, x.cls.students[k].id)) idx.push(at[k]); });
      else {
        // rows a student still in the class answers to stay; of the rest, the ones a removed student answers to go
        var claimed = pairRows(studentsOf(store.classes[classId]), named), restRows = [], restAt = [];
        named.forEach(function (r, k) { if (!claimed.has(k)) { restRows.push(r); restAt.push(at[k]); } });
        var goneList = Object.keys(gone).filter(function (k) { return isObj(gone[k]); }).map(function (k) { return gone[k]; });
        pairRows(goneList, restRows).forEach(function (gi, ri) { idx.push(restAt[ri]); });
        idx.sort(function (p, q) { return p - q; });
      }
      if (idx.length) out.rows[name] = idx;
    });
    return out;
  }
  // The page that owns an old key hands its remover here; it is called with scrub(from)'s answer whenever that names
  // something. Signed out, the device is its own: at once and after every change. With a stored session only once a
  // hydration in this page load has answered for the classes and for that old key's own tool (`tool`), so a stale
  // copy is never the one acted on.
  function watchScrub(from, tool, fn) {
    var run = function () {
      if (hasStoredSession() && !(freshTools.Classes && freshTools[tool])) return;
      var plan;
      try { plan = scrub(from); } catch (e) { return; }
      if (plan.sources.length || Object.keys(plan.lines).length || Object.keys(plan.rows).length) { try { fn(plan); } catch (e2) {} }
    };
    onChange(run);
    if (root.addEventListener) root.addEventListener('ivritsuite:hydrated', run);   // after this file's own listener (added first) noted the tools
    run();
  }
  // The id an old Name Tags list has as a class (a page that remembered a list by name finds its class with it).
  function idForList(name) { return 'nt_' + shortHash(str(name).normalize('NFC')); }
  // The id the student of one old Dashboard roster line has (a pick session that still names students by their line).
  function idForLine(classId, line) { return 's' + shortHash(str(classId) + '\u0001' + str(line).trim() + '\u00010'); }
  function readLedger() {
    var l = parseKey(LEDGER_KEY) || {};
    if (!isObj(l.told)) l.told = {};
    l.v = 1;
    return l;
  }
  function dismissNearMatch(key) {
    var l = readLedger();
    if (bad(key) || l.told[key]) return;
    l.told[key] = 1;
    try { root.localStorage.setItem(LEDGER_KEY, JSON.stringify(l)); } catch (e) {}
    emit();
  }

  // Students coming in (an old source's lines, a file's class) meet the class: one already there by id is only
  // filled; one deleted here stays deleted unless `revive` (a deliberate restore); the rest are matched by name,
  // and only a student matching nobody is added. Nothing typed is replaced, nothing is removed.
  function absorb(cls, incoming, opts) {
    var changed = false, have = studentsOf(cls), byId = dict(), rest = [];
    if (!Array.isArray(cls.students)) { cls.students = have; }
    have.forEach(function (s) { byId[s.id] = s; });
    var gone = isObj(cls.gone) ? cls.gone : null;
    incoming.forEach(function (s) {
      if (!isObj(s) || typeof s.id !== 'string' || !s.id || bad(s.id)) return;
      if (byId[s.id]) { if (fillStudent(byId[s.id], s)) changed = true; return; }
      if (gone && hasOwn(gone, s.id) && isObj(gone[s.id])) {
        if (!opts.revive) return;
        var back = clone(s), st = nextStamp(cls), tt = {};
        FIELDS.forEach(function (f) { if (field(back, f)) tt[f] = st; });
        if (!Object.keys(tt).length) tt.he = st;
        back.t = tt;
        delete gone[s.id];
        if (!Object.keys(gone).length) delete cls.gone;
        cls.students.push(back); byId[back.id] = back; cls.updated = st; changed = true;
        return;
      }
      rest.push(s);
    });
    if (rest.length) {
      var res = mergeRows(cls.students, rest);
      if (res.filled) changed = true;
      res.fresh.forEach(function (s) { cls.students.push(clone(s)); changed = true; });
    }
    return changed;
  }
  // Brings one old source's class into the store (folded with its list when they are one class).
  function materialise(store, sv, id) {
    var x = null;
    sv.dash.concat(sv.nts).forEach(function (y) { if (y.cls.id === id) x = y; });
    if (sv.foldOfN[id]) return false;
    if (!isObj(store.classes[id])) { if (!x) return false; store.classes[id] = clone(x.cls); }
    if (sv.foldOfD[id]) commitFold(store, sv.foldOfD[id]);
    return true;
  }
  // After the account has been heard from: every old source this page's hydration covered is copied (once, with
  // computed ids), an old source already a class takes only what it lacks, and exact roster/list pairs fold.
  // `which`: { dash: bool, nt: bool } — the old keys whose own tool was hydrated in this page load.
  function adopt(which) {
    which = which || { dash: true, nt: true };
    var store = readStore(), sv = survey(store);
    var okFrom = function (from) { return from === 'dash' ? !!which.dash : !!which.nt; };
    // A deleted class that is in the store again goes out again. The sync module lands a row back when the tab that
    // deleted it had an older view of it (another tab changed the class a moment before): the class is hidden by
    // `retired`, but its students' names would stay here and in the account for good. Asked for only once the
    // account has answered in this page load (or signed out), so this removal is one the module sends on.
    if (which.prune) Object.keys(store.classes).forEach(function (id) { if (!alive(store, id)) delete store.classes[id]; });
    sv.dash.concat(sv.nts).forEach(function (x) {
      var id = x.cls.id;
      if (!okFrom(x.src.from)) return;
      if (hasOwn(store.classes, id) && isObj(store.classes[id])) { if (alive(store, id)) absorb(store.classes[id], x.cls.students, { revive: false }); return; }
      if (which.onlyExisting) return;
      if (num(store.retired[id]) || sv.foldOfN[id]) return;
      store.classes[id] = clone(x.cls);
    });
    sv.folds.forEach(function (f) {
      // A list still only an old source is folded once this load has heard its own tool; one that is a stored
      // class, once the account has answered for the classes (`prune`). The roster side must be a class here —
      // until then the fold stays a view.
      if (!(okFrom('nt') || (f.n.stored && which.prune))) return;
      commitFold(store, f);
    });
    return writeStore(store);
  }

  /* ══════════════════════════════════════════════════════
     OPERATIONS — each re-reads the store, applies one stamped change, writes.
     ══════════════════════════════════════════════════════ */
  function clip(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, MAX_FIELD); }
  function countAlive(v) { return Object.keys(v.map).length; }
  // fn(cls, stamp, store) → false to change nothing. A class still only a view of old data is copied first.
  function mutate(id, fn, quiet) {
    var v = buildView(), store = v.store;
    if (!(id in v.map)) return false;
    if (!v.map[id].stored) { if (!materialise(store, v.sv, id)) return false; }
    else if (v.sv.foldOfD[id]) materialise(store, v.sv, id);
    var cls = store.classes[id];
    if (!Array.isArray(cls.students)) cls.students = studentsOf(cls);
    var st = nextStamp(cls, store.retired[id]);
    if (fn(cls, st, store) === false) return false;
    cls.id = id;
    // `updated` is what brings a class back over a deletion made elsewhere (alive): only a change to the class
    // itself sets it — moving another class up the list re-numbers every class and must not revive one.
    if (!quiet) cls.updated = st;
    return writeStore(store);
  }
  function stampField(obj, f, st) { if (!isObj(obj.t)) obj.t = {}; obj.t[f] = st; }
  function uniqueName(base, taken) {
    base = clip(base) || t('shared.classes.default_name', 'My class');
    if (taken.indexOf(base) < 0) return base;
    var m = /^(.*?)\s+(\d+)$/.exec(base), stem = m ? m[1] : base, n = m ? parseInt(m[2], 10) : 0;
    do { n++; } while (taken.indexOf(stem + ' ' + n) >= 0);
    return stem + ' ' + n;
  }
  function addClass(name, students) {
    var v = buildView(), store = v.store;
    if (countAlive(v) >= MAX_CLASSES) return null;
    var names = Object.keys(v.map).map(function (k) { return str(v.map[k].cls.name); });
    var id = randomId('c'), st = Date.now(), order = 0;
    Object.keys(v.map).forEach(function (k) { var o = v.map[k].cls.order; if (typeof o === 'number' && o >= order) order = o + 1; });
    store.classes[id] = { id: id, name: uniqueName(name, names), order: order, created: st, updated: st, students: [] };
    (students || []).slice(0, MAX_STUDENTS).forEach(function (r) { store.classes[id].students.push(newStudent(r)); });
    return writeStore(store) ? id : null;
  }
  function newStudent(r) {
    var s = { id: randomId('s'), he: clip(r && r.he), en: clip(r && r.en) }, tr = clip(r && r.tr), ex = clip(r && r.ex);
    if (tr) s.tr = tr;
    if (ex) s.ex = ex;
    return s;
  }
  function renameClass(id, name) {
    name = clip(name);
    if (!name) return false;
    return mutate(id, function (cls, st) { if (str(cls.name) === name) return false; cls.name = name; stampField(cls, 'name', st); });
  }
  function setClassExtra(id, extra) {
    extra = clip(extra);
    return mutate(id, function (cls, st) { if (str(cls.extra) === extra) return false; cls.extra = extra; stampField(cls, 'extra', st); });
  }
  function duplicateClass(id) {
    var src = get(id);
    if (!src) return null;
    var nid = addClass(src.name, src.students);
    if (nid && src.extra) setClassExtra(nid, src.extra);
    return nid;
  }
  // Up or down one place among the classes shown; every class gets its place written, so the order is the same everywhere.
  function moveClass(id, dir) {
    var ids = list().map(function (c) { return c.id; }), i = ids.indexOf(id), j = i + (dir < 0 ? -1 : 1);
    if (i < 0 || j < 0 || j >= ids.length) return false;
    ids.splice(j, 0, ids.splice(i, 1)[0]);
    var ok = true;
    ids.forEach(function (cid, n) {
      var c = get(cid);
      if (c && c.order !== n) ok = mutate(cid, function (cls, st) { cls.order = n; stampField(cls, 'order', st); }, true) && ok;
    });
    return ok;
  }
  // The class leaves the store and its id is recorded, so no device re-creates it from an old roster or list.
  function deleteClass(id) {
    var v = buildView(), store = v.store;
    // (a stored list class that a fold hides can still be deleted by id: Merge into does, once its students joined)
    if (!(id in v.map) && !(v.sv.foldOfN[id] && hasOwn(store.classes, id))) return false;
    var cur = (hasOwn(store.classes, id) && isObj(store.classes[id])) ? store.classes[id] : null;
    store.retired[id] = Math.max(Date.now(), (cur ? classStamp(cur) : 0) + 1, num(store.retired[id]) + 1);
    // the old list folded into this class is deleted with it (until now it was only marked as folded) — also when
    // the fold was never written and is still only a view here, or the list would step forward as a class of its own
    if (cur && typeof cur.fold === 'string' && cur.fold && !bad(cur.fold)) store.retired[cur.fold] = store.retired[id];
    var viewFold = v.sv.foldOfD[id];
    if (viewFold && !bad(viewFold.n.cls.id)) { store.retired[viewFold.n.cls.id] = store.retired[id]; if (hasOwn(store.classes, viewFold.n.cls.id)) delete store.classes[viewFold.n.cls.id]; }
    delete store.classes[id];
    return writeStore(store);
  }
  // rows: [{ he, en, tr?, ex? }]. Add matches by name (a match only fills what the student lacks). Returns the counts.
  function addStudents(id, rows) {
    var res = null;
    var ok = mutate(id, function (cls, st) {
      var incoming = (rows || []).map(function (r) { return { he: clip(r && r.he), en: clip(r && r.en), tr: clip(r && r.tr), ex: clip(r && r.ex) }; })
        .filter(function (r) { return r.he || r.en || r.tr; });
      var m = mergeRows(cls.students, incoming), room = Math.max(0, MAX_STUDENTS - cls.students.length), added = m.fresh.slice(0, room);
      added.forEach(function (r) { cls.students.push(newStudent(r)); });
      res = { added: added.length, filled: m.filled, same: m.same, refused: m.fresh.length - added.length };
      if (!added.length && !m.filled) return false;
    });
    return res ? (ok || !(res.added || res.filled) ? res : null) : null;
  }
  // The class becomes the given rows. A row naming a student already here (the import's own matcher) stays that
  // student — the id is what a Flash Cards profile, a pick session and a reading-assignments login hang on — and
  // takes the row's values; only students the new list no longer names move to the removed ones.
  function replaceStudents(id, rows) {
    return mutate(id, function (cls, st) {
      var incoming = (rows || []).slice(0, MAX_STUDENTS).map(function (r) { return { he: clip(r && r.he), en: clip(r && r.en), tr: clip(r && r.tr), ex: clip(r && r.ex) }; });
      var pairs = pairRows(cls.students, incoming), kept = dict(), next = [];
      incoming.forEach(function (r, k) {
        var old = pairs.has(k) ? cls.students[pairs.get(k)] : null;
        if (!isObj(old) || kept[old.id]) { next.push(newStudent(r)); return; }
        kept[old.id] = true;
        var s2 = clone(old);
        FIELDS.forEach(function (f) {
          if (str(s2[f]) === r[f]) return;
          if (r[f] || f === 'he' || f === 'en') s2[f] = r[f]; else delete s2[f];
          stampField(s2, f, st);
        });
        next.push(s2);
      });
      if (!isObj(cls.gone)) cls.gone = {};
      cls.students.forEach(function (s) { if (isObj(s) && !kept[s.id]) cls.gone[s.id] = goneRecord(s, st); });
      cls.students = next;
      stampField(cls, 'students', st);
      trimGone(cls);
    });
  }
  function setStudentField(id, sid, f, value) {
    if (FIELDS.indexOf(f) < 0) return false;
    value = clip(value);
    return mutate(id, function (cls, st) {
      var s = null;
      cls.students.forEach(function (x) { if (isObj(x) && x.id === sid) s = x; });
      if (!s || str(s[f]) === value) return false;
      if (value || f === 'he' || f === 'en') s[f] = value; else delete s[f];
      stampField(s, f, st);
    });
  }
  function goneRecord(s, st) {
    var g = { t: st, he: str(s.he), en: str(s.en) };
    if (str(s.tr)) g.tr = s.tr;
    if (str(s.ex)) g.ex = s.ex;
    if (str(s.username)) g.username = s.username;
    return g;
  }
  function trimGone(cls) {
    var ids = Object.keys(cls.gone || {});
    if (!ids.length) { delete cls.gone; return; }
    if (ids.length <= GONE_CAP) return;
    ids.sort(function (x, y) { return (num(cls.gone[y].t) - num(cls.gone[x].t)) || (x < y ? -1 : 1); });
    ids.slice(GONE_CAP).forEach(function (g) { delete cls.gone[g]; });
  }
  function removeStudent(id, sid) {
    return mutate(id, function (cls, st) {
      var i = -1;
      cls.students.forEach(function (x, k) { if (isObj(x) && x.id === sid) i = k; });
      if (i < 0) return false;
      if (!isObj(cls.gone)) cls.gone = {};
      cls.gone[sid] = goneRecord(cls.students[i], st);
      cls.students.splice(i, 1);
      trimGone(cls);
    });
  }
  // The student comes back with everything the record kept, stamped now (so no other device's older deletion wins).
  function restoreStudent(id, sid) {
    return mutate(id, function (cls, st) {
      var g = isObj(cls.gone) ? cls.gone[sid] : null;
      if (!isObj(g) || cls.students.length >= MAX_STUDENTS) return false;
      var s = { id: sid, he: str(g.he), en: str(g.en), t: { he: st, en: st } };
      if (str(g.tr)) { s.tr = g.tr; s.t.tr = st; }
      if (str(g.ex)) { s.ex = g.ex; s.t.ex = st; }
      if (str(g.username)) s.username = g.username;
      delete cls.gone[sid];
      if (!Object.keys(cls.gone).length) delete cls.gone;
      cls.students.push(s);
    });
  }
  function moveStudent(id, sid, toIndex) {
    return mutate(id, function (cls, st) {
      var i = -1;
      cls.students.forEach(function (x, k) { if (isObj(x) && x.id === sid) i = k; });
      toIndex = Math.max(0, Math.min(cls.students.length - 1, toIndex | 0));
      if (i < 0 || i === toIndex) return false;
      cls.students.splice(toIndex, 0, cls.students.splice(i, 1)[0]);
      stampField(cls, 'students', st);   // the student order's own stamp (`order` is the class's place among classes)
    });
  }
  // Two classes that turned out to be one: `fromId`'s students join `intoId` by name, then `fromId` is deleted.
  function mergeInto(fromId, intoId) {
    var src = get(fromId);
    if (!src || fromId === intoId || !get(intoId)) return false;
    var ok = mutate(intoId, function (cls, st) {
      var have = dict();
      cls.students.forEach(function (s) { if (isObj(s)) have[s.id] = true; });
      if (isObj(cls.gone)) Object.keys(cls.gone).forEach(function (g) { have[g] = true; });
      var m = mergeRows(cls.students, src.students.map(function (s) { return { id: s.id, he: s.he, en: s.en, tr: s.tr, ex: s.ex, username: s.username }; }));
      // a student who joins keeps the id and the login noted on it (what a Flash Cards profile is linked to)
      m.fresh.forEach(function (r) {
        var ns = newStudent(r);
        if (typeof r.id === 'string' && r.id && !bad(r.id) && !have[r.id]) { ns.id = r.id; have[r.id] = true; }
        if (r.username) ns.username = str(r.username).slice(0, 40);
        cls.students.push(ns);
      });
      if (!str(cls.extra).trim() && src.extra) { cls.extra = src.extra; stampField(cls, 'extra', st); }
    });
    return ok && deleteClass(fromId);
  }
  // The reading-assignments link (set only by reading_assignments.html): the account class's id, a student's username.
  function setLink(id, accountClassId) {
    accountClassId = str(accountClassId).slice(0, 64);
    return mutate(id, function (cls, st) {
      if (str(cls.accountClassId) === accountClassId) return false;
      if (accountClassId) cls.accountClassId = accountClassId; else delete cls.accountClassId;
      stampField(cls, 'accountClassId', st);
    });
  }
  function setStudentUsername(id, sid, username) {
    username = str(username).slice(0, 40);
    return mutate(id, function (cls, st) {
      var s = null;
      cls.students.forEach(function (x) { if (isObj(x) && x.id === sid) s = x; });
      if (!s || str(s.username) === username) return false;
      if (username) s.username = username; else delete s.username;
      stampField(s, 'username', st);
    });
  }

  /* ══════════════════════════════════════════════════════
     FILES — .ivrit and AllTools. A restore is a deliberate act, whatever the file: a student or a class in it
     that was deleted here comes back (stamped now), students are matched by id and then by name, and nothing
     typed is replaced — so a Merge and a `fill` (an account backup) land the same way here. Only `replace`
     (the AllTools Replace) starts from an empty store.
     ══════════════════════════════════════════════════════ */
  function exportAll() {
    var v = buildView(), out = { v: 1, classes: {} };
    Object.keys(v.map).sort().forEach(function (id) { out.classes[id] = v.map[id].cls; });
    if (Object.keys(v.store.retired).length) out.retired = clone(v.store.retired);
    return out;
  }
  function importOne(store, sv, inc, mode) {
    var id = inc.id;
    if (typeof id !== 'string' || !id || bad(id) || id.length > 120) return false;
    var retiredAt = num(hasOwn(store.retired, id) ? store.retired[id] : 0), cur = (hasOwn(store.classes, id) && isObj(store.classes[id])) ? store.classes[id] : null;
    if (cur && !alive(store, id)) cur = null;
    if (!cur) {
      var viewed = null;
      sv.dash.concat(sv.nts).forEach(function (y) { if (y.cls.id === id && !sv.foldOfN[id]) viewed = y; });
      if (viewed && !retiredAt) {
        // the same old source is on this device as a live view: copy it only if the file adds something
        var probe = clone(viewed.cls);
        if (sv.foldOfD[id]) applyFold(probe, sv.foldOfD[id]);
        var before = canon(probe);
        absorb(probe, studentsOf(inc), { revive: true });
        if (!str(probe.extra).trim() && str(inc.extra).trim()) probe.extra = clip(inc.extra);
        if (canon(probe) === before) return false;
        store.classes[id] = probe;
        if (sv.foldOfD[id]) commitFold(store, sv.foldOfD[id]);
        return true;
      }
      var c = clone(inc);
      c.id = id;
      c.name = clip(c.name) || t('shared.classes.default_name', 'My class');
      c.students = studentsOf(c);
      if (retiredAt) c.updated = Math.max(Date.now(), classStamp(c) + 1, retiredAt + 1);   // back on purpose: later than its deletion
      store.classes[id] = c;
      return true;
    }
    var changed = absorb(cur, studentsOf(inc), { revive: true });
    if (!str(cur.extra).trim() && !(isObj(cur.t) && cur.t.extra) && str(inc.extra).trim()) { cur.extra = clip(inc.extra); changed = true; }
    if (!str(cur.name).trim() && str(inc.name).trim()) { cur.name = clip(inc.name); changed = true; }
    return changed;
  }
  // data: an AllTools bundle or a tool's file — any of `classes` (exportAll's value), `dashboardRosters.rosters`,
  // `dashboardSettings.rosters` / `liveState.rosters`, `nameTagLists`. mode: 'merge' | 'fill' | 'replace'.
  function importFile(data, mode) {
    if (!isObj(data)) return false;
    mode = mode === 'replace' || mode === 'fill' ? mode : 'merge';
    var fileStore = isObj(data.classes) && isObj(data.classes.classes) ? data.classes : null;
    // the record of deleted classes: inside `classes` in a file this page wrote, a section of its own in an account
    // backup (the account keeps it as its own row)
    var fileRetired = (fileStore && isObj(fileStore.retired)) ? fileStore.retired
      : (isObj(data.classesRetired) && isObj(data.classesRetired.retired)) ? data.classesRetired.retired : null;
    var rosters = dict(), any = !!fileStore, lists = isObj(data.nameTagLists) ? data.nameTagLists : null;
    [isObj(data.dashboardSettings) ? data.dashboardSettings.rosters : null, isObj(data.liveState) ? data.liveState.rosters : null,
     isObj(data.dashboardRosters) ? data.dashboardRosters.rosters : null].forEach(function (m) {
      if (!isObj(m)) return;
      Object.keys(m).forEach(function (id) { if (!bad(id) && isObj(m[id])) { rosters[id] = m[id]; any = true; } });
    });
    if (lists) any = true;
    if (!any) return false;
    var store = mode === 'replace' ? { v: 1, classes: {}, retired: {} } : readStore();
    var sv = survey(store), changed = mode === 'replace';
    var inFile = dict();
    if (fileStore) {
      Object.keys(fileStore.classes).forEach(function (id) {
        var c = fileStore.classes[id];
        if (bad(id) || !isObj(c)) return;
        inFile[id] = true;
        var inc = clone(c);
        inc.id = id;
        if (importOne(store, sv, inc, mode)) changed = true;
        // The file's class also stands for the old list it was folded with: that list in the file's old sections is
        // not a second class. Where the class is stored here now, the fold is recorded as every fold is, so the
        // list is not taken for a class when it lands on this device later.
        var fid = (typeof c.fold === 'string' && c.fold && !bad(c.fold)) ? c.fold : '';
        if (!fid) return;
        inFile[fid] = true;
        var sc = hasOwn(store.classes, id) ? store.classes[id] : null;
        if (isObj(sc) && alive(store, id) && !hasOwn(store.classes, fid) && !num(store.retired[fid])) {
          store.retired[fid] = FOLD_STAMP;
          if (sc.fold !== fid) sc.fold = fid;
          changed = true;
        }
      });
    }
    if (fileRetired) Object.keys(fileRetired).forEach(function (id) { if (!bad(id) && num(fileRetired[id])) inFile[id] = true; });
    // a Replace makes this device the file: its record of deleted classes comes too (a Merge never deletes)
    if (mode === 'replace' && fileRetired) Object.keys(fileRetired).forEach(function (id) { if (!bad(id) && num(fileRetired[id]) && !(hasOwn(store.retired, id) && num(store.retired[id]) >= num(fileRetired[id]))) store.retired[id] = num(fileRetired[id]); });
    // The file's old sections: read with the same computed ids, and only for a source the file's own classes do
    // not already stand for (a file from this version carries both generations).
    var fd = dashSourcesFrom(rosters).map(function (s) { return { src: s, cls: classFromSource(s) }; });
    var fn = ntSourcesFrom(lists).map(function (s) { return { src: s, cls: classFromSource(s) }; });
    var ffolds = findFolds(fd, fn, function (nid) { return inFile[nid] || hasOwn(store.classes, nid) || !!num(store.retired[nid]); },
                           function (did) { return !!inFile[did]; });
    var foldedN = dict(), foldOfD = dict();
    ffolds.forEach(function (f) { foldedN[f.n.cls.id] = true; foldOfD[f.d.cls.id] = f; });
    fd.concat(fn).forEach(function (x) {
      var id = x.cls.id;
      if (inFile[id] || foldedN[id]) return;
      var inc = clone(x.cls);
      if (foldOfD[id]) applyFold(inc, foldOfD[id]);
      if (importOne(store, sv, inc, mode)) changed = true;
    });
    return changed ? writeStore(store) : false;
  }

  /* ══════════════════════════════════════════════════════
     WIRING — other tabs, the account layer's landings, and the copy step after a hydration.
     ══════════════════════════════════════════════════════ */
  function onChange(fn) { if (typeof fn === 'function') listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }
  // A page's IvritSaves onLocalChanged('class' | 'retired') calls this: the store moved under the page.
  function landed() { emit(); }
  var freshTools = {};   // the tools a successful hydration covered in this page load
  if (root.addEventListener) {
    root.addEventListener('storage', function (e) { if (!e || e.key === null || e.key === KEY || e.key === DASH_KEY || e.key === NT_KEY) emit(); });
    root.addEventListener('ivritsuite:hydrated', function (e) {
      var d = e && e.detail;
      if (!d || !d.ok || !Array.isArray(d.tools)) return;
      d.tools.forEach(function (tool) { freshTools[tool] = true; });
      if (!freshTools.Classes) return;
      try { adopt({ dash: !!freshTools.Dashboard, nt: !!freshTools.NameTags, prune: true }); } catch (err) {}
    });
  }

  // One student typed into the grid's last row: added as typed, never matched against the others by name.
  function addStudent(id, row) {
    var sid = null;
    var ok = mutate(id, function (cls) {
      if (cls.students.length >= MAX_STUDENTS) return false;
      var s = newStudent(row);
      if (!s.he && !s.en && !s.tr && !s.ex) return false;
      cls.students.push(s);
      sid = s.id;
    });
    return ok ? sid : null;
  }

  /* ══════════════════════════════════════════════════════
     THE EDITOR — one dialog, opened from each tool's roster spot. Built with createElement / textContent only.
     Its regions redraw separately: a commit from a grid cell never rebuilds the grid (the Tab that committed it
     is still on its way to the next cell), and a landing from another tab or device redraws around the focused
     control, keeping what is being typed.
     ══════════════════════════════════════════════════════ */
  var STR = {   // the English fallbacks; locales/ui-strings.csv holds these under shared.classes.* with their Hebrew
    title: 'Class lists',
    close: 'Close',
    classes_label: 'Classes',
    new_class: 'New class',
    default_name: 'My class',
    'count.one': '1 student',
    'count.other': '{n} students',
    empty: 'No class yet. Add one to type or import your students.',
    name_label: 'Class name',
    extra_label: 'Extra line for the whole class',
    extra_hint: 'A room, a teacher or a grade. Name Tags prints it under each name.',
    up: 'Move this class up',
    down: 'Move this class down',
    duplicate: 'Duplicate',
    merge: 'Merge into…',
    del: 'Delete class',
    merge_label: 'Merge this class into',
    merge_go: 'Merge',
    cancel: 'Cancel',
    merge_confirm: 'Move the students of “{from}” into “{into}” and delete “{from}”? Students already in “{into}” are matched by name.',
    del_confirm: 'Delete the class “{name}” and every student in it ({n})? Flash Cards profiles and reading-assignment logins are not deleted.',
    del_confirm_cloud: 'Delete the class “{name}” and every student in it ({n})? It is removed from your account and from every device signed in to it. Flash Cards profiles and reading-assignment logins are not deleted.',
    used_label: 'Used in',
    used_dashboard: 'Classroom Dashboard',
    used_nametags: 'Name Tags',
    'used_flashcards.one': 'Flash Cards (1 profile)',
    'used_flashcards.other': 'Flash Cards ({n} profiles)',
    used_linked: 'Reading assignments: linked',
    used_unlinked: 'Reading assignments: not linked',
    import_csv: 'Import a file…',
    paste: 'Paste names…',
    export_csv: 'Export CSV',
    paste_label: 'Paste names, one student per line (or rows copied from a spreadsheet)',
    paste_go: 'Read these names',
    'found.one': 'Found 1 student in {source}.',
    'found.other': 'Found {n} students in {source}.',
    pasted: 'what you pasted',
    how_add: 'Add to this class',
    how_new: 'Make a new class',
    how_replace: 'Replace this class',
    replace_confirm: 'Replace every student in “{name}” with the imported list ({n})? The students there now move to Removed students.',
    replace_confirm_cloud: 'Replace every student in “{name}” with the imported list ({n})? This changes the class in your account and on every device signed in to it. The students there now move to Removed students.',
    added: 'Added {added}. Already in the class: {same}. Filled in: {filled}.',
    all_there: 'Everyone in that list is already in this class.',
    refused: 'Not everyone fit: a class holds {max} students at most ({n} left out).',
    none_found: 'No student names were found there.',
    too_big: 'That file is too big for a class list (1 MB at most).',
    unreadable: 'That file could not be read.',
    nothing_export: 'This class has no students to export yet.',
    too_many: 'You have {max} classes, the most this list holds. Delete one to add another.',
    full: 'This class is full ({max} students).',
    table_caption: 'Students in {name}',
    col_num: '#',
    col_he: 'Hebrew name',
    col_en: 'English name',
    col_tr: 'Transliteration',
    col_ex: 'Extra line',
    col_order: 'Order',
    col_remove: 'Remove',
    cell_he: 'Hebrew name, student {n}',
    cell_en: 'English name, student {n}',
    cell_tr: 'Transliteration, student {n}',
    cell_ex: 'Extra line, student {n}',
    new_he: 'Hebrew name, new student',
    new_en: 'English name, new student',
    new_tr: 'Transliteration, new student',
    new_ex: 'Extra line, new student',
    grip: 'Move {name}. Use the up and down arrow keys.',
    remove: 'Remove {name}',
    removed: 'Removed {name}.',
    undo: 'Undo',
    gone_summary: 'Removed students ({n})',
    restore: 'Restore',
    restore_named: 'Restore {name}',
    unnamed: 'a student without a name',
    near: 'Two classes are named “{name}”. They were not joined automatically; merge them if they are the same class.',
    near_merge: 'Merge them',
    near_keep: 'Keep both'
  };
  function T(key, params) { return t('shared.classes.' + key, STR[key], params); }
  function Tn(key, n, params) { var p = { n: n }; if (params) for (var k in params) if (hasOwn(params, k)) p[k] = params[k]; return T(key + (n === 1 ? '.one' : '.other'), p); }

  var CSS = [
    /* the suite's palette (navy, gold, cream; the dark surfaces of the hub's dark mode) and the host page's own font, so
       the editor reads as part of whichever tool opened it; every text colour is 5.6:1 or more on its ground */
    '.ivc-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,18,40,.55);color-scheme:light;--ivc-bg:#fff;--ivc-ink:#1a2744;--ivc-field:#fff;--ivc-btn:#fff;--ivc-accent:#1a2744;--ivc-on-accent:#f0d080;--ivc-line:#c8bfa8;--ivc-soft:#f8f3e8;--ivc-warn:#8a4b00;--ivc-muted:#5c5446;}',
    'body.dark .ivc-overlay{color-scheme:dark;--ivc-bg:#1e2535;--ivc-ink:#dde4f0;--ivc-field:#161c2a;--ivc-btn:#283149;--ivc-accent:#e0a832;--ivc-on-accent:#14203c;--ivc-line:#46506a;--ivc-soft:#161c2a;--ivc-warn:#f0b866;--ivc-muted:#b9c1d3;}',
    '.ivc-dialog{box-sizing:border-box;display:flex;flex-direction:column;inline-size:min(1040px,100%);max-block-size:100%;background:var(--ivc-bg);color:var(--ivc-ink);border:1px solid var(--ivc-line);border-radius:12px;box-shadow:0 18px 60px rgba(0,0,0,.35);font-size:15px;line-height:1.4;font-family:inherit;text-align:start;}',
    '.ivc-dialog *{box-sizing:border-box;}',
    '.ivc-head{display:flex;align-items:center;gap:12px;padding:12px 16px;border-block-end:1px solid var(--ivc-line);}',
    '.ivc-head h2{flex:1;margin:0;font-size:1.2rem;color:var(--ivc-ink);}',
    '.ivc-body{display:grid;grid-template-columns:minmax(170px,230px) minmax(0,1fr);min-block-size:0;flex:1;}',
    '.ivc-side{border-inline-end:1px solid var(--ivc-line);padding:12px;overflow:auto;display:flex;flex-direction:column;gap:8px;}',
    '.ivc-side h3,.ivc-main h3{margin:0;font-size:.8rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ivc-muted);}',
    '.ivc-classlist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;}',
    '.ivc-class{display:flex;flex-direction:column;align-items:flex-start;inline-size:100%;min-block-size:44px;padding:6px 10px;border:1px solid transparent;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:start;cursor:pointer;}',
    '.ivc-class:hover{background:var(--ivc-soft);}',
    '.ivc-class[aria-current="true"]{background:var(--ivc-soft);border-color:var(--ivc-accent);font-weight:600;}',
    '.ivc-class small{font-weight:400;color:var(--ivc-muted);}',
    '.ivc-main{padding:12px 16px 16px;overflow:auto;display:flex;flex-direction:column;gap:10px;min-inline-size:0;}',
    '.ivc-row{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;}',
    '.ivc-field{display:flex;flex-direction:column;gap:3px;min-inline-size:0;}',
    '.ivc-row>.ivc-field{flex:1 1 220px;}',
    '.ivc-main>*{flex:none;}',
    '.ivc-field>span,.ivc-lbl{font-size:.82rem;color:var(--ivc-muted);}',
    '.ivc-dialog input[type=text],.ivc-dialog select,.ivc-dialog textarea{font:inherit;color:var(--ivc-ink);background:var(--ivc-field);border:1px solid var(--ivc-line);border-radius:6px;padding:7px 9px;min-block-size:36px;inline-size:100%;}',
    '.ivc-dialog textarea{min-block-size:110px;resize:vertical;}',
    '.ivc-btn{font:inherit;font-weight:500;min-block-size:36px;padding:6px 12px;border:1px solid var(--ivc-line);border-radius:8px;background:var(--ivc-btn);color:var(--ivc-ink);cursor:pointer;}',
    '.ivc-btn:hover{border-color:var(--ivc-accent);}',
    '.ivc-btn.ivc-primary{background:var(--ivc-accent);color:var(--ivc-on-accent);border-color:var(--ivc-accent);font-weight:600;}',
    '.ivc-btn.ivc-danger{color:#b3261e;} body.dark .ivc-btn.ivc-danger{color:#ffb4ab;}',
    '.ivc-btn.ivc-icon{min-inline-size:36px;padding:6px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}',   /* ↕ ▲ ▼ ×: a text face draws them small */
    '.ivc-btn[aria-disabled="true"]{opacity:.5;cursor:default;}',
    '.ivc-dialog :focus-visible{outline:3px solid var(--ivc-accent);outline-offset:2px;}',
    '.ivc-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0;padding:0;list-style:none;}',
    '.ivc-chip{padding:2px 9px;border:1px solid var(--ivc-line);border-radius:999px;font-size:.82rem;background:var(--ivc-soft);}',
    '.ivc-chip a{color:inherit;}',
    '.ivc-panel{border:1px solid var(--ivc-line);border-radius:8px;padding:10px;background:var(--ivc-soft);display:flex;flex-direction:column;gap:8px;}',
    '.ivc-note{margin:0;min-block-size:1.4em;font-size:.9rem;}',
    '.ivc-note.ivc-warn{color:var(--ivc-warn);font-weight:600;}',
    '.ivc-note .ivc-btn{min-block-size:30px;padding:2px 10px;margin-inline-start:8px;}',
    '.ivc-tablewrap{overflow:auto;border:1px solid var(--ivc-line);border-radius:8px;}',
    '.ivc-table{border-collapse:collapse;inline-size:100%;min-inline-size:620px;}',
    '.ivc-table caption{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}',
    '.ivc-table th{font-size:.8rem;font-weight:600;color:var(--ivc-muted);padding:6px 8px;border-block-end:1px solid var(--ivc-line);background:var(--ivc-soft);position:sticky;inset-block-start:0;white-space:nowrap;}',
    '.ivc-table td{padding:3px 4px;border-block-end:1px solid var(--ivc-line);vertical-align:middle;}',
    '.ivc-table td.ivc-num{color:var(--ivc-muted);text-align:center;inline-size:2.4em;font-variant-numeric:tabular-nums;}',
    '.ivc-table td.ivc-act{inline-size:44px;text-align:center;}',
    /* a column's heading and its cells sit on the side their script reads from, in either UI direction */
    '.ivc-table th.ivc-he{text-align:right;} .ivc-table th.ivc-tr,.ivc-table th.ivc-en{text-align:left;} .ivc-table th.ivc-ex{text-align:start;}',
    '.ivc-table input.ivc-cell{border-color:transparent;background:transparent;min-block-size:34px;}',
    '.ivc-table input.ivc-cell:hover,.ivc-table input.ivc-cell:focus{border-color:var(--ivc-line);background:var(--ivc-field);}',
    '.ivc-table input[lang=he]{font-family:"Frank Ruhl Libre","IvritSuite Taamim",serif;font-size:1.1rem;}',
    '.ivc-grip{touch-action:none;cursor:grab;}',
    '.ivc-table tr.ivc-drop-before td{box-shadow:inset 0 3px 0 var(--ivc-accent);} .ivc-table tr.ivc-drop-after td{box-shadow:inset 0 -3px 0 var(--ivc-accent);}',
    '.ivc-table tr.ivc-dragging{opacity:.55;}',
    '.ivc-gone summary{cursor:pointer;min-block-size:32px;}',
    '.ivc-gone ul{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:4px;}',
    '.ivc-gone li{display:flex;align-items:center;gap:8px;}',
    '.ivc-gone li span{flex:1;min-inline-size:0;overflow-wrap:anywhere;}',
    '.ivc-empty{margin:24px 0;text-align:center;color:var(--ivc-muted);}',
    '.ivc-kbd{border-block-start:1px solid var(--ivc-line);padding:8px 16px;max-block-size:46vh;overflow:auto;}',
    '.ivc-sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}',
    '@media (max-width:800px){.ivc-overlay{padding:0;}.ivc-dialog{border-radius:0;block-size:100%;inline-size:100%;}.ivc-body{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr);}.ivc-side{border-inline-end:0;border-block-end:1px solid var(--ivc-line);max-block-size:32vh;}}',
    '@media (forced-colors:active){.ivc-dialog{background:Canvas;color:CanvasText;}.ivc-btn{background:ButtonFace;color:ButtonText;}.ivc-dialog,.ivc-btn,.ivc-chip,.ivc-panel,.ivc-tablewrap{border:1px solid CanvasText;}.ivc-class[aria-current="true"]{border:2px solid Highlight;}.ivc-table input.ivc-cell{border-color:CanvasText;}.ivc-overlay{background:Canvas;}}',
    '@media (prefers-reduced-motion:reduce){.ivc-overlay *{animation-duration:.001ms !important;transition-duration:.001ms !important;}}',
    '@media print{.ivc-overlay{display:none !important;}}'
  ].join('\n');

  var ed = null;   // the open editor: { root, classId, opener, host, pending, paste, merge, note, quiet, off, onKey }
  function el(tag, attrs, kids) {
    var n = root.document.createElement(tag), k;
    if (attrs) for (k in attrs) {
      if (!hasOwn(attrs, k) || attrs[k] === undefined || attrs[k] === null || attrs[k] === false) continue;
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'on') { for (var ev in attrs.on) if (hasOwn(attrs.on, ev)) n.addEventListener(ev, attrs.on[ev]); }
      else if (k === 'cls') n.className = attrs[k];
      else n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? root.document.createTextNode(c) : c); });
    return n;
  }
  function btn(key, label, cls, onClick, attrs) {
    var a = { type: 'button', cls: 'ivc-btn' + (cls ? ' ' + cls : ''), 'data-k': key, text: label, on: { click: onClick } };
    if (attrs) for (var k in attrs) if (hasOwn(attrs, k)) a[k] = attrs[k];
    return el('button', a);
  }
  // A student's name wherever a Hebrew and a Latin part share a line: each run is its own isolate, so the Latin
  // part's last mark never leads the line.
  function nameNode(s) {
    var span = el('span', { cls: 'ivc-name' }), he = str(s && s.he).trim(), en = str(s && s.en).trim();
    if (he) span.appendChild(el('bdi', { lang: 'he', dir: 'rtl', text: he }));
    if (he && en) span.appendChild(root.document.createTextNode(' / '));
    if (en) span.appendChild(el('bdi', { dir: 'ltr', text: en }));
    if (!he && !en) span.appendChild(el('bdi', { text: str(s && s.tr).trim() || T('unnamed') }));
    return span;
  }
  function plainName(s) { return [str(s && s.he).trim(), str(s && s.en).trim()].filter(Boolean).join(' / ') || str(s && s.tr).trim() || T('unnamed'); }
  function say(text, warn, undo) { if (!ed) return; ed.note = text ? { text: text, warn: !!warn, undo: undo || null } : null; drawNote(); }
  function part(name) { return ed.root.querySelector('[data-part="' + name + '"]'); }
  // The control whose key is `k`. Looked up by comparing, never by building a selector from it: a class id comes
  // from storage and from files.
  function byKey(scope, k) { var hit = null; Array.prototype.forEach.call(scope.querySelectorAll('[data-k]'), function (n) { if (!hit && n.getAttribute('data-k') === k) hit = n; }); return hit; }
  function fill(node, kids) { while (node.firstChild) node.removeChild(node.firstChild); kids.forEach(function (k) { if (k) node.appendChild(k); }); }

  // Where each class is in use on this device — read from storage, never a request.
  function usedIn(cls) {
    var out = [], dash = parseKey(DASH_KEY) || {}, presets = parseKey('hebrewDashboard_presets') || {}, used = dash.activeRosterId === cls.id;
    Object.keys(presets).forEach(function (k) { var p = presets[k]; if (isObj(p) && (p.activeClassId === cls.id || (str(p.activeRosterName) && str(p.activeRosterName) === cls.name))) used = true; });
    if (used) out.push({ text: T('used_dashboard') });
    if (lsGet('hebrewNameTags_activeClass') === cls.id) out.push({ text: T('used_nametags') });
    var fc = parseKey('hebrewFlashCards_profiles') || {}, ids = dict(), n = 0;
    cls.students.forEach(function (s) { ids[s.id] = true; });
    if (isObj(fc.profiles)) Object.keys(fc.profiles).forEach(function (k) { var p = fc.profiles[k]; if (isObj(p) && typeof p.studentId === 'string' && ids[p.studentId]) n++; });
    if (n) out.push({ text: Tn('used_flashcards', n) });
    out.push({ text: cls.accountClassId ? T('used_linked') : T('used_unlinked') });
    return out;
  }

  function selected() {
    var all = list();
    if (!all.length) { ed.classId = null; return null; }
    for (var i = 0; i < all.length; i++) if (all[i].id === ed.classId) return all[i];
    ed.classId = all[0].id;
    return all[0];
  }
  function drawSide() {
    var all = list(), cur = ed.classId;
    var items = all.map(function (c) {
      return el('li', null, [el('button', { type: 'button', cls: 'ivc-class', 'data-k': 'cls:' + c.id, 'aria-current': c.id === cur ? 'true' : undefined,
        on: { click: function () { ed.classId = c.id; ed.pending = null; ed.paste = false; ed.merge = false; ed.note = null; draw(); } } },
        [el('bdi', { text: c.name || T('default_name') }), el('small', { text: Tn('count', c.students.length) })])]);
    });
    fill(part('side'), [el('h3', { id: 'ivcClassesLbl', text: T('classes_label') }), el('ul', { cls: 'ivc-classlist', 'aria-labelledby': 'ivcClassesLbl' }, items),
      btn('new', T('new_class'), '', function () {
        var id = addClass(T('default_name'));
        if (!id) { say(T('too_many', { max: MAX_CLASSES }), true); return; }
        ed.classId = id; ed.note = null; draw();
        var inp = ed.root.querySelector('[data-k="name"]');
        if (inp) { inp.focus(); inp.select(); }
      })]);
  }
  function drawNote() {
    var n = part('note');
    if (!n) return;
    n.className = 'ivc-note' + (ed.note && ed.note.warn ? ' ivc-warn' : '');
    fill(n, ed.note ? [root.document.createTextNode(ed.note.text), ed.note.undo ? btn('undo', T('undo'), '', ed.note.undo) : null] : []);
  }
  function drawGone(cls) {
    var host = part('gone');
    if (!host) return;
    if (!cls || !cls.gone.length) { fill(host, []); return; }
    var wasOpen = !!(host.firstChild && host.firstChild.open);
    var d = el('details', { cls: 'ivc-gone' }, [el('summary', { 'data-k': 'gone', text: T('gone_summary', { n: cls.gone.length }) }),
      el('ul', null, cls.gone.map(function (g) {
        return el('li', null, [nameNode(g), btn('restore:' + g.id, T('restore'), '', function () {
          if (!restoreStudent(cls.id, g.id)) say(T('full', { max: MAX_STUDENTS }), true);
        }, { 'aria-label': T('restore_named', { name: plainName(g) }) })]);
      }))]);
    if (wasOpen) d.open = true;
    fill(host, [d]);
  }
  function cellInput(cls, s, f, n) {
    var isDraft = !s, attrs = { type: 'text', cls: 'ivc-cell', maxlength: String(MAX_FIELD), 'data-f': f, 'data-sid': isDraft ? '' : s.id, 'data-k': 'cell:' + (isDraft ? '' : s.id) + ':' + f,
      autocomplete: 'off', autocapitalize: f === 'he' ? 'off' : undefined, spellcheck: 'false',
      'aria-label': isDraft ? T('new_' + f) : T('cell_' + f, { n: n }) };
    if (f === 'he') { attrs.dir = 'rtl'; attrs.lang = 'he'; } else if (f === 'ex') attrs.dir = 'auto'; else attrs.dir = 'ltr';
    var inp = el('input', attrs);
    inp.value = isDraft ? '' : s[f];
    if (f === 'tr' && !isDraft && !s.tr && ed.host && typeof ed.host.autoTranslit === 'function' && s.he) {
      try { var auto = ed.host.autoTranslit(s.he); if (auto && typeof auto === 'string') inp.placeholder = auto; } catch (e) {}
    }
    return inp;
  }
  function rowEl(cls, s, n) {
    var isDraft = !s, tr = el('tr', { 'data-sid': isDraft ? '' : s.id });
    tr.appendChild(el('td', { cls: 'ivc-num', text: isDraft ? '+' : String(n) }));
    FIELDS.slice(0, 1).concat(['tr', 'en', 'ex']).forEach(function (f) { tr.appendChild(el('td', null, [cellInput(cls, s, f, n)])); });
    var grip = el('button', { type: 'button', cls: 'ivc-btn ivc-icon ivc-grip', 'data-k': 'grip:' + (isDraft ? '' : s.id), hidden: isDraft, text: '↕',
      'aria-label': isDraft ? undefined : T('grip', { name: plainName(s) }), title: isDraft ? undefined : T('grip', { name: plainName(s) }) });
    var rm = el('button', { type: 'button', cls: 'ivc-btn ivc-icon ivc-danger', 'data-k': 'rm:' + (isDraft ? '' : s.id), hidden: isDraft, text: '×',
      'aria-label': isDraft ? undefined : T('remove', { name: plainName(s) }), title: isDraft ? undefined : T('remove', { name: plainName(s) }) });
    tr.appendChild(el('td', { cls: 'ivc-act' }, [grip]));
    tr.appendChild(el('td', { cls: 'ivc-act' }, [rm]));
    return tr;
  }
  function drawTable(cls) {
    var body = part('rows');
    if (!body) return;
    var rows = cls.students.map(function (s, i) { return rowEl(cls, s, i + 1); });
    if (cls.students.length < MAX_STUDENTS) rows.push(rowEl(cls, null, cls.students.length + 1));
    fill(body, rows);
    var cap = part('caption');
    if (cap) cap.textContent = T('table_caption', { name: cls.name });
  }
  function download(name, text) {
    var blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });   // the BOM tells Excel the file is UTF-8 (Hebrew)
    var url = URL.createObjectURL(blob), a = el('a', { href: url, download: name });
    root.document.body.appendChild(a); a.click(); root.document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function offer(rows, source) {
    if (!rows.length) { say(T('none_found'), true); return; }
    ed.pending = { rows: rows, source: source }; ed.paste = false; ed.note = null;
    draw();
    var first = ed.root.querySelector('[data-k="how:add"]');
    if (first) first.focus();
  }
  function applyImport(how) {
    var p = ed.pending, cls = selected();
    if (!p || !cls) return;
    if (how === 'new') {
      var id = addClass(String(p.source || '').replace(/\.[A-Za-z0-9]{1,5}$/, '') || T('default_name'), p.rows);
      if (!id) { say(T('too_many', { max: MAX_CLASSES }), true); return; }
      ed.classId = id; ed.pending = null; draw(); say(Tn('found', p.rows.length, { source: p.source }));
      return;
    }
    if (how === 'replace') {
      if (!root.confirm(T(hasStoredSession() ? 'replace_confirm_cloud' : 'replace_confirm', { name: cls.name, n: p.rows.length }))) return;
      replaceStudents(cls.id, p.rows);
      ed.pending = null; draw(); say(Tn('found', p.rows.length, { source: p.source }));
      return;
    }
    var res = addStudents(cls.id, p.rows);
    ed.pending = null; draw();
    if (!res) return;
    if (res.refused) say(T('refused', { n: res.refused, max: MAX_STUDENTS }), true);
    else say(res.added || res.filled ? T('added', { added: res.added, same: res.same, filled: res.filled }) : T('all_there'));
  }
  function drawMain() {
    var cls = selected(), main = part('main');
    if (!cls) {
      fill(main, [el('p', { cls: 'ivc-empty', text: T('empty') }), el('p', { cls: 'ivc-note', 'data-part': 'note', role: 'status', 'aria-live': 'polite' })]);
      drawNote();
      return;
    }
    var all = list(), idx = all.map(function (c) { return c.id; }).indexOf(cls.id), kids = [];
    nearMatches().forEach(function (nm) {
      if (nm.a !== cls.id && nm.b !== cls.id) return;
      kids.push(el('div', { cls: 'ivc-panel', role: 'group', 'aria-label': T('near', { name: nm.name }) }, [el('p', { cls: 'ivc-note', text: T('near', { name: nm.name }) }),
        el('div', { cls: 'ivc-row' }, [btn('near:merge', T('near_merge'), 'ivc-primary', function () { if (mergeInto(nm.b, nm.a)) { ed.classId = nm.a; dismissNearMatch(nm.key); } }),
          btn('near:keep', T('near_keep'), '', function () { dismissNearMatch(nm.key); })])]));
    });
    var nameInp = el('input', { type: 'text', 'data-k': 'name', maxlength: String(MAX_FIELD), dir: 'auto', autocomplete: 'off',
      on: { change: function () { var v = nameInp.value; ed.quiet = true; var ok = renameClass(cls.id, v); ed.quiet = false; if (!ok) nameInp.value = get(cls.id) ? get(cls.id).name : v; drawSide(); var c2 = get(cls.id); var cap = part('caption'); if (cap && c2) cap.textContent = T('table_caption', { name: c2.name }); } } });
    nameInp.value = cls.name;
    kids.push(el('div', { cls: 'ivc-row' }, [el('label', { cls: 'ivc-field' }, [el('span', { text: T('name_label') }), nameInp]),
      btn('up', '▲', 'ivc-icon', function () { moveClass(cls.id, -1); }, { 'aria-label': T('up'), title: T('up'), 'aria-disabled': idx <= 0 ? 'true' : undefined }),
      btn('down', '▼', 'ivc-icon', function () { moveClass(cls.id, 1); }, { 'aria-label': T('down'), title: T('down'), 'aria-disabled': idx >= all.length - 1 ? 'true' : undefined }),
      btn('dup', T('duplicate'), '', function () { var id = duplicateClass(cls.id); if (!id) { say(T('too_many', { max: MAX_CLASSES }), true); return; } ed.classId = id; draw(); }),
      all.length > 1 ? btn('merge', T('merge'), '', function () { ed.merge = !ed.merge; draw(); var s = ed.root.querySelector('[data-k="merge:sel"]'); if (s) s.focus(); }, { 'aria-expanded': ed.merge ? 'true' : 'false' }) : null,
      btn('del', T('del'), 'ivc-danger', function () {
        if (!root.confirm(T(hasStoredSession() ? 'del_confirm_cloud' : 'del_confirm', { name: cls.name, n: cls.students.length }))) return;
        deleteClass(cls.id);
      })]));
    if (ed.merge && all.length > 1) {
      var sel = el('select', { 'data-k': 'merge:sel', 'aria-label': T('merge_label') }, all.filter(function (c) { return c.id !== cls.id; }).map(function (c) { return el('option', { value: c.id, text: c.name }); }));
      kids.push(el('div', { cls: 'ivc-panel' }, [el('label', { cls: 'ivc-field' }, [el('span', { text: T('merge_label') }), sel]),
        el('div', { cls: 'ivc-row' }, [btn('merge:go', T('merge_go'), 'ivc-primary', function () {
          var into = get(sel.value);
          if (!into || !root.confirm(T('merge_confirm', { from: cls.name, into: into.name }))) return;
          ed.merge = false;
          if (mergeInto(cls.id, into.id)) ed.classId = into.id;
          draw();
        }), btn('merge:cancel', T('cancel'), '', function () { ed.merge = false; draw(); var b = ed.root.querySelector('[data-k="merge"]'); if (b) b.focus(); })])]));
    }
    kids.push(el('div', { cls: 'ivc-row' }, [el('span', { cls: 'ivc-lbl', id: 'ivcUsedLbl', text: T('used_label') }),
      el('ul', { cls: 'ivc-chips', 'aria-labelledby': 'ivcUsedLbl' }, usedIn(cls).map(function (u) { return el('li', { cls: 'ivc-chip', text: u.text }); }))]));
    var exInp = el('input', { type: 'text', 'data-k': 'extra', maxlength: String(MAX_FIELD), dir: 'auto', autocomplete: 'off', 'aria-describedby': 'ivcExtraHint',
      on: { change: function () { ed.quiet = true; setClassExtra(cls.id, exInp.value); ed.quiet = false; } } });
    exInp.value = cls.extra;
    kids.push(el('label', { cls: 'ivc-field' }, [el('span', { text: T('extra_label') }), exInp, el('span', { id: 'ivcExtraHint', text: T('extra_hint') })]));
    var file = el('input', { type: 'file', accept: '.csv,.tsv,.txt,text/csv,text/plain', cls: 'ivc-sr', tabindex: '-1', 'aria-hidden': 'true',
      on: { change: function () {
        var f = file.files && file.files[0];
        file.value = '';
        if (!f) return;
        if (f.size > 1000000) { say(T('too_big'), true); return; }
        var r = new FileReader();
        r.onload = function () { offer(importRows(parseDelimited(decodeCsv(r.result))), f.name); };
        r.onerror = function () { say(T('unreadable'), true); };
        r.readAsArrayBuffer(f);
      } } });
    kids.push(el('div', { cls: 'ivc-row' }, [file,
      btn('import', T('import_csv'), '', function () { file.click(); }),
      btn('paste', T('paste'), '', function () { ed.paste = !ed.paste; ed.pending = null; draw(); var ta = ed.root.querySelector('[data-k="paste:text"]'); if (ta) ta.focus(); }, { 'aria-expanded': ed.paste ? 'true' : 'false' }),
      btn('export', T('export_csv'), '', function () {
        var c = get(cls.id);
        if (!c || !c.students.length) { say(T('nothing_export'), true); return; }
        download((c.name.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'class') + '.csv', csvText(c));
      })]));
    if (ed.paste) {
      var ta = el('textarea', { 'data-k': 'paste:text', dir: 'auto', 'aria-label': T('paste_label') });
      kids.push(el('div', { cls: 'ivc-panel' }, [el('span', { cls: 'ivc-lbl', text: T('paste_label') }), ta,
        el('div', { cls: 'ivc-row' }, [btn('paste:go', T('paste_go'), 'ivc-primary', function () { offer(importRows(parseDelimited(ta.value)), T('pasted')); }),
          btn('paste:cancel', T('cancel'), '', function () { ed.paste = false; draw(); var b = ed.root.querySelector('[data-k="paste"]'); if (b) b.focus(); })])]));
    }
    if (ed.pending) {
      kids.push(el('div', { cls: 'ivc-panel', role: 'group', 'aria-label': Tn('found', ed.pending.rows.length, { source: ed.pending.source }) }, [
        el('p', { cls: 'ivc-note', text: Tn('found', ed.pending.rows.length, { source: ed.pending.source }) }),
        el('div', { cls: 'ivc-row' }, [btn('how:add', T('how_add'), 'ivc-primary', function () { applyImport('add'); }),
          btn('how:new', T('how_new'), '', function () { applyImport('new'); }),
          btn('how:replace', T('how_replace'), 'ivc-danger', function () { applyImport('replace'); }),
          btn('how:cancel', T('cancel'), '', function () { ed.pending = null; draw(); var b = ed.root.querySelector('[data-k="import"]'); if (b) b.focus(); })])]));
    }
    kids.push(el('p', { cls: 'ivc-note', 'data-part': 'note', role: 'status', 'aria-live': 'polite' }));
    var head = el('tr', null, [el('th', { scope: 'col', text: T('col_num') }), el('th', { scope: 'col', cls: 'ivc-he', text: T('col_he') }), el('th', { scope: 'col', cls: 'ivc-tr', text: T('col_tr') }),
      el('th', { scope: 'col', cls: 'ivc-en', text: T('col_en') }), el('th', { scope: 'col', cls: 'ivc-ex', text: T('col_ex') }), el('th', { scope: 'col', text: T('col_order') }), el('th', { scope: 'col', text: T('col_remove') })]);
    kids.push(el('div', { cls: 'ivc-tablewrap' }, [el('table', { cls: 'ivc-table' }, [el('caption', { 'data-part': 'caption' }), el('thead', null, [head]), el('tbody', { 'data-part': 'rows' })])]));
    kids.push(el('div', { 'data-part': 'gone' }));
    fill(main, kids);
    drawTable(cls);
    drawGone(cls);
    drawNote();
  }
  // The whole dialog, redrawn around whatever holds the focus (its key, and what is typed in it but not yet saved).
  function draw() {
    if (!ed || ed.quiet) return;
    var a = root.document.activeElement, key = (a && ed.root.contains(a) && a.getAttribute) ? a.getAttribute('data-k') : null, typed = null;
    if (key && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.type !== 'file') typed = { v: a.value, s: a.selectionStart, e: a.selectionEnd };
    drawSide();
    drawMain();
    if (!key) return;
    var again = null;
    ed.root.querySelectorAll('[data-k]').forEach(function (n) { if (!again && n.getAttribute('data-k') === key) again = n; });
    if (!again) again = byKey(ed.root, 'cls:' + (ed.classId || '')) || ed.root.querySelector('[data-k="new"]');
    if (!again) return;
    again.focus();
    if (typed && again.getAttribute('data-k') === key && typeof again.value === 'string') { again.value = typed.v; try { again.setSelectionRange(typed.s, typed.e); } catch (e) {} }
  }
  // The grid's own events, heard on the table body: a cell commits on change without the grid being rebuilt.
  function onCellChange(e) {
    var inp = e.target, cls = selected();
    if (!cls || !inp || !inp.classList || !inp.classList.contains('ivc-cell')) return;
    var sid = inp.getAttribute('data-sid'), f = inp.getAttribute('data-f'), tr = inp.parentNode.parentNode;
    ed.quiet = true;
    try {
      if (sid) { setStudentField(cls.id, sid, f, inp.value); }
      else if (inp.value.trim()) {
        var row = {};
        row[f] = inp.value;
        var nid = addStudent(cls.id, row);
        if (!nid) { say(T('full', { max: MAX_STUDENTS }), true); }
        else {   // the typed row becomes a student's row in place, and a new blank row follows it
          var fresh = get(cls.id), s = null, n = 0;
          fresh.students.forEach(function (x, i) { if (x.id === nid) { s = x; n = i + 1; } });
          tr.setAttribute('data-sid', nid);
          tr.firstChild.textContent = String(n);
          tr.querySelectorAll('input.ivc-cell').forEach(function (c) { var cf = c.getAttribute('data-f'); c.setAttribute('data-sid', nid); c.setAttribute('data-k', 'cell:' + nid + ':' + cf); c.setAttribute('aria-label', T('cell_' + cf, { n: n })); });
          tr.querySelectorAll('button').forEach(function (b) {
            var grip = b.classList.contains('ivc-grip'), label = T(grip ? 'grip' : 'remove', { name: plainName(s) });
            b.hidden = false; b.setAttribute('data-k', (grip ? 'grip:' : 'rm:') + nid); b.setAttribute('aria-label', label); b.title = label;
          });
          if (fresh.students.length < MAX_STUDENTS) tr.parentNode.appendChild(rowEl(fresh, null, fresh.students.length + 1));
        }
      }
    } finally { ed.quiet = false; }
    var now = get(cls.id);
    if (now && sid) {   // a name changed: its two buttons say so
      var st = null;
      now.students.forEach(function (x) { if (x.id === sid) st = x; });
      if (st) tr.querySelectorAll('button').forEach(function (b) { var label = T(b.classList.contains('ivc-grip') ? 'grip' : 'remove', { name: plainName(st) }); b.setAttribute('aria-label', label); b.title = label; });
    }
    drawSide();
  }
  function onCellKey(e) {
    var inp = e.target;
    if (!inp || !inp.classList) return;
    if (inp.classList.contains('ivc-cell') && e.key === 'Enter') {   // Enter: the same column, one row down
      e.preventDefault();
      var tr = inp.parentNode.parentNode, next = tr.nextElementSibling, f = inp.getAttribute('data-f');
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      next = tr.nextElementSibling || next;
      var target = next && next.querySelector('input[data-f="' + f + '"]');
      if (target) target.focus();
      return;
    }
    if (inp.classList.contains('ivc-grip') && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      var cls = selected(), sid = inp.parentNode.parentNode.getAttribute('data-sid'), i = -1;
      if (!cls) return;
      cls.students.forEach(function (s, k) { if (s.id === sid) i = k; });
      if (i >= 0) moveStudent(cls.id, sid, i + (e.key === 'ArrowUp' ? -1 : 1));
    }
  }
  function onCellClick(e) {
    var b = e.target && e.target.closest ? e.target.closest('button') : null, cls = selected();
    if (!b || !cls || b.classList.contains('ivc-grip')) return;
    var sid = b.parentNode.parentNode.getAttribute('data-sid'), s = null;
    cls.students.forEach(function (x) { if (x.id === sid) s = x; });
    if (!s) return;
    if (removeStudent(cls.id, sid)) say(T('removed', { name: plainName(s) }), false, function () { restoreStudent(cls.id, sid); say(''); });
  }
  // A drag by the grip: pointer events (HTML5 drag-and-drop never fires on touch), the pointer captured on the
  // table body, which is never rebuilt mid-drag.
  var drag = null;
  function clearDrop() { if (!ed) return; ed.root.querySelectorAll('.ivc-drop-before,.ivc-drop-after,.ivc-dragging').forEach(function (r) { r.classList.remove('ivc-drop-before', 'ivc-drop-after', 'ivc-dragging'); }); }
  function onGripDown(e) {
    var g = e.target && e.target.closest ? e.target.closest('.ivc-grip') : null, cls = selected();
    if (!g || !cls || (e.button != null && e.button !== 0)) return;
    var tr = g.parentNode.parentNode, body = tr.parentNode;
    drag = { sid: tr.getAttribute('data-sid'), body: body, classId: cls.id, to: -1, moved: false, y: e.clientY };
    try { body.setPointerCapture(e.pointerId); } catch (err) {}
  }
  function onGripMove(e) {
    if (!drag) return;
    if (!drag.moved && Math.abs(e.clientY - drag.y) < 6) return;
    drag.moved = true;
    clearDrop();
    var rows = [].slice.call(drag.body.querySelectorAll('tr')).filter(function (r) { return r.getAttribute('data-sid'); }), from = -1, to = rows.length - 1, after = true;
    rows.forEach(function (r, i) { if (r.getAttribute('data-sid') === drag.sid) { from = i; r.classList.add('ivc-dragging'); } });
    for (var i = 0; i < rows.length; i++) { var b = rows[i].getBoundingClientRect(); if (e.clientY < b.top + b.height / 2) { to = i; after = false; break; } }
    if (rows[to]) rows[to].classList.add(after ? 'ivc-drop-after' : 'ivc-drop-before');
    drag.to = after ? to : (to > from ? to - 1 : to);
    e.preventDefault();
  }
  function onGripUp(e) {
    if (!drag) return;
    var d = drag;
    drag = null;
    try { d.body.releasePointerCapture(e.pointerId); } catch (err) {}
    clearDrop();
    if (d.moved && d.to >= 0 && e.type !== 'pointercancel') moveStudent(d.classId, d.sid, d.to);
  }
  function closeEditor() {
    if (!ed) return;
    var e = ed;
    ed = null;
    root.document.removeEventListener('keydown', e.onKey, true);
    e.off();
    if (e.root.parentNode) e.root.parentNode.removeChild(e.root);
    try { if (e.opener && e.opener.focus && root.document.contains(e.opener)) e.opener.focus(); } catch (err) {}
    if (typeof e.onClose === 'function') { try { e.onClose(); } catch (err2) {} }
  }
  // opts: { classId?, opener? (focus returns to it), host?: { autoTranslit(he) → string }, onClose? }
  function openEditor(opts) {
    opts = opts || {};
    if (!root.document) return false;
    if (ed) { if (opts.classId) { ed.classId = opts.classId; draw(); } return true; }
    if (!root.document.getElementById('ivcStyle')) root.document.head.appendChild(el('style', { id: 'ivcStyle', text: CSS }));
    var overlay = el('div', { cls: 'ivc-overlay' }), dialog = el('div', { cls: 'ivc-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ivcTitle' });
    dialog.appendChild(el('div', { cls: 'ivc-head' }, [el('h2', { id: 'ivcTitle', 'data-part': 'title', tabindex: '-1' }), el('button', { type: 'button', cls: 'ivc-btn ivc-icon', 'data-k': 'close', 'data-part': 'close', text: '×', on: { click: closeEditor } })]));
    dialog.appendChild(el('div', { cls: 'ivc-body' }, [el('nav', { cls: 'ivc-side', 'data-part': 'side' }), el('div', { cls: 'ivc-main', 'data-part': 'main' })]));
    // The on-screen Hebrew keyboard, on a page that carries the shared block: it types into the Hebrew cell last
    // focused, and each key is saved the way a typed one is.
    var kbd = null;
    if (opts.host && typeof opts.host.mountKeyboard === 'function') {
      var kbdBtn = el('button', { type: 'button', cls: 'hk-toggle', 'data-k': 'kbd', 'aria-expanded': 'false' }), kbdPanel = el('div', { cls: 'hk-panel', hidden: true });
      dialog.appendChild(el('div', { cls: 'ivc-kbd' }, [kbdBtn, kbdPanel]));
      var kbdTarget = null;
      dialog.addEventListener('focusin', function (e) { var x = e.target; if (x && x.classList && x.classList.contains('ivc-cell') && x.getAttribute('data-f') === 'he') kbdTarget = x; });
      var kbdInput = function () { return (kbdTarget && dialog.contains(kbdTarget)) ? kbdTarget : dialog.querySelector('input.ivc-cell[data-f="he"]'); };
      try { kbd = opts.host.mountKeyboard({ container: kbdPanel, toggleBtn: kbdBtn, getInput: kbdInput, onChange: function () { var x = kbdInput(); if (x) x.dispatchEvent(new Event('change', { bubbles: true })); } }); } catch (e) { kbd = null; }
    }
    overlay.appendChild(dialog);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeEditor(); });
    dialog.addEventListener('change', onCellChange);
    dialog.addEventListener('keydown', onCellKey);
    dialog.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('tbody')) onCellClick(e); });
    dialog.addEventListener('pointerdown', onGripDown);
    dialog.addEventListener('pointermove', onGripMove);
    dialog.addEventListener('pointerup', onGripUp);
    dialog.addEventListener('pointercancel', onGripUp);
    var chrome = function () { var ti = overlay.querySelector('[data-part="title"]'), cl = overlay.querySelector('[data-part="close"]'); ti.textContent = T('title'); cl.setAttribute('aria-label', T('close')); cl.title = T('close'); };
    ed = { root: overlay, classId: opts.classId || null, opener: opts.opener || root.document.activeElement, host: opts.host || null, onClose: opts.onClose,
           pending: null, paste: false, merge: false, note: null, quiet: false };
    var offStore = onChange(function () { if (ed) draw(); });
    var redraw = function () { if (ed) { chrome(); draw(); if (kbd && typeof kbd.applyI18n === 'function') { try { kbd.applyI18n(); } catch (e) {} } } }, i18n = root.I18n;
    if (i18n && typeof i18n.onChange === 'function') { try { i18n.onChange(redraw); } catch (e) {} }
    ed.off = offStore;
    // Heard on the document in the capture phase: a click on the dialog's own text leaves the focus on <body>,
    // which a listener on the overlay never hears; and capture keeps this Escape ahead of the page's own.
    ed.onKey = function (e) {
      if (!ed) return;
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        if (drag) { drag = null; clearDrop(); return; }
        if (ed.pending || ed.paste || ed.merge) { var back = ed.pending ? 'import' : ed.paste ? 'paste' : 'merge'; ed.pending = null; ed.paste = false; ed.merge = false; draw(); var b = ed.root.querySelector('[data-k="' + back + '"]'); if (b) b.focus(); return; }
        closeEditor();
        return;
      }
      if (e.key !== 'Tab') return;
      var f = [].slice.call(dialog.querySelectorAll('button, [href], input, textarea, select, summary, [tabindex]:not([tabindex="-1"])'))
        .filter(function (n) { return !n.disabled && !n.hidden && n.getAttribute('tabindex') !== '-1' && n.offsetParent !== null; });
      if (!f.length) return;
      var a = root.document.activeElement, first = f[0], last = f[f.length - 1], out = !dialog.contains(a);
      if (e.shiftKey && (a === first || out)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || out)) { e.preventDefault(); first.focus(); }
    };
    root.document.addEventListener('keydown', ed.onKey, true);
    root.document.body.appendChild(overlay);
    chrome();
    draw();
    var start = byKey(overlay, 'cls:' + (ed.classId || '')) || overlay.querySelector('[data-k="new"]');
    if (start) start.focus();
    return true;
  }

  // Signed out, a class already copied still takes what an old tab adds to its old source (add-only).
  function reconcileLocal() { if (!hasStoredSession()) { try { adopt({ dash: true, nt: true, onlyExisting: true, prune: true }); } catch (e) {} } }
  if (root.document && root.document.addEventListener) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', reconcileLocal); else reconcileLocal();
    root.addEventListener('storage', function (e) { if (e && (e.key === DASH_KEY || e.key === NT_KEY)) reconcileLocal(); });
  }

  var api = {
    KEY: KEY, LEDGER_KEY: LEDGER_KEY, MAX_CLASSES: MAX_CLASSES, MAX_STUDENTS: MAX_STUDENTS, MAX_FIELD: MAX_FIELD,
    list: list, get: get, onChange: onChange, landed: landed, idForList: idForList, idForLine: idForLine, scrub: scrub, watchScrub: watchScrub, nearMatches: nearMatches, dismissNearMatch: dismissNearMatch,
    mergeClass: mergeClass, adopt: adopt, exportAll: exportAll, importFile: importFile,
    addClass: addClass, renameClass: renameClass, setClassExtra: setClassExtra, duplicateClass: duplicateClass, moveClass: moveClass,
    deleteClass: deleteClass, mergeInto: mergeInto, addStudents: addStudents, replaceStudents: replaceStudents,
    setStudentField: setStudentField, removeStudent: removeStudent, restoreStudent: restoreStudent, moveStudent: moveStudent,
    setLink: setLink, setStudentUsername: setStudentUsername,
    addStudent: addStudent, openEditor: openEditor, closeEditor: closeEditor, isEditorOpen: function () { return !!ed; }, nameNode: nameNode,
    csv: { parseDelimited: parseDelimited, importRows: importRows, splitName: splitName, splitRosterLine: splitRosterLine, matchKey: matchKey,
           mergeRows: mergeRows, pairRows: pairRows, decode: decodeCsv, cell: csvCell, text: csvText, HEAD: CSV_HEAD },
    t: t, hasStoredSession: hasStoredSession,
    _test: { canon: canon, shortHash: shortHash, classFromSource: classFromSource, dashSourcesFrom: dashSourcesFrom, ntSourcesFrom: ntSourcesFrom,
             readStore: readStore, absorb: absorb, alive: alive, FOLD_STAMP: FOLD_STAMP }
  };
  root.IvritClasses = api;
})(typeof window !== 'undefined' ? window : globalThis);
