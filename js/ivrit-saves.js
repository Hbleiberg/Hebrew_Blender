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
 *   attach(cfg)               { tool, panel?, title?, entries?, merges?, flush?, onLocalChanged?, open? }
 *                             title: false → no title of its own (the page's panel heading is the heading);
 *                             an i18n key → that title (the hub names each panel after its tool)
 *   mountPanel(target, tool)  element | selector — renders the panel there
 *   refresh(tool)             Promise<plan> — re-lists both sides and re-renders
 *   plan(tool)                Promise<plan> — the per-item state table (no rendering)
 *   syncNow(tool)             Promise<summary> — every safe action in the list, in order
 *   act(tool, action, row)    Promise<result> — one row action ('upload' | 'download' | 'merge' | 'useCloud' |
 *                             'keepBoth' | 'keepMine' | 'delete' | 'file') on a row from plan(); the status line reports it
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
  var IVRIT_SYNC_REGISTRY = [
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
    { tool: 'Worksheet', kind: 'lastState', lsKey: 'hebrewBlender_lastState', shape: 'single', merge: 'assign', ivritKey: 'blenderLastState', label: 'shared.cloud.kind_last_setup' }
  ];
  var extraEntries = [];   // entries a page registered through attach({ entries }) — the test harness

  var pages = {};      // tool → the cfg given to attach()
  var panels = {};     // tool → { root, mounted }
  var plans = {};      // tool → the last plan
  var queues = {};     // tool → promise chain: one cloud operation at a time
  var busy = {};       // tool → true while its queue runs
  var messages = {};   // tool → { text, isError }
  var pendingRefresh = {};   // tool → the listing promise in flight, so two callers share one listing
  var lastSeenWrite = null;  // the `at` of the last module write another tab told us about
  var listening = false;

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
  function localWrite(entry, name, value) {
    if (badName(name)) return Promise.reject(makeError('name'));
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
  // Other tabs of the same tool learn about a module write through the sync-memory key (a `storage`
  // event, see listen()) and re-read the key — otherwise their next in-memory save would revert it.
  // Signed in only: anonymous use never creates the key (the harness's local round trip stays silent).
  function stampWrite(entry, name) {
    if (!currentUser()) return;
    var m = metaAll();
    m.lastWrite = { tool: entry.tool, kind: entry.kind, name: name, at: Date.now() };
    metaSave(m);
  }
  // Only the test harness removes local data (its own keys). The panel never calls this.
  function localRemove(entry, name) {
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
  function metaAll() {
    try { var m = safeParse(lsGet(META_KEY) || 'null'); if (isPlainObject(m) && m.v === 1 && isPlainObject(m.users)) return m; } catch (e) {}
    return { v: 1, users: {} };
  }
  function metaSave(m) { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {} }
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
    if (code === 'changed') return t('shared.cloud.error_changed', 'That item changed in the cloud a moment ago. The list was refreshed; choose again.');
    if (code === 'shape') return t('shared.cloud.error_shape', 'The cloud copy has an unexpected shape and was not written to this device.');
    if (code === 'no_merge') return t('shared.cloud.error_no_merge', 'This page cannot merge that item yet.');
    if (code === 'name') return t('shared.cloud.error_name', 'Names must be 1 to 120 characters.');
    if (code === 'chars' || code === '22P05') return t('shared.cloud.error_chars', 'That item contains characters the cloud cannot store.');
    if (code === 'too_big' || (code === '23514' && /2mb|octet|too big/.test(lower))) return t('shared.cloud.error_too_big', 'That item is too big for the cloud (2 MB limit).');
    if (code === '23514') return t('shared.cloud.error_limit', 'Your account has reached its limit of saved items.');
    if (code === '23505') return t('shared.cloud.error_name_taken', 'That name is already used in the cloud.');
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
    if (typeof e.lsKey !== 'string' || !e.lsKey) return 'missing lsKey';
    if (SHAPES.indexOf(e.shape) < 0) return 'bad shape ' + e.shape;
    if (MERGES.indexOf(e.merge) < 0) return 'bad merge ' + e.merge;
    if (e.shape === 'mapIn' && (typeof e.path !== 'string' || !e.path)) return 'mapIn needs a path';
    if (e.shape === 'tree' && (typeof e.follows !== 'string' || !e.follows)) return 'a tree needs follows';
    if (e.omit !== undefined && !Array.isArray(e.omit)) return 'omit must be an array';
    return null;
  }
  function keyOf(kind, name) { return kind + '' + name; }
  function hashItem(entry, value) { return hashText(canonJson(project(entry, value))); }

  /* ---------- the plan: one row per kind + name across both sides ---------- */
  // local / cloud: { hash } or null (cloud also carries updatedAt); memory: what this device last synced
  // for the item, or null. The row's updated_at matching the memory is what says "the cloud copy is
  // the one I synced" — the hash in `data_hash` is only a shortcut.
  function classify(local, cloud, memory) {
    if (local && !cloud) return 'local-only';
    if (!local && cloud) return 'cloud-only';
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
    if (r.state !== 'conflict') return r.safeAction ? [r.safeAction] : [];
    var m = r.entry.merge;
    if (m === 'item') return r.downloadable ? ['keepBoth', 'useCloud', 'keepMine'] : ['keepMine'];
    if (m === 'assign') return r.downloadable ? ['useCloud', 'keepMine'] : ['keepMine'];
    if (r.mergeable && r.downloadable) return ['merge'];
    return m === 'page' ? [] : ['keepMine'];   // no helper on this page: the tool that owns the merge resolves it
  }
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
      r.downloadable = !(NEEDS_HOOK[r.entry.shape] && typeof cfg.onLocalChanged !== 'function');
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
    var counts = { safe: 0, conflicts: 0, synced: 0 };
    list.forEach(function (r) {
      if (r.safeAction) counts.safe++;
      if (r.state === 'conflict' && !r.safeAction) counts.conflicts++;
      if (r.state === 'synced') counts.synced++;
    });
    var p = { tool: tool, userId: uid, rows: list, cloudRows: cloudRows, counts: counts };
    plans[tool] = p;
    return p;
  }

  /* ---------- actions (each runs inside the tool's queue) ---------- */
  function ensureUser() { var u = currentUser(); if (!u) throw makeError('signed_out'); return u.id; }
  function stillMe(uid) { var u = currentUser(); return !!u && u.id === uid; }
  function flushPage(tool) {
    var cfg = pages[tool];
    if (cfg && typeof cfg.flush === 'function') { try { cfg.flush(); } catch (e) { warn('flush failed:', e); } }
  }
  function notifyPage(tool, kind, name) {
    var cfg = pages[tool];
    if (cfg && typeof cfg.onLocalChanged === 'function') { try { cfg.onLocalChanged(kind, name); } catch (e) { warn('onLocalChanged failed:', e); } }
  }
  // The local side may have moved since the list was built (the page kept working): a download or a
  // merge onto a value newer than the one the person looked at is refused and the list refreshed.
  function assertLocalAsPlanned(row, it) {
    if (!row.local) return Promise.resolve();
    if (!it) throw makeError('changed', 'IvritSaves: the local item is gone');
    return hashItem(row.entry, it.value).then(function (h) { if (h !== row.local.hash) throw makeError('changed', 'IvritSaves: the local item changed meanwhile'); });
  }
  function remember(uid, tool, row, name, h, saved) {
    if (stillMe(uid)) metaSet(uid, tool, row.kind, name, { h: h, id: saved.id, u: saved.updated_at, at: now() });
  }
  // Upload = also "Keep mine" on a conflict: the local copy goes over the listed cloud row (if any).
  function actUpload(tool, row) {
    var uid = ensureUser();
    flushPage(tool);
    var it = localItem(row.entry, row.name);
    if (!it) throw makeError('changed', 'IvritSaves: nothing to upload');
    var projected = project(row.entry, it.value);
    var g = guardUpload(row.entry, row.name, projected);
    if (g) throw g;
    return hashText(canonJson(projected)).then(function (h) {
      var write = row.cloud ? cloudUpdateIf(row.cloud.id, row.cloud.updatedAt, projected, h)
                            : cloudInsert(row.entry, row.name, projected, h).catch(function (err) { if (err && err.code === '23505') throw makeError('changed'); throw err; });
      return write.then(function (saved) { remember(uid, tool, row, row.name, h, saved); return { action: 'upload', row: row }; });
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
        return localWrite(row.entry, row.name, value).then(function () {
          notifyPage(tool, row.kind, row.name);
          var back = localItem(row.entry, row.name);   // what the store now holds is what gets remembered
          return hashItem(row.entry, back ? back.value : value).then(function (h) {
            remember(uid, tool, row, row.name, h, full);
            return { action: 'download', row: row };
          });
        });
      });
    });
  }
  // Shared tail of the merging actions: write the value here, tell the page, put the same value in the
  // cloud (unless the cloud already holds it), remember it.
  function writeBothSides(tool, uid, row, value, full) {
    return localWrite(row.entry, row.name, value).then(function () {
      notifyPage(tool, row.kind, row.name);
      var back = localItem(row.entry, row.name);
      var projected = project(row.entry, back ? back.value : value);
      var g = guardUpload(row.entry, row.name, projected);
      if (g) throw g;
      return Promise.all([hashText(canonJson(projected)), hashItem(row.entry, full.data)]).then(function (hs) {
        var h = hs[0], cloudHash = hs[1];
        if (h === cloudHash) { remember(uid, tool, row, row.name, h, full); return { action: 'merge', row: row }; }
        return cloudUpdateIf(full.id, full.updated_at, projected, h).then(function (saved) { remember(uid, tool, row, row.name, h, saved); return { action: 'merge', row: row }; });
      });
    });
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
  // Keep both: the cloud version is added on this device under a new name first (and read back), then
  // this device's version goes over the cloud row, then the copy goes up too — every device ends with
  // both, nothing is lost, and it converges in one click.
  function actKeepBoth(tool, row) {
    var uid = ensureUser();
    return cloudLoad(row.cloud.id).then(function (full) {
      if (!validateShape(row.entry, full.data)) throw makeError('shape');
      flushPage(tool);
      var it = localItem(row.entry, row.name);
      return assertLocalAsPlanned(row, it).then(function () {
        if (!it) throw makeError('changed');
        var copyName = copyNameFor(tool, row.entry, row.name);
        var g = guardUpload(row.entry, copyName, full.data);
        if (g) throw g;
        return localWrite(row.entry, copyName, full.data).then(function () {
          notifyPage(tool, row.kind, copyName);
          var projected = project(row.entry, it.value);
          var g2 = guardUpload(row.entry, row.name, projected);
          if (g2) throw g2;
          return hashText(canonJson(projected)).then(function (h) {
            return cloudUpdateIf(full.id, full.updated_at, projected, h).then(function (saved) {
              remember(uid, tool, row, row.name, h, saved);
              return hashItem(row.entry, full.data).then(function (hc) {
                return cloudInsert(row.entry, copyName, project(row.entry, full.data), hc)
                  .then(function (saved2) { remember(uid, tool, row, copyName, hc, saved2); },
                        function (err) { warn('the copy stays on this device only for now:', err); });   // Sync will retry it
              });
            });
          });
        }).then(function () { return { action: 'keepBoth', row: row, copy: copyName }; });
      });
    });
  }
  function actDelete(tool, row) {
    var uid = ensureUser();
    return cloudRemove(row.cloud.id).then(function () { if (stillMe(uid)) metaDelete(uid, tool, row.kind, row.name); return { action: 'delete', row: row }; });
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
    return { _ivritSuite: 1, format: 'ivrit-save', version: 1, tool: entry.ivritKey ? 'AllTools' : entry.tool, savedAt: now(), data: bundle };
  }
  function fileStem(s) { return String(s).replace(/[^\w֐-׿.-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'item'; }
  function actDownloadFile(tool, row) {
    ensureUser();
    return cloudLoad(row.cloud.id).then(function (full) {
      var file = ivritFile(row.entry, row.name, full.data);
      var blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileStem(row.entry.tool + '_' + row.kind + '_' + row.name) + '.ivrit';
      document.body.appendChild(a);
      a.click();
      a.parentNode.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      return { action: 'file', row: row };
    });
  }
  function runAction(tool, action, row) {
    return Promise.resolve().then(function () {
      if (action === 'upload' || action === 'keepMine') return actUpload(tool, row);
      if (action === 'download') return actDownload(tool, row);
      if (action === 'merge') return actMerge(tool, row);
      if (action === 'useCloud') return actUseCloud(tool, row);
      if (action === 'keepBoth') return actKeepBoth(tool, row);
      if (action === 'delete') return actDelete(tool, row);
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
  function syncTree(tool, entry, p) {
    var uid = ensureUser();
    var cfg = pages[tool] || {};
    var helper = cfg.merges && cfg.merges[entry.kind];
    var cloudRow = null;
    (p.cloudRows || []).forEach(function (r) { if (r.kind === entry.kind && r.name === DEFAULT_NAME) cloudRow = r; });
    var local = readStore(entry);
    if (local && !(Array.isArray(local.root) && local.root.length)) local = null;
    if (!local && !cloudRow) return Promise.resolve();
    if (p.rows.some(function (r) { return r.kind === entry.follows && r.state === 'cloud-only'; })) return Promise.resolve();
    return (cloudRow ? cloudLoad(cloudRow.id) : Promise.resolve(null)).then(function (full) {
      var cloud = (full && validateShape(entry, full.data)) ? full.data : null;
      var merged;
      if (local && cloud) {
        if (treeIsFlat(local)) merged = cloud;
        else if (typeof helper === 'function') { merged = helper(clone(local), clone(cloud)); if (!validateShape(entry, merged)) merged = local; }
        else { warn('no merge helper for tree kind', entry.kind, '— the cloud folders were not merged'); merged = local; }
      } else merged = local || cloud;
      var chain = Promise.resolve();
      if (!local || canonJson(merged) !== canonJson(local)) {
        chain = chain.then(function () { flushPage(tool); return localWrite(entry, DEFAULT_NAME, merged); })
                     .then(function () { notifyPage(tool, entry.kind, DEFAULT_NAME); });
      }
      return chain.then(function () {
        return hashItem(entry, merged).then(function (h) {
          if (cloud && canonJson(merged) === canonJson(cloud)) { if (stillMe(uid)) metaSet(uid, tool, entry.kind, DEFAULT_NAME, { h: h, id: full.id, u: full.updated_at, at: now() }); return; }
          var g = guardUpload(entry, DEFAULT_NAME, merged);
          if (g) throw g;
          var write = full ? cloudUpdateIf(full.id, full.updated_at, merged, h) : cloudInsert(entry, DEFAULT_NAME, merged, h);
          return write.then(function (saved) { if (stillMe(uid)) metaSet(uid, tool, entry.kind, DEFAULT_NAME, { h: h, id: saved.id, u: saved.updated_at, at: now() }); });
        });
      });
    });
  }
  // After any action: list again, then let every tree of the tool follow its items.
  function afterActions(tool) {
    return planTool(tool).then(function (p) {
      var trees = registryFor(tool).filter(function (e) { return e.shape === 'tree'; });
      if (!trees.length || !p.userId) return p;
      return seqMap(trees, function (e) { return syncTree(tool, e, p); }).then(function () { return p; });
    });
  }
  // A row the client-side guard refuses (too big, an impossible name) is skipped and counted; the run
  // goes on. Anything else — a network or server error — stops it, and re-running resumes.
  function isGuardError(err) { var c = err && err.code; return c === 'too_big' || c === 'name' || c === 'chars'; }
  function syncNowInner(tool) {
    return planTool(tool).then(function (p) {
      var todo = p.rows.filter(function (r) { return r.safeAction; });
      var sum = { done: 0, total: todo.length, up: 0, down: 0, merged: 0, skipped: 0, left: 0, error: null };
      return seqMap(todo, function (row) {
        return runAction(tool, row.safeAction, row).then(function () {
          sum.done++;
          if (row.safeAction === 'upload') sum.up++; else if (row.safeAction === 'download') sum.down++; else sum.merged++;
        }, function (err) { if (!isGuardError(err)) throw err; sum.skipped++; });
      }).catch(function (err) { sum.error = err; })
        .then(function () { return afterActions(tool); })
        .then(function (p2) { sum.left = p2.counts.conflicts; return sum; });
    });
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
      'body.dark .ivsav-row[data-state="synced"] .ivsav-state{background:#1f4d2a;color:#c9f0cf;}' +
      'body.dark .ivsav-row[data-state="conflict"] .ivsav-state{background:#5a2323;color:#ffd6d6;}' +
      'body.dark .ivsav-row[data-state="cloud-changed"] .ivsav-state,body.dark .ivsav-row[data-state="cloud-only"] .ivsav-state{background:#23385c;color:#d6e4ff;}' +
      'body.dark .ivsav-row[data-state="local-changed"] .ivsav-state,body.dark .ivsav-row[data-state="local-only"] .ivsav-state{background:#5a4416;color:#ffe9b8;}' +
      '.ivsav-meta{flex:1 1 140px;font-size:0.75rem;color:var(--muted,#6b6050);}' +
      '.ivsav-actions{display:flex;flex-wrap:wrap;gap:4px;}' +
      '.ivsav-actions .ivsav-btn{font-size:0.75rem;padding:3px 8px;}' +
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
    return t('shared.cloud.state_conflict', 'Changed in both places');
  }
  function actionText(action) {
    if (action === 'upload') return t('shared.cloud.upload', 'Upload');
    if (action === 'download') return t('shared.cloud.download', 'Download');
    if (action === 'merge') return t('shared.cloud.merge', 'Merge');
    if (action === 'keepBoth') return t('shared.cloud.keep_both', 'Keep both');
    if (action === 'useCloud') return t('shared.cloud.use_cloud', 'Use cloud copy');
    if (action === 'keepMine') return t('shared.cloud.keep_mine', 'Keep mine');
    return action;
  }
  function doneText(res) {
    var name = res.row ? res.row.label : '';
    if (res.action === 'upload') return t('shared.cloud.done_upload', 'Uploaded "{name}".', { name: name });
    if (res.action === 'download') return t('shared.cloud.done_download', 'Downloaded "{name}" to this device.', { name: name }) + ' ' + t('shared.cloud.reload_hint', 'If this tool is open in other tabs, reload them.');
    if (res.action === 'merge') return t('shared.cloud.done_merge', 'Merged "{name}" on both sides.', { name: name });
    if (res.action === 'keepBoth') return t('shared.cloud.done_keep_both', 'Kept both: the cloud version is now "{copy}" on this device.', { copy: res.copy });
    if (res.action === 'delete') return t('shared.cloud.done_delete', 'Deleted "{name}" from the cloud.', { name: name });
    return '';
  }
  function say(tool, text, isError) {
    messages[tool] = text ? { text: text, isError: !!isError } : null;
    var st = panels[tool] && panels[tool].root && panels[tool].root.querySelector('.ivsav-status');
    if (st) { st.textContent = text || ''; st.classList.toggle('is-error', !!isError); }
    if (text && !isError && typeof window.showAppToast === 'function') { try { window.showAppToast(text); } catch (e) {} }
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
      var refreshBtn = button(t('shared.cloud.refresh', 'Refresh'), '', function () { refresh(tool); });
      head.appendChild(refreshBtn);
      var n = p ? p.counts.safe : 0;
      var syncBtn = button(n ? t('shared.cloud.sync_count', 'Sync now ({n})', { n: n }) : t('shared.cloud.sync', 'Sync now'), 'ivsav-primary', function () { syncNow(tool); });
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
    if (!p.rows.length) {
      root.appendChild(el('p', 'ivsav-note', t('shared.cloud.empty', 'Nothing saved yet. Items you save in this tool will appear here.')));
      return;
    }
    var lastKind = null;
    p.rows.forEach(function (row) {
      if (row.kind !== lastKind) {
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
        var b = button(actionText(action), action === row.safeAction || action === 'keepBoth' ? 'ivsav-primary' : '', function () { act(tool, action, row); });
        if (isBusy) b.setAttribute('aria-disabled', 'true');
        actions.appendChild(b);
      });
      if (row.cloud) {
        var fileBtn = button(t('shared.cloud.download_json', 'Download file'), '', function () { act(tool, 'file', row); });
        var delBtn = button(t('shared.cloud.delete', 'Delete from cloud'), '', function () {
          if (!window.confirm(t('shared.cloud.delete_confirm', 'Delete "{name}" from the cloud? The copy on this device stays.', { name: row.label }))) return;
          act(tool, 'delete', row);
        });
        if (isBusy) { fileBtn.setAttribute('aria-disabled', 'true'); delBtn.setAttribute('aria-disabled', 'true'); }
        actions.appendChild(fileBtn);
        actions.appendChild(delBtn);
      }
      li.appendChild(actions);
      list.appendChild(li);
    });
    root.appendChild(list);
    if (p.counts.safe === 0 && p.counts.conflicts === 0 && !msg && !isBusy) status.textContent = t('shared.cloud.all_synced', 'Everything is in sync.');
  }
  // One row action, from a panel button or a page's own control: resolves with { action, row, copy? },
  // rejects with the mapped error after the status line has shown it (a "changed meanwhile" re-lists first).
  function act(tool, action, row) {
    say(tool, '', false);
    return enqueue(tool, function () {
      return runAction(tool, action, row).then(function (res) {
        return afterActions(tool).then(function () { return res; });
      }).catch(function (err) {
        if (err && err.code === 'changed') return planTool(tool).catch(function () {}).then(function () { throw err; });
        throw err;
      });
    }).then(function (res) {
      say(tool, doneText(res), false);
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
      var skipped = sum.skipped ? ' ' + t('shared.cloud.sync_skipped', '{n} could not be uploaded (too big or an invalid name).', { n: sum.skipped }) : '';
      if (sum.error) say(tool, t('shared.cloud.sync_stopped', 'Stopped after {done} of {total}: {reason}', { done: sum.done, total: sum.total, reason: errorText(sum.error) }) + skipped, true);
      else say(tool, t('shared.cloud.done_sync', 'Sync finished: {up} uploaded, {down} downloaded, {merged} merged, {left} still need a choice.', { up: sum.up, down: sum.down, merged: sum.merged, left: sum.left }) + skipped, false);
      render(tool);
      return sum;
    }, function (err) { say(tool, errorText(err), true); render(tool); throw err; });
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
      });
    }
    // A module write in another tab of the same tool: re-read that key here (no flush — the point is to
    // drop this tab's stale in-memory copy), then list again. Only module writes carry the stamp.
    try { lastSeenWrite = (metaAll().lastWrite || {}).at || null; } catch (e) {}
    window.addEventListener('storage', function (e) {
      if (e.key !== META_KEY || !e.newValue) return;
      var lw = null;
      try { lw = safeParse(e.newValue).lastWrite; } catch (x) { return; }
      if (!isPlainObject(lw) || lw.at === lastSeenWrite) return;
      lastSeenWrite = lw.at;
      if (!pages[lw.tool]) return;
      notifyPage(lw.tool, lw.kind, lw.name);
      if (currentUser()) refresh(lw.tool).catch(function () {}); else render(lw.tool);
    });
    // Labels render before the dictionary arrives and again when it does, and on every language switch.
    if (window.I18n) {
      try { if (window.I18n.ready && window.I18n.ready.then) window.I18n.ready.then(function () { Object.keys(panels).forEach(render); }); } catch (e) {}
      try { if (typeof window.I18n.onChange === 'function') window.I18n.onChange(function () { Object.keys(panels).forEach(render); }); } catch (e) {}
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
    return true;
  }

  /* ---------- public surface ---------- */
  window.IvritSaves = {
    attach: attach,
    mountPanel: mountPanel,
    refresh: refresh,
    plan: function (tool) { return enqueue(tool, function () { return planTool(tool); }); },
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
    t: t,
    _test: {
      canonJson: canonJson, hashText: hashText, classify: classify, deepMax: deepMax, maxValue: maxValue,
      project: project, restoreOmitted: restoreOmitted, safeParse: safeParse, copyNameFor: copyNameFor,
      validateShape: validateShape, errorText: errorText, guardUpload: guardUpload, ivritFile: ivritFile,
      treeIsFlat: treeIsFlat, META_KEY: META_KEY, HASH_PREFIX: HASH_PREFIX, MAX_BYTES: MAX_BYTES
    }
  };
})();
