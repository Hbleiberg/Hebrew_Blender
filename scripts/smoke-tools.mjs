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
 * panel renders into; `prepare` (optional) runs in the page right after load, before any check, when the
 * host only exists on demand (the dictionary's Word Lists manager); `expand` runs in the page to make the
 * host visible for the screenshot; `urlKeep` (optional) is a query string the page must keep after the
 * auth-error params are stripped; `tools` (the hub) lists several {tool, rows} pairs and `panels` the
 * number of panels the host must hold.
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
  },
  {
    file: 'flash_cards.html', tool: 'FlashCards', host: '#cloudSavesPanel',
    seed: {
      hebrewFlashCards_presets: JSON.stringify({ 'Deck A': { settings: { mode: 2, cardCount: 12 }, order: 1700000000000 }, 'Deck B': { settings: { mode: 1, cardCount: 8 }, order: 1700000001000 } }),
      hebrewFlashCards_presetsFolders: JSON.stringify({ v: 1, root: [{ t: 'folder', id: 'f1', name: 'Week 1', children: [{ t: 'item', name: 'Deck A' }] }, { t: 'item', name: 'Deck B' }] }),
      hebrewFlashCards_settings: JSON.stringify({ mode: 2, cardCount: 20, selectedLetters: ['א', 'ב'], selectedVowels: ['kamatz'] }),
      hebrewFlashCards_pbStreak: '4',
      hebrewFlashCards_profiles: JSON.stringify({ activeProfile: 'Sarah', profiles: { Sarah: { created: 1700000000000, order: 1700000000000, results: [{ savedAt: '2026-09-01T10:00:00.000Z', pct: 90, correct: 9, total: 10, timeSec: 40, timerMode: 'off', settings: {}, cards: [] }], ladder: { levels: { l1: { bestPct: 90, passedAt: '2026-09-01T10:00:00.000Z' } } } }, Dan: { created: 1700000000000, order: 1700000000001, results: [] } } }),
      hebrewFlashCards_profilesFolders: JSON.stringify({ v: 1, root: [{ t: 'item', name: 'Sarah' }, { t: 'item', name: 'Dan' }] })
    },
    rows: ['preset:Deck A', 'preset:Deck B', 'settings:default', 'pbStreak:default', 'profile:Sarah', 'profile:Dan'],
    expand: `const p = document.getElementById('panelAdvanced'); if (p.classList.contains('collapsed')) p.querySelector('.panel-title').click(); document.querySelector('.adv-subhead[data-i18n="flashcards.advanced.cloud_head"]').scrollIntoView();`,
    urlKeep: 's=abc'
  },
  {
    file: 'hebrew_blend_generator.html', tool: 'Worksheet', host: '#cloudSavesPanel',
    seed: {
      hebrewBlender_presets: JSON.stringify({ 'Week 1': { selectedLetters: ['א', 'ב'], selectedVowels: ['kamatz'], pageSize: 'letter' }, 'Review': { selectedLetters: ['ג'], selectedVowels: ['patach'] } }),
      hebrewBlender_presetsFolders: JSON.stringify({ v: 1, root: [{ t: 'folder', id: 'f1', name: 'Fall', children: [{ t: 'item', name: 'Week 1' }] }, { t: 'item', name: 'Review' }] }),
      hebrewBlender_lastState: JSON.stringify({ selectedLetters: ['א', 'ב', 'ג'], selectedVowels: ['kamatz', 'patach'], headerLang: 'en' })
    },
    rows: ['preset:Week 1', 'preset:Review', 'lastState:default'],
    expand: `const adv = document.getElementById('panelAdvanced'); if (adv.classList.contains('collapsed')) adv.querySelector(':scope > .panel-title').click(); const t = document.querySelector('.panel-title[data-i18n="worksheet.advanced.cloud_title"]'); if (t.parentElement.classList.contains('collapsed')) t.click(); t.scrollIntoView();`,
    urlKeep: 's=abc'
  },
  {
    file: 'hebrew_dictionary.html', tool: 'Dictionary', host: '#wlCloudPanel',
    seed: {
      ivritSuite_wordLists: JSON.stringify({ v: 1, lists: {
        m1abc_x1y2z: { name: 'Week 3 words', created: 1700000000000, updated: 1700000100000, words: [{ word: 'שָׁלוֹם', translation: 'peace', translit: 'shalom', pos: 'noun', era: 'bib' }] },
        m1abd_q9w8e: { name: 'Colors', created: 1700000200000, updated: 1700000300000, words: [{ word: 'אָדֹם', translation: 'red', translit: 'adom', pos: 'adj', era: 'mod' }, { word: 'כָּחֹל', translation: 'blue', translit: 'kachol', pos: 'adj', era: 'mod' }] }
      } })
    },
    rows: ['wordList:m1abc_x1y2z', 'wordList:m1abd_q9w8e'],
    prepare: `wlOpenManager();`,
    expand: `wlOpenManager();`,
    urlKeep: 'wordlists=open'
  },
  {
    file: 'classroom_dashboard.html', tool: 'Dashboard', host: '#cloudSavesPanel',
    seed: {
      hebrewDashboard_settings: JSON.stringify({ location: 'Atlanta, GA', engDateFmt: 'LONG', hebFont: 'Frank Ruhl Libre', dashTextHTML: '<p>Boker tov!</p>', presetColors: { Morning: '#aabbcc' },
        rosters: { m1r_0: { name: 'Kitah Alef', names: ['Noa', 'Eitan', 'Maya'] }, m1r_1: { name: 'Kitah Bet', names: ['Ari'] } }, activeRosterId: 'm1r_0', pickerSessions: { m1r_0: { picked: ['Noa'], absent: [] } },
        zoomLevel: 1.2, hideZoomBar: true, panelsCollapsed: { 'dashboard.settings.panel_weather': true }, videoCollapsed: true, keepAwake: false, _geoCoords: { lat: 33.7, lon: -84.4 } }),
      hebrewDashboard_presets: JSON.stringify({ Morning: { headerLang: 'en', showTimer: true }, Tefillah: { headerLang: 'he', showTimer: false } }),
      hebrewDashboard_presetsFolders: JSON.stringify({ v: 1, root: [{ t: 'item', name: 'Morning' }, { t: 'item', name: 'Tefillah' }] }),
      hebrewDashboard_schedules: JSON.stringify({ 'Week A': { v: 2, week: { v: 1, periods: [{ start: '08:00', end: '08:45' }], weekend: false, cells: { mon: ['Morning'] } } }, 'Old day': [{ preset: 'Morning', until: '09:00' }] }),
      hebrewDashboard_schedulesFolders: JSON.stringify({ v: 1, root: [{ t: 'item', name: 'Week A' }, { t: 'item', name: 'Old day' }] })
    },
    rows: ['preset:Morning', 'preset:Tefillah', 'schedule:Week A', 'schedule:Old day', 'settings:default', 'roster:m1r_0', 'roster:m1r_1'],
    expand: `openSettings(); const p = document.getElementById('presetsPanel'); if (p.classList.contains('collapsed')) p.querySelector('.panel-title').click(); document.getElementById('cloudSavesPanel').scrollIntoView();`,
    urlKeep: 'lang=en'
  }
];
// The hub carries one panel per tool: its seed is every tool's seed, its rows every tool's rows.
PAGES.push({
  file: 'index.html', host: '#cloudSavesSection', panels: 6,
  seed: Object.assign({}, ...PAGES.map(p => p.seed)),
  tools: PAGES.map(p => ({ tool: p.tool, rows: p.rows })),
  prepare: `openIEModal();`,
  expand: `openIEModal(); document.querySelectorAll('#cloudSavesSection details').forEach(d => { d.open = true; }); document.getElementById('cloudSavesSection').scrollIntoView();`
});

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
async function openPage(browser, file, { seed = {}, serveSdk = false, blockAccount = false, viewport = { width: 1280, height: 900 }, query = '', prepare = null } = {}) {
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
  if (prepare) { await page.evaluate(prepare).catch(e => errors.push('prepare: ' + e.message)); await page.waitForTimeout(300); }
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
      const { ctx, page, errors } = await openPage(browser, P.file, { seed: P.seed, blockAccount: true, prepare: P.prepare });
      control = await dump(page);
      check(tag + ' control: 0 pageerrors without the account scripts', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // ---- A. anonymous, CDN blocked -----------------------------------------------------------------
    {
      const { ctx, page, errors } = await openPage(browser, P.file, { seed: P.seed, prepare: P.prepare });
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
      if (P.panels) {
        const n = await page.evaluate((host) => document.querySelectorAll(host + ' .ivsav').length, P.host);
        check(tag + ' A: ' + P.panels + ' panels mounted', n === P.panels, String(n));
      }
      for (const T of (P.tools || [{ tool: P.tool, rows: P.rows }])) {
        const rows = await page.evaluate((tool) => window.IvritSaves.plan(tool).then(p => p.rows.map(r => r.kind + ':' + r.name).sort()), T.tool).catch(e => ['error: ' + e]);
        check(tag + ' A: plan(' + T.tool + ') lists exactly the seeded items', JSON.stringify(rows) === JSON.stringify([...T.rows].sort()), JSON.stringify(rows));
      }
      const after = await dump(page);
      check(tag + ' A: localStorage byte-identical to the control run', after === control, diffKeys(control, after));
      const bad = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('sb-') || k === 'ivritSuite_syncMeta'));
      check(tag + ' A: no sb-* key and no sync memory', bad.length === 0, bad.join(','));
      const acct = await page.evaluate(() => {
        const before = !!document.querySelector('.ivsav-overlay');
        window.IvritSaves.openAccount();
        const card = document.querySelector('.ivsav-overlay .ivsav-card');
        const opened = !!card && /Sign in/.test(card.textContent) && document.activeElement === card;
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return { before, opened, closed: !document.querySelector('.ivsav-overlay') };
      });
      check(tag + ' A: no account screen by itself; openAccount() shows the signed-out card and Escape closes it', !acct.before && acct.opened && acct.closed, JSON.stringify(acct));
      check(tag + ' A: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // ---- B. remembered session, SDK served, API unreachable ----------------------------------------
    if (SDK_BYTES) {
      const seed = Object.assign({}, P.seed);
      seed[AUTH_KEY] = JSON.stringify({ access_token: 'x', refresh_token: 'y', expires_at: 4102444800, token_type: 'bearer', user: { id: '11111111-1111-4111-8111-111111111111', email: 'teacher@example.org' } });
      seed.ivritSuite_accountCache = JSON.stringify({ email: 'teacher@example.org', name: 'Test Teacher' });
      const { ctx, page, errors } = await openPage(browser, P.file, { seed, serveSdk: true, prepare: P.prepare });
      await page.waitForFunction(() => window.IvritAccount && IvritAccount.status() !== 'loading', null, { timeout: 25000 }).catch(() => {});
      await page.waitForFunction((host) => {
        const h = document.querySelector(host), st = h && h.querySelector('.ivsav-status'), note = h && h.querySelector('.ivsav-note');
        return (st && st.classList.contains('is-error') && st.textContent.trim()) || (note && note.textContent.trim());
      }, P.host, { timeout: 25000 }).catch(() => {});
      const st = await page.evaluate((host) => { const h = document.querySelector(host); return { account: IvritAccount.status(), status: (h.querySelector('.ivsav-status') || {}).textContent, note: (h.querySelector('.ivsav-note') || {}).textContent }; }, P.host);
      check(tag + ' B: panel failed soft with the API unreachable', /\S/.test(st.status || '') || /\S/.test(st.note || ''), JSON.stringify(st));
      // The welcome screen opens once for a remembered session on a device with items; here its listing fails soft.
      await page.waitForFunction(() => { const s = document.querySelector('.ivsav-overlay .ivsav-status'); return s && s.classList.contains('is-error') && s.textContent.trim(); }, null, { timeout: 25000 }).catch(() => {});
      await page.screenshot({ path: path.join(SHOTS, tag + '-welcome-1280.png') });
      const wel = await page.evaluate(() => {
        const o = document.querySelector('.ivsav-overlay'), st = o && o.querySelector('.ivsav-status');
        const welcomed = (() => { try { return !!JSON.parse(localStorage.getItem('ivritSuite_syncMeta')).welcomed['11111111-1111-4111-8111-111111111111']; } catch (e) { return false; } })();
        const title = o && o.querySelector('.ivsav-card-title');
        // a remembered session is 'restored', so the screen is the once-per-device welcome, not the sign-in splash
        const info = { opened: !!o, error: !!(st && st.classList.contains('is-error') && st.textContent.trim()), welcomed, source: IvritAccount.sessionSource(), welcomeTitle: !!title && /Welcome/.test(title.textContent) };
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        info.closed = !document.querySelector('.ivsav-overlay');
        return info;
      });
      check(tag + ' B: the welcome screen opened once (restored session, welcome title), failed soft, is remembered and closes on Escape', wel.opened && wel.error && wel.welcomed && wel.closed && wel.source === 'restored' && wel.welcomeTitle, JSON.stringify(wel));
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
