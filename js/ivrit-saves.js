/*
 * ivrit-saves.js — a signed-in teacher's saves live in the account (IvritSuite accounts).
 *
 * Load on a page AFTER /js/ivrit-account.js (all four deferred, in this order):
 *   <script src="/js/i18n.js" defer></script>
 *   <script src="/js/supabase-config.js" defer></script>
 *   <script src="/js/ivrit-account.js" defer></script>
 *   <script src="/js/ivrit-saves.js" defer></script>
 *
 * What it is — SIGNED OUT, the device is its own; SIGNED IN, the account is where saves live:
 *   - Anonymous use never writes anything: no localStorage key, no network request, no IndexedDB open,
 *     and the Storage prototype is untouched. Local save, .ivrit files and JSON import stay as they were.
 *   - Signed in, each tool's registered localStorage keys are that device's cache of the account:
 *       hydrate  — at every page load with a session (and after a sign-in) one listing, without data, for
 *                  the tools this page reads; rows whose hash differs are fetched and written into the
 *                  keys, items before their folder trees, and the page's onLocalChanged re-renders;
 *       write-through — a Storage.prototype.setItem/removeItem hook (installed only after a signed-in
 *                  hydration) marks a registered kind dirty, waits 2 s after the last write, then diffs
 *                  the store against this device's sync memory: insert / conditional update / conditional
 *                  delete (only names this tab saw) / nothing when the hash is unchanged.
 *   - Conflicts never open a dialog (an item keeps both, a settings blob takes the account's fields on a
 *     row this device never synced and this device's fields afterwards, progress/rosters/word
 *     lists/trees merge losslessly); deletions propagate both ways, the later human action wins; a
 *     single/scalar row gone from the account is re-uploaded, a font evicted by the cap is not a
 *     deletion, and a listing that lacks every remembered row is checked with getUser() first.
 *   - The first hydration for an account on a device asks once about the device's own saves that are not
 *     in the account (Add / Download a backup / Remove); a button sign-out flushes, then removes what the
 *     account is known to hold (unsynced rows stay as the device's own data; preferences and My Fonts
 *     stay); a session that ends by itself removes nothing.
 *   - Every entry point resolves or rejects; nothing throws into the page. The DOM is built with
 *     createElement/textContent only, and JSON from the cloud passes through a prototype-safe parser.
 *
 * IVRIT_SYNC_REGISTRY (below) is the only place that names synced keys: one entry per localStorage
 * key, with `shape` (how items are found inside it) and `merge` (how a downloaded copy lands on a
 * differing local one). A tool page adds its entries there and wires the status line with
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
 *   attach(cfg)               { tool, status?, entries?, merges?, flush?, finalFlush?, onLocalChanged?, alsoPull?, paused?, editing?, hydrate? }
 *                             status: element | selector for the status line; alsoPull: other tools this page
 *                             reads (hydrated with this page's hooks); paused(): the hook only postpones while
 *                             true; finalFlush(): pagehide / sign-out only; editing(): a live edit is open (another
 *                             tab's download then waits instead of re-rendering over it); hydrate: false (a harness)
 *                             = nothing automatic. onLocalChanged(kind, name, names, { pending }).
 *   hydrate(tools)            Promise — list, download, upload, merge for those tools (queued, deduplicated)
 *   flush(tool)               Promise — write this tool's dirty kinds through now
 *   suspend()                 stop write-through for this page (the hub's Erase All calls it first)
 *   fontDeleted(name)         a teacher deleted a font on purpose: remove its account row
 *   pendingSignOut()          { unsynced } — what a sign-out would leave on this device (the confirm names it)
 *   needsReload()             whether this page must reload after a sign-out (false when it attaches only Suite)
 *   mountStatus(target, tool) element | selector — renders the status line there
 *   lastPlan(tool)            the last classification for a tool (a page hook reads a row's state from it)
 *   inventory()               Promise<[{tool, name, kinds:[{kind, label, count, bytes, names}], count, bytes}]> — what the
 *                             account holds, tool by tool, without the data (the account page's listing)
 *   bundleAll()               Promise<{file, count}> — every cloud row as one AllTools-shaped .ivrit object (the account
 *                             page zips it with the Font Maker projects)
 *   forgetUser(uid)           drops this device's sync memory of an account that was deleted
 *   local / cloud             the two backends (used by saves-test.html)
 *   registry()                a copy of the effective registry
 *   t(key, fallback, params)  translate via IvritAccount.t (I18n when loaded, else the English fallback)
 *   _test                     pure helpers for saves-test.html and the smokes
 * Events on window: ivritsuite:prefs (a suite-wide preference landed), ivritsuite:fonts (a font landed),
 *   ivritsuite:hydrated ({ tools, ok, first, landed }) after every hydration.
 */
