/*
 * smoke-migration.mjs — the golden migration replay for the optional accounts (js/ivrit-saves.js).
 *
 * Proves, headlessly, that a teacher's whole setup moves from device A to a fresh device B with nothing
 * lost, and that every difference between the two devices afterwards is explainable. One fake cloud, one
 * account, several browser contexts:
 *
 *   0. Capture the real default blobs: each of the six tool pages is opened anonymously and made to write its
 *      own store (the page's writer, not a hand-written subset), so the seed below is what a page would hold.
 *   1. Build device A from those defaults: every boolean flipped, enums moved to other offered values, numbers
 *      changed, strings changed; items with folders nested two levels deep on every foldered list, students,
 *      word lists, classes, a weekly grid, the suite-wide preferences, Torah and Trope settings, mastery
 *      progress, a last worksheet setup naming a word list by id. A sanity check asserts every deliberate
 *      change differs from the default.
 *   2. Device A opens every tool once (each page writes back its own normalized form), then uploads everything
 *      from the home page's account screen; the cloud row count is the expected one and nothing was skipped.
 *   3. A fresh device B signs in on the home page, syncs everything, takes the account's settings where the
 *      screen asks, opens every tool page, syncs again from the last one (a page's normalized form may go up
 *      once), then once more: that run is quiet (0 / 0 / 0).
 *   4. The diff: every localStorage key of A and B is walked path by path and each difference classified —
 *      EXPECTED-OMIT (a per-device field the registry omits), EXPECTED-NEVER-SYNC (a key with no registry row
 *      and no suite-wide preference), EXPECTED-ENVELOPE (a mapIn envelope field), EXPECTED-SEED (an untouched
 *      empty default class one side minted), LOADER-NORMALIZED (an allowlisted path a page rewrites, each line
 *      justified below; an entry no difference hits is reported STALE-ALLOWLIST) — anything else is UNEXPECTED
 *      and fails the run. The table is printed either way: it is the "what moved" report.
 *   5. Round trip B → A: B changes a Torah setting, the dashboard's city, a suite-wide preference and adds a
 *      deck; A syncs and holds all four, its own per-device fields untouched.
 *   6. A folder move on B lands on A once, inside that folder, and both trees read Same.
 *   7. Deleted here: B deletes a student and a class through the pages' own functions; both read "Deleted on
 *      this device", a sync downloads nothing, "Delete from your account too" removes the student's row; A
 *      still holds both and lists the student as not in the account yet — a deletion never propagates by itself.
 *   8. The account backup from B is partial, carries the class lists and the suite-wide preferences, and lands
 *      on a third device's home page without the Merge/Replace question, its zoom untouched.
 *   9. The second-device story: a device B2 opens every tool anonymously first (each writes its defaults), then
 *      signs in: the account screen names every tool with a settings row plus IvritSuite under "Settings that
 *      differ"; Sync everything + "Use my account's settings" + every page once + a last sync, and the same
 *      classifier finds nothing unexpected.
 *
 * Every scenario ends with 0 pageerror. Run from the repo root:
 *   node scripts/smoke-migration.mjs --sdk path/to/supabase.js [--port 8084]
 * The script starts python3 -m http.server itself (port 8084, so it can run beside the other smokes).
 * SMOKE_DEBUG=1 echoes the pages' console.
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
const PORT = Number(arg('--port') || 8084);
const BASE = 'http://localhost:' + PORT;
const cfgSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/supabase-config.js'), 'utf8'), cfgSandbox);
const CFG = cfgSandbox.window.IVRIT_SUPABASE;
const AUTH_KEY = 'sb-' + new URL(CFG.url).hostname.split('.')[0] + '-auth-token';
const SDK_FILE = arg('--sdk');
const SDK_BYTES = SDK_FILE && fs.existsSync(SDK_FILE) ? fs.readFileSync(SDK_FILE) : null;
if (!SDK_BYTES) { console.error('smoke-migration: pass --sdk <path to the pinned supabase.js UMD build>'); process.exit(2); }
const SHOTS = process.env.SMOKE_SHOTS || path.join(process.env.TMPDIR || '/tmp', 'smoke-migration');
fs.mkdirSync(SHOTS, { recursive: true });
const SETTLE_MS = 1500;
const UID = '11111111-1111-4111-8111-111111111111';
const SESSION = { access_token: 'x', refresh_token: 'y', expires_at: 4102444800, token_type: 'bearer', user: { id: UID, email: 'teacher@example.org' } };

/* ---------- the fake cloud (as in smoke-sync.mjs) ---------- */
class FakeCloud {
  constructor(rows) { this.n = 0; this.log = []; this.rows = rows.map(r => this.fresh(r)); this.abortWhen = null; }
  stamp() { return new Date(Date.UTC(2026, 8, 14, 20, 0, 0) + (++this.n) * 1000).toISOString(); }
  fresh(r) { const at = this.stamp(); return Object.assign({ id: crypto.randomUUID(), user_id: UID, created_at: at, updated_at: at, client_updated_at: null, data_hash: null, bytes: JSON.stringify(r.data).length }, r); }
  find(kind, name, tool) { return this.rows.find(r => r.kind === kind && r.name === name && (!tool || r.tool === tool)); }
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
    const entry = { m, search: url.search, body: req.postData() ? JSON.parse(req.postData()) : null, status: 200, at: this.log.length };
    this.log.push(entry);
    let rows = this.rows.filter(match);
    if (m === 'GET') {
      const order = (q.get('order') || '').split(',').filter(Boolean).map(s => s.split('.')[0]);
      if (order.length) rows = rows.slice().sort((a, b) => { for (const k of order) { if (a[k] < b[k]) return -1; if (a[k] > b[k]) return 1; } return 0; });
      const off = Number(q.get('offset') || 0);
      rows = rows.slice(off, q.has('limit') ? off + Number(q.get('limit')) : undefined);
    } else if (m === 'POST') {
      const row = this.fresh(entry.body); this.rows.push(row); rows = [row]; entry.status = 201; entry.row = row;
    } else if (m === 'PATCH') {
      rows.forEach(r => { Object.assign(r, entry.body); r.updated_at = this.stamp(); r.bytes = JSON.stringify(r.data).length; });
      entry.rows = rows.map(r => r.tool + '/' + r.kind + '/' + r.name);
    } else if (m === 'DELETE') {
      entry.rows = rows.map(r => r.tool + '/' + r.kind + '/' + r.name);
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
// One context per device: localStorage seeded once, the SDK served from the file, the project's origin
// answered by the fake cloud, everything else aborted. blockAccount: the three account scripts are not served.
async function openContext(browser, cloud, seed, opts) {
  opts = opts || {};
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((seed) => { if (localStorage.getItem('__smoke_seeded')) return; for (const k of Object.keys(seed)) localStorage.setItem(k, seed[k]); localStorage.setItem('__smoke_seeded', '1'); }, seed || {});
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (opts.blockAccount && /\/js\/(ivrit-account|ivrit-saves|ivrit-projects|supabase-config)\.js/.test(u)) return route.abort();
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (u === CFG.sdk) return route.fulfill({ status: 200, body: SDK_BYTES, headers: { 'content-type': 'application/javascript; charset=utf-8', 'access-control-allow-origin': '*' } });
    if (cloud && u.startsWith(CFG.url)) return cloud.handle(route);
    return route.abort();
  });
  return ctx;
}
const PAGES = [
  { file: 'trope_tutor.html', tool: 'TropeTutor', writer: 'saveSettings(); saveSettingsFlush(); saveProgress();' },   // the flush writes only a pending save
  { file: 'torah_trainer.html', tool: 'TorahTrainer', writer: 'saveSettings(); saveSettingsFlush();' },
  { file: 'flash_cards.html', tool: 'FlashCards', writer: 'saveSettings();' },
  { file: 'hebrew_blend_generator.html', tool: 'Worksheet', writer: 'rememberSetup(true);' },
  { file: 'hebrew_dictionary.html', tool: 'Dictionary', writer: 'saveDictSessionFlush(); saveEmojiSettings();' },
  { file: 'classroom_dashboard.html', tool: 'Dashboard', writer: 'saveSettingsToStorage();' }
];
async function openPage(ctx, file, opts) {
  opts = opts || {};
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(file + ': ' + String(e && e.message || e)));
  if (process.env.SMOKE_DEBUG) page.on('console', m => console.log('    [' + file + ']', m.type(), m.text().slice(0, 300)));
  await page.goto(BASE + '/' + file, { waitUntil: 'domcontentloaded' });
  if (opts.anonymous) await page.waitForFunction(() => window.IvritSaves && document.readyState !== 'loading', null, { timeout: 25000 });
  else await page.waitForFunction(() => window.IvritAccount && window.IvritSaves && IvritAccount.status() === 'signed-in', null, { timeout: 25000 });
  await page.waitForTimeout(SETTLE_MS);
  return { page, errors };
}
// Open every tool page once (each applies what the store holds and writes back its own form), collecting errors.
async function visitAll(ctx, errorsOut, opts) {
  for (const P of PAGES) {
    const { page, errors } = await openPage(ctx, P.file, opts);
    await page.evaluate(P.writer).catch(e => errorsOut.push(P.file + ' writer: ' + e.message));
    await page.waitForTimeout(400);
    errorsOut.push(...errors);
    await page.close();
  }
}
const dump = (page) => page.evaluate(() => Object.assign({}, localStorage));
// The account screen speaks the page's language; device A is Hebrew, so every regex is bilingual.
const BUSY = 'Checking|Syncing|Updating|Uploading|Preparing|בודק|מסנכרן|מעדכן|מעלה|מכין';
const DONE = 'Sync finished|הסנכרון הסתיים';
const UPLOADED = 'Uploaded \\d+ items|פריטים הועלו';
const USED = 'now on this device|נמצאות עכשיו במכשיר הזה';
async function openAccount(page) {
  await page.evaluate(() => window.IvritSaves.openAccount());
  await page.waitForFunction((busy) => { const o = document.querySelector('.ivsav-overlay'); const s = o && o.querySelector('.ivsav-status'); return !!(o && o.querySelector('.ivsav-acct-list li') && s && !new RegExp(busy).test(s.textContent)); }, BUSY, { timeout: 30000 });
}
async function clickAndWait(page, act, doneRe) {
  await page.click('.ivsav-overlay .ivsav-btn[data-act="' + act + '"]');
  await page.waitForFunction((re) => { const s = document.querySelector('.ivsav-overlay .ivsav-status'); return !!s && new RegExp(re).test(s.textContent); }, doneRe, { timeout: 90000 });
}
const screen = (page) => page.evaluate(() => {
  const o = document.querySelector('.ivsav-overlay');
  const sec = o.querySelector('.ivsav-acct-settings'), other = o.querySelector('.ivsav-acct-other');
  return {
    lines: [...o.querySelectorAll('.ivsav-acct-list li')].map(l => l.textContent),
    block: !!sec && !sec.hidden, note: sec ? sec.querySelector('.ivsav-acct-settings-note').textContent : '',
    otherHint: !!other && !other.hidden, status: o.querySelector('.ivsav-status').textContent
  };
});
// "Sync finished: a uploaded, b downloaded, c merged, d still need a choice." → [a, b, c, d] (both languages keep the order)
const syncNumbers = (text) => { const m = String(text).match(/(\d+)\D+(\d+)\D+(\d+)\D+(\d+)/); return m ? m.slice(1).map(Number) : null; };
// Sync everything, then take the account's settings for every tool the screen names (the everyday second-device path).
async function syncAndSettle(page) {
  await openAccount(page);
  const disabled = await page.evaluate(() => { const b = document.querySelector('.ivsav-overlay .ivsav-btn[data-act="sync"]'); return !b || b.hidden || b.getAttribute('aria-disabled') === 'true'; });
  if (disabled) { const s = await screen(page); s.quiet = true; return s; }   // nothing safe to do: the button is disabled and no run happens
  await clickAndWait(page, 'sync', DONE);
  let s = await screen(page), rounds = 0;
  while (s.block && rounds++ < 2) { await clickAndWait(page, 'use-account', USED); s = await screen(page); }
  return s;
}
const quietRun = (s) => !!s && !s.block && (s.quiet === true || (syncNumbers(s.status) || []).every(n => n === 0) && !!syncNumbers(s.status));
const planOf = (page, tool) => page.evaluate((tool) => window.IvritSaves.plan(tool).then(p => ({ rows: p.rows.map(r => ({ key: r.kind + ':' + r.name, state: r.seed && r.state === 'local-only' ? 'seed' : r.state, safe: r.safeAction })), trees: p.treesDiffer })), tool);
const syncTool = (page, tool) => page.evaluate((tool) => window.IvritSaves.syncNow(tool).then(s => ({ up: s.up, down: s.down, merged: s.merged, error: s.error ? String(s.error.code || s.error.message) : null })), tool);

