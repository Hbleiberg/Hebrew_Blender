#!/usr/bin/env node
/**
 * build-coloring-hub.mjs — build jewish-coloring-pages.html, the one page that lists every coloring page on the site:
 * the alef bet (the Letter Learner's sheets), the 54 parsha pages (parsha/<slug>.html) and the holiday pages
 * (holidays/<slug>.html). It is the landing page for searches like "Jewish coloring pages" and "Hebrew coloring
 * pages", and the page the three sets link up to.
 *
 * Nothing on it is written twice. The letters come from the Letter Learner's own static list (#llSheets in
 * letter_learner.html), the parshiyot from ParashaEmojis.md (scripts/parasha-catalog.mjs), the holidays from
 * HolidayGuide.md (scripts/holiday-catalog.mjs: the ones that have their symbols, as build-holiday-pages.mjs lists
 * them), and each picture's ?v= from the hash its own builder recorded (parsha/img/inputs.json,
 * holidays/img/inputs.json). The chrome (the CSP's shape, the gtag snippet with the cleaned page_location, the
 * no-flash IIFEs, the Google Fonts links, the palette, the header-icons CSS block and the footer's nav) is copied
 * from parsha_emojis.html at build time, as the parsha pages copy it.
 *
 * The page is a root page (every path on it is absolute all the same), has no account wiring and stores nothing. Its
 * inline script owns the dark toggle, applyI18n (the static chrome and the pictures' alt text), the "This week" row
 * (this week's parasha and the next holiday, from js/hebrew-calendar.js, on the Torah Trainer's Diaspora/Israel
 * choice when this device has one, read and never written) and the parsha section's book tabs: one book of the Torah
 * shown at a time, opening on the book being read now.
 *
 * The script fails while a page or picture it would link is missing, or while sitemap.xml does not list the page.
 *
 *   node scripts/build-coloring-hub.mjs           write jewish-coloring-pages.html (and its social card when missing)
 *   node scripts/build-coloring-hub.mjs --og      re-render the social card, jewish-coloring-pages.png, as well
 *   node scripts/build-coloring-hub.mjs --check   write nothing; exit 1 if the page is out of date
 *
 * Run it after build-parsha-pages.mjs or build-holiday-pages.mjs wrote anything, and after the Letter Learner's
 * list of sheets changes. Never edit its output.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { ROOT, readCatalog } from './parasha-catalog.mjs';
import { readHolidayCatalog } from './holiday-catalog.mjs';

const SITE = 'https://ivritsuite.com/';
const OUT = 'jewish-coloring-pages.html';
const OG = 'jewish-coloring-pages.png';
const OG_V = 1;   // bump when the social card is re-rendered (--og), so a shared link refetches it
const SOURCE_PAGE = 'parsha_emojis.html';
const LETTERS_PAGE = 'letter_learner.html';
const CHECK = process.argv.includes('--check');
const RENDER_OG = process.argv.includes('--og');

const die = (msg) => { console.error('build-coloring-hub: ' + msg); process.exit(1); };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unpoint = (he) => he.replace(/[֑-ֽֿ-ׇ]/g, '');
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const slugOf = (en) => en.toLowerCase().replace(/['’]/g, '').replace(/\s+/g, '-');   // build-parsha-pages.mjs's
const listOf = (a) => {                                                             // build-holiday-pages.mjs's
  if (a.length < 2) return a.join('');
  const serial = a.length > 2 && a.slice(-2).some((x) => / and /.test(x));
  return a.slice(0, -1).join(', ') + (serial ? ', and ' : ' and ') + a[a.length - 1];
};
const need = (rel, why) => { if (!existsSync(path.join(ROOT, rel))) die(`${rel} is missing (${why})`); };
function pngSize(rel) {
  const b = readFileSync(path.join(ROOT, rel));
  if (b.toString('latin1', 12, 16) !== 'IHDR') die(`${rel} is not a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

// ── The three sets ───────────────────────────────────────────────────────────────────────────────────────────────
const { icons, problems } = readCatalog();
if (problems.length) die(`ParashaEmojis.md has ${problems.length} problem(s) — run node scripts/build-parasha-icons.mjs to see them.`);
const hol = readHolidayCatalog();
if (hol.problems.length) die(`HolidayGuide.md has ${hol.problems.length} problem(s) — run node scripts/build-holiday-guide.mjs to see them.`);
const holidays = hol.holidays.filter((h) => h.symbols.length);
const parshaHashes = JSON.parse(readFileSync(path.join(ROOT, 'parsha/img/inputs.json'), 'utf8'));
const holidayHashes = JSON.parse(readFileSync(path.join(ROOT, 'holidays/img/inputs.json'), 'utf8'));

const lettersSrc = readFileSync(path.join(ROOT, LETTERS_PAGE), 'utf8');
const lettersUl = lettersSrc.match(/<ul class="ll-sheets-list"[^>]*>([\s\S]*?)<\/ul>/);
if (!lettersUl) die(`${LETTERS_PAGE}: cannot find the list of coloring sheets (.ll-sheets-list)`);
const letters = [...lettersUl[1].matchAll(/<a href="letter_learner\.html\?letter=([a-z_]+)&amp;tab=coloring" data-letter="\1"(?: class="is-final")?><span class="ll-sheets-glyph"[^>]*>([^<]+)<\/span><span class="ll-sheets-name"[^>]*>([^<]+)<\/span><\/a>/g)]
  .map((m) => ({ id: m[1], glyph: m[2], name: m[3] }));
if (letters.length !== (lettersUl[1].match(/<li\b/g) || []).length || letters.length < 22) die(`${LETTERS_PAGE}: read ${letters.length} letters from a list of ${(lettersUl[1].match(/<li\b/g) || []).length} — its markup changed; update the pattern here`);

const BOOKS = [['Genesis', 'genesis'], ['Exodus', 'exodus'], ['Leviticus', 'leviticus'], ['Numbers', 'numbers'], ['Deuteronomy', 'deuteronomy']];
const stray = icons.filter((ic) => !BOOKS.some(([b]) => b === ic.book));
if (stray.length) die(`a parasha's book is none of the five: ${stray.map((ic) => ic.en).join(', ')}`);

const parshaImg = (ic) => `parsha/img/${slugOf(ic.en)}-coloring-page.png`;
const holidayImg = (h) => `holidays/img/${h.slug}-coloring-page.png`;
for (const ic of icons) { need(`parsha/${slugOf(ic.en)}.html`, 'run node scripts/build-parsha-pages.mjs'); need(parshaImg(ic), 'run node scripts/build-parsha-pages.mjs'); }
for (const h of holidays) { need(`holidays/${h.slug}.html`, 'run node scripts/build-holiday-pages.mjs'); need(holidayImg(h), 'run node scripts/build-holiday-pages.mjs'); }
if (!readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').includes(`<loc>${SITE}${OUT}</loc>`)) die(`sitemap.xml does not list ${SITE}${OUT} — add its <url> beside the other tools'`);

// ── What parsha_emojis.html already carries, copied so the page can never drift from the suite's chrome ───────────
const src = readFileSync(path.join(ROOT, SOURCE_PAGE), 'utf8');
function cut(re, what) { const m = src.match(re); if (!m) die(`${SOURCE_PAGE}: cannot find ${what}`); return m[0]; }
const GTAG = cut(/<!-- Google tag \(gtag\.js\) -->\n<script async[^\n]*<\/script>\n<script>[\s\S]*?<\/script>/, 'the gtag snippet');
const FONTS = cut(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n<link rel="preconnect"[^\n]*\n<link href="https:\/\/fonts\.googleapis\.com[^\n]*\n<noscript>[^\n]*<\/noscript>/, 'the Google Fonts links');
const DARK_IIFE = cut(/<script>\(function\(\)\{try\{var s=localStorage\.getItem\('hebrewBlender_darkMode'\)[^\n]*<\/script>/, 'the no-flash dark IIFE');
const LANG_IIFE = cut(/<script>\n  \/\* No-flash UI-language IIFE[\s\S]*?<\/script>/, 'the no-flash language IIFE');
const ROOT_VARS = cut(/:root \{\n[\s\S]*?\n\}\nhtml\.dark-early body,body\.dark \{\n[\s\S]*?\n\}/, 'the palette');
const ICONS_CSS = cut(/\/\* ═══ header-icons CSS ═══[\s\S]*?\/\* ═══ end header-icons CSS ═══ \*\//, 'the header-icons CSS block');
const SVG_ARROW = cut(/<svg class="hi hi-arrow dir-arrow"[\s\S]*?<\/svg>/, 'the hi-arrow icon');
const SVG_MOON = cut(/<svg class="hi hi-moon"[\s\S]*?<\/svg>/, 'the hi-moon icon');
const SVG_SUN = cut(/<svg class="hi hi-sun"[\s\S]*?<\/svg>/, 'the hi-sun icon');
const SVG_PRINT = cut(/<svg class="hi hi-sm hi-print"[\s\S]*?<\/svg>/, 'the hi-print icon');
const NAV_UL = cut(/<nav aria-label="Related Hebrew Tools"[\s\S]*?<\/nav>/, 'the Related Hebrew Tools nav')
  .replace(/href="(?!https?:|\/)([^"]+)"/g, 'href="/$1"')
  .replace(/\n\s*<li><a href="\/jewish-coloring-pages\.html"[^\n]*/, '')   // this page does not list itself
  .replace('<li><a href="/torah_trainer.html"', '<li><a href="/parsha_emojis.html" style="font-size:0.8rem;" data-i18n="shared.nav.link_parshaemojis">parsha emojis and coloring pages →</a></li>\n      <li><a href="/torah_trainer.html"');
