#!/usr/bin/env node
/*
 * build-totaltorah-timings.mjs — word-level karaoke timings for the Total Torah verse files, by forced
 * alignment, and the verse boundaries of a whole video. Run after build-totaltorah-audio.mjs split.
 *
 *   node scripts/build-totaltorah-timings.mjs [--only "Genesis 1:1,Genesis 1:2"] [--minscore 0.5] [--audit] [--setup]
 *   node scripts/build-totaltorah-timings.mjs --boundaries <videoId> [--intro <s>|silence] [--pad <s>]
 *   node scripts/build-totaltorah-timings.mjs --derive <videoId> [--minscore 0.5] [--audit]
 *
 * Default (per verse): for each manifest verse with a FLAC in source-data/totaltorah-cache/verses/:
 *   1. the verse's Hebrew (Sefaria's export, the index builder's cache) is tokenized by the Trainer's own rule
 *      (split on whitespace and maqaf; a token is a sung word iff it carries a Hebrew letter — each side of a
 *      maqaf is its own word, as tokenizeHebrew emits .tt-word cells) and stripped to consonants;
 *   2. scripts/align_totaltorah.py (CTC forced alignment over a Hebrew wav2vec2 model, in the venv at
 *      source-data/totaltorah-cache/align-env/, loaded ONCE for the run through its --serve mode) returns one
 *      onset, end and confidence per word;
 *   3. data/totaltorah/timings/<file>.txt is written in the PocketTorah label format the page already reads —
 *      comma-separated word onsets, index = word index, plus ONE trailing value, the end of the last word —
 *      and the manifest entry gets `timings: "<file>.txt"`. `timingsVerified` is never set here: the maintainer
 *      flips it with build-totaltorah-audio.mjs verify --timings after listening with karaoke on. A word under
 *      --minscore (0.5) is reported; the file is still written so it can be audited by ear. A verse that cannot
 *      be aligned is reported and skipped (nothing written for it); the run exits 1 if any was.
 *
 * --boundaries <id> — the verse boundaries of a whole video, for build-totaltorah-audio.mjs split --boundaries
 * auto. Nearly every Total Torah video opens with a spoken English announcement ("Parashat B'reishit, Year 1,
 * Aliyah 4"), and the cantor's mid-verse pauses (etnachta, zakef) are quieter than her breaths between verses,
 * so silence alone finds neither the intro's end nor the verses. The intro's end is read off an English speech
 * model's transcript of the first 30 s (facebook/wav2vec2-base-960h, loaded by the aligner on first use): the
 * aliyah number the whitelist row expects is found in it by fuzzy match, its timestamp is the announcement's
 * end, and the cut is the first pause after it; the transcript, the match and the old first-silence rule's value
 * are printed, and a video the transcript cannot settle (no match, an announcement that goes on, no pause) falls
 * back to that rule and is flagged introUnconfirmed in the boundaries file and the bulk ledger (--intro silence
 * uses that rule alone, --intro <s> a value confirmed by ear). Then the rest of the file is aligned against the
 * aliyah's whole text in one pass (the network runs in 40 s windows, so a long aliyah needs no more memory than
 * a short one), a cut is placed midway through each gap between a verse's last word and the next verse's first,
 * and source-data/totaltorah-cache/<id>.boundaries.json is written — with every word's onset, end and score, so
 * --derive can write the timings without a second pass.
 *
 * --derive <id> — the timings of every verse of a video from its boundaries file (no model, no venv): each
 * onset moves back by its cut's start (the boundary minus --pad). The bulk pipeline's default; the per-verse
 * mode above re-aligns each cut on its own and is the second opinion when a verse sounds off.
 *
 * --setup creates the venv and installs the pinned requirements (torch CPU, torchaudio, transformers, soundfile,
 * huggingface_hub); the models are pinned in totaltorah-lib.mjs (MODEL + MODEL_REVISION for the Hebrew aligner,
 * MODEL_EN + MODEL_EN_REVISION for the English model that reads the announcements), downloaded on first use. If the venv, torch or
 * the model cannot be installed or downloaded the script exits 1 — there is no heuristic fallback (equal split,
 * syllable count): a plausibly wrong highlight is exactly what must not ship.
 *
 * --audit writes source-data/totaltorah-cache/audit.html (gitignored): the verse words with a play button each
 * that plays the verse file from that onset for 1.2 s. Plain <audio> + JS.
 *
 * Zero npm dependencies; the Python side is the one isolated environment. Shared code: scripts/totaltorah-lib.mjs.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { VIDEOS } from './totaltorah-videos.mjs';
import { CACHE_DIR, MANIFEST, TIMINGS_DIR, AlignerClient, setupEnv, checkEnv, sourceAudio, computeBoundaries, alignVerses, deriveVideoTimings, auditHtml, DEFAULT_PAD } from './totaltorah-lib.mjs';

const argv = process.argv.slice(2);
const flags = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) continue;
  const next = argv[i + 1];
  if (next !== undefined && !next.startsWith('--')) { flags[a.slice(2)] = next; i++; } else flags[a.slice(2)] = true;
}
const fail = (msg, code = 1) => { console.error(`\n✗ ${msg}`); process.exit(code); };
const MINSCORE = flags.minscore !== undefined ? parseFloat(flags.minscore) : 0.5;
const PAD = flags.pad !== undefined ? parseFloat(flags.pad) : DEFAULT_PAD;

function writeAudit(results) {
  if (!flags.audit || !results.length) return;
  writeFileSync(join(CACHE_DIR, 'audit.html'), auditHtml(results, MINSCORE));
  console.log(`audit page: ${join(CACHE_DIR, 'audit.html')} (open it over a local HTTP server from the repo root, e.g. http://localhost:8080/source-data/totaltorah-cache/audit.html)`);
}
function verifyHint(results) {
  console.log(`\nAfter listening with karaoke on:\n  node scripts/build-totaltorah-audio.mjs verify --timings --verses "${results.map((r) => r.key).join(',')}"`);
}

try {
  if (flags.setup) setupEnv();

  if (flags.boundaries) {
    const id = String(flags.boundaries);
    const row = VIDEOS[id];
    if (!row) fail(`"${id}" is not in scripts/totaltorah-videos.mjs — add its row first (the permission record)`, 2);
    const src = sourceAudio(id);
    if (!src) fail(`no ${join(CACHE_DIR, id)}.m4a or .mp3 — run build-totaltorah-audio.mjs fetch, or drop the file there`, 2);
    checkEnv();
    const intro = flags.intro === undefined ? 'auto' : flags.intro === 'silence' ? 'silence' : parseFloat(flags.intro);
    if (typeof intro === 'number' && !isFinite(intro)) fail('--intro takes seconds, or "silence"', 2);
    const client = new AlignerClient();
    try {
      await computeBoundaries({ id, row, src, client, intro, pad: PAD, keep16k: true });
    } finally { await client.close(); }
    console.log(`next: node scripts/build-totaltorah-audio.mjs split --video ${id} --boundaries auto${PAD !== DEFAULT_PAD ? ` --pad ${PAD}` : ''}`);
    process.exit(0);
  }

  if (!existsSync(MANIFEST)) fail(`${MANIFEST} is missing — run build-totaltorah-audio.mjs split first`);
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

  if (flags.derive) {
    const id = String(flags.derive);
    if (!VIDEOS[id]) fail(`"${id}" is not in scripts/totaltorah-videos.mjs`, 2);
    const { results, failures } = deriveVideoTimings({ id, manifest, minscore: MINSCORE });
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
    console.log(`\nwrote ${results.length} timings file(s) to ${TIMINGS_DIR}/ and updated ${MANIFEST}`);
    if (results.some((r) => r.low.length)) console.log(`some words scored under ${MINSCORE}: audit those verses by ear before flipping timingsVerified`);
    writeAudit(results);
    if (results.length) verifyHint(results);
    if (failures.length) fail(`${failures.length} verse(s) not written: ${failures.map((f) => `${f.key} (${f.error})`).join('; ')}`);
    process.exit(0);
  }

  const only = flags.only ? new Set(String(flags.only).split(',').map((s) => s.trim())) : null;
  const keys = Object.keys(manifest).filter((k) => k !== 'credit' && (!only || only.has(k)));
  if (!keys.length) fail('no manifest verses to align');
  checkEnv();
  const client = new AlignerClient();
  let out;
  try { out = await alignVerses({ keys, manifest, client, minscore: MINSCORE }); } finally { await client.close(); }
  const { results, failures } = out;
  // write the manifest back in the audio script's order (credit first, verses as they were)
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
  console.log(`\nwrote ${results.length} timings file(s) to ${TIMINGS_DIR}/ and updated ${MANIFEST}`);
  if (results.length) {
    const total = results.reduce((s, r) => s + r.wall, 0);
    const perVerse = total / results.length;
    console.log(`alignment wall-clock: ${total.toFixed(1)} s for ${results.length} verses (${perVerse.toFixed(1)} s/verse) → 5,845 verses ≈ ${(5845 * perVerse / 3600).toFixed(1)} h on this CPU`);
  }
  if (results.some((r) => r.low.length)) console.log(`some words scored under ${MINSCORE}: audit those verses by ear before flipping timingsVerified`);
  writeAudit(results);
  if (results.length) verifyHint(results);
  if (failures.length) fail(`${failures.length} verse(s) not written: ${failures.map((f) => `${f.key} (${f.error})`).join('; ')}`);
} catch (e) {
  fail(e && e.message ? e.message : String(e));
}
