#!/usr/bin/env node
/**
 * build-trope-index.mjs — build data/trope/trope_index.json for trope_tutor.html.
 *
 * Mines the PocketTorah corpus (word-level audio timings already mirrored in
 * data/pockettorah/) plus Sefaria's Hebrew-with-te'amim Torah text to produce a
 * static index of real chanted example words for every cantillation mark:
 *   { v:1, system:"torah", built:"YYYY-MM-DD",
 *     tropes: { "<tropeKey>": [ {p,a,w,ref,he,s,e}, ... ] } }
 * where p = parsha pocket key, a = aliyah "1"-"7", w = 0-based sung-word index
 * within the aliyah (= timings index), ref = "chapter:verse", he = the raw word
 * (marks intact), s/e = clip start/end seconds in the aliyah MP3.
 *
 * Plain Node, zero dependencies. Run from anywhere:
 *   node scripts/build-trope-index.mjs [--source=export|api]
 *
 *   --source=export (default)  Sefaria's public text export bucket
 *       https://storage.googleapis.com/sefaria-export/json/Tanakh/Torah/<Book>/Hebrew/merged.json
 *   --source=api               live Sefaria v3 API, mirroring torah_trainer.html's
 *       fetchSefariaText (version=hebrew, return_format=text_only)
 *
 * Raw HTTP responses are cached in source-data/trope-cache/ (gitignored), so
 * re-runs are offline and byte-identical. Also writes docs/trope_index_report.md
 * (corpus counts, exclusions, zarka codepoint finding, Genesis 1:1 smoke test).
 * The script exits non-zero if any smoke test fails — never commit its output
 * without a green run.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_PATH = join(repoRoot, 'data', 'trope', 'trope_index.json');
const REPORT_PATH = join(repoRoot, 'docs', 'trope_index_report.md');
const CACHE_DIR = join(repoRoot, 'source-data', 'trope-cache');
const TIMINGS_DIR = join(repoRoot, 'data', 'pockettorah', 'timings');

const SOURCE = (process.argv.find((a) => a.startsWith('--source=')) || '--source=export')
  .split('=')[1];
if (SOURCE !== 'export' && SOURCE !== 'api') {
  console.error(`Unknown --source=${SOURCE} (use export or api)`);
  process.exit(1);
}

/* ═══ TROPES taxonomy — KEEP IN SYNC with trope_tutor.html (same ═══-marked table) ═══
   Per-mark taxonomy for the tutor. `chars` / `family` are ported EXACTLY from
   torah_trainer.html's TROPE_CHAR_TO_FAMILY (the six-family pedagogical grouping);
   keys are stable snake_case identifiers used in trope_index.json and in the
   tutor's progress store — never rename a key without a data migration.
   Notes:
   - sof_pasuk has NO chars: Unicode unifies the siluk mark with METEG (U+05BD),
     so the verse-final word is classified positionally (zero in-range marks).
   - zarka lists BOTH U+0598 (Unicode "ZARQA") and U+05AE (Unicode "ZINOR") —
     the Unicode names are swapped relative to traditional usage and encoded
     texts disagree; `display` carries the codepoint this corpus actually uses.
   - Sephardi naming collides with Ashkenazi across marks: Ashkenazi "pashta"
     (postpositive, U+0599) is called "kadma" in Sephardi usage, while the
     Ashkenazi "kadma" (on the stress, U+05A8) is Sephardi "azla". Same glyph
     shape, different position — the tutor's classic confusable pair. */
