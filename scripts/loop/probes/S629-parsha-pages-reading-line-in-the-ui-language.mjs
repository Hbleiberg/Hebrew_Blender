#!/usr/bin/env node
// S629 — a parsha coloring page names its book in the UI's language (pass H on parsha_emojis + parsha/). The reading
// line under the title was one static `<bdi dir="ltr">Genesis 6:9–11:32</bdi>`, so the Hebrew UI read "Genesis" where
// the parsha emojis page's own card for the same parasha reads "בראשית 6:9–11:32"; the generator now writes the book
// as a `data-i18n="torah.custom.book_<book>"` span before the verses' bdi.
//
//   node scripts/loop/probes/S629-parsha-pages-reading-line-in-the-ui-language.mjs
//   All 54 pages × HE dark 800 and EN light 1280, a fresh profile: each page's reading line equals the parsha emojis
//   page's card line for that parasha in the same UI (View All, read by a real click), the Hebrew one opens with the
//   book's Hebrew name, sits to the right of the verses and carries no Latin letter, and the English one equals the
//   line as the page printed it before (the static text, from each file, never changed for search engines); then
//   EN dark 800 / HE light 1280 on four pages switch the language by the header's switcher (a real selectOption) and
//   back, the line following each switch. 0 page errors. exit 1 when a step fails or a handle is missing.
//   ROOT=<a git archive of the tree> runs another copy (the tree before S629 fails every cell: its Hebrew lines read
//   "Genesis …", no line has a book span, and a language switch leaves the line as it was).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const norm = s => String(s).replace(/\s+/g, ' ').trim();
const HE_BOOKS = ['בראשית', 'שמות', 'ויקרא', 'במדבר', 'דברים'];
const slugs = fs.readdirSync(path.join(ROOT, 'parsha')).filter(f => f.endsWith('.html') && f !== 'index.html').map(f => f.replace(/\.html$/, ''));
// The line as each file states it (what a crawler reads): the text of the first <p> in .pp-meta, tags stripped.
const staticLine = {};
for (const s of slugs) {
  const html = fs.readFileSync(path.join(ROOT, 'parsha', s + '.html'), 'utf8');
  const m = /<div class="pp-meta">\s*<p>([\s\S]*?)<\/p>/.exec(html);
  staticLine[s] = m ? norm(m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')) : null;
}
async function ctxFor(cell) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); }, [cell.lang, cell.dark]);
  return ctx;
}
const readLine = page => page.evaluate(() => {
  const p = document.querySelector('.pp-meta p'); if (!p) return null;
  const b = p.querySelector('bdi'), sp = p.querySelector('span');
  const rb = b && b.getBoundingClientRect(), rs = sp && sp.getBoundingClientRect();
  return { text: p.textContent.replace(/\s+/g, ' ').trim(), bookRightOfVerses: !!(rb && rs && rs.left >= rb.right - 1), bookLeftOfVerses: !!(rb && rs && rs.right <= rb.left + 1), n: Number(document.getElementById('ppMain').dataset.n) };
});
// The parsha emojis page's card lines in this UI, by n.
async function cardLines(cell) {
  const ctx = await ctxFor(cell); const page = await ctx.newPage(); page.setDefaultTimeout(20000);
  await page.goto(base + '/parsha_emojis.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.querySelectorAll('#etCards .et-card').length > 0);
  await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(400);
  await page.click('.et-view[data-view="all"]'); await page.waitForTimeout(500);
  const lines = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#etCards .et-card')].map(c => [c.dataset.n, c.querySelector('.et-ref').textContent.replace(/\s+/g, ' ').trim()])));
  await ctx.close();
  return lines;
}
for (const cell of [{ lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: false, w: 1280 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  try {
    const cards = await cardLines(cell);
    if (Object.keys(cards).length !== 54) { ok(false, `${L}: the parsha emojis page showed ${Object.keys(cards).length} cards, not 54`); continue; }
    const ctx = await ctxFor(cell); const page = await ctx.newPage(); page.setDefaultTimeout(20000);
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    const bad = [];
    for (const s of slugs) {
      await page.goto(base + `/parsha/${s}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.I18n && document.getElementById('ppMain')); await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(80);
      const r = await readLine(page);
      const good = r && r.text === cards[r.n] && (cell.lang === 'he'
        ? HE_BOOKS.some(b => r.text.startsWith(b + ' ')) && !/[A-Za-z]/.test(r.text) && r.bookRightOfVerses
        : r.text === staticLine[s] && r.bookLeftOfVerses);
      if (!good) bad.push(`${s} «${r && r.text}» vs card «${r && cards[r.n]}»`);
    }
    ok(slugs.length === 54 && bad.length === 0 && errors.length === 0, `${L}: ${slugs.length - bad.length} of ${slugs.length} pages read their book as the card does${bad.length ? ' — ' + bad.slice(0, 3).join('; ') : ''}; ${errors.length} errors`);
    await ctx.close();
  } catch (e) { fail++; console.log(`✘ ${L}: ${String(e).split('\n')[0]}`); }
}
// a live switch by the header's language switcher
for (const cell of [{ lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  for (const s of ['bereshit', 'tetzaveh', 'emor', 'vzot-haberachah']) {
    try {
      const ctx = await ctxFor(cell); const page = await ctx.newPage(); page.setDefaultTimeout(20000);
      const errors = []; page.on('pageerror', e => errors.push(String(e)));
      await page.goto(base + `/parsha/${s}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.I18n && document.getElementById('ppMain')); await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(200);
      const sel = await page.$('select.lang-select, #langSelect, .lang-switch select, header select');
      if (!sel) { ok(false, `${L} ${s}: no language switcher found`); await ctx.close(); continue; }
      const a = await readLine(page);
      const other = cell.lang === 'he' ? 'en' : 'he';
      await sel.selectOption(other); await page.waitForTimeout(500);
      const b = await readLine(page);
      await sel.selectOption(cell.lang); await page.waitForTimeout(500);
      const c = await readLine(page);
      const isHe = t => HE_BOOKS.some(x => t.startsWith(x + ' '));
      ok(isHe(a.text) === (cell.lang === 'he') && isHe(b.text) === (other === 'he') && c.text === a.text && errors.length === 0,
        `${L} ${s}: «${a.text}» → ${other} «${b.text}» → back «${c.text}»; ${errors.length} errors`);
      await ctx.close();
    } catch (e) { fail++; console.log(`✘ ${L} ${s}: ${String(e).split('\n')[0]}`); }
  }
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: every parsha coloring page names its book in the UI language, as its card does');
process.exit(fail ? 1 : 0);
