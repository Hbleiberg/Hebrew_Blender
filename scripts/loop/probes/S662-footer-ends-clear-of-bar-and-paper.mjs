#!/usr/bin/env node
// S662 — two footers' last lines:
//   generator — scrolled to the page's end after a real Generate, no footer link has its centre under the frozen Generate
//               bar (above 700px the bar is the sidebar's width at the foot of its side; at 710–880px the centred
//               footer's last row ran under it: Instagram, at 710 three Related Hebrew Tools links too), 700–1280px ×
//               EN/HE;
//   resources — printed (Links view × EN/HE × Letter/A4, page.pdf read back with poppler), the footer's three closed
//               disclosures (Frequently Asked Questions, How To Use, Finding A Font) are off paper instead of bare
//               headings, and with the FAQ and its first question opened by real clicks, those print and the other two
//               headings do not.
//
//   node scripts/loop/probes/S662-footer-ends-clear-of-bar-and-paper.mjs     exit 1 on any failing cell or a page error
//   ROOT=<a git archive of the tree> runs another copy (the tree before S662 fails every generator cell from 710 to 880
//   and all 8 resources cells). System fonts only (foreign origins aborted); the resources arm skips without poppler.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
async function open(file, lang, viewport) {
  const ctx = await browser.newContext({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(l => { if (sessionStorage.getItem('__s662')) return; sessionStorage.setItem('__s662', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_tourSeen', '1'); }, lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/${file}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && document.documentElement.lang, null, { timeout: 20000 }); await page.evaluate(() => I18n.ready); await page.waitForTimeout(400);
  return { ctx, page, errs };
}
// generator: footer links under the bar at the page's end
for (const lang of ['en', 'he']) {
  const { ctx, page, errs } = await open('hebrew_blend_generator.html', lang, { width: 1280, height: 900 });
  await page.locator('#generateBtn').click(); await page.waitForTimeout(900);
  const shown = await page.evaluate(() => document.getElementById('genFab').classList.contains('has-actions'));
  for (const w of [700, 710, 720, 760, 800, 840, 880, 900, 1000, 1280]) {
    await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(80);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(150);
    const r = await page.evaluate(() => {
      const fab = document.getElementById('genFab'), cs = getComputedStyle(fab);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return { bar: false, under: [], links: 0 };
      const f = fab.getBoundingClientRect(), under = []; let links = 0;
      for (const a of document.querySelectorAll('body > footer a, body > footer summary')) {
        const r = a.getBoundingClientRect(); if (!r.width || a.closest('details:not([open]) > :not(summary)')) continue; links++;
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        if (x > f.left && x < f.right && y > f.top && y < f.bottom) under.push((a.textContent || '').trim().slice(0, 24));
      }
      return { bar: true, under, links };
    });
    report(shown && r.bar && r.links > 5 && !r.under.length && !errs.length, `generator ${lang} ${w}px: the bar ${r.bar ? 'shown' : 'NOT SHOWN (no control)'}, ${r.links} footer links, under it: ${r.under.length ? r.under.join(' / ') : 'none'}`);
  }
  await ctx.close();
}
// resources: the footer's closed disclosures on paper
let poppler = true; try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); execFileSync('pdfinfo', ['-v'], { stdio: 'ignore' }); } catch (e) { poppler = false; console.log('SKIP resources: poppler (pdfinfo / pdftotext) is not installed'); }
if (poppler) {
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's662-'));
  const norm = s => s.replace(/[‎‏‪-‮]/g, '').replace(/\s+/g, ' ').toLowerCase();
  const words = s => norm(s).split(/[\s,.?!:;״׳'’()\-]+/).filter(w => w.length > 1).slice(0, -1);
  for (const lang of ['en', 'he']) for (const opened of [false, true]) {
    const { ctx, page, errs } = await open('resources.html', lang, { width: 1280, height: 900 });
    const heads = await page.evaluate(() => [...document.querySelectorAll('footer > div > div > details > summary')].map(s => s.textContent.trim()));
    let qa = null;
    if (opened) { await page.locator('footer details > summary').first().click(); await page.locator('footer details details > summary').first().click(); qa = await page.evaluate(() => { const d = document.querySelector('footer details details'); return d.querySelector('summary').textContent + ' ' + d.querySelector('p').textContent; }); }
    for (const [paper, w, h] of [['Letter', 8.5, 11], ['A4', 8.27, 11.69]]) {
      const pdf = path.join(TMP, `r-${lang}-${opened}-${paper}.pdf`);
      await page.pdf({ path: pdf, width: w + 'in', height: h + 'in', margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });
      const T = norm(execFileSync('pdftotext', [pdf, '-']).toString());
      const printed = heads.filter(x => T.includes(norm(x))), want = opened ? heads.slice(0, 1) : [];
      const qaOk = !qa || words(qa).every(x => T.includes(x));
      report(heads.length === 3 && JSON.stringify(printed) === JSON.stringify(want) && qaOk && !errs.length, `resources ${lang} ${opened ? 'FAQ + a question opened' : 'closed'} ${paper}: disclosure headings on paper ${printed.length}/3 (want ${want.length})${qa ? `, the opened question and answer ${qaOk ? 'print' : 'MISSING'}` : ''}`);
    }
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log(fails ? `${fails} / ${cells} cells fail` : `all ${cells} cells pass`);
process.exit(fails ? 1 : 0);
