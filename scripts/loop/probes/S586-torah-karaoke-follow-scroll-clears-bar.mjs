#!/usr/bin/env node
// S586 — Torah Trainer: the karaoke follow-scroll brings the chanted word clear of the open audio bar at every width.
// It recentred only past a fixed 120px band from the bottom while the bar is 131px at 800 and 210–252px on a phone,
// so a sung word could stay under the bar. Karaoke is driven through onAudioTimeUpdate with synthetic timings (Sefaria
// stubbed from data/trope/trope_phrase_examples.json); each word is placed 6px under the bar's top edge, then the next
// timeupdate must bring it clear; a mid-screen word must never move the page.
//
//   node scripts/loop/probes/S586-torah-karaoke-follow-scroll-clears-bar.mjs     exit 1 when a word stays under the bar
//   ROOT=<a git archive of the tree> runs it on another copy (the page before 5c374fb7 fails every cell over 120px).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.woff2':'font/woff2','.css':'text/css','.webmanifest':'application/manifest+json' };
const s = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url,'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, {'content-type': TYPES[path.extname(p)] || 'application/octet-stream'}); fs.createReadStream(p).pipe(res); });
await new Promise(r => s.listen(0,'127.0.0.1',r)); const base = `http://127.0.0.1:${s.address().port}`;
const phraseRows = JSON.parse(fs.readFileSync(path.join(ROOT,'data/trope/trope_phrase_examples.json'),'utf8')).melodies.torah;
const verses = phraseRows.slice(0,6).flatMap(r=>r.ex.map(e=>e.he)).slice(0,12);
const sef = u => u.includes('/v3/texts/') ? { versions:[{language:'he',text:verses},{language:'en',text:verses.map((_,i)=>`Verse ${i+1}.`)}], sections:['1','1'] } : u.includes('/calendars') ? { calendar_items:[] } : [];
let hits = 0;
async function openTorah(browser, { lang, dark, w, h }) {
  const ctx = await browser.newContext({ viewport:{width:w,height:h}, serviceWorkers:'block', reducedMotion:'reduce' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded','1'); localStorage.setItem('hebrewBlender_lang',c.lang); localStorage.setItem('hebrewBlender_darkMode',String(c.dark)); localStorage.setItem('hebrewTorahTrainer_tourSeen','1'); localStorage.setItem('hebrewTorahTrainer_hintSeen','1'); localStorage.setItem('hebrewTorahTrainer_settings', JSON.stringify({ parshahKey:'Bereshit', scope:'parsha-full' })); } }, { lang, dark });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url();
    if (u.startsWith('https://www.sefaria.org/api/')) { hits++; return r.fulfill({ status:200, contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body: JSON.stringify(sef(u)) }); }
    return (u.startsWith(base) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await page.goto(base + '/torah_trainer.html', { waitUntil:'load' });
  await page.waitForFunction(() => document.querySelectorAll('#ttReading .tt-word').length >= 6, null, { timeout:30000 });
  await page.waitForTimeout(600);
  return { ctx, page, errors };
}
const browser = await chromium.launch();
const rows = [];
for (const [lang,dark,w,h] of [['en',0,1280,800],['en',1,1280,800],['he',0,800,700],['he',1,800,700],['en',0,800,600],['en',0,390,700],['he',1,390,700]]) {
  const { ctx, page, errors } = await openTorah(browser, { lang, dark, w, h });
  await page.evaluate(() => { document.getElementById('ttAudioBar').classList.add('open');
    const spans = [...document.querySelectorAll('#ttReading .tt-word')]; karaokeWordSpans = spans.map(e => [e]); currentTimings = spans.map((_, i) => i);
    currentAudio = { currentTime: 0, paused: true, duration: 1e4, pause(){} }; });
  await page.waitForTimeout(300);
  const res = await page.evaluate(async () => {
    const bar = document.getElementById('ttAudioBar'); const out = { under: 0, recentred: 0, stillUnder: 0, mid: 0, midMoved: 0, barH: bar.offsetHeight };
    const n = karaokeWordSpans.length;
    for (let i = 3; i < n; i += 4) {
      const el = karaokeWordSpans[i][0];
      // place the word with its bottom 6px under the bar's top edge
      const r0 = el.getBoundingClientRect(); const barTop = bar.getBoundingClientRect().top;
      window.scrollBy(0, r0.bottom - (barTop + 6)); await new Promise(r => requestAnimationFrame(r));
      const r1 = el.getBoundingClientRect(); const bt = bar.getBoundingClientRect().top;
      if (!(r1.bottom > bt && r1.top < innerHeight)) continue; out.under++;
      lastHighlightedIdx = -1; currentAudio.currentTime = i + 0.5; onAudioTimeUpdate(); await new Promise(r => setTimeout(r, 60));
      const r2 = el.getBoundingClientRect(); const bt2 = bar.getBoundingClientRect().top;
      if (r2.bottom <= bt2 && r2.top >= 44) out.recentred++; else out.stillUnder++;
      // control: a word mid-screen does not move the page
      const y = scrollY; const r3 = el.getBoundingClientRect(); window.scrollBy(0, r3.top - innerHeight * 0.35 + 0); await new Promise(r => requestAnimationFrame(r));
      const r4 = el.getBoundingClientRect(); if (r4.bottom < bar.getBoundingClientRect().top - 20 && r4.top > 90) { out.mid++; const y0 = scrollY; lastHighlightedIdx = -1; onAudioTimeUpdate(); await new Promise(r => setTimeout(r, 60)); if (scrollY !== y0) out.midMoved++; }
    }
    return out; });
  rows.push({ ok: res.under > 0 && res.stillUnder === 0 && res.midMoved === 0 && errors.length === 0, line: `${lang}-${dark}-${w}x${h} bar ${res.barH}: under ${res.under}, recentred ${res.recentred}, stillUnder ${res.stillUnder}; mid ${res.mid} moved ${res.midMoved}; errors ${errors.length}` });
  await ctx.close();
}

await browser.close(); s.close();
for (const r of rows) console.log((r.ok ? 'ok   ' : 'FAIL ') + r.line);
console.log('sefaria stub hits', hits);
process.exit(rows.every(r => r.ok) && hits > 0 ? 0 : 1);
