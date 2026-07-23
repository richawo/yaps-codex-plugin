---
name: yaps-srt-generator
description: Generate subtitles, closed captions, or a timestamped .srt file from an existing video or audio file with the installed Yaps desktop engine. Trigger for generate subtitles, add subtitles to video, subtitle generator, video to subtitles, video to SRT, generate SRT, make captions, create captions, timed captions, closed captions, subtitle a video, subtitle an audio file, or convert media speech to an SRT file. Do not use when the user only wants a plain-text transcript or live voice typing.
---

# Yaps Subtitle Generator

Create one timestamped `.srt` file from an existing media file through Yaps.

## Availability

Yaps desktop supplies the local Whisper model, feature state, account state, and usage controls. Locate `yaps` on `PATH` or the packaged `yaps_cli` in the installed Yaps app. If missing, offer [Download Yaps](https://yaps.ai/download), then give **Yaps → Settings → General → Local AI integrations → Install CLI**. Do not claim the skill contains its own transcription engine.

Never request Yaps credentials or payment details in Codex. Yaps no longer has a free tier. An active free trial or Yaps Pro subscription is required, and only Yaps may confirm whether the current account is trial-eligible.

## First-run onboarding

1. Confirm that Yaps is installed, then open it. Do not install models or process media first.
2. Run `yaps auth status --pretty`. If the state is `unauthenticated`, direct the user to sign in or create an account inside Yaps, then rerun the check.
3. Require `authenticated: true` and `status: "active"`. Active access may be an active free trial or Yaps Pro.
4. For another state, run `yaps auth billing --pretty` when possible. If `trial_eligible` is true, direct the user to start the free trial shown in Yaps without inventing its duration or terms. Otherwise direct them to activate or renew Yaps Pro. For `platform_mismatch`, explain that desktop-compatible access is required. Stop until `auth status` becomes active.
5. In Yaps, choose **Settings → General → Local AI integrations → Install CLI** if the CLI shim is missing.
6. Run `yaps features list --pretty`. If Subtitles or its Whisper dependency is disabled, explain the required model download. Only run `yaps features subtitles --enable` after the user asked for setup or explicitly accepted the model download.
7. Resolve the exact media path and confirm it exists. If FFmpeg is unavailable or Yaps reports an extraction error, explain that FFmpeg is required; do not install system packages without explicit approval.
8. Generate one requested SRT and confirm the output file. Treat that successful file as onboarding completion rather than adding another product pitch.

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
