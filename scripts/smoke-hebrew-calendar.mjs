#!/usr/bin/env node
/* smoke-hebrew-calendar.mjs — checks js/hebrew-calendar.js (the Torah Trainer's parasha-by-date) without a
 * browser: the module is loaded in a vm, the converter is round-tripped over two centuries, the weekly
 * reading table is pinned by dates whose parasha is known, on both schedules, and the special Shabbatot
 * (specialShabbat) by dates whose maftir and haftarah are known, and the holidays of a year (the Holiday
 * Guide's countdown) by known first days and countdown cases. Zero dependencies. Exits non-zero on the
 * first failure. Run: node scripts/smoke-hebrew-calendar.mjs
 *
 * --hebcal: also compares every Shabbat of 5700–5900 (1939–2140), Diaspora and Israel, against Hebcal's
 * year-type tables, its special reading against @hebcal/leyning's, and the fifteen holidays' first days of
 * 5765–5900 against Hebcal's calendar. That needs @hebcal/core (GPL-2.0 — a
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

// 2c. the holidays of a year (the Holiday Guide's countdown): first days pinned by known dates, the rules that
// move a day (Yom HaShoah off a Friday or a Sunday, Yom HaAtzmaut off a Friday, a Shabbat or a Monday with Yom
// HaZikaron the day before, Tisha B'Av off a Shabbat, Purim in Adar II), the second days by schedule, and the
// countdown: before, the eve, under way, and the next one after it.
{
  const iso = (j) => { const g = H.jdnToGregorian(j); return `${g.y}-${String(g.m).padStart(2, '0')}-${String(g.d).padStart(2, '0')}`; };
  const first = (hy, key, israel) => iso(H.holidaysOfYear(hy, { israel })[key].start);
  assert.equal(H.HOLIDAY_KEYS.length, 15);
  const FIRST = [
    [5785, 'yom_hashoah', '2025-04-24'], [5785, 'yom_hazikaron', '2025-04-30'], [5785, 'yom_haatzmaut', '2025-05-01'], [5785, 'tisha_bav', '2025-08-03'],
    [5786, 'rosh_hashanah', '2025-09-23'], [5786, 'yom_kippur', '2025-10-02'], [5786, 'sukkot', '2025-10-07'], [5786, 'shmini_atzeret', '2025-10-14'],
    [5786, 'chanukah', '2025-12-15'], [5786, 'tu_bishvat', '2026-02-02'], [5786, 'purim', '2026-03-03'], [5786, 'pesach', '2026-04-02'],
    [5786, 'yom_hashoah', '2026-04-14'], [5786, 'yom_hazikaron', '2026-04-21'], [5786, 'yom_haatzmaut', '2026-04-22'], [5786, 'lag_baomer', '2026-05-05'],
    [5786, 'yom_yerushalayim', '2026-05-15'], [5786, 'shavuot', '2026-05-22'], [5786, 'tisha_bav', '2026-07-23'],
    [5787, 'rosh_hashanah', '2026-09-12'], [5787, 'yom_kippur', '2026-09-21'], [5787, 'sukkot', '2026-09-26'], [5787, 'shmini_atzeret', '2026-10-03'],
    [5787, 'chanukah', '2026-12-05'], [5787, 'tu_bishvat', '2027-01-23'], [5787, 'purim', '2027-03-23'], [5787, 'pesach', '2027-04-22'],
    [5787, 'yom_hashoah', '2027-05-04'], [5787, 'yom_haatzmaut', '2027-05-12'], [5787, 'lag_baomer', '2027-05-25'], [5787, 'shavuot', '2027-06-11'],
    [5787, 'tisha_bav', '2027-08-12'],
    [5788, 'yom_hashoah', '2028-04-24'], [5788, 'yom_hazikaron', '2028-05-01'], [5788, 'yom_haatzmaut', '2028-05-02'],
    [5789, 'yom_haatzmaut', '2029-04-19'], [5789, 'tisha_bav', '2029-07-22'],
  ];
  for (const [hy, key, want] of FIRST) assert.equal(first(hy, key, false), want, `${key} ${hy}`);
  // the weekday each moved day lands on: Yom HaAtzmaut never Friday, Shabbat or Monday; Yom HaShoah never Friday or
  // Sunday; Tisha B'Av never Shabbat; and the fifteen in calendar order with no two sharing a day, 5660–5900
  for (let y = 5660; y <= 5900; y++) for (const israel of [false, true]) {
    const h = H.holidaysOfYear(y, { israel });
    assert.ok(![5, 6, 1].includes(H.dayOfWeek(h.yom_haatzmaut.start)), `${y}: Yom HaAtzmaut's weekday`);
    assert.equal(h.yom_hazikaron.start, h.yom_haatzmaut.start - 1);
    assert.ok(![5, 0].includes(H.dayOfWeek(h.yom_hashoah.start)), `${y}: Yom HaShoah's weekday`);
    assert.notEqual(H.dayOfWeek(h.tisha_bav.start), 6, `${y}: Tisha B'Av's weekday`);
    let prevEnd = -Infinity;
    for (const key of H.HOLIDAY_KEYS) { assert.ok(h[key].start > prevEnd, `${y} ${israel}: ${key} follows the one before it`); prevEnd = h[key].start + h[key].days - 1; }
    assert.ok(prevEnd < H.holidaysOfYear(y + 1, { israel }).rosh_hashanah.start - 1, `${y}: Tisha B'Av ends before the next Erev Rosh Hashanah`);
    assert.equal(h.purim.start, H.hebrewToJDN(y, H.hebrewLeapYear(y) ? 7 : 6, 14), `${y}: Purim is in the Adar before Nisan`);
  }
  same([H.holidaysOfYear(5787, {}).shmini_atzeret.days, H.holidaysOfYear(5787, {}).pesach.days, H.holidaysOfYear(5787, {}).shavuot.days], [2, 8, 2], 'Diaspora second days');
  same([H.holidaysOfYear(5787, { israel: true }).shmini_atzeret.days, H.holidaysOfYear(5787, { israel: true }).pesach.days, H.holidaysOfYear(5787, { israel: true }).shavuot.days], [1, 7, 1], 'Israel: one day');
  ok(`${FIRST.length} holiday first days; the moved days' weekdays, the order and the second days over 5660–5900`);

  // [date, schedule, key, state, daysToEve, day]
  const NEXT = [
    ['2026-11-17', 'D', 'chanukah', 'before', 17, 0], ['2026-12-03', 'D', 'chanukah', 'before', 1, 0], ['2026-12-04', 'D', 'chanukah', 'eve', 0, 0],
    ['2026-12-05', 'D', 'chanukah', 'during', 0, 1], ['2026-12-12', 'D', 'chanukah', 'during', 0, 8], ['2026-12-13', 'D', 'tu_bishvat', 'before', 40, 0],
    ['2026-10-02', 'D', 'sukkot', 'during', 0, 7], ['2026-10-04', 'D', 'shmini_atzeret', 'during', 0, 2], ['2026-10-04', 'I', 'chanukah', 'before', 61, 0],
    ['2027-04-29', 'D', 'pesach', 'during', 0, 8], ['2027-04-29', 'I', 'yom_hashoah', 'before', 4, 0],
    ['2027-05-11', 'D', 'yom_hazikaron', 'during', 0, 1], ['2027-05-12', 'D', 'yom_haatzmaut', 'during', 0, 1],
    ['2029-07-21', 'D', 'tisha_bav', 'eve', 0, 0], ['2028-09-20', 'D', 'rosh_hashanah', 'eve', 0, 0], ['2028-09-01', 'D', 'rosh_hashanah', 'before', 19, 0],
  ];
  for (const [d, s, key, state, toEve, day] of NEXT) {
    const o = H.nextHoliday(d, { israel: s === 'I' });
    same([o.key, o.state, o.daysToEve, o.day], [key, state, toEve, day], `nextHoliday ${d} ${s}`);
  }
  const ch = H.holidayOccurrence('chanukah', '2026-11-17', {});
  same([ch.hyear, ch.eveDate, ch.startDate, ch.endDate, ch.days], [5787, { d: 4, m: 12, y: 2026 }, { d: 5, m: 12, y: 2026 }, { d: 12, m: 12, y: 2026 }, 8], 'Chanukah 5787');
  assert.equal(H.dayOfWeek(ch.eve), 5, 'its first candle is a Friday evening');
  assert.equal(H.holidayOccurrence('chanukah', '2026-12-13', {}).hyear, 5788, 'once over, the next year\'s');
  assert.equal(H.holidayOccurrence('rosh_hashanah', '2026-09-11', {}).state, 'eve', 'Erev Rosh Hashanah is in the year before');
  assert.equal(H.holidayOccurrence('shabbat', '2026-11-17', {}), null); assert.equal(H.holidayOccurrence('purim', 'nonsense', {}), null);
  ok(`${NEXT.length} countdown cases: before, the eve, under way, the next one, both schedules, across the year`);
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
  // the fifteen holidays' first days, 5765–5900 on both schedules (Hebcal dates Chanukah's first candle on the eve,
  // 24 Kislev: a day before the first day; the moved days carry "(observed)" in some versions)
  const HOLIDAY_NAME = [[/^Rosh Hashana \d+$/, 'rosh_hashanah', 0], [/^Yom Kippur$/, 'yom_kippur', 0], [/^Sukkot I$/, 'sukkot', 0],
    [/^Shmini Atzeret$/, 'shmini_atzeret', 0], [/^Chanukah: 1 Candle$/, 'chanukah', 1], [/^Tu BiShvat$/, 'tu_bishvat', 0], [/^Purim$/, 'purim', 0],
    [/^Pesach I$/, 'pesach', 0], [/^Yom HaShoah$/, 'yom_hashoah', 0], [/^Yom HaZikaron$/, 'yom_hazikaron', 0], [/^Yom HaAtzma.ut$/, 'yom_haatzmaut', 0],
    [/^Lag BaOmer$/, 'lag_baomer', 0], [/^Yom Yerushalayim$/, 'yom_yerushalayim', 0], [/^Shavuot( I)?$/, 'shavuot', 0], [/^Tish.a B.Av( \(observed\))?$/, 'tisha_bav', 0]];
  let hc = 0, hbad = 0;
  for (let y = 5765; y <= 5900; y++) for (const israel of [false, true]) {
    const mine = H.holidaysOfYear(y, { israel }), theirs = {};
    for (const e of core.HebrewCalendar.calendar({ year: y, isHebrewYear: true, il: israel })) {
      const hit = HOLIDAY_NAME.find(([re]) => re.test(e.getDesc()));
      if (!hit) continue;
      const g = e.getDate().greg();
      theirs[hit[1]] = H.gregorianToJDN(g.getFullYear(), g.getMonth() + 1, g.getDate()) + hit[2];
    }
    for (const key of H.HOLIDAY_KEYS) {
      hc++;
      if (theirs[key] !== mine[key].start) { hbad++; if (hbad <= 20) console.log(`  MISMATCH ${key} ${y} ${israel ? 'IL' : 'D'}: hebcal ${theirs[key]}, ours ${mine[key].start}`); }
    }
  }
  assert.equal(hbad, 0, `${hbad} of ${hc} holiday first days differ from Hebcal`);
  ok(`--hebcal: ${hc} holiday first days of 5765–5900 on both schedules agree with Hebcal`);
}

console.log(`smoke-hebrew-calendar: ${n} checks passed`);
