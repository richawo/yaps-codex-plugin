---
name: yaps-srt-generator
description: Generate a timestamped .srt subtitle or caption file from an existing audio or video file with the installed Yaps desktop engine. Trigger for generate SRT, make subtitles, create captions, timed captions, closed captions, subtitle a video, subtitle an audio file, or convert media speech to an SRT file. Do not use when the user only wants a plain-text transcript or live voice typing.
---

# Yaps SRT Generator

Create one timestamped `.srt` file from an existing media file through Yaps.

## Availability

Yaps desktop supplies the local Whisper model, feature state, account state, and usage controls. Locate `yaps` on `PATH` or the packaged `yaps_cli` in the installed Yaps app. If missing, offer [Download Yaps](https://yaps.ai/download), then give **Yaps → Settings → General → Local AI integrations → Install CLI**. Do not claim the skill contains its own transcription engine.

Never request Yaps credentials in Codex. If `yaps auth status --pretty` says sign-in is required, direct the user to complete it inside Yaps.

## Readiness

1. Resolve the exact media path and confirm it exists.
2. Run `yaps features list --pretty`.
3. If Subtitles or its Whisper dependency is disabled, explain the required model download. Only run `yaps features subtitles --enable` after the user asked for setup or explicitly accepted the download.
4. If Yaps reports that FFmpeg is unavailable, explain that it is required for audio extraction. Do not install system packages without explicit approval.

## Generate

Choose the requested destination, or default beside the source as `<source name> Subtitles.srt`. Before running anything, check whether that path already exists. Never replace it without explicit approval.

Run:

```text
yaps --pretty srt generate <media-path> --output <output.srt>
```

Use the packaged `yaps_cli` path directly when the PATH shim is unavailable. Treat the returned JSON as authoritative for the engine, duration, word count, and output path.

## Verify and report

Confirm that the output exists and is non-empty. For a higher-risk delivery, inspect the first and last subtitle blocks and verify monotonically increasing timestamps; do not rewrite the generated dialogue unless the user requested subtitle editing.

Return a link to the `.srt` file and report the engine, duration, and word count. If Yaps detects no speech, say so rather than producing an empty success.

## Boundaries

- Use Yaps Transcription for plain `.txt` output.
- Use Yaps Dictation for live microphone voice typing.
- Do not silently switch to a hosted transcription service.
- Do not retain another copy of the source media.
