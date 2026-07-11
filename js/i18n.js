/*
 * i18n.js — shared runtime i18n for IvritSuite.
 * Load on any page (mirrors /pwa.js):  <script src="/js/i18n.js" defer></script>
 *
 * Exposes window.I18n:
 *   I18n.lang            active language code ('en' | 'he')
 *   I18n.dir             'ltr' | 'rtl'
 *   I18n.ready           Promise that resolves once /locales/<lang>.json is loaded
 *   I18n.t(key, params)  translate; substitutes {placeholders}; returns key (+ warn) if missing
 *   I18n.setLang(code)   persist choice and reload
 *   I18n.createSwitcher()  -> a DOM node (EN / עברית)
 *   I18n.mountSwitchers()  -> fill every [data-i18n-switcher] slot
 * A guarded global `t` alias is also set (only if window.t is undefined).
 *
 * Language selection: ?lang= URL param (persisted) > localStorage['hebrewBlender_lang'] > 'en'.
 * On load it sets document.documentElement.lang + dir (he -> rtl, en -> ltr).
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

  // Re-assert on <html> (the inline no-flash IIFE sets this pre-paint; this is the authoritative set).
  try {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  } catch (e) {}

  var dict = {};

  function substitute(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, function (m, name) {
      return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m;
    });
  }

  function t(key, params) {
    if (!Object.prototype.hasOwnProperty.call(dict, key)) {
      if (typeof console !== 'undefined' && console.warn) console.warn('[i18n] missing key: ' + key);
      return key;
    }
    return substitute(dict[key], params);
  }

  function setLang(next) {
    if (!isSupported(next)) return;
    lsSet(next);
    try {
      // Drop any ?lang= override so localStorage is authoritative after the reload.
      var url = new URL(window.location.href);
      url.searchParams.delete('lang');
      window.location.replace(url.toString());
    } catch (e) {
      window.location.reload();
    }
  }

  // ---- Language switcher (self-styled; works under any header) --------------------------------
  var STYLE_ID = 'i18n-switch-style';
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '.i18n-switch{display:inline-flex;border:1px solid var(--border,#c8bfa8);border-radius:6px;' +
      'overflow:hidden;vertical-align:middle;font-family:inherit;}' +
      '.i18n-switch button{appearance:none;-webkit-appearance:none;border:0;margin:0;cursor:pointer;' +
      'padding:4px 10px;font-size:0.78rem;font-family:inherit;font-weight:600;line-height:1.3;' +
      'background:var(--white,#fff);color:var(--text,#1a2744);}' +
      '.i18n-switch button + button{border-inline-start:1px solid var(--border,#c8bfa8);}' +
      '.i18n-switch button[aria-pressed="true"]{background:var(--gold,#c9922a);color:var(--navy,#1a2744);}' +
      '.i18n-switch button:hover:not([aria-pressed="true"]){background:var(--warm-gray,#e8e0d0);}' +
      '.i18n-switch button:focus-visible{outline:2px solid var(--gold,#c9922a);outline-offset:-2px;}';
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  }

  var SWITCHER_LANGS = [
    { code: 'en', label: 'EN', aria: 'English' },
    { code: 'he', label: 'עברית', aria: 'Hebrew' }
  ];

  function createSwitcher() {
    injectStyle();
    var wrap = document.createElement('div');
    wrap.className = 'i18n-switch';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Language');
    SWITCHER_LANGS.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.label;
      b.setAttribute('lang', o.code);
      b.setAttribute('aria-label', o.aria);
      b.setAttribute('aria-pressed', o.code === lang ? 'true' : 'false');
      b.addEventListener('click', function () { if (o.code !== lang) setLang(o.code); });
      wrap.appendChild(b);
    });
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
  var ready = fetch('/locales/' + lang + '.json', { credentials: 'same-origin' })
    .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function (data) { dict = data || {}; return dict; })
    .catch(function (err) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('[i18n] failed to load /locales/' + lang + '.json:', err);
      }
      dict = {};
      return dict;
    });

  window.I18n = {
    lang: lang,
    dir: dir,
    supported: SUPPORTED.slice(),
    ready: ready,
    t: t,
    setLang: setLang,
    createSwitcher: createSwitcher,
    mountSwitchers: mountSwitchers
  };
  if (typeof window.t === 'undefined') window.t = t;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountSwitchers);
  } else {
    mountSwitchers();
  }
})();
