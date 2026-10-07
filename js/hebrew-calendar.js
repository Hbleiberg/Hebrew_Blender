/* ══════════════════════════════════════════════════════
   IvritSuite — the Hebrew calendar and the weekly parasha: js/hebrew-calendar.js
   Loaded by torah_trainer.html and classroom_dashboard.html (its parsha line), each
   as a classic script placed before the page's inline <script> (window.HebCal).
   It reads no `settings`, no `I18n` and no DOM: dates
   go in as {y, m, d} or a Date, readings come out as parasha indices (0 =
   Bereshit … 53 = V'Zot HaBerachah, parshiyot.json's `n` − 1) and holiday keys;
   the page owns every name shown. Proved offline by scripts/smoke-hebrew-calendar.mjs
   (and, with --hebcal, against Hebcal's tables — never shipped: they are GPL).
   Contents: the Reingold-Dershowitz converter (the block classroom_dashboard.html
   carries inline), the weekly reading table for a year (a count-based fit of the
   54 parshiyot to the Shabbatot between one Bereshit and the next, with the
   traditional anchors and doubling preferences — docs/reference/torah-and-trope.md
   → Reading schedule), the special Shabbatot (the maftir and haftarah that replace a
   parasha's own: specialShabbat, a port of @hebcal/leyning's precedence, which is
   BSD-2-Clause), and the triennial-cycle helpers.
   ══════════════════════════════════════════════════════ */
