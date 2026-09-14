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
 *
 * Run from the repo root:  node scripts/smoke-account.mjs [--sdk path/to/supabase.js]
 * Needs the repo served on http://localhost:8080 — the script starts python3 -m http.server itself.
 * The --sdk file is optional: without it, C and D are skipped (they need the 2.116.0 UMD bytes,
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

async function openPage(browser, { serveSdk = false, seed = {}, viewport = { width: 1280, height: 800 }, url = PAGE } = {}) {
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
} finally {
  await browser.close();
  srv.kill();
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} checks passed; screenshots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
