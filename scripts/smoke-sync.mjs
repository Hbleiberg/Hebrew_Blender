#!/usr/bin/env node
/*
 * smoke-sync.mjs — headless end-to-end test of the signed-in saves model ("signed in, the account is where
 * saves live", js/ivrit-saves.js) against a FAKE cloud. Playwright serves the pinned SDK from a local file,
 * seeds a remembered session, and answers every request to the project's /rest/v1/saves endpoint from an
 * in-memory table (PostgREST's eq. / in.(…) filters, multi-key order, offset/limit or Range, select, the
 * Prefer / Accept headers, the 23505 duplicate, the conditional PATCH and DELETE), plus /auth/v1/user,
 * /auth/v1/logout and a 404 for /rest/v1/profiles. No real network is used.
 *
 * Scenarios (one fresh fake cloud and browser context each, so a failure stays local):
 *   0. Capture the dashboard's own settings blob (the story's account row is that blob minus the per-device
 *      fields, so the "synced" readings test the round trip, not a hand-written subset).
 *   1. Hydrate at load: a fresh device opens the generator; without a click the account's presets, its
 *      folder tree AND the Dictionary word lists (alsoPull) land in localStorage, the page renders them, the
 *      status line reads "Saved in your account", no card (the device holds nothing extra); the listing is
 *      one GET with tool=in.(…) and select=tool,…, only rows whose hash differs are fetched, and a reload
 *      fetches nothing.
 *   2. A tool opened later on a hydrated device (memory for the generator, none for the dashboard): the
 *      account's dashboard settings win over the page's freshly written defaults, the weekly grid arrives,
 *      the row reads synced in lastPlan, the live page shows Schedule Sync on, the picker adopts the class
 *      from the account; only the page's own normalization (a class colour for its seeded preset) goes up. Plus:
 *      DASHBOARD_DEFAULT_PRESET_CANON equals canonJson of the page's own DEFAULT_PRESET.Default.
 *   3. Write-through on the dashboard: a preset saved through the page's own function → one POST with the
 *      right tool/kind/name/data_hash within 4 s; an edit → one conditional PATCH (updated_at=eq.<stamp>);
 *      a delete → one conditional DELETE; an unchanged re-save → no request; a PATCH the fake refuses (the
 *      row moved behind the page's back) → the page re-hydrates and keeps both versions, no dialog.
 *   4. Two tabs of the dashboard: tab A's page-write stamp does not overwrite tab B's live setup (B re-reads
 *      only on its next hydrate); B's stale whole-blob write of the settings deletes nothing in the account.
 *   5. Replace hidden: with a stored session the .ivrit restore dialog (ivritAskMode) offers Merge only and
 *      shows the signed-in note — on the dashboard and on the hub.
 *   6. Deletes propagate: a preset deleted on device A (DELETE) is gone on device B at its next hydrate; a
 *      row B changed since (hash differs from its memory) is re-inserted (POST), never removed.
 *   7. Trees converge: an item filed in the account's tree beats the same item unfiled here (one PATCH); a
 *      folder move made here goes up by itself within 4 s; a device that synced the earlier layout takes the
 *      moved one and pushes nothing back.
 *   8. Fonts: a font in the account lands in IndexedDB on a device with none (ivritsuite:fonts fires, the
 *      picker lists it); deleteMyFontFile on the hub sends a DELETE for its row; a device holding ten fonts
 *      gets the eleventh refused quietly (no card, the hub's status line names it, the account keeps the row);
 *      a font evicted by the cap is not deleted from the account, not by the upload nor by a later hydrate.
 *   9. The device-extras card: a device holding extras (a preset, a class list, a student profile, a font, a
 *      non-default Trope progress) signs in for the first time → the card lists them per tool and kind;
 *      Add → one POST each, the card closes, hydrated[uid] is set; Download → an .ivrit holding exactly
 *      those extras; Remove (confirmed) → the items leave the device, the dashboard settings blob is not
 *      uploaded until the page changes it, and a later page write goes up.
 *  10. Sign-out. S1: memory-confirmed rows leave the device, the settings blob keeps only per-device fields
 *      and no class from the account, preferences and My Fonts stay, POST /auth/v1/logout, the page reloads
 *      anonymous with no sb-* key. S2: an edit 500 ms before Sign out reaches the account (PATCH) before the
 *      logout. S3: a too-big preset and a class list the account refused survive. S4: /logout answers 500 →
 *      still anonymous after the reload, no key re-created. S5: a second tab reloads anonymous, its class typed
 *      in the meantime kept as device data (the server already refuses the token). S6: the account deleted
 *      elsewhere (empty tables, 401 on /auth/v1/user) → the next hydrate removes nothing. S7: a v1
 *      ivritSuite_syncMeta written beside → the v2 memory survives. S8: a v1 memory with a newer local
 *      settings edit → a PATCH, not a revert. A check whose detail carries an "[account] onSignOut hook
 *      failed" warning is reporting the module, not the harness.
 *  11. Erase All on the hub while signed in: no DELETE and the page ends anonymous; a cancelled Erase leaves
 *      write-through on (a later page write still POSTs).
 *
 * Every scenario asserts 0 pageerrors. Run from the repo root:
 *   node scripts/smoke-sync.mjs --sdk path/to/supabase.js [--port 8081]
 * The script starts python3 -m http.server itself (port 8081 by default, so it can run beside the others).
 * SMOKE_DEBUG=1 echoes the pages' console; SMOKE_ONLY=3,6 runs only those scenarios (0 always runs).
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
const ONLY = process.env.SMOKE_ONLY ? process.env.SMOKE_ONLY.split(',').map(Number) : null;
const want = (...ns) => !ONLY || ns.some(n => ONLY.includes(n));
const UID = '11111111-1111-4111-8111-111111111111';
const EMAIL = 'teacher@example.org';
// user_metadata.full_name: the account has a name, so the required-name step never opens (it would sit above the card).
const SESSION = { access_token: 'x', refresh_token: 'y', expires_at: 4102444800, token_type: 'bearer', user: { id: UID, email: EMAIL, user_metadata: { full_name: 'Test Teacher' }, app_metadata: { provider: 'email' } } };
const HYDRATE_MS = 30000;   // a page load + hydration
const WRITE_MS = 4000;      // the 2 s write-through debounce plus one request
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ---------- the module's canonical hash, in Node (seeds carry memory records and the fake's rows carry data_hash) ---------- */
function canonJson(v) {
  if (v === undefined) return 'null';
  if (v === null || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v);
  if (typeof v !== 'object') return 'null';
  if (typeof v.toJSON === 'function') return canonJson(v.toJSON());
  if (Array.isArray(v)) return '[' + v.map(canonJson).join(',') + ']';
  const keys = Object.keys(v).filter(k => v[k] !== undefined && typeof v[k] !== 'function').sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonJson(v[k])).join(',') + '}';
}
const hashOf = (v) => '1.' + crypto.createHash('sha256').update(canonJson(v), 'utf8').digest('base64url');

/* ---------- the fake cloud ---------- */
// The account's rows, answered the way PostgREST would for the queries the module makes. Every call is logged
// as { m, table, search, body, status, rows }. Flags: failUser (401 on /auth/v1/user), failLogout (500 on
// /auth/v1/logout), revoked (401 on every /rest call: the token is dead server-side), refuse(m, body) → a
// { status, body } to answer instead, abortWhen(url, m) → the connection dies.
class FakeCloud {
  constructor(rows) { this.n = 0; this.log = []; this.rows = (rows || []).map(r => this.fresh(r)); this.failUser = false; this.failLogout = false; this.revoked = false; this.refuse = null; this.abortWhen = null; this.user = JSON.parse(JSON.stringify(SESSION.user)); }
  stamp() { return new Date(Date.UTC(2026, 8, 14, 20, 0, 0) + (++this.n) * 1000).toISOString(); }
  fresh(r) {
    const at = this.stamp();
    return Object.assign({ id: crypto.randomUUID(), user_id: UID, created_at: at, updated_at: at, client_updated_at: null, data_hash: hashOf(r.data), bytes: Buffer.byteLength(canonJson(r.data)) }, r);
  }
  add(r) { const row = this.fresh(r); this.rows.push(row); return row; }
  find(kind, name, tool) { return this.rows.find(r => r.kind === kind && r.name === name && (!tool || r.tool === tool)); }
  pick(row, select) { if (!select) return row; const out = {}; select.split(',').forEach(k => { k = k.trim(); if (k) out[k] = row[k]; }); return out; }
  // eq.X and in.(a,b,"c d") filters on any column; select / order / offset / limit are not filters.
  filtersOf(q) {
    return [...q.entries()].filter(([k, v]) => !['select', 'order', 'offset', 'limit'].includes(k) && /^(eq|in)\./.test(v))
      .map(([k, v]) => v.startsWith('in.') ? [k, v.slice(4, -1).split(',').map(x => x.trim().replace(/^"(.*)"$/, '$1'))] : [k, v.slice(3)]);
  }
  handle(route) {
    const req = route.request(), url = new URL(req.url()), m = req.method(), headers = req.headers();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
    const json = (status, body, extra) => route.fulfill({ status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, cors, extra || {}), body: body === undefined ? '' : JSON.stringify(body) });
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (this.abortWhen && this.abortWhen(url, m)) { this.log.push({ m, path: url.pathname, search: url.search, aborted: true }); return route.abort('failed'); }
    // ---- Auth ----
    if (url.pathname.endsWith('/auth/v1/user')) {
      const entry = { m, kind: 'user', body: req.postData() ? JSON.parse(req.postData()) : null, status: this.failUser ? 401 : 200 };
      this.log.push(entry);
      if (this.failUser) return json(401, { code: 401, error_code: 'session_not_found', msg: 'Session from session_id claim in JWT does not exist' });
      if (m === 'PUT' && entry.body && entry.body.data) this.user.user_metadata = Object.assign({}, this.user.user_metadata, entry.body.data);
      return json(200, this.user);
    }
    if (url.pathname.endsWith('/auth/v1/token')) return json(200, Object.assign({ expires_in: 3600 }, SESSION, { user: this.user }));
    if (url.pathname.endsWith('/auth/v1/logout')) {
      this.log.push({ m, kind: 'logout', status: this.failLogout ? 500 : 204 });
      if (this.failLogout) return json(500, { code: 500, error_code: 'unexpected_failure', msg: 'auth unreachable (smoke)' });
      return route.fulfill({ status: 204, headers: cors });
    }
    // ---- PostgREST ----
    const tm = /\/rest\/v1\/([A-Za-z_]+)$/.exec(url.pathname);
    if (!tm) { this.log.push({ m, path: url.pathname, unexpected: true }); return json(404, { message: 'not found' }); }
    const table = tm[1], q = url.searchParams;
    if (this.revoked) { this.log.push({ m, table, search: url.search, status: 401, revoked: true }); return json(401, { code: 'PGRST301', details: null, hint: null, message: 'JWT expired' }); }
    if (table !== 'saves') { this.log.push({ m, table, search: url.search, status: 404 }); return json(404, { code: 'PGRST205', details: null, hint: null, message: "Could not find the table 'public." + table + "' in the schema cache" }); }
    const filters = this.filtersOf(q);
    const match = r => filters.every(([k, v]) => Array.isArray(v) ? v.includes(String(r[k])) : String(r[k]) === v);
    const single = /vnd\.pgrst\.object/.test(headers.accept || '');
    const represent = /return=representation/.test(headers.prefer || '') || q.has('select');
    const entry = { m, table, search: url.search, body: req.postData() ? JSON.parse(req.postData()) : null, status: 200, rows: 0 };
    this.log.push(entry);
    if (this.refuse) { const r = this.refuse(m, entry.body, url); if (r) { entry.status = r.status; entry.refused = true; return json(r.status, r.body); } }
    let rows = this.rows.filter(match);
    if (m !== 'POST') entry.hit = rows.map(r => r.kind + ':' + r.name);
    if (m === 'GET') {
      const order = (q.get('order') || '').split(',').filter(Boolean).map(s => { const p = s.split('.'); return [p[0], p[1] === 'desc' ? -1 : 1]; });
      if (order.length) rows = rows.slice().sort((a, b) => { for (const [k, d] of order) { if (a[k] < b[k]) return -d; if (a[k] > b[k]) return d; } return 0; });
      let from = 0, to = Infinity;
      const range = /^(\d+)-(\d+)$/.exec(headers.range || '');
      if (range) { from = Number(range[1]); to = Number(range[2]) + 1; }
      if (q.has('offset')) from = Number(q.get('offset'));
      if (q.has('limit')) to = from + Number(q.get('limit'));
      rows = rows.slice(from, to);
    } else if (m === 'POST') {
      const bodies = Array.isArray(entry.body) ? entry.body : [entry.body];
      const dup = bodies.find(b => this.rows.some(r => r.tool === b.tool && r.kind === b.kind && r.name === b.name));
      if (dup) { entry.status = 409; return json(409, { code: '23505', details: 'Key (user_id, tool, kind, name)=(' + [UID, dup.tool, dup.kind, dup.name].join(', ') + ') already exists.', hint: null, message: 'duplicate key value violates unique constraint "saves_user_id_tool_kind_name_key"' }); }
      rows = bodies.map(b => { const row = this.fresh(b); this.rows.push(row); return row; });
      entry.status = 201;
    } else if (m === 'PATCH') {
      rows.forEach(r => { Object.assign(r, entry.body); r.updated_at = this.stamp(); r.bytes = Buffer.byteLength(canonJson(r.data)); });
    } else if (m === 'DELETE') {
      this.rows = this.rows.filter(r => !match(r));
    } else {
      entry.status = 405;
      return json(405, { message: 'not expected here' });
    }
    entry.rows = rows.length;
    if (!represent && m !== 'GET') { entry.status = 204; return route.fulfill({ status: 204, headers: cors }); }
    const out = rows.map(r => this.pick(r, q.get('select')));
    if (single) {
      if (out.length !== 1) { entry.status = 406; return json(406, { code: 'PGRST116', details: 'The result contains ' + out.length + ' rows', hint: null, message: 'JSON object requested, multiple (or no) rows returned' }); }
      return json(entry.status, out[0]);
    }
    return json(entry.status, out, m === 'GET' ? { 'content-range': (out.length ? '0-' + (out.length - 1) : '*') + '/*' } : null);
  }
}

