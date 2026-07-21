/* IvritSuite Advanced TTS — rule-based phonemizer: pointed Modern Hebrew → IPA.
 *
 * Contract: input is a fully pointed (nikud) Modern Hebrew string — a single word or a
 * short phrase; output is an IPA string containing ONLY symbols present in the Kokoro
 * Hebrew model's config.json vocab. The vocab is the source of truth: call setVocab()
 * with the model's vocab object once it is loaded; every emitted character is validated
 * against it and phonemize() THROWS a descriptive error on anything out-of-vocab —
 * characters are never silently dropped.
 *
 * Symbol inventory follows Phonikud G2P (CC BY 4.0, github.com/thewh1teagle/phonikud;
 * see CREDITS.md §5): a b d e f h i j k l m n o p s t u v z ɡ ʁ ʃ ʒ ʔ χ + stress ˈ.
 * Affricates are emitted as two characters (צ → "ts", ג׳ → "dʒ" → d+ʒ, צ׳ → t+ʃ), and
 * resh is ʁ / het+khaf are χ — with an adaptive substitution step (ʁ↔r, χ↔x, ɡ↔g) in
 * case the loaded vocab uses the other symbol of a pair.
 *
 * Documented heuristics (Modern Israeli Hebrew, no gemination):
 * - Shva na (→ e) vs nach (silent): word-initial shva = na; the second of two
 *   consecutive shvas = na; shva under a mid-word dagesh (dagesh chazak) = na;
 *   word-final shva = nach; otherwise nach. Per-call overrides via
 *   opts.shvaOverrides = { clusterIndex: 'na' | 'nach' }.
 * - Stress: default milra (final syllable) — ˈ is inserted immediately before the
 *   stressed syllable's vowel (Phonikud/renikud style: "ʃalˈom"). opts.stress:
 *   'milra' (default) | 'milel' (penultimate) | 'none'. Furtive patah is never stressed.
 * - Matres lectionis: וֹ → o, וּ → u (vav+dagesh with no other vowel = shuruk),
 *   hiriq + bare yod → i (yod silent), final ה without mapiq → silent.
 * - א is silent when vowel-less (including word-final); ה is silent word-finally
 *   unless it carries mapiq (dagesh) — mapiq he → h; furtive patah under final
 *   ח / ע / הּ is emitted BEFORE the consonant (רוּחַ → ʁˈuaχ).
 * - Dagesh only changes pronunciation for ב/כ/פ; dagesh chazak is identity except
 *   for the shva rule above. Sofit letters map like their medial forms.
 * - Qamats is always /a/ unless the explicit qamats-qatan codepoint (U+05C7) is used
 *   (unpointed qamats-qatan words like כָּל → "kol" are a known, accepted approximation).
 *
 * Runs in the page, in the worker (importScripts), and in Node (module.exports) —
 * Node is how the full-dictionary validation sweep runs offline.
 */
