#!/usr/bin/env node
/*
 * smoke-migration.mjs — the golden migration replay for the optional accounts (js/ivrit-saves.js) under the
 * cloud-first model: signed out, the device is its own; signed in, the account is where saves live.
 *
 * Proves, headlessly, that a teacher's whole setup moves from device A to a fresh device B with nothing lost,
 * that every difference between the two devices afterwards is explainable, and that the everyday paths — a
 * change made on one device, a folder move, a deletion, an old backup, a second device that was used before
 * the sign-in, a device upgrading from the old module's sync memory — all converge without a dialog. One fake
 * cloud, one account, several browser contexts:
 *
 *   0. Capture the real default blobs: each of the six tool pages is opened anonymously and made to write its
 *      own store (the page's writer, not a hand-written subset), so the seed below is what a page would hold.
 *   1. Build device A from those defaults: every boolean flipped, enums moved to other offered values, numbers
 *      changed, strings changed; items with folders nested two levels deep on every foldered list, students,
 *      word lists, classes, a weekly grid, the suite-wide preferences, Torah and Trope settings, mastery
 *      progress, a last worksheet setup naming a word list by id. A sanity check asserts every deliberate
 *      change differs from the default.
 *   2. Device A opens every tool once signed out (each page writes back its own normalized form), then opens
 *      the home page signed in: the first hydration opens the device-extras card, Add to my account sends the
 *      device's items up (settings blobs and the suite-wide preferences went up silently, folder trees after
 *      their items); the cloud holds exactly EXPECTED_ROWS, nothing was skipped, the account is marked hydrated.
 *   3. A fresh device B opens the home page signed in: no card (nothing extra), every row lands, no write; then
 *      every tool page twice — a page's normalized form may go up once (the first visits are reported), the
 *      second visit of each page issues no write — and a last home-page load issues no write at all.
 *   4. The diff: every localStorage key of A and B is walked path by path and each difference classified —
 *      EXPECTED-OMIT (a per-device field the registry omits), EXPECTED-NEVER-SYNC (a key with no registry row
 *      and no suite-wide preference), EXPECTED-ENVELOPE (a mapIn envelope field), EXPECTED-SEED (an untouched
 *      empty default class one side minted), LOADER-NORMALIZED (an allowlisted path a page rewrites, each line
 *      justified below; an entry no difference hits is reported STALE-ALLOWLIST) — anything else is UNEXPECTED
 *      and fails the run. The table is printed either way: it is the "what moved" report.
 *   5. Round trip B → A: B changes a Torah setting, the dashboard's city, a suite-wide preference and saves a
 *      deck through the pages' own functions; each goes up by itself within 4 s; A's next load of each page
 *      holds all four, its own per-device fields untouched.
 *   6. A folder move on B goes up by itself; A takes it once, inside that folder, pushes nothing back, and both
 *      devices read the trees as the same.
 *   7. Deletions propagate: A edits a student while offline (the edit stays here, unsent); B downloads the
 *      account backup (kept for 8), then deletes two students and a class through the pages' own functions —
 *      a conditional DELETE each; at A's next load the student and the class whose local hash equals A's
 *      memory are gone here too, while the student A had edited is re-inserted (POST) instead of removed.
 *   8. The account backup from B is partial, carries the class lists and the suite-wide preferences, and lands
 *      on a signed-in third device's home page without the Merge/Replace question, its zoom untouched; the
 *      merge refills the account with what the backup still had (the deleted student and class: one POST
 *      each) and duplicates nothing.
 *   9. The second-device story: a device B2 opens every tool anonymously first (each writes its defaults), then
 *      signs in on the home page: no card (settings blobs are never asked about), the account's settings and
 *      the suite-wide preferences win on every tool, every page once, the same classifier finds nothing
 *      unexpected, the last home-page load issues no write.
 *  10. The v1-memory upgrade: a device carrying the old module's ivritSuite_syncMeta remembers a row it deleted
 *      locally since, a row the account has since lost, and a settings blob edited after the remembered hash —
 *      the first hydration deletes nothing on either side (the first is downloaded again, the second goes up
 *      through the card), the edited blob goes up as a PATCH rather than being reverted, and the v1 hint is
 *      consumed for every row now remembered under v2.
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
const SETTLE_MS = 1500;      // an anonymous page's own debounced writers (300 ms settings, 1 s dictionary session)
const GRACE_MS = 1200;       // after the module reads settled: a page's own debounced writer may still mark a kind dirty
const WRITE_WITHIN_MS = 4000;   // a page's own change must be in the account within this (the module's 2 s debounce, twice)
const UID = '11111111-1111-4111-8111-111111111111';
const EMAIL = 'teacher@example.org';
// The name step never opens: the session's user carries a display name.
const SESSION = { access_token: 'x', refresh_token: 'y', expires_at: 4102444800, token_type: 'bearer', user: { id: UID, email: EMAIL, user_metadata: { full_name: 'Test Teacher' }, app_metadata: { provider: 'email' } } };
const ALL_TOOLS = ['Suite', 'Worksheet', 'FlashCards', 'Dictionary', 'TorahTrainer', 'TropeTutor', 'Dashboard'];

/* ---------- the fake cloud ---------- */
// The account's rows, answered the way PostgREST would for the queries the module makes: GET (eq. and in.(…)
// filters, order with .asc/.desc, offset/limit or a Range header, select), POST (insert; 409 / 23505 on a
// duplicate tool+kind+name; one object back for .single()), PATCH (the filters, the changed rows back — none
// when the updated_at guard misses), DELETE (the filters; the deleted rows back when a representation is
// asked for). The Auth user endpoints answer with the session's user, logout with 204, and `profiles` is
// missing (404) so the module's fail-soft paths are exercised. Every call is logged.
class FakeCloud {
  constructor(rows) { this.n = 0; this.log = []; this.rows = (rows || []).map(r => this.fresh(r)); this.user = JSON.parse(JSON.stringify(SESSION.user)); }
  stamp() { return new Date(Date.UTC(2026, 8, 14, 20, 0, 0) + (++this.n) * 1000).toISOString(); }
  fresh(r) { const at = this.stamp(); return Object.assign({ id: crypto.randomUUID(), user_id: UID, created_at: at, updated_at: at, client_updated_at: null, data_hash: null, bytes: JSON.stringify(r.data).length }, r); }
  find(kind, name, tool) { return this.rows.find(r => r.kind === kind && r.name === name && (!tool || r.tool === tool)); }
  byTool() { const out = {}; this.rows.forEach(r => { out[r.tool] = (out[r.tool] || 0) + 1; }); return out; }
  duplicates() { const seen = new Set(), dup = []; this.rows.forEach(r => { const k = r.tool + '/' + r.kind + '/' + r.name; if (seen.has(k)) dup.push(k); seen.add(k); }); return dup; }
  pick(row, select) { if (!select) return row; const out = {}; select.split(',').forEach(k => { k = k.trim(); if (k) out[k] = row[k]; }); return out; }
  // The writes since a log position, as "METHOD tool/kind/name" labels (a refused insert as "POST(409) …").
  writesSince(at) { return this.log.slice(at).filter(e => e.table === 'saves' && !e.aborted && (e.m === 'POST' || e.m === 'PATCH' || e.m === 'DELETE')); }
  static label(e) { return e.m + (e.status >= 400 ? '(' + e.status + ')' : '') + ' ' + ((e.rows && e.rows.length) ? e.rows.join(',') : (e.tool ? e.tool + '/?' : '?')); }
  handle(route, gate) {
    const req = route.request(), url = new URL(req.url()), m = req.method(), headers = req.headers();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
    const json = (status, body) => route.fulfill({ status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, cors), body: JSON.stringify(body) });
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (gate && gate.offline) { this.log.push({ m, path: url.pathname, search: url.search, aborted: true, device: gate.name }); return route.abort('failed'); }   // that device's connection is down
    // ---- Auth ----
    if (url.pathname.endsWith('/auth/v1/user')) {
      if (m === 'PUT') { const body = JSON.parse(req.postData() || '{}'); this.log.push({ m, table: 'auth.user', body }); if (body.data) this.user.user_metadata = Object.assign({}, this.user.user_metadata, body.data); }
      else this.log.push({ m, table: 'auth.user' });
      return json(200, this.user);
    }
    if (url.pathname.endsWith('/auth/v1/token')) return json(200, Object.assign({ expires_in: 3600 }, SESSION, { user: this.user }));
    if (url.pathname.endsWith('/auth/v1/logout')) { this.log.push({ m, table: 'auth.logout' }); return route.fulfill({ status: 204, headers: cors }); }
    // ---- PostgREST ----
    const tm = /\/rest\/v1\/([A-Za-z_]+)$/.exec(url.pathname);
    if (tm && tm[1] === 'profiles') { this.log.push({ m, table: 'profiles', search: url.search, status: 404 }); return json(404, { code: 'PGRST205', message: "Could not find the table 'public.profiles' in the schema cache", details: null, hint: null }); }
    if (!tm || tm[1] !== 'saves') { this.log.push({ m, path: url.pathname, unexpected: true }); return json(404, { message: 'not found' }); }
    const q = url.searchParams;
    const filters = [...q.entries()].filter(([k, v]) => !['select', 'order', 'offset', 'limit'].includes(k) && /^(eq|in)\./.test(v))
      .map(([k, v]) => v.startsWith('in.') ? [k, v.slice(4, -1).split(',').map(x => x.replace(/^"|"$/g, ''))] : [k, v.slice(3)]);
    const match = r => filters.every(([k, v]) => Array.isArray(v) ? v.includes(String(r[k])) : String(r[k]) === v);
    const single = /vnd\.pgrst\.object/.test(headers.accept || '');
    const represent = q.has('select') || /return=representation/.test(headers.prefer || '');
    const entry = { m, table: 'saves', search: url.search, body: req.postData() ? JSON.parse(req.postData()) : null, status: 200, at: this.log.length };
    this.log.push(entry);
    let rows = this.rows.filter(match);
    if (m === 'GET') {
      const order = (q.get('order') || '').split(',').filter(Boolean).map(s => { const [k, dir] = s.split('.'); return [k, dir === 'desc' ? -1 : 1]; });
      if (order.length) rows = rows.slice().sort((a, b) => { for (const [k, d] of order) { if (a[k] < b[k]) return -d; if (a[k] > b[k]) return d; } return 0; });
      let off = Number(q.get('offset') || 0), lim = q.has('limit') ? Number(q.get('limit')) : null;
      const range = /^(\d+)-(\d+)$/.exec(headers.range || '');
      if (range) { off = Number(range[1]); lim = Number(range[2]) - off + 1; }
      rows = rows.slice(off, lim === null ? undefined : off + lim);
    } else if (m === 'POST') {
      const bodies = Array.isArray(entry.body) ? entry.body : [entry.body];
      const dup = bodies.find(b => this.find(b.kind, b.name, b.tool));
      entry.tool = bodies[0] && bodies[0].tool;
      if (dup) {
        entry.status = 409; entry.rows = [dup.tool + '/' + dup.kind + '/' + dup.name];
        return json(409, { code: '23505', details: 'Key (user_id, tool, kind, name)=(…) already exists.', hint: null, message: 'duplicate key value violates unique constraint "saves_user_id_tool_kind_name_key"' });
      }
      rows = bodies.map(b => { const row = this.fresh(b); this.rows.push(row); return row; });
      entry.status = 201;
    } else if (m === 'PATCH') {
      rows.forEach(r => { Object.assign(r, entry.body); r.updated_at = this.stamp(); r.bytes = JSON.stringify(r.data).length; });
    } else if (m === 'DELETE') {
      this.rows = this.rows.filter(r => !match(r));
    } else return json(405, { message: 'not expected here' });
    entry.rows = rows.map(r => r.tool + '/' + r.kind + '/' + r.name);
    entry.tool = rows.length ? rows[0].tool : entry.tool || null;
    if (m === 'DELETE' && !represent) { entry.status = 204; return route.fulfill({ status: 204, headers: cors }); }
    const out = rows.map(r => this.pick(r, q.get('select')));
    if (single) {
      if (out.length !== 1) return json(406, { code: 'PGRST116', details: 'The result contains ' + out.length + ' rows', hint: null, message: 'JSON object requested, multiple (or no) rows returned' });
      return json(entry.status, out[0]);
    }
    return json(entry.status, out);
  }
}
// Poll the fake's log for a request matching pred, from position `from`, for up to ms.
async function waitLog(cloud, from, pred, ms) {
  const until = Date.now() + (ms || WRITE_WITHIN_MS);
  for (;;) {
    if (cloud.log.slice(from).some(pred)) return true;
    if (Date.now() > until) return false;
    await new Promise(r => setTimeout(r, 100));
  }
}
const hasRow = (e, label) => !!(e.rows && e.rows.includes(label));

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
// answered by the fake cloud, everything else aborted. Every page counts the device-extras cards that open on
// it (window.__cards) and keeps its hydration events (window.__hydrated). ctx.gate.offline = true cuts that
// device's connection to the cloud. blockAccount: the account scripts are not served (a control device).
async function openContext(browser, cloud, seed, opts) {
  opts = opts || {};
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  ctx.gate = { offline: false, name: opts.name || '' };
  await ctx.addInitScript((seed) => { if (localStorage.getItem('__smoke_seeded')) return; for (const k of Object.keys(seed)) localStorage.setItem(k, seed[k]); localStorage.setItem('__smoke_seeded', '1'); }, seed || {});
  await ctx.addInitScript(() => {
    window.__cards = 0; window.__hydrated = [];
    const seen = new WeakSet();
    const note = (o) => { if (!seen.has(o)) { seen.add(o); window.__cards++; } };
    new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; if (n.classList && n.classList.contains('ivsav-overlay')) note(n); else if (n.querySelectorAll) n.querySelectorAll('.ivsav-overlay').forEach(note); } }).observe(document, { childList: true, subtree: true });
    window.addEventListener('ivritsuite:hydrated', e => window.__hydrated.push(e.detail));
  });
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (opts.blockAccount && /\/js\/(ivrit-account|ivrit-saves|ivrit-projects|supabase-config)\.js/.test(u)) return route.abort();
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (u === CFG.sdk) return route.fulfill({ status: 200, body: SDK_BYTES, headers: { 'content-type': 'application/javascript; charset=utf-8', 'access-control-allow-origin': '*' } });
    if (cloud && u.startsWith(CFG.url)) return cloud.handle(route, ctx.gate);
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
// The tools each page hydrates (its own, Suite, and its alsoPull) — settled() is asked about exactly these.
const TOOLS_OF = {
  'index.html': ALL_TOOLS, 'trope_tutor.html': ['TropeTutor', 'Suite'], 'torah_trainer.html': ['TorahTrainer', 'Suite'],
  'flash_cards.html': ['FlashCards', 'Suite', 'Dictionary'], 'hebrew_blend_generator.html': ['Worksheet', 'Suite', 'Dictionary'],
  'hebrew_dictionary.html': ['Dictionary', 'Suite'], 'classroom_dashboard.html': ['Dashboard', 'Suite']
};
// Waits until the module reads settled for those tools — every hydration fired, nothing dirty, no queue busy,
// no card pending — and stays so through a page writer's own debounce; opts.until (a predicate on the fake's
// log, checked in Node) must hold too. No fixed sleep longer than the debounce needs.
async function hydrateAndSettle(page, tools, opts) {
  opts = opts || {};
  const deadline = Date.now() + (opts.timeout || 60000);
  for (;;) {
    const left = deadline - Date.now();
    if (left <= 0) throw new Error('hydrateAndSettle: ' + tools.join(',') + ' did not settle');
    await page.waitForFunction((tools) => !!window.IvritSaves && IvritSaves._test.settled(tools), tools, { timeout: left, polling: 100 });
    if (opts.until && !opts.until()) { await page.waitForTimeout(150); continue; }
    await page.waitForTimeout(opts.grace === undefined ? GRACE_MS : opts.grace);
    const still = await page.evaluate((tools) => IvritSaves._test.settled(tools), tools);
    if (still && (!opts.until || opts.until())) return;
  }
}
async function openPage(ctx, file, opts) {
  opts = opts || {};
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(file + ': ' + String(e && e.message || e)));
  if (process.env.SMOKE_DEBUG) page.on('console', m => console.log('    [' + file + ']', m.type(), m.text().slice(0, 300)));
  await page.goto(BASE + '/' + file, { waitUntil: 'domcontentloaded' });
  if (opts.anonymous) {
    await page.waitForFunction(() => window.IvritSaves && document.readyState !== 'loading', null, { timeout: 25000, polling: 100 });
    await page.waitForTimeout(SETTLE_MS);
    return { page, errors, card: null };
  }
  await page.waitForFunction(() => window.IvritAccount && window.IvritSaves && IvritAccount.status() === 'signed-in', null, { timeout: 25000, polling: 100 });
  const tools = TOOLS_OF[file];
  let card = null;
  if (opts.card) {   // the device-extras card is expected: read it, press the given button, then settle
    await page.waitForFunction((tools) => !!document.querySelector('.ivsav-overlay .ivsav-btn[data-act="add"]') || IvritSaves._test.settled(tools), tools, { timeout: 60000, polling: 100 });
    card = await page.evaluate(() => { const o = document.querySelector('.ivsav-overlay'); return o ? { title: (o.querySelector('.ivsav-card-title') || {}).textContent || '', lines: [...o.querySelectorAll('li')].map(l => l.textContent) } : null; });
    if (card) { if (opts.shot) await page.screenshot({ path: path.join(SHOTS, opts.shot) }); await page.click('.ivsav-overlay .ivsav-btn[data-act="' + opts.card + '"]'); }
  }
  await hydrateAndSettle(page, tools, opts);
  return { page, errors, card };
}
// Open every tool page once (each applies what the store holds and writes back its own form), collecting
// errors; signed in (opts.cloud given) the writes each visit sent are returned per tool.
async function visitAll(ctx, errorsOut, opts) {
  opts = opts || {};
  const writes = {};
  for (const P of PAGES) {
    const before = opts.cloud ? opts.cloud.log.length : 0;
    const { page, errors } = await openPage(ctx, P.file, opts);
    await page.evaluate(P.writer).catch(e => errorsOut.push(P.file + ' writer: ' + e.message));
    if (opts.anonymous) await page.waitForTimeout(400); else await hydrateAndSettle(page, TOOLS_OF[P.file]);
    if (opts.cloud) writes[P.tool] = opts.cloud.writesSince(before).map(FakeCloud.label);
    errorsOut.push(...errors);
    await page.close();
  }
  return writes;
}
const dump = (page) => page.evaluate(() => Object.assign({}, localStorage));
const meta2 = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('ivritSuite_syncMeta2') || '{}'));
const statusOf = (page, host) => page.evaluate((host) => { const s = document.querySelector(host + ' .ivsav-status'); return s ? { text: s.textContent, error: s.classList.contains('is-error') } : null; }, host);
const showWrites = (w) => Object.keys(w).map(t => t + ': ' + (w[t].length ? w[t].join('; ') : 'none')).join(' | ');
const ivritFontNames = (v) => Array.isArray(v) ? v.map(f => f && f.name) : (v && typeof v === 'object' ? Object.keys(v) : []);

