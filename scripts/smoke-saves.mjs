#!/usr/bin/env node
/*
 * smoke-saves.mjs — headless smoke test for the shared saves module (js/ivrit-saves.js).
 *
 * What it proves, without any real network:
 *   A. Anonymous page, CDN blocked: 0 pageerrors, the panel shows the sign-in line, the local backend
 *      round trip passes and every other localStorage key is byte-identical, no sync memory and no
 *      sb-* key is created.
 *   B. The pure self-checks (canonical hashing, the state table, merges, guards) all pass.
 *   C. A remembered (fake) session with the SDK served locally and the API unreachable: the panel
 *      renders and fails soft (a status line or the signed-out note), 0 pageerrors.
 *   D. Hebrew UI + dark mode at 800 px: the panel title is Hebrew, the status line is aria-live.
 *
 * Run from the repo root:  node scripts/smoke-saves.mjs [--sdk path/to/supabase.js]
 * Needs the repo served on http://localhost:8080 — the script starts python3 -m http.server itself.
 * The --sdk file is optional: without it, C is skipped.
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const { chromium } = pkg;

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const BASE = 'http://localhost:8080';
const PAGE = BASE + '/saves-test.html';
const cfgSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/supabase-config.js'), 'utf8'), cfgSandbox);
const CFG = cfgSandbox.window.IVRIT_SUPABASE;
const AUTH_KEY = 'sb-' + new URL(CFG.url).hostname.split('.')[0] + '-auth-token';
const sdkArg = process.argv.indexOf('--sdk');
const SDK_FILE = sdkArg > -1 ? process.argv[sdkArg + 1] : null;
const SDK_BYTES = SDK_FILE && fs.existsSync(SDK_FILE) ? fs.readFileSync(SDK_FILE) : null;
const SHOTS = process.env.SMOKE_SHOTS || path.join(process.env.TMPDIR || '/tmp', 'smoke-saves');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !detail ? '' : ' — ' + detail)); }

async function startServer() {
  const srv = spawn('python3', ['-m', 'http.server', '8080', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(PAGE, { method: 'HEAD' }); if (r.ok) return srv; } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('http.server did not start');
}

async function openPage(browser, { serveSdk = false, seed = {}, viewport = { width: 1280, height: 900 }, url = PAGE } = {}) {
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
  await page.waitForSelector('.ivsav', { timeout: 10000 });
  return { ctx, page, errors };
}
const summaryOk = s => /^(\d+) \/ \1 passed$/.test((s || '').trim());

const browser = await chromium.launch();
const srv = await startServer();
try {
  // ---- A. anonymous, CDN blocked ------------------------------------------------------------
  {
    const seed = { hebrewBlender_presets: '{"Keep me":{"x":1}}', hebrewFlashCards_pbStreak: '4' };   // "other" keys that must not move
    const { ctx, page, errors } = await openPage(browser, { seed });
    await page.waitForFunction(() => window.I18n && document.querySelector('.ivsav-note'), null, { timeout: 8000 }).catch(() => {});
    const note = await page.textContent('.ivsav-note').catch(() => '');
    check('A: signed-out panel shows the sign-in line', /Sign in/.test(note), note);
    check('A: the panel has a Sign in button and no list', await page.evaluate(() => !!document.querySelector('.ivsav .ivsav-btn') && !document.querySelector('.ivsav-list')));
    const before = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
    await page.click('#localChecksBtn');
    await page.waitForFunction(() => { const l = document.querySelector('#localChecks li:last-child'); return l && /passed/.test(l.textContent); }, null, { timeout: 15000 }).catch(() => {});
    const local = await page.textContent('#localChecks li:last-child').catch(() => '');
    check('A: local backend checks all pass', summaryOk(local), await page.evaluate(() => [...document.querySelectorAll('#localChecks li')].filter(l => /FAIL/.test(l.textContent)).map(l => l.textContent).join(' | ')));
    const after = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
    check('A: localStorage is byte-identical after the round trip', before === after, after);
    const bad = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('sb-') || k === 'ivritSuite_syncMeta'));
    check('A: no sb-* key and no sync memory created', bad.length === 0, bad.join(','));
    check('A: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await page.screenshot({ path: path.join(SHOTS, 'A-anon-light-1280.png'), fullPage: true });
    await ctx.close();
  }
  // ---- B. pure self-checks --------------------------------------------------------------------
  {
    const { ctx, page, errors } = await openPage(browser);
    await page.click('#checksBtn');
    await page.waitForFunction(() => { const l = document.querySelector('#checks li:last-child'); return l && /passed/.test(l.textContent); }, null, { timeout: 15000 }).catch(() => {});
    const sum = await page.textContent('#checks li:last-child').catch(() => '');
    check('B: self-checks all pass', summaryOk(sum), await page.evaluate(() => [...document.querySelectorAll('#checks li')].filter(l => /FAIL/.test(l.textContent)).map(l => l.textContent).join(' | ')));
    check('B: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- C. fake remembered session, SDK served, API unreachable --------------------------------
  if (SDK_BYTES) {
    const seed = {};
    seed[AUTH_KEY] = JSON.stringify({ access_token: 'x', refresh_token: 'y', expires_at: 4102444800, token_type: 'bearer', user: { id: '11111111-1111-4111-8111-111111111111', email: 'teacher@example.org' } });
    seed.ivritSuite_accountCache = JSON.stringify({ email: 'teacher@example.org', name: 'Test Teacher' });
    const { ctx, page, errors } = await openPage(browser, { serveSdk: true, seed });
    await page.waitForFunction(() => IvritAccount.status() !== 'loading', null, { timeout: 25000 }).catch(() => {});
    await page.waitForFunction(() => {
      const st = document.querySelector('.ivsav-status'), note = document.querySelector('.ivsav-note');
      return (st && st.classList.contains('is-error') && st.textContent.trim()) || (note && note.textContent.trim());
    }, null, { timeout: 25000 }).catch(() => {});
    const st = await page.evaluate(() => ({ account: IvritAccount.status(), status: (document.querySelector('.ivsav-status') || {}).textContent, note: (document.querySelector('.ivsav-note') || {}).textContent }));
    check('C: panel failed soft (an error status line or the signed-out note)', /\S/.test(st.status || '') || /\S/.test(st.note || ''), JSON.stringify(st));
    check('C: 0 pageerrors with the API unreachable', errors.length === 0, errors.join(' | '));
    await ctx.close();
  } else { console.log('SKIP C: no --sdk file given'); }
  // ---- D. Hebrew + dark at 800px -------------------------------------------------------------
  {
    const { ctx, page, errors } = await openPage(browser, { seed: { hebrewBlender_lang: 'he', hebrewBlender_darkMode: '1' }, viewport: { width: 800, height: 900 } });
    await page.waitForFunction(() => document.querySelector('.ivsav-title') && /שמירות/.test(document.querySelector('.ivsav-title').textContent), null, { timeout: 8000 }).catch(() => {});
    const title = await page.textContent('.ivsav-title').catch(() => '');
    check('D: Hebrew panel title', /שמירות בענן/.test(title), title);
    check('D: dark mode applied', await page.evaluate(() => document.body.classList.contains('dark')));
    check('D: status line is aria-live', await page.evaluate(() => { const s = document.querySelector('.ivsav-status'); return !!s && s.getAttribute('aria-live') === 'polite'; }));
    check('D: RTL document', await page.evaluate(() => document.documentElement.dir === 'rtl'));
    await page.screenshot({ path: path.join(SHOTS, 'D-he-dark-800.png') });
    check('D: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.kill();
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} checks passed; screenshots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
