#!/usr/bin/env python3
"""align_totaltorah.py — word onsets for one chanted verse by CTC forced alignment.

Called by scripts/build-totaltorah-timings.mjs, once per verse file, inside the venv it creates at
source-data/totaltorah-cache/align-env/ (gitignored). Never run on a whole video.

    python3 align_totaltorah.py --audio <verse.flac> --words <verse.words.json> --out <verse.align.json>
                                [--model imvladikon/wav2vec2-xls-r-300m-hebrew] [--revision <sha>]

The words file is {"words": ["בראשית", "ברא", …]} — the verse's sung words as CONSONANTS ONLY (nikkud and
te'amim stripped by the caller, one entry per Trainer word, maqaf halves separate). The model's vocabulary
is consonantal Hebrew, so that is the transcript; the caller keeps the mapping back to word indices.

Output: {"onsets": [s…], "ends": [s…], "scores": [0–1…], "frame": <seconds per frame>, "wall": <s>,
         "model": <id>, "revision": <sha>}, one value per word. The onset is the FIRST frame of the word's
CTC segment (cantillation stretches vowels and melismas, so the segment's end is only kept for the trailing
end-of-last-word value); the score is the mean token probability of the word's frames.

No heuristic fallback of any kind: if torch, torchaudio, transformers or the model are missing it exits 1 with
the reason, and the caller stops.
"""
import argparse
import json
import sys
import time


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--audio', required=True)
    ap.add_argument('--words', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--model', default='imvladikon/wav2vec2-xls-r-300m-hebrew')
    ap.add_argument('--revision', default=None, help='model commit sha to pin; printed on success so the caller can record it')
    args = ap.parse_args()

    t0 = time.time()
    try:
        import torch
        import torchaudio
        import torchaudio.functional as F
        from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
    except ImportError as e:  # the caller reports and stops; nothing is guessed
        print(f'align: missing dependency: {e}', file=sys.stderr)
        sys.exit(1)

    with open(args.words, encoding='utf-8') as f:
        words = json.load(f)['words']
    if not words:
        print('align: no words', file=sys.stderr)
        sys.exit(1)

    try:
        processor = Wav2Vec2Processor.from_pretrained(args.model, revision=args.revision)
        model = Wav2Vec2ForCTC.from_pretrained(args.model, revision=args.revision)
    except Exception as e:
        print(f'align: could not load {args.model}@{args.revision or "main"}: {e}', file=sys.stderr)
        sys.exit(1)
    model.eval()
    try:
        from huggingface_hub import model_info
        revision = model_info(args.model, revision=args.revision).sha
    except Exception:
        revision = args.revision or 'unknown'

    wav, sr = torchaudio.load(args.audio)
    if wav.shape[0] > 1:
        wav = wav.mean(dim=0, keepdim=True)
    if sr != 16000:
        wav = torchaudio.functional.resample(wav, sr, 16000)
        sr = 16000
    inputs = processor(wav.squeeze(0).numpy(), sampling_rate=sr, return_tensors='pt')
    with torch.inference_mode():
        logits = model(inputs.input_values).logits  # (1, frames, vocab)
    log_probs = torch.log_softmax(logits, dim=-1)
    n_frames = log_probs.shape[1]
    frame_s = wav.shape[1] / sr / n_frames

    vocab = processor.tokenizer.get_vocab()
    delim = processor.tokenizer.word_delimiter_token or '|'
    blank = processor.tokenizer.pad_token_id
    delim_id = vocab.get(delim)
    if delim_id is None:
        print(f'align: tokenizer has no word delimiter token {delim!r}', file=sys.stderr)
        sys.exit(1)

    # transcript = words joined by the delimiter; every char must be in the vocabulary
    targets, word_of_token = [], []
    for wi, w in enumerate(words):
        if wi:
            targets.append(delim_id); word_of_token.append(None)
        for ch in w:
            tid = vocab.get(ch)
            if tid is None:
                print(f'align: character {ch!r} of word {wi} ({w}) is not in the model vocabulary', file=sys.stderr)
                sys.exit(1)
            targets.append(tid); word_of_token.append(wi)
    if n_frames < len(targets):
        print(f'align: {n_frames} frames for {len(targets)} tokens — the clip is too short for its text', file=sys.stderr)
        sys.exit(1)
    tgt = torch.tensor([targets], dtype=torch.int32)
    try:
        alignment, scores = F.forced_align(log_probs, tgt, blank=blank)
    except Exception as e:
        print(f'align: forced_align failed: {e}', file=sys.stderr)
        sys.exit(1)
    spans = F.merge_tokens(alignment[0], scores[0].exp())  # one TokenSpan per emitted token, in order

    # merge_tokens drops blanks and repeats; the remaining spans line up with `targets` one to one
    if len(spans) != len(targets):
        print(f'align: {len(spans)} token spans for {len(targets)} targets', file=sys.stderr)
        sys.exit(1)
    onsets, ends, word_scores = [], [], []
    cur, frames_scores = None, []
    for span, wi in zip(spans, word_of_token):
        if wi is None:
            continue
        if wi != cur:
            if cur is not None:
                word_scores.append(sum(frames_scores) / len(frames_scores))
            cur, frames_scores = wi, []
            onsets.append(round(span.start * frame_s, 3))
            ends.append(round(span.end * frame_s, 3))
        else:
            ends[-1] = round(span.end * frame_s, 3)
        frames_scores.append(float(span.score))
    if cur is not None:
        word_scores.append(sum(frames_scores) / len(frames_scores))
    if len(onsets) != len(words):
        print(f'align: produced {len(onsets)} onsets for {len(words)} words', file=sys.stderr)
        sys.exit(1)
    out = {'onsets': onsets, 'ends': ends, 'scores': [round(s, 3) for s in word_scores], 'frame': round(frame_s, 5),
           'wall': round(time.time() - t0, 1), 'model': args.model, 'revision': revision}
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False)
    print(json.dumps({'wall': out['wall'], 'revision': revision}))


if __name__ == '__main__':
    main()
