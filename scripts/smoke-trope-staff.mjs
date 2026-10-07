#!/usr/bin/env node
/* smoke-trope-staff.mjs — checks js/trope-staff.js's reading-staff half (the Torah Trainer's Trope staff
 * layout) without a browser: the module is loaded in a vm with a stub document, the phrase file is read from
 * data/, and a few verses of Genesis are read into units, matched to figures, stitched into a row, laid out
 * and wrapped, on all six melodies. Zero dependencies. Exits non-zero on the first failure. Run: node scripts/smoke-trope-staff.mjs */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
// Values made inside the vm have another realm's Array prototype, so structural equality is checked as JSON.
const same = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'js/trope-staff.js'), 'utf8');
const stubEl = () => ({ setAttribute() {}, appendChild() {}, style: {}, textContent: '' });
const api = vm.runInNewContext(src + '\n;({ TROPES, TROPE_CHAR_TO_KEY, TROPE_MELODIES, tropeUnitsOfVerse, tropeContextsOf, tropeChooseFigures, tropeBuildReadingRow, tropeSubRow, tropeSplitSystems, layoutPhraseStaff, _phraseSetsFrom, shiftedKey, KEY_SHARPS })',
  { document: { createElementNS: stubEl }, console });
const MELS = ['torah', 'highholiday', 'haftarah', 'esther', 'megillot', 'eicha'];
const STANDALONE = new Set(['haftarah', 'esther', 'megillot', 'eicha']);   // the Portnoy–Wolff charts: never a Torah figure among their notes
const sets = api._phraseSetsFrom(JSON.parse(readFileSync(join(root, 'data/trope/trope_phrases.json'), 'utf8')));
assert.ok(sets, 'phrase sets load');
same([...api.TROPE_MELODIES], MELS, 'the engine lists the six melodies in the pages\' order');
for (const m of MELS) assert.ok(sets[m] && sets[m].rows.length, m + ' set loads');
for (const [m, k] of [['torah', 'A'], ['highholiday', 'C'], ['haftarah', 'Eb'], ['esther', 'Eb'], ['megillot', 'C'], ['eicha', 'Eb']]) assert.equal(sets[m].key, k, `${m} is written in ${k}`);
const rowsOf = (m) => JSON.parse(readFileSync(join(root, 'data/trope/trope_phrases.json'), 'utf8')).melodies[m].rows.length;
for (const m of MELS) assert.equal(sets[m].rows.length, rowsOf(m), `every ${m} row of the file validates (64th notes included)`);
const ctx = Object.fromEntries(MELS.map((m) => [m, api.tropeContextsOf(sets[m])]));

const G = {
  '1:1': 'בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃',
  '1:2': 'וְהָאָ֗רֶץ הָיְתָ֥ה תֹ֙הוּ֙ וָבֹ֔הוּ וְחֹ֖שֶׁךְ עַל־פְּנֵ֣י תְה֑וֹם וְר֣וּחַ אֱלֹהִ֔ים מְרַחֶ֖פֶת עַל־פְּנֵ֥י הַמָּֽיִם׃',
  '1:3': 'וַיֹּ֥אמֶר אֱלֹהִ֖ים יְהִ֣י א֑וֹר וַֽיְהִי־אֽוֹר׃',
};
let n = 0;
const ok = (name) => { n++; console.log('  ok ' + name); };

