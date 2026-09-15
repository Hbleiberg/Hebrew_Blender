#!/usr/bin/env node
/*
 * smoke-sync.mjs — headless end-to-end test of the signed-in sync flow against a FAKE cloud. Playwright
 * serves the pinned SDK from a local file, seeds a remembered session, and answers every request to the
 * project's /rest/v1/saves endpoint from an in-memory table (PostgREST's eq./order/offset/limit/select
 * syntax as far as js/ivrit-saves.js uses it). No real network is used.
 *
 * It replays the second-device story that was reported live ("the schedule didn't come over"): the
 * account holds the laptop's Classroom Dashboard rows — a preset, a saved schedule, a class list, and the
 * settings blob with Schedule Sync on — while this device already holds its own dashboard settings blob
 * (every tool writes one the first time it opens), so that row is "changed in both places".
 *   1. Worksheet Generator page (the page the person signed in on): the account screen lists the row as
 *      changed in both places AND shows the "Settings that differ" block naming the dashboard; Sync
 *      everything downloads everything else and leaves the block; "Use my account's settings" lands the
 *      account's blob here with this device's per-device fields kept, writes the sync memory, and the
 *      dashboard page then opens with Schedule Sync on, the weekly grid live and the row in sync.
 *   2. Dashboard page itself: the same choice repaints the live page (toggle, body, lists) — no reload.
 *   3. "Keep this device's settings": the device's projection (no class lists, no zoom) goes over the
 *      account's row and the row reads Same afterwards.
 *   4. A device with no dashboard blob at all: no block; Sync everything simply downloads the settings.
 *   5. Several classes in the account while this device sits on its untouched "My class": Sync everything
 *      lists them all and the page switches the picker to the first account class and says so (the empty
 *      default stays listed; the account is never patched).
 *   6. Another tab's write while this tab was in the background: on pageshow / visibilitychange the module
 *      re-reads the key without a storage event, the dropdown gains the class and the page adopts it.
 *
 * Run from the repo root:  node scripts/smoke-sync.mjs --sdk path/to/supabase.js [--port 8081]
 * The script starts python3 -m http.server itself (port 8081 by default, so it can run beside the others).
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
const { chromium } = pkg;

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };
const PORT = Number(arg('--port') || 8081);
const BASE = 'http://localhost:' + PORT;
const cfgSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/supabase-config.js'), 'utf8'), cfgSandbox);
const CFG = cfgSandbox.window.IVRIT_SUPABASE;
const AUTH_KEY = 'sb-' + new URL(CFG.url).hostname.split('.')[0] + '-auth-token';
const SDK_FILE = arg('--sdk');
const SDK_BYTES = SDK_FILE && fs.existsSync(SDK_FILE) ? fs.readFileSync(SDK_FILE) : null;
if (!SDK_BYTES) { console.error('smoke-sync: pass --sdk <path to the pinned supabase.js UMD build>'); process.exit(2); }
const SHOTS = process.env.SMOKE_SHOTS || path.join(process.env.TMPDIR || '/tmp', 'smoke-sync');
fs.mkdirSync(SHOTS, { recursive: true });
const SETTLE_MS = 1500;
const UID = '11111111-1111-4111-8111-111111111111';
const SESSION = { access_token: 'x', refresh_token: 'y', expires_at: 4102444800, token_type: 'bearer', user: { id: UID, email: 'teacher@example.org' } };

/* ---------- the fake cloud ---------- */
// The account's rows, answered the way PostgREST would for the queries the module makes: GET (eq.
// filters, order, offset/limit, select), POST (insert; one object back for .single()), PATCH (eq.
// filters, the changed rows back — none when the updated_at guard misses), DELETE. Every call is logged.
class FakeCloud {
  constructor(rows) { this.n = 0; this.log = []; this.rows = rows.map(r => this.fresh(r)); }
  stamp() { return new Date(Date.UTC(2026, 8, 14, 20, 0, 0) + (++this.n) * 1000).toISOString(); }
  fresh(r) { const at = this.stamp(); return Object.assign({ id: crypto.randomUUID(), user_id: UID, created_at: at, updated_at: at, client_updated_at: null, data_hash: null, bytes: JSON.stringify(r.data).length }, r); }
  find(kind, name) { return this.rows.find(r => r.kind === kind && r.name === name); }
  pick(row, select) { if (!select) return row; const out = {}; select.split(',').forEach(k => { k = k.trim(); out[k] = row[k]; }); return out; }
  handle(route) {
    const req = route.request(), url = new URL(req.url()), m = req.method();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
    const json = (status, body) => route.fulfill({ status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, cors), body: JSON.stringify(body) });
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (url.pathname.endsWith('/auth/v1/user')) return json(200, SESSION.user);
    if (url.pathname.endsWith('/auth/v1/token')) return json(200, Object.assign({ expires_in: 3600 }, SESSION));
    if (!url.pathname.endsWith('/rest/v1/saves')) { this.log.push({ m, path: url.pathname, unexpected: true }); return json(404, { message: 'not found' }); }
    const q = url.searchParams;
    const filters = [...q.entries()].filter(([k, v]) => !['select', 'order', 'offset', 'limit'].includes(k) && v.startsWith('eq.')).map(([k, v]) => [k, v.slice(3)]);
    const match = r => filters.every(([k, v]) => String(r[k]) === v);
    const single = /vnd\.pgrst\.object/.test(req.headers().accept || '');
    const entry = { m, search: url.search, body: req.postData() ? JSON.parse(req.postData()) : null, status: 200 };
    this.log.push(entry);
    let rows = this.rows.filter(match);
    if (m === 'GET') {
      const order = (q.get('order') || '').split(',').filter(Boolean).map(s => s.split('.')[0]);
      if (order.length) rows = rows.slice().sort((a, b) => { for (const k of order) { if (a[k] < b[k]) return -1; if (a[k] > b[k]) return 1; } return 0; });
      const off = Number(q.get('offset') || 0);
      rows = rows.slice(off, q.has('limit') ? off + Number(q.get('limit')) : undefined);
    } else if (m === 'POST') {
      const row = this.fresh(entry.body); this.rows.push(row); rows = [row]; entry.status = 201;
    } else if (m === 'PATCH') {
      rows.forEach(r => { Object.assign(r, entry.body); r.updated_at = this.stamp(); r.bytes = JSON.stringify(r.data).length; });
    } else if (m === 'DELETE') {
      this.rows = this.rows.filter(r => !match(r));
    }
    const out = rows.map(r => this.pick(r, q.get('select')));
    if (single) {
      if (out.length !== 1) return json(406, { code: 'PGRST116', details: 'The result contains ' + out.length + ' rows', hint: null, message: 'JSON object requested, multiple (or no) rows returned' });
      return json(entry.status, out[0]);
    }
    return json(entry.status, out);
  }
}

