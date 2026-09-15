/*
 * ivrit-saves.js — optional cloud copies of a tool's saved items (IvritSuite accounts, phase 3).
 *
 * Load on a page AFTER /js/ivrit-account.js (all four deferred, in this order):
 *   <script src="/js/i18n.js" defer></script>
 *   <script src="/js/supabase-config.js" defer></script>
 *   <script src="/js/ivrit-account.js" defer></script>
 *   <script src="/js/ivrit-saves.js" defer></script>
 *
 * What it is — a LOCAL-FIRST MIRROR:
 *   - The localStorage keys a tool already renders from stay the source of truth. Local save, .ivrit
 *     files and JSON import are untouched; the cloud (the `saves` table) is a third place that holds
 *     one row per saved item, which the person uploads and downloads from a small panel.
 *   - Anonymous use never writes anything: no localStorage key, no network request.
 *   - Nothing on the device is ever deleted by this module, and nothing newer is ever overwritten by
 *     something older unless the person chooses that in a "changed in both places" row.
 *   - Every entry point resolves or rejects; nothing throws into the page. The DOM is built with
 *     createElement/textContent only, and JSON from the cloud passes through a prototype-safe parser.
 *
 * IVRIT_SYNC_REGISTRY (below) is the only place that names synced keys: one entry per localStorage
 * key, with `shape` (how items are found inside it) and `merge` (how a downloaded copy lands on a
 * differing local one). A tool page adds its entries there and wires the panel with
 * IvritSaves.attach({...}) — nothing else.
 *
 * Three facts that shaped the code:
 *   1. Postgres rewrites JSON (key order, spacing), so every hash is taken over a canonical form of the
 *      value — keys sorted at every depth — with SHA-256. The row's `data_hash` is only a shortcut.
 *   2. Tools keep settings in memory and rewrite the whole blob on the next change, so a downloaded
 *      settings blob is only safe when the page re-reads it: entries of shape single / scalar / tree /
 *      mapIn are downloadable only when attach() was given onLocalChanged; flush() runs before writes.
 *   3. Folder trees name items, and the shared tree component prunes names it cannot find, so a tree
 *      entry `follows` its items' kind and is synced after them, never on its own row in the list.
 *
 * Exposes window.IvritSaves:
 *   attach(cfg)               { tool, panel?, title?, entries?, merges?, flush?, onLocalChanged?, open?, deviceBackup? }
 *                             title: false → no title of its own (the page's panel heading is the heading);
 *                             an i18n key → that title (the hub names each panel after its tool);
 *                             deviceBackup: how this page saves everything on the device to an .ivrit file
 *                             (the hub passes its Import / Export modal; other pages send people there)
 *   openAccount()             the account screen: when the account was last saved, what every tool holds on
 *                             this device and in the account, "Sync everything" (every safe action across
 *                             tools) or — while the account is empty — "Upload everything on this device"
 *                             (a copy; nothing leaves the device), and the backup buttons. Opens by itself
 *                             after every fresh sign-in ("Sync settings from your last login?") and once per
 *                             account on a device that already has saved items; the chip's "Account…"
 *                             item reopens it.
 *   mountPanel(target, tool)  element | selector — renders the panel there
 *   refresh(tool)             Promise<plan> — re-lists both sides and re-renders
 *   plan(tool)                Promise<plan> — the per-item state table (no rendering)
 *   syncNow(tool)             Promise<summary> — every safe action in the list, in order
 *   act(tool, action, row)    Promise<result> — one row action ('upload' | 'download' | 'merge' | 'useCloud' |
 *                             'keepBoth' | 'keepMine' | 'delete' | 'file') on a row from plan(); the status line reports it
 *   inventory()               Promise<[{tool, name, kinds:[{kind, label, count, bytes, names}], count, bytes}]> — what the
 *                             account holds, tool by tool, without the data (the account page's listing)
 *   bundleAll()               Promise<{file, count}> — every cloud row as one AllTools-shaped .ivrit object (the
 *                             account screen downloads it; the account page zips it with the Font Maker projects)
 *   forgetUser(uid)           drops this device's sync memory of an account that was deleted
 *   local / cloud             the two backends (used by saves-test.html)
 *   registry()                a copy of the effective registry
 *   t(key, fallback, params)  translate via IvritAccount.t (I18n when loaded, else the English fallback)
 *   _test                     pure helpers for saves-test.html and scripts/smoke-saves.mjs
 */
