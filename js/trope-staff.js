/* ═══════════════════════════════════════════════════════════════════════════
   IvritSuite — the one trope staff engine: js/trope-staff.js
   Loaded by trope_tutor.html (the Learn cards' and Phrases tab's staffs) and
   torah_trainer.html (the Trope staff layout) as a classic script placed right
   before each page's inline <script>, so every name below is a plain global the
   page's own code calls unqualified. It reads no `settings`, no `I18n` and no DOM
   but document.createElementNS: anything that needs a page's state stays in that
   page (the tutor's tuneShiftVal/staffKey/noteNameAt, the trainer's staff view and
   its staffNoteNameAt).
   Contents: the TROPES taxonomy (byte-identical with scripts/build-trope-index.mjs;
   scripts/build-trope-phrases.mjs reads both and refuses a difference), the pitch
   model (semitones from B4 → staff position and accidental, in a key), the staff
   primitives, and the full-notation phrase staff (docs/reference/torah-and-trope.md).
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
/* ═══ TROPES taxonomy — KEEP IN SYNC between scripts/build-trope-index.mjs and js/trope-staff.js ═══
   Per-mark taxonomy for the tutor. `chars` are ported EXACTLY from torah_trainer.html's
   TROPE_CHAR_TO_FAMILY and `family` follows its seven families, except that munach teaches
   in the Etnachta clause (the chart's "munach before etnachta") while the Trainer colors it
   by the half of the verse it stands in;
   keys are stable snake_case identifiers used in trope_index.json and in the
   tutor's progress store — never rename a key without a data migration.
   Notes:
   - sof_pasuk has NO chars: Unicode unifies the siluk mark with METEG (U+05BD),
     so the verse-final word is classified positionally (zero in-range marks).
   - zarka lists BOTH U+0598 (Unicode "ZARQA") and U+05AE (Unicode "ZINOR") —
     the Unicode names are swapped relative to traditional usage and encoded
     texts disagree; `display` carries the codepoint this corpus actually uses.
   - Sephardi naming collides with Ashkenazi across marks: Ashkenazi "pashta"
     (postpositive, U+0599) is called "kadma" in Sephardi usage, while the
     Ashkenazi "kadma" (on the stress, U+05A8) is Sephardi "azla". Same glyph
     shape, different position — the tutor's classic confusable pair. */
const TROPES = [
  // 1. Sof Pasuk clause (mercha, tipcha, sof_pasuk) and 2. Etnachta clause (munach, etnachta),
  // in phrase order: each family's cards render in this order.
  { key: 'mercha',          chars: ['֥'], display: '֥', ashk: 'Mercha',          seph: "Ma'arich",        family: 'sofpasuk', rare: false },
  { key: 'tipcha',          chars: ['֖'], display: '֖', ashk: 'Tipcha',          seph: 'Tarcha',          family: 'sofpasuk', rare: false },
  { key: 'munach',          chars: ['֣'], display: '֣', ashk: 'Munach',          seph: 'Shofar Holech',   family: 'etnachta', rare: false },
  { key: 'etnachta',        chars: ['֑'], display: '֑', ashk: 'Etnachta',        seph: 'Atnach',          family: 'etnachta', rare: false },
  { key: 'sof_pasuk',       chars: [],         display: 'ֽ׃', ashk: 'Sof Pasuk (Siluk)', seph: 'Sof Pasuk (Siluk)', family: 'sofpasuk', rare: false },
  // 3. Zakef Katon clause
  { key: 'mahpach',         chars: ['֤'], display: '֤', ashk: 'Mahpach',         seph: 'Shofar Mehupach', family: 'katon', rare: false },
  { key: 'pashta',          chars: ['֙'], display: '֙', ashk: 'Pashta',          seph: 'Kadma',           family: 'katon', rare: false },
  { key: 'yetiv',           chars: ['֚'], display: '֚', ashk: 'Yetiv',           seph: 'Yetiv',           family: 'katon', rare: false },
  { key: 'zakef_katon',     chars: ['֔'], display: '֔', ashk: 'Zakef Katon',     seph: 'Zakef Katon',     family: 'katon', rare: false },
  { key: 'zakef_gadol',     chars: ['֕'], display: '֕', ashk: 'Zakef Gadol',     seph: 'Zakef Gadol',     family: 'katon', rare: false },
  // 4. Segol clause
  { key: 'zarka',           chars: ['֘', '֮'], display: '֮', ashk: 'Zarka', seph: 'Zarka',           family: 'segol', rare: false },
  { key: 'segol',           chars: ['֒'], display: '֒', ashk: 'Segol',           seph: 'Segolta',         family: 'segol', rare: false },
  { key: 'shalshelet',      chars: ['֓'], display: '֓', ashk: 'Shalshelet',      seph: 'Shalshelet',      family: 'segol', rare: true },
  // 5. Revia group
  { key: 'revia',           chars: ['֗'], display: '֗', ashk: 'Revia',           seph: 'Revia',           family: 'revia', rare: false },
  { key: 'darga',           chars: ['֧'], display: '֧', ashk: 'Darga',           seph: 'Darga',           family: 'revia', rare: false },
  { key: 'tevir',           chars: ['֛'], display: '֛', ashk: 'Tevir',           seph: 'Tevir',           family: 'revia', rare: false },
  // 6. Geresh group
  { key: 'kadma',           chars: ['֨'], display: '֨', ashk: 'Kadma',           seph: 'Azla',            family: 'geresh', rare: false },
  { key: 'geresh',          chars: ['֜'], display: '֜', ashk: 'Geresh',          seph: 'Geresh',          family: 'geresh', rare: false },
  { key: 'geresh_muqdam',   chars: ['֝'], display: '֝', ashk: 'Geresh Muqdam',   seph: 'Geresh Muqdam',   family: 'geresh', rare: true },
  { key: 'gershayim',       chars: ['֞'], display: '֞', ashk: 'Gershayim',       seph: 'Shenei Gerishin', family: 'geresh', rare: false },
  { key: 'telisha_ketana',  chars: ['֩'], display: '֩', ashk: 'Telisha Ketana',  seph: 'Talsha',          family: 'geresh', rare: false },
  { key: 'telisha_gedola',  chars: ['֠'], display: '֠', ashk: 'Telisha Gedola',  seph: 'Tirtzah',         family: 'geresh', rare: false },
  { key: 'pazer',           chars: ['֡'], display: '֡', ashk: 'Pazer',           seph: 'Pazer Gadol',     family: 'geresh', rare: false },
  // 7. Rare marks
  { key: 'mercha_kefula',   chars: ['֦'], display: '֦', ashk: 'Mercha Kefula',   seph: "Tere Ta'amei",    family: 'rare', rare: true },
  { key: 'karnei_parah',    chars: ['֟'], display: '֟', ashk: 'Karnei Parah',    seph: 'Karnei Farah',    family: 'rare', rare: true },
  { key: 'yerach_ben_yomo', chars: ['֪'], display: '֪', ashk: 'Yerach Ben Yomo', seph: 'Yareach Ben Yomo', family: 'rare', rare: true },
];
/* ═══ end TROPES taxonomy ═══ */

const TROPE_BY_KEY = {};
for (const t of TROPES) TROPE_BY_KEY[t.key] = t;
// char → trope key (both zarka codepoints resolve to zarka). sof_pasuk has no char: the verse-final
// word takes it by position (the index builder and the Torah Trainer both do this).
const TROPE_CHAR_TO_KEY = {};
for (const t of TROPES) for (const ch of t.chars) TROPE_CHAR_TO_KEY[ch] = t.key;

/* ══════════════════════════════════════════════════════
   MOTIF STAFF — hand-rolled inline SVG (createElementNS, no libraries).
   Motif pitches are semitones from B4 (the treble middle line), so the
   printed chart's A major puts its tonic A4 at p = -2 and its low A3 at
   -14 — the chart's own register, an octave above the sung male voice.
   The motif file's `key` (a major key name such as "A") draws that
   signature and spells in-key notes without accidentals, so a natural
   appears only where the chart prints one; with no key, rising notes take
   sharps and falling notes flats. docs/tropepatterns.md is the source.
   Settings → Key (`tuneShift`, −6…6 half steps) moves every note and
   redraws the staff in the key it lands on (staffKey()); Low voices
   (`tuneVoice`) never moves a note — it writes the 8 under the clef and
   the tune sounds an octave down, the way men sing the printed chart.
   Settings → Note names (`noteNames`) writes a name under every note:
   its letter, or its movable-do syllable (noteNameAt()).
   ══════════════════════════════════════════════════════ */
