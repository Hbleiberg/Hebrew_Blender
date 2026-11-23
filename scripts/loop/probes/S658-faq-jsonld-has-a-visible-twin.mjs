#!/usr/bin/env node
// S658 — every page whose head carries FAQPage JSON-LD shows its questions on the page: at least as many visible
// questions as the JSON-LD has (the older tool pages paraphrase their twins, so the count is the check), and on
// name_tags.html, whose twin was added in S658, and on the coloring pages hub, whose two are built from one list, each
// question word for word. A question is shown as a fold-out's <summary> or, where a page lists its questions open (the
// hub's "Questions and answers" section), as a definition list's <dt>. Static:
// reads the HTML, no browser. Inline <script> bodies are dropped first, so a template's markup never counts.
//
//   node scripts/loop/probes/S658-faq-jsonld-has-a-visible-twin.mjs
//   exit 1 on a page short of its twin. ROOT=<a git archive of the tree> runs another copy (the tree before S658
//   fails on name_tags.html: 5 questions, 0 summaries); --json prints the record.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const VERBATIM = new Set(['name_tags.html', 'jewish-coloring-pages.html']);
const decode = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const record = []; let fail = 0, pagesWithFaq = 0;
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html')).sort()) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  let questions = [];
  for (const m of src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1]); } catch (e) { continue; }
    for (const n of (Array.isArray(j) ? j : j['@graph'] || [j])) if (n && n['@type'] === 'FAQPage') questions = questions.concat((n.mainEntity || []).map((q) => q.name));
  }
  if (!questions.length) continue;
  pagesWithFaq++;
  const markup = src.replace(/<script(?![^>]*ld\+json)[^>]*>[\s\S]*?<\/script>/g, '');
  // a fold-out's heading, or a question in an open list (a <dt> whose string key is a FAQ's: any other definition list is not a question)
  const summaries = [...markup.matchAll(/<(summary)\b[^>]*>([\s\S]*?)<\/summary>|<(dt)\b[^>]*data-i18n="[^"]*\.faq\.[^"]*"[^>]*>([\s\S]*?)<\/dt>/g)].map((m) => decode((m[2] ?? m[4]).replace(/<[^>]+>/g, '').trim()));
  const missing = VERBATIM.has(f) ? questions.filter((q) => !summaries.includes(q)) : [];
  const ok = summaries.length >= questions.length && !missing.length;
  if (!ok) fail++;
  record.push({ page: f, questions: questions.length, summaries: summaries.length, missing, ok });
}
if (JSON_OUT) console.log(JSON.stringify(record, null, 2));
else for (const r of record) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.page}: ${r.questions} questions, ${r.summaries} shown${r.missing.length ? ` — not shown: ${r.missing.join(' | ')}` : ''}`);
if (!pagesWithFaq) { console.log('FAIL no page carries FAQPage JSON-LD — the probe read nothing'); process.exit(1); }
if (!record.some((r) => r.page === 'name_tags.html')) { console.log('FAIL name_tags.html carries no FAQPage JSON-LD'); process.exit(1); }
if (!JSON_OUT) console.log(`${record.length - fail}/${record.length} pages show their FAQ`);
process.exit(fail ? 1 : 0);
