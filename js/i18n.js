/*
 * i18n.js — shared runtime i18n for IvritSuite.
 * Load on any page (mirrors /pwa.js):  <script src="/js/i18n.js" defer></script>
 *
 * Exposes window.I18n:
 *   I18n.lang               active language code ('en' | 'he')
 *   I18n.dir                'ltr' | 'rtl'
 *   I18n.ready              Promise that resolves once /locales/<lang>.json is loaded
 *   I18n.t(key, params)     translate; substitutes {placeholders}; returns key (+ warn) if missing
 *   I18n.setLang(code)      switch language LIVE (no reload): swaps the locale, flips dir/lang,
 *                           updates switchers, then fires every onChange handler
 *   I18n.onChange(fn)       register fn(lang, dir) to re-render the page after a live switch
 *   I18n.applyStaticI18n(root)  fill [data-i18n]/[data-i18n-title|aria-label|placeholder|html]
 *   I18n.createSwitcher()   -> a DOM node: a <select> dropdown (🇺🇸 EN / 🇮🇱 עברית — flag is decorative,
 *                           label carries it on Windows where flag glyphs fall back to letters)
 *   I18n.mountSwitchers()   -> fill every [data-i18n-switcher] slot
 * A guarded global `t` alias is also set (only if window.t is undefined).
 *
 * Language selection: ?lang= URL param (persisted) > localStorage['hebrewBlender_lang'] > 'en'.
 * On load it sets document.documentElement.lang + dir (he -> rtl, en -> ltr).
 *
 * LIVE SWITCH: setLang() does NOT reload — it fetches the other locale (cached after first use),
 * swaps the active dictionary, updates <html> lang/dir, drops any ?lang= override via
 * history.replaceState, refreshes switcher state, and fires onChange handlers. A converted page
 * registers I18n.onChange(function(){ I18n.applyStaticI18n(); ...re-render dynamic content... }) so
 * the whole UI repaints in place with all in-memory state intact. If the locale fetch fails, setLang
 * falls back to the old persist-and-reload behavior so a switch never dead-ends.
 *
 * NO-FLASH SNIPPET — because this file is deferred, paste this tiny inline IIFE into each page's
 * <head> (before any render, next to the dark-mode IIFE) so dir/lang is set pre-paint and Hebrew
 * does not flash LTR->RTL:
 *
 *   <script>(function(){try{var p=new URLSearchParams(location.search).get('lang');
 *     var l=(p==='en'||p==='he')?p:(localStorage.getItem('hebrewBlender_lang')||'en');
 *     if(l!=='en'&&l!=='he')l='en';
 *     document.documentElement.lang=l;
 *     document.documentElement.dir=(l==='he'?'rtl':'ltr');}catch(e){}})();</script>
 */