(function (root) {
  'use strict';

  // ── Unicode points ──────────────────────────────────────────────────────────
  var SHVA = 'ְ', HATAF_SEGOL = 'ֱ', HATAF_PATAH = 'ֲ', HATAF_QAMATS = 'ֳ';
  var HIRIQ = 'ִ', TSERE = 'ֵ', SEGOL = 'ֶ', PATAH = 'ַ', QAMATS = 'ָ';
  var HOLAM = 'ֹ', HOLAM_HASER = 'ֺ', QUBUTS = 'ֻ', DAGESH = 'ּ';
  var METEG = 'ֽ', MAQAF = '־', RAFE = 'ֿ', PASEQ = '׀';
  var SHIN_DOT = 'ׁ', SIN_DOT = 'ׂ', SOF_PASUQ = '׃', QAMATS_QATAN = 'ׇ';
  var GERESH = '׳', GERSHAYIM = '״';

  var VOWEL_MARKS = {}; // mark → IPA vowel ('' = shva, resolved by rule)
  VOWEL_MARKS[SHVA] = '';
  VOWEL_MARKS[HATAF_SEGOL] = 'e';
  VOWEL_MARKS[HATAF_PATAH] = 'a';
  VOWEL_MARKS[HATAF_QAMATS] = 'o';
  VOWEL_MARKS[HIRIQ] = 'i';
  VOWEL_MARKS[TSERE] = 'e';
  VOWEL_MARKS[SEGOL] = 'e';
  VOWEL_MARKS[PATAH] = 'a';
  VOWEL_MARKS[QAMATS] = 'a';
  VOWEL_MARKS[QAMATS_QATAN] = 'o';
  VOWEL_MARKS[HOLAM] = 'o';
  VOWEL_MARKS[HOLAM_HASER] = 'o';
  VOWEL_MARKS[QUBUTS] = 'u';

  // Base consonants (no dagesh). Sofit forms map like their medial forms.
  var CONSONANTS = {
    'א': 'ʔ', 'ב': 'v', 'ג': 'ɡ', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
    'ח': 'χ', 'ט': 't', 'י': 'j', 'כ': 'χ', 'ך': 'χ', 'ל': 'l',
    'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'ʔ', 'פ': 'f',
    'ף': 'f', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'ʁ', 'ש': 'ʃ', 'ת': 't'
  };
  var DAGESH_KAL = { 'ב': 'b', 'כ': 'k', 'ך': 'k', 'פ': 'p', 'ף': 'p' };
  // Loanword geresh digraphs (affricates emitted as two chars, per Phonikud).
  var GERESH_MAP = { 'ג': 'dʒ', 'ז': 'ʒ', 'צ': 'tʃ', 'ץ': 'tʃ', 'ת': 't', 'ד': 'd' };

  var STRESS = 'ˈ';
  // Sentence punctuation passes through as prosody cues — all of these are ids in the
  // base Kokoro vocab. Anything else non-Hebrew is a hard error (never dropped).
  var PASS_PUNCT = ';:,.!?—…"()';
  // Invisible bidi/formatting controls stripped before tokenizing (not content):
  // ZWSP..RLM, bidi embeds/overrides, word-joiner..isolates, CGJ, BOM.
  var STRIP_RE = new RegExp('[\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2069\\u034F\\uFEFF]', 'g');
  // Phonikud inventory + space; used for validation until the model vocab is loaded.
  var DEFAULT_SYMBOLS = 'abdefhijklmnopstuvwzɡʁʃʒʔˈχ ' + PASS_PUNCT;
  // Adaptive pairs: if the loaded vocab is missing one side but has the other, swap.
  var SUB_PAIRS = [['ɡ', 'g'], ['ʁ', 'r'], ['χ', 'x'], ['ʃ', 'S']];

  var _vocab = null;      // { char: id } from the model's config.json — source of truth
  var _subs = {};         // adaptive substitutions computed from the vocab

  function isHebrewLetter(ch) { var c = ch.charCodeAt(0); return c >= 0x05D0 && c <= 0x05EA; }
  function isMark(ch) { var c = ch.charCodeAt(0); return (c >= 0x0591 && c <= 0x05C7 && c !== 0x05BE && c !== 0x05C0 && c !== 0x05C3 && c !== 0x05C6); }
  function isCantillation(ch) { var c = ch.charCodeAt(0); return c >= 0x0591 && c <= 0x05AF; }

  function PhonemizeError(message, input, badChars) {
    var e = new Error(message);
    e.name = 'PhonemizeError';
    e.input = input;
    e.badChars = badChars || [];
    return e;
  }

  // ── Tokenize a word into letter clusters ───────────────────────────────────
  // cluster = { letter, dagesh, shinDot, sinDot, geresh, vowels: [mark, ...] }
  function tokenizeWord(word) {
    var clusters = [];
    var cur = null;
    var pendingMarks = []; // marks seen before any letter (orphans attach forward)
    for (var i = 0; i < word.length; i++) {
      var ch = word[i];
      if (isHebrewLetter(ch)) {
        cur = { letter: ch, dagesh: false, shinDot: false, sinDot: false, geresh: false, vowels: [] };
        clusters.push(cur);
        while (pendingMarks.length) applyMark(cur, pendingMarks.shift());
      } else if (isMark(ch)) {
        if (isCantillation(ch) || ch === METEG || ch === RAFE) continue; // ignored
        if (cur) applyMark(cur, ch);
        else pendingMarks.push(ch); // e.g. dictionary affix entries like "־ְךָ"
      } else if (ch === GERESH || ch === '‘' || ch === '’' || ch === "'") {
        if (cur) cur.geresh = true;
      } else if (ch === GERSHAYIM || ch === MAQAF || ch === PASEQ || ch === SOF_PASUQ) {
        // separators/abbreviation marks — no sound
        cur = null;
      } else {
        throw PhonemizeError(
          'Unsupported character ' + JSON.stringify(ch) + ' (U+' +
          ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0') +
          ') in Hebrew word "' + word + '" — the phonemizer accepts pointed Hebrew only.',
          word, [ch]);
      }
    }
    return clusters;
  }

  function applyMark(cluster, mark) {
    if (mark === DAGESH) cluster.dagesh = true;
    else if (mark === SHIN_DOT) cluster.shinDot = true;
    else if (mark === SIN_DOT) cluster.sinDot = true;
    else if (VOWEL_MARKS[mark] !== undefined) cluster.vowels.push(mark);
  }

  // ── Shva resolution ────────────────────────────────────────────────────────
  function resolveShva(clusters, idx, overrides) {
    if (overrides && overrides[idx]) return overrides[idx] === 'na';
    if (idx === 0) return true;                               // word-initial: na (incl. one-letter prefixes like בְּ)
    if (idx === clusters.length - 1) return false;            // word-final: nach
    var prev = clusters[idx - 1];
    if (prev.vowels.length === 1 && prev.vowels[0] === SHVA) return true; // 2nd of two: na
    if (clusters[idx].dagesh && !DAGESH_KAL[clusters[idx].letter]) return true; // chazak: na
    if (clusters[idx].dagesh && idx > 0) return true;         // mid-word dagesh: chazak → na
    return false;                                             // default: nach
  }

  // ── Phonemize one word into [{t:'C'|'V', s, furtive}] segments ─────────────
  function wordToSegments(word, opts) {
    var clusters = tokenizeWord(word);
    var segs = [];
    for (var i = 0; i < clusters.length; i++) {
      var c = clusters[i];
      var isLast = i === clusters.length - 1;
      var prevSeg = segs.length ? segs[segs.length - 1] : null;
      var vowelMark = null, hasShva = false;
      for (var v = 0; v < c.vowels.length; v++) {
        if (c.vowels[v] === SHVA) hasShva = true; else vowelMark = c.vowels[v];
      }
      var cons;

      if (c.letter === 'ו') { // vav
        if (c.dagesh && !vowelMark && !hasShva) { segs.push({ t: 'V', s: 'u' }); continue; }          // shuruk
        if (!c.dagesh && vowelMark && (vowelMark === HOLAM || vowelMark === HOLAM_HASER) &&
            c.vowels.length === 1) { segs.push({ t: 'V', s: 'o' }); continue; }                        // holam male
        cons = 'v';
      } else if (c.letter === 'י') { // yod
        if (!c.dagesh && !c.vowels.length && prevSeg && prevSeg.t === 'V' && prevSeg.s === 'i') {
          continue;                                                                                    // hiriq male
        }
        cons = 'j';
      } else if (c.letter === 'א') { // alef: silent when vowel-less
        if (!vowelMark && !hasShva) continue;
        cons = CONSONANTS['א'];
      } else if (c.letter === 'ה') { // he: final he silent unless mapiq
        if (isLast && !c.dagesh) {
          if (vowelMark && VOWEL_MARKS[vowelMark] === 'a') segs.push({ t: 'V', s: 'a', furtive: true }); // rare final ־ָה already vowelled by prev; furtive-style patah
          continue;
        }
        cons = 'h';
      } else if (c.geresh && GERESH_MAP[c.letter]) {
        cons = GERESH_MAP[c.letter];
      } else {
        cons = c.dagesh && DAGESH_KAL[c.letter] ? DAGESH_KAL[c.letter] : CONSONANTS[c.letter];
      }
      if (!cons) {
        throw PhonemizeError('No mapping for letter "' + c.letter + '" in "' + word + '"', word, [c.letter]);
      }

      // Furtive patah: final ח / ע / mapiq-he with patah → vowel BEFORE the consonant.
      var furtive = isLast && vowelMark && VOWEL_MARKS[vowelMark] === 'a' &&
        (vowelMark === PATAH) && (c.letter === 'ח' || c.letter === 'ע' ||
        (c.letter === 'ה' && c.dagesh)) && prevSeg && prevSeg.t === 'V';
      if (furtive) {
        segs.push({ t: 'V', s: 'a', furtive: true });
        for (var k0 = 0; k0 < cons.length; k0++) segs.push({ t: 'C', s: cons[k0] });
        continue;
      }

      for (var k = 0; k < cons.length; k++) segs.push({ t: 'C', s: cons[k] });
      if (vowelMark) {
        segs.push({ t: 'V', s: VOWEL_MARKS[vowelMark] });
      } else if (hasShva) {
        if (resolveShva(clusters, i, opts && opts.shvaOverrides)) segs.push({ t: 'V', s: 'e' });
      }
    }
    return segs;
  }

  function applyStress(segs, mode) {
    if (mode === 'none') return segs;
    var vowelIdx = [];
    for (var i = 0; i < segs.length; i++) {
      if (segs[i].t === 'V' && !segs[i].furtive) vowelIdx.push(i);
    }
    if (!vowelIdx.length) return segs;
    var target = mode === 'milel' && vowelIdx.length > 1
      ? vowelIdx[vowelIdx.length - 2]
      : vowelIdx[vowelIdx.length - 1];
    var out = segs.slice(0, target);
    out.push({ t: 'S', s: STRESS });
    return out.concat(segs.slice(target));
  }

  function applySubs(ipa) {
    if (!_vocab) return ipa;
    var out = '';
    for (var i = 0; i < ipa.length; i++) out += (_subs[ipa[i]] || ipa[i]);
    return out;
  }

  function validate(ipa) {
    var bad = [];
    for (var i = 0; i < ipa.length; i++) {
      var ch = ipa[i];
      if (_vocab) { if (!(ch in _vocab)) bad.push(ch); }
      else if (DEFAULT_SYMBOLS.indexOf(ch) === -1) bad.push(ch);
    }
    return { ok: !bad.length, bad: bad };
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  var HebrewPhonemizer = {
    STRESS: STRESS,
    DEFAULT_SYMBOLS: DEFAULT_SYMBOLS,

    /* vocab: the model config.json's vocab object ({char: id}) — the source of truth.
     * Computes adaptive substitutions for symbol pairs (ʁ/r, χ/x, ɡ/g) so the emitted
     * inventory always matches the model actually loaded. */
    setVocab: function (vocab) {
      _vocab = vocab || null;
      _subs = {};
      if (!_vocab) return;
      for (var p = 0; p < SUB_PAIRS.length; p++) {
        var a = SUB_PAIRS[p][0], b = SUB_PAIRS[p][1];
        if (!(a in _vocab) && (b in _vocab)) _subs[a] = b;
        if (!(b in _vocab) && (a in _vocab)) _subs[b] = a;
      }
    },
    getVocab: function () { return _vocab; },
    validate: validate,

    /* text: pointed Hebrew word or short phrase.
     * opts: { stress: 'milra'|'milel'|'none', shvaOverrides: {clusterIndex:'na'|'nach'} }
     * Returns an IPA string; throws PhonemizeError on unsupported input or any
     * out-of-vocab output character. */
    phonemize: function (text, opts) {
      opts = opts || {};
      var cleaned = String(text || '')
        .replace(STRIP_RE, '')
        .replace(/ /g, ' ')
        .replace(/[־]/g, ' ');
      var words = cleaned.trim().split(/\s+/).filter(Boolean);
      if (!words.length) throw PhonemizeError('Empty input', text, []);
      var parts = [];
      for (var w = 0; w < words.length; w++) {
        // Peel sentence punctuation off the token edges — it passes through to the
        // model as prosody cues; the core is phonemized as pointed Hebrew.
        var token = words[w], lead = '', trail = '';
        while (token && PASS_PUNCT.indexOf(token[0]) !== -1) { lead += token[0]; token = token.slice(1); }
        while (token && PASS_PUNCT.indexOf(token[token.length - 1]) !== -1) { trail = token[token.length - 1] + trail; token = token.slice(0, -1); }
        if (!token) { if (lead + trail) parts.push(lead + trail); continue; }
        var segs = applyStress(wordToSegments(token, opts), opts.stress || 'milra');
        var ipa = '';
        for (var s = 0; s < segs.length; s++) ipa += segs[s].s;
        if (ipa) parts.push(lead + ipa + trail);
      }
      var result = applySubs(parts.join(' '));
      var check = validate(result);
      if (!check.ok) {
        throw PhonemizeError(
          'Phonemizer produced out-of-vocab symbol(s) ' + JSON.stringify(check.bad) +
          ' for input "' + text + '" (output was "' + result + '"). The model vocab is the ' +
          'source of truth — extend the mapping or the substitution table.',
          text, check.bad);
      }
      return result;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = HebrewPhonemizer;
  else root.HebrewPhonemizer = HebrewPhonemizer;
})(typeof self !== 'undefined' ? self : this);