/* ---------- the story's data ---------- */
// The settings blobs are what the dashboard page itself writes (every key, normalized values), captured
// from one plain anonymous load: a second device holds exactly such a blob, and the laptop's row is that
// blob minus the registry's per-device fields.
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEK = { v: 1, periods: [{ start: '08:00', end: '08:45' }, { start: '08:45', end: '09:30' }], weekend: false, cells: {} };
DAYS.forEach(d => { WEEK.cells[d] = d === 'mon' ? ['Morning', 'Morning'] : d === 'tue' ? ['Morning', null] : [null, null]; });
let DEVICE_SETTINGS = null, ACCOUNT_SETTINGS = null, OMIT = [];
const omitted = (field, omit) => omit.some(p => p === field || (p.startsWith('*') && field.endsWith(p.slice(1))) || (p.endsWith('*') && field.startsWith(p.slice(0, -1))));
const projectSettings = (blob) => Object.fromEntries(Object.entries(blob).filter(([k]) => !omitted(k, OMIT)));
async function captureDashboardBlob(browser) {
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  await ctx.route('**/*', route => (route.request().url().startsWith(BASE) ? route.continue() : route.abort()));
  const page = await ctx.newPage();
  await page.goto(BASE + '/classroom_dashboard.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.IvritSaves && document.readyState !== 'loading', null, { timeout: HYDRATE_MS });
  await page.waitForTimeout(1500);
  const out = await page.evaluate(() => {
    saveSettingsToStorage();
    const entry = window.IvritSaves.registry().find(e => e.tool === 'Dashboard' && e.kind === 'settings') || {};
    return { blob: JSON.parse(localStorage.getItem('hebrewDashboard_settings')), omit: entry.omit || [] };
  });
  await ctx.close();
  const base = out.blob;
  OMIT = out.omit;
  DEVICE_SETTINGS = Object.assign({}, base, { location: 'Boston, MA', dashTextHTML: '<div>hi</div>', rosters: { dev1_0: { name: 'My class', names: [] } }, activeRosterId: 'dev1_0', pickerSessions: {}, zoomLevel: 110 });
  const laptop = Object.assign({}, base, { location: 'Atlanta, GA', engDateFmt: 'LONG', dashTextHTML: '<div>Boker tov!</div>', scheduleEnabled: true, scheduleShowCountdown: true, scheduleShowPeriods: true, countdownShowPresetName: true, scheduleWeek: WEEK, presetColors: { Morning: '#aabbcc' } });
  ACCOUNT_SETTINGS = projectSettings(laptop);   // what the laptop's upload projected
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
const WORKSHEET_ROWS = () => [
  { tool: 'Worksheet', kind: 'preset', name: 'Week 1', data: { selectedLetters: ['א', 'ב'], selectedVowels: ['kamatz'], pageSize: 'letter' } },
  { tool: 'Worksheet', kind: 'preset', name: 'Review', data: { selectedLetters: ['ג'], selectedVowels: ['patach'] } },
  { tool: 'Worksheet', kind: 'presetFolders', name: 'default', data: { v: 1, root: [{ t: 'folder', id: 'f1', name: 'Fall', collapsed: false, children: [{ t: 'item', name: 'Week 1' }] }, { t: 'item', name: 'Review' }] } }
];
const DICT_ROWS = () => [
  { tool: 'Dictionary', kind: 'wordList', name: 'm1abc_x1y2z', data: { name: 'Week 3 words', created: 1700000000000, updated: 1700000100000, words: [{ word: 'שָׁלוֹם', translation: 'peace', translit: 'shalom', pos: 'noun', era: 'bib' }] } },
  { tool: 'Dictionary', kind: 'wordList', name: 'm1abd_q9w8e', data: { name: 'Colors', created: 1700000200000, updated: 1700000300000, words: [{ word: 'אָדֹם', translation: 'red', translit: 'adom', pos: 'adj', era: 'mod' }] } }
];
const B64 = 'AAEAAAALAIAAAwAwT1MvMg==';   // not a real face: the module only decodes it, nothing loads it here
const FONT_ROW = (name) => ({ tool: 'Suite', kind: 'font', name: name || 'Morah Handwriting', data: { name: name || 'Morah Handwriting', b64: B64, family: name || 'Morah Handwriting' } });
const PROFILES = { activeProfile: 'Sarah', profiles: { Sarah: { created: 1700000000000, order: 1700000000000, results: [{ savedAt: '2026-09-01T10:00:00.000Z', pct: 90, correct: 9, total: 10, timeSec: 40, timerMode: 'off', settings: {}, cards: [] }], ladder: { levels: { l1: { bestPct: 90, passedAt: '2026-09-01T10:00:00.000Z' } } } } } };
const TROPE_PROGRESS = { v: 1, tropes: { etnachta: { r: 3, w: 1 }, sofpasuk: { r: 5, w: 0 } }, families: { disjunctive: true }, pbStreak: 4 };
// A memory record the module would have written for a fake row, as the seed's sync memory carries it.
const memOf = (row) => ({ h: row.data_hash, id: row.id, u: row.updated_at, at: '2026-09-14T00:00:00.000Z' });
// The seed: a remembered session, the chip's name cache, and (unless meta2:false — a fresh device) the v2 sync
// memory with hydrated[uid] set (not the first hydration: no card) and `memory` = users[uid]. device: the
// dashboard's own blob. The dashboard's first-run card is marked seen (a device that has been set up).
const SEED = (opts = {}) => {
  const s = {};
  s[AUTH_KEY] = JSON.stringify(SESSION);
  s.ivritSuite_accountCache = JSON.stringify({ email: EMAIL, name: 'Test Teacher' });
  if (opts.meta2 !== false) {
    const m = { v: 2, users: {}, legacy: {}, hydrated: {} };
    if (opts.hydrated !== false) m.hydrated[UID] = '2026-09-14T00:00:00.000Z';
    if (opts.memory) m.users[UID] = opts.memory;
    s.ivritSuite_syncMeta2 = JSON.stringify(m);
  }
  if (opts.device) s.hebrewDashboard_settings = JSON.stringify(opts.device === true ? DEVICE_SETTINGS : opts.device);
  if (!opts.firstRun) s.hebrewDashboard_setupSeen = '1';
  Object.assign(s, opts.extra || {});
  return s;
};

/* ---------- harness ---------- */
const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !detail ? '' : ' — ' + detail)); }
async function startServer() {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE + '/index.html', { method: 'HEAD' }); if (r.ok) return srv; } catch (e) {}
    await sleep(200);
  }
  throw new Error('http.server did not start');
}
// One context per scenario: localStorage seeded once (a second page in the same context keeps what the first
// one synced), the SDK served from the file, the project's origin answered by the fake cloud. Every load
// snapshots localStorage into window.__lsAtLoad before the page's scripts run (what a sign-out or an erase left)
// and records the module's window events.
async function openContext(browser, cloud, seed) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await ctx.addInitScript((seed) => {
    if (!localStorage.getItem('__smoke_seeded')) { for (const k of Object.keys(seed)) localStorage.setItem(k, seed[k]); localStorage.setItem('__smoke_seeded', '1'); }
    try { window.__lsAtLoad = JSON.stringify(Object.assign({}, localStorage)); } catch (e) {}
    window.__ev = { fonts: [], hydrated: [], prefs: [] };
    window.addEventListener('ivritsuite:fonts', e => window.__ev.fonts.push(e.detail && e.detail.name));
    window.addEventListener('ivritsuite:hydrated', e => window.__ev.hydrated.push(e.detail));
    window.addEventListener('ivritsuite:prefs', e => window.__ev.prefs.push(e.detail));
  }, seed);
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (u === CFG.sdk) return route.fulfill({ status: 200, body: SDK_BYTES, headers: { 'content-type': 'application/javascript; charset=utf-8', 'access-control-allow-origin': '*' } });
    if (cloud && u.startsWith(CFG.url)) return cloud.handle(route);
    return route.abort();
  });
  return ctx;
}
const DASH_TOOLS = ['Dashboard', 'Suite'], GEN_TOOLS = ['Worksheet', 'Suite', 'Dictionary'];
// Opens a page and waits for the signed-in state and a settled hydration of `tools`. Native dialogs are
// answered by `dialogs.mode` ('accept' | 'dismiss', flip it per step) and recorded in `dialogs.seen`.
async function openPage(ctx, file, { tools = DASH_TOOLS, signedIn = true, settle = true } = {}) {
  const page = await ctx.newPage();
  const errors = [], dialogs = { mode: 'accept', seen: [] }, warnings = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /\[(saves|account)\]/.test(m.text())) warnings.push(m.text().slice(0, 240)); });
  page.on('dialog', d => { dialogs.seen.push({ type: d.type(), message: d.message() }); if (dialogs.mode === 'dismiss') d.dismiss().catch(() => {}); else d.accept().catch(() => {}); });
  if (process.env.SMOKE_DEBUG) page.on('console', m => console.log('    [page]', m.type(), m.text().slice(0, 300)));
  await page.goto(BASE + '/' + file, { waitUntil: 'domcontentloaded' });
  if (signedIn) {
    await page.waitForFunction(() => window.IvritAccount && window.IvritSaves && IvritAccount.status() === 'signed-in', null, { timeout: HYDRATE_MS });
    if (settle) await settled(page, tools, HYDRATE_MS);
  } else {
    await page.waitForFunction(() => window.I18n && document.readyState !== 'loading', null, { timeout: HYDRATE_MS }).catch(() => {});
    await page.waitForTimeout(800);
  }
  return { page, errors, dialogs, warnings };
}
// True once the module reports settled(tools) within ms; false on a timeout (the check then prints the state).
async function settled(page, tools, ms) {
  return page.waitForFunction((tools) => window.IvritSaves && IvritSaves._test.settled(tools), tools, { timeout: ms || WRITE_MS }).then(() => true, () => false);
}
// Waits until fn(cloud.log) is truthy, polling; false on a timeout.
async function waitLog(fn, ms) {
  const t = Date.now();
  while (Date.now() - t < (ms || WRITE_MS)) { if (fn()) return true; await sleep(50); }
  return !!fn();
}
// After a click that reloads the page: resolves once a NEW document is signed out and past loading.
async function afterReload(page, ms) {
  const t = Date.now();
  while (Date.now() - t < (ms || HYDRATE_MS)) {
    try { if (await page.evaluate(() => !window.__before && !!window.IvritAccount && IvritAccount.status() !== 'loading' && document.readyState !== 'loading')) return true; } catch (e) {}
    await sleep(100);
  }
  return false;
}
async function clickSignOut(page) {
  await page.evaluate(() => { window.__before = true; IvritAccount.openMenu(); });
  await page.locator('[data-ivk="signout"]').click();
  return afterReload(page);
}
const ls = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);
const lsJSON = async (page, key) => { const v = await ls(page, key); return v === null ? null : JSON.parse(v); };
const lsAtLoad = (page) => page.evaluate(() => JSON.parse(window.__lsAtLoad || '{}'));
const statusText = (page, host) => page.evaluate((h) => { const n = document.querySelector(h + ' .ivsav-status'); return n ? n.textContent : null; }, host);
const overlays = (page) => page.evaluate(() => document.querySelectorAll('.ivsav-overlay, .ivacct-modal').length);
const meta2 = (page) => lsJSON(page, 'ivritSuite_syncMeta2');
const memoryOf = async (page, tool, kind) => { const m = (await meta2(page)) || {}; return Object.keys((((m.users || {})[UID] || {})[tool] || {})[kind] || {}).sort(); };
const fontsIn = (page) => page.evaluate(() => listUserFonts().then(l => l.map(f => f.name).sort()));
const fontBytes = (page, b64) => page.evaluate((b64) => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }, b64);
// A row's state from the last classification; an untouched empty default class (a seed) reads 'seed'.
const planStates = (page, tool) => page.evaluate((tool) => { const p = window.IvritSaves.lastPlan(tool); return p ? Object.fromEntries(p.rows.map(r => [r.kind + ':' + r.name, r.seed && r.state === 'local-only' ? 'seed' : r.state])) : null; }, tool || 'Dashboard');
const allSame = (states) => !!states && Object.values(states).every(v => v === 'synced' || v === 'seed');
const dashState = (page) => page.evaluate((UID) => {
  const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings') || 'null');
  const meta = JSON.parse(localStorage.getItem('ivritSuite_syncMeta2') || '{}');
  const mem = (((meta.users || {})[UID] || {}).Dashboard || {}).settings;
  return {
    enabled: s && s.scheduleEnabled, periods: s && s.scheduleWeek ? s.scheduleWeek.periods.length : 0, mon: s && s.scheduleWeek ? s.scheduleWeek.cells.mon[0] : null,
    color: s && s.presetColors && s.presetColors.Morning, location: s && s.location, rosters: s ? Object.keys(s.rosters || {}).sort() : [], active: s && s.activeRosterId, zoom: s && s.zoomLevel,
    presets: Object.keys(JSON.parse(localStorage.getItem('hebrewDashboard_presets') || '{}')), schedules: Object.keys(JSON.parse(localStorage.getItem('hebrewDashboard_schedules') || '{}')),
    memory: !!(mem && mem.default && typeof mem.default.h === 'string' && mem.default.h.indexOf('1.') === 0)
  };
}, UID);
const liveDash = (page) => page.evaluate(() => ({
  checked: document.getElementById('scheduleEnabled').checked,
  bodyShown: document.getElementById('scheduleSyncBody').style.display !== 'none',
  schedules: (document.getElementById('savedScheduleList') || {}).textContent || '',
  presets: (document.getElementById('presetList') || {}).textContent || ''
}));
const pickerState = (page) => page.evaluate(() => {
  const sel = document.getElementById('pickerClassSel'), note = document.getElementById('pickerClassNote');
  return { value: sel ? sel.value : null, options: sel ? [...sel.options].map(o => o.textContent) : [], chips: (document.getElementById('pickerChips') || {}).textContent || '', note: note && note.style.display !== 'none' ? note.textContent : '', toast: (document.getElementById('appToast') || {}).textContent || '' };
});
const treeOf = (t) => { const out = []; (function walk(arr, p) { (arr || []).forEach(n => { if (n.t === 'item') out.push(p + n.name); else { out.push(p + n.name + '/'); walk(n.children || [], p + n.name + '/'); } }); })(t.root, ''); return out; };
const param = (e, k) => new URLSearchParams(e.search || '').get(k);
const reqs = (cloud, from, m, kind) => cloud.log.slice(from).filter(e => e.table === 'saves' && (!m || e.m === m) && (!kind || (e.body && e.body.kind === kind)));
const patchesOn = (cloud, id) => cloud.log.filter(e => e.m === 'PATCH' && param(e, 'id') === 'eq.' + id).length;
const methods = (cloud, from) => cloud.log.slice(from).map(e => e.m + (e.table ? ' ' + e.table : e.kind ? ' ' + e.kind : '') + (e.body && e.body.kind ? ' ' + e.body.kind + ':' + e.body.name : e.hit && e.m !== 'GET' ? ' ' + e.hit.join(',') : e.hit && e.hit.length === 1 ? ' ' + e.hit[0] : '') + (e.status && e.status !== 200 && e.status !== 201 ? ' ' + e.status : '') + (e.rows === 0 && e.m !== 'GET' ? ' (0 rows)' : '')).join(' | ');