// 1. units, cells, pieces
const u11 = api.tropeUnitsOfVerse(G['1:1']);
same(u11.units.map((u) => u.k), ['tipcha', 'munach', 'etnachta', 'mercha', 'tipcha', 'mercha', 'sof_pasuk']);
assert.equal(u11.cells.length, 7); assert.equal(u11.pieces.length, 7);
ok('Genesis 1:1 → 7 units in the chart\'s order (sof pasuk by position, meteg ignored)');
const u12 = api.tropeUnitsOfVerse(G['1:2']);
assert.equal(u12.units.length, 12, 'units'); assert.equal(u12.cells.length, 12, 'cells'); assert.equal(u12.pieces.length, 14, 'pieces');
assert.equal(u12.units.filter((u) => u.k === 'pashta').length, 1); assert.ok(!u12.units.some((u) => u.k === 'kadma'));
same(u12.cells[5].pieces, [5, 6]); assert.equal(u12.units[5].pi, 6);
ok('Genesis 1:2 → 12 units, 12 cells, 14 pieces (double pashta once; two maqaf compounds; the mark on the second piece)');
const u13 = api.tropeUnitsOfVerse(G['1:3']);
assert.equal(u13.units.length, 5); assert.equal(u13.cells.length, 5); assert.equal(u13.pieces.length, 6);
ok('Genesis 1:3 → 5 units, 5 cells, 6 pieces');
same(api.tropeUnitsOfVerse('אַבְרָהָ֣ם ׀ אַבְרָהָ֑ם').units.map((u) => u.k), ['munach_legarmeh', 'etnachta', 'sof_pasuk']);   // read as a whole verse: its last word closes it
ok('a ׀ after a munach makes it munach legarmeh (a paseq reads the same — the documented beta reading)');
same(api.tropeUnitsOfVerse('אֶת־פְּאַת־קֵ֣דְמָה אַלְפַּ֪יִם').cells.map((c) => c.pieces), [[0, 1, 2], [3]]);
ok('a chain of maqafs is one cell');
const merged = api.tropeUnitsOfVerse('וַיֹּאמֶר אֱלֹהִ֖ים יְהִ֣י א֑וֹר');   // first word unmarked
same(merged.cells.map((c) => c.pieces), [[0, 1], [2], [3]]); assert.equal(merged.pieces.length, 4);
ok('an unmarked word joins the word after it; every piece is kept');