const SOCIAL = cut(/<!-- IvritSuite on social media;[^\n]*-->\n\s*<div class="footer-social"[\s\S]*?<\/div>/, 'the footer\'s social links');
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://www.googletagmanager.com https://*.google-analytics.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'";

const CSS = `@font-face{font-family:'Frank Ruhl Libre';src:url('/fonts/FrankRuhlLibre-Regular.ttf') format('truetype');font-weight:400;font-display:swap;}
@font-face{font-family:'IvritSuite Taamim';src:url('/fonts/NotoSerifHebrew-Taamim.ttf') format('truetype');font-weight:400;font-display:swap;}
${ROOT_VARS}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
[hidden]:not([hidden="until-found"]){display:none !important;}   /* until-found: a book the browser's find-in-page can still open */
body{font-family:'Source Sans 3',sans-serif;background:var(--cream);color:var(--text);min-height:100vh;display:flex;flex-direction:column;line-height:1.5;}
.skip-link{position:absolute;inset-inline-start:8px;top:-48px;z-index:200;background:var(--navy);color:#fff;padding:8px 14px;border-radius:0 0 6px 6px;font-size:0.8rem;font-weight:600;text-decoration:none;}
.skip-link:focus{top:0;outline:2px solid var(--focus-ring);outline-offset:2px;}
header{background:var(--navy);color:#fff;padding:22px 40px;display:flex;align-items:center;gap:16px;border-bottom:4px solid var(--gold);}
body.dark header{background:var(--navy-deep);}
header .brand-title{font-family:'Libre Baskerville',serif;font-size:1.5rem;letter-spacing:0.01em;}
header p{font-size:0.85rem;color:var(--gold-light);margin-top:3px;}
header .hright{margin-inline-start:auto;display:flex;gap:10px;align-items:center;flex-shrink:0;}
.hbtn,.dark-btn{background:none;border:1px solid var(--gold-light);color:var(--gold-light);border-radius:6px;padding:5px 14px;font-size:0.8rem;cursor:pointer;font-family:'Source Sans 3',sans-serif;text-decoration:none;min-height:30px;display:inline-flex;align-items:center;gap:6px;justify-content:center;}
.hbtn:hover,.dark-btn:hover{background:rgba(255,255,255,0.1);}
main{flex:1;width:100%;max-width:1120px;margin:0 auto;padding:22px 24px 56px;}
main:focus{outline:none;}
a{color:var(--gold-text);}
a:hover{color:var(--gold-text-hover);}
a:focus-visible,button:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px;}
.ch-crumbs ol{list-style:none;display:flex;flex-wrap:wrap;gap:4px 8px;font-size:0.85rem;color:var(--muted);}
.ch-crumbs li+li::before{content:'›';margin-inline-end:8px;color:var(--muted);}
.ch-crumbs a{display:inline-block;padding-block:3px;text-decoration:none;font-weight:600;}
.ch-title{margin:12px 0 8px;font-family:'Libre Baskerville',serif;font-size:2rem;line-height:1.25;color:var(--text);}
.ch-lead{font-size:1.08rem;max-width:68ch;}
.ch-jump ul{list-style:none;display:flex;flex-wrap:wrap;gap:10px;margin-block-start:16px;}
.ch-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:9px 18px;border-radius:999px;border:1px solid var(--border);background:var(--white);color:var(--text);font-weight:700;font-size:0.95rem;text-decoration:none;}
.ch-btn:hover{border-color:var(--gold);color:var(--text);}
.ch-btn .hi{width:16px;height:16px;}
.ch-sec{margin-block-start:38px;scroll-margin-top:12px;}
.ch-sec h2{font-family:'Libre Baskerville',serif;font-size:1.45rem;color:var(--navy);padding-block-end:6px;border-block-end:1px solid var(--border);margin-block-end:10px;}
body.dark .ch-sec h2{color:var(--gold-light);}
.ch-sec h3{font-family:'Libre Baskerville',serif;font-size:1.05rem;color:var(--navy);margin-block:22px 10px;}
body.dark .ch-sec h3{color:var(--gold-light);}
.ch-intro{max-width:72ch;}
.ch-cta{margin-block-start:18px;}
/* The parsha section shows one book at a time: five tabs, each over its book's pictures. The book's own heading is
   for paper and for a browser without scripts (both show all five books), so on screen the tab is the name. */
.ch-books{display:flex;flex-wrap:wrap;gap:8px;margin-block-start:16px;}
.ch-book-tab{min-height:42px;padding:8px 18px;border-radius:999px;border:1px solid var(--border);background:var(--white);color:var(--text);font-family:'Source Sans 3',sans-serif;font-weight:700;font-size:0.95rem;line-height:1.2;cursor:pointer;}
.ch-book-tab:hover{border-color:var(--gold);}
.ch-book-tab[aria-selected="true"]{background:var(--navy);border-color:var(--navy);color:#fff;}
html.dark-early .ch-book-tab[aria-selected="true"],body.dark .ch-book-tab[aria-selected="true"]{background:var(--gold);border-color:var(--gold);color:var(--navy-deep);}
html[lang="he"] .ch-book-tab{font-size:1.02rem;}
.ch-book h3{display:none;}
/* The pictures: every sheet at its own shape (the parsha and holiday sheets are portrait), names under it, the
   Hebrew first in the Hebrew UI. */
.ch-grid{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px 14px;margin-block-start:14px;}
.ch-card{display:flex;flex-direction:column;gap:6px;height:100%;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--white);color:var(--text);text-decoration:none;}
.ch-card:hover{border-color:var(--gold);color:var(--text);}
.ch-card img{display:block;width:100%;height:auto;background:#fff;border:1px solid var(--border);border-radius:4px;}
.ch-name{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:0 8px;font-weight:700;font-size:0.95rem;line-height:1.3;}
.ch-name [lang="he"]{font-family:var(--heb-font);font-weight:400;font-size:1.08rem;color:var(--muted);}
html[lang="he"] .ch-name [lang="he"]{order:-1;color:var(--text);}
html[lang="he"] .ch-name [lang="en"]{color:var(--muted);font-weight:400;}
/* This week: the same cards, each under a line saying why it is here. */
.ch-now{margin-block-start:26px;padding:14px 16px 16px;border:1px solid var(--border);border-inline-start:4px solid var(--gold);border-radius:8px;background:var(--white);}
.ch-now h2{font-family:'Libre Baskerville',serif;font-size:1.15rem;color:var(--navy);}
body.dark .ch-now h2{color:var(--gold-light);}
.ch-now ul{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,190px));gap:14px;margin-block-start:10px;}
.ch-now li{display:flex;flex-direction:column;gap:5px;}
.ch-now-label{font-size:0.82rem;font-weight:700;color:var(--muted);}
/* The letters: each tile is the letter in outline, as its sheet draws it. The list is the alef-bet, so it runs right
   to left in both UIs (the Letter Learner's own list does). */
.ch-lead-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,380px);gap:22px;align-items:center;}
.ch-lead-row img{display:block;width:100%;height:auto;border:1px solid var(--border);border-radius:8px;}
.ch-letters{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:10px;margin-block-start:16px;}
.ch-letter{display:flex;flex-direction:column;align-items:center;gap:2px;height:100%;padding:8px 4px 9px;border:1px solid var(--border);border-radius:8px;background:var(--white);color:var(--text);text-decoration:none;}
.ch-letter:hover{border-color:var(--gold);color:var(--text);}
.ch-glyph{font-family:var(--heb-font);font-size:2.9rem;line-height:1.25;color:transparent;-webkit-text-stroke:1.4px var(--text);}
.ch-letter-name{font-size:0.82rem;font-weight:700;text-align:center;line-height:1.2;}
.ch-faq dt{font-weight:700;margin-block-start:14px;}
.ch-faq dd{max-width:72ch;}
.dir-arrow{display:inline-block;}
[dir="rtl"] .dir-arrow{transform:scaleX(-1);}
footer{text-align:center;padding:16px;font-size:0.75rem;color:var(--muted);border-top:1px solid var(--border);background:var(--white);}
footer a{color:var(--gold-text);text-decoration:none;display:inline-block;padding-block:5px;}
footer a:hover{text-decoration:underline;}
html[lang="he"] footer [style*="letter-spacing:0.08em"]{letter-spacing:normal !important;text-transform:none !important;}
@media (max-width:760px){
  .ch-lead-row{grid-template-columns:1fr;}
  .ch-lead-row img{max-width:440px;}
}
/* The header's title row (docs/reference/shared-components.md → Header lockup): the parsha pages' rule, whose title
   and tagline are this page's size. Re-measure whenever the title, the tagline or a header control changes width. */
@media (max-width:809px), (pointer:coarse) and (max-width:819px){
  header{flex-wrap:wrap;row-gap:8px;}
  header > .brand-lockup + *{flex-basis:calc(100% - var(--bl-row));}
}
@media (max-width:640px){
  header{padding:16px 20px;flex-wrap:wrap;}
  header .brand-title{font-size:1.2rem;}
  header .hright{flex-wrap:wrap;max-width:100%;justify-content:flex-end;}
  main{padding:16px 14px 44px;}
  .ch-title{font-size:1.5rem;}
  .ch-grid{grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:12px 10px;}
  .ch-book-tab{flex:1 1 auto;padding-inline:12px;}
  .ch-letters{grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px;}
  .ch-glyph{font-size:2.4rem;}
}
/* Paper: the list itself, without the chrome (each page's own Print button prints its sheet). */
@media print{
  header,footer,.skip-link,.ch-crumbs,.ch-jump,.ch-now,.ch-cta,.ch-books,#pwaInstallBanner{display:none !important;}
  body,body.dark,html.dark-early body{background:#fff !important;}
  main{max-width:none;padding:0;}
  .ch-book,.ch-book[hidden]{display:block !important;content-visibility:visible !important;}   /* all five books */
  .ch-book h3{display:block;}
  .ch-card,.ch-letter{break-inside:avoid;}
}
${ICONS_CSS}`;

