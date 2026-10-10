#!/usr/bin/env node
/*
 * build-totaltorah-audio.mjs — cut one "Tricks of the Trope – Total Torah" aliyah video
 * (Cantor Arianne Brown, Adas Israel Congregation; used with written permission, Oct 2026)
 * into per-verse MP3s for torah_trainer.html's Total Torah recording source.
 *
 *   node scripts/build-totaltorah-audio.mjs fetch --video bv1hX3WrRM4
 *   node scripts/build-totaltorah-audio.mjs split --video bv1hX3WrRM4 --ref "Genesis 1:1-1:5" --parsha Bereshit --year 1 --aliyah 1
 *   node scripts/build-totaltorah-audio.mjs --video bv1hX3WrRM4            (fetch, then split, from the VIDEOS table)
 *   node scripts/build-totaltorah-audio.mjs verify --verses "Genesis 1:1,Genesis 1:2" [--timings]
 *
 * fetch  — yt-dlp the video's best audio (m4a) + its info JSON into source-data/totaltorah-cache/ (gitignored).
 *          Idempotent: skipped when both files exist and pass the sanity check (ffprobe duration within 2 s of
 *          the info JSON's, mean volume above -50 dB). On any yt-dlp failure it prints the error and exits 1 —
 *          never an alternate downloader, proxy or API workaround.
 * split  — ffmpeg silencedetect finds the verse boundaries; the count must equal the verse count of --ref
 *          (derived from Sefaria's text export, the same cache scripts/build-trope-index.mjs keeps), else the
 *          segment table is printed and the script exits 1. Never guesses, merges or splits a segment;
 *          --boundaries "t0,t1,…,tN" (N+1 seconds) overrides by hand. Each verse is padded --pad s (0.15) on
 *          both sides and written as a lossless FLAC (source-data/totaltorah-cache/verses/, the set handed back
 *          to Adas Israel and the alignment input) and a mono MP3 (data/totaltorah/audio/, -q:a 5).
 * verify — flips `verified` (or, with --timings, `timingsVerified`) to true for the named verses: the
 *          maintainer runs it after listening. The page uses nothing that is not verified.
 *
 * Both writers merge data/totaltorah/manifest.json (a top-level `credit` block beside one entry per verse,
 * keyed "Genesis 1:1") and keep every existing verified flag; split also writes data/totaltorah/LICENSE.txt.
 * The only ids the script will touch are in VIDEOS below — Phase 2 grows that table from the Adas page.
 *
 * Options: --thresh <dB> (-50dB)  --mindur <s> (0.6)  --pad <s> (0.15)  --boundaries "<s,s,…>"  --yt-dlp <path>
 *          --cache <dir> --out <dir>  (a self-test's folders; never point --out inside data/ for a test)
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const k = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) { flags[k] = next; i++; } else flags[k] = true;
  } else positional.push(a);
}
// --cache / --out move the folders for a self-test (the phrases builder's --out precedent); the defaults are the real ones
const CACHE_DIR = flags.cache ? String(flags.cache) : join(repoRoot, 'source-data', 'totaltorah-cache');
const TEXT_CACHE_DIR = join(repoRoot, 'source-data', 'trope-cache');   // the index builder's Sefaria export cache
const OUT_DIR = flags.out ? String(flags.out) : join(repoRoot, 'data', 'totaltorah');
const AUDIO_DIR = join(OUT_DIR, 'audio');
const FLAC_DIR = join(CACHE_DIR, 'verses');
const MANIFEST = join(OUT_DIR, 'manifest.json');

/* ---------- the whitelist: every video the script may touch ---------- */
const VIDEOS = {
  bv1hX3WrRM4: { parsha: 'Bereshit', year: 1, aliyah: 1, ref: 'Genesis 1:1-1:5' },
};
const CREDIT = {
  reader: 'Cantor Arianne Brown',
  congregation: 'Adas Israel Congregation',
  series: 'Tricks of the Trope – Total Torah',
  url: 'https://www.adasisrael.org/trope',
  permission: 'Written permission (email), October 2026: free access, full credit with links back, no modification beyond cutting the audio into verses, Adas Israel retains the rights to the verse-cut files, every verse links to the complete video on YouTube.',
  license: 'All rights reserved. Not CC-licensed; do not redistribute.',
};
const BOOK_CODE = { Genesis: 'gen', Exodus: 'exo', Leviticus: 'lev', Numbers: 'num', Deuteronomy: 'deu' };
const LICENSE_TEXT = `© Cantor Arianne Brown / Adas Israel Congregation. All rights reserved.

The MP3 files in audio/ and the timing files in timings/ are cut, verse by verse, from the
"Tricks of the Trope – Total Torah" recordings (https://www.adasisrael.org/trope), one YouTube
video per triennial aliyah, by scripts/build-totaltorah-audio.mjs. Used in IvritSuite with
written permission (Oct 2026). Not CC-licensed; do not redistribute. Adas Israel Congregation
retains the rights to the verse-cut files; every verse links back to the complete video.
manifest.json names each verse's source video and the credit.
`;

