#!/usr/bin/env node
/*
 * build-totaltorah-direct.mjs — cut a recording Cantor Arianne Brown sent directly (scripts/totaltorah-direct.mjs)
 * into Total Torah verse files, the same way build-totaltorah-audio.mjs split cuts a video.
 *
 *   node scripts/build-totaltorah-direct.mjs --id <id> [--intro <s>]
 *
 * Source: source-data/totaltorah-cache/<id>.m4a (or any SOURCE_EXTS). Steps, all from totaltorah-lib.mjs:
 *   1. the boundaries pass (computeBoundaries) with the row's `intro` (a direct recording has no announcement; the
 *      English model's transcript is printed so that can be confirmed), the whole-file alignment and the
 *      end-at-the-pause rule; writes <id>.boundaries.json in the cache;
 *   2. the cut: data/totaltorah/audio/<file>.mp3 (libmp3lame -q:a 5, as split) — moved to the audio repository and
 *      the R2 bucket before a commit, never committed here — and the FLAC hand-back copy in the cache;
 *   3. the timings, derived from the same alignment, into data/totaltorah/timings/;
 *   4. the manifest entries: `video: null, direct: "<id>"`, verified:false / timingsVerified:false (only
 *      build-totaltorah-audio.mjs verify --verses flips them, after listening), and credit.direct[<id>];
 *   5. a self-contained listening page, source-data/totaltorah-cache/<id>.test.html (the MP3s inlined, the words
 *      lit at their timings, a click on a word plays from it), for the listening pass.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { DIRECT } from './totaltorah-direct.mjs';
import { BOOK_CODE } from './totaltorah-videos.mjs';
import { CACHE_DIR, FLAC_DIR, AUDIO_DIR, MANIFEST, DEFAULT_PAD, AlignerClient, checkEnv, sourceAudio, to16k, computeBoundaries, deriveVerseTimings, writeTimingsFile, wordTable, ffprobeDuration } from './totaltorah-lib.mjs';

const argv = process.argv.slice(2);
const flags = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) continue;
  const next = argv[i + 1];
  if (next !== undefined && !next.startsWith('--')) { flags[a.slice(2)] = next; i++; } else flags[a.slice(2)] = true;
}
const fail = (msg, code = 1) => { console.error(`\n✗ ${msg}`); process.exit(code); };
const MINSCORE = 0.5;

const id = String(flags.id || '');
const row = DIRECT[id];
if (!row) fail(`--id must name a row of scripts/totaltorah-direct.mjs (${Object.keys(DIRECT).join(', ')})`, 2);
const src = sourceAudio(id);
if (!src) fail(`no source recording: put it in ${CACHE_DIR}/${id}.m4a`, 2);
try { checkEnv(); } catch (e) { fail(e.message, 2); }
const intro = flags.intro !== undefined ? parseFloat(flags.intro) : row.intro;

const client = new AlignerClient();
let bj;
try {
  const en = await client.align({ english: true, audio: to16k(src, join(CACHE_DIR, `${id}.16k.flac`)), offset: 0, end: 30 }).catch(() => null);
  bj = await computeBoundaries({ id, row, src, client, intro });
  if (en && en.text) console.log(`  (the English model hears at the start: "${en.text.slice(0, 120)}")`);
} finally { await client.close(); }

/* ---------- cut ---------- */
const pad = bj.pad ?? DEFAULT_PAD;
const dur = ffprobeDuration(src);
mkdirSync(AUDIO_DIR, { recursive: true });
mkdirSync(FLAC_DIR, { recursive: true });
const pcm = join(CACHE_DIR, `${id}.pcm.wav`);
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-c:a', 'pcm_s16le', pcm]);
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
manifest.credit.direct = manifest.credit.direct || {};
manifest.credit.direct[id] = { ref: row.ref, recorded: row.recorded, note: row.note };
const test = [];
console.log('\n  verse          cut (s)            mp3 dur   bytes');
bj.verses.forEach((v, i) => {
  const start = Math.max(0, bj.boundaries[i] - pad), end = Math.min(dur, bj.boundaries[i + 1] + pad);
  const flac = join(FLAC_DIR, `${v.file}.flac`), mp3 = join(AUDIO_DIR, `${v.file}.mp3`);
  const prev = manifest[v.key];
  if (prev && prev.video) fail(`${v.key} is already cut from the video ${prev.video} — a direct recording only fills a verse the series lacks`);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(start), '-t', String(end - start), '-i', pcm, '-c:a', 'flac', flac]);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(start), '-t', String(end - start), '-i', pcm, '-codec:a', 'libmp3lame', '-q:a', '5', mp3]);
  const mdur = Math.round(ffprobeDuration(mp3) * 100) / 100;
  console.log(`  ${v.key.padEnd(14)} ${start.toFixed(2).padStart(7)} – ${end.toFixed(2).padStart(7)}   ${String(mdur).padStart(6)}   ${statSync(mp3).size}`);
  const res = deriveVerseTimings(bj, i);
  if (res.end > mdur + 0.5) fail(`${v.key}: derived end ${res.end} s is past the file's ${mdur} s`);
  writeTimingsFile(res.file, res.onsets, res.end);
  console.log(`\ntimings ${v.key}: ${res.words.length} words`);
  wordTable(res, MINSCORE);
  manifest[v.key] = {
    file: `${v.file}.mp3`, dur: mdur, video: null, direct: id, parsha: row.parsha, year: row.year, aliyah: row.aliyah,
    verified: false, timings: `${v.file}.txt`, timingsVerified: false,
  };
  test.push({ key: v.key, words: res.words, onsets: res.onsets, end: res.end, scores: res.scores, b64: readFileSync(mp3).toString('base64') });
});
try { unlinkSync(pcm); } catch { /* already gone */ }

