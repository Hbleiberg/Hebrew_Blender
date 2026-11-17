/**
 * holiday-catalog.mjs — read and check HolidayGuide.md, the catalog of the Holiday Guide (holiday_guide.html and the
 * holidays/ coloring pages), for the two builders that write from it: scripts/build-holiday-guide.mjs
 * (js/holiday-guide-data.js and the docs/holiday-guide/ previews) and scripts/build-holiday-pages.mjs (the holidays/
 * pages). One parser, so the two never read the catalog differently. The drawing and prose rules are the parasha
 * catalog's (scripts/parasha-catalog.mjs → catalogChecks).
 *
 * readHolidayCatalog(catalogPath) → { holidays, problems }. `problems` lists every rule a section breaks (empty when
 * the catalog is valid); `holidays` has one entry per section that could be read, in order:
 *   { n, key, slug, en, he, plain, weekly, spelled: [...], alt, icon, iconFrom, when: { en, he }, about: { en, he },
 *     symbols: [ { n, en, he, plain, alt, svg, caption: { en, he }, meaning: { en, he, plain, svg } | null } ] }
 *
 * The catalog. Seventeen "### N. Name · שֵׁם" sections in a fixed order — Shabbat and Havdalah (the weekly ones:
 * `weekly`, never counted down to), then the fifteen dated holidays in js/hebrew-calendar.js's HOLIDAY_KEYS order.
 * A section's paragraphs, in this order:
 *   <img src="docs/holiday-guide/<slug>.svg" … alt="what the holiday's symbol shows">
 *   **Key:** shabbat | havdalah | a HOLIDAY_KEYS key
 *   **Unpointed:** the name as it is spelled without nikkud (optional — see below)
 *   **Also spelled:** other English spellings (optional; the coloring pages show them and search engines read them)
 *   **When:** one short sentence          **About:** the brief description, 60–600 characters
 *   **מתי:** and **על החג:**               their Hebrew twins (unpointed, as the parasha catalog's Hebrew)
 *   the holiday's symbol: either **Symbol:** holiday-icons:<family> — the drawing is read out of the shared
 *   holiday-icons JS block (classroom_dashboard.html), so the Dashboard, the Torah Trainer and the guide show one
 *   drawing and nobody keeps a second copy — or its own one-line ```html block.
 * Then no symbols at all (the holiday shows "more symbols coming soon") or exactly six "#### n. Name · שֵׁם"
 * subsections, each:
 *   <img src="docs/holiday-guide/<slug>-<n>.svg" … alt="what the drawing shows">
 *   **Unpointed:** the name as it is spelled without nikkud (optional)
 *   **Caption:** one sentence, 20–220 characters        **כיתוב:** its Hebrew twin
 *   **Meaning:** English · עִבְרִית (optional: what the symbol stands for, as Sukkot's four species do; a third
 *   " · unpointed" part when its plain spelling differs)
 *   the drawing's one-line ```html block, and after a **Meaning:** a second one, the meaning's small picture.
 * Every Hebrew *name* (a holiday's, a symbol's, a meaning's) is pointed — the sheets print it as vocabulary and strip
 * the points when asked — while the Hebrew *sentences* are unpointed. `plain` is the name for a sheet printed without
 * nikkud: the pointed name with its points removed, unless **Unpointed:** gives the full spelling Hebrew is written
 * in without them (חֲנֻכָּה is חנוכה, not חנכה; סֻכָּה is סוכה) — give one wherever the two differ.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, catalogChecks, POINTS, HEB, LATIN } from './parasha-catalog.mjs';

export { ROOT };
export const CATALOG = 'HolidayGuide.md';
export const PREVIEW_DIR = 'docs/holiday-guide';
export const WEEKLY_KEYS = ['shabbat', 'havdalah'];
export const SYMBOLS_PER_HOLIDAY = 6;
const ICON_CARRIER = 'classroom_dashboard.html';

export const slugOf = (en) => en.toLowerCase().replace(/['’]/g, '').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');

// The fifteen dated keys come from the calendar module itself, so the catalog can never name a holiday it cannot date.
export function calendarKeys() {
  const box = { window: {} };
  vm.runInNewContext(readFileSync(path.join(ROOT, 'js/hebrew-calendar.js'), 'utf8'), box);
  return Array.from(box.window.HebCal.HOLIDAY_KEYS);
}

// The shared holiday-icons JS block's drawings: family → inner markup (classroom_dashboard.html is a carrier; the
// block is byte-identical on the others).
export function sharedHolidayIcons() {
  const html = readFileSync(path.join(ROOT, ICON_CARRIER), 'utf8');
  const a = html.indexOf('/* ═══ holiday-icons JS ═══'), b = html.indexOf('/* ═══ end holiday-icons JS ═══ */');
  const out = new Map();
  if (a < 0 || b < a) return out;
  const block = html.slice(a, b);
  const obj = block.slice(block.indexOf('const HOLIDAY_ICONS = {'), block.indexOf('\n};'));
  for (const m of obj.matchAll(/^\s*([a-z]+): '([^'\n]*)',$/gm)) out.set(m[1], m[2].trim());
  return out;
}

