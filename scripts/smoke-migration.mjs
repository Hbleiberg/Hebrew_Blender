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
 *   0. Capture the real default blobs: each tool page is opened anonymously and made to write its
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
 *      by itself, with no card: the previous site knew this account here), the edited blob goes up as a PATCH
 *      rather than being reverted, and the v1 hint is consumed for every row now remembered under v2.
 *  11. Signed out when the update arrives, then signed in again on a device the previous site knew: no card, the
 *      unsynced presets and practice go up by themselves and the status line says so; a copy the old "Delete from
 *      cloud" kept stays here, held back; after a button sign-out, work made signed out gets the usual card (the
 *      automatic add runs once); control: a device the previous site never knew for this account still asks.
 *
 *  12. The shared class roster (js/ivrit-classes.js, the tool `Classes`). Along the main story: A's old rosters and
 *      lists go up as one class each under ids computed from the old data (never offered on the card, no time stamp),
 *      and A, B and the account hold the same classes. Then, on accounts of their own: a roster and a list that are
 *      one class go up as ONE and a rosters-only device adds nothing; two devices offline with a stored session show
 *      their class and write nothing, then come online at once — one row, nothing doubled, and four more loads
 *      (A, B, A, B) send nothing; a class deleted on one device is gone on the other and a fresh device does not make
 *      it again from the old roster; a removed student is restored by the account backup, once; a name added on the
 *      old Dashboard page arrives as exactly one student; a class changed on two devices merges with no dialog; a
 *      button sign-out removes the classes; and while the account refuses the tool (23514, migration 0013 not
 *      applied) the class stays whole on the device and goes up by itself once it is accepted.
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
const ALL_TOOLS = ['Suite', 'Worksheet', 'FlashCards', 'Dictionary', 'TorahTrainer', 'TropeTutor', 'Classes', 'Dashboard', 'LetterLearner', 'EmojiTorah', 'NameTags'];

