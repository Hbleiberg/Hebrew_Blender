#!/usr/bin/env python3
"""
YouTube Video Downloader (the /ytdownload skill)
Downloads a video from YouTube with customizable quality and format options, or its audio as MP3.

Adapted from the youtube-downloader skill in https://github.com/wlzh/skills (v1.0.0) for IvritSuite:
the output folder defaults to the current folder, an already-installed yt-dlp (the Total Torah pipeline's
venv, or PATH) is preferred over a pip install, and node is handed to yt-dlp as the JavaScript runtime
YouTube's player challenge needs.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
VENV_YTDLP = os.path.join(REPO_ROOT, 'source-data', 'totaltorah-cache', 'tools-env', 'bin', 'yt-dlp')


def find_yt_dlp():
    """The pipeline's venv copy, then PATH; install only when neither exists."""
    if os.path.exists(VENV_YTDLP):
        return VENV_YTDLP
    found = shutil.which('yt-dlp')
    if found:
        return found
    print("yt-dlp not found. Installing...")
    subprocess.run([sys.executable, "-m", "pip", "install", "--break-system-packages", "yt-dlp"], check=True)
    found = shutil.which('yt-dlp')
    if not found:
        raise FileNotFoundError('yt-dlp is still not on PATH after the install')
    return found


def runtime_args():
    """YouTube's player challenge needs a JavaScript runtime (yt-dlp's EJS); node is one."""
    node = shutil.which('node')
    return ['--js-runtimes', f'node:{node}'] if node else []


def get_video_info(yt_dlp, url):
    """Get information about the video without downloading."""
    result = subprocess.run(
        [yt_dlp, *runtime_args(), "--dump-json", "--no-playlist", url],
        capture_output=True,
        text=True,
        check=True
    )
    return json.loads(result.stdout)


def download_video(url, output_path=".", quality="best", format_type="mp4", audio_only=False):
    """
    Download a YouTube video.

    Args:
        url: YouTube video URL
        output_path: Directory to save the video
        quality: Quality setting (best, 1080p, 720p, 480p, 360p, worst)
        format_type: Output format (mp4, webm, mkv, etc.)
        audio_only: Download only audio (mp3)
    """
    yt_dlp = find_yt_dlp()
    os.makedirs(output_path, exist_ok=True)

    # Build command
    cmd = [yt_dlp, *runtime_args()]

    if audio_only:
        cmd.extend([
            "-x",  # Extract audio
            "--audio-format", "mp3",
            "--audio-quality", "0",  # Best quality
        ])
    else:
        # Video quality settings
        if quality == "best":
            format_string = "bestvideo+bestaudio/best"
        elif quality == "worst":
            format_string = "worstvideo+worstaudio/worst"
        else:
            # Specific resolution (e.g., 1080p, 720p)
            height = quality.replace("p", "")
            format_string = f"bestvideo[height<={height}]+bestaudio/best[height<={height}]"

        cmd.extend([
            "-f", format_string,
            "--merge-output-format", format_type,
        ])

    # Output template
    cmd.extend([
        "-o", os.path.join(output_path, "%(title)s.%(ext)s"),
        "--no-playlist",  # Don't download playlists by default
    ])

    cmd.append(url)

    print(f"Downloading from: {url}")
    print(f"Quality: {quality}")
    print(f"Format: {'mp3 (audio only)' if audio_only else format_type}")
    print(f"Output: {output_path}\n")

    try:
        # Get video info first
        info = get_video_info(yt_dlp, url)
        print(f"Title: {info.get('title', 'Unknown')}")
        print(f"Duration: {info.get('duration', 0) // 60}:{info.get('duration', 0) % 60:02d}")
        print(f"Uploader: {info.get('uploader', 'Unknown')}\n")

        # Download the video
        subprocess.run(cmd, check=True)
        print("\n✅ Download complete!")
        return True
    except subprocess.CalledProcessError as e:
        if e.stderr:
            print(e.stderr.strip())
        print(f"\n❌ Error downloading video: {e}")
        print("   A 'Sign in to confirm you're not a bot' message is YouTube refusing this machine's address — download on a machine where you are signed in instead.")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Download YouTube videos with customizable quality and format"
    )
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument(
        "-o", "--output",
        default=".",
        help="Output directory (default: the current folder)"
    )
    parser.add_argument(
        "-q", "--quality",
        default="best",
        choices=["best", "1080p", "720p", "480p", "360p", "worst"],
        help="Video quality (default: best)"
    )
    parser.add_argument(
        "-f", "--format",
        default="mp4",
        choices=["mp4", "webm", "mkv"],
        help="Video format (default: mp4)"
    )
    parser.add_argument(
        "-a", "--audio-only",
        action="store_true",
        help="Download only audio as MP3"
    )

    args = parser.parse_args()

    success = download_video(
        url=args.url,
        output_path=args.output,
        quality=args.quality,
        format_type=args.format,
        audio_only=args.audio_only
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
