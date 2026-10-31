#!/usr/bin/env node
// S587 — Torah Trainer: the teacher's "Assign this reading" dialog keeps every field inside its box on a phone.
// Its labels were flex:0 0 auto, so "Keep recordings (days after closing)" and "Due date (optional)" pushed their
// number/date fields 21px (EN) / 38px (HE) past the dialog on a 320px iPhone SE and the form scrolled sideways.
// Real device descriptors (pointer:coarse, 16px fields), Sefaria stubbed, IvritAssignments stubbed (the dialog's
// only module calls); the Favorites dialog rides along as the same-CSS control.
//
//   node scripts/loop/probes/S587-torah-assignment-dialog-fits-a-phone.mjs     exit 1 when a field leaves its dialog
//   ROOT=<a git archive of the tree> runs it on another copy (the page before 6ed3b0a6 fails the 4 iPhone SE cells).
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
const { devices } = pkg;
const browser = await chromium.launch(); let bad = 0, n = 0;
for (const [dev,w,h] of [['iPhone SE',320,568],['iPhone 13',390,664],['Pixel 7',412,839],['iPhone 13 landscape',750,342]]) for (const lang of ['en','he']) for (const dark of [0,1]) for (const dlg of ['asg','fav']) {
  const ctx = await browser.newContext({ ...devices[dev], viewport:{ width:w, height:h }, serviceWorkers:'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded','1'); localStorage.setItem('hebrewBlender_lang',c.lang); localStorage.setItem('hebrewBlender_darkMode',String(c.dark)); localStorage.setItem('hebrewTorahTrainer_tourSeen','1'); localStorage.setItem('hebrewTorahTrainer_hintSeen','1'); localStorage.setItem('hebrewTorahTrainer_settings', JSON.stringify({ parshahKey:'Bereshit', scope:'parsha-full' })); } }, { lang, dark });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url();
    if (u.startsWith('https://www.sefaria.org/api/')) { hits++; return r.fulfill({ status:200, contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body: JSON.stringify(sef(u)) }); }
    return (u.startsWith(base) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await page.goto(base + '/torah_trainer.html', { waitUntil:'load' });
  await page.waitForFunction(() => document.querySelectorAll('#ttReading .tt-word').length >= 6, null, { timeout:30000 });
  const r = await page.evaluate((dlg) => {
    if (!matchMedia('(pointer:coarse)').matches) return 'NOT COARSE';
    window.IvritAssignments = { codeWord:{ generate:() => 'river-apple-7' }, classes:{ list: async () => [] }, students:{ list: async () => [] } };
    if (typeof openAsgDialog !== 'function' || typeof openFavoriteDialog !== 'function') return 'NO OPENER';
    if (dlg === 'asg') openAsgDialog(document.body); else openFavoriteDialog();
    const d = document.getElementById(dlg === 'asg' ? 'ttAsgDialog' : 'ttFavDialog'); if (!d || d.hidden) return 'NOT OPEN';
    const cs = getComputedStyle(d), dr = d.getBoundingClientRect(), L = dr.left + parseFloat(cs.paddingLeft) - 1, R = dr.right - parseFloat(cs.paddingRight) + 1;
    const fields = [...d.querySelectorAll('input,select,button,label')].filter(e => e.offsetParent);
    const out = fields.filter(e => { const b = e.getBoundingClientRect(); return b.left < L || b.right > R; }).map(e => e.id || e.tagName);
    return { fields: fields.length, out, hscroll: d.scrollWidth - d.clientWidth, inView: dr.left >= 0 && dr.right <= innerWidth };
  }, dlg);
  n++; const ok = typeof r === 'object' && r.fields > 3 && !r.out.length && r.hscroll <= 0 && r.inView && !errors.length;
  if (!ok) { bad++; console.log('FAIL', dev, lang, dark ? 'dark' : 'light', dlg, JSON.stringify(r), errors.join(' | ')); }
  await ctx.close();
}
await browser.close(); s.close();
console.log(`${n} cells, ${bad} failing, Sefaria stub hits ${hits}`);
process.exit(bad || !hits ? 1 : 0);