const TROPES = [
  // 1. Sof Pasuk clause
  { key: 'mercha',          chars: ['֥'], display: '֥', ashk: 'Mercha',          seph: "Ma'arich",        family: 'sofpasuk', rare: false },
  { key: 'tipcha',          chars: ['֖'], display: '֖', ashk: 'Tipcha',          seph: 'Tarcha',          family: 'sofpasuk', rare: false },
  { key: 'munach',          chars: ['֣'], display: '֣', ashk: 'Munach',          seph: 'Shofar Holech',   family: 'sofpasuk', rare: false },
  { key: 'etnachta',        chars: ['֑'], display: '֑', ashk: 'Etnachta',        seph: 'Atnach',          family: 'sofpasuk', rare: false },
  { key: 'sof_pasuk',       chars: [],         display: 'ֽ׃', ashk: 'Sof Pasuk (Siluk)', seph: 'Sof Pasuk (Siluk)', family: 'sofpasuk', rare: false },
  // 2. Zakef Katon clause
  { key: 'mahpach',         chars: ['֤'], display: '֤', ashk: 'Mahpach',         seph: 'Shofar Mehupach', family: 'katon', rare: false },
  { key: 'pashta',          chars: ['֙'], display: '֙', ashk: 'Pashta',          seph: 'Kadma',           family: 'katon', rare: false },
  { key: 'yetiv',           chars: ['֚'], display: '֚', ashk: 'Yetiv',           seph: 'Yetiv',           family: 'katon', rare: false },
  { key: 'zakef_katon',     chars: ['֔'], display: '֔', ashk: 'Zakef Katon',     seph: 'Zakef Katon',     family: 'katon', rare: false },
  { key: 'zakef_gadol',     chars: ['֕'], display: '֕', ashk: 'Zakef Gadol',     seph: 'Zakef Gadol',     family: 'katon', rare: false },
  // 3. Segol clause
  { key: 'zarka',           chars: ['֘', '֮'], display: '֮', ashk: 'Zarka', seph: 'Zarka',           family: 'segol', rare: false },
  { key: 'segol',           chars: ['֒'], display: '֒', ashk: 'Segol',           seph: 'Segolta',         family: 'segol', rare: false },
  { key: 'shalshelet',      chars: ['֓'], display: '֓', ashk: 'Shalshelet',      seph: 'Shalshelet',      family: 'segol', rare: true },
  // 4. Revia group
  { key: 'revia',           chars: ['֗'], display: '֗', ashk: 'Revia',           seph: 'Revia',           family: 'revia', rare: false },
  { key: 'darga',           chars: ['֧'], display: '֧', ashk: 'Darga',           seph: 'Darga',           family: 'revia', rare: false },
  { key: 'tevir',           chars: ['֛'], display: '֛', ashk: 'Tevir',           seph: 'Tevir',           family: 'revia', rare: false },
  // 5. Geresh group
  { key: 'kadma',           chars: ['֨'], display: '֨', ashk: 'Kadma',           seph: 'Azla',            family: 'geresh', rare: false },
  { key: 'geresh',          chars: ['֜'], display: '֜', ashk: 'Geresh',          seph: 'Geresh',          family: 'geresh', rare: false },
  { key: 'geresh_muqdam',   chars: ['֝'], display: '֝', ashk: 'Geresh Muqdam',   seph: 'Geresh Muqdam',   family: 'geresh', rare: true },
  { key: 'gershayim',       chars: ['֞'], display: '֞', ashk: 'Gershayim',       seph: 'Shenei Gerishin', family: 'geresh', rare: false },
  { key: 'telisha_ketana',  chars: ['֩'], display: '֩', ashk: 'Telisha Ketana',  seph: 'Talsha',          family: 'geresh', rare: false },
  { key: 'telisha_gedola',  chars: ['֠'], display: '֠', ashk: 'Telisha Gedola',  seph: 'Tirtzah',         family: 'geresh', rare: false },
  { key: 'pazer',           chars: ['֡'], display: '֡', ashk: 'Pazer',           seph: 'Pazer Gadol',     family: 'geresh', rare: false },
  // 6. Rare marks
  { key: 'mercha_kefula',   chars: ['֦'], display: '֦', ashk: 'Mercha Kefula',   seph: "Tere Ta'amei",    family: 'rare', rare: true },
  { key: 'karnei_parah',    chars: ['֟'], display: '֟', ashk: 'Karnei Parah',    seph: 'Karnei Farah',    family: 'rare', rare: true },
  { key: 'yerach_ben_yomo', chars: ['֪'], display: '֪', ashk: 'Yerach Ben Yomo', seph: 'Yareach Ben Yomo', family: 'rare', rare: true },
];
/* ═══ end TROPES taxonomy ═══ */