const browser = await chromium.launch();
const srv = await startServer();
try {
  const cap = await captureDashboardBlob(browser);
  check('0: captured the dashboard\'s own settings blob and the registry\'s per-device fields', cap.keys > 40 && cap.omit.includes('rosters') && cap.omit.includes('zoomLevel') && !('rosters' in ACCOUNT_SETTINGS) && ACCOUNT_SETTINGS.scheduleEnabled === true, JSON.stringify(cap));

  // ---- 1. hydrate at load: a fresh device on the generator takes the account's rows without a click ----
  if (want(1)) {
    const cloud = new FakeCloud(WORKSHEET_ROWS().concat(DICT_ROWS()));
    const initialIds = cloud.rows.map(r => r.id).sort();
    const ctx = await openContext(browser, cloud, SEED({ meta2: false }));
    const { page, errors } = await openPage(ctx, 'hebrew_blend_generator.html', { tools: GEN_TOOLS });
    const r = await page.evaluate((UID) => ({
      presets: Object.keys(JSON.parse(localStorage.getItem('hebrewBlender_presets') || '{}')).sort(),
      tree: JSON.parse(localStorage.getItem('hebrewBlender_presetsFolders') || 'null'),
      lists: Object.keys((JSON.parse(localStorage.getItem('ivritSuite_wordLists') || '{}').lists) || {}).sort(),
      rendered: (document.getElementById('presetList') || {}).textContent || '',
      status: (document.querySelector('#cloudSavesPanel .ivsav-status') || {}).textContent || '',
      overlays: document.querySelectorAll('.ivsav-overlay, .ivacct-modal').length,
      hydrated: !!((JSON.parse(localStorage.getItem('ivritSuite_syncMeta2') || '{}').hydrated || {})[UID]),
      events: window.__ev.hydrated.map(d => ({ tools: d.tools, ok: d.ok, first: d.first }))
    }), UID);
    check('1: the presets and their folder tree landed and the page rendered them', JSON.stringify(r.presets) === '["Review","Week 1"]' && r.tree && JSON.stringify(treeOf(r.tree)) === '["Fall/","Fall/Week 1","Review"]' && /Week 1/.test(r.rendered) && /Review/.test(r.rendered), JSON.stringify({ presets: r.presets, tree: r.tree && treeOf(r.tree), rendered: r.rendered.slice(0, 80) }));
    check('1: the Dictionary word lists landed too (alsoPull)', JSON.stringify(r.lists) === '["m1abc_x1y2z","m1abd_q9w8e"]', JSON.stringify(r.lists));
    check('1: the status line reads "Saved in your account", no card, the first hydration is marked', /^Saved in your account · /.test(r.status) && r.overlays === 0 && r.hydrated && r.events.some(e => e.first && e.ok), JSON.stringify({ status: r.status, overlays: r.overlays, hydrated: r.hydrated, events: r.events }));
    const gets = cloud.log.filter(e => e.m === 'GET' && e.table === 'saves');
    const listings = gets.filter(e => /^in\./.test(param(e, 'tool') || '')), loads = gets.filter(e => /^eq\./.test(param(e, 'id') || ''));
    const firstTools = listings.length ? (param(listings[0], 'tool') || '').slice(4, -1).split(',') : [];
    check('1: the listing is one GET with tool=in.(…) over every tool and select=tool,… (a first hydration is device-wide)', listings.length >= 1 && /^tool,/.test(param(listings[0], 'select') || '') && ['Suite', 'Worksheet', 'FlashCards', 'Dictionary', 'TorahTrainer', 'TropeTutor', 'Dashboard'].every(t => firstTools.includes(t)) && /^tool\.asc,kind\.asc,name\.asc,id\.asc/.test(param(listings[0], 'order') || ''), JSON.stringify({ listings: listings.map(e => e.search) }));
    // Every fetched row is one that landed (2 presets, the tree, 2 word lists); a word list with no local copy is read
    // once more for its label (the row name is an id; the listing carries no data), so 5 rows cost 7 loads, none of them twice for data.
    const landedIds = initialIds, loadedIds = [...new Set(loads.map(e => (param(e, 'id') || '').slice(3)))].sort();
    check('1: only the rows that landed were fetched (2 presets, 1 tree, 2 word lists — the two word lists once more for their label)', JSON.stringify(loadedIds) === JSON.stringify(landedIds) && loads.length === 7, JSON.stringify({ loads: loads.length, landed: landedIds.length, loaded: loadedIds.length, gets: gets.map(e => e.search) }));
    const before = cloud.log.length;
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.IvritAccount && window.IvritSaves && IvritAccount.status() === 'signed-in', null, { timeout: HYDRATE_MS });
    const ok2 = await settled(page, GEN_TOOLS, HYDRATE_MS);
    const gets2 = cloud.log.slice(before).filter(e => e.m === 'GET' && e.table === 'saves');
    const loads2 = gets2.filter(e => /^eq\./.test(param(e, 'id') || '')), listings2 = gets2.filter(e => /^in\./.test(param(e, 'tool') || ''));
    const secondTools = listings2.length ? (param(listings2[0], 'tool') || '').slice(4, -1).split(',').sort() : [];
    check('1: a reload lists only this page\'s tools and fetches no row (every hash matches the memory)', ok2 && loads2.length === 0 && listings2.length >= 1 && JSON.stringify(secondTools) === '["Dictionary","Suite","Worksheet"]' && /^Saved in your account/.test(await statusText(page, '#cloudSavesPanel') || ''), JSON.stringify({ ok2, loads: loads2.length, tools: secondTools, calls: methods(cloud, before) }));
    await page.screenshot({ path: path.join(SHOTS, '1-generator-hydrated.png') });
    check('1: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 2. a tool opened later on a hydrated device: the account's settings win over the page's fresh defaults ----
  if (want(2)) {
    const cloud = new FakeCloud(CLOUD_ROWS().concat(WORKSHEET_ROWS()));
    const wk = cloud.find('preset', 'Week 1', 'Worksheet');
    const ctx = await openContext(browser, cloud, SEED({ memory: { Worksheet: { preset: { 'Week 1': memOf(wk) } } }, extra: { hebrewBlender_presets: JSON.stringify({ 'Week 1': wk.data }) } }));
    const settingsRow = cloud.find('settings', 'default'), stampBefore = settingsRow.updated_at;
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    const d = await dashState(page), live = await liveDash(page), pk = await pickerState(page), states = await planStates(page);
    check("2: the account's settings landed over the page's freshly written defaults, this device's own fields kept", d.enabled === true && d.periods === 2 && d.mon === 'Morning' && d.color === '#aabbcc' && d.location === 'Atlanta, GA' && d.rosters.length === 2 && d.rosters.includes('lap_0') && d.active === 'lap_0', JSON.stringify(d));
    check('2: the preset, the schedule and the class list came with it; the row reads synced in lastPlan and every dashboard row is synced or a seed', d.presets.includes('Morning') && d.schedules.includes('2026-2027') && d.memory && states && states['settings:default'] === 'synced' && allSame(states), JSON.stringify({ d, states }));
    check('2: the live page shows Schedule Sync on with its body, the schedule and the preset — no reload', live.checked && live.bodyShown && /2026-2027/.test(live.schedules) && /Morning/.test(live.presets), JSON.stringify(live));
    check("2: the picker adopted the account's class and said so; the empty default stays listed", pk.value === 'lap_0' && pk.options.some(o => /Kitah Alef \(2\)/.test(o)) && pk.options.some(o => /My class \(0\)/.test(o)) && /Noa/.test(pk.chips) && /Now showing Kitah Alef/.test(pk.note), JSON.stringify(pk));
    const pushed = cloud.log.filter(e => e.table === 'saves' && ((e.m === 'PATCH' && param(e, 'id') === 'eq.' + settingsRow.id) || (e.m === 'POST' && e.body && e.body.kind === 'settings')));
    const changedFields = Object.keys(Object.assign({}, settingsRow.data, ACCOUNT_SETTINGS)).filter(k => canonJson(settingsRow.data[k]) !== canonJson(ACCOUNT_SETTINGS[k])).map(k => k + ': ' + canonJson(ACCOUNT_SETTINGS[k]).slice(0, 60) + ' → ' + canonJson(settingsRow.data[k]).slice(0, 60));
    // The live page's re-apply gives its seeded Default preset a class colour once the weekly grid is in (presetColors):
    // the module pushes that normalized form up in one PATCH so both sides read the same; nothing else moves.
    check("2: at most one PATCH of the settings row, carrying only the page's own normalization (presetColors), nothing else pushed", pushed.length <= 1 && pushed.every(e => e.m === 'PATCH') && changedFields.every(f => /^presetColors: /.test(f)) && (pushed.length === 0 || settingsRow.updated_at !== stampBefore), JSON.stringify({ pushed: pushed.length, changedFields, calls: methods(cloud, 0) }));
    const canon = await page.evaluate(() => ({ same: IvritSaves._test.DASHBOARD_DEFAULT_PRESET_CANON === IvritSaves._test.canonJson(DEFAULT_PRESET.Default), module: IvritSaves._test.DASHBOARD_DEFAULT_PRESET_CANON.length, page: IvritSaves._test.canonJson(DEFAULT_PRESET.Default).length }));
    check("12: DASHBOARD_DEFAULT_PRESET_CANON equals canonJson of the page's own DEFAULT_PRESET.Default", canon.same, JSON.stringify(canon));
    await page.screenshot({ path: path.join(SHOTS, '2-dashboard-hydrated.png') });
    check('2: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 3. write-through: the page's own saves reach the account, conditionally ----
  if (want(3)) {
    const cloud = new FakeCloud(CLOUD_ROWS());
    const ctx = await openContext(browser, cloud, SEED({ device: true }));
    const { page, errors, dialogs } = await openPage(ctx, 'classroom_dashboard.html');
    let from = cloud.log.length;
    await page.evaluate(() => { document.getElementById('presetName').value = 'Evening'; savePreset(); });
    let ok = await settled(page, DASH_TOOLS);
    const local = await page.evaluate(() => JSON.parse(localStorage.getItem('hebrewDashboard_presets')).Evening);
    const posts = reqs(cloud, from, 'POST', 'preset');
    const row = cloud.find('preset', 'Evening');
    const others = reqs(cloud, from).filter(e => !(e.m === 'POST' && e.body.kind === 'preset') && !(e.m === 'PATCH' && (e.hit || []).join() === 'presetFolders:default'));
    check('3: a preset saved through the page → exactly one POST within 4 s, with tool/kind/name and the canonical hash of its data (plus the tree row the page filed it in)', ok && posts.length === 1 && posts[0].body.tool === 'Dashboard' && posts[0].body.name === 'Evening' && posts[0].body.data_hash === hashOf(local) && posts[0].body.data_hash === hashOf(posts[0].body.data) && !!row && others.length === 0, JSON.stringify({ ok, calls: methods(cloud, from), hash: posts[0] && posts[0].body.data_hash === hashOf(local) }));
    const stamp1 = row && row.updated_at;
    from = cloud.log.length;
    await page.evaluate(() => { settings.location = 'Haifa'; overwritePreset('Evening'); });
    ok = await settled(page, DASH_TOOLS);
    const patches = reqs(cloud, from, 'PATCH');
    check('3: an edit → one conditional PATCH carrying id=eq.<row> and updated_at=eq.<the fake\'s stamp>', ok && patches.length === 1 && param(patches[0], 'id') === 'eq.' + row.id && param(patches[0], 'updated_at') === 'eq.' + stamp1 && patches[0].rows === 1 && row.data.location === 'Haifa' && reqs(cloud, from).length === 1 && dialogs.seen.some(d => /Overwrite|overwrite|replace/i.test(d.message)), JSON.stringify({ ok, calls: methods(cloud, from), search: patches[0] && patches[0].search, stamp1 }));
    const stamp2 = row.updated_at;
    from = cloud.log.length;
    await page.evaluate(() => deletePreset('Evening'));
    ok = await settled(page, DASH_TOOLS);
    const dels = reqs(cloud, from, 'DELETE');
    check('3: a delete → one conditional DELETE (id=eq. and updated_at=eq.), the row gone, the confirm named the account', ok && dels.length === 1 && param(dels[0], 'id') === 'eq.' + row.id && param(dels[0], 'updated_at') === 'eq.' + stamp2 && dels[0].rows === 1 && !cloud.find('preset', 'Evening') && dialogs.seen.some(d => /removed from your account/.test(d.message)), JSON.stringify({ ok, calls: methods(cloud, from), search: dels[0] && dels[0].search }));
    from = cloud.log.length;
    await page.evaluate(() => savePresetsStorage());
    ok = await settled(page, DASH_TOOLS);
    check('3: an unchanged re-save → no request', ok && reqs(cloud, from).length === 0, JSON.stringify({ ok, calls: methods(cloud, from) }));
    // the refused PATCH: another device moved the row meanwhile (a newer stamp, other data)
    await page.evaluate(() => { document.getElementById('presetName').value = 'Night'; savePreset(); });
    ok = await settled(page, DASH_TOOLS);
    const night = cloud.find('preset', 'Night');
    const stale = night && night.updated_at;
    night.data = Object.assign({}, night.data, { headerLang: 'he', dowLang: 'en' }); night.updated_at = cloud.stamp(); night.data_hash = hashOf(night.data);
    from = cloud.log.length;
    await page.evaluate(() => { settings.location = 'Eilat'; overwritePreset('Night'); });
    ok = await settled(page, DASH_TOOLS, 8000);
    const refused = reqs(cloud, from, 'PATCH').filter(e => param(e, 'updated_at') === 'eq.' + stale);
    const presets = await page.evaluate(() => JSON.parse(localStorage.getItem('hebrewDashboard_presets')));
    const copy = cloud.find('preset', 'Night (from another device)');
    check('3: a PATCH the fake refuses (0 rows: the row moved behind the page\'s back) → the page re-hydrates and keeps both, no dialog', ok && refused.length === 1 && refused[0].rows === 0 && presets.Night && presets.Night.location === 'Eilat' && presets['Night (from another device)'] && presets['Night (from another device)'].headerLang === 'he' && !!copy && copy.data.headerLang === 'he' && night.data.location === 'Eilat' && (await overlays(page)) === 0, JSON.stringify({ ok, refused: refused.map(e => e.rows), local: Object.keys(presets), cloud: cloud.rows.filter(r => r.kind === 'preset').map(r => r.name), calls: methods(cloud, from) }));
    await page.screenshot({ path: path.join(SHOTS, '3-write-through.png') });
    check('3: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 4. two tabs: a page-write stamp marks the other tab stale, never rewrites its live setup; a stale blob deletes nothing ----
  if (want(4)) {
    const cloud = new FakeCloud(CLOUD_ROWS());
    const ctx = await openContext(browser, cloud, SEED({ device: true }));
    const A = await openPage(ctx, 'classroom_dashboard.html');
    const B = await openPage(ctx, 'classroom_dashboard.html');
    let from = cloud.log.length;
    const id = await A.page.evaluate(() => { const id = newRosterId(); settings.rosters[id] = { name: 'Kitah Bet', names: ['Ari', 'Dana'] }; switchClass(id); return id; });
    const okA = await settled(A.page, DASH_TOOLS);
    const postedA = reqs(cloud, from, 'POST', 'roster');
    const bLive = await B.page.evaluate((id) => ({ inMemory: !!settings.rosters[id], inStore: !!(JSON.parse(localStorage.getItem('hebrewDashboard_settings')).rosters || {})[id], options: [...document.getElementById('pickerClassSel').options].map(o => o.textContent) }), id);
    check("4: tab A's class went up (one POST); its page-write stamp left tab B's live setup alone (the class is in storage, not in B's memory or dropdown)", okA && postedA.length === 1 && postedA[0].body.name === id && bLive.inStore && !bLive.inMemory && !bLive.options.some(o => /Kitah Bet/.test(o)), JSON.stringify({ okA, posted: postedA.length, bLive }));
    // B's stale whole-blob write (its in-memory settings lack the class A added)
    from = cloud.log.length;
    await B.page.evaluate(() => { settings.location = 'Haifa'; saveSettingsToStorage(); });
    const okB = await settled(B.page, DASH_TOOLS, 8000);
    const delsB = reqs(cloud, from, 'DELETE');
    const bAfter = await B.page.evaluate((id) => ({ inMemory: !!settings.rosters[id], inStore: !!(JSON.parse(localStorage.getItem('hebrewDashboard_settings')).rosters || {})[id] }), id);
    check("4: tab B's stale whole-blob write deletes nothing in the account", okB && delsB.length === 0 && !!cloud.find('roster', id), JSON.stringify({ okB, deletes: delsB.map(e => e.search), rowKept: !!cloud.find('roster', id), calls: methods(cloud, from) }));
    check('4: tab B re-read the class on its next hydrate (the flush after a stale mark hydrates instead of diffing)', bAfter.inStore && bAfter.inMemory, JSON.stringify(bAfter));
    check('4: 0 pageerrors in both tabs', A.errors.length === 0 && B.errors.length === 0, A.errors.concat(B.errors).join(' | '));
    await ctx.close();
  }
  // ---- 5. Replace hidden while a session is stored ----
  if (want(5)) {
    const cloud = new FakeCloud(CLOUD_ROWS());
    const ctx = await openContext(browser, cloud, SEED({ device: true }));
    const askMode = (page) => page.evaluate(() => {
      window.__ask = ivritAskMode();
      const btns = [...document.querySelectorAll('.ivrit-ask-btn')].map(b => b.dataset.act);
      const box = document.querySelector('[aria-labelledby="ivritAskTitle"]');
      const out = { buttons: btns, note: box ? box.textContent : '', stored: IvritAccount.hasStoredSession(), user: !!IvritAccount.user() };
      const c = document.querySelector('.ivrit-ask-btn[data-act="cancel"]'); if (c) c.click();
      return out;
    });
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    const r = await askMode(page);
    check('5: the dashboard\'s restore dialog offers Merge only and shows the signed-in note', r.stored && JSON.stringify(r.buttons) === '["merge","cancel"]' && /Replace is not offered/.test(r.note), JSON.stringify(r));
    const hub = await openPage(ctx, 'index.html', { tools: [] });
    const r2 = await askMode(hub.page);
    check('5: the hub\'s AllTools restore dialog offers Merge only too', r2.stored && JSON.stringify(r2.buttons) === '["merge","cancel"]' && /Replace is not offered/.test(r2.note), JSON.stringify(r2));
    check('5: 0 pageerrors', errors.length === 0 && hub.errors.length === 0, errors.concat(hub.errors).join(' | '));
    await ctx.close();
  }
  // ---- 6. deletes propagate: gone here at the next hydrate, unless changed here since (then re-inserted) ----
  if (want(6)) {
    const rows = CLOUD_ROWS().filter(r => r.kind !== 'presetFolders').concat([
      { tool: 'Dashboard', kind: 'preset', name: 'Tefillah', data: { headerLang: 'he', showTimer: false } },
      { tool: 'Dashboard', kind: 'presetFolders', name: 'default', data: { v: 1, root: [{ t: 'item', name: 'Morning' }, { t: 'item', name: 'Tefillah' }] } }
    ]);
    const cloud = new FakeCloud(rows);
    const morning = Object.assign({}, cloud.find('preset', 'Morning')), tefillah = Object.assign({}, cloud.find('preset', 'Tefillah'));
    // device A took the account's presets, then deletes both through the page
    const ctxA = await openContext(browser, cloud, SEED({ device: true }));
    const A = await openPage(ctxA, 'classroom_dashboard.html');
    let from = cloud.log.length;
    await A.page.evaluate(() => { deletePreset('Morning'); deletePreset('Tefillah'); });
    const okA = await settled(A.page, DASH_TOOLS);
    const delsA = reqs(cloud, from, 'DELETE');
    check('6: device A deleted both presets → two conditional DELETEs, the rows gone', okA && delsA.length === 2 && delsA.every(e => /^eq\./.test(param(e, 'id') || '') && /^eq\./.test(param(e, 'updated_at') || '') && e.rows === 1) && !cloud.find('preset', 'Morning') && !cloud.find('preset', 'Tefillah'), JSON.stringify({ okA, calls: methods(cloud, from) }));
    check('6: 0 pageerrors on device A', A.errors.length === 0, A.errors.join(' | '));
    await ctxA.close();
    // device B synced both earlier (its memory holds them) and edited Tefillah since
    const seedB = SEED({ device: true, memory: { Dashboard: { preset: { Morning: memOf(morning), Tefillah: memOf(tefillah) } } },
      extra: { hebrewDashboard_presets: JSON.stringify({ Morning: morning.data, Tefillah: Object.assign({}, tefillah.data, { showTimer: true, note: 'edited here' }) }) } });
    const ctxB = await openContext(browser, cloud, seedB);
    from = cloud.log.length;
    const B = await openPage(ctxB, 'classroom_dashboard.html');
    const presetsB = await lsJSON(B.page, 'hebrewDashboard_presets');
    const postsB = reqs(cloud, from, 'POST', 'preset'), delsB = reqs(cloud, from, 'DELETE');
    const tefB = cloud.find('preset', 'Tefillah');
    check('6: on device B the deleted preset is gone at the next hydrate (its local copy matched the memory)', !presetsB.Morning && !cloud.find('preset', 'Morning') && (await memoryOf(B.page, 'Dashboard', 'preset')).indexOf('Morning') < 0, JSON.stringify({ presets: Object.keys(presetsB), memory: await memoryOf(B.page, 'Dashboard', 'preset') }));
    check('6: the preset B changed since is re-inserted (one POST), never removed; B deletes nothing; no card', presetsB.Tefillah && presetsB.Tefillah.note === 'edited here' && postsB.length === 1 && postsB[0].body.name === 'Tefillah' && !!tefB && tefB.data.note === 'edited here' && delsB.length === 0 && (await overlays(B.page)) === 0, JSON.stringify({ posts: postsB.map(e => e.body.name), deletes: delsB.length, calls: methods(cloud, from) }));
    check('6: 0 pageerrors on device B', B.errors.length === 0, B.errors.join(' | '));
    await ctxB.close();
  }
  // ---- 7. folder trees converge: filed beats unfiled, a move made here goes up by itself, a move made elsewhere comes down ----
  if (want(7)) {
    const rows = CLOUD_ROWS().map(r => r.kind === 'presetFolders' ? Object.assign({}, r, { data: { v: 1, root: [{ t: 'folder', id: 'f_w1', name: 'Week 1', collapsed: false, children: [{ t: 'item', name: 'Morning' }] }] } }) : r);
    const cloud = new FakeCloud(rows);
    const treeRow = () => cloud.find('presetFolders', 'default');
    const seed = SEED({ device: true, extra: {
      hebrewDashboard_presets: JSON.stringify({ Morning: { headerLang: 'en', showTimer: true } }),   // the account's preset, so its row reads synced
      hebrewDashboard_presetsFolders: JSON.stringify({ v: 1, root: [{ t: 'item', name: 'Morning' }, { t: 'folder', id: 'f_old', name: 'Old', collapsed: false, children: [] }] })
    } });
    const ctx = await openContext(browser, cloud, seed);
    const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
    const localTree = (pg) => lsJSON(pg, 'hebrewDashboard_presetsFolders');
    let tree = await localTree(page);
    check('7: after the hydration "Morning" is filed once, under Week 1, and the unrelated folder is kept', JSON.stringify(treeOf(tree)) === JSON.stringify(['Old/', 'Week 1/', 'Week 1/Morning']), JSON.stringify(treeOf(tree)));
    check('7: the account holds the same layout after one PATCH of the tree row', JSON.stringify(treeOf(treeRow().data)) === JSON.stringify(treeOf(tree)) && patchesOn(cloud, treeRow().id) === 1, JSON.stringify({ cloud: treeOf(treeRow().data), patches: patchesOn(cloud, treeRow().id) }));
    const synced = { tree: JSON.stringify(tree), presets: await ls(page, 'hebrewDashboard_presets'), mem: ((((await meta2(page)) || {}).users || {})[UID] || {}).Dashboard || {} };
    // the teacher moves "Morning" into a new folder here: the tree key is a registered key, so the write goes up by itself
    const from = cloud.log.length;
    await page.evaluate(() => {
      const t = JSON.parse(localStorage.getItem('hebrewDashboard_presetsFolders'));
      t.root.find(n => n.t === 'folder' && n.name === 'Week 1').children = [];
      t.root.push({ t: 'folder', id: 'f_w2', name: 'Week 2', collapsed: false, children: [{ t: 'item', name: 'Morning' }] });
      localStorage.setItem('hebrewDashboard_presetsFolders', JSON.stringify(t));
    });
    const ok = await settled(page, DASH_TOOLS);
    check('7: a folder move made here went up by itself within 4 s (one more PATCH of the tree row, nothing else)', ok && patchesOn(cloud, treeRow().id) === 2 && JSON.stringify(treeOf(treeRow().data)) === JSON.stringify(['Old/', 'Week 1/', 'Week 2/', 'Week 2/Morning']) && reqs(cloud, from).length === 1, JSON.stringify({ ok, cloud: treeOf(treeRow().data), calls: methods(cloud, from) }));
    check('7: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
    // the other device: it synced the earlier layout (its tree, and its memory of that sync) and has not touched it since
    const seedB = SEED({ device: true, memory: { Dashboard: { presetFolders: synced.mem.presetFolders, preset: synced.mem.preset } }, extra: { hebrewDashboard_presets: synced.presets, hebrewDashboard_presetsFolders: synced.tree } });
    const ctxB = await openContext(browser, cloud, seedB);
    const B = await openPage(ctxB, 'classroom_dashboard.html');
    const treeB = await localTree(B.page);
    check('7: the other device takes the moved layout — Morning under Week 2, Week 1 kept once and empty — and pushes nothing back', JSON.stringify(treeOf(treeB)) === JSON.stringify(['Old/', 'Week 1/', 'Week 2/', 'Week 2/Morning']) && patchesOn(cloud, treeRow().id) === 2, JSON.stringify({ tree: treeOf(treeB), patches: patchesOn(cloud, treeRow().id) }));
    check('7: 0 pageerrors on the other device', B.errors.length === 0, B.errors.join(' | '));
    await ctxB.close();
  }
  // ---- 8. fonts: they travel, a full My Fonts refuses the eleventh quietly, a deletion reaches the account, an eviction does not ----
  if (want(8)) {
    // (a) a device with no fonts takes the one in the account; the picker lists it; the hub's delete sends a DELETE
    {
      const cloud = new FakeCloud(WORKSHEET_ROWS().concat([FONT_ROW()]));
      const fontRow = cloud.find('font', 'Morah Handwriting');
      const ctx = await openContext(browser, cloud, SEED({}));
      const { page, errors } = await openPage(ctx, 'hebrew_blend_generator.html', { tools: GEN_TOOLS });
      await page.waitForFunction(() => MY_FONTS.some(f => f.name === 'Morah Handwriting'), null, { timeout: 10000 }).catch(() => {});
      const r = await page.evaluate(() => listUserFonts().then(l => ({ fonts: l.map(f => f.name), picker: MY_FONTS.map(f => f.name), events: window.__ev.fonts.slice(), memory: Object.keys(((((JSON.parse(localStorage.getItem('ivritSuite_syncMeta2') || '{}').users || {})['11111111-1111-4111-8111-111111111111'] || {}).Suite || {}).font) || {}) })));
      const bytes = await page.evaluate(() => getUserFont('Morah Handwriting').then(rec => rec && rec.bytes ? new Uint8Array(rec.bytes).length : 0));
      check('8a: the font landed in the shared store, ivritsuite:fonts fired, the picker re-listed it, the memory holds it', JSON.stringify(r.fonts) === '["Morah Handwriting"]' && r.events.includes('Morah Handwriting') && r.picker.includes('Morah Handwriting') && JSON.stringify(r.memory) === '["Morah Handwriting"]' && bytes === 16, JSON.stringify(Object.assign(r, { bytes })));
      check('8a: 0 pageerrors on the generator', errors.length === 0, errors.join(' | '));
      const hub = await openPage(ctx, 'index.html', { tools: [] });
      const from = cloud.log.length;
      await hub.page.evaluate(() => deleteMyFontFile('Morah Handwriting'));
      const okDel = await waitLog(() => reqs(cloud, from, 'DELETE').length > 0);
      const dels = reqs(cloud, from, 'DELETE');
      check('8a: deleteMyFontFile on the hub sends one conditional DELETE for the font row, the account and the store both drop it', okDel && dels.length === 1 && param(dels[0], 'id') === 'eq.' + fontRow.id && /^eq\./.test(param(dels[0], 'updated_at') || '') && !cloud.find('font', 'Morah Handwriting') && JSON.stringify(await fontsIn(hub.page)) === '[]' && hub.dialogs.seen.length === 1, JSON.stringify({ okDel, calls: methods(cloud, from), fonts: await fontsIn(hub.page) }));
      check('8a: 0 pageerrors on the hub', hub.errors.length === 0, hub.errors.join(' | '));
      await ctx.close();
    }
    // (b) the hub on a device that holds the ten fonts My Fonts allows (uploaded from here, so the account has their rows)
    {
      const cloud = new FakeCloud(WORKSHEET_ROWS());
      const ctx = await openContext(browser, cloud, SEED({}));
      const { page, errors } = await openPage(ctx, 'index.html', { tools: [] });
      let from = cloud.log.length;
      await page.evaluate(async (b64) => {
        const bin = atob(b64), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        for (let i = 1; i <= 10; i++) { await saveUserFont('Mine ' + i, u, 'Mine ' + i); await new Promise(r => setTimeout(r, 15)); }
      }, B64);
      const okUp = await waitLog(() => reqs(cloud, from, 'POST', 'font').length >= 10, 20000);
      await settled(page, ['Suite'], 10000);
      check('8b: ten fonts uploaded from the hub → one POST each (the wrapped saveUserFont)', okUp && reqs(cloud, from, 'POST', 'font').length === 10 && cloud.rows.filter(r => r.kind === 'font').length === 10, JSON.stringify({ posts: reqs(cloud, from, 'POST', 'font').map(e => e.body.name) }));
      const eleventh = cloud.add(FONT_ROW());
      from = cloud.log.length;
      await page.evaluate(() => IvritSaves._test.hydrate(['Suite']));
      await settled(page, ['Suite'], 10000);
      const st = await statusText(page, '#cloudStatus');
      check('8b: the eleventh font is refused quietly — no card, the status line names it, none of the teacher\'s is dropped, the account keeps the row', /Morah Handwriting/.test(st || '') && /My Fonts is full/.test(st || '') && (await overlays(page)) === 0 && (await fontsIn(page)).length === 10 && !(await fontsIn(page)).includes('Morah Handwriting') && !!cloud.find('font', 'Morah Handwriting') && reqs(cloud, from, 'DELETE').length === 0, JSON.stringify({ status: st, fonts: await fontsIn(page), calls: methods(cloud, from) }));
      // an upload at the cap evicts the oldest font here — an eviction is not a deletion
      from = cloud.log.length;
      await page.evaluate(async (b64) => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); await saveUserFont('Mine 11', u, 'Mine 11'); }, B64);
      const okNew = await waitLog(() => reqs(cloud, from, 'POST', 'font').length >= 1, 10000);
      await settled(page, ['Suite'], 10000);
      const fonts = await fontsIn(page);
      check('8b: the font evicted by the cap is not deleted from the account (the new one went up, no DELETE, "Mine 1" still in the account)', okNew && !fonts.includes('Mine 1') && fonts.includes('Mine 11') && fonts.length === 10 && reqs(cloud, from, 'DELETE').length === 0 && !!cloud.find('font', 'Mine 1') && !!cloud.find('font', 'Mine 11'), JSON.stringify({ fonts, calls: methods(cloud, from) }));
      from = cloud.log.length;
      await page.evaluate(() => IvritSaves._test.hydrate(['Suite']));
      await settled(page, ['Suite'], 10000);
      check('8b: a later hydrate neither deletes the evicted font from the account nor re-downloads it (the device is full)', reqs(cloud, from, 'DELETE').length === 0 && !!cloud.find('font', 'Mine 1') && !!eleventh && (await fontsIn(page)).length === 10, JSON.stringify({ calls: methods(cloud, from) }));
      await page.screenshot({ path: path.join(SHOTS, '8-fonts-cap.png') });
      check('8b: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
  // ---- 9. the device-extras card: the first sign-in on a device that holds its own saves ----
  if (want(9)) {
    const deviceBlob = Object.assign({}, DEVICE_SETTINGS, { rosters: { dev_0: { name: 'Kitah Alef', names: ['Noa', 'Eitan'] } }, activeRosterId: 'dev_0' });
    const extras = {
      hebrewDashboard_presets: JSON.stringify({ Morning: { headerLang: 'en', showTimer: true } }),
      hebrewFlashCards_profiles: JSON.stringify(PROFILES),
      hebrewTropeTutor_progress: JSON.stringify(TROPE_PROGRESS)
    };
    const EXPECT_LINES = ['Hebrew Classroom Dashboard — Presets: 1', 'Hebrew Classroom Dashboard — Class lists: 1', 'Hebrew Flash Cards — Student profiles: 1', 'Trope Tutor — Mastery progress: 1', 'IvritSuite — My Fonts: 1'].sort();
    // The font sits in IndexedDB before the dashboard opens: put there from a page that carries the fonts block but
    // none of the account scripts (resources.html), so nothing hydrates or uploads while it is written.
    const withFont = async (ctx) => {
      const p = await ctx.newPage();
      await p.goto(BASE + '/resources.html', { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => typeof saveUserFont === 'function', null, { timeout: 15000 });
      await p.evaluate(async (b64) => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); await saveUserFont('Teacher Font', u, 'Teacher Font'); }, B64);
      await p.close();
    };
    const openWithCard = async (cloud) => {
      const ctx = await openContext(browser, cloud, SEED({ meta2: false, device: deviceBlob, extra: extras }));
      await withFont(ctx);
      const { page, errors, dialogs } = await openPage(ctx, 'classroom_dashboard.html', { settle: false });
      await page.waitForFunction(() => !!document.querySelector('.ivsav-overlay .ivsav-card'), null, { timeout: HYDRATE_MS }).catch(() => {});
      const card = await page.evaluate(() => { const c = document.querySelector('.ivsav-overlay .ivsav-card'); return c ? { lines: [...c.querySelectorAll('li')].map(l => l.textContent).sort(), buttons: [...c.querySelectorAll('button')].map(b => b.dataset.act), nameStep: !!document.querySelector('.ivacct-modal') } : null; });
      return { ctx, page, errors, dialogs, card };
    };
    // C1. Add to my account
    {
      const cloud = new FakeCloud(WORKSHEET_ROWS());
      const { ctx, page, errors, card } = await openWithCard(cloud);
      check('9: the card opened on the first sign-in and lists the extras per tool and kind (the seeded Default preset and the untouched default class are not extras)', !!card && JSON.stringify(card.lines) === JSON.stringify(EXPECT_LINES) && JSON.stringify(card.buttons) === '["add","download","remove"]' && !card.nameStep, JSON.stringify(card));
      await page.screenshot({ path: path.join(SHOTS, '9-card.png') });
      const from = cloud.log.length;
      await page.click('.ivsav-overlay .ivsav-btn[data-act="add"]');
      const ok = await settled(page, DASH_TOOLS, HYDRATE_MS);
      const posts = reqs(cloud, from, 'POST');
      const kinds = posts.map(e => e.body.tool + '/' + e.body.kind + ':' + e.body.name).sort();
      check('9: Add → one POST for each extra, the card closed, hydrated[uid] set', ok && ['Dashboard/preset:Morning', 'Dashboard/roster:dev_0', 'FlashCards/profile:Sarah', 'Suite/font:Teacher Font', 'TropeTutor/progress:default'].every(k => kinds.includes(k)) && posts.filter(e => ['preset', 'roster', 'profile', 'font', 'progress'].includes(e.body.kind)).length === 5 && (await overlays(page)) === 0 && !!(((await meta2(page)) || {}).hydrated || {})[UID], JSON.stringify({ ok, kinds, calls: methods(cloud, from) }));
      check('9: 0 pageerrors (Add)', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // C2 + C3. Download a backup, then Remove from this device
    {
      const cloud = new FakeCloud(WORKSHEET_ROWS());
      const { ctx, page, errors, card } = await openWithCard(cloud);
      check('9: the card opened again on a fresh context with the same extras', !!card && JSON.stringify(card.lines) === JSON.stringify(EXPECT_LINES), JSON.stringify(card));
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('.ivsav-overlay .ivsav-btn[data-act="download"]')]);
      const file = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
      const keys = Object.keys(file.data || {}).sort();
      const cardStatus = await page.evaluate(() => (document.querySelector('.ivsav-overlay .ivsav-status') || {}).textContent || '');
      check('9: Download → an .ivrit whose JSON holds exactly those extras (an AllTools bundle, partial)', /\.ivrit$/.test(dl.suggestedFilename()) && file.tool === 'AllTools' && file.partial === true && JSON.stringify(keys) === '["dashboardPresets","dashboardRosters","flashCardProfiles","tropeTutorProgress","userFonts"]'
        && file.data.dashboardPresets.Morning.headerLang === 'en' && JSON.stringify(file.data.dashboardRosters.rosters.dev_0.names) === '["Noa","Eitan"]' && file.data.flashCardProfiles.profiles.Sarah && file.data.flashCardProfiles.activeProfile === null
        && file.data.userFonts['Teacher Font'].b64 === B64 && file.data.tropeTutorProgress.tropes.etnachta.r === 3 && /Downloaded a backup with 5 items/.test(cardStatus) && (await overlays(page)) === 1, JSON.stringify({ name: dl.suggestedFilename(), keys, cardStatus }));
      const from = cloud.log.length;
      await page.click('.ivsav-overlay .ivsav-btn[data-act="remove"]');
      const ok = await settled(page, DASH_TOOLS, HYDRATE_MS);
      await page.waitForTimeout(2500);   // past the 2 s debounce: a write-through the page might make on its own would have gone by now
      const after = await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings') || '{}');
        return { presets: Object.keys(JSON.parse(localStorage.getItem('hebrewDashboard_presets') || '{}')), rosters: Object.values(s.rosters || {}).map(r => r.name + ':' + (r.names || []).length), profiles: Object.keys((JSON.parse(localStorage.getItem('hebrewFlashCards_profiles') || '{}').profiles) || {}), progress: localStorage.getItem('hebrewTropeTutor_progress'), location: s.location };
      });
      const posted = (from) => reqs(cloud, from, 'POST').map(e => e.body.tool + '/' + e.body.kind + ':' + e.body.name);
      check('9: Remove (confirmed) → the extras left the device (the page re-seeded its Default preset; any class left is an untouched default), the font too', ok && !after.presets.includes('Morning') && after.rosters.every(r => r === 'My class:0') && !after.profiles.includes('Sarah') && after.progress === null && !(await fontsIn(page)).includes('Teacher Font') && (await overlays(page)) === 0, JSON.stringify(Object.assign(after, { fonts: await fontsIn(page) })));
      check('9: after Remove nothing of the removed kinds went up and the dashboard settings blob was NOT uploaded', !posted(from).some(k => /\/(preset|roster|profile|font|progress):/.test(k)) && !posted(from).includes('Dashboard/settings:default'), JSON.stringify({ posted: posted(from), calls: methods(cloud, from) }));
      const from2 = cloud.log.length;
      await page.evaluate(() => { settings.location = 'Haifa'; saveSettingsToStorage(); });
      const ok2 = await settled(page, DASH_TOOLS);
      const sRow = cloud.find('settings', 'default');
      check('9: a later page write → the settings blob goes up (one POST of Dashboard/settings carrying the change)', ok2 && posted(from2).includes('Dashboard/settings:default') && !!sRow && sRow.data.location === 'Haifa', JSON.stringify({ ok2, posted: posted(from2) }));
      check('9: 0 pageerrors (Download + Remove)', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
  // ---- 10. sign-out ----
  if (want(10)) {
    const signOutSeed = (extra) => SEED({ device: true, extra: Object.assign({ hebrewBlender_lang: 'en', hebrewBlender_darkMode: '0', hebrewBlender_hebFont: 'David Libre' }, extra || {}) });
    // S1. the chip's Sign out on the dashboard: memory-confirmed rows leave, the rest stays, the page reloads anonymous
    {
      const cloud = new FakeCloud(CLOUD_ROWS().concat([FONT_ROW()]));
      const ctx = await openContext(browser, cloud, signOutSeed());
      const { page, errors, dialogs, warnings } = await openPage(ctx, 'classroom_dashboard.html');
      const before = await dashState(page);
      const reloaded = await clickSignOut(page);
      const snap = await lsAtLoad(page);
      const s = JSON.parse(snap.hebrewDashboard_settings || '{}'), presets = JSON.parse(snap.hebrewDashboard_presets || '{}'), schedules = JSON.parse(snap.hebrewDashboard_schedules || '{}');
      const rosters = Object.values(s.rosters || {});
      const m2 = JSON.parse(snap.ivritSuite_syncMeta2 || '{}');
      check('S1: the device had taken the account\'s rows before the sign-out', before.presets.includes('Morning') && before.schedules.includes('2026-2027') && before.rosters.includes('lap_0') && before.enabled === true, JSON.stringify(before));
      check('S1: the confirm named the sign-out and the page reloaded', reloaded && dialogs.seen.some(d => /^Sign out\?/.test(d.message)), JSON.stringify({ reloaded, dialogs: dialogs.seen }));
      check('S1: memory-confirmed rows left the device: the preset and the schedule gone (the seeded Default kept), the settings blob keeps only per-device fields and no class from the account', !presets.Morning && !!presets.Default && !schedules['2026-2027'] && !('location' in s) && !('scheduleWeek' in s) && !(s.rosters || {}).lap_0 && rosters.every(r => r.name === 'My class' && !(r.names || []).length) && 'zoomLevel' in s, JSON.stringify({ presets: Object.keys(presets), schedules: Object.keys(schedules), settingsKeys: Object.keys(s).slice(0, 12), rosters, warnings }));
      check('S1: the sync memory of the removed rows and the hydration mark are gone', !(m2.hydrated || {})[UID] && Object.keys((((m2.users || {})[UID] || {}).Dashboard || {}).preset || {}).length === 0, JSON.stringify({ hydrated: m2.hydrated, dashboardMemory: Object.keys((((m2.users || {})[UID] || {}).Dashboard || {})), warnings }));
      check('S1: suite-wide preferences kept, the session key gone', snap.hebrewBlender_lang === 'en' && snap.hebrewBlender_darkMode === '0' && snap.hebrewBlender_hebFont === 'David Libre' && !Object.keys(snap).some(k => k.startsWith('sb-')), JSON.stringify({ lang: snap.hebrewBlender_lang, dark: snap.hebrewBlender_darkMode, font: snap.hebrewBlender_hebFont, sb: Object.keys(snap).filter(k => k.startsWith('sb-')) }));
      const after = await page.evaluate(() => ({ status: IvritAccount.status(), sb: Object.keys(localStorage).filter(k => k.startsWith('sb-')), stored: IvritAccount.hasStoredSession() }));
      const fonts = await fontsIn(page);
      check('S1: POST /auth/v1/logout was sent, the page is anonymous with no sb-* key, My Fonts kept', cloud.log.some(e => e.kind === 'logout' && e.m === 'POST') && after.status === 'anonymous' && after.sb.length === 0 && !after.stored && JSON.stringify(fonts) === '["Morah Handwriting"]', JSON.stringify({ after, fonts, logout: cloud.log.filter(e => e.kind === 'logout') }));
      await page.screenshot({ path: path.join(SHOTS, '10-signed-out.png') });
      check('S1: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // S2. an edit 500 ms before Sign out reaches the account before the logout
    {
      const cloud = new FakeCloud(CLOUD_ROWS());
      const ctx = await openContext(browser, cloud, signOutSeed());
      const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
      const row = cloud.find('settings', 'default');
      await page.evaluate(() => { settings.location = 'Haifa'; saveSettingsToStorage(); });
      await sleep(500);
      const reloaded = await clickSignOut(page);
      const iPatch = cloud.log.findIndex(e => e.m === 'PATCH' && param(e, 'id') === 'eq.' + row.id), iOut = cloud.log.findIndex(e => e.kind === 'logout');
      check('S2: the edit made 500 ms before Sign out reached the account (PATCH) before the logout', reloaded && iPatch >= 0 && iOut > iPatch && row.data.location === 'Haifa' && cloud.log[iPatch].rows === 1, JSON.stringify({ reloaded, iPatch, iOut, location: row.data.location, calls: methods(cloud, 0) }));
      check('S2: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // S3. what the account never took stays: a preset too big to upload, a class list the account refused
    {
      const cloud = new FakeCloud(CLOUD_ROWS());
      cloud.refuse = (m, body) => (m === 'POST' && body && body.kind === 'roster') ? { status: 400, body: { code: '23514', details: null, hint: null, message: 'new row for relation "saves" violates check constraint "saves_per_user_limit"' } } : null;
      const blob = Object.assign({}, DEVICE_SETTINGS, { rosters: { dev_9: { name: 'Kitah Tet', names: ['Lior', 'Tamar'] } }, activeRosterId: 'dev_9' });
      const ctx = await openContext(browser, cloud, SEED({ device: blob, extra: { hebrewDashboard_presets: JSON.stringify({ Big: { big: 'x'.repeat(1900000) }, Default: {} }) } }));
      const { page, errors, dialogs, warnings } = await openPage(ctx, 'classroom_dashboard.html');
      const st = await statusText(page, '#cloudSavesPanel');
      const reloaded = await clickSignOut(page);
      const snap = await lsAtLoad(page);
      const presets = JSON.parse(snap.hebrewDashboard_presets || '{}'), s = JSON.parse(snap.hebrewDashboard_settings || '{}');
      check('S3: before the sign-out the status line named the refusal and the confirm counted the unsynced items', /Couldn't save/.test(st || '') && dialogs.seen.some(d => /not in your account yet/.test(d.message)), JSON.stringify({ st, dialogs: dialogs.seen.map(d => d.message.slice(0, 120)) }));
      check('S3: the too-big preset and the class list the account refused survive the sign-out (neither reached the account)', reloaded && presets.Big && presets.Big.big.length === 1900000 && (s.rosters || {}).dev_9 && s.rosters.dev_9.names.length === 2 && !cloud.find('preset', 'Big') && !cloud.find('roster', 'dev_9'), JSON.stringify({ reloaded, presets: Object.keys(presets), rosters: Object.keys(s.rosters || {}) }));
      check('S3: what the account held left the device at the sign-out (the preset, the class list, the settings fields)', !presets.Morning && !(s.rosters || {}).lap_0 && !('location' in s), JSON.stringify({ presets: Object.keys(presets), rosters: Object.keys(s.rosters || {}), settingsKeys: Object.keys(s).slice(0, 8), warnings }));
      check('S3: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // S4. auth unreachable at sign-out: /logout answers 500 — the device is still signed out, no key re-created
    {
      const cloud = new FakeCloud(CLOUD_ROWS());
      cloud.failLogout = true;
      const ctx = await openContext(browser, cloud, signOutSeed());
      const { page, errors, warnings } = await openPage(ctx, 'classroom_dashboard.html');
      const reloaded = await clickSignOut(page);
      await page.waitForTimeout(1000);   // the SDK would re-persist a session it still held in memory right after the load
      const snap = await lsAtLoad(page);
      const after = await page.evaluate(() => ({ status: IvritAccount.status(), sb: Object.keys(localStorage).filter(k => k.startsWith('sb-')), presets: Object.keys(JSON.parse(localStorage.getItem('hebrewDashboard_presets') || '{}')) }));
      check('S4: with /logout answering 500 the page still reloads anonymous, no sb-* key before or after the load', reloaded && cloud.log.some(e => e.kind === 'logout' && e.status === 500) && after.status === 'anonymous' && after.sb.length === 0 && !Object.keys(snap).some(k => k.startsWith('sb-')), JSON.stringify({ reloaded, after, sbAtLoad: Object.keys(snap).filter(k => k.startsWith('sb-')), logout: cloud.log.filter(e => e.kind === 'logout') }));
      check('S4: the account\'s rows still left the device (the hooks ran before the failed logout)', !after.presets.includes('Morning'), JSON.stringify({ presets: after.presets, warnings }));
      check('S4: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // S5. a second tab during the first tab's sign-out: it reloads anonymous and keeps what it typed in the meantime (the
    //     server already refuses the token by then, so the class cannot go up and stays as the device's own data)
    {
      const cloud = new FakeCloud(CLOUD_ROWS());
      const ctx = await openContext(browser, cloud, signOutSeed());
      const T1 = await openPage(ctx, 'classroom_dashboard.html');
      const T2 = await openPage(ctx, 'classroom_dashboard.html');
      cloud.revoked = true;
      await T2.page.evaluate(() => { window.__before = true; const id = newRosterId(); settings.rosters[id] = { name: 'Kitah Tet', names: ['Lior'] }; switchClass(id); });
      const reloaded1 = await clickSignOut(T1.page);
      const reloaded2 = await afterReload(T2.page);
      const snap2 = await lsAtLoad(T2.page);
      const s2 = JSON.parse(snap2.hebrewDashboard_settings || '{}'), presets2 = JSON.parse(snap2.hebrewDashboard_presets || '{}');
      const after2 = await T2.page.evaluate(() => ({ status: IvritAccount.status(), sb: Object.keys(localStorage).filter(k => k.startsWith('sb-')), rosters: Object.values(JSON.parse(localStorage.getItem('hebrewDashboard_settings') || '{}').rosters || {}).map(r => r.name) }));
      check('S5: tab 1 reloaded anonymous; the class tab 2 typed never reached the account (the token was already refused)', reloaded1 && !cloud.rows.some(r => r.kind === 'roster' && r.data.name === 'Kitah Tet'), JSON.stringify({ reloaded1, calls: methods(cloud, 0) }));
      check("S5: tab 2 reloaded anonymous on tab 1's broadcast, the account's rows left it too, and the class it typed stayed as device data", reloaded2 && after2.status === 'anonymous' && after2.sb.length === 0 && !(s2.rosters || {}).lap_0 && !presets2.Morning && after2.rosters.includes('Kitah Tet') && Object.values(s2.rosters || {}).some(r => r.name === 'Kitah Tet'), JSON.stringify({ reloaded2, status: after2.status, sb: after2.sb, rostersAtLoad: Object.values(s2.rosters || {}).map(r => r.name), rostersNow: after2.rosters, presets: Object.keys(presets2), warnings: T1.warnings.concat(T2.warnings) }));
      check('S5: 0 pageerrors in both tabs', T1.errors.length === 0 && T2.errors.length === 0, T1.errors.concat(T2.errors).join(' | '));
      await ctx.close();
    }
    // S6. the account was deleted on another device: an empty listing plus 401 on /auth/v1/user → nothing is removed here
    {
      const cloud = new FakeCloud(CLOUD_ROWS());
      const mem = { Dashboard: { preset: { Morning: memOf(cloud.find('preset', 'Morning')) }, schedule: { '2026-2027': memOf(cloud.find('schedule', '2026-2027')) }, roster: { lap_0: memOf(cloud.find('roster', 'lap_0')) } } };
      const blob = Object.assign({}, DEVICE_SETTINGS, { rosters: { dev1_0: { name: 'My class', names: [] }, lap_0: { name: 'Kitah Alef', names: ['Noa', 'Eitan'] } }, activeRosterId: 'lap_0' });
      const ctx = await openContext(browser, cloud, SEED({ device: blob, memory: mem, extra: { hebrewDashboard_presets: JSON.stringify({ Morning: cloud.find('preset', 'Morning').data }), hebrewDashboard_schedules: JSON.stringify({ '2026-2027': cloud.find('schedule', '2026-2027').data }) } }));
      cloud.rows = []; cloud.failUser = true;
      const { page, errors } = await openPage(ctx, 'classroom_dashboard.html', { settle: false });
      await page.waitForFunction(() => IvritAccount.status() === 'anonymous', null, { timeout: HYDRATE_MS }).catch(() => {});
      await page.waitForTimeout(500);
      const r = await page.evaluate((UID) => ({ status: IvritAccount.status(), presets: Object.keys(JSON.parse(localStorage.getItem('hebrewDashboard_presets') || '{}')), schedules: Object.keys(JSON.parse(localStorage.getItem('hebrewDashboard_schedules') || '{}')), rosters: Object.keys(JSON.parse(localStorage.getItem('hebrewDashboard_settings') || '{}').rosters || {}).sort(), users: Object.keys(JSON.parse(localStorage.getItem('ivritSuite_syncMeta2') || '{}').users || {}), sb: Object.keys(localStorage).filter(k => k.startsWith('sb-')) }), UID);
      check('S6: the next hydrate on device B removes nothing (getUser answered 401): every local copy stays, the memory of that account is forgotten, the device is signed out', r.status === 'anonymous' && r.presets.includes('Morning') && r.schedules.includes('2026-2027') && r.rosters.includes('lap_0') && !r.users.includes(UID) && r.sb.length === 0 && cloud.log.some(e => e.kind === 'user' && e.status === 401) && cloud.log.filter(e => e.m === 'DELETE').length === 0, JSON.stringify({ r, calls: methods(cloud, 0) }));
      check('S6: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // S7. an old-module tab wrote a v1 ivritSuite_syncMeta beside the v2 memory: the v2 memory survives
    {
      const cloud = new FakeCloud(CLOUD_ROWS());
      const v1 = { v: 1, users: { [UID]: { Worksheet: { preset: { 'Old preset': { h: '1.oldhash', id: crypto.randomUUID(), u: '2026-09-01T00:00:00.000Z', at: '2026-09-01T00:00:00.000Z' } } } } }, welcomed: { [UID]: '2026-09-01T00:00:00.000Z' }, written: { Worksheet: { preset: 1757000000000 } } };
      const mem = { Dashboard: { preset: { Morning: memOf(cloud.find('preset', 'Morning')) } } };
      const ctx = await openContext(browser, cloud, SEED({ device: true, memory: mem, extra: { ivritSuite_syncMeta: JSON.stringify(v1), hebrewDashboard_presets: JSON.stringify({ Morning: cloud.find('preset', 'Morning').data }) } }));
      const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
      await page.evaluate(() => { settings.location = 'Haifa'; saveSettingsToStorage(); });
      const ok = await settled(page, DASH_TOOLS);
      const m2 = await meta2(page), m1 = await lsJSON(page, 'ivritSuite_syncMeta');
      const morningMem = ((((m2 || {}).users || {})[UID] || {}).Dashboard || {}).preset || {};
      check('S7: the v2 memory survives beside a v1 key: its records kept and extended, the v1 users untouched, the stamps still written to the old key', ok && m2 && m2.v === 2 && morningMem.Morning && morningMem.Morning.h === mem.Dashboard.preset.Morning.h && (await memoryOf(page, 'Dashboard', 'settings')).includes('default') && m1 && m1.v === 1 && JSON.stringify(m1.users) === JSON.stringify(v1.users) && m1.written && m1.written.Dashboard, JSON.stringify({ ok, m2users: Object.keys(m2 && m2.users || {}), morning: !!morningMem.Morning, m1users: m1 && Object.keys(m1.users || {}), written: m1 && m1.written }));
      check('S7: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // S8. only a v1 memory (the old module synced the settings row here) and a newer local edit: a PATCH, not a revert
    {
      const cloud = new FakeCloud(CLOUD_ROWS());
      const row = cloud.find('settings', 'default');
      const v1 = { v: 1, users: { [UID]: { Dashboard: { settings: { default: { h: row.data_hash, id: row.id, u: row.updated_at, at: '2026-09-01T00:00:00.000Z' } } } } }, welcomed: { [UID]: '2026-09-01T00:00:00.000Z' } };
      const blob = Object.assign({}, DEVICE_SETTINGS, ACCOUNT_SETTINGS, { location: 'Haifa' });   // the account's settings as the old module landed them, then edited here
      const ctx = await openContext(browser, cloud, SEED({ meta2: false, device: blob, extra: { ivritSuite_syncMeta: JSON.stringify(v1) } }));
      const { page, errors } = await openPage(ctx, 'classroom_dashboard.html');
      const d = await dashState(page), states = await planStates(page), m2 = await meta2(page);
      const legacyLeft = !!(((((m2 || {}).legacy || {})[UID] || {}).Dashboard || {}).settings || {}).default;
      check('S8: with a v1 memory and a newer local edit the row was PATCHed with this device\'s edit, not reverted; it reads synced and the v1 hint was consumed', patchesOn(cloud, row.id) === 1 && row.data.location === 'Haifa' && d.location === 'Haifa' && d.enabled === true && states && states['settings:default'] === 'synced' && d.memory && !legacyLeft && (await overlays(page)) === 0, JSON.stringify({ patches: patchesOn(cloud, row.id), cloudLocation: row.data.location, d, states, legacyLeft, calls: methods(cloud, 0) }));
      check('S8: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
  // ---- 11. Erase All on the hub while signed in ----
  if (want(11)) {
    const cloud = new FakeCloud(CLOUD_ROWS().concat(WORKSHEET_ROWS()));
    const ctx = await openContext(browser, cloud, SEED({ device: true }));
    const { page, errors, dialogs } = await openPage(ctx, 'index.html', { tools: [] });
    const runErase = async () => {
      await page.evaluate(() => { setTimeout(() => eraseAllSettings(), 0); });
      await page.locator('button[data-act="erase"]').click();
    };
    // a cancelled Erase (the final confirm dismissed) leaves write-through on
    dialogs.mode = 'dismiss';
    await runErase();
    await page.waitForTimeout(300);
    dialogs.mode = 'accept';
    let from = cloud.log.length;
    await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('hebrewBlender_presets') || '{}'); p['Hub preset'] = { fontSize: 20 }; localStorage.setItem('hebrewBlender_presets', JSON.stringify(p)); });
    const ok = await settled(page, ['Worksheet']);
    check('11: a cancelled Erase (its final confirm dismissed) leaves write-through on: a later page write still POSTs', dialogs.seen.some(d => /Erase everything on this device\? You are signed in/.test(d.message)) && ok && reqs(cloud, from, 'POST', 'preset').some(e => e.body.name === 'Hub preset') && !!cloud.find('preset', 'Hub preset', 'Worksheet') && (await ls(page, 'hebrewDashboard_presets')) !== null, JSON.stringify({ ok, dialogs: dialogs.seen.map(d => d.message.slice(0, 80)), calls: methods(cloud, from) }));
    // the real Erase: confirms accepted, no DELETE, the page ends anonymous
    from = cloud.log.length;
    await page.evaluate(() => { window.__before = true; });
    await runErase();
    const reloaded = await afterReload(page);
    const snap = await lsAtLoad(page);
    const after = await page.evaluate(() => ({ status: IvritAccount.status(), sb: Object.keys(localStorage).filter(k => k.startsWith('sb-')), keys: Object.keys(localStorage).filter(k => /^hebrew|^ivritSuite|^sb-/.test(k)).sort() }));
    check('11: Erase All signed in sends no DELETE (nothing reaches the account) and the page ends anonymous with the keys gone', reloaded && cloud.log.slice(from).filter(e => e.m === 'DELETE').length === 0 && after.status === 'anonymous' && after.sb.length === 0 && !Object.keys(snap).some(k => /^hebrewDashboard_|^hebrewBlender_presets|^ivritSuite_syncMeta|^sb-/.test(k)) && dialogs.seen.some(d => /erased|Erased/i.test(d.message)) && cloud.rows.some(r => r.kind === 'preset' && r.name === 'Morning'), JSON.stringify({ reloaded, after, snapKeys: Object.keys(snap).filter(k => /^hebrew|^ivritSuite|^sb-/.test(k)), calls: methods(cloud, from) }));
    check('11: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.kill();
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} checks passed; screenshots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
