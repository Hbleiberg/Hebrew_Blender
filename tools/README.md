# tools/ — maintainer-only model preparation (Advanced TTS)

Nothing in this directory runs in the browser or on the site. It documents the **one-time,
maintainer-run** workflow for preparing the Hebrew Kokoro TTS model that powers the
"Enable Advanced TTS" feature. The browser side lives in `tts/` and fetches its assets at
runtime from the URLs in the config block at the top of `tts/tts-engine.js`.

> **License gate first:** read [`CREDITS.md`](../CREDITS.md) before doing anything here.
> The Hebrew model is non-commercial, and **re-hosting the weights (including a quantized
> derivative) is not currently authorized** — see CREDITS.md §6. Until that changes, the
> site fetches the original files from Hugging Face at runtime and this workflow is only
> useful for local testing / preparing for a future authorized hosting setup.

> **Why this is the durable fix for the "hang after download" problem.** Upstream ships
> the Hebrew model **fp32-only (~310 MB)**. That size is the root cause of slow/failed
> in-browser session creation (documented onnxruntime-web WASM out-of-memory on mobile
> Safari; every reference browser Kokoro deployment uses the ~88 MB q8/int8 build on WASM
> and reserves fp32 for WebGPU). The runtime was hardened so a 310 MB model now degrades
> gracefully (timeouts, WebGPU→WASM fallback, Web Speech fallback) instead of hanging — but
> the real cure is to **quantize the Hebrew `kokoro.onnx` to int8 (~88 MB) and host it**,
> then set `MODEL_INT8_URL` in `tts/tts-engine.js` to that URL and bump `MODEL_VERSION`.
> `tts/tts-worker.js` already prefers a reachable int8 model automatically, so this is a
> one-URL swap once the license gate above is cleared.

## What the site fetches at runtime (default configuration)

From `https://huggingface.co/thewh1teagle/kokoro-hebrew-nc/resolve/main/`:

| File | Size (approx) | Fetched | Cached |
|---|---|---|---|
| `config.json` | a few KB | at Enable | Cache API `tts-models-v1` |
| `voices-hebrew.bin` | small (npz of style vectors) | at Enable | Cache API `tts-models-v1` |
| `kokoro.onnx` | ~310 MB fp32 | at Enable, with progress UI + explicit size warning | Cache API `tts-models-v1` |

At Enable time the engine also probes (one cheap HEAD request) for `kokoro.int8.onnx` in the
same repo and prefers it automatically if the upstream repo ever publishes one.

## Quantization workflow (`quantize_model.py`)

Goal: produce `kokoro.int8.onnx` (~80–90 MB) from the fp32 model, so a future authorized host
can serve a 3–4× smaller download. Requirements: Python 3.10+, `pip install onnx onnxruntime
numpy requests`.

```bash
cd tools/
python3 quantize_model.py            # full run: check-upstream → download → quantize → parity
python3 quantize_model.py --skip-parity   # skip the fp32/int8 listening-test WAVs
```

The script:

1. **Lists the upstream HF repo's files** (`https://huggingface.co/api/models/thewh1teagle/kokoro-hebrew-nc`)
   and, if a quantized variant already exists upstream, tells you to prefer it and stops —
   no local quantization needed (the runtime probe above will pick it up automatically).
2. Downloads `kokoro.onnx`, `voices-hebrew.bin`, `config.json` into `tools/model/`
   (gitignored — **never commit model weights**; GitHub blocks >100 MB files anyway).
3. Runs `onnxruntime.quantization.quantize_dynamic` (weights-only int8) →
   `tools/model/kokoro.int8.onnx`.
4. **Parity check:** synthesizes 3 sample phoneme strings with both the fp32 and int8 models
   and writes paired WAVs into `tools/parity/` (gitignored). Listen to each pair — the int8
   voice should be audibly equivalent; slight brightness differences are normal, garbling or
   dropouts are not. Do not ship an int8 model that fails the listen test.

## Hosting decision

- **Default (current): runtime fetch from Hugging Face.** No redistribution, nothing to host,
  CORS is served by HF (`Access-Control-Allow-Origin: *` on `resolve/` URLs, which redirect to
  their LFS/Xet CDN). The UI warns about the ~310 MB one-time download; it is cached in the
  Cache API afterward and survives deploys (the service worker's activate keep-list includes
  `tts-models-v1`).
- **Conditional (requires license clearance — see CREDITS.md §6): self-host `kokoro.int8.onnx`**
  on a CORS-enabled bucket (e.g. Cloudflare R2):
  1. Confirm the `avris/kokoro-hebrew-saspeech` license text explicitly permits redistribution
     under the same non-commercial terms, or obtain written permission.
  2. Upload `kokoro.int8.onnx` **plus the license text file** to the bucket.
  3. Set the bucket's CORS `Access-Control-Allow-Origin` to `https://ivritsuite.com` (and any
     other origin the site serves from, e.g. `https://hbleiberg.github.io`).
  4. Point `MODEL_URL` in the config block at the top of `tts/tts-engine.js` at the bucket URL,
     bump `MODEL_VERSION` in the same block (this invalidates users' cached copies cleanly),
     and add the bucket origin to the three integrated pages' CSP `connect-src`.
