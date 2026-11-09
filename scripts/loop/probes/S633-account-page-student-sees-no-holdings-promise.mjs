#!/usr/bin/env node
// S633 (pass P; the S606 student-cell candidate) — account.html for a student account (Torah Trainer reading
// assignments) shows only the student tile, which says the account keeps nothing here and its teacher manages it; the
// header tagline ("What your account holds · Download everything · Delete your account") and the lede ("Everything
// your account holds, a download of all of it, and the way to delete it…") promised the opposite above it. Both are
// hidden while the student tile shows; a teacher and a signed-out visitor still read them.
//
// The page runs with the pinned SDK fixture against a minimal fake Auth + PostgREST (every table answers an empty
// list; the SDK's load is counted, so a page that never ran the account layer cannot pass): a stored session whose user is `app_metadata.role: 'student'`, then a teacher (control), then no session
// (control), in EN light 1280, HE dark 800, EN dark 800 and HE light 1280.
//
//   node scripts/loop/probes/S633-account-page-student-sees-no-holdings-promise.mjs --sdk path/to/supabase.js
//   exit 1 when a step fails or a handle is missing; without --sdk it skips (exit 0, says so). ROOT=<a git archive of
//   the tree> runs another copy (the tree before S633 fails the student step in every cell); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const SDK = arg('--sdk');
if (!SDK || !fs.existsSync(SDK)) { console.log('SKIP: needs --sdk <the pinned supabase.js UMD build> (docs/reference/ops.md → Backend smokes)'); process.exit(0); }
const SDK_BYTES = fs.readFileSync(SDK);
const sb = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/supabase-config.js'), 'utf8'), sb);
const CFG = sb.window.IVRIT_SUPABASE;
const AUTH_KEY = 'sb-' + new URL(CFG.url).hostname.split('.')[0] + '-auth-token';
const UID = '11111111-1111-4111-8111-111111111111';
const userOf = (role) => ({ id: UID, aud: 'authenticated', role: 'authenticated', email: role === 'student' ? 'noa.k@students.invalid' : 'teacher@example.org',
  user_metadata: { full_name: role === 'student' ? 'Noa K' : 'Test Teacher' }, app_metadata: role === 'student' ? { provider: 'email', role: 'student' } : { provider: 'email' }, created_at: '2026-09-01T00:00:00Z' });
const sessionOf = (role) => ({ access_token: 'x', refresh_token: 'y', expires_at: 4102444800, expires_in: 3600, token_type: 'bearer', user: userOf(role) });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const record = []; let fail = 0;
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }];
for (const cell of CELLS) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  for (const who of ['student', 'teacher', 'out']) {
    const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
    let sdkHits = 0;
    await page.route('**/*', r => {
      const u = r.request().url(), cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
      if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
      if (u === CFG.sdk) { sdkHits++; return r.fulfill({ status: 200, body: SDK_BYTES, headers: { 'content-type': 'application/javascript; charset=utf-8', 'access-control-allow-origin': '*' } }); }
      if (u.startsWith(CFG.url)) {
        if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
        const j = (s, b) => r.fulfill({ status: s, headers: Object.assign({ 'content-type': 'application/json' }, cors), body: JSON.stringify(b) });
        if (/\/auth\/v1\/user/.test(u)) return j(200, userOf(who));
        if (/\/auth\/v1\/token/.test(u)) return j(200, sessionOf(who));
        if (/\/rest\/v1\//.test(u)) return r.fulfill({ status: 200, headers: Object.assign({ 'content-type': 'application/json', 'content-range': '*/0' }, cors), body: '[]' });
        return j(404, { message: 'not here' });
      }
      return r.abort();
    });
    await page.addInitScript(([lang, dark, key, sess]) => {
      if (sessionStorage.getItem('seeded')) return;
      localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0');
      if (sess) { localStorage.setItem(key, sess); localStorage.setItem('ivritSuite_accountCache', JSON.stringify({ name: 'x' })); }
      sessionStorage.setItem('seeded', '1');
    }, [cell.lang, cell.dark, AUTH_KEY, who === 'out' ? null : JSON.stringify(sessionOf(who))]);
    await page.goto(base + '/account.html', { waitUntil: 'domcontentloaded' });
    const tile = who === 'student' ? 'acctStudent' : who === 'teacher' ? 'acctIn' : 'acctOut';
    let r = null, ok = false;
    try {
      await page.waitForFunction((id) => { const n = document.getElementById(id); return n && !n.hidden; }, tile, { timeout: 20000 });
      await page.evaluate(() => window.I18n && I18n.ready); await page.waitForTimeout(300);
      r = await page.evaluate(() => {
        const vis = (n) => !!n && !n.closest('[hidden]') && n.getClientRects().length > 0 && getComputedStyle(n).display !== 'none';
        const tag = document.querySelector('[data-i18n="account.header.tagline"]'), lede = document.querySelector('main .lede');
        const shown = ['acctOut', 'acctBusy', 'acctIn', 'acctGone', 'acctStudent'].filter(id => !document.getElementById(id).hidden);
        return { handles: !!tag && !!lede, shown, tagline: vis(tag), lede: vis(lede), taglineText: tag && tag.textContent.trim().slice(0, 40), title: vis(document.querySelector('.brand-title')), h1: vis(document.querySelector('h1.page-title')) };
      });
      r.sdkHits = sdkHits;
      ok = r.handles && r.shown.length === 1 && r.shown[0] === tile && r.title && r.h1 &&
        (who === 'student' ? (!r.tagline && !r.lede && sdkHits > 0) : (r.tagline && r.lede && (who === 'out' || sdkHits > 0)));
    } catch (e) { r = Object.assign(r || {}, { error: String(e).slice(0, 200), sdkHits }); }
    if (errors.length) { ok = false; r = Object.assign(r || {}, { errors }); }
    if (!ok) fail++;
    const name = who === 'student' ? 'student: the student tile alone, no tagline, no lede' : who === 'teacher' ? 'control, teacher: the account tile with its tagline and lede' : 'control, signed out: the sign-in tile with its tagline and lede';
    record.push({ cell: tag, name, ok, r });
    if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`);
    await ctx.close();
  }
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in all four cells');
process.exit(fail ? 1 : 0);