const SVG_NS = 'http://www.w3.org/2000/svg';
function _svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}
// Major-key signatures (sharps positive, flats negative) and the order the accidentals are written.
const KEY_SHARPS = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7 };
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'], FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };   // pitch class of each natural letter
const LETTER_STEP = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };  // diatonic step within an octave
function keySignature(key) {                 // [{letter, acc}] in writing order; [] when the key is unknown
  const n = KEY_SHARPS[key];
  if (!Number.isInteger(n) || n === 0) return [];
  return (n > 0 ? SHARP_ORDER.slice(0, n) : FLAT_ORDER.slice(0, -n)).map((letter) => ({ letter, acc: n > 0 ? 1 : -1 }));
}
// Semitones-from-B4 → diatonic steps above the middle line + the accidental to draw.
function motifPitchPos(p, key) {
  const q = Math.round(p);
  const sig = {};
  keySignature(key).forEach((k) => { sig[k.letter] = k.acc; });
  if (Number.isInteger(KEY_SHARPS[key])) {
    const m = 71 + q, pc = ((m % 12) + 12) % 12;      // B4 is MIDI 71
    const pos = (L, total, acc) => {                   // total = sounding alteration of the natural letter
      const oct = Math.round((m - LETTER_PC[L] - total) / 12) - 1;
      return { step: oct * 7 + LETTER_STEP[L] - 34, acc };   // B4 = octave 4, step 6 → 34
    };
    const pcOf = (L, alt) => (((LETTER_PC[L] + alt) % 12) + 12) % 12;
    for (const L in LETTER_PC) if (pcOf(L, sig[L] || 0) === pc) return pos(L, sig[L] || 0, '');
    // Out of the key: spelled the way the charts print chromatic notes — raised 1st and 4th, lowered
    // 3rd, 6th and 7th — so C major writes F♯ and B♭, and A major's lowered seventh is G♮.
    const T = key[0], tAlt = key[1] === '#' ? 1 : key[1] === 'b' ? -1 : 0;
    const DEG = { 1: [0, 1], 3: [2, -1], 6: [3, 1], 8: [5, -1], 10: [6, -1] };   // semitones above the tonic → [letter offset, direction]
    const deg = DEG[(((pc - pcOf(T, tAlt)) % 12) + 12) % 12];
    if (deg) {
      const LETTERS = 'CDEFGAB', L = LETTERS[(LETTERS.indexOf(T) + deg[0]) % 7];
      const total = ((((pc - LETTER_PC[L]) % 12) + 18) % 12) - 6;   // the sounding alteration that letter needs
      const SIGN = { '-1': '♭', 0: '♮', 1: '♯' };
      if (total === (sig[L] || 0) + deg[1] && SIGN[total] !== undefined) return pos(L, total, SIGN[total]);
    }
    const opts = [];
    for (const L in LETTER_PC) {
      const a = sig[L] || 0;
      if (a + 1 <= 1 && pcOf(L, a + 1) === pc) opts.push(pos(L, a + 1, a + 1 === 0 ? '♮' : '♯'));
      if (a - 1 >= -1 && pcOf(L, a - 1) === pc) opts.push(pos(L, a - 1, a - 1 === 0 ? '♮' : '♭'));
    }
    const pref = KEY_SHARPS[key] > 0 ? '♯' : '♭';
    return opts.find((o) => o.acc === '♮') || opts.find((o) => o.acc === pref) || opts[0];
  }
  // No key: ascending spelled with sharps, descending with flats; beyond ±12 fold by an octave (±7 diatonic steps).
  const UP = [[0,''],[1,''],[1,'♯'],[2,''],[2,'♯'],[3,''],[4,''],[4,'♯'],[5,''],[5,'♯'],[6,''],[6,'♯']];
  const DN = [[0,''],[0,'♭'],[-1,''],[-1,'♭'],[-2,''],[-2,'♭'],[-3,''],[-4,''],[-4,'♭'],[-5,''],[-5,'♭'],[-6,'']];
  let oct = 0, r = q;
  while (r >= 12) { r -= 12; oct += 7; }
  while (r <= -12) { r += 12; oct -= 7; }
  const [step, acc] = r >= 0 ? UP[r] : DN[-r];
  return { step: step + oct, acc };
}
// Key: the major key each tonic pitch class is written in once the staffs move (the fewer-accidentals
// spelling; F♯ for the tritone). Every name is in KEY_SHARPS, so keySignature and motifPitchPos take it as is.
const MAJOR_KEY_BY_PC = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const TUNE_SHIFT_MAX = 6;   // half steps either way; #optTuneShift's min/max say the same
function keyPc(key) { return (((LETTER_PC[key[0]] + (key[1] === '#' ? 1 : key[1] === 'b' ? -1 : 0)) % 12) + 12) % 12; }
function shiftedKey(key, shift) {   // an unknown key (a file without one) stays as it is: its notes still move
  if (!shift) return key;           // unmoved, a chart keeps its own spelling (a G♭ file is never respelled F♯)
  return Number.isInteger(KEY_SHARPS[key]) ? MAJOR_KEY_BY_PC[(((keyPc(key) + shift) % 12) + 12) % 12] : key;
}

// Estimated advance of a name, in the staff's units, at its bold (sounding) weight, so a name that lights up never
// touches its neighbour: Hebrew points take no room.
function noteNameWidth(s, size) {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    w += cp >= 0x0591 && cp <= 0x05C7 ? 0 : /[A-Z]/.test(ch) ? 0.72 : /[א-ת]/.test(ch) ? 0.64 : 0.6;
  }
  return w * size;
}
function noteNameEl(name, x, y, size) {   // one name, centred under its note; a Hebrew syllable reads right to left
  const attrs = { class: 'tu-nn', x, y, 'font-size': size, 'text-anchor': 'middle' };
  if (/[א-ת]/.test(name)) { attrs.direction = 'rtl'; attrs.lang = 'he'; }
  const el = _svgEl('text', attrs);
  el.textContent = name;
  return el;
}
const MOTIF_NAME_SIZE = 9, PHRASE_NAME_SIZE = 7.5, PHRASE_GRACE_NAME_SIZE = 6;
// Staff primitives, shared by the Learn cards' staffs and the Phrases tab's. MID is the middle line's
// y and STEP half a staff space, one diatonic step; every staff draws in currentColor.
const STAFF_SIG_STEP = { F: 4, C: 1, G: 5, D: 2, A: -1, E: 3, B: 0 }, STAFF_FLAT_STEP = { B: 0, E: 3, A: -1, D: 2, G: -2, C: 1, F: -3 };
function staffLines(svg, W, MID) {
  for (let i = -2; i <= 2; i++)
    svg.appendChild(_svgEl('line', { x1: 1, y1: MID + i * 6, x2: W - 1, y2: MID + i * 6,
      stroke: 'currentColor', 'stroke-width': 0.8, opacity: 0.55 }));
}
function staffClef(svg, MID, low) {
  const clef = _svgEl('text', { x: 2, y: MID + 10, 'font-size': 30, fill: 'currentColor', 'aria-hidden': 'true' });
  clef.textContent = '\u{1D11E}';   // 𝄞 treble-clef symbol, not a UI string — i18n-ignore
  svg.appendChild(clef);
  if (low) {   // treble clef with an 8 below: sung an octave lower than written
    const eight = _svgEl('text', { x: 12, y: MID + 27, 'font-size': 9, 'text-anchor': 'middle', fill: 'currentColor', 'aria-hidden': 'true', class: 'tu-motif-8vb' });
    eight.textContent = '8';   // the octave figure of the notation, not a UI string — i18n-ignore
    svg.appendChild(eight);
  }
}
// Key signature: F♯ on the top line, C♯ in the third space… (treble-clef positions as diatonic steps from B4).
function staffKeySig(svg, sig, MID, STEP) {
  sig.forEach((k, i) => {
    const step = k.acc > 0 ? STAFF_SIG_STEP[k.letter] : STAFF_FLAT_STEP[k.letter];
    const a = _svgEl('text', { x: 23 + i * 6, y: MID - step * STEP + 3, 'font-size': 9, fill: 'currentColor', 'aria-hidden': 'true' });
    a.textContent = k.acc > 0 ? '♯' : '♭';
    svg.appendChild(a);
  });
}
function staffLedgers(g, cx, step, MID, STEP, half = 6) {
  for (let s = 6; s <= step; s += 2)      // ledger lines above the staff
    g.appendChild(_svgEl('line', { x1: cx - half, y1: MID - s * STEP, x2: cx + half, y2: MID - s * STEP,
      stroke: 'currentColor', 'stroke-width': 0.8 }));
  for (let s = -6; s >= step; s -= 2)     // and below
    g.appendChild(_svgEl('line', { x1: cx - half, y1: MID - s * STEP, x2: cx + half, y2: MID - s * STEP,
      stroke: 'currentColor', 'stroke-width': 0.8 }));
}
function staffHead(g, cx, cy, open, rx = 3.4, ry = 2.5) {   // open: a half note's hollow head
  g.appendChild(_svgEl('ellipse', open
    ? { cx, cy, rx, ry, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2,
        transform: 'rotate(-18 ' + cx + ' ' + cy + ')' }
    : { cx, cy, rx, ry, fill: 'currentColor', transform: 'rotate(-18 ' + cx + ' ' + cy + ')' }));
}

