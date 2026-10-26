#!/usr/bin/env node
/*
 * smoke-parsha-pages.mjs — load every generated parsha coloring page (parsha/<slug>.html, scripts/build-parsha-pages.mjs)
 * and check what a visitor from a search would use:
 *   - each of the 54 in English, light, 1280px: no page error, its picture loaded, one h1 naming the parasha, the next
 *     reading line filled (V'Zot HaBerachah: Simchat Torah), the Print link /parsha_emojis.html?parsha=<slug>;
 *   - every internal link on them (Print, Torah Trainer, breadcrumb, pager, list, footer) answers 200;
 *   - every Print link's slug resolves to its own parasha on parsha_emojis.html (etFindParsha), and three of them,
 *     followed, open the coloring popup with that parasha alone;
 *   - the Parsha Emojis cards' Coloring page links (View All) all point at a generated page;
 *   - four pages in Hebrew, dark, 800px and at 360px: Hebrew alt and next-reading line, dark on, no horizontal scroll;
 *   - parsha/ (the forwarder) lands on the list.
 * Usage: node scripts/smoke-parsha-pages.mjs [--port 8097]. Needs the preinstalled Playwright + Chromium
 * (docs/reference/ops.md → the headless recipe); starts its own python3 -m http.server and aborts every other origin.
 * Exit 1 on any failure.
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const pi = args.indexOf('--port');
const PORT = pi >= 0 ? Number(args[pi + 1]) : 8097;
const BASE = `http://127.0.0.1:${PORT}`;
const pages = readdirSync(path.join(ROOT, 'parsha')).filter((f) => f.endsWith('.html') && f !== 'index.html').sort();

let chromium;
try { const m = await import('/opt/node22/lib/node_modules/playwright/index.js'); chromium = (m.default || m).chromium; }
catch (e) { try { const m = await import('playwright'); chromium = (m.default || m).chromium; } catch (e2) { console.error('smoke-parsha-pages: Playwright is not available'); process.exit(2); } }

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const browser = await chromium.launch();
const fails = [];
const fail = (where, msg) => fails.push(`${where}: ${msg}`);
let checks = 0;
const ok = (cond, where, msg) => { checks++; if (!cond) fail(where, msg); };

async function ctxFor({ lang = 'en', dark = false, width = 1280 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript((l) => { try { localStorage.setItem('hebrewBlender_lang', l); } catch (e) {} }, lang);
  await ctx.route('**/*', (r) => (r.request().url().startsWith(BASE) || /^(data|blob):/.test(r.request().url())) ? r.continue() : r.abort());
  return ctx;
}

