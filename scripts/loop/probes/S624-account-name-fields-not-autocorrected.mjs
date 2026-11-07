#!/usr/bin/env node
// S624 — the account module's two name fields carry autocorrect=off, as every other name field in the suite does (the
// S615 N P4): the student sign-in's Username (the Torah Trainer's chip menu, its student form) and the name step's
// "Your name". iOS Safari "corrects" a typed login or surname otherwise.
//
//   node scripts/loop/probes/S624-account-name-fields-not-autocorrected.mjs
//   Runtime: the Trainer, signed out, the chip's menu opened on the student form by a real click on its button.
//   The name step needs a signed-in nameless account (smoke-account's fake auth): read here from the module's source,
//   the line that builds it. ROOT=<a git archive of the tree> runs another copy (the tree before S624 fails both).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fail = 0;
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage(); page.setDefaultTimeout(10000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
await page.addInitScript(() => { localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); });
await page.goto(base + '/torah_trainer.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.IvritAccount && window.I18n && document.querySelector('.ivacct-chip, [data-ivk="chip"], .ivacct-btn'), null, { timeout: 30000 }).catch(() => {});
await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
const opened = await page.evaluate(() => IvritAccount.openMenu());
await page.locator('[data-ivk="student"]').click();
const u = await page.evaluate(() => { const i = document.querySelector('[data-ivk="username"]'); return i ? { autocorrect: i.getAttribute('autocorrect'), autocapitalize: i.getAttribute('autocapitalize'), spellcheck: i.spellcheck, autocomplete: i.autocomplete } : null; });
const ok1 = opened && !!u && u.autocorrect === 'off' && u.autocapitalize === 'none' && u.spellcheck === false && u.autocomplete === 'username';
if (!ok1) fail++;
console.log(`${ok1 ? '✔' : '✘'} the student form's Username: ${JSON.stringify(u)}`);
const src = fs.readFileSync(path.join(ROOT, 'js/ivrit-account.js'), 'utf8');
const at = src.indexOf("input.id = 'ivacct-name-input'"), block = at >= 0 ? src.slice(at, src.indexOf('card.appendChild(input)', at)) : '';
const ok2 = !!block && /setAttribute\('autocorrect', 'off'\)/.test(block) && /setAttribute\('autocapitalize', 'words'\)/.test(block);
if (!ok2) fail++;
console.log(`${ok2 ? '✔' : '✘'} the name step's "Your name" is built with autocorrect=off (handle ${at >= 0 ? 'found' : 'MISSING'})`);
if (errors.length) { fail++; console.log('✘ page errors', errors); }
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: both fields');
process.exit(fail ? 1 : 0);
