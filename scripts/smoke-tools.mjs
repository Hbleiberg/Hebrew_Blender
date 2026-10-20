#!/usr/bin/env node
/*
 * smoke-tools.mjs — headless smoke test for every tool page that carries the account chip and the
 * account status line (js/ivrit-account.js + js/ivrit-saves.js). No real network is used.
 *
 * Per page in PAGES:
 *   A. Anonymous, CDN blocked: 0 pageerrors; the chip sits in the same parent as the language switcher;
 *      the status host holds the module's sign-in line; IvritSaves.local.list(tool) returns exactly the
 *      seeded items; no overlay opens by itself; and the full localStorage dump is byte-identical to a
 *      CONTROL run of the same page with the three account scripts blocked (the "anonymous flow unchanged"
 *      bar, measured rather than argued).
 *   B. A remembered (fake) session with the SDK served locally and the API unreachable: 0 pageerrors, the
 *      status line fails soft (an error line or the signed-out note), no name step and no card open.
 *   C. Hebrew UI + dark mode at 800 px with the host expanded: the sign-in line is Hebrew.
 *   D. URL contracts (pages that declare `urlKeep`): an auth-error return keeps the page's own params.
 *
 * Run from the repo root:  node scripts/smoke-tools.mjs [--sdk path/to/supabase.js] [--only <file>]
 * Needs the repo served on http://localhost:8080 — the script starts python3 -m http.server itself.
 * The --sdk file is optional: without it, B is skipped.
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const { chromium } = pkg;

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const BASE = 'http://localhost:8080';
const cfgSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/supabase-config.js'), 'utf8'), cfgSandbox);
const CFG = cfgSandbox.window.IVRIT_SUPABASE;
const AUTH_KEY = 'sb-' + new URL(CFG.url).hostname.split('.')[0] + '-auth-token';
const ACCOUNT_SCRIPTS = ['/js/supabase-config.js', '/js/ivrit-account.js', '/js/ivrit-saves.js'];
const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };
const SDK_FILE = arg('--sdk');
const SDK_BYTES = SDK_FILE && fs.existsSync(SDK_FILE) ? fs.readFileSync(SDK_FILE) : null;
const ONLY = arg('--only');
const SHOTS = process.env.SMOKE_SHOTS || path.join(process.env.TMPDIR || '/tmp', 'smoke-tools');
fs.mkdirSync(SHOTS, { recursive: true });
const SETTLE_MS = 1500;   // longer than every page's debounced writer (300 ms settings, 1 s dictionary session)

/*
 * One entry per wired page. `seed` is written into localStorage before load (realistic values for every
 * registry key of the tool); `rows` is what plan(tool) must list (kind:name); `host` is the element the
 * panel renders into; `prepare` (optional) runs in the page right after load, before any check, when the
 * host only exists on demand (the dictionary's Word Lists manager); `expand` runs in the page to make the
 * host visible for the screenshot; `urlKeep` (optional) is a query string the page must keep after the
 * auth-error params are stripped; `tools` (the hub) lists several {tool, rows} pairs and `panels` the
 * number of panels the host must hold.
 */
