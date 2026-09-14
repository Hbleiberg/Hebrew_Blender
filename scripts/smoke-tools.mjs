#!/usr/bin/env node
/*
 * smoke-tools.mjs — headless smoke test for every tool page that carries the account chip and the
 * cloud-saves panel (js/ivrit-account.js + js/ivrit-saves.js). No real network is used.
 *
 * Per page in PAGES:
 *   A. Anonymous, CDN blocked: 0 pageerrors; the chip sits in the same parent as the language switcher;
 *      the panel shell holds the module's sign-in line; IvritSaves.plan(tool) returns exactly the seeded
 *      items; and the full localStorage dump is byte-identical to a CONTROL run of the same page with the
 *      three account scripts blocked (the "anonymous flow unchanged" bar, measured rather than argued).
 *   B. A remembered (fake) session with the SDK served locally and the API unreachable: 0 pageerrors and
 *      the panel fails soft (a status line or the signed-out note).
 *   C. Hebrew UI + dark mode at 800 px with the panel's host expanded: the sign-in line is Hebrew.
 *   D. URL contracts (pages that declare `urlKeep`): an auth-error return keeps the page's own params.
 *
 * Run from the repo root:  node scripts/smoke-tools.mjs [--sdk path/to/supabase.js] [--only <file>]
 * Needs the repo served on http://localhost:8080 — the script starts python3 -m http.server itself.
 * The --sdk file is optional: without it, B is skipped.
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const { chromium } = pkg;

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const BASE = 'http://localhost:8080';
const cfgSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/supabase-config.js'), 'utf8'), cfgSandbox);
const CFG = cfgSandbox.window.IVRIT_SUPABASE;
const AUTH_KEY = 'sb-' + new URL(CFG.url).hostname.split('.')[0] + '-auth-token';
const ACCOUNT_SCRIPTS = ['/js/supabase-config.js', '/js/ivrit-account.js', '/js/ivrit-saves.js'];
const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };
const SDK_FILE = arg('--sdk');
const SDK_BYTES = SDK_FILE && fs.existsSync(SDK_FILE) ? fs.readFileSync(SDK_FILE) : null;
const ONLY = arg('--only');
const SHOTS = process.env.SMOKE_SHOTS || path.join(process.env.TMPDIR || '/tmp', 'smoke-tools');
fs.mkdirSync(SHOTS, { recursive: true });
const SETTLE_MS = 1500;   // longer than every page's debounced writer (300 ms settings, 1 s dictionary session)

/*
 * One entry per wired page. `seed` is written into localStorage before load (realistic values for every
 * registry key of the tool); `rows` is what plan(tool) must list (kind:name); `host` is the element the
 * panel renders into; `expand` runs in the page to make the host visible for the screenshot; `urlKeep`
 * (optional) is a query string the page must keep after the auth-error params are stripped.
 */
const PAGES = [
  {
    file: 'trope_tutor.html', tool: 'TropeTutor', host: '#cloudSavesPanel',
    seed: {
      hebrewTropeTutor_progress: JSON.stringify({ v: 1, tropes: { etnachta: { r: 3, w: 1 }, sofpasuk: { r: 5, w: 0 } }, families: { disjunctive: true }, pbStreak: 4 }),
      hebrewTropeTutor_settings: JSON.stringify({ v: 1, tradition: 'seph', hebFont: 'Frank Ruhl Libre', hebFontSize: 2.2, drillIdentify: true, drillHear: true, drillMelody: false, drillScope: 'all', playbackRate: 1, panelsCollapsed: { 'trope.settings.panel_font': true } })
    },
    rows: ['progress:default', 'settings:default'],
    expand: `openSettings(); const t = document.querySelector('.panel-title[data-i18n="trope.settings.panel_cloud"]'); t.parentElement.classList.remove('collapsed');`
  },
  {
    file: 'torah_trainer.html', tool: 'TorahTrainer', host: '#cloudSavesPanel',
    seed: {
      hebrewTorahTrainer_settings: JSON.stringify({ parshahKey: 'bereshit', scope: 'parsha-full', layout: 'stacked', showTranslit: true, hebFont: 'Frank Ruhl Libre', hebFontSize: 2.4, vowelColorScheme: 'default', lastPos: { readingKey: 'bereshit', verse: '1:3', ts: 1700000000000 }, panelsCollapsed: { 'torah.settings.panel_copy': true }, karaokeBarCollapsed: false })
    },
    rows: ['settings:default'],
    expand: `openSettingsAtPanel('cloud');`,
    urlKeep: 'parsha=Bereshit&v=1:1'
  }
];