// 2. figures for every unit, all six melodies (the four Portnoy–Wolff charts stand alone: no fallback chart)
for (const m of MELS) for (const ref of Object.keys(G)) {
  const u = api.tropeUnitsOfVerse(G[ref]);
  const picks = api.tropeChooseFigures(u.units, ctx[m], { melody: m, fallbackCtx: STANDALONE.has(m) ? null : ctx.torah, fallbackMelody: 'torah' });
  assert.ok(picks.every(Boolean), `${m} ${ref}: every unit picks a figure`);
  picks.forEach((p, i) => { const row = sets[p.set].rows.find((r) => r.n === p.n); assert.equal(row.units[p.ui].k, u.units[i].k, 'the pick is a figure of the same mark'); });
  if (STANDALONE.has(m)) assert.ok(picks.every((p) => p.set === m), `${ref}: every ${m} pick is from its own rows`);
}
ok('every unit of the three verses gets a figure of its own mark, on all six melodies');
// the Megillot chart's 64th notes (rows 29 and 30, the telishas) validate and lay out
{
  const r29 = sets.megillot.rows.find((r) => r.n === '29'), r30 = sets.megillot.rows.find((r) => r.n === '30');
  assert.ok(r29 && r30 && r29.notes.some((x) => x.v === '64') && r30.notes.some((x) => x.v === '64'), 'rows 29 and 30 carry 64th notes');
  for (const r of [r29, r30]) { const L = api.layoutPhraseStaff(r, 'C', 0); assert.equal(L.notes.length, r.notes.length); assert.ok(L.W > 0); }
  ok('Megillot rows 29 and 30 (64th notes) validate and lay out');
}
// the closings of the four charts: the end of a chapter takes the chart's closing row, the end of a book 39a
{
  const units = [{ k: 'munach', ci: 0, pi: 0 }, { k: 'etnachta', ci: 1, pi: 1 }, { k: 'mercha', ci: 2, pi: 2 }, { k: 'tipcha', ci: 3, pi: 3 }, { k: 'mercha', ci: 4, pi: 4 }, { k: 'sof_pasuk', ci: 5, pi: 5 }];
  const closing = (m, opts) => api.tropeChooseFigures(units, ctx[m], Object.assign({ melody: m, aliyahEnd: true }, opts)).slice(2).map((p) => p.n).join(',');
  assert.equal(closing('megillot', {}), '39,39,39,39', 'a chapter ends on 39');
  assert.equal(closing('megillot', { closingRow: '39a' }), '39a,39a,39a,39a', 'the book ends on 39a');
  assert.equal(closing('megillot', { closingRow: 'nope' }), '39,39,39,39', 'an unknown closingRow changes nothing');
  assert.equal(closing('esther', { closingRow: '39a' }), '41,41,41,41', 'Esther closes on 41 whatever the caller names');
  assert.equal(closing('eicha', {}), '38,38,38,38'); assert.equal(closing('haftarah', {}), '40,40,40,40');
  assert.ok(api.tropeChooseFigures(units, ctx.megillot, { melody: 'megillot' }).every((p) => p.n !== '39' && p.n !== '39a'), 'no closing without aliyahEnd');
  ok('closings: Megillot 39 / 39a by closingRow, Esther 41, Eicha 38, Haftarah 40');
}
// a haftarah verse (Isaiah 40:1) on the Haftarah rows: its own figures throughout, and the closing only on the haftarah's last verse
{
  const u = api.tropeUnitsOfVerse('נַחֲמ֥וּ נַחֲמ֖וּ עַמִּ֑י יֹאמַ֖ר אֱלֹהֵיכֶֽם׃');
  same(u.units.map((x) => x.k), ['mercha', 'tipcha', 'etnachta', 'tipcha', 'sof_pasuk']);
  const plain = api.tropeChooseFigures(u.units, ctx.haftarah, { melody: 'haftarah' });
  assert.ok(plain.every((p) => p && p.set === 'haftarah'), 'every unit picks a Haftarah figure with no fallback chart');
  const isEnd = (p) => sets.haftarah.rows.find((r) => r.n === p.n).tags.includes('aliyah-end');
  assert.ok(!plain.some(isEnd), 'an ordinary verse never takes a closing row');
  const end = api.tropeChooseFigures(u.units, ctx.haftarah, { melody: 'haftarah', aliyahEnd: true });
  assert.ok(end.slice(3).every(isEnd) && !end.slice(0, 3).some(isEnd), 'the last verse closes on the [aliyah-end] tipcha sof pasuk');
  assert.ok(end.slice(3).every((p) => p.n === end[3].n), 'one closing row');
  assert.equal(end[3].n, '40d', 'the tipcha sof pasuk ending closes on the derived row 40d');
  const row = api.tropeBuildReadingRow(u.units, end, u.cells, sets, { n: '40:1' });
  assert.equal(row.units.length, 5); assert.ok(row.notes.every((n) => n.r || (n.p >= -13 && n.p <= 1)), 'B♭3–C5');
  row.words.forEach((w) => { w.w = 80; });
  const L = api.layoutPhraseStaff(row, 'Eb', 0, null, { lyrics: false, accidentals: 'unit' });
  for (let i = 1; i < L.words.length; i++) assert.ok(L.words[i].cx - L.words[i].w / 2 >= L.words[i - 1].cx + L.words[i - 1].w / 2 + 6 - 1e-9, 'words do not overlap in E♭');
  assert.ok(L.W > 0 && L.notes.length === row.notes.length);
  ok('Isaiah 40:1 draws from the Haftarah rows alone, closes only as the haftarah\'s last verse, and lays out in E♭');
}
// Genesis 1:1's munach stands before etnachta: the chart prints that (rows 1–2), never munach before zakef katon
{
  const picks = api.tropeChooseFigures(u11.units, ctx.torah, { melody: 'torah' });
  const p = picks[1], row = sets.torah.rows.find((r) => r.n === p.n);
  assert.equal(row.units[p.ui + 1] && row.units[p.ui + 1].k, 'etnachta');
  ok('a connecting mark takes the figure printed before the mark that follows it (munach → etnachta)');
}
// aliyah end: a verse closing mercha tipcha mercha sof pasuk takes row 41's closing
{
  const units = [{ k: 'munach', ci: 0, pi: 0 }, { k: 'etnachta', ci: 1, pi: 1 }, { k: 'mercha', ci: 2, pi: 2 }, { k: 'tipcha', ci: 3, pi: 3 }, { k: 'mercha', ci: 4, pi: 4 }, { k: 'sof_pasuk', ci: 5, pi: 5 }];
  const picks = api.tropeChooseFigures(units, ctx.torah, { melody: 'torah', aliyahEnd: true });
  same(picks.slice(2).map((p) => p.n), ['41', '41', '41', '41']);
  same(picks.slice(2).map((p) => p.ui), [0, 1, 2, 3]);
  const plain = api.tropeChooseFigures(units, ctx.torah, { melody: 'torah' });
  assert.ok(plain.every((p) => p.n !== '41'));
  ok('the last verse of an aliyah takes the [aliyah-end] closing; any other verse never does');
}