// ── The page's own script (inline: the CSP allows it, as on every root page) ────────────────────────────────────
const SCRIPT = `'use strict';
(function () {
  function t(key, fallback, params) {
    if (window.I18n && I18n.has && I18n.has(key)) return I18n.t(key, params);
    return String(fallback).replace(/\\{(\\w+)\\}/g, function (m, k) { return params && k in params ? params[k] : m; });
  }
  function lang() { return (window.I18n && I18n.lang) || document.documentElement.lang || 'en'; }

  // The Torah Trainer's Diaspora/Israel choice, when this device has one (read, never written).
  function israel() {
    try {
      var raw = localStorage.getItem('hebrewTorahTrainer_settings');
      var s = raw ? JSON.parse(raw, function (k, v) { return (k === '__proto__' || k === 'constructor' || k === 'prototype') ? undefined : v; }) : null;
      return !!(s && typeof s === 'object' && s.schedule === 'israel');
    } catch (e) { return false; }
  }

  // The parasha read this Shabbat, as its zero-based numbers (two when two are read together); stepped: a festival's
  // portion takes this Shabbat's place, so these are the next one's.
  function weekParsha() {
    if (!window.HebCal) return null;
    try {
      var isr = israel(), r = HebCal.parshaForDate(new Date(), { israel: isr }), stepped = false;
      for (var k = 0; r && r.kind !== 'parsha' && k < 4; k++) {
        stepped = true;
        var d = new Date(r.date.getTime()); d.setDate(d.getDate() + 1);
        r = HebCal.parshaForDate(d, { israel: isr });
      }
      if (r && r.kind === 'parsha' && Array.isArray(r.idx) && r.idx.length) return { idx: r.idx, stepped: stepped };
    } catch (e) {}
    return null;
  }

  // This week's parasha and the holiday under way or coming next: copies of their cards, each under its label.
  function renderNow() {
    var box = document.getElementById('chNow'), list = document.getElementById('chNowList');
    if (!box || !list) return;
    list.textContent = '';
    if (!window.HebCal) { box.hidden = true; return; }
    var items = [], w = weekParsha();
    if (w) w.idx.forEach(function (i) {
      items.push({ sel: '#parsha .ch-card[data-n="' + (i + 1) + '"]',
        label: w.stepped ? t('coloringhub.now.parsha_next', 'The next parsha') : t('coloringhub.now.parsha', 'This week\\'s parsha') });
    });
    try {
      var h = HebCal.nextHoliday(new Date(), { israel: israel() });
      if (h && h.key) items.push({ sel: '#holidays .ch-card[data-key="' + h.key + '"]',
        label: h.state === 'before' ? t('coloringhub.now.holiday_next', 'The next holiday') : t('coloringhub.now.holiday_now', 'The holiday now') });
    } catch (e) {}
    items.forEach(function (it) {
      var card = document.querySelector(it.sel);
      if (!card) return;
      var li = document.createElement('li'), lab = document.createElement('span'), a = card.cloneNode(true);
      lab.className = 'ch-now-label';
      lab.textContent = it.label;
      var img = a.querySelector('img');
      if (img) img.loading = 'eager';
      li.appendChild(lab); li.appendChild(a);
      list.appendChild(li);
    });
    box.hidden = !list.children.length;
  }

  // The parsha section shows one book at a time (the page ships with the first book open and the rest hidden). A
  // first visit opens the book being read now; a chosen book rides history.state, so Back from a parsha page returns
  // to the book it was opened from. Where the browser can, a hidden book stays open to find-in-page (until-found):
  // a search for a parasha's name opens its book.
  var CAN_FIND = 'onbeforematch' in document.documentElement;
  function bookTabs() { return [].slice.call(document.querySelectorAll('.ch-book-tab')); }
  function bookPanels() { return [].slice.call(document.querySelectorAll('.ch-book')); }
  function selectBook(key, remember) {
    var panels = bookPanels();
    if (!panels.some(function (p) { return p.dataset.book === key; })) return false;
    bookTabs().forEach(function (b) {
      var on = b.dataset.book === key;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) {
      if (p.dataset.book === key) p.removeAttribute('hidden');
      else p.setAttribute('hidden', CAN_FIND ? 'until-found' : '');
    });
    if (remember) { try { history.replaceState({ chBook: key }, ''); } catch (e) {} }
    return true;
  }
  function initBooks() {
    var tabs = bookTabs();
    if (!tabs.length) return;
    var list = tabs[0].parentNode;
    tabs.forEach(function (b) { b.addEventListener('click', function () { selectBook(b.dataset.book, true); }); });
    // Arrow keys walk the tabs the way they lie on the screen (right to left in the Hebrew UI); Home and End jump.
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement), n = tabs.length, j;
      if (i < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var forward = (e.key === 'ArrowRight') !== (getComputedStyle(list).direction === 'rtl');
        j = (i + (forward ? 1 : n - 1)) % n;
      } else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = n - 1;
      else return;
      e.preventDefault();
      tabs[j].focus();
      selectBook(tabs[j].dataset.book, true);
    });
    bookPanels().forEach(function (p) {
      p.addEventListener('beforematch', function () { selectBook(p.dataset.book, true); });
    });
    var st = null;
    try { st = history.state; } catch (e) {}
    if (st && typeof st === 'object' && typeof st.chBook === 'string' && selectBook(st.chBook, false)) return;
    var w = weekParsha(), card = w && document.querySelector('#parsha .ch-card[data-n="' + (w.idx[0] + 1) + '"]');
    var panel = card && card.closest('.ch-book');
    selectBook(panel ? panel.dataset.book : tabs[0].dataset.book, false);
  }

  // A picture's alt in the UI's language: the page's kind and name, and in English what the picture shows.
  function altAll() {
    var he = lang() === 'he';
    document.querySelectorAll('.ch-card').forEach(function (a) {
      var img = a.querySelector('img');
      if (!img) return;
      var name = he && a.dataset.he ? a.dataset.he : a.dataset.en;
      var lead = a.dataset.key ? t('holidaypage.img_alt', '{name} coloring page', { name: name })
                               : t('parshapage.img_alt', 'Parshat {name} coloring page', { name: name });
      img.alt = lead + (he || !img.dataset.altEn ? '' : ': ' + img.dataset.altEn);
    });
    var sheets = document.getElementById('chAlefImg');
    if (sheets) sheets.alt = t('letterlearner.sheets.img_alt', sheets.alt);
  }

  function applyI18n() {
    if (!window.I18n) return;
    I18n.applyStaticI18n();
    renderNow();
    altAll();
    syncDarkLabel();
  }

  function syncDarkLabel() {
    var b = document.getElementById('darkBtn');
    if (!b) return;
    var dark = document.body.classList.contains('dark');
    var lbl = b.querySelector('.hi-lbl');
    if (lbl) lbl.textContent = dark ? t('shared.darkmode.label_light', 'Light') : t('shared.darkmode.label_dark', 'Dark');
    b.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }
  function toggleDark() {
    var dark = document.body.classList.toggle('dark');
    document.documentElement.classList.remove('dark-early');
    try { localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); } catch (e) {}
    syncDarkLabel();
  }

  document.addEventListener('DOMContentLoaded', function () {
    try {
      var s = localStorage.getItem('hebrewBlender_darkMode');
      if (s === '1' || (s === null && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)) document.body.classList.add('dark');
    } catch (e) {}
    var b = document.getElementById('darkBtn');
    if (b) b.addEventListener('click', toggleDark);
    syncDarkLabel();
    initBooks();
    renderNow();   // English before the locale arrives; applyI18n re-says it in the UI's language
    if (window.I18n) { I18n.ready.then(applyI18n); I18n.onChange(applyI18n); }
  });
})();`;