/* ---------- args (parsed above, before the folders) ---------- */
const cmd = positional[0] || null;
const fail = (msg, code = 1) => { console.error(`\n✗ ${msg}`); process.exit(code); };

/* ---------- tools ---------- */
function ytDlpPath() {
  if (flags['yt-dlp']) return flags['yt-dlp'];
  const local = join(CACHE_DIR, 'tools-env', 'bin', 'yt-dlp');
  if (existsSync(local)) return local;
  const w = spawnSync('which', ['yt-dlp'], { encoding: 'utf8' });
  if (w.status === 0 && w.stdout.trim()) return w.stdout.trim();
  return null;
}
function needTool(name) {
  const w = spawnSync('which', [name], { encoding: 'utf8' });
  if (w.status !== 0) fail(`${name} is not on PATH — install it and re-run.`, 2);
}
function ffprobeDuration(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' });
  const d = parseFloat(out.trim());
  if (!isFinite(d)) fail(`ffprobe could not read a duration from ${file}`);
  return d;
}
function meanVolume(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /mean_volume:\s*(-?[\d.]+)\s*dB/.exec(r.stderr || '');
  if (!m) fail(`volumedetect gave no mean_volume for ${file}`);
  return parseFloat(m[1]);
}

/* ---------- the video id and its row ---------- */
function videoRow(id) {
  if (!id) fail('--video <id> is required (one of: ' + Object.keys(VIDEOS).join(', ') + ')', 2);
  if (!/^[\w-]{11}$/.test(id)) fail(`"${id}" is not a YouTube video id`, 2);
  const row = VIDEOS[id];
  if (!row) fail(`"${id}" is not in this script's VIDEOS table — the only recordings it may touch are the ones Cantor Brown's permission covers for this phase; add the row deliberately, never from input.`, 2);
  return row;
}

