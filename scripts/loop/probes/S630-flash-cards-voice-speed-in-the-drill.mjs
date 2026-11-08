#!/usr/bin/env node
// S630 — Flash Cards' drill has a Voice speed −/+ under its navigation (the micro-feature from the S367 seed "Speech speed
// reachable mid-drill", gate 1). `speakWord()` reads the Advanced tab's Hebrew TTS Reading Speed slider, which sits on the
// setup screen, so a slower 🔊 Hear cost End Practice Early → Advanced → drag → restart. The pair steps that same slider
// by 0.1 within its 0.5–1.5 (through the slider's own input handler: its readout and saveSettings), so nothing new is stored.
//
//   node scripts/loop/probes/S630-flash-cards-voice-speed-in-the-drill.mjs
//   EN light 1280 / HE dark 800 / EN dark 800 / HE light 1280, a fresh profile, the Hebrew voice a stand-in that records
//   each utterance's rate. (0) Control: a drill with Audio off and no listening round has no speed row. (1) Audio on
//   (seeded), Start by a real click: the row shows "0.75×"; − pressed four times by real clicks reads 0.65, 0.55, 0.50,
//   0.50 with − then aria-disabled; the card's 🔊 Hear speaks at 0.5. (2) + focused and pressed by Enter twice: 0.70, the
//   focus still on +; Hear speaks at 0.7; the Advanced slider reads 0.7 with its "0.70×", and the stored settings carry
//   ttsRate 0.7. (3) A reload and a new drill show 0.70×. (4) A listening round with Audio off shows the row. 0 page
//   errors. exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the
//   tree before S630 has no row: every cell fails, the control passing).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const browser = await chromium.launch();
async function open(cell, seed) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark, seed]) => {
    if (!sessionStorage.getItem('__s')) {
      sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0');
      if (seed) localStorage.setItem('hebrewFlashCards_settings', JSON.stringify(seed));
    }
    // A Hebrew voice that records what it is asked to say, and at what rate.
    window.__spoken = [];
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    const v = { lang: 'he-IL', name: 'Probe Hebrew', voiceURI: 'probe-he', localService: true, default: false };
    try { speechSynthesis.getVoices = () => [v]; speechSynthesis.speak = u => window.__spoken.push(u.rate); speechSynthesis.cancel = () => {}; } catch (e) {}
  }, [cell.lang, cell.dark, seed]);
  const page = await ctx.newPage(); page.setDefaultTimeout(20000);
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  page.on('dialog', d => d.accept());
  await page.goto(base + '/flash_cards.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.getElementById('startBtn')); await page.evaluate(() => window.I18n.ready);
  return { ctx, page, errors };
}
async function start(page) {
  await page.locator('#startBtn').scrollIntoViewIfNeeded(); await page.click('#startBtn');
  await page.waitForFunction(() => document.getElementById('screenCard').classList.contains('active'));
  await page.waitForTimeout(300);
}
const row = page => page.evaluate(() => { const r = document.getElementById('fcSpeed'); if (!r) return null; return { shown: !r.hidden && r.getClientRects().length > 0, val: document.getElementById('fcSpeedVal').textContent, down: document.getElementById('fcSpeedDown').getAttribute('aria-disabled'), up: document.getElementById('fcSpeedUp').getAttribute('aria-disabled') }; });
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  try {
    // (0) control: no audio, no listening round
    let { ctx, page, errors } = await open(cell, null);
    await start(page);
    const c = await row(page);
    ok(!c || !c.shown, `${L} control: Audio off, no listening round → the speed row ${c ? (c.shown ? 'shown' : 'hidden') : 'absent'}`);
    await ctx.close();
    // (1) audio on
    ({ ctx, page, errors } = await open(cell, { audioEnabled: true }));
    await start(page);
    const r0 = await row(page);
    if (!r0) throw new Error('no #fcSpeed');
    const reads = [];
    // raw clicks at the button's centre (a locator click waits forever on an aria-disabled button, the 4th press's case)
    await page.locator('#fcSpeedDown').scrollIntoViewIfNeeded();
    const pt = await page.evaluate(() => { const b = document.getElementById('fcSpeedDown'), r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, e = document.elementFromPoint(x, y); return { x, y, hit: !!e && b.contains(e) }; });
    if (!pt.hit) throw new Error('− is covered');
    for (let i = 0; i < 4; i++) { await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(80); reads.push((await row(page)).val); }
    const r1 = await row(page);
    const hear = await page.evaluate(() => ['fcSpeakBtnFront', 'fcSpeakBtn'].find(id => { const b = document.getElementById(id); return b.getClientRects().length && !b.inert; }));
    await page.click('#' + hear); await page.waitForTimeout(500);
    const s1 = await page.evaluate(() => window.__spoken.slice());
    ok(r0.shown && r0.val === '0.75×' && reads.join(' ') === '0.65× 0.55× 0.50× 0.50×' && r1.down === 'true' && r1.up === 'false' && s1[s1.length - 1] === 0.5,
      `${L} mouse: row ${r0.shown ? 'shown' : 'hidden'} «${r0.val}»; − ×4 → ${reads.join(' ')}, − aria-disabled ${r1.down}; Hear (#${hear}) spoke at ${s1.join(',')}`);
    // (2) keyboard on +
    await page.focus('#fcSpeedUp'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
    const r2 = await row(page);
    const focusUp = await page.evaluate(() => document.activeElement && document.activeElement.id);
    await page.click('#' + hear); await page.waitForTimeout(500);
    await page.waitForTimeout(800);
    const st = await page.evaluate(() => ({ spoken: window.__spoken.slice(), slider: document.getElementById('ttsRateSlider').value, sval: document.getElementById('ttsRateVal').textContent, stored: (JSON.parse(localStorage.getItem('hebrewFlashCards_settings') || '{}') || {}).ttsRate }));
    ok(r2.val === '0.70×' && focusUp === 'fcSpeedUp' && st.spoken[st.spoken.length - 1] === 0.7 && parseFloat(st.slider) === 0.7 && st.sval === '0.70×' && +st.stored === 0.7 && r2.down === 'false',
      `${L} keyboard: Enter ×2 on + → «${r2.val}», focus on #${focusUp}; Hear spoke at ${st.spoken[st.spoken.length - 1]}; the Advanced slider ${st.slider} «${st.sval}», stored ttsRate ${st.stored}`);
    // (3) a reload keeps it
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.I18n && document.getElementById('startBtn')); await page.evaluate(() => window.I18n.ready);
    await start(page);
    const r3 = await row(page);
    ok(r3.shown && r3.val === '0.70×' && errors.length === 0, `${L} reload: a new drill's row «${r3.val}»; ${errors.length} errors${errors.length ? ' ' + errors[0].slice(0, 120) : ''}`);
    await ctx.close();
    // (4) a listening round with audio off
    ({ ctx, page, errors } = await open(cell, { listening: true }));
    await start(page);
    const r4 = await row(page);
    const listening = await page.evaluate(() => isListeningActive());
    ok(listening && r4.shown && errors.length === 0, `${L} listening round (Audio off): active ${listening}, the speed row ${r4.shown ? 'shown' : 'hidden'}; ${errors.length} errors`);
    await ctx.close();
  } catch (e) { fail++; console.log(`✘ ${L}: ${String(e).split('\n')[0]}`); }
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: the drill sets its voice speed with − / + under the navigation');
process.exit(fail ? 1 : 0);