/* ---------- the classifier ---------- */
const IGNORED = new Set([AUTH_KEY, 'ivritSuite_accountCache', 'ivritSuite_syncMeta', 'ivritSuite_syncMeta2', 'ivritSuite_syncBase', 'ivritSuite_replaced', '__smoke_seeded']);
const omitted = (field, omit) => (omit || []).some(p => p === field || (p.startsWith('*') && field.endsWith(p.slice(1))) || (p.endsWith('*') && field.startsWith(p.slice(0, -1))));
const isPlain = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const parse = (s) => { if (typeof s !== 'string') return undefined; try { return JSON.parse(s); } catch (e) { return undefined; } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const untouchedDefaultClass = (v) => isPlain(v) && (!Array.isArray(v.names) || v.names.length === 0) && (v.name === undefined || v.name === '' || v.name === 'My class' || v.name === 'הכיתה שלי');
// Paths a page rewrites on load, each justified ({ key, path: 'a.b' | /regex/, why }). A line no difference
// hits is reported STALE-ALLOWLIST. Empty on purpose: every loader currently round-trips its synced paths
// byte for byte (the first visits in 3 send nothing up), so any entry added here without a difference to
// justify it would be reported stale on the next run.
const NORMALIZED = [];
function walk(a, b, p, emit) {
  if (isPlain(a) && isPlain(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) walk(a[k], b[k], p.concat(k), emit);
  } else if (!same(a, b)) emit(p, a, b);
}
const withoutSeedItems = (nodes) => nodes.filter(n => !(isPlain(n) && n.t === 'item' && n.name === 'Default')).map(n => (isPlain(n) && n.t === 'folder' && Array.isArray(n.children)) ? Object.assign({}, n, { children: withoutSeedItems(n.children) }) : n);
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
  // the minted "Default" preset is a local placement in the folder tree too: the module leaves a seed's name out of the
  // tree's projected form, so the device that minted it lists it at the root and a device without it does not
  if (key === 'hebrewDashboard_presetsFolders' && pathArr.join('.') === 'root' && Array.isArray(va) && Array.isArray(vb) && same(withoutSeedItems(va), withoutSeedItems(vb))) return 'EXPECTED-SEED';
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
function reportStale(tag) {
  const stale = NORMALIZED.filter(n => !n.hits);
  if (stale.length) console.log('  ' + tag + ': STALE-ALLOWLIST (no difference hit these): ' + stale.map(n => n.key + ' ' + String(n.path)).join(', '));
  NORMALIZED.forEach(n => { n.hits = 0; });
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
  s.hebrewTropeTutor_settings = J(mutate('hebrewTropeTutor_settings', base('hebrewTropeTutor_settings'), { tradition: 'seph', hebFontSize: 2.6, playbackRate: 1.25, tuneShift: 3, tuneVoice: 'low', noteNames: 'solfa', panelsCollapsed: { 'trope.settings.panel_font': true } }));
  s.hebrewTropeTutor_progress = J({ v: 1, tropes: { etnachta: { r: 3, w: 1 }, sofpasuk: { r: 5, w: 0 } }, families: { disjunctive: true }, pbStreak: 4 });
  s.hebrewTorahTrainer_settings = J(mutate('hebrewTorahTrainer_settings', base('hebrewTorahTrainer_settings'), {
    parshahKey: 'bereshit', layout: 'stacked', translationVersion: 'The Holy Scriptures: A New Translation (JPS 1917)', hebFontSize: 2.0, translitFontSize: 1.1, englishFontSize: 1.1,
    karaokeStyle: 'outline', karaokeFollow: 'translit', handoutFontSize: 'xl', ttsRate: 1.0, karaokeRate: 1.2, translitStyle: 'sbl', clickAction: 'read',
    lastPos: { readingKey: 'bereshit', verse: '1:3', ts: 1700000000000 }, karaokeBarCollapsed: true, panelsCollapsed: { 'torah.settings.panel_copy': true }, loopVerse: '1:2' }));
  s.hebrewTorahTrainer_favorites = J({ 'Bereshit — Aliyah 1': { v: 1, ref: { kind: 'parsha', parshahKey: 'Bereshit', scope: 'parsha-aliyah-1' }, color: '#e69f00', ts: 1700000000000 }, 'Shavuot — Day 1': { v: 1, ref: { kind: 'holiday', holidayKey: 'shavuot-1' }, color: '#0072b2', ts: 1700000001000, settings: { layout: 'stacked', showTranslit: true } } });
  s.hebrewTorahTrainer_favoritesFolders = J({ v: 1, root: [{ t: 'folder', id: 'tf', name: 'Year 1', collapsed: false, children: [{ t: 'folder', id: 'tf1', name: 'Fall', collapsed: false, children: [{ t: 'item', name: 'Bereshit — Aliyah 1' }] }] }, { t: 'item', name: 'Shavuot — Day 1' }] });
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
// The keys a remembered session leaves in localStorage (what a page finds after a sign-in on another load).
const SESSION_KEYS = { [AUTH_KEY]: J(SESSION), ivritSuite_accountCache: J({ email: EMAIL, name: 'Test Teacher' }) };
const withSession = (s) => Object.assign({}, s, SESSION_KEYS);
const signInHere = (page) => page.evaluate((s) => { Object.keys(s).forEach(k => localStorage.setItem(k, s[k])); }, SESSION_KEYS);
const EXPECTED_ROWS = { Suite: 2, TropeTutor: 2, TorahTrainer: 4, FlashCards: 8, Worksheet: 4, Dictionary: 2, Dashboard: 8 };   // 30 rows, six of them folder trees
// A font the teacher made: it lives in IndexedDB, not localStorage, so the dump-and-classify pass below
// cannot see it — it is seeded on A and looked for on B by name.
const FONT_NAME = 'Morah Handwriting', FONT_B64 = 'AAEAAAALAIAAAwAwT1MvMg==';
const seedFont = (page) => page.evaluate(async ([name, b64]) => {
  const bin = atob(b64), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  await saveUserFont(name, u, name);
}, [FONT_NAME, FONT_B64]);
const fontsOn = (page) => page.evaluate(() => listUserFonts().then(l => l.map(f => f.name).sort()));
// The module's canonical hash, in Node (keys sorted at every depth, SHA-256, base64url, the "1." prefix).
const canon = (v) => { if (v === undefined || v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v); if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'; return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'; };
const hashOf = (v) => '1.' + crypto.createHash('sha256').update(canon(v)).digest('base64url');
const findIn = (tree, name) => { const found = []; (function look(nodes, where) { nodes.forEach(n => { if (n.t === 'item' && n.name === name) found.push(where || '/'); if (n.t === 'folder') look(n.children || [], where + '/' + n.name); }); })(tree.root, ''); return found; };

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
    check('0: every settings-blob page wrote its default store; the registry and the suite-wide keys were read', have.length === 0 && REG.length >= 20 && suiteKeys.size === 12, JSON.stringify({ missing: have, reg: REG.length, suite: suiteKeys.size }));
    check('0: 0 pageerrors while capturing', errs.length === 0, errs.join(' | '));
  }
  // ---- 1. device A's data -------------------------------------------------------------------------------
  const A_DATA = buildDeviceA(D);
  {
    const sameAsDefault = MUTATED.filter(([, , d, m]) => same(d, m)).map(([k, f]) => k + (f ? '.' + f : ''));
    check('1: every deliberate change differs from the default (' + MUTATED.length + ' checked)', sameAsDefault.length === 0, sameAsDefault.join(', '));
  }
  // ---- 2. device A opens every tool signed out, then the home page signed in: the card, then everything is up --
  const cloud = new FakeCloud([]);
  const ctxA = await openContext(browser, cloud, A_DATA, { name: 'A' });
  const errA = [];
  let dumpA;
  {
    await visitAll(ctxA, errA, { anonymous: true });
    {
      const hub = await openPage(ctxA, 'index.html', { anonymous: true });
      await seedFont(hub.page);   // a teacher's own font, the one category that lives outside localStorage
      await signInHere(hub.page); // the session lands (as a sign-in on another load would leave it)
      errA.push(...hub.errors); await hub.page.close();
    }
    const before = cloud.log.length;
    const { page, errors, card } = await openPage(ctxA, 'index.html', { card: 'add', shot: '2-A-card.png' });
    const byTool = cloud.byTool();
    const writes = cloud.writesSince(before).map(FakeCloud.label);
    const st = await statusOf(page, '#cloudStatus');
    const m2 = await meta2(page);
    const cards = await page.evaluate(() => window.__cards);
    const nameStep = await page.evaluate(() => IvritAccount._test.nameStepOutcome());
    check('2: the first signed-in load opened the device-extras card once, listing the device\'s items by tool and kind (no name step: the session has a name)', !!card && card.lines.length >= 8 && cards === 1 && nameStep === 'none', JSON.stringify({ card, cards, nameStep }));
    const countsMatch = Object.keys(EXPECTED_ROWS).every(t => byTool[t] === EXPECTED_ROWS[t]) && Object.keys(byTool).length === Object.keys(EXPECTED_ROWS).length;
    check('2: after Add to my account the cloud holds exactly the expected rows per tool (30, six of them folder trees), all inserted, none refused', countsMatch && cloud.rows.length === 30 && writes.every(w => w.startsWith('POST ')) && writes.length === 30, JSON.stringify({ byTool, writes: writes.length, other: writes.filter(w => !w.startsWith('POST ')) }));
    check('2: the status line reports nothing skipped, and the account is marked hydrated on this device', !!st && !st.error && !/Couldn|לא ניתן/.test(st.text) && !!(m2.hydrated || {})[UID] && !!(m2.users || {})[UID], JSON.stringify({ st, hydrated: (m2.hydrated || {})[UID] }));
    await page.screenshot({ path: path.join(SHOTS, '2-A-uploaded.png') });
    dumpA = await dump(page);
    errA.push(...errors);
    check('2: 0 pageerrors on device A', errA.length === 0, errA.join(' | '));
    await page.close();
  }
  // ---- 3. a fresh device B: the home page (no card, everything lands), every page twice, a last home-page load --
  const ctxB = await openContext(browser, cloud, withSession({}), { name: 'B' });
  const errB = [];
  let dumpB;
  {
    const before = cloud.log.length;
    const { page, errors } = await openPage(ctxB, 'index.html');
    const writes = cloud.writesSince(before).map(FakeCloud.label);
    const cards = await page.evaluate(() => window.__cards);
    const st = await statusOf(page, '#cloudStatus');
    const landed = await page.evaluate(() => ({ keys: Object.keys(localStorage).filter(k => /^(hebrew|ivritSuite_wordLists)/.test(k)).sort(), decks: Object.keys(JSON.parse(localStorage.getItem('hebrewFlashCards_presets') || '{}')), rosters: Object.keys((JSON.parse(localStorage.getItem('hebrewDashboard_settings') || '{}').rosters) || {}), lists: Object.keys((JSON.parse(localStorage.getItem('ivritSuite_wordLists') || '{}').lists) || {}), hyd: window.__hydrated }));
    check('3: B\'s home page hydrated everything with no card (nothing extra) and no write', cards === 0 && writes.length === 0 && !!st && !st.error && landed.hyd.length >= 1 && landed.hyd.every(h => h.ok), JSON.stringify({ cards, writes, st, hyd: landed.hyd }));
    check('3: every row landed on B (decks, classes, word lists, the settings and the trees)', same(landed.decks, ['Deck A', 'Deck B']) && same(landed.rosters.slice().sort(), ['a_0', 'a_1']) && same(landed.lists.slice().sort(), ['m1abc_x1y2z', 'm1abd_q9w8e']) && ['hebrewTropeTutor_settings', 'hebrewTropeTutor_progress', 'hebrewTorahTrainer_settings', 'hebrewTorahTrainer_favoritesFolders', 'hebrewFlashCards_profiles', 'hebrewFlashCards_presetsFolders', 'hebrewBlender_lastState', 'hebrewDashboard_schedules'].every(k => landed.keys.includes(k)), JSON.stringify(landed));
    const live = await page.evaluate(() => ({ lang: document.documentElement.lang, dark: document.body.classList.contains('dark'), kbd: localStorage.getItem('hebrewBlender_kbdLayout') }));
    check('3: the suite-wide preferences applied live on B (Hebrew, dark)', live.lang === 'he' && live.dark && live.kbd === 'qwerty', JSON.stringify(live));
    const bFonts = await fontsOn(page);
    const bBytes = await page.evaluate((n) => getUserFont(n).then(r => r && r.bytes ? new Uint8Array(r.bytes).length : 0), FONT_NAME);
    check("3: the teacher's own font came across with its bytes", JSON.stringify(bFonts) === JSON.stringify([FONT_NAME]) && bBytes === 16, JSON.stringify({ bFonts, bBytes }));
    errB.push(...errors);
    await page.close();
    const first = await visitAll(ctxB, errB, { cloud });
    console.log('  3: writes on the first visit of each page (a normalized form may go up once): ' + showWrites(first));
    const firstOk = Object.values(first).every(w => w.every(x => x.startsWith('PATCH ')));
    check('3: a first visit sends at most its normalized form up — updates only, never an insert or a delete', firstOk, showWrites(first));
    const second = await visitAll(ctxB, errB, { cloud });
    check('3: the second visit of each page issues no write', Object.values(second).every(w => w.length === 0), showWrites(second));
    const before2 = cloud.log.length;
    const last = await openPage(ctxB, 'index.html');
    const writes2 = cloud.writesSince(before2).map(FakeCloud.label);
    check('3: a last home-page load issues no write at all', writes2.length === 0, writes2.join('; '));
    await last.page.screenshot({ path: path.join(SHOTS, '3-B-hydrated.png') });
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
    reportStale('4');
    // every synced key B holds is byte-for-byte A's, apart from the classes above
    const synced = REG.filter(e => e.lsKey).map(e => e.lsKey).concat([...suiteKeys]);
    const untouched = synced.filter(k => dumpA[k] === dumpB[k]);
    console.log('  4: keys byte-identical on both devices: ' + untouched.length + ' of ' + new Set(synced).size + ' synced keys');
  }
  // ---- 5. round trip B → A: four changes through the pages' own functions, each up by itself ----------------
  {
    let at;
    const t = await openPage(ctxB, 'torah_trainer.html');
    at = cloud.log.length;
    const flipped = await t.page.evaluate(() => { settings.showTranslit = !settings.showTranslit; saveSettings(); saveSettingsFlush(); return settings.showTranslit; });
    const w1 = await waitLog(cloud, at, e => e.m === 'PATCH' && hasRow(e, 'TorahTrainer/settings/default'));
    await hydrateAndSettle(t.page, TOOLS_OF['torah_trainer.html']);
    errB.push(...t.errors); await t.page.close();
    const d = await openPage(ctxB, 'classroom_dashboard.html');
    at = cloud.log.length;
    await d.page.evaluate(() => { settings.location = 'Haifa, Israel'; delete settings._geoCoords; saveSettingsToStorage(); });
    const w2 = await waitLog(cloud, at, e => e.m === 'PATCH' && hasRow(e, 'Dashboard/settings/default'));
    at = cloud.log.length;
    await d.page.evaluate(() => hkSaveLayout('abc'));   // the shared keyboard block's own writer of the suite-wide key
    const w3 = await waitLog(cloud, at, e => e.m === 'PATCH' && hasRow(e, 'Suite/prefs/default'));
    await hydrateAndSettle(d.page, TOOLS_OF['classroom_dashboard.html']);
    errB.push(...d.errors); await d.page.close();
    const f = await openPage(ctxB, 'flash_cards.html');
    at = cloud.log.length;
    await f.page.evaluate(() => { document.getElementById('presetName').value = 'Deck C'; savePreset(); });
    const w4 = await waitLog(cloud, at, e => e.m === 'POST' && hasRow(e, 'FlashCards/preset/Deck C'));
    await hydrateAndSettle(f.page, TOOLS_OF['flash_cards.html']);
    errB.push(...f.errors); await f.page.close();
    check('5: each of B\'s four changes went up by itself within ' + WRITE_WITHIN_MS / 1000 + ' s (a Torah setting, the city, the keyboard layout: PATCH; a new deck: POST)', w1 && w2 && w3 && w4, JSON.stringify({ torah: w1, city: w2, kbd: w3, deck: w4 }));
    const aT = await openPage(ctxA, 'torah_trainer.html');
    const gotT = await aT.page.evaluate(() => { const s = JSON.parse(localStorage.getItem('hebrewTorahTrainer_settings')); return { stored: s.showTranslit, live: settings.showTranslit, lastPos: s.lastPos, loopVerse: s.loopVerse, panels: s.panelsCollapsed }; });
    errA.push(...aT.errors); await aT.page.close();
    const aD = await openPage(ctxA, 'classroom_dashboard.html');
    const gotD = await aD.page.evaluate(() => { const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings')); return { stored: s.location, live: settings.location, zoom: s.zoomLevel, panels: s.panelsCollapsed, active: s.activeRosterId }; });
    errA.push(...aD.errors); await aD.page.close();
    const aF = await openPage(ctxA, 'flash_cards.html');
    const gotF = await aF.page.evaluate(() => ({ decks: Object.keys(JSON.parse(localStorage.getItem('hebrewFlashCards_presets'))), kbd: localStorage.getItem('hebrewBlender_kbdLayout'), ttsRate: JSON.parse(localStorage.getItem('hebrewFlashCards_settings')).ttsRate }));
    errA.push(...aF.errors); await aF.page.close();
    check('5: A\'s next load of each page holds all four changes, its own per-device fields untouched (reading position, loop, collapsed panels, zoom, class pointer, voice rate)',
      gotT.stored === flipped && gotT.live === flipped && gotT.lastPos && gotT.lastPos.verse === '1:3' && gotT.loopVerse === '1:2' && gotT.panels && gotT.panels['torah.settings.panel_copy'] === true
      && gotD.stored === 'Haifa, Israel' && gotD.live === 'Haifa, Israel' && gotD.zoom === 110 && gotD.panels && gotD.panels['dashboard.settings.panel_weather'] === true && gotD.active === 'a_0'
      && gotF.decks.includes('Deck C') && gotF.kbd === 'abc' && gotF.ttsRate === 1.25, JSON.stringify({ gotT, gotD, gotF }));
  }
  // ---- 6. a folder move on B goes up by itself; A takes it once, inside that folder, pushes nothing back -----
  {
    const f = await openPage(ctxB, 'flash_cards.html');
    const at = cloud.log.length;
    await f.page.evaluate(() => {
      const KEY = 'hebrewFlashCards_presetsFolders', tree = ftRead(KEY);
      tree.root = tree.root.filter(n => !(n.t === 'item' && n.name === 'Deck B'));
      tree.root.push({ t: 'folder', id: ftGenId(), name: 'Spring', collapsed: false, children: [{ t: 'item', name: 'Deck B' }] });
      ftWrite(KEY, tree); renderPresets();   // the shared folder-tree block's own writer, then the page's re-render
    });
    const up = await waitLog(cloud, at, e => e.m === 'PATCH' && hasRow(e, 'FlashCards/presetFolders/default'));
    await hydrateAndSettle(f.page, TOOLS_OF['flash_cards.html']);
    const treeB = await f.page.evaluate(() => JSON.parse(localStorage.getItem('hebrewFlashCards_presetsFolders')));
    const planB = await f.page.evaluate(() => IvritSaves._test.planTool('FlashCards').then(p => p.treesDiffer));
    errB.push(...f.errors); await f.page.close();
    const before = cloud.log.length;
    const a = await openPage(ctxA, 'flash_cards.html');
    const writes = cloud.writesSince(before).map(FakeCloud.label);
    const treeA = await a.page.evaluate(() => JSON.parse(localStorage.getItem('hebrewFlashCards_presetsFolders')));
    const planA = await a.page.evaluate(() => IvritSaves._test.planTool('FlashCards').then(p => p.treesDiffer));
    errA.push(...a.errors); await a.page.close();
    check('6: the folder move went up by itself (PATCH of the tree), A holds Deck B once inside Spring, pushed nothing back, and both devices read the trees as the same',
      up && same(findIn(treeB, 'Deck B'), ['/Spring']) && same(findIn(treeA, 'Deck B'), ['/Spring']) && writes.length === 0 && planA.length === 0 && planB.length === 0,
      JSON.stringify({ up, inB: findIn(treeB, 'Deck B'), inA: findIn(treeA, 'Deck B'), writesByA: writes, planA, planB }));
  }
  // ---- 7. deletions propagate; an edit made elsewhere is re-inserted instead of removed ---------------------
  let backup;   // the account backup B downloads before deleting — restored on a third device in 8
  {
    // A edits Sarah while its connection is down: the edit stays here, the account keeps A's last synced copy
    const a = await openPage(ctxA, 'flash_cards.html');
    ctxA.gate.offline = true;
    const at0 = cloud.log.length;
    await a.page.evaluate(() => { const db = readProfiles(); db.profiles.Sarah.results.push({ savedAt: '2026-09-03T10:00:00.000Z', pct: 80, correct: 8, total: 10, timeSec: 50, timerMode: 'off', settings: { mode: 2 }, cards: [] }); writeProfiles(db); renderProfiles(); });
    const tried = await waitLog(cloud, at0, e => e.aborted && e.m === 'PATCH', WRITE_WITHIN_MS);
    const stA = await statusOf(a.page, '#cloudSavesPanel');
    errA.push(...a.errors); await a.page.close();
    await new Promise(r => setTimeout(r, 400));   // the page's pagehide flush (refused too) is over before the connection returns
    ctxA.gate.offline = false;
    const sarahCloudBefore = JSON.parse(JSON.stringify(cloud.find('profile', 'Sarah', 'FlashCards')));
    check('7: A\'s edit of Sarah could not be sent (the connection was down: the attempt was refused, the status line says so) and the account still holds A\'s last synced copy', tried && !!stA && stA.error && sarahCloudBefore.data.results.length === 2, JSON.stringify({ tried, stA, cloudResults: sarahCloudBefore.data.results.length }));
    // B downloads the account backup (kept for 8), then deletes two students and a class
    const hb = await openPage(ctxB, 'index.html');
    backup = await hb.page.evaluate(() => window.IvritSaves.bundleAll().then(x => x.file));
    errB.push(...hb.errors); await hb.page.close();
    const f = await openPage(ctxB, 'flash_cards.html');
    const at1 = cloud.log.length;
    await f.page.evaluate(() => { window.confirm = () => true; deleteProfile('Dan'); deleteProfile('Sarah'); });
    const del1 = await waitLog(cloud, at1, e => e.m === 'DELETE' && hasRow(e, 'FlashCards/profile/Sarah'));
    await hydrateAndSettle(f.page, TOOLS_OF['flash_cards.html']);
    errB.push(...f.errors); await f.page.close();
    const d = await openPage(ctxB, 'classroom_dashboard.html');
    const at2 = cloud.log.length;
    await d.page.evaluate(() => { const id = Object.keys(settings.rosters).find(k => settings.rosters[k].name === 'Kitah Bet'); switchClass(id); window.confirm = () => true; deleteClass(); });
    const del2 = await waitLog(cloud, at2, e => e.m === 'DELETE' && hasRow(e, 'Dashboard/roster/a_1'));
    await hydrateAndSettle(d.page, TOOLS_OF['classroom_dashboard.html']);
    const localB = await d.page.evaluate(() => ({ profiles: Object.keys(JSON.parse(localStorage.getItem('hebrewFlashCards_profiles')).profiles), classes: Object.values(JSON.parse(localStorage.getItem('hebrewDashboard_settings')).rosters).map(r => r.name) }));
    errB.push(...d.errors); await d.page.close();
    const dels = cloud.log.slice(at1).filter(e => e.m === 'DELETE' && e.table === 'saves');
    check('7: B\'s deletions went up by themselves as conditional DELETEs (id and updated_at both named), and the three rows are gone from the account',
      del1 && del2 && dels.length === 3 && dels.every(e => /id=eq\./.test(e.search) && /updated_at=eq\./.test(e.search) && e.rows.length === 1) && !cloud.find('profile', 'Dan', 'FlashCards') && !cloud.find('profile', 'Sarah', 'FlashCards') && !cloud.find('roster', 'a_1', 'Dashboard') && localB.profiles.length === 0 && !localB.classes.includes('Kitah Bet'),
      JSON.stringify({ del1, del2, dels: dels.map(e => e.search + ' → ' + e.rows.join(',')), localB }));
    // A's next load: the untouched student and the class go here too; the edited student is re-inserted
    const before = cloud.log.length;
    const a2 = await openPage(ctxA, 'index.html');
    const writes = cloud.writesSince(before);
    const labels = writes.map(FakeCloud.label);
    const localA = await a2.page.evaluate(() => { const p = JSON.parse(localStorage.getItem('hebrewFlashCards_profiles')); const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings')); return { profiles: Object.keys(p.profiles), active: p.activeProfile, sarahResults: p.profiles.Sarah ? p.profiles.Sarah.results.length : null, classes: Object.values(s.rosters).map(r => r.name), activeClass: s.activeRosterId }; });
    const sarahCloud = cloud.find('profile', 'Sarah', 'FlashCards');
    errA.push(...a2.errors); await a2.page.close();
    check('7: at A\'s next load Dan and Kitah Bet are gone here too (their hashes equalled A\'s memory), while Sarah — edited here meanwhile — was re-inserted with the edit, one POST, no DELETE',
      same(localA.profiles, ['Sarah']) && localA.active === 'Sarah' && localA.sarahResults === 3 && !localA.classes.includes('Kitah Bet') && localA.classes.includes('Kitah Alef') && localA.activeClass === 'a_0'
      && !!sarahCloud && sarahCloud.data.results.length === 3 && writes.filter(e => e.m === 'POST').length === 1 && labels.includes('POST FlashCards/profile/Sarah') && !writes.some(e => e.m === 'DELETE'),
      JSON.stringify({ localA, cloudSarah: sarahCloud ? sarahCloud.data.results.length : null, writes: labels }));
  }
  // ---- 8. the account backup from B lands on a signed-in third device ------------------------------------
  {
    check('8: the backup carries the font too, in the shape this page\'s own export uses', !!backup.data.userFonts && ivritFontNames(backup.data.userFonts).includes(FONT_NAME), JSON.stringify(Object.keys(backup.data.userFonts || {})));
    check('8: the backup is partial and carries the class lists, the students and the suite-wide preferences as they were before the deletions', backup.partial === true && backup.data.dashboardRosters && backup.data.dashboardRosters.rosters.a_0.names.includes('Noa') && backup.data.dashboardRosters.rosters.a_1.name === 'Kitah Bet' && backup.data.flashCardProfiles.profiles.Dan && backup.data.flashCardProfiles.profiles.Sarah.results.length === 2 && backup.data.suitePrefs && backup.data.suitePrefs.lang === 'he' && backup.data.suitePrefs.kbdLayout === 'abc' && backup.data.generatorPresets['Week 1'], Object.keys(backup.data || {}).join(','));
    const now = await (async () => { const b = await openPage(ctxB, 'index.html'); const f = await b.page.evaluate(() => window.IvritSaves.bundleAll().then(x => x.file)); errB.push(...b.errors); await b.page.close(); return f; })();
    check('8: a backup taken now no longer carries what B deleted (Dan, Kitah Bet) but keeps Sarah as A re-inserted her', !now.data.flashCardProfiles.profiles.Dan && now.data.flashCardProfiles.profiles.Sarah.results.length === 3 && !(now.data.dashboardRosters.rosters || {}).a_1, JSON.stringify({ profiles: Object.keys(now.data.flashCardProfiles.profiles), rosters: Object.keys(now.data.dashboardRosters.rosters) }));
    // a third device with a dashboard of its own (a class, a zoom): signed in, its class is an extra, the account's city wins, zoom stays
    const ctxC = await openContext(browser, cloud, withSession({ hebrewDashboard_settings: J({ location: 'Boston, MA', zoomLevel: 130, rosters: { c_1: { name: 'Mine', names: ['Lior'] } }, activeRosterId: 'c_1' }) }), { name: 'C' });
    const errC = [];
    const before = cloud.log.length;
    const { page: hub, errors, card } = await openPage(ctxC, 'index.html', { card: 'add' });
    errC.push(...errors);
    const w0 = cloud.writesSince(before).map(FakeCloud.label);
    const afterHydrate = await hub.evaluate(() => { const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings')); return { location: s.location, zoom: s.zoomLevel, rosters: Object.keys(s.rosters).sort() }; });
    check('8: the third device\'s own class was the one extra on the card and went up with Add; the account\'s city landed over its own, the zoom stayed', !!card && card.lines.length === 1 && same(w0, ['POST Dashboard/roster/c_1']) && afterHydrate.location === 'Haifa, Israel' && afterHydrate.zoom === 130 && same(afterHydrate.rosters, ['a_0', 'c_1']), JSON.stringify({ card, w0, afterHydrate }));
    const at = cloud.log.length;
    const r = await hub.evaluate(async (text) => {
      window.__alerts = []; window.alert = (m) => window.__alerts.push(String(m));
      window.__asked = false; ivritAskMode = () => { window.__asked = true; return Promise.resolve('merge'); };
      await ivritRestore(text, 'account.ivrit');
      const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings'));
      return { asked: window.__asked, zoom: s.zoomLevel, rosters: Object.keys(s.rosters).sort(), mine: s.rosters.c_1 && s.rosters.c_1.names, kbd: localStorage.getItem('hebrewBlender_kbdLayout'), profiles: Object.keys(JSON.parse(localStorage.getItem('hebrewFlashCards_profiles')).profiles).sort(), status: (document.getElementById('ivritStatus') || {}).textContent || '' };
    }, J(backup));
    check('8: the third device merged it without the Merge/Replace question: the class lists landed beside its own, zoom untouched, the preferences unfolded', r.asked === false && same(r.rosters, ['a_0', 'a_1', 'c_1']) && same(r.mine, ['Lior']) && r.zoom === 130 && r.kbd === 'abc' && same(r.profiles, ['Dan', 'Sarah']), JSON.stringify(r));
    await hydrateAndSettle(hub, ALL_TOOLS);
    const writes = cloud.writesSince(at).map(FakeCloud.label);
    const posts = writes.filter(w => w.startsWith('POST ')).sort(), others = writes.filter(w => !w.startsWith('POST '));
    const sarah = cloud.find('profile', 'Sarah', 'FlashCards');
    check('8: signed in, the merge refilled the account with what the backup still had — the deleted student and class, one POST each — and duplicated nothing (Sarah keeps A\'s three results; no row twice; the other writes are folder trees at most)',
      same(posts, ['POST Dashboard/roster/a_1', 'POST FlashCards/profile/Dan']) && others.every(w => /Folders\/default$/.test(w) && w.startsWith('PATCH ')) && cloud.duplicates().length === 0 && !!sarah && sarah.data.results.length === 3 && !!cloud.find('roster', 'a_1', 'Dashboard') && !!cloud.find('profile', 'Dan', 'FlashCards'),
      JSON.stringify({ posts, others, duplicates: cloud.duplicates(), sarah: sarah ? sarah.data.results.length : null }));
    check('8: 0 pageerrors on the third device', errC.length === 0, errC.join(' | '));
    await hub.close();
    await ctxC.close();
  }
  // ---- 9. the second-device story: every tool opened anonymously first, then signed in on the home page -------
  {
    // A takes the account's latest first (Dan and Kitah Bet are back) and again after B2's pushes, so the
    // comparison is between two devices that both hold the account's latest.
    const resyncA = async () => { const a = await openPage(ctxA, 'index.html'); const d = await dump(a.page); errA.push(...a.errors); await a.page.close(); return d; };
    await resyncA();
    const ctx2 = await openContext(browser, cloud, {}, { name: 'B2' });
    const err2 = [];
    await visitAll(ctx2, err2, { anonymous: true });
    const g = await openPage(ctx2, 'hebrew_blend_generator.html', { anonymous: true });
    const own = await g.page.evaluate(() => ['hebrewTropeTutor_settings', 'hebrewTorahTrainer_settings', 'hebrewFlashCards_settings', 'hebrewBlender_lastState', 'hebrewDashboard_settings'].filter(k => localStorage.getItem(k)));
    await signInHere(g.page);
    err2.push(...g.errors); await g.page.close();
    const before = cloud.log.length;
    const { page, errors } = await openPage(ctx2, 'index.html');
    const cards = await page.evaluate(() => window.__cards);
    const writes = cloud.writesSince(before).map(FakeCloud.label);
    // the account's settings win on every tool: every field the account's row has is what this device now holds
    const SETTINGS = [['TropeTutor', 'settings', 'hebrewTropeTutor_settings'], ['TorahTrainer', 'settings', 'hebrewTorahTrainer_settings'], ['FlashCards', 'settings', 'hebrewFlashCards_settings'], ['Worksheet', 'lastState', 'hebrewBlender_lastState'], ['Dashboard', 'settings', 'hebrewDashboard_settings']];
    const local = await page.evaluate((keys) => { const o = {}; keys.forEach(k => { o[k] = JSON.parse(localStorage.getItem(k) || 'null'); }); return o; }, SETTINGS.map(x => x[2]));
    const lost = [];
    SETTINGS.forEach(([tool, kind, key]) => { const row = cloud.find(kind, 'default', tool); if (!row) { lost.push(key + ': no row'); return; } Object.keys(row.data).forEach(f => { if (!same(row.data[f], (local[key] || {})[f])) lost.push(key + '.' + f); }); });
    const prefsRow = cloud.find('prefs', 'default', 'Suite');
    const prefsLocal = await page.evaluate((fields) => { const o = {}; Object.keys(fields).forEach(f => { const v = localStorage.getItem(fields[f].key); o[f] = v === null ? null : (fields[f].json ? JSON.parse(v) : v); }); return o; }, await page.evaluate(() => { const o = {}; const f = IvritSaves._test.suitePrefs.fields; Object.keys(f).forEach(n => { o[n] = { key: f[n].key, json: !!f[n].json }; }); return o; }));
    const prefsLost = Object.keys(prefsRow.data).filter(f => !same(prefsRow.data[f], prefsLocal[f]));
    check('9: signed in after every tool wrote its defaults (' + own.length + ' blobs written anonymously): no card — settings blobs are never asked about — and the account\'s settings won on every tool, the IvritSuite preferences too', cards === 0 && own.length >= 4 && lost.length === 0 && prefsLost.length === 0, JSON.stringify({ cards, own, lost, prefsLost, writes }));
    console.log('  9: writes on B2\'s sign-in load (the union of a default blob and the account\'s row may go up once per tool): ' + (writes.length ? writes.join('; ') : 'none'));
    check('9: those writes are updates of settings rows only — nothing inserted, nothing deleted, nothing but a settings blob or the preferences row', writes.every(w => /^PATCH \w+\/(settings|lastState|prefs)\/default$/.test(w)), writes.join('; '));
    await page.screenshot({ path: path.join(SHOTS, '9-B2-signed-in.png') });
    errors.length && err2.push(...errors); await page.close();
    const dashBefore = JSON.parse(JSON.stringify(cloud.find('settings', 'default', 'Dashboard').data)), treeBefore = JSON.stringify(cloud.find('presetFolders', 'default', 'Dashboard').data);
    const first = await visitAll(ctx2, err2, { cloud });
    console.log('  9: writes on B2\'s first visit of each page: ' + showWrites(first));
    {
      const dashAfter = cloud.find('settings', 'default', 'Dashboard').data, treeAfter = JSON.stringify(cloud.find('presetFolders', 'default', 'Dashboard').data);
      const changed = [...new Set([...Object.keys(dashBefore), ...Object.keys(dashAfter)])].filter(k => !same(dashBefore[k], dashAfter[k])).map(k => k + ': ' + JSON.stringify(dashBefore[k]) + ' → ' + JSON.stringify(dashAfter[k]));
      if (changed.length || treeBefore !== treeAfter) console.log('  9: the dashboard\'s first run changed the account\'s settings row in: ' + (changed.join('; ') || 'nothing') + (treeBefore !== treeAfter ? ' | and its folder tree: ' + treeBefore + ' → ' + treeAfter : ''));
    }
    const before2 = cloud.log.length;
    const last = await openPage(ctx2, 'index.html');
    const writes2 = cloud.writesSince(before2).map(FakeCloud.label);
    check('9: after every page ran, the last home-page load issues no write', writes2.length === 0, writes2.join('; '));
    const dump2 = await dump(last.page);
    err2.push(...last.errors); await last.page.close();
    const dumpA2 = await resyncA();
    const rows = classifyDumps('9: device A vs device B2 (opened every tool before signing in)', dumpA2, dump2, REG, suiteKeys);
    const bad = rows.filter(r => r.cls === 'UNEXPECTED');
    check('9: every difference between A and B2 is explained (' + rows.length + ' differences, ' + bad.length + ' unexpected)', bad.length === 0, bad.map(r => r.key + (r.path ? ' › ' + r.path : '')).join(', '));
    reportStale('9');
    // Convergence: the dashboard on A (which never minted a "Default" preset) and then on B2 again — after one
    // round neither device should have anything left to push.
    const treeNamesDefault = () => /"name":"Default"/.test(JSON.stringify(cloud.find('presetFolders', 'default', 'Dashboard').data));
    const dashLoad = async (ctx, errs) => { const at = cloud.log.length; const d = await openPage(ctx, 'classroom_dashboard.html'); const presets = await d.page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('hebrewDashboard_presets') || '{}'))); errs.push(...d.errors); await d.page.close(); return { writes: cloud.writesSince(at).map(FakeCloud.label), presets, treeNamesDefault: treeNamesDefault() }; };
    const round = { A: await dashLoad(ctxA, errA), B2: await dashLoad(ctx2, err2), Aagain: await dashLoad(ctxA, errA) };
    check('9: the dashboards converge — after B2\'s first run, the dashboard on A (no "Default" preset of its own), on B2 again and on A again push nothing', Object.values(round).every(r => r.writes.length === 0),
      'each load pushes the folder tree: ' + JSON.stringify(round) + ' — the seed "Default" preset (skipUpload, never a row) is still named in the synced tree by the device that minted it, and pruned by a device without it');
    check('9: 0 pageerrors on device B2', err2.length === 0, err2.join(' | '));
    await ctx2.close();
  }
  // ---- 10. the v1-memory upgrade: the old module's sync memory is a hint, never a deletion --------------------
  {
    const review = cloud.find('preset', 'Review', 'Worksheet'), week1 = cloud.find('preset', 'Week 1', 'Worksheet'), trope = cloud.find('settings', 'default', 'TropeTutor');
    const oldPreset = { selectedLetters: ['ד'], selectedVowels: ['segol'], pageSize: 'letter' };
    const edited = Object.assign({}, trope.data, { tradition: trope.data.tradition === 'ashk' ? 'seph' : 'ashk' });
    const at = '2026-09-10T08:00:00.000Z';
    const v1 = { v: 1, welcomed: { [UID]: at }, users: { [UID]: {
      Worksheet: { preset: {
        Review: { h: review.data_hash, id: review.id, u: review.updated_at, at },                 // (a) deleted here under the old model; still in the account
        'Old preset': { h: hashOf(oldPreset), id: crypto.randomUUID(), u: '2026-09-10T07:00:00.000Z', at }   // (b) the account has since lost it
      } },
      TropeTutor: { settings: { default: { h: trope.data_hash, id: trope.id, u: trope.updated_at, at } } }   // (c) edited here after the remembered hash
    } } };
    const ctxD = await openContext(browser, cloud, withSession({ ivritSuite_syncMeta: J(v1), hebrewBlender_presets: J({ 'Week 1': week1.data, 'Old preset': oldPreset }), hebrewTropeTutor_settings: J(edited) }), { name: 'D' });
    const errD = [];
    const before = cloud.log.length;
    const { page, errors, card } = await openPage(ctxD, 'index.html', { card: 'add', shot: '10-D-card.png' });
    errD.push(...errors);
    const writes = cloud.writesSince(before).map(FakeCloud.label);
    const local = await page.evaluate(() => ({ presets: Object.keys(JSON.parse(localStorage.getItem('hebrewBlender_presets') || '{}')).sort(), tradition: JSON.parse(localStorage.getItem('hebrewTropeTutor_settings')).tradition }));
    const m2 = await meta2(page);
    const legacy = ((m2.legacy || {})[UID]) || {};
    const v2 = ((m2.users || {})[UID]) || {};
    const has = (o, ...p) => p.reduce((x, k) => (x && typeof x === 'object' && Object.prototype.hasOwnProperty.call(x, k)) ? x[k] : undefined, o) !== undefined;
    check('10: the first hydrate deleted nothing on either side: the row deleted here under the old model came down again, the row the account lost went up through the card (never removed here)',
      !writes.some(w => w.startsWith('DELETE')) && same(local.presets, ['Old preset', 'Review', 'Week 1']) && writes.includes('POST Worksheet/preset/Old preset') && !!card && card.lines.some(l => /1$/.test(l.trim())) && !!cloud.find('preset', 'Old preset', 'Worksheet') && !!cloud.find('preset', 'Review', 'Worksheet'),
      JSON.stringify({ writes, local, card }));
    const tropeNow = cloud.find('settings', 'default', 'TropeTutor');
    check('10: the settings blob edited here after the remembered hash went up as a PATCH (the v1 hint said "newer here"), not reverted', writes.includes('PATCH TropeTutor/settings/default') && tropeNow.data.tradition === edited.tradition && local.tradition === edited.tradition, JSON.stringify({ cloud: tropeNow.data.tradition, local: local.tradition, wanted: edited.tradition, writes }));
    check('10: the v1 hint was consumed for the rows now remembered under v2, and the account is marked hydrated', !has(legacy, 'Worksheet', 'preset', 'Review') && !has(legacy, 'Worksheet', 'preset', 'Old preset') && !has(legacy, 'TropeTutor', 'settings', 'default') && has(v2, 'Worksheet', 'preset', 'Review') && has(v2, 'Worksheet', 'preset', 'Old preset') && has(v2, 'TropeTutor', 'settings', 'default') && !!(m2.hydrated || {})[UID], JSON.stringify({ legacy, v2Worksheet: v2.Worksheet, hydrated: (m2.hydrated || {})[UID] }));
    check('10: 0 pageerrors on the upgrading device', errD.length === 0, errD.join(' | '));
    await page.close();
    await ctxD.close();
  }
  const profileCalls = cloud.log.filter(e => e.table === 'profiles').length, unexpected = cloud.log.filter(e => e.unexpected).map(e => e.m + ' ' + e.path);
  console.log('  fake cloud: ' + cloud.log.length + ' requests, ' + profileCalls + ' to the missing profiles table' + (unexpected.length ? ', unexpected: ' + unexpected.join(', ') : ''));
  check('final: no request reached a path the fake does not know', unexpected.length === 0, unexpected.join(', '));
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