/* ══════════════════════════════════════════════════════
   PHRASE STAFF — one chart row in full notation (data/trope/trope_phrases.json):
   every value, dot, rest, beam and flag, tie, slur, triplet, grace note, accent
   and accidental as the chart prints it (an accidental holds to the end of the
   row: the chart has no bar lines), the syllables under the notes, and a colour
   bar above each mark's notes. Pure: it reads only its arguments — the row, the
   key it is drawn in, the half steps it moves, whether the 8 goes under the clef
   — so a whole reading's staff can later be built from the same pieces
   (docs/tropepatterns.md → G). layoutPhraseStaff() places everything in
   coordinates around the middle line; renderPhraseStaff() draws the layout.
   Beams join the notes of one syllable (a run over eight splits at the quarter),
   break at rests and grace notes, and turn their stems by the note farthest from
   the middle line; notation is LTR, so the SVG is too.
   ══════════════════════════════════════════════════════ */
const PHRASE_VALUE = {
  32: { flags: 3 }, s: { flags: 2 }, ds: { flags: 2, dot: true }, e: { flags: 1 }, de: { flags: 1, dot: true },
  q: { flags: 0 }, dq: { flags: 0, dot: true }, h: { flags: 0, open: true }, dh: { flags: 0, open: true, dot: true }, g: { flags: 1 },
};
const PHRASE_STEP = 3, PHRASE_STEM = 18, PHRASE_SYL_SIZE = 8.5;
const PHRASE_SCALE = 1.5;   // px per staff unit on screen (renderPhraseStaff sizes the SVG by it)
// Estimated advance of one capital (the syllables are the chart's transliterations), in ems.
function _phraseTextWidth(s) {
  let w = 0;
  for (const ch of s) w += /['’.,]/.test(ch) ? 0.28 : /[IJ1]/.test(ch) ? 0.34 : /[MW]/.test(ch) ? 0.86 : 0.68;
  return w * PHRASE_SYL_SIZE;
}
// A rest of any value, in the staff's units around its x (y down, 6 to a space, 0 the middle line), where
// engravers put it: a hooked rest hangs a knob in the third space and one more in each space below (a 32nd's
// third in the fourth space) off a slanting stem that reaches the second line for an eighth and the bottom
// line for a 16th or 32nd; a quarter rest's zigzag spans the middle three spaces; a half rest sits on the
// middle line; a dot rides in the third space. l, r, top and bottom are its reach, which the layout spaces by.
function phraseRestGlyph(val) {
  const g = { knobs: [], strokes: [], block: null, dot: null };
  if (val.flags) {
    const ks = [-2.6, 3.4, -8.6].slice(0, val.flags).sort((a, b) => a - b);   // knob centres, top first
    const slope = 3 / 10.3, yT = ks[0] - 1.2, yB = val.flags > 1 ? 12 : 6.5;
    const xT = (5.2 + slope * (ks[ks.length - 1] - ks[0])) / 2;              // the stem's top, set to centre the rest
    const stemX = (y) => xT - slope * (y - yT);
    ks.forEach((ky, k) => {
      const fx = stemX(ky - 1.2), kx = fx - 4.2;
      g.knobs.push({ x: kx, y: ky });
      const d = [['M', kx, ky], ['Q', kx + 2.2, ky + 1.4, fx, ky - 1.2]];
      if (k === 0) d.push(['L', stemX(yB), yB]);   // the top knob's hook runs on down the stem
      g.strokes.push({ d, w: 1.1 });
    });
    Object.assign(g, { l: 1.5 - Math.min(...g.knobs.map((k) => k.x)), r: xT + 0.55, top: yT - 0.55, bottom: yB + 0.55 });
  } else if (!val.open) {   // quarter
    g.strokes.push({ d: [['M', -1.3, -9], ['L', 1.9, -4.9]], w: 1 }, { d: [['M', 1.9, -4.9], ['L', -1.3, -0.9]], w: 2.4 },
      { d: [['M', -1.3, -0.9], ['L', 1.8, 3.2]], w: 1 }, { d: [['M', 1.8, 3.2], ['C', -0.6, 2.6, -3, 6.4, 0.9, 8.9]], w: 1.6 });
    Object.assign(g, { l: 2.6, r: 3.1, top: -9.5, bottom: 9.7 });
  } else {                  // half
    g.block = { x: -3.4, y: -3, w: 6.8, h: 3 };
    Object.assign(g, { l: 3.4, r: 3.4, top: -3, bottom: 0 });
  }
  if (val.dot) { g.dot = { x: g.r + 2.2, y: -3 }; g.r += 3.35; }
  return g;
}
// names (optional): the name to write under each note, index-aligned with row.notes (noteNameAt, read by the caller).
function layoutPhraseStaff(row, key, shift, names, opts = {}) {
  const STEP = PHRASE_STEP;
  // opts (all default-off; the tutor passes none): lyrics:false — no syllable text under the staff, so the
  // syllables neither space the notes nor take a line (a caller lays its own words under the SVG);
  // accidentals:'unit' — an accidental holds only to the end of its mark's figure, not the row (a reading
  // has no bar lines, and each figure is printed on the chart with its own signs).
  const lyrics = opts.lyrics !== false;
  const sig = keySignature(key), sigAlt = {};
  sig.forEach((k) => { sigAlt[k.letter] = k.acc; });
  const letterOf = (step) => 'BCDEFGA'[((step % 7) + 7) % 7];   // step 0 is B4
  const N = row.notes.length;
  const unitOf = new Array(N).fill(0), sylOf = new Array(N).fill(-1);
  row.units.forEach((u, ui) => { for (let i = u.from; i <= u.to; i++) unitOf[i] = ui; });
  row.syl.forEach((s, si) => { for (let i = s.from; i <= s.to; i++) sylOf[i] = si; });
  const notes = row.notes.map((n, i) => {
    const o = { i, u: unitOf[i], s: sylOf[i], rest: !!n.r, grace: !!n.g, val: PHRASE_VALUE[n.v] || PHRASE_VALUE.q, t: n.t,
      tie: !!n.tie, marks: Array.isArray(n.a) ? n.a : [] };
    if (!o.rest) {
      const { step, acc } = motifPitchPos(n.p + shift, key);
      o.step = step; o.y = -step * STEP;
      o.alt = acc === '♯' ? 1 : acc === '♭' ? -1 : acc === '♮' ? 0 : (sigAlt[letterOf(step)] || 0);
    } else o.rg = phraseRestGlyph(o.val);
    o.name = !o.rest && names && names[i] || '';   // a grace note's name is smaller, like its head
    o.nw = o.name ? noteNameWidth(o.name, o.grace ? PHRASE_GRACE_NAME_SIZE : PHRASE_NAME_SIZE) : 0;
    return o;
  });
  // Accidentals: printed where a line or space changes from what the signature (or an earlier sign) set.
  const inForce = {};
  let accU = -1;
  for (const o of notes) if (!o.rest) {
    if (opts.accidentals === 'unit' && o.u !== accU) { for (const k of Object.keys(inForce)) delete inForce[k]; accU = o.u; }
    const had = o.step in inForce ? inForce[o.step] : (sigAlt[letterOf(o.step)] || 0);
    if (o.alt !== had) o.accText = o.alt === 1 ? '♯' : o.alt === -1 ? '♭' : '♮';
    inForce[o.step] = o.alt;
  }
  // Beams: the flagged notes of one syllable; a grace-note pair beams on its own.
  const beams = [];
  let cur = [];
  const flush = () => { if (cur.length > 1) beams.push(cur); cur = []; };
  for (const o of notes) {
    const beamable = !o.rest && o.val.flags > 0;
    if (!beamable || (cur.length && (notes[cur[0]].grace !== o.grace || notes[cur[0]].s !== o.s))) flush();
    if (beamable) cur.push(o.i);
  }
  flush();
  const split = [];
  for (const b of beams) {
    if (b.length <= 8) { split.push(b); continue; }
    let sub = [], ticks = 0;
    for (const i of b) {
      sub.push(i); ticks += notes[i].t;
      if (ticks % 48 === 0 && sub.length > 1) { split.push(sub); sub = []; }
    }
    if (sub.length > 1) split.push(sub); else if (sub.length) notes[sub[0]].solo = true;
  }
  split.forEach((b, bi) => b.forEach((i) => { notes[i].beam = bi; }));
  // Stems: a beam's by the note farthest from the middle line; a lone note's by its own side; grace notes up.
  for (const o of notes) if (!o.rest && o.beam === undefined) o.up = o.grace || o.step < 0;
  for (const b of split) {
    const above = Math.max(...b.map((i) => notes[i].step)), below = Math.max(...b.map((i) => -notes[i].step));
    const up = notes[b[0]].grace || below > above;
    for (const i of b) notes[i].up = up;
  }
  // Horizontal spacing: log of the sounding length, widened so accidentals, dots, flags and syllables fit.
  const sigW = sig.length * 6, X0 = 36 + sigW;
  const space = (o) => (o.grace ? 7 : 9 + 6.5 * Math.log2(1 + o.t / 12));
  const leftExt = (o) => (o.rest ? Math.max(4, o.rg.l + 0.6) : o.accText ? (o.grace ? 8 : 12) : (o.grace ? 3 : 4));
  const rightExt = (o) => (o.rest ? Math.max(4, o.rg.r + 0.6) : (o.val.dot ? 8 : 4) + (o.up && o.val.flags && o.beam === undefined && !o.grace ? 5 : 0));
  const sylW = row.syl.map((s) => _phraseTextWidth(s.t));
  const sylStart = [], sylEnd = [];
  let x = X0 + leftExt(notes[0] || { accText: false });
  let nameEnd = -Infinity;   // the right edge of the last name written (with names on)
  for (const o of notes) {
    const i = o.i;
    if (i > 0) {
      const p = notes[i - 1];
      x = Math.max(x + space(p) + (p.u !== o.u ? 6 : 0), notes[i - 1].x + rightExt(p) + leftExt(o) + 2);
    }
    if (o.nw) x = Math.max(x, nameEnd + 3 + o.nw / 2);   // a name never touches the one before it
    const s = row.syl[o.s];
    if (lyrics && s && s.from === i) {
      const width = sylW[o.s], single = s.from === s.to;
      const startAt = (xx) => (single ? xx - width / 2 : xx - 3.4);
      if (o.s > 0) {
        const need = sylEnd[o.s - 1] + (row.syl[o.s - 1].hyphen ? 10 : 8);
        if (startAt(x) < need) x += need - startAt(x);
      } else if (startAt(x) < 4) x += 4 - startAt(x);
      sylStart[o.s] = startAt(x); sylEnd[o.s] = startAt(x) + width;
    }
    o.x = x;
    if (o.nw) nameEnd = x + o.nw / 2;
  }
  // Word labels (row.words, a reading staff's underlay: [{from, to, w}] — the notes each label spans and its
  // width in staff units): each label is centred under its notes and must clear the label before it, so a
  // label that would collide shifts every note from its first one on (a rigid tail shift keeps everything
  // laid out so far), and the staff widens to the last label's edge. Their centres come back as `words`.
  const words = [];
  let wordEnd = -Infinity;
  if (Array.isArray(row.words)) {
    let prevEnd = 1;
    for (const wd of row.words) {
      const a = notes[wd.from], b = notes[wd.to];
      if (!a || !b) continue;
      const w = Number.isFinite(wd.w) ? wd.w : 0;
      let cx = (a.x + b.x) / 2;
      const need = prevEnd + (words.length ? 6 : 0);
      if (cx - w / 2 < need) {
        const d = need - (cx - w / 2);
        for (let k = wd.from; k < N; k++) notes[k].x += d;
        cx += d;
      }
      words.push(Object.assign({}, wd, { cx, w }));   // the word's own fields (ci, cells…) ride along with its centre
      prevEnd = cx + w / 2;
      wordEnd = Math.max(wordEnd, prevEnd + 2);
    }
  }
  const last = notes[N - 1];
  const W = Math.ceil(Math.max(last.x + rightExt(last), sylEnd[sylEnd.length - 1] || 0, nameEnd, wordEnd) + 8);
  // Stems and beams (y grows downward, 0 is the middle line).
  const sx = (o) => (o.grace ? o.x + (o.up ? 2 : -2) : o.x + (o.up ? 3.1 : -3.1));
  const beamLines = [];
  for (const b of split) {
    const ns = b.map((i) => notes[i]), up = ns[0].up, grace = ns[0].grace;
    const levels = Math.max(...ns.map((o) => o.val.flags));
    const len = grace ? 11 : PHRASE_STEM + 3 * Math.max(0, levels - 2);
    const x0 = sx(ns[0]), x1 = sx(ns[ns.length - 1]);
    let slope = x1 > x0 ? (ns[ns.length - 1].y - ns[0].y) / (x1 - x0) : 0;
    slope = Math.max(-0.12, Math.min(0.12, slope)) * 0.6;
    let y0 = up ? Math.min(...ns.map((o) => o.y - len - slope * (sx(o) - x0)))
                : Math.max(...ns.map((o) => o.y + len - slope * (sx(o) - x0)));
    const at = (xx) => y0 + slope * (xx - x0);
    for (const o of ns) o.tip = at(sx(o));
    beamLines.push({ b, up, grace, x0, x1, at, levels });
  }
  for (const o of notes) if (!o.rest && o.tip === undefined) o.tip = o.y + (o.up ? -1 : 1) * (o.grace ? 11 : PHRASE_STEM + 3 * Math.max(0, o.val.flags - 2));
  // Beam segments: level 1 spans the group; deeper levels span runs of notes that deep, a lone one a stub.
  const segs = [];
  for (const bl of beamLines) {
    const ns = bl.b.map((i) => notes[i]), dir = bl.up ? 1 : -1, thick = bl.grace ? 1.6 : 2.6, gap = bl.grace ? 2.6 : 4;
    for (let lev = 1; lev <= bl.levels; lev++) {
      const off = (lev - 1) * gap * dir;
      for (let k = 0; k < ns.length;) {
        if (ns[k].val.flags < lev) { k++; continue; }
        let m = k;
        while (m + 1 < ns.length && ns[m + 1].val.flags >= lev) m++;
        let xa = sx(ns[k]), xb = sx(ns[m]);
        if (m === k) {   // a stub toward the note it belongs with
          const left = k === ns.length - 1 || (k > 0 && ns[k - 1].val.dot);
          if (left) xa = xb - 5; else xb = xa + 5;
        }
        segs.push({ xa, xb, ya: bl.at(xa) + off, yb: bl.at(xb) + off, thick, up: bl.up });
        k = m + 1;
      }
    }
  }
  // Accents and tenuto lines: above the staff, or above the note where it stands higher.
  for (const o of notes) if (o.marks.length) {
    const top = Math.min(o.y - 4, o.up ? o.tip - 2 : o.y - 4, -15);
    o.markY = top - 4;
  }
  // Ties (away from the stem) and slurs (on the heads' side when every stem in them rises, else above).
  const ties = [];
  notes.forEach((o, i) => {
    if (!o.tie || i + 1 >= N || notes[i + 1].rest) return;
    const q = notes[i + 1], below = o.up;
    ties.push({ xa: o.x + 3.5, xb: q.x - 3.5, y: o.y + (below ? 4 : -4), dir: below ? 1 : -1 });
  });
  // A slur is a cubic whose inner control points share one height: fitted to clear every note inside it by
  // 2, its ends lifted (up to 12) when a note near an end stands higher than the end's own note.
  const fitArc = (ns, xa, xb, ya, yb, side, edge) => {   // side -1 above, +1 below; edge(o) = what to clear
    const fit = (a, b) => {
      let c = side < 0 ? Math.min(a, b) - 4 : Math.max(a, b) + 4;
      for (const o of ns) {
        const u = (o.x - xa) / (xb - xa || 1);
        if (u <= 0.02 || u >= 0.98) continue;
        const need = (edge(o) + side * 2 - (1 - u) ** 3 * a - u ** 3 * b) / (3 * u * (1 - u));
        c = side < 0 ? Math.min(c, need) : Math.max(c, need);
      }
      return c;
    };
    let c = fit(ya, yb);
    const deep = side < 0 ? Math.min(ya, yb) - 16 : Math.max(ya, yb) + 16;
    if (side * (c - deep) > 0) {
      const lift = Math.min(12, Math.abs(c - deep));
      ya += side * lift; yb += side * lift;
      c = fit(ya, yb);
    }
    return { ya, yb, c };
  };
  const slurs = row.slur.map((sl) => {
    const ns = notes.slice(sl.from, sl.to + 1).filter((o) => !o.rest);
    const a = notes[sl.from], b = notes[sl.to];
    if (ns.every((o) => o.up)) {
      const xa = a.x, xb = b.x, f = fitArc(ns, xa, xb, a.y + 5, b.y + 5, 1, (o) => o.y + 4);
      return { from: sl.from, to: sl.to, above: false, xa, xb, ya: f.ya, yb: f.yb, c: f.c, dashed: !!sl.dashed };
    }
    const topOf = (o) => Math.min(o.up ? o.tip - 1 : o.y - 4, o.markY === undefined ? Infinity : o.markY - 3 - 6 * (o.marks.length - 1));
    const xa = a.x + (a.up ? 3 : 0), xb = b.x + (b.up ? 3 : 0);
    const f = fitArc(ns, xa, xb, topOf(a) - 3, topOf(b) - 3, -1, topOf);
    return { from: sl.from, to: sl.to, above: true, xa, xb, ya: f.ya, yb: f.yb, c: f.c, dashed: !!sl.dashed };
  });
  // Triplets: a bare 3 on the beam when the triplet is exactly one beam, else a bracket above.
  const tups = row.tup.map((tp) => {
    const ns = notes.slice(tp.from, tp.to + 1);
    const bi = ns[0].beam;
    const oneBeam = bi !== undefined && ns.every((o) => o.beam === bi) && split[bi].length === ns.length;
    const xm = (ns[0].x + ns[ns.length - 1].x) / 2;
    if (oneBeam) {
      const bl = beamLines[bi];
      return { bracket: false, x: (sx(ns[0]) + sx(ns[ns.length - 1])) / 2, y: bl.at(xm) + (bl.up ? -4 : 11) };
    }
    let top = Math.min(...ns.map((o) => (o.rest ? o.rg.top - 2 : Math.min(o.y - 4, o.up ? o.tip : o.y - 4,
      o.markY === undefined ? Infinity : o.markY - 3 - 6 * (o.marks.length - 1)))), -12);
    for (const sl of slurs) if (sl.above && sl.from <= tp.to && sl.to >= tp.from) top = Math.min(top, sl.c + 1);
    return { bracket: true, xa: ns[0].x - 4, xb: ns[ns.length - 1].x + 4, x: xm, y: top - 6 };
  });
  // Vertical extent: the mark bars ride above everything, the syllables below.
  let top = -12, bottom = 12;
  const see = (y) => { top = Math.min(top, y); bottom = Math.max(bottom, y); };
  for (const o of notes) {
    if (o.rest) { see(o.rg.top); see(o.rg.bottom); continue; }
    see(o.y - 4); see(o.y + 4); see(o.tip);
    if (o.markY !== undefined) see(o.markY - 3);
  }
  for (const s of segs) { see(s.ya + (s.up ? 0 : s.thick)); see(s.yb + (s.up ? 0 : s.thick)); }
  for (const tp of tups) { see(tp.y - 8); see(tp.y + 2); }
  for (const sl of slurs) { see(sl.ya); see(sl.yb); see(sl.c); }
  for (const ti of ties) see(ti.y + ti.dir * 4);
  const barY = Math.min(-26, top - 9);
  // With names on they take the line under the staff, and the syllables move down a line beneath them.
  const nameY = Math.max(22, bottom + 10);
  const lyricY = !lyrics ? (notes.some((o) => o.nw) ? nameY + 2 : Math.max(20, bottom + 2))
    : notes.some((o) => o.nw) ? nameY + 11 : Math.max(22, bottom + 11);
  const out = { notes, segs, tups, ties, slurs, W, X0, sig, barY, nameY, lyricY, sylStart, sylEnd, sylW,
    units: row.units.map((u) => ({ k: u.k, xa: notes[u.from].x, xb: notes[u.to].x })) };
  if (Array.isArray(row.words)) out.words = words;
  return out;
}

// The row drawn: an <svg class="tu-pstaff"> at SCALE px per unit. opts: {key, shift, low, ariaLabel,
// famOf(markKey, unitIndex, rowUnit) -> the family whose colour its bar takes, names (optional, layoutPhraseStaff's),
// layout (a precomputed layoutPhraseStaff result), lyrics:false (no syllable text), accidentals}; without an
// ariaLabel the SVG is hidden from assistive tech (its host names it). Every note is a <g class="tu-pn" data-i
// data-u> (holding its name, <text class="tu-nn">, when names are on), every syllable a <text class="tu-ps"
// data-s data-u>, every bar a <rect class="tu-pbar" data-u>: the tune lights notes by data-i, and a mark chip
// lights its notes, bar and syllables by data-u.
function renderPhraseStaff(row, opts) {
  const L = opts.layout || layoutPhraseStaff(row, opts.key, opts.shift, opts.names, opts);   // opts.layout: the caller already laid the row out (to wrap or place words)
  const SCALE = PHRASE_SCALE, pad = 3;
  const MID = -L.barY + pad + 2, H = Math.ceil(Math.max(MID + L.lyricY + 4, opts.low ? MID + 30 : 0));   // room for the 8
  const Y = (y) => Math.round((MID + y) * 100) / 100;
  const svg = _svgEl('svg', { viewBox: '0 0 ' + L.W + ' ' + H, class: 'tu-pstaff' });
  svg.style.inlineSize = Math.round(L.W * SCALE) + 'px';
  svg.style.blockSize = Math.round(H * SCALE) + 'px';
  if (opts.ariaLabel) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', opts.ariaLabel); }
  else svg.setAttribute('aria-hidden', 'true');
  const deco = _svgEl('g', { 'aria-hidden': 'true' });
  svg.appendChild(deco);
  staffLines(deco, L.W, MID);
  staffClef(deco, MID, !!opts.low);
  staffKeySig(deco, L.sig, MID, PHRASE_STEP);
  // Mark bars, one per mark, split halfway between the marks' notes, and a faint divider there.
  L.units.forEach((u, ui) => {
    const prev = L.units[ui - 1], next = L.units[ui + 1];
    const xa = prev ? (prev.xb + u.xa) / 2 + 1.5 : u.xa - 6, xb = next ? (u.xb + next.xa) / 2 - 1.5 : u.xb + 6;
    const fam = opts.famOf ? opts.famOf(u.k, ui, row.units[ui]) : '';   // the row's unit rides along (a reading's unit carries its word's family)
    deco.appendChild(_svgEl('rect', { class: 'tu-pbar' + (fam ? ' fam-' + fam : ''), 'data-u': ui, x: Math.round(xa * 100) / 100,
      y: Y(L.barY), width: Math.round((xb - xa) * 100) / 100, height: 3.5, rx: 1.5 }));
    if (next) {
      const xd = Math.round(((u.xb + next.xa) / 2) * 100) / 100;
      deco.appendChild(_svgEl('line', { class: 'tu-pdiv', x1: xd, y1: Y(-15), x2: xd, y2: Y(15), stroke: 'currentColor',
        'stroke-width': 0.7, 'stroke-dasharray': '2 2', opacity: 0.35 }));
    }
  });
  // Beams under the notes' groups, so a sounding head's colour sits on top.
  for (const s of L.segs) {
    const t = s.up ? s.thick : -s.thick;
    deco.appendChild(_svgEl('path', { d: 'M ' + s.xa + ' ' + Y(s.ya) + ' L ' + s.xb + ' ' + Y(s.yb) + ' L ' + s.xb + ' ' + Y(s.yb + t) +
      ' L ' + s.xa + ' ' + Y(s.ya + t) + ' Z', fill: 'currentColor' }));
  }
  for (const o of L.notes) {
    const g = _svgEl('g', { class: 'tu-pn' + (o.rest ? ' is-rest' : ''), 'data-i': o.i, 'data-u': o.u });
    const cx = Math.round(o.x * 100) / 100;
    if (o.rest) {
      const rg = o.rg, X = (v) => Math.round((cx + v) * 100) / 100;
      for (const k of rg.knobs) g.appendChild(_svgEl('circle', { cx: X(k.x), cy: Y(k.y), r: 1.5, fill: 'currentColor' }));
      for (const s of rg.strokes) g.appendChild(_svgEl('path', { d: s.d.map(([c, ...v]) => c + ' ' + v.map((n, j) => (j % 2 ? Y(n) : X(n))).join(' ')).join(' '),
        fill: 'none', stroke: 'currentColor', 'stroke-width': s.w, 'stroke-linecap': 'round' }));
      if (rg.block) g.appendChild(_svgEl('rect', { x: X(rg.block.x), y: Y(rg.block.y), width: rg.block.w, height: rg.block.h, fill: 'currentColor' }));
      if (rg.dot) g.appendChild(_svgEl('circle', { cx: X(rg.dot.x), cy: Y(rg.dot.y), r: 1.15, fill: 'currentColor' }));
      svg.appendChild(g);
      continue;
    }
    const cy = Y(o.y);
    staffLedgers(g, cx, o.step, MID, PHRASE_STEP, o.grace ? 4.5 : 6);
    if (o.accText) {
      const a = _svgEl('text', { x: cx - (o.grace ? 7 : 9.5), y: cy + 3, 'font-size': o.grace ? 7 : 9, fill: 'currentColor' });
      a.textContent = o.accText;
      g.appendChild(a);
    }
    if (o.grace) staffHead(g, cx, cy, false, 2.2, 1.6);
    else staffHead(g, cx, cy, !!o.val.open);
    const stx = Math.round((o.grace ? o.x + (o.up ? 2 : -2) : o.x + (o.up ? 3.1 : -3.1)) * 100) / 100;
    g.appendChild(_svgEl('line', { x1: stx, y1: cy + (o.up ? -1 : 1), x2: stx, y2: Y(o.tip), stroke: 'currentColor', 'stroke-width': o.grace ? 0.8 : 1.1 }));
    if (o.beam === undefined && o.val.flags) {   // flags off the stem tip
      const dir = o.up ? 1 : -1, k = o.grace ? 0.62 : 1;
      for (let f = 0; f < o.val.flags; f++) {
        const fy = Y(o.tip) + f * 4 * dir * k;
        g.appendChild(_svgEl('path', { d: 'M ' + stx + ' ' + fy + ' q ' + 4.5 * k + ' ' + 3 * dir * k + ' ' + 3 * k + ' ' + 8.5 * dir * k,
          fill: 'none', stroke: 'currentColor', 'stroke-width': o.grace ? 0.8 : 1.1 }));
      }
      if (o.grace) g.appendChild(_svgEl('line', { x1: cx - 1, y1: Y(o.tip) + 8, x2: cx + 5, y2: Y(o.tip) + 3, stroke: 'currentColor', 'stroke-width': 0.8 }));
    }
    if (o.val.dot) g.appendChild(_svgEl('circle', { cx: cx + 6, cy: cy - (o.step % 2 === 0 ? 3 : 0) * 1, r: 1.15, fill: 'currentColor' }));
    let my = o.markY;
    for (const m of o.marks) {
      if (m === '>') g.appendChild(_svgEl('path', { d: 'M ' + (cx - 3.2) + ' ' + Y(my - 2.2) + ' L ' + (cx + 3.2) + ' ' + Y(my) + ' L ' + (cx - 3.2) + ' ' + Y(my + 2.2),
        fill: 'none', stroke: 'currentColor', 'stroke-width': 0.9 }));
      else if (m === '-') g.appendChild(_svgEl('line', { x1: cx - 3.2, y1: Y(my), x2: cx + 3.2, y2: Y(my), stroke: 'currentColor', 'stroke-width': 1.1 }));
      my -= 6;
    }
    if (o.name) g.appendChild(noteNameEl(o.name, cx, Y(L.nameY), o.grace ? PHRASE_GRACE_NAME_SIZE : PHRASE_NAME_SIZE));
    svg.appendChild(g);
  }
  const over = _svgEl('g', { 'aria-hidden': 'true' });
  for (const ti of L.ties) {
    const xm = (ti.xa + ti.xb) / 2, y = Y(ti.y);
    over.appendChild(_svgEl('path', { d: 'M ' + ti.xa + ' ' + y + ' Q ' + xm + ' ' + (y + ti.dir * 5) + ' ' + ti.xb + ' ' + y, fill: 'none', stroke: 'currentColor', 'stroke-width': 0.9 }));
  }
  for (const sl of L.slurs) {
    const dx = (sl.xb - sl.xa) / 4;
    const attrs = { d: 'M ' + sl.xa + ' ' + Y(sl.ya) + ' C ' + (sl.xa + dx) + ' ' + Y(sl.c) + ' ' + (sl.xb - dx) + ' ' + Y(sl.c) + ' ' + sl.xb + ' ' + Y(sl.yb),
      fill: 'none', stroke: 'currentColor', 'stroke-width': 0.9 };
    if (sl.dashed) attrs['stroke-dasharray'] = '2 2';
    over.appendChild(_svgEl('path', attrs));
  }
  for (const tp of L.tups) {
    if (tp.bracket) {
      const y = Y(tp.y), gapL = tp.x - 4, gapR = tp.x + 4;
      over.appendChild(_svgEl('path', { d: 'M ' + tp.xa + ' ' + (y + 3) + ' L ' + tp.xa + ' ' + y + ' L ' + gapL + ' ' + y + ' M ' + gapR + ' ' + y + ' L ' + tp.xb + ' ' + y + ' L ' + tp.xb + ' ' + (y + 3),
        fill: 'none', stroke: 'currentColor', 'stroke-width': 0.8 }));
    }
    const n3 = _svgEl('text', { x: Math.round(tp.x * 100) / 100, y: Y(tp.y) + 3, 'font-size': 8, 'font-style': 'italic', 'text-anchor': 'middle', fill: 'currentColor' });
    n3.textContent = '3';   // the triplet figure of the notation, not a UI string — i18n-ignore
    over.appendChild(n3);
  }
  svg.appendChild(over);
  // Syllables, as the chart prints them (transliterations — i18n-ignore), with their hyphens. Not with
  // opts.lyrics === false: a reading staff lays its own words under the SVG.
  if (opts.lyrics !== false) row.syl.forEach((s, si) => {
    const single = s.from === s.to, xs = L.notes[s.from].x;
    const txt = _svgEl('text', { class: 'tu-ps', 'data-s': si, 'data-u': s.unit, x: Math.round((single ? xs : xs - 3.4) * 100) / 100, y: Y(L.lyricY),
      'font-size': PHRASE_SYL_SIZE, 'text-anchor': single ? 'middle' : 'start', fill: 'currentColor' });
    txt.textContent = s.t;
    svg.appendChild(txt);
    if (s.hyphen && si + 1 < row.syl.length) {
      const a = L.sylEnd[si], b = L.sylStart[si + 1], xm = (a + b) / 2, half = Math.min(2.5, Math.max(1.2, (b - a) / 2 - 1.5));
      svg.appendChild(_svgEl('line', { class: 'tu-ph', x1: Math.round((xm - half) * 100) / 100, y1: Y(L.lyricY - 3), x2: Math.round((xm + half) * 100) / 100, y2: Y(L.lyricY - 3),
        stroke: 'currentColor', 'stroke-width': 0.8, 'aria-hidden': 'true' }));
    }
  });
  return svg;
}
// Phrase file validation: hand-transcribed data is parsed like imported data and checked row by row —
// a row that does not hold together is left out rather than drawn wrong.
function _validPhraseRow(r) {
  if (!r || typeof r.n !== 'string' || typeof r.he !== 'string' || !Array.isArray(r.tags) || !Array.isArray(r.notes) || !r.notes.length) return false;
  const N = r.notes.length;
  const span = (x) => !!x && Number.isInteger(x.from) && Number.isInteger(x.to) && x.from >= 0 && x.from <= x.to && x.to < N;
  if (!r.notes.every((n) => n && typeof n.v === 'string' && PHRASE_VALUE[n.v] && Number.isFinite(n.t) && n.t >= 0
      && (n.r || (Number.isFinite(n.p) && Math.abs(n.p) <= 36)) && (!n.a || Array.isArray(n.a)))) return false;
  if (!Array.isArray(r.units) || !r.units.length || !r.units.every((u) => span(u) && typeof u.k === 'string')) return false;
  if (!Array.isArray(r.syl) || !r.syl.every((s) => span(s) && typeof s.t === 'string')) return false;
  return ['tup', 'slur'].every((k) => Array.isArray(r[k]) && r[k].every(span));
}
function _phraseSetsFrom(j) {
  if (!j || j.v !== 1 || j.tpq !== 48 || !j.melodies || typeof j.melodies !== 'object') return null;
  const out = {};
  for (const m of ['torah', 'highholiday']) {
    const s = j.melodies[m];
    const rows = s && Number.isInteger(KEY_SHARPS[s.key]) && Array.isArray(s.rows) ? s.rows.filter(_validPhraseRow) : [];
    out[m] = rows.length ? { key: s.key, rows } : null;
  }
  return out.torah || out.highholiday ? out : null;
}

/* ══════════════════════════════════════════════════════
   READING STAFF — a verse of real Torah text on the staff, figure by figure
   (the Torah Trainer's Trope staff layout; docs/tropepatterns.md → G is the
   design, docs/reference/torah-and-trope.md → Trope staff the contract).
   tropeUnitsOfVerse reads a verse's marks the way the Trainer splits its words;
   tropeContextsOf indexes every printed figure by the marks around it;
   tropeChooseFigures picks a figure per mark from those contexts;
   tropeBuildReadingRow stitches the picked figures into one row in the phrase
   file's shape (with `words`, the underlay); tropeSplitSystems wraps that row
   into staff systems that fit a width (with opts.namesOf, at the width each is
   drawn at with its note names). All pure: no DOM, no settings.
   ══════════════════════════════════════════════════════ */
// The connecting ("servant") marks, whose figure depends on the mark they lead into (the builder's list).
const TROPE_CONJUNCTIVE = new Set(['munach', 'mahpach', 'mercha', 'mercha_kefula', 'darga', 'kadma', 'telisha_ketana', 'yerach_ben_yomo']);
// The row each Learn card draws its figure from (docs/tropepatterns.md → A): the last resort when the chart
// prints no figure of a mark in a verse's context, so a word is never left without notes.
const TROPE_LEARN_ROW = {
  torah: { mercha: '1', tipcha: '4', munach: '2', etnachta: '4', sof_pasuk: '8', mahpach: '11', pashta: '13', yetiv: '33',
    zakef_katon: '13', zakef_gadol: '31', zarka: '37', segol: '37', shalshelet: '38', revia: '19', darga: '21', tevir: '22',
    kadma: '15', geresh: '16', gershayim: '20', telisha_ketana: '29', telisha_gedola: '28', pazer: '30', mercha_kefula: '39',
    karnei_parah: '40', yerach_ben_yomo: '40', munach_legarmeh: '17' },
  highholiday: { mercha: '1', tipcha: '4', munach: '2', etnachta: '4', sof_pasuk: '8', mahpach: '11', pashta: '10', yetiv: '24',
    zakef_katon: '10', zakef_gadol: '25', zarka: '29', segol: '29', revia: '16', darga: '13', tevir: '13', kadma: '20',
    geresh: '21', gershayim: '22', telisha_ketana: '18', telisha_gedola: '17', pazer: '19', munach_legarmeh: '15' },
};
const TROPE_MARK_RE = /[֑-֯]/g;   // the te'amim block; U+05BD (meteg / siluk) is deliberately outside it
// A verse's marks, word by word, on the Torah Trainer's own split (whitespace AND maqaf, one piece per
// Hebrew-bearing token — PocketTorah times each piece), so piece i here is the i-th .tt-word the page emits.
// Returns {pieces:[{ti, tok, keys}], cells:[{pieces:[pi…], keys:[{k, pi}], line}], units:[{k, ci, pi, withinWord}]}.
// A cell is a sung word: a maqaf joins the next piece to it; a ׀ token after it sets `line` (a munach before
// it is then munach legarmeh — a paseq prints the same and cannot be told apart in the page's text); a
// repeated mark counts once; pashta written twice (its second glyph is kadma's) is one pashta; the last cell
// takes sof_pasuk (siluk shares meteg's codepoint); a cell with no mark of its own joins the cell after it,
// as its pieces are chanted (the pieces keep their own spans, so the page's word count is untouched).
function tropeUnitsOfVerse(text) {
  const toks = String(text || '').split(/(\s+|־)/);
  const pieces = [], cells = [];
  let cell = null, joinNext = false;
  for (let ti = 0; ti < toks.length; ti++) {
    const tok = toks[ti];
    if (!tok || /^\s+$/.test(tok)) continue;
    if (tok === '־') { joinNext = !!cell; continue; }
    if (!/[א-ת]/.test(tok)) { if (tok.includes('׀') && cell) cell.line = true; continue; }
    const keys = [];
    for (const ch of tok.match(TROPE_MARK_RE) || []) { const k = TROPE_CHAR_TO_KEY[ch]; if (k && !keys.includes(k)) keys.push(k); }
    const pi = pieces.length;
    pieces.push({ ti, tok, keys });
    if (joinNext && cell) cell.pieces.push(pi);
    else { cell = { pieces: [pi], line: false }; cells.push(cell); }
    joinNext = false;
  }
  cells.forEach((c, ci) => {
    let keys = [];
    for (const pi of c.pieces) for (const k of pieces[pi].keys) keys.push({ k, pi });
    if (keys.some((x) => x.k === 'kadma') && keys.some((x) => x.k === 'pashta')) keys = keys.filter((x) => x.k !== 'kadma');
    if (ci === cells.length - 1) keys.push({ k: 'sof_pasuk', pi: c.pieces[c.pieces.length - 1] });
    if (c.line && keys.length && keys[keys.length - 1].k === 'munach') keys[keys.length - 1] = { k: 'munach_legarmeh', pi: keys[keys.length - 1].pi };
    c.keys = keys;
  });
  for (let ci = cells.length - 2; ci >= 0; ci--) if (!cells[ci].keys.length) {   // an unmarked word sings with the next
    cells[ci + 1].pieces.unshift(...cells[ci].pieces);
    cells.splice(ci, 1);
  }
  const units = [];
  cells.forEach((c, ci) => c.keys.forEach((x, j) => units.push({ k: x.k, ci, pi: x.pi, withinWord: j > 0 })));
  return { pieces, cells, units };
}
// Every printed figure of a melody indexed by its mark: for each row unit, the marks printed before and
// after it (^ and $ at the row's edges), the row's marks, and whether the row is an [aliyah-end] closing.
function tropeContextsOf(set) {
  const ctx = new Map();
  if (!set || !Array.isArray(set.rows)) return ctx;
  for (const row of set.rows) {
    const ks = row.units.map((u) => u.k), end = row.tags.includes('aliyah-end');
    ks.forEach((k, ui) => {
      if (!ctx.has(k)) ctx.set(k, []);
      ctx.get(k).push({ n: row.n, ui, prev: ui > 0 ? ks[ui - 1] : '^', next: ui + 1 < ks.length ? ks[ui + 1] : '$', end, keys: ks });
    });
  }
  return ctx;
}
// One figure per unit of a verse (docs/tropepatterns.md → G): a connecting mark takes the figure printed before
// the very mark that follows it, else before the pausing mark its chain leads to; a pausing mark the figure
// printed between its neighbours; then the Learn card's row; then the mark's first figure. With aliyahEnd, the
// longest [aliyah-end] row whose marks close the verse takes those last units. A mark the melody's chart lacks
// is looked up in fallbackCtx (the year-round chart) — picks say which set they came from.
// Returns picks[i] = {set, n, ui} or null.
function tropeChooseFigures(units, ctx, opts = {}) {
  const ks = units.map((u) => u.k), N = ks.length, picks = new Array(N).fill(null);
  const melody = opts.melody || 'torah', fbMelody = opts.fallbackMelody || 'torah';
  let endFrom = N;
  if (opts.aliyahEnd && ctx) {
    let best = null;
    for (const list of ctx.values()) for (const c of list) {
      if (!c.end || c.ui !== 0 || c.keys.length > N) continue;
      if (c.keys.every((x, j) => x === ks[N - c.keys.length + j]) && (!best || c.keys.length > best.keys.length)) best = c;
    }
    if (best) {
      endFrom = N - best.keys.length;
      best.keys.forEach((x, j) => { picks[endFrom + j] = { set: melody, n: best.n, ui: j }; });
    }
  }
  const chainOf = (i) => { for (let j = i + 1; j < N; j++) if (!TROPE_CONJUNCTIVE.has(ks[j])) return ks[j]; return '$'; };
  const rowNum = (n) => parseInt(n, 10) || 0;
  const pickFrom = (list, i, learn) => {
    const k = ks[i], prevK = i > 0 ? ks[i - 1] : '^', nextK = i + 1 < N ? ks[i + 1] : '$', chainK = chainOf(i);
    let best = null, bs = -1;
    for (const c of list) {
      if (c.end) continue;
      let s = 0;
      if (TROPE_CONJUNCTIVE.has(k)) { if (c.next === nextK) s += 40; else if (c.next === chainK) s += 20; if (c.prev === prevK) s += 4; }
      else { if (c.next === nextK) s += 20; if (c.prev === prevK) s += 10; }
      if (learn && c.n === learn) s += 2;
      if (s > bs || (s === bs && rowNum(c.n) < rowNum(best.n))) { best = c; bs = s; }
    }
    return best ? { n: best.n, ui: best.ui } : null;
  };
  for (let i = 0; i < endFrom; i++) {
    const k = ks[i];
    let p = ctx && ctx.has(k) ? pickFrom(ctx.get(k), i, (TROPE_LEARN_ROW[melody] || {})[k]) : null, set = melody;
    if (!p && opts.fallbackCtx && opts.fallbackCtx.has(k)) { p = pickFrom(opts.fallbackCtx.get(k), i, (TROPE_LEARN_ROW[fbMelody] || {})[k]); set = fbMelody; }
    if (p) picks[i] = { set, n: p.n, ui: p.ui };
  }
  return picks;
}
// The picked figures stitched into one row in the phrase file's shape — notes, each figure's own syllables
// (they carry the beaming), units (with the verse's ci/pi/fam/twi), the triplets and slurs that lie inside
// one figure (one cut at a figure's edge is drawn by value), and `words`: one per cell, spanning its units'
// notes, `w` left 0 for the caller to measure. A cell none of whose units got a figure has no notes: its
// pieces join the word before it (the first cell, the word after), so every piece is still on the page.
// sets: {torah, highholiday} phrase sets (a pick names its set).
function tropeBuildReadingRow(units, picks, cells, sets, opts = {}) {
  const notes = [], syl = [], outUnits = [], tup = [], slur = [];
  const byN = {};
  const rowOf = (set, n) => {
    const s = sets && sets[set];
    if (!s) return null;
    if (!byN[set]) byN[set] = new Map(s.rows.map((r) => [r.n, r]));
    return byN[set].get(n) || null;
  };
  const cellSpan = new Map();
  units.forEach((u, i) => {
    const p = picks[i], row = p && rowOf(p.set, p.n);
    const su = row && row.units[p.ui];
    if (!su) return;
    const off = notes.length - su.from;
    for (let j = su.from; j <= su.to; j++) {
      const n = Object.assign({}, row.notes[j]);
      if (j === su.to) delete n.tie;
      notes.push(n);
    }
    const ui = outUnits.length;
    for (const s of row.syl) if (s.unit === p.ui) syl.push({ t: s.t, hyphen: !!s.hyphen, unit: ui, from: s.from + off, to: s.to + off });
    for (const t of row.tup) if (t.from >= su.from && t.to <= su.to) tup.push({ from: t.from + off, to: t.to + off });
    for (const sl of row.slur) if (sl.from >= su.from && sl.to <= su.to) slur.push({ from: sl.from + off, to: sl.to + off, dashed: !!sl.dashed });
    const from = su.from + off, to = su.to + off;
    outUnits.push({ k: u.k, from, to, ci: u.ci, pi: u.pi, fam: u.fam || '', twi: u.twi });
    const cs = cellSpan.get(u.ci);
    if (cs) cs.to = to; else cellSpan.set(u.ci, { from, to });
  });
  const words = [];
  let orphans = [];
  cells.forEach((c, ci) => {
    const cs = cellSpan.get(ci);
    if (!cs) { if (words.length) words[words.length - 1].cells.push(ci); else orphans.push(ci); return; }
    words.push({ ci, cells: [...orphans, ci], from: cs.from, to: cs.to, w: 0 });
    orphans = [];
  });
  if (orphans.length && words.length) words[0].cells.push(...orphans);
  return { n: String(opts.n || ''), he: '', tags: [], notes, syl, units: outUnits, tup, slur, words };
}
// The rows of a reading row's words a..b (inclusive), re-indexed from 0; a tie into the cut is dropped.
function tropeSubRow(row, a, b) {
  const wa = row.words[a], wb = row.words[b];
  const from = wa.from, to = wb.to, N = to - from + 1;
  const inside = (x) => x.from >= from && x.to <= to;
  const shift = (x) => Object.assign({}, x, { from: x.from - from, to: x.to - from });
  const notes = row.notes.slice(from, to + 1).map((n, i) => (i === N - 1 && n.tie ? Object.assign({}, n, { tie: false }) : n));
  const units = row.units.filter(inside).map(shift);
  const unitIndex = new Map(row.units.map((u, i) => [i, units.findIndex((v) => v.from === u.from - from && v.k === u.k)]));
  const syl = row.syl.filter(inside).map((s) => Object.assign(shift(s), { unit: unitIndex.get(s.unit) }));
  return { n: row.n, he: row.he, tags: row.tags, notes, syl, units, tup: row.tup.filter(inside).map(shift), slur: row.slur.filter(inside).map(shift),
    words: row.words.slice(a, b + 1).map((w) => Object.assign({}, w, { from: w.from - from, to: w.to - from })) };
}
// The reading row wrapped into systems no wider than maxW (staff units), breaking only between words: each
// word's width is measured on its own once, words are packed by those widths, and each system is then laid
// out for real, shedding its last word while it overflows (a system always keeps at least one word).
// opts.namesOf(subRow) (optional) returns the note names index-aligned with that sub-row's notes, so a system
// is wrapped at the width it is drawn at when names widen it — a callback, because tropeSubRow re-indexes the
// notes from 0, and a name depends only on the note's pitch, the key and the mode. Without it the names are
// null, exactly as before.
// Returns [{row}] in order; the caller lays each out (or reads its layout) and draws it.
function tropeSplitSystems(row, key, shift, maxW, opts = {}) {
  const words = row.words || [];
  if (!words.length) return [{ row }];
  const lay = (r) => layoutPhraseStaff(r, key, shift, opts.namesOf ? opts.namesOf(r) : null, opts);
  const single = words.map((w, i) => { const L = lay(tropeSubRow(row, i, i)); return L.W - L.X0; });
  const X0 = lay(tropeSubRow(row, 0, 0)).X0;
  const systems = [];
  let a = 0;
  while (a < words.length) {
    let b = a, x = X0 + single[a];
    while (b + 1 < words.length && x + 6 + single[b + 1] <= maxW) { b++; x += 6 + single[b]; }
    while (b > a && lay(tropeSubRow(row, a, b)).W > maxW) b--;
    systems.push({ row: tropeSubRow(row, a, b) });
    a = b + 1;
  }
  return systems;
}