// ── The page ─────────────────────────────────────────────────────────────────────────────────────────────────────
const TITLE = 'Free Printable Jewish & Hebrew Coloring Pages | IvritSuite';
const DESC = `IvritSuite's free printable Jewish coloring pages: the Hebrew alef bet, all ${icons.length} weekly Torah portions and the Jewish holidays, each named in Hebrew and English.`;
const OG_TITLE = 'Jewish & Hebrew Coloring Pages — Free Printables';
const OG_ALT = 'Three printable Jewish coloring pages: Parshat Noach, the Hebrew letter Alef and Chanukah';
const URL_ = SITE + OUT;
const FAQ = [
  ['Are these Jewish coloring pages free?',
    'Yes. Every page is free to print and to copy for a class, a Hebrew school, a synagogue or your family, under CC BY-NC-SA 4.0. There are no ads and nothing to sign up for.'],
  ['What Hebrew coloring pages are there?',
    `Three sets. The alef bet has a page for every Hebrew letter, in block print or cursive. The weekly parsha has a page for each of the ${icons.length} Torah portions. The Jewish holidays have six symbols to color for every holiday, and for Shabbat and Havdalah.`],
  ['Can I choose the paper size and the language?',
    'Yes. Print opens a page with its options: Letter or A4 paper, and outlines to color or already colored in. The parsha pages print their text in English or Hebrew, the holiday pages label each symbol in Hebrew or English, with or without vowels, and the alef bet pages come in block print or Israeli cursive.'],
  ['What ages are the pages for?',
    'Preschool through the early elementary grades: Jewish preschools and kindergartens, first and second grade, Hebrew school and Sunday school, and families at home.'],
  ['Is there a coloring page for this week\'s parsha?',
    'Yes. This page shows this week\'s Torah portion and the next holiday first, and every parasha has a page of its own that says when it is next read.'],
];
const KEYWORDS = ['Jewish coloring pages', 'Hebrew coloring pages', 'alef bet coloring pages', 'aleph bet coloring pages', 'Hebrew alphabet coloring pages',
  'parsha coloring pages', 'parasha coloring pages', 'Torah portion coloring pages', 'Jewish holiday coloring pages', 'Chanukah coloring pages',
  'Hanukkah coloring pages', 'Purim coloring pages', 'Passover coloring pages', 'Rosh Hashanah coloring pages', 'Shabbat coloring pages',
  'free printable Jewish coloring sheets', 'Hebrew school', 'Jewish preschool', 'Jewish education'].join(', ');

