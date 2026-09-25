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
 *   5. Several classes in the account while this device sits on its untouched "My class" (a seed, never
 *      uploaded by itself): Sync everything
 *      lists them all and the page switches the picker to the first account class and says so (the empty
 *      default stays listed; the account is never patched).
 *   6. Another tab's write while this tab was in the background: on pageshow / visibilitychange the module
 *      re-reads the key without a storage event, the dropdown gains the class and the page adopts it.
 *   7. A download the page re-applies differently (a 3-digit colour the dashboard drops): the module puts
 *      the page's form in the account (one PATCH) and the row reads Same — never "Same" over two versions.
 *   8. Row-scoped trouble (a preset too big to upload, a malformed cloud row) is skipped and named while
 *      Sync everything goes on to the dashboard; a dead connection stops the run and names the tools it
 *      never reached.
 *   9. Folder trees converge: an item filed in the account's tree beats the same item unfiled here; a
 *      folder move made here is offered by the Sync buttons on its own and goes up; a device that synced
 *      the earlier layout and did not touch it takes the moved one and pushes nothing back.
 *  10. A preset and a class deleted on this device after a sync read "Deleted on this device": Sync
 *      everything brings neither back; "Delete from your account too" removes the row and its memory;
 *      "Bring it back" restores the other one.
 *  11. "Delete from cloud" on a synced row leaves the local copy reading "Removed from your account":
 *      Sync uploads nothing; a local edit makes it a normal local-only row that uploads.
 *  12. A preset names its class: loading it picks the class with that name on this device; an unknown
 *      name or an older preset's foreign id keeps the current class; a snapshot saved here carries the name.
 *  13. A same-named class this device made and never synced folds into the one that lands from the
 *      account: one class with both names, the pointer on it, one PATCH, nothing posted or deleted.
 *  14. A weekly grid removed on another device is removed here too when the settings arrive (a merge
 *      could never delete it), and nothing puts it back.
 *  15. The suite-wide preferences row (IvritSuite / prefs): (a) on a device with none of its own the row
 *      downloads and the page turns Hebrew and dark without a reload, the finish line naming what shows
 *      after one; (b) a device with preferences of its own gets the Settings that differ block, "Use my
 *      account's settings" lands the keys live and sends the union up, a field this build cannot apply
 *      is held (reported as the row's value) until that key changes here.
 *  16. On the hub, a word list changed in both places counts as "to merge inside" the Dictionary and its
 *      panel row carries a signpost linking there; closing the account screen right after Sync everything
 *      does not stop the run (the dashboard rows still land); an untouched empty default class is a seed
 *      that is never uploaded by itself.
 *  17. A font a teacher made travels: a device with none takes it from the account and its picker shows it
 *      at once; a device already holding the ten My Fonts allows refuses the eleventh by name rather than
 *      evicting one of theirs, and the account keeps it.
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
const ONLY = process.env.SMOKE_ONLY ? process.env.SMOKE_ONLY.split(',').map(Number) : null;   // e.g. SMOKE_ONLY=10,11 — the capture (0) always runs
const want = (...ns) => !ONLY || ns.some(n => ONLY.includes(n));
const UID = '11111111-1111-4111-8111-111111111111';
const SESSION = { access_token: 'x', refresh_token: 'y', expires_at: 4102444800, token_type: 'bearer', user: { id: UID, email: 'teacher@example.org' } };

/* ---------- the fake cloud ---------- */
// The account's rows, answered the way PostgREST would for the queries the module makes: GET (eq.
// filters, order, offset/limit, select), POST (insert; one object back for .single()), PATCH (eq.
// filters, the changed rows back — none when the updated_at guard misses), DELETE. Every call is logged.
class FakeCloud {
  constructor(rows) { this.n = 0; this.log = []; this.rows = rows.map(r => this.fresh(r)); this.abortWhen = null; }   // abortWhen(url, method) → true = the connection dies
  stamp() { return new Date(Date.UTC(2026, 8, 14, 20, 0, 0) + (++this.n) * 1000).toISOString(); }
  fresh(r) { const at = this.stamp(); return Object.assign({ id: crypto.randomUUID(), user_id: UID, created_at: at, updated_at: at, client_updated_at: null, data_hash: null, bytes: JSON.stringify(r.data).length }, r); }
  find(kind, name) { return this.rows.find(r => r.kind === kind && r.name === name); }
  pick(row, select) { if (!select) return row; const out = {}; select.split(',').forEach(k => { k = k.trim(); out[k] = row[k]; }); return out; }
  handle(route) {
    const req = route.request(), url = new URL(req.url()), m = req.method();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
    const json = (status, body) => route.fulfill({ status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, cors), body: JSON.stringify(body) });
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (this.abortWhen && this.abortWhen(url, m)) { this.log.push({ m, search: url.search, aborted: true }); return route.abort('failed'); }
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
  if (process.env.SMOKE_DEBUG) page.on('console', m => console.log('    [page]', m.type(), m.text().slice(0, 300)));
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
// A row's state; an untouched empty default class (a seed the module never uploads by itself) reads 'seed'.
const planStates = (page) => page.evaluate(() => window.IvritSaves.plan('Dashboard').then(p => Object.fromEntries(p.rows.map(r => [r.kind + ':' + r.name, r.seed && r.state === 'local-only' ? 'seed' : r.state]))));
const allSame = (states) => Object.values(states).every(v => v === 'synced' || v === 'seed');
const patchesOn = (cl, id) => cl.log.filter(e => e.m === 'PATCH' && (new URLSearchParams(e.search).get('id') || '') === 'eq.' + id).length;
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
  if (want(1)) {
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
    check('1: every dashboard row reads Same after the page wrote its own blob back (the empty default class is a seed)', allSame(states) && states['roster:dev1_0'] === 'seed', JSON.stringify(states));
    await second.page.screenshot({ path: path.join(SHOTS, '1-dashboard-after.png') });
    check('1: 0 pageerrors on the dashboard page', second.errors.length === 0, second.errors.join(' | '));
    await ctx.close();
  }
  // ---- 2. the same choice made on the dashboard page repaints it live ------------------------------
  if (want(2)) {
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
    check('2: storage carries the weekly grid and the memory; every row reads Same', d.enabled === true && d.periods === 2 && d.memory && allSame(states), JSON.stringify({ d, states }));
    await page.screenshot({ path: path.join(SHOTS, '2-dashboard-live.png') });
    check('2: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 3. keeping this device's settings pushes the device's projection over the account's row ------
  if (want(3)) {
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
  if (want(4)) {
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
  if (want(5)) {
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
    // The one PATCH allowed is the folder tree: the page's own render added its seeded preset to the tree it
    // had just taken from the account, and the tail put that form back (both sides then hold it — convergence).
    const patchedKinds = cloud.log.filter(e => e.m === 'PATCH').map(e => { const id = (new URLSearchParams(e.search).get('id') || '').slice(3); const r = cloud.rows.find(r => r.id === id); return r ? r.kind : '?'; });
    const rosterPosts5 = cloud.log.filter(e => e.m === 'POST' && e.body && e.body.kind === 'roster').length;
    check('5: the sync memory holds every account class; the untouched empty default was not uploaded (a seed); no class, preset, schedule or settings row was patched or deleted', JSON.stringify(d.rosterMemory) === '["lap_0","lap_1","lap_2"]' && rosterPosts5 === 0 && cloud.log.filter(e => e.m === 'DELETE').length === 0 && patchedKinds.every(k => k === 'presetFolders' || k === 'scheduleFolders'), JSON.stringify({ mem: d.rosterMemory, rosterPosts5, patchedKinds, calls: cloud.log.map(e => e.m) }));
    await page.screenshot({ path: path.join(SHOTS, '5-picker-adopted.png') });
    check('5: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 6. another tab's write while this tab was hidden: the resume-time re-read ---------------------
  if (want(6)) {
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
  // ---- 7. a download the page re-applies differently: the page's form goes up and the row reads Same ----
  if (want(7)) {
    const rows = CLOUD_ROWS();
    rows.find(r => r.kind === 'settings').data = Object.assign({}, ACCOUNT_SETTINGS, { presetColors: { Morning: '#abc' } });   // the dashboard keeps 6-digit colours only
    const cloud = new FakeCloud(rows);
    const ctx = await openContext(browser, cloud, SEED(true));
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    await openAccount(page);
    await clickAndWait(page, 'use-account', 'now on this device');
    const row = cloud.find('settings', 'default');
    const d = await dashState(page);
    const states = await planStates(page);
    const patches = cloud.log.filter(e => e.m === 'PATCH');
    check('7: the page dropped the 3-digit colour and the module put its form in the account — one PATCH', patches.length === 1 && !('Morning' in (row.data.presetColors || {})) && d.color === undefined && d.location === 'Atlanta, GA', JSON.stringify({ patches: patches.length, presetColors: row.data.presetColors, local: d.color, location: d.location }));
    check('7: the row reads Same afterwards and the memory holds the pushed row', states['settings:default'] === 'synced' && d.memory, JSON.stringify({ states, memory: d.memory }));
    check('7: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 8. row-scoped trouble is skipped and named; a dead connection stops the run and names the rest ----
  if (want(8)) {
    // a Flash Cards streak row that is not { value } — a download refused by the shape check (the page is not
    // open here, so the module would take the row straight into the store otherwise)
    const rows = () => CLOUD_ROWS().concat([{ tool: 'FlashCards', kind: 'pbStreak', name: 'default', data: 'not an object' }]);
    const seed = SEED(false);
    seed.hebrewBlender_presets = JSON.stringify({ 'Big preset': { big: 'x'.repeat(1900000) }, 'Small preset': { fontSize: 22 } });
    const cloud = new FakeCloud(rows());
    const ctx = await openContext(browser, cloud, seed);
    const { page, errors } = await openPage(ctx, 'hebrew_blend_generator.html');
    await openAccount(page);
    await clickAndWait(page, 'sync', 'Sync finished|Stopped');
    const s = await screen(page);
    const d = await dashState(page);
    check('8: the two rows were skipped by name and the run went on to the dashboard', /^Sync finished/.test(s.status) && /0 still need a choice/.test(s.status) && /2 skipped: Big preset \(too big for the cloud\), Best streak \(unexpected shape in the cloud copy\)\.$/.test(s.status) && d.presets.includes('Morning') && d.enabled === true, JSON.stringify({ status: s.status, presets: d.presets, enabled: d.enabled }));
    const streak = await page.evaluate(() => localStorage.getItem('hebrewFlashCards_pbStreak'));
    check('8: the small preset went up; the big one and the malformed row were left alone, and nothing was written for the streak', !!cloud.find('preset', 'Small preset') && !cloud.find('preset', 'Big preset') && cloud.find('pbStreak', 'default').data === 'not an object' && streak === null, JSON.stringify({ rows: cloud.rows.map(r => r.kind + ':' + r.name), streak }));
    await page.screenshot({ path: path.join(SHOTS, '8-skipped-named.png') });
    check('8: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
    // the same device, but the connection dies at the Torah Trainer once the run is under way
    const cloud2 = new FakeCloud(rows());
    const ctx2 = await openContext(browser, cloud2, seed);
    const second = await openPage(ctx2, 'hebrew_blend_generator.html');
    await openAccount(second.page);
    cloud2.abortWhen = (url) => url.searchParams.get('tool') === 'eq.TorahTrainer';
    await clickAndWait(second.page, 'sync', 'Sync finished|Stopped');
    const s2 = await screen(second.page);
    const d2 = await dashState(second.page);
    check('8: a dead connection stops the run at the Torah Trainer and names the tools not reached', /^Stopped while syncing Torah Trainer: The cloud is unreachable right now\. Try again later\. \d+ of \d+ done so far\. Not checked yet: Trope Tutor, Hebrew Classroom Dashboard\. 2 skipped: Big preset/.test(s2.status) && !d2.presets.includes('Morning'), JSON.stringify({ status: s2.status, presets: d2.presets }));
    check('8: 0 pageerrors after the dead connection', second.errors.length === 0, second.errors.join(' | '));
    await ctx2.close();
  }
  // ---- 9. folder trees converge: filed beats unfiled, a move made here goes up by itself, a move made elsewhere comes down ----
  if (want(9)) {
    const treeOf = (t) => { const out = []; (function walk(arr, path) { arr.forEach(n => { if (n.t === 'item') out.push(path + n.name); else { out.push(path + n.name + '/'); walk(n.children || [], path + n.name + '/'); } }); })(t.root, ''); return out; };
    const rows = CLOUD_ROWS().map(r => r.kind === 'presetFolders' ? Object.assign({}, r, { data: { v: 1, root: [{ t: 'folder', id: 'f_w1', name: 'Week 1', collapsed: false, children: [{ t: 'item', name: 'Morning' }] }] } }) : r);
    const cloud = new FakeCloud(rows);
    const seed = SEED(true);
    seed.hebrewDashboard_presets = JSON.stringify({ Morning: { headerLang: 'en', showTimer: true } });   // the account's preset, so its row reads Same
    seed.hebrewDashboard_presetsFolders = JSON.stringify({ v: 1, root: [{ t: 'item', name: 'Morning' }, { t: 'folder', id: 'f_old', name: 'Old', collapsed: false, children: [] }] });
    const ctx = await openContext(browser, cloud, seed);
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    const localTree = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem('hebrewDashboard_presetsFolders')));
    const treeRow = () => cloud.find('presetFolders', 'default');
    await openAccount(page);
    await clickAndWait(page, 'sync', 'Sync finished');
    let tree = await localTree(page);
    check('9: after the sync "Morning" is filed once, under Week 1, and the unrelated folder is kept', JSON.stringify(treeOf(tree)) === JSON.stringify(['Old/', 'Week 1/', 'Week 1/Morning']), JSON.stringify(treeOf(tree)));
    check('9: the account holds the same layout after one PATCH of the tree row', JSON.stringify(treeOf(treeRow().data)) === JSON.stringify(treeOf(tree)) && patchesOn(cloud, treeRow().id) === 1, JSON.stringify({ cloud: treeOf(treeRow().data), patches: patchesOn(cloud, treeRow().id) }));
    await clickAndWait(page, 'use-account', 'now on this device');   // settle the settings row, so the dashboard line can speak about folders alone
    const synced = { tree: await localTree(page), presets: await page.evaluate(() => localStorage.getItem('hebrewDashboard_presets')), meta: await page.evaluate(() => JSON.parse(localStorage.getItem('ivritSuite_syncMeta'))) };
    // the teacher moves "Morning" into a new folder here and comes back later
    await page.evaluate(() => {
      const t = JSON.parse(localStorage.getItem('hebrewDashboard_presetsFolders'));
      t.root.find(n => n.t === 'folder' && n.name === 'Week 1').children = [];
      t.root.push({ t: 'folder', id: 'f_w2', name: 'Week 2', collapsed: false, children: [{ t: 'item', name: 'Morning' }] });
      localStorage.setItem('hebrewDashboard_presetsFolders', JSON.stringify(t));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.IvritAccount && window.IvritSaves && IvritAccount.status() === 'signed-in', null, { timeout: 25000 });
    await page.waitForFunction(() => !!document.querySelector('.ivsav-note-row'), null, { timeout: 15000 }).catch(() => {});
    const note = await page.evaluate(() => (document.querySelector('.ivsav-note-row') || {}).textContent || '');
    await openAccount(page);
    let s = await screen(page);
    check('9: a folder move alone shows the note in the panel and the account line, and enables Sync everything', /Folder layout: different here and in your account/.test(note) && s.sync && s.lines.some(l => /Hebrew Classroom Dashboard: the folder layout differs/.test(l)), JSON.stringify({ note, lines: s.lines, sync: s.sync }));
    await page.screenshot({ path: path.join(SHOTS, '9-folders-differ.png') });
    await clickAndWait(page, 'sync', 'Sync finished');
    s = await screen(page);
    tree = await localTree(page);
    check('9: Sync sent the move up ("1 merged", one more PATCH) and the account now files Morning under Week 2', /1 merged/.test(s.status) && patchesOn(cloud, treeRow().id) === 2 && JSON.stringify(treeOf(treeRow().data)) === JSON.stringify(['Old/', 'Week 1/', 'Week 2/', 'Week 2/Morning']) && JSON.stringify(treeOf(tree)) === JSON.stringify(treeOf(treeRow().data)), JSON.stringify({ status: s.status, cloud: treeOf(treeRow().data), local: treeOf(tree) }));
    check('9: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
    // the other device: it synced the earlier layout (its tree, and its memory of that sync) and has not touched it since
    const seedB = SEED(true);
    seedB.hebrewDashboard_presets = synced.presets;
    seedB.hebrewDashboard_presetsFolders = JSON.stringify(synced.tree);
    const metaB = JSON.parse(seedB.ivritSuite_syncMeta);
    metaB.users[UID] = { Dashboard: { presetFolders: synced.meta.users[UID].Dashboard.presetFolders } };
    seedB.ivritSuite_syncMeta = JSON.stringify(metaB);
    const ctxB = await openContext(browser, cloud, seedB);
    const b = await openPage(ctxB, 'classroom_dashboard.html');
    await openAccount(b.page);
    await clickAndWait(b.page, 'sync', 'Sync finished');
    const treeB = await localTree(b.page);
    check('9: the other device takes the moved layout — Morning under Week 2, Week 1 kept once and empty — and pushes nothing back', JSON.stringify(treeOf(treeB)) === JSON.stringify(['Old/', 'Week 1/', 'Week 2/', 'Week 2/Morning']) && patchesOn(cloud, treeRow().id) === 2, JSON.stringify({ tree: treeOf(treeB), patches: patchesOn(cloud, treeRow().id) }));
    check('9: 0 pageerrors on the other device', b.errors.length === 0, b.errors.join(' | '));
    await ctxB.close();
  }
  // ---- 10 + 11. deletions ask instead of coming back (the hub: every panel, nothing in memory) ----
  if (want(10, 11)) {
    const cloud = new FakeCloud(CLOUD_ROWS());
    const ctx = await openContext(browser, cloud, SEED(false));
    const { page, errors } = await openPage(ctx, 'index.html');
    // The delete buttons confirm() first. A native dialog raised inside a Playwright-driven click stalls the
    // page (the driver cannot return while the dialog is up), so the page's confirm is replaced by a spy
    // that records the question and answers yes — the real button handlers still run.
    await page.evaluate(() => { window.__confirms = []; window.confirm = (m) => { window.__confirms.push(m); return true; }; });
    const confirms = () => page.evaluate(() => window.__confirms);
    // The panel sits inside the closed AllTools modal, so the click is dispatched through a locator (no
    // visibility check) rather than fired from inside page.evaluate — a confirm() raised inside an
    // evaluate stalls the page until the evaluate returns, which it cannot while the dialog is up.
    const clickRowButton = async (pg, name, label) => {
      const at = await pg.evaluate(([name, label]) => {
        const rows = [...document.querySelectorAll('.ivsav[data-tool="Dashboard"] .ivsav-row')];
        const i = rows.findIndex(l => l.querySelector('.ivsav-name').textContent === name);
        const buttons = i >= 0 ? [...rows[i].querySelectorAll('button')].map(x => x.textContent) : null;
        return { i, j: buttons ? buttons.indexOf(label) : -1, buttons };
      }, [name, label]);
      if (at.i < 0 || at.j < 0) return { ok: false, buttons: at.buttons };
      await pg.locator('.ivsav[data-tool="Dashboard"] .ivsav-row').nth(at.i).locator('button').nth(at.j).dispatchEvent('click');
      return { ok: true };
    };
    // Resolves to the panel's status line once it matches — or, after 30 s, to what it says instead (the check then shows it).
    const waitStatus = (pg, re) => pg.waitForFunction((re) => new RegExp(re).test((document.querySelector('.ivsav[data-tool="Dashboard"] .ivsav-status') || {}).textContent || ''), re, { timeout: 30000 })
      .then(() => pg.evaluate(() => (document.querySelector('.ivsav[data-tool="Dashboard"] .ivsav-status') || {}).textContent || ''), () => pg.evaluate(() => 'TIMEOUT; status: ' + ((document.querySelector('.ivsav[data-tool="Dashboard"] .ivsav-status') || {}).textContent || '')));
    const memoryOf = (pg, kind) => pg.evaluate((kind) => { const m = JSON.parse(localStorage.getItem('ivritSuite_syncMeta') || '{}'); return Object.keys((((m.users || {})['11111111-1111-4111-8111-111111111111'] || {}).Dashboard || {})[kind] || {}).sort(); }, kind);
    await openAccount(page);
    await clickAndWait(page, 'sync', 'Sync finished');
    let d = await dashState(page);
    check('10: a fresh device took every dashboard row from the account', d.presets.includes('Morning') && d.schedules.includes('2026-2027') && d.rosters.includes('lap_0') && d.enabled === true, JSON.stringify(d));
    // the teacher deletes the preset and the class on this device
    await page.evaluate(() => {
      const p = JSON.parse(localStorage.getItem('hebrewDashboard_presets')); delete p.Morning; localStorage.setItem('hebrewDashboard_presets', JSON.stringify(p));
      const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings')); delete s.rosters.lap_0; localStorage.setItem('hebrewDashboard_settings', JSON.stringify(s));
    });
    let states = await planStates(page);
    check('10: both read "deleted on this device", not "only in the cloud"', states['preset:Morning'] === 'deleted-here' && states['roster:lap_0'] === 'deleted-here', JSON.stringify(states));
    const addPreset = (pg, name) => pg.evaluate((name) => { const p = JSON.parse(localStorage.getItem('hebrewDashboard_presets')); p[name] = { headerLang: 'he' }; localStorage.setItem('hebrewDashboard_presets', JSON.stringify(p)); }, name);
    await addPreset(page, 'Evening');   // something for the run to do, so the Sync button is live
    await openAccount(page);            // re-opened: the screen lists again after the local changes
    await clickAndWait(page, 'sync', 'Sync finished');
    d = await dashState(page);
    let s = await screen(page);
    check('10: Sync everything uploaded the new preset, brought neither deleted row back, and the account line says so', !d.presets.includes('Morning') && !d.rosters.includes('lap_0') && /1 uploaded, 0 downloaded/.test(s.status) && s.lines.some(l => /Hebrew Classroom Dashboard: 2 deleted on this device/.test(l)), JSON.stringify({ presets: d.presets, rosters: d.rosters, status: s.status, lines: s.lines }));
    await page.screenshot({ path: path.join(SHOTS, '10-deleted-here.png') });
    await page.evaluate(() => window.IvritSaves.closeAccount());
    const rowState = (pg, name) => pg.evaluate((name) => { const li = [...document.querySelectorAll('.ivsav[data-tool="Dashboard"] .ivsav-row')].find(l => l.querySelector('.ivsav-name').textContent === name); return li ? { state: li.getAttribute('data-state'), badge: li.querySelector('.ivsav-state').textContent, buttons: [...li.querySelectorAll('button')].map(b => b.textContent) } : null; }, name);
    const before = await rowState(page, 'Morning');
    check('10: the panel row offers exactly the two choices and no generic delete', before && before.badge === 'Deleted on this device' && JSON.stringify(before.buttons) === JSON.stringify(['Delete from your account too', 'Bring it back', 'Download file']), JSON.stringify(before));
    const c1 = await clickRowButton(page, 'Morning', 'Delete from your account too');
    const st1 = await waitStatus(page, 'Deleted "Morning"');
    const memPresets = await memoryOf(page, 'preset');
    check('10: "Delete from your account too" asked first, then removed the row and its memory', c1.ok && !cloud.find('preset', 'Morning') && !memPresets.includes('Morning') && /Delete "Morning" from your account too\? It is already gone from this device/.test((await confirms())[0] || ''), JSON.stringify({ c1, st1, rows: cloud.rows.map(r => r.kind + ':' + r.name), memPresets, confirms: await confirms() }));
    const c2 = await clickRowButton(page, 'Kitah Alef', 'Bring it back');   // gone here, the class list is still named from the account row's data, not by its id
    const st2 = await waitStatus(page, 'Downloaded "Kitah Alef"');
    states = await planStates(page);
    d = await dashState(page);
    check('10: "Bring it back" restored the class and the row reads Same', c2.ok && d.rosters.includes('lap_0') && states['roster:lap_0'] === 'synced', JSON.stringify({ c2, st2, rosters: d.rosters, states }));
    // 11. Delete from cloud on a synced row: the local copy stays and is not uploaded again by itself
    const c3 = await clickRowButton(page, '2026-2027', 'Delete from cloud');
    const st3 = await waitStatus(page, 'Deleted "2026-2027"');
    states = await planStates(page);
    const row11 = await rowState(page, '2026-2027');
    check('11: after "Delete from cloud" (its confirm says the copy here stays) the schedule reads "Removed from your account" with only "Upload again"', c3.ok && !cloud.find('schedule', '2026-2027') && states['schedule:2026-2027'] === 'cloud-deleted' && row11 && row11.badge === 'Removed from your account' && JSON.stringify(row11.buttons) === JSON.stringify(['Upload again']) && /The copy on this device stays and is not uploaded again/.test((await confirms())[1] || ''), JSON.stringify({ c3, st3, states, row11, confirms: await confirms() }));
    const posts = () => cloud.log.filter(e => e.m === 'POST' && e.body && e.body.kind === 'schedule').length;
    await addPreset(page, 'Night');   // again something else for the run to do
    await openAccount(page);
    await clickAndWait(page, 'sync', 'Sync finished');
    check('11: Sync everything did not upload it', posts() === 0 && !cloud.find('schedule', '2026-2027') && !!cloud.find('preset', 'Night'), JSON.stringify({ posts: posts(), rows: cloud.rows.map(r => r.kind + ':' + r.name) }));
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('hebrewDashboard_schedules')); s['2026-2027'].week.weekend = true; localStorage.setItem('hebrewDashboard_schedules', JSON.stringify(s)); });
    states = await planStates(page);
    await openAccount(page);
    await clickAndWait(page, 'sync', 'Sync finished');
    check('11: a local edit made it a normal local-only row again, and Sync uploaded it', states['schedule:2026-2027'] === 'local-only' && posts() === 1 && !!cloud.find('schedule', '2026-2027') && cloud.find('schedule', '2026-2027').data.week.weekend === true, JSON.stringify({ states, posts: posts() }));
    check('10/11: 0 pageerrors on the hub', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 12. presets name their class ------------------------------------------------------------------
  if (want(12)) {
    const rows = CLOUD_ROWS().filter(r => r.kind !== 'roster' && r.kind !== 'preset').concat([
      { tool: 'Dashboard', kind: 'preset', name: 'Morning', data: { headerLang: 'en', showTimer: true, activeRosterName: 'Kitah Alef' } },
      { tool: 'Dashboard', kind: 'preset', name: 'Evening', data: { headerLang: 'he', showTimer: false, activeRosterName: 'Nobody' } },
      { tool: 'Dashboard', kind: 'preset', name: 'Legacy', data: { headerLang: 'he', activeRosterId: 'lap_zz' } }
    ]);
    const cloud = new FakeCloud(rows);
    const seed = SEED(true);
    const dev = JSON.parse(seed.hebrewDashboard_settings);
    dev.rosters = { dev_9: { name: 'Kitah Alef', names: ['Noa'] }, dev_8: { name: 'Kitah Bet', names: ['Ari'] } }; dev.activeRosterId = 'dev_9';
    seed.hebrewDashboard_settings = JSON.stringify(dev);
    const ctx = await openContext(browser, cloud, seed);
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    await openAccount(page);
    await clickAndWait(page, 'sync', 'Sync finished');
    const r = await page.evaluate(() => { const out = {}; switchClass('dev_8'); loadPreset('Morning'); out.morning = settings.activeRosterId; loadPreset('Evening'); out.evening = settings.activeRosterId; loadPreset('Legacy'); out.legacy = settings.activeRosterId; out.nameLeak = 'activeRosterName' in settings; return out; });
    check('12: a preset names its class — the class with that name here is chosen; an unknown name or a foreign id keeps the current class', r.morning === 'dev_9' && r.evening === 'dev_9' && r.legacy === 'dev_9' && !r.nameLeak, JSON.stringify(r));
    const r2 = await page.evaluate(() => { switchClass('dev_8'); const p = getSettings({ forPreset: true }); return { name: p.activeRosterName, hasId: 'activeRosterId' in p, cls: presetClassName('Morning'), clsUnknown: presetClassName('Evening') }; });
    check("12: a snapshot saved here carries the class name, never the device id; the schedule resolves a preset's class by name", r2.name === 'Kitah Bet' && !r2.hasId && r2.cls === 'Kitah Alef' && r2.clsUnknown === '', JSON.stringify(r2));
    check('12: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 13. same-named classes: a never-synced local one folds into the one from the account --------
  if (want(13)) {
    const rows = CLOUD_ROWS().map(r => r.kind === 'roster' ? Object.assign({}, r, { data: { name: 'Grade 4', names: ['Eitan'] } }) : r);
    const cloud = new FakeCloud(rows);
    const seed = SEED(true);
    const dev = JSON.parse(seed.hebrewDashboard_settings);
    dev.rosters = { dev_0: { name: 'Grade 4', names: ['Noa'] } }; dev.activeRosterId = 'dev_0';
    seed.hebrewDashboard_settings = JSON.stringify(dev);
    const ctx = await openContext(browser, cloud, seed);
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    await openAccount(page);
    await clickAndWait(page, 'sync', 'Sync finished');
    const d = await dashState(page);
    const pk = await pickerState(page);
    const row = cloud.find('roster', 'lap_0');
    const rosterPosts = cloud.log.filter(e => e.m === 'POST' && e.body && e.body.kind === 'roster').length, deletes = cloud.log.filter(e => e.m === 'DELETE').length;
    check('13: one class with both names, the pointer on it, and the page said so', JSON.stringify(d.rosters) === '["lap_0"]' && d.active === 'lap_0' && /Eitan/.test(pk.chips) && /Noa/.test(pk.chips) && /Merged your "Grade 4"/.test(pk.toast), JSON.stringify({ rosters: d.rosters, active: d.active, chips: pk.chips, toast: pk.toast }));
    check('13: the account row took the union in one PATCH; nothing was posted for the folded class, nothing deleted', JSON.stringify(row.data.names) === JSON.stringify(['Eitan', 'Noa']) && rosterPosts === 0 && deletes === 0 && patchesOn(cloud, row.id) === 1, JSON.stringify({ names: row.data.names, rosterPosts, deletes, patches: patchesOn(cloud, row.id) }));
    await page.screenshot({ path: path.join(SHOTS, '13-folded-class.png') });
    check('13: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 14. a weekly grid removed elsewhere is removed here when the settings arrive -----------------
  if (want(14)) {
    const cloud = new FakeCloud(CLOUD_ROWS());
    const ctx = await openContext(browser, cloud, SEED(true));
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    await openAccount(page);
    await clickAndWait(page, 'sync', 'Sync finished');
    await clickAndWait(page, 'use-account', 'now on this device');
    let d = await dashState(page);
    check('14: the weekly grid arrived with the account settings', d.enabled === true && d.periods === 2 && d.memory, JSON.stringify(d));
    // another device removed the grid and turned Schedule Sync off
    const row = cloud.find('settings', 'default');
    const before = patchesOn(cloud, row.id);
    row.data = Object.assign({}, row.data, { scheduleEnabled: false }); delete row.data.scheduleWeek; row.updated_at = cloud.stamp(); row.data_hash = null;   // as a write from another device leaves it (its own hash, unknown here)
    await openAccount(page);
    await clickAndWait(page, 'sync', 'Sync finished');
    d = await dashState(page);
    const states = await planStates(page);
    check('14: after the download the grid is gone here too, the row reads Same, and nothing put it back', d.enabled === false && d.periods === 0 && states['settings:default'] === 'synced' && patchesOn(cloud, row.id) === before && !('scheduleWeek' in row.data), JSON.stringify({ enabled: d.enabled, periods: d.periods, state: states['settings:default'], patches: [before, patchesOn(cloud, row.id)] }));
    check('14: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 15. the suite-wide preferences row: language and theme apply live, the rest lands for the next load ----
  if (want(15)) {
    const SUITE = { tool: 'Suite', kind: 'prefs', name: 'default', data: { lang: 'he', darkMode: '1', hebFont: 'David Libre', dictTtsRate: '1.2', fmLastAuthor: 'Morah Rivka' } };
    const PREF_KEYS = ['hebrewBlender_lang', 'hebrewBlender_darkMode', 'hebrewBlender_hebFont', 'hebrewDictionary_ttsRate', 'hebrewFontMaker_lastAuthor'];
    const DONE = 'Sync finished|הסנכרון הסתיים', HINT = 'Reload open pages|רעננו דפים פתוחים';
    const settled = async (page, statusRe) => {   // the language landed and the account screen was rebuilt in it, its status line kept
      await page.waitForFunction((re) => {
        const t = document.querySelector('.ivsav-overlay .ivsav-card-title'), s = document.querySelector('.ivsav-overlay .ivsav-status');
        return !!(window.I18n && I18n.lang === 'he' && document.documentElement.lang === 'he' && t && t.textContent === 'החשבון שלכם' && s && new RegExp(re).test(s.textContent));
      }, statusRe, { timeout: 20000 });
      return page.evaluate((keys) => ({
        ls: keys.map(k => localStorage.getItem(k)), dark: document.body.classList.contains('dark'), dir: document.documentElement.dir,
        pressed: (document.getElementById('darkBtn') || document.getElementById('darkToggle') || { getAttribute: () => null }).getAttribute('aria-pressed'),
        status: document.querySelector('.ivsav-overlay .ivsav-status').textContent, kbd: localStorage.getItem('hebrewBlender_kbdLayout'),
        held: (JSON.parse(localStorage.getItem('ivritSuite_syncMeta') || '{}').held) || null
      }), PREF_KEYS);
    };
    const suiteStates = (page) => page.evaluate(() => window.IvritSaves.plan('Suite').then(p => Object.fromEntries(p.rows.map(r => [r.kind + ':' + r.name, r.state]))));
    // (a) a device with no preference of its own (the Trope Tutor writes none at load): the row is only in the account
    {
      const cloud = new FakeCloud(CLOUD_ROWS().concat([SUITE]));
      const ctx = await openContext(browser, cloud, SEED(false));
      const { page, errors } = await openPage(ctx, 'trope_tutor.html');
      const before = await page.evaluate(() => ({ lang: document.documentElement.lang, dark: document.body.classList.contains('dark'), prefs: localStorage.getItem('hebrewBlender_lang') }));
      await openAccount(page);
      let s = await screen(page);
      check('15a: the account screen lists the preferences as only in the account', before.lang === 'en' && !before.dark && before.prefs === null && s.lines.some(l => /IvritSuite/.test(l) && /1 only in your account/.test(l)), JSON.stringify({ before, lines: s.lines }));
      await clickAndWait(page, 'sync', DONE);
      const r = await settled(page, DONE);
      const row = cloud.find('prefs', 'default');
      check('15a: the keys landed and the page is in Hebrew and dark without a reload', JSON.stringify(r.ls) === JSON.stringify(['he', '1', 'David Libre', '1.2', 'Morah Rivka']) && r.dark && r.pressed === 'true' && r.dir === 'rtl', JSON.stringify(r));
      check('15a: the finish line says the other preferences show after a reload; nothing held, nothing pushed', new RegExp(HINT).test(r.status) && r.held === null && patchesOn(cloud, row.id) === 0, JSON.stringify({ status: r.status, held: r.held, patches: patchesOn(cloud, row.id) }));
      const states = await suiteStates(page);
      check('15a: the row reads Same', states['prefs:default'] === 'synced', JSON.stringify(states));
      await page.screenshot({ path: path.join(SHOTS, '15a-prefs-live.png') });
      check('15a: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // (b) a device that already holds preferences (English; the generator's .ivrit engine stamps the backup mode at
    //     init): the row is changed in both places and the Settings that differ block resolves it; a field this build
    //     cannot apply is held, reported as the row's value, and released when the key changes here
    {
      const suite = Object.assign({}, SUITE, { data: Object.assign({}, SUITE.data, { lang: 'he', kbdLayout: 'dvorak' }) });   // no such layout here
      const cloud = new FakeCloud(CLOUD_ROWS().concat([suite]));
      const seed = SEED(false); seed.hebrewBlender_lang = 'en'; seed.hebrewBlender_kbdLayout = 'abc';
      const ctx = await openContext(browser, cloud, seed);
      const { page, errors } = await openPage(ctx, 'hebrew_blend_generator.html');
      await openAccount(page);
      let s = await screen(page);
      check('15b: the Settings that differ block names IvritSuite', s.block && /IvritSuite/.test(s.note) && s.lines.some(l => /IvritSuite/.test(l) && /1 changed in both places/.test(l)), JSON.stringify(s));
      const USED = 'now on this device|נמצאות עכשיו במכשיר הזה';   // the Hebrew "Checking…" line also says "this device": match the done line only
      await clickAndWait(page, 'use-account', USED);
      const r = await settled(page, USED);
      const row = cloud.find('prefs', 'default');
      check("15b: Use my account's settings landed the keys live; the unknown layout is held, not written", JSON.stringify(r.ls) === JSON.stringify(['he', '1', 'David Libre', '1.2', 'Morah Rivka']) && r.dark && r.dir === 'rtl' && r.kbd === 'abc' && r.held && r.held.kbdLayout && r.held.kbdLayout.v === 'dvorak' && r.held.kbdLayout.was === 'abc', JSON.stringify(r));
      check('15b: the account row took the union (this device\'s backup mode joined it) in one PATCH, the held layout kept', row.data.inputMode === 'auto' && row.data.lang === 'he' && row.data.kbdLayout === 'dvorak' && patchesOn(cloud, row.id) === 1, JSON.stringify({ data: row.data, patches: patchesOn(cloud, row.id) }));
      let states = await suiteStates(page);
      check('15b: the row reads Same while the held field is reported as the row\'s value', states['prefs:default'] === 'synced' && new RegExp(HINT).test(r.status), JSON.stringify({ states, status: r.status }));
      // the teacher changes the keyboard layout here: the hold is released and the row reads newer on this device
      await page.evaluate(() => localStorage.setItem('hebrewBlender_kbdLayout', 'qwerty'));
      states = await suiteStates(page);
      const value = await page.evaluate(() => window.IvritSaves._test.suitePrefs.read());
      check('15b: a key changed here releases its hold — the row reads Newer on this device with this device\'s layout', states['prefs:default'] === 'local-changed' && value.kbdLayout === 'qwerty', JSON.stringify({ states, value }));
      await page.screenshot({ path: path.join(SHOTS, '15b-prefs-block.png') });
      check('15b: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
  // ---- 16. the account screen on the hub: a row only its tool can merge is signposted, the counts say so, and
  //          closing the screen mid-run does not stop the run ----------------------------------------------
  if (want(16)) {
    const rows = CLOUD_ROWS().concat([{ tool: 'Dictionary', kind: 'wordList', name: 'abc', data: { name: 'Colors', created: 1, updated: 2, words: [{ word: 'אדום', translit: 'adom', meaning: 'red' }] } }]);
    const cloud = new FakeCloud(rows);
    const seed = SEED(true);
    seed.ivritSuite_wordLists = JSON.stringify({ v: 1, lists: { abc: { name: 'Colors', created: 1, updated: 3, words: [{ word: 'כחול', translit: 'kachol', meaning: 'blue' }] } } });   // the same list, edited here: changed in both places
    const ctx = await openContext(browser, cloud, seed);
    const { page, errors } = await openPage(ctx, 'index.html');
    await openAccount(page);
    let s = await screen(page);
    check('16: the word list counts as "to merge inside" the Dictionary, not as a choice this page can make', s.lines.some(l => /Hebrew Word Lookup: 1 to merge inside Hebrew Word Lookup/.test(l)) && !s.lines.some(l => /Hebrew Word Lookup.*changed in both places/.test(l)) && s.block && /Classroom Dashboard/.test(s.note) && !s.otherHint, JSON.stringify(s));
    const sp = await page.evaluate(() => {
      openIEModal();
      const host = document.querySelector('.ie-cloud-host[data-tool="Dictionary"]');
      const row = host && [...host.querySelectorAll('.ivsav-row')].find(r => /Colors/.test(r.textContent));
      const box = row && row.querySelector('.ivsav-signpost'), a = box && box.querySelector('a');
      return { state: row && row.getAttribute('data-state'), text: box ? box.textContent : '', href: a ? a.getAttribute('href') : null, buttons: row ? [...row.querySelectorAll('.ivsav-actions .ivsav-btn')].map(b => b.textContent) : [] };
    });
    check('16: the panel row carries the signpost with a link to the Dictionary and no merge button', sp.state === 'conflict' && /open Hebrew Word Lookup to merge it/.test(sp.text) && sp.href === '/hebrew_dictionary.html?wordlists=open' && !sp.buttons.some(b => /Merge|Keep|Use/.test(b)), JSON.stringify(sp));
    await page.screenshot({ path: path.join(SHOTS, '16-signpost.png') });
    await page.evaluate(() => { closeIEModal(); });
    // Sync everything, then close the screen at once: the run must still reach the dashboard (last in the order)
    await page.click('.ivsav-overlay .ivsav-btn[data-act="sync"]');
    await page.waitForFunction(() => /Syncing|Checking/.test((document.querySelector('.ivsav-overlay .ivsav-status') || {}).textContent || ''), null, { timeout: 10000 });
    await page.keyboard.press('Escape');
    const closed = await page.evaluate(() => !document.querySelector('.ivsav-overlay'));
    // the run is still going: wait for the dashboard rows (last in the order) to land in storage
    await page.waitForFunction(() => { const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings') || '{}'); const p = JSON.parse(localStorage.getItem('hebrewDashboard_presets') || '{}'); return !!(s.rosters && s.rosters.lap_0 && p.Morning); }, null, { timeout: 60000 }).catch(() => {});
    const states = await planStates(page);
    const d = await dashState(page);
    const wl = await page.evaluate(() => JSON.parse(localStorage.getItem('ivritSuite_wordLists')).lists.abc.words.map(w => w.word));
    check('16: the screen closed at once and the run went on to the dashboard: its rows landed here', closed && d.presets.includes('Morning') && d.schedules.includes('2026-2027') && JSON.stringify(d.rosters) === '["dev1_0","lap_0"]' && states['preset:Morning'] === 'synced' && states['roster:lap_0'] === 'synced', JSON.stringify({ closed, d, states }));
    const rosterPosts = cloud.log.filter(e => e.m === 'POST' && e.body && e.body.kind === 'roster').length;
    check('16: the word list was left for the Dictionary to merge, and the untouched empty default class was not uploaded', JSON.stringify(wl) === '["כחול"]' && cloud.find('wordList', 'abc').data.words[0].word === 'אדום' && rosterPosts === 0, JSON.stringify({ wl, rosterPosts }));
    const seedRow = await page.evaluate(() => window.IvritSaves.plan('Dashboard').then(p => { const r = p.rows.find(r => r.kind === 'roster' && r.name === 'dev1_0'); return r ? { seed: r.seed, state: r.state, safe: r.safeAction, choices: r.choices } : null; }));
    check('16: the empty default class reads as a seed with no action', !!seedRow && seedRow.seed === true && seedRow.state === 'local-only' && seedRow.safe === null && seedRow.choices.length === 0 && states['roster:dev1_0'] === 'seed', JSON.stringify(seedRow));
    check('16: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 17. a teacher's own font travels, and a full My Fonts is never emptied to make room ----------
  if (want(17)) {
    const B64 = 'AAEAAAALAIAAAwAwT1MvMg==';   // not a real face: the module only decodes it, nothing loads it here
    const FONT = { tool: 'Suite', kind: 'font', name: 'Morah Handwriting', data: { name: 'Morah Handwriting', b64: B64, family: 'Morah Handwriting' } };
    const fontsIn = (page) => page.evaluate(() => listUserFonts().then(l => l.map(f => f.name).sort()));
    // (a) a device with no fonts of its own takes the one in the account, and the picker shows it at once
    {
      const cloud = new FakeCloud(CLOUD_ROWS().concat([FONT]));
      const ctx = await openContext(browser, cloud, SEED(true));
      const { page, errors } = await openPage(ctx, 'hebrew_blend_generator.html');
      const before = await fontsIn(page);
      await openAccount(page);
      let s = await screen(page);
      check('17a: the account screen lists the font as only in the account', before.length === 0 && s.lines.some(l => /IvritSuite/.test(l) && /only in your account/.test(l)), JSON.stringify({ before, lines: s.lines }));
      await clickAndWait(page, 'sync', 'Sync finished');
      const after = await fontsIn(page);
      // MY_FONTS is a top-level let on the page: reachable by name, not on window. refreshMyFonts is async,
      // so wait for the picker to catch up rather than racing it.
      await page.waitForFunction(() => MY_FONTS.some(f => f.name === 'Morah Handwriting'), null, { timeout: 10000 }).catch(() => {});
      const picker = await page.evaluate(() => MY_FONTS.map(f => f.name));
      const states = await page.evaluate(() => window.IvritSaves.plan('Suite').then(p => Object.fromEntries(p.rows.map(r => [r.kind + ':' + r.name, r.state]))));
      check('17a: the font landed in the shared store, the picker re-listed it, and the row reads Same', JSON.stringify(after) === '["Morah Handwriting"]' && picker.includes('Morah Handwriting') && states['font:Morah Handwriting'] === 'synced', JSON.stringify({ after, picker, states }));
      const bytes = await page.evaluate(() => getUserFont('Morah Handwriting').then(r => r && r.bytes ? new Uint8Array(r.bytes).length : 0));
      check('17a: the bytes decoded to the right length', bytes === 16, String(bytes));
      check('17a: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // (b) a device already holding the ten My Fonts allows: the eleventh is refused by name, none is dropped
    {
      const cloud = new FakeCloud(CLOUD_ROWS().concat([FONT]));
      const ctx = await openContext(browser, cloud, SEED(true));
      const { page, errors } = await openPage(ctx, 'hebrew_blend_generator.html');
      await page.evaluate(async (b64) => {
        const bin = atob(b64), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        for (let i = 1; i <= 10; i++) await saveUserFont('Mine ' + i, u, 'Mine ' + i);
      }, B64);
      const before = await fontsIn(page);
      await openAccount(page);
      await clickAndWait(page, 'sync', 'Sync finished');
      const after = await fontsIn(page);
      const s = await screen(page);
      check('17b: with ten fonts here the eleventh is skipped and named, and not one of the teacher\'s is deleted', before.length === 10 && JSON.stringify(after) === JSON.stringify(before) && /skipped/.test(s.status) && /Morah Handwriting/.test(s.status) && /ten fonts/.test(s.status), JSON.stringify({ n: after.length, same: JSON.stringify(after) === JSON.stringify(before), status: s.status }));
      check('17b: the account still holds it, so it is not lost either', !!cloud.find('font', 'Morah Handwriting'), 'row gone');
      await page.screenshot({ path: path.join(SHOTS, '17-fonts-cap.png') });
      check('17b: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  srv.kill();
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} checks passed; screenshots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
