#!/usr/bin/env node
// S590 — Resources: hCaptcha's script loads on the Suggest window's first opening, not with the page. It loaded on every
// visit (async defer), so a teacher who only browsed the links contacted hCaptcha (its ~416 KB script and a logo fetch,
// measured with the real script replayed) though the privacy page says it is "used only if you send" a form, and the
// script took ten times the page's own script time. hCaptcha is stubbed here (a fake api.js that renders an iframe and
// counts its requests), so the probe never reaches hCaptcha. Real clicks throughout.
//
//   node scripts/loop/probes/S590-resources-captcha-loads-on-suggest.mjs   exit 1 when, in EN or HE:
//     A  a visit that never opens Suggest requests hCaptcha (after 3 s) or defines window.hcaptcha;
//     B  opening Suggest does not request it once and render the widget in #sgHcaptcha;
//     C  closing and reopening requests it again or renders a second widget;
//     D  with hCaptcha blocked, Send does not say the check couldn't load (+ the e-mail), and the next opening with the
//        network back does not load it and render the widget;
//     E  with the script arriving 8 s late (after the 6 s of retries), the open window does not render it;
//   or on a page error. ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before the S590
//   fix fails A in both languages, and D too — its page-load script, once blocked, was never asked for again, so the
//   network coming back left the window without a check until a reload); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
// The stub: hCaptcha's explicit-render API surface the page uses (render, getResponse, reset).
const STUB = `window.hcaptcha = { render: function (box, o) { var f = document.createElement('iframe'); f.title = 'stub ' + o.theme; box.appendChild(f); return 0; }, getResponse: function () { return ''; }, reset: function () {} };`;
async function cell(lang, mode) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.addInitScript(lang => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', lang); }, lang);
  const st = { hits: 0, block: mode === 'blocked', delay: mode === 'late' ? 8000 : 0 };
  await ctx.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith(BASE) || /^(data|blob):/.test(u)) return r.continue();
    if (/^https:\/\/([a-z0-9-]+\.)*hcaptcha\.com\//.test(u)) {
      st.hits++;
      if (st.block) return r.abort();
      if (st.delay) await new Promise(res => setTimeout(res, st.delay));
      return r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
    }
    return r.abort();
  });
  const page = await ctx.newPage(); let errors = 0; page.on('pageerror', () => errors++);
  await page.goto(BASE + '/resources.html', { waitUntil: 'load' });
  await page.evaluate(() => window.I18n && I18n.ready);
  const widgets = () => page.evaluate(() => document.querySelectorAll('#sgHcaptcha iframe').length);
  const open = () => page.click('button.suggest-btn');
  const close = async () => { await page.click('#sgBackdrop .sg-modal-close'); await page.waitForTimeout(200); };
  const r = { lang, mode };
  if (mode === 'normal') {
    await page.waitForTimeout(3000);
    r.A = { hits: st.hits, global: await page.evaluate(() => typeof window.hcaptcha) };
    r.A.ok = r.A.hits === 0 && r.A.global === 'undefined';
    await open(); await page.waitForFunction(() => document.querySelector('#sgHcaptcha iframe'), null, { timeout: 8000 }).catch(() => {});
    r.B = { hits: st.hits, widgets: await widgets() }; r.B.ok = r.B.hits === 1 && r.B.widgets === 1;
    await close(); await open(); await page.waitForTimeout(1000);
    r.C = { hits: st.hits, widgets: await widgets() }; r.C.ok = r.C.hits === 1 && r.C.widgets === 1;
  } else if (mode === 'blocked') {
    await open(); await page.waitForTimeout(6800);
    await page.fill('#sgName', 'Probe'); await page.fill('#sgEmail', 'probe@example.org'); await page.fill('#sgResName', 'Probe resource');
    await page.fill('#sgResUrl', 'https://example.org/'); await page.fill('#sgDesc', 'A probe.');
    await page.click('#suggestForm button[type="submit"]'); await page.waitForTimeout(300);
    const status = await page.evaluate(() => ({ text: document.getElementById('sgStatus').textContent, mail: !!document.querySelector('#sgStatus a[href^="mailto:"]'), want: I18n.t('resources.suggest.captcha_unavailable') }));
    r.D = { hits: st.hits, widgets: await widgets(), said: status.text.includes(status.want), mail: status.mail };
    st.block = false; await close(); await open();
    await page.waitForFunction(() => document.querySelector('#sgHcaptcha iframe'), null, { timeout: 8000 }).catch(() => {});
    r.D.hitsAfter = st.hits; r.D.widgetsAfter = await widgets();
    r.D.ok = r.D.hits >= 1 && r.D.widgets === 0 && r.D.said && r.D.mail && r.D.hitsAfter > r.D.hits && r.D.widgetsAfter === 1;
  } else {
    await open();
    await page.waitForFunction(() => document.querySelector('#sgHcaptcha iframe'), null, { timeout: 12000 }).catch(() => {});
    r.E = { hits: st.hits, widgets: await widgets() }; r.E.ok = r.E.hits === 1 && r.E.widgets === 1;
  }
  r.errors = errors; r.ok = errors === 0 && ['A', 'B', 'C', 'D', 'E'].every(k => !r[k] || r[k].ok);
  await ctx.close();
  return r;
}
const browser = await chromium.launch();
const records = [];
for (const lang of ['en', 'he']) for (const mode of ['normal', 'blocked', 'late']) records.push(await cell(lang, mode));
await browser.close(); server.close();
const pass = records.every(r => r.ok);
if (JSON_OUT) console.log(JSON.stringify({ pass, records }, null, 1));
else {
  for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.lang} ${r.mode} ${JSON.stringify(Object.fromEntries(['A', 'B', 'C', 'D', 'E'].filter(k => r[k]).map(k => [k, r[k]])))} errors ${r.errors}`);
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.filter(r => r.ok).length}/${records.length} cells — hCaptcha only from the Suggest window's first opening, the blocked and late paths kept`);
}
process.exit(pass ? 0 : 1);