// char -> trope key (both zarka codepoints resolve to 'zarka')
const CHAR_TO_KEY = {};
for (const t of TROPES) for (const ch of t.chars) CHAR_TO_KEY[ch] = t.key;

const CLIP_MIN = 0.35, CLIP_MAX = 4.0;           // hard clip-length bounds (s)
// Rare marks (shalshelet, karnei parah, yerach ben yomo) carry deliberately long,
// ornate melodies — a 4s cap filters out every real occurrence. Their length IS
// the lesson, so they get a wider ceiling.
const CLIP_MAX_RARE = 8.0;
const RARE_KEYS = new Set(TROPES.filter((t) => t.rare).map((t) => t.key));
const SWEET_MIN = 0.6, SWEET_MAX = 2.5;          // preferred clip-length band (s)
const CAP_PER_TROPE = 40;
const SIZE_BUDGET = 250 * 1024;
const MARK_RANGE = /[֑-֯]/;            // te'amim; excludes meteg/siluk U+05BD

/* ---------- HTTP with disk cache (curl fallback: Node fetch ignores HTTPS_PROXY) -- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastFetchAt = 0;
async function httpGet(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch {
    return execFileSync('curl', ['-sS', '--fail', '--max-time', '120', url], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  }
}
async function cachedGet(cacheName, url) {
  const path = join(CACHE_DIR, cacheName);
  if (existsSync(path)) return readFileSync(path, 'utf8');
  const wait = 150 - (Date.now() - lastFetchAt);
  if (wait > 0) await sleep(wait);
  console.log(`  fetching ${url}`);
  const body = await httpGet(url);
  lastFetchAt = Date.now();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(path, body);
  return body;
}

/* ---------- text pipeline (mirrors torah_trainer.html cleanSefariaText/tokenizeHebrew) */
const NAMED_ENTITIES = { nbsp: ' ', thinsp: ' ', mdash: '—', ndash: '–', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}
function cleanVerse(s) {
  if (typeof s !== 'string' || !s) return '';
  let out = s.replace(/<[^>]*>/g, '');                 // merged.json carries stray <big> etc.
  out = out.replace(/\{[פסףפ׳ס׳PSFps]\}/g, '');        // {פ}/{ס} paragraph markers
  out = decodeEntities(out);
  return out.replace(/\s+/g, ' ').trim();
}
// Split exactly like tokenizeHebrew: whitespace AND maqaf are separators; a token
// is a sung word iff it contains a Hebrew letter. PocketTorah counts each side of
// a maqaf pair as its own sung word.
function tokenizeWords(verse) {
  return verse.split(/(\s+|־)/).filter((t) => t && !/^\s+$/.test(t) && t !== '־' && /[א-ת]/.test(t));
}

/* ---------- source adapters -> chapters: string[][] (1-indexed C:V via [c-1][v-1]) */
async function loadBook(book) {
  if (SOURCE === 'export') {
    const raw = await cachedGet(`merged-${book}.json`,
      `https://storage.googleapis.com/sefaria-export/json/Tanakh/Torah/${book}/Hebrew/merged.json`);
    return JSON.parse(raw).text;
  }
  // api mode — mirror torah_trainer.html fetchSefariaText params on a book-level ref
  const url = new URL(`https://www.sefaria.org/api/v3/texts/${encodeURIComponent(book)}`);
  url.searchParams.append('version', 'hebrew');
  url.searchParams.set('return_format', 'text_only');
  const raw = await cachedGet(`api-${book}.json`, url.toString());
  const data = JSON.parse(raw);
  const text = data.versions && data.versions[0] && data.versions[0].text;
  if (!Array.isArray(text)) throw new Error(`Sefaria API: unexpected shape for ${book}`);
  return text;
}

