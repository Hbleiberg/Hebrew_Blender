#!/usr/bin/env python3
"""align_totaltorah.py — word onsets for chanted Torah text by CTC forced alignment.

Called by scripts/build-totaltorah-timings.mjs and scripts/build-totaltorah-bulk.mjs (through scripts/totaltorah-lib.mjs)
inside the venv they create at source-data/totaltorah-cache/align-env/ (gitignored). Two ways to run it:

  one job:   python3 align_totaltorah.py --audio <file.flac> --words <words.json> --out <align.json>
                                        [--offset <s>] [--end <s>] [--model …] [--revision <sha>]
  a batch:   python3 align_totaltorah.py --serve [--model …] [--revision <sha>]
             The model loads once; then one JSON object per line on stdin,
               {"id": "…", "audio": "<file>", "words": ["בראשית", "ברא", …], "offset": 0, "end": null}
             answers one JSON line per job on stdout, {"id", "onsets", "ends", "scores", …} or {"id", "error"},
             after a first line {"ready": true, "model", "revision"}. EOF ends it. This is what the pipeline uses:
             loading the model was most of the per-verse cost when every verse was its own process.
             A job may carry "offsets": [s, s, …] instead of "offset": the network then runs once over the span
             from the earliest offset and the same words are force-aligned from each offset in turn — the result
             is {"id", "results": [{"offset", "onsets", "ends", "scores"} or {"offset", "error"}, …]}. The
             boundaries pass scores a video's possible intro ends this way, one emission pass for all of them.
             A job with "greedy": true (audio, offset, end; no words) answers {"id", "text"}: the model's own
             unforced transcript of the span (CTC greedy decoding, consonants and spaces); with "english": true
             the same through the English model (--english-model, facebook/wav2vec2-base-960h by default, loaded
             on first use) — the boundaries pass reads each video's spoken intro with it ("B'reishit, Year 1,
             Aliyah 4" comes back as those words; the Hebrew chant after it comes back as no such words).

The words are the sung words as CONSONANTS ONLY (nikkud and te'amim stripped by the caller, one entry per Trainer
word, maqaf halves separate). The model's vocabulary is consonantal Hebrew, so that is the transcript; the caller
keeps the mapping back to word indices. `offset` skips a spoken intro, `end` stops before the file's end (both in
the file's own seconds; the reported times are in the file's own time too).

Long audio is aligned whole, but the network runs in windows (--window 40 s, --overlap 4 s): the transformer's
attention is quadratic in the frame count, so a whole 5-minute aliyah in one pass needs more memory than a
desktop has, while its CTC emissions are local enough that a window's middle is the same as the whole file's.
Each window's edge frames are dropped (half the overlap on each side), the kept frames are concatenated with
their own absolute times, and ONE forced alignment runs over the whole emission — nothing is cut by guesswork.

Output per job: {"onsets": [s…], "ends": [s…], "scores": [0–1…], "frame": <mean seconds per frame>, "windows": n,
"wall": <s>, "model": <id>, "revision": <sha>}, one value per word. The onset is the FIRST frame of the word's
CTC segment (cantillation stretches vowels and melismas, so the segment's end is only kept for the trailing
end-of-last-word value); the score is the mean token probability of the word's frames.

No heuristic fallback of any kind: if torch, torchaudio, transformers or the model are missing it exits 1 with
the reason (a batch job answers {"error"}), and the caller stops.
"""
import argparse
import bisect
import json
import sys
import time


class AlignError(Exception):
    pass


def load_runtime():
    try:
        import torch  # noqa: F401
        import torchaudio  # noqa: F401
        import torchaudio.functional  # noqa: F401
        import soundfile  # noqa: F401
        from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor  # noqa: F401
    except ImportError as e:  # the caller reports and stops; nothing is guessed
        raise AlignError(f'missing dependency: {e}')