const PAGES = [
  {
    file: 'trope_tutor.html', tool: 'TropeTutor', host: '#cloudSavesPanel',
    seed: {
      hebrewTropeTutor_progress: JSON.stringify({ v: 1, tropes: { etnachta: { r: 3, w: 1 }, sofpasuk: { r: 5, w: 0 } }, families: { disjunctive: true }, pbStreak: 4 }),
      hebrewTropeTutor_settings: JSON.stringify({ v: 1, tradition: 'seph', hebFont: 'Frank Ruhl Libre', hebFontSize: 2.2, drillIdentify: true, drillHear: true, drillMelody: false, drillScope: 'all', playbackRate: 1, panelsCollapsed: { 'trope.settings.panel_font': true } })
    },
    rows: ['progress:default', 'settings:default'],
    expand: `openSettings(); document.getElementById('setCloud').scrollIntoView();`
  },
  {
    file: 'letter_learner.html', tool: 'LetterLearner', host: '#cloudSavesPanel',
    // The seed is the page's own normalized shape (field order included): the page writes only on a change, so a
    // load must leave the text byte-identical.
    seed: {
      hebrewLetterLearner_settings: JSON.stringify({ v: 1, vowels: { kamatz: true, patach: false, tzere: true, segol: true, chirik: true, cholam: true, vav_cholam: true, kubutz: false, shuruk: true, sheva: true, chataf_patach: false, chataf_segol: false, chataf_kamatz: false }, fontTab: false, splitPairs: false, wordAudio: true, voiceURI: 'com.apple.voice.compact.he-IL.Carmit' })
    },
    rows: ['settings:default'],
    expand: `document.getElementById('cloudSavesPanel').scrollIntoView();`,
    urlKeep: 'letter=gimel',
    // E. a browser without speech hides every speaker and shows the note; the ?letter= deep link opens its card and a
    // garbage one opens nothing; the stored options stay byte-identical through a load and the module's flush; F–I cover the
    // Vowels mode (the mode bar, ?mode= / ?vowel=, the Options card's limit, the phone sheet); J–N the Cursive mode (the
    // three-way mode bar and its URL mirror, a cursive card's Letter tab, the dot-pair fold and a final card, garbage, the phone)
    extra: async ({ browser, tag }) => {
      const seedText = JSON.stringify({ v: 1, vowels: { kamatz: true, patach: true, tzere: true, segol: true, chirik: true, cholam: true, vav_cholam: true, kubutz: true, shuruk: true, sheva: true, chataf_patach: true, chataf_segol: true, chataf_kamatz: true }, fontTab: true, splitPairs: true, wordAudio: true, voiceURI: '', colorOrient: 'landscape', colorPaper: 'a4', colorView: 'letter', colorTranslit: true, colorGloss: true, colorName: true, colorHint: true, colorFont: '', colorSizeMain: 100, colorSizePic: 100, colorSizeHe: 100, colorSizeTr: 100, colorSizeEn: 100, bulkLetters: ['alef', 'gimel'], bulkCopies: 3, bulkCollate: 'grouped' });
      {
        const { ctx, page, errors } = await openPage(browser, 'letter_learner.html', { seed: { hebrewLetterLearner_settings: seedText }, query: '?letter=gimel', init: () => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); } });
        const r = await page.evaluate(() => { llSaveSettingsIfChanged(); return { open: !document.getElementById('llOverlay').hidden, id: _llId, noSpeech: document.body.classList.contains('ll-no-speech'), speakers: [...document.querySelectorAll('.ll-speak')].filter(b => b.offsetParent !== null).length, note: document.getElementById('llNoSpeech').offsetParent !== null, same: localStorage.getItem('hebrewLetterLearner_settings') === JSON.stringify(settings), look: [...document.querySelectorAll('#llPanel-letter .ll-lookalike strong')].map(s => s.textContent.trim()).join(',') }; });
        check(tag + ' E: ?letter=gimel opens Gimel with its Block look-alike (Nun); without speech every speaker is hidden and the note shows; the stored options survive a load + flush unchanged', r.open && r.id === 'gimel' && r.noSpeech && r.speakers === 0 && r.note && r.same && r.look === 'Nun:', JSON.stringify(r));
        check(tag + ' E: 0 pageerrors (no speech)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      {
        const { ctx, page, errors } = await openPage(browser, 'letter_learner.html', { query: '?letter=zzz%3Cb%3E' });
        const r = await page.evaluate(() => ({ open: !document.getElementById('llOverlay').hidden, cards: document.querySelectorAll('.ll-card').length }));
        check(tag + ' E: a garbage ?letter= opens nothing (31 cards, dialog closed)', !r.open && r.cards === 31, JSON.stringify(r));
        check(tag + ' E: 0 pageerrors (garbage deep link)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      {
        // On a phone the dialog is a full-screen sheet whose Letter tab overflows it; the tab strip is a scroll container
        // (overflow-x:auto), so without flex-shrink:0 it was the flex item that gave way — 9px tall, its labels under the
        // sticky head (seen on an iPhone).
        const { ctx, page, errors } = await openPage(browser, 'letter_learner.html', { viewport: { width: 390, height: 844 }, query: '?letter=vet' });
        const r = await page.evaluate(() => {
          const head = document.querySelector('.ll-dlg-head').getBoundingClientRect(), strip = document.querySelector('.ll-tabs');
          const tab = document.querySelector('.ll-tabs [role="tab"][aria-selected="true"]').getBoundingClientRect();
          return { open: !document.getElementById('llOverlay').hidden, headBottom: Math.round(head.bottom), tabTop: Math.round(tab.top), tabH: Math.round(tab.height), stripClient: strip.clientHeight, stripScroll: strip.scrollHeight, sheetW: Math.round(document.querySelector('.ll-dialog').getBoundingClientRect().width) };
        });
        check(tag + ' E: on a 390px phone the sheet is full-width and the tab strip keeps its height — the selected tab sits below the sticky head, nothing clipped', r.open && r.sheetW === 390 && r.tabTop >= r.headBottom && r.tabH >= 36 && r.stripScroll <= r.stripClient + 1, JSON.stringify(r));
        check(tag + ' E: 0 pageerrors (phone sheet)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      // F. Vowels mode from the URL: 13 vowel cards (every vowel on, the default), the Vowels button pressed, the tips
      // block shown and no dialog (a stale ?letter= is ignored); the buttons swap the grid and mirror only the mode into
      // the address bar.
      {
        const { ctx, page, errors } = await openPage(browser, 'letter_learner.html', { query: '?mode=vowels&letter=bet' });
        const r = await page.evaluate(() => ({ mode: _llMode, cards: document.querySelectorAll('.ll-card').length, vcards: document.querySelectorAll('.ll-card.ll-vcard').length, pressed: document.getElementById('llModeVowels').getAttribute('aria-pressed'), tips: !document.getElementById('llTips').hidden, open: !document.getElementById('llOverlay').hidden, gridKey: document.getElementById('llGrid').getAttribute('data-i18n-aria-label') }));
        check(tag + ' F: ?mode=vowels shows the 13 vowel cards, presses Vowels, shows the tips and opens nothing', r.mode === 'vowels' && r.cards === 13 && r.vcards === 13 && r.pressed === 'true' && r.tips && !r.open && r.gridKey === 'letterlearner.grid.vowels_aria', JSON.stringify(r));
        await page.click('#llModeLetters');
        const r2 = await page.evaluate(() => ({ mode: _llMode, cards: document.querySelectorAll('.ll-card').length, search: location.search, tips: !document.getElementById('llTips').hidden }));
        await page.click('#llModeVowels');
        const r3 = await page.evaluate(() => ({ mode: _llMode, cards: document.querySelectorAll('.ll-card').length, search: location.search }));
        check(tag + ' F: the buttons swap the grid (31 / 13 cards) and mirror only the mode into the address bar', r2.mode === 'letters' && r2.cards === 31 && r2.tips && !/mode=|letter=|vowel=/.test(r2.search) && r3.mode === 'vowels' && r3.cards === 13 && r3.search === '?mode=vowels', JSON.stringify([r2, r3]));
        check(tag + ' F: 0 pageerrors (mode switch)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      // G. ?vowel=patach opens its card on the Story tab with the aqua glyph, the letter tabs hidden and the Fonts tab
      // offered; the mode writes nothing, so the stored options stay byte-identical through a load + flush.
      {
        const { ctx, page, errors } = await openPage(browser, 'letter_learner.html', { seed: { hebrewLetterLearner_settings: seedText }, query: '?vowel=patach' });
        const r = await page.evaluate(() => { llSaveSettingsIfChanged(); return { mode: _llMode, open: !document.getElementById('llOverlay').hidden, id: _llId, tab: document.querySelector('.ll-tabs [role="tab"][aria-selected="true"]').id, story: !document.getElementById('llPanel-story').hidden, glyph: document.getElementById('llDlgGlyph').textContent, fam: document.getElementById('llDlgGlyph').dataset.fam, pic: !!document.querySelector('#llPanel-story .ll-hint-pic svg'), rows: document.querySelectorAll('#llPanel-story .ll-vrow').length, fontTab: !document.getElementById('llTab-font').hidden, letterTab: document.getElementById('llTab-letter').hidden, same: localStorage.getItem('hebrewLetterLearner_settings') === JSON.stringify(settings), stored: localStorage.getItem('hebrewLetterLearner_settings') }; });
        check(tag + ' G: ?vowel=patach opens Patach on the Story tab (drawing, four syllables, aqua), letter tabs hidden, Fonts offered; the stored options survive unchanged', r.mode === 'vowels' && r.open && r.id === 'patach' && r.tab === 'llTab-story' && r.story && r.glyph === 'אַ' && r.fam === 'ah' && r.pic && r.rows === 4 && r.fontTab && r.letterTab && r.same && r.stored === seedText, JSON.stringify(r));
        check(tag + ' G: 0 pageerrors (vowel deep link)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      // H. a garbage ?vowel= stays on the letters (31 cards, nothing open); the Options card's "Vowels to show" limits
      // the vowel grid like the Vowels tab, and a switched-off ?vowel= switches the mode but opens nothing.
      {
        const { ctx, page, errors } = await openPage(browser, 'letter_learner.html', { query: '?vowel=zzz%3Cb%3E' });
        const r = await page.evaluate(() => ({ mode: _llMode, open: !document.getElementById('llOverlay').hidden, cards: document.querySelectorAll('.ll-card').length }));
        check(tag + ' H: a garbage ?vowel= opens nothing and stays on the letters (31 cards)', r.mode === 'letters' && !r.open && r.cards === 31, JSON.stringify(r));
        await ctx.close();
        const eight = JSON.stringify({ v: 1, vowels: { kamatz: true, patach: false, tzere: true, segol: true, chirik: true, cholam: true, vav_cholam: true, kubutz: false, shuruk: true, sheva: true, chataf_patach: false, chataf_segol: false, chataf_kamatz: false }, fontTab: false, splitPairs: false, wordAudio: true, voiceURI: '' });
        const p2 = await openPage(browser, 'letter_learner.html', { seed: { hebrewLetterLearner_settings: eight }, query: '?vowel=patach' });
        const r2 = await p2.page.evaluate(() => ({ mode: _llMode, cards: document.querySelectorAll('.ll-card.ll-vcard').length, open: !document.getElementById('llOverlay').hidden }));
        check(tag + ' H: with eight vowels on, Vowels mode shows eight cards and a switched-off ?vowel= opens nothing', r2.mode === 'vowels' && r2.cards === 8 && !r2.open, JSON.stringify(r2));
        check(tag + ' H: 0 pageerrors (garbage vowel, limited grid)', errors.length === 0 && p2.errors.length === 0, errors.concat(p2.errors).join(' | '));
        await p2.ctx.close();
      }
      // I. the phone sheet with a vowel open: the Story tab sits below the sticky head, as the letter tabs do.
      {
        const { ctx, page, errors } = await openPage(browser, 'letter_learner.html', { viewport: { width: 390, height: 844 }, query: '?vowel=shuruk' });
        const r = await page.evaluate(() => {
          const head = document.querySelector('.ll-dlg-head').getBoundingClientRect(), strip = document.querySelector('.ll-tabs');
          const tab = document.querySelector('.ll-tabs [role="tab"][aria-selected="true"]'), tr = tab.getBoundingClientRect();
          return { open: !document.getElementById('llOverlay').hidden, tab: tab.id, headBottom: Math.round(head.bottom), tabTop: Math.round(tr.top), tabH: Math.round(tr.height), stripClient: strip.clientHeight, stripScroll: strip.scrollHeight, sheetW: Math.round(document.querySelector('.ll-dialog').getBoundingClientRect().width), fits: document.documentElement.scrollWidth <= window.innerWidth };
        });
        check(tag + ' I: on a 390px phone a vowel sheet is full-width, its Story tab below the sticky head, nothing clipped or overflowing', r.open && r.tab === 'llTab-story' && r.sheetW === 390 && r.tabTop >= r.headBottom && r.tabH >= 36 && r.stripScroll <= r.stripClient + 1 && r.fits, JSON.stringify(r));
        check(tag + ' I: 0 pageerrors (phone vowel sheet)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      // J. Cursive mode from the URL: the same 31 cards as Block (none "coming soon" — every letter has a trick entry) in the
      // handwriting face, the Cursive button pressed, the tips block showing the six look-alike pairs + the finals rule under
      // its own summary key, no dialog; the three buttons cycle the grid and mirror only the mode into the address bar.
      {
        const { ctx, page, errors } = await openPage(browser, 'letter_learner.html', { query: '?mode=cursive' });
        const r = await page.evaluate(() => ({ mode: _llMode, cards: document.querySelectorAll('.ll-card').length, ccards: document.querySelectorAll('.ll-card.ll-ccard').length, soon: document.querySelectorAll('.ll-card.is-soon').length, pressed: document.getElementById('llModeCursive').getAttribute('aria-pressed'), tips: !document.getElementById('llTips').hidden, tipRows: document.querySelectorAll('#llTipsList li').length, summaryKey: document.getElementById('llTipsSummary').getAttribute('data-i18n'), gridKey: document.getElementById('llGrid').getAttribute('data-i18n-aria-label'), open: !document.getElementById('llOverlay').hidden, script: document.querySelector('.ll-dialog').dataset.script || '', font: getComputedStyle(document.querySelector('.ll-ccard .ll-card-glyph')).fontFamily }));
        check(tag + ' J: ?mode=cursive shows the 31 cursive cards (none "soon"), presses Cursive, shows the look-alike tips (6 pairs + the rule) and opens nothing', r.mode === 'cursive' && r.cards === 31 && r.ccards === 31 && r.soon === 0 && r.pressed === 'true' && r.tips && r.tipRows === 7 && r.summaryKey === 'letterlearner.tips.cursive_summary' && r.gridKey === 'letterlearner.grid.cursive_aria' && !r.open && r.script === '' && /IvritSuite Ktav/.test(r.font), JSON.stringify(r));
        await page.click('#llModeLetters');
        const r2 = await page.evaluate(() => ({ mode: _llMode, cards: document.querySelectorAll('.ll-card').length, ccards: document.querySelectorAll('.ll-ccard').length, tips: !document.getElementById('llTips').hidden, search: location.search, tipRows: document.querySelectorAll('#llTipsList li').length, pairs: LETTER_PAIR_LIST.length, summaryKey: document.getElementById('llTipsSummary').getAttribute('data-i18n'), introKey: document.getElementById('llTipsIntro').getAttribute('data-i18n'), font: getComputedStyle(document.querySelector('#llTipsList .ll-tip-pair')).fontFamily }));
        await page.click('#llModeCursive');
        const r3 = await page.evaluate(() => ({ mode: _llMode, ccards: document.querySelectorAll('.ll-ccard').length, search: location.search }));
        await page.click('#llModeVowels');
        const r4 = await page.evaluate(() => ({ mode: _llMode, cards: document.querySelectorAll('.ll-card').length, search: location.search, tipRows: document.querySelectorAll('#llTipsList li').length, summaryKey: document.getElementById('llTipsSummary').getAttribute('data-i18n') }));
        check(tag + ' J: the three buttons cycle the grid (31 / 31 cursive / 13) and mirror only the mode into the address bar; the tips follow the mode (Block: its own look-alike pairs in the block face + the finals rule)', r2.mode === 'letters' && r2.cards === 31 && r2.ccards === 0 && r2.tips && r2.pairs >= 1 && r2.tipRows === r2.pairs + 1 && r2.summaryKey === 'letterlearner.tips.cursive_summary' && r2.introKey === 'letterlearner.tips.block_intro' && /Frank Ruhl/.test(r2.font) && !/mode=|letter=|vowel=/.test(r2.search) && r3.mode === 'cursive' && r3.ccards === 31 && r3.search === '?mode=cursive' && r4.mode === 'vowels' && r4.cards === 13 && r4.search === '?mode=vowels' && r4.tipRows === 6 && r4.summaryKey === 'letterlearner.tips.summary', JSON.stringify([r2, r3, r4]));
        check(tag + ' J: 0 pageerrors (cursive mode)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      // K. ?mode=cursive&letter=dalet opens Dalet on the Letter tab in the cursive face: the "Print and cursive" line (the
      // print glyph in its own face), the trick figure with the write-up's Picture as its lead, the two look-alike rows
      // (He, Tzadi), the four words, the Vowels and Fonts tabs offered; the mode writes nothing, so the stored options stay
      // byte-identical through a load + flush.
      {
        const { ctx, page, errors } = await openPage(browser, 'letter_learner.html', { seed: { hebrewLetterLearner_settings: seedText }, query: '?mode=cursive&letter=dalet' });
        const r = await page.evaluate(() => { llSaveSettingsIfChanged(); return { mode: _llMode, open: !document.getElementById('llOverlay').hidden, id: _llId, tab: document.querySelector('.ll-tabs [role="tab"][aria-selected="true"]').id, script: document.querySelector('.ll-dialog').dataset.script, forms: !!document.querySelector('#llPanel-letter .ll-forms-line'), lead: (document.querySelector('#llPanel-letter figcaption .ll-trick-lead') || {}).textContent, look: [...document.querySelectorAll('#llPanel-letter .ll-lookalike strong')].map(s => s.textContent.trim()).join(','), words: document.querySelectorAll('#llPanel-letter .ll-word').length, wordFont: getComputedStyle(document.querySelector('#llPanel-letter .ll-word-he')).fontFamily, blockFont: getComputedStyle(document.querySelector('#llPanel-letter .ll-glyph-block')).fontFamily, dlgFont: getComputedStyle(document.getElementById('llDlgGlyph')).fontFamily, vowelsTab: !document.getElementById('llTab-vowels').hidden, fontTab: !document.getElementById('llTab-font').hidden, specialTab: !document.getElementById('llTab-special').hidden, same: localStorage.getItem('hebrewLetterLearner_settings') === JSON.stringify(settings), stored: localStorage.getItem('hebrewLetterLearner_settings') }; });
        check(tag + ' K: ?mode=cursive&letter=dalet opens Dalet in the cursive face — forms line, "The number 3" lead, look-alikes He + Tzadi, 4 words; the stored options survive unchanged', r.mode === 'cursive' && r.open && r.id === 'dalet' && r.tab === 'llTab-letter' && r.script === 'cursive' && r.forms && r.lead === 'The number 3' && r.look === 'He:,Tzadi:' && r.words === 4 && /IvritSuite Ktav/.test(r.wordFont) && /Frank Ruhl Libre/.test(r.blockFont) && /IvritSuite Ktav/.test(r.dlgFont) && r.vowelsTab && r.fontTab && !r.specialTab && r.same && r.stored === seedText, JSON.stringify(r));
        check(tag + ' K: 0 pageerrors (cursive deep link)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      // L. With the pairs folded, ?mode=cursive&letter=vet opens Bet (27 cards, the Special tab carrying the pair); a final
      // card carries the final note and the finals rule and offers no Vowels tab.
      {
        const folded = JSON.stringify({ v: 1, vowels: { kamatz: true, patach: false, tzere: true, segol: true, chirik: true, cholam: true, vav_cholam: true, kubutz: false, shuruk: true, sheva: true, chataf_patach: false, chataf_segol: false, chataf_kamatz: false }, fontTab: false, splitPairs: false, wordAudio: true, voiceURI: '' });
        const { ctx, page, errors } = await openPage(browser, 'letter_learner.html', { seed: { hebrewLetterLearner_settings: folded }, query: '?mode=cursive&letter=vet' });
        const r = await page.evaluate(() => ({ id: _llId, cards: document.querySelectorAll('.ll-ccard').length, open: !document.getElementById('llOverlay').hidden, special: !document.getElementById('llTab-special').hidden }));
        check(tag + ' L: with the pairs folded, a cursive ?letter=vet opens Bet (27 cards, Special tab offered)', r.id === 'bet' && r.cards === 27 && r.open && r.special, JSON.stringify(r));
        await ctx.close();
        const p2 = await openPage(browser, 'letter_learner.html', { query: '?mode=cursive&letter=nun_sofit' });
        const r2 = await p2.page.evaluate(() => ({ id: _llId, rule: !!document.querySelector('#llPanel-letter .ll-finals-rule'), note: !!document.querySelector('#llPanel-letter .ll-final-note'), vowels: !document.getElementById('llTab-vowels').hidden, look: document.querySelectorAll('#llPanel-letter .ll-lookalike').length }));
        check(tag + ' L: a cursive final card carries the final note and the finals rule, one look-alike (vav) and no Vowels tab', r2.id === 'nun_sofit' && r2.rule && r2.note && !r2.vowels && r2.look === 1, JSON.stringify(r2));
        const p3 = await openPage(browser, 'letter_learner.html', { query: '?letter=nun_sofit' });
        const r3 = await p3.page.evaluate(() => { const n = document.querySelector('#llPanel-letter .ll-final-note'), rule = document.querySelector('#llPanel-letter .ll-finals-rule'); return { id: _llId, mode: _llMode, rule: !!rule, note: !!n, after: !!(n && rule && n.nextElementSibling === rule) }; });
        check(tag + ' L: a Block final card carries the final note and the finals rule right under it', r3.id === 'nun_sofit' && r3.mode === 'letters' && r3.rule && r3.note && r3.after, JSON.stringify(r3));
        check(tag + ' L: 0 pageerrors (fold + final)', errors.length === 0 && p2.errors.length === 0 && p3.errors.length === 0, errors.concat(p2.errors, p3.errors).join(' | '));
        await p2.ctx.close();
        await p3.ctx.close();
      }
      // M. Garbage: a bad ?letter= in cursive mode keeps the cursive grid and opens nothing; an unknown ?mode= is Block.
      {
        const a = await openPage(browser, 'letter_learner.html', { query: '?mode=cursive&letter=zzz%3Cb%3E' });
        const ra = await a.page.evaluate(() => ({ mode: _llMode, cards: document.querySelectorAll('.ll-ccard').length, open: !document.getElementById('llOverlay').hidden }));
        const b = await openPage(browser, 'letter_learner.html', { query: '?mode=zzz' });
        const rb = await b.page.evaluate(() => ({ mode: _llMode, cards: document.querySelectorAll('.ll-card').length, ccards: document.querySelectorAll('.ll-ccard').length }));
        check(tag + ' M: a garbage cursive ?letter= opens nothing (31 cursive cards); ?mode=zzz is the block grid', ra.mode === 'cursive' && ra.cards === 31 && !ra.open && rb.mode === 'letters' && rb.cards === 31 && rb.ccards === 0, JSON.stringify([ra, rb]));
        check(tag + ' M: 0 pageerrors (garbage)', a.errors.length === 0 && b.errors.length === 0, a.errors.concat(b.errors).join(' | '));
        await a.ctx.close(); await b.ctx.close();
      }
      // N. On a 390px phone, EN and HE: the three mode buttons share one row at 44px+ with nothing overflowing, and a cursive
      // sheet's Letter tab sits below the sticky head (the E assertions).
      for (const lang of ['', '&lang=he']) {
        const { ctx, page, errors } = await openPage(browser, 'letter_learner.html', { viewport: { width: 390, height: 844 }, query: '?mode=cursive&letter=alef' + lang });
        const r = await page.evaluate(() => {
          const btns = [...document.querySelectorAll('.ll-mode-btn')].map(b => b.getBoundingClientRect());
          const head = document.querySelector('.ll-dlg-head').getBoundingClientRect(), strip = document.querySelector('.ll-tabs');
          const tab = document.querySelector('.ll-tabs [role="tab"][aria-selected="true"]').getBoundingClientRect();
          return { lang: document.documentElement.lang, fits: document.documentElement.scrollWidth <= window.innerWidth, btnH: btns.map(b => Math.round(b.height)), oneRow: Math.max(...btns.map(b => b.top)) - Math.min(...btns.map(b => b.top)) < 4, open: !document.getElementById('llOverlay').hidden, tabTop: Math.round(tab.top), headBottom: Math.round(head.bottom), strip: strip.scrollHeight <= strip.clientHeight + 1, sheetW: Math.round(document.querySelector('.ll-dialog').getBoundingClientRect().width) };
        });
        check(tag + ' N: on a 390px phone (' + (lang ? 'HE' : 'EN') + ') the three mode buttons share one row at 44px+, nothing overflows, and the cursive sheet\'s Letter tab sits below the sticky head', r.lang === (lang ? 'he' : 'en') && r.fits && r.btnH.every(h => h >= 44) && r.oneRow && r.open && r.tabTop >= r.headBottom && r.strip && r.sheetW === 390, JSON.stringify(r));
        check(tag + ' N: 0 pageerrors (phone cursive ' + (lang ? 'HE' : 'EN') + ')', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
    }
  },
  {
    file: 'torah_trainer.html', tool: 'TorahTrainer', host: '#cloudSavesPanel',
    seed: {
      hebrewTorahTrainer_settings: JSON.stringify({ parshahKey: 'bereshit', scope: 'parsha-full', layout: 'stacked', showTranslit: true, hebFont: 'Frank Ruhl Libre', hebFontSize: 2.4, vowelColorScheme: 'default', lastPos: { readingKey: 'bereshit', verse: '1:3', ts: 1700000000000 }, panelsCollapsed: { 'torah.settings.panel_copy': true }, karaokeBarCollapsed: false }),
      hebrewTorahTrainer_favorites: JSON.stringify({ 'Bereshit — Aliyah 1': { v: 1, ref: { kind: 'parsha', parshahKey: 'Bereshit', scope: 'parsha-aliyah-1' }, color: '#e69f00', ts: 1700000000000 } }),
      hebrewTorahTrainer_favoritesFolders: JSON.stringify({ v: 1, root: [{ t: 'folder', id: 'tf', name: 'Year 1', collapsed: false, children: [{ t: 'item', name: 'Bereshit — Aliyah 1' }] }] })
    },
    rows: ['favorite:Bereshit — Aliyah 1', 'settings:default'],
    expand: `openSettingsAtPanel('cloud');`,
    urlKeep: 'parsha=Bereshit&v=1:1',
    // E. the chosen translation stays chosen when this book's list does not offer it: a substitute is shown, never saved
    extra: async ({ browser, tag }) => {
      const { ctx, page, errors } = await openPage(browser, 'torah_trainer.html', { seed: { hebrewTorahTrainer_settings: JSON.stringify({ translationVersion: 'Made Up Version', showTranslation: true }) } });
      const r = await page.evaluate(async () => {
        fetchVersionsList = async () => [{ versionTitle: 'The Holy Scriptures: A New Translation (JPS 1917)', language: 'en', license: 'Public Domain' }, { versionTitle: 'Other English', language: 'en', license: 'Public Domain' }];   // Sefaria is blocked here: a canned list
        await populateVersionDropdown('Genesis');
        saveSettingsFlush();
        return { stored: JSON.parse(localStorage.getItem('hebrewTorahTrainer_settings')).translationVersion, inMemory: settings.translationVersion, shown: document.getElementById('ttVersionSelect').value, effective: effectiveVersion() };
      });
      check(tag + ' E: a translation this book does not offer stays the stored choice; the substitute is only shown', r.stored === 'Made Up Version' && r.inMemory === 'Made Up Version' && /JPS 1917/.test(r.shown) && /JPS 1917/.test(r.effective), JSON.stringify(r));
      check(tag + ' E: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  },
  {
    file: 'flash_cards.html', tool: 'FlashCards', host: '#cloudSavesPanel',
    seed: {
      hebrewFlashCards_presets: JSON.stringify({ 'Deck A': { settings: { mode: 2, cardCount: 12 }, order: 1700000000000 }, 'Deck B': { settings: { mode: 1, cardCount: 8 }, order: 1700000001000 } }),
      hebrewFlashCards_presetsFolders: JSON.stringify({ v: 1, root: [{ t: 'folder', id: 'f1', name: 'Week 1', children: [{ t: 'item', name: 'Deck A' }] }, { t: 'item', name: 'Deck B' }] }),
      hebrewFlashCards_settings: JSON.stringify({ mode: 2, cardCount: 20, selectedLetters: ['א', 'ב'], selectedVowels: ['kamatz'] }),
      hebrewFlashCards_pbStreak: '4',
      hebrewFlashCards_profiles: JSON.stringify({ activeProfile: 'Sarah', profiles: { Sarah: { created: 1700000000000, order: 1700000000000, results: [{ savedAt: '2026-09-01T10:00:00.000Z', pct: 90, correct: 9, total: 10, timeSec: 40, timerMode: 'off', settings: {}, cards: [] }], ladder: { levels: { l1: { bestPct: 90, passedAt: '2026-09-01T10:00:00.000Z' } } } }, Dan: { created: 1700000000000, order: 1700000000001, results: [] } } }),
      hebrewFlashCards_profilesFolders: JSON.stringify({ v: 1, root: [{ t: 'item', name: 'Sarah' }, { t: 'item', name: 'Dan' }] })
    },
    rows: ['preset:Deck A', 'preset:Deck B', 'settings:default', 'pbStreak:default', 'profile:Sarah', 'profile:Dan'],
    expand: `const p = document.getElementById('panelAdvanced'); if (p.classList.contains('collapsed')) p.querySelector('.panel-title').click(); document.querySelector('.adv-subhead[data-i18n="flashcards.advanced.cloud_head"]').scrollIntoView();`,
    urlKeep: 's=abc',
    // E. what a sync must never change: the listening preference on a browser without speech, and the
    // teacher's own settings while a ?s= link's drill runs
    extra: async ({ browser, tag }) => {
      const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const captureSettings = async () => { const first = await openPage(browser, 'flash_cards.html', {}); const base = await first.page.evaluate(() => getSettings()); await first.ctx.close(); return base; };
      {
        const seedText = JSON.stringify(Object.assign({}, await captureSettings(), { listening: true }));
        const { ctx, page, errors } = await openPage(browser, 'flash_cards.html', { seed: { hebrewFlashCards_settings: seedText }, init: () => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); } });
        const r = await page.evaluate(() => { saveSettings(); const t = document.getElementById('listeningToggle'); return { after: localStorage.getItem('hebrewFlashCards_settings'), checked: t.checked, disabled: t.disabled, supported: speechSupported }; });
        check(tag + ' E: without speech the listening preference is kept — toggle off and disabled here, the stored settings byte-identical', !r.supported && r.disabled && !r.checked && r.after === seedText, JSON.stringify({ supported: r.supported, disabled: r.disabled, checked: r.checked, listening: JSON.parse(r.after || '{}').listening }) + ' ' + diffKeys(JSON.stringify([['s', seedText]]), JSON.stringify([['s', r.after]])));
        check(tag + ' E: 0 pageerrors (no speech)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      {
        const seedText = JSON.stringify(Object.assign({}, await captureSettings(), { mode: 2, cardCount: 12 }));
        const link = b64({ selectedLetters: ['א', 'ב', 'ג'], selectedVowels: ['a', 'patah'], mode: 1, cardCount: 6 });   // Flash Cards vowel keys (not the generator's)
        const { ctx, page, errors } = await openPage(browser, 'flash_cards.html', { seed: { hebrewFlashCards_settings: seedText }, query: '?s=' + link });
        await page.waitForFunction(() => { const a = document.querySelector('.screen.active'); return !!a && a.id !== 'screenSetup'; }, null, { timeout: 10000 }).catch(() => {});
        const r = await page.evaluate(() => { saveSettings(); return { screen: (document.querySelector('.screen.active') || {}).id, mode, shared: _sharedDrill, after: localStorage.getItem('hebrewFlashCards_settings') }; });
        await page.evaluate(() => showScreen('screenSetup'));
        const back = await page.evaluate(() => ({ mode, cardCount, shared: _sharedDrill, after: localStorage.getItem('hebrewFlashCards_settings') }));
        check(tag + ' E: a ?s= link runs as a transient drill (mode 1) and leaves the stored settings byte-identical', r.screen !== 'screenSetup' && r.mode === 1 && r.shared === true && r.after === seedText, JSON.stringify({ screen: r.screen, mode: r.mode, shared: r.shared, same: r.after === seedText }));
        check(tag + " E: back on the setup screen the teacher's own settings return and the store still matches", back.mode === 2 && back.cardCount === 12 && back.shared === false && back.after === seedText, JSON.stringify({ mode: back.mode, cardCount: back.cardCount, shared: back.shared, same: back.after === seedText }));
        check(tag + ' E: 0 pageerrors (?s=)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
    }
  },
  {
    file: 'hebrew_blend_generator.html', tool: 'Worksheet', host: '#cloudSavesPanel',
    seed: {
      hebrewBlender_presets: JSON.stringify({ 'Week 1': { selectedLetters: ['א', 'ב'], selectedVowels: ['kamatz'], pageSize: 'letter' }, 'Review': { selectedLetters: ['ג'], selectedVowels: ['patach'] } }),
      hebrewBlender_presetsFolders: JSON.stringify({ v: 1, root: [{ t: 'folder', id: 'f1', name: 'Fall', children: [{ t: 'item', name: 'Week 1' }] }, { t: 'item', name: 'Review' }] }),
      hebrewBlender_lastState: JSON.stringify({ selectedLetters: ['א', 'ב', 'ג'], selectedVowels: ['kamatz', 'patach'], headerLang: 'en' })
    },
    rows: ['preset:Week 1', 'preset:Review', 'lastState:default'],
    expand: `const adv = document.getElementById('panelAdvanced'); if (adv.classList.contains('collapsed')) adv.querySelector(':scope > .panel-title').click(); const t = document.querySelector('.panel-title[data-i18n="worksheet.advanced.cloud_title"]'); if (t.parentElement.classList.contains('collapsed')) t.click(); t.scrollIntoView();`,
    urlKeep: 's=abc',
    // E. what a sync must never change: the remembered setup on a ?ak= load, and a setup carrying what this
    // device cannot show (a My Font made elsewhere, a list it lacks, values this build does not offer)
    extra: async ({ browser, tag }) => {
      const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const setup = JSON.stringify({ selectedLetters: ['א', 'ב', 'ג'], selectedVowels: ['kamatz', 'patach'], headerLang: 'he', pageSize: 'a4' });
      {
        const { ctx, page, errors } = await openPage(browser, 'hebrew_blend_generator.html', { seed: { hebrewBlender_lastState: setup }, query: '?ak=' + b64({ v: 1, type: 'ntl', items: [['אָ', 'a'], ['בָּ', 'ba']] }) });
        const r = await page.evaluate(() => { rememberSetup(); window.dispatchEvent(new Event('pagehide')); return { after: localStorage.getItem('hebrewBlender_lastState'), akView: _answerKeyView === true }; });   // a top-level let: reachable by name, not on window
        check(tag + ' E: a ?ak= load shows the answer key and leaves the remembered setup byte-identical', r.akView && r.after === setup, JSON.stringify({ akView: r.akView, after: (r.after || '').slice(0, 160) }));
        check(tag + ' E: 0 pageerrors (?ak=)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      {
        const first = await openPage(browser, 'hebrew_blend_generator.html', {});
        const base = await first.page.evaluate(() => getSettings());
        await first.ctx.close();
        const mutated = Object.assign({}, base, { hebFont: 'Made Elsewhere', rwSource: 'lists', selectedWordListIds: ['nope_123'], selectedWordListNames: ['Gone list'], traceLineStyle: 'zigzag', wsWordCount: '999', headerLang: 'he' });
        const seedText = JSON.stringify(mutated);
        const { ctx, page, errors } = await openPage(browser, 'hebrew_blend_generator.html', { seed: { hebrewBlender_lastState: seedText } });
        await page.waitForTimeout(500);   // the My Fonts store answers (the missing-font note waits for it)
        const r = await page.evaluate(() => { rememberSetup(); const n = document.getElementById('hebFontMissing'); return { after: localStorage.getItem('hebrewBlender_lastState'), font: localStorage.getItem('hebrewBlender_hebFont'), active: document.querySelectorAll('.font-opt.active').length, note: n ? n.textContent : '', noteHidden: n ? n.hidden : null }; });
        check(tag + ' E: an unknown font, an absent list id and unoffered values survive a load-then-flush round trip byte-for-byte', r.after === seedText, diffKeys(JSON.stringify([['setup', seedText]]), JSON.stringify([['setup', r.after]])));
        check(tag + ' E: the missing font is named under the picker, no face is highlighted, the shared font key carries the name', /Made Elsewhere/.test(r.note) && r.noteHidden === false && r.active === 0 && r.font === 'Made Elsewhere', JSON.stringify({ note: r.note, hidden: r.noteHidden, active: r.active, font: r.font }));
        check(tag + ' E: 0 pageerrors (round trip)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      {
        // a honoured ?s= link leaves the address bar (a reload then reopens the remembered setup, not the link)
        const first = await openPage(browser, 'hebrew_blend_generator.html', {});
        const link = await first.page.evaluate(() => shareB64Encode(JSON.stringify({ headerLang: 'he' })));
        await first.ctx.close();
        const { ctx, page, errors } = await openPage(browser, 'hebrew_blend_generator.html', { query: '?s=' + link + '&lang=en' });
        const r = await page.evaluate(() => ({ search: location.search, headerLang: getSettings().headerLang }));
        check(tag + ' E: a valid ?s= link is applied and then stripped from the address bar, other params kept', r.headerLang === 'he' && !/[?&]s=/.test(r.search) && /lang=en/.test(r.search), JSON.stringify(r));
        check(tag + ' E: 0 pageerrors (?s=)', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
    }
  },
  {
    file: 'hebrew_dictionary.html', tool: 'Dictionary', host: '#wlCloudPanel',
    seed: {
      ivritSuite_wordLists: JSON.stringify({ v: 1, lists: {
        m1abc_x1y2z: { name: 'Week 3 words', created: 1700000000000, updated: 1700000100000, words: [{ word: 'שָׁלוֹם', translation: 'peace', translit: 'shalom', pos: 'noun', era: 'bib' }] },
        m1abd_q9w8e: { name: 'Colors', created: 1700000200000, updated: 1700000300000, words: [{ word: 'אָדֹם', translation: 'red', translit: 'adom', pos: 'adj', era: 'mod' }, { word: 'כָּחֹל', translation: 'blue', translit: 'kachol', pos: 'adj', era: 'mod' }] }
      } })
    },
    rows: ['wordList:m1abc_x1y2z', 'wordList:m1abd_q9w8e'],
    prepare: `wlOpenManager();`,
    // E. the emoji category exclusions survive a load that reopens Emoji mode (the first save used to run
    // before the catalogue was loaded and wrote [] over them)
    extra: async ({ browser, tag }) => {
      const { ctx, page, errors } = await openPage(browser, 'hebrew_dictionary.html', { seed: { hebrewDictionary_emojiSettings: JSON.stringify({ mode: true, gender: 'all', excludedSubs: ['Animal|Mammal'] }) } });
      const early = await page.evaluate(() => JSON.parse(localStorage.getItem('hebrewDictionary_emojiSettings')).excludedSubs);
      await page.waitForFunction(() => !!EMOJI_DATA, null, { timeout: 20000 }).catch(() => {});
      const r = await page.evaluate(() => { saveEmojiSettings(); return { loaded: !!EMOJI_DATA, stored: JSON.parse(localStorage.getItem('hebrewDictionary_emojiSettings')).excludedSubs, live: _dictEmojiExcluded() }; });
      check(tag + ' E: the emoji exclusions were kept through the load (before and after the catalogue arrived)', JSON.stringify(early) === '["Animal|Mammal"]' && r.loaded && JSON.stringify(r.stored) === '["Animal|Mammal"]' && JSON.stringify(r.live) === '["Animal|Mammal"]', JSON.stringify({ early, r }));
      check(tag + ' E: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
      // The nikkud colour coding survives a load, and a stored blob is import-target data: an unknown vowel
      // key and anything that is not a plain hex colour are dropped before a colour can reach a style attribute.
      {
        const seeded = JSON.stringify({ on: true, mode: 'underline', overrides: { a: '#123456', patah: 'red; background:url(x)', nosuchkey: '#abcdef', e: '#fff' } });
        const c2 = await openPage(browser, 'hebrew_dictionary.html', { seed: { hebrewDictionary_nikudColors: seeded } });
        const st = await c2.page.evaluate(() => ({
          on: colorCodingEnabled, mode: colorCodingMode, over: nikudColorOverrides,
          checked: document.getElementById('colorCodingToggle').checked,
          optsShown: document.getElementById('colorCodingOptions').style.display !== 'none',
          underlineActive: document.getElementById('colorModeUnderline').getAttribute('aria-pressed') === 'true'
        }));
        check(tag + ' E: the stored colour coding came back onto the state and the controls', st.on === true && st.mode === 'underline' && st.checked && st.optsShown && st.underlineActive, JSON.stringify(st));
        check(tag + ' E: a bad colour and an unknown vowel key were dropped, the good ones kept', JSON.stringify(st.over) === JSON.stringify({ a: '#123456', e: '#fff' }), JSON.stringify(st.over));
        const round = await c2.page.evaluate(() => { toggleColorCoding(false); setColorMode('highlight'); return localStorage.getItem('hebrewDictionary_nikudColors'); });
        const rb = JSON.parse(round || '{}');
        check(tag + ' E: turning it off and changing the mode are both written straight away', rb.on === false && rb.mode === 'highlight' && rb.overrides && rb.overrides.a === '#123456', round);
        check(tag + ' E: 0 pageerrors (colour coding)', c2.errors.length === 0, c2.errors.join(' | '));
        await c2.ctx.close();
      }
    },
    expand: `wlOpenManager();`,
    urlKeep: 'wordlists=open'
  },
  {
    file: 'classroom_dashboard.html', tool: 'Dashboard', host: '#cloudSavesPanel',
    seed: {
      hebrewDashboard_settings: JSON.stringify({ location: 'Atlanta, GA', engDateFmt: 'LONG', hebFont: 'Frank Ruhl Libre', dashTextHTML: '<p>Boker tov!</p>', presetColors: { Morning: '#aabbcc' },
        rosters: { m1r_0: { name: 'Kitah Alef', names: ['Noa', 'Eitan', 'Maya'] }, m1r_1: { name: 'Kitah Bet', names: ['Ari'] } }, activeRosterId: 'm1r_0', pickerSessions: { m1r_0: { picked: ['Noa'], absent: [] } },
        zoomLevel: 1.2, hideZoomBar: true, panelsCollapsed: { 'dashboard.settings.panel_weather': true }, videoCollapsed: true, keepAwake: false, _geoCoords: { lat: 33.7, lon: -84.4 } }),
      hebrewDashboard_presets: JSON.stringify({ Morning: { headerLang: 'en', showTimer: true }, Tefillah: { headerLang: 'he', showTimer: false } }),
      hebrewDashboard_presetsFolders: JSON.stringify({ v: 1, root: [{ t: 'item', name: 'Morning' }, { t: 'item', name: 'Tefillah' }] }),
      hebrewDashboard_schedules: JSON.stringify({ 'Week A': { v: 2, week: { v: 1, periods: [{ start: '08:00', end: '08:45' }], weekend: false, cells: { mon: ['Morning'] } } }, 'Old day': [{ preset: 'Morning', until: '09:00' }] }),
      hebrewDashboard_schedulesFolders: JSON.stringify({ v: 1, root: [{ t: 'item', name: 'Week A' }, { t: 'item', name: 'Old day' }] })
    },
    rows: ['preset:Morning', 'preset:Tefillah', 'schedule:Week A', 'schedule:Old day', 'settings:default', 'roster:m1r_0', 'roster:m1r_1'],
    expand: `openSettingsAtPanel('cloud');`,
    urlKeep: 'lang=en'
  },
  {
    file: 'emoji_torah.html', tool: 'EmojiTorah', host: '#cloudSavesPanel',
    // The seed is the page's own shape (field order included: the defaults' order, a chosen textLang last): the page
    // writes only on a change, so a load must leave the text byte-identical.
    seed: {
      hebrewEmojiTorah_settings: JSON.stringify({ v: 1, colored: true, paper: 'a4', orient: 'landscape', showHe: true, showEn: false, showRef: true, showSummary: true, showWhy: false, showName: true, sizePic: 120, sizeEn: 100, sizeHe: 110, sizeRef: 100, sizeSummary: 90, sizeWhy: 100, sizeName: 100, copies: 2, collate: 'grouped', textLang: 'both' })
    },
    rows: ['settings:default'],
    expand: `etCsOpen(); document.getElementById('cloudSavesPanel').scrollIntoView();`,
    // E. the coloring popup opens on the stored options and the module's flush leaves the text byte-identical; a change
    // is written onto the stored object, so a field this build does not know (a newer build's) survives it, and a value
    // it cannot apply falls back on screen while staying stored
    extra: async ({ browser, tag }) => {
      const seedText = JSON.stringify({ v: 1, colored: false, paper: 'letter', orient: 'portrait', showHe: true, showEn: true, showRef: true, showSummary: true, showWhy: true, showName: true, sizePic: 999, sizeEn: 100, sizeHe: 100, sizeRef: 100, sizeSummary: 100, sizeWhy: 100, sizeName: 100, copies: 1, collate: 'sets', future: { x: 1 } });
      const { ctx, page, errors } = await openPage(browser, 'emoji_torah.html', { seed: { hebrewEmojiTorah_settings: seedText } });
      const r = await page.evaluate(() => {
        etCsFlush();
        const same = localStorage.getItem('hebrewEmojiTorah_settings');
        etCsOpen();
        const pic = document.querySelector('.et-cs-size input[data-size="sizePic"]').value;
        const sheets = document.querySelectorAll('#etCsPages .et-cs-sheet').length;
        const cb = document.getElementById('etCsColored');
        cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true }));
        const after = JSON.parse(localStorage.getItem('hebrewEmojiTorah_settings'));
        const lineArt = !document.querySelector('#etCsPages .et-cs-sheet svg [fill^="var("], #etCsPages .et-cs-sheet svg [stroke^="var("]');
        etCsClose();
        return { same, pic, sheets, colored: after.colored, future: JSON.stringify(after.future), size: after.sizePic, lineArt, open: etCsIsOpen() };
      });
      check(tag + ' E: the popup opens on the stored options (an unusable size shows 150) and the flush leaves the text byte-identical', r.same === seedText && r.pic === '150' && r.sheets > 0, JSON.stringify(r));
      check(tag + ' E: a change is written onto the stored object (the unknown field and the unusable value survive)', r.colored === true && r.future === '{"x":1}' && r.size === 999 && r.lineArt && !r.open, JSON.stringify(r));
      check(tag + ' E: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
];
// The hub carries one panel per tool: its seed is every tool's seed, its rows every tool's rows.
PAGES.push({
  file: 'index.html', host: '#cloudSavesSection', panels: 1,
  seed: Object.assign({}, ...PAGES.map(p => p.seed)),
  // …plus the suite-wide preferences row: the hub's .ivrit engine writes hebrewBlender_inputMode at init, so the row has a local item
  tools: PAGES.map(p => ({ tool: p.tool, rows: p.rows })).concat([{ tool: 'Suite', rows: ['prefs:default'] }]),
  prepare: `openIEModal();`,
  expand: `openIEModal(); document.getElementById('cloudSavesSection').scrollIntoView();`
});

const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !detail ? '' : ' — ' + detail)); }

async function startServer() {
  const srv = spawn('python3', ['-m', 'http.server', '8080', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE + '/index.html', { method: 'HEAD' }); if (r.ok) return srv; } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('http.server did not start');
}

// Opens a page with foreign origins aborted. blockAccount = the control run (no account scripts at all).
async function openPage(browser, file, { seed = {}, serveSdk = false, blockAccount = false, viewport = { width: 1280, height: 900 }, query = '', prepare = null, init = null } = {}) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport });
  await ctx.addInitScript((seed) => { for (const k of Object.keys(seed)) localStorage.setItem(k, seed[k]); }, seed);
  if (init) await ctx.addInitScript(init);   // a page-specific stub that must be in place before the page's scripts run
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(BASE)) {
      if (blockAccount && ACCOUNT_SCRIPTS.some(s => u.startsWith(BASE + s))) return route.abort();
      return route.continue();
    }
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (serveSdk && SDK_BYTES && u === CFG.sdk) {
      return route.fulfill({ status: 200, body: SDK_BYTES, headers: { 'content-type': 'application/javascript; charset=utf-8', 'access-control-allow-origin': '*' } });
    }
    return route.abort();
  });
  await page.goto(BASE + '/' + file + query, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.readyState !== 'loading', null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
  if (prepare) { await page.evaluate(prepare).catch(e => errors.push('prepare: ' + e.message)); await page.waitForTimeout(300); }
  return { ctx, page, errors };
}
const dump = (page) => page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));

const browser = await chromium.launch();
const srv = await startServer();
try {
  for (const P of PAGES) {
    if (ONLY && P.file !== ONLY) continue;
    const tag = P.file.replace('.html', '');
    // ---- control run: the page as it is without the account layer ----------------------------------
    let control;
    {
      const { ctx, page, errors } = await openPage(browser, P.file, { seed: P.seed, blockAccount: true, prepare: P.prepare });
      control = await dump(page);
      check(tag + ' control: 0 pageerrors without the account scripts', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // ---- A. anonymous, CDN blocked -----------------------------------------------------------------
    {
      const { ctx, page, errors } = await openPage(browser, P.file, { seed: P.seed, prepare: P.prepare });
      const chip = await page.evaluate(() => {
        const sw = document.querySelector('[data-i18n-switcher]'), chip = document.querySelector('.ivacct');
        return { mounted: !!chip, sameParent: !!chip && !!sw && chip.parentElement === sw.parentElement };
      });
      check(tag + ' A: chip mounted beside the language switcher', chip.mounted && chip.sameParent, JSON.stringify(chip));
      const panel = await page.evaluate((host) => {
        const h = document.querySelector(host), p = h && h.querySelector('.ivsav'), note = p && p.querySelector('.ivsav-note');
        return { host: !!h, panel: !!p, note: note ? note.textContent : '' };
      }, P.host);
      check(tag + ' A: panel shows the sign-in line', panel.panel && /Sign in/.test(panel.note), JSON.stringify(panel));
      if (P.panels) {
        const n = await page.evaluate((host) => document.querySelectorAll(host + ' .ivsav').length, P.host);
        check(tag + ' A: ' + P.panels + ' panels mounted', n === P.panels, String(n));
      }
      for (const T of (P.tools || [{ tool: P.tool, rows: P.rows }])) {
        const rows = await page.evaluate((tool) => window.IvritSaves.local.list(tool).then(items => items.map(i => i.id).sort()), T.tool).catch(e => ['error: ' + e]);
        check(tag + ' A: local.list(' + T.tool + ') lists exactly the seeded items', JSON.stringify(rows) === JSON.stringify([...T.rows].sort()), JSON.stringify(rows));
      }
      const after = await dump(page);
      check(tag + ' A: localStorage byte-identical to the control run', after === control, diffKeys(control, after));
      const bad = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('sb-') || k === 'ivritSuite_syncMeta' || k === 'ivritSuite_syncMeta2' || k === 'ivritSuite_syncBase' || k === 'ivritSuite_replaced' || k === 'ivritSuite_removedByAccount'));
      check(tag + ' A: no sb-* key and no sync memory', bad.length === 0, bad.join(','));
      const overlays = await page.evaluate(() => document.querySelectorAll('.ivsav-overlay, .ivacct-modal').length);
      check(tag + ' A: no card and no name step open by themselves', overlays === 0, String(overlays));
      check(tag + ' A: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // ---- B. remembered session, SDK served, API unreachable ----------------------------------------
    if (SDK_BYTES) {
      const seed = Object.assign({}, P.seed);
      seed[AUTH_KEY] = JSON.stringify({ access_token: 'x', refresh_token: 'y', expires_at: 4102444800, token_type: 'bearer', user: { id: '11111111-1111-4111-8111-111111111111', email: 'teacher@example.org' } });
      seed.ivritSuite_accountCache = JSON.stringify({ email: 'teacher@example.org', name: 'Test Teacher' });
      const { ctx, page, errors } = await openPage(browser, P.file, { seed, serveSdk: true, prepare: P.prepare });
      await page.waitForFunction(() => window.IvritAccount && IvritAccount.status() !== 'loading', null, { timeout: 25000 }).catch(() => {});
      await page.waitForFunction((host) => {
        const h = document.querySelector(host), st = h && h.querySelector('.ivsav-status'), note = h && h.querySelector('.ivsav-note');
        return (st && st.classList.contains('is-error') && st.textContent.trim()) || (note && note.textContent.trim());
      }, P.host, { timeout: 25000 }).catch(() => {});
      const st = await page.evaluate((host) => { const h = document.querySelector(host); return { account: IvritAccount.status(), status: (h.querySelector('.ivsav-status') || {}).textContent, note: (h.querySelector('.ivsav-note') || {}).textContent }; }, P.host);
      check(tag + ' B: status line failed soft with the API unreachable', /\S/.test(st.status || '') || /\S/.test(st.note || ''), JSON.stringify(st));
      await page.waitForFunction(() => window.IvritSaves && IvritSaves._test.settled(), null, { timeout: 25000 }).catch(() => {});
      await page.screenshot({ path: path.join(SHOTS, tag + '-offline-1280.png') });
      // The fixture has no name and the API is unreachable: the name step must not open (rule 3 — offline never changes the page), nor the card.
      const gates = await page.evaluate(() => ({ overlays: document.querySelectorAll('.ivsav-overlay, .ivacct-modal').length, source: IvritAccount.sessionSource(), name: IvritAccount._test.nameStepOutcome(), hydrated: !!localStorage.getItem('ivritSuite_syncMeta2') && /hydrated/.test(localStorage.getItem('ivritSuite_syncMeta2')) }));
      check(tag + ' B: no name step and no card with the API unreachable (restored session, name step outcome none)', gates.overlays === 0 && gates.source === 'restored' && gates.name === 'none', JSON.stringify(gates));
      check(tag + ' B: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    } else { console.log('SKIP ' + tag + ' B: no --sdk file given'); }
    // ---- C. Hebrew + dark at 800px ------------------------------------------------------------------
    {
      const seed = Object.assign({ hebrewBlender_lang: 'he', hebrewBlender_darkMode: '1' }, P.seed);
      const { ctx, page, errors } = await openPage(browser, P.file, { seed, viewport: { width: 800, height: 900 } });
      await page.evaluate(P.expand).catch(e => errors.push('expand: ' + e.message));
      await page.waitForTimeout(300);
      const note = await page.evaluate((host) => { const n = document.querySelector(host + ' .ivsav-note'); return n ? n.textContent : ''; }, P.host);
      check(tag + ' C: Hebrew sign-in line', /[א-ת]/.test(note), note);
      check(tag + ' C: RTL + dark', await page.evaluate(() => document.documentElement.dir === 'rtl' && document.body.classList.contains('dark')));
      await page.screenshot({ path: path.join(SHOTS, tag + '-he-dark-800.png') });
      check(tag + ' C: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // ---- D. URL contract --------------------------------------------------------------------------
    if (P.urlKeep) {
      const { ctx, page, errors } = await openPage(browser, P.file, { seed: P.seed, query: '?' + P.urlKeep + '&error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid' });
      // compared as decoded pairs: the module rebuilds the query with URLSearchParams, which may re-encode a ':'
      const params = await page.evaluate(() => JSON.stringify([...new URLSearchParams(location.search).entries()]));
      check(tag + ' D: keeps its own params and loses the auth-error ones', params === JSON.stringify([...new URLSearchParams(P.urlKeep).entries()]), params);
      check(tag + ' D: 0 pageerrors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // ---- E. page-specific: what a sync must never change on this page -------------------------------
    if (P.extra) await P.extra({ browser, tag });
  }
} finally {
  await browser.close();
  srv.kill();
}
function diffKeys(a, b) {
  try {
    const A = Object.fromEntries(JSON.parse(a)), B = Object.fromEntries(JSON.parse(b));
    return [...new Set([...Object.keys(A), ...Object.keys(B)])].filter(k => A[k] !== B[k]).map(k => k + ': ' + String(A[k]).slice(0, 60) + ' → ' + String(B[k]).slice(0, 60)).join(' | ');
  } catch (e) { return ''; }
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} checks passed; screenshots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
