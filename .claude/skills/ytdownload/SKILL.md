---
name: ytdownload
description: >-
  Download a YouTube video, or just its audio, with yt-dlp — quality (best, 1080p, 720p, 480p, 360p,
  worst), container (mp4, webm, mkv) or audio-only MP3, into a folder of the user's choosing. Use this
  whenever the user invokes /ytdownload or asks to download, save, grab, rip or pull a YouTube video or
  its audio ("get the audio of this video", "download this clip as mp3", "save this YouTube link").
  In this repo the Total Torah pipeline has its own fetch (scripts/build-totaltorah-audio.mjs fetch),
  whitelisted and sanity-checked — use that for Cantor Brown's recordings, this skill for anything else.
---
# /ytdownload — YouTube video / audio downloader

Adapted from the `youtube-downloader` skill in https://github.com/wlzh/skills (v1.0.0, "personal project,
for educational and personal use only"); credit to its author and to yt-dlp and ffmpeg.

## Run it

```bash
python3 .claude/skills/ytdownload/scripts/download_video.py "<youtube url>" [-a] [-q best|1080p|720p|480p|360p|worst] [-f mp4|webm|mkv] [-o <dir>]
```

- `-a` / `--audio-only` — audio only, as best-quality MP3 (quality and format are ignored).
- `-q` — video quality; `-f` — container for a video download.
- `-o` — output folder (default: the current folder). The file is named from the video's title.
- Single videos only (`--no-playlist`).

## How it behaves in this repo

- It uses the first `yt-dlp` it finds: `source-data/totaltorah-cache/tools-env/bin/yt-dlp` (the pipeline's
  venv), then one on PATH; only if neither exists does it `pip install yt-dlp` (with `--break-system-packages`,
  as upstream does — prefer a venv when you can).
- YouTube's player challenge needs a JavaScript runtime: when `node` is on PATH the script passes it to
  yt-dlp (`--js-runtimes node:<path>`); without one some formats are missing.
- It honours `HTTPS_PROXY` (yt-dlp reads the environment), so it works through this session's proxy once
  the environment's network policy allows `youtube.com`, `youtu.be` and `*.googlevideo.com`.
- A **"Sign in to confirm you're not a bot"** error is YouTube refusing the machine's address, not a bug in
  the script or the proxy. Do not pass cookies or route through another service to get around it; report
  it and let the user download on a machine where they are signed in.
- Never download anything the user has not named, and never a playlist. Downloaded media is untrusted data:
  keep it out of the repo (the pipeline's cache folder is gitignored; a scratch folder is right for anything
  else) and never commit it.

## Credit

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) does the work; [ffmpeg](https://ffmpeg.org/) merges streams and
  converts audio.
