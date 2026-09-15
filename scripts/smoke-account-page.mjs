#!/usr/bin/env node
/*
 * smoke-account-page.mjs — headless end-to-end test of account.html (the account page: what the account holds,
 * download everything, delete my account) against a FAKE cloud: Playwright serves the pinned SDK from a local
 * file, seeds a remembered session, and answers the project's PostgREST tables (`saves`, `font_projects`,
 * `profiles`), the Storage downloads, the Auth user endpoints and the delete-account Edge Function from memory.
 * No real network is used.
 *
 * Scenarios:
 *   0. Anonymous, CDN blocked, the four account scripts blocked vs present: 0 pageerrors, the chip beside the
 *      language switcher, the signed-out tile with its Sign in button, localStorage byte-identical between the
 *      two runs (the "anonymous flow unchanged" bar).
 *   1. Signed in (a remembered session): the listing shows every tool that has rows with counts and sizes, names
 *      expand for presets and student profiles (never for word lists, whose row name is an id), the Font Maker
 *      project with its letters, size and "exported font" note, the total line; who the account is, its
 *      provider, its display name from `profiles`.
 *   2. Save name: PUT /auth/v1/user carries data.full_name and PATCH /rest/v1/profiles carries display_name, the
 *      chip shows the new first name; an empty name is refused before any request.
 *   3. Download everything: the zip (Playwright's download event) holds README.txt, the .ivrit (an AllTools
 *      bundle with every kind folded in), the project's .hebrewfont (gunzips to the project with its photos back
 *      as the original bytes, no cloud: sentinel and no manifest left, the inline SVG sheet intact) and the
 *      exported font; every entry's CRC matches.
 *   4. Delete: the confirmation box; Delete permanently stays disabled until the box is ticked AND the typed
 *      email matches (case-insensitively); then POST /functions/v1/delete-account with the session's bearer
 *      token; the fake answers ok → the "deleted" tile with the counts, the session key and name cache gone, the
 *      sync memory no longer names the account, a tool's own key untouched, the chip signed out.
 *   5. Delete refused (the fake answers 500): the error line, still signed in, session key intact, the box open.
 *   6. Hebrew + dark at 800 px: RTL, Hebrew headings (screenshot).
 *
 * Run from the repo root:  node scripts/smoke-account-page.mjs --sdk path/to/supabase.js [--port 8083]
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
const PORT = Number(arg('--port') || 8083);
const BASE = 'http://localhost:' + PORT;
const cfgSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/supabase-config.js'), 'utf8'), cfgSandbox);
const CFG = cfgSandbox.window.IVRIT_SUPABASE;
const AUTH_KEY = 'sb-' + new URL(CFG.url).hostname.split('.')[0] + '-auth-token';
const ACCOUNT_SCRIPTS = ['/js/supabase-config.js', '/js/ivrit-account.js', '/js/ivrit-saves.js', '/js/ivrit-projects.js'];
const SDK_FILE = arg('--sdk');
const SDK_BYTES = SDK_FILE && fs.existsSync(SDK_FILE) ? fs.readFileSync(SDK_FILE) : null;
if (!SDK_BYTES) { console.error('smoke-account-page: pass --sdk <path to the pinned supabase.js UMD build>'); process.exit(2); }
const SHOTS = process.env.SMOKE_SHOTS || path.join(process.env.TMPDIR || '/tmp', 'smoke-account-page');
fs.mkdirSync(SHOTS, { recursive: true });
const PAGE = 'account.html';
const UID = '22222222-2222-4222-8222-222222222222';
const EMAIL = 'teacher@example.org';
const SESSION = { access_token: 'x', refresh_token: 'y', expires_at: 4102444800, token_type: 'bearer', user: { id: UID, email: EMAIL, user_metadata: { full_name: 'Test Teacher' }, app_metadata: { provider: 'email' } } };
const PID = '33333333-3333-4333-8333-333333333333';
const PNG1 = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), crypto.randomBytes(40)]);
const PNG2 = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), crypto.randomBytes(60)]);
const H1 = 'a1b2c3d4e5f60718', H2 = '0102030405060708';
const SVG = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>').toString('base64');
const PROJECT = {
  _ivritSuite: 1, format: 'hebrew-font-maker-project', schemaVersion: 5, font: { familyName: 'Smoke Font', nikkud: { custom: {} } },
  letters: [
    { codepoint: '05D0', name: 'alef', source: { kind: 'single', dataUrl: 'cloud:' + H1 + '.png' }, contours: [{ winding: 'cw', points: [[0, 0], [1, 1]] }] },
    { codepoint: '05D1', name: 'bet', source: { kind: 'single', dataUrl: 'cloud:' + H2 + '.png' } },
    { codepoint: '05D2', name: 'gimel', source: { kind: 'draw', dataUrl: null } }
  ],
  combinedSheets: [{ id: 's1', name: 'sheet.svg', dataUrl: SVG }],
  cloudSources: { [H1 + '.png']: PNG1.length, [H2 + '.png']: PNG2.length },
  cloudId: PID
};
const GZ = zlib.gzipSync(Buffer.from(JSON.stringify(PROJECT)));
const TTF = Buffer.concat([Buffer.from([0, 1, 0, 0]), crypto.randomBytes(100)]);

/* ---------- the fake cloud ---------- */
class FakeCloud {
  constructor() {
    this.n = 0; this.log = []; this.failDelete = false; this.deleted = false;
    this.user = JSON.parse(JSON.stringify(SESSION.user));
    const at = (i) => new Date(Date.UTC(2026, 8, 10, 8, 0, i)).toISOString();
    const row = (tool, kind, name, data, i) => ({ id: crypto.randomUUID(), user_id: UID, tool, kind, name, data, data_hash: null, bytes: JSON.stringify(data).length, client_updated_at: null, created_at: at(i), updated_at: at(i) });
    this.tables = {
      saves: [
        row('Worksheet', 'preset', 'Aleph Bet', { fontSize: 24 }, 1), row('Worksheet', 'preset', 'Vowels', { fontSize: 30 }, 2), row('Worksheet', 'presetFolders', 'default', { v: 1, root: [] }, 3),
        row('FlashCards', 'profile', 'Dana', { results: [] }, 4), row('FlashCards', 'profile', 'Yoni', { results: [] }, 5),
        row('Dictionary', 'wordList', 'abc', { name: 'Colors', words: [] }, 6), row('Dashboard', 'settings', 'default', { headerLang: 'he' }, 7), row('TropeTutor', 'progress', 'default', { v: 1, tropes: {} }, 8),
        row('Dashboard', 'roster', 'lap_0', { name: 'Kitah Alef', names: ['Noa', 'Eitan'] }, 10),   // a class list: its own key in the backup
        row('Dashboard', 'future', 'thing', { x: 1 }, 11),                                        // a kind this build does not know: kept in the backup, not listed
        row('Suite', 'prefs', 'default', { darkMode: '1', hebFont: 'David Libre', dictTtsRate: '1.2' }, 12),   // the suite-wide preferences row
        row('Suite', 'font', 'Morah Handwriting', { name: 'Morah Handwriting', b64: 'AAEAAAALAIAAAwAwT1MvMg==', family: 'Morah Handwriting' }, 13)   // a font the teacher made
      ],
      font_projects: [{ id: PID, user_id: UID, name: 'Smoke Font', family_name: 'Smoke Font', style: null, schema_version: 5, letters_done: 3, has_images: true, project_path: UID + '/' + PID + '/project-1.json.gz', project_bytes: GZ.length, sources_bytes: PNG1.length + PNG2.length, export_path: UID + '/' + PID + '/SmokeFont.ttf', exported_at: at(9), client_saved_at: null, created_at: at(9), updated_at: at(9) }],
      profiles: [{ id: UID, display_name: 'Test Teacher', created_at: at(0), updated_at: at(0) }]
    };
    this.objects = {};
    this.objects['font-projects|' + UID + '/' + PID + '/project-1.json.gz'] = { bytes: GZ, type: 'application/gzip' };
    this.objects['font-sources|' + UID + '/' + PID + '/' + H1 + '.png'] = { bytes: PNG1, type: 'image/png' };
    this.objects['font-sources|' + UID + '/' + PID + '/' + H2 + '.png'] = { bytes: PNG2, type: 'image/png' };
    this.objects['font-exports|' + UID + '/' + PID + '/SmokeFont.ttf'] = { bytes: TTF, type: 'font/ttf' };
  }
  stamp() { return new Date(Date.UTC(2026, 8, 15, 8, 0, 0) + (++this.n) * 1000).toISOString(); }
  pick(row, select) { if (!select) return row; const out = {}; select.split(',').forEach(k => { k = k.trim(); out[k] = row[k]; }); return out; }
  handle(route) {
    const req = route.request(), url = new URL(req.url()), m = req.method();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
    const json = (status, body) => route.fulfill({ status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, cors), body: JSON.stringify(body) });
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    // ---- Auth ----
    if (url.pathname.endsWith('/auth/v1/user')) {
      if (m === 'PUT') {
        const body = JSON.parse(req.postData() || '{}');
        this.log.push({ m, kind: 'updateUser', body });
        if (body.data) this.user.user_metadata = Object.assign({}, this.user.user_metadata, body.data);
      }
      return json(200, this.user);
    }
    if (url.pathname.endsWith('/auth/v1/token')) return json(200, Object.assign({ expires_in: 3600 }, SESSION, { user: this.user }));
    if (url.pathname.endsWith('/auth/v1/logout')) { this.log.push({ m, kind: 'logout' }); return route.fulfill({ status: 204, headers: cors }); }
    // ---- the Edge Function ----
    if (url.pathname.endsWith('/functions/v1/delete-account')) {
      const auth = req.headers().authorization || '';
      this.log.push({ m, kind: 'delete-account', auth, apikey: req.headers().apikey || '' });
      if (auth !== 'Bearer ' + SESSION.access_token) return json(401, { error: 'invalid_token' });
      if (this.failDelete) return json(500, { error: 'delete_failed' });
      const deleted = { saves: this.tables.saves.length, projects: this.tables.font_projects.length, files: Object.keys(this.objects).length };
      this.tables.saves = []; this.tables.font_projects = []; this.tables.profiles = []; this.objects = {}; this.deleted = true;
      return json(200, { ok: true, deleted });
    }
    // ---- Storage downloads ----
    const sm = /\/storage\/v1\/object\/([^/]+)\/(.+)$/.exec(url.pathname);
    if (sm && m === 'GET') {
      const key = decodeURIComponent(sm[2]), o = this.objects[sm[1] + '|' + key];
      this.log.push({ m, kind: 'download', bucket: sm[1], key, found: !!o });
      if (!o) return json(404, { statusCode: '404', error: 'not_found', message: 'Object not found' });
      return route.fulfill({ status: 200, headers: Object.assign({ 'content-type': o.type }, cors), body: o.bytes });
    }
    // ---- PostgREST ----
    const tm = /\/rest\/v1\/([A-Za-z_]+)$/.exec(url.pathname);
    if (!tm || !this.tables[tm[1]]) { this.log.push({ m, path: url.pathname, unexpected: true }); return json(404, { message: 'not found' }); }
    const table = tm[1], q = url.searchParams;
    const filters = [...q.entries()].filter(([k, v]) => !['select', 'order', 'offset', 'limit'].includes(k) && v.startsWith('eq.')).map(([k, v]) => [k, v.slice(3)]);
    const match = r => filters.every(([k, v]) => String(r[k]) === v);
    const single = /vnd\.pgrst\.object/.test(req.headers().accept || '');
    const entry = { m, table, search: url.search, body: req.postData() ? JSON.parse(req.postData()) : null, status: 200 };
    this.log.push(entry);
    let rows = this.tables[table].filter(match);
    if (m === 'GET') {
      const order = (q.get('order') || '').split(',').filter(Boolean).map(s => { const [k, dir] = s.split('.'); return [k, dir === 'desc' ? -1 : 1]; });
      if (order.length) rows = rows.slice().sort((a, b) => { for (const [k, d] of order) { if (a[k] < b[k]) return -d; if (a[k] > b[k]) return d; } return 0; });
      const off = Number(q.get('offset') || 0);
      rows = rows.slice(off, q.has('limit') ? off + Number(q.get('limit')) : undefined);
    } else if (m === 'PATCH') {
      rows.forEach(r => { Object.assign(r, entry.body); r.updated_at = this.stamp(); });
    } else if (m === 'DELETE') {
      this.tables[table] = this.tables[table].filter(r => !match(r));
    } else {
      return json(405, { message: 'not expected here' });
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
function seedFor(signedIn, extra) {
  const s = Object.assign({ hebrewBlender_presets: JSON.stringify({ 'Local preset': { fontSize: 18 } }) }, extra || {});
  if (signedIn) {
    s[AUTH_KEY] = JSON.stringify(SESSION);
    s.ivritSuite_accountCache = JSON.stringify({ email: EMAIL, name: 'Test Teacher' });
    s.ivritSuite_syncMeta = JSON.stringify({ v: 1, users: { [UID]: { Worksheet: {} } }, welcomed: { [UID]: '2026-09-14T00:00:00.000Z' } });
  }
  return s;
}
async function openContext(browser, cloud, seed, { blockAccount = false, viewport = { width: 1280, height: 900 } } = {}) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport, acceptDownloads: true });
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
async function openPage(ctx, { signedIn = false } = {}) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.goto(BASE + '/' + PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.readyState !== 'loading', null, { timeout: 20000 }).catch(() => {});
  if (signedIn) {
    await page.waitForFunction(() => window.IvritAccount && IvritAccount.status() === 'signed-in', null, { timeout: 25000 });
    await page.waitForFunction(() => document.getElementById('holdsTotal').textContent.length > 0 || document.getElementById('holdsStatus').classList.contains('is-error'), null, { timeout: 25000 });
  }
  await page.waitForTimeout(500);
  return { page, errors };
}
const dump = (page) => page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => k !== '__smoke_seeded').sort()));
const text = (page, sel) => page.evaluate((s) => { const n = document.querySelector(s); return n ? n.textContent : null; }, sel);
const visible = (page, sel) => page.evaluate((s) => { const n = document.querySelector(s); return !!n && !n.hidden && !n.closest('[hidden]'); }, sel);
const disabled = (page, sel) => page.evaluate((s) => { const n = document.querySelector(s); return !!n && n.getAttribute('aria-disabled') === 'true'; }, sel);
function readZip(buf) {   // store-only zip: walk the local file headers; each entry's CRC is checked against the header
  const out = []; let p = 0;
  while (p + 30 <= buf.length && buf.readUInt32LE(p) === 0x04034b50) {
    const crc = buf.readUInt32LE(p + 14), size = buf.readUInt32LE(p + 18), nameLen = buf.readUInt16LE(p + 26), extraLen = buf.readUInt16LE(p + 28);
    const name = buf.slice(p + 30, p + 30 + nameLen).toString('utf8');
    const start = p + 30 + nameLen + extraLen;
    const bytes = buf.slice(start, start + size);
    out.push({ name, bytes, crcOk: zlib.crc32(bytes) === crc });
    p = start + size;
  }
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = eocd >= 0 ? buf.readUInt16LE(eocd + 10) : -1;
  return { entries: out, count };
}
async function fillDelete(page, email) {
  await page.click('#delBtn');
  await page.waitForFunction(() => !document.getElementById('delConfirm').hidden, null, { timeout: 5000 });
  await page.check('#delCheck');
  await page.fill('#delEmail', email);
}