/* ---------- fetch ---------- */
function sanity(m4a, info) {
  const probe = ffprobeDuration(m4a);
  const expected = typeof info.duration === 'number' ? info.duration : NaN;
  const problems = [];
  if (!isFinite(expected)) problems.push('info.json has no numeric duration');
  else if (Math.abs(probe - expected) > 2) problems.push(`ffprobe duration ${probe.toFixed(2)} s is not within 2 s of info.json's ${expected} s (truncated download?)`);
  const mv = meanVolume(m4a);
  if (mv <= -50) problems.push(`mean volume ${mv} dB is at or below -50 dB (silent file?)`);
  return { ok: problems.length === 0, problems, probe, mv };
}
function doFetch(id) {
  needTool('ffmpeg'); needTool('ffprobe');
  const m4a = join(CACHE_DIR, `${id}.m4a`);
  const infoPath = join(CACHE_DIR, `${id}.info.json`);
  mkdirSync(CACHE_DIR, { recursive: true });
  if (existsSync(m4a) && existsSync(infoPath)) {
    const info = JSON.parse(readFileSync(infoPath, 'utf8'));
    const s = sanity(m4a, info);
    if (s.ok) { console.log(`fetch: ${id}.m4a and info.json already present and sane (${s.probe.toFixed(1)} s, mean ${s.mv} dB) — skipped`); return { m4a, info }; }
    console.log(`fetch: cached ${id}.m4a fails the sanity check (${s.problems.join('; ')}) — refetching`);
  }
  const ytdlp = ytDlpPath();
  if (!ytdlp) fail('yt-dlp is not installed (pip install -U yt-dlp, or --yt-dlp <path>).', 2);
  const args = ['-f', 'bestaudio', '-x', '--audio-format', 'm4a', '--audio-quality', '0', '--write-info-json', '--no-playlist',
    '-o', join(CACHE_DIR, '%(id)s.%(ext)s'), `https://youtu.be/${id}`];
  if (process.env.HTTPS_PROXY) args.unshift('--proxy', process.env.HTTPS_PROXY);
  console.log(`fetch: ${ytdlp} ${args.join(' ')}`);
  const r = spawnSync(ytdlp, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  process.stdout.write(r.stdout || '');
  if (r.status !== 0) {
    process.stderr.write(r.stderr || '');
    fail(`yt-dlp exited ${r.status}. Not retrying through another downloader or proxy — extract the audio yourself and drop it at ${m4a} (with ${id}.info.json beside it).`);
  }
  if (!existsSync(m4a) || !existsSync(infoPath)) fail(`yt-dlp finished but ${m4a} or its info.json is missing`);
  const info = JSON.parse(readFileSync(infoPath, 'utf8'));
  const s = sanity(m4a, info);
  if (!s.ok) fail(`downloaded file fails the sanity check: ${s.problems.join('; ')}`);
  console.log(`fetch: ok — ${s.probe.toFixed(1)} s, mean ${s.mv} dB, "${info.title}"`);
  return { m4a, info };
}

/* ---------- refs and verse text (Sefaria export, the index builder's cache) ---------- */
function parseRef(ref) {
  const m = /^([A-Z][a-z]+) (\d+):(\d+)-(\d+):(\d+)$/.exec(ref || '');
  if (!m) fail(`--ref must look like "Genesis 1:1-1:5" (got "${ref}")`, 2);
  const book = m[1];
  if (!BOOK_CODE[book]) fail(`"${book}" is not a Torah book`, 2);
  return { book, sc: +m[2], sv: +m[3], ec: +m[4], ev: +m[5] };
}
function loadBookText(book) {
  mkdirSync(TEXT_CACHE_DIR, { recursive: true });
  const path = join(TEXT_CACHE_DIR, `merged-${book}.json`);
  if (!existsSync(path)) {
    const url = `https://storage.googleapis.com/sefaria-export/json/Tanakh/Torah/${book}/Hebrew/merged.json`;
    console.log(`  fetching ${url}`);
    const body = execFileSync('curl', ['-sS', '--fail', '--max-time', '120', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    writeFileSync(path, body);
  }
  return JSON.parse(readFileSync(path, 'utf8')).text;   // chapters[c-1][v-1]
}
export function versesOfRef(r, chapters) {
  const out = [];
  for (let c = r.sc; c <= r.ec; c++) {
    const ch = chapters[c - 1];
    if (!ch) fail(`${r.book} has no chapter ${c}`);
    const from = c === r.sc ? r.sv : 1;
    const to = c === r.ec ? r.ev : ch.length;
    if (to > ch.length) fail(`${r.book} ${c} has only ${ch.length} verses, not ${to}`);
    for (let v = from; v <= to; v++) out.push({ c, v, key: `${r.book} ${c}:${v}`, file: `${BOOK_CODE[r.book]}-${String(c).padStart(3, '0')}-${String(v).padStart(3, '0')}` });
  }
  if (!out.length) fail(`the ref ${r.book} ${r.sc}:${r.sv}-${r.ec}:${r.ev} holds no verses`);
  return out;
}

/* ---------- silence detection ---------- */
function detectSegments(m4a, thresh, mindur) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', m4a, '-af', `silencedetect=noise=${thresh}:d=${mindur}`, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const silences = [];
  let open = null;
  for (const line of (r.stderr || '').split('\n')) {
    let m = /silence_start:\s*(-?[\d.]+)/.exec(line);
    if (m) { open = parseFloat(m[1]); continue; }
    m = /silence_end:\s*([\d.]+)/.exec(line);
    if (m && open !== null) { silences.push({ s: Math.max(0, open), e: parseFloat(m[1]) }); open = null; }
  }
  const dur = ffprobeDuration(m4a);
  if (open !== null) silences.push({ s: Math.max(0, open), e: dur });   // silence running to the end
  const segs = [];
  let prev = 0;
  for (const sil of silences) {
    if (sil.s - prev > 0.05) segs.push({ start: prev, end: sil.s });
    prev = sil.e;
  }
  if (dur - prev > 0.05) segs.push({ start: prev, end: dur });
  return { segs, dur, silences };
}
function segTable(segs) {
  const rows = ['  #   start      end     length    gap-before'];
  segs.forEach((s, i) => {
    const gap = i ? (s.start - segs[i - 1].end) : s.start;
    rows.push(`  ${String(i + 1).padStart(2)}  ${s.start.toFixed(2).padStart(7)}  ${s.end.toFixed(2).padStart(7)}  ${(s.end - s.start).toFixed(2).padStart(7)}  ${gap.toFixed(2).padStart(7)}`);
  });
  return rows.join('\n');
}

/* ---------- manifest ---------- */
function readManifest() {
  if (!existsSync(MANIFEST)) return { credit: { ...CREDIT, videos: {} } };
  const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  m.credit = { ...CREDIT, ...(m.credit || {}), videos: (m.credit && m.credit.videos) || {} };
  return m;
}
function writeManifest(m) {
  // credit first, then the verses in canonical order (book, chapter, verse)
  const order = Object.keys(BOOK_CODE);
  const verses = Object.keys(m).filter((k) => k !== 'credit').sort((a, b) => {
    const pa = /^(\w+) (\d+):(\d+)$/.exec(a), pb = /^(\w+) (\d+):(\d+)$/.exec(b);
    return (order.indexOf(pa[1]) - order.indexOf(pb[1])) || (+pa[2] - +pb[2]) || (+pa[3] - +pb[3]);
  });
  const out = { credit: m.credit };
  for (const k of verses) out[k] = m[k];
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(out, null, 1) + '\n');
}

/* ---------- triennial cross-check (reported, never fixed) ---------- */
function triennialCheck(row, r) {
  try {
    const parshiyot = JSON.parse(readFileSync(join(repoRoot, 'data', 'parshiyot.json'), 'utf8'));
    const p = parshiyot.find((x) => x.en === row.parsha);
    const tri = JSON.parse(readFileSync(join(repoRoot, 'data', 'leyning', 'triennial.json'), 'utf8'));
    const entry = p && tri.parshiyot && tri.parshiyot[String(p.n)];
    const div = entry && entry.variations && entry.variations[`Y.${row.year}`] && entry.variations[`Y.${row.year}`][String(row.aliyah)];
    const ours = [`${r.sc}:${r.sv}`, `${r.ec}:${r.ev}`];
    if (!div) { console.log(`triennial cross-check: no hebcal division for ${row.parsha} Y.${row.year} aliyah ${row.aliyah} (parasha #${p && p.n})`); return; }
    const same = div[0] === ours[0] && div[1] === ours[1];
    console.log(`triennial cross-check: Adas "${row.parsha} Year ${row.year} Aliyah ${row.aliyah}" = ${ours.join('–')}; hebcal triennial.json Y.${row.year}[${row.aliyah}] = ${div.join('–')} → ${same ? 'MATCH' : 'MISMATCH (reported, data left as is)'}`);
  } catch (e) { console.log(`triennial cross-check skipped: ${e.message}`); }
}

/* ---------- split ---------- */
function doSplit(id, row) {
  needTool('ffmpeg'); needTool('ffprobe');
  const m4a = join(CACHE_DIR, `${id}.m4a`), infoPath = join(CACHE_DIR, `${id}.info.json`);
  if (!existsSync(m4a) || !existsSync(infoPath)) fail(`split needs ${m4a} and its info.json — run fetch first`);
  const info = JSON.parse(readFileSync(infoPath, 'utf8'));
  const s = sanity(m4a, info);
  if (!s.ok) fail(`source file fails the sanity check: ${s.problems.join('; ')}`);
  // the flags must say what the table says — the table is the permission record
  for (const k of ['ref', 'parsha']) if (flags[k] !== undefined && flags[k] !== row[k]) fail(`--${k} "${flags[k]}" does not match the VIDEOS table's "${row[k]}" for ${id}`, 2);
  for (const k of ['year', 'aliyah']) if (flags[k] !== undefined && +flags[k] !== row[k]) fail(`--${k} ${flags[k]} does not match the VIDEOS table's ${row[k]} for ${id}`, 2);
  const r = parseRef(row.ref);
  const verses = versesOfRef(r, loadBookText(r.book));
  const N = verses.length;
  const thresh = flags.thresh || '-50dB', mindur = flags.mindur || '0.6', pad = flags.pad !== undefined ? parseFloat(flags.pad) : 0.15;
  console.log(`split: ${id} "${info.title}" (${s.probe.toFixed(1)} s) → ${row.ref}: ${N} verses`);

  let segs, dur = s.probe;
  if (flags.boundaries) {
    const b = String(flags.boundaries).split(',').map((x) => parseFloat(x.trim()));
    if (b.length !== N + 1 || b.some((x) => !isFinite(x)) || b.some((x, i) => i && x <= b[i - 1])) fail(`--boundaries needs ${N + 1} increasing seconds (verse i spans b[i]..b[i+1]); got ${b.length}`, 2);
    segs = b.slice(0, -1).map((t, i) => ({ start: t, end: b[i + 1] }));
    console.log(`split: boundaries given by hand\n${segTable(segs)}`);
  } else {
    const d = detectSegments(m4a, thresh, mindur);
    dur = d.dur;
    segs = d.segs;
    console.log(`split: silencedetect noise=${thresh} d=${mindur} → ${d.silences.length} silences, ${segs.length} sound segments\n${segTable(segs)}`);
    const trimmed = [];
    while (segs.length > N && segs[0].end - segs[0].start < 1.5) trimmed.push({ where: 'lead-in', ...segs.shift() });
    while (segs.length > N && segs[segs.length - 1].end - segs[segs.length - 1].start < 1.5) trimmed.push({ where: 'tail', ...segs.pop() });
    for (const t of trimmed) console.log(`split: trimmed ${t.where} segment ${t.start.toFixed(2)}–${t.end.toFixed(2)} (${(t.end - t.start).toFixed(2)} s)`);
    if (segs.length !== N) {
      console.log(`\nsplit: ${segs.length} segments after trimming, but ${row.ref} has ${N} verses:\n${segTable(segs)}`);
      fail(`segment count ≠ verse count. Not guessing: adjust --thresh / --mindur, or pass --boundaries "t0,…,t${N}" by hand.`);
    }
  }
  mkdirSync(AUDIO_DIR, { recursive: true });
  mkdirSync(FLAC_DIR, { recursive: true });
  const manifest = readManifest();
  manifest.credit.videos[id] = {
    title: info.title || '', url: `https://youtu.be/${id}`, upload_date: info.upload_date || '', duration: info.duration || null,
    channel: info.channel || info.uploader || '', fetched: new Date().toISOString().slice(0, 10),
  };
  let totalBytes = 0;
  console.log('\n  verse          cut (s)            mp3 dur   bytes');
  verses.forEach((vs, i) => {
    const seg = segs[i];
    const start = Math.max(0, seg.start - pad), end = Math.min(dur, seg.end + pad);
    const flac = join(FLAC_DIR, `${vs.file}.flac`), mp3 = join(AUDIO_DIR, `${vs.file}.mp3`);
    // -ss after -i: sample-accurate cuts (the file is short, speed is irrelevant); -ac 1 mono (speech)
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', m4a, '-ss', String(start), '-to', String(end), '-vn', '-ac', '1', '-c:a', 'flac', flac]);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', m4a, '-ss', String(start), '-to', String(end), '-vn', '-ac', '1', '-codec:a', 'libmp3lame', '-q:a', '5', mp3]);
    const mdur = Math.round(ffprobeDuration(mp3) * 100) / 100;
    const bytes = statSync(mp3).size;
    totalBytes += bytes;
    const prev = manifest[vs.key] || {};
    manifest[vs.key] = {
      file: `${vs.file}.mp3`, dur: mdur, video: id, parsha: row.parsha, year: row.year, aliyah: row.aliyah,
      verified: prev.verified === true && prev.file === `${vs.file}.mp3` ? true : false,   // a re-cut file is unheard again
      timings: prev.timings || null, timingsVerified: prev.timingsVerified === true && prev.file === `${vs.file}.mp3` ? true : false,
    };
    if (prev.verified === true && prev.file === `${vs.file}.mp3` && prev.dur !== mdur) manifest[vs.key].verified = false;
    console.log(`  ${vs.key.padEnd(14)} ${start.toFixed(2).padStart(7)} – ${end.toFixed(2).padStart(7)}   ${String(mdur).padStart(6)}   ${bytes}`);
  });
  writeManifest(manifest);
  writeFileSync(join(OUT_DIR, 'LICENSE.txt'), LICENSE_TEXT);
  const perVerse = totalBytes / N;
  console.log(`\nsplit: ${N} MP3s, ${totalBytes} bytes total, ${Math.round(perVerse)} bytes/verse (mean ${(perVerse / 1024).toFixed(1)} KB)`);
  console.log(`Phase 2 estimate: 5,845 verses × ${(perVerse / 1024).toFixed(1)} KB ≈ ${(5845 * perVerse / 1024 / 1024).toFixed(0)} MB of MP3 at this setting.`);
  console.log(`FLAC hand-back set: ${FLAC_DIR}/`);
  triennialCheck(row, r);
  console.log(`\nwrote ${MANIFEST} (every entry verified:false until you listen) and ${join(OUT_DIR, 'LICENSE.txt')}`);
  console.log(`\nAfter listening, flip the entries you accept:\n  node scripts/build-totaltorah-audio.mjs verify --verses "${verses.map((v) => v.key).join(',')}"`);
  console.log(`and, after the karaoke check, the timings:\n  node scripts/build-totaltorah-audio.mjs verify --timings --verses "${verses.map((v) => v.key).join(',')}"`);
}