// credit first, then the verses in canonical order — the same writer as build-totaltorah-audio.mjs
const order = Object.keys(BOOK_CODE);
const keys = Object.keys(manifest).filter((k) => k !== 'credit').sort((a, b) => {
  const pa = /^(\w+) (\d+):(\d+)$/.exec(a), pb = /^(\w+) (\d+):(\d+)$/.exec(b);
  return (order.indexOf(pa[1]) - order.indexOf(pb[1])) || (+pa[2] - +pb[2]) || (+pa[3] - +pb[3]);
});
const out = { credit: manifest.credit };
for (const k of keys) out[k] = manifest[k];
writeFileSync(MANIFEST, JSON.stringify(out, null, 1) + '\n');

/* ---------- the listening page ---------- */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Total Torah — ${esc(row.ref)} listening check</title>
<style>body{font-family:system-ui,sans-serif;margin:20px auto;max-width:860px;padding:0 14px;line-height:1.5;color:#1b2a4a}
h1{font-size:1.3rem}h2{font-size:1.1rem;margin:26px 0 6px}.v{border:1px solid #d6d9e0;border-radius:10px;padding:12px 14px;margin:10px 0}
.heb{font-family:'Frank Ruhl Libre','Noto Serif Hebrew','SBL Hebrew',serif;font-size:1.9rem;line-height:2.2}
.w{cursor:pointer;border-radius:6px;padding:0 3px;transition:background .1s}.w:hover{background:#eef}.w.on{background:#f5c542}.w.low{text-decoration:underline wavy #c33 1px}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}audio{width:100%;max-width:520px}small{color:#5b6475}
label{display:inline-flex;gap:6px;align-items:center}</style>
<h1>Total Torah — ${esc(row.ref)} (${esc(row.parsha)}), Cantor Arianne Brown</h1>
<p><small>Recorded ${esc(row.recorded)}. Each verse is the file the Trainer will play. The highlighted word follows the computed word timings; click any word to play from it. Words underlined in red aligned with low confidence — listen there.</small></p>
<p class="row"><label><input type="checkbox" id="chain" checked> Play the verses one after another</label></p>`;
test.forEach((t, vi) => {
  html += `<div class="v"><h2>${esc(t.key)} <small>(${t.words.length} words)</small></h2><div class="row"><audio id="a${vi}" controls preload="auto" src="data:audio/mpeg;base64,${t.b64}"></audio></div><div class="heb" dir="rtl" lang="he">`;
  t.words.forEach((w, i) => { html += `<span class="w${t.scores[i] < MINSCORE ? ' low' : ''}" data-v="${vi}" data-i="${i}" title="${t.onsets[i].toFixed(2)} s · score ${t.scores[i].toFixed(2)}">${esc(w)}</span> `; });
  html += '</div></div>';
});
html += `<script>
const T=${JSON.stringify(test.map((t) => ({ onsets: t.onsets, end: t.end })))};
T.forEach((t,vi)=>{const a=document.getElementById('a'+vi),ws=[...document.querySelectorAll('.w[data-v="'+vi+'"]')];let cur=-1;
 const tick=()=>{const x=a.currentTime;let k=-1;for(let i=0;i<t.onsets.length;i++){if(t.onsets[i]<=x)k=i;else break;}if(x>t.end+0.3)k=-1;
  if(k!==cur){if(cur>=0)ws[cur].classList.remove('on');if(k>=0)ws[k].classList.add('on');cur=k;}if(!a.paused)requestAnimationFrame(tick);};
 a.addEventListener('play',()=>{document.querySelectorAll('audio').forEach(o=>{if(o!==a)o.pause();});requestAnimationFrame(tick);});
 a.addEventListener('seeked',tick);
 a.addEventListener('ended',()=>{tick();const n=document.getElementById('a'+(vi+1));if(n&&document.getElementById('chain').checked){n.currentTime=0;n.play();}});
 ws.forEach((el,i)=>el.addEventListener('click',()=>{a.currentTime=Math.max(0,t.onsets[i]-0.05);a.play();}));});
<\/script>`;
const page = join(CACHE_DIR, `${id}.test.html`);
writeFileSync(page, html);
console.log(`\nwrote ${MANIFEST} (verified:false until you listen), the timings, the MP3s in ${AUDIO_DIR}/ and the listening page ${page}`);
console.log(`\nAfter listening:\n  node scripts/build-totaltorah-audio.mjs verify --verses "${bj.verses.map((v) => v.key).join(',')}"\n  node scripts/build-totaltorah-audio.mjs verify --timings --verses "${bj.verses.map((v) => v.key).join(',')}"`);