function page() {
  const [OG_W, OG_H] = existsSync(path.join(ROOT, OG)) ? pngSize(OG) : [1200, 630];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'IvritSuite', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Jewish Coloring Pages', item: URL_ }] },
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Jewish and Hebrew Coloring Pages', url: URL_,
      description: `Free printable Jewish and Hebrew coloring pages in three sets: an alef bet coloring page for every Hebrew letter (the letter in outline beside four illustrated words, in block print or Israeli cursive), a parsha coloring page for each of the ${icons.length} weekly Torah portions (one picture that carries the parasha's story, with its names, verses and a short summary), and Jewish holiday coloring pages with six symbols for each of ${holidays.length - 2} holidays and for Shabbat and Havdalah, each named in Hebrew and English. The page shows this week's parasha and the next holiday first.`,
      image: SITE + OG, inLanguage: ['en', 'he'], isAccessibleForFree: true, keywords: KEYWORDS,
      license: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      audience: { '@type': 'EducationalAudience', educationalRole: 'teacher' },
      author: { '@type': 'Person', name: 'Harrison Bleiberg' },
      publisher: { '@type': 'Organization', name: 'IvritSuite', url: SITE },
      mainEntity: { '@type': 'ItemList', numberOfItems: 3, itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Alef bet coloring pages', url: SITE + 'letter_learner.html',
          description: `${letters.length} coloring pages, one for every Hebrew letter and final form.` },
        { '@type': 'ListItem', position: 2, name: 'Parsha coloring pages', url: SITE + 'parsha_emojis.html',
          description: `${icons.length} coloring pages, one for every weekly Torah portion.` },
        { '@type': 'ListItem', position: 3, name: 'Jewish holiday coloring pages', url: SITE + 'holiday_guide.html',
          description: `${holidays.length} coloring pages: the Jewish holidays of the year, Shabbat and Havdalah.` }] } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => (
      { '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  const ldScripts = ld.map((o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`).join('\n');

  const letterLi = (l) => `        <li><a class="ch-letter" href="/letter_learner.html?letter=${l.id}&amp;tab=coloring"><span class="ch-glyph" lang="he" dir="rtl" aria-hidden="true">${l.glyph}</span><span class="ch-letter-name" lang="en" dir="ltr">${l.name}</span></a></li>`;
  const names = (en, he) => `<span class="ch-name"><span lang="en" dir="ltr">${esc(en)}</span><span lang="he" dir="rtl">${esc(he)}</span></span>`;
  const parshaLi = (ic) => {
    const rel = parshaImg(ic), [w, h] = pngSize(rel), v = (parshaHashes[slugOf(ic.en)] || '').slice(0, 8);
    if (!v) die(`parsha/img/inputs.json has no hash for ${slugOf(ic.en)} — run node scripts/build-parsha-pages.mjs`);
    return `          <li><a class="ch-card" href="/parsha/${slugOf(ic.en)}.html" data-n="${ic.n}" data-en="${esc(ic.en)}" data-he="${esc(unpoint(ic.he))}"><img src="/${rel}?v=${v}" width="${w}" height="${h}" loading="lazy" decoding="async" alt="${esc(`Parshat ${ic.en} coloring page: ${lowerFirst(ic.alt)}`)}" data-alt-en="${esc(lowerFirst(ic.alt))}">${names(ic.en, ic.he)}</a></li>`;
  };
  const holidayLi = (h) => {
    const rel = holidayImg(h), [w, hh] = pngSize(rel), v = (holidayHashes[h.slug] || '').slice(0, 8);
    if (!v) die(`holidays/img/inputs.json has no hash for ${h.slug} — run node scripts/build-holiday-pages.mjs`);
    const tail = `${listOf(h.symbols.map((s) => s.en))} to color`;
    return `        <li><a class="ch-card" href="/holidays/${h.slug}.html" data-key="${esc(h.key)}" data-en="${esc(h.en)}" data-he="${esc(h.plain)}"><img src="/${rel}?v=${v}" width="${w}" height="${hh}" loading="lazy" decoding="async" alt="${esc(`${h.en} coloring page: ${tail}`)}" data-alt-en="${esc(tail)}">${names(h.en, h.he)}</a></li>`;
  };
  const faqHtml = FAQ.map(([q, a], i) => `      <dt data-i18n="coloringhub.faq.q${i + 1}">${esc(q)}</dt>\n      <dd data-i18n="coloringhub.faq.a${i + 1}">${esc(a)}</dd>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<!-- GENERATED by scripts/build-coloring-hub.mjs from letter_learner.html's list of sheets, ParashaEmojis.md and
     HolidayGuide.md — re-run the script; never edit this file. Content-Security-Policy right after <meta charset>, as
     on every page: everything is same-origin but Google Fonts and gtag (no data fetch, no account wiring). -->
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=3">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3">
<link rel="manifest" href="/manifest.webmanifest?v=3">
<meta name="theme-color" content="#1a2744">
<script src="/pwa.js" defer></script>
<script src="/js/i18n.js" defer></script>
<script src="/js/hebrew-calendar.js" defer></script>
${GTAG}
<title>${esc(TITLE)}</title>
<meta name="description" content="${esc(DESC)}">
<link rel="canonical" href="${URL_}">
<meta name="robots" content="index, follow">
<meta name="author" content="Harrison Bleiberg">
<meta property="og:type" content="website">
<meta property="og:site_name" content="IvritSuite">
<meta property="og:title" content="${esc(OG_TITLE)}">
<meta property="og:description" content="${esc(DESC)}">
<meta property="og:url" content="${URL_}">
<meta property="og:image" content="${SITE}${OG}?v=${OG_V}">
<meta property="og:image:width" content="${OG_W}">
<meta property="og:image:height" content="${OG_H}">
<meta property="og:image:alt" content="${esc(OG_ALT)}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(OG_TITLE)}">
<meta name="twitter:description" content="${esc(DESC)}">
<meta name="twitter:image" content="${SITE}${OG}?v=${OG_V}">
${ldScripts}
${FONTS}
${DARK_IIFE}
${LANG_IIFE}
<style>
${CSS}
</style>
<noscript><style>.ch-books{display:none;}.ch-book[hidden]{display:block !important;}.ch-book h3{display:block;}</style></noscript>
</head>
<body>
<a class="skip-link" href="#chMain" data-i18n="coloringhub.a11y.skip">Skip to the coloring pages</a>
<header>
  <a class="brand-lockup bl-div" href="/" aria-label="IvritSuite home page" data-i18n-aria-label="shared.header.logo_home"><img class="bl-img bl-screen" src="/brand/ivritsuite-lockup-english-dark.svg" alt="IvritSuite" width="126" height="38"><img class="bl-img bl-print" src="/brand/ivritsuite-lockup-english.svg" alt="" width="126" height="38"></a>
  <div>
    <div class="brand-title" data-i18n="coloringhub.header.title">Jewish Coloring Pages</div>
    <p data-i18n="coloringhub.header.tagline">Free alef bet, parsha and holiday pages to print</p>
  </div>
  <div class="hright" data-nosnippet>
    <a class="hbtn" href="/">${SVG_ARROW}<span class="hi-lbl" data-i18n="coloringhub.header.home">Home</span></a>
    <div data-i18n-switcher></div>
    <button type="button" class="dark-btn" id="darkBtn" aria-pressed="false" aria-label="Toggle dark mode" data-i18n-aria-label="shared.darkmode.toggle_title" data-i18n-title="shared.darkmode.toggle_title">${SVG_MOON}${SVG_SUN}<span class="hi-lbl" data-i18n="shared.darkmode.label_dark">Dark</span></button>
  </div>
</header>

<!-- The letters', parshiyot's and holidays' names are content, not UI strings (i18n-ignore): both languages are on
     the page whatever the UI's. The cards' data attributes (data-n: the parasha's number, data-key: the holiday's
     calendar key, data-en / data-he: its names) are what the script reads for "This week" and the alt text. -->
<main id="chMain" tabindex="-1">
  <nav class="ch-crumbs" aria-label="Breadcrumb" data-i18n-aria-label="coloringhub.crumbs.aria">
    <ol>
      <li><a href="/">IvritSuite</a></li>
      <li aria-current="page" data-i18n="coloringhub.crumbs.here">Coloring pages</li>
    </ol>
  </nav>
  <h1 class="ch-title" data-i18n="coloringhub.title">Jewish and Hebrew Coloring Pages</h1>
  <p class="ch-lead" data-i18n="coloringhub.lead">Free printable Jewish coloring pages for classrooms, Hebrew schools and families: the Hebrew alef bet, every weekly Torah portion and the Jewish holidays. Every page names what it shows in Hebrew and English, prints on Letter or A4 paper, and is free to copy for your class.</p>
  <nav class="ch-jump" aria-label="Jump to a set of coloring pages" data-i18n-aria-label="coloringhub.jump.aria">
    <ul>
      <li><a class="ch-btn" href="#alef-bet" data-i18n="coloringhub.jump.alefbet">Alef bet</a></li>
      <li><a class="ch-btn" href="#parsha" data-i18n="coloringhub.jump.parsha">Parsha</a></li>
      <li><a class="ch-btn" href="#holidays" data-i18n="coloringhub.jump.holidays">Jewish holidays</a></li>
    </ul>
  </nav>

  <section class="ch-now" id="chNow" aria-labelledby="chNowTitle" hidden>
    <h2 id="chNowTitle" data-i18n="coloringhub.now.title">This week</h2>
    <ul id="chNowList"></ul>
  </section>

  <section class="ch-sec" id="alef-bet" aria-labelledby="chAlefTitle">
    <h2 id="chAlefTitle" data-i18n="coloringhub.alefbet.title">Alef bet coloring pages</h2>
    <div class="ch-lead-row">
      <p class="ch-intro" data-i18n="coloringhub.alefbet.intro">A coloring page for every letter of the Hebrew alphabet, from alef to tav (also spelled aleph bet, alef-bet or aleph beis). Each page has the letter in outline, four illustrated words that begin with it and a line for the child's name, in block print or Israeli cursive. Choose a letter to open its page.</p>
      <img id="chAlefImg" src="/aleph-bet-coloring-sheets.png?v=1" width="1200" height="630" loading="lazy" decoding="async" alt="Three printable aleph bet coloring sheets: Alef, Bet and Gimel, each letter in outline beside four illustrated words to color">
    </div>
    <ul class="ch-letters" dir="rtl" aria-label="Alef bet coloring pages by letter" data-i18n-aria-label="coloringhub.alefbet.list_aria">
${letters.map(letterLi).join('\n')}
    </ul>
    <p class="ch-cta"><a class="ch-btn" href="/letter_learner.html#llSheets">${SVG_PRINT}<span data-i18n="coloringhub.alefbet.cta">Print the whole alef bet in the Letter Learner</span></a></p>
  </section>

  <section class="ch-sec" id="parsha" aria-labelledby="chParshaTitle">
    <h2 id="chParshaTitle" data-i18n="coloringhub.parsha.title">Parsha coloring pages</h2>
    <p class="ch-intro" data-i18n="coloringhub.parsha.intro">A coloring page for each of the ${icons.length} weekly Torah portions (the parasha, also spelled parsha or parshah). Each one is a single picture that carries the parasha's story, with its Hebrew and English names, its verses and a one-sentence summary. Choose a book of the Torah to see its parshiyot.</p>
    <div class="ch-books" role="tablist" aria-label="Books of the Torah" data-i18n-aria-label="coloringhub.parsha.books_aria">
${BOOKS.map(([book, key], i) => `      <button type="button" class="ch-book-tab" role="tab" id="chTab-${key}" data-book="${key}" aria-controls="chBook-${key}" aria-selected="${i ? 'false' : 'true'}"${i ? ' tabindex="-1"' : ''} data-i18n="torah.custom.book_${key}">${book}</button>`).join('\n')}
    </div>
${BOOKS.map(([book, key], i) => `    <div class="ch-book" role="tabpanel" id="chBook-${key}" data-book="${key}" aria-labelledby="chTab-${key}"${i ? ' hidden' : ''}>
      <h3 data-i18n="torah.custom.book_${key}">${book}</h3>
      <ul class="ch-grid">
${icons.filter((ic) => ic.book === book).map(parshaLi).join('\n')}
      </ul>
    </div>`).join('\n')}
    <p class="ch-cta"><a class="ch-btn" href="/parsha_emojis.html#etSheets">${SVG_PRINT}<span data-i18n="coloringhub.parsha.cta">Print several parshiyot at once in Parsha Emojis</span></a></p>
  </section>

  <section class="ch-sec" id="holidays" aria-labelledby="chHolTitle">
    <h2 id="chHolTitle" data-i18n="coloringhub.holidays.title">Jewish holiday coloring pages</h2>
    <p class="ch-intro" data-i18n="coloringhub.holidays.intro">A coloring page for every Jewish holiday of the year, from Rosh Hashanah and Chanukah (Hanukkah) to Purim, Pesach (Passover) and Shavuot, and for Shabbat and Havdalah. Each page has six symbols of the holiday to color, each named in Hebrew and English.</p>
    <ul class="ch-grid">
${holidays.map(holidayLi).join('\n')}
    </ul>
    <p class="ch-cta"><a class="ch-btn" href="/holiday_guide.html">${SVG_PRINT}<span data-i18n="coloringhub.holidays.cta">Choose the symbols yourself in the Holiday Guide</span></a></p>
  </section>

  <section class="ch-sec ch-faq" id="faq" aria-labelledby="chFaqTitle">
    <h2 id="chFaqTitle" data-i18n="coloringhub.faq.title">Questions and answers</h2>
    <dl>
${faqHtml}
    </dl>
  </section>
</main>

<footer>
  <!-- pinned-English credits (never translated): dir="ltr" keeps each phrase in English order in the RTL UI, and lang="en" has a screen reader voice it in English -->
  <span dir="ltr" lang="en">Created by <a href="https://harrisonbleiberg.wpcomstaging.com/" target="_blank" style="font-weight:600;">Harrison Bleiberg</a></span><br>
  <span data-i18n="shared.footer.license_note">Free to use and adapt for non-commercial educational purposes with attribution</span> &nbsp;·&nbsp;
  <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">CC BY-NC-SA 4.0</a> &nbsp;·&nbsp;
  <a href="https://github.com/hbleiberg/Hebrew_Blender" target="_blank">GitHub</a> &nbsp;·&nbsp;
  <a href="/privacy.html" data-i18n="shared.footer.privacy_link">Privacy Policy</a> &nbsp;·&nbsp;
  <a href="/terms.html" data-i18n="shared.footer.terms_link">Terms of Use</a>
  ${NAV_UL}
  ${SOCIAL}
</footer>
<script>
${SCRIPT}
</script>
</body>
</html>
`;
}

// ── The social card: one sheet of each set, as the three sets' own cards show three of theirs ───────────────────
async function renderOg() {
  let chromium;
  try { const m = await import('/opt/node22/lib/node_modules/playwright/index.js'); chromium = (m.default || m).chromium; }
  catch (e) { try { const m = await import('playwright'); chromium = (m.default || m).chromium; } catch (e2) { die('Playwright is not available: the social card cannot be rendered here (docs/reference/ops.md)'); } }
  const PORT = 8000 + Math.floor(Math.random() * 900);
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 900));
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, serviceWorkers: 'block', colorScheme: 'light' });
    const pg = await ctx.newPage();
    await pg.route('**/*', (r) => (r.request().url().startsWith(`http://127.0.0.1:${PORT}/`) ? r.continue() : r.abort()));
    await pg.goto(`http://127.0.0.1:${PORT}/robots.txt`);   // a same-origin document to compose in
    const base = `http://127.0.0.1:${PORT}/`;
    const shadow = 'box-shadow:0 2px 4px rgba(26,39,68,.10),0 12px 30px rgba(26,39,68,.20);';
    // The middle sheet is the Alef sheet of the Letter Learner's own card (its middle sheet, cut out of that picture).
    await pg.setContent(`<body style="margin:0;width:1200px;height:630px;overflow:hidden;position:relative;background:#f5efe0;">
<img src="${base}parsha/img/noach-coloring-page.png" style="position:absolute;left:40px;top:78px;height:474px;width:auto;transform:rotate(-5deg);${shadow}">
<img src="${base}holidays/img/chanukah-coloring-page.png" style="position:absolute;right:40px;top:78px;height:474px;width:auto;transform:rotate(5deg);${shadow}">
<div style="position:absolute;left:340px;top:119px;width:520px;height:392px;background:#fff url(${base}aleph-bet-coloring-sheets.png) -263.5px -82.9px / 1047px 549.7px no-repeat;${shadow}"></div>
</body>`, { waitUntil: 'load' });
    await pg.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    const out = path.join(ROOT, OG);
    await pg.screenshot({ path: out });
    if (spawnSync('python3', ['-I', '-c', 'import PIL'], { stdio: 'ignore' }).status === 0) {
      const q = spawnSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\np=sys.argv[1]\nImage.open(p).convert("RGB").quantize(colors=96,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(p,optimize=True)', out]);
      if (q.status !== 0) die(`PIL could not reduce ${OG}: ${q.stderr}`);
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

// ── Write or check ───────────────────────────────────────────────────────────────────────────────────────────────
const ogMissing = !existsSync(path.join(ROOT, OG));
if (!CHECK && (RENDER_OG || ogMissing)) { await renderOg(); console.log(`build-coloring-hub: rendered ${OG}${RENDER_OG && !ogMissing ? ' — bump OG_V here so a shared link refetches it' : ''}.`); }
const text = page(), outPath = path.join(ROOT, OUT);
const stale = !existsSync(outPath) || readFileSync(outPath, 'utf8') !== text;
if (CHECK) {
  if (stale || ogMissing) die(`--check: ${[stale ? OUT : '', ogMissing ? OG : ''].filter(Boolean).join(' and ')} out of date — run node scripts/build-coloring-hub.mjs.`);
  console.log(`build-coloring-hub --check: ${OUT} up to date (${letters.length} letters, ${icons.length} parshiyot, ${holidays.length} holidays).`);
  process.exit(0);
}
if (stale) writeFileSync(outPath, text);
console.log(`build-coloring-hub: ${letters.length} letters, ${icons.length} parshiyot, ${holidays.length} holidays — ${stale ? `wrote ${OUT}: bump VERSION in sw.js` : `${OUT} already current`}.`);