/* ---------- verify ---------- */
function doVerify() {
  const list = String(flags.verses || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!list.length) fail('verify needs --verses "Genesis 1:1,Genesis 1:2,…"', 2);
  const manifest = readManifest();
  const field = flags.timings ? 'timingsVerified' : 'verified';
  for (const k of list) {
    const e = manifest[k];
    if (!e) fail(`${k} is not in the manifest`, 2);
    if (field === 'timingsVerified' && !e.timings) fail(`${k} has no timings file to verify — run build-totaltorah-timings.mjs first`, 2);
    e[field] = true;
    console.log(`verify: ${k} ${field} = true`);
  }
  writeManifest(manifest);
}

/* ---------- main ---------- */
if (cmd === 'verify') {
  doVerify();
} else if (cmd === 'fetch') {
  doFetch(String(flags.video || ''), videoRow(String(flags.video || '')));
} else if (cmd === 'split') {
  const id = String(flags.video || '');
  doSplit(id, videoRow(id));
} else if (!cmd && flags.video) {
  const id = String(flags.video);
  const row = videoRow(id);
  doFetch(id, row);
  doSplit(id, row);
} else {
  console.log('usage: build-totaltorah-audio.mjs (fetch|split|verify) [--video <id>] … (see the header comment)');
  process.exit(2);
}
