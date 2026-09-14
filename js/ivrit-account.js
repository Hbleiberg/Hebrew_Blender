/*
 * ivrit-account.js — optional accounts for IvritSuite (Supabase Auth: passwordless email + Google).
 *
 * Load on any page AFTER /js/i18n.js and /js/supabase-config.js (all three deferred, in this order):
 *   <script src="/js/i18n.js" defer></script>
 *   <script src="/js/supabase-config.js" defer></script>
 *   <script src="/js/ivrit-account.js" defer></script>
 *
 * Exposes window.IvritAccount:
 *   ready                      Promise<user|null> — resolves once the initial state is known
 *   status()                   'disabled' | 'anonymous' | 'loading' | 'signed-in' | 'offline' | 'unavailable'
 *   user()                     { id, email, name, provider } | null
 *   onChange(fn)               fn(user|null, status): called once when known, then on every change
 *   signIn('google')           Promise<void> — full-page redirect to Google and back to THIS page
 *   signIn('email', {email})   Promise<{sent:true}> — emails a sign-in link + a 6-digit code
 *   verifyCode(email, code)    Promise<user> — signs in with the emailed code (works on any device)
 *   signOut()                  Promise<void> — this device only
 *   client()                   Promise<SupabaseClient> — loads the SDK on demand; rejects with
 *                              err.code = 'disabled' | 'offline' | 'blocked'
 *   mountChip(target)          element | selector | 'auto' — renders the header chip
 *   init(opts)                 optional { mount: 'auto' | selector | element | false }
 *   t(key, fallback)           translate via I18n when loaded, else the English fallback
 *   onOpenSaves(fn)            a tool registers how to open its cloud panel (adds a menu item)
 *   onOpenAccount(fn)          the saves module registers its account screen ("Account…" menu item)
 *   openMenu()                 opens the chip's menu (false when no chip is mounted) — for a panel's Sign in button
 *   _test                      pure helpers exposed for the smoke test (scripts/smoke-account.mjs)
 *
 * How it stays cheap and safe:
 *   - The Supabase SDK (~60 KB gzipped, from jsDelivr) is loaded ONLY when it is needed: right away
 *     if this page load is an auth callback or a session is already stored, otherwise on the first
 *     click on the chip. Anonymous visitors download nothing extra.
 *   - Everything fails soft. Offline, a blocked CDN, a missing config: the chip says so and the rest
 *     of the page (local saves, .ivrit files) works exactly as before. Nothing here throws.
 *   - PKCE flow, never implicit: only a one-time ?code= ever appears in the URL, so the analytics
 *     snippet that runs before this script can never see a token.
 *   - Redirects come back to the SAME page with its own query string intact (?s=, ?parsha=, …);
 *     only the auth parameters are removed afterwards.
 *   - Nothing user- or server-supplied is ever written with innerHTML (createElement/textContent only).
 */