const HOLIDAY_PARAS = [
  ['img', /^<img src="/], ['key', /^\*\*Key:\*\* \S/], ['plain', /^\*\*Unpointed:\*\* \S/], ['spelled', /^\*\*Also spelled:\*\* \S/],
  ['when.en', /^\*\*When:\*\*\s/, '**When:**'], ['about.en', /^\*\*About:\*\*\s/, '**About:**'],
  ['when.he', /^\*\*מתי:\*\*\s/u, '**מתי:**'], ['about.he', /^\*\*על החג:\*\*\s/u, '**על החג:**'],
  ['symbol', /^\*\*Symbol:\*\* \S/], ['html', /^```html\n/],
];
const SYMBOL_PARAS = [
  ['img', /^<img src="/], ['plain', /^\*\*Unpointed:\*\* \S/], ['caption.en', /^\*\*Caption:\*\*\s/, '**Caption:**'], ['caption.he', /^\*\*כיתוב:\*\*\s/u, '**כיתוב:**'],
  ['meaning', /^\*\*Meaning:\*\* \S/], ['html', /^```html\n/], ['html2', /^```html\n/],
];
const LIMITS = { 'when.en': { min: 8, max: 140 }, 'when.he': { min: 6, max: 140 }, 'about.en': { min: 60, max: 600 }, 'about.he': { min: 40, max: 600 },
  'caption.en': { min: 20, max: 220 }, 'caption.he': { min: 12, max: 220 } };
// A pointed Hebrew name: letters, vowel points and the shin/sin dots, spaces, maqaf, geresh/gershayim and " / ".
const HE_NAME = /^[א-תְ-ׇּׁׂ ־׳״/]+$/u;
const EN_NAME = /^[A-Za-z][A-Za-z '’/-]*$/;
const HE_PLAIN = /^[\u05d0-\u05ea \u05be\u05f3\u05f4/]+$/u;
const MARKS = /[\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7]/gu;
export const stripPoints = (he) => he.replace(MARKS, '');

export function readHolidayCatalog(catalogPath = path.join(ROOT, CATALOG)) {
  const problems = [];
  const fail = (where, msg) => problems.push(`${where}: ${msg}`);
  const { checkDrawing, prose, spellings } = catalogChecks(fail);
  const dated = calendarKeys();
  const order = [...WEEKLY_KEYS, ...dated];
  const shared = sharedHolidayIcons();
  if (!shared.size) fail(ICON_CARRIER, 'the holiday-icons JS block was not found');

  const heName = (where, what, he) => {
    if (!HE_NAME.test(he) || !HEB.test(he) || LATIN.test(he)) fail(where, `${what} «${he}» is not a Hebrew name (letters, vowel points, spaces, maqaf, ׳ ״ and /)`);
    else if (!POINTS.test(he)) fail(where, `${what} «${he}» has no nikkud: the sheets print it as vocabulary`);
  };
  // The unpointed spelling: the given one (letters only, and not simply the points removed — then it is not needed), else the points removed.
  const plainOf = (where, he, given) => {
    const stripped = stripPoints(he);
    if (!given) return stripped;
    if (!HE_PLAIN.test(given)) fail(where, `**Unpointed:** «${given}» — Hebrew letters only, no points`);
    else if (given === stripped) fail(where, `**Unpointed:** «${given}» is the pointed name without its points: leave it out`);
    return given;
  };
  const enName = (where, what, en) => { if (!EN_NAME.test(en)) fail(where, `${what} «${en}» — letters with spaces, hyphens, apostrophes or " / " between them`); };
  // A section's paragraphs against its list: every one recognised, in order, the optional ones possibly absent.
  const sort = (where, body, PARAS, optional) => {
    const paras = body.split(/\n[ \t]*\n/).map((s) => s.trim()).filter(Boolean);
    let from = 0;
    const kinds = paras.map((t) => {
      for (let k = from; k < PARAS.length; k++) if (PARAS[k][1].test(t)) { from = k + 1; return PARAS[k][0]; }
      return null;
    });
    paras.forEach((t, j) => kinds[j] || fail(where, `unrecognized or out-of-order paragraph «${t.slice(0, 48).replace(/\n/g, ' ')}»`));
    for (const [k] of PARAS) if (!optional.has(k) && !kinds.includes(k)) fail(where, `no ${k} paragraph`);
    const para = (k) => { const j = kinds.indexOf(k); return j < 0 ? '' : paras[j]; };
    const text = {};
    for (const [k, , label] of PARAS) if (label) text[k] = para(k) ? prose(where, k, para(k), label, LIMITS[k]) : '';
    return { para, text, has: (k) => kinds.includes(k) };
  };
  const drawingOf = (where, para) => {
    const m = /^```html\n([^\n]*)\n```$/.exec(para);
    if (!m) { fail(where, 'a drawing is one line inside a ```html block'); return ''; }
    const svg = m[1].trim();
    checkDrawing(where, svg);
    return svg;
  };
  const altOf = (where, para, src) => {
    if (!para.includes(`<img src="${src}"`)) fail(where, `no <img src="${src}"> preview`);
    const alt = (para.match(/\balt="([^"]*)"/) || [])[1] || '';
    if (!alt) fail(where, 'the preview <img> has no alt text (the pages describe the drawing with it)');
    if (/[<>&"]/.test(alt)) fail(where, 'the alt text is plain text');
    return alt;
  };

  const md = readFileSync(catalogPath, 'utf8');
  const heads = [...md.matchAll(/^### (\d+)\. (.+?) · (.+?)\s*$/gm)];
  const holidays = [];
  const slugs = new Set();
  heads.forEach((h, i) => {
    const [, num, en, he] = h;
    const where = `${CATALOG} § ${num}. ${en}`;
    if (Number(num) !== i + 1) fail(where, `numbered ${num}, expected ${i + 1}`);
    enName(where, 'the name', en); heName(where, 'the Hebrew name', he);
    const slug = slugOf(en);
    if (slugs.has(slug)) fail(where, `two holidays share the page name ${slug}`);
    slugs.add(slug);
    const start = h.index + h[0].length;
    const next = md.slice(start).search(/^#{2,3} /m);
    const section = md.slice(start, next < 0 ? md.length : start + next);
    const subs = [...section.matchAll(/^#### (\d+)\. (.+?) · (.+?)\s*$/gm)];
    const head = sort(where, subs.length ? section.slice(0, subs[0].index) : section, HOLIDAY_PARAS, new Set(['plain', 'spelled', 'symbol', 'html']));
    const plain = plainOf(where, he, head.para('plain').slice('**Unpointed:** '.length).trim());
    const key = head.para('key').slice('**Key:** '.length).trim();
    if (key !== order[i]) fail(where, `**Key:** is ${key || '(none)'}, expected ${order[i] || '(no such holiday)'} — the order is ${order.join(', ')}`);
    const alt = altOf(where, head.para('img'), `${PREVIEW_DIR}/${slug}.svg`);
    const spelled = head.has('spelled') ? spellings(where, head.para('spelled'), en) : [];
    let icon = '', iconFrom = 'catalog';
    if (head.has('symbol') === head.has('html')) fail(where, 'the holiday\'s symbol is either **Symbol:** holiday-icons:<family> or one ```html drawing');
    else if (head.has('symbol')) {
      const m = /^\*\*Symbol:\*\* holiday-icons:([a-z]+)$/.exec(head.para('symbol'));
      if (!m || !shared.has(m[1])) fail(where, `**Symbol:** names no family of the holiday-icons block (${[...shared.keys()].join(', ')})`);
      else { icon = shared.get(m[1]); iconFrom = 'holiday-icons:' + m[1]; checkDrawing(`${where} (holiday-icons:${m[1]})`, icon); }
    } else icon = drawingOf(where, head.para('html'));
    const symbols = [];
    subs.forEach((s, j) => {
      const [, sn, sen, she] = s;
      const sw = `${where} › ${sn}. ${sen}`;
      if (Number(sn) !== j + 1) fail(sw, `numbered ${sn}, expected ${j + 1}`);
      enName(sw, 'the name', sen); heName(sw, 'the Hebrew name', she);
      const a = s.index + s[0].length;
      const body = section.slice(a, j + 1 < subs.length ? subs[j + 1].index : section.length);
      const sub = sort(sw, body, SYMBOL_PARAS, new Set(['plain', 'meaning', 'html2']));
      const splain = plainOf(sw, she, sub.para('plain').slice('**Unpointed:** '.length).trim());
      const salt = altOf(sw, sub.para('img'), `${PREVIEW_DIR}/${slug}-${j + 1}.svg`);
      const svg = sub.has('html') ? drawingOf(sw, sub.para('html')) : '';
      let meaning = null;
      if (sub.has('meaning') !== sub.has('html2')) fail(sw, 'a **Meaning:** comes with a second ```html drawing, and a second drawing with a **Meaning:**');
      else if (sub.has('meaning')) {
        const m = /^\*\*Meaning:\*\* (.+?) · ([^·]+?)(?: · ([^·]+))?$/.exec(sub.para('meaning'));
        if (!m) fail(sw, '**Meaning:** reads "English · עִבְרִית" (and " · unpointed" when that spelling differs)');
        else {
          enName(sw, 'the meaning', m[1]); heName(sw, 'the meaning\'s Hebrew', m[2].trim());
          meaning = { en: m[1], he: m[2].trim(), plain: plainOf(sw + ' (meaning)', m[2].trim(), (m[3] || '').trim()), svg: drawingOf(sw + ' (meaning)', sub.para('html2')) };
        }
      }
      symbols.push({ n: j + 1, en: sen, he: she, plain: splain, alt: salt, svg, caption: { en: sub.text['caption.en'], he: sub.text['caption.he'] }, meaning });
    });
    if (symbols.length && symbols.length !== SYMBOLS_PER_HOLIDAY) fail(where, `${symbols.length} symbols: a holiday has none yet or exactly ${SYMBOLS_PER_HOLIDAY}`);
    if (new Set(symbols.map((s) => s.en)).size !== symbols.length) fail(where, 'two symbols share a name');
    holidays.push({ n: i + 1, key, slug, en, he, plain, weekly: WEEKLY_KEYS.includes(key), spelled, alt, icon, iconFrom,
      when: { en: head.text['when.en'], he: head.text['when.he'] }, about: { en: head.text['about.en'], he: head.text['about.he'] }, symbols });
  });
  if (heads.length !== order.length) fail(CATALOG, `${heads.length} "### N. Name · שֵׁם" sections, expected ${order.length} (${order.join(', ')})`);
  return { holidays, problems };
}