'use strict';
(function () {
  /* ────────── HEBREW CALENDAR (Reingold-Dershowitz) ────────── */
  function gregorianToJDN(y, m, d) {
    const a  = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy
         + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  function hebrewLeapYear(y) { return ((7 * y + 1) % 19) < 7; }
  function hebrewMonthsInYear(y) { return hebrewLeapYear(y) ? 13 : 12; }

  function hebrewCalendarElapsedDays(y) {
    const monthsElapsed = 235 * Math.floor((y - 1) / 19) + 12 * ((y - 1) % 19) +
                          Math.floor((7 * ((y - 1) % 19) + 1) / 19);
    const partsElapsed  = 204 + 793 * (monthsElapsed % 1080);
    const hoursElapsed  = 5 + 12 * monthsElapsed
                          + 793 * Math.floor(monthsElapsed / 1080)
                          + Math.floor(partsElapsed / 1080);
    const conjunctionDay   = 1 + 29 * monthsElapsed + Math.floor(hoursElapsed / 24);
    const conjunctionParts = 1080 * (hoursElapsed % 24) + (partsElapsed % 1080);

    let altDay = conjunctionDay;
    if (conjunctionParts >= 19440 ||
        ((conjunctionDay % 7) === 2 && conjunctionParts >= 9924  && !hebrewLeapYear(y)) ||
        ((conjunctionDay % 7) === 1 && conjunctionParts >= 16789 &&  hebrewLeapYear(y - 1))) {
      altDay = conjunctionDay + 1;
    }
    if ((altDay % 7) === 0 || (altDay % 7) === 3 || (altDay % 7) === 5) altDay += 1;
    return altDay;
  }

  function hebrewYearLength(y) { return hebrewCalendarElapsedDays(y + 1) - hebrewCalendarElapsedDays(y); }
  function longCheshvan(y) { return hebrewYearLength(y) % 10 === 5; }
  function shortKislev(y)  { return hebrewYearLength(y) % 10 === 3; }

  function daysInHebrewMonth(m, y) {
    if (m === 1) return 30;                                  // Tishrei
    if (m === 2) return longCheshvan(y) ? 30 : 29;           // Cheshvan
    if (m === 3) return shortKislev(y) ? 29 : 30;            // Kislev
    if (m === 4) return 29;                                  // Tevet
    if (m === 5) return 30;                                  // Shevat
    if (m === 6) return hebrewLeapYear(y) ? 30 : 29;         // Adar I (leap) or Adar
    if (m === 7 && hebrewLeapYear(y)) return 29;             // Adar II
    if (!hebrewLeapYear(y)) {
      // m=7 Nisan, 8 Iyar, 9 Sivan, 10 Tammuz, 11 Av, 12 Elul
      return [30, 29, 30, 29, 30, 29][m - 7];
    } else {
      // m=8 Nisan, 9 Iyar, ..., 13 Elul
      return [30, 29, 30, 29, 30, 29][m - 8];
    }
  }

  const JDN_AM1 = 347997; // 1 Tishrei AM 1 in Julian Day Number

  function hebrewToJDN(y, m, d) {
    let jdn = JDN_AM1 + hebrewCalendarElapsedDays(y);
    for (let mi = 1; mi < m; mi++) jdn += daysInHebrewMonth(mi, y);
    return jdn + d - 1;
  }

  function jdnToHebrew(jdn) {
    let y = Math.floor((jdn - JDN_AM1) / 365.25) + 1;
    while (hebrewToJDN(y + 1, 1, 1) <= jdn) y++;
    while (hebrewToJDN(y, 1, 1) > jdn) y--;
    let m = 1;
    const total = hebrewMonthsInYear(y);
    while (m <= total) {
      const monthEnd = hebrewToJDN(y, m, daysInHebrewMonth(m, y));
      if (jdn <= monthEnd) break;
      m++;
    }
    const monthStart = hebrewToJDN(y, m, 1);
    return { year: y, month: m, day: jdn - monthStart + 1 };
  }

  /* ────────── JDN ↔ civil date, weekdays ────────── */
  // JDN → {y, m, d} (proleptic Gregorian).
  function jdnToGregorian(jdn) {
    const a = jdn + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4);
    const d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d / 4), m = Math.floor((5 * e + 2) / 153);
    return { d: e - Math.floor((153 * m + 2) / 5) + 1, m: m + 3 - 12 * Math.floor(m / 10), y: 100 * b + d - 4800 + Math.floor(m / 10) };
  }
  // A Date (its local calendar day), a 'YYYY-MM-DD' string or {y, m, d} → JDN.
  function toJDN(x) {
    if (x instanceof Date) return gregorianToJDN(x.getFullYear(), x.getMonth() + 1, x.getDate());
    if (typeof x === 'string') {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(x);
      if (!m) return null;
      return gregorianToJDN(+m[1], +m[2], +m[3]);
    }
    if (x && Number.isFinite(x.y) && Number.isFinite(x.m) && Number.isFinite(x.d)) return gregorianToJDN(x.y, x.m, x.d);
    return null;
  }
  const dayOfWeek = (jdn) => (jdn + 1) % 7;                    // 0 = Sunday … 6 = Shabbat
  const shabbatOnOrAfter = (jdn) => jdn + ((6 - dayOfWeek(jdn) + 7) % 7);
  const shabbatAfter = (jdn) => shabbatOnOrAfter(jdn + 1);
  const shabbatOnOrBefore = (jdn) => (dayOfWeek(jdn) === 6 ? jdn : jdn - dayOfWeek(jdn) - 1);
  const shabbatBefore = (jdn) => shabbatOnOrBefore(jdn - 1);

  // The 14 month keys (Tishrei = 1; in a leap year 6 is Adar I and 7 Adar II, else 6 is Adar and 7 Nisan).
  const MONTH_KEYS_REGULAR = ['tishrei', 'cheshvan', 'kislev', 'tevet', 'shevat', 'adar', 'nisan', 'iyar', 'sivan', 'tammuz', 'av', 'elul'];
  const MONTH_KEYS_LEAP    = ['tishrei', 'cheshvan', 'kislev', 'tevet', 'shevat', 'adar1', 'adar2', 'nisan', 'iyar', 'sivan', 'tammuz', 'av', 'elul'];
  function monthKeyOf(m, y) { return (hebrewLeapYear(y) ? MONTH_KEYS_LEAP : MONTH_KEYS_REGULAR)[m - 1] || ''; }
  const nisanOf = (y) => hebrewLeapYear(y) ? 8 : 7;            // Nisan's month number in year y

  /* ────────── THE WEEKLY READING TABLE ──────────
     sedraForYear(hy, israel) fits the parshiyot to the Shabbatot from Shabbat Bereshit of hy (the
     first Shabbat after 22 Tishrei) up to the Shabbat before Shabbat Bereshit of hy + 1, skipping
     the festival Shabbatot (no weekly parasha). It is count-based rather than a table of year
     types: the traditional anchors (Tzav, or Metzora in a leap year, before Pesach; Bamidbar before
     Shavuot; Devarim before Tisha B'Av; Nitzavim before Rosh Hashanah) cut the year into segments,
     and each segment doubles the pairs it may double, in the customary order of preference, until
     its parshiyot fit its Shabbatot — or, with more Shabbatot than parshiyot, reaches one parasha
     further (Achrei Mot before Pesach in a long leap year; Nasso before Shavuot in Israel when
     Pesach's eighth day is a Shabbat). Israel and the Diaspora differ only in which Shabbatot are
     festivals (the second days), so both schedules fall out of the same fit. */
  const P = {   // the parasha indices the rules name (parshiyot.json's n − 1)
    BERESHIT: 0, VAYAKHEL: 21, PEKUDEI: 22, TZAV: 24, TAZRIA: 26, METZORA: 27, ACHREI: 28, KEDOSHIM: 29,
    BEHAR: 31, BECHUKOTAI: 32, BAMIDBAR: 33, NASSO: 34, CHUKAT: 38, BALAK: 39, PINCHAS: 40, MATOT: 41, MASEI: 42,
    DEVARIM: 43, VAETCHANAN: 44, KI_TEITZEI: 48, NITZAVIM: 50, VAYEILECH: 51, HAAZINU: 52, VEZOT: 53,
  };
  // The seven pairs that are ever read together (the first of each), in order.
  const DOUBLED_FIRSTS = [P.VAYAKHEL, P.TAZRIA, P.ACHREI, P.BEHAR, P.CHUKAT, P.MATOT, P.NITZAVIM];
  const _sedraCache = new Map();

  // The festival Shabbatot of a reading year and what they are: jdn → {holiday, day}.
  function festivalShabbatot(hy, israel) {
    const out = new Map();
    const add = (y, m, d, holiday, day) => { const j = hebrewToJDN(y, m, d); if (dayOfWeek(j) === 6) out.set(j, { holiday, day }); };
    for (const y of [hy, hy + 1]) {
      add(y, 1, 1, 'rosh_hashanah', 1); add(y, 1, 2, 'rosh_hashanah', 2); add(y, 1, 10, 'yom_kippur', 1);
      add(y, 1, 15, 'sukkot', 1);
      if (israel) add(y, 1, 16, 'chol_hamoed_sukkot', 1); else add(y, 1, 16, 'sukkot', 2);
      for (let d = 17; d <= 21; d++) add(y, 1, d, 'chol_hamoed_sukkot', d - 15);
      add(y, 1, 22, 'shmini_atzeret', 1);
      if (!israel) add(y, 1, 23, 'simchat_torah', 1);
    }
    const nis = nisanOf(hy);
    add(hy, nis, 15, 'pesach', 1);
    if (israel) add(hy, nis, 16, 'chol_hamoed_pesach', 1); else add(hy, nis, 16, 'pesach', 2);
    for (let d = 17; d <= 20; d++) add(hy, nis, d, 'chol_hamoed_pesach', d - 15);
    add(hy, nis, 21, 'pesach', 7);
    if (!israel) add(hy, nis, 22, 'pesach', 8);
    add(hy, nis + 2, 6, 'shavuot', 1);
    if (!israel) add(hy, nis + 2, 7, 'shavuot', 2);
    return out;
  }

  // Fit `items` (consecutive parasha indices) to `n` Shabbatot: reach on to `extendTo` when there
  // are more Shabbatot than parshiyot, else double the `prefs` pairs in order until it fits.
  // Returns the readings ([i] or [i, i + 1]) and the last parasha placed.
  function fitSegment(items, n, prefs, extendTo, label) {
    const list = items.slice();
    while (list.length < n && extendTo !== null && list[list.length - 1] < extendTo) list.push(list[list.length - 1] + 1);
    const doubled = new Set();
    for (const a of prefs) {
      if (list.length - doubled.size <= n) break;
      if (list.includes(a) && list.includes(a + 1)) doubled.add(a);
    }
    if (list.length - doubled.size !== n) throw new Error(`hebrew-calendar: the ${label} segment does not fit (${n} Shabbatot, ${list.length} parshiyot)`);
    const out = [];
    for (let i = 0; i < list.length; i++) {
      if (doubled.has(list[i])) { out.push([list[i], list[i + 1]]); i++; }
      else out.push([list[i]]);
    }
    return { readings: out, last: list[list.length - 1] };
  }

  // The reading table of one year: Map(jdn → {kind:'parsha', idx:[…]} | {kind:'holiday', holiday, day}).
  function sedraForYear(hy, israel) {
    const key = hy + (israel ? 'i' : 'd');
    if (_sedraCache.has(key)) return _sedraCache.get(key);
    const leap = hebrewLeapYear(hy), nis = nisanOf(hy);
    const bereshit = shabbatAfter(hebrewToJDN(hy, 1, 22));
    const bereshitNext = shabbatAfter(hebrewToJDN(hy + 1, 1, 22));
    const fest = festivalShabbatot(hy, israel);
    const pesach = hebrewToJDN(hy, nis, 15), shavuot = hebrewToJDN(hy, nis + 2, 6), av9 = hebrewToJDN(hy, nis + 4, 9);
    const rhNext = hebrewToJDN(hy + 1, 1, 1);
    const seg = { A: [], B: [], C: [], D: [], E: [] };
    for (let j = bereshit; j < bereshitNext; j += 7) {
      if (fest.has(j)) continue;
      if (j < pesach) seg.A.push(j);
      else if (j <= pesach + 6) continue;                 // Pesach's own week (its Shabbat is always a festival)
      else if (j < shavuot) seg.B.push(j);
      else if (j <= av9) seg.C.push(j);                   // Devarim is read on the Shabbat on or before 9 Av
      else if (j < rhNext) seg.D.push(j);
      else seg.E.push(j);                                 // Tishrei of the next year, before Sukkot
    }
    const nE = seg.E.length;
    if (nE < 1 || nE > 2) throw new Error('hebrew-calendar: Tishrei has ' + nE + ' open Shabbatot');
    const A = fitSegment(range(P.BERESHIT, leap ? P.METZORA : P.TZAV), seg.A.length, [P.VAYAKHEL, P.TAZRIA], leap ? P.ACHREI : null, 'Bereshit–Pesach');
    const B = fitSegment(range(A.last + 1, P.BAMIDBAR), seg.B.length, [P.TAZRIA, P.ACHREI, P.BEHAR], P.NASSO, 'Pesach–Shavuot');
    const C = fitSegment(range(B.last + 1, P.DEVARIM), seg.C.length, [P.MATOT, P.CHUKAT], null, 'Shavuot–Tisha B\'Av');
    const D = fitSegment(range(P.VAETCHANAN, nE === 1 ? P.VAYEILECH : P.NITZAVIM), seg.D.length, [P.NITZAVIM], null, 'Tisha B\'Av–Rosh Hashanah');
    const E = { readings: nE === 2 ? [[P.VAYEILECH], [P.HAAZINU]] : [[P.HAAZINU]] };
    const table = new Map();
    for (const [j, f] of fest) if (j >= bereshit && j < bereshitNext) table.set(j, { kind: 'holiday', holiday: f.holiday, day: f.day });
    for (const s of ['A', 'B', 'C', 'D', 'E']) seg[s].forEach((j, i) => table.set(j, { kind: 'parsha', idx: ({ A, B, C, D, E })[s].readings[i] }));
    const out = { hyear: hy, israel: !!israel, bereshit, bereshitNext, table };
    _sedraCache.set(key, out);
    return out;
  }
  function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }

  // The Shabbat on or after `date` and what it reads. `hyear` is the reading year (the year whose
  // Bereshit began it — a Shabbat in Tishrei before Bereshit belongs to the year before its date's).
  function parshaForDate(date, opts) {
    const j0 = toJDN(date);
    if (j0 === null) return null;
    const israel = !!(opts && opts.israel);
    const j = shabbatOnOrAfter(j0);
    const heb = jdnToHebrew(j);
    let year = sedraForYear(heb.year, israel);
    if (j < year.bereshit) year = sedraForYear(heb.year - 1, israel);
    const r = year.table.get(j);
    const g = jdnToGregorian(j);
    const base = { jdn: j, shabbat: g, date: new Date(g.y, g.m - 1, g.d), heb: { y: heb.year, m: heb.month, d: heb.day, monthKey: monthKeyOf(heb.month, heb.year) }, hyear: year.hyear, israel };
    if (!r) return Object.assign(base, { kind: 'holiday', holiday: 'sukkot', day: 0 });   // unreachable: every Shabbat of the span is placed
    return Object.assign(base, r);
  }

  // The next Shabbat on or after `date` that reads parasha `idx` (alone or doubled), with its reading year.
  function nextOccurrence(idx, date, opts) {
    const israel = !!(opts && opts.israel);
    let j = shabbatOnOrAfter(toJDN(date));
    for (let i = 0; i < 120; i++, j += 7) {   // two reading years and change: every parasha recurs within one
      const hit = parshaForDate(jdnToGregorian(j), { israel });
      if (hit.kind === 'parsha' && hit.idx.includes(idx)) return hit;
    }
    return null;
  }

  /* ────────── SPECIAL SHABBATOT — the maftir and haftarah that replace a parasha's own ──────────
     specialShabbat(date, opts) names what the Shabbat on or after `date` reads besides its parasha, or
     null: the four parshiyot (Shekalim on or before 1 Adar — Adar II in a leap year —, Zachor before
     Purim, Parah the week before HaChodesh, HaChodesh on or before 1 Nisan) and HaGadol before Pesach;
     Shabbat Shuva (3–9 Tishrei; its haftarah differs by the parasha, Vayeilech or Ha'azinu); the
     Shabbatot of Chanukah (with the day, 1–8; on Rosh Chodesh Tevet a third scroll); Shabbat Rosh
     Chodesh (Masei's own variant) and Machar Chodesh; and the three haftarah replacements of a parasha
     that falls on a date — Pinchas after 17 Tammuz, Ki Teitzei on 14 Elul (Re'eh was Rosh Chodesh, so
     its consolation is read with Ki Teitzei's), Kedoshim read alone on 26 or 28 Nisan or 6 Iyar. The
     precedence is @hebcal/leyning's (BSD-2-Clause: its specialReadings2 and getLeyningKeyForEvent, read
     for this port, and the oracle of scripts/smoke-hebrew-calendar.mjs --hebcal): a special Shabbat's
     haftarah first, then, with none, Pinchas, Rosh Chodesh, Ki Teitzei, Kedoshim, Machar Chodesh (never in
     Av: Re'eh on Erev Rosh Chodesh Elul keeps its own haftarah). The result carries parshaForDate's fields
     plus `key` and, for Chanukah, `day`; the page owns the readings themselves (the Torah Trainer's
     HOLIDAY_READINGS), this module only names them. */
  const SPECIAL_KEYS = ['shuva_vayeilech', 'shuva_haazinu', 'chanukah', 'rosh_chodesh_chanukah', 'shekalim', 'shekalim_rosh_chodesh',
    'zachor', 'parah', 'hachodesh', 'hachodesh_rosh_chodesh', 'hagadol', 'pinchas_after_17_tammuz', 'rosh_chodesh', 'rosh_chodesh_masei',
    'ki_teitzei_consolation', 'kedoshim_special', 'machar_chodesh'];
  function specialShabbat(date, opts) {
    const r = parshaForDate(date, opts);
    if (!r || r.kind !== 'parsha') return null;
    const j = r.jdn, y = r.heb.y, m = r.heb.m, d = r.heb.d, idx = r.idx;
    const nis = nisanOf(y), adar = nis - 1;   // Adar, or Adar II in a leap year: the month before Nisan
    const isRC = d === 30 || d === 1;
    const found = (key, day) => Object.assign({ key }, day ? { day } : {}, r);
    if (m === 1 && d >= 3 && d <= 9) return found(idx[0] === P.HAAZINU ? 'shuva_haazinu' : 'shuva_vayeilech');
    const chanukahDay = j - hebrewToJDN(y, 3, 25) + 1;
    if (chanukahDay >= 1 && chanukahDay <= 8) return found(isRC ? 'rosh_chodesh_chanukah' : 'chanukah', chanukahDay);
    if (j === shabbatOnOrBefore(hebrewToJDN(y, adar, 1))) return found(isRC ? 'shekalim_rosh_chodesh' : 'shekalim');
    if (j === shabbatBefore(hebrewToJDN(y, adar, 14))) return found('zachor');
    const hachodesh = shabbatOnOrBefore(hebrewToJDN(y, nis, 1));
    if (j === hachodesh) return found(isRC ? 'hachodesh_rosh_chodesh' : 'hachodesh');
    if (j === hachodesh - 7) return found('parah');
    if (j === shabbatBefore(hebrewToJDN(y, nis, 15))) return found('hagadol');
    if (idx.includes(P.PINCHAS) && m === nis + 3 && d > 17) return found('pinchas_after_17_tammuz');
    if (isRC) return found(idx.includes(P.MASEI) ? 'rosh_chodesh_masei' : 'rosh_chodesh');
    if (idx[0] === P.KI_TEITZEI && m === nis + 5 && d === 14) return found('ki_teitzei_consolation');
    if (idx.length === 1 && idx[0] === P.KEDOSHIM && (d === 26 || d === 28 || d === 6)) return found('kedoshim_special');
    if (m !== nis + 4) { const t = jdnToHebrew(j + 1); if (t.day === 30 || t.day === 1) return found('machar_chodesh'); }
    return null;
  }

  /* ────────── TRIENNIAL CYCLE (the Conservative movement's three-year division) ────────── */
  const TRIENNIAL_BASE = 5744;   // a cycle's first year; the year number is ((hyear − 5744) mod 3) + 1
  const triennialYear = (hyear) => ((((hyear - TRIENNIAL_BASE) % 3) + 3) % 3) + 1;
  const triennialCycleStart = (hyear) => hyear - (triennialYear(hyear) - 1);
  // Whether the pair beginning at `first` is read Together or Separately in each year of the cycle
  // that starts at `cycleStart`: 'TTS', 'STT', … (the key of @hebcal/triennial's variation patterns).
  function doubledPattern(first, cycleStart, opts) {
    const israel = !!(opts && opts.israel);
    let pat = '';
    for (let yr = 0; yr < 3; yr++) {
      const t = sedraForYear(cycleStart + yr, israel).table;
      let together = false;
      for (const r of t.values()) if (r.kind === 'parsha' && r.idx.length === 2 && r.idx[0] === first) { together = true; break; }
      pat += together ? 'T' : 'S';
    }
    return pat;
  }
  // The pair a parasha belongs to (its first index), or null when it is never doubled.
  function doubledFirstOf(idx) {
    for (const f of DOUBLED_FIRSTS) if (idx === f || idx === f + 1) return f;
    return null;
  }

  window.HebCal = {
    gregorianToJDN, jdnToGregorian, hebrewToJDN, jdnToHebrew, hebrewLeapYear, hebrewYearLength, daysInHebrewMonth,
    toJDN, dayOfWeek, shabbatOnOrAfter, monthKeyOf, MONTH_KEYS_LEAP, MONTH_KEYS_REGULAR,
    sedraForYear, parshaForDate, nextOccurrence, festivalShabbatot, specialShabbat, SPECIAL_KEYS,
    triennialYear, triennialCycleStart, doubledPattern, doubledFirstOf, DOUBLED_FIRSTS, P,
  };
})();