/* ---------- the fake cloud ---------- */
// The account's rows, answered the way PostgREST would for the queries the module makes: GET (eq. and in.(…)
// filters, order with .asc/.desc, offset/limit or a Range header, select), POST (insert; 409 / 23505 on a
// duplicate tool+kind+name; one object back for .single()), PATCH (the filters, the changed rows back — none
// when the updated_at guard misses), DELETE (the filters; the deleted rows back when a representation is
// asked for). The Auth user endpoints answer with the session's user, logout with 204, and `profiles` is
// missing (404) so the module's fail-soft paths are exercised. Every call is logged.
class FakeCloud {
  constructor(rows) { this.n = 0; this.log = []; this.rows = (rows || []).map(r => this.fresh(r)); this.user = JSON.parse(JSON.stringify(SESSION.user)); this.refuse = null; }   // refuse(m, body) → { status, body } to answer an insert with instead
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
      const no = this.refuse && this.refuse(m, bodies[0]);
      if (no) { entry.status = no.status; entry.refused = true; entry.rows = [bodies[0].tool + '/' + bodies[0].kind + '/' + bodies[0].name]; return json(no.status, no.body); }
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
  { file: 'classroom_dashboard.html', tool: 'Dashboard', writer: 'saveSettingsToStorage();' },
  { file: 'letter_learner.html', tool: 'LetterLearner', writer: 'llSaveSettings();' },
  { file: 'parsha_emojis.html', tool: 'EmojiTorah', writer: 'etCsWrite();' },   // a fresh load writes nothing; the writer stores the defaults
  { file: 'name_tags.html', tool: 'NameTags', writer: 'ntSetWrite();' }   // likewise: the design's defaults (the class lists start empty)
];
// The tools each page hydrates (its own, Suite, and its alsoPull) — settled() is asked about exactly these.
const TOOLS_OF = {
  'index.html': ALL_TOOLS, 'trope_tutor.html': ['TropeTutor', 'Suite'], 'torah_trainer.html': ['TorahTrainer', 'Suite'],
  'flash_cards.html': ['FlashCards', 'Suite', 'Dictionary'], 'hebrew_blend_generator.html': ['Worksheet', 'Suite', 'Dictionary'],
  'hebrew_dictionary.html': ['Dictionary', 'Suite'], 'classroom_dashboard.html': ['Dashboard', 'Suite'], 'letter_learner.html': ['LetterLearner', 'Suite'],
  'parsha_emojis.html': ['EmojiTorah', 'Suite'], 'name_tags.html': ['NameTags', 'Suite']
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
const IGNORED = new Set([AUTH_KEY, 'ivritSuite_accountCache', 'ivritSuite_syncMeta', 'ivritSuite_syncMeta2', 'ivritSuite_syncBase', 'ivritSuite_replaced', 'ivritSuite_removedByAccount', '__smoke_seeded']);
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
  s.hebrewTropeTutor_settings = J(mutate('hebrewTropeTutor_settings', base('hebrewTropeTutor_settings'), { tradition: 'seph', hebFontSize: 2.6, playbackRate: 1.25, tuneShift: 3, tuneVoice: 'low', noteNames: 'solfa', tuneRate: 0.7, tuneRepeats: 3, panelsCollapsed: { 'trope.settings.panel_font': true } }));
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
    location: 'Atlanta, GA', engDateFmt: 'LONG', hebDateScript: 'both', parshaSchedule: 'israel', timeFmt: '24', headerLang: 'en', dashTextHTML: '<div>Boker tov!</div>',
    scheduleEnabled: true, scheduleWeek: WEEK, presetColors: { Morning: '#aabbcc' }, timeSize: 4.5,   // the other toggles are flipped with every boolean
    zoomLevel: 110, panelsCollapsed: { 'dashboard.settings.panel_weather': true },
    rosters: { a_0: { name: 'Kitah Alef', names: ['Noa', 'Eitan'] }, a_1: { name: 'Kitah Bet', names: ['Ari'] } }, activeRosterId: 'a_0', pickerSessions: {}, _geoCoords: { lat: 33.7, lon: -84.4 } }));
  // The Letter Learner writes nothing on a fresh load, so its defaults are spelled out here in the page's own
  // field order; the chosen voice is the row's omitted (per-device) field.
  s.hebrewLetterLearner_settings = J(mutate('hebrewLetterLearner_settings', Object.assign({ v: 1, vowels: { kamatz: true, patach: true, tzere: true, segol: true, chirik: true, cholam: true, vav_cholam: true, kubutz: true, shuruk: true, sheva: true, chataf_patach: true, chataf_segol: true, chataf_kamatz: true }, fontTab: true, splitPairs: true, wordAudio: false, voiceURI: '' }, base('hebrewLetterLearner_settings')),
    { vowels: { kamatz: true, patach: true, tzere: false, segol: true, chirik: true, cholam: true, vav_cholam: true, kubutz: false, shuruk: true, sheva: true, chataf_patach: false, chataf_segol: false, chataf_kamatz: false }, voiceURI: 'com.apple.voice.compact.he-IL.Carmit' }));
  // The coloring sheets' options: every switch flipped by mutate, every other field moved; textLang is absent by default
  // (the site's language) and becomes a real choice here.
  s.hebrewEmojiTorah_settings = J(mutate('hebrewEmojiTorah_settings', base('hebrewEmojiTorah_settings'),
    { paper: 'a4', orient: 'landscape', perSheet: 4, textLang: 'both', sizePic: 120, sizeEn: 90, sizeHe: 110, sizeRef: 80, sizeSummary: 95, sizeWhy: 105, sizeName: 130, copies: 3, collate: 'grouped' }));
  // Name Tags: every switch flipped by mutate, every other design field moved; two class lists (Hebrew, English, a typed
  // transliteration and a per-student extra line), and which one is open — a per-device key outside the registry.
  s.hebrewNameTags_settings = J(mutate('hebrewNameTags_settings', base('hebrewNameTags_settings'),
    { font: 'Alef', bubblePuff: 80, bubbleFill: 'color', bubbleColor: '#ffe0c7', translit: 'custom', translitStyle: 'ashkenazi', sizeHe: 50, sizeTr: 12, sizeEn: 24, sizeEx: 8,
      colorHe: '#003366', colorTr: '#333333', colorEn: '#222222', colorEx: '#444444', border: 'double', borderColor: '#aa3300', bg: 'rainbow', bgColor: '#e0f0ff', paperMode: 'avery', perPage: 10, paper: 'a4' }));
  s.hebrewNameTags_lists = J({ 'Kitah Alef': { v: 1, rows: [{ he: 'דָּוִד', en: 'David' }, { he: 'שִׁירָה', en: 'Shira', tr: 'Shirah', ex: 'Table 2' }], extra: 'Room 4' }, Gan: { v: 1, rows: [{ he: 'נוֹעָה', en: 'Noa' }], extra: '' } });
  s.hebrewNameTags_activeList = 'Kitah Alef';
  s.hebrewDashboard_presets = J({ Morning: { headerLang: 'en', showTimer: true, activeRosterName: 'Kitah Alef' }, Tefillah: { headerLang: 'he', showTimer: false } });
  s.hebrewDashboard_presetsFolders = J({ v: 1, root: [{ t: 'folder', id: 'df', name: 'Weekdays', collapsed: false, children: [{ t: 'folder', id: 'df1', name: 'Early', collapsed: false, children: [{ t: 'item', name: 'Morning' }] }] }, { t: 'item', name: 'Tefillah' }] });
  s.hebrewDashboard_schedules = J({ '2026-2027': { v: 2, week: WEEK } });
  s.hebrewDashboard_schedulesFolders = J({ v: 1, root: [{ t: 'folder', id: 'sf', name: 'This year', collapsed: false, children: [{ t: 'item', name: '2026-2027' }] }] });
  // the suite-wide preferences (all eleven), and what stays per device
  Object.assign(s, { hebrewBlender_lang: 'he', hebrewBlender_darkMode: '1', hebrewBlender_kbdLayout: 'qwerty', hebrewBlender_inputMode: 'manual', hebrewBlender_hebFont: 'David Libre', hebrewBlender_hebFontSize: '62', hebrewBlender_livePreview: '0',
    hebrewFontMaker_lastAuthor: 'Morah Rivka', hebrewDictionary_translitStyle: 'sbl', hebrewDictionary_ttsRate: '1.2', hebrewDictionary_emojiSettings: J({ mode: true, gender: 'all', excludedSubs: ['Animal|Mammal'] }),
    hebrewBlender_panels: J({ 'worksheet.advanced.title': true }), hebrewFlashCards_panels: J({ 'flashcards.advanced.title': true }), hebrewDictionary_panels: J({ 'dictionary.filters.title': true }), hebrewLetterLearner_panels: J({ 'letterlearner.options.vowels_legend': true }),
    hebrewBlender_zoom: '120', hebrewTropeTutor_tourSeen: '1', hebrewDictionary_audioEnabled: '0' });
  ['hebrewBlender_lang', 'hebrewBlender_darkMode', 'hebrewBlender_kbdLayout', 'hebrewBlender_inputMode', 'hebrewBlender_hebFont', 'hebrewBlender_hebFontSize', 'hebrewBlender_livePreview', 'hebrewFontMaker_lastAuthor', 'hebrewDictionary_translitStyle', 'hebrewDictionary_ttsRate', 'hebrewDictionary_emojiSettings']
    .forEach(k => MUTATED.push([k, '', D[k] === undefined ? null : D[k], s[k]]));
  return s;
}
// The keys a remembered session leaves in localStorage (what a page finds after a sign-in on another load).
const SESSION_KEYS = { [AUTH_KEY]: J(SESSION), ivritSuite_accountCache: J({ email: EMAIL, name: 'Test Teacher' }) };
const withSession = (s) => Object.assign({}, s, SESSION_KEYS);
const signInHere = (page) => page.evaluate((s) => { Object.keys(s).forEach(k => localStorage.setItem(k, s[k])); }, SESSION_KEYS);
// 39 rows, six of them folder trees. Classes: the shared roster's four — one per old Dashboard roster and Name Tags list
// (the roster and the list both named Kitah Alef hold different students, so they stay two) — made by the home page from
// the old keys once the account was heard from, never offered on the card.
const EXPECTED_ROWS = { Suite: 2, TropeTutor: 2, TorahTrainer: 4, FlashCards: 8, Worksheet: 4, Dictionary: 2, Dashboard: 8, LetterLearner: 1, EmojiTorah: 1, NameTags: 3, Classes: 4 };
const EXPECTED_TOTAL = Object.values(EXPECTED_ROWS).reduce((a, b) => a + b, 0);
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
    const have = ['hebrewTropeTutor_settings', 'hebrewTorahTrainer_settings', 'hebrewFlashCards_settings', 'hebrewBlender_lastState', 'hebrewDashboard_settings', 'hebrewEmojiTorah_settings', 'hebrewNameTags_settings'].filter(k => !D[k]);
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
    check('2: after Add to my account the cloud holds exactly the expected rows per tool (' + EXPECTED_TOTAL + ', six of them folder trees), all inserted, none refused', countsMatch && cloud.rows.length === EXPECTED_TOTAL && writes.every(w => w.startsWith('POST ')) && writes.length === EXPECTED_TOTAL, JSON.stringify({ byTool, writes: writes.length, other: writes.filter(w => !w.startsWith('POST ')) }));
    {   // the shared class roster: one class per old source, under ids computed from the old data, with no time stamp
      const cls = cloud.rows.filter(r => r.tool === 'Classes' && r.kind === 'class'), by = {};
      cls.forEach(r => { by[r.name.replace(/^nt_.*/, 'nt') + ':' + r.data.name] = r.data.students.length; });
      const cardNamesClasses = !card || card.lines.filter(l => /Class lists|רשימות כיתה/.test(l)).length !== 2;   // the Dashboard's and Name Tags' lines only
      check('2: the old rosters and lists went up as four classes (the Dashboard\'s keep their ids, the lists get computed ones), none of them stamped, none listed on the card as a second copy',
        canon(by) === canon({ 'a_0:Kitah Alef': 2, 'a_1:Kitah Bet': 1, 'nt:Kitah Alef': 2, 'nt:Gan': 1 }) && cls.every(r => !('updated' in r.data) && !('created' in r.data) && r.data.students.every(st => !st.t)) && !cloud.find('retired', 'default', 'Classes') && !cardNamesClasses && cloud.duplicates().length === 0,
        JSON.stringify({ by, card: card && card.lines, dup: cloud.duplicates() }));
    }
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
    const ca = JSON.parse(dumpA.ivritSuite_classes || 'null'), cb = JSON.parse(dumpB.ivritSuite_classes || 'null');
    const inCloud = {}; cloud.rows.filter(r => r.tool === 'Classes' && r.kind === 'class').forEach(r => { inCloud[r.name] = r.data; });
    check('4: the shared classes are the same on A, on B and in the account (compared key-sorted), and neither device rewrote an old key to make them', !!ca && !!cb && canon(ca.classes) === canon(cb.classes) && canon(ca.classes) === canon(inCloud) && canon(JSON.parse(dumpA.hebrewNameTags_lists)) === canon(JSON.parse(dumpB.hebrewNameTags_lists)) && dumpA.hebrewNameTags_lists === A_DATA.hebrewNameTags_lists,
      JSON.stringify({ a: ca && Object.keys(ca.classes), b: cb && Object.keys(cb.classes), cloud: Object.keys(inCloud) }));
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
    // Sarah's own update refused, then the line given up to 2 s to say so: the fake cloud logs the refusal before the page
    // hears of it, and a read in that instant can still see "Saving…". A line that never says so still fails.
    const sarahId = cloud.find('profile', 'Sarah', 'FlashCards').id;
    const tried = await waitLog(cloud, at0, e => e.aborted && e.m === 'PATCH' && String(e.search).includes('id=eq.' + sarahId), WRITE_WITHIN_MS);
    await a.page.waitForFunction(() => { const s = document.querySelector('#cloudSavesPanel .ivsav-status'); return !!s && s.classList.contains('is-error'); }, null, { timeout: 2000, polling: 50 }).catch(() => {});
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
    check('8: the third device\'s own class was the one extra on the card (once: its shared-roster copy is made after the Add, never offered beside it) and went up with Add; the account\'s city landed over its own, the zoom stayed', !!card && card.lines.length === 1 && same(w0.slice().sort(), ['POST Classes/class/c_1', 'POST Dashboard/roster/c_1']) && afterHydrate.location === 'Haifa, Israel' && afterHydrate.zoom === 130 && same(afterHydrate.rosters, ['a_0', 'c_1']), JSON.stringify({ card, w0, afterHydrate }));
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
    check('10: the first hydrate deleted nothing on either side: the row deleted here under the old model came down again, the row the account lost went up by itself — no card, the previous site knew this account here (never removed here)',
      !writes.some(w => w.startsWith('DELETE')) && same(local.presets, ['Old preset', 'Review', 'Week 1']) && writes.includes('POST Worksheet/preset/Old preset') && !card && (await page.evaluate(() => window.__cards)) === 0 && !!cloud.find('preset', 'Old preset', 'Worksheet') && !!cloud.find('preset', 'Review', 'Worksheet'),
      JSON.stringify({ writes, local, card }));
    const tropeNow = cloud.find('settings', 'default', 'TropeTutor');
    check('10: the settings blob edited here after the remembered hash went up as a PATCH (the v1 hint said "newer here"), not reverted', writes.includes('PATCH TropeTutor/settings/default') && tropeNow.data.tradition === edited.tradition && local.tradition === edited.tradition, JSON.stringify({ cloud: tropeNow.data.tradition, local: local.tradition, wanted: edited.tradition, writes }));
    check('10: the v1 hint was consumed for the rows now remembered under v2, and the account is marked hydrated', !has(legacy, 'Worksheet', 'preset', 'Review') && !has(legacy, 'Worksheet', 'preset', 'Old preset') && !has(legacy, 'TropeTutor', 'settings', 'default') && has(v2, 'Worksheet', 'preset', 'Review') && has(v2, 'Worksheet', 'preset', 'Old preset') && has(v2, 'TropeTutor', 'settings', 'default') && !!(m2.hydrated || {})[UID], JSON.stringify({ legacy, v2Worksheet: v2.Worksheet, hydrated: (m2.hydrated || {})[UID] }));
    check('10: 0 pageerrors on the upgrading device', errD.length === 0, errD.join(' | '));
    await page.close();
    await ctxD.close();
  }
  // ---- 11. an account the previous site knew on this device: its unsynced work goes up once, by itself ----------
  {
    const c11 = new FakeCloud([]);
    const at = '2026-09-10T08:00:00.000Z';
    const keptHere = { selectedLetters: ['ק'], selectedVowels: ['kamatz'], pageSize: 'letter' };
    const v1 = { v: 1, welcomed: { [UID]: at }, users: { [UID]: { Worksheet: { preset: { 'Kept here': { deletedCloud: true, h: hashOf(keptHere), at } } } } } };
    const presets = { 'Lesson A': { selectedLetters: ['א'], selectedVowels: ['patach'], pageSize: 'letter' }, 'Lesson B': { selectedLetters: ['ב'], selectedVowels: ['segol'], pageSize: 'letter' }, 'Kept here': keptHere };
    const progress = { v: 1, tropes: { etnachta: { r: 4, w: 1 } }, families: {}, pbStreak: 2 };
    // signed out when the update arrives (the session ended); the teacher signs in again afterwards
    const ctxE = await openContext(browser, c11, { ivritSuite_syncMeta: J(v1), hebrewBlender_presets: J(presets), hebrewTropeTutor_progress: J(progress) }, { name: 'E' });
    const pre = await openPage(ctxE, 'index.html', { anonymous: true });
    await signInHere(pre.page);
    await pre.page.close();
    const from = c11.log.length;
    const { page, errors } = await openPage(ctxE, 'index.html', {});
    const writes = c11.writesSince(from).map(FakeCloud.label);
    const cards = await page.evaluate(() => window.__cards);
    const st = await statusOf(page, '#cloudStatus');
    const m2 = await meta2(page);
    const local = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('hebrewBlender_presets') || '{}')).sort());
    check('11: signing in again after the update on a device the previous site knew: no card, the unsynced presets and practice went up by themselves, and the status line says so',
      cards === 0 && writes.includes('POST Worksheet/preset/Lesson A') && writes.includes('POST Worksheet/preset/Lesson B') && !!c11.find('progress', 'default', 'TropeTutor') && !writes.some(w => w.startsWith('DELETE')) && !!st && /were added to your account/.test(st.text) && !!(m2.upgraded || {})[UID],
      JSON.stringify({ cards, writes, st, upgraded: (m2.upgraded || {})[UID] }));
    check("11: the copy the previous site's \"Delete from cloud\" kept on this device stays here and is not sent up", local.includes('Kept here') && !c11.find('preset', 'Kept here', 'Worksheet') && typeof (((m2.noUpload || {})[UID]) || {})['Worksheet/preset/Kept here'] === 'string', JSON.stringify({ local, noUpload: (m2.noUpload || {})[UID] }));
    // later: signed out with the button, a preset made while signed out, signed in again — the card asks as usual
    await page.evaluate(() => IvritAccount.signOut());
    await page.close();
    const p2 = await openPage(ctxE, 'index.html', { anonymous: true });
    await p2.page.evaluate(() => { const p = JSON.parse(localStorage.getItem('hebrewBlender_presets') || '{}'); p['Made signed out'] = { selectedLetters: ['ג'], selectedVowels: ['tzere'], pageSize: 'letter' }; localStorage.setItem('hebrewBlender_presets', JSON.stringify(p)); });
    await signInHere(p2.page);
    await p2.page.close();
    const from2 = c11.log.length;
    const again = await openPage(ctxE, 'index.html', { card: 'add' });
    const writes2 = c11.writesSince(from2).map(FakeCloud.label);
    check('11: once it has run, a later sign-in with work made while signed out gets the usual card (it ran only once; it also lists the kept-here copy, now the teacher’s choice), and Add sends that work up', !!again.card && again.card.lines.some(l => /Presets: 2$/.test(l.trim())) && writes2.includes('POST Worksheet/preset/Made signed out'), JSON.stringify({ card: again.card, writes2 }));
    check('11: 0 pageerrors', errors.length === 0 && pre.errors.length === 0 && p2.errors.length === 0 && again.errors.length === 0, errors.concat(pre.errors, p2.errors, again.errors).join(' | '));
    await again.page.close();
    await ctxE.close();
    // control: a device where the previous site never knew this account still asks
    const c11b = new FakeCloud([]);
    const ctxF = await openContext(browser, c11b, withSession({ ivritSuite_syncMeta: J({ v: 1, welcomed: { 'someone-else': at }, users: {} }), hebrewBlender_presets: J({ 'Lesson A': presets['Lesson A'] }) }), { name: 'F' });
    const ctl = await openPage(ctxF, 'index.html', { card: 'add' });
    check('11: control — on a device the previous site never knew this account, the card still asks first', !!ctl.card && ctl.errors.length === 0, JSON.stringify({ card: ctl.card, errors: ctl.errors }));
    await ctl.page.close();
    await ctxF.close();
  }
  // ---- 12. the shared class roster across devices: one class each, nothing doubled, nothing brought back -------
  {
    const classRows = (c) => c.rows.filter(r => r.tool === 'Classes' && r.kind === 'class');
    const viewOf = (page) => page.evaluate(() => ({ view: IvritClasses.list().map(c => [c.id, c.students.length, c.stored]), raw: localStorage.getItem('ivritSuite_classes') }));
    const classesOn = (page) => page.evaluate(() => (JSON.parse(localStorage.getItem('ivritSuite_classes') || '{"classes":{}}').classes));
    const err12 = [];
    // 12a. a roster and a list that are one class (same name, the same students one for one) go up as ONE class;
    //      a second device holding only the roster adds nothing
    {
      const R = { rosters: { r_0: { name: 'Kitah Gimel', names: ['Noa', 'Eitan'] } }, activeRosterId: 'r_0' };
      const L = { 'Kitah Gimel': { v: 1, rows: [{ he: 'נֹעָה', en: 'Noa' }, { he: '', en: 'Eitan', tr: 'Eytan' }], extra: 'Room 7' } };
      const c = new FakeCloud([]);
      const ctx1 = await openContext(browser, c, withSession({ hebrewDashboard_settings: J(R), hebrewNameTags_lists: J(L) }), { name: 'R1' });
      const p1 = await openPage(ctx1, 'index.html', { card: 'add' });
      const cls = c.find('class', 'r_0', 'Classes'), ret = c.find('retired', 'default', 'Classes');
      check('12a: a roster and a list that are one class went up as ONE class under the roster\'s id — the list\'s Hebrew name, transliteration and extra line filled in — and the list\'s id is recorded so no device makes it a class again',
        !!p1.card && p1.card.lines.length === 2 && classRows(c).length === 1 && !!cls && same(cls.data.students.map(x => [x.he, x.en, x.tr || '']), [['נֹעָה', 'Noa', ''], ['', 'Eitan', 'Eytan']]) && cls.data.extra === 'Room 7'
        && !!ret && Object.keys(ret.data.retired).length === 1 && Object.values(ret.data.retired)[0] === 1 && !('classes' in ret.data) && c.duplicates().length === 0,
        JSON.stringify({ card: p1.card, classes: classRows(c).map(r => r.name), cls: cls && cls.data, ret: ret && ret.data }));
      err12.push(...p1.errors); await p1.page.close();
      const ctx2 = await openContext(browser, c, withSession({ hebrewDashboard_settings: J(R) }), { name: 'R2' });
      const at = c.log.length;
      const p2 = await openPage(ctx2, 'index.html', { card: 'add' });
      const w2 = c.writesSince(at).map(FakeCloud.label), v2 = await viewOf(p2.page), l2 = await classesOn(p2.page);
      check('12a: a second device that holds only the roster shows the one class with everything the list added, and sends nothing (no card, no write)',
        !p2.card && w2.length === 0 && same(v2.view, [['r_0', 2, true]]) && canon(l2.r_0) === canon(cls.data) && classRows(c).length === 1, JSON.stringify({ card: p2.card, w2, v2: v2.view }));
      err12.push(...p2.errors); await p2.page.close();
      await ctx1.close(); await ctx2.close();
    }
    // 12b. two devices with the same old class, both offline with a stored session, then both online at once
    const c13 = new FakeCloud([]);
    const S = { rosters: { s_0: { name: 'Kitah Dalet', names: ['Ari', 'דָּוִד / David', 'Maya (aide)'] } }, activeRosterId: 's_0' };
    const cx = await openContext(browser, c13, withSession({ hebrewDashboard_settings: J(S) }), { name: 'S1' });
    const cy = await openContext(browser, c13, withSession({ hebrewDashboard_settings: J(S) }), { name: 'S2' });
    {
      cx.gate.offline = cy.gate.offline = true;
      const offline = async (ctx) => {
        const page = await ctx.newPage();
        page.on('pageerror', e => err12.push('offline: ' + String(e && e.message || e)));
        await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.IvritClasses && window.IvritSaves && document.readyState === 'complete', null, { timeout: 25000, polling: 100 });
        await page.waitForTimeout(2500);
        const r = await viewOf(page);
        await page.close();
        return r;
      };
      const ox = await offline(cx), oy = await offline(cy);
      check('12b: offline with a stored session, each device still shows its class (read from the old roster) and writes nothing — not the class store, not the account',
        same(ox.view, [['s_0', 3, false]]) && ox.raw === null && same(oy.view, [['s_0', 3, false]]) && oy.raw === null && c13.rows.length === 0, JSON.stringify({ ox, oy, rows: c13.rows.length }));
      cx.gate.offline = cy.gate.offline = false;
      const [px, py] = await Promise.all([openPage(cx, 'index.html', { card: 'add' }), openPage(cy, 'index.html', { card: 'add' })]);
      err12.push(...px.errors, ...py.errors); await px.page.close(); await py.page.close();
      // one more load each lets the two settle on what the other sent (reported, not judged) …
      const settleW = [];
      for (const ctx of [cx, cy]) { const at = c13.log.length; const p = await openPage(ctx, 'index.html'); settleW.push(c13.writesSince(at).map(FakeCloud.label)); err12.push(...p.errors); await p.page.close(); }
      console.log('  12b: writes while the two devices settled: ' + settleW.map(w => w.length ? w.join('; ') : 'none').join(' | '));
      // … and then four loads, A B A B, must send nothing at all: nothing trades writes
      const round = [], local = [];
      for (const ctx of [cx, cy, cx, cy]) { const at = c13.log.length; const p = await openPage(ctx, 'index.html'); round.push(c13.writesSince(at).map(FakeCloud.label)); local.push(await classesOn(p.page)); err12.push(...p.errors); await p.page.close(); }
      const row = c13.find('class', 's_0', 'Classes');
      check('12b: both online at once → the account holds the class ONCE (one row, three students, nothing doubled), both devices hold exactly that, and four more loads — A, B, A, B — send nothing',
        classRows(c13).length === 1 && !!row && same(row.data.students.map(x => [x.he, x.en]), [['', 'Ari'], ['דָּוִד', 'David'], ['', 'Maya (aide)']]) && c13.duplicates().length === 0
        && round.every(w => w.length === 0) && local.every(l => canon(l) === canon({ s_0: row.data })),
        JSON.stringify({ rows: c13.rows.map(r => r.tool + '/' + r.kind + '/' + r.name), dup: c13.duplicates(), round, students: row && row.data.students }));
    }
    // 12c. a class deleted on one device: gone on the other, and a device that never held it does not bring it back
    {
      const p = await openPage(cx, 'index.html');
      const at = c13.log.length;
      await p.page.evaluate(() => IvritClasses.deleteClass('s_0'));
      const sent = await waitLog(c13, at, e => e.m === 'DELETE' && hasRow(e, 'Classes/class/s_0')) && await waitLog(c13, at, e => (e.m === 'POST' || e.m === 'PATCH') && hasRow(e, 'Classes/retired/default'));
      await hydrateAndSettle(p.page, ALL_TOOLS);
      err12.push(...p.errors); await p.page.close();
      const at2 = c13.log.length;
      const q = await openPage(cy, 'index.html');
      const vy = await viewOf(q.page), wy = c13.writesSince(at2).map(FakeCloud.label);
      const bin = await q.page.evaluate(() => { const b = JSON.parse(localStorage.getItem('ivritSuite_removedByAccount') || '{}'); return Object.values(b.users || {}).flatMap(u => Object.values(u)).map(x => x.tool + '/' + x.kind + '/' + x.name); });
      err12.push(...q.errors); await q.page.close();
      const cz = await openContext(browser, c13, withSession({}), { name: 'S3' });
      const at3 = c13.log.length;
      const z = await openPage(cz, 'index.html', { card: 'add' });
      const vz = await viewOf(z.page), wz = c13.writesSince(at3).map(FakeCloud.label);
      const rosterLanded = await z.page.evaluate(() => Object.keys((JSON.parse(localStorage.getItem('hebrewDashboard_settings') || '{}').rosters) || {}));
      err12.push(...z.errors); await z.page.close(); await cz.close();
      check('12c: a class deleted on one device went up as one DELETE and a record of its id; the other device lost it (a copy kept in its recovery bin) and sent nothing back',
        sent && classRows(c13).length === 0 && !!c13.find('retired', 'default', 'Classes') && vy.view.length === 0 && wy.length === 0 && bin.includes('Classes/class/s_0'), JSON.stringify({ sent, vy: vy.view, wy, bin }));
      check('12c: a fresh device downloads the old roster (still in the account) and does NOT make the deleted class again: nothing shown, nothing sent',
        !z.card && same(rosterLanded, ['s_0']) && vz.view.length === 0 && wz.length === 0 && classRows(c13).length === 0, JSON.stringify({ card: z.card, rosterLanded, vz: vz.view, wz }));
    }
    await cx.close(); await cy.close();
    // 12d. a deleted student, a backup that restores her, an edit made on the old Dashboard page, a class changed in two places
    {
      const c = new FakeCloud([]);
      const U = { rosters: { u_0: { name: 'Kitah Hey', names: ['Noa', 'Eitan'] } }, activeRosterId: 'u_0' };
      const ce = await openContext(browser, c, withSession({ hebrewDashboard_settings: J(U) }), { name: 'E1' });
      const e1 = await openPage(ce, 'index.html', { card: 'add' });
      const bk = await e1.page.evaluate(() => window.IvritSaves.bundleAll().then(x => x.file));
      const noa = c.find('class', 'u_0', 'Classes').data.students.find(x => x.en === 'Noa').id;
      let at = c.log.length;
      await e1.page.evaluate((sid) => IvritClasses.removeStudent('u_0', sid), noa);
      const patched = await waitLog(c, at, e => e.m === 'PATCH' && hasRow(e, 'Classes/class/u_0'));
      await hydrateAndSettle(e1.page, ALL_TOOLS);
      const afterDel = JSON.parse(JSON.stringify(c.find('class', 'u_0', 'Classes').data));
      check('12d: a student removed in the roster went up as one update of her class: she is out of the list and kept in its removed-students record (her name, for Restore)',
        patched && bk.partial === true && !!(bk.data.classes && bk.data.classes.classes && bk.data.classes.classes.u_0) && same(afterDel.students.map(x => x.en), ['Eitan']) && !!afterDel.gone && afterDel.gone[noa] && afterDel.gone[noa].en === 'Noa',
        JSON.stringify({ patched, backupClasses: bk.data.classes && Object.keys(bk.data.classes.classes || {}), afterDel }));
      at = c.log.length;
      const asked = await e1.page.evaluate(async (text) => { window.alert = () => {}; window.__asked = false; ivritAskMode = () => { window.__asked = true; return Promise.resolve('merge'); }; await ivritRestore(text, 'account.ivrit'); return window.__asked; }, J(bk));
      await hydrateAndSettle(e1.page, ALL_TOOLS);
      const afterRestore = c.find('class', 'u_0', 'Classes').data, wr = c.writesSince(at).map(FakeCloud.label);
      check('12d: the account backup taken before brings her back — the same student (her id), once, no question asked, one update of the class and no row twice',
        asked === false && same(afterRestore.students.map(x => x.en).sort(), ['Eitan', 'Noa']) && afterRestore.students.find(x => x.en === 'Noa').id === noa && !(afterRestore.gone && afterRestore.gone[noa]) && wr.filter(w => /Classes\/class/.test(w)).length === 1 && wr.every(w => !w.startsWith('POST ') && !w.startsWith('DELETE ')) && c.duplicates().length === 0,
        JSON.stringify({ asked, students: afterRestore.students, wr }));
      err12.push(...e1.errors); await e1.page.close();
      // the Dashboard page of this build still edits its own roster (the page that will read the shared classes comes
      // later): a line it adds reaches the class as exactly one student, and the load after that sends nothing
      const d = await openPage(ce, 'classroom_dashboard.html');
      at = c.log.length;
      await d.page.evaluate(() => { settings.rosters.u_0.names.push('Dan'); saveSettingsToStorage(); });
      const rosterUp = await waitLog(c, at, e => e.m === 'PATCH' && hasRow(e, 'Dashboard/roster/u_0'));
      await hydrateAndSettle(d.page, TOOLS_OF['classroom_dashboard.html']);
      err12.push(...d.errors); await d.page.close();
      at = c.log.length;
      const h1 = await openPage(ce, 'index.html');
      const w1 = c.writesSince(at).map(FakeCloud.label), after = c.find('class', 'u_0', 'Classes').data.students.map(x => x.en);
      err12.push(...h1.errors); await h1.page.close();
      at = c.log.length;
      const h2 = await openPage(ce, 'index.html');
      const w2 = c.writesSince(at).map(FakeCloud.label);
      check('12d: a name added on the old Dashboard page reached the class as exactly one student (one update), nothing else was imported again, and the next load sent nothing',
        rosterUp && same(w1, ['PATCH Classes/class/u_0']) && same(after.slice().sort(), ['Dan', 'Eitan', 'Noa']) && w2.length === 0, JSON.stringify({ rosterUp, w1, after, w2 }));
      // a class changed in two places: this device corrects a name while its connection is down, another device adds
      // the class's extra line; back online, the home page merges the two (no dialog) and the account holds both
      ce.gate.offline = true;
      const eitan = c.find('class', 'u_0', 'Classes').data.students.find(x => x.en === 'Eitan').id;
      await h2.page.evaluate((sid) => IvritClasses.setStudentField('u_0', sid, 'en', 'Eytan'), eitan);
      await h2.page.waitForTimeout(2600);   // its own send is tried and refused
      err12.push(...h2.errors); await h2.page.close();
      const ce2 = await openContext(browser, c, withSession({}), { name: 'E2' });
      const o = await openPage(ce2, 'index.html', { card: 'add' });
      at = c.log.length;
      await o.page.evaluate(() => IvritClasses.setClassExtra('u_0', 'Room 9'));
      const extraUp = await waitLog(c, at, e => e.m === 'PATCH' && hasRow(e, 'Classes/class/u_0'));
      await hydrateAndSettle(o.page, ALL_TOOLS);
      err12.push(...o.errors); await o.page.close();
      await new Promise(r => setTimeout(r, 400));
      ce.gate.offline = false;
      at = c.log.length;
      const m = await openPage(ce, 'index.html');
      const overlays = await m.page.evaluate(() => document.querySelectorAll('.ivsav-overlay').length);
      const mergedRow = c.find('class', 'u_0', 'Classes').data, localM = (await classesOn(m.page)).u_0;
      err12.push(...m.errors); await m.page.close();
      at = c.log.length;
      const o2 = await openPage(ce2, 'index.html');
      const back = c.writesSince(at).map(FakeCloud.label), localO = (await classesOn(o2.page)).u_0;
      err12.push(...o2.errors); await o2.page.close();
      check('12d: a class changed on two devices was merged on the home page with no dialog — the corrected name and the extra line are both in the account and on both devices, three students still, and the other device sent nothing back',
        extraUp && overlays === 0 && mergedRow.extra === 'Room 9' && mergedRow.students.find(x => x.id === eitan).en === 'Eytan' && mergedRow.students.length === 3 && canon(localM) === canon(mergedRow) && canon(localO) === canon(mergedRow) && back.length === 0 && c.duplicates().length === 0,
        JSON.stringify({ extraUp, overlays, mergedRow, back }));
      // a button sign-out removes the account's classes from the device with the rest
      const so = await openPage(ce2, 'index.html');
      const before = await viewOf(so.page);
      await so.page.evaluate(() => { window.confirm = () => true; return IvritAccount.signOut(); });
      await so.page.waitForFunction(() => !localStorage.getItem('ivritSuite_classes') || Object.keys((JSON.parse(localStorage.getItem('ivritSuite_classes')).classes) || {}).length === 0, null, { timeout: 20000, polling: 100 }).catch(() => {});
      const left = await so.page.evaluate(() => ({ classes: Object.keys((JSON.parse(localStorage.getItem('ivritSuite_classes') || '{}').classes) || {}), rosters: Object.keys((JSON.parse(localStorage.getItem('hebrewDashboard_settings') || '{}').rosters) || {}) }));
      err12.push(...so.errors); await so.page.close();
      check('12d: signing out with the account button took the account\'s classes off the device (the shared class and the old roster alike); the account still holds them',
        before.view.length === 1 && left.classes.length === 0 && left.rosters.length === 0 && !!c.find('class', 'u_0', 'Classes'), JSON.stringify({ before: before.view, left }));
      await ce.close(); await ce2.close();
    }
    // 12e. the account does not know the tool yet (migration 0013 not applied: the server answers every Classes
    //       insert with 23514): nothing is lost on the device, and the class goes up by itself once it is applied
    {
      const c = new FakeCloud([]);
      c.refuse = (m, body) => (m === 'POST' && body && body.tool === 'Classes') ? { status: 400, body: { code: '23514', details: null, hint: null, message: 'new row for relation "saves" violates check constraint "saves_tool_check"' } } : null;
      const ctx = await openContext(browser, c, withSession({ hebrewDashboard_settings: J({ rosters: { w_0: { name: 'Kitah Vav', names: ['Tamar'] } }, activeRosterId: 'w_0' }) }), { name: 'W' });
      const p = await openPage(ctx, 'index.html', { card: 'add' });
      await waitLog(c, 0, e => e.refused, WRITE_WITHIN_MS);
      await hydrateAndSettle(p.page, ALL_TOOLS);
      const v1 = await viewOf(p.page), refusedN = c.log.filter(e => e.refused).length;
      err12.push(...p.errors); await p.page.close();
      const p2 = await openPage(ctx, 'index.html');
      const v2 = await viewOf(p2.page);
      err12.push(...p2.errors); await p2.page.close();
      check('12e: while the account refuses the tool (23514, migration 0013 not applied) the class stays on the device, shown and whole, the old roster went up as usual, and no page error',
        refusedN >= 1 && classRows(c).length === 0 && !!c.find('roster', 'w_0', 'Dashboard') && same(v1.view, [['w_0', 1, true]]) && same(v2.view, [['w_0', 1, true]]), JSON.stringify({ refusedN, v1: v1.view, v2: v2.view }));
      c.refuse = null;
      const at = c.log.length;
      const p3 = await openPage(ctx, 'index.html');
      const w3 = c.writesSince(at).map(FakeCloud.label);
      err12.push(...p3.errors); await p3.page.close();
      check('12e: once the account accepts the tool, the next load sends the class up by itself (one insert)', same(w3, ['POST Classes/class/w_0']) && classRows(c).length === 1, JSON.stringify({ w3 }));
      await ctx.close();
    }
    check('12: 0 pageerrors across the shared-roster stories', err12.length === 0, err12.join(' | '));
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