(function () {
  'use strict';

  /* ---------- constants ---------- */
  var TOOLS = ['Suite', 'Worksheet', 'FlashCards', 'Dictionary', 'TorahTrainer', 'TropeTutor', 'Dashboard'];
  var KIND_RE = /^[A-Za-z]{1,32}$/;
  var SHAPES = ['map', 'mapIn', 'single', 'tree', 'scalar'];
  var MERGES = ['item', 'assign', 'deepMax', 'max', 'page'];
  var META_KEY = 'ivritSuite_syncMeta';   // what this device last synced, per account (erase-only, never exported)
  var HASH_PREFIX = '1.';                 // SHA-256 over the canonical JSON, base64url, 45 chars
  var FALLBACK_PREFIX = '0.';             // FNV-1a pair, only where crypto.subtle is missing (a plain http:// host)
  var MAX_BYTES = 1887436;                // 1.8 MB of canonical JSON; the server allows 2 MB of its own, slightly wider, text
  var MAX_NAME = 120;
  var DEFAULT_NAME = 'default';           // the row name of a single / tree / scalar entry
  var PAGE_SIZE = 1000;                   // PostgREST's maximum rows per request
  var NEEDS_HOOK = { single: true, scalar: true, tree: true, mapIn: true };   // shapes a page must re-read after a download
  var ROW_COLS = 'id, kind, name, data_hash, bytes, updated_at';

  /* ---------- the registry ---------- */
  // One entry per synced localStorage key:
  //   tool       the tool id used in the saves table (one of TOOLS)
  //   kind       letters only, ≤ 32 — one row per kind+name in the cloud
  //   lsKey      the localStorage key
  //   shape      'map'    {name: value}                    → one row per name
  //              'mapIn'  {…, [path]: {key: value}}         → one row per key under `path` (label = value[nameField])
  //              'single' one settings object               → one row named 'default'
  //              'tree'   {v:1, root:[…]} folder tree       → one row named 'default', synced after `follows`
  //              'scalar' a plain string                    → one row named 'default', travelling as {value}
  //   merge      how a downloaded copy lands on a differing local one: 'item' (replace that item),
  //              'assign' (cloud fields over a copy of local — the .ivrit Merge teachers know),
  //              'deepMax' (lossless: numbers max, booleans or, objects recurse), 'max' (scalar),
  //              'page' (the page's pure merges[kind](local, cloud) → merged)
  //   omit       field names never to travel ('*Collapsed' globs allowed): stripped before upload,
  //              this device's values put back after a download
  //   follows    trees only: the kind whose items the tree names
  //   envelope   mapIn only: the other top-level fields to keep when creating the store, e.g. {v:1}
  //   ivritKey   the AllTools bundle key, so "Download file" writes an .ivrit the hub already imports
  //   label      an i18n key for the kind (falls back to the raw kind)
  //   virtual    instead of lsKey: a store assembled from several keys ({ read, write, remove, applied }) —
  //              the suite-wide preferences row below is the one such store
  // The suite-wide preferences (`Suite` / `prefs`): the small site-wide keys every page reads — one row,
  // assembled from those keys. What travels: the UI language, the theme, the on-screen keyboard layout,
  // the backup input mode, the shared Hebrew font and size, live preview, the Font Maker author name, and
  // the Dictionary's romanization style, TTS rate and emoji settings. What stays per device: the three
  // `*_panels` maps (which panels are open), the Dictionary's audio switch and its last search. A field
  // this build cannot apply (an unknown language, an out-of-range value) is held in the sync memory and
  // reported as the row's value until the key is changed here, so a newer device's choice round-trips
  // instead of being pushed back down. After a write the module applies the language itself (I18n.setLang)
  // and fires `ivritsuite:prefs` on window; each page follows the theme from that event, the rest is
  // read at the next load (the done line says so).
  var SUITE_PREFS = {
    fields: {
      lang:              { key: 'hebrewBlender_lang',              ok: function (v) { var s = (window.I18n && window.I18n.supported) || ['en', 'he']; return typeof v === 'string' && s.indexOf(v) >= 0; } },
      darkMode:          { key: 'hebrewBlender_darkMode',          ok: function (v) { return v === '1' || v === '0'; } },
      kbdLayout:         { key: 'hebrewBlender_kbdLayout',         ok: function (v) { return v === 'abc' || v === 'qwerty'; } },
      inputMode:         { key: 'hebrewBlender_inputMode',         ok: function (v) { return v === 'auto' || v === 'manual'; } },
      hebFont:           { key: 'hebrewBlender_hebFont',           ok: function (v) { return typeof v === 'string' && v.length > 0 && v.length <= 80; } },
      hebFontSize:       { key: 'hebrewBlender_hebFontSize',       ok: function (v) { return numeric(v) && Number(v) >= 0 && Number(v) <= 100; } },
      livePreview:       { key: 'hebrewBlender_livePreview',       ok: function (v) { return v === '1' || v === '0'; } },
      fmLastAuthor:      { key: 'hebrewFontMaker_lastAuthor',      ok: function (v) { return typeof v === 'string' && v.length > 0 && v.length <= 80; } },
      dictTranslitStyle: { key: 'hebrewDictionary_translitStyle',  ok: function (v) { return ['default', 'sbl', 'brill', 'modernIsraeli', 'ashkenazi', 'simpleStressed'].indexOf(v) >= 0; } },
      dictTtsRate:       { key: 'hebrewDictionary_ttsRate',        ok: function (v) { return numeric(v) && Number(v) >= 0.5 && Number(v) <= 1.5; } },
      dictEmojiSettings: { key: 'hebrewDictionary_emojiSettings',  json: true, ok: function (v) { return isPlainObject(v); } }
    },
    live: { lang: true, darkMode: true },   // applied on every open page at once; the rest at the next load
    // The row's value: every field whose key is set (null when none is), with the held fields (what this
    // device could not apply) reported in place of the key's value while that key is unchanged.
    read: function () {
      var out = {}, any = false, held = suiteHeld(), f = SUITE_PREFS.fields;
      Object.keys(f).forEach(function (name) {
        var raw = lsGet(f[name].key), v = raw;
        if (raw !== null && f[name].json) { try { v = safeParse(raw); } catch (e) { v = null; } if (!isPlainObject(v)) v = null; }
        if (v !== null && v !== '') { out[name] = v; any = true; }
      });
      Object.keys(held).forEach(function (name) {
        var h = held[name];
        if (!isPlainObject(h)) return;
        var cur = f[name] ? lsGet(f[name].key) : null;
        if (f[name] && cur !== h.was) return;   // the key moved since the hold was taken: this device's choice wins
        out[name] = h.v; any = true;
      });
      return any ? out : null;
    },
    // Writes the fields it can apply; holds the rest. Never removes a key. Returns the names that changed.
    write: function (value) {
      var changed = [], held = suiteHeld(), f = SUITE_PREFS.fields;
      Object.keys(value).forEach(function (name) {
        if (badName(name)) return;
        var v = value[name], d = f[name];
        if (d && d.ok(v)) {
          var text = d.json ? JSON.stringify(v) : String(v);
          if (lsGet(d.key) !== text) { localStorage.setItem(d.key, text); changed.push(name); }
          delete held[name];
        } else if (v !== undefined && v !== null) {
          held[name] = { v: v, was: d ? lsGet(d.key) : null };   // kept for the row's hash; applied by a build that knows it
        }
      });
      suiteHeldSave(held);
      return changed;
    },
    remove: function () { return Promise.resolve(); },   // the harness's cleanup never removes a shared preference
    // After the tail settled the row: the language switches on this page now, and every listener follows
    // the theme. Returns whether a field that only shows after a reload changed.
    applied: function (changed) {
      var i = window.I18n, lang = lsGet('hebrewBlender_lang');
      if (i && typeof i.setLang === 'function' && lang && i.lang !== lang) { try { i.setLang(lang); } catch (e) {} }
      try { window.dispatchEvent(new CustomEvent('ivritsuite:prefs', { detail: { changed: changed || [] } })); } catch (e) {}
      return (changed || []).some(function (name) { return !SUITE_PREFS.live[name]; });
    }
  };
  var IVRIT_SYNC_REGISTRY = [
    // every page — the suite-wide preferences as one row (see SUITE_PREFS above); the hub shows its panel
    { tool: 'Suite', kind: 'prefs', virtual: SUITE_PREFS, shape: 'single', merge: 'assign', ivritKey: 'suitePrefs', label: 'shared.cloud.kind_suite_prefs' },
    // trope_tutor.html — mastery counts merge losslessly (max / union); the drawer layout never travels
    { tool: 'TropeTutor', kind: 'progress', lsKey: 'hebrewTropeTutor_progress', shape: 'single', merge: 'deepMax', ivritKey: 'tropeTutorProgress', label: 'shared.cloud.kind_progress' },
    { tool: 'TropeTutor', kind: 'settings', lsKey: 'hebrewTropeTutor_settings', shape: 'single', merge: 'assign', omit: ['panelsCollapsed'], ivritKey: 'tropeTutorSettings', label: 'shared.cloud.kind_settings' },
    // torah_trainer.html — one settings blob; the drawer/karaoke-bar layout and the reading position
    // (lastPos carries a timestamp on every scroll, which would keep the row "newer" forever) stay per device
    { tool: 'TorahTrainer', kind: 'settings', lsKey: 'hebrewTorahTrainer_settings', shape: 'single', merge: 'assign', omit: ['*Collapsed', 'lastPos', 'loopVerse'], ivritKey: 'torahTrainerSettings', label: 'shared.cloud.kind_settings' },
    // flash_cards.html — decks (the page calls them presets) and their folders, the live settings, the best
    // streak, and one row per student profile — a teacher's choice to upload (privacy.legal.* says so) —
    // with the profile folders; the page supplies the tree and profile merges
    { tool: 'FlashCards', kind: 'preset', lsKey: 'hebrewFlashCards_presets', shape: 'map', merge: 'item', ivritKey: 'flashCardPresets', label: 'shared.cloud.kind_preset' },
    { tool: 'FlashCards', kind: 'presetFolders', lsKey: 'hebrewFlashCards_presetsFolders', shape: 'tree', merge: 'page', follows: 'preset', ivritKey: 'flashCardPresetFolders' },
    { tool: 'FlashCards', kind: 'settings', lsKey: 'hebrewFlashCards_settings', shape: 'single', merge: 'assign', ivritKey: 'flashCardSettings', label: 'shared.cloud.kind_settings' },
    { tool: 'FlashCards', kind: 'pbStreak', lsKey: 'hebrewFlashCards_pbStreak', shape: 'scalar', merge: 'max', ivritKey: 'flashCardPbStreak', label: 'shared.cloud.kind_streak' },
    { tool: 'FlashCards', kind: 'profile', lsKey: 'hebrewFlashCards_profiles', shape: 'mapIn', path: 'profiles', envelope: { activeProfile: null }, merge: 'page', ivritKey: 'flashCardProfiles', label: 'shared.cloud.kind_profile' },
    { tool: 'FlashCards', kind: 'profileFolders', lsKey: 'hebrewFlashCards_profilesFolders', shape: 'tree', merge: 'page', follows: 'profile', ivritKey: 'flashCardProfileFolders' },
    // hebrew_blend_generator.html — presets and their folders, and the remembered last setup (what the
    // page restores on its next load); the page supplies the tree merge
    { tool: 'Worksheet', kind: 'preset', lsKey: 'hebrewBlender_presets', shape: 'map', merge: 'item', ivritKey: 'generatorPresets', label: 'shared.cloud.kind_preset' },
    { tool: 'Worksheet', kind: 'presetFolders', lsKey: 'hebrewBlender_presetsFolders', shape: 'tree', merge: 'page', follows: 'preset', ivritKey: 'generatorPresetFolders' },
    { tool: 'Worksheet', kind: 'lastState', lsKey: 'hebrewBlender_lastState', shape: 'single', merge: 'assign', ivritKey: 'blenderLastState', label: 'shared.cloud.kind_last_setup' },
    // hebrew_dictionary.html — the suite-wide word lists, one row per list (its id is the row name, its
    // `name` the label); the page supplies the uncapped union merge. Its small display prefs stay per device.
    { tool: 'Dictionary', kind: 'wordList', lsKey: 'ivritSuite_wordLists', shape: 'mapIn', path: 'lists', nameField: 'name', envelope: { v: 1 }, merge: 'page', ivritKey: 'wordLists', label: 'shared.cloud.kind_wordlist' },
    // classroom_dashboard.html — presets and saved schedules with their folders; ONE settings blob whose
    // per-device state (zoom, layout, collapsed panels, wake lock, the ephemeral picker sessions, the
    // derived coordinates, the live class pointer) never travels; and the class lists (rosters), which live
    // inside that same blob, as their own rows — a teacher's choice to upload (privacy.legal.* says so) —
    // so the settings row omits them. The page supplies the tree and roster merges.
    { tool: 'Dashboard', kind: 'preset', lsKey: 'hebrewDashboard_presets', shape: 'map', merge: 'item', ivritKey: 'dashboardPresets', label: 'shared.cloud.kind_preset' },
    { tool: 'Dashboard', kind: 'presetFolders', lsKey: 'hebrewDashboard_presetsFolders', shape: 'tree', merge: 'page', follows: 'preset', ivritKey: 'dashboardPresetFolders' },
    { tool: 'Dashboard', kind: 'schedule', lsKey: 'hebrewDashboard_schedules', shape: 'map', merge: 'item', ivritKey: 'dashboardSchedules', label: 'shared.cloud.kind_schedule' },
    { tool: 'Dashboard', kind: 'scheduleFolders', lsKey: 'hebrewDashboard_schedulesFolders', shape: 'tree', merge: 'page', follows: 'schedule', ivritKey: 'dashboardScheduleFolders' },
    { tool: 'Dashboard', kind: 'settings', lsKey: 'hebrewDashboard_settings', shape: 'single', merge: 'assign',
      omit: ['rosters', 'activeRosterId', 'pickerSessions', '_geoCoords', '*Collapsed', 'panelLayout', 'videoLayout', 'zoomLevel', 'hideZoomBar', 'keepAwake', 'lockPanelWidths', 'showTextSizeOptions'],
      ivritKey: 'dashboardSettings', label: 'shared.cloud.kind_settings' },
    { tool: 'Dashboard', kind: 'roster', lsKey: 'hebrewDashboard_settings', shape: 'mapIn', path: 'rosters', nameField: 'name', merge: 'page', ivritKey: 'dashboardRosters', label: 'shared.cloud.kind_roster' }
  ];
  var extraEntries = [];   // entries a page registered through attach({ entries }) — the test harness

  var pages = {};      // tool → the cfg given to attach()
  var panels = {};     // tool → { root, mounted }
  var plans = {};      // tool → the last plan
  var queues = {};     // tool → promise chain: one cloud operation at a time
  var busy = {};       // tool → true while its queue runs
  var messages = {};   // tool → { text, isError }
  var pendingRefresh = {};   // tool → the listing promise in flight, so two callers share one listing
  var seen = {};             // tool → kind → the write stamp this tab last acted on, or made itself (recheckWrites)
  var listening = false;
  var account = null;        // the open account screen: { root, opener, first } or null
  var splashShown = false;   // the fresh-sign-in splash opens at most once per page load
  // The tool names the account screen shows (the home page's card titles, present in every dictionary).
  var TOOL_NAMES = { Worksheet: ['home.card.generator.name', 'Hebrew Worksheet Generator'], FlashCards: ['home.card.flashcards.name', 'Hebrew Flash Cards'],
                     Dictionary: ['home.card.dictionary.name', 'Hebrew Word Lookup'], TorahTrainer: ['home.card.torah.name', 'Torah Trainer'],
                     TropeTutor: ['home.card.trope.name', 'Trope Tutor'], Dashboard: ['home.card.dashboard.name', 'Hebrew Classroom Dashboard'], Suite: ['shared.cloud.tool_suite', 'IvritSuite'] };

  /* ---------- tiny helpers ---------- */
  function A() { return window.IvritAccount || null; }
  function t(key, fallback, params) {
    var a = A();
    if (a && typeof a.t === 'function') { try { return a.t(key, fallback, params); } catch (e) {} }
    var v = fallback;
    if (params) v = String(v).replace(/\{(\w+)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(params, k) ? params[k] : m; });
    return v;
  }
  function makeError(code, msg) { var e = new Error(msg || ('IvritSaves: ' + code)); e.code = code; return e; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsRemove(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isPlainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function badName(n) { return n === '__proto__' || n === 'constructor' || n === 'prototype'; }
  function now() { return new Date().toISOString(); }
  function warn() { try { console.warn.apply(console, ['[saves]'].concat(Array.prototype.slice.call(arguments))); } catch (e) {} }
  function noop() {}
  // JSON from a file, the cloud or a store never gets to pollute Object.prototype.
  function safeParse(str) {
    return JSON.parse(str, function (k, v) { return (k === '__proto__' || k === 'constructor' || k === 'prototype') ? undefined : v; });
  }
  function safeAssign(target, src) {
    if (isPlainObject(src)) for (var k in src) if (hasOwn(src, k) && !badName(k)) target[k] = src[k];
    return target;
  }
  function clone(v) { return v === undefined ? undefined : safeParse(JSON.stringify(v)); }
  // Sequential Promise map: fn runs one at a time, the chain stops at the first rejection.
  function seqMap(list, fn) {
    var out = [];
    return list.reduce(function (chain, x, i) {
      return chain.then(function () { return fn(x, i); }).then(function (r) { out.push(r); });
    }, Promise.resolve()).then(function () { return out; });
  }

  /* ---------- canonical JSON and hashing (fact 1) ---------- */
  // Two devices must hash the same value the same way, and Postgres rewrites JSON, so hashes are taken
  // over this form: keys sorted at every depth, no spaces, undefined dropped, non-JSON values as null —
  // exactly what JSON.parse gives back on either side.
  function canonJson(v) {
    if (v === undefined) return 'null';
    if (v === null || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v);
    if (typeof v !== 'object') return 'null';
    if (typeof v.toJSON === 'function') return canonJson(v.toJSON());
    if (Array.isArray(v)) return '[' + v.map(function (x) { return canonJson(x); }).join(',') + ']';
    var keys = Object.keys(v).filter(function (k) { return v[k] !== undefined && typeof v[k] !== 'function'; }).sort();
    return '{' + keys.map(function (k) { return JSON.stringify(k) + ':' + canonJson(v[k]); }).join(',') + '}';
  }
  function b64url(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fnv1a(str, seed) {
    var h = seed >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return ('00000000' + h.toString(16)).slice(-8);
  }
  function fallbackHash(str) { return FALLBACK_PREFIX + fnv1a(str, 2166136261) + fnv1a(str, 0x9747b28c); }
  function haveSubtle() { try { return !!(window.crypto && window.crypto.subtle && window.TextEncoder); } catch (e) { return false; } }
  function currentPrefix() { return haveSubtle() ? HASH_PREFIX : FALLBACK_PREFIX; }
  function hashText(str) {
    if (haveSubtle()) {
      try {
        return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
          .then(function (buf) { return HASH_PREFIX + b64url(new Uint8Array(buf)); })
          .catch(function () { return fallbackHash(str); });
      } catch (e) {}
    }
    return Promise.resolve(fallbackHash(str));
  }
  function byteLength(str) {
    try { return new TextEncoder().encode(str).length; } catch (e) { return unescape(encodeURIComponent(str)).length; }
  }

  /* ---------- omit: per-device fields never travel ---------- */
  function omitMatches(field, pattern) {
    if (pattern.charAt(pattern.length - 1) === '*') return field.indexOf(pattern.slice(0, -1)) === 0;
    if (pattern.charAt(0) === '*') { var suf = pattern.slice(1); return field.length >= suf.length && field.slice(-suf.length) === suf; }
    return field === pattern;
  }
  function isOmitted(entry, field) {
    var list = entry.omit || [];
    for (var i = 0; i < list.length; i++) if (omitMatches(field, String(list[i]))) return true;
    return false;
  }
  // What travels: the value minus its per-device fields (only a plain object has fields to strip).
  function project(entry, value) {
    if (!entry.omit || !entry.omit.length || !isPlainObject(value)) return value;
    var out = {};
    for (var k in value) if (hasOwn(value, k) && !isOmitted(entry, k)) out[k] = value[k];
    return out;
  }
  // What lands: the incoming copy minus per-device fields, with this device's own values of those put back.
  function restoreOmitted(entry, incoming, local) {
    var out = project(entry, incoming);
    if (!entry.omit || !entry.omit.length || !isPlainObject(out) || !isPlainObject(local)) return out;
    for (var k in local) if (hasOwn(local, k) && isOmitted(entry, k)) out[k] = local[k];
    return out;
  }

  /* ---------- built-in merges ---------- */
  function numeric(v) {
    return (typeof v === 'number' && isFinite(v)) || (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v)));
  }
  function maxValue(a, b) {
    if (a === undefined || a === null) return b;
    if (b === undefined || b === null) return a;
    if (numeric(a) && numeric(b)) return Number(b) > Number(a) ? b : a;
    return a;   // not comparable: this device's value stays
  }
  // Lossless merge for progress-style blobs: numbers → the larger, booleans → true if either is,
  // objects recurse, arrays and anything else keep this device's side. Nothing recorded goes down.
  function deepMax(a, b) {
    if (a === undefined || a === null) return b;
    if (b === undefined || b === null) return a;
    if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
    if (isPlainObject(a) && isPlainObject(b)) {
      var out = {}, k;
      for (k in a) if (hasOwn(a, k) && !badName(k)) out[k] = hasOwn(b, k) ? deepMax(a[k], b[k]) : a[k];
      for (k in b) if (hasOwn(b, k) && !badName(k) && !hasOwn(a, k)) out[k] = b[k];
      return out;
    }
    if (numeric(a) && numeric(b)) return maxValue(a, b);
    return a;
  }
  // A downloaded row must look like what the entry stores, or it is not written anywhere.
  function validateShape(entry, data) {
    if (entry.shape === 'map' || entry.shape === 'mapIn') return data !== undefined && data !== null;
    if (entry.shape === 'single') return isPlainObject(data);
    if (entry.shape === 'tree') return isPlainObject(data) && Array.isArray(data.root);
    if (entry.shape === 'scalar') return isPlainObject(data) && (typeof data.value === 'string' || typeof data.value === 'number' || typeof data.value === 'boolean');
    return false;
  }

  /* ---------- the local backend (reads never write; writes are read back) ---------- */
  function readStore(entry) {
    if (entry.virtual) { try { return entry.virtual.read(); } catch (e) { return null; } }
    var raw = lsGet(entry.lsKey);
    if (raw === null) return null;
    if (entry.shape === 'scalar') return raw === '' ? null : raw;
    try { var v = safeParse(raw); return isPlainObject(v) ? v : null; } catch (e) { return null; }
  }
  function kindLabel(entry) { return entry.label ? t(entry.label, entry.kind) : entry.kind; }
  function item(entry, name, value) {
    var label = name;
    if (entry.shape === 'mapIn' && entry.nameField && isPlainObject(value) && typeof value[entry.nameField] === 'string' && value[entry.nameField]) label = value[entry.nameField];
    if (entry.shape !== 'map' && entry.shape !== 'mapIn') label = kindLabel(entry);
    return { kind: entry.kind, name: name, label: label, value: value, entry: entry };
  }
  // The items inside one entry's store, in the store's own order: [{ kind, name, label, value, entry }].
  function localItems(entry) {
    var store = readStore(entry), out = [], k;
    if (store === null) return out;
    if (entry.shape === 'map') {
      for (k in store) if (hasOwn(store, k) && !badName(k) && store[k] !== undefined && store[k] !== null) out.push(item(entry, k, store[k]));
    } else if (entry.shape === 'mapIn') {
      var inner = store[entry.path];
      if (isPlainObject(inner)) for (k in inner) if (hasOwn(inner, k) && !badName(k) && inner[k] !== undefined && inner[k] !== null) out.push(item(entry, k, inner[k]));
    } else if (entry.shape === 'single') {
      if (Object.keys(store).length) out.push(item(entry, DEFAULT_NAME, store));
    } else if (entry.shape === 'tree') {
      if (Array.isArray(store.root) && store.root.length) out.push(item(entry, DEFAULT_NAME, store));
    } else if (entry.shape === 'scalar') {
      out.push(item(entry, DEFAULT_NAME, { value: store }));
    }
    return out;
  }
  function localItem(entry, name) {
    var items = localItems(entry);
    for (var i = 0; i < items.length; i++) if (items[i].name === name) return items[i];
    return null;
  }
  function writeText(key, text) {
    try { localStorage.setItem(key, text); } catch (e) { return Promise.reject(makeError('quota', 'IvritSaves: localStorage write failed')); }
    if (lsGet(key) !== text) return Promise.reject(makeError('quota', 'IvritSaves: localStorage read-back mismatch'));
    return Promise.resolve();
  }
  // map / mapIn: the one item is set (a new name lands at the end, like the tool's own writer);
  // single / tree: the whole value; scalar: the plain string.
  var virtualChanged = null;   // the field names the last virtual write changed, read by the tail
  function localWrite(entry, name, value) {
    if (badName(name)) return Promise.reject(makeError('name'));
    if (entry.virtual) {
      try { virtualChanged = entry.virtual.write(value); } catch (e) { return Promise.reject(makeError('quota', 'IvritSaves: preference write failed')); }
      stampWrite(entry, name);
      return Promise.resolve();
    }
    var store, text;
    if (entry.shape === 'map') {
      store = readStore(entry) || {};
      store[name] = value;
      text = JSON.stringify(store);
    } else if (entry.shape === 'mapIn') {
      store = readStore(entry) || safeAssign({}, entry.envelope || {});
      if (!isPlainObject(store[entry.path])) store[entry.path] = {};
      store[entry.path][name] = value;
      text = JSON.stringify(store);
    } else if (entry.shape === 'scalar') {
      text = String(value.value);
    } else {
      text = JSON.stringify(value);
    }
    return writeText(entry.lsKey, text).then(function () { stampWrite(entry, name); });
  }
  // Other tabs of the same tool learn about a module write through the sync-memory key — its `storage`
  // event, or a look at the stamps when the tab next becomes visible (see recheckWrites) — and re-read
  // the key; otherwise their next in-memory save would revert it. `lastWrite` names the write; `written`
  // keeps one stamp per tool and kind, overwritten in place, so it never grows past the registry.
  // Signed in only: anonymous use never creates the key (the harness's local round trip stays silent).
  function stampWrite(entry, name) {
    if (!currentUser()) return;
    var m = metaAll(), at = Date.now();
    m.lastWrite = { tool: entry.tool, kind: entry.kind, name: name, at: at };
    if (!isPlainObject(m.written)) m.written = {};
    if (!isPlainObject(m.written[entry.tool])) m.written[entry.tool] = {};
    m.written[entry.tool][entry.kind] = at;
    markSeen(entry.tool, entry.kind, at);   // this tab's own write is not news to it
    metaSave(m);
  }
  function markSeen(tool, kind, at) { if (!isPlainObject(seen[tool])) seen[tool] = {}; seen[tool][kind] = at; }
  // The stamps as one map tool → kind → at: `written`, with `lastWrite` folded in (a tab still running the
  // previous module stamps only that one).
  function stampsOf(m) {
    var out = {}, w = isPlainObject(m.written) ? m.written : {}, lw = isPlainObject(m.lastWrite) ? m.lastWrite : null;
    Object.keys(w).forEach(function (tool) {
      if (!isPlainObject(w[tool])) return;
      Object.keys(w[tool]).forEach(function (kind) {
        if (typeof w[tool][kind] !== 'number') return;
        if (!out[tool]) out[tool] = {};
        out[tool][kind] = w[tool][kind];
      });
    });
    if (lw && typeof lw.at === 'number' && lw.tool && lw.kind) {
      if (!out[lw.tool]) out[lw.tool] = {};
      if (!(out[lw.tool][lw.kind] >= lw.at)) out[lw.tool][lw.kind] = lw.at;
    }
    return out;
  }
  // Only the test harness removes local data (its own keys). The panel never calls this.
  function localRemove(entry, name) {
    if (entry.virtual) return entry.virtual.remove();
    var store = readStore(entry);
    if (entry.shape === 'map') {
      if (store && hasOwn(store, name)) { delete store[name]; return writeText(entry.lsKey, JSON.stringify(store)); }
      return Promise.resolve();
    }
    if (entry.shape === 'mapIn') {
      if (store && isPlainObject(store[entry.path]) && hasOwn(store[entry.path], name)) { delete store[entry.path][name]; return writeText(entry.lsKey, JSON.stringify(store)); }
      return Promise.resolve();
    }
    lsRemove(entry.lsKey);
    return Promise.resolve();
  }

  /* ---------- sync memory: what this device last synced, per account ---------- */
  // The suite-wide preferences this device could not apply (SUITE_PREFS): { field: { v, was } } — the
  // account's value and what the key held when it arrived. Device-level, like the write stamps.
  function suiteHeld() { var m = metaAll(); return isPlainObject(m.held) ? m.held : {}; }
  function suiteHeldSave(held) { var m = metaAll(); if (Object.keys(held).length) m.held = held; else delete m.held; metaSave(m); }
  function metaAll() {
    try { var m = safeParse(lsGet(META_KEY) || 'null'); if (isPlainObject(m) && m.v === 1 && isPlainObject(m.users)) return m; } catch (e) {}
    return { v: 1, users: {} };
  }
  // Two tabs read-modify-write this key. The write stamps (`written`, `lastWrite`) are the part another tab
  // may have moved meanwhile, so the newer stamp per tool and kind is taken from the stored copy before
  // writing — a lost stamp would leave a tab's stale in-memory copy unread. Everything else is this tab's.
  function metaSave(m) {
    try {
      var cur = null;
      try { cur = safeParse(lsGet(META_KEY) || 'null'); } catch (e) {}
      if (isPlainObject(cur)) {
        var w = isPlainObject(cur.written) ? cur.written : {};
        Object.keys(w).forEach(function (tool) {
          if (!isPlainObject(w[tool])) return;
          Object.keys(w[tool]).forEach(function (kind) {
            var at = w[tool][kind];
            if (typeof at !== 'number') return;
            if (!isPlainObject(m.written)) m.written = {};
            if (!isPlainObject(m.written[tool])) m.written[tool] = {};
            if (!(m.written[tool][kind] >= at)) m.written[tool][kind] = at;
          });
        });
        var lw = cur.lastWrite;
        if (isPlainObject(lw) && typeof lw.at === 'number' && !(isPlainObject(m.lastWrite) && m.lastWrite.at >= lw.at)) m.lastWrite = lw;
      }
      localStorage.setItem(META_KEY, JSON.stringify(m));
    } catch (e) {}
  }
  function metaBranch(m, uid, tool, kind, create) {
    var u = m.users[uid]; if (!isPlainObject(u)) { if (!create) return null; u = m.users[uid] = {}; }
    var tl = u[tool]; if (!isPlainObject(tl)) { if (!create) return null; tl = u[tool] = {}; }
    var k = tl[kind]; if (!isPlainObject(k)) { if (!create) return null; k = tl[kind] = {}; }
    return k;
  }
  function metaGet(uid, tool, kind, name) {
    var b = metaBranch(metaAll(), uid, tool, kind, false);
    return (b && hasOwn(b, name) && isPlainObject(b[name])) ? b[name] : null;
  }
  function metaSet(uid, tool, kind, name, rec) {
    if (!uid || badName(name)) return;
    var m = metaAll();
    metaBranch(m, uid, tool, kind, true)[name] = rec;
    metaSave(m);
  }
  function metaDelete(uid, tool, kind, name) {
    var m = metaAll(), b = metaBranch(m, uid, tool, kind, false);
    if (b && hasOwn(b, name)) { delete b[name]; metaSave(m); }
  }
  // Whether the account screen already introduced itself to this account on this device.
  function welcomedAt(uid) { var m = metaAll(); return (isPlainObject(m.welcomed) && m.welcomed[uid]) || null; }
  function markWelcomed(uid) { var m = metaAll(); if (!isPlainObject(m.welcomed)) m.welcomed = {}; m.welcomed[uid] = now(); metaSave(m); }
  // Forget items that are gone on both sides. keep = { kind: { name: true } }.
  function metaPrune(uid, tool, keep) {
    var m = metaAll(), u = m.users[uid], tl = isPlainObject(u) && u[tool], changed = false;
    if (!isPlainObject(tl)) return;
    for (var kind in tl) if (hasOwn(tl, kind) && isPlainObject(tl[kind])) {
      for (var name in tl[kind]) if (hasOwn(tl[kind], name) && !(keep[kind] && keep[kind][name])) { delete tl[kind][name]; changed = true; }
    }
    if (changed) metaSave(m);
  }

  /* ---------- the cloud backend (the saves table through IvritAccount.client()) ---------- */
  function client() {
    var a = A();
    if (!a) return Promise.reject(makeError('disabled', 'IvritSaves: IvritAccount is not loaded'));
    return a.client();
  }
  function currentUser() { var a = A(); return (a && typeof a.user === 'function') ? a.user() : null; }
  function unwrap(r) { if (r && r.error) throw r.error; return r ? r.data : null; }
  function isAuthError(err) {
    var code = String((err && err.code) || ''), st = err && (err.status || err.statusCode);
    return code === 'PGRST301' || st === 401 || /jwt/i.test(String((err && err.message) || ''));
  }
  // One retry after the SDK refreshes a stale token; every other failure surfaces as is.
  function withClient(fn) {
    return client().then(function (c) {
      return Promise.resolve().then(function () { return fn(c); }).then(unwrap).catch(function (err) {
        if (!isAuthError(err)) throw err;
        return c.auth.getSession().then(function () { return Promise.resolve().then(function () { return fn(c); }).then(unwrap); });
      });
    });
  }
  function cloudList(tool) {
    var all = [];
    function page(from) {
      return withClient(function (c) {
        return c.from('saves').select(ROW_COLS).eq('tool', tool).order('kind').order('name').order('id').range(from, from + PAGE_SIZE - 1);
      }).then(function (rows) {
        rows = rows || [];
        all = all.concat(rows);
        return rows.length === PAGE_SIZE ? page(from + PAGE_SIZE) : all;
      });
    }
    return page(0);
  }
  // Every row of a tool with its data — the account backup file (paged like the listing).
  function cloudListFull(tool) {
    var all = [];
    function page(from) {
      return withClient(function (c) {
        return c.from('saves').select('id, tool, kind, name, data').eq('tool', tool).order('kind').order('name').order('id').range(from, from + PAGE_SIZE - 1);
      }).then(function (rows) {
        rows = (rows || []).map(function (r) { r.data = clone(r.data); return r; });
        all = all.concat(rows);
        return rows.length === PAGE_SIZE ? page(from + PAGE_SIZE) : all;
      });
    }
    return page(0);
  }
  function cloudLoad(id) {
    return withClient(function (c) { return c.from('saves').select('id, kind, name, data, data_hash, bytes, updated_at').eq('id', id).maybeSingle(); })
      .then(function (row) {
        if (!row) throw makeError('changed', 'IvritSaves: the row is gone');
        row.data = clone(row.data);   // re-parsed through the prototype-safe parser
        return row;
      });
  }
  function cloudInsert(entry, name, data, hash) {
    return withClient(function (c) {
      return c.from('saves').insert({ tool: entry.tool, kind: entry.kind, name: name, data: data, data_hash: hash, client_updated_at: now() }).select(ROW_COLS).single();
    });
  }
  // Writes only if the row is still the one that was listed, so another device's newer copy is never
  // overwritten unseen; zero rows back means "changed meanwhile: list again and choose again".
  function cloudUpdateIf(id, expectedUpdatedAt, data, hash) {
    return withClient(function (c) {
      return c.from('saves').update({ data: data, data_hash: hash, client_updated_at: now() }).eq('id', id).eq('updated_at', expectedUpdatedAt).select(ROW_COLS);
    }).then(function (rows) {
      if (!rows || !rows.length) throw makeError('changed', 'IvritSaves: the row changed meanwhile');
      return rows[0];
    });
  }
  function cloudRemove(id) {
    return withClient(function (c) { return c.from('saves').delete().eq('id', id).select('id'); }).then(function () { return true; });
  }
  // Every failure becomes one localized sentence.
  function errorText(err) {
    var code = String((err && err.code) || '');
    var st = err && (err.status || err.statusCode);
    var lower = String((err && err.message) || '').toLowerCase();
    if (code === 'quota') return t('shared.cloud.error_quota', 'There is no room left on this device to store that item.');
    if (code === 'changed') return t('shared.cloud.error_changed', 'That item changed a moment ago (here or in the cloud). The list was refreshed; choose again.');
    if (code === 'changed_here') return t('shared.cloud.error_changed_here', 'That item changed on this device after the list was made. The list was refreshed; choose again.');
    if (code === 'hook') return t('shared.cloud.error_hook', 'Downloaded, but this page could not show it. Reload the page, then choose again.');
    if (code === 'shape') return t('shared.cloud.error_shape', 'The cloud copy has an unexpected shape and was not written to this device.');
    if (code === 'no_merge') return t('shared.cloud.error_no_merge', 'This page cannot merge that item yet.');
    if (code === 'name') return t('shared.cloud.error_name', 'Names must be 1 to 120 characters.');
    if (code === 'chars' || code === '22P05') return t('shared.cloud.error_chars', 'That item contains characters the cloud cannot store.');
    if (code === 'too_big' || (code === '23514' && /2mb|octet|too big/.test(lower))) return t('shared.cloud.error_too_big', 'That item is too big for the cloud (2 MB limit).');
    if (code === '23514') return t('shared.cloud.error_limit', 'Your account has reached its limit of saved items.');
    if (code === '23505') return t('shared.cloud.error_name_taken', 'That name is already used in the cloud.');
    if (code === 'file_too_big') return t('shared.cloud.error_file_too_big', 'That file is too big for the cloud.');
    if (code === 'bad_type') return t('shared.cloud.error_file_type', 'The cloud does not accept that file type.');
    if (code === 'not_found') return t('shared.cloud.error_not_found', 'That file is no longer in your account.');
    if (code === 'project_limit') return t('shared.cloud.error_project_limit', 'Your account has reached its limit of 25 font projects.');
    if (code === 'project_too_big') return t('shared.cloud.error_project_too_big', 'This project is too big for your account (20 MB after compression).');
    if (code === '42501') return t('shared.cloud.error_not_allowed', 'The cloud refused this action.');
    if (code === 'signed_out' || code === 'PGRST301' || st === 401 || /jwt/.test(lower)) return t('shared.cloud.error_session', 'Your sign-in has expired. Sign in again.');
    if (code === 'PGRST204' || code === 'PGRST205' || code === '42P01') return t('shared.cloud.error_not_setup', 'Cloud saves are not set up on the server yet.');
    if (code === 'offline' || code === 'blocked' || code === 'disabled' || /failed to fetch|networkerror|load failed|network request failed/.test(lower)) return t('shared.cloud.error_offline', 'The cloud is unreachable right now. Try again later.');
    return t('shared.cloud.error_generic', 'Something went wrong. Please try again.');
  }
  // Refused here, before any network: a name the table would reject, a value too big to store.
  function guardUpload(entry, name, projected) {
    var n = String(name === undefined || name === null ? '' : name);
    var len = Array.from(n).length;
    if (len < 1 || len > MAX_NAME || badName(n)) return makeError('name');
    if (!KIND_RE.test(entry.kind)) return makeError('name');
    var text = canonJson(projected);
    if (text.indexOf('\\u0000') >= 0) return makeError('chars');
    if (byteLength(text) > MAX_BYTES) return makeError('too_big');
    return null;
  }

  /* ---------- registry access ---------- */
  function registryFor(tool) {
    return IVRIT_SYNC_REGISTRY.concat(extraEntries).filter(function (e) { return e.tool === tool; });
  }
  function entryFor(tool, kind) {
    var list = registryFor(tool);
    for (var i = 0; i < list.length; i++) if (list[i].kind === kind) return list[i];
    return null;
  }
  function validEntry(e) {
    if (!isPlainObject(e)) return 'not an object';
    if (TOOLS.indexOf(e.tool) < 0) return 'unknown tool ' + e.tool;
    if (!KIND_RE.test(String(e.kind))) return 'bad kind ' + e.kind;
    if (e.virtual) { if (!isPlainObject(e.virtual) || typeof e.virtual.read !== 'function' || typeof e.virtual.write !== 'function') return 'virtual needs read and write'; }
    else if (typeof e.lsKey !== 'string' || !e.lsKey) return 'missing lsKey';
    if (SHAPES.indexOf(e.shape) < 0) return 'bad shape ' + e.shape;
    if (MERGES.indexOf(e.merge) < 0) return 'bad merge ' + e.merge;
    if (e.shape === 'mapIn' && (typeof e.path !== 'string' || !e.path)) return 'mapIn needs a path';
    if (e.shape === 'tree' && (typeof e.follows !== 'string' || !e.follows)) return 'a tree needs follows';
    if (e.omit !== undefined && !Array.isArray(e.omit)) return 'omit must be an array';
    return null;
  }
  function keyOf(kind, name) { return kind + ':' + name; }   // a kind is letters only, so the first ':' always ends it
  function hashItem(entry, value) { return hashText(canonJson(project(entry, value))); }

  /* ---------- the plan: one row per kind + name across both sides ---------- */
  // local / cloud: { hash } or null (cloud also carries updatedAt); memory: what this device last synced
  // for the item, or null. The row's updated_at matching the memory is what says "the cloud copy is
  // the one I synced" — the hash in `data_hash` is only a shortcut.
  // Two derived states never act on their own: a cloud-only row this device once synced (the memory knows
  // that very row) was deleted or renamed here — `deleted-here`, the person chooses; a local-only row
  // whose memory carries the tombstone "Delete from cloud" left, with the same hash, is `cloud-deleted`
  // and is not uploaded again until it changes or the person asks.
  function classify(local, cloud, memory) {
    if (local && !cloud) return (memory && memory.deletedCloud && memory.h === local.hash) ? 'cloud-deleted' : 'local-only';
    if (!local && cloud) return (memory && memory.id === cloud.id && (memory.u === cloud.updatedAt || memory.h === cloud.hash)) ? 'deleted-here' : 'cloud-only';
    if (!local && !cloud) return 'none';
    if (local.hash === cloud.hash) return 'synced';
    if (memory) {
      var cloudSame = (!!cloud.updatedAt && memory.u === cloud.updatedAt) || cloud.hash === memory.h;
      var localSame = local.hash === memory.h;
      if (localSame && cloudSame) return 'synced';   // neither side moved since the last sync
      if (localSame) return 'cloud-changed';
      if (cloudSame) return 'local-changed';
    }
    return 'conflict';
  }
  function safeActionFor(r) {
    if (r.state === 'local-only' || r.state === 'local-changed') return 'upload';
    if (r.state === 'cloud-only' || r.state === 'cloud-changed') return r.downloadable ? 'download' : null;
    if (r.state === 'conflict' && r.mergeable && r.downloadable) return 'merge';
    return null;
  }
  function choicesFor(r) {
    if (r.state === 'deleted-here') return r.downloadable ? ['deleteCloud', 'download'] : ['deleteCloud'];
    if (r.state === 'cloud-deleted') return ['upload'];
    if (r.state !== 'conflict') return r.safeAction ? [r.safeAction] : [];
    var m = r.entry.merge;
    if (m === 'item') return r.downloadable ? ['keepBoth', 'useCloud', 'keepMine'] : ['keepMine'];
    if (m === 'assign') return r.downloadable ? ['useCloud', 'keepMine'] : ['keepMine'];
    if (r.mergeable && r.downloadable) return ['merge'];
    return m === 'page' ? [] : ['keepMine'];   // no helper on this page: the tool that owns the merge resolves it
  }
  // A settings blob that differs on both sides on a device with no memory of a sync is the everyday case
  // on a second device (every tool writes its settings blob the first time it opens there), not a rare
  // clash — so the account screen resolves every such row in one step. Items (a preset named the same
  // on both sides) keep their per-row choices in the tool's panel.
  function isSettingsChoice(r) { return r.state === 'conflict' && r.entry.merge === 'assign' && r.choices.indexOf('useCloud') >= 0; }
  function localSide(tool) {
    var items = [];
    registryFor(tool).forEach(function (e) { if (e.shape !== 'tree') items = items.concat(localItems(e)); });
    return seqMap(items, function (it) {
      var text = canonJson(project(it.entry, it.value));
      it.bytes = byteLength(text);
      return hashText(text).then(function (h) { it.hash = h; return it; });
    });
  }
  function cloudHashFor(entry, row, mem) {
    if (mem && mem.id === row.id && mem.u === row.updated_at) return Promise.resolve(mem.h);
    if (typeof row.data_hash === 'string' && row.data_hash.indexOf(currentPrefix()) === 0) return Promise.resolve(row.data_hash);
    return cloudLoad(row.id).then(function (full) { return hashItem(entry, full.data); });   // unknown: hash it here
  }
  function planTool(tool) {
    var user = currentUser();
    var uid = user ? user.id : null;
    if (uid) flushPage(tool);   // a pending debounced write must land before the listing, or the first action sees a moved item
    return localSide(tool).then(function (locals) {
      var rows = {}, order = [];
      locals.forEach(function (it) {
        var k = keyOf(it.kind, it.name);
        rows[k] = { key: k, kind: it.kind, name: it.name, label: it.label, entry: it.entry, local: { hash: it.hash, bytes: it.bytes }, cloud: null, memory: null };
        order.push(k);
      });
      if (!uid) return finishPlan(tool, null, rows, order, []);
      return cloudList(tool).then(function (cloudRows) {
        var listed = cloudRows.filter(function (r) { var e = entryFor(tool, r.kind); return e && e.shape !== 'tree' && !badName(r.name); });
        return seqMap(listed, function (r) {
          var e = entryFor(tool, r.kind);
          return cloudHashFor(e, r, metaGet(uid, tool, r.kind, r.name)).then(function (h) {
            var k = keyOf(r.kind, r.name);
            if (!rows[k]) {
              rows[k] = { key: k, kind: r.kind, name: r.name, label: (e.shape === 'map' || e.shape === 'mapIn') ? r.name : kindLabel(e), entry: e, local: null, cloud: null, memory: null };
              order.push(k);
            }
            rows[k].cloud = { id: r.id, hash: h, bytes: r.bytes, updatedAt: r.updated_at };
          });
        }).then(function () { return finishPlan(tool, uid, rows, order, cloudRows); });
      });
    });
  }
  function finishPlan(tool, uid, rows, order, cloudRows) {
    var cfg = pages[tool] || {};
    var entries = registryFor(tool);
    var keep = {};
    var list = order.map(function (k) {
      var r = rows[k];
      r.memory = uid ? metaGet(uid, tool, r.kind, r.name) : null;
      r.state = classify(r.local, r.cloud, r.memory);
      keep[r.kind] = keep[r.kind] || {};
      keep[r.kind][r.name] = true;
      if (uid && r.state === 'synced' && r.local && r.cloud && (!r.memory || r.memory.h !== r.local.hash || r.memory.u !== r.cloud.updatedAt)) {
        metaSet(uid, tool, r.kind, r.name, { h: r.local.hash, id: r.cloud.id, u: r.cloud.updatedAt, at: now() });
      }
      // A tool this page renders needs its re-read hook before a settings blob may land; a tool this page
      // does not render holds nothing in memory here (other tabs re-read through the write stamp).
      r.downloadable = pages[tool] ? !(NEEDS_HOOK[r.entry.shape] && typeof cfg.onLocalChanged !== 'function') : true;
      r.mergeable = r.entry.merge === 'deepMax' || r.entry.merge === 'max' || (r.entry.merge === 'page' && typeof (cfg.merges && cfg.merges[r.kind]) === 'function');
      r.safeAction = safeActionFor(r);
      r.choices = choicesFor(r);
      return r;
    });
    // Trees are not rows, but their memory must survive pruning while either side has one.
    entries.forEach(function (e) {
      if (e.shape !== 'tree') return;
      var has = !!readStore(e) || cloudRows.some(function (r) { return r.kind === e.kind && r.name === DEFAULT_NAME; });
      if (has) { keep[e.kind] = keep[e.kind] || {}; keep[e.kind][DEFAULT_NAME] = true; }
    });
    if (uid) metaPrune(uid, tool, keep);
    var kindOrder = {};
    entries.forEach(function (e, i) { kindOrder[e.kind] = i; });
    list.sort(function (a, b) {
      var d = (kindOrder[a.kind] || 0) - (kindOrder[b.kind] || 0);
      return d || String(a.label).localeCompare(String(b.label));
    });
    var counts = { safe: 0, conflicts: 0, synced: 0, deleted: 0 };
    list.forEach(function (r) {
      if (r.safeAction) counts.safe++;
      if (r.state === 'conflict' && !r.safeAction) counts.conflicts++;
      if (r.state === 'synced') counts.synced++;
      if (r.state === 'deleted-here') counts.deleted++;
    });
    var p = { tool: tool, userId: uid, rows: list, cloudRows: cloudRows, counts: counts, treesDiffer: [] };
    // A folder tree is never a row, but a layout that differs is work the Sync buttons must offer.
    var trees = uid ? entries.filter(function (e) { return e.shape === 'tree'; }) : [];
    return seqMap(trees, function (e) { return treeDiffers(tool, uid, e, cloudRows, list); }).then(function (diffs) {
      p.treesDiffer = diffs.filter(Boolean);
      counts.safe += p.treesDiffer.length;
      plans[tool] = p;
      return p;
    });
  }
  // The cloud row of a tree entry, if any.
  function treeRowOf(entry, cloudRows) {
    var row = null;
    (cloudRows || []).forEach(function (r) { if (r.kind === entry.kind && r.name === DEFAULT_NAME) row = r; });
    return row;
  }
  function localTree(entry) {
    var local = readStore(entry);
    return (local && Array.isArray(local.root) && local.root.length) ? local : null;
  }
  // Whether a tree needs the tree pass — resolves to its kind, or null: one side only, the two sides
  // differ, or the account's copy cannot be compared without loading it. While an item it follows is
  // still only in the account the tree waits for that download (a safe action of its own).
  function treeDiffers(tool, uid, entry, cloudRows, rows) {
    var cloudRow = treeRowOf(entry, cloudRows), local = localTree(entry);
    if (!local && !cloudRow) return Promise.resolve(null);
    if (rows.some(function (r) { return r.kind === entry.follows && r.state === 'cloud-only'; })) return Promise.resolve(null);
    if (!local || !cloudRow) return Promise.resolve(entry.kind);
    var mem = metaGet(uid, tool, entry.kind, DEFAULT_NAME);
    var cloudHash = (mem && mem.id === cloudRow.id && mem.u === cloudRow.updated_at) ? mem.h
                  : (typeof cloudRow.data_hash === 'string' && cloudRow.data_hash.indexOf(currentPrefix()) === 0) ? cloudRow.data_hash : null;
    return hashItem(entry, local).then(function (h) { return (cloudHash && h === cloudHash) ? null : entry.kind; });
  }

  /* ---------- actions (each runs inside the tool's queue) ---------- */
  function ensureUser() { var u = currentUser(); if (!u) throw makeError('signed_out'); return u.id; }
  function stillMe(uid) { var u = currentUser(); return !!u && u.id === uid; }
  function flushPage(tool) {
    var cfg = pages[tool];
    if (cfg && typeof cfg.flush === 'function') { try { cfg.flush(); } catch (e) { warn('flush failed:', e); } }
  }
  // Tells the page to re-read the key. Returns false when the page's hook threw: its in-memory copy is then
  // stale and would write back over what was just stored, so the caller must not remember the write.
  function notifyPage(tool, kind, name) {
    var cfg = pages[tool];
    if (!cfg || typeof cfg.onLocalChanged !== 'function') return true;
    try { cfg.onLocalChanged(kind, name); return true; } catch (e) { warn('onLocalChanged failed:', e); return false; }
  }
  // The local side may have moved since the list was built (the page kept working): a download or a
  // merge onto a value newer than the one the person looked at — or onto an item that was not there when
  // they looked — is refused and the list refreshed.
  function assertLocalAsPlanned(row, it) {
    if (!row.local) { if (it) throw makeError('changed_here', 'IvritSaves: a local item appeared meanwhile'); return Promise.resolve(); }
    if (!it) throw makeError('changed_here', 'IvritSaves: the local item is gone');
    return hashItem(row.entry, it.value).then(function (h) { if (h !== row.local.hash) throw makeError('changed_here', 'IvritSaves: the local item changed meanwhile'); });
  }
  function remember(uid, tool, kind, name, h, saved) {
    if (stillMe(uid)) metaSet(uid, tool, kind, name, { h: h, id: saved.id, u: saved.updated_at, at: now() });
  }
  // The one ending of every local write the module makes (a download, a merge, a folder tree, the copy of
  // Keep both): tell the page, let the page's own writer land whatever it re-applied, then make the two
  // sides equal — the cloud row is remembered when the store still matches it, and the store's version is
  // put in the account when it does not. Remembering the store's hash as the cloud's would hide a lossy
  // re-apply behind "Same"; pushing makes both sides hold the page's normalized form, which reads "Same"
  // honestly and converges in one round. `full` = { id, updated_at, data } of the row the store was written
  // from. A page hook that throws remembers nothing (the page's stale memory would write back over the
  // download) and fails the action with `hook`; a store the page emptied fails the same way.
  function settleLocalWrite(tool, uid, entry, name, full) {
    var changed = virtualChanged;
    virtualChanged = null;
    if (!notifyPage(tool, entry.kind, name)) throw makeError('hook', 'IvritSaves: the page could not take the write');
    flushPage(tool);
    return reconcileStore(tool, uid, entry, name, full).then(function (r) {
      // A virtual row (the suite-wide preferences) applies itself once both sides agree: the language on
      // this page now, the theme through every page's listener; `hint` = something shows after a reload.
      if (entry.virtual && typeof entry.virtual.applied === 'function') { try { r.hint = !!entry.virtual.applied(changed); } catch (e) {} }
      return r;
    });
  }
  // The comparing half of the tail — also used when the store already held the value and nothing was written.
  function reconcileStore(tool, uid, entry, name, full) {
    var back = localItem(entry, name);
    if (!back) throw makeError('hook', 'IvritSaves: the page dropped the item');
    var projected = project(entry, back.value);
    return Promise.all([hashText(canonJson(projected)), hashItem(entry, full.data)]).then(function (hs) {
      var h = hs[0], cloudHash = hs[1];
      if (h === cloudHash) { remember(uid, tool, entry.kind, name, h, full); return { hash: h, pushed: false }; }
      var g = guardUpload(entry, name, projected);
      if (g) throw g;
      return cloudUpdateIf(full.id, full.updated_at, projected, h).then(function (saved) {
        remember(uid, tool, entry.kind, name, h, saved);
        return { hash: h, pushed: true };
      }, function (err) {
        if (err && err.code === 'changed') { warn('the account copy moved while this device took it; the next listing shows both sides'); return { hash: h, pushed: false }; }
        throw err;
      });
    });
  }
  // Upload: the local copy goes over the listed cloud row (if any). "Keep mine" on a conflict is the same
  // send after a check that the local copy is still the one the person looked at; for a settings blob it
  // is a merge in which this device's fields win and a field only the account had survives.
  function actUpload(tool, row, keepMine) {
    if (keepMine && row.cloud && row.entry.merge === 'assign') return actKeepMineAssign(tool, row);
    var uid = ensureUser();
    flushPage(tool);
    var it = localItem(row.entry, row.name);
    if (!it) throw makeError('changed_here', 'IvritSaves: nothing to upload');
    return (keepMine ? assertLocalAsPlanned(row, it) : Promise.resolve()).then(function () {
      var projected = project(row.entry, it.value);
      var g = guardUpload(row.entry, row.name, projected);
      if (g) throw g;
      return hashText(canonJson(projected)).then(function (h) {
        var write = row.cloud ? cloudUpdateIf(row.cloud.id, row.cloud.updatedAt, projected, h)
                              : cloudInsert(row.entry, row.name, projected, h).catch(function (err) { if (err && err.code === '23505') throw makeError('changed'); throw err; });
        return write.then(function (saved) { remember(uid, tool, row.kind, row.name, h, saved); return { action: 'upload', row: row }; });
      });
    });
  }
  function actKeepMineAssign(tool, row) {
    var uid = ensureUser();
    return cloudLoad(row.cloud.id).then(function (full) {
      if (!validateShape(row.entry, full.data)) throw makeError('shape');
      flushPage(tool);
      var it = localItem(row.entry, row.name);
      return assertLocalAsPlanned(row, it).then(function () {
        if (!it) throw makeError('changed_here');
        var merged = safeAssign(clone(restoreOmitted(row.entry, full.data, it.value)), it.value);
        return writeBothSides(tool, uid, row, merged, full);
      }).then(function () { return { action: 'upload', row: row }; });
    });
  }
  function actDownload(tool, row) {
    var uid = ensureUser();
    return cloudLoad(row.cloud.id).then(function (full) {
      if (!validateShape(row.entry, full.data)) throw makeError('shape');
      flushPage(tool);
      var it = localItem(row.entry, row.name);
      return assertLocalAsPlanned(row, it).then(function () {
        var value = restoreOmitted(row.entry, full.data, it ? it.value : null);
        return localWrite(row.entry, row.name, value)
          .then(function () { return settleLocalWrite(tool, uid, row.entry, row.name, full); })
          .then(function (r) { return { action: 'download', row: row, pushed: r.pushed, hint: r.hint }; });
      });
    });
  }
  // Shared tail of the merging actions: the value is checked against the account's limits first (a merge
  // too big to store is refused before anything is written on either side), written here, then settled.
  function writeBothSides(tool, uid, row, value, full) {
    var g = guardUpload(row.entry, row.name, project(row.entry, value));
    if (g) return Promise.reject(g);
    return localWrite(row.entry, row.name, value)
      .then(function () { return settleLocalWrite(tool, uid, row.entry, row.name, full); })
      .then(function (r) { return { action: 'merge', row: row, pushed: r.pushed, hint: r.hint }; });
  }
  function actMerge(tool, row) {
    var uid = ensureUser();
    var cfg = pages[tool] || {};
    return cloudLoad(row.cloud.id).then(function (full) {
      if (!validateShape(row.entry, full.data)) throw makeError('shape');
      flushPage(tool);
      var it = localItem(row.entry, row.name);
      return assertLocalAsPlanned(row, it).then(function () {
        var local = it ? it.value : null;
        var cloudVal = restoreOmitted(row.entry, full.data, local);
        var m = row.entry.merge, merged;
        if (m === 'deepMax') merged = deepMax(local, cloudVal);
        else if (m === 'max') merged = { value: maxValue(local ? local.value : undefined, cloudVal.value) };
        else if (m === 'page') {
          var fn = cfg.merges && cfg.merges[row.kind];
          if (typeof fn !== 'function') throw makeError('no_merge');
          merged = fn(clone(local), clone(cloudVal));
          if (!validateShape(row.entry, merged)) throw makeError('shape');
        } else throw makeError('no_merge');
        return writeBothSides(tool, uid, row, merged, full);
      });
    });
  }
  // "Use cloud copy": for a settings blob the cloud's fields land over a copy of this device's (so a
  // field the cloud never had survives), then both sides hold the result; for an item it is a download.
  function actUseCloud(tool, row) {
    if (row.entry.merge !== 'assign') return actDownload(tool, row);
    var uid = ensureUser();
    return cloudLoad(row.cloud.id).then(function (full) {
      if (!validateShape(row.entry, full.data)) throw makeError('shape');
      flushPage(tool);
      var it = localItem(row.entry, row.name);
      return assertLocalAsPlanned(row, it).then(function () {
        var local = it ? it.value : null;
        var merged = safeAssign(isPlainObject(local) ? clone(local) : {}, restoreOmitted(row.entry, full.data, local));
        return writeBothSides(tool, uid, row, merged, full);
      });
    });
  }
  function copyNameFor(tool, entry, name) {
    var taken = {};
    localItems(entry).forEach(function (it) { taken[it.name] = true; });
    ((plans[tool] && plans[tool].rows) || []).forEach(function (r) { if (r.kind === entry.kind) taken[r.name] = true; });
    var base = t('shared.cloud.copy_suffix', '{name} (cloud copy)', { name: name });
    if (!taken[base]) return base;
    for (var n = 2; n < 1000; n++) {
      var c = t('shared.cloud.copy_suffix_n', '{name} (cloud copy {n})', { name: name, n: n });
      if (!taken[c]) return c;
    }
    return base + ' ' + Date.now();
  }
  // Keep both: the cloud version gets its new name in the account first, then this device's version goes
  // over the original row (only if it is still the listed one), then the copy lands on this device and is
  // read back. A refusal at the first step writes nothing anywhere; one at the second removes the copy it
  // just made — so every device ends with both versions, nothing is lost, and it converges in one click.
  function actKeepBoth(tool, row) {
    var uid = ensureUser();
    return cloudLoad(row.cloud.id).then(function (full) {
      if (!validateShape(row.entry, full.data)) throw makeError('shape');
      flushPage(tool);
      var it = localItem(row.entry, row.name);
      return assertLocalAsPlanned(row, it).then(function () {
        if (!it) throw makeError('changed_here');
        var copyName = copyNameFor(tool, row.entry, row.name);
        var theirs = project(row.entry, full.data);
        var mine = project(row.entry, it.value);
        var g = guardUpload(row.entry, copyName, theirs) || guardUpload(row.entry, row.name, mine);
        if (g) throw g;
        return Promise.all([hashItem(row.entry, full.data), hashText(canonJson(mine))]).then(function (hs) {
          var hc = hs[0], h = hs[1];
          return cloudInsert(row.entry, copyName, theirs, hc).catch(function (err) { if (err && err.code === '23505') throw makeError('changed'); throw err; })
            .then(function (copyRow) {
              return cloudUpdateIf(full.id, full.updated_at, mine, h)
                .catch(function (err) { return cloudRemove(copyRow.id).catch(noop).then(function () { throw err; }); })
                .then(function (saved) {
                  remember(uid, tool, row.kind, row.name, h, saved);
                  return localWrite(row.entry, copyName, restoreOmitted(row.entry, full.data, it.value))
                    .then(function () { return settleLocalWrite(tool, uid, row.entry, copyName, { id: copyRow.id, updated_at: copyRow.updated_at, data: theirs }); });
                });
            });
        }).then(function () { return { action: 'keepBoth', row: row, copy: copyName }; });
      });
    });
  }
  // "Delete from cloud" leaves a tombstone in the memory when a copy stays on this device, so that copy
  // reads "Removed from your account" and is not uploaded again unless it changes or the person asks.
  function actDelete(tool, row) {
    var uid = ensureUser();
    flushPage(tool);
    var it = localItem(row.entry, row.name);
    return (it ? hashItem(row.entry, it.value) : Promise.resolve(null)).then(function (h) {
      return cloudRemove(row.cloud.id).then(function () {
        if (stillMe(uid)) { if (h) metaSet(uid, tool, row.kind, row.name, { deletedCloud: true, h: h, at: now() }); else metaDelete(uid, tool, row.kind, row.name); }
        return { action: 'delete', row: row };
      });
    });
  }
  // An .ivrit file of the cloud copy: an AllTools-shaped bundle when the entry names its bundle key.
  function ivritFile(entry, name, data) {
    var payload;
    if (entry.shape === 'map') { payload = {}; payload[name] = data; }
    else if (entry.shape === 'mapIn') { payload = safeAssign({}, entry.envelope || {}); payload[entry.path] = {}; payload[entry.path][name] = data; }
    else if (entry.shape === 'scalar') payload = data.value;
    else payload = data;
    var bundle = {};
    bundle[entry.ivritKey || entry.kind] = payload;
    // partial: the account's copy of one item — merged into what the device holds, never replacing it
    return { _ivritSuite: 1, format: 'ivrit-save', version: 1, tool: entry.ivritKey ? 'AllTools' : entry.tool, partial: true, savedAt: now(), data: bundle };
  }
  // One tool's cloud rows folded into the AllTools bundle shape the hub imports: a map kind becomes
  // {name: value}, a mapIn kind its envelope + {path: {id: value}}, a single/tree its value, a scalar the
  // plain value. Rows of a kind this build's registry does not know (saved by a newer version) come back
  // separately as `unknown`, so a backup still carries them. Pure.
  function bundleFromRows(entries, rows) {
    var out = {}, n = 0, known = {};
    entries.forEach(function (e) { known[e.kind] = true; });
    var unknown = rows.filter(function (r) { return !known[r.kind] && !badName(r.name) && KIND_RE.test(String(r.kind || '')); })
                      .map(function (r) { return { tool: r.tool, kind: r.kind, name: r.name, data: r.data }; });
    entries.forEach(function (e) {
      var mine = rows.filter(function (r) { return r.kind === e.kind && !badName(r.name); });
      if (!mine.length) return;
      var key = e.ivritKey || e.kind;
      if (e.shape === 'map') { out[key] = {}; mine.forEach(function (r) { out[key][r.name] = r.data; n++; }); }
      else if (e.shape === 'mapIn') { out[key] = safeAssign({}, e.envelope || {}); out[key][e.path] = {}; mine.forEach(function (r) { out[key][e.path][r.name] = r.data; n++; }); }
      else if (e.shape === 'scalar') { out[key] = isPlainObject(mine[0].data) ? mine[0].data.value : mine[0].data; n++; }
      else { out[key] = mine[0].data; n++; }
    });
    return { data: out, count: n, unknown: unknown };
  }
  function downloadJson(obj, name) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.parentNode.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function fileStem(s) { return String(s).replace(/[^\w֐-׿.-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'item'; }
  function actDownloadFile(tool, row) {
    ensureUser();
    return cloudLoad(row.cloud.id).then(function (full) {
      downloadJson(ivritFile(row.entry, row.name, full.data), fileStem(row.entry.tool + '_' + row.kind + '_' + row.name) + '.ivrit');
      return { action: 'file', row: row };
    });
  }
  function runAction(tool, action, row) {
    return Promise.resolve().then(function () {
      if (action === 'upload') return actUpload(tool, row);
      if (action === 'keepMine') return actUpload(tool, row, true);
      if (action === 'download') return actDownload(tool, row);
      if (action === 'merge') return actMerge(tool, row);
      if (action === 'useCloud') return actUseCloud(tool, row);
      if (action === 'keepBoth') return actKeepBoth(tool, row);
      if (action === 'delete' || action === 'deleteCloud') return actDelete(tool, row);
      if (action === 'file') return actDownloadFile(tool, row);
      throw makeError('bad_action', 'IvritSaves: unknown action ' + action);
    });
  }

  /* ---------- trees follow their items (fact 3) ---------- */
  function treeIsFlat(tree) { return !tree.root.some(function (n) { return isPlainObject(n) && n.t === 'folder'; }); }
  // Runs after the items of `entry.follows` were dealt with. While any of them is still only in the cloud
  // the tree is left alone on both sides (the page would prune its names); otherwise: a flat local tree
  // takes the cloud's folders wholesale, two real trees go through the page's additive merge, and the
  // result lands on whichever side differs.
  // Resolves to whether the tree changed on either side. The classify rule, for trees, through the sync
  // memory: an unchanged side takes the other's tree; two changed sides (or no memory yet) merge through
  // the page's pure helper — folders by name, an item once, filed beats unfiled, this device's placement
  // when both file it — and the merge goes up, so the other device then reads "cloud changed" and takes
  // it: one round, and both hold the same tree.
  function syncTree(tool, entry, p) {
    var uid = ensureUser();
    var cfg = pages[tool] || {};
    var helper = cfg.merges && cfg.merges[entry.kind];
    var cloudRow = treeRowOf(entry, p.cloudRows), local = localTree(entry);
    if (!local && !cloudRow) return Promise.resolve(false);
    if (p.rows.some(function (r) { return r.kind === entry.follows && r.state === 'cloud-only'; })) return Promise.resolve(false);
    var mem = metaGet(uid, tool, entry.kind, DEFAULT_NAME);
    var cloudSame = !!(mem && cloudRow && mem.id === cloudRow.id && mem.u === cloudRow.updated_at);
    return (local ? hashItem(entry, local) : Promise.resolve(null)).then(function (localHash) {
      var localSame = !!(mem && localHash && localHash === mem.h);
      if (localSame && cloudSame) return false;   // neither side moved since this device last synced the tree
      if (!cloudRow) {
        // nothing in the account yet: this device's folders go up as they are
        var g = guardUpload(entry, DEFAULT_NAME, local);
        if (g) throw g;
        return cloudInsert(entry, DEFAULT_NAME, local, localHash).then(function (saved) { remember(uid, tool, entry.kind, DEFAULT_NAME, localHash, saved); return true; });
      }
      return cloudLoad(cloudRow.id).then(function (full) {
        if (!validateShape(entry, full.data)) throw makeError('shape');
        var cloud = full.data, merged;
        if (!local || localSame || treeIsFlat(local)) merged = cloud;
        else if (cloudSame) merged = local;
        else if (typeof helper === 'function') { merged = helper(clone(local), clone(cloud)); if (!validateShape(entry, merged)) merged = local; }
        else { warn('no merge helper for tree kind', entry.kind, '— the cloud folders were not merged'); merged = local; }
        // The store then holds the merged tree and the tail compares it with the account: the page's own
        // re-render may still reorder or prune it, and what the store holds afterwards is what goes up.
        if (local && canonJson(merged) === canonJson(local)) return reconcileStore(tool, uid, entry, DEFAULT_NAME, full).then(function (r) { return r.pushed; });
        flushPage(tool);
        return localWrite(entry, DEFAULT_NAME, merged).then(function () { return settleLocalWrite(tool, uid, entry, DEFAULT_NAME, full); }).then(function () { return true; });
      });
    });
  }
  // Every tree of the tool follows its items, after the plan they follow was made; resolves to how many changed.
  function syncTrees(tool, p) {
    var trees = registryFor(tool).filter(function (e) { return e.shape === 'tree'; }), n = 0;
    if (!trees.length || !p.userId) return Promise.resolve(0);
    return seqMap(trees, function (e) { return syncTree(tool, e, p).then(function (changed) { if (changed) n++; }); }).then(function () { return n; });
  }
  // Errors that belong to one row — the guard's refusals, a malformed cloud copy, a page with no merge
  // helper, a row that moved between the listing and the action, a page hook that failed — skip that row;
  // the run goes on and names it. Anything else (the connection, the session, the device's storage, the
  // server) stops the tool, and re-running resumes.
  var ROW_ERRORS = { too_big: true, name: true, chars: true, shape: true, no_merge: true, changed: true, changed_here: true, hook: true };
  function isRowError(err) { return !!(err && ROW_ERRORS[String(err.code)]); }
  // Errors that would fail every tool the same way: a bulk run does not go on to the next tool.
  function isConnectionError(err) {
    var code = String((err && err.code) || ''), st = err && (err.status || err.statusCode), lower = String((err && err.message) || '').toLowerCase();
    return code === 'offline' || code === 'blocked' || code === 'disabled' || code === 'signed_out' || code === 'PGRST301' || st === 401 || /jwt/.test(lower)
      || code === 'PGRST204' || code === 'PGRST205' || code === '42P01' || /failed to fetch|networkerror|load failed|network request failed/.test(lower);
  }
  // The few words after a skipped row's name.
  function skipReason(err) {
    var code = String((err && err.code) || '');
    if (code === 'too_big') return t('shared.cloud.skip_too_big', 'too big for the cloud');
    if (code === 'name') return t('shared.cloud.skip_name', 'invalid name');
    if (code === 'chars') return t('shared.cloud.skip_chars', 'characters the cloud cannot store');
    if (code === 'shape') return t('shared.cloud.skip_shape', 'unexpected shape in the cloud copy');
    if (code === 'no_merge') return t('shared.cloud.skip_no_merge', 'this page cannot merge it');
    if (code === 'changed' || code === 'changed_here') return t('shared.cloud.skip_changed', 'changed meanwhile');
    if (code === 'hook') return t('shared.cloud.skip_hook', 'this page could not show it');
    return errorText(err);
  }
  function noteSkip(sum, row, err) { sum.skipped++; sum.skips.push({ name: row.label, why: skipReason(err) }); }
  // The finishing line's tail naming the skipped rows ('' when none), and the note for a failed tree pass.
  function skippedText(skips) {
    if (!skips || !skips.length) return '';
    var list = skips.map(function (s) { return t('shared.cloud.skipped_item', '{name} ({why})', { name: s.name, why: s.why }); }).join(', ');
    return ' ' + t('shared.cloud.sync_skipped_named', '{n} skipped: {list}.', { n: skips.length, list: list });
  }
  function foldersText(err) { return err ? ' ' + t('shared.cloud.folders_error', 'The folder layout was not synced: {reason}', { reason: errorText(err) }) : ''; }
  // The re-listing and the tree pass that end every run: a failed listing is the run's stop, a failed tree
  // pass is noted beside the result, and the tool's latest plan comes back either way.
  function finishRun(tool, p, sum) {
    return planTool(tool).then(function (p2) {
      return syncTrees(tool, p2).then(function (n) { if (n) sum.merged = (sum.merged || 0) + n; }, function (err) { sum.treeError = err; }).then(function () { return p2; });
    }, function (err) { if (!sum.error) sum.error = err; return p; });
  }
  function syncNowInner(tool) {
    return planTool(tool).then(function (p) {
      // Downloads and merges first, uploads after: what lands may change this device (a same-named class
      // folds into the one that arrived), and an upload of an item that is then gone is skipped quietly.
      var todo = p.rows.filter(function (r) { return r.safeAction && r.safeAction !== 'upload'; })
                 .concat(p.rows.filter(function (r) { return r.safeAction === 'upload'; }));
      var sum = { tool: tool, done: 0, total: todo.length, up: 0, down: 0, merged: 0, skipped: 0, skips: [], left: 0, error: null, treeError: null };
      return seqMap(todo, function (row) {
        if (row.safeAction === 'upload' && !localItem(row.entry, row.name)) { sum.total--; return Promise.resolve(); }   // gone meanwhile (folded into another item): nothing to send
        return runAction(tool, row.safeAction, row).then(function (res) {
          sum.done++;
          if (res && res.hint) sum.hint = true;
          if (row.safeAction === 'upload') sum.up++; else if (row.safeAction === 'download') sum.down++; else sum.merged++;
        }, function (err) { if (!isRowError(err)) throw err; noteSkip(sum, row, err); });
      }).catch(function (err) { sum.error = err; })
        .then(function () { return finishRun(tool, p, sum); })
        .then(function (p2) { sum.left = p2.counts.conflicts; return sum; });
    });
  }

  // The account screen's "Upload everything on this device": every upload the plan calls safe, nothing else.
  function uploadAllInner(tool) {
    return planTool(tool).then(function (p) {
      var todo = p.rows.filter(function (r) { return r.safeAction === 'upload'; });
      var sum = { tool: tool, done: 0, total: todo.length, skipped: 0, skips: [], error: null, treeError: null };
      return seqMap(todo, function (row) {
        return actUpload(tool, row).then(function () { sum.done++; }, function (err) { if (!isRowError(err)) throw err; noteSkip(sum, row, err); });
      }).catch(function (err) { sum.error = err; })
        .then(function () { return finishRun(tool, p, sum); })
        .then(function () { return sum; });
    });
  }
  function toolsWithEntries() { return TOOLS.filter(function (tool) { return registryFor(tool).length > 0; }); }
  function toolName(tool) { var n = TOOL_NAMES[tool]; return n ? t(n[0], n[1]) : tool; }
  // What every tool holds, for the account screen: listings run one at a time through each tool's queue.
  function accountSummary() {
    return seqMap(toolsWithEntries(), function (tool) {
      return enqueue(tool, function () { return planTool(tool); }).then(function (p) {
        render(tool);
        var up = 0, cloudOnly = 0, conflicts = 0, settings = 0, deleted = 0, lastSaved = null;
        p.rows.forEach(function (r) {
          if (r.safeAction === 'upload') up++;
          else if (r.state === 'cloud-only') cloudOnly++;
          else if (r.state === 'deleted-here') deleted++;
          else if (r.state === 'conflict' && !r.safeAction) { conflicts++; if (isSettingsChoice(r)) settings++; }
        });
        (p.cloudRows || []).forEach(function (r) { if (r.updated_at && (!lastSaved || r.updated_at > lastSaved)) lastSaved = r.updated_at; });
        return { tool: tool, name: toolName(tool), total: p.rows.length, cloud: (p.cloudRows || []).length, safe: p.counts.safe, up: up, cloudOnly: cloudOnly, conflicts: conflicts, settings: settings, deleted: deleted, folders: (p.treesDiffer || []).length, lastSaved: lastSaved };
      });
    });
  }
  // Another module (the Font Maker's projects) adds one line to the account screen's list: a function
  // returning a string or a promise of one; an empty string or a failure adds nothing.
  var summaryHooks = [];
  function registerSummary(fn) { if (typeof fn === 'function' && summaryHooks.indexOf(fn) < 0) summaryHooks.push(fn); }
  function summaryLines() {
    var out = [];
    return seqMap(summaryHooks, function (fn) {
      return Promise.resolve().then(fn).then(function (text) { if (text) out.push(String(text)); }, function (err) { warn('summary hook failed:', err); });
    }).then(function () { return out; });
  }
  // Does this device hold anything the registry knows about? (No network; decides whether the account
  // screen introduces itself after the first sign-in.)
  function deviceHasItems() {
    return toolsWithEntries().some(function (tool) {
      return registryFor(tool).some(function (e) { return e.shape !== 'tree' && localItems(e).length > 0; });
    });
  }
  // Everything in the account as one AllTools-shaped .ivrit object (the hub's Import / Export modal restores
  // it): the account screen downloads it as a file, the account page puts it in the download-everything zip.
  // The account's every row as one AllTools-shaped file. `partial`: it holds the account's copies only (the
  // per-device fields a settings row omits are not in it), so the hub merges it and never replaces anything.
  // Rows of a kind this build does not know ride along under `cloudUnknown` for a newer build to import.
  function bundleAll() {
    var bundle = {}, count = 0, unknown = [];
    return seqMap(toolsWithEntries(), function (tool) {
      return cloudListFull(tool).then(function (rows) {
        var b = bundleFromRows(registryFor(tool), rows);
        safeAssign(bundle, b.data);
        count += b.count + b.unknown.length;
        unknown = unknown.concat(b.unknown);
      });
    }).then(function () {
      if (unknown.length) bundle.cloudUnknown = unknown;
      return { file: { _ivritSuite: 1, format: 'ivrit-save', version: 1, tool: 'AllTools', partial: true, savedAt: now(), data: bundle }, count: count };
    });
  }
  function accountBackup() {
    return bundleAll().then(function (b) {
      downloadJson(b.file, 'IvritSuite_account_backup_' + now().slice(0, 10) + '.ivrit');
      return b.count;
    });
  }
  // What the account holds, tool by tool, without the data (the account page's listing): per kind a count, the
  // bytes, and the names where a row's name is the item's own (a preset, a deck, a student profile — not a
  // word list or class list, whose row name is an id). Folder trees count in the totals but are not listed.
  function inventory() {
    return seqMap(toolsWithEntries(), function (tool) {
      return cloudList(tool).then(function (rows) {
        var kinds = [], count = 0, bytes = 0, known = {};
        registryFor(tool).forEach(function (e) { known[e.kind] = true; });
        var unknown = rows.filter(function (r) { return !known[r.kind]; }).length;   // saved by a newer version of the site
        registryFor(tool).forEach(function (e) {
          var mine = rows.filter(function (r) { return r.kind === e.kind; });
          if (!mine.length) return;
          var b = 0; mine.forEach(function (r) { b += Number(r.bytes || 0); });
          bytes += b; count += mine.length;
          if (e.shape === 'tree') return;
          var named = e.shape === 'map' || (e.shape === 'mapIn' && !e.nameField);
          kinds.push({ kind: e.kind, label: kindLabel(e), count: mine.length, bytes: b, names: named ? mine.map(function (r) { return r.name; }) : [] });
        });
        return { tool: tool, name: toolName(tool), kinds: kinds, count: count, bytes: bytes, unknown: unknown };
      });
    });
  }
  // After the account was deleted: drop what this device remembered about it (the sync memory and the welcome
  // mark). Never touches a tool's own keys.
  function forgetUser(uid) {
    if (!uid) return;
    var m = metaAll();
    if (isPlainObject(m.users)) delete m.users[uid];
    if (isPlainObject(m.welcomed)) delete m.welcomed[uid];
    metaSave(m);
  }

  /* ---------- queue ---------- */
  function enqueue(tool, fn) {
    var q = queues[tool] || Promise.resolve();
    var run = q.then(function () { busy[tool] = true; render(tool); return fn(); });
    var settled = run.then(function (v) { busy[tool] = false; return v; }, function (e) { busy[tool] = false; throw e; });
    queues[tool] = settled.catch(function () {});
    return settled;
  }

  /* ---------- the panel ---------- */
  var STYLE_ID = 'ivsav-style';
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '.ivsav{font-family:inherit;color:var(--text,#1a2744);}' +
      '.ivsav-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-block-end:6px;}' +
      '.ivsav-title{font-weight:700;flex:1 1 auto;}' +
      '.ivsav-btn{padding:5px 10px;border:1px solid var(--border,#c8bfa8);border-radius:6px;background:var(--white,#fff);color:inherit;' +
        'font-family:inherit;font-size:0.8rem;line-height:1.3;cursor:pointer;}' +
      '.ivsav-btn:hover{background:var(--warm-gray,#e8e0d0);}' +
      'body.dark .ivsav-btn:hover{background:#2a3349;}' +
      '.ivsav-btn:focus-visible{outline:2px solid var(--gold,#c9922a);outline-offset:1px;}' +
      '.ivsav-btn[aria-disabled="true"]{opacity:.55;cursor:default;}' +
      '.ivsav-btn.ivsav-primary{border-color:var(--gold,#c9922a);font-weight:600;}' +
      '.ivsav-status{margin:4px 0 8px;font-size:0.82rem;color:var(--muted,#6b6050);min-block-size:1.2em;overflow-wrap:anywhere;}' +
      '.ivsav-status.is-error{color:var(--danger-text,#b3261e);}' +
      '.ivsav-note{margin:6px 0;font-size:0.85rem;overflow-wrap:anywhere;}' +
      '.ivsav-list{list-style:none;margin:0;padding:0;}' +
      '.ivsav-kind{margin-block:10px 4px;font-size:0.74rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted,#6b6050);}' +
      '.ivsav-note-row{margin-block:2px 8px;font-size:0.8rem;color:var(--muted,#6b6050);overflow-wrap:anywhere;}' +
      '.ivsav-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:6px 8px;margin-block:3px;border:1px solid var(--border,#c8bfa8);' +
        'border-radius:6px;background:var(--white,#fff);}' +
      '.ivsav-main{flex:1 1 180px;min-inline-size:0;}' +
      '.ivsav-name{font-weight:600;overflow-wrap:anywhere;}' +
      '.ivsav-state{display:inline-block;margin-inline-start:6px;padding:1px 7px;border-radius:999px;font-size:0.72rem;font-weight:600;' +
        'background:var(--warm-gray,#e8e0d0);color:var(--text,#1a2744);white-space:nowrap;}' +
      '.ivsav-row[data-state="synced"] .ivsav-state{background:#dff2e1;color:#1b5e20;}' +
      '.ivsav-row[data-state="conflict"] .ivsav-state{background:#fde7e7;color:#8a1c1c;}' +
      '.ivsav-row[data-state="cloud-changed"] .ivsav-state,.ivsav-row[data-state="cloud-only"] .ivsav-state{background:#e3ecfa;color:#1a3d7a;}' +
      '.ivsav-row[data-state="local-changed"] .ivsav-state,.ivsav-row[data-state="local-only"] .ivsav-state{background:#fbf0d9;color:#6b4a00;}' +
      '.ivsav-row[data-state="deleted-here"] .ivsav-state,.ivsav-row[data-state="cloud-deleted"] .ivsav-state{background:#ececec;color:#555;}' +
      'body.dark .ivsav-row[data-state="deleted-here"] .ivsav-state,body.dark .ivsav-row[data-state="cloud-deleted"] .ivsav-state{background:#3a3a3a;color:#ddd;}' +
      'body.dark .ivsav-row[data-state="synced"] .ivsav-state{background:#1f4d2a;color:#c9f0cf;}' +
      'body.dark .ivsav-row[data-state="conflict"] .ivsav-state{background:#5a2323;color:#ffd6d6;}' +
      'body.dark .ivsav-row[data-state="cloud-changed"] .ivsav-state,body.dark .ivsav-row[data-state="cloud-only"] .ivsav-state{background:#23385c;color:#d6e4ff;}' +
      'body.dark .ivsav-row[data-state="local-changed"] .ivsav-state,body.dark .ivsav-row[data-state="local-only"] .ivsav-state{background:#5a4416;color:#ffe9b8;}' +
      '.ivsav-meta{flex:1 1 140px;font-size:0.75rem;color:var(--muted,#6b6050);}' +
      '.ivsav-actions{display:flex;flex-wrap:wrap;gap:4px;}' +
      '.ivsav-actions .ivsav-btn{font-size:0.75rem;padding:3px 8px;}' +
      '.ivsav-overlay{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.45);}' +
      '.ivsav-card{box-sizing:border-box;inline-size:100%;max-inline-size:540px;max-block-size:90vh;overflow:auto;padding:16px 18px;border:1px solid var(--border,#c8bfa8);' +
        'border-radius:10px;background:var(--white,#fff);color:var(--text,#1a2744);box-shadow:0 10px 30px rgba(0,0,0,.25);font-family:inherit;}' +
      '.ivsav-card-head{display:flex;align-items:center;gap:8px;}' +
      '.ivsav-card-title{flex:1 1 auto;margin:0;font-size:1.1rem;}' +
      '.ivsav-card h3{margin:14px 0 4px;font-size:0.76rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted,#6b6050);}' +
      '.ivsav-card p{margin:6px 0;font-size:0.9rem;line-height:1.45;}' +
      '.ivsav-card ul{margin:4px 0 8px;padding-inline-start:18px;font-size:0.9rem;line-height:1.5;}' +
      '.ivsav-card .ivsav-btn{margin:4px 0;margin-inline-end:6px;font-size:0.88rem;padding:7px 12px;}' +
      '.ivsav-card .ivsav-status{margin:8px 0 0;}' +
      '.ivsav-acct-manage{display:inline-block;margin-block:6px 2px;font-size:0.9rem;color:var(--gold-text,#7f5a13);}' +
      '@media (prefers-reduced-motion: reduce){.ivsav,.ivsav *{transition-duration:0.001ms!important;animation-duration:0.001ms!important;}}';
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function button(label, cls, onClick) {
    var b = el('button', 'ivsav-btn' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.addEventListener('click', function () { if (b.getAttribute('aria-disabled') === 'true') return; onClick(); });
    return b;
  }
  function locale() { try { var l = window.I18n && window.I18n.lang; return l === 'he' ? 'he-IL' : (l || undefined); } catch (e) { return undefined; } }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return String(iso).slice(0, 16).replace('T', ' '); }
  }
  function fmtKb(bytes) { return t('shared.cloud.size_kb', '{kb} KB', { kb: Math.max(1, Math.round((bytes || 0) / 1024)) }); }
  function stateText(state) {
    if (state === 'local-only') return t('shared.cloud.state_local_only', 'Only on this device');
    if (state === 'cloud-only') return t('shared.cloud.state_cloud_only', 'Only in the cloud');
    if (state === 'synced') return t('shared.cloud.state_synced', 'Same');
    if (state === 'cloud-changed') return t('shared.cloud.state_cloud_changed', 'Newer in the cloud');
    if (state === 'local-changed') return t('shared.cloud.state_local_changed', 'Newer on this device');
    if (state === 'deleted-here') return t('shared.cloud.state_deleted_here', 'Deleted on this device');
    if (state === 'cloud-deleted') return t('shared.cloud.state_cloud_deleted', 'Removed from your account');
    return t('shared.cloud.state_conflict', 'Changed in both places');
  }
  function actionText(action, state) {
    if (action === 'upload') return state === 'cloud-deleted' ? t('shared.cloud.upload_again', 'Upload again') : t('shared.cloud.upload', 'Upload');
    if (action === 'download') return state === 'deleted-here' ? t('shared.cloud.bring_back', 'Bring it back') : t('shared.cloud.download', 'Download');
    if (action === 'deleteCloud') return t('shared.cloud.delete_cloud_too', 'Delete from your account too');
    if (action === 'merge') return t('shared.cloud.merge', 'Merge');
    if (action === 'keepBoth') return t('shared.cloud.keep_both', 'Keep both');
    if (action === 'useCloud') return t('shared.cloud.use_cloud', 'Use cloud copy');
    if (action === 'keepMine') return t('shared.cloud.keep_mine', 'Keep mine');
    return action;
  }
  // After the suite-wide preferences changed: the fields that only show after a reload.
  function suiteHintText(hint) { return hint ? ' ' + t('shared.cloud.suite_reload_hint', 'Reload open pages to see the font, keyboard and dictionary preferences.') : ''; }
  function doneText(res) {
    var name = res.row ? res.row.label : '';
    if (res.action === 'upload') return t('shared.cloud.done_upload', 'Uploaded "{name}".', { name: name });
    if (res.action === 'download') {
      var line = res.pushed ? t('shared.cloud.done_download_pushed', 'Downloaded "{name}" and put this device\'s version in your account.', { name: name })
                            : t('shared.cloud.done_download', 'Downloaded "{name}" to this device.', { name: name });
      if (res.row && res.row.entry && res.row.entry.virtual) return line + suiteHintText(res.hint);
      return line + ' ' + t('shared.cloud.reload_hint', 'If this tool is open in other tabs, reload them.');
    }
    if (res.action === 'merge') return t('shared.cloud.done_merge', 'Merged "{name}" on both sides.', { name: name }) + suiteHintText(res.hint);
    if (res.action === 'keepBoth') return t('shared.cloud.done_keep_both', 'Kept both: the cloud version is now "{copy}" on this device.', { copy: res.copy });
    if (res.action === 'delete') return t('shared.cloud.done_delete', 'Deleted "{name}" from the cloud.', { name: name });
    return '';
  }
  function say(tool, text, isError) {
    messages[tool] = text ? { text: text, isError: !!isError } : null;
    var st = panels[tool] && panels[tool].root && panels[tool].root.querySelector('.ivsav-status');
    if (st) { st.textContent = text || ''; st.classList.toggle('is-error', !!isError); }
    // A toast too, so a line inside a collapsed drawer is still seen; an error stays up longer.
    if (text && typeof window.showAppToast === 'function') { try { window.showAppToast(text, isError ? 6000 : undefined); } catch (e) {} }
  }
  function accountState() {
    var a = A();
    if (!a) return 'unavailable';
    var s = a.status();
    if (s === 'signed-in') return 'signed-in';
    if (s === 'loading') return 'loading';
    if (s === 'offline') return 'offline';
    if (s === 'anonymous') return 'anonymous';
    return 'unavailable';
  }
  function render(tool) {
    var panel = panels[tool];
    if (!panel || !panel.root) return;
    var root = panel.root;
    while (root.firstChild) root.removeChild(root.firstChild);
    var cfg = pages[tool] || {};
    var head = el('div', 'ivsav-head');
    if (cfg.title !== false) head.appendChild(el('span', 'ivsav-title', typeof cfg.title === 'string' ? t(cfg.title, 'Cloud saves') : t('shared.cloud.title', 'Cloud saves')));
    var state = accountState();
    var p = plans[tool];
    var isBusy = !!busy[tool];
    if (state === 'signed-in') {
      var refreshBtn = button(t('shared.cloud.refresh', 'Refresh'), '', function () { refresh(tool).catch(noop); });
      head.appendChild(refreshBtn);
      var n = p ? p.counts.safe : 0;
      var syncBtn = button(n ? t('shared.cloud.sync_count', 'Sync now ({n})', { n: n }) : t('shared.cloud.sync', 'Sync now'), 'ivsav-primary', function () { syncNow(tool).catch(noop); });
      if (!n) syncBtn.setAttribute('aria-disabled', 'true');
      head.appendChild(syncBtn);
    }
    if (head.firstChild) root.appendChild(head);   // signed out with title:false there is nothing to show up here
    var status = el('p', 'ivsav-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    var msg = messages[tool];
    if (isBusy) status.textContent = t('shared.cloud.working', 'Working…');
    else if (msg) { status.textContent = msg.text; if (msg.isError) status.classList.add('is-error'); }
    root.appendChild(status);

    if (state !== 'signed-in') {
      var note = el('p', 'ivsav-note');
      if (state === 'anonymous') {
        note.textContent = t('shared.cloud.signed_out', 'Sign in to keep copies of your saved items in the cloud and get them back on any device.');
        root.appendChild(note);
        root.appendChild(button(t('shared.cloud.sign_in', 'Sign in'), 'ivsav-primary', function () {
          var a = A();
          if (!(a && typeof a.openMenu === 'function' && a.openMenu())) say(tool, t('shared.cloud.signed_out', 'Sign in to keep copies of your saved items in the cloud and get them back on any device.'), false);
        }));
      } else if (state === 'loading') {
        note.textContent = t('shared.cloud.loading', 'Checking your account…');
        root.appendChild(note);
      } else if (state === 'offline') {
        note.textContent = t('shared.cloud.offline', 'Cloud saves need an internet connection. Your local saves still work.');
        root.appendChild(note);
      } else {
        note.textContent = t('shared.cloud.unavailable', 'Cloud saves are unavailable right now. Your local saves still work.');
        root.appendChild(note);
      }
      return;
    }
    if (!p) { status.textContent = t('shared.cloud.listing', 'Loading your cloud saves…'); return; }
    var list = el('ul', 'ivsav-list');
    list.setAttribute('aria-label', t('shared.cloud.list_aria', 'Saved items on this device and in the cloud'));
    var treesDiffer = p.treesDiffer || [];
    if (!p.rows.length && !treesDiffer.length) {
      root.appendChild(el('p', 'ivsav-note', t('shared.cloud.empty', 'Nothing saved yet. Items you save in this tool will appear here.')));
      return;
    }
    // A folder tree that differs is not a row: it is a note under the group of the kind it follows.
    var treeNote = {};
    treesDiffer.forEach(function (kind) { var e = entryFor(tool, kind); treeNote[(e && e.follows) || kind] = true; });
    function noteFor(kind) {
      if (!treeNote[kind]) return;
      delete treeNote[kind];
      list.appendChild(el('li', 'ivsav-note-row', t('shared.cloud.folders_differ', 'Folder layout: different here and in your account — Sync now merges it.')));
    }
    var lastKind = null;
    p.rows.forEach(function (row) {
      if (row.kind !== lastKind) {
        if (lastKind) noteFor(lastKind);
        lastKind = row.kind;
        // a group header only where a kind can hold many rows; a settings / streak row already reads as its kind
        if (row.entry.shape === 'map' || row.entry.shape === 'mapIn') list.appendChild(el('li', 'ivsav-kind', kindLabel(row.entry)));
      }
      var li = el('li', 'ivsav-row');
      li.setAttribute('data-state', row.state);
      var main = el('div', 'ivsav-main');
      main.appendChild(el('span', 'ivsav-name', row.label));
      main.appendChild(el('span', 'ivsav-state', stateText(row.state)));
      li.appendChild(main);
      var metaBits = [];
      if (row.cloud) metaBits.push(fmtKb(row.cloud.bytes), t('shared.cloud.updated', 'Updated {date}', { date: fmtDate(row.cloud.updatedAt) }));
      else if (row.local) metaBits.push(fmtKb(row.local.bytes));
      li.appendChild(el('div', 'ivsav-meta', metaBits.join(' · ')));
      var actions = el('div', 'ivsav-actions');
      row.choices.forEach(function (action) {
        var b = button(actionText(action, row.state), action === row.safeAction || action === 'keepBoth' ? 'ivsav-primary' : '', function () {
          if (action === 'deleteCloud' && !window.confirm(t('shared.cloud.delete_cloud_too_confirm', 'Delete "{name}" from your account too? It is already gone from this device, so this removes the last copy.', { name: row.label }))) return;
          act(tool, action, row).catch(noop);
        });
        if (isBusy) b.setAttribute('aria-disabled', 'true');
        actions.appendChild(b);
      });
      if (row.cloud) {
        var fileBtn = button(t('shared.cloud.download_json', 'Download file'), '', function () { act(tool, 'file', row).catch(noop); });
        if (isBusy) fileBtn.setAttribute('aria-disabled', 'true');
        actions.appendChild(fileBtn);
        if (row.state !== 'deleted-here') {   // that row's own choice button is the delete
          var delBtn = button(t('shared.cloud.delete', 'Delete from cloud'), '', function () {
            if (!window.confirm(t('shared.cloud.delete_confirm', 'Delete "{name}" from your account? The copy on this device stays and is not uploaded again unless you change it or press Upload again.', { name: row.label }))) return;
            act(tool, 'delete', row).catch(noop);
          });
          if (isBusy) delBtn.setAttribute('aria-disabled', 'true');
          actions.appendChild(delBtn);
        }
      }
      li.appendChild(actions);
      list.appendChild(li);
    });
    if (lastKind) noteFor(lastKind);
    Object.keys(treeNote).forEach(noteFor);
    root.appendChild(list);
    if (p.counts.safe === 0 && p.counts.conflicts === 0 && !p.counts.deleted && !msg && !isBusy) status.textContent = t('shared.cloud.all_synced', 'Everything is in sync.');
  }
  // One row action, from a panel button or a page's own control: resolves with { action, row, copy? },
  // rejects with the mapped error after the status line has shown it (a "changed meanwhile" re-lists first).
  function act(tool, action, row) {
    say(tool, '', false);
    return enqueue(tool, function () {
      return runAction(tool, action, row).then(function (res) {
        return planTool(tool).then(function (p) { return syncTrees(tool, p).catch(function (err) { res.treeError = err; }); }).then(function () { return res; });
      }).catch(function (err) {
        if (err && (err.code === 'changed' || err.code === 'changed_here')) return planTool(tool).catch(noop).then(function () { throw err; });
        throw err;
      });
    }).then(function (res) {
      say(tool, doneText(res) + foldersText(res.treeError), false);
      render(tool);
      return res;
    }, function (err) {
      say(tool, errorText(err), true);
      render(tool);
      throw err;
    });
  }
  // One listing serves every caller that asks while it is queued or running (sign-in, Refresh, other tabs).
  function refresh(tool) {
    if (pendingRefresh[tool]) return pendingRefresh[tool];
    say(tool, '', false);
    var p = enqueue(tool, function () { return planTool(tool); }).then(function (plan) { render(tool); return plan; }, function (err) { say(tool, errorText(err), true); render(tool); throw err; });
    pendingRefresh[tool] = p;
    p.then(function () { delete pendingRefresh[tool]; }, function () { delete pendingRefresh[tool]; });
    return p;
  }
  function syncNow(tool) {
    say(tool, '', false);
    return enqueue(tool, function () { return syncNowInner(tool); }).then(function (sum) {
      var tail = skippedText(sum.skips) + foldersText(sum.treeError) + suiteHintText(sum.hint);
      if (sum.error) say(tool, t('shared.cloud.sync_stopped', 'Stopped after {done} of {total}: {reason}', { done: sum.done, total: sum.total, reason: errorText(sum.error) }) + tail, true);
      else say(tool, t('shared.cloud.done_sync', 'Sync finished: {up} uploaded, {down} downloaded, {merged} merged, {left} still need a choice.', { up: sum.up, down: sum.down, merged: sum.merged, left: sum.left }) + tail, false);
      render(tool);
      return sum;
    }, function (err) { say(tool, errorText(err), true); render(tool); throw err; });
  }

  /* ---------- the account screen ---------- */
  function closeAccount() {
    if (!account) return;
    var a = account; account = null;
    document.removeEventListener('keydown', a.onKey);
    if (a.root.parentNode) a.root.parentNode.removeChild(a.root);
    if (a.opener && typeof a.opener.focus === 'function') { try { a.opener.focus(); } catch (e) {} }
  }
  function acctSay(text, isError) {
    if (!account) return;
    var st = account.root.querySelector('.ivsav-status');
    if (st) { st.textContent = text || ''; st.classList.toggle('is-error', !!isError); }
  }
  function acctDone(text, isError) { acctSay(text, isError); if (account) account.doneText = text || ''; }   // the line a rebuilt screen keeps
  function acctBusy(on) {
    if (!account) return;
    account.busy = !!on;
    account.root.querySelectorAll('.ivsav-btn[data-act]').forEach(function (b) { if (on) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); });
  }
  // The screen is built in the language of the moment; when a synced preference switches the language
  // (I18n.setLang, live) it is rebuilt in the new one — between runs, keeping its last status line.
  function currentLang() { return (window.I18n && window.I18n.lang) || null; }
  function reopenAccountForLang(doneText) {
    var me = account;
    if (!me) return;
    openAccount({ first: me.first, splash: me.splash, doneText: doneText });
  }
  // A live switch while the screen is idle rebuilds it now; during a run or a listing the rebuild waits for
  // the listing's last line (fillAccount), so nothing transient is carried over.
  function onLangSwitched() {
    if (!account || account.lang === currentLang()) return;
    if (account.busy || account.listing) { account.langStale = true; return; }
    reopenAccountForLang(account.doneText || '');
  }
  // opts.first: the once-per-device introduction right after the first sign-in.
  function openAccount(opts) {
    opts = opts || {};
    closeAccount();
    injectStyle();
    var user = currentUser();
    var overlay = el('div', 'ivsav-overlay');
    var card = el('div', 'ivsav-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('tabindex', '-1');
    var head = el('div', 'ivsav-card-head');
    var title = el('h2', 'ivsav-card-title', opts.first ? t('shared.cloud.acct_welcome_title', 'Welcome! Keep your saved items in your account') : t('shared.cloud.acct_title', 'Your account'));
    if (opts.splash) title.textContent = t('shared.cloud.splash_title', 'Sync settings from your last login?');
    title.id = 'ivsav-acct-title';
    card.setAttribute('aria-labelledby', title.id);
    head.appendChild(title);
    var x = button('✕', '', closeAccount);
    x.setAttribute('aria-label', t('shared.cloud.acct_close', 'Close'));
    head.appendChild(x);
    card.appendChild(head);
    var status = el('p', 'ivsav-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    if (!user) {
      card.appendChild(el('p', 'ivsav-note', t('shared.cloud.signed_out', 'Sign in to keep copies of your saved items in the cloud and get them back on any device.')));
      card.appendChild(button(t('shared.cloud.sign_in', 'Sign in'), 'ivsav-primary', function () { closeAccount(); var a = A(); if (a && typeof a.openMenu === 'function') a.openMenu(); }));
    } else {
      card.appendChild(el('p', 'ivsav-note', t('shared.account.signed_in_as', 'Signed in as {email}', { email: user.email || '' })));
      if (opts.first) card.appendChild(el('p', '', t('shared.cloud.acct_welcome_note', 'This device already has saved items. Copy them to your account and they will be there on any device you sign in on. Nothing is removed from this device.')));
      card.appendChild(el('p', 'ivsav-acct-last', ''));
      card.appendChild(el('h3', '', t('shared.cloud.acct_device_head', 'On this device')));
      var list = el('ul', 'ivsav-acct-list');
      card.appendChild(list);
      var syncBtn = button(t('shared.cloud.acct_sync_all', 'Sync everything'), 'ivsav-primary', function () { syncAll(); });
      syncBtn.setAttribute('data-act', 'sync');
      syncBtn.setAttribute('aria-disabled', 'true');
      syncBtn.hidden = true;
      card.appendChild(syncBtn);
      var uploadBtn = button(t('shared.cloud.acct_upload_all', 'Upload everything on this device'), 'ivsav-primary', function () { uploadAll(); });
      uploadBtn.setAttribute('data-act', 'upload');
      uploadBtn.setAttribute('aria-disabled', 'true');
      card.appendChild(uploadBtn);
      card.appendChild(el('p', 'ivsav-meta', t('shared.cloud.acct_upload_note', 'Your items stay on this device too.')));
      var hint = el('p', 'ivsav-note ivsav-acct-hint', t('shared.cloud.acct_cloud_only_hint', "Items that are only in your account come to this device from a tool's Cloud saves panel (Sync now), or from Import / Export All Settings on the home page."));
      hint.hidden = true;
      card.appendChild(hint);
      // "Settings that differ": a settings blob changed in both places is chosen here for every tool at once.
      var sec = el('div', 'ivsav-acct-settings');
      sec.hidden = true;
      sec.appendChild(el('h3', '', t('shared.cloud.acct_settings_head', 'Settings that differ')));
      sec.appendChild(el('p', 'ivsav-acct-settings-note', ''));
      var useBtn = button(t('shared.cloud.acct_use_account', "Use my account's settings"), 'ivsav-primary', function () { resolveSettings('useCloud'); });
      useBtn.title = t('shared.cloud.acct_use_account_title', "Replace this device's settings with the copy in your account");
      useBtn.setAttribute('data-act', 'use-account');
      sec.appendChild(useBtn);
      var keepBtn = button(t('shared.cloud.acct_keep_device', "Keep this device's settings"), '', function () { resolveSettings('keepMine'); });
      keepBtn.title = t('shared.cloud.acct_keep_device_title', "Put this device's settings in your account instead");
      keepBtn.setAttribute('data-act', 'keep-device');
      sec.appendChild(keepBtn);
      sec.appendChild(el('p', 'ivsav-meta', t('shared.cloud.acct_settings_aside', "Either way, per-device choices stay as they are here: zoom, panel layout, which panels are open, and the Dictionary's sound switch and last search.")));
      card.appendChild(sec);
      var other = el('p', 'ivsav-note ivsav-acct-other', t('shared.cloud.acct_other_conflicts_hint', 'Other items marked "changed in both places" are chosen one by one in that tool\'s Cloud saves panel.'));
      other.hidden = true;
      card.appendChild(other);
      card.appendChild(el('h3', '', t('shared.cloud.acct_backup_head', 'Backups')));
      var dl = button(t('shared.cloud.acct_download_cloud', 'Download everything in your account (.ivrit)'), '', function () { backupAccount(); });
      dl.setAttribute('data-act', 'backup');
      card.appendChild(dl);
      var dev = button(t('shared.cloud.acct_device_backup', 'Back up everything on this device (.ivrit)'), '', function () {
        var fn = null;
        Object.keys(pages).forEach(function (k) { if (!fn && typeof pages[k].deviceBackup === 'function') fn = pages[k].deviceBackup; });
        closeAccount();
        if (fn) { try { fn(); } catch (e) { warn('deviceBackup failed:', e); } }
        else window.location.href = '/index.html?alltools=open';
      });
      card.appendChild(dev);
      card.appendChild(el('p', 'ivsav-meta', t('shared.cloud.acct_download_note', 'Restore a file with Import / Export All Settings on the home page.')));
      var manage = el('a', 'ivsav-acct-manage', t('shared.cloud.acct_manage_link', 'Manage your account: download everything or delete the account…'));
      manage.href = '/account.html';
      card.appendChild(manage);
    }
    card.appendChild(status);
    card.appendChild(button(opts.first ? t('shared.cloud.acct_not_now', 'Not now') : t('shared.cloud.acct_close', 'Close'), '', closeAccount));
    overlay.appendChild(card);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeAccount(); });
    var onKey = function (e) { if (e.key === 'Escape') { e.preventDefault(); closeAccount(); } };
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    account = { root: overlay, opener: document.activeElement, onKey: onKey, first: !!opts.first, splash: !!opts.splash, lang: currentLang(), busy: false, listing: false, langStale: false, doneText: opts.doneText || '' };
    try { card.focus(); } catch (e) {}
    if (user) fillAccount(opts.doneText);
  }
  // doneText (optional): what the status line shows once the listing is in — the finishing line of the
  // action that asked for the re-listing, which would otherwise be wiped by "Checking…".
  function fillAccount(doneText) {
    var me = account;
    if (!me) return Promise.resolve();
    if (me.lang !== currentLang()) { reopenAccountForLang(doneText); return Promise.resolve(); }
    me.listing = true;
    acctSay(t('shared.cloud.acct_checking', 'Checking what is on this device and in your account…'), false);
    return accountSummary().then(function (tools) {
      return summaryLines().then(function (extra) { return { tools: tools, extra: extra }; });
    }).then(function (res) {
      if (account !== me) return;
      var tools = res.tools, extra = res.extra;
      var list = me.root.querySelector('.ivsav-acct-list');
      while (list.firstChild) list.removeChild(list.firstChild);
      var up = 0, cloudOnly = 0, shown = 0, safe = 0, cloud = 0, lastSaved = null, settingsTools = [], others = 0;
      tools.forEach(function (x) {
        safe += x.safe; cloud += x.cloud;
        if (x.lastSaved && (!lastSaved || x.lastSaved > lastSaved)) lastSaved = x.lastSaved;
        if (!x.total && !x.folders) return;
        shown++;
        var bits = [];
        if (x.up) bits.push(t('shared.cloud.acct_tool_up', '{n} not in your account yet', { n: x.up }));
        if (x.cloudOnly) bits.push(t('shared.cloud.acct_tool_cloud_only', '{n} only in your account', { n: x.cloudOnly }));
        if (x.conflicts) bits.push(t('shared.cloud.acct_tool_conflicts', '{n} changed in both places', { n: x.conflicts }));
        if (x.deleted) bits.push(t('shared.cloud.acct_tool_deleted', '{n} deleted on this device — choose in the Cloud saves panel', { n: x.deleted }));
        if (!bits.length && x.folders) bits.push(t('shared.cloud.acct_tool_folders', 'the folder layout differs'));
        if (!bits.length) bits.push(t('shared.cloud.acct_tool_synced', 'everything is in your account'));
        list.appendChild(el('li', '', x.name + ': ' + bits.join(' · ')));
        up += x.up; cloudOnly += x.cloudOnly;
        if (x.settings) settingsTools.push(x.name);
        others += x.conflicts - x.settings;
      });
      extra.forEach(function (text) { list.appendChild(el('li', '', text)); shown++; });
      if (!shown) list.appendChild(el('li', '', t('shared.cloud.acct_nothing', 'Nothing saved on this device or in your account yet.')));
      // The line under the title: when the account was last saved. With an empty account the screen is
      // about moving this device's items up; with a filled one, about syncing — one primary button each.
      var last = me.root.querySelector('.ivsav-acct-last');
      if (last) last.textContent = cloud ? t('shared.cloud.acct_last_saved', 'Your account was last saved on {date}.', { date: fmtDate(lastSaved) }) : t('shared.cloud.acct_no_cloud', 'Nothing is saved in your account yet.');
      var title = me.root.querySelector('.ivsav-card-title');
      if (title && me.splash) title.textContent = cloud ? t('shared.cloud.splash_title', 'Sync settings from your last login?') : t('shared.cloud.acct_welcome_title', 'Welcome! Keep your saved items in your account');
      var sb = me.root.querySelector('.ivsav-btn[data-act="sync"]');
      var b = me.root.querySelector('.ivsav-btn[data-act="upload"]');
      if (sb) { sb.hidden = !cloud; if (safe) sb.removeAttribute('aria-disabled'); else sb.setAttribute('aria-disabled', 'true'); }
      if (b) { b.hidden = !!cloud; if (up) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true'); }
      var hint = me.root.querySelector('.ivsav-acct-hint');
      if (hint) hint.hidden = !cloudOnly;
      var sec = me.root.querySelector('.ivsav-acct-settings');
      if (sec) {
        sec.hidden = !settingsTools.length;
        var note = sec.querySelector('.ivsav-acct-settings-note');
        if (note) note.textContent = t('shared.cloud.acct_settings_note', '{tools}: the settings on this device are not the same as the ones in your account. Choose which to keep.', { tools: settingsTools.join(', ') });
      }
      var other = me.root.querySelector('.ivsav-acct-other');
      if (other) other.hidden = !others;
      me.listing = false;
      acctDone(doneText || '', false);
      if (me.langStale || me.lang !== currentLang()) reopenAccountForLang(doneText || '');   // the language moved while this listing ran
    }).catch(function (err) { if (account === me) { me.listing = false; acctDone(errorText(err), true); } });
  }
  // A bulk run over every tool, one tool at a time. A tool that stops does not end the run unless its error
  // would fail every tool the same way (the connection, the session): the finishing line then names the
  // stop, the counts so far and the tools not reached. Each tool's panel gets its own stop line.
  function newRun() { return { up: 0, down: 0, merged: 0, done: 0, total: 0, left: 0, skips: [], treeError: null, stopped: null, halt: false, notReached: [], hint: false }; }
  function runNote(run, tool, sum) {
    run.up += sum.up || 0; run.down += sum.down || 0; run.merged += sum.merged || 0; run.done += sum.done || 0; run.total += sum.total || 0; run.left += sum.left || 0;
    if (sum.hint) run.hint = true;
    (sum.skips || []).forEach(function (s) { run.skips.push(s); });
    if (sum.treeError && !run.treeError) run.treeError = sum.treeError;
    if (!sum.error) return;
    if (!run.stopped) run.stopped = { tool: tool, error: sum.error };
    if (isConnectionError(sum.error)) run.halt = true;
    say(tool, t('shared.cloud.sync_stopped', 'Stopped after {done} of {total}: {reason}', { done: sum.done || 0, total: sum.total || 0, reason: errorText(sum.error) }), true);
  }
  function runTools(run, me, sayKey, sayFallback, fn) {
    return seqMap(toolsWithEntries(), function (tool) {
      if (account !== me) return Promise.resolve();
      if (run.halt) { run.notReached.push(tool); return Promise.resolve(); }
      acctSay(t(sayKey, sayFallback, { tool: toolName(tool) }), false);
      return enqueue(tool, function () { return fn(tool); }).then(function (sum) { runNote(run, tool, sum || {}); render(tool); }, function (err) { runNote(run, tool, { error: err }); render(tool); });
    });
  }
  function stoppedText(run, key, fallback) {
    var text = t(key, fallback, { tool: toolName(run.stopped.tool), reason: errorText(run.stopped.error) })
      + ' ' + t('shared.cloud.acct_done_so_far', '{done} of {total} done so far.', { done: run.done, total: run.total });
    if (run.notReached.length) text += ' ' + t('shared.cloud.acct_not_reached', 'Not checked yet: {tools}.', { tools: run.notReached.map(toolName).join(', ') });
    return text + skippedText(run.skips);
  }
  function uploadAll() {
    var me = account;
    if (!me || !currentUser()) return Promise.resolve();
    acctBusy(true);
    var run = newRun();
    return runTools(run, me, 'shared.cloud.acct_uploading', 'Uploading {tool}…', uploadAllInner).then(function () {
      if (account !== me) return;
      acctBusy(false);
      if (run.stopped) { acctDone(stoppedText(run, 'shared.cloud.acct_upload_stopped_at', 'Stopped while uploading {tool}: {reason}'), true); return; }
      return fillAccount(t('shared.cloud.acct_uploaded', 'Uploaded {n} items to your account.', { n: run.done }) + skippedText(run.skips) + foldersText(run.treeError));
    });
  }
  // "Sync everything": each tool's Sync now, one after another — downloads, uploads and lossless merges,
  // conflicts left listed; tools this page does not render may take their settings too (nothing is in memory).
  function syncAll() {
    var me = account;
    if (!me || !currentUser()) return Promise.resolve();
    acctBusy(true);
    var run = newRun();
    return runTools(run, me, 'shared.cloud.acct_syncing', 'Syncing {tool}…', syncNowInner).then(function () {
      if (account !== me) return;
      acctBusy(false);
      if (run.stopped) { acctDone(stoppedText(run, 'shared.cloud.acct_stopped_at', 'Stopped while syncing {tool}: {reason}'), true); return; }
      return fillAccount(t('shared.cloud.done_sync', 'Sync finished: {up} uploaded, {down} downloaded, {merged} merged, {left} still need a choice.', { up: run.up, down: run.down, merged: run.merged, left: run.left }) + skippedText(run.skips) + foldersText(run.treeError) + suiteHintText(run.hint));
    });
  }
  // The "Settings that differ" block: for every tool, every settings blob changed in both places takes the
  // chosen side — 'useCloud' (the account's copy lands here, per-device fields kept) or 'keepMine' (this
  // device's copy goes up, a field only the account had kept) — then both sides hold it and the sync memory
  // remembers it.
  function resolveSettingsInner(tool, choice) {
    return planTool(tool).then(function (p) {
      var rows = p.rows.filter(isSettingsChoice);
      var sum = { tool: tool, done: 0, total: rows.length, skipped: 0, skips: [], error: null, treeError: null };
      if (!rows.length) return sum;
      return seqMap(rows, function (row) {
        return runAction(tool, choice, row).then(function (res) { sum.done++; if (res && res.hint) sum.hint = true; }, function (err) { if (!isRowError(err)) throw err; noteSkip(sum, row, err); });
      }).catch(function (err) { sum.error = err; })
        .then(function () { return finishRun(tool, p, sum); })
        .then(function () { return sum; });
    });
  }
  function resolveSettings(choice) {
    var me = account;
    if (!me || !currentUser()) return Promise.resolve();
    acctBusy(true);
    var run = newRun();
    return runTools(run, me, 'shared.cloud.acct_updating', 'Updating {tool}…', function (tool) { return resolveSettingsInner(tool, choice); }).then(function () {
      if (account !== me) return;
      acctBusy(false);
      if (run.stopped) { acctDone(stoppedText(run, 'shared.cloud.acct_update_stopped_at', 'Stopped while updating {tool}: {reason}'), true); return; }
      var line = choice === 'useCloud' ? t('shared.cloud.acct_settings_done_cloud', "Your account's settings are now on this device.")
                                       : t('shared.cloud.acct_settings_done_mine', "This device's settings are now in your account.");
      return fillAccount(line + skippedText(run.skips) + foldersText(run.treeError) + suiteHintText(run.hint));
    });
  }
  function backupAccount() {
    var me = account;
    if (!me || !currentUser()) return Promise.resolve();
    acctBusy(true);
    acctSay(t('shared.cloud.acct_preparing', 'Preparing the file…'), false);
    return accountBackup().then(function (n) {
      if (account !== me) return;
      acctBusy(false);
      acctSay(t('shared.cloud.acct_downloaded', 'Downloaded a backup with {n} items.', { n: n }), false);
    }, function (err) { if (account === me) { acctBusy(false); acctSay(errorText(err), true); } });
  }
  // After a fresh sign-in (this page load established the session): "Sync settings from your last login?".
  // Otherwise, once per account on a device that already holds saved items: introduce the account screen.
  function maybeWelcome(user) {
    if (!user) return;
    var a = A();
    var fresh = !!(a && typeof a.sessionSource === 'function' && a.sessionSource() === 'new');
    if (fresh && !splashShown) { splashShown = true; markWelcomed(user.id); openAccount({ splash: true }); return; }
    if (welcomedAt(user.id)) return;
    markWelcomed(user.id);
    if (deviceHasItems()) openAccount({ first: true });
  }

  /* ---------- mounting and wiring ---------- */
  function mountPanel(target, tool) {
    var host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host || host.nodeType !== 1) return null;
    injectStyle();
    var panel = panels[tool] || (panels[tool] = {});
    if (panel.root && panel.root.parentNode) panel.root.parentNode.removeChild(panel.root);
    panel.root = el('div', 'ivsav');
    panel.root.setAttribute('data-tool', tool);
    host.appendChild(panel.root);
    render(tool);
    return panel.root;
  }
  // A module write in another tab that this tab has not acted on: re-read that key here (no flush — the
  // point is to drop this tab's stale in-memory copy, exactly as the storage event always did), then list
  // again. Per tool and kind, against the stamps this tab last saw; its own writes are already seen.
  // Returns whether anything was re-read (the sync smoke asserts a quiet second call).
  function recheckWrites() {
    var m, stamps, lw, touched = {};
    try { m = metaAll(); stamps = stampsOf(m); } catch (e) { return false; }
    lw = isPlainObject(m.lastWrite) ? m.lastWrite : {};
    Object.keys(stamps).forEach(function (tool) {
      Object.keys(stamps[tool]).forEach(function (kind) {
        var at = stamps[tool][kind];
        if (seen[tool] && seen[tool][kind] === at) return;
        markSeen(tool, kind, at);
        if (!pages[tool]) return;
        notifyPage(tool, kind, (lw.tool === tool && lw.kind === kind) ? lw.name : null);
        touched[tool] = true;
      });
    });
    Object.keys(touched).forEach(function (tool) { if (currentUser()) refresh(tool).catch(function () {}); else render(tool); });
    return Object.keys(touched).length > 0;
  }
  function listen() {
    if (listening) return;
    listening = true;
    var a = A();
    if (a && typeof a.onChange === 'function') {
      a.onChange(function (user) {
        Object.keys(pages).forEach(function (tool) {
          if (user) refresh(tool).catch(function () {});
          else { plans[tool] = null; say(tool, '', false); render(tool); }
        });
        if (user) maybeWelcome(user); else { splashShown = false; closeAccount(); }
      });
    }
    if (a && typeof a.onOpenAccount === 'function') a.onOpenAccount(function () { openAccount(); });
    // Writes by other tabs: their `storage` event, and — because a tab in the background (iOS suspends
    // them) may never get that event — a look at the stamps whenever this tab becomes visible again or
    // returns from the back-forward cache. Nothing stamped before this page load is news.
    try { seen = stampsOf(metaAll()); } catch (e) {}
    window.addEventListener('storage', function (e) { if (e.key === META_KEY && e.newValue) recheckWrites(); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') recheckWrites(); });
    window.addEventListener('pageshow', function () { recheckWrites(); });
    // Labels render before the dictionary arrives and again when it does, and on every language switch.
    if (window.I18n) {
      try { if (window.I18n.ready && window.I18n.ready.then) window.I18n.ready.then(function () { Object.keys(panels).forEach(render); }); } catch (e) {}
      try { if (typeof window.I18n.onChange === 'function') window.I18n.onChange(function () { Object.keys(panels).forEach(render); onLangSwitched(); }); } catch (e) {}
    }
  }
  function attach(cfg) {
    cfg = cfg || {};
    var tool = cfg.tool;
    if (TOOLS.indexOf(tool) < 0) { warn('attach: unknown tool', tool); return null; }
    (cfg.entries || []).forEach(function (e) {
      var why = validEntry(e);
      if (why) { warn('attach: entry skipped —', why, e); return; }
      if (e.tool !== tool) { warn('attach: entry for another tool skipped', e); return; }
      extraEntries = extraEntries.filter(function (x) { return !(x.tool === e.tool && x.kind === e.kind); });
      extraEntries.push(e);
    });
    var bad = IVRIT_SYNC_REGISTRY.filter(function (e) { return e.tool === tool && validEntry(e); });
    bad.forEach(function (e) { warn('registry entry is invalid and ignored:', validEntry(e), e); });
    registryFor(tool).forEach(function (e) {
      if (NEEDS_HOOK[e.shape] && typeof cfg.onLocalChanged !== 'function') warn('attach:', tool, e.kind, 'is upload-only: the page gave no onLocalChanged, so a download could be undone by its own in-memory state');
    });
    pages[tool] = cfg;
    var a = A();
    if (a && typeof a.onOpenSaves === 'function' && typeof cfg.open === 'function') a.onOpenSaves(cfg.open);
    if (cfg.panel) mountPanel(cfg.panel, tool);
    listen();   // IvritAccount.onChange fires once when the state is known — that call lists every attached tool
    if (currentUser()) refresh(tool).catch(function () {});   // …unless it already fired before this attach (listen() runs at boot)
    return true;
  }

  /* ---------- public surface ---------- */
  window.IvritSaves = {
    attach: attach,
    mountPanel: mountPanel,
    openAccount: function (opts) { openAccount(opts); },
    closeAccount: closeAccount,
    refresh: refresh,
    // A listing for the caller's own use; the panel is re-rendered afterwards (the queue renders it busy while it runs).
    plan: function (tool) { return enqueue(tool, function () { return planTool(tool); }).then(function (p) { render(tool); return p; }, function (e) { render(tool); throw e; }); },
    lastPlan: function (tool) { return plans[tool] || null; },   // the last listing, synchronously (a page hook reads a row's state from it)
    // A deliberate reset on a page: forget what this device last synced for that row, so the next listing
    // asks (a settings blob) or merges (progress) instead of sending the reset up as "newer here".
    forgetRow: function (tool, kind, name) { var u = currentUser(); if (u) metaDelete(u.id, tool, kind, name || DEFAULT_NAME); },
    syncNow: syncNow,
    act: act,
    registry: function () { return IVRIT_SYNC_REGISTRY.concat(extraEntries).map(function (e) { return safeAssign({}, e); }); },
    local: {
      list: function (tool) { return localSide(tool).then(function (items) { return items.map(function (it) { return { id: it.kind + ':' + it.name, kind: it.kind, name: it.name, label: it.label, hash: it.hash, bytes: it.bytes }; }); }); },
      load: function (tool, kind, name) { var e = entryFor(tool, kind); var it = e && localItem(e, name); return Promise.resolve(it ? { kind: it.kind, name: it.name, data: clone(it.value) } : null); },
      save: function (tool, kind, name, value) { var e = entryFor(tool, kind); if (!e) return Promise.reject(makeError('bad_kind')); if (!validateShape(e, value)) return Promise.reject(makeError('shape')); return localWrite(e, name, value); },
      remove: function (tool, kind, name) { var e = entryFor(tool, kind); if (!e) return Promise.reject(makeError('bad_kind')); return localRemove(e, name); }
    },
    cloud: { list: cloudList, load: cloudLoad, insert: cloudInsert, updateIf: cloudUpdateIf, remove: cloudRemove },
    registerSummary: registerSummary,
    inventory: inventory,
    bundleAll: bundleAll,
    forgetUser: forgetUser,
    errorText: errorText,
    t: t,
    _test: {
      canonJson: canonJson, hashText: hashText, classify: classify, deepMax: deepMax, maxValue: maxValue,
      project: project, restoreOmitted: restoreOmitted, safeParse: safeParse, copyNameFor: copyNameFor,
      validateShape: validateShape, errorText: errorText, guardUpload: guardUpload, ivritFile: ivritFile,
      treeIsFlat: treeIsFlat, bundleFromRows: bundleFromRows, recheckWrites: recheckWrites, isRowError: isRowError, isConnectionError: isConnectionError,
      suitePrefs: SUITE_PREFS, META_KEY: META_KEY, HASH_PREFIX: HASH_PREFIX, MAX_BYTES: MAX_BYTES
    }
  };
  // The chip's "Account…" item and the sign-in splash belong to every page that loads this module, including
  // one with no registry rows of its own (the Font Maker): start listening at boot, not only on attach().
  if (A()) listen();
})();