/* ---------- the story's data ---------- */
// The settings blobs are what the dashboard page itself writes (every key, normalized values), captured
// from one plain anonymous load: a second device holds exactly such a blob, and the laptop's row is that
// blob minus the registry's per-device fields. A hand-written subset would make the page's own write-back
// after the sync look like a change — the "Same" readings below test the round trip, not the seed.
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEK = { v: 1, periods: [{ start: '08:00', end: '08:45' }, { start: '08:45', end: '09:30' }], weekend: false, cells: {} };
DAYS.forEach(d => { WEEK.cells[d] = d === 'mon' ? ['Morning', 'Morning'] : d === 'tue' ? ['Morning', null] : [null, null]; });
let DEVICE_SETTINGS = null, ACCOUNT_SETTINGS = null;
const omitted = (field, omit) => omit.some(p => p === field || (p.startsWith('*') && field.endsWith(p.slice(1))) || (p.endsWith('*') && field.startsWith(p.slice(0, -1))));
async function captureDashboardBlob(browser) {
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  await ctx.route('**/*', route => (route.request().url().startsWith(BASE) ? route.continue() : route.abort()));
  const page = await ctx.newPage();
  await page.goto(BASE + '/classroom_dashboard.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.IvritSaves && document.readyState !== 'loading', null, { timeout: 25000 });
  await page.waitForTimeout(SETTLE_MS);
  const out = await page.evaluate(() => {
    saveSettingsToStorage();
    const entry = window.IvritSaves.registry().find(e => e.tool === 'Dashboard' && e.kind === 'settings') || {};
    return { blob: JSON.parse(localStorage.getItem('hebrewDashboard_settings')), omit: entry.omit || [] };
  });
  await ctx.close();
  const base = out.blob;
  DEVICE_SETTINGS = Object.assign({}, base, { location: 'Boston, MA', dashTextHTML: '<div>hi</div>', rosters: { dev1_0: { name: 'My class', names: [] } }, activeRosterId: 'dev1_0', pickerSessions: {}, zoomLevel: 110 });
  const laptop = Object.assign({}, base, { location: 'Atlanta, GA', engDateFmt: 'LONG', dashTextHTML: '<div>Boker tov!</div>', scheduleEnabled: true, scheduleShowCountdown: true, scheduleShowPeriods: true, countdownShowPresetName: true, scheduleWeek: WEEK, presetColors: { Morning: '#aabbcc' } });
  ACCOUNT_SETTINGS = Object.fromEntries(Object.entries(laptop).filter(([k]) => !omitted(k, out.omit)));   // what the laptop's upload projected
  return { keys: Object.keys(base).length, omit: out.omit };
}
const CLOUD_ROWS = () => [
  { tool: 'Dashboard', kind: 'preset', name: 'Morning', data: { headerLang: 'en', showTimer: true } },
  { tool: 'Dashboard', kind: 'presetFolders', name: 'default', data: { v: 1, root: [{ t: 'item', name: 'Morning' }] } },
  { tool: 'Dashboard', kind: 'schedule', name: '2026-2027', data: { v: 2, week: WEEK } },
  { tool: 'Dashboard', kind: 'scheduleFolders', name: 'default', data: { v: 1, root: [{ t: 'item', name: '2026-2027' }] } },
  { tool: 'Dashboard', kind: 'roster', name: 'lap_0', data: { name: 'Kitah Alef', names: ['Noa', 'Eitan'] } },
  { tool: 'Dashboard', kind: 'settings', name: 'default', data: ACCOUNT_SETTINGS }
];
const CLOUD_ROWS_MANY = () => CLOUD_ROWS().filter(r => r.kind !== 'roster').concat([
  { tool: 'Dashboard', kind: 'roster', name: 'lap_0', data: { name: 'Kitah Alef', names: ['Noa', 'Eitan'] } },
  { tool: 'Dashboard', kind: 'roster', name: 'lap_1', data: { name: 'Kitah Bet', names: ['Ari'] } },
  { tool: 'Dashboard', kind: 'roster', name: 'lap_2', data: { name: 'Kitah Gimel', names: ['Lior', 'Tamar'] } }
]);
const SEED = (withDevice) => {
  const s = {};
  s[AUTH_KEY] = JSON.stringify(SESSION);
  s.ivritSuite_accountCache = JSON.stringify({ email: 'teacher@example.org', name: 'Test Teacher' });
  s.ivritSuite_syncMeta = JSON.stringify({ v: 1, users: {}, welcomed: { [UID]: '2026-09-14T00:00:00.000Z' } });   // no welcome screen: the test opens the account screen itself
  if (withDevice) s.hebrewDashboard_settings = JSON.stringify(DEVICE_SETTINGS);
  return s;
};

/* ---------- harness ---------- */
const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !detail ? '' : ' — ' + detail)); }
async function startServer() {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE + '/index.html', { method: 'HEAD' }); if (r.ok) return srv; } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('http.server did not start');
}
// One context per scenario: localStorage seeded once (a second page in the same context keeps what the
// first one synced), the SDK served from the file, the project's origin answered by the fake cloud.
async function openContext(browser, cloud, seed) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((seed) => { if (localStorage.getItem('__smoke_seeded')) return; for (const k of Object.keys(seed)) localStorage.setItem(k, seed[k]); localStorage.setItem('__smoke_seeded', '1'); }, seed);
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (u === CFG.sdk) return route.fulfill({ status: 200, body: SDK_BYTES, headers: { 'content-type': 'application/javascript; charset=utf-8', 'access-control-allow-origin': '*' } });
    if (u.startsWith(CFG.url)) return cloud.handle(route);
    return route.abort();
  });
  return ctx;
}
async function openPage(ctx, file) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.goto(BASE + '/' + file, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.IvritAccount && window.IvritSaves && IvritAccount.status() === 'signed-in', null, { timeout: 25000 });
  await page.waitForTimeout(SETTLE_MS);
  return { page, errors };
}
const BUSY = 'Checking|Syncing|Updating|Uploading|Preparing';
async function openAccount(page) {
  await page.evaluate(() => window.IvritSaves.openAccount());
  await page.waitForFunction((busy) => { const o = document.querySelector('.ivsav-overlay'); const s = o && o.querySelector('.ivsav-status'); return !!(o && o.querySelector('.ivsav-acct-list li') && s && !new RegExp(busy).test(s.textContent)); }, BUSY, { timeout: 30000 });
}
async function clickAndWait(page, act, doneRe) {
  await page.click('.ivsav-overlay .ivsav-btn[data-act="' + act + '"]');
  await page.waitForFunction((re) => { const s = document.querySelector('.ivsav-overlay .ivsav-status'); return !!s && new RegExp(re).test(s.textContent); }, doneRe, { timeout: 60000 });
}
const screen = (page) => page.evaluate(() => {
  const o = document.querySelector('.ivsav-overlay');
  const sec = o.querySelector('.ivsav-acct-settings'), other = o.querySelector('.ivsav-acct-other');
  return {
    lines: [...o.querySelectorAll('.ivsav-acct-list li')].map(l => l.textContent),
    block: !!sec && !sec.hidden, note: sec ? sec.querySelector('.ivsav-acct-settings-note').textContent : '',
    otherHint: !!other && !other.hidden, status: o.querySelector('.ivsav-status').textContent,
    sync: (() => { const b = o.querySelector('[data-act="sync"]'); return b && !b.hidden && b.getAttribute('aria-disabled') !== 'true'; })()
  };
});
const dashState = (page) => page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings') || 'null');
  const meta = JSON.parse(localStorage.getItem('ivritSuite_syncMeta') || '{}');
  const mem = (((meta.users || {})['11111111-1111-4111-8111-111111111111'] || {}).Dashboard || {}).settings;
  const rmem = (((meta.users || {})['11111111-1111-4111-8111-111111111111'] || {}).Dashboard || {}).roster || {};
  return {
    rosterMemory: Object.keys(rmem).sort(),
    enabled: s && s.scheduleEnabled, periods: s && s.scheduleWeek ? s.scheduleWeek.periods.length : 0, mon: s && s.scheduleWeek ? s.scheduleWeek.cells.mon[0] : null,
    color: s && s.presetColors && s.presetColors.Morning, location: s && s.location, rosters: s ? Object.keys(s.rosters || {}).sort() : [], active: s && s.activeRosterId, zoom: s && s.zoomLevel,
    presets: Object.keys(JSON.parse(localStorage.getItem('hebrewDashboard_presets') || '{}')), schedules: Object.keys(JSON.parse(localStorage.getItem('hebrewDashboard_schedules') || '{}')),
    memory: mem && mem.default && typeof mem.default.h === 'string' && mem.default.h.indexOf('1.') === 0
  };
});
const planStates = (page) => page.evaluate(() => window.IvritSaves.plan('Dashboard').then(p => Object.fromEntries(p.rows.map(r => [r.kind + ':' + r.name, r.state]))));
const liveDash = (page) => page.evaluate(() => ({
  checked: document.getElementById('scheduleEnabled').checked,
  bodyShown: document.getElementById('scheduleSyncBody').style.display !== 'none',
  schedules: (document.getElementById('savedScheduleList') || {}).textContent || '',
  presets: (document.getElementById('presetsPanel') || {}).textContent || ''
}));
// The student picker as the page shows it: the drawer's class list, the chips, the note under the class
// row (only while shown) and the last toast text.
const pickerState = (page) => page.evaluate(() => {
  const sel = document.getElementById('pickerClassSel'), note = document.getElementById('pickerClassNote');
  return {
    value: sel ? sel.value : null,
    options: sel ? [...sel.options].map(o => o.textContent) : [],
    chips: (document.getElementById('pickerChips') || {}).textContent || '',
    note: note && note.style.display !== 'none' ? note.textContent : '',
    toast: (document.getElementById('appToast') || {}).textContent || ''
  };
});