const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !detail ? '' : ' — ' + detail)); }

async function startServer() {
  const srv = spawn('python3', ['-m', 'http.server', '8080', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE + '/index.html', { method: 'HEAD' }); if (r.ok) return srv; } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('http.server did not start');
}

// Opens a page with foreign origins aborted. blockAccount = the control run (no account scripts at all).
async function openPage(browser, file, { seed = {}, serveSdk = false, blockAccount = false, viewport = { width: 1280, height: 900 }, query = '' } = {}) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport });
  await ctx.addInitScript((seed) => { for (const k of Object.keys(seed)) localStorage.setItem(k, seed[k]); }, seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(BASE)) {
      if (blockAccount && ACCOUNT_SCRIPTS.some(s => u.startsWith(BASE + s))) return route.abort();
      return route.continue();
    }
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (serveSdk && SDK_BYTES && u === CFG.sdk) {
      return route.fulfill({ status: 200, body: SDK_BYTES, headers: { 'content-type': 'application/javascript; charset=utf-8', 'access-control-allow-origin': '*' } });
    }
    return route.abort();
  });
  await page.goto(BASE + '/' + file + query, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.readyState !== 'loading', null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
  return { ctx, page, errors };
}
const dump = (page) => page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));

const browser = await chromium.launch();
const srv = await startServer();
try {
  for (const P of PAGES) {
    if (ONLY && P.file !== ONLY) continue;
    const tag = P.file.replace('.html', '');
    // ---- control run: the page as it is without the account layer ----------------------------------
    let control;
    {
      const { ctx, page, errors } = await openPage(browser, P.file, { seed: P.seed, blockAccount: true });
      control = await dump(page);
      check(tag + ' control: 0 pageerrors without the account scripts', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // ---- A. anonymous, CDN blocked -----------------------------------------------------------------
    {
      const { ctx, page, errors } = await openPage(browser, P.file, { seed: P.seed });
      const chip = await page.evaluate(() => {
        const sw = document.querySelector('[data-i18n-switcher]'), chip = document.querySelector('.ivacct');
        return { mounted: !!chip, sameParent: !!chip && !!sw && chip.parentElement === sw.parentElement };
      });
      check(tag + ' A: chip mounted beside the language switcher', chip.mounted && chip.sameParent, JSON.stringify(chip));
      const panel = await page.evaluate((host) => {
        const h = document.querySelector(host), p = h && h.querySelector('.ivsav'), note = p && p.querySelector('.ivsav-note');
        return { host: !!h, panel: !!p, note: note ? note.textContent : '' };
      }, P.host);
      check(tag + ' A: panel shows the sign-in line', panel.panel && /Sign in/.test(panel.note), JSON.stringify(panel));
      const rows = await page.evaluate((tool) => window.IvritSaves.plan(tool).then(p => p.rows.map(r => r.kind + ':' + r.name).sort()), P.tool).catch(e => ['error: ' + e]);
      check(tag + ' A: plan() lists exactly the seeded items', JSON.stringify(rows) === JSON.stringify([...P.rows].sort()), JSON.stringify(rows));
      const after = await dump(page);
      check(tag + ' A: localStorage byte-identical to the control run', after === control, diffKeys(control, after));
      const bad = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('sb-') || k === 'ivritSuite_syncMeta'));
      check(tag + ' A: no sb-* key and no sync memory', bad.length === 0, bad.join(','));
      check(tag + ' A: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // ---- B. remembered session, SDK served, API unreachable ----------------------------------------
    if (SDK_BYTES) {
      const seed = Object.assign({}, P.seed);
      seed[AUTH_KEY] = JSON.stringify({ access_token: 'x', refresh_token: 'y', expires_at: 4102444800, token_type: 'bearer', user: { id: '11111111-1111-4111-8111-111111111111', email: 'teacher@example.org' } });
      seed.ivritSuite_accountCache = JSON.stringify({ email: 'teacher@example.org', name: 'Test Teacher' });
      const { ctx, page, errors } = await openPage(browser, P.file, { seed, serveSdk: true });
      await page.waitForFunction(() => window.IvritAccount && IvritAccount.status() !== 'loading', null, { timeout: 25000 }).catch(() => {});
      await page.waitForFunction((host) => {
        const h = document.querySelector(host), st = h && h.querySelector('.ivsav-status'), note = h && h.querySelector('.ivsav-note');
        return (st && st.classList.contains('is-error') && st.textContent.trim()) || (note && note.textContent.trim());
      }, P.host, { timeout: 25000 }).catch(() => {});
      const st = await page.evaluate((host) => { const h = document.querySelector(host); return { account: IvritAccount.status(), status: (h.querySelector('.ivsav-status') || {}).textContent, note: (h.querySelector('.ivsav-note') || {}).textContent }; }, P.host);
      check(tag + ' B: panel failed soft with the API unreachable', /\S/.test(st.status || '') || /\S/.test(st.note || ''), JSON.stringify(st));
      check(tag + ' B: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    } else { console.log('SKIP ' + tag + ' B: no --sdk file given'); }
    // ---- C. Hebrew + dark at 800px ------------------------------------------------------------------
    {
      const seed = Object.assign({ hebrewBlender_lang: 'he', hebrewBlender_darkMode: '1' }, P.seed);
      const { ctx, page, errors } = await openPage(browser, P.file, { seed, viewport: { width: 800, height: 900 } });
      await page.evaluate(P.expand).catch(e => errors.push('expand: ' + e.message));
      await page.waitForTimeout(300);
      const note = await page.evaluate((host) => { const n = document.querySelector(host + ' .ivsav-note'); return n ? n.textContent : ''; }, P.host);
      check(tag + ' C: Hebrew sign-in line', /[א-ת]/.test(note), note);
      check(tag + ' C: RTL + dark', await page.evaluate(() => document.documentElement.dir === 'rtl' && document.body.classList.contains('dark')));
      await page.screenshot({ path: path.join(SHOTS, tag + '-he-dark-800.png') });
      check(tag + ' C: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // ---- D. URL contract --------------------------------------------------------------------------
    if (P.urlKeep) {
      const { ctx, page, errors } = await openPage(browser, P.file, { seed: P.seed, query: '?' + P.urlKeep + '&error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid' });
      // compared as decoded pairs: the module rebuilds the query with URLSearchParams, which may re-encode a ':'
      const params = await page.evaluate(() => JSON.stringify([...new URLSearchParams(location.search).entries()]));
      check(tag + ' D: keeps its own params and loses the auth-error ones', params === JSON.stringify([...new URLSearchParams(P.urlKeep).entries()]), params);
      check(tag + ' D: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  srv.kill();
}
function diffKeys(a, b) {
  try {
    const A = Object.fromEntries(JSON.parse(a)), B = Object.fromEntries(JSON.parse(b));
    return [...new Set([...Object.keys(A), ...Object.keys(B)])].filter(k => A[k] !== B[k]).map(k => k + ': ' + String(A[k]).slice(0, 60) + ' → ' + String(B[k]).slice(0, 60)).join(' | ');
  } catch (e) { return ''; }
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} checks passed; screenshots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