class Aligner:
    def __init__(self, model_id, revision, window, overlap, english_id=None, english_revision=None):
        import torch
        from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
        self.model_id = model_id
        self.english_id = english_id or 'facebook/wav2vec2-base-960h'
        self.english_revision = english_revision
        try:
            self.processor = Wav2Vec2Processor.from_pretrained(model_id, revision=revision)
            self.model = Wav2Vec2ForCTC.from_pretrained(model_id, revision=revision)
        except Exception as e:
            raise AlignError(f'could not load {model_id}@{revision or "main"}: {e}')
        self.model.eval()
        try:
            from huggingface_hub import model_info
            self.revision = model_info(model_id, revision=revision).sha
        except Exception:
            self.revision = revision or 'unknown'
        self.vocab = self.processor.tokenizer.get_vocab()
        delim = self.processor.tokenizer.word_delimiter_token or '|'
        self.blank = self.processor.tokenizer.pad_token_id
        self.delim_id = self.vocab.get(delim)
        if self.delim_id is None:
            raise AlignError(f'tokenizer has no word delimiter token {delim!r}')
        self.window = float(window)
        self.overlap = float(overlap)
        self.torch = torch

    # ---- audio ----
    def load_audio(self, path, offset, end):
        import soundfile as sf
        import torchaudio
        torch = self.torch
        data, sr = sf.read(path, dtype='float32', always_2d=True)   # (frames, channels)
        wav = torch.from_numpy(data.T.copy())                        # (channels, frames)
        if wav.shape[0] > 1:
            wav = wav.mean(dim=0, keepdim=True)
        if sr != 16000:
            wav = torchaudio.functional.resample(wav, sr, 16000)
            sr = 16000
        offset = max(0.0, float(offset or 0.0))
        start = int(offset * sr)
        stop = wav.shape[1] if end is None else min(wav.shape[1], int(float(end) * sr))
        if stop - start < sr // 4:
            raise AlignError(f'the span {offset:.2f}–{stop / sr:.2f} s holds less than a quarter second of audio')
        return wav[:, start:stop].squeeze(0), sr, offset

    # ---- emissions, windowed when the audio is long ----
    def emissions(self, wav, sr, offset, model=None, processor=None):
        """log-probs (frames × vocab) for the whole span, plus each frame's absolute start and end time."""
        torch = self.torch
        model = model or self.model
        processor = processor or self.processor
        n = wav.shape[0]
        win = int(self.window * sr)
        ov = int(self.overlap * sr)
        if n <= win:
            spans = [(0, n)]
        else:
            step = win - ov
            spans = []
            s = 0
            while True:
                e = min(n, s + win)
                spans.append((s, e))
                if e >= n:
                    break
                s += step
        parts, starts, ends = [], [], []
        for wi, (s, e) in enumerate(spans):
            inputs = processor(wav[s:e].numpy(), sampling_rate=sr, return_tensors='pt')
            with torch.inference_mode():
                logits = model(inputs.input_values).logits  # (1, frames, vocab)
            lp = torch.log_softmax(logits[0], dim=-1)
            nf = lp.shape[0]
            frame_s = (e - s) / sr / nf
            trim = int(round((self.overlap / 2) / frame_s)) if len(spans) > 1 else 0
            lo = 0 if wi == 0 else trim
            hi = nf if wi == len(spans) - 1 else nf - trim
            if hi <= lo:
                raise AlignError('a window kept no frames (overlap too large for the window)')
            parts.append(lp[lo:hi])
            base = offset + s / sr
            for f in range(lo, hi):
                starts.append(base + f * frame_s)
                ends.append(base + (f + 1) * frame_s)
        return torch.cat(parts, dim=0), starts, ends, len(spans)

    # ---- the transcript ----
    def transcript(self, words):
        if not words:
            raise AlignError('no words')
        targets, word_of_token = [], []
        for wi, w in enumerate(words):
            if wi:
                targets.append(self.delim_id); word_of_token.append(None)
            for ch in w:
                tid = self.vocab.get(ch)
                if tid is None:
                    raise AlignError(f'character {ch!r} of word {wi} ({w}) is not in the model vocabulary')
                targets.append(tid); word_of_token.append(wi)
        return targets, word_of_token

    # ---- the forced alignment over an emission ----
    def dp(self, log_probs, f_start, f_end, targets, word_of_token, n_words):
        import torchaudio.functional as F
        torch = self.torch
        n_frames = log_probs.shape[0]
        if n_frames < len(targets):
            raise AlignError(f'{n_frames} frames for {len(targets)} tokens — the clip is too short for its text')
        tgt = torch.tensor([targets], dtype=torch.int32)
        try:
            alignment, scores = F.forced_align(log_probs.unsqueeze(0), tgt, blank=self.blank)
        except Exception as e:
            raise AlignError(f'forced_align failed: {e}')
        spans = F.merge_tokens(alignment[0], scores[0].exp(), blank=self.blank)  # one TokenSpan per emitted token, in order
        if len(spans) != len(targets):
            raise AlignError(f'{len(spans)} token spans for {len(targets)} targets')
        onsets, ends, word_scores = [], [], []
        cur, frames_scores = None, []
        for span, wi in zip(spans, word_of_token):
            if wi is None:
                continue
            if wi != cur:
                if cur is not None:
                    word_scores.append(sum(frames_scores) / len(frames_scores))
                cur, frames_scores = wi, []
                onsets.append(round(f_start[span.start], 3))
                ends.append(round(f_end[span.end - 1], 3))
            else:
                ends[-1] = round(f_end[span.end - 1], 3)
            frames_scores.append(float(span.score))
        if cur is not None:
            word_scores.append(sum(frames_scores) / len(frames_scores))
        if len(onsets) != n_words:
            raise AlignError(f'produced {len(onsets)} onsets for {n_words} words')
        return {'onsets': onsets, 'ends': ends, 'scores': [round(s, 3) for s in word_scores],
                'frame': round((f_end[-1] - f_start[0]) / n_frames, 5)}

    # ---- what the model hears, unforced: the greedy CTC transcript of a span ----
    # The boundaries pass asks this of each possible intro end: over Hebrew chant the letters resemble the verse's
    # first words, over the spoken English intro they do not — a forced alignment cannot tell the two apart (it
    # parks the first words on the English and scores the rest no worse), the free transcript can.
    def greedy(self, audio, offset=0.0, end=None, english=False):
        t0 = time.time()
        wav, sr, base = self.load_audio(audio, offset, end)
        if english:
            model, processor, model_id = self.english_model()
        else:
            model, processor, model_id = self.model, self.processor, self.model_id
        log_probs, f_start, f_end, n_windows = self.emissions(wav, sr, base, model, processor)
        vocab = processor.tokenizer.get_vocab()
        blank = processor.tokenizer.pad_token_id
        delim = vocab.get(processor.tokenizer.word_delimiter_token or '|')
        inv = {tid: ch for ch, tid in vocab.items()}
        out, chars, prev = [], [], None
        for fi, tid in enumerate(log_probs.argmax(dim=-1).tolist()):
            if tid != prev and tid != blank:
                ch = ' ' if tid == delim else inv.get(tid, '')
                out.append(ch)
                if ch:   # each emitted character with the time of the frame that emitted it (the caller reads the intro's end off these)
                    chars.append([ch, round(f_start[fi], 3), round(f_end[fi], 3)])
            prev = tid
        return {'text': ' '.join(''.join(out).split()), 'chars': chars, 'windows': n_windows, 'wall': round(time.time() - t0, 1), 'model': model_id, 'revision': self.revision}

    # ---- the English model, loaded on the first intro question ----
    # Every Total Torah video opens with a spoken English announcement ("B'reishit, Year 1, Aliyah 4"); an English
    # CTC model reads it as words, and reads the Hebrew chant that follows as nothing of the kind — which is how the
    # boundaries pass finds where the intro ends. Loaded once, only when asked.
    def english_model(self):
        if getattr(self, '_en', None) is None:
            from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
            try:
                proc = Wav2Vec2Processor.from_pretrained(self.english_id, revision=self.english_revision)
                model = Wav2Vec2ForCTC.from_pretrained(self.english_id, revision=self.english_revision)
            except Exception as e:
                raise AlignError(f'could not load the English model {self.english_id}@{self.english_revision or "main"}: {e}')
            model.eval()
            self._en = (model, proc, self.english_id)
        return self._en

    # ---- one job ----
    def align(self, audio, words, offset=0.0, end=None, offsets=None):
        t0 = time.time()
        multi = offsets is not None
        offs = sorted(set(max(0.0, float(o)) for o in (offsets if multi else [offset or 0.0])))
        if not offs:
            raise AlignError('no offsets')
        targets, word_of_token = self.transcript(words)
        wav, sr, base = self.load_audio(audio, offs[0], end)
        log_probs, f_start, f_end, n_windows = self.emissions(wav, sr, base)
        results = []
        for o in offs:
            k = bisect.bisect_left(f_start, o - 1e-6)
            try:
                res = self.dp(log_probs[k:], f_start[k:], f_end[k:], targets, word_of_token, len(words))
                res['offset'] = o
            except AlignError as e:
                if not multi:
                    raise
                res = {'offset': o, 'error': str(e)}
            results.append(res)
        meta = {'windows': n_windows, 'wall': round(time.time() - t0, 1), 'model': self.model_id, 'revision': self.revision}
        if multi:
            return {'results': results, **meta}
        return {**results[0], **meta}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--audio')
    ap.add_argument('--words')
    ap.add_argument('--out')
    ap.add_argument('--serve', action='store_true', help='load the model once and take JSON jobs on stdin, one per line')
    ap.add_argument('--model', default='imvladikon/wav2vec2-xls-r-300m-hebrew')
    ap.add_argument('--revision', default=None, help='model commit sha to pin; printed on success so the caller can record it')
    ap.add_argument('--english-model', default='facebook/wav2vec2-base-960h', help='the English CTC model that reads each video\'s spoken intro (loaded on the first "english" job)')
    ap.add_argument('--english-revision', default=None, help='its commit sha to pin')
    ap.add_argument('--offset', type=float, default=0.0, help='seconds of audio to skip before aligning (a spoken intro); onsets and ends are reported in the file\'s own time')
    ap.add_argument('--end', type=float, default=None, help='stop the aligned span at this second of the file')
    ap.add_argument('--window', type=float, default=40.0, help='seconds of audio per network pass (the attention cost is quadratic in it)')
    ap.add_argument('--overlap', type=float, default=4.0, help='seconds two windows share; half is dropped on each side')
    args = ap.parse_args()
    if args.overlap >= args.window:
        print('align: --overlap must be smaller than --window', file=sys.stderr)
        sys.exit(2)
    try:
        load_runtime()
        aligner = Aligner(args.model, args.revision, args.window, args.overlap, args.english_model, args.english_revision)
    except AlignError as e:
        print(f'align: {e}', file=sys.stderr)
        sys.exit(1)

    if args.serve:
        print(json.dumps({'ready': True, 'model': aligner.model_id, 'revision': aligner.revision}), flush=True)
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                job = json.loads(line)
            except ValueError as e:
                print(json.dumps({'error': f'bad job line: {e}'}), flush=True)
                continue
            jid = job.get('id')
            try:
                if job.get('greedy') or job.get('english'):
                    out = aligner.greedy(job['audio'], job.get('offset') or 0.0, job.get('end'), english=bool(job.get('english')))
                else:
                    out = aligner.align(job['audio'], job.get('words') or [], job.get('offset') or 0.0, job.get('end'), job.get('offsets'))
                out['id'] = jid
                print(json.dumps(out, ensure_ascii=False), flush=True)
            except AlignError as e:
                print(json.dumps({'id': jid, 'error': str(e)}, ensure_ascii=False), flush=True)
            except Exception as e:  # a job must never take the server down; the caller sees the reason
                print(json.dumps({'id': jid, 'error': f'{type(e).__name__}: {e}'}, ensure_ascii=False), flush=True)
        return

    if not (args.audio and args.words and args.out):
        print('align: --audio, --words and --out are required (or --serve)', file=sys.stderr)
        sys.exit(2)
    with open(args.words, encoding='utf-8') as f:
        words = json.load(f)['words']
    try:
        out = aligner.align(args.audio, words, args.offset, args.end)
    except AlignError as e:
        print(f'align: {e}', file=sys.stderr)
        sys.exit(1)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False)
    print(json.dumps({'wall': out['wall'], 'revision': out['revision'], 'windows': out['windows']}))


if __name__ == '__main__':
    main()
