#!/usr/bin/env node
/* smoke-trope-staff.mjs — checks js/trope-staff.js's reading-staff half (the Torah Trainer's Trope staff
 * layout) without a browser: the module is loaded in a vm with a stub document, the phrase file is read from
 * data/, and a few verses of Genesis are read into units, matched to figures, stitched into a row, laid out
 * and wrapped. Zero dependencies. Exits non-zero on the first failure. Run: node scripts/smoke-trope-staff.mjs */
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
const api = vm.runInNewContext(src + '\n;({ TROPES, TROPE_CHAR_TO_KEY, tropeUnitsOfVerse, tropeContextsOf, tropeChooseFigures, tropeBuildReadingRow, tropeSubRow, tropeSplitSystems, layoutPhraseStaff, _phraseSetsFrom, shiftedKey, KEY_SHARPS })',
  { document: { createElementNS: stubEl }, console });
const sets = api._phraseSetsFrom(JSON.parse(readFileSync(join(root, 'data/trope/trope_phrases.json'), 'utf8')));
assert.ok(sets && sets.torah && sets.highholiday, 'phrase sets load');
const ctx = { torah: api.tropeContextsOf(sets.torah), highholiday: api.tropeContextsOf(sets.highholiday) };

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

// 2. figures for every unit, both melodies
for (const m of ['torah', 'highholiday']) for (const ref of Object.keys(G)) {
  const u = api.tropeUnitsOfVerse(G[ref]);
  const picks = api.tropeChooseFigures(u.units, ctx[m], { melody: m, fallbackCtx: ctx.torah, fallbackMelody: 'torah' });
  assert.ok(picks.every(Boolean), `${m} ${ref}: every unit picks a figure`);
  picks.forEach((p, i) => { const row = sets[p.set].rows.find((r) => r.n === p.n); assert.equal(row.units[p.ui].k, u.units[i].k, 'the pick is a figure of the same mark'); });
}
ok('every unit of the three verses gets a figure of its own mark, on both melodies');
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
console.log(`smoke-trope-staff: ${n} checks passed`);