/* ---------- repo inputs ---------- */
function readRepoJSON(rel) {
  let raw = readFileSync(join(repoRoot, rel), 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // aliyah.json ships a UTF-8 BOM
  return JSON.parse(raw);
}

const parshiyot = readRepoJSON('data/parshiyot.json');            // [{n,en,book,pocket}] ×54
const aliyahData = readRepoJSON('data/pockettorah/aliyah.json').parshiot.parsha; // ×54, same order
const manifest = readRepoJSON('data/pockettorah/manifest.json');  // pocket -> {audioBase,labels,missing}

/* ---------- corpus walk ---------- */
const round2 = (x) => Math.round(x * 100) / 100;
const exclusions = [];   // {parsha, aliyah, reason}
const candidates = {};   // key -> [{p,a,w,ref,he,s,e,dur,markCount,pi}]
for (const t of TROPES) candidates[t.key] = [];
const zarkaStats = {};   // book -> {u0598, u05AE, segol, coocc0598, coocc05AE}
const strayPoetic = [];  // U+05AB/AC/AD sightings
let alignedAliyot = 0, totalWords = 0;
let gen1verse1words = null; // for the smoke test / report

for (let i = 0; i < parshiyot.length; i++) {
  const { book, pocket } = parshiyot[i];
  const chapters = await loadBook(book); // cached after first hit per book
  const m = manifest[pocket];
  if (!m) { exclusions.push({ parsha: pocket, aliyah: '*', reason: 'no manifest entry' }); continue; }
  const aliyot = aliyahData[i].fullkriyah.aliyah;

  // zarka/segol/poetic-mark census per book (verse-level co-occurrence)
  if (!zarkaStats[book]) {
    const st = { u0598: 0, u05AE: 0, segol: 0, coocc0598: 0, coocc05AE: 0 };
    for (const ch of chapters) for (const v of ch) {
      if (typeof v !== 'string') continue;
      st.u0598 += (v.match(/֘/g) || []).length;
      st.u05AE += (v.match(/֮/g) || []).length;
      st.segol += (v.match(/֒/g) || []).length;
      if (/֒/.test(v)) {
        if (/֘/.test(v)) st.coocc0598++;
        if (/֮/.test(v)) st.coocc05AE++;
      }
      const poetic = v.match(/[֭֫֬]/g);
      if (poetic) strayPoetic.push({ book, count: poetic.length });
    }
    zarkaStats[book] = st;
  }

  for (const al of aliyot) {
    const suffix = al._num;
    if (!/^[1-7]$/.test(suffix)) continue;                       // skip maftir "M" (and "H")
    if (Array.isArray(m.missing) && m.missing.includes(suffix)) {
      exclusions.push({ parsha: pocket, aliyah: suffix, reason: 'listed in manifest.missing' });
      continue;
    }
    const labelFile = m.labels && m.labels[suffix];
    if (!labelFile) {
      exclusions.push({ parsha: pocket, aliyah: suffix, reason: 'no timings label in manifest' });
      continue;
    }

    // resolve verse range (C:V inclusive, may cross chapters)
    const [bc, bv] = al._begin.split(':').map(Number);
    const [ec, ev] = al._end.split(':').map(Number);
    const words = [];      // {tok, ref, verseFinal}
    let rangeOk = true;
    for (let c = bc; c <= ec; c++) {
      const ch = chapters[c - 1];
      if (!Array.isArray(ch)) { rangeOk = false; break; }
      const vStart = c === bc ? bv : 1;
      const vEnd = c === ec ? ev : ch.length;
      for (let v = vStart; v <= vEnd; v++) {
        const verse = cleanVerse(ch[v - 1]);
        if (!verse) { rangeOk = false; break; }
        const toks = tokenizeWords(verse);
        toks.forEach((tok, ti) => words.push({ tok, ref: `${c}:${v}`, verseFinal: ti === toks.length - 1 }));
      }
      if (!rangeOk) break;
    }
    if (!rangeOk || words.length === 0) {
      exclusions.push({ parsha: pocket, aliyah: suffix, reason: 'verse range unresolved in source text' });
      continue;
    }

    // timings + sentinel rule (verbatim from torah_trainer loadKaraoke)
    let timings;
    try {
      timings = readFileSync(join(TIMINGS_DIR, labelFile), 'utf8')
        .trim().split(',').map(parseFloat).filter((x) => !isNaN(x));
    } catch {
      exclusions.push({ parsha: pocket, aliyah: suffix, reason: `timings file unreadable: ${labelFile}` });
      continue;
    }
    if (timings.length > 1 && timings[0] === 0 && timings.length === words.length + 1) {
      timings = timings.slice(1);
    }
    if (timings.length !== words.length) {
      exclusions.push({
        parsha: pocket, aliyah: suffix,
        reason: `word/timing count mismatch (${words.length} words vs ${timings.length} timings)`,
      });
      continue;
    }
    alignedAliyot++;
    totalWords += words.length;
    if (pocket === 'Bereshit' && suffix === '1') {
      gen1verse1words = words.filter((w) => w.ref === '1:1').map((w) => w.tok);
    }

    // candidates — aliyah-final word never qualifies (no end timing)
    for (let w = 0; w < words.length - 1; w++) {
      const { tok, ref, verseFinal } = words[w];
      const marks = tok.match(/[֑-֯]/g) || [];
      const keys = [...new Set(marks.map((ch) => CHAR_TO_KEY[ch]).filter(Boolean))];
      let key = null, markCount = marks.length;
      if (verseFinal) {
        // Verse-final = the siluk cadence. Only a clean (zero in-range marks) final
        // word teaches sof_pasuk; one carrying another family's mark is ambiguous — skip.
        if (marks.length === 0) key = 'sof_pasuk';
      } else if (marks.length > 0 && keys.length === 1) {
        key = keys[0];
      }
      if (!key) continue;
      const s = timings[w], e = timings[w + 1];
      if (s == null || e == null) continue;         // falsy-zero safe: 0 is a valid onset
      const dur = e - s;
      if (dur < CLIP_MIN || dur > (RARE_KEYS.has(key) ? CLIP_MAX_RARE : CLIP_MAX)) continue;
      candidates[key].push({ p: pocket, a: suffix, w, ref, he: tok, s: round2(s), e: round2(e), dur, markCount, pi: i });
    }
  }
}

/* ---------- deterministic selection: spread across parshiyot, cap per trope ------- */
const index = { v: 1, system: 'torah', built: new Date().toISOString().slice(0, 10), tropes: {} };
const selStats = [];
for (const t of TROPES) {
  const pool = candidates[t.key];
  // group by parsha (canonical order = parshiyot.json order)
  const byParsha = new Map();
  for (const c of pool) {
    if (!byParsha.has(c.pi)) byParsha.set(c.pi, []);
    byParsha.get(c.pi).push(c);
  }
  // within a parsha: single-occurrence marks first, then sweet-spot clips, then (a,w)
  for (const list of byParsha.values()) {
    list.sort((x, y) =>
      (x.markCount - y.markCount) ||
      ((x.dur >= SWEET_MIN && x.dur <= SWEET_MAX ? 0 : 1) - (y.dur >= SWEET_MIN && y.dur <= SWEET_MAX ? 0 : 1)) ||
      x.a.localeCompare(y.a) || (x.w - y.w));
  }
  const parshaOrder = [...byParsha.keys()].sort((a, b) => a - b);
  const picked = [];
  for (let pass = 0; picked.length < CAP_PER_TROPE; pass++) {
    let took = false;
    for (const pi of parshaOrder) {
      const list = byParsha.get(pi);
      if (pass < list.length && picked.length < CAP_PER_TROPE) { picked.push(list[pass]); took = true; }
    }
    if (!took) break;
  }
  picked.sort((x, y) => (x.pi - y.pi) || x.a.localeCompare(y.a) || (x.w - y.w));
  index.tropes[t.key] = picked.map(({ p, a, w, ref, he, s, e }) => ({ p, a, w, ref, he, s, e }));
  selStats.push({
    key: t.key, family: t.family, rare: t.rare,
    found: pool.length, selected: picked.length,
    parshiyot: new Set(picked.map((c) => c.p)).size,
  });
}

/* ---------- emit ---------- */
mkdirSync(dirname(INDEX_PATH), { recursive: true });
const serialized = JSON.stringify(index);
writeFileSync(INDEX_PATH, serialized);
const bytes = Buffer.byteLength(serialized);

/* ---------- smoke tests — fail loudly, never ship a red build ---------- */
const failures = [];
function expectMark(word, cp, name, idx) {
  if (!word) failures.push(`Gen 1:1 word ${idx} missing`);
  else if (!word.includes(String.fromCodePoint(cp)))
    failures.push(`Gen 1:1 word ${idx} "${word}" lacks ${name} U+${cp.toString(16).toUpperCase()}`);
}
if (!gen1verse1words || gen1verse1words.length < 7) {
  failures.push('Genesis 1:1 not found in an aligned Bereshit aliyah 1');
} else {
  expectMark(gen1verse1words[0], 0x0596, 'tipcha', 0);
  expectMark(gen1verse1words[1], 0x05A3, 'munach', 1);
  expectMark(gen1verse1words[2], 0x0591, 'etnachta', 2);
  const last = gen1verse1words[gen1verse1words.length - 1];
  if (MARK_RANGE.test(last)) failures.push(`Gen 1:1 final word "${last}" carries an in-range mark (should be bare siluk -> positional sof_pasuk)`);
}
if (exclusions.some((x) => x.parsha === 'Bereshit' && x.aliyah === '1'))
  failures.push('Bereshit aliyah 1 was excluded — alignment regression');
for (const st of selStats) {
  if (!st.rare && st.selected < 4)
    failures.push(`non-rare trope "${st.key}" has only ${st.selected} examples (< 4)`);
}
for (const key of Object.keys(index.tropes)) {
  if (!TROPES.some((t) => t.key === key)) failures.push(`index key "${key}" not in TROPES`);
  for (const ex of index.tropes[key]) {
    const dur = ex.e - ex.s;
    const maxDur = RARE_KEYS.has(key) ? CLIP_MAX_RARE : CLIP_MAX;
    if (ex.s == null || ex.e == null || dur < CLIP_MIN - 0.011 || dur > maxDur + 0.011)
      failures.push(`bad clip bounds for ${key}: ${JSON.stringify(ex)}`);
  }
}
if (bytes > SIZE_BUDGET) failures.push(`index is ${bytes} bytes (> ${SIZE_BUDGET}); lower CAP_PER_TROPE`);

/* ---------- report ---------- */
const zarkaLines = Object.entries(zarkaStats).map(([book, st]) =>
  `| ${book} | ${st.u0598} | ${st.u05AE} | ${st.segol} | ${st.coocc0598} | ${st.coocc05AE} |`);
const totalZ = Object.values(zarkaStats).reduce((acc, st) => ({
  u0598: acc.u0598 + st.u0598, u05AE: acc.u05AE + st.u05AE,
  coocc0598: acc.coocc0598 + st.coocc0598, coocc05AE: acc.coocc05AE + st.coocc05AE,
}), { u0598: 0, u05AE: 0, coocc0598: 0, coocc05AE: 0 });
const zarkaWinner = totalZ.coocc05AE >= totalZ.coocc0598 ? 'U+05AE (Unicode "ZINOR")' : 'U+0598 (Unicode "ZARQA")';

const report = `# Trope index build report

- **Built:** ${index.built}
- **Source:** ${SOURCE === 'export'
    ? 'Sefaria public text export bucket (storage.googleapis.com/sefaria-export, Hebrew merged.json per Torah book)'
    : 'Sefaria v3 API (version=hebrew, return_format=text_only)'}
- **Output:** \`data/trope/trope_index.json\` — ${bytes.toLocaleString('en-US')} bytes (budget ${SIZE_BUDGET.toLocaleString('en-US')})
- **Aligned aliyot:** ${alignedAliyot} of ${54 * 7} (${totalWords.toLocaleString('en-US')} sung words)
- **Selection:** words whose in-range marks (U+0591–05AF) map to exactly one trope key
  (single-occurrence marks preferred), clip ${CLIP_MIN}–${CLIP_MAX}s (${CLIP_MAX_RARE}s for
  rare-flagged marks, whose melodies are deliberately long), round-robin across
  parshiyot, cap ${CAP_PER_TROPE}/trope. Aliyah-final words are never selected (no end timing).
  Verse-final words with zero in-range marks are the positional \`sof_pasuk\` pool.

## Per-trope corpus counts

| Trope | Family | Candidates | Selected | Parshiyot | Rare |
|---|---|---|---|---|---|
${selStats.map((s) => `| ${s.key} | ${s.family} | ${s.found} | ${s.selected} | ${s.parshiyot} | ${s.rare ? 'yes' : ''} |`).join('\n')}

## Excluded aliyot (${exclusions.length})

${exclusions.length === 0 ? '_None — every aliyah aligned._'
    : exclusions.map((x) => `- ${x.parsha} aliyah ${x.aliyah}: ${x.reason}`).join('\n')}

## Zarka codepoint finding

Unicode's ZARQA (U+0598) and ZINOR (U+05AE) names are swapped relative to traditional
usage. Empirically, in this corpus the segol-clause zarka is carried by **${zarkaWinner}**
(verse-level co-occurrence with segol U+0592 shown below); the index maps BOTH codepoints
to the \`zarka\` key, and the tutor displays the dominant one.

| Book | U+0598 | U+05AE | segol U+0592 | verses w/ segol+U+0598 | verses w/ segol+U+05AE |
|---|---|---|---|---|---|
${zarkaLines.join('\n')}

Stray poetic accents U+05AB/U+05AC/U+05AD: ${strayPoetic.length === 0 ? 'none found.'
    : `${strayPoetic.reduce((n, s) => n + s.count, 0)} occurrences (ignored, as designed).`}

## Genesis 1:1 smoke test

Words (aliyah word indices 0–${gen1verse1words ? gen1verse1words.length - 1 : '?'}): ${gen1verse1words ? gen1verse1words.join(' · ') : 'UNAVAILABLE'}

- word 0 carries tipcha U+0596: ${gen1verse1words && gen1verse1words[0].includes('֖') ? '✓' : '✗'}
- word 1 carries munach U+05A3: ${gen1verse1words && gen1verse1words[1].includes('֣') ? '✓' : '✗'}
- word 2 carries etnachta U+0591: ${gen1verse1words && gen1verse1words[2].includes('֑') ? '✓' : '✗'}
- final word bare of in-range marks (positional sof_pasuk): ${gen1verse1words && !MARK_RANGE.test(gen1verse1words[gen1verse1words.length - 1]) ? '✓' : '✗'}

${failures.length === 0 ? '**All smoke tests passed.**' : '**SMOKE TEST FAILURES:**\n' + failures.map((f) => `- ${f}`).join('\n')}
`;
writeFileSync(REPORT_PATH, report);

console.log(`\nindex: ${INDEX_PATH} (${bytes.toLocaleString('en-US')} bytes)`);
console.log(`report: ${REPORT_PATH}`);
console.log(`aligned aliyot: ${alignedAliyot}; exclusions: ${exclusions.length}`);
if (failures.length) {
  console.error('\nSMOKE TEST FAILURES:');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('all smoke tests passed.');
