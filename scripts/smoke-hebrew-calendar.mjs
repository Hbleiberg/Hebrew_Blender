#!/usr/bin/env node
/* smoke-hebrew-calendar.mjs — checks js/hebrew-calendar.js (the Torah Trainer's parasha-by-date) without a
 * browser: the module is loaded in a vm, the converter is round-tripped over two centuries, and the weekly
 * reading table is pinned by dates whose parasha is known, on both schedules. Zero dependencies. Exits
 * non-zero on the first failure. Run: node scripts/smoke-hebrew-calendar.mjs
 *
 * --hebcal: also compares every Shabbat of 5700–5900 (1939–2140), Diaspora and Israel, against Hebcal's
 * year-type tables. That needs @hebcal/core (GPL-2.0 — a dev-time oracle only; nothing of it is copied or
 * shipped): run `npm install --no-save @hebcal/core` in a directory outside the repo and point at it with
 * HEBCAL_DIR=<that dir>, or install it in the repo root (node_modules/ is gitignored). */
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'js/hebrew-calendar.js'), 'utf8');
const ctx = { window: {}, console };
vm.runInNewContext(src, ctx);
const H = ctx.window.HebCal;
// Values made inside the vm have another realm's prototypes, so structural equality is checked as JSON.
const same = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);
const names = JSON.parse(readFileSync(join(root, 'data/parshiyot.json'), 'utf8')).map((p) => p.en);
assert.equal(names.length, 54, 'parshiyot.json has 54 entries');
assert.equal(names[H.P.VAYAKHEL], 'Vayakhel'); assert.equal(names[H.P.NITZAVIM], 'Nitzavim'); assert.equal(names[H.P.VEZOT], "V'Zot HaBerachah");

let n = 0;
const ok = (name) => { n++; console.log('  ok ' + name); };
const read = (d, israel) => {
  const r = H.parshaForDate(d, { israel });
  return r.kind === 'parsha' ? r.idx.map((i) => names[i]).join('-') : r.holiday + ' ' + r.day;
};

// 1. the converter: every day of 1900–2100 round-trips, and the year lengths are the six Hebrew ones
{
  const a = H.gregorianToJDN(1900, 1, 1), b = H.gregorianToJDN(2100, 12, 31);
  for (let j = a; j <= b; j++) {
    const g = H.jdnToGregorian(j);
    assert.equal(H.gregorianToJDN(g.y, g.m, g.d), j, 'civil round trip ' + j);
    const h = H.jdnToHebrew(j);
    assert.equal(H.hebrewToJDN(h.year, h.month, h.day), j, 'hebrew round trip ' + j);
  }
  for (let y = 5660; y <= 5900; y++) assert.ok([353, 354, 355, 383, 384, 385].includes(H.hebrewYearLength(y)), 'year length ' + y);
  assert.equal(H.dayOfWeek(H.gregorianToJDN(2000, 1, 1)), 6, '2000-01-01 was a Shabbat');
  same(H.jdnToHebrew(H.gregorianToJDN(2026, 3, 14)), { year: 5786, month: 6, day: 25 }, '2026-03-14 is 25 Adar 5786');
  assert.equal(H.monthKeyOf(6, 5786), 'adar'); assert.equal(H.monthKeyOf(6, 5787), 'adar1'); assert.equal(H.monthKeyOf(8, 5787), 'nisan');
  ok('converter round-trips 1900–2100; year lengths; weekday; 25 Adar 5786; month keys');
}