const browser = await chromium.launch();
const srv = await startServer();
try {
  const cap = await captureDashboardBlob(browser);
  check('0: captured the dashboard\'s own settings blob and the registry\'s per-device fields', cap.keys > 40 && cap.omit.includes('rosters') && cap.omit.includes('zoomLevel') && !('rosters' in ACCOUNT_SETTINGS) && ACCOUNT_SETTINGS.scheduleEnabled === true, JSON.stringify(cap));
  // ---- 1. the reported flow: signed in on the generator page, the dashboard rows come from the account ----
  {
    const cloud = new FakeCloud(CLOUD_ROWS());
    const ctx = await openContext(browser, cloud, SEED(true));
    const { page, errors } = await openPage(ctx, 'hebrew_blend_generator.html');
    await openAccount(page);
    let s = await screen(page);
    check('1: the account screen lists the dashboard settings as changed in both places', s.lines.some(l => /Classroom Dashboard/.test(l) && /1 changed in both places/.test(l)), JSON.stringify(s.lines));
    check('1: the Settings that differ block is shown and names the dashboard', s.block && /Classroom Dashboard/.test(s.note) && !s.otherHint, JSON.stringify(s));
    await page.screenshot({ path: path.join(SHOTS, '1-block-before-sync.png') });
    await clickAndWait(page, 'sync', 'Sync finished');
    s = await screen(page);
    let d = await dashState(page);
    check('1: Sync everything brought the preset, schedule and class list and left the settings alone', d.presets.includes('Morning') && d.schedules.includes('2026-2027') && JSON.stringify(d.rosters) === '["dev1_0","lap_0"]' && d.enabled === false && d.periods === 0, JSON.stringify(d));
    check('1: after Sync everything the block is still there and the status says 1 still needs a choice', s.block && /1 still need a choice/.test(s.status), JSON.stringify(s));
    await clickAndWait(page, 'use-account', 'now on this device');
    s = await screen(page);
    d = await dashState(page);
    check("1: Use my account's settings landed the schedule here and kept this device's own fields", d.enabled === true && d.periods === 2 && d.mon === 'Morning' && d.color === '#aabbcc' && d.location === 'Atlanta, GA' && JSON.stringify(d.rosters) === '["dev1_0","lap_0"]' && d.active === 'dev1_0' && d.zoom === 110, JSON.stringify(d));
    check('1: the sync memory remembers the settings row and the block is gone', d.memory && !s.block && s.lines.some(l => /Classroom Dashboard: everything is in your account/.test(l)), JSON.stringify({ memory: d.memory, block: s.block, lines: s.lines }));
    await page.screenshot({ path: path.join(SHOTS, '1-after-use-account.png') });
    const patched = cloud.log.filter(e => e.m === 'PATCH').length;
    check('1: nothing was pushed over the account copy (its fields were a superset of this device\'s)', patched === 0, 'PATCH calls: ' + patched);
    check('1: 0 pageerrors on the generator page', errors.length === 0, errors.join(' | '));
    // now the dashboard itself, in the same browser
    const second = await openPage(ctx, 'classroom_dashboard.html');
    const live = await liveDash(second.page);
    const states = await planStates(second.page);
    const d2 = await dashState(second.page);
    const pk = await pickerState(second.page);
    check("1: the dashboard adopted the account's class at load and kept the empty default listed", d2.active === 'lap_0' && pk.value === 'lap_0' && pk.options.some(o => /Kitah Alef \(2\)/.test(o)) && pk.options.some(o => /My class \(0\)/.test(o)) && /Noa/.test(pk.chips) && /Now showing Kitah Alef/.test(pk.note), JSON.stringify({ active: d2.active, pk }));
    check('1: the dashboard opens with Schedule Sync on and its body shown', live.checked && live.bodyShown, JSON.stringify(live));
    check('1: the dashboard lists the downloaded schedule and preset', /2026-2027/.test(live.schedules) && /Morning/.test(live.presets), JSON.stringify({ schedules: live.schedules.slice(0, 80), presets: live.presets.slice(0, 120) }));
    check('1: every dashboard row reads Same after the page wrote its own blob back', Object.values(states).every(v => v === 'synced'), JSON.stringify(states));
    await second.page.screenshot({ path: path.join(SHOTS, '1-dashboard-after.png') });
    check('1: 0 pageerrors on the dashboard page', second.errors.length === 0, second.errors.join(' | '));
    await ctx.close();
  }
  // ---- 2. the same choice made on the dashboard page repaints it live ------------------------------
  {
    const cloud = new FakeCloud(CLOUD_ROWS());
    const ctx = await openContext(browser, cloud, SEED(true));
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    await openAccount(page);
    let s = await screen(page);
    check('2: the block is shown on the dashboard page too', s.block && /Classroom Dashboard/.test(s.note), JSON.stringify(s));
    await clickAndWait(page, 'sync', 'Sync finished');
    await clickAndWait(page, 'use-account', 'now on this device');
    const live = await liveDash(page);
    const d = await dashState(page);
    const states = await planStates(page);
    const pk = await pickerState(page);
    check('2: the live page now shows Schedule Sync on, its body, the schedule and the preset — no reload', live.checked && live.bodyShown && /2026-2027/.test(live.schedules) && /Morning/.test(live.presets), JSON.stringify(live));
    check('2: the roster download switched the picker to the account class with the note and toast', d.active === 'lap_0' && pk.value === 'lap_0' && /Noa/.test(pk.chips) && /Now showing Kitah Alef/.test(pk.note) && /Now showing Kitah Alef/.test(pk.toast), JSON.stringify({ active: d.active, pk }));
    check('2: storage carries the weekly grid and the memory; every row reads Same', d.enabled === true && d.periods === 2 && d.memory && Object.values(states).every(v => v === 'synced'), JSON.stringify({ d, states }));
    await page.screenshot({ path: path.join(SHOTS, '2-dashboard-live.png') });
    check('2: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 3. keeping this device's settings pushes the device's projection over the account's row ------
  {
    const cloud = new FakeCloud(CLOUD_ROWS());
    const before = cloud.find('settings', 'default').updated_at;
    const ctx = await openContext(browser, cloud, SEED(true));
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    await openAccount(page);
    await clickAndWait(page, 'keep-device', 'now in your account');
    const row = cloud.find('settings', 'default');
    const s = await screen(page);
    const states = await planStates(page);
    const live = await liveDash(page);
    check("3: the account's settings row now holds this device's projection (no class lists, no zoom)", row.data.scheduleEnabled === false && row.data.location === 'Boston, MA' && !('rosters' in row.data) && !('zoomLevel' in row.data) && !('activeRosterId' in row.data) && row.updated_at !== before && typeof row.data_hash === 'string', JSON.stringify({ keys: Object.keys(row.data), updated: row.updated_at !== before }));
    check('3: the block is gone, the row reads Same and Schedule Sync stays off here', !s.block && states['settings:default'] === 'synced' && !live.checked, JSON.stringify({ block: s.block, states, checked: live.checked }));
    check('3: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 4. a device without a dashboard blob: no block, the settings simply download -----------------
  {
    const cloud = new FakeCloud(CLOUD_ROWS());
    const ctx = await openContext(browser, cloud, SEED(false));
    const { page, errors } = await openPage(ctx, 'hebrew_blend_generator.html');
    await openAccount(page);
    let s = await screen(page);
    check('4: no block when nothing differs (the settings are only in the account)', !s.block && s.lines.some(l => /Classroom Dashboard/.test(l) && /only in your account/.test(l)), JSON.stringify(s));
    await clickAndWait(page, 'sync', 'Sync finished');
    s = await screen(page);
    const d = await dashState(page);
    check('4: Sync everything downloaded the settings with the schedule; still no block', !s.block && d.enabled === true && d.periods === 2 && d.memory && /0 still need a choice/.test(s.status), JSON.stringify({ d, status: s.status }));
    check('4: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 5. several classes in the account, this device on its untouched default: the picker switches ----
  {
    const cloud = new FakeCloud(CLOUD_ROWS_MANY());
    const ctx = await openContext(browser, cloud, SEED(true));
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    const before = await pickerState(page);
    await openAccount(page);
    await clickAndWait(page, 'sync', 'Sync finished');
    const pk = await pickerState(page);
    const d = await dashState(page);
    check('5: before the sync the picker sat on the empty default with no note', before.value === 'dev1_0' && before.options.length === 1 && before.note === '', JSON.stringify(before));
    check('5: Sync everything listed all three account classes and kept the default', pk.options.length === 4 && ['Kitah Alef (2)', 'Kitah Bet (1)', 'Kitah Gimel (2)', 'My class (0)'].every(n => pk.options.includes(n)), JSON.stringify(pk.options));
    check('5: the picker switched to the first account class — chips, note and toast', pk.value === 'lap_0' && d.active === 'lap_0' && /Noa/.test(pk.chips) && /Eitan/.test(pk.chips) && /Now showing Kitah Alef/.test(pk.note) && /Now showing Kitah Alef/.test(pk.toast), JSON.stringify({ value: pk.value, chips: pk.chips, note: pk.note, toast: pk.toast }));
    check('5: the sync memory holds every class; nothing was patched or deleted in the account', JSON.stringify(d.rosterMemory) === '["dev1_0","lap_0","lap_1","lap_2"]' && cloud.log.filter(e => e.m === 'PATCH' || e.m === 'DELETE').length === 0, JSON.stringify({ mem: d.rosterMemory, calls: cloud.log.map(e => e.m) }));
    await page.screenshot({ path: path.join(SHOTS, '5-picker-adopted.png') });
    check('5: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 6. another tab's write while this tab was hidden: the resume-time re-read ---------------------
  {
    const cloud = new FakeCloud(CLOUD_ROWS());
    const ctx = await openContext(browser, cloud, SEED(true));
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    // What another tab's download leaves behind — the class in the blob and the stamps in the sync memory
    // — written from this same tab, so no storage event fires; then the resume signal.
    const simulate = (id, name, names, how) => page.evaluate(([id, name, names, how]) => {
      const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings'));
      s.rosters[id] = { name, names };
      localStorage.setItem('hebrewDashboard_settings', JSON.stringify(s));
      const meta = JSON.parse(localStorage.getItem('ivritSuite_syncMeta') || '{"v":1,"users":{}}');
      const at = Date.now() + (how === 'pageshow' ? 1 : 2);
      meta.lastWrite = { tool: 'Dashboard', kind: 'roster', name: id, at };
      meta.written = meta.written || {}; meta.written.Dashboard = meta.written.Dashboard || {}; meta.written.Dashboard.roster = at;
      localStorage.setItem('ivritSuite_syncMeta', JSON.stringify(meta));
      const sel = document.getElementById('pickerClassSel');
      const beforeCount = sel.options.length;
      if (how === 'pageshow') window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      else { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); }
      return { beforeCount, options: [...sel.options].map(o => o.textContent), value: sel.value, quiet: window.IvritSaves._test.recheckWrites() === false };
    }, [id, name, names, how]);
    const r1 = await simulate('tab2_0', 'Kitah Dalet', ['Lior'], 'pageshow');
    check('6: on pageshow the page re-read the blob another tab wrote and adopted the class', r1.beforeCount === 1 && r1.options.includes('Kitah Dalet (1)') && r1.value === 'tab2_0' && r1.quiet, JSON.stringify(r1));
    const r2 = await simulate('tab2_1', 'Kitah Hei', ['Maya', 'Yoav'], 'visibilitychange');
    check('6: on visibilitychange the dropdown gained the next class and the pointer stayed on the adopted one', r2.options.includes('Kitah Hei (2)') && r2.value === 'tab2_0' && r2.quiet, JSON.stringify(r2));
    await page.waitForTimeout(SETTLE_MS);
    check('6: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.kill();
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} checks passed; screenshots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
