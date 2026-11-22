#!/usr/bin/env node
/*
 * smoke-tefillah.mjs — the Tefillah Trainer's reading model against fixtures, never against Sefaria:
 * the catalog and every Sefaria answer are served by this script, built from ordinary vocabulary words of
 * data/hebrew_words.json (no liturgical text is typed or stored here). It checks what the page must never get wrong:
 *   - a whole node renders line by line: bold and small print kept as the page's own classes, an unpointed line as an
 *     instruction that is not a line to read, an empty segment skipped, line numbers 1, 2, 3;
 *   - nothing from a text reaches the page as markup (a <script>, an <img onerror> and an inline handler stay inert);
 *   - the Metsudah reading marks are hidden until asked for;
 *   - a line range is shown only while its first and last words are where the catalog says (else nothing is shown);
 *   - a Hebrew text whose licence is unknown, NoDerivatives or missing is refused, also when Sefaria lists it as open
 *     and returns something else, and a pinned edition that is gone is refused;
 *   - a translation divided like the Hebrew shows line against line, one divided differently as a block, and for a
 *     line range not at all; a prayer with no open translation says so;
 *   - a translation the catalog pins to the Hebrew by position shows line against line although it is shorter, a line
 *     of it with no word ("[]") shows nothing, and a pin whose stamped words no longer match, or that was read against
 *     another Hebrew edition than the one on screen, pairs nothing;
 *   - lines the catalog says are Tanakh verses get those verses' translation beside them, in a version the visitor
 *     picks from the open ones, credited to its book; a line that does not open with its verses, a map of the wrong
 *     length or one counted in another Hebrew edition gets none, and only the Book of Psalms may be named;
 *   - a Torah source: verses numbered chapter:verse, trope classes on the verses only, the siddur's added line marked;
 *   - every text on screen is credited with its edition and licence;
 *   - ?prayer= and ?nusach= open only what the catalog lists, and no request ever names anything else;
 *   - an Open Siddur snapshot file: its gendered pairs shown both ways or one, its own licence, contributors and page
 *     credited, a missing file or a closed licence refused, a link it names that is not https opensiddur.org / creativecommons.org dropped;
 *   - a failed request shows the Try again card and no text.
 * Usage: node scripts/smoke-tefillah.mjs [--port 8096]. Needs the preinstalled Playwright + Chromium
 * (docs/reference/ops.md → the headless recipe); starts its own python3 -m http.server and aborts every other origin.
 * Exit 1 on any failure.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { rangeEnds, englishEnds } from './tefillah-sefaria.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const pi = args.indexOf('--port');
const PORT = pi >= 0 ? Number(args[pi + 1]) : 8096;
const BASE = `http://127.0.0.1:${PORT}`;

let chromium;
try { const m = await import('/opt/node22/lib/node_modules/playwright/index.js'); chromium = (m.default || m).chromium; }
catch (e) { try { const m = await import('playwright'); chromium = (m.default || m).chromium; } catch (e2) { console.error('smoke-tefillah: Playwright is not available'); process.exit(1); } }

// ── fixture text: pointed vocabulary words, joined into lines ────────────────────────────────────────
const ch = (n) => String.fromCharCode(n);
const POINT_LO = 0x05B0, POINT_HI = 0x05BC, ALEF = 0x05D0, TAV = 0x05EA;
const isPoint = (c) => { const n = c.charCodeAt(0); return n >= POINT_LO && n <= POINT_HI; };
const isLetter = (c) => { const n = c.charCodeAt(0); return n >= ALEF && n <= TAV; };
const WORDS = Object.values(JSON.parse(readFileSync(path.join(ROOT, 'data/hebrew_words.json'), 'utf8'))).flat()
  .map((w) => String((w && w.word) || ''))
  .filter((w) => [...w].every((c) => isPoint(c) || isLetter(c) || c === ch(0x05C1) || c === ch(0x05C2)) && [...w].filter(isLetter).length >= 3 && [...w].some(isPoint))
  .filter((w, i, a) => a.indexOf(w) === i)
  .slice(0, 100);
if (WORDS.length < 96) { console.error('smoke-tefillah: too few pointed words in data/hebrew_words.json'); process.exit(1); }
const words = (from, n) => WORDS.slice(from, from + n);
const bare = (w) => [...w].filter(isLetter).join('');                 // the same word without its points: an instruction's look
const SHEVA_NA = ch(0x0592), PAUSE = ch(0x05AF);                         // the Metsudah edition's two reading marks
const ETNACHTA = ch(0x0591), TIPCHA = ch(0x0596), MERCHA = ch(0x05A5), SILLUQ = ch(0x05BD), SOF_PASUK = ch(0x05C3);
// A verse-like line: accents after the first letter of some words, a silluq and sof pasuk at the end.
function verse(ws) {
  const mark = (w, m) => [...w][0] + m + [...w].slice(1).join('');
  const mid = Math.floor(ws.length / 2);
  return ws.map((w, i) => (i === mid ? mark(w, ETNACHTA) : i === mid - 1 ? mark(w, TIPCHA) : i === ws.length - 1 ? mark(w, SILLUQ) : i === ws.length - 2 ? mark(w, TIPCHA) : mark(w, MERCHA))).join(' ') + SOF_PASUK;
}

const MET = 'The Metsudah siddur, 1981', OPEN = 'An Open Edition', GONE = 'An Edition That Left';
const EN_A = 'An Aligned Translation', EN_B = 'A Differently Divided Translation', EN_P = 'A Shorter Translation', OTHER = 'Another Open Edition';
const N = (s) => 'Siddur Ashkenaz, Smoke, ' + s;

// Each node: Hebrew editions (title → { license, lines }) and translations. `returns` overrides what an
// edition request really answers with (Sefaria listing one thing and returning another).
const NODES = {};
NODES[N('Plain')] = {
  he: { [MET]: { license: 'CC-BY', lines: [
    `<b>${WORDS[0]}</b> ${WORDS[1].slice(0, 2)}<big>${WORDS[1].slice(2)}</big> ${[...WORDS[2]][0]}${SHEVA_NA}${[...WORDS[2]].slice(1).join('')}${PAUSE} <small>${WORDS[3]}</small><br>${WORDS[4]}`,
    `${bare(WORDS[5])} ${bare(WORDS[6])} <script>window.__xss = 1</script><img src=x onerror="window.__xss = 2">`,
    '',
    `<small>${bare(WORDS[7])}:</small> ${words(8, 4).join(' ')} <span onclick="window.__xss = 3">${WORDS[12]}</span>`,
    words(13, 5).join(' '),
  ] } },
  en: { [EN_A]: { license: 'CC0', lines: ['First <i>line</i> of the fixture.<sup>1</sup>', 'An instruction. <script>window.__xss = 4</script>', '', 'Third line.', 'Fourth line.'] } },
};
NODES[N('Long')] = {
  he: { [MET]: { license: 'CC-BY', lines: [words(20, 4).join(' '), words(24, 5).join(' '), words(29, 4).join(' '), words(33, 4).join(' '), words(37, 3).join(' ')] } },
  en: { [EN_A]: { license: 'Public Domain', lines: ['Long one.', 'Long two.', 'Long three.', 'Long four.', 'Long five.'] } },
};
NODES[N('Unknown')] = { he: { 'A Text Of Unknown Standing': { license: 'unknown', lines: [words(40, 4).join(' ')] } }, en: {} };
NODES[N('NoDerivs')] = { he: { 'A NoDerivatives Text': { license: 'CC-BY-NC-ND', lines: [words(41, 4).join(' ')] } }, en: {} };
NODES[N('Trap')] = { he: { [OPEN]: { license: 'CC0', lines: [words(42, 4).join(' ')], returns: { title: OPEN, license: 'unknown' } } }, en: {} };
NODES[N('Block')] = {
  he: { [OPEN]: { license: 'CC0', lines: [words(44, 4).join(' '), words(48, 4).join(' '), words(52, 4).join(' ')] } },
  en: { [EN_B]: { license: 'CC-BY-SA', lines: ['All of it in one paragraph that is divided unlike the Hebrew.', 'And a second half.'] } },
};
NODES[N('NoEnglish')] = {
  he: { [OPEN]: { license: 'Public Domain', lines: [words(56, 4).join(' ')] } },
  en: { 'A Closed Translation': { license: 'Copyright: Somebody', lines: ['Not to be shown.'] }, 'Eine Übersetzung': { license: 'CC0', actualLanguage: 'de', lines: ['Nicht zeigen.'] } },
};
// A translation that stops early and skips a line: four lines for six of Hebrew, the third a placeholder.
NODES[N('Pinned')] = {
  he: { [OPEN]: { license: 'CC0', lines: [bare(WORDS[80]), words(81, 3).join(' '), words(84, 3).join(' '), words(87, 3).join(' '), words(90, 3).join(' '), words(93, 3).join(' ')] },
        [OTHER]: { license: 'Public Domain', lines: [words(81, 3).join(' '), words(84, 3).join(' ')] } },
  en: { [EN_P]: { license: 'CC0', lines: ['A heading in English', 'Pin two, the <i>second</i> line.', '[]', 'Pin four &mdash; the fourth line.'] } },
};
// Lines that are Tanakh verses: an instruction, verses 1-2 in one line, then verse 3 said twice and verse 4. No English of its own.
const PS = [words(20, 4), words(24, 3), words(27, 4), words(31, 3)];
const JPS = 'The Holy Scriptures: A New Translation (JPS 1917)', PS_B = 'A Second Psalms Translation', PS_CLOSED = 'A Closed Psalms Translation';
NODES[N('Psalm')] = {
  he: { [OPEN]: { license: 'CC0', lines: [bare(WORDS[80]), [...PS[0], ...PS[1]].join(' '), [...PS[2], ...PS[2], ...PS[3]].join(' ')] },
        [OTHER]: { license: 'Public Domain', lines: [[...PS[0], ...PS[1], ...PS[2], ...PS[3]].join(' ')] } },
  en: {},
};
const TANAKH = {
  'Psalms.113': { sections: [113], he: PS.map(verse), ens: {
    [PS_B]: { license: 'CC-BY', text: ['Second one.', 'Second two.', 'Second three.', 'Second four.'] },
    [PS_CLOSED]: { license: 'Copyright: Somebody', text: ['Closed.', 'Closed.', 'Closed.', 'Closed.'] },
    [JPS]: { license: 'Public Domain', text: ['Verse one.', 'Verse two.', 'Verse three.', 'Verse four.'] } } },
  'Deuteronomy.6.4': { sections: [6, 4], he: [verse(words(60, 6))], en: ['A fixture verse.'] },
  'Deuteronomy.6.5-6': { sections: [6, 5], he: [verse(words(66, 5)), verse(words(71, 6))], en: ['Another one.', 'And a third.'] },
};
const TANAKH_HE = { title: 'A Tanakh Edition', license: 'CC-BY-SA' }, TANAKH_EN = { title: 'The Holy Scriptures: A New Translation (JPS 1917)', license: 'Public Domain' };

const ends = (node, a, b) => rangeEnds(NODES[node].he[Object.keys(NODES[node].he)[0]].lines.slice(a - 1, b));
const ranged = (node, a, b, he, extra) => Object.assign({ ref: `${node}:${a === b ? a : a + '-' + b}`, he }, ends(node, a, b), extra || {});
const enPin = (node, title, a, b, extra) => ({ en: Object.assign({ v: title }, extra || {}, englishEnds(NODES[node].en[title].lines.slice(a - 1, b))) });
const P = (key, sources) => ({ key, nameKey: '', en: 'Fixture ' + key, he: '', group: 'smoke', service: ['shacharit'], days: ['weekday'], sources });
const CATALOG = { v: 1, hebrewPreference: ['Metsudah', 'Open'], groups: [{ key: 'smoke', nameKey: '', en: 'Smoke fixtures', he: '' }], prayers: [
  P('plain', { ashkenaz: N('Plain') }),
  P('ranged', { ashkenaz: ranged(N('Long'), 2, 3, MET) }),
  P('moved', { ashkenaz: Object.assign(ranged(N('Long'), 2, 3, MET), { from: bare(WORDS[0]) + ' ' + bare(WORDS[1]) }) }),
  P('past-end', { ashkenaz: Object.assign(ranged(N('Long'), 4, 5, MET), { ref: N('Long') + ':4-9' }) }),
  P('gone', { ashkenaz: ranged(N('Long'), 1, 1, GONE) }),
  P('unknown', { ashkenaz: N('Unknown') }),
  P('noderivs', { ashkenaz: N('NoDerivs') }),
  P('trap', { ashkenaz: N('Trap') }),
  P('block', { ashkenaz: N('Block') }),
  P('hidden-translation', { ashkenaz: ranged(N('Block'), 1, 2, OPEN) }),
  P('no-english', { ashkenaz: N('NoEnglish') }),
  P('pinned', { ashkenaz: ranged(N('Pinned'), 2, 5, OPEN, enPin(N('Pinned'), EN_P, 2, 5)) }),
  P('pinned-moved', { ashkenaz: ranged(N('Pinned'), 2, 5, OPEN, { en: { v: EN_P, from: 'pin two the', to: 'some other words' } }) }),
  P('pinned-whole', { ashkenaz: Object.assign({ ref: N('Pinned') }, enPin(N('Pinned'), EN_P, 1, 6, { he: OPEN })) }),
  P('pinned-other-edition', { ashkenaz: Object.assign({ ref: N('Pinned') }, enPin(N('Pinned'), EN_P, 1, 6, { he: OTHER })) }),
  P('verses', { ashkenaz: ranged(N('Psalm'), 1, 3, OPEN, { verses: { lines: [null, 'Psalms 113:1-2', 'Psalms 113:3-4'] } }) }),
  P('verses-swapped', { ashkenaz: ranged(N('Psalm'), 1, 3, OPEN, { verses: { lines: [null, 'Psalms 113:3-4', 'Psalms 113:1-2'] } }) }),
  P('verses-short', { ashkenaz: ranged(N('Psalm'), 1, 3, OPEN, { verses: { lines: ['Psalms 113:1-2', 'Psalms 113:3-4'] } }) }),
  P('verses-whole', { ashkenaz: { ref: N('Psalm'), verses: { he: OPEN, lines: [null, 'Psalms 113:1-2', 'Psalms 113:3,4'] } } }),
  P('verses-other-edition', { ashkenaz: { ref: N('Psalm'), verses: { he: OTHER, lines: ['Psalms 113:1-4'] } } }),
  P('verses-odd', { ashkenaz: ranged(N('Psalm'), 1, 3, OPEN, { verses: { lines: [null, 'Deuteronomy 6:4', 'Psalms 113:3-4'] } }) }),   // only Psalms may be named: the map is dropped
  P('pinned-odd', { ashkenaz: ranged(N('Pinned'), 2, 5, OPEN, { en: 'A Shorter Translation' }) }),                    // a pin this page cannot read: dropped, the part kept
  P('torah', { ashkenaz: N('Plain'), torah: ['Deuteronomy 6:4', ranged(N('Plain'), 1, 1, MET, { added: true }), 'Deuteronomy 6:5-6'] }),
  P('os', { ashkenaz: N('Plain'), opensiddur: 'os-fixture' }),
  P('os-missing', { opensiddur: 'os-missing' }),
  P('os-closed', { opensiddur: 'os-closed' }),
  P('os-odd', { opensiddur: 'os-odd' }),
  P('not-a-siddur', { ashkenaz: 'Mishnah Berakhot 1:1' }),                       // a ref this page may not ask for: the source is dropped
] };
// Open Siddur snapshot files (data/tefillah/opensiddur/<key>.json), served by this script
const OS_F = WORDS[76], OS_M = WORDS[77];
const OS_FILES = {
  'os-fixture': { key: 'os-fixture', url: 'https://opensiddur.org/fixture/', title: 'A fixture page', contributors: ['First Contributor', 'Second Contributor'], license: 'CC BY-SA', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', retrieved: '2026-01-01',
    he: [`${OS_F}|${OS_M}, ${WORDS[78]}`, words(72, 3).join(' ')], en: ['Fixture one.', 'Fixture two.'], variants: true, variantOrder: 'fm' },
  'os-closed': { key: 'os-closed', url: 'https://opensiddur.org/fixture/', title: 'Closed', contributors: ['Someone'], license: 'CC BY-NC-ND', he: [words(72, 3).join(' ')], variants: false },
  'os-odd': { key: 'os-odd', url: 'https://evil.invalid/steal', title: '<img src=x onerror="window.__xss = 5">', contributors: ['<b onclick="window.__xss = 6">Someone</b>'], license: 'CC0', licenseUrl: 'javascript:window.__xss=7', he: [words(72, 3).join(' ')], variants: false },
};
const KNOWN_REFS = new Set([...Object.keys(NODES), ...Object.keys(TANAKH)]);

// ── the fake Sefaria ─────────────────────────────────────────────────────────────────────────────
const asked = [];           // every ref the page asked Sefaria for
let down = false;           // true: every request fails (the offline pass)
function answer(url) {
  const u = new URL(url);
  const ref = decodeURIComponent(u.pathname.replace(/^\/api\/v3\/texts\//, ''));
  asked.push(ref);
  const versions = u.searchParams.getAll('version');
  if (TANAKH[ref]) {
    const t = TANAKH[ref], out = [{ language: 'he', versionTitle: TANAKH_HE.title, license: TANAKH_HE.license, text: t.he }];
    const ens = t.ens || { [TANAKH_EN.title]: { license: TANAKH_EN.license, text: t.en } };
    for (const [title, e] of Object.entries(ens)) if (versions.some((v) => v === 'english|' + title)) out.push({ language: 'en', versionTitle: title, license: e.license, text: e.text });
    return { sections: t.sections, versions: out, available_versions: [{ language: 'he', versionTitle: TANAKH_HE.title, license: TANAKH_HE.license },
      ...Object.entries(ens).map(([title, e]) => ({ language: 'en', actualLanguage: 'en', versionTitle: title, license: e.license }))] };
  }
  const node = NODES[ref];
  if (!node) return { error: 'no such ref' };
  const available = [
    ...Object.entries(node.he).map(([t, v]) => ({ language: 'he', actualLanguage: 'he', versionTitle: t, license: v.license })),
    ...Object.entries(node.en).map(([t, v]) => ({ language: 'en', actualLanguage: v.actualLanguage || 'en', versionTitle: t, license: v.license })),
  ];
  const [lang, title] = (versions[0] || 'hebrew').split('|');
  const set = lang === 'hebrew' ? node.he : node.en;
  const pick = title ? set[title] : Object.values(set)[0];
  const pickTitle = title || Object.keys(set)[0];
  const out = [];
  if (pick) {
    const r = pick.returns || { title: pickTitle, license: pick.license };
    out.push({ language: lang === 'hebrew' ? 'he' : 'en', versionTitle: r.title, license: r.license, versionSource: 'https://example.invalid/source', text: pick.lines });
  }
  return { versions: out, available_versions: available };
}

// ── harness ──────────────────────────────────────────────────────────────────────────────────────
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const stop = () => { try { server.kill(); } catch (e) {} };
process.on('exit', stop);
for (let i = 0; i < 60; i++) { try { const r = await fetch(BASE + '/robots.txt'); if (r.ok) break; } catch (e) {} await new Promise((r) => setTimeout(r, 100)); if (i === 59) { console.error('smoke-tefillah: http.server did not start'); process.exit(1); } }

let failures = 0, count = 0;
const check = (name, ok, detail) => { count++; if (!ok) failures++; console.log((ok ? '  ok ' : '  FAIL ') + name + (ok || !detail ? '' : ' — ' + String(detail).slice(0, 400))); };

const browser = await chromium.launch();
async function openPage(query, seed) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e && e.message || e)));
  page.on('dialog', (d) => d.accept());
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(BASE + '/data/tefillah/catalog.json')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG) });
    const os = /\/data\/tefillah\/opensiddur\/([a-z0-9-]+)\.json/.exec(u);
    if (os && u.startsWith(BASE) && OS_FILES[os[1]]) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(OS_FILES[os[1]]) });
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (u.startsWith('https://www.sefaria.org/api/v3/texts/')) {
      if (down) { asked.push(decodeURIComponent(new URL(u).pathname.replace(/^\/api\/v3\/texts\//, ''))); return route.abort(); }
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(answer(u)) });
    }
    return route.abort();
  });
  await page.addInitScript((s) => { try { localStorage.setItem('hebrewTefillahTrainer_tourSeen', '1'); localStorage.setItem('hebrewBlender_darkMode', '0'); if (s && localStorage.getItem('hebrewTefillahTrainer_settings') === null) localStorage.setItem('hebrewTefillahTrainer_settings', s); } catch (e) {} }, seed ? JSON.stringify(seed) : null);
  await page.goto(BASE + '/tefillah_trainer.html' + (query || ''), { waitUntil: 'domcontentloaded' });
  await settled(page);
  return { page, errors, close: () => ctx.close() };
}
async function settled(page) {
  await page.waitForFunction(() => { const r = document.getElementById('ttReading'); return r && r.querySelector('.tt-interlinear, .tt-grid, .tt-bible, .tt-empty') && !window._readingLoadingProbe; }, null, { timeout: 20000 });
  await page.waitForTimeout(350);
}
const HEB = { pointLo: POINT_LO, pointHi: POINT_HI, sheva: SHEVA_NA, pause: PAUSE, etnachta: ETNACHTA };
// What is on screen, read from the DOM only.
const snapshot = (page) => page.evaluate((H) => {
  const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
  const r = q('#ttReading');
  const hasPoint = (s) => [...s].some((c) => c.charCodeAt(0) >= H.pointLo && c.charCodeAt(0) <= H.pointHi);
  return {
    empty: !!r.querySelector('.tt-empty'), retry: !!q('#ttRetryBtn'),
    rows: qa('#ttReading [data-vk]').map((e) => e.dataset.vk),
    trans: qa('#ttReading [data-vk]').map((e) => ((e.querySelector('.tt-translation') || {}).textContent || '').trim()),
    nums: qa('#ttReading .tt-num').map((e) => e.textContent.trim()).filter(Boolean),
    words: qa('#ttReading .tt-word').map((e) => e.textContent),
    bold: qa('#ttReading .tt-word.tt-b').length, small: qa('#ttReading .tt-word.tt-sm').length,
    instLines: qa('#ttReading .tt-instline').length, instWords: qa('#ttReading .tt-inst').length,
    pointedInst: qa('#ttReading .tt-inst').filter((e) => hasPoint(e.textContent)).length,
    text: r.textContent, html: r.innerHTML,
    forbidden: qa('#ttReading script, #ttReading img, #ttReading [onclick], #ttReading [onerror], #ttCredits script, #ttCredits img').length,
    xss: window.__xss,
    status: q('#ttStatus').textContent, statusError: q('#ttStatus').classList.contains('error'),
    credits: q('#ttCredits').hidden ? '' : q('#ttCredits').innerText.replace(/\s+/g, ' '),
    block: !!q('#ttReading .tt-trans-block'), blockText: (q('#ttReading .tt-trans-block') || {}).textContent || '',
    versionNote: q('#ttVersionNote').hidden ? '' : q('#ttVersionNote').textContent,
    versions: qa('#ttVersionSelect option').map((o) => o.value).filter(Boolean),
    marksRow: !q('#ttMarksRow').hidden, teamimOff: q('#optShowCantillation').disabled,
    tropeWords: qa('#ttReading [data-vk] .tt-word').filter((e) => /(^| )trope-/.test(e.className)).map((e) => e.closest('[data-vk]').dataset.vk),
    addedChips: qa('#ttReading .tt-added-chip').length,
    picker: q('#prayerSelect').value, nusach: q('#nusachSelect').value,
    nusachOptions: qa('#nusachSelect option').map((o) => o.value), options: qa('#prayerSelect option').map((o) => o.value),
    torahLinks: qa('#ttTorahLinks a').map((a) => a.getAttribute('href')),
    creditLinks: qa('#ttCredits a').map((a) => a.getAttribute('href')), genderRow: !q('#ttGenderRow').hidden,
  };
}, HEB);

try {
  // ── 1. a whole node ──
  {
    const t = await openPage('?prayer=plain', { showTranslation: true });
    const s = await snapshot(t.page);
    check('whole node: three lines to read, numbered 1 2 3, the unpointed line apart', s.rows.join() === '1,2,3' && s.nums.slice(0, 3).join() === '1,2,3' && s.instLines === 1, JSON.stringify({ rows: s.rows, nums: s.nums, inst: s.instLines }));
    check('bold and small print become the page\'s own classes', s.bold === 1 && s.small >= 1, `bold ${s.bold} small ${s.small}`);
    check('an inline tag never splits a word, <br> never joins two', s.words.includes(WORDS[1]) && s.words.includes(WORDS[3]) && s.words.includes(WORDS[4]), s.words.slice(0, 6).join(' | '));
    check('an unpointed word inside a text line is an instruction, never pointed text', s.instWords >= 2 && s.pointedInst === 0, `inst ${s.instWords} pointed ${s.pointedInst}`);
    check('nothing from a text is markup', s.forbidden === 0 && s.xss === undefined && !/<script|<img|onclick=|onerror=/i.test(s.html), `forbidden ${s.forbidden} xss ${s.xss}`);
    check('the reading marks are hidden until asked for', s.marksRow && !s.text.includes(SHEVA_NA) && !s.text.includes(PAUSE));
    check('no cantillation here: the te\'amim switch is off', s.teamimOff);
    check('aligned translation beside its lines, as text', /First line of the fixture\./.test(s.text) && !s.block && s.versions.join() === EN_A, s.versions.join());
    check('credits: edition and licence of the Hebrew and of the translation', s.credits.includes(MET) && /CC BY/.test(s.credits) && s.credits.includes(EN_A) && /CC0/.test(s.credits), s.credits);
    await t.page.evaluate(() => document.getElementById('optShowReadingMarks').click());
    await t.page.waitForTimeout(250);
    const s2 = await snapshot(t.page);
    check('…and shown when asked', s2.text.includes(SHEVA_NA) && s2.text.includes(PAUSE));
    check('no page error', t.errors.length === 0, t.errors.join(' | '));
    await t.close();
  }
  // ── 2. line ranges ──
  {
    const t = await openPage('?prayer=ranged', { showTranslation: true });
    let s = await snapshot(t.page);
    const want = NODES[N('Long')].he[MET].lines;
    check('a line range shows exactly its lines', s.rows.length === 2 && s.words.join(' ') === want[1] + ' ' + want[2], s.words.join(' '));
    check('…with its own lines of an aligned translation', /Long two\./.test(s.text) && /Long three\./.test(s.text) && !/Long one\./.test(s.text) && !/Long four\./.test(s.text));
    for (const [key, why] of [['moved', 'a range whose first words moved'], ['past-end', 'a range past the end of the node'], ['gone', 'a pinned edition that is gone']]) {
      await t.page.evaluate((k) => choosePrayer(k), key); await t.page.waitForTimeout(500); await settled(t.page);
      s = await snapshot(t.page);
      check(why + ' is refused: no text, a reason, no credits', s.empty && s.words.length === 0 && s.statusError && s.status.length > 20 && s.credits === '', JSON.stringify({ empty: s.empty, words: s.words.length, status: s.status }));
    }
    check('no page error', t.errors.length === 0, t.errors.join(' | '));
    await t.close();
  }
  // ── 3. licences ──
  {
    const t = await openPage('?prayer=unknown');
    for (const [key, why] of [['unknown', 'an unknown licence'], ['noderivs', 'a NoDerivatives licence'], ['trap', 'a text listed as open and returned as something else']]) {
      await t.page.evaluate((k) => choosePrayer(k), key); await t.page.waitForTimeout(500); await settled(t.page);
      const s = await snapshot(t.page);
      check(why + ' is refused', s.empty && s.words.length === 0 && s.statusError && s.credits === '', JSON.stringify({ empty: s.empty, words: s.words.length, status: s.status }));
    }
    check('no page error', t.errors.length === 0, t.errors.join(' | '));
    await t.close();
  }
  // ── 4. translations ──
  {
    const t = await openPage('?prayer=block', { showTranslation: true });
    let s = await snapshot(t.page);
    check('a translation divided differently is one block after the prayer, with a note', s.rows.length === 3 && s.block && /one paragraph/.test(s.blockText) && s.versionNote.length > 10 && s.credits.includes(EN_B), JSON.stringify({ block: s.block, note: s.versionNote }));
    await t.page.evaluate(() => choosePrayer('hidden-translation')); await t.page.waitForTimeout(500); await settled(t.page);
    s = await snapshot(t.page);
    check('…and for a line range it is left out, with a note, and not credited', s.rows.length === 2 && !s.block && !/one paragraph/.test(s.text) && s.versionNote.length > 10 && !s.credits.includes(EN_B), JSON.stringify({ rows: s.rows, note: s.versionNote, credits: s.credits }));
    await t.page.evaluate(() => choosePrayer('no-english')); await t.page.waitForTimeout(500); await settled(t.page);
    s = await snapshot(t.page);
    check('no open translation: none offered, none shown, and the page says so', s.rows.length === 1 && s.versions.length === 0 && !/Not to be shown|Nicht zeigen/.test(s.text) && s.versionNote.length > 10, JSON.stringify({ versions: s.versions, note: s.versionNote }));
    // a pinned translation: shorter than the Hebrew, paired by position
    const go = async (key) => { await t.page.evaluate((k) => choosePrayer(k), key); await t.page.waitForTimeout(500); await settled(t.page); return snapshot(t.page); };
    s = await go('pinned');
    check('a pinned translation stands beside the Hebrew lines of the same number', s.rows.length === 4 && s.trans.join('|') === 'Pin two, the second line.||Pin four \u2014 the fourth line.|' && !s.block && !s.versionNote && s.credits.includes(EN_P), JSON.stringify({ trans: s.trans, note: s.versionNote, credits: s.credits }));
    check('…a line of it with no word shows nothing, and its markup stays text', !s.text.includes('[]') && !/<i>/.test(s.trans.join('')) && s.forbidden === 0, JSON.stringify(s.trans));
    s = await go('pinned-moved');
    check('a pin whose stamped words no longer match pairs nothing: the translation is left out, with a note', s.rows.length === 4 && s.trans.every((x) => !x) && !/Pin two/.test(s.text) && !s.block && s.versionNote.length > 10 && !s.credits.includes(EN_P), JSON.stringify({ trans: s.trans, note: s.versionNote }));
    s = await go('pinned-odd');
    check('a pin this page cannot read is dropped and the prayer still opens', s.rows.length === 4 && s.trans.every((x) => !x) && !s.empty, JSON.stringify({ rows: s.rows, trans: s.trans }));
    s = await go('pinned-whole');
    check('a whole node pinned against the edition on screen pairs by position, past the translation\u2019s end too', s.rows.length === 5 && /A heading in English/.test(s.text) && s.trans.join('|') === 'Pin two, the second line.||Pin four \u2014 the fourth line.||' && !s.block && !s.versionNote, JSON.stringify({ rows: s.rows, trans: s.trans, block: s.block }));
    s = await go('pinned-other-edition');
    check('…and one pinned against another Hebrew edition stays a block', s.block && /Pin two/.test(s.blockText) && !s.blockText.includes('[]') && s.trans.every((x) => !x) && s.versionNote.length > 10, JSON.stringify({ block: s.block, trans: s.trans }));
    // lines that are Tanakh verses: their translation beside them, in a version the visitor picks
    s = await go('verses');
    check('lines that are Tanakh verses show those verses beside them, JPS 1917 first', s.rows.length === 2 && s.trans.join('|') === 'Verse one. Verse two.|Verse three. Verse four.' && !s.block, JSON.stringify(s.trans));
    check('…only the open translations of the verses are offered, credited to their book, with a note', s.versions.join('|') === [PS_B, JPS].join('|') && /Psalms/.test(s.credits) && s.credits.includes(JPS) && /Public Domain/.test(s.credits) && s.versionNote.length > 10 && !/Closed/.test(s.text), JSON.stringify({ versions: s.versions, credits: s.credits, note: s.versionNote }));
    await t.page.evaluate((title) => { const sel = document.getElementById('ttVersionSelect'); sel.value = title; sel.dispatchEvent(new Event('change', { bubbles: true })); }, PS_B);
    await t.page.waitForTimeout(600); await settled(t.page);
    s = await snapshot(t.page);
    check('…and another translation can be picked', s.trans.join('|') === 'Second one. Second two.|Second three. Second four.' && s.credits.includes(PS_B) && !s.credits.includes(JPS), JSON.stringify({ trans: s.trans, credits: s.credits }));
    s = await go('verses-whole');
    check('a whole node counted in the edition on screen: the same, a verse list ("3,4") read in order', s.rows.length === 2 && s.trans.join('|') === 'Second one. Second two.|Second three. Second four.', JSON.stringify(s.trans));
    for (const [key, why] of [['verses-swapped', 'a line that does not open with its verses'], ['verses-short', 'a map with the wrong number of lines'], ['verses-other-edition', 'a map counted in another Hebrew edition'], ['verses-odd', 'a map naming a book other than Psalms']]) {
      s = await go(key);
      check(why + ': no translation, and the prayer still opens', s.rows.length >= 1 && !s.empty && s.trans.every((x) => !x) && !/Verse one|Second one/.test(s.text) && !s.credits.includes(PS_B), JSON.stringify({ rows: s.rows.length, trans: s.trans, credits: s.credits }));
    }
    check('no page error', t.errors.length === 0, t.errors.join(' | '));
    await t.close();
  }
  // ── 5. a Torah source ──
  {
    const t = await openPage('?prayer=torah&nusach=torah', { showTranslation: true, colorCodeTrope: true });
    const s = await snapshot(t.page);
    check('Torah source: verses numbered chapter:verse, the siddur\'s line between them', s.rows.join() === '6:4,s1,6:5,6:6' && s.nums.filter((n) => /:/.test(n)).length >= 3, s.rows.join());
    check('the added line is marked and credited to the siddur', s.addedChips === 1 && s.credits.includes(MET) && s.credits.includes(TANAKH_HE.title) && /CC BY-SA/.test(s.credits), s.credits);
    check('trope classes on the verses only', s.tropeWords.length > 0 && !s.tropeWords.includes('s1'), [...new Set(s.tropeWords)].join());
    check('cantillation present: the te\'amim switch is live and the accents show', !s.teamimOff && s.text.includes(ETNACHTA));
    check('Open in Torah Trainer: one link per passage', s.torahLinks.length === 2 && s.torahLinks.every((h) => /^torah_trainer\.html\?ref=Deuteronomy/.test(h)), s.torahLinks.join(' '));
    check('the nusach list offers what the prayer has', s.nusachOptions.join() === 'ashkenaz,torah' && s.nusach === 'torah', s.nusachOptions.join());
    check('no page error', t.errors.length === 0, t.errors.join(' | '));
    await t.close();
  }
  // ── 6. the address bar ──
  {
    for (const q of ['?prayer=%3Cscript%3Ealert(1)%3C/script%3E', '?prayer=constructor', '?prayer=__proto__', '?prayer=not-a-siddur', '?prayer=plain&nusach=zzz', '?prayer=../../etc']) {
      const t = await openPage(q);
      const s = await snapshot(t.page);
      check(`${q} opens only a catalog prayer`, CATALOG.prayers.some((p) => p.key === s.picker) && s.picker !== 'not-a-siddur' && s.xss === undefined && t.errors.length === 0, s.picker + ' ' + t.errors.join(' | '));
      await t.close();
    }
    const t = await openPage('?prayer=plain');
    const s = await snapshot(t.page);
    check('a prayer whose only source is not a siddur ref is not offered', !s.options.includes('not-a-siddur'), s.options.join());
    await t.close();
    const stray = asked.filter((r) => !KNOWN_REFS.has(r));
    check('every request named a ref of the catalog (' + asked.length + ' requests)', asked.length > 10 && stray.length === 0, stray.slice(0, 5).join(' | '));
  }
  // ── 7. an Open Siddur snapshot ──
  {
    const t = await openPage('?prayer=os&nusach=opensiddur', { showTranslation: true });
    let s = await snapshot(t.page);
    const joined = () => s.words.join(' ');
    check('Open Siddur: offered beside the siddur, two lines, the gendered-forms row shown', s.nusachOptions.join() === 'ashkenaz,opensiddur' && s.rows.length === 2 && s.genderRow, JSON.stringify({ n: s.nusachOptions, rows: s.rows, row: s.genderRow }));
    check('a gendered pair shows both forms, masculine first, and no pipe', s.text.includes(OS_M + ' / ' + OS_F + ',') && !s.text.includes('|'), s.words.slice(0, 5).join(' '));
    check('its own licence, contributors and page are credited', s.credits.includes('A fixture page') && s.credits.includes('First Contributor, Second Contributor') && /CC BY-SA/.test(s.credits) && s.creditLinks.includes('https://creativecommons.org/licenses/by-sa/4.0/') && s.creditLinks.includes('https://opensiddur.org/fixture/'), s.credits + ' ' + s.creditLinks.join(' '));
    check('its translation beside its lines', /Fixture one\./.test(s.text) && !s.block);
    for (const [val, shown, gone] of [['m', OS_M, OS_F], ['f', OS_F, OS_M]]) {
      await t.page.evaluate((v) => document.querySelector('input[name="optGendered"][value="' + v + '"]').click(), val); await t.page.waitForTimeout(300);
      s = await snapshot(t.page);
      check('gendered forms = ' + val + ': one form, its punctuation kept, and the credits say so', s.words.some((w) => w.startsWith(shown)) && !s.words.some((w) => w.startsWith(gone)) && s.text.includes(shown + ',') && !s.text.includes(' / ') && s.credits.length > 0 && s.rows.length === 2 && /gendered/i.test(s.credits), joined() + ' ¦ ' + s.credits);
    }
    for (const [key, why] of [['os-missing', 'a missing snapshot file'], ['os-closed', 'a snapshot with a closed licence']]) {
      await t.page.evaluate((k) => choosePrayer(k), key); await t.page.waitForTimeout(600); await settled(t.page);
      s = await snapshot(t.page);
      check(why + ' is refused', s.empty && s.words.length === 0 && s.statusError && s.credits === '', s.status);
    }
    await t.page.evaluate(() => choosePrayer('os-odd')); await t.page.waitForTimeout(600); await settled(t.page);
    s = await snapshot(t.page);
    check('odd links and markup in a snapshot stay inert', s.rows.length === 1 && s.xss === undefined && s.forbidden === 0 && s.creditLinks.every((h) => /^https:\/\/(opensiddur\.org|creativecommons\.org|www\.sefaria\.org)/.test(h)), s.creditLinks.join(' ') + ' xss ' + s.xss);
    check('no page error', t.errors.length === 0, t.errors.join(' | '));
    await t.close();
  }
  // ── 8. Sefaria unreachable ──
  {
    down = true;
    const t = await openPage('?prayer=plain');
    const s = await snapshot(t.page);
    check('a failed request: the Try again card, a reason, no text', s.empty && s.retry && s.words.length === 0 && s.statusError && s.credits === '', s.status);
    down = false;
    await t.page.evaluate(() => document.getElementById('ttRetryBtn').click()); await t.page.waitForTimeout(600); await settled(t.page);
    const s2 = await snapshot(t.page);
    check('Try again loads the prayer', !s2.empty && s2.rows.length === 3);
    check('no page error', t.errors.length === 0, t.errors.join(' | '));
    await t.close();
  }
} catch (e) {
  failures++;
  console.error('smoke-tefillah: ' + (e && e.stack || e));
} finally {
  await browser.close();
  stop();
}
console.log(failures ? `smoke-tefillah: ${failures} of ${count} checks FAILED` : `smoke-tefillah: all ${count} checks passed`);
process.exit(failures ? 1 : 0);