// 2. the reading table, pinned by known Shabbatot (D = Diaspora, I = Israel)
const KNOWN = [
  ['2025-03-22', 'D', 'Vayakhel'], ['2025-03-29', 'D', 'Pekudei'], ['2025-04-12', 'D', 'Tzav'],          // a 25-Shabbat regular year: nothing doubled before Pesach
  ['2026-03-14', 'D', 'Vayakhel-Pekudei'], ['2026-03-28', 'D', 'Tzav'],                                  // a 24-Shabbat one: Vayakhel-Pekudei
  ['2011-04-16', 'D', 'Achrei Mot'], ['2011-04-09', 'D', 'Metzora'],                                     // a long leap year reaches Achrei Mot before Pesach
  ['2024-04-20', 'D', 'Metzora'], ['2024-04-13', 'D', 'Tazria'],                                         // a leap year: Metzora before Pesach
  ['2025-05-24', 'D', 'Behar-Bechukotai'], ['2025-05-10', 'D', 'Achrei Mot-Kedoshim'], ['2025-05-03', 'D', 'Tazria-Metzora'], ['2025-05-31', 'D', 'Bamidbar'],
  ['2018-04-07', 'I', 'Shemini'], ['2018-04-07', 'D', 'pesach 8'],                                       // Pesach's eighth day on a Shabbat: Israel reads on
  ['2018-05-05', 'I', 'Behar'], ['2018-05-12', 'I', 'Bechukotai'], ['2018-05-12', 'D', 'Behar-Bechukotai'],   // …and separates Behar-Bechukotai
  ['2023-05-27', 'D', 'shavuot 2'], ['2023-05-27', 'I', 'Nasso'],                                        // Shavuot's second day on a Shabbat
  ['2023-07-01', 'D', 'Chukat-Balak'], ['2023-06-24', 'I', 'Chukat'], ['2023-07-01', 'I', 'Balak'],       // …so the Diaspora doubles Chukat-Balak
  ['2023-07-15', 'D', 'Matot-Masei'], ['2023-07-15', 'I', 'Matot-Masei'], ['2022-07-30', 'D', 'Matot-Masei'],
  ['2023-07-22', 'D', 'Devarim'], ['2023-07-29', 'D', "Va'etchanan"],                                   // Devarim on the Shabbat before 9 Av (Thursday 27 July)
  ['2025-09-20', 'D', 'Nitzavim'], ['2025-09-27', 'D', 'Vayeilech'], ['2025-10-04', 'D', "Ha'azinu"],   // Rosh Hashanah on a Tuesday: two open Tishrei Shabbatot
  ['2023-09-09', 'D', 'Nitzavim-Vayeilech'], ['2023-09-23', 'D', "Ha'azinu"],                          // …on a Shabbat: one
  ['2024-09-28', 'D', 'Nitzavim-Vayeilech'], ['2024-10-05', 'D', "Ha'azinu"], ['2024-10-12', 'D', 'yom_kippur 1'],   // …on a Thursday: Yom Kippur takes the second
  ['2023-09-16', 'D', 'rosh_hashanah 1'], ['2023-09-30', 'D', 'sukkot 1'], ['2023-09-30', 'I', 'sukkot 1'], ['2023-10-07', 'D', 'shmini_atzeret 1'],
  ['2023-10-14', 'D', 'Bereshit'], ['2023-10-14', 'I', 'Bereshit'], ['2024-04-27', 'D', 'chol_hamoed_pesach 4'], ['2025-04-19', 'D', 'pesach 7'],
  ['2026-09-29', 'D', 'shmini_atzeret 1'], ['2026-10-03', 'D', 'shmini_atzeret 1'], ['2026-10-10', 'D', 'Bereshit'],
  ['2026-04-04', 'D', 'chol_hamoed_pesach 2'], ['2026-04-04', 'I', 'chol_hamoed_pesach 2'],
];
for (const [d, s, want] of KNOWN) assert.equal(read(d, s === 'I'), want, `${d} ${s}`);
ok(`${KNOWN.length} known Shabbatot read right on both schedules`);
// a weekday looks up to its coming Shabbat; a Shabbat is its own
{
  const r = H.parshaForDate('2026-03-10', { israel: false });
  assert.equal(r.shabbat.d, 14); assert.equal(r.heb.d, 25); assert.equal(r.heb.monthKey, 'adar'); assert.equal(r.hyear, 5786);
  assert.equal(H.parshaForDate('2026-03-14', {}).jdn, r.jdn);
  const t = H.parshaForDate('2025-10-04', {});   // Ha'azinu in Tishrei 5786 belongs to the reading year 5785
  assert.equal(t.heb.y, 5786); assert.equal(t.hyear, 5785);
  ok('a weekday reads its coming Shabbat; Tishrei before Bereshit belongs to the year before');
}
// every Shabbat of 5660–5900 is placed, every parasha but V'Zot HaBerachah read once a year, in order
for (let y = 5660; y <= 5900; y++) for (const israel of [false, true]) {
  const t = H.sedraForYear(y, israel);
  const seen = [];
  for (let j = t.bereshit; j < t.bereshitNext; j += 7) {
    const r = t.table.get(j);
    assert.ok(r, `${y} ${israel}: Shabbat ${j} placed`);
    if (r.kind === 'parsha') seen.push(...r.idx);
  }
  same(seen, Array.from({ length: 53 }, (_, i) => i), `${y} ${israel}: Bereshit … Ha'azinu once each, in order`);
}
ok('5660–5900 × both schedules: every Shabbat placed, 53 parshiyot once each in order');