/* ---------- the classifier ---------- */
const IGNORED = new Set([AUTH_KEY, 'ivritSuite_accountCache', 'ivritSuite_syncMeta', '__smoke_seeded']);
const omitted = (field, omit) => (omit || []).some(p => p === field || (p.startsWith('*') && field.endsWith(p.slice(1))) || (p.endsWith('*') && field.startsWith(p.slice(0, -1))));
const isPlain = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const parse = (s) => { if (typeof s !== 'string') return undefined; try { return JSON.parse(s); } catch (e) { return undefined; } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const untouchedDefaultClass = (v) => isPlain(v) && (!Array.isArray(v.names) || v.names.length === 0) && (v.name === undefined || v.name === '' || v.name === 'My class' || v.name === 'הכיתה שלי');
// Paths a page rewrites on load, each justified. A line no difference hits is reported STALE-ALLOWLIST.
const NORMALIZED = [
  // (filled in as the run shows what the loaders rewrite — every entry carries its reason)
];
function walk(a, b, p, emit) {
  if (isPlain(a) && isPlain(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) walk(a[k], b[k], p.concat(k), emit);
  } else if (!same(a, b)) emit(p, a, b);
}
function classifyOne(key, pathArr, va, vb, REG, suiteKeys) {
  const entries = REG.filter(e => e.lsKey === key);
  const top = pathArr[0];
  const hit = NORMALIZED.find(n => n.key === key && (n.path instanceof RegExp ? n.path.test(pathArr.join('.')) : n.path === pathArr.join('.')));
  if (hit) { hit.hits = (hit.hits || 0) + 1; return 'LOADER-NORMALIZED (' + hit.why + ')'; }
  if (!entries.length && !suiteKeys.has(key)) return 'EXPECTED-NEVER-SYNC';
  const oneSided = va === undefined || vb === undefined, present = va === undefined ? vb : va;
  // a fresh dashboard mints an empty "My class" (the roster entry's skipUpload seed) and a "Default" preset with an auto-assigned colour
  if (entries.some(e => e.shape === 'mapIn' && e.path === top && e.skipUpload === true) && pathArr.length === 2 && oneSided && untouchedDefaultClass(present)) return 'EXPECTED-SEED';
  if (key === 'hebrewDashboard_settings' && top === 'pickerSessions' && pathArr.length === 2 && oneSided) return 'EXPECTED-OMIT';   // the pick session of that minted class
  if (key === 'hebrewDashboard_presets' && pathArr.length === 1 && top === 'Default' && oneSided) return 'EXPECTED-SEED';
  if (key === 'hebrewDashboard_settings' && pathArr.join('.') === 'presetColors.Default' && oneSided) return 'EXPECTED-SEED';
  if (top !== undefined && entries.some(e => omitted(top, e.omit))) return 'EXPECTED-OMIT';
  if (top !== undefined && entries.some(e => e.envelope && Object.prototype.hasOwnProperty.call(e.envelope, top))) return 'EXPECTED-ENVELOPE';
  return 'UNEXPECTED';
}
function classifyDumps(label, A, B, REG, suiteKeys) {
  const rows = [];
  const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
  for (const key of [...keys].sort()) {
    if (IGNORED.has(key)) continue;
    const a = A[key], b = B[key];
    if (a === b) continue;
    const pa = parse(a), pb = parse(b);
    if (isPlain(pa) && isPlain(pb)) walk(pa, pb, [], (p, va, vb) => rows.push({ key, path: p.join('.'), a: va, b: vb, cls: classifyOne(key, p, va, vb, REG, suiteKeys) }));
    else rows.push({ key, path: '', a, b, cls: classifyOne(key, [], a, b, REG, suiteKeys) });
  }
  const show = (v) => { const s = v === undefined ? '(absent)' : JSON.stringify(v); return s.length > 48 ? s.slice(0, 45) + '…' : s; };
  console.log('\n  ' + label + ': ' + rows.length + ' difference(s)');
  rows.forEach(r => console.log('    ' + r.cls.padEnd(24) + ' ' + r.key + (r.path ? ' › ' + r.path : '') + '   A=' + show(r.a) + '  B=' + show(r.b)));
  return rows;
}

/* ---------- the story's data ---------- */
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEK = { v: 1, periods: [{ start: '08:00', end: '08:45' }, { start: '08:45', end: '09:30' }], weekend: false, cells: {} };
DAYS.forEach(d => { WEEK.cells[d] = d === 'mon' ? ['Morning', 'Morning'] : d === 'tue' ? ['Morning', null] : [null, null]; });
const J = (o) => JSON.stringify(o);
const flipBooleans = (o) => { const out = Object.assign({}, o); Object.keys(out).forEach(k => { if (typeof out[k] === 'boolean') out[k] = !out[k]; }); return out; };
const MUTATED = [];   // [key, field, default, mutated] for the sanity check
function mutate(key, base, changes) {
  const out = flipBooleans(base);
  Object.keys(changes).forEach(f => { MUTATED.push([key, f, base[f], changes[f]]); out[f] = changes[f]; });
  return out;
}
function buildDeviceA(D) {
  const s = {};
  const base = (key) => parse(D[key]) || {};
  s.hebrewTropeTutor_settings = J(mutate('hebrewTropeTutor_settings', base('hebrewTropeTutor_settings'), { tradition: 'seph', hebFontSize: 2.6, playbackRate: 1.25, panelsCollapsed: { 'trope.settings.panel_font': true } }));
  s.hebrewTropeTutor_progress = J({ v: 1, tropes: { etnachta: { r: 3, w: 1 }, sofpasuk: { r: 5, w: 0 } }, families: { disjunctive: true }, pbStreak: 4 });
  s.hebrewTorahTrainer_settings = J(mutate('hebrewTorahTrainer_settings', base('hebrewTorahTrainer_settings'), {
    parshahKey: 'bereshit', layout: 'stacked', translationVersion: 'The Holy Scriptures: A New Translation (JPS 1917)', hebFontSize: 2.0, translitFontSize: 1.1, englishFontSize: 1.1,
    karaokeStyle: 'outline', karaokeFollow: 'translit', handoutFontSize: 'xl', ttsRate: 1.0, karaokeRate: 1.2, translitStyle: 'sbl', clickAction: 'read',
    lastPos: { readingKey: 'bereshit', verse: '1:3', ts: 1700000000000 }, karaokeBarCollapsed: true, panelsCollapsed: { 'torah.settings.panel_copy': true }, loopVerse: '1:2' }));
  s.hebrewFlashCards_settings = J(mutate('hebrewFlashCards_settings', base('hebrewFlashCards_settings'), { mode: 1, cardCount: 12, selectedLetters: ['א', 'ב', 'ג'], selectedVowels: ['a', 'patah'], ttsRate: 1.25 }));
  s.hebrewFlashCards_presets = J({ 'Deck A': { settings: { mode: 2, cardCount: 12 }, order: 1700000000000 }, 'Deck B': { settings: { mode: 1, cardCount: 8 }, order: 1700000001000 } });
  s.hebrewFlashCards_presetsFolders = J({ v: 1, root: [{ t: 'folder', id: 'fa', name: 'Fall', collapsed: false, children: [{ t: 'folder', id: 'fa1', name: 'Week 1', collapsed: false, children: [{ t: 'item', name: 'Deck A' }] }] }, { t: 'item', name: 'Deck B' }] });
  s.hebrewFlashCards_pbStreak = '7';
  s.hebrewFlashCards_profiles = J({ activeProfile: 'Sarah', profiles: {
    Sarah: { created: 1700000000000, order: 1700000000000, results: [
      { savedAt: '2026-09-01T10:00:00.000Z', pct: 90, correct: 9, total: 10, timeSec: 40, timerMode: 'off', settings: { mode: 2 }, cards: [] },
      { savedAt: '2026-09-02T10:00:00.000Z', pct: 100, correct: 10, total: 10, timeSec: 35, timerMode: 'off', settings: { mode: 2 }, cards: [] }], ladder: { levels: { l1: { bestPct: 90, passedAt: '2026-09-01T10:00:00.000Z' } } } },
    Dan: { created: 1700000000000, order: 1700000000001, results: [] } } });
  s.hebrewFlashCards_profilesFolders = J({ v: 1, root: [{ t: 'folder', id: 'pf', name: 'Class 3', collapsed: false, children: [{ t: 'folder', id: 'pf1', name: 'Group A', collapsed: false, children: [{ t: 'item', name: 'Sarah' }] }] }, { t: 'item', name: 'Dan' }] });
  s.hebrewBlender_presets = J({ 'Week 1': { selectedLetters: ['א', 'ב'], selectedVowels: ['kamatz'], pageSize: 'letter' }, Review: { selectedLetters: ['ג'], selectedVowels: ['patach'] } });
  s.hebrewBlender_presetsFolders = J({ v: 1, root: [{ t: 'folder', id: 'gf', name: 'Fall', collapsed: false, children: [{ t: 'folder', id: 'gf1', name: 'Unit 1', collapsed: false, children: [{ t: 'item', name: 'Week 1' }] }] }, { t: 'item', name: 'Review' }] });
  s.hebrewBlender_lastState = J(mutate('hebrewBlender_lastState', base('hebrewBlender_lastState'), { headerLang: 'he', pageSize: 'a4', selectedLetters: ['א', 'ב', 'ג'], selectedVowels: ['kamatz', 'patach'], rwSource: 'lists', selectedWordListIds: ['m1abc_x1y2z'], selectedWordListNames: ['Week 3 words'] }));
  s.ivritSuite_wordLists = J({ v: 1, lists: {
    m1abc_x1y2z: { name: 'Week 3 words', created: 1700000000000, updated: 1700000100000, words: [{ word: 'שָׁלוֹם', translation: 'peace', translit: 'shalom', pos: 'noun', era: 'bib' }] },
    m1abd_q9w8e: { name: 'Colors', created: 1700000200000, updated: 1700000300000, words: [{ word: 'אָדֹם', translation: 'red', translit: 'adom', pos: 'adj', era: 'mod' }, { word: 'כָּחֹל', translation: 'blue', translit: 'kachol', pos: 'adj', era: 'mod' }] } } });
  s.hebrewDashboard_settings = J(mutate('hebrewDashboard_settings', base('hebrewDashboard_settings'), {
    location: 'Atlanta, GA', engDateFmt: 'LONG', hebDateScript: 'both', timeFmt: '24', headerLang: 'en', dashTextHTML: '<div>Boker tov!</div>',
    scheduleEnabled: true, scheduleWeek: WEEK, presetColors: { Morning: '#aabbcc' }, timeSize: 4.5,   // the other toggles are flipped with every boolean
    zoomLevel: 110, panelsCollapsed: { 'dashboard.settings.panel_weather': true },
    rosters: { a_0: { name: 'Kitah Alef', names: ['Noa', 'Eitan'] }, a_1: { name: 'Kitah Bet', names: ['Ari'] } }, activeRosterId: 'a_0', pickerSessions: {}, _geoCoords: { lat: 33.7, lon: -84.4 } }));
  s.hebrewDashboard_presets = J({ Morning: { headerLang: 'en', showTimer: true, activeRosterName: 'Kitah Alef' }, Tefillah: { headerLang: 'he', showTimer: false } });
  s.hebrewDashboard_presetsFolders = J({ v: 1, root: [{ t: 'folder', id: 'df', name: 'Weekdays', collapsed: false, children: [{ t: 'folder', id: 'df1', name: 'Early', collapsed: false, children: [{ t: 'item', name: 'Morning' }] }] }, { t: 'item', name: 'Tefillah' }] });
  s.hebrewDashboard_schedules = J({ '2026-2027': { v: 2, week: WEEK } });
  s.hebrewDashboard_schedulesFolders = J({ v: 1, root: [{ t: 'folder', id: 'sf', name: 'This year', collapsed: false, children: [{ t: 'item', name: '2026-2027' }] }] });
  // the suite-wide preferences (all eleven), and what stays per device
  Object.assign(s, { hebrewBlender_lang: 'he', hebrewBlender_darkMode: '1', hebrewBlender_kbdLayout: 'qwerty', hebrewBlender_inputMode: 'manual', hebrewBlender_hebFont: 'David Libre', hebrewBlender_hebFontSize: '62', hebrewBlender_livePreview: '0',
    hebrewFontMaker_lastAuthor: 'Morah Rivka', hebrewDictionary_translitStyle: 'sbl', hebrewDictionary_ttsRate: '1.2', hebrewDictionary_emojiSettings: J({ mode: true, gender: 'all', excludedSubs: ['Animal|Mammal'] }),
    hebrewBlender_panels: J({ 'worksheet.advanced.title': true }), hebrewFlashCards_panels: J({ 'flashcards.advanced.title': true }), hebrewDictionary_panels: J({ 'dictionary.filters.title': true }),
    hebrewBlender_zoom: '120', hebrewTropeTutor_tourSeen: '1', hebrewDictionary_audioEnabled: '0' });
  ['hebrewBlender_lang', 'hebrewBlender_darkMode', 'hebrewBlender_kbdLayout', 'hebrewBlender_inputMode', 'hebrewBlender_hebFont', 'hebrewBlender_hebFontSize', 'hebrewBlender_livePreview', 'hebrewFontMaker_lastAuthor', 'hebrewDictionary_translitStyle', 'hebrewDictionary_ttsRate', 'hebrewDictionary_emojiSettings']
    .forEach(k => MUTATED.push([k, '', D[k] === undefined ? null : D[k], s[k]]));
  return s;
}
const withSession = (s) => Object.assign({}, s, { [AUTH_KEY]: J(SESSION), ivritSuite_accountCache: J({ email: 'teacher@example.org', name: 'Test Teacher' }), ivritSuite_syncMeta: J({ v: 1, users: {}, welcomed: { [UID]: '2026-09-14T00:00:00.000Z' } }) });
const EXPECTED_ROWS = { Suite: 1, TropeTutor: 2, TorahTrainer: 1, FlashCards: 8, Worksheet: 4, Dictionary: 2, Dashboard: 8 };   // 26 rows, five of them folder trees

const browser = await chromium.launch();
const srv = await startServer();
try {
  // ---- 0. the real defaults, and the registry as the module holds it ----------------------------------
  const D = {};
  let REG = [], suiteKeys = new Set();
  {
    const ctx = await openContext(browser, null, {});
    const errs = [];
    for (const P of PAGES) {
      const { page, errors } = await openPage(ctx, P.file, { anonymous: true });
      await page.evaluate(P.writer);
      const d = await dump(page);
      if (P.tool === 'Worksheet' && !d.hebrewBlender_lastState) d.hebrewBlender_lastState = await page.evaluate(() => JSON.stringify(getSettings()));   // a pristine setup writes nothing (by design): the controls' defaults are the blob
      Object.keys(d).forEach(k => { if (D[k] === undefined) D[k] = d[k]; });
      if (P.tool === 'Dashboard') {
        REG = await page.evaluate(() => window.IvritSaves.registry().map(e => Object.assign({}, e, { skipUpload: typeof e.skipUpload === 'function', virtual: !!e.virtual })));   // functions do not cross to Node: keep them as flags
        suiteKeys = new Set(await page.evaluate(() => Object.values(window.IvritSaves._test.suitePrefs.fields).map(f => f.key)));
      }
      errs.push(...errors);
      await page.close();
    }
    await ctx.close();
    const have = ['hebrewTropeTutor_settings', 'hebrewTorahTrainer_settings', 'hebrewFlashCards_settings', 'hebrewBlender_lastState', 'hebrewDashboard_settings'].filter(k => !D[k]);
    const fcOmit = (REG.find(e => e.tool === 'FlashCards' && e.kind === 'settings') || {}).omit || [];
    check('0: the Flash Cards settings row omits the four fields the machine decides, and nothing else', JSON.stringify(fcOmit.slice().sort()) === JSON.stringify(['audioEnabled', 'hideHomeBtn', 'sheetDuplex', 'ttsRate']), JSON.stringify(fcOmit));
    check('0: every settings-blob page wrote its default store; the registry and the suite-wide keys were read', have.length === 0 && REG.length >= 20 && suiteKeys.size === 11, JSON.stringify({ missing: have, reg: REG.length, suite: suiteKeys.size }));
    check('0: 0 pageerrors while capturing', errs.length === 0, errs.join(' | '));
  }
  // ---- 1. device A's data -------------------------------------------------------------------------------
  const A_DATA = buildDeviceA(D);
  {
    const sameAsDefault = MUTATED.filter(([, , d, m]) => same(d, m)).map(([k, f]) => k + (f ? '.' + f : ''));
    check('1: every deliberate change differs from the default (' + MUTATED.length + ' checked)', sameAsDefault.length === 0, sameAsDefault.join(', '));
  }
  // ---- 2. device A opens every tool once, then uploads everything ----------------------------------------
  const cloud = new FakeCloud([]);
  const ctxA = await openContext(browser, cloud, withSession(A_DATA));
  const errA = [];
  let dumpA;
  {
    await visitAll(ctxA, errA);
    const { page, errors } = await openPage(ctxA, 'index.html');
    await openAccount(page);
    const s0 = await screen(page);
    await clickAndWait(page, 'upload', UPLOADED);
    const s = await screen(page);
    const byTool = {};
    cloud.rows.forEach(r => { byTool[r.tool] = (byTool[r.tool] || 0) + 1; });
    check('2: an empty account offered Upload everything; the run named no skipped row', s0.lines.length >= 7 && !/skipped|דולגו|Stopped|נעצר/.test(s.status), JSON.stringify({ lines: s0.lines, status: s.status }));
    const countsMatch = Object.keys(EXPECTED_ROWS).every(t => byTool[t] === EXPECTED_ROWS[t]) && Object.keys(byTool).length === Object.keys(EXPECTED_ROWS).length;
    check('2: the cloud holds exactly the expected rows per tool (26, five of them folder trees)', countsMatch && cloud.rows.length === 26, JSON.stringify(byTool));
    await page.screenshot({ path: path.join(SHOTS, '2-A-uploaded.png') });
    dumpA = await dump(page);
    errA.push(...errors);
    check('2: 0 pageerrors on device A', errA.length === 0, errA.join(' | '));
    await page.close();
  }
  // ---- 3. a fresh device B syncs everything, opens every page, syncs again ------------------------------
  const ctxB = await openContext(browser, cloud, withSession({}));
  const errB = [];
  let dumpB;
  {
    const { page, errors } = await openPage(ctxB, 'index.html');
    const s1 = await syncAndSettle(page);
    const n1 = syncNumbers(s1.status);
    check('3: B synced everything on the home page and took the account\'s settings where asked; nothing left to choose', !s1.block && !/to merge inside|למיזוג/.test(s1.lines.join(' ')) && /IvritSuite/.test(s1.lines.join(' ')), JSON.stringify(s1));
    const live = await page.evaluate(() => ({ lang: document.documentElement.lang, dark: document.body.classList.contains('dark') }));
    check('3: the suite-wide preferences applied live on B (Hebrew, dark)', live.lang === 'he' && live.dark, JSON.stringify(live));
    errB.push(...errors);
    await page.close();
    await visitAll(ctxB, errB);
    const last = await openPage(ctxB, 'classroom_dashboard.html');
    const before = cloud.log.length;
    const s2 = await syncAndSettle(last.page);
    const pushed = cloud.log.slice(before).filter(e => e.m === 'PATCH' || e.m === 'POST').map(e => e.m + ' ' + (e.rows ? e.rows.join(',') : (e.row ? e.row.tool + '/' + e.row.kind + '/' + e.row.name : '?')));
    console.log('  3: rows B pushed after opening every page: ' + (pushed.length ? pushed.join('; ') : 'none'));
    const s3 = await syncAndSettle(last.page);
    check('3: the third sync is quiet — nothing to do, or 0 uploaded, 0 downloaded, 0 merged, 0 to choose', quietRun(s3), JSON.stringify({ second: s2.status, secondQuiet: !!s2.quiet, third: s3.status, thirdQuiet: !!s3.quiet }));
    await last.page.screenshot({ path: path.join(SHOTS, '3-B-synced.png') });
    dumpB = await dump(last.page);
    errB.push(...last.errors);
    check('3: 0 pageerrors on device B', errB.length === 0, errB.join(' | '));
    await last.page.close();
  }
  // ---- 4. the diff, classified --------------------------------------------------------------------------
  {
    const rows = classifyDumps('4: device A vs device B', dumpA, dumpB, REG, suiteKeys);
    const bad = rows.filter(r => r.cls === 'UNEXPECTED');
    check('4: every difference between A and B is explained (' + rows.length + ' differences, ' + bad.length + ' unexpected)', bad.length === 0, bad.map(r => r.key + (r.path ? ' › ' + r.path : '')).join(', '));
    const stale = NORMALIZED.filter(n => !n.hits);
    if (stale.length) console.log('  4: STALE-ALLOWLIST (no difference hit these): ' + stale.map(n => n.key + ' ' + String(n.path)).join(', '));
    // every synced key B holds is byte-for-byte A's, apart from the classes above
    const synced = REG.filter(e => e.lsKey).map(e => e.lsKey).concat([...suiteKeys]);
    const untouched = synced.filter(k => dumpA[k] === dumpB[k]);
    console.log('  4: keys byte-identical on both devices: ' + untouched.length + ' of ' + new Set(synced).size + ' synced keys');
  }
  // ---- 5. round trip B → A -------------------------------------------------------------------------------
  {
    const t = await openPage(ctxB, 'torah_trainer.html');
    const flipped = await t.page.evaluate(() => { settings.showTranslit = !settings.showTranslit; saveSettings(); saveSettingsFlush(); return settings.showTranslit; });
    const r1 = await syncTool(t.page, 'TorahTrainer');
    errB.push(...t.errors); await t.page.close();
    const d = await openPage(ctxB, 'classroom_dashboard.html');
    await d.page.evaluate(() => { settings.location = 'Haifa, Israel'; delete settings._geoCoords; saveSettingsToStorage(); });
    const r2 = await syncTool(d.page, 'Dashboard');
    await d.page.evaluate(() => localStorage.setItem('hebrewBlender_kbdLayout', 'abc'));
    const r3 = await syncTool(d.page, 'Suite');
    errB.push(...d.errors); await d.page.close();
    const f = await openPage(ctxB, 'flash_cards.html');
    await f.page.evaluate(() => { const p = JSON.parse(localStorage.getItem('hebrewFlashCards_presets')); p['Deck C'] = { settings: { mode: 1, cardCount: 6 }, order: Date.now() }; localStorage.setItem('hebrewFlashCards_presets', JSON.stringify(p)); renderPresets(); });
    const r4 = await syncTool(f.page, 'FlashCards');
    errB.push(...f.errors); await f.page.close();
    check('5: B sent the four changes up', r1.up === 1 && r2.up === 1 && r3.up === 1 && r4.up === 1 && !r1.error && !r2.error && !r3.error && !r4.error, JSON.stringify({ r1, r2, r3, r4 }));
    const a = await openPage(ctxA, 'index.html');
    const s = await syncAndSettle(a.page);
    const got = await a.page.evaluate(() => {
      const torah = JSON.parse(localStorage.getItem('hebrewTorahTrainer_settings')), dash = JSON.parse(localStorage.getItem('hebrewDashboard_settings'));
      return { showTranslit: torah.showTranslit, lastPos: torah.lastPos, location: dash.location, zoom: dash.zoomLevel, panels: dash.panelsCollapsed, kbd: localStorage.getItem('hebrewBlender_kbdLayout'), decks: Object.keys(JSON.parse(localStorage.getItem('hebrewFlashCards_presets'))) };
    });
    check('5: A holds all four changes and its own per-device fields untouched', got.showTranslit === flipped && got.location === 'Haifa, Israel' && got.kbd === 'abc' && got.decks.includes('Deck C') && got.zoom === 110 && got.lastPos && got.lastPos.verse === '1:3' && got.panels && got.panels['dashboard.settings.panel_weather'] === true && !s.block, JSON.stringify({ got, status: s.status }));
    errA.push(...a.errors); await a.page.close();
  }
  // ---- 6. a folder move on B lands on A once, inside that folder --------------------------------------------
  {
    const f = await openPage(ctxB, 'flash_cards.html');
    await f.page.evaluate(() => {
      const tree = JSON.parse(localStorage.getItem('hebrewFlashCards_presetsFolders'));
      tree.root = tree.root.filter(n => !(n.t === 'item' && n.name === 'Deck B'));
      tree.root.push({ t: 'folder', id: ftGenId(), name: 'Spring', collapsed: false, children: [{ t: 'item', name: 'Deck B' }] });
      localStorage.setItem('hebrewFlashCards_presetsFolders', JSON.stringify(tree));
    });
    await f.page.reload({ waitUntil: 'domcontentloaded' });
    await f.page.waitForFunction(() => window.IvritAccount && window.IvritSaves && IvritAccount.status() === 'signed-in', null, { timeout: 25000 });
    await f.page.waitForTimeout(SETTLE_MS);
    const before = await planOf(f.page, 'FlashCards');
    const r = await syncTool(f.page, 'FlashCards');
    const afterB = await planOf(f.page, 'FlashCards');
    errB.push(...f.errors); await f.page.close();
    const a = await openPage(ctxA, 'index.html');
    await syncAndSettle(a.page);
    const treeA = await a.page.evaluate(() => JSON.parse(localStorage.getItem('hebrewFlashCards_presetsFolders')));
    const found = [];
    (function look(nodes, where) { nodes.forEach(n => { if (n.t === 'item' && n.name === 'Deck B') found.push(where); if (n.t === 'folder') look(n.children || [], where + '/' + n.name); }); })(treeA.root, '');
    const afterA = await planOf(a.page, 'FlashCards');
    check('6: the folder move was a safe action on B, went up, and A holds Deck B once inside Spring; both trees read Same', before.trees.includes('presetFolders') && r.merged >= 1 && afterB.trees.length === 0 && same(found, ['/Spring']) && afterA.trees.length === 0, JSON.stringify({ before: before.trees, r, afterB: afterB.trees, found, afterA: afterA.trees }));
    errA.push(...a.errors); await a.page.close();
  }
  // ---- 7. deleted here: never propagates by itself ----------------------------------------------------------
  {
    const f = await openPage(ctxB, 'flash_cards.html');
    await f.page.evaluate(() => { window.confirm = () => true; deleteProfile('Dan'); });
    const pf = await planOf(f.page, 'FlashCards');
    errB.push(...f.errors); await f.page.close();
    const d = await openPage(ctxB, 'classroom_dashboard.html');
    await d.page.evaluate(() => { const id = Object.keys(settings.rosters).find(k => settings.rosters[k].name === 'Kitah Bet'); switchClass(id); window.confirm = () => true; deleteClass(); });
    const pd = await planOf(d.page, 'Dashboard');
    const s = await syncAndSettle(d.page);
    const n = syncNumbers(s.status);
    const local = await d.page.evaluate(() => ({ dan: !!JSON.parse(localStorage.getItem('hebrewFlashCards_profiles')).profiles.Dan, bet: Object.values(JSON.parse(localStorage.getItem('hebrewDashboard_settings')).rosters).some(r => r.name === 'Kitah Bet') }));
    check('7: both read "Deleted on this device"; Sync everything downloaded nothing and left them gone here', pf.rows.find(r => r.key === 'profile:Dan').state === 'deleted-here' && pd.rows.find(r => r.key === 'roster:a_1').state === 'deleted-here' && !!n && n[1] === 0 && !local.dan && !local.bet, JSON.stringify({ dan: pf.rows.find(r => r.key === 'profile:Dan'), bet: pd.rows.find(r => r.key === 'roster:a_1'), status: s.status, local }));
    const removed = await d.page.evaluate(() => window.IvritSaves.plan('FlashCards').then(p => window.IvritSaves.act('FlashCards', 'deleteCloud', p.rows.find(r => r.kind === 'profile' && r.name === 'Dan'))).then(r => r.action));
    check('7: "Delete from your account too" removed the student\'s row; the class row stays', removed === 'delete' && !cloud.find('profile', 'Dan') && !!cloud.find('roster', 'a_1'), JSON.stringify({ removed, dan: !!cloud.find('profile', 'Dan'), bet: !!cloud.find('roster', 'a_1') }));
    errB.push(...d.errors); await d.page.close();
    const a = await openPage(ctxA, 'index.html');
    await openAccount(a.page);
    const sa = await screen(a.page);
    const localA = await a.page.evaluate(() => ({ dan: !!JSON.parse(localStorage.getItem('hebrewFlashCards_profiles')).profiles.Dan, bet: Object.values(JSON.parse(localStorage.getItem('hebrewDashboard_settings')).rosters).some(r => r.name === 'Kitah Bet') }));
    check('7: A still holds the student and the class, and lists the student as not in the account yet (nothing was deleted on A)', localA.dan && localA.bet && sa.lines.some(l => /1 (not in your account yet|עדיין לא בחשבון)/.test(l)), JSON.stringify({ localA, lines: sa.lines }));
    await a.page.evaluate(() => window.IvritSaves.closeAccount());
    errA.push(...a.errors); await a.page.close();
  }
  // ---- 8. the account backup from B lands on a third device ------------------------------------------------
  {
    const b = await openPage(ctxB, 'index.html');
    const file = await b.page.evaluate(() => window.IvritSaves.bundleAll().then(x => x.file));
    check('8: the backup is partial and carries the class lists and the suite-wide preferences', file.partial === true && file.data.dashboardRosters && file.data.dashboardRosters.rosters.a_0.names.includes('Noa') && file.data.suitePrefs && file.data.suitePrefs.lang === 'he' && file.data.suitePrefs.kbdLayout === 'abc' && file.data.generatorPresets['Week 1'], Object.keys(file.data || {}).join(','));
    errB.push(...b.errors); await b.page.close();
    const ctxC = await openContext(browser, null, { hebrewDashboard_settings: J({ location: 'Boston, MA', zoomLevel: 130, rosters: { c_1: { name: 'Mine', names: ['Lior'] } }, activeRosterId: 'c_1' }) }, { blockAccount: true });
    const hub = await ctxC.newPage();
    const errC = []; hub.on('pageerror', e => errC.push(String(e && e.message || e)));
    await hub.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await hub.waitForFunction(() => window.I18n && typeof ivritRestore === 'function', null, { timeout: 15000 });
    await hub.waitForTimeout(500);
    const r = await hub.evaluate(async (text) => {
      window.__alerts = []; window.alert = (m) => window.__alerts.push(String(m));
      window.__asked = false; ivritAskMode = () => { window.__asked = true; return Promise.resolve('merge'); };
      await ivritRestore(text, 'account.ivrit');
      const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings'));
      return { asked: window.__asked, zoom: s.zoomLevel, rosters: Object.keys(s.rosters).sort(), mine: s.rosters.c_1 && s.rosters.c_1.names, kbd: localStorage.getItem('hebrewBlender_kbdLayout'), status: (document.getElementById('ivritStatus') || {}).textContent || '' };
    }, J(file));
    check('8: the third device merged it without the Merge/Replace question: the class lists landed beside its own, zoom untouched, the preferences unfolded', r.asked === false && same(r.rosters, ['a_0', 'a_1', 'c_1']) && same(r.mine, ['Lior']) && r.zoom === 130 && r.kbd === 'abc', JSON.stringify(r));
    check('8: 0 pageerrors on the third device', errC.length === 0, errC.join(' | '));
    await ctxC.close();
  }
  // ---- 9. the second-device story: every tool opened anonymously first, then signed in ------------------------
  {
    // A syncs first (it re-uploads the student it still holds — a deletion elsewhere never removes A's copy) and
    // again after B2's pushes, so the comparison is between two devices that both hold the account's latest.
    const resyncA = async () => { const a = await openPage(ctxA, 'index.html'); await syncAndSettle(a.page); const d = await dump(a.page); errA.push(...a.errors); await a.page.close(); return d; };
    await resyncA();
    const ctx2 = await openContext(browser, cloud, {});
    const err2 = [];
    await visitAll(ctx2, err2, { anonymous: true });
    const g = await openPage(ctx2, 'hebrew_blend_generator.html', { anonymous: true });
    const own = await g.page.evaluate(() => ['hebrewTropeTutor_settings', 'hebrewTorahTrainer_settings', 'hebrewFlashCards_settings', 'hebrewBlender_lastState', 'hebrewDashboard_settings'].filter(k => localStorage.getItem(k)));
    await g.page.evaluate((s) => { Object.keys(s).forEach(k => localStorage.setItem(k, s[k])); }, withSession({}));
    await g.page.reload({ waitUntil: 'domcontentloaded' });
    await g.page.waitForFunction(() => window.IvritAccount && window.IvritSaves && IvritAccount.status() === 'signed-in', null, { timeout: 25000 });
    await g.page.waitForTimeout(SETTLE_MS);
    await openAccount(g.page);
    const s0 = await screen(g.page);
    const NAME_OF = { hebrewTropeTutor_settings: 'Trope Tutor', hebrewTorahTrainer_settings: 'Torah Trainer', hebrewFlashCards_settings: 'Hebrew Flash Cards', hebrewBlender_lastState: 'Hebrew Worksheet Generator', hebrewDashboard_settings: 'Hebrew Classroom Dashboard' };
    const expectNamed = ['IvritSuite'].concat(own.map(k => NAME_OF[k]));   // the generator writes no pristine setup, so it is named only when it wrote one
    const named = expectNamed.filter(n => s0.note.includes(n));
    check('9: signed in after every tool wrote its defaults, the block names every tool with a settings row plus IvritSuite (' + own.length + ' blobs written anonymously)', s0.block && named.length === expectNamed.length && expectNamed.length >= 5, JSON.stringify({ note: s0.note, own }));
    await g.page.screenshot({ path: path.join(SHOTS, '9-B2-block.png') });
    const s1 = await syncAndSettle(g.page);
    err2.push(...g.errors); await g.page.close();
    await visitAll(ctx2, err2);
    const last = await openPage(ctx2, 'classroom_dashboard.html');
    const s2 = await syncAndSettle(last.page);
    const s3 = await syncAndSettle(last.page);
    check('9: after the account\'s settings landed and every page ran, the last sync is quiet', !s1.block && quietRun(s3), JSON.stringify({ s1: s1.status, s2: s2.status, s3: s3.status, thirdQuiet: !!s3.quiet }));
    const dump2 = await dump(last.page);
    err2.push(...last.errors); await last.page.close();
    const dumpA2 = await resyncA();
    const rows = classifyDumps('9: device A vs device B2 (opened every tool before signing in)', dumpA2, dump2, REG, suiteKeys);
    const bad = rows.filter(r => r.cls === 'UNEXPECTED');
    check('9: every difference between A and B2 is explained (' + rows.length + ' differences, ' + bad.length + ' unexpected)', bad.length === 0, bad.map(r => r.key + (r.path ? ' › ' + r.path : '')).join(', '));
    check('9: 0 pageerrors on device B2', err2.length === 0, err2.join(' | '));
    await ctx2.close();
  }
  check('final: 0 pageerrors on A and B over the whole story', errA.length === 0 && errB.length === 0, errA.concat(errB).join(' | '));
  await ctxA.close();
  await ctxB.close();
} finally {
  await browser.close();
  srv.kill();
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} checks passed; screenshots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