(function () {
  'use strict';

  var SUPPORTED = ['en', 'he'];
  var DEFAULT_LANG = 'en';
  var RTL_LANGS = ['he'];
  var LS_KEY = 'hebrewBlender_lang';

  function isSupported(l) { return SUPPORTED.indexOf(l) !== -1; }
  function lsGet() { try { return localStorage.getItem(LS_KEY); } catch (e) { return null; } }
  function lsSet(l) { try { localStorage.setItem(LS_KEY, l); } catch (e) {} }

  // Resolve active language: ?lang= (valid -> persisted) > localStorage > default.
  function resolveLang() {
    var urlLang = null;
    try { urlLang = new URLSearchParams(window.location.search).get('lang'); } catch (e) {}
    if (urlLang && isSupported(urlLang)) { lsSet(urlLang); return urlLang; }
    var stored = lsGet();
    if (stored && isSupported(stored)) return stored;
    return DEFAULT_LANG;
  }

  var lang = resolveLang();
  var dir = RTL_LANGS.indexOf(lang) !== -1 ? 'rtl' : 'ltr';

  // Per-language dictionary cache so a live switch never re-fetches a locale it already loaded.
  var dicts = {};
  var dict = {};
  // Becomes true once a locale dict has actually loaded. Gates the missing-key warning: before
  // I18n.ready resolves, `dict` is {} so EVERY key looks "missing" — pages that call I18n.t() during
  // init (before the deferred locale fetch lands) would otherwise flood the console with hundreds of
  // false [i18n] missing-key warnings on every load. applyI18n re-renders on ready, so display self-heals.
  var dictLoaded = false;

  // onChange handlers — fired after each successful live switch.
  var changeHandlers = [];

  function applyLangAttrs() {
    try {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', dir);
    } catch (e) {}
  }

  // Re-assert on <html> (the inline no-flash IIFE sets this pre-paint; this is the authoritative set).
  applyLangAttrs();

  function substitute(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, function (m, name) {
      return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m;
    });
  }

  function t(key, params) {
    if (!Object.prototype.hasOwnProperty.call(dict, key)) {
      // Only warn once a dict is actually loaded — pre-ready every key looks missing (see dictLoaded).
      if (dictLoaded && typeof console !== 'undefined' && console.warn) console.warn('[i18n] missing key: ' + key);
      return key;
    }
    return substitute(dict[key], params);
  }

  // ---- Static-DOM pass -----------------------------------------------------------------------
  // Fill text + a small set of attributes from data-* keys. Called on ready and inside onChange.
  var STATIC_ATTRS = [
    ['data-i18n-title', 'title'],
    ['data-i18n-aria-label', 'aria-label'],
    ['data-i18n-placeholder', 'placeholder'],
    ['data-i18n-tip', 'data-tip']   // suite-wide accessible-tooltip attribute (.tip-wrap/.has-tip)
  ];
  function applyStaticI18n(root) {
    root = root || document;
    var textNodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textNodes.length; i++) {
      var k = textNodes[i].getAttribute('data-i18n');
      if (k) textNodes[i].textContent = t(k);
    }
    for (var a = 0; a < STATIC_ATTRS.length; a++) {
      var nodes = root.querySelectorAll('[' + STATIC_ATTRS[a][0] + ']');
      for (var j = 0; j < nodes.length; j++) {
        var ak = nodes[j].getAttribute(STATIC_ATTRS[a][0]);
        if (ak) nodes[j].setAttribute(STATIC_ATTRS[a][1], t(ak));
      }
    }
    // data-i18n-html: only for our own trusted strings (the values come from the committed CSV).
    var htmlNodes = root.querySelectorAll('[data-i18n-html]');
    for (var h = 0; h < htmlNodes.length; h++) {
      var hk = htmlNodes[h].getAttribute('data-i18n-html');
      if (hk) htmlNodes[h].innerHTML = t(hk);
    }
  }

  function onChange(fn) {
    if (typeof fn === 'function') changeHandlers.push(fn);
  }
  function fireChange() {
    for (var i = 0; i < changeHandlers.length; i++) {
      try { changeHandlers[i](lang, dir); }
      catch (e) {
        if (typeof console !== 'undefined' && console.error) console.error('[i18n] onChange handler failed:', e);
      }
    }
  }

  // ---- Locale loading ------------------------------------------------------------------------
  function loadDict(l) {
    if (dicts[l]) return Promise.resolve(dicts[l]);
    return fetch('/locales/' + l + '.json', { credentials: 'same-origin' })
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(function (data) { dicts[l] = data || {}; return dicts[l]; });
  }

  // Refreshes both the selected value AND the control's accessible name. Doing the name here rather
  // than leaning on each page's applyI18n keeps the shared switcher correct on its own — 12 separate
  // call sites is exactly how a never-re-rendered string gets frozen in the previous language.
  function updateSwitcherState() {
    var sels = document.querySelectorAll('.i18n-switch select');
    var aria = switcherAria();
    for (var i = 0; i < sels.length; i++) { sels[i].value = lang; sels[i].setAttribute('aria-label', aria); }
  }

  // ---- Live language switch (no reload) ------------------------------------------------------
  function setLang(next) {
    if (!isSupported(next) || next === lang) return;
    lsSet(next);
    loadDict(next).then(function (d) {
      dict = d;
      lang = next;
      dir = RTL_LANGS.indexOf(lang) !== -1 ? 'rtl' : 'ltr';
      I18n.lang = lang;
      I18n.dir = dir;
      applyLangAttrs();
      // Drop any ?lang= override so localStorage stays authoritative — without navigating.
      try {
        var url = new URL(window.location.href);
        if (url.searchParams.has('lang')) {
          url.searchParams.delete('lang');
          window.history.replaceState(null, '', url.toString());
        }
      } catch (e) {}
      updateSwitcherState();
      fireChange();
    }).catch(function (err) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('[i18n] live switch failed, falling back to reload:', err);
      }
      // Fallback: persist (already done) + reload with ?lang= stripped so it still switches.
      try {
        var url2 = new URL(window.location.href);
        url2.searchParams.delete('lang');
        window.location.replace(url2.toString());
      } catch (e2) { window.location.reload(); }
    });
  }

  // ---- Language switcher (self-styled; works under any header) --------------------------------
  var STYLE_ID = 'i18n-switch-style';
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      // direction:ltr keeps the flag+label order and the caret side stable on RTL pages.
      // appearance:none guarantees the custom bg/color apply (so dark mode is correct on Safari too);
      // the caret is a ::after pseudo (var(--muted) → theme-adaptive), not a fixed-color SVG.
      '.i18n-switch{position:relative;display:inline-flex;direction:ltr;vertical-align:middle;font-family:inherit;}' +
      '.i18n-switch::after{content:"\\25BE";position:absolute;inset-inline-end:8px;top:50%;transform:translateY(-50%);' +
      'font-size:0.7rem;color:var(--muted,#6b6050);pointer-events:none;}' +
      '.i18n-switch select.i18n-select{appearance:none;-webkit-appearance:none;margin:0;cursor:pointer;' +
      'font-family:inherit;font-size:0.78rem;font-weight:600;line-height:1.3;direction:ltr;' +
      'color:var(--text,#1a2744);background:var(--white,#fff);' +
      // min-height holds the suite's ratified 30px touch floor (S102). Padding alone left it at
      // 26.2px on all 12 pages; the caret is centred off the wrapper, so it follows the taller box.
      'border:1px solid var(--border,#c8bfa8);border-radius:6px;padding-block:4px;padding-inline:8px 24px;' +
      'min-height:30px;box-sizing:border-box;}' +
      '.i18n-switch select.i18n-select:hover{background:var(--warm-gray,#e8e0d0);}' +
      '.i18n-switch select.i18n-select:focus-visible{outline:2px solid var(--gold,#c9922a);outline-offset:1px;}';
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  }

  // flag is a decorative regional-indicator emoji shown in the option text. NOTE: it is NOT a real
  // glyph on Windows (Segoe UI Emoji ships no flags — it falls back to the "US"/"IL" letter pair), so
  // the text `label` must always accompany it; never make an option flag-only. `aria` is unused by the
  // <select> (each option is announced by its own text) but kept for parity with future custom UIs.
  var SWITCHER_LANGS = [
    { code: 'en', label: 'EN', flag: '🇺🇸', aria: 'English' },
    { code: 'he', label: 'עברית', flag: '🇮🇱', aria: 'Hebrew' }
  ];

  // The switcher has NO visible label — just a flag and a language code — so this aria-label is the
  // only name a screen-reader or voice-control user has for the control. It follows the UI language:
  // once the UI is Hebrew the document already carries lang="he", so a Hebrew name is read with a
  // Hebrew voice (which is why localizing beats a bilingual literal here). Read through this guard,
  // never t() directly: pre-ready t() returns the KEY, and writing that into aria-label would give
  // the control the accessible name "shared.lang.switcher_aria".
  var SWITCHER_ARIA_KEY = 'shared.lang.switcher_aria';
  function switcherAria() {
    var v = t(SWITCHER_ARIA_KEY);
    return v === SWITCHER_ARIA_KEY ? 'Language' : v;
  }

  // A native <select> dropdown: fully keyboard/touch/screen-reader accessible for free, and it scales
  // cleanly as languages are added (vs. an ever-growing row of buttons). Live-switches on `change`.
  function createSwitcher() {
    injectStyle();
    var wrap = document.createElement('div');
    wrap.className = 'i18n-switch';
    var sel = document.createElement('select');
    sel.className = 'i18n-select';
    sel.setAttribute('aria-label', switcherAria());          // pre-ready this is the English literal
    sel.setAttribute('data-i18n-aria-label', SWITCHER_ARIA_KEY);   // so applyStaticI18n refreshes it as well
    SWITCHER_LANGS.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.code;
      opt.textContent = (o.flag ? o.flag + ' ' : '') + o.label;
      if (o.code === lang) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () { if (sel.value !== lang) setLang(sel.value); });
    wrap.appendChild(sel);
    return wrap;
  }

  function mountSwitchers() {
    var slots = document.querySelectorAll('[data-i18n-switcher]');
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].getAttribute('data-i18n-mounted') === '1') continue;
      slots[i].appendChild(createSwitcher());
      slots[i].setAttribute('data-i18n-mounted', '1');
    }
  }

  // ---- Load the active locale ----------------------------------------------------------------
  var ready = loadDict(lang)
    .then(function (data) { dict = data; dictLoaded = true; return dict; })
    .catch(function (err) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('[i18n] failed to load /locales/' + lang + '.json:', err);
      }
      dict = {};
      return dict;
    });

  // Mount can win the race against the dict fetch (mountSwitchers runs at DOMContentLoaded), which
  // would leave the English fallback in place on a Hebrew first load. Re-apply once the dict lands.
  // Separate statement, NOT a reassignment of `ready` — I18n.ready must stay the same promise.
  ready.then(function () { updateSwitcherState(); });

  var I18n = {
    lang: lang,
    dir: dir,
    supported: SUPPORTED.slice(),
    ready: ready,
    t: t,
    setLang: setLang,
    onChange: onChange,
    applyStaticI18n: applyStaticI18n,
    createSwitcher: createSwitcher,
    mountSwitchers: mountSwitchers
  };
  window.I18n = I18n;
  if (typeof window.t === 'undefined') window.t = t;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountSwitchers);
  } else {
    mountSwitchers();
  }
})();
