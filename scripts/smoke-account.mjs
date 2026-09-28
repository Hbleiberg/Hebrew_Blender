#!/usr/bin/env node
/*
 * smoke-account.mjs — headless smoke test for the shared account module (js/ivrit-account.js).
 *
 * What it proves, without any real network:
 *   A. Anonymous page, CDN blocked: 0 pageerrors, chip mounted after the language switcher, menu
 *      opens/closes from the keyboard, the "unavailable" note appears, no sb-* key is created.
 *   B. A remembered session but the SDK cannot load: chip reads "Offline", 0 pageerrors.
 *   C. The SDK served locally (the npm build at the pinned CDN URL): it loads under the SRI hash,
 *      createClient runs, an email sign-in attempt fails soft with a note, the self-checks pass.
 *   D. A remembered (fake) session with the SDK served: ready resolves, no pageerror.
 *   E. URL contracts: an auth error return keeps ?s= and loses the error params; a ?code= with no
 *      verifier is stripped and explained.
 *   F. Hebrew UI + dark mode at 800 px renders the chip in Hebrew (screenshots in the scratch dir).
 *   G. Real phone widths (320 / 390, EN + HE): the open menu and the page itself both stay
 *      inside the viewport. 800 px is a tablet — F cannot see a phone overflow.
 *   H. The first email sign-in on a device (SDK served, a fake Auth answering /otp and /verify):
 *      after "Email me a sign-in code" the code field is shown and focused, and the code signs in.
 *   I. The emailed link (#ivsignin=<code>): taken out of the address bar at once, the menu opens with
 *      the code filled in (and the address, in the browser that asked), nothing is sent until Verify
 *      is pressed; another browser types its address; an expired code is explained; a signed-in
 *      device ignores the link; Hebrew + dark at 800 / 390; two real tool pages.
 *   J. Every analytics page leaves the link's code out of page_location and strips it from the URL.
 *
 * Run from the repo root:  node scripts/smoke-account.mjs [--sdk path/to/supabase.js]
 * Needs the repo served on http://localhost:8080 — the script starts python3 -m http.server itself.
 * The --sdk file is optional: without it, C, D, H and I2–I6 are skipped (they need the 2.116.0 UMD bytes,
 * e.g. from `npm pack @supabase/supabase-js@2.116.0` → package/dist/umd/supabase.js).
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const { chromium } = pkg;

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const BASE = 'http://localhost:8080';
const PAGE = BASE + '/account-test.html';
const cfgSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/supabase-config.js'), 'utf8'), cfgSandbox);
const CFG = cfgSandbox.window.IVRIT_SUPABASE;
const AUTH_KEY = 'sb-' + new URL(CFG.url).hostname.split('.')[0] + '-auth-token';
const sdkArg = process.argv.indexOf('--sdk');
const SDK_FILE = sdkArg > -1 ? process.argv[sdkArg + 1] : null;
const SDK_BYTES = SDK_FILE && fs.existsSync(SDK_FILE) ? fs.readFileSync(SDK_FILE) : null;
const SHOTS = process.env.SMOKE_SHOTS || path.join(process.env.TMPDIR || '/tmp', 'smoke-account');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !detail ? '' : ' — ' + detail)); }

async function startServer() {
  const srv = spawn('python3', ['-m', 'http.server', '8080', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE + '/account-test.html', { method: 'HEAD' }); if (r.ok) return srv; } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('http.server did not start');
}

async function openPage(browser, { serveSdk = false, seed = {}, viewport = { width: 1280, height: 800 }, url = PAGE, auth = null } = {}) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport });
  await ctx.addInitScript((seed) => { for (const k of Object.keys(seed)) localStorage.setItem(k, seed[k]); }, seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (serveSdk && SDK_BYTES && u === CFG.sdk) {
      return route.fulfill({ status: 200, body: SDK_BYTES, headers: { 'content-type': 'application/javascript; charset=utf-8', 'access-control-allow-origin': '*' } });
    }
    if (auth && u.startsWith(CFG.url + '/auth/v1/')) return auth(route);
    return route.abort();
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.ivacct-btn', { timeout: 10000 });
  return { ctx, page, errors };
}

const browser = await chromium.launch();
const srv = await startServer();
try {
  // ---- A. anonymous, CDN blocked ------------------------------------------------------------
  {
    const { ctx, page, errors } = await openPage(browser);
    await page.waitForFunction(() => window.I18n && document.querySelector('.ivacct-text') && document.querySelector('.ivacct-text').textContent.includes('Sign in'), null, { timeout: 8000 }).catch(() => {});
    const placed = await page.evaluate(() => { const s = document.querySelector('[data-i18n-switcher]'); return !!(s && s.nextElementSibling && s.nextElementSibling.classList.contains('ivacct')); });
    check('A: chip mounted right after the language switcher', placed);
    const label = await page.textContent('.ivacct-btn');
    check('A: chip reads "Sign in"', /Sign in/.test(label), label);
    const status = await page.evaluate(() => IvritAccount.status());
    check('A: status is anonymous before any click', status === 'anonymous', status);
    await page.focus('.ivacct-btn');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 3000 });
    check('A: menu opens from the keyboard', await page.getAttribute('.ivacct-btn', 'aria-expanded') === 'true');
    check('A: menu has Google + email controls', await page.evaluate(() => !!document.querySelector('.ivacct-menu input[type=email]') && [...document.querySelectorAll('.ivacct-item')].some(b => /Google/.test(b.textContent))));
    check('A: focus moved into the menu', await page.evaluate(() => document.querySelector('.ivacct-menu').contains(document.activeElement)));
    await page.waitForFunction(() => /unavailable/i.test(document.querySelector('.ivacct-note').textContent), null, { timeout: 15000 }).catch(() => {});
    const note = await page.textContent('.ivacct-note');
    check('A: blocked CDN shows the "unavailable" note', /unavailable/i.test(note), note);
    await page.keyboard.press('Escape');
    check('A: Escape closes the menu and returns focus', await page.evaluate(() => document.querySelector('.ivacct-menu').hidden && document.activeElement.classList.contains('ivacct-btn')));
    const sbKeys = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('sb-')));
    check('A: no sb-* key created while anonymous', sbKeys.length === 0, sbKeys.join(','));
    check('A: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await page.screenshot({ path: path.join(SHOTS, 'A-anon-light-1280.png') });
    await ctx.close();
  }
  // ---- B. remembered session, SDK cannot load -------------------------------------------------
  {
    const seed = {}; seed[AUTH_KEY] = '{}'; seed.ivritSuite_accountCache = JSON.stringify({ email: 'teacher@example.org', name: 'Test Teacher' });
    const { ctx, page, errors } = await openPage(browser, { seed });
    await page.waitForFunction(() => ['offline', 'unavailable'].includes(IvritAccount.status()), null, { timeout: 20000 }).catch(() => {});
    const status = await page.evaluate(() => IvritAccount.status());
    check('B: status is offline/unavailable when the SDK is blocked', status === 'offline' || status === 'unavailable', status);
    const label = await page.textContent('.ivacct-btn');
    check('B: chip shows initials + "Offline"', /TT/.test(label) && /Offline/.test(label), label);
    check('B: user() is null without a live session', await page.evaluate(() => IvritAccount.user() === null));
    check('B: ready resolved', await page.evaluate(() => Promise.race([IvritAccount.ready.then(() => true), new Promise(r => setTimeout(() => r(false), 3000))])));
    check('B: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- C. SDK served locally, anonymous -------------------------------------------------------
  if (SDK_BYTES) {
    const { ctx, page, errors } = await openPage(browser, { serveSdk: true });
    await page.click('.ivacct-btn');
    await page.waitForFunction(() => window.supabase && typeof window.supabase.createClient === 'function', null, { timeout: 15000 }).catch(() => {});
    check('C: SDK loaded from the pinned URL under its SRI hash', await page.evaluate(() => !!(window.supabase && window.supabase.createClient)));
    await page.fill('.ivacct-menu input[type=email]', 'teacher@example.org');
    await page.click('.ivacct-menu button[type=submit]');
    await page.waitForFunction(() => { const n = document.querySelector('.ivacct-note'); return n && n.classList.contains('is-error') && n.textContent.trim().length > 0; }, null, { timeout: 15000 }).catch(() => {});
    const note = await page.textContent('.ivacct-note');
    check('C: email sign-in with the API unreachable fails soft with a note', note.trim().length > 0, note);
    const st = await page.evaluate(() => IvritAccount.status());
    check('C: still anonymous after the failed attempt', st === 'anonymous', st);
    await page.keyboard.press('Escape');
    await page.click('#checksBtn');
    const passed = await page.textContent('#checks li:last-child');
    check('C: self-checks all pass', /^(\d+) \/ \1 passed$/.test(passed.trim()), passed);
    check('C: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  } else { console.log('SKIP C/D: no --sdk file given'); }
  // ---- D. fake remembered session, SDK served ------------------------------------------------
  if (SDK_BYTES) {
    const seed = {}; seed[AUTH_KEY] = JSON.stringify({ access_token: 'x', refresh_token: 'y', expires_at: 1, token_type: 'bearer', user: { id: 'u1', email: 'teacher@example.org' } });
    const { ctx, page, errors } = await openPage(browser, { serveSdk: true, seed });
    const ready = await page.evaluate(() => Promise.race([IvritAccount.ready.then(() => true), new Promise(r => setTimeout(() => r(false), 20000))]));
    check('D: ready resolves with a stale session and no API', ready);
    const st = await page.evaluate(() => IvritAccount.status());
    check('D: status settled to a non-loading state', st !== 'loading', st);
    check('D: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- E. URL contracts -------------------------------------------------------------------------
  {
    const { ctx, page, errors } = await openPage(browser, { url: PAGE + '?s=abc&error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired' });
    const search = await page.evaluate(() => location.search);
    check('E: auth error params stripped, ?s= kept', search === '?s=abc', search);
    await page.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 3000 }).catch(() => {});
    const note = await page.textContent('.ivacct-note').catch(() => '');
    check('E: expired-link note shown', /expired/i.test(note), note);
    check('E: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
    const r2 = await openPage(browser, { url: PAGE + '?lang=en&code=abc123' });
    const s2 = await r2.page.evaluate(() => location.search);
    check('E: ?code= without a verifier is stripped', !/code=/.test(s2), s2);
    const n2 = await r2.page.textContent('.ivacct-note').catch(() => '');
    check('E: "different browser" note shown', /different browser/i.test(n2), n2);
    check('E: 0 pageerrors (code case)', r2.errors.length === 0, r2.errors.join(' | '));
    await r2.ctx.close();
  }
  // ---- F. Hebrew + dark at 800px -------------------------------------------------------------
  {
    const { ctx, page, errors } = await openPage(browser, { seed: { hebrewBlender_lang: 'he', hebrewBlender_darkMode: '1' }, viewport: { width: 800, height: 700 } });
    await page.waitForFunction(() => document.querySelector('.ivacct-text') && /כניסה/.test(document.querySelector('.ivacct-text').textContent), null, { timeout: 8000 }).catch(() => {});
    const label = await page.textContent('.ivacct-btn');
    check('F: Hebrew chip label', /כניסה/.test(label), label);
    check('F: dark mode applied', await page.evaluate(() => document.body.classList.contains('dark')));
    await page.click('.ivacct-btn');
    await page.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 3000 });
    const box = await page.evaluate(() => { const r = document.querySelector('.ivacct-menu').getBoundingClientRect(); return { l: r.left, r: r.right, w: innerWidth }; });
    check('F: menu stays inside the viewport', box.l >= 0 && box.r <= box.w, JSON.stringify(box));
    await page.screenshot({ path: path.join(SHOTS, 'F-he-dark-800.png') });
    check('F: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- G. Real phone widths ------------------------------------------------------------------
  // F's 800 px is a tablet, and every one of the 17 phone overflows pass N found in S389 was
  // invisible to it. 320 / 390 are the narrowest widths the suite targets; the open menu is the
  // widest thing the chip can put on screen, and it is measured in both directions because an RTL
  // menu overflows off the other edge. The document is measured too: a menu that fits while the
  // header it hangs from does not is still a sideways-scrolling page.
  for (const width of [320, 390]) {
    for (const he of [false, true]) {
      const seed = he ? { hebrewBlender_lang: 'he', hebrewBlender_darkMode: '1' } : {};
      const { ctx, page, errors } = await openPage(browser, { seed, viewport: { width, height: 700 } });
      await page.click('.ivacct-btn');
      await page.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 3000 });
      const box = await page.evaluate(() => {
        const r = document.querySelector('.ivacct-menu').getBoundingClientRect();
        const d = document.documentElement;
        return { l: Math.round(r.left), r: Math.round(r.right), w: innerWidth, sw: d.scrollWidth, cw: d.clientWidth };
      });
      const tag = `G: ${width}px ${he ? 'he' : 'en'}`;
      check(`${tag} — menu stays inside the viewport`, box.l >= 0 && box.r <= box.w, JSON.stringify(box));
      check(`${tag} — the page does not scroll sideways`, box.sw <= box.cw, JSON.stringify(box));
      check(`${tag} — 0 pageerrors`, errors.length === 0, errors.join(' | '));
      await page.screenshot({ path: path.join(SHOTS, `G-${width}-${he ? 'he' : 'en'}.png`) });
      await ctx.close();
    }
  }
  // ---- H. The first email sign-in on a device ---------------------------------------------------
  // C sends a code only to an unreachable API, so nothing drove the success path — and it was broken:
  // the first signIn() creates the SDK client, whose INITIAL_SESSION event re-renders the open menu
  // while the code is on its way, and the step after the send showed the field of the earlier render.
  // The menu said "Type it here" above no field. A fake Auth answers the two calls the email path makes.
  if (SDK_BYTES) {
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'teacher@example.org', user_metadata: {}, app_metadata: { provider: 'email' } };
    const auth = (route) => {
      const p = new URL(route.request().url()).pathname;
      const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (p.endsWith('/otp')) return route.fulfill({ status: 200, headers, body: '{}' });
      if (p.endsWith('/verify')) return route.fulfill({ status: 200, headers, body: JSON.stringify({ access_token: 'x', refresh_token: 'y', expires_in: 3600, expires_at: 4102444800, token_type: 'bearer', user }) });
      if (p.endsWith('/user')) return route.fulfill({ status: 200, headers, body: JSON.stringify(user) });
      return route.fulfill({ status: 404, headers, body: '{}' });
    };
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 700 }]) {
      const { ctx, page, errors } = await openPage(browser, { serveSdk: true, auth, viewport });
      const tag = `H: ${viewport.width}px`;
      await page.click('.ivacct-btn');
      await page.waitForFunction(() => window.supabase && window.supabase.createClient, null, { timeout: 15000 }).catch(() => {});
      await page.fill('.ivacct-menu input[type=email]', 'teacher@example.org');
      await page.click('.ivacct-menu button[type=submit]');
      await page.waitForFunction(() => /6-digit/.test(document.querySelector('.ivacct-note').textContent), null, { timeout: 15000 }).catch(() => {});
      const st = await page.evaluate(() => { const c = document.querySelector('.ivacct-menu .ivacct-code'); const i = c && c.querySelector('input'); return { shown: !!c && !c.hidden, focused: !!i && document.activeElement === i }; });
      check(`${tag} — the code field appears after the first send`, st.shown, JSON.stringify(st));
      check(`${tag} — and takes the focus`, st.focused, JSON.stringify(st));
      if (st.shown) {
        await page.fill('.ivacct-menu input[name=code]', '123456');
        await page.click('.ivacct-menu .ivacct-code button');
        await page.waitForFunction(() => IvritAccount.status() === 'signed-in', null, { timeout: 15000 }).catch(() => {});
      }
      const signedIn = await page.evaluate(() => IvritAccount.status());
      check(`${tag} — the code signs in`, signedIn === 'signed-in', signedIn);
      check(`${tag} — 0 pageerrors`, errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  } else { console.log('SKIP H: no --sdk file given'); }
  // ---- I. The emailed link (#ivsignin=<code>) ---------------------------------------------------
  // The sign-in email carries the code and a link back to the page it was asked from with the code in the
  // hash (db/email-templates/sign-in-code.html). School mail filters open every link to scan it, so the link
  // must spend nothing by being opened: the code is taken out of the address bar at once and only filled in,
  // and nothing is sent until Verify is pressed — checked against the address in the field, which is the one
  // this browser asked with (ivritSuite_signInRequest), else the person's to type. A code is only ever valid
  // for the address it was sent to, so a link someone else sent cannot sign anyone into their account.
  const CODE = '482913';
  const LINK_URL = PAGE + '?s=abc#ivsignin=' + CODE;
  const REQUEST_KEY = 'ivritSuite_signInRequest';
  const asked = (e) => ({ [REQUEST_KEY]: JSON.stringify({ e, at: Date.now() }) });
  const linkState = (page) => page.evaluate(() => {
    const m = document.querySelector('.ivacct-menu');
    const email = m && m.querySelector('input[type=email]');
    const code = m && m.querySelector('input[name=code]');
    const a = document.activeElement;
    return {
      hash: location.hash, search: location.search, open: !!m && !m.hidden,
      email: email ? email.value : null, code: code ? code.value : null,
      focus: a === email ? 'email' : (a && a.closest && a.closest('.ivacct-code') && a.tagName === 'BUTTON') ? 'verify' : (a ? a.tagName : ''),
      note: (document.querySelector('.ivacct-note') || {}).textContent || ''
    };
  });
  function fakeAuth(user, calls, verifyStatus = 200) {
    return (route) => {
      const req = route.request();
      const p = new URL(req.url()).pathname;
      const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (p.endsWith('/otp')) return route.fulfill({ status: 200, headers, body: '{}' });
      if (p.endsWith('/verify')) {
        let body = {}; try { body = JSON.parse(req.postData() || '{}'); } catch (e) {}
        calls.push(body);
        if (verifyStatus !== 200) return route.fulfill({ status: verifyStatus, headers, body: JSON.stringify({ code: verifyStatus, error_code: 'otp_expired', msg: 'Token has expired or is invalid' }) });
        return route.fulfill({ status: 200, headers, body: JSON.stringify({ access_token: 'x', refresh_token: 'y', expires_in: 3600, expires_at: 4102444800, token_type: 'bearer', user }) });
      }
      if (p.endsWith('/user')) return route.fulfill({ status: 200, headers, body: JSON.stringify(user) });
      if (p.endsWith('/logout')) return route.fulfill({ status: 204, headers });
      return route.fulfill({ status: 404, headers, body: '{}' });
    };
  }
  const TEACHER = { id: '22222222-2222-4222-8222-222222222222', email: 'teacher@example.org', user_metadata: {}, app_metadata: { provider: 'email' } };
  // I1 — no SDK (CDN blocked), opened in a browser that did not ask: stripped, filled in, nothing else.
  {
    const { ctx, page, errors } = await openPage(browser, { url: LINK_URL });
    await page.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 5000 }).catch(() => {});
    const s = await linkState(page);
    check('I1: the code is taken out of the address bar, ?s= kept', s.hash === '' && s.search === '?s=abc', JSON.stringify(s));
    check('I1: the menu opens by itself at the code step', s.open && s.code === CODE, JSON.stringify(s));
    check('I1: another browser: the address is left for the person, and focused', s.email === '' && s.focus === 'email', JSON.stringify(s));
    check('I1: nothing written for an anonymous visit', await page.evaluate((k) => localStorage.getItem(k) === null && !Object.keys(localStorage).some(x => x.startsWith('sb-')), REQUEST_KEY));
    check('I1: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  if (SDK_BYTES) {
    // I2 — the browser that asked: address and code filled in, focus on Verify; opening sends nothing; one press signs in.
    {
      const calls = [];
      const { ctx, page, errors } = await openPage(browser, { url: LINK_URL, serveSdk: true, seed: asked('teacher@example.org'), auth: fakeAuth(TEACHER, calls) });
      await page.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 5000 }).catch(() => {});
      await page.waitForFunction(() => window.supabase && window.supabase.createClient, null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const s = await linkState(page);
      check('I2: stripped, ?s= kept', s.hash === '' && s.search === '?s=abc', JSON.stringify(s));
      check('I2: the address this browser asked with and the code are filled in', s.email === 'teacher@example.org' && s.code === CODE, JSON.stringify(s));
      check('I2: focus on Verify, the note names it', s.focus === 'verify' && /filled in/.test(s.note) && /Verify code/.test(s.note), JSON.stringify(s));
      check('I2: opening the link sent nothing (a scanner spends nothing)', calls.length === 0, JSON.stringify(calls));
      await page.click('.ivacct-menu .ivacct-code button');
      await page.waitForFunction(() => IvritAccount.status() === 'signed-in', null, { timeout: 15000 }).catch(() => {});
      const after = await page.evaluate((k) => ({ st: IvritAccount.status(), src: IvritAccount.sessionSource(), req: localStorage.getItem(k), open: !document.querySelector('.ivacct-menu').hidden }), REQUEST_KEY);
      check('I2: one press signs in', after.st === 'signed-in', JSON.stringify(after));
      check('I2: exactly one verify, with this address, this code, type email', calls.length === 1 && calls[0].email === 'teacher@example.org' && calls[0].token === CODE && calls[0].type === 'email', JSON.stringify(calls));
      check('I2: a fresh sign-in (the sync screen may offer itself)', after.src === 'new', JSON.stringify(after));
      check('I2: the request record is gone and the menu closed', after.req === null && !after.open, JSON.stringify(after));
      check('I2: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // I3 — another browser: the address is the person's to give; an empty one is refused inline, sends nothing.
    {
      const calls = [];
      const { ctx, page, errors } = await openPage(browser, { url: LINK_URL, serveSdk: true, auth: fakeAuth(TEACHER, calls) });
      await page.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 5000 }).catch(() => {});
      await page.waitForFunction(() => window.supabase && window.supabase.createClient, null, { timeout: 15000 }).catch(() => {});
      const s = await linkState(page);
      check('I3: code filled in, address empty and focused, the note asks for it', s.code === CODE && s.email === '' && s.focus === 'email' && /Enter your email/.test(s.note), JSON.stringify(s));
      await page.click('.ivacct-menu .ivacct-code button');
      const n1 = await page.textContent('.ivacct-note');
      check('I3: Verify without an address is refused inline and sends nothing', /valid email/i.test(n1) && calls.length === 0, n1 + ' ' + JSON.stringify(calls));
      await page.fill('.ivacct-menu input[type=email]', 'teacher@example.org');
      await page.click('.ivacct-menu .ivacct-code button');
      await page.waitForFunction(() => IvritAccount.status() === 'signed-in', null, { timeout: 15000 }).catch(() => {});
      check('I3: with the address typed, Verify signs in', await page.evaluate(() => IvritAccount.status()) === 'signed-in' && calls.length === 1 && calls[0].email === 'teacher@example.org' && calls[0].token === CODE, JSON.stringify(calls));
      check('I3: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // I4 — a used or expired code: the refusal is explained, nobody is signed in.
    {
      const calls = [];
      const { ctx, page, errors } = await openPage(browser, { url: LINK_URL, serveSdk: true, seed: asked('teacher@example.org'), auth: fakeAuth(TEACHER, calls, 403) });
      await page.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 5000 }).catch(() => {});
      await page.click('.ivacct-menu .ivacct-code button');
      await page.waitForFunction(() => document.querySelector('.ivacct-note').classList.contains('is-error'), null, { timeout: 15000 }).catch(() => {});
      const n = await page.textContent('.ivacct-note');
      check('I4: an expired code says so', /not valid or has expired/.test(n), n);
      check('I4: still signed out', await page.evaluate(() => IvritAccount.status()) === 'anonymous');
      check('I4: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // I5 — already signed in here: the link has nothing to finish; no menu, nothing sent, still stripped.
    {
      const calls = [];
      const seed = asked('teacher@example.org');
      seed[AUTH_KEY] = JSON.stringify({ access_token: 'x', refresh_token: 'y', expires_in: 3600, expires_at: 4102444800, token_type: 'bearer', user: TEACHER });
      const { ctx, page, errors } = await openPage(browser, { url: LINK_URL, serveSdk: true, seed, auth: fakeAuth(TEACHER, calls) });
      await page.evaluate(() => Promise.race([IvritAccount.ready, new Promise(r => setTimeout(r, 15000))]));
      await page.waitForTimeout(800);
      const s = await linkState(page);
      const st = await page.evaluate(() => IvritAccount.status());
      check('I5: signed in from the stored session', st === 'signed-in', st);
      check('I5: no menu, nothing sent, the code stripped', !s.open && calls.length === 0 && s.hash === '', JSON.stringify(s) + ' ' + JSON.stringify(calls));
      check('I5: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // I6 — Hebrew + dark, tablet and phone: the filled-in step reads in Hebrew and stays on screen.
    for (const viewport of [{ width: 800, height: 700 }, { width: 390, height: 700 }]) {
      const seed = Object.assign({ hebrewBlender_lang: 'he', hebrewBlender_darkMode: '1' }, asked('teacher@example.org'));
      const { ctx, page, errors } = await openPage(browser, { url: LINK_URL, serveSdk: true, seed, viewport });
      await page.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 5000 }).catch(() => {});
      await page.waitForFunction(() => /הקוד מקישור האימייל/.test(document.querySelector('.ivacct-note').textContent), null, { timeout: 8000 }).catch(() => {});
      const s = await linkState(page);
      const box = await page.evaluate(() => { const r = document.querySelector('.ivacct-menu').getBoundingClientRect(); const d = document.documentElement; return { l: Math.round(r.left), r: Math.round(r.right), w: innerWidth, sw: d.scrollWidth, cw: d.clientWidth }; });
      const tag = `I6: he dark ${viewport.width}px`;
      check(`${tag} — the note is Hebrew and names אימות הקוד`, /הקוד מקישור האימייל/.test(s.note) && /אימות הקוד/.test(s.note), s.note);
      check(`${tag} — menu inside the viewport, no sideways scroll`, box.l >= 0 && box.r <= box.w && box.sw <= box.cw, JSON.stringify(box));
      check(`${tag} — 0 pageerrors`, errors.length === 0, errors.join(' | '));
      await page.screenshot({ path: path.join(SHOTS, `I6-he-dark-${viewport.width}.png`) });
      await ctx.close();
    }
  } else { console.log('SKIP I2-I6: no --sdk file given'); }
  // I7 — real tool pages (CDN blocked): the chip in their own header opens at the filled-in step.
  for (const p of ['index.html', 'hebrew_blend_generator.html']) {
    const { ctx, page, errors } = await openPage(browser, { url: BASE + '/' + p + '?s=abc#ivsignin=' + CODE });
    await page.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 5000 }).catch(() => {});
    const s = await linkState(page);
    check(`I7: ${p} — stripped (?s= kept), the menu opens with the code filled in`, s.hash === '' && s.search === '?s=abc' && s.open && s.code === CODE, JSON.stringify(s));
    check(`I7: ${p} — 0 pageerrors`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- J. The code never reaches Analytics ------------------------------------------------------
  // Every page's inline gtag('config') runs during parse, before the module strips the hash, and reports an
  // explicit page_location: it must drop a hash carrying the link and keep any other hash as before.
  {
    const gaPages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && fs.readFileSync(path.join(ROOT, f), 'utf8').includes('page_location')).sort();
    // Five of them (404, contact, privacy, resources, terms) do not load the account module: no sign-in is asked
    // from them, so no link returns to them, and only their analytics tag has to hold.
    const loadsModule = (f) => /<script src="\/js\/ivrit-account\.js"/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    const pageLocation = async (url) => {
      const ctx = await browser.newContext({ serviceWorkers: 'block' });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e && e.message || e)));
      await page.route('**/*', route => { const u = route.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? route.continue() : route.abort(); });
      await page.goto(url, { waitUntil: 'load' });
      const r = await page.evaluate(() => {
        const cfg = (window.dataLayer || []).map(a => Array.from(a)).find(a => a[0] === 'config');
        return { loc: cfg && cfg[2] ? String(cfg[2].page_location) : null, hash: location.hash };
      });
      await ctx.close();
      return Object.assign(r, { errors });
    };
    let leaks = [], unstripped = [], missing = [], errs = [];
    for (const f of gaPages) {
      const r = await pageLocation(BASE + '/' + f + '?s=abc#ivsignin=' + CODE);
      if (!r.loc) missing.push(f);
      else if (/ivsignin|482913/.test(r.loc) || !/\?s=abc$/.test(r.loc)) leaks.push(f + ' → ' + r.loc);
      if (loadsModule(f) && r.hash !== '') unstripped.push(f + ' ' + r.hash);
      if (r.errors.length) errs.push(f + ': ' + r.errors.join(' | '));
    }
    check(`J: ${gaPages.length} analytics pages found`, gaPages.length >= 14, gaPages.join(','));
    check('J: every page reports a page_location', missing.length === 0, missing.join(', '));
    check('J: no page reports the link\'s code to Analytics (?s= kept)', leaks.length === 0, leaks.join(' ; '));
    check(`J: every page with the account module (${gaPages.filter(loadsModule).length}) takes the code out of the address bar`, gaPages.filter(loadsModule).length >= 9 && unstripped.length === 0, unstripped.join(' ; '));
    check('J: 0 pageerrors across the analytics pages', errs.length === 0, errs.join(' ; '));
    const ctl = await pageLocation(BASE + '/resources.html#fonts');
    check('J: an unrelated hash is still reported as before', /resources\.html#fonts$/.test(ctl.loc || ''), ctl.loc);
  }
} finally {
  await browser.close();
  srv.kill();
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} checks passed; screenshots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