(function () {
  'use strict';

  var cfg = window.IVRIT_SUPABASE || null;
  var enabled = !!(cfg && cfg.enabled !== false && cfg.url && cfg.anonKey && cfg.sdk);
  var REF = enabled ? refFromUrl(cfg.url) : '';
  var AUTH_KEY = 'sb-' + REF + '-auth-token';        // what the SDK writes (we hand it over as storageKey)
  var VERIFIER_KEY = AUTH_KEY + '-code-verifier';    // the PKCE verifier the SDK stores before a redirect
  var CACHE_KEY = 'ivritSuite_accountCache';         // {email, name}: lets the chip show a name while loading
  var SDK_TIMEOUT_MS = 12000;
  var AUTH_QUERY_KEYS = ['code', 'error', 'error_code', 'error_description'];
  var AUTH_HASH_KEYS = ['access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'type',
    'provider_token', 'provider_refresh_token', 'error', 'error_code', 'error_description'];

  var status = enabled ? 'anonymous' : 'disabled';
  var currentUser = null;
  var client = null;
  var sdkPromise = null;
  var clientPromise = null;
  var handlers = [];
  var openSavesFn = null;
  var openAccountFn = null;
  var pendingError = null;   // an error the auth server sent back in the URL; shown once the chip exists
  var initOpts = null;
  var mounted = false;
  var readyDone = false;
  var readyResolve = null;
  var ready = new Promise(function (res) { readyResolve = res; });
  var chip = null;
  var menuStage = 'email';   // 'email' | 'code' — which step of the email sign-in the form is on
  var lastEmail = '';
  var noteState = null;      // {text, isError} — the popover's note, kept across re-renders (I18n.ready, language switch)

  /* ---------- tiny helpers ---------- */
  function refFromUrl(u) { try { return new URL(u).hostname.split('.')[0]; } catch (e) { return ''; } }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsRemove(k) { try { localStorage.removeItem(k); } catch (e) {} }

  // Translate via the shared i18n runtime when it is loaded; fall back to English otherwise
  // (the chip renders before /js/i18n.js resolves its dictionary, then re-renders on I18n.ready).
  function t(key, fallback, params) {
    var v = null;
    try { if (window.I18n && window.I18n.t) { v = window.I18n.t(key, params); if (!v || v === key) v = null; } } catch (e) { v = null; }
    if (v === null) v = fallback;
    if (params) v = String(v).replace(/\{(\w+)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(params, k) ? params[k] : m; });
    return v;
  }

  function makeError(code, msg) { var e = new Error(msg || code); e.code = code; return e; }
  function setStatus(s) { status = s; }
  function fire() {
    handlers.forEach(function (fn) { try { fn(currentUser, status); } catch (e) { console.warn('[account] onChange handler failed:', e); } });
  }
  function resolveReady() { if (readyDone) return; readyDone = true; readyResolve(currentUser); }

  /* ---------- URL helpers (pure; exported under _test) ---------- */
  function parseAuthParams(href) {
    var out = { query: {}, hash: {} };
    try {
      var u = new URL(href);
      AUTH_QUERY_KEYS.forEach(function (k) { if (u.searchParams.has(k)) out.query[k] = u.searchParams.get(k); });
      var h = u.hash && u.hash.charAt(0) === '#' ? u.hash.slice(1) : '';
      if (h) { var hp = new URLSearchParams(h); AUTH_HASH_KEYS.forEach(function (k) { if (hp.has(k)) out.hash[k] = hp.get(k); }); }
    } catch (e) {}
    return out;
  }
  function hasStoredSession() { return lsGet(AUTH_KEY) !== null; }
  function hasVerifier() { return lsGet(VERIFIER_KEY) !== null; }
  // Is this page load the return leg of a sign-in? (An error return counts; a ?code= only counts when
  // THIS browser started the flow — otherwise the link was opened elsewhere and the SDK must not see it.)
  function isAuthCallback(href, verifierPresent) {
    var p = parseAuthParams(href || location.href);
    if (p.query.error || p.query.error_code || p.query.error_description) return true;
    if (p.hash.access_token || p.hash.error || p.hash.error_code) return true;
    var hasV = (typeof verifierPresent === 'boolean') ? verifierPresent : hasVerifier();
    if (p.query.code && hasV) return true;
    return false;
  }
  // The same URL with only the auth parameters removed: every other query param, the path and any
  // unrelated hash survive untouched.
  function stripAuthParams(href) {
    try {
      var u = new URL(href);
      var touched = false;
      AUTH_QUERY_KEYS.forEach(function (k) { if (u.searchParams.has(k)) { u.searchParams.delete(k); touched = true; } });
      var h = u.hash && u.hash.charAt(0) === '#' ? u.hash.slice(1) : '';
      if (h) {
        var hp = new URLSearchParams(h);
        var had = false;
        AUTH_HASH_KEYS.forEach(function (k) { if (hp.has(k)) { hp.delete(k); had = true; } });
        if (had) { var rest = hp.toString(); u.hash = rest ? '#' + rest : ''; touched = true; }
      }
      return touched ? u.toString() : href;
    } catch (e) { return href; }
  }
  // Where a sign-in should come back to: this very page, its own params kept, no hash.
  function redirectTarget(href) {
    try { var u = new URL(stripAuthParams(href || location.href)); u.hash = ''; return u.toString(); }
    catch (e) { return location.origin + location.pathname; }
  }
  function cleanUrlNow() {
    var before = location.href, after = stripAuthParams(before);
    if (after !== before) { try { history.replaceState(history.state, '', after); } catch (e) {} }
  }
  // An auth error that came back in the URL must be read and removed BEFORE the SDK loads: the SDK
  // treats it as a failed callback and drops the stored session, signing out a user who was already
  // signed in on this device.
  function consumeErrorParams() {
    var p = parseAuthParams(location.href);
    var code = p.query.error_code || p.hash.error_code || '';
    var err = p.query.error || p.hash.error || '';
    var desc = p.query.error_description || p.hash.error_description || '';
    if (!code && !err) return false;
    pendingError = { error: err, code: code, description: desc };
    cleanUrlNow();
    return true;
  }

  /* ---------- SDK loading (lazy, memoised, retry-able) ---------- */
  function loadSdk() {
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise(function (resolve, reject) {
      if (!enabled) return reject(makeError('disabled', 'IvritAccount: accounts are disabled'));
      if (window.supabase && window.supabase.createClient) return resolve(window.supabase);
      if (navigator.onLine === false) return reject(makeError('offline', 'IvritAccount: offline'));
      var done = false;
      var timer = setTimeout(function () { finish(makeError(navigator.onLine === false ? 'offline' : 'blocked', 'IvritAccount: SDK load timed out')); }, SDK_TIMEOUT_MS);
      function finish(err) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (!err && !(window.supabase && window.supabase.createClient)) err = makeError('blocked', 'IvritAccount: SDK loaded without createClient');
        if (err) { sdkPromise = null; reject(err); }   // a later click / the online event can retry
        else resolve(window.supabase);
      }
      var s = document.createElement('script');
      s.src = cfg.sdk;
      s.async = true;
      s.crossOrigin = 'anonymous';
      if (cfg.sdkIntegrity) s.integrity = cfg.sdkIntegrity;
      s.onload = function () { finish(null); };
      s.onerror = function () { finish(makeError(navigator.onLine === false ? 'offline' : 'blocked', 'IvritAccount: SDK failed to load')); };
      (document.head || document.documentElement).appendChild(s);
    });
    return sdkPromise;
  }

  function getClient() {
    if (clientPromise) return clientPromise;
    clientPromise = loadSdk().then(function (sb) {
      if (client) return client;
      client = sb.createClient(cfg.url, cfg.anonKey, {
        auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, storageKey: AUTH_KEY }
      });
      client.auth.onAuthStateChange(function (event, session) { handleAuthEvent(event, session); });
      return client;
    });
    clientPromise.catch(function () { clientPromise = null; });
    return clientPromise;
  }

  function userFromSession(session) {
    var u = session && session.user;
    if (!u) return null;
    var md = u.user_metadata || {};
    var am = u.app_metadata || {};
    return { id: u.id, email: u.email || '', name: md.full_name || md.name || '', provider: am.provider || '' };
  }

  function handleAuthEvent(event, session) {
    var u = userFromSession(session);
    if ((u ? 'signed-in' : 'anonymous') !== status) noteState = null;
    if (u) {
      currentUser = u;
      setStatus('signed-in');
      lsSet(CACHE_KEY, JSON.stringify({ email: u.email, name: u.name }));
    } else {
      currentUser = null;
      setStatus('anonymous');
      lsRemove(CACHE_KEY);
    }
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') cleanUrlNow();
    if (event === 'INITIAL_SESSION') resolveReady();
    renderChip();
    fire();
  }

  /* ---------- public actions ---------- */
  function signIn(method, opts) {
    opts = opts || {};
    return getClient().then(function (c) {
      if (method === 'google') {
        return c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTarget(), queryParams: { prompt: 'select_account' } } })
          .then(function (r) { if (r && r.error) throw r.error; });
      }
      if (method === 'email') {
        var email = String(opts.email || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw makeError('invalid_email', 'IvritAccount: a valid email is required');
        return c.auth.signInWithOtp({ email: email, options: { emailRedirectTo: redirectTarget(), shouldCreateUser: true } })
          .then(function (r) { if (r && r.error) throw r.error; return { sent: true }; });
      }
      throw makeError('bad_method', 'IvritAccount: unknown sign-in method ' + method);
    });
  }

  function verifyCode(email, code) {
    return getClient().then(function (c) {
      var token = String(code || '').replace(/\s+/g, '');
      if (!token) throw makeError('invalid_code', 'IvritAccount: a code is required');
      return c.auth.verifyOtp({ email: String(email || '').trim(), token: token, type: 'email' })
        .then(function (r) { if (r && r.error) throw r.error; return userFromSession(r.data && r.data.session); });
    });
  }

  function signOut() {
    lsRemove(CACHE_KEY);
    function forgetLocally() { lsRemove(AUTH_KEY); currentUser = null; noteState = null; menuStage = 'email'; setStatus(enabled ? 'anonymous' : 'disabled'); renderChip(); fire(); }
    if (!client) { forgetLocally(); return Promise.resolve(); }
    return client.auth.signOut({ scope: 'local' })
      .then(function (r) { if (r && r.error) throw r.error; forgetLocally(); })
      .catch(function (e) { forgetLocally(); throw e; });
  }

  // Map any failure to one localized sentence for the note line.
  function errorText(err) {
    var code = err && (err.code || '');
    var st = err && err.status;
    var msg = String((err && err.message) || '').toLowerCase();
    if (code === 'offline') return t('shared.account.needs_internet', 'Sign-in needs an internet connection.');
    if (code === 'blocked' || code === 'disabled') return t('shared.account.unavailable', 'Cloud sign-in is unavailable right now. Your local saves still work.');
    if (code === 'invalid_email' || code === 'validation_failed' || /valid email/.test(msg)) return t('shared.account.error_email', 'Please enter a valid email address.');
    if (st === 429 || code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || /rate limit/.test(msg)) return t('shared.account.error_rate_limited', 'Too many attempts. Wait a few minutes and try again.');
    if (code === 'invalid_code' || code === 'otp_expired' || code === 'otp_disabled' || (/token|otp|code/.test(msg) && /expired|invalid/.test(msg))) return t('shared.account.error_invalid_code', 'That code is not valid or has expired. Check the email and try again.');
    return t('shared.account.error_generic', 'Something went wrong. Please try again.');
  }
  function pendingErrorText() {
    if (!pendingError) return '';
    if (pendingError.code === 'link_other_browser') return t('shared.account.error_link_other_browser', 'That link was opened in a different browser. Enter the code from the email here instead.');
    if (pendingError.code === 'otp_expired' || /expired|invalid/.test(String(pendingError.description || '').toLowerCase())) return t('shared.account.error_expired', 'That sign-in link has expired. Request a new one.');
    return t('shared.account.error_finish', "Couldn't finish signing in. Please try again.");
  }

  /* ---------- the chip ---------- */
  var STYLE_ID = 'ivacct-style';
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '.ivacct{position:relative;display:inline-flex;align-self:stretch;font-family:inherit;}' +
      '.ivacct-btn{display:inline-flex;align-items:center;gap:6px;min-height:30px;height:100%;box-sizing:border-box;' +
        'padding-block:4px;padding-inline:10px;border:1px solid var(--border,#c8bfa8);border-radius:6px;' +
        'background:var(--white,#fff);color:var(--text,#1a2744);font-family:inherit;font-size:0.78rem;font-weight:600;' +
        'line-height:1.3;cursor:pointer;white-space:nowrap;}' +
      '.ivacct-btn:hover{background:var(--warm-gray,#e8e0d0);}' +
      'body.dark .ivacct-btn:hover{background:#2a3349;}' +
      '.ivacct-btn:focus-visible,.ivacct-item:focus-visible,.ivacct-input:focus-visible{outline:2px solid var(--gold,#c9922a);outline-offset:1px;}' +
      '.ivacct-btn[data-state="offline"],.ivacct-btn[data-state="unavailable"]{opacity:.72;}' +
      '.ivacct-avatar{display:inline-flex;align-items:center;justify-content:center;inline-size:20px;block-size:20px;border-radius:50%;' +
        'background:var(--gold,#c9922a);color:#fff;font-size:0.66rem;font-weight:700;letter-spacing:.02em;flex-shrink:0;}' +
      '.ivacct-menu{position:absolute;inset-inline-end:0;top:calc(100% + 6px);z-index:1200;min-inline-size:260px;max-inline-size:min(92vw,340px);' +
        'padding:10px;border:1px solid var(--border,#c8bfa8);border-radius:10px;background:var(--white,#fff);color:var(--text,#1a2744);' +
        'box-shadow:0 8px 24px rgba(0,0,0,.18);text-align:start;font-size:0.85rem;font-weight:400;}' +
      '.ivacct-menu[hidden]{display:none;}' +
      '.ivacct-item{display:block;inline-size:100%;box-sizing:border-box;margin-block:4px;padding:8px 10px;border:1px solid var(--border,#c8bfa8);' +
        'border-radius:6px;background:transparent;color:inherit;font:inherit;font-weight:600;text-align:start;cursor:pointer;}' +
      '.ivacct-item:hover{background:var(--warm-gray,#e8e0d0);}' +
      'body.dark .ivacct-item:hover{background:#2a3349;}' +
      '.ivacct-item[aria-disabled="true"]{opacity:.55;cursor:default;}' +
      '.ivacct-label{display:block;margin-block:8px 3px;font-size:0.78rem;color:var(--muted,#6b6050);}' +
      '.ivacct-input{display:block;inline-size:100%;box-sizing:border-box;padding:7px 9px;border:1px solid var(--border,#c8bfa8);border-radius:6px;' +
        'background:var(--white,#fff);color:inherit;font:inherit;}' +
      '.ivacct-note{margin:8px 0 0;font-size:0.8rem;color:var(--muted,#6b6050);min-block-size:1em;overflow-wrap:anywhere;}' +
      '.ivacct-note.is-error{color:var(--danger-text,#b3261e);}' +
      '.ivacct-who{margin:0 0 6px;font-size:0.8rem;color:var(--muted,#6b6050);overflow-wrap:anywhere;}' +
      '.ivacct-sep{border:0;border-top:1px solid var(--border,#c8bfa8);margin:8px 0;}' +
      '[hidden].ivacct-code,[hidden].ivacct-form{display:none;}' +
      '@media (prefers-reduced-motion: reduce){.ivacct,.ivacct *{transition-duration:0.001ms!important;animation-duration:0.001ms!important;}}';
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
  function initialsOf(u) {
    var name = (u && u.name) || '';
    var parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    if (parts.length === 1 && parts[0]) return parts[0].charAt(0).toUpperCase();
    var email = (u && u.email) || '';
    return email ? email.charAt(0).toUpperCase() : '?';
  }
  function shortName(u) {
    var name = (u && u.name) || '';
    var first = name.trim().split(/\s+/)[0] || '';
    if (!first) first = ((u && u.email) || '').split('@')[0];
    return first.length > 16 ? first.slice(0, 15) + '…' : first;
  }
  function cachedUser() {
    try { var c = JSON.parse(lsGet(CACHE_KEY) || 'null'); return (c && typeof c === 'object') ? { email: String(c.email || ''), name: String(c.name || '') } : null; } catch (e) { return null; }
  }
  function isStandalone() {
    try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; }
  }

  function buildChip() {
    injectStyle();
    var root = el('div', 'ivacct');
    root.setAttribute('data-ivacct', '');
    var btn = el('button', 'ivacct-btn');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    var menu = el('div', 'ivacct-menu');
    menu.id = 'ivacctMenu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'false');
    menu.hidden = true;
    btn.setAttribute('aria-controls', menu.id);
    root.appendChild(btn);
    root.appendChild(menu);
    btn.addEventListener('click', function () { if (chip.open) closeMenu(); else openMenu(); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' && !chip.open) { e.preventDefault(); openMenu(); } });
    menu.addEventListener('keydown', menuKeydown);
    chip = { root: root, btn: btn, menu: menu, open: false };
    return root;
  }

  function focusables() {
    if (!chip) return [];
    return Array.prototype.filter.call(chip.menu.querySelectorAll('button,input,a[href]'), function (n) {
      return !n.disabled && !n.hidden && n.getAttribute('aria-disabled') !== 'true' && n.offsetParent !== null;
    });
  }
  function menuKeydown(e) {
    if (!chip || !chip.open) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(true); return; }
    var items = focusables();
    if (!items.length) return;
    var i = items.indexOf(document.activeElement);
    if (e.key === 'Tab') {
      e.preventDefault();
      var next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i < 0 || i === items.length - 1 ? 0 : i + 1);
      items[next].focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;   // arrows edit text there
      e.preventDefault();
      var nxt = e.key === 'ArrowDown' ? (i < 0 || i === items.length - 1 ? 0 : i + 1) : (i <= 0 ? items.length - 1 : i - 1);
      items[nxt].focus();
    }
  }
  function onDocPointer(e) { if (chip && chip.open && !chip.root.contains(e.target)) closeMenu(false); }
  function openMenu() {
    if (!chip || chip.open) return;
    renderMenu();
    chip.menu.hidden = false;
    chip.open = true;
    chip.btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', onDocPointer, true);
    var items = focusables();
    if (items.length) items[0].focus();
    // Warm the SDK while the person reads the menu, so the first real click is quick; a failure
    // just turns into the note line.
    if (status === 'anonymous' && !client) {
      loadSdk().catch(function (err) {
        // Only fill an empty note: an explanation already on screen (an expired link, a link opened
        // elsewhere) matters more than "unavailable", which the next click will report anyway.
        if (!chip || !chip.open) return;
        var n = chip.menu.querySelector('.ivacct-note');
        if (n && !n.classList.contains('is-error')) setNote(errorText(err), true);
      });
    }
  }
  function closeMenu(refocus) {
    if (!chip || !chip.open) return;
    chip.menu.hidden = true;
    chip.open = false;
    chip.btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onDocPointer, true);
    if (refocus) chip.btn.focus();
  }
  function setNote(text, isError) {
    noteState = text ? { text: text, isError: !!isError } : null;
    if (!chip) return;
    var n = chip.menu.querySelector('.ivacct-note');
    if (!n) return;
    n.textContent = text || '';
    n.classList.toggle('is-error', !!isError);
  }
  function setBusy(on) {
    if (!chip) return;
    Array.prototype.forEach.call(chip.menu.querySelectorAll('button'), function (b) {
      if (on) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
    });
  }

  // The button: label + avatar reflect the current state.
  function renderChip() {
    if (!chip) return;
    var btn = chip.btn;
    while (btn.firstChild) btn.removeChild(btn.firstChild);
    btn.setAttribute('data-state', status);
    btn.setAttribute('aria-label', t('shared.account.menu_aria', 'Account'));
    var u = currentUser || cachedUser();
    if (status === 'signed-in' && currentUser) {
      btn.appendChild(el('span', 'ivacct-avatar', initialsOf(currentUser)));
      btn.appendChild(el('span', 'ivacct-text', shortName(currentUser)));
    } else if (status === 'loading') {
      btn.appendChild(el('span', 'ivacct-avatar', u ? initialsOf(u) : '…'));
      btn.appendChild(el('span', 'ivacct-text', u ? shortName(u) : t('shared.account.loading', 'Loading…')));
    } else if ((status === 'offline' || status === 'unavailable') && u) {
      btn.appendChild(el('span', 'ivacct-avatar', initialsOf(u)));
      btn.appendChild(el('span', 'ivacct-text', t('shared.account.offline', 'Offline')));
    } else {
      btn.appendChild(el('span', 'ivacct-text', '☁ ' + t('shared.account.sign_in', 'Sign in')));
    }
    if (chip.open) renderMenu();
  }

  // The popover: rebuilt from scratch on every render (cheap, and never stale).
  function renderMenu() {
    if (!chip) return;
    var m = chip.menu;
    var typed = m.querySelector('input[type=email]');
    if (typed && typed.value) lastEmail = typed.value;
    while (m.firstChild) m.removeChild(m.firstChild);
    m.setAttribute('aria-label', t('shared.account.menu_aria', 'Account'));
    var note = el('p', 'ivacct-note');
    note.setAttribute('aria-live', 'polite');

    if (status === 'signed-in' && currentUser) {
      m.appendChild(el('p', 'ivacct-who', t('shared.account.signed_in_as', 'Signed in as {email}', { email: currentUser.email })));
      if (openAccountFn) {
        var acct = el('button', 'ivacct-item', t('shared.account.account_item', 'Account…'));
        acct.type = 'button';
        acct.addEventListener('click', function () { closeMenu(false); try { openAccountFn(); } catch (e) { console.warn('[account] onOpenAccount failed:', e); } });
        m.appendChild(acct);
      }
      if (openSavesFn) {
        var saves = el('button', 'ivacct-item', t('shared.account.cloud_saves', 'Cloud saves…'));
        saves.type = 'button';
        saves.addEventListener('click', function () { closeMenu(false); try { openSavesFn(); } catch (e) { console.warn('[account] onOpenSaves failed:', e); } });
        m.appendChild(saves);
      }
      var out = el('button', 'ivacct-item', t('shared.account.sign_out', 'Sign out (this device)'));
      out.type = 'button';
      out.addEventListener('click', function () {
        setBusy(true);
        signOut().then(function () { closeMenu(true); }).catch(function (err) { setBusy(false); setNote(errorText(err), true); });
      });
      m.appendChild(out);
      m.appendChild(note);
      return;
    }

    if (status === 'loading') {
      note.textContent = t('shared.account.loading', 'Loading…');
      m.appendChild(note);
      return;
    }

    if (status === 'disabled' || status === 'unavailable' || (status === 'offline' && cachedUser())) {
      note.textContent = status === 'offline'
        ? t('shared.account.needs_internet', 'Sign-in needs an internet connection.')
        : t('shared.account.unavailable', 'Cloud sign-in is unavailable right now. Your local saves still work.');
      m.appendChild(note);
      return;
    }

    // Signed out (anonymous, or offline with no remembered account): the sign-in form.
    var form = el('form', 'ivacct-form');
    form.setAttribute('novalidate', '');
    var google = el('button', 'ivacct-item', t('shared.account.google', 'Continue with Google'));
    google.type = 'button';
    google.addEventListener('click', function () {
      setBusy(true);
      setNote(t('shared.account.sending', 'Sending…'), false);
      signIn('google').catch(function (err) { setBusy(false); setNote(errorText(err), true); });
    });

    var emailLabel = el('label', 'ivacct-label', t('shared.account.email_label', 'Email'));
    var emailInput = el('input', 'ivacct-input');
    emailInput.type = 'email';
    emailInput.name = 'email';
    emailInput.autocomplete = 'email';
    emailInput.required = true;
    emailInput.dir = 'ltr';
    emailInput.placeholder = t('shared.account.email_placeholder', 'you@school.org');
    emailInput.value = lastEmail;
    emailLabel.appendChild(emailInput);
    var send = el('button', 'ivacct-item', t('shared.account.send_code', 'Email me a sign-in link and code'));
    send.type = 'submit';

    var codeWrap = el('div', 'ivacct-code');
    codeWrap.hidden = menuStage !== 'code';
    var codeLabel = el('label', 'ivacct-label', t('shared.account.code_label', '6-digit code from the email'));
    var codeInput = el('input', 'ivacct-input');
    codeInput.type = 'text';
    codeInput.name = 'code';
    codeInput.inputMode = 'numeric';
    codeInput.autocomplete = 'one-time-code';
    codeInput.maxLength = 8;
    codeInput.dir = 'ltr';
    codeLabel.appendChild(codeInput);
    var verify = el('button', 'ivacct-item', t('shared.account.verify', 'Verify code'));
    verify.type = 'button';
    codeWrap.appendChild(codeLabel);
    codeWrap.appendChild(verify);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = emailInput.value.trim();
      lastEmail = email;
      setBusy(true);
      setNote(t('shared.account.sending', 'Sending…'), false);
      signIn('email', { email: email }).then(function () {
        setBusy(false);
        menuStage = 'code';
        codeWrap.hidden = false;
        setNote(t('shared.account.code_sent', 'We emailed a sign-in link and a code to {email}. Click the link, or type the code here.', { email: email }), false);
        codeInput.focus();
      }).catch(function (err) { setBusy(false); setNote(errorText(err), true); });
    });
    verify.addEventListener('click', function () {
      setBusy(true);
      setNote(t('shared.account.sending', 'Sending…'), false);
      verifyCode(emailInput.value.trim() || lastEmail, codeInput.value).then(function () {
        menuStage = 'email';
        closeMenu(true);
      }).catch(function (err) { setBusy(false); setNote(errorText(err), true); });
    });
    codeInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); verify.click(); } });

    // Inside an installed app, OAuth can finish in the system browser (separate storage), so the
    // email path — which works anywhere — comes first there.
    if (isStandalone()) {
      form.appendChild(emailLabel); form.appendChild(send); form.appendChild(codeWrap);
      form.appendChild(el('hr', 'ivacct-sep'));
      form.appendChild(google);
    } else {
      form.appendChild(google);
      form.appendChild(el('hr', 'ivacct-sep'));
      form.appendChild(emailLabel); form.appendChild(send); form.appendChild(codeWrap);
    }
    m.appendChild(form);
    m.appendChild(note);
    if (pendingError) {
      if (pendingError.code === 'link_other_browser') { menuStage = 'code'; codeWrap.hidden = false; }
      setNote(pendingErrorText(), true);
      pendingError = null;
    } else if (noteState) {
      setNote(noteState.text, noteState.isError);
    } else if (status === 'offline') {
      setNote(t('shared.account.needs_internet', 'Sign-in needs an internet connection.'), false);
    }
  }

  function mountChip(target) {
    if (!enabled || mounted) return chip ? chip.root : null;
    var host = null, mode = 'append';
    if (target === undefined || target === 'auto' || target === null) {
      host = document.querySelector('[data-ivacct-slot]');
      if (!host) { host = document.querySelector('[data-i18n-switcher]'); mode = host ? 'after' : 'append'; }
    } else if (typeof target === 'string') {
      host = document.querySelector(target);
    } else if (target && target.nodeType === 1) {
      host = target;
    }
    if (!host) return null;
    var root = chip ? chip.root : buildChip();
    if (mode === 'after') host.insertAdjacentElement('afterend', root); else host.appendChild(root);
    mounted = true;
    renderChip();
    // A sign-in that came back with an error is the one case worth opening the menu unasked: the
    // person just clicked a link and needs to see why nothing happened.
    if (pendingError) openMenu();
    return root;
  }

  /* ---------- boot ---------- */
  function boot() {
    if (!enabled) { setStatus('disabled'); resolveReady(); return; }
    consumeErrorParams();
    var p = parseAuthParams(location.href);
    if (p.query.code && !hasVerifier()) {
      // The link was opened in a browser that did not start the sign-in: the SDK could not exchange
      // it and would drop any stored session trying. Strip it and steer to the emailed code.
      if (!pendingError) pendingError = { error: 'link_other_browser', code: 'link_other_browser', description: '' };
      cleanUrlNow();
    }
    if (isAuthCallback(location.href) || hasStoredSession()) {
      setStatus('loading');
      getClient().catch(function (err) {
        setStatus(err && err.code === 'offline' ? 'offline' : 'unavailable');
        resolveReady(); renderChip(); fire();
      });
      // Belt and braces: never leave the page "loading" if the SDK's own init hangs.
      setTimeout(function () {
        if (readyDone) return;
        if (status === 'loading') setStatus(hasStoredSession() ? 'offline' : 'anonymous');
        resolveReady(); renderChip(); fire();
      }, SDK_TIMEOUT_MS + 3000);
    } else {
      setStatus('anonymous');
      resolveReady();
    }
    window.addEventListener('online', function () {
      if ((status === 'offline' || status === 'unavailable') && hasStoredSession()) {
        sdkPromise = null; clientPromise = null;
        setStatus('loading'); renderChip();
        getClient().catch(function (err) { setStatus(err && err.code === 'offline' ? 'offline' : 'unavailable'); renderChip(); fire(); });
      }
    });
  }

  function whenReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function init(opts) {
    initOpts = opts || {};
    whenReady(function () {
      if (initOpts.mount === false) return;
      mountChip(initOpts.mount === undefined ? 'auto' : initOpts.mount);
    });
    return ready;
  }

  boot();
  whenReady(function () {
    if (!initOpts && enabled) mountChip('auto');
    if (window.I18n) {
      try { if (window.I18n.ready && window.I18n.ready.then) window.I18n.ready.then(function () { renderChip(); }); } catch (e) {}
      try { if (window.I18n.onChange) window.I18n.onChange(function () { renderChip(); }); } catch (e) {}
    }
  });

  window.IvritAccount = {
    ready: ready,
    status: function () { return status; },
    user: function () { return currentUser ? { id: currentUser.id, email: currentUser.email, name: currentUser.name, provider: currentUser.provider } : null; },
    onChange: function (fn) {
      if (typeof fn !== 'function') return;
      handlers.push(fn);
      if (readyDone) Promise.resolve().then(function () { try { fn(currentUser, status); } catch (e) { console.warn('[account] onChange handler failed:', e); } });
    },
    signIn: signIn,
    verifyCode: verifyCode,
    signOut: signOut,
    client: getClient,
    mountChip: mountChip,
    init: init,
    t: t,
    onOpenSaves: function (fn) { openSavesFn = (typeof fn === 'function') ? fn : null; renderChip(); },
    onOpenAccount: function (fn) { openAccountFn = (typeof fn === 'function') ? fn : null; renderChip(); },
    openMenu: function () { if (!chip || !mounted) return false; openMenu(); return true; },   // a page's own "Sign in" button opens the chip's menu
    _test: { isAuthCallback: isAuthCallback, stripAuthParams: stripAuthParams, redirectTarget: redirectTarget, parseAuthParams: parseAuthParams, hasStoredSession: hasStoredSession, AUTH_KEY: AUTH_KEY, VERIFIER_KEY: VERIFIER_KEY, CACHE_KEY: CACHE_KEY }
  };
})();