// 3. the built row
const cellsOf = (u) => u.cells;
const row12 = (() => {
  const u = u12, picks = api.tropeChooseFigures(u.units, ctx.torah, { melody: 'torah' });
  return api.tropeBuildReadingRow(u.units, picks, u.cells, sets, { n: '1:2' });
})();
{
  const u = u12, picks = api.tropeChooseFigures(u.units, ctx.torah, { melody: 'torah' });
  const expected = picks.reduce((s, p) => { const r = sets.torah.rows.find((x) => x.n === p.n); return s + (r.units[p.ui].to - r.units[p.ui].from + 1); }, 0);
  assert.equal(row12.notes.length, expected); assert.equal(row12.units.length, 12); assert.equal(row12.words.length, 12);
  assert.ok(row12.units.every((x, i) => i === 0 || x.from === row12.units[i - 1].to + 1), 'units are contiguous');
  assert.ok(row12.syl.every((s) => s.from >= row12.units[s.unit].from && s.to <= row12.units[s.unit].to), 'syllables sit inside their unit');
  assert.ok(row12.tup.every((t) => row12.units.some((x) => t.from >= x.from && t.to <= x.to)), 'triplets inside one unit');
  ok('the built row: notes = the picked slices, contiguous units, syllables and triplets inside their figure');
}
// 4. layout with words: no overlap, unit accidentals, the tutor path untouched
{
  const wr = JSON.parse(JSON.stringify(row12));
  wr.words.forEach((w) => { w.w = 120; });   // wider than any figure, so every label must push the next one along
  const L = api.layoutPhraseStaff(wr, 'A', 0, null, { lyrics: false, accidentals: 'unit' });
  assert.equal(L.words.length, 12);
  for (let i = 1; i < L.words.length; i++) assert.ok(L.words[i].cx - L.words[i].w / 2 >= L.words[i - 1].cx + L.words[i - 1].w / 2 + 6 - 1e-9, 'words do not overlap');
  assert.ok(L.W >= L.words[11].cx + 20);
  const plain = api.layoutPhraseStaff(row12, 'A', 0, null, { lyrics: false });
  assert.ok(plain.W < L.W, 'wide labels widen the staff');
  ok('word labels never overlap and widen the staff');
  const r41 = sets.torah.rows.find((r) => r.n === '41');
  const A = api.layoutPhraseStaff(r41, 'A', 0), B = api.layoutPhraseStaff(r41, 'A', 0, null, {});
  same(A, B); assert.ok(!('words' in A));
  ok('a chart row with no options lays out exactly as before (no words key, no change)');
  // per-unit accidentals: two figures with G♮ in A major both print the natural
  const g = { n: 'x', he: '', tags: [], notes: [{ p: -4, v: 'q', t: 48 }, { p: -2, v: 'q', t: 48 }, { p: -4, v: 'q', t: 48 }], syl: [], units: [{ k: 'darga', from: 0, to: 1 }, { k: 'tevir', from: 2, to: 2 }], tup: [], slur: [] };
  const held = api.layoutPhraseStaff(g, 'A', 0), reset = api.layoutPhraseStaff(g, 'A', 0, null, { accidentals: 'unit' });
  assert.equal(held.notes.filter((o) => o.accText === '♮').length, 1); assert.equal(reset.notes.filter((o) => o.accText === '♮').length, 2);
  ok('accidentals hold to the row\'s end by default and reset at each figure with accidentals:\'unit\'');
}
// 5. wrapping
{
  const wr = JSON.parse(JSON.stringify(row12));
  wr.words.forEach((w) => { w.w = 30; });
  const sys = api.tropeSplitSystems(wr, 'A', 0, 300, { lyrics: false, accidentals: 'unit' });
  assert.ok(sys.length >= 2, 'wraps');
  const cis = sys.flatMap((s) => s.row.words.map((w) => w.ci));
  same(cis, wr.words.map((w) => w.ci));
  for (const s of sys) {
    const L = api.layoutPhraseStaff(s.row, 'A', 0, null, { lyrics: false, accidentals: 'unit' });
    assert.ok(L.W <= 300 || s.row.words.length === 1, 'each system fits (or is one word)');
    assert.equal(s.row.units[0].from, 0); assert.equal(s.row.units[s.row.units.length - 1].to, s.row.notes.length - 1);
    assert.ok(s.row.syl.every((x) => x.unit >= 0 && x.unit < s.row.units.length));
  }
  const one = api.tropeSplitSystems(wr, 'A', 0, 100000, {});
  assert.equal(one.length, 1); assert.equal(one[0].row.notes.length, wr.notes.length);
  ok('systems wrap between words, fit the width, re-index from 0, and a wide enough width gives one system');
  // 6. wrapping with note names (opts.namesOf): each system fits at the width it is drawn at
  const opts = { lyrics: false, accidentals: 'unit' };
  const namesOf = (r) => { assert.equal(r.units[0].from, 0, 'a re-indexed sub-row'); return r.notes.map((n) => (n.r ? '' : 'MMMMMMMM')); };   // a wide fake name
  const named = api.tropeSplitSystems(wr, 'A', 0, 300, Object.assign({ namesOf }, opts));
  for (const s of named) {
    const L = api.layoutPhraseStaff(s.row, 'A', 0, namesOf(s.row), opts);
    assert.ok(L.W <= 300 || s.row.words.length === 1, 'each named system fits (or is one word)');
    assert.ok(L.notes.every((o) => o.rest || o.name === 'MMMMMMMM'), 'every note carries its name');
  }
  assert.ok(named.length > sys.length, 'the names were consulted: more systems than without them');
  assert.ok(named.some((s) => s.row.words.length > 1), 'some named system packs two or more words (the fit check is not only its one-word escape)');
  same(named.flatMap((s) => s.row.words.map((w) => w.ci)), wr.words.map((w) => w.ci));
  assert.ok(sys.some((s) => api.layoutPhraseStaff(s.row, 'A', 0, namesOf(s.row), opts).W > 300), 'control: a system wrapped without names overflows once named');
  same(api.tropeSplitSystems(wr, 'A', 0, 300, opts), sys);   // the named run left the row untouched
  same(api.tropeSplitSystems(wr, 'A', 0, 300, Object.assign({ namesOf: () => null }, opts)), sys);   // null names = no names, as before
  ok('with namesOf the systems wrap at their named width and keep the words in order; null or absent names wrap as before');
}
// 7. renderPhraseStaff's rtl option: the same drawing inside a reflecting group, every glyph turned back upright and
// every rest too; without the option, the tree is exactly the LTR one (the tutor never passes it).
{
  const mk = (tag) => { const el = { tag, attrs: {}, children: [], style: {}, textContent: '', setAttribute(k, v) { this.attrs[k] = String(v); }, appendChild(c) { this.children.push(c); return c; } }; return el; };
  const api2 = vm.runInNewContext(src + '\n;({ renderPhraseStaff, _phraseSetsFrom })', { document: { createElementNS: (ns, tag) => mk(tag) }, console });
  const sets2 = api2._phraseSetsFrom(JSON.parse(readFileSync(join(root, 'data/trope/trope_phrases.json'), 'utf8')));
  const row = sets2.torah.rows.find((r) => r.notes.some((x) => x.r) && r.notes.some((x) => x.a)) || sets2.torah.rows[0];   // a row with a rest and an accidental, if the chart has one
  const walk = (el, f) => { f(el); el.children.forEach((c) => walk(c, f)); };
  const count = (root) => { let c = 0; walk(root, () => c++); return c; };
  const ltr = api2.renderPhraseStaff(row, { key: 'A', shift: 0, low: true });
  const rtl = api2.renderPhraseStaff(row, { key: 'A', shift: 0, low: true, rtl: true });
  const plain = api2.renderPhraseStaff(row, { key: 'A', shift: 0, low: true, rtl: false });
  assert.equal(JSON.stringify(plain), JSON.stringify(ltr), 'rtl:false draws the LTR tree exactly');
  assert.ok(ltr.children.length > 3 && ltr.children[0].tag === 'g' && ltr.children.every((c) => c.tag !== 'g' || c.attrs.class !== 'tu-rtl'), 'LTR: deco, notes, over and syllables straight under the svg, no reflecting group');
  assert.equal(rtl.children.length, 1, 'RTL: one child, the reflecting group');
  const g = rtl.children[0];
  assert.equal(g.tag, 'g'); assert.equal(g.attrs.class, 'tu-rtl'); assert.equal(g.attrs.transform, 'matrix(-1 0 0 1 ' + ltr.attrs.viewBox.split(' ')[2] + ' 0)', 'reflected about the row\'s middle');
  assert.equal(count(g), count(ltr), 'the same number of elements under the group as under the LTR svg');
  const texts = []; walk(g, (el) => { if (el.tag === 'text') texts.push(el); });
  assert.ok(texts.length >= 3, 'a clef, an 8, a signature…');
  for (const t of texts) {
    assert.equal(t.attrs.transform, 'matrix(-1 0 0 1 ' + Math.round(2 * Number(t.attrs.x) * 100) / 100 + ' 0)', 'every glyph is turned back about its own x');
    assert.ok(['middle', 'end', 'start'].includes(t.attrs['text-anchor']), 'anchored');
  }
  const ltrTexts = []; walk(ltr, (el) => { if (el.tag === 'text') ltrTexts.push(el); });
  assert.ok(ltrTexts.every((t) => t.attrs.transform === undefined), 'the LTR glyphs carry no transform');
  assert.ok(ltrTexts.some((t) => (t.attrs['text-anchor'] || 'start') === 'start'), 'control: the clef and signature are start-anchored');
  texts.forEach((t, i) => { const a = ltrTexts[i].attrs['text-anchor'] || 'start'; assert.equal(t.attrs['text-anchor'], a === 'middle' ? 'middle' : a === 'end' ? 'start' : 'end', 'a start-anchored glyph anchors at its end, the middle stays'); });
  const rests = []; walk(g, (el) => { if (el.tag === 'g' && /is-rest/.test(el.attrs.class || '')) rests.push(el); });
  assert.equal(rests.length, row.notes.filter((x) => x.r).length);
  for (const r of rests) assert.ok(/^matrix\(-1 0 0 1 [\d.]+ 0\)$/.test(r.attrs.transform), 'a rest is turned back upright');
  ok('rtl: the reflecting group, every glyph and rest upright, anchors swapped; rtl:false and absent draw the same LTR tree');
}

console.log(`smoke-trope-staff: ${n} checks passed`);
