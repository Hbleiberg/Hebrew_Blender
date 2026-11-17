#!/usr/bin/env node
/*
 * smoke-holiday-pages.mjs — the Holiday Guide end to end: holiday_guide.html (the hub and its sheet builder) and the
 * generated holiday coloring pages (holidays/<slug>.html, scripts/build-holiday-pages.mjs). With the clock fixed, so
 * the countdown is checked on known dates:
 *   - the hub on ten dates (and Israel's schedule on two): the holiday that leads, its countdown sentence (days,
 *     one day, tonight, under way, the day of several), the date line, and that the builder opens on the same holiday;
 *     Shabbat and Havdalah never lead; seventeen cards, the weekly two first, the year in order from the next one;
 *   - the sheet maker is a popup, closed when the page opens, and nothing of it sits in the page (no section, no
 *     option, no sheet picture): the hero's button and a card's link open it on that holiday, focus goes to its
 *     close button and stays inside it, and Escape, the close button and the backdrop close it and hand focus back;
 *     closed, the page prints as a page;
 *   - the sheet maker: every holiday with symbols draws six on one page at the defaults with no palette token left on
 *     paper and no conversion warning; 1 / 2 / 4 / 6 a page give ceil(n / per) pages with the right rows and columns;
 *     each option changes the sheet (the Hebrew / transliteration / English lines, the four size sliders, nikkud
 *     with the catalog's plain spelling, a short row centred, the title, the cut line, the
 *     name line, the meanings on Sukkot only, coloured in); unticking a symbol reflows the pages and none leaves a
 *     note with Print waiting; a holiday's own symbol ticked alone (or a holiday still without symbols) prints as one
 *     big picture; the options survive a reload and the holiday and ticks do not; a long title is fitted inside its
 *     sheet;
 *   - printing: the PDF has one page per sheet page, Letter and A4 (the @page box);
 *   - the hub in Hebrew, dark, at 800px and at 360px: Hebrew sentences, dark on, no horizontal scroll;
 *   - each generated page: no page error, its picture loaded, one h1 naming the holiday, the countdown line filled
 *     (none on the weekly two), the Print link landing the builder on that holiday; every internal link answers 200;
 *     two pages in Hebrew, dark, 390px; holidays/ (the forwarder) lands on the list;
 *   - hidden or published, the state agrees everywhere: the hub's robots tag, every page's and the forwarder's, sitemap.xml,
 *     llms.txt, sw.js's precache list and index.html's links — all hidden, or (once published) all public.
 * Usage: node scripts/smoke-holiday-pages.mjs [--port 8095]. Needs the preinstalled Playwright + Chromium
 * (docs/reference/ops.md → the headless recipe); starts its own python3 -m http.server and aborts every other origin.
 * Exit 1 on any failure.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, readHolidayCatalog } from './holiday-catalog.mjs';

const args = process.argv.slice(2);
const pi = args.indexOf('--port');
const PORT = pi >= 0 ? Number(args[pi + 1]) : 8095;
const BASE = `http://127.0.0.1:${PORT}`;
const { holidays, problems } = readHolidayCatalog();
if (problems.length) { console.error('smoke-holiday-pages: HolidayGuide.md has problems — run node scripts/build-holiday-guide.mjs'); process.exit(1); }
const complete = holidays.filter((h) => h.symbols.length);
const files = readdirSync(path.join(ROOT, 'holidays')).filter((f) => f.endsWith('.html') && f !== 'index.html').sort();

let chromium;
try { const m = await import('/opt/node22/lib/node_modules/playwright/index.js'); chromium = (m.default || m).chromium; }
catch (e) { try { const m = await import('playwright'); chromium = (m.default || m).chromium; } catch (e2) { console.error('smoke-holiday-pages: Playwright is not available'); process.exit(2); } }

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const browser = await chromium.launch();
const fails = [];
let checks = 0;
let visibility = "hidden";
const ok = (cond, where, msg) => { checks++; if (!cond) fails.push(`${where}: ${msg}`); };
const eq = (got, want, where, what) => ok(JSON.stringify(got) === JSON.stringify(want), where, `${what}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);

// A page with the clock fixed at noon on `date`, every other origin aborted, page errors and conversion warnings kept.
async function open(url, { date = '2026-11-17', lang = 'en', dark = false, width = 1280, height = 900, ls = {} } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript(([l, d, store]) => {
    try { localStorage.setItem('hebrewBlender_lang', l); if (d) localStorage.setItem('hebrewBlender_darkMode', '1'); for (const k in store) if (localStorage.getItem(k) === null) localStorage.setItem(k, store[k]); } catch (e) {}
  }, [lang, dark, ls]);
  await ctx.route('**/*', (r) => (r.request().url().startsWith(BASE) || /^(data|blob):/.test(r.request().url())) ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('console', (m) => { if (m.type() === 'warning' && m.text().startsWith('[coloring]')) errs.push(m.text()); });
  await pg.clock.setFixedTime(new Date(date + 'T12:00:00'));
  await pg.goto(BASE + '/' + url, { waitUntil: 'load' });
  return { ctx, pg, errs };
}
// The page is drawn once its cards are; the sheet maker's pages are fitted (`ready`) only while its popup is open.
const drawn = (pg) => pg.waitForSelector('#hgCards[data-ready="1"]', { timeout: 15000 });
const ready = (pg) => pg.waitForSelector('#hgPages[data-ready="1"]', { timeout: 15000 });
const isOpen = (pg) => pg.evaluate(() => !document.getElementById('hgOverlay').hidden);
// Open the sheet maker: from a holiday's card, or (no key) from the hero's button, which is the next holiday's.
const openMaker = async (pg, key) => { await pg.locator(key ? `#hgCards .hg-card[data-key="${key}"] [data-make]` : '#hgHero [data-make]').first().click(); await ready(pg); };
const hub = (pg) => pg.evaluate(() => ({
  hero: (document.querySelector('#hgHero .hg-hero-name span') || {}).textContent || '',
  count: (document.getElementById('hgCountLine') || {}).textContent || '',
  when: (document.getElementById('hgWhenLine') || {}).textContent || '',
  kicker: (document.querySelector('#hgHero .hg-kicker') || {}).textContent || '',
  pick: (document.querySelector('#hgPick input:checked') || {}).value || '',
  open: !document.getElementById('hgOverlay').hidden,
  heroMake: (document.querySelector('#hgHero [data-make]') || { dataset: {} }).dataset.make || '',
  // nothing of a sheet maker in the page itself: no "Make a coloring sheet" section, no option, no sheet picture
  inPage: document.querySelectorAll('#mainContent #hgBuilder, #mainContent .hg-tile, #mainContent #hgPick, #mainContent #hgPages, #mainContent img[src*="coloring-page"]').length,
  built: document.querySelectorAll('#hgPages .hg-sheet').length,
  cards: [...document.querySelectorAll('#hgCards .hg-card')].map((c) => c.dataset.key),
  current: [...document.querySelectorAll('#hgCards .hg-card[aria-current="true"]')].map((c) => c.dataset.key),
}));
const sheets = (pg) => pg.evaluate(() => [...document.querySelectorAll('#hgPages .hg-sheet')].map((s) => ({
  per: s.dataset.per, rows: s.querySelectorAll('.hg-grow').length, cells: s.querySelectorAll('.hg-cell:not(.hg-cell-empty)').length,
  cols: s.querySelector('.hg-grow') ? s.querySelector('.hg-grow').children.length : 0,
  he: [...s.querySelectorAll('.hg-he')].map((n) => n.textContent), en: [...s.querySelectorAll('.hg-en')].map((n) => n.textContent),
  tr: [...s.querySelectorAll('.hg-tr')].map((n) => n.textContent),
  title: [...s.querySelectorAll('.hg-bubble')].map((n) => n.textContent), cut: s.querySelectorAll('.hg-cut').length,
  name: s.querySelectorAll('.hg-nameline').length, mean: s.querySelectorAll('.hg-mean svg').length,
  pics: s.querySelectorAll('.hg-pic svg').length, token: /var\(/.test(s.innerHTML), colour: /#(c0392b|3a7d44|3b6fb6|c9922a|f0d080|f0a030)/i.test(s.innerHTML),
  // every label and the title inside the sheet's own box
  inside: (() => { const b = s.getBoundingClientRect(); return [...s.querySelectorAll('.hg-bubble, .hg-he, .hg-tr, .hg-en')].every((n) => { const r = n.getBoundingClientRect(); return r.left >= b.left - 1 && r.right <= b.right + 1; }); })(),
})));
const pick = async (pg, sel) => { await pg.locator(sel).check(); await ready(pg); };
const untick = async (pg, sel) => { await pg.locator(sel).uncheck(); await ready(pg); };
// A size slider moved the way a drag ends: its input event (the sheets resize live), then change (the value is stored).
const slide = async (pg, id, v) => { await pg.locator('#' + id).fill(String(v)); await pg.waitForTimeout(60); };

try {
  /* 1) The countdown and the order, date by date. */
  const DATES = [
    // [date, schedule, key that leads, state, count, the date the date line names (English), the kicker]
    ['2026-11-17', 'D', 'chanukah', 'Chanukah is in 17 days', 'Friday, December 4, 2026', 'Next on the calendar'],
    ['2026-12-03', 'D', 'chanukah', 'Chanukah is in 1 day', 'Friday, December 4, 2026', 'Next on the calendar'],
    ['2026-12-04', 'D', 'chanukah', 'Chanukah begins tonight', 'Saturday, December 5, 2026', 'Next on the calendar'],
    ['2026-12-05', 'D', 'chanukah', 'Today is day 1 of 8 of Chanukah', 'Saturday, December 12, 2026', 'Happening now'],
    ['2026-12-12', 'D', 'chanukah', 'Today is day 8 of 8 of Chanukah', '', 'Happening now'],
    ['2026-12-13', 'D', 'tu_bishvat', 'Tu BiShvat is in 40 days', 'Friday, January 22, 2027', 'Next on the calendar'],
    ['2027-03-23', 'D', 'purim', 'Today is Purim', '', 'Happening now'],
    ['2027-04-29', 'D', 'pesach', 'Today is day 8 of 8 of Pesach', '', 'Happening now'],
    ['2027-04-29', 'I', 'yom_hashoah', 'Yom HaShoah is in 4 days', 'Monday, May 3, 2027', 'Next on the calendar'],
    ['2026-10-04', 'D', 'shmini_atzeret', 'Today is day 2 of 2 of Shemini Atzeret / Simchat Torah', '', 'Happening now'],
    ['2026-10-04', 'I', 'chanukah', 'Chanukah is in 61 days', 'Friday, December 4, 2026', 'Next on the calendar'],
    ['2028-09-20', 'D', 'rosh_hashanah', 'Rosh Hashanah begins tonight', 'Thursday, September 21, 2028', 'Next on the calendar'],
  ];
  for (const [date, sched, key, count, day, kicker] of DATES) {
    const where = `hub ${date} ${sched}`;
    const { ctx, pg, errs } = await open('holiday_guide.html', { date, ls: sched === 'I' ? { hebrewTorahTrainer_settings: JSON.stringify({ schedule: 'israel' }) } : {} });
    await drawn(pg);
    const h = await hub(pg);
    eq(h.count, count, where, 'the countdown');
    ok(day ? h.when.includes(day) : h.when === '', where, `the date line "${h.when}" should ${day ? 'name ' + day : 'be empty'}`);
    eq(h.kicker, kicker, where, 'the badge');
    eq(h.pick, key, where, 'the sheet maker is set to the leading holiday');
    eq([h.open, h.built], [false, 0], where, 'the sheet maker is closed when the page opens, and no sheet is built');
    eq([h.heroMake, h.inPage], [key, 0], where, 'the hero\'s button makes the leading holiday\'s sheet, and no sheet maker sits in the page');
    eq(h.cards.length, 17, where, 'cards');
    eq(h.cards.slice(0, 3), ['shabbat', 'havdalah', key], where, 'the weekly two, then the leading holiday');
    eq(h.current, [key], where, 'the marked card');
    eq(errs, [], where, 'page errors');
    if (sched === 'I') ok((await pg.evaluate(() => localStorage.getItem('hebrewTorahTrainer_settings'))) === JSON.stringify({ schedule: 'israel' }), where, 'the Torah Trainer\'s setting was rewritten');
    await ctx.close();
  }
  // A year of days: Shabbat and Havdalah never lead, and the cards after the weekly two are in the order of their eves.
  {
    const { ctx, pg, errs } = await open('holiday_guide.html');
    await drawn(pg);
    const bad = await pg.evaluate(() => {
      const out = [];
      for (let i = 0; i < 400; i += 7) {
        const d = new Date(2026, 10, 17 + i, 12), n = HebCal.nextHoliday(d, {});
        if (!n || n.key === 'shabbat' || n.key === 'havdalah') out.push(String(d));
        const o = HebCal.HOLIDAY_KEYS.map((k) => HebCal.holidayOccurrence(k, d, {}));
        if (o.some((x) => !x || x.end < HebCal.toJDN(d))) out.push('ended ' + d);
      }
      return out;
    });
    eq(bad, [], 'hub, a year of weeks', 'a holiday always leads and none has ended');
    eq(errs, [], 'hub, a year of weeks', 'page errors');
    await ctx.close();
  }

  /* 2) The sheet maker: a popup that the hero's button or a card's link opens. */
  {
    const { ctx, pg, errs } = await open('holiday_guide.html');
    await drawn(pg);
    // a card's link opens it on that holiday with the ✕ focused; Escape closes it and focus goes back to the link
    await openMaker(pg, 'purim');
    eq(await pg.evaluate(() => [!document.getElementById('hgOverlay').hidden, document.body.classList.contains('hg-open'), (document.querySelector('#hgPick input:checked') || {}).value, document.querySelectorAll('#hgPages .hg-sheet').length]),
      [true, true, 'purim', 1], 'popup', 'a card\'s link opens the sheet maker on its holiday with one sheet');
    await pg.waitForFunction(() => document.activeElement && document.activeElement.id === 'hgClose', null, { timeout: 5000 }).catch(() => {});
    eq(await pg.evaluate(() => document.activeElement.id), 'hgClose', 'popup', 'focus moves to the close button');
    await pg.keyboard.press('Shift+Tab');
    ok(await pg.evaluate(() => document.querySelector('.hg-dialog').contains(document.activeElement) && document.activeElement.id === 'hgPrint'), 'popup', 'Shift+Tab from the first control wraps to the last, inside the popup');
    await pg.keyboard.press('Tab');
    eq(await pg.evaluate(() => document.activeElement.id), 'hgClose', 'popup', 'Tab from the last control wraps to the first');
    await pg.keyboard.press('Escape');
    eq(await pg.evaluate(() => [document.getElementById('hgOverlay').hidden, document.body.classList.contains('hg-open'), document.querySelectorAll('#hgPages .hg-sheet').length, document.activeElement.dataset.make, !!document.activeElement.closest('#hgCards .hg-card[data-key="purim"]')]),
      [true, false, 0, 'purim', true], 'popup', 'Escape closes it, clears its pages and returns focus to the card\'s link');
    // another card's link and the hero's button open it too; the ✕ and the backdrop close it
    await pg.locator('#hgCards .hg-card[data-key="pesach"] [data-make]').click(); await ready(pg);
    eq(await pg.evaluate(() => (document.querySelector('#hgPick input:checked') || {}).value), 'pesach', 'popup', 'a card\'s button opens it on that card\'s holiday');
    await pg.locator('#hgClose').click();
    eq(await pg.evaluate(() => [document.getElementById('hgOverlay').hidden, !!document.activeElement.closest('#hgCards .hg-card[data-key="pesach"]')]), [true, true], 'popup', 'the close button closes it and focus returns to the card\'s button');
    await pg.locator('#hgHero [data-make]').click(); await ready(pg);
    eq(await pg.evaluate(() => (document.querySelector('#hgPick input:checked') || {}).value), 'chanukah', 'popup', 'the hero\'s button opens it on the next holiday');
    await pg.mouse.click(4, 4);
    eq(await pg.evaluate(() => [document.getElementById('hgOverlay').hidden, !!document.activeElement.closest('#hgHero'), document.activeElement.tagName]), [true, true, 'BUTTON'], 'popup', 'a click on the backdrop closes it and focus returns to the hero\'s button');
    await openMaker(pg);
    for (const h of complete) {
      const where = `builder ${h.slug}`;
      await pick(pg, `#hgPick input[value="${h.key}"]`);
      const s = await sheets(pg);
      eq(s.length, 1, where, 'pages at the defaults');
      eq([s[0].per, s[0].rows, s[0].cols, s[0].cells, s[0].pics, s[0].cut], ['6', 2, 3, 6, 6, 1], where, 'six symbols, three by two, one cut line');
      eq(s[0].he, h.symbols.map((x) => x.he), where, 'the pointed Hebrew labels');
      eq(s[0].en, h.symbols.map((x) => x.en), where, 'the English labels');
      eq(s[0].title, [h.en, h.he], where, 'the title');
      ok(!s[0].token && !s[0].colour, where, 'line art: no palette token and no colour on paper');
      ok(s[0].inside, where, 'a label or the title leaves its sheet');
      eq(await pg.evaluate(() => document.getElementById('hgOptMeaningsRow').hidden), !h.symbols.some((x) => x.meaning), where, 'the meanings option is offered only where there are meanings');
    }
    // the options, on Sukkot (it has meanings)
    const suk = holidays.find((h) => h.key === 'sukkot');
    await pick(pg, '#hgPick input[value="sukkot"]');
    for (const [per, pages, rows, cols] of [[1, 6, 1, 1], [2, 3, 2, 1], [4, 2, 2, 2], [6, 1, 2, 3]]) {
      await pick(pg, `input[name="hgPer"][value="${per}"]`);
      const s = await sheets(pg);
      eq([s.length, s[0].rows, s[0].cols], [pages, rows, cols], `builder per ${per}`, 'pages, rows, columns');
      eq(s.reduce((n, x) => n + x.cells, 0), 6, `builder per ${per}`, 'symbols in all');
      ok(s.every((x) => x.inside), `builder per ${per}`, 'a label leaves its sheet');
      eq(await pg.evaluate(() => document.getElementById('hgCount').textContent), `${pages} ${pages === 1 ? 'page' : 'pages'} · Sukkot`, `builder per ${per}`, 'the page count');
    }
    // the three label lines are three checkboxes: Hebrew, transliteration, English
    eq(await pg.evaluate(() => ['hgLblHe', 'hgLblTr', 'hgLblEn'].map((id) => document.getElementById(id).checked).concat(['hgSizeHe', 'hgSizeTr', 'hgSizeEn', 'hgSizePic'].map((id) => document.getElementById(id).disabled))),
      [true, false, true, false, true, false, false], 'builder labels', 'Hebrew and English ticked at the defaults, and the transliteration slider waiting for its line');
    await pick(pg, '#hgLblTr');
    let s = (await sheets(pg))[0];
    eq([s.tr, s.he.length, s.en.length, s.title], [suk.symbols.map((x) => x.tr), 6, 6, [suk.en, suk.he]], 'builder transliteration', 'every symbol\'s transliteration, with both other lines and the title in both');
    eq(await pg.evaluate(() => [[...document.querySelector('#hgPages .hg-cap').children].map((n) => n.className), document.getElementById('hgSizeTr').disabled, getComputedStyle(document.querySelector('#hgPages .hg-tr')).fontStyle]),
      [['hg-he', 'hg-tr', 'hg-en'], false, 'italic'], 'builder transliteration', 'Hebrew, then the transliteration in italics, then English; its slider enabled');
    ok(s.inside, 'builder transliteration', 'a label leaves its sheet');
    await untick(pg, '#hgLblHe'); await untick(pg, '#hgLblEn');
    s = (await sheets(pg))[0];
    eq([s.tr.length, s.he.length, s.en.length, s.title], [6, 0, 0, [suk.en]], 'builder transliteration only', 'the transliteration alone, under an English title');
    await untick(pg, '#hgLblTr'); await pick(pg, '#hgLblHe');
    s = (await sheets(pg))[0];
    eq([s.en.length, s.tr.length, s.he.length, s.title], [0, 0, 6, [suk.he]], 'builder labels he', 'Hebrew only, title too');
    eq(await pg.evaluate(() => document.querySelector('#hgPages .hg-grid').dir), 'rtl', 'builder labels he', 'a Hebrew-only sheet reads from the right');
    await pg.locator('#hgOptNikkud').uncheck(); await ready(pg);
    s = (await sheets(pg))[0];
    eq([s.he, s.title], [suk.symbols.map((x) => x.plain), [suk.plain]], 'builder nikkud off', 'the plain spellings (סוכה, not סכה)');
    await pick(pg, '#hgLblEn'); await untick(pg, '#hgLblHe');
    s = (await sheets(pg))[0];
    eq([s.en.length, s.he.length, s.title], [6, 0, [suk.en]], 'builder labels en', 'English only');
    await untick(pg, '#hgLblEn');
    s = (await sheets(pg))[0];
    eq([s.en.length, s.he.length, s.tr.length, s.title.length], [0, 0, 0, 2], 'builder labels none', 'no labels, the title in both');
    await pg.locator('#hgOptTitle').uncheck(); await pg.locator('#hgOptCut').uncheck(); await pg.locator('#hgOptName').check(); await pg.locator('#hgOptMeanings').check();
    await pick(pg, 'input[name="hgColored"][value="1"]');
    s = (await sheets(pg))[0];
    eq([s.title.length, s.cut, s.name, s.mean], [0, 0, 1, 6], 'builder toggles', 'no title, no cut line, a name line, six meanings');
    ok(s.colour && !s.token, 'builder coloured in', 'the light palette\'s colours on paper and no token');
    // the options are stored; the holiday and the ticks are not
    const stored = await pg.evaluate(() => JSON.parse(localStorage.getItem('hebrewHolidayGuide_settings')));
    eq([stored.per, stored.lblHe, stored.lblTr, stored.lblEn, 'labels' in stored, stored.nikkud, stored.title, stored.cut, stored.name, stored.meanings, stored.colored, stored.paper, 'holiday' in stored], [6, false, false, false, false, false, false, false, true, true, true, 'letter', false], 'builder storage', 'what is stored');
    // the size sliders: the words from half to half as big again, the pictures down to half; a drag resizes the sheet
    // without rebuilding it, and the value is stored when the drag ends
    await pg.locator('#hgOptMeanings').uncheck(); await pick(pg, 'input[name="hgColored"][value="0"]');
    await pick(pg, '#hgLblHe'); await pick(pg, '#hgLblTr'); await pick(pg, '#hgLblEn');
    eq(await pg.evaluate(() => ['hgSizePic', 'hgSizeHe', 'hgSizeTr', 'hgSizeEn'].map((id) => { const r = document.getElementById(id); return [r.min, r.max, r.step, r.value, r.nextElementSibling.textContent]; })),
      [['50', '100', '5', '100', '100%'], ['50', '150', '5', '100', '100%'], ['50', '150', '5', '100', '100%'], ['50', '150', '5', '100', '100%']], 'builder sizes', 'the four sliders at 100%');
    const measure = () => pg.evaluate(() => { const q = (c) => document.querySelector('#hgPages .hg-cell ' + c); const px = (c) => parseFloat(getComputedStyle(q(c)).fontSize);
      return { he: px('.hg-he'), tr: px('.hg-tr'), en: px('.hg-en'), pic: q('.hg-pic svg').getBoundingClientRect().width, node: (q('.hg-he').dataset.mark = q('.hg-he').dataset.mark || 'kept') }; });
    const m0 = await measure();
    await slide(pg, 'hgSizeHe', 70); await slide(pg, 'hgSizeTr', 150); await slide(pg, 'hgSizeEn', 50); await slide(pg, 'hgSizePic', 50);
    const m1 = await measure();
    const near = (a, b) => Math.abs(a - b) < 0.03;
    ok(near(m1.he / m0.he, 0.7) && near(m1.tr / m0.tr, 1.5) && near(m1.en / m0.en, 0.5), 'builder sizes', `the words follow their sliders (${(m1.he / m0.he).toFixed(2)}, ${(m1.tr / m0.tr).toFixed(2)}, ${(m1.en / m0.en).toFixed(2)}; expected 0.70, 1.50, 0.50)`);
    ok(m1.pic < m0.pic * 0.75 && m1.pic > m0.pic * 0.4, 'builder sizes', `the pictures did not shrink with their slider (${m0.pic.toFixed(0)}px → ${m1.pic.toFixed(0)}px)`);
    eq(m1.node, 'kept', 'builder sizes', 'a drag resizes the sheet in place, without rebuilding it');
    ok((await sheets(pg))[0].inside, 'builder sizes', 'a label leaves its sheet');
    const sized = await pg.evaluate(() => JSON.parse(localStorage.getItem('hebrewHolidayGuide_settings')));
    eq([sized.sizePic, sized.sizeHe, sized.sizeTr, sized.sizeEn], [50, 70, 150, 50], 'builder sizes', 'the sizes are stored');
    await slide(pg, 'hgSizeHe', 100); await slide(pg, 'hgSizeTr', 100); await slide(pg, 'hgSizeEn', 100); await slide(pg, 'hgSizePic', 100);
    await untick(pg, '#hgLblTr');
    // ticks: untick two → four symbols; none → a note and Print waits
    await pg.locator('#hgSyms input[value="0"]').uncheck(); await pg.locator('#hgSyms input[value="5"]').uncheck(); await ready(pg);
    s = await sheets(pg);
    eq([s.length, s[0].cells, s[0].en], [1, 4, suk.symbols.slice(1, 5).map((x) => x.en)], 'builder ticks', 'four symbols left, in order');
    // a row that is not full is centred, its cell as wide as a full row's (three above, one below it in the middle)
    const rowsNow = await pg.evaluate(() => { const sh = document.querySelector('#hgPages .hg-sheet'), b = sh.querySelector('.hg-grid').getBoundingClientRect();
      return [...sh.querySelectorAll('.hg-grow')].map((r) => { const c = [...r.querySelectorAll('.hg-cell')].map((x) => x.getBoundingClientRect()); return { n: c.length, w: c.length ? c[0].width : 0, off: c.length ? ((c[0].left + c[c.length - 1].right) / 2) - (b.left + b.width / 2) : 0 }; }); });
    eq(rowsNow.map((r) => r.n), [3, 1], 'builder centred row', 'three symbols, then one');
    ok(Math.abs(rowsNow[1].off) < 1 && Math.abs(rowsNow[1].w - rowsNow[0].w) < 1 && Math.abs(rowsNow[0].off) < 1, 'builder centred row', `the short row is not centred at a full row's cell width (${JSON.stringify(rowsNow)})`);
    await pg.locator('#hgSymNone').click();
    eq(await pg.evaluate(() => [document.querySelectorAll('#hgPages .hg-sheet').length, document.getElementById('hgNote').textContent, document.getElementById('hgPrint').getAttribute('aria-disabled')]),
      [0, 'Tick at least one symbol to make a sheet.', 'true'], 'builder no symbols', 'no page, the note, Print waiting');
    await pg.locator('#hgSymAll').click(); await ready(pg);
    eq((await sheets(pg))[0].cells, 6, 'builder All', 'all six back');
    // one picture alone fills its page, whatever the grid: the holiday's own symbol ticked by itself, under the longest
    // title (two lines, fitted) — and, while one exists, a holiday still without symbols, which offers nothing else
    await pg.locator('#hgOptTitle').check();
    const long = holidays.reduce((a, b) => (b.en.length > a.en.length ? b : a));
    await pick(pg, `#hgPick input[value="${long.key}"]`);
    if (long.symbols.length) { await pg.locator('#hgSymNone').click(); await pg.locator('#hgSyms input[value="-1"]').check(); await ready(pg); }
    s = await sheets(pg);
    eq([s.length, s[0].per, s[0].cells, s[0].pics, s[0].en.length, s[0].title], [1, '1', 1, 1, 0, [long.en, long.plain]], `builder ${long.slug}, its own symbol`, 'one big picture under the title (nikkud is off here)');
    ok(s[0].inside, `builder ${long.slug}, its own symbol`, 'the long title leaves its sheet');
    ok(await pg.evaluate(() => document.querySelector('#hgPages .hg-headline').classList.contains('hg-stack')), `builder ${long.slug}`, 'the long title did not take two lines');
    const bare = holidays.find((h) => !h.symbols.length);
    if (bare) {
      await pick(pg, `#hgPick input[value="${bare.key}"]`);
      s = await sheets(pg);
      eq([s.length, s[0].per, s[0].cells, s[0].pics, s[0].en.length], [1, '1', 1, 1, 0], `builder ${bare.slug}`, 'one big picture under the title');
      ok(/coming soon/.test(await pg.evaluate(() => document.getElementById('hgSymSoon').textContent)), `builder ${bare.slug}`, 'the coming-soon note');
    }
    eq(errs, [], 'builder', 'page errors and conversion warnings');
    // a reload keeps the options and returns to the next holiday with every symbol ticked
    await pg.reload({ waitUntil: 'load' }); await drawn(pg);
    eq(await isOpen(pg), false, 'builder reload', 'the sheet maker is closed after a reload');
    await openMaker(pg);
    eq(await pg.evaluate(() => [(document.querySelector('#hgPick input:checked') || {}).value, document.querySelectorAll('#hgSyms input:checked').length, document.getElementById('hgOptName').checked, document.querySelector('input[name="hgColored"]:checked').value]),
      ['chanukah', 6, true, '0'], 'builder reload', 'the next holiday, six ticks, the stored options (the name line on, to color in)');
    await ctx.close();
  }

  // An older device's stored choice (one `labels` field) still means what it meant, and unknown or broken sizes are
  // read as 100%.
  {
    const { ctx, pg, errs } = await open('holiday_guide.html?holiday=purim', { ls: { hebrewHolidayGuide_settings: JSON.stringify({ v: 1, labels: 'he', sizeHe: 'big', sizeEn: 999, sizePic: 20 }) } });
    await ready(pg);
    const st = await pg.evaluate(() => ({ boxes: ['hgLblHe', 'hgLblTr', 'hgLblEn'].map((id) => document.getElementById(id).checked), sizes: ['hgSizePic', 'hgSizeHe', 'hgSizeEn'].map((id) => document.getElementById(id).value) }));
    eq([st.boxes, st.sizes], [[true, false, false], ['50', '100', '150']], 'stored labels, version 1', 'Hebrew only; sizes clamped to their sliders, a non-number read as 100');
    const sh = (await sheets(pg))[0];
    eq([sh.he.length, sh.en.length, sh.tr.length], [6, 0, 0], 'stored labels, version 1', 'the sheet it draws');
    eq(errs, [], 'stored labels, version 1', 'page errors');
    await ctx.close();
  }

  /* 3) Printing: one PDF page per sheet page, on the chosen paper. */
  for (const [paper, per, box] of [['letter', 6, [612, 792]], ['a4', 2, [595, 842]]]) {
    const where = `print ${paper} per ${per}`;
    const { ctx, pg, errs } = await open('holiday_guide.html?holiday=purim', { ls: { hebrewHolidayGuide_settings: JSON.stringify({ per, paper }) } });
    await ready(pg);
    const n = (await sheets(pg)).length;
    await pg.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await pg.emulateMedia({ media: 'print' });
    const shown = await pg.evaluate(() => ({ papers: document.querySelectorAll('#hgPrintArea .hg-paper').length, others: [...document.body.children].filter((c) => c.id !== 'hgPrintArea' && getComputedStyle(c).display !== 'none').map((c) => c.tagName) }));
    eq([shown.papers, shown.others], [n, []], where, 'the print run alone on paper');
    const pdf = (await pg.pdf({ preferCSSPageSize: true })).toString('latin1');
    eq((pdf.match(/\/Type\s*\/Page[^s]/g) || []).length, n, where, 'PDF pages');
    const mb = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf);
    ok(mb && Math.abs(Number(mb[1]) - box[0]) <= 1 && Math.abs(Number(mb[2]) - box[1]) <= 1, where, `the page box is ${mb ? mb[1] + ' × ' + mb[2] : 'missing'}, expected ${box.join(' × ')}`);
    eq(errs, [], where, 'page errors');
    await ctx.close();
  }

  // With the sheet maker closed, the page prints as a page: nothing is hidden for a run that is not there.
  {
    const { ctx, pg, errs } = await open('holiday_guide.html');
    await drawn(pg);
    await pg.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await pg.emulateMedia({ media: 'print' });
    eq(await pg.evaluate(() => [getComputedStyle(document.getElementById('mainContent')).display !== 'none', getComputedStyle(document.getElementById('hgPrintArea')).display, document.querySelectorAll('#hgPrintArea .hg-paper').length]),
      [true, 'none', 0], 'print, sheet maker closed', 'the page itself prints');
    eq(errs, [], 'print, sheet maker closed', 'page errors');
    await ctx.close();
  }

  /* 4) Hebrew, dark, narrow. */
  for (const width of [800, 360]) {
    const where = `hub he dark ${width}`;
    const { ctx, pg, errs } = await open('holiday_guide.html', { lang: 'he', dark: true, width });
    await drawn(pg);
    const st = await pg.evaluate(() => ({ dir: document.documentElement.dir, dark: document.body.classList.contains('dark'), count: document.getElementById('hgCountLine').textContent,
      title: document.querySelector('.hg-title').textContent, over: document.documentElement.scrollWidth - document.documentElement.clientWidth, raw: /holidayguide\.|holidaypage\./.test(document.body.innerText) }));
    eq([st.dir, st.dark, st.count, st.title, st.raw], ['rtl', true, 'עוד 17 ימים עד חֲנֻכָּה', 'דפי צביעה לחגי ישראל', false], where, 'Hebrew, dark, no raw key');
    ok(st.over <= 0, where, `the page scrolls sideways by ${st.over}px`);
    await openMaker(pg);
    const sh = await sheets(pg);
    ok(sh.length === 1 && sh.every((x) => x.inside), where, 'a label leaves its sheet in the popup');
    const box = await pg.evaluate(() => { const d = document.querySelector('.hg-dialog').getBoundingClientRect(), f = document.getElementById('hgPrint').getBoundingClientRect(); return { over: document.documentElement.scrollWidth - document.documentElement.clientWidth, in: d.left >= -1 && d.right <= innerWidth + 1 && d.bottom <= innerHeight + 1, print: f.bottom <= innerHeight + 1 && f.top >= 0 }; });
    ok(box.over <= 0 && box.in && box.print, where, `the popup does not fit the screen (${JSON.stringify(box)})`);
    eq(errs, [], where, 'page errors');
    await ctx.close();
  }

  /* 5) The generated pages. */
  eq(files, complete.map((h) => h.slug + '.html').sort(), 'holidays/', 'a page for each holiday with symbols, and no other');
  const links = new Set();
  {
    const { ctx, pg, errs } = await open('holidays/' + files[0]);
    for (const h of complete) {
      const where = `holidays/${h.slug}.html`;
      await pg.goto(`${BASE}/holidays/${h.slug}.html`, { waitUntil: 'load' });
      await pg.waitForFunction(() => window.I18n && document.getElementById('hpImg').complete, null, { timeout: 15000 });
      await pg.waitForTimeout(150);
      const st = await pg.evaluate(() => ({ h1: [...document.querySelectorAll('h1')].map((x) => x.textContent), img: document.getElementById('hpImg').naturalWidth, next: document.getElementById('hpNext').textContent,
        print: document.querySelector('.hp-primary').getAttribute('href'), syms: document.querySelectorAll('.hp-sym .hol-ico svg').length, robots: document.querySelector('meta[name="robots"]').content,
        hrefs: [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')), raw: /holidayguide\.|holidaypage\./.test(document.body.innerText), over: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
      ok(st.h1.length === 1 && st.h1[0].startsWith(h.en + ' Coloring Page'), where, `the h1 is ${JSON.stringify(st.h1)}`);
      ok(st.img > 600, where, 'the picture did not load');
      ok(h.weekly ? st.next === '' : /^.+ (is in \d+ days?|begins tonight)\. It|^Today is /.test(st.next), where, `the countdown line is "${st.next}"`);
      eq([st.print, st.syms, st.raw], [`/holiday_guide.html?holiday=${h.slug}`, 6, false], where, 'the Print link, six drawings, no raw key');
      ok(st.over <= 0, where, 'the page scrolls sideways');
      st.hrefs.forEach((x) => links.add(x.split('#')[0]));
    }
    eq(errs, [], 'holidays/*', 'page errors');
    // every internal link answers
    for (const href of links) { const r = await pg.request.get(BASE + href); ok(r.status() === 200, 'holidays/* links', `${href} answers ${r.status()}`); }
    await ctx.close();
  }
  // the Print link lands the builder on that holiday
  for (const h of [complete[0], complete[complete.length - 1]]) {
    const { ctx, pg, errs } = await open(`holiday_guide.html?holiday=${h.slug}`);
    await ready(pg);
    eq(await pg.evaluate(() => [!document.getElementById('hgOverlay').hidden, (document.querySelector('#hgPick input:checked') || {}).value, document.querySelectorAll('#hgPages .hg-sheet').length, location.search]), [true, h.key, 1, `?holiday=${h.slug}`], `?holiday=${h.slug}`, 'the sheet maker open on that holiday, one sheet, the address kept');
    eq(errs, [], `?holiday=${h.slug}`, 'page errors');
    await ctx.close();
  }
  for (const h of complete.slice(0, 2)) {
    const where = `holidays/${h.slug}.html he dark 390`;
    const { ctx, pg, errs } = await open(`holidays/${h.slug}.html`, { lang: 'he', dark: true, width: 390 });
    await pg.waitForFunction(() => window.I18n && I18n.lang === 'he' && document.getElementById('hpImg').alt.startsWith('דף צביעה'), null, { timeout: 15000 });
    const st = await pg.evaluate(() => ({ dir: document.documentElement.dir, dark: document.body.classList.contains('dark'), over: document.documentElement.scrollWidth - document.documentElement.clientWidth, next: document.getElementById('hpNext').textContent }));
    eq([st.dir, st.dark], ['rtl', true], where, 'Hebrew and dark');
    ok(st.over <= 0, where, `the page scrolls sideways by ${st.over}px`);
    ok(h.weekly ? st.next === '' : /עד|היום|הערב/.test(st.next), where, `the countdown line is "${st.next}"`);
    eq(errs, [], where, 'page errors');
    await ctx.close();
  }
  {
    const { ctx, pg } = await open('holidays/');
    await pg.waitForURL(/holiday_guide\.html.*#hgSheets$/, { timeout: 10000 }).catch(() => {});
    ok(/\/holiday_guide\.html#hgSheets$/.test(pg.url()), 'holidays/', `the forwarder landed on ${pg.url()}`);
    await ctx.close();
  }

  /* 6) Hidden or public, the same everywhere. */
  {
    const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
    const robots = (html) => (html.match(/<meta name="robots" content="([^"]*)">/) || [])[1];
    const published = /^const PUBLISHED = true;/m.test(read('scripts/build-holiday-pages.mjs'));
    const want = published ? 'index, follow' : 'noindex, follow';
    eq(robots(read('holiday_guide.html')), want, 'visibility', 'holiday_guide.html\'s robots tag');
    for (const f of files) eq(robots(read('holidays/' + f)), want, 'visibility', `holidays/${f}'s robots tag`);
    eq(robots(read('holidays/index.html')), 'noindex, follow', 'visibility', 'the forwarder is never indexed');
    const sm = /holiday_guide\.html|\/holidays\//.test(read('sitemap.xml'));
    eq(sm, published, 'visibility', 'sitemap.xml names the Holiday Guide');
    const inLlms = /holiday_guide\.html/.test(read('llms.txt')) && /holiday_guide\.html/.test(read('llms-full.txt'));
    const sw = read('sw.js');
    const inSw = ['/holiday_guide.html', '/js/holiday-guide-data.js', '/js/holiday-page.js'].map((f) => sw.includes("'" + f + "'"));
    const linked = /href="holiday_guide\.html"/.test(read('index.html'));
    if (!published) {
      ok(!/holiday_guide|\/holidays\//.test(read('llms.txt') + read('llms-full.txt')), 'visibility', 'llms.txt names the Holiday Guide while it is hidden');
      ok(!/holiday_guide|holiday-guide-data|\/holidays\//.test(sw), 'visibility', 'sw.js precaches the Holiday Guide while it is hidden');
      ok(!/href="[^"]*(holiday_guide|holidays\/)/.test(read('index.html')), 'visibility', 'index.html links the Holiday Guide while it is hidden');
    } else {
      ok(inLlms, 'visibility', 'llms.txt and llms-full.txt do not name the published Holiday Guide (node scripts/update-llms-txt.mjs)');
      ok(inSw.every(Boolean), 'visibility', 'sw.js CORE_ASSETS lacks the published Holiday Guide\'s page or one of its two modules');
      ok(linked, 'visibility', 'index.html does not link the published Holiday Guide');
    }
    visibility = published ? 'published' : 'hidden';
  }
} finally {
  await browser.close();
  server.kill();
}
if (fails.length) {
  console.error(`smoke-holiday-pages: ${fails.length} of ${checks} checks failed:\n  ` + fails.join('\n  '));
  process.exit(1);
}
console.log(`smoke-holiday-pages: ${checks} checks passed (the countdown on ${12} dates, the popup and what opens it, the sheet maker and its options, printing on Letter and A4, Hebrew / dark / 360px, ${complete.length} holiday pages and their links, the forwarder, the ${visibility} state).`);