try {
  ok(pages.length === 54, 'parsha/', `${pages.length} pages, expected 54`);
  const links = new Set();
  const slugs = [];
  // 1) Every page, English light 1280.
  {
    const ctx = await ctxFor();
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', (e) => errs.push(e.message));
    for (const f of pages) {
      const slug = f.replace(/\.html$/, '');
      slugs.push(slug);
      errs.length = 0;
      await pg.goto(`${BASE}/parsha/${f}`, { waitUntil: 'load' });
      await pg.waitForFunction(() => window.I18n && document.getElementById('ppNext').textContent.trim() !== '', null, { timeout: 8000 }).catch(() => {});
      const r = await pg.evaluate(() => {
        const img = document.getElementById('ppImg');
        return {
          img: !!img && img.complete && img.naturalWidth > 0,
          h1: [...document.querySelectorAll('h1')].map((h) => h.textContent),
          next: document.getElementById('ppNext').textContent,
          print: document.querySelector('.pp-primary').getAttribute('href'),
          hrefs: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.startsWith('/')),
          n: Number(document.getElementById('ppMain').dataset.n),
        };
      });
      ok(errs.length === 0, f, `page errors: ${errs.join(' | ')}`);
      ok(r.img, f, 'the picture did not load');
      ok(r.h1.length === 1 && /Coloring Page/.test(r.h1[0]), f, `h1 ${JSON.stringify(r.h1)}`);
      ok(r.n === 54 ? /Simchat Torah/.test(r.next) : /Shabbat, /.test(r.next), f, `next-reading line «${r.next}»`);
      ok(r.print === `/parsha_emojis.html?parsha=${slug}`, f, `Print link ${r.print}`);
      r.hrefs.forEach((h) => links.add(h.replace(/#.*$/, '')));
    }
    await ctx.close();
  }
  // 2) Every internal link answers 200.
  {
    const ctx = await ctxFor();
    for (const h of links) {
      const res = await ctx.request.get(BASE + h);
      ok(res.status() === 200, 'link', `${h} → ${res.status()}`);
    }
    await ctx.close();
  }
  // 3) The Print links: every slug resolves to its own parasha; three followed open the popup on it alone. The
  //    Parsha Emojis cards' coloring-page links all point at a generated page.
  {
    const ctx = await ctxFor();
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(`${BASE}/parsha_emojis.html`, { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof etFindParsha === 'function' && typeof etData !== 'undefined' && etData && document.querySelector('#etCards .et-card'), null, { timeout: 8000 }).catch(() => {});
    const order = await pg.evaluate((list) => list.map((s) => { const p = etFindParsha(s); return p ? p.n : null; }), slugs);
    const want = await pg.evaluate(() => etData.map((p) => p.n));
    ok(order.every((n) => n), 'parsha_emojis.html', `slugs with no parasha: ${slugs.filter((s, i) => !order[i]).join(', ')}`);
    ok(new Set(order).size === 54 && want.every((n) => order.includes(n)), 'parsha_emojis.html', 'the 54 slugs do not cover the 54 parshiyot once each');
    await pg.click('.et-view[data-view="all"]');
    const cardLinks = await pg.$$eval('#etCards a.et-go:not([target])', (a) => a.map((x) => x.getAttribute('href')));
    ok(cardLinks.length === 54 && cardLinks.every((h) => slugs.includes(h.replace(/^parsha\/|\.html$/g, ''))), 'parsha_emojis.html', `card coloring links: ${cardLinks.length}, unknown ${cardLinks.filter((h) => !slugs.includes(h.replace(/^parsha\/|\.html$/g, ''))).join(' ')}`);
    const listLinks = await pg.$$eval('#etSheets a.et-sheets-link', (a) => a.map((x) => x.getAttribute('href')));
    ok(listLinks.length === 54 && new Set(listLinks).size === 54 && listLinks.every((h) => /^parsha\/[a-z-]+\.html$/.test(h) && slugs.includes(h.slice(7, -5))), 'parsha_emojis.html', 'the list under the cards does not link the 54 pages');
    for (const slug of ['bereshit', 'chayei-sara', 'vzot-haberachah']) {
      await pg.goto(`${BASE}/parsha/${slug}.html`, { waitUntil: 'load' });
      await Promise.all([pg.waitForURL(/parsha_emojis\.html\?parsha=/), pg.click('.pp-primary')]);
      await pg.waitForSelector('#etCsOverlay:not([hidden])', { timeout: 8000 }).catch(() => {});
      const chosen = await pg.$$eval('#etCsChips input:checked', (a) => a.map((x) => Number(x.value)));
      const n = slugs.indexOf(slug) >= 0 ? order[slugs.indexOf(slug)] : 0;
      ok(chosen.length === 1 && chosen[0] === n - 1, `Print (${slug})`, `the popup chose ${JSON.stringify(chosen)}, expected [${n - 1}]`);
    }
    ok(errs.length === 0, 'parsha_emojis.html', `page errors: ${errs.join(' | ')}`);
    await ctx.close();
  }
  // 4) Hebrew, dark, 800px; then 360px.
  for (const [width, set] of [[800, ['bereshit', 'vayakhel', 'shlach', 'vzot-haberachah']], [360, ['lech-lecha', 'behaalotcha']]]) {
    const ctx = await ctxFor({ lang: 'he', dark: true, width });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', (e) => errs.push(e.message));
    for (const slug of set) {
      await pg.goto(`${BASE}/parsha/${slug}.html`, { waitUntil: 'load' });
      await pg.waitForFunction(() => window.I18n && I18n.lang === 'he' && /[֐-׿]/.test(document.getElementById('ppNext').textContent), null, { timeout: 8000 }).catch(() => {});
      const r = await pg.evaluate(() => ({
        dir: document.documentElement.dir, dark: document.body.classList.contains('dark'),
        alt: document.getElementById('ppImg').alt, next: document.getElementById('ppNext').textContent,
        hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        pair: (document.getElementById('ppPair') || {}).textContent || '',
      }));
      const where = `${slug} (he, dark, ${width}px)`;
      ok(r.dir === 'rtl' && r.dark, where, `dir ${r.dir}, dark ${r.dark}`);
      ok(/^דף צביעה לפרשת /.test(r.alt), where, `alt «${r.alt}»`);
      ok(/[֐-׿]/.test(r.next), where, `next-reading line «${r.next}»`);
      if (slug === 'vayakhel') ok(/פקודי/.test(r.pair), where, `partner line «${r.pair}»`);
      ok(!r.hScroll, where, 'horizontal scroll');
    }
    ok(errs.length === 0, `Hebrew ${width}px`, `page errors: ${errs.join(' | ')}`);
    await ctx.close();
  }
  // 5) The forwarder.
  {
    const ctx = await ctxFor();
    const pg = await ctx.newPage();
    await pg.goto(`${BASE}/parsha/`, { waitUntil: 'load' });
    await pg.waitForURL(/parsha_emojis\.html#etSheets$/, { timeout: 5000 }).catch(() => {});
    ok(/\/parsha_emojis\.html#etSheets$/.test(pg.url()), 'parsha/', `forwarded to ${pg.url()}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
if (fails.length) {
  console.error(`smoke-parsha-pages: ${fails.length} of ${checks} checks failed:\n  ` + fails.join('\n  '));
  process.exit(1);
}
console.log(`smoke-parsha-pages: ${checks} checks passed (${pages.length} pages, every internal link, the Print hand-off, Hebrew / dark / 360px, the forwarder).`);
