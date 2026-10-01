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
 *   signIn('email', {email})   Promise<{sent:true}> — emails a 6-digit code and a link that fills it in
 *                              (the email's text: db/email-templates/sign-in-code.html)
 *   verifyCode(email, code)    Promise<user> — signs in with the emailed code (works on any device)
 *   signOut(opts)              Promise<void> — this device only. Runs every onSignOut hook first (the saves
 *                              module flushes pending edits and removes the account's cached items), then the
 *                              SDK sign-out. { keepLocal: true } (account deletion) tells the hooks to leave
 *                              the device's copies alone.
 *   client()                   Promise<SupabaseClient> — loads the SDK on demand; rejects with
 *                              err.code = 'disabled' | 'offline' | 'blocked'
 *   mountChip(target)          element | selector | 'auto' — renders the header chip
 *   init(opts)                 optional { mount: 'auto' | selector | element | false, nameStep: false }
 *                              (nameStep: false — account.html has its own name form)
 *   t(key, fallback)           translate via I18n when loaded, else the English fallback
 *   onSignOut(fn)              fn(uid, { keepLocal }) → void | Promise — run and awaited (bounded) before the
 *                              SDK sign-out, while the session is still valid
 *   onNameStep(fn)             fn('named' | 'later' | 'none') — how the required-name step ended on this page
 *                              load ('none': the account already has a name, or the step could not be shown)
 *   needsName()                true while the signed-in account has no display name
 *   hasStoredSession()         true when a session is signed in, loading, or remembered but offline — what page
 *                              code keys its "signed in" branches on (user() is null while loading or offline)
 *   signOutHandled()           the uid this tab's own signOut() handled (or null) — the saves module tells an
 *                              explicit sign-out apart from a session that ended by itself
 *   openNameStep()             shows the required-name step (the saves module never calls it; tests do)
 *   sessionSource()            'new' when this page load established the session (a sign-in here, or an auth
 *                              callback), 'restored' when it came from storage, null when signed out
 *   openMenu()                 opens the chip's menu (false when no chip is mounted) — for a panel's Sign in button
 *   focusChip()                puts the focus on the chip (false when none is shown) — for a screen whose opener is gone
 *   profile()                 Promise<{displayName, createdAt}> — the account's profiles row (signed in only)
 *   setDisplayName(name)       Promise<name> — 1–80 characters; writes the user's metadata (what the chip shows)
 *                              and profiles.display_name
 *   deleteAccount()            Promise<{ok, deleted}> — the delete-account Edge Function (files, rows, the auth
 *                              user), then this device forgets the session; nothing on the device is touched
 *   errorText(err)             one localized sentence for a failure of any call above (the account page uses it)
 *   _test                      pure helpers exposed for the smoke test (scripts/smoke-account.mjs)
 *
 * How it stays cheap and safe:
 *   - The Supabase SDK (~60 KB gzipped, from jsDelivr) is loaded ONLY when it is needed: right away
 *     if this page load is an auth callback or a session is already stored, otherwise on the first
 *     click on the chip. Anonymous visitors download nothing extra.
 *   - Everything fails soft. Offline, a blocked CDN, a missing config: the chip says so and the rest
 *     of the page (local saves, .ivrit files) works exactly as before. Nothing here throws.
 *   - PKCE flow, never implicit: no session token ever appears in the URL — only a one-time ?code=
 *     (Google's return leg) or an emailed link's #ivsignin=, both of which the pages' analytics
 *     snippet, running before this script, leaves out of what it reports.
 *   - The emailed link cannot be spent by a school mail filter that opens every link to scan it: it
 *     lands on the page it was asked from with #ivsignin=<the code>, which is taken out of the address
 *     bar at once and only filled into the code field. Nothing is sent until the person presses
 *     Verify, and the code is checked against the email address in that field (the one this browser
 *     asked with, else typed there), so a link someone else sent cannot sign anyone into their account.
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
  // The emailed link's hash key (#ivsignin=<code>). The pages' inline analytics tag drops a hash carrying it,
  // spelled out there as a literal — keep the two in step, as with AUTH_QUERY_KEYS.
  var LINK_HASH_KEY = 'ivsignin';
  var REQUEST_KEY = 'ivritSuite_signInRequest';      // {e, at}: this browser asked for a sign-in email for e, at ms
  var REQUEST_TTL_MS = 24 * 3600 * 1000;             // the longest Supabase lets an email code live; the server keeps the real clock

  var status = enabled ? 'anonymous' : 'disabled';
  var currentUser = null;
  var sessionSource = null;   // 'new' | 'restored' | null — how the current session came to be (see sessionSource())
  var bootCallback = false;   // this page load carried an auth callback (?code=): the session it yields is a fresh sign-in
  var initialSeen = false;    // the SDK's INITIAL_SESSION has fired: a user arriving after it signed in during this page's life
  var codeInFlight = false;   // verifyCode() is running: a user arriving now signed in here, even when the client it just
                              // created has not yet reported its INITIAL_SESSION (a link's code is often the first call)
  var client = null;
  var sdkPromise = null;
  var clientPromise = null;
  var handlers = [];
  var signOutHooks = [];         // onSignOut(fn): run before the SDK sign-out (the saves module's cache removal)
  var signOutHandledUid = null;  // the uid this tab's own signOut() handled — a session ending by itself has none
  var SIGNOUT_HOOK_MS = 10000;   // the longest a sign-out waits for its hooks (a flush of pending edits)
  var nameStepHooks = [];        // onNameStep(fn): 'named' | 'later' | 'none'
  var nameStepOutcome = null;    // set once per page load; null while the step is pending or not yet decided
  var nameStepAsked = false;     // the step was attempted this page load (asked at most once)
  var nameStep = null;           // the open step: { root, input, cont, note }
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
  var menuBusy = false;      // a sign-in or sign-out is in flight — kept here, not on the buttons, which a re-render replaces
  var pendingCode = '';      // the code an emailed link brought (#ivsignin=): filled into the field, never sent without a press
  var linkSettled = false;   // what that link does here has been decided (settleLink), so the menu opens for it only once

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
  // The stored session's account id, without the SDK (a page may need it while the SDK is still loading or
  // offline: the saves module keys a deliberate font deletion to it). Null when there is none or it is unreadable.
  function storedUserId() {
    try { var s = JSON.parse(lsGet(AUTH_KEY) || 'null'); var u = s && (s.user || (s.currentSession && s.currentSession.user)); return (u && typeof u.id === 'string') ? u.id : null; } catch (e) { return null; }
  }
  // After a sign-out the page reloads so no in-memory copy of a removed item is written back — unless the saves
  // module says this page holds none (the Font Maker, the account page: a reload there would cut off the Font
  // Maker's asynchronous autosave and lose the last edits).
  // What a sign-out will do, in one confirm (the chip and the name step's Sign out instead ask the same question):
  // the account's items leave this device, anything not in the account yet stays, preferences and My Fonts stay.
  function signOutConfirmText() {
    var n = 0, unknown = false;
    try { var S = window.IvritSaves; if (S && typeof S.pendingSignOut === 'function') { var ps = S.pendingSignOut() || {}; n = Number(ps.unsynced) || 0; unknown = !!ps.unknown; } } catch (e) { n = 0; }
    var msg = unknown
      ? t('shared.account.sign_out_confirm_unknown', 'Sign out? What your account holds is removed from this device. This page could not check everything with your account just now, so anything not in your account yet stays here as this device\'s own data. Your preferences and My Fonts stay here.')
      : n
      ? t('shared.account.sign_out_confirm_kept' + (n === 1 ? '.one' : '.other'), n === 1
          ? 'Sign out? Your saved items stay in your account and are removed from this device. 1 item on this device is not in your account yet and stays here as this device\'s own data. Your preferences and My Fonts stay here.'
          : 'Sign out? Your saved items stay in your account and are removed from this device. {n} items on this device are not in your account yet and stay here as this device\'s own data. Your preferences and My Fonts stay here.', { n: n })
      : t('shared.account.sign_out_confirm', 'Sign out? Your saved items stay in your account and are removed from this device. Your preferences and My Fonts stay here.');
    return msg;
  }
  function reloadAfterSignOut() {
    var s = window.IvritSaves;
    if (s && typeof s.needsReload === 'function') { try { if (!s.needsReload()) return; } catch (e) {} }
    location.reload();
  }
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
  // The emailed link lands here as #ivsignin=<code> (a hash never reaches a server). null when there is no
  // such key; a malformed value comes back as code '' — stripped all the same, never filled in.
  function parseLinkHash(href) {
    try {
      var u = new URL(href);
      var h = u.hash && u.hash.charAt(0) === '#' ? u.hash.slice(1) : '';
      if (!h) return null;
      var hp = new URLSearchParams(h);
      if (!hp.has(LINK_HASH_KEY)) return null;
      var code = hp.get(LINK_HASH_KEY) || '';
      return { code: /^\d{6,8}$/.test(code) ? code : '' };   // the code field's own maxLength is 8
    } catch (e) { return null; }
  }
  // The same URL without the link's key; the path, the query and any other hash key survive.
  function stripLinkHash(href) {
    try {
      var u = new URL(href);
      var h = u.hash && u.hash.charAt(0) === '#' ? u.hash.slice(1) : '';
      if (!h) return href;
      var hp = new URLSearchParams(h);
      if (!hp.has(LINK_HASH_KEY)) return href;
      hp.delete(LINK_HASH_KEY);
      var rest = hp.toString();
      u.hash = rest ? '#' + rest : '';
      return u.toString();
    } catch (e) { return href; }
  }
  // Read at boot and removed at once — before the SDK or anything else runs — so the code is never
  // bookmarked, shared or left in the history. It waits in memory for settleLink().
  function consumeLinkHash() {
    var l = parseLinkHash(location.href);
    if (!l) return;
    var after = stripLinkHash(location.href);
    if (after !== location.href) { try { history.replaceState(history.state, '', after); } catch (e) {} }
    if (l.code && enabled) pendingCode = l.code;
  }
  // "This browser asked for a sign-in email for e": what lets an emailed link fill in the address as well as
  // the code, so one press signs in. Typed here, so it can be trusted to pick the account — a link only
  // ever brings a code, and a code is checked against the address it is verified with.
  function rememberRequest(email) { lsSet(REQUEST_KEY, JSON.stringify({ e: String(email || '').trim(), at: Date.now() })); }   // as sent
  function signInRequest() {
    try {
      var r = JSON.parse(lsGet(REQUEST_KEY) || 'null');
      if (!r || typeof r.e !== 'string' || !r.e || typeof r.at !== 'number') return null;
      var age = Date.now() - r.at;
      return (age >= -60000 && age <= REQUEST_TTL_MS) ? { e: r.e, at: r.at } : null;
    } catch (e) { return null; }
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
      // The first event that carries a user says how the session came to be. The SDK replays a stored
      // session as SIGNED_IN *before* its INITIAL_SESSION, so "before INITIAL_SESSION, no callback in the
      // URL" is a restored session; anything after it (the emailed code, a later sign-in) or a callback
      // load is a fresh one. Token refreshes and re-emitted events later keep the answer.
      if (!sessionSource) sessionSource = (initialSeen || bootCallback || codeInFlight) ? 'new' : 'restored';
      currentUser = u;
      setStatus('signed-in');
      lsSet(CACHE_KEY, JSON.stringify({ email: u.email, name: u.name }));
      lsRemove(REQUEST_KEY);   // signed in: an earlier request has nothing left to fill in
      pendingCode = '';        // nor has a link opened while already signed in here
    } else {
      sessionSource = null;
      currentUser = null;
      setStatus('anonymous');
      lsRemove(CACHE_KEY);
    }
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') cleanUrlNow();
    if (event === 'INITIAL_SESSION') { initialSeen = true; resolveReady(); }
    renderChip();
    fire();
    settleLink();
    settleNameStep();
  }

  /* ---------- the required-name step ---------- */
  // An account needs a display name: Google supplies one, an emailed code does not. The step is one modal
  // card shown once per page load after a signed-in event for a user with no name — only after a getUser()
  // round trip proved the network (never offline, never on a page whose SDK loaded but whose API is
  // blocked: rule 3 — offline changes the chip's label, never the page). Continue writes the name; a failure
  // that is not the name itself turns Continue into "Not now" so the page stays usable; "Sign out instead"
  // is a real sign-out (the saves module removes what the first hydration already brought down).
  function needsName() { return !!currentUser && !currentUser.name; }
  function fireNameStep(outcome) {
    if (nameStepOutcome) return;
    nameStepOutcome = outcome;
    nameStepHooks.forEach(function (fn) { try { fn(outcome); } catch (e) { console.warn('[account] onNameStep handler failed:', e); } });
  }
  function settleNameStep() {
    if (nameStepOutcome || nameStep) return;
    if (!currentUser) return;                       // signed out: nothing to settle (a later sign-in decides)
    if (currentUser.name) { fireNameStep('none'); return; }
    if (nameStepAsked) return;
    nameStepAsked = true;
    var uid = currentUser.id;
    // After DOMContentLoaded: the page's init() (account.html opts out with nameStep: false) has run by then.
    whenReady(function () {
      if (nameStepOutcome || !currentUser || currentUser.id !== uid || currentUser.name) { if (!nameStepOutcome) fireNameStep('none'); return; }
      if ((initOpts && initOpts.nameStep === false) || navigator.onLine === false || !client) { fireNameStep('none'); return; }
      client.auth.getUser().then(function (r) {
        if (nameStepOutcome || !currentUser || currentUser.id !== uid) { fireNameStep('none'); return; }
        if (r && r.error) { fireNameStep('none'); return; }
        var md = (r && r.data && r.data.user && r.data.user.user_metadata) || null;
        var fresh = md ? String(md.full_name || md.name || '') : '';
        if (fresh) { currentUser.name = fresh; renderChip(); fireNameStep('none'); return; }
        if (!openNameStep()) fireNameStep('none');
      }, function () { fireNameStep('none'); });
    });
  }
  function nameStepFocusables() {
    if (!nameStep) return [];
    return Array.prototype.filter.call(nameStep.root.querySelectorAll('button,input'), function (n) { return !n.disabled && n.offsetParent !== null; });
  }
  function openNameStep() {
    if (nameStep || !currentUser) return false;
    injectStyle();
    var overlay = el('div', 'ivacct-modal');
    var card = el('div', 'ivacct-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('tabindex', '-1');
    var title = el('h2', null, t('shared.account.card_name_title', 'What should we call you?'));
    title.id = 'ivacct-name-title';
    card.setAttribute('aria-labelledby', title.id);
    card.appendChild(title);
    card.appendChild(el('p', null, t('shared.account.card_name_note', 'Shown in the header while you are signed in and stored with your account.')));
    var label = el('label', 'ivacct-label', t('shared.account.card_name_label', 'Display name'));
    label.htmlFor = 'ivacct-name-input';
    var input = el('input', 'ivacct-input');
    input.id = 'ivacct-name-input';
    input.type = 'text';
    input.name = 'name';
    input.maxLength = 80;
    input.autocomplete = 'name';
    input.setAttribute('autocapitalize', 'words');
    input.setAttribute('data-ivk', 'name');
    card.appendChild(label);
    card.appendChild(input);
    var note = el('p', 'ivacct-note');
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    var cont = el('button', 'ivacct-item ivacct-primary', t('shared.account.card_name_continue', 'Continue'));
    cont.type = 'button';
    cont.setAttribute('data-ivk', 'continue');
    cont.setAttribute('aria-disabled', 'true');
    var later = el('button', 'ivacct-item', t('shared.account.card_name_later', 'Not now — ask again next time'));
    later.type = 'button';
    later.hidden = true;
    later.addEventListener('click', function () { closeNameStep('later'); });
    var out = el('button', 'ivacct-item', t('shared.account.card_name_signout', 'Sign out instead'));
    out.type = 'button';
    out.setAttribute('data-ivk', 'signout');
    var busy = false;
    function valid() { var v = input.value.replace(/\s+/g, ' ').trim(); return v.length >= 1 && v.length <= 80; }
    function sync() { if (valid() && !busy) cont.removeAttribute('aria-disabled'); else cont.setAttribute('aria-disabled', 'true'); }
    function say(text, isError) { note.textContent = text || ''; note.classList.toggle('is-error', !!isError); }
    input.addEventListener('input', function () { sync(); if (note.classList.contains('is-error') && valid()) say('', false); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); cont.click(); } });
    cont.addEventListener('click', function () {
      if (busy) return;
      if (!valid()) { say(t('shared.account.error_name', 'A display name is 1 to 80 characters.'), true); input.focus(); return; }
      busy = true; sync(); out.setAttribute('aria-disabled', 'true');
      say(t('shared.account.sending', 'Sending…'), false);
      setDisplayName(input.value).then(function () { closeNameStep('named'); }, function (err) {
        busy = false; sync(); out.removeAttribute('aria-disabled');
        say(errorText(err), true);
        // Not the name's fault: the network, the session, the server. The page stays usable — ask next time.
        if (!(err && err.code === 'invalid_name')) later.hidden = false;
        input.focus();
      });
    });
    out.addEventListener('click', function () {
      if (busy) return;
      if (!window.confirm(signOutConfirmText())) return;   // the same question the chip asks: a first hydration may already have landed the account's items
      busy = true; sync(); out.setAttribute('aria-disabled', 'true');
      signOut().then(reloadAfterSignOut, reloadAfterSignOut);
    });
    var row = el('div');
    row.appendChild(cont); row.appendChild(later); row.appendChild(out);
    card.appendChild(row);
    card.appendChild(note);
    overlay.appendChild(card);
    // A required step: no ✕, no outside click, Escape ignored; Tab and Shift+Tab wrap inside the card.
    var onKey = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return; }
      if (e.key !== 'Tab') return;
      var items = nameStepFocusables();
      if (!items.length) { e.preventDefault(); card.focus(); return; }
      var a = document.activeElement, first = items[0], last = items[items.length - 1];
      if (!card.contains(a)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && (a === first || a === card)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    (document.body || document.documentElement).appendChild(overlay);
    nameStep = { root: overlay, input: input, cont: cont, note: note, onKey: onKey, opener: document.activeElement };
    sync();
    try { input.focus(); } catch (e) {}
    return true;
  }
  // outcome: 'named' | 'later' — or null when the step is torn down by a sign-out (no outcome this load).
  function closeNameStep(outcome) {
    if (!nameStep) return;
    var s = nameStep; nameStep = null;
    document.removeEventListener('keydown', s.onKey, true);
    if (s.root.parentNode) s.root.parentNode.removeChild(s.root);
    var f = document.activeElement;
    if (!f || f === document.body) { if (!(chip && mounted && chip.btn.getClientRects().length && (chip.btn.focus(), true)) && s.opener && typeof s.opener.focus === 'function') { try { s.opener.focus(); } catch (e) {} } }
    if (outcome) fireNameStep(outcome);
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
          .then(function (r) { if (r && r.error) throw r.error; rememberRequest(email); return { sent: true }; });
      }
      throw makeError('bad_method', 'IvritAccount: unknown sign-in method ' + method);
    });
  }

  function verifyCode(email, code) {
    return getClient().then(function (c) {
      var token = String(code || '').replace(/\s+/g, '');
      if (!token) throw makeError('invalid_code', 'IvritAccount: a code is required');
      codeInFlight = true;
      return c.auth.verifyOtp({ email: String(email || '').trim(), token: token, type: 'email' })
        .then(function (r) { codeInFlight = false; if (r && r.error) throw r.error; return userFromSession(r.data && r.data.session); },
          function (e) { codeInFlight = false; throw e; });
    });
  }

  // The hooks run first, while the token is still valid, so the saves module can flush what this device
  // changed in the last seconds and then remove the account's cached items; each is awaited, bounded, and a
  // failing hook never stops the sign-out. The device is signed out whether or not the server call succeeds.
  // The hooks run side by side (the saves module's removal and the Font Maker's last save do not depend on each other),
  // each bounded by SIGNOUT_HOOK_MS, so the session leaves the device within one budget, not the sum of them.
  function runSignOutHooks(uid, opts) {
    return Promise.all(signOutHooks.map(function (fn) {
      return new Promise(function (resolve) {
        var done = false, timer = setTimeout(function () { if (!done) { done = true; console.warn('[account] onSignOut hook timed out'); resolve(); } }, SIGNOUT_HOOK_MS);
        Promise.resolve().then(function () { return fn(uid, opts); }).then(function () { if (!done) { done = true; clearTimeout(timer); resolve(); } },
          function (e) { console.warn('[account] onSignOut hook failed:', e); if (!done) { done = true; clearTimeout(timer); resolve(); } });
      });
    })).then(function () {});
  }
  function signOut(opts) {
    opts = opts || {};
    var uid = currentUser ? currentUser.id : null;
    signOutHandledUid = uid || '(none)';   // an explicit sign-out from this tab, keepLocal or not
    closeNameStep(null);
    function forgetLocally() { lsRemove(CACHE_KEY); lsRemove(AUTH_KEY); currentUser = null; noteState = null; menuStage = 'email'; setStatus(enabled ? 'anonymous' : 'disabled'); renderChip(); fire(); }
    return runSignOutHooks(uid, { keepLocal: !!opts.keepLocal }).then(function () {
      if (!client) { forgetLocally(); return; }
      return client.auth.signOut({ scope: 'local' })
        .then(function (r) { if (r && r.error) throw r.error; forgetLocally(); })
        .catch(function (e) { forgetLocally(); throw e; });
    });
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
    if (code === 'invalid_name') return t('shared.account.error_name', 'A display name is 1 to 80 characters.');
    if (code === 'signed_out' || code === 'PGRST301' || st === 401 || /jwt/.test(msg)) return t('shared.account.error_session', 'Your sign-in has expired. Sign in again.');
    if (code === 'unreachable' || /failed to fetch|networkerror|load failed|network request failed/.test(msg)) return t('shared.account.error_unreachable', 'The cloud is unreachable right now. Try again later.');
    if (code === 'fn_failed' || /^fn_/.test(code)) return t('shared.account.error_delete', 'Your account could not be deleted. Nothing was changed — try again in a moment.');
    return t('shared.account.error_generic', 'Something went wrong. Please try again.');
  }
  // What an emailed link does here, decided once the session state is known: already signed in, nothing
  // (the code is dropped); otherwise the menu opens once at the code step with the code filled in, and the
  // address too when this browser asked for it. Only the Verify press sends anything.
  function settleLink() {
    if (!pendingCode || linkSettled || status === 'loading') return;
    if (status === 'signed-in') { pendingCode = ''; return; }
    linkSettled = true;
    var req = signInRequest();
    if (req && !lastEmail) lastEmail = req.e;
    menuStage = 'code';
    if (!chip || !mounted) return;   // mountChip() opens it
    if (chip.open) renderMenu(); else openMenu();
    focusLinkStep();
  }
  // The next step after a link: Verify when the address is known, else the address field.
  function focusLinkStep() {
    if (!chip || !chip.open) return;
    var email = chip.menu.querySelector('input[type=email]');
    var target = email && !email.value ? email : chip.menu.querySelector('.ivacct-code button');
    if (target) target.focus();
  }
  function pendingErrorText() {
    if (!pendingError) return '';
    if (pendingError.code === 'link_other_browser') return t('shared.account.error_link_other_browser', 'That link was opened in a different browser. Enter the code from the email here instead.');
    if (pendingError.code === 'otp_expired' || /expired|invalid/.test(String(pendingError.description || '').toLowerCase())) return t('shared.account.error_expired', 'That sign-in code or link has expired. Request a new one.');
    return t('shared.account.error_finish', "Couldn't finish signing in. Please try again.");
  }

  /* ---------- the account page's calls (account.html) ---------- */
  function requireUser() { if (!currentUser) throw makeError('signed_out', 'IvritAccount: not signed in'); return currentUser; }
  function unwrap(r) { if (r && r.error) throw r.error; return r ? r.data : null; }
  function profile() {
    return getClient().then(function (c) {
      var u = requireUser();
      return c.from('profiles').select('display_name, created_at').eq('id', u.id).maybeSingle();
    }).then(unwrap).then(function (p) {
      return { displayName: p ? String(p.display_name || '') : '', createdAt: p ? (p.created_at || null) : null };
    });
  }
  // The display name lives in the user's metadata (what the chip reads on every page, and what the required-name
  // step checks) and is mirrored into profiles.display_name (the row the account was created with). A Google
  // sign-in later may put Google's name back into the metadata; the profiles copy keeps what was typed here.
  // The mirror fails soft: a refused or unreachable profiles row (the harness aborts /rest/v1/) still resolves
  // with the name once the metadata took it, and the account page's next save catches the mirror up.
  function setDisplayName(name) {
    name = String(name === undefined || name === null ? '' : name).replace(/\s+/g, ' ').trim();
    if (!name || name.length > 80) return Promise.reject(makeError('invalid_name', 'IvritAccount: a display name is 1 to 80 characters'));
    return getClient().then(function (c) {
      var u = requireUser();
      return c.auth.updateUser({ data: { full_name: name } }).then(unwrap)
        .then(function () {
          if (currentUser && currentUser.id === u.id) { currentUser.name = name; lsSet(CACHE_KEY, JSON.stringify({ email: currentUser.email, name: name })); renderChip(); }
          return Promise.resolve().then(function () { return c.from('profiles').update({ display_name: name }).eq('id', u.id); }).then(unwrap)
            .catch(function (e) { console.warn('[account] profiles mirror failed:', e); });
        })
        .then(function () { return name; });
    });
  }
  // A failed invoke: FunctionsHttpError carries the Response as .context; its JSON names the step that failed.
  function functionError(err) {
    var e = makeError('fn_failed', (err && err.message) || 'IvritAccount: function failed');
    var ctx = err && err.context;
    var st = (ctx && typeof ctx.status === 'number') ? ctx.status : null;
    if (st === 401) e.code = 'signed_out';
    else if (st) e.code = 'fn_' + st;
    else if (/fetch|network/i.test(String(((err && err.name) || '') + ' ' + ((err && err.message) || '')))) e.code = navigator.onLine === false ? 'offline' : 'unreachable';
    e.status = st;
    if (ctx && typeof ctx.json === 'function') {
      return ctx.json().then(function (body) { if (body && body.error) e.detail = String(body.error); return e; }, function () { return e; });
    }
    return Promise.resolve(e);
  }
  // "Delete my account": the Edge Function removes the account's files, rows and the auth user (only ever the
  // account its JWT names), then this device forgets the session. Nothing stored on the device is touched.
  function deleteAccount() {
    return getClient().then(function (c) {
      requireUser();
      return c.functions.invoke('delete-account', { method: 'POST', body: {} });
    }).then(function (r) {
      if (r && r.error) return functionError(r.error).then(function (e) { throw e; });
      var data = r && r.data;
      if (!data || data.ok !== true) throw makeError('fn_failed', 'IvritAccount: unexpected reply from delete-account');
      // The session is dead on the server; forgetting it here is what matters (the sign-out call itself may 401).
      // keepLocal: the device's copies stay — the account is gone, so they are the teacher's last copy besides the zip.
      return signOut({ keepLocal: true }).then(function () { return data; }, function () { return data; });
    });
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
      '.ivacct-ico{display:inline-flex;width:16px;height:16px;flex-shrink:0;}.ivacct-ico svg{width:16px;height:16px;}' +
      '.ivacct-btn:hover{background:var(--warm-gray,#e8e0d0);}' +
      'body.dark .ivacct-btn:hover{background:#2a3349;}' +
      '.ivacct-btn:focus-visible,.ivacct-item:focus-visible,.ivacct-input:focus-visible{outline:2px solid var(--focus-ring,var(--gold,#c9922a));outline-offset:1px;}' +
      '.ivacct-btn[data-state="offline"],.ivacct-btn[data-state="unavailable"]{opacity:.72;}' +
      // Navy on the gold disc, not white: gold is a LIGHT surface in both themes, so white initials read
      // 2.75:1 light and 2.14:1 dark at 10.56px bold (2.40 / 2.02 on flash cards, whose --gold is paler)
      // against a 4.5 floor. A literal, not var(--text): that token flips light in dark mode while this
      // background stays gold. Same remedy the generator's bingo card number took for the same pair.
      '.ivacct-avatar{display:inline-flex;align-items:center;justify-content:center;inline-size:20px;block-size:20px;border-radius:50%;' +
        'background:var(--gold,#c9922a);color:#1a2744;font-size:0.66rem;font-weight:700;letter-spacing:.02em;flex-shrink:0;}' +
      '.ivacct-menu{position:absolute;inset-inline-end:0;top:calc(100% + 6px);z-index:1200;min-inline-size:260px;max-inline-size:min(92vw,340px);' +
        'padding:10px;border:1px solid var(--border,#c8bfa8);border-radius:10px;background:var(--white,#fff);color:var(--text,#1a2744);' +
        'box-shadow:0 8px 24px rgba(0,0,0,.18);text-align:start;font-size:0.85rem;font-weight:400;}' +
      '.ivacct-menu[hidden]{display:none;}' +
      '.ivacct-item{display:block;inline-size:100%;box-sizing:border-box;margin-block:4px;padding:8px 10px;border:1px solid var(--border,#c8bfa8);' +
        'border-radius:6px;background:transparent;color:inherit;font:inherit;font-weight:600;text-align:start;cursor:pointer;}' +
      // setBusy() locks every menu button while a sign-in or sign-out is in flight, so the hover is
      // guarded the same way the dimming below marks it — otherwise a locked item keeps lighting up
      // under the cursor of the teacher who is waiting on exactly that round trip.
      '.ivacct-item:hover:not([aria-disabled="true"]){background:var(--warm-gray,#e8e0d0);}' +
      'body.dark .ivacct-item:hover:not([aria-disabled="true"]){background:#2a3349;}' +
      '.ivacct-item[aria-disabled="true"]{opacity:.55;cursor:default;}' +
      // The Google item is the one menu row with artwork: flex so the mark sits on the leading edge
      // (inline-start, so it follows the Hebrew UI to the right) and the label keeps the row's start
      // alignment. Its size is set in px, not em, because the mark must stay legible as a mark.
      '.ivacct-item.ivacct-gbtn{display:flex;align-items:center;gap:8px;}' +
      '.ivacct-gmark{inline-size:18px;block-size:18px;flex-shrink:0;}' +
      '.ivacct-label{display:block;margin-block:8px 3px;font-size:0.78rem;color:var(--muted,#6b6050);}' +
      '.ivacct-input{display:block;inline-size:100%;box-sizing:border-box;padding:7px 9px;border:1px solid var(--border,#c8bfa8);border-radius:6px;' +
        'background:var(--white,#fff);color:inherit;font:inherit;}' +
      // Both fields inherit the label's 0.78rem (12.48px), and iOS Safari zooms the page into a focused text
      // field under 16px and leaves it zoomed after the sign-in. Touch pointers only (an iPad in landscape is
      // wide and still zooms), so the desktop menu keeps its compact size. A px literal: WebKit tests 16px.
      '@media (pointer:coarse){.ivacct-input{font-size:16px;}}' +
      '.ivacct-note{margin:8px 0 0;font-size:0.8rem;color:var(--muted,#6b6050);min-block-size:1em;overflow-wrap:anywhere;}' +
      '.ivacct-note.is-error{color:var(--danger-text,#b3261e);}' +
      '.ivacct-who{margin:0 0 6px;font-size:0.8rem;color:var(--muted,#6b6050);overflow-wrap:anywhere;}' +
      '.ivacct-sep{border:0;border-top:1px solid var(--border,#c8bfa8);margin:8px 0;}' +
      '[hidden].ivacct-code,[hidden].ivacct-form{display:none;}' +
      // The required-name step: one modal card, the same palette vars as the menu.
      '.ivacct-modal{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.45);font-family:inherit;}' +
      '.ivacct-card{box-sizing:border-box;inline-size:100%;max-inline-size:420px;padding:16px 18px;border:1px solid var(--border,#c8bfa8);border-radius:10px;' +
        'background:var(--white,#fff);color:var(--text,#1a2744);box-shadow:0 10px 30px rgba(0,0,0,.25);text-align:start;}' +
      '.ivacct-card h2{margin:0 0 6px;font-size:1.1rem;}' +
      '.ivacct-card p{margin:6px 0;font-size:0.9rem;line-height:1.45;}' +
      '.ivacct-card .ivacct-item{inline-size:auto;display:inline-block;margin-inline-end:6px;}' +
      '.ivacct-card .ivacct-item.ivacct-primary{border-color:var(--gold,#c9922a);}' +
      '.ivacct-card .ivacct-note{min-block-size:1.2em;}' +
      '@media (prefers-reduced-motion: reduce){.ivacct,.ivacct *,.ivacct-modal,.ivacct-modal *{transition-duration:0.001ms!important;animation-duration:0.001ms!important;}}';
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  }

  // The signed-out chip's glyph: the header-icons set's user-in-circle (docs/reference/shared-components.md → Header icons).
  var ICON_USER = '<svg class="hi hi-user" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.3 18.4a6.5 6.5 0 0 1 11.4 0"/></svg>';
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  // Google's four-colour "G" for the sign-in row. Built inline rather than fetched or set as a
  // background `data:` URI so that no carrier page's CSP changes and an offline visitor still sees it.
  // The path data is the official mark, unmodified — Google's branding terms allow it on a sign-in
  // button only as-is (no recolouring, no reshaping). It is `aria-hidden`: the button's own text
  // already says Google, so a screen reader would otherwise announce the brand twice.
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var GOOGLE_G = [
    ['#EA4335', 'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'],
    ['#4285F4', 'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'],
    ['#FBBC05', 'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'],
    ['#34A853', 'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z']
  ];
  function googleMark() {
    // setAttribute, not .className — on an SVG element that property is a read-only SVGAnimatedString.
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'ivacct-gmark');
    svg.setAttribute('viewBox', '0 0 48 48');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    for (var i = 0; i < GOOGLE_G.length; i++) {
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('fill', GOOGLE_G[i][0]);
      path.setAttribute('d', GOOGLE_G[i][1]);
      svg.appendChild(path);
    }
    return svg;
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
  // The menu's inline-end edge is pinned to the chip, and the chip rides a header row that wraps at
  // phone widths — so on a narrow screen it can be anchored far from the edge it grows toward and
  // leave the viewport. Measured across the nine carriers at 320/390/412: five pages overflow, the
  // worst by 187px of a 282px menu, which is the whole sign-in form. Nothing scrolls it back —
  // in RTL the overflow runs in the inline-start direction, where no scrollbar forms at all. Clamp
  // it the way the pages' own tooltip has since S213: measure, then shift by the overshoot.
  function clampMenu() {
    if (!chip || !chip.menu || chip.menu.hidden) return;
    var m = chip.menu;
    m.style.transform = '';
    var r = m.getBoundingClientRect();
    var w = document.documentElement.clientWidth, dx = 0;
    if (r.right > w - 6) dx = (w - 6) - r.right;
    if (r.left + dx < 6) dx = 6 - r.left;
    if (dx) m.style.transform = 'translateX(' + Math.round(dx) + 'px)';
  }
  function openMenu() {
    if (!chip || chip.open) return;
    renderMenu();
    chip.menu.hidden = false;
    clampMenu();
    chip.open = true;
    chip.btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', onDocPointer, true);
    // The clamp above is a measurement, so it goes stale the moment the viewport moves: a rotation
    // or a window resize with the menu open leaves the shift computed for the OLD width. Measured
    // across the nine carriers, opening wide and then narrowing: 15 of 32 cells leave the viewport,
    // the worst 202px of a 282px menu on the generator -- the same geometry clampMenu() exists to
    // prevent, arrived at from the other direction. Re-clamp rather than close, which is what the
    // pages' own tree menus do on resize: this menu holds a typed email and a 6-digit code mid
    // sign-in, and a phone's on-screen keyboard fires resize just by focusing that field.
    window.addEventListener('resize', clampMenu);
    window.addEventListener('orientationchange', clampMenu);
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
    window.removeEventListener('resize', clampMenu);
    window.removeEventListener('orientationchange', clampMenu);
    // Hand the focus back to the chip only while it is still in the menu or nowhere: a code sign-in's SIGNED_IN
    // listeners open the "Sync settings…" window before verifyOtp resolves, and that window keeps the focus.
    var a = document.activeElement;
    if (refocus && (!a || a === document.body || a === chip.btn || chip.menu.contains(a))) chip.btn.focus();
  }
  function setNote(text, isError) {
    noteState = text ? { text: text, isError: !!isError } : null;
    if (!chip) return;
    var n = chip.menu.querySelector('.ivacct-note');
    if (!n) return;
    n.textContent = text || '';
    n.classList.toggle('is-error', !!isError);
  }
  // The lock the handlers check: aria-disabled alone is only a look, so a double-click sent a second code,
  // which the server refuses within a minute — and the menu then said "Too many attempts" over the code it
  // had sent. Every settle of the action clears it (a Google sign-in resolves as the browser leaves).
  function setBusy(on) {
    menuBusy = !!on;
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
    var u = currentUser || cachedUser();
    var text;
    if (status === 'signed-in' && currentUser) {
      btn.appendChild(el('span', 'ivacct-avatar', initialsOf(currentUser)));
      text = shortName(currentUser);
    } else if (status === 'loading') {
      btn.appendChild(el('span', 'ivacct-avatar', u ? initialsOf(u) : '…'));
      text = u ? shortName(u) : t('shared.account.loading', 'Loading…');
    } else if ((status === 'offline' || status === 'unavailable') && u) {
      btn.appendChild(el('span', 'ivacct-avatar', initialsOf(u)));
      text = t('shared.account.offline', 'Offline');
    } else {
      var ico = el('span', 'ivacct-ico'); ico.innerHTML = ICON_USER;   // static markup from this file, never user data
      btn.appendChild(ico);
      text = t('shared.account.sign_in', 'Sign in');
    }
    btn.appendChild(el('span', 'ivacct-text', text));
    // The name starts with the chip's own words, so "click Sign in" reaches it by voice (WCAG 2.5.3), then says what it opens.
    btn.setAttribute('aria-label', t('shared.account.chip_aria', '{label} – account', { label: text }));
    if (chip.open) renderMenu();
  }

  // The popover: rebuilt from scratch on every render (cheap, and never stale). A rebuild while an action is
  // in flight (the first sign-in's INITIAL_SESSION, a language switch) keeps the lock on the new buttons, and
  // the focus on the same control: a menu that opened by itself (an emailed link, an auth error) is rebuilt
  // again when the page's dictionary lands, which dropped the focus onto the page body.
  function renderMenu() {
    var act = document.activeElement;
    var key = (chip && act && chip.menu.contains(act)) ? act.getAttribute('data-ivk') : null;
    renderMenuBody();
    if (menuBusy) setBusy(true);
    if (key && chip) { var n = chip.menu.querySelector('[data-ivk="' + key + '"]'); if (n && !n.closest('[hidden]')) n.focus(); }
  }
  function renderMenuBody() {
    if (!chip) return;
    var m = chip.menu;
    var typed = m.querySelector('input[type=email]');
    if (typed && typed.value) lastEmail = typed.value;
    // The code survives a rebuild too: the first Verify after a link creates the SDK client, whose
    // INITIAL_SESSION re-renders the open menu while the code is being checked.
    var typedCode = m.querySelector('input[name=code]');
    var keepCode = typedCode ? typedCode.value : '';
    while (m.firstChild) m.removeChild(m.firstChild);
    m.setAttribute('aria-label', t('shared.account.menu_aria', 'Account'));
    var note = el('p', 'ivacct-note');
    note.setAttribute('aria-live', 'polite');

    if (status === 'signed-in' && currentUser) {
      m.appendChild(el('p', 'ivacct-who', t('shared.account.signed_in_as', 'Signed in as {email}', { email: currentUser.email })));
      // The account page: who the account is, what it holds, download everything, delete it.
      var acct = el('a', 'ivacct-item', t('shared.account.account_item', 'Account…'));
      acct.setAttribute('data-ivk', 'account');
      acct.href = '/account.html';
      m.appendChild(acct);
      var out = el('button', 'ivacct-item', t('shared.account.sign_out', 'Sign out'));
      out.setAttribute('data-ivk', 'signout');
      out.type = 'button';
      out.addEventListener('click', function () {
        if (menuBusy) return;
        // Signed in, the saves module keeps the account's items on this device as a cache; a sign-out flushes
        // the last edits and removes that cache (the confirm says so, and names what has not reached the
        // account yet, which stays here as this device's own data). The page reloads either way: it holds
        // in-memory copies of its settings, and a reload is the one reliable way to drop them.
        var msg = signOutConfirmText();
        if (!window.confirm(msg)) return;
        setBusy(true);
        setNote(t('shared.account.sending', 'Sending…'), false);
        signOut().then(reloadAfterSignOut, reloadAfterSignOut);
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
    var google = el('button', 'ivacct-gbtn ivacct-item');
    google.setAttribute('data-ivk', 'google');
    google.type = 'button';
    google.appendChild(googleMark());
    google.appendChild(el('span', null, t('shared.account.google', 'Continue with Google')));
    google.addEventListener('click', function () {
      if (menuBusy) return;
      setBusy(true);
      setNote(t('shared.account.sending', 'Sending…'), false);
      signIn('google').then(function () { setBusy(false); }, function (err) { setBusy(false); setNote(errorText(err), true); });
    });

    var emailLabel = el('label', 'ivacct-label', t('shared.account.email_label', 'Email'));
    var emailInput = el('input', 'ivacct-input');
    emailInput.setAttribute('data-ivk', 'email');
    emailInput.type = 'email';
    emailInput.name = 'email';
    emailInput.autocomplete = 'email';
    emailInput.required = true;
    emailInput.dir = 'ltr';
    emailInput.placeholder = t('shared.account.email_placeholder', 'you@school.org');
    emailInput.value = lastEmail;
    emailLabel.appendChild(emailInput);
    var send = el('button', 'ivacct-item', t('shared.account.send_code', 'Email me a sign-in code'));
    send.setAttribute('data-ivk', 'send');
    send.type = 'submit';

    var codeWrap = el('div', 'ivacct-code');
    codeWrap.hidden = menuStage !== 'code';
    var codeLabel = el('label', 'ivacct-label', t('shared.account.code_label', '6-digit code from the email'));
    var codeInput = el('input', 'ivacct-input');
    codeInput.setAttribute('data-ivk', 'code');
    codeInput.type = 'text';
    codeInput.name = 'code';
    codeInput.inputMode = 'numeric';
    codeInput.autocomplete = 'one-time-code';
    codeInput.maxLength = 8;
    codeInput.dir = 'ltr';
    codeInput.value = keepCode || pendingCode;
    codeLabel.appendChild(codeInput);
    var verify = el('button', 'ivacct-item', t('shared.account.verify', 'Verify code'));
    verify.setAttribute('data-ivk', 'verify');
    verify.type = 'button';
    codeWrap.appendChild(codeLabel);
    codeWrap.appendChild(verify);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (menuBusy) return;
      var email = emailInput.value.trim();
      lastEmail = email;
      setBusy(true);
      setNote(t('shared.account.sending', 'Sending…'), false);
      signIn('email', { email: email }).then(function () {
        setBusy(false);
        menuStage = 'code';
        pendingCode = '';   // a new code replaces the one a link brought: the server has just retired it
        // The first sign-in on a page creates the SDK client, whose INITIAL_SESSION event re-renders the open
        // menu while the code is on its way — so codeWrap and codeInput can be detached copies from the earlier
        // render, and showing them would leave "Type it here" above no field. Show and focus the live ones.
        var liveCode = chip && chip.menu.querySelector('.ivacct-code');
        if (liveCode) liveCode.hidden = false;
        setNote(t('shared.account.code_sent', 'We emailed a 6-digit code to {email}. Type it here.', { email: email }), false);
        var liveInput = liveCode && liveCode.querySelector('input');
        if (liveInput) { liveInput.value = ''; liveInput.focus(); }
      }).catch(function (err) { setBusy(false); setNote(errorText(err), true); });
    });
    verify.addEventListener('click', function () {
      if (menuBusy) return;
      var email = emailInput.value.trim() || lastEmail;
      // A link opened in another browser fills in only the code; the address is the person's to give.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setNote(t('shared.account.error_email', 'Please enter a valid email address.'), true); emailInput.focus(); return; }
      setBusy(true);
      setNote(t('shared.account.sending', 'Sending…'), false);
      verifyCode(email, codeInput.value).then(function () {
        setBusy(false);
        menuStage = 'email';
        closeMenu(true);
      }).catch(function (err) { setBusy(false); pendingCode = ''; setNote(errorText(err), true); });
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
    } else if (pendingCode && menuStage === 'code') {
      // Written straight to the line, not kept in noteState, so a language switch re-renders it translated.
      note.textContent = emailInput.value
        ? t('shared.account.link_filled', 'The code from your email link is filled in. Press “Verify code” to sign in on this device.')
        : t('shared.account.link_filled_email', 'The code from your email link is filled in. Enter your email address, then press “Verify code”.');
    } else if (status === 'offline') {
      setNote(t('shared.account.needs_internet', 'Sign-in needs an internet connection.'), false);
    }
    clampMenu();   // a re-render while open changes the menu's size (the code field appears)
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
    // A sign-in that came back with an error, and an emailed link, are the cases worth opening the menu
    // unasked: the person just clicked a link and needs to see what it did.
    settleLink();   // opens the menu itself when the session state is already known
    if (pendingError && !chip.open) openMenu();
    else if (pendingCode && linkSettled && !chip.open) { openMenu(); focusLinkStep(); }
    return root;
  }

  /* ---------- boot ---------- */
  function boot() {
    consumeLinkHash();   // first, and even with accounts switched off: the code never stays in the address bar
    if (!enabled) { setStatus('disabled'); resolveReady(); return; }
    consumeErrorParams();
    var p = parseAuthParams(location.href);
    if (p.query.code && !hasVerifier()) {
      // The link was opened in a browser that did not start the sign-in: the SDK could not exchange
      // it and would drop any stored session trying. Strip it and steer to the emailed code.
      if (!pendingError) pendingError = { error: 'link_other_browser', code: 'link_other_browser', description: '' };
      cleanUrlNow();
    }
    bootCallback = isAuthCallback(location.href);
    if (bootCallback || hasStoredSession()) {
      setStatus('loading');
      getClient().catch(function (err) {
        setStatus(err && err.code === 'offline' ? 'offline' : 'unavailable');
        resolveReady(); renderChip(); fire(); settleLink();
      });
      // Belt and braces: never leave the page "loading" if the SDK's own init hangs.
      setTimeout(function () {
        if (readyDone) return;
        if (status === 'loading') setStatus(hasStoredSession() ? 'offline' : 'anonymous');
        resolveReady(); renderChip(); fire(); settleLink();
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
    onSignOut: function (fn) { if (typeof fn === 'function' && signOutHooks.indexOf(fn) < 0) signOutHooks.push(fn); },
    onNameStep: function (fn) {
      if (typeof fn !== 'function') return;
      nameStepHooks.push(fn);
      if (nameStepOutcome) Promise.resolve().then(function () { try { fn(nameStepOutcome); } catch (e) { console.warn('[account] onNameStep handler failed:', e); } });
    },
    needsName: needsName,
    hasStoredSession: function () { return enabled && (!!currentUser || hasStoredSession()); },
    storedUserId: function () { return enabled ? ((currentUser && currentUser.id) || storedUserId()) : null; },
    signOutHandled: function () { return signOutHandledUid; },
    openNameStep: openNameStep,
    sessionSource: function () { return sessionSource; },
    openMenu: function () { if (!chip || !mounted) return false; openMenu(); return true; },   // a page's own "Sign in" button opens the chip's menu
    focusChip: function () { if (!chip || !mounted || !chip.btn.getClientRects().length) return false; chip.btn.focus(); return true; },
    profile: profile,
    setDisplayName: setDisplayName,
    deleteAccount: deleteAccount,
    errorText: errorText,
    _test: { isAuthCallback: isAuthCallback, stripAuthParams: stripAuthParams, redirectTarget: redirectTarget, parseAuthParams: parseAuthParams, hasStoredSession: hasStoredSession, parseLinkHash: parseLinkHash, stripLinkHash: stripLinkHash, nameStepOutcome: function () { return nameStepOutcome; }, AUTH_KEY: AUTH_KEY, VERIFIER_KEY: VERIFIER_KEY, CACHE_KEY: CACHE_KEY, REQUEST_KEY: REQUEST_KEY, LINK_HASH_KEY: LINK_HASH_KEY }
  };
})();