(function () {
  'use strict';

  /* ---------- constants ---------- */
  var TOOLS = ['Suite', 'Worksheet', 'FlashCards', 'Dictionary', 'TorahTrainer', 'TropeTutor', 'Dashboard'];
  var KIND_RE = /^[A-Za-z]{1,32}$/;
  var SHAPES = ['map', 'mapIn', 'single', 'tree', 'scalar'];
  var MERGES = ['item', 'assign', 'deepMax', 'max', 'page'];
  var META_KEY = 'ivritSuite_syncMeta';    // the cross-tab write stamps and the sign-out broadcast (both module versions read it)
  var META2_KEY = 'ivritSuite_syncMeta2';  // what this device last synced, per account (v2; erase-only, never exported)
  var BASE_KEY = 'ivritSuite_syncBase';    // the last synced value of each settings row (merge 'assign'), the base of a field-by-field merge (erase-only)
  var REPLACED_KEY = 'ivritSuite_replaced'; // a device's own settings that the account's copy replaced at a first sign-in, kept for download (erase-only)
  var HASH_PREFIX = '1.';                 // SHA-256 over the canonical JSON, base64url, 45 chars
  var FALLBACK_PREFIX = '0.';             // FNV-1a pair, only where crypto.subtle is missing (a plain http:// host)
  var MAX_BYTES = 1887436;                // 1.8 MB of canonical JSON; the server allows 2 MB of its own, slightly wider, text
  var MAX_NAME = 120;
  var DEFAULT_NAME = 'default';           // the row name of a single / tree / scalar entry
  var PAGE_SIZE = 1000;                   // PostgREST's maximum rows per request
  var NEEDS_HOOK = { single: true, scalar: true, tree: true, mapIn: true };   // shapes a page must re-read after a download
  var ROW_COLS = 'id, kind, name, data_hash, bytes, updated_at';
  var FLUSH_DEBOUNCE_MS = 2000;           // write-through waits this long after the last write to a key
  var SIGNOUT_FLUSH_MS = 6000;            // the longest a sign-out waits for its final flush: the account module gives each
                                          // sign-out hook 10 s, and the account check, the removal and the broadcast follow it
  // The Classroom Dashboard seeds one preset named "Default" on every fresh device (its loadPresets()); untouched, it
  // is a seed, not a teacher's work: never listed as a device extra, never uploaded by itself. The canonical JSON of
  // that seed (scripts/smoke-sync.mjs asserts it still matches the page's DEFAULT_PRESET.Default).
  var DASHBOARD_DEFAULT_PRESET_CANON = "{\"colorCodeNikkud\":false,\"colorCodingMode\":\"letter\",\"colorDays\":true,\"dashTextHTML\":\"<div>This dashboard has support for <b>bold</b>, <i>italics</i>, <u>underline</u> and <strike>strikethrough</strike>. You can insert <a href=\\\"https://google.com\\\" target=\\\"_blank\\\" rel=\\\"noopener noreferrer\\\">links</a>.</div><div><br></div><div style=\\\"text-align: center;\\\">You can center text.</div><div>Change the <font size=\\\"6\\\">size</font>.</div><div>And you can also <span class=\\\"spoiler\\\">hide spoilers</span>. (Click the box.)</div><div><br></div><div>Click the gear icon at the top to edit this text and change how this dashboard works!</div>\",\"dashTextSize\":1.8,\"dowEmojiSet\":\"chick\",\"dowLang\":\"he\",\"enableDashText\":true,\"engDateFmt\":\"MDY\",\"engFont\":\"Source Sans 3\",\"headerLang\":\"he\",\"hebDateScript\":\"translit\",\"hebFont\":\"Frank Ruhl Libre\",\"hideDOW\":false,\"hideEngDate\":false,\"hideHebDate\":false,\"hideTime\":false,\"hideWeather\":false,\"hideWeatherDesc\":false,\"hideWeatherEmoji\":false,\"location\":\"New York\",\"nikudColorOverrides\":{},\"showEngDOW\":true,\"showNikkud\":true,\"showTimer\":true,\"showTimerFullscreen\":true,\"showToday\":true,\"showTomorrow\":true,\"showYesterday\":true,\"simpleWeatherDesc\":false,\"tempUnit\":\"F\",\"timeFmt\":\"12\",\"weatherLabelLang\":\"he\"}";
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
  //   skipUpload (name, value) → true for a local item that is only a seed (an untouched empty default class):
  //              never uploaded, and its name is left out of the folder tree that follows the kind (project())
  //              it is listed as "Empty default — not uploaded" and never sent by itself
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
  // The user-font store the whole suite shares (docs/reference/shared-components.md → ivritsuite-fonts):
  // one IndexedDB per origin, records { name, family, bytes: ArrayBuffer, created }, keyed by name. The
  // pages' own copy of the block owns writing from the uploader; this is the module's read/write path for
  // the same store, kept deliberately small and non-evicting (see USER_FONTS.write).
  var FONTS_DB = 'ivritsuite-fonts', FONTS_STORE = 'fonts', FONTS_CAP = 10;
  function fontsTx(mode, fn) {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(makeError('no_fonts', 'IvritSaves: this browser has no IndexedDB')); return; }
      var open;
      try { open = indexedDB.open(FONTS_DB, 1); } catch (e) { reject(e); return; }
      open.onupgradeneeded = function () { var db = open.result; if (!db.objectStoreNames.contains(FONTS_STORE)) db.createObjectStore(FONTS_STORE, { keyPath: 'name' }); };
      open.onerror = function () { reject(open.error); };
      open.onsuccess = function () {
        try {
          var tx = open.result.transaction(FONTS_STORE, mode), req = fn(tx.objectStore(FONTS_STORE));
          tx.oncomplete = function () { resolve(req && req.result); };
          tx.onerror = function () { reject(tx.error); };
          tx.onabort = function () { reject(tx.error); };
        } catch (e) { reject(e); }
      };
    });
  }
  function bytesToB64(buf) {
    var b = new Uint8Array(buf), out = '', CH = 0x8000;
    for (var i = 0; i < b.length; i += CH) out += String.fromCharCode.apply(null, b.subarray(i, i + CH));
    return btoa(out);
  }
  function b64ToBytes(b64) {
    var bin = atob(String(b64 || '')), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  }
  // The fonts a teacher made or uploaded, one row each. The value is exactly the shape the AllTools backup
  // has always used for a font — { name, b64, family } — so the account file and the device file agree; the
  // per-device `created` stamp is deliberately left out, or every device would hash the same font differently.
  var USER_FONTS = {
    cache: null,
    // IndexedDB is async and a plan is assembled synchronously, so the records are read once per listing
    // (planTool primes every virtual store first) and served from this snapshot afterwards.
    prime: function () {
      return fontsTx('readonly', function (os) { return os.getAll(); }).then(function (rows) {
        var out = {};
        (rows || []).forEach(function (r) {
          if (!r || typeof r.name !== 'string' || badName(r.name) || !r.bytes) return;
          try { out[r.name] = { name: r.name, b64: bytesToB64(r.bytes), family: typeof r.family === 'string' && r.family ? r.family : r.name }; } catch (e) {}
        });
        USER_FONTS.cache = out;
      }, function (err) { warn('the fonts store could not be read:', err); if (!USER_FONTS.cache) USER_FONTS.cache = {}; });
    },
    read: function () { var c = USER_FONTS.cache; return (c && Object.keys(c).length) ? c : null; },
    // A download never evicts. The shared `saveUserFont` drops the oldest font once the cap is reached, which
    // is right for an upload the teacher just chose and wrong for a sync: at the cap the row is refused with
    // `cap`, so the run names it and nothing of theirs is deleted.
    write: function (value, name) {
      if (!isPlainObject(value) || typeof value.b64 !== 'string' || !value.b64) throw makeError('shape');
      var cache = USER_FONTS.cache || {};
      if (!hasOwn(cache, name) && Object.keys(cache).length >= FONTS_CAP) throw makeError('cap');
      var bytes;
      try { bytes = b64ToBytes(value.b64); } catch (e) { throw makeError('shape'); }
      var family = (typeof value.family === 'string' && value.family) ? value.family : name;
      return fontsTx('readwrite', function (os) { return os.put({ name: name, family: family, bytes: bytes, created: Date.now() }); }).then(function () {
        cache[name] = { name: name, b64: value.b64, family: family };
        USER_FONTS.cache = cache;
        fontsChanged(name);
        return [name];
      });
    },
    remove: function (name) {
      return fontsTx('readwrite', function (os) { return os.delete(name); }).then(function () {
        if (USER_FONTS.cache) delete USER_FONTS.cache[name];
        fontsChanged(name);
      });
    }
  };
  // No page attaches the Suite tool, so there is no onLocalChanged to call: every font picker listens for
  // this instead and re-runs its own refreshMyFonts().
  function fontsChanged(name) {
    try { window.dispatchEvent(new CustomEvent('ivritsuite:fonts', { detail: { name: name } })); } catch (e) {}
  }
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
      dictEmojiSettings: { key: 'hebrewDictionary_emojiSettings',  json: true, ok: function (v) { return isPlainObject(v); } },
      dictNikudColors:   { key: 'hebrewDictionary_nikudColors',     json: true, ok: function (v) { return isPlainObject(v); } }
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
    // every page — the suite-wide preferences as one row (see SUITE_PREFS above); the hub shows its status line
    { tool: 'Suite', kind: 'prefs', virtual: SUITE_PREFS, shape: 'single', merge: 'assign', ivritKey: 'suitePrefs', label: 'shared.cloud.kind_suite_prefs' },
    // every page with a Hebrew font picker — a teacher's own fonts, one row each with the TTF base64 inside
    // (a Font Maker export or a handwriting face, tens to a few hundred KB; the 1.8 MB row guard refuses a
    // bigger one by name). Without this a synced font name arrives on a second device with no face behind it.
    // noDeleteByAbsence: the shared uploader block evicts the oldest font at the ten-font cap, which is not a
    // deletion — a font row leaves the account only through fontDeleted() (the hub's and the Font Maker's delete).
    { tool: 'Suite', kind: 'font', virtual: USER_FONTS, shape: 'map', merge: 'item', ivritKey: 'userFonts', label: 'shared.cloud.kind_font', noDeleteByAbsence: true },
    // trope_tutor.html — mastery counts merge losslessly (max / union) above a reset watermark; the drawer layout never travels
    { tool: 'TropeTutor', kind: 'progress', lsKey: 'hebrewTropeTutor_progress', shape: 'single', merge: 'deepMax', watermark: 'resetAt', ivritKey: 'tropeTutorProgress', label: 'shared.cloud.kind_progress' },
    { tool: 'TropeTutor', kind: 'settings', lsKey: 'hebrewTropeTutor_settings', shape: 'single', merge: 'assign', omit: ['panelsCollapsed'], ivritKey: 'tropeTutorSettings', label: 'shared.cloud.kind_settings' },
    // torah_trainer.html — one settings blob; the drawer/karaoke-bar layout and the reading position
    // (lastPos carries a timestamp on every scroll, which would keep the row "newer" forever) stay per device
    { tool: 'TorahTrainer', kind: 'settings', lsKey: 'hebrewTorahTrainer_settings', shape: 'single', merge: 'assign', omit: ['*Collapsed', 'lastPos', 'loopVerse'], ivritKey: 'torahTrainerSettings', label: 'shared.cloud.kind_settings' },
    // Favorite readings (the Favorites tab): one row per favorite, plus the folder tree the page merges with ftMergeTrees.
    { tool: 'TorahTrainer', kind: 'favorite', lsKey: 'hebrewTorahTrainer_favorites', shape: 'map', merge: 'item', ivritKey: 'torahTrainerFavorites', label: 'shared.cloud.kind_favorite' },
    { tool: 'TorahTrainer', kind: 'favoriteFolders', lsKey: 'hebrewTorahTrainer_favoritesFolders', shape: 'tree', merge: 'page', follows: 'favorite', ivritKey: 'torahTrainerFavoriteFolders' },
    // flash_cards.html — decks (the page calls them presets) and their folders, the live settings, the best
    // streak, and one row per student profile (privacy.legal.* says student names reach the account while a
    // teacher is signed in) with the profile folders; the page supplies the tree and profile merges
    { tool: 'FlashCards', kind: 'preset', lsKey: 'hebrewFlashCards_presets', shape: 'map', merge: 'item', ivritKey: 'flashCardPresets', label: 'shared.cloud.kind_preset' },
    { tool: 'FlashCards', kind: 'presetFolders', lsKey: 'hebrewFlashCards_presetsFolders', shape: 'tree', merge: 'page', follows: 'preset', ivritKey: 'flashCardPresetFolders' },
    // omit: the four fields shaped by the machine in front of the teacher, not by the lesson — whether this
    // device has speakers, how fast its voice reads, whether its home button is hidden for a kiosk, and
    // whether its printer does two sides. Everything the lesson decides still travels, sizes included, and
    // `listening` with them (a pedagogical choice; a browser without speech only gates the toggle).
    { tool: 'FlashCards', kind: 'settings', lsKey: 'hebrewFlashCards_settings', shape: 'single', merge: 'assign',
      omit: ['audioEnabled', 'ttsRate', 'hideHomeBtn', 'sheetDuplex'], ivritKey: 'flashCardSettings', label: 'shared.cloud.kind_settings' },
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
    // inside that same blob, as their own rows (privacy.legal.* names them) — so the settings row omits
    // them. The page supplies the tree and roster merges.
    { tool: 'Dashboard', kind: 'preset', lsKey: 'hebrewDashboard_presets', shape: 'map', merge: 'item', ivritKey: 'dashboardPresets', label: 'shared.cloud.kind_preset',
      skipUpload: function (name, value) { return name === 'Default' && canonJson(value) === DASHBOARD_DEFAULT_PRESET_CANON; } },
    { tool: 'Dashboard', kind: 'presetFolders', lsKey: 'hebrewDashboard_presetsFolders', shape: 'tree', merge: 'page', follows: 'preset', ivritKey: 'dashboardPresetFolders' },
    { tool: 'Dashboard', kind: 'schedule', lsKey: 'hebrewDashboard_schedules', shape: 'map', merge: 'item', ivritKey: 'dashboardSchedules', label: 'shared.cloud.kind_schedule' },
    { tool: 'Dashboard', kind: 'scheduleFolders', lsKey: 'hebrewDashboard_schedulesFolders', shape: 'tree', merge: 'page', follows: 'schedule', ivritKey: 'dashboardScheduleFolders' },
    { tool: 'Dashboard', kind: 'settings', lsKey: 'hebrewDashboard_settings', shape: 'single', merge: 'assign',
      omit: ['rosters', 'activeRosterId', 'pickerSessions', '_geoCoords', '*Collapsed', 'panelLayout', 'videoLayout', 'zoomLevel', 'hideZoomBar', 'keepAwake', 'lockPanelWidths', 'showTextSizeOptions'],
      ivritKey: 'dashboardSettings', label: 'shared.cloud.kind_settings' },
    { tool: 'Dashboard', kind: 'roster', lsKey: 'hebrewDashboard_settings', shape: 'mapIn', path: 'rosters', nameField: 'name', merge: 'page', ivritKey: 'dashboardRosters', label: 'shared.cloud.kind_roster',
      skipUpload: function (name, value) { return isUntouchedDefaultClass(value); } }
  ];
  var extraEntries = [];   // entries a page registered through attach({ entries }) — the test harness

  var pages = {};          // tool → the cfg given to attach() (an alsoPull tool: a copy marked pulled)
  var statuses = {};       // tool → { root, state, detail } — the status lines
  var plans = {};          // tool → the last classification
  var queues = {};         // tool → promise chain: one cloud operation at a time
  var busy = {};           // tool → true while its queue runs
  var pendingHydrate = {}; // tool → the hydration in flight, so two callers share one
  var hydrating = {};      // tool → true while its rows are being hydrated (the hook only postpones)
  var hydratedTools = {};  // tool → the uid a successful hydration ran for (the hook's install condition)
  var dirty = {};          // tool → kind → true: a page wrote that key since the last flush
  var timers = {};         // tool → the debounce timer
  var stale = {};          // tool → kind → true: another tab wrote that kind; hydrate before diffing
  var hiddenFlushed = false;   // this tab was hidden and wrote what it had then; nothing is typed here until it is shown
  var seenNames = {};      // tool → kind → { name: hash (or true before it is known) } — each item as this tab last saw it
  var tabBase = {};        // tool → kind → { name: canonical JSON } — a settings row as this tab last saw it (its own merge base)
  var hookOn = false;      // write-through is armed (a signed-in hydration ran on this page)
  var hookInstalled = false;
  var selfWrite = 0;       // > 0 while the module itself writes localStorage (the hook ignores those writes)
  var purging = false;     // sign-out removed the cache: registry-key writes are swallowed until the page unloads
  var suspended = false;   // Erase All: nothing goes up any more on this page
  var seen = {};           // tool → kind → the write stamp this tab last acted on, or made itself (recheckWrites)
  var listening = false;
  var listedFor = {};      // tool → the user id an account event last hydrated it for (listen)
  var eventUser = null;    // the user id the last account event was handled for (listen)
  var signedInAt = 0;      // when this tab first saw the current account (a sign-out broadcast older than that is not about this session)
  var card = null;         // the open device-extras card: { root, opener, onKey } or null
  var cardPending = null;  // extras waiting for the card's choice: { uid, tools, extras, resolve }
  var firstHydrationDone = {};   // uid → true once the card's choice settled on this page load
  // The tool names the status line and the card show (the home page's card titles, present in every dictionary).
  var TOOL_NAMES = { Worksheet: ['home.card.generator.name', 'Hebrew Worksheet Generator'], FlashCards: ['home.card.flashcards.name', 'Hebrew Flash Cards'],
                     Dictionary: ['home.card.dictionary.name', 'Hebrew Word Lookup'], TorahTrainer: ['home.card.torah.name', 'Torah Trainer'],
                     TropeTutor: ['home.card.trope.name', 'Trope Tutor'], Dashboard: ['home.card.dashboard.name', 'Hebrew Classroom Dashboard'], Suite: ['shared.cloud.tool_suite', 'IvritSuite'] };
  // The dashboard mints one empty class named "My class" on every fresh device (the literal, in both
  // languages, plus the localized default); untouched, it is a seed, not a class list worth a row.
  function isUntouchedDefaultClass(value) {
    if (!isPlainObject(value) || (Array.isArray(value.names) && value.names.length)) return false;
    var name = typeof value.name === 'string' ? value.name.trim() : '';
    return name === '' || name === 'My class' || name === t('dashboard.picker.default_class_name', 'My class');
  }

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
  // What travels: the value minus its per-device fields (only a plain object has fields to strip). A folder tree
  // travels minus the names of seeds (an item its followed kind never uploads, such as the dashboard's untouched
  // "Default" preset): the shared tree component appends every local name to the tree and prunes every name it
  // lacks, so a seed's name in the account's tree would make a device that holds the seed and one that does not
  // trade a tree write on every load. Dropped from the hash on both sides, the seed stays a local placement only.
  function project(entry, value) {
    if (entry.shape === 'tree' && entry.follows && isPlainObject(value) && Array.isArray(value.root)) return stripSeedItems(entry, value);
    if (!entry.omit || !entry.omit.length || !isPlainObject(value)) return value;
    var out = {};
    for (var k in value) if (hasOwn(value, k) && !isOmitted(entry, k)) out[k] = value[k];
    return out;
  }
  function stripSeedItems(entry, tree) {
    var followed = entryFor(entry.tool, entry.follows);
    if (!followed || typeof followed.skipUpload !== 'function') return tree;
    var seeds = {}, any = false;
    localItems(followed).forEach(function (it) { if (isSeed(followed, it.name, it.value)) { seeds[it.name] = true; any = true; } });
    if (!any) return tree;
    var walk = function (nodes) {
      var out = [];
      nodes.forEach(function (n) {
        if (!isPlainObject(n)) return;
        if (n.t === 'item') { if (!seeds[n.name]) out.push(n); return; }
        if (n.t === 'folder') { var c = {}; for (var k in n) if (hasOwn(n, k)) c[k] = n[k]; c.children = walk(Array.isArray(n.children) ? n.children : []); out.push(c); return; }
        out.push(n);
      });
      return out;
    };
    var copy = {};
    for (var k in tree) if (hasOwn(tree, k)) copy[k] = tree[k];
    copy.root = walk(tree.root);
    return copy;
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
  // objects recurse, arrays and anything else keep this device's side. Nothing recorded goes down —
  // except below a reset: with a `watermark` field (the Trope Tutor's resetAt), the side whose watermark
  // is older counts as empty, so a deliberate reset is not undone by another device's older mastery, and
  // the result keeps the newest watermark.
  function deepMaxInner(a, b) {
    if (a === undefined || a === null) return b;
    if (b === undefined || b === null) return a;
    if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
    if (isPlainObject(a) && isPlainObject(b)) {
      var out = {}, k;
      for (k in a) if (hasOwn(a, k) && !badName(k)) out[k] = hasOwn(b, k) ? deepMaxInner(a[k], b[k]) : a[k];
      for (k in b) if (hasOwn(b, k) && !badName(k) && !hasOwn(a, k)) out[k] = b[k];
      return out;
    }
    if (numeric(a) && numeric(b)) return maxValue(a, b);
    return a;
  }
  function deepMax(a, b, watermark) {
    if (watermark && isPlainObject(a) && isPlainObject(b)) {
      var wa = numeric(a[watermark]) ? Number(a[watermark]) : 0, wb = numeric(b[watermark]) ? Number(b[watermark]) : 0;
      if (wa !== wb) {
        var newer = wa > wb ? a : b, older = wa > wb ? b : a;
        var kept = {};   // the older side keeps only its watermark-free scaffolding, not its counts
        for (var k in older) if (hasOwn(older, k) && !badName(k) && (k === 'v')) kept[k] = older[k];
        var out = deepMaxInner(newer, kept);
        out[watermark] = Math.max(wa, wb);
        return out;
      }
    }
    return deepMaxInner(a, b);
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
  // Every write the module makes runs inside selfWrite(), so the write-through hook (below) never mistakes
  // a download or a memory save for a page write.
  function withSelfWrite(fn) { selfWrite++; try { return fn(); } finally { selfWrite--; } }
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
  function isSeed(entry, name, value) { try { return !!(typeof entry.skipUpload === 'function' && entry.skipUpload(name, value)); } catch (e) { return false; } }
  function writeText(key, text) {
    try { withSelfWrite(function () { localStorage.setItem(key, text); }); } catch (e) { return Promise.reject(makeError('quota', 'IvritSaves: localStorage write failed')); }
    if (lsGet(key) !== text) return Promise.reject(makeError('quota', 'IvritSaves: localStorage read-back mismatch'));
    return Promise.resolve();
  }
  // map / mapIn: the one item is set (a new name lands at the end, like the tool's own writer);
  // single / tree: the whole value; scalar: the plain string.
  var virtualChanged = null;   // the field names the last virtual write changed, read by the tail
  function localWrite(entry, name, value) {
    if (badName(name)) return Promise.reject(makeError('name'));
    if (entry.virtual) {
      return Promise.resolve().then(function () { return withSelfWrite(function () { return entry.virtual.write(value, name); }); }).then(function (changed) {
        virtualChanged = changed || null;
        stampWrite(entry, name);
      }, function (e) { throw (e && e.code) ? e : makeError('quota', 'IvritSaves: the write failed'); });
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
  // Removes one item (map / mapIn) or the whole key (single / scalar / tree). Used by hydration (a row gone
  // from the account), the card's "Remove from this device", sign-out, and the harness's cleanup.
  function localRemove(entry, name) {
    if (entry.virtual) return Promise.resolve().then(function () { return withSelfWrite(function () { return entry.virtual.remove(name); }); });
    var store = readStore(entry);
    if (entry.shape === 'map') {
      if (store && hasOwn(store, name)) { delete store[name]; return writeText(entry.lsKey, JSON.stringify(store)); }
      return Promise.resolve();
    }
    if (entry.shape === 'mapIn') {
      if (store && isPlainObject(store[entry.path]) && hasOwn(store[entry.path], name)) { delete store[entry.path][name]; return writeText(entry.lsKey, JSON.stringify(store)); }
      return Promise.resolve();
    }
    withSelfWrite(function () { lsRemove(entry.lsKey); });
    return Promise.resolve();
  }
  // A single entry whose lsKey another entry shares (the Dashboard's settings and rosters): strip only this
  // entry's projected fields, so a sibling's items survive.
  function localStripProjected(entry) {
    var store = readStore(entry);
    if (!isPlainObject(store)) return Promise.resolve();
    var kept = {};
    for (var k in store) if (hasOwn(store, k) && isOmitted(entry, k)) kept[k] = store[k];
    if (!Object.keys(kept).length && !sharesKey(entry)) { withSelfWrite(function () { lsRemove(entry.lsKey); }); return Promise.resolve(); }
    return writeText(entry.lsKey, JSON.stringify(kept));
  }
  function sharesKey(entry) {
    return !entry.virtual && registryAll().some(function (e) { return e !== entry && !e.virtual && e.lsKey === entry.lsKey; });
  }

  /* ---------- cross-tab write stamps (the old key, read by every module version) ---------- */
  // Other tabs of the same tool learn about a write through this key — its `storage` event, or a look at the
  // stamps when the tab next becomes visible (see recheckWrites) — and re-read the key; otherwise their next
  // in-memory save would revert it. `lastWrite` names the write; `written` keeps one stamp per tool and kind,
  // overwritten in place; `source` says whether a page or the module wrote (a page write only marks other
  // tabs stale, a module write — a download — makes them re-read). Signed in only: anonymous use never creates
  // the key (the harness's local round trip stays silent).
  function stampsAll() {
    try { var m = safeParse(lsGet(META_KEY) || 'null'); if (isPlainObject(m)) return m; } catch (e) {}
    return { v: 1, users: {} };
  }
  function stampsSave(m) {
    try {
      var cur = null;
      try { cur = safeParse(lsGet(META_KEY) || 'null'); } catch (e) {}
      if (isPlainObject(cur)) {   // another tab may have moved a stamp meanwhile: keep the newer one per tool and kind
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
        var pwc = isPlainObject(cur.pageWrites) ? cur.pageWrites : {};
        Object.keys(pwc).forEach(function (tool) {
          if (!isPlainObject(pwc[tool])) return;
          Object.keys(pwc[tool]).forEach(function (kind) {
            var at = pwc[tool][kind];
            if (typeof at !== 'number') return;
            if (!isPlainObject(m.pageWrites)) m.pageWrites = {};
            if (!isPlainObject(m.pageWrites[tool])) m.pageWrites[tool] = {};
            if (!(m.pageWrites[tool][kind] >= at)) m.pageWrites[tool][kind] = at;
          });
        });
        var lw = cur.lastWrite;
        if (isPlainObject(lw) && typeof lw.at === 'number' && !(isPlainObject(m.lastWrite) && m.lastWrite.at >= lw.at)) m.lastWrite = lw;
        if (isPlainObject(cur.signedOut) && !(isPlainObject(m.signedOut) && m.signedOut.at >= cur.signedOut.at)) m.signedOut = cur.signedOut;
      }
      withSelfWrite(function () { localStorage.setItem(META_KEY, JSON.stringify(m)); });
    } catch (e) {}
  }
  function stampWrite(entry, name, source) {
    if (!currentUser()) return;
    var m = stampsAll(), at = Date.now();
    m.lastWrite = { tool: entry.tool, kind: entry.kind, name: name, at: at, source: source || 'module' };
    if (!isPlainObject(m.written)) m.written = {};
    if (!isPlainObject(m.written[entry.tool])) m.written[entry.tool] = {};
    m.written[entry.tool][entry.kind] = at;
    if (source === 'page') {   // which stamps were page writes (other tabs only mark those stale)
      if (!isPlainObject(m.pageWrites)) m.pageWrites = {};
      if (!isPlainObject(m.pageWrites[entry.tool])) m.pageWrites[entry.tool] = {};
      m.pageWrites[entry.tool][entry.kind] = at;
    }
    markSeen(entry.tool, entry.kind, at);   // this tab's own write is not news to it
    stampsSave(m);
  }
  function markSeen(tool, kind, at) { if (!isPlainObject(seen[tool])) seen[tool] = {}; seen[tool][kind] = at; }
  // The stamps as one map tool → kind → at: `written`, with `lastWrite` folded in.
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

  /* ---------- sync memory v2: what this device last synced, per account ---------- */
  // { v:2, users:{ [uid]: { tool: { kind: { name: {h,id,u,at} } } } }, legacy:{ [uid]: … }, hydrated:{ [uid]: ISO }, held }
  // A stored v1 memory (the old module's key) becomes `legacy`: a hint used only to tell "newer here" from
  // "newer in the account" on a row's first classification — never for a deletion. Under the old model a
  // local delete deliberately kept the account copy, so an old memory read by the new rules would DELETE rows.
  function metaAll() {
    try { var m = safeParse(lsGet(META2_KEY) || 'null'); if (isPlainObject(m) && m.v === 2 && isPlainObject(m.users)) return m; } catch (e) {}
    var fresh = { v: 2, users: {}, legacy: {}, hydrated: {} };
    try {
      var old = safeParse(lsGet(META_KEY) || 'null');
      if (isPlainObject(old) && old.v === 1 && isPlainObject(old.users)) { fresh.legacy = clone(old.users); if (isPlainObject(old.held)) fresh.held = clone(old.held); }
    } catch (e) {}
    return fresh;
  }
  function metaSave(m) { try { withSelfWrite(function () { localStorage.setItem(META2_KEY, JSON.stringify(m)); }); } catch (e) {} }
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
  // The v1 hint for a row (h, id, u), or null; consumed by the first v2 record of that row.
  function legacyGet(uid, tool, kind, name) {
    var m = metaAll(), l = isPlainObject(m.legacy) && isPlainObject(m.legacy[uid]) ? m.legacy[uid] : null;
    var b = l && isPlainObject(l[tool]) && isPlainObject(l[tool][kind]) ? l[tool][kind] : null;
    var r = b && hasOwn(b, name) && isPlainObject(b[name]) ? b[name] : null;
    return (r && typeof r.h === 'string' && !r.deletedCloud) ? { h: r.h, id: r.id, u: r.u } : null;
  }
  function metaSet(uid, tool, kind, name, rec) {
    if (!uid || badName(name)) return;
    var m = metaAll();
    metaBranch(m, uid, tool, kind, true)[name] = rec;
    var l = isPlainObject(m.legacy) && isPlainObject(m.legacy[uid]) && isPlainObject(m.legacy[uid][tool]) && isPlainObject(m.legacy[uid][tool][kind]) ? m.legacy[uid][tool][kind] : null;
    if (l && hasOwn(l, name)) delete l[name];
    metaSave(m);
  }
  function metaDelete(uid, tool, kind, name) {
    var m = metaAll(), b = metaBranch(m, uid, tool, kind, false);
    if (b && hasOwn(b, name)) { delete b[name]; metaSave(m); }
    baseDelete(uid, tool, kind, name);
  }
  /* ---------- the base of a settings row (what both sides last agreed on) ---------- */
  // Kept only for `assign` rows (settings blobs, the suite-wide preferences, the remembered worksheet setup): the
  // projected value as canonical JSON with its hash. A conflict on such a row is then merged field by field — a
  // field only one side changed since the base takes that side's value — instead of one whole side winning.
  function baseAll() { try { var b = safeParse(lsGet(BASE_KEY) || 'null'); if (isPlainObject(b) && b.v === 1 && isPlainObject(b.users)) return b; } catch (e) {} return { v: 1, users: {} }; }
  function baseSave(b) { try { withSelfWrite(function () { localStorage.setItem(BASE_KEY, JSON.stringify(b)); }); } catch (e) {} }
  function baseKey(tool, kind, name) { return tool + '/' + kind + '/' + name; }
  function baseGet(uid, tool, kind, name) { var b = baseAll(), u = b.users[uid]; var r = isPlainObject(u) ? u[baseKey(tool, kind, name)] : null; return (isPlainObject(r) && typeof r.h === 'string' && typeof r.text === 'string') ? r : null; }
  function baseDelete(uid, tool, kind, name) {
    var raw = lsGet(BASE_KEY); if (raw === null) return;
    var b = baseAll(), u = b.users[uid], k = baseKey(tool, kind, name);
    if (isPlainObject(u) && hasOwn(u, k)) { delete u[k]; baseSave(b); }
  }
  // A row whose stored copy derives from an older view than the memory's (this tab's page was behind when it wrote):
  // remembered against that view — its hash, no stamp (so the account reads as moved too), and for a settings row the
  // view itself as the merge base — so whichever tab next compares it merges a settings row field by field, keeps
  // both copies of an item and merges a class list, rather than sending the older copy up as "changed here".
  function rememberView(uid, tool, entry, name, seenH, mem) {
    if (!mem || !mem.id) return;
    metaSet(uid, tool, entry.kind, name, { h: seenH, id: mem.id, u: null, at: now() });
    var view = entry.merge === 'assign' ? tabBaseOf(tool, entry.kind, name) : null;
    if (view) { var b = baseAll(); if (!isPlainObject(b.users[uid])) b.users[uid] = {}; b.users[uid][baseKey(tool, entry.kind, name)] = { h: seenH, text: view }; baseSave(b); }
    else if (entry.merge === 'assign') baseDelete(uid, tool, entry.kind, name);
  }
  // This tab wrote a kind another tab has written since this tab last read it (a page-write stamp marked it stale):
  // every row of it this tab saw at an older version than the memory's is remembered against that view. The write
  // may never be followed by this tab's own corrective hydration (the tab is closing, the network is gone), and the
  // next tab to open — tomorrow — must not take the older copy for this device's newer edit.
  function persistStaleView(tool, kind) {
    var user = currentUser(); if (!user) return;
    if (!(stale[tool] && stale[tool][kind])) return;
    var entry = entryFor(tool, kind);
    if (!entry || entry.virtual || entry.shape === 'tree') return;
    var seen = seenNames[tool] && seenNames[tool][kind];
    if (!isPlainObject(seen)) return;
    Object.keys(seen).forEach(function (name) {
      var seenH = seen[name];
      if (typeof seenH !== 'string') return;
      var mem = metaGet(user.id, tool, kind, name);
      if (mem && mem.id && mem.h !== seenH) rememberView(user.id, tool, entry, name, seenH, mem);
    });
  }
  // After a row was remembered at hash h: the local item's projected value becomes the base when it still hashes to h.
  function rememberBase(uid, tool, kind, name, h) {
    var entry = entryFor(tool, kind);
    if (!entry || entry.merge !== 'assign') return;
    var it = localItem(entry, name);
    if (!it) return;
    var text = canonJson(project(entry, it.value));
    if (text.length > MAX_BYTES) return;
    Promise.resolve(hashText(text)).then(function (hh) {
      if (hh !== h || !stillMe(uid)) return;
      var b = baseAll(); if (!isPlainObject(b.users[uid])) b.users[uid] = {};
      b.users[uid][baseKey(tool, kind, name)] = { h: h, text: text };
      baseSave(b);
    }).catch(noop);
  }
  // The field-by-field merge of a settings row: per top-level field, a value only one side changed since the base
  // takes that side's; a field both changed to different values takes the side changed last (`preferLocal`).
  // A field removed on the winning side stays removed. Pure.
  function merge3(base, local, cloud, preferLocal) {
    var out = {}, keys = {}, k;
    [base, local, cloud].forEach(function (o) { if (isPlainObject(o)) for (k in o) if (hasOwn(o, k) && !badName(k)) keys[k] = true; });
    var c = function (o, key) { return (isPlainObject(o) && hasOwn(o, key)) ? canonJson(o[key]) : '\u0000none'; };
    Object.keys(keys).forEach(function (key) {
      var b = c(base, key), l = c(local, key), r = c(cloud, key), side;
      if (l === r || r === b) side = local; else if (l === b) side = cloud; else side = preferLocal ? local : cloud;
      if (isPlainObject(side) && hasOwn(side, key)) out[key] = side[key];
    });
    return out;
  }
  /* ---------- a device's own settings the account's copy replaced (first sign-in), kept for download ---------- */
  function replacedAll() { try { var r = safeParse(lsGet(REPLACED_KEY) || 'null'); if (isPlainObject(r) && r.v === 1 && isPlainObject(r.users)) return r; } catch (e) {} return { v: 1, users: {} }; }
  function replacedSave(r) {
    try {
      withSelfWrite(function () {
        var empty = !Object.keys(r.users).some(function (u) { return isPlainObject(r.users[u]) && Object.keys(r.users[u]).length; });
        if (empty) localStorage.removeItem(REPLACED_KEY); else localStorage.setItem(REPLACED_KEY, JSON.stringify(r));
      });
    } catch (e) {}
  }
  function replacedFor(uid, tool, why) {
    var u = replacedAll().users[uid];
    if (!isPlainObject(u)) return [];
    return Object.keys(u).filter(function (k) { return isPlainObject(u[k]) && (!tool || u[k].tool === tool) && (!why || replacedWhy(u[k]) === why); }).map(function (k) { return u[k]; });
  }
  // `why`: 'signin' — the account's copy replaced this device's at a first sign-in (the device's kept); 'both' — this
  // device and another changed the same setting, one change was kept and this is the other version.
  function replacedKeep(uid, entry, name, value, why) {
    var text = canonJson(value);
    if (text.length > MAX_BYTES) return;
    var r = replacedAll(); if (!isPlainObject(r.users[uid])) r.users[uid] = {};
    var w = why === 'both' ? 'both' : 'signin';   // one slot per reason: a later conflict never overwrites the copy kept at a first sign-in
    r.users[uid][baseKey(entry.tool, entry.kind, name) + (w === 'both' ? '#both' : '')] = { tool: entry.tool, kind: entry.kind, name: name, at: now(), why: w, value: value };
    replacedSave(r);
  }
  function replacedWhy(x) { return x && x.why === 'both' ? 'both' : 'signin'; }
  // A field-by-field merge dropped a value `side` had changed (against `base`): that side's version is the one to keep.
  function lostFields(base, side, merged) {
    var c = function (o, key) { return (isPlainObject(o) && hasOwn(o, key)) ? canonJson(o[key]) : '\u0000none'; };
    return isPlainObject(side) && Object.keys(side).some(function (k) { return !badName(k) && c(side, k) !== c(base, k) && c(merged, k) !== c(side, k); });
  }
  function replacedDrop(uid, tool, why) {
    var r = replacedAll(), u = r.users[uid];
    if (!isPlainObject(u)) return;
    Object.keys(u).forEach(function (k) { if (isPlainObject(u[k]) && u[k].tool === tool && (!why || replacedWhy(u[k]) === why)) delete u[k]; });
    replacedSave(r);
  }
  function replacedDownload(uid, tool, why) {
    var list = replacedFor(uid, tool, why);
    if (!list.length) return;
    var rows = list.map(function (x) { return { tool: x.tool, kind: x.kind, name: x.name, data: x.value }; });
    var b = bundleFromRows(registryFor(tool), rows);
    downloadJson({ _ivritSuite: 1, format: 'ivrit-save', version: 1, tool: 'AllTools', partial: true, savedAt: now(), data: b.data }, 'IvritSuite_' + tool + (why === 'both' ? '_settings_other_version_' : '_settings_before_sign_in_') + now().slice(0, 10) + '.ivrit');
  }
  function hydratedAt(uid) { var m = metaAll(); return (isPlainObject(m.hydrated) && m.hydrated[uid]) || null; }
  function markHydrated(uid) { var m = metaAll(); if (!isPlainObject(m.hydrated)) m.hydrated = {}; m.hydrated[uid] = now(); metaSave(m); }
  // "Remove from this device" on the card: the device's settings rows and trees go into the account only once they
  // change. Kept per account in the sync memory as name → the hash they had then.
  function holdBack(uid, tool, kind, name, h) {
    var m = metaAll(); if (!isPlainObject(m.noUpload)) m.noUpload = {}; if (!isPlainObject(m.noUpload[uid])) m.noUpload[uid] = {};
    m.noUpload[uid][baseKey(tool, kind, name)] = h; metaSave(m);
  }
  // A settings row a button sign-out removed from this device: what the page writes there afterwards is its own
  // defaults (or signed-out use), so when the account's copy lands at the next sign-in it is not kept as "this device's
  // earlier settings" (the replaced copy would be a false alarm at every sign-in on a shared computer).
  function markStripped(uid, tool, kind, name) {
    var m = metaAll(); if (!isPlainObject(m.stripped)) m.stripped = {}; if (!isPlainObject(m.stripped[uid])) m.stripped[uid] = {};
    m.stripped[uid][baseKey(tool, kind, name)] = true; metaSave(m);
  }
  function takeStripped(uid, tool, kind, name) {
    var m = metaAll(), u = isPlainObject(m.stripped) ? m.stripped[uid] : null, k = baseKey(tool, kind, name);
    if (!isPlainObject(u) || !hasOwn(u, k)) return false;
    delete u[k]; metaSave(m); return true;
  }
  function heldBack(uid, tool, kind, name, h) {
    var m = metaAll(), u = isPlainObject(m.noUpload) ? m.noUpload[uid] : null, k = baseKey(tool, kind, name);
    if (!isPlainObject(u) || !hasOwn(u, k)) return false;
    if (u[k] === h) return true;
    delete u[k]; metaSave(m);   // changed since: it goes up like any other edit
    return false;
  }
  // The device was signed out (a session that ended by itself, a sign-out seen at load): the next sign-in is a first
  // hydration again — this device's own new items are asked about on the card, and a remembered item absent here is
  // downloaded rather than deleted from the account (signed out, the device is its own). The sync memory itself is
  // kept, so an edit made since (an unflushed one, or one made signed out) still reads as changed here and goes up
  // instead of being replaced by the account's older copy.
  function dropHydrated(uid) {
    var m = metaAll();
    if (!isPlainObject(m.hydrated)) return;
    if (uid) { if (!m.hydrated[uid]) return; delete m.hydrated[uid]; }
    else { if (!Object.keys(m.hydrated).length) return; m.hydrated = {}; }
    metaSave(m);
    if (uid) delete firstHydrationDone[uid]; else firstHydrationDone = {};
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
  // The suite-wide preferences this device could not apply (SUITE_PREFS): { field: { v, was } }.
  function suiteHeld() { var m = metaAll(); return isPlainObject(m.held) ? m.held : {}; }
  function suiteHeldSave(held) { var m = metaAll(); if (Object.keys(held).length) m.held = held; else delete m.held; metaSave(m); }

  /* ---------- the cloud backend (the saves table through IvritAccount.client()) ---------- */
  function client() {
    var a = A();
    if (!a) return Promise.reject(makeError('disabled', 'IvritSaves: IvritAccount is not loaded'));
    return a.client();
  }
  function currentUser() { var a = A(); return (a && typeof a.user === 'function') ? a.user() : null; }
  // A PostgREST error carries no HTTP status of its own (the response does): keep it on the error, so a 401 —
  // the request reached the database as not signed in, a token mid-refresh in another tab — takes the retry below.
  function unwrap(r) {
    if (r && r.error) { var e = r.error; if (r.status && e && typeof e === 'object' && !e.status) { try { e.status = r.status; } catch (x) {} } throw e; }
    return r ? r.data : null;
  }
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
  // One tool (a string) or several (an array — one request, the rows carrying their `tool`: kinds repeat
  // across tools, so the caller groups by it). No data: about 150 bytes per row.
  // The listing is the only signal that a row left the account, so it must be complete: the first page asks for the
  // exact count and paging goes on until that many rows arrived (a server whose page size is below PAGE_SIZE would
  // otherwise end the listing early, and every row past it would read as deleted). Rows are kept once by id (a row
  // inserted elsewhere between two pages shifts the next page by one), and a listing that still ends with fewer rows
  // than that count (a row deleted elsewhere between two pages shifts one out of sight) is refused.
  function cloudList(toolOrTools) {
    var many = Array.isArray(toolOrTools), all = [], total = null, ids = {};
    function page(from) {
      return withClient(function (c) {
        var q = c.from('saves').select(many ? 'tool, ' + ROW_COLS : ROW_COLS, from === 0 ? { count: 'exact' } : undefined);
        q = many ? q.in('tool', toolOrTools) : q.eq('tool', toolOrTools);
        return q.order('tool').order('kind').order('name').order('id').range(from, from + PAGE_SIZE - 1)
          .then(function (r) { return (r && !r.error) ? { data: { rows: r.data || [], count: r.count }, error: null } : r; });
      }).then(function (res) {
        var rows = (res && res.rows) || [];
        if (from === 0 && res && typeof res.count === 'number') total = res.count;
        if (!many) rows.forEach(function (r) { r.tool = toolOrTools; });
        rows.forEach(function (r) { var k = r && r.id ? String(r.id) : null; if (k && hasOwn(ids, k)) return; if (k) ids[k] = true; all.push(r); });
        if (total !== null) {
          if (rows.length && all.length < total) return page(from + rows.length);
          if (all.length < total) throw makeError('listing_suspect', 'IvritSaves: the listing came back shorter than its count');
          return all;
        }
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
    return withClient(function (c) { return c.from('saves').select('id, kind, name, data, data_hash, bytes, updated_at, client_updated_at').eq('id', id).maybeSingle(); })
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
  // overwritten unseen; zero rows back means "changed meanwhile: list again and decide again".
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
  // Deletes only if the row is still the one this device synced: zero rows back means another device wrote
  // it since — the later human action wins, so the caller downloads instead.
  function cloudRemoveIf(id, expectedUpdatedAt) {
    return withClient(function (c) { return c.from('saves').delete().eq('id', id).eq('updated_at', expectedUpdatedAt).select('id'); })
      .then(function (rows) { if (!rows || !rows.length) throw makeError('changed', 'IvritSaves: the row changed meanwhile'); return true; });
  }
  // Does the account still exist? (A listing that lacks every remembered row is checked here first: a
  // still-valid token on a device whose account was deleted elsewhere lists nothing under RLS.)
  // Gone only on a definite answer (the auth server no longer knows the user, or the profile row is gone); a network
  // failure or a timeout is "don't know", which counts as alive — nothing is ever removed on a guess.
  function accountAlive() {
    return client().then(function (c) { return c.auth.getUser(); }).then(function (r) {
      if (r && r.error && (isConnectionError(r.error) || !r.error.status || r.error.status >= 500 || r.error.name === 'AuthRetryableFetchError')) return true;
      if (!r || r.error || !r.data || !r.data.user) return false;
      return withClient(function (c) { return c.from('profiles').select('id').eq('id', r.data.user.id).maybeSingle(); }).then(function (p) { return !!p; }, function () { return true; });   // profiles unreachable: not a deletion
    }, function () { return true; });
  }
  function accountAliveWithin(ms) { return Promise.race([accountAlive().catch(function () { return true; }), new Promise(function (r) { setTimeout(function () { r(true); }, ms); })]); }
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
  function registryAll() { return IVRIT_SYNC_REGISTRY.concat(extraEntries); }
  function registryFor(tool) {
    return registryAll().filter(function (e) { return e.tool === tool; });
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
    if (e.skipUpload !== undefined && typeof e.skipUpload !== 'function') return 'skipUpload must be a function';
    return null;
  }
  function keyOf(kind, name) { return kind + ':' + name; }   // a kind is letters only, so the first ':' always ends it
  function hashItem(entry, value) { return hashText(canonJson(project(entry, value))); }

  /* ---------- the classification: one row per kind + name across both sides ---------- */
  // local / cloud: { hash } or null (cloud also carries updatedAt); memory: what this device last synced
  // for the item, or null. The row's updated_at matching the memory is what says "the cloud copy is
  // the one I synced" — the hash in `data_hash` is only a shortcut.
  //   local-only     the device has it, the account does not (a new save, a device extra, or — with memory —
  //                  a row the account lost: "cloud gone")
  //   cloud-only     the account has it, the device does not (with memory: "deleted here")
  //   synced         the same on both sides
  //   cloud-changed  only the account moved since the last sync → download
  //   local-changed  only this device moved → upload
  //   conflict       both moved, or no memory and different hashes
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
  function localSide(tool) {
    var items = [];
    registryFor(tool).forEach(function (e) { if (e.shape !== 'tree') items = items.concat(localItems(e)); });
    return seqMap(items, function (it) {
      var text = canonJson(project(it.entry, it.value));
      it.bytes = byteLength(text);
      return hashText(text).then(function (h) { it.hash = h; return it; });
    });
  }
  // A class list or word list only the account holds is keyed by an id, and its display name lives inside
  // the row's data, which the listing does not carry: read it once per row version (kept for the page's
  // life), so the panel says "Kitah Alef", not the id. A failed read keeps the id; nothing else changes.
  var cloudLabels = {};   // row id → { u: updated_at, label }
  function noteCloudLabel(entry, row, full) {
    var v = full && full.data, label = null;
    if (isPlainObject(v) && typeof v[entry.nameField] === 'string' && v[entry.nameField]) label = v[entry.nameField];
    cloudLabels[row.id] = { u: row.updated_at, label: label };
    return label;
  }
  function cloudLabelFor(entry, row) {
    var c = cloudLabels[row.id];
    if (c && c.u === row.updated_at) return Promise.resolve(c.label);
    return cloudLoad(row.id).then(function (full) { return noteCloudLabel(entry, row, full); }, function () { return null; });
  }
  function cloudHashFor(entry, row, mem) {
    if (mem && mem.id === row.id && mem.u === row.updated_at) return Promise.resolve(mem.h);
    if (typeof row.data_hash === 'string' && row.data_hash.indexOf(currentPrefix()) === 0) return Promise.resolve(row.data_hash);
    return cloudLoad(row.id).then(function (full) {   // unknown: hash it here — and a row read for its hash also gives its name
      if (entry.shape === 'mapIn' && entry.nameField) noteCloudLabel(entry, row, full);
      return hashItem(entry, full.data);
    });
  }
  // A virtual store backed by something asynchronous (the fonts IndexedDB) reads itself into a snapshot
  // first, so the plan below can stay synchronous. Never on an anonymous page: opening a database an
  // anonymous visit would not otherwise open is exactly the kind of change the byte-identical bar forbids.
  function primeVirtual(tool) {
    var vs = registryFor(tool).filter(function (e) { return e.virtual && typeof e.virtual.prime === 'function'; });
    return seqMap(vs, function (e) {
      return Promise.resolve().then(function () { return e.virtual.prime(); }).catch(function (err) { warn('prime failed for', e.kind, err); });
    });
  }
  // The classification of one tool: the local side hashed, the account's rows (pre-listed by hydrate for
  // several tools at once, or listed here), the memory — a v1 hint standing in for a row this device never
  // recorded under v2 — and a state per row. Signed out, every local item reads local-only.
  function planTool(tool, preRows) {
    var user = currentUser();
    var uid = user ? user.id : null;
    return (uid ? primeVirtual(tool) : Promise.resolve()).then(function () { return localSide(tool); }).then(function (locals) {
      var rows = {}, order = [];
      locals.forEach(function (it) {
        var k = keyOf(it.kind, it.name);
        rows[k] = { key: k, kind: it.kind, name: it.name, label: it.label, entry: it.entry, local: { hash: it.hash, bytes: it.bytes }, cloud: null, memory: null,
                    seed: isSeed(it.entry, it.name, it.value) };
        order.push(k);
      });
      if (!uid) return finishPlan(tool, null, rows, order, []);
      return (preRows ? Promise.resolve(preRows.filter(function (r) { return r.tool === tool; })) : cloudList(tool)).then(function (cloudRows) {
        var listed = cloudRows.filter(function (r) { var e = entryFor(tool, r.kind); return e && e.shape !== 'tree' && !badName(r.name); });
        return seqMap(listed, function (r) {
          var e = entryFor(tool, r.kind);
          return cloudHashFor(e, r, metaGet(uid, tool, r.kind, r.name) || legacyGet(uid, tool, r.kind, r.name)).then(function (h) {
            var k = keyOf(r.kind, r.name);
            if (!rows[k]) {
              rows[k] = { key: k, kind: r.kind, name: r.name, label: (e.shape === 'map' || e.shape === 'mapIn') ? r.name : kindLabel(e), entry: e, local: null, cloud: null, memory: null };
              order.push(k);
            }
            rows[k].cloud = { id: r.id, hash: h, bytes: r.bytes, updatedAt: r.updated_at };
            if (!rows[k].local && e.shape === 'mapIn' && e.nameField) return cloudLabelFor(e, r).then(function (label) { if (label) rows[k].label = label; });
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
      // A v1 hint decides only between the two moved states, never a deletion: with a hint and no v2 memory a
      // row present on both sides classifies as under v1; one present on one side only is local-only / cloud-only.
      var hint = (uid && !r.memory && r.local && r.cloud) ? legacyGet(uid, tool, r.kind, r.name) : null;
      r.legacy = !!hint;
      r.state = classify(r.local, r.cloud, r.memory || hint);
      keep[r.kind] = keep[r.kind] || {};
      keep[r.kind][r.name] = true;
      if (uid && r.state === 'synced' && r.local && r.cloud && (!r.memory || r.memory.h !== r.local.hash || r.memory.u !== r.cloud.updatedAt)) {
        metaSet(uid, tool, r.kind, r.name, { h: r.local.hash, id: r.cloud.id, u: r.cloud.updatedAt, at: now() });
        r.memory = metaGet(uid, tool, r.kind, r.name);
      }
      // A tool this page renders needs its re-read hook before a settings blob may land; a tool this page
      // does not render holds nothing in memory here (other tabs re-read through the write stamp).
      r.downloadable = pages[tool] ? !(NEEDS_HOOK[r.entry.shape] && !r.entry.virtual && typeof cfg.onLocalChanged !== 'function') : true;   // a virtual store (the preferences) applies a download itself
      r.mergeable = r.entry.merge === 'deepMax' || r.entry.merge === 'max' || (r.entry.merge === 'page' && typeof (cfg.merges && cfg.merges[r.kind]) === 'function');
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
    var p = { tool: tool, userId: uid, rows: list, cloudRows: cloudRows, treesDiffer: [] };
    var trees = uid ? entries.filter(function (e) { return e.shape === 'tree'; }) : [];
    return seqMap(trees, function (e) { return treeDiffers(tool, uid, e, cloudRows, list); }).then(function (diffs) {
      p.treesDiffer = diffs.filter(Boolean);
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
    if (staleWhileHidden(tool)) return;
    if (cfg && typeof cfg.flush === 'function') { try { cfg.flush(); } catch (e) { warn('flush failed:', e); } }
  }
  // A hidden tab wrote what it had when it was hidden. Once another tab has written this tool since, the hidden
  // tab's in-memory copy is the older one: writing it again (a background hydration, a retry, closing the tab) would
  // undo that tab's newer edit before it reached the account, so the module does not ask the page to write it.
  function staleWhileHidden(tool) {
    return hiddenFlushed && !!stale[tool] && Object.keys(stale[tool]).length > 0;
  }
  // Tells the page to re-read the key. Returns false when the page's hook threw: its in-memory copy is then
  // stale and would write back over what was just stored, so the caller must not remember the write.
  // `pending`: the device-extras card is still open, so a page's same-name fold must wait (the dashboard).
  function notifyPage(tool, kind, name, names) {
    var cfg = pages[tool];
    if (!cfg || typeof cfg.onLocalChanged !== 'function') return true;
    try { cfg.onLocalChanged(kind, name, names || (name ? [name] : []), { pending: !!cardPending }); return true; } catch (e) { warn('onLocalChanged failed:', e); return false; }
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
    if (!stillMe(uid)) return;
    metaSet(uid, tool, kind, name, { h: h, id: saved.id, u: saved.updated_at, at: now() });
    rememberBase(uid, tool, kind, name, h);
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
  // A field-by-field merge where both sides changed the same setting keeps one value; the other side's version is kept
  // for download behind the status-line note, so neither change is lost.
  function keepLosingSide(uid, entry, name, base, mine, theirs, merged) {
    if (entry.virtual) return;
    if (lostFields(base, theirs, merged)) replacedKeep(uid, entry, name, theirs, 'both');
    else if (lostFields(base, mine, merged)) replacedKeep(uid, entry, name, mine, 'both');
  }
  // Both sides changed a settings row. With the base (the value both last agreed on) the row is merged field by field
  // (merge3): what only the other device changed lands here, what only this device changed goes up, and a field both
  // changed takes the side changed last (this device's last write of the kind against the other device's clock on
  // the row). Without a base (a row remembered before bases were kept, or the old module's hint) this device's fields
  // win and fields only the account has survive.
  function actKeepMineAssign(tool, row) {
    var uid = ensureUser();
    return cloudLoad(row.cloud.id).then(function (full) {
      if (!validateShape(row.entry, full.data)) throw makeError('shape');
      flushPage(tool);
      var it = localItem(row.entry, row.name);
      return assertLocalAsPlanned(row, it).then(function () {
        if (!it) throw makeError('changed_here');
        var base = row.memory ? baseGet(uid, tool, row.kind, row.name) : null;
        var baseVal = null;
        if (base && base.h === row.memory.h) { try { baseVal = safeParse(base.text); } catch (e) { baseVal = null; } }
        var mine = project(row.entry, it.value), theirs = project(row.entry, full.data);
        var preferLocal = true;   // no base (the old module's hint, or a base that could not be kept): this device's fields
        if (isPlainObject(baseVal)) {   // a field both sides changed since the base takes the later change
          var st = stampsAll(), pw = isPlainObject(st.pageWrites) && isPlainObject(st.pageWrites[tool]) ? Number(st.pageWrites[tool][row.kind]) || 0 : 0;
          preferLocal = pw > (Date.parse(full.client_updated_at || '') || 0);
        } else baseVal = {};
        var merged3 = merge3(baseVal, mine, theirs, preferLocal);
        return writeBothSides(tool, uid, row, restoreOmitted(row.entry, merged3, it.value), full).then(function (r) {
          keepLosingSide(uid, row.entry, row.name, baseVal, mine, theirs, merged3);
          return r;
        });
      }).then(function () { return { action: 'upload', row: row }; });
    });
  }
  // A settings row both this tab and another tab or device changed since this tab last saw it: merged field by field
  // against what this tab saw (merge3); a field both changed takes this tab's value when it has the focus (the
  // teacher is working here), else the other's.
  function actTabMerge(tool, row, baseText) {
    var uid = ensureUser();
    return cloudLoad(row.cloud.id).then(function (full) {
      if (!validateShape(row.entry, full.data)) throw makeError('shape');
      flushPage(tool);
      var it = localItem(row.entry, row.name);
      return assertLocalAsPlanned(row, it).then(function () {
        if (!it) throw makeError('changed_here');
        var baseVal = null; try { baseVal = safeParse(baseText || 'null'); } catch (e) { baseVal = null; }
        var focused = false; try { focused = !!document.hasFocus(); } catch (e) {}
        var b = isPlainObject(baseVal) ? baseVal : {}, mine = project(row.entry, it.value), theirs = project(row.entry, full.data);
        var merged = merge3(b, mine, theirs, focused);
        return writeBothSides(tool, uid, row, restoreOmitted(row.entry, merged, it.value), full).then(function (r) {
          keepLosingSide(uid, row.entry, row.name, b, mine, theirs, merged);
          return r;
        });
      }).then(function () { return { action: 'merge', row: row }; });
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
        if (m === 'deepMax') merged = deepMax(local, cloudVal, row.entry.watermark);
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
        // A first sign-in on a device with its own settings for this tool: the account's copy wins (the device's could be
        // untouched defaults or years of work — the module cannot tell), and the device's copy is kept for download.
        if (!row.memory && isPlainObject(local) && !row.entry.virtual && !takeStripped(uid, tool, row.kind, row.name)) {
          var mine = project(row.entry, local);
          if (canonJson(mine) !== canonJson(project(row.entry, full.data))) replacedKeep(uid, row.entry, row.name, mine, 'signin');
        }
        return writeBothSides(tool, uid, row, merged, full);
      });
    });
  }
  // The id shape the tools mint (base-36 time plus a random tail), for the copy of an id-keyed row.
  function mintId() { return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6); }
  // The label of a Keep-both copy on an id-keyed row (a word list, a class list): the item's own name suffixed,
  // unique among the labels this device holds — never two lists with the same label.
  function copyLabelFor(entry, label) {
    var taken = {};
    localItems(entry).forEach(function (it) { if (isPlainObject(it.value) && typeof it.value[entry.nameField] === 'string') taken[it.value[entry.nameField]] = true; });
    var base = t('shared.cloud.copy_suffix', '{name} (cloud copy)', { name: label });
    if (!taken[base]) return base;
    for (var n = 2; n < 1000; n++) {
      var c = t('shared.cloud.copy_suffix_n', '{name} (cloud copy {n})', { name: label, n: n });
      if (!taken[c]) return c;
    }
    return base + ' ' + Date.now();
  }
  function copyNameFor(tool, entry, name) {
    if (entry.shape === 'mapIn' && entry.nameField) {   // the row name is an id: mint a fresh one (the label is suffixed separately)
      var taken0 = {};
      localItems(entry).forEach(function (it) { taken0[it.name] = true; });
      ((plans[tool] && plans[tool].rows) || []).forEach(function (r) { if (r.kind === entry.kind) taken0[r.name] = true; });
      for (var i = 0; i < 20; i++) { var id = mintId(); if (!taken0[id]) return id; }
      return mintId() + '_' + Date.now();
    }
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
        var landing = restoreOmitted(row.entry, full.data, it.value);
        if (row.entry.shape === 'mapIn' && row.entry.nameField && isPlainObject(theirs)) {   // an id-keyed row: the copy's label is suffixed on both sides
          var label = copyLabelFor(row.entry, typeof theirs[row.entry.nameField] === 'string' ? theirs[row.entry.nameField] : row.label);
          theirs = clone(theirs); theirs[row.entry.nameField] = label;
          landing = clone(landing); landing[row.entry.nameField] = label;
        }
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
                  return localWrite(row.entry, copyName, landing)
                    .then(function () { return settleLocalWrite(tool, uid, row.entry, copyName, { id: copyRow.id, updated_at: copyRow.updated_at, data: theirs }); });
                });
            });
        }).then(function () { return { action: 'keepBoth', row: row, copy: (row.entry.shape === 'mapIn' && row.entry.nameField && isPlainObject(theirs)) ? theirs[row.entry.nameField] : copyName }; });
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
  var ROW_ERRORS = { too_big: true, name: true, chars: true, shape: true, no_merge: true, changed: true, changed_here: true, hook: true, cap: true, '23514': true, '22P05': true };   // 23514: the account's row limit; 22P05: a value the server cannot store
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
    if (code === 'cap') return t('shared.cloud.skip_cap', 'this device already holds ten fonts');
    return errorText(err);
  }
  function noteSkip(sum, row, err) { sum.skipped++; sum.skips.push({ name: row.label, why: skipReason(err) }); }
  function toolsWithEntries() { return TOOLS.filter(function (tool) { return registryFor(tool).length > 0; }); }
  function toolName(tool) { var n = TOOL_NAMES[tool]; return n ? t(n[0], n[1]) : tool; }
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
  // After the account was deleted: drop what this device remembered about it (the sync memory, the v1 hint and
  // the first-hydration mark). Never touches a tool's own keys.
  function forgetUser(uid) {
    if (!uid) return;
    var m = metaAll();
    if (isPlainObject(m.users)) delete m.users[uid];
    if (isPlainObject(m.legacy)) delete m.legacy[uid];
    if (isPlainObject(m.hydrated)) delete m.hydrated[uid];
    if (isPlainObject(m.noUpload)) delete m.noUpload[uid];
    if (isPlainObject(m.stripped)) delete m.stripped[uid];
    metaSave(m);
    delete firstHydrationDone[uid];
    if (lsGet(BASE_KEY) !== null) { var b = baseAll(); if (hasOwn(b.users, uid)) { delete b.users[uid]; baseSave(b); } }
    if (lsGet(REPLACED_KEY) !== null) { var rp = replacedAll(); if (hasOwn(rp.users, uid)) { delete rp.users[uid]; replacedSave(rp); } }
  }

  /* ---------- queue ---------- */
  function enqueue(tool, fn) {
    var q = queues[tool] || Promise.resolve();
    var run = q.then(function () { busy[tool] = true; return fn(); });
    var settled = run.then(function (v) { busy[tool] = false; return v; }, function (e) { busy[tool] = false; throw e; });
    queues[tool] = settled.catch(function () {});
    return settled;
  }

  /* ---------- hydration: the account lands on this device ---------- */
  // What a row's state means for the device (pure; exported for the harness). `first`: this account has not
  // hydrated on this device yet (the extras card decides local-only items; deletions never fire before it).
  //   synced         nothing (the plan remembered it)
  //   cloud-only     download; with memory (deleted here) after the first hydration → the account's row goes
  //                  (conditional: 0 rows = it moved since → download instead, the later human action wins)
  //   local-only     a seed → nothing; with memory (the account lost it) → an item with the same hash goes here
  //                  too, a changed one or a single/scalar is re-inserted; no memory → first hydration: a device
  //                  extra (card) for items, fonts and progress/streak, else upload
  //   cloud-changed  download; local-changed → upload (on a first hydration an item keeps both and a mergeable
  //                  row merges: the device was its own since, and its copy may be an older restore)
  //   conflict       item → keep both; settings → the account's fields on a row never synced here, this device's
  //                  afterwards; progress / rosters / word lists → the lossless merge; a seed → download
  // `fresh`: this hydration began as a first one (the uploads run after the card with `first` off; the keep-both rule
  // for a changed item still applies). `saw`: this tab saw the item present at its last hydrate or flush and the kind is not stale — the only case a
  // remembered row that is now absent here is a deletion made here. A tab that never saw it (another tab added it
  // after this tab's last read, or this tab's page rewrote the key from a stale in-memory copy) lands it again.
  function hydrateActionFor(r, first, saw, fresh) {
    var m = r.entry.merge, shape = r.entry.shape;
    if (r.state === 'synced' || r.state === 'none') return null;
    if (r.state === 'cloud-only') return r.downloadable ? 'download' : null;
    if (r.state === 'deleted-here') {
      if (r.memory && r.memory.deleted) return 'deleteCloud';   // an explicit delete (fontDeleted) that could not be sent then
      if (first || r.entry.noDeleteByAbsence || !saw) return r.downloadable ? 'download' : null;   // a font gone here without fontDeleted (the ten-font limit evicted it) lands again once there is room
      return 'deleteCloud';
    }
    if (r.state === 'local-only' || r.state === 'cloud-deleted') {
      if (r.seed) return null;
      if (r.memory) {   // cloud gone
        if ((shape === 'map' || shape === 'mapIn') && r.local.hash === r.memory.h) return 'removeLocal';
        return 'upload';
      }
      if (first && (shape === 'map' || shape === 'mapIn' || r.kind === 'font' || m === 'deepMax' || m === 'max')) return 'extra';
      return 'upload';
    }
    if (r.state === 'cloud-changed') return r.downloadable ? 'download' : null;
    if (r.state === 'local-changed') {
      // after a signed-out period (a first hydration) this device's copy may be an older .ivrit restored while the
      // device was its own: an item keeps the account's copy beside it, a class list, word list, student profile or
      // progress merges losslessly — the account's newer copy is never overwritten
      if ((first || fresh) && r.downloadable) {
        if (m === 'item') return 'keepBoth';
        if (r.mergeable) return 'merge';
      }
      return 'upload';
    }
    if (r.state === 'conflict') {
      if (r.seed) return r.downloadable ? 'download' : null;
      if (m === 'item') return r.downloadable ? 'keepBoth' : 'keepMine';
      if (m === 'assign') return (r.memory || r.legacy) ? 'keepMine' : (r.downloadable ? 'useCloud' : 'keepMine');   // memory or the old module's hint: this device moved since; merged, never reverted
      return (r.mergeable && r.downloadable) ? 'merge' : null;
    }
    return null;
  }
  function runHydrateAction(tool, action, row, uid) {
    return Promise.resolve().then(function () {
      if (action === 'download') return actDownload(tool, row);
      if (action === 'upload') return actUpload(tool, row);
      if (action === 'keepMine') return actUpload(tool, row, true);
      if (action === 'keepBoth') return actKeepBoth(tool, row);
      if (action === 'merge') return actMerge(tool, row);
      if (action === 'useCloud') return actUseCloud(tool, row);
      if (action === 'tabMerge') return actTabMerge(tool, row, tabBaseOf(tool, row.kind, row.name));
      if (action === 'deleteCloud') {
        return cloudRemoveIf(row.cloud.id, row.memory.u).then(function () { metaDelete(uid, tool, row.kind, row.name); return { action: 'deleteCloud', row: row }; },
          function (err) { if (err && err.code === 'changed' && row.downloadable) return actDownload(tool, row); throw err; });
      }
      if (action === 'removeLocal') {
        return localRemove(row.entry, row.name).then(function () { metaDelete(uid, tool, row.kind, row.name); notifyPage(tool, row.kind, row.name); return { action: 'removeLocal', row: row }; });
      }
      throw makeError('bad_action', 'IvritSaves: unknown action ' + action);
    });
  }
  function normTools(tools) {
    var out = [];
    (tools || []).forEach(function (t) { if (TOOLS.indexOf(t) >= 0 && out.indexOf(t) < 0) out.push(t); });
    return TOOLS.filter(function (t) { return out.indexOf(t) >= 0; });
  }
  // Hold every listed tool's queue (in TOOLS order) while fn runs, so nothing else touches those rows.
  function enqueueAll(tools, fn) {
    if (!tools.length) return Promise.resolve().then(fn);
    return enqueue(tools[0], function () { return enqueueAll(tools.slice(1), fn); });
  }
  // The public entry: queued and deduplicated per tool set; the first hydration for an account on this device
  // lists every tool (the device-extras diff is device-wide) and opens the card when it finds extras.
  function hydrate(tools) {
    tools = normTools(tools);
    if (!currentUser()) return Promise.reject(makeError('signed_out'));
    if (!tools.length) return Promise.resolve({ ok: true, tools: [] });
    var key = tools.join(',');
    if (pendingHydrate[key]) return pendingHydrate[key];
    var p = enqueueAll(tools, function () { return hydrateInner(tools); });
    pendingHydrate[key] = p;
    p.then(function () { delete pendingHydrate[key]; }, function () { delete pendingHydrate[key]; });
    return p;
  }
  function memoryNames(uid, tool) {
    var m = metaAll(), u = m.users[uid], tl = isPlainObject(u) && u[tool], out = [];
    if (!isPlainObject(tl)) return out;
    Object.keys(tl).forEach(function (kind) { if (isPlainObject(tl[kind])) Object.keys(tl[kind]).forEach(function (name) { if (isPlainObject(tl[kind][name]) && tl[kind][name].id) out.push(tl[kind][name].id); }); });
    return out;
  }
  // The listing lacks every row this device remembers for some tool: a deleted account still answers a
  // still-valid token with an empty list, and "cloud gone" would then remove every copy here. Ask first.
  function accountGoneCheck(uid, listTools, rows) {
    var suspect = listTools.some(function (tool) {
      var ids = memoryNames(uid, tool);
      return ids.length > 0 && !rows.some(function (r) { return ids.indexOf(r.id) >= 0; });
    });
    if (!suspect) return Promise.resolve(false);
    return accountAlive().then(function (alive) {
      if (!alive) return true;
      // Alive, yet the account answered no row at all although this device remembers some: a listing that cannot be
      // trusted (a policy or grant broken on the server) — removing everything it lacks would empty the device.
      if (!rows.length) throw makeError('listing_suspect', 'IvritSaves: an empty listing for an account this device remembers rows of');
      return false;
    });
  }
  function landedNote(landed, tool, kind) { if (!landed[tool]) landed[tool] = []; if (landed[tool].indexOf(kind) < 0) landed[tool].push(kind); }
  // Runs one phase of a tool's plan: 'down' (what the account has that this device lacks or has older) or
  // 'rest' (everything else). Row errors skip the row and are named; a connection error stops the run.
  function sawHere(tool, r) {
    return !!(seenNames[tool] && seenNames[tool][r.kind] && seenNames[tool][r.kind][r.name]);
  }
  function runPhase(tool, p, uid, first, phase, res) {
    var order = p.rows.filter(function (r) {
      var a = actionFor(tool, r, first, res.first);
      if (!a || a === 'extra') return false;
      var down = (a === 'download');
      if (phase === 'down') return down;
      if (phase === 'rest') return !down;
      return true;
    });
    return seqMap(order, function (row) {
      var action = actionFor(tool, row, first, res.first);
      if (action === 'upload' && !localItem(row.entry, row.name)) return Promise.resolve();   // gone meanwhile (folded into another item)
      if (action === 'upload' && !row.memory && row.local && heldBack(uid, tool, row.kind, row.name, row.local.hash)) return Promise.resolve();
      if (action === 'download' && tool === 'Suite' && row.kind === 'font') {   // My Fonts is full here: not even fetched (a font row can be ~2 MB), named on the hub
        var fc = USER_FONTS.cache || {};
        if (!hasOwn(fc, row.name) && Object.keys(fc).length >= FONTS_CAP) { res.fontFull.push(row.label); return Promise.resolve(); }
      }
      return runHydrateAction(tool, action, row, uid).then(function (r) {
        res.done++;
        if (action === 'download' || action === 'merge' || action === 'useCloud' || action === 'keepBoth' || action === 'removeLocal' || action === 'tabMerge') landedNote(res.landed, tool, row.kind);
        if (r && r.hint) res.hint = true;
      }, function (err) {
        if (err && err.code === 'cap' && action === 'download') { res.fontFull.push(row.label); return; }   // a font this device has no room for: not an error
        if (row.kind === 'font' && tool === 'Suite' && action === 'download') { warn('a font could not be stored on this device:', row.name, err); return; }   // no IndexedDB here (a private window): the account keeps it
        if (!isRowError(err)) throw err;
        noteSkip(res, row, err);
      });
    });
  }
  // What this tab's page holds, per item: recorded after each hydration (the page was told about every landing) and
  // at attach / sign-in (what the page loaded). A remembered row absent here is a deletion made here only when this tab
  // saw it; a row whose memory moved past what this tab saw was written by another tab or device meanwhile.
  function snapshotNames(tool, p) {
    seenNames[tool] = {}; tabBase[tool] = {};
    p.rows.forEach(function (r) {
      if (!r.local) return;
      if (!seenNames[tool][r.kind]) seenNames[tool][r.kind] = {};
      seenNames[tool][r.kind][r.name] = r.local.hash || true;
      if (r.entry.merge === 'assign') {   // plan rows carry only the hash and size: the value is read from the store
        var it = localItem(r.entry, r.name);
        if (it) { if (!tabBase[tool][r.kind]) tabBase[tool][r.kind] = {}; tabBase[tool][r.kind][r.name] = canonJson(project(r.entry, it.value)); }
      }
    });
  }
  function snapshotLocal(tools) {
    tools.forEach(function (tool) {
      if (seenNames[tool]) return;
      seenNames[tool] = {}; tabBase[tool] = {};
      registryFor(tool).forEach(function (e) {
        if (e.virtual || e.shape === 'tree') return;
        localItems(e).forEach(function (it) {
          if (!seenNames[tool][e.kind]) seenNames[tool][e.kind] = {};
          seenNames[tool][e.kind][it.name] = true;
          if (e.merge === 'assign') { if (!tabBase[tool][e.kind]) tabBase[tool][e.kind] = {}; tabBase[tool][e.kind][it.name] = canonJson(project(e, it.value)); }
        });
      });
    });
  }
  function seenHashOf(tool, kind, name) { var s = seenNames[tool] && seenNames[tool][kind]; var h = s ? s[name] : null; return typeof h === 'string' ? h : null; }
  function tabBaseOf(tool, kind, name) { var b = tabBase[tool] && tabBase[tool][kind]; return (b && typeof b[name] === 'string' && b[name].charAt(0) === '{') ? b[name] : null; }
  // The hydration action, adjusted for this tab's view: when the device's memory of a row moved past what this tab
  // saw (another tab or device wrote it since), this tab's copy is not "changed here" — if this tab changed nothing
  // it takes the newer copy, if it did a settings row is merged against what this tab saw and an item keeps both.
  function actionFor(tool, r, first, fresh) {
    var a = hydrateActionFor(r, first, sawHere(tool, r), fresh);
    var seenH = seenHashOf(tool, r.kind, r.name);
    if (r.local && r.cloud && r.memory && seenH && seenH !== r.memory.h && (a === 'upload' || a === 'keepMine' || a === 'keepBoth' || a === 'useCloud')) {
      if (r.local.hash === seenH) return r.downloadable ? 'download' : null;
      if (r.entry.merge === 'assign') return (tabBaseOf(tool, r.kind, r.name) && r.downloadable) ? 'tabMerge' : 'keepMine';
      if (r.entry.merge === 'item') return r.downloadable ? 'keepBoth' : 'keepMine';
      if (r.mergeable && r.downloadable) return 'merge';
    }
    return a;
  }
  function hydrateInner(tools) {
    var uid = ensureUser();
    var first = !hydratedAt(uid) && !firstHydrationDone[uid];
    var listTools = first ? toolsWithEntries() : tools;
    var res = { tools: tools, ok: false, first: first, done: 0, skipped: 0, skips: [], fontFull: [], landed: {}, error: null, hint: false };
    tools.forEach(function (tool) { hydrating[tool] = true; setStatus(tool, 'loading'); });
    return Promise.resolve().then(function () {
      tools.forEach(function (tool) { if (pages[tool] && !pages[tool].pulled) flushPage(tool); });
      return primeVirtual('Suite');
    }).then(function () {
      return cloudList(listTools);
    }).then(function (rows) {
      return accountGoneCheck(uid, listTools, rows).then(function (gone) {
        if (gone) { var e = makeError('signed_out', 'IvritSaves: the account is gone'); e.accountGone = true; throw e; }
        return seqMap(listTools, function (tool) { return planTool(tool, rows); });
      });
    }).then(function (allPlans) {
      var byTool = {};
      allPlans.forEach(function (p) { byTool[p.tool] = p; });
      // 1. Suite first (preferences apply live, fonts land), then what the account has for this page's tools.
      return seqMap(tools, function (tool) { return runPhase(tool, byTool[tool], uid, first, 'down', res); }).then(function () {
        if (!first) return null;
        // 2. The device's own items across every tool: the card decides before anything goes up or merges.
        var extras = [];
        listTools.forEach(function (tool) {
          byTool[tool].rows.forEach(function (r) { if (hydrateActionFor(r, true) === 'extra') extras.push({ tool: tool, row: r }); });
        });
        if (!extras.length) { markHydrated(uid); firstHydrationDone[uid] = true; return null; }
        return openCard(uid, extras).then(function (choice) {
          if (choice === 'add') {
            return seqMap(extras, function (x) {
              return actUpload(x.tool, x.row).then(function () { res.done++; }, function (err) { if (!isRowError(err)) throw err; noteSkip(res, x.row, err); });
            });
          }
          // 'remove': the extras leave the device; nothing else of the device goes up until it is changed
          return seqMap(extras, function (x) {
            return localRemove(x.row.entry, x.row.name).then(function () { notifyPage(x.tool, x.row.kind, x.row.name); }, function (err) { warn('remove failed:', err); });
          }).then(function () {
            // Nothing else of this device goes into the account until the teacher changes it: each settings row and folder
            // tree is held back at its present hash (kept in the sync memory, so a reload does not release it).
            var held = [];
            listTools.forEach(function (tool) { registryFor(tool).forEach(function (e) {
              if (e.virtual || !(e.merge === 'assign' || e.shape === 'tree')) return;
              if (e.shape === 'tree') { var tr = localTree(e); if (tr) held.push({ tool: tool, e: e, name: DEFAULT_NAME, value: tr }); }
              else localItems(e).forEach(function (it) { held.push({ tool: tool, e: e, name: it.name, value: it.value }); });
            }); });
            return seqMap(held, function (x) { return hashItem(x.e, x.value).then(function (h) { holdBack(uid, x.tool, x.e.kind, x.name, h); }); });
          });
        }).then(function () { markHydrated(uid); firstHydrationDone[uid] = true; return cloudList(tools).then(function (rows2) { return seqMap(tools, function (tool) { return planTool(tool, rows2).then(function (p) { byTool[tool] = p; }); }); }); });
      }).then(function () {
        // 3. Uploads, merges, the account's deletions, this device's deletions.
        return seqMap(tools, function (tool) { return runPhase(tool, byTool[tool], uid, false, 'rest', res); });
      });
    }).then(function () {
      // 4. List again, then the folder trees follow their items (never on a stale plan).
      return cloudList(tools).then(function (rows2) {
        return seqMap(tools, function (tool) {
          return planTool(tool, rows2).then(function (p2) {
            return syncTrees(tool, p2).then(function (n) { if (n) landedNote(res.landed, tool, 'trees'); }, function (err) { res.treeError = err; }).then(function () { snapshotNames(tool, p2); });
          });
        });
      });
    }).then(function () {
      res.ok = true;
      tools.forEach(function (tool) { hydratedTools[tool] = uid; delete stale[tool]; });
      if (tools.some(function (tool) { return !(pages[tool] && pages[tool].hydrate === false); })) armHook();   // a harness attached with hydrate:false never arms write-through
      return res;
    }).catch(function (err) {
      res.error = err;
      return res;
    }).then(function (r) {
      tools.forEach(function (tool) { hydrating[tool] = false; });
      if (r.error) {
        if (r.error.accountGone) {
          dropHydrated(uid); hookOn = false;   // the copies and the memory stay; nothing is removed on this signal
          tools.forEach(function (tool) { setStatus(tool, 'error', errorText(r.error)); });
          var a = A(); if (a && typeof a.signOut === 'function') a.signOut({ keepLocal: true }).catch(noop);
        } else {
          var offline = navigator.onLine === false || String(r.error.code || '') === 'offline';
          tools.forEach(function (tool) { setStatus(tool, offline ? 'offline_pending' : 'error', errorText(r.error)); });
          if (isConnectionError(r.error)) r.retry = true;
        }
      } else {
        var tail = r.fontFull.length ? t('shared.cloud.status_font_full', '"{name}" was not added here: My Fonts is full.', { name: r.fontFull.join(', ') }) : '';
        var skipped = r.skips.length ? r.skips.map(function (s) { return t('shared.cloud.status_error_row', 'Couldn\'t save "{name}": {why}', { name: s.name, why: s.why }); }).join(' ') : '';
        tools.forEach(function (tool) { if (skipped) setStatus(tool, 'error_row', skipped); else setStatus(tool, 'saved', { when: newestUpdatedAt(tool), note: tail }); });
      }
      hydratedEvents.push({ tools: tools, ok: !r.error });
      try { window.dispatchEvent(new CustomEvent('ivritsuite:hydrated', { detail: { tools: tools, ok: !r.error, first: first, landed: r.landed } })); } catch (e) {}
      // Anything a page wrote while its rows were landing goes up now.
      tools.forEach(function (tool) { if (!r.error && dirty[tool] && Object.keys(dirty[tool]).length) scheduleFlush(tool, 0); });
      return r;
    });
  }
  var hydratedEvents = [];
  function newestUpdatedAt(tool) {
    var p = plans[tool], best = null;
    if (p && p.cloudRows) p.cloudRows.forEach(function (r) { if (r.updated_at && (!best || r.updated_at > best)) best = r.updated_at; });
    return best;
  }

  /* ---------- write-through: a page's own writes reach the account ---------- */
  var entriesByKey = null;
  function keyMap() {
    if (entriesByKey) return entriesByKey;
    entriesByKey = {};
    registryAll().forEach(function (e) { if (!e.virtual && e.lsKey) { if (!entriesByKey[e.lsKey]) entriesByKey[e.lsKey] = []; entriesByKey[e.lsKey].push(e); } });
    var prefs = entryFor('Suite', 'prefs');
    if (prefs) Object.keys(SUITE_PREFS.fields).forEach(function (f) { var k = SUITE_PREFS.fields[f].key; if (!entriesByKey[k]) entriesByKey[k] = []; entriesByKey[k].push(prefs); });
    return entriesByKey;
  }
  // The wrapper's contract: while `purging` a PAGE write to a registered key returns without touching storage (the
  // page's own pagehide writers must not re-create what a sign-out removed; the module's own removals, made under
  // selfWrite, are the purge itself and go through); otherwise the original runs first
  // and its exception propagates unchanged (writeText relies on QuotaExceededError), and only then, guarded,
  // the module notes a page write. The prototype is wrapped once, and only after a signed-in hydration.
  function installHook() {
    if (hookInstalled || typeof Storage === 'undefined' || !Storage.prototype) return;
    hookInstalled = true;
    var origSet = Storage.prototype.setItem, origRemove = Storage.prototype.removeItem;
    function wrap(orig) {
      return function (key) {
        var mine = false;
        try { mine = this === window.localStorage && !!keyMap()[key]; } catch (e) { mine = false; }
        if (mine && purging && selfWrite === 0 && !suiteOnlyKey(key)) return;   // a preference is never removed by a sign-out: it is written as usual
        var r = orig.apply(this, arguments);
        try { if (mine && hookOn && selfWrite === 0 && !suspended) onPageWrite(key); } catch (e) {}
        return r;
      };
    }
    Storage.prototype.setItem = wrap(origSet);
    Storage.prototype.removeItem = wrap(origRemove);
    // The shared uploader block's saveUserFont is a global function declaration on every carrier: a bare call
    // resolves through window at call time, so wrapping it here catches every teacher upload. deleteUserFont
    // is left alone — the block calls it to evict at the cap, and an eviction is not a deletion.
    if (typeof window.saveUserFont === 'function' && !window.saveUserFont._ivritWrapped) {
      var origSave = window.saveUserFont;
      var wrapped = function (name) {
        var args = arguments;
        return Promise.resolve(origSave.apply(this, args)).then(function (r) {
          if (hookOn && !suspended && currentUser()) { USER_FONTS.prime().then(function () { flushFont(String(name)); }); }
          return r;
        });
      };
      wrapped._ivritWrapped = true;
      window.saveUserFont = wrapped;
    }
  }
  function armHook() { installHook(); hookOn = true; }
  // A sign-out removes only the tools' own keys (never the suite-wide preferences or My Fonts), so a page whose
  // only attachment is Suite holds nothing in memory the removal could be undone by: no reload there.
  function needsReload() { return Object.keys(pages).some(function (tool) { return tool !== 'Suite'; }); }
  function suiteOnlyKey(key) { var list = keyMap()[key] || []; return list.length > 0 && list.every(function (e) { return e.tool === 'Suite'; }); }
  function onPageWrite(key) {
    var user = currentUser();
    if (!user) return;
    (keyMap()[key] || []).forEach(function (e) {
      if (hydratedTools[e.tool] !== user.id) return;
      markDirty(e.tool, e.kind);
      stampPageWrite(e);
      persistStaleView(e.tool, e.kind);
    });
  }
  // The other tabs learn of a page write at once (not only when it is sent 2 s later), so a background tab never
  // writes its older in-memory copy over it in between. Local only; at most one stamp per kind every 250 ms.
  var lastPageStamp = {};
  function stampPageWrite(entry) {
    var k = entry.tool + '/' + entry.kind, t = Date.now();
    if (lastPageStamp[k] && t - lastPageStamp[k] < 250) return;
    lastPageStamp[k] = t;
    stampWrite(entry, null, 'page');
  }
  function markDirty(tool, kind) {
    if (!dirty[tool]) dirty[tool] = {};
    dirty[tool][kind] = true;
    setStatus(tool, 'saving');
    scheduleFlush(tool, FLUSH_DEBOUNCE_MS);
  }
  function scheduleFlush(tool, ms) {
    if (timers[tool]) clearTimeout(timers[tool]);
    timers[tool] = setTimeout(function () { timers[tool] = null; flush(tool).catch(noop); }, ms);
  }
  function isPaused(tool) { var cfg = pages[tool]; try { return !!(cfg && typeof cfg.paused === 'function' && cfg.paused()); } catch (e) { return false; } }
  // The public flush: this tool's dirty kinds, now, through its queue (a paused page or a hydration in flight
  // only postpones).
  function flush(tool) {
    if (timers[tool]) { clearTimeout(timers[tool]); timers[tool] = null; }
    if (!dirty[tool] || !Object.keys(dirty[tool]).length) return Promise.resolve({ tool: tool, done: 0 });
    if (isPaused(tool) || hydrating[tool]) { scheduleFlush(tool, FLUSH_DEBOUNCE_MS); return Promise.resolve({ tool: tool, done: 0, postponed: true }); }
    return enqueue(tool, function () { return flushInner(tool); });
  }
  function flushInner(tool) {
    var user = currentUser();
    if (!user || suspended || purging) { dirty[tool] = {}; return Promise.resolve({ tool: tool, done: 0 }); }
    var uid = user.id;
    var kinds = Object.keys(dirty[tool] || {});
    dirty[tool] = {};
    var res = { tool: tool, done: 0, skipped: 0, skips: [], error: null, needHydrate: false };
    if (pages[tool] && !pages[tool].pulled) withSelfWrite(function () { flushPage(tool); });
    kinds.forEach(function (kind) { persistStaleView(tool, kind); });
    return seqMap(kinds, function (kind) {
      var entry = entryFor(tool, kind);
      if (!entry) return Promise.resolve();
      stampWrite(entry, null, 'page');   // other tabs of this tool read before their next save
      if (stale[tool] && stale[tool][kind]) { res.needHydrate = true; return Promise.resolve(); }   // the flag clears when that hydration finishes
      if (entry.shape === 'tree') return flushTree(uid, tool, entry, res);
      return flushKind(uid, tool, entry, res);
    }).then(function () {
      if (res.needHydrate) return hydrateInner([tool]).then(function () { return res; });
      return res;
    }).catch(function (err) {
      res.error = err;
      kinds.forEach(function (k) { if (!dirty[tool]) dirty[tool] = {}; dirty[tool][k] = true; });   // retried by the next flush, online event, or load
      return res;
    }).then(function (r) {
      if (r.error) {
        var offline = navigator.onLine === false || String(r.error.code || '') === 'offline';
        setStatus(tool, offline ? 'offline_pending' : 'error', errorText(r.error));
      } else if (r.skips.length) {
        setStatus(tool, 'error_row', r.skips.map(function (s) { return t('shared.cloud.status_error_row', 'Couldn\'t save "{name}": {why}', { name: s.name, why: s.why }); }).join(' '));
      } else if (!dirty[tool] || !Object.keys(dirty[tool]).length) {
        setStatus(tool, 'saved', { when: 'now' });
      }
      return r;
    });
  }
  // One kind: every item hashed against the memory — insert / conditional update / nothing; then the names
  // this tab saw before and cannot see now → a conditional delete (a name it never saw → hydrate instead).
  function flushKind(uid, tool, entry, res) {
    var items = localItems(entry).filter(function (it) { return !isSeed(entry, it.name, it.value); });
    var present = {};
    return seqMap(items, function (it) {
      present[it.name] = (seenNames[tool] && seenNames[tool][entry.kind] && seenNames[tool][entry.kind][it.name]) || true;   // what this tab saw stays until a write lands
      var projected = project(entry, it.value);
      var g = guardUpload(entry, it.name, projected);
      if (g) { noteSkip(res, { label: it.label }, g); return Promise.resolve(); }
      return hashText(canonJson(projected)).then(function (h) {
        var mem = metaGet(uid, tool, entry.kind, it.name);
        if (mem && mem.h === h) { present[it.name] = h; return null; }
        var seenH = seenHashOf(tool, entry.kind, it.name);
        if (mem && seenH && seenH !== mem.h) { res.needHydrate = true; return null; }   // the account copy moved since this tab saw it: the hydration decides (newer copy, merge or both)
        var landed = function (saved) { remember(uid, tool, entry.kind, it.name, h, saved); present[it.name] = h; if (entry.merge === 'assign') { if (!tabBase[tool]) tabBase[tool] = {}; if (!tabBase[tool][entry.kind]) tabBase[tool][entry.kind] = {}; tabBase[tool][entry.kind][it.name] = canonJson(projected); } res.done++; };
        if (!mem) {
          if (heldBack(uid, tool, entry.kind, it.name, h)) return null;   // "Remove from this device": unchanged since
          var hint = legacyGet(uid, tool, entry.kind, it.name);
          if (hint && hint.id && hint.u) {   // a row this device synced under the old module: update it in place
            return cloudUpdateIf(hint.id, hint.u, projected, h).then(landed,
              function (err) { if (err && err.code === 'changed') { res.needHydrate = true; return; } throw err; });
          }
          return cloudInsert(entry, it.name, projected, h).then(landed,
            function (err) { if (err && err.code === '23505') { res.needHydrate = true; return; } throw err; });
        }
        return cloudUpdateIf(mem.id, mem.u, projected, h).then(landed,
          function (err) { if (err && err.code === 'changed') { res.needHydrate = true; return; } throw err; });
      }).catch(function (err) { if (!isRowError(err)) throw err; noteSkip(res, { label: it.label }, err); });
    }).then(function () {
      if (entry.noDeleteByAbsence) return;
      var m = metaAll(), b = metaBranch(m, uid, tool, entry.kind, false);
      var gone = b ? Object.keys(b).filter(function (name) { return !present[name] && isPlainObject(b[name]) && b[name].id; }) : [];
      var sawBefore = (seenNames[tool] && seenNames[tool][entry.kind]) || {};
      return seqMap(gone, function (name) {
        if (!sawBefore[name]) { res.needHydrate = true; return Promise.resolve(); }   // another tab's item this tab never saw: not a deletion
        var mem = b[name];
        return cloudRemoveIf(mem.id, mem.u).then(function () { metaDelete(uid, tool, entry.kind, name); res.done++; },
          function (err) { if (err && err.code === 'changed') { res.needHydrate = true; return; } throw err; });
      });
    }).then(function () {
      if (!seenNames[tool]) seenNames[tool] = {};
      seenNames[tool][entry.kind] = present;
    });
  }
  // A folder tree is flushed like one row: hash vs memory → conditional update / insert; a refusal → hydrate.
  function flushTree(uid, tool, entry, res) {
    var local = localTree(entry);
    if (!local) return Promise.resolve();
    var g = guardUpload(entry, DEFAULT_NAME, local);
    if (g) { noteSkip(res, { label: kindLabel(entry) }, g); return Promise.resolve(); }
    return hashItem(entry, local).then(function (h) {
      var mem = metaGet(uid, tool, entry.kind, DEFAULT_NAME);
      if (mem && mem.h === h) return;
      if (!mem && heldBack(uid, tool, entry.kind, DEFAULT_NAME, h)) return;
      var write = mem ? cloudUpdateIf(mem.id, mem.u, local, h) : cloudInsert(entry, DEFAULT_NAME, local, h);
      return write.then(function (saved) { remember(uid, tool, entry.kind, DEFAULT_NAME, h, saved); res.done++; },
        function (err) { if (err && (err.code === 'changed' || err.code === '23505')) { res.needHydrate = true; return; } throw err; });
    });
  }
  // A font the teacher just added or replaced (the wrapped saveUserFont): its one row, through the Suite queue.
  function flushFont(name) {
    var entry = entryFor('Suite', 'font');
    if (!entry || !currentUser()) return Promise.resolve();
    return enqueue('Suite', function () {
      var uid = ensureUser(), it = localItem(entry, name);
      if (!it) return null;
      var projected = project(entry, it.value), g = guardUpload(entry, name, projected);
      if (g) { setStatus('Suite', 'error_row', t('shared.cloud.status_error_row', 'Couldn\'t save "{name}": {why}', { name: name, why: skipReason(g) })); return null; }
      return hashText(canonJson(projected)).then(function (h) {
        var mem = metaGet(uid, 'Suite', 'font', name);
        if (mem && mem.h === h) return null;
        var write = mem ? cloudUpdateIf(mem.id, mem.u, projected, h) : cloudInsert(entry, name, projected, h);
        return write.then(function (saved) { remember(uid, 'Suite', 'font', name, h, saved); if (!seenNames.Suite) seenNames.Suite = {}; if (!seenNames.Suite.font) seenNames.Suite.font = {}; seenNames.Suite.font[name] = true; },
          function (err) { if (err && (err.code === 'changed' || err.code === '23505')) return hydrateInner(['Suite']); throw err; });
      });
    }).catch(function (err) { setStatus('Suite', 'error', errorText(err)); });
  }
  // A teacher deleted a font on purpose (the hub's My Fonts manager, the Font Maker's remove): the account's row goes too.
  // A teacher removed a font on purpose (the hub's My Fonts manager, the Font Maker's window). The page already
  // deleted it from IndexedDB with the unwrapped deleteUserFont, so the module's snapshot drops it too (a later
  // flush would otherwise upload it again). The memory record is marked `deleted` before any request: if the
  // DELETE cannot be sent now (the SDK still loading, offline, a failure), the next hydration sends it, so the
  // font never comes back from the account by itself. A row another device changed since is not deleted (its
  // newer copy wins and lands again).
  function fontDeleted(name) {
    if (USER_FONTS.cache && hasOwn(USER_FONTS.cache, name)) delete USER_FONTS.cache[name];
    var a = A(), user = currentUser();
    var uid = user ? user.id : (a && typeof a.storedUserId === 'function' ? a.storedUserId() : null);
    if (!uid) return Promise.resolve(false);
    var mem0 = metaGet(uid, 'Suite', 'font', name);
    if (!mem0) return Promise.resolve(false);
    if (!mem0.deleted) { var marked = {}; for (var k in mem0) if (hasOwn(mem0, k)) marked[k] = mem0[k]; marked.deleted = true; metaSet(uid, 'Suite', 'font', name, marked); }
    if (!user) return Promise.resolve(false);   // the next hydration finishes it
    return enqueue('Suite', function () {
      var mem = metaGet(uid, 'Suite', 'font', name);
      if (!mem) return false;
      return cloudRemoveIf(mem.id, mem.u).then(function () { metaDelete(uid, 'Suite', 'font', name); return true; },
        function (err) { if (err && err.code === 'changed') { metaDelete(uid, 'Suite', 'font', name); return false; } throw err; });
    }).catch(function (err) { setStatus('Suite', 'error', errorText(err)); return false; });
  }
  function suspend() {
    suspended = true; hookOn = false;
    Object.keys(timers).forEach(function (tool) { if (timers[tool]) { clearTimeout(timers[tool]); timers[tool] = null; } });
    dirty = {};
  }
  // What a sign-out would leave on this device (a synchronous estimate from the last classifications and the
  // dirty kinds; the chip's confirm names the count).
  function pendingSignOut() {
    var n = 0;
    Object.keys(plans).forEach(function (tool) {
      var p = plans[tool];
      if (!p || !p.rows) return;
      p.rows.forEach(function (r) { if (!r.seed && (r.state === 'local-only' || r.state === 'local-changed' || r.state === 'conflict')) n++; });
    });
    Object.keys(dirty).forEach(function (tool) { n += Object.keys(dirty[tool] || {}).length; });
    // `unknown`: this page could not compare everything with the account (a hydration that has not succeeded, a write
    // in flight) — the confirm then says so instead of promising that everything is in the account.
    var unknown = Object.keys(busy).some(function (tool) { return busy[tool]; }) ||
      attachedTools().some(function (tool) { return hydratedTools[tool] !== eventUser; });
    return { unsynced: n, unknown: unknown };
  }
  function flushAllNow() {
    var tools = Object.keys(hydratedTools).filter(function (tool) { return dirty[tool] && Object.keys(dirty[tool]).length; });
    Object.keys(timers).forEach(function (tool) { if (timers[tool]) { clearTimeout(timers[tool]); timers[tool] = null; } });
    return seqMap(tools, function (tool) { return enqueue(tool, function () { return flushInner(tool); }).catch(noop); });
  }

  /* ---------- the status line ---------- */
  var STYLE_ID = 'ivsav-style';
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '.ivsav{font-family:inherit;color:var(--text,#1a2744);}' +
      '.ivsav-btn{padding:5px 10px;border:1px solid var(--border,#c8bfa8);border-radius:6px;background:var(--white,#fff);color:inherit;' +
        'font-family:inherit;font-size:0.8rem;line-height:1.3;cursor:pointer;margin-inline-end:6px;}' +
      '.ivsav-btn:hover:not([aria-disabled="true"]){background:var(--warm-gray,#e8e0d0);}' +
      'body.dark .ivsav-btn:hover:not([aria-disabled="true"]){background:#2a3349;}' +
      '.ivsav-btn:focus-visible{outline:2px solid var(--gold,#c9922a);outline-offset:1px;}' +
      '.ivsav-btn[aria-disabled="true"]{opacity:.55;cursor:default;}' +
      '.ivsav-btn.ivsav-primary{border-color:var(--gold,#c9922a);font-weight:600;}' +
      '.ivsav-status{margin:4px 0 8px;font-size:0.82rem;color:var(--muted,#6b6050);min-block-size:1.2em;overflow-wrap:anywhere;}' +
      '.ivsav-status.is-error{color:var(--danger-text,#b3261e);}' +
      '.ivsav-status.is-saved::before{content:"\\2713\\00a0";}' +
      '.ivsav-note{margin:6px 0;font-size:0.85rem;overflow-wrap:anywhere;}' +
      '.ivsav-overlay{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.45);}' +
      '.ivsav-card{box-sizing:border-box;inline-size:100%;max-inline-size:540px;max-block-size:90vh;overflow:auto;padding:16px 18px;border:1px solid var(--border,#c8bfa8);' +
        'border-radius:10px;background:var(--white,#fff);color:var(--text,#1a2744);box-shadow:0 10px 30px rgba(0,0,0,.25);font-family:inherit;}' +
      '.ivsav-card-head{display:flex;align-items:center;gap:8px;}' +
      '.ivsav-card-title{flex:1 1 auto;margin:0;font-size:1.1rem;}' +
      '.ivsav-card p{margin:6px 0;font-size:0.9rem;line-height:1.45;}' +
      '.ivsav-card ul{margin:4px 0 8px;padding-inline-start:18px;font-size:0.9rem;line-height:1.5;}' +
      '.ivsav-card .ivsav-btn{margin:4px 0;margin-inline-end:6px;font-size:0.88rem;padding:7px 12px;}' +
      '.ivsav-card .ivsav-status{margin:8px 0 0;}' +
      '@media (prefers-reduced-motion: reduce){.ivsav,.ivsav *,.ivsav-overlay,.ivsav-overlay *{transition-duration:0.001ms!important;animation-duration:0.001ms!important;}}';
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
  // state: 'loading' | 'saved' | 'saving' | 'error' | 'error_row' | 'offline_pending'; detail: { when, note } for saved, a sentence otherwise.
  function setStatus(tool, state, detail) {
    var s = statuses[tool] || (statuses[tool] = {});
    s.state = state; s.detail = detail; s.at = Date.now();
    renderStatus(tool);
    if ((state === 'error' || state === 'error_row') && detail && typeof window.showAppToast === 'function') { try { window.showAppToast(String(detail), 6000); } catch (e) {} }
  }
  function renderStatus(tool) {
    var s = statuses[tool];
    if (!s || !s.root) return;
    var root = s.root;
    while (root.firstChild) root.removeChild(root.firstChild);
    var line = el('p', 'ivsav-status');
    line.setAttribute('role', 'status');
    line.setAttribute('aria-live', 'polite');
    root.appendChild(line);
    var acct = accountState();
    if (acct !== 'signed-in') {
      var note = el('p', 'ivsav-note');
      if (acct === 'anonymous') {
        note.textContent = t('shared.cloud.signed_out', 'Sign in to keep your saved items in your account and see them on any device.');
        root.appendChild(note);
        root.appendChild(button(t('shared.cloud.sign_in', 'Sign in'), 'ivsav-primary', function () {
          var a = A();
          if (!(a && typeof a.openMenu === 'function' && a.openMenu())) line.textContent = note.textContent;
        }));
      } else if (acct === 'loading') note.textContent = t('shared.cloud.loading', 'Checking your account…');
      else if (acct === 'offline') note.textContent = t('shared.cloud.offline', 'Cloud saves need an internet connection. Your local saves still work.');
      else note.textContent = t('shared.cloud.unavailable', 'Cloud saves are unavailable right now. Your local saves still work.');
      if (acct !== 'anonymous') root.appendChild(note);
      return;
    }
    var st = s.state || 'loading';
    if (st === 'loading') line.textContent = t('shared.cloud.listing', 'Loading your account…');
    else if (st === 'saving') line.textContent = t('shared.cloud.status_saving', 'Saving…');
    else if (st === 'saved') {
      var d = s.detail || {}, when = d.when === 'now' ? t('shared.cloud.status_just_now', 'just now') : (d.when ? fmtDate(d.when) : null);
      line.textContent = (when ? t('shared.cloud.status_saved', 'Saved in your account · {when}', { when: when }) : t('shared.cloud.status_nothing', 'Nothing saved in your account yet')) + (d.note ? ' ' + d.note : '');
      line.classList.add('is-saved');
    } else if (st === 'offline_pending') {
      line.textContent = t('shared.cloud.status_offline', 'Offline — your changes are saved to your account when you are back online.');
    } else {
      line.textContent = (st === 'error' ? t('shared.cloud.status_error', 'Couldn\'t save — will retry.') + ' ' : '') + (typeof s.detail === 'string' ? s.detail : '');
      line.classList.add('is-error');
      if (st === 'error') root.appendChild(button(t('shared.cloud.status_retry', 'Retry'), '', function () { retry(tool); }));
    }
    renderReplaced(root, tool);
  }
  // The device's own settings that the account's copy replaced at a first sign-in: one note per tool, with a download
  // of the earlier settings as an .ivrit file (restored through any tool's Backup panel) and a dismiss. The hub's status
  // line lists every tool's.
  function renderReplaced(root, tool) {
    var u = currentUser(); if (!u) return;
    var list = replacedFor(u.id, tool === 'Suite' ? null : tool);
    var groups = [];
    list.forEach(function (x) { var g = { tool: x.tool, why: replacedWhy(x) }; if (!groups.some(function (o) { return o.tool === g.tool && o.why === g.why; })) groups.push(g); });
    groups.forEach(function (g) {
      var tl = g.tool, why = g.why;
      var box = el('div', 'ivsav-replaced');
      box.setAttribute('data-why', why);
      box.appendChild(el('p', 'ivsav-note', why === 'both'
        ? t('shared.cloud.both_note', '{tool} settings were changed on this device and on another one. Where both changed the same setting, one change was kept; the other version is kept here until you dismiss this note.', { tool: toolName(tl) })
        : t('shared.cloud.replaced_note', 'Your account\'s {tool} settings replaced the ones this device had before you signed in. This device\'s earlier settings are kept here until you dismiss this note.', { tool: toolName(tl) })));
      box.appendChild(button(why === 'both' ? t('shared.cloud.both_download', 'Download the other version (.ivrit)') : t('shared.cloud.replaced_download', 'Download the earlier settings (.ivrit)'), '', function () { replacedDownload(u.id, tl, why); }));
      box.appendChild(button(t('shared.cloud.replaced_dismiss', 'Dismiss'), '', function () { replacedDrop(u.id, tl, why); renderAllStatuses(); }));
      root.appendChild(box);
    });
  }
  function retry(tool) {
    if (!currentUser()) return;
    hydrate([tool]).then(function () { return flush(tool); }).catch(noop);
  }
  function mountStatus(target, tool) {
    var host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host || host.nodeType !== 1) return null;
    injectStyle();
    var s = statuses[tool] || (statuses[tool] = {});
    if (s.root && s.root.parentNode) s.root.parentNode.removeChild(s.root);
    s.root = el('div', 'ivsav ivsav-statusline');
    s.root.setAttribute('data-tool', tool);
    host.appendChild(s.root);
    renderStatus(tool);
    return s.root;
  }
  function renderAllStatuses() { Object.keys(statuses).forEach(renderStatus); }

  /* ---------- the device-extras card ---------- */
  // The first hydration for an account on this device found saved items the account does not hold: the
  // teacher's own work here, or a previous user's on a shared computer. One required choice — Add to my
  // account, or Remove from this device — with a .ivrit download of exactly those items on the way.
  function closeCard() {
    if (!card) return;
    var c = card; card = null;
    document.removeEventListener('keydown', c.onKey, true);
    if (c.root.parentNode) c.root.parentNode.removeChild(c.root);
    var f = document.activeElement, acc = A();
    if ((!f || f === document.body) && acc && typeof acc.focusChip === 'function' && !acc.focusChip() && c.opener && typeof c.opener.focus === 'function') { try { c.opener.focus(); } catch (e) {} }
  }
  function plural(base, n, one, other) { return t(base + (n === 1 ? '.one' : '.other'), n === 1 ? one : other, { n: n }); }
  function extrasBundle(extras) {
    var bundle = {}, count = 0;
    var byTool = {};
    extras.forEach(function (x) { if (!byTool[x.tool]) byTool[x.tool] = []; byTool[x.tool].push({ tool: x.tool, kind: x.row.kind, name: x.row.name, data: (localItem(x.row.entry, x.row.name) || {}).value }); });
    Object.keys(byTool).forEach(function (tool) { var b = bundleFromRows(registryFor(tool), byTool[tool]); safeAssign(bundle, b.data); count += b.count; });
    return { file: { _ivritSuite: 1, format: 'ivrit-save', version: 1, tool: 'AllTools', partial: true, savedAt: now(), data: bundle }, count: count };
  }
  function openCard(uid, extras) {
    return new Promise(function (resolve) {
      var open = function () {
        closeCard();
        injectStyle();
        var overlay = el('div', 'ivsav-overlay');
        var box = el('div', 'ivsav-card');
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('tabindex', '-1');
        var head = el('div', 'ivsav-card-head');
        var title = el('h2', 'ivsav-card-title', t('shared.cloud.card_saves_title', 'Add this device\'s saves to your account?'));
        title.id = 'ivsav-card-title';
        box.setAttribute('aria-labelledby', title.id);
        head.appendChild(title);
        box.appendChild(head);
        box.appendChild(el('p', '', t('shared.cloud.card_saves_note', 'This device holds saved items that are not in your account yet:')));
        var list = el('ul');
        var counts = {};
        extras.forEach(function (x) { var k = x.tool + '\u0001' + x.row.kind; if (!counts[k]) counts[k] = { tool: x.tool, entry: x.row.entry, n: 0 }; counts[k].n++; });
        Object.keys(counts).forEach(function (k) { var c = counts[k]; list.appendChild(el('li', '', t('shared.cloud.card_saves_kind', '{tool} — {label}: {n}', { tool: toolName(c.tool), label: kindLabel(c.entry), n: c.n }))); });
        box.appendChild(list);
        var status = el('p', 'ivsav-status');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        var busyNow = false;
        var add = button(t('shared.cloud.card_saves_add', 'Add to my account'), 'ivsav-primary', function () { if (busyNow) return; busyNow = true; closeCard(); resolve('add'); });
        add.setAttribute('data-act', 'add');
        box.appendChild(add);
        box.appendChild(el('p', 'ivsav-note', t('shared.cloud.card_saves_add_note', 'An item named like one already in your account keeps both.')));
        var dl = button(t('shared.cloud.card_saves_download', 'Download a backup (.ivrit)'), '', function () {
          try { var b = extrasBundle(extras); downloadJson(b.file, 'IvritSuite_device_saves_' + now().slice(0, 10) + '.ivrit'); status.textContent = plural('shared.cloud.card_saves_downloaded', b.count, 'Downloaded a backup with 1 item.', 'Downloaded a backup with {n} items.'); }
          catch (e) { status.textContent = errorText(e); }
        });
        dl.setAttribute('data-act', 'download');
        box.appendChild(dl);
        var rm = button(t('shared.cloud.card_saves_remove', 'Remove from this device'), '', function () {
          if (busyNow) return;
          if (!window.confirm(plural('shared.cloud.card_saves_remove_confirm', extras.length, 'Remove this item from this device? It is not in your account, so this deletes it unless you downloaded the backup.', 'Remove these {n} items from this device? They are not in your account, so this deletes them unless you downloaded the backup.'))) return;
          busyNow = true; closeCard(); resolve('remove');
        });
        rm.setAttribute('data-act', 'remove');
        box.appendChild(rm);
        box.appendChild(status);
        overlay.appendChild(box);
        // A required choice: no ✕, no outside click, Escape ignored; Tab and Shift+Tab wrap inside the card.
        var onKey = function (e) {
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return; }
          if (e.key !== 'Tab') return;
          var items = Array.prototype.filter.call(box.querySelectorAll('button,a[href],input'), function (n) { return !n.disabled && n.getClientRects().length > 0; });
          var a = document.activeElement;
          if (!items.length) { e.preventDefault(); box.focus(); return; }
          var first = items[0], last = items[items.length - 1];
          if (!box.contains(a)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
          else if (e.shiftKey && (a === first || a === box)) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey, true);
        (document.body || document.documentElement).appendChild(overlay);
        card = { root: overlay, opener: document.activeElement, onKey: onKey };
        try { add.focus(); } catch (e) {}
      };
      cardPending = { uid: uid, open: open };
      // The name step (the account module) comes first; the card follows on any outcome.
      var a = A();
      if (a && typeof a.onNameStep === 'function' && a.needsName && a.needsName() && !nameStepDone) nameStepWaiting = open;
      else whenReady(open);
    }).then(function (choice) { cardPending = null; return choice; }, function (e) { cardPending = null; throw e; });
  }
  var nameStepDone = false, nameStepWaiting = null;

  /* ---------- sign-out: the account's cache leaves this device ---------- */
  // Registered with IvritAccount.onSignOut and awaited before the SDK sign-out (the token is still valid for the
  // final flush). keepLocal (account deletion): memory and mark only. Otherwise: the last edits go up, then every
  // row the account is known to hold (memory-confirmed) leaves; rows with no memory, a differing hash or an
  // unfinished flush stay as this device's own data; preferences and My Fonts stay; the memory of removed rows
  // goes, the mark goes, other tabs are told through the broadcast stamp, and the page's own writers are
  // swallowed until the reload.
  // A button sign-out (this tab: the account module awaits this before its SDK sign-out) or another tab's (`opts.rows`, its
  // broadcast). The removal is decided per row against the sync memory: only a row whose projected hash still equals
  // what the account was last known to hold leaves the device; anything else stays as this device's own data.
  //  - This tab: the page's pending edits are flushed first (bounded), then — unless the account turns out to be
  //    gone (a definite answer, never a guess), in which case nothing is removed — the removal, then the broadcast.
  //  - A tab following another's sign-out: nothing is sent (that session is ending); the page's in-memory state is
  //    written to storage so the comparison sees it, the other tab's removed rows (with their memory, which it already
  //    deleted) are the reference, and a row this tab changed keeps that memory, so the next sign-in sends the change
  //    up instead of replacing it with the account's copy.
  //  - A single row with per-device fields (the registry's omit list) loses only the fields that travel.
  function removeAccountCache(uid, opts) {
    opts = opts || {};
    if (!uid) return Promise.resolve({ removed: 0 });
    closeCard();
    if (cardPending) { cardPending = null; }
    Object.keys(timers).forEach(function (tool) { if (timers[tool]) { clearTimeout(timers[tool]); timers[tool] = null; } });
    if (opts.keepLocal) { dropHydrated(uid); hookOn = false; return Promise.resolve({ removed: 0, kept: true }); }
    var follower = Array.isArray(opts.rows);
    var removed = 0, removedRows = [];
    var hinted = {};   // the rows another tab removed, with the memory it held for them
    (follower ? opts.rows : []).forEach(function (x) { if (x && x.tool && x.kind && x.name && x.h) hinted[x.tool + '\u0001' + x.kind + '\u0001' + x.name] = { h: x.h, id: x.id || null, u: x.u || null }; });
    var memOf = function (tool, kind, name) { return metaGet(uid, tool, kind, name) || hinted[tool + '\u0001' + kind + '\u0001' + name] || null; };
    var keepWithMemory = function (tool, kind, name, mem) {   // a row this tab changed: keep it, and the memory that makes it "changed here"
      if (!metaGet(uid, tool, kind, name) && mem && mem.id) metaSet(uid, tool, kind, name, { h: mem.h, id: mem.id, u: mem.u, at: now() });
    };
    // A row this tab changed on top of an older copy than the account's (another tab or device wrote it since this
    // tab last read it): kept, and remembered against what this tab saw (no stamp, so the account reads as moved
    // too) — the next sign-in merges a settings row field by field against that view (the base) and keeps both
    // copies of an item, so neither this tab's change nor the newer one is lost.
    var keepAgainstView = function (tool, entry, name, seenH, mem) { rememberView(uid, tool, entry, name, seenH, mem); };
    var finalFlush = Promise.resolve().then(function () {
      Object.keys(pages).forEach(function (tool) { var cfg = pages[tool]; if (cfg && !cfg.pulled) withSelfWrite(function () { try { if (typeof cfg.finalFlush === 'function') cfg.finalFlush(); else flushPage(tool); } catch (e) { warn('finalFlush failed:', e); } }); });
      if (follower) { dirty = {}; return null; }   // the other tab's session is ending: nothing is sent from here
      Object.keys(hydratedTools).forEach(function (tool) { if (hydratedTools[tool] !== uid) return; registryFor(tool).forEach(function (e) { if (!dirty[tool]) dirty[tool] = {}; dirty[tool][e.kind] = true; }); });
      return flushAllNow();
    });
    var bounded = Promise.race([finalFlush, new Promise(function (r) { setTimeout(r, SIGNOUT_FLUSH_MS); })]);
    return bounded.catch(noop).then(function () {
      return follower ? true : accountAliveWithin(2500);
    }).then(function (alive) {
      if (!alive) { dropHydrated(uid); hookOn = false; return 'gone'; }   // deleted on another device: both copies must not go
      hookOn = false;
      installHook();
      purging = true;
      var tools = toolsWithEntries().filter(function (tool) { return tool !== 'Suite'; });
      return seqMap(tools, function (tool) {
        var entries = registryFor(tool);
        return seqMap(entries.filter(function (e) { return e.shape !== 'tree'; }), function (entry) {
          return seqMap(localItems(entry), function (it) {
            var mem = memOf(tool, entry.kind, it.name);
            if (!mem) return Promise.resolve();
            return hashItem(entry, it.value).then(function (h) {
              if (h !== mem.h) {
                var seenH = seenHashOf(tool, entry.kind, it.name);
                if (!seenH || seenH === mem.h) { keepWithMemory(tool, entry.kind, it.name, mem); return; }
                if (h !== seenH) { keepAgainstView(tool, entry, it.name, seenH, mem); return; }
                // this tab's copy is exactly what it last saw and the account holds a newer one: it goes like a synced row
              }
              var op;
              if (entry.shape === 'map' || entry.shape === 'mapIn') op = localRemove(entry, it.name);
              else if (sharesKey(entry) || (entry.omit && entry.omit.length)) op = localStripProjected(entry);   // per-device fields and a sibling's items stay
              else op = localRemove(entry, it.name);
              return op.then(function () { removed++; removedRows.push({ tool: tool, kind: entry.kind, name: it.name, h: mem.h, id: mem.id || null, u: mem.u || null }); metaDelete(uid, tool, entry.kind, it.name); if (entry.merge === 'assign') markStripped(uid, tool, entry.kind, it.name); });
            });
          });
        }).then(function () {
          return seqMap(entries.filter(function (e) { return e.shape === 'tree'; }), function (entry) {
            var local = localTree(entry), mem = memOf(tool, entry.kind, DEFAULT_NAME);
            if (!local || !mem) return Promise.resolve();
            return hashItem(entry, local).then(function (h) {
              if (h !== mem.h) { keepWithMemory(tool, entry.kind, DEFAULT_NAME, mem); return; }
              return localRemove(entry, DEFAULT_NAME).then(function () { removedRows.push({ tool: tool, kind: entry.kind, name: DEFAULT_NAME, h: h, id: mem.id || null, u: mem.u || null }); metaDelete(uid, tool, entry.kind, DEFAULT_NAME); });
            });
          });
        });
      });
    }).then(function (outcome) {
      if (outcome === 'gone') return { removed: 0, kept: true, accountGone: true };
      dropHydrated(uid);
      if (!follower) { var st = stampsAll(); st.signedOut = { uid: uid, at: Date.now(), rows: removedRows }; stampsSave(st); }   // the broadcast (a tab following one does not re-broadcast)
      return { removed: removed };
    });
  }
  // Another tab pressed Sign out (its broadcast stamp), or this tab's session ended by itself.
  function onSignedOutElsewhere(prevUid) {
    var a = A();
    var st = stampsAll(), bc = isPlainObject(st.signedOut) ? st.signedOut : null;
    var mine = a && typeof a.signOutHandled === 'function' && a.signOutHandled();
    if (mine) return;   // this tab's own sign-out: the hook already ran (or keepLocal said not to)
    if (bc && bc.uid === prevUid && Date.now() - bc.at < 120000 && bc.at >= signedInAt) {
      // a button sign-out in another tab: the same removal here, then a reload so the in-memory copy goes too
      removeAccountCache(prevUid, { rows: bc.rows || [] }).catch(noop).then(function () { if (needsReload()) location.reload(); });
      return;
    }
    // a session that ended by itself: the copies stay as this device's own data, and so does the memory (dropHydrated)
    dropHydrated(prevUid);
    hookOn = false;
  }

  /* ---------- wiring ---------- */
  // Another tab's write: a module write (a download there) → re-read that key here and hydrate; a page write →
  // mark the kind stale here (the next flush hydrates before diffing, and never deletes by absence), because
  // replacing a live setup or a board mid-edit with another tab's write would be worse than a moment's staleness.
  // `live`: called from a storage event while this tab may be in use. A download in another tab then only marks the kind
  // stale in a tab that has the focus (the teacher may be typing there; its next write merges, actionFor), and the stamp
  // stays unread so the next look — the tab shown again, pageshow — re-reads it.
  // The page says a live edit is open (a board being typed, a class list in its box) — in a window that may not have
  // the focus: another tab's download is then held like one arriving in a focused tab, never re-rendered over the edit.
  function pageEditing(tool) { var cfg = pages[tool]; try { return !!(cfg && typeof cfg.editing === 'function' && cfg.editing()); } catch (e) { return false; } }
  function recheckWrites(live) {
    var m, stamps, lw, touched = {};
    var focused = false; try { focused = !!live && document.hasFocus(); } catch (e) {}
    try { m = stampsAll(); stamps = stampsOf(m); } catch (e) { return false; }
    lw = isPlainObject(m.lastWrite) ? m.lastWrite : {};
    if (isPlainObject(m.signedOut) && eventUser && m.signedOut.uid === eventUser && Date.now() - m.signedOut.at < 120000 && m.signedOut.at >= signedInAt) {   // not a sign-out from before this tab's session
      var a = A();
      if (!(a && typeof a.signOutHandled === 'function' && a.signOutHandled())) { eventUser = null; removeAccountCache(m.signedOut.uid, { rows: m.signedOut.rows || [] }).catch(noop).then(function () { if (needsReload()) location.reload(); }); return true; }
    }
    Object.keys(stamps).forEach(function (tool) {
      Object.keys(stamps[tool]).forEach(function (kind) {
        var at = stamps[tool][kind];
        if (seen[tool] && seen[tool][kind] === at) return;
        if (!pages[tool]) { markSeen(tool, kind, at); return; }
        var pw = isPlainObject(m.pageWrites) && isPlainObject(m.pageWrites[tool]) ? m.pageWrites[tool][kind] : null;
        var pageWrite = pw === at || (lw.tool === tool && lw.kind === kind && lw.at === at && lw.source === 'page');
        if (pageWrite || ((focused || pageEditing(tool)) && !pages[tool].pulled)) { if (!stale[tool]) stale[tool] = {}; stale[tool][kind] = true; if (pageWrite) markSeen(tool, kind, at); return; }
        markSeen(tool, kind, at);
        notifyPage(tool, kind, (lw.tool === tool && lw.kind === kind) ? lw.name : null);
        touched[tool] = true;
      });
    });
    Object.keys(touched).forEach(function (tool) { if (currentUser()) hydrate([tool]).catch(noop); else renderStatus(tool); });
    return Object.keys(touched).length > 0;
  }
  function toolsOf(cfg) { return normTools([cfg.tool, 'Suite'].concat(cfg.alsoPull || [])); }
  function attachedTools() {
    var out = [];
    Object.keys(pages).forEach(function (tool) { if (!pages[tool].pulled && pages[tool].hydrate !== false) out = out.concat(toolsOf(pages[tool])); });
    return normTools(out);
  }
  function listen() {
    if (listening) return;
    listening = true;
    var a = A();
    if (a && typeof a.onChange === 'function') {
      a.onChange(function (user) {
        var uid = user ? user.id : null;
        if (user) {
          if (uid !== eventUser) { listedFor = {}; stale = {}; seenNames = {}; tabBase = {}; hydratedTools = {}; signedInAt = Date.now(); snapshotLocal(attachedTools()); }
          purging = false;   // a page that did not reload after a sign-out (needsReload) is signed in again: writes go through
          var todo = attachedTools().filter(function (tool) { return listedFor[tool] !== uid; });
          eventUser = uid;
          renderAllStatuses();
          if (!todo.length) return;
          todo.forEach(function (tool) { listedFor[tool] = uid; });
          hydrate(todo).catch(noop);
          return;
        }
        var prev = eventUser;
        eventUser = null; listedFor = {}; plans = {}; hookOn = false;
        if (!prev && !(a && typeof a.hasStoredSession === 'function' && a.hasStoredSession())) dropHydrated(null);   // a load with no session: the device was signed out since
        Object.keys(statuses).forEach(function (tool) { statuses[tool].state = null; });
        renderAllStatuses();
        closeCard();
        if (prev) onSignedOutElsewhere(prev);
      });
    }
    if (a && typeof a.onSignOut === 'function') a.onSignOut(function (uid, opts) { return removeAccountCache(uid, opts); });
    if (a && typeof a.onNameStep === 'function') a.onNameStep(function () { nameStepDone = true; if (nameStepWaiting) { var open = nameStepWaiting; nameStepWaiting = null; whenReady(open); } });
    try { seen = stampsOf(stampsAll()); } catch (e) {}
    window.addEventListener('storage', function (e) { if (e.key === META_KEY && e.newValue) recheckWrites(true); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { hiddenFlushed = false; recheckWrites(); } else { finalFlushNow(); hiddenFlushed = true; } });
    window.addEventListener('pageshow', function () { if (document.visibilityState === 'visible') hiddenFlushed = false; recheckWrites(); });
    window.addEventListener('pagehide', finalFlushNow);
    window.addEventListener('online', function () {
      if (!currentUser()) return;
      var failed = Object.keys(statuses).filter(function (tool) { var s = statuses[tool]; return s && (s.state === 'error' || s.state === 'offline_pending'); });
      Object.keys(dirty).forEach(function (tool) { if (Object.keys(dirty[tool] || {}).length) scheduleFlush(tool, 0); });
      if (failed.length) hydrate(failed).catch(noop);
    });
    if (window.I18n) {
      try { if (window.I18n.ready && window.I18n.ready.then) window.I18n.ready.then(renderAllStatuses); } catch (e) {}
      try { if (typeof window.I18n.onChange === 'function') window.I18n.onChange(renderAllStatuses); } catch (e) {}
    }
  }
  // The page is being hidden or left: its own last writes (the debounced settings save, a class list being typed, an
  // open board edit) are made now, and every kind of its tool is compared with the memory and sent if it changed —
  // the page's own pagehide writers may run after this listener, and a write made under selfWrite marks nothing dirty.
  function finalFlushNow() {
    if (!hookOn || purging || suspended || !currentUser()) return;
    var uid = currentUser().id;
    Object.keys(pages).forEach(function (tool) {
      var cfg = pages[tool]; if (!cfg || cfg.pulled) return;
      if (staleWhileHidden(tool)) return;   // closing a background tab another tab has written since: nothing new here
      withSelfWrite(function () { try { if (typeof cfg.finalFlush === 'function') cfg.finalFlush(); else if (typeof cfg.flush === 'function') cfg.flush(); } catch (e) {} });
      registryFor(tool).forEach(function (e) { persistStaleView(tool, e.kind); });
      if (hydratedTools[tool] === uid) registryFor(tool).forEach(function (e) { if (!e.virtual) { if (!dirty[tool]) dirty[tool] = {}; dirty[tool][e.kind] = true; } });
    });
    Object.keys(dirty).forEach(function (tool) { if (Object.keys(dirty[tool] || {}).length) { if (timers[tool]) { clearTimeout(timers[tool]); timers[tool] = null; } flush(tool).catch(noop); } });
  }
  function whenReady(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { fn(); }); else fn(); }
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
      entriesByKey = null;
    });
    var bad = IVRIT_SYNC_REGISTRY.filter(function (e) { return e.tool === tool && validEntry(e); });
    bad.forEach(function (e) { warn('registry entry is invalid and ignored:', validEntry(e), e); });
    registryFor(tool).forEach(function (e) {
      if (NEEDS_HOOK[e.shape] && typeof cfg.onLocalChanged !== 'function') warn('attach:', tool, e.kind, 'is upload-only: the page gave no onLocalChanged, so a download could be undone by its own in-memory state');
    });
    if (cfg.panel && !cfg.status) { cfg.status = cfg.panel; warn('attach: `panel` is now `status`'); }
    if (cfg.open || cfg.deviceBackup || cfg.title !== undefined) warn('attach: `open`, `title` and `deviceBackup` are no longer used');
    pages[tool] = cfg;
    (cfg.alsoPull || []).forEach(function (other) {
      if (TOOLS.indexOf(other) < 0 || other === tool) return;
      if (pages[other] && !pages[other].pulled) return;   // that tool's own page is here: its hooks win
      pages[other] = safeAssign({ pulled: true }, { merges: cfg.merges, onLocalChanged: cfg.onLocalChanged, paused: cfg.paused, hydrate: cfg.hydrate });
    });
    if (cfg.status) mountStatus(cfg.status, tool);
    snapshotLocal(toolsOf(cfg));   // what this page loaded is what it holds (a deletion before the first hydration is a deletion)
    listen();   // IvritAccount.onChange fires once when the state is known — that call hydrates every attached tool
    if (cfg.hydrate !== false && currentUser()) {
      var uid = currentUser().id;
      var todo = toolsOf(cfg).filter(function (t2) { return listedFor[t2] !== uid; });
      todo.forEach(function (t2) { listedFor[t2] = uid; });
      if (todo.length) hydrate(todo).catch(noop);
    }
    return true;
  }

  /* ---------- public surface ---------- */
  window.IvritSaves = {
    attach: attach,
    mountStatus: mountStatus,
    hydrate: hydrate,
    flush: flush,
    suspend: suspend,
    fontDeleted: fontDeleted,
    needsReload: needsReload,
    pendingSignOut: pendingSignOut,
    lastPlan: function (tool) { return plans[tool] || null; },   // the last classification, synchronously (a page hook reads a row's state from it)
    registry: function () { return registryAll().map(function (e) { return safeAssign({}, e); }); },
    local: {
      list: function (tool) { return localSide(tool).then(function (items) { return items.map(function (it) { return { id: it.kind + ':' + it.name, kind: it.kind, name: it.name, label: it.label, hash: it.hash, bytes: it.bytes }; }); }); },
      load: function (tool, kind, name) { var e = entryFor(tool, kind); var it = e && localItem(e, name); return Promise.resolve(it ? { kind: it.kind, name: it.name, data: clone(it.value) } : null); },
      save: function (tool, kind, name, value) { var e = entryFor(tool, kind); if (!e) return Promise.reject(makeError('bad_kind')); if (!validateShape(e, value)) return Promise.reject(makeError('shape')); return localWrite(e, name, value); },
      remove: function (tool, kind, name) { var e = entryFor(tool, kind); if (!e) return Promise.reject(makeError('bad_kind')); return localRemove(e, name); }
    },
    cloud: { list: cloudList, load: cloudLoad, insert: cloudInsert, updateIf: cloudUpdateIf, remove: cloudRemove, removeIf: cloudRemoveIf },
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
      suitePrefs: SUITE_PREFS, userFonts: USER_FONTS, bytesToB64: bytesToB64, b64ToBytes: b64ToBytes, isUntouchedDefaultClass: isUntouchedDefaultClass, copyLabelFor: copyLabelFor,
      hydrateActionFor: hydrateActionFor, hydrate: function (tools) { return hydrate(tools); }, flush: flush, markDirty: markDirty, markHydrated: markHydrated, openCard: openCard, removeAccountCache: removeAccountCache, planTool: planTool,
      tabState: function () { return { stale: JSON.parse(JSON.stringify(stale)), hiddenFlushed: hiddenFlushed }; },
      idle: function () { return !Object.keys(dirty).some(function (t2) { return Object.keys(dirty[t2] || {}).length > 0; }) && !Object.keys(busy).some(function (t2) { return busy[t2]; }) && !Object.keys(hydrating).some(function (t2) { return hydrating[t2]; }) && !Object.keys(pendingHydrate).length; },
      settled: function (tools) {
        var a = A(), st = a ? a.status() : 'unavailable';
        if (st === 'anonymous' || st === 'disabled' || st === 'unavailable' || st === 'offline') return window.IvritSaves._test.idle();
        if (st === 'loading') return false;
        tools = normTools(tools && tools.length ? tools : attachedTools());
        var done = tools.every(function (tool) { return hydratedEvents.some(function (ev) { return ev.tools.indexOf(tool) >= 0; }); });
        return done && !cardPending && window.IvritSaves._test.idle();
      },
      META_KEY: META_KEY, META2_KEY: META2_KEY, HASH_PREFIX: HASH_PREFIX, MAX_BYTES: MAX_BYTES, DASHBOARD_DEFAULT_PRESET_CANON: DASHBOARD_DEFAULT_PRESET_CANON, TOOLS: TOOLS
    }
  };
  // The sign-out hook, the name-step follow-up and the cross-tab listeners belong to every page that loads this
  // module, including one with no registry rows of its own: start listening at boot, not only on attach().
  if (A()) listen();
})();
