#!/usr/bin/env node
// S658 — the holidays/ pages' search text: (1) every symbol is named as the catalog writes it ("Seder Plate",
// "Star of David", never "seder Plate") in the description, the social cards, the image caption and the picture's
// alt text, and (2) a title stays within 60 characters unless what passes it is an English translation of the name
// ("Holocaust Remembrance Day"): a re-spelling that repeats a word of the name ("Shmini Atzeret") is not kept past
// 60. Static: reads js/holiday-guide-data.js and the pages, no browser.
//
//   node scripts/loop/probes/S658-holiday-pages-name-symbols-as-the-catalog.mjs
//   exit 1 on a miss. ROOT=<a git archive of the tree> runs another copy (the tree before S658 fails step 1 on all
//   17 pages and step 2 on shemini-atzeret-simchat-torah.html); --json prints the record.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/holiday-guide-data.js'), 'utf8'), sandbox);
const HG = sandbox.window.HolidayGuide;
if (!HG || !Array.isArray(HG.list)) { console.log('FAIL window.HolidayGuide.list did not load'); process.exit(1); }
const decode = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const attr = (src, re) => { const m = src.match(re); return m ? decode(m[1]) : null; };
const record = []; let fail = 0, pages = 0;
for (const h of HG.list.filter((x) => x.symbols && x.symbols.length)) {
  const file = path.join(ROOT, 'holidays', h.slug + '.html');
  if (!fs.existsSync(file)) { record.push({ page: h.slug, ok: false, why: 'missing page' }); fail++; continue; }
  pages++;
  const src = fs.readFileSync(file, 'utf8');
  const texts = {
    description: attr(src, /<meta name="description" content="([^"]*)"/),
    'og:description': attr(src, /<meta property="og:description" content="([^"]*)"/),
    'og:image:alt': attr(src, /<meta property="og:image:alt" content="([^"]*)"/),
    'img alt': attr(src, /<img id="hpImg"[^>]* alt="([^"]*)"/),
  };
  const misses = [];
  for (const [k, t] of Object.entries(texts)) {
    if (t == null) { misses.push(`${k}: not found`); continue; }
    for (const s of h.symbols) if (!t.includes(s.en)) misses.push(`${k}: "${s.en}"`);
  }
  const title = attr(src, /<title>([^<]*)<\/title>/) || '';
  const alt1 = h.spelled && h.spelled[0];
  const nameWords = h.en.split(/[\s/]+/);
  const respellingKept = !!alt1 && title.includes(`(${alt1})`) && alt1.split(/\s+/).some((w) => nameWords.includes(w));
  if (title.length > 60 && respellingKept) misses.push(`title ${title.length}: keeps the re-spelling "${alt1}"`);
  const ok = !misses.length; if (!ok) fail++;
  record.push({ page: h.slug, title: title.length, ok, misses });
}
if (JSON_OUT) console.log(JSON.stringify(record, null, 2));
else for (const r of record) console.log(`${r.ok ? 'PASS' : 'FAIL'} holidays/${r.page}.html${r.misses && r.misses.length ? ' — ' + r.misses.slice(0, 4).join('; ') + (r.misses.length > 4 ? ` (+${r.misses.length - 4})` : '') : ''}`);
if (!pages) { console.log('FAIL no holiday page was read'); process.exit(1); }
if (!JSON_OUT) console.log(`${record.length - fail}/${record.length} pages`);
process.exit(fail ? 1 : 0);
