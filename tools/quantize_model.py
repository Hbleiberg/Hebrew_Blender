#!/usr/bin/env python3
"""Maintainer-only: prepare a quantized Hebrew Kokoro TTS model.

See tools/README.md for the full workflow and the license gate (CREDITS.md) that
governs whether the result may be hosted anywhere. This script never runs on the
site; the browser code in tts/ fetches models at runtime.

Steps: check upstream for an existing quantized variant -> download fp32 model +
voices + config -> quantize_dynamic to int8 -> fp32/int8 parity WAVs for a human
listen test.

Requires: pip install onnx onnxruntime numpy requests
"""

import argparse
import io
import json
import struct
import sys
import zipfile
from pathlib import Path

import numpy as np
import requests

HF_REPO = "thewh1teagle/kokoro-hebrew-nc"
HF_API = f"https://huggingface.co/api/models/{HF_REPO}"
HF_RESOLVE = f"https://huggingface.co/{HF_REPO}/resolve/main"

MODEL_DIR = Path(__file__).parent / "model"
PARITY_DIR = Path(__file__).parent / "parity"

FILES = ["kokoro.onnx", "voices-hebrew.bin", "config.json"]

VOICE = "he_shaul"
SAMPLE_RATE = 24000
MAX_PHONEME_LENGTH = 510

# Phoneme strings in the model's IPA inventory (see tts/phonemizer.js and the
# phonikud phoneme set): shalom olam / boker tov, yeladim / hatul katan veχaχam.
PARITY_SAMPLES = [
    "ʃalˈom ʔolˈam",
    "bˈoker tˈov jeladˈim",
    "χatˈul katˈan veχaχˈam",
]


def check_upstream_quantized():
    print(f"Checking {HF_API} for an existing quantized variant ...")
    try:
        resp = requests.get(HF_API, timeout=30)
        resp.raise_for_status()
        siblings = [s.get("rfilename", "") for s in resp.json().get("siblings", [])]
    except Exception as e:  # noqa: BLE001 - report and continue offline-friendly
        print(f"  WARNING: could not list upstream files ({e}); continuing.")
        return None
    print("  Upstream files: " + ", ".join(siblings))
    quantized = [
        f for f in siblings
        if f.endswith(".onnx") and any(t in f.lower() for t in ("int8", "quant", "q8", "fp16", "q4"))
    ]
    return quantized or None


def download(name: str, dest: Path):
    if dest.exists() and dest.stat().st_size > 0:
        print(f"  {name}: already downloaded ({dest.stat().st_size / 1e6:.1f} MB), skipping")
        return
    url = f"{HF_RESOLVE}/{name}"
    print(f"  {name}: downloading from {url} ...")
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        done = 0
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 20):
                f.write(chunk)
                done += len(chunk)
                if total:
                    print(f"\r    {done / 1e6:.0f}/{total / 1e6:.0f} MB", end="", flush=True)
    print(f"\r  {name}: done ({dest.stat().st_size / 1e6:.1f} MB)      ")


def quantize(fp32_path: Path, int8_path: Path):
    from onnxruntime.quantization import QuantType, quantize_dynamic

    print(f"Quantizing {fp32_path.name} -> {int8_path.name} (weights-only int8) ...")
    quantize_dynamic(str(fp32_path), str(int8_path), weight_type=QuantType.QInt8)
    print(f"  {int8_path.name}: {int8_path.stat().st_size / 1e6:.1f} MB "
          f"(fp32 was {fp32_path.stat().st_size / 1e6:.1f} MB)")


def load_vocab(config_path: Path) -> dict:
    cfg = json.loads(config_path.read_text(encoding="utf-8"))
    return cfg.get("vocab") or cfg


def load_voice(voices_path: Path, name: str) -> np.ndarray:
    raw = voices_path.read_bytes()
    if raw[:2] == b"PK":  # .npz (zip of .npy arrays keyed by voice name)
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            entry = f"{name}.npy" if f"{name}.npy" in z.namelist() else name
            with z.open(entry) as f:
                return np.lib.format.read_array(f)
    # raw float32 blob for a single voice, [-1, 1, 256]
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 1, 256)


