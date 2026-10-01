#!/usr/bin/env node
/*
 * smoke-fontmaker.mjs — headless end-to-end test of the Hebrew Font Maker's cloud projects against a FAKE
 * cloud: Playwright serves the pinned SDK from a local file, seeds a remembered session, and answers the
 * project's PostgREST tables (`font_projects`, `saves`) AND its Storage endpoints (upload, download, list,
 * remove — the shapes @supabase/supabase-js 2.x sends) from memory. No real network is used.
 *
 * Scenarios:
 *   0. Anonymous, CDN blocked, the four account scripts blocked vs present: 0 pageerrors, the chip beside the
 *      language switcher, the Load menu with and without its "In your account" section, localStorage byte-
 *      identical between the two runs (the "anonymous flow unchanged" bar).
 *   1. Signed in: a small project (two raster letters, a JPEG sheet, an inline SVG sheet) → Save to my
 *      account → one row, one project file that decodes to `cloud:` sentinels + a manifest with no raster
 *      data URLs left, three photo objects with the right types, project.cloudId/cloudRev, the ☁ badge Saved.
 *   2. An edit → the cloud autosave → the row updated, a new project file, NO photo re-uploaded.
 *   3. A fresh browser context: the Load menu lists the project with its size; Open → the data URLs come
 *      back byte-equal, the SVG sheet is intact, the badge shows Saved; a re-save uploads no photo.
 *   4. Another device changes the row → the next autosave raises the conflict dialog; Overwrite takes the
 *      row as it is; a second change + Keep both makes a second project (a copy) with its own row.
 *   5. Delete from the Load menu removes the row and every object in its folder.
 *   6. Keep an export: the Exported ✓ dialog's ☁ button uploads the file and the Load row gains ⬇.
 *   7. Storage refuses a photo (413): the save fails cleanly, no row stays behind, the badge stays hidden.
 *   8. ?start=<unknown>&error=access_denied: both params stripped, 0 pageerrors.
 *   9. Hebrew + dark at 800 px: the Load menu's cloud section renders (screenshot).
 *  10. Sign out from the chip with unsaved changes to a cloud project: the change reaches the account (a PATCH
 *      of the row) BEFORE the logout, the page does not reload (the project stays in memory), the local snapshot
 *      records the account copy as clean.
 *  11. Another tab signs out (the hub): the Font Maker tab is not reloaded — its in-memory edit and its local
 *      snapshot survive — and it ends signed out.
 *  12. "Continue where you left off" from a snapshot taken while the cloud save was pending: the save resumes
 *      (the badge says Unsaved and the next cloud autosave updates the row).
 *  13. My Fonts: removing a font while the SDK has not loaded (signed in, offline) marks the deletion in the sync
 *      memory and sends no request; the next signed-in load sends the DELETE and the font stays gone; the
 *      signed-in remove dialog says the font leaves the account.
 *  14. Teacher A's unsent project continued by teacher B on the same browser is never saved into B's account.
 *  15. An edit made while an upload runs is not marked saved: the next autosave sends it.
 *  16. Recent lives in IndexedDB with no cap: an old localStorage list moves over whole (then the key goes),
 *      eleven projects stay listed, a save still lands with localStorage full, the 🗑 removes only its row,
 *      and a row opens its own project.
 *
 * Run from the repo root:  node scripts/smoke-fontmaker.mjs --sdk path/to/supabase.js [--port 8082]
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
const { chromium } = pkg;

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };
const PORT = Number(arg('--port') || 8082);
const BASE = 'http://localhost:' + PORT;
const cfgSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/supabase-config.js'), 'utf8'), cfgSandbox);
const CFG = cfgSandbox.window.IVRIT_SUPABASE;
const AUTH_KEY = 'sb-' + new URL(CFG.url).hostname.split('.')[0] + '-auth-token';
const ACCOUNT_SCRIPTS = ['/js/supabase-config.js', '/js/ivrit-account.js', '/js/ivrit-saves.js', '/js/ivrit-projects.js'];
const SDK_FILE = arg('--sdk');
const SDK_BYTES = SDK_FILE && fs.existsSync(SDK_FILE) ? fs.readFileSync(SDK_FILE) : null;
if (!SDK_BYTES) { console.error('smoke-fontmaker: pass --sdk <path to the pinned supabase.js UMD build>'); process.exit(2); }
const SHOTS = process.env.SMOKE_SHOTS || path.join(process.env.TMPDIR || '/tmp', 'smoke-fontmaker');
fs.mkdirSync(SHOTS, { recursive: true });
const PAGE = 'Hebrew_Font_Maker.html';
const UID = '11111111-1111-4111-8111-111111111111';
const SESSION = { access_token: 'x', refresh_token: 'y', expires_at: 4102444800, token_type: 'bearer', user: { id: UID, email: 'teacher@example.org', user_metadata: { full_name: 'Test Teacher' } } };   // a name, so the name step stays closed
const LIMITS = { 'font-projects': { size: 20 * 1024 * 1024, types: ['application/gzip', 'application/x-gzip'] }, 'font-sources': { size: 15 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] }, 'font-exports': { size: 5 * 1024 * 1024, types: ['font/ttf', 'font/woff2', 'application/zip', 'application/octet-stream'] } };

/* ---------- the fake cloud: PostgREST tables + Storage ---------- */
function parseMultipart(buf, contentType) {   // the SDK sends a Blob upload as FormData: cacheControl + an unnamed file part
  const m = /boundary=("?)([^";]+)\1/.exec(contentType || ''); if (!m) return null;
  const boundary = Buffer.from('--' + m[2]);
  const parts = []; let pos = buf.indexOf(boundary);
  while (pos >= 0) {
    let start = pos + boundary.length;
    if (buf.slice(start, start + 2).toString() === '--') break;
    start += 2;   // CRLF
    const headEnd = buf.indexOf('\r\n\r\n', start); if (headEnd < 0) break;
    const head = buf.slice(start, headEnd).toString();
    const next = buf.indexOf(boundary, headEnd);
    const body = buf.slice(headEnd + 4, next - 2);   // strip the CRLF before the next boundary
    const name = (/name="([^"]*)"/.exec(head) || [])[1] || '';
    const filename = (/filename="([^"]*)"/.exec(head) || [])[1];
    const type = (/content-type:\s*([^\r\n]+)/i.exec(head) || [])[1] || '';
    parts.push({ name, filename, type: type.trim(), body });
    pos = next;
  }
  return parts;
}
class FakeCloud {
  constructor() { this.n = 0; this.log = []; this.tables = { font_projects: [], saves: [] }; this.objects = {}; this.fail413Once = false; this.rls = false; this.tokens = { x: UID }; this.users = { [UID]: SESSION.user }; this.holdUploads = 0; }
  stamp() { return new Date(Date.UTC(2026, 8, 15, 8, 0, 0) + (++this.n) * 1000).toISOString(); }
  freshRow(table, body) {
    const at = this.stamp();
    const base = table === 'font_projects'
      ? { id: crypto.randomUUID(), user_id: UID, name: null, family_name: null, style: null, schema_version: null, letters_done: 0, has_images: false, project_path: null, project_bytes: 0, sources_bytes: 0, export_path: null, exported_at: null, client_saved_at: null, created_at: at, updated_at: at }
      : { id: crypto.randomUUID(), user_id: UID, created_at: at, updated_at: at, client_updated_at: null, data_hash: null, bytes: 0 };
    return Object.assign(base, body);
  }
  pick(row, select) { if (!select) return row; const out = {}; select.split(',').forEach(k => { k = k.trim(); out[k] = row[k]; }); return out; }
  files(bucket, folder) {   // objects directly under folder
    const out = [];
    Object.keys(this.objects).forEach(k => { const [b, ...rest] = k.split('|'); const key = rest.join('|'); if (b !== bucket) return; if (!key.startsWith(folder + '/')) return; const tail = key.slice(folder.length + 1); if (tail.includes('/')) return; out.push({ name: tail, obj: this.objects[k] }); });
    return out;
  }
  async handle(route) {
    const req = route.request(), url = new URL(req.url()), m = req.method();
    const who = this.tokens[String(req.headers().authorization || '').replace(/^Bearer\s+/i, '')] || null;   // the signed-in user of this request
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
    const json = (status, body) => route.fulfill({ status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, cors), body: JSON.stringify(body) });
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (url.pathname.endsWith('/auth/v1/user')) return json(200, (who && this.users[who]) || SESSION.user);
    if (url.pathname.endsWith('/auth/v1/token')) return json(200, Object.assign({ expires_in: 3600 }, SESSION));
    if (url.pathname.endsWith('/auth/v1/logout')) { this.log.push({ m, kind: 'logout' }); return route.fulfill({ status: 204, headers: cors }); }
    // ---- Storage ----
    let sm = /\/storage\/v1\/object\/list\/([^/]+)$/.exec(url.pathname);
    if (sm && m === 'POST') {
      const body = JSON.parse(req.postData() || '{}');
      const prefix = String(body.prefix || '').replace(/\/$/, '');
      let rows = this.files(sm[1], prefix).map(f => ({ name: f.name, id: f.obj.id, updated_at: f.obj.at, created_at: f.obj.at, last_accessed_at: f.obj.at, metadata: { size: f.obj.bytes.length, mimetype: f.obj.type } }));
      rows.sort((a, b) => a.name < b.name ? -1 : 1);
      const off = Number(body.offset || 0), lim = Number(body.limit || 100);
      this.log.push({ m, kind: 'list', bucket: sm[1], prefix });
      return json(200, rows.slice(off, off + lim));
    }
    sm = /\/storage\/v1\/object\/([^/]+)\/(.+)$/.exec(url.pathname);
    if (sm && (m === 'POST' || m === 'PUT')) {
      if (this.holdUploads) await new Promise(r => setTimeout(r, this.holdUploads));
      const bucket = sm[1], key = decodeURIComponent(sm[2]);
      const parts = parseMultipart(req.postDataBuffer() || Buffer.alloc(0), req.headers()['content-type']);
      const file = parts ? parts.find(p => p.filename !== undefined || p.name === '') : null;
      const bytes = file ? file.body : (req.postDataBuffer() || Buffer.alloc(0));
      const type = file ? file.type : (req.headers()['content-type'] || '');
      const lim = LIMITS[bucket];
      this.log.push({ m, kind: 'upload', bucket, key, size: bytes.length, type, upsert: req.headers()['x-upsert'] });
      if (this.fail413Once) { this.fail413Once = false; return json(413, { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' }); }
      if (!lim) return json(404, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' });
      if (bytes.length > lim.size) return json(413, { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' });
      if (!lim.types.includes(type)) return json(415, { statusCode: '415', error: 'invalid_mime_type', message: 'mime type ' + type + ' is not supported' });
      this.objects[bucket + '|' + key] = { id: crypto.randomUUID(), bytes, type, at: this.stamp() };
      return json(200, { Key: bucket + '/' + key, Id: this.objects[bucket + '|' + key].id });
    }
    if (sm && m === 'GET') {
      const o = this.objects[sm[1] + '|' + decodeURIComponent(sm[2])];
      this.log.push({ m, kind: 'download', bucket: sm[1], key: decodeURIComponent(sm[2]), found: !!o });
      if (!o) return json(404, { statusCode: '404', error: 'not_found', message: 'Object not found' });
      return route.fulfill({ status: 200, headers: Object.assign({ 'content-type': o.type }, cors), body: o.bytes });
    }
    sm = /\/storage\/v1\/object\/([^/]+)$/.exec(url.pathname);
    if (sm && m === 'DELETE') {
      const body = JSON.parse(req.postData() || '{}');
      const removed = [];
      (body.prefixes || []).forEach(p => { const k = sm[1] + '|' + p; if (this.objects[k]) { removed.push({ name: p }); delete this.objects[k]; } });
      this.log.push({ m, kind: 'remove', bucket: sm[1], paths: body.prefixes || [] });
      return json(200, removed);
    }
    // ---- PostgREST ----
    const tm = /\/rest\/v1\/([A-Za-z_]+)$/.exec(url.pathname);
    if (!tm || !this.tables[tm[1]]) { this.log.push({ m, path: url.pathname, unexpected: true }); return json(404, { message: 'not found' }); }
    const table = tm[1], q = url.searchParams;
    const filters = [...q.entries()].filter(([k, v]) => !['select', 'order', 'offset', 'limit'].includes(k) && /^(eq|in)\./.test(v))
      .map(([k, v]) => v.startsWith('in.') ? [k, v.slice(4, -1).split(',').map(x => x.replace(/^"|"$/g, ''))] : [k, v.slice(3)]);
    const match = r => filters.every(([k, v]) => Array.isArray(v) ? v.includes(String(r[k])) : String(r[k]) === v);
    const single = /vnd\.pgrst\.object/.test(req.headers().accept || '');
    const entry = { m, table, search: url.search, body: req.postData() ? JSON.parse(req.postData()) : null, status: 200 };
    this.log.push(entry);
    let rows = this.tables[table].filter(match).filter(r => !this.rls || r.user_id === who);   // as RLS: a row is visible to its owner only
    if (m === 'GET') {
      const order = (q.get('order') || '').split(',').filter(Boolean).map(s => { const [k, dir] = s.split('.'); return [k, dir === 'desc' ? -1 : 1]; });
      if (order.length) rows = rows.slice().sort((a, b) => { for (const [k, d] of order) { if (a[k] < b[k]) return -d; if (a[k] > b[k]) return d; } return 0; });
      const off = Number(q.get('offset') || 0);
      rows = rows.slice(off, q.has('limit') ? off + Number(q.get('limit')) : undefined);
    } else if (m === 'POST') {
      if (table === 'font_projects' && this.tables.font_projects.some(r => r.name === entry.body.name && (!this.rls || r.user_id === who))) return json(409, { code: '23505', message: 'duplicate key value violates unique constraint "font_projects_one_name"', details: null, hint: null });
      const row = this.freshRow(table, Object.assign({}, entry.body, this.rls && who ? { user_id: who } : {})); this.tables[table].push(row); rows = [row]; entry.status = 201;
    } else if (m === 'PATCH') {
      rows.forEach(r => { Object.assign(r, entry.body); r.updated_at = this.stamp(); });
    } else if (m === 'DELETE') {
      this.tables[table] = this.tables[table].filter(r => !match(r));
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
function seedFor(signedIn) {
  const s = { hebrewFontMaker_tourDone: '1', hebrewFontMaker_mobileWarnDismissed: '1' };
  if (signedIn) {
    s[AUTH_KEY] = JSON.stringify(SESSION);
    s.ivritSuite_accountCache = JSON.stringify({ email: 'teacher@example.org', name: 'Test Teacher' });
    s.ivritSuite_syncMeta = JSON.stringify({ v: 1, users: {}, welcomed: { [UID]: '2026-09-14T00:00:00.000Z' } });
  }
  return s;
}
async function openContext(browser, cloud, seed, { blockAccount = false, viewport = { width: 1280, height: 900 } } = {}) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport });
  await ctx.addInitScript((seed) => { if (localStorage.getItem('__smoke_seeded')) return; for (const k of Object.keys(seed)) localStorage.setItem(k, seed[k]); localStorage.setItem('__smoke_seeded', '1'); }, seed);
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(BASE)) { if (blockAccount && ACCOUNT_SCRIPTS.some(s => u.startsWith(BASE + s))) return route.abort(); return route.continue(); }
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (cloud && u === CFG.sdk) return route.fulfill({ status: 200, body: SDK_BYTES, headers: { 'content-type': 'application/javascript; charset=utf-8', 'access-control-allow-origin': '*' } });
    if (cloud && u.startsWith(CFG.url)) return cloud.handle(route);
    return route.abort();
  });
  return ctx;
}
// Loads the page, waits for the wizard gate (a clean profile opens it after I18n.ready) and dismisses it.
async function openPage(ctx, { query = '', signedIn = false } = {}) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.goto(BASE + '/' + PAGE + query, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.readyState !== 'loading', null, { timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => document.querySelector('.overlay.open'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  if (signedIn) await page.waitForFunction(() => window.IvritAccount && window.IvritProjects && IvritAccount.status() === 'signed-in', null, { timeout: 25000 });
  await page.waitForTimeout(600);
  return { page, errors };
}
const dump = (page) => page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => k !== '__smoke_seeded').sort()));
// The fixture is built by the page itself: a fresh project, two raster letters, a JPEG sheet, an inline SVG sheet, one traced letter.
const FIXTURE = `(async () => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 4; const x = c.getContext('2d');
  x.fillStyle = '#123456'; x.fillRect(0, 0, 4, 4); const png1 = c.toDataURL('image/png');
  x.fillStyle = '#654321'; x.fillRect(0, 0, 2, 2); const png2 = c.toDataURL('image/png');
  const jpg = c.toDataURL('image/jpeg', 0.9);
  const svg = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>');
  const p = JSON.parse(JSON.stringify(project));
  p.font.familyName = 'Smoke Font'; p.font.reservedFontName = 'Smoke Font';
  p.letters[0].source = { kind: 'single', dataUrl: png1, cropRect: null, sheetId: null };
  p.letters[0].contours = [{ winding: 'cw', points: [[0, 0], [100, 0], [100, 100]] }];
  p.letters[1].source = { kind: 'single', dataUrl: png2, cropRect: null, sheetId: null };
  p.combinedSheets = [{ id: 's_jpg', name: 'sheet.jpg', dataUrl: jpg }, { id: 's_svg', name: 'sheet.svg', dataUrl: svg }];
  window.__fx = { png1, png2, jpg, svg };
  return await applyProjectData(p);
})()`;
const state = (page) => page.evaluate(() => ({
  cloudId: project && project.cloudId, cloudRev: project && project.cloudRev, name: project && project.font.familyName,
  l0: project && project.letters[0].source.dataUrl, l1: project && project.letters[1].source.dataUrl,
  sheets: project ? project.combinedSheets.map(s => s.dataUrl) : [],
  pip: (() => { const p = document.getElementById('cloudPip'); return p ? { hidden: p.hidden, state: p.dataset.state, text: p.textContent } : null; })(),
  status: (document.getElementById('statusMsg') || {}).textContent || ''
}));
const askTitle = (page) => page.evaluate(() => { const o = document.getElementById('askOverlay'); return o && o.classList.contains('open') ? (o.querySelector('h2, h3, .modal-title, #askTitle') || o).textContent.trim() : ''; });
async function clickAsk(page, re) {
  await page.waitForFunction(() => document.getElementById('askOverlay') && document.getElementById('askOverlay').classList.contains('open'), null, { timeout: 15000 });
  const clicked = await page.evaluate((src) => { const b = [...document.querySelectorAll('#askOverlay button')].find(b => new RegExp(src).test(b.textContent)); if (b) { b.click(); return b.textContent.trim(); } return ''; }, re);
  return clicked;
}
function gunzipJson(bytes) { return JSON.parse(zlib.gunzipSync(Buffer.from(bytes)).toString('utf8')); }
async function waitFor(fn, ms) { const end = Date.now() + ms; while (Date.now() < end) { if (fn()) return true; await new Promise(r => setTimeout(r, 100)); } return fn(); }
function folderObjects(cloud, bucket, id) { return cloud.files(bucket, UID + '/' + id); }

const browser = await chromium.launch();
const srv = await startServer();
try {
  // ---- 0. anonymous: control (account scripts blocked) vs present ----------------------------------
  {
    let control, ctrlErrors;
    { const ctx = await openContext(browser, null, seedFor(false), { blockAccount: true }); const { page, errors } = await openPage(ctx); control = await dump(page); ctrlErrors = errors; await ctx.close(); }
    check('0: control run (no account scripts) has 0 pageerrors', ctrlErrors.length === 0, ctrlErrors.join(' | '));
    const ctx = await openContext(browser, null, seedFor(false));
    const { page, errors } = await openPage(ctx);
    const chip = await page.evaluate(() => { const sw = document.querySelector('[data-i18n-switcher]'), chip = document.querySelector('.ivacct'); return { mounted: !!chip, sameParent: !!chip && !!sw && chip.parentElement === sw.parentElement, label: chip ? chip.textContent.trim() : '' }; });
    check('0: chip mounted beside the language switcher, anonymous', chip.mounted && chip.sameParent && /Sign in/.test(chip.label), JSON.stringify(chip));
    const menus = await page.evaluate(() => {
      document.querySelector('[data-i18n="fontmaker.toolbar.load_project"]').click();
      const lm = document.getElementById('loadMenu'); const load = lm ? lm.textContent : ''; if (lm) closeLoadMenu();
      document.querySelector('[data-i18n="fontmaker.toolbar.save_project_menu"]').click();
      const sm = document.getElementById('saveMenu'); const save = sm ? sm.textContent : ''; if (sm) closeSaveMenu();
      return { load, save, pip: document.getElementById('cloudPip').hidden };
    });
    check('0: signed out, the Load menu offers a sign-in row under "In your account" and the Save menu a sign-in row', /In your account/.test(menus.load) && /Sign in to see/.test(menus.load) && /Sign in to save/.test(menus.save) && menus.pip === true, JSON.stringify(menus));
    check('0: the Load menu says Recent belongs to this browser', /Recent is this browser only/.test(menus.load), menus.load.slice(0, 200));
    const after = await dump(page);
    check('0: localStorage byte-identical to the control run', after === control, after === control ? '' : 'differs');
    check('0: 0 pageerrors with the account scripts present, CDN blocked', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 1–2. save, then autosave ---------------------------------------------------------------------
  const cloud = new FakeCloud();
  let firstId = null;
  {
    const ctx = await openContext(browser, cloud, seedFor(true));
    const { page, errors } = await openPage(ctx, { signedIn: true });
    const fx = await page.evaluate(FIXTURE);
    check('1: the fixture project loaded through applyProjectData', fx === true, String(fx));
    // Signed in with nothing saved yet — what a second device shows. The empty line must name the way across.
    const empty = await page.evaluate(async () => {
      document.querySelector('[data-i18n="fontmaker.toolbar.load_project"]').click();
      const lm = document.getElementById('loadMenu');
      for (let i = 0; i < 60 && /Checking your account/.test(lm.textContent); i++) await new Promise(r => setTimeout(r, 100));
      const text = lm.textContent; closeLoadMenu(); return text;
    });
    check('1: with an empty account the Load menu names Save Project → Save to my account, and says Recent is local', /No projects in your account yet/.test(empty) && /Save to my account/.test(empty) && /Recent is this browser only/.test(empty), empty.slice(0, 260));
    const saved = await page.evaluate(() => fmCloudWrite('new'));
    let st = await state(page);
    const rows = cloud.tables.font_projects;
    const row = rows[0];
    firstId = row && row.id;
    check('1: Save to my account made one row with the project\'s name, 1 letter done, a project path and sizes', saved === true && rows.length === 1 && row.name === 'Smoke Font' && row.letters_done === 1 && /^11111111-1111-4111-8111-111111111111\/[0-9a-f-]{36}\/project-[a-z0-9]+\.json\.gz$/.test(row.project_path) && row.project_bytes > 0 && row.sources_bytes > 0 && row.has_images === true, JSON.stringify({ saved, rows: rows.length, row }));
    const srcs = folderObjects(cloud, 'font-sources', firstId);
    const types = srcs.map(f => f.obj.type).sort();
    check('1: three photo objects were uploaded with their original types (png, png, jpeg)', srcs.length === 3 && JSON.stringify(types) === JSON.stringify(['image/jpeg', 'image/png', 'image/png']) && srcs.every(f => /^[0-9a-f]{16}\.(png|jpg)$/.test(f.name)), JSON.stringify(srcs.map(f => [f.name, f.obj.type, f.obj.bytes.length])));
    const projs = folderObjects(cloud, 'font-projects', firstId);
    const packed = projs.length ? gunzipJson(projs[0].obj.bytes) : null;
    const text = packed ? JSON.stringify(packed) : '';
    check('1: the project file holds cloud: sentinels + a manifest and no raster data URL; the SVG sheet stays inline', !!packed && projs.length === 1 && packed.letters[0].source.dataUrl.startsWith('cloud:') && packed.letters[1].source.dataUrl.startsWith('cloud:') && packed.combinedSheets[0].dataUrl.startsWith('cloud:') && packed.combinedSheets[1].dataUrl.startsWith('data:image/svg+xml') && !/data:image\/(png|jpeg)/.test(text) && Object.keys(packed.cloudSources || {}).length === 3 && packed.cloudRev === undefined && packed.cloudId === undefined, text.slice(0, 200));
    check('1: the live project carries cloudId + cloudRev and keeps its data URLs; the ☁ badge says Saved', st.cloudId === firstId && st.cloudRev === row.updated_at && st.l0 && st.l0.startsWith('data:image/png') && st.pip && !st.pip.hidden && st.pip.state === 'saved', JSON.stringify(st));
    check('1: 0 pageerrors', errors.length === 0, errors.join(' | '));
    // 2. an edit → cloud autosave (no photo re-upload)
    const before = { uploads: cloud.log.filter(e => e.kind === 'upload' && e.bucket === 'font-sources').length, rev: row.updated_at };
    await page.evaluate(() => { udDo([{ t: 'item', kind: 'letter', cp: '05D0' }], 'smoke', () => { const l = project.letters.find(l => l.codepoint === '05D0'); l.advance = (l.advance || 600) + 1; }); });
    const dirty = await state(page);
    check('2: an edit marks the account copy Unsaved', dirty.pip && dirty.pip.state === 'unsaved', JSON.stringify(dirty.pip));
    const auto = await page.evaluate(() => fmCloudAutosave().then(() => true));
    st = await state(page);
    const uploadsAfter = cloud.log.filter(e => e.kind === 'upload' && e.bucket === 'font-sources').length;
    await waitFor(() => folderObjects(cloud, 'font-projects', firstId).length === 1, 5000);   // the previous file's removal is best-effort and not awaited by save()
    const projs2 = folderObjects(cloud, 'font-projects', firstId);
    check('2: the autosave updated the row and the project file without re-uploading any photo', auto === true && row.updated_at !== before.rev && st.cloudRev === row.updated_at && uploadsAfter === before.uploads && projs2.length === 1 && projs2[0].name !== projs[0].name && st.pip.state === 'saved', JSON.stringify({ uploadsBefore: before.uploads, uploadsAfter, files: projs2.map(f => f.name), pip: st.pip }));
    check('2: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await page.screenshot({ path: path.join(SHOTS, '2-saved-badge.png') });
    await ctx.close();
  }
  // ---- 3–6. a fresh browser: list, open, conflict, keep both, export keep, delete ------------------
  {
    const ctx = await openContext(browser, cloud, seedFor(true));
    const { page, errors } = await openPage(ctx, { signedIn: true });
    await page.evaluate(() => document.querySelector('[data-i18n="fontmaker.toolbar.load_project"]').click());
    await page.waitForFunction(() => document.querySelector('#loadMenuCloud .load-menu-row'), null, { timeout: 15000 });
    const menu = await page.evaluate(() => ({ rows: [...document.querySelectorAll('#loadMenuCloud .load-menu-row')].map(r => r.textContent), dl: !!document.querySelector('#loadMenuCloud .load-menu-cdl') }));
    check('3: the Load menu lists the account project with letters, size and time', menu.rows.length === 1 && /Smoke Font/.test(menu.rows[0]) && /1 letter\b/.test(menu.rows[0]) && /KB|MB/.test(menu.rows[0]) && !menu.dl, JSON.stringify(menu));
    await page.screenshot({ path: path.join(SHOTS, '3-load-menu.png') });
    await page.evaluate(() => closeLoadMenu());
    const fxRef = await page.evaluate(FIXTURE.replace('return await applyProjectData(p);', 'return true;'));   // only to get the fixture data URLs into window.__fx
    await page.evaluate((id) => fmCloudOpen(id), firstId);
    await page.waitForFunction((id) => project && project.cloudId === id && !document.getElementById('importProgressOverlay').classList.contains('open'), firstId, { timeout: 30000 });
    let st = await state(page);
    const fxv = await page.evaluate(() => window.__fx);
    check('3: Open brought the photos back byte-equal, the SVG sheet intact, the badge Saved', st.l0 === fxv.png1 && st.l1 === fxv.png2 && st.sheets[0] === fxv.jpg && st.sheets[1] === fxv.svg && st.name === 'Smoke Font' && st.pip.state === 'saved' && st.cloudRev === cloud.tables.font_projects[0].updated_at, JSON.stringify({ eq: [st.l0 === fxv.png1, st.l1 === fxv.png2, st.sheets[0] === fxv.jpg, st.sheets[1] === fxv.svg], pip: st.pip, status: st.status }));
    const dls = cloud.log.filter(e => e.kind === 'download').length;
    check('3: the open downloaded the project file and its three photos', dls === 4, String(dls));
    const upBefore = cloud.log.filter(e => e.kind === 'upload' && e.bucket === 'font-sources').length;
    const resave = await page.evaluate(() => fmCloudWrite('explicit'));
    const upAfter = cloud.log.filter(e => e.kind === 'upload' && e.bucket === 'font-sources').length;
    check('3: a re-save after the open uploads no photo', resave === true && upAfter === upBefore, JSON.stringify({ resave, upBefore, upAfter }));
    // 4. conflict: another device wrote → autosave asks; Overwrite; then Keep both
    cloud.tables.font_projects[0].updated_at = cloud.stamp();
    await page.evaluate(() => { udDo([{ t: 'item', kind: 'letter', cp: '05D0' }], 'smoke', () => { const l = project.letters.find(l => l.codepoint === '05D0'); l.advance = (l.advance || 600) + 1; }); });
    await page.evaluate(() => fmCloudAutosave());
    const title = await askTitle(page);
    st = await state(page);
    check('4: a change on another device makes the next autosave ask instead of writing', /Changed on another device/.test(title) && st.pip.state === 'unsaved', JSON.stringify({ title, pip: st.pip }));
    await page.screenshot({ path: path.join(SHOTS, '4-conflict.png') });
    const clicked = await clickAsk(page, "Overwrite");
    await page.waitForFunction(() => !document.getElementById('askOverlay').classList.contains('open') && project.cloudRev && document.getElementById('cloudPip').dataset.state === 'saved', null, { timeout: 30000 });
    st = await state(page);
    check('4: Overwrite took the row as it is and wrote over it', /Overwrite/.test(clicked) && st.cloudRev === cloud.tables.font_projects[0].updated_at && cloud.tables.font_projects.length === 1, JSON.stringify({ clicked, rev: st.cloudRev, rowRev: cloud.tables.font_projects[0].updated_at }));
    cloud.tables.font_projects[0].updated_at = cloud.stamp();
    await page.evaluate(() => { udDo([{ t: 'item', kind: 'letter', cp: '05D0' }], 'smoke', () => { const l = project.letters.find(l => l.codepoint === '05D0'); l.advance = (l.advance || 600) + 1; }); });
    await page.evaluate(() => fmCloudAutosave());
    const clicked2 = await clickAsk(page, 'Keep both');
    await page.waitForFunction(() => project && project.cloudId && project.font.familyName !== 'Smoke Font' && document.getElementById('cloudPip').dataset.state === 'saved', null, { timeout: 30000 });
    st = await state(page);
    const rows = cloud.tables.font_projects;
    check('4: Keep both made a copy with its own row, leaving the account\'s copy alone', /Keep both/.test(clicked2) && rows.length === 2 && st.cloudId !== firstId && rows.some(r => r.id === st.cloudId && /copy/.test(r.name)) && st.name !== 'Smoke Font', JSON.stringify({ clicked2, rows: rows.map(r => [r.name, r.id === firstId]), st: { cloudId: st.cloudId, name: st.name } }));
    // 6. keep an export with the copy
    const kept = await page.evaluate(() => {
      window._lastDownload = { blob: new Blob([new Uint8Array([0, 1, 0, 0, 7, 7, 7])], { type: 'font/ttf' }), name: 'SmokeFont.ttf' };
      offerSaveToMyFonts(true);
      const b = [...document.querySelectorAll('#askOverlay button')].find(b => /Keep this export/.test(b.textContent));
      if (b) { b.click(); return true; } return false;
    });
    await page.waitForFunction(() => /Export kept/.test((document.getElementById('statusMsg') || {}).textContent || ''), null, { timeout: 15000 }).catch(() => {});
    const copyRow = rows.find(r => r.id !== firstId);
    const exp = folderObjects(cloud, 'font-exports', copyRow.id);
    check('6: the Exported ✓ dialog kept the export in the account (object + row export_path)', kept && exp.length === 1 && exp[0].name === 'SmokeFont.ttf' && exp[0].obj.type === 'font/ttf' && copyRow.export_path === UID + '/' + copyRow.id + '/SmokeFont.ttf' && !!copyRow.exported_at, JSON.stringify({ kept, exp: exp.map(f => f.name), export_path: copyRow.export_path }));
    await page.evaluate(() => document.querySelector('[data-i18n="fontmaker.toolbar.load_project"]').click());
    await page.waitForFunction(() => document.querySelectorAll('#loadMenuCloud .load-menu-row').length === 2, null, { timeout: 15000 });
    const menu2 = await page.evaluate(() => ({ dl: document.querySelectorAll('#loadMenuCloud .load-menu-cdl').length, rows: document.querySelectorAll('#loadMenuCloud .load-menu-row').length }));
    check('6: the Load menu shows ⬇ on the project that has an export', menu2.rows === 2 && menu2.dl === 1, JSON.stringify(menu2));
    // 5. delete the original from the menu
    await page.evaluate((id) => fmCloudDelete(id), firstId);
    const del = await clickAsk(page, 'Delete');
    await page.waitForFunction(() => document.getElementById('loadMenu') && document.querySelectorAll('#loadMenuCloud .load-menu-row').length === 1, null, { timeout: 15000 }).catch(() => {});
    const left = { rows: cloud.tables.font_projects.length, srcs: folderObjects(cloud, 'font-sources', firstId).length, projs: folderObjects(cloud, 'font-projects', firstId).length, menuRows: await page.evaluate(() => document.querySelectorAll('#loadMenuCloud .load-menu-row').length) };
    check('5: Delete removed the row and every object in its folder, and the menu came back with one row', /Delete/.test(del) && left.rows === 1 && left.srcs === 0 && left.projs === 0 && left.menuRows === 1, JSON.stringify(left));
    check('3–6: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 7. Storage refuses a photo ------------------------------------------------------------------
  {
    const cloud2 = new FakeCloud(); cloud2.fail413Once = true;
    const ctx = await openContext(browser, cloud2, seedFor(true));
    const { page, errors } = await openPage(ctx, { signedIn: true });
    await page.evaluate(FIXTURE);
    const saved = await page.evaluate(() => fmCloudWrite('new'));
    const st = await state(page);
    check('7: a refused photo fails the save cleanly: no row stays, no cloudId, the toast names the size, the badge stays hidden', saved === false && cloud2.tables.font_projects.length === 0 && !st.cloudId && /too big/.test(st.status) && st.pip.hidden, JSON.stringify({ saved, rows: cloud2.tables.font_projects.length, status: st.status, pip: st.pip }));
    check('7: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 8. URL contract ------------------------------------------------------------------------------
  {
    const ctx = await openContext(browser, null, seedFor(false));
    const { page, errors } = await openPage(ctx, { query: '?start=no-such-font&error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid' });
    const search = await page.evaluate(() => location.search);
    check('8: ?start= and the auth-error params are both stripped', !/start=|error/.test(search), search);
    check('8: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 9. Hebrew + dark at 800 px -------------------------------------------------------------------
  {
    const cloud3 = new FakeCloud();
    cloud3.tables.font_projects.push(cloud3.freshRow('font_projects', { name: 'גופן לדוגמה', letters_done: 5, project_path: UID + '/x/project-a.json.gz', project_bytes: 120000, sources_bytes: 3400000, has_images: true }));
    const seed = Object.assign({ hebrewBlender_lang: 'he', hebrewBlender_darkMode: '1' }, seedFor(true));
    const ctx = await openContext(browser, cloud3, seed, { viewport: { width: 800, height: 900 } });
    const { page, errors } = await openPage(ctx, { signedIn: true });
    await page.evaluate(() => document.querySelector('[data-i18n="fontmaker.toolbar.load_project"]').click());
    await page.waitForFunction(() => document.querySelector('#loadMenuCloud .load-menu-row'), null, { timeout: 15000 });
    const he = await page.evaluate(() => document.querySelector('#loadMenuCloud').parentElement.textContent);
    check('9: the cloud section renders in Hebrew', /[א-ת]/.test(he) && /גופן לדוגמה/.test(he), he.slice(0, 120));
    await page.screenshot({ path: path.join(SHOTS, '9-he-dark-800.png') });
    check('9: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 10. sign out from the chip with an unsaved cloud project: saved first, no reload ----------------
  {
    const c10 = new FakeCloud();
    const ctx = await openContext(browser, c10, seedFor(true));
    const { page, errors } = await openPage(ctx, { signedIn: true });
    await page.evaluate(FIXTURE);
    await page.evaluate(() => fmCloudWrite('new'));
    const row = c10.tables.font_projects[0];
    const rev0 = row && row.updated_at;
    await page.evaluate(() => { window.__noReload = 1; udDo([{ t: 'item', kind: 'letter', cp: '05D0' }], 'smoke', () => { const l = project.letters.find(l => l.codepoint === '05D0'); l.advance = (l.advance || 600) + 7; }); });
    const dirtyPip = (await state(page)).pip;
    page.on('dialog', d => d.accept());
    const from = c10.log.length;
    await page.click('.ivacct-btn');
    await page.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 5000 });
    await page.evaluate(() => { const b = [...document.querySelectorAll('.ivacct-menu button')].find(b => /Sign out/.test(b.textContent)); b.click(); });
    await page.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'anonymous', null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => ({ kept: window.__noReload === 1, adv: project && project.letters.find(l => l.codepoint === '05D0').advance, status: IvritAccount.status(), cloudDirty: _cloudDirty }));
    const log = c10.log.slice(from);
    const patchAt = log.findIndex(e => e.table === 'font_projects' && e.m === 'PATCH');
    const logoutAt = log.findIndex(e => e.kind === 'logout');
    const snap = await page.evaluate(async () => { const r = await autosaveGet(); return r ? { cloudClean: r.cloudClean, cloudRev: r.cloudRev } : null; });
    check('10: the edit made the account copy Unsaved before the sign-out', dirtyPip && dirtyPip.state === 'unsaved', JSON.stringify(dirtyPip));
    check('10: the sign-out saved the project to the account first (a PATCH of the row before the logout) and the row moved', patchAt >= 0 && logoutAt > patchAt && row.updated_at !== rev0, JSON.stringify(log.map(e => (e.table || e.kind) + ':' + e.m)));
    check('10: the page did not reload — the project with the edit is still open — and it is signed out', after.kept && after.status === 'anonymous' && after.cloudDirty === false, JSON.stringify(after));
    check('10: the local snapshot records the account copy as clean at the new revision', !!snap && snap.cloudClean === true && snap.cloudRev === row.updated_at, JSON.stringify(snap));
    check('10: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 11. another tab signs out: the Font Maker tab keeps its work and is not reloaded -----------------
  {
    const c11 = new FakeCloud();
    const ctx = await openContext(browser, c11, seedFor(true));
    const { page: fm, errors: fmErr } = await openPage(ctx, { signedIn: true });
    await fm.evaluate(FIXTURE);
    await fm.evaluate(() => { window.__noReload = 1; udDo([{ t: 'item', kind: 'letter', cp: '05D0' }], 'smoke', () => { const l = project.letters.find(l => l.codepoint === '05D0'); l.advance = 4242; }); });
    let fmNavigations = 0;
    fm.on('framenavigated', f => { if (f === fm.mainFrame()) fmNavigations++; });
    const hub = await ctx.newPage();
    const hubErr = [];
    hub.on('pageerror', e => hubErr.push(String(e && e.message || e)));
    hub.on('dialog', d => d.accept());
    await hub.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await hub.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'signed-in', null, { timeout: 25000 });
    await hub.waitForTimeout(800);
    await hub.click('.ivacct-btn');
    await hub.waitForSelector('.ivacct-menu:not([hidden])', { timeout: 5000 });
    await hub.evaluate(() => { const b = [...document.querySelectorAll('.ivacct-menu button')].find(b => /Sign out/.test(b.textContent)); b.click(); });
    await fm.waitForFunction(() => IvritAccount.status() === 'anonymous', null, { timeout: 30000 }).catch(() => {});
    await fm.waitForTimeout(1500);
    const st = await fm.evaluate(async () => { const r = await autosaveGet().catch(() => null); return { kept: window.__noReload === 1, adv: project && project.letters.find(l => l.codepoint === '05D0').advance, status: IvritAccount.status(), snap: !!(r && r.gz) }; });
    check('11: the Font Maker tab was not reloaded by the other tab\'s sign-out and still holds the edit', fmNavigations === 0 && st.kept && st.adv === 4242, JSON.stringify({ fmNavigations, st }));
    check('11: it ended signed out, with its local snapshot in place', st.status === 'anonymous' && st.snap, JSON.stringify(st));
    check('11: 0 pageerrors on both pages', fmErr.length === 0 && hubErr.length === 0, fmErr.concat(hubErr).join(' | '));
    await ctx.close();
  }
  // ---- 12. Continue from a snapshot taken while the cloud save was pending: the save resumes ---------------
  {
    const c12 = new FakeCloud();
    const ctx = await openContext(browser, c12, seedFor(true));
    const { page, errors } = await openPage(ctx, { signedIn: true });
    await page.evaluate(FIXTURE);
    await page.evaluate(() => fmCloudWrite('new'));
    const row = c12.tables.font_projects[0];
    await page.evaluate(() => { udDo([{ t: 'item', kind: 'letter', cp: '05D0' }], 'smoke', () => { const l = project.letters.find(l => l.codepoint === '05D0'); l.advance = 777; }); clearTimeout(_cloudTimer); });
    // a snapshot may still be in flight from the save above; the requested one runs after it (never dropped)
    await page.evaluate(async () => { await autosaveNow(); while (_autosaveInFlight) await new Promise(r => setTimeout(r, 50)); });
    const snap = await page.evaluate(async () => { const r = await autosaveGet(); if (!r) return null; let adv = null; try { const d = JSON.parse(await gunzipText(r.gz)); adv = d.letters.find(l => l.codepoint === '05D0').advance; } catch (e) {} return { cloudClean: r.cloudClean, adv }; });
    await page.close();
    const p2 = await ctx.newPage();
    const e2 = [];
    p2.on('pageerror', e => e2.push(String(e && e.message || e)));
    await p2.goto(BASE + '/' + PAGE, { waitUntil: 'domcontentloaded' });
    await p2.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'signed-in', null, { timeout: 25000 });
    const clicked = await clickAsk(p2, '^Continue');
    await p2.waitForFunction(() => project && project.cloudId, null, { timeout: 15000 }).catch(() => {});
    await p2.waitForTimeout(300);
    const resumed = await p2.evaluate(() => ({ dirty: _cloudDirty, pip: (document.getElementById('cloudPip') || {}).dataset && document.getElementById('cloudPip').dataset.state, adv: project.letters.find(l => l.codepoint === '05D0').advance }));
    const rev1 = row.updated_at;
    await p2.evaluate(() => fmCloudAutosave());
    const packed = (() => { const f = folderObjects(c12, 'font-projects', row.id); return f.length ? gunzipJson(f[f.length - 1].obj.bytes) : null; })();
    check('12: the snapshot holds the latest edit even though another snapshot was being written, and was taken with the cloud save pending', !!snap && snap.cloudClean === false && snap.adv === 777, JSON.stringify(snap));
    check('12: Continue restored the edit and the account copy reads Unsaved again', /Continue/.test(clicked) && resumed.dirty === true && resumed.pip === 'unsaved' && resumed.adv === 777, JSON.stringify({ clicked, resumed }));
    check('12: the resumed cloud autosave updated the row with the edit', row.updated_at !== rev1 && !!packed && packed.letters.find(l => l.codepoint === '05D0').advance === 777, JSON.stringify({ rev1, now: row.updated_at }));
    check('12: 0 pageerrors', errors.length === 0 && e2.length === 0, errors.concat(e2).join(' | '));
    await ctx.close();
  }
  // ---- 14. teacher A's unsent project continued by teacher B on the same browser: never saved into B's account ----
  {
    const c14 = new FakeCloud(); c14.rls = true;
    const UID_B = '22222222-2222-4222-8222-222222222222';
    const SESSION_B = { access_token: 'xB', refresh_token: 'yB', expires_at: 4102444800, token_type: 'bearer', user: { id: UID_B, email: 'b@example.org', user_metadata: { full_name: 'Teacher B' } } };
    c14.tokens.xB = UID_B; c14.users[UID_B] = SESSION_B.user;
    const ctx = await openContext(browser, c14, seedFor(true));
    const { page, errors } = await openPage(ctx, { signedIn: true });
    await page.evaluate(FIXTURE);
    await page.evaluate(() => fmCloudWrite('new'));
    const rowA = c14.tables.font_projects[0];
    await page.evaluate(() => { udDo([{ t: 'item', kind: 'letter', cp: '05D0' }], 'smoke', () => { const l = project.letters.find(l => l.codepoint === '05D0'); l.advance = 999; }); clearTimeout(_cloudTimer); });
    await page.evaluate(async () => { await autosaveNow(); while (_autosaveInFlight) await new Promise(r => setTimeout(r, 50)); });
    await page.close();
    const pB = await ctx.newPage();
    const eB = [];
    pB.on('pageerror', e => eB.push(String(e && e.message || e)));
    await pB.goto(BASE + '/llms.txt', { waitUntil: 'domcontentloaded' });
    await pB.evaluate(([k, v]) => { localStorage.setItem(k, v); localStorage.setItem('ivritSuite_accountCache', JSON.stringify({ email: 'b@example.org', name: 'Teacher B' })); }, [AUTH_KEY, JSON.stringify(SESSION_B)]);
    await pB.goto(BASE + '/' + PAGE, { waitUntil: 'domcontentloaded' });
    await pB.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'signed-in' && IvritAccount.user() && IvritAccount.user().email === 'b@example.org', null, { timeout: 25000 });
    const clicked = await clickAsk(pB, '^Continue');
    await pB.waitForFunction(() => project && project.cloudId, null, { timeout: 15000 }).catch(() => {});
    await pB.evaluate(() => fmCloudAutosave());
    await pB.waitForTimeout(800);
    const bRows = c14.tables.font_projects.filter(r => r.user_id === UID_B);
    const st = await pB.evaluate(async () => { const r = await autosaveGet(); return { dirty: _cloudDirty, cloudId: project && project.cloudId, snapClean: r ? r.cloudClean : null }; });
    check("14: teacher B continuing teacher A's unsent project on the same browser put nothing into B's account; the edits stay in this browser for A", /Continue/.test(clicked) && bRows.length === 0 && st.dirty === true && st.cloudId === rowA.id && st.snapClean === false, JSON.stringify({ clicked, bRows: bRows.length, st }));
    check('14: 0 pageerrors', errors.length === 0 && eB.length === 0, errors.concat(eB).join(' | '));
    await ctx.close();
  }
  // ---- 15. an edit made while an upload runs is not marked saved: the next autosave sends it ----
  {
    const c15 = new FakeCloud();
    const ctx = await openContext(browser, c15, seedFor(true));
    const { page, errors } = await openPage(ctx, { signedIn: true });
    await page.evaluate(FIXTURE);
    await page.evaluate(() => fmCloudWrite('new'));
    const row = c15.tables.font_projects[0];
    await page.evaluate(() => { udDo([{ t: 'item', kind: 'letter', cp: '05D0' }], 'smoke', () => { const l = project.letters.find(l => l.codepoint === '05D0'); l.advance = 501; }); clearTimeout(_cloudTimer); });
    c15.holdUploads = 1500;
    const writing = page.evaluate(() => fmCloudWrite('auto'));
    await page.waitForTimeout(500);   // the upload is under way
    await page.evaluate(() => { udDo([{ t: 'item', kind: 'letter', cp: '05D0' }], 'smoke', () => { const l = project.letters.find(l => l.codepoint === '05D0'); l.advance = 502; }); clearTimeout(_cloudTimer); });
    await writing;
    c15.holdUploads = 0;
    const st1 = await page.evaluate(() => ({ dirty: _cloudDirty }));
    await page.evaluate(() => fmCloudAutosave());
    const packed = (() => { const f = folderObjects(c15, 'font-projects', row.id); return f.length ? gunzipJson(f[f.length - 1].obj.bytes) : null; })();
    const adv = packed && packed.letters.find(l => l.codepoint === '05D0').advance;
    check('15: an edit made while the upload ran stayed unsaved, and the next autosave sent it to the account', st1.dirty === true && adv === 502, JSON.stringify({ st1, adv }));
    check('15: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ---- 13. My Fonts: a removal while the SDK has not loaded is remembered and sent at the next load -----------
  {
    const c13 = new FakeCloud();
    const TTF = Buffer.concat([Buffer.from([0, 1, 0, 0]), crypto.randomBytes(60)]).toString('base64');
    const fontData = { name: 'Morah Hand', b64: TTF, family: 'Morah Hand' };
    const canon = '{' + Object.keys(fontData).sort().map(k => JSON.stringify(k) + ':' + JSON.stringify(fontData[k])).join(',') + '}';   // the module's canonJson for a flat object
    const fontHash = '1.' + crypto.createHash('sha256').update(canon).digest('base64url');
    c13.tables.saves.push(c13.freshRow('saves', { tool: 'Suite', kind: 'font', name: 'Morah Hand', data: fontData, data_hash: fontHash, bytes: canon.length }));
    const ctx = await openContext(browser, c13, seedFor(true));
    const { page, errors } = await openPage(ctx, { signedIn: true });
    await page.waitForFunction(() => window.IvritSaves && IvritSaves._test.settled(['Suite']), null, { timeout: 25000 }).catch(() => {});
    const landed = await page.evaluate(() => listUserFonts().then(l => l.map(f => f.name)));
    const body = await page.evaluate(() => { deleteMyFontUI('Morah Hand'); const o = document.getElementById('askOverlay'); const t = o ? o.textContent : ''; document.querySelectorAll('.overlay.open').forEach(x => x.classList.remove('open')); return t; });
    await page.close();
    // the SDK cannot load: the session is stored, the account module has no user
    let blockSdk = true;
    await ctx.route(CFG.sdk, route => blockSdk ? route.abort() : route.fallback());
    const p2 = await ctx.newPage();
    const e2 = [];
    p2.on('pageerror', e => e2.push(String(e && e.message || e)));
    await p2.goto(BASE + '/' + PAGE, { waitUntil: 'domcontentloaded' });
    await p2.waitForFunction(() => window.IvritAccount && IvritAccount.status() !== 'loading', null, { timeout: 25000 }).catch(() => {});
    const from = c13.log.length;
    const off = await p2.evaluate(async () => { const before = IvritAccount.user(); await deleteUserFont('Morah Hand'); await IvritSaves.fontDeleted('Morah Hand'); const m = JSON.parse(localStorage.getItem('ivritSuite_syncMeta2') || '{}'); const rec = (((m.users || {})['11111111-1111-4111-8111-111111111111'] || {}).Suite || {}).font; return { user: !!before, fonts: (await listUserFonts()).map(f => f.name), rec: rec && rec['Morah Hand'] }; });
    const sentOffline = c13.log.slice(from).filter(e => e.table === 'saves' && e.m === 'DELETE').length;
    await p2.close();
    blockSdk = false;
    await ctx.unroute(CFG.sdk);
    const p3 = await ctx.newPage();
    const e3 = [];
    p3.on('pageerror', e => e3.push(String(e && e.message || e)));
    await p3.goto(BASE + '/' + PAGE, { waitUntil: 'domcontentloaded' });
    await p3.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'signed-in', null, { timeout: 25000 });
    await p3.waitForFunction(() => IvritSaves._test.settled(['Suite']), null, { timeout: 25000 }).catch(() => {});
    await p3.waitForTimeout(500);
    const dels = c13.log.filter(e => e.table === 'saves' && e.m === 'DELETE');
    const end = await p3.evaluate(async () => ({ fonts: (await listUserFonts()).map(f => f.name) }));
    check('13: the account font landed in My Fonts at the first signed-in load', JSON.stringify(landed) === '["Morah Hand"]', JSON.stringify(landed));
    check('13: signed in, the remove dialog says the font also leaves the account', /removed from your account/.test(body), body.slice(0, 200));
    check('13: removed while the SDK could not load: gone here, no request, the memory marks it deleted', off.user === false && off.fonts.length === 0 && sentOffline === 0 && !!off.rec && off.rec.deleted === true, JSON.stringify({ off, sentOffline }));
    check('13: the next signed-in load sent the DELETE, the account row is gone and the font did not come back', dels.length === 1 && /updated_at=eq\./.test(dels[0].search) && c13.tables.saves.length === 0 && end.fonts.length === 0, JSON.stringify({ dels: dels.map(d => d.search), rows: c13.tables.saves.length, end }));
    check('13: 0 pageerrors', errors.length === 0 && e2.length === 0 && e3.length === 0, errors.concat(e2, e3).join(' | '));
    await ctx.close();
  }
  // ---- 16. Recent: moved to IndexedDB whole, no cap, unaffected by a full localStorage ----
  {
    const ctx = await openContext(browser, null, seedFor(false));
    const { page, errors } = await openPage(ctx);
    // an older build's list: three whole projects in localStorage
    const old = await page.evaluate(() => {
      const mk = (n, i) => { const c = JSON.parse(JSON.stringify(project)); c.font.familyName = n; c.font.reservedFontName = n; c.savedAt = '2026-09-0' + (i + 1) + 'T10:00:00.000Z'; return { name: n, savedAt: c.savedAt, data: c }; };
      const list = ['Old One', 'Old Two', 'Old Three'].map(mk);
      localStorage.setItem('hebrewFontMaker_recentProjects', JSON.stringify(list));
      return list.map(r => r.name + '@' + r.savedAt).sort();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n && document.readyState !== 'loading', null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
    const moved = await page.evaluate(async () => ({ key: localStorage.getItem('hebrewFontMaker_recentProjects'), list: (await recentList()).map(r => r.name + '@' + r.savedAt).sort() }));
    check('16: the old localStorage Recent list moved into IndexedDB whole (names and dates kept), then its key was removed', moved.key === null && JSON.stringify(moved.list) === JSON.stringify(old), JSON.stringify(moved));
    // eight more saves "In this browser": none pushes another out
    for (let i = 1; i <= 8; i++) {
      await page.evaluate(async (n) => { document.getElementById('familyName').value = n; document.getElementById('reservedName').value = n; await saveToBrowser(); document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')); }, 'Mine ' + i);
    }
    const rows = () => page.evaluate(async () => { const a = document.querySelector('[onclick*="toggleLoadMenu"]'); const m = openLoadMenu(a); await m._recentFilled; const names = [...m.querySelectorAll('#loadMenuRecent .load-menu-item span:first-child')].map(s => s.textContent); closeLoadMenu(); return names; });
    const r11 = await rows();
    check('16: eleven Recent projects are all listed in Load Project ▾ (no limit of six)', r11.length === 11 && ['Old One', 'Old Two', 'Old Three', 'Mine 1', 'Mine 8'].every(n => r11.includes(n)), JSON.stringify(r11));
    // localStorage full: a save "In this browser" still lands, with no "couldn't save" dialog
    await page.evaluate(() => {
      localStorage.removeItem('__fill'); let lo = 0, hi = 6000000;
      while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); try { localStorage.setItem('__fill', 'x'.repeat(mid)); lo = mid; } catch (e) { hi = mid - 1; } }
      localStorage.setItem('__fill', 'x'.repeat(lo));
    });
    const full = await page.evaluate(async () => { document.getElementById('familyName').value = 'Mine Full'; document.getElementById('reservedName').value = 'Mine Full'; await saveToBrowser(); const o = document.getElementById('askOverlay'); const t = o && o.classList.contains('open') ? o.textContent : ''; document.querySelectorAll('.overlay.open').forEach(x => x.classList.remove('open')); return { refused: /Couldn't save in the browser/.test(t) }; });
    await page.evaluate(() => localStorage.removeItem('__fill'));
    const r12 = await rows();
    check('16: with localStorage full, a save to this browser still lands in Recent', !full.refused && r12.length === 12 && r12.includes('Mine Full'), JSON.stringify({ full, r12 }));
    // the 🗑 removes only its row; a row opens its own project
    await page.evaluate(async () => { const a = document.querySelector('[onclick*="toggleLoadMenu"]'); const m = openLoadMenu(a); await m._recentFilled; const row = [...m.querySelectorAll('#loadMenuRecent .load-menu-row')].find(r => r.textContent.includes('Old Two')); row.querySelector('.load-menu-del').click(); });
    await clickAsk(page, '^Remove');
    await page.waitForTimeout(800);
    const r11b = await rows();
    await page.evaluate(async () => { const a = document.querySelector('[onclick*="toggleLoadMenu"]'); const m = openLoadMenu(a); await m._recentFilled; const row = [...m.querySelectorAll('#loadMenuRecent .load-menu-row')].find(r => r.textContent.includes('Old Three')); row.querySelector('.load-menu-item').click(); });
    await page.waitForTimeout(1200);
    const opened = await page.evaluate(() => project.font.familyName);
    check("16: the trash button removed only 'Old Two'; clicking 'Old Three' opened that project", r11b.length === 11 && !r11b.includes('Old Two') && r11b.includes('Old One') && opened === 'Old Three', JSON.stringify({ r11b, opened }));
    check('16: 0 pageerrors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.kill();
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} checks passed; screenshots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