const browser = await chromium.launch();
const srv = await startServer();
try {
  // ---- 0. anonymous: control (account scripts blocked) vs present ----------------------------------
  {
    let control, ctrlErrors;
    { const ctx = await openContext(browser, null, seedFor(false), { blockAccount: true }); const { page, errors } = await openPage(ctx); control = await dump(page); ctrlErrors = errors; await ctx.close(); }
    const ctx = await openContext(browser, null, seedFor(false));
    const { page, errors } = await openPage(ctx);
    await page.waitForFunction(() => !document.getElementById('acctOut').hidden, null, { timeout: 10000 }).catch(() => {});
    check('0: 0 pageerrors (control + present)', ctrlErrors.length === 0 && errors.length === 0, (ctrlErrors.concat(errors)).join(' | '));
    check('0: chip beside the language switcher', await page.evaluate(() => { const c = document.querySelector('[data-ivacct]'), s = document.querySelector('[data-i18n-switcher]'); return !!c && !!s && c.parentElement === s.parentElement; }));
    check('0: signed-out tile with Sign in', (await visible(page, '#acctOut')) && (await visible(page, '#outBtn')) && /Sign in to see/.test(await text(page, '#outNote')));
    check('0: localStorage byte-identical with and without the account scripts', (await dump(page)) === control);
    await page.screenshot({ path: path.join(SHOTS, '0-anonymous.png') });
    await ctx.close();
  }
  // ---- 1. signed in: the listing --------------------------------------------------------------------
  const cloud = new FakeCloud();
  const ctx = await openContext(browser, cloud, seedFor(true));
  const { page, errors } = await openPage(ctx, { signedIn: true });
  {
    const list = await text(page, '#holdsList');
    check('1: worksheet presets counted', /Hebrew Worksheet Generator[\s\S]*Presets: 2/.test(list), list);
    check('1: student profiles counted', /Student profiles: 2/.test(list));
    check('1: word list counted but not named', /Word lists: 1/.test(list) && !/Colors/.test(list) && !/abc/.test(list));
    check('1: class list counted but not named; the unknown kind is mentioned, not listed', /Class lists: 1/.test(list) && !/Kitah Alef/.test(list) && /1 items saved by a newer version/.test(list) && !/thing/.test(list), list);
    check('1: settings and mastery rows listed', /Settings: 1/.test(list) && /Mastery progress: 1/.test(list));
    check('1: the suite-wide preferences row under IvritSuite', /IvritSuite[\s\S]*IvritSuite preferences: 1/.test(list), list);
    check("1: the teacher's own font is counted and its name can be expanded", /My Fonts: 1/.test(list), list);
    await page.evaluate(() => { const b = [...document.querySelectorAll('#holdsList .link-btn')].find(x => x.closest('li').textContent.includes('Student profiles')); b.click(); });
    const list2 = await text(page, '#holdsList');
    check('1: names expand for profiles only', /Dana/.test(list2) && /Yoni/.test(list2) && !/Aleph Bet/.test(list2));
    check('1: the font project line', /Smoke Font: 3 letters/.test(list2) && /with an exported font/.test(list2));
    check('1: the total line', /12 items and 1 project,/.test(await text(page, '#holdsTotal')), await text(page, '#holdsTotal'));
    check('1: who — email, provider, since', (await text(page, '#whoLine')).includes(EMAIL) && /emailed code/.test(await text(page, '#whoProvider')) && (await text(page, '#sinceLine')).length > 0);
    check('1: display name from profiles', (await page.inputValue('#nameInput')) === 'Test Teacher');
    check('1: download enabled, delete box closed', !(await disabled(page, '#dlBtn')) && !(await visible(page, '#delConfirm')));
    await page.screenshot({ path: path.join(SHOTS, '1-signed-in.png'), fullPage: true });
  }
  // ---- 2. save name --------------------------------------------------------------------------------
  {
    await page.fill('#nameInput', 'Morah Rivka');
    await page.click('#nameSave');
    await page.waitForFunction(() => document.getElementById('nameNote').textContent === 'Name saved.', null, { timeout: 10000 });
    const upd = cloud.log.find(e => e.kind === 'updateUser');
    check('2: PUT /auth/v1/user carries full_name', !!upd && !!upd.body.data && upd.body.data.full_name === 'Morah Rivka', JSON.stringify(upd));
    const patch = cloud.log.find(e => e.table === 'profiles' && e.m === 'PATCH');
    check('2: profiles row updated', !!patch && patch.body.display_name === 'Morah Rivka' && /id=eq\./.test(patch.search), JSON.stringify(patch));
    check('2: chip shows the new first name', (await text(page, '[data-ivacct] .ivacct-text')) === 'Morah');
    const before = cloud.log.length;
    await page.fill('#nameInput', '   ');
    await page.click('#nameSave');
    await page.waitForFunction(() => /1 to 80/.test(document.getElementById('nameNote').textContent), null, { timeout: 5000 });
    check('2: an empty name is refused before any request', cloud.log.length === before);
  }
  // ---- 3. download everything ----------------------------------------------------------------------
  {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#dlBtn')]);
    const zipBytes = fs.readFileSync(await dl.path());
    const { entries, count } = readZip(zipBytes);
    const names = entries.map(e => e.name);
    check('3: a zip named for the date', /^IvritSuite-account-\d{4}-\d{2}-\d{2}\.zip$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    check('3: every entry\'s CRC matches and the directory counts them', entries.length === 4 && entries.every(e => e.crcOk) && count === 4, names.join(', '));
    const readme = entries.find(e => e.name === 'README.txt');
    check('3: README names the account and the .ivrit', !!readme && readme.bytes.toString().includes(EMAIL) && readme.bytes.toString().includes('IvritSuite-account-'));
    const ivrit = entries.find(e => /^IvritSuite-account-\d{4}-\d{2}-\d{2}\.ivrit$/.test(e.name));
    const iv = ivrit ? JSON.parse(ivrit.bytes.toString()) : null;
    check('3: the .ivrit is an AllTools bundle with every kind', !!iv && iv.tool === 'AllTools' && iv.format === 'ivrit-save'
      && iv.data.generatorPresets['Aleph Bet'].fontSize === 24 && iv.data.generatorPresets.Vowels.fontSize === 30 && iv.data.generatorPresetFolders.v === 1
      && iv.data.flashCardProfiles.profiles.Dana && iv.data.flashCardProfiles.profiles.Yoni && iv.data.flashCardProfiles.activeProfile === null
      && iv.data.wordLists.lists.abc.name === 'Colors' && iv.data.wordLists.v === 1 && iv.data.dashboardSettings.headerLang === 'he' && iv.data.tropeTutorProgress.v === 1
      && iv.data.suitePrefs && iv.data.suitePrefs.hebFont === 'David Libre' && iv.data.suitePrefs.darkMode === '1'
      && iv.data.userFonts && iv.data.userFonts['Morah Handwriting'] && iv.data.userFonts['Morah Handwriting'].b64 === 'AAEAAAALAIAAAwAwT1MvMg==', iv ? Object.keys(iv.data).join(',') : 'no .ivrit');
    check('3: the .ivrit is marked partial, carries the class list under its own key and the unknown kind under cloudUnknown', !!iv && iv.partial === true && iv.data.dashboardRosters && JSON.stringify(iv.data.dashboardRosters.rosters.lap_0.names) === '["Noa","Eitan"]' && Array.isArray(iv.data.cloudUnknown) && iv.data.cloudUnknown.length === 1 && iv.data.cloudUnknown[0].kind === 'future' && iv.data.cloudUnknown[0].tool === 'Dashboard' && iv.data.cloudUnknown[0].data.x === 1, iv ? JSON.stringify({ partial: iv.partial, rosters: iv.data.dashboardRosters, unknown: iv.data.cloudUnknown }) : 'no .ivrit');
    // ---- 3b. that .ivrit dropped on the home page: merged without the Merge/Replace question, the class list landed, per-device fields kept ----
    {
      const ctxH = await openContext(browser, null, { hebrewDashboard_settings: JSON.stringify({ location: 'Boston, MA', zoomLevel: 130, rosters: { dev_1: { name: 'Mine', names: ['Ari'] } }, activeRosterId: 'dev_1' }) }, { blockAccount: true });
      const hub = await ctxH.newPage();
      const hubErrors = []; hub.on('pageerror', e => hubErrors.push(String(e && e.message || e)));
      await hub.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
      await hub.waitForFunction(() => window.I18n && typeof ivritRestore === 'function', null, { timeout: 15000 });
      await hub.waitForTimeout(500);
      const r = await hub.evaluate(async (text) => {
        window.__alerts = []; window.alert = (m) => window.__alerts.push(String(m));
        window.__asked = false; ivritAskMode = () => { window.__asked = true; return Promise.resolve('merge'); };
        await ivritRestore(text, 'account.ivrit');
        const s = JSON.parse(localStorage.getItem('hebrewDashboard_settings'));
        return { asked: window.__asked, alerts: window.__alerts, zoom: s.zoomLevel, headerLang: s.headerLang, rosters: Object.keys(s.rosters).sort(), landed: s.rosters.lap_0 && s.rosters.lap_0.names, mine: s.rosters.dev_1 && s.rosters.dev_1.names, presets: Object.keys(JSON.parse(localStorage.getItem('hebrewBlender_presets') || '{}')), status: (document.getElementById('ivritStatus') || {}).textContent || '',
                 hebFont: localStorage.getItem('hebrewBlender_hebFont'), dark: localStorage.getItem('hebrewBlender_darkMode'), tts: localStorage.getItem('hebrewDictionary_ttsRate'), bodyDark: document.body.classList.contains('dark') };
      }, ivrit.bytes.toString());
      check('3b: the account backup merges on the home page without the Merge/Replace question and says so', r.asked === false && /Merged from account\.ivrit/.test(r.status) && r.alerts.some(a => /1 class list/.test(a)), JSON.stringify({ asked: r.asked, status: r.status, alerts: r.alerts }));
      check("3b: the class list landed beside this device's own, the per-device zoom and the device's settings stayed, the presets came", JSON.stringify(r.rosters) === '["dev_1","lap_0"]' && JSON.stringify(r.landed) === '["Noa","Eitan"]' && JSON.stringify(r.mine) === '["Ari"]' && r.zoom === 130 && r.headerLang === 'he' && r.presets.includes('Aleph Bet'), JSON.stringify(r));
      check('3b: the suite-wide preferences unfolded into the flat keys and the hub followed the theme', r.hebFont === 'David Libre' && r.dark === '1' && r.tts === '1.2' && r.bodyDark === true, JSON.stringify({ hebFont: r.hebFont, dark: r.dark, tts: r.tts, bodyDark: r.bodyDark }));
      check('3b: 0 pageerrors on the home page', hubErrors.length === 0, hubErrors.join(' | '));
      await ctxH.close();
    }
    const hf = entries.find(e => e.name === 'font-projects/Smoke Font/Smoke_Font.hebrewfont');
    const proj = hf ? JSON.parse(zlib.gunzipSync(hf.bytes).toString()) : null;
    check('3: the .hebrewfont has its photos back, byte for byte', !!proj && proj.letters[0].source.dataUrl === 'data:image/png;base64,' + PNG1.toString('base64') && proj.letters[1].source.dataUrl === 'data:image/png;base64,' + PNG2.toString('base64'), names.join(', '));
    check('3: no sentinel, no manifest, SVG and identity intact', !!proj && !JSON.stringify(proj).includes('cloud:') && proj.cloudSources === undefined && proj.combinedSheets[0].dataUrl === SVG && proj.cloudId === PID && proj.letters[2].source.dataUrl === null);
    const ex = entries.find(e => e.name === 'font-projects/Smoke Font/SmokeFont.ttf');
    check('3: the exported font rides along', !!ex && Buffer.compare(ex.bytes, TTF) === 0);
    check('3: the done line', /Downloaded 12 items and 1 project/.test(await text(page, '#dlStatus')), await text(page, '#dlStatus'));
    check('3: two photo downloads, no re-download of the project file', cloud.log.filter(e => e.kind === 'download' && e.bucket === 'font-sources').length === 2 && cloud.log.filter(e => e.kind === 'download' && e.bucket === 'font-projects').length === 1);
  }
  // ---- 4. delete my account -----------------------------------------------------------------------
  {
    await page.click('#delBtn');
    await page.waitForFunction(() => !document.getElementById('delConfirm').hidden, null, { timeout: 5000 });
    check('4: Delete permanently starts disabled', await disabled(page, '#delGo'));
    await page.check('#delCheck');
    check('4: still disabled with the box alone', await disabled(page, '#delGo'));
    await page.fill('#delEmail', 'someone@else.org');
    check('4: still disabled with the wrong email', await disabled(page, '#delGo'));
    await page.fill('#delEmail', EMAIL.toUpperCase());
    check('4: enabled once the email matches (case-insensitively)', !(await disabled(page, '#delGo')));
    await page.click('#delGo');
    await page.waitForFunction(() => !document.getElementById('acctGone').hidden, null, { timeout: 20000 });
    const call = cloud.log.find(e => e.kind === 'delete-account');
    check('4: the function was called with the session token and the publishable key', !!call && call.auth === 'Bearer x' && call.apikey === CFG.anonKey, JSON.stringify(call));
    check('4: the deleted tile with the counts', /12 items, 1 project, 4 files/.test(await text(page, '#goneCounts')), await text(page, '#goneCounts'));
    const ls = await page.evaluate(() => Object.assign({}, localStorage));
    check('4: session and name cache removed', !(AUTH_KEY in ls) && !('ivritSuite_accountCache' in ls));
    const meta = JSON.parse(ls.ivritSuite_syncMeta || '{}');
    check('4: the sync memory forgets the account', !!meta.users && !meta.users[UID] && !(meta.welcomed || {})[UID]);
    check('4: a tool\'s own key untouched', ls.hebrewBlender_presets === seedFor(true).hebrewBlender_presets);
    check('4: the chip is signed out', await page.evaluate(() => IvritAccount.status() === 'anonymous'));
    check('4: 0 pageerrors through scenarios 1–4', errors.length === 0, errors.join(' | '));
    check('4: the fake emptied the account', cloud.deleted && cloud.tables.saves.length === 0 && Object.keys(cloud.objects).length === 0);
    await page.screenshot({ path: path.join(SHOTS, '4-deleted.png') });
    await ctx.close();
  }
  // ---- 5. delete refused --------------------------------------------------------------------------
  {
    const cloud5 = new FakeCloud(); cloud5.failDelete = true;
    const ctx5 = await openContext(browser, cloud5, seedFor(true));
    const { page: p5, errors: e5 } = await openPage(ctx5, { signedIn: true });
    await fillDelete(p5, EMAIL);
    await p5.click('#delGo');
    await p5.waitForFunction(() => document.getElementById('delStatus').classList.contains('is-error') && document.getElementById('delStatus').textContent.length > 0, null, { timeout: 15000 });
    check('5: the error line names the failure', /could not be deleted/.test(await text(p5, '#delStatus')), await text(p5, '#delStatus'));
    check('5: still signed in, session intact, box still open', (await p5.evaluate(() => IvritAccount.status())) === 'signed-in' && (await p5.evaluate((k) => !!localStorage.getItem(k), AUTH_KEY)) && (await visible(p5, '#delConfirm')) && !(await visible(p5, '#acctGone')));
    check('5: 0 pageerrors', e5.length === 0, e5.join(' | '));
    await ctx5.close();
  }
  // ---- 6. Hebrew + dark at 800 px -----------------------------------------------------------------
  {
    const cloud6 = new FakeCloud();
    const ctx6 = await openContext(browser, cloud6, seedFor(true, { hebrewBlender_lang: 'he', hebrewBlender_darkMode: '1' }), { viewport: { width: 800, height: 900 } });
    const { page: p6, errors: e6 } = await openPage(ctx6, { signedIn: true });
    check('6: RTL + dark', await p6.evaluate(() => document.documentElement.dir === 'rtl' && document.body.classList.contains('dark')));
    check('6: Hebrew headings and listing', /החשבון/.test(await text(p6, '#holdsHead')) && /פריטים/.test(await text(p6, '#holdsTotal')), await text(p6, '#holdsTotal'));
    check('6: 0 pageerrors', e6.length === 0, e6.join(' | '));
    await p6.screenshot({ path: path.join(SHOTS, '6-hebrew-dark-800.png'), fullPage: true });
    await ctx6.close();
  }
} finally {
  await browser.close();
  srv.kill();
}
const failed = results.filter(r => !r.ok);
console.log('\n' + (results.length - failed.length) + ' / ' + results.length + ' checks passed; screenshots in ' + SHOTS);
process.exit(failed.length ? 1 : 0);