def synthesize(sess, vocab: dict, voice: np.ndarray, phonemes: str, speed: float = 1.0) -> np.ndarray:
    tokens = [vocab[c] for c in phonemes if c in vocab]
    dropped = [c for c in phonemes if c not in vocab]
    if dropped:
        print(f"    WARNING: dropped out-of-vocab chars: {dropped!r}")
    assert len(tokens) <= MAX_PHONEME_LENGTH, f"too many tokens ({len(tokens)} > {MAX_PHONEME_LENGTH})"
    style = np.asarray(voice[len(tokens)], dtype=np.float32).reshape(1, -1)
    input_names = [i.name for i in sess.get_inputs()]
    if "input_ids" in input_names:
        inputs = {
            "input_ids": np.array([[0, *tokens, 0]], dtype=np.int64),
            "style": style,
            "speed": np.array([speed], dtype=np.int32),
        }
    else:  # legacy export
        inputs = {
            "tokens": np.array([[0, *tokens, 0]], dtype=np.int64),
            "style": style,
            "speed": np.ones(1, dtype=np.float32) * speed,
        }
    audio = sess.run(None, inputs)[0]
    return np.asarray(audio).squeeze()


def write_wav(path: Path, samples: np.ndarray, rate: int = SAMPLE_RATE):
    pcm = np.clip(samples, -1.0, 1.0)
    pcm = (pcm * 32767).astype("<i2").tobytes()
    with open(path, "wb") as f:
        f.write(b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt ")
        f.write(struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16))
        f.write(b"data" + struct.pack("<I", len(pcm)) + pcm)


def parity_check(fp32_path: Path, int8_path: Path, config_path: Path, voices_path: Path):
    import onnxruntime as ort

    PARITY_DIR.mkdir(exist_ok=True)
    vocab = load_vocab(config_path)
    voice = load_voice(voices_path, VOICE)
    for tag, model_path in (("fp32", fp32_path), ("int8", int8_path)):
        print(f"Parity synth with {tag} ({model_path.name}) ...")
        sess = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
        for i, phonemes in enumerate(PARITY_SAMPLES, 1):
            out = PARITY_DIR / f"sample{i}_{tag}.wav"
            print(f"  [{i}] {phonemes!r} -> {out.name}")
            write_wav(out, synthesize(sess, vocab, voice, phonemes))
    print(f"\nDone. Listen to the pairs in {PARITY_DIR}/ — int8 must be audibly equivalent "
          f"to fp32 (garbling or dropouts = do not ship).")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--skip-parity", action="store_true", help="skip the fp32/int8 listen-test WAVs")
    args = ap.parse_args()

    upstream = check_upstream_quantized()
    if upstream:
        print(f"\nUpstream already ships quantized variant(s): {upstream}")
        print("Prefer those — the runtime probe in tts/tts-engine.js picks up kokoro.int8.onnx")
        print("automatically. No local quantization needed; exiting.")
        return

    MODEL_DIR.mkdir(exist_ok=True)
    print(f"\nDownloading model files into {MODEL_DIR}/ (gitignored) ...")
    for name in FILES:
        download(name, MODEL_DIR / name)

    fp32 = MODEL_DIR / "kokoro.onnx"
    int8 = MODEL_DIR / "kokoro.int8.onnx"
    quantize(fp32, int8)

    if not args.skip_parity:
        parity_check(fp32, int8, MODEL_DIR / "config.json", MODEL_DIR / "voices-hebrew.bin")

    print("\nNEXT: read tools/README.md 'Hosting decision' — do NOT upload the quantized model")
    print("anywhere until the license gate in CREDITS.md §6 is cleared.")


if __name__ == "__main__":
    sys.exit(main())
