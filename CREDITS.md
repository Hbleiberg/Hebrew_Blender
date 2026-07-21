# Voice & Audio Credits — Hebrew TTS (Kokoro)

The **Advanced TTS** feature (the "Enable Advanced TTS" option in the Worksheet Generator,
Dictionary, and Flash Cards) synthesizes Hebrew speech entirely in the browser using the
Hebrew-finetuned **Kokoro** neural TTS model. This file records the licensing and attribution
for every component of that pipeline. See also [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md)
for the rest of the site's third-party components.

> **The short version:** the Hebrew voice model is licensed for **non-commercial use only**.
> This site is a free educational tool licensed CC BY-NC-SA 4.0, with no advertising, paywalls,
> donations-for-access, or sales on any page that uses this voice — and it must stay that way
> for as long as this voice is used. The model weights are fetched at runtime directly from
> Hugging Face and are **not** redistributed by this project.

---

## 1. Base model — Kokoro-82M by hexgrad

- **Source:** <https://huggingface.co/hexgrad/Kokoro-82M>
- **License:** **Apache 2.0**
- The model card's declared license (YAML frontmatter, verified 2026-07-20 via the Hugging Face
  search index):

  > ```
  > license: apache-2.0
  > language:
  > - en
  > base_model:
  > - yl4579/StyleTTS2-LJSpeech
  > ```

- Kokoro-82M is itself built on the StyleTTS2 architecture. The Apache 2.0 license applies to
  the **base** (English) model and architecture only — the Hebrew fine-tune below carries its
  own, more restrictive terms, which govern our use.

## 2. Hebrew fine-tune — kokoro-hebrew-saspeech by avris (ONNX export: thewh1teagle/kokoro-hebrew-nc)

- **Weights we fetch at runtime:** <https://huggingface.co/thewh1teagle/kokoro-hebrew-nc>
  (`kokoro.onnx`, `voices-hebrew.bin`, `config.json`; voice id `he_shaul`)
- **Original fine-tune / governing license:** <https://huggingface.co/avris/kokoro-hebrew-saspeech>
- **License:** **Non-commercial.** The ONNX export's repo name carries the `-nc` (non-commercial)
  suffix, and the export author's own reference implementation states the terms pointer verbatim
  (`kokoro-onnx/examples/hebrew.py`, fetched from GitHub 2026-07-20):

  > "Note: this Hebrew model is licensed for non-commercial use under the terms of
  > https://huggingface.co/avris/kokoro-hebrew-saspeech"

- The same author's closely related Hebrew TTS release (`thewh1teagle/phonikud-tts`, LICENSE
  file, fetched from GitHub 2026-07-20) uses this wording, quoted here as the representative
  form of the family's terms:

  > "License:
  > This dataset/models is licensed under CC BY-NC 4.0, with an additional restriction:
  > It is intended only for academic research and educational use.
  > Commercial use and non-academic non-commercial use are not permitted.
  > For any other use, please contact the dataset/models creators."

- **Maintainer TODO (one-time):** the sandboxed environment this feature was developed in could
  not reach `huggingface.co` (network egress allowlist), so the verbatim text of the
  `avris/kokoro-hebrew-saspeech` model card could not be transcribed here directly. Please open
  <https://huggingface.co/avris/kokoro-hebrew-saspeech> in a browser and paste its license
  section verbatim into this bullet, replacing this TODO. Every source that was reachable
  (above and below) consistently describes the terms as non-commercial with attribution, which
  this site's use satisfies; if the card text turns out to say anything stricter than
  "non-commercial / educational use with attribution," re-run the compliance assessment in §6.

## 3. Voice & training data — the SASPEECH corpus (Shaul Amsterdamski / Kan)

- **Source:** the SASPEECH corpus ("Robo-Shaul"), ~30 hours of speech by journalist
  **Shaul Amsterdamski**, recorded at the Israeli Public Broadcasting Corporation (Kan/IPBC).
  <https://huggingface.co/datasets/upai-inc/saspeech> · <https://www.openslr.org/134/>
- **Terms** (dataset card, verified 2026-07-20 via the Hugging Face search index):

  > "The dataset is free for use for non-commercial purposes. You may not make use of the
  > Dataset for commercial or broadcast needs, for political needs, or in a manner that brings
  > harm to Shaul Amsterdamski and/or the IPBC (Israeli Public Broadcasting Corporation),
  > including defamation. You may not make use of the Dataset in a manner that breaches any
  > applicable law." … "The Dataset is licensed 'AS IS'…"

- **Attribution:** the synthesized voice is the voice of **Shaul Amsterdamski**; the corpus was
  created for the Robo-Shaul project with Kan (IPBC). This credit appears in the in-app
  "Voice credits" modal and each integrated page's footer.

## 4. Interface logic — kokoro-onnx by thewh1teagle

- **Source:** <https://github.com/thewh1teagle/kokoro-onnx>
- **License:** **MIT** (LICENSE fetched from GitHub 2026-07-20; copyright
  "github.com/thewh1teagle (2025)"). Standard MIT terms: use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell, with the license notice preserved.
- Our JavaScript tokenizer and voices-file loader (`tts/tts-worker.js`, `tts/npy.js`) are a
  port of this library's Python logic (token-id lookup, `[0, …ids, 0]` padding, 510-token cap,
  style-row selection by token count, `.npz` voices parsing). No code was copied verbatim; the
  interface behavior mirrors it.

## 5. Phonemization reference — phonikud by thewh1teagle

- **Source:** <https://github.com/thewh1teagle/phonikud>
- **License:** **CC BY 4.0.** The repo states verbatim: "Phonikud G2P (the code in this
  repository) is licensed under CC BY 4.0 (open use)." (Its datasets have separate licenses;
  we use none of them.)
- Our rule-based phonemizer (`tts/phonemizer.js`) was written against phonikud's published
  Modern-Hebrew phoneme inventory (`abdefhijklmnopstuvwzɡʁʃʒʔˈχ`) as the symbol-set reference.
  Credit: **Phonikud G2P by thewh1teagle, CC BY 4.0.**

---

## 6. Compliance assessment (recorded 2026-07-20)

The Hebrew model's non-commercial terms were checked against all of the following, and no
conflict was found:

1. **This site is a free educational tool licensed CC BY-NC-SA 4.0** (see [`LICENSE`](LICENSE)
   and the README). Non-commercial educational use is exactly the permitted zone of the model's
   terms.
2. **No ads, paywalls, donations-for-access, or sales** exist on the pages that use this voice
   (Worksheet Generator, Dictionary, Flash Cards) — and none may be added while this voice is
   in use.
3. **No redistribution of the weights.** The model files are fetched by the user's browser at
   runtime directly from Hugging Face (`huggingface.co/thewh1teagle/kokoro-hebrew-nc`); this
   repository contains no model weights, and this project does not mirror them. Re-hosting the
   weights (or a quantized derivative) on project-controlled infrastructure is **not currently
   authorized** — do not enable the CDN/R2 hosting path documented in
   [`tools/README.md`](tools/README.md) unless the `avris/kokoro-hebrew-saspeech` license text
   is confirmed to permit redistribution (or written permission is obtained from the authors),
   in which case the license text must be included alongside the hosted file.

**Pages using this voice are and must remain non-commercial (no advertising, paywalls, or
sales), per the Hebrew model's license.**
