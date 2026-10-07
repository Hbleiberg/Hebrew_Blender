#!/usr/bin/env node
/* smoke-hebrew-calendar.mjs — checks js/hebrew-calendar.js (the Torah Trainer's parasha-by-date) without a
 * browser: the module is loaded in a vm, the converter is round-tripped over two centuries, the weekly
 * reading table is pinned by dates whose parasha is known, on both schedules, and the special Shabbatot
 * (specialShabbat) by dates whose maftir and haftarah are known. Zero dependencies. Exits non-zero on the
 * first failure. Run: node scripts/smoke-hebrew-calendar.mjs
 *
 * --hebcal: also compares every Shabbat of 5700–5900 (1939–2140), Diaspora and Israel, against Hebcal's
 * year-type tables, and its special reading against @hebcal/leyning's. That needs @hebcal/core (GPL-2.0 — a
 * dev-time oracle only; nothing of it is copied or shipped) and @hebcal/leyning (BSD-2-Clause, the source
 * the special-Shabbat rules are ported from): run `npm install --no-save @hebcal/core @hebcal/leyning` in a
 * directory outside the repo and point at it with HEBCAL_DIR=<that dir>, or install them in the repo root
 * (node_modules/ is gitignored). */
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

// 2b. the special Shabbatot: one date per rule (the reading @hebcal/leyning names on it, nearest 2026), and none on
// a plain Shabbat, a festival Shabbat, or Re'eh on Erev Rosh Chodesh Elul (no Machar Chodesh in Av)
const KNOWN_SPECIAL = [
  ['2026-12-05', 'D', 'chanukah', 1], ['2023-12-09', 'I', 'chanukah', 2], ['2024-12-28', 'D', 'chanukah', 3], ['2028-12-16', 'I', 'chanukah', 4],
  ['2029-12-08', 'D', 'chanukah', 7], ['2026-12-12', 'I', 'chanukah', 8], ['2025-12-20', 'D', 'rosh_chodesh_chanukah', 6],
  ['2026-02-14', 'I', 'shekalim'], ['2025-03-01', 'D', 'shekalim_rosh_chodesh'], ['2026-02-28', 'D', 'zachor'], ['2026-03-07', 'I', 'parah'],
  ['2026-03-14', 'D', 'hachodesh'], ['2029-03-17', 'I', 'hachodesh_rosh_chodesh'], ['2026-03-28', 'D', 'hagadol'],
  ['2025-09-27', 'I', 'shuva_vayeilech'], ['2026-09-19', 'D', 'shuva_haazinu'],
  ['2026-07-04', 'D', 'pinchas_after_17_tammuz'], ['2026-04-18', 'I', 'rosh_chodesh'], ['2008-08-02', 'D', 'rosh_chodesh_masei'],
  ['2025-07-26', 'I', 'rosh_chodesh_masei'], ['2029-08-25', 'D', 'ki_teitzei_consolation'], ['2022-05-07', 'D', 'kedoshim_special'],
  ['2035-05-05', 'I', 'kedoshim_special'], ['2026-05-16', 'D', 'machar_chodesh'],
];
for (const [d, s, key, day] of KNOWN_SPECIAL) {
  const r = H.specialShabbat(d, { israel: s === 'I' });
  assert.ok(r && r.key === key && (day === undefined || r.day === day) && r.kind === 'parsha', `${d} ${s}: ${key}${day ? ' day ' + day : ''} (got ${r && r.key} ${r && r.day || ''})`);
}
assert.equal(H.specialShabbat('2026-03-21', {}), null, 'Vayikra, 3 Nisan 5786: a plain Shabbat');
assert.equal(H.specialShabbat('2026-04-04', {}), null, 'Shabbat Chol HaMoed Pesach: no parasha, so nothing to replace');
assert.equal(H.specialShabbat('2025-08-23', {}), null, "Re'eh on 29 Av 5785, Erev Rosh Chodesh Elul: keeps its own haftarah");
assert.equal(new Set(KNOWN_SPECIAL.map((k) => k[2])).size, H.SPECIAL_KEYS.length, 'every special key is pinned by a date');
ok(`${KNOWN_SPECIAL.length} special Shabbatot named right (all ${H.SPECIAL_KEYS.length} keys), and none where there is none`);

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
  // the special reading of every parasha Shabbat against @hebcal/leyning's getLeyningOnDate (its `reason` names the
  // key of holiday-readings.json that replaced the maftir or the haftarah; nothing names one when the parasha reads its own)
  const ley = await import(pathToFileURL(join(dir, 'node_modules/@hebcal/leyning/dist/esm/index.js')).href);
  const hebcalKey = (r) => {
    if (!r) return '';
    const K = { shuva_vayeilech: 'Shabbat Shuva (with Vayeilech)', shuva_haazinu: "Shabbat Shuva (with Ha'azinu)", rosh_chodesh_chanukah: 'Shabbat Rosh Chodesh Chanukah',
      shekalim: 'Shabbat Shekalim', shekalim_rosh_chodesh: 'Shabbat Shekalim (on Rosh Chodesh)', zachor: 'Shabbat Zachor', parah: 'Shabbat Parah',
      hachodesh: 'Shabbat HaChodesh', hachodesh_rosh_chodesh: 'Shabbat HaChodesh (on Rosh Chodesh)', hagadol: 'Shabbat HaGadol',
      pinchas_after_17_tammuz: 'Pinchas occurring after 17 Tammuz', rosh_chodesh: 'Shabbat Rosh Chodesh', ki_teitzei_consolation: 'Ki Teitzei with 3rd Haftarah of Consolation',
      kedoshim_special: 'Kedoshim following Special Shabbat', machar_chodesh: 'Shabbat Machar Chodesh' };
    if (r.key === 'chanukah') return `Chanukah Day ${r.day} (on Shabbat)`;
    if (r.key === 'rosh_chodesh_masei') return (r.idx.length === 2 ? 'Matot-Masei' : 'Masei') + ' on Shabbat Rosh Chodesh';
    return K[r.key] || 'unknown ' + r.key;
  };
  let sc = 0, sbad = 0;
  for (let y = 5700; y <= 5900; y++) for (const israel of [false, true]) {
    const t = H.sedraForYear(y, israel);
    for (let j = t.bereshit; j < t.bereshitNext; j += 7) {
      const g = H.jdnToGregorian(j);
      const reading = ley.getLeyningOnDate(new core.HDate(new Date(g.y, g.m - 1, g.d)), israel);
      if (!reading || !reading.parsha) continue;   // a festival Shabbat
      const reason = reading.reason || {};
      const theirs = reason.haftara || reason.M || '', mine = hebcalKey(H.specialShabbat(g, { israel }));
      sc++;
      if (theirs !== mine) { sbad++; if (sbad <= 20) console.log(`  MISMATCH ${g.y}-${g.m}-${g.d} ${israel ? 'IL' : 'D'}: hebcal "${theirs}", ours "${mine}"`); }
    }
  }
  assert.equal(sbad, 0, `${sbad} of ${sc} parasha Shabbatot differ from @hebcal/leyning on the special reading`);
  ok(`--hebcal: ${sc} parasha Shabbatot of 5700–5900 on both schedules agree with @hebcal/leyning on the special reading`);
}

console.log(`smoke-hebrew-calendar: ${n} checks passed`);