// 3. triennial helpers
assert.equal(H.triennialYear(5786), 1); assert.equal(H.triennialYear(5784), 2); assert.equal(H.triennialYear(5785), 3);
assert.equal(H.triennialCycleStart(5788), 5786);
assert.equal(H.doubledPattern(H.P.VAYAKHEL, 5786, {}), 'TST', 'Vayakhel-Pekudei: together 5786, apart 5787, together 5788');
assert.equal(H.doubledFirstOf(H.P.PEKUDEI), H.P.VAYAKHEL); assert.equal(H.doubledFirstOf(H.P.BERESHIT), null);
{
  const nx = H.nextOccurrence(H.P.PEKUDEI, '2026-04-01', {});
  assert.equal(nx.shabbat.y, 2027); same(nx.idx, [H.P.PEKUDEI]); assert.equal(nx.hyear, 5787);
  const st = H.nextOccurrence(H.P.HAAZINU, '2025-10-01', {});
  assert.equal(st.hyear, 5785, 'Ha\'azinu of Tishrei 5786 is the reading year 5785');
  ok('triennial year, cycle start, doubled pattern, next occurrence');
}

// 4. --hebcal: the oracle, every Shabbat of 5700–5900 on both schedules
if (process.argv.includes('--hebcal')) {
  const dir = process.env.HEBCAL_DIR || root;
  const core = await import(pathToFileURL(join(dir, 'node_modules/@hebcal/core/dist/esm/index.js')).href);
  // Compared by index (core.parshiot is Hebcal's 0-based list; its spellings differ from parshiyot.json's).
  const hebcalIdx = new Map(core.parshiot.map((p, i) => [p, i]));
  let count = 0, bad = 0;
  for (let y = 5700; y <= 5900; y++) for (const israel of [false, true]) {
    const sedra = core.getSedra(y, israel);
    const t = H.sedraForYear(y, israel);
    for (let j = t.bereshit; j < t.bereshitNext; j += 7) {
      const g = H.jdnToGregorian(j);
      const hd = new core.HDate(new Date(g.y, g.m - 1, g.d));
      const theirs = sedra.lookup(hd);
      const mine = t.table.get(j);
      const a = theirs.chag ? 'chag' : theirs.parsha.map((p) => hebcalIdx.get(p)).join('-');
      const b = mine.kind === 'holiday' ? 'chag' : mine.idx.join('-');
      count++;
      if (a !== b) { bad++; if (bad <= 20) console.log(`  MISMATCH ${g.y}-${g.m}-${g.d} ${israel ? 'IL' : 'D'}: hebcal ${a}, ours ${b}`); }
    }
  }
  assert.equal(bad, 0, `${bad} of ${count} Shabbatot differ from Hebcal`);
  ok(`--hebcal: ${count} Shabbatot of 5700–5900 on both schedules agree with Hebcal`);
}

console.log(`smoke-hebrew-calendar: ${n} checks passed`);
