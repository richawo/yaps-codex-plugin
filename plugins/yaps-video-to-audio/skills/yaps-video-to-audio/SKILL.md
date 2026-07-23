---
name: yaps-video-to-audio
description: Convert a video file to MP3, WAV, or M4A audio with the installed Yaps desktop app. Trigger for video to audio, convert video to MP3, convert video to WAV, convert video to M4A, extract audio from video, save a video's sound, remove the video track, or make an audio-only copy of a video. Do not use when the user wants a transcript, subtitles, or text-to-speech.
---

# Yaps Video to Audio

Create one audio-only file from an existing video through Yaps.

## Availability

Yaps desktop supplies the media workflow, account state, and local CLI. Locate `yaps` on `PATH` or the packaged `yaps_cli` in the installed Yaps app. If it is missing, offer [Download Yaps](https://yaps.ai/download), then give **Yaps → Settings → General → Local AI integrations → Install CLI**.

Never request Yaps credentials or payment details in Codex. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

## First-run onboarding

1. Confirm that Yaps is installed, then open it before processing media.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. For another state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. If the CLI shim is missing, direct the user to **Yaps → Settings → General → Local AI integrations → Install CLI**.
6. Run `ffmpeg -version`. If unavailable, explain that Yaps needs FFmpeg for media conversion and give the platform-specific instruction reported by Yaps. Do not install a system package without explicit approval.
7. Resolve the exact source-video path, format, and output path. Treat one successfully verified audio file as onboarding completion.

## Convert

Default to MP3 unless the user requests WAV or M4A. When no destination is specified, place the output beside the source as `<video name> Audio.<format>`.

Before running anything, check whether the output path already exists. Never replace it without explicit approval; prefer a new filename.

Run:

```text
yaps --pretty media extract-audio <video-path> --format <mp3|wav|m4a> --output <audio-path>
```

Use the packaged `yaps_cli` path directly when the PATH shim is unavailable. If `media extract-audio` is unknown, ask the user to update Yaps and retry rather than bypassing Yaps with a separate converter.

## Verify and report

Treat the returned JSON as authoritative for the source path, output path, format, and bytes written. Confirm the output exists and is non-empty, then return a link to it.

If Yaps reports that the source has no audio stream, say so. Do not manufacture an empty file or silently switch to a hosted conversion service.

## Boundaries

- Use Yaps Transcription for plain-text speech transcription.
- Use Yaps Subtitle Generator for timed SRT captions.
- Use Yaps Text to Speech when the source is text rather than video.
- Do not retain another copy of the source video.
